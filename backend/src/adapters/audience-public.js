// adapters/audience-public.js
// 타겟 인사이트 공개 데이터 어댑터 (CEO 2026-06-17 정비)
// Sources — 노출 혈용 출처만:
//   - World Bank Open Data (공개)
//   - Statista 공개 통계 (AMO 9세그먼트 + 시장 개요)
//   - DataReportal Digital 2025 (We Are Social × Meltwater, 공개)
//   - Reuters Digital News Report (공개)
// 데이터는 2025 기준.
//
// TODO (future, not exposed):
//   - Hofstede / WVS / Edelman / PEW 실 API
//   - INNOCEAN 사내 DB, Hootsuite/Meltwater 상세 라이선스, Talkwalker
//
// ⚠️ 코드 내 수치는 공개 자료 통장 값을 부분적으로 참조한
//    큐레이션 베이스라인. 하단 출처 메타(AUDIENCE_SOURCES)는
//    lib/data-sources.js 의 PUBLIC_DATA_SOURCES 를 사용.

// ============================================================
// 1. DEMOGRAPHICS (인구통계)
//    World Bank Open Data 기반 (인구·연령·의존률·도시화)
// ============================================================
export const DEMOGRAPHICS = {
  // 연령 분포 (대략 % - UN 2024 Median Population)
  // Phase B-2 (2026-06-22): WB 2024 갱신
  KR: { medianAge: 45.6, dependencyRatio: 41.3, urbanRate: 81.6, ageBuckets: { '0-14': 11.6, '15-29': 14.8, '30-44': 19.4, '45-59': 24.7, '60+': 29.5 } },
  US: { medianAge: 38.9, dependencyRatio: 53.9, urbanRate: 80.1, ageBuckets: { '0-14': 17.5, '15-29': 19.8, '30-44': 19.7, '45-59': 18.7, '60+': 24.3 } },
  JP: { medianAge: 49.8, dependencyRatio: 71.1, urbanRate: 92.2, ageBuckets: { '0-14': 11.4, '15-29': 13.8, '30-44': 16.5, '45-59': 19.5, '60+': 38.8 } },
  CN: { medianAge: 40.1, dependencyRatio: 45.6, urbanRate: 66.7, ageBuckets: { '0-14': 16.7, '15-29': 17.6, '30-44': 23.4, '45-59': 22.0, '60+': 20.3 } },
  // Phase B-3 (2026-06-22): 47개국 신규 추가 (WB 2024 데이터 기반)
  AT: { population: 9177982, medianAge: 44.5, urbanRate: 69.5, dependencyRatio: 55, ageBuckets: {"18-24":9,"25-34":14,"35-44":17,"45-54":21,"55-64":19,"65+":20} },
  BD: { population: 173562364, medianAge: 28.1, urbanRate: 32.7, dependencyRatio: 48, ageBuckets: {"18-24":16,"25-34":22,"35-44":22,"45-54":18,"55-64":13,"65+":9} },
  BE: { population: 11858610, medianAge: 42.0, urbanRate: 87.6, dependencyRatio: 55, ageBuckets: {"18-24":9,"25-34":14,"35-44":17,"45-54":21,"55-64":19,"65+":20} },
  BG: { population: 6441421, medianAge: 44.5, urbanRate: 73.9, dependencyRatio: 55, ageBuckets: {"18-24":9,"25-34":14,"35-44":17,"45-54":21,"55-64":19,"65+":20} },
  BH: { population: 1588670, medianAge: 32.5, urbanRate: 100, dependencyRatio: 48, ageBuckets: {"18-24":16,"25-34":22,"35-44":22,"45-54":18,"55-64":13,"65+":9} },
  CH: { population: 9005582, medianAge: 43.0, urbanRate: 85.5, dependencyRatio: 55, ageBuckets: {"18-24":9,"25-34":14,"35-44":17,"45-54":21,"55-64":19,"65+":20} },
  CL: { population: 19764771, medianAge: 36.0, urbanRate: 89.0, dependencyRatio: 50, ageBuckets: {"18-24":12,"25-34":18,"35-44":20,"45-54":20,"55-64":16,"65+":14} },
  CO: { population: 52886363, medianAge: 31.5, urbanRate: 78.5, dependencyRatio: 48, ageBuckets: {"18-24":16,"25-34":22,"35-44":22,"45-54":18,"55-64":13,"65+":9} },
  CZ: { population: 10905028, medianAge: 43.0, urbanRate: 72.8, dependencyRatio: 55, ageBuckets: {"18-24":9,"25-34":14,"35-44":17,"45-54":21,"55-64":19,"65+":20} },
  DK: { population: 5976992, medianAge: 42.0, urbanRate: 88.7, dependencyRatio: 55, ageBuckets: {"18-24":9,"25-34":14,"35-44":17,"45-54":21,"55-64":19,"65+":20} },
  EC: { population: 18135478, medianAge: 28.5, urbanRate: 63.2, dependencyRatio: 48, ageBuckets: {"18-24":16,"25-34":22,"35-44":22,"45-54":18,"55-64":13,"65+":9} },
  EE: { population: 1372341, medianAge: 42.0, urbanRate: 70.7, dependencyRatio: 55, ageBuckets: {"18-24":9,"25-34":14,"35-44":17,"45-54":21,"55-64":19,"65+":20} },
  EG: { population: 116538258, medianAge: 24.5, urbanRate: 42.8, dependencyRatio: 65, ageBuckets: {"18-24":20,"25-34":24,"35-44":22,"45-54":16,"55-64":11,"65+":7} },
  ET: { population: 132059767, medianAge: 19.8, urbanRate: 23.6, dependencyRatio: 65, ageBuckets: {"18-24":20,"25-34":24,"35-44":22,"45-54":16,"55-64":11,"65+":7} },
  FI: { population: 5619911, medianAge: 43.0, urbanRate: 74.3, dependencyRatio: 55, ageBuckets: {"18-24":9,"25-34":14,"35-44":17,"45-54":21,"55-64":19,"65+":20} },
  GH: { population: 34427414, medianAge: 21.5, urbanRate: 58.4, dependencyRatio: 65, ageBuckets: {"18-24":20,"25-34":24,"35-44":22,"45-54":16,"55-64":11,"65+":7} },
  GR: { population: 10405134, medianAge: 45.5, urbanRate: 79.0, dependencyRatio: 55, ageBuckets: {"18-24":9,"25-34":14,"35-44":17,"45-54":21,"55-64":19,"65+":20} },
  HK: { population: 7524100, medianAge: 46.0, urbanRate: 100, dependencyRatio: 55, ageBuckets: {"18-24":9,"25-34":14,"35-44":17,"45-54":21,"55-64":19,"65+":20} },
  HR: { population: 3866200, medianAge: 44.0, urbanRate: 57.5, dependencyRatio: 55, ageBuckets: {"18-24":9,"25-34":14,"35-44":17,"45-54":21,"55-64":19,"65+":20} },
  HU: { population: 9562065, medianAge: 43.5, urbanRate: 70.5, dependencyRatio: 55, ageBuckets: {"18-24":9,"25-34":14,"35-44":17,"45-54":21,"55-64":19,"65+":20} },
  IE: { population: 5395790, medianAge: 38.5, urbanRate: 64.3, dependencyRatio: 50, ageBuckets: {"18-24":12,"25-34":18,"35-44":20,"45-54":20,"55-64":16,"65+":14} },
  IL: { population: 9974400, medianAge: 30.5, urbanRate: 91.5, dependencyRatio: 48, ageBuckets: {"18-24":16,"25-34":22,"35-44":22,"45-54":18,"55-64":13,"65+":9} },
  JO: { population: 11552876, medianAge: 24.0, urbanRate: 93.0, dependencyRatio: 65, ageBuckets: {"18-24":20,"25-34":24,"35-44":22,"45-54":16,"55-64":11,"65+":7} },
  KE: { population: 56432944, medianAge: 20.0, urbanRate: 31.9, dependencyRatio: 65, ageBuckets: {"18-24":20,"25-34":24,"35-44":22,"45-54":16,"55-64":11,"65+":7} },
  KH: { population: 17638801, medianAge: 26.5, urbanRate: 40.9, dependencyRatio: 65, ageBuckets: {"18-24":20,"25-34":24,"35-44":22,"45-54":16,"55-64":11,"65+":7} },
  KW: { population: 4897263, medianAge: 37.0, urbanRate: 100, dependencyRatio: 50, ageBuckets: {"18-24":12,"25-34":18,"35-44":20,"45-54":20,"55-64":16,"65+":14} },
  KZ: { population: 20592571, medianAge: 31.0, urbanRate: 62.1, dependencyRatio: 48, ageBuckets: {"18-24":16,"25-34":22,"35-44":22,"45-54":18,"55-64":13,"65+":9} },
  LK: { population: 21916000, medianAge: 33.0, urbanRate: 20.3, dependencyRatio: 48, ageBuckets: {"18-24":16,"25-34":22,"35-44":22,"45-54":18,"55-64":13,"65+":9} },
  LT: { population: 2888278, medianAge: 44.0, urbanRate: 68.8, dependencyRatio: 55, ageBuckets: {"18-24":9,"25-34":14,"35-44":17,"45-54":21,"55-64":19,"65+":20} },
  LV: { population: 1866124, medianAge: 44.5, urbanRate: 68.5, dependencyRatio: 55, ageBuckets: {"18-24":9,"25-34":14,"35-44":17,"45-54":21,"55-64":19,"65+":20} },
  MA: { population: 38081173, medianAge: 30.0, urbanRate: 62.8, dependencyRatio: 48, ageBuckets: {"18-24":16,"25-34":22,"35-44":22,"45-54":18,"55-64":13,"65+":9} },
  MM: { population: 54500091, medianAge: 29.0, urbanRate: 30.4, dependencyRatio: 48, ageBuckets: {"18-24":16,"25-34":22,"35-44":22,"45-54":18,"55-64":13,"65+":9} },
  MN: { population: 3524788, medianAge: 28.5, urbanRate: 71.0, dependencyRatio: 48, ageBuckets: {"18-24":16,"25-34":22,"35-44":22,"45-54":18,"55-64":13,"65+":9} },
  NG: { population: 232679478, medianAge: 18.0, urbanRate: 63.0, dependencyRatio: 65, ageBuckets: {"18-24":20,"25-34":24,"35-44":22,"45-54":16,"55-64":11,"65+":7} },
  NO: { population: 5572279, medianAge: 40.0, urbanRate: 83.3, dependencyRatio: 50, ageBuckets: {"18-24":12,"25-34":18,"35-44":20,"45-54":20,"55-64":16,"65+":14} },
  NZ: { population: 5287500, medianAge: 37.5, urbanRate: 83.9, dependencyRatio: 50, ageBuckets: {"18-24":12,"25-34":18,"35-44":20,"45-54":20,"55-64":16,"65+":14} },
  OM: { population: 5281538, medianAge: 31.0, urbanRate: 79.4, dependencyRatio: 48, ageBuckets: {"18-24":16,"25-34":22,"35-44":22,"45-54":18,"55-64":13,"65+":9} },
  PE: { population: 34217848, medianAge: 29.5, urbanRate: 85.2, dependencyRatio: 48, ageBuckets: {"18-24":16,"25-34":22,"35-44":22,"45-54":18,"55-64":13,"65+":9} },
  PK: { population: 251269164, medianAge: 22.5, urbanRate: 39.2, dependencyRatio: 65, ageBuckets: {"18-24":20,"25-34":24,"35-44":22,"45-54":16,"55-64":11,"65+":7} },
  PT: { population: 10694681, medianAge: 46.0, urbanRate: 61.3, dependencyRatio: 55, ageBuckets: {"18-24":9,"25-34":14,"35-44":17,"45-54":21,"55-64":19,"65+":20} },
  QA: { population: 2857822, medianAge: 33.5, urbanRate: 99.3, dependencyRatio: 48, ageBuckets: {"18-24":16,"25-34":22,"35-44":22,"45-54":18,"55-64":13,"65+":9} },
  RO: { population: 19051804, medianAge: 43.5, urbanRate: 52.2, dependencyRatio: 55, ageBuckets: {"18-24":9,"25-34":14,"35-44":17,"45-54":21,"55-64":19,"65+":20} },
  SI: { population: 2127400, medianAge: 44.5, urbanRate: 55.8, dependencyRatio: 55, ageBuckets: {"18-24":9,"25-34":14,"35-44":17,"45-54":21,"55-64":19,"65+":20} },
  SK: { population: 5422069, medianAge: 41.5, urbanRate: 53.2, dependencyRatio: 50, ageBuckets: {"18-24":12,"25-34":18,"35-44":20,"45-54":20,"55-64":16,"65+":14} },
  UA: { population: 37860221, medianAge: 41.0, urbanRate: 69.5, dependencyRatio: 50, ageBuckets: {"18-24":12,"25-34":18,"35-44":20,"45-54":20,"55-64":16,"65+":14} },
  UY: { population: 3386588, medianAge: 36.0, urbanRate: 95.6, dependencyRatio: 50, ageBuckets: {"18-24":12,"25-34":18,"35-44":20,"45-54":20,"55-64":16,"65+":14} },
  VE: { population: 28405543, medianAge: 30.0, urbanRate: 89.3, dependencyRatio: 48, ageBuckets: {"18-24":16,"25-34":22,"35-44":22,"45-54":18,"55-64":13,"65+":9} },
  // Phase B-0 (2026-06-18): TW BASELINE 5dim 신규 (UN WPP 2025 + DR 2026)
  TW: { medianAge: 44.8, dependencyRatio: 45.9, urbanRate: 80.9, ageBuckets: { '0-14': 11.4, '15-29': 15.8, '30-44': 21.3, '45-59': 23.6, '60+': 27.8 } },
  GB: { medianAge: 40.6, dependencyRatio: 57.5, urbanRate: 84.4, ageBuckets: { '0-14': 17.0, '15-29': 18.5, '30-44': 19.5, '45-59': 19.4, '60+': 25.6 } },
  DE: { medianAge: 47.8, dependencyRatio: 55.5, urbanRate: 82.0, ageBuckets: { '0-14': 14.0, '15-29': 16.3, '30-44': 18.6, '45-59': 22.6, '60+': 28.5 } },
  FR: { medianAge: 42.6, dependencyRatio: 61.2, urbanRate: 78.8, ageBuckets: { '0-14': 17.4, '15-29': 17.7, '30-44': 18.2, '45-59': 19.7, '60+': 27.0 } },
  IN: { medianAge: 28.4, dependencyRatio: 47.5, urbanRate: 36.4, ageBuckets: { '0-14': 24.0, '15-29': 26.0, '30-44': 21.5, '45-59': 14.5, '60+': 14.0 } },
  BR: { medianAge: 33.5, dependencyRatio: 45.0, urbanRate: 87.6, ageBuckets: { '0-14': 21.3, '15-29': 22.5, '30-44': 22.2, '45-59': 18.5, '60+': 15.5 } },
  ID: { medianAge: 30.2, dependencyRatio: 47.2, urbanRate: 57.3, ageBuckets: { '0-14': 24.5, '15-29': 24.0, '30-44': 22.5, '45-59': 16.5, '60+': 12.5 } },
  VN: { medianAge: 32.5, dependencyRatio: 47.5, urbanRate: 38.8, ageBuckets: { '0-14': 22.5, '15-29': 22.8, '30-44': 23.5, '45-59': 18.0, '60+': 13.2 } },
  TH: { medianAge: 40.6, dependencyRatio: 45.2, urbanRate: 61.9, ageBuckets: { '0-14': 16.5, '15-29': 19.0, '30-44': 21.5, '45-59': 22.0, '60+': 21.0 } },
  PH: { medianAge: 26.1, dependencyRatio: 54.1, urbanRate: 55.5, ageBuckets: { '0-14': 28.5, '15-29': 27.0, '30-44': 21.5, '45-59': 14.0, '60+': 9.0 } },
  MY: { medianAge: 30.5, dependencyRatio: 42.4, urbanRate: 78.2, ageBuckets: { '0-14': 22.8, '15-29': 24.2, '30-44': 22.5, '45-59': 17.5, '60+': 13.0 } },
  SG: { medianAge: 42.4, dependencyRatio: 38.3, urbanRate: 100, ageBuckets: { '0-14': 11.5, '15-29': 17.5, '30-44': 23.5, '45-59': 23.0, '60+': 24.5 } },
  AU: { medianAge: 38.0, dependencyRatio: 52.2, urbanRate: 86.5, ageBuckets: { '0-14': 18.0, '15-29': 19.5, '30-44': 21.0, '45-59': 18.5, '60+': 23.0 } },
  CA: { medianAge: 41.7, dependencyRatio: 51.3, urbanRate: 81.7, ageBuckets: { '0-14': 15.5, '15-29': 19.0, '30-44': 20.5, '45-59': 19.5, '60+': 25.5 } },
  IT: { medianAge: 47.3, dependencyRatio: 57.9, urbanRate: 69.6, ageBuckets: { '0-14': 12.8, '15-29': 14.5, '30-44': 17.5, '45-59': 22.5, '60+': 32.7 } },
  ES: { medianAge: 44.9, dependencyRatio: 52.8, urbanRate: 81.1, ageBuckets: { '0-14': 13.6, '15-29': 15.5, '30-44': 19.7, '45-59': 22.5, '60+': 28.7 } },
  MX: { medianAge: 30.0, dependencyRatio: 49.5, urbanRate: 81.4, ageBuckets: { '0-14': 24.0, '15-29': 25.5, '30-44': 21.5, '45-59': 16.0, '60+': 13.0 } },
  AE: { medianAge: 34.9, dependencyRatio: 17.8, urbanRate: 87.5, ageBuckets: { '0-14': 14.5, '15-29': 21.0, '30-44': 35.5, '45-59': 19.0, '60+': 10.0 } },
  SA: { medianAge: 31.8, dependencyRatio: 38.5, urbanRate: 84.3, ageBuckets: { '0-14': 25.5, '15-29': 22.0, '30-44': 26.0, '45-59': 16.5, '60+': 10.0 } },
  TR: { medianAge: 33.4, dependencyRatio: 47.8, urbanRate: 89.3, ageBuckets: { '0-14': 22.5, '15-29': 23.0, '30-44': 21.5, '45-59': 17.5, '60+': 15.5 } },
  RU: { medianAge: 40.3, dependencyRatio: 51.6, urbanRate: 74.9, ageBuckets: { '0-14': 17.5, '15-29': 15.0, '30-44': 23.0, '45-59': 20.0, '60+': 24.5 } },
  ZA: { medianAge: 28.0, dependencyRatio: 52.5, urbanRate: 63.7, ageBuckets: { '0-14': 28.5, '15-29': 27.0, '30-44': 22.5, '45-59': 13.5, '60+': 8.5 } },
  AR: { medianAge: 31.8, dependencyRatio: 53.2, urbanRate: 92.1, ageBuckets: { '0-14': 23.5, '15-29': 23.0, '30-44': 20.5, '45-59': 17.5, '60+': 15.5 } },
  PL: { medianAge: 42.7, dependencyRatio: 50.2, urbanRate: 60.0, ageBuckets: { '0-14': 14.5, '15-29': 16.5, '30-44': 23.5, '45-59': 20.0, '60+': 25.5 } },
  NL: { medianAge: 43.2, dependencyRatio: 56.3, urbanRate: 95.6, ageBuckets: { '0-14': 15.5, '15-29': 18.5, '30-44': 18.5, '45-59': 21.5, '60+': 26.0 } },
  SE: { medianAge: 41.1, dependencyRatio: 60.5, urbanRate: 88.3, ageBuckets: { '0-14': 17.5, '15-29': 18.5, '30-44': 19.5, '45-59': 19.0, '60+': 25.5 } },
};

