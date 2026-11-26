"""Universe và nhóm doanh nghiệp cho tab Tài chính ngành (Dau-khi/). Khoản mục BCTC dùng chung với ngành Điện
(power_fin_items.ITEMS, mã VNDirect finfo, mẫu TT200). Dùng bởi fetch_oil_financials.py và build_oil_financials.py.

Nhóm theo khâu trong chuỗi dầu khí (người dùng chốt 26/11/2026): Thượng nguồn · Trung nguồn · Hạ nguồn.
Tỷ lệ sở hữu trong CONSOLIDATION chưa đối chiếu báo cáo thường niên (ownership=None): chỉ dùng để loại trùng doanh thu khi
cả mẹ và con cùng nằm trong nhóm đang chọn."""
from power_fin_items import ITEMS  # noqa: F401

TICKERS = ['PVS', 'PVD', 'PVB', 'GAS', 'PVT', 'CNG', 'PVP', 'BSR', 'PLX', 'OIL', 'PLC', 'PET']

GROUPS = [
    {'id': 'upstream', 'label': 'Thượng nguồn (dịch vụ E&P)', 'color': '#2938A8', 'default': True},
    {'id': 'midstream', 'label': 'Trung nguồn (khí, vận tải)', 'color': '#2a9fa3', 'default': True},
    {'id': 'downstream', 'label': 'Hạ nguồn (lọc dầu, phân phối)', 'color': '#c98a00', 'default': True},
]
COMPANIES = [
    {'ticker': 'PVS', 'group': 'upstream', 'mixed': True, 'note': 'PTSC: cơ khí – xây lắp dầu khí (EPC), FSO/FPSO, dịch vụ cảng và tàu'},
    {'ticker': 'PVD', 'group': 'upstream', 'note': 'PV Drilling: cho thuê giàn khoan, dịch vụ kỹ thuật giếng'},
    {'ticker': 'PVB', 'group': 'upstream', 'note': 'Bọc ống dầu khí: bọc ống cho đường ống dẫn khí'},
    {'ticker': 'GAS', 'group': 'midstream', 'note': 'PV GAS: thu gom, vận chuyển, xử lý và phân phối khí, LPG, LNG'},
    {'ticker': 'PVT', 'group': 'midstream', 'note': 'PV Trans: vận tải dầu thô, sản phẩm, khí hóa lỏng và hàng rời'},
    {'ticker': 'CNG', 'group': 'midstream', 'note': 'CNG Việt Nam: khí nén CNG, LNG cho công nghiệp'},
    {'ticker': 'PVP', 'group': 'midstream', 'note': 'Vận tải dầu khí Thái Bình Dương: vận tải sản phẩm dầu và LPG'},
    {'ticker': 'BSR', 'group': 'downstream', 'note': 'Lọc hóa dầu Bình Sơn: Nhà máy lọc dầu Dung Quất'},
    {'ticker': 'PLX', 'group': 'downstream', 'mixed': True, 'note': 'Petrolimex: phân phối xăng dầu, hóa dầu, vận tải, bảo hiểm'},
    {'ticker': 'OIL', 'group': 'downstream', 'note': 'PV OIL: kinh doanh, phân phối xăng dầu'},
    {'ticker': 'PLC', 'group': 'downstream', 'note': 'Hóa dầu Petrolimex: dầu mỡ nhờn, nhựa đường, hóa chất'},
    {'ticker': 'PET', 'group': 'downstream', 'mixed': True, 'note': 'Petrosetco: phân phối thiết bị điện tử, dịch vụ dầu khí'},
]
CONSOLIDATION = [
    {'parent': 'PLX', 'child': 'PLC', 'since': '2019Q1', 'ownership': None, 'source': '', 'note': 'công ty con của Petrolimex; tỷ lệ chưa đối chiếu'},
    {'parent': 'PVT', 'child': 'PVP', 'since': '2019Q1', 'ownership': None, 'source': '', 'note': 'công ty con của PV Trans; tỷ lệ chưa đối chiếu'},
]
ASSOCIATES = []
