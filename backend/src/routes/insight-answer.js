// insight-answer.js — 사용자 원문 질문에 대한 인사이트 직답 카드
// 입력: 사용자 질문 + 합성 5차원 데이터 + 빌더 필터
// 출력: 핵심 답변 + bullet points + 관련 탭 강조 + 범위 밖이면 안내

import { Router } from "express";
import { generateJSON, isGeminiAvailable } from "../adapters/gemini.js";

export const insightAnswerRouter = Router();

// POST /api/insight/answer
insightAnswerRouter.post("/", async (req, res) => {
  const { question, country, filters, synthesized } = req.body || {};
  if (!question || !synthesized) {
    return res.status(400).json({ ok: false, error: "question + synthesized required" });
  }
  if (!isGeminiAvailable()) {
    return res.json({
      ok: true,
      cached: false,
      answer: {
        inScope: true,
        headline: "AI 답변 비활성",
        bullets: [],
        relatedTabs: [],
        outOfScopeMessage: null,
      },
    });
  }

  try {
    const system = `당신은 INNOCEAN의 타겟 인사이트 분석 AI입니다.

[솔루션 범위]
이 솔루션은 '타겟 인사이트' 솔루션입니다:
- 인구통계 (Who)
- 라이프스타일 (Life)
- 가치관·심리 (Mind)
- 관심사·취향 (Love)
- 구매행태 (Buy)
- 미디어 소비 (Media)

[솔루션 범위 밖]
- 광고 효율·ROAS·CTR 예측 (별도 광고 솔루션)
- 시장 트렌드·검색량 (별도 트렌드 솔루션)
- 매체 단가·구매 가이드 (별도 미디어 플래닝 솔루션)
- 캠페인 기획·크리에이티브 추천

[당신의 일]
사용자 질문과 합성된 타겟 인사이트 데이터를 보고, 사용자가 정확히 알고 싶어한 것에 대해 답하세요.

1. 질문이 범위 안이면:
   - 핵심 답변 (headline) 1줄
   - 근거 bullet points 3-5개 (구체 수치 포함)
   - 관련 탭 ID (who/life/mind/love/buy/media 중)
   - inScope: true

2. 질문이 범위 밖(광고 효율/트렌드/단가 등)이면:
   - inScope: false
   - outOfScopeMessage: "이 솔루션은 타겟 인사이트 분석 도구입니다. [질문 주제]는 별도 솔루션을 참고해 주세요. 대신 이 타겟에 대해 다음을 보실 수 있어요: [어떤 인사이트가 있는지 1-2개 제안]"
   - 그래도 가능한 인사이트 bullet 1-2개 제공`;

    const filterStr = filters && Object.keys(filters).length
      ? Object.entries(filters).filter(([_, v]) => Array.isArray(v) && v.length).map(([k, v]) => `${k}: ${v.join(", ")}`).join(" / ")
      : "(없음)";

    const dataSummary = JSON.stringify({
      who: synthesized.who,
      life: synthesized.life,
      mind: synthesized.mind,
      love: synthesized.love,
      buy: synthesized.buy,
      media: synthesized.media,
    }, null, 0).slice(0, 8000); // 토큰 제한

    const prompt = `사용자 질문: "${question}"
국가: ${country || "KR"}
빌더 필터: ${filterStr}

합성된 타겟 인사이트 데이터:
${dataSummary}

위 질문에 대해 답변을 작성하세요. 구체적 수치를 인용하고, 핵심을 짚어주세요.`;

    const schema = {
      type: "object",
      properties: {
        inScope: { type: "boolean", description: "질문이 타겟 인사이트 범위 안에 있는지" },
        headline: { type: "string", description: "핵심 답변 (1줄, 30-50자)" },
        bullets: {
          type: "array",
          items: { type: "string" },
          description: "근거 bullet (3-5개, 구체 수치 포함, 각 30-60자)",
        },
        relatedTabs: {
          type: "array",
          items: { type: "string" },
          description: "관련 탭 ID (who/life/mind/love/buy/media 중)",
        },
        outOfScopeMessage: {
          type: "string",
          description: "범위 밖일 때만: 사용자에게 안내 + 대안 제시 (2-3문장)",
        },
      },
      required: ["inScope", "headline", "bullets"],
    };

    const result = await generateJSON({
      prompt, system, schema,
      model: "gemini-2.5-flash",
      temperature: 0.4,
    });

    if (!result || !result.json) {
      return res.json({ ok: false, error: "no answer generated" });
    }

    res.json({
      ok: true,
      answer: result.json,
      meta: { model: "gemini-2.5-flash", ts: new Date().toISOString() },
    });
  } catch (e) {
    console.error("[insight-answer]", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});
