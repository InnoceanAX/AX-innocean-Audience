// 18 산업 무관 디멘션 카탈로그
// 4 그룹: Demographics / Lifestyle / Digital / Consumer
// 각 디멘션 = 옵션 리스트 + 메타

export const DIMENSION_GROUPS = {
  demographics: {
    label: "인구통계",
    icon: "users",
    order: 1,
  },
  lifestyle: {
    label: "라이프스타일·가치관",
    icon: "heart",
    order: 2,
  },
  digital: {
    label: "디지털·미디어",
    icon: "monitor",
    order: 3,
  },
  consumer: {
    label: "소비·구매",
    icon: "shopping",
    order: 4,
  },
};

export const DIMENSIONS = [
  // === Demographics (6) ===
  {
    id: "age", group: "demographics", label: "연령",
    options: ["10대", "20대", "30대", "40대", "50대", "60대 이상"],
    multi: true,
  },
  {
    id: "gender", group: "demographics", label: "성별",
    options: ["남성", "여성", "기타·무응답"],
    multi: true,
  },
  {
    id: "income", group: "demographics", label: "가구 소득",
    options: ["하위 20%", "20~40%", "40~60%", "60~80%", "상위 20%"],
    multi: true,
  },
  {
    id: "education", group: "demographics", label: "교육 수준",
    options: ["고졸 이하", "대학 재학·졸업", "대학원 이상"],
    multi: true,
  },
  {
    id: "household", group: "demographics", label: "가구 구성",
    options: ["1인 가구", "신혼·무자녀", "유자녀 가구", "성인 가족", "노년 가구"],
    multi: true,
  },
  {
    id: "occupation", group: "demographics", label: "직업",
    options: ["사무·관리", "전문직", "서비스·판매", "기능·노무", "자영업", "주부·학생", "무직·은퇴"],
    multi: true,
  },

  // === Lifestyle (5) ===
  {
    id: "interests", group: "lifestyle", label: "관심사",
    options: ["여행", "음식·요리", "운동·웰니스", "패션·뷰티", "테크·가젯", "엔터테인먼트", "독서·자기계발", "반려동물", "육아·교육", "재테크·투자", "환경·지속가능성", "예술·문화"],
    multi: true,
  },
  {
    id: "values", group: "lifestyle", label: "가치관·태도",
    options: ["가족 중심", "성취·커리어 지향", "관계·소속감", "자유·개성", "건강·웰빙", "환경·지속가능성", "전통·안정", "혁신·도전", "공정·다양성"],
    multi: true,
  },
  {
    id: "lifeStage", group: "lifestyle", label: "라이프 단계",
    options: ["학생", "사회 초년", "결혼 준비", "신혼", "육아기", "자녀 독립", "은퇴 준비"],
    multi: true,
  },
  {
    id: "travel", group: "lifestyle", label: "여행·외식 빈도",
    options: ["주 1회 이상", "월 1~3회", "분기 1~2회", "연 1~2회", "거의 안 함"],
    multi: false,
  },
  {
    id: "wellness", group: "lifestyle", label: "운동·웰니스",
    options: ["주 3회 이상 운동", "주 1~2회", "비정기", "관심 있음", "관심 없음"],
    multi: false,
  },

  // === Digital (4) ===
  {
    id: "media", group: "digital", label: "주 사용 매체",
    options: ["TV·OTT", "YouTube", "Instagram", "TikTok", "Facebook", "X (Twitter)", "LinkedIn", "검색 포털", "뉴스 앱", "팟캐스트"],
    multi: true,
  },
  {
    id: "mediaTime", group: "digital", label: "일 매체 시간",
    options: ["1시간 미만", "1~3시간", "3~5시간", "5시간 이상"],
    multi: false,
  },
  {
    id: "device", group: "digital", label: "주 사용 디바이스",
    options: ["모바일", "데스크탑·노트북", "태블릿", "스마트 TV", "스마트워치·웨어러블"],
    multi: true,
  },
  {
    id: "adReceptivity", group: "digital", label: "광고 수용도",
    options: ["광고 친화", "중립", "광고 회피", "유료 무광고 선호"],
    multi: false,
  },

  // === Consumer (3) ===
  {
    id: "shoppingChannel", group: "consumer", label: "쇼핑 채널",
    options: ["오프라인 매장", "온라인 종합몰", "라이브 커머스", "소셜 커머스", "해외 직구", "구독 서비스"],
    multi: true,
  },
  {
    id: "payment", group: "consumer", label: "결제 수단",
    options: ["신용카드", "체크카드", "간편결제 (페이)", "BNPL·후불결제", "현금·계좌이체", "암호화폐"],
    multi: true,
  },
  {
    id: "purchaseDriver", group: "consumer", label: "구매 결정 요인",
    options: ["가격·가성비", "품질·내구성", "브랜드·이미지", "리뷰·평판", "디자인·트렌드", "친환경·윤리", "혁신·기능", "추천·인플루언서"],
    multi: true,
  },
];
