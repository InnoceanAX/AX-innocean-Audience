// routes/audience.js
// 타겟 인사이트 5개 차원 라우트 (Who / Life / Mind / Love / Buy)
// 실데이터(공개) 우선, 데이터 없는 부분만 명시
import express from "express";
import { COUNTRIES } from "../data/countries.js";
import {
  getDemographics, getLifestyle, getMindset, getInterests, getPurchase,
  listAudienceSources,
} from "../adapters/audience-public.js";

export const audienceRouter = express.Router();

// ============================================================
// GET /api/audience/who?country=KR
// 인물상 (인구통계 + 가족 + 소득)
// ============================================================
audienceRouter.get("/who", async (req, res) => {
  const code = String(req.query.country || "KR").toUpperCase();
  const meta = COUNTRIES.find(c => c.code === code);
  if (!meta) return res.status(400).json({ ok: false, error: "Unknown country" });

  const demo = getDemographics(code);
  const lifestyle = getLifestyle(code);

  res.json({
    ok: true,
    country: meta,
    dimension: "who",
    data: demo ? {
      medianAge: demo.medianAge,
      dependencyRatio: demo.dependencyRatio,
      urbanRate: demo.urbanRate,
      ageDistribution: demo.ageBuckets,
      population: meta.population || null,
      gdpPerCapita: meta.gdpPerCapita || null,
    } : null,
    enrichment: lifestyle ? {
      internetPenetration: lifestyle.internetPenetration,
      socialMediaUsers: lifestyle.socialMediaUsers,
    } : null,
    source: {
      primary: "UN Population Division 2024",
      enrichment: "DataReportal Global Digital Reports 2024",
      type: "public-data",
    },
    dataStatus: demo ? "complete" : "missing",
  });
});

// ============================================================
// GET /api/audience/life?country=KR
// 라이프스타일 (디지털·일과·여행·외식)
// ============================================================
audienceRouter.get("/life", async (req, res) => {
  const code = String(req.query.country || "KR").toUpperCase();
  const meta = COUNTRIES.find(c => c.code === code);
  if (!meta) return res.status(400).json({ ok: false, error: "Unknown country" });

  const life = getLifestyle(code);

  res.json({
    ok: true,
    country: meta,
    dimension: "life",
    data: life ? {
      digital: {
        internetPenetration: life.internetPenetration,
        socialMediaUsers: life.socialMediaUsers,
        avgInternetHours: life.avgInternetTime,
        avgSocialHours: life.avgSocialTime,
        avgTVHours: life.avgTVTime,
        mobileShare: life.mobileInternetShare,
      },
      activities: life.activities,
      travel: {
        domestic: life.travelDomestic,
        international: life.travelInternational,
      },
      diningOutPerWeek: life.diningOut,
    } : null,
    source: {
      primary: "DataReportal Global Digital Reports 2024",
      secondary: "We Are Social Reports",
      type: "public-data",
    },
    dataStatus: life ? "complete" : "missing",
  });
});

// ============================================================
// GET /api/audience/mind?country=KR
// 가치관·태도
// ============================================================
audienceRouter.get("/mind", async (req, res) => {
  const code = String(req.query.country || "KR").toUpperCase();
  const meta = COUNTRIES.find(c => c.code === code);
  if (!meta) return res.status(400).json({ ok: false, error: "Unknown country" });

  const mind = getMindset(code);

  res.json({
    ok: true,
    country: meta,
    dimension: "mind",
    data: mind ? {
      trust: {
        business: mind.trustInBusiness,
        media: mind.trustInMedia,
        government: mind.trustInGovernment,
        ngo: mind.trustInNGO,
      },
      values: {
        environment: mind.environmentImportance,
        socialEquality: mind.socialEqualityImportance,
        tradition: mind.traditionalValues,
        innovation: mind.innovationOpenness,
        materialism: mind.materialism,
        hedonism: mind.hedonism,
        ambition: mind.ambition,
      },
      culture: {
        individualism: mind.individualism,        // Hofstede IDV
        riskAversion: mind.riskAversion,          // Hofstede UAI
        longTermOrientation: mind.longTermOrientation,  // Hofstede LTO
      },
    } : null,
    source: {
      primary: "World Values Survey Wave 7 (2017-2022)",
      secondary: "Edelman Trust Barometer 2024 + Hofstede Insights",
      type: "public-data",
    },
    dataStatus: mind ? "complete" : "missing",
  });
});

