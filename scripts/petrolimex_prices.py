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
    def price_from(candidates):
        if len(candidates) != 1:
            raise ValueError('Petrolimex product row missing or ambiguous')
        values = [int(a) * 1000 + int(b) for a, b in PRICE.findall(candidates[0])]
        if len(values) != 2 or not 5000 <= values[0] <= values[1] <= 100000 or values[1] - values[0] > 3000:
            raise ValueError('Petrolimex Zone 1/2 prices invalid')
        return values[0]
    e5 = price_from([line for line in lines if re.search(r'E5\s+RON\s*92', line, re.I)])
    ron95 = price_from([line for line in lines if re.search(r'E10\s+RON\s*95-', line, re.I)
                        and not re.search(r'95-V\b', line, re.I)])
    diesel = price_from([line for line in lines if re.search(r'0[,.]05S', line, re.I)])
    return {'e5': e5, 'ron95': ron95, 'diesel': diesel}


def article_links(html: str):
    soup = BeautifulSoup(html, 'html.parser')
    found = {}
    for link in soup.find_all('a', href=True):
        match = TITLE.search(link.get_text(' ', strip=True))
        if not match:
            continue
        day, month, year = map(int, match.groups())
        date = dt.date(year, month, day).isoformat()
        found[date] = urljoin(BASE, link['href'])
    return found


def parse_article(html: str, url: str):
    soup = BeautifulSoup(html, 'html.parser')
    images = [urljoin(url, image['src']) for image in soup.find_all('img', src=True)
              if 'files.petrolimex.com.vn/jpgs/' in image['src']]
    if not images:
        raise ValueError('Petrolimex price image missing')
    return images[0]


def load(old_records=None):
    old_records = old_records or []
    latest = old_records[-1]['date'] if old_records else None
    session = requests.Session()
    session.headers.update({'User-Agent': 'FinSuccessDashboard/2.0 (public data research)'})
    pages = [LISTING] if latest else [LISTING, BASE + '/ndi/thong-cao-bao-chi/2.html']
    links = {}
    raw_pages = []
    for page in pages:
        response = session.get(page, timeout=30)
        response.raise_for_status()
        raw_pages.append(response.content)
        links.update(article_links(response.text))
    links = {date: url for date, url in links.items() if (latest is None or date >= latest)}
    if not latest:
        links = dict(sorted(links.items())[-12:])
    if not links:
        raise ValueError('No dated Petrolimex adjustment notices')
    records = {row['date']: row for row in old_records}
    for date, url in sorted(links.items()):
        if date in records and date != latest:
            continue
        page = session.get(url, timeout=30)
        page.raise_for_status()
        observation = dt.date.fromisoformat(date)
        expected = f'{observation.day:02d}-{observation.month}-{observation.year}'
        if expected not in url:
            raise ValueError('Petrolimex notice date does not match URL')
        image_url = parse_article(page.text, url)
        image = session.get(image_url, timeout=30)
        image.raise_for_status()
        if not image.content.startswith(b'\xff\xd8'):
            raise ValueError('Petrolimex price attachment is not JPEG')
        with tempfile.NamedTemporaryFile(suffix='.jpg') as temp:
            temp.write(image.content)
            temp.flush()
            ocr = subprocess.run(['tesseract', temp.name, 'stdout', '-l', 'eng'],
                                 capture_output=True, text=True, timeout=30, check=True).stdout
        records[date] = {'date': date, **parse_prices(ocr), 'article_url': url,
                         'image_url': image_url}
        raw_pages.extend([page.content, image.content])
    rows = [records[date] for date in sorted(records)]
    if len(rows) < (len(old_records) if old_records else 10):
        raise ValueError('Petrolimex history unexpectedly short')
    raw = b'\n<!-- SOURCE BREAK -->\n'.join(raw_pages)
    return {'source_url': LISTING, 'source_name': 'Petrolimex',
            'observation_frequency': 'price adjustment', 'publication_frequency': 'event (usually weekly)',
            'unit': 'VND/litre Zone 1', 'records': rows,
            'raw_sha256': hashlib.sha256(raw).hexdigest(),
            'method': 'Official Petrolimex adjustment notices; Zone 1 E5 RON 92-II, E10 RON 95-III and diesel 0.05S-II'}, raw
