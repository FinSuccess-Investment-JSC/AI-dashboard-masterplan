#!/usr/bin/env python3
"""Thép · số vận hành nhập tay cho Tài chính ngành › 03 Định giá (DASHBOARD_WORKFLOW §44, 28/11/2026).
Nguồn sự thật: data/steel/manual.json → data/steel-manual.js (window.STEEL_MANUAL) + data/steel/evidence.json (block 'steel-manual').
"""
from sector_manual import ROOT, build

KEY = {'throughput': 'thr', 'capacity': 'cap', 'util': 'util', 'capex_plan': 'cpx', 'volume': 'vol', 'volume_hrc': 'hrc', 'share': 'shr', 'export_share': 'exp',
       'cane_area': 'cane', 'herd': 'herd', 'target': 'rnav'}
LABEL = {'throughput': 'Sản lượng hàng qua cảng', 'capacity': 'Công suất thiết kế', 'util': 'Hiệu suất khai thác', 'capex_plan': 'Dự án đầu tư chính', 'volume': 'Sản lượng tiêu thụ',
         'volume_hrc': 'Sản lượng HRC', 'share': 'Thị phần', 'export_share': 'Tỷ trọng xuất khẩu', 'cane_area': 'Vùng nguyên liệu mía', 'herd': 'Tổng đàn bò', 'target': 'Giá mục tiêu của CTCK'}
SCALE = {u: 1 for u in ['TEU', 'triệu TEU', 'nghìn TEU', 'triệu tấn', 'nghìn tấn', 'tấn', 'TEU/năm', 'triệu tấn/năm', '%', 'đồng/cp', 'chuyến', 'ha', 'con', 'triệu lít', 'tỷ lít']}

if __name__ == '__main__':
    build(ROOT / 'data/steel/manual.json', ROOT / 'data/steel-manual.js', ROOT / 'data/steel/evidence.json', 'steel-manual', 'STEEL_MANUAL', KEY, LABEL, SCALE, 'steel-manual')
