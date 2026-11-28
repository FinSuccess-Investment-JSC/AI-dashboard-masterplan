"""Universe doanh nghiệp chăn nuôi cho tab Tài chính ngành (Chan-nuoi/). Khoản mục BCTC dùng chung với Dệt may / Thép / Dược
(textile_fin_items.ITEMS: mã VNDirect finfo, mẫu TT200). Dùng bởi fetch_livestock_financials.py và build_livestock_financials.py.

28/11/2026 (người dùng sửa): DBC và BAF cùng làm khép kín thức ăn → giống → nuôi heo nên chung một nhóm; thêm HPA, MML.
5 mã, nhóm theo mô hình kinh doanh:
  Chuỗi khép kín thức ăn – giống – heo (DBC, BAF, HPA) · Chăn nuôi – chế biến thịt (MML) · Chăn nuôi & cây ăn trái (HAG).
DBC có mảng bất động sản, HAG có mảng trái cây lớn, HPA có thêm bò, trứng gà → mixed=True.
HPA (công ty con của HPG) có BCTC trên VNDirect từ Q1/2025; MML (công ty con của MSN) đã bán mảng thức ăn chăn nuôi năm 2021.
Không có quan hệ mẹ – con giữa 5 mã trong rổ nên không loại trùng."""
from textile_fin_items import ITEMS  # noqa: F401

GROUPS = [
    {'id': 'chain', 'label': 'Chuỗi khép kín thức ăn – giống – heo', 'color': '#2938A8', 'default': True},
    {'id': 'meat', 'label': 'Chăn nuôi – chế biến thịt', 'color': '#2a9fa3', 'default': True},
    {'id': 'mixed', 'label': 'Chăn nuôi & cây ăn trái', 'color': '#c98a00', 'default': True},
]
COMPANIES = [
    {'ticker': 'DBC', 'group': 'chain', 'mixed': True, 'note': 'Dabaco: thức ăn chăn nuôi, con giống, heo thịt, thịt chế biến; có mảng bất động sản'},
    {'ticker': 'BAF', 'group': 'chain', 'note': 'BAF Việt Nam: thức ăn tự sản xuất, con giống, heo thịt trang trại công nghệ cao'},
    {'ticker': 'HPA', 'group': 'chain', 'mixed': True, 'note': 'Nông nghiệp Hòa Phát: thức ăn chăn nuôi, heo giống và heo thịt, bò, trứng gà; BCTC từ Q1/2025'},
    {'ticker': 'MML', 'group': 'meat', 'note': 'Masan MEATLife: trại heo, gà, thịt mát MEATDeli và thịt chế biến; đã bán mảng thức ăn năm 2021'},
    {'ticker': 'HAG', 'group': 'mixed', 'mixed': True, 'note': 'Hoàng Anh Gia Lai: heo thịt, chuối, sầu riêng và cây ăn trái khác'},
]
TICKERS = [c['ticker'] for c in COMPANIES]
CONSOLIDATION = []
ASSOCIATES = []
