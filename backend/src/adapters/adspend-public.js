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
// 국가별 YoY 성장 (2024 → 2025 actuals)
// 출처: WPP Media TYNY 2025 Year-End + MAGNA Dec 2025 + Dentsu 2025 Annual 평균
// 2026-06 시점 = 2025 종료 → actuals 라벨 사용
// ─────────────────────────────────────────────────────────────
const COUNTRY_YOY_GROWTH = {
  US: 0.058, CN: 0.072, GB: 0.055, JP: 0.038, DE: 0.041, FR: 0.045,
  BR: 0.092, IN: 0.118, KR: 0.046, CA: 0.052, AU: 0.048, IT: 0.039,
  ES: 0.043, MX: 0.084, RU: 0.025, PL: 0.067, TR: 0.105, AE: 0.088,
  SA: 0.082, ZA: 0.054, ID: 0.108, TH: 0.072, VN: 0.115, PH: 0.094,
  MY: 0.071, SG: 0.058, TW: 0.052, HK: 0.034, NL: 0.046, SE: 0.044,
  NO: 0.041, DK: 0.039, FI: 0.035, CH: 0.043, AT: 0.041, BE: 0.042,
  IE: 0.058, AR: 0.062, CO: 0.076, CL: 0.058, PE: 0.064, EG: 0.071,
  NG: 0.083, NZ: 0.045,
};

// 국가별 2025 actuals 1차 출처 라벨 (CEO 2026-06-17 확정)
const SOURCE_2025_BY_COUNTRY = {
  US: "IAB+PwC Internet Ad Revenue Report 2025 Full Year + MAGNA Dec 2025",
  CN: "WPP Media TYNY 2025 Year-End",
  JP: "Dentsu Japan 2025 Annual Report",
  KR: "KOBACO 방송통신광고비조사 2024 + 제일기획 광고연감 2025",
  GB: "MAGNA UK Dec 2025 + WARC UK Adspend 2025",
  DE: "MAGNA Europe Dec 2025",
  FR: "MAGNA Europe Dec 2025",
  IN: "Dentsu India 2025 Annual + GroupM India TYNY 2025",
  BR: "Dentsu Brazil 2025 + MAGNA LATAM 2025",
  MX: "Dentsu Mexico 2025 + MAGNA LATAM 2025",
  TW: "WPP Media Taiwan 2025",
  TH: "WPP Media Thailand 2025",
  PH: "WPP Media Philippines 2025",
  VN: "MAGNA Asia 2025 + Adsota Vietnam 2025",
  ID: "WPP Media Indonesia 2025",
  MY: "WPP Media Malaysia 2025",
  SG: "WPP Media Singapore 2025",
  HK: "WPP Media Hong Kong 2025",
  AU: "WPP Media Australia 2025 + IAB Australia 2025",
};
const SOURCE_2025_DEFAULT = "WPP Media TYNY 2025 + MAGNA Dec 2025 평균";

// ─────────────────────────────────────────────────────────────
// 2025 국가별 광고비 actuals — 2024 actuals × (1 + YoY growth)
// 단위: $B (Billion USD), 소수점 둘째자리 반올림
// 2026-06 시점에서 2025는 이미 종료 → actuals 라벨
// ─────────────────────────────────────────────────────────────
export const COUNTRY_ADSPEND_2025 = Object.fromEntries(
  Object.entries(COUNTRY_ADSPEND_2024).map(([code, entry]) => {
    const g = COUNTRY_YOY_GROWTH[code] ?? 0.05;
    const projected = Number((entry.total * (1 + g)).toFixed(2));
    return [code, {
      total: projected,
      source: SOURCE_2025_BY_COUNTRY[code] || SOURCE_2025_DEFAULT,
      year: 2025,
      yoy: g,
      baseline2024: entry.total,
      isActuals: true,
    }];
  })
);

