#!/usr/bin/env python3
"""Replay WiMCP results from a Claude Code transcript (.jsonl) into data/raw/wi/.inbox/.

Use when the PostToolUse hook did not fire (e.g. a VS Code session opened outside this repo, or a subagent).
Each successful WiMCP tool_use/tool_result pair is passed verbatim to scripts/wi_capture.py, so the capture
file is identical to a hook capture and numbers are never retyped.

    python3 scripts/wi_from_transcript.py <transcript.jsonl> [...]
"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def restore(path):
    raw = Path(path).read_text(encoding='utf-8')
    try:
        j = json.loads(raw)
        if isinstance(j, list) and j and isinstance(j[0], dict) and 'text' in j[0]:
            return ''.join(x.get('text', '') for x in j)
    except ValueError:
        pass
    return raw


def pairs(path):
    uses = {}
    for line in open(path, encoding='utf-8'):
        try:
            msg = json.loads(line).get('message') or {}
        except ValueError:
            continue
        content = msg.get('content')
        if not isinstance(content, list):
            continue
        for b in content:
            if b.get('type') == 'tool_use' and 'WiMCP' in b.get('name', ''):
                uses[b['id']] = b
            elif b.get('type') == 'tool_result' and b.get('tool_use_id') in uses and not b.get('is_error'):
                u = uses.pop(b['tool_use_id'])
                c = b.get('content')
                blocks = [{'type': 'text', 'text': c}] if isinstance(c, str) else [x for x in c if x.get('type') == 'text']
                text = ''.join(x.get('text', '') for x in blocks)
                saved = re.search(r'Output has been saved to (\S+?\.txt)', text)
                if saved and text.startswith('Error: result'):  # oversized result: Claude Code kept it in a file
                    blocks = [{'type': 'text', 'text': restore(saved.group(1))}]
                yield {'tool_name': u['name'], 'tool_input': u['input'], 'tool_response': {'content': blocks}}


def main(paths):
    n = 0
    env = {**os.environ, 'CLAUDE_PROJECT_DIR': str(ROOT)}
    for p in paths:
        for ev in pairs(p):
            subprocess.run([sys.executable, str(ROOT / 'scripts/wi_capture.py')], input=json.dumps(ev), text=True, env=env, check=False)
            n += 1
    print(f'captured {n} WiMCP results into data/raw/wi/.inbox/')
    return 0 if n else 1


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
