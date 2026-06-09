// interview.js — AI 페르소나 1:1 인터뷰
// 입력: 국가 + 세그먼트 필터 + 사용자 질문
// 출력: 페르소나 인사이트 + 대화 응답

import { Router } from "express";
import { COUNTRIES } from "../data/countries.js";
import { DIMENSIONS } from "../data/dimensions.js";
import { chat, generateJSON, isGeminiAvailable } from "../adapters/gemini.js";
import { getCountryStats } from "../adapters/worldbank.js";
import {
  getCountryAdSpend, getKoreaMediaAdSpend,
  CHANNEL_SPEND_SHARE_2024, COUNTRY_ADSPEND_2024,
} from "../adapters/adspend-public.js";
import { CHANNELS, flattenMedia } from "../data/media-taxonomy.js";

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

  // 광고비·매체 컨텍스트 주입
  const adSpend = getCountryAdSpend(meta.code);
  const adSpendCtx = adSpend
    ? `- 연 광고비: $${adSpend.totalUSDB}B (공개 보고서: ${adSpend.source})`
    : `- 연 광고비: 공개 데이터 없음 (GDP 추정)`;
  // 상위 5 채널
  const topChannels = Object.entries(CHANNEL_SPEND_SHARE_2024)
    .sort((a, b) => b[1].share - a[1].share)
    .slice(0, 5)
    .map(([id, v]) => {
      const ch = CHANNELS.find(c => c.id === id);
      return `  • ${ch?.label || id}: ${(v.share * 100).toFixed(1)}% (추세: ${v.trend > 0 ? "↑" : "↓"} ${v.note})`;
    }).join("\n");
  // 국가별 매체 Top 5 (KR은 KOBACO 실결과, 다른 국가는 reach 기준)
  let topMediaCtx = "";
  if (meta.code === "KR") {
    const krMedia = Object.entries({
      "Naver 검색": getKoreaMediaAdSpend("search_naver"),
      "Google 검색": getKoreaMediaAdSpend("search_google"),
      "KakaoTalk": getKoreaMediaAdSpend("social_kakao"),
      "지상파 TV": getKoreaMediaAdSpend("tvv_terrestrial"),
      "YouTube": getKoreaMediaAdSpend("tvv_youtube"),
      "Instagram": getKoreaMediaAdSpend("social_instagram"),
      "Naver Blog": getKoreaMediaAdSpend("inf_naver_blog"),
    }).filter(([_, v]) => v).map(([k, v]) => `  • ${k}: ${v.krw}억원 ($${v.usd}M) [${v.source}]`).join("\n");
    topMediaCtx = `\n[한국 매체별 광고비 실결과 - KOBACO/제일기획]\n${krMedia}`;
  }

  const filterDesc = describeFilters(filters);
  const system = `당신은 광고 리서치 전문가입니다. 주어진 국가와 세그먼트 정보를 바탕으로 합성 페르소나를 생성합니다.
페르소나는 통계적으로 그럴듯한 가상의 인물이며, 실제 사람이 아닙니다.
JSON 스키마에 정확히 따르세요.`;

  const prompt = `[국가] ${meta.name} (${meta.nameEn})
[인구·지표]
- 인구: ${(ind.population?.value || 0).toLocaleString()}
- 1인당 GDP: $${Math.round(ind.gdpPerCapita?.value || 0).toLocaleString()}
- 인터넷 침투율: ${ind.internetUsers?.value?.toFixed(1) || "?"}%

[광고·미디어 시장 - 공개 보고서 기반]
${adSpendCtx}
[주요 채널 점유율 - GroupM TYNY/MAGNA 2024]
${topChannels}${topMediaCtx}

[세그먼트 필터]
${filterDesc || "(필터 없음 — 일반 시민 페르소나)"}

위 정보로 그럴듯한 합성 페르소나 1명을 생성하세요.
⚠️ 중요: 페르소나의 mediaHabits는 위 데이터의 실제 매체 점유율과 일치해야 합니다.
- 한국이면 Naver/KakaoTalk을 최상위 언급, Bing·VK·Weibo 등 제외
- 중국이면 Google·Instagram·YouTube 제외, WeChat·Weibo·Baidu 우선
- ${meta.name} 문화·관습에 맞는 이름·직업·라이프스타일을 사용
- 나이대별 대표 미디어 (Z세대=TikTok/인스타, M세대=YouTube/Naver, X세대=지상파/신문)`;

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

