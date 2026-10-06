"""Power-sector public feeds: EVN daily system operation, World Bank energy prices, NOAA ENSO,
ICE Newcastle coal / JKM LNG. Each loader returns (source_dict, raw_bytes) for update_daily.merge_good.
Parsers fail closed (ValueError); nothing is interpolated, a value the source omits stays null."""
from __future__ import annotations

import calendar
import datetime as dt
import hashlib
import io
import json
import math
import re
import subprocess
import time
import unicodedata
from zoneinfo import ZoneInfo

import openpyxl
from bs4 import BeautifulSoup

UA = 'FinSuccessDashboard/2.0 (public data research)'


def fetch(url, attempts=3, timeout=40, headers=()):
    """curl (OS trust store, TLS verified) with retries: www.evn.com.vn times out from some US nodes."""
    error = ''
    for attempt in range(attempts):
        args = ['curl', '--fail', '--location', '--silent', '--show-error', '--max-time', str(timeout),
                '--user-agent', UA]
        for header in headers:
            args += ['--header', header]
        result = subprocess.run(args + [url], capture_output=True)
        if not result.returncode:
            if len(result.stdout) > 30_000_000:
                raise ValueError('Response exceeds 30 MB')
            return result.stdout
        error = result.stderr.decode(errors='replace')[:250]
        if attempt + 1 < attempts:
            time.sleep(3 * (attempt + 1))
    raise RuntimeError(f'{url}: {error}')


def finalize(records, fields, nullable=(), today=None):
    """Sorted, unique, not-future dates; numeric finite fields (null only where allowed)."""
    today = today or dt.date.today()
    out = {}
    for r in records:
        date = dt.date.fromisoformat(r['date'])
        if date > today:
            raise ValueError(f'Future observation {date}')
        if r['date'] in out:
            raise ValueError(f'Duplicate observation date {date}')
        for f in fields:
            v = r.get(f)
            if v is None and f in nullable:
                continue
            if not isinstance(v, (int, float)) or isinstance(v, bool) or not math.isfinite(v):
                raise ValueError(f'Invalid {f} on {date}')
        out[r['date']] = r
    if not out:
        raise ValueError('Empty series')
    return [out[k] for k in sorted(out)]


def month_end(year, month):
    return dt.date(year, month, calendar.monthrange(year, month)[1]).isoformat()


# ---------------------------------------------------------------- EVN daily system operation
EVN = 'https://www.evn.com.vn'
EVN_LIST = EVN + '/vi-VN/news-l/Thong-tin-tom-tat-van-hanh-HTD-Quoc-gia-60-2015'
# Vietnamese numbers: '49819,6', '36 823,6', '58.100'; a few 2023 articles use a decimal point ('43054.6MW').
NUM = r'(?:\d+\.\d{1,2}(?!\d)|(?:\d{1,3}(?:[ .]\d{3})+|\d+)(?:,\d+)?)'
# Only the standard daily post; special reports in the same list (e.g. "Thông tin vận hành hệ thống điện ngày
# 13/5/2026: ...") use other categories/bases and are ignored. '06/102023' (sic) is a real title.
TITLE_RE = re.compile(r'^thông tin chung về vận hành hệ thống điện quốc gia ngày (\d{1,2})/(\d{1,2})/?(\d{4})$', re.I)
LINK_RE = re.compile(r'^/d/vi-VN/news/[^?#"]+-60-2015-(\d+)$')
# Energy mix lines exactly as EVN labels them (normalised to lower case).
MIX = [('hydro', r'thủy điện'), ('coal', r'nhiệt điện than'), ('gas', r'tua ?bin khí(?: \(gas \+ dầu do\))?'),
       ('oil', r'nhiệt điện dầu'), ('wind', r'điện gió'), ('solar', r'điện mặt trời'),
       ('solar_farm', r'đmt trang trại'), ('rooftop_solar', r'đmt mái nhà \(ước tính thương phẩm\)'),
       ('rooftop_solar_terminal', r'đmt mái nhà \(ước tính đầu cực\)'), ('imports', r'nhập khẩu điện'),
       ('other', r'loại khác|khác \(sinh khối, diesel[^)]*\)')]