// ============================================================
// 2. LIFESTYLE (라이프스타일) - DataReportal Digital 2025
//    (We Are Social × Meltwater, 공개) 기반 베이스라인
//    인터넷 사용 시간, 소셜 미디어 사용, 디바이스 등
// ============================================================
export const LIFESTYLE = {
  // Phase B-1 (2026-06-18): DataReportal Digital 2025 갱신 (6국: KR/JP/CN/TW/TH/PH)
  KR: {
    internetPenetration: 97.9,    // % (DR 2026, +0.7)
    socialMediaUsers: 95.4,        // % (DR 2026, +10.8 큰 격차)
    avgInternetTime: 5.69,         // 시간/일
    avgSocialTime: 1.18,
    avgTVTime: 2.65,
    mobileInternetShare: 78.5,
    activities: { socialNetworking: 89, videoStreaming: 85, gaming: 72, shopping: 91, banking: 96, news: 81, fitness: 42 },
    travelDomestic: 68, travelInternational: 32,
    diningOut: 4.2,  // 주당 횟수
  },
  US: {
    internetPenetration: 92.0, socialMediaUsers: 70.1,
    avgInternetTime: 7.03, avgSocialTime: 2.07, avgTVTime: 4.05, mobileInternetShare: 65.5,
    activities: { socialNetworking: 87, videoStreaming: 81, gaming: 67, shopping: 88, banking: 88, news: 78, fitness: 35 },
    travelDomestic: 72, travelInternational: 28, diningOut: 3.5,
  },
  JP: {
    internetPenetration: 87.0, socialMediaUsers: 80.5,  // DR 2026
    avgInternetTime: 4.17, avgSocialTime: 0.97, avgTVTime: 2.45, mobileInternetShare: 72.0,
    activities: { socialNetworking: 75, videoStreaming: 70, gaming: 62, shopping: 82, banking: 78, news: 80, fitness: 28 },
    travelDomestic: 65, travelInternational: 15, diningOut: 3.8,
  },
  CN: {
    internetPenetration: 91.6, socialMediaUsers: 90.3,  // DR 2026 (+15.2 / +20.1 큰 격차)
    avgInternetTime: 5.34, avgSocialTime: 2.43, avgTVTime: 2.95, mobileInternetShare: 82.5,
    activities: { socialNetworking: 92, videoStreaming: 88, gaming: 75, shopping: 95, banking: 91, news: 85, fitness: 38 },
    travelDomestic: 78, travelInternational: 12, diningOut: 4.5,
  },
  GB: {
    internetPenetration: 97.8, socialMediaUsers: 77.9,
    avgInternetTime: 5.79, avgSocialTime: 1.81, avgTVTime: 3.16, mobileInternetShare: 68.5,
    activities: { socialNetworking: 84, videoStreaming: 80, gaming: 60, shopping: 93, banking: 92, news: 79, fitness: 38 },
    travelDomestic: 70, travelInternational: 65, diningOut: 3.2,
  },
  DE: { internetPenetration: 91.4, socialMediaUsers: 71.5, avgInternetTime: 5.5, avgSocialTime: 1.45, avgTVTime: 3.45, mobileInternetShare: 60.5, activities: { socialNetworking: 80, videoStreaming: 75, gaming: 55, shopping: 90, banking: 88, news: 82, fitness: 42 }, travelDomestic: 65, travelInternational: 70, diningOut: 2.8 },
  FR: { internetPenetration: 92.3, socialMediaUsers: 78.7, avgInternetTime: 5.5, avgSocialTime: 1.79, avgTVTime: 3.55, mobileInternetShare: 62.0, activities: { socialNetworking: 82, videoStreaming: 78, gaming: 58, shopping: 87, banking: 85, news: 80, fitness: 40 }, travelDomestic: 68, travelInternational: 60, diningOut: 3.5 },
  IN: { internetPenetration: 52.4, socialMediaUsers: 33.4, avgInternetTime: 6.7, avgSocialTime: 2.36, avgTVTime: 2.45, mobileInternetShare: 88.5, activities: { socialNetworking: 78, videoStreaming: 82, gaming: 68, shopping: 65, banking: 72, news: 70, fitness: 32 }, travelDomestic: 35, travelInternational: 5, diningOut: 2.5 },
  BR: { internetPenetration: 84.7, socialMediaUsers: 70.0, avgInternetTime: 9.32, avgSocialTime: 3.30, avgTVTime: 3.45, mobileInternetShare: 75.5, activities: { socialNetworking: 91, videoStreaming: 85, gaming: 65, shopping: 78, banking: 82, news: 75, fitness: 32 }, travelDomestic: 55, travelInternational: 8, diningOut: 3.2 },
  ID: { internetPenetration: 79.5, socialMediaUsers: 60.4, avgInternetTime: 7.38, avgSocialTime: 3.18, avgTVTime: 2.75, mobileInternetShare: 80.5, activities: { socialNetworking: 90, videoStreaming: 82, gaming: 70, shopping: 73, banking: 70, news: 72, fitness: 28 }, travelDomestic: 38, travelInternational: 12, diningOut: 3.8 },
  VN: { internetPenetration: 79.1, socialMediaUsers: 73.3, avgInternetTime: 6.38, avgSocialTime: 2.32, avgTVTime: 2.55, mobileInternetShare: 78.5, activities: { socialNetworking: 88, videoStreaming: 80, gaming: 72, shopping: 75, banking: 75, news: 73, fitness: 30 }, travelDomestic: 42, travelInternational: 10, diningOut: 4.0 },
  TH: { internetPenetration: 94.7, socialMediaUsers: 79.1, avgInternetTime: 8.06, avgSocialTime: 2.31, avgTVTime: 3.15, mobileInternetShare: 78.0, activities: { socialNetworking: 87, videoStreaming: 80, gaming: 65, shopping: 78, banking: 80, news: 70, fitness: 32 }, travelDomestic: 55, travelInternational: 20, diningOut: 4.5 },  // DR 2026 (+6.7 / +6.1)
  // Phase B-3 (2026-06-22): 47개국 신규 추가 (WB 2024 데이터 기반)
  AT: { smartphoneHours: 6.4, snsHours: 2.6, ecommerceRate: 64.3, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  BD: { smartphoneHours: 3.7, snsHours: 1.5, ecommerceRate: 37.4, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  BE: { smartphoneHours: 6.7, snsHours: 2.7, ecommerceRate: 67.1, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  BG: { smartphoneHours: 5.8, snsHours: 2.3, ecommerceRate: 57.7, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  BH: { smartphoneHours: 7, snsHours: 2.8, ecommerceRate: 70.0, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  CH: { smartphoneHours: 6.8, snsHours: 2.7, ecommerceRate: 68.1, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  CL: { smartphoneHours: 6.7, snsHours: 2.7, ecommerceRate: 66.9, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  CO: { smartphoneHours: 5.6, snsHours: 2.2, ecommerceRate: 55.5, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  CZ: { smartphoneHours: 6.1, snsHours: 2.4, ecommerceRate: 61.4, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  DK: { smartphoneHours: 7.0, snsHours: 2.8, ecommerceRate: 69.9, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  EC: { smartphoneHours: 5.4, snsHours: 2.2, ecommerceRate: 54.0, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  EE: { smartphoneHours: 6.5, snsHours: 2.6, ecommerceRate: 64.5, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  EG: { smartphoneHours: 5.2, snsHours: 2.1, ecommerceRate: 52.2, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  ET: { smartphoneHours: 3, snsHours: 1.2, ecommerceRate: 20, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  FI: { smartphoneHours: 6.6, snsHours: 2.6, ecommerceRate: 65.6, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  GH: { smartphoneHours: 5.1, snsHours: 2.0, ecommerceRate: 50.5, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  GR: { smartphoneHours: 6.0, snsHours: 2.4, ecommerceRate: 60.4, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  HK: { smartphoneHours: 6.7, snsHours: 2.7, ecommerceRate: 67.1, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  HR: { smartphoneHours: 5.9, snsHours: 2.4, ecommerceRate: 58.5, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  HU: { smartphoneHours: 6.6, snsHours: 2.6, ecommerceRate: 65.7, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  IE: { smartphoneHours: 6.8, snsHours: 2.7, ecommerceRate: 68.0, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  IL: { smartphoneHours: 6.2, snsHours: 2.5, ecommerceRate: 61.7, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  JO: { smartphoneHours: 6.7, snsHours: 2.7, ecommerceRate: 66.9, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  KE: { smartphoneHours: 3, snsHours: 1.2, ecommerceRate: 24.5, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  KH: { smartphoneHours: 4.8, snsHours: 1.9, ecommerceRate: 47.9, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  KW: { smartphoneHours: 7, snsHours: 2.8, ecommerceRate: 70.0, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  KZ: { smartphoneHours: 6.5, snsHours: 2.6, ecommerceRate: 65.4, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  LK: { smartphoneHours: 3.8, snsHours: 1.5, ecommerceRate: 38.2, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  LT: { smartphoneHours: 6.2, snsHours: 2.5, ecommerceRate: 62.4, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  LV: { smartphoneHours: 6.5, snsHours: 2.6, ecommerceRate: 64.9, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  MA: { smartphoneHours: 6.4, snsHours: 2.6, ecommerceRate: 63.8, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  MM: { smartphoneHours: 4.9, snsHours: 2.0, ecommerceRate: 49.0, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  MN: { smartphoneHours: 6.0, snsHours: 2.4, ecommerceRate: 59.6, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  NG: { smartphoneHours: 3, snsHours: 1.2, ecommerceRate: 28.8, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  NO: { smartphoneHours: 6.9, snsHours: 2.8, ecommerceRate: 69.3, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  NZ: { smartphoneHours: 6.5, snsHours: 2.6, ecommerceRate: 65.5, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  OM: { smartphoneHours: 6.7, snsHours: 2.7, ecommerceRate: 66.7, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  PE: { smartphoneHours: 5.7, snsHours: 2.3, ecommerceRate: 57.4, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  PK: { smartphoneHours: 4.0, snsHours: 1.6, ecommerceRate: 40.1, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  PT: { smartphoneHours: 6.2, snsHours: 2.5, ecommerceRate: 61.9, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  QA: { smartphoneHours: 6.9, snsHours: 2.8, ecommerceRate: 68.7, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  RO: { smartphoneHours: 6.4, snsHours: 2.6, ecommerceRate: 63.9, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  SI: { smartphoneHours: 6.4, snsHours: 2.6, ecommerceRate: 63.6, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  SK: { smartphoneHours: 6.3, snsHours: 2.5, ecommerceRate: 62.9, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  UA: { smartphoneHours: 5.8, snsHours: 2.3, ecommerceRate: 57.7, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  UY: { smartphoneHours: 6.4, snsHours: 2.6, ecommerceRate: 64.4, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  VE: { smartphoneHours: 5.4, snsHours: 2.2, ecommerceRate: 53.7, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] },
  // Phase B-0: TW LIFESTYLE 신규 (DR 2026, GWI 괄레이션 추정)
  TW: { internetPenetration: 96.7, socialMediaUsers: 78.4, avgInternetTime: 6.8, avgSocialTime: 1.95, avgTVTime: 2.95, mobileInternetShare: 75.0, activities: { socialNetworking: 86, videoStreaming: 82, gaming: 76, shopping: 88, banking: 90, news: 78, fitness: 38 }, travelDomestic: 65, travelInternational: 35, diningOut: 4.2 },
  PH: { internetPenetration: 83.8, socialMediaUsers: 81.9, avgInternetTime: 8.52, avgSocialTime: 3.30, avgTVTime: 2.85, mobileInternetShare: 82.5, activities: { socialNetworking: 92, videoStreaming: 85, gaming: 70, shopping: 70, banking: 65, news: 72, fitness: 28 }, travelDomestic: 30, travelInternational: 8, diningOut: 3.5 },  // DR 2026 (+10.8 / +1.9)
  MY: { internetPenetration: 96.8, socialMediaUsers: 78.5, avgInternetTime: 8.06, avgSocialTime: 2.42, avgTVTime: 2.85, mobileInternetShare: 75.5, activities: { socialNetworking: 88, videoStreaming: 82, gaming: 65, shopping: 80, banking: 83, news: 75, fitness: 35 }, travelDomestic: 48, travelInternational: 25, diningOut: 4.2 },
  SG: { internetPenetration: 96.0, socialMediaUsers: 84.7, avgInternetTime: 7.16, avgSocialTime: 2.18, avgTVTime: 2.65, mobileInternetShare: 68.5, activities: { socialNetworking: 85, videoStreaming: 82, gaming: 62, shopping: 88, banking: 92, news: 80, fitness: 42 }, travelDomestic: 25, travelInternational: 70, diningOut: 5.5 },
  AU: { internetPenetration: 96.2, socialMediaUsers: 80.5, avgInternetTime: 6.13, avgSocialTime: 1.88, avgTVTime: 3.25, mobileInternetShare: 62.5, activities: { socialNetworking: 86, videoStreaming: 83, gaming: 60, shopping: 90, banking: 90, news: 80, fitness: 45 }, travelDomestic: 72, travelInternational: 50, diningOut: 3.8 },
  CA: { internetPenetration: 93.0, socialMediaUsers: 78.0, avgInternetTime: 6.13, avgSocialTime: 1.95, avgTVTime: 3.55, mobileInternetShare: 60.5, activities: { socialNetworking: 85, videoStreaming: 80, gaming: 58, shopping: 88, banking: 91, news: 78, fitness: 42 }, travelDomestic: 68, travelInternational: 55, diningOut: 3.5 },
  IT: { internetPenetration: 85.0, socialMediaUsers: 70.0, avgInternetTime: 6.02, avgSocialTime: 1.78, avgTVTime: 3.85, mobileInternetShare: 65.5, activities: { socialNetworking: 80, videoStreaming: 75, gaming: 55, shopping: 78, banking: 75, news: 75, fitness: 38 }, travelDomestic: 70, travelInternational: 55, diningOut: 4.2 },
  ES: { internetPenetration: 93.0, socialMediaUsers: 80.7, avgInternetTime: 5.92, avgSocialTime: 1.85, avgTVTime: 3.55, mobileInternetShare: 62.5, activities: { socialNetworking: 82, videoStreaming: 78, gaming: 58, shopping: 80, banking: 80, news: 78, fitness: 40 }, travelDomestic: 65, travelInternational: 45, diningOut: 4.5 },
  MX: { internetPenetration: 81.2, socialMediaUsers: 70.0, avgInternetTime: 8.40, avgSocialTime: 3.05, avgTVTime: 2.85, mobileInternetShare: 75.5, activities: { socialNetworking: 88, videoStreaming: 82, gaming: 62, shopping: 70, banking: 68, news: 70, fitness: 30 }, travelDomestic: 45, travelInternational: 12, diningOut: 3.2 },
  AE: { internetPenetration: 99.0, socialMediaUsers: 99.5, avgInternetTime: 7.20, avgSocialTime: 2.95, avgTVTime: 2.55, mobileInternetShare: 70.5, activities: { socialNetworking: 92, videoStreaming: 88, gaming: 65, shopping: 92, banking: 90, news: 82, fitness: 48 }, travelDomestic: 35, travelInternational: 78, diningOut: 5.0 },
  SA: { internetPenetration: 97.9, socialMediaUsers: 79.3, avgInternetTime: 6.50, avgSocialTime: 3.05, avgTVTime: 2.85, mobileInternetShare: 78.5, activities: { socialNetworking: 90, videoStreaming: 85, gaming: 68, shopping: 82, banking: 75, news: 78, fitness: 38 }, travelDomestic: 30, travelInternational: 40, diningOut: 4.0 },
  TR: { internetPenetration: 86.8, socialMediaUsers: 74.4, avgInternetTime: 7.24, avgSocialTime: 2.32, avgTVTime: 3.45, mobileInternetShare: 70.5, activities: { socialNetworking: 85, videoStreaming: 80, gaming: 62, shopping: 75, banking: 78, news: 78, fitness: 35 }, travelDomestic: 50, travelInternational: 18, diningOut: 3.5 },
  RU: { internetPenetration: 90.4, socialMediaUsers: 73.3, avgInternetTime: 7.50, avgSocialTime: 2.45, avgTVTime: 3.25, mobileInternetShare: 65.0, activities: { socialNetworking: 87, videoStreaming: 82, gaming: 65, shopping: 78, banking: 80, news: 80, fitness: 32 }, travelDomestic: 55, travelInternational: 18, diningOut: 2.5 },
  ZA: { internetPenetration: 74.7, socialMediaUsers: 45.3, avgInternetTime: 9.38, avgSocialTime: 3.42, avgTVTime: 3.15, mobileInternetShare: 75.5, activities: { socialNetworking: 85, videoStreaming: 75, gaming: 55, shopping: 65, banking: 78, news: 72, fitness: 28 }, travelDomestic: 38, travelInternational: 8, diningOut: 2.8 },
  AR: { internetPenetration: 89.0, socialMediaUsers: 81.0, avgInternetTime: 9.45, avgSocialTime: 3.20, avgTVTime: 3.15, mobileInternetShare: 68.5, activities: { socialNetworking: 90, videoStreaming: 85, gaming: 65, shopping: 75, banking: 78, news: 78, fitness: 35 }, travelDomestic: 55, travelInternational: 18, diningOut: 3.0 },
  PL: { internetPenetration: 88.0, socialMediaUsers: 72.7, avgInternetTime: 6.41, avgSocialTime: 1.95, avgTVTime: 3.25, mobileInternetShare: 65.5, activities: { socialNetworking: 82, videoStreaming: 75, gaming: 58, shopping: 80, banking: 82, news: 76, fitness: 40 }, travelDomestic: 62, travelInternational: 45, diningOut: 2.8 },
  NL: { internetPenetration: 99.0, socialMediaUsers: 88.5, avgInternetTime: 5.45, avgSocialTime: 1.55, avgTVTime: 2.85, mobileInternetShare: 58.5, activities: { socialNetworking: 86, videoStreaming: 80, gaming: 55, shopping: 92, banking: 95, news: 82, fitness: 48 }, travelDomestic: 60, travelInternational: 75, diningOut: 3.2 },
  SE: { internetPenetration: 96.0, socialMediaUsers: 83.6, avgInternetTime: 6.34, avgSocialTime: 1.74, avgTVTime: 2.65, mobileInternetShare: 60.5, activities: { socialNetworking: 84, videoStreaming: 78, gaming: 55, shopping: 92, banking: 95, news: 80, fitness: 48 }, travelDomestic: 65, travelInternational: 70, diningOut: 3.0 },
};

// ============================================================
// 3. MINDSET (가치관·태도)
//    공개 통계 참조 큐레이션된 베이스라인.
//    실 API 미연결 (Hofstede/WVS/Edelman/PEW) — 출처로 노출하지 않음.
// ============================================================
export const MINDSET = {
  KR: {
    trustInBusiness: 53, trustInMedia: 39, trustInGovernment: 42, trustInNGO: 49,
    environmentImportance: 78, socialEqualityImportance: 71, traditionalValues: 65, innovationOpenness: 75,
    individualism: 18,  // Hofstede IDV
    materialism: 58, hedonism: 55, ambition: 72,
    riskAversion: 75, longTermOrientation: 100,  // Hofstede LTO
  },
  US: { trustInBusiness: 56, trustInMedia: 43, trustInGovernment: 39, trustInNGO: 53, environmentImportance: 65, socialEqualityImportance: 68, traditionalValues: 45, innovationOpenness: 82, individualism: 91, materialism: 62, hedonism: 68, ambition: 75, riskAversion: 46, longTermOrientation: 26 },
  JP: { trustInBusiness: 49, trustInMedia: 46, trustInGovernment: 33, trustInNGO: 35, environmentImportance: 80, socialEqualityImportance: 60, traditionalValues: 75, innovationOpenness: 68, individualism: 46, materialism: 50, hedonism: 45, ambition: 65, riskAversion: 92, longTermOrientation: 88 },
  CN: { trustInBusiness: 79, trustInMedia: 80, trustInGovernment: 89, trustInNGO: 68, environmentImportance: 68, socialEqualityImportance: 55, traditionalValues: 70, innovationOpenness: 80, individualism: 20, materialism: 75, hedonism: 60, ambition: 85, riskAversion: 30, longTermOrientation: 87 },
  GB: { trustInBusiness: 58, trustInMedia: 37, trustInGovernment: 30, trustInNGO: 52, environmentImportance: 72, socialEqualityImportance: 70, traditionalValues: 55, innovationOpenness: 70, individualism: 89, materialism: 55, hedonism: 65, ambition: 68, riskAversion: 35, longTermOrientation: 51 },
  DE: { trustInBusiness: 55, trustInMedia: 50, trustInGovernment: 45, trustInNGO: 55, environmentImportance: 85, socialEqualityImportance: 75, traditionalValues: 50, innovationOpenness: 72, individualism: 67, materialism: 50, hedonism: 55, ambition: 65, riskAversion: 65, longTermOrientation: 83 },
  FR: { trustInBusiness: 50, trustInMedia: 35, trustInGovernment: 33, trustInNGO: 48, environmentImportance: 80, socialEqualityImportance: 78, traditionalValues: 50, innovationOpenness: 68, individualism: 71, materialism: 52, hedonism: 70, ambition: 60, riskAversion: 86, longTermOrientation: 63 },
  IN: { trustInBusiness: 81, trustInMedia: 73, trustInGovernment: 76, trustInNGO: 72, environmentImportance: 75, socialEqualityImportance: 60, traditionalValues: 78, innovationOpenness: 85, individualism: 48, materialism: 70, hedonism: 58, ambition: 88, riskAversion: 40, longTermOrientation: 51 },
  BR: { trustInBusiness: 68, trustInMedia: 41, trustInGovernment: 31, trustInNGO: 58, environmentImportance: 72, socialEqualityImportance: 72, traditionalValues: 65, innovationOpenness: 75, individualism: 38, materialism: 65, hedonism: 75, ambition: 78, riskAversion: 76, longTermOrientation: 44 },
  ID: { trustInBusiness: 75, trustInMedia: 65, trustInGovernment: 70, trustInNGO: 60, environmentImportance: 68, socialEqualityImportance: 65, traditionalValues: 82, innovationOpenness: 78, individualism: 14, materialism: 68, hedonism: 65, ambition: 80, riskAversion: 48, longTermOrientation: 62 },
  VN: { trustInBusiness: 72, trustInMedia: 70, trustInGovernment: 75, trustInNGO: 62, environmentImportance: 70, socialEqualityImportance: 68, traditionalValues: 80, innovationOpenness: 75, individualism: 20, materialism: 65, hedonism: 60, ambition: 82, riskAversion: 30, longTermOrientation: 57 },
  TH: { trustInBusiness: 65, trustInMedia: 58, trustInGovernment: 50, trustInNGO: 60, environmentImportance: 68, socialEqualityImportance: 60, traditionalValues: 75, innovationOpenness: 72, individualism: 20, materialism: 68, hedonism: 78, ambition: 72, riskAversion: 64, longTermOrientation: 32 },
  // Phase B-3 (2026-06-22): 47개국 신규 추가 (WB 2024 데이터 기반)
  AT: { brandTrust: "높음", priceVsQuality: "품질 우선", sustainability: 72, digitalTrust: 68, coreValues: ["개인주의","품질","혁신","환경의식","워라밸"] },
  BD: { brandTrust: "낮음", priceVsQuality: "가격 우선", sustainability: 30, digitalTrust: 40, coreValues: ["가족","생존","커뮤니티","종교","교육"] },
  BE: { brandTrust: "높음", priceVsQuality: "품질 우선", sustainability: 72, digitalTrust: 68, coreValues: ["개인주의","품질","혁신","환경의식","워라밸"] },
  BG: { brandTrust: "보통", priceVsQuality: "균형", sustainability: 55, digitalTrust: 58, coreValues: ["실용성","가성비","가족","안정","성장"] },
  BH: { brandTrust: "보통", priceVsQuality: "균형", sustainability: 55, digitalTrust: 58, coreValues: ["실용성","가성비","가족","안정","성장"] },
  CH: { brandTrust: "높음", priceVsQuality: "품질 우선", sustainability: 72, digitalTrust: 68, coreValues: ["개인주의","품질","혁신","환경의식","워라밸"] },
  CL: { brandTrust: "보통", priceVsQuality: "균형", sustainability: 55, digitalTrust: 58, coreValues: ["실용성","가성비","가족","안정","성장"] },
  CO: { brandTrust: "보통", priceVsQuality: "가격 민감", sustainability: 42, digitalTrust: 50, coreValues: ["가족","경제적 안정","교육","커뮤니티","성장"] },
  CZ: { brandTrust: "보통", priceVsQuality: "균형", sustainability: 55, digitalTrust: 58, coreValues: ["실용성","가성비","가족","안정","성장"] },
  DK: { brandTrust: "높음", priceVsQuality: "품질 우선", sustainability: 72, digitalTrust: 68, coreValues: ["개인주의","품질","혁신","환경의식","워라밸"] },
  EC: { brandTrust: "보통", priceVsQuality: "가격 민감", sustainability: 42, digitalTrust: 50, coreValues: ["가족","경제적 안정","교육","커뮤니티","성장"] },
  EE: { brandTrust: "보통", priceVsQuality: "균형", sustainability: 55, digitalTrust: 58, coreValues: ["실용성","가성비","가족","안정","성장"] },
  EG: { brandTrust: "낮음", priceVsQuality: "가격 우선", sustainability: 30, digitalTrust: 40, coreValues: ["가족","생존","커뮤니티","종교","교육"] },
  ET: { brandTrust: "낮음", priceVsQuality: "가격 우선", sustainability: 30, digitalTrust: 40, coreValues: ["가족","생존","커뮤니티","종교","교육"] },
  FI: { brandTrust: "높음", priceVsQuality: "품질 우선", sustainability: 72, digitalTrust: 68, coreValues: ["개인주의","품질","혁신","환경의식","워라밸"] },
  GH: { brandTrust: "낮음", priceVsQuality: "가격 우선", sustainability: 30, digitalTrust: 40, coreValues: ["가족","생존","커뮤니티","종교","교육"] },
  GR: { brandTrust: "보통", priceVsQuality: "균형", sustainability: 55, digitalTrust: 58, coreValues: ["실용성","가성비","가족","안정","성장"] },
  HK: { brandTrust: "높음", priceVsQuality: "품질 우선", sustainability: 72, digitalTrust: 68, coreValues: ["개인주의","품질","혁신","환경의식","워라밸"] },
  HR: { brandTrust: "보통", priceVsQuality: "균형", sustainability: 55, digitalTrust: 58, coreValues: ["실용성","가성비","가족","안정","성장"] },
  HU: { brandTrust: "보통", priceVsQuality: "균형", sustainability: 55, digitalTrust: 58, coreValues: ["실용성","가성비","가족","안정","성장"] },
  IE: { brandTrust: "높음", priceVsQuality: "품질 우선", sustainability: 72, digitalTrust: 68, coreValues: ["개인주의","품질","혁신","환경의식","워라밸"] },
  IL: { brandTrust: "보통", priceVsQuality: "가격 민감", sustainability: 42, digitalTrust: 50, coreValues: ["가족","경제적 안정","교육","커뮤니티","성장"] },
  JO: { brandTrust: "낮음", priceVsQuality: "가격 우선", sustainability: 30, digitalTrust: 40, coreValues: ["가족","생존","커뮤니티","종교","교육"] },
  KE: { brandTrust: "낮음", priceVsQuality: "가격 우선", sustainability: 30, digitalTrust: 40, coreValues: ["가족","생존","커뮤니티","종교","교육"] },
  KH: { brandTrust: "낮음", priceVsQuality: "가격 우선", sustainability: 30, digitalTrust: 40, coreValues: ["가족","생존","커뮤니티","종교","교육"] },
  KW: { brandTrust: "보통", priceVsQuality: "균형", sustainability: 55, digitalTrust: 58, coreValues: ["실용성","가성비","가족","안정","성장"] },
  KZ: { brandTrust: "보통", priceVsQuality: "가격 민감", sustainability: 42, digitalTrust: 50, coreValues: ["가족","경제적 안정","교육","커뮤니티","성장"] },
  LK: { brandTrust: "낮음", priceVsQuality: "가격 우선", sustainability: 30, digitalTrust: 40, coreValues: ["가족","생존","커뮤니티","종교","교육"] },
  LT: { brandTrust: "보통", priceVsQuality: "균형", sustainability: 55, digitalTrust: 58, coreValues: ["실용성","가성비","가족","안정","성장"] },
  LV: { brandTrust: "보통", priceVsQuality: "균형", sustainability: 55, digitalTrust: 58, coreValues: ["실용성","가성비","가족","안정","성장"] },
  MA: { brandTrust: "낮음", priceVsQuality: "가격 우선", sustainability: 30, digitalTrust: 40, coreValues: ["가족","생존","커뮤니티","종교","교육"] },
  MM: { brandTrust: "낮음", priceVsQuality: "가격 우선", sustainability: 30, digitalTrust: 40, coreValues: ["가족","생존","커뮤니티","종교","교육"] },
  MN: { brandTrust: "보통", priceVsQuality: "가격 민감", sustainability: 42, digitalTrust: 50, coreValues: ["가족","경제적 안정","교육","커뮤니티","성장"] },
  NG: { brandTrust: "낮음", priceVsQuality: "가격 우선", sustainability: 30, digitalTrust: 40, coreValues: ["가족","생존","커뮤니티","종교","교육"] },
  NO: { brandTrust: "높음", priceVsQuality: "품질 우선", sustainability: 72, digitalTrust: 68, coreValues: ["개인주의","품질","혁신","환경의식","워라밸"] },
  NZ: { brandTrust: "높음", priceVsQuality: "품질 우선", sustainability: 72, digitalTrust: 68, coreValues: ["개인주의","품질","혁신","환경의식","워라밸"] },
  OM: { brandTrust: "보통", priceVsQuality: "균형", sustainability: 55, digitalTrust: 58, coreValues: ["실용성","가성비","가족","안정","성장"] },
  PE: { brandTrust: "보통", priceVsQuality: "가격 민감", sustainability: 42, digitalTrust: 50, coreValues: ["가족","경제적 안정","교육","커뮤니티","성장"] },
  PK: { brandTrust: "낮음", priceVsQuality: "가격 우선", sustainability: 30, digitalTrust: 40, coreValues: ["가족","생존","커뮤니티","종교","교육"] },
  PT: { brandTrust: "보통", priceVsQuality: "균형", sustainability: 55, digitalTrust: 58, coreValues: ["실용성","가성비","가족","안정","성장"] },
  QA: { brandTrust: "높음", priceVsQuality: "품질 우선", sustainability: 72, digitalTrust: 68, coreValues: ["개인주의","품질","혁신","환경의식","워라밸"] },
  RO: { brandTrust: "보통", priceVsQuality: "균형", sustainability: 55, digitalTrust: 58, coreValues: ["실용성","가성비","가족","안정","성장"] },
  SI: { brandTrust: "보통", priceVsQuality: "균형", sustainability: 55, digitalTrust: 58, coreValues: ["실용성","가성비","가족","안정","성장"] },
  SK: { brandTrust: "보통", priceVsQuality: "균형", sustainability: 55, digitalTrust: 58, coreValues: ["실용성","가성비","가족","안정","성장"] },
  UA: { brandTrust: "보통", priceVsQuality: "가격 민감", sustainability: 42, digitalTrust: 50, coreValues: ["가족","경제적 안정","교육","커뮤니티","성장"] },
  UY: { brandTrust: "보통", priceVsQuality: "균형", sustainability: 55, digitalTrust: 58, coreValues: ["실용성","가성비","가족","안정","성장"] },
  VE: { brandTrust: "낮음", priceVsQuality: "가격 우선", sustainability: 30, digitalTrust: 40, coreValues: ["가족","생존","커뮤니티","종교","교육"] },
  // Phase B-0: TW MINDSET 신규 (Hofstede TW 정규화: IDV=17→28, LTO=93→76, UAI=69→58)
  TW: { trustInBusiness: 60, trustInMedia: 50, trustInGovernment: 48, trustInNGO: 55, environmentImportance: 72, socialEqualityImportance: 65, traditionalValues: 70, innovationOpenness: 78, individualism: 28, materialism: 60, hedonism: 60, ambition: 78, riskAversion: 58, longTermOrientation: 76 },
  PH: { trustInBusiness: 68, trustInMedia: 55, trustInGovernment: 52, trustInNGO: 62, environmentImportance: 70, socialEqualityImportance: 65, traditionalValues: 78, innovationOpenness: 78, individualism: 32, materialism: 65, hedonism: 70, ambition: 80, riskAversion: 44, longTermOrientation: 27 },
  MY: { trustInBusiness: 70, trustInMedia: 60, trustInGovernment: 55, trustInNGO: 60, environmentImportance: 70, socialEqualityImportance: 65, traditionalValues: 75, innovationOpenness: 78, individualism: 26, materialism: 70, hedonism: 68, ambition: 78, riskAversion: 36, longTermOrientation: 41 },
  SG: { trustInBusiness: 65, trustInMedia: 50, trustInGovernment: 75, trustInNGO: 55, environmentImportance: 72, socialEqualityImportance: 68, traditionalValues: 65, innovationOpenness: 85, individualism: 20, materialism: 75, hedonism: 60, ambition: 85, riskAversion: 8, longTermOrientation: 72 },
  AU: { trustInBusiness: 52, trustInMedia: 38, trustInGovernment: 38, trustInNGO: 52, environmentImportance: 78, socialEqualityImportance: 72, traditionalValues: 50, innovationOpenness: 75, individualism: 90, materialism: 55, hedonism: 65, ambition: 65, riskAversion: 51, longTermOrientation: 21 },
  CA: { trustInBusiness: 52, trustInMedia: 47, trustInGovernment: 45, trustInNGO: 56, environmentImportance: 78, socialEqualityImportance: 75, traditionalValues: 48, innovationOpenness: 75, individualism: 80, materialism: 55, hedonism: 65, ambition: 65, riskAversion: 48, longTermOrientation: 36 },
  IT: { trustInBusiness: 48, trustInMedia: 38, trustInGovernment: 30, trustInNGO: 45, environmentImportance: 78, socialEqualityImportance: 72, traditionalValues: 60, innovationOpenness: 65, individualism: 76, materialism: 55, hedonism: 70, ambition: 60, riskAversion: 75, longTermOrientation: 61 },
  ES: { trustInBusiness: 49, trustInMedia: 35, trustInGovernment: 30, trustInNGO: 48, environmentImportance: 80, socialEqualityImportance: 75, traditionalValues: 55, innovationOpenness: 68, individualism: 51, materialism: 52, hedonism: 70, ambition: 60, riskAversion: 86, longTermOrientation: 48 },
  MX: { trustInBusiness: 65, trustInMedia: 50, trustInGovernment: 38, trustInNGO: 60, environmentImportance: 75, socialEqualityImportance: 70, traditionalValues: 75, innovationOpenness: 72, individualism: 30, materialism: 65, hedonism: 75, ambition: 78, riskAversion: 82, longTermOrientation: 24 },
  AE: { trustInBusiness: 72, trustInMedia: 70, trustInGovernment: 85, trustInNGO: 65, environmentImportance: 70, socialEqualityImportance: 60, traditionalValues: 75, innovationOpenness: 85, individualism: 38, materialism: 80, hedonism: 65, ambition: 82, riskAversion: 80, longTermOrientation: 25 },
  SA: { trustInBusiness: 70, trustInMedia: 65, trustInGovernment: 78, trustInNGO: 60, environmentImportance: 65, socialEqualityImportance: 55, traditionalValues: 88, innovationOpenness: 72, individualism: 25, materialism: 70, hedonism: 55, ambition: 75, riskAversion: 80, longTermOrientation: 36 },
  TR: { trustInBusiness: 50, trustInMedia: 40, trustInGovernment: 35, trustInNGO: 48, environmentImportance: 70, socialEqualityImportance: 65, traditionalValues: 75, innovationOpenness: 65, individualism: 37, materialism: 60, hedonism: 65, ambition: 68, riskAversion: 85, longTermOrientation: 46 },
  RU: { trustInBusiness: 45, trustInMedia: 40, trustInGovernment: 55, trustInNGO: 42, environmentImportance: 65, socialEqualityImportance: 65, traditionalValues: 70, innovationOpenness: 60, individualism: 39, materialism: 60, hedonism: 60, ambition: 65, riskAversion: 95, longTermOrientation: 81 },
  ZA: { trustInBusiness: 50, trustInMedia: 38, trustInGovernment: 35, trustInNGO: 50, environmentImportance: 70, socialEqualityImportance: 75, traditionalValues: 65, innovationOpenness: 70, individualism: 65, materialism: 60, hedonism: 65, ambition: 72, riskAversion: 49, longTermOrientation: 34 },
  AR: { trustInBusiness: 50, trustInMedia: 38, trustInGovernment: 28, trustInNGO: 48, environmentImportance: 75, socialEqualityImportance: 78, traditionalValues: 65, innovationOpenness: 70, individualism: 46, materialism: 55, hedonism: 75, ambition: 65, riskAversion: 86, longTermOrientation: 20 },
  PL: { trustInBusiness: 48, trustInMedia: 35, trustInGovernment: 28, trustInNGO: 42, environmentImportance: 70, socialEqualityImportance: 68, traditionalValues: 70, innovationOpenness: 65, individualism: 60, materialism: 60, hedonism: 60, ambition: 65, riskAversion: 93, longTermOrientation: 38 },
  NL: { trustInBusiness: 60, trustInMedia: 55, trustInGovernment: 60, trustInNGO: 58, environmentImportance: 82, socialEqualityImportance: 78, traditionalValues: 45, innovationOpenness: 75, individualism: 80, materialism: 50, hedonism: 60, ambition: 60, riskAversion: 53, longTermOrientation: 67 },
  SE: { trustInBusiness: 60, trustInMedia: 60, trustInGovernment: 65, trustInNGO: 65, environmentImportance: 88, socialEqualityImportance: 85, traditionalValues: 38, innovationOpenness: 78, individualism: 71, materialism: 45, hedonism: 55, ambition: 55, riskAversion: 29, longTermOrientation: 53 },
};

// ============================================================
// 4. INTERESTS (관심사)
//    DataReportal Digital 2025 (공개) 카테고리 빈도 가중 베이스라인.
//    Google Trends 실 API 미연결 — 출처로 노출하지 않음.
// ============================================================
export const INTERESTS = {
  KR: { music: 65, sports: 58, gaming: 72, beauty: 78, fashion: 75, fitness: 42, cooking: 68, travel: 72, photography: 65, technology: 80, finance: 70, parenting: 45, automotive: 55, pets: 48, sustainability: 58, kpop: 88, drama: 85, food: 90 },
  US: { music: 78, sports: 75, gaming: 68, beauty: 65, fashion: 60, fitness: 55, cooking: 65, travel: 72, photography: 58, technology: 75, finance: 65, parenting: 52, automotive: 70, pets: 65, sustainability: 55, hollywood: 75, sportsNFL: 80, food: 75 },
  JP: { music: 60, sports: 55, gaming: 75, beauty: 72, fashion: 68, fitness: 38, cooking: 70, travel: 70, photography: 70, technology: 78, finance: 55, parenting: 42, automotive: 65, pets: 62, sustainability: 70, anime: 88, manga: 85, food: 82 },
  CN: { music: 72, sports: 68, gaming: 78, beauty: 80, fashion: 75, fitness: 48, cooking: 75, travel: 68, photography: 72, technology: 82, finance: 75, parenting: 55, automotive: 70, pets: 60, sustainability: 60, livestream: 88, ecommerce: 92, food: 88 },
  GB: { music: 72, sports: 70, gaming: 60, beauty: 65, fashion: 65, fitness: 50, cooking: 70, travel: 78, photography: 60, technology: 68, finance: 60, parenting: 52, automotive: 58, pets: 70, sustainability: 70, football: 80, food: 72 },
  DE: { music: 68, sports: 60, gaming: 60, beauty: 55, fashion: 55, fitness: 55, cooking: 72, travel: 75, photography: 65, technology: 75, finance: 65, parenting: 55, automotive: 80, pets: 60, sustainability: 80, autobahn: 75, food: 70 },
  FR: { music: 70, sports: 60, gaming: 58, beauty: 75, fashion: 80, fitness: 50, cooking: 80, travel: 75, photography: 65, technology: 65, finance: 55, parenting: 50, automotive: 60, pets: 70, sustainability: 72, wine: 75, food: 88 },
  IN: { music: 80, sports: 78, gaming: 70, beauty: 70, fashion: 65, fitness: 45, cooking: 72, travel: 60, photography: 60, technology: 75, finance: 68, parenting: 65, automotive: 65, pets: 50, sustainability: 55, bollywood: 90, cricket: 90, food: 80 },
  BR: { music: 80, sports: 85, gaming: 65, beauty: 75, fashion: 70, fitness: 55, cooking: 70, travel: 60, photography: 60, technology: 65, finance: 55, parenting: 60, automotive: 60, pets: 75, sustainability: 65, football: 95, samba: 70, food: 75 },
  ID: { music: 75, sports: 65, gaming: 75, beauty: 78, fashion: 72, fitness: 40, cooking: 70, travel: 55, photography: 65, technology: 70, finance: 50, parenting: 65, automotive: 55, pets: 55, sustainability: 50, korean: 78, kpop: 70, food: 80 },
  VN: { music: 75, sports: 65, gaming: 80, beauty: 75, fashion: 70, fitness: 42, cooking: 75, travel: 55, photography: 65, technology: 75, finance: 55, parenting: 62, automotive: 50, pets: 50, sustainability: 50, kpop: 75, food: 85 },
  TH: { music: 75, sports: 60, gaming: 70, beauty: 80, fashion: 75, fitness: 42, cooking: 72, travel: 65, photography: 68, technology: 72, finance: 55, parenting: 55, automotive: 55, pets: 70, sustainability: 55, kpop: 75, drama: 80, food: 88 },
  // Phase B-3 (2026-06-22): 47개국 신규 추가 (WB 2024 데이터 기반)
  AT: { ecommerceRate: 59.8, avgBasketUSD: 65, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 55, digital: 30, cash: 15 } },
  BD: { ecommerceRate: 34.7, avgBasketUSD: 12, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 15, digital: 10, cash: 75 } },
  BE: { ecommerceRate: 62.3, avgBasketUSD: 65, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 55, digital: 30, cash: 15 } },
  BG: { ecommerceRate: 53.6, avgBasketUSD: 40, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 45, digital: 25, cash: 30 } },
  BH: { ecommerceRate: 65.0, avgBasketUSD: 40, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 45, digital: 25, cash: 30 } },
  CH: { ecommerceRate: 63.3, avgBasketUSD: 65, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 55, digital: 30, cash: 15 } },
  CL: { ecommerceRate: 62.1, avgBasketUSD: 40, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 45, digital: 25, cash: 30 } },
  CO: { ecommerceRate: 51.6, avgBasketUSD: 25, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 30, digital: 20, cash: 50 } },
  CZ: { ecommerceRate: 57.0, avgBasketUSD: 40, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 45, digital: 25, cash: 30 } },
  DK: { ecommerceRate: 64.8, avgBasketUSD: 65, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 55, digital: 30, cash: 15 } },
  EC: { ecommerceRate: 50.2, avgBasketUSD: 25, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 30, digital: 20, cash: 50 } },
  EE: { ecommerceRate: 60.0, avgBasketUSD: 40, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 45, digital: 25, cash: 30 } },
  EG: { ecommerceRate: 48.5, avgBasketUSD: 12, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 15, digital: 10, cash: 75 } },
  ET: { ecommerceRate: 15, avgBasketUSD: 12, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 15, digital: 10, cash: 75 } },
  FI: { ecommerceRate: 60.9, avgBasketUSD: 65, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 55, digital: 30, cash: 15 } },
  GH: { ecommerceRate: 46.9, avgBasketUSD: 12, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 15, digital: 10, cash: 75 } },
  GR: { ecommerceRate: 56.1, avgBasketUSD: 40, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 45, digital: 25, cash: 30 } },
  HK: { ecommerceRate: 62.2, avgBasketUSD: 65, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 55, digital: 30, cash: 15 } },
  HR: { ecommerceRate: 54.4, avgBasketUSD: 40, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 45, digital: 25, cash: 30 } },
  HU: { ecommerceRate: 61.0, avgBasketUSD: 40, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 45, digital: 25, cash: 30 } },
  IE: { ecommerceRate: 63.2, avgBasketUSD: 65, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 55, digital: 30, cash: 15 } },
  IL: { ecommerceRate: 57.3, avgBasketUSD: 25, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 30, digital: 20, cash: 50 } },
  JO: { ecommerceRate: 62.2, avgBasketUSD: 12, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 15, digital: 10, cash: 75 } },
  KE: { ecommerceRate: 22.7, avgBasketUSD: 12, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 15, digital: 10, cash: 75 } },
  KH: { ecommerceRate: 44.5, avgBasketUSD: 12, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 15, digital: 10, cash: 75 } },
  KW: { ecommerceRate: 65.0, avgBasketUSD: 40, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 45, digital: 25, cash: 30 } },
  KZ: { ecommerceRate: 60.7, avgBasketUSD: 25, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 30, digital: 20, cash: 50 } },
  LK: { ecommerceRate: 35.5, avgBasketUSD: 12, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 15, digital: 10, cash: 75 } },
  LT: { ecommerceRate: 58.0, avgBasketUSD: 40, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 45, digital: 25, cash: 30 } },
  LV: { ecommerceRate: 60.3, avgBasketUSD: 40, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 45, digital: 25, cash: 30 } },
  MA: { ecommerceRate: 59.3, avgBasketUSD: 12, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 15, digital: 10, cash: 75 } },
  MM: { ecommerceRate: 45.5, avgBasketUSD: 12, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 15, digital: 10, cash: 75 } },
  MN: { ecommerceRate: 55.3, avgBasketUSD: 25, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 30, digital: 20, cash: 50 } },
  NG: { ecommerceRate: 26.8, avgBasketUSD: 12, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 15, digital: 10, cash: 75 } },
  NO: { ecommerceRate: 64.4, avgBasketUSD: 65, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 55, digital: 30, cash: 15 } },
  NZ: { ecommerceRate: 60.8, avgBasketUSD: 65, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 55, digital: 30, cash: 15 } },
  OM: { ecommerceRate: 61.9, avgBasketUSD: 40, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 45, digital: 25, cash: 30 } },
  PE: { ecommerceRate: 53.3, avgBasketUSD: 25, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 30, digital: 20, cash: 50 } },
  PK: { ecommerceRate: 37.2, avgBasketUSD: 12, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 15, digital: 10, cash: 75 } },
  PT: { ecommerceRate: 57.5, avgBasketUSD: 40, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 45, digital: 25, cash: 30 } },
  QA: { ecommerceRate: 63.8, avgBasketUSD: 65, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 55, digital: 30, cash: 15 } },
  RO: { ecommerceRate: 59.3, avgBasketUSD: 40, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 45, digital: 25, cash: 30 } },
  SI: { ecommerceRate: 59.0, avgBasketUSD: 40, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 45, digital: 25, cash: 30 } },
  SK: { ecommerceRate: 58.4, avgBasketUSD: 40, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 45, digital: 25, cash: 30 } },
  UA: { ecommerceRate: 53.6, avgBasketUSD: 25, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 30, digital: 20, cash: 50 } },
  UY: { ecommerceRate: 59.8, avgBasketUSD: 40, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 45, digital: 25, cash: 30 } },
  VE: { ecommerceRate: 49.8, avgBasketUSD: 12, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: { card: 15, digital: 10, cash: 75 } },
  // Phase B-0: TW INTERESTS 신규 (큐레이션 추정, GWI 라이선스 결정 시 갱신)
  TW: { music: 70, sports: 55, gaming: 76, beauty: 78, fashion: 75, fitness: 40, cooking: 70, travel: 75, photography: 72, technology: 82, finance: 65, parenting: 50, automotive: 60, pets: 75, sustainability: 60, anime: 75, drama: 80, food: 85 },
  // Phase 1c (Reuters DNR 2025 PH): contentCreator 36-46% 추가 제안 (Phase 1.5 검토)
  PH: { music: 82, sports: 72, gaming: 75, beauty: 75, fashion: 72, fitness: 38, cooking: 70, travel: 50, photography: 65, technology: 70, finance: 45, parenting: 65, automotive: 50, pets: 65, sustainability: 50, kpop: 78, basketball: 85, food: 75 },
  MY: { music: 75, sports: 68, gaming: 70, beauty: 75, fashion: 70, fitness: 45, cooking: 75, travel: 65, photography: 65, technology: 75, finance: 60, parenting: 60, automotive: 60, pets: 55, sustainability: 55, food: 85, halal: 78, kpop: 65 },
  SG: { music: 70, sports: 65, gaming: 65, beauty: 70, fashion: 72, fitness: 55, cooking: 70, travel: 80, photography: 70, technology: 82, finance: 80, parenting: 55, automotive: 55, pets: 60, sustainability: 65, food: 85 },
  AU: { music: 72, sports: 78, gaming: 60, beauty: 60, fashion: 60, fitness: 60, cooking: 65, travel: 80, photography: 65, technology: 70, finance: 60, parenting: 55, automotive: 65, pets: 75, sustainability: 70, outdoor: 78, food: 70 },
  CA: { music: 70, sports: 72, gaming: 60, beauty: 60, fashion: 60, fitness: 60, cooking: 65, travel: 75, photography: 65, technology: 70, finance: 65, parenting: 55, automotive: 60, pets: 75, sustainability: 75, hockey: 78, food: 72 },
  IT: { music: 68, sports: 75, gaming: 55, beauty: 75, fashion: 85, fitness: 50, cooking: 88, travel: 75, photography: 70, technology: 60, finance: 50, parenting: 55, automotive: 65, pets: 70, sustainability: 65, food: 92, football: 80 },
  ES: { music: 72, sports: 72, gaming: 58, beauty: 75, fashion: 75, fitness: 55, cooking: 80, travel: 78, photography: 65, technology: 65, finance: 50, parenting: 55, automotive: 55, pets: 75, sustainability: 65, football: 85, food: 85 },
  MX: { music: 80, sports: 70, gaming: 65, beauty: 78, fashion: 72, fitness: 45, cooking: 72, travel: 55, photography: 60, technology: 60, finance: 50, parenting: 65, automotive: 60, pets: 70, sustainability: 55, football: 80, telenovela: 70, food: 80 },
  AE: { music: 65, sports: 65, gaming: 65, beauty: 80, fashion: 82, fitness: 55, cooking: 65, travel: 85, photography: 70, technology: 75, finance: 70, parenting: 55, automotive: 75, pets: 50, sustainability: 60, luxury: 88, food: 75 },
  SA: { music: 60, sports: 75, gaming: 70, beauty: 75, fashion: 75, fitness: 45, cooking: 65, travel: 70, photography: 60, technology: 72, finance: 65, parenting: 65, automotive: 78, pets: 40, sustainability: 50, football: 85, religion: 90, food: 75 },
  TR: { music: 78, sports: 75, gaming: 65, beauty: 75, fashion: 72, fitness: 48, cooking: 75, travel: 60, photography: 65, technology: 65, finance: 55, parenting: 60, automotive: 60, pets: 65, sustainability: 55, football: 80, drama: 70, food: 80 },
  RU: { music: 72, sports: 65, gaming: 70, beauty: 72, fashion: 65, fitness: 45, cooking: 70, travel: 50, photography: 65, technology: 70, finance: 55, parenting: 55, automotive: 65, pets: 60, sustainability: 50, football: 70, food: 70 },
  ZA: { music: 78, sports: 75, gaming: 60, beauty: 65, fashion: 65, fitness: 45, cooking: 65, travel: 55, photography: 55, technology: 60, finance: 50, parenting: 60, automotive: 55, pets: 65, sustainability: 55, rugby: 75, soccer: 78, food: 65 },
  AR: { music: 78, sports: 80, gaming: 60, beauty: 72, fashion: 68, fitness: 48, cooking: 70, travel: 60, photography: 60, technology: 60, finance: 45, parenting: 60, automotive: 55, pets: 75, sustainability: 60, football: 90, asado: 80, food: 75 },
  PL: { music: 68, sports: 60, gaming: 60, beauty: 60, fashion: 60, fitness: 50, cooking: 70, travel: 70, photography: 60, technology: 70, finance: 55, parenting: 55, automotive: 60, pets: 65, sustainability: 60, food: 70 },
  NL: { music: 68, sports: 65, gaming: 60, beauty: 55, fashion: 60, fitness: 60, cooking: 65, travel: 78, photography: 65, technology: 72, finance: 65, parenting: 55, automotive: 55, pets: 70, sustainability: 82, cycling: 80, food: 68 },
  SE: { music: 70, sports: 65, gaming: 60, beauty: 55, fashion: 60, fitness: 65, cooking: 65, travel: 75, photography: 65, technology: 75, finance: 65, parenting: 60, automotive: 55, pets: 70, sustainability: 88, outdoor: 75, food: 68 },
};

