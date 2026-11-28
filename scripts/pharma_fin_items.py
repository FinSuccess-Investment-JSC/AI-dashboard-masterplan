"""Universe doanh nghiệp dược & y tế cho tab Tài chính ngành (Duoc/). Khoản mục BCTC dùng chung với Dệt may / Thép
(textile_fin_items.ITEMS: mã VNDirect finfo, mẫu TT200). Dùng bởi fetch_pharma_financials.py và build_pharma_financials.py (28/11/2026).

8 mã theo phạm vi người dùng chốt 12/10/2026 (DASHBOARD_WORKFLOW §29), nhóm theo mô hình kinh doanh:
Sản xuất dược (DHG, IMP, DBD, TRA, DMC, DVN) · Bán lẻ dược (FRT) · Bệnh viện (TNH).
FRT là BCTC hợp nhất toàn công ty (gồm chuỗi FPT Shop, không riêng Long Châu) nên gắn mixed=True.
DVN (Vinapharm) là tổng công ty có nhiều công ty con, liên kết; quan hệ sở hữu với các mã khác trong rổ chưa đối chiếu báo cáo
thường niên nên chưa khai cặp loại trùng."""
from textile_fin_items import ITEMS  # noqa: F401

GROUPS = [
    {'id': 'mfg', 'label': 'Sản xuất dược', 'color': '#2938A8', 'default': True},
    {'id': 'retail', 'label': 'Bán lẻ dược', 'color': '#2a9fa3', 'default': True},
    {'id': 'hosp', 'label': 'Bệnh viện', 'color': '#c98a00', 'default': True},
]
COMPANIES = [
    {'ticker': 'DHG', 'group': 'mfg', 'note': 'Dược Hậu Giang: thuốc generic, OTC là kênh chính'},
    {'ticker': 'IMP', 'group': 'mfg', 'note': 'Imexpharm: thuốc generic, nhà máy EU-GMP, kênh ETC'},
    {'ticker': 'DBD', 'group': 'mfg', 'note': 'Bidiphar: thuốc tiêm, ung thư, kênh ETC'},
    {'ticker': 'TRA', 'group': 'mfg', 'note': 'Traphaco: đông dược, thuốc từ dược liệu, OTC'},
    {'ticker': 'DMC', 'group': 'mfg', 'note': 'Domesco: thuốc generic'},
    {'ticker': 'DVN', 'group': 'mfg', 'mixed': True, 'note': 'Vinapharm: tổng công ty sản xuất, phân phối dược; nhiều công ty con, liên kết'},
    {'ticker': 'FRT', 'group': 'retail', 'mixed': True, 'note': 'FPT Retail: chuỗi nhà thuốc Long Châu và FPT Shop (BCTC hợp nhất, không tách mảng)'},
    {'ticker': 'TNH', 'group': 'hosp', 'note': 'Bệnh viện Quốc tế Thái Nguyên: chuỗi bệnh viện tư'},
]
TICKERS = [c['ticker'] for c in COMPANIES]
CONSOLIDATION = []
ASSOCIATES = []
