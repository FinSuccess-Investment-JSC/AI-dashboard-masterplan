"""Universe doanh nghiệp sữa cho tab Tài chính ngành (Sua/). Khoản mục BCTC dùng chung với Dệt may / Thép / Dược / Chăn nuôi
(textile_fin_items.ITEMS: mã VNDirect finfo, mẫu TT200). Dùng bởi fetch_dairy_financials.py và build_dairy_financials.py (28/11/2026).

5 mã (28/11/2026 thêm QNS theo người dùng) có BCTC quý trên VNDirect finfo (kiểm 28/11/2026), nhóm theo mô hình kinh doanh:
  Sữa đa sản phẩm, nội địa + xuất khẩu (VNM) · Sữa tươi từ đàn bò (MCM) · Sữa nước, sữa chua thương hiệu nội địa (IDP, HNM).
Không đưa vào: NTB (số quý chỉ có năm 2019, toàn bằng 0); VLC (Tổng công ty Chăn nuôi Việt Nam – Vilico, công ty mẹ trực tiếp của MCM,
VNM nắm 68,9%) là công ty trung gian, số hợp nhất gồm MCM và mảng chăn nuôi khác nên không xếp vào rổ sữa.
Sở hữu theo danh sách cổ đông lớn của VNDirect finfo (api-finfo.vndirect.com.vn/v4/shareholders, đọc 28/11/2026):
  VNM ← VLC 68,9% (2023-08-28) ← MCM 59,3% (2023-06-01); VNM còn nắm trực tiếp 8,9% MCM. MCM nằm trong hợp nhất VNM
  (công ty con gián tiếp) → loại trùng VNM trừ MCM. Mốc 'since' là quý đầu tiên VNM có lợi ích cổ đông không kiểm soát tăng mạnh
  (tự đọc từ BCTC VNDirect, xem build_dairy_financials.py; ghi 'since_check' trong dữ liệu).
IDP (Sữa Quốc tế, LOF): Bluepoint 51,8%, không thuộc tập đoàn sữa nào trong rổ. HNM (Hanoimilk): không có cổ đông tổ chức lớn."""
from textile_fin_items import ITEMS  # noqa: F401

GROUPS = [
    {'id': 'multi', 'label': 'Sữa đa sản phẩm, nội địa + xuất khẩu', 'color': '#2938A8', 'default': True},
    {'id': 'farm', 'label': 'Sữa tươi từ đàn bò', 'color': '#2a9fa3', 'default': True},
    {'id': 'brand', 'label': 'Sữa nước, sữa chua thương hiệu nội địa', 'color': '#c98a00', 'default': True},
    {'id': 'plant', 'label': 'Sữa đậu nành, đa ngành', 'color': '#861C52', 'default': True},
]
COMPANIES = [
    {'ticker': 'VNM', 'group': 'multi', 'mixed': True, 'note': 'Vinamilk: sữa nước, sữa bột, sữa chua, sữa đặc, nước giải khát; nội địa và xuất khẩu; hợp nhất cả MCM (qua VLC)'},
    {'ticker': 'MCM', 'group': 'farm', 'note': 'Giống bò sữa Mộc Châu: sữa tươi, sữa chua từ trang trại Mộc Châu; công ty con gián tiếp của VNM'},
    {'ticker': 'IDP', 'group': 'brand', 'note': 'Sữa Quốc tế (LOF): sữa nước Kun, Lof Malt, sữa chua uống; công ty mẹ Bluepoint (51,8%)'},
    {'ticker': 'QNS', 'group': 'plant', 'mixed': True, 'note': 'Đường Quảng Ngãi: sữa đậu nành Vinasoy (mảng lợi nhuận lớn nhất), đường, bia, bánh kẹo; giữ ở cả trang Đường và Sữa'},
    {'ticker': 'HNM', 'group': 'brand', 'note': 'Sữa Hà Nội (Hanoimilk): sữa tiệt trùng, sữa chua; quy mô nhỏ'},
]
TICKERS = [c['ticker'] for c in COMPANIES]
CONSOLIDATION = [
    {'parent': 'VNM', 'child': 'MCM', 'since': '2019Q4', 'ownership': None, 'source': 'https://api-finfo.vndirect.com.vn/v4/shareholders?q=code:VLC',
     'note': 'công ty con gián tiếp (VNM 68,9% VLC, VLC 59,3% MCM); mốc theo quý lợi ích CĐKKS của VNM tăng mạnh, chưa đối chiếu BCTN'},
]
ASSOCIATES = []
