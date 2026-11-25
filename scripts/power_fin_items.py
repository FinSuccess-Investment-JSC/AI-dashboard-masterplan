"""Danh mục khoản mục BCTC (mã VNDirect finfo, mẫu TT200/TT202) và universe cho sub-tab 07 Tài chính ngành (Điện).
Dùng chung bởi fetch_power_financials.py và build_power_financials.py. Kiểm mã khoản mục 25/11/2026 trên POW quý 3/2026.
kind: flow = phát sinh trong quý; stock = số dư cuối kỳ. sign = -1 khi nguồn ghi số âm cho khoản chi (đổi về số dương)."""

ITEMS = [
    # Kết quả kinh doanh (modelType 2), số quý riêng lẻ
    {'id': 'revenue', 'model': 2, 'code': 21001, 'kind': 'flow', 'name': 'Doanh thu thuần'},
    {'id': 'cogs', 'model': 2, 'code': 22100, 'kind': 'flow', 'name': 'Giá vốn hàng bán'},
    {'id': 'gross', 'model': 2, 'code': 23100, 'kind': 'flow', 'name': 'Lợi nhuận gộp'},
    {'id': 'fin_income', 'model': 2, 'code': 21500, 'kind': 'flow', 'name': 'Doanh thu hoạt động tài chính'},
    {'id': 'fin_exp', 'model': 2, 'code': 22500, 'kind': 'flow', 'name': 'Chi phí tài chính'},
    {'id': 'interest', 'model': 2, 'code': 22510, 'kind': 'flow', 'name': 'Chi phí lãi vay'},
    {'id': 'assoc', 'model': 2, 'code': 23300, 'kind': 'flow', 'name': 'Lãi/lỗ công ty liên kết'},
    {'id': 'selling', 'model': 2, 'code': 22110, 'kind': 'flow', 'name': 'Chi phí bán hàng'},
    {'id': 'admin', 'model': 2, 'code': 22200, 'kind': 'flow', 'name': 'Chi phí quản lý doanh nghiệp'},
    {'id': 'op_profit', 'model': 2, 'code': 23110, 'kind': 'flow', 'name': 'Lợi nhuận thuần từ hoạt động kinh doanh'},
    {'id': 'other', 'model': 2, 'code': 23900, 'kind': 'flow', 'name': 'Lợi nhuận khác'},
    {'id': 'pbt', 'model': 2, 'code': 23800, 'kind': 'flow', 'name': 'Lợi nhuận trước thuế'},
    {'id': 'tax', 'model': 2, 'code': 22070, 'kind': 'flow', 'name': 'Chi phí thuế TNDN'},
    {'id': 'npat', 'model': 2, 'code': 23003, 'kind': 'flow', 'name': 'Lợi nhuận sau thuế (hợp nhất)'},
    {'id': 'npat_parent', 'model': 2, 'code': 23000, 'kind': 'flow', 'name': 'LNST thuộc cổ đông công ty mẹ'},
    # Lưu chuyển tiền tệ (modelType 3)
    {'id': 'da', 'model': 3, 'code': 22230, 'kind': 'flow', 'name': 'Khấu hao TSCĐ'},
    {'id': 'cfo', 'model': 3, 'code': 32000, 'kind': 'flow', 'name': 'Lưu chuyển tiền thuần từ hoạt động kinh doanh'},
    {'id': 'chg_receivables', 'model': 3, 'code': 31130, 'kind': 'flow', 'name': 'Tăng, giảm các khoản phải thu (LCTT)'},
    {'id': 'chg_inventory', 'model': 3, 'code': 31140, 'kind': 'flow', 'name': 'Tăng, giảm hàng tồn kho (LCTT)'},
    {'id': 'chg_payables', 'model': 3, 'code': 31150, 'kind': 'flow', 'name': 'Tăng, giảm các khoản phải trả (LCTT)'},
    {'id': 'capex', 'model': 3, 'code': 32100, 'kind': 'flow', 'sign': -1, 'name': 'Tiền chi mua sắm, xây dựng TSCĐ và tài sản dài hạn khác'},
    {'id': 'asset_sale', 'model': 3, 'code': 32200, 'kind': 'flow', 'name': 'Tiền thu thanh lý TSCĐ'},
    {'id': 'cfi', 'model': 3, 'code': 33000, 'kind': 'flow', 'name': 'Lưu chuyển tiền thuần từ hoạt động đầu tư'},
    {'id': 'equity_raised', 'model': 3, 'code': 33100, 'kind': 'flow', 'name': 'Tiền thu phát hành cổ phiếu, nhận vốn góp'},
    {'id': 'borrow', 'model': 3, 'code': 33300, 'kind': 'flow', 'name': 'Tiền vay nhận được'},
    {'id': 'repay', 'model': 3, 'code': 33400, 'kind': 'flow', 'sign': -1, 'name': 'Tiền trả nợ gốc vay'},
    {'id': 'dividends', 'model': 3, 'code': 33600, 'kind': 'flow', 'sign': -1, 'name': 'Cổ tức, lợi nhuận đã trả'},
    {'id': 'cff', 'model': 3, 'code': 34000, 'kind': 'flow', 'name': 'Lưu chuyển tiền thuần từ hoạt động tài chính'},
    {'id': 'net_cash_flow', 'model': 3, 'code': 35000, 'kind': 'flow', 'name': 'Lưu chuyển tiền thuần trong kỳ'},
    # Bảng cân đối (modelType 1), số dư cuối kỳ
    {'id': 'cash', 'model': 1, 'code': 11100, 'kind': 'stock', 'name': 'Tiền và tương đương tiền'},
    {'id': 'st_invest', 'model': 1, 'code': 11200, 'kind': 'stock', 'name': 'Đầu tư tài chính ngắn hạn'},
    {'id': 'receivables', 'model': 1, 'code': 11310, 'kind': 'stock', 'name': 'Phải thu khách hàng ngắn hạn'},
    {'id': 'receivables_lt', 'model': 1, 'code': 12110, 'kind': 'stock', 'name': 'Phải thu dài hạn của khách hàng'},
    {'id': 'doubtful', 'model': 1, 'code': 11390, 'kind': 'stock', 'sign': -1, 'name': 'Dự phòng phải thu ngắn hạn khó đòi'},
    {'id': 'inventory', 'model': 1, 'code': 11400, 'kind': 'stock', 'name': 'Hàng tồn kho'},
    {'id': 'ppe_net', 'model': 1, 'code': 12210, 'kind': 'stock', 'name': 'TSCĐ hữu hình (giá trị còn lại)'},
    {'id': 'ppe_gross', 'model': 1, 'code': 12220, 'kind': 'stock', 'name': 'Nguyên giá TSCĐ hữu hình'},
    {'id': 'ppe_accdep', 'model': 1, 'code': 12230, 'kind': 'stock', 'sign': -1, 'name': 'Hao mòn lũy kế TSCĐ hữu hình'},
    {'id': 'cip', 'model': 1, 'code': 12460, 'kind': 'stock', 'name': 'Chi phí xây dựng cơ bản dở dang'},
    {'id': 'cip_old', 'model': 1, 'code': 12300, 'kind': 'stock', 'name': 'Chi phí XDCB dở dang (mẫu trước 2015)'},
    {'id': 'total_assets', 'model': 1, 'code': 12700, 'kind': 'stock', 'name': 'Tổng tài sản'},
    {'id': 'st_debt', 'model': 1, 'code': 13110, 'kind': 'stock', 'name': 'Vay và nợ thuê tài chính ngắn hạn'},
    {'id': 'lt_debt', 'model': 1, 'code': 13340, 'kind': 'stock', 'name': 'Vay và nợ thuê tài chính dài hạn'},
    {'id': 'payables', 'model': 1, 'code': 13120, 'kind': 'stock', 'name': 'Phải trả người bán ngắn hạn'},
    {'id': 'liabilities', 'model': 1, 'code': 13000, 'kind': 'stock', 'name': 'Nợ phải trả'},
    {'id': 'equity', 'model': 1, 'code': 14000, 'kind': 'stock', 'name': 'Vốn chủ sở hữu (gồm lợi ích cổ đông không kiểm soát)'},
    {'id': 'nci', 'model': 1, 'code': 14240, 'kind': 'stock', 'name': 'Lợi ích cổ đông không kiểm soát'},
]

