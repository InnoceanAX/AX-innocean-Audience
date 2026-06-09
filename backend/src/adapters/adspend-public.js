// adspend-public.js
// 공개 광고비 보고서 어댑터 — MAGNA/GroupM/Dentsu/KOBACO/제일기획
// 출처: 각 기관 무료 공개 PDF (최신본 수치 수동 검증 후 베이스라인 등록)
// 자동 PDF 파싱 인터페이스는 fetchPDF()에 stub으로 준비 — 스케줄러 도입 시 활성화

// ─────────────────────────────────────────────────────────────
// 데이터 소스 메타
// ─────────────────────────────────────────────────────────────
export const ADSPEND_SOURCES = [
  {
    id: "magna",
    name: "MAGNA Global (IPG Mediabrands)",
    url: "https://magnaglobal.com/research/",
    cadence: "quarterly",
    coverage: "70 countries",
    license: "free (public PDF)",
    status: "baseline-loaded",
    lastUpdate: "2024-12 (Dec 2024 Forecast Update)",
  },
  {
    id: "groupm",
    name: "GroupM This Year, Next Year (TYNY)",
    url: "https://www.groupm.com/this-year-next-year/",
    cadence: "bi-annual (Jun, Dec)",
    coverage: "70 countries",
    license: "free (public PDF + summary)",
    status: "baseline-loaded",
    lastUpdate: "2024-12",
  },
  {
    id: "dentsu",
    name: "Dentsu Global Ad Spend Forecast",
    url: "https://www.dentsu.com/news-releases/",
    cadence: "bi-annual (Jan, Aug)",
    coverage: "58 countries",
    license: "free (public PDF)",
    status: "baseline-loaded",
    lastUpdate: "2025-01",
  },
  {
    id: "kobaco",
    name: "한국방송광고진흥공사 KOBACO 방송통신광고비조사",
    url: "https://www.kobaco.co.kr/",
    cadence: "annual",
    coverage: "Korea, by medium",
    license: "free (public report)",
    status: "baseline-loaded",
    lastUpdate: "2024 (2023 actuals)",
  },
  {
    id: "cheil",
    name: "제일기획 광고연감 (Cheil Worldwide Ad Almanac)",
    url: "https://www.cheil.com/",
    cadence: "annual",
    coverage: "Korea",
    license: "free (public report)",
    status: "baseline-loaded",
    lastUpdate: "2024",
  },
  {
    id: "emarketer-public",
    name: "eMarketer (Insider Intelligence) Free Briefs",
    url: "https://www.emarketer.com/",
    cadence: "monthly free articles",
    coverage: "Global / US focus",
    license: "free brief articles",
    status: "reference",
    lastUpdate: "2025",
  },
  {
    id: "iab-internet",
    name: "IAB Internet Advertising Revenue Report (PwC compiled)",
    url: "https://www.iab.com/insights/iab-internet-advertising-revenue-report/",
    cadence: "annual",
    coverage: "US digital",
    license: "free PDF",
    status: "baseline-loaded",
    lastUpdate: "2024 (FY2023 final)",
  },
];

