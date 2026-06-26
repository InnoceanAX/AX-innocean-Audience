// persona-store.js
// SQLite-backed persistence store for AI synthetic personas.
// Replaces the previous in-memory Map + JSON snapshot implementation.
//
// Schema:
//   - campaign_briefs:            id → brief
//   - campaign_personas:          persona_id (with brief_id, country index)
//   - campaign_insights:          (brief_id, scope, country, tab) → JSON
//   - campaign_generation_state:  (brief_id, country) → status/progress
//
// Backward compatibility:
//   The existing route/lib callers use these public functions; signatures
//   must not change. We preserve them while flattening insight payloads
//   into rows internally.
//
//     - saveBrief(brief)            (alias: setBrief)
//     - getBrief(id)
//     - listBriefs()
//     - appendPersonas(briefId, items)
//     - setPersonas(briefId, items)         legacy single-arg form
//     - setPersonas(briefId, country, items) new task-spec form
//     - getPersonas(briefId, {country?, limit?}|country?)
//     - countPersonas(briefId)
//     - setInsights(briefId, payload)       legacy {byCountry, byTab, total}
//     - setInsights(briefId, scope, country, tab, data)  new task-spec form
//     - getInsights(briefId)                returns aggregated payload
//     - getInsights(briefId, country?, tab?)  returns specific row
//     - setGenerationState(briefId, state)  brief-level merge (legacy)
//     - setGenerationState(briefId, country, state)  per-country (new)
//     - getGenerationState(briefId)         brief-level (legacy)
//     - getGenerationState(briefId, country)  per-country (new)
//     - markCancelled(briefId)
//
// Cloud Run note: DB_PATH defaults to ./data/audience-personas.db relative to
// process.cwd(); override with PERSONA_DB_PATH for mounted volumes.

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { downloadDbFromGcs, scheduleDbUpload, _setDbAccessor } from "./persona-gcs.js";

const DB_PATH = process.env.PERSONA_DB_PATH ?? "./data/audience-personas.db";
const LEGACY_JSON_FILE = process.env.PERSONA_STORE_FILE || "/tmp/innocean-personas.json";

const BRIEF_SCOPE_COUNTRY = "*"; // sentinel for brief-level generation_state row

// ───────────────────────────────────────────────────────────────────────
// Database init
// ───────────────────────────────────────────────────────────────────────
let _db = null;

