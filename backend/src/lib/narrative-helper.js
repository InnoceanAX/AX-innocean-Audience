// narrative-helper.js
// 6차원 요약 카드용 페르소나 풀 추출 helper
// CEO 2026-06-18 본질 일관성 + 보편성 100% 보장
// 광고주 hard-code 0건, brief 기반 동적 슬롯

// ============================================================
// Mean / Freq / TopN
// ============================================================
export function meanOf(personas, key) {
  const vals = personas.map(p => Number(p[key])).filter(v => !isNaN(v));
  if (!vals.length) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

export function freqOf(personas, key, top = 5) {
  const vals = personas.map(p => p[key]).filter(Boolean);
  if (!vals.length) return [];
  const freq = {};
  vals.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([label, cnt]) => ({
      label,
      count: cnt,
      pct: Math.round((cnt / vals.length) * 100),
    }));
}

// brand_affinity 등 [{brand, score}] list 평균
export function listMean(personas, key, subKey, top = 3) {
  const allItems = personas.flatMap(p => (p[key] || []));
  if (!allItems.length) return [];
  const acc = {};
  allItems.forEach(it => {
    const k = it[subKey === 'brand' ? 'brand' : 'channel'];
    const v = Number(it[subKey === 'brand' ? 'score' : 'hoursPerDay']);
    if (!k || isNaN(v)) return;
    if (!acc[k]) acc[k] = { sum: 0, cnt: 0 };
    acc[k].sum += v;
    acc[k].cnt += 1;
  });
  return Object.entries(acc)
    .map(([k, { sum, cnt }]) => ({ [subKey === 'brand' ? 'brand' : 'channel']: k, value: Math.round((sum / cnt) * 10) / 10, count: cnt }))
    .sort((a, b) => b.value - a.value)
    .slice(0, top);
}

// ============================================================
// 다양성 진단 (Gemini fallback 노출용)
// ============================================================
export function diagnoseFieldDiversity(personas, field) {
  const values = personas.map(p => {
    const v = p[field];
    if (Array.isArray(v)) return JSON.stringify(v);
    return v;
  }).filter(x => x);
  const unique = new Set(values).size;
  return {
    diverse: unique > personas.length * 0.3,
    unique,
    total: values.length,
  };
}

// ============================================================
// Voice 추출 (차원별)
// ============================================================
export function extractDimVoice(personas, dim, briefMeta = {}) {
  const n = personas.length;
  if (!n) return { _empty: true };

  switch (dim) {
    case 'who': {
      const diag = diagnoseFieldDiversity(personas, 'quote');
      if (diag.diverse) {
        // 다양성 OK → random sample
        const idx = Math.floor(Math.random() * n);
        const p = personas[idx];
        return {
          type: 'quote',
          quote: p.quote,
          meta: `${p.persona_id} · ${p.age}세 · ${p.gender === 'female' ? '여' : '남'} · ${p.occupationLabel || p.occupation}`,
        };
      }
      // 다양성 부족 → fallback 캡션
      return {
        type: 'placeholder',
        message: 'AI 합성 페르소나 narrative (Phase 1.5 다양성 풍부화 예정)',
        _fallback: true,
      };
    }

    case 'life': {
      const tags = personas.flatMap(p => p.lifestyle_tags || []);
      if (!tags.length) return { _empty: true };
      const freq = {};
      tags.forEach(t => { freq[t] = (freq[t] || 0) + 1; });
      const top3 = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([t, cnt]) => ({ tag: t, pct: Math.round((cnt / n) * 100) }));
      const diag = diagnoseFieldDiversity(personas, 'lifestyle_tags');
      return {
        type: 'tags',
        tags: top3,
        _fallback: !diag.diverse,
        _caption: diag.diverse ? null : 'AI narrative fallback (Phase 1.5 풍부화 예정)',
      };
    }

    case 'mind': {
      const tags = personas.flatMap(p => p.values_tags || []);
      if (!tags.length) return { _empty: true };
      const freq = {};
      tags.forEach(t => { freq[t] = (freq[t] || 0) + 1; });
      const top3 = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([t, cnt]) => ({ tag: t, pct: Math.round((cnt / n) * 100) }));
      const diag = diagnoseFieldDiversity(personas, 'values_tags');
      return {
        type: 'tags',
        tags: top3,
        _fallback: !diag.diverse,
        _caption: diag.diverse ? null : 'AI narrative fallback (Phase 1.5 풍부화 예정)',
      };
    }

    case 'love': {
      const brands = listMean(personas, 'brand_affinity', 'brand', 3);
      // CEO 12:01 universal: 브랜드명 마스킹 (광고주 hard-code 0건 보장)
      const maskedBrands = brands.map((b, i) => ({
        brand: `브랜드 ${i + 1}`,
        value: b.value,
        count: b.count,
      }));
      return {
        type: 'brands',
        brands: maskedBrands,
      };
    }

    case 'buy': {
      const styles = freqOf(personas, 'shopping_style', 3);
      return {
        type: 'styles',
        styles: styles.map(s => ({ style: s.label, pct: s.pct })),
      };
    }

    case 'media': {
      const channels = listMean(personas, 'media_diet', 'channel', 3);
      return {
        type: 'channels',
        channels,
      };
    }

    default:
      return { _empty: true };
  }
}

