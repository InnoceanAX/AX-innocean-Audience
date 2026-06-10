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
JSON 스키마에 정확히 따르세요.

[언어 규칙 - 절대 준수]
모든 텍스트 필드(name, gender, occupation, lifestyle, values, mediaHabits, purchaseDrivers, painPoints, quote)는 **반드시 한국어로 작성**합니다.
- 국가가 일본·중국·미국·기타 어디이든 무관하게 한국어 서술.
- 이름은 해당 나라의 이름을 **한글 표기**로만 쓵니다. 로마자/영문/원어 표기 절대 금지.
  - 일본 페르소나 예시: "사토 아이" (X: "Sato Ai", "Sato Hana", "佐藤 あい")
  - 중국 페르소나 예시: "왕 레이" (X: "Wang Lei", "王雷")
  - 미국 페르소나 예시: "제이콩 스미스" (X: "Jacob Smith")
  - 프랑스 페르소나 예시: "소피 르뷑" (X: "Sophie Lefebvre")
  - **occupation 필드도 동일**: "마케팅 매니저", "프리랜서 디자이너" 등 한국어로.
- 구체 명사(브랜드/플랫폼/미디어명)는 원이름 영문 그대로 쓸 수 있으나 설명·서술은 한국어로만.
- 일본어(ひらがな/カタカナ/漢字 단독)·중국어(간체자)·기타 현지어는 절대 사용 금지.
- quote(인용구)도 한국어로 작성합니다 (현지인이 말하는 느낌을 한국어로).`;

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
- 나이대별 대표 미디어 (Z세대=TikTok/인스타, M세대=YouTube/Naver, X세대=지상파/신문)

[narratives 작성 지침 - 핵심]
values/mediaHabits/purchaseDrivers/painPoints는 짧은 키워드 나열이면 됩니다.
narratives 객체의 다섯 필드(who/life/mind/love/buy)는 별도로 **자연스러운 단락형 서술**로 작성합니다.
- 각 필드 3-4문장 이상
- 마치 리서치 보고서의 페르소나 프로필 설명처럼 자연스러운 문장
- 구체적 맥락, 숨겨진 동기, 일상의 장면 포함
- "키워드, 키워드" 형식 금지. 완전한 문장 단락.
- 예시(who): "30대 중반의 다나카씨는 도쿄 세타가야의 소규모 디자인 에이전시에서 일하며, 결혼 후 철원에서 세다가야로 이사하며 통근 시간이 대폭 늘어난 것이 최근 일상의 가장 큰 변화다. 연소득은 약 600만엔으로 일본 평균보다 높은 편이지만, 도쿄 도심의 높은 물가를 고려하면 여유로운 수준은 아니다."`;

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
      narratives: {
        type: "object",
        description: "5차원 심층 서술 — 각각 3–4문장 이상, 이 페르소나의 구체적 행동/맥락/이야기로. 단순 키워드 나열이 아닌 항상 여러 문장의 단락형 서술.",
        properties: {
          who: { type: "string", description: "인물상 — 연령/성별/소득/가족/거주 맥락을 포함한 3–4문장의 자연스러운 서술" },
          life: { type: "string", description: "라이프스타일 — 하루 패턴, 주말, 일터이먼트, 제품 사용 스타일 3–4문장" },
          mind: { type: "string", description: "가치관/심리 — 이 사람이 마음속으로 로 중요하게 여기는 것, 세상을 보는 태도, 브랜드/매체를 받아들이는 테도 3–4문장" },
          love: { type: "string", description: "관심사 — 좋아하는 은 콘텐츠·세럽·브랜드·취미, 수집하고 싶은 것, 따라하고 싶은 결합 패턴 3–4문장" },
          buy: { type: "string", description: "구매 — 사는 이유, 채널(온/오프), 고민 시간, 가격 민감도, 특정 카테고리에서의 행동 3–4문장" },
        },
        required: ["who", "life", "mind", "love", "buy"],
      },
    },
    required: ["name", "age", "occupation", "lifestyle", "quote", "narratives"],
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

