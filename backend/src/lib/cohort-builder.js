// cohort-builder.js
// Stage 1 — Statistical sampling (no LLM) of 100 personas per country.
// Generic, campaign-agnostic distributions. Stage 2 LLM enriches
// interests, values_tags, lifestyle_tags, media_diet, brand_affinity, shopping_style.

import { makeRng, weightedPick, randInt, randBeta } from "./seeded-rng.js";

// Country-level demographic seeds (rough public-data anchored values, not survey-exact).
// We intentionally keep this self-contained so cohort generation never blocks on World Bank API,
// but Stage 2 narrative can still enrich with live WB data.
const COUNTRY_DEMO = {
  KR: {
    name: "South Korea",
    sexRatioFemale: 0.502,
    ageBucketWeights: { "18-24": 0.12, "25-34": 0.16, "35-44": 0.19, "45-54": 0.21, "55-64": 0.18, "65+": 0.14 },
    regions: [
      { name: "Seoul",   weight: 0.45 },
      { name: "Busan",   weight: 0.12 },
      { name: "Incheon", weight: 0.10 },
      { name: "Daegu",   weight: 0.08 },
      { name: "Daejeon", weight: 0.06 },
      { name: "Gwangju", weight: 0.05 },
      { name: "Suwon",   weight: 0.07 },
      { name: "Other",   weight: 0.07 },
    ],
    education: { highSchool: 0.15, vocational: 0.15, bachelor: 0.55, postgrad: 0.15 },
    cityTier: { metro: 0.50, midCity: 0.35, rural: 0.15 },
    occupation: { student: 0.08, office: 0.30, professional: 0.15, selfEmployed: 0.12, service: 0.15, creative: 0.08, tech: 0.07, homemaker: 0.05 },
    incomeQuintiles: ["Q1","Q2","Q3","Q4","Q5"], // equal split → 20% each, perturbed by RNG
  },
  JP: {
    name: "Japan",
    sexRatioFemale: 0.512,
    ageBucketWeights: { "18-24": 0.10, "25-34": 0.14, "35-44": 0.17, "45-54": 0.20, "55-64": 0.18, "65+": 0.21 },
    regions: [
      { name: "Tokyo",    weight: 0.40 },
      { name: "Osaka",    weight: 0.15 },
      { name: "Yokohama", weight: 0.10 },
      { name: "Nagoya",   weight: 0.09 },
      { name: "Fukuoka",  weight: 0.07 },
      { name: "Sapporo",  weight: 0.06 },
      { name: "Kyoto",    weight: 0.06 },
      { name: "Other",    weight: 0.07 },
    ],
    education: { highSchool: 0.20, vocational: 0.20, bachelor: 0.50, postgrad: 0.10 },
    cityTier: { metro: 0.55, midCity: 0.30, rural: 0.15 },
    occupation: { student: 0.08, office: 0.30, professional: 0.15, selfEmployed: 0.12, service: 0.15, creative: 0.08, tech: 0.07, homemaker: 0.05 },
    incomeQuintiles: ["Q1","Q2","Q3","Q4","Q5"],
  },
  CN: {
    name: "China (Shanghai/Hangzhou/Tianjin)",
    sexRatioFemale: 0.488,
    ageBucketWeights: { "18-24": 0.13, "25-34": 0.18, "35-44": 0.22, "45-54": 0.20, "55-64": 0.15, "65+": 0.12 },
    regions: [
      { name: "Shanghai", weight: 0.50 },
      { name: "Hangzhou", weight: 0.24 },
      { name: "Tianjin",  weight: 0.26 },
    ],
    education: { highSchool: 0.25, vocational: 0.20, bachelor: 0.45, postgrad: 0.10 },
    cityTier: { metro: 0.60, midCity: 0.25, rural: 0.15 },
    occupation: { student: 0.08, office: 0.30, professional: 0.15, selfEmployed: 0.12, service: 0.15, creative: 0.08, tech: 0.07, homemaker: 0.05 },
    incomeQuintiles: ["Q1","Q2","Q3","Q4","Q5"],
  },
  TW: {
    name: "Taiwan",
    sexRatioFemale: 0.506,
    ageBucketWeights: { "20-24": 0.31, "25-29": 0.34, "30-34": 0.35 },
    regions: [
      { name: "Taipei",     weight: 0.42 },
      { name: "Taichung",   weight: 0.22 },
      { name: "Kaohsiung",  weight: 0.18 },
      { name: "Tainan",     weight: 0.10 },
      { name: "Hsinchu",    weight: 0.08 },
    ],
    kCultureMean: 80, kCultureStd: 12,
    kFashionMean: 76, kFashionStd: 14,
    fashionMean:  74, fashionStd: 13,
    occupation: { student: 0.16, junior_office: 0.36, creative: 0.18, freelance: 0.12, tech: 0.18 },
    incomeQuintiles: ["Q1","Q2","Q3","Q4","Q5"],
  },
  TH: {
    name: "Thailand",
    sexRatioFemale: 0.510,
    ageBucketWeights: { "20-24": 0.33, "25-29": 0.34, "30-34": 0.33 },
    regions: [
      { name: "Bangkok",       weight: 0.55 },
      { name: "Chiang Mai",    weight: 0.13 },
      { name: "Pattaya",       weight: 0.10 },
      { name: "Phuket",        weight: 0.08 },
      { name: "Khon Kaen",     weight: 0.07 },
      { name: "Other",         weight: 0.07 },
    ],
    kCultureMean: 85, kCultureStd: 10,
    kFashionMean: 80, kFashionStd: 12,
    fashionMean:  72, fashionStd: 14,
    occupation: { student: 0.18, junior_office: 0.32, creative: 0.20, freelance: 0.14, tech: 0.16 },
    incomeQuintiles: ["Q1","Q2","Q3","Q4","Q5"],
  },
  PH: {
    name: "Philippines",
    sexRatioFemale: 0.498,
    ageBucketWeights: { "20-24": 0.36, "25-29": 0.34, "30-34": 0.30 },
    regions: [
      { name: "Metro Manila", weight: 0.50 },
      { name: "Cebu",         weight: 0.18 },
      { name: "Davao",        weight: 0.12 },
      { name: "Quezon City",  weight: 0.10 },
      { name: "Iloilo",       weight: 0.06 },
      { name: "Other",        weight: 0.04 },
    ],
    kCultureMean: 78, kCultureStd: 12,
    kFashionMean: 74, kFashionStd: 14,
    fashionMean:  70, fashionStd: 15,
    occupation: { student: 0.20, junior_office: 0.30, creative: 0.18, freelance: 0.18, tech: 0.14 },
    incomeQuintiles: ["Q1","Q2","Q3","Q4","Q5"],
  },
};

