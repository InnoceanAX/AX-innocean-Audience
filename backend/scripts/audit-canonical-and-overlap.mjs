// CANONICAL_MEDIA_ALIASES + MEDIA_LABEL_CATEGORY 중복 add 충돌 점검
// 직접 파일 읽고 분석
import fs from "fs";
import { getCategoryForChannelLabel } from "../src/data/media-taxonomy.js";

const src = fs.readFileSync("/workspace/innocean/AX-innocean-Audience/backend/src/data/media-taxonomy.js", "utf8");

// 1) MEDIA_LABEL_CATEGORY 내부 add(cat, [...]) 호출 추적 → 같은 라벨이 여러 cat에 등장하면 충돌
//    수동 파싱: add("Digital", [...]); add("ATL", [...]) 블록 추출
const addBlocks = [];
{
  // m[1]=cat, m[2]=array body
  const re = /add\(\s*"(Digital|ATL|BTL)"\s*,\s*\[([\s\S]*?)\]\s*\)/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const cat = m[1];
    const body = m[2];
    // body 안 "..." 문자열 모두 추출 (이스케이프 처리 단순화)
    const labels = [];
    const lre = /"((?:[^"\\]|\\.)*)"/g;
    let lm;
    while ((lm = lre.exec(body)) !== null) {
      const lab = lm[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
      labels.push(lab);
    }
    addBlocks.push({ cat, labels, position: m.index });
  }
}

// 같은 라벨이 여러 cat에 등록되어 마지막이 덮어쓰는 케이스 식별
function normalizeKey(s) {
  return String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
}
const labelToCats = new Map(); // normKey → [{cat, originalLabel, position}]
for (const blk of addBlocks) {
  for (const lab of blk.labels) {
    const k = normalizeKey(lab);
    if (!labelToCats.has(k)) labelToCats.set(k, []);
    labelToCats.get(k).push({ cat: blk.cat, originalLabel: lab, position: blk.position });
  }
}

const conflicts = [];
for (const [k, entries] of labelToCats.entries()) {
  const cats = new Set(entries.map(e => e.cat));
  if (cats.size > 1) {
    // 마지막 등록(파일 후반)이 이김. position 큰 게 최종.
    const sorted = [...entries].sort((a, b) => a.position - b.position);
    conflicts.push({
      key: k,
      originalLabel: sorted[0].originalLabel,
      registrations: sorted.map(e => ({ cat: e.cat, position: e.position })),
      finalCat: sorted[sorted.length - 1].cat,
    });
  }
}

console.log(`MEDIA_LABEL_CATEGORY add 블록 수: ${addBlocks.length}`);
console.log(`고유 라벨 수: ${labelToCats.size}`);
console.log(`중복 add 충돌: ${conflicts.length}`);
console.log("\n=== 충돌 리스트 ===");
for (const c of conflicts) {
  console.log(`"${c.originalLabel}" — 등록: ${c.registrations.map(r => r.cat).join(" → ")} → 최종: ${c.finalCat}`);
}

// 2) CANONICAL_MEDIA_ALIASES 추출
//    소스코드의 `const CANONICAL_MEDIA_ALIASES = { KR: [...], JP: [...], CN: [...], GLOBAL: [...] };`
//    국가별로 별칭 라벨 → 현재 분류기에 통과 → category
const canonStart = src.indexOf("const CANONICAL_MEDIA_ALIASES = {");
const canonEnd = src.indexOf("};", canonStart);
const canonSrc = src.slice(canonStart, canonEnd + 2);

