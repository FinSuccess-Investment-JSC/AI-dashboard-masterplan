# FinSuccess design rules for industry dashboards

Adapted on 29/09/2026 from `Stock dashboard/CLAUDE.md` and `_template/brand.css`.
The local implementation is `assets/fin-success-theme.css`, loaded last on the hub,
Oil, Sugar and Bank pages. Keep design changes there when possible.

## Color

| Role | Color |
| --- | --- |
| Primary navy | `#1D2678` |
| Data blue | `#2938A8` |
| Turquoise | `#59C5C8` |
| Purple | `#861C52` |
| Warm yellow | `#FFD45D` |

Use white cards, dark ink `#303540`, and quiet blue-gray borders. Navy/blue carry
headings, selected controls and primary series. Turquoise, purple and yellow are
limited to chart series and highlights. Use darker text shades of turquoise/yellow
on white for legibility. Keep red/orange for negative values, material risk and
source errors; never recolor a warning to imply a positive state.

Keep each chart series color stable when changing period or view. For stacked bars,
one series uses navy; two use blue/turquoise; three use blue/turquoise/purple in
stack order. For four or more additive series, use spread steps from
`#1D2678`, `#2938A8`, `#4354B7`, `#6171C5`, `#8997D6`, `#B3BDE8`, `#D9DEF4`.
Reference lines are not counted. Do not stack measures that are not additive.

The source-cadence badges retain distinct pastel backgrounds and the same
`data-update-kind` semantics from `DASHBOARD_WORKFLOW.md`. Charts keep white
surfaces. Data limitations stay visible in `.data-gap` and `.gap-row`.

## Type and copy

Use Inter (Google Fonts, fallback Arial / system sans) across the hub and sector dashboards, like the Stock dashboard.
Body text is dark ink; section headings and primary numbers are navy. Tables and
numbers use tabular figures. Keep titles, units, period, actual/estimate/forecast
labels and the source action clear. Secondary text stays beside the data it
explains: the existing ⓘ insight and Source controls hold longer explanations.
The default view stays concise, with detail in the existing disclosure controls.
Do not hide material limitations or analyst attribution to make a card shorter.

## Sub-tab

Nút sub-tab (Thế giới / Việt Nam, Chuỗi giá trị…) nền trắng viền nhạt, mục đang chọn nền teal nhạt, chữ đen; chữ thường (400), chỉ mục đang chọn đậm (700); không dùng nền navy cho sub-tab (navy dành cho tab lớn). CSS ở cuối `assets/fin-success-theme.css`.

## Layout

Use white cards, 16px corner radius, thin borders and a light shadow. Keep the
main analytical question and its data together; avoid duplicate cards and excess
empty space. On narrow screens, preserve readable labels and controls before
trying to fit more columns. Hover, focus, touch and print behavior of source and
insight controls must remain available.

Charts in a paired row use equal-width cards. Standard time-series charts have
at least a 250-unit SVG plot height (240 for dense bank blocks); only content-led
horizontal comparisons may be shorter or taller. Axis labels use a dark ink
shade, at least 12 SVG units and semibold weight so they remain readable when
the chart scales into a card. Legend swatches must match the plotted series.

Every quantitative chart carries the shared type switcher (Cột / Cột chồng / Thanh /
Đường / Miền, `assets/chart-types.js`); invalid types stay visible but disabled with a
reason. Large data tables (more than 8 rows) start collapsed in a dropdown; tables that
hold data limitations stay visible. See `DASHBOARD_WORKFLOW.md` §15.

The stock dashboard's financial-model input/forecast rules are not transferred
to these sector dashboards unless a matching feature is added deliberately.

## Chart cùng cỡ, không khung màu theo loại dữ liệu (08/10/2026)

- Mọi chart cột/đường/vùng trong một dashboard có cùng chiều cao vẽ (viewBox 640×260); chart ngang (hbar) cũng đệm về 260. `chart-types.js` dùng chung (trừ Bank) và hàm vẽ inline trong `Dau-khi/index.html` đều theo quy tắc này; không đặt `height` riêng cho từng chart.
- Thẻ không chứa chart trong lưới 2 cột (vd. thẻ chỉ có `details`) chiếm cả hàng, không đứng cạnh chart làm khung rỗng bị kéo dãn.
- Khối `[data-update-kind]` không còn nền/viền trên theo màu loại dữ liệu; loại dữ liệu chỉ hiển thị bằng badge nhỏ trên khối và chú giải ở Sources. Quy tắc ở cuối `assets/fin-success-theme.css`.

## Đồng bộ với Stock dashboard (10/10/2026)

Người dùng yêu cầu font, cỡ chữ và cách trình bày giống Stock dashboard, áp cho mọi dashboard ngành và trang tổng. CSS ở cuối `assets/fin-success-theme.css`, logo bar chèn bởi `assets/site-navigation.js` (`assets/fin-success-logo.png`, lấy từ `_template` của Stock dashboard).

