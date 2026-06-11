// GWI/Statista 수준 고도화 디멘션 카탈로그
// 6 그룹: Who (인구) / Life (라이프) / Mind (가치관) / Love (관심사) / Media (미디어) / Buy (구매)
// 모든 옵션 맨 앞에 "전체" 자동 포함
// 각 디멘션 = 옵션 리스트 + 메타

const ALL = "전체";
const withAll = (arr) => [ALL, ...arr];

export const DIMENSION_GROUPS = {
  who: {
    label: "Who · 인구통계",
    icon: "users",
    order: 1,
  },
  life: {
    label: "Life · 라이프스타일",
    icon: "heart",
    order: 2,
  },
  mind: {
    label: "Mind · 가치관·태도",
    icon: "brain",
    order: 3,
  },
  love: {
    label: "Love · 관심사",
    icon: "star",
    order: 4,
  },
  media: {
    label: "Media · 미디어",
    icon: "monitor",
    order: 5,
  },
  buy: {
    label: "Buy · 구매행동",
    icon: "shopping",
    order: 6,
  },
};

export const DIMENSIONS = [
  // ============ Who (12) ============
  {
    id: "age", label: "연령", group: "who",
    options: withAll(["10대", "20대", "30대", "40대", "50대", "60대 이상"]),
  },
  {
    id: "gender", label: "성별", group: "who",
    options: withAll(["남성", "여성", "기타·무응답"]),
  },
  {
    id: "income", label: "가구 소득", group: "who",
    options: withAll(["하위 20%", "20~40%", "40~60%", "60~80%", "상위 20%"]),
  },
  {
    id: "education", label: "교육 수준", group: "who",
    options: withAll(["고졸 이하", "대학 재학·졸업", "대학원 이상"]),
  },
  {
    id: "household", label: "가구 구성", group: "who",
    options: withAll(["1인 가구", "신혼·무자녀", "유자녀 가구", "다세대 가족", "성인 가족", "노년 가구"]),
  },
  {
    id: "maritalStatus", label: "혼인 상태", group: "who",
    options: withAll(["미혼", "기혼", "동거", "이혼·별거", "사별"]),
  },
  {
    id: "kidsCount", label: "자녀 수", group: "who",
    options: withAll(["없음", "1명", "2명", "3명 이상"]),
  },
  {
    id: "kidsAge", label: "자녀 연령", group: "who",
    options: withAll(["영유아 (0~5)", "초등 (6~12)", "중·고 (13~18)", "성인 (19+)"]),
  },
  {
    id: "occupation", label: "직업", group: "who",
    options: withAll(["사무·관리", "전문직", "서비스·판매", "기능·노무", "자영업", "주부", "프리랜서", "무직·은퇴", "공무원·공공", "예술·문화", "IT·테크", "학생"]),
  },
  {
    id: "cityTier", label: "거주 도시 규모", group: "who",
    options: withAll(["대도시 (메가시티)", "중소도시", "읍·면 지역", "교외·외곽"]),
  },
  {
    id: "housing", label: "거주 형태", group: "who",
    options: withAll(["자가 아파트", "자가 단독·빌라", "전·월세", "쉐어하우스·룸메이트", "기숙·사택"]),
  },
  {
    id: "ethnicity", label: "민족·문화 배경", group: "who",
    options: withAll(["주류 인구", "소수 민족·다문화", "이민자·1세대", "외국인 거주자"]),
  },

  // ============ Life (10) ============
  {
    id: "lifeStage", label: "라이프 단계", group: "life",
    options: withAll(["학생", "사회 초년", "결혼 준비", "신혼", "육아기", "자녀 독립", "은퇴 준비", "은퇴기"]),
  },
  {
    id: "dailyRoutine", label: "일상 루틴", group: "life",
    options: withAll(["얼리버드 (~6시 기상)", "정상 (6~8시)", "올빼미 (~10시)", "야간 근무·교대"]),
  },
  {
    id: "wellness", label: "운동·웰니스", group: "life",
    options: withAll(["주 3회 이상 운동", "주 1~2회", "월 1~3회", "비운동·관심 있음", "비운동·관심 없음"]),
  },
  {
    id: "diet", label: "식습관", group: "life",
    options: withAll(["일반식", "다이어트·저칼로리", "비건·채식", "고단백·근력", "글루텐프리", "유기농 선호", "할랄·코셔"]),
  },
  {
    id: "travel", label: "여행·외식 빈도", group: "life",
    options: withAll(["주 1회 이상", "월 1~3회", "분기 1~2회", "연 1~2회", "거의 안 함"]),
  },
  {
    id: "travelType", label: "여행 유형", group: "life",
    options: withAll(["국내 단기", "국내 장기", "해외 단기", "해외 장기", "백패킹·자유여행", "패키지·럭셔리"]),
  },
  {
    id: "petOwnership", label: "반려동물", group: "life",
    options: withAll(["없음", "강아지", "고양이", "소동물 (햄스터·물고기·새 등)", "파충류·이색"]),
  },
  {
    id: "languages", label: "외국어 능력", group: "life",
    options: withAll(["모국어만", "영어 가능", "영어 + 1개 언어", "다중언어 (3+)", "학습 중"]),
  },
  {
    id: "religion", label: "종교", group: "life",
    options: withAll(["무종교", "개신교", "천주교", "불교", "이슬람", "힌두교", "유대교", "기타"]),
  },
  {
    id: "socialActivity", label: "사회 활동", group: "life",
    options: withAll(["자원봉사", "동호회·커뮤니티", "정치·시민 활동", "종교 활동", "직장 외 모임 없음"]),
  },

  // ============ Mind (10) ============
  {
    id: "values", label: "핵심 가치관", group: "mind",
    options: withAll(["가족 중심", "성취·커리어", "관계·소속감", "자유·개성", "건강·웰빙", "환경·지속가능성", "전통·안정", "혁신·도전", "공정·다양성", "영성·내면"]),
  },
  {
    id: "personalityType", label: "성격 유형", group: "mind",
    options: withAll(["외향 (E)", "내향 (I)", "현실 (S)", "직관 (N)", "사고 (T)", "감정 (F)", "계획 (J)", "탐색 (P)"]),
  },
  {
    id: "politicalLean", label: "정치 성향", group: "mind",
    options: withAll(["진보", "중도진보", "중도", "중도보수", "보수", "무관심"]),
  },
  {
    id: "riskAttitude", label: "리스크 태도", group: "mind",
    options: withAll(["매우 보수적", "안정 추구", "균형형", "도전 선호", "고위험 감수"]),
  },
  {
    id: "envConscious", label: "환경 의식", group: "mind",
    options: withAll(["매우 적극적", "관심 있음", "보통", "관심 없음", "회의적"]),
  },
  {
    id: "techAdoption", label: "신기술 수용도", group: "mind",
    options: withAll(["얼리어답터", "조기 다수", "후기 다수", "지연 수용자", "회의적"]),
  },
  {
    id: "wellbeingFocus", label: "웰빙 우선순위", group: "mind",
    options: withAll(["신체 건강", "정신 건강", "재정 안정", "사회적 관계", "자기계발", "여가·취미"]),
  },
  {
    id: "futureOutlook", label: "미래 전망", group: "mind",
    options: withAll(["매우 낙관적", "약간 낙관", "중립", "약간 비관", "매우 비관적"]),
  },
  {
    id: "brandTrust", label: "브랜드 신뢰도", group: "mind",
    options: withAll(["대기업 선호", "중소·로컬 선호", "신생·스타트업 개방", "브랜드 무관심", "윤리 브랜드 선호"]),
  },
  {
    id: "lifeSatisfaction", label: "삶의 만족도", group: "mind",
    options: withAll(["매우 만족", "만족", "보통", "불만족", "매우 불만족"]),
  },

  // ============ Love (10) ============
  {
    id: "interests", label: "관심사 (다중)", group: "love",
    options: withAll(["여행", "음식·요리", "운동·스포츠", "패션·뷰티", "테크·가젯", "엔터테인먼트", "독서·자기계발", "반려동물", "육아·교육", "재테크·투자", "환경·지속가능성", "예술·문화", "자동차", "인테리어·홈", "헬스·웰니스"]),
  },
  {
    id: "contentGenre", label: "선호 콘텐츠 장르", group: "love",
    options: withAll(["드라마", "예능·코미디", "영화", "다큐멘터리", "스포츠", "뉴스·시사", "음악·공연", "K-Pop", "애니메이션", "게임 스트리밍", "튜토리얼·교육", "Vlog·일상"]),
  },
  {
    id: "musicGenre", label: "음악 취향", group: "love",
    options: withAll(["K-Pop", "팝", "록·메탈", "힙합·R&B", "재즈·블루스", "클래식", "EDM·일렉트로닉", "발라드·트로트", "인디·얼터너티브", "라틴·월드"]),
  },
  {
    id: "sportInterest", label: "선호 스포츠", group: "love",
    options: withAll(["축구", "야구", "농구", "배구", "골프", "테니스", "e스포츠", "격투기", "익스트림", "스포츠 관심 없음"]),
  },
  {
    id: "hobbyType", label: "취미 유형", group: "love",
    options: withAll(["수집·소장", "DIY·공예", "사진·영상", "글쓰기·블로그", "악기·작곡", "쿠킹·베이킹", "정원·플랜테리어", "보드게임·TRPG", "야외 활동"]),
  },
  {
    id: "fandomLevel", label: "팬덤 활동", group: "love",
    options: withAll(["헤비 팬 (굿즈·콘서트)", "라이트 팬 (콘텐츠만)", "관심 정도", "비팬", "안티"]),
  },
  {
    id: "celebrityFollow", label: "셀럽·인플루언서 팔로우", group: "love",
    options: withAll(["K-Pop 아이돌", "할리우드 스타", "유튜버·BJ", "스포츠 스타", "패션·뷰티 인플루언서", "정치인·논객", "기업가·CEO", "팔로우 없음"]),
  },
  {
    id: "gamingType", label: "게임 유형", group: "love",
    options: withAll(["모바일 캐주얼", "모바일 RPG·전략", "PC 온라인 게임", "콘솔 (PS·Xbox·Switch)", "e스포츠 시청", "게임 안 함"]),
  },
  {
    id: "outdoorActivity", label: "야외 활동", group: "love",
    options: withAll(["등산·트레킹", "캠핑·차박", "러닝·자전거", "수상 스포츠", "겨울 스포츠", "야외 활동 안 함"]),
  },
  {
    id: "communityBelonging", label: "소속 커뮤니티", group: "love",
    options: withAll(["온라인 커뮤니티", "오프라인 동호회", "직장·학교 모임", "지역 커뮤니티", "글로벌 커뮤니티", "소속 없음"]),
  },

  // ============ Media (10) ============
  {
    id: "mediaUsage", label: "주 사용 매체", group: "media",
    options: withAll(["TV·OTT", "YouTube", "Instagram", "TikTok", "Facebook", "X (Twitter)", "LinkedIn", "Threads", "검색 포털 (Naver·Google)", "온라인 커뮤니티·카페", "뉴스 앱", "팟캐스트", "라디오", "신문·잡지", "옥외 광고"]),
  },
  {
    id: "mediaTime", label: "일 매체 소비 시간", group: "media",
    options: withAll(["1시간 미만", "1~3시간", "3~5시간", "5~7시간", "7시간 이상"]),
  },
  {
    id: "primeTime", label: "주 시청·접속 시간대", group: "media",
    options: withAll(["출퇴근 (06~09, 17~19)", "오전 (09~12)", "점심 (12~14)", "오후 (14~18)", "저녁 (18~22)", "심야 (22~02)", "새벽 (02~06)"]),
  },
  {
    id: "device", label: "주 사용 디바이스", group: "media",
    options: withAll(["스마트폰", "데스크탑·노트북", "태블릿", "스마트 TV", "스마트워치·웨어러블", "VR·AR 헤드셋", "스마트 스피커"]),
  },
  {
    id: "ottSubscription", label: "OTT 구독 수", group: "media",
    options: withAll(["없음", "1개", "2~3개", "4~5개", "6개 이상"]),
  },
  {
    id: "ottPlatform", label: "주 사용 OTT", group: "media",
    options: withAll(["Netflix", "Disney+", "Apple TV+", "Amazon Prime", "HBO Max", "YouTube Premium", "Coupang Play (KR)", "Tving (KR)", "Wavve (KR)", "유료 OTT 없음"]),
  },
  {
    id: "adReceptivity", label: "광고 수용도", group: "media",
    options: withAll(["광고 친화", "중립", "광고 회피", "유료 무광고 선호"]),
  },
  {
    id: "adRecall", label: "광고 기억도", group: "media",
    options: withAll(["매우 잘 기억", "어느 정도 기억", "잘 못 기억", "전혀 기억 안 남"]),
  },
  {
    id: "adFormat", label: "선호 광고 포맷", group: "media",
    options: withAll(["짧은 영상 (15초 이하)", "긴 영상 (30초+)", "이미지·배너", "인플루언서·PPL", "검색 광고", "오프라인·OOH", "인터랙티브·게임형"]),
  },
  {
    id: "mediaTrust", label: "매체 신뢰도", group: "media",
    options: withAll(["전통 매체 (TV·신문)", "포털 뉴스", "유튜브·크리에이터", "SNS 친구·지인", "전문 매체·뉴스레터", "정부·공공기관", "어떤 매체도 신뢰 안 함"]),
  },

  // ============ Buy (12) ============
  {
    id: "shoppingChannel", label: "쇼핑 채널", group: "buy",
    options: withAll(["오프라인 매장", "온라인 종합몰 (Coupang·Amazon 등)", "라이브 커머스", "소셜 커머스 (SNS)", "해외 직구", "구독 서비스", "중고 거래 (당근·eBay 등)", "공동구매"]),
  },
  {
    id: "purchaseDriver", label: "구매 결정 요인", group: "buy",
    options: withAll(["가격·가성비", "품질·내구성", "브랜드·이미지", "리뷰·평판", "디자인·트렌드", "친환경·윤리", "혁신·기능", "추천·인플루언서", "한정판·희소성", "전문가·인증"]),
  },
  {
    id: "priceSensitivity", label: "가격 민감도", group: "buy",
    options: withAll(["매우 민감 (최저가 추구)", "민감", "보통", "둔감", "프리미엄 추구"]),
  },
  {
    id: "brandLoyalty", label: "브랜드 충성도", group: "buy",
    options: withAll(["1개 브랜드 고정", "2~3개 브랜드 로테이션", "다양한 시도", "신생·트렌드 추종", "무관심"]),
  },
  {
    id: "purchaseFreq", label: "구매 주기", group: "buy",
    options: withAll(["주 1회 이상", "월 1~3회", "분기 1~2회", "연 1~2회", "필요시만"]),
  },
  {
    id: "payment", label: "결제 수단", group: "buy",
    options: withAll(["신용카드", "체크카드", "간편결제 (Pay·Wallet)", "BNPL·후불결제", "현금·계좌이체", "암호화폐", "기프트카드·포인트"]),
  },
  {
    id: "spendCategory", label: "주요 지출 카테고리 (다중)", group: "buy",
    options: withAll(["식료품·생필품", "외식·배달", "패션·뷰티", "가전·테크", "여행·레저", "교육·자기계발", "건강·의료", "엔터테인먼트", "주거·인테리어", "자동차·교통", "투자·금융"]),
  },
  {
    id: "spendLevel", label: "월 가처분 지출", group: "buy",
    options: withAll(["50만원 미만", "50~100만원", "100~200만원", "200~300만원", "300만원 이상"]),
  },
  {
    id: "researchBehavior", label: "구매 전 정보 탐색", group: "buy",
    options: withAll(["철저 비교 (5+ 채널)", "기본 비교 (2~3채널)", "단일 채널 확인", "충동 구매", "추천만 의존"]),
  },
  {
    id: "subscriptionUse", label: "구독 서비스 사용 수", group: "buy",
    options: withAll(["없음", "1~2개", "3~5개", "6~10개", "10개 이상"]),
  },
  {
    id: "shareability", label: "구매 후 공유 행동", group: "buy",
    options: withAll(["적극 리뷰·SNS 공유", "지인 추천", "특별한 경우만", "공유 안 함"]),
  },
  {
    id: "ethicalShopping", label: "윤리적 소비", group: "buy",
    options: withAll(["적극 실천 (공정무역·제로웨이스트)", "관심 있음", "보통", "관심 없음"]),
  },
];
