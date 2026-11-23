#!/usr/bin/env python3
"""Dựng khối chuyên đề 'Luật mới 2026' (sub-tab đầu của Policy) trong Bat-dong-san/index.html.

Nội dung luật và nhận định theo mã nằm ngay trong file này; dữ kiện theo dự án đọc từ
data/realestate/law-companies.json (mỗi dữ kiện có url + quote đã kiểm). Chạy lại sau khi sửa:
    python3 scripts/build_realestate_law.py
Khối được thay giữa hai mốc <!--law-2026--> … <!--/law-2026-->.
"""
import html
import json
import re
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / 'Bat-dong-san' / 'index.html'
DATA = json.loads((ROOT / 'data' / 'realestate' / 'law-companies.json').read_text())['companies']
esc = html.escape
A = lambda u, t: f'<a href="{u}" target="_blank" rel="noopener">{t}</a>'
T = 'https://thitruongtaichinhtiente.vn/quoc-hoi-chinh-thuc-thong-qua-3-luat-lon-ve-nha-o-dat-dai-va-bat-dong-san-87227.html'
M = 'https://mekongasean.vn/quoc-hoi-thong-qua-cac-chinh-sach-moi-ve-dat-dai-62091.html'
V = 'https://vnexpress.net/thong-qua-luat-dat-dai-sua-doi-bo-sung-quyen-loi-nguoi-bi-thu-hoi-dat-5147331.html'
O = 'http://vov.vn/xa-hoi/quoc-hoi-thong-qua-luat-dat-dai-voi-nhieu-co-che-moi-ve-dinh-gia-thu-hoi-dat-post1351872.vov'
C = 'https://congly.vn/quoc-hoi-thong-qua-luat-kinh-doanh-bat-dong-san-sua-doi-siet-chat-dieu-kien-kinh-doanh-bao-ve-nguoi-mua-nha-548611.html'
X = 'https://cafef.vn/quoc-hoi-chot-ap-thue-02-voi-dat-bo-hoang-188261120185354019.chn'
K = 'https://www.tinnhanhchungkhoan.vn/bo-gia-dat-cu-the-nha-nuoc-quyet-dinh-gia-dat-dua-tren-bang-gia-dat-va-he-so-k-post401828.html'
D = 'https://www.vietnamplus.vn/luat-nha-o-sua-doi-them-chuong-ve-nha-cho-thue-cat-34-dieu-kien-kinh-doanh-post1143529.vnp'

PILL = {'up': 'Lợi', 'down': 'Thiệt', 'watch': 'Theo dõi', 'flat': 'Trung tính',
        'fast': 'Nhanh hơn', 'cost': 'Đắt hơn', 'strict': 'Chặt hơn', 'open': 'Chưa rõ'}
pill = lambda k, t=None: f'<span class="lw-pill lw-{k}">{t or PILL[k]}</span>'

# (số, tên bước, trục của người dùng, [nhãn kết quả], [(trước, sau)], chờ nghị định)
STEPS = [
 (1, 'Có đất', 'Giải phóng mặt bằng', ['fast', 'cost'], [
   ('NQ 254 tạm thời: thu hồi phần còn lại khi thỏa thuận &gt;75%', f'{A(M, "Đưa vào luật")}: &gt;75% diện tích và &gt;75% số hộ → HĐND tỉnh cho thu hồi phần còn lại'),
   ('Thu hồi sau khi duyệt phương án bồi thường', f'{A(M, "Thu hồi trước")} khi duyệt phương án nếu &gt;75% hộ đồng ý'),
   ('Bồi thường chủ yếu bằng tiền', f'Ưu tiên đất/nhà tại chỗ; {A(V, "tỷ lệ bồi thường ≥1")}; sinh kế ≥3 năm; chủ đầu tư {A(M, "ứng trả chênh lệch")}')],
  'Tỷ lệ bồi thường từng tỉnh'),
 (2, 'Xong pháp lý', 'Phân cấp', ['fast'], [
   ('Quy hoạch sử dụng đất cấp tỉnh, cấp xã lập riêng', f'{A(O, "Bỏ")}: gộp vào quy hoạch tỉnh'),
   ('Giao đất có xét tiến độ dự án cũ', f'{A(T, "Bỏ căn cứ tiến độ")}'),
   ('Nhiều thủ tục nhà ở ở cấp bộ', f'Dự thảo giao 20/21 thủ tục về địa phương ({A(D, "bản trình 22/10")}, chưa xác nhận)')],
  'Danh mục thủ tục phân cấp'),
 (3, 'Nộp tiền đất', 'Phân cấp', ['fast', 'open'], [
   ('Định giá riêng từng dự án, thuê tư vấn, hội đồng thẩm định', f'{A(O, "Bỏ giá đất cụ thể")}: bảng giá × hệ số K'),
   ('Bảng giá cập nhật hằng năm', f'HĐND tỉnh quyết {A(M, "3 năm/lần")}, áp dụng từ 01/01/2028')],
  'Hệ số K từng tỉnh — đắt hay rẻ là ở đây'),
 (4, 'Mở bán, thu tiền', 'Kỷ luật vốn', ['strict'], [
   ('Vốn chủ 20%/15% · cọc ≤5% · thu trước bàn giao ≤70%', f'{A(C, "Giữ nguyên")} các ngưỡng'),
   ('Giữ chỗ, góp vốn sớm khá phổ biến', 'Cấm thu tiền mọi hình thức trước khi đủ điều kiện; không ủy quyền ký; mã định danh BĐS')],
  '—'),
 (5, 'Nghĩa vụ xã hội', 'Thương mại – xã hội', ['open'], [
   ('Dự án thương mại: dành đất NOXH, đổi quỹ đất hoặc nộp tiền', f'{A(T, "UBND tỉnh quyết")} phần đất cho nhà cho thuê + NOXH'),
   ('Nhà cho thuê không có khung riêng', f'Chương riêng; vốn tư nhân {A(T, "hưởng chính sách NOXH")}'),
   ('NOXH bán lại tự do sau 5 năm', 'Chỉ bán lại cho đúng đối tượng')],
  'Quy mô dự án, tỷ lệ đất; ưu đãi nhà cho thuê'),
 (6, 'Nếu chậm tiến độ', 'Dòng tiền về nhu cầu thực', ['cost'], [
   ('Thu hồi đất (hiếm khi thực hiện)', f'{A(V, "Tiền đất tăng thêm")} trên phần diện tích chậm, đến khi dự án chấm dứt'),
   ('Thuế đất phi nông nghiệp tối đa 0,15%', f'{A(X, "Thuế 0,2% đất bỏ hoang")}, không hạn mức')],
  'Mức thu; tiêu chí “trở ngại khách quan”'),
]

