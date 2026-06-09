// adapters/trends-bq.js
// Google Trends via BigQuery Public Dataset (`bigquery-public-data.google_trends`)
// 엔터프라이즈급 — 비공식 endpoint 사용 안 함
//
// 사용 테이블:
//   - international_top_terms (42개국, country_code + region_name, refresh_date 파티션)
//   - top_terms (US DMA-level, 백업)
//
// 파티션 프루닝 필수: refresh_date 컬럼은 상수 DATE() 로 필터링해야 비용 절감 (서브쿼리 ✗)
//
// 인증: ADC (Application Default Credentials) — `gcloud auth application-default login` 또는
//       서비스 어카운트 키 (Cloud Run에서는 자동)
//
// Free tier: 월 1TB 쿼리. 일일 1국가 캐싱 시 비용 거의 없음.

import { BigQuery } from "@google-cloud/bigquery";

const bq = new BigQuery();
const DATASET = "bigquery-public-data.google_trends";
const TABLE_INTL = `${DATASET}.international_top_terms`;
const TABLE_US = `${DATASET}.top_terms`;

// 메모리 캐시: { key: { data, exp } }, key="cc:YYYY-MM-DD"
const cache = new Map();
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12h

// Google Trends BigQuery 지원국 (international_top_terms)
const SUPPORTED_COUNTRIES = new Set([
  "AR","AT","AU","BE","BR","CA","CH","CL","CO","CZ","DE","DK","EG","ES","FI",
  "FR","GB","HU","ID","IL","IN","IT","JP","KR","MX","MY","NG","NL","NO","NZ",
  "PH","PL","PT","RO","SA","SE","TH","TR","TW","UA","VN","ZA",
]);
// US 는 top_terms 별도 테이블에서 (DMA 단위)
SUPPORTED_COUNTRIES.add("US");

function isSupportedCountry(code) {
  return SUPPORTED_COUNTRIES.has(code);
}

function getSupportedCountryCodes() {
  return Array.from(SUPPORTED_COUNTRIES).sort();
}

// 최근 며칠 중 데이터가 있는 가장 최신 일자 찾기 (5일 lookback)
async function getLatestRefreshDate(countryCode) {
  const isUS = countryCode === "US";
  const tbl = isUS ? TABLE_US : TABLE_INTL;
  const cKey = `latestdate:${countryCode}`;
  const c = cache.get(cKey);
  if (c && c.exp > Date.now()) return c.data;

  let query;
  if (isUS) {
    query = `
      SELECT MAX(refresh_date) AS d
      FROM \`${tbl}\`
      WHERE refresh_date BETWEEN DATE_SUB(CURRENT_DATE("UTC"), INTERVAL 7 DAY) AND CURRENT_DATE("UTC")
    `;
  } else {
    query = `
      SELECT MAX(refresh_date) AS d
      FROM \`${tbl}\`
      WHERE refresh_date BETWEEN DATE_SUB(CURRENT_DATE("UTC"), INTERVAL 7 DAY) AND CURRENT_DATE("UTC")
        AND country_code = @cc
    `;
  }
  const [rows] = await bq.query({
    query,
    params: isUS ? {} : { cc: countryCode },
    location: "US",
  });
  // BigQuery JS DATE 값은 { value: 'YYYY-MM-DD' } 또는 문자열
  const raw = rows[0]?.d;
  const d = raw && typeof raw === "object" ? raw.value : raw;
  cache.set(cKey, { data: d, exp: Date.now() + 60 * 60 * 1000 }); // 1h
  return d;
}

