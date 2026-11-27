"""Universe doanh nghiệp thép cho tab Tài chính ngành (Thep/). Khoản mục BCTC dùng chung với Dệt may
(textile_fin_items.ITEMS: mã VNDirect finfo, mẫu TT200). Dùng bởi fetch_steel_financials.py và build_steel_financials.py (27/11/2026).

8 mã theo danh sách doanh nghiệp theo dõi của trang Thép, nhóm theo mô hình: Thép xây dựng & HRC · Tôn mạ & ống · Thương mại thép.
Không có cặp hợp nhất mẹ – con trong rổ. HSG niên độ kết thúc 30/9: số quý theo kỳ VNDirect ghi nhận."""
from textile_fin_items import ITEMS  # noqa: F401

GROUPS = [
    {'id': 'long', 'label': 'Thép xây dựng & HRC', 'color': '#2938A8', 'default': True},
    {'id': 'coat', 'label': 'Tôn mạ & ống', 'color': '#2a9fa3', 'default': True},
    {'id': 'trade', 'label': 'Thương mại thép', 'color': '#c98a00', 'default': True},
]
COMPANIES = [
    {'ticker': 'HPG', 'group': 'long', 'note': 'Hòa Phát: lò cao tích hợp, thép xây dựng, HRC, phôi; ống, tôn mạ'},
    {'ticker': 'POM', 'group': 'long', 'note': 'Thép Pomina: thép xây dựng, phôi'},
    {'ticker': 'TVN', 'group': 'long', 'note': 'Tổng công ty Thép Việt Nam: thép cán dài, phôi'},
    {'ticker': 'HSG', 'group': 'coat', 'note': 'Hoa Sen: tôn mạ, ống; niên độ kết thúc 30/9'},
    {'ticker': 'NKG', 'group': 'coat', 'note': 'Nam Kim: tôn mạ, ống; xuất khẩu lớn'},
    {'ticker': 'VGS', 'group': 'coat', 'mixed': True, 'note': 'Ống thép Việt Đức: ống thép, tôn, thép xây dựng; có dự án BĐS'},
    {'ticker': 'TLH', 'group': 'trade', 'note': 'Thép Tiến Lên: thương mại, gia công thép'},
    {'ticker': 'SMC', 'group': 'trade', 'note': 'SMC: thương mại thép, gia công (coil center)'},
]
TICKERS = [c['ticker'] for c in COMPANIES]
CONSOLIDATION = []
ASSOCIATES = []