export function getDb() {
  if (_db) return _db;
  try {
    const dir = path.dirname(DB_PATH);
    if (dir && dir !== "." && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");

    _db.exec(`
      CREATE TABLE IF NOT EXISTS campaign_briefs (
        id TEXT PRIMARY KEY,
        brand TEXT NOT NULL,
        name TEXT NOT NULL,
        countries TEXT NOT NULL,
        regions TEXT,
        filters TEXT,
        targets TEXT,
        size_per_country INTEGER NOT NULL DEFAULT 100,
        seed INTEGER,
        preset_id TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      );

      CREATE TABLE IF NOT EXISTS campaign_personas (
        persona_id TEXT NOT NULL,
        brief_id TEXT NOT NULL,
        country TEXT NOT NULL,
        region TEXT,
        age INTEGER,
        gender TEXT,
        attributes TEXT NOT NULL,
        narrative TEXT,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        PRIMARY KEY (brief_id, persona_id)
      );
      CREATE INDEX IF NOT EXISTS idx_personas_brief_country
        ON campaign_personas(brief_id, country);

      CREATE TABLE IF NOT EXISTS campaign_insights (
        id TEXT PRIMARY KEY,
        brief_id TEXT NOT NULL,
        scope TEXT NOT NULL,
        country TEXT,
        tab TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      );
      CREATE INDEX IF NOT EXISTS idx_insights_brief
        ON campaign_insights(brief_id);
      CREATE UNIQUE INDEX IF NOT EXISTS uq_insights_lookup
        ON campaign_insights(brief_id, scope, IFNULL(country,''), tab);

      CREATE TABLE IF NOT EXISTS campaign_generation_state (
        brief_id TEXT NOT NULL,
        country TEXT NOT NULL,
        status TEXT NOT NULL,
        progress INTEGER NOT NULL DEFAULT 0,
        target INTEGER NOT NULL DEFAULT 100,
        error TEXT,
        payload TEXT,
        updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
        PRIMARY KEY (brief_id, country)
      );
    `);

    console.log(`[persona-store] SQLite ready at ${DB_PATH}`);
    // PK Hotfix (CEO 2026-06-26): campaign_personas PK (persona_id) → (brief_id, persona_id)
    // 같은 PK persona_id로 brief간 INSERT OR REPLACE 덮어쓰기 해결.
    migrateCampaignPersonasPk();
    maybeMigrateLegacyJson();
  } catch (e) {
    console.error("[persona-store] failed to open SQLite:", e.message);
    throw e;
  }
  return _db;
}

// PK Hotfix (CEO 2026-06-26 승인): campaign_personas PK 마이그레이션.
// SQLite는 ALTER로 PK 변경 불가 → 새 테이블 생성 + 데이터 복사 + 교체.
// 멱등: 이미 복합키면 noop. 데이터 손실 0.
function migrateCampaignPersonasPk() {
  try {
    // 현재 PK 컬럼 목록 조회. (table_info에서 pk>0 컬럼들이 PK 구성)
    const cols = _db.prepare("PRAGMA table_info(campaign_personas)").all();
    const pkCols = cols.filter((c) => c.pk > 0).sort((a, b) => a.pk - b.pk).map((c) => c.name);
    const isComposite = pkCols.length === 2 && pkCols.includes("brief_id") && pkCols.includes("persona_id");
    if (isComposite) {
      // 이미 마이그레이션 완료.
      return;
    }
    const beforeCount = _db.prepare("SELECT COUNT(*) AS n FROM campaign_personas").get()?.n || 0;
    console.log(`[persona-store][migrate-pk] starting: current PK=${JSON.stringify(pkCols)} rows=${beforeCount}`);
    const tx = _db.transaction(() => {
      // 신 테이블 생성 (복합키)
      _db.exec(`
        CREATE TABLE IF NOT EXISTS campaign_personas_v2 (
          persona_id TEXT NOT NULL,
          brief_id TEXT NOT NULL,
          country TEXT NOT NULL,
          region TEXT,
          age INTEGER,
          gender TEXT,
          attributes TEXT NOT NULL,
          narrative TEXT,
          created_at INTEGER NOT NULL DEFAULT (unixepoch()),
          PRIMARY KEY (brief_id, persona_id)
        );
      `);
      // 전체 데이터 복사. PK가 단독(persona_id)이었어도 row 자체는 그대로.
      // (brief_id, persona_id) 복합키는 더 느슨하므로 충돌 가능성 없음.
      _db.prepare(`
        INSERT INTO campaign_personas_v2
          (persona_id, brief_id, country, region, age, gender, attributes, narrative, created_at)
        SELECT persona_id, brief_id, country, region, age, gender, attributes, narrative, created_at
        FROM campaign_personas
      `).run();
      // 구 테이블 삭제 + 신 테이블 rename + 인덱스 재생성.
      _db.exec(`DROP TABLE campaign_personas;`);
      _db.exec(`ALTER TABLE campaign_personas_v2 RENAME TO campaign_personas;`);
      _db.exec(`
        CREATE INDEX IF NOT EXISTS idx_personas_brief_country
          ON campaign_personas(brief_id, country);
      `);
    });
    tx();
    const afterCount = _db.prepare("SELECT COUNT(*) AS n FROM campaign_personas").get()?.n || 0;
    console.log(`[persona-store][migrate-pk] done: ${beforeCount} → ${afterCount} rows`);
    if (afterCount !== beforeCount) {
      console.error(`[persona-store][migrate-pk] !!! row count mismatch ${beforeCount}→${afterCount}`);
    }
  } catch (e) {
    console.error("[persona-store][migrate-pk] failed:", e.message);
    throw e;
  }
}

// One-time backfill from the old /tmp/innocean-personas.json snapshot.
function maybeMigrateLegacyJson() {
  try {
    if (!LEGACY_JSON_FILE || !fs.existsSync(LEGACY_JSON_FILE)) return;
    // Skip if briefs already populated
    const row = _db.prepare("SELECT COUNT(*) AS n FROM campaign_briefs").get();
    if (row && row.n > 0) return;
    const raw = fs.readFileSync(LEGACY_JSON_FILE, "utf8");
    if (!raw) return;
    const data = JSON.parse(raw);
    let briefCount = 0;
    let personaCount = 0;
    let insightCount = 0;
    let stateCount = 0;

    const tx = _db.transaction(() => {
      for (const [, brief] of data.briefs || []) {
        if (!brief || !brief.id) continue;
        insertBriefRow(brief);
        briefCount++;
      }
      for (const [briefId, list] of data.personas || []) {
        if (!Array.isArray(list)) continue;
        for (const p of list) {
          insertPersonaRow(briefId, p);
          personaCount++;
        }
      }
      for (const [briefId, payload] of data.insights || []) {
        if (!payload || typeof payload !== "object") continue;
        const flat = flattenInsightPayload(briefId, payload);
        for (const r of flat) {
          insertInsightRow(r);
          insightCount++;
        }
      }
      for (const [briefId, state] of data.generation || []) {
        if (!state) continue;
        upsertGenerationRow(briefId, BRIEF_SCOPE_COUNTRY, briefLevelStateToRow(state));
        stateCount++;
      }
    });
    tx();
    console.log(`[persona-store] migrated legacy JSON: ${briefCount} briefs, ${personaCount} personas, ${insightCount} insights, ${stateCount} state rows`);
  } catch (e) {
    console.warn("[persona-store] legacy migration failed (non-fatal):", e.message);
  }
}

// ───────────────────────────────────────────────────────────────────────
// Internal helpers (row mappers)
// ───────────────────────────────────────────────────────────────────────
function jsonOrNull(v) {
  if (v == null) return null;
  try { return JSON.stringify(v); } catch { return null; }
}
function parseJsonOrNull(s) {
  if (s == null) return null;
  try { return JSON.parse(s); } catch { return null; }
}
function parseJsonOrDefault(s, def) {
  const v = parseJsonOrNull(s);
  return v == null ? def : v;
}

function briefRowToObject(row) {
  if (!row) return null;
  return {
    id: row.id,
    brand: row.brand,
    name: row.name,
    countries: parseJsonOrDefault(row.countries, []),
    regions: parseJsonOrDefault(row.regions, null),
    filters: parseJsonOrDefault(row.filters, null),
    targets: parseJsonOrDefault(row.targets, null),
    sizePerCountry: row.size_per_country,
    seed: row.seed,
    presetId: row.preset_id,
    createdAt: row.created_at ? new Date(row.created_at * 1000).toISOString() : null,
  };
}

function personaRowToObject(row) {
  if (!row) return null;
  const attrs = parseJsonOrDefault(row.attributes, {});
  const narrative = parseJsonOrNull(row.narrative);
  // Merge so callers see the original persona shape.
  const out = {
    ...attrs,
    persona_id: row.persona_id,
    country: row.country,
    region: row.region ?? attrs.region ?? null,
    age: row.age ?? attrs.age ?? null,
    gender: row.gender ?? attrs.gender ?? null,
  };
  if (narrative && typeof narrative === "object") {
    Object.assign(out, narrative);
  }
  return out;
}

function insertBriefRow(brief) {
  getDb()
    .prepare(`
      INSERT OR REPLACE INTO campaign_briefs
        (id, brand, name, countries, regions, filters, targets,
         size_per_country, seed, preset_id, created_at)
      VALUES (@id, @brand, @name, @countries, @regions, @filters, @targets,
              @size_per_country, @seed, @preset_id,
              COALESCE(@created_at, unixepoch()))
    `)
    .run({
      id: brief.id,
      brand: brief.brand || "",
      name: brief.name || "",
      countries: jsonOrNull(brief.countries || []),
      regions: jsonOrNull(brief.regions || null),
      filters: jsonOrNull(brief.filters || null),
      targets: jsonOrNull(brief.targets || null),
      size_per_country: parseInt(brief.sizePerCountry, 10) || 100,
      seed: brief.seed ?? null,
      preset_id: brief.presetId ?? null,
      created_at: brief.createdAt
        ? Math.floor(new Date(brief.createdAt).getTime() / 1000)
        : null,
    });
}

function insertPersonaRow(briefId, persona) {
  // Split a few hot columns out for indexing/inspection; stash the rest as JSON.
  const { persona_id, country, region, age, gender, ...rest } = persona;
  if (!persona_id) {
    throw new Error("persona requires persona_id");
  }
  // Pull narrative-ish fields out so they can be optionally inspected.
  // We keep everything intact in `attributes` for fidelity.
  getDb()
    .prepare(`
      INSERT OR REPLACE INTO campaign_personas
        (persona_id, brief_id, country, region, age, gender, attributes, narrative, created_at)
      VALUES (@persona_id, @brief_id, @country, @region, @age, @gender,
              @attributes, @narrative, unixepoch())
    `)
    .run({
      persona_id,
      brief_id: briefId,
      country: String(country || "").toUpperCase(),
      region: region ?? null,
      age: age ?? null,
      gender: gender ?? null,
      attributes: JSON.stringify(persona),
      narrative: jsonOrNull(persona.narrative || null),
    });
}

function flattenInsightPayload(briefId, payload) {
  // Accept the legacy shape { byCountry:{cc:{tab:data}}, byTab:{tab:data}, total }
  // and return a flat list of rows for campaign_insights.
  const rows = [];
  const byCountry = payload?.byCountry || {};
  for (const [cc, tabs] of Object.entries(byCountry)) {
    if (!tabs || typeof tabs !== "object") continue;
    for (const [tab, data] of Object.entries(tabs)) {
      rows.push({
        id: `${briefId}:country:${cc}:${tab}`,
        brief_id: briefId,
        scope: "country",
        country: cc,
        tab,
        data: JSON.stringify(data),
      });
    }
  }
  const byTab = payload?.byTab || payload?.all || {};
  for (const [tab, data] of Object.entries(byTab)) {
    rows.push({
      id: `${briefId}:all::${tab}`,
      brief_id: briefId,
      scope: "all",
      country: null,
      tab,
      data: JSON.stringify(data),
    });
  }
  return rows;
}

function insertInsightRow(r) {
  getDb()
    .prepare(`
      INSERT OR REPLACE INTO campaign_insights
        (id, brief_id, scope, country, tab, data, created_at)
      VALUES (@id, @brief_id, @scope, @country, @tab, @data, unixepoch())
    `)
    .run(r);
}

function briefLevelStateToRow(state) {
  return {
    status: state?.status || "pending",
    progress: Number(state?.done || 0),
    target: Number(state?.total || 0),
    error: state?.error || null,
    payload: jsonOrNull(state || {}),
  };
}

function upsertGenerationRow(briefId, country, fields) {
  getDb()
    .prepare(`
      INSERT INTO campaign_generation_state
        (brief_id, country, status, progress, target, error, payload, updated_at)
      VALUES (@brief_id, @country, @status, @progress, @target, @error, @payload, unixepoch())
      ON CONFLICT(brief_id, country) DO UPDATE SET
        status = excluded.status,
        progress = excluded.progress,
        target = excluded.target,
        error = excluded.error,
        payload = excluded.payload,
        updated_at = unixepoch()
    `)
    .run({
      brief_id: briefId,
      country,
      status: fields.status || "pending",
      progress: fields.progress ?? 0,
      target: fields.target ?? 0,
      error: fields.error ?? null,
      payload: fields.payload ?? null,
    });
}

// ───────────────────────────────────────────────────────────────────────
// Public API — briefs
// ───────────────────────────────────────────────────────────────────────
export function saveBrief(brief) {
  if (!brief || !brief.id) throw new Error("saveBrief: brief.id required");
  insertBriefRow(brief);
  return brief;
}
// task-spec alias
export const setBrief = saveBrief;

export function getBrief(id) {
  if (!id) return null;
  const row = getDb().prepare("SELECT * FROM campaign_briefs WHERE id = ?").get(id);
  return briefRowToObject(row);
}

export function listBriefs() {
  const rows = getDb()
    .prepare("SELECT * FROM campaign_briefs ORDER BY created_at DESC")
    .all();
  return rows.map(briefRowToObject);
}

// 2026-06-23 (CEO 지시): brief 1개 완전 삭제 (4개 테이블 cascade).
export function deleteBrief(id) {
  if (!id) return { deleted: false, reason: "id required" };
  const db = getDb();
  const tx = db.transaction((bid) => {
    db.prepare("DELETE FROM campaign_personas WHERE brief_id = ?").run(bid);
    db.prepare("DELETE FROM campaign_insights WHERE brief_id = ?").run(bid);
    db.prepare("DELETE FROM campaign_generation_state WHERE brief_id = ?").run(bid);
    const r = db.prepare("DELETE FROM campaign_briefs WHERE id = ?").run(bid);
    return r.changes;
  });
  const changes = tx(id);
  // CEO 2026-06-26: 삭제 후 GCS 동기화 — 이게 없으면 재시작 시 GCS 백업에서 삭제된 brief가 부활함.
  if (changes > 0) scheduleDbUpload();
  return { deleted: changes > 0, brief_id: id };
}

// ───────────────────────────────────────────────────────────────────────
// Public API — personas
// ───────────────────────────────────────────────────────────────────────
export function appendPersonas(briefId, items) {
  if (!briefId) throw new Error("appendPersonas: briefId required");
  if (!Array.isArray(items) || items.length === 0) return countPersonas(briefId);
  const db = getDb();
  const tx = db.transaction((rows) => {
    for (const p of rows) insertPersonaRow(briefId, p);
  });
  tx(items);
  scheduleDbUpload();
  return countPersonas(briefId);
}

// setPersonas supports two signatures:
//   setPersonas(briefId, items)            — legacy: replace the whole brief
//   setPersonas(briefId, country, items)   — task-spec: replace one country
export function setPersonas(briefIdOrArg1, arg2, arg3) {
  const db = getDb();
  if (Array.isArray(arg2)) {
    // legacy: setPersonas(briefId, items[])
    const briefId = briefIdOrArg1;
    const items = arg2;
    const tx = db.transaction(() => {
      db.prepare("DELETE FROM campaign_personas WHERE brief_id = ?").run(briefId);
      for (const p of items) insertPersonaRow(briefId, p);
    });
    tx();
    scheduleDbUpload();
    return items.length;
  }
  // task-spec: setPersonas(briefId, country, items[])
  const briefId = briefIdOrArg1;
  const country = String(arg2 || "").toUpperCase();
  const items = Array.isArray(arg3) ? arg3 : [];
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM campaign_personas WHERE brief_id = ? AND country = ?")
      .run(briefId, country);
    for (const p of items) {
      insertPersonaRow(briefId, { ...p, country: p.country || country });
    }
  });
  tx();
  scheduleDbUpload();
  return items.length;
}

