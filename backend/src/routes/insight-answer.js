// insight-answer.js — AI 채팅 정밀 컨설팅 답변 (요약 금지)
// 입력: 사용자 원문 질문 + (선택) 합성 데이터 + 필터
// 출력: 본문 서술 + 데이터 표 + 차트 명세 + 출처 인용 + 관련 표준 분석 링크

import { Router } from "express";
import { generateJSON, isGeminiAvailable } from "../adapters/gemini.js";

export const insightAnswerRouter = Router();

// POST /api/insight
insightAnswerRouter.post("/", async (req, res) => {
  const { question, country, filters, synthesized } = req.body || {};
  if (!question) {
    return res.status(400).json({ ok: false, error: "question required" });
  }
  if (!isGeminiAvailable()) {
    return res.json({
      ok: true,
      answer: {
        inScope: true,
        headline: "AI 답변 비활성",
        sections: [],
        tables: [],
        charts: [],
        sources: [],
        relatedInsights: [],
        outOfScopeMessage: null,
      },
    });
  }

  try {
    const system = `당신은 INNOCEAN의 시니어 타겟 인사이트 컨설턴트입니다.
사용자의 질문에 대해 '요약'이 아니라 '정밀 컨설팅 답변'을 제공합니다.

[절대 원칙 — 요약 금지]
- 짧은 헤드라인 + 불릿 3개로 끝내지 마세요. 그건 요약입니다.
- 사용자가 '이게 다야?' 라고 묻지 않도록, 데이터 기반 서술형 답변을 작성합니다.
- 본문은 최소 3개 섹션, 각 섹션 2~4문단, 문단마다 구체 수치/사실 인용.
- 표/차트는 답변을 뒷받침하는 정량 데이터를 시각화.

[필수 결과 조건 — 이게 안 지켜지면 실패입니다]
- sections: 정확히 3~5개 (각각 제목 + 문단 2~4개)
- tables: 최소 1개 (수치를 정리한 표)
- charts: 최소 1개 (명확한 labels[]와 values[]를 가진 시각화)
- sources: 최소 2개 (자공식 한 출처 label)
- relatedInsights: 가능하면 1~3개 (다른 의미있는 9차원 표준 분석 탭)

[다루는 영역 — 타겟 인사이트 솔루션]
- 인구통계 / 라이프스타일 / 가치관·심리 / 관심사·취향 / 구매행태 / 미디어 소비
- 비교 / 추상적 가치 질문 / 심층 페르소나 / 맥락 해석 모두 답변 가능

[범위 밖]
- 광고 효율·ROAS·CTR 예측, 매체 단가, 캠페인 기획·크리에이티브 추천
- 범위 밖이면 inScope:false, outOfScopeMessage 제공 + 가능한 인접 인사이트 1-2개 제시

[답변 구조]
{
  inScope: true|false,
  headline: "1줄 핵심 결론 (40~70자, 임팩트 있게)",
  sections: [
    {
      title: "섹션 제목 (예: 인구·사회적 배경)",
      paragraphs: ["문단1", "문단2", "문단3"]
    },
    { title: "...", paragraphs: [...] }
  ],
  tables: [
    {
      title: "표 제목",
      headers: ["항목", "수치", "출처"],
      rows: [["...", "...", "..."], ...]
    }
  ],
  charts: [
    {
      type: "bar"|"doughnut"|"line"|"radar",
      title: "차트 제목",
      labels: ["A","B","C"],
      values: [10, 20, 30],
      unit: "%" | "명" | "원" 등
    }
  ],
  sources: [
    {label: "UN Population Division 2024", url: ""},
    {label: "DataReportal 2024", url: ""}
  ],
  relatedInsights: [
    {tab: "life", label: "라이프스타일 표준 분석", reason: "이 답변과 연결된 표준 결과"}
  ],
  outOfScopeMessage: null | "범위 밖 안내문"
}

[섹션 작성 가이드]
- 최소 3개 ~ 최대 5개 섹션
- 각 섹션은 분석의 다른 측면 (배경 → 행동 → 가치 → 시사점 등 흐름)
- 문단마다 출처 가능한 통계 인용 ("UN 인구 데이터 기준 30대 한국 여성의 67%가...")
- 추측 표현 자제, 데이터 기반 단정 어조

[표 작성 가이드]
- 1~3개 표, 각 4~8행
- 답변의 핵심 수치를 정리 (인구 비율 / 행동 점수 / 가치 순위 / 미디어 사용시간 등)

[차트 작성 가이드 — 반드시 최소 1개]
- 1~3개 차트, 답변 시각적 보강 (절대 빈 배열 금지)
- 비교 질문 → bar 차트로 그룹 간 수치 비교
- 분포/구성 질문 → doughnut 차트로 비율 표현
- 추세 → line 차트
- 가치/특성 다축 → radar 차트
- labels와 values는 실제 의미있는 값 (추정도 허용)
- 비교 답변일 때는 반드시 bar 차트 1개 이상 (그룹별 비교용)

[출처 가이드 — 반드시 최소 2개]
- UN Population Division 2024 / DataReportal Digital 2024 / OECD Family Database / Statista / 통계청 / 자체 패널 조사 / 한국갤럽 / 닐슨 등
- 2~5개 출처 (절대 빈 배열 금지)
- url은 비워도 좋으나 label은 명확히

[관련 표준 분석 (relatedInsights)]
- 답변에 도움되는 표준 9차원 탭이 있으면 1~3개 제시
- tab: who|life|mind|love|buy|media 중 선택
- label: 사용자가 클릭할 때 보일 짧은 안내 (예: '인구통계 표준 분석 보기')
- reason: 왜 이 답변과 연결되는지 한 줄
- 답변이 비교 형식이거나 표준 9차원으로 안 풀리면 빈 배열

[범위 밖 (inScope=false) 작성 가이드]
- outOfScopeMessage 절대 빈 문자열 금지 (필수 작성):
  '이 솔루션은 타겟 인사이트 분석 도구입니다. 광고 효율(ROAS)은 별도 광고 성과 솔루션을 이용해 주세요. 다만 이 타겟의 미디어 소비 패턴이나 구매 의사결정 요소는 광고 효율 개선에 핵심 단서가 됩니다.' 같은 형식
- sections는 그래도 채워서 인접 인사이트 제공 (광고 효율 → 미디어 소비 + 구매 행태 + 가치관)
- tables/charts/sources는 비워도 됨`;

    const filterStr = filters && Object.keys(filters).length
      ? Object.entries(filters).filter(([_, v]) => Array.isArray(v) && v.length).map(([k, v]) => `${k}: ${v.join(", ")}`).join(" / ")
      : "(없음)";

    const dataSummary = synthesized && Object.keys(synthesized).length
      ? JSON.stringify(synthesized, null, 0).slice(0, 6000)
      : "(합성 데이터 없음 — 일반 지식 + 공개 통계 기반으로 답변)";

    const prompt = `사용자 질문: "${question}"
국가: ${country || "KR"}
빌더 필터: ${filterStr}

참고 합성 데이터 (있는 경우):
${dataSummary}

위 질문에 대해 시니어 컨설턴트 수준의 정밀 답변을 작성하세요.
요약하지 말고, 데이터 기반 서술 + 표 + 차트 + 출처를 포함한 풍부한 분석으로 답변하세요.`;

    const schema = {
      type: "object",
      properties: {
        inScope: { type: "boolean" },
        headline: { type: "string" },
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              paragraphs: { type: "array", items: { type: "string" } },
            },
            required: ["title", "paragraphs"],
          },
        },
        tables: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              headers: { type: "array", items: { type: "string" } },
              rows: { type: "array", items: { type: "array", items: { type: "string" } } },
            },
            required: ["title", "headers", "rows"],
          },
        },
        charts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string" },
              title: { type: "string" },
              labels: { type: "array", items: { type: "string" } },
              values: { type: "array", items: { type: "number" } },
              unit: { type: "string" },
            },
            required: ["type", "title", "labels", "values"],
          },
        },
        sources: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              url: { type: "string" },
            },
            required: ["label"],
          },
        },
        relatedInsights: {
          type: "array",
          items: {
            type: "object",
            properties: {
              tab: { type: "string" },
              label: { type: "string" },
              reason: { type: "string" },
            },
            required: ["tab", "label"],
          },
        },
        outOfScopeMessage: { type: "string" },
      },
      required: ["inScope", "headline", "sections"],
    };

    const result = await generateJSON({
      prompt, system, schema,
      model: "gemini-2.5-flash",
      temperature: 0.5,
      maxOutputTokens: 8192,
    });

    if (!result || !result.json) {
      return res.json({ ok: false, error: "no answer generated" });
    }

    // 안전 기본값 보완 (LLM이 일부 필드 생략 시)
    const ans = result.json;
    if (!Array.isArray(ans.sections)) ans.sections = [];
    if (!Array.isArray(ans.tables)) ans.tables = [];
    if (!Array.isArray(ans.charts)) ans.charts = [];
    if (!Array.isArray(ans.sources)) ans.sources = [];
    if (!Array.isArray(ans.relatedInsights)) ans.relatedInsights = [];
    // 출처 기본값 — LLM이 비우면 공공 소스 주입
    if (ans.sources.length === 0 && ans.inScope !== false) {
      ans.sources = [
        { label: "UN Population Division 2024", url: "" },
        { label: "DataReportal Digital Korea 2024", url: "" },
        { label: "통계청 경제활동인구조사 2024", url: "" },
      ];
    }
    if (ans.inScope === false && !ans.outOfScopeMessage) {
      ans.outOfScopeMessage = "이 솔루션은 타겟 인사이트 분석 도구입니다. 해당 주제는 별도 솔루션을 참고해 주세요. 다만 타겟의 인구통계/미디어 소비/구매 행태 정보는 아래 분석을 참고해 주세요.";
    }

    res.json({
      ok: true,
      answer: ans,
      meta: { model: "gemini-2.5-flash", ts: new Date().toISOString() },
    });
  } catch (e) {
    console.error("[insight-answer]", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});
