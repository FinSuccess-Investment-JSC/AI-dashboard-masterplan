"""Universe doanh nghiệp bia cho tab Tài chính ngành (Bia/). Khoản mục BCTC dùng chung với Dệt may / Thép / Dược / Chăn nuôi
(textile_fin_items.ITEMS: mã VNDirect finfo, mẫu TT200). Dùng bởi fetch_beer_financials.py và build_beer_financials.py (28/11/2026).

12 mã bia có BCTC quý liên tục trên VNDirect finfo (kiểm 28/11/2026, Q1/2019 – Q3/2026), nhóm theo mô hình kinh doanh:
  Hãng bia toàn quốc (SAB, BHN) · Nhà máy bia vùng sản xuất theo nhãn hãng lớn (SMB, BSQ, BSL, WSB, BSP, BSH, SBL, HAD, THB)
  · Thương mại, phân phối bia (HAT).
Không đưa vào: BQB (số quý dừng ở Q2/2024), BHP, BHK (chỉ một quý), BSD, HNB (không có số).
Sở hữu theo danh sách cổ đông lớn của VNDirect finfo (api-finfo.vndirect.com.vn/v4/shareholders, đọc 28/11/2026; ngày hiệu lực
ghi ở từng dòng, chưa đối chiếu báo cáo thường niên 2025):
  Công ty con (hợp nhất, loại trùng khi cả mẹ và con cùng được chọn): SAB ← BSQ 66,6% · BSL 68,8% · WSB 86,3% · BSH 52,1%;
  BHN ← HAD 55% · THB 55% · HAT 60%.
  Công ty liên kết (không hợp nhất, doanh thu không trùng theo kế toán): SAB ← SMB 32,2% · BSP 27%; WSB ← SBL 20%.
Nhà máy vùng bán phần lớn sản lượng cho hệ thống hãng mẹ: cộng doanh thu nhà máy liên kết với hãng lớn vẫn trùng một phần giá trị
bia ở khâu thương mại (ghi trong phương pháp trên trang)."""
from textile_fin_items import ITEMS  # noqa: F401

GROUPS = [
    {'id': 'brand', 'label': 'Hãng bia toàn quốc', 'color': '#2938A8', 'default': True},
    {'id': 'plant', 'label': 'Nhà máy bia vùng', 'color': '#c98a00', 'default': True},
    {'id': 'trade', 'label': 'Thương mại, phân phối bia', 'color': '#2a9fa3', 'default': True},
]
COMPANIES = [
    {'ticker': 'SAB', 'group': 'brand', 'note': 'Sabeco: Bia Sài Gòn, 333; hệ thống nhà máy và công ty thương mại toàn quốc'},
    {'ticker': 'BHN', 'group': 'brand', 'note': 'Habeco: Bia Hà Nội, Trúc Bạch; thị trường chính miền Bắc, Bắc Trung Bộ'},
    {'ticker': 'SMB', 'group': 'plant', 'note': 'Bia Sài Gòn – Miền Trung: sản xuất bia nhãn Sài Gòn; công ty liên kết của SAB (32,2%)'},
    {'ticker': 'BSQ', 'group': 'plant', 'note': 'Bia Sài Gòn – Quảng Ngãi: sản xuất bia nhãn Sài Gòn; công ty con của SAB (66,6%)'},
    {'ticker': 'BSL', 'group': 'plant', 'note': 'Bia Sài Gòn – Sông Lam: sản xuất bia nhãn Sài Gòn; công ty con của SAB (68,8%)'},
    {'ticker': 'WSB', 'group': 'plant', 'note': 'Bia Sài Gòn – Miền Tây: sản xuất bia nhãn Sài Gòn; công ty con của SAB (86,3%)'},
    {'ticker': 'BSP', 'group': 'plant', 'note': 'Bia Sài Gòn – Phú Thọ: sản xuất bia nhãn Sài Gòn; công ty liên kết của SAB (27%)'},
    {'ticker': 'BSH', 'group': 'plant', 'note': 'Bia Sài Gòn – Hà Nội: sản xuất bia nhãn Sài Gòn; công ty con của SAB (52,1%)'},
    {'ticker': 'SBL', 'group': 'plant', 'note': 'Bia Sài Gòn – Bạc Liêu: sản xuất bia nhãn Sài Gòn; công ty liên kết của WSB (20%)'},
    {'ticker': 'HAD', 'group': 'plant', 'note': 'Bia Hà Nội – Hải Dương: sản xuất bia nhãn Hà Nội; công ty con của BHN (55%)'},
    {'ticker': 'THB', 'group': 'plant', 'note': 'Bia Thanh Hóa: sản xuất bia nhãn Hà Nội và nhãn riêng; công ty con của BHN (55%)'},
    {'ticker': 'HAT', 'group': 'trade', 'note': 'Thương mại Bia Hà Nội: phân phối bia Habeco; công ty con của BHN (60%)'},
]
TICKERS = [c['ticker'] for c in COMPANIES]
_SH = 'https://api-finfo.vndirect.com.vn/v4/shareholders?q=code:'
CONSOLIDATION = [
    {'parent': 'SAB', 'child': 'BSQ', 'since': '2019Q1', 'ownership': 66.6, 'source': _SH + 'BSQ', 'note': 'công ty con của SAB trước 2019; tỷ lệ theo VNDirect (2020-06-30)'},
    {'parent': 'SAB', 'child': 'BSL', 'since': '2019Q1', 'ownership': 68.8, 'source': _SH + 'BSL', 'note': 'công ty con của SAB trước 2019; tỷ lệ theo VNDirect (2020-06-30)'},
    {'parent': 'SAB', 'child': 'WSB', 'since': '2019Q1', 'ownership': 86.3, 'source': _SH + 'WSB', 'note': 'công ty con của SAB; tỷ lệ theo VNDirect (2025-04-21)'},
    {'parent': 'SAB', 'child': 'BSH', 'since': '2019Q1', 'ownership': 52.1, 'source': _SH + 'BSH', 'note': 'công ty con của SAB; tỷ lệ theo VNDirect (2020-06-30)'},
    {'parent': 'BHN', 'child': 'HAD', 'since': '2019Q1', 'ownership': 55.0, 'source': _SH + 'HAD', 'note': 'công ty con của BHN; tỷ lệ theo VNDirect (2020-06-30)'},
    {'parent': 'BHN', 'child': 'THB', 'since': '2019Q1', 'ownership': 55.0, 'source': _SH + 'THB', 'note': 'công ty con của BHN; tỷ lệ theo VNDirect (2020-06-30)'},
    {'parent': 'BHN', 'child': 'HAT', 'since': '2019Q1', 'ownership': 60.0, 'source': _SH + 'HAT', 'note': 'công ty con của BHN; tỷ lệ theo VNDirect (2020-06-30)'},
]
ASSOCIATES = [
    {'parent': 'SAB', 'child': 'SMB', 'ownership': 32.2},
    {'parent': 'SAB', 'child': 'BSP', 'ownership': 27.0},
    {'parent': 'WSB', 'child': 'SBL', 'ownership': 20.0},
]
