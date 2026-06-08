# FEATURES — INNOCEAN Audience

## 페이지 1: 홈 (`#home`)

### 섹션

1. **Hero** — Live Interview mock (좌측 텍스트 + 우측 인터뷰 미니카드).
2. **Stats band** — 4지표:
   - `8,420명` — 합성 페르소나 풀
   - `92%` — 캘리브레이션 정확도
   - `3분` — 인사이트 도출 평균
   - `1/40` — 전통 리서치 대비 비용
   - 본체 숫자 = 인디고, 단위 (`명/%/분/등`) = 회색 24px.
3. **Capabilities** — 카드 3장: 오디언스 정의 / 인사이트 분석 / 페르소나 인터뷰. 클릭 → 해당 페이지로 이동.
4. **How it works** — 4-STEP: 오디언스 정의 → 자동 분석 → 페르소나 인터뷰 → 인사이트 리포트.
5. **Final CTA** — 다크 배경, "오디언스 만들기" / "페르소나와 대화하기" 버튼.

### 동작

- 다른 페이지와 달리 본문이 풀폭 (좌우 마진 -24px).
- 헤더 / 서브헤더 / 푸터는 동일 표시. **베타 배너만 숨김**.

---

## 페이지 2: 오디언스 빌더 (`#builder`)

### 구성

- **상단 hero KPI 4개**: 세그먼트 사이즈 / 평균 연령 / 가구소득 / 구매 의향.
- **필터 그룹** (`.bld-grp`): 인구통계 / 라이프스타일 / 구매 행태 / 미디어 소비 등.
- **chip 토글** (`.chip`): 클릭 시 `.on` 토글, 다중 선택 가능.
- **aud-actions**: 저장 / 복제 / 인터뷰 시작 버튼.

### 인터랙션 규칙

| 액션 | 동작 |
|---|---|
| chip 클릭 | `toggleChip(el)` → `.on` 토글 → `recomputeAudienceSize()` |
| 사이즈 재산출 | 선택 비율(`onCount/totCount`) 기반, mock 공식 `1500 + ratio*12500` |
| 저장 | `audSave()` — mock 알림 |
| 복제 | `audDuplicate()` — mock 알림 |
| 인터뷰 시작 | `navTo('interview')` |

### 대표 페르소나 6장 (Persona card)

- 이름 / 나이 / 지역 / quoted "pain point" / "인터뷰" 버튼 표시.
- 인터뷰 버튼 클릭 → `selectPersona(name)` + `navTo('interview')`.

---

## 페이지 3: 차트 & 인사이트 (`#insights`)

### 구성

- **상단 KPI 4개** + **탭 5개** (전체 / 인구통계 / 구매 행태 / 미디어 소비 / 브랜드 인식).
- **Chart.js 4개**: 연령 분포 (bar) / 가구소득 (bar) / 브랜드 선호 (doughnut) / 구매 트리거 (radar).
- **인사이트 카드**: 자동 추출된 텍스트 요약.

### 인터랙션

- 탭 클릭 → `insightsTab(this)` → KPI 값을 0.85~1.15 배 mock 필터링 효과.
- 차트는 페이지 진입 시 1회 렌더 + 페이지 전환 시 재렌더.

---

## 페이지 4: 교차분석 (`#xtab`)

### 구성

- 행 × 열 cross-tab 매트릭스 3개: 연령×차종 / 소득×차종 / 자녀×트리거.
- 셀에 % 값 + 색 강도 (high cell highlight).
- 행 / 열 / 셀 셀렉터 버튼 3개.

### 인터랙션

- 셀렉터 클릭 → `xtabDim(label)` → 데모 메시지 alert. **Phase 2 백엔드 연동 시 동적 재집계**.

---

## 페이지 5: 오디언스 비교 (`#compare`)

### 구성

- 좌우 split: 오디언스 A / 오디언스 B.
- KPI 4개 좌우 비교 + 배지 (A 강점 / B 강점).

### 인터랙션

- 정적 표시 (Phase 2에서 토글 추가 예정).

---

## 페이지 6: 디스커버 (`#discover`)

### 구성

- 인사이트 카드 6장 — 강한 신호 / 차별점 / 미디어 채널 / 광고 카피 / 소득 분화 / 시간대.
- 각 카드에 표본 수 / 신뢰도 표시.
- 우측 상단 "새로고침" 버튼.

### 인터랙션

- 새로고침 클릭 → `discoverRefresh()` → 카드 페이드 + 신뢰도 88~97% 갱신.

---

## 페이지 7: 페르소나 인터뷰 (`#interview`)

### 구성

- **좌측 페르소나 리스트** 6명 (민지/준호/서연/현우/지원/은채).
- **우측 채팅 영역** + 입력창.
- 사전 정의 4턴 mock 대화.
- 추천 질문 4개 (`iv-quick`).

### 인터랙션

| 액션 | 동작 |
|---|---|
| 좌측 페르소나 클릭 | `selectPersona(name)` — 헤더 / 대화 전환 + 대화 이력 저장 |
| 추천 질문 클릭 | `ivQ(el)` — 입력창에 텍스트 채움 + focus |
| 전송 | `ivSend()` — typing indicator 1.1초 후 mock 응답 |
| 응답 엔진 | `mockReply(q)` — 키워드 매칭 (카피 / 가격 / 충전 / 안전 / 디자인 5종) |

### Phase 2 예정

- LLM 연동 (Gemini Flash 또는 OpenAI GPT-4o-mini).
- 페르소나별 시드 응답 5~7개 (현재는 6명 동일 응답).
- 대화 키워드 자동 추출 → 인사이트 카드 누적.

---

## 헤더 / 서브헤더 / 푸터

### 헤더

- INNOCEAN base64 로고 (24px h) + 검정 세로바 4×32px + 회색 `AUDIENCE` 라벨.
- 메뉴 7개: 홈 / 오디언스 빌더 / 차트 & 인사이트 / 교차분석 / 오디언스 비교 / 디스커버 / 페르소나 인터뷰.
- 클릭 시 `navTo(id)`.

### 서브헤더

- 좌: `INNOCEAN AI SOLUTION`
- 우: `Vol. 2026`
- `border-bottom: 2px solid #000`.

### 푸터

- 좌: `| INNOCEAN`
- 우: `© 2026 INNOCEAN. All rights reserved.`

---

## 브라우저 히스토리

- `history.pushState({page:id}, '', '#'+id)` — URL hash 변경.
- `popstate` 핸들러 → 페이지 복원.
- 초기 로드 시 `location.hash` 읽어 진입 페이지 결정.
- 북마크 / 새로고침 / 뒤로가기 / 앞으로가기 모두 지원.

---

## Phase 2 (백엔드 연동) 예정

1. BigQuery 실데이터 + 통계청 / KOSIS 캘리브레이션
2. LLM 인터뷰 (Gemini Flash)
3. PDF / Excel 내보내기 (실제 동작)
4. 세그먼트 URL 공유 (builder 상태도 hash 직렬화)
5. 다크 모드 (Report 패턴)