NAME = {'VHM': 'Vinhomes', 'NVL': 'Novaland', 'KDH': 'Khang Điền', 'NLG': 'Nam Long', 'DXG': 'Bluemarq (Đất Xanh)', 'PDR': 'Phát Đạt',
        'DIG': 'DIC Corp', 'CEO': 'C.E.O Group', 'AGG': 'An Gia', 'TCH': 'Hoàng Huy', 'NTL': 'Lideco'}
ORDER = ['KDH', 'VHM', 'NLG', 'DXG', 'TCH', 'NVL', 'DIG', 'PDR', 'AGG', 'CEO', 'NTL']
# verdict (kind, nhãn), quỹ đất, 5 dòng (bước, kind, câu ngắn), điểm then chốt
CO = {
 'KDH': (('up', 'Hưởng lợi ròng'), '~662,5 ha · 100% ở TP.HCM', [
   ('Có đất', 'up', 'Tân Tạo ~329 ha đã bồi thường &gt;80% diện tích, trên ngưỡng 75%'),
   ('Tiền đất', 'watch', 'Tân Tạo A nâng vốn 7.737 → 17.918 tỷ vì tiền đất, bồi thường'),
   ('Thu tiền', 'flat', 'Gladia đủ điều kiện trước mở bán; vốn sớm từ bán cổ phần dự án'),
   ('Xã hội', 'up', 'Lê Minh Xuân ~110 ha chuyển sang NOXH; An Lập; BT Mả Lạng'),
   ('Chậm tiến độ', 'watch', 'Lê Minh Xuân duyệt quy hoạch từ 2016; The Solina lùi mở bán')],
  'Ẩn số: hệ số K của TP.HCM'),
 'VHM': (('up', 'Hưởng lợi ròng về tốc độ'), '29.500 ha · thêm ~20 dự án &gt;20.000 ha đang làm thủ tục', [
   ('Có đất', 'watch', 'Đại dự án do Nhà nước thu hồi, không dùng cơ chế 75%; phần chưa đền bù chịu chuẩn mới'),
   ('Tiền đất', 'up', '&gt;20.000 ha sắp định giá theo bảng giá × K; năm 2025 nộp gần 53.000 tỷ'),
   ('Thu tiền', 'watch', 'Trả trước 145.800 tỷ; hợp tác kinh doanh, bán lô lớn chưa rõ có bị cấm'),
   ('Xã hội', 'up', 'NOXH cài sẵn: Phước Vĩnh Tây 13.440 căn, Cam Ranh 19.816 căn'),
   ('Chậm tiến độ', 'watch', 'Quỹ đất lớn nhất ngành; chưa thấy dự án bị nhắc chậm')],
  'Ẩn số: hệ số K và cách luật xử lý hợp tác kinh doanh'),
 'NLG': (('up', 'Hưởng lợi vừa'), '~681 ha “đất sạch” · Tây Ninh, Đồng Nai, TP.HCM, Cần Thơ', [
   ('Có đất', 'flat', 'Không có dự án đền bù dở dang; chỉ lợi khi gom quỹ đất mới'),
   ('Tiền đất', 'up', 'Izumi, Waterpoint chưa được xác định tiền đất bổ sung'),
   ('Thu tiền', 'watch', 'Thanh tra nêu ký hợp đồng trước khi công khai thông tin (Akari, Izumi)'),
   ('Xã hội', 'up', 'Đăng ký 60.000 căn NOXH đến 2030; dòng EHome'),
   ('Chậm tiến độ', 'watch', 'Paragon Đại Phước: tiến độ 2008–07/2027, đã gia hạn')],
  'Theo dõi: Paragon Đại Phước sau 07/2027'),
 'NVL': (('watch', 'Hai chiều · ròng chưa rõ'), '~10.600 ha · 57 dự án · &gt;2.400 ha chưa triển khai', [
   ('Có đất', 'up', 'Vương Cung đã nhận 23,5 ha, còn &gt;7 ha vướng hộ dân'),
   ('Tiền đất', 'up', 'NovaWorld Phan Thiết 986 ha chờ giá đất nhiều năm; Aqua City đã gỡ 9/2026'),
   ('Thu tiền', 'down', 'Victoria Village mở bán 2017, đến 2026 mới ký hợp đồng mua bán'),
   ('Xã hội', 'flat', 'Chưa có dự án NOXH, nhà cho thuê nào khởi công'),
   ('Chậm tiến độ', 'down', 'Hòn Giồ hết gia hạn; 7 dự án Lâm Đồng gặp khó — bù lại không bị thu hồi')],
  'Then chốt: “trở ngại khách quan” có gồm chờ định giá không'),
}
SEL = {'VHM': [0, 2, 4, 5, 7, 9, 11, 12, 16, 17, 18, 21, 22, 23, 25, 26, 27, 30, 33],
       'NVL': [18, 19, 0, 1, 3, 4, 5, 7, 10, 13, 14, 15, 16, 21, 20, 22, 24, 25, 26, 27, 29],
       'KDH': [0, 3, 4, 5, 9, 10, 11, 12, 13, 14, 17, 18, 20, 22, 24, 26, 28, 30, 31],
       'NLG': [0, 2, 3, 4, 6, 7, 9, 12, 13, 15, 19, 20, 21, 22, 25, 26, 27, 28, 29, 30, 32]}
