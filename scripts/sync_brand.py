#!/usr/bin/env python3
"""Keep assets/brand.css, share-image.js and motion.js identical to Stock's _template (repo FinSuccess-dashboard-source).
No argument: fetch through `gh` (needs repo access; the private repo is unreachable from Pages). With a path: read a local clone.
Only brand.css drops its font @import, which sector pages load themselves. Prints 'changed' when a file was rewritten."""
import base64, json, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = 'FinSuccess-Investment-JSC/FinSuccess-dashboard-source'
FILES = {'brand.css': 'assets/brand.css', 'share-image.js': 'assets/share-image.js', 'motion.js': 'assets/motion.js', 'chart-arrange.js': 'assets/chart-arrange.js'}


def read(name):
    if len(sys.argv) > 1:
        return (Path(sys.argv[1]) / '_template' / name).read_text()
    out = subprocess.run(['gh', 'api', f'repos/{REPO}/contents/_template/{name}'], check=True, capture_output=True, text=True).stdout
    return base64.b64decode(json.loads(out)['content']).decode()


def main():
    changed = False
    for name, target in FILES.items():
        text = read(name)
        lines = text.split('\n')
        if name.endswith('.css') and lines[0].startswith('@import'):
            text = '\n'.join(lines[1:])
        path = ROOT / target
        if path.read_text() != text:
            path.write_text(text)
            changed = True
            print('updated', target)
    print('changed' if changed else 'unchanged')
    return 0


if __name__ == '__main__':
    sys.exit(main())
