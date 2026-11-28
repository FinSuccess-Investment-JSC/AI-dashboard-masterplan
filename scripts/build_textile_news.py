#!/usr/bin/env python3
"""Dựng data/textile-news.js (window.TEXTILE_NEWS) cho tab Chủ đề nóng của Dệt may từ data/textile/news.json.

Khuôn chép scripts/build_rubber_news.py (28/11/2026; gốc data/power/news.json): bài gốc (articles) → sự kiện (events) → chủ đề (topics).
- Bài gốc: id, source_name, title, url (https), published_at (YYYY-MM-DD) — chỉ bài đã mở và kiểm ngày đăng.
- Sự kiện: id, title, summary, new_information, key_figures, companies, segments, category, topic_ids, importance (1–3), event_date, article_ids, impact.
- Chủ đề: id, title, background, next_check, related_data [nhãn, link trong trang].
Sửa data/textile/news.json rồi chạy:

    python scripts/build_textile_news.py
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'data/textile/news.json'
OUT = ROOT / 'data/textile-news.js'
# Nhóm tin Dệt may (nhãn hiển thị ở Det-may/app/textile-news.js).
CATEGORIES = {'export', 'tariff', 'remedy', 'material', 'companies', 'labor', 'green', 'competitor'}
DAY = re.compile(r'^\d{4}-\d{2}-\d{2}$')


def check(d):
    arts = {a['id']: a for a in d['articles']}
    topics = {t['id'] for t in d['topics']}
    assert len(arts) == len(d['articles']), 'trùng id bài'
    for a in d['articles']:
        assert a['url'].startswith('https://'), a['id']
        assert DAY.match(a['published_at']), (a['id'], a['published_at'])
        assert a['published_at'] <= d['updated_at'], (a['id'], 'ngày đăng sau ngày cập nhật')
    ids = set()
    for e in d['events']:
        assert e['id'] not in ids, e['id']; ids.add(e['id'])
        assert e['category'] in CATEGORIES, (e['id'], e['category'])
        assert e['article_ids'] and all(i in arts for i in e['article_ids']), e['id']
        assert e['topic_ids'] and all(t in topics for t in e['topic_ids']), e['id']
        assert e['importance'] in (1, 2, 3), e['id']
        assert not e.get('event_date') or DAY.match(e['event_date']), e['id']
        for k in ('key_figures', 'companies', 'segments'):
            e.setdefault(k, [])
    for t in d['topics']:
        rd = t.get('related_data')
        assert not rd or (len(rd) == 2 and all(isinstance(x, str) for x in rd)), (t['id'], 'related_data = [nhãn, link]')
        assert not rd or rd[1].startswith(('?sub=', '#')), (t['id'], 'related_data: link trong trang')
        assert t.get('background') and t.get('next_check'), (t['id'], 'thiếu background/next_check')
    used = {a for e in d['events'] for a in e['article_ids']}
    d['articles'] = [a for a in d['articles'] if a['id'] in used]
    return d


def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')  # console Windows cp1252
    d = check(json.loads(SRC.read_text(encoding='utf-8')))
    OUT.write_text('/* Sinh bởi scripts/build_textile_news.py từ data/textile/news.json — không sửa tay. */\nwindow.TEXTILE_NEWS = '
                   + json.dumps(d, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8', newline='\n')
    print(OUT.relative_to(ROOT), len(d['articles']), 'bài;', len(d['events']), 'sự kiện;', len(d['topics']), 'chủ đề')


if __name__ == '__main__':
    main()
