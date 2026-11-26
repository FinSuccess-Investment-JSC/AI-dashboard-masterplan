"""Universe doanh nghiệp cao su niêm yết cho tab Tài chính ngành (Cao-su/). Khoản mục BCTC dùng chung với Điện
(scripts/power_fin_items.py, mã VNDirect finfo mẫu TT200). Dùng bởi fetch_rubber_financials.py và build_rubber.py.

Nhóm: Tập đoàn (GVR hợp nhất), Trồng & khai thác mủ (thượng nguồn), Săm lốp (đo nhu cầu hạ nguồn, mặc định tắt).
Công ty con của GVR nằm trong GVR hợp nhất -> CONSOLIDATION để engine loại trùng khi cộng ngành (ghi đè bởi
data/rubber/group.json nếu có, nguồn BCTC hợp nhất GVR)."""
from power_fin_items import ITEMS  # noqa: F401  (cùng mã khoản mục)

GROUPS = [
    {'id': 'group', 'label': 'Tập đoàn GVR (hợp nhất)', 'color': '#1D2678', 'default': True},
    {'id': 'upstream', 'label': 'Trồng & khai thác mủ', 'color': '#2a9fa3', 'default': True},
    {'id': 'tire', 'label': 'Săm lốp (hạ nguồn)', 'color': '#c98a00', 'default': False},
]
COMPANIES = [
    {'ticker': 'GVR', 'group': 'group', 'note': 'Tập đoàn Công nghiệp Cao su Việt Nam: mủ, gỗ, KCN; hợp nhất nhiều công ty cao su'},
    {'ticker': 'PHR', 'group': 'upstream', 'note': 'Cao su Phước Hòa (Bình Dương): mủ, đền bù đất, KCN'},
    {'ticker': 'DPR', 'group': 'upstream', 'note': 'Cao su Đồng Phú (Bình Phước): mủ, KCN Bắc/Nam Đồng Phú'},
    {'ticker': 'TRC', 'group': 'upstream', 'note': 'Cao su Tây Ninh: mủ, vườn cây Campuchia'},
    {'ticker': 'DRI', 'group': 'upstream', 'note': 'Đầu tư Cao su Đắk Lắk: vườn cây tại Lào'},
    {'ticker': 'TNC', 'group': 'upstream', 'note': 'Cao su Thống Nhất (Bà Rịa – Vũng Tàu)'},
    {'ticker': 'HRC', 'group': 'upstream', 'note': 'Cao su Hòa Bình (Bà Rịa – Vũng Tàu)'},
    {'ticker': 'BRR', 'group': 'upstream', 'note': 'Cao su Bà Rịa'},
    {'ticker': 'DRG', 'group': 'upstream', 'note': 'Cao su Đắk Lắk'},
    {'ticker': 'RTB', 'group': 'upstream', 'note': 'Cao su Tân Biên (Tây Ninh)'},
    {'ticker': 'DRC', 'group': 'tire', 'note': 'Cao su Đà Nẵng: lốp tải, lốp radial'},
    {'ticker': 'CSM', 'group': 'tire', 'note': 'Cao su Miền Nam (Casumina): săm lốp'},
    {'ticker': 'SRC', 'group': 'tire', 'note': 'Cao su Sao Vàng: săm lốp'},
]
TICKERS = [c['ticker'] for c in COMPANIES]
CONSOLIDATION = []  # điền từ data/rubber/group.json (build_rubber.py)
ASSOCIATES = []
