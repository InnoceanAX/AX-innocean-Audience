# INNOCEAN AUDIENCE 기능정의서

> AI 합성 페르소나 패널 기반 글로벌 타겟 인사이트 솔루션
>
> Version: 1.0 (Sohee 최종)
> Date: 2026-06-16
> Author: Sohee (CTO)
> 기준 커밋: `de85119` (fix(42): cb-input-area 사이드바 침범 수정)

---

## 1. 솔루션 개요

| 항목 | 내용 |
|------|------|
| 서비스명 | INNOCEAN AUDIENCE |
| URL | https://innocean-audience-291757702623.asia-northeast3.run.app |
| 기술 스택 | Frontend: 단일 index.html (바닐라 JS + Chart.js 4.4.2 CDN) / Backend: Node.js 20 + Express |
| 호스팅 | GCP Cloud Run (asia-northeast3) — Frontend(nginx:alpine) + Backend(node:slim) 분리 배포 |
| AI 엔진 | Vertex AI Gemini 2.5 Pro (structured output) + Google Search grounding |
| 데이터 출처 | AI 합성 페르소나 패널 N=30 (LLM 합성, 공개 매크로 통계 참고) + Google Trends BigQuery Public Dataset (실시간) |
| 대상 사용자 | 이노션 AE, 미디어팀, 기획팀, 글로벌 캠페인 담당자 |
| 캐시 정책 | Cache-Control: no-store |
| 폰트 | Pretendard Variable > Noto Sans KR, sans-serif |
| CSS 변수 | `--ind:#4F46E5` (키컬러), `--ind2:#4338CA`, `--bdr:#E5E7EB`, `--ts:#555`, `--tm:#767676` |

**핵심 가치**: 77개국 글로벌 타겟의 인구통계·라이프스타일·가치관·관심사·미디어·구매행태를 AI 합성 페르소나 N=30 패널로 정량 분석. 자연어 채팅과 빌더 기반 표준 분석 두 가지 진입점 제공.

---

## 2. 메뉴 구조 및 네비게이션

SPA 구조. 사이드바 5개 모드 + 빌더 워크스페이스로 구성. `state.currentMode`로 모드 전환 관리.

### 2.1 좌측 사이드바 (240px 고정)

