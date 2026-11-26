"""Universe và nhóm doanh nghiệp cho tab Tài chính ngành Hàng không (Hang-khong/). Khoản mục BCTC dùng chung với ngành Điện
(power_fin_items.ITEMS, mã VNDirect finfo, mẫu TT200). Dùng bởi fetch_aviation_financials.py và build_aviation_financials.py.

Phạm vi 26/11/2026: hãng bay (HVN, VJC), cảng hàng không (ACV), dịch vụ hàng hóa (SCS, NCT), phục vụ mặt đất (SGN),
bán lẻ – suất ăn sân bay (AST, SAS). BCTC hợp nhất (VNDirect lấy báo cáo hợp nhất khi doanh nghiệp có công ty con)."""
from power_fin_items import ITEMS  # noqa: F401

TICKERS = ['HVN', 'VJC', 'ACV', 'SCS', 'NCT', 'SGN', 'AST', 'SAS']

GROUPS = [
    {'id': 'airline', 'label': 'Hãng bay', 'color': '#2938A8', 'default': True},
    {'id': 'airport', 'label': 'Cảng hàng không', 'color': '#c29100', 'default': True},
    {'id': 'cargo', 'label': 'Nhà ga hàng hóa', 'color': '#861C52', 'default': True},
    {'id': 'service', 'label': 'Dịch vụ sân bay', 'color': '#27af95', 'default': True},
]
COMPANIES = [
    {'ticker': 'HVN', 'group': 'airline', 'note': 'Vietnam Airlines: vận tải hành khách, hàng hóa; hợp nhất Pacific Airlines, VASCO'},
    {'ticker': 'VJC', 'group': 'airline', 'note': 'Vietjet: vận tải hành khách, phụ trợ; có doanh thu bán và thuê lại tàu bay'},
    {'ticker': 'ACV', 'group': 'airport', 'note': 'Tổng công ty Cảng hàng không Việt Nam: 21 cảng, chủ đầu tư Long Thành'},
    {'ticker': 'SCS', 'group': 'cargo', 'note': 'Saigon Cargo Service: nhà ga hàng hóa Tân Sơn Nhất'},
    {'ticker': 'NCT', 'group': 'cargo', 'note': 'Noibai Cargo: nhà ga hàng hóa Nội Bài'},
    {'ticker': 'SGN', 'group': 'service', 'note': 'SAGS: phục vụ mặt đất'},
    {'ticker': 'AST', 'group': 'service', 'note': 'Taseco Airs: bán lẻ, ẩm thực tại nhà ga'},
    {'ticker': 'SAS', 'group': 'service', 'note': 'SASCO: dịch vụ thương mại hàng không Tân Sơn Nhất'},
]
