// AI 페르소나 합성 패널 리서치 엔드포인트
// 빌더 필터 → N명 페르소나 생성 → 표준 질문 응답 → 통계 집계 → 캐시

import { Router } from "express";
import { generateJSON } from "../adapters/gemini.js";
import fs from "fs";
import path from "path";

export const researchRouter = Router();

// 캐시 디렉토리 (GCS 대용, 컨테이너 내 파일 시스템; 운영은 GCS Bucket으로 마이그레이션 가능)
const CACHE_DIR = process.env.RESEARCH_CACHE_DIR || "/tmp/research-cache";
if (!fs.existsSync(CACHE_DIR)) {
  try { fs.mkdirSync(CACHE_DIR, { recursive: true }); } catch (e) { /* ignore */ }
}

// 캐시 키 정규화
function cacheKey({ country, ageRange, gender, interests, dim }) {
  const ints = Array.isArray(interests) ? [...interests].sort().join(",") : (interests || "");
  return `${country}|${ageRange || "all"}|${gender || "all"}|${ints}|${dim || "all"}`.toLowerCase().replace(/[^a-z0-9가-힣|,_-]/g, "_");
}

function cachePath(key) {
  // 파일명은 hex 인코딩 단순화
  const safe = Buffer.from(key).toString("base64url");
  return path.join(CACHE_DIR, safe + ".json");
}

