// trends-talkwalker.js — Talkwalker / Brandwatch / Meltwater 어댑터 (스텁)
// 사내 라이선스 의존: 광고대행사 특성상 사내에 이미 도입되어 있을 가능성 높음
// 실구현 TODO:
//   1. 사내 라이선스 확인 (Talkwalker 우선)
//   2. API 키 발급 + env TALKWALKER_TOKEN 주입
//   3. Trending Topics endpoint → terms[] 매핑
//   4. 다국적 (AE 외 다수국 지원) → ROUTING 확장 가능
//
// 도입 시 장점: 글로벌 SNS+뉴스+검색 통합 (Trends보다 풍부), 모든 미지원국 한번에 해결

export const META = {
  name: "Talkwalker (or Brandwatch/Meltwater)",
  source: "https://talkwalker.com",
  countries: ["AE", "CN", "RU", "*"],
  status: "not-implemented",
  requiredEnv: ["TALKWALKER_TOKEN"],
};

export async function getDailyTopTerms(country) {
  return {
    ok: false,
    supported: false,
    implemented: false,
    country,
    source: META.source,
    reason: "Talkwalker 어댑터 미구현. 사내 라이선스 확인 후 구현 예정.",
    next: "사내 미디어팀에 Talkwalker/Brandwatch/Meltwater 라이선스 보유 여부 문의 필요.",
  };
}
