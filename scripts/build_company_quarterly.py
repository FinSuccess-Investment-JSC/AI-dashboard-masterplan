#!/usr/bin/env python3
"""Build data/company-quarterly.(json|js): quarterly revenue, gross profit and net income per company.

Input: verbatim Wi fs_nonfin results in data/raw/wi/fs_nonfin_<sector>_quarterly*.json (one file per period range) (is10 net revenue,
is20 gross profit, is62 profit after tax of parent shareholders, VND). Amounts are converted to billion VND;
margins are derived here as gross profit / revenue and net profit / revenue (self-computed, stated on the page).
Company list and groups come from data/company-comparison.json so the chart and the table always agree.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SECTORS = {'power': ['fs_nonfin_power_quarterly_2021_2023.json', 'fs_nonfin_power_quarterly.json']}
NOTES = {'TV2': 'Trước Q2/2025 là báo cáo đơn lẻ, từ Q2/2025 là báo cáo hợp nhất; số kỳ trước và sau không cùng phạm vi.'}


def quarters(rows):
    return sorted({(r['year'], r['quarter']) for r in rows})


def build():
    comp = json.loads((ROOT / 'data/company-comparison.json').read_text())
    groups = {c['symbol']: c['group'] for c in comp['companies']}
    out_companies, all_q, checked, missing = [], set(), [], []
    for sector, name in SECTORS.items():
        rows = {}
        for name_ in name:
            raw = json.loads((ROOT / 'data/raw/wi' / name_).read_text())
            checked.append(raw['captured'])
            for call in raw['calls']:
                for values in call['dong']:
                    r = dict(zip(call['cot'], values))
                    key = (r['symbol'], r['year'], r['quarter'])
                    if key in rows and rows[key].get('consolidation_id') == 2 and r.get('consolidation_id') != 2:
                        continue  # prefer the consolidated row when both exist
                    rows[key] = r
        all_q |= {(y, q) for _, y, q in rows}
        sector_symbols = [c['symbol'] for c in comp['companies'] if c['sector'] == sector]
        symbols = [s for s in sector_symbols if any(k[0] == s for k in rows)]
        missing += [{'symbol': s, 'group': groups[s]} for s in sector_symbols if s not in symbols]
        for s in symbols:
            out_companies.append({'sector': sector, 'symbol': s, 'group': groups[s], 'note': NOTES.get(s),
                                  'rows': {f'{y}Q{q}': {'revenue': r['is10'], 'gross_profit': r['is20'], 'net_income': r['is62'], 'audit': r['audit_status_id']}
                                           for (sym, y, q), r in rows.items() if sym == s}})
    qs = sorted(all_q)
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
            extra = f'Wi chỉ có dữ liệu đến Q{q}/{y}.'
            note = f'{note} {extra}' if note else extra
        companies.append({'sector': c['sector'], 'symbol': c['symbol'], 'group': c['group'], 'note': note,
                          'revenue': rev, 'gross_profit': gp, 'net_income': ni,
                          'gross_margin': ratio(gp, rev), 'net_margin': ratio(ni, rev),
                          'audit': [c['rows'].get(k, {}).get('audit') for k in keys]})
    payload = {'schema': 1, 'source': 'WiData · BCTC hợp nhất quý (fs_nonfin: doanh thu thuần, lợi nhuận gộp, LNST cổ đông công ty mẹ)',
               'captured_at': max(checked), 'unit': 'tỷ VND', 'quarters': labels, 'missing': missing, 'companies': companies}
    text = json.dumps(payload, ensure_ascii=False, separators=(',', ':'))
    (ROOT / 'data/company-quarterly.json').write_text(text + '\n')
    (ROOT / 'data/company-quarterly.js').write_text('window.COMPANY_QUARTERLY=' + text + ';\n')
    return payload


if __name__ == '__main__':
    p = build()
    print(len(p['companies']), 'companies,', len(p['quarters']), 'quarters:', p['quarters'][0], '→', p['quarters'][-1])
