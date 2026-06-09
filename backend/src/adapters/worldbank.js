// World Bank Open Data Adapter
// 무료, 키 불필요. 인구·GDP·인터넷 침투율·도시화율 등 진짜 지표.
// API doc: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392

const WB_BASE = "https://api.worldbank.org/v2";

// ISO 2자리 → World Bank 3자리 코드 매핑
const ISO2_TO_WB = {
  KR: "KOR", JP: "JPN", CN: "CHN", ID: "IDN", VN: "VNM", TH: "THA", MY: "MYS",
  SG: "SGP", AU: "AUS", NZ: "NZL", US: "USA", CA: "CAN", MX: "MEX", BR: "BRA",
  DE: "DEU", GB: "GBR", FR: "FRA", ES: "ESP", IT: "ITA", NL: "NLD", SE: "SWE",
  PL: "POL", AE: "ARE", SA: "SAU", TR: "TUR", EG: "EGY", ZA: "ZAF", IN: "IND",
  PH: "PHL", TW: "TWN", HK: "HKG", AR: "ARG", CL: "CHL", CO: "COL", RU: "RUS",
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

// 단일 국가·지표 최신값 fetch
async function fetchIndicator(wbCode, indicator) {
  const url = `${WB_BASE}/country/${wbCode}/indicator/${indicator}?format=json&per_page=10&date=2018:2023`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`WB ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data) || !Array.isArray(data[1])) return null;
    // 최신 non-null 값 반환
    const valid = data[1].filter(d => d.value !== null);
    if (!valid.length) return null;
    valid.sort((a, b) => Number(b.date) - Number(a.date));
    return { value: valid[0].value, year: valid[0].date };
  } catch (err) {
    console.warn(`[WB] ${wbCode}/${indicator} failed:`, err.message);
    return null;
  }
}

// 메모리 캐시 (TTL 6시간)
const cache = new Map();
const TTL = 6 * 60 * 60 * 1000;

export async function getCountryStats(iso2) {
  const code = String(iso2).toUpperCase();
  const wbCode = ISO2_TO_WB[code];
  if (!wbCode) return null;

  const cacheKey = `stats:${code}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < TTL) return cached.data;

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
