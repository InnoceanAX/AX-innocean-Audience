// bigquery-audience.js
// BigQuery cold/analytics sink for Audience persona-pool campaigns.
//
// Mirrors the pattern used by AX-innocean-influencer's server/_core/bigquery.ts:
//   - Uses the GCE metadata server access token (ADC on Cloud Run).
//   - No SDK dependency; plain fetch to the BigQuery REST API.
//   - Fire-and-forget. Failures never throw to callers — they are logged warn.
//
// Configuration (env):
//   GCP_PROJECT_ID         — required to enable
//   BQ_DATASET_AUDIENCE    — dataset name (default "innocean_audience")
//
// Tables (CTO will create before next deploy):
//
//   CREATE TABLE `${project}.${dataset}.audience_campaigns` (
//     brief_id              STRING NOT NULL,
//     brand                 STRING,
//     name                  STRING,
//     countries             STRING,                -- comma-joined list
//     total_personas        INT64,
//     generation_duration_ms INT64,
//     gemini_cost_usd       FLOAT64,
//     completed_at          TIMESTAMP
//   );
//
//   CREATE TABLE `${project}.${dataset}.audience_persona_batches` (
//     brief_id              STRING NOT NULL,
//     country               STRING NOT NULL,
//     count                 INT64,
//     completed_at          TIMESTAMP
//   );

const PROJECT = (process.env.GCP_PROJECT_ID || "").trim();
const DATASET = (process.env.BQ_DATASET_AUDIENCE || "innocean_audience").trim();

let _cachedToken = null;
let _tokenExpiry = 0;

export function isEnabled() {
  return PROJECT.length > 0;
}

async function getAccessToken() {
  if (_cachedToken && Date.now() < _tokenExpiry - 60_000) return _cachedToken;
  const resp = await fetch(
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
    { headers: { "Metadata-Flavor": "Google" } }
  );
  if (!resp.ok) throw new Error(`ADC metadata error: ${resp.status}`);
  const data = await resp.json();
  _cachedToken = data.access_token;
  _tokenExpiry = Date.now() + (data.expires_in || 3000) * 1000;
  return _cachedToken;
}

async function insertAll(table, row, insertId) {
  if (!isEnabled()) return;
  try {
    const token = await getAccessToken();
    const url =
      `https://bigquery.googleapis.com/bigquery/v2/projects/${PROJECT}` +
      `/datasets/${DATASET}/tables/${table}/insertAll`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        rows: [{ insertId, json: row }],
      }),
    });
    if (!resp.ok) {
      const detail = await resp.text().catch(() => "");
      console.warn(`[bigquery-audience] insertAll ${table} failed: ${resp.status} ${detail}`);
    }
  } catch (e) {
    console.warn(`[bigquery-audience] ${table} error (non-fatal):`, e?.message || e);
  }
}

/**
 * Append a completed-campaign row. Fire-and-forget.
 */
export async function logCampaignCompletion({
  briefId,
  brand,
  name,
  countries,
  totalPersonas,
  generationDurationMs,
  geminiCostUsd,
  completedAt,
}) {
  if (!isEnabled() || !briefId) return;
  const row = {
    brief_id: String(briefId),
    brand: brand ?? null,
    name: name ?? null,
    countries: Array.isArray(countries) ? countries.join(",") : (countries ?? null),
    total_personas: Number.isFinite(totalPersonas) ? totalPersonas : null,
    generation_duration_ms: Number.isFinite(generationDurationMs) ? generationDurationMs : null,
    gemini_cost_usd: Number.isFinite(geminiCostUsd) ? geminiCostUsd : null,
    completed_at: completedAt || new Date().toISOString(),
  };
  await insertAll("audience_campaigns", row, `${briefId}:${row.completed_at}`);
}

/**
 * Append a per-country persona batch row. Fire-and-forget.
 */
export async function logPersonaBatch({ briefId, country, count, completedAt }) {
  if (!isEnabled() || !briefId || !country) return;
  const row = {
    brief_id: String(briefId),
    country: String(country).toUpperCase(),
    count: Number.isFinite(count) ? count : null,
    completed_at: completedAt || new Date().toISOString(),
  };
  await insertAll(
    "audience_persona_batches",
    row,
    `${briefId}:${row.country}:${row.completed_at}`
  );
}
