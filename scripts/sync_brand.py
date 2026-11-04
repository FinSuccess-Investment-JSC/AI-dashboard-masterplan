#!/usr/bin/env python3
"""Copy Stock's _template/brand.css to assets/brand.css unchanged (except its font @import, which pages load themselves).
Usage: python3 scripts/sync_brand.py /path/to/FinSuccess-dashboard-source"""
import sys
from pathlib import Path
src = Path(sys.argv[1]) / '_template/brand.css'
lines = src.read_text().split('\n')
out = '\n'.join(lines[1:] if lines[0].startswith('@import') else lines)
(Path(__file__).resolve().parents[1] / 'assets/brand.css').write_text(out)
print('synced', len(out))