// ============================================================
// POST /api/interview/journey  — 페르소나의 "하루의 미디어 여정"
// 입력: 페르소나 정보
// 출력: 시간대별 타임라인 (일어남 → 출근 → 업무 → 점심 → 퇴근 → 취침 전)
// ============================================================
interviewRouter.post("/journey", async (req, res) => {
  const { persona, country = "KR" } = req.body || {};
  if (!persona || !persona.name) return res.status(400).json({ ok: false, error: "persona required" });
  const meta = COUNTRIES.find(c => c.code === String(country).toUpperCase());
  if (!meta) return res.status(400).json({ ok: false, error: "Unknown country" });

  if (!isGeminiAvailable()) {
    return res.json({ ok: true, journey: fallbackJourney(persona, meta), meta: { method: "fallback" } });
  }

  // 국가별 차단 매체 안내
  const blockedMedia = blockedMediaForCountry(country);
  const system = `당신은 광고 리서치 전문가입니다. 페르소나의 하루 일과 안 미디어·접점 여정을 구체적으로 생성합니다.
시간대별로 이 페르소나가 실제로 어떤 매체를 어떻게 쓰는지 시나리오화하세요.
구체적 행동, 어떤 콘텐츠를 소비하는지, 주의 국가 매체 레퍼런스 (Naver·KakaoTalk 등)를 정확히 표시.
JSON 스키마에 정확히 따르세요.`;

  const prompt = `[페르소나]
- 이름: ${persona.name} (${persona.age}세 ${persona.gender || ""})
- 직업: ${persona.occupation}
- 라이프스타일: ${persona.lifestyle || ""}
- 가치관: ${(persona.values || []).join(", ")}
- 미디어 습관: ${(persona.mediaHabits || []).join(", ")}

[국가] ${meta.name}
[국가별 차단 매체 - 제외해야 함] ${blockedMedia.length ? blockedMedia.join(", ") : "없음"}

이 페르소나의 일각 일과(일어남 → 출근 → 업무 → 점심 → 오후 → 퇴근 → 저녁 → 취침 전)을
7-9개 시간대로 나눠 구체적 매체 접점과 행동을 적어주세요.
국가 특성(한국이면 Naver·KakaoTalk 우세, 일본이면 LINE 등)을 반영.`;

  const schema = {
    type: "object",
    properties: {
      timeline: {
        type: "array",
        items: {
          type: "object",
          properties: {
            time: { type: "string", description: "시간 예: 07:30" },
            context: { type: "string", description: "이 시간에 하는 일 (예: 출근길 지하철)" },
            mediaTouchpoints: { type: "array", items: { type: "string" }, description: "이 시간에 접하는 매체 (구체적)" },
            behavior: { type: "string", description: "구체적 행동 (예: Instagram을 30분 스크롤하면서 친구 소식 확인)" },
            adReceptivity: { type: "string", description: "이 시간대의 광고 수용도 (high/medium/low 을 한국어로)" },
          },
          required: ["time", "context", "mediaTouchpoints", "behavior"],
        },
      },
      peakAdMoment: { type: "string", description: "광고 접점으로 가장 좋은 시간대 + 이유" },
      avoidMoment: { type: "string", description: "광고 피해야 할 시간대 + 이유" },
      summary: { type: "string", description: "이 페르소나의 미디어 소비 패턴 2-3문장" },
    },
    required: ["timeline", "peakAdMoment", "summary"],
  };

  try {
    const result = await generateJSON({ prompt, system, schema, model: "gemini-2.5-flash", temperature: 0.7 });
    if (!result.json) throw new Error("JSON parse failed");
    res.json({
      ok: true,
      persona: { name: persona.name, age: persona.age },
      country: meta,
      journey: result.json,
      meta: { method: "gemini-2.5-flash", ts: new Date().toISOString() },
    });
  } catch (e) {
    res.json({ ok: true, journey: fallbackJourney(persona, meta), meta: { method: "fallback", error: e.message } });
  }
});

