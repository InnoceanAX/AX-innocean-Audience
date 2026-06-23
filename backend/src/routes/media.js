// media.js — Channel → Subchannel → Media 3단 구조
// 광고대행사 표준 분류 (Dentsu/WPP/Publicis/WARC 통합)
// 데이터: World Bank 지표 + 매체별 베이스라인 + 국가별 오버라이드

import { Router } from "express";
import { COUNTRIES } from "../data/countries.js";
import { getCountryStats } from "../adapters/worldbank.js";
import { SOURCE_META, getActiveSources } from "../adapters/media-supplementary.js";
import {
  getCountryAdSpend, getKoreaMediaAdSpend, getMediaCategory,
  CHANNEL_SPEND_SHARE_2024, CHANNEL_SPEND_SHARE_2025, CHANNEL_SPEND_SHARE_2026,
  COUNTRY_ADSPEND_2024, COUNTRY_ADSPEND_2025, COUNTRY_ADSPEND_2026,
  ADSPEND_CONFIDENCE,
  ADSPEND_CONFIDENCE_ESTIMATE,
  calculateYoY,
  listAdspendSources,
} from "../adapters/adspend-public.js";
import { CHANNELS, COUNTRY_MEDIA_OVERRIDES, flattenMedia } from "../data/media-taxonomy.js";
import { getBrief, getPersonas } from "../lib/persona-store.js";
import { aggregateMedia } from "../lib/persona-aggregator.js";
import { buildPersonaPoolBadge, buildPublicDataBadge } from "../lib/persona-badge.js";

export const mediaRouter = Router();

// briefId + 페르소나 풀 존재 여부를 한 번에 판정
// 리턴: { briefId, personas, count } | null
function loadPersonaPool(req, code) {
  const briefId = req.query.briefId ? String(req.query.briefId) : null;
  if (!briefId) return null;
  try {
    const brief = getBrief(briefId);
    if (!brief) return null;
    const personas = getPersonas(briefId, { country: code });
    if (!personas || personas.length === 0) return null;
    return { briefId, personas, count: personas.length };
  } catch (_e) {
    return null;
  }
}

// Case 1/2 배지
function buildMediaBadge(pool, code) {
  if (pool) {
    return buildPersonaPoolBadge(
      [{ code, count: pool.count }],
      { tab: "media", briefId: pool.briefId },
    );
  }
  return buildPublicDataBadge(code, { tab: "media" });
}

// persona-pool media_diet 집계 → personaChannels 배열
//   2026-06-23 (CEO 지시): 광고형식별 수용도(adReceptivity)도 포함. 차트5 persona-pool SoT.
function buildPersonaChannels(pool) {
  if (!pool || !pool.personas) return null;
  const agg = aggregateMedia(pool.personas); // { total, channels:[...], adReceptivity:{total,formats} }
  const total = agg.total || pool.count || 0;
  const channels = (agg.channels || []).map(c => ({
    channel: c.channel,
    mentions: c.mentions,
    share: total > 0 ? Number((c.mentions / total).toFixed(4)) : 0,
    avgHoursPerDay: Number((c.avgHoursPerDay || 0).toFixed(2)),
    totalHoursPerDay: Number((c.totalHoursPerDay || 0).toFixed(2)),
    reach: Number((c.reach || 0).toFixed(4)),        // 0~1 소수 (하위호환)
    reachPct: Number(((c.reach || 0) * 100).toFixed(1)),  // 2026-06-23: % 단위 통일 (프론트 차트1/4 용)
  }));
  return { total, channels, adReceptivity: agg.adReceptivity || null };
}

// 매체별 도달률 계산
function computeReach(m, country, ind) {
  let reach = m.baselineReach;
  if (m.internetWeight && m.internetWeight > 0 && ind.internetUsers) {
    const ratio = ind.internetUsers / 80;
    reach = reach * Math.pow(ratio, m.internetWeight);
  }
  if ((m.channelId === "ooh" || m.channelId === "dooh") && ind.urbanPop) {
    reach *= ind.urbanPop / 75;
  }
  // 라디오·전통은 GDP 낮을수록 도달↑
  if (m.channelId === "audio" && m.subchannelId === "audio_broadcast" && ind.gdpPerCapita) {
    reach *= Math.max(0.6, Math.min(1.3, 30000 / ind.gdpPerCapita));
  }
  const override = COUNTRY_MEDIA_OVERRIDES[country]?.[m.id];
  if (override !== undefined) reach *= override;
  return Math.max(0, Math.min(95, Number(reach.toFixed(1))));
}