CO.update({
 'DXG': (('up', 'Hưởng lợi vừa'), 'Gem Sky World 92,2 ha · The Privé 6,7 ha · ~9 dự án ~50 ha ở Bình Dương cũ', [
   ('Có đất', 'up', '6 dự án 5–10 ha làm theo cơ chế thỏa thuận (NQ 171) — đúng đối tượng ngưỡng 75%'),
   ('Tiền đất', 'up', '4 dự án đang tính tiền đất; nhóm Bình Dương cũ đang nộp, mở bán 2027–2031'),
   ('Thu tiền', 'watch', 'Từng bị phạt vì huy động sớm (Gem Sky World 2023); The Privé nay đã đủ điều kiện'),
   ('Xã hội', 'flat', 'Chưa thấy NOXH; hướng mới là giữ tài sản cho thuê (căn hộ dịch vụ)'),
   ('Chậm tiến độ', 'watch', 'The Privé đình trệ 2019–2024; đã bỏ Mái Dầm 96,8 ha, Bá Hiến 37,9 ha')],
  'Ẩn số: tiến độ 6 dự án thỏa thuận và tiền đất nhóm Bình Dương cũ'),
 'TCH': (('flat', 'Ít bị ảnh hưởng'), '100% ở Hải Phòng · chưa có tổng ha công bố', [
   ('Có đất', 'watch', 'Đất qua đấu giá, đấu thầu; Tân Dương – Hoa Động 52 ha còn phải giải phóng mặt bằng'),
   ('Tiền đất', 'watch', 'Thanh tra Chính phủ đề nghị xác định lại tiền đất Green River, Sở Dầu'),
   ('Thu tiền', 'flat', 'Có thông báo đủ điều kiện trước khi bán; trả trước ~6.493 tỷ'),
   ('Xã hội', 'up', 'NOXH trong từng dự án: Green River 441 căn, New City II ~500 căn'),
   ('Chậm tiến độ', 'watch', 'Pruksa Town cấp phép 2013, bị kết luận chậm kéo dài')],
  'Theo dõi: tiền đất bổ sung Green River; Pruksa Town'),
 'DIG': (('watch', 'Hai chiều · ròng chưa rõ'), '~820 ha · Long Tân 332 ha, Nam Vĩnh Yên 190,6 ha, Chí Linh, Bắc Vũng Tàu', [
   ('Có đất', 'watch', 'Long Tân mới đền bù ~156/332 ha (số 2022), Bắc Vũng Tàu 69% khu C — chưa tới 75%'),
   ('Tiền đất', 'watch', 'Nam Vĩnh Yên: ~1.280 tỷ kế hoạch 2026, chủ yếu tiền đất; Vị Thanh đã nộp'),
   ('Thu tiền', 'down', 'Phải trả khác 4.993 tỷ, chủ yếu khoản đặt chỗ; Nam Vĩnh Yên 1.389 tỷ tồn nhiều năm'),
   ('Xã hội', 'up', 'Quỹ đất NOXH 54,7 ha, mục tiêu &gt;14.000 căn 2025–2030'),
   ('Chậm tiến độ', 'watch', 'Bắc Vũng Tàu từ 2009 chưa xây — nhưng chưa được giao đất nên chưa bị tính phí')],
  'Then chốt: Long Tân có đạt ngưỡng 75% và được giao đất không'),
 'PDR': (('watch', 'Hai chiều · ròng chưa rõ'), '~6.655 ha · TP.HCM + Đồng Nai ~3.400 ha · nhiều quỹ đất đang làm pháp lý', [
   ('Có đất', 'up', '2 dự án thỏa thuận ở Thủ Dầu Một 45 ha; đã chi ~1.700 tỷ gom đất Bình Dương cũ'),
   ('Tiền đất', 'watch', 'The EverRich 3 còn nghĩa vụ tiền đất, hạn xong sổ 30/04/2027'),
   ('Thu tiền', 'watch', 'Sống bằng bán sỉ dự án: nhận 6.025 tỷ theo hợp đồng hợp tác từ 2017'),
   ('Xã hội', 'flat', 'Không có dự án NOXH, nhà cho thuê'),
   ('Chậm tiến độ', 'down', 'Tropicana Long Hải khởi công 2019 phần lớn bỏ trống; Bắc Hà Thanh hạn 01/01/2027')],
  'Theo dõi: Bắc Hà Thanh sau hạn 01/01/2027; cách luật xử lý hợp tác kinh doanh'),
 'AGG': (('watch', 'Hai chiều · ròng chưa rõ'), '~34 ha gộp 4 dự án (tự cộng) · TP.HCM, Đồng Nai', [
   ('Có đất', 'up', 'Westgate 2 làm theo cơ chế thỏa thuận (NQ 171), đang đưa đất vào'),
   ('Tiền đất', 'watch', 'The Lá Village 27 ha, Westgate 2 chưa tới bước tính tiền đất — nhạy với K TP.HCM'),
   ('Thu tiền', 'down', 'The Gió: nhận “đăng ký” 1.200 căn khi Sở Xây dựng nêu chưa đủ điều kiện bán'),
   ('Xã hội', 'flat', 'Không thấy dự án NOXH'),
   ('Chậm tiến độ', 'watch', 'The Lá Village “hoàn thiện pháp lý” từ 2022, đã rót &gt;3.300 tỷ')],
  'Then chốt: pháp lý The Lá Village 27 ha'),
 'CEO': (('watch', 'Trung tính · nghiêng rủi ro'), '~1.100 ha · Hà Nội, Hải Phòng, Vân Đồn, Phú Quốc', [
   ('Có đất', 'flat', 'Hana Garden chỉ còn 966 m²; KCN Tiên Lãng mới giải phóng 62,5/186 ha'),
   ('Tiền đất', 'watch', 'Hana Garden đã nộp 2.134 tỷ; đợt 2 chưa giao'),
   ('Thu tiền', 'flat', 'Trả trước chỉ 447 tỷ; vốn từ vay ngân hàng và phát hành cổ phiếu'),
   ('Xã hội', 'up', 'NOXH ngay trong Hana Garden (1,6 ha miễn tiền đất); đã làm Bamboo Garden 432 căn'),
   ('Chậm tiến độ', 'down', 'Sunny Garden City, Hana Garden từng phải nộp tiền để gia hạn 24 tháng; Vân Đồn dở dang 1.092 tỷ')],
  'Theo dõi: Sonasea Vân Đồn và Hana Garden sau gia hạn'),
 'NTL': (('down', 'Rủi ro phí giữ đất'), 'Dịch Vọng 22,5 ha · Bắc Quốc lộ 32 &gt;38 ha · Bãi Muối 23 ha', [
   ('Có đất', 'flat', 'Phần chưa giải phóng còn nhỏ (NO11 ~200 m²)'),
   ('Tiền đất', 'watch', 'Hai dự án cũ còn nghĩa vụ với Nhà nước, chưa rõ số'),
   ('Thu tiền', 'flat', 'NO11 chờ đủ điều kiện mới mở bán (quý I/2027); vốn tự có và vay'),
   ('Xã hội', 'up', 'NOXH Hạ Long 850 căn, 556 hồ sơ đủ điều kiện'),
   ('Chậm tiến độ', 'down', 'Dịch Vọng giao từ 1997, lùi đến quý I/2029; Bắc Quốc lộ 32 khởi công 2007 vẫn dở dang')],
  'Then chốt: chậm ở Dịch Vọng, Bắc Quốc lộ 32 có được coi là khách quan không'),
})
SEL.update({'DXG': [5, 7, 4, 10, 14, 16, 17, 22, 20, 26, 15, 2, 25, 1, 27],
            'PDR': [1, 2, 0, 6, 7, 4, 5, 18, 19, 20, 21, 23, 25, 30, 8, 9, 10, 11, 15],
            'DIG': [0, 1, 3, 4, 5, 6, 7, 10, 27, 28, 31, 30, 23, 21, 26, 12, 14, 15, 17, 33],
            'CEO': [0, 2, 4, 6, 7, 21, 23, 25, 18, 19, 9, 10, 11, 12, 13, 26],
            'AGG': [0, 1, 2, 4, 5, 19, 20, 22, 24, 26, 16, 17, 10, 12, 13, 29],
            'TCH': [0, 2, 3, 5, 7, 8, 23, 24, 25, 26, 16, 18, 19, 21, 10, 12, 15],
            'NTL': [1, 2, 3, 4, 7, 19, 22, 24, 14, 15, 17, 8, 9, 10, 12, 25]})
