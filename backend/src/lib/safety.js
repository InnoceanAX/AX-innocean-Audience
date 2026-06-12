// safety.js — INNOCEAN AI 페르소나 답변 세이프티 가이드
// 적용 대상: AI 채팅 답변 카드 (insight-answer), 페르소나 인터뷰 (interview), 인사이트 답변 (insight)
// 원칙: 모든 답변은 (1) 긍정 트렌드만, (2) 비차별·비편향, (3) 광고·캠페인 추천 금지

/* ──────────────────────────────────────────────────────────────────
   1. 부정·논란 트렌드 키워드 (인용 금지)
   ────────────────────────────────────────────────────────────────── */
export const NEGATIVE_TREND_RE = /(논란|논쟁|공격|비난|당혹|철회|명예훼손|안티팬|악플|악성댓글|마녀사냥|취소문화|취소 ?컬처|음주운전|마약|판결|소송|수사|구속|체포|범죄|기소|영장|혐의|법정|불기소|패소|승소|위법|위반|폭로|배신|파혼|이혼|불륜|루머|가십|스캔들|디스|저격|손절|입장문|사과문|반박문|편파|왜곡|악재|하락세|폭락|적자|혹평|혹평받|망작|망함|시청률 ?저조|악연|반대|기피|싫어|불호|비호감|비매너|민폐|진상|꼴불견|구설|먹튀|폭행|학폭|왕따|괴롭힘|사이버불링|성희롱|성추행|성폭력|미투|폭언|폭력|왕따|괴롭|괴롭힘)/g;

/* ──────────────────────────────────────────────────────────────────
   2. 차별·혐오 표현 (절대 금지)
   ────────────────────────────────────────────────────────────────── */
export const DISCRIMINATION_RE = /(특정 ?인종|특정 ?민족|혐오|증오|차별|편견|혐오발언|인종차별|성차별|여혐|남혐|장애인 ?비하|노인 ?비하|외국인 ?혐오|이주민 ?혐오|성소수자 ?혐오|동성애 ?혐오|이슬람 ?혐오|반유대|종교 ?혐오|지역 ?비하|지역 ?혐오|호남 ?혐오|영남 ?혐오)/g;

/* ──────────────────────────────────────────────────────────────────
   3. 정치·종교·민감 사회 이슈 (중립 유지, 특정 진영 옹호·비판 금지)
   ────────────────────────────────────────────────────────────────── */
export const SENSITIVE_TOPIC_RE = /(좌파|우파|진보 ?진영|보수 ?진영|민주당|국민의힘|정의당|대통령 ?비판|대통령 ?옹호|정권 ?비판|정권 ?옹호|친일|반일|친중|반중|친북|반북|북한 ?옹호|특정 ?종교 ?우월|개신교 ?우월|불교 ?우월|천주교 ?우월|이슬람 ?우월|무신론 ?주장|유신론 ?주장|낙태 ?찬성|낙태 ?반대|동성결혼 ?찬성|동성결혼 ?반대|페미니즘 ?옹호|페미니즘 ?반대|반페미)/g;

/* ──────────────────────────────────────────────────────────────────
   4. 성·폭력·자해 (절대 금지)
   ────────────────────────────────────────────────────────────────── */
export const HARMFUL_CONTENT_RE = /(자살|자해|자살방법|투신|목매|음독|약물 ?과다|마약 ?복용|마약 ?구매|마약 ?구입|불법 ?도박|아동 ?성|미성년 ?성|성적 ?대상화|음란|음란물|성기|성행위|섹스|야동|포르노|에로|성매매|매춘|기절|살해|살인|테러|폭탄|총기|무기 ?제작)/g;

/* ──────────────────────────────────────────────────────────────────
   5. 광고·캠페인·ROAS 추천 (CTO 정책상 범위 밖)
   ────────────────────────────────────────────────────────────────── */
export const AD_RECOMMENDATION_RE = /(ROAS|CTR|CPM|CPC|광고 ?효율|매체 ?단가|크리에이티브 ?제안|크리에이티브 ?추천|캠페인 ?기획|광고 ?집행|광고비 ?책정|광고 ?예산 ?책정)/g;