function computeTrust(m, country, ind) {
  let trust = m.trustBase;
  if (ind.gdpPerCapita && m.channelId === "digital" && m.subchannelId === "digital_social") {
    if (ind.gdpPerCapita > 30000) trust -= 5;
  }
  if (m.channelId === "tv" && m.subchannelId === "tv_terrestrial" && ind.gdpPerCapita > 40000) trust += 4;
  if (m.channelId === "print" && ind.gdpPerCapita > 35000) trust += 3;
  return Math.max(20, Math.min(85, Math.round(trust)));
}

function computeCPM(m, ind) {
  const base = m.cpm || 5;
  const gdpAdj = ind.gdpPerCapita ? Math.pow(ind.gdpPerCapita / 30000, 0.6) : 1;
  return Math.round(base * gdpAdj * 100) / 100;
}

// 국가별 총 광고비 추정 (Statista AMO baseline + GDP 계수)
// 2024 기준 글로벌 광고비 ~$1T, 채널별 합 점유율 대입
// 채널별 광고비 점유율: GroupM TYNY 2024 + MAGNA Dec 2024 공식 수치
const CHANNEL_SPEND_SHARE = Object.fromEntries(
  Object.entries(CHANNEL_SPEND_SHARE_2024).map(([k, v]) => [k, v.share])
);

const YEAR_SHARE_TABLE = {
  2024: CHANNEL_SPEND_SHARE_2024,
  2025: CHANNEL_SPEND_SHARE_2025,
  2026: CHANNEL_SPEND_SHARE_2026,
};
const YEAR_COUNTRY_TABLE = {
  2024: COUNTRY_ADSPEND_2024,
  2025: COUNTRY_ADSPEND_2025,
  2026: COUNTRY_ADSPEND_2026,
};

function estimateCountryAdSpend(ind, countryCode, year = 2024) {
  // 1순위: 공식 보고서 (MAGNA/GroupM/Dentsu/KOBACO)
  const official = getCountryAdSpend(countryCode, year);
  if (official) {
    return {
      total: official.totalUSD,
      source: official.source,
      method: "public-report",
      isActuals: official.isActuals,
      isForecast: official.isForecast,
    };
  }
  // 2순위: GDP 기반 추정 (공개 데이터 없는 국가)
  const gdpPerCap = ind.gdpPerCapita || 15000;
  const ratio = 0.005 + (gdpPerCap > 30000 ? 0.005 : (gdpPerCap > 15000 ? 0.003 : 0));
  const popB = (ind.population || 50_000_000);
  const gdpUSD = gdpPerCap * popB;
  return {
    total: gdpUSD * ratio,
    source: "GDP 기반 추정 (공개 데이터 없음)",
    method: "gdp-estimate",
    isActuals: false,
    isForecast: year === 2026,
  };
}