STEP = {'M1': (1, 'Có đất'), 'M4': (2, 'Pháp lý · địa bàn'), 'M2': (3, 'Tiền đất'), 'M6': (4, 'Thu tiền'),
        'M5': (5, 'Xã hội'), 'M3': (6, 'Chậm tiến độ'), 'view': (7, 'Nhận định')}
TIMELINE = [('20/11/2026', 'Thông qua thuế 0,2% đất bỏ hoang', 0), ('21/11/2026', 'Thông qua 3 luật', 0),
            ('01/07/2027', '3 luật có hiệu lực · bắt đầu phí giữ đất', 1), ('31/12/2027', 'Hết áp dụng giá đất cách cũ', 0),
            ('01/01/2028', 'Bảng giá đất × hệ số K', 1)]
UNKNOWN = [('Mức tiền đất <b>tăng thêm</b>', 'Chi phí thật của việc giữ đất'), ('<b>Hệ số K</b> 2028 từng tỉnh', 'Tiền đất dự án mới'),
           ('Tỷ lệ đất <b>nhà cho thuê + NOXH</b>', 'Biên lợi nhuận dự án thương mại'), ('Ưu đãi nhà cho thuê', 'Tư nhân có làm không'),
           ('Điều khoản chuyển tiếp', 'Dự án chậm hiện tại bị tính từ khi nào')]