| 영역 | 내용 |
|------|------|
| **브랜드 (sb-brand)** | INNOCEAN Audience 로고 + "Target Insight Solution" 부텍스트. 클릭 시 `goHome()` |
| **모드 메뉴** | 5개 모드 버튼 (sb-mode-btn, 활성 시 #4F46E5 배경) |
| **사용자 영역** | (숨김 슬롯, 호환성 유지) |
| **하단 (sb-foot)** | "BETA v0.1" 배지 + "INNOCEAN Audience" |

### 2.2 5개 모드

| 모드 ID | 라벨 | 진입점 | 핵심 기능 |
|---------|------|--------|----------|
| `chat` | AI 채팅 | 홈 첫 화면 기본 | 자연어로 타겟 질문 → AI 답변 카드 (KPI, 차트, 페르소나, 출처) |
| `insight` | 타겟 인사이트 | 빌더 워크스페이스 | 7개 표준 분석 탭 (요약/인물상/라이프스타일/가치관/관심사/구매/미디어) + 페르소나 |
| `library` | 채팅 라이브러리 | 사이드바 메뉴 | 과거 채팅 세션 저장·복원 (첫 질문이 제목) |
| `projects` | 분석 프로젝트 | 사이드바 메뉴 | 빌더 + 분석 결과 저장 프로젝트 (Phase 2 예정) |
| `presets` | 타겟 프리셋 | 사이드바 메뉴 | 자주 쓰는 빌더 조합 저장 |

### 2.3 헤더/푸터

별도 글로벌 헤더 없음. 모드별 콘텐츠가 사이드바 우측 전체 영역 차지.

---

## 3. AI 채팅 모드 (mode-chat)

### 3.1 목적

자연어로 타겟에 대한 질문 → AI가 인구통계·관심사·미디어·구매·페르소나·출처를 종합한 **답변 카드** 생성. 첫 화면 진입점.

### 3.2 첫 화면 (홈)

| 영역 | 내용 |
|------|------|
| 타이틀 | "어떤 타겟에 대해 알고 싶으세요?" — 24px, weight 700 |
| 입력창 | textarea + 종이비행기 버튼 (#4F46E5 그라데이션) |
| 추천 질문 칩 | 6개 — "Z세대 한류 팬", "일본 30대 워킹맘", "독일 친환경 소비자", "동남아 Z세대 미디어 소비", "프리미엄 쇼퍼 50대", "1인 가구 30대" |

### 3.3 답변 카드 (chat-board)

질문 전송 → `state.chatTurns`에 turn 추가 → `renderChatTurn(turn, idx)` 호출.

#### 3.3.1 첫 질문 (idx===0) — `renderAnswerBoard`

전체 인사이트 보고서 형태:

| 섹션 | 내용 |
|------|------|
| Headline | 한 줄 핵심 결론 (30~60자) |
| Narrative | 1~2문장 해설 (총 80자 이내) |
| KPI 카드 (4~6개) | 인구통계 비중, 미디어 점유율, 관심사 점수 등 |
| 차트 (2~4개) | 패널 데이터 기반 자동 생성 (Chart.js bar/pie/line) |
| 페르소나 샘플 (1~3개) | 가상 한국 이름 + 4~6개 속성 + 1인칭 voice |
| Sources | 첫 번째는 `INNOCEAN AI 페르소나 패널 N=30`, 추가로 Google Search 실시간 컨텍스트 |
| Related Insights | 1~3개 표준 분석 탭 점프 버튼 (life/mind/love/buy/media) |

#### 3.3.2 후속 질문 (idx>=1) — `renderAnswerBubble`

채팅 버블만:

- 회색 배경 (#F9FAFB), 좌측 정렬, max-width 78%, 좌측 하단 sharp corner
- `headline` + `narrative`만 표시 (KPI/차트/페르소나/sources 숨김)
- 범위 밖 답변(`inScope:false`) 시 OOS 버블

### 3.4 멀티턴 컨텍스트 (절대 준수 — CEO 2026-06-16 11:48)

- `state.chatTurns`에서 loading/error/현재 질문 제외 → 최근 6턴을 `priorTurns`로 전달
- 백엔드 `/api/insight`가 `priorTurns`를 받아 `priorBlock` 생성
- **동일 채팅 세션 내 모든 후속 질문은 무조건 후속 질문으로 처리** (일반 질문 가능성 0%)
- 이전 대화의 국가/세그먼트/주제를 현재 질문의 기본 맥락으로 이어받음
- 명시적 전환 표현("그러면 일본은?", "40대는 어때?")만 새 맥락

### 3.5 채팅 라이브러리 저장/복원

- **저장**: `saveChatTurn` — 첫 질문으로 세션 title 고정 (ChatGPT 방식, 마지막 질문 갱신 안 함)
- **복원**: `openChatSession` — `state.chatTurns = sess.turns.slice()` 전체 복원 + 첫 turn은 보고서로, 후속은 버블로 재렌더

### 3.6 사이드바 표준 분석 점프

답변 카드의 "라이프스타일 표준 분석 →" 버튼 → `chatBoardJumpToTab(tab)`:

1. `chat` 모드 종료 → `insight` 모드 진입
2. 첫 질문을 `/api/ask`로 파싱 → country + filters 자동 추출
3. 추출 안 된 차원은 `["전체"]`로 자동 채움
4. 빌더 렌더 + `runAnalysis({keepSynth:true})` 자동 실행
5. 해당 탭으로 전환

---

## 4. 타겟 인사이트 모드 (mode-insight)

### 4.1 목적

빌더(필터 선택)로 타겟을 정의하고, 7개 표준 분석 탭에서 AI 합성 패널 N=30 데이터를 시각화. 채팅 모드의 자연어 진입과 달리 명시적 차원 선택으로 정밀 분석.

### 4.2 레이아웃

| 영역 | 위치 | 너비 |
|------|------|------|
| 빌더 패널 | 좌측 | 320px (접힘 가능) |
| 분석 결과 | 우측 | 나머지 |

### 4.3 빌더 (Builder)

#### 4.3.1 국가 선택

- 지원 국가: **77개국**
- 기준국(`currentCountry`): 1개만 (CEO 2026-06-16 14:06 결정 — 단일 국가 정책 유지)
- 비교국(`compareCountries`): 최대 3개, **글로벌 비교 탭**에서만 매트릭스 표시

#### 4.3.2 차원 (Dimensions) — 6개 그룹 50+ 항목

| 그룹 | 라벨 | 차원 예시 |
|------|------|----------|
| **Who · 인구통계** | 인구통계 | 연령(10대~60대+), 성별, 가구 소득(상위 20%~하위 20%), 교육 수준, 가구 구성, 혼인 상태, 자녀 수, 자녀 연령, 직업, 거주 도시 규모, 거주 형태, 민족·문화 배경 |
| **Life · 라이프스타일** | 라이프스타일 | 라이프 단계, 일상 루틴, 운동·웰니스, 식습관, 여행·외식 빈도, 여행 유형, 반려동물, 외국어 능력, 종교, 사회 활동 |
| **Mind · 가치관·태도** | 가치관 | 핵심 가치관, 성격 유형(MBTI), 정치 성향, 리스크 태도, 환경 의식, 신기술 수용도, 웰빙 우선순위, 미래 전망, 브랜드 신뢰도, 삶의 만족도 |
| **Love · 관심사** | 관심사 | 관심사(다중), 선호 콘텐츠 장르, 음악 장르, 스포츠 종목, 게임 장르, 취미, K-콘텐츠 관여도 |
| **Media · 미디어** | 미디어 | OTT 플랫폼, SNS 플랫폼, 동영상 플랫폼, 메신저, 뉴스 채널, 음악 스트리밍, 미디어 소비 시간 |
| **Buy · 구매행동** | 구매 | 구매 결정 요인, 주요 쇼핑 채널, 카테고리별 지출 비중, 프리미엄 vs 가성비 선호, 친환경 구매 |

각 차원: 다중 선택 + "전체" 옵션 (default).

#### 4.3.3 빌더 자동 추론 (AI 채팅 → 인사이트 점프)

- 백엔드 `/api/ask` (Gemini 2.5 Pro structured output)이 자연어 질문을 country/filters JSON으로 파싱
- 룰베이스 fallback: `/z세대|gen z|젠지/` → age=["20대"], `/한류|K-?Pop/` → musicGenre=["K-Pop"], 등
- 추론 강도: ★★★(연령·음악 장르) ~ ★(국가) — 단서 약한 차원은 "전체"로 fallback
- 추출 후 `showAskBanner()`로 빌더 상단에 "이 빌더는 'Z세대 한류 팬' 질문에서 자동 추출됨" 안내

### 4.4 7개 표준 분석 탭

| 탭 ID | 라벨 | 표시 데이터 |
|-------|------|------------|
| `summary` | 요약 | 전체 KPI 카드 + 핵심 인사이트 3건 |
| `who` | 인물상 | 연령/성별/소득/직업/거주 분포 차트 + 페르소나 카드 |
| `life` | 라이프스타일 | 일상 루틴, 운동, 식습관, 여행, 사회활동 차트 |
| `mind` | 가치관 | 핵심 가치관, 성격, 환경/신기술 수용도, 삶의 만족도 |
| `love` | 관심사 | 관심사 Top 10, 선호 콘텐츠/음악/스포츠 장르 |
| `buy` | 구매 | 구매 결정 요인, 쇼핑 채널 점유율, 카테고리 지출 |
| `media` | 미디어 | OTT/SNS/동영상/메신저 점유율 + 미디어 소비 시간 |

### 4.5 페르소나 인터뷰 (Persona Interview)

- 표준 분석 결과 화면의 페르소나 카드 클릭 → 모달
- 백엔드 `/api/interview` (Gemini)로 1:1 대화형 인터뷰 (성별·연령에 맞는 호칭 일관성 절대 준수)
- 출력: 일상, 관심사, 구매 패턴, 미디어 사용에 대한 페르소나의 1인칭 답변

### 4.6 글로벌 비교 (Global Comparison)

- 빌더에서 비교국 선택 (최대 3개)
- 글로벌 비교 탭 활성화 → 기준국 vs 비교국 KPI 매트릭스
- 인구통계·미디어·관심사 차원별 비교 바 차트

---

## 5. 백엔드 API 라우트

| 경로 | 메서드 | 기능 |
|------|--------|------|
| `/api/ask` | POST | 자연어 질문 → country/filters/intent 파싱 (Gemini structured output) |
| `/api/audience/synthesize` | POST | 빌더 필터 → AI 합성 패널 N=30 생성 (LLM + 공개 통계 참고) |
| `/api/catalog` | GET | 차원·옵션 카탈로그 (디멘션 메타데이터) |
| `/api/compare` | POST | 기준국 vs 비교국 KPI 매트릭스 산출 |
| `/api/countries` | GET | 77개국 메타데이터 |
| `/api/dimension-insights` | POST | 단일 차원 심층 분석 |
| `/api/dimensions` | GET | 차원 그룹·메타데이터 |
| `/api/insight` | POST | **AI 채팅 답변 생성** (priorTurns 멀티턴 컨텍스트 반영) |
| `/api/insights` | POST | 7개 표준 분석 탭 데이터 (요약/who/life/mind/love/buy/media) |
| `/api/interview` | POST | 페르소나 인터뷰 1:1 대화 |
| `/api/library` | GET/POST/DELETE | 채팅 라이브러리 CRUD |
| `/api/media` | POST | 미디어 탭 전용 데이터 (OTT/SNS/메신저 점유율 + 시간) |
| `/api/research` | POST | 실시간 리서치 컨텍스트 (Google Search grounding) |
| `/api/stratify/country` | GET | 국가별 World Bank 매크로 지표 (인구·GDP·인터넷·도시화) |
| `/api/trends` | POST | Google Trends BigQuery Public Dataset 24h 갱신 |

### 5.1 `/api/insight` Prompt 구조

```
[성별 호칭 일관성 - 절대 준수]
[절대 원칙 — 데이터 중심, 글 최소화]
[입력으로 받는 INNOCEAN AI 페르소나 패널]
[중요 — 패널 해석 자세]
[답변 구조] (inScope, headline, narrative, personaSamples, sources, relatedInsights, outOfScopeMessage)
[작성 가이드]
[답변 다양성·시의성 가이드]
[부정 트렌드 키워드 — 절대 인용 금지]
[신조어·외래어·트렌드 용어 표기 규칙 — 절대 준수]   ← fix(39)
[범위 밖]
[언어]
---
사용자 질문: "..."
패널 기본 국가: ...
빌더 필터: ...
[priorBlock — 이전 대화 컨텍스트]                    ← fix(32~35)
패널 데이터
[동일 채팅 세션 규칙 — 절대 준수]                    ← fix(36)
[후속 질문 해석 원칙]
실시간 웹 검색 요약 (Google Search grounding)
```

### 5.2 신조어·외래어·트렌드 용어 표기 규칙 (fix 39)

- 형식: `한국어 표기(원어 표기, 발음): 의미 한 줄 설명`
- 예: `고생 취소(苦労キャンセル, 쿠로 캔슬): 굳이 고생할 필요 없다, 쉽게 가자 — AI/자동화/대행 서비스로 불필요한 노력을 덜어내는 가치관`
- 첫 등장 시 1회 병기, 같은 답변 내 재등장은 한국어 표기만
- 적용 범위: headline, narrative, voice, tagline, attributes, personaSamples 전체

---

## 6. 데이터 모델

### 6.1 합성 페르소나 패널 (N=30)

```js
{
  who:   { ageDistribution, genderDistribution, incomeDecile, occupationTop10, ... },
  life:  { dailyRoutine, wellness, dietPattern, travelFreq, ... },
  mind:  { coreValues, personalityType, envConscious, brandTrust, ... },
  love:  { interestsTop10, contentGenre, musicGenre, kContentEngagement, ... },
  buy:   { decisionFactors, shoppingChannels, categorySpend, premiumVsValue, ... },
  media: { ottTop5, snsTop5, videoTop5, messengerTop5, dailyMediaHours, ... }
}
```

### 6.2 채팅 답변 카드 (Answer)

```js
{
  inScope: true|false,
  headline: "한 줄 핵심 결론",
  narrative: "1~2문장 해설",
  personaSamples: [{ name, tagline, attributes[], voice }],
  sources: [{ label, url }],
  relatedInsights: [{ tab, label, reason }],
  outOfScopeMessage: null | "범위 밖 안내"
}
```

### 6.3 채팅 라이브러리 세션

```js
{
  id: string,
  title: string,        // 첫 질문 (fix 31~32)
  country: string,
  filters: {},
  turns: [
    { q: string, a: AnswerObject, ts: number }
  ],
  updatedAt: number
}
```

---

## 7. 핵심 정책 (CEO 절대 준수)

| 정책 | 결정일 | 적용 |
|------|--------|------|
| **룸챗 응답 규칙** | 2026-06-15 14:06 | `[Room: room-XXX]` 마커 있는 모든 인바운드 메시지는 curl로 해당 room_id 응답 송신 |
| **타겟 인사이트 분석 중 UI** | - | `state.analyzing` 플래그로 진행 중 loading UI |
| **점프 로딩** | - | `chatBoardJumpToTab` 시 `md-empty`/`sm-empty`/`iv-empty` 강제 숨김 |
| **라우팅 정책** | - | 홈 첫 화면 입력 = 항상 AI 채팅 답변 카드 |
| **멀티턴 채팅 규칙** | 2026-06-16 11:48 | 동일 chat 세션 안 모든 후속 질문은 무조건 후속 질문 처리 |
| **빌더 단일 국가 유지** | 2026-06-16 14:06 | 현재 상황 유지, 빌더 멀티 국가 관련 수정 금지 |
| **채팅 답변 형식 분리** | 2026-06-16 14:07 | 첫 질문 = 전체 보고서, 후속 질문 = 채팅 버블만 |
| **부정 트렌드 키워드 금지** | - | 논란/우울/범죄/안티팬 등 부정 단어·주제 절대 인용 금지 |
| **신조어 원어 병기** | 2026-06-16 15:11 | 한국어 표기(원어, 발음): 의미 형식 |

---

## 8. 변경 이력 (Fix 22~42)

| Fix | 일자 | 변경 |
|-----|------|------|
| 22~29 | 06-15 | UI 정리, 페르소나 라이브러리, PDF, 타겟 인사이트 분석 UI 일관성 |
| **30** | 06-16 11:06 | 페르소나 성별 호칭 일관성 (남성 페르소나가 보이그룹을 "오빠"라 부르는 버그) |
| 31 | 06-16 11:15 | 채팅 라이브러리 라벨/복원 (이후 32에서 정정) |
| **32** | 06-16 11:21 | 멀티턴 컨텍스트 + 첫 질문이 타이틀 (ChatGPT 방식) |
| 33 | 06-16 11:30 | priorTurns 필터 (loading/error/현재 질문 제외, slice(-6)) |
| 34 | 06-16 11:40 | priorBlock 선언 누락 수정 |
| 35 | 06-16 11:45 | 이전 대화 주제 국가/지역 우선 반영 |
| **36** | 06-16 11:55 | 동일 세션 = 무조건 후속 질문 처리 (절대 준수) |
| **37** | 06-16 14:07 | 후속 질문 답변은 채팅 버블만 (전체 보고서 X) |
| 38 | 06-16 14:15 | (revert) Brand Safety 표준 헤더/푸터 적용 |
| **38R** | 06-16 14:56 | fix(38) 원복 — Audience는 사이드바 구조 유지 |
| **39** | 06-16 15:11 | 신조어/외래어 트렌드 용어 원어 병기 규칙 |
| **40** | 06-16 15:29 | BETA 안내 정리| 41 | 06-16 15:36 | sb-foot 회색 배경 시도 (42에서 원복) |
| **42** | 06-16 15:39 | **cb-input-area가 사이드바 침범 수정** (left:64px → var(--sidebar-w)) |

---

## 9. 향후 로드맵

### Phase 1 (확정 진행)
- BigQuery 캐시 레이어 — 합성 페르소나 재현성 + LLM 비용 절감
- World Bank Open Data BQ JOIN — 국가별 매크로 통계 참고 강화
- Google Trends 24h 갱신 자동 노출

### Phase 2 (검토 중)
- 분석 프로젝트 모드 본격 활성화 (빌더 + 분석 결과 + 메모 저장)
- 채팅 라이브러리 검색·태그
- PDF 리포트 자동 생성

### Phase 3 (장기)
- INNOCEAN 자체 패널 BQ 적재 (실 검증 데이터로 합성 페르소나 보정)
- 캠페인 성과 데이터 연동 → 빌더 결과에 "예상 KPI"

---

## 10. 기술 부채

| 항목 | 우선순위 | 비고 |
|------|---------|------|
| 단일 index.html → 모듈화 | 낮음 | 현재 8,762줄. 라우터 도입 시 분리 |
| `#4F46E5` 직접 사용 → CSS variable | 낮음 | `--ind` 일관 사용으로 통합 |
| 백엔드 generateJSON 어댑터 통합 | 중간 | gemini.js 외 vertexai 직접 호출 일부 잔존 |
| 차트 일관성 (Chart.js v4 vs v3 옵션 혼재) | 중간 | 단계적 마이그레이션 |

---

## 11. 운영

- **배포**: `gcloud run deploy innocean-audience(-api) --source . --region=asia-northeast3`
- **빌드 캐시 방지**: Docker `--no-cache` 자동 (Cloud Run source 빌드)
- **검증 절차**: 배포 후 `curl + keyword check` → ALL PASSED → CEO 보고
- **모니터링**: Cloud Run 콘솔, 에러 시 Cloud Logging 자동
- **GitHub**: `github.com/InnoceanAX/AX-innocean-Audience` (main 브랜치, 즉시 배포)