// ============================================================
// Stats 추출 (차원별, 옵션 Z = persona + baseline 자동 분기)
// ============================================================
export function extractDimStats(personas, baseline, country, dim, briefMeta = {}) {
  const n = personas.length;
  if (!n) return [];
  const stats = [];

  switch (dim) {
    case 'who': {
      stats.push({ label: '평균 연령', value: `${meanOf(personas, 'age')}세`, source: 'persona', emphasis: 'top' });
      const genderFreq = freqOf(personas, 'gender', 2);
      if (genderFreq.length) {
        const fStr = genderFreq.map(g => `${g.label === 'female' ? '여' : '남'} ${g.pct}%`).join(' · ');
        stats.push({ label: '성별 분포', value: fStr, source: 'persona' });
      }
      const occTop = freqOf(personas, 'occupationLabel', 1);
      if (occTop.length) {
        stats.push({ label: '상위 직업', value: `${occTop[0].label} ${occTop[0].pct}%`, source: 'persona' });
      }
      const incTop = freqOf(personas, 'incomeQuintile', 1);
      if (incTop.length) {
        stats.push({ label: '주요 소득 분위', value: `${incTop[0].label} ${incTop[0].pct}%`, source: 'persona' });
      }
      break;
    }

    case 'life': {
      // 옵션 X cohort 확장 시 우선
      const ld = meanOf(personas, 'lifeDigitalPenetration');
      if (ld != null) {
        stats.push({ label: '디지털 침투율', value: `${ld}%`, source: 'persona', emphasis: 'top' });
        const ls = meanOf(personas, 'lifeSocialTime');
        if (ls != null) stats.push({ label: 'SNS 사용 시간', value: `${ls}h/일`, source: 'persona' });
        const lm = meanOf(personas, 'lifeMobileShare');
        if (lm != null) stats.push({ label: '모바일 비중', value: `${lm}%`, source: 'persona' });
        const lt = meanOf(personas, 'lifeTravelFreq');
        if (lt != null) stats.push({ label: '여행 빈도', value: `${lt}/100`, source: 'persona' });
      }
      // 옵션 Z fallback: cohort 없으면 voice block (lifestyle_tags)이 차원 표시
      break;
    }

    case 'mind': {
      const psm = meanOf(personas, 'priceSensitivityPrior') || meanOf(personas, 'price_sensitivity');
      if (psm != null) stats.push({ label: '가격 민감도', value: `${psm}/5`, source: 'persona', emphasis: 'top' });
      const incTop = freqOf(personas, 'incomeQuintile', 1);
      if (incTop.length) {
        stats.push({ label: '주요 소득 분위', value: `${incTop[0].label} ${incTop[0].pct}%`, source: 'persona' });
      }
      break;
    }

    case 'love': {
      const priorityKeys = briefMeta.priorityInterestKeys || ['fashionInterest', 'kCultureExposure', 'kFashionInterest'];
      const labelMap = briefMeta.interestLabelMap || {
        fashionInterest: '패션 관심도',
        kCultureExposure: 'K-컬처 노출도',
        kFashionInterest: 'K-패션 관심도',
        automotiveInterest: '자동차 관심도',
        beautyInterest: '뷰티 관심도',
        financeInterest: '금융 관심도',
        foodInterest: '음식 관심도',
        techInterest: '기술 관심도',
      };
      priorityKeys.slice(0, 3).forEach((k, idx) => {
        const m = meanOf(personas, k);
        if (m == null) return;
        const label = labelMap[k] || `주요 관심도 ${idx + 1}`;
        stats.push({ label, value: `${m}/100`, source: 'persona', emphasis: idx === 0 ? 'top' : null });
      });
      // brand_affinity Top1 — CEO 12:01 universal: 브랜드명 마스킹
      const brands = listMean(personas, 'brand_affinity', 'brand', 1);
      if (brands.length) {
        stats.push({ label: `최우선 브랜드`, value: `Top 브랜드 ${brands[0].value}점`, source: 'persona' });
      }
      break;
    }

    case 'buy': {
      const styleTop = freqOf(personas, 'shopping_style', 1);
      if (styleTop.length) {
        stats.push({ label: '선호 쇼핑 스타일', value: `${styleTop[0].label} ${styleTop[0].pct}%`, source: 'persona', emphasis: 'top' });
      }
      const psm = meanOf(personas, 'priceSensitivityPrior') || meanOf(personas, 'price_sensitivity');
      if (psm != null) stats.push({ label: '가격 민감도', value: `${psm}/5`, source: 'persona' });
      break;
    }

    case 'media': {
      const channels = listMean(personas, 'media_diet', 'channel', 3);
      if (channels.length) {
        stats.push({ label: '주요 매체', value: `${channels[0].channel} ${channels[0].value}h/일`, source: 'persona', emphasis: 'top' });
        if (channels.length > 1) {
          stats.push({ label: '2위 매체', value: `${channels[1].channel} ${channels[1].value}h/일`, source: 'persona' });
        }
        const totalHours = channels.reduce((s, c) => s + c.value, 0);
        stats.push({ label: '총 매체 사용', value: `${totalHours.toFixed(1)}h/일`, source: 'persona' });
      }
      break;
    }
  }

  return stats;
}

