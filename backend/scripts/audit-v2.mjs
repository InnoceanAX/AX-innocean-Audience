// 매체 분류 정밀 점검 v2
// 광고 매체 기준: 광고면이 "TV 방송 송출"이면 ATL, "라디오 송출"이면 ATL, "종이 신문/잡지"이면 ATL,
// "OOH/시네마 스크린"이면 BTL, "디지털 화면/앱/웹/스트리밍/SNS/검색/디지털 광고면"이면 Digital.
//
// → KBS/MBC/SBS/NHK/CCTV 등 방송국 별칭 = ATL (TV)
// → KBS 라디오/J-WAVE/NHK FM = ATL (라디오)
// → 조선일보/朝日新聞/人民日报 = ATL (신문)
// → VOGUE Korea/週刊文春 = ATL (잡지)
// → 사람인/잡코리아/메루카리/당근마켓/메루카리/Indeed = Digital (디지털 앱)
// → 万达影城/CGV/Mtime = BTL (시네마)
// → 分众传媒/Focus Media = BTL (OOH)
//
// 별칭 화이트리스트를 명시적으로 정의 → 분류기 결과 비교

import fs from "fs";
import { getCategoryForChannelLabel } from "../src/data/media-taxonomy.js";

const src = fs.readFileSync("/workspace/innocean/AX-innocean-Audience/backend/src/data/media-taxonomy.js", "utf8");

