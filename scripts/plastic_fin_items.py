"""Universe doanh nghiệp nhựa cho tab Tài chính ngành (Nhua/). Khoản mục BCTC dùng chung với Dệt may / Thép / Dược / Chăn nuôi
(textile_fin_items.ITEMS: mã VNDirect finfo, mẫu TT200). Dùng bởi fetch_plastic_financials.py và build_plastic_financials.py.

28/11/2026: 11 mã có BCTC hợp nhất quý trên VNDirect đến Q3/2026, nhóm theo mô hình kinh doanh trên trang
(Tổng quan › Mô hình kinh doanh): Nhựa xây dựng (BMP, NTP, DNP, HCD) · Nhựa bao bì (AAA, TDP, TPP) ·
Nhựa kỹ thuật, gia dụng (NHH, VTZ) · Phụ gia, hạt nhựa (HII, PLP). 9 mã đầu trùng rổ 'plastic' của update_company_comparison.py.
VTZ có BCTC quý từ Q1/2021. DNP có mảng nước sạch; AAA, HII có mảng thương mại hạt nhựa lớn → mixed=True.
AAA và HII cùng là công ty con của APH (APH không nằm trong rổ) nên không có cặp mẹ – con trong rổ, không loại trùng.
Đã xem, không đưa vào: APH (công ty mẹ của AAA, HII: trùng), TTP, RDP, DAG (BCTC quý dừng 2024), DPC (doanh thu quý vài tỷ)."""
from textile_fin_items import ITEMS  # noqa: F401

GROUPS = [
    {'id': 'build', 'label': 'Nhựa xây dựng', 'color': '#C0272D', 'default': True},
    {'id': 'pack', 'label': 'Nhựa bao bì', 'color': '#2938A8', 'default': True},
    {'id': 'tech', 'label': 'Nhựa kỹ thuật, gia dụng', 'color': '#2a9fa3', 'default': True},
    {'id': 'additive', 'label': 'Phụ gia, hạt nhựa', 'color': '#c98a00', 'default': True},
]
COMPANIES = [
    {'ticker': 'BMP', 'group': 'build', 'note': 'Nhựa Bình Minh: ống uPVC, HDPE, PP-R và phụ kiện, mạnh ở miền Nam; công ty con của SCG'},
    {'ticker': 'NTP', 'group': 'build', 'note': 'Nhựa Tiền Phong: ống nhựa và phụ kiện, mạnh ở miền Bắc'},
    {'ticker': 'DNP', 'group': 'build', 'mixed': True, 'note': 'DNP Corp: ống HDPE cho hạ tầng cấp thoát nước; có mảng nước sạch'},
    {'ticker': 'HCD', 'group': 'build', 'note': 'HCD: xếp nhóm nhựa xây dựng theo Tổng quan › Mô hình kinh doanh trên trang'},
    {'ticker': 'AAA', 'group': 'pack', 'mixed': True, 'note': 'Nhựa An Phát Xanh: túi màng đơn xuất khẩu; có mảng thương mại hạt nhựa; công ty con của APH'},
    {'ticker': 'TDP', 'group': 'pack', 'note': 'Thuận Đức: bao bì màng, túi nhựa xuất khẩu'},
    {'ticker': 'TPP', 'group': 'pack', 'note': 'Nhựa Tân Phú: bao bì, màng phức cho thực phẩm, đồ uống'},
    {'ticker': 'NHH', 'group': 'tech', 'note': 'Nhựa Hà Nội: linh kiện nhựa kỹ thuật cho xe máy, ô tô, điện tử'},
    {'ticker': 'VTZ', 'group': 'tech', 'note': 'Nhựa Việt Thành (VTZ): sản phẩm nhựa gia dụng; BCTC quý từ Q1/2021'},
    {'ticker': 'HII', 'group': 'additive', 'mixed': True, 'note': 'An Tiến Industries: phụ gia nhựa (filler masterbatch); có mảng thương mại hạt nhựa; công ty con của APH'},
    {'ticker': 'PLP', 'group': 'additive', 'note': 'Nhựa và Khoáng sản Pha Lê: phụ gia nhựa (filler masterbatch)'},
]
TICKERS = [c['ticker'] for c in COMPANIES]
CONSOLIDATION = []
ASSOCIATES = []
