import datetime as dt
import io
import json
import sys
import unittest
from pathlib import Path
from unittest import mock

from openpyxl import Workbook

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import power_feeds as pf  # noqa: E402
import polling_policy as pp  # noqa: E402
import update_daily as ud  # noqa: E402

# EVN 05/10/2026 as published (two rooftop-solar bases), trimmed to the parsed parts.
NEW = dict(pmax=('49819,6', '49848,1'), total=('981,3', '993,1'), time='18:10',
           mix=[('Thủy điện', '246,8'), ('Nhiệt điện than', '494,1'), ('Tuabin khí (Gas + Dầu DO)', '69,6'),
                ('Nhiệt điện dầu', '0'), ('Điện gió', '27,3'), ('ĐMT trang trại', '49,6'),
                ('ĐMT mái nhà (ước tính thương phẩm)', '40,4'), ('ĐMT mái nhà (ước tính đầu cực)', '52,2'),
                ('Nhập khẩu điện', '50,3'), ('Khác (Sinh khối, Diesel Nam, …)', '3,3')],
           mw=('41928,8', '43341,4'))


def new_article(day, d=NEW, table_day=None):
    mix = ''.join(f'<p>- {k} {v} triệu kWh</p>' for k, v in d['mix'])
    head = ''.join(f'<p>Tính với số liệu ĐMT mái nhà (ước tính {b}):<br/>\n - Công suất lớn nhất trong ngày: {p} MW (Lúc {d["time"]})<br/>'
                   f'\n - Sản lượng điện sản xuất và nhập khẩu: {t} triệu kWh</p>'
                   for b, p, t in zip(('thương phẩm', 'đầu cực'), d['pmax'], d['total']))
    table = (f'<p><strong>CÔNG SUẤT HUY ĐỘNG NGÀY {table_day or day}</strong></p><table><thead><tr><th>Mục</th>'
             '<th>Khi phụ tải vào thấp điểm trưa</th><th>Khi phụ tải vào cao điểm tối</th></tr></thead><tbody>\n<tr>\n'
             f'<td><p>Quốc gia + ĐMT mái nhà (ước tính thương phẩm)</p></td>\n<td>{d["mw"][0]}</td>\n<td>{d["mw"][1]}</td></tr>'
             '<tr><td>Thủy điện</td><td>7037,7</td><td>12065,4</td></tr></tbody></table>')
    return (f'<html><head><title>\n\tThông tin chung về vận hành hệ thống điện Quốc gia ngày {day}\n</title></head><body>'
            f'<p><i></i> 06/10/2026 - 11:00 (GMT+7)</p><div class="py-5 chitiettinbai">{head}'
            f'<p>Cơ cấu sản lượng huy động nguồn điện trong ngày:</p>{mix}{table}'
            '<p>Thông tin công bố tại website của Trung tâm Điều độ Hệ thống điện Quốc gia: </p>'
            '<div><span>Trung tâm Điều độ</span></div></div></body></html>')


# EVN 10/6/2023: older layout, table cells, space thousands, blank oil, combined solar, "lúc 15h".
OLD = """<html><head><title>Thông tin chung về vận hành hệ thống điện Quốc gia ngày 10/6/2023</title></head><body>
<div class="py-5 chitiettinbai"><p>Công suất lớn nhất trong ngày: 36 823,6 MW (lúc 15h)</p>
<p>Sản lượng tiêu thụ trong ngày: 788,3 triệu kWh</p><p>Cơ cấu sản lượng huy động nguồn điện trong ngày:</p>
<table><tbody>
<tr><td>- Thủy điện</td><td>140</td><td>triệu kWh</td></tr><tr><td>- Nhiệt điện than</td><td>439,3</td><td>triệu kWh</td></tr>
<tr><td>- Tuabin khí (Gas + dầu DO)</td><td>85,9</td><td>triệu kWh</td></tr><tr><td>- Nhiệt điện dầu</td><td>&nbsp;</td><td>triệu kWh</td></tr>
<tr><td>- Điện mặt trời</td><td>68,1</td><td>triệu kWh</td></tr><tr><td>- Điện gió</td><td>37,3</td><td>triệu kWh</td></tr>
<tr><td>- Nhập khẩu điện</td><td>15,8</td><td>triệu kWh</td></tr><tr><td>- Loại khác</td><td>1,9</td><td>triệu kWh</td></tr>
</tbody></table><p><strong>CÔNG SUẤT HUY ĐỘNG (MW)</strong></p><table border="1"><tbody>
<tr><td>&nbsp;</td><td>Khi phụ tải vào thấp điểm trưa</td><td>Khi phụ tải vào cao điểm chiều - tối</td></tr>
<tr><td>Toàn quốc</td><td>34 108</td><td>34 557</td></tr><tr><td>ĐMT trang trại</td><td>5 359</td><td>&nbsp;</td></tr>
</tbody></table><p>Thông tin công bố tại website của Trung tâm Điều độ Hệ thống điện Quốc gia: </p></div></body></html>"""


