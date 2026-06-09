import { Router } from "express";
import { DIMENSIONS, DIMENSION_GROUPS } from "../data/dimensions.js";

export const dimensionsRouter = Router();

// GET /api/dimensions — 18 디멘션 + 그룹
dimensionsRouter.get("/", (req, res) => {
  const { group } = req.query;
  let list = DIMENSIONS;
  if (group) list = list.filter(d => d.group === group);

  res.json({
    ok: true,
    total: list.length,
    groups: DIMENSION_GROUPS,
    dimensions: list,
  });
});

// GET /api/dimensions/:id — 단일 디멘션
dimensionsRouter.get("/:id", (req, res) => {
  const dim = DIMENSIONS.find(d => d.id === req.params.id);
  if (!dim) {
    return res.status(404).json({ ok: false, error: `Dimension ${req.params.id} not found` });
  }
  res.json({ ok: true, dimension: dim });
});
