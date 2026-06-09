// trends-supplementary.js — BigQuery 미지원국용 보조 어댑터 디스패처
// 인터페이스: BigQuery adapter와 동일한 응답 shape ({ ok, supported, country, terms[], updated })
// 각 어댑터는 별도 구현 (stub → 실제 어댑터로 교체)

import * as baidu from "./trends-baidu.js";
import * as yandex from "./trends-yandex.js";
import * as talkwalker from "./trends-talkwalker.js";

/**
 * 국가별 보조 어댑터 라우팅 규칙
 *  - CN  → Baidu Index
 *  - RU  → Yandex Wordstat
 *  - AE  → Talkwalker (대안: Yandex)
 *  - 그 외 → 미지원
 */
const ROUTING = {
  CN: baidu,
  RU: yandex,
  AE: talkwalker,
};

export async function getDailyTopTerms(country) {
  const adapter = ROUTING[country.toUpperCase()];
  if (!adapter) {
    return {
      ok: false,
      supported: false,
      country,
      reason: "보조 트렌드 어댑터가 등록되어 있지 않습니다.",
    };
  }
  return adapter.getDailyTopTerms(country);
}

export function getAvailableSupplementaryCountries() {
  return Object.keys(ROUTING);
}

export function getAdapterFor(country) {
  return ROUTING[country.toUpperCase()] || null;
}