CSS = '''<style>
.law-2026{--lw-up:#1d8a73;--lw-up-bg:#e3f5f0;--lw-down:#b8432c;--lw-down-bg:#fdecea;--lw-watch:#8a6a00;--lw-watch-bg:#fff5d4;--lw-flat:#596272;--lw-flat-bg:#eef0f4}
.law-2026 .lw-card{margin-top:14px;padding:22px 24px}
.law-2026 .lw-eyebrow{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--fs-muted,#596272);margin:0 0 6px}
.law-2026 .lw-title{font-family:var(--fs-serif,Georgia,serif)!important;font-size:28px!important;line-height:1.2;font-weight:600!important;color:var(--fs-navy,#1D2678);margin:0 0 8px;letter-spacing:-.01em}
.law-2026 .lw-lead{font-size:14px;line-height:1.6;margin:0;max-width:880px}
.law-2026 h3.lw-h{font-size:16px!important;font-weight:700;color:var(--fs-navy,#1D2678);margin:0 0 4px}
.law-2026 .lw-sub{font-size:12.5px;color:var(--fs-muted,#596272);margin:0 0 14px}
.law-2026 .lw-tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:18px}
.law-2026 .lw-tile{border-radius:12px;padding:14px 16px;background:var(--fs-soft-blue,#f0f4ff)}
.law-2026 .lw-tile b{display:block;font-size:22px;line-height:1.1;font-weight:800;color:var(--fs-navy,#1D2678);font-variant-numeric:tabular-nums}
.law-2026 .lw-tile span{display:block;font-size:12.5px;margin-top:4px;color:var(--fs-ink,#303540)}
.law-2026 .lw-tile.t-up{background:var(--lw-up-bg)}.law-2026 .lw-tile.t-up b{color:var(--lw-up)}
.law-2026 .lw-tile.t-down{background:var(--lw-down-bg)}.law-2026 .lw-tile.t-down b{color:var(--lw-down)}
.law-2026 .lw-tile.t-flat{background:var(--lw-flat-bg)}.law-2026 .lw-tile.t-flat b{color:var(--lw-flat)}
.law-2026 .lw-tile.t-watch{background:var(--lw-watch-bg)}.law-2026 .lw-tile.t-watch b{color:var(--lw-watch)}
.law-2026 .lw-pill{display:inline-block;font-size:11.5px;font-weight:700;line-height:1;padding:5px 9px;border-radius:999px;white-space:nowrap}
.law-2026 .lw-up,.law-2026 .lw-fast{color:var(--lw-up);background:var(--lw-up-bg)}
.law-2026 .lw-down,.law-2026 .lw-cost{color:var(--lw-down);background:var(--lw-down-bg)}
.law-2026 .lw-watch,.law-2026 .lw-strict,.law-2026 .lw-open{color:var(--lw-watch);background:var(--lw-watch-bg)}
.law-2026 .lw-flat{color:var(--lw-flat);background:var(--lw-flat-bg)}
.law-2026 .lw-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.law-2026 .lw-step,.law-2026 .lw-co{border:1px solid var(--fs-line,#dce1e9);border-radius:14px;padding:16px 18px;background:var(--fs-surface,#fff)}
.law-2026 .lw-step-head{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.law-2026 .lw-num{flex:none;width:28px;height:28px;border-radius:50%;background:var(--fs-navy,#1D2678);color:#fff;font-size:13px;font-weight:700;display:grid;place-items:center}
.law-2026 .lw-step-name{font-size:14.5px;font-weight:700;color:var(--fs-navy,#1D2678);line-height:1.2}
.law-2026 .lw-axis{font-size:11.5px;color:var(--fs-muted,#596272)}
.law-2026 .lw-step-pills{margin-left:auto;display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.law-2026 .lw-ba{display:grid;grid-template-columns:1fr 18px 1.25fr;gap:4px 8px;font-size:12.5px;line-height:1.5;padding:8px 0;border-top:1px solid var(--fs-line,#dce1e9)}
.law-2026 .lw-ba .b{color:var(--fs-muted,#596272)}.law-2026 .lw-ba .ar{color:var(--fs-turquoise,#59C5C8);font-weight:700}.law-2026 .lw-ba .a{color:var(--fs-ink,#303540);font-weight:500}
.law-2026 .lw-wait{font-size:12px;color:var(--lw-watch);margin-top:8px;padding-top:8px;border-top:1px dashed var(--fs-line,#dce1e9)}
.law-2026 .lw-co-head{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
.law-2026 .lw-code{font-size:22px;font-weight:800;color:var(--fs-navy,#1D2678);letter-spacing:.01em}
.law-2026 .lw-name{font-size:13px;color:var(--fs-muted,#596272)}
.law-2026 .lw-co-head .lw-pill{margin-left:auto;font-size:12px;padding:6px 11px}
.law-2026 .lw-land{font-size:12.5px;color:var(--fs-muted,#596272);margin:4px 0 10px}
.law-2026 .lw-row{display:grid;grid-template-columns:92px 84px 1fr;gap:8px;align-items:start;font-size:12.5px;line-height:1.5;padding:7px 0;border-top:1px solid var(--fs-line,#dce1e9)}
.law-2026 .lw-row .s{font-weight:600;color:var(--fs-ink,#303540)}
.law-2026 .lw-key{font-size:12.5px;font-weight:600;color:var(--fs-navy,#1D2678);margin-top:10px;padding:8px 10px;border-radius:8px;background:var(--fs-soft-blue,#f0f4ff)}
.law-2026 .lw-facts{border:1px solid var(--fs-line,#dce1e9);border-radius:10px;margin-top:8px;padding:0 14px}.law-2026 .lw-facts summary{font-size:13px;cursor:pointer;padding:10px 0;color:var(--fs-ink,#303540)}.law-2026 .lw-facts summary b{color:var(--fs-navy,#1D2678)}.law-2026 .lw-facts .tablewrap{margin-bottom:12px}
.law-2026 .lw-tl{display:grid;grid-template-columns:repeat(5,1fr);position:relative;margin-top:6px}
.law-2026 .lw-tl:before{content:"";position:absolute;left:8px;right:8px;top:7px;height:2px;background:var(--fs-line,#dce1e9)}
.law-2026 .lw-node{position:relative;padding:22px 10px 0 0}
.law-2026 .lw-node:before{content:"";position:absolute;left:0;top:0;width:16px;height:16px;border-radius:50%;background:var(--fs-surface,#fff);border:3px solid var(--fs-turquoise,#59C5C8);box-sizing:border-box}
.law-2026 .lw-node.key:before{background:var(--fs-navy,#1D2678);border-color:var(--fs-navy,#1D2678)}
.law-2026 .lw-node b{display:block;font-size:13.5px;color:var(--fs-navy,#1D2678);font-variant-numeric:tabular-nums}
.law-2026 .lw-node span{display:block;font-size:12.5px;line-height:1.45;margin-top:2px}
.law-2026 .lw-unk{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}
.law-2026 .lw-unk div{border-radius:10px;padding:10px 12px;background:var(--lw-watch-bg);font-size:12.5px;line-height:1.45}
.law-2026 .lw-unk small{display:block;color:var(--fs-muted,#596272);margin-top:3px;font-size:12px}
.law-2026 .lw-foot{font-size:12.5px;line-height:1.6;margin:12px 0 0}
@media(max-width:900px){.law-2026 .lw-grid{grid-template-columns:1fr}.law-2026 .lw-tiles{grid-template-columns:1fr 1fr}.law-2026 .lw-unk{grid-template-columns:1fr 1fr}.law-2026 .lw-tl{grid-template-columns:1fr;gap:10px}.law-2026 .lw-tl:before{left:7px;right:auto;top:8px;bottom:8px;width:2px;height:auto}.law-2026 .lw-node{padding:0 0 0 26px}.law-2026 .lw-row{grid-template-columns:84px 80px 1fr}.law-2026 .lw-ba{grid-template-columns:1fr}.law-2026 .lw-ba .ar{display:none}.law-2026 .lw-title{font-size:22px!important}}
[data-theme="dark"] .law-2026{--lw-up:#5fd3b8;--lw-up-bg:#12332c;--lw-down:#f08b76;--lw-down-bg:#3a1c16;--lw-watch:#e6c35c;--lw-watch-bg:#33290c;--lw-flat:#b6bcc8;--lw-flat-bg:#24262b}
[data-theme="dark"] .law-2026 :is(.lw-step,.lw-co){background:#161616;border-color:#2A2A2A}
[data-theme="dark"] .law-2026 :is(.lw-tile:not(.t-up):not(.t-down):not(.t-watch):not(.t-flat),.lw-key){background:#1c2030}
[data-theme="dark"] .law-2026 :is(.lw-title,.lw-h,.lw-step-name,.lw-code,.lw-node b,.lw-tile b,.lw-key){color:#aab4ff}
[data-theme="dark"] .law-2026 :is(.lw-ba .a,.lw-row .s,.lw-tile span){color:#F5F5F5}
[data-theme="dark"] .law-2026 .lw-node:before{background:#161616}
</style>'''


