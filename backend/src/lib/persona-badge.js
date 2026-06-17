// persona-badge.js
// AUDIENCE source badge (CEO 2026-06-17 최종 확정).
//
// 데이터 모델:
//   ENDGOAL = AI 합성 소비자 페르소나
//      ↑ 학습 입력
//   공개 통계 데이터 (World Bank · Statista AMO · DataReportal · Reuters 등)
//
// → 모든 응답의 최종 답은 "AI 합성 소비자 페르소나"
// → 그 페르소나가 무엇을 학습했냐 = 탭별 Stage 1/2 출처
// → 페르소나가 합성되지 않은 국가는 공개 통계만 보여주고 CTA로 캠페인 빌더 유도
//
// Modes:
//   - "persona-pool"      → 페르소나 합성된 국가
//   - "public-data-only"  → 페르소나 안 합성된 국가 (CTA 표시)
//   - "generating"        → persona-pool 의 진행 상태
//
// Returned shape (stable):
//   {
//     mode, icon, label, detail,
//     totalPersonas, countries:[{code,name,count}],
//     count, country, countryCode,
//     briefId?, tab?,
//     cta?: { text, action },
//     sourceModal: { ... }   // 모든 모드에 동일 (출처 ▾ 모달 데이터)
//   }

import { COUNTRIES } from "../data/countries.js";
import { PUBLIC_DATA_SOURCES, SYNTHETIC_CONSUMER_MODEL, TAB_USAGE } from "./data-sources.js";

function koName(code) {
  if (!code) return "";
  const meta = COUNTRIES.find(c => c.code === String(code).toUpperCase());
  return meta?.name || String(code).toUpperCase();
}

// ───────────────────────────────────────────────────────────────────
// 탭별 detail (Case 1, persona-pool) — CEO 2026-06-17 최종
// ───────────────────────────────────────────────────────────────────
// 단일 출처: data-sources.TAB_USAGE
const TAB_DETAIL_PERSONA_POOL = TAB_USAGE;
const DEFAULT_DETAIL_PERSONA_POOL =
  "Stage 1 인구통계 시드 + Stage 2 narrative 태그";

const DETAIL_PUBLIC_DATA_ONLY =
  "이 국가는 아직 AI 합성 페르소나가 없습니다";

const PUBLIC_DATA_CTA = {
  text: "캠페인 생성하기",
  action: "openCampaignBuilder",
};

const ICON_PERSONA = "🧠";
const ICON_PUBLIC = "📊";

// ───────────────────────────────────────────────────────────────────
// 출처 모달 — 적용 중인 것만 (적용 예정 항목 ❌, CEO 명시)
// ───────────────────────────────────────────────────────────────────
const SOURCE_MODAL = {
  title: "데이터 출처 · AI 합성 페르소나 학습 소스",
  sections: [
    {
      heading: "학습된 공개 데이터",
      items: PUBLIC_DATA_SOURCES.map(s => ({ name: s.name, note: s.coverage })),
    },
    {
      heading: "AI 합성 소비자 모델",
      items: [
        { name: SYNTHETIC_CONSUMER_MODEL.stage1.label, note: SYNTHETIC_CONSUMER_MODEL.stage1.name },
        { name: SYNTHETIC_CONSUMER_MODEL.stage2.label, note: SYNTHETIC_CONSUMER_MODEL.stage2.name },
        { name: SYNTHETIC_CONSUMER_MODEL.stage3.label, note: SYNTHETIC_CONSUMER_MODEL.stage3.name },
      ],
    },
    {
      heading: "탭별 사용 데이터",
      items: [
        { name: "WHO",   note: TAB_DETAIL_PERSONA_POOL.who },
        { name: "LIFE",  note: TAB_DETAIL_PERSONA_POOL.life },
        { name: "MIND",  note: TAB_DETAIL_PERSONA_POOL.mind },
        { name: "LOVE",  note: TAB_DETAIL_PERSONA_POOL.love },
        { name: "BUY",   note: TAB_DETAIL_PERSONA_POOL.buy },
        { name: "MEDIA", note: TAB_DETAIL_PERSONA_POOL.media },
      ],
    },
  ],
};

function pickPersonaPoolDetail(tab) {
  if (tab && TAB_DETAIL_PERSONA_POOL[tab]) return TAB_DETAIL_PERSONA_POOL[tab];
  return DEFAULT_DETAIL_PERSONA_POOL;
}

