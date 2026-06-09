// media-taxonomy.js — 업계 표준 3단 구조 (Channel → Subchannel → Media)
// 출처: Dentsu/WPP/Publicis/Nielsen/WARC 분류 통합
// 광고대행사 미디어플래닝 표준에 맞춤

// 베이스라인 도달률·신뢰도·CPM은 매체별로 정의 (성인 인구 기준 %)
export const CHANNELS = [
  {
    id: "tv",
    label: "Linear TV",
    icon: "tv",
    subchannels: [
      {
        id: "tv_terrestrial",
        label: "지상파",
        media: [
          { id: "tv_ter_main",    label: "지상파 종합편성",   baselineReach: 65, trustBase: 70, cpm: 14 },
          { id: "tv_ter_news",    label: "지상파 뉴스",       baselineReach: 50, trustBase: 75, cpm: 16 },
        ],
      },
      {
        id: "tv_cable",
        label: "케이블·종편",
        media: [
          { id: "tv_cable_ent",   label: "케이블 엔터테인먼트", baselineReach: 45, trustBase: 60, cpm: 10 },
          { id: "tv_cable_sports",label: "케이블 스포츠",     baselineReach: 25, trustBase: 65, cpm: 12 },
        ],
      },
      {
        id: "tv_ctv",
        label: "CTV (Connected TV)",
        media: [
          { id: "tv_netflix",     label: "Netflix",            baselineReach: 30, trustBase: 55, cpm: 22, internetWeight: 1.0 },
          { id: "tv_youtube_tv",  label: "YouTube on TV",      baselineReach: 35, trustBase: 60, cpm: 18, internetWeight: 1.0 },
          { id: "tv_disney_plus", label: "Disney+",            baselineReach: 18, trustBase: 58, cpm: 20, internetWeight: 1.0 },
        ],
      },
    ],
  },
  {
    id: "audio",
    label: "Audio",
    icon: "radio",
    subchannels: [
      {
        id: "audio_broadcast",
        label: "라디오 방송",
        media: [
          { id: "audio_fm",       label: "FM 라디오",          baselineReach: 35, trustBase: 60, cpm: 3 },
          { id: "audio_am",       label: "AM 라디오",          baselineReach: 12, trustBase: 55, cpm: 2 },
        ],
      },
      {
        id: "audio_streaming",
        label: "오디오 스트리밍",
        media: [
          { id: "audio_spotify",  label: "Spotify",            baselineReach: 22, trustBase: 50, cpm: 8,  internetWeight: 1.0 },
          { id: "audio_podcast",  label: "팟캐스트",           baselineReach: 18, trustBase: 65, cpm: 10, internetWeight: 1.0 },
          { id: "audio_apple",    label: "Apple Music",        baselineReach: 15, trustBase: 50, cpm: 9,  internetWeight: 1.0 },
        ],
      },
    ],
  },
  {
    id: "print",
    label: "Print",
    icon: "newspaper",
    subchannels: [
      {
        id: "print_news",
        label: "신문",
        media: [
          { id: "print_daily",    label: "종합 일간지",        baselineReach: 18, trustBase: 72, cpm: 7 },
          { id: "print_econ",     label: "경제·산업지",        baselineReach: 10, trustBase: 75, cpm: 9 },
        ],
      },
      {
        id: "print_mag",
        label: "잡지",
        media: [
          { id: "print_lifestyle",label: "라이프스타일 잡지",  baselineReach: 8,  trustBase: 65, cpm: 8 },
          { id: "print_trade",    label: "전문지·B2B",         baselineReach: 4,  trustBase: 75, cpm: 12 },
        ],
      },
    ],
  },
  {
    id: "ooh",
    label: "OOH",
    icon: "billboard",
    subchannels: [
      {
        id: "ooh_billboard",
        label: "옥외 광고판",
        media: [
          { id: "ooh_highway",    label: "고속도로 빌보드",    baselineReach: 28, trustBase: 50, cpm: 4 },
          { id: "ooh_urban",      label: "도심 빌보드",        baselineReach: 45, trustBase: 55, cpm: 5 },
        ],
      },
      {
        id: "ooh_transit",
        label: "교통수단",
        media: [
          { id: "ooh_subway",     label: "지하철 광고",        baselineReach: 40, trustBase: 55, cpm: 4 },
          { id: "ooh_bus",        label: "버스 광고",          baselineReach: 35, trustBase: 50, cpm: 3 },
          { id: "ooh_airport",    label: "공항 광고",          baselineReach: 15, trustBase: 65, cpm: 8 },
        ],
      },
      {
        id: "ooh_cinema",
        label: "영화관",
        media: [
          { id: "ooh_cinema_ad",  label: "영화관 프리롤",      baselineReach: 22, trustBase: 60, cpm: 12 },
        ],
      },
    ],
  },
  {
    id: "dooh",
    label: "DOOH",
    icon: "screen",
    subchannels: [
      {
        id: "dooh_digital",
        label: "디지털 옥외",
        media: [
          { id: "dooh_led_urban", label: "도심 LED 스크린",    baselineReach: 30, trustBase: 55, cpm: 6, internetWeight: 0.3 },
          { id: "dooh_transit",   label: "디지털 교통 광고",   baselineReach: 25, trustBase: 55, cpm: 5, internetWeight: 0.3 },
        ],
      },
      {
        id: "dooh_retail",
        label: "리테일 디스플레이",
        media: [
          { id: "dooh_instore",   label: "매장 내 디스플레이", baselineReach: 35, trustBase: 60, cpm: 4 },
          { id: "dooh_mall",      label: "쇼핑몰 디스플레이",  baselineReach: 28, trustBase: 58, cpm: 5 },
        ],
      },
    ],
  },
  {
    id: "digital",
    label: "Digital",
    icon: "globe",
    subchannels: [
      {
        id: "digital_search",
        label: "검색 광고",
        media: [
          { id: "dig_google_search", label: "Google 검색",     baselineReach: 70, trustBase: 70, cpm: 12, internetWeight: 1.0 },
          { id: "dig_naver",         label: "Naver",           baselineReach: 50, trustBase: 65, cpm: 10, internetWeight: 1.0 },
          { id: "dig_baidu",         label: "Baidu",           baselineReach: 25, trustBase: 60, cpm: 8,  internetWeight: 1.0 },
        ],
      },
      {
        id: "digital_display",
        label: "디스플레이",
        media: [
          { id: "dig_banner",     label: "배너·DA",            baselineReach: 60, trustBase: 40, cpm: 4, internetWeight: 1.0 },
          { id: "dig_native",     label: "Native Ads",         baselineReach: 35, trustBase: 50, cpm: 6, internetWeight: 1.0 },
        ],
      },
      {
        id: "digital_social",
        label: "Social",
        media: [
          { id: "dig_instagram",  label: "Instagram",          baselineReach: 38, trustBase: 50, cpm: 8,  internetWeight: 1.0 },
          { id: "dig_facebook",   label: "Facebook",           baselineReach: 35, trustBase: 45, cpm: 6,  internetWeight: 1.0 },
          { id: "dig_tiktok",     label: "TikTok",             baselineReach: 28, trustBase: 42, cpm: 7,  internetWeight: 1.1 },
          { id: "dig_x",          label: "X (Twitter)",        baselineReach: 18, trustBase: 40, cpm: 5,  internetWeight: 0.9 },
          { id: "dig_linkedin",   label: "LinkedIn",           baselineReach: 12, trustBase: 58, cpm: 18, internetWeight: 0.8 },
        ],
      },
      {
        id: "digital_video",
        label: "동영상",
        media: [
          { id: "dig_youtube",    label: "YouTube",            baselineReach: 60, trustBase: 62, cpm: 10, internetWeight: 1.0 },
          { id: "dig_twitch",     label: "Twitch",             baselineReach: 12, trustBase: 55, cpm: 11, internetWeight: 1.0 },
        ],
      },
      {
        id: "digital_programmatic",
        label: "Programmatic",
        media: [
          { id: "dig_dsp",        label: "DSP (RTB)",          baselineReach: 45, trustBase: 50, cpm: 5, internetWeight: 1.0 },
          { id: "dig_native_prog",label: "Native Programmatic",baselineReach: 30, trustBase: 55, cpm: 6, internetWeight: 1.0 },
        ],
      },
      {
        id: "digital_messaging",
        label: "메신저",
        media: [
          { id: "dig_kakao",      label: "KakaoTalk",          baselineReach: 30, trustBase: 60, cpm: 7, internetWeight: 1.0 },
          { id: "dig_whatsapp",   label: "WhatsApp",           baselineReach: 25, trustBase: 60, cpm: 5, internetWeight: 1.0 },
          { id: "dig_line",       label: "LINE",               baselineReach: 15, trustBase: 62, cpm: 8, internetWeight: 1.0 },
        ],
      },
    ],
  },
];

