#!/usr/bin/env python3
"""Keep assets/brand.css and assets/share-image.js identical to Stock's _template (repo FinSuccess-dashboard-source).
No argument: fetch through `gh` (needs repo access; the private repo is unreachable from Pages). With a path: read a local clone.
Only brand.css drops its font @import, which sector pages load themselves. Prints 'changed' when a file was rewritten."""
import base64, json, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = 'FinSucce