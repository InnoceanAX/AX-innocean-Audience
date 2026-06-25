// media-taxonomy.js — Statista AMO 공식 9 세그먼트 + GWI 미디어 행동 매핑
// 1차 자료: cdn.statcdn.com/static/img/emarkets/amo-methodology-en.pdf
// 구조: Channel (9 = Statista 공식) → Subchannel → Media (개별)

// 베이스라인은 성인 인구 대비 도달률 % (실 패널 데이터로 교체 예정)
export const CHANNELS = [
  // ─────────────────────────────────────────────────────────────
  // 1. TV & Video Advertising
  //    Statista: 단일 통합. CTV/Linear 구분 없음. 우리는 시청 행동 기준 Subchannel 추가
  //    GWI 매핑: TV (Broadcast) + Online TV/VOD + Online Video
  // ─────────────────────────────────────────────────────────────
  {
    id: "tv_video",
    label: "TV & Video",
    icon: "tv",
    statista: "TV & Video Advertising",
    gwi: ["TV (Broadcast)", "Online TV/VOD", "Online Video"],
    subchannels: [
      {
        id: "tvv_linear",
        label: "Linear TV (지상파·케이블)",
        media: [
          { id: "tvv_terrestrial",   label: "지상파 종합편성",   baselineReach: 65, trustBase: 70, cpm: 14 },
          { id: "tvv_news",          label: "지상파 뉴스",        baselineReach: 50, trustBase: 75, cpm: 16 },
          { id: "tvv_cable_ent",     label: "케이블 엔터테인먼트", baselineReach: 45, trustBase: 60, cpm: 10 },
          { id: "tvv_cable_sports",  label: "케이블 스포츠",      baselineReach: 25, trustBase: 65, cpm: 12 },
        ],
      },
      {
        id: "tvv_ctv",
        label: "CTV (Connected TV)",
        media: [
          { id: "tvv_netflix",       label: "Netflix",            baselineReach: 30, trustBase: 55, cpm: 22, internetWeight: 1.0 },
          { id: "tvv_youtube_tv",    label: "YouTube on TV",      baselineReach: 35, trustBase: 60, cpm: 18, internetWeight: 1.0 },
          { id: "tvv_disney_plus",   label: "Disney+",            baselineReach: 18, trustBase: 58, cpm: 20, internetWeight: 1.0 },
          { id: "tvv_prime",         label: "Amazon Prime Video", baselineReach: 22, trustBase: 56, cpm: 19, internetWeight: 1.0 },
          { id: "tvv_apple_tv",      label: "Apple TV+",          baselineReach: 12, trustBase: 60, cpm: 21, internetWeight: 1.0 },
        ],
      },
      {
        id: "tvv_online_video",
        label: "Online Video",
        media: [
          { id: "tvv_youtube",       label: "YouTube",            baselineReach: 60, trustBase: 62, cpm: 10, internetWeight: 1.0 },
          { id: "tvv_twitch",        label: "Twitch",             baselineReach: 12, trustBase: 55, cpm: 11, internetWeight: 1.0 },
          { id: "tvv_tiktok_video",  label: "TikTok 동영상",       baselineReach: 28, trustBase: 42, cpm: 7,  internetWeight: 1.1 },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 2. Search Advertising
  //    Statista: 독립 세그먼트
  //    GWI 매핑: Search Engines (Discovery)
  // ─────────────────────────────────────────────────────────────
  {
    id: "search",
    label: "Search",
    icon: "search",
    statista: "Search Advertising",
    gwi: ["Search Engines"],
    subchannels: [
      {
        id: "search_global",
        label: "글로벌 검색엔진",
        media: [
          { id: "search_google",     label: "Google 검색",        baselineReach: 70, trustBase: 70, cpm: 12, internetWeight: 1.0 },
          { id: "search_bing",       label: "Microsoft Bing",     baselineReach: 18, trustBase: 62, cpm: 9,  internetWeight: 1.0 },
          { id: "search_yahoo",      label: "Yahoo!",             baselineReach: 10, trustBase: 55, cpm: 7,  internetWeight: 1.0 },
        ],
      },
      {
        id: "search_local",
        label: "지역 검색엔진",
        media: [
          { id: "search_naver",      label: "Naver",              baselineReach: 50, trustBase: 65, cpm: 10, internetWeight: 1.0 },
          { id: "search_baidu",      label: "Baidu",              baselineReach: 25, trustBase: 60, cpm: 8,  internetWeight: 1.0 },
          { id: "search_yandex",     label: "Yandex",             baselineReach: 12, trustBase: 58, cpm: 7,  internetWeight: 1.0 },
          { id: "search_daum",       label: "Daum",               baselineReach: 10, trustBase: 60, cpm: 6,  internetWeight: 1.0 },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 3. Social Media Advertising
  //    Statista: 독립 세그먼트 (Influencer와 별개)
  //    GWI 매핑: Social Media (43+ 플랫폼)
  // ─────────────────────────────────────────────────────────────
  {
    id: "social",
    label: "Social Media",
    icon: "share",
    statista: "Social Media Advertising",
    gwi: ["Social Media"],
    subchannels: [
      {
        id: "social_global",
        label: "글로벌 플랫폼",
        media: [
          { id: "social_instagram",  label: "Instagram",          baselineReach: 38, trustBase: 50, cpm: 8,  internetWeight: 1.0 },
          { id: "social_facebook",   label: "Facebook",           baselineReach: 35, trustBase: 45, cpm: 6,  internetWeight: 1.0 },
          { id: "social_tiktok",     label: "TikTok",             baselineReach: 28, trustBase: 42, cpm: 7,  internetWeight: 1.1 },
          { id: "social_x",          label: "X (Twitter)",        baselineReach: 18, trustBase: 40, cpm: 5,  internetWeight: 0.9 },
          { id: "social_linkedin",   label: "LinkedIn",           baselineReach: 12, trustBase: 58, cpm: 18, internetWeight: 0.8 },
          { id: "social_pinterest",  label: "Pinterest",          baselineReach: 14, trustBase: 52, cpm: 6,  internetWeight: 1.0 },
          { id: "social_snapchat",   label: "Snapchat",           baselineReach: 10, trustBase: 40, cpm: 7,  internetWeight: 1.0 },
          { id: "social_reddit",     label: "Reddit",             baselineReach: 8,  trustBase: 55, cpm: 5,  internetWeight: 0.9 },
        ],
      },
      {
        id: "social_local",
        label: "지역 플랫폼",
        media: [
          { id: "social_weibo",      label: "Weibo (CN)",         baselineReach: 5,  trustBase: 45, cpm: 5,  internetWeight: 1.0 },
          { id: "social_xiaohongshu",label: "小红书 (Xiaohongshu, CN)", baselineReach: 4, trustBase: 50, cpm: 6, internetWeight: 1.0 },
          { id: "social_vk",         label: "VKontakte (RU)",     baselineReach: 3,  trustBase: 42, cpm: 4,  internetWeight: 1.0 },
          { id: "social_qzone",      label: "QZone (CN)",         baselineReach: 3,  trustBase: 40, cpm: 4,  internetWeight: 1.0 },
        ],
      },
      {
        id: "social_messaging",
        label: "메신저",
        media: [
          { id: "social_kakao",      label: "KakaoTalk",          baselineReach: 30, trustBase: 60, cpm: 7,  internetWeight: 1.0 },
          { id: "social_whatsapp",   label: "WhatsApp",           baselineReach: 25, trustBase: 60, cpm: 5,  internetWeight: 1.0 },
          { id: "social_line",       label: "LINE",               baselineReach: 15, trustBase: 62, cpm: 8,  internetWeight: 1.0 },
          { id: "social_wechat",     label: "WeChat",             baselineReach: 10, trustBase: 55, cpm: 8,  internetWeight: 1.0 },
          { id: "social_telegram",   label: "Telegram",           baselineReach: 8,  trustBase: 55, cpm: 4,  internetWeight: 1.0 },
          { id: "social_messenger",  label: "Facebook Messenger", baselineReach: 18, trustBase: 50, cpm: 5,  internetWeight: 1.0 },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 4. Out-of-Home Advertising
  //    Statista: 단일 (DOOH 미언급 → OOH 통합으로 해석)
  //    GWI 매핑: 비공개
  //    실무 가시화 위해 Traditional/Digital/Transit/Cinema Subchannel
  // ─────────────────────────────────────────────────────────────
  {
    id: "ooh",
    label: "Out-of-Home",
    icon: "billboard",
    statista: "Out-of-Home Advertising",
    gwi: ["OOH (touchpoint)"],
    subchannels: [
      {
        id: "ooh_traditional",
        label: "전통 OOH (Static)",
        media: [
          { id: "ooh_highway",       label: "고속도로 빌보드",     baselineReach: 28, trustBase: 50, cpm: 4 },
          { id: "ooh_urban",         label: "도심 빌보드",         baselineReach: 45, trustBase: 55, cpm: 5 },
          { id: "ooh_street",        label: "스트리트 퍼니처",     baselineReach: 35, trustBase: 50, cpm: 3 },
        ],
      },
      {
        id: "ooh_digital",
        label: "DOOH (Digital OOH)",
        media: [
          { id: "ooh_led_urban",     label: "도심 LED 스크린",    baselineReach: 30, trustBase: 55, cpm: 6, internetWeight: 0.3 },
          { id: "ooh_transit_dooh", label: "디지털 교통 광고",    baselineReach: 25, trustBase: 55, cpm: 5, internetWeight: 0.3 },
          { id: "ooh_mall_dooh",    label: "쇼핑몰 디지털",        baselineReach: 28, trustBase: 58, cpm: 5 },
          { id: "ooh_retail_dooh",  label: "매장 내 디지털",       baselineReach: 35, trustBase: 60, cpm: 4 },
        ],
      },
      {
        id: "ooh_transit",
        label: "교통수단",
        media: [
          { id: "ooh_subway",        label: "지하철 광고",         baselineReach: 40, trustBase: 55, cpm: 4 },
          { id: "ooh_bus",           label: "버스 광고",           baselineReach: 35, trustBase: 50, cpm: 3 },
          { id: "ooh_airport",       label: "공항 광고",           baselineReach: 15, trustBase: 65, cpm: 8 },
          { id: "ooh_taxi",          label: "택시 광고",           baselineReach: 12, trustBase: 50, cpm: 4 },
        ],
      },
      {
        id: "ooh_cinema",
        label: "Cinema (영화관)",
        media: [
          { id: "ooh_cinema_preroll",label: "영화관 프리롤",       baselineReach: 22, trustBase: 60, cpm: 12 },
          { id: "ooh_cinema_lobby",  label: "영화관 로비",         baselineReach: 18, trustBase: 55, cpm: 8 },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 5. Digital Banner Advertising
  //    Statista: 독립 세그먼트 (Display)
  //    GWI 매핑: Display (touchpoint)
  // ─────────────────────────────────────────────────────────────
  {
    id: "banner",
    label: "Digital Banner",
    icon: "image",
    statista: "Digital Banner Advertising",
    gwi: ["Display Ads"],
    subchannels: [
      {
        id: "banner_display",
        label: "디스플레이",
        media: [
          { id: "banner_standard",   label: "표준 배너 (DA)",     baselineReach: 60, trustBase: 40, cpm: 4, internetWeight: 1.0 },
          { id: "banner_rich",       label: "리치미디어",          baselineReach: 35, trustBase: 45, cpm: 7, internetWeight: 1.0 },
          { id: "banner_interstitial",label: "전면 광고 (Interstitial)", baselineReach: 30, trustBase: 38, cpm: 6, internetWeight: 1.0 },
        ],
      },
      {
        id: "banner_native",
        label: "Native",
        media: [
          { id: "banner_native_feed",label: "피드 Native",         baselineReach: 35, trustBase: 50, cpm: 6, internetWeight: 1.0 },
          { id: "banner_native_search",label: "검색 결과 Native", baselineReach: 28, trustBase: 55, cpm: 7, internetWeight: 1.0 },
        ],
      },
      {
        id: "banner_programmatic",
        label: "Programmatic",
        media: [
          { id: "banner_dsp",        label: "DSP (RTB)",          baselineReach: 45, trustBase: 50, cpm: 5, internetWeight: 1.0 },
          { id: "banner_pmp",        label: "PMP (Private Marketplace)", baselineReach: 25, trustBase: 60, cpm: 8, internetWeight: 1.0 },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 6. Print Advertising
  //    Statista: 독립 세그먼트
  //    GWI 매핑: Press (Newspapers/Magazines)
  // ─────────────────────────────────────────────────────────────
  {
    id: "print",
    label: "Print",
    icon: "newspaper",
    statista: "Print Advertising",
    gwi: ["Press"],
    subchannels: [
      {
        id: "print_news",
        label: "신문",
        media: [
          { id: "print_daily",       label: "종합 일간지",         baselineReach: 18, trustBase: 72, cpm: 7 },
          { id: "print_econ",        label: "경제·산업지",         baselineReach: 10, trustBase: 75, cpm: 9 },
          { id: "print_local",       label: "지역지",              baselineReach: 8,  trustBase: 65, cpm: 4 },
        ],
      },
      {
        id: "print_mag",
        label: "잡지",
        media: [
          { id: "print_lifestyle",   label: "라이프스타일 잡지",   baselineReach: 8,  trustBase: 65, cpm: 8 },
          { id: "print_trade",       label: "전문지·B2B",          baselineReach: 4,  trustBase: 75, cpm: 12 },
          { id: "print_fashion",     label: "패션·뷰티 잡지",      baselineReach: 6,  trustBase: 60, cpm: 10 },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 7. Audio Advertising
  //    Statista: 독립 세그먼트
  //    GWI 매핑: Radio (Broadcast) + Music streaming + Podcast
  // ─────────────────────────────────────────────────────────────
  {
    id: "audio",
    label: "Audio",
    icon: "radio",
    statista: "Audio Advertising",
    gwi: ["Radio (Broadcast)", "Music streaming", "Podcasts"],
    subchannels: [
      {
        id: "audio_broadcast",
        label: "라디오 방송",
        media: [
          { id: "audio_fm",          label: "FM 라디오",          baselineReach: 35, trustBase: 60, cpm: 3 },
          { id: "audio_am",          label: "AM 라디오",          baselineReach: 12, trustBase: 55, cpm: 2 },
          { id: "audio_dab",         label: "DAB 디지털 라디오",   baselineReach: 8,  trustBase: 58, cpm: 3 },
        ],
      },
      {
        id: "audio_streaming",
        label: "오디오 스트리밍",
        media: [
          { id: "audio_spotify",     label: "Spotify",            baselineReach: 22, trustBase: 50, cpm: 8,  internetWeight: 1.0 },
          { id: "audio_apple_music", label: "Apple Music",        baselineReach: 15, trustBase: 50, cpm: 9,  internetWeight: 1.0 },
          { id: "audio_amazon_music",label: "Amazon Music",       baselineReach: 10, trustBase: 50, cpm: 7,  internetWeight: 1.0 },
          { id: "audio_melon",       label: "Melon (KR)",         baselineReach: 8,  trustBase: 55, cpm: 6,  internetWeight: 1.0 },
        ],
      },
      {
        id: "audio_podcast",
        label: "팟캐스트",
        media: [
          { id: "audio_pod_spotify", label: "Spotify Podcasts",   baselineReach: 12, trustBase: 65, cpm: 10, internetWeight: 1.0 },
          { id: "audio_pod_apple",   label: "Apple Podcasts",     baselineReach: 10, trustBase: 65, cpm: 11, internetWeight: 1.0 },
          { id: "audio_pod_yt",      label: "YouTube Podcasts",   baselineReach: 8,  trustBase: 60, cpm: 9,  internetWeight: 1.0 },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 8. Digital Classifieds (NEW — Statista 공식)
  //    Statista: 독립 세그먼트
  //    GWI 매핑: 공개 자료에 카테고리 부재
  // ─────────────────────────────────────────────────────────────
  {
    id: "classifieds",
    label: "Classifieds",
    icon: "list",
    statista: "Digital Classifieds",
    gwi: [],
    subchannels: [
      {
        id: "class_jobs",
        label: "채용",
        media: [
          { id: "class_indeed",      label: "Indeed",             baselineReach: 18, trustBase: 65, cpm: 12, internetWeight: 1.0 },
          { id: "class_linkedin_jobs",label: "LinkedIn Jobs",     baselineReach: 12, trustBase: 70, cpm: 15, internetWeight: 0.8 },
          { id: "class_saramin",     label: "사람인 (KR)",         baselineReach: 8,  trustBase: 60, cpm: 8,  internetWeight: 1.0 },
          { id: "class_jobkorea",    label: "잡코리아 (KR)",       baselineReach: 7,  trustBase: 60, cpm: 8,  internetWeight: 1.0 },
        ],
      },
      {
        id: "class_realestate",
        label: "부동산",
        media: [
          { id: "class_zillow",      label: "Zillow",             baselineReach: 12, trustBase: 60, cpm: 10, internetWeight: 1.0 },
          { id: "class_dabang",      label: "다방 (KR)",           baselineReach: 6,  trustBase: 55, cpm: 7,  internetWeight: 1.0 },
          { id: "class_zigbang",     label: "직방 (KR)",           baselineReach: 7,  trustBase: 58, cpm: 8,  internetWeight: 1.0 },
        ],
      },
      {
        id: "class_auto",
        label: "자동차",
        media: [
          { id: "class_autotrader",  label: "Auto Trader",        baselineReach: 8,  trustBase: 60, cpm: 9,  internetWeight: 1.0 },
          { id: "class_encar",       label: "엔카 (KR)",           baselineReach: 6,  trustBase: 58, cpm: 7,  internetWeight: 1.0 },
          { id: "class_kbcarcar",    label: "KB차차차 (KR)",       baselineReach: 4,  trustBase: 60, cpm: 6,  internetWeight: 1.0 },
        ],
      },
      {
        id: "class_marketplace",
        label: "중고·일반",
        media: [
          { id: "class_craigslist",  label: "Craigslist",         baselineReach: 8,  trustBase: 45, cpm: 3,  internetWeight: 1.0 },
          { id: "class_carrot",      label: "당근마켓 (KR)",       baselineReach: 22, trustBase: 65, cpm: 4,  internetWeight: 1.0 },
          { id: "class_ebay_kr",     label: "번개장터 (KR)",       baselineReach: 8,  trustBase: 55, cpm: 4,  internetWeight: 1.0 },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 9. Influencer Advertising (NEW — Statista 공식 독립 세그먼트)
  //    Statista: 독립 세그먼트 (Social Media와 별개)
  //    GWI 매핑: Influencer endorsement (touchpoint)
  // ─────────────────────────────────────────────────────────────
  {
    id: "influencer",
    label: "Influencer",
    icon: "star",
    statista: "Influencer Advertising",
    gwi: ["Influencer endorsement"],
    subchannels: [
      // Influencer subchannel 이하 별도 파일에서 append
      {
        id: "inf_video",
        label: "동영상 인플루언서",
        media: [
          { id: "inf_youtube",       label: "YouTube 인플루언서",  baselineReach: 32, trustBase: 60, cpm: 14, internetWeight: 1.0 },
          { id: "inf_tiktok",        label: "TikTok 인플루언서",   baselineReach: 25, trustBase: 52, cpm: 12, internetWeight: 1.1 },
          { id: "inf_twitch",        label: "Twitch 스트리머",     baselineReach: 8,  trustBase: 60, cpm: 13, internetWeight: 1.0 },
        ],
      },
      {
        id: "inf_image",
        label: "이미지 인플루언서",
        media: [
          { id: "inf_instagram",     label: "Instagram 인플루언서",baselineReach: 30, trustBase: 55, cpm: 12, internetWeight: 1.0 },
          { id: "inf_pinterest",     label: "Pinterest Pinner",    baselineReach: 8,  trustBase: 58, cpm: 9,  internetWeight: 1.0 },
        ],
      },
      {
        id: "inf_blog",
        label: "블로그·텍스트",
        media: [
          { id: "inf_naver_blog",    label: "Naver Blog (KR)",     baselineReach: 14, trustBase: 65, cpm: 8,  internetWeight: 1.0 },
          { id: "inf_substack",      label: "Substack 뉴스레터",   baselineReach: 4,  trustBase: 70, cpm: 12, internetWeight: 1.0 },
        ],
      },
      {
        id: "inf_b2b",
        label: "B2B 인플루언서",
        media: [
          { id: "inf_linkedin",      label: "LinkedIn Creator",    baselineReach: 8,  trustBase: 70, cpm: 22, internetWeight: 0.8 },
          { id: "inf_x_kol",         label: "X (Twitter) KOL",     baselineReach: 6,  trustBase: 50, cpm: 10, internetWeight: 0.9 },
        ],
      },
    ],
  },
];

// 국가별 매체 가중치 (특수 시장)
// 0 = 차단/사용 불가, 1.5+ = 강세 시장
export const COUNTRY_MEDIA_OVERRIDES = {
  CN: {
    // Google·Meta·X·YouTube·Netflix 차단
    search_google: 0, social_instagram: 0, social_facebook: 0, social_x: 0,
    social_whatsapp: 0, social_messenger: 0, social_telegram: 0,
    tvv_youtube: 0, tvv_youtube_tv: 0, tvv_netflix: 0, tvv_disney_plus: 0,
    tvv_prime: 0, tvv_apple_tv: 0, tvv_twitch: 0,
    inf_youtube: 0, inf_instagram: 0, inf_twitch: 0,
    audio_spotify: 0, audio_apple_music: 0, audio_pod_spotify: 0, audio_pod_apple: 0, audio_pod_yt: 0,
    class_indeed: 0, class_linkedin_jobs: 0, class_zillow: 0,
    // 한국 매체도 0
    search_naver: 0, search_daum: 0, social_kakao: 0, social_line: 0,
    audio_melon: 0, class_saramin: 0, class_jobkorea: 0, class_dabang: 0,
    class_zigbang: 0, class_encar: 0, class_kbcarcar: 0, class_carrot: 0, class_ebay_kr: 0,
    inf_naver_blog: 0,
    // Baidu·중국 강세
    search_baidu: 3.0, social_weibo: 4.0, social_xiaohongshu: 4.0,
    social_qzone: 3.0, social_wechat: 5.0, social_tiktok: 1.5,
    tvv_tiktok_video: 1.5, inf_tiktok: 1.6,
  },
  RU: {
    social_instagram: 0.2, social_facebook: 0.2, social_x: 0.3,
    inf_instagram: 0.3, inf_youtube: 0.6,
    search_naver: 0, search_baidu: 0, search_daum: 0,
    social_kakao: 0, social_line: 0, social_weibo: 0, social_xiaohongshu: 0, social_wechat: 0,
    audio_melon: 0, class_saramin: 0, class_jobkorea: 0, class_dabang: 0,
    class_zigbang: 0, class_encar: 0, class_kbcarcar: 0, class_carrot: 0, class_ebay_kr: 0,
    inf_naver_blog: 0,
    // 러시아 강세
    search_yandex: 4.0, social_vk: 5.0, social_telegram: 2.5,
  },
  KR: {
    social_tiktok: 0.8, social_x: 0.7, social_facebook: 0.6,
    social_instagram: 1.1, social_kakao: 2.5, social_messenger: 0.4,
    search_naver: 2.0, search_daum: 1.3, search_baidu: 0, search_yandex: 0,
    social_weibo: 0, social_xiaohongshu: 0.1, social_wechat: 0.1, social_qzone: 0, social_vk: 0,
    audio_melon: 2.5, tvv_disney_plus: 0.8,
    inf_naver_blog: 3.0, inf_tiktok: 0.7,
    class_indeed: 0.2, class_zillow: 0,
  },
  JP: {
    social_x: 1.4, social_tiktok: 1.1, social_linkedin: 0.4,
    social_line: 2.5, search_naver: 0.3, search_baidu: 0, search_yandex: 0,
    social_weibo: 0, social_xiaohongshu: 0.1, social_wechat: 0.1, social_qzone: 0, social_vk: 0, social_kakao: 0.2,
    audio_melon: 0, inf_naver_blog: 0.1,
    class_saramin: 0, class_jobkorea: 0, class_encar: 0, class_kbcarcar: 0,
    class_dabang: 0, class_zigbang: 0, class_carrot: 0, class_ebay_kr: 0,
  },
  IN: {
    tvv_youtube: 1.3, social_tiktok: 0.2, social_facebook: 1.2,
    social_whatsapp: 1.6, search_naver: 0, search_baidu: 0, search_daum: 0, search_yandex: 0,
    social_weibo: 0, social_xiaohongshu: 0, social_wechat: 0.1, social_qzone: 0, social_vk: 0,
    social_kakao: 0, social_line: 0.2, audio_melon: 0, inf_naver_blog: 0,
    class_saramin: 0, class_jobkorea: 0, class_encar: 0, class_kbcarcar: 0,
    class_dabang: 0, class_zigbang: 0, class_carrot: 0, class_ebay_kr: 0,
  },
  US: {
    social_facebook: 1.1, social_tiktok: 1.0, social_x: 1.1, social_reddit: 1.3,
    search_naver: 0, search_baidu: 0, search_daum: 0, search_yandex: 0,
    social_kakao: 0, social_line: 0, social_weibo: 0, social_xiaohongshu: 0,
    social_wechat: 0.1, social_qzone: 0, social_vk: 0, audio_melon: 0,
    inf_naver_blog: 0, class_saramin: 0, class_jobkorea: 0, class_encar: 0,
    class_kbcarcar: 0, class_dabang: 0, class_zigbang: 0, class_carrot: 0, class_ebay_kr: 0,
  },
  AE: {
    social_facebook: 1.2, social_instagram: 1.4, social_tiktok: 1.2, social_snapchat: 1.5,
    search_naver: 0, search_baidu: 0, search_daum: 0, search_yandex: 0,
    social_kakao: 0, social_line: 0, social_weibo: 0, social_xiaohongshu: 0,
    social_wechat: 0.1, social_qzone: 0, social_vk: 0, audio_melon: 0,
    inf_naver_blog: 0, class_saramin: 0, class_jobkorea: 0, class_encar: 0,
    class_kbcarcar: 0, class_dabang: 0, class_zigbang: 0, class_carrot: 0, class_ebay_kr: 0,
  },
};

// 2026-06-23 (CEO 지시): 미디어 차트 화이트리스트 빌더
//   목적: 페르소나가 적은 채널이 "미디어 상품"인지 판정 (쇼핑/브랜드/커머스 제외)
//   원칙: CHANNELS 라벨 + 일반 카테고리 별칭 + 국가코드 필터
//   - 라벨에 국가 괄호가 없으면 글로벌 (모든 국가 허용)
//   - 라벨에 "(KR)", "(JP)", "(CN)" 등 괄호 국가코드가 있으면 해당 국가만 허용
//   - 일반 카테고리("음악 스트리밍", "팟캐스트", "라디오", "TV", "신문", "포털/뉴스", "옥외광고(OOH)")는 미디어 성격이므로 글로벌 허용

// 라벨에서 "X" 또는 "X (CC)" 형태 파싱 → { name, countryCode | null }
function parseLabelCountry(label) {
  if (!label || typeof label !== "string") return { name: "", countryCode: null };
  // 괄호 안 첫 2-3 글자 영문 대문자 코드만 국가코드로 인식 (예 "(KR)", "(JP)")
  // "(Xiaohongshu, CN)" 같이 쉼표 뒤 코드도 처리
  const m = label.match(/[（(]([^()）]*)[）)]\s*$/);
  let countryCode = null;
  let name = label.trim();
  if (m) {
    const inside = m[1].trim();
    // 쉼표 분리 후 마지막 토큰이 2-3 글자 대문자면 국가코드
    const tokens = inside.split(/[,，]/).map(s => s.trim()).filter(Boolean);
    const last = tokens[tokens.length - 1] || "";
    if (/^[A-Z]{2,3}$/.test(last)) {
      countryCode = last;
      // 이름은 괄호 떼고 정리 (괄호 안에 다른 텍스트 있으면 그건 부가 정보)
      name = label.replace(/[（(][^()）]*[）)]\s*$/, "").trim();
    }
  }
  return { name, countryCode };
}

// 미디어 일반 카테고리 별칭 (페르소나가 장르/카테고리로 적은 일반 표현 → 미디어로 인정)
// canonicalizeChannel이 통합하는 일반 카테고리와 동일 명칭. 글로벌 허용.
// 2026-06-25 (CEO): export — media.js landscape items[].isGeneric 플래그 판정용
export const GENERIC_MEDIA_ALIASES = [
  "TV", "라디오", "신문", "옥외광고(OOH)", "팟캐스트", "포털/뉴스", "음악 스트리밍",
  // 페르소나가 자연어로 적을 수 있는 추가 표현 (canonicalize가 흡수하지 못한 경우 대비)
  "뉴스", "커뮤니티", "잡지", "OTT",
];

// canonicalizeChannel의 결과 별칭 (한글 명칭 / 로컬라이즈 명칭).
// CHANNELS는 대부분 영문 라벨이지만 canonicalize가 한글 명칭으로 정규화함(예: Melon → 멜론).
// 또한 CHANNELS에 등록되지 않은 주요 OTT/메시지(Coupang Play, 티빙, 웨이브, 왬차, Threads 등) 포함.
// 2026-06-24 (CTO Sohee): 국가별 미디어 채널 화이트리스트 확장.
//   매핑표 media-channel-mapping-FULL-KR-JP-CN.md(KR/JP/CN 9세그) 기반.
//   현지표기·영문병기 각각 별칭 추출. 기존 항목 전부 보존 + 확장.
//   순수 쇼핑/커머스 플랫폼(옥션/拼多多/중고나라/득물 등)은 제외(미디어 아님).
//   브랜드 중립: 특정 브랜드(무신사 등) 하드코딩 없음.
const CANONICAL_MEDIA_ALIASES = {
  // ─────────────────────────────────────────────────────────
  // KR — 한국 전용·강세 채널 별칭
  // ─────────────────────────────────────────────────────────
  KR: [
    // ── 기존 항목 (유지) ──
    "멜론", "지니뮤직", "FLO", "Tving", "Wavve", "Watcha", "Coupang Play",
    // ── TV / 지상파·종편·케이블 ──
    "KBS", "KBS1", "KBS2", "MBC", "SBS", "EBS", "JTBC", "TV조선", "채널A", "MBN",
    "YTN", "연합뉴스TV", "tvN", "OCN", "Mnet", "ENA", "CJ ENM",
    // ── OTT / CTV ──
    "티빙", "웨이브", "쿠팡플레이", "왓챠", "SPOTV NOW", "ENA Play",
    // ── Online Video / UGC ──
    "아프리카TV", "SOOP", "치지직", "CHZZK",
    // ── Search ──
    "네이버", "Naver", "네이버 검색", "다음", "Daum", "ZUM", "줌",
    // ── Social ──
    "네이버 카페", "Naver Cafe", "네이버 밴드", "BAND",
    "디시인사이드", "DC Inside", "더쿠", "theqoo",
    "뽐뿌", "Ppomppu", "클리앙", "Clien", "보배드림", "Bobaedream",
    // ── Messenger ──
    "카카오톡", "KakaoTalk", "카카오", "라인", "텔레그램", "디스코드",
    "네이버 웍스", "Naver Works",
    // ── Music streaming ──
    "Melon", "Genie Music", "지니", "벅스", "Bugs",
    "카카오뮤직",
    // ── Podcast / Audiobook ──
    "팟빵", "Podbbang", "네이버 오디오클립", "오디오클립", "Audio Clip",
    "윌라", "Welaaa", "밀리의서재", "Millie",
    // ── 라디오 ──
    "KBS 라디오", "쿨FM", "MBC 라디오", "FM4U", "SBS 라디오", "파워FM", "러브FM",
    "CBS", "EBS FM", "PBC", "평화방송", "BBS", "불교방송", "극동방송", "TBS 교통방송",
    // ── 신문 ──
    "조선일보", "Chosun Ilbo", "중앙일보", "JoongAng Ilbo",
    "동아일보", "Dong-A Ilbo", "한겨레", "Hankyoreh",
    "경향신문", "Kyunghyang", "한국일보", "Hankook Ilbo",
    "매일경제", "Maeil Business", "한국경제", "Korea Economic Daily",
    "서울경제", "Seoul Economic", "파이낸셜뉴스", "FN News",
    "이데일리", "Edaily", "머니투데이", "Money Today",
    // ── 잡지 ──
    "VOGUE Korea", "ELLE Korea", "Harper's BAZAAR Korea", "GQ Korea",
    "W Korea", "Marie Claire Korea", "Allure Korea", "Cosmopolitan Korea",
    "Cine21", "시사IN", "한겨레21", "매경ECONOMY", "한경비즈니스",
    // ── Display / Native / Programmatic (KR) ──
    "카카오 비즈보드", "Bizboard", "카카오 모먼트", "Kakao Moment",
    "네이트", "Nate", "Dable", "데이블", "Taboola Korea",
    "Naver Smart Channel", "스마트채널", "MOLOCO", "Cauly", "카울리",
    "애드픽", "Adpick", "모비온", "MOBION", "NasMedia", "메조미디어",
    // ── Classifieds / Jobs ──
    "사람인", "Saramin", "잡코리아", "JobKorea", "워크넷", "WorkNet",
    "인크루트", "Incruit", "알바몬", "AlbaMon", "알바천국", "Alba Heaven",
    "캐치", "Catch", "원티드", "Wanted", "점핏", "Jumpit",
    "자소설닷컴", "코멘토",
    // ── Real Estate ──
    "직방", "Zigbang", "다방", "Dabang",
    "호갱노노", "HogangNoNo", "네이버 부동산", "Naver Real Estate",
    "KB부동산", "부동산114", "R114", "한방",
    // ── Auto ──
    "엔카닷컴", "엔카", "Encar", "KB차차차",
    "첫차", "Cheotcha", "SK 엔카 직영",
    "헤이딜러", "HEYDEALER", "차란차", "Chalancha",
    // ── Marketplace / 중고 ──
    "당근마켓", "당근", "Karrot", "Daangn",
    "번개장터", "Bunjang", "크림", "KREAM", "솔드아웃", "SOLDOUT",
    // ── Service classifieds ──
    "숨고", "Soomgo", "크몽", "Kmong", "탈잉", "Taling",
    // ── Influencer 플랫폼 ──
    "Naver Blog", "네이버 블로그", "Tistory", "티스토리",
    "Brunch", "브런치", "카카오TV", "Stibee", "메일리", "Maily",
    // ── 라이브커머스 ──
    "네이버 쇼핑라이브", "카카오 쇼핑라이브", "쿠팡 라이브", "Coupang Live",
    "그립", "Grip", "11번가 라이브", "SSG 라이브",
    // ── B2B ──
    "디스콰이엇", "disquiet", "폴인", "folin", "퍼블리", "PUBLY",
  ],

  // ─────────────────────────────────────────────────────────
  // JP — 일본 전용·강세 채널 별칭
  // ─────────────────────────────────────────────────────────
  JP: [
    // ── 기존 항목 (유지) ──
    "U-NEXT", "ABEMA", "niconico", "Yahoo! Japan",
    // ── Linear TV ──
    "NHK", "NHK 総合", "NHK General", "NHK Eテレ", "NHK Educational",
    "日本テレビ", "Nippon TV", "テレビ朝日", "TV Asahi",
    "TBSテレビ", "TBS", "テレビ東京", "TV Tokyo",
    "フジテレビ", "Fuji TV", "TOKYO MX",
    "WOWOW", "スカパー!", "SKY PerfecTV!", "J-COM",
    "BS日テレ", "BS朝日", "BS-TBS", "BSテレ東", "BSフジ",
    // ── OTT / CTV ──
    "Hulu Japan", "TVer", "DAZN Japan", "dTV", "Lemino",
    // ── Online Video ──
    "ニコニコ動画", "17LIVE", "OPENREC.tv", "OPENREC",
    // ── Search ──
    "Yahoo! JAPAN 検索", "goo検索", "goo",
    "Bing 日本", "Google 日本",
    // ── Social ──
    "mixi", "ミクシィ",
    "アメーバブログ", "Ameba Blog", "Ameba",
    "note", "ノート",
    "5ちゃんねる", "5channel",
    "ガールズちゃんねる", "Girls Channel",
    "はてなブックマーク", "Hatena Bookmark",
    "はてなブログ", "Hatena Blog",
    // ── Messenger ──
    "LINE", "Messenger", "Telegram", "Discord",
    "Chatwork", "Slack", "WhatsApp",
    // ── Music streaming ──
    "Spotify Japan", "Apple Music", "Amazon Music", "YouTube Music",
    "LINE MUSIC", "AWA", "dヒッツ", "d Hits", "レコチョク", "RecoChoku",
    // ── Podcast ──
    "Voicy", "Spotify Podcasts", "Apple Podcasts",
    "Amazon Audible", "Audible", "LisBo", "Radiotalk", "stand.fm",
    // ── Radio ──
    "NHK 第1", "NHK 第2", "NHK FM",
    "TBSラジオ", "TBS Radio", "文化放送", "Joqr",
    "ニッポン放送", "J-WAVE", "FM TOKYO", "TFM",
    "bayfm78", "NACK5", "FM yokohama", "InterFM897", "Radio NIKKEI",
    // ── 신문 ──
    "読売新聞", "Yomiuri Shimbun", "Yomiuri",
    "朝日新聞", "Asahi Shimbun", "Asahi",
    "毎日新聞", "Mainichi Shimbun", "Mainichi",
    "産経新聞", "Sankei Shimbun", "Sankei",
    "日本経済新聞", "Nikkei",
    "スポーツニッポン", "Sponichi",
    "日刊スポーツ", "Nikkan Sports",
    "スポーツ報知", "Sports Hochi",
    "デイリースポーツ", "Daily Sports",
    "中日新聞", "Chunichi Shimbun",
    "西日本新聞", "Nishinippon",
    "北海道新聞", "Hokkaido Shimbun",
    // ── 잡지 ──
    "VOGUE JAPAN", "ELLE JAPON", "Harper's BAZAAR JAPAN", "GQ JAPAN",
    "Numero TOKYO", "25ans", "anan", "non-no",
    "週刊文春", "Bunshun", "週刊新潮", "Shincho",
    "週刊現代", "週刊ポスト", "週刊朝日",
    "日経ビジネス", "Nikkei Business", "月刊 文藝春秋", "文藝春秋",
    "dancyu", "クロワッサン",
    // ── Display / Native / Programmatic (JP) ──
    "朝日新聞デジタル", "Asahi Digital",
    "読売新聞オンライン", "Yomiuri Online",
    "毎日新聞デジタル", "Mainichi Digital",
    "livedoor ニュース", "livedoor",
    "gooニュース", "4Gamer.net", "ファミ通.com", "ファミ通",
    "Outbrain Japan", "Outbrain",
    "Taboola Japan", "Taboola",
    "LINE NEWS", "SmartNews", "グノシー", "Gunosy",
    "Yahoo! JAPAN ブランドパネル",
    "MicroAd BLADE", "MicroAd",
    "i-mobile", "fluct", "GMO TECH", "Geniee", "Geniee SSP",
    "LINE 広告", "LINE Ads Platform",
    // ── Classifieds / Jobs ──
    "リクナビNEXT", "Rikunabi NEXT", "リクナビ",
    "マイナビ転職", "Mynavi Tenshoku", "マイナビ",
    "doda", "エン転職", "en転職",
    "バイトル", "Baitoru",
    "タウンワーク", "TownWork",
    "リクルートエージェント",
    "type", "@type",
    "ビズリーチ", "BIZREACH",
    "キャリトレ", "careertrek",
    "Indeed Japan", "Indeed", "LinkedIn Jobs",
    // ── Real Estate ──
    "SUUMO", "HOMES", "LIFULL HOME'S",
    "アットホーム", "at home",
    "アパマンショップ", "Apamanshop",
    "mansion-review",
    "LIVABLE", "東急リバブル",
    // ── Auto ──
    "カーセンサー", "Carsensor",
    "グーネット", "Goo-net",
    "カーセブン", "Car Seven",
    "カーチス", "Carchs",
    "ガリバー", "Gulliver", "IDOM",
    "ネクステージ", "NextStage",
    "楽天Car", "Rakuten Car",
    "Yahoo!オークション", "ヤフオク!", "ヤフオク",
    // ── Marketplace ──
    "メルカリ", "Mercari",
    "ラクマ", "Rakuma",
    "PayPayフリマ", "PayPay Flea Market",
    "ジモティー", "Jimoty",
    "スニーカーダンク", "SNKRDUNK",
    "モノカブ", "monokabu",
    // ── Service classifieds ──
    "くらしのマーケット", "Kurashi no Market",
    "ココナラ", "Coconala",
    "ストアカ", "Street Academy",
    "タスカジ", "TaskAji",
    // ── Influencer 플랫폼 ──
    "livedoor Blog",
    "LINE BLOG", "Substack",
    // ── 라이브커머스 ──
    "楽天市場 ライブ", "Rakuten Live",
    "Yahoo!ショッピング ライブ",
    "TikTok Shop Live", "SHOP CHANNEL", "QVC Japan",
    // ── B2B ──
    "note PRO", "Wantedly", "YOUTRUST",
  ],

  // ─────────────────────────────────────────────────────────
  // CN — 중국 전용·강세 채널 별칭
  // ─────────────────────────────────────────────────────────
  CN: [
    // ── Linear TV ──
    "CCTV-1", "CCTV-3", "CCTV-5", "CCTV-6", "CCTV-13", "CCTV",
    "东方卫视", "Dragon TV",
    "浙江卫视", "Zhejiang TV",
    "江苏卫视", "Jiangsu TV",
    "湖南卫视", "Hunan TV",
    "北京卫视", "Beijing TV",
    "天津卫视", "Tianjin TV",
    "上海新闻综合", "SH News",
    "杭州综合", "Hangzhou General",
    // ── OTT / CTV ──
    "爱奇艺", "iQiyi",
    "优酷", "Youku",
    "腾讯视频", "Tencent Video",
    "芒果TV", "Mango TV",
    "Bilibili 大屏",
    "咪咕视频", "MIGU Video",
    "西瓜视频", "Xigua Video", "Xigua",
    "央视频", "CCTV+",
    // ── Online Video ──
    "小红书 视频", "Xiaohongshu Video",
    "视频号", "WeChat Channels",
    "Douyin", "Kuaishou",
    "抖音", "快手",
    // ── Search ──
    "百度", "Baidu",
    "搜狗", "Sogou",
    "360搜索", "So.com", "360 Search",
    "神马搜索", "Shenma",
    "头条搜索", "Toutiao Search",
    "微信搜一搜", "WeChat Sou Yi Sou",
    "抖音搜索", "Douyin Search",
    "夸克", "Quark",
    "必应中国", "Bing China",
    // ── Social ──
    "微博", "Weibo",
    "小红书", "Xiaohongshu", "RED",
    "QQ空间", "QZone",
    "知乎", "Zhihu",
    "哔哩哔哩", "Bilibili",
    "豆瓣", "Douban",
    "哔哩哔哩 动态", "Bilibili Dynamic",
    "视频号 社区",
    "脉脉", "Maimai",
    "即刻", "Jike",
    "最右", "Zuiyou",
    "贴吧", "Baidu Tieba",
    // ── Messenger ──
    "微信", "WeChat",
    "QQ", "腾讯QQ",
    "钉钉", "DingTalk",
    "飞书", "Feishu", "Lark",
    "企业微信", "WeCom",
    // ── Music streaming ──
    "QQ音乐", "QQ Music",
    "网易云音乐", "NetEase Cloud Music",
    "酷狗音乐", "Kugou",
    "酷我音乐", "Kuwo",
    "咪咕音乐", "MIGU Music",
    "汽水音乐", "Qishui Yinyue",
    // ── Podcast ──
    "喜马拉雅FM", "喜马拉雅", "Ximalaya",
    "蜻蜓FM", "Qingting FM",
    "荔枝FM", "Lizhi",
    "懒人听书", "Lazy Audio",
    "网易云音乐 播客",
    "小宇宙 播客", "小宇宙", "Cosmos Podcast",
    "QQ音乐 播客",
    "蜻蜓 听书",
    // ── Radio ──
    "中央人民广播电台", "CNR",
    "上海广播电台", "SMG Radio",
    "浙江广播电视台 之声", "Zhejiang Radio",
    "杭州电台", "Hangzhou Radio",
    "天津人民广播电台", "Tianjin Radio",
    "北京交通广播",
    // ── 신문 ──
    "人民日报", "People's Daily",
    "新华每日电讯", "Xinhua Daily",
    "光明日报", "Guangming Daily",
    "经济日报", "Economic Daily",
    "解放日报", "Jiefang Daily",
    "文汇报", "Wen Wei Po",
    "钱江晚报", "Qianjiang Evening",
    "浙江日报", "Zhejiang Daily",
    "今晚报", "Jinwan Bao",
    "天津日报", "Tianjin Daily",
    "21世纪经济报道", "21st Century Business Herald",
    "第一财经日报", "China Business Network",
    // ── 잡지 ──
    "VOGUE 服饰与美容", "VOGUE China",
    "ELLE 世界时装之苑", "ELLE China",
    "Harper's BAZAAR China", "时尚芭莎",
    "GQ 智族", "GQ China",
    "InStyle 优家画报", "InStyle China",
    "Marie Claire 嘉人", "Marie Claire China",
    "时尚先生", "Esquire China",
    "时尚健康", "Cosmopolitan China",
    "三联生活周刊", "Sanlian Life Weekly",
    "财经", "Caijing",
    "第一财经周刊", "Yi Magazine",
    "看天下", "VistaStory",
    "中国新闻周刊", "China Newsweek",
    "瑞丽", "Rayli",
    "男人装", "FHM China",
    // ── Display / Native / Programmatic (CN) ──
    "百度联盟", "Baidu Union",
    "腾讯广告", "Tencent Ads", "优量汇", "广点通",
    "阿里妈妈", "Alimama",
    "巨量引擎", "OceanEngine",
    "网易广告", "NetEase Ads",
    "新浪扶翼", "Sina Fuyi",
    "搜狐汇算", "Sohu",
    "凤凰网广告", "ifeng",
    "36氪", "36氪 广告",
    "知乎 广告",
    "头条 信息流", "Toutiao In-feed", "头条号", "Toutiao Hao",
    "微信 朋友圈", "WeChat Moments",
    "抖音 信息流", "Douyin In-feed",
    "快手 信息流", "Kuaishou In-feed",
    "小红书 信息流", "Xiaohongshu In-feed",
    "UC头条 信息流", "UC头条",
    "腾讯广告 ADX", "Tencent Ad Exchange",
    "阿里妈妈 UniDesk", "UniDesk",
    "京东京准通", "JD Joyzonton",
    "百度 营销中心", "Baidu Marketing",
    "新潮传媒", "New Potential Media",
    "多盟", "Domob",
    "InMobi 中国", "InMobi",
    // ── OOH 매체 ──
    "分众传媒", "Focus Media",
    "兆讯传媒", "Zhaoxun",
    // ── Cinema ──
    "万达影城", "Wanda Cinemas",
    "CGV",
    "横店影视城", "Hengdian",
    "大地影院", "Dadi Cinema",
    "金逸影城", "Jinyi",
    "中影南方", "上海联和电影院线",
    "时光网", "Mtime",
    // ── Classifieds / Jobs ──
    "智联招聘", "Zhaopin",
    "前程无忧", "51job",
    "BOSS直聘", "BOSS Zhipin",
    "拉勾", "Lagou",
    "猎聘", "Liepin",
    "看准网", "Kanzhun",
    "中华英才网", "ChinaHR",
    "实习僧", "Shixiseng",
    "应届生求职网", "YingJieSheng",
    "脉脉 招聘", "Maimai Jobs",
    // ── Real Estate ──
    "贝壳找房", "Beike",
    "链家", "Lianjia",
    "安居客", "Anjuke",
    "房天下", "Fang.com", "SouFun",
    "我爱我家", "5i5j",
    "中原地产", "Centaline",
    "房多多", "Fangdd",
    // ── Auto ──
    "懂车帝", "Dongchedi",
    "汽车之家", "Autohome",
    "易车", "Bitauto", "Yiche",
    "瓜子二手车", "Guazi",
    "优信二手车", "Uxin",
    "人人车", "Renrenche",
    "太平洋汽车", "PCAuto",
    "车300", "Che300",
    // ── Marketplace ──
    "闲鱼", "Xianyu",
    "转转", "Zhuanzhuan",
    "京东拍拍", "JD Paipai",
    "58同城", "58.com",
    "赶集网", "Ganji",
    "Poizon",
    // ── Service classifieds ──
    "美团点评", "Meituan Dianping", "美团",
    "大众点评", "Dazhong Dianping",
    "抖音生活服务", "Douyin Life Services",
    // ── Influencer 플랫폼 ──
    "抖音 达人", "Douyin KOL",
    "快手 网红", "Kuaishou KOL",
    "哔哩哔哩 UP主", "Bilibili UP",
    "视频号 创作者",
    "小红书 视频博主", "Xiaohongshu Video KOC",
    "西瓜视频 创作者",
    "小红书 博主", "Xiaohongshu Bloggers",
    "微博 大V", "Weibo Big-V",
    "抖音 图文 博主", "Douyin Graphic",
    "微信公众号", "WeChat 公众号",
    "知乎 答主", "Zhihu Answerer",
    "百度百家号", "Baidu Baijiahao",
    "简书", "Jianshu",
    // ── 라이브커머스 ──
    "抖音 直播", "Douyin Live",
    "淘宝直播", "Taobao Live",
    "快手 直播", "Kuaishou Live",
    "京东直播", "JD Live",
    "小红书 直播", "Xiaohongshu Live",
    "视频号 直播", "WeChat Channels Live",
    // ── B2B ──
    "脉脉 大V", "Maimai KOL",
    "知乎 行业专家",
    "36氪 作者",
    "雪球", "Xueqiu",
    "虎嗅", "Huxiu",
  ],

  // ─────────────────────────────────────────────────────────
  // GLOBAL — 모든 국가 공통 (차단국 별도 처리)
  // ─────────────────────────────────────────────────────────
  GLOBAL: [
    // ── 기존 항목 (유지) ──
    "Disney+", "X (Twitter)", "YouTube Music", "Apple Music", "Threads",
    "Spotify Podcasts", "Apple Podcasts",
    // ── OTT / CTV ──
    "Netflix", "Apple TV+", "Amazon Prime Video", "Prime Video",
    "YouTube on TV", "YouTube TV",
    // ── Online Video ──
    "YouTube", "Twitch", "Instagram Reels", "Reels",
    // ── Search ──
    "Google", "Bing", "Microsoft Bing", "Yahoo!",
    // ── Social ──
    "Instagram", "Facebook", "X", "Twitter", "TikTok",
    "LinkedIn", "Pinterest", "Snapchat", "Reddit",
    // ── Messenger ──
    "WhatsApp", "Telegram", "Discord", "Messenger",
    // ── Music streaming ──
    "Spotify", "Amazon Music",
    // ── Podcast ──
    "YouTube Podcasts",
    // ── Display / Programmatic (global) ──
    "Google DV360", "DV360", "Google Ads",
    "The Trade Desk", "TTD",
    "Criteo",
    // ── Classifieds (global) ──
    "Indeed", "LinkedIn Jobs",
  ],
};

// 라벨 → 매칭 키 변환 (소문자 + 공백 정리, 비교용)
function normalizeKey(s) {
  return String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * 미디어 상품 화이트리스트 (Set) 반환.
 *   - CHANNELS의 모든 media.label을 정규화하여 포함
 *   - 라벨에 국가 괄호가 있으면 해당 countryCode와 일치할 때만 포함 (글로벌이면 무조건 포함)
 *   - GENERIC_MEDIA_ALIASES는 글로벌 (모든 국가)
 * @param {string} countryCode - "KR", "CN", "JP", "US" 등. 없으면 글로벌만.
 * @returns {Set<string>} 정규화된 매칭 키 Set
 */
export function mediaProductWhitelist(countryCode) {
  const cc = countryCode ? String(countryCode).toUpperCase() : null;
  const out = new Set();
  for (const ch of CHANNELS) {
    for (const sub of ch.subchannels || []) {
      for (const m of sub.media || []) {
        const { name, countryCode: labelCc } = parseLabelCountry(m.label);
        // 국가코드 없는 라벨 = 글로벌 (모든 국가 허용)
        // 국가코드 있는 라벨 = 해당 국가일 때만
        if (!labelCc || (cc && labelCc === cc)) {
          if (name) out.add(normalizeKey(name));
          // 원본 라벨 그대로도 등록 ("Melon (KR)" 같이 페르소나가 전체 표기 쓸 가능성)
          out.add(normalizeKey(m.label));
        }
      }
    }
  }
  // 일반 미디어 카테고리 별칭 (글로벌)
  for (const alias of GENERIC_MEDIA_ALIASES) out.add(normalizeKey(alias));
  // canonicalize 결과 별칭 — 글로벌 + 해당 국가
  for (const alias of CANONICAL_MEDIA_ALIASES.GLOBAL) out.add(normalizeKey(alias));
  if (cc && CANONICAL_MEDIA_ALIASES[cc]) {
    for (const alias of CANONICAL_MEDIA_ALIASES[cc]) out.add(normalizeKey(alias));
  }
  // countryCode 없으면(글로벌 연산): 국가별 별칭은 제외 (채연이 KR 전용 멜론을 글로벌로 술지 않도록)
  return out;
}

/**
 * 채널명이 미디어 상품 화이트리스트에 속하는지 판정.
 *   canonicalizeChannel 결과 또는 원본 채널명을 받아 화이트리스트와 매칭.
 * @param {string} channel - 채널명 (canonical 또는 원본)
 * @param {Set<string>} whitelist - mediaProductWhitelist() 결과
 * @returns {boolean}
 */
export function isMediaProduct(channel, whitelist) {
  if (!channel || !whitelist) return false;
  return whitelist.has(normalizeKey(channel));
}

// 모든 미디어를 플랫 리스트로 추출 (도달 계산용)
export function flattenMedia() {
  const out = [];
  for (const ch of CHANNELS) {
    for (const sub of ch.subchannels) {
      for (const m of sub.media) {
        out.push({
          ...m,
          channelId: ch.id,
          channelLabel: ch.label,
          channelStatista: ch.statista,
          channelGwi: ch.gwi,
          subchannelId: sub.id,
          subchannelLabel: sub.label,
        });
      }
    }
  }
  return out;
}
