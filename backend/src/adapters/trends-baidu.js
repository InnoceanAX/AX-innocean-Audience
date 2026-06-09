// trends-baidu.js — Baidu Index 어댑터 (스텁)
// 실구현 TODO:
//   1. Baidu Index API 가입: https://index.baidu.com/v2/api
//   2. API 키를 env BAIDU_INDEX_TOKEN 으로 주입
//   3. fetch + Bearer 인증, JSON 응답 → { rank, term, score } 매핑
//   4. 일일 24h 캐시 (BigQuery adapter와 동일)
// 대안: 비공식 baidu-index-py 같은 라이브러리도 있으나 봇 차단 빈번

export const META = {
  name: "Baidu Index",
  source: "https://index.baidu.com",
  countries: ["CN"],
  status: "not-implemented",
  requiredEnv: ["BAIDU_INDEX_TOKEN"],
};

export async function getDailyTopTerms(country) {
  return {
    ok: false,
    supported: false,
    implemented: false,
    country,
    source: META.source,
    reason: "Baidu Index 어댑터 미구현. API 키 발급 후 구현 예정.",
    next: "사내에 Baidu Index 계정이 있는지 확인 필요.",
  };
}