def listing(items):
    return ''.join(f'<h4><a href="/d/vi-VN/news/Thong-tin-chung-ngay-{i}-60-2015-{i}">Thông tin chung về vận hành hệ thống điện '
                   f'Quốc gia ngày {day}</a></h4>' for i, day in items) + '<a href="/d/vi-VN/news/Other-60-2025-1">Tin khác</a>'


def variant(**changes):
    d = {**NEW, 'mix': list(NEW['mix'])}
    for k, v in changes.items():
        if k in dict(NEW['mix']):
            d['mix'] = [(name, v if name == k else val) for name, val in d['mix']]
        else:
            d[k] = v
    return d


class EvnDailyTests(unittest.TestCase):
    def test_new_layout_both_rooftop_bases(self):
        r = pf.parse_evn_article(new_article('05/10/2026'), '2026-10-05')
        self.assertEqual((r['output_mkwh'], r['output_terminal_mkwh'], r['pmax_mw'], r['pmax_time']), (981.3, 993.1, 49819.6, '18:10'))
        self.assertEqual((r['hydro'], r['coal'], r['gas'], r['oil'], r['rooftop_solar'], r['rooftop_solar_terminal'], r['imports'], r['other']),
                         (246.8, 494.1, 69.6, 0.0, 40.4, 52.2, 50.3, 3.3))
        self.assertIsNone(r['solar'])
        self.assertEqual((r['midday_mw'], r['evening_mw']), (41928.8, 43341.4))

    def test_old_layout_keeps_omitted_values_null(self):
        r = pf.parse_evn_article(OLD, '2023-06-10')
        self.assertEqual((r['output_mkwh'], r['pmax_mw'], r['pmax_time'], r['solar'], r['hydro']), (788.3, 36823.6, '15:00', 68.1, 140.0))
        self.assertIsNone(r['oil'])  # blank cell in the source, not zero
        self.assertIsNone(r['output_terminal_mkwh'])
        self.assertIsNone(r['solar_farm'])
        self.assertEqual((r['midday_mw'], r['evening_mw']), (34108.0, 34557.0))

    def test_2023_typing_variants(self):
        html = (OLD.replace('Công suất lớn nhất trong ngày: 36 823,6 MW (lúc 15h)', '* Công suất lớn nhất trong ngày: 36823.6MW (lúc 14h30)')
                .replace('<td>- Nhập khẩu điện</td><td>15,8</td>', '<td>- Nhập khẩu điện15,8</td><td></td>')
                .replace('<td>1,9</td><td>triệu kWh</td>', '<td>1,9</td><td></td>'))
        r = pf.parse_evn_article(html, '2023-06-10')
        self.assertEqual((r['pmax_mw'], r['pmax_time'], r['imports'], r['other']), (36823.6, '14:30', 15.8, 1.9))
        self.assertEqual(pf.number('58.100'), 58100.0)  # thousands point, not a decimal

    def test_malformed_articles_raise(self):
        bad = [new_article('05/10/2026', variant(**{'Thủy điện': '46,8'})),       # digit lost: mix != total
               new_article('05/10/2026', table_day='06/10/2026'),                 # next day's figures under this title
               new_article('05/10/2026', variant(pmax=('39000,0', '39000,0'))),  # average load above Pmax
               new_article('05/10/2026').replace('Điện gió', 'Pin lưu trữ'),      # unknown category
               new_article('05/10/2026').replace('chitiettinbai', 'other')]       # body missing
        for html in bad:
            with self.assertRaises(ValueError):
                pf.parse_evn_article(html, '2026-10-05')
        with self.assertRaises(ValueError):
            pf.parse_evn_article(new_article('05/10/2026'), '2026-10-04')  # title date vs list date

    def test_list_parsing_handles_title_typo(self):
        special = ('<a href="/d/vi-VN/news/Thong-tin-van-hanh-60-2015-9">Thông tin vận hành hệ thống điện ngày 13/5/2026: '
                   'Nhu cầu sử dụng điện tăng cao</a>')  # narrative report with other categories: not the daily series
        items = pf.parse_evn_list(listing([(1, '05/10/2026'), (2, '06/102023')]) + special)
        self.assertEqual([i['date'] for i in items], ['2026-10-05', '2023-10-06'])

    def test_incremental_merge_excludes_bad_and_identical_days(self):
        known = [pf.parse_evn_article(new_article(day, variant(**{'Thủy điện': h, 'total': (t, t2)})), iso)
                 for day, iso, h, t, t2 in [('02/10/2026', '2026-10-02', '236,8', '971,3', '983,1'),
                                             ('03/10/2026', '2026-10-03', '226,8', '961,3', '973,1')]]
        pages = {pf.EVN_LIST: listing([(5, '05/10/2026'), (4, '04/10/2026'), (6, '01/10/2026'), (3, '03/10/2026')]),
                 pf.EVN_LIST + '?page=2': listing([(2, '02/10/2026')])}
        bodies = {5: new_article('05/10/2026'), 4: new_article('04/10/2026', variant(**{'Nhập khẩu điện': '5,3'})),
                  6: new_article('01/10/2026', variant(**{'Thủy điện': '226,8', 'total': ('961,3', '973,1')}))}

        def fake(url, **_):
            if url in pages:
                return pages[url].encode()
            return bodies[int(url.rsplit('-', 1)[1])].encode()
        with mock.patch.object(pf.time, 'sleep'):
            src, raw = pf.load_vn_power_daily({'records': known}, dt.date(2026, 10, 6), fake)
        self.assertEqual([r['date'] for r in src['records']], ['2026-10-02', '2026-10-05'])
        self.assertEqual({e['date'] for e in src['excluded']}, {'2026-10-01', '2026-10-03', '2026-10-04'})
        self.assertIn('mix sum', next(e for e in src['excluded'] if e['date'] == '2026-10-04')['reason'])
        self.assertIn('identical', next(e for e in src['excluded'] if e['date'] == '2026-10-01')['reason'])
        self.assertEqual(src['latest_article_published'], '06/10/2026 - 11:00 (GMT+7)')
        bodies[5] = bodies[4]
        with mock.patch.object(pf.time, 'sleep'), self.assertRaisesRegex(ValueError, 'No new EVN article parsed'):
            pf.load_vn_power_daily({'records': known}, dt.date(2026, 10, 6), fake)


    def test_first_run_stops_when_list_pages_run_out(self):
        # Past the end EVN still serves a page whose only daily link is the newest bulletin (sidebar).
        pages = {pf.EVN_LIST: listing([(5, '05/10/2026'), (4, '04/10/2026')]),
                 pf.EVN_LIST + '?page=2': listing([(2, '02/10/2026'), (5, '05/10/2026')])}
        days = {5: '05/10/2026', 4: '04/10/2026', 2: '02/10/2026'}
        values = {5: '246,8', 4: '236,8', 2: '226,8'}
        totals = {5: ('981,3', '993,1'), 4: ('971,3', '983,1'), 2: ('961,3', '973,1')}
        seen = []

        def fake(url, **_):
            seen.append(url)
            if url.startswith(pf.EVN_LIST):
                return pages.get(url, listing([(5, '05/10/2026')])).encode()
            n = int(url.rsplit('-', 1)[1])
            return new_article(days[n], variant(**{'Thủy điện': values[n], 'total': totals[n]})).encode()
        with mock.patch.object(pf.time, 'sleep'), self.assertRaisesRegex(ValueError, 'backfill unexpectedly short'):
            pf.load_vn_power_daily({}, dt.date(2026, 10, 6), fake)
        self.assertEqual(sum(u.startswith(pf.EVN_LIST) for u in seen), 3)  # page 3 repeats only the sidebar link: stop

