"""Doanh nghiệp xút – clo niêm yết cho tab Tài chính ngành (Xut-clo/). Khoản mục BCTC dùng chung với Điện
(scripts/power_fin_items.py, mã VNDirect finfo mẫu TT200). Dùng bởi fetch_chloralkali_financials.py và build_chloralkali.py.

Phạm vi: BCTC hợp nhất toàn doanh nghiệp, không phải riêng mảng xút. DGC hợp nhất chủ yếu là phốt pho vàng và hóa chất
gốc phốt pho; dự án xút – clo Nghi Sơn (Đức Giang Nghi Sơn) nằm trong hợp nhất DGC."""
from power_fin_items import ITEMS  # noqa: F401  (cùng mã khoản mục)

GROUPS = [
    {'id': 'merchant', 'label': 'Xút thương mại', 'color': '#2938A8', 'default': True},
    {'id': 'project', 'label': 'Dự án Nghi Sơn (DGC hợp nhất)', 'color': '#c98a00', 'default': True},
]
COMPANIES = [
    {'ticker': 'CSV', 'group': 'merchant', 'note': 'Hóa chất Cơ bản Miền Nam: xút, axit, sản phẩm gốc clo (hợp nhất cả Hóa chất Biên Hòa)'},
    {'ticker': 'HVT', 'group': 'merchant', 'note': 'Hóa chất Việt Trì: xút, HCl, PAC, sản phẩm gốc clo'},
    {'ticker': 'DGC', 'group': 'project', 'note': 'Hóa chất Đức Giang: phốt pho vàng và hóa chất gốc phốt pho; dự án xút – clo Nghi Sơn'},
]
TICKERS = [c['ticker'] for c in COMPANIES]
CONSOLIDATION = []
ASSOCIATES = []
