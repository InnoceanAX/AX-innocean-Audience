// campaign-personas.js
// REST routes for AI synthetic persona generation (100 per country, 6 countries).
// Endpoints:
//   GET  /api/personas/presets
//   POST /api/personas/brief
//   POST /api/personas/generate
//   GET  /api/personas/status
//   GET  /api/personas/list
//   GET  /api/personas/insights
//   GET  /api/personas/insights/all
//   POST /api/personas/cancel       (operational convenience)
//   GET  /api/personas/briefs       (list all briefs)

import { Router } from "express";
import { COUNTRIES } from "../data/countries.js";
import { CAMPAIGN_PRESETS } from "../data/campaign-presets.js";
import { buildCohort, SUPPORTED_COUNTRIES } from "../lib/cohort-builder.js";
import { synthesizeNarratives } from "../lib/persona-narrative.js";
import { aggregateAll, buildInsightPayload } from "../lib/persona-aggregator.js";
import {
  saveBrief, getBrief, listBriefs, deleteBrief,
  appendPersonas, setPersonas, getPersonas, countPersonas,
  setInsights, getInsights,
  setGenerationState, getGenerationState, markCancelled,
} from "../lib/persona-store.js";
import { logCampaignCompletion } from "../adapters/bigquery-audience.js";

export const campaignPersonasRouter = Router();

function newId(prefix = "brief") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function resolveCountryName(code) {
  const meta = COUNTRIES.find(c => c.code === code);
  return meta ? meta.nameEn : code;
}

// GET /api/personas/presets
campaignPersonasRouter.get("/presets", (_req, res) => {
  res.json({ ok: true, presets: CAMPAIGN_PRESETS });
});

// GET /api/personas/briefs
campaignPersonasRouter.get("/briefs", (_req, res) => {
  res.json({ ok: true, briefs: listBriefs() });
});

// POST /api/personas/briefs/cleanup
// body: { keep: "brief_id" } — keep 외 모든 brief 삭제 (CEO 2026-06-23: 최종 1개만 보존)
campaignPersonasRouter.post("/briefs/cleanup", (req, res) => {
  const keep = req.body && req.body.keep;
  if (!keep) return res.status(400).json({ ok: false, error: "keep brief_id required" });
  const all = listBriefs();
  const toDelete = all.map(b => b.id || b.brief_id).filter(id => id && id !== keep);
  const results = [];
  for (const id of toDelete) {
    try { results.push(deleteBrief(id)); }
    catch (e) { results.push({ deleted: false, brief_id: id, error: String(e && e.message || e) }); }
  }
  const deletedCount = results.filter(r => r.deleted).length;
  res.json({ ok: true, kept: keep, deleted: deletedCount, total_targets: toDelete.length, results });
});

// DELETE /api/personas/brief/:id — 단일 brief 삭제
campaignPersonasRouter.delete("/brief/:id", (req, res) => {
  const id = req.params.id;
  try {
    const r = deleteBrief(id);
    res.json({ ok: true, ...r });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e && e.message || e) });
  }
});

// POST /api/personas/brief
// body: { brand, name, countries[], targets[], filters, regions? }
campaignPersonasRouter.post("/brief", (req, res) => {
  const {
    brand = "Musinsa",
    name = "Untitled brief",
    countries = [],
    targets = null,
    filters = null,
    regions = null,
    sizePerCountry = 100,
    presetId = null,
  } = req.body || {};

  if (!Array.isArray(countries) || countries.length === 0) {
    return res.status(400).json({ ok: false, error: "countries[] required" });
  }
  const normalized = countries.map(c => String(c).toUpperCase());
  const unsupported = normalized.filter(c => !SUPPORTED_COUNTRIES.includes(c));
  if (unsupported.length) {
    console.warn(`[campaign-personas] brief uses unsupported countries: ${unsupported.join(",")} — will use default demo`);
  }

  const briefId = newId("brief");
  const brief = {
    id: briefId,
    presetId,
    brand,
    name,
    countries: normalized,
    targets,
    filters,
    regions: regions || {},
    sizePerCountry: parseInt(sizePerCountry, 10) || 100,
    createdAt: new Date().toISOString(),
  };
  saveBrief(brief);

  const cohorts = normalized.map(country => ({
    country,
    target100: brief.sizePerCountry,
    regions: (regions && regions[country]) || null,
  }));
  res.json({ ok: true, brief_id: briefId, brief, cohorts });
});

