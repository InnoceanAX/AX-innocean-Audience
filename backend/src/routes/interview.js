// interview.js — AI 페르소나 1:1 인터뷰
// 입력: 국가 + 세그먼트 필터 + 사용자 질문
// 출력: 페르소나 인사이트 + 대화 응답

import { Router } from "express";
import { COUNTRIES } from "../data/countries.js";
import { DIMENSIONS } from "../data/dimensions.js";
import { chat, generateJSON, isGeminiAvailable } from "../adapters/gemini.js";
import { getCountryStats } from "../adapters/worldbank.js";

export const interviewRouter = Router();

// POST /api/interview/persona  — 페르소나 카드 생성
interviewRouter.post("/persona", async (req, res) => {
  const { country = "KR", filters = {} } = req.body || {};
  const meta = COUNTRIES.find(c => c.code === String(country).toUpperCase());
  if (!meta) return res.status(400).json({ ok: false, error: "Unknown country" });

  if (!isGeminiAvailable()) {
    return res.json({
      ok: true,
      persona: fallbackPersona(meta, filters),
      meta: { method: "fallback (LLM unavailable)" },
    });
  }

  const wb = await getCountryStats(meta.code);
  const ind = wb?.indicators || {};

  const filterDesc = describeFilters(filters);
  const system = `당신은 광고 리서치 전문가입니다. 주어진 국가와 세그먼트 정보를 바탕으로 합성 페르소나를 생성합니다.
페르소나는 통계적으로 그럴듯한 가상의 인물이며, 실제 사람이 아닙니다.
JSON 스키마에 정확히 따르세요.`;

  const prompt = `[국가] ${meta.name} (${meta.nameEn})
[인구·지표]
- 인구: ${(ind.population?.value || 0).toLocaleString()}
- 1인당 GDP: $${Math.round(ind.gdpPerCapita?.value || 0).toLocaleString()}
- 인터넷 침투율: ${ind.internetUsers?.value?.toFixed(1) || "?"}%

[세그먼트 필터]
${filterDesc || "(필터 없음 — 일반 시민 페르소나)"}

위 정보로 그럴듯한 합성 페르소나 1명을 생성하세요. ${meta.name} 문화·관습에 맞는 이름·직업·라이프스타일을 사용.`;

  const schema = {
    type: "object",
    properties: {
      name: { type: "string" },
      age: { type: "number" },
      gender: { type: "string" },
      occupation: { type: "string" },
      lifestyle: { type: "string" },
      values: { type: "array", items: { type: "string" } },
      mediaHabits: { type: "array", items: { type: "string" } },
      purchaseDrivers: { type: "array", items: { type: "string" } },
      painPoints: { type: "array", items: { type: "string" } },
      quote: { type: "string", description: "이 페르소나가 말할 법한 짧은 인용구" },
    },
    required: ["name", "age", "occupation", "lifestyle", "quote"],
  };

  try {
    const result = await generateJSON({ prompt, system, schema, model: "gemini-2.5-flash", temperature: 0.8 });
    if (!result.json) throw new Error("JSON parse failed");
    res.json({
      ok: true,
      country: meta,
      persona: result.json,
      meta: { method: "gemini-2.5-flash", ts: new Date().toISOString() },
    });
  } catch (e) {
    res.json({
      ok: true,
      country: meta,
      persona: fallbackPersona(meta, filters),
      meta: { method: "fallback", error: e.message },
    });
  }
});

