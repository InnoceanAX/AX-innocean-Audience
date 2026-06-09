// ask.js — 자연어 질의 → 필터/인사이트 변환
// 1순위: Gemini Vertex AI (있으면 사용)
// 2순위: 룰 기반 키워드 매칭 (Gemini 실패 시 자동 fallback)

import { Router } from "express";
import { DIMENSIONS } from "../data/dimensions.js";
import { COUNTRIES } from "../data/countries.js";
import { generateJSON, isGeminiAvailable } from "../adapters/gemini.js";

export const askRouter = Router();

// POST /api/ask
askRouter.post("/", async (req, res) => {
  const q = String(req.body?.question || "").trim();
  if (!q) return res.status(400).json({ ok: false, error: "question required" });

  // 1순위: LLM 시도
  if (isGeminiAvailable() && process.env.ASK_USE_LLM !== "0") {
    try {
      const llmResult = await parseWithLLM(q);
      if (llmResult) {
        return res.json({
          ok: true,
          question: q,
          parsed: llmResult,
          meta: { method: "gemini-2.5-flash", ts: new Date().toISOString() },
        });
      }
    } catch (e) {
      console.warn("[ask] LLM failed, fallback to rules:", e.message);
    }
  }

  // 2순위: 룰 기반
  const result = parseWithRules(q);
  res.json({
    ok: true,
    question: q,
    parsed: result,
    meta: { method: "rule-based-keyword (fallback)", ts: new Date().toISOString() },
  });
});

// ========== LLM 파싱 ==========
async function parseWithLLM(q) {
  const validCountries = COUNTRIES.map(c => c.code).join(", ");
  const dimDescriptors = DIMENSIONS.map(d => {
    const opts = d.options.map(o => typeof o === "string" ? o : o.label).join(" | ");
    return `- ${d.id} (${d.label}): ${opts}`;
  }).join("\n");

  const system = `당신은 INNOCEAN 광고대행사의 오디언스 분석 솔루션의 NL 파서입니다.
사용자의 자연어 질의를 받아 정확한 필터/국가/의도(intent)를 추출합니다.
반드시 JSON 스키마에 맞춰 응답하세요.

[사용 가능한 국가 코드]
${validCountries}

[사용 가능한 디멘션과 옵션]
${dimDescriptors}

[Intent 종류]
- target-definition: 타겟 정의·세그먼트 분석
- media-strategy: 매체 믹스·광고 전략
- competitive-insights: 경쟁사 비교·시장 포지셔닝
- market-entry: 신규 시장 진입
- global-comparison: 국가별 비교
- persona-deep-dive: 페르소나 심층 분석
- general: 일반 질문

규칙:
- filters의 키는 디멘션 id만 (age, gender, income 등)
- filters의 값은 해당 디멘션의 옵션 라벨과 정확히 일치
- 모호하면 빈 배열·빈 객체 반환
- 추론한 근거를 reasoning 필드에 1-2문장 한국어로 작성`;

  const schema = {
    type: "object",
    properties: {
      country: { type: "string", description: "ISO 3166-1 alpha-2 국가 코드" },
      filters: { type: "object" },
      intent: { type: "string" },
      reasoning: { type: "string" },
      summary: { type: "string", description: "사용자에게 보여줄 짧은 요약 (1-2 문장)" },
    },
    required: ["country", "filters", "intent", "summary"],
  };

  const result = await generateJSON({
    prompt: `질의: "${q}"\n\n위 질의를 JSON으로 파싱하세요.`,
    system,
    schema,
    temperature: 0.2,
  });

  if (!result.json) return null;

  // 국가 코드 검증
  const validCodes = new Set(COUNTRIES.map(c => c.code));
  if (!validCodes.has(result.json.country)) result.json.country = "KR";

  // 필터 검증 (잘못된 디멘션·옵션 제거)
  const validDims = {};
  for (const d of DIMENSIONS) {
    validDims[d.id] = new Set(d.options.map(o => typeof o === "string" ? o : o.label));
  }
  const cleanedFilters = {};
  for (const [key, vals] of Object.entries(result.json.filters || {})) {
    if (!validDims[key]) continue;
    if (!Array.isArray(vals)) continue;
    const filtered = vals.filter(v => validDims[key].has(v));
    if (filtered.length) cleanedFilters[key] = filtered;
  }
  result.json.filters = cleanedFilters;
  return result.json;
}

// ========== 룰 기반 fallback ==========
function parseWithRules(q) {
  const lower = q.toLowerCase();
  const filters = {};
  let country = null;
  let intent = "general";

  for (const c of COUNTRIES) {
    if (q.includes(c.name) || lower.includes(c.nameEn.toLowerCase())) {
      country = c.code;
      break;
    }
  }
  if (!country) country = "KR";

  const ageMap = { "10대": "10대", "20대": "20대", "30대": "30대", "40대": "40대", "50대": "50대", "60대": "60대 이상" };
  for (const [k, v] of Object.entries(ageMap)) {
    if (q.includes(k)) (filters.age = filters.age || []).push(v);
  }
  if (/z세대|gen z|젠지/i.test(q)) filters.age = ["20대"];
  if (/밀레니얼|millennial/i.test(q)) filters.age = filters.age || ["30대"];
  if (/여성|woman|workingmom|워킹맘|엄마|여자|female/i.test(q)) filters.gender = ["여성"];
  if (/남성|man|아빠|남자|male/i.test(q)) filters.gender = ["남성"];
  if (/워킹맘|엄마|육아|아이|자녀/i.test(q)) { filters.household = ["유자녀 가구"]; }
  if (/싱글|1인|혼자/i.test(q)) filters.household = ["1인 가구"];

  if (/광고 효율|미디어 믹스|매체/i.test(q)) intent = "media-strategy";
  else if (/경쟁|competitor|비교|vs/i.test(q)) intent = "competitive-insights";
  else if (/시장 진입|진출/i.test(q)) intent = "market-entry";
  else if (/국가별/i.test(q)) intent = "global-comparison";
  else intent = "target-definition";

  for (const k of Object.keys(filters)) {
    if (Array.isArray(filters[k])) filters[k] = [...new Set(filters[k])];
  }

  return {
    country, filters, intent,
    summary: `'${q}' 질의를 ${COUNTRIES.find(c => c.code === country)?.name} 기준으로 해석했습니다.`,
    reasoning: "키워드 매칭 기반",
  };
}
