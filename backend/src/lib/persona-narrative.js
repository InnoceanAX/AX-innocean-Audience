// persona-narrative.js
// Stage 2 — Batch LLM narrative synthesis for cohort attribute records.
// Sends 20 personas per call to Gemini 2.5 Flash, concurrency 5.

import { generateJSON, isGeminiAvailable } from "../adapters/gemini.js";

const NARRATIVE_SCHEMA_ITEM = {
  type: "object",
  properties: {
    persona_id: { type: "string" },
    quote: { type: "string" },
    jobs_to_be_done: { type: "array", items: { type: "string" } },
    pain_points: { type: "array", items: { type: "string" } },
    media_diet: {
      type: "array",
      items: {
        type: "object",
        properties: {
          channel: { type: "string" },
          hoursPerDay: { type: "number" },
        },
        required: ["channel", "hoursPerDay"],
      },
    },
    brand_affinity: {
      type: "array",
      items: {
        type: "object",
        properties: {
          brand: { type: "string" },
          score: { type: "number" },
        },
        required: ["brand", "score"],
      },
    },
    lifestyle_tags: { type: "array", items: { type: "string" } },
    values_tags: { type: "array", items: { type: "string" } },
    shopping_style: { type: "string" }, // bargain-hunter|brand-loyal|trend-chaser|value-seeker|curator
    price_sensitivity: { type: "number" },
    // 2026-06-23 (CEO 지시): 광고형식별 수용도 개인 속성. media 탭 차트5를 persona-pool SoT로.
    ad_receptivity: {
      type: "object",
      properties: {
        "영상 광고": { type: "number" },
        "검색 광고": { type: "number" },
        "디스플레이": { type: "number" },
        "소셜 피드": { type: "number" },
        "인플루언서": { type: "number" },
      },
      required: ["영상 광고", "검색 광고", "디스플레이", "소셜 피드", "인플루언서"],
    },
  },
  required: [
    "persona_id", "quote", "jobs_to_be_done", "pain_points",
    "media_diet", "brand_affinity", "lifestyle_tags", "values_tags",
    "shopping_style", "price_sensitivity", "ad_receptivity",
  ],
};

const NARRATIVE_SCHEMA = {
  type: "object",
  properties: {
    personas: { type: "array", items: NARRATIVE_SCHEMA_ITEM },
  },
  required: ["personas"],
};

const SHOPPING_STYLES = ["bargain-hunter", "brand-loyal", "trend-chaser", "value-seeker", "curator"];

// Build a compact prompt for one batch of attribute personas
function buildBatchPrompt(batch, { brand, countryName, localCompetitors }) {
  const personaLines = batch.map(p => {
    return `- id=${p.persona_id} | age=${p.age} (${p.ageBucket}) | gender=${p.gender} | region=${p.region} | income=${p.incomeQuintile} | occupation=${p.occupationLabel || p.occupation} | education=${p.education || "N/A"} | cityTier=${p.cityTier || "N/A"} | price-prior=${p.price_sensitivity || p.priceSensitivityPrior || 3}/5`;
  }).join("\n");

  return `[국가] ${countryName}
[캠페인 브랜드] ${brand}
[현지 주요 경쟁 브랜드 (참고)] ${localCompetitors.join(", ")}

[합성 페르소나 ${batch.length}명 — 통계 기반 속성]
${personaLines}

위 각 페르소나에 대해 다음 narrative를 **반드시 한국어로만** 작성하세요. (보고서는 한국 CEO가 읽음)
**언어 규칙 절대 준수 — 다음 예외 없음**:
- 타겟 국가가 어디이든 **모든 서술(quote, jobs_to_be_done, pain_points, lifestyle_tags, values_tags)는 한국어로**
- 고유명사(브랜드/플랫폼/도시)는 원이름 그대로 써도 무방
- quote: 1문장 (페르소나가 직접 말할 법한 한 줄, **한국어 필수**)
- jobs_to_be_done: 3개 (이 사람이 일상에서 해결하고 싶은 과제 — 캠페인 브랜드(${brand}) 맥락)
- pain_points: 2개 (이 사람의 소비/라이프스타일 고충)
- media_diet: 4~6개 채널 × 시간 (예: [{channel:"Instagram", hoursPerDay:1.5}]). 국가 매체 환경 반영.
- brand_affinity: 4~6개. 반드시 "${brand}" 포함하고, 현지 경쟁 브랜드 중 최소 2개 포함. score 0-100.
- lifestyle_tags: 5개 짧은 태그
- values_tags: 5개 (가치관 키워드)
- shopping_style: 정확히 하나 [bargain-hunter|brand-loyal|trend-chaser|value-seeker|curator]
- price_sensitivity: 1~5 정수
- ad_receptivity: 이 사람의 광고형식별 수용도(0~100 정수). 5개 키 모두 필수: {"영상 광고", "검색 광고", "디스플레이", "소셜 피드", "인플루언서"}. 이 사람의 연령·미디어 소비 성향에 맞게 차등 부여 (예: 소셜 많이 보면 소셜 피드·인플루언서 높게).

⚠️ persona_id 필드에 위 입력 id를 정확히 그대로 복사해주세요.
⚠️ JSON 외 다른 텍스트 금지.`;
}

