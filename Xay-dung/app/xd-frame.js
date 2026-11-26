/* Xây dựng · VLXD · Đầu tư công — khung theo mẫu trang Điện (26/11/2026, yêu cầu người dùng).
   Ba cấp: tab chính (research-layout.js: Tổng quan ngành #mt1 → Bức tranh ngành #mt2 → Tài chính ngành #mt14 → Chủ đề nóng #mt7)
   → tab con (ov-nav / pp-nav) → nhóm câu hỏi hoặc khâu kinh doanh (.pp-panel, .pp-stage).
   Cách làm: các script cũ (construction-dashboard.js, research-layout.js) vẫn dựng thẻ, chart như trước; module này dời từng thẻ theo
   data-block-id vào khung mới, thêm Bản tin dữ liệu, bảng dự án chính, chính sách, tài chính ngành. Không tạo số: số mới lấy từ
   window.XD_HUB (data/construction/hub.json), window.XD_FIN (BCTC VNDirect), window.XD_SHARE (chuỗi đã có của construction-dashboard.js).
   URL: ?ov=<map|model|forward>#mt1 · ?section=<market|public|contractor|cement|stone|asphalt|glass|policy>[&g=<nhóm>]#mt2 ·
   ?fin=<fin|companies>#mt14. Link cũ: #mt3 → Nhà thầu & BOT › chi phí nhà thầu hạ tầng; #mt4 → Chính sách; #mt6 → Doanh nghiệp niêm yết;
   #mt10 → Đầu tư công; #mt8 → danh mục nguồn (mục thu gọn cuối Bức tranh ngành). */