MIX_FIELDS = [k for k, _ in MIX]
FIELDS = ['output_mkwh', 'output_terminal_mkwh', 'pmax_mw', 'pmax_terminal_mw', *MIX_FIELDS, 'midday_mw', 'evening_mw']
# Mix sum vs published total, triệu kWh: max(1.0, 0.2% of total). Ten components rounded to 0.1 explain
# up to 0.5; EVN's own totals drift up to ~1.6 (Aug-Sep 2026, 0.15%). Typos (missing digit, wrong day) exceed it.
SUM_TOLERANCE = (1.0, 0.002)


def tolerance(total):
    return max(SUM_TOLERANCE[0], SUM_TOLERANCE[1] * total)


EVN_DEFINITIONS = {
    'output_mkwh': 'Sản lượng điện sản xuất và nhập khẩu, tính với ĐMT mái nhà ước tính thương phẩm (bài đến 02/06/2024 ghi "Sản lượng tiêu thụ trong ngày", không nêu cơ sở mái nhà)',
    'output_terminal_mkwh': 'Như trên, tính với ĐMT mái nhà ước tính đầu cực',
    'pmax_mw': 'Công suất lớn nhất trong ngày (cơ sở thương phẩm; bài đến 03/06/2024 không ghi cơ sở); pmax_time = giờ đạt',
    'pmax_terminal_mw': 'Công suất lớn nhất trong ngày, cơ sở đầu cực',
    'hydro': 'Thủy điện', 'coal': 'Nhiệt điện than', 'gas': 'Tuabin khí (Gas + Dầu DO)', 'oil': 'Nhiệt điện dầu',
    'wind': 'Điện gió', 'solar': 'Điện mặt trời, một số chung đến 03/06/2024 (bài 05/2023 ghi "đã bao gồm cả ước ĐMTMN")',
    'solar_farm': 'ĐMT trang trại', 'rooftop_solar': 'ĐMT mái nhà (ước tính thương phẩm)',
    'rooftop_solar_terminal': 'ĐMT mái nhà (ước tính đầu cực)', 'imports': 'Nhập khẩu điện',
    'other': 'Khác (Sinh khối, Diesel Nam, …) / Loại khác',
    'midday_mw': 'Công suất huy động toàn quốc khi phụ tải vào thấp điểm trưa (cơ sở thương phẩm)',
    'evening_mw': 'Công suất huy động toàn quốc khi phụ tải vào cao điểm (chiều-)tối (cơ sở thương phẩm)'}


def number(text):
    if not re.fullmatch(NUM, text):
        raise ValueError(f'Unreadable number {text!r}')
    if re.fullmatch(r'\d+\.\d{1,2}', text):
        return float(text)
    return float(text.replace(' ', '').replace('.', '').replace(',', '.'))


def clean(text):
    text = unicodedata.normalize('NFC', text).replace('\u00a0', ' ').replace('thuỷ', 'thủy').replace('...', '…')
    return re.sub(r'\s+', ' ', text).strip(' -–+*:\t')


def parse_evn_list(html):
    soup = BeautifulSoup(html, 'html.parser')
    items = {}
    for a in soup.find_all('a', href=True):
        m = LINK_RE.match(a['href'])
        title = TITLE_RE.search(clean(a.get_text(' ')))
        if not m or not title:
            continue
        date = dt.date(int(title[3]), int(title[2]), int(title[1])).isoformat()
        items.setdefault(m[1], {'id': m[1], 'date': date, 'url': EVN + a['href']})
    return list(items.values())


def article_lines(content):
    # One logical line per paragraph/<br>/table row; table cells separated by tabs (cells may wrap <p>).
    # Source-code newlines between tags carry no meaning: flatten them before inserting markers.
    for text in list(content.find_all(string=True)):
        text.replace_with(re.sub(r'[\r\n\t]+', ' ', str(text)))
    for br in content.find_all('br'):
        br.replace_with(' ' if br.find_parent(['td', 'th']) else '\n')
    for block in content.find_all(['p', 'div', 'li', 'h2', 'h3', 'h4']):
        block.append(' ' if block.find_parent(['td', 'th']) else '\n')
    for cell in content.find_all(['td', 'th']):
        cell.append('\t')
    for block in content.find_all(['tr', 'table']):
        block.append('\n')
    lines = []
    for line in content.get_text().split('\n'):
        cells = [clean(c) for c in line.split('\t')]
        cells = [c for c in cells if c] if '\t' in line else [clean(line)]
        if any(cells):
            lines.append(cells)
    return lines


