// dimension-insights.js — 디멘션별 분포·교차분석 (Insights 탭 데이터)
// 원리: 디멘션 옵션별 베이스라인 분포를 국가·세그먼트로 조정해 차트 데이터 반환
// 현재는 룰 기반 (World Bank 인구 + 디멘션 메타) — 향후 BQ 합성 패널 데이터로 교체

import { Router } from "express";
import { DIMENSIONS } from "../data/dimensions.js";
import { COUNTRIES } from "../data/countries.js";
import { getCountryStats } from "../adapters/worldbank.js";

export const dimInsightsRouter = Router();

// 베이스라인 분포 (각 옵션의 인구 비율, 평균 가정)
// 실제 패널 데이터 들어오면 이 부분 교체
const BASELINE_DIST = {
  age: { "10대": 11, "20대": 14, "30대": 15, "40대": 16, "50대": 17, "60대 이상": 27 },
  gender: { "남성": 49, "여성": 50, "기타·무응답": 1 },
  income: { "하위 20%": 20, "20~40%": 20, "40~60%": 20, "60~80%": 20, "상위 20%": 20 },
  education: { "고졸 이하": 35, "대학 재학·졸업": 50, "대학원 이상": 15 },
  household: { "1인 가구": 30, "신혼·무자녀": 12, "유자녀 가구": 35, "한부모·확대가족": 8, "동거·기타": 15 },
};

// 국가별 분포 조정 (World Bank 지표 기반 micro-tuning)
function adjustDistByCountry(dimId, baseline, wbInd) {
  const adjusted = { ...baseline };
  if (dimId === "age" && wbInd.populationAge15To64?.value) {
    // 15~64 비율이 높을수록 청장년 가중치 ↑
    const r = wbInd.populationAge15To64.value / 65;  // 65% 기준
    adjusted["20대"] = baseline["20대"] * r;
    adjusted["30대"] = baseline["30대"] * r;
    adjusted["40대"] = baseline["40대"] * r;
  }
  if (dimId === "income" && wbInd.gdpPerCapita?.value) {
    // 고소득국가일수록 상위 분포 비중 ↑
    const r = Math.min(1.5, wbInd.gdpPerCapita.value / 40000);
    adjusted["상위 20%"] = baseline["상위 20%"] * r;
    adjusted["하위 20%"] = baseline["하위 20%"] / Math.max(0.7, r);
  }
  // 정규화 (합 100%)
  const sum = Object.values(adjusted).reduce((a, b) => a + b, 0);
  for (const k of Object.keys(adjusted)) adjusted[k] = Number((adjusted[k] / sum * 100).toFixed(1));
  return adjusted;
}

