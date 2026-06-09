import { Router } from "express";
import { getCountryStats } from "../adapters/worldbank.js";
import { DIMENSIONS } from "../data/dimensions.js";
import { COUNTRIES } from "../data/countries.js";

export const insightsRouter = Router();

// POST /api/insights/segment
// 입력: { country, filters: { age: [...], gender: [...], ... } }
// 출력: 세그먼트 크기 + 주요 지표 + 자동 인사이트
insightsRouter.post("/segment", async (req, res) => {
  const { country = "KR", filters = {} } = req.body || {};
  const code = String(country).toUpperCase();

  const countryMeta = COUNTRIES.find(c => c.code === code);
  if (!countryMeta) {
    return res.status(400).json({ ok: false, error: `Unknown country ${code}` });
  }

  // 1) 진짜 World Bank 통계 가져오기
  const wbStats = await getCountryStats(code);

  // 2) 세그먼트 크기 계산 (인구 × 필터 매칭 비율)
  const totalPop = wbStats?.indicators?.population?.value || 50_000_000;
  const internetPct = (wbStats?.indicators?.internetUsers?.value || 80) / 100;
  const urbanPct = (wbStats?.indicators?.urbanPop?.value || 70) / 100;

  // 필터 적용 (각 필터마다 인구 비율 추정)
  let segmentRatio = 1.0;
  const filterDetails = [];

  for (const [dimId, values] of Object.entries(filters)) {
    if (!Array.isArray(values) || !values.length) continue;
    const dim = DIMENSIONS.find(d => d.id === dimId);
    if (!dim) continue;

    // 디멘션별 옵션 수 대비 선택 비율 (균등 분포 가정 — 실 데이터 연동 전 baseline)
    const ratio = values.length / dim.options.length;
    segmentRatio *= ratio;
    filterDetails.push({ dimension: dim.label, selected: values, ratio: Number(ratio.toFixed(3)) });
  }

  // 인터넷 사용자 기준 (광고 도달 가능 모집단)
  const reachablePop = totalPop * internetPct;
  const segmentSize = Math.round(reachablePop * segmentRatio);
  const segmentPct = (segmentSize / reachablePop) * 100;

  // 3) 자동 인사이트 생성 (룰 기반 — 추후 LLM 교체)
  const insights = generateAutoInsights({ country: countryMeta, segmentSize, segmentPct, wbStats, filters });

  res.json({
    ok: true,
    country: countryMeta,
    segment: {
      size: segmentSize,
      pctOfReachable: Number(segmentPct.toFixed(2)),
      reachablePop: Math.round(reachablePop),
      totalPop,
      filtersApplied: filterDetails,
    },
    countryStats: wbStats?.indicators || {},
    insights,
    meta: {
      generatedAt: new Date().toISOString(),
      method: "world-bank + rule-based (LLM 교체 예정)",
    },
  });
});

function generateAutoInsights({ country, segmentSize, segmentPct, wbStats, filters }) {
  const out = [];
  const ind = wbStats?.indicators || {};

  out.push({
    type: "size",
    title: "세그먼트 규모",
    text: `${country.name} 인터넷 사용자 중 약 ${segmentPct.toFixed(1)}% — 약 ${formatNum(segmentSize)}명에 도달 가능합니다.`,
  });

  if (ind.internetUsers?.value) {
    out.push({
      type: "digital",
      title: "디지털 침투율",
      text: `${country.name} 인터넷 사용 인구 비율: ${ind.internetUsers.value.toFixed(1)}% (${ind.internetUsers.year}년). 디지털 광고 도달 가능성 ${ind.internetUsers.value > 85 ? "매우 높음" : ind.internetUsers.value > 70 ? "높음" : "보통"}.`,
      source: "World Bank",
    });
  }

  if (ind.gdpPerCapita?.value) {
    out.push({
      type: "economy",
      title: "구매력",
      text: `1인당 GDP $${formatNum(Math.round(ind.gdpPerCapita.value))} (${ind.gdpPerCapita.year}년). ${ind.gdpPerCapita.value > 40000 ? "프리미엄 시장 가능" : ind.gdpPerCapita.value > 15000 ? "중상위 소비층 강세" : "가성비·신흥 시장"}`,
      source: "World Bank",
    });
  }

  if (ind.urbanPop?.value) {
    out.push({
      type: "geography",
      title: "도시화율",
      text: `도시 인구 ${ind.urbanPop.value.toFixed(0)}% — ${ind.urbanPop.value > 80 ? "OOH·디지털 사이니지 효율 우수" : "지역별 매체 분산 필요"}`,
      source: "World Bank",
    });
  }

  if (Object.keys(filters).length === 0) {
    out.push({
      type: "guide",
      title: "더 깊은 인사이트",
      text: "관심사·구매 결정 요인을 추가하면 세그먼트가 정밀해집니다.",
    });
  }

  return out;
}

function formatNum(n) {
  if (n >= 1e8) return (n / 1e8).toFixed(1) + "억";
  if (n >= 1e4) return (n / 1e4).toFixed(1) + "만";
  return n.toLocaleString();
}
