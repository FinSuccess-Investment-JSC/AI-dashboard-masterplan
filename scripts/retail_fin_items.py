"""Universe doanh nghiệp bán lẻ & tiêu dùng cho tab Tài chính ngành (Ban-le/). Khoản mục BCTC dùng chung với Dệt may / Thép /
Dược / Chăn nuôi (textile_fin_items.ITEMS: mã VNDirect finfo, mẫu TT200). Dùng bởi fetch_retail_financials.py và
build_retail_financials.py.

28/11/2026: 7 mã có BCTC hợp nhất quý trên VNDirect, cùng rổ company-quarterly (sector retail), nhóm theo loại hình:
  Chuỗi bán lẻ hiện đại (MWG, FRT) · Phân phối thiết bị công nghệ (DGW, PET) · Trang sức (PNJ) · Hàng tiêu dùng nhanh (MSN, KDC).
MSN là tập đoàn đa ngành (WinCommerce, Masan Consumer, Masan MEATLife, Phúc Long, Masan High-Tech Materials) nên mixed=True;
FRT gồm FPT Shop và Long Châu (số hợp nhất, cũng nằm trong rổ Dược). QNS (đường, rổ Sugar), VNM, SAB (dashboard Sữa, Bia),
HAX, SVC (dashboard Ô tô – Xe máy) không đưa vào để không đếm hai lần giữa các dashboard.
Không có quan hệ mẹ – con giữa 7 mã trong rổ nên không loại trùng."""
from textile_fin_items import ITEMS  # noqa: F401

GROUPS = [
    {'id': 'modern', 'label': 'Chuỗi bán lẻ hiện đại', 'color': '#2938A8', 'default': True},
    {'id': 'distrib', 'label': 'Phân phối thiết bị công nghệ', 'color': '#2a9fa3', 'default': True},
    {'id': 'jewelry', 'label': 'Trang sức', 'color': '#c98a00', 'default': True},
    {'id': 'fmcg', 'label': 'Hàng tiêu dùng nhanh', 'color': '#861C52', 'default': True},
]
COMPANIES = [
    {'ticker': 'MWG', 'group': 'modern', 'note': 'Thế Giới Di Động: Điện Máy Xanh, Thế Giới Di Động, TopZone, Bách Hóa Xanh, An Khang, EraBlue (Indonesia)'},
    {'ticker': 'FRT', 'group': 'modern', 'mixed': True, 'note': 'FPT Retail: FPT Shop (điện thoại, máy tính) và Long Châu (nhà thuốc, tiêm chủng); số hợp nhất'},
    {'ticker': 'DGW', 'group': 'distrib', 'note': 'Digiworld: phân phối điện thoại, máy tính, thiết bị văn phòng, hàng tiêu dùng'},
    {'ticker': 'PET', 'group': 'distrib', 'note': 'Petrosetco: phân phối thiết bị công nghệ, dịch vụ dầu khí'},
    {'ticker': 'PNJ', 'group': 'jewelry', 'note': 'Vàng bạc Đá quý Phú Nhuận: trang sức bán lẻ, bán sỉ, vàng miếng'},
    {'ticker': 'MSN', 'group': 'fmcg', 'mixed': True, 'note': 'Masan Group: WinCommerce, Masan Consumer, Masan MEATLife, Phúc Long, Masan High-Tech Materials'},
    {'ticker': 'KDC', 'group': 'fmcg', 'note': 'Kido: dầu ăn, kem, thực phẩm đóng gói'},
]
TICKERS = [c['ticker'] for c in COMPANIES]
CONSOLIDATION = []
ASSOCIATES = []
