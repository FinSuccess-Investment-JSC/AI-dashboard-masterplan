import json
import re
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import build_power_policy as bp  # noqa: E402


class PowerPolicyTest(unittest.TestCase):
    """Tab Policy / Tax / Trade ngành Điện: dữ liệu hợp lệ và trang khớp bản build."""

    @classmethod
    def setUpClass(cls):
        cls.data = json.loads(bp.SRC.read_text(encoding='utf-8'))
        cls.evidence = json.loads(bp.EVIDENCE.read_text(encoding='utf-8'))

    def test_data_valid(self):
        self.assertEqual(bp.validate(self.data, self.evidence), [])

    def test_built_js_matches_json(self):
        text = bp.OUT.read_text(encoding='utf-8')
        self.assertTrue(text.startswith('window.POWER_POLICY='))
        self.assertEqual(json.loads(text[len('window.POWER_POLICY='):].rstrip().rstrip(';')), self.data)

    def test_expired_policy_is_not_effective(self):
        data = json.loads(json.dumps(self.data))
        data['policies'][0]['expiration_date'] = '2020-01-01'
        data['policies'][0]['policy_status'] = 'Effective'
        self.assertTrue(any('hết hiệu lực' in e for e in bp.validate(data, self.evidence)))

    def test_ceiling_needs_evidence(self):
        data = json.loads(json.dumps(self.data))
        data['price_frameworks'][0]['ceiling'] = 1234.56
        self.assertTrue(any('chưa có trong evidence' in e for e in bp.validate(data, self.evidence)))

    def test_module_needs_template_parts(self):
        data = json.loads(json.dumps(self.data))
        data['handbook']['2.1']['quick'] = ''
        self.assertTrue(any('2.1: thiếu quick' in e for e in bp.validate(data, self.evidence)))

    def test_handbook_on_page(self):
        tabs = self.data['tabs']
        self.assertEqual([t['id'] for t in tabs], ['plan', 'price', 'market', 'tax'])
        page = (ROOT / 'Dien' / 'index.html').read_text(encoding='utf-8')
        for t in tabs:
            self.assertIn(f'data-pane="{t["id"]}"', page)
            for key in t['modules']:
                m = self.data['handbook'][key]
                self.assertIn(f'id="pp-m-{key.replace(".", "-")}" data-mod="{key}" data-block-id="{m["block"]}"', page)
        for name in ('assets/power-policy.js', 'assets/power-policy.css', 'data/power-policy.js'):
            self.assertRegex(page, re.escape('../' + name) + r'\?v=[0-9a-f]{12}"')


if __name__ == '__main__':
    unittest.main()
