// 34국 카탈로그 — INNOCEAN 글로벌 거점 + 주요 시장
// World Bank · UN data 매칭 가능한 ISO 3166-1 alpha-2 코드
// Tier 1: 풀 인사이트 / Tier 2: 경량 인사이트

export const COUNTRIES = [
  // === Asia Pacific (Tier 1) ===
  { code: "KR", name: "한국", nameEn: "South Korea", region: "asia-pacific", flag: "🇰🇷", tier: 1, currency: "KRW", language: "ko", innocean: true },
  { code: "JP", name: "일본", nameEn: "Japan", region: "asia-pacific", flag: "🇯🇵", tier: 1, currency: "JPY", language: "ja", innocean: true },
  { code: "CN", name: "중국", nameEn: "China", region: "asia-pacific", flag: "🇨🇳", tier: 1, currency: "CNY", language: "zh", innocean: true },
  { code: "ID", name: "인도네시아", nameEn: "Indonesia", region: "asia-pacific", flag: "🇮🇩", tier: 1, currency: "IDR", language: "id", innocean: true },
  { code: "VN", name: "베트남", nameEn: "Vietnam", region: "asia-pacific", flag: "🇻🇳", tier: 1, currency: "VND", language: "vi", innocean: true },
  { code: "TH", name: "태국", nameEn: "Thailand", region: "asia-pacific", flag: "🇹🇭", tier: 1, currency: "THB", language: "th", innocean: true },
  { code: "MY", name: "말레이시아", nameEn: "Malaysia", region: "asia-pacific", flag: "🇲🇾", tier: 1, currency: "MYR", language: "ms", innocean: true },
  { code: "SG", name: "싱가포르", nameEn: "Singapore", region: "asia-pacific", flag: "🇸🇬", tier: 1, currency: "SGD", language: "en", innocean: true },
  { code: "AU", name: "호주", nameEn: "Australia", region: "asia-pacific", flag: "🇦🇺", tier: 1, currency: "AUD", language: "en", innocean: true },
  { code: "NZ", name: "뉴질랜드", nameEn: "New Zealand", region: "asia-pacific", flag: "🇳🇿", tier: 1, currency: "NZD", language: "en", innocean: false },

  // === Americas (Tier 1) ===
  { code: "US", name: "미국", nameEn: "United States", region: "americas", flag: "🇺🇸", tier: 1, currency: "USD", language: "en", innocean: true },
  { code: "CA", name: "캐나다", nameEn: "Canada", region: "americas", flag: "🇨🇦", tier: 1, currency: "CAD", language: "en", innocean: true },
  { code: "MX", name: "멕시코", nameEn: "Mexico", region: "americas", flag: "🇲🇽", tier: 1, currency: "MXN", language: "es", innocean: true },
  { code: "BR", name: "브라질", nameEn: "Brazil", region: "americas", flag: "🇧🇷", tier: 1, currency: "BRL", language: "pt", innocean: true },

  // === Europe (Tier 1) ===
  { code: "DE", name: "독일", nameEn: "Germany", region: "europe", flag: "🇩🇪", tier: 1, currency: "EUR", language: "de", innocean: true },
  { code: "GB", name: "영국", nameEn: "United Kingdom", region: "europe", flag: "🇬🇧", tier: 1, currency: "GBP", language: "en", innocean: true },
  { code: "FR", name: "프랑스", nameEn: "France", region: "europe", flag: "🇫🇷", tier: 1, currency: "EUR", language: "fr", innocean: true },
  { code: "ES", name: "스페인", nameEn: "Spain", region: "europe", flag: "🇪🇸", tier: 1, currency: "EUR", language: "es", innocean: true },
  { code: "IT", name: "이탈리아", nameEn: "Italy", region: "europe", flag: "🇮🇹", tier: 1, currency: "EUR", language: "it", innocean: true },
  { code: "NL", name: "네덜란드", nameEn: "Netherlands", region: "europe", flag: "🇳🇱", tier: 1, currency: "EUR", language: "nl", innocean: false },
  { code: "SE", name: "스웨덴", nameEn: "Sweden", region: "europe", flag: "🇸🇪", tier: 1, currency: "SEK", language: "sv", innocean: false },
  { code: "PL", name: "폴란드", nameEn: "Poland", region: "europe", flag: "🇵🇱", tier: 1, currency: "PLN", language: "pl", innocean: false },

  // === Middle East & Africa (Tier 2) ===
  { code: "AE", name: "UAE", nameEn: "United Arab Emirates", region: "middle-east", flag: "🇦🇪", tier: 2, currency: "AED", language: "ar", innocean: true },
  { code: "SA", name: "사우디아라비아", nameEn: "Saudi Arabia", region: "middle-east", flag: "🇸🇦", tier: 2, currency: "SAR", language: "ar", innocean: true },
  { code: "TR", name: "튀르키예", nameEn: "Turkey", region: "middle-east", flag: "🇹🇷", tier: 2, currency: "TRY", language: "tr", innocean: true },
  { code: "EG", name: "이집트", nameEn: "Egypt", region: "middle-east", flag: "🇪🇬", tier: 2, currency: "EGP", language: "ar", innocean: false },
  { code: "ZA", name: "남아프리카공화국", nameEn: "South Africa", region: "africa", flag: "🇿🇦", tier: 2, currency: "ZAR", language: "en", innocean: false },

  // === Asia (Tier 2) ===
  { code: "IN", name: "인도", nameEn: "India", region: "asia-pacific", flag: "🇮🇳", tier: 2, currency: "INR", language: "en", innocean: true },
  { code: "PH", name: "필리핀", nameEn: "Philippines", region: "asia-pacific", flag: "🇵🇭", tier: 2, currency: "PHP", language: "en", innocean: false },
  { code: "TW", name: "대만", nameEn: "Taiwan", region: "asia-pacific", flag: "🇹🇼", tier: 2, currency: "TWD", language: "zh", innocean: false },
  { code: "HK", name: "홍콩", nameEn: "Hong Kong", region: "asia-pacific", flag: "🇭🇰", tier: 2, currency: "HKD", language: "zh", innocean: false },

  // === Americas (Tier 2) ===
  { code: "AR", name: "아르헨티나", nameEn: "Argentina", region: "americas", flag: "🇦🇷", tier: 2, currency: "ARS", language: "es", innocean: false },
  { code: "CL", name: "칠레", nameEn: "Chile", region: "americas", flag: "🇨🇱", tier: 2, currency: "CLP", language: "es", innocean: false },
  { code: "CO", name: "콜롬비아", nameEn: "Colombia", region: "americas", flag: "🇨🇴", tier: 2, currency: "COP", language: "es", innocean: false },

  // === Europe (Tier 2) ===
  { code: "RU", name: "러시아", nameEn: "Russia", region: "europe", flag: "🇷🇺", tier: 2, currency: "RUB", language: "ru", innocean: false },
];

export const REGIONS = {
  "asia-pacific": { name: "아시아·태평양", order: 1 },
  "americas": { name: "미주", order: 2 },
  "europe": { name: "유럽", order: 3 },
  "middle-east": { name: "중동", order: 4 },
  "africa": { name: "아프리카", order: 5 },
};
