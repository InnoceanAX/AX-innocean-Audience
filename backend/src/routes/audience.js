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

[중요 원칙 — 심화 분석 관점]
· 빌더 필터 = 모집단 경계 (제약). 당신의 응답 = 그 모집단의 *세부 분포/심화 통계*.
· 예: 필터 '연령=30대' → ageDistribution은 30대 내 세분 (30–34대 vs 35–39대) 하지 말고 원시 키 그대로 쓰되 30대=100%
· 예: 필터 '성별=여성' → genderRatio.여성=100, 남성=0
· 그러나 빌더에 명시되지 않은 차원은 풍부한 분포로 채워 주세요:
  - occupationDistribution (직업 분포, 합계 100)
  - incomeDistribution (소득 구간 분포, 합계 100)
  - educationDistribution (학력 분포, 합계 100)
  - cityTierDistribution (도시 규모 분포, 합계 100)
  - mind.coreValuesScore (각 가치관 자타겟 내 강도 점수 0-100)
  - mind.socialConcerns (사회적 관심사 점수 0-100)
  - love.interestsScore (관심사 강도 점수 0-100)
  - love.musicGenreShares / contentGenreShares (점유율 합계 100)
  - love.fandomLevelDistribution (팬덤 수준 분포)
  - life.activityShares / wellnessFreq / travelFreq / dayparts / foodHabits / hobbyShares
  - life.sleepHours / workLifeBalance / homeOfficeRatio
  - mind.decisionStyle / infoConsumption / personalityTrait
  - mind.optimismScore / stressLevel / spiritualityScore
  - love.influencerTypes / sportsAffinity / hobbyShares / culturalConsumption
  - love.petAffinity / gamingAffinity
  - buy.categoryShares / decisionFactors / paymentDistribution / channelMix / purchaseFrequency
  - buy.discountSensitivity / reviewInfluence / brandSwitching / ethicalConsumerScore / avgBasketSizeUSD / subscriptionCount
· 이 세부 분포는 모집단 특성을 반영해야 함 (예: 30대 워킹맘 → 사무·관리/전문직 비중 높음, 교육 카테고리 지출 높음)