// Local competitor seed by country — non-comprehensive but useful for prompt grounding.
const LOCAL_COMPETITORS = {
  KR: ["Samsung", "Coupang", "Naver", "CJ", "Hyundai"],
  JP: ["Sony", "Toyota", "Rakuten", "Uniqlo", "Muji"],
  CN: ["Alibaba", "Tencent", "Huawei", "Xiaomi", "ByteDance"],
  TW: ["ASUS", "HTC", "PChome", "Shopee TW", "7-Eleven"],
  TH: ["CP Group", "Central Group", "Lazada TH", "Shopee TH", "AIS"],
  PH: ["SM Group", "Jollibee", "Globe Telecom", "Shopee PH", "Lazada PH"],
};

function competitorsFor(country) {
  return LOCAL_COMPETITORS[country] || ["LocalBrand A", "LocalBrand B", "LocalBrand C"];
}

// CEO 2026-06-18 21:34 긴급: fallback 단일 quote/tags 다양화 (hash 기반 deterministic 분산)
const FALLBACK_QUOTES = [
  "요즘 관심 있는 브랜드를 비교하고 최선의 선택을 하고 싶어요.",
  "트렌디하면서도 가성비 좋은 걸 찾는 게 제일 중요해요.",
  "소셜에서 본 제품, 실제로 써보고 싶어요.",
  "온라인 리뷰 꼼꼼히 보고 구매하는 편이에요.",
  "새로운 브랜드 발견하는 게 스트레스 해소예요.",
  "편리하면서도 품질 좋은 걸 원해요.",
  "환경이나 윤리적 소비에도 신경 쓰는 편이에요.",
  "가족/친구 추천이 구매에 큰 영향을 줘요.",
];
const FALLBACK_JOBS = [
  ["최적의 가성비 제품 찾기", "내 라이프스타일에 맞는 브랜드 발견", "빠르고 편한 구매 경험"],
  ["리뷰 비교로 실패 줄이기", "할인/프로모션 최대 활용", "새로운 트렌드 파악"],
  ["주변 추천 제품 확인", "장기적으로 믿을 수 있는 브랜드 선택", "일상의 편의성 향상"],
  ["환경 부담 적은 소비 실천", "정보 과부하 속 핵심만 파악", "나만의 큐레이션 구축"],
];
const FALLBACK_PAINS = [
  ["정보가 많아서 선택 장애", "배송/반품 절차 번거로움"],
  ["리뷰 신뢰도 판단 어려움", "가격 비교에 시간 소요"],
  ["원하는 제품 품절/재고 부족", "광고성 콘텐츠 피로감"],
  ["개인정보 노출 우려", "브랜드 간 품질 편차"],
];
const FALLBACK_LIFESTYLES = [
  ["주말 카페", "운동 루틴", "넷플릭스", "친구 모임", "맛집 탐방"],
  ["러닝/필라테스", "근교 여행", "홈카페", "음악 감상", "미니멀 정리"],
  ["전시/공연", "독서", "새 브랜드 탐색", "라이프스타일 매거진", "독립서점"],
  ["반려동물 케어", "드라이브", "일상 기록", "요리", "가족 시간"],
  ["e커머스 쇼핑", "브이로그 감상", "SNS 큐레이션", "자기계발", "외식"],
];
const FALLBACK_VALUES = [
  ["자기표현", "트렌드 감각", "가성비", "지속가능", "커뮤니티"],
  ["실용성", "품질", "신뢰", "효율", "가족"],
  ["개성", "독창성", "최신 트렌드", "소셜 노출", "자존감"],
  ["윤리소비", "지역 우선", "공정 거래", "환경", "발자취"],
];

