// routes/trends.js — BigQuery 기반 + 보조 어댑터 디스패쳐
import express from "express";
import * as bqTrends from "../adapters/trends-bq.js";
import * as supTrends from "../adapters/trends-supplementary.js";
import * as baidu from "../adapters/trends-baidu.js";
import * as yandex from "../adapters/trends-yandex.js";
import * as talkwalker from "../adapters/trends-talkwalker.js";

export const trendsRouter = express.Router();

// GET /api/trends/daily?country=KR
// BigQuery → 지원 안 하면 보조 어댑터로 폴백
trendsRouter.get("/daily", async (req, res) => {
  try {
    const country = (req.query.country || "KR").toUpperCase();
    let data = await bqTrends.getDailyTopTerms(country);
    if (!data.supported) {
      const supAdapter = supTrends.getAdapterFor(country);
      if (supAdapter) {
        const supData = await supAdapter.getDailyTopTerms(country);
        data = { ...supData, fallback: "supplementary" };
      }
    }
    res.json({ ok: data.ok, ...data });
  } catch (e) {
    console.error("[trends/daily]", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// GET /api/trends/adapters — 어댑터 구현 상태 목록
trendsRouter.get("/adapters", (_req, res) => {
  res.json({
    ok: true,
    primary: {
      name: "BigQuery Google Trends",
      status: "active",
      countries: bqTrends.getSupportedCountryCodes(),
    },
    supplementary: [baidu.META, yandex.META, talkwalker.META],
  });
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