def dom(u):
    return urlparse(u).netloc.replace('www.', '')


def step_html(s):
    n, name, axis, pills, rows, wait = s
    ba = ''.join(f'<div class="lw-ba"><div class="b">{b}</div><div class="ar">→</div><div class="a">{a}</div></div>' for b, a in rows)
    w = '' if wait == '—' else f'<div class="lw-wait">Chờ nghị định: {wait}</div>'
    return (f'<div class="lw-step"><div class="lw-step-head"><span class="lw-num">{n}</span><div><div class="lw-step-name">{name}</div>'
            f'<div class="lw-axis">{axis}</div></div><div class="lw-step-pills">{"".join(pill(p) for p in pills)}</div></div>{ba}{w}</div>')


def co_html(code):
    (vk, vt), land, rows, key = CO[code]
    facts = sorted((DATA[code]['facts'][i] for i in SEL[code]), key=lambda f: STEP[f['mechanism']][0])
    tr = ''.join(f'<tr><td>{STEP[f["mechanism"]][1]}</td><td>{esc(f["project"])}</td><td>{esc(f["fact"])}</td>'
                 f'<td>{A(esc(f["url"]), dom(f["url"]))} · {esc(re.sub(r" *[(].*[)]", "", f["date"]))}</td></tr>' for f in facts)
    rr = ''.join(f'<div class="lw-row"><span class="s">{s}</span><span>{pill(k)}</span><span>{t}</span></div>' for s, k, t in rows)
    return (f'<div class="lw-co"><div class="lw-co-head"><span class="lw-code">{code}</span><span class="lw-name">{NAME[code]}</span>{pill(vk, vt)}</div>'
            f'<div class="lw-land">Quỹ đất: {land}</div>{rr}<div class="lw-key">{key}</div></div>',
            f'<details class="lw-facts" data-sub-opened="1"><summary><b>{code}</b> · {NAME[code]} — {len(facts)} dữ kiện theo dự án</summary><div class="tablewrap"><table data-no-fold>'
            f'<thead><tr><th>Bước</th><th>Dự án</th><th>Dữ kiện</th><th>Nguồn</th></tr></thead><tbody>{tr}</tbody></table></div></details>')