// ============================================================
// 5. PURCHASE BEHAVIOR (구매 행동)
//    DataReportal Digital 2025 + Statista 공개 통계 (AMO + 시장 개요) 기반.
//    eMarketer Premium 미연결 — 출처로 노출하지 않음.
// ============================================================
export const PURCHASE_BEHAVIOR = {
  KR: {
    ecommerceShare: 35.3, mobileCommerceShare: 73.5, avgMonthlySpend: 285,
    paymentMethods: { card: 65, mobilePay: 25, transfer: 8, cash: 2 },
    topCategories: { fashion: 78, electronics: 72, beauty: 75, food: 88, travel: 65, home: 60, entertainment: 70 },
    decisionFactors: { price: 78, reviews: 85, brand: 65, quality: 82, delivery: 72, recommendation: 60 },
    pricesensitivity: 72, brandLoyalty: 55, impulsiveBuying: 45, planningBeforeBuy: 75,
  },
  US: { ecommerceShare: 16.4, mobileCommerceShare: 45.5, avgMonthlySpend: 580, paymentMethods: { card: 75, mobilePay: 15, transfer: 5, cash: 5 }, topCategories: { fashion: 72, electronics: 78, beauty: 60, food: 70, travel: 75, home: 68, entertainment: 78 }, decisionFactors: { price: 75, reviews: 88, brand: 60, quality: 75, delivery: 65, recommendation: 55 }, pricesensitivity: 72, brandLoyalty: 50, impulsiveBuying: 55, planningBeforeBuy: 65 },
  JP: { ecommerceShare: 12.0, mobileCommerceShare: 55.5, avgMonthlySpend: 320, paymentMethods: { card: 70, mobilePay: 18, transfer: 8, cash: 4 }, topCategories: { fashion: 72, electronics: 80, beauty: 78, food: 75, travel: 62, home: 65, entertainment: 72 }, decisionFactors: { price: 72, reviews: 80, brand: 75, quality: 90, delivery: 75, recommendation: 50 }, pricesensitivity: 65, brandLoyalty: 75, impulsiveBuying: 35, planningBeforeBuy: 85 },
  CN: { ecommerceShare: 47.0, mobileCommerceShare: 82.5, avgMonthlySpend: 230, paymentMethods: { card: 18, mobilePay: 78, transfer: 3, cash: 1 }, topCategories: { fashion: 80, electronics: 85, beauty: 82, food: 80, travel: 65, home: 70, entertainment: 75 }, decisionFactors: { price: 80, reviews: 90, brand: 70, quality: 80, delivery: 80, recommendation: 75 }, pricesensitivity: 78, brandLoyalty: 60, impulsiveBuying: 65, planningBeforeBuy: 65 },
  GB: { ecommerceShare: 30.2, mobileCommerceShare: 60.5, avgMonthlySpend: 420, paymentMethods: { card: 78, mobilePay: 12, transfer: 7, cash: 3 }, topCategories: { fashion: 75, electronics: 72, beauty: 65, food: 80, travel: 78, home: 68, entertainment: 75 }, decisionFactors: { price: 78, reviews: 85, brand: 60, quality: 78, delivery: 80, recommendation: 55 }, pricesensitivity: 75, brandLoyalty: 55, impulsiveBuying: 45, planningBeforeBuy: 75 },
  DE: { ecommerceShare: 23.5, mobileCommerceShare: 52.5, avgMonthlySpend: 380, paymentMethods: { card: 50, mobilePay: 8, transfer: 35, cash: 7 }, topCategories: { fashion: 70, electronics: 80, beauty: 58, food: 70, travel: 80, home: 75, entertainment: 65 }, decisionFactors: { price: 80, reviews: 75, brand: 65, quality: 90, delivery: 70, recommendation: 50 }, pricesensitivity: 78, brandLoyalty: 65, impulsiveBuying: 30, planningBeforeBuy: 88 },
  FR: { ecommerceShare: 19.5, mobileCommerceShare: 55.0, avgMonthlySpend: 350, paymentMethods: { card: 75, mobilePay: 10, transfer: 12, cash: 3 }, topCategories: { fashion: 80, electronics: 70, beauty: 78, food: 75, travel: 75, home: 70, entertainment: 65 }, decisionFactors: { price: 70, reviews: 75, brand: 70, quality: 85, delivery: 65, recommendation: 60 }, pricesensitivity: 65, brandLoyalty: 60, impulsiveBuying: 45, planningBeforeBuy: 75 },
  IN: { ecommerceShare: 9.5, mobileCommerceShare: 85.5, avgMonthlySpend: 65, paymentMethods: { card: 12, mobilePay: 55, transfer: 8, cash: 25 }, topCategories: { fashion: 78, electronics: 80, beauty: 65, food: 68, travel: 50, home: 60, entertainment: 70 }, decisionFactors: { price: 88, reviews: 80, brand: 65, quality: 70, delivery: 65, recommendation: 70 }, pricesensitivity: 92, brandLoyalty: 50, impulsiveBuying: 55, planningBeforeBuy: 70 },
  BR: { ecommerceShare: 12.5, mobileCommerceShare: 65.5, avgMonthlySpend: 145, paymentMethods: { card: 60, mobilePay: 20, transfer: 12, cash: 8 }, topCategories: { fashion: 80, electronics: 78, beauty: 78, food: 75, travel: 55, home: 65, entertainment: 70 }, decisionFactors: { price: 85, reviews: 78, brand: 60, quality: 75, delivery: 70, recommendation: 65 }, pricesensitivity: 85, brandLoyalty: 55, impulsiveBuying: 60, planningBeforeBuy: 60 },
  ID: { ecommerceShare: 15.5, mobileCommerceShare: 80.5, avgMonthlySpend: 85, paymentMethods: { card: 15, mobilePay: 65, transfer: 12, cash: 8 }, topCategories: { fashion: 78, electronics: 75, beauty: 80, food: 70, travel: 45, home: 60, entertainment: 65 }, decisionFactors: { price: 85, reviews: 80, brand: 65, quality: 72, delivery: 70, recommendation: 75 }, pricesensitivity: 88, brandLoyalty: 50, impulsiveBuying: 65, planningBeforeBuy: 60 },
  VN: { ecommerceShare: 16.0, mobileCommerceShare: 78.5, avgMonthlySpend: 95, paymentMethods: { card: 20, mobilePay: 55, transfer: 15, cash: 10 }, topCategories: { fashion: 80, electronics: 75, beauty: 75, food: 75, travel: 45, home: 55, entertainment: 70 }, decisionFactors: { price: 88, reviews: 82, brand: 60, quality: 70, delivery: 72, recommendation: 75 }, pricesensitivity: 90, brandLoyalty: 45, impulsiveBuying: 65, planningBeforeBuy: 55 },
  TH: { ecommerceShare: 18.5, mobileCommerceShare: 75.5, avgMonthlySpend: 145, paymentMethods: { card: 35, mobilePay: 45, transfer: 12, cash: 8 }, topCategories: { fashion: 78, electronics: 75, beauty: 80, food: 80, travel: 50, home: 60, entertainment: 70 }, decisionFactors: { price: 80, reviews: 82, brand: 70, quality: 75, delivery: 72, recommendation: 75 }, pricesensitivity: 80, brandLoyalty: 55, impulsiveBuying: 65, planningBeforeBuy: 60 },
  // Phase B-0: TW PURCHASE_BEHAVIOR 신규 (큐레이션 추정)
  TW: { ecommerceShare: 28.0, mobileCommerceShare: 70.0, avgMonthlySpend: 280, paymentMethods: { card: 50, mobilePay: 35, transfer: 10, cash: 5 }, topCategories: { fashion: 75, electronics: 80, beauty: 78, food: 75, travel: 60, home: 65, entertainment: 72 }, decisionFactors: { price: 72, reviews: 82, brand: 72, quality: 82, delivery: 75, recommendation: 65 }, pricesensitivity: 70, brandLoyalty: 65, impulsiveBuying: 50, planningBeforeBuy: 70 },
  PH: { ecommerceShare: 7.5, mobileCommerceShare: 78.5, avgMonthlySpend: 85, paymentMethods: { card: 25, mobilePay: 55, transfer: 12, cash: 8 }, topCategories: { fashion: 78, electronics: 70, beauty: 75, food: 70, travel: 40, home: 55, entertainment: 65 }, decisionFactors: { price: 85, reviews: 80, brand: 65, quality: 70, delivery: 65, recommendation: 78 }, pricesensitivity: 88, brandLoyalty: 50, impulsiveBuying: 60, planningBeforeBuy: 55 },
  MY: { ecommerceShare: 18.0, mobileCommerceShare: 70.5, avgMonthlySpend: 175, paymentMethods: { card: 45, mobilePay: 35, transfer: 15, cash: 5 }, topCategories: { fashion: 75, electronics: 75, beauty: 78, food: 78, travel: 60, home: 60, entertainment: 70 }, decisionFactors: { price: 80, reviews: 82, brand: 70, quality: 78, delivery: 70, recommendation: 70 }, pricesensitivity: 78, brandLoyalty: 60, impulsiveBuying: 55, planningBeforeBuy: 65 },
  SG: { ecommerceShare: 22.5, mobileCommerceShare: 60.5, avgMonthlySpend: 350, paymentMethods: { card: 60, mobilePay: 28, transfer: 10, cash: 2 }, topCategories: { fashion: 72, electronics: 80, beauty: 70, food: 85, travel: 80, home: 65, entertainment: 75 }, decisionFactors: { price: 75, reviews: 85, brand: 75, quality: 85, delivery: 78, recommendation: 60 }, pricesensitivity: 68, brandLoyalty: 65, impulsiveBuying: 50, planningBeforeBuy: 75 },
  AU: { ecommerceShare: 14.5, mobileCommerceShare: 52.5, avgMonthlySpend: 425, paymentMethods: { card: 75, mobilePay: 15, transfer: 7, cash: 3 }, topCategories: { fashion: 72, electronics: 72, beauty: 60, food: 70, travel: 78, home: 70, entertainment: 72 }, decisionFactors: { price: 75, reviews: 82, brand: 60, quality: 78, delivery: 75, recommendation: 55 }, pricesensitivity: 70, brandLoyalty: 55, impulsiveBuying: 45, planningBeforeBuy: 70 },
  CA: { ecommerceShare: 12.5, mobileCommerceShare: 50.5, avgMonthlySpend: 410, paymentMethods: { card: 78, mobilePay: 12, transfer: 7, cash: 3 }, topCategories: { fashion: 72, electronics: 72, beauty: 60, food: 70, travel: 72, home: 70, entertainment: 72 }, decisionFactors: { price: 78, reviews: 82, brand: 60, quality: 78, delivery: 72, recommendation: 55 }, pricesensitivity: 72, brandLoyalty: 55, impulsiveBuying: 45, planningBeforeBuy: 72 },
  IT: { ecommerceShare: 12.0, mobileCommerceShare: 55.5, avgMonthlySpend: 245, paymentMethods: { card: 60, mobilePay: 15, transfer: 18, cash: 7 }, topCategories: { fashion: 85, electronics: 70, beauty: 78, food: 80, travel: 72, home: 70, entertainment: 65 }, decisionFactors: { price: 70, reviews: 75, brand: 78, quality: 85, delivery: 60, recommendation: 65 }, pricesensitivity: 70, brandLoyalty: 70, impulsiveBuying: 50, planningBeforeBuy: 65 },
  ES: { ecommerceShare: 11.5, mobileCommerceShare: 58.5, avgMonthlySpend: 215, paymentMethods: { card: 70, mobilePay: 15, transfer: 10, cash: 5 }, topCategories: { fashion: 80, electronics: 72, beauty: 75, food: 78, travel: 72, home: 65, entertainment: 65 }, decisionFactors: { price: 75, reviews: 78, brand: 65, quality: 78, delivery: 65, recommendation: 65 }, pricesensitivity: 78, brandLoyalty: 60, impulsiveBuying: 50, planningBeforeBuy: 65 },
  MX: { ecommerceShare: 11.5, mobileCommerceShare: 70.5, avgMonthlySpend: 145, paymentMethods: { card: 50, mobilePay: 30, transfer: 12, cash: 8 }, topCategories: { fashion: 75, electronics: 72, beauty: 78, food: 72, travel: 50, home: 60, entertainment: 70 }, decisionFactors: { price: 85, reviews: 78, brand: 60, quality: 72, delivery: 65, recommendation: 70 }, pricesensitivity: 85, brandLoyalty: 50, impulsiveBuying: 60, planningBeforeBuy: 60 },
  AE: { ecommerceShare: 23.0, mobileCommerceShare: 62.5, avgMonthlySpend: 525, paymentMethods: { card: 68, mobilePay: 22, transfer: 8, cash: 2 }, topCategories: { fashion: 82, electronics: 75, beauty: 80, food: 75, travel: 85, home: 70, entertainment: 70 }, decisionFactors: { price: 65, reviews: 80, brand: 78, quality: 80, delivery: 75, recommendation: 55 }, pricesensitivity: 55, brandLoyalty: 70, impulsiveBuying: 55, planningBeforeBuy: 70 },
  SA: { ecommerceShare: 14.5, mobileCommerceShare: 68.5, avgMonthlySpend: 285, paymentMethods: { card: 55, mobilePay: 30, transfer: 10, cash: 5 }, topCategories: { fashion: 78, electronics: 75, beauty: 75, food: 72, travel: 65, home: 65, entertainment: 65 }, decisionFactors: { price: 72, reviews: 75, brand: 75, quality: 80, delivery: 65, recommendation: 65 }, pricesensitivity: 65, brandLoyalty: 65, impulsiveBuying: 50, planningBeforeBuy: 70 },
  TR: { ecommerceShare: 14.0, mobileCommerceShare: 70.5, avgMonthlySpend: 125, paymentMethods: { card: 60, mobilePay: 25, transfer: 10, cash: 5 }, topCategories: { fashion: 78, electronics: 70, beauty: 75, food: 72, travel: 55, home: 60, entertainment: 65 }, decisionFactors: { price: 85, reviews: 75, brand: 65, quality: 72, delivery: 65, recommendation: 65 }, pricesensitivity: 85, brandLoyalty: 55, impulsiveBuying: 55, planningBeforeBuy: 60 },
  RU: { ecommerceShare: 11.5, mobileCommerceShare: 65.5, avgMonthlySpend: 195, paymentMethods: { card: 65, mobilePay: 18, transfer: 12, cash: 5 }, topCategories: { fashion: 75, electronics: 75, beauty: 72, food: 70, travel: 50, home: 65, entertainment: 65 }, decisionFactors: { price: 82, reviews: 75, brand: 60, quality: 75, delivery: 65, recommendation: 60 }, pricesensitivity: 82, brandLoyalty: 55, impulsiveBuying: 50, planningBeforeBuy: 65 },
  ZA: { ecommerceShare: 5.5, mobileCommerceShare: 60.5, avgMonthlySpend: 145, paymentMethods: { card: 55, mobilePay: 25, transfer: 12, cash: 8 }, topCategories: { fashion: 75, electronics: 72, beauty: 65, food: 68, travel: 45, home: 60, entertainment: 60 }, decisionFactors: { price: 85, reviews: 75, brand: 55, quality: 72, delivery: 60, recommendation: 60 }, pricesensitivity: 85, brandLoyalty: 50, impulsiveBuying: 50, planningBeforeBuy: 60 },
  AR: { ecommerceShare: 9.5, mobileCommerceShare: 62.5, avgMonthlySpend: 95, paymentMethods: { card: 60, mobilePay: 22, transfer: 12, cash: 6 }, topCategories: { fashion: 75, electronics: 72, beauty: 75, food: 72, travel: 55, home: 60, entertainment: 70 }, decisionFactors: { price: 85, reviews: 78, brand: 60, quality: 70, delivery: 60, recommendation: 65 }, pricesensitivity: 88, brandLoyalty: 50, impulsiveBuying: 55, planningBeforeBuy: 55 },
  PL: { ecommerceShare: 14.5, mobileCommerceShare: 50.5, avgMonthlySpend: 175, paymentMethods: { card: 60, mobilePay: 18, transfer: 17, cash: 5 }, topCategories: { fashion: 70, electronics: 72, beauty: 65, food: 65, travel: 65, home: 65, entertainment: 65 }, decisionFactors: { price: 82, reviews: 75, brand: 60, quality: 75, delivery: 65, recommendation: 60 }, pricesensitivity: 80, brandLoyalty: 55, impulsiveBuying: 45, planningBeforeBuy: 70 },
  NL: { ecommerceShare: 22.5, mobileCommerceShare: 50.5, avgMonthlySpend: 385, paymentMethods: { card: 55, mobilePay: 12, transfer: 28, cash: 5 }, topCategories: { fashion: 72, electronics: 72, beauty: 55, food: 70, travel: 78, home: 70, entertainment: 65 }, decisionFactors: { price: 75, reviews: 80, brand: 60, quality: 80, delivery: 75, recommendation: 55 }, pricesensitivity: 72, brandLoyalty: 60, impulsiveBuying: 40, planningBeforeBuy: 75 },
  SE: { ecommerceShare: 11.5, mobileCommerceShare: 55.5, avgMonthlySpend: 365, paymentMethods: { card: 60, mobilePay: 22, transfer: 15, cash: 3 }, topCategories: { fashion: 68, electronics: 72, beauty: 50, food: 68, travel: 75, home: 70, entertainment: 65 }, decisionFactors: { price: 75, reviews: 80, brand: 60, quality: 82, delivery: 72, recommendation: 55 }, pricesensitivity: 70, brandLoyalty: 60, impulsiveBuying: 40, planningBeforeBuy: 75 },
};

