import datetime as dt
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from fetch_fbx import parse as parse_fbx  # noqa: E402
from fetch_portwatch_ports import parse as parse_ports  # noqa: E402


class PortWatchPortsTests(unittest.TestCase):
    def feats(self, *rows):
        return [{'attributes': {'portid': 'port434', 'date': d, 'portcalls_container': c, 'import_container': i,
                                'export_container': e, 'portcalls_tanker': t}} for d, c, i, e, t in rows]

    def test_rows_sorted_and_rounded(self):
        rows = parse_ports(self.feats(('2026-10-26', 7, 8230.4, 10926, 5), ('2026-10-25', 6, 12527, 4111, 2)), 'port434',
                           today=dt.date(2026, 11, 5))
        self.assertEqual([r['date'] for r in rows], ['2026-10-25', '2026-10-26'])
        self.assertEqual(rows[1]['import_container'], 8230.4)
        self.assertEqual(rows[0]['portcalls_container'], 6)

    def test_epoch_dates_and_guards(self):
        ms = int(dt.datetime(2026, 10, 1, tzinfo=dt.timezone.utc).timestamp() * 1000)
        rows = parse_ports(self.feats((ms, 1, 0, 0, 0)), 'port434', today=dt.date(2026, 11, 5))
        self.assertEqual(rows[0]['date'], '2026-10-01')
        with self.assertRaises(ValueError):
            parse_ports(self.feats(('2026-12-01', 1, 0, 0, 0)), 'port434', today=dt.date(2026, 11, 5))
        with self.assertRaises(ValueError):
            parse_ports(self.feats(('2026-10-01', None, 0, 0, 0)), 'port434', today=dt.date(2026, 11, 5))
        with self.assertRaises(ValueError):
            parse_ports(self.feats(('2026-10-01', 1, 0, 0, 0)), 'port903', today=dt.date(2026, 11, 5))


class FbxTests(unittest.TestCase):
    TEXT = ('[{"label":"FBX01","value":"$8,340","change":"-0.33%","positive":false},{"label":"FBX02","value":"$340",'
            '"change":"-0.06%","positive":false},{"label":"FBX03","value":"$9,911","change":"-6.19%","positive":false},'
            '{"label":"FBX11","value":"$3,595","change":"+1.23%","positive":true},{"label":"FBX13","value":"$4,375",'
            '"change":"+2.88%","positive":true},{"label":"FBX01","value":"$8,340","change":"-0.33%","positive":false}]')

    def test_lanes(self):
        values, changes, quotes = parse_fbx(self.TEXT)
        self.assertEqual(values, {'FBX01': 8340, 'FBX03': 9911, 'FBX11': 3595, 'FBX13': 4375})
        self.assertEqual(changes['FBX11'], 1.23)
        self.assertIn('$8,340', quotes['FBX01'])

    def test_missing(self):
        with self.assertRaises(ValueError):
            parse_fbx('{"label":"FBX02","value":"$340","change":"-0.06%"}')


if __name__ == '__main__':
    unittest.main()
