"""Khoản mục BCTC (mã VNDirect finfo, mẫu TT200) và universe cho Ô tô – Xe máy › Mô hình kiếm tiền.
Kiểm mã khoản mục 28/11/2026 trên VEA năm 2025 (23300 = 6.630 tỷ phần lãi liên doanh, liên kết; 32700 = tiền thu lãi,
cổ tức, lợi nhuận được chia; 33600 = cổ tức đã trả). sign = -1: nguồn ghi số âm cho khoản chi, đổi về số dương."""

ITEMS = [
    {'id': 'revenue', 'model': 2, 'code': 21001, 'name': 'Doanh thu thuần'},
    {'id': 'cogs', 'model': 2, 'code': 22100, 'name': 'Giá vốn hàng bán'},
    {'id': 'gross', 'model': 2, 'code': 23100, 'name': 'Lợi nhuận gộp'},
    {'id': 'fin_income', 'model': 2, 'code': 21500, 'name': 'Doanh thu hoạt động tài chính'},
    {'id': 'interest', 'model': 2, 'code': 22510, 'name': 'Chi phí lãi vay'},
    {'id': 'assoc', 'model': 2, 'code': 23300, 'name': 'Phần lãi/lỗ trong công ty liên doanh, liên kết'},
    {'id': 'selling', 'model': 2, 'code': 22110, 'name': 'Chi phí bán hàng'},
    {'id': 'admin', 'model': 2, 'code': 22200, 'name': 'Chi phí quản lý doanh nghiệp'},
    {'id': 'op_profit', 'model': 2, 'code': 23110, 'name': 'Lợi nhuận thuần từ hoạt động kinh doanh'},
    {'id': 'other', 'model': 2, 'code': 23900, 'name': 'Lợi nhuận khác'},
    {'id': 'pbt', 'model': 2, 'code': 23800, 'name': 'Lợi nhuận trước thuế'},
    {'id': 'npat', 'model': 2, 'code': 23003, 'name': 'Lợi nhuận sau thuế (hợp nhất)'},
    {'id': 'npat_parent', 'model': 2, 'code': 23000, 'name': 'LNST thuộc cổ đông công ty mẹ'},
    {'id': 'capex', 'model': 3, 'code': 32100, 'sign': -1, 'name': 'Tiền chi mua sắm, xây dựng TSCĐ'},
    {'id': 'cash_div_int_recv', 'model': 3, 'code': 32700, 'name': 'Tiền thu lãi cho vay, cổ tức và lợi nhuận được chia'},
    {'id': 'dividends_paid', 'model': 3, 'code': 33600, 'sign': -1, 'name': 'Cổ tức, lợi nhuận đã trả cho chủ sở hữu'},
    {'id': 'cfo', 'model': 3, 'code': 32000, 'name': 'Lưu chuyển tiền thuần từ hoạt động kinh doanh'},
    {'id': 'cash', 'model': 1, 'code': 11100, 'name': 'Tiền và tương đương tiền'},
    {'id': 'st_invest', 'model': 1, 'code': 11200, 'name': 'Đầu tư tài chính ngắn hạn'},
    {'id': 'inventory', 'model': 1, 'code': 11400, 'name': 'Hàng tồn kho'},
    {'id': 'ppe_net', 'model': 1, 'code': 12210, 'name': 'TSCĐ hữu hình (giá trị còn lại)'},
    {'id': 'total_assets', 'model': 1, 'code': 12700, 'name': 'Tổng tài sản'},
    {'id': 'st_debt', 'model': 1, 'code': 13110, 'name': 'Vay và nợ thuê tài chính ngắn hạn'},
    {'id': 'lt_debt', 'model': 1, 'code': 13340, 'name': 'Vay và nợ thuê tài chính dài hạn'},
    {'id': 'equity', 'model': 1, 'code': 14000, 'name': 'Vốn chủ sở hữu'},
]

TICKERS = ['VEA', 'HAX', 'SVC', 'CTF', 'TMT']

# Tài chính ngành › 01 (28/11/2026): số cộng gộp BCTC quý (scripts/build_auto_financials.py → data/auto-financials.js).
# Khoản mục đầy đủ dùng chung Dệt may / Thép / Dược / Chăn nuôi (textile_fin_items.ITEMS); fetch_auto_financials.py tải
# hợp của ITEMS (Mô hình kiếm tiền) và FIN_ITEMS, nên data/auto-model.js không đổi. Nhóm theo 4 mô hình ở Tổng quan:
# Sản xuất & lắp ráp (TMT) · Đại lý ô tô (HAX, SVC, CTF; gồm dịch vụ hậu mãi) · Sở hữu vốn liên doanh (VEA).
# VEA lãi chủ yếu từ phần lãi liên doanh Honda, Toyota, Ford (không vào doanh thu) nên mặc định không bật trong tổng.
# Không có quan hệ mẹ – con giữa 5 mã nên không loại trùng.
from textile_fin_items import ITEMS as FIN_ITEMS  # noqa: E402

GROUPS = [
    {'id': 'dealer', 'label': 'Đại lý ô tô', 'color': '#2938A8', 'default': True},
    {'id': 'maker', 'label': 'Sản xuất & lắp ráp', 'color': '#2a9fa3', 'default': True},
    {'id': 'owner', 'label': 'Sở hữu vốn liên doanh (VEA)', 'color': '#c98a00', 'default': False},
]
COMPANIES = [
    {'ticker': 'HAX', 'group': 'dealer', 'note': 'Haxaco: đại lý Mercedes-Benz, MG, VinFast; hợp nhất đại lý VinFast (Tương Lai Việt) từ cuối Q1/2026'},
    {'ticker': 'SVC', 'group': 'dealer', 'note': 'Savico: đại lý nhiều hãng ô tô, phụ tùng, dịch vụ; cho thuê bất động sản đầu tư (~1% doanh thu 2025)'},
    {'ticker': 'CTF', 'group': 'dealer', 'note': 'City Auto: đại lý ô tô và dịch vụ hậu mãi'},
    {'ticker': 'TMT', 'group': 'maker', 'note': 'TMT Motors: sản xuất, lắp ráp ô tô'},
    {'ticker': 'VEA', 'group': 'owner', 'note': 'VEAM: lãi chủ yếu từ phần sở hữu liên doanh Honda Việt Nam, Toyota Việt Nam, Ford Việt Nam (hạch toán vốn chủ)'},
]
FIN_TICKERS = [c['ticker'] for c in COMPANIES]
CONSOLIDATION = []
ASSOCIATES = []