// ============================================================
// GET /api/audience/love?country=KR
// 관심사·열정
// ============================================================
audienceRouter.get("/love", async (req, res) => {
  const code = String(req.query.country || "KR").toUpperCase();
  const meta = COUNTRIES.find(c => c.code === code);
  if (!meta) return res.status(400).json({ ok: false, error: "Unknown country" });

  const love = getInterests(code);

  // Top 8 관심사 정렬
  const ranked = love
    ? Object.entries(love)
        .map(([k, v]) => ({ id: k, label: k, score: v }))
        .sort((a, b) => b.score - a.score)
    : [];

  res.json({
    ok: true,
    country: meta,
    dimension: "love",
    data: love,
    rankedInterests: ranked.slice(0, 12),
    top3: ranked.slice(0, 3).map(r => r.id),
    source: {
      primary: "Google Trends 12-month aggregates + DataReportal",
      secondary: "WGSN Public Insights",
      type: "public-data",
    },
    dataStatus: love ? "complete" : "missing",
  });
});

// ============================================================
// GET /api/audience/buy?country=KR
// 구매 행동
// ============================================================
audienceRouter.get("/buy", async (req, res) => {
  const code = String(req.query.country || "KR").toUpperCase();
  const meta = COUNTRIES.find(c => c.code === code);
  if (!meta) return res.status(400).json({ ok: false, error: "Unknown country" });

  const buy = getPurchase(code);

  res.json({
    ok: true,
    country: meta,
    dimension: "buy",
    data: buy ? {
      ecommerce: {
        shareOfRetail: buy.ecommerceShare,
        mobileShare: buy.mobileCommerceShare,
        avgMonthlySpendUSD: buy.avgMonthlySpend,
      },
      paymentMethods: buy.paymentMethods,
      topCategories: buy.topCategories,
      decisionFactors: buy.decisionFactors,
      psychology: {
        priceSensitivity: buy.pricesensitivity,
        brandLoyalty: buy.brandLoyalty,
        impulsiveBuying: buy.impulsiveBuying,
        planningBeforeBuy: buy.planningBeforeBuy,
      },
    } : null,
    source: {
      primary: "DataReportal Global Digital Shopping Report 2024",
      secondary: "eMarketer Public Reports + Statista Free Insights",
      type: "public-data",
    },
    dataStatus: buy ? "complete" : "missing",
  });
});

// ============================================================
// GET /api/audience/overview?country=KR
// 5개 차원 한 번에
// ============================================================
audienceRouter.get("/overview", async (req, res) => {
  const code = String(req.query.country || "KR").toUpperCase();
  const meta = COUNTRIES.find(c => c.code === code);
  if (!meta) return res.status(400).json({ ok: false, error: "Unknown country" });

  const demo = getDemographics(code);
  const life = getLifestyle(code);
  const mind = getMindset(code);
  const love = getInterests(code);
  const buy = getPurchase(code);

  const completeness = {
    who: demo ? 100 : 0,
    life: life ? 100 : 0,
    mind: mind ? 100 : 0,
    love: love ? 100 : 0,
    buy: buy ? 100 : 0,
  };
  const overall = Math.round(Object.values(completeness).reduce((a, b) => a + b, 0) / 5);

  res.json({
    ok: true,
    country: meta,
    completeness,
    overallCompleteness: overall,
    summary: {
      who: demo ? { medianAge: demo.medianAge, urban: demo.urbanRate } : null,
      life: life ? { internet: life.internetPenetration, social: life.socialMediaUsers, digitalHours: life.avgInternetTime } : null,
      mind: mind ? { trust: mind.trustInBusiness, environment: mind.environmentImportance, innovation: mind.innovationOpenness } : null,
      love: love ? Object.entries(love).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => ({ id: k, score: v })) : null,
      buy: buy ? { ecommerce: buy.ecommerceShare, avgSpend: buy.avgMonthlySpend, priceSensitive: buy.pricesensitivity } : null,
    },
  });
});

