"""Universe doanh nghiệp phân bón niêm yết cho tab Tài chính ngành (Phan-bon/). Khoản mục BCTC dùng chung với Điện
(scripts/power_fin_items.py, mã VNDirect finfo mẫu TT200). Dùng bởi fetch_fertilizer_financials.py và build_fertilizer.py.

Nhóm theo sản phẩm chính (doanh thu lớn nhất). Chỉ gồm doanh nghiệp sản xuất; không có quan hệ hợp nhất mẹ – con giữa
các mã trong danh sách nên không cần loại trùng."""
from power_fin_items import ITEMS  # noqa: F401  (cùng mã khoản mục)

GROUPS = [
    {'id': 'urea_gas', 'label': 'Đạm urê từ khí', 'color': '#2938A8', 'default': True},
    {'id': 'urea_coal', 'label': 'Đạm urê từ than', 'color': '#3d4653', 'default': True},
    {'id': 'phosphate', 'label': 'Lân & DAP', 'color': '#c98a00', 'default': True},
    {'id': 'npk', 'label': 'NPK phối trộn', 'color': '#2a9fa3', 'default': True},
]
COMPANIES = [
    {'ticker': 'DPM', 'group': 'urea_gas', 'note': 'Đạm Phú Mỹ: urê từ khí, NPK, amoniac, hóa chất'},
    {'ticker': 'DCM', 'group': 'urea_gas', 'note': 'Đạm Cà Mau: urê từ khí, NPK'},
    {'ticker': 'DHB', 'group': 'urea_coal', 'note': 'Đạm Hà Bắc: urê từ than'},
    {'ticker': 'DDV', 'group': 'phosphate', 'note': 'DAP Vinachem (Đình Vũ)'},
    {'ticker': 'LAS', 'group': 'phosphate', 'note': 'Supe phốt phát Lâm Thao: supe lân, NPK'},
    {'ticker': 'VAF', 'group': 'phosphate', 'note': 'Văn Điển: lân nung chảy, NPK'},
    {'ticker': 'NFC', 'group': 'phosphate', 'note': 'Phân lân Ninh Bình: lân nung chảy, NPK'},
    {'ticker': 'BFC', 'group': 'npk', 'note': 'Phân bón Bình Điền: NPK'},
    {'ticker': 'SFG', 'group': 'npk', 'note': 'Phân bón Miền Nam: NPK, supe lân'},
]
TICKERS = [c['ticker'] for c in COMPANIES]
CONSOLIDATION = []
ASSOCIATES = []
