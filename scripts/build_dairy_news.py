#!/usr/bin/env python3
"""Dựng data/dairy-news.js (window.DAIRY_NEWS) cho tab Chủ đề nóng của Sữa từ data/dairy/news.json (28/11/2026, chép scripts/build_retail_news.py).

Khuôn giống data/rubber-news.js và data/power/news.json: bài gốc (articles) → sự kiện (events) → chủ đề (topics); nhóm tin ở `categories`.
- Bài gốc: id, source_name, title, url (https), published_at (YYYY-MM-DD) — chỉ bài đã mở và kiểm ngày đăng.
- Sự kiện: id, title, summary, new_information, key_figures, companies, segments, category, topic_ids, importance (1–3), event_date, article_ids, impact.
- Chủ đề: id, title, background, next_check, related_data [nhãn, link trong trang].
Sửa data/dairy/news.json rồi chạy:

    python scripts/build_dairy_news.py
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'data/dairy/news.json'
OUT = ROOT / 'data/dairy-news.js'
DAY = re.compile(r'^\d{4}-\d{2}-\d{2}$')


def check(d):
    assert DAY.match(d['updated_at']), 'updated_at'
    cats = d['categories']
    assert cats and all(isinstance(v, str) and v for v in cats.values()), 'categories'
    arts = {a['id']: a for a in d['articles']}
    topics = {t['id'] for t in d['topics']}
    assert len(arts) == len(d['articles']), 'trùng id bài'
    assert len(topics) == len(d['topics']), 'trùng id chủ đề'
    urls = set()
    for a in d['articles']:
        assert a['url'].startswith('https://'), a['id']
        assert a['url'] not in urls, ('trùng URL', a['id']); urls.add(a['url'])
        assert DAY.match(a['published_at']) and a['published_at'] <= d['updated_at'], (a['id'], a['published_at'])
        assert a.get('source_name') and a.get('title'), a['id']
    ids = set()
    for e in d['events']:
        assert e['id'] not in ids, e['id']; ids.add(e['id'])
        assert e['category'] in cats, (e['id'], e['category'])
        assert e['article_ids'] and all(i in arts for i in e['article_ids']), e['id']
        assert e['topic_ids'] and all(t in topics for t in e['topic_ids']), e['id']
        assert e['importance'] in (1, 2, 3), e['id']
        assert not e.get('event_date') or DAY.match(e['event_date']), e['id']
        assert e.get('title') and e.get('summary') and e.get('new_information'), e['id']
        for k in ('key_figures', 'companies', 'segments'):
            e.setdefault(k, [])
            assert isinstance(e[k], list), (e['id'], k)
    for t in d['topics']:
        assert t.get('title') and t.get('background') and t.get('next_check'), t['id']
        rd = t.get('related_data')
        assert not rd or (len(rd) == 2 and all(isinstance(x, str) for x in rd)), (t['id'], 'related_data = [nhãn, link]')
        assert any(t['id'] in e['topic_ids'] for e in d['events']), (t['id'], 'chủ đề chưa có sự kiện')
    used = {a for e in d['events'] for a in e['article_ids']}
    unused = [a['id'] for a in d['articles'] if a['id'] not in used]
    if unused:
        print('Bỏ bài không có sự kiện:', ', '.join(unused))
    d['articles'] = [a for a in d['articles'] if a['id'] in used]
    return d


def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')  # cửa sổ lệnh Windows (cp1252) không in được tiếng Việt
    d = check(json.loads(SRC.read_text(encoding='utf-8')))
    OUT.write_text('/* Sinh bởi scripts/build_dairy_news.py từ data/dairy/news.json — không sửa tay. */\nwindow.DAIRY_NEWS = '
                   + json.dumps(d, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8', newline='\n')
    days = sorted(a['published_at'] for a in d['articles'])
    print(OUT.relative_to(ROOT).as_posix(), len(d['articles']), 'bài;', len(d['events']), 'sự kiện;', len(d['topics']), 'chủ đề;', days[0], '→', days[-1])


if __name__ == '__main__':
    main()