// ============================================================
// Baseline 캡션 추출 (블록 B, CEO 12:07 본질)
// ============================================================
export function extractBaselineCap(baseline, country, dim) {
  const parts = [];
  const demo = baseline?.demographics || {};
  const ls = baseline?.lifestyle || {};
  const mind = baseline?.mindset || {};
  const pur = baseline?.purchase || {};

  switch (dim) {
    case 'who': {
      if (demo.medianAge != null) parts.push(`중위 연령 ${demo.medianAge}세`);
      if (demo.urbanRate != null) parts.push(`도시화율 ${demo.urbanRate}%`);
      if (demo.dependencyRatio != null) parts.push(`부양비 ${demo.dependencyRatio}%`);
      break;
    }
    case 'life': {
      if (ls.internetPenetration != null) parts.push(`인터넷 침투율 ${ls.internetPenetration}%`);
      if (ls.avgInternetTime != null) parts.push(`인터넷 사용 ${ls.avgInternetTime}h/일`);
      if (ls.diningOut != null) parts.push(`외식 주 ${ls.diningOut}회`);
      if (ls.travelDomestic != null) parts.push(`국내 여행 ${ls.travelDomestic}%`);
      break;
    }
    case 'mind': {
      const hof = mind.hofstede || mind;
      if (hof.individualism != null) parts.push(`개인주의 ${hof.individualism}`);
      if (hof.uncertaintyAvoidance != null) parts.push(`불확실성 회피 ${hof.uncertaintyAvoidance}`);
      if (hof.powerDistance != null) parts.push(`권력 격차 ${hof.powerDistance}`);
      if (hof.longTermOrientation != null) parts.push(`장기 지향 ${hof.longTermOrientation}`);
      break;
    }
    case 'love': {
      const int = baseline?.interests;
      if (int) {
        const topInterests = Object.entries(int)
          .filter(([k, v]) => typeof v === 'number')
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([k, v]) => `${k} ${v}`);
        if (topInterests.length) parts.push(`국가 상위 관심: ${topInterests.join(' · ')}`);
      }
      break;
    }
    case 'buy': {
      if (pur.ecommerceShareOfRetail != null) parts.push(`이커머스 비중 ${pur.ecommerceShareOfRetail}%`);
      if (pur.mobileCommerceShare != null) parts.push(`모바일 커머스 ${pur.mobileCommerceShare}%`);
      if (pur.avgOnlineSpendUSD != null) parts.push(`연 온라인 소비 $${pur.avgOnlineSpendUSD}`);
      const ec = pur.ecommerce;
      if (ec?.shareOfRetail != null) parts.push(`이커머스 비중 ${ec.shareOfRetail}%`);
      if (ec?.mobileShare != null) parts.push(`모바일 커머스 ${ec.mobileShare}%`);
      break;
    }
    case 'media': {
      if (ls.mobileInternetShare != null) parts.push(`모바일 비중 ${ls.mobileInternetShare}%`);
      if (ls.socialMediaUsers != null) parts.push(`SNS 사용자 ${ls.socialMediaUsers}%`);
      if (ls.avgSocialTime != null) parts.push(`SNS 사용 ${ls.avgSocialTime}h/일`);
      if (ls.avgTVTime != null) parts.push(`TV 시청 ${ls.avgTVTime}h/일`);
      break;
    }
  }

  return parts.join(' · ');
}

