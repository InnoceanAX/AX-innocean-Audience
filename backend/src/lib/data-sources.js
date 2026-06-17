// data-sources.js
// 단일 출처 표기 모듈 (CEO 2026-06-17 19:00 최종 확정).
//
// 솔루션 전체에서 외부에 노출하는 데이터 출처는 여기 한 곳에서만 정의한다.
// 다른 라우트/어댑터는 이 모듈을 import 해서 동일한 라벨을 쓴다.
//
// 노출 원칙:
//   - 실제로 코드/응답에서 사용 중인 공개 데이터 5개만 노출
//   - 5개 외 용어 추가 금지
//   - 광고비(WPP Media/MAGNA/Dentsu/IAB+PwC/KOBACO)는 5번째 항목으로 노출.
//     2024-2025 actuals + 2026 forecast 혼합 모델로 표기.
//
// 노출 금지 (코드에서 라벨 제거):
//   WVS / Edelman Trust / Hofstede / PEW / eMarketer /
//   Google Trends / GWI / Hootsuite / We Are Social 단독 /
//   Talkwalker / INNOCEAN 사내 DB

// ───────────────────────────────────────────────────────────────────
// 1) 공개 데이터 (딱 5개)
// ───────────────────────────────────────────────────────────────────
export const PUBLIC_DATA_SOURCES = [
  {
    id: "worldBank",
    name: "World Bank Open Data",
    url: "https://data.worldbank.org",
    category: "인구·GDP·인터넷·도시화",
    coverage: "인구·GDP·인터넷·도시화",
    license: "공개",
    confidence: 95,
    year: 2025,
  },
  {
    id: "statista",
    name: "Statista 공개 통계 (AMO 9세그먼트 분류 체계 + 시장 개요)",
    url: "https://www.statista.com/outlook/amo",
    category: "매체 분류 체계·시장 규모",
    coverage: "매체 분류 체계·시장 규모",
    license: "공개",
    confidence: 88,
    year: 2025,
  },
  {
    id: "dataReportal",
    name: "DataReportal Digital 2025 (We Are Social × Meltwater, 공개)",
    url: "https://datareportal.com/reports/digital-2025-global-overview-report",
    category: "매체별 사용률·시간 베이스라인",
    coverage: "매체별 사용률·시간 베이스라인",
    license: "공개",
    confidence: 90,
    year: 2025,
  },
  {
    id: "reuters",
    name: "Reuters Digital News Report (공개)",
    url: "https://reutersinstitute.politics.ox.ac.uk/digital-news-report",
    category: "매체별 신뢰도",
    coverage: "매체별 신뢰도",
    license: "공개",
    confidence: 92,
    year: 2025,
  },
  {
    id: "adspend",
    name: "WPP Media(구 GroupM) / MAGNA / Dentsu / IAB+PwC / KOBACO 광고비 보고서 (2024-2025 actuals + 2026 forecast, 공개)",
    url: null,
    category: "매체별 광고비 점유",
    coverage: "매체별 광고비 점유 (2024-2025 실측 + 2026 전망 혼합 모델)",
    license: "공개",
    confidence: 88,
    year: "2024-2026",
  },
];

// ───────────────────────────────────────────────────────────────────
// 2) AI 합성 소비자 모델 (3 stage)
// ───────────────────────────────────────────────────────────────────
export const SYNTHETIC_CONSUMER_MODEL = {
  stage1: {
    label: "Stage 1",
    name: "통계 시드 100명 (결정적 PRNG)",
    description: "공개 인구통계(World Bank) 분포를 시드로 결정적 난수에서 100명 생성.",
  },
  stage2: {
    label: "Stage 2",
    name: "Gemini 2.5 Flash narrative (가치관·구매·미디어·언어)",
    description: "각 시드 페르소나에 LLM narrative 를 입혀 가치관·구매 패턴·미디어 다이어트·언어 태그를 채움.",
  },
  stage3: {
    label: "Stage 3",
    name: "탭별 집계 통계 (분포·비율·평균)",
    description: "100명 페르소나 풀을 탭별로 집계해 분포·비율·평균을 산출.",
  },
};

// ───────────────────────────────────────────────────────────────────
// 3) 탭별 사용 데이터 (출처 모달 / 배지 detail 과 동일 문구)
// ───────────────────────────────────────────────────────────────────
export const TAB_USAGE = {
  who:   "Stage 1 인구통계 시드",
  life:  "Stage 2 라이프스타일·일상 활동 태그",
  mind:  "Stage 2 가치관·의사결정 스타일 태그",
  love:  "Stage 2 관심사·브랜드 친화도 태그",
  buy:   "Stage 2 쇼핑 스타일·가격 민감도 태그",
  media: "Stage 2 미디어 트렌드 태그",
};

// ───────────────────────────────────────────────────────────────────
// 통합 export — 라우트는 이것만 가져다 쓰면 됨
// ───────────────────────────────────────────────────────────────────
export const DATA_SOURCES = {
  publicData: PUBLIC_DATA_SOURCES,
  syntheticConsumerModel: SYNTHETIC_CONSUMER_MODEL,
  tabUsage: TAB_USAGE,
};

// 탭별 source 메타 (라우트 응답의 `source` 필드용 통일 헬퍼)
export function buildTabSource(tab) {
  return {
    type: "public-data + synthetic-consumer",
    publicData: PUBLIC_DATA_SOURCES.map(s => ({
      id: s.id, name: s.name, year: s.year, url: s.url, license: s.license, category: s.category,
    })),
    syntheticConsumerModel: SYNTHETIC_CONSUMER_MODEL,
    tabUsage: tab ? (TAB_USAGE[tab] || null) : TAB_USAGE,
  };
}

// 활성(노출 허용) 출처만 — 4개
export function listActiveSources() {
  return PUBLIC_DATA_SOURCES;
}