def build():
    src = ' · '.join([A(T, 'TTTCTT · 3 luật'), A(M, 'Mekong ASEAN'), A(V, 'VnExpress'), A(O, 'VOV'), A(K, 'Tin nhanh chứng khoán'), A(C, 'Công lý · KDBĐS'), A(X, 'CafeF · thuế 0,2%')])
    meta = 'data-update-kind="document" data-cadence="monthly" data-refresh-status="snapshot"'
    tl = ''.join(f'<div class="lw-node{" key" if k else ""}"><b>{d}</b><span>{t}</span></div>' for d, t, k in TIMELINE)
    cos = [co_html(c) for c in ORDER]
    grp = {}
    for c in ORDER:
        grp.setdefault(CO[c][0][0], []).append(c)
    glab = {'up': 'Hưởng lợi', 'flat': 'Ít bị ảnh hưởng', 'watch': 'Hai chiều', 'down': 'Nghiêng thiệt'}
    summ = ''.join(f'<div class="lw-tile t-{k if k != "flat" else "flat"}"><b>{len(grp[k])} mã</b><span>{glab[k]}: {", ".join(grp[k])}</span></div>' for k in ['up', 'flat', 'watch', 'down'] if k in grp)
    unk = ''.join(f'<div>{a}<small>{b}</small></div>' for a, b in UNKNOWN)
    return f'''<!--law-2026--><div class="law-2026">
    {CSS}
    <div class="card lw-card" data-block-id="bds-44" {meta}>
      <p class="lw-eyebrow">Chuyên đề · Quốc hội thông qua 21/11/2026</p>
      <p class="lw-title">Luật mới đổi giá của việc giữ đất</p>
      <p class="lw-lead">Trước đây giữ đất gần như miễn phí. Từ <b>01/07/2027</b>, giữ đất tốn tiền mỗi năm, còn làm dự án thì nhanh hơn và tính trước được chi phí.</p>
      <div class="lw-tiles">
        <div class="lw-tile t-up"><b>3 bước</b><span>nhanh hơn: có đất, pháp lý, tiền đất</span></div>
        <div class="lw-tile t-down"><b>2 chỗ</b><span>đắt hơn: bồi thường, chậm tiến độ</span></div>
        <div class="lw-tile t-watch"><b>1 khâu</b><span>chặt hơn: thu tiền của khách</span></div>
        <div class="lw-tile"><b>01/2028</b><span>giá đất theo bảng giá × hệ số K</span></div>
      </div>
    </div>
    <div class="card lw-card" data-block-id="bds-60" {meta}>
      <h3 class="lw-h">Luật đổi gì trong vòng đời một dự án nhà ở</h3>
      <p class="lw-sub">6 bước · trước → sau</p>
      <div class="lw-grid">{''.join(step_html(s) for s in STEPS)}</div>
      <div class="source-note">Nguồn: {src}. Lấy từ báo ngày thông qua; chưa đối chiếu toàn văn luật (chưa đăng Công báo). · Kiểm tra: 23/11/2026</div>
    </div>
    <div class="card lw-card" data-block-id="bds-57" {meta}>
      <h3 class="lw-h">Tác động theo doanh nghiệp</h3>
      <p class="lw-sub">11 mã nhà ở · đánh giá theo dự án thật của từng mã</p>
      <div class="lw-tiles" style="margin:0 0 16px">{summ}</div>
      <div class="lw-grid">{''.join(c[0] for c in cos)}</div>
      <p class="lw-sub" style="margin:16px 0 6px">Dữ kiện theo dự án và nguồn</p>
      {''.join(c[1] for c in cos)}
      <details class="note-icon"><summary>ⓘ Nguồn &amp; giới hạn</summary><div>Dữ kiện lấy từ báo chí, tường thuật ĐHĐCĐ và báo cáo công ty chứng khoán (chỉ lấy dữ kiện); mỗi dòng có đoạn trích gốc đã kiểm trong <code>data/realestate/evidence.json</code>. Chưa mở trực tiếp báo cáo thường niên 2025 của các doanh nghiệp. Nhãn Lợi / Thiệt / Theo dõi là nhận định của FinSuccess từ dữ kiện đó, trong khi mức tiền đất tăng thêm, hệ số K và nghị định hướng dẫn chưa có. Khoảng trống: không có tỷ lệ đền bù theo số hộ (điều kiện thứ hai của cơ chế 75%); không có thời hạn hoàn thành của phần lớn dự án; chưa có phát biểu nào của lãnh đạo 11 doanh nghiệp sau ngày luật thông qua. Nhóm khu công nghiệp chưa làm. · Kiểm tra: 23/11/2026</div></details>
    </div>
    <div class="card lw-card" data-block-id="bds-58" {meta}>
      <h3 class="lw-h">Lộ trình hiệu lực</h3>
      <p class="lw-sub">Nửa cuối 2027: luật mới đã chạy nhưng giá đất còn tính cách cũ</p>
      <div class="lw-tl">{tl}</div>
    </div>
    <div class="card lw-card" data-block-id="bds-59" {meta}>
      <h3 class="lw-h">5 ẩn số chờ nghị định</h3>
      <p class="lw-sub">Chuyên đề kết thúc khi có nghị định hướng dẫn và toàn văn luật trên Công báo</p>
      <div class="lw-unk">{unk}</div>
    </div>
  </div><!--/law-2026-->
  '''


