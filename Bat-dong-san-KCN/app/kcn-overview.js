/* BĐS KCN · Tổng quan ngành (#mt1), 4 sub-tab theo mẫu trang Điện (power-overview.js), 25/11/2026:
   00 Bản đồ ngành (chỉ chuỗi giá trị) · 01 Chuỗi giá trị theo mô hình kinh doanh · 02 Doanh nghiệp niêm yết
   (so sánh tài chính & định giá, bảng doanh nghiệp) · 03 Triển vọng (nguồn cung mới 2026–2028, điều kiện đổi chiều, chính sách).
   Nội dung lấy từ các khối đã dựng sẵn (research-layout.js: lộ trình, mô hình kinh doanh, so sánh tài chính; kcn-brief.js: chuỗi giá trị)
   và workbook KCN (window.KcnWS từ kcn-workspace.js). Thêm mục "Dữ liệu khu công nghiệp" vào tab Nguồn dữ liệu.
   Không tạo số khi thiếu dữ liệu. Deep-link: ?ov=<map|model|companies|forward>#mt1. */
(() => {
'use strict';
if (document.body.dataset.sector !== 'industrial') return;
const $ = (s, r = document) => r.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const nf = (v, d = 0) => Number.isFinite(v) ? v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}) : '—';
const gap = t => el('p', 'pp-gap data-gap', 'Chưa có dữ liệu: ' + t);
const refit = root => setTimeout(() => { window.dispatchEvent(new Event('resize')); (root || document).querySelectorAll('canvas').forEach(c => { const ch = window.Chart?.getChart?.(c); if (ch) ch.resize(); }); }, 30);
function sec(id, num, q, body, opts = {}) {
  const s = el('section', 'ov-sec'); s.id = 'ov-' + id;
  s.innerHTML = `<header class="ov-sh"><span class="ov-num">${esc(num)}</span><div><h3>${esc(q)}</h3>${opts.sub ? `<p>${opts.sub}</p>` : ''}</div></header>`;
  [].concat(body).filter(Boolean).forEach(n => s.append(typeof n === 'string' ? el('div', '', n) : n));
  if (opts.method) s.append(el('details', 'ov-an ov-method', `<summary>Dữ liệu & phương pháp</summary><div>${opts.method}</div>`));
  return s;
}
const block = id => document.querySelector(`[data-block-id="${id}"]`);

/* ---------- 00 · Bản đồ ngành ---------- */
// 26/11/2026 (người dùng): Bản đồ ngành chỉ gồm chuỗi giá trị; KCN không có số toàn hệ thống tương đương "% công suất nguồn" của Điện.
function mapPane(p) {
  const vc = block('kcn-01');
  if (vc) { vc.closest('.grid')?.classList.remove('grid'); }
  p.append(vc ? sec('chain', '0.1', 'Đất, vốn và khách thuê đi qua những ai?', vc, {sub: 'Bốn dòng sản phẩm: đất khu công nghiệp, nhà xưởng xây sẵn, dịch vụ tiện ích, đô thị kèm khu công nghiệp. Rê chuột vào một khâu để xem luồng; bấm khâu để xem các mã niêm yết.'}) : gap('chưa dựng được sơ đồ chuỗi giá trị.'));
}

/* ---------- 01 · Chuỗi giá trị theo mô hình kinh doanh ---------- */
function modelPane(p, pane) {
  const bm = pane.querySelector('.business-models'), road = pane.querySelector('.research-roadmap');
  if (bm) bm.querySelector(':scope>h2')?.remove();
  if (road) road.querySelector(':scope>h2')?.remove();
  p.append(
    bm ? sec('models', '1.1', 'Mỗi mô hình kinh doanh tạo doanh thu và ghi nhận lợi nhuận thế nào?', bm, {sub: 'Cho thuê đất trả một lần, nhà xưởng cho thuê theo năm, dịch vụ tiện ích, và doanh nghiệp đa ngành có mảng KCN.'}) : null,
    road ? sec('steps', '1.2', 'Ba bước từ đất đến doanh thu', road, {sub: 'Đất & đền bù → vốn & hạ tầng → cho thuê & bàn giao.'}) : null
  );
}

/* ---------- 02 · Doanh nghiệp niêm yết ---------- */
function companiesPane(p, pane) {
  const fc = pane.querySelector('.financial-comparison');
  const players = block('kcn-03');
  p.append(
    fc ? sec('compare', '2.1', 'Doanh nghiệp KCN đang được định giá và có lợi nhuận ra sao?', fc, {sub: 'Định giá theo phiên (VNDirect), so sánh tài chính và xu hướng theo quý của 7 mã hạ tầng khu công nghiệp. Tài chính toàn ngành ở tab Bức tranh ngành › Tài chính ngành.'}) : null,
    players ? sec('players', '2.2', 'Doanh nghiệp nào làm gì, biến lợi nhuận chính là gì?', players) : null
  );
}

