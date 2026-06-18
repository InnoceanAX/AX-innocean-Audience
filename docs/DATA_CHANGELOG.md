# DATA_CHANGELOG.md

CEO 정인혁 2026-06-18 14:14-14:18 정직성 정책에 따른 데이터 변경 이력 추적 의무 기재.

라벨만 바꾸는 변경 ❌. 모든 라벨 변경 = 실제 데이터 갱신 동반 의무.

작성자: Sohee (CTO) · Chaeyeon (Data·Chart Engineer)

---

## 정직성 정책 6 원칙

1. **출처 없는 숫자 ❌** — 모든 BASELINE 수치는 명시 출처 + 연도 + URL
2. **라벨만 변경 ❌** — 라벨 갱신 ↔ 실제 데이터 갱신 동반
3. **Actuals ≠ Estimates ≠ Forecast** — dataKind 분류로 명시
4. **확신 ≠ 정밀** — 가중치 학술 근거 없으면 "균등 1/N" 보수 적용
5. **광고주 검증 가능** — 모든 매핑 규칙 = 코드 상수 + 출처 모달 노출
6. **데이터 부재 = "데이터 없음" 명시** — 거짓 데이터 X (CEO 14:40 Q1)

---

## 2026-06-18 — Phase 0+1 데이터 갱신 (commit b2361fb + 6cda441)

CEO 14:14-14:18 지침 반영. ALL PASSED 후 CEO 보고 (라이브 검증 대기).

### §1. 출처 라벨 25→26 일괄 갱신 (5 파일)

| 파일 | 변경 | 비고 |
|---|---|---|
| `backend/src/adapters/audience-public.js` | "Digital 2025" → "Digital 2026" | LIFESTYLE/MINDSET/INTERESTS 소스 라벨 |
| `backend/src/lib/data-sources.js` | "Digital 2025" → "Digital 2026" | PUBLIC_DATA_SOURCES 메타 |
| `backend/src/lib/narrative-helper.js` | "Digital 2025"/"We Are Social Digital 2025" → 2026 | 라이프/관심사 출처 라벨 |
| `backend/src/routes/audience.js` | "Digital 2025" → "Digital 2026" | 5개 엔드포인트 source.primary |
| `frontend/index.html` | "Digital 2025" → "Digital 2026" | UI 출처 라벨 |

**라벨 변경 정당성**: DataReportal Digital 2026 실제 fetch 완료 (Phase A, Chaeyeon 6국 fetch 결과 = §2). 데이터 갱신 동반 ✓

### §2. BASELINE LIFESTYLE 6국 갱신 (audience-public.js)

출처: DataReportal Digital 2026 (Kepios + ITU + GSMA Intelligence)

| 국가 | internet 25→26 | social 25→26 | 시연 정정 |
|---|---|---|---|
| KR | 97.2 → 97.9 (+0.7) | 84.6 → **95.4 (+10.8)** | 🔴 시연 정정 #3 |
| JP | 84.9 → 87.0 (+2.1) | 78.0 → 80.5 (+2.5) | |
| CN | 76.4 → **91.6 (+15.2)** | 70.2 → **90.3 (+20.1)** | 🔴🔴 시연 정정 #1, #2 |
| **TW** | (부재) → **96.7 신규** | (부재) → **78.4 신규** | TW BASELINE 5dim 부재 해결 |
| TH | 88.0 → 94.7 (+6.7) | 73.0 → 79.1 (+6.1) | |
| PH | 73.0 → **83.8 (+10.8)** | 80.0 → 81.9 (+1.9) | 🔴 시연 정정 #4 |

### §3. BASELINE DEMOGRAPHICS 6국 갱신

출처: UN World Population Prospects 2025

| 국가 | medianAge 25→26 | urbanRate 25→26 |
|---|---|---|
| KR | 45.0 → 45.6 (+0.6) | 81.5 → 81.6 (+0.1) |
| JP | 49.1 → 49.8 (+0.7) | 92.0 → 92.2 (+0.2) |
| CN | 39.0 → 40.1 (+1.1) | 65.2 → 66.7 (+1.5) |
| **TW** | (부재) → **44.8 신규** | (부재) → **80.9 신규** | (TW 5dim 부재 해결) |
| TH | 40.1 → 40.6 (+0.5) | 52.0 → 55.2 (+3.2) |
| PH | 25.7 → 26.1 (+0.4) | 47.7 → 49.1 (+1.4) |

### §4. TW BASELINE 5dim 신규 작성

이전 부재 상태였던 TW의 5dim 객체 신규 작성. 정합성 이슈 해결.

