// persona-aggregator.js
// Stage 3 — Pure functional aggregator that turns N merged personas into
// 6 dashboard tabs (WHO/LIFE/MIND/LOVE/BUY/MEDIA).
import { canonicalizePersonaMedia, canonicalizeChannel } from "./channel-canon.js";
import { mediaProductWhitelist, isMediaProduct } from "../data/media-taxonomy.js";

function tally(items, keyFn) {
  const m = new Map();
  for (const it of items) {
    const k = keyFn(it);
    if (k == null || k === "") continue;
    m.set(k, (m.get(k) || 0) + 1);
  }
  return m;
}

function toRanked(map, { topN = 20, total } = {}) {
  const t = total ?? Array.from(map.values()).reduce((s, n) => s + n, 0);
  return Array.from(map.entries())
    .map(([key, count]) => ({ key, count, share: t ? count / t : 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

function distribution(map, { total } = {}) {
  const t = total ?? Array.from(map.values()).reduce((s, n) => s + n, 0);
  const obj = {};
  for (const [k, v] of map.entries()) obj[k] = { count: v, share: t ? v / t : 0 };
  return obj;
}

// WHO — age / gender / region / income / education / occupation / cityTier
export function aggregateWho(personas) {
  const total = personas.length;
  const age = distribution(tally(personas, p => p.ageBucket), { total });
  const gender = distribution(tally(personas, p => p.gender), { total });
  const region = toRanked(tally(personas, p => p.region), { topN: 10, total });
  const income = distribution(tally(personas, p => p.incomeQuintile), { total });

  // Phase 2-B 추가
  const education = distribution(tally(personas, p => p.education), { total });
  const occupation = distribution(tally(personas, p => p.occupationLabel || p.occupation), { total });

  // cityTier: 영문 키 → 한글 레이블 변환 후 집계
  const cityTierLabel = { metro: '대도시', midCity: '중소도시', rural: '농촌/읍면' };
  const cityTier = distribution(
    tally(personas, p => cityTierLabel[p.cityTier] ?? p.cityTier),
    { total }
  );

  return { total, age, gender, region, income, education, occupation, cityTier };
}

// 2026-06-23: 점수형 객체 키별 평균 계산 헬퍼.
//   p[field] = { keyA: 0~100, keyB: ... } 구조의 100명 평균을 동일 스키마로 난 하나의 객체로.
function avgScoreObject(personas, field, keys) {
  const sums = {}; const counts = {};
  for (const k of keys) { sums[k] = 0; counts[k] = 0; }
  for (const p of personas) {
    const obj = p && p[field];
    if (!obj || typeof obj !== "object") continue;
    for (const k of keys) {
      const v = Number(obj[k]);
      if (Number.isFinite(v)) { sums[k] += v; counts[k] += 1; }
    }
  }
  const out = {};
  for (const k of keys) out[k] = counts[k] ? Math.round((sums[k] / counts[k]) * 10) / 10 : 0;
  return out;
}

// LIFE — lifestyle_tags top + occupation distribution + baseline 차트 6개
export function aggregateLife(personas) {
  const total = personas.length;
  const tags = new Map();
  for (const p of personas) {
    for (const tag of p.lifestyle_tags || []) tags.set(tag, (tags.get(tag) || 0) + 1);
  }
  const topLifestyleTags = toRanked(tags, { topN: 20 });
  const occupation = distribution(tally(personas, p => p.occupationLabel || p.occupation), { total });
  // 2026-06-23 baseline 차트 6개 집계
  const LIFE_ACTIVITIES_KEYS = ["운동","독서","게임","여행","외식","쇼핑"];
  const activities = avgScoreObject(personas, "activities", LIFE_ACTIVITIES_KEYS);
  const travelType = distribution(tally(personas, p => p.travelType), { total });
  const activeDaypart = distribution(tally(personas, p => p.activeDaypart), { total });
  const foodHabit = distribution(tally(personas, p => p.foodHabit), { total });
  const wellnessFreq = distribution(tally(personas, p => p.wellnessFreq), { total });
  const travelFreq = distribution(tally(personas, p => p.travelFreq), { total });
  return { total, topLifestyleTags, occupation,
    activities, travelType, activeDaypart, foodHabit, wellnessFreq, travelFreq };
}

// MIND — values_tags top + shopping_style distribution + baseline 차트 6개
export function aggregateMind(personas) {
  const total = personas.length;
  const vals = new Map();
  for (const p of personas) {
    for (const v of p.values_tags || []) vals.set(v, (vals.get(v) || 0) + 1);
  }
  const topValuesTags = toRanked(vals, { topN: 20 });
  const shoppingStyle = distribution(tally(personas, p => p.shopping_style), { total });
  // 2026-06-23 baseline 차트 6개 집계
  const MIND_CORE_KEYS = ["성취","안정","자유","관계","성장"];
  const MIND_MINDSET_KEYS = ["브랜드신뢰","리스크수용","미래낙관","개인낙관","스트레스"];
  const MIND_BIG5_KEYS = ["개방성","성실성","외향성","우호성","신경성"];
  const coreValues = avgScoreObject(personas, "coreValues", MIND_CORE_KEYS);
  const mindset = avgScoreObject(personas, "mindset", MIND_MINDSET_KEYS);
  const bigFive = avgScoreObject(personas, "bigFive", MIND_BIG5_KEYS);
  const socialConcern = distribution(tally(personas, p => p.socialConcern), { total });
  const decisionStyle = distribution(tally(personas, p => p.decisionStyle), { total });
  const infoSource = distribution(tally(personas, p => p.infoSource), { total });
  return { total, topValuesTags, shoppingStyle,
    coreValues, mindset, bigFive, socialConcern, decisionStyle, infoSource };
}

// LOVE — K-fashion vs general fashion interest histograms + top brand_affinity
export function aggregateLove(personas) {
  const total = personas.length;
  const buckets = ["0-20", "21-40", "41-60", "61-80", "81-100"];
  function bucketOf(score) {
    if (score <= 20) return "0-20";
    if (score <= 40) return "21-40";
    if (score <= 60) return "41-60";
    if (score <= 80) return "61-80";
    return "81-100";
  }
  function histogram(getter) {
    const m = new Map(buckets.map(b => [b, 0]));
    for (const p of personas) m.set(bucketOf(getter(p) || 0), m.get(bucketOf(getter(p) || 0)) + 1);
    return Object.fromEntries(Array.from(m.entries()).map(([b, c]) => [b, { count: c, share: total ? c / total : 0 }]));
  }
  const kFashionHistogram = histogram(p => p.kFashionInterest);
  const fashionHistogram  = histogram(p => p.fashionInterest);
  const kCultureHistogram = histogram(p => p.kCultureExposure);

  // Aggregate brand affinity (avg score weighted by appearances)
  const sums = new Map(); // brand → { sumScore, mentions }
  for (const p of personas) {
    for (const ba of p.brand_affinity || []) {
      if (!ba || !ba.brand) continue;
      const cur = sums.get(ba.brand) || { sumScore: 0, mentions: 0 };
      cur.sumScore += Number(ba.score) || 0;
      cur.mentions += 1;
      sums.set(ba.brand, cur);
    }
  }
  const topBrandAffinity = Array.from(sums.entries())
    .map(([brand, v]) => ({ brand, mentions: v.mentions, avgScore: v.mentions ? v.sumScore / v.mentions : 0 }))
    .sort((a, b) => (b.mentions * b.avgScore) - (a.mentions * a.avgScore))
    .slice(0, 15);

  // 2026-06-23 baseline 차트 6개 집계 (love)
  const LOVE_INTERESTS_KEYS = ["패션","뷰티","테크","음식","여행","운동","게임","문화"];
  const LOVE_SPORTS_KEYS = ["축구","야구","농구","골프","홈트"];
  const interests = avgScoreObject(personas, "interests", LOVE_INTERESTS_KEYS);
  const sportsAffinity = avgScoreObject(personas, "sportsAffinity", LOVE_SPORTS_KEYS);
  const musicGenre = distribution(tally(personas, p => p.musicGenre), { total });
  const contentGenre = distribution(tally(personas, p => p.contentGenre), { total });
  const influencerType = distribution(tally(personas, p => p.influencerType), { total });

  return { total, kFashionHistogram, fashionHistogram, kCultureHistogram, topBrandAffinity,
    interests, sportsAffinity, musicGenre, contentGenre, influencerType };
}

// BUY — price_sensitivity distribution + top brand_affinity + shopping_style
export function aggregateBuy(personas) {
  const total = personas.length;
  const priceSensitivity = distribution(tally(personas, p => String(p.price_sensitivity ?? "")), { total });
  // top10 brand_affinity by mentions × avgScore (already in LOVE; reuse logic compactly)
  const sums = new Map();
  for (const p of personas) {
    for (const ba of p.brand_affinity || []) {
      if (!ba || !ba.brand) continue;
      const cur = sums.get(ba.brand) || { sumScore: 0, mentions: 0 };
      cur.sumScore += Number(ba.score) || 0;
      cur.mentions += 1;
      sums.set(ba.brand, cur);
    }
  }
  const topBrandAffinity = Array.from(sums.entries())
    .map(([brand, v]) => ({ brand, mentions: v.mentions, avgScore: v.mentions ? v.sumScore / v.mentions : 0 }))
    .sort((a, b) => (b.mentions * b.avgScore) - (a.mentions * a.avgScore))
    .slice(0, 10);
  const shoppingStyle = distribution(tally(personas, p => p.shopping_style), { total });
  // 2026-06-23 baseline 차트 6개 집계 (buy)
  const BUY_CAT_KEYS = ["의류","뷰티","전자","식품","리빙","여행","문화","건강"];
  const BUY_FACTORS_KEYS = ["가격","품질","브랜드","리뷰","디자인","배송"];
  const BUY_PROFILE_KEYS = ["가격민감","브랜드충성","할인민감","리뷰영향","브랜드전환","윤리소비"];
  const purchaseCategories = avgScoreObject(personas, "purchaseCategories", BUY_CAT_KEYS);
  const buyFactors = avgScoreObject(personas, "buyFactors", BUY_FACTORS_KEYS);
  const buyProfile = avgScoreObject(personas, "buyProfile", BUY_PROFILE_KEYS);
  const paymentMethod = distribution(tally(personas, p => p.paymentMethod), { total });
  const shoppingChannel = distribution(tally(personas, p => p.shoppingChannel), { total });
  const purchaseFreq = distribution(tally(personas, p => p.purchaseFreq), { total });
  return { total, priceSensitivity, topBrandAffinity, shoppingStyle,
    purchaseCategories, buyFactors, buyProfile, paymentMethod, shoppingChannel, purchaseFreq };
}

// MEDIA — media_diet aggregated (channel → total hours and avg hours)
// 2026-06-23 (CEO 지시): 미디어 차트에서 제외할 순수 쇼핑/커머스 플랫폼.
//   이들은 미디어(영상/SNS/검색/OTT/음악/뉴스)가 아니라 구매 채널 → 미디어 집계에서 빼다.
//   (주의: "Coupang Play"는 OTT라 유지, 일반 "Coupang"만 제외)
const MEDIA_EXCLUDE_SHOPPING = new Set([
  "Musinsa", "Coupang", "11번가", "G마켓", "옥션", "위메프", "SSG", "SSG.COM", "Gmarket",
  "29CM", "Zigzag", "지그재그", "아이허브", "패션 전문 앤", "패션앤", "패션 앤",
  "당근마켓", "번개장터", "올리브영", "오늘의집", "클러스타", "Ably", "에이블리",
  "Amazon", "아마존", "Taobao", "Tmall", "Rakuten", "Mercari", "Shopee", "Lazada",
]);

// 2026-06-23 (CEO 지시): country 인자 추가. 미디어 차트 = "국가별 미디어 상품 화이트리스트"만으로 구성.
//   CHANNELS(95개 미디어 상품) + 국가코드 기반. 무신사/특정 브랜드 하드코딩 분기 없음.
export function aggregateMedia(personasRaw, countryCode) {
  // 2026-06-23 (CEO 지시): 채널명 정규화 — LLM 표기 흔들림("YouTube (패션)" 등) 통합.
  const personas = canonicalizePersonaMedia(personasRaw);
  const total = personas.length;
  // CEO 2026-06-23: 국가별 미디어 상품 화이트리스트 구성
  const whitelist = mediaProductWhitelist(countryCode);
  const sums = new Map(); // channel → { totalHours, mentions }
  for (const p of personas) {
    for (const m of p.media_diet || []) {
      if (!m || !m.channel) continue;
      // 보조 블랙리스트 (화이트리스트 통과 전 안전망) — 순수 쇼핑/커머스 차단
      if (MEDIA_EXCLUDE_SHOPPING.has(m.channel)) continue;
      // CEO 2026-06-23: 화이트리스트 기반 주필터 — 국가별 미디어 상품만 집계
      //   canonical 또는 원본이 화이트리스트에 있어야 인정
      const canon = canonicalizeChannel(m.channel) || m.channel;
      if (!isMediaProduct(canon, whitelist) && !isMediaProduct(m.channel, whitelist)) continue;
      const cur = sums.get(m.channel) || { totalHours: 0, mentions: 0 };
      cur.totalHours += Number(m.hoursPerDay) || 0;
      cur.mentions += 1;
      sums.set(m.channel, cur);
    }
  }
  const channels = Array.from(sums.entries())
    .map(([channel, v]) => ({
      channel,
      mentions: v.mentions,
      reach: total ? v.mentions / total : 0,
      totalHoursPerDay: v.totalHours,
      avgHoursPerDay: v.mentions ? v.totalHours / v.mentions : 0,
    }))
    .sort((a, b) => b.totalHoursPerDay - a.totalHoursPerDay)
    .slice(0, 20);
  return { total, channels, adReceptivity: aggregateAdReceptivity(personas) };
}

// 2026-06-23 (CEO 지시): 광고형식별 수용도 집계. 100명 개인 ad_receptivity 평균.
//   차트5 persona-pool SoT. count(명수) 실재.
export function aggregateAdReceptivity(personas) {
  const KEYS = ["영상 광고", "검색 광고", "디스플레이", "소셜 피드", "인플루언서"];
  const sums = {};
  const counts = {};
  for (const k of KEYS) { sums[k] = 0; counts[k] = 0; }
  for (const p of personas) {
    const ar = p.ad_receptivity;
    if (!ar || typeof ar !== "object") continue;
    for (const k of KEYS) {
      const v = Number(ar[k]);
      if (Number.isFinite(v)) { sums[k] += v; counts[k] += 1; }
    }
  }
  const formats = KEYS.map((k) => ({
    format: k,
    avg: counts[k] ? Math.round((sums[k] / counts[k]) * 10) / 10 : null,
    n: counts[k],
  })).sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1));
  return { total: personas.length, formats };
}

// Bundle all 6 tabs for one scope (country or "all")
// 2026-06-23 (CEO 지시): aggregateMedia에 countryCode 전파
export function aggregateAll(personas, countryCode) {
  return {
    who:   aggregateWho(personas),
    life:  aggregateLife(personas),
    mind:  aggregateMind(personas),
    love:  aggregateLove(personas),
    buy:   aggregateBuy(personas),
    media: aggregateMedia(personas, countryCode),
  };
}

// Build full insight payload: byCountry + byTab (all countries combined)
export function buildInsightPayload(personas) {
  const byCountry = {};
  const groups = new Map();
  for (const p of personas) {
    const cc = p.country || "??";
    if (!groups.has(cc)) groups.set(cc, []);
    groups.get(cc).push(p);
  }
  for (const [cc, list] of groups.entries()) {
    // 국가별 집계: 해당 cc 전달 (?? = 알 수 없음, 글로벌만 매칭)
    byCountry[cc] = aggregateAll(list, cc === "??" ? null : cc);
  }
  // 전체 byTab: country 없음 (글로벌 채널만 적용)
  const all = aggregateAll(personas, null);
  return { byCountry, byTab: all, total: personas.length };
}
