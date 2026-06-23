// channel-canon.js
// 2026-06-23 (CEO 지시 — 미디어 탭 persona-pool SoT):
//   LLM이 생성한 media_diet 채널명이 용도 괄호("YouTube (패션/브이로그)")나
//   표기 흔들림("TV (뉴스/드라마)" vs "TV 뉴스/드라마")으로 분산됨.
//   같은 플랫폼이 차트에서 여러 막대로 쪼개지는 문제 → 정규명으로 통합.
//
//   원칙: 플랫폼/매체 단위로 canonical 명칭 부여. 용도 괄호·세부 장르는 제거.
//   매핑은 보수적으로 — 확실한 플랫폼만 통합, 모르는 채널은 괄호만 떼고 원형 유지.

// 정규명 사전: 소문자 키워드 → canonical 표시명
// 키워드가 정규화된 베이스명에 '포함'되면 매칭 (부분 일치, 우선순위 순서대로)
const CANON_RULES = [
  // === 우선 분리 규칙 (상위 플랫폼에 흡수되면 안 되는 것 먼저) ===
  // 채연 정책: YouTube Music은 YouTube와 별도(사용 의도 다름), OTT는 TV와 별도
  { match: ["youtube music", "유튜브 뮤직", "youtube 뮤직"], canon: "YouTube Music" },
  { match: ["apple music", "애플뮤직", "애플 뮤직"], canon: "Apple Music" },
  { match: ["melon", "멜론"], canon: "멜론" },
  { match: ["genie", "지니뮤직", "지니"], canon: "지니뮤직" },
  { match: ["flo ", "플로"], canon: "FLO" },
  { match: ["tving", "티빙"], canon: "Tving" },
  { match: ["wavve", "웨이브"], canon: "Wavve" },
  { match: ["disney", "디즈니"], canon: "Disney+" },
  { match: ["coupang play", "쿠팡플레이", "쿠팡 플레이"], canon: "Coupang Play" },
  { match: ["watcha", "왓챠"], canon: "Watcha" },
  { match: ["abema", "아베마"], canon: "ABEMA" },
  { match: ["u-next", "unext", "유넥스트"], canon: "U-NEXT" },
  // === 글로벌 플랫폼 ===
  { match: ["youtube", "유튜브"], canon: "YouTube" },
  { match: ["instagram", "인스타그램", "인스타"], canon: "Instagram" },
  { match: ["tiktok", "틱톡"], canon: "TikTok" },
  { match: ["facebook", "페이스북"], canon: "Facebook" },
  { match: ["netflix", "넷플릭스"], canon: "Netflix" },
  { match: ["twitter", "트위터", " x ", "(x)"], canon: "X (Twitter)" },
  { match: ["threads", "스레드"], canon: "Threads" },
  { match: ["twitch", "트위치"], canon: "Twitch" },
  { match: ["spotify", "스포티파이"], canon: "Spotify" },
  { match: ["pinterest", "핀터레스트"], canon: "Pinterest" },
  // 한국
  { match: ["kakaotalk", "kakao", "카카오톡", "카카오"], canon: "KakaoTalk" },
  { match: ["naver", "네이버"], canon: "Naver" },
  { match: ["coupang", "쿠팡"], canon: "Coupang" },
  { match: ["daum", "다음"], canon: "Daum" },
  { match: ["baemin", "배민", "배달의민족"], canon: "배달의민족" },
  { match: ["musinsa", "무신사"], canon: "Musinsa" },
  { match: ["29cm"], canon: "29CM" },
  { match: ["zigzag", "지그재그"], canon: "Zigzag" },
  { match: ["오늘의집", "ohou"], canon: "오늘의집" },
  { match: ["당근", "daangn", "karrot"], canon: "당근마켓" },
  { match: ["올리브영", "oliveyoung"], canon: "올리브영" },
  // 일본
  { match: ["line", "라인", "ライン"], canon: "LINE" },
  { match: ["yahoo", "야후", "ヤフー"], canon: "Yahoo! Japan" },
  { match: ["niconico", "니코니코"], canon: "niconico" },
  { match: ["rakuten", "라쿠텐"], canon: "Rakuten" },
  { match: ["mercari", "메루카리", "メルカリ"], canon: "Mercari" },
  // 중국
  { match: ["xiaohongshu", "샤오훙수", "샤오홍슈", "rednote", "小红书"], canon: "Xiaohongshu" },
  { match: ["wechat", "위챗", "微信", "weixin"], canon: "WeChat" },
  { match: ["douyin", "더우인", "抖音"], canon: "Douyin" },
  { match: ["weibo", "웨이보", "微博"], canon: "Weibo" },
  { match: ["bilibili", "비리비리", "哔哩"], canon: "Bilibili" },
  { match: ["taobao", "타오바오"], canon: "Taobao" },
  { match: ["tmall", "티몰"], canon: "Tmall" },
  { match: ["kuaishou", "콰이쇼우"], canon: "Kuaishou" },
  { match: ["zhihu", "즈후"], canon: "Zhihu" },
  // 매스미디어 카테고리 (장르 무관 통합)
  { match: ["tv", "텔레비전", "티비"], canon: "TV" },
  { match: ["라디오", "radio"], canon: "라디오" },
  { match: ["신문", "newspaper"], canon: "신문" },
  { match: ["옥외", "ooh", "billboard", "전광판"], canon: "옥외광고(OOH)" },
  { match: ["팟캐스트", "podcast"], canon: "팟캐스트" },
  // 포털/뉴스 일반 (특정 플랫폼 매칭 실패 시)
  { match: ["포털", "portal"], canon: "포털/뉴스" },
];

