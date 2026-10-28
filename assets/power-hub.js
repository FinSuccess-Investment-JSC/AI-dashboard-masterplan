/* Điện · lớp "thông minh" (28/10/2026): bảng điều khiển ngành (nhóm × yếu tố), ngăn trượt theo mã,
   dòng kết luận số (mục lục, tìm nhanh và bắt click mã nằm ở sector-smart.js) ở đầu khối dữ liệu. Chỉ đọc số đã có trên trang;
   chiều tác động lấy theo thẻ "Doanh nghiệp kiếm tiền thế nào" và kết luận ở tab Catalyst. */
(() => {
'use strict';
if (document.body.dataset.sector !== 'power') return;
const src = window.SECTOR_DAILY?.sources || {};
// company-valuation.js tải sau file này, nên đọc định giá lúc cần.
const V = new Proxy({}, {get: (_, k) => window.COMPANY_VALUATION?.companies?.[k]});
const nf = (v, d = 1) => v == null || !isFinite(v) ? '—' : Number(v).toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d});
const sg = (v, d = 1) => (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), d);
const dm = d => d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const fold = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
const rec = k => (src[k]?.records || []);

/* ---------- Điều hướng chung: mở đúng tab, tab con rồi cuộn tới ---------- */
function goTo(target) {
  if (!target) return;
  const pane = target.closest('.majorpane');
  if (pane && !pane.classList.contains('active')) document.querySelector(`.majortabbtn[data-tab="${pane.dataset.tab}"]`)?.click();
  for (let k = 0; k < 4; k++) {
    const h = target.closest('[hidden]'); if (!h) break;
    const b = document.getElementById(h.getAttribute('aria-labelledby') || ''); if (!b) break; b.click();
  }
  setTimeout(() => {
    target.scrollIntoView({behavior: 'smooth', block: 'start'});
    target.classList.remove('pv-flash'); void target.offsetWidth; target.classList.add('pv-flash');
  }, 220);
}
const block = id => document.querySelector(`[data-block-id="${id}"]`);
const byTitle = re => [...document.querySelectorAll('.chart-title')].find(t => re.test(t.textContent))?.closest('.card');

