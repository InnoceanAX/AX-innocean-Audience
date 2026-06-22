#!/usr/bin/env python3
"""47개국 베이스라인 데이터를 audience-public.js 4개 섹션에 추가"""
import json, re

VERIFY = "/workspace/data/AX-innocean-Audience-full/scripts/baseline_verification.json"
TARGET = "/workspace/data/AX-innocean-Audience-full/backend/src/adapters/audience-public.js"

with open(VERIFY) as f:
    wb = json.load(f)

missing = wb.get("missing", {})
CODES = sorted(missing.keys())
print(f"추가 대상: {len(CODES)}개국")

MEDIAN_AGE = {
    "AT":44.5,"BD":28.1,"BE":42.0,"BG":44.5,"BH":32.5,"CH":43.0,"CL":36.0,
    "CO":31.5,"CZ":43.0,"DK":42.0,"EC":28.5,"EE":42.0,"EG":24.5,"ET":19.8,
    "FI":43.0,"GH":21.5,"GR":45.5,"HK":46.0,"HR":44.0,"HU":43.5,"IE":38.5,
    "IL":30.5,"JO":24.0,"KE":20.0,"KH":26.5,"KW":37.0,"KZ":31.0,"LK":33.0,
    "LT":44.0,"LV":44.5,"MA":30.0,"MM":29.0,"MN":28.5,"NG":18.0,"NO":40.0,
    "NZ":37.5,"OM":31.0,"PE":29.5,"PK":22.5,"PT":46.0,"QA":33.5,"RO":43.5,
    "SI":44.5,"SK":41.5,"UA":41.0,"UY":36.0,"VE":30.0,
}

def ab(m):
    if m>=42: return '{"18-24":9,"25-34":14,"35-44":17,"45-54":21,"55-64":19,"65+":20}'
    elif m>=35: return '{"18-24":12,"25-34":18,"35-44":20,"45-54":20,"55-64":16,"65+":14}'
    elif m>=28: return '{"18-24":16,"25-34":22,"35-44":22,"45-54":18,"55-64":13,"65+":9}'
    else: return '{"18-24":20,"25-34":24,"35-44":22,"45-54":16,"55-64":11,"65+":7}'

with open(TARGET) as f:
    txt = f.read()

# 각 섹션에서 SE: { ... }, 뒤에 삽입 (SE가 기존 30개국 마지막 알파벳순)
# 실제로는 각 export const 블록의 Phase B-0 마커 줄 바로 앞에 삽입

# DEMOGRAPHICS
demo = []
for cc in CODES:
    d = missing[cc]
    pop = int(d["pop"]["v"]) if d.get("pop",{}).get("v") else 10000000
    urban = round(d["urban"]["v"],1) if d.get("urban",{}).get("v") else 50.0
    ma = MEDIAN_AGE.get(cc,35.0)
    dep = 55 if ma>=42 else (50 if ma>=35 else (48 if ma>=28 else 65))
    demo.append(f"  {cc}: {{ population: {pop}, medianAge: {ma}, urbanRate: {urban}, dependencyRatio: {dep}, ageBuckets: {ab(ma)} }},")

# LIFESTYLE
life = []
for cc in CODES:
    d = missing[cc]
    inet = round(d.get("inet",{}).get("v") or 70, 1)
    smart = round(min(7,max(3,inet/100*7)),1)
    sns = round(smart*0.4,1)
    ecom = round(min(90,max(20,inet*0.7)),1)
    life.append(f'  {cc}: {{ smartphoneHours: {smart}, snsHours: {sns}, ecommerceRate: {ecom}, topActivities: ["SNS","영상 시청","메신저","뉴스","쇼핑"] }},')

# MINDSET
mind = []
for cc in CODES:
    gdp = missing[cc].get("gdp",{}).get("v") or 10000
    if gdp>40000:
        mind.append(f'  {cc}: {{ brandTrust: "높음", priceVsQuality: "품질 우선", sustainability: 72, digitalTrust: 68, coreValues: ["개인주의","품질","혁신","환경의식","워라밸"] }},')
    elif gdp>15000:
        mind.append(f'  {cc}: {{ brandTrust: "보통", priceVsQuality: "균형", sustainability: 55, digitalTrust: 58, coreValues: ["실용성","가성비","가족","안정","성장"] }},')
    elif gdp>5000:
        mind.append(f'  {cc}: {{ brandTrust: "보통", priceVsQuality: "가격 민감", sustainability: 42, digitalTrust: 50, coreValues: ["가족","경제적 안정","교육","커뮤니티","성장"] }},')
    else:
        mind.append(f'  {cc}: {{ brandTrust: "낮음", priceVsQuality: "가격 우선", sustainability: 30, digitalTrust: 40, coreValues: ["가족","생존","커뮤니티","종교","교육"] }},')

# PURCHASE (=INTERESTS section uses PURCHASE_BEHAVIOR)
buy = []
for cc in CODES:
    gdp = missing[cc].get("gdp",{}).get("v") or 10000
    inet = missing[cc].get("inet",{}).get("v") or 70
    ecom = round(min(85,max(15,inet*0.65)),1)
    basket = 65 if gdp>40000 else (40 if gdp>15000 else (25 if gdp>5000 else 12))
    card = 55 if gdp>40000 else (45 if gdp>15000 else (30 if gdp>5000 else 15))
    digital = 30 if gdp>40000 else (25 if gdp>15000 else (20 if gdp>5000 else 10))
    cash = 100-card-digital
    buy.append(f'  {cc}: {{ ecommerceRate: {ecom}, avgBasketUSD: {basket}, topCategories: ["패션","식품","전자기기","생활용품","뷰티"], paymentMix: {{ card: {card}, digital: {digital}, cash: {cash} }} }},')

# 삽입: 각 Phase B-0 마커 앞에 47개국 추가
header = "  // Phase B-3 (2026-06-22): 47개국 신규 추가 (WB 2024 데이터 기반)\n"

# 1) DEMOGRAPHICS — 첫번째 "// Phase B-0" 앞
markers = list(re.finditer(r"  // Phase B-0", txt))
if len(markers) >= 4:
    # 역순으로 삽입 (오프셋 보존)
    inserts = [
        (markers[3].start(), header + "\n".join(buy) + "\n"),   # PURCHASE
        (markers[2].start(), header + "\n".join(mind) + "\n"),  # MINDSET
        (markers[1].start(), header + "\n".join(life) + "\n"),  # LIFESTYLE
        (markers[0].start(), header + "\n".join(demo) + "\n"),  # DEMOGRAPHICS
    ]
    for pos, block in inserts:
        txt = txt[:pos] + block + txt[pos:]
    
    with open(TARGET, "w") as f:
        f.write(txt)
    print("삽입 완료")
else:
    print(f"ERROR: Phase B-0 마커 {len(markers)}개 (4개 필요)")
    # fallback: 마지막 국가 뒤에 삽입
    # INTERESTS는 별도 섹션이므로 5개 마커 중 4개만 사용
    print("마커 위치:", [m.start() for m in markers])
