"""Danh mục khoản mục BCTC và universe cho Tài chính ngành Xây dựng · VLXD · đầu tư công (Xay-dung/), cùng schema với ngành Điện, KCN.
Khoản mục (ITEMS) dùng chung với scripts/power_fin_items.py (mã VNDirect finfo, mẫu TT200/TT202) + khoản mục riêng của nhà thầu.
Dùng bởi fetch_xd_financials.py và build_xd_financials.py."""
from power_fin_items import ITEMS as POWER_ITEMS

# Khoản mục riêng của nhà thầu (26/11/2026). Mã VNDirect finfo kiểm trên CTD (financial_models, modelType 1, TT200):
# 11340 "Phải thu theo tiến độ kế hoạch hợp đồng xây dựng" và 13180 "Phải trả theo tiến độ kế hoạch hợp đồng xây dựng" là hai dòng
# riêng trên bảng cân đối theo TT200, không nằm trong "Phải thu khách hàng" (11310). Chi phí SXKD dở dang của công trình nằm TRONG
# hàng tồn kho (11400), bảng cân đối không tách; VAS không có dòng "tài sản hợp đồng" như IFRS 15.
ITEMS = POWER_ITEMS + [
    {'id': 'adv_customers', 'model': 1, 'code': 13130, 'kind': 'stock', 'name': 'Người mua trả tiền trước ngắn hạn'},
    {'id': 'adv_customers_lt', 'model': 1, 'code': 13311, 'kind': 'stock', 'name': 'Người mua trả tiền trước dài hạn'},
    {'id': 'prog_recv', 'model': 1, 'code': 11340, 'kind': 'stock', 'name': 'Phải thu theo tiến độ kế hoạch hợp đồng xây dựng'},
    {'id': 'prog_pay', 'model': 1, 'code': 13180, 'kind': 'stock', 'name': 'Phải trả theo tiến độ kế hoạch hợp đồng xây dựng'},
    {'id': 'adv_suppliers', 'model': 1, 'code': 11320, 'kind': 'stock', 'name': 'Trả trước cho người bán ngắn hạn'},
    {'id': 'wip_lt', 'model': 1, 'code': 12450, 'kind': 'stock', 'name': 'Chi phí sản xuất, kinh doanh dở dang dài hạn'},
]

# Universe: 17 mã đang theo dõi trên dashboard Xây dựng (thẻ "Doanh nghiệp theo dõi", 11/10/2026). Mã API không có quý thì bỏ.
TICKERS = ['CTD', 'HBC', 'VCG', 'FCN', 'DPG', 'C4G', 'LCG', 'HHV', 'CII', 'HUT', 'HT1', 'BCC', 'VLB', 'KSB', 'DHA', 'PLC', 'VGC']

# Nhóm theo mô hình kinh doanh (Tổng quan › Chuỗi giá trị theo mô hình). mixed=True: doanh nghiệp đa ngành — số BCTC là toàn
# doanh nghiệp, chỉ quy về một mảng khi doanh nghiệp công bố báo cáo bộ phận.
GROUPS = [
    {'id': 'civil', 'label': 'Nhà thầu dân dụng & nhà xưởng', 'color': '#2938A8', 'default': True},
    {'id': 'infra', 'label': 'Nhà thầu hạ tầng', 'color': '#2a9fa3', 'default': True},
    {'id': 'bot', 'label': 'Chủ đầu tư BOT & thu phí', 'color': '#861C52', 'default': True},
    {'id': 'materials', 'label': 'Vật liệu xây dựng', 'color': '#c98a00', 'default': True},
]
COMPANIES = [
    {'ticker': 'CTD', 'group': 'civil', 'note': 'Coteccons: tổng thầu dân dụng, nhà xưởng; năm tài chính 1/7–30/6 (số quý theo quý dương lịch của BCTC quý)'},
    {'ticker': 'HBC', 'group': 'civil', 'note': 'Hòa Bình: tổng thầu dân dụng'},
    {'ticker': 'VCG', 'group': 'infra', 'mixed': True, 'note': 'Vinaconex: xây lắp hạ tầng, sân bay; kèm bất động sản, đầu tư'},
    {'ticker': 'FCN', 'group': 'infra', 'note': 'Fecon: nền móng, công trình ngầm, hạ tầng'},
    {'ticker': 'DPG', 'group': 'infra', 'mixed': True, 'note': 'Đạt Phương: cầu đường, đường sắt; kèm thủy điện, bất động sản'},
    {'ticker': 'C4G', 'group': 'infra', 'note': 'Cienco4: thi công cầu đường'},
    {'ticker': 'LCG', 'group': 'infra', 'mixed': True, 'note': 'Lizen: thi công hạ tầng; kèm bất động sản, năng lượng'},
    {'ticker': 'HHV', 'group': 'bot', 'mixed': True, 'note': 'Đèo Cả: thu phí BOT và xây lắp hầm, cao tốc'},
    {'ticker': 'CII', 'group': 'bot', 'mixed': True, 'note': 'CII: BOT cầu đường, nước; kèm bất động sản, xây lắp'},
    {'ticker': 'HUT', 'group': 'bot', 'mixed': True, 'note': 'Tasco: BOT, thu phí không dừng (VETC); kèm bất động sản, phân phối ô tô'},
    {'ticker': 'HT1', 'group': 'materials', 'note': 'Vicem Hà Tiên: xi măng, clinker'},
    {'ticker': 'BCC', 'group': 'materials', 'note': 'Vicem Bỉm Sơn: xi măng, clinker'},
    {'ticker': 'VLB', 'group': 'materials', 'note': 'Biên Hòa: đá xây dựng'},
    {'ticker': 'KSB', 'group': 'materials', 'mixed': True, 'note': 'Khoáng sản Bình Dương: đá xây dựng; kèm KCN, bất động sản'},
    {'ticker': 'DHA', 'group': 'materials', 'note': 'Hóa An: đá xây dựng'},
    {'ticker': 'PLC', 'group': 'materials', 'mixed': True, 'note': 'Petrolimex Hóa dầu: nhựa đường; kèm dầu mỡ nhờn, hóa chất'},
    {'ticker': 'VGC', 'group': 'materials', 'mixed': True, 'note': 'Viglacera: kính, gạch, sứ; kèm khu công nghiệp (số hợp nhất gồm cả KCN)'},
]
# Quan hệ hợp nhất trong universe: không có công ty mẹ – con cùng niêm yết trong danh sách (BCC, HT1 cùng thuộc Vicem, ngoài universe).
CONSOLIDATION = []
ASSOCIATES = []
