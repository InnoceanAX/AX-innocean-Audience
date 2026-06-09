import { Router } from "express";
import { getDailyTrends } from "../adapters/trends.js";

export const trendsRouter = Router();

// GET /api/trends/daily?country=KR
trendsRouter.get("/daily", async (req, res) => {
  const country = String(req.query.country || "KR").toUpperCase();
  const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 10));
  const data = await getDailyTrends(country, limit);
  res.json(data);
});
