"""Universe doanh nghiệp chăn nuôi cho tab Tài chính ngành (Chan-nuoi/). Khoản mục BCTC dùng chung với Dệt may / Thép / Dược
(textile_fin_items.ITEMS: mã VNDirect finfo, mẫu TT200). Dùng bởi fetch_livestock_financials.py và build_livestock_financials.py (28/11/2026).

3 mã niêm yết đang theo dõi trên trang Chăn nuôi (scripts/update_company_comparison.py 'livestock'), nhóm theo mô hình:
Chuỗi thức ăn – giống – thịt (DBC) · Chăn nuôi heo (BAF) · Chăn nuôi & cây ăn trái (HAG).
DBC có mảng bất động sản, HAG có mảng trái cây lớn → mixed=True. Không có quan hệ mẹ – con giữa 3 mã."""
from textile_fin_items import ITEMS  # noqa: F401

GROUPS = [
    {'id': 'chain', 'label': 'Chuỗi thức ăn – giống – thịt', 'color': '#2938A8', 'default': True},
    {'id': 'hog', 'label': 'Chăn nuôi heo', 'color': '#2a9fa3', 'default': True},
    {'id': 'mixed', 'label': 'Chăn nuôi & cây ăn trái', 'color': '#c98a00', 'default': True},
]
COMPANIES = [
    {'ticker': 'DBC', 'group': 'chain', 'mixed': True, 'note': 'Dabaco: thức ăn chăn nuôi, con giống, heo thịt, thịt chế biến; có mảng bất động sản'},
    {'ticker': 'BAF', 'group': 'hog', 'note': 'BAF Việt Nam: heo thịt trang trại công nghệ cao, thức ăn tự sản xuất'},
    {'ticker': 'HAG', 'group': 'mixed', 'mixed': True, 'note': 'Hoàng Anh Gia Lai: heo thịt, chuối, sầu riêng và cây ăn trái khác'},
]
TICKERS = [c['ticker'] for c in COMPANIES]
CONSOLIDATION = []
ASSOCIATES = []