def parse_evn_article(html, expected_date=None):
    """One EVN daily article -> record. Raises ValueError on any ambiguity."""
    soup = BeautifulSoup(html, 'html.parser')
    title = TITLE_RE.search(clean(soup.title.get_text(' ') if soup.title else ''))
    if not title:
        raise ValueError('EVN article title/date missing')
    date = dt.date(int(title[3]), int(title[2]), int(title[1])).isoformat()
    if expected_date and date != expected_date:
        raise ValueError(f'Title date {date} != list date {expected_date}')
    content = soup.find('div', class_='chitiettinbai')
    if content is None:
        raise ValueError('EVN article body missing')
    rec = {'date': date, **{f: None for f in FIELDS}, 'pmax_time': None}
    basis, section, header_ok = 'commercial', 'head', False
    for cells in article_lines(content):
        text = ' '.join(cells)
        low = text.lower()
        if section == 'head' and low.startswith('tính với số liệu đmt mái nhà'):
            basis = 'terminal' if 'đầu cực' in low else 'commercial' if 'thương phẩm' in low else None
            if basis is None:
                raise ValueError('Unknown rooftop-solar basis')
            continue
        if section == 'head' and low.startswith('thông số vận hành ngày'):
            day = re.fullmatch(r'thông số vận hành ngày (\d{1,2})/(\d{1,2})/(\d{4})', low)
            if not day or dt.date(int(day[3]), int(day[2]), int(day[1])).isoformat() != date:
                raise ValueError('Heading date differs from title date')
            continue
        if low.startswith('cơ cấu sản lượng'):
            section = 'mix'
            continue
        if 'công suất huy động' in low:  # heading may share a table row with 'Mục' (2023)
            section = 'mw'
            day = re.search(r'ngày (\d{1,2})/(\d{1,2})/(\d{4})', low)
            if day and dt.date(int(day[3]), int(day[2]), int(day[1])).isoformat() != date:
                raise ValueError('MW table date differs from title date')
            continue
        if low.startswith('thông tin công bố tại website'):
            break
        if section == 'head':
            m = re.fullmatch(rf'công suất lớn nhất trong ngày ?: ?({NUM}) ?mw ?\(lúc (\d{{1,2}})(?:[h:](\d{{2}})?)?h?\)', low)
            if m:
                key = 'pmax_mw' if basis == 'commercial' else 'pmax_terminal_mw'
                if rec[key] is not None:
                    raise ValueError('Duplicate Pmax line')
                rec[key] = number(m[1])
                if basis == 'commercial':
                    rec['pmax_time'] = f'{int(m[2]):02d}:{m[3] or "00"}'
                continue
            m = re.fullmatch(rf'sản lượng (?:điện sản xuất và nhập khẩu|tiêu thụ trong ngày) ?: ?({NUM}) ?triệu kwh', low)
            if m:
                key = 'output_mkwh' if basis == 'commercial' else 'output_terminal_mkwh'
                if rec[key] is not None:
                    raise ValueError('Duplicate output line')
                rec[key] = number(m[1])
                continue
            raise ValueError(f'Unexpected EVN header line: {text[:80]}')
        if section == 'mix':
            # Unit typos/truncations seen: 'riệu kWh', 'triệu kW', 'triệu k', '65,4: triệu kWh', none.
            # The mix-sum check below guards every value read this way.
            body = re.sub(r'[\s:]*(?:t?riệu k(?:wh?)?)?$', '', low)
            value = re.search(rf'({NUM})$', body)  # leftmost match = whole number; may touch the label ('điện15,7')
            label = (body[:value.start(1)] if value else body).strip(' :')
            key = next((k for k, pattern in MIX if re.fullmatch(pattern, label)), None)
            if key is None:
                raise ValueError(f'Unknown EVN source category: {label[:60]}')
            if rec[key] is not None:
                raise ValueError(f'Duplicate EVN category {key}')
            rec[key] = number(value[1]) if value else None
        elif section == 'mw':
            if 'thấp điểm' in low:
                if not (len(cells) >= 2 and 'thấp điểm' in cells[-2].lower() and 'cao điểm' in cells[-1].lower()):
                    raise ValueError('Unexpected MW table column order')
                header_ok = True
            elif cells[0].lower() in ('toàn quốc', 'quốc gia', 'quốc gia + đmt mái nhà (ước tính thương phẩm)'):
                if not header_ok or len(cells) != 3:
                    raise ValueError('Unreadable MW total row')
                rec['midday_mw'], rec['evening_mw'] = number(cells[1]), number(cells[2])
    validate_evn(rec)
    return rec


