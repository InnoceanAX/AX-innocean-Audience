# ARCHITECTURE — INNOCEAN Audience

## 절대 규칙 (변경 불가)

1. **단일 HTML 파일**: 모든 CSS / JS 는 `index.html` 안에 인라인. 별도 빌드 도구 없음.
2. **외부 의존**: Chart.js (CDN) + Pretendard 폰트 (CDN) **만** 허용. 다른 프레임워크 / 라이브러리 추가 금지.
3. **vanilla JS**: React / Vue / Svelte / jQuery 등 일체 사용 금지.
4. **이모지 사용 금지**: 모든 아이콘은 inline SVG (stroke 기반 line style).
5. **rounded-none**: 카드 / 버튼에 `border-radius` 사용 금지 (pill / FAB 등 chip 류는 예외).
6. **Cache-Control: no-store**: nginx 설정으로 항상 강제. 캐시 절대 금지.
7. **Brand Safety DOM 기준**: 디자인 토큰은 Brand Safety 솔루션 DOM 스펙이 baseline. 추정 금지.

## 디자인 토큰 (CSS Variables)

```css
:root{
  --ind:#4F46E5;        /* primary indigo */
  --ind2:#4338CA;       /* darker indigo */
  --bg:#FAFAFA;         /* page background */
  --bdr:#E5E7EB;        /* border gray */
  --ts:#555;            /* text secondary */
  --tm:#767676;         /* text muted */

  /* fixed chrome heights */
  --hh:70px;            /* header height */
  --sh:40px;            /* subheader height */
  --fh:80px;            /* footer height */
  --footer-border:#F0F0F0;
}
```

## Chrome (3 layers)

| 영역 | 위치 | 높이 | 주요 요소 |
|---|---|---|---|
| Header | fixed top | 70px | 로고 + 세로바 4×32px + `AUDIENCE` 라벨 + nav 7개 탭 |
| Subheader | fixed top+70 | 40px | 좌 `INNOCEAN AI SOLUTION` / 우 `Vol. 2026`, `border-bottom: 2px solid #000` |
| Footer | document end | 80px | 좌 `\| INNOCEAN` / 우 `© 2026 INNOCEAN. All rights reserved.` |

- 본문 `.wrap.poffset`은 `padding-top: var(--hh) + var(--sh)` 으로 fixed chrome 분량 확보.
- 홈 페이지(`body.home-mode`)에서는 베타 배너만 숨김. 헤더 / 서브헤더 / 푸터는 동일 표시.
- 홈 본문은 풀폭(랜딩 섹션이 `margin: 0 -24px`), 그 외 페이지는 `max-width: 1280px`.

## 카드 / 버튼 패턴

```css
.card{ border: 2px solid var(--bdr); padding: ...; border-radius: 0; }
.card:hover{ border-color: #000; }

.btn-pri{ background:#000; color:#fff; border-radius:0; }
.btn-sec{ background:#fff; color:#000; border:1px solid #000; border-radius:0; }
```

## SVG 아이콘 규약

- viewBox `0 0 24 24` 기본.
- `fill: none`, `stroke: currentColor`, `stroke-width: 1.8`, `stroke-linecap: round`, `stroke-linejoin: round`.
- `.ico` 기본 24×24, `.ico-sm` 14×14.

## 라우팅

브라우저 history API 기반.

- `navTo(id)` → `history.pushState({page:id}, '', '#'+id)` + `renderPage(id)`.
- `popstate` 이벤트 → state.page 복원.
- `DOMContentLoaded` → `location.hash` 읽어 초기 페이지 결정.
- 페이지 7개: `home / builder / insights / xtab / compare / discover / interview`.

## 차트

Chart.js 4.4 CDN. 모든 차트는 `.ch-card canvas` 안에 렌더.

```js
new Chart(ctx, {
  type: 'line'|'bar'|'doughnut'|'radar',
  data: { labels, datasets },
  options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{...} }}
});
```

색 팔레트는 `var(--ind)`, `#1F2937`, `#9CA3AF` 위주. RGBA 0.1~0.2 도 fill에 사용.

## 폴더 구조

```
AX-innocean-Audience/
├── index.html         # 모든 코드 (단일 파일)
├── Dockerfile         # nginx:alpine + COPY index.html
├── nginx.conf         # port 8080, Cache-Control no-store
├── README.md          # 인수인계 가이드
├── CHANGELOG.md       # 변경 이력
└── docs/
    ├── ARCHITECTURE.md  # 이 문서
    └── FEATURES.md      # 기능 명세
```

## 배포

GCP Cloud Run, `--no-cache` 빌드 강제, `Cache-Control: no-store` 유지.

```bash
gcloud run deploy innocean-audience --source . --region asia-northeast3 --allow-unauthenticated --port 8080 --quiet
```

## 보안

- API 키 / 토큰 / 비밀번호 등 비공개 정보 절대 깃 커밋 금지.
- 모든 secret 은 GCP Secret Manager 사용 예정 (Phase 2).
