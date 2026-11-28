#!/usr/bin/env python3
"""Bán lẻ · số vận hành nhập tay cho Tài chính ngành › 03 Định giá (DASHBOARD_WORKFLOW §44–45, 28/11/2026). Không có giá mục tiêu CTCK.
Nguồn sự thật: data/retail/manual.json → data/retail-manual.js (window.RETAIL_MANUAL) + data/retail/evidence.json (block 'retail-manual').
"""
from sector_manual import ROOT, build

KEY = {'capacity_mw': 'mw', 'output': 'out', 'cgm_share': 'cgm', 'land_left': 'landl', 'lease_ha': 'lease', 'occupancy': 'occ', 'rent': 'rent', 'stores': 'stores', 'rev_per_store': 'rps', 'sssg': 'sssg', 'etc_share': 'etc', 'eu_gmp': 'gmp', 'beds': 'beds', 'subscribers': 'subs', 'towers': 'towers', 'backlog': 'bl', 'new_contracts': 'newc', 'toll_rev': 'toll', 'bot_stations': 'bot', 'volume': 'vol', 'capacity': 'cap', 'reserve': 'resv', 'fleet': 'fleet', 'passengers': 'pax', 'cargo': 'cargo', 'load_factor': 'lf'}
LABEL = {k: k for k in KEY}
SCALE = {u: 1 for u in ['MW', 'triệu kWh', 'tỷ kWh', '%', 'ha', 'USD/m²/chu kỳ thuê', 'cửa hàng', 'triệu đồng', 'giường', 'thuê bao', 'triệu thuê bao', 'trạm', 'tỷ đồng', 'nghìn tỷ đồng', 'triệu tấn', 'nghìn tấn', 'tấn', 'triệu tấn/năm', 'triệu m³', 'nghìn m³', 'tàu bay', 'triệu lượt', 'lượt']}

if __name__ == '__main__':
    build(ROOT / 'data/retail/manual.json', ROOT / 'data/retail-manual.js', ROOT / 'data/retail/evidence.json', 'retail-manual', 'RETAIL_MANUAL', KEY, LABEL, SCALE, 'retail-manual')