// 국가별 매체 가중치 (특수 시장)
export const COUNTRY_MEDIA_OVERRIDES = {
  CN: {
    // Google·Meta 차단
    dig_google_search: 0, dig_instagram: 0, dig_facebook: 0, dig_x: 0,
    dig_youtube: 0, tv_netflix: 0, tv_youtube_tv: 0, tv_disney_plus: 0,
    dig_whatsapp: 0,
    // 외국 메신저·프렌드 거의 없음
    dig_naver: 0, dig_kakao: 0, dig_line: 0,
    // Baidu·Tiktok 강세
    dig_baidu: 3.0, dig_tiktok: 1.4,
  },
  RU: { dig_instagram: 0.3, dig_facebook: 0.3, dig_x: 0.4, dig_naver: 0, dig_kakao: 0, dig_line: 0, dig_baidu: 0 },
  KR: { dig_tiktok: 0.8, dig_x: 0.7, dig_facebook: 0.6, dig_instagram: 1.1, dig_youtube: 1.2, dig_kakao: 2.5, dig_naver: 2.0, dig_baidu: 0 },
  JP: { dig_x: 1.4, dig_tiktok: 1.1, dig_linkedin: 0.4, dig_line: 2.5, dig_naver: 0.3 },
  IN: { dig_youtube: 1.3, dig_tiktok: 0.2, dig_facebook: 1.2, dig_naver: 0, dig_kakao: 0, dig_baidu: 0, dig_line: 0 },
  US: { dig_facebook: 1.1, dig_tiktok: 1.0, dig_x: 1.1, dig_naver: 0, dig_baidu: 0, dig_kakao: 0, dig_line: 0 },
  AE: { dig_facebook: 1.2, dig_instagram: 1.4, dig_tiktok: 1.2, dig_naver: 0, dig_baidu: 0, dig_kakao: 0 },
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
          subchannelId: sub.id,
          subchannelLabel: sub.label,
        });
      }
    }
  }
  return out;
}