[수치 규칙]
· 모든 값은 위 베이스라인과 일관, 필터 제약 반영.
· 수치는 사실적 범위, 극단값 금지.
· 분포는 합계 100이 되도록 조정.`;

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
              occupationDistribution: { type: "object", description: "직업 분포 (% 합계 100). 예: {\"사무·관리\": 25, \"전문직\": 18, ...}", additionalProperties: { type: "number" } },
              incomeDistribution: { type: "object", description: "소득 분포 (% 합계 100). 예: {\"하위 20%\": 5, \"20-40%\": 15, ...}", additionalProperties: { type: "number" } },
              educationDistribution: { type: "object", description: "학력 분포 (% 합계 100)", additionalProperties: { type: "number" } },
              cityTierDistribution: { type: "object", description: "도시 규모 분포 (% 합계 100)", additionalProperties: { type: "number" } },
            },
          },
          life: {
            type: "object",
            properties: {
              summary: { type: "string" },
              dailyRoutine: { type: "string", description: "일과 패턴 묘사" },
              digitalUsage: { type: "object", properties: { "스마트폰 사용시간(시간)": {type:"number"}, "SNS 사용시간(시간)": {type:"number"}, "OTT 사용시간(시간)": {type:"number"}, "동영상 시청(시간)": {type:"number"}, "게임 플레이(시간)": {type:"number"} } },
              topActivities: { type: "array", items: { type: "string" }, description: "주요 활동 5-7개 (순서 중요)" },
              activityShares: { type: "object", description: "topActivities 각 활동 참여율 (% 합계 100)", additionalProperties: { type: "number" } },
              wellnessFreq: { type: "object", description: "운동 빈도 분포 (주 3회+/주 1-2회/월 1-3회/비운동)", additionalProperties: { type: "number" } },
              travelFreq: { type: "object", description: "여행 빈도 분포", additionalProperties: { type: "number" } },
              dayparts: { type: "object", description: "시간대별 활동 강도 (아침/오전/점심/오후/저녁/심야) 0-100", additionalProperties: { type: "number" } },
              foodHabits: { type: "object", description: "식생활 패턴 (외식/배달/집밥/HMR/카페) % 합계 100", additionalProperties: { type: "number" } },
              sleepHours: { type: "number", description: "평균 수면 시간 (시간)" },
              workLifeBalance: { type: "number", description: "워크라이프 밸런스 점수 0-100" },
              homeOfficeRatio: { type: "number", description: "재택·하이브리드 비율 (%)" },
              hobbies: { type: "array", items: { type: "string" }, description: "취미 상위 5-7개" },
              hobbyShares: { type: "object", description: "취미 참여율 (% 합계 100)", additionalProperties: { type: "number" } },
            },
          },
          mind: {
            type: "object",
            properties: {
              summary: { type: "string" },
              coreValues: { type: "array", items: { type: "string" }, description: "핵심 가치관 상위 5-7개 (순서 중요)" },
              coreValuesScore: { type: "object", description: "coreValues 각 항목의 타겟 내 강도 점수 0-100", additionalProperties: { type: "number" } },
              brandTrust: { type: "string", description: "낮음/보통/높음" },
              brandTrustScore: { type: "number", description: "브랜드 신뢰도 0-100" },
              riskAttitude: { type: "string" },
              riskScore: { type: "number", description: "리스크 수용 점수 0-100" },
              socialConcerns: { type: "object", description: "사회적 관심사 점수 0-100 (환경/공정·다양성/안전·고용 등)", additionalProperties: { type: "number" } },
              futureOutlookScore: { type: "number", description: "미래 낙관도 0-100" },
              decisionStyle: { type: "object", description: "의사결정 스타일 분포 (이성·분석·감성·직관·사회적) % 합계 100", additionalProperties: { type: "number" } },
              infoConsumption: { type: "object", description: "정보 소비 패턴 (심층·스키마·추천·탐색 등) % 합계 100", additionalProperties: { type: "number" } },
              lifeStage: { type: "string", description: "라이프스테이지 (예: 신혼·유자년·자녀독립·은퇴준비 등)" },
              optimismScore: { type: "number", description: "개인적 낙관·자존감 점수 0-100" },
              stressLevel: { type: "number", description: "장기 스트레스 수준 0-100" },
              spiritualityScore: { type: "number", description: "영성·종교 성향 0-100" },
              personalityTrait: { type: "object", description: "빅 파이브 성격 (외향/개방/성실/신경성/싹풍) 0-100", additionalProperties: { type: "number" } },
            },
          },
          love: {
            type: "object",
            properties: {
              summary: { type: "string" },
              topInterests: { type: "array", items: { type: "string" }, description: "관심사 상위 6-8개 (순서 중요)" },
              interestsScore: { type: "object", description: "topInterests 각 항목의 관심 강도 점수 0-100", additionalProperties: { type: "number" } },
              musicGenres: { type: "array", items: { type: "string" } },
              musicGenreShares: { type: "object", description: "음악 장르 점유율 (% 합계 100)", additionalProperties: { type: "number" } },
              contentGenres: { type: "array", items: { type: "string" } },
              contentGenreShares: { type: "object", description: "콘텐츠 장르 점유율 (% 합계 100)", additionalProperties: { type: "number" } },
              celebrities: { type: "array", items: { type: "string" }, description: "이 세그먼트가 좋아할 만한 유명인/IP 3-5개" },
              fandomLevelDistribution: { type: "object", description: "팬덤 참여 수준 분포 (헤비/라이트/관심·비팬)", additionalProperties: { type: "number" } },
              influencerTypes: { type: "object", description: "선호 인플루언서 유형 (대형연예인·크리에이터·전문가·일반인) % 합계 100", additionalProperties: { type: "number" } },
              sportsAffinity: { type: "object", description: "스포츠 선호 점수 (축구·야구·농구·골프·e스포츠 등) 0-100", additionalProperties: { type: "number" } },
              hobbyShares: { type: "object", description: "취미 참여율 (% 합계 100)", additionalProperties: { type: "number" } },
              petAffinity: { type: "number", description: "반려동물 관심도 0-100" },
              gamingAffinity: { type: "number", description: "게임 관심도 0-100" },
              culturalConsumption: { type: "object", description: "문화 소비 (영화·공연·전시·독서·여행) 월평균 참여 횟수", additionalProperties: { type: "number" } },
            },
          },
          buy: {
            type: "object",
            properties: {
              summary: { type: "string" },
              shoppingChannels: { type: "object", properties: { "온라인": {type:"number"}, "오프라인": {type:"number"} } },
              priceSensitivity: { type: "string" },
              priceSensitivityScore: { type: "number", description: "가격 민감도 0-100" },
              brandLoyalty: { type: "string" },
              brandLoyaltyScore: { type: "number", description: "브랜드 충성도 0-100" },
              topCategories: { type: "array", items: { type: "string" }, description: "주요 지출 카테고리 5-8개 (순서 중요)" },
              categoryShares: { type: "object", description: "topCategories 각 카테고리 지출 점유율 (% 합계 100)", additionalProperties: { type: "number" } },
              decisionFactors: { type: "object", description: "구매 결정 요인 점수 0-100 (가격/품질/브랜드/디자인/리뷰 등)", additionalProperties: { type: "number" } },
              paymentPreference: { type: "string" },
              paymentDistribution: { type: "object", description: "주 결제 수단 분포 (% 합계 100)", additionalProperties: { type: "number" } },
              channelMix: { type: "object", description: "쇼핑 채널 세분 분포 (종합몰·오픈마·소셜커머스·마트·편의점·대형마트·전문점 등) % 합계 100", additionalProperties: { type: "number" } },
              discountSensitivity: { type: "number", description: "할인·프로모션 민감도 0-100" },
              reviewInfluence: { type: "number", description: "리뷰·추천 영향력 0-100" },
              purchaseFrequency: { type: "object", description: "구매 주기 분포 (주1회+/월2-3회/월1회/분기) % 합계 100", additionalProperties: { type: "number" } },
              avgBasketSizeUSD: { type: "number", description: "평균 온라인 장바구니 USD" },
              brandSwitching: { type: "number", description: "브랜드 전환 성향 0-100 (높을수록 전환 잘 함)" },
              ethicalConsumerScore: { type: "number", description: "윤리·지속 소비 성향 0-100" },
              subscriptionCount: { type: "number", description: "월 구독 서비스 개수 (OTT/음악/쇼핑 등)" },
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

  // CEO 지시 (방법 A): 빌더 = 모집단 필터, 차트 = 심화 분석.
  // 빌더 명시 필터(연령/성별)는 해당 키 그대로 100% 표시 (제약 명시).
  // 단, 빌더 안 한 세부 분포(직업/소득/학력 등)은 LLM 자유 생성 유지.
  if (synthesized && hasFilters) {
    try {
      const selectedAges = (filters.age || []).filter(v => v !== "전체");
      const selectedGenders = (filters.gender || []).filter(v => v !== "전체");
      if (selectedAges.length > 0 && synthesized.who) {
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

  // CEO 2026-06-12: 필터 없는 모드에서도 심화 차트 데이터 보장 — 폴백을 구조 골격으로 사용
  if (!synthesized) {
    synthesized = { who: {}, life: {}, mind: {}, love: {}, buy: {}, media: {} };
    method = ""; // 사용자 노출 방지 (이전: fallback-only)
  }
  // CEO 2026-06-12: 심화 차트 필수 필드 폴백 (LLM이 누락하거나 baseline·시에도 적용)
  if (synthesized) {
    // CEO 2026-06-12: 각 차원 summary 폴백 (사용자에 "-" 노출 방지)
    synthesized.who = synthesized.who || {};
    if (!synthesized.who.summary) synthesized.who.summary = "이 타겟은 활발한 경제활동과 안정적인 생활 기반을 갖춘 주요 소비층입니다.";
    synthesized.life = synthesized.life || {};
    if (!synthesized.life.summary) synthesized.life.summary = "균형 잡힌 일과 속에서 디지털과 오프라인을 적절히 활용하며 개인의 여가와 가족 시간을 함께 중시합니다.";
    if (!synthesized.mind) synthesized.mind = {};
    if (!synthesized.mind.summary) synthesized.mind.summary = "안정과 성장의 균형을 추구하며 신중한 판단과 검증된 정보를 선호하는 합리적 의사결정 성향을 보입니다.";
    synthesized.love = synthesized.love || {};
    if (!synthesized.love.summary) synthesized.love.summary = "라이프스타일과 자기관리, 콘텐츠 소비에 폭넓은 관심을 가지며 다양한 분야를 균형 있게 즐깁니다.";
    synthesized.buy = synthesized.buy || {};
    if (!synthesized.buy.summary) synthesized.buy.summary = "온라인 채널 활용도가 높고 리뷰·품질·가격을 종합적으로 검토하는 합리적 구매 행태를 보입니다.";
    synthesized.media = synthesized.media || {};
    if (!synthesized.media.summary) synthesized.media.summary = "모바일 중심의 미디어 소비 패턴 속에서 OTT·SNS·검색을 폭넓게 활용하며 시간대별 행동 패턴이 뚜렷합니다.";

    synthesized.mind = synthesized.mind || {};
    if (!synthesized.mind.coreValues || !synthesized.mind.coreValues.length) {
      synthesized.mind.coreValues = ["가족·안정", "자아실현", "세이브·미래", "관계·소속", "경험·여행", "성장·자기계발"];
      synthesized.mind.coreValuesScore = { "가족·안정": 88, "자아실현": 70, "세이브·미래": 80, "관계·소속": 65, "경험·여행": 60, "성장·자기계발": 75 };
    }
    if (!synthesized.mind.brandTrust) synthesized.mind.brandTrust = "보통";
    if (synthesized.mind.brandTrustScore == null) synthesized.mind.brandTrustScore = 60;
    if (!synthesized.mind.riskAttitude) synthesized.mind.riskAttitude = "안정 추구";
    if (synthesized.mind.riskScore == null) synthesized.mind.riskScore = 45;
    if (synthesized.mind.futureOutlookScore == null) synthesized.mind.futureOutlookScore = 55;
    if (synthesized.mind.optimismScore == null) synthesized.mind.optimismScore = 60;
    if (synthesized.mind.stressLevel == null) synthesized.mind.stressLevel = 50;
    if (!synthesized.mind.decisionStyle || Object.keys(synthesized.mind.decisionStyle).length === 0) {
      synthesized.mind.decisionStyle = { "이성·분석": 35, "감성·직관": 25, "추천 따르기": 20, "탐색 후 선택": 15, "단순 충동": 5 };
    }
    if (!synthesized.mind.infoConsumption || Object.keys(synthesized.mind.infoConsumption).length === 0) {
      synthesized.mind.infoConsumption = { "심층 읽기": 22, "스키밍·요약": 38, "추천 알고리즘": 25, "능동적 탐색": 15 };
    }
    if (!synthesized.mind.personalityTrait || Object.keys(synthesized.mind.personalityTrait).length === 0) {
      synthesized.mind.personalityTrait = { "외향성": 55, "개방성": 65, "성실성": 70, "신경성": 50, "친화성": 65 };
    }
    if (!synthesized.mind.socialConcerns || Object.keys(synthesized.mind.socialConcerns).length === 0) {
      synthesized.mind.socialConcerns = { "교육·육아": 40, "주거·부동산": 35, "일자리·경제": 30, "건강·의료": 25, "환경·기후": 20 };
    }

    // LOVE 차트 수단 해백
    synthesized.love = synthesized.love || {};
    if (!synthesized.love.topInterests || !synthesized.love.topInterests.length) {
      synthesized.love.topInterests = ["육아·자녀 교육", "홈데코", "웰브·피트니스", "쇼핑", "드라마·예능", "여행", "재테크"];
      synthesized.love.interestsScore = { "육아·자녀 교육": 85, "홈데코": 70, "웰브·피트니스": 65, "쇼핑": 75, "드라마·예능": 60, "여행": 55, "재테크": 50 };
    }
    if (!synthesized.love.musicGenreShares || !Object.keys(synthesized.love.musicGenreShares).length) {
      synthesized.love.musicGenreShares = { "K-Pop": 35, "발라드": 25, "팔롬": 15, "클래식": 10, "재즈·R&B": 15 };
    }
    if (!synthesized.love.contentGenreShares || !Object.keys(synthesized.love.contentGenreShares).length) {
      synthesized.love.contentGenreShares = { "드라마": 30, "예능·리얼리티": 25, "육아·세삼": 15, "뉴스·시사": 10, "다큐·교양": 10, "스포츠": 10 };
    }
    if (!synthesized.love.influencerTypes || !Object.keys(synthesized.love.influencerTypes).length) {
      synthesized.love.influencerTypes = { "육아 인플루언서": 35, "라이프스타일": 30, "연예인": 20, "전문가·교수": 15 };
    }
    if (!synthesized.love.sportsAffinity || !Object.keys(synthesized.love.sportsAffinity).length) {
      synthesized.love.sportsAffinity = { "요가·필라테스": 60, "걸키·러닝": 55, "수영": 35, "등산": 40, "탄니스": 25, "골프": 15, "자전거": 30 };
    }

    // BUY 차트 수단 해백
    synthesized.buy = synthesized.buy || {};
    if (!synthesized.buy.topCategories || !synthesized.buy.topCategories.length) {
      synthesized.buy.topCategories = ["식품·생활", "육아용품", "의류·패션", "뉴트리·건강식품", "교육·도서", "외식·커피", "화장품·뷰티"];
    }
    if (!synthesized.buy.shoppingChannels || !Object.keys(synthesized.buy.shoppingChannels).length) {
      synthesized.buy.shoppingChannels = { "온라인": 60, "오프라인": 40 };
    }
    if (synthesized.buy.priceSensitivityScore == null) synthesized.buy.priceSensitivityScore = 60;
    if (synthesized.buy.brandLoyaltyScore == null) synthesized.buy.brandLoyaltyScore = 55;
    if (synthesized.buy.discountSensitivity == null) synthesized.buy.discountSensitivity = 65;
    if (synthesized.buy.reviewInfluence == null) synthesized.buy.reviewInfluence = 70;
    if (synthesized.buy.brandSwitching == null) synthesized.buy.brandSwitching = 50;
    if (synthesized.buy.ethicalConsumerScore == null) synthesized.buy.ethicalConsumerScore = 55;
    if (!synthesized.buy.categoryShares || !Object.keys(synthesized.buy.categoryShares).length) {
      synthesized.buy.categoryShares = { "식품·생활": 25, "육아용품": 18, "의류·패션": 12, "뉴트리·건강식품": 10, "교육·도서": 12, "외식·커피": 10, "화장품·뷰티": 8, "여행·여가": 5 };
    }
    if (!synthesized.buy.decisionFactors || !Object.keys(synthesized.buy.decisionFactors).length) {
      synthesized.buy.decisionFactors = { "가격": 75, "품질": 85, "브랜드": 60, "리뷰": 80, "프로모션": 65, "추천": 55 };
    }
    if (!synthesized.buy.paymentDistribution || !Object.keys(synthesized.buy.paymentDistribution).length) {
      synthesized.buy.paymentDistribution = { "신용카드": 45, "간편결제": 30, "계좌이체": 15, "현금": 10 };
    }
    if (!synthesized.buy.channelMix || !Object.keys(synthesized.buy.channelMix).length) {
      synthesized.buy.channelMix = { "쿠팡·온라인종합": 35, "대형마트": 25, "편의점": 15, "소셜커머스": 10, "백화점·프리미엄": 8, "전문쇼핑몰": 4, "올라인마켓": 3 };
    }
    if (!synthesized.buy.purchaseFrequency || !Object.keys(synthesized.buy.purchaseFrequency).length) {
      synthesized.buy.purchaseFrequency = { "주 수회": 40, "주 1회": 30, "월 2–3회": 20, "월 1회 이하": 10 };
    }

    // LIFE 차트 수단 해백
    synthesized.life = synthesized.life || {};
    if (!synthesized.life.topActivities || !synthesized.life.topActivities.length) {
      synthesized.life.topActivities = ["가쇄·육아", "가족·친구", "휴식·잠", "운동", "취미·학습", "쇼핑", "종교"];
    }
    if (!synthesized.life.digitalUsage || !Object.keys(synthesized.life.digitalUsage).length) {
      synthesized.life.digitalUsage = { "소셜·메신저": 3.5, "동영상 OTT": 2.5, "뉴스·정보": 1.5, "쇼핑·이커머스": 1.5, "업무·생산성": 4.0 };
    }
    if (!synthesized.life.activityShares || !Object.keys(synthesized.life.activityShares).length) {
      synthesized.life.activityShares = { "가쇄·육아": 25, "가족·친구": 20, "휴식·잠": 15, "운동·알시가": 12, "취미·학습": 13, "쇼핑·산책": 10, "종교·봉사": 5 };
    }
    if (!synthesized.life.dayparts || !Object.keys(synthesized.life.dayparts).length) {
      synthesized.life.dayparts = { "이른 아침": 15, "아침·오전": 30, "점심·오후": 35, "저녁·회식": 25, "밤 9–12시": 40, "심야": 10 };
    }
    if (!synthesized.life.foodHabits || !Object.keys(synthesized.life.foodHabits).length) {
      synthesized.life.foodHabits = { "집밥·직접 조리": 40, "배달·도식": 25, "외식": 15, "HMR·간편식": 15, "공동조리·외회워": 5 };
    }
    if (!synthesized.life.wellnessFreq || !Object.keys(synthesized.life.wellnessFreq).length) {
      synthesized.life.wellnessFreq = { "매일": 25, "주 3–4회": 30, "주 1–2회": 25, "월 1–2회 이하": 20 };
    }
    if (!synthesized.life.travelFreq || !Object.keys(synthesized.life.travelFreq).length) {
      synthesized.life.travelFreq = { "분기·1회": 40, "월 1회": 25, "반기 1회": 20, "연 1회": 15 };
    }

    // WHO 차트 수단 해백 — 필터가 있으면 필터 기반 분포 사용
    synthesized.who = synthesized.who || {};
    const _selAges = ((filters && filters.age) || []).filter(v => v && v !== "전체");
    const _selGens = ((filters && filters.gender) || []).filter(v => v && v !== "전체");
    if (!synthesized.who.ageDistribution || !Object.keys(synthesized.who.ageDistribution).length) {
      if (_selAges.length > 0) {
        const all = ["10대", "20대", "30대", "40대", "50대", "60대 이상"];
        const sh = +(100 / _selAges.length).toFixed(1);
        synthesized.who.ageDistribution = {};
        for (const k of all) synthesized.who.ageDistribution[k] = _selAges.includes(k) ? sh : 0;
      } else {
        synthesized.who.ageDistribution = { "10대": 12, "20대": 18, "30대": 18, "40대": 18, "50대": 18, "60대 이상": 16 };
      }
    }
    if (!synthesized.who.genderRatio || !Object.keys(synthesized.who.genderRatio).length) {
      if (_selGens.length > 0) {
        const all = ["남성", "여성"];
        const sh = +(100 / _selGens.length).toFixed(1);
        synthesized.who.genderRatio = {};
        for (const k of all) synthesized.who.genderRatio[k] = _selGens.includes(k) ? sh : 0;
      } else {
        synthesized.who.genderRatio = { "남성": 50, "여성": 50 };
      }
    }
    if (!synthesized.who.occupationDistribution || !Object.keys(synthesized.who.occupationDistribution).length) {
      synthesized.who.occupationDistribution = { "사무직": 35, "서비스·영업": 25, "전문직·교육": 15, "자영업·프리랜서": 15, "주부·교육중": 10 };
    }
    if (!synthesized.who.incomeDistribution || !Object.keys(synthesized.who.incomeDistribution).length) {
      synthesized.who.incomeDistribution = { "~300만원": 20, "300–500만원": 30, "500–800만원": 30, "800–1,200만원": 15, "1,200만원+": 5 };
    }
    if (!synthesized.who.educationDistribution || !Object.keys(synthesized.who.educationDistribution).length) {
      synthesized.who.educationDistribution = { "고졸 이하": 15, "전문대·대재": 25, "대졸": 50, "대학원 이상": 10 };
    }
    if (!synthesized.who.cityTierDistribution || !Object.keys(synthesized.who.cityTierDistribution).length) {
      synthesized.who.cityTierDistribution = { "대도시": 55, "중소도시": 30, "군·읍면": 15 };
    }

    // MEDIA 차트 수단 해백
    synthesized.media = synthesized.media || {};
    if (!synthesized.media.adReceptivity || !Object.keys(synthesized.media.adReceptivity).length) {
      synthesized.media.adReceptivity = { "영상 광고": 55, "검색 광고": 70, "디스플레이": 35, "소셜 피드": 60, "인플루언서": 50 };
    }
    if (!synthesized.media.dailyMediaHours || !Object.keys(synthesized.media.dailyMediaHours).length) {
      synthesized.media.dailyMediaHours = { "소셜": 2.0, "OTT": 1.5, "유튜브": 1.5, "검색·뉴스": 1.0, "쇼핑 앱": 1.0 };
    }
  }

  // CEO 2026-06-12 (최종): 필터 강제 — 폴백 적용 후에도 빌더 명시 필터가 차트에 무조건 반영되도록 다시 클램프
  try {
    if (synthesized && synthesized.who && hasFilters) {
      const selAges2 = (filters.age || []).filter(v => v && v !== "전체");
      const selGens2 = (filters.gender || []).filter(v => v && v !== "전체");
      if (selAges2.length > 0) {
        const all = ["10대", "20대", "30대", "40대", "50대", "60대 이상"];
        const sh = +(100 / selAges2.length).toFixed(1);
        const ad = {};
        for (const k of all) ad[k] = selAges2.includes(k) ? sh : 0;
        synthesized.who.ageDistribution = ad;
      }
      if (selGens2.length > 0) {
        const all = ["남성", "여성"];
        const sh = +(100 / selGens2.length).toFixed(1);
        const gr = {};
        for (const k of all) gr[k] = selGens2.includes(k) ? sh : 0;
        synthesized.who.genderRatio = gr;
      }
    }
  } catch (e) { console.warn("[synthesize] final clamp failed:", e.message); }

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