// ============================================================
// POST /api/interview/test-message  — 광고 콘텐츠 A/B/C 테스트
// 입력: 페르소나 배열 + 광고 시안 배열 (카피/키비주얼/투랜)
// 출력: 각 페르소나의 각 시안에 대한 반응 + 별점 + 레코맨델레이션
// ============================================================
interviewRouter.post("/test-message", async (req, res) => {
  const { personas = [], messages = [], country = "KR" } = req.body || {};
  if (!personas.length || !messages.length) return res.status(400).json({ ok: false, error: "personas[] and messages[] required" });
  const meta = COUNTRIES.find(c => c.code === String(country).toUpperCase());
  if (!meta) return res.status(400).json({ ok: false, error: "Unknown country" });

  if (!isGeminiAvailable()) {
    return res.json({ ok: true, results: [], meta: { method: "fallback" } });
  }

  const system = `당신은 광고 메시지 리서치를 합성 페르소나로 시뮬레이션하는 전문가입니다.
각 페르소나의 관점에서 광고 메시지의 감정적 반응·이해도·행동 의도를 솔직하게 평가.
점수(0-100)와 구체적 피드백을 제공하세요.`;

  const personaDesc = personas.map(p => `- ${p.name} (${p.age}세 ${p.gender || ""}, ${p.occupation || ""}, 라이프스타일: ${p.lifestyle || ""})`).join("\n");
  const messagesDesc = messages.map((m, i) => `[메시지 ${String.fromCharCode(65 + i)}] ${m}`).join("\n");

  const prompt = `[테스트 페르소나]
${personaDesc}

[광고 메시지 시안]
${messagesDesc}

[국가] ${meta.name}

각 페르소나가 각 메시지에 어떻게 반응하는지 평가하세요:
1. emotionalReaction: 일인칭으로 소감평 (예: "잘 모르겠어요, 조금 따개룩니다")
2. comprehensionScore: 이해도 0-100
3. relevanceScore: 자신에 얼마나 연관되는지 0-100
4. purchaseIntentScore: 구매 의도 0-100
5. concerns: 우려 사항
6. suggestion: 개선하면 더 나을 점`;

  const responseSchema = {
    type: "object",
    properties: {
      results: {
        type: "array",
        items: {
          type: "object",
          properties: {
            personaName: { type: "string" },
            messageResponses: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  messageLabel: { type: "string", description: "A/B/C 용어 사용" },
                  emotionalReaction: { type: "string" },
                  comprehensionScore: { type: "number" },
                  relevanceScore: { type: "number" },
                  purchaseIntentScore: { type: "number" },
                  concerns: { type: "array", items: { type: "string" } },
                  suggestion: { type: "string" },
                },
                required: ["messageLabel", "emotionalReaction", "comprehensionScore", "relevanceScore", "purchaseIntentScore"],
              },
            },
          },
          required: ["personaName", "messageResponses"],
        },
      },
      winnerMessage: { type: "string", description: "종합 우승 메시지 + 이유" },
      overallInsight: { type: "string", description: "전체 인사이트 2-3문장" },
    },
    required: ["results", "winnerMessage"],
  };

  try {
    const result = await generateJSON({ prompt, system, schema: responseSchema, model: "gemini-2.5-flash", temperature: 0.6 });
    if (!result.json) throw new Error("JSON parse failed");
    res.json({
      ok: true,
      country: meta,
      ...result.json,
      meta: { method: "gemini-2.5-flash", ts: new Date().toISOString() },
    });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

// ============================================================
// POST /api/interview/media-deep  — 페르소나의 특정 매체 심층 인사이트
// 입력: 페르소나 + 매체 ID
// 출력: 이 페르소나가 이 매체를 어떻게 쓰는지 구체적 행동/신뢰/수용도
// ============================================================
interviewRouter.post("/media-deep", async (req, res) => {
  const { persona, mediaId, country = "KR" } = req.body || {};
  if (!persona || !mediaId) return res.status(400).json({ ok: false, error: "persona and mediaId required" });
  const meta = COUNTRIES.find(c => c.code === String(country).toUpperCase());

  // 매체 정보 찾기
  const allMedia = flattenMedia();
  const media = allMedia.find(m => m.id === mediaId);
  if (!media) return res.status(400).json({ ok: false, error: "Unknown media" });

  if (!isGeminiAvailable()) {
    return res.json({ ok: true, insight: fallbackMediaDeep(persona, media), meta: { method: "fallback" } });
  }

  const system = `당신은 미디어 소비 행동 리서치 전문가입니다.
페르소나의 관점에서 특정 매체의 이용 행태를 구체적이고 질감있는 인사이트로 묘사하세요.`;

  const prompt = `[페르소나]
- ${persona.name} (${persona.age}세 ${persona.gender || ""})
- 직업: ${persona.occupation}
- 라이프스타일: ${persona.lifestyle || ""}
- 가치관: ${(persona.values || []).join(", ")}
- 평소 미디어: ${(persona.mediaHabits || []).join(", ")}

[매체]
- 이름: ${media.label}
- 카테고리: ${media.channelLabel} > ${media.subchannelLabel}
- 국가: ${meta?.name || country}

이 페르소나가 ${media.label}를 실제로 어떻게 이용하는지 상세한 인사이트를 생성하세요.`;

  const schema = {
    type: "object",
    properties: {
      usagePattern: { type: "string", description: "어떻게 쓰는지 구체적 행동 (예: 아침 출근길 30분, 점심시간 15분, 자기 전 10분)" },
      typicalContent: { type: "string", description: "주로 소비하는 콘텐츠 유형" },
      trustLevel: { type: "string", description: "이 매체 정보/광고에 대한 신뢰도 + 이유" },
      adReceptivity: { type: "string", description: "광고에 대한 반응 (수용·점증적·거부)" },
      purchaseImpact: { type: "string", description: "이 매체 광고로 실제 구매한 마지막 경험 예시" },
      messageStyle: { type: "string", description: "이 페르소나에게 이 매체에서 메시지를 전달하려면 어떤 스타일이 좋을지 추천" },
      bestTimeSlot: { type: "string", description: "이 사람이 이 매체를 가장 수용적으로 쓰는 시간대" },
      contrastWithOthers: { type: "string", description: "다른 페르소나 대비 차이점" },
    },
    required: ["usagePattern", "typicalContent", "trustLevel", "adReceptivity"],
  };

  try {
    const result = await generateJSON({ prompt, system, schema, model: "gemini-2.5-flash", temperature: 0.75 });
    if (!result.json) throw new Error("JSON parse failed");
    res.json({
      ok: true,
      persona: { name: persona.name, age: persona.age },
      media: { id: media.id, label: media.label, channel: media.channelLabel },
      insight: result.json,
      meta: { method: "gemini-2.5-flash", ts: new Date().toISOString() },
    });
  } catch (e) {
    res.json({ ok: true, insight: fallbackMediaDeep(persona, media), meta: { method: "fallback", error: e.message } });
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

  const n = persona.narratives || {};
  const narrBlock = (n.who || n.life || n.mind || n.love || n.buy) ? `

[페르소나 심층 프로필 — 이 설명과 모순되지 않게 답해야 함]
· 인물상(Who): ${n.who || '(설정 없음)'}
· 라이프스타일(Life): ${n.life || '(설정 없음)'}
· 가치관·심리(Mind): ${n.mind || '(설정 없음)'}
· 관심사(Love): ${n.love || '(설정 없음)'}
· 구매(Buy): ${n.buy || '(설정 없음)'}` : '';

  const system = `당신은 합성 페르소나 "${persona.name}"의 역할을 연기합니다.
- 나이: ${persona.age}
- 직업: ${persona.occupation}
- 라이프스타일: ${persona.lifestyle}
- 가치관: ${(persona.values || []).join(", ")}
- 미디어 습관: ${(persona.mediaHabits || []).join(", ")}
- 구매 동기: ${(persona.purchaseDrivers || []).join(", ")}
- 페인포인트: ${(persona.painPoints || []).join(", ")}${narrBlock}

광고대행사 리서처가 인터뷰하는 상황입니다. ${persona.name}의 페르소나 입장에서 솔직하게 답하세요.

[일관성 규칙 — 중요]
· 위 심층 프로필(Who/Life/Mind/Love/Buy)은 **배경 설정**입니다. 답변이 이 설정과 모순되어서는 안 됩니다.
· 그러나 설정을 **그대로 인용**하거나 복창하지 마세요. 본인의 말투로 자연스럽게 풀어 말하세요.
· 설정에 없는 주제는 가치관·라이프스타일에서 **자연스럽게 연역**해 추측해 답하세요.
· 주말/일상/구매 관련 질문은 반드시 Life/Buy 설명과 일치하는 내용으로 답하세요.

한국어로 자연스럽게, 1–3문장으로 답변. 답변 끝에 답변자 이름을 표시하지 마세요.`;

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

function blockedMediaForCountry(code) {
  const blocked = {
    CN: ["Google", "Instagram", "Facebook", "YouTube", "WhatsApp", "Twitter/X", "Netflix", "Naver", "KakaoTalk"],
    RU: ["Instagram (일부)", "Facebook (일부)", "Naver", "KakaoTalk"],
    KR: ["Baidu", "Yandex", "Weibo", "VKontakte", "WeChat"],
    JP: ["Naver", "KakaoTalk", "Baidu", "Weibo"],
    IN: ["TikTok (금지)", "WeChat (제한)", "Naver", "KakaoTalk", "Baidu"],
    US: ["Naver", "KakaoTalk", "WeChat", "Baidu", "Yandex"],
  };
  return blocked[code] || [];
}

function fallbackJourney(persona, country) {
  return {
    timeline: [
      { time: "07:00", context: "일어남", mediaTouchpoints: ["KakaoTalk 알림"], behavior: "알림 확인", adReceptivity: "low" },
      { time: "08:30", context: "출근길", mediaTouchpoints: ["Instagram", "YouTube 쇼츠"], behavior: "스크롤", adReceptivity: "medium" },
      { time: "12:00", context: "점심", mediaTouchpoints: ["Naver 식당 검색"], behavior: "검색", adReceptivity: "high" },
      { time: "21:00", context: "저녁 휴식", mediaTouchpoints: ["YouTube", "Netflix"], behavior: "시청", adReceptivity: "medium" },
    ],
    peakAdMoment: "점심시간 - 구매 의사결정이 가장 높은 시간",
    summary: "이 페르소나은 일하는 시간에도 수시로 모바일을 차활용",
  };
}

function fallbackMediaDeep(persona, media) {
  return {
    usagePattern: `${media.label}를 일일 알소하게 이용`,
    typicalContent: "일반 콘텐츠",
    trustLevel: "중간 수준",
    adReceptivity: "제한적",
  };
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