// POST /api/dimension-insights/distribution
// 입력: { country, filters }
// 출력: 18개 디멘션별 분포 + 필터 영향
dimInsightsRouter.post("/distribution", async (req, res) => {
  const { country = "KR", filters = {} } = req.body || {};
  const code = String(country).toUpperCase();
  const meta = COUNTRIES.find(c => c.code === code);
  if (!meta) return res.status(400).json({ ok: false, error: "Unknown country" });

  const wb = await getCountryStats(code);
  const ind = wb?.indicators || {};

  const distributions = DIMENSIONS.map(dim => {
    const baseline = BASELINE_DIST[dim.id];
    let dist;
    if (baseline) {
      dist = adjustDistByCountry(dim.id, baseline, ind);
    } else {
      // 베이스라인 없는 디멘션 → 옵션 균등 분포
      const opts = dim.options.map(o => typeof o === 'string' ? o : o.label);
      const pct = Number((100 / opts.length).toFixed(1));
      dist = Object.fromEntries(opts.map(o => [o, pct]));
    }
    // 필터 영향: 선택된 옵션은 100%, 미선택은 0% (해당 디멘션이 필터에 있는 경우)
    const filterValues = filters[dim.id];
    const filtered = !!(Array.isArray(filterValues) && filterValues.length);
    let segmentDist;
    if (filtered) {
      const totalSel = filterValues.reduce((s, v) => s + (dist[v] || 0), 0);
      segmentDist = Object.fromEntries(
        Object.keys(dist).map(k => [k, filterValues.includes(k) ? Number(((dist[k] / totalSel) * 100).toFixed(1)) : 0])
      );
    } else {
      segmentDist = dist;
    }
    return {
      dimensionId: dim.id,
      label: dim.label,
      group: dim.group,
      filtered,
      baseline: dist,
      segment: segmentDist,
      options: Object.keys(dist),
    };
  });

  // 자동 인사이트 (필터 적용된 디멘션이 있을 때)
  const insights = [];
  const filteredDims = distributions.filter(d => d.filtered);
  if (filteredDims.length > 0) {
    insights.push({
      type: "filtered",
      title: `${filteredDims.length}개 디멘션 필터 적용됨`,
      text: `필터: ${filteredDims.map(d => `${d.label}(${Object.entries(d.segment).filter(([_,v])=>v>0).map(([k,v])=>k).join(',')})`).join(' · ')}`,
    });
  } else {
    insights.push({
      type: "guide",
      title: "필터를 적용해 세그먼트를 좁혀보세요",
      text: "Builder에서 옵션을 선택하면 해당 디멘션의 분포가 100%로 좁혀집니다.",
    });
  }

  res.json({
    ok: true,
    country: meta,
    distributions,
    insights,
    meta: {
      generatedAt: new Date().toISOString(),
      method: "world-bank + baseline distribution (panel data 교체 예정)",
      partial: !!meta.trendsUnavailable,
    },
  });
});

// POST /api/dimension-insights/cross
// 입력: { country, dimX, dimY, filters }
// 출력: 2개 디멘션 교차 heatmap (옵션 X × 옵션 Y 비율)
dimInsightsRouter.post("/cross", async (req, res) => {
  const { country = "KR", dimX, dimY, filters = {} } = req.body || {};
  if (!dimX || !dimY) return res.status(400).json({ ok: false, error: "dimX, dimY required" });
  const code = String(country).toUpperCase();
  const meta = COUNTRIES.find(c => c.code === code);
  if (!meta) return res.status(400).json({ ok: false, error: "Unknown country" });

  const dimXMeta = DIMENSIONS.find(d => d.id === dimX);
  const dimYMeta = DIMENSIONS.find(d => d.id === dimY);
  if (!dimXMeta || !dimYMeta) return res.status(400).json({ ok: false, error: "Unknown dimension" });

  const wb = await getCountryStats(code);
  const ind = wb?.indicators || {};
  const baseX = adjustDistByCountry(dimX, BASELINE_DIST[dimX] || {}, ind);
  const baseY = adjustDistByCountry(dimY, BASELINE_DIST[dimY] || {}, ind);

  // 독립 가정 교차 (실 패널 데이터 들어오면 상관계수 적용)
  const optsX = Object.keys(baseX);
  const optsY = Object.keys(baseY);
  const matrix = optsX.map(x =>
    optsY.map(y => Number(((baseX[x] / 100) * (baseY[y] / 100) * 100).toFixed(2)))
  );

  // 상위 셀 찾기 (인사이트용)
  let topCell = { x: optsX[0], y: optsY[0], v: 0 };
  for (let i = 0; i < optsX.length; i++) {
    for (let j = 0; j < optsY.length; j++) {
      if (matrix[i][j] > topCell.v) topCell = { x: optsX[i], y: optsY[j], v: matrix[i][j] };
    }
  }

  res.json({
    ok: true,
    country: meta,
    dimX: { id: dimX, label: dimXMeta.label, options: optsX },
    dimY: { id: dimY, label: dimYMeta.label, options: optsY },
    matrix,
    top: topCell,
    meta: {
      method: "독립 가정 곱 (실 상관계수 교체 예정)",
      partial: !!meta.trendsUnavailable,
    },
  });
});
