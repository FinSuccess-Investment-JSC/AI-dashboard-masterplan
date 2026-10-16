#!/usr/bin/env python3
"""Build data/company-quarterly.(json|js): quarterly revenue, gross profit and net income per company.

Input: VNDirect finfo snapshot data/raw/public/fs_<sector>_quarterly_vndirect.json (scripts/fetch_public_fs.py:
21001 net revenue, 23100 gross profit, 23000 profit after tax of parent shareholders, VND). Amounts are converted to billion VND;
margins are derived here as gross profit / revenue and net profit / revenue (self-computed, stated on the page).
Company list and groups come from data/company-comparison.json so the chart and the table always agree.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SECTORS = {'power': 'fs_power_quarterly_vndirect.json'}  # scripts/fetch_public_fs.py
FIRST_YEAR = 2021
NOTES = {'TV2': 'Trước Q2/2025 là báo cáo đơn lẻ, từ Q2/2025 là báo cáo hợp nhất; số kỳ trước và sau không cùng phạm vi.'}


def quarters(rows):
    return sorted({(r['year'], r['quarter']) for r in rows})


def build():
    comp = json.loads((ROOT / 'data/company-comparison.json').read_text())
    groups = {c['symbol']: c['group'] for c in comp['companies']}
    out_companies, all_q, checked, missing = [], set(), [], []
    for sector, name in SECTORS.items():
        raw = json.loads((ROOT / 'data/raw/public' / name).read_text())
        checked.append(raw['captured'])
        rows = {(sym, int(k[:4]), int(k[5])): v for sym, per in raw['rows'].items() for k, v in per.items()}
        all_q |= {(y, q) for _, y, q in rows}
        sector_symbols = [c['symbol'] for c in comp['companies'] if c['sector'] == sector]
        symbols = [s for s in sector_symbols if any(k[0] == s for k in rows)]
        missing += [{'symbol': s, 'group': groups[s], 'sector': sector} for s in sector_symbols if s not in symbols]
        for s in symbols:
            out_companies.append({'sector': sector, 'symbol': s, 'group': groups[s], 'note': NOTES.get(s),
                                  'rows': {f'{y}Q{q}': {'revenue': r['revenue'], 'gross_profit': r['gross_profit'], 'net_income': r['net_income'], 'audit': None}
                                           for (sym, y, q), r in rows.items() if sym == s}})
    # Other sectors: quarterly history saved by scripts/update_company_comparison.py (Stock Analysis).
    sa_rows = {}
    for row in comp['companies']:
        if row['sector'] in SECTORS:
            continue
        h = row.get('history')
        if not h:
            missing.append({'symbol': row['symbol'], 'group': row['group'], 'sector': row['sector']})
            continue
        sa_rows[(row['sector'], row['symbol'])] = (row, h)
        for label in h['quarters']:
            q, y = label[1], label[3:]
            all_q.add((int(y), int(q)))
    qs = sorted(q for q in all_q if q[0] >= FIRST_YEAR)  # a few providers list sparse quarters back to 2013
    labels = [f'Q{q}/{y}' for y, q in qs]
    keys = [f'{y}Q{q}' for y, q in qs]
    companies = []
    for c in out_companies:
        def series(field):
            return [round(c['rows'][k][field] / 1e9, 3) if k in c['rows'] and c['rows'][k][field] is not None else None for k in keys]
        rev, gp, ni = series('revenue'), series('gross_profit'), series('net_income')
        ratio = lambda a, b: [round(x / y * 100, 2) if x is not None and y else None for x, y in zip(a, b)]
        have = [k for k in keys if k in c['rows']]
        note = c['note']
        if have[-1] != keys[-1]:
            y, q = have[-1].split('Q')
            extra = f'Nguồn chỉ có dữ liệu đến Q{q}/{y}.'
            note = f'{note} {extra}' if note else extra
        companies.append({'sector': c['sector'], 'symbol': c['symbol'], 'group': c['group'], 'note': note, 'source': 'vnd',
                          'revenue': rev, 'gross_profit': gp, 'net_income': ni,
                          'gross_margin': ratio(gp, rev), 'net_margin': ratio(ni, rev),
                          'audit': [c['rows'].get(k, {}).get('audit') for k in keys]})
    for (sector, symbol), (row, h) in sa_rows.items():
        pos = {lab: i for i, lab in enumerate(h['quarters'])}
        pick = lambda arr: [arr[pos[l]] if l in pos else None for l in labels]
        rev, gp, ni = pick(h['revenue']), pick(h['gross_profit']), pick(h['net_income'])
        ratio = lambda a, b: [round(x / y * 100, 2) if x is not None and y else None for x, y in zip(a, b)]
        note = {'bank': 'Doanh thu = tổng thu nhập trước dự phòng; ngân hàng không có lãi gộp.',
                'insurance': 'Doanh thu = tổng doanh thu; bảo hiểm không có lãi gộp.'}.get(sector)
        companies.append({'sector': sector, 'symbol': symbol, 'group': row['group'], 'note': note, 'source': 'sa',
                          'revenue': rev, 'gross_profit': gp, 'net_income': ni,
                          'gross_margin': ratio(gp, rev), 'net_margin': ratio(ni, rev), 'audit': [None] * len(labels)})
    payload = {'schema': 1, 'source': 'BCTC hợp nhất quý (VNDirect finfo: doanh thu thuần, lợi nhuận gộp, LNST cổ đông công ty mẹ)',
               'sources': {'vnd': {'name': 'BCTC hợp nhất quý (VNDirect finfo)', 'url': 'https://api-finfo.vndirect.com.vn/v4/financial_statements'}, 'sa': {'name': 'Stock Analysis / S&P Global Market Intelligence · BCTC quý', 'url': 'https://stockanalysis.com/'}},
               'captured_at': max(checked), 'sa_checked_at': (comp.get('checked_at') or '')[:10], 'unit': 'tỷ VND', 'quarters': labels, 'missing': missing, 'companies': companies}
    text = json.dumps(payload, ensure_ascii=False, separators=(',', ':'))
    (ROOT / 'data/company-quarterly.json').write_text(text + '\n')
    (ROOT / 'data/company-quarterly.js').write_text('window.COMPANY_QUARTERLY=' + text + ';\n')
    return payload


if __name__ == '__main__':
    p = build()
    print(len(p['companies']), 'companies,', len(p['quarters']), 'quarters:', p['quarters'][0], '→', p['quarters'][-1])
