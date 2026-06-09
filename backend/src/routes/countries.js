import { Router } from "express";
import { COUNTRIES, REGIONS } from "../data/countries.js";

export const countriesRouter = Router();

// GET /api/countries — 전체 국가 + 권역
countriesRouter.get("/", (req, res) => {
  const { region } = req.query;
  let list = COUNTRIES;
  if (region) list = list.filter(c => c.region === region);

  res.json({
    ok: true,
    total: list.length,
    regions: REGIONS,
    countries: list,
  });
});

// GET /api/countries/:code — 단일 국가
countriesRouter.get("/:code", (req, res) => {
  const code = String(req.params.code).toUpperCase();
  const country = COUNTRIES.find(c => c.code === code);
  if (!country) {
    return res.status(404).json({ ok: false, error: `Country ${code} not found` });
  }
  res.json({ ok: true, country });
});
