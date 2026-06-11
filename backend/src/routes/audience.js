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

// ============================================================
// POST /api/audience/synthesize
// AI 합성 소비자 — 빌더 필터 기반 5차원 세그먼트 데이터 생성
// 입력: { country, filters }
// 출력: { ok, country, filters, segments: { who, life, mind, love, buy } }
// 각 segment는 baseline에서 출발해 LLM으로 필터 컨텍스트 반영한 합성 통계
// ============================================================
audienceRouter.post("/synthesize", async (req, res) => {
  const { country: code = "KR", filters = {} } = req.body || {};
  const meta = COUNTRIES.find(c => c.code === String(code).toUpperCase());
  if (!meta) return res.status(400).json({ ok: false, error: "Unknown country" });

  // 베이스라인 (필터 없는 국가 통계)
  const baselineWho = getDemographics(meta.code);
  const baselineLife = getLifestyle(meta.code);
  const baselineMind = getMindset(meta.code);
  const baselineLove = getInterests(meta.code);
  const baselineBuy = getPurchase(meta.code);
  // 매체 고장 점유 (주요 채널)
  let mediaShare = null;
  try{
    const adSpend = getCountryAdSpend(meta.code);
    if(adSpend) mediaShare = adSpend.channels || null;
  }catch(e){}

  // 필터 요약 → 사람이 읽기 좋은 한국어
  const filterSummary = Object.entries(filters)
    .filter(([_, v]) => Array.isArray(v) && v.length > 0 && !v.includes("전체"))
    .map(([k, v]) => `${k}=${v.join("/")}`)
    .join(", ") || "(필터 없음)";

  const hasFilters = filterSummary !== "(필터 없음)";

  // 합성 시도 (Gemini)
  const { generateJSON, isGeminiAvailable } = await import("../adapters/gemini.js");
  let synthesized = null;
  let method = "baseline-only";

  if (hasFilters && isGeminiAvailable() && process.env.SYNTHESIZE_USE_LLM !== "0") {
    try {
      const sys = `당신은 광고 솔루션의 오디언스 합성 통계 생성기입니다.
입력으로 받은 국가 + 세그먼트 필터에 대해 5차원(Who/Life/Mind/Love/Buy) 통계를 추정합니다.
각 수치는 0~100 범위의 비중(%)이며 카테고리별로 합이 100에 가깝게 만드세요.
실제 학술/업계 추정에 가까운 합리적 수치를 제시합니다.
출처는 'AI 합성 추정 (GWI/Statista/DataReportal 일반 트렌드 기반)'으로 표기합니다.

[언어 규칙 - 절대 준수]
모든 설명·요약·키워드는 **반드시 한국어**로 작성합니다.
- 국가가 일본·중국·영어권 등 어디이든 설명은 한국어로만.
- 일본어(ひらがな·カタカナ·漢字 단독)·중국어(간체자)·기타 현지어는 절대 사용 금지.
- 고유명사(브랜드/플랫폼 등)는 원이름 그대로 쓸 수 있으나 이외 서술은 전부 한국어.`;

      const chartBaseline = `

[차트에 표시되는 실제 데이터 — 합성치는 이 값들과 일관되게 조정]
· Who(인구통계) 베이스라인: ${baselineWho ? JSON.stringify(baselineWho).slice(0, 600) : 'N/A'}
· Life(라이프스타일) 베이스라인: ${baselineLife ? JSON.stringify(baselineLife).slice(0, 600) : 'N/A'}
· Mind(가치관) 베이스라인: ${baselineMind ? JSON.stringify(baselineMind).slice(0, 600) : 'N/A'}
· Love(관심사) 베이스라인: ${baselineLove ? JSON.stringify(baselineLove).slice(0, 600) : 'N/A'}
· Buy(구매) 베이스라인: ${baselineBuy ? JSON.stringify(baselineBuy).slice(0, 600) : 'N/A'}${mediaShare ? `
· Media(매체 광고비 점유): ${JSON.stringify(mediaShare).slice(0, 600)}` : ''}

[일관성 규칙 — 강제]
· 위 베이스라인은 실제 차트에 그려지는 국가 평균 값입니다.
· 합성 세그먼트 통계는 이 국가 평균을 **필터(제약 조건)으로 조정한 값**이 되어야 합니다.
· 예: 국가 올라인 쿠머스 이용률 60% → 20-30대 세그먼트는 75% 수준으로 상향 조정 (5-20% 상향).
· 국가 평균과 완전히 모순되는 값(예: 50%p 이상 차이)은 금지.
· 매체 광고비 점유율이 주어지면 media.topChannels/adReceptivity는 그 순서·점유육을 반영.`;

      const prompt = `국가: ${meta.name} (${meta.code})
세그먼트 필터: ${filterSummary}${chartBaseline}

위 세그먼트의 5차원 + Media 합성 통계를 JSON으로 생성하세요.
- 모든 값은 위 베이스라인과 일관되게서도 **필터 제약 반영**된 값.
- 수치는 사실적 범위, 극단값 금지.`;

      const schema = {
        type: "object",
        properties: {
          who: {
            type: "object",
            properties: {
              summary: { type: "string", description: "이 세그먼트의 인구통계 요약 (1-2문장)" },
              ageDistribution: { type: "object", properties: { "10대": {type:"number"}, "20대": {type:"number"}, "30대": {type:"number"}, "40대": {type:"number"}, "50대": {type:"number"}, "60대 이상": {type:"number"} } },
              genderRatio: { type: "object", properties: { "남성": {type:"number"}, "여성": {type:"number"} } },
              incomeLevel: { type: "string", description: "예: 상위 20%, 중상위 등" },
              householdType: { type: "string" },
            },
          },
          life: {
            type: "object",
            properties: {
              summary: { type: "string" },
              dailyRoutine: { type: "string", description: "일과 패턴 묘사" },
              digitalUsage: { type: "object", properties: { "스마트폰 사용시간(시간)": {type:"number"}, "SNS 사용시간(시간)": {type:"number"}, "OTT 사용시간(시간)": {type:"number"} } },
              topActivities: { type: "array", items: { type: "string" } },
            },
          },
          mind: {
            type: "object",
            properties: {
              summary: { type: "string" },
              coreValues: { type: "array", items: { type: "string" } },
              brandTrust: { type: "string", description: "낮음/보통/높음" },
              riskAttitude: { type: "string" },
            },
          },
          love: {
            type: "object",
            properties: {
              summary: { type: "string" },
              topInterests: { type: "array", items: { type: "string" } },
              musicGenres: { type: "array", items: { type: "string" } },
              contentGenres: { type: "array", items: { type: "string" } },
              celebrities: { type: "array", items: { type: "string" }, description: "이 세그먼트가 좋아할 만한 유명인/IP 3-5개" },
            },
          },
          buy: {
            type: "object",
            properties: {
              summary: { type: "string" },
              shoppingChannels: { type: "object", properties: { "온라인": {type:"number"}, "오프라인": {type:"number"} } },
              priceSensitivity: { type: "string" },
              brandLoyalty: { type: "string" },
              topCategories: { type: "array", items: { type: "string" }, description: "주요 지출 카테고리 3-5개" },
              paymentPreference: { type: "string" },
            },
          },
          media: {
            type: "object",
            properties: {
              summary: { type: "string", description: "이 세그먼트의 미디어 소비 특징 요약 (1-2문장)" },
              dailyMediaHours: { type: "object", properties: { "TV": {type:"number"}, "온라인 동영상": {type:"number"}, "SNS": {type:"number"}, "음악/스트리밍": {type:"number"}, "검색/뉴스": {type:"number"} } },
              topChannels: { type: "array", items: { type: "string" }, description: "주요 매체 3-5개 (국가 맞춤)" },
              adReceptivity: { type: "object", properties: { "디스플레이": {type:"number"}, "동영상": {type:"number"}, "검색": {type:"number"}, "SNS": {type:"number"}, "TV": {type:"number"} }, description: "광고 수용도 0-100" },
              preferredFormat: { type: "string", description: "선호 광고 포맷 (예: 쇼츠 동영상, 인플루언서 콘텐츠)" },
            },
          },
        },
        required: ["who", "life", "mind", "love", "buy"],
      };

      const result = await generateJSON({
        prompt, system: sys, schema,
        model: "gemini-2.5-flash", temperature: 0.4,
      });
      if (result.json) {
        synthesized = result.json;
        method = "gemini-2.5-flash";
      }
    } catch (e) {
      console.warn("[synthesize] LLM failed:", e.message);
    }
  }

  // 명시 필터 강제 일치화: 사용자가 명시로 선택한 연령/성별은 100%로 고정
  // CEO 지적: '30대·여성' 선택했으면 차트도 100%로 보이도록
  if (synthesized && hasFilters) {
    try {
      const selectedAges = (filters.age || []).filter(v => v !== "전체");
      const selectedGenders = (filters.gender || []).filter(v => v !== "전체");
      if (selectedAges.length > 0 && synthesized.who) {
        // 디멘션 옵션: ['10대', '20대', '30대', '40대', '50대', '60대 이상']
        const allAgeKeys = ["10대", "20대", "30대", "40대", "50대", "60대 이상"];
        const newAge = {};
        const share = +(100 / selectedAges.length).toFixed(1);
        for (const k of allAgeKeys) {
          newAge[k] = selectedAges.includes(k) ? share : 0;
        }
        synthesized.who.ageDistribution = newAge;
      }
      if (selectedGenders.length > 0 && synthesized.who) {
        const allGenderKeys = ["남성", "여성"];
        const newGen = {};
        const share = +(100 / selectedGenders.length).toFixed(1);
        for (const k of allGenderKeys) {
          newGen[k] = selectedGenders.includes(k) ? share : 0;
        }
        synthesized.who.genderRatio = newGen;
      }
    } catch (e) {
      console.warn("[synthesize] filter clamp failed:", e.message);
    }
  }

  res.json({
    ok: true,
    country: meta,
    filters,
    filterSummary,
    hasFilters,
    segments: synthesized,
    baseline: hasFilters ? null : {
      who: baselineWho,
      life: baselineLife,
    },
    source: {
      type: synthesized ? "AI 합성 추정" : "공개 데이터 베이스라인",
      attribution: synthesized
        ? "AI 합성 (GWI/Statista/DataReportal 일반 트렌드 기반 추정)"
        : "UN Population Division + DataReportal 2024",
      caveat: synthesized
        ? "실측 데이터가 아닌 AI 추정치이며, 의사결정용으로 사용 시 별도 검증이 필요합니다."
        : null,
    },
    method,
  });
});