// POST /api/interview/panel  — 동일 세그먼트 안 다양성 패널 (3-5명)
interviewRouter.post("/panel", async (req, res) => {
  const { country = "KR", filters = {}, count = 4 } = req.body || {};
  const meta = COUNTRIES.find(c => c.code === String(country).toUpperCase());
  if (!meta) return res.status(400).json({ ok: false, error: "Unknown country" });
  const n = Math.min(5, Math.max(2, Number(count) || 4));

  if (!isGeminiAvailable()) {
    return res.json({
      ok: true,
      country: meta,
      panel: Array.from({ length: n }, () => fallbackPersona(meta, filters)),
      meta: { method: "fallback" },
    });
  }

  const wb = await getCountryStats(meta.code);
  const ind = wb?.indicators || {};
  const filterDesc = describeFilters(filters);

  const system = `당신은 광고 리서치 전문가입니다. 동일 세그먼트 안의 다양성 패널을 생성합니다.
각 패널은 같은 세그먼트에 속하지만, 가치관·라이프스타일·구매동기에서 서로 다른 관점을 제공해야 합니다.
JSON 스키마에 정확히 따르세요.`;

  const prompt = `[국가] ${meta.name} (${meta.nameEn})
[세그먼트 필터]
${filterDesc || "(필터 없음)"}

위 세그먼트의 다양성을 보여주는 합성 패널 ${n}명을 생성하세요.
각 패널은 서로 다른 아키타입(예: 얼리 어답터·실용주의·고소득·면천혈·회의주의·장기적)을 가져야 합니다.`;

  const personaSchema = {
    type: "object",
    properties: {
      name: { type: "string" },
      age: { type: "number" },
      gender: { type: "string" },
      occupation: { type: "string" },
      archetype: { type: "string", description: "이 패널의 아키타입 레이블 (예: 장기적 양육·실용주의)" },
      lifestyle: { type: "string" },
      values: { type: "array", items: { type: "string" } },
      mediaHabits: { type: "array", items: { type: "string" } },
      purchaseDrivers: { type: "array", items: { type: "string" } },
      painPoints: { type: "array", items: { type: "string" } },
      quote: { type: "string" },
    },
    required: ["name", "age", "archetype", "quote"],
  };
  const schema = {
    type: "object",
    properties: {
      panel: { type: "array", items: personaSchema },
      contrastInsight: { type: "string", description: "패널들 간 핵심 차이·공통점 요약 2-3문장" },
    },
    required: ["panel"],
  };

  try {
    const result = await generateJSON({ prompt, system, schema, model: "gemini-2.5-flash", temperature: 0.9 });
    if (!result.json?.panel) throw new Error("panel parse failed");
    res.json({
      ok: true,
      country: meta,
      panel: result.json.panel,
      contrastInsight: result.json.contrastInsight || null,
      meta: { method: "gemini-2.5-flash", count: result.json.panel.length },
    });
  } catch (e) {
    res.json({
      ok: true,
      country: meta,
      panel: Array.from({ length: n }, () => fallbackPersona(meta, filters)),
      meta: { method: "fallback", error: e.message },
    });
  }
});

// POST /api/interview/chat  — 페르소나와 대화
interviewRouter.post("/chat", async (req, res) => {
  const { persona, history = [], userMessage } = req.body || {};
  if (!persona || !userMessage) return res.status(400).json({ ok: false, error: "persona and userMessage required" });

  if (!isGeminiAvailable()) {
    return res.json({
      ok: true,
      reply: `(${persona.name})입니다. AI 인터뷰 기능이 현재 환경에서 사용 불가합니다.`,
      meta: { method: "fallback" },
    });
  }

  const system = `당신은 합성 페르소나 "${persona.name}"의 역할을 연기합니다.
- 나이: ${persona.age}
- 직업: ${persona.occupation}
- 라이프스타일: ${persona.lifestyle}
- 가치관: ${(persona.values || []).join(", ")}
- 미디어 습관: ${(persona.mediaHabits || []).join(", ")}
- 구매 동기: ${(persona.purchaseDrivers || []).join(", ")}
- 페인포인트: ${(persona.painPoints || []).join(", ")}

광고대행사 리서처가 인터뷰하는 상황입니다. ${persona.name}의 페르소나 입장에서 솔직하게 답하세요.
한국어로 자연스럽게, 1-3문장으로 답변. 답변 끝에 답변자 이름을 표시하지 마세요.`;

  try {
    const messages = [
      ...history.slice(-10),  // 최근 10개만 컨텍스트에 포함
      { role: "user", content: userMessage },
    ];
    const result = await chat({ messages, system, temperature: 0.8 });
    res.json({
      ok: true,
      reply: result.text,
      meta: { method: result.model, ts: new Date().toISOString() },
    });
  } catch (e) {
    res.json({
      ok: false,
      error: e.message,
    });
  }
});

// ===== Helpers =====
function describeFilters(filters) {
  const parts = [];
  for (const [k, v] of Object.entries(filters || {})) {
    const dim = DIMENSIONS.find(d => d.id === k);
    if (!dim || !Array.isArray(v) || !v.length) continue;
    parts.push(`- ${dim.label}: ${v.join(", ")}`);
  }
  return parts.join("\n");
}

function fallbackPersona(country, filters) {
  const ageOpt = filters.age?.[0] || "30대";
  const genderOpt = filters.gender?.[0] || "여성";
  return {
    name: country.code === "KR" ? "김민지" : (country.code === "JP" ? "Sato Hana" : "Persona One"),
    age: parseInt(ageOpt) || 32,
    gender: genderOpt,
    occupation: "마케팅 매니저",
    lifestyle: `${country.name} ${ageOpt} ${genderOpt}의 평균적인 일상`,
    values: ["워라밸", "지속가능성"],
    mediaHabits: ["YouTube", "Instagram", "Netflix"],
    purchaseDrivers: ["가성비", "리뷰"],
    painPoints: ["광고 피로", "정보 과잉"],
    quote: "광고가 너무 많아 진짜 정보를 찾기 어려워요.",
  };
}
