// compare.js — 국가 vs 국가 비교 endpoint (최대 4국)
import { Router } from "express";
import { getCountryStats } from "../adapters/worldbank.js";
import { DIMENSIONS } from "../data/dimensions.js";
import { COUNTRIES } from "../data/countries.js";

export const compareRouter = Router();

const MAX_COUNTRIES = 4;

// POST /api/compare/segment
// 입력: { countries: ["KR","JP","US"], filters: { age: [...], ... } }
// 출력: 국가별 동일 필터의 세그먼트 결과 + 비교용 시리즈
compareRouter.post("/segment", async (req, res) => {
  const { countries = [], filters = {} } = req.body || {};
  if (!Array.isArray(countries) || countries.length < 2) {
    return res.status(400).json({ ok: false, error: "최소 2개국 필요" });
  }
  if (countries.length > MAX_COUNTRIES) {
    return res.status(400).json({ ok: false, error: `최대 ${MAX_COUNTRIES}개국까지` });
  }

  // 국가별 세그먼트 병렬 계산
  const results = await Promise.all(
    countries.map(async code => {
      const cc = String(code).toUpperCase();
      const meta = COUNTRIES.find(c => c.code === cc);
      if (!meta) return { code: cc, error: "Unknown country" };
      const wb = await getCountryStats(cc);
      const ind = wb?.indicators || {};
      const totalPop = ind.population?.value || 0;
      const internetPct = (ind.internetUsers?.value || 0) / 100;
      let segmentRatio = 1.0;
      for (const [dimId, values] of Object.entries(filters)) {
        if (!Array.isArray(values) || !values.length) continue;
        const dim = DIMENSIONS.find(d => d.id === dimId);
        if (!dim) continue;
        segmentRatio *= values.length / dim.options.length;
      }
      const reachablePop = totalPop * internetPct;
      const segmentSize = Math.round(reachablePop * segmentRatio);
      return {
        code: cc,
        country: meta,
        partial: !!meta.trendsUnavailable,
        partialReason: meta.trendsUnavailableReason || null,
        segment: {
          size: segmentSize,
          pctOfReachable: reachablePop > 0 ? Number(((segmentSize / reachablePop) * 100).toFixed(2)) : 0,
          totalPop,
          reachablePop: Math.round(reachablePop),
        },
        indicators: {
          population: ind.population?.value || null,
          gdpPerCapita: ind.gdpPerCapita?.value || null,
          internetUsers: ind.internetUsers?.value || null,
          urbanPop: ind.urbanPop?.value || null,
          mobileSubs: ind.mobileSubs?.value || null,
        },
      };
    })
  );

  // 비교 시리즈 정리 (차트 친화적 shape)
  const labels = results.map(r => r.country?.name || r.code);
  const series = {
    segmentSize: { label: "세그먼트 규모", data: results.map(r => r.segment?.size || 0) },
    population: { label: "총 인구", data: results.map(r => r.indicators?.population || 0) },
    gdpPerCapita: { label: "1인당 GDP (USD)", data: results.map(r => Math.round(r.indicators?.gdpPerCapita || 0)) },
    internetUsers: { label: "인터넷 사용률 (%)", data: results.map(r => Number((r.indicators?.internetUsers || 0).toFixed(1))) },
    urbanPop: { label: "도시화율 (%)", data: results.map(r => Number((r.indicators?.urbanPop || 0).toFixed(1))) },
    mobileSubs: { label: "모바일 가입 (100명당)", data: results.map(r => Math.round(r.indicators?.mobileSubs || 0)) },
  };

  // 자동 비교 인사이트
  const insights = generateCompareInsights(results);

  res.json({
    ok: true,
    countries: results,
    chart: { labels, series },
    insights,
    meta: {
      generatedAt: new Date().toISOString(),
      countCountries: results.length,
      hasPartial: results.some(r => r.partial),
    },
  });
});

function generateCompareInsights(results) {
  const out = [];
  // 인구 1위
  const popSorted = [...results].sort((a, b) => (b.indicators?.population || 0) - (a.indicators?.population || 0));
  if (popSorted.length >= 2 && popSorted[0].indicators?.population) {
    const a = popSorted[0], b = popSorted[popSorted.length - 1];
    out.push({
      type: "scale",
      title: "시장 규모",
      text: `${a.country.name}이(가) 가장 큰 시장 (${fmtNum(a.indicators.population)}명) — ${b.country.name} 대비 ${(a.indicators.population / (b.indicators.population || 1)).toFixed(1)}배`,
    });
  }
  // 구매력 1위
  const gdpSorted = [...results].sort((a, b) => (b.indicators?.gdpPerCapita || 0) - (a.indicators?.gdpPerCapita || 0));
  if (gdpSorted.length >= 2 && gdpSorted[0].indicators?.gdpPerCapita) {
    const a = gdpSorted[0];
    out.push({
      type: "purchasing-power",
      title: "구매력",
      text: `${a.country.name}이(가) 1인당 GDP $${fmtNum(Math.round(a.indicators.gdpPerCapita))}로 가장 높음 — 프리미엄 메시지 우선 검증 시장`,
    });
  }
  // 디지털 침투율
  const netSorted = [...results].sort((a, b) => (b.indicators?.internetUsers || 0) - (a.indicators?.internetUsers || 0));
  if (netSorted.length >= 2 && netSorted[0].indicators?.internetUsers) {
    const a = netSorted[0], b = netSorted[netSorted.length - 1];
    const diff = (a.indicators.internetUsers - b.indicators.internetUsers).toFixed(1);
    out.push({
      type: "digital",
      title: "디지털 도달",
      text: `인터넷 침투율: ${a.country.name} ${a.indicators.internetUsers.toFixed(1)}% vs ${b.country.name} ${b.indicators.internetUsers.toFixed(1)}% (격차 ${diff}%p)`,
    });
  }
  // 부분 활성 안내
  const partials = results.filter(r => r.partial);
  if (partials.length > 0) {
    out.push({
      type: "partial-notice",
      title: "트렌드 데이터 부분 제외",
      text: `${partials.map(p => p.country.name).join(", ")}은(는) Trends 데이터가 일시 제외된 상태입니다. 매크로 지표·세그먼트 사이즈 비교는 정상 작동.`,
    });
  }
  return out;
}

function fmtNum(n) {
  if (n >= 1e8) return (n / 1e8).toFixed(1) + "억";
  if (n >= 1e4) return (n / 1e4).toFixed(1) + "만";
  return n.toLocaleString();
}