// getPersonas signatures:
//   getPersonas(briefId)                              — all personas
//   getPersonas(briefId, country)                     — task-spec string form
//   getPersonas(briefId, { country?, limit? })        — legacy object form
export function getPersonas(briefId, arg2 = null) {
  if (!briefId) return [];
  let country = null;
  let limit = null;
  if (typeof arg2 === "string") country = arg2.toUpperCase();
  else if (arg2 && typeof arg2 === "object") {
    if (arg2.country) country = String(arg2.country).toUpperCase();
    if (arg2.limit != null) limit = parseInt(arg2.limit, 10);
  }
  const db = getDb();
  let sql = "SELECT * FROM campaign_personas WHERE brief_id = ?";
  const params = [briefId];
  if (country) {
    sql += " AND country = ?";
    params.push(country);
  }
  sql += " ORDER BY persona_id ASC";
  if (limit && limit > 0) {
    sql += " LIMIT ?";
    params.push(limit);
  }
  const rows = db.prepare(sql).all(...params);
  return rows.map(personaRowToObject);
}

export function countPersonas(briefId, country = null) {
  if (!briefId) return 0;
  const db = getDb();
  if (country) {
    const r = db
      .prepare("SELECT COUNT(*) AS n FROM campaign_personas WHERE brief_id = ? AND country = ?")
      .get(briefId, String(country).toUpperCase());
    return r?.n || 0;
  }
  const r = db
    .prepare("SELECT COUNT(*) AS n FROM campaign_personas WHERE brief_id = ?")
    .get(briefId);
  return r?.n || 0;
}

