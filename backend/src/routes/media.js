// media.js — Channel → Subchannel → Media 3단 구조
// 광고대행사 표준 분류 (Dentsu/WPP/Publicis/WARC 통합)
// 데이터: World Bank 지표 + 매체별 베이스라인 + 국가별 오버라이드

import { Router } from "express";
import { COUNTRIES } from "../data/countries.js";
import { getCountryStats } from "../adapters/worldbank.js";
import { SOURCE_META } from "../adapters/media-supplementary.js";
import { CHANNELS, COUNTRY_MEDIA_OVERRIDES, flattenMedia } from "../data/media-taxonomy.js";

export const mediaRouter = Router();

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

  const allMedia = flattenMedia();
  const items = allMedia.map(m => {
    const reach = computeReach(m, code, indFlat);
    const trust = computeTrust(m, code, indFlat);
    const cpm = computeCPM(m, indFlat);
    return {
      id: m.id,
      label: m.label,
      channel: m.channelLabel,
      channelId: m.channelId,
      subchannel: m.subchannelLabel,
      subchannelId: m.subchannelId,
      reach, trust, cpm,
      effIndex: cpm > 0 ? Number((reach * trust / cpm).toFixed(1)) : 0,
    };
  }).sort((a, b) => b.reach - a.reach);

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

  res.json({
    ok: true,
    country: meta,
    items,
    insights,
    chart: {
      labels: items.slice(0, 15).map(i => i.label),
      reach: items.slice(0, 15).map(i => i.reach),
      trust: items.slice(0, 15).map(i => i.trust),
      cpm: items.slice(0, 15).map(i => i.cpm),
    },
    sources: {
      active: [SOURCE_META.worldBank],
      planned: [SOURCE_META.dataReportal, SOURCE_META.statista, SOURCE_META.innoceanInternal, SOURCE_META.talkwalker],
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

  res.json({
    ok: true,
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

// GET /api/media/sources
mediaRouter.get("/sources", (req, res) => {
  res.json({
    ok: true,
    sources: SOURCE_META,
    activeCount: Object.values(SOURCE_META).filter(s => s.integrated !== false).length,
    plannedCount: Object.values(SOURCE_META).filter(s => s.integrated === false).length,
  });
});
