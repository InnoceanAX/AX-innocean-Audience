// media.js — 매체별 도달률·신뢰도 (Media 탭 데이터)
// 데이터 소스: World Bank 지표(인터넷 사용률·모바일 가입·도시화율·GDP)
//            + 매체별 베이스라인 도달 함수 + 국가별 보정
// 향후 사내 InnoceanData·Statista·Talkwalker 라이선스 들어오면 어댑터 교체.

import { Router } from "express";
import { COUNTRIES } from "../data/countries.js";
import { getCountryStats } from "../adapters/worldbank.js";

export const mediaRouter = Router();

// 매체 카탈로그 (12개 — 디지털 + 전통 + OTT/Social)
const MEDIA = [
  // 디지털 핵심
  { id: "tv",          label: "TV",                 group: "전통",        baselineReach: 75, internetWeight: 0,   trustBase: 65 },
  { id: "radio",       label: "라디오",             group: "전통",        baselineReach: 35, internetWeight: 0,   trustBase: 60 },
  { id: "print",       label: "신문·잡지",          group: "전통",        baselineReach: 22, internetWeight: 0,   trustBase: 70 },
  { id: "ooh",         label: "옥외광고 (OOH)",     group: "전통",        baselineReach: 65, internetWeight: 0,   trustBase: 55 },
  // 디지털
  { id: "youtube",     label: "YouTube",            group: "디지털",      baselineReach: 60, internetWeight: 1.0, trustBase: 62 },
  { id: "instagram",   label: "Instagram",          group: "소셜",        baselineReach: 38, internetWeight: 1.0, trustBase: 50 },
  { id: "facebook",    label: "Facebook",           group: "소셜",        baselineReach: 35, internetWeight: 1.0, trustBase: 45 },
  { id: "tiktok",      label: "TikTok",             group: "소셜",        baselineReach: 28, internetWeight: 1.1, trustBase: 42 },
  { id: "x",           label: "X (Twitter)",        group: "소셜",        baselineReach: 18, internetWeight: 0.9, trustBase: 40 },
  { id: "linkedin",    label: "LinkedIn",           group: "소셜",        baselineReach: 12, internetWeight: 0.8, trustBase: 58 },
  // 스트리밍
  { id: "netflix",     label: "Netflix",            group: "스트리밍",    baselineReach: 30, internetWeight: 1.0, trustBase: 55 },
  { id: "google_search", label: "Google 검색",      group: "디지털",      baselineReach: 70, internetWeight: 1.0, trustBase: 70 },
];

// 국가별 매체 가중치 (특수 시장)
const COUNTRY_OVERRIDES = {
  CN: { youtube: 0, instagram: 0, facebook: 0, tiktok: 1.4, x: 0, netflix: 0, google_search: 0 },  // 중국 본토 차단
  RU: { instagram: 0.3, facebook: 0.3, x: 0.4 },  // 러시아 제한
  KR: { tiktok: 0.8, x: 0.7, facebook: 0.6, instagram: 1.1, youtube: 1.2 },  // 카카오/네이버 우세
  JP: { x: 1.4, tiktok: 1.1, linkedin: 0.4 },     // 트위터 강세
  IN: { youtube: 1.3, tiktok: 0.2, facebook: 1.2 }, // 유튜브 폭발 / TikTok 금지
  US: { facebook: 1.1, tiktok: 1.0, x: 1.1 },
};

// 매체별 도달률 계산
function computeReach(media, country, ind) {
  let reach = media.baselineReach;
  // 인터넷 의존 매체: 침투율 비례
  if (media.internetWeight > 0 && ind.internetUsers) {
    const ratio = ind.internetUsers / 80;  // 80% 기준
    reach = reach * Math.pow(ratio, media.internetWeight);
  }
  // 도시화 보정 (TV·OOH는 도시화 영향)
  if (media.id === "ooh" && ind.urbanPop) {
    reach *= ind.urbanPop / 75;
  }
  // 국가별 오버라이드
  const override = COUNTRY_OVERRIDES[country]?.[media.id];
  if (override !== undefined) reach *= override;
  // 클램프
  return Math.max(0, Math.min(95, Number(reach.toFixed(1))));
}