// ───────────────────────────────────────────────────────────────────────
// Public API — insights
// ───────────────────────────────────────────────────────────────────────
// setInsights signatures:
//   setInsights(briefId, payload)                     — legacy {byCountry,byTab,total}
//   setInsights(briefId, scope, country, tab, data)   — task-spec single row
export function setInsights(briefIdOrArg1, arg2, arg3, arg4, arg5) {
  const db = getDb();
  // Legacy: setInsights(briefId, payload|null)
  if (arguments.length <= 2 && (arg2 === null || arg2 === undefined || typeof arg2 === "object")) {
    const briefId = briefIdOrArg1;
    const payload = arg2;
    const tx = db.transaction(() => {
      db.prepare("DELETE FROM campaign_insights WHERE brief_id = ?").run(briefId);
      if (payload) {
        for (const r of flattenInsightPayload(briefId, payload)) {
          insertInsightRow(r);
        }
      }
    });
    tx();
    scheduleDbUpload();
    return;
  }
  // Task-spec: setInsights(briefId, scope, country, tab, data)
  const briefId = briefIdOrArg1;
  const scope = arg2;
  const country = arg3 ?? null;
  const tab = arg4;
  const data = arg5;
  insertInsightRow({
    id: `${briefId}:${scope}:${country || ""}:${tab}`,
    brief_id: briefId,
    scope,
    country,
    tab,
    data: JSON.stringify(data),
  });
  scheduleDbUpload();
}