/* ---------- Yếu tố ngành: trạng thái hiện tại tính từ dữ liệu ---------- */
const chg = (k, n) => { const r = rec(k).filter(x => isFinite(x.value)); if (r.length <= n) return null; return {now: r.at(-1).value, pct: (r.at(-1).value / r.at(-1 - n).value - 1) * 100, date: r.at(-1).date}; };
function inflowYoY() {
  const H = window.HYDRO_RESERVOIRS?.monthly || [], by = {};
  H.forEach(r => (by[r.reservoir] ||= []).push(r));
  const v = Object.values(by).map(rs => { rs.sort((a, b) => a.month < b.month ? -1 : 1); const c = rs.filter(r => r.inflow_n >= 7).at(-1); if (!c) return null; const l = rs.find(r => r.month === (+c.month.slice(0, 4) - 1) + c.month.slice(4)); return l?.inflow > 0 ? {m: c.month, y: (c.inflow / l.inflow - 1) * 100} : null; }).filter(Boolean);
  const m = v.map(x => x.m).sort().at(-1), ys = v.filter(x => x.m === m).map(x => x.y).sort((a, b) => a - b);
  return ys.length ? {med: ys[Math.floor(ys.length / 2)], low: ys.filter(y => y < 0).length, n: ys.length, month: m} : null;
}
function load30() {
  const r = rec('vn_power_daily').filter(x => x.output_mkwh > 0), map = new Map(r.map(x => [x.date, x.output_mkwh]));
  let a = 0, b = 0, n = 0;
  r.slice(-30).forEach(x => { const p = map.get((+x.date.slice(0, 4) - 1) + x.date.slice(4)); if (p) { a += x.output_mkwh; b += p; n++; } });
  return n >= 15 ? {pct: (a / b - 1) * 100, sum: r.slice(-30).reduce((s, x) => s + x.output_mkwh, 0) / 1000, n} : null;
}
const oniLast = rec('enso_oni').filter(x => isFinite(x.oni)).at(-1);
const F = [
  {id: 'coal', name: 'Giá than', d: chg('coal_newcastle', 63), th: 3, fmt: d => `${nf(d.now, 0)} USD/t · ${sg(d.pct)}% 3T`, go: () => block('fast-price') || byTitle(/Than Newcastle/)},
  {id: 'lng', name: 'Giá LNG', d: chg('lng_jkm', 63), th: 5, fmt: d => `${nf(d.now, 1)} USD · ${sg(d.pct)}% 3T`, go: () => byTitle(/khí & LNG/i)},
  {id: 'water', name: 'Nước về hồ', d: (() => { const x = inflowYoY(); return x && {pct: x.med, ...x}; })(), th: 10, fmt: d => `${sg(d.pct, 0)}% so cùng kỳ`, go: () => block('dien-hydro-reservoirs')},
  {id: 'enso', name: 'El Niño', d: oniLast && {pct: oniLast.oni, now: oniLast.oni}, th: .5, fmt: d => `ONI ${sg(d.now, 2)}`, go: () => block('dien-04')},
  {id: 'load', name: 'Phụ tải', d: load30(), th: 2, fmt: d => `${sg(d.pct)}% 30 ngày`, go: () => block('dien-06')}
];
F.forEach(f => f.s = !f.d ? 0 : f.d.pct >= f.th ? 1 : f.d.pct <= -f.th ? -1 : 0);
// Cách đọc trạng thái hiện tại của từng yếu tố (dùng trong câu "thuận vì…").
const SAY = {coal: ['than rẻ đi', 'than đắt lên'], lng: ['LNG rẻ đi', 'LNG đắt lên'], water: ['nước về ít', 'nước về nhiều'], enso: ['La Niña', 'El Niño mạnh'], load: ['phụ tải giảm', 'phụ tải tăng']};
F.forEach(f => f.say = f.s ? SAY[f.id][f.s > 0 ? 1 : 0] : f.name + ' đi ngang');
// Tác động lên lãi khi yếu tố TĂNG: +1 thuận, −1 nghịch, 0 không đáng kể.
const G = [
  {id: 'coalplant', name: 'Nhiệt điện than & khí', c: '#3d4653', codes: ['POW', 'NT2', 'PPC', 'QTP', 'HND', 'BTP'], e: {coal: -1, lng: -1, water: -1, enso: 1, load: 1}},
  {id: 'hydro', name: 'Thủy điện', c: '#2938A8', codes: ['REE', 'VSH', 'CHP', 'SBA', 'TMP', 'SHP'], e: {coal: 1, lng: 1, water: 1, enso: -1, load: 1}},
  {id: 're', name: 'Năng lượng tái tạo', c: '#2a9fa3', codes: ['GEG', 'HDG', 'TTA'], e: {coal: 0, lng: 0, water: 0, enso: 0, load: 1}},
  {id: 'build', name: 'Xây lắp & thiết bị lưới', c: '#b8801f', codes: ['PC1', 'TV2', 'GEX'], e: {coal: 0, lng: 0, water: 0, enso: 0, load: 1}}
];
G.forEach(g => g.score = F.reduce((a, f) => a + g.e[f.id] * f.s, 0));
const groupOf = code => G.find(g => g.codes.includes(code));
const cellHTML = (g, f) => { const v = g.e[f.id] * f.s; return `<button type="button" class="pv-mx-c ${v > 0 ? 'pos' : v < 0 ? 'neg' : 'neu'}" data-f="${f.id}" title="${f.name}${f.d ? ': ' + f.fmt(f.d) : ''} → ${v > 0 ? 'thuận' : v < 0 ? 'nghịch' : 'không đáng kể'} cho ${g.name}">${v > 0 ? '▲' : v < 0 ? '▼' : '·'}</button>`; };

