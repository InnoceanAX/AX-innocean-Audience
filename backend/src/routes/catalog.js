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
    text: "30대 한국 워킹맘의 라이프스타일과 가치관은?",
  },
  {
    category: "persona-deep-dive",
    text: "일본 Z세대 한류 팬의 일상·관심사·소비 성향은?",
  },
  {
    category: "interest-insight",
    text: "동남아 모바일 헤비 유저의 콘텐츠·취미 성향은?",
  },
  {
    category: "global-comparison",
    text: "독일 친환경 소비자와 한국 소비자 가치관 비교",
  },
];

const CATEGORY_CAROUSEL = [
  { id: "target-definition", label: "타겟 정의", icon: "target" },
  { id: "persona-deep-dive", label: "페르소나 심층", icon: "compass" },
  { id: "interest-insight", label: "관심사·취미", icon: "broadcast" },
  { id: "global-comparison", label: "글로벌 비교", icon: "scale" },
  { id: "lifestyle-insight", label: "라이프스타일", icon: "globe" },
];