// ============================================================
// SOURCES (메타 정보)
// ============================================================
// CEO 2026-06-17: 출처는 lib/data-sources.js 의 PUBLIC_DATA_SOURCES 를 단일 기준으로 사용.
//   하위 메타는 각 차원별 노출 라벨 (4개 공개 데이터 + 1개 광고비 소스에서 골라 매핑).
import { PUBLIC_DATA_SOURCES } from "../lib/data-sources.js";

function _src(id) { return PUBLIC_DATA_SOURCES.find(s => s.id === id) || null; }
function _meta(id, cadence, coverage) {
  const s = _src(id);
  return s ? {
    name: s.name, url: s.url, license: s.license,
    cadence, coverage, year: s.year,
  } : null;
}

export const AUDIENCE_SOURCES = {
  demographics: _meta("worldBank", "annual", "200+ countries"),
  lifestyle:    _meta("dataReportal", "annual", "47+ countries"),
  mindset:      _meta("dataReportal", "annual", "47+ countries"),
  interests:    _meta("dataReportal", "annual", "47+ countries"),
  purchase:     _meta("statista", "annual", "AMO 9 segments"),
};

// ============================================================
// AUDIENCE_SOURCES_BY_COUNTRY (Phase 1d, 2026-06-18)
//   CEO 14:31 지침 "최신 데이터 우선, 부재 시 전년도 OK" 반영.
//   6국 × 5dim per-country 소스 메타 (Chaeyeon 초안 통합).
//   dataKind: official | mixed | estimate | partial
// ============================================================
export const AUDIENCE_SOURCES_BY_COUNTRY = {
  KR: {
    demographics: { source: "UN World Population Prospects 2025", year: 2025, url: "https://population.un.org/wpp/", retrievedAt: "2026-06-18", dataKind: "official" },
    lifestyle: { source: "DataReportal Digital 2025 South Korea", year: 2025, url: "https://datareportal.com/reports/digital-2025-south-korea", retrievedAt: "2026-06-18", dataKind: "official", notes: "Kepios + ITU + GSMA Intelligence 기반" },
    mindset: { source: "Reuters Institute Digital News Report 2025 South Korea + Hofstede Insights KR", year: 2025, url: "https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2025/south-korea", retrievedAt: "2026-06-18", dataKind: "official", notes: "숲폼 뉴스 +2배, AI Act 2026-01, Naver News Committee" },
    interests: { source: "큐레이션 추정 (KR 시장 일반론)", year: 2024, dataKind: "estimate", license: "paid-required", notes: "GWI Pro 라이선스 결정 시 정밀치 갱신" },
    purchase: { source: "Statista KR + 큐레이션", year: 2024, dataKind: "mixed", notes: "ecommerceShare/mobileCommerce는 Statista, 나머지는 큐레이션" },
  },
  JP: {
    demographics: { source: "UN WPP 2025", year: 2025, url: "https://population.un.org/wpp/", retrievedAt: "2026-06-18", dataKind: "official" },
    lifestyle: { source: "DataReportal Digital 2025 Japan", year: 2025, url: "https://datareportal.com/reports/digital-2025-japan", retrievedAt: "2026-06-18", dataKind: "official" },
    mindset: { source: "Reuters DNR 2025 Japan + Hofstede JP", year: 2025, url: "https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2025/japan", retrievedAt: "2026-06-18", dataKind: "partial", notes: "Reuters 본문 짧음, 후반 정량 차트 Phase 1.5 fetch" },
    interests: { source: "큐레이션 추정", year: 2024, dataKind: "estimate", license: "paid-required" },
    purchase: { source: "Statista JP + 큐레이션", year: 2024, dataKind: "mixed" },
  },
  CN: {
    demographics: { source: "UN WPP 2025", year: 2025, dataKind: "official" },
    lifestyle: { source: "DataReportal Digital 2025 China", year: 2025, url: "https://datareportal.com/reports/digital-2025-china", retrievedAt: "2026-06-18", dataKind: "official" },
    mindset: { source: "CNNIC 49차 인터넷 보고서 + Hofstede CN + 큐레이션", year: 2025, dataKind: "mixed", notes: "Reuters DNR 2025 중국 미포함 (404). CNNIC 영문 abstract 사용. CN mindset narrative 한계 명시." },
    interests: { source: "큐레이션 추정", year: 2024, dataKind: "estimate", license: "paid-required" },
    purchase: { source: "Statista CN + 큐레이션", year: 2024, dataKind: "mixed" },
  },
  TW: {
    demographics: { source: "UN WPP 2025", year: 2025, dataKind: "official", notes: "신규 작성 (TW BASELINE 5dim 부재 해결)" },
    lifestyle: { source: "DataReportal Digital 2025 Taiwan", year: 2025, url: "https://datareportal.com/reports/digital-2025-taiwan", retrievedAt: "2026-06-18", dataKind: "official" },
    mindset: { source: "Hofstede Insights TW + 큐레이션", year: 2025, dataKind: "mixed", notes: "Hofstede TW: IDV=17→28, LTO=93→76, UAI=69→58 (정규화 처리). Reuters TW 후반 fetch Phase 1.5." },
    interests: { source: "큐레이션 추정 (TW 시장)", year: 2024, dataKind: "estimate", license: "paid-required" },
    purchase: { source: "큐레이션 추정 (TW 시장)", year: 2024, dataKind: "estimate" },
  },
  TH: {
    demographics: { source: "UN WPP 2025", year: 2025, dataKind: "official" },
    lifestyle: { source: "DataReportal Digital 2025 Thailand", year: 2025, url: "https://datareportal.com/reports/digital-2025-thailand", retrievedAt: "2026-06-18", dataKind: "official" },
    mindset: { source: "Reuters DNR 2025 Thailand + Hofstede TH", year: 2025, url: "https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2025/thailand", retrievedAt: "2026-06-18", dataKind: "partial", notes: "Reuters TH 본문 truncated, Phase 1.5 후반 fetch" },
    interests: { source: "큐레이션 추정", year: 2024, dataKind: "estimate", license: "paid-required" },
    purchase: { source: "Statista TH + 큐레이션", year: 2024, dataKind: "mixed" },
  },
  PH: {
    demographics: { source: "UN WPP 2025", year: 2025, dataKind: "official" },
    lifestyle: { source: "DataReportal Digital 2025 Philippines", year: 2025, url: "https://datareportal.com/reports/digital-2025-philippines", retrievedAt: "2026-06-18", dataKind: "official", notes: "internet penetration 83.8% (Kepios+ITU). cf. Reuters DNR 2025 PH 67% (디지털 뉴스 소비 인구). 두 출처 정의 다름." },
    mindset: { source: "Reuters DNR 2025 Philippines + Hofstede PH", year: 2025, url: "https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2025/philippines", retrievedAt: "2026-06-18", dataKind: "official", notes: "Smart TV 뉴스 53%, 콘텐츠 크리에이터 36-46%, 디스인포 규제" },
    interests: { source: "Reuters DNR 2025 PH (contentCreator 36-46%) + 큐레이션", year: 2025, dataKind: "mixed", license: "partial-paid" },
    purchase: { source: "Statista PH + 큐레이션", year: 2024, dataKind: "mixed" },
  },
};

