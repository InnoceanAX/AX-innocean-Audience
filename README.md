# INNOCEAN Audience

AI 페르소나 기반 오디언스 인사이트 솔루션 (Beta).

🔗 **Production:** https://innocean-audience-291757702623.asia-northeast3.run.app

---

## 빠른 시작

별도 빌드 도구 없음 — `index.html`을 브라우저로 열면 됩니다.

```bash
git clone https://github.com/InnoceanAX/AX-innocean-Audience.git
cd AX-innocean-Audience
open index.html
# 또는 python3 -m http.server 8000 후 http://localhost:8000
```

## Cloud Run 배포

GCP 프로젝트: `innocean-perf-apac-kr` (291757702623), 리전: `asia-northeast3`

```bash
gcloud run deploy innocean-audience \
  --source . \
  --region asia-northeast3 \
  --allow-unauthenticated \
  --port 8080 \
  --quiet
```

배포는 `Dockerfile`(nginx:alpine) + `nginx.conf`(port 8080, Cache-Control: no-store)로 처리됩니다.

## 배포 후 검증

```bash
URL="https://innocean-audience-291757702623.asia-northeast3.run.app"
curl -sI "$URL/" | grep -i "cache-control"
# cache-control: no-store 확인 필수
```

---

## 문서

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — 절대 아키텍처 규칙, 디자인 토큰, CSS 변수, 파일 구조
- [docs/FEATURES.md](docs/FEATURES.md) — 기능 명세, 페이지별 동작 규칙, 인터랙션 정책, AI 비서 동작
- [CHANGELOG.md](CHANGELOG.md) — 변경 이력

---

## 페이지 구성 (7개)

| 페이지 | URL hash | 설명 |
|---|---|---|
| 홈 | `#home` | 랜딩 페이지 (Hero / Stats / Capabilities / How it works / Final CTA) |
| 오디언스 빌더 | `#builder` | 30+ 디멘션 chip 토글로 타겟 세그먼트 정의 |
| 차트 & 인사이트 | `#insights` | KPI + Chart.js 4종 차트 |
| 교차분석 | `#xtab` | 행 × 열 cross-tab 매트릭스 |
| 오디언스 비교 | `#compare` | 두 세그먼트 A/B 비교 |
| 디스커버 | `#discover` | 자동 인사이트 카드 6장 |
| 페르소나 인터뷰 | `#interview` | 좌측 페르소나 6명 + 우측 1:1 채팅 |

브라우저 뒤로가기 / 앞으로가기 / 북마크 / 새로고침 모두 지원 (`history.pushState` + `popstate`).

---

## 주요 데이터 (v0 PoC)

- **도메인**: 전기차 구매 의향 30대 (EV buyers, 한국)
- **페르소나 풀**: 8,420명 (통계청 + KOSIS 기반 합성)
- **캘리브레이션**: 92% (Phase 2에서 BigQuery 실데이터 연동 예정)
- **대표 페르소나**: 민지(32, 맞벌이) / 준호(38, 테크 얼리어답터) / 서연(34, 인플루언서) / 현우(36, 실용주의) / 지원(31, 신혼) / 은채(40, 럭셔리)