// ─────────────────────────────────────────────────────────────
// 국가별 총 광고비 베이스라인 (USD Billions, 2024 추정)
// 출처: GroupM TYNY Dec 2024 + MAGNA Dec 2024 + Dentsu Jan 2025 평균
// 단위: $B (Billion USD)
// ─────────────────────────────────────────────────────────────
export const COUNTRY_ADSPEND_2024 = {
  US: { total: 380.0,  source: "MAGNA + GroupM 평균", year: 2024 },
  CN: { total: 152.0,  source: "GroupM TYNY 2024",     year: 2024 },
  GB: { total:  49.5,  source: "MAGNA UK Dec 2024",    year: 2024 },
  JP: { total:  56.2,  source: "Dentsu Japan 2024",    year: 2024 },
  DE: { total:  31.8,  source: "MAGNA Germany 2024",   year: 2024 },
  FR: { total:  18.5,  source: "MAGNA France 2024",    year: 2024 },
  BR: { total:  15.2,  source: "GroupM Brazil 2024",   year: 2024 },
  IN: { total:  14.5,  source: "GroupM India 2024",    year: 2024 },
  KR: { total:  16.9,  source: "KOBACO 2023 actuals + 제일기획 2024", year: 2024 },
  CA: { total:  18.7,  source: "MAGNA Canada 2024",    year: 2024 },
  AU: { total:  14.2,  source: "MAGNA Australia 2024", year: 2024 },
  IT: { total:  10.8,  source: "MAGNA Italy 2024",     year: 2024 },
  ES: { total:   8.4,  source: "MAGNA Spain 2024",     year: 2024 },
  MX: { total:   8.9,  source: "GroupM Mexico 2024",   year: 2024 },
  RU: { total:   8.5,  source: "Dentsu Russia 2024 (제한)", year: 2024 },
  PL: { total:   4.7,  source: "MAGNA Poland 2024",    year: 2024 },
  TR: { total:   3.8,  source: "Dentsu Turkey 2024",   year: 2024 },
  AE: { total:   3.2,  source: "Dentsu MENA 2024",     year: 2024 },
  SA: { total:   3.5,  source: "Dentsu MENA 2024",     year: 2024 },
  ZA: { total:   2.1,  source: "Dentsu Africa 2024",   year: 2024 },
  ID: { total:   4.6,  source: "GroupM Indonesia 2024", year: 2024 },
  TH: { total:   3.4,  source: "GroupM Thailand 2024", year: 2024 },
  VN: { total:   2.2,  source: "GroupM Vietnam 2024",  year: 2024 },
  PH: { total:   1.9,  source: "GroupM Philippines 2024", year: 2024 },
  MY: { total:   1.7,  source: "GroupM Malaysia 2024", year: 2024 },
  SG: { total:   2.6,  source: "GroupM Singapore 2024", year: 2024 },
  TW: { total:   3.1,  source: "GroupM Taiwan 2024",   year: 2024 },
  HK: { total:   1.6,  source: "GroupM HK 2024",       year: 2024 },
  NL: { total:   6.4,  source: "MAGNA Netherlands 2024", year: 2024 },
  SE: { total:   3.8,  source: "MAGNA Sweden 2024",    year: 2024 },
  NO: { total:   2.6,  source: "MAGNA Norway 2024",    year: 2024 },
  DK: { total:   2.4,  source: "MAGNA Denmark 2024",   year: 2024 },
  FI: { total:   1.7,  source: "MAGNA Finland 2024",   year: 2024 },
  CH: { total:   5.8,  source: "MAGNA Switzerland 2024", year: 2024 },
  AT: { total:   3.4,  source: "MAGNA Austria 2024",   year: 2024 },
  BE: { total:   3.1,  source: "MAGNA Belgium 2024",   year: 2024 },
  IE: { total:   1.9,  source: "MAGNA Ireland 2024",   year: 2024 },
  AR: { total:   3.2,  source: "GroupM Argentina 2024", year: 2024 },
  CO: { total:   2.4,  source: "GroupM Colombia 2024", year: 2024 },
  CL: { total:   1.8,  source: "GroupM Chile 2024",    year: 2024 },
  PE: { total:   1.2,  source: "GroupM Peru 2024",     year: 2024 },
  EG: { total:   1.4,  source: "Dentsu Egypt 2024",    year: 2024 },
  NG: { total:   1.1,  source: "Dentsu Nigeria 2024",  year: 2024 },
  NZ: { total:   2.3,  source: "MAGNA New Zealand 2024", year: 2024 },
};

// ─────────────────────────────────────────────────────────────
// 채널별 광고비 점유율 — GroupM TYNY 2024 + MAGNA 2024 글로벌 평균
// 우리 9 채널 구조에 매핑 (Statista AMO 9 세그먼트와 정렬)
// ─────────────────────────────────────────────────────────────
export const CHANNEL_SPEND_SHARE_2024 = {
  tv_video:    { share: 0.225, trend: -0.012, source: "GroupM TYNY 2024", note: "Linear TV 하락 / CTV 상승 상쇄" },
  search:      { share: 0.215, trend: +0.008, source: "GroupM TYNY 2024", note: "AI 검색 영향 주시 중" },
  social:      { share: 0.175, trend: +0.015, source: "MAGNA Dec 2024",   note: "TikTok/Meta 양강" },
  banner:      { share: 0.130, trend: +0.005, source: "MAGNA Dec 2024",   note: "Programmatic 비중 증가" },
  ooh:         { share: 0.067, trend: +0.003, source: "MAGNA Dec 2024",   note: "DOOH 견인" },
  classifieds: { share: 0.058, trend: -0.002, source: "Statista AMO",     note: "성숙 시장" },
  influencer:  { share: 0.064, trend: +0.025, source: "Statista AMO 2024", note: "가장 빠른 성장률 (+18% YoY)" },
  print:       { share: 0.038, trend: -0.022, source: "MAGNA Dec 2024",   note: "구조적 하락" },
  audio:       { share: 0.028, trend: +0.004, source: "MAGNA Dec 2024",   note: "팟캐스트 견인" },
};