// ---------------------------------------------------------------------------
// 연도별 spend payload 빌더 (TASK G 최종 광고비 모델)
//   - reach/trust/cpm 기반 채널내 매체 점유 = items 계산 결과 재사용
//   - byCategory(ATL/BTL/Digital) = MEDIA_CATEGORY 매핑 기준 재집계
// ---------------------------------------------------------------------------
function buildYearSpendPayload({ year, items, ind, code }) {
  const adSpend = estimateCountryAdSpend(ind, code, year);
  const totalAdSpend = adSpend.total;
  const shareTable = YEAR_SHARE_TABLE[year] || YEAR_SHARE_TABLE[2024];

  // 매체별 spend
  const itemSpends = items.map(m => {
    let mSpend = 0;
    let mSpendShare = 0;
    let mSource = adSpend.source;
    if (code === "KR") {
      const krOfficial = getKoreaMediaAdSpend(m.id, year);
      if (krOfficial) {
        mSpend = krOfficial.usd * 1_000_000;
        mSpendShare = totalAdSpend > 0 ? Number((mSpend / totalAdSpend * 100).toFixed(2)) : 0;
        mSource = krOfficial.source;
      }
    }
    if (mSpend === 0) {
      const chShare = shareTable[m.channelId]?.share ?? 0.02;
      const channelSpend = totalAdSpend * chShare;
      const sameChannel = items.filter(x => x.channelId === m.channelId);
      const myShare = spendShareForMedia(m, sameChannel);
      mSpend = Math.round(channelSpend * myShare);
      mSpendShare = Number((chShare * myShare * 100).toFixed(2));
    }
    return {
      id: m.id, label: m.label,
      channel: m.channel, channelId: m.channelId,
      subchannel: m.subchannel, subchannelId: m.subchannelId,
      category: getMediaCategory(m.id, m.channelId),
      spend: mSpend,
      spendShare: mSpendShare,
      spendSource: mSource,
    };
  });

  // 채널별 요약
  const channelSummary = Object.entries(shareTable).map(([id, v]) => ({
    channelId: id,
    label: CHANNELS.find(c => c.id === id)?.label || id,
    share: Number((v.share * 100).toFixed(1)),
    spend: Math.round(totalAdSpend * v.share),
  })).sort((a, b) => b.spend - a.spend);

  // byCategory 재집계 (ATL/BTL/Digital)
  const categoryBuckets = { ATL: [], BTL: [], Digital: [] };
  for (const it of itemSpends) {
    const cat = categoryBuckets[it.category] ? it.category : "Digital";
    categoryBuckets[cat].push(it);
  }
  const grandSum = itemSpends.reduce((s, x) => s + (x.spend || 0), 0) || 1;
  const byCategory = Object.fromEntries(
    Object.entries(categoryBuckets).map(([cat, arr]) => {
      const totalB = arr.reduce((s, x) => s + (x.spend || 0), 0);
      return [cat, {
        totalB: Number((totalB / 1_000_000_000).toFixed(2)),
        totalUSD: totalB,
        share: Number((totalB / grandSum).toFixed(4)),
        items: arr.sort((a, b) => b.spend - a.spend).map(x => ({
          label: x.label, channelId: x.channelId,
          spend: x.spend, share: x.spendShare,
        })),
      }];
    })
  );

  return {
    year,
    totalEstimated: Math.round(totalAdSpend),
    totalEstimatedB: Number((totalAdSpend / 1_000_000_000).toFixed(2)),
    currency: "USD",
    source: adSpend.source,
    method: adSpend.method,
    isActuals: !!adSpend.isActuals,
    isForecast: !!adSpend.isForecast,
    // S-1 fix (Chaeyeon 2026-06-17 22:10 → CTO 22:12):
    //   gdp-estimate 국가는 추정이므로 Estimate confidence 적용 (50% / 주황).
    confidence: (adSpend.method === "gdp-estimate"
      ? ADSPEND_CONFIDENCE_ESTIMATE[year]
      : ADSPEND_CONFIDENCE[year]) || null,
    channels: channelSummary,
    methodology: adSpend.method === "public-report"
      ? `공개 보고서 (${adSpend.source}) + WPP/MAGNA 채널 점유율${code === "KR" ? " + KOBACO/제일기획 매체별" : ""}`
      : `GDP × 광고비 비율 추정 (공개 데이터 없음, 정밀도 ±15%)`,
    items: itemSpends,
    byCategory,
  };
}

function spendShareForMedia(m, allMediaInChannel) {
  // 채널 안 매체별 점유율은 reach × cpm의 상대비
  const weight = (m.reach || 0) * (m.cpm || 1);
  const totalWeight = allMediaInChannel.reduce((s, x) => s + (x.reach || 0) * (x.cpm || 1), 0);
  return totalWeight > 0 ? weight / totalWeight : 0;
}