/* ──────────────────────────────────────────────────────────────────
   6. 의료·법률·금융 전문 조언 (자격 외, 일반 정보로만 답변)
   ────────────────────────────────────────────────────────────────── */
export const PROFESSIONAL_ADVICE_RE = /(진단|처방|투약|복용량|투자 ?추천|매수 ?추천|매도 ?추천|주식 ?종목|코인 ?종목|법률 ?자문|법률 ?조언|소송 ?승소|재판 ?결과)/g;

/* ──────────────────────────────────────────────────────────────────
   분류·치환 정책
   ────────────────────────────────────────────────────────────────── */
const SAFETY_CATEGORIES = [
  { name: "negative_trend", re: NEGATIVE_TREND_RE, replace: "관심 있는 이슈", level: "warn" },
  { name: "discrimination", re: DISCRIMINATION_RE, replace: "다양한 인구 특성", level: "block" },
  { name: "sensitive_topic", re: SENSITIVE_TOPIC_RE, replace: "사회적 관심사", level: "block" },
  { name: "harmful_content", re: HARMFUL_CONTENT_RE, replace: "안전한 일상 활동", level: "block" },
  { name: "ad_recommendation", re: AD_RECOMMENDATION_RE, replace: "마케팅 일반 트렌드", level: "warn" },
  { name: "professional_advice", re: PROFESSIONAL_ADVICE_RE, replace: "일반 정보", level: "warn" },
];

/* ──────────────────────────────────────────────────────────────────
   사용자 의도 검사 (명시적 부정 이슈 조회)
   ──────────────────────────────────────────────────────────────────
   사용자가 명시적으로 부정 이슈를 물으면 답변 허용 (sanitize 우회).
   자동 추천·권유에서만 부정 이슈 차단.
*/
export function isUserAskingAboutNegative(userQuestion) {
  if (!userQuestion || typeof userQuestion !== "string") return false;
  // 명시적 부정 이슈 문의 패턴
  const explicitAskPatterns = [
    /논란/, /이슈/, /논쟁/, /스캔들/, /소송/, /프로세스/, /재판/,
    /혹평/, /문제/, /구설/, /루머/, /가십/, /폭로/, /배신/,
    /안티팬/, /악플/, /마녀사냥/, /입장문/, /사과문/, /문제점/,
    /알아\?/, /알고/, /들어봤/, /볼 수 있/, /어떻게 생각/, /의견/, /평가/,
    /시킴/, /머일/, /죄/, /범죄/, /수사/, /판결/, /구속/, /체포/,
    /학폭/, /폭행/, /의혹/, /혐의/, /기소/, /영장/, /왕따/, /괴롭/
  ];
  return explicitAskPatterns.some(re => re.test(userQuestion));
}

/* ──────────────────────────────────────────────────────────────────
   부적절 텍스트 감지·치환
   ────────────────────────────────────────────────────────────────── */
export function detectViolations(text) {
  if (!text || typeof text !== "string") return [];
  const hits = [];
  for (const cat of SAFETY_CATEGORIES) {
    const m = text.match(cat.re);
    if (m && m.length) {
      hits.push({ category: cat.name, level: cat.level, samples: m.slice(0, 3) });
    }
  }
  return hits;
}

export function sanitizeText(text, context = "", options = {}) {
  if (!text || typeof text !== "string") return text;
  const { allowNegativeTrend = false } = options;
  let out = text;
  let logged = false;
  for (const cat of SAFETY_CATEGORIES) {
    // 사용자가 명시적으로 부정 이슈를 물으면 negative_trend는 허용
    if (allowNegativeTrend && cat.name === "negative_trend") continue;
    const re = new RegExp(cat.re.source, cat.re.flags);
    if (re.test(out)) {
      if (!logged) {
        console.warn(`[safety:${context}] violation detected (${cat.name}/${cat.level}):`, text.slice(0, 120));
        logged = true;
      }
      out = out.replace(new RegExp(cat.re.source, cat.re.flags), cat.replace);
    }
  }
  return out;
}