// ───────────────────────────────────────────────────────────────────
// Case 1: persona-pool
// ───────────────────────────────────────────────────────────────────
/**
 * @param {Array<{code:string,count:number}>} byCountry
 * @param {object} [opts] { tab?, briefId? }
 */
export function buildPersonaPoolBadge(byCountry, opts = {}) {
  const { tab, briefId } = opts || {};
  const list = Array.isArray(byCountry) ? byCountry : [];
  const countries = list
    .filter(x => x && x.code)
    .map(x => ({
      code: String(x.code).toUpperCase(),
      name: koName(x.code),
      count: Number(x.count) || 0,
    }));
  const totalPersonas = countries.reduce((s, c) => s + c.count, 0);

  let label;
  let singleCountry = null;
  let singleCode = null;
  let singleCount = null;

  if (countries.length === 0) {
    label = "공개 데이터를 학습한 AI 합성 소비자 페르소나 통계";
  } else if (countries.length === 1) {
    singleCountry = countries[0].name;
    singleCode = countries[0].code;
    singleCount = totalPersonas;
    label = `공개 데이터를 학습한 AI 합성 소비자 페르소나 통계 · ${countries[0].name} ${totalPersonas}명`;
  } else if (countries.length >= 6) {
    const per = countries[0].count;
    const allSame = countries.every(c => c.count === per);
    label = allSame
      ? `공개 데이터를 학습한 AI 합성 소비자 페르소나 통계 · ${countries.length}개국 각 ${per}명 (총 ${totalPersonas}명)`
      : `공개 데이터를 학습한 AI 합성 소비자 페르소나 통계 · ${countries.length}개국 (총 ${totalPersonas}명)`;
  } else {
    const detail = countries.map(c => `${c.name} ${c.count}명`).join(" · ");
    label = `공개 데이터를 학습한 AI 합성 소비자 페르소나 통계 · ${detail}`;
  }

  return {
    mode: "persona-pool",
    icon: ICON_PERSONA,
    totalPersonas,
    countries,
    label,
    detail: pickPersonaPoolDetail(tab),
    count: singleCount,
    country: singleCountry,
    countryCode: singleCode,
    briefId: briefId || undefined,
    tab: tab || undefined,
    sourceModal: SOURCE_MODAL,
  };
}

// ───────────────────────────────────────────────────────────────────
// Generating (progress sub-state of persona-pool)
// ───────────────────────────────────────────────────────────────────
export function buildGeneratingBadge(country, size = 100, opts = {}) {
  const { tab, briefId, progress } = opts || {};
  const code = country ? String(country).toUpperCase() : null;
  const name = code ? koName(code) : "전체";
  const have = Number.isFinite(progress) ? progress : 0;
  return {
    mode: "generating",
    icon: ICON_PERSONA,
    totalPersonas: 0,
    countries: code ? [{ code, name, count: 0 }] : [],
    label: `AI 합성 페르소나 생성 중 · ${name}`,
    detail: `${have}/${size}명 진행`,
    count: have,
    country: name,
    countryCode: code,
    briefId: briefId || undefined,
    tab: tab || undefined,
    sourceModal: SOURCE_MODAL,
  };
}

// ───────────────────────────────────────────────────────────────────
// Case 2: public-data-only
// ───────────────────────────────────────────────────────────────────
export function buildPublicDataBadge(country, opts = {}) {
  const { tab, briefId } = opts || {};
  const code = country ? String(country).toUpperCase() : null;
  const name = code ? koName(code) : "전체";
  return {
    mode: "public-data-only",
    icon: ICON_PUBLIC,
    totalPersonas: 0,
    countries: code ? [{ code, name, count: 0 }] : [],
    label: code ? `공개 통계 데이터 기반 · ${name}` : "공개 통계 데이터 기반",
    detail: DETAIL_PUBLIC_DATA_ONLY,
    count: null,
    country: name,
    countryCode: code,
    briefId: briefId || undefined,
    tab: tab || undefined,
    cta: { ...PUBLIC_DATA_CTA },
    sourceModal: SOURCE_MODAL,
  };
}

// 외부에 모달 데이터 노출 (프론트가 직접 모달 그릴 때 fallback)
export { SOURCE_MODAL, TAB_DETAIL_PERSONA_POOL };
