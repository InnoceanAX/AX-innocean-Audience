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
