// persona-badge.js
// Compute the small AUDIENCE indigo badge shown on each tab.
//
// Modes:
//   - "persona-pool"  → "AI 합성 페르소나 100명 기준 · 한국"
//                       "AI 합성 페르소나 200명 기준 · 한국 100명 · 일본 100명"
//                       "AI 합성 페르소나 600명 기준 · 6개국 각 100명"
//   - "generating"    → "AI 합성 페르소나 생성 중 (100명 · 한국)..."
//   - "public-data"   → "공개 데이터 베이스라인 · 한국"
//
// Returned shape (stable, consumed by frontend):
//   { mode, totalPersonas, countries: [{ code, name, count }], label }
//
// Country names use COUNTRIES (data/countries.js) Korean labels when available.

import { COUNTRIES } from "../data/countries.js";

function koName(code) {
  if (!code) return "";
  const meta = COUNTRIES.find(c => c.code === String(code).toUpperCase());
  return meta?.name || String(code).toUpperCase();
}

/**
 * Build a persona-pool badge.
 *
 * @param {Array<{code:string,count:number}>} byCountry single or multi country
 *        breakdown. For single country pass [{code:"KR",count:100}].
 * @returns {object} badge object
 */
export function buildPersonaPoolBadge(byCountry) {
  const list = Array.isArray(byCountry) ? byCountry : [];
  const countries = list
    .filter(x => x && x.code)
    .map(x => ({ code: String(x.code).toUpperCase(), name: koName(x.code), count: Number(x.count) || 0 }));
  const totalPersonas = countries.reduce((s, c) => s + c.count, 0);

  let label;
  if (countries.length === 0) {
    label = "AI 합성 페르소나";
  } else if (countries.length === 1) {
    label = `AI 합성 페르소나 ${totalPersonas}명 기준 · ${countries[0].name}`;
  } else if (countries.length >= 6) {
    // Global ≥6 countries → compact label
    const per = countries[0].count;
    const allSame = countries.every(c => c.count === per);
    label = allSame
      ? `AI 합성 페르소나 ${totalPersonas}명 기준 · ${countries.length}개국 각 ${per}명`
      : `AI 합성 페르소나 ${totalPersonas}명 기준 · ${countries.length}개국 합계`;
  } else {
    // 2~5 country comparison
    const detail = countries.map(c => `${c.name} ${c.count}명`).join(" · ");
    label = `AI 합성 페르소나 ${totalPersonas}명 기준 · ${detail}`;
  }
  return { mode: "persona-pool", totalPersonas, countries, label };
}

/**
 * Generating badge (personas are being built in background).
 */
export function buildGeneratingBadge(country, size = 100) {
  const code = country ? String(country).toUpperCase() : null;
  const name = code ? koName(code) : "전체";
  return {
    mode: "generating",
    totalPersonas: 0,
    countries: code ? [{ code, name, count: 0 }] : [],
    label: `AI 합성 페르소나 생성 중 (${size}명 · ${name})...`,
  };
}

/**
 * Fallback public-data badge for backwards compatible callers.
 */
export function buildPublicDataBadge(country) {
  const code = country ? String(country).toUpperCase() : null;
  const name = code ? koName(code) : "전체";
  return {
    mode: "public-data",
    totalPersonas: 0,
    countries: code ? [{ code, name, count: 0 }] : [],
    label: code ? `공개 데이터 베이스라인 · ${name}` : "공개 데이터 베이스라인",
  };
}
