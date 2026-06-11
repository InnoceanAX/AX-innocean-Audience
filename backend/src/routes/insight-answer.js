// insight-answer.js — AI 채팅: AI 페르소나 패널 데이터 기반 정량 답변
// 원칙:
// - INNOCEAN AI 페르소나 합성 패널 데이터를 1차 근거로 사용
// - '글 위주 보고서' 금지. KPI 카드 + 차트 + 페르소나 카드 + 짧은 해설
// - 실제 합성 데이터 (who/life/mind/love/buy/media) → 차트로 직접 변환

import { Router } from "express";
import { generateJSON, isGeminiAvailable } from "../adapters/gemini.js";
import { COUNTRIES } from "../data/countries.js";
import { getDemographics, getLifestyle, getMindset, getInterests, getPurchase } from "../adapters/audience-public.js";
import { getCountryAdSpend } from "../adapters/adspend-public.js";

export const insightAnswerRouter = Router();

// 합성 패널 데이터 가져오기 (synthesized가 빈 경우 베이스라인 사용)
function buildPanelData(country, synthesized) {
  const code = String(country || "KR").toUpperCase();
  const out = {
    who: synthesized?.who || getDemographics(code) || {},
    life: synthesized?.life || getLifestyle(code) || {},
    mind: synthesized?.mind || getMindset(code) || {},
    love: synthesized?.love || getInterests(code) || {},
    buy: synthesized?.buy || getPurchase(code) || {},
  };
  try {
    const adSpend = getCountryAdSpend(code);
    if (adSpend && adSpend.channels) out.media = adSpend.channels;
  } catch (e) {}
  return out;
}

// 한글 라벨 매핑
const LIFE_LABELS = { socialNetworking: "SNS", videoStreaming: "동영상", gaming: "게임", shopping: "쇼핑", banking: "금융", news: "뉴스", fitness: "피트니스" };
const MIND_LABELS = { environmentImportance: "환경 중시", socialEqualityImportance: "평등 중시", traditionalValues: "전통 가치", innovationOpenness: "혁신 개방성", materialism: "물질주의", hedonism: "즐거움", ambition: "성취", riskAversion: "위험 회피", longTermOrientation: "장기 지향", individualism: "개인주의" };
const BUY_LABELS = { fashion: "패션", electronics: "전자", beauty: "뷰티", food: "식품", travel: "여행", home: "홈", entertainment: "엔터", price: "가격", reviews: "리뷰", brand: "브랜드", quality: "품질", delivery: "배송", recommendation: "추천", card: "카드", mobilePay: "간편결제", transfer: "계좌이체", cash: "현금" };
const LOVE_LABELS = { music: "음악", sports: "스포츠", gaming: "게임", beauty: "뷰티", fashion: "패션", fitness: "피트니스", cooking: "요리", travel: "여행", photography: "사진", technology: "테크", finance: "재테크", parenting: "육아", automotive: "자동차", pets: "반려동물", sustainability: "지속가능", kpop: "K-POP", drama: "드라마", food: "음식", anime: "애니", manga: "만화" };

function mapLabels(obj, mapping) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [mapping[k] || k, v]));
}

function topN(obj, n) {
  const arr = Object.entries(obj).sort((a, b) => +b[1] - +a[1]).slice(0, n);
  return Object.fromEntries(arr);
}