def wb_book(lng_latest='…', unit='($/mmbtu)'):
    book = Workbook()
    sheet = book.active
    sheet.title = 'Monthly Prices'
    sheet.append(['World Bank Commodity Price Data (The Pink Sheet)'])
    sheet.append(['Updated on October 02, 2026'])
    names = [None, 'Crude oil, Brent', 'Coal, Australian', 'Coal, South African **', 'Natural gas, US', 'Natural gas, Europe', 'Liquefied natural gas, Japan']
    sheet.append(names)
    sheet.append([None, '($/bbl)', '($/mt)', '($/mt)', '($/mmbtu)', '($/mmbtu)', unit])
    for i in range(160):
        year, month = 2013 + i // 12, i % 12 + 1
        sheet.append([f'{year}M{month:02d}', 80.0, 100.0 + i, 90.0, 3.0, 9.0, 10.0])
    sheet.append(['2026M05', 80.0, 147.1, 98.2, 2.95, 25.42, lng_latest])
    stream = io.BytesIO()
    book.save(stream)
    return stream.getvalue()


ONI = """ SEAS  YR   TOTAL   ANOM
  OND 2015  29.10   2.45
  NDJ 2015  29.15   2.59
  DJF 2016  29.05   2.50
  JFM 2016  28.66   2.13
"""
WEEKLY = """ Weekly SST data starts week centered on 2Sept1981

                Nino1+2      Nino3        Nino34        Nino4
 Week          SST SSTA     SST SSTA     SST SSTA     SST SSTA
 06JAN2010     24.1 0.5     27.0 1.3     28.3 1.8     29.6 1.3
 13JAN2010     24.2 0.2     26.8 1.0     26.5-0.2     29.4 1.1
 20JAN2010     24.5 0.1     27.2 1.2     28.2 1.6     29.4 1.1
"""


