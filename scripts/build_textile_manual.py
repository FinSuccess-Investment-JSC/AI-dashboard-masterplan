#!/usr/bin/env python3
"""Dệt may · số vận hành nhập tay cho Tài chính ngành › 03 Định giá (DASHBOARD_WORKFLOW §44, 28/11/2026).
Nguồn sự thật: data/textile/manual.json → data/textile-manual.js (window.TEXTILE_MANUAL) + data/textile/evidence.json (block 'textile-manual').
"""
from sector_manual import ROOT, build

KEY = {'fob_share': 'fob', 'order_months': 'ord', 'top_customer': 'cus', 'workers': 'wk', 'capacity': 'cap', 'util': 'util', 'recycled_share': 'rec', 'target': 'rnav'}
LABEL = {k: k for k in KEY}
LABEL.update({'rig_rate': 'Giá thuê giàn khoan', 'rig_util': 'Hiệu suất giàn', 'backlog': 'Hợp đồng tồn đọng', 'volume': 'Sản lượng', 'util': 'Công suất vận hành',
              'stations': 'Số cửa hàng xăng dầu', 'target': 'Giá mục tiêu của CTCK', 'fob_share': 'Tỷ trọng FOB', 'order_months': 'Đơn hàng đã ký',
              'top_customer': 'Khách hàng lớn nhất', 'workers': 'Số lao động', 'capacity': 'Công suất', 'recycled_share': 'Tỷ trọng sợi tái chế'})
SCALE = {u: 1 for u in ['USD/ngày', '%', 'triệu USD', 'tỷ đồng', 'triệu m³', 'tỷ m³', 'nghìn tấn', 'triệu tấn', 'nghìn m³', 'triệu m³ xăng dầu', 'cửa hàng',
                        'đồng/cp', 'người', 'tấn/năm', 'tháng']}

if __name__ == '__main__':
    build(ROOT / 'data/textile/manual.json', ROOT / 'data/textile-manual.js', ROOT / 'data/textile/evidence.json', 'textile-manual', 'TEXTILE_MANUAL', KEY, LABEL, SCALE, 'textile-manual')