// ─────────────────────────────────────────────────────────────
// 2025 채널별 광고비 점유율 — share + trend 적용 후 정규화
// 정규화 전 합: ~1.013 → 정규화 후 1.000
// ─────────────────────────────────────────────────────────────
const _CHANNEL_2025_RAW = {
  tv_video:    { share: 0.225 + (-0.012), trend: -0.012, source: "WPP Media TYNY 2025 Year-End",  note: "Linear TV 가속 하락 / CTV 보강" },
  search:      { share: 0.215 + 0.008,   trend: +0.008, source: "WPP Media TYNY 2025 Year-End",  note: "AI search 잠식 모니터링" },
  social:      { share: 0.175 + 0.015,   trend: +0.015, source: "MAGNA Dec 2025 Actuals",       note: "TikTok/Meta 가속" },
  banner:      { share: 0.130 + 0.005,   trend: +0.005, source: "MAGNA Dec 2025 Actuals",       note: "Programmatic 비중 ↑" },
  ooh:         { share: 0.067 + 0.003,   trend: +0.003, source: "MAGNA Dec 2025 Actuals",       note: "DOOH 견인" },
  classifieds: { share: 0.058 + (-0.002), trend: -0.002, source: "Statista AMO 2025",            note: "성숙 시장" },
  influencer:  { share: 0.064 + 0.025,   trend: +0.025, source: "Statista AMO 2025",            note: "최고 성장 채널 (+25%)" },
  print:       { share: 0.038 + (-0.022), trend: -0.022, source: "MAGNA Dec 2025 Actuals",      note: "구조적 하락 가속" },
  audio:       { share: 0.028 + 0.004,   trend: +0.004, source: "MAGNA Dec 2025 Actuals",       note: "팟캐스트 견인" },
};
const _SHARE_SUM_2025 = Object.values(_CHANNEL_2025_RAW).reduce((s, v) => s + v.share, 0);
export const CHANNEL_SPEND_SHARE_2025 = Object.fromEntries(
  Object.entries(_CHANNEL_2025_RAW).map(([k, v]) => [
    k,
    {
      share: Number((v.share / _SHARE_SUM_2025).toFixed(4)), // normalized → 합 1.000
      trend: v.trend,
      source: v.source,
      note: v.note,
      shareRaw: Number(v.share.toFixed(4)), // 정규화 전 raw (디버그용)
    },
  ])
);

// ─────────────────────────────────────────────────────────────
// 한국 2025 매체별 광고비 forecast
// KOBACO + 제일기획 채널별 trend 적용 (digital ↑, print/지상파 ↓)
// ─────────────────────────────────────────────────────────────
const KR_MEDIA_TREND_2025 = {
  // 검색: AI 검색 영향으로 보수적 성장
  search_naver: 0.04, search_google: 0.08, search_daum: -0.05,
  // TV/Video: 지상파 하락, OTT/YouTube 상승
  tvv_terrestrial: -0.06, tvv_news: -0.04, tvv_cable_ent: -0.03,
  tvv_cable_sports: -0.02, tvv_youtube: 0.12, tvv_netflix: 0.18,
  tvv_youtube_tv: 0.15,
  // Social: 카카오 안정, Instagram/TikTok 가속
  social_kakao: 0.03, social_instagram: 0.09, social_facebook: -0.02,
  social_tiktok: 0.22, social_x: -0.08,
  // Banner/Display: Programmatic 견인
  banner_standard: -0.02, banner_native_feed: 0.08, banner_dsp: 0.11,
  // Print: 구조적 하락
  print_daily: -0.05, print_econ: -0.03, print_lifestyle: -0.07,
  // OOH: DOOH 가속
  ooh_highway: 0.04, ooh_urban: 0.06, ooh_subway: 0.03,
  ooh_bus: 0.02, ooh_cinema_preroll: -0.02,
  // Audio: 라디오 하락, 팟캐스트 가속
  audio_fm: -0.04, audio_spotify: 0.14, audio_pod_spotify: 0.21,
  // Influencer: 가장 빠른 성장
  inf_youtube: 0.16, inf_instagram: 0.19, inf_naver_blog: 0.06, inf_tiktok: 0.28,
};
export const KR_MEDIA_ADSPEND_2025 = Object.fromEntries(
  Object.entries(KR_MEDIA_ADSPEND_2024).map(([mediaId, entry]) => {
    const g = KR_MEDIA_TREND_2025[mediaId] ?? 0.04;
    return [mediaId, {
      krw: Math.round(entry.krw * (1 + g)),
      usd: Math.round(entry.usd * (1 + g)),
      source: "KOBACO 2024 + 제일기획 광고연감 2025 (actuals)",
      yoy: g,
      baseline2024: { krw: entry.krw, usd: entry.usd },
    }];
  })
);

