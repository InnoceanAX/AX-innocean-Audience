// media-supplementary.js — 매체 도달·신뢰도 보조 어댑터 (CEO 2026-06-17 정비)
//
// 노출 허용된 공개 출처만 SOURCE_META 로 export.
// 적용 예정/미연결 출처는 별도 파일/응답에서 제거하고, 코드 주석으로만 남김.
//
// 단일 출처 정의: lib/data-sources.js → PUBLIC_DATA_SOURCES
//
// 내부 전용 (응답·모달·sources 객체에 노출 금지):
//   GroupM / MAGNA / Dentsu / KOBACO 광고비 보고서 — backend 내부 추정치로만 사용.
//
// TODO (future, not exposed):
//   - INNOCEAN 사내 미디어 도달률 DB (사내 데이터팀 협의)
//   - Talkwalker Consumer Intelligence (라이선스 확인)
//   - Hootsuite / Meltwater 상세 라이선스 (We Are Social 별도)

import { PUBLIC_DATA_SOURCES, listActiveSources } from "../lib/data-sources.js";

function _src(id) { return PUBLIC_DATA_SOURCES.find(s => s.id === id) || null; }

// 라우트에서 노출하는 메타 — 적용 중인 4 공개 데이터 + 1 광고비.
// 모두 integrated: true. confidence 는 PUBLIC_DATA_SOURCES 의 confidence 그대로.
function _expose(id) {
  const s = _src(id);
  if (!s) return null;
  return {
    id: s.id,
    name: s.name,
    url: s.url,
    coverage: s.coverage,
    license: s.license,
    confidence: s.confidence,
    year: s.year,
    integrated: true,
  };
}

// CEO 2026-06-17 19:00: 공개 출처 4개 노출.
// CEO 2026-06-17 19:18 (광고비 3년 모델 옵션 C 확정) + 21:35 (SoT 통일 F-4):
//   광고비(adspend)도 PUBLIC_DATA_SOURCES 단일 출처에 포함 (WPP Media / MAGNA / Dentsu /
//   IAB+PwC / KOBACO 공개 보고서). SOURCE_META 에도 adspend 추가 → /api/media/sources
//   응답이 /api/media/landscape sources.active 와 일관되도록 5개로 정렬.
export const SOURCE_META = {
  worldBank:    _expose("worldBank"),
  statista:     _expose("statista"),
  dataReportal: _expose("dataReportal"),
  reuters:      _expose("reuters"),
  adspend:      _expose("adspend"),
};

// 활성(노출 허용) 출처만 배열 반환
export function getActiveSources() {
  return listActiveSources();
}

// 매체별 데이터 출처 추적 — 활성 5개 (worldBank/statista/dataReportal/reuters/adspend).
export function getDataSourceForMedia(_mediaId) {
  return {
    primary: "worldBank",
    secondary: ["dataReportal", "statista", "reuters", "adspend"],
    note: "World Bank 지표 + DataReportal/Statista/Reuters 베이스라인 + 공개 광고비 보고서 기반.",
  };
}
