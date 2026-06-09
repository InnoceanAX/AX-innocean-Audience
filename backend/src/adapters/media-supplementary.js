// media-supplementary.js — 매체 도달 신뢰성 보조 어댑터
// 1) 공개 출처 메타데이터 추가 (DataReportal Digital Yearbook, ITU)
// 2) 향후 Statista/사내 InnoceanData/Talkwalker 라이선스 들어오면 어댑터로 추가

// DataReportal Digital 2024 보고서 + ITU 데이터를 베이스라인으로 사용
// (수동 큐레이션된 신뢰도 보정 계수)
export const SOURCE_META = {
  worldBank: {
    name: "World Bank Open Data",
    url: "https://data.worldbank.org",
    coverage: "글로벌 인구·GDP·인터넷·도시화",
    license: "공개",
    confidence: 95,
  },
  dataReportal: {
    name: "DataReportal Digital Yearbook 2024",
    url: "https://datareportal.com/reports/digital-2024",
    coverage: "글로벌 매체별 사용률·시간",
    license: "공개 요약 (상세는 라이선스)",
    confidence: 85,
    integrated: false,
    todo: "Hootsuite/We Are Social 라이선스",
  },
  statista: {
    name: "Statista Media Outlook",
    url: "https://statista.com",
    coverage: "매체별 광고비·CPM",
    license: "유료 라이선스 필요",
    confidence: 92,
    integrated: false,
    todo: "라이선스 협의 중",
  },
  innoceanInternal: {
    name: "INNOCEAN 사내 미디어 도달률 DB",
    url: null,
    coverage: "한국·미주·EMEA 매체 도달률",
    license: "사내",
    confidence: 98,
    integrated: false,
    todo: "사내 데이터팀 협의 필요",
  },
  talkwalker: {
    name: "Talkwalker Consumer Intelligence",
    url: "https://talkwalker.com",
    coverage: "AE/중동·남미·러시아 소셜",
    license: "사내 라이선스 확인 필요",
    confidence: 88,
    integrated: false,
    todo: "라이선스 확인",
  },
};

// 매체별 데이터 출처 추적 (현재는 worldBank만, 향후 statista/innoceanInternal 매핑)
export function getDataSourceForMedia(mediaId) {
  return {
    primary: "worldBank",
    secondary: ["dataReportal"],
    note: "현재 World Bank 지표 + 베이스라인 모델. 실 패널 데이터 들어오면 교체.",
  };
}