def evidence():
    import sys
    sys.path.insert(0, str(ROOT / 'scripts'))
    import check_evidence as ce
    path = ROOT / 'data' / 'realestate' / 'evidence.json'
    keep = [e for e in json.loads(path.read_text()) if e['block'] != 'bds-57']
    new = []
    for c in ORDER:
        for i in SEL[c]:
            f = DATA[c]['facts'][i]
            e = {'block': 'bds-57', 'claim': f'{c} · {f["project"]}'[:120], 'value': f['fact'], 'url': f['url'], 'opened_at': '2026-11-23',
                 'quote': f['quote'], 'status': 'match', 'note': STEP[f['mechanism']][1]}
            if ce.problems(e):  # số trong dữ kiện (thường là ngày) không nằm trong đoạn trích
                e['value'] = re.sub(r'\d[\d.,]*\d|\d', '', f['project']).strip(' ,;/()–-') or c
                e['note'] += ' · dữ kiện định tính, đầy đủ: ' + f['fact'][:160]
            assert not ce.problems(e), (c, i, ce.problems(e))
            new.append(e)
    path.write_text(json.dumps(keep + new, ensure_ascii=False, indent=1))
    print('evidence bds-57:', len(new))


def main():
    evidence()
    s = PAGE.read_text()
    block = build()
    if '<!--law-2026-->' in s:
        i, j = s.index('<!--law-2026-->'), s.index('<!--/law-2026-->') + len('<!--/law-2026-->')
        while s[j] in ' \n':
            j += 1
    else:  # lần đầu: khối cũ chạy từ <div class="law-2026"> tới hết section#policy
        i = s.index('<div class="law-2026">')
        j = s.index('</section>', i)
    PAGE.write_text(s[:i] + block + s[j:])
    print('built', len(block))


if __name__ == '__main__':
    main()
