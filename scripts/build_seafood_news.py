#!/usr/bin/env python3
"""Dựng data/seafood-news.js (window.SEAFOOD_NEWS) cho tab Chủ đề nóng của Cá tra (Ca-tra/) và Tôm (Tom/) từ data/seafood/news.json.

Một nguồn tin chung cho hai trang (28/11/2026). Khuôn giống data/rubber/news.json, data/power/news.json:
bài gốc (articles) → sự kiện (events) → chủ đề (topics).
- Bài gốc: id, source_name, title, url (https), published_at (YYYY-MM-DD) — chỉ bài đã mở và kiểm ngày đăng.
- Sự kiện: id, title, summary, new_information, key_figures, companies, segments (Cá tra | Tôm | Thủy sản chung), category,
  topic_ids, importance (1–3), event_date, article_ids, impact.
- Chủ đề: id, lines (pang | shrimp: trang nào hiện), title, analyzed (ngày phân tích), background, impact, next_check,
  related_data [[nhãn, link trong trang], ...].
Trang lọc theo body[data-seafood-line]: chỉ hiện chủ đề có line của trang và sự kiện gắn ít nhất một chủ đề đó, có segments
là phân khúc của trang (Cá tra | Tôm) hoặc Thủy sản chung.
Sửa data/seafood/news.json rồi chạy:

    python scripts/build_seafood_news.py
"""
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'data/seafood/news.json'
OUT = ROOT / 'data/seafood-news.js'
CATEGORIES = {'export', 'trade', 'material', 'companies', 'policy', 'outlook'}
SEGMENTS = {'Cá tra', 'Tôm', 'Thủy sản chung'}
LINES = {'pang', 'shrimp'}
DAY = re.compile(r'^\d{4}-\d{2}-\d{2}$')


def check(d):
    assert DAY.match(d['updated_at']), d['updated_at']
    arts = {a['id']: a for a in d['articles']}
    assert len(arts) == len(d['articles']), 'trùng id bài'
    urls = [a['url'] for a in d['articles']]
    assert len(set(urls)) == len(urls), 'trùng URL bài'
    for a in d['articles']:
        assert a['url'].startswith('https://'), a['id']
        assert DAY.match(a['published_at']) and a['published_at'] <= d['updated_at'], (a['id'], a['published_at'])
        assert a.get('source_name') and a.get('title'), a['id']
    topics = {t['id']: t for t in d['topics']}
    assert len(topics) == len(d['topics']), 'trùng id chủ đề'
    for t in d['topics']:
        assert t['lines'] and set(t['lines']) <= LINES, (t['id'], t['lines'])
        assert t.get('background') and t.get('next_check'), t['id']
        assert not t.get('analyzed') or DAY.match(t['analyzed']), t['id']
        rd = t.get('related_data') or []
        assert all(len(x) == 2 and all(isinstance(y, str) for y in x) for x in rd), (t['id'], 'related_data = [[nhãn, link], ...]')
        t['related_data'] = rd
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
        assert set(e['segments']) <= SEGMENTS, (e['id'], e['segments'])
    used = {a for e in d['events'] for a in e['article_ids']}
    d['articles'] = [a for a in d['articles'] if a['id'] in used]
    # Mỗi trang: đếm bài / sự kiện / chủ đề có sự kiện.
    stats = {}
    for line in sorted(LINES):
        tl = {t['id'] for t in d['topics'] if line in t['lines']}
        seg = {'pang': 'Cá tra', 'shrimp': 'Tôm'}[line]
        ev = [e for e in d['events'] if tl & set(e['topic_ids']) and {seg, 'Thủy sản chung'} & set(e['segments'])]
        live = {t for e in ev for t in e['topic_ids'] if t in tl}
        assert live == tl, (line, 'chủ đề không có sự kiện', tl - live)
        stats[line] = (len({a for e in ev for a in e['article_ids']}), len(ev), len(tl),
                       min(arts[e['article_ids'][0]]['published_at'] for e in ev), max(arts[e['article_ids'][0]]['published_at'] for e in ev))
    return d, stats


def main():
    d, stats = check(json.loads(SRC.read_text(encoding='utf-8')))
    OUT.write_text('/* Sinh bởi scripts/build_seafood_news.py từ data/seafood/news.json — không sửa tay. */\nwindow.SEAFOOD_NEWS = '
                   + json.dumps(d, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8', newline='\n')
    print(OUT.relative_to(ROOT).as_posix(), len(d['articles']), 'bài;', len(d['events']), 'sự kiện;', len(d['topics']), 'chủ đề')
    for line, (a, e, t, lo, hi) in stats.items():
        print(f'  {"Cá tra" if line == "pang" else "Tôm"}: {a} bài, {e} sự kiện, {t} chủ đề, {lo} → {hi}')


if __name__ == '__main__':
    main()