def validate_evn(rec):
    total = rec['output_mkwh']
    if total is None:
        raise ValueError('EVN total output missing')
    if not 300 <= total <= 2500:
        raise ValueError('EVN total outside plausible range')
    pmax = rec['pmax_mw']  # a few 2023 articles omit Pmax: it stays null
    if pmax is not None and (not 15000 <= pmax <= 120000 or total * 1000 / 24 > pmax * 1.001):
        raise ValueError('EVN Pmax implausible or below average load')
    for key in MIX_FIELDS:
        if rec[key] is not None and not 0 <= rec[key] <= total:
            raise ValueError(f'EVN {key} outside 0..total')
    split = rec['solar_farm'] is not None or rec['rooftop_solar'] is not None
    if split == (rec['solar'] is not None):
        raise ValueError('EVN solar layout is neither combined nor split')
    common = ['hydro', 'coal', 'gas', 'oil', 'wind', 'imports', 'other']
    solar = ['solar_farm', 'rooftop_solar'] if split else ['solar']
    gap = sum(rec[k] or 0 for k in common + solar) - total
    if abs(gap) > tolerance(total):
        raise ValueError(f'EVN mix sum differs from total by {gap:.1f} million kWh')
    if rec['output_terminal_mkwh'] is not None:
        if rec['rooftop_solar_terminal'] is None:
            raise ValueError('EVN terminal-basis rooftop solar missing')
        gap = sum(rec[k] or 0 for k in common + ['solar_farm', 'rooftop_solar_terminal']) - rec['output_terminal_mkwh']
        if abs(gap) > tolerance(rec['output_terminal_mkwh']):
            raise ValueError(f'EVN terminal-basis mix sum differs by {gap:.1f} million kWh')
    for key in ('midday_mw', 'evening_mw'):
        if pmax is not None and rec[key] is not None and not 0.3 * pmax <= rec[key] <= pmax * 1.02:
            raise ValueError(f'EVN {key} inconsistent with Pmax')


