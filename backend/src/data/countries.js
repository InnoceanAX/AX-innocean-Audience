// BigQuery Google Trends 지원 43국 + INNOCEAN 거점인데 Trends 미지원인 3국
// innoceanOffice: true → INNOCEAN Worldwide 법인 보유국 (UI에 거점 배지)
// 출처: bigquery-public-data.google_trends.international_top_terms (42국) + top_terms (US, DMA)
// Tier 분리 없음 — 모든 국가 동일하게 인사이트 제공
// trendsUnavailable: true → BigQuery Trends 미지원. 그러나 World Bank·Insights·Persona는 정상 제공 (부분 활성화)
// World Bank·UN 매칭 ISO 3166-1 alpha-2

export const COUNTRIES = [
  // === Asia Pacific ===
  // C-2 fix (Chaeyeon 2026-06-17 21:49 → CTO 21:55): personaSupported 마커 추가 — 무신사 6국(KR/JP/CN/TW/TH/PH)만 true
  { code: "KR", name: "한국",       nameEn: "South Korea",  region: "asia-pacific", flag: "🇰🇷", currency: "KRW", language: "ko", innoceanOffice: true, innoceanOfficeName: "본사 (서울)", personaSupported: true },
  { code: "JP", name: "일본",       nameEn: "Japan",        region: "asia-pacific", flag: "🇯🇵", currency: "JPY", language: "ja", innoceanOffice: true, innoceanOfficeName: "Innocean Japan", personaSupported: true },
  { code: "TW", name: "대만",       nameEn: "Taiwan",       region: "asia-pacific", flag: "🇹🇼", currency: "TWD", language: "zh", personaSupported: true },
  { code: "IN", name: "인도",       nameEn: "India",        region: "asia-pacific", flag: "🇮🇳", currency: "INR", language: "en", innoceanOffice: true, innoceanOfficeName: "Innocean India" },
  { code: "ID", name: "인도네시아", nameEn: "Indonesia",    region: "asia-pacific", flag: "🇮🇩", currency: "IDR", language: "id" },
  { code: "VN", name: "베트남",     nameEn: "Vietnam",      region: "asia-pacific", flag: "🇻🇳", currency: "VND", language: "vi" },
  { code: "TH", name: "태국",       nameEn: "Thailand",     region: "asia-pacific", flag: "🇹🇭", currency: "THB", language: "th", personaSupported: true },
  { code: "MY", name: "말레이시아", nameEn: "Malaysia",     region: "asia-pacific", flag: "🇲🇾", currency: "MYR", language: "ms" },
  { code: "PH", name: "필리핀",     nameEn: "Philippines",  region: "asia-pacific", flag: "🇵🇭", currency: "PHP", language: "en", personaSupported: true },
  { code: "AU", name: "호주",       nameEn: "Australia",    region: "asia-pacific", flag: "🇦🇺", currency: "AUD", language: "en", innoceanOffice: true, innoceanOfficeName: "Innocean Australia" },
  { code: "NZ", name: "뉴질랜드",   nameEn: "New Zealand",  region: "asia-pacific", flag: "🇳🇿", currency: "NZD", language: "en" },
  { code: "SG", name: "싱가포르",   nameEn: "Singapore",    region: "asia-pacific", flag: "🇸🇬", currency: "SGD", language: "en" },
  { code: "HK", name: "홍콩",       nameEn: "Hong Kong",    region: "asia-pacific", flag: "🇭🇰", currency: "HKD", language: "zh" },
  { code: "BD", name: "방글라데시", nameEn: "Bangladesh",   region: "asia-pacific", flag: "🇧🇩", currency: "BDT", language: "bn" },
  { code: "PK", name: "파키스탄",   nameEn: "Pakistan",     region: "asia-pacific", flag: "🇵🇰", currency: "PKR", language: "ur" },
  { code: "LK", name: "스리랑카",   nameEn: "Sri Lanka",    region: "asia-pacific", flag: "🇱🇰", currency: "LKR", language: "si" },
  { code: "MM", name: "미얀마",     nameEn: "Myanmar",      region: "asia-pacific", flag: "🇲🇲", currency: "MMK", language: "my" },
  { code: "KH", name: "캄보디아",   nameEn: "Cambodia",     region: "asia-pacific", flag: "🇰🇭", currency: "KHR", language: "km" },
  { code: "MN", name: "몽골",       nameEn: "Mongolia",     region: "asia-pacific", flag: "🇲🇳", currency: "MNT", language: "mn" },
  { code: "KZ", name: "카자흐스탄", nameEn: "Kazakhstan",   region: "asia-pacific", flag: "🇰🇿", currency: "KZT", language: "kk" },

  // === Americas ===
  { code: "US", name: "미국",       nameEn: "United States",region: "americas",     flag: "🇺🇸", currency: "USD", language: "en", innoceanOffice: true, innoceanOfficeName: "Innocean Worldwide Americas (Huntington Beach)" },
  { code: "CA", name: "캐나다",     nameEn: "Canada",       region: "americas",     flag: "🇨🇦", currency: "CAD", language: "en", innoceanOffice: true, innoceanOfficeName: "Innocean Canada" },
  { code: "MX", name: "멕시코",     nameEn: "Mexico",       region: "americas",     flag: "🇲🇽", currency: "MXN", language: "es", innoceanOffice: true, innoceanOfficeName: "Innocean Mexico" },
  { code: "BR", name: "브라질",     nameEn: "Brazil",       region: "americas",     flag: "🇧🇷", currency: "BRL", language: "pt", innoceanOffice: true, innoceanOfficeName: "Innocean Brazil" },
  { code: "AR", name: "아르헨티나", nameEn: "Argentina",    region: "americas",     flag: "🇦🇷", currency: "ARS", language: "es" },
  { code: "CL", name: "칠레",       nameEn: "Chile",        region: "americas",     flag: "🇨🇱", currency: "CLP", language: "es" },
  { code: "CO", name: "콜롬비아",   nameEn: "Colombia",     region: "americas",     flag: "🇨🇴", currency: "COP", language: "es" },
  { code: "PE", name: "페루",       nameEn: "Peru",         region: "americas",     flag: "🇵🇪", currency: "PEN", language: "es" },
  { code: "VE", name: "베네수엘라", nameEn: "Venezuela",    region: "americas",     flag: "🇻🇪", currency: "VES", language: "es" },
  { code: "EC", name: "에콰도르",   nameEn: "Ecuador",      region: "americas",     flag: "🇪🇨", currency: "USD", language: "es" },
  { code: "UY", name: "우루과이",   nameEn: "Uruguay",      region: "americas",     flag: "🇺🇾", currency: "UYU", language: "es" },

  // === Europe ===
  { code: "GB", name: "영국",       nameEn: "United Kingdom",region: "europe",      flag: "🇬🇧", currency: "GBP", language: "en", innoceanOffice: true, innoceanOfficeName: "Innocean Worldwide UK" },
  { code: "DE", name: "독일",       nameEn: "Germany",      region: "europe",       flag: "🇩🇪", currency: "EUR", language: "de", innoceanOffice: true, innoceanOfficeName: "Innocean Worldwide Europe (Frankfurt)" },
  { code: "FR", name: "프랑스",     nameEn: "France",       region: "europe",       flag: "🇫🇷", currency: "EUR", language: "fr", innoceanOffice: true, innoceanOfficeName: "Innocean France" },
  { code: "IT", name: "이탈리아",   nameEn: "Italy",        region: "europe",       flag: "🇮🇹", currency: "EUR", language: "it", innoceanOffice: true, innoceanOfficeName: "Innocean Italy" },
  { code: "ES", name: "스페인",     nameEn: "Spain",        region: "europe",       flag: "🇪🇸", currency: "EUR", language: "es", innoceanOffice: true, innoceanOfficeName: "Innocean Spain" },
  { code: "NL", name: "네덜란드",   nameEn: "Netherlands",  region: "europe",       flag: "🇳🇱", currency: "EUR", language: "nl" },
  { code: "BE", name: "벨기에",     nameEn: "Belgium",      region: "europe",       flag: "🇧🇪", currency: "EUR", language: "nl" },
  { code: "CH", name: "스위스",     nameEn: "Switzerland",  region: "europe",       flag: "🇨🇭", currency: "CHF", language: "de" },
  { code: "AT", name: "오스트리아", nameEn: "Austria",      region: "europe",       flag: "🇦🇹", currency: "EUR", language: "de" },
  { code: "SE", name: "스웨덴",     nameEn: "Sweden",       region: "europe",       flag: "🇸🇪", currency: "SEK", language: "sv" },
  { code: "NO", name: "노르웨이",   nameEn: "Norway",       region: "europe",       flag: "🇳🇴", currency: "NOK", language: "no" },
  { code: "DK", name: "덴마크",     nameEn: "Denmark",      region: "europe",       flag: "🇩🇰", currency: "DKK", language: "da" },
  { code: "FI", name: "핀란드",     nameEn: "Finland",      region: "europe",       flag: "🇫🇮", currency: "EUR", language: "fi" },
  { code: "PT", name: "포르투갈",   nameEn: "Portugal",     region: "europe",       flag: "🇵🇹", currency: "EUR", language: "pt" },
  { code: "PL", name: "폴란드",     nameEn: "Poland",       region: "europe",       flag: "🇵🇱", currency: "PLN", language: "pl", innoceanOffice: true, innoceanOfficeName: "Innocean Poland" },
  { code: "CZ", name: "체코",       nameEn: "Czechia",      region: "europe",       flag: "🇨🇿", currency: "CZK", language: "cs" },
  { code: "HU", name: "헝가리",     nameEn: "Hungary",      region: "europe",       flag: "🇭🇺", currency: "HUF", language: "hu" },
  { code: "RO", name: "루마니아",   nameEn: "Romania",      region: "europe",       flag: "🇷🇴", currency: "RON", language: "ro" },
  { code: "UA", name: "우크라이나", nameEn: "Ukraine",      region: "europe",       flag: "🇺🇦", currency: "UAH", language: "uk" },
  { code: "IE", name: "아일랜드",   nameEn: "Ireland",      region: "europe",       flag: "🇮🇪", currency: "EUR", language: "en" },
  { code: "GR", name: "그리스",     nameEn: "Greece",       region: "europe",       flag: "🇬🇷", currency: "EUR", language: "el" },
  { code: "BG", name: "불가리아",   nameEn: "Bulgaria",     region: "europe",       flag: "🇧🇬", currency: "BGN", language: "bg" },
  { code: "HR", name: "크로아티아", nameEn: "Croatia",      region: "europe",       flag: "🇭🇷", currency: "EUR", language: "hr" },
  { code: "SK", name: "슬로바키아", nameEn: "Slovakia",     region: "europe",       flag: "🇸🇰", currency: "EUR", language: "sk" },
  { code: "SI", name: "슬로베니아", nameEn: "Slovenia",     region: "europe",       flag: "🇸🇮", currency: "EUR", language: "sl" },
  { code: "LT", name: "리투아니아", nameEn: "Lithuania",    region: "europe",       flag: "🇱🇹", currency: "EUR", language: "lt" },
  { code: "LV", name: "라트비아",   nameEn: "Latvia",       region: "europe",       flag: "🇱🇻", currency: "EUR", language: "lv" },
  { code: "EE", name: "에스토니아", nameEn: "Estonia",      region: "europe",       flag: "🇪🇪", currency: "EUR", language: "et" },

  // === Middle East & Africa ===
  { code: "AE", name: "UAE",         nameEn: "United Arab Emirates", region: "middle-east", flag: "🇦🇪", currency: "AED", language: "ar", trendsUnavailable: true, trendsUnavailableReason: "BigQuery Trends 미지원 (Yandex/Talkwalker 어댑터 추가 예정)", innoceanOffice: true, innoceanOfficeName: "Innocean MEA (Dubai)" },
  { code: "SA", name: "사우디아라비아", nameEn: "Saudi Arabia", region: "middle-east", flag: "🇸🇦", currency: "SAR", language: "ar", innoceanOffice: true, innoceanOfficeName: "Innocean Saudi Arabia" },
  { code: "IL", name: "이스라엘",   nameEn: "Israel",       region: "middle-east",  flag: "🇮🇱", currency: "ILS", language: "he" },
  { code: "TR", name: "튀르키예",   nameEn: "Turkey",       region: "middle-east",  flag: "🇹🇷", currency: "TRY", language: "tr", innoceanOffice: true, innoceanOfficeName: "Innocean Turkey" },
  { code: "EG", name: "이집트",     nameEn: "Egypt",        region: "middle-east",  flag: "🇪🇬", currency: "EGP", language: "ar" },
  { code: "NG", name: "나이지리아", nameEn: "Nigeria",      region: "africa",       flag: "🇳🇬", currency: "NGN", language: "en" },
  { code: "ZA", name: "남아공",     nameEn: "South Africa", region: "africa",       flag: "🇿🇦", currency: "ZAR", language: "en", innoceanOffice: true, innoceanOfficeName: "Innocean Africa" },
  { code: "QA", name: "카타르",     nameEn: "Qatar",        region: "middle-east",  flag: "🇶🇦", currency: "QAR", language: "ar" },
  { code: "KW", name: "쿠웨이트",   nameEn: "Kuwait",       region: "middle-east",  flag: "🇰🇼", currency: "KWD", language: "ar" },
  { code: "BH", name: "바레인",     nameEn: "Bahrain",      region: "middle-east",  flag: "🇧🇭", currency: "BHD", language: "ar" },
  { code: "OM", name: "오만",       nameEn: "Oman",         region: "middle-east",  flag: "🇴🇲", currency: "OMR", language: "ar" },
  { code: "JO", name: "요르단",     nameEn: "Jordan",       region: "middle-east",  flag: "🇯🇴", currency: "JOD", language: "ar" },
  { code: "MA", name: "모로코",     nameEn: "Morocco",      region: "africa",       flag: "🇲🇦", currency: "MAD", language: "ar" },
  { code: "KE", name: "케냐",       nameEn: "Kenya",        region: "africa",       flag: "🇰🇪", currency: "KES", language: "sw" },
  { code: "ET", name: "에티오피아", nameEn: "Ethiopia",     region: "africa",       flag: "🇪🇹", currency: "ETB", language: "am" },
  { code: "GH", name: "가나",       nameEn: "Ghana",        region: "africa",       flag: "🇬🇭", currency: "GHS", language: "en" },

  // === INNOCEAN 거점. Trends 미지원 (부분 활성화: WB+Insights+Persona OK) ===
  { code: "CN", name: "중국",       nameEn: "China",        region: "asia-pacific", flag: "🇨🇳", currency: "CNY", language: "zh", trendsUnavailable: true, trendsUnavailableReason: "Google 본토 차단 — Baidu Index 어댑터 추가 예정", innoceanOffice: true, innoceanOfficeName: "Innocean Worldwide China (Shanghai/Beijing)", personaSupported: true },
  { code: "RU", name: "러시아",     nameEn: "Russia",       region: "europe",       flag: "🇷🇺", currency: "RUB", language: "ru", trendsUnavailable: true, trendsUnavailableReason: "BigQuery Trends 미지원 — Yandex Wordstat 어댑터 추가 예정", innoceanOffice: true, innoceanOfficeName: "Innocean Worldwide Russia" },
];

export const REGIONS = {
  "asia-pacific": { name: "아시아·태평양", order: 1 },
  "americas":     { name: "미주",          order: 2 },
  "europe":       { name: "유럽",          order: 3 },
  "middle-east":  { name: "중동",          order: 4 },
  "africa":       { name: "아프리카",      order: 5 },
};
