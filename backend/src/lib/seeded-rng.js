// seeded-rng.js
// Deterministic seeded PRNG (mulberry32) + sampling helpers.
// Same seed → same sequence → same cohort → reproducible briefs.

export function hashStringToInt(str) {
  let h = 2166136261 >>> 0; // FNV-1a
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

// mulberry32
export function makeRng(seed) {
  let a = (typeof seed === "string" ? hashStringToInt(seed) : (seed >>> 0)) || 1;
  return function rng() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Choose 1 item from { value: weight } map (weights ≥ 0)
export function weightedPick(rng, weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((s, [, w]) => s + Math.max(0, w), 0);
  if (total <= 0) return entries[0]?.[0];
  let r = rng() * total;
  for (const [k, w] of entries) {
    r -= Math.max(0, w);
    if (r <= 0) return k;
  }
  return entries[entries.length - 1][0];
}

// Uniform integer in [min, max] inclusive
export function randInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

// Approx normal via Box–Muller; clamped
export function randNormal(rng, mean = 0, std = 1, clampMin = -Infinity, clampMax = Infinity) {
  const u1 = Math.max(1e-9, rng());
  const u2 = rng();
  const n = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const v = mean + std * n;
  return Math.min(clampMax, Math.max(clampMin, v));
}

// Beta(α, β) — Cheng's algorithm fallback to Johnk's for small α/β.
// For our use we only need shape-biased distributions, so use a stable approximation
// via two Gamma(α) ~ sum of -log(U_i) is impractical; use ratio-of-uniforms light version:
export function randBeta(rng, alpha = 2, beta = 5) {
  // simple acceptance-rejection using two uniforms (Johnk's method); works for alpha,beta > 0
  for (let i = 0; i < 100; i++) {
    const u = Math.pow(rng(), 1 / alpha);
    const v = Math.pow(rng(), 1 / beta);
    if (u + v <= 1) return u + v === 0 ? 0 : u / (u + v);
  }
  // fallback
  return rng();
}