// POST /api/interview/influencer-match — 페르소나 → 적합 인플루언서 매체 매핑
interviewRouter.post("/influencer-match", async (req, res) => {
  const { persona, country = "KR" } = req.body || {};
  if (!persona || !persona.name) return res.status(400).json({ ok: false, error: "persona required" });
  const meta = COUNTRIES.find(c => c.code === String(country).toUpperCase());
  if (!meta) return res.status(400).json({ ok: false, error: "Unknown country" });

  // 규칙 기반 1차 매칭 (age → platform fit)
  const age = Number(persona.age) || 30;
  const gender = (persona.gender || "").toLowerCase();
  const occupation = (persona.occupation || "").toLowerCase();
  const matches = [];

  // 연령대별 플랫폼 적합도
  const ageBuckets = {
    young: age < 25,
    millennial: age >= 25 && age < 40,
    middle: age >= 40 && age < 55,
    senior: age >= 55,
  };

  // 인플루언서 매체별 fit 계산
  const influencerMedia = [
    { id: "inf_tiktok",     label: "TikTok 인플루언서",  ageScore: { young: 95, millennial: 70, middle: 30, senior: 10 } },
    { id: "inf_instagram",  label: "Instagram 인플루언서", ageScore: { young: 85, millennial: 90, middle: 55, senior: 25 } },
    { id: "inf_youtube",    label: "YouTube 인플루언서",   ageScore: { young: 90, millennial: 85, middle: 70, senior: 45 } },
    { id: "inf_twitch",     label: "Twitch 스트리머",       ageScore: { young: 80, millennial: 50, middle: 15, senior: 5 } },
    { id: "inf_pinterest",  label: "Pinterest Pinner",       ageScore: { young: 45, millennial: 70, middle: 60, senior: 35 } },
    { id: "inf_naver_blog", label: "Naver Blog (KR)",        ageScore: { young: 30, millennial: 75, middle: 80, senior: 60 }, countryFit: { KR: 1.5 } },
    { id: "inf_substack",   label: "Substack 뉴스레터",   ageScore: { young: 25, millennial: 65, middle: 70, senior: 50 } },
    { id: "inf_linkedin",   label: "LinkedIn Creator",       ageScore: { young: 25, millennial: 75, middle: 80, senior: 55 }, occBoost: ["마케팅", "영업", "관리", "director", "manager"] },
    { id: "inf_x_kol",      label: "X (Twitter) KOL",        ageScore: { young: 50, millennial: 65, middle: 50, senior: 30 } },
  ];

  for (const inf of influencerMedia) {
    // age 점수
    let score = 0;
    if (ageBuckets.young) score = inf.ageScore.young;
    else if (ageBuckets.millennial) score = inf.ageScore.millennial;
    else if (ageBuckets.middle) score = inf.ageScore.middle;
    else score = inf.ageScore.senior;

    // 국가 fit
    if (inf.countryFit?.[country]) score *= inf.countryFit[country];

    // 직업 부스트
    if (inf.occBoost && inf.occBoost.some(kw => occupation.includes(kw))) score += 15;

    // 국가 오버라이드 반영 (예: CN은 IG/YT 차단)
    if (country === "CN" && ["inf_youtube", "inf_instagram", "inf_twitch"].includes(inf.id)) score = 0;
    if (country === "RU" && inf.id === "inf_instagram") score *= 0.3;
    if (country !== "KR" && inf.id === "inf_naver_blog") score = 0;

    matches.push({ id: inf.id, label: inf.label, fitScore: Math.round(score) });
  }

  matches.sort((a, b) => b.fitScore - a.fitScore);
  const top = matches.slice(0, 5);

  // 추가 제안: 콘텐츠 주제
  const contentTopics = [];
  const interests = persona.values || [];
  if (interests.some(v => /건강|운동|피트니스/.test(v))) contentTopics.push("피트니스·웰빙");
  if (interests.some(v => /육아|자녀|육아·양육/.test(v))) contentTopics.push("육아·패런팅");
  if (interests.some(v => /패션|뉴트|스타일/.test(v))) contentTopics.push("패션·뉴트");
  if (interests.some(v => /아름다움|뷰티|디자인/.test(v))) contentTopics.push("뛷·뷰티");
  if (occupation.includes("마케팅") || occupation.includes("영업")) contentTopics.push("B2B·커리어");
  if (!contentTopics.length) contentTopics.push("라이프스타일 일반");

  res.json({
    ok: true,
    persona: { name: persona.name, age: persona.age },
    country: meta,
    topMatches: top,
    allMatches: matches,
    contentTopics,
    summary: `${persona.name}은 ${top.map(t => t.label).slice(0, 3).join(", ")} 순으로 적합도가 높으며, 주요 콘텐츠 주제는 ${contentTopics.slice(0, 3).join(", ")}입니다.`,
  });
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

  // 광고·미디어 컨텍스트
  const adSpend = getCountryAdSpend(meta.code);
  const adSpendCtx = adSpend ? `$${adSpend.totalUSDB}B/년 (${adSpend.source})` : "공개 데이터 없음";
  const topChannels = Object.entries(CHANNEL_SPEND_SHARE_2024)
    .sort((a, b) => b[1].share - a[1].share).slice(0, 5)
    .map(([id, v]) => `${CHANNELS.find(c => c.id === id)?.label || id} ${(v.share*100).toFixed(0)}%`).join(", ");

  const system = `당신은 광고 리서치 전문가입니다. 동일 세그먼트 안의 다양성 패널을 생성합니다.
각 패널은 같은 세그먼트에 속하지만, 가치관·라이프스타일·구매동기에서 서로 다른 관점을 제공해야 합니다.
JSON 스키마에 정확히 따르세요.`;

  const prompt = `[국가] ${meta.name} (${meta.nameEn})
[광고 시장] ${adSpendCtx}
[주요 채널 점유율] ${topChannels}
[세그먼트 필터]
${filterDesc || "(필터 없음)"}

위 세그먼트의 다양성을 보여주는 합성 패널 ${n}명을 생성하세요.
각 패널은 서로 다른 아키타입(예: 얼리 어답터·실용주의·고소득·면천혈·회의주의·장기적)을 가져야 합니다.
mediaHabits는 위 채널 점유율과 일치해야 하며, ${meta.name}에서 차단된 매체는 제외하세요.`;

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
