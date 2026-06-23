/**
 * dimension-mapping.js — BASELINE 5dim → 페르소나 6dim 명시적 매핑 + 가중 평균
 *
 * CEO 정책: 근거 없는 추정 금지. 모든 dimension 값은 BASELINE 출처와 가중치로 추적 가능해야 한다.
 *
 * 작성일: 2026-06-18
 * 작성자: Sohee (CTO) — Phase 1f D
 *
 * 사용 패턴:
 *   import { MAPPING_RULES_BY_DIMENSION, applyMapping, getMappingRuleSet } from './dimension-mapping.js';
 *   const rule = getMappingRuleSet('who');
 *   const { values, sources } = applyMapping('KR', baselines, rule);
 */

/* ──────────────────────────────────────────────────────────────────────────
 *  WHO (4): age / gender / region / income
 *  소비자 기본 속성. DEMOGRAPHICS 단일 출처 매핑 위주.
 * ──────────────────────────────────────────────────────────────────────── */
const WHO_MAPPING_RULES = {
  age: {
    sources: [
      {
        dim: 'DEMOGRAPHICS',
        field: 'ageBuckets',
        weight: 1.0,
        rationale: 'UN World Population Prospects 2024 연령 분포 직접 매핑',
      },
    ],
  },
  gender: {
    sources: [
      {
        dim: 'DEMOGRAPHICS',
        field: 'sexRatio',
        weight: 1.0,
        rationale: 'World Bank Gender Statistics 2024 성비 직접 매핑',
      },
    ],
  },
  region: {
    sources: [
      {
        dim: 'DEMOGRAPHICS',
        field: 'urbanRate',
        weight: 0.5,
        rationale: 'UN World Urbanization Prospects 2024 도시화율',
      },
      {
        dim: 'DEMOGRAPHICS',
        field: 'regions',
        weight: 0.5,
        rationale: '국가 통계청 행정구역별 인구 분포',
      },
    ],
  },
  income: {
    sources: [
      {
        dim: 'DEMOGRAPHICS',
        field: 'incomeQuintile',
        weight: 0.7,
        rationale: 'OECD Income Distribution Database 가구 소득 5분위',
      },
      {
        dim: 'PURCHASE_BEHAVIOR',
        field: 'avgMonthlySpend',
        weight: 0.3,
        rationale: 'DataReportal Digital 2025 월평균 지출 보정',
      },
    ],
  },
};

/* ──────────────────────────────────────────────────────────────────────────
 *  LIFE (5): socialMediaUsers / internetPenetration / internetUsageTime / activities / occupation
 *  생활 패턴. LIFESTYLE 출처 중심 + DEMOGRAPHICS 보조.
 * ──────────────────────────────────────────────────────────────────────── */
const LIFE_MAPPING_RULES = {
  socialMediaUsers: {
    sources: [
      {
        dim: 'LIFESTYLE',
        field: 'socialMediaUsers',
        weight: 1.0,
        rationale: 'DataReportal Digital 2025 소셜미디어 사용률 직접 매핑',
      },
    ],
  },
  internetPenetration: {
    sources: [
      {
        dim: 'LIFESTYLE',
        field: 'internetPenetration',
        weight: 1.0,
        rationale: 'ITU World Telecommunication Indicators 2025 인터넷 보급률',
      },
    ],
  },
  internetUsageTime: {
    sources: [
      {
        dim: 'LIFESTYLE',
        field: 'avgInternetTime',
        weight: 1.0,
        rationale: 'DataReportal Digital 2025 일평균 인터넷 사용 시간',
      },
    ],
  },
  activities: {
    sources: [
      {
        dim: 'LIFESTYLE',
        field: 'activities',
        weight: 0.7,
        rationale: 'GWI Global Web Index 2025 여가 활동 분포',
      },
      {
        dim: 'INTERESTS',
        field: 'topInterests',
        weight: 0.3,
        rationale: 'GWI 관심사 top-N 보정',
      },
    ],
  },
  occupation: {
    sources: [
      {
        dim: 'DEMOGRAPHICS',
        field: 'urbanRate',
        weight: 0.4,
        rationale: '도시화율 기반 화이트칼라 비중 추정',
      },
      {
        dim: 'DEMOGRAPHICS',
        field: 'incomeQuintile',
        weight: 0.6,
        rationale: 'OECD 소득 5분위와 직종 상관 (Goldthorpe 직업 계급)',
      },
    ],
  },
};