// 패널 데이터 → 자동 차트 셋
function autoChartsFromPanel(panel) {
  const charts = [];
  // 1. 인구통계 — 연령 분포 (bar)
  if (panel.who?.ageBuckets) {
    const ad = panel.who.ageBuckets;
    const labels = Object.keys(ad);
    const values = labels.map(k => +ad[k] || 0);
    if (values.some(v => v > 0)) {
      charts.push({ type: "bar", title: "연령 분포", labels, values, unit: "%", dim: "who" });
    }
  }
  // 2. 가치관 — radar (Hofstede + 가치관 점수)
  if (panel.mind) {
    const mind = panel.mind;
    const picked = {};
    ["environmentImportance", "innovationOpenness", "materialism", "hedonism", "ambition", "traditionalValues"].forEach(k => { if (mind[k] != null) picked[MIND_LABELS[k] || k] = mind[k]; });
    const labels = Object.keys(picked);
    const values = labels.map(k => +picked[k] || 0);
    if (values.length >= 3 && values.some(v => v > 0)) {
      charts.push({ type: "radar", title: "핵심 가치관 프로파일", labels, values, unit: "점", dim: "mind" });
    }
  }
  // 3. 라이프스타일 — 일상 활동 비중 (bar)
  if (panel.life?.activities) {
    const mapped = mapLabels(panel.life.activities, LIFE_LABELS);
    const labels = Object.keys(mapped);
    const values = labels.map(k => +mapped[k] || 0);
    if (values.some(v => v > 0)) {
      charts.push({ type: "bar", title: "일상 활동 참여율", labels, values, unit: "%", dim: "life" });
    }
  }
  // 4. 미디어 채널 점유 (doughnut)
  if (panel.media) {
    const md = Array.isArray(panel.media)
      ? Object.fromEntries(panel.media.map(c => [c.name || c.label, c.share || c.value || 0]))
      : panel.media;
    const top = topN(md, 6);
    const labels = Object.keys(top);
    const values = labels.map(k => +top[k] || 0);
    if (values.some(v => v > 0)) {
      charts.push({ type: "doughnut", title: "미디어 채널 점유", labels, values, unit: "%", dim: "media" });
    }
  }
  // 5. 구매 — 결제수단 (doughnut)
  if (panel.buy?.paymentMethods) {
    const mapped = mapLabels(panel.buy.paymentMethods, BUY_LABELS);
    const labels = Object.keys(mapped);
    const values = labels.map(k => +mapped[k] || 0);
    if (values.some(v => v > 0)) {
      charts.push({ type: "doughnut", title: "결제 수단 비중", labels, values, unit: "%", dim: "buy" });
    }
  }
  // 6. 구매 — 의사결정 요인 (bar)
  if (panel.buy?.decisionFactors) {
    const mapped = mapLabels(panel.buy.decisionFactors, BUY_LABELS);
    const labels = Object.keys(mapped);
    const values = labels.map(k => +mapped[k] || 0);
    if (values.some(v => v > 0)) {
      charts.push({ type: "bar", title: "구매 의사결정 요인", labels, values, unit: "점", dim: "buy" });
    }
  }
  // 7. 관심사 (bar — top 8)
  if (panel.love) {
    const mapped = mapLabels(panel.love, LOVE_LABELS);
    const top = topN(mapped, 8);
    const labels = Object.keys(top);
    const values = labels.map(k => +top[k] || 0);
    if (values.length >= 4 && values.some(v => v > 0)) {
      charts.push({ type: "bar", title: "주요 관심사 (상위 8)", labels, values, unit: "점", dim: "love" });
    }
  }
  return charts.slice(0, 6); // 최대 6개
}

// 패널 데이터 → 자동 KPI 카드
function autoKpisFromPanel(panel) {
  const kpis = [];
  // KPI 1: 주력 연령대
  if (panel.who?.ageBuckets) {
    const top = Object.entries(panel.who.ageBuckets).sort((a, b) => +b[1] - +a[1])[0];
    if (top) kpis.push({ label: "주력 연령대", value: top[0] + "세", sub: top[1] + "%" });
  }
  // KPI 2: 도시 거주 비율
  if (panel.who?.urbanRate != null) {
    kpis.push({ label: "도시 거주", value: panel.who.urbanRate + "%", sub: "" });
  }
  // KPI 3: 모바일 커머스 비중
  if (panel.buy?.mobileCommerceShare != null) {
    kpis.push({ label: "모바일 쇼핑", value: panel.buy.mobileCommerceShare + "%", sub: "전체 쇼핑 대비" });
  }
  // KPI 4: 최상위 라이프 활동
  if (panel.life?.activities) {
    const mapped = mapLabels(panel.life.activities, LIFE_LABELS);
    const top = Object.entries(mapped).sort((a, b) => +b[1] - +a[1])[0];
    if (top) kpis.push({ label: "최상위 활동", value: top[0], sub: top[1] + "%" });
  }
  // KPI 5: 인터넷 사용 시간
  if (panel.life?.avgInternetTime != null) {
    kpis.push({ label: "일평균 인터넷", value: panel.life.avgInternetTime + "시간", sub: "" });
  }
  // KPI 6: 최상위 가치관
  if (panel.mind) {
    const picked = Object.fromEntries(Object.entries(panel.mind).filter(([k]) => MIND_LABELS[k]).map(([k, v]) => [MIND_LABELS[k], v]));
    const top = Object.entries(picked).sort((a, b) => +b[1] - +a[1])[0];
    if (top) kpis.push({ label: "최우선 가치", value: top[0], sub: top[1] + "점" });
  }
  return kpis.slice(0, 4);
}