// ============================================================
// 출처 매핑 (보편)
// ============================================================
const COUNTRY_OFFICIAL = {
  KR: '통계청 인구주택총조사',
  JP: '総務省 国勢調査',
  CN: '國家統計局',
  TW: '行政院主計總處',
  TH: 'National Statistical Office',
  PH: 'Philippine Statistics Authority',
};

export function extractDimSources(country, dim) {
  const official = COUNTRY_OFFICIAL[country] || '국가 공식 통계';
  const map = {
    who: ['AI 합성 페르소나 풀', official],
    life: ['AI 합성 페르소나 풀', 'DataReportal Digital 2026', 'Statista Lifestyle 2024'],
    mind: ['AI 합성 페르소나 풀', 'Hofstede Insights 2024'],
    love: ['AI 합성 페르소나 풀', 'We Are Social Digital 2026'],
    buy: ['AI 합성 페르소나 풀', `${country} Retail Sales 2024`, 'Statista E-commerce'],
    media: ['AI 합성 페르소나 풀', 'Reuters Digital News 2025', 'DataReportal'],
  };
  return map[dim] || ['AI 합성 페르소나 풀'];
}

// ============================================================
// 전체 차원 빌드 (라우터에서 호출)
// ============================================================
export function buildSummaryOverview({ country, personas, baseline, briefMeta = {} }) {
  const n = personas.length;
  const dims = ['who', 'life', 'mind', 'love', 'buy', 'media'];
  const result = { ok: true, country, n };

  dims.forEach(dim => {
    result[dim] = {
      stats: extractDimStats(personas, baseline, country, dim, briefMeta),
      baselineCap: extractBaselineCap(baseline, country, dim),
      sources: extractDimSources(country, dim),
      voice: extractDimVoice(personas, dim, briefMeta),
    };
  });

  result.meta = {
    generatedAt: new Date().toISOString(),
    schemaVersion: 'v4',
    method: '페르소나 평균 (mean) + 베이스라인 캡션 (학습 입력)',
  };

  return result;
}
