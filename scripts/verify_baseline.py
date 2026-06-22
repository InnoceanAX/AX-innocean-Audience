#!/usr/bin/env python3
"""Phase 1-1: 베이스라인 데이터 검증 + 갭 분석
World Bank API로 30개국 실제 데이터와 audience-public.js 비교
+ 카탈로그 77개국 중 미지원 47개국 식별
"""
import json, urllib.request, time, sys

# 30개국 (audience-public.js에 있는 국가)
BASELINE_COUNTRIES = [
    "KR","JP","CN","TW","US","CA","MX","BR","AR","GB",
    "DE","FR","IT","ES","NL","SE","PL","IN","ID","VN",
    "TH","MY","PH","AU","SG","AE","SA","TR","RU","ZA"
]

# 전체 카탈로그 77개국
ALL_CATALOG = [
    "KR","JP","TW","IN","ID","VN","TH","MY","PH","AU","NZ","SG","HK","BD","PK","LK","MM","KH","MN","KZ",
    "US","CA","MX","BR","AR","CL","CO","PE","VE","EC","UY",
    "GB","DE","FR","IT","ES","NL","BE","CH","AT","SE","NO","DK","FI","PT","PL","CZ","HU","RO","UA","IE","GR","BG","HR","SK","SI","LT","LV","EE",
    "AE","SA","IL","TR","EG","NG","ZA","QA","KW","BH","OM","JO","MA","KE","ET","GH","CN","RU"
]

MISSING = sorted(set(ALL_CATALOG) - set(BASELINE_COUNTRIES))

# World Bank indicators
INDICATORS = {
    "SP.URB.TOTL.IN.ZS": "urbanRate",
    "NY.GDP.PCAP.CD": "gdpPerCapita",
    "SP.POP.TOTL": "population",
    "IT.NET.USER.ZS": "internetUsers",
}

def fetch_wb(country, indicator, years="2022:2025"):
    url = f"https://api.worldbank.org/v2/country/{country}/indicator/{indicator}?format=json&per_page=5&date={years}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            if len(data) > 1 and data[1]:
                for d in data[1]:
                    if d.get("value") is not None:
                        return {"value": d["value"], "year": d["date"]}
    except Exception as e:
        return {"error": str(e)}
    return {"value": None, "year": None}

results = {}

# Verify baseline 30 countries
print("=" * 60)
print("Phase 1-1: Baseline 30개국 World Bank 데이터 검증")
print("=" * 60)

for i, cc in enumerate(BASELINE_COUNTRIES):
    print(f"\n[{i+1}/30] {cc}")
    results[cc] = {}
    for ind_code, ind_name in INDICATORS.items():
        r = fetch_wb(cc, ind_code)
        results[cc][ind_name] = r
        if r.get("value") is not None:
            if ind_name == "population":
                print(f"  {ind_name}: {r['value']:,.0f} ({r['year']})")
            elif ind_name == "gdpPerCapita":
                print(f"  {ind_name}: ${r['value']:,.0f} ({r['year']})")
            else:
                print(f"  {ind_name}: {r['value']:.1f}% ({r['year']})")
        else:
            print(f"  {ind_name}: ❌ NO DATA")
        time.sleep(0.3)  # rate limit

# Missing countries
print("\n" + "=" * 60)
print(f"미지원 국가 ({len(MISSING)}개): {', '.join(MISSING)}")
print("=" * 60)

# Fetch key data for missing countries too
print("\nPhase 1-2: 미지원 47개국 기본 데이터 수집")
missing_results = {}
for i, cc in enumerate(MISSING):
    print(f"\n[{i+1}/{len(MISSING)}] {cc}")
    missing_results[cc] = {}
    for ind_code, ind_name in INDICATORS.items():
        r = fetch_wb(cc, ind_code)
        missing_results[cc][ind_name] = r
        if r.get("value") is not None:
            if ind_name == "population":
                print(f"  {ind_name}: {r['value']:,.0f} ({r['year']})")
            elif ind_name == "gdpPerCapita":
                print(f"  {ind_name}: ${r['value']:,.0f} ({r['year']})")
            else:
                print(f"  {ind_name}: {r['value']:.1f}% ({r['year']})")
        else:
            print(f"  {ind_name}: ❌ NO DATA")
        time.sleep(0.3)

# Save results
output = {
    "baseline_30": results,
    "missing_47": missing_results,
    "missing_codes": MISSING,
}
with open("/workspace/data/AX-innocean-Audience-full/scripts/baseline_verification.json", "w") as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print("\n✅ 결과 저장: scripts/baseline_verification.json")