// 신뢰도 계산 (도달과는 다른 메트릭)
function computeTrust(media, country, ind) {
  let trust = media.trustBase;
  // GDP per capita 높은 국가는 소셜 신뢰도 낮음 (가짜뉴스 우려)
  if (ind.gdpPerCapita && (media.group === "소셜")) {
    const adj = ind.gdpPerCapita > 30000 ? -5 : 0;
    trust += adj;
  }
  // 전통 매체는 GDP 높은 국가에서 신뢰도 ↑
  if (media.group === "전통" && ind.gdpPerCapita > 40000) trust += 4;
  return Math.max(20, Math.min(85, Math.round(trust)));
}

// CPM 추정 (USD, 매체별 베이스라인 × GDP 보정)
const CPM_BASE = {
  tv: 15, radio: 3, print: 8, ooh: 5,
  youtube: 10, instagram: 8, facebook: 6, tiktok: 7, x: 5, linkedin: 18,
  netflix: 22, google_search: 12,
};
function computeCPM(media, ind) {
  const base = CPM_BASE[media.id] || 5;
  const gdpAdj = ind.gdpPerCapita ? Math.pow(ind.gdpPerCapita / 30000, 0.6) : 1;
  return Math.round(base * gdpAdj * 100) / 100;
}

// GET /api/media/landscape?country=KR
mediaRouter.get("/landscape", async (req, res) => {
  const code = String(req.query.country || "KR").toUpperCase();
  const meta = COUNTRIES.find(c => c.code === code);
  if (!meta) return res.status(400).json({ ok: false, error: "Unknown country" });

  const wb = await getCountryStats(code);
  const ind = wb?.indicators || {};
  const indFlat = {
    internetUsers: ind.internetUsers?.value,
    urbanPop: ind.urbanPop?.value,
    gdpPerCapita: ind.gdpPerCapita?.value,
    mobileSubs: ind.mobileSubs?.value,
  };

  const items = MEDIA.map(m => {
    const reach = computeReach(m, code, indFlat);
    const trust = computeTrust(m, code, indFlat);
    const cpm = computeCPM(m, indFlat);
    return {
      id: m.id,
      label: m.label,
      group: m.group,
      reach,                  // % of adults
      trust,                  // 0~100 점수
      cpm,                    // USD
      effIndex: Number((reach * trust / cpm).toFixed(1)),  // 효율 인덱스
    };
  }).sort((a, b) => b.reach - a.reach);

  // 자동 인사이트
  const insights = [];
  const topReach = items[0];
  insights.push({
    type: "top-reach",
    title: "최대 도달 매체",
    text: `${topReach.label} — 성인 인구의 ${topReach.reach}% 도달 (신뢰도 ${topReach.trust}점)`,
  });
  const topEff = [...items].sort((a, b) => b.effIndex - a.effIndex)[0];
  insights.push({
    type: "top-eff",
    title: "효율 1위",
    text: `${topEff.label} — 효율 인덱스 ${topEff.effIndex} (도달 × 신뢰 / CPM)`,
  });
  const blocked = items.filter(i => i.reach === 0);
  if (blocked.length > 0) {
    insights.push({
      type: "blocked",
      title: `${meta.name}에서 차단·제한된 매체`,
      text: blocked.map(b => b.label).join(", "),
    });
  }

  res.json({
    ok: true,
    country: meta,
    items,
    insights,
    chart: {
      labels: items.map(i => i.label),
      reach: items.map(i => i.reach),
      trust: items.map(i => i.trust),
      cpm: items.map(i => i.cpm),
    },
    meta: {
      method: "World Bank 지표 + 매체 베이스라인 모델 (실 패널 데이터 교체 예정)",
      generatedAt: new Date().toISOString(),
      partial: !!meta.trendsUnavailable,
    },
  });
});