/* ---------- 1. Bảng điều khiển ngành ---------- */
function hub() {
  const tabs = document.querySelector('.majortabs'); if (!tabs || document.querySelector('.pv-hub')) return;
  const verdict = document.querySelector('.cr-verdict h3')?.textContent.trim();
  const why = g => { const by = k => F.filter(f => g.e[f.id] * f.s === k).map(f => f.say); return {pos: by(1), neg: by(-1)}; };
  const lines = G.map(g => ({g, ...why(g)})).filter(x => x.pos.length || x.neg.length);
  const h = el('section', 'pv-hub');
  h.innerHTML = `<div class="pv-hub-head"><div><span class="pv-hub-k">Ngành điện hôm nay</span>
      <h2>${verdict || 'Ngành điện hôm nay'}</h2>
      <ul class="pv-hub-why">${lines.filter(x => x.pos.length && x.neg.length).map(x => `<li><b style="--c:${x.g.c}">${x.g.name}</b><span class="up">▲ ${x.pos.join(', ')}</span><span class="dn">▼ ${x.neg.join(', ')}</span></li>`).join('')}</ul>
      ${verdict ? '<a href="#" class="pv-to-cat">Xem lập luận ở Catalyst →</a>' : ''}</div>
      <div class="pv-hub-tools"><button type="button" class="pv-open-search">Tìm nhanh <kbd>⌘K</kbd></button></div></div>
    <div class="pv-mx" style="--nf:${F.length}">
      <div class="pv-mx-corner">Nhóm \\ yếu tố</div>
      ${F.map(f => `<button type="button" class="pv-mx-f" data-f="${f.id}"><b>${f.name}</b><span class="${f.s > 0 ? 'up' : f.s < 0 ? 'dn' : ''}">${f.d ? (f.s > 0 ? '▲ ' : f.s < 0 ? '▼ ' : '') + f.fmt(f.d) : '—'}</span></button>`).join('')}
      <div class="pv-mx-score">Thuận / nghịch</div>
      ${G.map(g => `<button type="button" class="pv-mx-g" data-g="${g.id}" style="--c:${g.c}"><i></i>${g.name}<small>${g.codes.join(' · ')}</small></button>${F.map(f => cellHTML(g, f)).join('')}<div class="pv-mx-s"><span class="pos">${why(g).pos.length}▲</span><span class="neg">${why(g).neg.length}▼</span></div>`).join('')}
    </div>
    <details class="note-icon"><summary>ⓘ Cách chấm</summary><div>Mỗi yếu tố được xếp tăng ▲ / giảm ▼ / đi ngang theo ngưỡng: giá than ±3% và LNG ±5% trong 3 tháng (≈63 phiên), nước về hồ ±10% so cùng kỳ (trung vị các hồ, tháng mới nhất), ONI ±0,5 (El Niño/La Niña), sản lượng 30 ngày ±2% so cùng kỳ. Chiều tác động lấy theo thẻ "Doanh nghiệp kiếm tiền thế nào": ví dụ than đắt bất lợi cho nhiệt điện khi giá chưa chuyển ngang, nhưng kéo giá thị trường lên có lợi cho thủy điện. Ô xanh = đang thuận, đỏ = đang nghịch. Số ▲/▼ chỉ đếm yếu tố đang thuận/nghịch, không phải dự báo lợi nhuận.</div></details>`;
  tabs.before(h);
  h.querySelectorAll('[data-f]').forEach(b => b.addEventListener('click', () => goTo(F.find(f => f.id === b.dataset.f).go())));
  h.querySelectorAll('.pv-mx-g').forEach(b => b.addEventListener('click', () => drawer(null, b.dataset.g)));
  h.querySelector('.pv-to-cat')?.addEventListener('click', e => { e.preventDefault(); goTo(document.querySelector('.cr-verdict')); });
  h.querySelector('.pv-open-search').addEventListener('click', () => window.SectorSmart?.palette(true));
}

