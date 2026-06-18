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

위 각 페르소나에 대해 다음 narrative를 **반드시 한국어로만** 작성하세요. (보고서는 한국 CEO가 읽음)
**언어 규칙 절대 준수 — 다음 예외 없음**:
- 타겟 국가가 일본/중국/태국/베트남/영어권 등 어디이든 **모든 서술 프래이즈(quote, jobs_to_be_done, pain_points, lifestyle_tags, values_tags)는 한국어로**
- quote가 필리핀 페르소나 입장이더라도 한국어로 (타갈로그 금지)
- lifestyle/values tag도 한국어 (의미 있는 한국어 단어)
- 고유명사(브랜드/플랫폼/도시)는 원이름 그대로 썰도 무방 (예: 'TikTok에서 쇼핑해요')
- quote: 1문장 (페르소나가 직접 말할 법한 한 줄, **한국어 필수**)
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

// CEO 2026-06-18 21:34 긴급: fallback 단일 quote/tags 다양화 (hash 기반 deterministic 분산)
const FALLBACK_QUOTES = [
  "K-패션이 요즘 제일 재밌어요. 어디서 사야 진짜인지 알고 싶어요.",
  "트렌디한 옷을 찾으면서도 가성비는 놓치고 싶지 않아요.",
  "개성 있으면서도 고급스러운 룩을 만드는 게 취미예요.",
  "무신사에서 새로운 브랜드 발견하는 게 스트레스 해소예요.",
  "소셜 피드에서 본 옷, 실제로 입어보고 싶어요.",
  "한국 연예인들 입는 스타일, 이게 진짜 트렌드죠.",
  "편한데 멋있게 입고 싶은 게 제일 중요해요.",
  "온라인에서 사다가 실패한 적 많아서, 이제는 리뷰 꼼꼼히 봐요.",
];
const FALLBACK_JOBS = [
  ["오늘의 K-패션 트렌드를 빠르게 파악하기", "내 체형/스타일에 맞는 K-브랜드 찾기", "합리적인 가격으로 K-패션 구매하기"],
  ["온/오프 종합 코디 점검", "일상복 + 워드로브 조합", "한정판/콜라보 소식 선점"],
  ["멤버십/적립 혜택 최대화", "주말 핫한 OOTD 소재 확보", "소셜용 셀카 무드 만들기"],
  ["트렌드와 내 취향의 균형 찾기", "환경/윤리 부담 적은 브랜드 선택", "장기 착용 가능한 고품질 아이템"],
];
const FALLBACK_PAINS = [
  ["현지 사이즈/배송 정보가 부족함", "가품/카피 브랜드 구분이 어려움"],
  ["고객 리뷰가 적어 실패 리스크 큼", "교환/환불 절차가 복잡"],
  ["국내 배송비 발생, 국제 배송 시간 길음", "알림 광고가 많아서 지침"],
  ["코디 추천이 출처 불분명", "동일 상품 가격 편차 커서 선택 장애"],
];
const FALLBACK_LIFESTYLES = [
  ["OOTD", "주말 카페", "K-드라마 시청", "친구와 쇼핑", "셀카"],
  ["러닝/필라테스", "근교 여행", "홈카페", "플레이리스트 큐레이션", "미니멀 정리"],
  ["전시/공연", "새 브랜드 탐색", "빈티지 마켓", "라이프스타일 매거진", "독립서점"],
  ["홈트 + 식단", "파드캐스트 청취", "슬로우 라이프", "우정 시간 우선", "감성 일상 기록"],
  ["반려동물 케어", "드라이브", "새 카페 발굴", "OOTD 기록", "빈티지 수집"],
  ["e커머스 쇼핑", "브이로그 감상", "운동 루틴", "공구 활용", "가족 외식"],
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
    price_sensitivity: p.priceSensitivityPrior || 3,
  };
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
