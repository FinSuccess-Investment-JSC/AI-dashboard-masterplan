/* Pháp lý theo văn bản — module dùng chung cho ngành "nhiều luật" (27/11/2026; gom từ Dau-khi/app/oil-legal.js, Bat-dong-san/app/re-legal.js).
   Mỗi trang khai báo window.SECTOR_LEGAL = {event, SUM, RECENT, LAWS, NODE_LAWS, LAW_TAG} trong app/legal-config.js, nạp trước file này.
   - Tab Chính sách (#mt4): tóm tắt 3–5 dòng đầu mỗi sub-tab (#of-mt4-<k>), bảng "Mới duyệt gần đây" ở sub-tab docs.
   - Tổng quan › 00 Bản đồ ngành: bảng "Khung pháp lý chính" dưới chuỗi giá trị; nhãn văn bản có màu gắn thẳng lên từng khâu của sơ đồ
     (svg.vc2 .vc-node[data-id]); chú giải văn bản trên sơ đồ; rê chuột là lớp phụ; bấm nhãn/tên văn bản sang sub-tab.
   Không thêm số: mọi số nằm trong legal-config.js, đã có nguồn trên trang hoặc đoạn trích ở evidence.json. */
(() => {
'use strict';
const C = window.SECTOR_LEGAL; if (!C) return;
const $ = s => document.querySelector(s);
const el = (t, c, h) => { const n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };
const ST = {on: ['Đang hiệu lực', 're-st-on'], soon: ['Sắp hiệu lực', 're-st-soon'], amend: ['Đang sửa đổi', 're-st-amend'], wait: ['Chờ hướng dẫn', 're-st-wait'], temp: ['Có thời hạn', 're-st-soon']};
// Hai kiểu khung: 'of' (#of-mt4-<k> .of-body, các *-frame.js) và 'sf' (#sf-mt4-<k>, seafood-frame.js của Cá tra, Tôm).
const PF = C.prefix || 'of', BODY = (t, k) => PF === 'sf' ? `#sf-${t}-${k}` : `#of-${t}-${k} .of-body`, TAB = (t, k) => `#${PF}-${t}-${k}-tab`;
const T = C.tab || 'mt4', LAWS = C.LAWS || [], NODE_LAWS = C.NODE_LAWS || {}, LAW_TAG = C.LAW_TAG || {};
const LAW_NAME = Object.fromEntries(LAWS.map(r => [r[6], r[0]]));
function go(k) { $(`#research-tab-${T}`)?.click(); setTimeout(() => { $(TAB(T, k))?.click(); $(`#pane-${T}`)?.scrollIntoView({behavior: 'smooth', block: 'start'}); }, 60); }
const link = (t, k) => `<a href="#${T}" class="re-lg-go" data-go="${k}">${t}</a>`;

function summaries() {
  Object.entries(C.SUM || {}).forEach(([k, s]) => { const body = $(BODY(T, k)); if (!body || body.querySelector('.re-sum')) return;
    body.querySelectorAll(':scope > .of-gap').forEach(g => { if (/Chưa có dữ liệu/.test(g.textContent)) g.remove(); });
    const put = n => { const h = body.querySelector(':scope > .pp-head'); h ? h.after(n) : body.prepend(n); };  // kiểu 'sf': sau tiêu đề sub-tab
    put(el('div', 'card re-sum of-wide', `<div class="re-sum-k">Tóm tắt</div><h3>${s.t}</h3><ul>${s.l.map(x => `<li>${x}</li>`).join('')}</ul>`)); });
}
function recent() {
  const body = $(BODY(T, 'docs')); if (!body || body.querySelector('.re-recent') || !(C.RECENT || []).length) return;
  const c = el('div', 'card of-wide re-recent', `<h3>Mới duyệt, mới hiệu lực và đang trình — 12 tháng gần nhất</h3><div class="tablewrap"><table><thead><tr><th>Ngày</th><th>Văn bản</th><th>Điểm chính</th><th>Chi tiết</th></tr></thead><tbody>${C.RECENT.map(([d, v, n, k]) =>
    `<tr><td>${d}</td><td><b>${v}</b></td><td>${n}</td><td>${k ? link('Xem sub-tab →', k) : ''}</td></tr>`).join('')}</tbody></table></div>${C.recentNote ? `<p class="note">${C.recentNote}</p>` : ''}`);
  const s = body.querySelector(':scope > .re-sum'); s ? s.after(c) : body.prepend(c);
}
function overview() {
  const host = $(BODY('mt1', 'map')); if (!host || host.querySelector('.re-legal-map') || !LAWS.length) return;
  host.append(el('div', 'card of-wide re-legal-map', `<h3>Khung pháp lý chính</h3><p class="chart-sub">Nhãn màu trên sơ đồ chuỗi giá trị phía trên cho biết văn bản nào quy định khâu nào · rê chuột để làm nổi khâu hoặc văn bản · bấm nhãn hoặc tên văn bản để xem chi tiết</p>
    <div class="tablewrap"><table class="lg-tbl" data-no-fold><thead><tr><th>Văn bản</th><th>Số hiệu</th><th>Hiệu lực</th><th>Quy định gì</th><th>Khâu</th><th>Mã liên quan</th><th>Trạng thái</th></tr></thead><tbody>${LAWS.map(([n, so, eff, what, stage, st, k, who]) =>
      `<tr data-law="${k}"><td>${link(`<b>${n}</b>`, k)}</td><td>${so}</td><td>${eff}</td><td>${what}</td><td>${stage}</td><td>${who}</td><td><span class="re-st ${(ST[st] || ST.on)[1]}">${(ST[st] || ST.on)[0]}</span></td></tr>`).join('')}</tbody></table></div>`));
  linkChain();
}
function linkChain(tries = 0) {
  const svg = $(`#${PF}-mt1-map svg.vc2`), tbl = $('.re-legal-map .lg-tbl');
  if (!svg || !tbl) { if (tries < 20) setTimeout(() => linkChain(tries + 1), 300); return; }
  if (svg.dataset.lg) return; svg.dataset.lg = '1';
  const NS = 'http://www.w3.org/2000/svg', rows = [...tbl.querySelectorAll('tr[data-law]')], card = svg.closest('.card');
  svg.querySelectorAll('.vc-node').forEach(n => { const ks = (NODE_LAWS[n.dataset.id] || []).filter(k => LAW_TAG[k]); const r = n.querySelector('rect.card'); if (!ks.length || !r) return;
    let x = +r.getAttribute('x') + 12; const y = +r.getAttribute('y') + +r.getAttribute('height') - 9;
    ks.forEach(k => { const t = LAW_TAG[k], w = t.s.length * 6.2 + 14, g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'lg-badge'); g.dataset.law = k;
      g.innerHTML = `<rect x="${x}" y="${y}" width="${w}" height="18" rx="9" fill="${t.c}"/><text x="${x + w / 2}" y="${y + 12.5}" text-anchor="middle">${t.s}</text><title>${LAW_NAME[k] || ''}</title>`;
      n.append(g); x += w + 5; }); });
  if (card && !card.querySelector('.lg-legend')) svg.insertAdjacentHTML('beforebegin', `<div class="lg-legend"><span>Văn bản pháp lý:</span>${LAWS.filter((r, i) => LAW_TAG[r[6]] && LAWS.findIndex(x => x[6] === r[6]) === i).map(r => `<a href="#${T}" class="re-lg-go" data-go="${r[6]}"><i style="background:${LAW_TAG[r[6]].c}"></i>${r[0]}</a>`).join('')}</div>`);
  const clear = () => { svg.classList.remove('lg-focus'); tbl.classList.remove('lg-focus'); svg.querySelectorAll('.lg-on').forEach(x => x.classList.remove('lg-on')); rows.forEach(r => r.classList.remove('lg-on')); };
  const showLaw = k => { clear(); svg.classList.add('lg-focus'); tbl.classList.add('lg-focus');
    svg.querySelectorAll('.vc-node').forEach(n => n.classList.toggle('lg-on', (NODE_LAWS[n.dataset.id] || []).includes(k))); rows.forEach(r => r.classList.toggle('lg-on', r.dataset.law === k)); };
  const showNode = id => { const ks = NODE_LAWS[id]; if (!ks) return; clear(); tbl.classList.add('lg-focus'); rows.forEach(r => r.classList.toggle('lg-on', ks.includes(r.dataset.law))); };
  rows.forEach(r => { r.addEventListener('mouseenter', () => showLaw(r.dataset.law)); r.addEventListener('mouseleave', clear); });
  svg.querySelectorAll('.vc-node').forEach(n => { n.addEventListener('mouseenter', () => showNode(n.dataset.id)); n.addEventListener('mouseleave', clear); });
  svg.querySelectorAll('.lg-badge').forEach(b => { b.addEventListener('click', e => { e.stopPropagation(); go(b.dataset.law); });
    b.addEventListener('mouseenter', e => { e.stopPropagation(); showLaw(b.dataset.law); }); b.addEventListener('mouseleave', clear); });
  card?.querySelectorAll('.lg-legend a').forEach(a => { a.addEventListener('mouseenter', () => showLaw(a.dataset.go)); a.addEventListener('mouseleave', clear); });
}
function style() {
  if ($('#re-legal-style')) return; const st = el('style'); st.id = 're-legal-style';
  st.textContent = `.re-sum{border-left:4px solid #2938A8;background:#F6F8FE}.re-sum-k{font:700 11px Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#2938A8;margin-bottom:4px}.re-sum h3{margin:0 0 8px}.re-sum ul{margin:0;padding-left:18px}.re-sum li{margin:3px 0;font-size:14px;line-height:1.55}
.re-st{display:inline-block;padding:2px 8px;border-radius:999px;font:600 11.5px Inter,sans-serif;white-space:nowrap}.re-st-on{background:#E3F5F0;color:#1d8a73}.re-st-soon{background:#E8EEFB;color:#2938A8}.re-st-amend{background:#FFF5D4;color:#8a6a00}.re-st-wait{background:#FDECEA;color:#b8432c}
.re-recent h3,.re-legal-map h3{margin:0 0 8px}
.vc2 .lg-badge{cursor:pointer}.vc2 .lg-badge rect{stroke:#fff;stroke-width:1.5}.vc2 .lg-badge text{fill:#fff;font:700 11px Inter,sans-serif;pointer-events:none}
.vc2 .vc-node{transition:opacity .15s}.vc2.lg-focus .vc-node:not(.lg-on){opacity:.25}.vc2.lg-focus .vc-node.lg-on rect.card{stroke:#861C52;stroke-width:2.5}
.lg-tbl tr{transition:opacity .15s,background .15s}.lg-tbl.lg-focus tr[data-law]:not(.lg-on){opacity:.35}.lg-tbl tr.lg-on td{background:#FDF2F7}
.lg-legend{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;margin:6px 0 4px;font-size:12.5px}.lg-legend span{font-weight:600;color:#6B7392}.lg-legend a{display:inline-flex;align-items:center;gap:5px;color:#1F2A5C;text-decoration:none;font-weight:600}.lg-legend a:hover{text-decoration:underline}.lg-legend i{width:10px;height:10px;border-radius:3px;display:inline-block}`;
  document.head.append(st);
}
function run() {
  if (run.done || !$(BODY(T, 'docs'))) return; run.done = true;
  style(); summaries(); recent(); overview();
  document.addEventListener('click', e => { const a = e.target.closest('.re-lg-go'); if (!a) return; e.preventDefault(); go(a.dataset.go); });
}
window.addEventListener(C.event || 'sector:frame', run);
if ($(BODY(T, 'docs'))) run();
window.SectorLegalRun = run;
})();
