import json
import tempfile
import unittest
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from scripts.fetch_hydro_reservoirs import parse
from scripts.update_hydro_reservoirs import build

TZ = ZoneInfo('Asia/Ho_Chi_Minh')

class HydroReservoirTests(unittest.TestCase):
    def test_timestamp_uses_prior_year_at_new_year_and_rejects_stale(self):
        html = '''<table class="tblgridtd"><tr><td>Vùng</td></tr>
        <tr><td><b>Hòa Bình</b></td><td>31/12 23:00</td><td>100</td><td>120</td><td>80</td><td>500</td><td>400</td><td>20</td><td>380</td><td>0</td><td>0</td></tr>
        <tr><td><b>Sơn La</b></td><td>31/12 18:00</td><td>100</td><td>120</td><td>80</td><td>500</td><td>400</td><td>20</td><td>380</td><td>0</td><td>0</td></tr></table>'''
        rows = parse(html, datetime(2027,1,1,0,tzinfo=TZ))
        self.assertEqual(len(rows),1)
        self.assertEqual(rows[0]['evn_time'],'2026-12-31T23:00:00+07:00')
        self.assertEqual(rows[0]['generation'],380)
    def test_seed_and_archive_merge_once_with_calendar_coverage(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d); raw=root/'raw';raw.mkdir()
            seed={'last_observation':'2026-08-27','monthly':[]}
            (root/'seed.json').write_text(json.dumps(seed))
            obs={'source_url':'EVN','requested_date':'2026-10-09','rows':[{'reservoir':'Hòa Bình','region':'Tây Bắc Bộ','evn_time':'2026-10-08T23:00:00+07:00','offset_hours':-1,'level':100,'inflow':500,'generation':300,'spill':0}]}
            (raw/'2026-10-09.json').write_text(json.dumps(obs))
            out=root/'out.js';build(root/'seed.json',raw,out);first=out.read_text();build(root/'seed.json',raw,out)
            self.assertEqual(first,out.read_text())
            entry=json.loads(first.split('=',1)[1].rstrip(';\n'))['monthly'][0]
            self.assertEqual((entry['days'],entry['expected'],entry['exact00']),(1,31,0))
            self.assertEqual(entry['inflow'],500)
    def test_blank_region_header_keeps_previous_region(self):
        row = lambda name: f'<tr><td><b>{name}</b></td><td>01/11 00:00</td><td>100</td><td>120</td><td>80</td><td>50</td><td>40</td><td>0</td><td>40</td><td>0</td><td>0</td></tr>'
        html = f'''<table class="tblgridtd"><tr><td colspan="11"><strong>Tây Nguyên</strong></td></tr>{row('Ialy')}
        <tr><td colspan="11"><strong></strong></td></tr>{row('Kanak')}</table>'''
        rows = parse(html, datetime(2026,11,1,0,tzinfo=TZ))
        self.assertEqual([(r['reservoir'], r['region']) for r in rows], [('Ialy','Tây Nguyên'), ('Kanak','Tây Nguyên')])
    def test_yoy_uses_same_days_and_needs_prior_coverage(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d); raw=root/'raw';raw.mkdir()
            (root/'seed.json').write_text(json.dumps({'last_observation':'2025-12-31','monthly':[]}))
            # Năm trước: A đủ 1–31/11 (10 m³/s ngày 1–9, 1000 sau đó), B chỉ có 1–5/11 (5/9 ngày < 80%).
            daily={'from':'2025-11-01','reservoirs':{'A':{'inflow':[10]*9+[1000]*21,'level':[100]*30},'B':{'inflow':[10]*5+[None]*25,'level':[None]*30}}}
            (root/'daily.json').write_text(json.dumps(daily))
            for day in range(1,10):
                rows=[{'reservoir':n,'region':'Tây Nguyên','evn_time':f'2026-11-{day:02d}T00:00:00+07:00','offset_hours':0,'level':101,'inflow':5,'generation':0,'spill':0} for n in 'AB']
                (raw/f'2026-11-{day:02d}.json').write_text(json.dumps({'requested_date':f'2026-11-{day:02d}','rows':rows}))
            out=root/'out.js'; build(root/'seed.json',raw,out,root/'daily.json')
            yoy=json.loads(out.read_text().split('=',1)[1].rstrip(';\n'))['yoy']
            a,b=yoy['rows']
            self.assertEqual((yoy['month'],a['from'],a['to'],a['days'],a['prior_days']),('2026-11','2026-11-01','2026-11-09',9,9))
            self.assertEqual((a['yoy'],a['dl']),(-50.0,1.0))
            self.assertEqual((b['prior_days'],b['yoy']),(5,None))

if __name__=='__main__': unittest.main()
