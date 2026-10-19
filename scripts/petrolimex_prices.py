"""Extract Petrolimex Zone 1 prices from its dated adjustment notices."""
from __future__ import annotations

import datetime as dt
import hashlib
import re
import subprocess
import tempfile
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

BASE = 'https://home.petrolimex.com.vn'
LISTING = BASE + '/ndi/thong-cao-bao-chi.html'
TITLE = re.compile(r'điều chỉnh giá xăng dầu.*ngày\s+(\d{1,2})\.(\d{1,2})\.(\d{4})', re.I)
PRICE = re.compile(r'\b(\d{2})\.(\d{3})\b')


def parse_prices(ocr: str):
    lines = [line.strip() for line in ocr.splitlines() if line.strip()]
    def price_from(product, candidates):
        if len(candidates) != 1:
            raise ValueError(f'Petrolimex product row missing or ambiguous: {product}')
        values = [int(a) * 1000 + int(b) for a, b in PRICE.findall(candidates[0])]
        if len(values) != 2 or not 5000 <= values[0] <= values[1] <= 100000 or values[1] - values[0] > 3000:
            raise ValueError('Petrolimex Zone 1/2 prices invalid')
        return values[0]
    # From 01.10.2026 rows read "Xăng E5 RON 92-II Mức 2" (no "sinh học", emission level suffix);
    # tesseract eng reads that "E5" as "ES". A second E5/ES row is still rejected as ambiguous.
    e5 = price_from('E5 RON 92', [line for line in lines if re.search(r'E[5S]\s+RON\s*92', line, re.I)])
    # From 08.10.2026 grades read "RON 95 Mức 3/Mức 5" and "Diézen 0,05S Mức 2" (OCR: "Mic 3", "Mtrc 2", "0,058").
    ron95 = price_from('E10 RON 95-III', [line for line in lines if re.search(r'E10\s+RON\s*95(-|\s+M\S{1,3}\s*3\b)', line, re.I)
                                          and not re.search(r'95-V\b', line, re.I)])
    diesel = price_from('DO 0,05S', [line for line in lines if re.search(r'0[,.]05[S58]\b|0[,.]05S', line, re.I)])
    return {'e5': e5, 'ron95': ron95, 'diesel': diesel}


def article_links(html: str, undated=None):
    """Dated adjustment notices by date. Price notices whose title carries no date (e.g. "Petrolimex chủ động giảm
    giá xăng dầu 300 đồng" on 15.10.2026) go to `undated`; load() dates them from the article's publication line."""
    soup = BeautifulSoup(html, 'html.parser')
    found = {}
    for link in soup.find_all('a', href=True):
        text = link.get_text(' ', strip=True)
        match = TITLE.search(text)
        if not match:
            if undated is not None and '/thong-cao-bao-chi/' in link['href'] and re.search(r'giá xăng dầu', text, re.I):
                undated.add(urljoin(BASE, link['href']))
            continue
        day, month, year = map(int, match.groups())
        date = dt.date(year, month, day).isoformat()
        found[date] = urljoin(BASE, link['href'])
    return found


ISSUED = re.compile(r'@[^-\n]*-\s*(\d{1,2})\s+tháng\s+(\d{1,2}),\s*(\d{4})', re.I)


def parse_article(html: str, url: str):
    """All attached JPEG/PNG images in page order; the price table is not always the first (01.10.2026: PNG
    price table, JPEG stabilisation-fund table)."""
    soup = BeautifulSoup(html, 'html.parser')
    images = [urljoin(url, image['src']) for image in soup.find_all('img', src=True)
              if re.search(r'files\.petrolimex\.com\.vn/(jpgs|pngs)/', image['src'])]
    if not images:
        raise ValueError('Petrolimex price image missing')
    return images


def issued_date(html: str):
    match = ISSUED.search(BeautifulSoup(html, 'html.parser').get_text(' ', strip=True))
    return dt.date(int(match.group(3)), int(match.group(2)), int(match.group(1))).isoformat() if match else None


def load(old_records=None):
    old_records = old_records or []
    latest = old_records[-1]['date'] if old_records else None
    session = requests.Session()
    session.headers.update({'User-Agent': 'FinSuccessDashboard/2.0 (public data research)'})
    pages = [LISTING] if latest else [LISTING, BASE + '/ndi/thong-cao-bao-chi/2.html']
    links = {}
    undated = set()
    raw_pages = []
    pages_html = {}
    for page in pages:
        response = session.get(page, timeout=30)
        response.raise_for_status()
        raw_pages.append(response.content)
        links.update(article_links(response.text, undated))
    for url in sorted(undated):
        response = session.get(url, timeout=30)
        response.raise_for_status()
        date = issued_date(response.text)
        if date and date not in links:
            links[date] = url
            pages_html[url] = response
    links = {date: url for date, url in links.items() if (latest is None or date >= latest)}
    if not latest:
        links = dict(sorted(links.items())[-12:])
    if not links:
        raise ValueError('No dated Petrolimex adjustment notices')
    records = {row['date']: row for row in old_records}
    for date, url in sorted(links.items()):
        if date in records and date != latest:
            continue
        page = pages_html.get(url) or session.get(url, timeout=30)
        page.raise_for_status()
        observation = dt.date.fromisoformat(date)
        expected = f'{observation.day:02d}-{observation.month}-{observation.year}'
        if url not in pages_html and expected not in url:
            raise ValueError('Petrolimex notice date does not match URL')
        error = None
        for image_url in parse_article(page.text, url):
            image = session.get(image_url, timeout=30)
            image.raise_for_status()
            if not image.content.startswith((b'\xff\xd8', b'\x89PNG')):
                continue
            with tempfile.NamedTemporaryFile(suffix='.img') as temp:
                temp.write(image.content)
                temp.flush()
                ocr = subprocess.run(['tesseract', temp.name, 'stdout', '-l', 'eng'],
                                     capture_output=True, text=True, timeout=30, check=True).stdout
            try:
                prices = parse_prices(ocr)
            except ValueError as e:
                error = e
                continue
            records[date] = {'date': date, **prices, 'article_url': url, 'image_url': image_url}
            raw_pages.extend([page.content, image.content])
            break
        else:
            raise error or ValueError('Petrolimex price attachment is not JPEG/PNG')
    rows = [records[date] for date in sorted(records)]
    if len(rows) < (len(old_records) if old_records else 10):
        raise ValueError('Petrolimex history unexpectedly short')
    raw = b'\n<!-- SOURCE BREAK -->\n'.join(raw_pages)
    return {'source_url': LISTING, 'source_name': 'Petrolimex',
            'observation_frequency': 'price adjustment', 'publication_frequency': 'event (usually weekly)',
            'unit': 'VND/litre Zone 1', 'records': rows,
            'raw_sha256': hashlib.sha256(raw).hexdigest(),
            'method': 'Official Petrolimex adjustment notices; Zone 1 E5 RON 92-II, E10 RON 95-III and diesel 0.05S-II'}, raw