// 각 국가 블록 추출
function extractCountryArray(src, country) {
  const m = src.match(new RegExp(`${country}\\s*:\\s*\\[([\\s\\S]*?)\\]\\s*,`, "m"));
  if (!m) return [];
  const body = m[1];
  // 주석(//) 제거
  const cleaned = body.split("\n").map(line => line.replace(/\/\/.*$/, "")).join("\n");
  const labels = [];
  const lre = /"((?:[^"\\]|\\.)*)"/g;
  let lm;
  while ((lm = lre.exec(cleaned)) !== null) {
    labels.push(lm[1].replace(/\\"/g, '"'));
  }
  return labels;
}

const canonByCountry = {
  KR: extractCountryArray(canonSrc, "KR"),
  JP: extractCountryArray(canonSrc, "JP"),
  CN: extractCountryArray(canonSrc, "CN"),
  GLOBAL: extractCountryArray(canonSrc, "GLOBAL"),
};

console.log("\n=== CANONICAL_MEDIA_ALIASES 카운트 ===");
for (const [cc, arr] of Object.entries(canonByCountry)) {
  console.log(`${cc}: ${arr.length}개`);
}

// 각 라벨 → 분류기 결과. null/오분류 식별
// 광고 매체 관점 expected는 라벨로 100% 자동판정 어려움 → 룰: 알려진 카테고리(아래 함수)
function guessExpected(label) {
  const t = label.toLowerCase();
  // OOH/시네마 = BTL
  if (/cinema|영화|wanda|cgv|hengdian|dadi|jinyi|mtime|cgv|焦点|focus media|zhaoxun|分众|兆讯/.test(t)) return "BTL";
  // 직업/부동산/중고/자동차 classifieds 디지털앱 = Digital
  if (/saramin|jobkorea|incruit|albamon|alba|jumpit|catch|wanted|worknet|zigbang|dabang|hogang|encar|carsensor|goo-net|car seven|carchs|gulliver|nextstage|rakuten car|메루카리|mercari|rakuma|paypay flea|jimoty|snkrdunk|monokabu|coconala|kurashi|street academy|taskaji|당근|carrot|daangn|bunjang|kream|soldout|소문고|숨고|kmong|taling|/.test(t)) return "Digital";
  if (/zhaopin|51job|boss zhipin|lagou|liepin|kanzhun|chinahr|shixiseng|yingjieshe|maimai jobs|beike|lianjia|anjuke|fang|5i5j|centaline|fangdd|dongchedi|autohome|bitauto|yiche|guazi|uxin|renrenche|pcauto|che300|xianyu|zhuanzhuan|jd paipai|58\.com|ganji|poizon|meituan|dazhong|douyin life/.test(t)) return "Digital";
  if (/rikunabi|mynavi|doda|en転職|en転|bizreach|baitoru|townwork|@type|careertrek|recruit|indeed|linkedin jobs|suumo|homes|lifull|at home|apamanshop|mansion|livable|tokyu/.test(t)) return "Digital";
  // 모든 SNS/메신저/스트리밍/검색/포털 = Digital
  if (/youtube|tiktok|instagram|facebook|twitter|threads|reddit|pinterest|snapchat|linkedin|discord|telegram|whatsapp|messenger|naver|kakao|line|wechat|qq|weibo|xiaohongshu|baidu|douyin|kuaishou|bilibili|zhihu|douban|maimai|tieba|jike|zuiyou|nate|navershopping|naver smart|smart channel|naver works|netflix|disney|prime video|apple tv|tving|wavve|watcha|coupang play|abema|niconico|u-next|tver|hulu|dazn|lemino|dtv|iqiyi|youku|tencent video|mango tv|migu|xigua|cctv\+|bing|google|spotify|apple music|amazon music|youtube music|melon|genie|flo|bugs|line music|awa|recochoku|netease|kugou|kuwo|qishui|qq音乐|spotify podcasts|apple podcasts|youtube podcasts|podbbang|audio clip|audible|voicy|stand\.fm|radiotalk|lisbo|ximalaya|qingting|lizhi|lazy audio|cosmos podcast|小宇宙|喜马拉雅|蜻蜓|荔枝|懒人/.test(t)) return "Digital";
  // TV/라디오/신문/잡지 = ATL
  if (/^(kbs|mbc|sbs|jtbc|tv조선|채널a|mbn|ytn|tvn|ocn|mnet|ena|cj enm|ebs|tokyo mx|nhk|fuji|asahi|tbs|nikkei|yomiuri|mainichi|sankei|sponichi|hochi|asahi shimbun|fnn|fuji|fuji tv|wowow|j-com|sky|chosun|joongang|dong-a|hankyoreh|kyunghyang|hankook|maeil|economic daily|fn news|edaily|money today|cctv|dragon tv|zhejiang tv|jiangsu tv|hunan tv|beijing tv|tianjin tv|sh news|hangzhou general|people's daily|xinhua|guangming|economic daily|jiefang|wen wei po|qianjiang|zhejiang daily|jinwan|tianjin daily|21st century|china business network)/.test(t)) return "ATL";
  if (/라디오|radio|fm /.test(t) || /cnr|smg radio|fm yokohama|interfm|nack5|tfm|j-wave|fm tokyo|joqr|文化放送|niponhōsō|nippon broadcasting|nihon|kbs 라디오|쿨fm|fm4u|파워fm|러브fm|cbs|ebs fm|pbc|bbs|tbs 교통|평화방송|불교방송|극동방송/.test(t)) return "ATL";
  if (/신문|일보|times|nikkei|asahi|sankei|sankei|press|shimbun|hochi|sponichi|daily sports|chunichi|nishinippon|hokkaido|sports/.test(t)) return "ATL";
  if (/vogue|elle|gq|harper|bazaar|esquire|cosmo|marie claire|magazine|周刊|月刊|sankei|文藝春秋|nikkei business|dancyu|クロワッサン|allure|w korea|cine21|시사in|매경economy|한경비즈니스|25ans|anan|non-no|bunshun|shincho|現代|ポスト|朝日/.test(t)) return "ATL";
  return null; // 추정 어려움
}

// canonical 전수 점검
const canonRows = [];
for (const [cc, arr] of Object.entries(canonByCountry)) {
  for (const lab of arr) {
    const cur = getCategoryForChannelLabel(lab);
    const exp = guessExpected(lab);
    canonRows.push({ country: cc, label: lab, current: cur, expected: exp });
  }
}
const canonMismatch = canonRows.filter(r => r.expected && r.current !== r.expected);
const canonNull = canonRows.filter(r => r.current === null);

console.log(`\n=== CANONICAL 분류기 통과 결과: 총 ${canonRows.length}건, 오분류 ${canonMismatch.length}건, null ${canonNull.length}건 ===`);
console.log("\n--- 오분류 ---");
for (const r of canonMismatch) {
  console.log(`[${r.country}] "${r.label}" → current=${r.current}, expected=${r.expected}`);
}
console.log("\n--- null (분류 안됨) ---");
for (const r of canonNull) {
  console.log(`[${r.country}] "${r.label}" → null`);
}

// Save JSON
fs.writeFileSync("/workspace/_session-state/2026-06-25-canonical-audit-raw.json", JSON.stringify({
  addBlocks: addBlocks.map(b => ({ cat: b.cat, labelCount: b.labels.length, position: b.position })),
  conflicts,
  canonByCountryCount: Object.fromEntries(Object.entries(canonByCountry).map(([k, v]) => [k, v.length])),
  canonRows,
  canonMismatch,
  canonNull,
}, null, 2));
console.log("\nSaved: /workspace/_session-state/2026-06-25-canonical-audit-raw.json");