function extractCountryArray(srcText, country) {
  const m = srcText.match(new RegExp(`${country}\\s*:\\s*\\[([\\s\\S]*?)\\]\\s*,`, "m"));
  if (!m) return [];
  const body = m[1];
  const cleaned = body.split("\n").map(line => line.replace(/\/\/.*$/, "")).join("\n");
  const labels = [];
  const lre = /"((?:[^"\\]|\\.)*)"/g;
  let lm;
  while ((lm = lre.exec(cleaned)) !== null) labels.push(lm[1].replace(/\\"/g, '"'));
  return labels;
}
const canonStart = src.indexOf("const CANONICAL_MEDIA_ALIASES = {");
const canonEnd = src.indexOf("};", canonStart);
const canonSrc = src.slice(canonStart, canonEnd + 2);
const canonByCountry = {
  KR: extractCountryArray(canonSrc, "KR"),
  JP: extractCountryArray(canonSrc, "JP"),
  CN: extractCountryArray(canonSrc, "CN"),
  GLOBAL: extractCountryArray(canonSrc, "GLOBAL"),
};

// CANONICAL_MEDIA_ALIASES 안 라벨은 코드 안 주석으로 매체 유형 그룹화돼 있다.
// 각 국가의 소스 영역을 다시 파싱해서 "라벨" → "주석 그룹"으로 분류
function extractGroupedLabels(srcText, country) {
  const re = new RegExp(`${country}\\s*:\\s*\\[([\\s\\S]*?)\\n\\s*\\]\\s*,`, "m");
  const m = srcText.match(re);
  if (!m) return [];
  const body = m[1];
  const lines = body.split("\n");
  let curGroup = "unknown";
  const out = [];
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    // 주석 그룹 헤더 감지 — "── X ──" 또는 "── X / Y ──"
    const groupHeader = line.match(/^\/\/\s*[─-]+\s*(.+?)\s*[─-]+\s*$/);
    if (groupHeader) {
      curGroup = groupHeader[1].trim();
      continue;
    }
    // 일반 주석 line
    if (line.startsWith("//")) continue;
    // 라벨 추출
    const lre = /"((?:[^"\\]|\\.)*)"/g;
    let lm;
    while ((lm = lre.exec(line)) !== null) {
      out.push({ label: lm[1].replace(/\\"/g, '"'), group: curGroup });
    }
  }
  return out;
}

const grouped = {
  KR: extractGroupedLabels(canonSrc, "KR"),
  JP: extractGroupedLabels(canonSrc, "JP"),
  CN: extractGroupedLabels(canonSrc, "CN"),
  GLOBAL: extractGroupedLabels(canonSrc, "GLOBAL"),
};

// group → expected category 규칙
function groupToExpected(group) {
  const g = group.toLowerCase();
  // TV linear / 지상파/케이블/위성 → ATL
  if (/linear tv|tv 지상파|지상파|케이블|cable|위성|satellite/.test(g)) return "ATL";
  if (/^tv$|tv\b.*지상파|tv\b.*衛星|tv\b/.test(g) && !/online|ott|ctv|tv 동영상/.test(g)) return "ATL";
  // OTT / CTV / Online Video / 라이브커머스(디지털 화면) → Digital
  if (/ott|ctv|online video|live commerce|라이브커머스|ライブ|直播|短视频/.test(g)) return "Digital";
  // Search → Digital
  if (/^search$|검색/.test(g)) return "Digital";
  // Social / Messenger / Influencer → Digital
  if (/social|messenger|메신저|인플루언서|influencer/.test(g)) return "Digital";
  // Music streaming → Digital
  if (/music streaming|음악 스트리밍/.test(g)) return "Digital";
  // Podcast / Audiobook → Digital
  if (/podcast|팟캐스트|audiobook/.test(g)) return "Digital";
  // 라디오 broadcast → ATL
  if (/^라디오$|^radio$|broadcast/.test(g)) return "ATL";
  // 신문 → ATL
  if (/^신문$/.test(g)) return "ATL";
  // 잡지 → ATL
  if (/^잡지$/.test(g)) return "ATL";
  // Display / Native / Programmatic → Digital (디지털 광고)
  if (/display|native|programmatic|디스플레이|네이티브|프로그래매틱/.test(g)) return "Digital";
  // OOH → BTL
  if (/ooh|옥외/.test(g)) return "BTL";
  // Cinema → BTL
  if (/cinema|시네마/.test(g)) return "BTL";
  // Classifieds / Jobs / Real Estate / Auto / Marketplace / Service classifieds → Digital (디지털 앱·웹)
  if (/classifieds|jobs|채용|real estate|부동산|auto|^자동차$|marketplace|중고|service classifieds/.test(g)) return "Digital";
  // B2B 미디어 (note PRO/Wantedly/디스콰이엇 등) → Digital
  if (/b2b/.test(g)) return "Digital";
  return null;
}

// 모든 라벨에 expected 부여 + 분류기 결과
const rows = [];
for (const [cc, items] of Object.entries(grouped)) {
  for (const it of items) {
    const cur = getCategoryForChannelLabel(it.label);
    const exp = groupToExpected(it.group);
    rows.push({ country: cc, label: it.label, group: it.group, current: cur, expected: exp });
  }
}

// 그룹별 미분류 통계
const byGroup = {};
for (const r of rows) {
  const k = `${r.country}|${r.group}`;
  if (!byGroup[k]) byGroup[k] = { country: r.country, group: r.group, expected: r.expected, total: 0, current: {} };
  byGroup[k].total++;
  byGroup[k].current[r.current ?? "null"] = (byGroup[k].current[r.current ?? "null"] || 0) + 1;
}

console.log("=== 그룹별 분류 결과 ===");
const groupKeys = Object.keys(byGroup).sort();
for (const k of groupKeys) {
  const b = byGroup[k];
  console.log(`[${b.country}] ${b.group} (expected=${b.expected}, total=${b.total}): ${JSON.stringify(b.current)}`);
}

const mismatches = rows.filter(r => r.expected && r.current !== r.expected);
const nulls = rows.filter(r => r.expected && r.current === null);
console.log(`\n=== 총계 ===`);
console.log(`전체 라벨: ${rows.length}`);
console.log(`expected 지정 가능: ${rows.filter(r => r.expected).length}`);
console.log(`오분류 (current !== expected): ${mismatches.length}`);
console.log(`그 중 null: ${nulls.length}`);

console.log("\n=== 오분류 상세 (null 제외, 현재 분류된 것 중 잘못된 것) ===");
const realWrong = mismatches.filter(r => r.current !== null);
console.log(`실제 잘못 분류된 케이스: ${realWrong.length}`);
const byPair = {};
for (const r of realWrong) {
  const k = `${r.country}|${r.group}|${r.current}→${r.expected}`;
  if (!byPair[k]) byPair[k] = { country: r.country, group: r.group, current: r.current, expected: r.expected, labels: [] };
  byPair[k].labels.push(r.label);
}
for (const k of Object.keys(byPair).sort()) {
  const b = byPair[k];
  console.log(`\n[${b.country}] ${b.group} — 현재 ${b.current} → 기대 ${b.expected} (${b.labels.length}건)`);
  for (const lab of b.labels) console.log(`  - "${lab}"`);
}

console.log("\n=== null 상세 (분류 자체 안됨) ===");
const byNullGroup = {};
for (const r of nulls) {
  const k = `${r.country}|${r.group}`;
  if (!byNullGroup[k]) byNullGroup[k] = { country: r.country, group: r.group, expected: r.expected, labels: [] };
  byNullGroup[k].labels.push(r.label);
}
for (const k of Object.keys(byNullGroup).sort()) {
  const b = byNullGroup[k];
  console.log(`\n[${b.country}] ${b.group} — null → 기대 ${b.expected} (${b.labels.length}건)`);
  for (const lab of b.labels) console.log(`  - "${lab}"`);
}

fs.writeFileSync("/workspace/_session-state/2026-06-25-audit-v2-raw.json", JSON.stringify({
  rows, byGroup, mismatches, nulls, realWrong, byPair, byNullGroup,
}, null, 2));
console.log("\nSaved JSON.");