function _pickByHash(arr, key, salt) {
  const h = Math.abs(hashStr(`${key}:${salt}`));
  return arr[h % arr.length];
}

// Fallback narrative when LLM unavailable or batch fails
function fallbackNarrative(p) {
  const styleIdx = Math.abs(hashStr(p.persona_id)) % SHOPPING_STYLES.length;
  const shopping = SHOPPING_STYLES[styleIdx];
  const pid = p.persona_id || `${p.country}:0`;
  return {
    persona_id: p.persona_id,
    quote: _pickByHash(FALLBACK_QUOTES, pid, "q"),
    jobs_to_be_done: _pickByHash(FALLBACK_JOBS, pid, "j"),
    pain_points: _pickByHash(FALLBACK_PAINS, pid, "p"),
    media_diet: defaultMediaDiet(p),
    brand_affinity: defaultBrandAffinity(p),
    lifestyle_tags: _pickByHash(FALLBACK_LIFESTYLES, pid, "l"),
    values_tags: _pickByHash(FALLBACK_VALUES, pid, "v"),
    shopping_style: shopping,
    price_sensitivity: p.price_sensitivity || p.priceSensitivityPrior || 3,
    ad_receptivity: defaultAdReceptivity(p),
  };
}

// 2026-06-23 (CEO 지시): 광고형식별 수용도 fallback. persona_id 해시 시드로 100명 변동 확보.
//   LLM 부재/필드 누락 시 사용. 연령·쇼핑스타일 편향 반영.
function defaultAdReceptivity(p) {
  const pid = p.persona_id || `${p.country}:0`;
  const seed = (salt) => {
    const h = Math.abs(hashStr(`${pid}:adrcv:${salt}`));
    return (h % 21) - 10; // -10 ~ +10 노이즈
  };
  const clamp = (v) => Math.min(95, Math.max(10, Math.round(v)));
  // 기본 성향: 검색>소셜>영상>인플>디스플레이 (국가 무관 공통 baseline + 개인 노이즈)
  return {
    "영상 광고": clamp(55 + seed("v")),
    "검색 광고": clamp(70 + seed("s")),
    "디스플레이": clamp(35 + seed("d")),
    "소셜 피드": clamp(60 + seed("f")),
    "인플루언서": clamp(50 + seed("i")),
  };
}

// ad_receptivity 값 정규화: 5개 키 모두 0~100 숫자 보장, 누락 시 fallback 병합.
function normalizeAdReceptivity(narr, attr) {
  const KEYS = ["영상 광고", "검색 광고", "디스플레이", "소셜 피드", "인플루언서"];
  const src = narr?.ad_receptivity;
  const fb = defaultAdReceptivity(attr);
  const out = {};
  for (const k of KEYS) {
    const v = src && typeof src[k] === "number" ? src[k] : null;
    out[k] = v != null ? Math.min(100, Math.max(0, Math.round(v))) : fb[k];
  }
  return out;
}

// M-7 fix (Chaeyeon 2026-06-17 21:43 → CTO 22:08):
//   Gemini 키 부재 시 100명이 국가당 동일 분포가 되던 변동 0 문제.
//   persona_id 해시 기반 시드로 ±0.3h 노이즈 추가 → 100명 변동 확보.
//   최소 0.1h 클램프로 음수 노출 방지.
function _seededNoise(personaId, channelIdx, range = 0.3) {
  const h = Math.abs(hashStr(`${personaId}:${channelIdx}`));
  // 0~1 구간 해시 정규화 → -range ~ +range
  return ((h % 1000) / 1000 - 0.5) * 2 * range;
}
function _withNoise(personaId, channels) {
  return channels.map((c, i) => ({
    channel: c.channel,
    hoursPerDay: Math.max(0.1, Number((c.hoursPerDay + _seededNoise(personaId, i)).toFixed(2))),
  }));
}

