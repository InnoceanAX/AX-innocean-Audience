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
  });

  const merged = await synthesizeNarratives(cohort, {
    brand: brief.brand,
    country,
    countryName: resolveCountryName(country),
    batchSize: 20,
    concurrency: 5,
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

  // Mark country done.
  const s = getGenerationState(briefId) || {};
  const byCountry = { ...(s.byCountry || {}) };
  byCountry[country] = sizePerCountry;
  const done = Object.values(byCountry).reduce((sum, n) => sum + n, 0);
  setGenerationState(briefId, { byCountry, done });

  // Rebuild insights snapshot from all personas in store for the brief.
  const all = await Promise.resolve(getPersonas(briefId));
  const payload = buildInsightPayload(all);
  setInsights(briefId, payload);

  const finishedAt = new Date().toISOString();
  setGenerationState(briefId, {
    status: "completed",
    finishedAt,
  });
  console.log(`[persona-ensure] ${briefId}/${country}: completed (${merged.length})`);

  // Fire-and-forget per-country analytics sink.
  logPersonaBatch({
    briefId,
    country,
    count: merged.length,
    completedAt: finishedAt,
  }).catch(() => {});
}
