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
  },
  required: [
    "persona_id", "quote", "jobs_to_be_done", "pain_points",
    "media_diet", "brand_affinity", "lifestyle_tags", "values_tags",
    "shopping_style", "price_sensitivity",
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
    return `- id=${p.persona_id} | age=${p.age} (${p.ageBucket}) | gender=${p.gender} | region=${p.region} | income=${p.incomeQuintile} | occupation=${p.occupationLabel} | k-culture=${p.kCultureExposure}/100 | k-fashion=${p.kFashionInterest}/100 | fashion=${p.fashionInterest}/100 | price-prior=${p.priceSensitivityPrior}/5`;
  }).join("\n");

  return `[국가] ${countryName}
[캠페인 브랜드] ${brand}
[현지 주요 경쟁 브랜드 (참고)] ${localCompetitors.join(", ")}

[합성 페르소나 ${batch.length}명 — 통계 기반 속성]
${personaLines}

위 각 페르소나에 대해 다음 narrative를 한국어로 작성하세요. (보고서는 한국 CEO가 읽음)
- quote: 1문장 (페르소나가 직접 말할 법한 한 줄, 한국어)
- jobs_to_be_done: 3개 (이 사람이 K-패션 쇼핑에서 해결하고 싶은 과제)
- pain_points: 2개
- media_diet: 4~6개 채널 × 시간 (예: [{channel:"Instagram", hoursPerDay:1.5}]). 국가 매체 환경 반영(중국=WeChat/Weibo/Xiaohongshu, 한국=Naver/KakaoTalk/유튜브, 일본=LINE/Twitter, 태국/필리핀=Facebook/TikTok 강세, 대만=YouTube/Instagram).
- brand_affinity: 4~6개. 반드시 "${brand}" 포함하고, 현지 경쟁 브랜드(${localCompetitors.join(", ")}) 중 최소 2개 포함. score 0-100.
- lifestyle_tags: 5개 짧은 태그 (예: "주말 카페", "OOTD")
- values_tags: 5개 (MIND 탭용 — 가치관 키워드, 예: "지속가능", "자기표현")
- shopping_style: 정확히 하나 [bargain-hunter|brand-loyal|trend-chaser|value-seeker|curator]
- price_sensitivity: 1~5 정수 (1=가격 무관, 5=극도 민감)

⚠️ persona_id 필드에 위 입력 id를 정확히 그대로 복사해주세요. 순서는 입력과 동일하게.
⚠️ JSON 외 다른 텍스트 금지.`;
}

// Local competitor seed by country — non-comprehensive but useful for prompt grounding.
const LOCAL_COMPETITORS = {
  KR: ["Beanpole", "8seconds", "Spao", "Ader Error", "Kirsh"],
  JP: ["Uniqlo", "GU", "Beams", "Earth Music & Ecology", "WEGO"],
  CN: ["Bosideng", "Peacebird", "Urban Revivo", "MO&Co", "JNBY"],
  TW: ["NET", "Pazzo", "Lativ", "Queen Shop", "Meier Q"],
  TH: ["Greyhound", "Jaspal", "Vatanika", "Sretsis", "Painkiller"],
  PH: ["Bench", "Penshoppe", "Folded & Hung", "Plains & Prints", "Kamiseta"],
};

function competitorsFor(country) {
  return LOCAL_COMPETITORS[country] || ["LocalBrand A", "LocalBrand B", "LocalBrand C"];
}

