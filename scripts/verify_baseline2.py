#!/usr/bin/env python3
"""Phase 1-1: 베이스라인 World Bank 검증 (flush output)"""
import json, urllib.request, time, sys

BASELINE = ["KR","JP","CN","TW","US","CA","MX","BR","AR","GB","DE","FR","IT","ES","NL","SE","PL","IN","ID","VN","TH","MY","PH","AU","SG","AE","SA","TR","RU","ZA"]
ALL_CAT = ["KR","JP","TW","IN","ID","VN","TH","MY","PH","AU","NZ","SG","HK","BD","PK","LK","MM","KH","MN","KZ","US","CA","MX","BR","AR","CL","CO","PE","VE","EC","UY","GB","DE","FR","IT","ES","NL","BE","CH","AT","SE","NO","DK","FI","PT","PL","CZ","HU","RO","UA","IE","GR","BG","HR","SK","SI","LT","LV","EE","AE","SA","IL","TR","EG","NG","ZA","QA","KW","BH","OM","JO","MA","KE","ET","GH","CN","RU"]
MISSING = sorted(set(ALL_CAT) - set(BASELINE))

INDS = {"SP.URB.TOTL.IN.ZS":"urban","NY.GDP.PCAP.CD":"gdp","SP.POP.TOTL":"pop","IT.NET.USER.ZS":"inet"}

def wb(cc, ind):
    url = f"https://api.worldbank.org/v2/country/{cc}/indicator/{ind}?format=json&per_page=5&date=2022:2025"
    try:
        req = urllib.request.Request(url, headers={"User-Agent":"M/5"})
        with urllib.request.urlopen(req, timeout=10) as r:
            d = json.loads(r.read())
            if len(d)>1 and d[1]:
                for x in d[1]:
                    if x.get("value") is not None:
                        return x["value"], x["date"]
    except: pass
    return None, None

results = {}
print(f"=== Baseline 30개국 ===", flush=True)
for cc in BASELINE:
    row = {}
    for ind_code, ind_name in INDS.items():
        v, y = wb(cc, ind_code)
        row[ind_name] = {"v": v, "y": y}
        time.sleep(0.2)
    results[cc] = row
    print(f"{cc}: urban={row['urban']['v']}/{row['urban']['y']} gdp={row['gdp']['v']}/{row['gdp']['y']} pop={row['pop']['v']}/{row['pop']['y']} inet={row['inet']['v']}/{row['inet']['y']}", flush=True)

print(f"\n=== Missing {len(MISSING)}개국 ===", flush=True)
missing_r = {}
for cc in MISSING:
    row = {}
    for ind_code, ind_name in INDS.items():
        v, y = wb(cc, ind_code)
        row[ind_name] = {"v": v, "y": y}
        time.sleep(0.2)
    missing_r[cc] = row
    print(f"{cc}: urban={row['urban']['v']}/{row['urban']['y']} gdp={row['gdp']['v']}/{row['gdp']['y']}", flush=True)

out = {"baseline": results, "missing": missing_r, "missing_codes": MISSING}
with open("/workspace/data/AX-innocean-Audience-full/scripts/baseline_verification.json","w") as f:
    json.dump(out, f, indent=2, ensure_ascii=False)
print("\nDONE", flush=True)