/* ──────────────────────────────────────────────────────────────────────────
 *  MIND (6): trustInBusiness / trustInMedia / individualism / longTermOrientation /
 *            riskAversion / environmentImportance
 *  가치관. MINDSET 중심, Hofstede 6D 학술 근거 명시.
 * ──────────────────────────────────────────────────────────────────────── */
const MIND_MAPPING_RULES = {
  trustInBusiness: {
    sources: [
      {
        dim: 'MINDSET',
        field: 'trustInBusiness',
        weight: 1.0,
        rationale: 'Edelman Trust Barometer 2025 기업 신뢰도',
      },
    ],
  },
  trustInMedia: {
    sources: [
      {
        dim: 'MINDSET',
        field: 'trustInMedia',
        weight: 0.7,
        rationale: 'Reuters Digital News Report 2025 미디어 신뢰도',
      },
      {
        dim: 'MINDSET',
        field: 'trustInGovernment',
        weight: 0.3,
        rationale: 'OECD Trust in Government 2025 (제도 신뢰 보정)',
      },
    ],
  },
  individualism: {
    sources: [
      {
        dim: 'MINDSET',
        field: 'individualism',
        weight: 1.0,
        rationale: 'Hofstede IDV 정규화 (개인주의 지수)',
      },
    ],
  },
  longTermOrientation: {
    sources: [
      {
        dim: 'MINDSET',
        field: 'longTermOrientation',
        weight: 1.0,
        rationale: 'Hofstede LTO 정규화 (장기 지향성)',
      },
    ],
  },
  riskAversion: {
    sources: [
      {
        dim: 'MINDSET',
        field: 'riskAversion',
        weight: 0.7,
        rationale: 'Hofstede UAI 정규화 (불확실성 회피)',
      },
      {
        dim: 'MINDSET',
        field: 'traditionalValues',
        weight: 0.3,
        rationale: 'World Values Survey 7 전통 가치 보정',
      },
    ],
  },
  environmentImportance: {
    sources: [
      {
        dim: 'MINDSET',
        field: 'environmentImportance',
        weight: 0.6,
        rationale: 'WVS 7 환경 중요도 응답',
      },
      {
        dim: 'INTERESTS',
        field: 'sustainability',
        weight: 0.4,
        rationale: 'GWI Sustainability 관심도 보정',
      },
    ],
  },
};

/* ──────────────────────────────────────────────────────────────────────────
 *  LOVE (6): topInterests / kCulture / kFashion / fashion / food / travel
 *  취향·관심사. INTERESTS 중심.
 * ──────────────────────────────────────────────────────────────────────── */
const LOVE_MAPPING_RULES = {
  topInterests: {
    sources: [
      {
        dim: 'INTERESTS',
        field: 'topInterests',
        weight: 1.0,
        rationale: 'GWI Global Web Index 2025 관심사 top-N 직접 매핑',
      },
    ],
  },
  kCulture: {
    sources: [
      {
        dim: 'INTERESTS',
        field: 'kCulture',
        weight: 1.0,
        rationale: 'KOFICE 한류실태조사 2025 K-Culture 호감도',
      },
    ],
  },
  kFashion: {
    sources: [
      {
        dim: 'INTERESTS',
        field: 'kFashion',
        weight: 0.7,
        rationale: 'KOFICE 한류실태조사 2025 K-Fashion 관심도',
      },
      {
        dim: 'INTERESTS',
        field: 'kCulture',
        weight: 0.3,
        rationale: 'K-Culture 전반 호감도 spillover 보정',
      },
    ],
  },
  fashion: {
    sources: [
      {
        dim: 'INTERESTS',
        field: 'fashion',
        weight: 1.0,
        rationale: 'GWI 패션 관심도 직접 매핑',
      },
    ],
  },
  food: {
    sources: [
      {
        dim: 'INTERESTS',
        field: 'food',
        weight: 0.7,
        rationale: 'GWI 식음료 관심도',
      },
      {
        dim: 'PURCHASE_BEHAVIOR',
        field: 'diningOut',
        weight: 0.3,
        rationale: '외식 지출 비중 보정',
      },
    ],
  },
  travel: {
    sources: [
      {
        dim: 'INTERESTS',
        field: 'travel',
        weight: 0.5,
        rationale: 'GWI 여행 관심도',
      },
      {
        dim: 'PURCHASE_BEHAVIOR',
        field: 'travelDomestic',
        weight: 0.25,
        rationale: 'UNWTO 국내 여행 지출',
      },
      {
        dim: 'PURCHASE_BEHAVIOR',
        field: 'travelInternational',
        weight: 0.25,
        rationale: 'UNWTO 해외 여행 지출',
      },
    ],
  },
};