- **DEMOGRAPHICS**: UN WPP 2025 직접 반영
- **LIFESTYLE**: DR 2026 + GWI Pro 부재 항목은 큐레이션 추정 (출처 메타 명시)
- **MINDSET**: Hofstede Insights TW 정규화 적용 (IDV 17→28, LTO 93→76, UAI 69→58)
- **INTERESTS**: 큐레이션 추정 (GWI Pro 라이선스 결정 시 재갱신)
- **PURCHASE_BEHAVIOR**: 큐레이션 추정 (Statista 라이선스 검토)

dataKind 분류: official (Demo/Lifestyle) + estimate (Interests/Purchase) + mixed (Mindset)

### §5. WB ISO2_TO_WB 매핑 확장 35→77국

`backend/src/adapters/worldbank.js`에 42국 ISO3 추가:

AT, BD, BE, BG, BH, CH, CZ, DK, EC, EE, ET, FI, GH, GR, HR, HU, IE, IL, JO, KE, KH, KW, KZ, LK, LT, LV, MA, MM, MN, NG, NO, OM, PE, PK, PT, QA, RO, SI, SK, UA, UY, VE

**효과**: UI 77국 모두 WB live API fetch 100% 정확. 이전 35국만 매핑되어 42국은 fallback 데이터.

### §6. AUDIENCE_SOURCES_BY_COUNTRY 신규 (audience-public.js)

6국 × 5dim = 30 cells per-country 출처 메타. dataKind/license/notes 명시.

특이 사항:
- **CN mindset**: "Reuters DNR 2026 China NOT included (404). CNNIC 영문 abstract 사용. 한계 명시" → 정직 표기
- **PH lifestyle**: "DR 83.8% (Kepios+ITU) vs Reuters DNR 67% (디지털 뉴스 소비 인구). 두 출처 정의 다름" → 정의 차이 명시
- **TW 전체**: "신규 작성 (TW BASELINE 5dim 부재 해결)" → 신규 사실 명시

### §7. 해석 C 적용 (routes/audience.js — maybePersonaPoolPayload)

CEO 14:40 Q2 "근거 없는 추정 ❌" 1차 해결.

- 페르소나 풀 응답에 `baselineRef` 추가 (페르소나 산출값 + BASELINE 원천 통계 동시 노출)
- `sourceMeta` 추가 (AUDIENCE_SOURCES_BY_COUNTRY 직접 매핑)
- 광고주 양측 검증 가능 — "페르소나 어디서?" "BASELINE 어디서?" 모두 답변 가능

### §8. Frontend 3-tier UI + 출처 모달 해석 C 3섹션 (commit 6cda441)

CEO 14:40 Q1 답변 "데이터 없음 표시" 적용.

