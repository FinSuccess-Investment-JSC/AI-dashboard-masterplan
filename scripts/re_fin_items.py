"""Universe và nhóm doanh nghiệp cho tab Tài chính ngành BĐS dân cư (Bat-dong-san/), 26/11/2026.
Khoản mục BCTC dùng chung với Khu công nghiệp (kcn_fin_items.ITEMS = khoản mục ngành Điện + người mua trả tiền trước,
doanh thu chưa thực hiện, chi phí dở dang dài hạn, bất động sản đầu tư). Dùng bởi fetch_re_financials.py và build_re_financials.py.

Nhóm: VHM tách riêng vì một mã chiếm phần lớn lợi nhuận ngành, gộp chung sẽ che chu kỳ của các chủ đầu tư còn lại."""
from kcn_fin_items import ITEMS  # noqa: F401

TICKERS = ['VHM', 'NVL', 'KDH', 'NLG', 'DXG', 'PDR', 'DIG', 'CEO', 'AGG', 'TCH', 'NTL', 'VRE', 'DXS']

# 27/11/2026: chia nhóm theo mô hình kinh doanh, không tách riêng VHM (người dùng: chia VHM ↔ phần còn lại bị lệch).
# 28/11/2026 (người dùng duyệt): tách Cho thuê & môi giới thành hai nhóm, VRE (cho thuê TTTM) và DXS (môi giới) là hai mô hình không liên quan.
GROUPS = [
    {'id': 'mega', 'label': 'Đại đô thị, quỹ đất lớn', 'color': '#2938A8', 'default': True},
    {'id': 'urban', 'label': 'Nhà ở đô thị lớn', 'color': '#2a9fa3', 'default': True},
    {'id': 'prov', 'label': 'Đất nền & tỉnh', 'color': '#861C52', 'default': True},
    {'id': 'lease', 'label': 'Cho thuê trung tâm thương mại', 'color': '#c98a00', 'default': True},
    {'id': 'broker', 'label': 'Môi giới', 'color': '#8997D6', 'default': True},
]
COMPANIES = [
    {'ticker': 'VHM', 'group': 'mega', 'note': 'Vinhomes: đại đô thị, căn hộ, thấp tầng; có bán buôn dự án và KCN'},
    {'ticker': 'NVL', 'group': 'mega', 'note': 'Novaland: Aqua City, NovaWorld Phan Thiết, Hồ Tràm; đang tái cấu trúc nợ'},
    {'ticker': 'KDH', 'group': 'urban', 'note': 'Khang Điền: nhà ở TP.HCM (TP Thủ Đức, Bình Chánh)'},
    {'ticker': 'NLG', 'group': 'urban', 'note': 'Nam Long: nhà ở vừa túi tiền, Waterpoint, Izumi, Mizuki'},
    {'ticker': 'DXG', 'group': 'urban', 'mixed': True, 'note': 'Đất Xanh: phát triển dự án và môi giới (sở hữu DXS)'},
    {'ticker': 'PDR', 'group': 'prov', 'note': 'Phát Đạt: dự án Bình Dương, Bình Định, Đà Nẵng'},
    {'ticker': 'DIG', 'group': 'prov', 'mixed': True, 'note': 'DIC Corp: khu đô thị, du lịch; có vật liệu xây dựng'},
    {'ticker': 'CEO', 'group': 'prov', 'mixed': True, 'note': 'C.E.O Group: đất nền, du lịch nghỉ dưỡng Phú Quốc'},
    {'ticker': 'AGG', 'group': 'urban', 'note': 'An Gia: căn hộ TP.HCM'},
    {'ticker': 'TCH', 'group': 'prov', 'mixed': True, 'note': 'Tài chính Hoàng Huy: Hoang Huy Commerce (Hải Phòng); có kinh doanh xe'},
    {'ticker': 'NTL', 'group': 'prov', 'note': 'Lideco: khu đô thị Hà Nội, Quảng Ninh'},
    {'ticker': 'VRE', 'group': 'lease', 'note': 'Vincom Retail: cho thuê trung tâm thương mại'},
    {'ticker': 'DXS', 'group': 'broker', 'note': 'Dịch vụ BĐS Đất Xanh: môi giới sơ cấp'},
]
# DXS là công ty con của DXG: khi cả hai cùng nằm trong rổ thì loại doanh thu nội bộ (tỷ lệ chưa đối chiếu báo cáo thường niên).
CONSOLIDATION = [
    {'parent': 'DXG', 'child': 'DXS', 'since': '2019Q1', 'ownership': None, 'source': '', 'note': 'công ty con của Đất Xanh; tỷ lệ chưa đối chiếu'},
]
ASSOCIATES = []