/* ──────────────────────────────────────────────────────────────────────────
 *  BUY (6): ecommerceShare / mobileCommerceShare / paymentMethods /
 *           topCategories / decisionFactors / brandLoyalty
 *  구매 행동. PURCHASE_BEHAVIOR 중심.
 * ──────────────────────────────────────────────────────────────────────── */
const BUY_MAPPING_RULES = {
  ecommerceShare: {
    sources: [
      {
        dim: 'PURCHASE_BEHAVIOR',
        field: 'ecommerceShare',
        weight: 1.0,
        rationale: 'eMarketer Worldwide Retail eCommerce 2025 이커머스 점유율',
      },
    ],
  },
  mobileCommerceShare: {
    sources: [
      {
        dim: 'PURCHASE_BEHAVIOR',
        field: 'mobileCommerceShare',
        weight: 1.0,
        rationale: 'eMarketer Mobile Commerce 2025 m-commerce 점유율',
      },
    ],
  },
  paymentMethods: {
    sources: [
      {
        dim: 'PURCHASE_BEHAVIOR',
        field: 'paymentMethods',
        weight: 1.0,
        rationale: 'WorldPay Global Payments Report 2025 결제 수단 분포',
      },
    ],
  },
  topCategories: {
    sources: [
      {
        dim: 'PURCHASE_BEHAVIOR',
        field: 'topCategories',
        weight: 1.0,
        rationale: 'Statista Consumer Market Outlook 2025 카테고리별 지출',
      },
    ],
  },
  decisionFactors: {
    sources: [
      {
        dim: 'PURCHASE_BEHAVIOR',
        field: 'decisionFactors',
        weight: 0.7,
        rationale: 'Nielsen Global Consumer Confidence 2025 구매 결정 요인',
      },
      {
        dim: 'MINDSET',
        field: 'trustInBusiness',
        weight: 0.3,
        rationale: '기업 신뢰도와 결정 요인 상관 보정',
      },
    ],
  },
  brandLoyalty: {
    sources: [
      {
        dim: 'PURCHASE_BEHAVIOR',
        field: 'brandLoyalty',
        weight: 0.7,
        rationale: 'Bain Brand Loyalty Index 2025',
      },
      {
        dim: 'MINDSET',
        field: 'traditionalValues',
        weight: 0.3,
        rationale: 'WVS 전통 가치와 충성도 상관 보정',
      },
    ],
  },
};

/* ──────────────────────────────────────────────────────────────────────────
 *  MEDIA (5): channelShare / mobileBroadband / socialMediaUsers /
 *             topPlatforms / newsConsumption
 *  미디어 소비. LIFESTYLE + ADSPEND 혼합.
 * ──────────────────────────────────────────────────────────────────────── */
const MEDIA_MAPPING_RULES = {
  channelShare: {
    sources: [
      {
        dim: 'ADSPEND',
        field: 'channels',
        weight: 1.0,
        rationale: 'WARC/Dentsu Ad Spend 2025 채널별 광고비 점유율',
      },
    ],
  },
  mobileBroadband: {
    sources: [
      {
        dim: 'LIFESTYLE',
        field: 'mobileBroadband',
        weight: 1.0,
        rationale: 'ITU Mobile Broadband Subscriptions 2025',
      },
    ],
  },
  socialMediaUsers: {
    sources: [
      {
        dim: 'LIFESTYLE',
        field: 'socialMediaUsers',
        weight: 1.0,
        rationale: 'DataReportal Digital 2025 소셜미디어 사용률',
      },
    ],
  },
  topPlatforms: {
    sources: [
      {
        dim: 'LIFESTYLE',
        field: 'topPlatforms',
        weight: 1.0,
        rationale: 'DataReportal Digital 2025 플랫폼 사용 순위',
      },
    ],
  },
  newsConsumption: {
    sources: [
      {
        dim: 'INTERESTS',
        field: 'news',
        weight: 0.6,
        rationale: 'Reuters Digital News Report 2025 뉴스 소비',
      },
      {
        dim: 'MINDSET',
        field: 'trustInMedia',
        weight: 0.4,
        rationale: '미디어 신뢰도와 뉴스 소비 상관 보정',
      },
    ],
  },
};