const DEFAULT_DEMO = {
  name: "Generic",
  sexRatioFemale: 0.505,
  ageBucketWeights: { "18-24": 0.15, "25-34": 0.20, "35-44": 0.20, "45-54": 0.20, "55-64": 0.15, "65+": 0.10 },
  regions: [{ name: "Capital", weight: 0.6 }, { name: "Other", weight: 0.4 }],
  education: { highSchool: 0.15, vocational: 0.20, bachelor: 0.50, postgrad: 0.15 },
  cityTier: { metro: 0.55, midCity: 0.30, rural: 0.15 },
  occupation: { student: 0.08, office: 0.30, professional: 0.15, selfEmployed: 0.12, service: 0.15, creative: 0.08, tech: 0.07, homemaker: 0.05 },
  incomeQuintiles: ["Q1","Q2","Q3","Q4","Q5"],
};

const OCCUPATION_LABELS_KO = {
  student:      "학생",
  office:       "사무직",
  professional: "전문직",
  selfEmployed: "자영업/프리랜서",
  service:      "서비스/영업",
  creative:     "크리에이티브",
  tech:         "IT/테크",
  homemaker:    "주부/가사",
};

function ageFromBucket(rng, bucket) {
  if (bucket.endsWith("+")) {
    const a = parseInt(bucket, 10);
    return randInt(rng, a, a + 9); // e.g. "65+" → 65..74
  }
  const [a, b] = bucket.split("-").map(n => parseInt(n, 10));
  return randInt(rng, a, b);
}

