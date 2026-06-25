// CHANNELS의 모든 media.id에 대해 getMediaCategory(id, channelId) 결과 점검
import { CHANNELS } from "../src/data/media-taxonomy.js";
import { getMediaCategory, MEDIA_CATEGORY, CHANNEL_CATEGORY_FALLBACK } from "../src/adapters/adspend-public.js";

function expectedFor(channelId, subId) {
  if (channelId === "tv_video") {
    if (subId === "tvv_linear") return "ATL";
    return "Digital";
  }
  if (channelId === "search") return "Digital";
  if (channelId === "social") return "Digital";
  if (channelId === "ooh") return "BTL";
  if (channelId === "banner") return "Digital";
  if (channelId === "print") return "ATL";
  if (channelId === "audio") {
    if (subId === "audio_broadcast") return "ATL";
    return "Digital";
  }
  if (channelId === "classifieds") return "Digital";
  if (channelId === "influencer") return "Digital";
  return null;
}

const rows = [];
for (const ch of CHANNELS) {
  for (const sub of ch.subchannels || []) {
    for (const m of sub.media || []) {
      const cur = getMediaCategory(m.id, ch.id);
      const direct = MEDIA_CATEGORY[m.id];
      const exp = expectedFor(ch.id, sub.id);
      rows.push({
        id: m.id,
        label: m.label,
        channelId: ch.id,
        subId: sub.id,
        directMapping: direct ?? null,
        channelFallback: CHANNEL_CATEGORY_FALLBACK[ch.id] ?? null,
        current: cur,
        expected: exp,
      });
    }
  }
}
const wrong = rows.filter(r => r.expected && r.current !== r.expected);
console.log(`총 ${rows.length} 개 매체. 오분류 ${wrong.length}개\n`);
console.log("=== 오분류 (id 기반) ===");
for (const r of wrong) {
  console.log(`[${r.channelId}/${r.subId}] id=${r.id} "${r.label}" — direct=${r.directMapping}, channelFallback=${r.channelFallback}, current=${r.current}, expected=${r.expected}`);
}
console.log("\n=== id가 MEDIA_CATEGORY에 없어 fallback에 떨어진 케이스 ===");
const fallback = rows.filter(r => r.directMapping === null);
for (const r of fallback) {
  console.log(`id=${r.id} ch=${r.channelId} → fallback=${r.channelFallback} (expected=${r.expected})`);
}
