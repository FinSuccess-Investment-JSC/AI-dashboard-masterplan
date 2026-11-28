#!/usr/bin/env python3
"""Kiểm dashboard ngành theo khung chuẩn Điện (DASHBOARD_WORKFLOW.md §42, người dùng chốt 28/11/2026).

    python scripts/check_sector_frame.py                 # mọi ngành (trừ Ngân hàng, Chứng khoán, Bảo hiểm)
    python scripts/check_sector_frame.py Dau-khi Thep    # vài ngành
    python scripts/check_sector_frame.py Dien --json     # in số đo thô

Chrome headless nạp tests/frame-check.html?s=<ngành> qua một server tĩnh tạm (cổng ngẫu nhiên), trang đó bấm qua mọi tab lớn
và sub-tab rồi ghi số đo. Script so số đo với chuẩn và in FAIL (phải sửa) / WARN (nên sửa). Mã thoát 1 nếu có FAIL.
Đường dẫn Chrome: biến CHROME, nếu không có thì thử Chrome/Edge mặc định trên Windows, macOS, Linux.
"""
import functools
import http.server
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import threading
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SECTORS = ['Dien', 'Thep', 'Duoc', 'Chan-nuoi', 'Dau-khi', 'Ca-tra', 'Tom', 'Van-tai-bien', 'Cang-bien', 'Hang-khong',
           'Bat-dong-san', 'Bat-dong-san-KCN', 'Xay-dung', 'Vat-lieu-xay-dung', 'Det-may', 'Ban-le', 'Bia', 'Sua', 'Nhua',
           'O-to-xe-may', 'Sugar', 'Cao-su', 'Phan-bon', 'Xut-clo', 'Vien-thong']
TABS = ['Tổng quan ngành', 'Bức tranh ngành', 'Tài chính ngành', 'Chủ đề nóng']
# Ngoại lệ người dùng chốt: Dầu khí giữ tab Chính sách riêng (28/11/2026, "dầu khí để tab chính sách riêng mà").
TABS_BY = {s: ['Tổng quan ngành', 'Bức tranh ngành', 'Chính sách', 'Tài chính ngành', 'Chủ đề nóng'] for s in ('Dau-khi', 'Bat-dong-san')}
FIN_SUBS = ['Tài chính ngành', 'Doanh nghiệp niêm yết', 'Định giá']
CHROMES = [os.environ.get('CHROME', ''),
           r'C:\Program Files\Google\Chrome\Application\chrome.exe',
           r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
           '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
           shutil.which('google-chrome') or '', shutil.which('chromium') or '', shutil.which('chromium-browser') or '']


def chrome():
    for c in CHROMES:
        if c and Path(c).exists():
            return c
    sys.exit('Không tìm thấy Chrome/Edge; đặt biến CHROME.')


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def serve():
    h = functools.partial(Quiet, directory=str(ROOT))
    http.server.ThreadingHTTPServer.request_queue_size = 128  # hàng đợi mặc định 5 làm rớt request khi trang nạp nhiều file cùng lúc
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def measure(base, sector, exe):
    with tempfile.TemporaryDirectory() as prof:
        cmd = [exe, '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', f'--user-data-dir={prof}',
               '--window-size=1500,1100', '--virtual-time-budget=180000', '--dump-dom', f'{base}tests/frame-check.html?s={sector}']
        try:
            dom = subprocess.run(cmd, capture_output=True, timeout=240).stdout.decode('utf-8', 'replace')
        except subprocess.TimeoutExpired:
            return {'sector': sector, 'err': 'timeout'}
    m = re.search(r'<pre id="out">(.*?)</pre>', dom, re.S)
    if not m:
        return {'sector': sector, 'err': 'no output'}
    raw = m.group(1).replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"').replace('&amp;', '&')
    try:
        return json.loads(raw)
    except ValueError:
        return {'sector': sector, 'err': 'bad output: ' + raw[:200]}


