"""Dựng data/realestate-market-history.js từ số tài liệu (Bộ Xây dựng, CBRE, DKRA...) đã kiểm tay.

Nguồn đầu vào: data/realestate-market/*.json — mỗi dòng có link nguồn đã mở.
Không tự điền số: ô thiếu giữ null. Chạy: python3 scripts/build_realestate_market.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "realestate-market"
OUT = ROOT / "data" / "realestate-market-history.js"
NAMES = ["moc_quarterly", "hn_series", "hcm_series", "supply_detail", "provinces", "fdi_projects"]


def qkey(q):
    n, y = q.split("/")
    return int(y) * 10 + int(n[1])


def load(name):
    p = RAW / f"{name}.json"
    return json.loads(p.read_text()) if p.exists() else []


def main():
    data = {n: load(n) for n in NAMES}
    for n in ("moc_quarterly", "hn_series", "hcm_series"):
        for r in data[n]:
            if not r.get("sources") and any(r.get(k) is not None for k in ("price", "transactions_total", "transactions_land")):
                raise SystemExit(f"{n} {r['quarter']}: có số nhưng thiếu nguồn")
        data[n].sort(key=lambda r: qkey(r["quarter"]))
    tmp = OUT.with_suffix(".tmp")
    tmp.write_text("window.RE_MARKET_HISTORY=" + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n")
    tmp.replace(OUT)
    print(OUT, {k: len(v) for k, v in data.items()})


if __name__ == "__main__":
    main()
