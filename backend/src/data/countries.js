// BigQuery Google Trends Public Dataset 지원 43개국
// 출처: bigquery-public-data.google_trends.international_top_terms (42국) + top_terms (US, DMA 단위)
// Tier 분리 없음 — 모든 국가 동일하게 Google Trends 기반 인사이트 제공
// World Bank·UN 매칭 ISO 3166-1 alpha-2

export const COUNTRIES = [
  // === Asia Pacific ===
  { code: "KR", name: "한국",       nameEn: "South Korea",  region: "asia-pacific", flag: "🇰🇷", currency: "KRW", language: "ko" },
  { code: "JP", name: "일본",       nameEn: "Japan",        region: "asia-pacific", flag: "🇯🇵", currency: "JPY", language: "ja" },
  { code: "TW", name: "대만",       nameEn: "Taiwan",       region: "asia-pacific", flag: "🇹🇼", currency: "TWD", language: "zh" },
  { code: "IN", name: "인도",       nameEn: "India",        region: "asia-pacific", flag: "🇮🇳", currency: "INR", language: "en" },
  { code: "ID", name: "인도네시아", nameEn: "Indonesia",    region: "asia-pacific", flag: "🇮🇩", currency: "IDR", language: "id" },
  { code: "VN", name: "베트남",     nameEn: "Vietnam",      region: "asia-pacific", flag: "🇻🇳", currency: "VND", language: "vi" },
  { code: "TH", name: "태국",       nameEn: "Thailand",     region: "asia-pacific", flag: "🇹🇭", currency: "THB", language: "th" },
  { code: "MY", name: "말레이시아", nameEn: "Malaysia",     region: "asia-pacific", flag: "🇲🇾", currency: "MYR", language: "ms" },
  { code: "PH", name: "필리핀",     nameEn: "Philippines",  region: "asia-pacific", flag: "🇵🇭", currency: "PHP", language: "en" },
  { code: "AU", name: "호주",       nameEn: "Australia",    region: "asia-pacific", flag: "🇦🇺", currency: "AUD", language: "en" },
  { code: "NZ", name: "뉴질랜드",   nameEn: "New Zealand",  region: "asia-pacific", flag: "🇳🇿", currency: "NZD", language: "en" },

  // === Americas ===
  { code: "US", name: "미국",       nameEn: "United States",region: "americas",     flag: "🇺🇸", currency: "USD", language: "en" },
  { code: "CA", name: "캐나다",     nameEn: "Canada",       region: "americas",     flag: "🇨🇦", currency: "CAD", language: "en" },
  { code: "MX", name: "멕시코",     nameEn: "Mexico",       region: "americas",     flag: "🇲🇽", currency: "MXN", language: "es" },
  { code: "BR", name: "브라질",     nameEn: "Brazil",       region: "americas",     flag: "🇧🇷", currency: "BRL", language: "pt" },
  { code: "AR", name: "아르헨티나", nameEn: "Argentina",    region: "americas",     flag: "🇦🇷", currency: "ARS", language: "es" },
  { code: "CL", name: "칠레",       nameEn: "Chile",        region: "americas",     flag: "🇨🇱", currency: "CLP", language: "es" },
  { code: "CO", name: "콜롬비아",   nameEn: "Colombia",     region: "americas",     flag: "🇨🇴", currency: "COP", language: "es" },

  // === Europe ===
  { code: "GB", name: "영국",       nameEn: "United Kingdom",region: "europe",      flag: "🇬🇧", currency: "GBP", language: "en" },
  { code: "DE", name: "독일",       nameEn: "Germany",      region: "europe",       flag: "🇩🇪", currency: "EUR", language: "de" },
  { code: "FR", name: "프랑스",     nameEn: "France",       region: "europe",       flag: "🇫🇷", currency: "EUR", language: "fr" },
  { code: "IT", name: "이탈리아",   nameEn: "Italy",        region: "europe",       flag: "🇮🇹", currency: "EUR", language: "it" },
  { code: "ES", name: "스페인",     nameEn: "Spain",        region: "europe",       flag: "🇪🇸", currency: "EUR", language: "es" },
  { code: "NL", name: "네덜란드",   nameEn: "Netherlands",  region: "europe",       flag: "🇳🇱", currency: "EUR", language: "nl" },
  { code: "BE", name: "벨기에",     nameEn: "Belgium",      region: "europe",       flag: "🇧🇪", currency: "EUR", language: "nl" },
  { code: "CH", name: "스위스",     nameEn: "Switzerland",  region: "europe",       flag: "🇨🇭", currency: "CHF", language: "de" },
  { code: "AT", name: "오스트리아", nameEn: "Austria",      region: "europe",       flag: "🇦🇹", currency: "EUR", language: "de" },
  { code: "SE", name: "스웨덴",     nameEn: "Sweden",       region: "europe",       flag: "🇸🇪", currency: "SEK", language: "sv" },
  { code: "NO", name: "노르웨이",   nameEn: "Norway",       region: "europe",       flag: "🇳🇴", currency: "NOK", language: "no" },
  { code: "DK", name: "덴마크",     nameEn: "Denmark",      region: "europe",       flag: "🇩🇰", currency: "DKK", language: "da" },
  { code: "FI", name: "핀란드",     nameEn: "Finland",      region: "europe",       flag: "🇫🇮", currency: "EUR", language: "fi" },
  { code: "PT", name: "포르투갈",   nameEn: "Portugal",     region: "europe",       flag: "🇵🇹", currency: "EUR", language: "pt" },
  { code: "PL", name: "폴란드",     nameEn: "Poland",       region: "europe",       flag: "🇵🇱", currency: "PLN", language: "pl" },
  { code: "CZ", name: "체코",       nameEn: "Czechia",      region: "europe",       flag: "🇨🇿", currency: "CZK", language: "cs" },
  { code: "HU", name: "헝가리",     nameEn: "Hungary",      region: "europe",       flag: "🇭🇺", currency: "HUF", language: "hu" },
  { code: "RO", name: "루마니아",   nameEn: "Romania",      region: "europe",       flag: "🇷🇴", currency: "RON", language: "ro" },
  { code: "UA", name: "우크라이나", nameEn: "Ukraine",      region: "europe",       flag: "🇺🇦", currency: "UAH", language: "uk" },

  // === Middle East & Africa ===
  { code: "SA", name: "사우디아라비아", nameEn: "Saudi Arabia", region: "middle-east", flag: "🇸🇦", currency: "SAR", language: "ar" },
  { code: "IL", name: "이스라엘",   nameEn: "Israel",       region: "middle-east",  flag: "🇮🇱", currency: "ILS", language: "he" },
  { code: "TR", name: "튀르키예",   nameEn: "Turkey",       region: "middle-east",  flag: "🇹🇷", currency: "TRY", language: "tr" },
  { code: "EG", name: "이집트",     nameEn: "Egypt",        region: "middle-east",  flag: "🇪🇬", currency: "EGP", language: "ar" },
  { code: "NG", name: "나이지리아", nameEn: "Nigeria",      region: "africa",       flag: "🇳🇬", currency: "NGN", language: "en" },
  { code: "ZA", name: "남아공",     nameEn: "South Africa", region: "africa",       flag: "🇿🇦", currency: "ZAR", language: "en" },
];

export const REGIONS = {
  "asia-pacific": { name: "아시아·태평양", order: 1 },
  "americas":     { name: "미주",          order: 2 },
  "europe":       { name: "유럽",          order: 3 },
  "middle-east":  { name: "중동",          order: 4 },
  "africa":       { name: "아프리카",      order: 5 },
};