/**
 * BASELINE 5dim → 페르소나 6dim 매핑 규칙 (총 32 항목).
 *
 * 구조:
 *   MAPPING_RULES_BY_DIMENSION[dim][field].sources = [{ dim, field, weight, rationale }, ...]
 *
 * dim 값(소문자): 'who' | 'life' | 'mind' | 'love' | 'buy' | 'media'
 * source.dim(대문자): 'DEMOGRAPHICS' | 'LIFESTYLE' | 'MINDSET' | 'INTERESTS' | 'PURCHASE_BEHAVIOR' | 'ADSPEND'
 *
 * @type {Object<string, Object<string, { sources: Array<{ dim: string, field: string, weight: number, rationale: string }> }>>}
 */
export const MAPPING_RULES_BY_DIMENSION = {
  who: WHO_MAPPING_RULES,
  life: LIFE_MAPPING_RULES,
  mind: MIND_MAPPING_RULES,
  love: LOVE_MAPPING_RULES,
  buy: BUY_MAPPING_RULES,
  media: MEDIA_MAPPING_RULES,
};

/* BASELINE source.dim (대문자) → baselines 객체 키 (소문자) 매핑 */
const SOURCE_DIM_TO_BASELINE_KEY = {
  DEMOGRAPHICS: 'demographics',
  LIFESTYLE: 'lifestyle',
  MINDSET: 'mindset',
  INTERESTS: 'interests',
  PURCHASE_BEHAVIOR: 'purchase',
  ADSPEND: 'adspend',
};

/**
 * 페르소나 dimension에 대한 매핑 규칙 객체 반환.
 *
 * @param {('who'|'life'|'mind'|'love'|'buy'|'media')} dimension - 페르소나 dimension 키
 * @returns {Object|undefined} 해당 dimension의 매핑 규칙 객체 (없으면 undefined)
 */
export function getMappingRuleSet(dimension) {
  return MAPPING_RULES_BY_DIMENSION[dimension];
}

/**
 * BASELINE 데이터에 매핑 규칙을 적용해 dimension 값과 출처를 산출.
 *
 * 동작:
 *  - 각 field의 sources를 순회하며 baseline[baselineKey][source.field] 값을 수집
 *  - baseline 또는 값이 없는 source는 건너뜀
 *  - 사용 가능한 source가 하나도 없으면 values[field] = null
 *  - 그 외에는 가중 평균: Σ(value × weight) / Σ(weight) — 일부 source 부재 시 자동 정규화
 *
 * @param {string} country - 국가 코드 (KR/JP/CN/TW/TH/PH). 현재는 trace용으로만 사용
 * @param {Object} baselines - { demographics, lifestyle, mindset, interests, purchase, adspend } (각 객체 or undefined)
 * @param {Object} ruleSet - MAPPING_RULES_BY_DIMENSION[dim] 한 개
 * @returns {{ values: Object<string, (number|null)>, sources: Array<{ field: string, sources: Array<{ dim: string, field: string, weight: number, rationale: string, value: number }> }> }}
 */
export function applyMapping(country, baselines, ruleSet) {
  const values = {};
  const sources = [];

  if (!ruleSet || typeof ruleSet !== 'object') {
    return { values, sources };
  }

  const safeBaselines = baselines || {};

  for (const [field, rule] of Object.entries(ruleSet)) {
    const ruleSources = Array.isArray(rule?.sources) ? rule.sources : [];
    const usedSources = [];
    let weightedSum = 0;
    let totalWeight = 0;

    for (const src of ruleSources) {
      const baselineKey = SOURCE_DIM_TO_BASELINE_KEY[src.dim];
      if (!baselineKey) continue;

      const baseline = safeBaselines[baselineKey];
      if (!baseline || typeof baseline !== 'object') continue;

      const rawValue = baseline[src.field];
      if (rawValue === null || rawValue === undefined) continue;

      const numValue = Number(rawValue);
      if (!Number.isFinite(numValue)) continue;

      const weight = Number(src.weight) || 0;
      if (weight <= 0) continue;

      weightedSum += numValue * weight;
      totalWeight += weight;

      usedSources.push({
        dim: src.dim,
        field: src.field,
        weight,
        rationale: src.rationale,
        value: numValue,
      });
    }

    if (totalWeight > 0) {
      values[field] = weightedSum / totalWeight;
    } else {
      values[field] = null;
    }

    sources.push({ field, sources: usedSources });
  }

  return { values, sources };
}