(() => {
'use strict';
if (document.body.dataset.sector !== 'construction') return;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const fin = v => typeof v === 'number' && Number.isFinite(v);
const nf = (v, d = 0) => fin(v) ? v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}) : '—';
const sg = (v, d = 1) => fin(v) ? (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), d) : '—';
const dmy = s => { if (!s) return '—'; const v = String(s); if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10).split('-').reverse().join('/'); if (/^\d{4}-\d{2}$/.test(v)) return 'T' + (+v.slice(5)) + '/' + v.slice(0, 4); if (/^\d{4}-Q\d$/.test(v)) return v.slice(5) + '/' + v.slice(0, 4); return v; };
const qL = p => String(p || '').replace(/^(\d{4})Q([1-4])$/, 'Q$2/$1');
const ext = (name, url) => url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(name)}</a>` : esc(name);
const gap = t => el('p', 'pp-gap data-gap', 'Chưa có dữ liệu: ' + t);
const block = id => document.querySelector(`[data-block-id="${id}"]`);
const refit = root => setTimeout(() => { window.dispatchEvent(new Event('resize')); (root || document).querySelectorAll('canvas').forEach(c => { const ch = window.Chart?.getChart?.(c); if (ch) ch.resize(); }); }, 40);
const H = window.XD_HUB || {projects: [], policies: [], articles: [], events: [], topics: [], stages: {}};
const X = window.XD_SHARE || {}, F = window.XD_FIN, PUB = window.CONSTRUCTION_PUBLIC?.blocks || {};
const ART = new Map((H.articles || []).map(a => [a.id, a]));
const PROJ = new Map((H.projects || []).map(p => [p.id, p]));
const LOG = msg => { document.documentElement.dataset.xdFrame = (document.documentElement.dataset.xdFrame || '') + msg + ';'; };

/* ---------- Khối dựng chung ---------- */
// Thẻ dời vào: bảo đảm có dòng "Nguồn:" hiện sẵn (quy tắc trang Điện) — lấy từ ghi chú "Nguồn:" có sẵn của thẻ, không đoán.
function srcOf(c) {
  if (!c || c.querySelector(':scope > .pw-src, .pw-src')) return c;
  // chart-cards.js có thể đã dời ghi chú nguồn vào bảng ⓘ của thẻ: lấy lại từ đó.
  const b = c.querySelector('.chart-info-button[aria-controls]'), pn = b && document.getElementById(b.getAttribute('aria-controls'));
  const n = [...c.querySelectorAll('.source-note'), ...(pn ? pn.querySelectorAll('.source-note, .chart-primary-source') : [])].find(x => /Nguồn/i.test(x.textContent) || x.querySelector('a[href]'));
  const d = el('div', 'pw-src');
  if (n) d.innerHTML = 'Nguồn: ' + n.innerHTML.replace(/^\s*Nguồn\s*:\s*/i, '');
  else if (SRC_MANUAL[c.dataset.blockId]) d.innerHTML = 'Nguồn: ' + SRC_MANUAL[c.dataset.blockId];
  else return c;
  c.append(d); return c;
}
// Nguồn ghi tay cho thẻ không có ghi chú nguồn riêng (lấy đúng nguồn đang ghi trong bảng của thẻ).
const SRC_MANUAL = {
  'xd-24': `<a href="https://soxaydung.hanoi.gov.vn/kinh-te-vat-lieu-xay-dung" target="_blank" rel="noopener">Sở Xây dựng Hà Nội · công bố giá vật liệu</a>`,
  'xd-62': 'cột Nguồn từng dòng (Người Quan sát, Tin nhanh Chứng khoán, Nhà đầu tư, Báo Đấu thầu)',
  'xd-71': `<a href="https://thuviennhadat.vn/phap-luat/chi-so-gia-xay-dung-bac-ninh-quy-3-2026-phan-xay-dung-748836.html" target="_blank" rel="noopener">Sở Xây dựng Bắc Ninh · QĐ 913/QĐ-SXD (qua Thư viện Nhà đất)</a>`
};
const take = id => { const n = block(id); if (!n) { LOG('thiếu ' + id); return null; } n.style.marginTop = ''; return srcOf(n); };
function panel(id, num, q, nodes, sub) {
  const s = el('section', 'pp-panel pp-q'); s.id = 'xd-' + id;
  s.innerHTML = `<header class="pp-ph"><span class="pp-num">${esc(num)}</span><div><h3>${esc(q)}</h3>${sub ? `<p class="kc-q-sub">${sub}</p>` : ''}</div></header>`;
  [].concat(nodes).flat().filter(Boolean).forEach(n => s.append(typeof n === 'string' ? el('div', '', n) : n));
  return s;
}
const grid2 = (...ns) => { const g = el('div', 'grid two g2'); ns.filter(Boolean).forEach(n => g.append(n)); return g.children.length ? g : null; };
const stage = (id, kind, label) => { const h = el('div', 'pp-stage'); h.id = 'xd-st-' + id; h.innerHTML = `<span>${esc(kind)}</span><h3>${esc(label)}</h3>`; return h; };
function flow(items) { // [[id, nhãn nhỏ, tên]]
  const f = el('nav', 'pp-flow'); f.setAttribute('aria-label', 'Các khâu');
  items.forEach(([id, k, l], i) => { if (i) f.append(el('span', 'pp-flow-ar', '→')); const b = el('button', 'pp-flow-s', `<small>${esc(k)}</small><b>${esc(l)}</b>`); b.type = 'button'; b.dataset.xdJump = id; f.append(b); });
  return f;
}
const grpHead = (id, title, sub) => { const h = el('h3', 'xd-grp', `${esc(title)}${sub ? `<small>${esc(sub)}</small>` : ''}`); h.id = 'xd-g-' + id; return h; };
const go = (label, href) => `<a class="xd-go" href="${esc(href)}" data-xd-href="${esc(href)}">${esc(label)} →</a>`;
const card = (html, cls = '') => el('div', 'card ' + cls, html);
const note = html => { const d = el('details', 'note-icon'); d.innerHTML = '<summary>ⓘ Lưu ý dữ liệu</summary><div>' + html + '</div>'; return d; };
function sparkSvg(vals) {
  const v = vals.filter(fin); if (v.length < 2) return '';
  const lo = Math.min(...v), hi = Math.max(...v), W = 160, Hh = 34, n = vals.length;
  const pts = vals.map((x, i) => fin(x) ? `${(i / (n - 1) * W).toFixed(1)},${(Hh - 3 - (hi > lo ? (x - lo) / (hi - lo) : .5) * (Hh - 6)).toFixed(1)}` : null).filter(Boolean).join(' ');
  return `<svg class="xd-spark" viewBox="0 0 ${W} ${Hh}" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="#2938A8" stroke-width="1.8" vector-effect="non-scaling-stroke"/></svg>`;
}
let CH = 0;
function lineChart(title, sub, cats, series, o = {}) {
  const c = card(`<div class="chart-title">${esc(title)}</div>${sub ? `<div class="chart-sub">${esc(sub)}</div>` : ''}`, 'xd-chart');
  if (o.id) c.dataset.blockId = o.id;
  const h = el('div', 'pp-host'); h.id = 'xd-ch-' + (++CH); c.append(h);
  const m = {key: o.key || h.id, categories: cats, series, unit: o.unit || '', digits: o.digits ?? 0, native: o.native || 'line', zeroBase: o.zeroBase ?? false, stackable: !!o.stackable};
  if (window.ChartTypes && cats.length) ChartTypes.mount(h, m, () => { h.innerHTML = ChartTypes.render(m, m.native); }); else h.append(gap('không có chuỗi số.'));
  if (o.src) c.append(el('div', 'pw-src', 'Nguồn: ' + o.src));
  if (o.note) c.append(el('div', 'pw-src-note', o.note));
  return c;
}

/* ---------- Số dùng lại ---------- */
const S = X.series || {};
const ym = d => d.slice(0, 7);
function ytd(rs) { const l = rs.at(-1); if (!l) return null; const y = l.date.slice(0, 4), m = l.date.slice(5, 7);
  const sum = yy => rs.filter(r => r.date.slice(0, 4) === yy && r.date.slice(5, 7) <= m).reduce((a, r) => a + r.value, 0);
  const cur = sum(y), prev = sum(String(+y - 1)); return {y, m: +m, cur, yoy: prev ? (cur / prev - 1) * 100 : null}; }
function sameMonthYoY(rs) { const l = rs.at(-1); if (!l) return null; const p = rs.find(r => ym(r.date) === String(+l.date.slice(0, 4) - 1) + l.date.slice(4, 7)); return p && p.value ? (l.value / p.value - 1) * 100 : null; }
function monthly(rs) { const m = new Map(); rs.forEach(r => m.set(ym(r.date), r.value)); return [...m.entries()].sort((a, b) => a[0] < b[0] ? -1 : 1); }
const SRCN = (k, fallback) => { const v = PUB.commodity?.series?.[k] || PUB.macro?.series?.[k]; return v?.url ? ext(v.source || v.name || fallback, v.url) : esc(fallback); };
const NSO = () => ext('Cục Thống kê', X.SRC?.nso?.[1] || 'https://www.nso.gov.vn/');
const MOF_SRC = ext('Bộ Tài chính qua Thời báo Tài chính Việt Nam 11/11/2026', 'https://thoibaotaichinhvietnam.vn/giai-ngan-dau-tu-cong-tang-toc-trong-tuan-dau-thang-11-206777.html');
const BASKET_W = 'Trọng số rổ: đá 1x2 37,5% · nhựa đường 31,25% · xi măng 18,75% · thép 12,5% (chưa có cát vì chưa có chuỗi tháng). Phạm vi: đá 1x2, xi măng theo công bố giá Sở Xây dựng (qua WiData); thép CB300 Hòa Phát; nhựa đường SHFE (giá tham chiếu quốc tế, CNY/tấn). Bình quân 2024 = 100; tháng thiếu một thành phần thì không tính basket.';
const BASKET_SRC = `Sở Xây dựng qua ${ext('WiData', 'https://widata.vn/')} (đá, xi măng) · Hòa Phát (thép CB300) · ${ext('SHFE', 'https://www.shfe.com.cn/eng/Market/Futures/')} (nhựa đường); tự tính rổ`;

/* ---------- Bản tin dữ liệu (đầu Tổng quan) ---------- */
function dataBrief() {
  const cards = [], lead = [];
  const add = o => cards.push(`<div class="db-c card xd-db" role="link" tabindex="0" data-xd-href="${esc(o.go)}" title="Mở phần phân tích"><div class="db-ch">${esc(o.label)}</div><div class="db-v">${o.value}<span class="db-u"> ${esc(o.unit)}</span></div><div class="db-s"><span>${o.yoy || ''}</span> · <span>${esc(o.period)}</span></div><div class="db-sc">${esc(o.scope)}</div><div class="db-spark">${sparkSvg(o.spark || [])}</div><div class="pw-src">Nguồn: ${o.src}</div></div>`);
  const pi = S.pi || [], a = ytd(pi);
  if (a) { const mm = monthly(pi).filter(([k]) => k.startsWith(a.y)).map(x => x[1]); let c = 0; const cum = mm.map(v => (c += v));
    add({label: 'Vốn NSNN thực hiện lũy kế', value: nf(a.cur / 1000, 0), unit: 'nghìn tỷ đồng', yoy: fin(a.yoy) ? `<b class="${a.yoy >= 0 ? 'up' : 'dn'}">${sg(a.yoy, 1)}%</b> so cùng kỳ` : '', period: `${a.m}T/${a.y}`, scope: 'Vốn đầu tư thực hiện từ NSNN (Trung ương + địa phương); số tháng cuối là ước tính', spark: cum, src: NSO(), go: '?section=public&g=nso#mt2'});
    lead.push(`vốn NSNN thực hiện ${a.m}T/${a.y} đạt <b>${nf(a.cur / 1000, 0)} nghìn tỷ đồng</b>${fin(a.yoy) ? ` (${sg(a.yoy, 1)}% so cùng kỳ)` : ''}`); }
  const W = X.WEEK || [];
  if (W.length) { const l = W.at(-1);
    add({label: 'Giải ngân / kế hoạch Thủ tướng giao', value: nf(l[2], 1), unit: '% kế hoạch', yoy: 'chưa có số cùng mốc 2025', period: `lũy kế đến ${l[0]}/2026`, scope: `${nf(l[1], 0)} tỷ đồng ÷ kế hoạch ${nf(X.PLAN?.['2026'], 0)} tỷ đồng`, spark: W.map(w => w[2]), src: MOF_SRC, go: '?section=public&g=mof#mt2'});
    lead.push(`giải ngân theo kế hoạch đạt <b>${nf(l[2], 1)}%</b> đến ${l[0]}`); }
  const cem = S.cem || [];
  if (cem.length) { const l = cem.at(-1), y = sameMonthYoY(cem), t = ytd(cem);
    add({label: 'Sản lượng xi măng', value: nf(l.value, 1), unit: 'triệu tấn', yoy: fin(y) ? `<b class="${y >= 0 ? 'up' : 'dn'}">${sg(y, 1)}%</b> so cùng kỳ${t && fin(t.yoy) ? ` · lũy kế ${sg(t.yoy, 1)}%` : ''}` : '', period: 'T' + (+l.date.slice(5, 7)) + '/' + l.date.slice(0, 4), scope: 'Sản lượng sản xuất toàn ngành (gồm phần xuất khẩu), số tháng cuối ước tính', spark: cem.slice(-18).map(r => r.value), src: NSO(), go: '?section=cement&g=cement-output#mt2'});
    lead.push(`sản lượng xi măng T${+l.date.slice(5, 7)} ${nf(l.value, 1)} triệu tấn${fin(y) ? ` (${sg(y, 1)}%)` : ''}`); }
  const B = X.basket;
  if (B) { const i = B.values.findLastIndex(fin), p = B.months.indexOf(String(+B.months[i].slice(0, 4) - 1) + B.months[i].slice(4)), y = p >= 0 && B.values[p] ? (B.values[i] / B.values[p] - 1) * 100 : null;
    add({label: 'Rổ giá vật liệu nhà thầu đường', value: nf(B.values[i], 0), unit: '(2024 = 100)', yoy: fin(y) ? `<b class="${y >= 0 ? 'up' : 'dn'}">${sg(y, 1)}%</b> so cùng kỳ` : '', period: dmy(B.months[i]), scope: 'Đá 1x2 37,5% · nhựa đường 31,25% · xi măng 18,75% · thép 12,5%', spark: B.values.slice(-18), src: BASKET_SRC, go: '?section=contractor&g=infra-cost#mt2'});
    lead.push(`rổ giá vật liệu nhà thầu đường ${dmy(B.months[i])} ở mức ${nf(B.values[i], 0)} (2024 = 100${fin(y) ? `, ${sg(y, 1)}% so cùng kỳ` : ''})`); }
  if (!cards.length) return null;
  const s = el('section', 'db card xd-brief'); s.id = 'dataBrief';
  s.innerHTML = `<div class="db-l"><div class="db-k"><span class="db-dot"></span>Bản tin dữ liệu</div><div class="db-tk">Xây dựng · VLXD · Đầu tư công</div><p class="db-lead">${lead.join('; ').replace(/^./, c => c.toUpperCase())}.</p><p class="xd-na">Bốn số khác nguồn, khác kỳ: đọc riêng từng ô. Bấm ô để mở phần phân tích.</p></div><div class="db-r">${cards.join('')}</div>`;
  return s;
}

/* ---------- Dự án: bảng chính (Bức tranh › Toàn thị trường) và các bảng trích ---------- */
const STAGES = H.stages || {};
const stChip = k => `<span class="xd-chip xd-st-${esc(k)}" title="${esc(STAGES[k]?.[1] || '')}">${esc(STAGES[k]?.[0] || k)}</span>`;
const artLink = id => { const a = ART.get(id); return a ? ext(`${a.source_name} ${dmy(a.published_at)}`, a.url) : ''; };
const nextTxt = p => { const n = p.next || {}; return `${esc(n.label || '—')}${n.date ? ` <b>${esc(dmy(n.date))}</b>` : ''} <span class="xd-kind">${n.kind === 'expected' ? 'dự kiến' : n.kind === 'actual' ? 'thực tế' : 'chưa có ngày'}</span>`; };
const tickCell = p => p.tickers.length ? p.tickers.map(t => `<span class="xd-tk">${esc(t.code)}</span> ${esc(t.role)}<br><span class="xd-na">căn cứ: ${ext(t.basis, t.url)}</span>`).join('<br>') : '<span class="xd-na">Chưa có doanh nghiệp niêm yết có căn cứ</span>';
const srcCell = p => [...(p.sources || []).map(artLink), ...(p.extra_sources || []).map(([n, u]) => ext(n, u))].filter(Boolean).join('<br>') || '<span class="xd-na">nguồn ở cột doanh nghiệp</span>';
function projectMaster() {
  const c = card('', 'xd-proj'); c.dataset.blockId = 'xd-32'; c.dataset.updateKind = 'document'; c.id = 'xd-proj-master';
  c.innerHTML = `<div class="chart-title">Dự án trọng điểm: luồng vốn → gói thầu → tiến độ → doanh nghiệp liên quan</div><div class="chart-sub">bảng dự án chính của dashboard · mốc công bố gần nhất · bấm tên dự án ở tab khác để về đúng dòng</div>
    <div class="xd-filters"><label>Trạng thái <select data-f="stage"><option value="">Tất cả</option>${Object.entries(STAGES).map(([k, v]) => `<option value="${k}">${esc(v[0])}</option>`).join('')}</select></label>
    <label>Phân khúc <select data-f="seg"><option value="">Tất cả</option>${[...new Set(H.projects.map(p => p.segment))].map(s => `<option>${esc(s)}</option>`).join('')}</select></label>
    <label>Mã <select data-f="tk"><option value="">Tất cả</option>${[...new Set(H.projects.flatMap(p => p.tickers.map(t => t.code)))].sort().map(s => `<option>${s}</option>`).join('')}</select></label></div>
    <div class="tablewrap" data-no-fold><table class="xd-t" data-no-fold data-fs-tl="1"><thead><tr><th>Dự án</th><th>Luồng vốn</th><th>Gói thầu</th><th>Tiến độ · mốc kế tiếp</th><th>Trạng thái</th><th>Doanh nghiệp liên quan</th><th>Nguồn</th></tr></thead><tbody>${H.projects.map(p => `<tr id="xd-proj-${esc(p.id)}" data-stage="${esc(p.stage)}" data-seg="${esc(p.segment)}" data-tk="${esc(p.tickers.map(t => t.code).join(' '))}"><td><b>${esc(p.name)}</b><br><span class="xd-na">${esc(p.scale)}</span></td><td>${esc(p.capital)}</td><td>${esc(p.package)}</td><td>${esc(p.progress)}<br>${nextTxt(p)}</td><td>${stChip(p.stage)}</td><td>${tickCell(p)}</td><td>${srcCell(p)}</td></tr>`).join('')}</tbody></table></div>
    <div class="pw-src">Nguồn: từng dòng ghi bài gốc và ngày đăng; mã doanh nghiệp chỉ gắn khi có căn cứ (bảng doanh nghiệp, công bố của doanh nghiệp)</div>`;
  c.append(note('Số km cao tốc cuối 2025 và kết quả thông xe Vành đai 3 chưa có trong nguồn mở được. Ngày khởi công gói đầu đường sắt Lào Cai – Hà Nội – Hải Phòng (báo nêu "cuối năm 2025") chưa xác nhận. "Dự kiến" là mốc cơ quan, doanh nghiệp công bố; "chưa có ngày" là nguồn chưa nêu.'));
  const fs = $$('[data-f]', c);
  const apply = () => { const v = Object.fromEntries(fs.map(s => [s.dataset.f, s.value])); $$('tbody tr', c).forEach(tr => { tr.hidden = (v.stage && tr.dataset.stage !== v.stage) || (v.seg && tr.dataset.seg !== v.seg) || (v.tk && !tr.dataset.tk.split(' ').includes(v.tk)); }); };
  fs.forEach(s => s.addEventListener('change', apply));
  c._reset = () => { fs.forEach(s => { s.value = ''; }); apply(); };
  return c;
}
// Bảng trích: chỉ tên, mốc, trạng thái, mã; link về dòng của bảng chính.
function projectList(filter, cap) {
  const L = H.projects.filter(filter); if (!L.length) return gap('chưa có dự án có nguồn trong nhóm này.');
  return card(`<div class="tablewrap" data-no-fold><table class="xd-t" data-no-fold data-fs-tl="1"><thead><tr><th>Dự án</th><th>Tiến độ · mốc kế tiếp</th><th>Trạng thái</th><th>Mã</th></tr></thead><tbody>${L.map(p => `<tr><td><a class="xd-go" href="?section=market&g=proj-${esc(p.id)}#mt2" data-xd-proj="${esc(p.id)}">${esc(p.name)}</a><br><span class="xd-na">${esc(p.scale)}</span></td><td>${esc(p.progress)}<br>${nextTxt(p)}</td><td>${stChip(p.stage)}</td><td>${p.tickers.map(t => `<span class="xd-tk">${esc(t.code)}</span>`).join('') || '—'}</td></tr>`).join('')}</tbody></table></div><p class="xd-na">${cap || 'Luồng vốn, gói thầu, căn cứ gắn mã và nguồn ở bảng dự án chính (Toàn thị trường).'}</p>`);
}
function milestones() {
  const rank = p => p.next?.date ? p.next.date.replace(/-Q(\d)/, (m, q) => '-' + String(q * 3).padStart(2, '0')) : '9999';
  const L = [...H.projects].sort((a, b) => rank(a).localeCompare(rank(b)));
  const c = card(`<div class="chart-title">Mốc dự án sắp tới</div><div class="chart-sub">sắp theo ngày mốc kế tiếp · dòng "chưa có ngày" ở cuối</div>
    <div class="tablewrap" data-no-fold><table class="xd-t" data-no-fold data-fs-tl="1"><thead><tr><th>Dự án</th><th>Mốc kế tiếp</th><th>Trạng thái</th><th>Doanh nghiệp liên quan</th><th>Căn cứ</th></tr></thead><tbody>${L.map(p => `<tr><td><a class="xd-go" href="?section=market&g=proj-${esc(p.id)}#mt2" data-xd-proj="${esc(p.id)}">${esc(p.name)}</a></td><td>${nextTxt(p)}<br><span class="xd-na">${esc(p.progress)}</span></td><td>${stChip(p.stage)}</td><td>${p.tickers.map(t => `<span class="xd-tk">${esc(t.code)}</span> ${esc(t.role)}`).join('<br>') || '<span class="xd-na">—</span>'}</td><td>${srcCell(p)}</td></tr>`).join('')}</tbody></table></div>
    <div class="pw-src">Nguồn: bảng dự án chính (Bức tranh ngành › Toàn thị trường), mỗi dòng có bài gốc</div>`);
  c.dataset.blockId = 'xd-73';
  const leg = el('div', 'xd-def', Object.entries(STAGES).map(([k, v]) => `<div>${stChip(k)}<br>${esc(v[1])}</div>`).join(''));
  return [c, leg];
}

/* ---------- Bảng doanh nghiệp (xd-60) tách theo nhóm ---------- */
function playersFor(codes, label) {
  const src = X.players; if (!src) return gap('bảng kế hoạch, kết quả, backlog chưa tải được.');
  const c = src.cloneNode(true); c.removeAttribute('data-block-id'); c.removeAttribute('data-update-kind'); c.style.marginTop = '';
  const h = c.querySelector('h3'); if (h) h.textContent = `${label}: kế hoạch, kết quả 6T/2026, backlog, rủi ro`;
  $$('tbody tr', c).forEach(tr => { const t = tr.querySelector('td')?.textContent.trim(); if (!codes.includes(t)) tr.remove(); });
  if (codes.includes('CTD')) c.querySelector('.tablewrap')?.after(el('p', 'xd-na', 'CTD có năm tài chính 1/7–30/6 (NĐTC 2025–26 kết thúc 30/6/2026); các mã khác theo năm dương lịch.'));
  return srcOf(c);
}
// Ảnh chụp BCTC quý gần nhất từ XD_FIN: số dư cuối kỳ và TTM, đúng dòng bảng cân đối.
function finSnapshot(codes) {
  if (!F) return gap('chưa tải được BCTC quý (data/construction-financials.js).');
  const P = F.periods, rows = codes.filter(t => F.data[t]).map(t => { const d = F.data[t]; let i = P.length - 1; while (i >= 0 && !fin(d.revenue[i])) i--; if (i < 0) return null;
    const ttm = k => { if (i < 3) return null; const w = d[k].slice(i - 3, i + 1); return w.every(fin) ? w.reduce((a, b) => a + b, 0) : null; };
    const adv = fin(d.adv_customers[i]) ? d.adv_customers[i] + (d.adv_customers_lt[i] || 0) : null, rv = ttm('revenue');
    return `<tr><td><span class="xd-tk">${t}</span><br><span class="xd-na">${qL(P[i])}</span></td><td class="n">${nf(rv)}</td><td class="n">${nf(adv)}</td><td class="n">${nf(d.receivables[i])}</td><td class="n">${nf(d.prog_recv[i])}</td><td class="n">${nf(d.inventory[i])}</td><td class="n">${fin(adv) && fin(rv) && rv ? nf(adv / rv, 2) : '—'}</td><td class="n">${nf(ttm('cfo'))}</td></tr>`; }).filter(Boolean);
  return card(`<div class="chart-title">Ứng trước, phải thu, dở dang theo BCTC quý gần nhất (tỷ đồng)</div><div class="chart-sub">số dư cuối kỳ, trừ cột ghi TTM · BCTC hợp nhất</div><div class="tablewrap" data-no-fold><table class="xd-t" data-no-fold><thead><tr><th>Mã · kỳ</th><th>Doanh thu TTM</th><th>Người mua trả trước</th><th>Phải thu KH ngắn hạn</th><th>Phải thu theo tiến độ HĐXD</th><th>Hàng tồn kho (gồm dở dang)</th><th>Ứng trước / Doanh thu TTM (lần)</th><th>CFO TTM</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>
    <div class="pw-src">Nguồn: ${ext('BCTC hợp nhất theo quý (VNDirect finfo)', 'https://api-finfo.vndirect.com.vn/v4/financial_statements')}; tự tính TTM</div><div class="pw-src-note">Người mua trả trước = ngắn + dài hạn (13130 + 13311). Hàng tồn kho đã gồm chi phí SXKD dở dang công trình; không cộng với phải thu. CFO TTM trống khi LCTT quý của năm không khớp số năm.</div>`);
}
function gmChart(codes, title, extra) {
  if (!F) return gap('chưa tải được BCTC quý.');
  const P = F.periods, cols = ['#1D2678', '#2a9fa3', '#c98a00', '#861C52', '#3d4653', '#8997D6'];
  const series = codes.filter(t => F.data[t]).map((t, k) => ({name: t, color: cols[k % cols.length], values: P.map((_, i) => { const d = F.data[t]; return fin(d.gross[i]) && fin(d.revenue[i]) && d.revenue[i] > 0 ? Math.round(d.gross[i] / d.revenue[i] * 1000) / 10 : null; })}));
  const start = P.findIndex(p => p >= '2022Q1');
  return lineChart(title || 'Biên gộp theo quý (%)', 'LN gộp ÷ doanh thu thuần, quý riêng · BCTC hợp nhất', P.slice(start).map(qL), series.map(s => ({...s, values: s.values.slice(start)})), {unit: '%', digits: 1, src: `${ext('BCTC hợp nhất theo quý (VNDirect finfo)', 'https://api-finfo.vndirect.com.vn/v4/financial_statements')}; tự tính`, note: extra || 'Số toàn doanh nghiệp; mã đa ngành gồm cả mảng khác.'});
}

/* ---------- Tổng quan ngành (#mt1) ---------- */
function mapPane(p) {
  const vc = block('xd-01'); if (!vc) { p.append(gap('không có sơ đồ chuỗi giá trị.')); return; }
  vc.closest('.grid')?.classList.remove('grid');
  const C = {pub: '#2938A8', civ: '#2a9fa3', bot: '#861C52', mat: '#c98a00', fin: '#5a6682', sub: '#3d4653'};
  const N = [
    ['nsnn', 20, 30, 230, C.pub, 'bank', 'Nhà nước (NSNN)', 'Kế hoạch vốn đầu tư công', 'Bộ Tài chính giải ngân'],
    ['credit', 20, 140, 230, C.fin, 'bank', 'Ngân hàng · trái phiếu', 'Vay dự án, vay vốn lưu động'],
    ['buyer', 20, 250, 230, C.civ, 'home', 'Người mua nhà, khách thuê', 'Nhà ở, nhà xưởng, văn phòng'],
    ['toll', 20, 360, 230, C.bot, 'truck', 'Người đi đường', 'Phí qua trạm BOT'],
    ['pmu', 300, 30, 250, C.pub, 'law', 'Ban QLDA nhà nước', 'Chủ đầu tư công trình công'],
    ['dev', 300, 195, 250, C.civ, 'home', 'Chủ đầu tư tư nhân', 'BĐS, nhà xưởng, KCN, FDI'],
    ['bot', 300, 360, 250, C.bot, 'direct', 'Nhà đầu tư BOT', 'HHV • CII • HUT'],
    ['ginfra', 600, 30, 250, C.pub, 'tool', 'Nhà thầu hạ tầng', 'VCG • FCN • DPG • C4G • LCG'],
    ['gcivil', 600, 195, 250, C.civ, 'tool', 'Tổng thầu dân dụng, nhà xưởng', 'CTD • HBC'],
    ['gbot', 600, 360, 250, C.bot, 'tool', 'Thi công công trình BOT', 'HHV (hầm, cao tốc)'],
    ['sub', 900, 20, 240, C.sub, 'tool', 'Thầu phụ', 'Nền móng, cơ điện, hoàn thiện'],
    ['cement', 900, 112, 240, C.mat, 'factory', 'Xi măng', 'HT1 • BCC'],
    ['stone', 900, 204, 240, C.mat, 'box', 'Đá, cát', 'VLB • KSB • DHA'],
    ['asphalt', 900, 296, 240, C.mat, 'refinery', 'Nhựa đường', 'PLC'],
    ['glass', 900, 388, 240, C.mat, 'factory', 'Kính, gạch, sứ', 'VGC']
  ];
  const E = [['nsnn', 'pmu', C.pub], ['credit', 'dev', C.fin], ['credit', 'bot', C.fin], ['buyer', 'dev', C.civ], ['toll', 'bot', C.bot],
    ['pmu', 'ginfra', C.pub], ['dev', 'gcivil', C.civ], ['bot', 'gbot', C.bot],
    ['ginfra', 'sub', C.sub], ['gcivil', 'sub', C.sub], ['ginfra', 'stone', C.mat], ['ginfra', 'asphalt', C.mat], ['gcivil', 'cement', C.mat], ['gcivil', 'glass', C.mat], ['gbot', 'stone', C.mat]];
  let fig = null;
  N.forEach(n => { n[2] += 30; });
  try { fig = window.ValueChain?.draw({N, E, H: 66, height: 500, lanes: [['NGUỒN VỐN, NGƯỜI TRẢ TIỀN', 0, 270, '#eef3fb', '#1D2678'], ['CHỦ ĐẦU TƯ', 285, 290, '#eefaf9', '#2a9fa3'], ['TỔNG THẦU', 585, 290, '#fbf0f5', '#861C52'], ['THẦU PHỤ, VẬT LIỆU', 885, 280, '#fbf6ea', '#b8801f']],
    labels: [],
    legend: [[C.pub, 'Đầu tư công'], [C.civ, 'Dân dụng, nhà xưởng'], [C.bot, 'BOT, thu phí'], [C.mat, 'Vật liệu'], [C.fin, 'Vốn vay']],
    title: 'Chuỗi giá trị ngành xây dựng', desc: 'Nhà nước, ngân hàng, người mua và người đi đường trả tiền cho chủ đầu tư; chủ đầu tư ký hợp đồng và thanh toán cho tổng thầu theo nghiệm thu; tổng thầu thanh toán cho thầu phụ và nhà cung cấp vật liệu.'}); } catch (e) { LOG('chain:' + e.message); }
  if (fig) { const h = vc.querySelector('h3'); vc.replaceChildren(); if (h) { h.textContent = 'Chuỗi giá trị ngành xây dựng: nguồn vốn → chủ đầu tư → tổng thầu → thầu phụ, vật liệu'; h.classList.add('chart-title'); vc.append(h); } vc.append(fig, el('p', 'xd-na', 'Mũi tên là chiều thanh toán; hợp đồng ký theo chiều ngược lại: chủ đầu tư ký với tổng thầu, tổng thầu ký với thầu phụ và nhà cung cấp. Bấm một khâu để mở phần tương ứng ở Bức tranh ngành.'), el('div', 'pw-src', 'Nguồn: cơ chế chung của ngành; mã niêm yết theo danh sách 17 doanh nghiệp đang theo dõi')); }
  const MAP = {nsnn: '?section=public#mt2', pmu: '?section=public#mt2', credit: '?section=market#mt2', buyer: '?section=market#mt2', dev: '?section=contractor&g=civil#mt2', toll: '?section=contractor&g=bot#mt2', bot: '?section=contractor&g=bot#mt2', gbot: '?section=contractor&g=bot#mt2', ginfra: '?section=contractor&g=infra#mt2', gcivil: '?section=contractor&g=civil#mt2', sub: '?section=contractor#mt2', cement: '?section=cement#mt2', stone: '?section=stone#mt2', asphalt: '?section=asphalt#mt2', glass: '?section=glass#mt2'};
  vc.addEventListener('click', e => { const n = e.target.closest('.vc-node[data-id]'); if (n && MAP[n.dataset.id]) navigate(MAP[n.dataset.id], true); });
  vc.addEventListener('keydown', e => { if (e.key !== 'Enter') return; const n = e.target.closest('.vc-node[data-id]'); if (n && MAP[n.dataset.id]) navigate(MAP[n.dataset.id], true); });
  const roles = el('div', 'xd-def', [
    ['Bên giao vốn', `Nhà nước giao kế hoạch vốn đầu tư công; ngân hàng, trái phiếu cho chủ đầu tư tư nhân và BOT vay. ${go('Đầu tư công', '?section=public#mt2')}`],
    ['Bên ký hợp đồng', `Chủ đầu tư (ban QLDA, chủ đầu tư tư nhân, nhà đầu tư BOT) ký với tổng thầu; tổng thầu ký với thầu phụ, nhà cung cấp. ${go('Dự án trọng điểm', '?section=market&g=projects#mt2')}`],
    ['Bên cung cấp vật liệu', `Xi măng, đá, cát, nhựa đường, kính bán cho nhà thầu; giá vật liệu là chi phí của nhà thầu. ${go('Rổ giá vật liệu', '?section=contractor&g=infra-cost#mt2')}`],
    ['Bên thu tiền', `Tổng thầu thu theo nghiệm thu (kèm tạm ứng); nhà đầu tư BOT thu phí qua trạm; nhà cung cấp thu khi giao hàng. ${go('Phải thu, ứng trước', '?fin=fin&g=cash#mt14')}`]
  ].map(([t, d]) => `<div><b>${esc(t)}</b>${d}</div>`).join(''));
  p.append(sec('chain', '0.1', 'Vốn, hợp đồng, vật liệu và tiền đi qua những ai?', [vc, roles], 'Chủ đầu tư → tổng thầu → thầu phụ, nhà cung cấp; bốn vai trò dưới sơ đồ dẫn sang phần phân tích.'));
}
function sec(id, num, q, body, sub) {
  const s = el('section', 'ov-sec'); s.id = 'ov-' + id;
  s.innerHTML = `<header class="ov-sh"><span class="ov-num">${esc(num)}</span><div><h3>${esc(q)}</h3>${sub ? `<p>${sub}</p>` : ''}</div></header>`;
  [].concat(body).flat().filter(Boolean).forEach(n => s.append(typeof n === 'string' ? el('div', '', n) : n));
  return s;
}
const MODELS = [
  ['Nhà thầu dân dụng, nhà xưởng', 'CTD • HBC'], ['Nhà thầu hạ tầng', 'VCG • FCN • DPG • C4G • LCG'], ['Chủ đầu tư BOT', 'HHV • CII • HUT'], ['Nhà sản xuất vật liệu', 'HT1 • BCC • VLB • KSB • DHA • PLC • VGC']
];
const MODEL_ROWS = [
  ['Ai trả tiền', 'Chủ đầu tư tư nhân: BĐS, nhà máy FDI, KCN, văn phòng', 'Chủ đầu tư công (ban QLDA) bằng vốn ngân sách; chủ đầu tư PPP', 'Người đi đường trả phí qua trạm; phần xây lắp do dự án BOT trả', 'Nhà thầu, đại lý, người xây nhà; xuất khẩu (xi măng, clinker)'],
  ['Doanh thu ghi nhận khi nào', 'Theo tiến độ hợp đồng xây dựng: phần việc hoàn thành được xác nhận hoặc theo tiến độ kế hoạch (VAS 15)', 'Như nhà thầu dân dụng; khối lượng phụ thuộc giải ngân của chủ đầu tư', 'Doanh thu thu phí khi xe qua trạm; doanh thu xây lắp (nếu tự thi công) theo tiến độ', 'Khi giao hàng'],
  ['Biến số chi phối biên', 'Giá trúng thầu so chi phí vật liệu, nhân công; điều khoản điều chỉnh giá', 'Giá đá, nhựa đường, xi măng, thép so đơn giá hợp đồng (rổ vật liệu)', 'Lưu lượng xe, mức phí; lãi vay trên nợ dự án', 'Giá bán so giá than, điện, clinker (xi măng); giá bán đá so phí cấp quyền khai thác'],
  ['Vốn bị giữ ở khâu nào', 'Phải thu khách hàng, chi phí dở dang (trong hàng tồn kho), bảo lãnh, giữ lại bảo hành', 'Phải thu, dở dang; vốn ứng trước cho thầu phụ, vật liệu', 'Tài sản BOT (XDCB dở dang, TSCĐ) và nợ vay dài hạn đến hết thời gian thu phí', 'Lò nung, mỏ, quyền khai thác (TSCĐ); hàng tồn kho nguyên liệu'],
  ['Xem số liệu', `${go('Dân dụng & nhà xưởng', '?section=contractor&g=civil#mt2')}`, `${go('Thi công hạ tầng', '?section=contractor&g=infra#mt2')}`, `${go('BOT & thu phí', '?section=contractor&g=bot#mt2')}`, `${go('Xi măng', '?section=cement#mt2')} · ${go('Đá & cát', '?section=stone#mt2')}`]
];
function modelPane(p, pane1) {
  const tbl = card(`<div class="tablewrap" data-no-fold><table class="xd-t ov-mt" data-no-fold><thead><tr><th></th>${MODELS.map(([t, c]) => `<th>${esc(t)}<br><span class="xd-na">${esc(c)}</span></th>`).join('')}</tr></thead><tbody>${MODEL_ROWS.map(r => `<tr><th>${esc(r[0])}</th>${r.slice(1).map(x => `<td>${r[0] === 'Xem số liệu' ? x : esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="pw-src">Nguồn: cơ chế ghi nhận theo ${ext('VAS 15 – Hợp đồng xây dựng', 'https://thuvienphapluat.vn/van-ban/Ke-toan-Kiem-toan/Quyet-dinh-165-2002-QD-BTC-ban-hanh-cong-bo-sau-chuan-muc-ke-toan-Viet-Nam-dot-3-50001.aspx')}; mã theo danh sách theo dõi</div>`);
  // Doanh nghiệp vừa thi công vừa có BOT: doanh thu xây lắp tách khỏi dòng tiền thu phí (số từ thẻ HHV BOT, bảng doanh nghiệp).
  const bot = card(`<div class="tablewrap" data-no-fold><table class="xd-t" data-no-fold><thead><tr><th>Mã</th><th>Thu phí BOT</th><th>Xây lắp, mảng khác</th><th>Nguồn</th></tr></thead><tbody>
    <tr><td><span class="xd-tk">HHV</span></td><td>Doanh thu thu phí 9T/2026 1.835 tỷ đồng (+13%), 61% doanh thu và 87% lãi gộp; 6T/2026 1.246 tỷ đồng (+17%)</td><td>Phần còn lại: xây lắp hầm, cao tốc (ký mới ~2.000 tỷ đồng)</td><td>${ext('HHV bản tin IR Q3/2026', 'https://hhv.cdn.vccloud.vn/wp-content/uploads/2026/10/HHV-2026-Q3-Ban-tin-IR-final.pdf')} · ${artLink('nhadautu-hhv-0731')}</td></tr>
    <tr><td><span class="xd-tk">CII</span></td><td>Thu phí 6T/2026 1.409 tỷ đồng (+8%)</td><td>BĐS, nước, xây lắp; LNST 6T 96 tỷ đồng, thuộc cổ đông mẹ ~33 tỷ đồng</td><td>${ext('VietnamFinance', 'https://vietnamfinance.vn/doanh-thu-tang-hai-chu-so-vi-sao-loi-nhuan-cii-giam-gan-mot-nua-d146779.html')}</td></tr>
    <tr><td><span class="xd-tk">HUT</span></td><td><span class="xd-na">Chưa có số doanh thu thu phí riêng trong nguồn đã mở</span></td><td>Thu phí không dừng (VETC ~75% thị phần ETC), BĐS, phân phối ô tô</td><td>${ext('Mekong ASEAN', 'https://mekongasean.vn/dhdcd-tasco-doanh-thu-55000-ty-do-ng-phat-ha-nh-3560-ty-do-ng-trai-phieu-chuyen-doi-55102.html')}</td></tr></tbody></table></div>
    <p class="xd-na">Doanh thu xây lắp ghi nhận theo tiến độ công trình; doanh thu thu phí đi theo lưu lượng xe và trả nợ vay dự án. BCTC hợp nhất cộng hai phần: số thu phí riêng chỉ có khi doanh nghiệp công bố (bản tin IR, thuyết minh bộ phận). ${go('Chart thu phí HHV theo quý', '?section=contractor&g=bot#mt2')}</p>`);
  const old = [pane1.querySelector('.business-models'), pane1.querySelector('.research-roadmap')].filter(Boolean);
  let fold = null; if (old.length) { fold = el('details', 'research-fold ov-an', '<summary>Ghi chú mô hình kinh doanh (bản 11/10/2026)</summary>'); old.forEach(n => { n.querySelector(':scope>h2')?.remove(); fold.append(n); }); }
  p.append(sec('models', '1.1', 'Mỗi mô hình: ai trả tiền, doanh thu ghi nhận khi nào, biến số nào chi phối biên, vốn bị giữ ở đâu?', tbl, 'Bốn mô hình trên cùng một khung. Doanh nghiệp đa ngành (VCG, DPG, LCG, CII, HUT, KSB, PLC, VGC) có số hợp nhất gồm mảng khác.'),
    sec('bot', '1.2', 'Doanh nghiệp vừa thi công vừa có BOT: doanh thu xây lắp và dòng tiền thu phí tách thế nào?', bot), fold);
}
function forwardPane(p) {
  const [m, leg] = milestones();
  const watch = card(`<ul class="pp-ul">${(H.topics || []).map(t => `<li><b>${esc(t.title)}</b>: ${esc(t.end_condition || '')}<br><span class="xd-na">Kiểm tra tiếp: ${esc(t.next_check || '')}</span></li>`).join('')}</ul><p class="ov-cap">${go('Diễn biến từng chủ đề ở Chủ đề nóng', '#mt7')}</p>`);
  const cyc = block('xd-02'); let fold = null;
  if (cyc) { fold = el('details', 'research-fold ov-an', '<summary>Nhận định chu kỳ (AI, 11/10/2026, rà 09/11/2026)</summary>'); fold.append(cyc); }
  p.append(sec('mile', '2.1', 'Những mốc dự án nào sắp tới?', [m, leg], `Phân biệt quy hoạch/đề xuất, trao thầu, hợp đồng đã ký, thi công, vận hành. ${go('Hồ sơ đầy đủ ở bảng dự án chính', '?section=market&g=projects#mt2')}`),
    sec('watch', '2.2', 'Mốc nào kết thúc từng chủ đề đang theo dõi?', watch), fold);
}

/* ---------- Bức tranh ngành (#mt2): 8 tab con ---------- */
function kpiTiles(list) { // [label, value, unit, delta, sub, go]
  const g = el('section', 'grid kpis pp-kpis');
  g.innerHTML = list.filter(Boolean).map(([l, v, u, d, s, href]) => `<div class="kpi pp-kpi${href ? ' xd-db' : ''}"${href ? ` role="link" tabindex="0" data-xd-href="${esc(href)}"` : ''}><div class="label l">${esc(l)}</div><div class="value v">${v}${u ? `<small> ${esc(u)}</small>` : ''}</div><div class="delta">${d || ''}</div><div class="sub s">${s}</div></div>`).join('');
  return g.children.length ? g : null;
}
const lastRec = rs => rs?.at(-1);
const kCem = () => { const l = lastRec(S.cem); return l ? ['Sản lượng xi măng', nf(l.value, 1), 'triệu tấn', `${sg(sameMonthYoY(S.cem), 1)}% so cùng kỳ`, `${dmy(ym(l.date))} · Cục Thống kê`, '?section=cement&g=cement-output#mt2'] : null; };
const kCoal = () => { const l = lastRec(S.coal); return l ? ['Than Newcastle', nf(l.value, 0), 'USD/tấn', `${sg(yoyDay(S.coal), 1)}% so cùng kỳ`, `${dmy(l.date)} · ICE`, '?section=cement&g=cement-input#mt2'] : null; };
const kCp = () => { const l = lastRec(S.cp); return l ? ['Xi măng PCB40 Hà Nội', nf(l.value / 1e6, 2), 'triệu đ/tấn', '', `${dmy(l.date)} · Sở Xây dựng Hà Nội`, '?section=stone&g=stone-price#mt2'] : null; };
const kAsph = () => { const l = lastRec(S.asph); return l ? ['Nhựa đường SHFE (giá tham chiếu quốc tế)', nf(l.value, 0), 'CNY/tấn', `${sg(yoyDay(S.asph), 1)}% so cùng kỳ`, `${dmy(l.date)} · SHFE`, '?section=asphalt#mt2'] : null; };
const kStone = () => { const l = lastRec(S.stone); return l ? ['Đá 1x2 (giá công bố)', nf(l.value, 0), 'đồng', `${sg(yoyDay(S.stone), 1)}% so cùng kỳ`, `${dmy(l.date)} · Sở Xây dựng qua WiData`, '?section=stone&g=stone-price#mt2'] : null; };
function yoyDay(rs) { const l = lastRec(rs); if (!l) return null; const t = new Date(l.date); t.setFullYear(t.getFullYear() - 1); const k = t.toISOString().slice(0, 10); const p = [...rs].reverse().find(r => r.date <= k); return p && p.value ? (l.value / p.value - 1) * 100 : null; }
function coalChart() {
  const m = monthly(S.coal || []).slice(-36); if (!m.length) return gap('chưa có chuỗi giá than.');
  return lineChart('Giá than Newcastle, cuối tháng (USD/tấn)', 'phiên cuối mỗi tháng · chi phí nhiên liệu của lò nung clinker', m.map(([k]) => dmy(k)), [{name: 'Than Newcastle', color: '#3d4653', values: m.map(x => x[1])}], {unit: 'USD/tấn', src: SRCN('coal_newcastle', 'ICE Newcastle'), note: 'Giá tham chiếu quốc tế; giá than doanh nghiệp xi măng mua trong nước chưa có chuỗi.'});
}
function marketPane(p) {
  // 26/11/2026 (người dùng): bỏ mục "Nguồn cầu nào đang có dữ liệu?" (danh sách dẫn link); dự án trọng điểm thành 1.3.
  // Bảng nhiệt so cùng kỳ của sector-visuals.js (đầu tab Bức tranh cũ, hiện ở mọi tab con) → mục 1.0 của Toàn thị trường.
  const heat = document.querySelector('#pane-mt2 > .fsv-heat');
  if (heat && !heat.querySelector('.pw-src')) heat.append(el('div', 'pw-src', `Nguồn: ${NSO()} (vốn NSNN, xi măng, xuất khẩu) · ICE (than Newcastle) · ${ext('SHFE', 'https://www.shfe.com.cn/eng/Market/Futures/')} (nhựa đường); tự tính so cùng kỳ`));
  p.append(heat ? panel('heat', '1.0', 'Chuỗi số nào đang tăng, chuỗi nào giảm so cùng kỳ?', heat, 'Mỗi ô so với cùng tháng năm trước của chính chuỗi đó; các chuỗi khác đơn vị, chỉ đọc chiều.') : '',
    panel('activity', '1.1', 'Hoạt động xây dựng đang tăng nhanh hay chậm lại?', take('xd-31')),
    panel('credit', '1.2', 'Tín dụng cho ngành xây dựng tăng bao nhiêu?', take('xd-30')),
    panel('projects', '1.3', 'Dự án trọng điểm: vốn từ đâu, gói thầu nào, đang ở bước nào, doanh nghiệp nào liên quan?', projectMaster(), 'Một bảng dự án chính cho cả dashboard; các tab khác dẫn về đúng dòng. Chi tiết giải ngân ở Đầu tư công.'));
}
function publicPane(p) {
  // 26/11/2026 (người dùng): bỏ mục 2.0 "Hai chuỗi số khác nhau thế nào?"; phạm vi từng chuỗi vẫn ghi ở ô số và ⓘ của từng chart.
  p.append(kpiTiles([(() => { const a = ytd(S.pi || []); return a ? ['Vốn NSNN thực hiện lũy kế', nf(a.cur / 1000, 0), 'nghìn tỷ đồng', `${sg(a.yoy, 1)}% so cùng kỳ`, `${a.m}T/${a.y} · Cục Thống kê`] : null; })(),
    (() => { const l = (X.WEEK || []).at(-1); return l ? ['Giải ngân / kế hoạch', nf(l[2], 1), '%', 'chưa có số cùng mốc 2025', `lũy kế đến ${l[0]}/2026 · Bộ Tài chính`] : null; })()]) || '',
  flow([['xd-st-plan', 'Bước 1', 'Kế hoạch vốn'], ['xd-st-disb', 'Bước 2', 'Vốn thực hiện & giải ngân'], ['xd-st-prog', 'Bước 3', 'Tiến độ dự án, gói thầu']]),
  stage('plan', 'Bước 1', 'Kế hoạch vốn'),
  panel('plan2026', '2.1', 'Kế hoạch vốn 2026 bao nhiêu, đã giải ngân bao nhiêu?', take('xd-42')),
  stage('disb', 'Bước 2', 'Vốn thực hiện & giải ngân'),
  panel('nso', '2.2', 'Vốn NSNN thực hiện theo tháng (Cục Thống kê) tăng bao nhiêu?', grid2(take('xd-40'), take('xd-41'))),
  panel('mof', '2.3', 'Giải ngân theo kế hoạch (Bộ Tài chính) đạt bao nhiêu % so cùng kỳ?', take('xd-43'), 'Đường đua giải ngân: đường Bộ Tài chính là số thực tế theo mốc báo cáo; đường NSO là phép tính tham chiếu.'),
  stage('prog', 'Bước 3', 'Tiến độ dự án, gói thầu'),
  panel('pubproj', '2.4', 'Dự án đầu tư công đang ở bước nào?', projectList(x => /Đầu tư công/.test(x.capital))));
}
function contractorPane(p) {
  const civ = ['CTD', 'HBC'], inf = ['VCG', 'FCN', 'DPG', 'C4G', 'LCG'], bot = ['HHV', 'CII', 'HUT'];
  const basket = take('xd-72'); if (basket) { basket.querySelector('.pw-src') || basket.append(el('div', 'pw-src', 'Nguồn: ' + BASKET_SRC)); basket.append(el('div', 'pw-src-note', BASKET_W)); }
  const bn = take('xd-71'); if (bn) bn.append(el('div', 'pw-src-note', 'Phạm vi: một tỉnh (Bắc Ninh, gồm Bắc Giang cũ), một quý, gốc bình quân 2025 = 100 — khác gốc 2024 của rổ; chỉ đọc chiều.'));
  p.append(flow([['xd-g-civil', 'Nhóm 1', 'Dân dụng & nhà xưởng'], ['xd-g-infra', 'Nhóm 2', 'Thi công hạ tầng'], ['xd-g-bot', 'Nhóm 3', 'BOT & thu phí']]),
    grpHead('civil', 'Dân dụng & nhà xưởng', 'CTD • HBC · ký mới, backlog → thi công, nghiệm thu → doanh thu và biên'),
    stage('civil-backlog', 'Khâu 1', 'Ký mới, backlog'),
    panel('civil-b', '3.1', 'Nhà thầu dân dụng có bao nhiêu việc trong tay?', [playersFor(civ, 'Dân dụng, nhà xưởng'), projectList(x => x.tickers.some(t => civ.includes(t.code)))]),
    stage('civil-exec', 'Khâu 2', 'Thi công, nghiệm thu'),
    panel('civil-e', '3.2', 'Tiền ứng trước, phải thu và dở dang của nhà thầu dân dụng ra sao?', finSnapshot(civ)),
    stage('civil-margin', 'Khâu 3', 'Doanh thu và biên'),
    panel('civil-m', '3.3', 'Biên gộp nhà thầu dân dụng đi thế nào?', gmChart(civ)),
    grpHead('infra', 'Thi công hạ tầng', 'VCG • FCN • DPG • C4G • LCG · ký mới, backlog → thi công, nghiệm thu → doanh thu, biên và chi phí vật liệu'),
    stage('infra-backlog', 'Khâu 1', 'Ký mới, backlog'),
    panel('infra-b', '3.4', 'Nhà thầu hạ tầng có bao nhiêu việc trong tay?', [playersFor(inf, 'Thi công hạ tầng'), projectList(x => x.tickers.some(t => inf.includes(t.code)))]),
    stage('infra-exec', 'Khâu 2', 'Thi công, nghiệm thu'),
    panel('infra-e', '3.5', 'Tiền ứng trước, phải thu và dở dang của nhà thầu hạ tầng ra sao?', finSnapshot(inf)),
    stage('infra-margin', 'Khâu 3', 'Doanh thu, biên và chi phí vật liệu'),
    panel('infra-m', '3.6', 'Biên gộp nhà thầu hạ tầng đi thế nào?', gmChart(inf, 'Biên gộp theo quý (%)', 'Số toàn doanh nghiệp; VCG, DPG, LCG gồm mảng ngoài xây lắp.')),
    panel('infra-cost', '3.7', 'Chi phí vật liệu của nhà thầu đường tăng bao nhiêu?', [basket, bn], 'Rổ giá vật liệu và chỉ số giá xây dựng đặt cạnh biên gộp; chưa so với đơn giá hợp đồng.'),
    grpHead('bot', 'BOT & thu phí', 'HHV • CII • HUT · đầu tư dự án → vận hành, thu phí → doanh thu và biên'),
    stage('bot-invest', 'Khâu 1', 'Đầu tư dự án, backlog'),
    panel('bot-b', '3.8', 'Nhà đầu tư BOT đang làm dự án nào, nợ vay bao nhiêu?', [playersFor(bot, 'BOT, thu phí'), projectList(x => x.segment === 'BOT & thu phí')]),
    stage('bot-toll', 'Khâu 2', 'Vận hành, thu phí'),
    panel('bot-t', '3.9', 'Doanh thu thu phí và lưu lượng trạm thay đổi thế nào?', take('xd-70')),
    stage('bot-margin', 'Khâu 3', 'Doanh thu và biên'),
    panel('bot-m', '3.10', 'Biên gộp doanh nghiệp BOT đi thế nào?', gmChart(bot, 'Biên gộp theo quý (%)', 'Số hợp nhất gồm thu phí, xây lắp và mảng khác (CII, HUT có bất động sản).')));
}
function cementPane(p) {
  p.append(kpiTiles([kCem(), kCoal(), kCp()]) || '',
    flow([['xd-st-cement-input', 'Khâu 1', 'Than, chi phí đầu vào'], ['xd-st-cement-output', 'Khâu 2', 'Công suất, sản lượng'], ['xd-st-cement-sales', 'Khâu 3', 'Tiêu thụ nội địa, xuất khẩu'], ['xd-st-cement-price', 'Khâu 4', 'Giá bán, biên']]),
    stage('cement-input', 'Khâu 1', 'Than, chi phí đầu vào'),
    panel('cement-coal', '4.1', 'Giá than, nhiên liệu chính của lò nung, đang ở đâu?', coalChart()),
    stage('cement-output', 'Khâu 2', 'Công suất, sản lượng'),
    panel('cement-out', '4.2', 'Sản lượng xi măng theo tháng và công suất từng doanh nghiệp', [take('xd-20'), take('xd-61')]),
    stage('cement-sales', 'Khâu 3', 'Tiêu thụ nội địa, xuất khẩu'),
    panel('cement-sd', '4.3', 'Tiêu thụ nội địa và xuất khẩu so công suất (cùng năm 2025, triệu tấn)', take('xd-23'), 'Chỉ so cung với cầu trong cùng kỳ, cùng đơn vị. Thuế xuất khẩu clinker 5% đến hết 2026 ghi trong bảng.'),
    panel('cement-exp', '4.4', 'Kim ngạch xuất khẩu clinker, xi măng theo tháng (triệu USD)', take('xd-21'), 'Đơn vị USD, không so trực tiếp với số tấn ở mục trên.'),
    stage('cement-price', 'Khâu 4', 'Giá bán, biên'),
    panel('cement-m', '4.5', 'Giá bán xi măng và biên gộp HT1, BCC', [gmChart(['HT1', 'BCC'], 'Biên gộp HT1, BCC theo quý (%)', 'Số hợp nhất toàn doanh nghiệp.'), card(`<p>Giá xi măng công bố tại Hà Nội theo quý ở ${go('Đá & cát › Giá', '?section=stone&g=stone-price#mt2')}; các đợt tăng giá 2026 ở ${go('Chủ đề nóng', '#mt7')}.</p>`)]));
}
function stonePane(p) {
  const cap = card(`<div class="chart-title">Công suất khai thác được phép và vùng cung ứng</div><div class="chart-sub">theo công bố doanh nghiệp · vùng theo vị trí mỏ</div><div class="tablewrap" data-no-fold><table class="xd-t" data-no-fold><thead><tr><th>Mã</th><th>Công suất khai thác</th><th>Vùng</th><th>Công trình được cung ứng (có nguồn xác nhận)</th></tr></thead><tbody>
    <tr><td><span class="xd-tk">VLB</span></td><td>5,7 triệu m³/năm; 5 mỏ, trữ lượng trên 86 triệu m³</td><td>Đồng Nai</td><td>Sân bay Long Thành: cấp 1,6 triệu m³ (${ext('DN&PL', 'https://doanhnhan.baophapluat.vn/xay-dung-va-san-xuat-vat-lieu-xay-dung-bien-hoa-vlb-bao-lai-rong-quy-ii-2026-dat-374-ty-dong-hoan-nhap-344-ty-dong-tien-cap-quyen-khai-thac.html')})</td></tr>
    <tr><td><span class="xd-tk">KSB</span></td><td>Đá 2026 ~4 triệu m³; mỏ Tân Mỹ 2,2 triệu m³/năm; giấy phép mỏ Phước Vĩnh hết 6/2027</td><td>Bình Dương cũ (TP.HCM)</td><td><span class="xd-na">Chưa có nguồn xác nhận quan hệ cung ứng</span></td></tr>
    <tr><td><span class="xd-tk">DHA</span></td><td>3 mỏ 1,606 triệu m³/năm; Tân Cang 3 trữ lượng 35,6 triệu m³ (2025)</td><td>Đồng Nai</td><td><span class="xd-na">Chưa có nguồn xác nhận; nhu cầu đá Long Thành ~18 triệu m³ (số 2025) là nhu cầu dự án, không phải hợp đồng của DHA</span></td></tr></tbody></table></div><div class="pw-src">Nguồn: bảng mỏ đá bên trên (đường dẫn từng mã)</div>`);
  const t6 = card(`<div class="chart-title">Biến động giá công bố T6/2025 so T5/2025</div><div class="tablewrap" data-no-fold><table class="xd-t" data-no-fold><tbody><tr><td>Cát</td><td class="n">+29,95% đến +58,45%</td></tr><tr><td>Đá</td><td class="n">+7,3% đến +11,11%</td></tr></tbody></table></div><div class="pw-src">Nguồn: ${artLink('baodauthau-da-0908')}</div>`);
  p.append(kpiTiles([kStone(), kCp()]) || '',
    flow([['xd-st-stone-mine', 'Khâu 1', 'Mỏ, giấy phép'], ['xd-st-stone-cap', 'Khâu 2', 'Công suất được phép, vùng cung'], ['xd-st-stone-price', 'Khâu 3', 'Giá, chi phí giao tới công trình']]),
    stage('stone-mine', 'Khâu 1', 'Mỏ, giấy phép'),
    panel('stone-m', '5.1', 'Doanh nghiệp có những mỏ nào, giấy phép đến khi nào?', [take('xd-63'), gap((H.policy_gaps || {}).mine || 'văn bản cấp mỏ.')]),
    stage('stone-cap', 'Khâu 2', 'Công suất được phép, vùng cung'),
    panel('stone-c', '5.2', 'Công suất khai thác và vùng cung ứng', cap, 'Chỉ gắn mỏ với công trình khi có nguồn xác nhận quan hệ cung ứng.'),
    stage('stone-price', 'Khâu 3', 'Giá, chi phí giao tới công trình'),
    panel('stone-p', '5.3', 'Giá đá, cát tại mỏ và tại công trình', [take('xd-24'), take('xd-62'), t6], 'Giá tại công trình gồm vận chuyển; giá tại mỏ là giá doanh nghiệp có mỏ bán ra.'));
}
function asphaltPane(p) {
  const x22 = take('xd-22'); if (x22) x22.append(el('div', 'pw-src-note', 'SHFE là giá hợp đồng tương lai nhựa đường sàn Thượng Hải (CNY/tấn), dùng làm giá tham chiếu quốc tế; không phải giá nhà thầu mua trong nước.'));
  p.append(kpiTiles([kAsph()]) || '',
    flow([['xd-st-asph-ref', 'Khâu 1', 'Giá tham chiếu quốc tế'], ['xd-st-asph-dom', 'Khâu 2', 'Giá mua trong nước'], ['xd-st-asph-cost', 'Khâu 3', 'Chi phí thi công']]),
    stage('asph-ref', 'Khâu 1', 'Giá tham chiếu quốc tế'),
    panel('asph-r', '6.1', 'Giá nhựa đường tham chiếu (SHFE) đi thế nào?', x22),
    stage('asph-dom', 'Khâu 2', 'Giá mua trong nước'),
    panel('asph-d', '6.2', 'Giá nhựa đường trong nước và doanh nghiệp bán', [gap('chưa có giá nhựa đường theo đồng/tấn trong nguồn mở được.'), take('xd-64')]),
    stage('asph-cost', 'Khâu 3', 'Chi phí thi công'),
    panel('asph-c', '6.3', 'Nhựa đường tác động chi phí thi công thế nào?', card(`<p>Nhựa đường chiếm 31,25% rổ giá vật liệu nhà thầu đường. Chỉ số giá Bắc Ninh quý III/2026: vật liệu bê tông nhựa, nhựa đường 120,45 (2025 = 100). ${go('Rổ giá vật liệu và chỉ số giá xây dựng', '?section=contractor&g=infra-cost#mt2')}</p><div class="pw-src">Nguồn: ${artLink('tvnd-bacninh-1028')}</div>`)));
}
function glassPane(p) {
  p.append(flow([['xd-st-glass-cap', 'Khâu 1', 'Công suất'], ['xd-st-glass-sales', 'Khâu 2', 'Tiêu thụ, giá bán'], ['xd-st-glass-eff', 'Khâu 3', 'Hiệu quả mảng vật liệu']]),
    stage('glass-cap', 'Khâu 1', 'Công suất'),
    panel('glass-c', '7.1', 'VGC: công suất, kế hoạch, kết quả', take('xd-65')),
    stage('glass-sales', 'Khâu 2', 'Tiêu thụ, giá bán'),
    panel('glass-s', '7.2', 'Sản xuất sản phẩm khoáng phi kim đi thế nào?', [take('xd-25'), gap('chưa có giá bán kính, gạch theo kỳ.')], 'IIP gộp xi măng, gạch, kính; không tách riêng kính, gạch.'),
    stage('glass-eff', 'Khâu 3', 'Hiệu quả mảng vật liệu'),
    panel('glass-e', '7.3', 'Biên gộp VGC (hợp nhất, gồm khu công nghiệp)', [gmChart(['VGC'], 'Biên gộp VGC theo quý (%)', 'Số hợp nhất gồm cả khu công nghiệp. Số riêng mảng vật liệu chỉ có khi doanh nghiệp công bố: doanh thu kính Q1/2026 792 tỷ đồng (+214%) theo bảng VGC.'), gap('báo cáo bộ phận theo quý của VGC chưa có trong dữ liệu.')]));
}
function policyPane(p) {
  const G = {capital: ['Giao vốn', 'Kế hoạch vốn, giải ngân'], bidding: ['Đấu thầu, PPP', 'Chọn nhà thầu, nhà đầu tư, cơ chế đặc thù'], mine: ['Cấp mỏ', 'Cấp phép khai thác cát, đá']};
  const ST = {effective: 'Có hiệu lực', draft: 'Dự thảo', expired: 'Hết hiệu lực'};
  const tbl = list => card(`<div class="tablewrap" data-no-fold><table class="xd-t" data-no-fold><thead><tr><th>Văn bản</th><th>Trạng thái</th><th>Hiệu lực</th><th>Nội dung</th><th>Khâu bị tác động</th><th>Mã chịu</th><th>Nguồn</th></tr></thead><tbody>${list.map(x => `<tr><td><b>${esc(x.title)}</b></td><td><span class="xd-chip xd-ps-${x.status}">${ST[x.status]}</span></td><td>${x.effective ? dmy(x.effective) : '<span class="xd-na">chưa xác định</span>'}</td><td>${esc(x.content)}</td><td>${esc(x.stage)}</td><td>${esc(x.tickers)}</td><td>${ext(x.source[0], x.source[1])}</td></tr>`).join('')}</tbody></table></div><div class="pw-src">Nguồn: cột Nguồn từng dòng</div>`);
  const body = Object.entries(G).map(([k, [t, d]], i) => { const L = (H.policies || []).filter(x => x.group === k);
    return panel('pol-' + k, '8.' + (i + 1), `${t}: văn bản nào đang áp dụng?`, [L.length ? tbl(L) : null, (H.policy_gaps || {})[k] ? gap(H.policy_gaps[k]) : null], d); });
  const b = block('xd-50'); if (b) b.remove(); // dòng giá vật liệu thương mại → Đá & cát, thuế clinker → Xi măng; văn bản còn lại ở bảng trên
  if (body[0]) { body[0].dataset.blockId = 'xd-50'; }
  p.append(...body, el('p', 'xd-na', 'Giá vật liệu thương mại chuyển về Đá & cát (giá công bố) và Xi măng (thuế xuất khẩu clinker). Phòng vệ thương mại thép ở dashboard Thép.'));
}

/* ---------- Tài chính ngành (#mt14): 4 tab loại hình doanh nghiệp (26/11/2026, người dùng) ----------
   Cùng một thanh tab ở cả 01 Tài chính ngành và 02 Doanh nghiệp niêm yết; chọn một loại hình là đổi cả hai. URL ?fin=…&m=<nhóm>#mt14. */
const MODEL_TABS = (F?.groups || []).map((g, i) => [g.id, String(i + 1).padStart(2, '0'), g.label, g.color]);
let MODEL = MODEL_TABS[0]?.[0] || 'civil';
const BARS = [];
function modelBar() {
  const nav = el('div', 'xd-mtabs'); nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', 'Loại hình doanh nghiệp');
  MODEL_TABS.forEach(([k, n, l, c]) => { const b = el('button', 'xd-mtab', `<i style="background:${c}"></i><span>${n}</span>${esc(l)}<small>${(F.companies || []).filter(x => x.group === k).length} mã</small>`); b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.xdModel = k; nav.append(b); });
  nav.addEventListener('click', e => { const b = e.target.closest('[data-xd-model]'); if (b) navigate(`?fin=${TABS.mt14?.cur || 'fin'}&m=${b.dataset.xdModel}#mt14`, true, true); });
  nav.addEventListener('keydown', e => { const d = {ArrowRight: 1, ArrowLeft: -1}[e.key]; if (!d) return; e.preventDefault(); const ks = MODEL_TABS.map(x => x[0]), n = ks[(ks.indexOf(MODEL) + d + ks.length) % ks.length]; navigate(`?fin=${TABS.mt14?.cur || 'fin'}&m=${n}#mt14`, true, true); nav.querySelector(`[data-xd-model="${n}"]`)?.focus(); });
  BARS.push(nav); return nav;
}
const MPANES = {};
function setModel(k) {
  if (!MODEL_TABS.some(x => x[0] === k)) k = MODEL_TABS[0]?.[0];
  MODEL = k;
  BARS.forEach(nav => [...nav.children].forEach(b => { const on = b.dataset.xdModel === k; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; b.classList.toggle('active', on); }));
  Object.entries(MPANES).forEach(([g, d]) => { d.hidden = g !== k; });
  window.XdFinance?.setGroup(k);
  refit(document.getElementById('pane-mt14')); setTimeout(() => dispatchEvent(new Event('pv:toc')), 120);
}
const BASKET_NOTE = 'Rổ ngành của VNDirect, thành phần khác nhóm loại hình của dashboard';
function basketBlock(codes) {
  const BY = PUB.sector_ratio?.by_sector || {};
  const ks = Object.keys(BY).filter(k => (BY[k].members || []).some(m => codes.includes(m)));
  if (!ks.length) return gap('chưa có rổ định giá ngành chứa các mã này.');
  const cols = ['#1D2678', '#2a9fa3', '#c98a00', '#861C52'];
  const dates = [...new Set(ks.flatMap(k => BY[k].records.map(r => r[0])))].sort().filter((_, i, a) => (a.length - 1 - i) % 5 === 0).slice(-110);
  const ser = ks.map((k, i) => { const m = new Map(BY[k].records.map(r => [r[0], r[2]])); return {name: 'P/B ' + BY[k].name, color: cols[i % cols.length], values: dates.map(d => m.get(d) ?? null)}; });
  const ch = lineChart('P/B rổ ngành theo phiên (lần)', 'mỗi 5 phiên · rổ ngành VNDirect có chứa mã của nhóm', dates.map(dmy), ser, {unit: 'lần', digits: 2, src: ext('VNDirect · chỉ số định giá ngành', PUB.sector_ratio?.url || 'https://www.vndirect.com.vn/'), note: BASKET_NOTE + '; vốn hóa và thành phần ở bảng dưới.'});
  const tbl = card(`<div class="tablewrap" data-no-fold><table class="xd-t" data-no-fold data-fs-tl="1"><thead><tr><th>Rổ ngành</th><th>Thành phần</th><th>P/E</th><th>P/B</th><th>Vốn hóa (tỷ đ)</th><th>Phiên</th></tr></thead><tbody>${ks.map(k => { const l = BY[k].records.at(-1); return `<tr><td><b>${esc(BY[k].name)}</b></td><td>${(BY[k].members || []).map(m => `<span class="xd-tk"${codes.includes(m) ? '' : ' style="opacity:.55"'}>${m}</span>`).join('')}</td><td class="n">${nf(l?.[1], 1)}x</td><td class="n">${nf(l?.[2], 2)}x</td><td class="n">${nf(l?.[3], 0)}</td><td class="n">${dmy(l?.[0])}</td></tr>`; }).join('')}</tbody></table></div><div class="pw-src">Nguồn: ${ext('VNDirect · chỉ số định giá ngành', PUB.sector_ratio?.url || 'https://www.vndirect.com.vn/')}</div><div class="pw-src-note">Mã mờ là mã trong rổ nhưng thuộc nhóm loại hình khác.</div>`);
  return [ch, tbl];
}
function finRows(codes) {
  if (!F) return gap('chưa tải được BCTC quý.');
  const P = F.periods, comps = F.companies.filter(c => codes.includes(c.ticker));
  const row = c => { const d = F.data[c.ticker]; if (!d) return ''; let i = P.length - 1; while (i >= 0 && !fin(d.revenue[i])) i--; const T = k => i >= 3 && d[k].slice(i - 3, i + 1).every(fin) ? d[k].slice(i - 3, i + 1).reduce((a, b) => a + b, 0) : null; const adv = fin(d.adv_customers[i]) ? d.adv_customers[i] + (d.adv_customers_lt[i] || 0) : null, rv = T('revenue');
    return `<tr><td><span class="xd-tk">${c.ticker}${c.mixed ? '*' : ''}</span></td><td>${esc((c.note || '').split(':')[1] || c.note || '')}${c.ticker === 'CTD' ? '<br><span class="xd-na">năm tài chính 1/7–30/6</span>' : ''}</td><td class="n">${qL(P[i])}</td><td class="n">${nf(rv)}</td><td class="n">${nf(T('npat'))}</td><td class="n">${nf(T('npat_parent'))}</td><td class="n">${fin(adv) && rv ? nf(adv / rv, 2) : '—'}</td><td class="n">${fin(d.receivables[i]) && rv ? nf(d.receivables[i] / rv, 2) : '—'}</td></tr>`; };
  return card(`<div class="tablewrap" data-no-fold><table class="xd-t" data-no-fold><thead><tr><th>Mã</th><th>Hoạt động</th><th>Kỳ BCTC</th><th>Doanh thu TTM (tỷ đ)</th><th>LNST hợp nhất TTM</th><th>LNST thuộc cổ đông mẹ TTM</th><th>Ứng trước / Doanh thu TTM (lần)</th><th>Phải thu KH / Doanh thu TTM (lần)</th></tr></thead><tbody>${comps.map(row).join('')}</tbody></table></div>
    <div class="pw-src">Nguồn: ${ext('BCTC hợp nhất theo quý (VNDirect finfo)', 'https://api-finfo.vndirect.com.vn/v4/financial_statements')}; tự tính TTM</div><div class="pw-src-note">LNST hợp nhất gồm lợi ích cổ đông không kiểm soát; LNST thuộc cổ đông công ty mẹ là phần của cổ đông doanh nghiệp. Ứng trước = người mua trả tiền trước ngắn + dài hạn (số dư). Phải thu KH = phải thu khách hàng ngắn hạn (số dư), không gồm phải thu theo tiến độ HĐXD. Dấu * là đa ngành: số gồm mảng khác.</div>`);
}
// Hợp đồng, liên danh, backlog: tách giá trị toàn gói, phần của doanh nghiệp, backlog công bố (từ bảng doanh nghiệp xd-60).
const NA = '<span class="xd-na">chưa công bố</span>';
const CONTRACTS = [['CTD', 'Lego, Nhà hát Opera, sân bay Gia Bình', NA, NA, '~65.000'], ['HBC', 'Hợp đồng nước ngoài 72 triệu USD (2026)', NA, NA, '&gt;15.000'],
  ['VCG', 'Long Thành gói 5.10 (liên danh Vietur)', '&gt;35.000', NA, NA], ['FCN', 'Sân bay Gia Bình', NA, '~1.600', '~10.000'], ['DPG', 'Cầu Trần Hưng Đạo; Vành đai 4', NA, '2.896; 1.221', '&gt;8.000 (xây lắp)'],
  ['C4G', 'Cầu Ninh Cường; ký mới 2025', NA, '~453; &gt;2.700', NA], ['LCG', 'Đường Di sản Hưng Yên; cao tốc Nội Bài – Lào Cai', NA, '1.140; ~1.400', NA], ['HHV', 'Ký mới 2026', NA, '~2.000', NA]];
function contractsFor(codes) {
  const L = CONTRACTS.filter(r => codes.includes(r[0])); if (!L.length) return gap('doanh nghiệp vật liệu không công bố backlog hợp đồng; sản lượng, công suất ở Bức tranh ngành (Xi măng, Đá & cát, Nhựa đường, Kính & gạch).');
  return card(`<div class="tablewrap" data-no-fold><table class="xd-t" data-no-fold><thead><tr><th>Mã</th><th>Hợp đồng, gói thầu</th><th>Giá trị toàn gói (tỷ đ)</th><th>Phần thuộc doanh nghiệp (tỷ đ)</th><th>Backlog công bố (tỷ đ)</th></tr></thead><tbody>${L.map(r => `<tr><td><span class="xd-tk">${r[0]}</span></td><td>${r[1]}</td>${r.slice(2).map(x => x === NA ? `<td>${x}</td>` : `<td class="n">${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    <div class="pw-src">Nguồn: bảng kế hoạch, kết quả, backlog ở ${go('Nhà thầu & BOT', '?section=contractor#mt2')} (đường dẫn từng mã)</div><div class="pw-src-note">Giá trị toàn gói liên danh không phải phần của doanh nghiệp; ô "chưa công bố" là nguồn đã mở chưa nêu. Backlog là số doanh nghiệp tự công bố, kỳ khác nhau.</div>`);
}
// Bảng so sánh tài chính & xu hướng theo quý (financial-comparison.js, company-trend.js) dựng riêng cho từng nhóm: lọc dữ liệu
// chung chỉ trong lúc dựng rồi trả lại.
function comparisonFor(codes, g) {
  if (!window.FinancialComparison) return null;
  const host = el('section', 'financial-comparison'); const cc = window.COMPANY_COMPARISON, cq = window.COMPANY_QUARTERLY;
  try {
    if (cc) window.COMPANY_COMPARISON = {...cc, companies: (cc.companies || []).filter(r => r.sector !== 'construction' || codes.includes(r.symbol))};
    if (cq) window.COMPANY_QUARTERLY = {...cq, companies: (cq.companies || []).filter(r => r.sector !== 'construction' || codes.includes(r.symbol))};
    window.FinancialComparison.mount(host, {sector: 'construction', sources: el('div')});
  } catch (e) { LOG('compare-' + g + ':' + e.message); } finally { window.COMPANY_COMPARISON = cc; window.COMPANY_QUARTERLY = cq; }
  host.querySelectorAll('[id]').forEach(n => { n.id = n.id + '-' + g; });
  host.querySelectorAll('label[for]').forEach(n => { n.htmlFor = n.htmlFor + '-' + g; });
  return host.children.length ? host : null;
}
function rowsOf(src, keep) { if (!src) return null; const c = src.cloneNode(true); c.removeAttribute('data-block-id'); c.removeAttribute('id'); c.querySelectorAll('[id]').forEach(n => n.removeAttribute('id')); let n = 0; c.querySelectorAll('tbody tr').forEach(tr => { if (keep(tr)) n++; else tr.remove(); }); return n ? c : null; }
function companiesPane(p) {
  const V = window.COMPANY_VALUATION?.companies || {};
  const comps = F?.companies || [];
  const bk = block('xd-74'), players = block('xd-04');
  if (bk) { srcOf(bk); bk.querySelector('.pw-src') || bk.append(el('div', 'pw-src', `Nguồn: ${ext('VNDirect finfo · BCTC quý', 'https://api-finfo.vndirect.com.vn/v4/financial_statements')}; tự tính`)); }
  if (players) srcOf(players);
  MODEL_TABS.forEach(([g, num, label]) => {
    const codes = comps.filter(c => c.group === g).map(c => c.ticker);
    const d = el('div', 'xd-mpane'); d.dataset.model = g; d.hidden = true; MPANES[g] = d;
    const quick = card(`<div class="kc-qv">${comps.filter(c => c.group === g).map(c => { const v = V[c.ticker]; return `<div class="kc-qv-t"><span class="xd-tk">${c.ticker}${c.mixed ? '*' : ''}</span><b>${v && fin(v.pe) ? nf(v.pe, 1) + 'x P/E' : 'P/E —'}</b><span>${v && fin(v.pb) ? nf(v.pb, 2) + 'x P/B' : 'P/B —'}</span><small>định giá ${dmy(v?.date)}</small></div>`; }).join('')}</div><div class="pw-src">Nguồn: ${ext('VNDirect (P/E, P/B theo phiên)', 'https://www.vndirect.com.vn/')}</div><div class="pw-src-note">Dấu * là doanh nghiệp đa ngành. EPS, giá trị sổ sách theo BCTC gần nhất VNDirect dùng.</div>`);
    const bkRows = rowsOf(bk, tr => codes.includes(tr.cells[0]?.textContent.replace(/[^A-Z0-9]/g, '')));
    const plRows = rowsOf(players, tr => { const t = tr.cells[1]?.textContent || ''; return codes.some(c => t.includes(c)); });
    const cover = [bkRows, plRows].filter(Boolean);
    d.append(panel('val-' + g, '2.1', `${label}: doanh nghiệp đang được định giá thế nào?`, [quick, basketBlock(codes)], `Định giá theo phiên, ngày ${dmy(window.COMPANY_VALUATION?.latest_observation)}.`),
      panel('model-' + g, '2.2', `${label}: số hợp nhất, thuộc cổ đông mẹ, ứng trước và phải thu từng mã`, finRows(codes)),
      panel('contracts-' + g, '2.3', `${label}: hợp đồng, liên danh và backlog đã công bố`, contractsFor(codes)),
      panel('compare-' + g, '2.4', `${label}: lợi nhuận, nợ vay, định giá từng mã qua các kỳ`, comparisonFor(codes, g) || gap('chưa có bảng so sánh cho nhóm này.')),
      panel('cover-' + g, '2.5', bkRows ? `${label}: ứng trước, phải thu và biến quyết định` : `${label}: biến quyết định`, cover.length ? cover : gap('chưa có bảng biến quyết định cho nhóm này.'), bkRows ? 'Cột "Ứng trước / Doanh thu TTM" là trường backlog_cover của dữ liệu: tiền chủ đầu tư ứng trước ÷ doanh thu 4 quý, không phải tỷ lệ backlog.' : ''));
    p.append(d);
  });
  // Khối gốc đã tách theo nhóm: gỡ bản chung (P/B toàn ngành xd-03, so sánh tài chính toàn ngành, xd-04, xd-74).
  [block('xd-03'), bk, players, ...document.querySelectorAll('#pane-mt1 .financial-comparison')].forEach(n => n?.remove());
}

/* ---------- Bộ tab con dùng chung ---------- */
const TABS = {};
function tabset(pane, major, param, defs, kind) {
  const nav = el('div', kind === 'ov' ? 'ov-nav' : 'pp-nav'); nav.setAttribute('role', 'tablist');
  const P = {}, B = {};
  defs.forEach(([key, num, label, tech]) => {
    const b = el('button', kind === 'ov' ? 'tabbtn ov-tab' : 'tabbtn pp-tab', `<span>${num}</span>${esc(label)}${tech ? `<small>${esc(tech)}</small>` : ''}`); b.type = 'button'; b.id = `${major}-xd-${key}-tab`; b.setAttribute('role', 'tab'); b.dataset.xdTab = key; b.setAttribute('aria-controls', `${major}-xd-${key}`); nav.append(b); B[key] = b;
    const p = el('div', 'pane-subpane ' + (kind === 'ov' ? 'ov-pane' : 'pp-pane')); p.id = `${major}-xd-${key}`; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); p.hidden = true; P[key] = p;
  });
  const keys = defs.map(d => d[0]);
  const t = {major, param, nav, P, B, keys, cur: keys[0], onShow: null,
    show(key) { if (!keys.includes(key)) key = keys[0]; keys.forEach(k => { const on = k === key; P[k].hidden = !on; B[k].setAttribute('aria-selected', String(on)); B[k].tabIndex = on ? 0 : -1; B[k].classList.toggle('active', on); }); t.cur = key; if (t.onShow) t.onShow(key); refit(P[key]); setTimeout(() => dispatchEvent(new Event('pv:toc')), 80); }};
  nav.addEventListener('click', e => { const b = e.target.closest('[data-xd-tab]'); if (b) navigate(`?${param}=${b.dataset.xdTab}#${major}`, true, true); });
  nav.addEventListener('keydown', e => { const d = {ArrowRight: 1, ArrowLeft: -1}[e.key]; if (!d) return; e.preventDefault(); const i = keys.indexOf(t.cur), n = keys[(i + d + keys.length) % keys.length]; navigate(`?${param}=${n}#${major}`, true, true); B[n].focus(); });
  const setTop = () => { const m = $('.majortabs'), cs = m && getComputedStyle(m); nav.style.top = cs && cs.position === 'sticky' && innerWidth > 700 ? (m.getBoundingClientRect().height + 8) + 'px' : '0px'; };
  setTop(); addEventListener('resize', setTop);
  TABS[major] = t; return t;
}

/* ---------- Điều hướng: URL ↔ tab chính, tab con, nhóm ---------- */
const PARAMS = {mt1: 'ov', mt2: 'section', mt14: 'fin'};
const ALL_P = ['ov', 'section', 'fin', 'g', 'm'];
const LEGACY = {mt3: '?section=contractor&g=infra-cost#mt2', mt4: '?section=policy#mt2', mt6: '?fin=companies#mt14', mt10: '?section=public#mt2', mt8: '?section=market&g=sources#mt2'};
function parse(href) { const u = new URL(href, location.href); let major = u.hash.slice(1) || 'mt1'; if (LEGACY[major]) return parse(LEGACY[major]); return {major, sub: u.searchParams.get(PARAMS[major] || ''), g: u.searchParams.get('g'), m: u.searchParams.get('m'), u}; }
function canonical(st) { const u = new URL(location.href); ALL_P.forEach(k => u.searchParams.delete(k)); const t = TABS[st.major]; if (t) u.searchParams.set(t.param, st.sub || t.cur); if (st.major === 'mt14') u.searchParams.set('m', st.m || MODEL); if (st.g) u.searchParams.set('g', st.g); u.hash = '#' + st.major; return u.pathname + u.search + u.hash; }
function scrollG(g, major) {
  if (!g) return;
  if (g === 'sources') { const d = $('#xd-sources'); if (d) { d.open = true; setTimeout(() => d.scrollIntoView({block: 'start', behavior: 'instant'}), 120); } return; }
  if (g.startsWith('proj-')) { openProject(g.slice(5), false); return; }
  const pane = document.getElementById('pane-' + major);
  const n = pane && (pane.querySelector(`#xd-st-${CSS.escape(g)}, #xd-g-${CSS.escape(g)}, #xd-${CSS.escape(g)}`) || (g === 'cash' ? $('#pf-sec-cash') : null));
  if (n) setTimeout(() => { n.scrollIntoView({block: 'start', behavior: 'instant'}); n.classList.remove('pv-flash'); void n.offsetWidth; n.classList.add('pv-flash'); }, 160);
}
function apply(st) {
  if (window.showMajorTab && !document.getElementById('pane-' + st.major)?.classList.contains('active')) window.showMajorTab(st.major);
  const t = TABS[st.major]; if (t) t.show(st.sub || t.cur);
  if (st.major === 'mt14') setModel(st.m || MODEL);
  scrollG(st.g, st.major);
}
// push: ghi lịch sử (Back/Forward); keepScroll: đổi tab con không cuộn lên đầu.
function navigate(href, push, keepScroll) {
  const st = parse(href), url = canonical(st);
  if (push && url !== location.pathname + location.search + location.hash) history.pushState({xd: 1}, '', url); else history.replaceState({xd: 1}, '', url);
  apply(st);
  // Mở tab con: về đầu tab con (dưới thanh tab dính) nếu đang cuộn quá; link không có nhóm (g) thì luôn về đầu tab con.
  if (!st.g) { const t = TABS[st.major], pn = t?.P[t.cur]; if (pn) { const top = pn.getBoundingClientRect().top + scrollY - 150; if (!keepScroll || scrollY > top) scrollTo({top: Math.max(0, top), behavior: 'instant'}); } }
}
function openProject(id, push = true) {
  const href = `?section=market&g=proj-${id}#mt2`;
  if (push) { history.pushState({xd: 1}, '', canonical(parse(href))); }
  window.showMajorTab?.('mt2'); TABS.mt2?.show('market');
  const tbl = $('#xd-proj-master'); tbl?._reset?.();
  const tr = document.getElementById('xd-proj-' + id); if (!tr) return;
  setTimeout(() => { tr.scrollIntoView({block: 'center', behavior: 'instant'}); tr.classList.add('xd-hl'); setTimeout(() => tr.classList.remove('xd-hl'), 2600); }, 160);
}

/* ---------- Dựng ---------- */
function build() {
  const p1 = document.getElementById('pane-mt1'), p2 = document.getElementById('pane-mt2'), p14 = document.getElementById('pane-mt14');
  if (!p1 || !p2 || !p14 || p1.querySelector('.ov-nav')) return;
  // Tổng quan: Bản tin dữ liệu thay khối cũ (stock-dom.js dựng từ 6 ô số cũ); ô số cũ ẩn.
  $$('#dataBrief').forEach(n => n.remove());
  const db = dataBrief(); if (db) p1.prepend(db);
  $$('.kpis').forEach(k => { if (!k.closest('.pp-pane, .pf-kpis, .fn-pane') && !k.classList.contains('pp-kpis')) { k.hidden = true; k.style.display = 'none'; } });
  const head1 = p1.querySelector(':scope>.sectionhead, :scope>section>.sectionhead');
  const oldBar = p1.querySelector('.pane-subtabs'), oldPanes = $$(':scope>.pane-subpane', p1);
  if (head1) head1.innerHTML = '<div><h2 class="sec">Tổng quan ngành xây dựng · VLXD · đầu tư công</h2><p>Bản đồ ngành → chuỗi giá trị theo mô hình → triển vọng. Doanh nghiệp niêm yết ở tab Tài chính ngành. Thép ở <a href="../Thep/">dashboard Thép</a>.</p></div>';
  const T1 = tabset(p1, 'mt1', 'ov', [['map', '00', 'Bản đồ ngành', 'Chuỗi giá trị ngành'], ['model', '01', 'Chuỗi giá trị theo mô hình', 'Dân dụng · hạ tầng · BOT · vật liệu'], ['forward', '02', 'Triển vọng', 'Mốc dự án sắp tới']], 'ov');
  if (head1 || db) (head1 || db).after(T1.nav); else p1.prepend(T1.nav);
  let anchor = T1.nav;
  [['map', '00 · Chuỗi giá trị ngành', 'Bản đồ ngành', 'Vốn, hợp đồng, vật liệu và tiền đi qua những ai?'], ['model', '01 · Dân dụng · hạ tầng · BOT · vật liệu', 'Chuỗi giá trị theo mô hình', 'Mỗi mô hình kiếm tiền ở khâu nào, vốn bị giữ ở đâu?'], ['forward', '02 · Mốc dự án sắp tới', 'Triển vọng', 'Dự án nào sắp có mốc, ở bước nào?']].forEach(([k, kk, h, q]) => {
    const p = T1.P[k]; p.innerHTML = `<header class="ov-head"><div><span class="ov-k">${esc(kk)}</span><h2>${esc(h)}</h2><p>${esc(q)}</p></div>${k !== 'map' ? '<a href="?ov=map#mt1" data-xd-href="?ov=map#mt1" class="ov-back">← Bản đồ ngành</a>' : ''}</header>`; anchor.after(p); anchor = p; });
  // Tài chính ngành (#mt14)
  p14.append(el('div', 'sectionhead', '<div><h2 class="sec">Tài chính ngành</h2><p>BCTC hợp nhất 17 doanh nghiệp xây dựng, VLXD niêm yết theo bốn mô hình; doanh nghiệp niêm yết, định giá, hợp đồng.</p></div>'));
  const T14 = tabset(p14, 'mt14', 'fin', [['fin', '01', 'Tài chính ngành'], ['companies', '02', 'Doanh nghiệp niêm yết']], 'pp');
  p14.append(T14.nav);
  [['fin', '01', 'Tài chính ngành', 'Doanh thu & biên → phải thu, ứng trước & dở dang → CFO & chuyển đổi tiền → nợ, lãi vay & dòng tiền tự do.'], ['companies', '02', 'Doanh nghiệp niêm yết', 'Định giá → số hợp nhất, thuộc cổ đông mẹ → hợp đồng, backlog → lịch sử theo kỳ, cho từng loại hình doanh nghiệp.']].forEach(([k, n, l, g]) => { T14.P[k].innerHTML = `<header class="pp-head"><div><span class="pp-k">${n}</span><h2>${esc(l)}</h2><p>${esc(g)}</p></div></header>`; if (F) T14.P[k].append(modelBar()); p14.append(T14.P[k]); });
  let finBuilt = false;
  T14.onShow = k => { if (k === 'fin' && !finBuilt && !p14.hidden) { finBuilt = true; try { if (window.XdFinance) XdFinance.build(T14.P.fin); else T14.P.fin.append(gap('không tải được dữ liệu tài chính ngành.')); } catch (e) { LOG('fin:' + e.message); console.error(e); } setTimeout(() => dispatchEvent(new Event('pv:toc')), 120); } };
  new MutationObserver(() => { if (!p14.hidden) { T14.onShow(T14.cur); refit(T14.P[T14.cur]); } }).observe(p14, {attributes: true, attributeFilter: ['hidden', 'class']});
  // Bức tranh ngành (#mt2)
  const head2 = p2.querySelector('.sectionhead'); if (head2) head2.innerHTML = '<div><h2 class="sec">Bức tranh ngành</h2><p>Toàn thị trường → đầu tư công → nhà thầu & BOT → xi măng → đá & cát → nhựa đường → kính & gạch → chính sách. Mỗi tab con chia theo khâu kinh doanh.</p></div>';
  const T2 = tabset(p2, 'mt2', 'section', [['market', '01', 'Toàn thị trường'], ['public', '02', 'Đầu tư công'], ['contractor', '03', 'Nhà thầu & BOT'], ['cement', '04', 'Xi măng'], ['stone', '05', 'Đá & cát'], ['asphalt', '06', 'Nhựa đường'], ['glass', '07', 'Kính & gạch'], ['policy', '08', 'Chính sách']], 'pp');
  const ws = el('div', 'xd-ws'); ws.id = 'xd-workspace'; ws.append(T2.nav);
  const TITLES = {market: 'Toàn thị trường', public: 'Đầu tư công', contractor: 'Nhà thầu & BOT', cement: 'Xi măng', stone: 'Đá & cát', asphalt: 'Nhựa đường', glass: 'Kính & gạch', policy: 'Chính sách'};
  T2.keys.forEach(k => { T2.P[k].innerHTML = `<header class="pp-head"><div><h2>${esc(TITLES[k])}</h2></div></header>`; ws.append(T2.P[k]); });
  (head2 ? head2.after(ws) : p2.prepend(ws));
  // Bảng dự án trọng điểm và timeline cũ (xd-32, xd-73): nội dung đã chuyển vào data/construction/hub.json → bảng dự án chính, mốc sắp tới.
  document.querySelectorAll('[data-block-id="xd-32"], [data-block-id="xd-73"]').forEach(n => n.remove());
  // Nội dung từng tab con (mỗi phần riêng try để một lỗi không làm mất cả trang)
  const run = (name, fn) => { try { fn(); } catch (e) { LOG(name + ':' + e.message); console.error(e); } };
  run('map', () => mapPane(T1.P.map)); run('model', () => modelPane(T1.P.model, p1)); run('forward', () => forwardPane(T1.P.forward));
  run('market', () => marketPane(T2.P.market)); run('public', () => publicPane(T2.P.public)); run('contractor', () => contractorPane(T2.P.contractor));
  run('cement', () => cementPane(T2.P.cement)); run('stone', () => stonePane(T2.P.stone)); run('asphalt', () => asphaltPane(T2.P.asphalt));
  run('glass', () => glassPane(T2.P.glass)); run('policy', () => policyPane(T2.P.policy)); run('companies', () => companiesPane(T14.P.companies));
  run('model', () => setModel(new URL(location.href).searchParams.get('m') || MODEL));
  // Danh mục nguồn và lịch cập nhật (tab Nguồn dữ liệu cũ #mt8): mục thu gọn cuối Bức tranh ngành.
  const p8 = document.getElementById('pane-mt8');
  const src = el('details', 'xd-src-fold'); src.id = 'xd-sources'; src.innerHTML = '<summary>Danh mục nguồn và lịch cập nhật</summary>';
  if (p8) { $$('.pane-subpane', p8).forEach(sp => { const t = document.getElementById(sp.getAttribute('aria-labelledby') || '')?.textContent; if (t) src.append(el('h4', '', esc(t))); [...sp.children].forEach(n => src.append(n)); }); $$('.card,[data-block-id]', p8).forEach(n => src.append(n)); }
  else { const x90 = block('xd-90'); if (x90) src.append(x90); }
  p2.append(src);
  // Phần còn lại của khung cũ: gom vào mục "Nội dung khác" (không xóa) và ghi lại để kiểm.
  const left = [...oldPanes.flatMap(w => [...w.children]), ...$$('#supply-world,#supply-vietnam,#supply-trade,#supply-asphalt,#supply-glass,#supply-build', p2).flatMap(w => [...w.querySelectorAll(':scope .card[data-block-id]')])].filter(n => n.matches?.('.card, [data-block-id]') && !n.closest('.ov-pane, .pp-pane'));
  if (left.length) { const d = el('details', 'research-fold ov-an', '<summary>Nội dung khác</summary>'); left.forEach(n => d.append(n)); T14.P.companies.append(d); document.documentElement.dataset.xdLeftover = left.map(n => n.dataset.blockId || n.className).join(','); }
  oldPanes.forEach(w => w.remove()); oldBar?.remove();
  $$(':scope>.section>.supply-tabs, .supply-tabs', p2).forEach(n => { if (!n.closest('.pp-pane')) { n.hidden = true; n.style.display = 'none'; } });
  $$('#supply-world,#supply-vietnam,#supply-trade,#supply-asphalt,#supply-glass,#supply-build', p2).forEach(n => { n.hidden = true; n.style.display = 'none'; });
  ['mt3', 'mt4', 'mt6', 'mt8', 'mt10'].forEach(k => { const p = document.getElementById('pane-' + k); if (p && !p.querySelector('[data-block-id]')) p.remove(); else if (p) LOG('còn khối ở pane-' + k); });
  // Tìm nhanh: mục của Tài chính ngành (dựng khi mở) có trong chỉ mục ngay từ đầu.
  if (window.SectorSmart && window.XdFinance) XdFinance.sections.forEach(([id, t]) => SectorSmart.index.push({t, sub: 'Tài chính ngành', kind: 'Mục', run: () => { navigate('?fin=fin#mt14', true); setTimeout(() => document.getElementById(id)?.scrollIntoView({block: 'start', behavior: 'instant'}), 400); }}));
  // Click dẫn hướng trong trang
  document.addEventListener('click', e => {
    const pj = e.target.closest('[data-xd-proj]'); if (pj) { e.preventDefault(); openProject(pj.dataset.xdProj); return; }
    const a = e.target.closest('[data-xd-href]'); if (a) { e.preventDefault(); navigate(a.dataset.xdHref, true); return; }
    const j = e.target.closest('[data-xd-jump]'); if (j) { e.preventDefault(); const n = document.getElementById(j.dataset.xdJump); if (n) { n.scrollIntoView({block: 'start', behavior: 'instant'}); } return; }
  });
  document.addEventListener('keydown', e => { if (e.key !== 'Enter' && e.key !== ' ') return; const a = e.target.closest('[role=link][data-xd-href]'); if (a) { e.preventDefault(); navigate(a.dataset.xdHref, true); } });
  // Tab chính: research-layout đổi hash bằng replaceState; ghi thêm mục lịch sử để Back/Forward quay lại đúng tab, tab con.
  document.addEventListener('click', e => { const b = e.target.closest('.majortabs .majortabbtn'); if (!b) return; const before = location.pathname + location.search + location.hash;
    setTimeout(() => { const st = {major: b.dataset.tab, sub: TABS[b.dataset.tab]?.cur}; const now = canonical(st); history.replaceState({xd: 1}, '', before); if (now !== before) history.pushState({xd: 1}, '', now); apply(st); }, 0); }, true);
  addEventListener('popstate', () => apply(parse(location.href)));
  addEventListener('hashchange', () => { const k = location.hash.slice(1); if (LEGACY[k]) navigate(LEGACY[k], false); });
  // Trạng thái đầu: URL hiện tại (gồm link cũ)
  const st0 = parse(location.href);
  Object.values(TABS).forEach(t => t.show(t.major === st0.major && st0.sub ? st0.sub : t.keys[0]));
  if (st0.sub || st0.g || LEGACY[location.hash.slice(1)]) history.replaceState({xd: 1}, '', canonical(st0));
  apply(st0);
  // Trang còn ẩn trong lượt dựng (sector-boot.js): cuộn tới nhóm của link sau khi trang hiện.
  // Trình duyệt không tự khôi phục vị trí cuộn cũ (sẽ đè lên vị trí của link nhóm, dòng dự án).
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (st0.g) addEventListener('sector:ready', () => setTimeout(() => scrollG(st0.g, st0.major), 350), {once: true});
  window.XdFrame = {go: href => navigate(href, true), openProject, tabs: TABS};
  document.documentElement.dataset.xdReady = '1';
}
SectorBoot.add(950, () => { try { build(); } catch (e) { LOG('build:' + e.message); console.error(e); } });
})();
