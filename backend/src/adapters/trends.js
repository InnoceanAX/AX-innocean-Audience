// Google Trends Adapter
// 검색 관심도 (relative search volume 0~100)
// 비공식 endpoint 사용 — 키 불필요. 안정성 위해 메모리 캐시 + 실패 시 graceful fallback.

const TRENDS_BASE = "https://trends.google.com/trends/api";

// ISO2 → Google Trends geo 코드 (대부분 동일)
const TRENDS_GEO = {
  KR: "KR", JP: "JP", US: "US", CN: "CN", VN: "VN", TH: "TH", MY: "MY",
  SG: "SG", AU: "AU", NZ: "NZ", CA: "CA", MX: "MX", BR: "BR",
  DE: "DE", GB: "GB", FR: "FR", ES: "ES", IT: "IT", NL: "NL", SE: "SE",
  PL: "PL", AE: "AE", SA: "SA", TR: "TR", EG: "EG", ZA: "ZA",
  IN: "IN", PH: "PH", TW: "TW", HK: "HK", AR: "AR", CL: "CL", CO: "CO",
  RU: "RU", ID: "ID",
};

const cache = new Map();
const TTL = 2 * 60 * 60 * 1000;

// Parse Google Trends 응답 (앞에 ")]}',\n" prefix 붙음)
function parseTrendsResponse(text) {
  if (!text) return null;
  const cleaned = text.replace(/^\)\]\}',?\n?/, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

// 1) Daily Trends — 일별 인기 검색어 (국가 단위)
export async function getDailyTrends(iso2, limit = 10) {
  const code = String(iso2).toUpperCase();
  const geo = TRENDS_GEO[code];
  if (!geo) return { ok: false, error: `geo not mapped: ${code}` };

  const cacheKey = `daily:${geo}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < TTL) return cached.data;

  const url = `${TRENDS_BASE}/dailytrends?hl=en-US&tz=-540&geo=${geo}&ns=15`;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": "Mozilla/5.0 INNOCEAN-Audience/0.1" },
    });
    if (!res.ok) throw new Error(`Trends ${res.status}`);
    const text = await res.text();
    const parsed = parseTrendsResponse(text);
    if (!parsed) throw new Error("parse failed");

    const days = parsed?.default?.trendingSearchesDays || [];
    const today = days[0];
    if (!today) throw new Error("no trending data");
    const items = (today.trendingSearches || []).slice(0, limit).map(t => ({
      query: t.title?.query || "",
      traffic: t.formattedTraffic || "",
      articles: (t.articles || []).slice(0, 2).map(a => ({
        title: a.title || "",
        source: a.source || "",
        url: a.url || "",
      })),
    }));

    const data = {
      ok: true,
      source: "Google Trends",
      geo: code,
      date: today.date,
      items,
      fetchedAt: new Date().toISOString(),
    };
    cache.set(cacheKey, { data, ts: Date.now() });
    return data;
  } catch (err) {
    console.warn(`[Trends/daily] ${code} failed:`, err.message);
    return { ok: false, error: err.message, geo: code };
  }
}
