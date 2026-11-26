import json
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import fetch_bizmap as fb  # noqa: E402


class FakeApi:
    """Trả lời giả theo schema tài liệu bizmap.live/api (không gọi mạng)."""
    def __init__(self, provinces=None, total=None, fail=False):
        self.calls = 0; self.remaining = '999'; self.fail = fail
        self.provinces = provinces or [{'name': 'Thành phố Hồ Chí Minh', 'stores': 60}, {'name': 'Tỉnh Đồng Nai', 'stores': 30}, {'name': 'Hà Nội', 'stores': 10}]
        self.total = total if total is not None else 100

    def get(self, path, **params):
        self.calls += 1
        if self.fail: raise RuntimeError('HTTP 500')
        if path == '/v1/me': return {'data': {'name': 'test', 'quota': 1000}}
        if path.startswith('/v1/chains/'): return {'data': {'slug': path.split('/')[-1], 'store_count': self.total, 'logo_url': None}}
        if path == '/v1/stats/provinces': return {'data': self.provinces, 'updated_at': '2026-11-26'}
        raise AssertionError(path)


class BizmapTests(unittest.TestCase):
    def test_34_provinces_and_names(self):
        self.assertEqual(len(fb.REGION), 34)
        self.assertEqual(fb.province_name('Thành phố Hồ Chí Minh'), 'Hồ Chí Minh')
        self.assertEqual(fb.province_name('Tỉnh Đắk Lắk'), 'Đắk Lắk')
        self.assertEqual(fb.province_name('TP. Huế'), 'Huế')
        self.assertIsNone(fb.province_name('Bình Dương'))  # đã sáp nhập vào TP.HCM từ 01/07/2025

    def test_fetch_validate_aggregate(self):
        chains = {slug: fb.fetch_chain(FakeApi(), slug) for slug, *_ in fb.CHAINS}
        self.assertEqual(fb.validate(chains), [])
        agg = fb.aggregate(chains)
        c = agg['bach-hoa-xanh']
        self.assertEqual((c['stores'], c['province_count'], c['ticker']), (100, 3, 'MWG'))
        self.assertEqual(c['regions'], {'Bắc': 10, 'Trung': 0, 'Nam': 90})

    def test_validation_rejects_mismatch_and_unknown(self):
        bad = {slug: fb.fetch_chain(FakeApi(total=500), slug) for slug, *_ in fb.CHAINS}
        self.assertTrue(any('lệch tổng' in e for e in fb.validate(bad)))
        unk = {slug: fb.fetch_chain(FakeApi(provinces=[{'name': 'Bình Dương', 'stores': 100}]), slug) for slug, *_ in fb.CHAINS}
        self.assertTrue(any('không nhận ra' in e for e in fb.validate(unk)))

    def test_no_key_and_api_error_keep_old_data(self):
        with patch.dict('os.environ', {'BIZMAP_API_KEY': ''}), patch.object(fb, 'OUT') as out:
            self.assertEqual(fb.main([]), 0); out.write_text.assert_not_called()
        with patch.dict('os.environ', {'BIZMAP_API_KEY': 'x'}), patch.object(fb, 'Api', lambda k: FakeApi(fail=True)), patch.object(fb, 'OUT') as out:
            self.assertEqual(fb.main([]), 0); out.write_text.assert_not_called()

    def test_published_data_has_no_store_coordinates(self):
        root = Path(__file__).resolve().parents[1]
        d = json.loads((root / 'data/retail/bizmap.json').read_text(encoding='utf-8'))
        self.assertEqual(set(d['chains']), {s for s, *_ in fb.CHAINS})
        text = json.dumps(d)
        for k in ('"lat"', '"lng"', '"address"', 'X-API-Key'):
            self.assertNotIn(k, text)
        js = (root / 'data/retail-bizmap.js').read_text(encoding='utf-8')
        self.assertTrue(js.startswith('/*') and 'window.RETAIL_BIZMAP' in js)


if __name__ == '__main__':
    unittest.main()