/* ---------- 03 · Triển vọng ---------- */
function forwardPane(p) {
  const D = window.KCN_MARKET, K = window.KcnInsights;
  const REG = {North: 'Miền Bắc', South: 'Miền Nam'};
  const pipe = D && K ? K.pipelineRatios(D) : [];
  const supply = el('div', 'card ov-q8');
  if (pipe.length) {
    const max = Math.max(...pipe.map(x => x.pipeline || 0), 1);
    supply.innerHTML = `<div class="chart-title">Nguồn cung đất KCN dự kiến 2026–2028 theo vùng (ha)</div><div class="chart-sub">dự phóng C&W · tỷ lệ so nguồn cung hiện hữu trong phạm vi khảo sát · chưa phải đất sạch sẵn sàng bàn giao</div>
      <div class="ov-q8-bars">${pipe.map(x => `<div class="ov-q8-r"><span class="ov-q8-l">${esc(REG[x.region] || x.region)}</span><div class="ov-q8-t" title="${esc(REG[x.region] || x.region)}: ${nf(x.pipeline)} ha"><i style="width:${(x.pipeline / max * 100).toFixed(1)}%;background:${x.region === 'North' ? '#2938A8' : '#2a9fa3'}"></i></div><span class="ov-q8-v">${nf(x.pipeline)} ha · ${nf(x.ratio * 100, 0)}%</span></div>`).join('')}</div>
      <a class="ov-more" href="?kcn=supply#mt2" data-kcn-go="supply">Xem nguồn cung theo tỉnh và dự án →</a>`;
  } else supply.append(gap('workbook chưa có số cung dự kiến.'));
  // Điều kiện để chủ đề đang theo dõi kết thúc (lấy nguyên văn từ thẻ chủ đề nóng).
  // research-editorial.js gói chủ đề vào article.research-topic (tiêu đề ở summary) và bỏ data-topic-key.
  const cond = [...document.querySelectorAll('#pane-mt7 .research-topic, #pane-mt7 [data-topic-key]')].map(t => {
    const title = t.dataset.topicTitle || t.querySelector('summary')?.textContent.trim() || '', m = [...t.querySelectorAll('p')].find(x => /Điều kiện kết thúc/.test(x.textContent));
    return m ? `<li><b>${esc(title)}</b>: ${esc(m.textContent.replace(/^\s*Điều kiện kết thúc:\s*/, ''))}</li>` : '';
  }).filter(Boolean);
  const watch = el('div', 'card', `<div class="chart-title">Điều gì sẽ làm thay đổi bức tranh?</div><div class="chart-sub">điều kiện kết thúc của các chủ đề đang theo dõi (tab Chủ đề nóng)</div>${cond.length ? `<ul class="pp-ul">${cond.join('')}</ul>` : '<p class="data-gap">Chưa có chủ đề đang theo dõi.</p>'}
    <p class="ov-cap"><a class="ov-more" href="#mt4" data-ov-main="mt4">Văn bản quy hoạch, giá đất, vốn và thuế quan ở tab Chính sách →</a></p>`);
  p.append(sec('supply', '3.1', 'Nguồn cung mới 2026–2028 lớn đến đâu so với hiện hữu?', supply),
    sec('watch', '3.2', 'Mốc nào có thể làm đổi chiều chu kỳ?', watch));
}

const SECTIONS = [
  ['map', '00', 'Bản đồ ngành', 'Chuỗi giá trị ngành', 'Đất, vốn và khách thuê đi qua những ai?', mapPane],
  ['model', '01', 'Chuỗi giá trị theo mô hình', 'Cho thuê đất · nhà xưởng · tiện ích · đa ngành', 'Mỗi mô hình kinh doanh tạo doanh thu, ghi nhận lợi nhuận ở khâu nào?', modelPane],
  ['companies', '02', 'Doanh nghiệp niêm yết', 'Định giá · lợi nhuận · So sánh tài chính', 'Doanh nghiệp KCN đang được định giá và có lợi nhuận ra sao?', companiesPane],
  ['forward', '03', 'Triển vọng', 'Nguồn cung mới, mốc chính sách', 'Điều gì có thể làm thay đổi luận điểm?', forwardPane]
];