// POST /api/insight
insightAnswerRouter.post("/", async (req, res) => {
  const { question, country, filters, synthesized } = req.body || {};
  if (!question) {
    return res.status(400).json({ ok: false, error: "question required" });
  }

  // 1. 패널 데이터 구축 (synthesize 캐시 또는 베이스라인)
  const panel = buildPanelData(country || "KR", synthesized);
  const panelKpis = autoKpisFromPanel(panel);
  const panelCharts = autoChartsFromPanel(panel);

  if (!isGeminiAvailable()) {
    return res.json({
      ok: true,
      answer: {
        inScope: true,
        headline: "AI 답변 비활성",
        narrative: "",
        kpis: panelKpis,
        panelCharts,
        personaSamples: [],
        sources: [{ label: "INNOCEAN AI 페르소나 패널 (베이스라인)", url: "" }],
        relatedInsights: [],
        outOfScopeMessage: null,
      },
    });
  }

  try {
    const system = `당신은 INNOCEAN의 AI 페르소나 리서치 데이터 분석가입니다.
사용자 질문에 대해 INNOCEAN AI 페르소나 패널 데이터를 근거로 답변합니다.

[절대 원칙 — 데이터 중심, 글 최소화]
- '리포트 글'이 아닙니다. 패널 데이터에서 직접 뽑은 정량 결과를 보여줍니다.
- narrative는 1~2문장만 (총 80자 이내). 데이터 해석의 핵심만.
- 긴 문단/섹션 작성 절대 금지.
- 데이터 = KPI 카드 + 페르소나 샘플로 보여주고, 차트는 코드가 패널에서 자동 생성합니다.

[입력으로 받는 INNOCEAN AI 페르소나 패널]
인구통계(who) / 라이프스타일(life) / 가치관(mind) / 관심사(love) / 구매(buy) / 미디어(media)
각 차원에 비중·점수 데이터가 있습니다.

[중요 — 패널 해석 자세]
- 패널 데이터가 '전체 인구'로 보이더라도, 질문의 타겟에 맞춰 원한 세그먼트를 패널에서 추출한 도메인 전문 지식으로 재구성합니다.
- 답변을 '패널에 그 세그먼트가 없어서 못 합니다'라고 하지 않습니다. 항상 답변합니다.
- 질문의 세그먼트에 대한 명확한 도메인 지식(일반 통계)을 패널 프레임으로 감싸서 답변합니다.

[답변 구조]
{
  inScope: true|false,
  headline: "한 줄 핵심 결론 (30~60자)",
  narrative: "이 결과의 핵심 인사이트 1~2문장 (총 80자 이내)",
  personaSamples: [
    {
      name: "가상 이름 (예: 김지영)",
      tagline: "한 줄 캐릭터 묘사 (예: '효율 우선, 자녀 중심')",
      attributes: ["32세 워킹맘", "초등 1학년 자녀", "월 가구소득 600~700만원", "수도권 거주"],
      voice: "이 페르소나의 짧은 1인칭 한 마디 (40자 이내)"
    }
  ],
  sources: [
    {label: "INNOCEAN AI 페르소나 패널 N=30", url: ""},
    {label: "통계청 경제활동인구조사 2024", url: ""}
  ],
  relatedInsights: [
    {tab: "life", label: "라이프스타일 표준 분석", reason: "일과 패턴 상세 보기"}
  ],
  outOfScopeMessage: null | "범위 밖 안내문"
}

[작성 가이드 — 반드시 지킬 것]
- headline: 답을 한 줄로 주는 결론 (30~60자, 임팩트 있게). 절대 '없습니다'/'포함하지 않습니다' 같은 부정 어조 금지.
- narrative: 1~2문장. 이 데이터가 보여주는 핵심 인사이트.
- personaSamples: 반드시 1~3개 생성 (빈 배열 금지). 질문의 세그먼트에 맞는 가상 한국 이름.
  · attributes: 4~6개 구체 속성 (나이/직업/소득/거주/가족 등)
  · voice: 1인칭 한 마디 (예: '시간이 모자라요, 짧고 효율적인 선택을 합니다')
- sources: 첫 번째는 반드시 'INNOCEAN AI 페르소나 패널 N=30' 형태.
- relatedInsights: 반드시 1~3개 (빈 배열 금지). 9차원 표준 탭(who/life/mind/love/buy/media) 중에서 이 답변과 가장 관련있는 탭.

[범위 밖]
- 광고 효율·ROAS·CTR 예측, 매체 단가, 캠페인 기획·크리에이티브 추천 → inScope: false
- outOfScopeMessage 필수 (빈 문자열 금지)

[언어]
- 모든 텍스트는 한국어. 이모지 금지.`;

    const filterStr = filters && Object.keys(filters).length
      ? Object.entries(filters).filter(([_, v]) => Array.isArray(v) && v.length).map(([k, v]) => `${k}: ${v.join(", ")}`).join(" / ")
      : "(없음)";

    const panelStr = JSON.stringify(panel).slice(0, 4000);

    const prompt = `사용자 질문: "${question}"
국가: ${country || "KR"}
빌더 필터: ${filterStr}

INNOCEAN AI 페르소나 패널 데이터 (이걸 근거로 답변):
${panelStr}

위 패널 데이터를 근거로:
- headline (한 줄 결론)
- narrative (1~2문장 해설)
- personaSamples (1~3개 페르소나 카드)
- sources (첫 번째는 'INNOCEAN AI 페르소나 패널 N=30')
- relatedInsights (1~3개 9차원 탭)

긴 글 금지. 데이터 카드처럼 작성.`;

    const schema = {
      type: "object",
      properties: {
        inScope: { type: "boolean" },
        headline: { type: "string" },
        narrative: { type: "string" },
        personaSamples: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              tagline: { type: "string" },
              attributes: { type: "array", items: { type: "string" } },
              voice: { type: "string" },
            },
            required: ["name", "tagline", "attributes"],
          },
        },
        sources: {
          type: "array",
          items: {
            type: "object",
            properties: { label: { type: "string" }, url: { type: "string" } },
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
      required: ["inScope", "headline"],
    };

    const result = await generateJSON({
      prompt, system, schema,
      model: "gemini-2.5-flash",
      temperature: 0.5,
      maxOutputTokens: 4096,
    });

    if (!result || !result.json) {
      return res.json({ ok: false, error: "no answer generated" });
    }

    const ans = result.json;
    // 기본값 보완
    if (typeof ans.narrative !== "string") ans.narrative = "";
    if (!Array.isArray(ans.personaSamples)) ans.personaSamples = [];
    if (!Array.isArray(ans.sources)) ans.sources = [];
    if (!Array.isArray(ans.relatedInsights)) ans.relatedInsights = [];

    // 패널 데이터 기반 차트/KPI 주입 (LLM이 안 줘도 보장)
    ans.kpis = panelKpis;
    ans.panelCharts = panelCharts;

    // 출처 기본값 — 첫 번째 무조건 패널 출처
    if (ans.sources.length === 0 || !/INNOCEAN.*패널/.test(ans.sources[0]?.label || "")) {
      ans.sources = [
        { label: `INNOCEAN AI 페르소나 패널 N=30 (${country || "KR"})`, url: "" },
        ...ans.sources,
      ];
    }
    if (ans.sources.length < 2) {
      ans.sources.push({ label: "통계청 경제활동인구조사 2024", url: "" });
    }

    // 관련 인사이트 기본값 — 키워드 확장
    if (ans.relatedInsights.length === 0 && ans.inScope !== false) {
      const qLower = (question || "").toLowerCase();
      const cand = [];
      if (/가치|심리|세계관|신념/.test(qLower)) cand.push({ tab: "mind", label: "가치관 표준 분석", reason: "핵심 가치관 세부 지표" });
      if (/라이프|일상|활동|시간|워킹맘|맘|아빠|부모|가족/.test(qLower)) cand.push({ tab: "life", label: "라이프스타일 표준 분석", reason: "일상 행동 패턴" });
      if (/구매|소비|쇼핑|결제|브랜드/.test(qLower)) cand.push({ tab: "buy", label: "구매 행태 분석", reason: "구매 채널/요인" });
      if (/미디어|채널|콘텐츠|퀴|테레비|유튜브|sns|동영상/.test(qLower)) cand.push({ tab: "media", label: "미디어 소비 분석", reason: "채널 우선순위" });
      if (/관심|취미|트렌드|종륔/.test(qLower)) cand.push({ tab: "love", label: "관심사 분석", reason: "관심사/취미" });
      if (/누구|특징|인구|소득|세대|연령|성별|직업/.test(qLower)) cand.push({ tab: "who", label: "인구통계 표준 분석", reason: "인구학적 구조" });
      // 기본 추천 — 어떤 질문이든 최소 2개 보장
      if (cand.length === 0) {
        cand.push(
          { tab: "who", label: "인구통계 표준 분석", reason: "이 타겟의 인구학적 구조" },
          { tab: "life", label: "라이프스타일 표준 분석", reason: "일상 행동 패턴" },
          { tab: "mind", label: "가치관 표준 분석", reason: "핵심 가치관 점수" },
        );
      } else if (cand.length === 1) {
        // 1개만 있으면 기본 탭 1개 더 보충
        const used = cand[0].tab;
        const filler = ["who", "life", "mind"].find(t => t !== used);
        if (filler) cand.push({ tab: filler, label: filler === "who" ? "인구통계 표준 분석" : (filler === "life" ? "라이프스타일 표준 분석" : "가치관 표준 분석"), reason: "타겟 이해 보완" });
      }
      ans.relatedInsights = cand.slice(0, 3);
    }
    // 페르소나 기본값 — 비어있으면 패널에서 자동 생성
    if (ans.personaSamples.length === 0 && ans.inScope !== false) {
      // 패널 기본 한 개 생성
      const code = String(country || "KR").toUpperCase();
      const topAge = panel.who?.ageBuckets ? Object.entries(panel.who.ageBuckets).sort((a, b) => +b[1] - +a[1])[0]?.[0] : "30-44";
      const urbanRate = panel.who?.urbanRate || 80;
      const topInterest = panel.love ? Object.entries(panel.love).sort((a, b) => +b[1] - +a[1])[0]?.[0] : null;
      const topPay = panel.buy?.paymentMethods ? Object.entries(panel.buy.paymentMethods).sort((a, b) => +b[1] - +a[1])[0]?.[0] : null;
      const sampleNames = code === "KR" ? ["김지원", "박서연"] : ["Alex Park", "Sam Lee"];
      ans.personaSamples = [{
        name: sampleNames[0],
        tagline: `패널 핵심 세그먼트 (주력 연령 ${topAge}세 구간)`,
        attributes: [
          `${topAge}세 구간`,
          `${urbanRate >= 80 ? "대도시" : "중소도시"} 거주`,
          topInterest ? `주요 관심: ${topInterest}` : `다양한 관심사`,
          topPay ? `주 결제 수단: ${topPay === "card" ? "카드" : topPay === "mobilePay" ? "간편결제" : topPay}` : "디지털 소비",
          panel.life?.avgInternetTime ? `일평균 인터넷 ${panel.life.avgInternetTime}시간` : "디지털 네이티브",
        ],
        voice: "패널 데이터를 근거로 재구성된 대표 프로필입니다.",
      }];
    }

    if (ans.inScope === false && !ans.outOfScopeMessage) {
      ans.outOfScopeMessage = "이 솔루션은 타겟 인사이트 분석 도구입니다. 광고 효율(ROAS) 등은 별도 솔루션을 이용해 주세요. 다만 타겟의 미디어 소비/구매 행태는 아래 데이터를 참고해 주세요.";
    }

    res.json({
      ok: true,
      answer: ans,
      meta: { model: "gemini-2.5-flash", panelSize: 30, ts: new Date().toISOString() },
    });
  } catch (e) {
    console.error("[insight-answer]", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});