class PeriodicPowerFeedTests(unittest.TestCase):
    def test_world_bank_energy_columns_units_and_missing_month(self):
        updated, rows = pf.parse_wb_energy(wb_book())
        self.assertEqual(updated, 'Updated on October 02, 2026')
        self.assertEqual(rows[0], {'date': '2013-01-31', 'coal_au': 100.0, 'coal_za': 90.0, 'lng_japan': 10.0, 'gas_europe': 9.0, 'gas_us': 3.0})
        self.assertEqual(rows[-1]['date'], '2026-05-31')
        self.assertIsNone(rows[-1]['lng_japan'])  # '…' at the source stays null, never carried forward
        with self.assertRaises(ValueError):
            pf.parse_wb_energy(wb_book(unit='($/mt)'))
        with self.assertRaises(ValueError):
            pf.parse_wb_energy(wb_book(lng_latest='n/a'))

    def test_oni_centre_month_and_layout(self):
        rows = pf.parse_oni(ONI, start=2015)
        self.assertEqual([(r['date'], r['season'], r['oni']) for r in rows],
                         [('2015-11-30', 'OND', 2.45), ('2015-12-31', 'NDJ', 2.59), ('2016-01-31', 'DJF', 2.5), ('2016-02-29', 'JFM', 2.13)])
        for bad in (ONI.replace('ANOM', 'ANOMALY'), ONI.replace('  DJF 2016  29.05   2.50\n', '')):
            with self.assertRaises(ValueError):
                pf.parse_oni(bad, start=2015)

    def test_weekly_nino34_fixed_width(self):
        rows = pf.parse_nino34_weekly(WEEKLY)
        self.assertEqual(rows[1], {'date': '2010-01-13', 'sst': 26.5, 'ssta': -0.2})  # SSTA touching SST field
        with self.assertRaises(ValueError):
            pf.parse_nino34_weekly(WEEKLY.replace(' 13JAN2010', '13JAN2010 '))  # shifted columns
        with self.assertRaises(ValueError):
            pf.parse_nino34_weekly(WEEKLY.replace(' 13JAN2010     24.2 0.2     26.8 1.0     26.5-0.2     29.4 1.1\n', ''))


def bars(n, start=dt.date(2026, 5, 1), price=150.0):
    days = [start + dt.timedelta(i) for i in range(n)]
    return [[d.strftime('%a %b %d 00:00:00 %Y'), price] for d in days]


