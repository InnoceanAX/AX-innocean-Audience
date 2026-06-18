// World Bank Open Data Adapter
// 무료, 키 불필요. 인구·GDP·인터넷 침투율·도시화율 등 진짜 지표.
// API doc: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392

const WB_BASE = "https://api.worldbank.org/v2";

// ISO 2자리 → World Bank 3자리 코드 매핑 (ISO 3166-1 alpha-3 표준)
// Phase 0a 확장 (2026-06-18): 35국 → 77국 (CEO 14:28 "UI 77국 라이브 fetch" 충족)
const ISO2_TO_WB = {
  // 기존 35국 (유지)
  KR: "KOR", JP: "JPN", CN: "CHN", ID: "IDN", VN: "VNM", TH: "THA", MY: "MYS",
  SG: "SGP", AU: "AUS", NZ: "NZL", US: "USA", CA: "CAN", MX: "MEX", BR: "BRA",
  DE: "DEU", GB: "GBR", FR: "FRA", ES: "ESP", IT: "ITA", NL: "NLD", SE: "SWE",
  PL: "POL", AE: "ARE", SA: "SAU", TR: "TUR", EG: "EGY", ZA: "ZAF", IN: "IND",
  PH: "PHL", TW: "TWN", HK: "HKG", AR: "ARG", CL: "CHL", CO: "COL", RU: "RUS",
  // Phase 0a 신규 42국 (countries.js UI 지원 국가 전부 커버)
  AT: "AUT", BD: "BGD", BE: "BEL", BG: "BGR", BH: "BHR",
  CH: "CHE", CZ: "CZE", DK: "DNK", EC: "ECU", EE: "EST",
  ET: "ETH", FI: "FIN", GH: "GHA", GR: "GRC", HR: "HRV",
  HU: "HUN", IE: "IRL", IL: "ISR", JO: "JOR", KE: "KEN",
  KH: "KHM", KW: "KWT", KZ: "KAZ", LK: "LKA", LT: "LTU",
  LV: "LVA", MA: "MAR", MM: "MMR", MN: "MNG", NG: "NGA",
  NO: "NOR", OM: "OMN", PE: "PER", PK: "PAK", PT: "PRT",
  QA: "QAT", RO: "ROU", SI: "SVN", SK: "SVK", UA: "UKR",
  UY: "URY", VE: "VEN",
};

// World Bank 주요 지표
const INDICATORS = {
  population: "SP.POP.TOTL",                  // 총 인구
  gdpPerCapita: "NY.GDP.PCAP.CD",             // 1인당 GDP (USD)
  internetUsers: "IT.NET.USER.ZS",            // 인터넷 사용 인구 비율 (%)
  urbanPop: "SP.URB.TOTL.IN.ZS",              // 도시 인구 비율 (%)
  mobileSubs: "IT.CEL.SETS.P2",               // 인구 100명당 모바일 가입 수
  laborForce: "SL.TLF.TOTL.IN",               // 노동력 인구
  populationAge15To64: "SP.POP.1564.TO.ZS",   // 15-64세 비율 (%)
  ageDependencyRatio: "SP.POP.DPND",          // 노동가능인구 대비 부양률
};

// C-1 fix (Chaeyeon 2026-06-17 21:49 → CTO 2026-06-17 21:55):
//   기존 하드코딩 `date=2018:2023` (5년전·2년전) → 동적 계산으로 전환.
//   World Bank 키 지표는 일반적으로 1–2년 지연이므로
//   lookback = (currentYear-5):(currentYear-1) 로 설정, 연간 자동 보정.
const WB_LOOKBACK_YEARS = 5;
function wbDateRange() {
  const y = new Date().getUTCFullYear();
  return `${y - WB_LOOKBACK_YEARS}:${y - 1}`;
}

// 단일 국가·지표 최신값 fetch
// CEO 2026-06-18 14:07 Item 1: ERR/NULL 명시 메타 반환 (채연 진단 반영).
async function fetchIndicator(wbCode, indicator) {
  const url = `${WB_BASE}/country/${wbCode}/indicator/${indicator}?format=json&per_page=10&date=${wbDateRange()}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      return { value: null, year: null, source: `WB API ${res.status}` };
    }
    const data = await res.json();
    if (!Array.isArray(data) || !Array.isArray(data[1])) {
      return { value: null, year: null, source: "WB API NULL" };
    }
    // 최신 non-null 값 반환
    const valid = data[1].filter(d => d.value !== null);
    if (!valid.length) {
      return { value: null, year: null, source: "WB API NO_DATA" };
    }
    valid.sort((a, b) => Number(b.date) - Number(a.date));
    return { value: valid[0].value, year: valid[0].date, source: "WB API" };
  } catch (err) {
    console.warn(`[WB] ${wbCode}/${indicator} failed:`, err.message);
    return { value: null, year: null, source: `WB API ERR: ${err.message}` };
  }
}

// 메모리 캐시 (TTL 6시간)
const cache = new Map();
const TTL = 6 * 60 * 60 * 1000;

// CEO 2026-06-18 14:07 Item 1: TW 는 WB 회원국 아님 → 명시 메타 (외부 출처 DGBAS Taiwan / IMF WEO / UN WPP 권고)
const WB_UNSUPPORTED = new Set(["TW"]);

export async function getCountryStats(iso2) {
  const code = String(iso2).toUpperCase();
  const wbCode = ISO2_TO_WB[code];
  if (!wbCode) return null;

  const cacheKey = `stats:${code}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < TTL) return cached.data;

  // CEO 14:07 Item 1: TW 명시 분기
  if (WB_UNSUPPORTED.has(code)) {
    const data = {
      country: code,
      source: "World Bank Open Data",
      indicators: Object.fromEntries(
        Object.keys(INDICATORS).map(key => [key, { value: null, year: null, source: "WB API UNSUPPORTED: TW (Taiwan is not a WB member, use DGBAS / IMF WEO / UN WPP)" }])
      ),
      note: "Taiwan은 World Bank 회원국이 아니므로 WB 데이터가 없습니다. DGBAS Taiwan / IMF WEO / UN WPP 외부 출처 사용 권장.",
      fetchedAt: new Date().toISOString(),
    };
    cache.set(cacheKey, { data, ts: Date.now() });
    return data;
  }

  const results = {};
  await Promise.all(
    Object.entries(INDICATORS).map(async ([key, ind]) => {
      results[key] = await fetchIndicator(wbCode, ind);
    })
  );

  const data = {
    country: code,
    source: "World Bank Open Data",
    indicators: results,
    fetchedAt: new Date().toISOString(),
  };
  cache.set(cacheKey, { data, ts: Date.now() });
  return data;
}

export async function getCountryStatsBatch(iso2List) {
  const out = {};
  await Promise.all(
    iso2List.map(async (code) => {
      out[code] = await getCountryStats(code);
    })
  );
  return out;
}
