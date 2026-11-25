"""Universe và nhóm doanh nghiệp cho sub-tab Tài chính ngành (Viễn thông). Khoản mục BCTC dùng chung với ngành Điện
(power_fin_items.ITEMS, mã VNDirect finfo, mẫu TT200). Dùng bởi fetch_telecom_financials.py và build_telecom_financials.py.

Nhóm theo mô hình kinh doanh (không gộp FOX, CTR, VGI thành một nhóm peer đồng nhất):
- Internet cố định & truyền hình (FOX): thuê bao × ARPU.
- Hạ tầng, TowerCo & xây lắp (CTR): số trạm × tỷ lệ thuê chung × giá thuê; xây lắp theo CAPEX nhà mạng.
- Viễn thông quốc tế (VGI): thị trường hoạt động ở nước ngoài, không đọc bằng số liệu Việt Nam.
- Dịch vụ viễn thông & nội dung số, Thiết bị & giải pháp: không gộp mặc định.
FPT (hợp nhất FOX) không đưa vào universe vì là tập đoàn công nghệ đa ngành."""
from power_fin_items import ITEMS  # noqa: F401

TICKERS = ['FOX', 'CTR', 'VGI', 'MFS', 'TTN', 'VTC', 'ABC', 'SGT', 'ELC', 'ICT', 'POT']

GROUPS = [
    {'id': 'fixed', 'label': 'Internet cố định & truyền hình', 'color': '#2938A8', 'default': True},
    {'id': 'infra', 'label': 'Hạ tầng, TowerCo & xây lắp', 'color': '#c98a00', 'default': True},
    {'id': 'intl', 'label': 'Viễn thông quốc tế', 'color': '#2a9fa3', 'default': True},
    {'id': 'services', 'label': 'Dịch vụ viễn thông & nội dung số', 'color': '#9AA3BD', 'default': False},
    {'id': 'equipment', 'label': 'Thiết bị & giải pháp viễn thông', 'color': '#861C52', 'default': False},
]
COMPANIES = [
    {'ticker': 'FOX', 'group': 'fixed', 'mixed': True, 'note': 'FPT Telecom: Internet cáp quang, truyền hình FPT Play, trung tâm dữ liệu'},
    {'ticker': 'CTR', 'group': 'infra', 'mixed': True, 'note': 'Viettel Construction: xây lắp, vận hành khai thác, hạ tầng cho thuê (TowerCo), giải pháp tích hợp'},
    {'ticker': 'VGI', 'group': 'intl', 'note': 'Viettel Global: nhà mạng tại 10 thị trường nước ngoài (châu Á, châu Phi, Mỹ Latinh)'},
    {'ticker': 'MFS', 'group': 'services', 'note': 'Dịch vụ kỹ thuật MobiFone: vận hành, bảo dưỡng mạng, dịch vụ GTGT'},
    {'ticker': 'TTN', 'group': 'services', 'note': 'Công nghệ & Truyền thông Việt Nam: dịch vụ viễn thông, nội dung số'},
    {'ticker': 'VTC', 'group': 'services', 'note': 'Viễn thông VTC: dịch vụ viễn thông, giải pháp kỹ thuật'},
    {'ticker': 'ABC', 'group': 'services', 'note': 'VMG Media: dịch vụ giá trị gia tăng, nội dung số, quảng cáo'},
    {'ticker': 'SGT', 'group': 'services', 'mixed': True, 'note': 'Saigontel: viễn thông, CNTT và khu công nghiệp'},
    {'ticker': 'ELC', 'group': 'equipment', 'note': 'Elcom: thiết bị, phần mềm viễn thông, hệ thống giao thông thông minh'},
    {'ticker': 'ICT', 'group': 'equipment', 'note': 'Viễn thông – Tin học Bưu điện: phân phối thiết bị, giải pháp viễn thông'},
    {'ticker': 'POT', 'group': 'equipment', 'note': 'Thiết bị Bưu điện: thiết bị viễn thông, cáp và tủ'},
]
# Không có quan hệ công ty mẹ – con trong universe (FPT không nằm trong universe; CTR, VGI cùng thuộc Viettel
# nhưng không hợp nhất lẫn nhau).
CONSOLIDATION = []
ASSOCIATES = []
