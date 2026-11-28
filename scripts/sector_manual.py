#!/usr/bin/env python3
"""Lõi dùng chung cho số vận hành nhập tay của Tài chính ngành › 03 Định giá (DASHBOARD_WORKFLOW §44, 28/11/2026).
Gọi qua scripts/build_re_manual.py (BĐS dân cư) hoặc scripts/build_ship_manual.py (Vận tải biển).

Nguồn sự thật: data/realestate/manual.json — mỗi dòng một (mã, chỉ tiêu) đã MỞ trang gốc:
  {ticker, item, period, value, unit, extra, url, opened_at, quote, status, note, hide?}
  item: presales_latest | presales_fy2025 | presales_plan_2026 | unbilled | rnav | occupancy | gfa
  status: match | not_found | unreachable (chỉ dòng match, không hide mới lên trang)
Script:
  1. kiểm dòng match: có url https, có quote, ít nhất một con số của dòng nằm trong quote;
  2. ghi data/re-manual.js (window.RE_MANUAL) cho Bat-dong-san/app/peer-valuation.js;
  3. đồng bộ các dòng match vào data/realestate/evidence.json (block 're-manual') để routine thứ Hai mở lại link.
Không lấy số từ mạng; cập nhật = sửa manual.json rồi chạy lại script này.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def digits(text):
    return [re.sub(r'[.,\s]', '', t) for t in re.findall(r'\d[\d.,\s]*\d|\d', str(text))]


def vn(x):
    """Số theo kiểu viết tiếng Việt, để dòng bằng chứng khớp chữ trong đoạn trích."""
    s = f'{x:,.2f}'.rstrip('0').rstrip('.') if isinstance(x, float) and not float(x).is_integer() else f'{int(x):,}'
    return s.replace(',', '§').replace('.', ',').replace('§', '.')


def build(SRC, OUT, EVID, BLOCK, VAR, KEY, LABEL, SCALE, name):
    doc = json.loads(SRC.read_text(encoding='utf-8'))
    errors, companies, evidence = [], {}, []
    for r in doc['rows']:
        t, item = r.get('ticker'), r.get('item')
        if item not in KEY:
            errors.append(f'{t}: item lạ {item}')
            continue
        if r.get('status') != 'match' or r.get('hide'):
            continue
        ex = r.get('extra') or {}
        nums = [r.get('value'), ex.get('rnav_per_share'), ex.get('target_price')]
        nums = [n for n in nums if isinstance(n, (int, float))]
        qd = ''.join(digits(r.get('quote') or ''))
        if not str(r.get('url', '')).startswith('https://'):
            errors.append(f'{t} {item}: thiếu url https')
        if not nums or not any(re.sub(r'[.,]', '', vn(n)) in qd or str(n).replace('.', '') in qd for n in nums):
            errors.append(f'{t} {item}: không số nào của dòng có trong quote')
        if r.get('unit') not in SCALE:
            errors.append(f'{t} {item}: đơn vị lạ {r.get("unit")}')
            continue
        by = {'Shinhan Securities Vietnam': 'Shinhan', 'VDSC (Rồng Việt)': 'VDSC', 'Mirae Asset': 'Mirae'}.get(ex.get('broker'), ex.get('broker'))
        cell = {'period': r.get('period'), 'url': r['url'], 'opened': r.get('opened_at')}
        if by:
            cell['by'] = by
        if ex.get('estimate') or ex.get('basis') == 'broker estimate':
            cell['est'] = True
        if ex.get('lower_bound'):
            cell['min'] = True
        if item in ('rnav', 'target'):
            cell.update({'rnav': ex.get('rnav_per_share'), 'tp': ex.get('target_price') or (r.get('value') if item == 'target' else None), 'method': ex.get('method'), 'date': ex.get('report_date')})
            shown = ' · '.join(x for x in [f"RNAV {vn(cell['rnav'])} đồng/cp" if cell['rnav'] else '', f"giá mục tiêu {vn(cell['tp'])} đồng/cp" if cell['tp'] else ''] if x)
        else:
            cell['v'] = round(r['value'] * SCALE[r['unit']], 2)
            if isinstance(ex.get('value_max'), (int, float)):
                cell['vmax'] = round(ex['value_max'] * SCALE[r['unit']], 2)
            if ex.get('qualifier'):
                cell['q'] = ex['qualifier']
            if ex.get('cap_unit'):
                cell['cu'] = ex['cap_unit']
            if ex.get('text'):
                cell['text'] = ex['text']
            shown = f"{vn(r['value'])} {r['unit']}"
        companies.setdefault(t, {})[KEY[item]] = cell
        evidence.append({'block': BLOCK, 'claim': f"{t} · {LABEL[item]} · {r.get('period') or ''}{' · ' + by if by else ''}", 'value': shown, 'url': r['url'],
                         'opened_at': r.get('opened_at'), 'quote': r['quote'], 'status': 'match', 'note': r.get('note', '')})
    if errors:
        sys.exit('manual.json có lỗi:\n  ' + '\n  '.join(errors))
    out = {'updated': doc.get('updated'), 'note': doc.get('note', ''), 'companies': companies,
           'missing': {t: sorted({KEY[r['item']] for r in doc['rows'] if r.get('ticker') == t and r.get('item') in KEY and (r.get('status') != 'match' or r.get('hide'))})
                       for t in sorted({r.get('ticker') for r in doc['rows']})}}
    OUT.write_text(f'window.{VAR} = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8', newline='\n')
    rows = [e for e in json.loads(EVID.read_text(encoding='utf-8')) if e.get('block') != BLOCK] + evidence
    EVID.write_text(json.dumps(rows, ensure_ascii=False, indent=1) + '\n', encoding='utf-8', newline='\n')
    print(f'{name}: {sum(len(c) for c in companies.values())} ô số của {len(companies)} mã; {len(evidence)} dòng bằng chứng')