// POST /api/personas/generate  → starts async generation, returns immediately
campaignPersonasRouter.post("/generate", async (req, res) => {
  const { brief_id } = req.body || {};
  if (!brief_id) return res.status(400).json({ ok: false, error: "brief_id required" });
  const brief = getBrief(brief_id);
  if (!brief) return res.status(404).json({ ok: false, error: "brief not found" });

  const existing = getGenerationState(brief_id);
  if (existing?.status === "running") {
    return res.json({ ok: true, status: "running", brief_id, message: "already running" });
  }

  // Initialize state
  const total = brief.countries.length * brief.sizePerCountry;
  setGenerationState(brief_id, {
    status: "running",
    total,
    done: 0,
    byCountry: Object.fromEntries(brief.countries.map(c => [c, 0])),
    cancelled: false,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    error: null,
  });
  // Reset stored personas/insights for re-run
  setPersonas(brief_id, []);
  setInsights(brief_id, null);

  // Kick off async work (fire-and-forget). We do not await.
  runGeneration(brief).catch(e => {
    console.error("[campaign-personas] generation crashed:", e);
    setGenerationState(brief_id, {
      status: "failed",
      finishedAt: new Date().toISOString(),
      error: e.message,
    });
  });

  res.json({ ok: true, status: "running", brief_id });
});

// GET /api/personas/status?brief_id=...
campaignPersonasRouter.get("/status", (req, res) => {
  const { brief_id } = req.query;
  if (!brief_id) return res.status(400).json({ ok: false, error: "brief_id required" });
  const state = getGenerationState(brief_id);
  if (!state) return res.status(404).json({ ok: false, error: "no generation state for brief_id" });
  const brief = getBrief(brief_id);
  res.json({
    ok: true,
    brief_id,
    status: state.status,
    progress: {
      total: state.total,
      done: state.done,
      byCountry: state.byCountry,
      pct: state.total ? Math.round((state.done / state.total) * 100) : 0,
    },
    cancelled: !!state.cancelled,
    startedAt: state.startedAt,
    finishedAt: state.finishedAt,
    error: state.error,
    brief: brief ? { id: brief.id, brand: brief.brand, name: brief.name, countries: brief.countries } : null,
  });
});

// POST /api/personas/cancel
campaignPersonasRouter.post("/cancel", (req, res) => {
  const { brief_id } = req.body || {};
  if (!brief_id) return res.status(400).json({ ok: false, error: "brief_id required" });
  const ok = markCancelled(brief_id);
  res.json({ ok, brief_id });
});

// GET /api/personas/list?brief_id=...&country=...&limit=100
campaignPersonasRouter.get("/list", (req, res) => {
  const { brief_id, country, limit } = req.query;
  if (!brief_id) return res.status(400).json({ ok: false, error: "brief_id required" });
  const personas = getPersonas(brief_id, {
    country: country ? String(country).toUpperCase() : null,
    limit: limit ? parseInt(limit, 10) : null,
  });
  res.json({ ok: true, brief_id, count: personas.length, personas });
});

// GET /api/personas/insights?brief_id=...&country=...&tab=who|life|mind|love|buy|media
campaignPersonasRouter.get("/insights", (req, res) => {
  const { brief_id, country, tab } = req.query;
  if (!brief_id) return res.status(400).json({ ok: false, error: "brief_id required" });
  const tabId = String(tab || "").toLowerCase();
  const validTabs = ["who", "life", "mind", "love", "buy", "media"];
  if (!validTabs.includes(tabId)) {
    return res.status(400).json({ ok: false, error: `tab must be one of ${validTabs.join("|")}` });
  }

  // Prefer cached insights from store; fall back to on-the-fly aggregation.
  const cached = getInsights(brief_id);
  if (cached) {
    if (country) {
      const cc = String(country).toUpperCase();
      const tabData = cached.byCountry?.[cc]?.[tabId];
      if (!tabData) return res.status(404).json({ ok: false, error: "no insight for that country/tab" });
      return res.json({ ok: true, brief_id, country: cc, tab: tabId, data: tabData });
    }
    return res.json({ ok: true, brief_id, country: null, tab: tabId, data: cached.byTab?.[tabId] || null });
  }
  // On-the-fly fallback
  const list = country
    ? getPersonas(brief_id, { country: String(country).toUpperCase() })
    : getPersonas(brief_id);
  if (!list.length) return res.status(404).json({ ok: false, error: "no personas yet" });
  const agg = aggregateAll(list);
  res.json({ ok: true, brief_id, country: country || null, tab: tabId, data: agg[tabId] });
});

// GET /api/personas/insights/all?brief_id=...
campaignPersonasRouter.get("/insights/all", (req, res) => {
  const { brief_id } = req.query;
  if (!brief_id) return res.status(400).json({ ok: false, error: "brief_id required" });
  const cached = getInsights(brief_id);
  if (cached) return res.json({ ok: true, brief_id, ...cached });
  const all = getPersonas(brief_id);
  if (!all.length) return res.status(404).json({ ok: false, error: "no personas yet" });
  const payload = buildInsightPayload(all);
  res.json({ ok: true, brief_id, ...payload });
});

