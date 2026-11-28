"""Universe doanh nghiệp mía đường cho tab Tài chính ngành (Sugar/). Khoản mục BCTC dùng chung với Dệt may
(textile_fin_items.ITEMS: mã VNDirect finfo, mẫu TT200, thêm khoản mục cho bảng tỷ số). Dùng bởi fetch_sugar_financials.py
và build_sugar_financials.py (27/11/2026).

5 mã. 28/11/2026 (người dùng: "đường còn nhiều mã khác") đã rà danh sách niêm yết VNDirect: chỉ còn CBS (Mía đường Cao Bằng, UPCOM) nhưng VNDirect không có BCTC quý, số năm dừng ở 2022 nên chưa đưa vào; BHS, NHS, SEC đã hủy niêm yết sau sáp nhập vào SBT, nhóm theo mô hình: Mía đường thuần · Mía đường & thương mại (SBT) · Đa ngành (QNS).
Không có cặp hợp nhất mẹ – con trong rổ."""
from textile_fin_items import ITEMS  # noqa: F401

GROUPS = [
    {'id': 'mill', 'label': 'Mía đường', 'color': '#2a9fa3', 'default': True},
    {'id': 'trade', 'label': 'Mía đường & thương mại', 'color': '#2938A8', 'default': True},
    {'id': 'multi', 'label': 'Đa ngành', 'color': '#c98a00', 'default': True},
]
COMPANIES = [
    {'ticker': 'SLS', 'group': 'mill', 'note': 'Mía đường Sơn La: đường từ mía vùng Tây Bắc'},
    {'ticker': 'LSS', 'group': 'mill', 'note': 'Mía đường Lam Sơn (Thanh Hóa): đường, cồn, phân bón'},
    {'ticker': 'KTS', 'group': 'mill', 'note': 'Đường Kon Tum: đường từ mía Tây Nguyên'},
    {'ticker': 'SBT', 'group': 'trade', 'mixed': True, 'note': 'TTC AgriS: mía đường, thương mại đường, nông nghiệp công nghệ cao'},
    {'ticker': 'QNS', 'group': 'multi', 'mixed': True, 'note': 'Đường Quảng Ngãi: đường, sữa đậu nành Vinasoy, bia, bánh kẹo, điện sinh khối'},
]
TICKERS = [c['ticker'] for c in COMPANIES]
CONSOLIDATION = []
ASSOCIATES = []
