#!/usr/bin/env python3
"""Vận tải biển · số đội tàu nhập tay cho Tài chính ngành › 03 Định giá (DASHBOARD_WORKFLOW §44, 28/11/2026).

Nguồn sự thật: data/shipping/manual.json (cùng định dạng data/realestate/manual.json).
  item: fleet_count | fleet_dwt | fleet_age | tc_share | fleet_plan_2026 | target
Ghi data/ship-manual.js (window.SHIP_MANUAL) và các dòng match vào data/shipping/evidence.json (block 'ship-manual').
Trọng tải quy về nghìn DWT (hoặc nghìn TEU với tàu container, extra.cap_unit = 'TEU').
"""
from sector_manual import ROOT, build

KEY = {'fleet_count': 'n', 'fleet_dwt': 'dwt', 'fleet_age': 'age', 'tc_share': 'tc', 'fleet_plan_2026': 'plan', 'target': 'rnav',
       'tce': 'tce'}  # tce: lưu để đối chiếu, luôn hide (giá thuê theo cỡ tàu không so được giữa các mã)
LABEL = {'fleet_count': 'Số tàu', 'fleet_dwt': 'Trọng tải đội tàu', 'fleet_age': 'Tuổi tàu bình quân', 'tc_share': 'Tỷ lệ thuê định hạn / pool',
         'fleet_plan_2026': 'Kế hoạch đầu tư tàu 2026', 'target': 'Giá mục tiêu của CTCK', 'tce': 'Giá thuê định hạn'}
SCALE = {'tàu': 1, 'chiếc': 1, 'DWT': 0.001, 'ngàn DWT': 1, 'nghìn DWT': 1, 'triệu DWT': 1000, 'TEU': 0.001, 'nghìn TEU': 1, 'năm': 1, '%': 1,
         'đồng/cp': 1, 'triệu USD': 1, 'tỷ đồng': 1, 'USD/ngày': 1, 'nghìn USD/ngày': 1000}

if __name__ == '__main__':
    build(ROOT / 'data/shipping/manual.json', ROOT / 'data/ship-manual.js', ROOT / 'data/shipping/evidence.json', 'ship-manual', 'SHIP_MANUAL', KEY, LABEL, SCALE, 'ship-manual')