/* ---------- 2. Ngăn trượt theo mã / nhóm ---------- */
let dr = null;
function drawer(code, gid) {
  if (!dr) {
    dr = el('aside', 'pv-drawer'); dr.setAttribute('aria-label', 'Chi tiết'); dr.tabIndex = -1;
    document.body.append(dr, Object.assign(el('div', 'pv-scrim'), {onclick: () => close()}));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }
  const close = () => document.body.classList.remove('pv-drawer-open');
  const g = gid ? G.find(x => x.id === gid) : groupOf(code); if (!g) return;
  const row = code && document.querySelector(`[data-block-id="dien-03"] tr[data-code="${code}"]`);
  const v = code && V[code];
  const mx = `<div class="pv-dr-mx">${F.map(f => { const s = g.e[f.id] * f.s; return `<button type="button" data-f="${f.id}" class="${s > 0 ? 'pos' : s < 0 ? 'neg' : 'neu'}"><b>${f.name}</b><span>${f.d ? f.fmt(f.d) : '—'}</span><em>${s > 0 ? '▲ thuận' : s < 0 ? '▼ nghịch' : g.e[f.id] ? '· đi ngang' : '· ít liên quan'}</em></button>`; }).join('')}</div>`;
  // Các khối khác trên trang có nhắc tới mã này.
  const seen = new Set(), hits = !code ? [] : [...document.querySelectorAll('.majorpane .card, .majorpane .business-model, .cr-verdict')].filter(c => {
    if (c.closest('[data-block-id="dien-03"]') || c.closest('.financial-comparison') || !new RegExp(`\\b${code}\\b`).test(c.textContent)) return false;
    const t = (c.querySelector('.chart-title, h3, h2')?.textContent || '').trim(); if (!t || seen.has(t)) return false; seen.add(t); return true;
  }).slice(0, 8);
  dr.innerHTML = `<header style="--c:${g.c}"><div>${code ? `<span class="pv-chip" style="--c:${g.c}">${code}</span>` : ''}<h3>${code ? g.name : g.name}</h3></div><button type="button" class="pv-x" aria-label="Đóng">✕</button></header>
    ${v ? `<div class="pv-dr-stats"><div><b>${nf(v.close, 2)}</b><span>giá (nghìn đ)</span></div><div><b>${nf(v.market_cap / 1000, 1)}</b><span>vốn hóa (nghìn tỷ)</span></div><div><b>${v.pe > 0 ? nf(v.pe, 1) + 'x' : '—'}</b><span>P/E</span></div><div><b>${v.pb > 0 ? nf(v.pb, 2) + 'x' : '—'}</b><span>P/B</span></div></div>
      <div class="pv-dr-src">Phiên ${dm(v.date)} · <a href="${v.source_url}" target="_blank" rel="noopener">VNDirect dstock</a></div>` : ''}
    <h4>Đang chịu tác động thế nào</h4>${mx}
    ${row ? `<h4>Tài sản chính</h4><p>${row.cells[1].innerHTML}</p><h4>Biến lợi nhuận</h4><div class="pv-co-tags">${row.cells[2].textContent.split(/;\s*/).filter(Boolean).map(t => `<span>${t}</span>`).join('')}</div><h4>Sự kiện 2025–26</h4><p class="${row.cells[3].querySelector('mark') ? 'pv-key-ev' : ''}">${row.cells[3].innerHTML}</p>` : ''}
    ${!code ? `<h4>Mã trong nhóm</h4><div class="pv-dr-codes">${g.codes.map(k => `<button type="button" class="pv-chip" style="--c:${g.c}" data-code="${k}">${k}${V[k] ? ` <small>${V[k].pe > 0 ? nf(V[k].pe, 1) + 'x' : ''}</small>` : ''}</button>`).join('')}</div>` : ''}
    ${hits.length ? `<h4>Nhắc tới ở</h4><div class="pv-dr-links">${hits.map((c, i) => `<button type="button" data-hit="${i}">${(c.querySelector('.chart-title, h3, h2').textContent || '').trim().slice(0, 70)} <span>→</span></button>`).join('')}</div>` : ''}
    ${code ? `<button type="button" class="pv-dr-cmp">So sánh tài chính ${code} với cả ngành →</button>` : ''}`;
  dr.querySelector('.pv-x').onclick = close;
  dr.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { close(); goTo(F.find(f => f.id === b.dataset.f).go()); });
  dr.querySelectorAll('[data-hit]').forEach(b => b.onclick = () => { close(); goTo(hits[+b.dataset.hit]); });
  dr.querySelectorAll('.pv-dr-codes [data-code]').forEach(b => b.onclick = () => drawer(b.dataset.code));
  dr.querySelector('.pv-dr-cmp')?.addEventListener('click', () => {
    close(); const sec = document.querySelector('.financial-comparison'); goTo(sec);
    const inp = sec?.querySelector('input[type="search"], input[type="text"]'); if (inp) { inp.value = code; inp.dispatchEvent(new Event('input', {bubbles: true})); }
  });
  document.body.classList.add('pv-drawer-open'); dr.focus();
}
/* ---------- 3. Mục lục + tìm nhanh: dùng assets/sector-smart.js, chỉ đăng ký thêm yếu tố/nhóm và ngăn riêng ---------- */
function register() {
  const S = window.SectorSmart; if (!S) return;
  S.openCode = code => { if (!groupOf(code)) return false; drawer(code); return true; };
  S.index.push(...F.map(f => ({t: f.name, sub: f.d ? f.fmt(f.d) : '', kind: 'Yếu tố', run: () => goTo(f.go())})),
    ...G.map(g => ({t: g.name, sub: g.codes.join(' · '), kind: 'Nhóm', run: () => drawer(null, g.id)})));
}

