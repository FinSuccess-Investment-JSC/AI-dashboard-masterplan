import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import build_power_overview as bo  # noqa: E402


class PowerOverviewTest(unittest.TestCase):
    """Tab Tổng quan ngành Điện: nội dung định tính hợp lệ và trang khớp bản build."""

    @classmethod
    def setUpClass(cls):
        cls.data = json.loads(bo.SRC.read_text(encoding='utf-8'))
        cls.policy = json.loads(bo.POLICY.read_text(encoding='utf-8'))

    def test_data_valid(self):
        self.assertEqual(bo.validate(self.data, self.policy), [])

    def test_built_js_matches_json(self):
        text = bo.OUT.read_text(encoding='utf-8')
        self.assertTrue(text.startswith('window.POWER_OVERVIEW='))
        self.assertEqual(json.loads(text[len('window.POWER_OVERVIEW='):].rstrip().rstrip(';')), self.data)

    def test_unknown_ticker_rejected(self):
        data = json.loads(json.dumps(self.data))
        data['theses'][0]['tickers'].append('VNM')
        self.assertTrue(any('ngoài danh sách' in e for e in bo.validate(data, self.policy)))

    def test_undated_release_has_no_date(self):
        data = json.loads(json.dumps(self.data))
        r = next(r for r in data['releases'] if r['kind'] == 'undated')
        r['date'] = '2027-01-01'
        self.assertTrue(any('undated' in e for e in bo.validate(data, self.policy)))

    def test_six_technologies_with_settlement(self):
        techs = {t['id']: t for t in self.data['technologies']}
        self.assertEqual(list(techs), ['coal', 'gas', 'lng', 'hydro', 'wind', 'solar'])
        for k in ('coal', 'gas', 'lng', 'hydro'):
            self.assertEqual(techs[k]['stages'][-1]['chart'], 'settlement')  # bán điện có sơ đồ PPA/Qc/FMP
        self.assertIn('curtail', [s['chart'] for s in techs['solar']['stages']])

    def test_thresholds_defined(self):
        data = json.loads(json.dumps(self.data))
        del data['thresholds']['fuel_move_pct']
        self.assertTrue(any('thresholds' in e for e in bo.validate(data, self.policy)))

    def test_page_loads_overview(self):
        html = (ROOT / 'Dien/index.html').read_text(encoding='utf-8')
        picture, overview, data = html.find('assets/power-picture.js'), html.find('assets/power-overview.js'), html.find('data/power-overview.js')
        self.assertTrue(picture > 0 and overview > 0 and data > 0)
        self.assertLess(picture, overview)  # power-picture.js xuất window.POWER_CORE
        self.assertLess(data, overview)
        visual = html.find('assets/power-overview-visual.js')
        self.assertTrue(0 < visual < overview)  # lớp hình ảnh nạp trước module Tổng quan


if __name__ == '__main__':
    unittest.main()