// GET /api/media/landscape?country=KR
// 전체 매체 풀 도달·신뢰·CPM (호환 유지)
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

  // 국가 총 광고비 추정 + Pop 보완 (default = 2025 actuals)
  const indFlatWithPop = { ...indFlat, population: ind.population?.value };
  const adSpendData = estimateCountryAdSpend(indFlatWithPop, code, 2025);
  const totalAdSpend = adSpendData.total;

  const allMedia = flattenMedia();
  // 1차 계산: reach/trust/cpm
  let items = allMedia.map(m => {
    const reach = computeReach(m, code, indFlat);
    const trust = computeTrust(m, code, indFlat);
    const cpm = computeCPM(m, indFlat);
    return {
      id: m.id, label: m.label,
      channel: m.channelLabel, channelId: m.channelId,
      subchannel: m.subchannelLabel, subchannelId: m.subchannelId,
      reach, trust, cpm,
      effIndex: cpm > 0 ? Number((reach * trust / cpm).toFixed(1)) : 0,
    };
  });
  // 2차: 기본 연도(2025 actuals) spend 주입 — backward compat·표용
  const spend2025Payload = buildYearSpendPayload({ year: 2025, items, ind: indFlatWithPop, code });
  const spendById2025 = new Map(spend2025Payload.items.map(x => [x.id, x]));
  for (const m of items) {
    const s = spendById2025.get(m.id);
    if (s) {
      m.spend = s.spend;
      m.spendShare = s.spendShare;
      m.spendSource = s.spendSource;
      m.category = s.category;
    }
  }
  items.sort((a, b) => b.reach - a.reach);

  // 인사이트
  const insights = [];
  const topReach = items[0];
  insights.push({
    type: "top-reach",
    title: "최대 도달 매체",
    text: `${topReach.label} (${topReach.channel}) — 성인 인구의 ${topReach.reach}% 도달, 신뢰도 ${topReach.trust}`,
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

  // 광고비 인사이트 (2025 기준)
  const topSpend = [...items].sort((a, b) => b.spend - a.spend)[0];
  insights.push({
    type: "top-spend",
    title: "광고비 1위 매체 (2025)",
    text: `${topSpend.label} (${topSpend.channel}) — 연 추정 $${(topSpend.spend / 1_000_000).toFixed(1)}M (전체 광고시장의 ${topSpend.spendShare}%)`,
  });

  // 3년 spend payload — 동일 items 재사용·연도별 재계산
  const spend2024 = buildYearSpendPayload({ year: 2024, items, ind: indFlatWithPop, code });
  const spend2025 = spend2025Payload;
  const spend2026 = buildYearSpendPayload({ year: 2026, items, ind: indFlatWithPop, code });
  const yoy = {
    y24_25: { pct: calculateYoY(2024, 2025, code), from: 2024, to: 2025 },
    y25_26: { pct: calculateYoY(2025, 2026, code), from: 2025, to: 2026, isForecast: true },
  };

  // CEO 2026-06-17 TASK D: briefId 없으면 공개통계 원래 응답, 있으면 personaChannels 추가
  const pool = loadPersonaPool(req, code);
  const personaChannelsPayload = buildPersonaChannels(pool);

  // 2026-06-23 (CEO 지시): persona-pool 모드에서는 시장지표(trust/spend) 제거, 타겟 기준(페르소나 풌) 차트가 메인.
  //   personaChart: 프론트가 바로 그릴 수 있는 페르소나 기반 차트 데이터 (reach/시청시간/광고수용도).
  let personaChart = undefined;
  if (pool && personaChannelsPayload) {
    const topCh = (personaChannelsPayload.channels || []).slice(0, 15);
    personaChart = {
      labels: topCh.map(c => c.channel),
      reach: topCh.map(c => Number((c.reach * 100).toFixed(1))),       // 도달률 %
      avgHoursPerDay: topCh.map(c => c.avgHoursPerDay),                 // 평균 시청시간 h/일
      matrix: topCh.map(c => ({ x: Number((c.reach * 100).toFixed(1)), y: c.avgHoursPerDay, label: c.channel, mentions: c.mentions })),
      adReceptivity: personaChannelsPayload.adReceptivity || null,     // {total, formats:[{format,avg,n}]}
      excluded: ["trust", "spend"],                                    // CEO 지시: 시장지표 제외
    };
  }

  res.json({
    ok: true,
    source: pool ? "persona-pool" : "public-data",
    badge: buildMediaBadge(pool, code),
    briefId: pool ? pool.briefId : undefined,
    personaChannels: personaChannelsPayload || undefined,
    personaChart,
    country: meta,
    items,
    insights,
    baseline: {
      reach: items.slice(0, 15).map(i => ({ id: i.id, label: i.label, reach: i.reach, trust: i.trust, cpm: i.cpm, spend: i.spend })),
      note: "공개통계 기반 도달·신뢰·광고비 베이스라인 (World Bank + Statista AMO + DataReportal 2025 + Reuters)",
    },
    spend: {
      // backward compat — 기존 프론트 레더러는 이 키들을 계속 읽음 (default = 2025 actuals)
      totalEstimated: spend2025.totalEstimated,
      totalEstimatedB: spend2025.totalEstimatedB,
      currency: "USD",
      year: 2025,
      source: spend2025.source,
      method: spend2025.method,
      channels: spend2025.channels,
      methodology: spend2025.methodology,
      // 신규: 3년 + byCategory
      year2024: { ...spend2024 },
      year2025: { ...spend2025 },
      year2026: { ...spend2026 },
      yoy,
      default: 2025,
      countryCode: code,
      confidence: ADSPEND_CONFIDENCE,
    },
    chart: {
      labels: items.slice(0, 15).map(i => i.label),
      reach: items.slice(0, 15).map(i => i.reach),
      trust: items.slice(0, 15).map(i => i.trust),
      cpm: items.slice(0, 15).map(i => i.cpm),
      spend: items.slice(0, 15).map(i => i.spend),
    },
    sources: {
      // CEO 2026-06-17: 적용 중인 공개 출처만 노출 (planned —> 제거)
      active: getActiveSources(),
    },
    meta: {
      method: "Statista AMO 9 세그먼트 + GWI 미디어 행동 매핑",
      taxonomy: "Statista Advertising & Media Outlook (공식) + GWI 행동 카테고리",
      totalChannels: CHANNELS.length,
      totalMedia: allMedia.length,
      generatedAt: new Date().toISOString(),
      partial: !!meta.trendsUnavailable,
    },
  });
});

