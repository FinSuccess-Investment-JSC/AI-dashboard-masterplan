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
