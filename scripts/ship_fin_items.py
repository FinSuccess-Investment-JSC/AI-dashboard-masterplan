"""Universe và nhóm doanh nghiệp cho tab Tài chính ngành (Van-tai-bien/). Khoản mục BCTC dùng chung với ngành Điện
(power_fin_items.ITEMS, mã VNDirect finfo, mẫu TT200). Dùng bởi fetch_ship_financials.py và build_ship_financials.py.

Nhóm theo phân khúc (8 mã, phạm vi chốt 10/10/2026): Tàu dầu, hóa chất & khí · Hàng rời · Container.
Tỷ lệ sở hữu PVT–PVP chưa đối chiếu báo cáo thường niên (ownership=None): chỉ để loại trùng khi cả mẹ và con cùng được chọn."""
from power_fin_items import ITEMS  # noqa: F401

TICKERS = ['PVT', 'VTO', 'VIP', 'PVP', 'GSP', 'VOS', 'VNA', 'HAH']

GROUPS = [
    {'id': 'tanker', 'label': 'Tàu dầu, hóa chất & khí', 'color': '#2938A8', 'default': True},
    {'id': 'bulk', 'label': 'Hàng rời', 'color': '#c98a00', 'default': True},
    {'id': 'container', 'label': 'Container', 'color': '#2a9fa3', 'default': True},
]
COMPANIES = [
    {'ticker': 'PVT', 'group': 'tanker', 'mixed': True, 'note': 'PV Trans: tàu dầu thô, sản phẩm, LPG, hàng rời; FSO/FPSO'},
    {'ticker': 'VTO', 'group': 'tanker', 'note': 'Vitaco: tàu dầu sản phẩm, cho thuê định hạn'},
    {'ticker': 'VIP', 'group': 'tanker', 'note': 'Vipco: tàu dầu sản phẩm, kho xăng dầu'},
    {'ticker': 'PVP', 'group': 'tanker', 'note': 'Vận tải dầu khí Thái Bình Dương: tàu sản phẩm và LPG'},
    {'ticker': 'GSP', 'group': 'tanker', 'note': 'Gas Shipping: tàu LPG, hợp đồng dài với PV GAS'},
    {'ticker': 'VOS', 'group': 'bulk', 'note': 'Vosco: tàu hàng rời, chạy chuyến nhiều'},
    {'ticker': 'VNA', 'group': 'bulk', 'note': 'Vinaship: tàu hàng rời cỡ nhỏ'},
    {'ticker': 'HAH', 'group': 'container', 'mixed': True, 'note': 'Hải An: tàu container nội Á, cho thuê tàu, cảng'},
]
CONSOLIDATION = [
    {'parent': 'PVT', 'child': 'PVP', 'since': '2019Q1', 'ownership': None, 'source': '', 'note': 'công ty con của PV Trans; tỷ lệ chưa đối chiếu'},
]
ASSOCIATES = []
