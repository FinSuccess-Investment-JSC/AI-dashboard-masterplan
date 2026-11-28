"""Universe doanh nghiệp thủy sản cho tab Tài chính ngành của Ca-tra/ và Tom/ (28/11/2026). Khoản mục BCTC dùng chung với
Dệt may / Thép / Dược / Chăn nuôi (textile_fin_items.ITEMS: mã VNDirect finfo, mẫu TT200). Dùng bởi
fetch_seafood_financials.py và build_seafood_financials.py; số ghi chung data/seafood-financials.js (window.SEAFOOD_FIN),
mỗi trang lọc nhóm của mình lúc nạp (app/seafood-line.js: Cá tra = nhóm pang + multi; Tôm = nhóm shrimp).

7 mã, nhóm theo DASHBOARD_WORKFLOW §36 (cùng rổ biên gộp ts-06):
  Cá tra (VHC, ANV, IDI) · Đa ngành (ASM: thức ăn thủy sản, cá tra qua IDI, gạo, BĐS…) · Tôm (FMC, CMX, MPC).
ASM hợp nhất IDI (công ty con) nên khi cả hai cùng trong rổ thì trừ IDI khỏi tổng (CONSOLIDATION); tỷ lệ sở hữu chưa đối chiếu
báo cáo thường niên. MPC có BCTC quý trên VNDirect finfo (kiểm 28/11/2026: Q1/2024–Q3/2026)."""
from textile_fin_items import ITEMS  # noqa: F401

GROUPS = [
    {'id': 'pang', 'label': 'Cá tra', 'color': '#2938A8', 'default': True, 'line': 'pang'},
    {'id': 'multi', 'label': 'Đa ngành (thức ăn, cá tra, nông sản)', 'color': '#c29100', 'default': True, 'line': 'pang'},
    {'id': 'shrimp', 'label': 'Tôm', 'color': '#861C52', 'default': True, 'line': 'shrimp'},
]
COMPANIES = [
    {'ticker': 'VHC', 'group': 'pang', 'note': 'Vĩnh Hoàn: cá tra khép kín giống – nuôi – chế biến phi lê; collagen, gelatin; thực phẩm chế biến'},
    {'ticker': 'ANV', 'group': 'pang', 'note': 'Nam Việt: cá tra khép kín, tự sản xuất thức ăn; collagen'},
    {'ticker': 'IDI', 'group': 'pang', 'note': 'I.D.I: chế biến, xuất khẩu cá tra; công ty con của ASM'},
    {'ticker': 'ASM', 'group': 'multi', 'mixed': True, 'note': 'Sao Mai: thức ăn thủy sản, cá tra (hợp nhất IDI), dầu cá, gạo, bất động sản, năng lượng'},
    {'ticker': 'FMC', 'group': 'shrimp', 'note': 'Sao Ta: chế biến tôm xuất khẩu, nuôi một phần nguyên liệu; nông sản'},
    {'ticker': 'CMX', 'group': 'shrimp', 'note': 'Camimex: chế biến tôm xuất khẩu, nuôi tôm sinh thái; thức ăn'},
    {'ticker': 'MPC', 'group': 'shrimp', 'note': 'Minh Phú: chế biến tôm xuất khẩu quy mô lớn nhất, giống và nuôi tôm'},
]
TICKERS = [c['ticker'] for c in COMPANIES]
CONSOLIDATION = [
    {'parent': 'ASM', 'child': 'IDI', 'since': '2019Q1', 'ownership': None, 'source': '', 'note': 'công ty con của Sao Mai; tỷ lệ chưa đối chiếu'},
]
ASSOCIATES = []
