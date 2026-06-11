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
- lifestyle-insight: 라이프스타일 · 일상
- values-insight: 가치관 · 심리 · 의사결정
- interest-insight: 관심사 · 취미 · 콘텐츠
- purchase-insight: 구매행태 · 쇼핑
- media-insight: 미디어 소비 패턴 (단순 소비 행태, 광고 전략 아님)
- demographic-insight: 인구통계 · 직업 · 소득
- persona-deep-dive: 페르소나 심층 분석
- global-comparison: 국가별 비교
- out-of-scope: 소루션 범위 밖 (광고 효율/ROAS/CTR/트렌드/단가/미디어 플래닝/시장규모/경쟁사 등)
- general: 일반 질문

[주의]
이 솔루션은 '타겟 인사이트 분석' 소루션입니다.
- '광고 효율', 'ROAS', 'CTR', '트렌드', '시장규모', '단가', '매체 구매', '경쟁사' 등은 범위 밖(out-of-scope)으로 분류.
- 단, '미디어 소비 패턴' '매체 이용 시간' '어디서 콘텐츠를 소비하는지' 같은 소비 행태는 media-insight로 분류.

규칙 (중요):
- filters의 키는 위 디멘션 id와 정확히 일치 (age, gender, musicGenre 등).
- filters의 값은 위 대괄호 목록에서 고른 옵션 라벨과 문자열이 완전히 일치해야 함.
- 원칙적으로 **추측해서 최대한 많이 채워도 됩니다** (사용자가 제거할 것이므로).
- '20-30대', '3040대' 같은 범위는 각각 ['20대','30대'], ['30대','40대']으로 펼치세요.
- '워킹맘' = gender:['여성'] + household:['유자녀 가구'] (+ 가능하면 maritalStatus:['기혼']).
- '프리미엄 쇼퍼' = income:['상위 20%'] (+ purchaseDriver에 관련 값 있으면 추가).
- '싱글/1인' = household:['1인 가구'].
- '세대' 표현: Gen Z/젝지 = age:['20대'], 밀레니얼 = age:['30대'], X세대 = age:['40대'].
- kpop/K-pop = musicGenre:['K-Pop'].
- 적용할 수 있는 값을 찾으면 항상 filters에 넘으세요. 빈 객체는 마지막 수단.
- 추론 근거(reasoning)는 의미 있는 정보가 있을 때만 1-2문장으로 채우세요.
- '~는 타겟 정의에 해당합니다', '~ 요청입니다', '~ 해석했습니다' 같은 자명한 분류 문구는 넣지 마세요 (사용자에게 가치 없음).
- 대신 '왜 이 국가/필터를 선택했는지' 같은 실제 해석 단서를 적으세요.
- 질의가 최소한의 단서도 주지 않을 때에는 reasoning을 빈 문자열("")로 채우세요.