// ─────────────────────────────────────────────────────────────
// 한국 매체별 광고비 — KOBACO 2023 actuals + 제일기획 2024
// 출처: 방송통신광고비조사 보고서 (KOBACO) + 제일기획 광고연감
// 단위: 억원 → USD 환산 (1 USD ≈ 1,350 KRW)
// ─────────────────────────────────────────────────────────────
export const KR_MEDIA_ADSPEND_2024 = {
  // KOBACO 분류 → 우리 매체 ID 매핑
  search_naver:   { krw: 25000, usd: 1852, source: "KOBACO 2023" },
  search_google:  { krw: 18000, usd: 1333, source: "제일기획 추정" },
  search_daum:    { krw:  3500, usd:  259, source: "KOBACO 2023" },
  tvv_terrestrial:{ krw:  9500, usd:  704, source: "KOBACO 2023 지상파TV" },
  tvv_news:       { krw:  3200, usd:  237, source: "KOBACO 2023" },
  tvv_cable_ent:  { krw:  7800, usd:  578, source: "KOBACO 2023 CATV/PP" },
  tvv_cable_sports:{ krw: 2400, usd:  178, source: "KOBACO 2023" },
  tvv_youtube:    { krw:  8500, usd:  630, source: "제일기획 2024 동영상" },
  tvv_netflix:    { krw:  3200, usd:  237, source: "제일기획 추정 OTT" },
  tvv_youtube_tv: { krw:  2800, usd:  207, source: "제일기획 추정 CTV" },
  social_kakao:   { krw: 11500, usd:  852, source: "카카오 IR + KOBACO" },
  social_instagram:{ krw: 6200, usd:  459, source: "제일기획 2024" },
  social_facebook:{ krw:  3400, usd:  252, source: "제일기획 2024" },
  social_tiktok:  { krw:  2800, usd:  207, source: "제일기획 2024" },
  social_x:       { krw:   850, usd:   63, source: "제일기획 추정" },
  banner_standard:{ krw:  5400, usd:  400, source: "KOBACO 디스플레이" },
  banner_native_feed:{ krw: 3200, usd: 237, source: "제일기획 2024" },
  banner_dsp:     { krw:  4800, usd:  356, source: "제일기획 Programmatic" },
  print_daily:    { krw:  3800, usd:  281, source: "KOBACO 2023 신문" },
  print_econ:     { krw:  1600, usd:  119, source: "KOBACO 2023" },
  print_lifestyle:{ krw:   850, usd:   63, source: "KOBACO 2023 잡지" },
  ooh_highway:    { krw:  1200, usd:   89, source: "KOBACO 2023 옥외" },
  ooh_urban:      { krw:  2100, usd:  156, source: "KOBACO 2023" },
  ooh_subway:     { krw:  1450, usd:  107, source: "KOBACO 2023 교통" },
  ooh_bus:        { krw:  1100, usd:   81, source: "KOBACO 2023" },
  ooh_cinema_preroll:{ krw: 980, usd:   73, source: "KOBACO 2023 영화관" },
  audio_fm:       { krw:  2400, usd:  178, source: "KOBACO 2023 라디오" },
  audio_spotify:  { krw:   320, usd:   24, source: "제일기획 추정" },
  audio_pod_spotify:{ krw:  180, usd:   13, source: "제일기획 추정" },
  inf_youtube:    { krw:  2800, usd:  207, source: "제일기획 2024 인플루언서" },
  inf_instagram:  { krw:  1900, usd:  141, source: "제일기획 2024" },
  inf_naver_blog: { krw:  1400, usd:  104, source: "Naver IR + 제일기획" },
  inf_tiktok:     { krw:   920, usd:   68, source: "제일기획 2024" },
};

// ─────────────────────────────────────────────────────────────
// 광고비 조회 헬퍼
// ─────────────────────────────────────────────────────────────
export function getCountryAdSpend(code) {
  const entry = COUNTRY_ADSPEND_2024[code];
  if (!entry) return null;
  return {
    country: code,
    totalUSD: entry.total * 1_000_000_000,
    totalUSDB: entry.total,
    source: entry.source,
    year: entry.year,
    method: "공개 PDF 보고서 (MAGNA/GroupM/Dentsu/KOBACO) 베이스라인",
  };
}

export function getKoreaMediaAdSpend(mediaId) {
  return KR_MEDIA_ADSPEND_2024[mediaId] || null;
}

export function listAdspendSources() {
  return ADSPEND_SOURCES;
}

// ─────────────────────────────────────────────────────────────
// 미래: PDF 자동 다운로드 + 파싱 stub
// 활성화 시 매월 cron으로 최신 보고서 fetch 후 베이스라인 갱신
// ─────────────────────────────────────────────────────────────
export async function fetchAndParsePDF(_source) {
  return {
    ok: false,
    reason: "stub",
    note: "PDF 자동 파싱 어댑터 (cron) 미구현 — 현재는 베이스라인 하드코딩 사용",
    todo: [
      "1. node-fetch + pdf-parse 의존성 추가",
      "2. Cloud Scheduler 월 1회 cron 등록",
      "3. 각 source URL에서 최신 PDF 다운로드",
      "4. 채널별·국가별 수치 정규식/표 추출",
      "5. COUNTRY_ADSPEND_2024 / CHANNEL_SPEND_SHARE_2024 자동 갱신",
    ],
  };
}