// Fallback narrative when LLM unavailable or batch fails
function fallbackNarrative(p) {
  const styleIdx = Math.abs(hashStr(p.persona_id)) % SHOPPING_STYLES.length;
  const shopping = SHOPPING_STYLES[styleIdx];
  return {
    persona_id: p.persona_id,
    quote: "K-패션이 요즘 제일 재밌어요. 어디서 사야 진짜인지 알고 싶어요.",
    jobs_to_be_done: [
      "오늘의 K-패션 트렌드를 빠르게 파악하기",
      "내 체형/스타일에 맞는 K-브랜드 찾기",
      "합리적인 가격으로 K-패션 구매하기",
    ],
    pain_points: [
      "현지 사이즈/배송 정보가 부족함",
      "가품/카피 브랜드 구분이 어려움",
    ],
    media_diet: defaultMediaDiet(p),
    brand_affinity: defaultBrandAffinity(p),
    lifestyle_tags: ["OOTD", "주말 카페", "K-드라마 시청", "친구와 쇼핑", "셀카"],
    values_tags: ["자기표현", "트렌드 감각", "가성비", "지속가능", "커뮤니티"],
    shopping_style: shopping,
    price_sensitivity: p.priceSensitivityPrior || 3,
  };
}

function defaultMediaDiet(p) {
  if (p.country === "CN") {
    return [
      { channel: "Xiaohongshu", hoursPerDay: 1.5 },
      { channel: "WeChat",      hoursPerDay: 1.2 },
      { channel: "Douyin",      hoursPerDay: 1.0 },
      { channel: "Weibo",       hoursPerDay: 0.6 },
    ];
  }
  if (p.country === "JP") {
    return [
      { channel: "LINE",      hoursPerDay: 1.2 },
      { channel: "Twitter/X", hoursPerDay: 1.0 },
      { channel: "Instagram", hoursPerDay: 1.0 },
      { channel: "YouTube",   hoursPerDay: 0.8 },
    ];
  }
  if (p.country === "TH" || p.country === "PH") {
    return [
      { channel: "Facebook",  hoursPerDay: 1.3 },
      { channel: "TikTok",    hoursPerDay: 1.2 },
      { channel: "Instagram", hoursPerDay: 1.0 },
      { channel: "YouTube",   hoursPerDay: 1.0 },
    ];
  }
  if (p.country === "TW") {
    return [
      { channel: "Instagram", hoursPerDay: 1.2 },
      { channel: "YouTube",   hoursPerDay: 1.2 },
      { channel: "Facebook",  hoursPerDay: 0.8 },
      { channel: "TikTok",    hoursPerDay: 0.6 },
    ];
  }
  // KR default
  return [
    { channel: "Instagram",  hoursPerDay: 1.4 },
    { channel: "YouTube",    hoursPerDay: 1.5 },
    { channel: "KakaoTalk",  hoursPerDay: 1.0 },
    { channel: "Naver",      hoursPerDay: 0.6 },
  ];
}

function defaultBrandAffinity(p) {
  const competitors = competitorsFor(p.country);
  return [
    { brand: "Musinsa", score: 60 + Math.floor((p.kFashionInterest || 50) / 4) },
    { brand: competitors[0], score: 55 },
    { brand: competitors[1], score: 45 },
    { brand: "Zara", score: 50 },
    { brand: "Uniqlo", score: 48 },
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

  const system = `당신은 글로벌 K-패션 캠페인 리서치 전문가입니다.
주어진 합성 페르소나 속성에 맞는 narrative를 JSON 스키마에 맞게 정확히 생성합니다.
모든 텍스트는 한국어로 작성합니다. 거짓 정보를 만들지 말고 통계적으로 그럴듯한 추론을 제공합니다.`;

  try {
    const result = await generateJSON({
      prompt,
      system,
      schema: NARRATIVE_SCHEMA,
      model: "gemini-2.5-flash",
      temperature: 0.7,
      maxOutputTokens: 8192,
    });
    if (!result.json?.personas) throw new Error("Bad LLM output");
    return result.json.personas;
  } catch (e) {
    console.warn(`[narrative] batch failed (${country}, n=${batch.length}): ${e.message} — using fallback`);
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
    batchSize = 20,
    concurrency = 5,
    onBatchDone = null,
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
      if (onBatchDone) onBatchDone(doneCount, attrPersonas.length);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, batches.length) }, () => worker());
  await Promise.all(workers);

  return results.flat().filter(Boolean);
}

export { SHOPPING_STYLES };
