"""Danh mục khoản mục BCTC và universe cho Tài chính ngành Khu công nghiệp (KCN), cùng schema với ngành Điện.
Khoản mục (ITEMS) dùng chung với scripts/power_fin_items.py (mã VNDirect finfo, mẫu TT200/TT202).
Dùng bởi fetch_kcn_financials.py và build_kcn_financials.py."""
from power_fin_items import ITEMS as POWER_ITEMS

# Khoản mục chung với ngành Điện + khoản mục riêng của KCN (26/11/2026): tiền khách thuê trả trước, doanh thu chưa thực hiện
# (tiền thuê đất nhận trước chưa ghi nhận), chi phí dở dang dài hạn và bất động sản đầu tư (hạ tầng KCN cho thuê).
# Mã VNDirect finfo kiểm trên KBC Q3/2026 (financial_models, modelType 1).
ITEMS = POWER_ITEMS + [
    {'id': 'adv_customers', 'model': 1, 'code': 13130, 'kind': 'stock', 'name': 'Người mua trả tiền trước ngắn hạn'},
    {'id': 'unearned_st', 'model': 1, 'code': 13199, 'kind': 'stock', 'name': 'Doanh thu chưa thực hiện ngắn hạn'},
    {'id': 'unearned_lt', 'model': 1, 'code': 13197, 'kind': 'stock', 'name': 'Doanh thu chưa thực hiện dài hạn'},
    {'id': 'wip_lt', 'model': 1, 'code': 12450, 'kind': 'stock', 'name': 'Chi phí sản xuất, kinh doanh dở dang dài hạn'},
    {'id': 'inv_property', 'model': 1, 'code': 12400, 'kind': 'stock', 'name': 'Bất động sản đầu tư'},
]

# Universe: doanh nghiệp KCN niêm yết (25/11/2026). Mã nào API không có dữ liệu quý thì bỏ khỏi danh sách.
TICKERS = ['KBC', 'IDC', 'BCM', 'SZC', 'SIP', 'VGC', 'LHG', 'NTC', 'D2D', 'TIP']

# default=True: thuộc tổng hợp "doanh nghiệp KCN" mặc định. Đa ngành có mảng KCN không gộp mặc định.
# report: loại BCTC doanh nghiệp lập (theo BCTC kiểm toán 2025, data/kcn/company-policy.json): 'consolidated' hợp nhất; 'separate' chỉ lập BCTC riêng
# (LHG, NTC, D2D không có công ty con). VNDirect finfo trả BCTC cùng loại cho các kỳ quý.
# mixed=True: doanh nghiệp có mảng ngoài KCN lớn (bất động sản đô thị, vật liệu, tiện ích…), số theo nhóm chỉ để tham khảo.
GROUPS = [
    {'id': 'north', 'label': 'KCN miền Bắc', 'color': '#2938A8', 'default': True},
    {'id': 'south', 'label': 'KCN miền Nam', 'color': '#2a9fa3', 'default': True},
    {'id': 'diversified', 'label': 'Đa ngành có mảng KCN', 'color': '#9AA3BD', 'default': False},
]
COMPANIES = [
    {'ticker': 'KBC', 'report': 'consolidated', 'group': 'north', 'mixed': True, 'note': 'Kinh Bắc: KCN Quang Châu, Tràng Duệ, Nam Sơn Hạp Lĩnh…; kèm bất động sản đô thị'},
    {'ticker': 'IDC', 'report': 'consolidated', 'group': 'south', 'note': 'IDICO: KCN Phú Mỹ 2, Phú Mỹ 2 mở rộng, Hựu Thạnh…; có thủy điện, BOT'},
    {'ticker': 'SZC', 'report': 'consolidated', 'group': 'south', 'note': 'Sonadezi Châu Đức: KCN Châu Đức (Bà Rịa – Vũng Tàu)'},
    {'ticker': 'SIP', 'report': 'consolidated', 'group': 'south', 'mixed': True, 'note': 'Sài Gòn VRG: KCN Phước Đông, Lê Minh Xuân, Đông Nam; kèm điện, nước (tiện ích)'},
    {'ticker': 'LHG', 'report': 'separate', 'group': 'south', 'note': 'Long Hậu: KCN Long Hậu (Long An)'},
    {'ticker': 'NTC', 'report': 'separate', 'group': 'south', 'note': 'Nam Tân Uyên: KCN Nam Tân Uyên và mở rộng (Bình Dương)'},
    {'ticker': 'D2D', 'report': 'separate', 'group': 'south', 'mixed': True, 'note': 'Đô thị Công nghiệp số 2: KCN Nhơn Trạch 2; kèm bất động sản dân cư'},
    {'ticker': 'TIP', 'report': 'consolidated', 'group': 'south', 'note': 'Tín Nghĩa: KCN Phú Mỹ 1, Long Đức'},
    {'ticker': 'BCM', 'report': 'consolidated', 'group': 'diversified', 'mixed': True, 'note': 'Becamex IDC: KCN, đô thị, hạ tầng giao thông'},
    {'ticker': 'VGC', 'report': 'consolidated', 'group': 'diversified', 'mixed': True, 'note': 'Viglacera: KCN và vật liệu xây dựng'},
]
# Quan hệ hợp nhất trong universe: không có (kiểm cổ đông lớn trên VNDirect finfo /v4/shareholders, 25/11/2026):
# D2D, SZC là con của Sonadezi (SNZ), NTC của Cao su Phước Hòa/VRG, TIP của CTCP Tín Nghĩa, LHG của IPC Tân Thuận —
# công ty mẹ đều ngoài universe. NTC giữ 6,8% SIP (dưới ngưỡng liên kết 20%).
CONSOLIDATION = []
ASSOCIATES = []