// CEO 2026-06-18 20:00 지시: 영속성 재발 방지 — 관리 용 force backup
// 목적: 풀 v2 (600명) GCS 영속화 → hardening 배포 전 백업
campaignPersonasRouter.post("/admin/force-backup", async (req, res) => {
  try {
    const { forceDbUpload } = await import("../lib/persona-gcs.js");
    const ok = await forceDbUpload("admin-endpoint");
    res.json({ ok, message: ok ? "GCS upload completed" : "GCS upload skipped or failed" });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ───────────────────────────────────────────────
// Background generation orchestrator
// ───────────────────────────────────────────────
async function runGeneration(brief) {
  const briefId = brief.id;
  const generationStartTs = Date.now();
  console.log(`[campaign-personas] starting generation for brief ${briefId} (${brief.countries.length} countries × ${brief.sizePerCountry})`);

  const shouldCancel = () => !!(getGenerationState(briefId)?.cancelled);

  for (const country of brief.countries) {
    if (shouldCancel()) {
      console.log(`[campaign-personas] cancelled before ${country}`);
      break;
    }
    const countryName = resolveCountryName(country);
    const regionOverride = brief.regions?.[country] || null;

    // Stage 1: cohort
    // M-9 fix (2026-06-17 21:48): brief.targets 적용 (ageBuckets/gender 화이트리스트/오버라이드)
    const cohort = buildCohort({
      country,
      size: brief.sizePerCountry,
      seed: `${briefId}:${country}`,
      regions: regionOverride,
      targets: brief.targets || null,
      briefId, // PK Hotfix (CEO 2026-06-26): brief-scoped persona_id
    });
    console.log(`[campaign-personas] ${country}: cohort built (${cohort.length})`);

    // Stage 2: narrative
    // CEO 2026-06-18 21:34 긴급: batch/concurrency 낮춤 — Vertex AI rate limit 완화
    // CEO 2026-06-18 22:30 긴급: batch 단위 DB commit + GCS force upload → SIGTERM 휠발 방지
    // CEO 2026-06-23: 실측 결과 batch/concurrency 튜닝 단축 효과 없음(병목=Gemini 배치당 ~90초).
    // 프리셋 캐시(기존 완성 풀 재사용)로 시연 즉시성 해결 → 생성 설정은 안정값(batch10/conc2) 유지
    let { forceDbUpload } = await import("../lib/persona-gcs.js");
    const merged = await synthesizeNarratives(cohort, {
      brand: brief.brand,
      country,
      countryName,
      batchSize: 10,
      concurrency: 2,
      shouldCancel,
      onBatchDone: (doneInCountry, totalInCountry) => {
        const state = getGenerationState(briefId) || {};
        const byCountry = { ...(state.byCountry || {}) };
        byCountry[country] = doneInCountry;
        const done = Object.values(byCountry).reduce((s, n) => s + n, 0);
        setGenerationState(briefId, { byCountry, done });
      },
      onBatchPersist: async (batchMerged, meta) => {
        // batch 끝날 때마다 DB 즉시 저장 + GCS upload → SIGTERM 시점에도 존재한 batch는 보존
        try {
          appendPersonas(briefId, batchMerged);
          // GCS upload는 매번 하지 않고 batch 5개마다 (rate limit 완화)
          if (meta.batchIdx % 5 === 4 || meta.batchIdx === meta.batchCount - 1) {
            await forceDbUpload(`batch-${country}-${meta.batchIdx + 1}/${meta.batchCount}`);
          }
        } catch (e) {
          console.warn(`[campaign-personas] batch persist failed (${country}, batch ${meta.batchIdx}): ${e.message}`);
        }
      },
    });

    // appendPersonas 이미 onBatchPersist에서 호출됨 — 중복 방지 위해 skip
    // appendPersonas(briefId, merged);

    // Mark this country as fully done (even if a batch fell back)
    const state = getGenerationState(briefId) || {};
    const byCountry = { ...(state.byCountry || {}) };
    byCountry[country] = brief.sizePerCountry;
    const done = Object.values(byCountry).reduce((s, n) => s + n, 0);
    setGenerationState(briefId, { byCountry, done });
    console.log(`[campaign-personas] ${country}: completed`);
  }

  // Stage 3: aggregate
  const all = getPersonas(briefId);
  console.log(`[campaign-personas] ${briefId}: aggregating ${all.length} personas into insights`);
  const payload = buildInsightPayload(all);
  setInsights(briefId, payload);

  const finalState = shouldCancel() ? "cancelled" : "completed";
  const finishedAt = new Date().toISOString();
  setGenerationState(briefId, {
    status: finalState,
    finishedAt,
  });
  console.log(`[campaign-personas] ${briefId}: ${finalState} (${all.length} personas)`);

  // Fire-and-forget cold analytics sink.
  if (finalState === "completed") {
    logCampaignCompletion({
      briefId,
      brand: brief.brand,
      name: brief.name,
      countries: brief.countries,
      totalPersonas: all.length,
      generationDurationMs: Date.now() - generationStartTs,
      geminiCostUsd: null,
      completedAt: finishedAt,
    }).catch(() => {});
  }
}
