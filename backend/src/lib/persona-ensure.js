// persona-ensure.js
// Lazily ensure a persona pool exists for (briefId, country).
//
// Behavior:
//   - If personas for that country already exist → return { ready: true, count }.
//   - If a generation is already running for this brief → return { generating: true }.
//   - Otherwise kick off an async background generation for THAT ONE country
//     (fire-and-forget) and return { generating: true, briefId, country }.
//
// The 6-tab routes call this whenever they receive a briefId but the persona
// pool for the requested country is empty, so the analyzer experience feels
// instant: the first call triggers generation, subsequent calls watch progress
// via /api/personas/status?brief_id=...
//
// This module is intentionally additive — it does NOT replace
// POST /api/personas/generate, which still handles full multi-country runs.

import { buildCohort } from "./cohort-builder.js";
import { synthesizeNarratives } from "./persona-narrative.js";
import { aggregateAll, buildInsightPayload } from "./persona-aggregator.js";
import {
  getBrief,
  getPersonas,
  countPersonas,
  appendPersonas,
  getGenerationState,
  setGenerationState,
  getInsights,
  setInsights,
} from "./persona-store.js";
import { logPersonaBatch } from "../adapters/bigquery-audience.js";
import { COUNTRIES } from "../data/countries.js";

function resolveCountryName(code) {
  const meta = COUNTRIES.find(c => c.code === code);
  return meta ? meta.nameEn : code;
}

/**
 * Count personas for a specific (briefId, country) pair.
 */
export function countPersonasForCountry(briefId, country) {
  const cc = String(country || "").toUpperCase();
  if (!cc) return 0;
  const list = getPersonas(briefId, { country: cc });
  return list.length;
}

/**
 * Ensure personas exist for (briefId, country). Single-country, fire-and-forget.
 *
 * @param {string} briefId
 * @param {string} country (ISO-2)
 * @param {number} sizePerCountry default 100
 * @returns {Promise<{ready:boolean, generating:boolean, briefId:string, country:string, count:number}>}
 */
export async function ensurePersonas(briefId, country, sizePerCountry = 100) {
  const cc = String(country || "").toUpperCase();
  if (!briefId || !cc) {
    return { ready: false, generating: false, briefId, country: cc, count: 0, error: "missing briefId or country" };
  }
  const brief = getBrief(briefId);
  if (!brief) {
    return { ready: false, generating: false, briefId, country: cc, count: 0, error: "brief not found" };
  }

  const existingCount = countPersonasForCountry(briefId, cc);
  if (existingCount >= sizePerCountry) {
    return { ready: true, generating: false, briefId, country: cc, count: existingCount };
  }

  const state = getGenerationState(briefId);
  if (state?.status === "running") {
    // Already generating something for this brief; respect it.
    return { ready: false, generating: true, briefId, country: cc, count: existingCount };
  }

  // Init / merge generation state to "running" for just this country.
  const total = (state?.total || 0) + (sizePerCountry - existingCount);
  const byCountry = { ...(state?.byCountry || {}) };
  if (byCountry[cc] == null) byCountry[cc] = existingCount;
  setGenerationState(briefId, {
    status: "running",
    total: total || sizePerCountry,
    done: state?.done || 0,
    byCountry,
    cancelled: false,
    startedAt: state?.startedAt || new Date().toISOString(),
    finishedAt: null,
    error: null,
  });

  // Fire-and-forget single-country generation.
  generateForCountry(brief, cc, sizePerCountry).catch(e => {
    console.error("[persona-ensure] generation crashed:", e);
    setGenerationState(briefId, {
      status: "failed",
      finishedAt: new Date().toISOString(),
      error: e.message,
    });
  });

  return { ready: false, generating: true, briefId, country: cc, count: existingCount };
}

async function generateForCountry(brief, country, sizePerCountry) {
  const briefId = brief.id;
  console.log(`[persona-ensure] starting single-country generation: ${briefId} / ${country}`);

  // M-9 fix (2026-06-17 21:48): brief.targets 적용
  const cohort = buildCohort({
    country,
    size: sizePerCountry,
    seed: `${briefId}:${country}`,
    regions: brief.regions?.[country] || null,
    targets: brief.targets || null,
    briefId, // PK Hotfix (CEO 2026-06-26): brief-scoped persona_id
  });

  const merged = await synthesizeNarratives(cohort, {
    brand: brief.brand,
    country,
    countryName: resolveCountryName(country),
    batchSize: 20,
    // CEO 2026-06-26: Vertex AI 429 과부하 방지 — 동시성 5→3 (연속 재생성 시 rate-limit 완화)
    concurrency: 3,
    shouldCancel: () => !!(getGenerationState(briefId)?.cancelled),
    onBatchDone: (doneInCountry, totalInCountry) => {
      const s = getGenerationState(briefId) || {};
      const byCountry = { ...(s.byCountry || {}) };
      byCountry[country] = doneInCountry;
      const done = Object.values(byCountry).reduce((sum, n) => sum + n, 0);
      setGenerationState(briefId, { byCountry, done });
    },
  });

  appendPersonas(briefId, merged);

  // Mark country done — CEO 2026-06-26: state.done 정직화.
  //   기존엔 byCountry[country]=sizePerCountry로 강제 → 부분 생성(merged.length<size)이어도
  //   "100/100 완료"로 거짓 보고됨. 실제 적재된 merged.length만 기록.
  const s = getGenerationState(briefId) || {};
  const byCountry = { ...(s.byCountry || {}) };
  byCountry[country] = merged.length;
  const done = Object.values(byCountry).reduce((sum, n) => sum + n, 0);
  setGenerationState(briefId, { byCountry, done });

  // Rebuild insights snapshot from all personas in store for the brief.
  const all = await Promise.resolve(getPersonas(briefId));
  const payload = buildInsightPayload(all);
  setInsights(briefId, payload);

  // CEO 2026-06-26: 부분 생성 시 status를 partial로 — 화면이 "완료"라고 거짓말 안 하게.
  //   merged.length < sizePerCountry면 Vertex 일부 배치 실패로 부족분 발생.
  //   partial이면 caller(maybePersonaPoolPayload)가 generating 유지 → 부족분 재시도 가능.
  const finishedAt = new Date().toISOString();
  const isPartial = merged.length < sizePerCountry;
  setGenerationState(briefId, {
    status: isPartial ? "partial" : "completed",
    generatedCount: merged.length,
    requestedCount: sizePerCountry,
    finishedAt,
  });
  console.log(`[persona-ensure] ${briefId}/${country}: ${isPartial ? "PARTIAL" : "completed"} (${merged.length}/${sizePerCountry})`);

  // CEO 2026-06-18 20:11 지시: country 완료 즉시 force upload
  // (debounce 우회 — 다음 country 시작 전 GCS 영속화)
  try {
    const { forceDbUpload } = await import("./persona-gcs.js");
    forceDbUpload(`country-completed:${briefId}/${country}`).catch(() => {});
  } catch (e) { console.warn(`[persona-ensure] force upload failed: ${e.message}`); }

  // Fire-and-forget per-country analytics sink.
  logPersonaBatch({
    briefId,
    country,
    count: merged.length,
    completedAt: finishedAt,
  }).catch(() => {});
}