export function getSourceMeta(code, dim) {
  return AUDIENCE_SOURCES_BY_COUNTRY[code]?.[dim] || null;
}

// ============================================================
// HELPERS
// ============================================================
export function getDemographics(code) { return DEMOGRAPHICS[code] || null; }
export function getLifestyle(code) { return LIFESTYLE[code] || null; }
export function getMindset(code) { return MINDSET[code] || null; }
export function getInterests(code) { return INTERESTS[code] || null; }
export function getPurchase(code) { return PURCHASE_BEHAVIOR[code] || null; }
export function listAudienceSources() { return AUDIENCE_SOURCES; }
// 실제 베이스라인이 적재된 국가 코드 목록 (DEMOGRAPHICS 기준 = coverage SoT)
export function listBaselineCountries() { return Object.keys(DEMOGRAPHICS); }

// ageBuckets 체계 정규화 (정합성 fix 2026-06-23):
//   기존 KR/JP/CN/US = 5구간 (0-14/15-29/30-44/45-59/60+)
//   신규 47국        = 6구간 (18-24/25-34/35-44/45-54/55-64/65+)
// 두 체계가 compare/차트에서 섮이면 라벨 불일치로 비교가 깨짐.
// 두 체계 모두에서 '60세+' / '15~29세(청년층)' 비율을 안전하게 추출.
export function getAgeSeniorShare(buckets) {
  if (!buckets || typeof buckets !== "object") return null;
  // 5구간: 60+ / 6구간: 55-64 + 65+ (60세 이상 근사)
  if (buckets["60+"] != null) return buckets["60+"];
  if (buckets["65+"] != null) {
    return Number(buckets["65+"] || 0) + Number(buckets["55-64"] || 0);
  }
  return null;
}
export function getAgeYouthShare(buckets) {
  if (!buckets || typeof buckets !== "object") return null;
  // 5구간: 15-29 / 6구간: 18-24 + 25-34의 절반 근사 (15~29세 대응)
  if (buckets["15-29"] != null) return buckets["15-29"];
  if (buckets["18-24"] != null) {
    return Number(buckets["18-24"] || 0) + Number(buckets["25-34"] || 0) * 0.5;
  }
  return null;
}
