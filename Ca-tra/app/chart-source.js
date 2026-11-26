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

// Chỉ ghi tên nguồn gốc, không diễn giải (người dùng chốt 26/11/2026, giống trang cổ phiếu):
// bỏ (…), "· phần mô tả chữ thường", ngày tháng, "Nguồn:" lặp; nhiều năm BCTC chỉ giữ năm mới nhất.
const tidy = h => {
  h = String(h || '').replace(/\s*\(public chart data, unofficial\)/g, '').replace(/\s*qua job dữ liệu của trang/g, '')
    .replace(/^(\s*Nguồn\s*:\s*)+/i, '').replace(/\bundefined\b/g, '')
    .replace(/\s*\(([^()<>]*)\)/g, (m, x) => { const k = x.match(/VNDirect|CafeF|Vietstock|WiData/i); return k ? ' (' + ({vndirect:'VNDirect',cafef:'CafeF',vietstock:'Vietstock',widata:'WiData'})[k[0].toLowerCase()] + ')' : ''; })
    .replace(/\s+theo (quý|năm|tháng)(?=[\s(;]|$)/g, '')
    .replace(/\s*·\s*(?=[a-zà-ỹđ])[^·;<]*/g, '')
    .replace(/,?\s*\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, '').replace(/,?\s*\b\d{1,2}\/\d{4}\b/g, '').replace(/\s+không rõ(?=\s*(;|$))/g, '').replace(/,?\s*\b(?:T|Q)\d{1,2}\/\d{2,4}\b/g, '');
  const parts = h.split(/(?<!&amp|&lt|&gt|&quot|&#39);\s*/).map(x => x.replace(/^[\s·,]+|[\s·,]+$/g, '')).filter(x => x && !/^(<a[^>]*>)?\s*(<\/a>)?$/.test(x) && !/^(tự tính|đường viền|không rõ)/i.test(x.replace(/<[^>]+>/g, '').trim())).slice(0, 4);
  const plain = x => x.replace(/<[^>]+>/g, '').trim(), out = [];
  parts.forEach(x => { if (!out.some(y => plain(y).toLowerCase() === plain(x).toLowerCase())) out.push(x); });
  const yr = x => +((plain(x).match(/^(BCTC[^\d]*?)\s(20\d\d)$/) || [])[2] || 0), kind = x => plain(x).replace(/\s20\d\d$/, '');
  return out.filter((x, i) => !yr(x) || !out.some((z, j) => j !== i && kind(z) === kind(x) && (yr(z) > yr(x) || (yr(z) === yr(x) && j < i)))).join('; ');
};
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
  // Dòng nguồn do module riêng của trang dựng cũng rút gọn theo cùng quy tắc.
  document.querySelectorAll('.pw-src').forEach(n => { if (n.dataset.tidied === n.innerHTML) return; const t = tidy(n.innerHTML); if (t) n.innerHTML = 'Nguồn: ' + t; n.dataset.tidied = n.innerHTML; });
  document.documentElement.dataset.pwSrcMissing = [...missing].join(' | ');
}
let t = 0; const later = (ms = 400) => { clearTimeout(t); t = setTimeout(run, ms); };
// sector-boot.js: chạy một lượt khi dựng trang (sau mọi module khác), chạy lại sau load để bắt chart vẽ muộn.
SectorBoot.add(1500, run);
addEventListener('load', () => setTimeout(run, 3500));
document.addEventListener('click', e => { if (e.target.closest('button, a, [role=tab]')) later(700); });
addEventListener('popstate', () => later(700));
})();
