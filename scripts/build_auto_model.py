#!/usr/bin/env python3
"""Dựng data/auto-model.json/.js (window.AUTO_MODEL) cho Ô tô – Xe máy › Tổng quan (Bản đồ ngành, Mô hình kiếm tiền).

  python scripts/fetch_auto_financials.py && python scripts/build_auto_model.py

Đầu vào:
  - data/raw/public/fs_auto_full_vndirect.json: BCTC hợp nhất VEA, HAX, SVC, CTF, TMT (VNDirect finfo), đồng.
  - data/auto/business-model.json: số tài liệu đọc tay từ BCTC/báo cáo thường niên (tỷ lệ sở hữu liên doanh VEA,
    cơ cấu doanh thu theo mảng của đại lý…), mỗi bộ có kỳ, đơn vị, phạm vi, nguồn URL. Không có số thì để trống.
Đầu ra (tỷ đồng): fin[mã][kỳ] với kỳ là năm ('2025') và lũy kế năm hiện hành ('9T/2026' = cộng các quý riêng đã có).
Kiểm tra: tổng 4 quý = số năm (lệch > 1 tỷ ghi vào 'checks'); không điền số thiếu, không đổi số âm thành 0.
"""
import datetime as dt, json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from auto_fin_items import ITEMS, TICKERS  # noqa: E402

RAW = ROOT / 'data/raw/public/fs_auto_full_vndirect.json'
DOC = ROOT / 'data/auto/business-model.json'
OUT = ROOT / 'data/auto-model.json'
OUT_JS = ROOT / 'data/auto-model.js'
FLOW_MODELS = (2, 3)


def val(rec, it):
    x = rec.get(str(it['code']))
    return None if x is None else round(x * it.get('sign', 1) / 1e9, 2)


def main():
    raw = json.loads(RAW.read_text(encoding='utf-8'))
    fin, checks, ytd_label = {}, [], None
    for t in TICKERS:
        ann, q = raw['annual'].get(t, {}), raw['quarter'].get(t, {})
        rows = {}
        for y, rec in ann.items():
            rows[y] = {it['id']: val(rec, it) for it in ITEMS}
            qs = [q.get(f'{y}Q{k}') for k in range(1, 5)]
            # Trước 2024 số quý trên VNDirect nhiều mã không phải quý riêng; chỉ kiểm 2024 trở đi (cùng cách dùng số quý cho lũy kế).
            if all(qs) and y >= '2024':
                for it in ITEMS:
                    if it['model'] not in FLOW_MODELS or rows[y][it['id']] is None:
                        continue
                    s = sum(val(x, it) or 0 for x in qs)
                    if abs(s - rows[y][it['id']]) > 1:
                        checks.append({'ticker': t, 'year': y, 'item': it['id'], 'annual': rows[y][it['id']], 'sum_quarters': round(s, 2)})
        # Lũy kế năm hiện hành: chỉ khi năm đó chưa có số năm.
        years_q = sorted({p[:4] for p in q})
        cur = years_q[-1] if years_q else None
        if cur and cur not in ann:
            qk = sorted(p for p in q if p.startswith(cur))
            n = len(qk)
            label = f'{n * 3}T/{cur}'
            ytd_label = ytd_label or label
            rec = {}
            for it in ITEMS:
                vs = [val(q[p], it) for p in qk]
                if it['model'] in FLOW_MODELS:
                    rec[it['id']] = round(sum(vs), 2) if all(v is not None for v in vs) else None
                else:  # số dư: cuối kỳ gần nhất
                    rec[it['id']] = vs[-1]
            rows[label] = rec
            rows[label]['_quarters'] = qk
        fin[t] = rows
    doc = json.loads(DOC.read_text(encoding='utf-8')) if DOC.exists() else {}
    payload = {
        'built': dt.date.today().isoformat(),
        'fs': {'captured': raw['captured'], 'source': raw['source'], 'url': 'https://dstock.vndirect.com.vn/', 'unit': 'tỷ đồng',
               'scope': 'BCTC hợp nhất; năm tài chính và lũy kế các quý riêng của năm hiện hành', 'ytd': ytd_label,
               'items': {it['id']: it['name'] for it in ITEMS}},
        'fin': fin, 'doc': doc, 'checks': checks,
    }
    text = json.dumps(payload, ensure_ascii=False, separators=(',', ':'))
    OUT.write_text(text + '\n', encoding='utf-8', newline='\n')
    OUT_JS.write_text('window.AUTO_MODEL=' + text + ';\n', encoding='utf-8', newline='\n')
    print(OUT.relative_to(ROOT), len(TICKERS), 'mã ·', ytd_label, '·', len(checks), 'lệch quý/năm')


if __name__ == '__main__':
    main()
