#!/usr/bin/env python3
"""BĐS dân cư · số vận hành nhập tay cho Tài chính ngành › 03 Định giá (DASHBOARD_WORKFLOW §44, 28/11/2026).

Nguồn sự thật: data/realestate/manual.json — mỗi dòng một (mã, chỉ tiêu) đã MỞ trang gốc:
  {ticker, item, period, value, unit, extra, url, opened_at, quote, status, note, hide?}
  item: presales_latest | presales_fy2025 | presales_plan_2026 | unbilled | rnav | occupancy | gfa
  status: match | not_found | unreachable (chỉ dòng match, không hide mới lên trang)
Script:
  1. kiểm dòng match: có url https, có quote, ít nhất một con số của dòng nằm trong quote;
  2. ghi data/re-manual.js (window.RE_MANUAL) cho Bat-dong-san/app/peer-valuation.js;
  3. đồng bộ các dòng match vào data/realestate/evidence.json (block 're-manual') để routine thứ Hai mở lại link.
Không lấy số từ mạng; cập nhật = sửa manual.json rồi chạy lại script này.
"""
from pathlib import Path

from sector_manual import ROOT, build

KEY = {'presales_latest': 'ps', 'presales_fy2025': 'psfy', 'presales_plan_2026': 'pspl', 'unbilled': 'unb', 'rnav': 'rnav',
       'occupancy': 'occ', 'gfa': 'gfa'}
LABEL = {'presales_latest': 'Doanh số bán hàng', 'presales_fy2025': 'Doanh số bán hàng năm 2025', 'presales_plan_2026': 'Kế hoạch doanh số bán hàng 2026',
         'unbilled': 'Doanh số chưa ghi nhận', 'rnav': 'RNAV và giá mục tiêu của CTCK', 'occupancy': 'Tỷ lệ lấp đầy', 'gfa': 'Diện tích sàn bán lẻ'}
SCALE = {'tỷ đồng': 1, 'nghìn tỷ đồng': 1000, 'đồng/cp': 1, '%': 1, 'nghìn m²': 1, 'm²': 0.001}

if __name__ == '__main__':
    build(ROOT / 'data/realestate/manual.json', ROOT / 'data/re-manual.js', ROOT / 'data/realestate/evidence.json', 're-manual', 'RE_MANUAL', KEY, LABEL, SCALE, 're-manual')