- Thứ tự đầu trang: logo FinSuccess (nền trắng) → thanh chọn ngành (chữ, ngành đang xem gạch chân teal) → dải tên ngành 20px navy → tab chính.
- Tab chính: chữ 13,5px đậm 600 màu `#5a6682`, đang chọn navy + gạch chân teal 3px; không dùng nút viên thuốc nền navy nữa (sub-tab giữ kiểu viên thuốc trắng/teal nhạt).
- Tiêu đề mục 22px navy có vạch teal bên trái; tiêu đề chart 16px; chữ phụ 12–13px `#596272`.
- Ô chỉ số: nhãn in hoa 11px, số 22px đậm 800 navy. Bảng 13px, tiêu đề nền `#F0F4FF`. Card viền `#d9dde4`, bo 16px, padding 22px.
- Trang có `.topbar` (trang tổng, Ngân hàng): nền trắng, ẩn chữ thương hiệu vì đã có logo.
- (10/10/2026) Thanh chọn ngành ẩn ở mọi trang (CSS cuối fin-success-theme.css); chuyển ngành bằng ô Tra cứu ngành, gợi ý ngành không kèm chữ phụ.
- (10/10/2026) Trang gốc bỏ lưới thẻ ngành, chỉ còn logo + ô "Tra cứu ngành" (placeholder "Nhập tên ngành…") + thanh chọn ngành; mục "Trang tổng" bỏ khỏi thanh điều hướng, bấm logo để về trang gốc. Gõ mã cổ phiếu vẫn tìm được nhưng không ghi trên nhãn.
- Ô **Tra cứu ngành** dưới logo, cùng kiểu với "Tra cứu cổ phiếu" của Stock dashboard (`_template/tools/build_stock_site.py`): gõ tên ngành (không dấu cũng được) hoặc mã; chọn mã mở trang ngành ở Tổng quan › So sánh tài chính, lọc sẵn mã (`?ma=`). Danh sách mã lấy từ `data/company-comparison.js`; code trong `assets/site-navigation.js`.

## Theo design rule Stock dashboard (28/10/2026)

Người dùng yêu cầu dùng design rule của Stock dashboard cho dashboard ngành. Block cuối `assets/fin-success-theme.css` lấy theo `_template/brand.css`: font Inter; card bo 14px, viền `#E6E9F2`, bóng `--fs-shadow` (hover `--fs-shadow-h`); tiêu đề mục 20px/800; tiêu đề chart 14.5px có gạch dưới `#EEF0F6`; ô chỉ số hiện vạch gradient blue→turquoise khi hover; tiêu đề bảng (trừ `.fintbl`) in hoa 11px nền `#F7F8FC`, hàng chẵn tô rất nhạt. Thang chữ 12·13·14·16·20·24·30, không chữ gradient. Chỉ đổi hình thức; giữ nguyên nút, bộ lọc và giới hạn dữ liệu. Khi Stock đổi `brand.css`, cập nhật block này cho khớp.

Bổ sung 28/10/2026 (vòng 2–3, thay quy tắc sub-tab viên teal 08/10): ô tra cứu cùng hàng logo; tên ngành dạng chip nền `#F0F3FF`; tab chính không đánh số (bỏ số bằng `site-navigation.js`, thứ tự giữ nguyên); sub-tab và nút kiểu chart là thanh xám `#F1F3F9` liền, mục chọn nền trắng chữ navy (như `fin-subnav`/`seg-share-ctl`); cụm Trục khung viền, mục chọn navy (như `axis-mode`); chú giải chấm tròn 14px; dải KPI gộp một khung, ô ngăn bằng vạch dọc. Sau khi đổi CSS/JS phải chạy `scripts/prepare_release.py --version …` để trang nạp file mới.

## Chuẩn tham chiếu (người dùng chốt 28/10/2026)

"Design rule của Stock dashboard" = **trang /design/ của Stock** (`_template/design.html`: token màu, kiểu chữ, KPI, segmented control, chuyển động) **+ FISC Market design-rules v3.2** (`design-rules.json`: thẻ nổi, thanh tab, tiêu đề serif, bảng). Màu luôn theo 5 token FinSuccess; không dùng `#2b51b6`/`#27af95` của FISC. Block "Vòng 4" cuối `assets/fin-success-theme.css` ghi đè các vòng trước:
- Tiêu đề trang Newsreader 500/34px navy. Tab chính: khung trắng nổi bo 14px, sticky, mục chọn nền navy chữ trắng (thay gạch chân teal).
- Card viền trong suốt, bóng float, hover nhấc 2px. Tiêu đề card Inter 600/14.
- KPI: nhãn 10.5px/700 in hoa, số Inter 700/28 navy; dải KPI một khung.
- Bảng: tiêu đề 10.5px muted, không kẻ giữa hàng, hover nền teal rất nhạt.
- Sub-tab và nút chart: segmented control xám, mục chọn nền trắng.

## Rule thiết kế Stock Dashboard (người dùng gửi 28/10/2026) — chuẩn hiện hành

Người dùng gửi bản "Rule thiết kế — Website Stock Dashboard" (tổng hợp từ CLAUDE.md Stock 28/10/2026); bản này **thay mục "Chuẩn tham chiếu"/Vòng 4 ở trên**. Áp vào ngành (block "Vòng 5" cuối `fin-success-theme.css` + đoạn cuối `site-navigation.js`):
- Chỉ Inter, thang 12·13·14·16·20·24·30; không serif, không chữ gradient. Không lặp số thứ tự (tab không đánh số).
- Brand bar trắng + logo + ô tra cứu; tên ngành dạng chip navy; tab chữ gạch chân teal như Stock đang chạy.
- Sub-nav gọn 13px, cao 32–36px, ngang 10–14px.
- Card chart: **một icon ⓘ cạnh tiêu đề** chứa giải thích + dòng `Nguồn:`; không còn nút "ⓘ Insight"/"ⓘ Nguồn" dưới chart (script gộp popover, giữ nguyên nội dung).
- Hiệu ứng không đổi vùng vẽ (bỏ nhấc card khi hover); chuyển động 150–400 ms.
- Phần rule Stock về Tab Tài chính 5 sub-tab, bảng `financials`, bảng nhập analyst, Consensus không áp cho ngành (không có tính năng tương ứng).