def load_vn_power_daily(old=None, today=None, fetcher=fetch, delay=0.3, max_pages=130):
    """First run walks the whole list archive; later runs read list pages until they reach dates already
    held (normally 1-2 pages) and fetch only articles not yet parsed. Old records are merged back."""
    old = old or {}
    today = today or dt.datetime.now(ZoneInfo('Asia/Ho_Chi_Minh')).date()
    known = {r['date']: r for r in old.get('records') or []}
    latest_known = max(known, default=None)
    excluded = {e['date']: e for e in old.get('excluded') or []}
    articles, raw_parts = {}, []
    min_pages = 2
    for page in range(1, max_pages + 1):
        html = fetcher(EVN_LIST + (f'?page={page}' if page > 1 else ''))
        items = parse_evn_list(html.decode('utf-8', 'replace'))
        if not items:
            if page == 1:
                raise ValueError('EVN list page has no daily articles')
            break
        # Past the last page EVN keeps serving a page whose only match is the newest bulletin (sidebar link).
        if page > 1 and all(item['id'] in articles for item in items):
            break
        for item in items:
            articles.setdefault(item['id'], item)
        oldest = min(i['date'] for i in items)
        if latest_known and page >= min_pages and oldest <= latest_known:
            break
        time.sleep(delay)
    else:
        if not latest_known:
            raise ValueError('EVN archive longer than page cap')
    by_date = {}
    for item in articles.values():
        by_date.setdefault(item['date'], []).append(item)
    fresh, failures, published = {}, {}, None
    for date in sorted(by_date, reverse=True):
        if date in known or date > today.isoformat():
            continue
        parsed = []
        for item in by_date[date]:
            try:
                page = fetcher(item['url'])
                soup = BeautifulSoup(page.decode('utf-8', 'replace'), 'html.parser')
                body = soup.find('div', class_='chitiettinbai')
                raw_parts.append(json.dumps({'url': item['url'], 'title': soup.title.get_text(' ', strip=True) if soup.title else None,
                                             'body': str(body) if body else None}, ensure_ascii=False))
                rec = parse_evn_article(page.decode('utf-8', 'replace'), date)
                stamp = soup.find(string=re.compile(r'\d{2}/\d{2}/\d{4} - \d{2}:\d{2} \(GMT\+7\)'))
                if stamp and published is None:
                    published = clean(stamp)
                parsed.append(rec)
            except (ValueError, RuntimeError) as exc:
                failures[date] = {'date': date, 'url': item['url'], 'reason': str(exc)[:160]}
            time.sleep(delay)
        if date in failures:
            continue  # one article for this date is unreadable: the date stays out, never half-trusted
        if all(p == parsed[0] for p in parsed):
            fresh[date] = parsed[0]
            excluded.pop(date, None)
        else:
            failures[date] = {'date': date, 'url': by_date[date][0]['url'],
                              'reason': f'{len(parsed)} articles carry this date with different figures'}
    # EVN has re-posted the next day's figures under the previous day's title (e.g. 15/03/2026 = 16/03/2026).
    # Identical figures on two dates cannot both be right and the title does not tell which: drop every such date.
    groups = {}
    for rec in [*known.values(), *fresh.values()]:
        groups.setdefault(tuple(rec.get(f) for f in FIELDS + ['pmax_time']), []).append(rec['date'])
    for dates in groups.values():
        if len(dates) > 1:
            for date in dates:
                if date in fresh or date in known:
                    fresh.pop(date, None)
                    known.pop(date, None)
                    failures[date] = {'date': date, 'url': by_date.get(date, [{'url': None}])[0]['url'],
                                      'reason': 'figures identical to ' + ', '.join(d for d in dates if d != date)}
    if failures and not fresh:
        raise ValueError(f'No new EVN article parsed; {len(failures)} failed, e.g. {next(iter(failures.values()))["reason"]}')
    excluded.update(failures)
    records = finalize([*known.values(), *fresh.values()], FIELDS, nullable=FIELDS, today=today)
    if not latest_known and len(records) < 300:
        raise ValueError('EVN backfill unexpectedly short')
    raw = '\n'.join(raw_parts).encode()
    source = {'source_url': EVN_LIST, 'source_name': 'EVN / NSMO (Thông tin vận hành HTĐ Quốc gia)',
              'observation_frequency': 'daily', 'publication_frequency': 'daily, next day ~10:20-11:00 ICT',
              'unit': 'million kWh (triệu kWh); Pmax/midday/evening in MW', 'records': records,
              'definitions': EVN_DEFINITIONS,
              'excluded': sorted((e for d, e in excluded.items() if d not in {r['date'] for r in records}), key=lambda e: e['date']),
              'method': f'Parsed from each EVN article as published; fields absent in an article stay null. '
                        f'Validation: title/table date, mix sum vs total within max({SUM_TOLERANCE[0]} million kWh, {SUM_TOLERANCE[1]:.1%}) on both rooftop bases, '
                        f'figures identical to another date rejected, '
                        f'average load <= Pmax, plausible ranges. Failed articles are listed in excluded, never filled.',
              'raw_sha256': hashlib.sha256(raw).hexdigest()}
    if published:
        source['latest_article_published'] = published
    return source, raw


# ---------------------------------------------------------------- World Bank Pink Sheet energy
WB_PAGE = 'https://www.worldbank.org/en/research/commodity-markets'
WB_ENERGY = {'coal_au': ('Coal, Australian', '($/mt)'), 'coal_za': ('Coal, South African **', '($/mt)'),
             'lng_japan': ('Liquefied natural gas, Japan', '($/mmbtu)'),
             'gas_europe': ('Natural gas, Europe', '($/mmbtu)'), 'gas_us': ('Natural gas, US', '($/mmbtu)')}


def discover_wb_monthly_url(fetcher=fetch):
    """The thedocs document id changes when the World Bank re-issues the file; read it from the landing page."""
    html = fetcher(WB_PAGE).decode('utf-8', 'replace')
    found = sorted(set(re.findall(r'https://thedocs\.worldbank\.org/en/doc/[0-9a-f]{32}-\d+/related/CMO-Historical-Data-Monthly\.xlsx', html)))
    if len(found) != 1:
        raise ValueError(f'World Bank monthly workbook link not unique ({len(found)})')
    return found[0]