/**
 * 채널명을 canonical 명칭으로 정규화.
 * @param {string} raw  LLM이 생성한 원본 채널명 (예: "YouTube (패션/브이로그)")
 * @returns {string}  canonical 명칭 (예: "YouTube"). 매칭 실패 시 괄호만 제거한 원형.
 */
export function canonicalizeChannel(raw) {
  if (!raw || typeof raw !== "string") return "";
  const original = raw.trim();
  // 괄호(용도/장르) 제거 + 소문자화하여 매칭용 베이스 생성
  const base = original
    .replace(/[（(].*?[）)]/g, " ")   // 괄호 안 내용 제거 (전각/반각)
    .replace(/\s+/g, " ")
    .trim();
  const hay = ` ${(original + " " + base).toLowerCase()} `;
  for (const rule of CANON_RULES) {
    for (const kw of rule.match) {
      if (hay.includes(kw.toLowerCase())) return rule.canon;
    }
  }
  // 매칭 실패: 괄호만 떼고 슬래시 앞 핵심어만 남긴 원형 반환 (과도 통합 방지)
  const cleaned = base.split("/")[0].trim();
  return cleaned || original;
}

/**
 * 페르소나 배열의 media_diet 채널명을 정규화한 사본 반환 (원본 불변).
 * 같은 페르소나 안에서 정규화 후 동일 채널이 중복되면 hoursPerDay 합산.
 */
export function canonicalizePersonaMedia(personas) {
  if (!Array.isArray(personas)) return personas;
  return personas.map((p) => {
    if (!Array.isArray(p?.media_diet)) return p;
    const merged = new Map(); // canon → hoursPerDay 합산
    for (const m of p.media_diet) {
      if (!m || !m.channel) continue;
      const canon = canonicalizeChannel(m.channel);
      if (!canon) continue;
      merged.set(canon, (merged.get(canon) || 0) + (Number(m.hoursPerDay) || 0));
    }
    const media_diet = Array.from(merged.entries()).map(([channel, hoursPerDay]) => ({
      channel,
      hoursPerDay: Math.round(hoursPerDay * 100) / 100,
    }));
    return { ...p, media_diet };
  });
}
