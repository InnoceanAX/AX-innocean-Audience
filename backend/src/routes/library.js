// library.js — 사용자 저장 타겟 라이브러리 (SQLite 영속화)
// 2026-06-26 (CEO 승인 Critical fix): new Map() 휘발 → SQLite 영속화.
//   - persona-store.js 와 동일 DB(audience-personas.db) 사용
//   - 같은 GCS 영속 파이프(scheduleDbUpload) 자동 반영
//   - 기존 라우트 API 호환 유지(GET/POST/GET:id/PATCH/DELETE)
//   - try/catch 보강 + 입력 검증

import { Router } from "express";
import { getDb } from "../lib/persona-store.js";
import { scheduleDbUpload } from "../lib/persona-gcs.js";

export const libraryRouter = Router();

// ───────────────────────────────────────────────────────────────────────
// Schema bootstrap (idempotent)
//   - persona-store.js 와 같은 DB. 테이블만 추가.
//   - 영속 컬럼은 store API 와 일관된 unixepoch 정수.
// ───────────────────────────────────────────────────────────────────────
let _schemaReady = false;
function ensureSchema() {
  if (_schemaReady) return;
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS library_items (
      id TEXT PRIMARY KEY,
      owner TEXT NOT NULL DEFAULT 'anon',
      name TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT 'KR',
      filters TEXT,
      tags TEXT,
      favorited INTEGER NOT NULL DEFAULT 0,
      recent INTEGER NOT NULL DEFAULT 0,
      saved INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE INDEX IF NOT EXISTS idx_library_owner ON library_items(owner);
    CREATE INDEX IF NOT EXISTS idx_library_updated ON library_items(updated_at DESC);
  `);
  _schemaReady = true;
}

function newId() {
  return "tgt_" + Math.random().toString(36).slice(2, 10);
}

function parseJsonOrNull(s) {
  if (s == null) return null;
  try { return JSON.parse(s); } catch { return null; }
}

function jsonOrNull(v) {
  if (v == null) return null;
  try { return JSON.stringify(v); } catch { return null; }
}

function rowToTarget(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    country: row.country || "KR",
    filters: parseJsonOrNull(row.filters) || {},
    owner: row.owner || "anon",
    tags: parseJsonOrNull(row.tags) || [],
    favorited: !!row.favorited,
    recent: !!row.recent,
    saved: !!row.saved,
    createdAt: row.created_at ? new Date(row.created_at * 1000).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at * 1000).toISOString() : null,
  };
}

// GET /api/library — 전체(owner 기준)
libraryRouter.get("/", (req, res) => {
  try {
    ensureSchema();
    const { owner = "anon", favorited, recent, saved, limit } = req.query;
    const conds = ["owner = ?"];
    const params = [String(owner)];
    if (favorited === "true") { conds.push("favorited = 1"); }
    if (recent === "true") { conds.push("recent = 1"); }
    if (saved === "true") { conds.push("saved = 1"); }
    let sql = `SELECT * FROM library_items WHERE ${conds.join(" AND ")} ORDER BY updated_at DESC`;
    const lim = parseInt(limit, 10);
    if (lim > 0) { sql += " LIMIT ?"; params.push(lim); }
    const rows = getDb().prepare(sql).all(...params);
    const items = rows.map(rowToTarget);
    res.json({ ok: true, total: items.length, targets: items });
  } catch (e) {
    console.error("[library GET /]", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/library — 새 타겟 저장
libraryRouter.post("/", (req, res) => {
  try {
    ensureSchema();
    const { name, country, filters, owner = "anon", tags = [] } = req.body || {};
    if (!name || typeof name !== "string") {
      return res.status(400).json({ ok: false, error: "name required" });
    }
    const id = newId();
    const favorited = req.body?.favorited === true ? 1 : 0;
    const recent = req.body?.recent === true ? 1 : 0;
    const saved = req.body?.saved === true ? 1 : 0;
    getDb().prepare(`
      INSERT INTO library_items
        (id, owner, name, country, filters, tags, favorited, recent, saved, created_at, updated_at)
      VALUES (@id, @owner, @name, @country, @filters, @tags, @favorited, @recent, @saved, unixepoch(), unixepoch())
    `).run({
      id,
      owner: String(owner || "anon"),
      name: String(name),
      country: String(country || "KR"),
      filters: jsonOrNull(filters || {}),
      tags: jsonOrNull(Array.isArray(tags) ? tags : []),
      favorited, recent, saved,
    });
    scheduleDbUpload();
    const row = getDb().prepare("SELECT * FROM library_items WHERE id = ?").get(id);
    res.json({ ok: true, target: rowToTarget(row) });
  } catch (e) {
    console.error("[library POST /]", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// GET /api/library/:id
libraryRouter.get("/:id", (req, res) => {
  try {
    ensureSchema();
    const row = getDb().prepare("SELECT * FROM library_items WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ ok: false, error: "not found" });
    res.json({ ok: true, target: rowToTarget(row) });
  } catch (e) {
    console.error("[library GET /:id]", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// PATCH /api/library/:id
libraryRouter.patch("/:id", (req, res) => {
  try {
    ensureSchema();
    const db = getDb();
    const row = db.prepare("SELECT * FROM library_items WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ ok: false, error: "not found" });

    const sets = [];
    const params = {};
    const body = req.body || {};
    if ("name" in body && typeof body.name === "string") { sets.push("name = @name"); params.name = body.name; }
    if ("country" in body && typeof body.country === "string") { sets.push("country = @country"); params.country = body.country; }
    if ("filters" in body) { sets.push("filters = @filters"); params.filters = jsonOrNull(body.filters || {}); }
    if ("tags" in body) { sets.push("tags = @tags"); params.tags = jsonOrNull(Array.isArray(body.tags) ? body.tags : []); }
    if ("favorited" in body) { sets.push("favorited = @favorited"); params.favorited = body.favorited ? 1 : 0; }
    if ("recent" in body) { sets.push("recent = @recent"); params.recent = body.recent ? 1 : 0; }
    if ("saved" in body) { sets.push("saved = @saved"); params.saved = body.saved ? 1 : 0; }

    if (sets.length === 0) {
      return res.json({ ok: true, target: rowToTarget(row) });
    }
    sets.push("updated_at = unixepoch()");
    params.id = req.params.id;
    db.prepare(`UPDATE library_items SET ${sets.join(", ")} WHERE id = @id`).run(params);
    scheduleDbUpload();
    const updated = db.prepare("SELECT * FROM library_items WHERE id = ?").get(req.params.id);
    res.json({ ok: true, target: rowToTarget(updated) });
  } catch (e) {
    console.error("[library PATCH /:id]", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// DELETE /api/library/:id
libraryRouter.delete("/:id", (req, res) => {
  try {
    ensureSchema();
    const r = getDb().prepare("DELETE FROM library_items WHERE id = ?").run(req.params.id);
    if (r.changes === 0) return res.status(404).json({ ok: false, error: "not found" });
    scheduleDbUpload();
    res.json({ ok: true });
  } catch (e) {
    console.error("[library DELETE /:id]", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});
