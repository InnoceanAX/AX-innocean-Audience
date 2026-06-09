import { Router } from "express";
import { getCountryStats, getCountryStatsBatch } from "../adapters/worldbank.js";

export const stratRouter = Router();

// GET /api/stratify/country?codes=KR,JP,US
// 여러 국가의 World Bank 지표 (인구·GDP·인터넷·도시화 등) 한 번에
stratRouter.get("/country", async (req, res) => {
  const raw = String(req.query.codes || "KR");
  const codes = raw.split(",").map(c => c.trim().toUpperCase()).filter(Boolean).slice(0, 10);
  const data = await getCountryStatsBatch(codes);
  res.json({ ok: true, countries: data });
});

// GET /api/stratify/country/:code — 단일 국가
stratRouter.get("/country/:code", async (req, res) => {
  const code = String(req.params.code).toUpperCase();
  const data = await getCountryStats(code);
  if (!data) return res.status(404).json({ ok: false, error: `Country ${code} not supported` });
  res.json({ ok: true, ...data });
});
