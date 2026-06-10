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
  try {
    const client = getClient();
    const m = client.getGenerativeModel({
      model,
      generationConfig: { temperature: 0.2, maxOutputTokens: maxTokens },
      tools: [{ googleSearchRetrieval: {} }],
    });
    const result = await m.generateContent({
      contents: [{ role: "user", parts: [{ text: query }] }],
    });
    const txt = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const meta = result.response?.candidates?.[0]?.groundingMetadata || null;
    return { text: txt, grounded: !!meta, sources: meta?.webSearchQueries || [], model };
  } catch (e) {
    // grounding tool 미지원 또는 권한 없으면 fallback
    return { text: "", grounded: false, error: e.message };
  }
}

// 일반 텍스트 생성
export async function generateText({ prompt, system, model = "gemini-2.5-flash", temperature = 0.4, maxTokens = 1024 }) {
  const client = getClient();
  const m = client.getGenerativeModel({
    model,
    generationConfig: { temperature, maxOutputTokens: maxTokens },
    systemInstruction: system ? { parts: [{ text: system }] } : undefined,
  });
  const result = await m.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });
  const txt = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return { text: txt, model, usage: result.response?.usageMetadata || null };
}

// JSON 구조화 출력 (Gemini는 응답 스키마 지원)
export async function generateJSON({ prompt, system, schema, model = "gemini-2.5-flash", temperature = 0.2 }) {
  const client = getClient();
  const m = client.getGenerativeModel({
    model,
    generationConfig: {
      temperature,
      maxOutputTokens: 8192,
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