// GET /api/media/taxonomy?country=KR
// 채널/서브채널 단위로 집계된 트리 구조 (UI 트리뷰용)
mediaRouter.get("/taxonomy", async (req, res) => {
  const code = String(req.query.country || "KR").toUpperCase();
  const meta = COUNTRIES.find(c => c.code === code);
  if (!meta) return res.status(400).json({ ok: false, error: "Unknown country" });

  const wb = await getCountryStats(code);
  const ind = wb?.indicators || {};
  const indFlat = {
    internetUsers: ind.internetUsers?.value,
    urbanPop: ind.urbanPop?.value,
    gdpPerCapita: ind.gdpPerCapita?.value,
  };

  // 채널별 트리 빌드 + 집계
  const tree = CHANNELS.map(ch => {
    let chReach = 0, chSpend = 0, chCount = 0;
    const subchannels = (ch.subchannels || []).map(sub => {
      let subReach = 0, subTrust = 0, subCpm = 0;
      const media = sub.media.map(m => {
        const flat = { ...m, channelId: ch.id, subchannelId: sub.id, channelLabel: ch.label, subchannelLabel: sub.label };
        const reach = computeReach(flat, code, indFlat);
        const trust = computeTrust(flat, code, indFlat);
        const cpm = computeCPM(flat, indFlat);
        subReach = Math.max(subReach, reach);  // 서브채널 도달 = 최대값 (중복 제거 가정)
        subTrust += trust;
        subCpm += cpm;
        return {
          id: m.id, label: m.label, reach, trust, cpm,
          effIndex: cpm > 0 ? Number((reach * trust / cpm).toFixed(1)) : 0,
        };
      });
      chReach = Math.max(chReach, subReach);
      chCount += media.length;
      return {
        id: sub.id,
        label: sub.label,
        reach: subReach,
        avgTrust: media.length ? Math.round(subTrust / media.length) : 0,
        avgCpm: media.length ? Number((subCpm / media.length).toFixed(2)) : 0,
        media,
      };
    });
    return {
      id: ch.id,
      label: ch.label,
      icon: ch.icon,
      statista: ch.statista || null,
      gwi: ch.gwi || [],
      reach: chReach,
      mediaCount: chCount,
      subchannels,
    };
  });

  const poolTax = loadPersonaPool(req, code);
  const personaChannelsTax = buildPersonaChannels(poolTax);

  res.json({
    ok: true,
    source: poolTax ? "persona-pool" : "public-data",
    badge: buildMediaBadge(poolTax, code),
    briefId: poolTax ? poolTax.briefId : undefined,
    personaChannels: personaChannelsTax || undefined,
    country: meta,
    tree,
    meta: {
      taxonomy: "Statista AMO 9개 공식 세그먼트 → Subchannel → Media",
      source: "Statista Advertising & Media Outlook (cdn.statcdn.com)",
      gwiMapping: "GWI 미디어 행동 카테고리 계층별 매핑",
      totalChannels: CHANNELS.length,
      totalMedia: flattenMedia().length,
      generatedAt: new Date().toISOString(),
    },
  });
});

// GET /api/media/adspend-sources — 광고비 데이터 출처 메타
mediaRouter.get("/adspend-sources", (_req, res) => {
  res.json({
    ok: true,
    sources: listAdspendSources(),
    countriesWithOfficialData: Object.keys(COUNTRY_ADSPEND_2024),
    channelsWithOfficialShare: Object.keys(CHANNEL_SPEND_SHARE_2024),
    meta: {
      generatedAt: new Date().toISOString(),
      note: "우선순위: KOBACO·제일기획 (KR) > MAGNA·GroupM·Dentsu (국가별) > GDP 추정 (기타)",
    },
  });
});

// GET /api/media/sources
mediaRouter.get("/sources", (req, res) => {
  res.json({
    ok: true,
    sources: SOURCE_META,
    activeCount: Object.values(SOURCE_META).filter(s => s && s.integrated !== false).length,
    plannedCount: 0,
  });
});
