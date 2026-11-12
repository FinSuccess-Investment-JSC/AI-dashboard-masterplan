"""Workspace KCN: dữ liệu sinh từ workbook (scripts/build_kcn_workbook.py) đúng điều kiện nghiệm thu và khớp bản đang commit."""
import importlib.util
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data/kcn-market.json'


def load_builder():
    spec = importlib.util.spec_from_file_location('build_kcn_workbook', ROOT / 'scripts/build_kcn_workbook.py')
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class KcnWorkbookData(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.d = json.loads(DATA.read_text(encoding='utf-8'))

    def test_all_sheets_and_checks(self):
        self.assertEqual(len(self.d['workbook']['sheets']), 23)
        self.assertTrue(all(c['ok'] for c in self.d['checks']), [c for c in self.d['checks'] if not c['ok']])

    def test_landbank_and_companies(self):
        self.assertEqual(len(self.d['landbank']), 39)
        self.assertEqual({c['ticker'] for c in self.d['company']}, {'KBC', 'IDC', 'BCM', 'SZC', 'VGC', 'LHG', 'NTC', 'D2D'})
        vgc = next(c for c in self.d['company'] if c['ticker'] == 'VGC')
        self.assertEqual(vgc['precision'], 'LOWER_BOUND')  # hiển thị ">4.500", không phải số chính xác
        self.assertIsNone(next(c for c in self.d['company'] if c['ticker'] == 'BCM')['value_ha'])
        # Gross không bao giờ thành đất chưa thuê: mọi ước tính chưa lấp đầy đều có diện tích thương phẩm.
        for x in self.d['landbank']:
            if x['unleased_est_ha'] is not None:
                self.assertIsNotNone(x['commercial_ha'], x['project'])
            self.assertIsNone(x['ready_ha'])

    def test_lease_history_only_idc(self):
        rows = [(x['ticker'], x['year'], x['value_ha'], x['type']) for x in self.d['lease']]
        self.assertEqual(rows, [('IDC', 2023, 170, 'ACTUAL'), ('IDC', 2024, 101, 'ACTUAL'), ('IDC', 2025, 76, 'ACTUAL')])

    def test_survey_and_currency_kept_apart(self):
        for m in self.d['market']:
            self.assertFalse(m['ask_usd'] is not None and m['ask_vnd'] is not None, m['period'])
            self.assertEqual(m['cohort'], 'POST' if m['period'] >= '2025Q3' else 'PRE')
        est = [c for c in self.d['cbre'] if c['status'].startswith('DERIVED')]
        self.assertEqual({c['period'] for c in est}, {'2026Q3'})
        self.assertEqual(self.d['dup']['unmatched'], 0)

    def test_web_supplement_has_evidence(self):
        ev = {e['claim']: e for e in json.loads((ROOT / 'data/kcn/evidence.json').read_text(encoding='utf-8'))}
        rows = self.d['supplement']['rows']
        self.assertGreater(len(rows), 10)
        for r in rows:
            self.assertEqual(ev[r['id']]['status'], 'match', r['id'])
            self.assertIn(r['src'], self.d['sources'])
        n = next(c for c in self.d['cbre'] if c['period'] == '2026Q3' and c['region'] == 'North')
        self.assertEqual((n['value'], n['status'], n['replaced']['value']), (101, 'LOWER_BOUND', 99))
        # Hấp thụ C&W các quý không công bố vẫn để trống (không lấp bằng nguồn khác).
        self.assertIsNone(next(m for m in self.d['market'] if m['period'] == '2026Q3' and m['region'] == 'North')['abs_ha'])

    def test_workspace_has_no_hardcoded_market_numbers(self):
        js = (ROOT / 'assets/kcn-workspace.js').read_text(encoding='utf-8')
        for n in ('25455', '35800', '9230', '4474', '613', '13,4'):
            self.assertNotRegex(js, r'(?<![\d.])' + re.escape(n) + r'(?![\d])', n)

    def test_page_wiring(self):
        html = (ROOT / 'Bat-dong-san/index.html').read_text(encoding='utf-8')
        for f in ('data/kcn-market.js', 'assets/kcn-insights.js', 'assets/kcn-workspace.js', 'assets/kcn-workspace.css'):
            self.assertIn('../' + f, html)
        self.assertIn('data-tab="mt13"', html)
        self.assertNotIn('data-block-id="bds-12"', html)
        self.assertNotIn('data-block-id="bds-18"', html)
        self.assertIn("['mt13','Khu công nghiệp']", (ROOT / 'assets/research-layout.js').read_text(encoding='utf-8'))

    def test_build_is_reproducible(self):
        try:
            import openpyxl  # noqa: F401
        except ImportError:
            self.skipTest('openpyxl chưa cài')
        mod = load_builder()
        tmp = ROOT / 'data/.kcn-test'
        tmp.mkdir(exist_ok=True)
        try:
            mod.OUT_JSON, mod.OUT_JS = tmp / 'a.json', tmp / 'a.js'
            mod.main(['x'])
            fresh = json.loads(mod.OUT_JSON.read_text(encoding='utf-8'))
            fresh.pop('built'); old = dict(self.d); old.pop('built')
            self.assertEqual(fresh, old, 'data/kcn-market.json cũ hơn workbook: chạy lại scripts/build_kcn_workbook.py')
            self.assertEqual(mod.OUT_JS.read_text(encoding='utf-8').count('\r'), 0)
        finally:
            for f in tmp.glob('*'):
                f.unlink()
            tmp.rmdir()


if __name__ == '__main__':
    unittest.main()