// ============================================================
// GET /api/audience/sources
// 모든 데이터 소스 메타
// ============================================================
audienceRouter.get("/sources", async (req, res) => {
  res.json({
    ok: true,
    sources: listAudienceSources(),
    coverage: "28 priority countries (확장 가능)",
    methodology: "공개 보고서 기반 (UN/WB/DataReportal/WVS/Edelman/Hofstede/eMarketer/Statista Free)",
  });
});

// ============================================================
// GET /api/audience/compare?countries=KR,US,JP
// 다국가 비교 (모든 차원)
// ============================================================
audienceRouter.get("/compare", async (req, res) => {
  const codes = String(req.query.countries || "KR,US,JP").toUpperCase().split(",").slice(0, 6);
  const data = codes.map(code => {
    const meta = COUNTRIES.find(c => c.code === code);
    if (!meta) return null;
    return {
      country: meta,
      who: getDemographics(code),
      life: getLifestyle(code),
      mind: getMindset(code),
      love: getInterests(code),
      buy: getPurchase(code),
    };
  }).filter(Boolean);

  res.json({ ok: true, countries: data, dimensions: ["who", "life", "mind", "love", "buy"] });
});

// ============================================================
// GET /api/audience/compare-all
// 전체 지원 국가 × 5차원 매트릭스 (글로벌 비교 매트릭스용)
// ============================================================
audienceRouter.get("/compare-all", async (req, res) => {
  const rows = COUNTRIES.map(c => {
    const code = c.code;
    const who = getDemographics(code);
    const life = getLifestyle(code);
    const mind = getMindset(code);
    const love = getInterests(code);
    const buy = getPurchase(code);
    return { code, name: c.name, who, life, mind, love, buy };
  });

  // 데이터가 있는 국가만 (5차원 모두 또는 일부)
  const supported = rows.filter(r => r.who && r.life && r.mind && r.love && r.buy);

  // 어댑터 raw 필드명을 그대로 사용
  const who = supported.map(r => ({
    code: r.code, name: r.name,
    medianAge: r.who.medianAge,
    urbanRate: r.who.urbanRate,
    dependencyRatio: r.who.dependencyRatio,
    pop60: r.who.ageBuckets?.["60+"],
    pop15_29: r.who.ageBuckets?.["15-29"],
  }));

  const life = supported.map(r => ({
    code: r.code, name: r.name,
    internetPenetration: r.life.internetPenetration,
    socialMediaUsers: r.life.socialMediaUsers,
    avgInternetHours: r.life.avgInternetTime,
    mobileShare: r.life.mobileInternetShare,
    avgTVHours: r.life.avgTVTime,
  }));

  const mind = supported.map(r => ({
    code: r.code, name: r.name,
    trustBusiness: r.mind.trustInBusiness,
    trustMedia: r.mind.trustInMedia,
    trustGov: r.mind.trustInGovernment,
    individualism: r.mind.individualism,
    longTermOrient: r.mind.longTermOrientation,
    innovation: r.mind.innovationOpenness,
  }));

  // love는 ranked 형태 - top interest 추출
  const love = supported.map(r => {
    const entries = Object.entries(r.love || {}).sort((a, b) => b[1] - a[1]);
    return {
      code: r.code, name: r.name,
      topInterest: entries[0]?.[0] || null,
      topInterestScore: entries[0]?.[1] || null,
      top3: entries.slice(0, 3).map(e => e[0]),
    };
  });

  const buy = supported.map(r => ({
    code: r.code, name: r.name,
    ecommerceShare: r.buy.ecommerceShare,
    mobileShare: r.buy.mobileCommerceShare,
    avgMonthly: r.buy.avgMonthlySpend,
    priceSensitivity: r.buy.pricesensitivity,
    reviewDep: r.buy.decisionFactors?.reviews,
  }));

  res.json({
    ok: true,
    coverage: supported.length,
    who, life, mind, love, buy,
    sources: {
      who: "UN Population Division 2024",
      life: "DataReportal Global Digital Reports 2024",
      mind: "World Values Survey + Edelman Trust + Hofstede",
      love: "Google Trends + DataReportal 2024",
      buy: "DataReportal + eMarketer + Statista",
    },
  });
});
