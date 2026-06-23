// gemini.js — Vertex AI Gemini 어댑터
// 인증: Cloud Run 서비스 계정 자동 (동일 GCP 프로젝트 내 IAM)
// 모델: gemini-2.5-flash (저비용·고속) / gemini-2.5-pro (페르소나·복잡 추론)

import { VertexAI } from "@google-cloud/vertexai";

const PROJECT = process.env.GCP_PROJECT || "innocean-perf-apac-kr";
const LOCATION = process.env.VERTEX_LOCATION || "asia-northeast3";

let vertexClient = null;
function getClient() {
  if (!vertexClient) vertexClient = new VertexAI({ project: PROJECT, location: LOCATION });
  return vertexClient;
}

// Google Search grounding은 일부 region에서만 지원 (asia-northeast3·asia-east1 미지원)
// us-central1은 항상 지원 → 별도 클라이언트
let vertexSearchClient = null;
function getSearchClient() {
  if (!vertexSearchClient) {
    const SEARCH_LOC = process.env.VERTEX_SEARCH_LOCATION || "us-central1";
    vertexSearchClient = new VertexAI({ project: PROJECT, location: SEARCH_LOC });
  }
  return vertexSearchClient;
}

// 가용성 체크 (배포 환경에서 실패해도 fallback)
export function isGeminiAvailable() {
  try {
    return !!PROJECT;
  } catch { return false; }
}

// Google Search grounding·광고 시장 최신 이슈를 검색해 단답 요약을 재구성
// Vertex AI v2 SDK 스타일 (tools.googleSearch)
export async function searchAndSummarize({ query, model = "gemini-2.5-flash", maxTokens = 1024 }) {
  if (!isGeminiAvailable()) return { text: "", grounded: false };
  // grounding은 별도 클라이언트 (us-central1) 사용
  const client = getSearchClient();
  // Gemini 1.5: tools.googleSearchRetrieval, Gemini 2.0+: tools.googleSearch — 순차 폴백
  const toolVariants = [
    [{ googleSearch: {} }],            // Gemini 2.0/2.5
    [{ google_search: {} }],           // snake_case 호환
    [{ googleSearchRetrieval: {} }],   // 구버전 (Gemini 1.5)
  ];
  let lastErr = null;
  for (const tools of toolVariants) {
    try {
      const m = client.getGenerativeModel({
        model,
        generationConfig: { temperature: 0.2, maxOutputTokens: maxTokens },
        tools,
      });
      const result = await m.generateContent({
        contents: [{ role: "user", parts: [{ text: query }] }],
      });
      const txt = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const meta = result.response?.candidates?.[0]?.groundingMetadata || null;
      if (txt) {
        return { text: txt, grounded: !!meta, sources: meta?.webSearchQueries || [], model, toolUsed: Object.keys(tools[0])[0] };
      }
    } catch (e) {
      lastErr = e.message;
      continue;
    }
  }
  // 전부 실패 시 일반 generateText로 fallback (최소한 지식 기반 답변이라도 확보)
  try {
    const m = client.getGenerativeModel({
      model,
      generationConfig: { temperature: 0.3, maxOutputTokens: maxTokens },
    });
    const result = await m.generateContent({
      contents: [{ role: "user", parts: [{ text: query + "\n\n(계속 검색 결과 없으면 일반 지식으로 답해주세요)" }] }],
    });
    const txt = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return { text: txt, grounded: false, fallbackText: true, error: lastErr, model };
  } catch (e) {
    return { text: "", grounded: false, error: e.message };
  }
}

// 일반 텍스트 생성
export async function generateText({ prompt, system, model = "gemini-2.5-flash", temperature = 0.4, maxTokens = 1024, thinkingBudget = 0 }) {
  const client = getClient();
  // CEO 2026-06-24: gemini-2.5-flash는 thinking이 기본 활성 — maxOutputTokens를 thinking으로 다 소비해 text=0(MAX_TOKENS) 버그.
  //   표현·요약같은 단순 생성은 thinkingBudget=0으로 비활성화.
  const genCfg = { temperature, maxOutputTokens: maxTokens };
  if (thinkingBudget != null) genCfg.thinkingConfig = { thinkingBudget };
  const m = client.getGenerativeModel({
    model,
    generationConfig: genCfg,
    systemInstruction: system ? { parts: [{ text: system }] } : undefined,
  });
  const result = await m.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });
  // CEO 2026-06-24: gemini-2.5-flash는 thinking 토큰 후 여러 parts로 나뉜 수 있어 전체 parts의 text를 합치기
  const _parts = result.response?.candidates?.[0]?.content?.parts || [];
  const txt = _parts.map(p => (p && p.text) || "").join("").trim()
           || result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return { text: txt, model, usage: result.response?.usageMetadata || null, finishReason: result.response?.candidates?.[0]?.finishReason };
}

// JSON 구조화 출력 (Gemini는 응답 스키마 지원)
export async function generateJSON({ prompt, system, schema, model = "gemini-2.5-flash", temperature = 0.2, maxOutputTokens = 8192 }) {
  const client = getClient();
  const m = client.getGenerativeModel({
    model,
    generationConfig: {
      temperature,
      maxOutputTokens,
      responseMimeType: "application/json",
      responseSchema: schema,
    },
    systemInstruction: system ? { parts: [{ text: system }] } : undefined,
  });
  const result = await m.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });
  const txt = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  try { return { json: JSON.parse(txt), model }; }
  catch (e) { return { json: null, error: "JSON parse failed", raw: txt }; }
}

// 멀티턴 대화 (페르소나 인터뷰용)
export async function chat({ messages, system, model = "gemini-2.5-flash", temperature = 0.7 }) {
  const client = getClient();
  const m = client.getGenerativeModel({
    model,
    generationConfig: { temperature, maxOutputTokens: 1024 },
    systemInstruction: system ? { parts: [{ text: system }] } : undefined,
  });
  const contents = messages.map(msg => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));
  const result = await m.generateContent({ contents });
  const txt = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return { text: txt, model };
}
