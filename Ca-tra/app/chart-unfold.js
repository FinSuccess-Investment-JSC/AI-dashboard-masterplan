/* Gói ngành · chart không nằm trong mục thu gọn (25/11/2026, quy tắc lấy từ trang Điện, PR #22: "không giấu chart trong mục
   thu gọn; chữ/bảng vẫn được thu gọn"). Mục <details> nào trong tab có chart (canvas, chart Chart.js của chart-types.js, sơ đồ)
   thì mở sẵn và giữ mở; dòng tiêu đề của mục thành nhãn nhóm (không bấm được). Bỏ qua mục ⓘ ghi chú, bảng dữ liệu, nguồn.
   Mở bằng thuộc tính open nên module nào vẽ chart khi mục được mở (sự kiện toggle) vẫn chạy như cũ. */
(() => {
'use strict';
const CHART = 'canvas, [data-ct-type], .ct-canvas, .value-chain-scroll';
const SKIP = '.note-icon, .dtable, .chart-source-details, .source-details, .chart-info, [data-keep-folded]';
function run() {
  document.querySelectorAll('.majorpane details:not(.su-open)').forEach(d => {
    if (d.matches(SKIP)) return;
    // Chart nằm trong mục ⓘ / bảng dữ liệu của chính mục này thì không tính.
    const own = [...d.querySelectorAll(CHART)].filter(c => { const s = c.closest(SKIP); return !s || !d.contains(s); });
    if (!own.length) return;
    d.open = true;
    d.classList.add('su-open');
    d.addEventListener('toggle', () => { if (!d.open) d.open = true; });
  });
}
let t = 0; const later = (ms = 300) => { clearTimeout(t); t = setTimeout(run, ms); };
SectorBoot.add(1400, run); // sector-boot.js: trước dòng nguồn (1500) để chart vừa mở cũng có nguồn
document.addEventListener('click', e => { if (e.target.closest('button, a, [role=tab]')) later(500); });
})();