/* ──────────────────────────────────────────────────────────────────
   답변 객체(persona/voice/headline 등) 일괄 정화
   ────────────────────────────────────────────────────────────────── */
export function sanitizeAnswerObject(ans, context = "answer", options = {}) {
  if (!ans || typeof ans !== "object") return ans;
  if (typeof ans.headline === "string") ans.headline = sanitizeText(ans.headline, `${context}.headline`, options);
  if (typeof ans.narrative === "string") ans.narrative = sanitizeText(ans.narrative, `${context}.narrative`, options);
  if (typeof ans.outOfScopeMessage === "string") ans.outOfScopeMessage = sanitizeText(ans.outOfScopeMessage, `${context}.oos`, options);
  if (Array.isArray(ans.personaSamples)) {
    for (const p of ans.personaSamples) {
      if (typeof p.voice === "string") p.voice = sanitizeText(p.voice, `${context}.voice`, options);
      if (typeof p.tagline === "string") p.tagline = sanitizeText(p.tagline, `${context}.tagline`, options);
      if (Array.isArray(p.attributes)) p.attributes = p.attributes.map(a => typeof a === "string" ? sanitizeText(a, `${context}.attr`, options) : a);
    }
  }
  if (Array.isArray(ans.kpis)) {
    for (const k of ans.kpis) {
      if (typeof k.label === "string") k.label = sanitizeText(k.label, `${context}.kpi.label`, options);
      if (typeof k.sub === "string") k.sub = sanitizeText(k.sub, `${context}.kpi.sub`, options);
    }
  }
  return ans;
}

/* ──────────────────────────────────────────────────────────────────
   프롬프트에 삽입할 세이프티 가이드 텍스트
   ────────────────────────────────────────────────────────────────── */
export const SAFETY_PROMPT_GUIDE = `
[INNOCEAN 답변 세이프티 가이드 — 반드시 지킬 것]

1. **부정 트렌드·사회적 이슈 인물 (조건부)**:
   - **선호도·취향 답변 시 (자동 추천)**: 최근 2~3년 내 학교폭력·논란·소송·스캔들·음주운전·마약·갈등·구설·미투·폭로 등 **사회적 이슈가 있는 인물·작품·브랜드는 추천 금지**. 의심스러우면 추천 후보에서 완전히 제외하고 다른 안전한 후보 선택. (예: 학폭 의혹 받은 가수를 "좋아하는 가수"로 추천 금지)
   - **사용자가 명시적으로 부정 이슈를 물을 때** (예: "OO 논란에 대해 알아?", "OO 스캔들 알려줘", "OO 학폭 어떻게 생각해?"): **사실 기반으로 답변**. 알려진 공개 사실만 제공, 과장·가십·추측 금지. 의견·도덕적 판단보다 사실 위주.

2. **차별·혐오 금지**: 특정 인종·민족·성별·종교·지역·연령·장애인·성소수자에 대한 차별·혐오·비하 표현 절대 금지. 객관·중립 묘사만.

3. **정치·종교 중립**: 특정 정당·정파·종교·이념을 옹호하거나 비판하지 않음. 사회 이슈는 다양한 관점이 있음을 인정하는 중립적 묘사.

4. **유해 콘텐츠 금지**: 자살·자해·약물·테러·총기·아동 성적 콘텐츠·음란 표현 절대 금지.

5. **광고·캠페인 추천 금지** (INNOCEAN CTO 정책): ROAS·CTR·CPM·매체 단가·크리에이티브 추천·광고 예산 제안 — 모두 범위 밖. inScope:false 처리.

6. **의료·법률·금융 전문 자문 금지**: 진단·처방·투자 추천·법률 자문 등 자격 외 영역은 답변 안 함. 일반 정보로만.

7. **개인정보·신원 노출 금지**: 실제 인물의 사생활·연락처·주소 등 노출 금지.

8. **허위·미확인 정보 금지**: 사실 확인 안 된 소문·루머·미확인 보도 인용 금지. 실시간 검색 결과도 부정 키워드 있으면 무시.
`;