// Normalize region weights when caller overrides them (e.g. CN preset).
function buildRegions(demo, overrideRegionNames) {
  if (Array.isArray(overrideRegionNames) && overrideRegionNames.length) {
    // Use the demo weights if available, otherwise equal split
    return overrideRegionNames.map(name => {
      const hit = demo.regions.find(r => r.name === name);
      return hit ? { ...hit } : { name, weight: 1 / overrideRegionNames.length };
    });
  }
  return demo.regions;
}

/**
 * Build N persona attribute records for a given country.
 * @param {Object} opts
 * @param {string} opts.country  ISO2 code
 * @param {number} opts.size     count (default 100)
 * @param {string} opts.seed     deterministic seed string (default `${briefId}:${country}`)
 * @param {string[]} [opts.regions]  override allowed region names (e.g. CN: ["Shanghai","Hangzhou","Tianjin"])
 * @param {Object} [opts.targets]    brief.targets override (M-9 fix 2026-06-17 21:47)
 * @param {string[]} [opts.targets.ageBuckets]  whitelist age buckets (e.g. ["20대","30대"])
 * @param {string} [opts.targets.gender]        "female" / "male" / "all" — gender override
 * @returns {Array<Object>} attribute personas
 */
export function buildCohort({ country, size = 100, seed, regions: regionOverride, targets } = {}) {
  const cc = String(country || "").toUpperCase();
  const demo = COUNTRY_DEMO[cc] || DEFAULT_DEMO;
  const rng = makeRng(seed || `cohort:${cc}:${size}`);

  const regionList = buildRegions(demo, regionOverride);
  const regionWeights = Object.fromEntries(regionList.map(r => [r.name, r.weight]));

  // M-9 fix: apply brief.targets to Stage 1 cohort generation.
  // ageBuckets: whitelist filter on demo.ageBucketWeights
  // gender: override sexRatioFemale (female=1.0, male=0.0, all=keep demo)
  let ageWeights = demo.ageBucketWeights;
  if (targets && Array.isArray(targets.ageBuckets) && targets.ageBuckets.length) {
    const allowSet = new Set(targets.ageBuckets);
    const filtered = Object.fromEntries(
      Object.entries(demo.ageBucketWeights).filter(([k]) => allowSet.has(k))
    );
    const sum = Object.values(filtered).reduce((a, b) => a + b, 0);
    if (sum > 0) {
      // re-normalize to sum=1
      ageWeights = Object.fromEntries(
        Object.entries(filtered).map(([k, v]) => [k, v / sum])
      );
    }
  }
  let femaleRatio = demo.sexRatioFemale;
  if (targets && typeof targets.gender === "string") {
    if (targets.gender === "female") femaleRatio = 1.0;
    else if (targets.gender === "male") femaleRatio = 0.0;
    // "all" or other → keep demo default
  }

  const out = [];
  for (let i = 0; i < size; i++) {
    const ageBucket = weightedPick(rng, ageWeights);
    const age = ageFromBucket(rng, ageBucket);
    const gender = rng() < femaleRatio ? "female" : "male";
    const region = weightedPick(rng, regionWeights);
    const incomeQuintile = demo.incomeQuintiles[randInt(rng, 0, demo.incomeQuintiles.length - 1)];
    const occupationKey = weightedPick(rng, demo.occupation);

    const education     = weightedPick(rng, demo.education);
    const cityTier      = weightedPick(rng, demo.cityTier);
    const priceSensitivity = randInt(rng, 1, 5);

    out.push({
      persona_id: `${cc}-${String(i + 1).padStart(3, "0")}`,
      country: cc,
      ageBucket,
      age,
      gender,
      region,
      incomeQuintile,
      occupation: occupationKey,
      occupationLabel: OCCUPATION_LABELS_KO[occupationKey] || occupationKey,
      education,
      cityTier,
      price_sensitivity: priceSensitivity,
      interests: [],
      values_tags: [],
      lifestyle_tags: [],
      media_diet: [],
      brand_affinity: [],
      shopping_style: null,
    });
  }
  return out;
}


export const SUPPORTED_COUNTRIES = Object.keys(COUNTRY_DEMO);
export { COUNTRY_DEMO };