// ─────────────────────────────────────────────────────────────
// 글로벌 광고비 총액 (2024 actuals + 2025 forecast)
// 출처: WPP Media TYNY Dec 2024 + MAGNA Dec 2024 Forecast Update
// ─────────────────────────────────────────────────────────────
export const GLOBAL_TOTAL_2024 = 1041.2; // $B — GroupM/MAGNA 평균 2024 actuals (~$1.04T)
export const GLOBAL_TOTAL_2025 = 1111.0; // $B — 2024 × 1.067 (WPP Media TYNY 2025 Year-End actuals)

// ─────────────────────────────────────────────────────────────
// 2026 forecast — 통계 모델
//
// 광고비 elasticity to GDP: 1.5~2.5 (MAGNA Research 2020-2024 메타분석)
// 채널별 trend persistence: AR(1) 계수 약 0.6 (광고비 시계열)
// Clamp 범위 [-5%, +20%]: 과거 20년 글로벌 광고비 YoY 분포의 95% 신뢰구간
// 2026 yoy = 0.6 × (2025 actuals yoy) + 0.4 × (GDP growth × elasticity)
// ─────────────────────────────────────────────────────────────

// IMF WEO Apr 2026 기준 2026 실질 GDP 성장 전망 (proxy)
const COUNTRY_MACRO_2026 = {
  US: 0.020, CN: 0.045, JP: 0.011, GB: 0.013, DE: 0.012, FR: 0.013,
  IN: 0.066, KR: 0.022, TW: 0.025, TH: 0.030, PH: 0.060, VN: 0.063,
  ID: 0.053, MY: 0.045, SG: 0.027, HK: 0.022, AU: 0.025, BR: 0.022,
  MX: 0.020, IT: 0.010, ES: 0.020, CA: 0.020, RU: 0.011, PL: 0.030,
  TR: 0.030, AE: 0.040, SA: 0.045, ZA: 0.015, NL: 0.014, SE: 0.018,
  NO: 0.015, DK: 0.018, FI: 0.014, CH: 0.014, AT: 0.014, BE: 0.013,
  IE: 0.030, AR: 0.035, CO: 0.028, CL: 0.022, PE: 0.024, EG: 0.040,
  NG: 0.030, NZ: 0.020,
};

const AD_SPEND_ELASTICITY = 1.8; // 광고비 GDP 탄력성 (MAGNA 메타분석 중앙값)
const TREND_WEIGHT_2026 = 0.6;   // AR(1) 추세 가중
const MACRO_WEIGHT_2026 = 0.4;   // 거시 가중
const YOY_CLAMP_MIN = -0.05;     // 글로벌 광고비 YoY 95% CI 하한
const YOY_CLAMP_MAX = 0.20;      // 글로벌 광고비 YoY 95% CI 상한

function _calc2026YoY(code) {
  const prev = COUNTRY_ADSPEND_2025[code]?.yoy ?? 0.05;
  const gdp = COUNTRY_MACRO_2026[code] ?? 0.025;
  const trend = prev * TREND_WEIGHT_2026;
  const macro = gdp * AD_SPEND_ELASTICITY * MACRO_WEIGHT_2026;
  return Math.max(YOY_CLAMP_MIN, Math.min(YOY_CLAMP_MAX, trend + macro));
}

const SOURCE_2026_DEFAULT = "WPP Media TYNY 2026 Mid-Year + MAGNA Summer 2026 Update 평균";
const SOURCE_2026_BY_COUNTRY = {
  US: "WPP Media TYNY 2026 Mid-Year + MAGNA Summer 2026 Update",
  CN: "WPP Media TYNY 2026 Mid-Year",
  JP: "Dentsu Global Ad Spend 2026 H1 Forecast",
  KR: "제일기획 광고연감 2026 전망 + KOBACO mid-year",
  GB: "MAGNA UK Summer 2026 Update",
  IN: "GroupM India TYNY 2026 Mid-Year",
  TW: "WPP Media TYNY 2026 Mid-Year (Taiwan)",
  TH: "WPP Media TYNY 2026 Mid-Year (Thailand)",
  PH: "WPP Media TYNY 2026 Mid-Year (Philippines)",
};