// getInsights signatures:
//   getInsights(briefId)                          — legacy: return {byCountry, byTab, total}
//   getInsights(briefId, country)                 — task-spec: return tabs for country
//   getInsights(briefId, country, tab)            — task-spec: return single row
export function getInsights(briefId, country, tab) {
  if (!briefId) return null;
  const db = getDb();
  if (country == null && tab == null) {
    // Legacy aggregated view
    const rows = db
      .prepare("SELECT scope, country, tab, data FROM campaign_insights WHERE brief_id = ?")
      .all(briefId);
    if (!rows.length) return null;
    const byCountry = {};
    const byTab = {};
    for (const r of rows) {
      const data = parseJsonOrNull(r.data);
      if (r.scope === "country" && r.country) {
        byCountry[r.country] = byCountry[r.country] || {};
        byCountry[r.country][r.tab] = data;
      } else if (r.scope === "all") {
        byTab[r.tab] = data;
      }
    }
    // total: best-effort from byTab.who.total
    const total = byTab?.who?.total ?? null;
    return { byCountry, byTab, total };
  }
  // Specific row lookup
  const ccUp = country ? String(country).toUpperCase() : null;
  if (tab) {
    // Try country scope first, then all scope.
    let row;
    if (ccUp) {
      row = db
        .prepare("SELECT data FROM campaign_insights WHERE brief_id = ? AND scope = 'country' AND country = ? AND tab = ?")
        .get(briefId, ccUp, tab);
    }
    if (!row) {
      row = db
        .prepare("SELECT data FROM campaign_insights WHERE brief_id = ? AND scope = 'all' AND tab = ?")
        .get(briefId, tab);
    }
    return row ? parseJsonOrNull(row.data) : null;
  }
  // country only → all tabs for country
  const rows = db
    .prepare("SELECT tab, data FROM campaign_insights WHERE brief_id = ? AND scope = 'country' AND country = ?")
    .all(briefId, ccUp);
  if (!rows.length) return null;
  const out = {};
  for (const r of rows) out[r.tab] = parseJsonOrNull(r.data);
  return out;
}

