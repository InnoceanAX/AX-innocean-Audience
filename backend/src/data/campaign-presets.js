// campaign-presets.js
// Seed campaign briefs for the AI synthetic persona generator.

export const CAMPAIGN_PRESETS = [
  {
    id: "musinsa-kfashion-2034-global",
    name: "Musinsa fashion 2034MF",
    brand: "Musinsa",
    countries: ["KR", "JP", "CN"],
    regions: { CN: ["Shanghai", "Hangzhou", "Tianjin"] },
    targets: {
      ageBuckets: ["20-24", "25-29", "30-34"],
      gender: "all",
      interests: ["fashion", "kfashion"],
    },
    sizePerCountry: 100,
  },
];