/* ---------- 4. Dòng kết luận số ở đầu khối dữ liệu ---------- */
function keys() {
  const put = (card, html) => { if (!card || card.querySelector('.pv-key')) return; const t = card.querySelector('.chart-sub') || card.querySelector('.chart-title'); t?.after(el('div', 'pv-key', html)); };
  const ld = F.find(f => f.id === 'load').d, w = F.find(f => f.id === 'water').d, coal = F.find(f => f.id === 'coal').d, lng = F.find(f => f.id === 'lng').d;
  if (ld) put(block('dien-06'), `<b class="${ld.pct >= 0 ? 'up' : 'dn'}">${sg(ld.pct)}%</b> sản lượng 30 ngày gần nhất so cùng kỳ <span>${nf(ld.sum, 1)} tỷ kWh</span>`);
  if (w) put(block('dien-hydro-reservoirs'), `<b class="${w.med >= 0 ? 'up' : 'dn'}">${sg(w.med, 0)}%</b> nước về hồ tháng ${+w.month.slice(5)}/${w.month.slice(0, 4)} so cùng kỳ (trung vị) <span>${w.low}/${w.n} hồ thấp hơn năm trước</span>`);
  if (oniLast) {
    const o = rec('enso_oni').filter(x => isFinite(x.oni)), prev = [...o].slice(0, -1).reverse().find(x => x.oni >= oniLast.oni);
    put(block('dien-04'), `<b class="${oniLast.oni >= .5 ? 'dn' : ''}">${sg(oniLast.oni, 2)}</b> ONI ${oniLast.season} ${oniLast.year}${prev ? ` <span>cao nhất kể từ ${prev.season} ${prev.year}</span>` : ''}`);
  }
  if (coal) put(block('fast-price') || byTitle(/Than Newcastle/), `<b class="${coal.pct >= 0 ? 'up' : 'dn'}">${sg(coal.pct)}%</b> giá than 3 tháng <span>${nf(coal.now, 1)} USD/tấn · ${dm(coal.date)}</span>`);
  if (lng) put(byTitle(/khí & LNG/i), `<b class="${lng.pct >= 0 ? 'up' : 'dn'}">${sg(lng.pct)}%</b> LNG JKM 3 tháng <span>${nf(lng.now, 2)} USD/MMBtu · ${dm(lng.date)}</span>`);
  const pm = rec('vn_power_daily').filter(x => x.pmax_mw > 0), y = pm.at(-1)?.date.slice(0, 4);
  if (y) {
    const mx = a => a.reduce((m, x) => x.pmax_mw > m.pmax_mw ? x : m, a[0]), a = mx(pm.filter(x => x.date.startsWith(y))), b = pm.filter(x => x.date.startsWith(+y - 1 + '')); const bm = b.length && mx(b);
    put(block('dien-09'), `<b>${nf(a.pmax_mw, 0)} MW</b> Pmax ${y} theo bản tin ngày (${dm(a.date).slice(0, 5)})${bm ? ` <span class="${a.pmax_mw >= bm.pmax_mw ? 'up' : 'dn'}">${sg((a.pmax_mw / bm.pmax_mw - 1) * 100)}% so đỉnh ${+y - 1}</span>` : ''}`);
  }
}

function run() { register(); hub(); keys(); }
if (document.readyState === 'complete') setTimeout(run, 600); else addEventListener('load', () => setTimeout(run, 600));
})();
