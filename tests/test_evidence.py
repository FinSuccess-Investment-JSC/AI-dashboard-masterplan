import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import check_evidence as ce  # noqa: E402


class EvidenceTests(unittest.TestCase):
    def test_every_entry_is_well_formed(self):
        for f, e in ce.load():
            with self.subTest(f'{f}:{e.get("block")}:{e.get("claim")}'):
                self.assertEqual(ce.problems(e), [])

    def test_digits_ignore_separators(self):
        self.assertEqual(ce.digits('~1.170 triệu tấn'), ['1170'])
        self.assertEqual(ce.problems({'block': 'x', 'claim': 'c', 'value': '34,36', 'url': 'u', 'status': 'match', 'quote': 'đạt 34,36 triệu TEU'}), [])
        self.assertTrue(ce.problems({'block': 'x', 'claim': 'c', 'value': '90%', 'url': 'u', 'status': 'match', 'quote': 'lên 60% từ 2031'}))


if __name__ == '__main__':
    unittest.main()