def check(r):
    fail, warn = [], []
    F, W = fail.append, warn.append
    if r.get('err'):
        return [r['err']], []
    names = [t['name'] for t in r['tabs']]
    want = TABS_BY.get(r.get('sector'), TABS)
    if names != want:
        F(f'tab lớn {names} ≠ {want}')
    tab = {t['name']: t for t in r['tabs']}
    # Tổng quan: thanh thẻ ov-nav, số 00, 01…, mỗi thẻ có tiêu đề + dòng phụ
    ov = tab.get('Tổng quan ngành')
    if ov:
        nav = ov.get('nav')
        if not nav or 'ov-nav' not in nav['cls'].split():
            F(f"Tổng quan: thanh không phải ov-nav ({nav and nav['cls']})")
        else:
            nums = [i['num'] for i in nav['items']]
            if nums != [f'{i:02d}' for i in range(len(nums))]:
                F(f'Tổng quan: số thẻ {nums} phải là 00, 01, …')
            if any(not i['sub'] for i in nav['items']):
                F('Tổng quan: thẻ thiếu dòng phụ <small>')
            if nav['items'] and 'Bản đồ ngành' not in nav['items'][0]['label']:
                W(f"Tổng quan: thẻ 00 nên là Bản đồ ngành (đang là {nav['items'][0]['label']})")
    # Bức tranh ngành: pp-nav 01…; mỗi sub-tab có tiêu đề, ngày dữ liệu, ô số, câu hỏi đánh số, chart chính, không thẻ trôi
    bt = tab.get('Bức tranh ngành')
    if bt:
        nav = bt.get('nav')
        if not nav or 'pp-nav' not in nav['cls'].split():
            F(f"Bức tranh: thanh không phải pp-nav ({nav and nav['cls']})")
        else:
            nums = [i['num'] for i in nav['items']]
            if nums != [f'{i + 1:02d}' for i in range(len(nums))]:
                F(f'Bức tranh: số sub-tab {nums} phải là 01, 02, …')
        for i, s in enumerate(bt['subs']):
            m, n = s['m'], s['name']
            if 'Chính sách' in n:
                if not m['head'] or not m['asof']:
                    W(f'Bức tranh › {n}: thiếu tiêu đề hoặc ngày dữ liệu')
                continue
            if not m['head']:
                F(f'Bức tranh › {n}: thiếu tiêu đề sub-tab .pp-head')
            if not re.search(r'\d', m['asof']):
                F(f'Bức tranh › {n}: thiếu "Dữ liệu mới nhất" (.pp-asof)')
            if m['kpi'] < 2:
                W(f"Bức tranh › {n}: ô số {m['kpi']} (< 2)")
            if i > 0 and not m['flow']:
                W(f'Bức tranh › {n}: thiếu thanh Đầu vào → Sản xuất → Đầu ra')
            if m['q'] < 1:
                F(f'Bức tranh › {n}: không có câu hỏi .pp-panel')
            if m['loose']:
                F(f"Bức tranh › {n}: {m['loose']} thẻ ngoài câu hỏi {m['looseIds']}")
            if m['qNoMain']:
                F(f"Bức tranh › {n}: {m['qNoMain']} câu hỏi không có .pp-main")
            if m.get('qMainMulti'):
                W(f"Bức tranh › {n}: {m['qMainMulti']} câu hỏi dồn nhiều chart trong .pp-main — tách chart chính (.pp-main) · chart phụ (.pp-sup1) · xem thêm (.pp-more) như Điện")
            want = [f'{i + 1}.{j + 1}' for j in range(len(m['qnum']))]
            if m['qnum'] != want:
                F(f"Bức tranh › {n}: số câu {m['qnum'][:6]} phải là {want[:6]}")
            if m['empty']:
                W(f"Bức tranh › {n}: thẻ 'Chưa có dữ liệu' {m['empty']}")
    # Tài chính ngành: 01 Tài chính ngành · 02 Doanh nghiệp niêm yết · 03 Định giá
    tc = tab.get('Tài chính ngành')
    if tc:
        nav = tc.get('nav')
        if not nav or 'pp-nav' not in nav['cls'].split():
            F(f"Tài chính: thanh không phải pp-nav ({nav and nav['cls']})")
        labels = [s['name'] for s in tc['subs']]
        want = [f'{i + 1:02d}{x}' for i, x in enumerate(FIN_SUBS)]
        if [re.sub(r'\s', '', x) for x in labels] != [re.sub(r'\s', '', x) for x in want]:
            F(f'Tài chính: sub-tab {labels} ≠ {want}')
        if tc['subs']:
            m = tc['subs'][0]['m']
            if m['kpiAny'] < 4 or m['q'] < 4:
                F(f"Tài chính › 01: cần ≥4 ô số và ≥4 câu hỏi (đang {m['kpiAny']} ô, {m['q']} câu)")
        if len(tc['subs']) >= 3 and tc['subs'][2]['m']['cards'] < 1:
            F('Tài chính › 03 Định giá: trống')
    # Chủ đề nóng: bố cục tin tức như Điện
    cd = tab.get('Chủ đề nóng')
    if cd:
        hs = ' '.join((cd.get('m') or {}).get('hAll', []) + [x for s in cd['subs'] for x in s['m'].get('hAll', [])])
        for need in ['Tiêu điểm ngành', 'Tin tức mới nhất', 'Chủ đề đang theo dõi']:
            if need not in hs:
                W(f'Chủ đề nóng: thiếu khối "{need}"')
    if r.get('overflow'):
        F('trang tràn ngang ở 1440px')
    if r.get('errors'):
        W(f"lỗi JS: {r['errors'][:3]}")
    return fail, warn


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    raw = '--json' in sys.argv
    exe, srv = chrome(), serve()
    base = f'http://127.0.0.1:{srv.server_address[1]}/'
    bad = 0
    for s in args or SECTORS:
        r = measure(base, s, exe)
        if raw:
            print(json.dumps(r, ensure_ascii=False, indent=1))
            continue
        fail, warn = check(r)
        if r.get('err') or any(x.startswith('tab lớn') for x in fail):  # máy tải nặng: khung chưa kịp dựng → đo lại một lần
            r = measure(base, s, exe)
            fail, warn = check(r)
        bad += bool(fail)
        print(f"\n== {s}: {'OK' if not fail else f'{len(fail)} FAIL'}, {len(warn)} WARN")
        for x in fail:
            print('  FAIL', x)
        for x in warn:
            print('  warn', x)
    srv.shutdown()
    return 1 if bad else 0


if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    sys.exit(main())