def parse_wb_energy(raw):
    book = openpyxl.load_workbook(io.BytesIO(raw), read_only=True, data_only=True)
    data = list(book['Monthly Prices'].values)
    head = next((i for i, r in enumerate(data) if 'Coal, Australian' in r), None)
    if head is None:
        raise ValueError('World Bank energy header missing')
    cols = {}
    for key, (name, unit) in WB_ENERGY.items():
        if name not in data[head]:
            raise ValueError(f'World Bank column missing: {name}')
        cols[key] = data[head].index(name)
        if data[head + 1][cols[key]] != unit:
            raise ValueError(f'World Bank unit mismatch for {name}')
    updated = next((str(r[0]) for r in data[:head] if r and isinstance(r[0], str) and r[0].startswith('Updated on')), None)
    records = []
    for row in data[head + 2:]:
        if not isinstance(row[0], str) or not re.fullmatch(r'\d{4}M\d{2}', row[0]):
            continue
        year, month = map(int, row[0].split('M'))
        if year < 2010:
            continue
        rec = {'date': month_end(year, month)}
        for key, col in cols.items():
            v = row[col]
            if v in (None, '', '…', '..'):
                rec[key] = None  # not yet published for this month: keep null, never carry forward
            elif not isinstance(v, (int, float)) or not 0 < v < 2000:
                raise ValueError(f'Invalid World Bank {key} in {row[0]}')
            else:
                rec[key] = float(v)
        if any(rec[k] is not None for k in cols):
            records.append(rec)
    records = finalize(records, list(cols), nullable=list(cols))
    if len(records) < 150:
        raise ValueError('World Bank energy history unexpectedly short')
    return updated, records


def load_wb_energy(url, raw):
    updated, records = parse_wb_energy(raw)
    return {'source_url': url, 'source_name': 'World Bank Pink Sheet', 'observation_frequency': 'monthly (average)',
            'publication_frequency': 'monthly, early in the following month', 'issue': updated,
            'unit': 'coal USD/tonne; gas and LNG USD/MMBtu',
            'units': {'coal_au': '$/mt', 'coal_za': '$/mt', 'lng_japan': '$/mmbtu', 'gas_europe': '$/mmbtu', 'gas_us': '$/mmbtu'},
            'records': records, 'raw_sha256': hashlib.sha256(raw).hexdigest(),
            'method': 'Monthly Prices sheet: ' + '; '.join(f'{k} = {n}' for k, (n, _) in WB_ENERGY.items())}, raw


# ---------------------------------------------------------------- NOAA CPC ENSO
ONI_URL = 'https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt'
NINO_URL = 'https://www.cpc.ncep.noaa.gov/data/indices/wksst9120.for'
SEASONS = ['DJF', 'JFM', 'FMA', 'MAM', 'AMJ', 'MJJ', 'JJA', 'JAS', 'ASO', 'SON', 'OND', 'NDJ']


def parse_oni(text, start=1990):
    lines = text.strip().splitlines()
    if lines[0].split() != ['SEAS', 'YR', 'TOTAL', 'ANOM']:
        raise ValueError('ONI header mismatch')
    records = []
    for line in lines[1:]:
        parts = line.split()
        if len(parts) != 4 or parts[0] not in SEASONS:
            raise ValueError(f'Unexpected ONI line: {line[:40]}')
        year, total, anom = int(parts[1]), float(parts[2]), float(parts[3])
        if not 20 <= total <= 32 or not -4 <= anom <= 5:
            raise ValueError('ONI value outside plausible range')
        if year < start:
            continue
        # CPC labels DJF..NDJ with the year of January..December; the centre month is the season index + 1.
        records.append({'date': month_end(year, SEASONS.index(parts[0]) + 1), 'season': parts[0],
                        'year': year, 'oni': anom, 'sst': total})
    records = finalize(records, ['oni', 'sst'])
    for a, b in zip(records, records[1:]):
        if (dt.date.fromisoformat(b['date']) - dt.date.fromisoformat(a['date'])).days > 31:
            raise ValueError('ONI season missing')
    return records


