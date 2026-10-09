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

if __name__=='__main__': unittest.main()
