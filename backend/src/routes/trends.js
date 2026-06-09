// routes/trends.js — BigQuery 기반 (엔터프라이즈급, 안정)
import express from "express";
import * as bqTrends from "../adapters/trends-bq.js";

export const trendsRouter = express.Router();

// GET /api/trends/daily?country=KR
trendsRouter.get("/daily", async (req, res) => {
  try {
    const country = (req.query.country || "KR").toUpperCase();
    const data = await bqTrends.getDailyTopTerms(country);
    res.json({ ok: data.ok, ...data });
  } catch (e) {
    console.error("[trends/daily]", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// GET /api/trends/regions?country=KR
trendsRouter.get("/regions", async (req, res) => {
  try {
    const country = (req.query.country || "KR").toUpperCase();
    const data = await bqTrends.getRegionalBreakdown(country);
    res.json({ ok: data.ok, ...data });
  } catch (e) {
    console.error("[trends/regions]", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// GET /api/trends/supported-countries
trendsRouter.get("/supported-countries", (_req, res) => {
  res.json({
    ok: true,
    source: "Google Trends BigQuery Public Dataset",
    table:
      "bigquery-public-data.google_trends.international_top_terms (+top_terms for US)",
    countries: bqTrends.getSupportedCountryCodes(),
    total: bqTrends.getSupportedCountryCodes().length,
  });
});

// GET /api/trends/health
trendsRouter.get("/health", async (_req, res) => {
  const h = await bqTrends.health();
  res.json(h);
});
