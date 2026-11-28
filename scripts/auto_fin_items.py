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