def parse_nino34_weekly(text, start=2010):
    lines = text.splitlines()
    head = next((i for i, l in enumerate(lines) if 'Nino34' in l), None)
    if head is None or lines[head].index('Nino34') not in range(36, 50) or 'SSTA' not in lines[head + 1]:
        raise ValueError('Weekly Nino3.4 header/column layout changed')
    records = []
    for line in lines[head + 2:]:
        if not line.strip():
            continue
        if len(line) < 62:
            raise ValueError(f'Short weekly SST line: {line!r}')
        # Fortran (1x,a9,4(5x,f4.1,f4.1)); group 3 = Nino3.4 at columns 41-48, SSTA may touch the SST field.
        week, sst, ssta = line[1:10], line[41:45], line[45:49]
        date = dt.datetime.strptime(week, '%d%b%Y').date()
        sst, ssta = float(sst), float(ssta)
        if not 20 <= sst <= 32 or not -5 <= ssta <= 6 or line[36:41].strip():
            raise ValueError(f'Weekly Nino3.4 value/layout implausible on {week}')
        if date.year >= start:
            records.append({'date': date.isoformat(), 'sst': sst, 'ssta': ssta})
    records = finalize(records, ['sst', 'ssta'])
    for a, b in zip(records, records[1:]):
        if (dt.date.fromisoformat(b['date']) - dt.date.fromisoformat(a['date'])).days != 7:
            raise ValueError('Weekly Nino3.4 week missing or irregular')
    return records


def load_enso_oni(fetcher=fetch):
    raw = fetcher(ONI_URL)
    records = parse_oni(raw.decode('ascii'))
    return {'source_url': ONI_URL, 'source_name': 'NOAA CPC Oceanic Niño Index (ERSSTv5)',
            'observation_frequency': '3-month running season', 'publication_frequency': 'monthly (recent seasons revised)',
            'unit': '°C anomaly (oni); °C SST (sst)', 'records': records, 'raw_sha256': hashlib.sha256(raw).hexdigest(),
            'method': 'oni.ascii.txt ANOM column; date = end of the season centre month (DJF -> Jan); '
                      'El Niño/La Niña episodes need >= +/-0.5 for 5 consecutive overlapping seasons'}, raw


def load_nino34_weekly(fetcher=fetch):
    raw = fetcher(NINO_URL)
    records = parse_nino34_weekly(raw.decode('ascii'))
    return {'source_url': NINO_URL, 'source_name': 'NOAA CPC weekly OISST Niño 3.4',
            'observation_frequency': 'weekly (week centred on Wednesday)', 'publication_frequency': 'weekly, Monday US',
            'unit': '°C anomaly vs 1991-2020 (ssta); °C (sst)', 'records': records,
            'raw_sha256': hashlib.sha256(raw).hexdigest(),
            'method': 'wksst9120.for fixed-width Nino34 SST/SSTA; weekly OISST, not the official ONI'}, raw


# ---------------------------------------------------------------- ICE coal / JKM (undocumented public chart API)
ICE = 'https://www.ice.com/marketdata/api/productguide/charting/'
ICE_HEADERS = ('Accept: application/json',)
ICE_PRODUCTS = {
    'coal_newcastle': {'product': 1459, 'hub': 1296, 'name': 'ICE Newcastle Coal Futures', 'unit': 'USD/tonne',
                       'page': 'https://www.ice.com/products/243/Newcastle-Coal-Futures', 'range': (20, 1000)},
    'lng_jkm': {'product': 4172, 'hub': 7903, 'name': 'ICE JKM LNG (Platts) Futures', 'unit': 'USD/MMBtu',
                'page': 'https://www.ice.com/products/6753280/LNG-Japan-Korea-Marker-PLATTS-Future', 'range': (1, 100)}}


def parse_ice_contracts(data):
    if not isinstance(data, list) or not data:
        raise ValueError('ICE contract list empty')
    out = []
    for c in data:
        strip = c.get('marketStrip')
        if not isinstance(strip, str) or not isinstance(c.get('marketId'), int):
            raise ValueError('ICE contract list schema changed')
        if re.fullmatch(r'[A-Z][a-z]{2}\d{2}', strip):  # single months only; quarters/calendars are strips
            out.append({'market_id': c['marketId'], 'strip': strip, 'end': c.get('endDate') or 0})
    if not out:
        raise ValueError('No single-month ICE contracts listed')
    return sorted(out, key=lambda c: (c['end'], dt.datetime.strptime(c['strip'], '%b%y')))


def parse_ice_history(data, market_id, today, low, high):
    if not isinstance(data, dict) or data.get('marketId') != market_id or not isinstance(data.get('bars'), list):
        raise ValueError('ICE history identity/schema mismatch')
    records = []
    for stamp, value in data['bars']:
        moment = dt.datetime.strptime(stamp, '%a %b %d %H:%M:%S %Y')
        if moment.time() != dt.time(0):
            raise ValueError('ICE bar is not a daily bar')
        if moment.date() >= today:
            continue  # session not complete in London
        if not isinstance(value, (int, float)) or not low <= value <= high:
            raise ValueError(f'ICE price outside plausible range: {value}')
        records.append({'date': moment.date().isoformat(), 'value': round(float(value), 4)})
    return finalize(records, ['value'], today=today)