function build() {
  const pane = document.getElementById('pane-mt1'); if (!pane || pane.querySelector('.ov-nav')) return;
  const head = pane.querySelector(':scope>.sectionhead');
  const oldBar = pane.querySelector(':scope>.pane-subtabs'), oldPanes = [...pane.querySelectorAll(':scope>.pane-subpane')];
  if (head) head.innerHTML = '<div><h2 class="sec">Tổng quan ngành bất động sản khu công nghiệp</h2><p>Nhìn để hiểu ngành, bấm để phân tích: bản đồ ngành → chuỗi giá trị theo mô hình → doanh nghiệp niêm yết → triển vọng.</p></div>';
  const nav = el('div', 'ov-nav'); nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', 'Tổng quan ngành: bốn bước');
  head ? head.after(nav) : pane.prepend(nav);
  const panes = {}; let anchor = nav;
  SECTIONS.forEach(([key, num, label, tech, q]) => {
    const b = el('button', 'tabbtn ov-tab', `<span>${num}</span>${esc(label)}<small>${esc(tech)}</small>`); b.type = 'button'; b.id = 'mt1-ov-' + key + '-tab'; b.setAttribute('role', 'tab'); b.dataset.ov = key; nav.append(b);
    const p = el('div', 'pane-subpane ov-pane'); p.id = 'mt1-ov-' + key; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); p.hidden = true; b.setAttribute('aria-controls', p.id);
    p.innerHTML = `<header class="ov-head"><div><span class="ov-k">${num} · ${esc(tech)}</span><h2>${esc(label)}</h2><p>${esc(q)}</p></div>${key !== 'map' ? '<a href="?ov=map#mt1" data-ov-go="map" class="ov-back">← Bản đồ ngành</a>' : ''}</header>`;
    anchor.after(p); anchor = p; panes[key] = p;
  });
  SECTIONS.forEach(([key, , , , , fn]) => { try { fn(panes[key], pane); } catch (e) { panes[key].append(gap('lỗi dựng phần này: ' + esc(e.message))); document.documentElement.dataset.ovError = (document.documentElement.dataset.ovError || '') + key + ':' + e.message + ';'; console.error(e); } });
  // Phần còn lại của khung sub-tab cũ (nếu có) gom vào Doanh nghiệp niêm yết, không xóa.
  const left = oldPanes.flatMap(w => [...w.children]).filter(n => !n.closest('.ov-pane'));
  if (left.length) { const d = el('details', 'research-fold ov-an', '<summary>Nội dung khác</summary>'); left.forEach(n => d.append(n)); panes.companies.append(d); document.documentElement.dataset.ovLeftover = left.map(n => n.dataset.blockId || n.className).join(','); }
  oldPanes.forEach(w => w.remove()); oldBar?.remove();
  const mp = document.querySelector('#pane-mt2 .sectionhead p'); if (mp) mp.textContent = 'Nhu cầu → nguồn cung → giá thuê → quỹ đất doanh nghiệp → tài chính ngành.';
  // Ô số đầu tab Bức tranh ngành (research-layout dời .kpis sang #mt2) không dùng: ô số nằm ở Bản tin dữ liệu.
  document.querySelectorAll('#pane-mt2 .kpis').forEach(k => { k.hidden = true; k.style.display = 'none'; });

  const keys = SECTIONS.map(s => s[0]), btns = [...nav.children];
  const select = (key, push) => {
    if (!keys.includes(key)) key = 'map';
    keys.forEach((k, i) => { const on = k === key; panes[k].hidden = !on; btns[i].setAttribute('aria-selected', String(on)); btns[i].tabIndex = on ? 0 : -1; btns[i].classList.toggle('active', on); });
    const u = new URL(location.href);
    if (push && u.searchParams.get('ov') !== key) { u.searchParams.set('ov', key); ['kcn'].forEach(x => u.searchParams.delete(x)); history.pushState({ov: key}, '', u.pathname + u.search + '#mt1'); }
    refit(panes[key]);
  };
  btns.forEach((b, i) => {
    b.addEventListener('click', () => select(b.dataset.ov, true));
    b.addEventListener('keydown', e => { const d = {ArrowRight: 1, ArrowLeft: -1}[e.key]; if (d == null) return; e.preventDefault(); const n = (i + d + btns.length) % btns.length; btns[n].click(); btns[n].focus(); });
  });
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-ov-go]'); if (a) { e.preventDefault(); window.showMajorTab?.('mt1'); select(a.dataset.ovGo, true); window.scrollTo({top: 0}); return; }
    const m = e.target.closest('[data-ov-main]'); if (m) { e.preventDefault(); window.showMajorTab?.(m.dataset.ovMain); window.scrollTo({top: 0}); }
  });
  const s0 = new URL(location.href).searchParams.get('ov');
  if (s0 && (!location.hash || location.hash === '#mt1')) window.showMajorTab?.('mt1');
  select(s0 || 'map', false);
  const setTop = () => { const t = document.querySelector('.majortabs'), cs = t && getComputedStyle(t); nav.style.top = cs && cs.position === 'sticky' && innerWidth > 700 ? (t.getBoundingClientRect().height + 8) + 'px' : '0px'; };
  setTop(); addEventListener('resize', setTop);

  // Nguồn dữ liệu: tra cứu workbook, cảnh báo, quy tắc nhận định, định nghĩa (trước là sub-tab Dữ liệu & phương pháp).
  const src = document.getElementById('pane-mt8');
  if (src && window.KcnWS && window.KcnWS.ready()) {
    const box = el('section', 'kc-data-src'); box.innerHTML = '<h3>Dữ liệu khu công nghiệp: tra cứu, chất lượng, quy tắc</h3><div class="kc-dyn"></div>';
    src.append(box); window.KcnWS.render('data', box.querySelector('.kc-dyn'), 'D');
  }
  document.documentElement.dataset.ovReady = '1';
}
SectorBoot.add(800, () => { try { build(); } catch (e) { document.documentElement.dataset.ovError = 'build:' + e.message; console.error(e); } }); // sau kcn-workspace (700)
})();
