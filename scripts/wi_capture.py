#!/usr/bin/env python3
"""PostToolUse hook: save every WiMCP result verbatim to data/raw/wi/.inbox/.

Registered in .claude/settings.json so the Claude routine never retypes Wi numbers:
scripts/wi_ingest.py ingest <item> matches these captures to its planned calls and
merges them. Never blocks the tool call: any problem is ignored (exit 0).
"""
from __future__ import annotations

import datetime as dt
import json
import os
import re
import sys
from pathlib import Path


def response_payload(raw):
    """Hook payloads carry the MCP result as text blocks, a dict or a string; return parsed JSON when possible."""
    if isinstance(raw, dict) and 'content' in raw:
        raw = raw['content']
    if isinstance(raw, list):
        raw = ''.join(b.get('text', '') for b in raw if isinstance(b, dict) and b.get('type', 'text') == 'text')
    elif isinstance(raw, dict) and isinstance(raw.get('text'), str):
        raw = raw['text']
    if isinstance(raw, str):
        try:
            return json.loads(raw)
        except ValueError:
            return raw
    return raw


def main() -> int:
    try:
        event = json.load(sys.stdin)
        tool = event.get('tool_name', '')
        if 'WiMCP' not in tool:
            return 0
        root = Path(os.environ.get('CLAUDE_PROJECT_DIR') or Path(__file__).resolve().parents[1])
        inbox = root / 'data/raw/wi/.inbox'
        inbox.mkdir(parents=True, exist_ok=True)
        raw = event.get('tool_response', event.get('tool_output'))
        stamp = dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
        name = re.sub(r'[^A-Za-z0-9_.-]', '_', tool.rsplit('__', 1)[-1])
        (inbox / f'{stamp}-{name}.json').write_text(json.dumps(
            {'tool': tool, 'input': event.get('tool_input', {}), 'captured_at': stamp, 'response': response_payload(raw)},
            ensure_ascii=False), encoding='utf-8')
    except Exception:  # a capture failure must never break the routine's tool call
        pass
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