def load_ice_front(key, fetcher=fetch, today=None, min_sessions=100):
    """Nearest listed single-month contract with >= min_sessions completed sessions. One contract only:
    when it expires the whole series moves to the next contract, nothing is spliced."""
    spec = ICE_PRODUCTS[key]
    today = today or dt.datetime.now(ZoneInfo('Europe/London')).date()
    url = f'{ICE}contract-data?productId={spec["product"]}&hubId={spec["hub"]}'
    listing = fetcher(url, headers=ICE_HEADERS)
    reasons = []
    for contract in parse_ice_contracts(json.loads(listing))[:3]:
        hist_url = f'{ICE}data/historical?marketId={contract["market_id"]}&historicalSpan=3'
        raw = fetcher(hist_url, headers=ICE_HEADERS)
        try:
            records = parse_ice_history(json.loads(raw), contract['market_id'], today, *spec['range'])
        except ValueError as exc:
            reasons.append(f'{contract["strip"]}: {exc}')
            continue
        if len(records) < min_sessions or (today - dt.date.fromisoformat(records[-1]['date'])).days > 10:
            reasons.append(f'{contract["strip"]}: {len(records)} sessions, last {records[-1]["date"]}')
            continue
        return {'source_url': spec['page'], 'source_name': 'ICE (public chart data, unofficial)',
                'symbol': f'{spec["name"]} {contract["strip"]}', 'market_id': contract['market_id'],
                'instrument': f'single contract {contract["strip"]} (nearest listed month with full history); not a continuous series',
                'observation_frequency': 'daily trading session', 'publication_frequency': 'daily (delayed)',
                'unit': spec['unit'], 'records': records, 'quote_type': 'ICE chart daily value (settlement not guaranteed)',
                'raw_sha256': hashlib.sha256(listing + raw).hexdigest(), 'data_url': hist_url}, listing + raw
    raise ValueError('No ICE contract with complete recent history: ' + '; '.join(reasons))


def parse_yahoo_jkm(result, today):
    meta = result['meta']
    if meta.get('symbol') != 'JKM=F' or meta.get('instrumentType') not in ('FUTURE', 'ALTSYMBOL') or meta.get('currency') not in ('USD', None):
        raise ValueError('Yahoo JKM identity mismatch')
    zone = ZoneInfo(meta.get('exchangeTimezoneName') or 'America/New_York')
    records = []
    for stamp, value in zip(result.get('timestamp') or [], result['indicators']['quote'][0]['close']):
        date = dt.datetime.fromtimestamp(stamp, zone).date()
        if value is None or date >= today:
            continue
        if not 1 <= value <= 100:
            raise ValueError('Yahoo JKM price outside plausible range')
        records.append({'date': date.isoformat(), 'value': round(value, 4)})
    records = finalize(records, ['value'], today=today)
    if len(records) < 100 or (today - dt.date.fromisoformat(records[-1]['date'])).days > 10:
        raise ValueError('Yahoo JKM history incomplete or stale')
    return records


def load_lng_jkm(fetcher=fetch, today=None):
    try:
        return load_ice_front('lng_jkm', fetcher, today)
    except (ValueError, RuntimeError, KeyError, json.JSONDecodeError) as exc:
        reason = str(exc)[:120]
    url = 'https://query1.finance.yahoo.com/v8/finance/chart/JKM%3DF?interval=1d&range=2y'
    raw = fetcher(url)
    result = json.loads(raw)['chart']['result'][0]
    records = parse_yahoo_jkm(result, today or dt.datetime.now(ZoneInfo('America/New_York')).date())
    return {'source_url': 'https://finance.yahoo.com/quote/JKM%3DF/', 'source_name': 'Yahoo Finance (unofficial)',
            'symbol': 'JKM=F', 'instrument': f'Yahoo continuous JKM=F (NYMEX), fallback because ICE failed: {reason}',
            'observation_frequency': 'daily trading session', 'publication_frequency': 'daily (delayed)',
            'unit': 'USD/MMBtu', 'records': records, 'raw_sha256': hashlib.sha256(raw).hexdigest()}, raw
