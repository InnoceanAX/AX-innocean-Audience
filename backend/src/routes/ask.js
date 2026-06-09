import { Router } from "express";
import { DIMENSIONS } from "../data/dimensions.js";
import { COUNTRIES } from "../data/countries.js";

export const askRouter = Router();

// POST /api/ask
// 입력: { question: "30대 워킹맘 미디어 소비 분석해줘" }
// 출력: { filters: {...}, country, intent, response }
// 룰 기반 키워드 매칭 — 추후 LLM 교체
askRouter.post("/", (req, res) => {
  const q = String(req.body?.question || "").trim();
  if (!q) return res.status(400).json({ ok: false, error: "question required" });

  const result = parseQuestion(q);
  res.json({
    ok: true,
    question: q,
    parsed: result,
    meta: {
      method: "rule-based-keyword (LLM 교체 예정)",
      ts: new Date().toISOString(),
    },
  });
});

function parseQuestion(q) {
  const lower = q.toLowerCase();
  const filters = {};
  let country = null;
  let intent = "general";

  // 국가 감지
  for (const c of COUNTRIES) {
    if (q.includes(c.name) || lower.includes(c.nameEn.toLowerCase())) {
      country = c.code;
      break;
    }
  }
  if (!country) country = "KR";

  // 연령
  const ageMap = { "10대": "10대", "20대": "20대", "30대": "30대", "40대": "40대", "50대": "50대", "60대": "60대 이상" };
  for (const [k, v] of Object.entries(ageMap)) {
    if (q.includes(k)) {
      filters.age = filters.age || [];
      if (!filters.age.includes(v)) filters.age.push(v);
    }
  }
  if (/z세대|gen z|젠지/i.test(q)) filters.age = ["20대"];
  if (/밀레니얼|millennial/i.test(q)) filters.age = filters.age || ["30대"];

  // 성별
  if (/여성|woman|workingmom|워킹맘|엄마|여자|female/i.test(q)) filters.gender = ["여성"];
  if (/남성|man|아빠|남자|male/i.test(q)) filters.gender = ["남성"];

  // 가구
  if (/워킹맘|엄마|육아|아이|자녀/i.test(q)) {
    filters.household = ["유자녀 가구"];
    filters.lifeStage = ["육아기"];
  }
  if (/싱글|1인|혼자|혼라이프/i.test(q)) filters.household = ["1인 가구"];

  // 가치관·관심사
  if (/친환경|esg|지속가능|sustain|eco/i.test(q)) {
    filters.values = ["환경·지속가능성"];
    filters.interests = filters.interests || [];
    if (!filters.interests.includes("환경·지속가능성")) filters.interests.push("환경·지속가능성");
  }
  if (/럭셔리|luxury|프리미엄|명품/i.test(q)) {
    filters.purchaseDriver = ["브랜드·이미지"];
  }
  if (/여행|travel|관광/i.test(q)) {
    filters.interests = filters.interests || [];
    filters.interests.push("여행");
  }
  if (/뷰티|beauty|화장품|패션|fashion/i.test(q)) {
    filters.interests = filters.interests || [];
    filters.interests.push("패션·뷰티");
  }
  if (/테크|gadget|tech|가젯/i.test(q)) {
    filters.interests = filters.interests || [];
    filters.interests.push("테크·가젯");
  }

  // 미디어
  if (/유튜브|youtube/i.test(q)) {
    filters.media = filters.media || [];
    filters.media.push("YouTube");
  }
  if (/틱톡|tiktok/i.test(q)) {
    filters.media = filters.media || [];
    filters.media.push("TikTok");
  }
  if (/인스타|instagram/i.test(q)) {
    filters.media = filters.media || [];
    filters.media.push("Instagram");
  }
  if (/ott|넷플릭스|디즈니/i.test(q)) {
    filters.media = filters.media || [];
    filters.media.push("TV·OTT");
  }

  // 디바이스
  if (/모바일|mobile|스마트폰/i.test(q)) {
    filters.device = ["모바일"];
  }

  // Intent
  if (/광고 효율|미디어 믹스|매체|광고/i.test(q)) intent = "media-strategy";
  else if (/경쟁|competitor|비교|vs/i.test(q)) intent = "competitive-insights";
  else if (/시장 진입|진출|entry/i.test(q)) intent = "market-entry";
  else if (/글로벌 비교|country|국가별/i.test(q)) intent = "global-comparison";
  else intent = "target-definition";

  // Dedup arrays
  for (const k of Object.keys(filters)) {
    if (Array.isArray(filters[k])) filters[k] = [...new Set(filters[k])];
  }

  return { country, filters, intent };
}
