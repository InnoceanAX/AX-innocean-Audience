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
    // 2026-06-25 (CEO P2 지시): 활동 8축 (생활시간조사, radar 가독성) / 시간대 6축 (닐슨 TV시청률)
    activities: {
      type: "object",
      properties: {
        "운동·신체활동": { type: "number" }, "독서·학습": { type: "number" }, "게임": { type: "number" },
        "여행·관광": { type: "number" }, "외식": { type: "number" }, "쇼핑": { type: "number" },
        "미디어·SNS": { type: "number" }, "가족·교제": { type: "number" },
      },
      required: ["운동·신체활동", "독서·학습", "게임", "여행·관광", "외식", "쇼핑", "미디어·SNS", "가족·교제"],
    },
    travelType: { type: "string" },     // 국내|해외|국내+해외
    activeDaypart: { type: "string" },   // 새벽(00-06)|아침(06-09)|오전(09-12)|오후(12-18)|저녁(18-22)|심야(22-24)
    foodHabit: { type: "string" },       // 집밥|외식|배달|간편식
    wellnessFreq: { type: "string" },    // 안함|주1-2|주3-4|매일
    travelFreq: { type: "string" },      // 연1회미만|연1-2회|연3-4회|연5회+
    // mind — coreValues + mindset radar + 4종 dist + bigFive
    coreValues: {
      type: "object",
      properties: {
        "자기성취": { type: "number" }, "자기주도": { type: "number" }, "안전보존": { type: "number" },
        "관계조화": { type: "number" }, "보편이타": { type: "number" },
      },
      required: ["자기성취", "자기주도", "안전보존", "관계조화", "보편이타"],
    },
    mindset: {
      type: "object",
      properties: {
        "브랜드신뢰": { type: "number" }, "리스크수용": { type: "number" },
        "미래낙관": { type: "number" }, "개인낙관": { type: "number" }, "스트레스": { type: "number" },
      },
      required: ["브랜드신뢰", "리스크수용", "미래낙관", "개인낙관", "스트레스"],
    },
    socialConcern: { type: "string" },   // 환경·기후|일자리·경제|교육·육아|주거·부동산|건강·의료|공정·다양성|안전·치안
    decisionStyle: { type: "string" },   // 이성·분석|감성·직관|추천의존|탐색후선택|가격민감|충동구매
    infoSource: { type: "string" },      // SNS|검색엔진|뉴스앱·포털|지인·가족|TV·전통매체|전문가·리뷰|브랜드 공식채널|영상·팟캐스트
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
    musicGenre: { type: "string" },      // K-pop|팝|발라드|힙합·R&B|록|인디|일렉트로닉·EDM|클래식|재즈 (IFPI 9축)
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
    // 2026-06-25 (CEO P2 지시): 구매카테고리 11축 (통계청 가계동향 12대 비목, 주류담배 제외)
    //   / 쇼핑채널 6축 (통계청 온라인쇼핑동향) / 의사결정 8축 (학술표준)
    purchaseCategories: {
      type: "object",
      properties: {
        "식료품": { type: "number" }, "의류·신발": { type: "number" }, "주거·수도·광열": { type: "number" },
        "가정용품": { type: "number" }, "보건·의료": { type: "number" }, "교통": { type: "number" },
        "통신": { type: "number" }, "오락·문화": { type: "number" }, "교육": { type: "number" },
        "음식·숙박": { type: "number" }, "기타상품·서비스": { type: "number" },
      },
      required: ["식료품", "의류·신발", "주거·수도·광열", "가정용품", "보건·의료", "교통", "통신", "오락·문화", "교육", "음식·숙박", "기타상품·서비스"],
    },
    paymentMethod: { type: "string" },   // 신용카드|간편결제|체크카드|현금
    shoppingChannel: { type: "string" }, // PC 온라인몰|모바일 앱|오프라인 종합매장|오프라인 전문점|라이브커머스|소셜커머스 (통계청 온라인쇼핑동향 6축)
    purchaseFreq: { type: "string" },    // 주1회+|월2-3회|월1회|분기1회
    buyFactors: {
      type: "object",
      properties: {
        "가격": { type: "number" }, "품질": { type: "number" }, "브랜드": { type: "number" },
        "리뷰·평판": { type: "number" }, "디자인": { type: "number" }, "배송·편의": { type: "number" },
        "AS·보증": { type: "number" }, "추천": { type: "number" },
      },
      required: ["가격", "품질", "브랜드", "리뷰·평판", "디자인", "배송·편의", "AS·보증", "추천"],
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

[중요 — gender 일관성 절대 준수 (CEO 2026-06-25)]
- 각 페르소나의 gender(male/female) 는 위 입력값을 절대 변경하지 말고 narrative 전반에서 일관되게 반영.
- gender=male 인 경우: "엄마", "주부", "임신", "육아 전담", "남편 옷", "딸/아들 엄마", "아내", "모유" 등 여성 화자 어휘 금지.
- gender=female 인 경우: "아빠", "남편 역할" 어휘 금지.
- occupation=homemaker(주부/가사) 와 gender 가 사회 통념과 다를 수 있음. 그 경우에도 gender 어휘를 우선하고 occupation 은 "가사 담당", "전업" 같은 중립 표현으로 풀어쓸 것.
- quote/jobs_to_be_done/pain_points/lifestyle_tags/values_tags 모두 동일 규칙 적용. 일본어/중국어 페르소나도 한국어 출력이므로 동일 규칙.

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
- activities (life): 활동별 관심도 점수 0~100 정수. 키 8개 필수 (통계청 생활시간조사 행동분류 기반, radar 8축 가독성): {"운동·신체활동","독서·학습","게임","여행·관광","외식","쇼핑","미디어·SNS","가족·교제"}
- travelType (life): 여행 패턴 enum 하나 ["국내","해외","국내+해외"]
- activeDaypart (life): 활동 시간대 enum 하나 (닐슨 TV시청률 6구간) ["새벽(00-06)","아침(06-09)","오전(09-12)","오후(12-18)","저녁(18-22)","심야(22-24)"]
- foodHabit (life): 식생활 enum 하나 ["집밥","외식","배달","간편식"]
- wellnessFreq (life): 운동빈도 enum 하나 ["안함","주1-2","주3-4","매일"]
- travelFreq (life): 여행빈도 enum 하나 ["연1회미만","연1-2회","연3-4회","연5회+"]
- coreValues (mind): 가치 점수 0~100 정수. 키 5개 필수 (Schwartz 기본가치 이론): {"자기성취","자기주도","안전보존","관계조화","보편이타"} (자기성취=성공·인정, 자기주도=독립·새경험, 안전보존=안정·질서·전통, 관계조화=가까운사람복지, 보편이타=모두·환경공정)
- mindset (mind): 마인드셋 점수 0~100 정수. 키 5개 필수: {"브랜드신뢰","리스크수용","미래낙관","개인낙관","스트레스"}
- socialConcern (mind): 사회 관심사 enum 하나 (WVS/Pew 기반) ["환경·기후","일자리·경제","교육·육아","주거·부동산","건강·의료","공정·다양성","안전·치안"]
- decisionStyle (mind): 의사결정 스타일 enum 하나 (Sproles&Kendall CSI) ["이성·분석","감성·직관","추천의존","탐색후선택","가격민감","충동구매"]
- infoSource (mind): 정보 소비 채널 enum 하나 (DataReportal 2024) ["SNS","검색엔진","뉴스앱·포털","지인·가족","TV·전통매체","전문가·리뷰","브랜드 공식채널","영상·팟캐스트"]
- bigFive (mind): 빅5 성격 점수 0~100 정수. 키 5개 필수: {"개방성","성실성","외향성","우호성","신경성"}
- interests (love): 관심사 점수 0~100 정수. 키 8개 필수: {"패션","뷰티","테크","음식","여행","운동","게임","문화"}
- musicGenre (love): 선호 음악 enum 하나 (IFPI Global Music Report 2024 + 한국음저협 9장르) ["K-pop","팝","발라드","힙합·R&B","록","인디","일렉트로닉·EDM","클래식","재즈"]
- contentGenre (love): 콘텐츠 enum 하나 ["드라마","예능","영화","다큐","스포츠중계","애니"]
- influencerType (love): 인플루언서 enum 하나 ["메가","마이크로","전문가","연예인"]
- sportsAffinity (love): 스포츠 친밀도 점수 0~100 정수. 키 5개 필수: {"축구","야구","농구","골프","홈트"}
- purchaseCategories (buy): 구매 카테고리 점수 0~100 정수. 키 11개 필수 (통계청 가계동향조사 12대 비목, 주류담배 제외): {"식료품","의류·신발","주거·수도·광열","가정용품","보건·의료","교통","통신","오락·문화","교육","음식·숙박","기타상품·서비스"}
- paymentMethod (buy): 결제수단 enum 하나 ["신용카드","간편결제","체크카드","현금"]
- shoppingChannel (buy): 쇼핑채널 enum 하나 (통계청 온라인쇼핑동향 6채널) ["PC 온라인몰","모바일 앱","오프라인 종합매장","오프라인 전문점","라이브커머스","소셜커머스"]
- purchaseFreq (buy): 구매빈도 enum 하나 ["주1회+","월2-3회","월1회","분기1회"]
- buyFactors (buy): 의사결정 요인 점수 0~100 정수. 키 8개 필수 (학술표준 소비자 구매결정 요인): {"가격","품질","브랜드","리뷰·평판","디자인","배송·편의","AS·보증","추천"}
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
// 2026-06-26 (CEO 승인 §K4): JP 풀 fallback 28% 중복 완화 → 풀 확대 (Quotes 8→24, Jobs/Pains 4→12, Lifestyles 5→12, Values 4→12).
const FALLBACK_QUOTES = [
  "요즘 관심 있는 브랜드를 비교하고 최선의 선택을 하고 싶어요.",
  "트렌디하면서도 가성비 좋은 걸 찾는 게 제일 중요해요.",
  "소셜에서 본 제품, 실제로 써보고 싶어요.",
  "온라인 리뷰 꼼꼼히 보고 구매하는 편이에요.",
  "새로운 브랜드 발견하는 게 스트레스 해소예요.",
  "편리하면서도 품질 좋은 걸 원해요.",
  "환경이나 윤리적 소비에도 신경 쓰는 편이에요.",
  "가족/친구 추천이 구매에 큰 영향을 줘요.",
  // 수단·편의 스타일
  "일상을 조금 더 편하게 만들어주는 제품이 좋아요.",
  "최소한의 소지품으로 충분한 만족감을 느끼고 싶어요.",
  "모바일 하나로 모든 걸 해결하고 싶어요.",
  "마일리지가 항상 차있으면 좋겠어요.",
  // 세분성·취향
  "남들이 잘 모르는 숨겨진 제품을 찾는 재미가 있어요.",
  "디자인이 조금 더 개성 있으면 추가 지출도 괜찮아요.",
  "이야기가 있는 브랜드는 자연스레 손이 가요.",
  "수집 취미와 좀 동떨어져서 소비 패턴에도 영향을 줘요.",
  // 안정·필수
  "큰 실패없는 안정적인 선택을 선호해요.",
  "적절한 가격에 적절한 품질이면 충분해요.",
  "구독/정기배송과 같은 고정 소비에 익숙해졌어요.",
  // 경험·커뮤니티
  "커뮤니티 안에서 공유되는 리뷰와 정보의 가치를 중요하게 생각해요.",
  "구매 여정 자체가 즐거움이어야 해요.",
  "첨단 기능보다 의미 있는 뒤릿의 소고 철학이 중요해요.",
  "감당 필요없는 처음 대합을 원하지 않아요.",
  "이제는 소비도 자기 표현의 연장이라고 생각해요.",
];
const FALLBACK_JOBS = [
  ["최적의 가성비 제품 찾기", "내 라이프스타일에 맞는 브랜드 발견", "빠르고 편한 구매 경험"],
  ["리뷰 비교로 실패 줄이기", "할인/프로모션 최대 활용", "새로운 트렌드 파악"],
  ["주변 추천 제품 확인", "장기적으로 믿을 수 있는 브랜드 선택", "일상의 편의성 향상"],
  ["환경 부담 적은 소비 실천", "정보 과부하 속 핵심만 파악", "나만의 큐레이션 구축"],
  ["자기 시간 보호와 효율 극대화", "구독/멤버십 혜택 최대화", "일상을 더 시각적으로 정돈하기"],
  ["건강과 테그 관리 시스템화", "취미·취향 샘플링 잘하기", "잊혀진 일상의 재발견"],
  ["가족·친구와의 시간 퀄리티 향상", "다행 구매·필요 구매 구분", "구매 이용률·자기활용 극대화"],
  ["장기적 자산 설계와 소비 계획", "브랜드/제품 간 철학 공감 교차확인", "SNS 파장력 있는 아이템 발굴"],
  ["터무니에서 다양하고 신뢰할 수 있는 정보 수집", "점포·온라인 사용성 비교", "구매 증빙·결제를 가장 심리적으로 안정되게"],
  ["부담 없는 시도 이후 판단", "접근성 좋은 AS·매장으로 안심 확인", "프리미엄·컴포트 경험의 일상화"],
  ["과도한 광고가 아닌 진짜 소비자 목소리 청차", "아이디어 석월·적용의 손쉬움", "일상의 특별한 순간을 고품질로 만들기"],
  ["소니의 소재 이야기의 수광·탐구", "단순한 구매를 넘어서의 추억/이야기 속의 획득", "소비 축세·환경 부하 종합적인 고려"],
];
const FALLBACK_PAINS = [
  ["정보가 많아서 선택 장애", "배송/반품 절차 번거로움"],
  ["리뷰 신뢰도 판단 어려움", "가격 비교에 시간 소요"],
  ["원하는 제품 품절/재고 부족", "광고성 콘텐츠 피로감"],
  ["개인정보 노출 우려", "브랜드 간 품질 편차"],
  ["메인 프로모션 절을 다 축소되서 논이 석혁", "메세지 과하에 광고 피로"],
  ["구독/자동결제가 누적되며 비용 장애", "취소 철회의 복잡하다"],
  ["AS/CS 응대가 느린 마이", "제품·프로모션의 다양성 부족"],
  ["차이점 이해가 어려운 브랜드/계단", "결제 클래익 과정이 길며 끝난이대니"],
  ["탁월한 환경 국제·명해 이니셔티브 파악 어려움", "활용·적용 대상 파악 어려움"],
  ["좀 더 고품질인 도움·서비스를 원하면 고액의 추가 가격·구독", "첨단 기능보다 일상적 편의 부족"],
  ["다양한 세분화 인권·면적 부족", "구매 이력으로 수와의 광고가 절대 일치하지 않음"],
  ["팬더미티·제조사·윤리성 등 증도 판단 어려움", "고객 섬테일 리타입 조게 소설·파괴 완화"],
];
const FALLBACK_LIFESTYLES = [
  ["주말 카페", "운동 루틴", "넷플릭스", "친구 모임", "맛집 탐방"],
  ["러닝/필라테스", "근교 여행", "홈카페", "음악 감상", "미니멀 정리"],
  ["전시/공연", "독서", "새 브랜드 탐색", "라이프스타일 매거진", "독립서점"],
  ["반려동물 케어", "드라이브", "일상 기록", "요리", "가족 시간"],
  ["e커머스 쇼핑", "브이로그 감상", "SNS 큐레이션", "자기계발", "외식"],
  ["마이 일상·출퇴근길 테크", "드라마 시청", "떨어진 친구와의 연락", "다이어리 관리", "테크 가제"],
  ["일찍 기상·자기 루틴", "채식·로컬 식재·동네 상권 탐구", "새벽 운동", "테크 트렌드 수종", "속소한 레시피·소품 DIY"],
  ["투자·자산 관리 스터디", "주중 바·와인 컨어린", "주말 서울·근교 당일 여행", "공공·한정 공연삽", "함승 테니스·테니스"],
  ["골프·하이킹 주말·장차", "개인과외 이벤트·파티", "이모·공연·파제 제적 수록·석이", "테크 키트 수주·조립", "쿠킹·홈찜 디자이너"],
  ["그림·임하스트 고술 뢔원 키우기", "고양이·강아지 섭제대", "레이우르·마라톤", "포터블·소설 책 독서", "대중교통 대신 건강을 자채 걸으며"],
  ["환경·지속가능 소비 접근", "명상·복골 쇼핑", "동네 카페·독립서점 쑥덩", "공유 주방·코워킹", "졸은 잉장·공방 이용"],
  ["제주·국내 장기 워케이션", "디지털 노마드 라이프", "아낌 프로그램 코칭 티치", "개인 콘텐츠 채널 운영", "NFT/Web3 소팔·쿨렉포렉"],
];
const FALLBACK_VALUES = [
  ["자기표현", "트렌드 감각", "가성비", "지속가능", "커뮤니티"],
  ["실용성", "품질", "신뢰", "효율", "가족"],
  ["개성", "독창성", "최신 트렌드", "소셜 노출", "자존감"],
  ["윤리소비", "지역 우선", "공정 거래", "환경", "발자취"],
  ["경험 우선", "적절함", "관계 적대", "탐구·호기심", "이야기"],
  ["프리미엄", "디테일 완성", "장인정신", "탄소·환경 소비감소", "헌삽·고객"],
  ["허업없음", "경제적 자도", "자기 계발", "건강·웰빙", "지적·문화 소비"],
  ["업·창의", "자유 시간", "대안적 라이프스타일", "테크 서킹", "다양성 존중"],
  ["황고", "프레스티지", "레거시가 있는 소비", "움게 골 수집·파안", "평와 안정"],
  ["자기 대의 결광", "추억·이야기 수집", "소속감·판단", "고용 경험·고공에게·소비 안정", "될·지적 경험"],
  ["자사 고양으로 추구", "철학·디자인", "바이어 소비 좌표·독립", "일상의 재발견·고품질 일상", "프레스프·고수·극소비"],
  ["장인·장인적 조화", "명상·혜택 필광", "이야기·최대 자기표현", "수월·세월 소비", "명헛·하이엔드"],
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
// 2026-06-25 (CEO P2 지시): 활동 8축 (생활시간조사, radar 가독성) / 시간대 6축 (닐슨 TV시청률)
const LIFE_ACTIVITIES_KEYS = ["운동·신체활동","독서·학습","게임","여행·관광","외식","쇼핑","미디어·SNS","가족·교제"];
const LIFE_TRAVELTYPE = ["국내","해외","국내+해외"];
const LIFE_DAYPART = ["새벽(00-06)","아침(06-09)","오전(09-12)","오후(12-18)","저녁(18-22)","심야(22-24)"];
const LIFE_FOOD = ["집밥","외식","배달","간편식"];
const LIFE_WELLNESS = ["안함","주1-2","주3-4","매일"];
const LIFE_TRAVELFREQ = ["연1회미만","연1-2회","연3-4회","연5회+"];
function defaultActivities(p) {
  const pid = p.persona_id || `${p.country}:0`;
  // baseline: 외식·쇼핑·여행 중상, 운동 중, 독서·게임 낮
  return {
    "운동·신체활동": _scoreFromSeed(pid, "act:운동", 55),
    "독서·학습": _scoreFromSeed(pid, "act:독서", 45),
    "게임": _scoreFromSeed(pid, "act:게임", 40),
    "여행·관광": _scoreFromSeed(pid, "act:여행", 60),
    "외식": _scoreFromSeed(pid, "act:외식", 65),
    "쇼핑": _scoreFromSeed(pid, "act:쇼핑", 60),
    "미디어·SNS": _scoreFromSeed(pid, "act:미디어", 70),
    "가족·교제": _scoreFromSeed(pid, "act:교제", 55),
  };
}
// mind 탭
const MIND_CORE_KEYS = ["자기성취","자기주도","안전보존","관계조화","보편이타"];
const MIND_MINDSET_KEYS = ["브랜드신뢰","리스크수용","미래낙관","개인낙관","스트레스"];
const MIND_BIG5_KEYS = ["개방성","성실성","외향성","우호성","신경성"];
const MIND_SOCIAL = ["환경·기후","일자리·경제","교육·육아","주거·부동산","건강·의료","공정·다양성","안전·치안"];
const MIND_DECISION = ["이성·분석","감성·직관","추천의존","탐색후선택","가격민감","충동구매"];
const MIND_INFO = ["SNS","검색엔진","뉴스앱·포털","지인·가족","TV·전통매체","전문가·리뷰","브랜드 공식채널","영상·팟캐스트"];
function defaultCoreValues(p) {
  const pid = p.persona_id || `${p.country}:0`;
  return {
    "자기성취": _scoreFromSeed(pid, "cv:자기성취", 62),
    "자기주도": _scoreFromSeed(pid, "cv:자기주도", 65),
    "안전보존": _scoreFromSeed(pid, "cv:안전보존", 65),
    "관계조화": _scoreFromSeed(pid, "cv:관계조화", 60),
    "보편이타": _scoreFromSeed(pid, "cv:보편이타", 58),
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
// 2026-06-25 (CEO P2 지시): 음악 장르 9축 (IFPI Global Music Report 2024 + 한국음저협)
const LOVE_INTERESTS_KEYS = ["패션","뷰티","테크","음식","여행","운동","게임","문화"];
const LOVE_MUSIC = ["K-pop","팝","발라드","힙합·R&B","록","인디","일렉트로닉·EDM","클래식","재즈"];
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
// 2026-06-25 (CEO P2 지시): 구매카테고리 11축 (통계청 가계동향조사 12대 비목, 주류·담배 제외)
//   / 쇼핑채널 6축 (통계청 온라인쇼핑동향조사) / 의사결정 8축 (학술 소비자 구매결정 요인 표준)
const BUY_CAT_KEYS = ["식료품","의류·신발","주거·수도·광열","가정용품","보건·의료","교통","통신","오락·문화","교육","음식·숙박","기타상품·서비스"];
const BUY_PAYMENT = ["신용카드","간편결제","체크카드","현금"];
const BUY_CHANNEL = ["PC 온라인몰","모바일 앱","오프라인 종합매장","오프라인 전문점","라이브커머스","소셜커머스"];
const BUY_FREQ = ["주1회+","월2-3회","월1회","분기1회"];
const BUY_FACTORS_KEYS = ["가격","품질","브랜드","리뷰·평판","디자인","배송·편의","AS·보증","추천"];
const BUY_PROFILE_KEYS = ["가격민감","브랜드충성","할인민감","리뷰영향","브랜드전환","윤리소비"];
function defaultPurchaseCategories(p) {
  const pid = p.persona_id || `${p.country}:0`;
  return {
    "식료품": _scoreFromSeed(pid, "pc:식료품", 65),
    "의류·신발": _scoreFromSeed(pid, "pc:의류", 60),
    "주거·수도·광열": _scoreFromSeed(pid, "pc:주거", 55),
    "가정용품": _scoreFromSeed(pid, "pc:가정용품", 50),
    "보건·의료": _scoreFromSeed(pid, "pc:보건", 55),
    "교통": _scoreFromSeed(pid, "pc:교통", 55),
    "통신": _scoreFromSeed(pid, "pc:통신", 60),
    "오락·문화": _scoreFromSeed(pid, "pc:오락", 50),
    "교육": _scoreFromSeed(pid, "pc:교육", 45),
    "음식·숙박": _scoreFromSeed(pid, "pc:음식", 60),
    "기타상품·서비스": _scoreFromSeed(pid, "pc:기타", 40),
  };
}
function defaultBuyFactors(p) {
  const pid = p.persona_id || `${p.country}:0`;
  return {
    "가격": _scoreFromSeed(pid, "bf:가격", 70),
    "품질": _scoreFromSeed(pid, "bf:품질", 70),
    "브랜드": _scoreFromSeed(pid, "bf:브랜드", 55),
    "리뷰·평판": _scoreFromSeed(pid, "bf:리뷰", 65),
    "디자인": _scoreFromSeed(pid, "bf:디자인", 60),
    "배송·편의": _scoreFromSeed(pid, "bf:배송", 55),
    "AS·보증": _scoreFromSeed(pid, "bf:AS", 50),
    "추천": _scoreFromSeed(pid, "bf:추천", 55),
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

// per-persona 단발 재호출 — batch 에서 돌아온 누락분을 1명씩 다시 채움.
// 2026-06-26 (CEO §K4): JP fallback 28% 완화용. 솋각이라 출력 길이 짧고 truncate 위험 적음.
async function _retryPerPersona(missing, opts) {
  const { brand, countryName, country } = opts;
  const localCompetitors = competitorsFor(country);
  const out = [];
  for (const p of missing) {
    try {
      const prompt = buildBatchPrompt([p], { brand, countryName, localCompetitors });
      const system = `당신은 글로벌 소비자 인사이트 리서치 전문가입니다. 주어진 합성 페르소나 속성에 맞는 narrative를 JSON 스키마에 맞게 정확히 생성합니다. 모든 텍스트는 한국어로 작성합니다.`;
      const result = await generateJSON({
        prompt, system,
        schema: NARRATIVE_SCHEMA,
        model: "gemini-2.5-flash",
        temperature: 0.6,
        maxOutputTokens: 8192,
        thinkingBudget: 0,
        timeoutMs: 45000,
        maxRetries: 2,
      });
      if (result.json?.personas && result.json.personas.length > 0) {
        out.push(result.json.personas[0]);
      } else {
        console.warn(`[narrative] per-persona retry empty for ${p.persona_id} (${country})`);
        out.push(fallbackNarrative(p));
      }
    } catch (e) {
      console.warn(`[narrative] per-persona retry failed for ${p.persona_id}: ${e.message}`);
      out.push(fallbackNarrative(p));
    }
  }
  return out;
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
  // Fix: maxOutputTokens 16384 + retry on fail (split batch in half)
  // 2026-06-26 (CEO §K4): thinkingBudget=0 + 3회 retry + 90s timeout + per-persona 누락 재호출
  try {
    const result = await generateJSON({
      prompt,
      system,
      schema: NARRATIVE_SCHEMA,
      model: "gemini-2.5-flash",
      temperature: 0.7,
      maxOutputTokens: 16384,
      thinkingBudget: 0,
      timeoutMs: 90000,
      maxRetries: 3,
    });
    if (!result.json?.personas || !Array.isArray(result.json.personas) || result.json.personas.length === 0) {
      throw new Error("Bad LLM output");
    }
    // 2026-06-26 (CEO §K4 per-persona retry): batch 일부만 돌아온 경우 누락분만 1명 단위 재호출.
    const returnedIds = new Set(result.json.personas.map(p => p && p.persona_id).filter(Boolean));
    const missing = batch.filter(p => !returnedIds.has(p.persona_id));
    if (missing.length > 0 && missing.length < batch.length) {
      console.warn(`[narrative] batch returned ${result.json.personas.length}/${batch.length} for ${country} — per-persona retry for ${missing.length}`);
      const recovered = await _retryPerPersona(missing, opts);
      return [...result.json.personas, ...recovered];
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

// CEO 2026-06-25 안전망 (C): gender↔어휘 검증. LLM이 프롬프트 gender 일관성 명령을 지키지 못했을 때 그 필드만 중립 표현으로 안전 fallback.
// 적용 대상: gender=male 이고 텍스트에 여성 화자 어휘(엄마/주부/육아/살림/임신/모유/남편/아내)가 검출되면 해당 필드만 fallback. female 의 경우 "아빠" 검출 시 fallback. 매칭 없으면 원본 유지.
const FEMALE_SPEAKER_RE = /엄마|주부|육아|살림|임신|모유|남편|아내|기저귀/;
const MALE_SPEAKER_RE = /아빠|남편 역할/;
function _genderMismatch(text, gender) {
  if (typeof text !== "string" || !text) return false;
  if (gender === "male") return FEMALE_SPEAKER_RE.test(text);
  if (gender === "female") return MALE_SPEAKER_RE.test(text);
  return false;
}
function _sanitizeNarrativeGender(narr, attr) {
  if (!narr || !attr || !attr.gender) return narr;
  const g = attr.gender;
  const fb = fallbackNarrative(attr);
  let touched = false;
  const out = { ...narr };
  // quote: 단일 문자열
  if (_genderMismatch(out.quote, g)) {
    out.quote = fb.quote;
    touched = true;
  }
  // jobs_to_be_done: 배열. 항목별 검사, 한개라도 mismatch 면 전체를 fb로 교체(맥락 일관성 확보)
  if (Array.isArray(out.jobs_to_be_done) && out.jobs_to_be_done.some(j => _genderMismatch(j, g))) {
    out.jobs_to_be_done = fb.jobs_to_be_done;
    touched = true;
  }
  // pain_points: 동일
  if (Array.isArray(out.pain_points) && out.pain_points.some(p => _genderMismatch(p, g))) {
    out.pain_points = fb.pain_points;
    touched = true;
  }
  // lifestyle_tags / values_tags: 태그 단위 교체
  if (Array.isArray(out.lifestyle_tags) && out.lifestyle_tags.some(t => _genderMismatch(t, g))) {
    out.lifestyle_tags = fb.lifestyle_tags;
    touched = true;
  }
  if (Array.isArray(out.values_tags) && out.values_tags.some(t => _genderMismatch(t, g))) {
    out.values_tags = fb.values_tags;
    touched = true;
  }
  if (touched) {
    console.warn(`[narrative-sanitize] gender=${g} mismatch repaired for ${attr.persona_id} (${attr.country})`);
  }
  return out;
}

// Merge attribute + narrative into final persona object
export function mergePersona(attr, narr) {
  // CEO 2026-06-25: gender 일관성 안전망—프롬프트 명령 위반 시 당해 필드만 중립 fallback으로 교체
  narr = _sanitizeNarrativeGender(narr, attr);
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