class IceTests(unittest.TestCase):
    CONTRACTS = [{'marketId': 1, 'marketStrip': 'Q4 26', 'endDate': 1}, {'marketId': 2, 'marketStrip': 'Oct26', 'endDate': 2},
                 {'marketId': 3, 'marketStrip': 'Nov26', 'endDate': 3}]

    def fake(self, histories):
        def get(url, **_):
            if 'contract-data' in url:
                return json.dumps(self.CONTRACTS).encode()
            market = int(url.split('marketId=')[1].split('&')[0])
            return json.dumps({'marketId': market, 'bars': histories[market]}).encode()
        return get

    def test_single_contract_nearest_with_history(self):
        today = dt.date(2026, 10, 6)
        get = self.fake({2: bars(20, dt.date(2026, 9, 10)), 3: bars(159)})
        src, _ = pf.load_ice_front('coal_newcastle', get, today)
        self.assertEqual(src['symbol'], 'ICE Newcastle Coal Futures Nov26')
        self.assertIn('not a continuous series', src['instrument'])
        self.assertEqual(src['records'][-1]['date'], '2026-10-05')  # today's bar (in progress) dropped
        self.assertEqual(len(src['records']), 158)

    def test_ice_rejects_bad_identity_and_prices(self):
        with self.assertRaises(ValueError):
            pf.parse_ice_history({'marketId': 9, 'bars': bars(5)}, 2, dt.date(2026, 10, 6), 20, 1000)
        with self.assertRaises(ValueError):
            pf.parse_ice_history({'marketId': 2, 'bars': bars(5, price=5000.0)}, 2, dt.date(2026, 10, 6), 20, 1000)
        self.assertEqual([c['strip'] for c in pf.parse_ice_contracts(self.CONTRACTS)], ['Oct26', 'Nov26'])

    def test_jkm_falls_back_to_yahoo_continuous(self):
        stamps = [int(dt.datetime(2026, 5, 1, 15).timestamp()) + 86400 * i for i in range(150)]
        yahoo = {'chart': {'result': [{'meta': {'symbol': 'JKM=F', 'currency': None, 'instrumentType': 'ALTSYMBOL',
                                                 'exchangeTimezoneName': 'America/New_York'},
                                        'timestamp': stamps, 'indicators': {'quote': [{'close': [25.0] * 150}]}}]}}

        def get(url, **_):
            if 'ice.com' in url:
                raise RuntimeError('HTTP 403')
            return json.dumps(yahoo).encode()
        src, _ = pf.load_lng_jkm(get, dt.date(2026, 10, 1))
        self.assertEqual(src['symbol'], 'JKM=F')
        self.assertIn('fallback because ICE failed', src['instrument'])
        yahoo['chart']['result'][0]['meta']['symbol'] = 'NG=F'
        with self.assertRaises(ValueError):
            pf.load_lng_jkm(get, dt.date(2026, 10, 1))


class PowerWiringTests(unittest.TestCase):
    def test_polling_windows(self):
        def at(day, hour=7):
            return dt.datetime(2026, 10, day, hour, 30, tzinfo=pp.VN)
        checked = at(4, 0).isoformat()  # Sunday 00:30 VN
        self.assertTrue(pp.due('vn_power_daily', at(4, 15), checked))      # every day, >= 6 h apart
        self.assertFalse(pp.due('vn_power_daily', at(4, 5), checked))
        self.assertTrue(pp.due('nino34_weekly', at(6), checked))           # Tuesday
        self.assertFalse(pp.due('nino34_weekly', at(9), checked))          # Friday
        self.assertTrue(pp.due('coal_newcastle', at(10), checked))         # Saturday: Friday's London session
        self.assertFalse(pp.due('henry_hub', at(5), checked))              # Monday: EIA spot publishes Wednesday
        self.assertTrue(pp.due('wb_energy_monthly', at(8), checked))
        self.assertFalse(pp.due('enso_oni', dt.datetime(2026, 10, 15, 7, 30, tzinfo=pp.VN), checked))  # Thursday 15th

    def test_henry_hub_uses_eia_natural_gas_path(self):
        urls = []
        with mock.patch.object(ud, 'fetch', side_effect=lambda url: urls.append(url) or b'xls'), \
                mock.patch.object(ud, 'parse_eia', return_value=[{'date': '2026-09-29', 'value': 3.18}]):
            src, _ = ud.load_eia('henry_hub', ud.EIA['henry_hub'])
        self.assertEqual(urls, ['https://www.eia.gov/dnav/ng/hist_xls/RNGWHHDd.xls'])
        self.assertEqual(src['unit'], 'Dollars per Million Btu')

    def test_world_bank_download_is_shared(self):
        calls = []
        ud._WB.clear()
        with mock.patch.object(ud, 'discover_wb_monthly_url', return_value='https://example.org/CMO.xlsx'), \
                mock.patch.object(ud, 'fetch', side_effect=lambda url: calls.append(url) or b'raw'):
            self.assertEqual(ud.wb_monthly(), ('https://example.org/CMO.xlsx', b'raw'))
            self.assertEqual(ud.wb_monthly()[1], b'raw')
        self.assertEqual(calls, ['https://example.org/CMO.xlsx'])
        ud._WB.clear()


if __name__ == '__main__':
    unittest.main()
