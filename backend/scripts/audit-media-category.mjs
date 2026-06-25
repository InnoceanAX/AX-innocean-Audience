// 매체 유형(ATL/BTL/Digital) 분류 전수 점검 스크립트
// 2026-06-25 CTO Sohee — read-only 분석. 코드 수정·배포 없음.

import {
  CHANNELS,
  GENERIC_MEDIA_ALIASES,
  MEDIA_LABEL_CATEGORY,
  getCategoryForChannelLabel,
} from "../src/data/media-taxonomy.js";

// 추가로 CANONICAL_MEDIA_ALIASES도 필요. media-taxonomy.js에서 export 안됨 → 직접 파일 파싱
// 대신, MEDIA_LABEL_CATEGORY 매핑된 라벨 + CHANNELS sub.media[].label + GENERIC_MEDIA_ALIASES + (외부) 별칭은 따로 수집해서 점검.

// 1) CHANNELS 라벨 수집
const channelLabels = [];
for (const ch of CHANNELS) {
  for (const sub of ch.subchannels || []) {
    for (const m of sub.media || []) {
      channelLabels.push({
        label: m.label,
        channelId: ch.id,
        channelLabel: ch.label,
        subId: sub.id,
        subLabel: sub.label,
      });
    }
  }
}

// 채널 자체가 디지털/ATL/BTL 어디 속하는지 확정짓는 기대값.
// statista 9 segment에서 매핑:
//  TV & Video → ATL (Linear) + Digital (CTV/Online Video) — subchannel 단위로 다름
//  Search/Social/Banner/Audio(streaming/podcast) → Digital
//  Audio(broadcast) → ATL
//  Print → ATL
//  OOH → BTL
//  Classifieds → BTL (전통 기준) — 그러나 광고면이 "디지털 앱" 이면 Digital
//  Influencer → Digital
//
// 광고 매체 성격 기준: 광고가 노출되는 면이 디지털 화면이면 Digital, TV/라디오/신문/잡지면 ATL,
// 오프라인/옥외/시네마/전단/매대면 BTL.
// → Classifieds 채널의 media(Indeed/사람인/당근마켓/메루카리 등)은 디지털 앱·웹 → Digital이 맞다.
// → OOH 채널의 media(빌보드/지하철/택시/공항/영화관) → BTL.
// → Print 채널의 media → ATL.
// → Audio broadcast(FM/AM/DAB) → ATL. streaming/podcast → Digital.
// → TV linear → ATL. CTV/online video → Digital.

function expectedCategoryForChannelMedia(item) {
  // 채널/서브채널 id로 판정
  if (item.channelId === "tv_video") {
    if (item.subId === "tvv_linear") return "ATL";
    return "Digital"; // CTV, Online Video
  }
  if (item.channelId === "search") return "Digital";
  if (item.channelId === "social") return "Digital";
  if (item.channelId === "ooh") return "BTL";
  if (item.channelId === "banner") return "Digital";
  if (item.channelId === "print") return "ATL";
  if (item.channelId === "audio") {
    if (item.subId === "audio_broadcast") return "ATL";
    return "Digital";
  }
  if (item.channelId === "classifieds") return "Digital"; // 디지털 앱·웹
  if (item.channelId === "influencer") return "Digital";
  return null;
}

// 라벨 → 현재 분류기 결과
const rows = [];
for (const item of channelLabels) {
  const cur = getCategoryForChannelLabel(item.label);
  const expected = expectedCategoryForChannelMedia(item);
  rows.push({
    label: item.label,
    current: cur,
    expected,
    channel: item.channelLabel,
    sub: item.subLabel,
    channelId: item.channelId,
    subId: item.subId,
  });
}

// 일반 GENERIC 별칭 점검
const genericRows = GENERIC_MEDIA_ALIASES.map((label) => {
  const cur = getCategoryForChannelLabel(label);
  // 기대값
  let exp = null;
  if (["TV"].includes(label)) exp = "ATL";
  else if (["라디오", "신문", "잡지"].includes(label)) exp = "ATL";
  else if (["옥외광고(OOH)"].includes(label)) exp = "BTL";
  else if (["팟캐스트", "포털/뉴스", "음악 스트리밍", "뉴스", "커뮤니티", "OTT"].includes(label)) exp = "Digital";
  return { label, current: cur, expected: exp, source: "GENERIC" };
});

// MEDIA_LABEL_CATEGORY에 등록되었지만 CHANNELS에 없는 라벨도 검사 (별칭/canonical 흡수 라벨)
// 이미 MEDIA_LABEL_CATEGORY에 등록된 모든 키 vs getCategoryForChannelLabel 결과 비교
// → 동일해야 함 (정확매칭 1순위), 다르면 정규화 버그

// 오분류 식별
const mismatches = rows.filter(r => r.expected && r.current !== r.expected);
const genericMismatches = genericRows.filter(r => r.expected && r.current !== r.expected);
const nullCategories = rows.filter(r => r.current === null);

// MEDIA_LABEL_CATEGORY 자체 — 같은 키가 여러 cat에 add 되었을 때 마지막 add가 덮어쓰는 충돌 점검
// 이를 위해 source 분류기를 재구현(아래) — 어렵기 때문에 grep으로 보완
// 여기서는 분류기 결과만 비교. 덮어쓰기 detection은 별도 텍스트 분석 단계로.

const summary = {
  totalChannelMedia: rows.length,
  mismatchCount: mismatches.length,
  nullCount: nullCategories.length,
  totalGeneric: genericRows.length,
  genericMismatchCount: genericMismatches.length,
};

console.log("=== SUMMARY ===");
console.log(JSON.stringify(summary, null, 2));

console.log("\n=== CHANNELS media mismatches ===");
for (const r of mismatches) {
  console.log(`[${r.channelId}/${r.subId}] "${r.label}" → current=${r.current}, expected=${r.expected}`);
}

console.log("\n=== CHANNELS media nulls ===");
for (const r of nullCategories) {
  console.log(`[${r.channelId}/${r.subId}] "${r.label}" → current=null, expected=${r.expected}`);
}

console.log("\n=== GENERIC mismatches ===");
for (const r of genericMismatches) {
  console.log(`"${r.label}" → current=${r.current}, expected=${r.expected}`);
}

// 결과를 JSON 파일로도 저장
import fs from "fs";
const outPath = "/workspace/_session-state/2026-06-25-media-category-audit-raw.json";
fs.writeFileSync(outPath, JSON.stringify({
  summary,
  channelMediaRows: rows,
  genericRows,
  mismatches,
  genericMismatches,
  nullCategories,
}, null, 2));
console.log(`\nRaw JSON saved: ${outPath}`);