function defaultMediaDiet(p) {
  const pid = p.persona_id || `${p.country}:0`;
  if (p.country === "CN") {
    return _withNoise(pid, [
      { channel: "Xiaohongshu", hoursPerDay: 1.5 },
      { channel: "WeChat",      hoursPerDay: 1.2 },
      { channel: "Douyin",      hoursPerDay: 1.0 },
      { channel: "Weibo",       hoursPerDay: 0.6 },
    ]);
  }
  if (p.country === "JP") {
    return _withNoise(pid, [
      { channel: "LINE",      hoursPerDay: 1.2 },
      { channel: "Twitter/X", hoursPerDay: 1.0 },
      { channel: "Instagram", hoursPerDay: 1.0 },
      { channel: "YouTube",   hoursPerDay: 0.8 },
    ]);
  }
  if (p.country === "TH" || p.country === "PH") {
    return _withNoise(pid, [
      { channel: "Facebook",  hoursPerDay: 1.3 },
      { channel: "TikTok",    hoursPerDay: 1.2 },
      { channel: "Instagram", hoursPerDay: 1.0 },
      { channel: "YouTube",   hoursPerDay: 1.0 },
    ]);
  }
  if (p.country === "TW") {
    return _withNoise(pid, [
      { channel: "Instagram", hoursPerDay: 1.2 },
      { channel: "YouTube",   hoursPerDay: 1.2 },
      { channel: "Facebook",  hoursPerDay: 0.8 },
      { channel: "TikTok",    hoursPerDay: 0.6 },
    ]);
  }
  // KR default
  return _withNoise(pid, [
    { channel: "Instagram",  hoursPerDay: 1.4 },
    { channel: "YouTube",    hoursPerDay: 1.5 },
    { channel: "KakaoTalk",  hoursPerDay: 1.0 },
    { channel: "Naver",      hoursPerDay: 0.6 },
  ]);
}

function defaultBrandAffinity(p, brand = "Campaign Brand") {
  const competitors = competitorsFor(p.country);
  return [
    { brand: brand, score: 65 },
    { brand: competitors[0], score: 55 },
    { brand: competitors[1], score: 45 },
    { brand: competitors[2] || "Global Brand A", score: 50 },
    { brand: competitors[3] || "Global Brand B", score: 48 },
  ];
}

function hashStr(s) {
  let h = 0; for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return h;
}

// Run one batch through Gemini and merge results back into attribute records
async function runOneBatch(batch, opts) {
  const { brand, countryName, country } = opts;
  const localCompetitors = competitorsFor(country);
  const prompt = buildBatchPrompt(batch, { brand, countryName, localCompetitors });

  const system = `당신은 글로벌 소비자 인사이트 리서치 전문가입니다.
주어진 합성 페르소나 속성에 맞는 narrative를 JSON 스키마에 맞게 정확히 생성합니다.
모든 텍스트는 한국어로 작성합니다. 거짓 정보를 만들지 말고 통계적으로 그럴듯한 추론을 제공합니다.`;

  // CEO 2026-06-18 21:34 긴급: 풀 v4 600명 전체 fallback hardcoded 사고 fix
  // 원인: maxOutputTokens 8192 + n=20 = 출력 truncate → JSON parse fail
  // Fix: maxOutputTokens 32768 + retry on fail (split batch in half)
  try {
    const result = await generateJSON({
      prompt,
      system,
      schema: NARRATIVE_SCHEMA,
      model: "gemini-2.5-flash",
      temperature: 0.7,
      maxOutputTokens: 16384,
    });
    if (!result.json?.personas || !Array.isArray(result.json.personas) || result.json.personas.length === 0) {
      throw new Error("Bad LLM output");
    }
    return result.json.personas;
  } catch (e) {
    console.warn(`[narrative] batch failed (${country}, n=${batch.length}): ${e.message} — retry with split`);
    // Retry once with half-size split (n=10 instead of n=20) before falling back
    if (batch.length > 5) {
      try {
        const mid = Math.ceil(batch.length / 2);
        const left = batch.slice(0, mid);
        const right = batch.slice(mid);
        const [lRes, rRes] = await Promise.all([
          runOneBatch(left, opts),
          runOneBatch(right, opts),
        ]);
        return [...lRes, ...rRes];
      } catch (e2) {
        console.warn(`[narrative] retry-split also failed (${country}): ${e2.message} — using fallback`);
      }
    }
    return batch.map(fallbackNarrative);
  }
}

