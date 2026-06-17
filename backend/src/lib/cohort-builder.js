// cohort-builder.js
// Stage 1 — Statistical sampling (no LLM) of 100 personas per country.
// Reflects rough World Bank / national-statistic-style distributions for ages
// 20-34 fashion-interested cohort.

import { makeRng, weightedPick, randInt, randBeta } from "./seeded-rng.js";

// Country-level demographic seeds (rough public-data anchored values, not survey-exact).
// We intentionally keep this self-contained so cohort generation never blocks on World Bank API,
// but Stage 2 narrative can still enrich with live WB data.
const COUNTRY_DEMO = {
  KR: {
    name: "South Korea",
    sexRatioFemale: 0.502,
    ageBucketWeights: { "20-24": 0.30, "25-29": 0.34, "30-34": 0.36 },
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
    kCultureMean: 88, kCultureStd: 8,
    kFashionMean: 82, kFashionStd: 12,
    fashionMean:  78, fashionStd: 14,
    occupation: { student: 0.18, junior_office: 0.34, creative: 0.18, freelance: 0.14, tech: 0.16 },
    incomeQuintiles: ["Q1","Q2","Q3","Q4","Q5"], // equal split → 20% each, perturbed by RNG
  },
  JP: {
    name: "Japan",
    sexRatioFemale: 0.512,
    ageBucketWeights: { "20-24": 0.33, "25-29": 0.34, "30-34": 0.33 },
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
    kCultureMean: 72, kCultureStd: 14,
    kFashionMean: 70, kFashionStd: 15,
    fashionMean:  72, fashionStd: 16,
    occupation: { student: 0.12, junior_office: 0.42, creative: 0.16, freelance: 0.12, tech: 0.18 },
    incomeQuintiles: ["Q1","Q2","Q3","Q4","Q5"],
  },
  CN: {
    name: "China (Shanghai/Hangzhou/Tianjin)",
    sexRatioFemale: 0.488,
    ageBucketWeights: { "20-24": 0.28, "25-29": 0.36, "30-34": 0.36 },
    regions: [
      { name: "Shanghai", weight: 0.50 },
      { name: "Hangzhou", weight: 0.24 },
      { name: "Tianjin",  weight: 0.26 },
    ],
    kCultureMean: 65, kCultureStd: 16,
    kFashionMean: 62, kFashionStd: 18,
    fashionMean:  75, fashionStd: 14,
    occupation: { student: 0.14, junior_office: 0.36, creative: 0.18, freelance: 0.14, tech: 0.18 },
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
  ageBucketWeights: { "20-24": 0.33, "25-29": 0.34, "30-34": 0.33 },
  regions: [{ name: "Capital", weight: 0.6 }, { name: "Other", weight: 0.4 }],
  kCultureMean: 55, kCultureStd: 18,
  kFashionMean: 55, kFashionStd: 18,
  fashionMean:  70, fashionStd: 16,
  occupation: { student: 0.18, junior_office: 0.34, creative: 0.18, freelance: 0.14, tech: 0.16 },
  incomeQuintiles: ["Q1","Q2","Q3","Q4","Q5"],
};

const OCCUPATION_LABELS_KO = {
  student:       "대학생/대학원생",
  junior_office: "주니어 오피스 워커",
  creative:      "크리에이티브 직군",
  freelance:     "프리랜서",
  tech:          "테크/IT 직군",
};

function ageFromBucket(rng, bucket) {
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
 * @returns {Array<Object>} attribute personas
 */
export function buildCohort({ country, size = 100, seed, regions: regionOverride } = {}) {
  const cc = String(country || "").toUpperCase();
  const demo = COUNTRY_DEMO[cc] || DEFAULT_DEMO;
  const rng = makeRng(seed || `cohort:${cc}:${size}`);

  const regionList = buildRegions(demo, regionOverride);
  const regionWeights = Object.fromEntries(regionList.map(r => [r.name, r.weight]));

  const out = [];
  for (let i = 0; i < size; i++) {
    const ageBucket = weightedPick(rng, demo.ageBucketWeights);
    const age = ageFromBucket(rng, ageBucket);
    const gender = rng() < demo.sexRatioFemale ? "female" : "male";
    const region = weightedPick(rng, regionWeights);
    const incomeQuintile = demo.incomeQuintiles[randInt(rng, 0, demo.incomeQuintiles.length - 1)];
    const occupationKey = weightedPick(rng, demo.occupation);

    // Beta-shaped interests (skewed high since campaign filter = fashion interested)
    // alpha > beta → mass near 1; we then scale to 0..100
    // F-2 fix (CEO 2026-06-17 21:35): apply country fashionMean scaling so the
    // public-statistics seed actually differentiates countries instead of
    // collapsing to a constant ~71.4 for every country.
    const fashionInterest    = Math.round(clamp(0, 100,
        randBeta(rng, 5, 2) * 100 * (demo.fashionMean / 70)));
    const kCultureExposure   = Math.round(clamp(0, 100,
        randBeta(rng, 4, 2) * 100 * (demo.kCultureMean / 80)));
    const kFashionInterest   = Math.round(clamp(0, 100,
        randBeta(rng, 4, 2) * 100 * (demo.kFashionMean / 80)));
    const priceSensitivity   = randInt(rng, 1, 5); // refined in LLM stage too

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
      kCultureExposure,
      kFashionInterest,
      fashionInterest,
      priceSensitivityPrior: priceSensitivity,
    });
  }
  return out;
}

function clamp(min, max, v) { return Math.min(max, Math.max(min, v)); }

export const SUPPORTED_COUNTRIES = Object.keys(COUNTRY_DEMO);
export { COUNTRY_DEMO };
