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

Use Arial / Helvetica Neue / system sans across the hub and sector dashboards.
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