// Merge attribute + narrative into final persona object
export function mergePersona(attr, narr) {
  // Normalize shopping_style + price_sensitivity defensively
  const shoppingStyle = SHOPPING_STYLES.includes(narr?.shopping_style) ? narr.shopping_style : "trend-chaser";
  const priceSens = Math.min(5, Math.max(1, Math.round(narr?.price_sensitivity || attr.priceSensitivityPrior || 3)));
  return {
    ...attr,
    quote: narr?.quote || "",
    jobs_to_be_done: narr?.jobs_to_be_done || [],
    pain_points: narr?.pain_points || [],
    media_diet: Array.isArray(narr?.media_diet) ? narr.media_diet : [],
    brand_affinity: Array.isArray(narr?.brand_affinity) ? narr.brand_affinity : [],
    lifestyle_tags: narr?.lifestyle_tags || [],
    values_tags: narr?.values_tags || [],
    shopping_style: shoppingStyle,
    price_sensitivity: priceSens,
    ad_receptivity: normalizeAdReceptivity(narr, attr),
  };
}

/**
 * Synthesize narratives for a list of attribute personas with batched LLM calls.
 * @param {Array} attrPersonas  flat list of cohort attribute records
 * @param {Object} opts
 * @param {string} opts.brand   campaign brand (e.g. "Musinsa")
 * @param {string} opts.country ISO2 — for prompt context and competitor seed
 * @param {string} opts.countryName  human-readable
 * @param {number} [opts.batchSize=20]
 * @param {number} [opts.concurrency=5]
 * @param {function} [opts.onBatchDone] (doneCount, totalCount) callback for progress
 * @param {function} [opts.shouldCancel] return true to abort remaining batches
 * @returns {Promise<Array>} merged personas (attr + narrative)
 */
export async function synthesizeNarratives(attrPersonas, opts = {}) {
  const {
    brand = "Musinsa",
    country = "KR",
    countryName = "South Korea",
    batchSize = 10,
    concurrency = 2,
    onBatchDone = null,
    onBatchPersist = null, // CEO 2026-06-18 22:30 긴급: batch 단위 DB commit
    shouldCancel = () => false,
  } = opts;

  // Split into batches
  const batches = [];
  for (let i = 0; i < attrPersonas.length; i += batchSize) {
    batches.push(attrPersonas.slice(i, i + batchSize));
  }

  const useFallback = !isGeminiAvailable();
  if (useFallback) {
    console.log(`[narrative] Gemini unavailable, using fallback for all ${attrPersonas.length} personas (${country})`);
    const merged = attrPersonas.map(p => mergePersona(p, fallbackNarrative(p)));
    if (onBatchDone) onBatchDone(merged.length, attrPersonas.length);
    return merged;
  }

  console.log(`[narrative] ${country}: synthesizing ${attrPersonas.length} personas in ${batches.length} batches (size=${batchSize}, concurrency=${concurrency})`);

  // Run batches with concurrency limit
  const results = new Array(batches.length);
  let nextBatch = 0;
  let doneCount = 0;

  async function worker() {
    while (true) {
      if (shouldCancel()) return;
      const idx = nextBatch++;
      if (idx >= batches.length) return;
      const batch = batches[idx];
      try {
        const narratives = await runOneBatch(batch, { brand, countryName, country });
        // Build a quick id→narrative map (LLM may reorder)
        const byId = new Map(narratives.map(n => [n.persona_id, n]));
        results[idx] = batch.map(attr => mergePersona(attr, byId.get(attr.persona_id) || fallbackNarrative(attr)));
      } catch (e) {
        console.warn(`[narrative] batch ${idx} unrecoverable: ${e.message}`);
        results[idx] = batch.map(attr => mergePersona(attr, fallbackNarrative(attr)));
      }
      doneCount += batch.length;
      console.log(`[narrative] ${country}: batch ${idx + 1}/${batches.length} done (${doneCount}/${attrPersonas.length})`);
      // CEO 2026-06-18 22:30 긴급: batch 단위 즉시 persist → SIGTERM 시 휠발 방지
      if (onBatchPersist && results[idx] && results[idx].length) {
        try { await onBatchPersist(results[idx], { country, batchIdx: idx, batchCount: batches.length }); }
        catch (e) { console.warn(`[narrative] onBatchPersist failed (${country}, batch ${idx}): ${e.message}`); }
      }
      if (onBatchDone) onBatchDone(doneCount, attrPersonas.length);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, batches.length) }, () => worker());
  await Promise.all(workers);

  return results.flat().filter(Boolean);
}

export { SHOPPING_STYLES };