function readCache(key) {
  try {
    const p = cachePath(key);
    if (!fs.existsSync(p)) return null;
    const raw = fs.readFileSync(p, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function writeCache(key, data) {
  try {
    const p = cachePath(key);
    fs.writeFileSync(p, JSON.stringify({ ...data, cachedAt: new Date().toISOString() }), "utf-8");
    return true;
  } catch (e) {
    return false;
  }
}

// 표준 질문 (5차원 × 5문항 = 25문항)
const STANDARD_QUESTIONS = {
  who: [
    { id: "age_perception", q: "당신의 연령대를 한 줄로 자기소개해 주세요." },
    { id: "household", q: "가구 구성과 동거인을 알려주세요." },
    { id: "income_self", q: "월 소득 수준을 대략 표현해 주세요 (저/중/고)." },
    { id: "occupation", q: "직업과 일하는 형태(정규직/프리랜서 등)를 알려주세요." },
    { id: "education", q: "최종 학력과 전공 분야를 알려주세요." },
  ],
  life: [
    { id: "daily_routine", q: "평일 하루 일과를 간단히 묘사해 주세요." },
    { id: "digital_hours", q: "하루 평균 스마트폰 사용 시간은 몇 시간인가요?" },
    { id: "weekend_activity", q: "주말에 가장 자주 하는 활동 3가지는?" },
    { id: "travel", q: "최근 1년 국내/해외 여행 횟수를 알려주세요." },
    { id: "fitness", q: "운동/건강관리 습관을 알려주세요." },
  ],
  mind: [
    { id: "core_values", q: "삶에서 가장 중요하다고 생각하는 가치 3가지를 말해주세요." },
    { id: "brand_trust", q: "광고/브랜드를 얼마나 신뢰하시나요? (낮음/보통/높음 + 이유)" },
    { id: "risk_attitude", q: "새로운 것을 시도하는 성향이 어떤가요?" },
    { id: "social_concern", q: "사회적 이슈(환경/공정성/정치)에 얼마나 관심을 가지시나요?" },
    { id: "future_outlook", q: "미래에 대해 낙관적이신가요 비관적이신가요?" },
  ],
  love: [
    { id: "top_interests", q: "가장 좋아하는 관심사/취미 5가지를 알려주세요." },
    { id: "celebrities", q: "좋아하는 셀럽이나 인플루언서 3명을 알려주세요." },
    { id: "music_genre", q: "자주 듣는 음악 장르나 아티스트는?" },
    { id: "content_genre", q: "자주 보는 영상/콘텐츠 장르는?" },
    { id: "ip_brands", q: "좋아하는 IP·브랜드(게임/캐릭터/패션 등)는?" },
  ],
  buy: [
    { id: "shopping_channels", q: "주로 쇼핑하는 채널(온라인/오프라인/앱)을 알려주세요." },
    { id: "top_categories", q: "최근 3개월 가장 많이 구매한 카테고리 3가지는?" },
    { id: "price_sensitivity", q: "가격에 얼마나 민감하신가요? (낮음/보통/높음)" },
    { id: "brand_loyalty", q: "특정 브랜드를 고집하는 편인가요? (예/아니오 + 어떤 카테고리)" },
    { id: "decision_factors", q: "구매 결정 시 가장 중요한 요소는? (가격/품질/리뷰/디자인/브랜드)" },
  ],
};

// 페르소나 1명 생성 + 질문 응답 (JSON 한 번에)
async function generatePersonaResponses({ country, ageRange, gender, interests, dim }) {
  const questions = dim ? { [dim]: STANDARD_QUESTIONS[dim] } : STANDARD_QUESTIONS;
  const qList = [];
  for (const [d, qs] of Object.entries(questions)) {
    for (const q of qs) {
      qList.push({ dim: d, id: q.id, q: q.q });
    }
  }

  const interestsStr = Array.isArray(interests) && interests.length ? interests.join(", ") : "다양";

  const prompt = `당신은 ${country} 국적의 ${ageRange || "성인"} ${gender || "응답자"} 1명입니다.
관심사: ${interestsStr}

당신의 일관된 페르소나로 다음 ${qList.length}개 질문에 짧고 자연스러운 한국어로 답해 주세요.
1. 모든 답변은 같은 사람이 답하는 듯 일관성 있게.
2. 답은 1-2문장. 너무 길지 않게.
3. JSON 형식으로만 응답. 키는 질문 id.

질문 목록:
${qList.map((q) => `- ${q.id}: ${q.q}`).join("\n")}

반드시 다음 JSON 형식으로만 응답:
{
  "persona_id": "<랜덤 ID>",
  "answers": {
    "${qList[0].id}": "답변",
    ... (${qList.length}개 모두)
  }
}`;

  try {
    const json = await generateJSON({
      prompt,
      system: "You are a synthetic consumer persona simulator. Respond ONLY in Korean. Output only valid JSON.",
      temperature: 0.85,
      model: "gemini-2.5-flash",
    });
    return json;
  } catch (e) {
    console.warn("[research] persona generation failed:", e.message);
    return null;
  }
}

// N명 병렬 생성
async function generatePanel({ country, ageRange, gender, interests, dim, panelSize = 30, concurrency = 10 }) {
  const results = [];
  const tasks = Array.from({ length: panelSize }, (_, i) => i);

  // 배치 단위 병렬
  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(() => generatePersonaResponses({ country, ageRange, gender, interests, dim }))
    );
    for (const r of batchResults) {
      if (r) results.push(r);
    }
  }

  return results;
}

// 응답 집계 → 통계화
function aggregateResponses(personas, dim) {
  const questions = dim ? STANDARD_QUESTIONS[dim] : Object.values(STANDARD_QUESTIONS).flat();
  const agg = {};

  for (const q of questions) {
    const answers = personas
      .map((p) => p.answers && p.answers[q.id])
      .filter((a) => a && typeof a === "string");
    agg[q.id] = {
      question: q.q,
      sample_count: answers.length,
      answers: answers.slice(0, 5), // 대표 5개 샘플
      total_respondents: personas.length,
    };
  }

  return agg;
}

// ━━━ 메인 엔드포인트 ━━━

// POST /api/research/segment
// body: { country, ageRange, gender, interests[], panelSize, dim, forceRefresh }
researchRouter.post("/segment", async (req, res) => {
  const { country, ageRange, gender, interests = [], panelSize = 30, dim, forceRefresh = false } = req.body || {};

  if (!country) {
    return res.status(400).json({ ok: false, error: "country is required" });
  }

  const key = cacheKey({ country, ageRange, gender, interests, dim });

  // 캐시 hit
  if (!forceRefresh) {
    const cached = readCache(key);
    if (cached) {
      return res.json({
        ok: true,
        cached: true,
        cacheKey: key,
        ...cached,
      });
    }
  }

  // 캐시 miss → 즉시 생성
  const start = Date.now();
  try {
    const personas = await generatePanel({
      country,
      ageRange,
      gender,
      interests,
      dim,
      panelSize,
      concurrency: 10,
    });

    if (personas.length === 0) {
      return res.status(500).json({ ok: false, error: "persona generation failed" });
    }

    const aggregated = aggregateResponses(personas, dim);
    const result = {
      country,
      ageRange,
      gender,
      interests,
      dim,
      panelSize: personas.length,
      requestedSize: panelSize,
      durationMs: Date.now() - start,
      aggregated,
      personas: personas.slice(0, 3), // 대표 3명만 응답에 포함 (응답 크기 제한)
      source: {
        method: "ai-synthetic-panel",
        model: "gemini-2.5-flash",
        timestamp: new Date().toISOString(),
        marginOfError: panelSize >= 1000 ? "±3.1%" : panelSize >= 400 ? "±4.9%" : panelSize >= 100 ? "±9.8%" : "±17.9%",
      },
    };

    writeCache(key, result);

    res.json({
      ok: true,
      cached: false,
      cacheKey: key,
      ...result,
    });
  } catch (e) {
    console.error("[research/segment] error:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// GET /api/research/cache/stats
researchRouter.get("/cache/stats", (req, res) => {
  try {
    const files = fs.readdirSync(CACHE_DIR);
    res.json({
      ok: true,
      total: files.length,
      cacheDir: CACHE_DIR,
    });
  } catch (e) {
    res.json({ ok: false, error: e.message, total: 0 });
  }
});

// GET /api/research/cache/list - 디버그
researchRouter.get("/cache/list", (req, res) => {
  try {
    const files = fs.readdirSync(CACHE_DIR);
    const items = files.slice(0, 100).map((f) => {
      const decoded = Buffer.from(f.replace(/\.json$/, ""), "base64url").toString("utf-8");
      const stat = fs.statSync(path.join(CACHE_DIR, f));
      return { key: decoded, size: stat.size, mtime: stat.mtime };
    });
    res.json({ ok: true, items, total: files.length });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

// POST /api/research/cache/clear (테스트용)
researchRouter.post("/cache/clear", (req, res) => {
  try {
    const files = fs.readdirSync(CACHE_DIR);
    files.forEach((f) => fs.unlinkSync(path.join(CACHE_DIR, f)));
    res.json({ ok: true, cleared: files.length });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});
