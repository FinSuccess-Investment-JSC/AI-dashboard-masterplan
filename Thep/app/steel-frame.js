/* Thép · tab lớn Tài chính ngành (#mt14, 27/11/2026, theo mẫu Điện).
   research-layout.js tạo pane mt14 và thanh tab (đã bỏ tab Chính sách · Thuế · Thương mại mt4).
   File này chạy ngay sau research-layout.js, trước pane-subtabs.js:
   - bỏ pane mt4 (đã rỗng);
   - dời So sánh tài chính (.financial-comparison), P/B các nhóm (th-03) và Doanh nghiệp theo dõi (th-04) từ Tổng quan sang mt14;
   - dời Chuỗi giá trị theo slide (th-05) lên trên sơ đồ th-01;
   - chỗ chứa sub-tab 01 Tài chính ngành (.steel-fin-host), app/steel-finance.js dựng chart khi tab hiện.
   pane-subtabs.js chia mt14 thành 01 Tài chính ngành · 02 Doanh nghiệp niêm yết. Khối được dời, không nhân bản. */
(() => {
'use strict';
if (document.body.dataset.sector !== 'steel') return;
const $ = s => document.querySelector(s);
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
$('.majorpane[data-tab="mt4"]')?.remove();
// Chuỗi giá trị theo slide (th-05) đứng đầu sub-tab Chuỗi giá trị, trên sơ đồ vị trí doanh nghiệp (th-01).
const chain = $('[data-block-id="th-05"]'), oldChain = $('[data-block-id="th-01"]');
if (chain && oldChain) oldChain.before(chain);
const p14 = $('.majorpane[data-tab="mt14"]'), p1 = $('.majorpane[data-tab="mt1"]');
if (!p14 || !p1) return;
p14.append(el('div', 'sectionhead', '<div><h2 class="sec">Tài chính ngành</h2><p>Số liệu tài chính của 8 doanh nghiệp thép niêm yết: tổng hợp theo nhóm và từng doanh nghiệp.</p></div>'));
p14.append(el('div', 'steel-fin-host'));
[p1.querySelector('.financial-comparison'), p1.querySelector('[data-block-id="th-03"]'), p1.querySelector('[data-block-id="th-04"]')]
  .filter(Boolean).forEach(n => p14.append(n));
})();