예시:
질의: "kpop을 좋아하는 3040대 일본 워킹맘"
→ { country: "JP", filters: { age: ["30대","40대"], gender: ["여성"], household: ["유자녀 가구"], maritalStatus: ["기혼"], musicGenre: ["K-Pop"] }, intent: "target-definition" }
질의: "소설을 좋아하는 50대 서울 프리미엄 쇼퍼"
→ { country: "KR", filters: { age: ["50대"], income: ["상위 20%"], interests: ["일반·지식 콘텐츠"] }, intent: "target-definition" }`;

  // filters 스키마 동적 생성 — Gemini structured output은 properties 명시 필요
  const filtersProperties = {};
  for (const d of DIMENSIONS) {
    filtersProperties[d.id] = {
      type: "array",
      items: { type: "string" },
      description: `${d.label} — 허용 값: ${(d.options||[]).map(o=>typeof o==="string"?o:o.label).join(" | ")}`,
    };
  }
  const schema = {
    type: "object",
    properties: {
      country: { type: "string", description: "ISO 3166-1 alpha-2 국가 코드" },
      filters: { type: "object", properties: filtersProperties },
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

  // 필터 검증 — 정확·부분 매칭 + 동의어 테이블
  const SYN = {
    age: { '20-29': '20대', '30-39': '30대', '40-49': '40대', '50-59': '50대', '60+': '60대 이상', '18-24': '20대', '25-34': '20대', '35-44': '30대', '45-54': '40대', '60이상': '60대 이상', '청소년': '10대', '청년': '20대', '장년': '40대', '노년': '60대 이상' },
    gender: { 'female': '여성', 'male': '남성', 'f': '여성', 'm': '남성', '여자': '여성', '남자': '남성' },
    maritalStatus: { '결혼': '기혼', 'married': '기혼', 'single': '미혼', '미혼·독신': '미혼', '도혼': '기혼' },
    household: { '으자녀 가구': '유자녀 가구', '자녀있음': '유자녀 가구', '자녀있는가구': '유자녀 가구', '워킹맘': '유자녀 가구', '싱글': '1인 가구', '독립가구': '1인 가구' },
    musicGenre: { 'kpop': 'K-Pop', '케이팝': 'K-Pop', 'k팝': 'K-Pop', 'hiphop': '힙합·R&B', 'rnb': '힙합·R&B', 'pop': '팝', 'rock': '록·메탈' },
    income: { 'high': '상위 20%', 'middle': '40~60%', 'low': '하위 20%', '고소득': '상위 20%', '중소득': '40~60%', '저소득': '하위 20%', '프리미엄': '상위 20%' },
  };
  const validDims = {};
  for (const d of DIMENSIONS) {
    validDims[d.id] = (d.options || []).map(o => typeof o === "string" ? o : o.label);
  }
  function matchOption(dimId, want) {
    if (want == null) return null;
    const wantStr = String(want).trim();
    if (!wantStr || wantStr === '전체' || wantStr.toLowerCase() === 'all' || wantStr.toLowerCase() === 'any') return null;
    const opts = validDims[dimId] || [];
    // 1) 정확 일치
    if (opts.includes(wantStr)) return wantStr;
    // 2) 동의어 테이블
    const syn = (SYN[dimId] || {})[wantStr.toLowerCase()] || (SYN[dimId] || {})[wantStr];
    if (syn && opts.includes(syn)) return syn;
    // 3) 부분 일치 (원한 값 ⊇ 옵션 또는 옵션 ⊇ 원한 값)
    const lower = wantStr.toLowerCase();
    for (const opt of opts) {
      const optLower = opt.toLowerCase();
      if (optLower === lower) return opt;
      if (optLower.includes(lower) || lower.includes(optLower)) return opt;
    }
    // 4) 숫자 명시적 처리 (예: '30' → '30대')
    const num = wantStr.match(/^(\d{1,2})/);
    if (num) {
      const decade = num[1].length === 1 ? num[1] + '0대' : num[1] + '대';
      if (opts.includes(decade)) return decade;
      if (opts.includes(decade + ' 이상')) return decade + ' 이상';
    }
    return null;
  }
  function expandValues(vals) {
    // '30-40대' → ['30대','40대'], '3040대' → ['30대','40대']
    const out = [];
    for (const v of vals) {
      const s = String(v);
      const range = s.match(/(\d{1,2})\s*[-~–]\s*(\d{1,2})\s*대/);
      const compact = s.match(/^(\d)0(\d)0\s*대/);
      if (range) {
        const a = +range[1], b = +range[2];
        for (let i = a; i <= b; i += 10) out.push(i + '대');
      } else if (compact) {
        out.push(compact[1] + '0대', compact[2] + '0대');
      } else {
        out.push(s);
      }
    }
    return out;
  }
  const cleanedFilters = {};
  for (const [key, vals] of Object.entries(result.json.filters || {})) {
    if (!validDims[key]) continue;
    const rawArr = Array.isArray(vals) ? vals : [vals];
    const expanded = expandValues(rawArr);
    const matched = expanded.map(v => matchOption(key, v)).filter(Boolean);
    const unique = [...new Set(matched)];
    if (unique.length) cleanedFilters[key] = unique;
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
    reasoning: "",
  };
}
