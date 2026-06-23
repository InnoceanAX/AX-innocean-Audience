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
    // 2026-06-23 (CEO 지시): 4개 탭 baseline 차트(탭당 6개) persona-pool SoT 확장.
    // life — 활동 점수(radar) + 4종 dist + travelType
    activities: {
      type: "object",
      properties: {
        "운동": { type: "number" }, "독서": { type: "number" }, "게임": { type: "number" },
        "여행": { type: "number" }, "외식": { type: "number" }, "쇼핑": { type: "number" },
      },
      required: ["운동", "독서", "게임", "여행", "외식", "쇼핑"],
    },
    travelType: { type: "string" },     // 국내|해외|국내+해외
    activeDaypart: { type: "string" },   // 아침|낮|저녁|밤
    foodHabit: { type: "string" },       // 집밥|외식|배달|간편식
    wellnessFreq: { type: "string" },    // 안함|주1-2|주3-4|매일
    travelFreq: { type: "string" },      // 연1회미만|연1-2회|연3-4회|연5회+
    // mind — coreValues + mindset radar + 4종 dist + bigFive
    coreValues: {
      type: "object",
      properties: {
        "성취": { type: "number" }, "안정": { type: "number" }, "자유": { type: "number" },
        "관계": { type: "number" }, "성장": { type: "number" },
      },
      required: ["성취", "안정", "자유", "관계", "성장"],
    },
    mindset: {
      type: "object",
      properties: {
        "브랜드신뢰": { type: "number" }, "리스크수용": { type: "number" },
        "미래낙관": { type: "number" }, "개인낙관": { type: "number" }, "스트레스": { type: "number" },
      },
      required: ["브랜드신뢰", "리스크수용", "미래낙관", "개인낙관", "스트레스"],
    },
    socialConcern: { type: "string" },   // 환경|공정|다양성|동물복지
    decisionStyle: { type: "string" },   // 직관|분석|추천의존|가격우선
    infoSource: { type: "string" },      // SNS|검색|지인|전문매체
    bigFive: {
      type: "object",
      properties: {
        "개방성": { type: "number" }, "성실성": { type: "number" }, "외향성": { type: "number" },
        "우호성": { type: "number" }, "신경성": { type: "number" },
      },
      required: ["개방성", "성실성", "외향성", "우호성", "신경성"],
    },
    // love — interests radar/bar + music/content/influencer dist + sportsAffinity radar
    interests: {
      type: "object",
      properties: {
        "패션": { type: "number" }, "뷰티": { type: "number" }, "테크": { type: "number" },
        "음식": { type: "number" }, "여행": { type: "number" }, "운동": { type: "number" },
        "게임": { type: "number" }, "문화": { type: "number" },
      },
      required: ["패션", "뷰티", "테크", "음식", "여행", "운동", "게임", "문화"],
    },
    musicGenre: { type: "string" },      // K-pop|팝|힙합|인디|클래식|발라드
    contentGenre: { type: "string" },    // 드라마|예능|영화|다큐|스포츠중계|애니
    influencerType: { type: "string" },  // 메가|마이크로|전문가|연예인
    sportsAffinity: {
      type: "object",
      properties: {
        "축구": { type: "number" }, "야구": { type: "number" }, "농구": { type: "number" },
        "골프": { type: "number" }, "홈트": { type: "number" },
      },
      required: ["축구", "야구", "농구", "골프", "홈트"],
    },
    // buy — categories + 3종 dist + buyFactors + buyProfile
    purchaseCategories: {
      type: "object",
      properties: {
        "의류": { type: "number" }, "뷰티": { type: "number" }, "전자": { type: "number" },
        "식품": { type: "number" }, "리빙": { type: "number" }, "여행": { type: "number" },
        "문화": { type: "number" }, "건강": { type: "number" },
      },
      required: ["의류", "뷰티", "전자", "식품", "리빙", "여행", "문화", "건강"],
    },
    paymentMethod: { type: "string" },   // 신용카드|간편결제|체크카드|현금
    shoppingChannel: { type: "string" }, // 온라인몰|앱|오프라인|라이브커머스
    purchaseFreq: { type: "string" },    // 주1회+|월2-3회|월1회|분기1회
    buyFactors: {
      type: "object",
      properties: {
        "가격": { type: "number" }, "품질": { type: "number" }, "브랜드": { type: "number" },
        "리뷰": { type: "number" }, "디자인": { type: "number" }, "배송": { type: "number" },
      },
      required: ["가격", "품질", "브랜드", "리뷰", "디자인", "배송"],
    },
    buyProfile: {
      type: "object",
      properties: {
        "가격민감": { type: "number" }, "브랜드충성": { type: "number" }, "할인민감": { type: "number" },
        "리뷰영향": { type: "number" }, "브랜드전환": { type: "number" }, "윤리소비": { type: "number" },
      },
      required: ["가격민감", "브랜드충성", "할인민감", "리뷰영향", "브랜드전환", "윤리소비"],
    },
  },
  required: [
    "persona_id", "quote", "jobs_to_be_done", "pain_points",
    "media_diet", "brand_affinity", "lifestyle_tags", "values_tags",
    "shopping_style", "price_sensitivity", "ad_receptivity",
    "activities", "travelType", "activeDaypart", "foodHabit", "wellnessFreq", "travelFreq",
    "coreValues", "mindset", "socialConcern", "decisionStyle", "infoSource", "bigFive",
    "interests", "musicGenre", "contentGenre", "influencerType", "sportsAffinity",
    "purchaseCategories", "paymentMethod", "shoppingChannel", "purchaseFreq", "buyFactors", "buyProfile",
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

[2026-06-23 확장 — 4개 탭(life/mind/love/buy) baseline 차트용 필수 필드. 모든 값은 한국어, 점수는 0~100 정수, dist는 정해진 enum 중 하나]
- activities (life): 활동별 관심도 점수 0~100 정수. 키 6개 필수: {"운동","독서","게임","여행","외식","쇼핑"}
- travelType (life): 여행 패턴 enum 하나 ["국내","해외","국내+해외"]
- activeDaypart (life): 활동 시간대 enum 하나 ["아침","낮","저녁","밤"]
- foodHabit (life): 식생활 enum 하나 ["집밥","외식","배달","간편식"]
- wellnessFreq (life): 운동빈도 enum 하나 ["안함","주1-2","주3-4","매일"]
- travelFreq (life): 여행빈도 enum 하나 ["연1회미만","연1-2회","연3-4회","연5회+"]
- coreValues (mind): 가치 점수 0~100 정수. 키 5개 필수: {"성취","안정","자유","관계","성장"}
- mindset (mind): 마인드셋 점수 0~100 정수. 키 5개 필수: {"브랜드신뢰","리스크수용","미래낙관","개인낙관","스트레스"}
- socialConcern (mind): 사회 관심사 enum 하나 ["환경","공정","다양성","동물복지"]
- decisionStyle (mind): 의사결정 스타일 enum 하나 ["직관","분석","추천의존","가격우선"]
- infoSource (mind): 정보 소비 채널 enum 하나 ["SNS","검색","지인","전문매체"]
- bigFive (mind): 빅5 성격 점수 0~100 정수. 키 5개 필수: {"개방성","성실성","외향성","우호성","신경성"}
- interests (love): 관심사 점수 0~100 정수. 키 8개 필수: {"패션","뷰티","테크","음식","여행","운동","게임","문화"}
- musicGenre (love): 선호 음악 enum 하나 ["K-pop","팝","힙합","인디","클래식","발라드"]
- contentGenre (love): 콘텐츠 enum 하나 ["드라마","예능","영화","다큐","스포츠중계","애니"]
- influencerType (love): 인플루언서 enum 하나 ["메가","마이크로","전문가","연예인"]
- sportsAffinity (love): 스포츠 친밀도 점수 0~100 정수. 키 5개 필수: {"축구","야구","농구","골프","홈트"}
- purchaseCategories (buy): 구매 카테고리 점수 0~100 정수. 키 8개 필수: {"의류","뷰티","전자","식품","리빙","여행","문화","건강"}
- paymentMethod (buy): 결제수단 enum 하나 ["신용카드","간편결제","체크카드","현금"]
- shoppingChannel (buy): 쇼핑채널 enum 하나 ["온라인몰","앱","오프라인","라이브커머스"]
- purchaseFreq (buy): 구매빈도 enum 하나 ["주1회+","월2-3회","월1회","분기1회"]
- buyFactors (buy): 의사결정 요인 점수 0~100 정수. 키 6개 필수: {"가격","품질","브랜드","리뷰","디자인","배송"}
- buyProfile (buy): 소비 프로파일 점수 0~100 정수. 키 6개 필수: {"가격민감","브랜드충성","할인민감","리뷰영향","브랜드전환","윤리소비"}

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
    // 2026-06-23 4개 탭 fallback
    activities: defaultActivities(p),
    travelType: _pickEnum(pid, "tt", LIFE_TRAVELTYPE),
    activeDaypart: _pickEnum(pid, "dp", LIFE_DAYPART),
    foodHabit: _pickEnum(pid, "fh", LIFE_FOOD),
    wellnessFreq: _pickEnum(pid, "wf", LIFE_WELLNESS),
    travelFreq: _pickEnum(pid, "tf", LIFE_TRAVELFREQ),
    coreValues: defaultCoreValues(p),
    mindset: defaultMindset(p),
    socialConcern: _pickEnum(pid, "sc", MIND_SOCIAL),
    decisionStyle: _pickEnum(pid, "ds", MIND_DECISION),
    infoSource: _pickEnum(pid, "is", MIND_INFO),
    bigFive: defaultBigFive(p),
    interests: defaultInterests(p),
    musicGenre: _pickEnum(pid, "mg", LOVE_MUSIC),
    contentGenre: _pickEnum(pid, "cg", LOVE_CONTENT),
    influencerType: _pickEnum(pid, "if", LOVE_INFLUENCER),
    sportsAffinity: defaultSportsAffinity(p),
    purchaseCategories: defaultPurchaseCategories(p),
    paymentMethod: _pickEnum(pid, "pm", BUY_PAYMENT),
    shoppingChannel: _pickEnum(pid, "ch", BUY_CHANNEL),
    purchaseFreq: _pickEnum(pid, "pf", BUY_FREQ),
    buyFactors: defaultBuyFactors(p),
    buyProfile: defaultBuyProfile(p),
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

// 2026-06-23: 4개 탭 baseline 차트 데이터 fallback/normalize 헬퍼.
//   해시 시드 기반 결정적 100명 변동. LLM 부재/필드 누락 시 사용.
function _hashSeed(personaId, salt) {
  return Math.abs(hashStr(`${personaId}:${salt}`));
}
function _scoreFromSeed(personaId, salt, center, range = 30) {
  // center ± range, 0~100 클램프. range=30 → ±30 변동.
  const h = _hashSeed(personaId, salt);
  const noise = ((h % 2001) / 1000 - 1) * range; // -range ~ +range
  return Math.min(95, Math.max(5, Math.round(center + noise)));
}
function _pickEnum(personaId, salt, choices) {
  return choices[_hashSeed(personaId, salt) % choices.length];
}
// 점수 객체 정규화: 키 목록 보장, 누락 시 fallback 병합, 0~100 클램프.
function _normalizeScoreObject(src, keys, fallback) {
  const out = {};
  for (const k of keys) {
    const v = src && typeof src[k] === "number" ? src[k] : null;
    out[k] = v != null ? Math.min(100, Math.max(0, Math.round(v))) : fallback[k];
  }
  return out;
}
// enum 값 정규화: 유효하지 않으면 fallback.
function _normalizeEnum(v, allowed, fallback) {
  if (typeof v === "string" && allowed.includes(v)) return v;
  return fallback;
}

// life 탭 — 점수형 1 + dist 5
const LIFE_ACTIVITIES_KEYS = ["운동","독서","게임","여행","외식","쇼핑"];
const LIFE_TRAVELTYPE = ["국내","해외","국내+해외"];
const LIFE_DAYPART = ["아침","낮","저녁","밤"];
const LIFE_FOOD = ["집밥","외식","배달","간편식"];
const LIFE_WELLNESS = ["안함","주1-2","주3-4","매일"];
const LIFE_TRAVELFREQ = ["연1회미만","연1-2회","연3-4회","연5회+"];
function defaultActivities(p) {
  const pid = p.persona_id || `${p.country}:0`;
  // baseline: 외식·쇼핑·여행 중상, 운동 중, 독서·게임 낮
  return {
    "운동": _scoreFromSeed(pid, "act:운동", 55),
    "독서": _scoreFromSeed(pid, "act:독서", 45),
    "게임": _scoreFromSeed(pid, "act:게임", 40),
    "여행": _scoreFromSeed(pid, "act:여행", 60),
    "외식": _scoreFromSeed(pid, "act:외식", 65),
    "쇼핑": _scoreFromSeed(pid, "act:쇼핑", 60),
  };
}
// mind 탭
const MIND_CORE_KEYS = ["성취","안정","자유","관계","성장"];
const MIND_MINDSET_KEYS = ["브랜드신뢰","리스크수용","미래낙관","개인낙관","스트레스"];
const MIND_BIG5_KEYS = ["개방성","성실성","외향성","우호성","신경성"];
const MIND_SOCIAL = ["환경","공정","다양성","동물복지"];
const MIND_DECISION = ["직관","분석","추천의존","가격우선"];
const MIND_INFO = ["SNS","검색","지인","전문매체"];
function defaultCoreValues(p) {
  const pid = p.persona_id || `${p.country}:0`;
  return {
    "성취": _scoreFromSeed(pid, "cv:성취", 60),
    "안정": _scoreFromSeed(pid, "cv:안정", 65),
    "자유": _scoreFromSeed(pid, "cv:자유", 65),
    "관계": _scoreFromSeed(pid, "cv:관계", 60),
    "성장": _scoreFromSeed(pid, "cv:성장", 60),
  };
}
function defaultMindset(p) {
  const pid = p.persona_id || `${p.country}:0`;
  return {
    "브랜드신뢰": _scoreFromSeed(pid, "ms:브랜드신뢰", 55),
    "리스크수용": _scoreFromSeed(pid, "ms:리스크수용", 45),
    "미래낙관": _scoreFromSeed(pid, "ms:미래낙관", 60),
    "개인낙관": _scoreFromSeed(pid, "ms:개인낙관", 60),
    "스트레스": _scoreFromSeed(pid, "ms:스트레스", 50),
  };
}
function defaultBigFive(p) {
  const pid = p.persona_id || `${p.country}:0`;
  return {
    "개방성": _scoreFromSeed(pid, "b5:개방성", 55),
    "성실성": _scoreFromSeed(pid, "b5:성실성", 60),
    "외향성": _scoreFromSeed(pid, "b5:외향성", 50),
    "우호성": _scoreFromSeed(pid, "b5:우호성", 60),
    "신경성": _scoreFromSeed(pid, "b5:신경성", 45),
  };
}
// love 탭
const LOVE_INTERESTS_KEYS = ["패션","뷰티","테크","음식","여행","운동","게임","문화"];
const LOVE_MUSIC = ["K-pop","팝","힙합","인디","클래식","발라드"];
const LOVE_CONTENT = ["드라마","예능","영화","다큐","스포츠중계","애니"];
const LOVE_INFLUENCER = ["메가","마이크로","전문가","연예인"];
const LOVE_SPORTS_KEYS = ["축구","야구","농구","골프","홈트"];
function defaultInterests(p) {
  const pid = p.persona_id || `${p.country}:0`;
  return {
    "패션": _scoreFromSeed(pid, "int:패션", 60),
    "뷰티": _scoreFromSeed(pid, "int:뷰티", 55),
    "테크": _scoreFromSeed(pid, "int:테크", 55),
    "음식": _scoreFromSeed(pid, "int:음식", 65),
    "여행": _scoreFromSeed(pid, "int:여행", 60),
    "운동": _scoreFromSeed(pid, "int:운동", 50),
    "게임": _scoreFromSeed(pid, "int:게임", 40),
    "문화": _scoreFromSeed(pid, "int:문화", 55),
  };
}
function defaultSportsAffinity(p) {
  const pid = p.persona_id || `${p.country}:0`;
  return {
    "축구": _scoreFromSeed(pid, "sp:축구", 50),
    "야구": _scoreFromSeed(pid, "sp:야구", 45),
    "농구": _scoreFromSeed(pid, "sp:농구", 40),
    "골프": _scoreFromSeed(pid, "sp:골프", 35),
    "홈트": _scoreFromSeed(pid, "sp:홈트", 50),
  };
}
// buy 탭
const BUY_CAT_KEYS = ["의류","뷰티","전자","식품","리빙","여행","문화","건강"];
const BUY_PAYMENT = ["신용카드","간편결제","체크카드","현금"];
const BUY_CHANNEL = ["온라인몰","앱","오프라인","라이브커머스"];
const BUY_FREQ = ["주1회+","월2-3회","월1회","분기1회"];
const BUY_FACTORS_KEYS = ["가격","품질","브랜드","리뷰","디자인","배송"];
const BUY_PROFILE_KEYS = ["가격민감","브랜드충성","할인민감","리뷰영향","브랜드전환","윤리소비"];
function defaultPurchaseCategories(p) {
  const pid = p.persona_id || `${p.country}:0`;
  return {
    "의류": _scoreFromSeed(pid, "pc:의류", 60),
    "뷰티": _scoreFromSeed(pid, "pc:뷰티", 50),
    "전자": _scoreFromSeed(pid, "pc:전자", 55),
    "식품": _scoreFromSeed(pid, "pc:식품", 65),
    "리빙": _scoreFromSeed(pid, "pc:리빙", 50),
    "여행": _scoreFromSeed(pid, "pc:여행", 50),
    "문화": _scoreFromSeed(pid, "pc:문화", 45),
    "건강": _scoreFromSeed(pid, "pc:건강", 50),
  };
}
function defaultBuyFactors(p) {
  const pid = p.persona_id || `${p.country}:0`;
  return {
    "가격": _scoreFromSeed(pid, "bf:가격", 70),
    "품질": _scoreFromSeed(pid, "bf:품질", 70),
    "브랜드": _scoreFromSeed(pid, "bf:브랜드", 55),
    "리뷰": _scoreFromSeed(pid, "bf:리뷰", 65),
    "디자인": _scoreFromSeed(pid, "bf:디자인", 60),
    "배송": _scoreFromSeed(pid, "bf:배송", 55),
  };
}
function defaultBuyProfile(p) {
  const pid = p.persona_id || `${p.country}:0`;
  return {
    "가격민감": _scoreFromSeed(pid, "bp:가격민감", 60),
    "브랜드충성": _scoreFromSeed(pid, "bp:브랜드충성", 50),
    "할인민감": _scoreFromSeed(pid, "bp:할인민감", 60),
    "리뷰영향": _scoreFromSeed(pid, "bp:리뷰영향", 60),
    "브랜드전환": _scoreFromSeed(pid, "bp:브랜드전환", 50),
    "윤리소비": _scoreFromSeed(pid, "bp:윤리소비", 45),
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
  // 2026-06-23 4개 탭 baseline 차트 데이터 정규화
  const fbLife = {
    activities: defaultActivities(attr),
    coreValues: defaultCoreValues(attr),
    mindset: defaultMindset(attr),
    bigFive: defaultBigFive(attr),
    interests: defaultInterests(attr),
    sportsAffinity: defaultSportsAffinity(attr),
    purchaseCategories: defaultPurchaseCategories(attr),
    buyFactors: defaultBuyFactors(attr),
    buyProfile: defaultBuyProfile(attr),
  };
  const pid = attr.persona_id || `${attr.country}:0`;
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
    // life
    activities: _normalizeScoreObject(narr?.activities, LIFE_ACTIVITIES_KEYS, fbLife.activities),
    travelType: _normalizeEnum(narr?.travelType, LIFE_TRAVELTYPE, _pickEnum(pid, "tt", LIFE_TRAVELTYPE)),
    activeDaypart: _normalizeEnum(narr?.activeDaypart, LIFE_DAYPART, _pickEnum(pid, "dp", LIFE_DAYPART)),
    foodHabit: _normalizeEnum(narr?.foodHabit, LIFE_FOOD, _pickEnum(pid, "fh", LIFE_FOOD)),
    wellnessFreq: _normalizeEnum(narr?.wellnessFreq, LIFE_WELLNESS, _pickEnum(pid, "wf", LIFE_WELLNESS)),
    travelFreq: _normalizeEnum(narr?.travelFreq, LIFE_TRAVELFREQ, _pickEnum(pid, "tf", LIFE_TRAVELFREQ)),
    // mind
    coreValues: _normalizeScoreObject(narr?.coreValues, MIND_CORE_KEYS, fbLife.coreValues),
    mindset: _normalizeScoreObject(narr?.mindset, MIND_MINDSET_KEYS, fbLife.mindset),
    socialConcern: _normalizeEnum(narr?.socialConcern, MIND_SOCIAL, _pickEnum(pid, "sc", MIND_SOCIAL)),
    decisionStyle: _normalizeEnum(narr?.decisionStyle, MIND_DECISION, _pickEnum(pid, "ds", MIND_DECISION)),
    infoSource: _normalizeEnum(narr?.infoSource, MIND_INFO, _pickEnum(pid, "is", MIND_INFO)),
    bigFive: _normalizeScoreObject(narr?.bigFive, MIND_BIG5_KEYS, fbLife.bigFive),
    // love
    interests: _normalizeScoreObject(narr?.interests, LOVE_INTERESTS_KEYS, fbLife.interests),
    musicGenre: _normalizeEnum(narr?.musicGenre, LOVE_MUSIC, _pickEnum(pid, "mg", LOVE_MUSIC)),
    contentGenre: _normalizeEnum(narr?.contentGenre, LOVE_CONTENT, _pickEnum(pid, "cg", LOVE_CONTENT)),
    influencerType: _normalizeEnum(narr?.influencerType, LOVE_INFLUENCER, _pickEnum(pid, "if", LOVE_INFLUENCER)),
    sportsAffinity: _normalizeScoreObject(narr?.sportsAffinity, LOVE_SPORTS_KEYS, fbLife.sportsAffinity),
    // buy
    purchaseCategories: _normalizeScoreObject(narr?.purchaseCategories, BUY_CAT_KEYS, fbLife.purchaseCategories),
    paymentMethod: _normalizeEnum(narr?.paymentMethod, BUY_PAYMENT, _pickEnum(pid, "pm", BUY_PAYMENT)),
    shoppingChannel: _normalizeEnum(narr?.shoppingChannel, BUY_CHANNEL, _pickEnum(pid, "ch", BUY_CHANNEL)),
    purchaseFreq: _normalizeEnum(narr?.purchaseFreq, BUY_FREQ, _pickEnum(pid, "pf", BUY_FREQ)),
    buyFactors: _normalizeScoreObject(narr?.buyFactors, BUY_FACTORS_KEYS, fbLife.buyFactors),
    buyProfile: _normalizeScoreObject(narr?.buyProfile, BUY_PROFILE_KEYS, fbLife.buyProfile),
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
