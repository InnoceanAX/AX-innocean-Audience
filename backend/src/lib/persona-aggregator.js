// persona-aggregator.js
// Stage 3 — Pure functional aggregator that turns N merged personas into
// 6 dashboard tabs (WHO/LIFE/MIND/LOVE/BUY/MEDIA).

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

// LIFE — lifestyle_tags top + occupation distribution
export function aggregateLife(personas) {
  const total = personas.length;
  const tags = new Map();
  for (const p of personas) {
    for (const tag of p.lifestyle_tags || []) tags.set(tag, (tags.get(tag) || 0) + 1);
  }
  const topLifestyleTags = toRanked(tags, { topN: 20 });
  const occupation = distribution(tally(personas, p => p.occupationLabel || p.occupation), { total });
  return { total, topLifestyleTags, occupation };
}

// MIND — values_tags top + shopping_style distribution
export function aggregateMind(personas) {
  const total = personas.length;
  const vals = new Map();
  for (const p of personas) {
    for (const v of p.values_tags || []) vals.set(v, (vals.get(v) || 0) + 1);
  }
  const topValuesTags = toRanked(vals, { topN: 20 });
  const shoppingStyle = distribution(tally(personas, p => p.shopping_style), { total });
  return { total, topValuesTags, shoppingStyle };
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

  return { total, kFashionHistogram, fashionHistogram, kCultureHistogram, topBrandAffinity };
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
  return { total, priceSensitivity, topBrandAffinity, shoppingStyle };
}

// MEDIA — media_diet aggregated (channel → total hours and avg hours)
export function aggregateMedia(personas) {
  const total = personas.length;
  const sums = new Map(); // channel → { totalHours, mentions }
  for (const p of personas) {
    for (const m of p.media_diet || []) {
      if (!m || !m.channel) continue;
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
  return { total, channels };
}

// Bundle all 6 tabs for one scope (country or "all")
export function aggregateAll(personas) {
  return {
    who:   aggregateWho(personas),
    life:  aggregateLife(personas),
    mind:  aggregateMind(personas),
    love:  aggregateLove(personas),
    buy:   aggregateBuy(personas),
    media: aggregateMedia(personas),
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
    byCountry[cc] = aggregateAll(list);
  }
  const all = aggregateAll(personas);
  return { byCountry, byTab: all, total: personas.length };
}
