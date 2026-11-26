"""Universe và nhóm doanh nghiệp cho tab Tài chính ngành (Cang-bien/). Khoản mục BCTC dùng chung với ngành Điện
(power_fin_items.ITEMS, mã VNDirect finfo, mẫu TT200). Dùng bởi fetch_port_financials.py và build_port_financials.py.

12 mã theo phạm vi chốt 09/10/2026, nhóm theo mảng chính: Cảng biển · Vận tải container · Dịch vụ hàng không · Kho bãi & logistics.
Chưa khai báo quan hệ hợp nhất giữa các mã (chưa đối chiếu báo cáo thường niên)."""
from power_fin_items import ITEMS  # noqa: F401

TICKERS = ['GMD', 'PHP', 'SGP', 'VSC', 'CDN', 'DVP', 'PDN', 'HAH', 'SCS', 'SGN', 'TCL', 'STG']

GROUPS = [
    {'id': 'port', 'label': 'Cảng biển', 'color': '#2938A8', 'default': True},
    {'id': 'shipping', 'label': 'Vận tải container', 'color': '#2a9fa3', 'default': True},
    {'id': 'air', 'label': 'Dịch vụ hàng không', 'color': '#861C52', 'default': True},
    {'id': 'logistics', 'label': 'Kho bãi & logistics', 'color': '#c98a00', 'default': True},
]
COMPANIES = [
    {'ticker': 'GMD', 'group': 'port', 'mixed': True, 'note': 'Gemadept: cảng Nam Đình Vũ, Gemalink; logistics'},
    {'ticker': 'PHP', 'group': 'port', 'note': 'Cảng Hải Phòng: Tân Vũ, Hoàng Diệu, Lạch Huyện 3–4'},
    {'ticker': 'SGP', 'group': 'port', 'note': 'Cảng Sài Gòn: SP-ITC, góp vốn SSIT, CMIT, Cần Giờ'},
    {'ticker': 'VSC', 'group': 'port', 'mixed': True, 'note': 'Viconship: cảng Hải Phòng, logistics'},
    {'ticker': 'CDN', 'group': 'port', 'note': 'Cảng Đà Nẵng: Tiên Sa'},
    {'ticker': 'DVP', 'group': 'port', 'note': 'Cảng Đình Vũ'},
    {'ticker': 'PDN', 'group': 'port', 'note': 'Cảng Đồng Nai'},
    {'ticker': 'HAH', 'group': 'shipping', 'mixed': True, 'note': 'Hải An: tàu container nội Á, cho thuê tàu, cảng'},
    {'ticker': 'SCS', 'group': 'air', 'note': 'Saigon Cargo Service: kho hàng hóa Tân Sơn Nhất'},
    {'ticker': 'SGN', 'group': 'air', 'note': 'SAGS: phục vụ mặt đất'},
    {'ticker': 'TCL', 'group': 'logistics', 'note': 'Tân Cảng Logistics: ICD, kho bãi, vận chuyển'},
    {'ticker': 'STG', 'group': 'logistics', 'note': 'Sotrans: kho bãi, logistics'},
]
CONSOLIDATION = []
ASSOCIATES = []
