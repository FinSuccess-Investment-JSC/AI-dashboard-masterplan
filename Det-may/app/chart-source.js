/* Gói ngành · dòng "Nguồn: …" hiện sẵn (mẫu từ Dien/app/power-chart-source.js) ở góc phải dưới mọi chart (25/11/2026, yêu cầu người dùng: không giấu nguồn trong ⓘ hay mục thu gọn;
   ghi chú nếu có thì ngắn, chữ nhỏ, ngay dưới dòng nguồn). Không viết chú thích thiếu dữ liệu lên trang.
   Tên nguồn lấy theo thứ tự: nguồn chính trong bảng ⓘ của chart (chart-cards.js) → dòng "Nguồn:" có sẵn trong khối → nguồn theo
   data-source-ids (SECTOR_DAILY.sources). Chạy lại sau mỗi lần đổi tab vì nhiều chart dựng khi mở lần đầu. */
(() => {
'use strict';
const CHART = 'canvas, [data-ct-type], .ct-canvas, .pv-hm, .vw, .vu-kwh, .ov-spark, .ov-bars, .value-chain-scroll, .ov-q8-bars';
const UNIT = '.vt-chart-i, .db-c, .viz-block, .card';
const make = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const clean = t => String(t || '').replace(/\s+/g, ' ').trim();
// "Nguồn: A; B. Câu giải thích…" → "A; B"
const firstPart = t => clean(t).replace(/^Nguồn\s*:\s*/i, '').split(/\.\s+(?=[A-ZĐÀ-Ỹ])/)[0].replace(/\.$/, '')
  // bỏ phần mô tả cách tính đi sau tên nguồn ("…; cộng các bản tin…", "…, cộng theo tháng…")
  .split(/[;,]\s+(?=(?:cộng|tính|không|chỉ|bình quân|lấy|gồm|so |trừ|chia|như|đọc|ghép|quy đổi))/)[0];
// Chart không có dòng nguồn trong mã gốc: nguồn ghi tay theo tiêu đề (khớp phần đầu tiêu đề).
// Nguồn ghi tay theo tiêu đề chart cho ngành này (nếu cần): window.SECTOR_SOURCE_MANUAL = [[/^Tiêu đề/, 'Nguồn'], …]
const MANUAL = window.SECTOR_SOURCE_MANUAL || [];

// Bỏ phần ghi chú kỹ thuật/tiếng Anh trong tên nguồn.
const tidy = h => h.replace(/\s*\(public chart data, unofficial\)/g, '').replace(/\s*qua job dữ liệu của trang/g, '');
function sourceOf(unit) { return tidy(sourceRaw(unit)); }
function sourceRaw(unit) {
  const out = [];
  const btn = [...unit.querySelectorAll('.chart-info-button[aria-controls]')].find(b => b.closest(UNIT) === unit);
  const panel = btn && document.getElementById(btn.getAttribute('aria-controls'));
  panel?.querySelectorAll('.chart-primary-source').forEach(a => out.push(a.href ? `<a href="${esc(a.href)}" target="_blank" rel="noopener">${esc(clean(a.textContent))}</a>` : esc(clean(a.textContent))));
  if (out.length) return out.join(' · ');
  const note = [...unit.querySelectorAll('.source-note, .ct-source-panel, .srcrow, p, div')].find(n => n.closest(UNIT) === unit && !n.classList.contains('pw-src') && /^\s*Nguồn\s*:/i.test(n.textContent) && n.textContent.length < 600);
  if (note) { const a = note.querySelector('a[href]'), txt = firstPart(note.textContent); return a && txt.includes(clean(a.textContent)) ? esc(txt).replace(esc(clean(a.textContent)), `<a href="${esc(a.href)}" target="_blank" rel="noopener">${esc(clean(a.textContent))}</a>`) : esc(txt); }
  const ids = (unit.dataset.sourceIds || unit.closest('[data-source-ids]')?.dataset.sourceIds || '').split(',').filter(Boolean);
  const names = ids.map(id => window.SECTOR_DAILY?.sources?.[id]).filter(Boolean).map(s => s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name || s.id)}</a>` : esc(s.name || s.id));
  if (names.length) return [...new Set(names)].join(' · ');
  const title = clean((unit.querySelector('.chart-title') || unit.querySelector('h3, h4, .db-l, b'))?.textContent || unit.textContent).slice(0, 120);
  const m = MANUAL.find(([rx]) => rx.test(title) || rx.test(clean(unit.textContent)));
  return m ? esc(m[1]) : '';
}

const missing = new Set();
function run() {
  missing.clear();
  const units = new Set();
  document.querySelectorAll('.majorpane').forEach(pane => pane.querySelectorAll(CHART).forEach(c => { const u = c.closest(UNIT); if (u && pane.contains(u)) units.add(u); }));
  // Khối con (biểu đồ trong khâu chuỗi giá trị, thẻ doanh nghiệp) đứng riêng; bỏ khối cha nếu đã có khối con mang nguồn.
  [...units].forEach(u => { if ([...units].some(v => v !== u && u.contains(v))) units.delete(u); });
  units.forEach(u => {
    if (u.querySelector(':scope > .pw-src')) return;
    const src = sourceOf(u);
    if (!src) { missing.add(clean(u.querySelector('.chart-title, h3, h4, b')?.textContent).slice(0, 80) || u.className); return; }
    const foot = make('div', 'pw-src', `Nguồn: ${src}`);
    u.append(foot);
    // Ghi chú ngắn của chart (chart-cards: .chart-caveat) đặt ngay dưới dòng nguồn.
    [...u.querySelectorAll('.chart-caveat')].filter(n => n.closest(UNIT) === u).forEach(n => { n.classList.add('pw-src-note'); foot.after(n); });
  });
  document.documentElement.dataset.pwSrcMissing = [...missing].join(' | ');
}
let t = 0; const later = (ms = 400) => { clearTimeout(t); t = setTimeout(run, ms); };
// sector-boot.js: chạy một lượt khi dựng trang (sau mọi module khác), chạy lại sau load để bắt chart vẽ muộn.
SectorBoot.add(1500, run);
addEventListener('load', () => setTimeout(run, 3500));
document.addEventListener('click', e => { if (e.target.closest('button, a, [role=tab]')) later(700); });
addEventListener('popstate', () => later(700));
})();
