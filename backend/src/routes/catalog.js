import { Router } from "express";
import { COUNTRIES, REGIONS } from "../data/countries.js";
import { DIMENSIONS, DIMENSION_GROUPS } from "../data/dimensions.js";

export const catalogRouter = Router();

// GET /api/catalog — 솔루션 전체 메타 (Frontend 부팅 시 1회 호출)
catalogRouter.get("/", (_, res) => {
  res.json({
    ok: true,
    countries: COUNTRIES,
    regions: REGIONS,
    dimensions: DIMENSIONS,
    dimensionGroups: DIMENSION_GROUPS,
    suggestedPrompts: SUGGESTED_PROMPTS,
    categoryCarousel: CATEGORY_CAROUSEL,
    meta: {
      service: "INNOCEAN Audience",
      version: "0.1.0-shell",
      stage: "solution-shell",
    },
  });
});

const SUGGESTED_PROMPTS = [
  {
    category: "target-definition",
    text: "30대 워킹맘의 미디어 소비 행태와 광고 효율을 알려줘",
  },
  {
    category: "competitive-insights",
    text: "일본 Z세대가 한국 럭셔리 브랜드에 갖는 인식을 분석해줘",
  },
  {
    category: "media-strategy",
    text: "동남아 모바일 헤비 유저에게 도달하는 미디어 믹스는?",
  },
  {
    category: "global-comparison",
    text: "독일 친환경 가치관 소비자와 한국 비교해줘",
  },
];

const CATEGORY_CAROUSEL = [
  { id: "target-definition", label: "타겟 정의", icon: "target" },
  { id: "competitive-insights", label: "경쟁 인사이트", icon: "compass" },
  { id: "media-strategy", label: "미디어 전략", icon: "broadcast" },
  { id: "market-entry", label: "시장 진입", icon: "globe" },
  { id: "global-comparison", label: "글로벌 비교", icon: "scale" },
];
