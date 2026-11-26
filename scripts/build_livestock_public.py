#!/usr/bin/env python3
"""Ghép dữ liệu dashboard Chăn nuôi heo → data/livestock-public-data.(json|js) (window.LIVESTOCK_DATA).

Đầu vào (không gọi mạng):
  data/raw/public/hog-prices.json     giá heo hơi ngày, ba miền + tỉnh (scripts/fetch_hog_prices.py, chạy mỗi lượt refresh)
  data/raw/public/pinksheet-feed.json ngô, khô đậu tương World Bank theo tháng (scripts/fetch_pinksheet.py)
  data/agri-public-data.json          tỷ giá trung tâm USD/VND bình quân tháng; heo hơi toàn quốc WiData (bình quân tháng, chuỗi dài);
                                      nhập khẩu ngô, đậu tương, thức ăn (Hải quan); sản lượng thức ăn gia súc (NSO)
  data/livestock/observations.json        quan sát nhập tay có kiểm: NSO tổng đàn/xuất chuồng, nhập khẩu HS 0203, ASF, doanh nghiệp,
                                      giá đối chiếu, preset VCBS — mỗi dòng có khóa ổn định, kỳ, ngày công bố, ngày kiểm, URL, trạng thái.
Khóa quan sát = chỉ tiêu|kỳ|địa bàn|phạm vi|nguồn; trùng khóa → báo lỗi (không âm thầm ghi đè). Chạy lặp lại cho cùng kết quả.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / 'data/raw/public'


def load(p, default=None):
    p = ROOT / p if not isinstance(p, Path) else p
    return json.loads(p.read_text(encoding='utf-8')) if p.exists() else default


def obs_key(o):
    return '|'.join(str(o.get(k) or '') for k in ('indicator', 'period', 'area', 'scope', 'source'))


def main():
    hog = load(RAW / 'hog-prices.json', {'series': {}, 'checks': [], 'revisions': [], 'sources': {}})
    pink = load(RAW / 'pinksheet-feed.json', {'series': {}})
    agri = load('data/agri-public-data.json', {'blocks': {}})
    ev = load('data/livestock/observations.json', {'observations': []})
    macro = agri['blocks'].get('macro', {}).get('series', {})
    com = agri['blocks'].get('commodity', {}).get('series', {})

    def mseries(s, keep=('name', 'unit', 'source', 'url')):
        if not s: return None
        return {**{k: s.get(k) for k in keep}, 'points': [[r['date'][:7], r['value']] for r in s.get('records', []) if r.get('value') is not None]}

    seen, errs = {}, []
    for o in ev['observations']:
        k = obs_key(o)
        if k in seen: errs.append('trùng khóa quan sát: ' + k)
        seen[k] = o
        o['key'] = k
    if errs: raise SystemExit('\n'.join(errs))

    out = {
        'schema': 1,
        'built_from': ['data/raw/public/hog-prices.json', 'data/raw/public/pinksheet-feed.json', 'data/agri-public-data.json', 'data/livestock/observations.json'],
        'hog': {'sources': hog.get('sources', {}), 'checks': hog.get('checks', [])[-14:], 'revisions': hog.get('revisions', []),
                'series': {k: {**{m: v for m, v in s.items() if m != 'points'}, 'points': [[d, v] for d, v in s['points'].items()]} for k, s in hog['series'].items()}},
        'pinksheet': pink,
        'fx': mseries(macro.get('usdvnd')),
        'hog_monthly_wi': mseries(com.get('hog')),
        'feed_imports': {k: mseries(macro.get(k)) for k in ('imp_corn', 'imp_soy', 'imp_feed')},
        'feed_output': mseries(macro.get('feed')),
        'evidence': {'note': ev.get('note'), 'observations': sorted(ev['observations'], key=lambda o: (o.get('group', ''), o['key']))},
    }
    text = json.dumps(out, ensure_ascii=False, separators=(',', ':'))
    (ROOT / 'data/livestock-public-data.json').write_text(text + '\n', encoding='utf-8', newline='\n')
    (ROOT / 'data/livestock-public-data.js').write_text('window.LIVESTOCK_DATA=' + text + ';\n', encoding='utf-8', newline='\n')
    last = {k: s['points'][-1] for k, s in out['hog']['series'].items() if k.startswith('region:') and s['points']}
    print('livestock:', len(out['hog']['series']), 'hog series', last, '·', len(out['evidence']['observations']), 'evidence rows')


if __name__ == '__main__':
    sys.exit(main())