# Universe: mã theo dõi. Nhóm theo mô hình kinh doanh (xem GROUPS); 'default' = thuộc tổng hợp phát điện mặc định.
TICKERS = ['POW', 'NT2', 'PGV', 'BTP', 'PPC', 'QTP', 'HND', 'DTK', 'VSH', 'CHP', 'SBA', 'TMP', 'SHP', 'GEG', 'TTA',
           'REE', 'HDG', 'PC1', 'TV2', 'GEX']

# Nhóm theo mô hình kinh doanh; màu thống nhất với các tab khác (than #3d4653, thủy điện #2938A8, khí #c98a00, NLTT #2a9fa3).
# default=True: thuộc tổng hợp "doanh nghiệp phát điện" mặc định. Đa ngành, xây lắp & thiết bị không gộp mặc định.
# Doanh nghiệp nhiều loại hình xếp vào loại hình có công suất lớn nhất (25/11/2026, theo yêu cầu người dùng); mixed=True
# đánh dấu doanh nghiệp có nhiều loại hình, số theo nhóm chỉ mang tính tham khảo.
GROUPS = [
    {'id': 'hydro', 'label': 'Thủy điện', 'color': '#2938A8', 'default': True},
    {'id': 'coal', 'label': 'Nhiệt điện than', 'color': '#3d4653', 'default': True},
    {'id': 'gas', 'label': 'Nhiệt điện khí & LNG', 'color': '#c98a00', 'default': True},
    {'id': 're', 'label': 'Gió & mặt trời', 'color': '#2a9fa3', 'default': True},
    {'id': 'diversified', 'label': 'Đa ngành có mảng điện', 'color': '#9AA3BD', 'default': False},
    {'id': 'epc', 'label': 'Xây lắp & thiết bị điện', 'color': '#861C52', 'default': False},
]
COMPANIES = [
    {'ticker': 'VSH', 'group': 'hydro', 'note': 'Vĩnh Sơn, Sông Hinh, Thượng Kon Tum'},
    {'ticker': 'CHP', 'group': 'hydro', 'mixed': True, 'note': 'Thủy điện A Lưới 170 MW; mặt trời Cư Jút 50 MWp'},
    {'ticker': 'SBA', 'group': 'hydro', 'note': "Krông H'năng, Khe Diên"},
    {'ticker': 'TMP', 'group': 'hydro', 'mixed': True, 'note': 'Thủy điện Thác Mơ 170 MW; mặt trời 50 MWp'},
    {'ticker': 'SHP', 'group': 'hydro', 'note': 'Đambri và các nhà máy ở Lâm Đồng'},
    {'ticker': 'PPC', 'group': 'coal', 'note': 'Phả Lại 1&2'},
    {'ticker': 'QTP', 'group': 'coal', 'note': 'Quảng Ninh 1&2'},
    {'ticker': 'HND', 'group': 'coal', 'note': 'Hải Phòng'},
    {'ticker': 'DTK', 'group': 'coal', 'note': 'Điện lực TKV: Cẩm Phả, Đông Triều, Sơn Động…'},
    {'ticker': 'NT2', 'group': 'gas', 'note': 'Nhơn Trạch 2'},
    {'ticker': 'BTP', 'group': 'gas', 'note': 'Bà Rịa'},
    {'ticker': 'GEG', 'group': 're', 'mixed': True, 'note': 'Gió, mặt trời, mái nhà; có thủy điện nhỏ'},
    {'ticker': 'TTA', 'group': 're', 'mixed': True, 'note': 'Mặt trời 111,8 MWp; thủy điện 82,4 MW'},
    {'ticker': 'POW', 'group': 'gas', 'mixed': True, 'note': 'Khí + LNG ~4.324 MW; than Vũng Áng 1 1.200 MW; thủy điện ~325 MW'},
    {'ticker': 'PGV', 'group': 'gas', 'mixed': True, 'note': 'Khí Phú Mỹ ~2.540 MW; than Vĩnh Tân 2, Mông Dương 1 ~2.324 MW; thủy điện Buôn Kuốp 586 MW'},
    {'ticker': 'REE', 'group': 'diversified', 'note': 'Năng lượng, cơ điện lạnh, bất động sản, nước'},
    {'ticker': 'HDG', 'group': 'diversified', 'note': 'Năng lượng, bất động sản'},
    {'ticker': 'PC1', 'group': 'diversified', 'note': 'Xây lắp, năng lượng, khu công nghiệp'},
    {'ticker': 'TV2', 'group': 'epc', 'note': 'Tư vấn, tổng thầu EPC nguồn và lưới'},
    {'ticker': 'GEX', 'group': 'epc', 'note': 'Thiết bị điện (GELEX Electric) và đa ngành'},
]
# Quan hệ hợp nhất trong universe (công ty mẹ hợp nhất công ty con): khi cả hai cùng được chọn, số của công ty mẹ
# được trừ số của công ty con (từ kỳ 'since') để không cộng trùng. Điền theo thuyết minh BCTC đã kiểm.
CONSOLIDATION = [
    {'parent': 'POW', 'child': 'NT2', 'since': '2019Q1', 'ownership': 59.37, 'source': 'https://pvpower.vn/pow-media/to-ir/04042023---POW-Report-2022---nen.pdf', 'note': 'công ty con từ trước 2018'},
    {'parent': 'PGV', 'child': 'BTP', 'since': '2019Q1', 'ownership': 79.56, 'source': 'https://static2.vietstock.vn/vietstock/2023/4/10/20230410_20230409___pgv___bao_cao_thuong_nien_nam_2022.pdf', 'note': 'công ty con từ trước 2018'},
    {'parent': 'REE', 'child': 'VSH', 'since': '2021Q2', 'ownership': 52.58, 'source': 'https://static2.vietstock.vn/vietstock/2026/3/17/20260316___ree___bao_cao_thuong_nien_nam_2025.pdf', 'note': 'hợp nhất từ quý 2/2021 (Q2/2021 chỉ phần sau ngày mua)'},
]
# Công ty liên kết (vốn chủ sở hữu) trong universe: phần lãi liên kết nằm trong LNST công ty mẹ, doanh thu không trùng.
# PGV ← VSH 30,55%; REE ← TMP 42,63%, CHP 24,25%, PPC 20,12%. Ghi trong phương pháp, không tự điều chỉnh.
ASSOCIATES = [
    {'parent': 'PGV', 'child': 'VSH', 'ownership': 30.55}, {'parent': 'REE', 'child': 'TMP', 'ownership': 42.63},
    {'parent': 'REE', 'child': 'CHP', 'ownership': 24.25}, {'parent': 'REE', 'child': 'PPC', 'ownership': 20.12},
]