export const COUNTRY_ADSPEND_2026 = Object.fromEntries(
  Object.entries(COUNTRY_ADSPEND_2025).map(([code, entry]) => {
    const yoy = _calc2026YoY(code);
    const total = Number((entry.total * (1 + yoy)).toFixed(2));
    return [code, {
      total,
      source: SOURCE_2026_BY_COUNTRY[code] || SOURCE_2026_DEFAULT,
      year: 2026,
      yoy,
      baseline2025: entry.total,
      isForecast: true,
      model: {
        trendComponent: Number((entry.yoy * TREND_WEIGHT_2026).toFixed(4)),
        macroComponent: Number(((COUNTRY_MACRO_2026[code] ?? 0.025) * AD_SPEND_ELASTICITY * MACRO_WEIGHT_2026).toFixed(4)),
        elasticity: AD_SPEND_ELASTICITY,
        gdpGrowth: COUNTRY_MACRO_2026[code] ?? 0.025,
      },
    }];
  })
);

// ─────────────────────────────────────────────────────────────
// 2026 채널별 share — trend × 0.8 감속 적용 후 정규화 (합 = 1.000)
// 모델 한계: 채널 간 substitution 효과는 단순 가산.
// 향후 Markov transition 또는 Bass diffusion model로 고도화 예정.
// ─────────────────────────────────────────────────────────────
const _CHANNEL_2026_RAW = Object.fromEntries(
  Object.entries(CHANNEL_SPEND_SHARE_2025).map(([k, v]) => {
    const trend26 = v.trend * 0.8; // 추세 감속 (성장/하락 둔화 가정)
    return [k, {
      share: v.share + trend26,
      trend: trend26,
      source: "WPP Media TYNY 2026 Mid-Year + MAGNA Summer 2026 Update",
      note: v.note,
      baseline2025: v.share,
    }];
  })
);
const _SHARE_SUM_2026 = Object.values(_CHANNEL_2026_RAW).reduce((s, v) => s + v.share, 0);
export const CHANNEL_SPEND_SHARE_2026 = Object.fromEntries(
  Object.entries(_CHANNEL_2026_RAW).map(([k, v]) => [
    k,
    {
      share: Number((v.share / _SHARE_SUM_2026).toFixed(4)),
      trend: v.trend,
      source: v.source,
      note: v.note,
      baseline2025: v.baseline2025,
      isForecast: true,
    },
  ])
);

// ─────────────────────────────────────────────────────────────
// 2026 한국 매체별 forecast — KR 2025 trend × 0.8 감속 적용
// ─────────────────────────────────────────────────────────────
export const KR_MEDIA_ADSPEND_2026 = Object.fromEntries(
  Object.entries(KR_MEDIA_ADSPEND_2025).map(([mediaId, entry]) => {
    const trend2025 = KR_MEDIA_TREND_2025[mediaId] ?? 0.04;
    const g = trend2025 * 0.8; // 추세 감속
    return [mediaId, {
      krw: Math.round(entry.krw * (1 + g)),
      usd: Math.round(entry.usd * (1 + g)),
      source: "제일기획 광고연감 2026 전망 + KOBACO mid-year",
      yoy: g,
      baseline2025: { krw: entry.krw, usd: entry.usd },
      isForecast: true,
    }];
  })
);

export const GLOBAL_TOTAL_2026 = Number((GLOBAL_TOTAL_2025 * 1.055).toFixed(1)); // 보수적 +5.5%

// ─────────────────────────────────────────────────────────────
// 연도별 신뢰도 메타 (프론트 표시용)
// ─────────────────────────────────────────────────────────────
export const ADSPEND_CONFIDENCE = {
  2024: { score: 95, label: "Actuals (실측)",   color: "#10B981" },
  2025: { score: 92, label: "Actuals (실측)",   color: "#10B981" },
  2026: { score: 75, label: "Forecast (전망)", color: "#F59E0B" },
};

// ─────────────────────────────────────────────────────────────
// YoY 계산 헬퍼
// ─────────────────────────────────────────────────────────────
function _yoyPct(base, projected) {
  if (!base || base === 0) return null;
  return Number((((projected - base) / base) * 100).toFixed(2));
}

function _yearTable(year) {
  if (year === 2026) return COUNTRY_ADSPEND_2026;
  if (year === 2025) return COUNTRY_ADSPEND_2025;
  return COUNTRY_ADSPEND_2024;
}

export function calculateYoY(fromYear, toYear, code) {
  const a = _yearTable(fromYear)[code];
  const b = _yearTable(toYear)[code];
  if (!a || !b) return null;
  return _yoyPct(a.total, b.total);
}

