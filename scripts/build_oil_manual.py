#!/usr/bin/env python3
"""Dầu khí · số vận hành nhập tay cho Tài chính ngành › 03 Định giá (DASHBOARD_WORKFLOW §44, 28/11/2026).
Nguồn sự thật: data/oil/manual.json → data/oil-manual.js (window.OIL_MANUAL) + data/oil/evidence.json (block 'oil-manual').
"""
from sector_manual import ROOT, build

KEY = {'rig_rate': 'rig', 'rig_util': 'rigu', 'backlog': 'bl', 'volume': 'vol', 'util': 'util', 'stations': 'st', 'target': 'rnav', 'volume_lpg': 'lpg'}
LABEL = {k: k for k in KEY}
LABEL.update({'rig_rate': 'Giá thuê giàn khoan', 'rig_util': 'Hiệu suất giàn', 'backlog': 'Hợp đồng tồn đọng', 'volume': 'Sản lượng', 'util': 'Công suất vận hành',
              'stations': 'Số cửa hàng xăng dầu', 'target': 'Giá mục tiêu của CTCK', 'fob_share': 'Tỷ trọng FOB', 'order_months': 'Đơn hàng đã ký',
              'top_customer': 'Khách hàng lớn nhất', 'workers': 'Số lao động', 'capacity': 'Công suất', 'recycled_share': 'Tỷ trọng sợi tái chế'})
SCALE = {u: 1 for u in ['USD/ngày', '%', 'triệu USD', 'tỷ đồng', 'triệu m³', 'tỷ m³', 'nghìn tấn', 'triệu tấn', 'nghìn m³', 'triệu m³ xăng dầu', 'cửa hàng',
                        'đồng/cp', 'người', 'tấn/năm', 'tháng', 'tấn', 'triệu m3', 'triệu m3/tấn', 'CHXD']}

if __name__ == '__main__':
    build(ROOT / 'data/oil/manual.json', ROOT / 'data/oil-manual.js', ROOT / 'data/oil/evidence.json', 'oil-manual', 'OIL_MANUAL', KEY, LABEL, SCALE, 'oil-manual')
