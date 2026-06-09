import { Router } from "express";

export const libraryRouter = Router();

// 임시 인메모리 스토어 — 추후 Firestore/PostgreSQL로 교체
// 데이터 스키마: { id, name, country, filters, owner, createdAt, updatedAt, favorited, tags }
const store = new Map();

function newId() {
  return "tgt_" + Math.random().toString(36).slice(2, 10);
}

// GET /api/library — 전체 (Frontend는 owner=anon 또는 사용자 ID로 필터)
libraryRouter.get("/", (req, res) => {
  const { owner = "anon", favorited } = req.query;
  let items = [...store.values()].filter(t => t.owner === owner);
  if (favorited === "true") items = items.filter(t => t.favorited);
  items.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json({ ok: true, total: items.length, targets: items });
});

// POST /api/library — 새 타겟 저장
libraryRouter.post("/", (req, res) => {
  const { name, country, filters, owner = "anon", tags = [] } = req.body || {};
  if (!name) return res.status(400).json({ ok: false, error: "name required" });
  const id = newId();
  const now = new Date().toISOString();
  const target = {
    id, name,
    country: country || "KR",
    filters: filters || {},
    owner, tags,
    favorited: false,
    createdAt: now, updatedAt: now,
  };
  store.set(id, target);
  res.json({ ok: true, target });
});

// GET /api/library/:id
libraryRouter.get("/:id", (req, res) => {
  const t = store.get(req.params.id);
  if (!t) return res.status(404).json({ ok: false, error: "not found" });
  res.json({ ok: true, target: t });
});

// PATCH /api/library/:id
libraryRouter.patch("/:id", (req, res) => {
  const t = store.get(req.params.id);
  if (!t) return res.status(404).json({ ok: false, error: "not found" });
  const allowed = ["name", "country", "filters", "tags", "favorited"];
  for (const k of allowed) {
    if (k in req.body) t[k] = req.body[k];
  }
  t.updatedAt = new Date().toISOString();
  store.set(t.id, t);
  res.json({ ok: true, target: t });
});

// DELETE /api/library/:id
libraryRouter.delete("/:id", (req, res) => {
  if (!store.has(req.params.id)) return res.status(404).json({ ok: false, error: "not found" });
  store.delete(req.params.id);
  res.json({ ok: true });
});