// ───────────────────────────────────────────────────────────────────────
// Public API — generation state
// ───────────────────────────────────────────────────────────────────────
// setGenerationState signatures:
//   setGenerationState(briefId, state)            — legacy brief-level merge
//   setGenerationState(briefId, country, state)   — task-spec per-country
export function setGenerationState(briefIdOrArg1, arg2, arg3) {
  const db = getDb();
  if (typeof arg2 === "string") {
    // Per-country form
    const briefId = briefIdOrArg1;
    const country = arg2.toUpperCase();
    const s = arg3 || {};
    upsertGenerationRow(briefId, country, {
      status: s.status || "pending",
      progress: s.progress ?? 0,
      target: s.target ?? 0,
      error: s.error ?? null,
      payload: jsonOrNull(s),
    });
    scheduleDbUpload();
    return getGenerationState(briefId, country);
  }
  // Brief-level form (legacy): merge with existing payload
  const briefId = briefIdOrArg1;
  const patch = arg2 || {};
  const existing = getGenerationState(briefId) || {};
  const merged = { ...existing, ...patch };
  upsertGenerationRow(briefId, BRIEF_SCOPE_COUNTRY, briefLevelStateToRow(merged));
  scheduleDbUpload();
  return merged;
}

export function getGenerationState(briefId, country) {
  if (!briefId) return null;
  const db = getDb();
  if (country) {
    const row = db
      .prepare("SELECT * FROM campaign_generation_state WHERE brief_id = ? AND country = ?")
      .get(briefId, String(country).toUpperCase());
    if (!row) return null;
    const payload = parseJsonOrNull(row.payload) || {};
    return {
      status: row.status,
      progress: row.progress,
      target: row.target,
      error: row.error,
      updatedAt: row.updated_at,
      ...payload,
    };
  }
  // Legacy: return brief-level row
  const row = db
    .prepare("SELECT * FROM campaign_generation_state WHERE brief_id = ? AND country = ?")
    .get(briefId, BRIEF_SCOPE_COUNTRY);
  if (!row) return null;
  const payload = parseJsonOrNull(row.payload);
  if (payload && typeof payload === "object") {
    return payload;
  }
  return {
    status: row.status,
    done: row.progress,
    total: row.target,
    error: row.error,
  };
}

export function markCancelled(briefId) {
  const existing = getGenerationState(briefId);
  if (!existing) return false;
  const merged = { ...existing, cancelled: true };
  upsertGenerationRow(briefId, BRIEF_SCOPE_COUNTRY, briefLevelStateToRow(merged));
  return true;
}

// GCS restore → then eagerly initialize the DB so legacy migration runs at module load.
await downloadDbFromGcs();
try { getDb(); } catch (e) { console.warn("[persona-store] init deferred:", e.message); }

// persona-gcs의 upload 가드가 로컬 DB를 조회할 수 있도록 accessor 등록
_setDbAccessor(() => _db);
