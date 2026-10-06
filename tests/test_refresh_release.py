import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from scripts import refresh_release


class ReleaseSignatureTests(unittest.TestCase):
    def test_check_time_does_not_publish_but_new_observation_does(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(refresh_release, 'DATA', Path(directory)):
            data = Path(directory)
            market = {'sources': {'brent': {'data_hash': 'first', 'status': 'ok', 'last_checked_at': 'old'}}}
            bank = {'data_hash': 'bank', 'status': 'loaded', 'last_checked_at': 'old'}
            (data / 'daily-data.js').write_text('window.SECTOR_DAILY = ' + json.dumps(market) + ';')
            (data / 'bank-public-data.js').write_text('window.BANK_PUBLIC_DATA = ' + json.dumps(bank) + ';')
            first = refresh_release.signature(False)
            market['sources']['brent']['last_checked_at'] = 'new'
            bank['last_checked_at'] = 'new'
            (data / 'daily-data.js').write_text('window.SECTOR_DAILY = ' + json.dumps(market) + ';')
            (data / 'bank-public-data.js').write_text('window.BANK_PUBLIC_DATA = ' + json.dumps(bank) + ';')
            self.assertEqual(first, refresh_release.signature(False))
            market['sources']['brent']['data_hash'] = 'second'
            (data / 'daily-data.js').write_text('window.SECTOR_DAILY = ' + json.dumps(market) + ';')
            self.assertNotEqual(first, refresh_release.signature(False))

    def test_source_failure_transition_publishes(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(refresh_release, 'DATA', Path(directory)):
            data = Path(directory)
            market = {'sources': {'curve': {'data_hash': 'last-good', 'status': 'ok'}}}
            (data / 'daily-data.js').write_text('window.SECTOR_DAILY = ' + json.dumps(market) + ';')
            (data / 'bank-public-data.js').write_text('window.BANK_PUBLIC_DATA = {};')
            first = refresh_release.signature(False)
            market['sources']['curve']['status'] = 'error'
            (data / 'daily-data.js').write_text('window.SECTOR_DAILY = ' + json.dumps(market) + ';')
            self.assertNotEqual(first, refresh_release.signature(False))


if __name__ == '__main__':
    unittest.main()


class NoticeTests(unittest.TestCase):
    def test_alerts_only_on_transitions(self):
        before = {'brent': ('a', 'ok', '2026-10-01', None), 'wti': ('w', 'error', '2026-09-30', 'timeout'), 'eia': ('e', 'ok', None, None)}
        after = {'brent': ('b', 'ok', '2026-10-02', None), 'wti': ('w', 'error', '2026-09-30', 'timeout'), 'eia': ('e', 'error', None, 'HTTP 503')}
        text = refresh_release.notice(before, after, {'market': 1})
        self.assertIn('eia: HTTP 503', text)
        self.assertNotIn('wti', text)  # still broken: already alerted on the earlier run
        self.assertIn('brent (2026-10-02)', text)

    def test_nothing_changed_sends_nothing(self):
        same = {'brent': ('a', 'ok', '2026-10-01', None)}
        self.assertEqual(refresh_release.notice(same, same, {'market': 0, 'bank': 0}), '')

    def test_recovery_is_reported(self):
        text = refresh_release.notice({'wti': ('w', 'error', None, 'x')}, {'wti': ('w', 'ok', None, None)}, {})
        self.assertIn('chạy lại bình thường: wti', text)
