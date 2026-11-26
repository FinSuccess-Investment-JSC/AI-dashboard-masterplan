"""Universe doanh nghiệp dệt may cho tab Tài chính ngành (Det-may/). Khoản mục BCTC dùng chung với Điện
(power_fin_items.ITEMS, mã VNDirect finfo, mẫu TT200). Dùng bởi fetch_textile_financials.py và build_textile_financials.py.

7 mã đã chốt 08/10/2026, nhóm theo khâu (khung 5 tab theo Dầu khí, 26/11/2026): Sợi & xơ · May xuất khẩu · Holding.
VGT nắm cổ phần thiểu số ở nhiều công ty dệt may nhưng không hợp nhất TCM, TNG, MSH, GIL, STK, ADS: không có cặp loại trùng."""
from power_fin_items import ITEMS  # noqa: F401

GROUPS = [
    {'id': 'yarn', 'label': 'Sợi & xơ', 'color': '#2a9fa3', 'default': True},
    {'id': 'garment', 'label': 'Dệt nhuộm – May', 'color': '#2938A8', 'default': True},
    {'id': 'holding', 'label': 'Tập đoàn (Vinatex)', 'color': '#c98a00', 'default': True},
]
COMPANIES = [
    {'ticker': 'STK', 'group': 'yarn', 'note': 'Sợi Thế Kỷ: sợi filament polyester (DTY, FDY), sợi tái chế'},
    {'ticker': 'ADS', 'group': 'yarn', 'note': 'Damsan: sợi cotton, sợi pha; dệt vải'},
    {'ticker': 'TCM', 'group': 'garment', 'note': 'Dệt may Thành Công: sợi – dệt – nhuộm – may khép kín, khách hàng Hàn, Nhật, Mỹ'},
    {'ticker': 'TNG', 'group': 'garment', 'note': 'TNG: may gia công và FOB, khách Decathlon, Columbia, The Children\'s Place'},
    {'ticker': 'MSH', 'group': 'garment', 'note': 'May Sông Hồng: may FOB/ODM sang Mỹ'},
    {'ticker': 'GIL', 'group': 'garment', 'mixed': True, 'note': 'Gilimex: may gia công, kinh doanh BĐS khu công nghiệp'},
    {'ticker': 'VGT', 'group': 'holding', 'mixed': True, 'note': 'Tập đoàn Dệt may Việt Nam (Vinatex): công ty mẹ và các công ty con sợi, dệt, may'},
]
TICKERS = [c['ticker'] for c in COMPANIES]
CONSOLIDATION = []
ASSOCIATES = []
