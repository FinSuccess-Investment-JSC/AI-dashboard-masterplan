"""Universe và nhóm doanh nghiệp cho tab Tài chính ngành (Dau-khi/). Khoản mục BCTC dùng chung với ngành Điện
(power_fin_items.ITEMS, mã VNDirect finfo, mẫu TT200). Dùng bởi fetch_oil_financials.py và build_oil_financials.py.

Nhóm theo mô hình kinh doanh (28/11/2026, người dùng duyệt tách 3 khâu cũ): dịch vụ thượng nguồn · khí · vận tải · lọc dầu ·
phân phối xăng dầu · hóa dầu & thương mại khác. Lý do: lọc dầu (theo crack spread) và phân phối (biên định mức) ngược nhau khi gộp
chung "hạ nguồn"; GAS chiếm gần hết "trung nguồn" nên che vận tải.
Tỷ lệ sở hữu trong CONSOLIDATION chưa đối chiếu báo cáo thường niên (ownership=None): chỉ dùng để loại trùng khi
cả mẹ và con cùng nằm trong nhóm đang chọn."""
from power_fin_items import ITEMS  # noqa: F401

TICKERS = ['PVS', 'PVD', 'PVB', 'GAS', 'PVT', 'CNG', 'PVP', 'BSR', 'PLX', 'OIL', 'PLC', 'PET']

GROUPS = [
    {'id': 'upstream', 'label': 'Dịch vụ thượng nguồn', 'color': '#2938A8', 'default': True},
    {'id': 'gas', 'label': 'Khí', 'color': '#2a9fa3', 'default': True},
    {'id': 'shipping', 'label': 'Vận tải dầu khí', 'color': '#8997D6', 'default': True},
    {'id': 'refining', 'label': 'Lọc dầu', 'color': '#c98a00', 'default': True},
    {'id': 'distribution', 'label': 'Phân phối xăng dầu', 'color': '#861C52', 'default': True},
    {'id': 'other', 'label': 'Hóa dầu & thương mại khác', 'color': '#9AA3BD', 'default': True},
]
COMPANIES = [
    {'ticker': 'PVS', 'group': 'upstream', 'mixed': True, 'note': 'PTSC: cơ khí – xây lắp dầu khí (EPC), FSO/FPSO, dịch vụ cảng và tàu'},
    {'ticker': 'PVD', 'group': 'upstream', 'note': 'PV Drilling: cho thuê giàn khoan, dịch vụ kỹ thuật giếng'},
    {'ticker': 'PVB', 'group': 'upstream', 'note': 'Bọc ống dầu khí: bọc ống cho đường ống dẫn khí'},
    {'ticker': 'GAS', 'group': 'gas', 'note': 'PV GAS: thu gom, vận chuyển, xử lý và phân phối khí, LPG, LNG'},
    {'ticker': 'CNG', 'group': 'gas', 'note': 'CNG Việt Nam: khí nén CNG, LNG cho công nghiệp; công ty con của PV GAS'},
    {'ticker': 'PVT', 'group': 'shipping', 'note': 'PV Trans: vận tải dầu thô, sản phẩm, khí hóa lỏng và hàng rời'},
    {'ticker': 'PVP', 'group': 'shipping', 'note': 'Vận tải dầu khí Thái Bình Dương: vận tải sản phẩm dầu và LPG'},
    {'ticker': 'BSR', 'group': 'refining', 'note': 'Lọc hóa dầu Bình Sơn: Nhà máy lọc dầu Dung Quất'},
    {'ticker': 'PLX', 'group': 'distribution', 'mixed': True, 'note': 'Petrolimex: phân phối xăng dầu, hóa dầu, vận tải, bảo hiểm'},
    {'ticker': 'OIL', 'group': 'distribution', 'note': 'PV OIL: kinh doanh, phân phối xăng dầu'},
    {'ticker': 'PLC', 'group': 'other', 'note': 'Hóa dầu Petrolimex: dầu mỡ nhờn, nhựa đường, hóa chất (dầu gốc là đầu vào)'},
    {'ticker': 'PET', 'group': 'other', 'mixed': True, 'note': 'Petrosetco: phân phối thiết bị điện tử, dịch vụ dầu khí'},
]
CONSOLIDATION = [
    {'parent': 'PLX', 'child': 'PLC', 'since': '2019Q1', 'ownership': None, 'source': '', 'note': 'công ty con của Petrolimex; tỷ lệ chưa đối chiếu'},
    {'parent': 'PVT', 'child': 'PVP', 'since': '2019Q1', 'ownership': None, 'source': '', 'note': 'công ty con của PV Trans; tỷ lệ chưa đối chiếu'},
    {'parent': 'GAS', 'child': 'CNG', 'since': '2019Q1', 'ownership': None, 'source': 'https://vnbusiness.vn/gas-da-mua-552-von-cng.html',
     'note': 'công ty con của PV GAS từ 2015 (mua khoảng 55–56%); tỷ lệ hiện tại chưa đối chiếu báo cáo thường niên'},
]
ASSOCIATES = []
