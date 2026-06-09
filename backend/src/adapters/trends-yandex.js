// trends-yandex.js — Yandex Wordstat 어댑터 (스텁)
// 실구현 TODO:
//   1. Yandex Direct API OAuth 토큰 발급: https://yandex.com/dev/direct/doc/dg-v4/concepts/auth-token.html
//   2. Wordstat Report API 사용 (POST https://api.direct.yandex.com/v4/json/)
//   3. env YANDEX_DIRECT_TOKEN 주입
//   4. KeywordsReport → terms[] 매핑
//   5. 24h 캐시
// 참고: 무료 가입 가능하지만 Direct(광고) 계정 필요. INNOCEAN 러시아 거점에 광고 계정 있을 가능성 ↑

export const META = {
  name: "Yandex Wordstat",
  source: "https://wordstat.yandex.com",
  countries: ["RU"],
  status: "not-implemented",
  requiredEnv: ["YANDEX_DIRECT_TOKEN"],
};

export async function getDailyTopTerms(country) {
  return {
    ok: false,
    supported: false,
    implemented: false,
    country,
    source: META.source,
    reason: "Yandex Wordstat 어댑터 미구현. OAuth 토큰 발급 후 구현 예정.",
    next: "사내 러시아 거점에 Yandex Direct 계정이 있는지 확인 필요.",
  };
}