- **Tier 1 (6국, 인디고 #4F46E5)**: 페르소나 + BASELINE + AI 내러티브
- **Tier 2 (38국, 슬레이트 #475569)**: BASELINE 공개 통계만 (페르소나 X)
- **Tier 3 (그 외 ~33국, 회색 #94A3B8 disabled)**: 거시 지표만 + "데이터 없음" 모달
- 출처 모달 3섹션: ① 페르소나 산출 출처 / ② BASELINE 원천 통계 출처 / ③ 두 채널 관계 (해석 C)
- sourceMeta dataKind 색상 분류: official(녹색) / mixed,partial(노랑) / estimate(회색)

---

## 정합성 진단 결과 (Chaeyeon, 16:00)

### 3채널 분기 (페르소나 ↔ BASELINE 완전 분리, CEO 2번 지시 위배 사실 확인)

1. **페르소나 풀** (cohort-builder COUNTRY_DEMO → aggregateAll): BASELINE 무관
2. **정적 BASELINE** (audience-public.js → 직접 반환): 페르소나 무관
3. **LLM 합성** (/synthesize, BASELINE → Gemini): 페르소나 무관

→ CEO 14:40 "근거 없는 추정 ❌" 위배 원인 = 3채널 분기.

### D+B 하이브리드 채택 (CEO 17:35 확인)

- **즉시 D (Phase 1f, 1.5일)**: 명시적 매핑 + 가중 평균
  - `backend/src/lib/dimension-mapping.js` 신규 (~32 매핑 규칙)
  - 6차원 = BASELINE 항목들의 명시 매핑으로 산출
  - 광고주 검증 100% (코드 상수 + 출처 모달)
- **장기 B (Phase 1.6, 3일)**: 페르소나 BASELINE 기반 재합성
  - BASELINE 4항목 신규 (sexRatio/regions/occupation/incomeQuintiles 29국)
  - cohort-builder COUNTRY_DEMO → BASELINE derive 재설계
  - 페르소나 6국 × 100 재합성
- **합쳐서 D+B = 이중 정합성** (페르소나 + 분석 결과 모두 BASELINE 추적 가능)

---

## 변경 이력 메타 표

| 일자 | 변경 | Owner | Commit | 상태 |
|---|---|---|---|---|
| 2026-06-18 17:15 | Phase 0+1 backend (§1-§7) | Sohee | b2361fb | Cloud Build 자동 트리거 미발동 ⚠️ |
| 2026-06-18 17:30 | Frontend 3-tier UI + 출처 모달 (§8) | Chaeyeon (patch) → Sohee (commit) | 6cda441 | Cloud Build 자동 트리거 미발동 ⚠️ |
| 2026-06-18 17:41 | Empty commit trigger | Sohee | 72618465 | 강제 트리거 시도 |
| 2026-06-18 17:55 | DATA_CHANGELOG.md 신규 | Chaeyeon (paste) → Sohee (commit) | (이 commit) | 정직성 인프라 |
| 2026-06-19+ | Phase 1f D 적용 (dimension-mapping.js) | 둘 다 | TBD | CEO D+B 채택 ✓ 17:35 |
| 2026-06-21+ | Phase 1.6 B 적용 (페르소나 재합성) | 둘 다 | TBD | CEO D+B 채택 ✓ 17:35 |
| TBD | Phase 1.5 라이선스 결정 | CEO | — | GWI Pro / Statista Pro / Reuters API |

---

## 다음 변경 예정

### Phase 1f (D, 1.5일) — CEO 17:35 채택

`backend/src/lib/dimension-mapping.js` 신규:
- WHO 4 매핑 / LIFE 5 매핑 / MIND 6 매핑 / LOVE 6 매핑 / BUY 6 매핑 / MEDIA 5 매핑 = 32 매핑
- `applyMapping(country, baselines, ruleSet)` 함수
- 원천 부재 시 null 반환 → UI "데이터 없음" 자동
- 출처 메타 자동 노출 (출처 모달)
- consistency check (±5%p 자동 검증)

`backend/src/routes/audience.js` 통합:
- 페르소나 풀 분기에 mapping 결과 추가
- `consistency` 필드 (페르소나 ↔ 매핑 정합성 ±5%p)

`frontend/index.html` 출처 모달:
- 매핑 흐름 시각화 (① BASELINE → ② 매핑 규칙 → ③ 6차원 결과)
- 가중치 + source + rationale 메타 직접 노출

### Phase 1.6 (B, 3일) — CEO 17:35 채택

`backend/src/adapters/audience-public.js` BASELINE 4항목 신규 (29국):
- DEMOGRAPHICS.{}.sexRatio (UN WPP 2025)
- DEMOGRAPHICS.{}.regions (큐레이션)
- DEMOGRAPHICS.{}.occupationDistribution (ILO STAT)
- DEMOGRAPHICS.{}.incomeQuintiles (분포, WB GINI)

`backend/src/lib/cohort-builder.js` 재설계:
- COUNTRY_DEMO 객체 → BASELINE import 후 derive
- ageBucketWeights 재집계 공식 적용

페르소나 6국 × 100 재합성 + SQLite DB 재생성.

### Phase 1.5 (CEO 라이선스 결정 시)

- GWI Pro 도입 → avgInternetTime / activities% / travel / dining 등 정밀 데이터
- Statista Pro 도입 → BASELINE 29→50→77국 확장
- Reuters DNR JP/TW/TH/CN 후반 정량 차트 fetch + mindset 통합

---

## 보존 자료 (사양 + 분석)

### Chaeyeon 자료
- `/workspace/_data-2026/datareportal-6countries-headlines.md`
- `/workspace/_data-2026/comparison-current-vs-2026.md`
- `/workspace/_data-2026/reuters-dnr-2026-summary.md`
- `/workspace/_data-2026/AUDIENCE_SOURCES-per-country-draft.md`
- `/workspace/_mockups/country-selector-3tier.html`
- `/workspace/_patch-prep/cohort-baseline-mapping.md` (후보 B 작업 범위 산정)
- `/workspace/_patch-prep/dimension-mapping-spec.md` (후보 D 완전 사양)
- `/workspace/reports/coverage-plan-v2.md` (v2 통합 보고서)

### Sohee 자료
- `/workspace/_data-2026/SUMMARY-6countries.md`
- `/workspace/_data-2026/{KR,JP,CN,TW,TH,PH}-2026-extracted.md`
- `/workspace/_patch-prep/phase-B-spec.md`
- `/workspace/_patch-prep/phase-0a-worldbank-mapping.md`
- `/workspace/_patch-prep/TW-baseline-new-objects.md`
- `/workspace/_patch-prep/phase-1c-reuters-additions.md`
- `/workspace/_patch-prep/AUDIENCE_SOURCES_BY_COUNTRY-spec.md`
- `/workspace/_patch-prep/interpretation-C-spec.md`
- `/workspace/reports/coverage-plan-v1.md`
