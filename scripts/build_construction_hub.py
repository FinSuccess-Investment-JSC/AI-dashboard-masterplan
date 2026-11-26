#!/usr/bin/env python3
"""Kiểm và dựng data/construction-hub.js (window.XD_HUB) từ data/construction/hub.json cho dashboard Xây dựng (Xay-dung/).

  python scripts/build_construction_hub.py

hub.json gồm: bảng dự án chính (projects), văn bản chính sách (policies), luồng tin (articles, events, topics).
Dừng nếu: thiếu nguồn https, bài báo thiếu ngày đăng, sự kiện trỏ tới bài/chủ đề/dự án không có, giai đoạn dự án lạ,
mã doanh nghiệp gắn dự án mà không ghi căn cứ. Không sửa số liệu.
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'data/construction/hub.json'
OUT = ROOT / 'data/construction-hub.js'
CATS = {'public', 'project', 'contractor', 'materials', 'policy'}
GROUPS = {'capital', 'bidding', 'mine'}
STATUS = {'effective', 'draft', 'expired'}
DATE = re.compile(r'^\d{4}(-\d{2}(-\d{2})?|-Q[1-4])?$')


def main():
    d = json.loads(SRC.read_text(encoding='utf-8'))
    err = []
    arts = {a['id']: a for a in d['articles']}
    for a in d['articles']:
        if not a.get('url', '').startswith('https://'):
            err.append(f"bài {a['id']}: url không phải https")
        if not re.match(r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}', a.get('published_at') or ''):
            err.append(f"bài {a['id']}: thiếu ngày đăng")
    stages = set(d['stages'])
    projects = {p['id'] for p in d['projects']}
    for p in d['projects']:
        if p['stage'] not in stages:
            err.append(f"dự án {p['id']}: giai đoạn {p['stage']} lạ")
        for t in p['tickers']:
            if not t.get('basis') or not t.get('url', '').startswith('https://'):
                err.append(f"dự án {p['id']}: mã {t['code']} thiếu căn cứ/nguồn")
        for s in p.get('sources', []):
            if s not in arts:
                err.append(f"dự án {p['id']}: nguồn {s} không có trong articles")
        if not p.get('sources') and not p.get('extra_sources') and not p['tickers']:
            err.append(f"dự án {p['id']}: không có nguồn")
        nx = p.get('next') or {}
        if nx.get('date') and not DATE.match(nx['date']):
            err.append(f"dự án {p['id']}: ngày mốc {nx['date']} sai dạng")
    for x in d['policies']:
        if x['group'] not in GROUPS or x['status'] not in STATUS:
            err.append(f"văn bản {x['id']}: nhóm/trạng thái lạ")
        if not x['source'][1].startswith('https://'):
            err.append(f"văn bản {x['id']}: nguồn không phải https")
    topics = {t['id'] for t in d['topics']}
    for e in d['events']:
        if e['category'] not in CATS:
            err.append(f"tin {e['id']}: nhóm {e['category']} lạ")
        for a in e['article_ids']:
            if a not in arts:
                err.append(f"tin {e['id']}: bài {a} không có")
        for t in e['topic_ids']:
            if t not in topics:
                err.append(f"tin {e['id']}: chủ đề {t} không có")
        if e.get('project_id') and e['project_id'] not in projects:
            err.append(f"tin {e['id']}: dự án {e['project_id']} không có")
        for k in ('event_date', 'expected_date', 'effective_date'):
            if e.get(k) and not DATE.match(e[k]):
                err.append(f"tin {e['id']}: {k} sai dạng")
        if e['companies'] and not e.get('company_basis'):
            err.append(f"tin {e['id']}: có mã nhưng thiếu căn cứ")
    if err:
        print('\n'.join(err), file=sys.stderr)
        return 1
    OUT.write_text('window.XD_HUB = ' + json.dumps(d, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8', newline='\n')
    print(OUT.relative_to(ROOT), len(d['projects']), 'dự án,', len(d['policies']), 'văn bản,', len(d['events']), 'tin,', len(d['topics']), 'chủ đề')


if __name__ == '__main__':
    sys.exit(main())