// 국가 일별 Top 25 트렌드
async function getDailyTopTerms(countryCode, opts = {}) {
  if (!isSupportedCountry(countryCode)) {
    return {
      ok: false,
      countryCode,
      supported: false,
      reason: "BigQuery google_trends 데이터셋에서 지원하지 않는 국가입니다.",
      terms: [],
    };
  }

  const refreshDate = opts.refreshDate || (await getLatestRefreshDate(countryCode));
  if (!refreshDate) {
    return {
      ok: false,
      countryCode,
      supported: true,
      reason: "최근 7일 내 데이터 없음",
      terms: [],
    };
  }

  const cKey = `terms:${countryCode}:${refreshDate}`;
  const c = cache.get(cKey);
  if (c && c.exp > Date.now()) return c.data;

  const isUS = countryCode === "US";
  let query;
  // refresh_date는 SQL 안에 상수로 직접 박는다 (파티션 프루닝 확실 + 타입 변환 이슈 회피)
  // refreshDate는 YYYY-MM-DD 문자열로 검증된 값
  if (!/^\d{4}-\d{2}-\d{2}$/.test(refreshDate)) {
    throw new Error(`Invalid refreshDate: ${refreshDate}`);
  }
  if (isUS) {
    query = `
      SELECT rank, term, AVG(score) AS score
      FROM \`${TABLE_US}\`
      WHERE refresh_date = DATE("${refreshDate}")
      GROUP BY rank, term
      ORDER BY rank
      LIMIT 25
    `;
  } else {
    query = `
      SELECT rank, term, AVG(score) AS score
      FROM \`${TABLE_INTL}\`
      WHERE refresh_date = DATE("${refreshDate}")
        AND country_code = @cc
      GROUP BY rank, term
      ORDER BY rank
      LIMIT 25
    `;
  }
  const [rows] = await bq.query({
    query,
    params: isUS ? {} : { cc: countryCode },
    location: "US",
  });
  const result = {
    ok: true,
    countryCode,
    supported: true,
    refreshDate,
    terms: rows.map((r) => ({
      rank: r.rank,
      term: r.term,
      score: Math.round(Number(r.score) || 0),
    })),
    source: "BigQuery: bigquery-public-data.google_trends",
  };
  cache.set(cKey, { data: result, exp: Date.now() + CACHE_TTL_MS });
  return result;
}

// 지역별 Top terms (지방색): 국가 내 region_name 별 1위 term
async function getRegionalBreakdown(countryCode) {
  if (countryCode === "US" || !isSupportedCountry(countryCode)) {
    return { ok: false, countryCode, reason: "지역별 분석 미지원 (US/비지원국)", regions: [] };
  }
  const refreshDate = await getLatestRefreshDate(countryCode);
  if (!refreshDate) return { ok: false, countryCode, reason: "데이터 없음", regions: [] };

  const cKey = `regions:${countryCode}:${refreshDate}`;
  const c = cache.get(cKey);
  if (c && c.exp > Date.now()) return c.data;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(refreshDate)) {
    throw new Error(`Invalid refreshDate: ${refreshDate}`);
  }
  const query = `
    SELECT region_name, ARRAY_AGG(STRUCT(rank, term, score) ORDER BY score DESC LIMIT 3) AS top
    FROM \`${TABLE_INTL}\`
    WHERE refresh_date = DATE("${refreshDate}")
      AND country_code = @cc
      AND region_name IS NOT NULL
    GROUP BY region_name
    ORDER BY region_name
    LIMIT 30
  `;
  const [rows] = await bq.query({
    query,
    params: { cc: countryCode },
    location: "US",
  });
  const result = {
    ok: true,
    countryCode,
    refreshDate,
    regions: rows.map((r) => ({
      regionName: r.region_name,
      top: r.top,
    })),
    source: "BigQuery: bigquery-public-data.google_trends",
  };
  cache.set(cKey, { data: result, exp: Date.now() + CACHE_TTL_MS });
  return result;
}

// Health: BQ 연결 + 쿼리 가능 확인 (dry run, 비용 0)
async function health() {
  try {
    const job = await bq.createQueryJob({
      query: `SELECT 1 AS ok`,
      dryRun: true,
      location: "US",
    });
    return { ok: true, project: bq.projectId };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export {
  isSupportedCountry,
  getSupportedCountryCodes,
  getDailyTopTerms,
  getRegionalBreakdown,
  health,
  SUPPORTED_COUNTRIES,
};