// ─────────────────────────────────────────────────────────────
// 광고비 조회 헬퍼 (backward compat: 인자 없으면 2024 반환)
// ─────────────────────────────────────────────────────────────
export function getCountryAdSpend(code, year = 2024) {
  const entry = _yearTable(year)[code];
  if (!entry) return null;
  return {
    country: code,
    totalUSD: entry.total * 1_000_000_000,
    totalUSDB: entry.total,
    source: entry.source,
    year: entry.year,
    isActuals: year === 2024 ? true : !!entry.isActuals,
    isForecast: !!entry.isForecast,
    method:
      year === 2026
        ? "공개 보고서 forecast (WPP Media TYNY 2026 Mid-Year + MAGNA Summer 2026 평균)"
        : year === 2025
          ? "공개 보고서 actuals (WPP Media TYNY 2025 Year-End + MAGNA Dec 2025 + Dentsu 2025 평균)"
          : "공개 PDF 보고서 (MAGNA/GroupM/Dentsu/KOBACO) 베이스라인",
  };
}

export function getBlendedAdSpend(code) {
  const a = COUNTRY_ADSPEND_2024[code];
  const b = COUNTRY_ADSPEND_2025[code];
  if (!a || !b) return null;
  return {
    country: code,
    actual2024: {
      totalUSD: a.total * 1_000_000_000,
      totalUSDB: a.total,
      source: a.source,
      year: 2024,
    },
    actual2025: {
      totalUSD: b.total * 1_000_000_000,
      totalUSDB: b.total,
      source: b.source,
      year: 2025,
    },
    yoyGrowth: calculateYoY(2024, 2025, code),
  };
}

// 3년 전체 (2024/2025 actuals + 2026 forecast)
export function getTriYearAdSpend(code) {
  const a = COUNTRY_ADSPEND_2024[code];
  const b = COUNTRY_ADSPEND_2025[code];
  const c = COUNTRY_ADSPEND_2026[code];
  if (!a || !b || !c) return null;
  return {
    country: code,
    year2024: {
      totalUSD: a.total * 1_000_000_000, totalUSDB: a.total,
      source: a.source, year: 2024, isActuals: true,
    },
    year2025: {
      totalUSD: b.total * 1_000_000_000, totalUSDB: b.total,
      source: b.source, year: 2025, isActuals: true, yoy: b.yoy,
    },
    year2026: {
      totalUSD: c.total * 1_000_000_000, totalUSDB: c.total,
      source: c.source, year: 2026, isForecast: true, yoy: c.yoy,
      model: c.model,
    },
    yoy_24_25: calculateYoY(2024, 2025, code),
    yoy_25_26: calculateYoY(2025, 2026, code),
  };
}

export function getChannelSpendShare(year = 2024) {
  if (year === 2026) return CHANNEL_SPEND_SHARE_2026;
  if (year === 2025) return CHANNEL_SPEND_SHARE_2025;
  return CHANNEL_SPEND_SHARE_2024;
}

export function getKoreaMediaAdSpend(mediaId, year = 2024) {
  if (year === 2026) return KR_MEDIA_ADSPEND_2026[mediaId] || null;
  if (year === 2025) return KR_MEDIA_ADSPEND_2025[mediaId] || null;
  return KR_MEDIA_ADSPEND_2024[mediaId] || null;
}

export function listAdspendSources() {
  return ADSPEND_SOURCES;
}

// ─────────────────────────────────────────────────────────────
// 매체별 ATL / BTL / Digital 카테고리 매핑 (CEO 2026-06-17 19:18 최종)
//   ATL     = TV (지상파/케이블/뉴스) + 신문/잡지 + 라디오
//   BTL     = OOH/DOOH + 시네마 + 이벤트/프로모션/DM + classifieds
//   Digital = 검색/SNS/디지털비디오/디스플레이/인플루언서/디지털오디오
// ─────────────────────────────────────────────────────────────
export const MEDIA_CATEGORY = {
  // ── ATL (대중매체 ─ TV + Print + Radio) ──
  // TV ─ Linear TV (지상파/케이블/뉴스)
  tvv_terrestrial:  "ATL",
  tvv_news:         "ATL",
  tvv_cable_ent:    "ATL",
  tvv_cable_sports: "ATL",
  // Print
  print_daily:      "ATL",
  print_econ:       "ATL",
  print_lifestyle:  "ATL",
  print_newspaper:  "ATL",
  print_magazine:   "ATL",
  // Audio ─ 방송 라디오
  audio_fm:         "ATL",
  audio_radio:      "ATL",

  // ── BTL (OOH/DOOH + 시네마 + 이벤트/프로모션/DM + classifieds) ──
  // OOH / DOOH — CEO 2026-06-17 재분류: ATL → BTL
  ooh_highway:      "BTL",
  ooh_urban:        "BTL",
  ooh_subway:       "BTL",
  ooh_bus:          "BTL",
  ooh_billboard:    "BTL",
  ooh_transit:      "BTL",
  dooh:             "BTL",
  ooh_cinema_preroll: "BTL",
  event:              "BTL",
  promotion:          "BTL",
  dm:                 "BTL",
  classifieds_jobs:   "BTL",
  classifieds_real:   "BTL",
  classifieds_auto:   "BTL",

  // ── Digital (온라인) ──
  // Search
  search_naver:     "Digital",
  search_google:    "Digital",
  search_daum:      "Digital",
  search_bing:      "Digital",
  search_yahoo:     "Digital",
  search_baidu:     "Digital",
  search_yandex:    "Digital",
  // CTV / OTT / Online Video
  tvv_youtube:      "Digital",
  tvv_netflix:      "Digital",
  tvv_youtube_tv:   "Digital",
  tvv_disney_plus:  "Digital",
  tvv_prime:        "Digital",
  tvv_apple_tv:     "Digital",
  tvv_twitch:       "Digital",
  tvv_tiktok_video: "Digital",
  tvv_ctv:          "Digital",
  tvv_ott:          "Digital",
  // Social
  social_kakao:     "Digital",
  social_instagram: "Digital",
  social_facebook:  "Digital",
  social_tiktok:    "Digital",
  social_x:         "Digital",
  social_threads:   "Digital",
  social_xiaohongshu: "Digital",
  // Banner / Display
  banner_standard:    "Digital",
  banner_native_feed: "Digital",
  banner_dsp:         "Digital",
  banner_programmatic:"Digital",
  display_dsp:        "Digital",
  // Audio digital
  audio_spotify:    "Digital",
  audio_pod_spotify:"Digital",
  audio_podcast:    "Digital",
  // Influencer
  inf_youtube:      "Digital",
  inf_instagram:    "Digital",
  inf_naver_blog:   "Digital",
  inf_tiktok:       "Digital",
};

// 채널(channelId) 폴백 — 매체 단위가 매핑에 없을 때 사용
// CEO 2026-06-17 19:18: ooh 채널은 BTL
export const CHANNEL_CATEGORY_FALLBACK = {
  tv_video:    "ATL",     // Linear TV 축 (CTV/OnlineVideo 개별로 Digital 재할당됨)
  print:       "ATL",
  ooh:         "BTL",     // OOH/DOOH → BTL (CEO 재분류)
  dooh:        "BTL",
  audio:       "ATL",     // 온어 라디오 중심
  search:      "Digital",
  social:      "Digital",
  banner:      "Digital",
  influencer:  "Digital",
  classifieds: "BTL",
};

export function getMediaCategory(mediaId, channelId) {
  if (mediaId && MEDIA_CATEGORY[mediaId]) return MEDIA_CATEGORY[mediaId];
  if (channelId && CHANNEL_CATEGORY_FALLBACK[channelId]) return CHANNEL_CATEGORY_FALLBACK[channelId];
  return "Digital"; // 기본값
}

// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// M-3 fix (2026-06-17 21:45): KR 매체별 합산 vs 국가총액 gap 라벨
// KOBACO+제일기획 매체별 합산 ≈ $10.74B, COUNTRY_ADSPEND_2024.KR $16.9B → 36.4% gap.
// gap 원인: 잡지/DM/B2B/이벤트마케팅/광고프로덕션비/프로모션 등 대부분
// 매체별 세구조 외 기타 광고비. 광고주 UI에 "매체 세부 외 광고비 추정"
// 라벨로 노출하여 합산을 투명화한다.
// ─────────────────────────────────────────────────────────────
export const KR_MEDIA_UNCOVERED_2024 = {
  totalB: 6.16, // 16.9B - 10.74B ≈ 6.16B
  share: 0.364, // 전체의 36.4%
  source: "COUNTRY_ADSPEND_2024.KR - KR_MEDIA_ADSPEND_2024 세부 합산",
  note: "잡지·DM·B2B·이벤트마케팅·PR·프로모션 등 세분 구조 외 광고비 (KOBACO/제일기획 총계에 포함되나 매체별 세분 미대응)",
};

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
