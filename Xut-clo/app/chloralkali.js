/* Dashboard ngành Xút – Clo (Xut-clo/, route chloralkali), dựng 26/11/2026 theo khung trang Điện (component chép qua gói Phân bón).
   - Tổng quan ngành: Bản tin dữ liệu; 00 Chuỗi giá trị (đầu vào → điện phân → sản phẩm gốc clo → ngành dùng); 01 Doanh nghiệp niêm yết.
   - Bức tranh ngành theo câu hỏi đầu tư: 01 Nhập khẩu & giá → 02 Công suất nội địa → 03 Nghi Sơn & đầu ra gốc clo → 04 Chi phí đầu vào → 05 Giá P4 (27/11/2026, ngành đổi tên P4 – Xút – Clo).
   - Tài chính ngành: app/chloralkali-finance.js (BCTC hợp nhất CSV, HVT, DGC). Chủ đề nóng: app/chloralkali-news.js.
   Dữ liệu: window.XC_DATA (scripts/build_chloralkali.py). Chỉ mô tả dữ liệu; số chưa xác minh để trống.
   28/11/2026 khung chuẩn Điện (DASHBOARD_WORKFLOW.md §42): Tổng quan 00 Bản đồ ngành (bản đồ nhà máy xc-02, app/vn-geo.js) · 01 Chuỗi giá trị (xc-01);
   Bức tranh: 02–05 có thanh luồng và tiêu đề khâu, mỗi câu hỏi có .pp-main → .pp-sup1 → .pp-more (mainify); xc-90 chỉ còn một thẻ (03, câu cuối), 01 có thẻ dẫn;
   Tài chính ngành #mt14 (link cũ #mt3): 01 Tài chính ngành · 02 Doanh nghiệp niêm yết (xc-04 dời từ Tổng quan + app/listed-compare.js) · 03 Định giá (app/peer-valuation.js). */
(() => {
'use strict';
const D = window.XC_DATA;
if (!D) return;
const F = D.fin;
const E = F && window.IndustryFin ? IndustryFin.create(F) : null;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fin = v => typeof v === 'number' && Number.isFinite(v);
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const nf = (v, d = 0) => fin(v) ? v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}) : '–';
const sg = (v, d = 1) => fin(v) ? (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), d) : '–';
const mL = ym => `T${+ym.slice(5, 7)}/${ym.slice(0, 4)}`;
const qL = p => `Q${p.slice(5)}/${p.slice(0, 4)}`;
const dL = d => d.slice(0, 10).split('-').reverse().join('/');
const C = {navy: '#1D2678', blue: '#2938A8', teal: '#2a9fa3', gold: '#c98a00', plum: '#861C52', grey: '#3d4653', sky: '#8997D6', slate: '#5a6682', bronze: '#b8801f'};
const SRC = {vnd: '<a href="https://api-finfo.vndirect.com.vn/v4/financial_statements" target="_blank" rel="noopener">BCTC hợp nhất theo quý (VNDirect finfo)</a>'};

/* ---------- thẻ chart (cùng cấu trúc thẻ của Điện) ---------- */
function card(id, title, o = {}) {
  const c = el('div', 'card pp-card fs-share-host' + (o.cls ? ' ' + o.cls : ''));
  c.dataset.blockId = id; c.dataset.updateKind = o.kind || 'public'; c.dataset.cadence = o.cadence || 'monthly'; c.dataset.refreshStatus = 'loaded';
  c.innerHTML = `<div class="chart-title">${esc(title)}${o.info ? '<button class="chart-info-button fb-info-btn" type="button" aria-expanded="false" aria-label="Cách đọc, cách tính">ⓘ</button>' : ''}</div>`
    + (o.sub ? `<div class="chart-sub">${o.sub}</div>` : '') + (o.info ? `<div class="fb-info" hidden>${o.info}</div>` : '')
    + `<div class="pp-host" id="${id}-host"></div><div class="pw-src">Nguồn: ${o.source || ''}</div>` + (o.note ? `<div class="pw-src-note">${esc(o.note)}</div>` : '');
  const b = c.querySelector('.fb-info-btn');
  if (b) b.addEventListener('click', () => { const i = c.querySelector('.fb-info'); i.hidden = !i.hidden; b.setAttribute('aria-expanded', String(!i.hidden)); });
  return {el: c, host: c.querySelector('.pp-host')};
}
function chart(host, key, categories, series, o = {}) {
  const model = {key, categories, series: series.map(s => ({...s, values: s.values.map(v => fin(v) ? Math.round(v * 100) / 100 : null)})), unit: o.unit || '', digits: o.digits ?? 0,
    stackable: !!o.stackable, native: o.native || 'line', zeroBase: o.zeroBase !== false, aria: o.aria || key};
  if (o.native === 'line' || !o.native) model.series.forEach(s => { s.kind = s.kind || 'line'; });
  if (!window.ChartTypes) return;
  ChartTypes.mount(host, model, () => { host.innerHTML = ChartTypes.render(model, model.native); });
}
const panel = (num, q, sub) => el('section', 'pp-panel pp-q', `<header class="pp-ph"><span class="pp-num">${num}</span><div><h3>${esc(q)}</h3>${sub ? `<p>${sub}</p>` : ''}</div></header>`);
const two = (...cards) => { const g = el('div', 'grid two g2'); cards.forEach(c => g.append(c.el || c)); return g; };
// Ô KPI có đường nhỏ (giống hàng KPI đầu sub-tab của Điện).
function kpi(label, value, unit, delta, sub, spark, color) {
  const k = el('div', 'kpi pp-kpi', `<div class="label l">${esc(label)}</div><div class="value v">${value}${unit ? `<small> ${esc(unit)}</small>` : ''}</div><div class="delta pp-neutral">${delta || ''}</div><div class="sub s">${sub || ''}</div><div class="fb-spark"></div>`);
  if (spark && window.ChartTypes) requestAnimationFrame(() => ChartTypes.spark(k.querySelector('.fb-spark'), spark, color || C.blue));
  return k;
}
const kpiRow = items => { const g = el('section', 'grid kpis pp-kpis'); items.forEach(i => g.append(i)); return g; };

/* =========================== dữ liệu nhập khẩu =========================== */
const T = D.trade || {}, FP = D.fpts || {}, PL = D.plants || {}, IN = D.inputs || {};
const CODE = {solid: '281511', liquid: '281512'}, FORM = {solid: 'Xút rắn (HS 281511)', liquid: 'Xút dung dịch (HS 281512)'};
const PC = {'Trung Quốc': '#2938A8', 'Đài Loan': '#8997D6', 'Nhật Bản': '#c98a00', 'Hàn Quốc': '#2a9fa3', 'Thái Lan': '#861C52', 'Ấn Độ': '#dd7f4e', 'Khác': '#9aa1b2'};
const rec = (kind, p, form) => (T[kind] || {})[`${p}|${CODE[form]}`] || null;
const years = kind => [...new Set(Object.keys(T[kind] || {}).map(k => k.split('|')[0]))].filter(p => rec(kind, p, 'solid')?.t != null || rec(kind, p, 'liquid')?.t != null).sort();
const ymL = p => `T${+p.slice(4)}/${p.slice(0, 4)}`;
// Đơn giá bình quân tính lại từ tổng trị giá ÷ tổng lượng (không bình quân các đơn giá).
const price = rs => { const ok = rs.filter(r => r && r.t && r.usd != null); const t = ok.reduce((s, r) => s + r.t, 0), u = ok.reduce((s, r) => s + r.usd, 0); return ok.length === rs.length && t ? u / t : null; };
const SRC_TR = '<a href="https://comtradeplus.un.org/" target="_blank" rel="noopener">UN Comtrade</a> (Việt Nam báo cáo nhập khẩu); tự tính đơn giá = trị giá ÷ lượng';
const SRC_MR = '<a href="https://comtradeplus.un.org/" target="_blank" rel="noopener">UN Comtrade</a> (số liệu đối tác: nước xuất khẩu báo cáo xuất sang Việt Nam)';
const SRC_FPTS = 'FPTS, báo cáo định giá DGC công bố 10/05/2024';
const srcList = arr => (arr || []).filter(s => s && (s.title || s.url)).map(s => s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title || s.url)}</a>${s.published ? ' · ' + esc(String(s.published)) : ''}` : esc(s.title) + (s.published ? ' · ' + esc(String(s.published)) : '')).join('; ');

/* =========================== TỔNG QUAN =========================== */
function brief() {
  const host = $('#dataBrief'); if (!host) return;
  const ya = years('vn_annual'), y = ya.at(-1), my = years('mirror_annual').at(-1);
  const s = rec('vn_annual', y, 'solid'), l = rec('vn_annual', y, 'liquid'), ms = rec('mirror_annual', my, 'solid'), ml = rec('mirror_annual', my, 'liquid');
  const s0 = rec('vn_annual', String(y - 1), 'solid'), l0 = rec('vn_annual', String(y - 1), 'liquid');
  const pct = (a, b) => a && b ? (a / b - 1) * 100 : null;
  const tar = (IN.tariffs || []).at(-1);
  const lead = `Việt Nam báo cáo nhập ${nf(s.t / 1000, 1)} nghìn tấn xút rắn và ${nf(l.t / 1000, 1)} nghìn tấn xút dung dịch năm ${y}; đơn giá nhập khẩu bình quân ${nf(s.price)} và ${nf(l.price)} USD/tấn. `
    + `Số liệu đối tác năm ${my}: ${nf(ms.t / 1000, 1)} và ${nf(ml.t / 1000, 1)} nghìn tấn. Dự án xút – clo Nghi Sơn của DGC (50 nghìn tấn NaOH/năm) dự kiến chạy dây chuyền xút Q4/2026.` + (D.p4?.monthly?.length ? ` Giá phốt pho vàng (P4) giao ngay Trung Quốc ${dL(D.p4.monthly.at(-1).date)}: ${nf(D.p4.monthly.at(-1).value)} CNY/tấn.` : '');
  const tiles = [
    [`Nhập xút rắn ${y}`, nf(s.t / 1000, 1), 'nghìn tấn', `${sg(pct(s.t, s0?.t))}% so năm trước`, years('vn_annual').map(p => rec('vn_annual', p, 'solid')?.t), C.blue, 'UN Comtrade'],
    [`Nhập xút dung dịch ${y}`, nf(l.t / 1000, 1), 'nghìn tấn', `${sg(pct(l.t, l0?.t))}% so năm trước`, years('vn_annual').map(p => rec('vn_annual', p, 'liquid')?.t), C.teal, 'UN Comtrade'],
    [`Đơn giá nhập khẩu xút rắn ${y}`, nf(s.price), 'USD/tấn', `${sg(pct(s.price, s0?.price))}% so năm trước`, years('vn_annual').map(p => rec('vn_annual', p, 'solid')?.price), C.gold, 'UN Comtrade; tự tính'],
    ['Giá điện bình quân', tar ? nf(tar.avg_price, 0) : 'N/A', 'đ/kWh', tar ? `từ ${dL(tar.effective)} · ${esc(tar.decision)}` : '', (IN.tariffs || []).map(t => t.avg_price), C.grey, 'Bộ Công Thương']];
  host.innerHTML = `<div class="db-l"><div class="db-k"><span class="db-dot"></span>Bản tin dữ liệu</div><div class="db-tk">P4 – Xút – Clo</div><p class="db-lead">${esc(lead)}</p></div><div class="db-r"></div>`;
  tiles.forEach(([t2, v, un, s2, sp, col, src]) => {
    const c = el('div', 'db-c card', `<div class="db-ch">${esc(t2)}</div><div class="db-v">${v}<span class="db-u">${esc(un)}</span></div><div class="db-s">${s2}</div><div class="db-spark"></div><div class="pw-src">Nguồn: ${esc(src)}</div>`);
    host.querySelector('.db-r').append(c);
    if (window.ChartTypes) requestAnimationFrame(() => ChartTypes.spark(c.querySelector('.db-spark'), sp.filter(fin), col));
  });
}
// Sơ đồ kinh tế xút – clo: đầu vào → điện phân → xút, clo, hydro → sản phẩm gốc clo → ngành dùng.
function chain(host) {
  const col = (title, items, cls) => `<div class="xc-col ${cls || ''}"><div class="xc-col-h">${title}</div>${items.map(([t, s]) => `<div class="xc-box"><b>${t}</b>${s ? `<small>${s}</small>` : ''}</div>`).join('')}</div>`;
  const arrow = '<div class="xc-arr" aria-hidden="true">→</div>';
  const c = el('div', 'card'); c.dataset.blockId = 'xc-01'; c.dataset.updateKind = 'static'; c.dataset.cadence = 'rare';
  c.innerHTML = `<div class="chart-title">Chuỗi giá trị xút – clo</div><div class="chart-sub">Điện phân dung dịch muối sinh ra xút và clo cùng lúc (sản phẩm đồng hành); clo được chuyển thành sản phẩm gốc clo để bán</div>
    <div class="xc-chain">${col('Đầu vào', [['Muối công nghiệp (NaCl)', 'chủ yếu nhập khẩu Ấn Độ, Trung Quốc; hạn ngạch HS 2501'], ['Điện năng', '~50% giá thành xút (ước tính FPTS 2024)'], ['Đá vôi, nhôm hydroxit, axit photphoric', 'cho sản phẩm gốc clo']])}${arrow}
    ${col('Điện phân màng', [['NaOH (xút)', 'dung dịch 32–50%, xút rắn'], ['Cl₂ (clo)', 'đi cùng xút'], ['H₂ (hydro)', 'dùng cho HCl']], 'xc-mid')}${arrow}
    ${col('Sản phẩm gốc clo', [['HCl, Javen (NaClO)', ''], ['PAC (polyaluminium chloride)', ''], ['Bột tẩy Ca(OCl)₂, Chloramin B', ''], ['Clo lỏng, CaCl₂, PCl₃/H₃PO₃', '']])}${arrow}
    ${col('Ngành dùng', [['Giấy, dệt nhuộm', 'xút, Javen'], ['Alumin, luyện kim', 'xút, HCl'], ['Xử lý nước', 'PAC, bột tẩy, Javen'], ['Thực phẩm, chất tẩy rửa', 'xút'], ['PVC', 'AGC Phú Mỹ dùng VCM nhập khẩu, không dùng clo nội địa']])}</div>
    <div class="pw-src">Nguồn: ${SRC_FPTS} (tr. 20–22); ${srcList((PL.pvc || []).flatMap(x => x.sources || []).slice(0, 1))}</div>`;
  host.append(c);
}
function overview() {
  const pane = $('#xc-ov-map'), cp = $('#xc-ov-chain');
  if (pane) { const s0 = el('section', 'ov-sec', `<header class="ov-sh"><span class="ov-num">0.1</span><div><h3>Nhà máy xút – clo nằm ở đâu, của ai, bán ra hay dùng nội bộ?</h3></div></header>`); pane.append(s0); plantMap(s0); }
  if (cp) { const s1 = el('section', 'ov-sec', `<header class="ov-sh"><span class="ov-num">1.1</span><div><h3>Xút và clo đi từ đâu, tới ngành nào?</h3></div></header>`); cp.append(s1); chain(s1); }
}
// Bản đồ nhà máy xút – clo (28/11/2026): vị trí ước lượng theo địa danh (data/chloralkali/plants.json), kích thước = công suất NaOH, màu = phân loại bán ra / nội bộ / dự án.
// Đường viền Việt Nam: app/vn-geo.js (Natural Earth, chép từ gói Phân bón). Nhà máy chưa có số công suất vẽ chấm nhỏ, ghi "chưa có số".
function plantMap(host) {
  const G = window.VN_GEO, plants = (PL.plants || []).filter(x => x.location && fin(x.location.lat) && fin(x.location.lon));
  const c = el('div', 'card xc-map-card'); c.dataset.blockId = 'xc-02'; c.dataset.updateKind = 'document'; c.dataset.cadence = 'event';
  const klass = x => { const k = x.classification || ''; return /dự kiến/.test(k) ? 'project' : /^captive/.test(k) ? 'captive' : /^merchant/.test(k) ? 'merchant' : 'unknown'; };
  const CL = {merchant: ['Bán ra thị trường', '#2938A8'], captive: ['Chủ yếu dùng nội bộ', '#9aa1b2'], project: ['Dự án (chưa vận hành)', '#c98a00'], unknown: ['Chưa rõ', '#b9c0dc']};
  const asOf = plants.map(x => String(x.as_of || '')).filter(Boolean).sort().at(-1) || '';
  if (!G || !plants.length) { c.innerHTML = '<div class="chart-title">Bản đồ nhà máy xút – clo</div><p class="xc-na">Chưa có dữ liệu: chưa nạp được đường viền bản đồ (app/vn-geo.js) hoặc tọa độ nhà máy trong data/chloralkali/plants.json.</p>'; host.append(c); return; }
  const proj = G.proj, xy = (lon, lat) => [(lon - proj.lon0) * proj.k * proj.scale, (proj.lat1 - lat) * proj.scale], [vw, vh] = G.viewBox.split(' ').slice(2).map(Number);
  const cmax = Math.max(...plants.map(x => x.capacity_naoh_tpy || 0), 1), r = x => fin(x.capacity_naoh_tpy) ? 5 + 15 * Math.sqrt(x.capacity_naoh_tpy / cmax) : 4;
  const short = x => (x.ticker ? x.ticker.split(' ')[0] : x.company.replace(/^(Công ty|CTCP|Tổng Công ty)( Cổ phần| CP)?( Hữu hạn)?\s*/i, '').split(/[–(-]/)[0].trim()).slice(0, 22);
  const placed = [], marks = [...plants].sort((a, b) => r(b) - r(a)).map(x => {
    const [px, py] = xy(x.location.lon, x.location.lat), col = CL[klass(x)][1], t = short(x);
    const near = placed.filter(q => Math.hypot(q[0] - px, q[1] - py) < 16).length; placed.push([px, py]);
    return `<g class="xc-pt"><circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${r(x).toFixed(1)}" fill="${col}" fill-opacity=".8" stroke="#fff" stroke-width="1.2"/><text x="${(px + r(x) + 3).toFixed(1)}" y="${(py + 4 + near * 12).toFixed(1)}" class="xc-pt-l">${esc(t)}</text><title>${esc(x.plant)} · ${esc(x.location.province || '')} · ${fin(x.capacity_naoh_tpy) ? nf(x.capacity_naoh_tpy / 1000) + ' nghìn tấn NaOH/năm' : 'chưa có số công suất'} · ${esc(CL[klass(x)][0])}</title></g>`; }).join('');
  const isl = [[112.0, 16.5, 'Quần đảo Hoàng Sa'], [114.2, 9.8, 'Quần đảo Trường Sa']].map(([lo, la, t]) => { const [x, y] = xy(lo, la); return `<g class="fb-isl"><circle cx="${x}" cy="${y}" r="2"/><circle cx="${x + 9}" cy="${y + 5}" r="1.6"/><circle cx="${x - 7}" cy="${y + 7}" r="1.4"/><text x="${x}" y="${y + 20}" text-anchor="middle">${t}</text></g>`; }).join('');
  const rows = [...plants].sort((a, b) => (b.capacity_naoh_tpy || 0) - (a.capacity_naoh_tpy || 0));
  c.innerHTML = `<div class="chart-title">Bản đồ nhà máy xút – clo Việt Nam</div><div class="chart-sub">kích thước = công suất thiết kế NaOH (tấn/năm, cơ sở nồng độ theo từng nguồn) · màu = phân loại · vị trí ước lượng theo địa danh, cập nhật đến ${esc(asOf.length >= 10 ? dL(asOf) : asOf)}</div>
    <div class="xc-map"><div class="xc-map-svg"><svg viewBox="${G.viewBox}" role="img" aria-label="Bản đồ nhà máy xút – clo Việt Nam"><rect width="${vw}" height="${vh}" class="fb-sea"/>${Object.values(G.nb).map(d => `<path d="${d}" class="fb-nb"/>`).join('')}<path d="${G.vn}" class="fb-vn"/>${isl}${marks}</svg></div>
    <div class="xc-map-side"><table class="compare-table xc-map-t"><thead><tr><th>Nhà máy</th><th>Tỉnh</th><th class="n">Nghìn tấn/năm</th></tr></thead><tbody>${rows.map(x => `<tr><td><i class="xc-sw" style="background:${CL[klass(x)][1]}"></i>${esc(short(x))}<small>${esc(x.status || '')}</small></td><td>${esc(x.location.province || '')}</td><td class="n">${fin(x.capacity_naoh_tpy) ? nf(x.capacity_naoh_tpy / 1000) : '<em>chưa có số</em>'}</td></tr>`).join('')}</tbody></table></div></div>
    <div class="fb-gm-legend">${Object.values(CL).map(([t, col]) => `<span><i class="xc-sw" style="background:${col}"></i>${t}</span>`).join('')}</div>
    <div class="pw-src">Nguồn: tài liệu doanh nghiệp, FPTS, báo chí (nguồn từng nhà máy ở 02 Công suất nội địa, rê chuột vào thanh); tọa độ ước lượng thủ công theo địa danh; đường viền: ${esc(G.source || 'Natural Earth')}</div>`;
  host.append(c);
}
// Doanh nghiệp niêm yết (xc-04): 28/11/2026 dời từ Tổng quan › 01 sang Tài chính ngành › 02, câu 2.1.
function listed() {
  const pane = $('#xc-fin-listed'); if (!pane || !E) return;
  const i = F.periods.length - 1, TT = m => E.total(m, E.tickers, 'ttm').per;
  const rev = TT('revenue'), np = TT('npat_parent'), gr = TT('gross'), nd = E.total('net_debt', E.tickers, 'q').per;
  const box = el('div', 'card fb-co-wrap'); box.dataset.blockId = 'xc-04'; box.dataset.updateKind = 'public'; box.dataset.cadence = 'quarterly';
  box.innerHTML = `<div class="chart-title">Doanh nghiệp niêm yết</div><div class="chart-sub">4 quý gần nhất đến ${qL(F.periods[i])} · tỷ đồng · BCTC hợp nhất toàn doanh nghiệp, không phải riêng mảng xút · đường nhỏ: doanh thu 12 quý</div><div class="fb-co-grid"></div><div class="pw-src">Nguồn: ${SRC.vnd}; tự tính</div>`;
  const grid = box.querySelector('.fb-co-grid'), gl = Object.fromEntries(F.groups.map(g => [g.id, g]));
  F.companies.map(c => ({...c, r: rev[c.ticker][i], p: np[c.ticker][i], m: fin(gr[c.ticker][i]) && rev[c.ticker][i] ? gr[c.ticker][i] / rev[c.ticker][i] * 100 : null, d: nd[c.ticker][i]}))
    .forEach(c => {
      const g = gl[c.group], t = el('div', 'fb-co', `<div class="fb-co-h"><b>${c.ticker}</b><span class="fb-co-g" style="--c:${g.color}">${esc(g.label)}</span></div><p>${esc(c.note || '')}</p>
        <dl><div><dt>Doanh thu</dt><dd>${nf(c.r)}</dd></div><div><dt>LNST cổ đông mẹ</dt><dd>${nf(c.p)}</dd></div><div><dt>Biên gộp</dt><dd>${nf(c.m, 1)}%</dd></div><div><dt>Nợ vay ròng</dt><dd>${nf(c.d)}</dd></div></dl><div class="fb-spark"></div>`);
      grid.append(t); if (window.ChartTypes) requestAnimationFrame(() => ChartTypes.spark(t.querySelector('.fb-spark'), F.data[c.ticker].revenue.slice(-12), g.color));
    });
  const q = panel('·', 'Doanh nghiệp nào lớn nhất, lãi nhất, vay nhiều nhất?'); q.append(box); pane.append(q);
}

/* =========================== BỨC TRANH NGÀNH =========================== */
const seg = (name, opts, on) => `<div class="fb-gm-seg" data-k="${name}">${opts.map(([v, t]) => `<button type="button" data-v="${v}" aria-pressed="${v === on}">${esc(t)}</button>`).join('')}</div>`;
const PIC = {
  import() {
    const p = $('#xc-pp-import'), ya = years('vn_annual'), y = ya.at(-1), my = years('mirror_annual').at(-1), mo = T.vn_months_available || [];
    const k = (kind, form, yr) => rec(kind, yr, form);
    p.append(kpiRow([
      kpi(`Xút rắn ${y} · Việt Nam báo cáo`, nf(k('vn_annual', 'solid', y).t / 1000, 1), 'nghìn tấn', `đơn giá ${nf(k('vn_annual', 'solid', y).price)} USD/tấn`, 'khối lượng sản phẩm, chưa quy đổi nồng độ', ya.map(x => k('vn_annual', 'solid', x)?.t), C.blue),
      kpi(`Xút dung dịch ${y} · Việt Nam báo cáo`, nf(k('vn_annual', 'liquid', y).t / 1000, 1), 'nghìn tấn', `đơn giá ${nf(k('vn_annual', 'liquid', y).price)} USD/tấn`, 'khối lượng sản phẩm, chưa quy đổi nồng độ', ya.map(x => k('vn_annual', 'liquid', x)?.t), C.teal),
      kpi(`Xút rắn ${my} · số liệu đối tác`, nf(k('mirror_annual', 'solid', my).t / 1000, 1), 'nghìn tấn', `đơn giá ${nf(k('mirror_annual', 'solid', my).price)} USD/tấn (FOB)`, 'nước xuất khẩu báo cáo; không có Đài Loan', years('mirror_annual').map(x => k('mirror_annual', 'solid', x)?.t), C.navy),
      kpi(`Xút dung dịch ${my} · số liệu đối tác`, nf(k('mirror_annual', 'liquid', my).t / 1000, 1), 'nghìn tấn', `đơn giá ${nf(k('mirror_annual', 'liquid', my).price)} USD/tấn (FOB)`, 'nước xuất khẩu báo cáo; không có Đài Loan', years('mirror_annual').map(x => k('mirror_annual', 'liquid', x)?.t), C.sky)]));
    // 1.1 lượng theo thị trường cung ứng + đơn giá nhập khẩu bình quân
    const q1 = panel('·', 'Việt Nam nhập bao nhiêu xút, từ nước nào, giá bao nhiêu?');
    const ctl = el('div', 'fb-gm-ctl', seg('form', [['solid', 'Xút rắn'], ['liquid', 'Xút dung dịch']], 'solid') + seg('freq', [['A', 'Năm'], ['M', `Tháng (T1/2018–${ymL(mo.at(-1) || '')})`]], 'A') + seg('view', [['abs', 'Lượng'], ['yoy', 'So cùng kỳ'], ['share', 'Thị phần']], 'abs'));
    const a = card('xc-11', 'Lượng nhập khẩu theo thị trường cung ứng', {sub: 'tấn sản phẩm', source: SRC_TR, info: 'Việt Nam là bên báo cáo, luồng nhập khẩu. Cơ cấu đối tác: cộng các nước, không cộng dòng World hay dòng khu vực; "Đài Loan" là mã "Other Asia, nes" của Comtrade. Khối lượng là khối lượng tịnh của sản phẩm (Comtrade đánh dấu là số ước tính), chưa quy về NaOH 100%.'});
    const b = card('xc-12', 'Đơn giá nhập khẩu bình quân', {sub: 'USD/tấn sản phẩm · trị giá ÷ khối lượng tịnh, tính lại từ tổng', source: SRC_TR, info: 'Đơn giá nhập khẩu bình quân = tổng trị giá USD ÷ tổng khối lượng tịnh (tấn). Không phải giá giao ngay hay giá bán của doanh nghiệp. Xút rắn và dung dịch là hai chuỗi riêng vì nồng độ khác nhau.'});
    q1.append(ctl, a.el, b.el); p.append(q1);
    const S = {form: 'solid', freq: 'A', view: 'abs'};
    const draw = () => {
      const kind = S.freq === 'A' ? 'vn_annual' : 'vn_monthly', ps = S.freq === 'A' ? ya : mo, L = ps.map(x => S.freq === 'A' ? x : ymL(x));
      const R = ps.map(x => k(kind, S.form, x)), names = D.partners_top;
      const back = x => S.freq === 'A' ? String(+x - 1) : String(+x.slice(0, 4) - 1) + x.slice(4);
      let series;
      if (S.view === 'abs') series = names.map(n => ({name: n, color: PC[n], kind: 'bar', values: R.map(r => r?.partners?.[n]?.t ?? null)}));
      else if (S.view === 'share') series = names.map(n => ({name: n, color: PC[n], kind: 'bar', values: R.map(r => { const t = r && Object.values(r.partners || {}).reduce((s, v) => s + (v.t || 0), 0); return t ? (r.partners?.[n]?.t || 0) / t * 100 : null; })}));
      else series = [{name: 'Tổng nhập khẩu', color: C.blue, kind: 'bar', values: ps.map((x, i) => { const r0 = k(kind, S.form, back(x)); return R[i]?.t && r0?.t ? (R[i].t / r0.t - 1) * 100 : null; })}];
      a.el.querySelector('.chart-sub').textContent = (S.view === 'abs' ? 'tấn sản phẩm' : S.view === 'share' ? '% tổng lượng các đối tác' : '% so cùng kỳ năm trước') + ' · ' + FORM[S.form];
      chart(a.host, `xc-11-${S.form}-${S.freq}-${S.view}`, L, series, {unit: S.view === 'abs' ? 'tấn' : '%', digits: S.view === 'abs' ? 0 : 1, native: S.view === 'yoy' ? 'bar' : 'stack', stackable: S.view !== 'yoy', zeroBase: true});
      b.el.querySelector('.chart-sub').textContent = `USD/tấn sản phẩm · ${FORM[S.form]} · trị giá ÷ khối lượng tịnh`;
      chart(b.host, `xc-12-${S.form}-${S.freq}`, L, [{name: 'Đơn giá nhập khẩu bình quân', color: C.gold, values: R.map(r => r?.price ?? null)}], {unit: 'USD/tấn', zeroBase: false});
    };
    ctl.addEventListener('click', e => { const bt = e.target.closest('button'); if (!bt) return; const g = bt.parentElement; S[g.dataset.k] = bt.dataset.v; g.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === bt))); draw(); });
    draw();
    // 1.2 Việt Nam báo cáo và số liệu đối tác
    const q2 = panel('·', 'Nhập khẩu các năm gần đây tăng hay giảm theo số liệu đối tác?');
    const c = card('xc-13', 'Lượng nhập khẩu: Việt Nam báo cáo và số liệu đối tác', {sub: 'nghìn tấn sản phẩm · theo năm', source: SRC_MR, info: 'Số liệu đối tác = các nước xuất khẩu báo cáo lượng xuất sang Việt Nam (giá FOB, theo kỳ xuất), giữ là chuỗi riêng. Đài Loan không báo cáo cho UN Comtrade nên không có trong số liệu đối tác (theo Việt Nam báo cáo, Đài Loan cung ~15 nghìn tấn xút rắn năm 2022).'});
    q2.append(c.el); p.append(q2);
    const YY = [...new Set([...ya, ...years('mirror_annual')])].sort();
    chart(c.host, 'xc-13', YY, [['solid', 'Rắn', C.blue, C.navy], ['liquid', 'Dung dịch', C.teal, '#7fc4c6']].flatMap(([f, n, c1, c2]) => [
      {name: `${n} · Việt Nam báo cáo`, color: c1, kind: 'bar', values: YY.map(x => k('vn_annual', f, x)?.t / 1000 || null)},
      {name: `${n} · số liệu đối tác`, color: c2, kind: 'line', values: YY.map(x => k('mirror_annual', f, x)?.t / 1000 || null)}]), {unit: 'nghìn tấn', digits: 1, native: 'bar'});
    // 1.3 chuỗi lịch sử FPTS
    const q3 = panel('·', 'Chuỗi FPTS 2018–2022 có khớp số Comtrade không?');
    const d = card('xc-14', 'Tổng nhập khẩu xút: chuỗi FPTS và chuỗi Comtrade', {sub: 'nghìn tấn · hai chuỗi riêng, không nối', source: SRC_FPTS + ' (nguồn ITC); ' + SRC_TR, info: 'Chuỗi FPTS: cơ sở quy đổi nồng độ chưa xác minh. Chuỗi Comtrade: xút rắn + xút dung dịch theo khối lượng sản phẩm. Hai định nghĩa chưa đối chiếu được nên để riêng.'});
    q3.append(d.el); p.append(q3);
    const fy = (FP.imports_total?.rows || []).map(r => String(r[0])), Y3 = [...new Set([...fy, ...ya])].sort(), fv = Object.fromEntries((FP.imports_total?.rows || []).map(r => [String(r[0]), r[1]]));
    chart(d.host, 'xc-14', Y3, [{name: 'FPTS (ITC) · cơ sở nồng độ chưa xác minh', color: C.grey, kind: 'bar', values: Y3.map(x => fv[x] ?? null)},
      {name: 'Comtrade · rắn + dung dịch (khối lượng sản phẩm)', color: C.blue, kind: 'bar', values: Y3.map(x => { const s = k('vn_annual', 'solid', x), l = k('vn_annual', 'liquid', x); return s?.t && l?.t ? (s.t + l.t) / 1000 : null; })}], {unit: 'nghìn tấn', digits: 1, native: 'bar'});
    // xc-90 (ba cách đọc tác động của Nghi Sơn) chỉ còn một thẻ ở 03, câu cuối (28/11/2026: trước nhân bản ở cả 01 và 03).
    xlink(p, 'nghison', '03 Nghi Sơn & gốc clo', 'Nghi Sơn tăng sản lượng: ba cách đọc và chỉ tiêu theo dõi', 'Thay thế hàng nhập, cạnh tranh giá nội địa, nguồn cung tăng chậm', 'xc-90');
    finish(p, 1);
  },
  capacity() {
    const p = $('#xc-pp-capacity'), plants = PL.plants || [], snap = FP.capacity_snapshot || {rows: []};
    // Phân loại theo nguồn: "(dự kiến)" = dự án chưa vận hành; captive = chủ yếu dùng nội bộ; merchant = bán ra thị trường.
    const klass = x => { const c = x.classification || ''; return /dự kiến/.test(c) ? 'project' : /^captive/.test(c) ? 'captive' : /^merchant/.test(c) ? 'merchant' : 'unknown'; };
    const op = plants.filter(x => fin(x.capacity_naoh_tpy) && klass(x) !== 'project' && klass(x) !== 'unknown');
    const sum = a => a.reduce((s, x) => s + x.capacity_naoh_tpy, 0);
    const merch = op.filter(x => klass(x) === 'merchant');
    const hv = (PL.production || []).filter(x => x.company === 'HVT' && x.metric === 'Sản lượng sản xuất' && x.product === 'Xút (tổng số)' && /^\d{4}$/.test(x.year_or_period)).sort((a, b) => a.year_or_period.localeCompare(b.year_or_period));
    p.append(kpiRow([
      kpi('Công suất đang vận hành (cập nhật)', nf(sum(op) / 1000), 'nghìn tấn NaOH/năm', `${op.length} cơ sở đã phân loại, có số công suất`, 'cơ sở nồng độ khác nhau theo nguồn; không gồm dự án', null),
      kpi('Trong đó cơ sở bán ra thị trường', nf(sum(merch) / 1000), 'nghìn tấn/năm', merch.map(x => x.ticker ? x.ticker.split(' ')[0] : x.company.split(' ').slice(-1)[0]).join(' · '), 'phân loại theo FPTS và tài liệu doanh nghiệp', null),
      kpi('Nhu cầu xút (ước tính FPTS)', nf(FP.demand?.value), 'nghìn tấn/năm', FP.demand?.label || '', 'không phải tiêu thụ biểu kiến', null),
      hv.length ? kpi(`HVT sản xuất xút ${hv.at(-1).year_or_period}`, nf(hv.at(-1).value / 1000, 1), 'nghìn tấn (100%)', `${sg((hv.at(-1).value / hv.at(-2).value - 1) * 100)}% so năm trước`, 'BCTN HVT', hv.map(x => x.value), C.blue) : null].filter(Boolean)));
    flow(p, 'capacity', [['in', 'Đầu vào', 'Điện, muối'], ['make', 'Sản xuất', 'Công suất theo nhà máy'], ['out', 'Đầu ra', 'Sản lượng, phần bán ra']]);
    stage(p, 'capacity', 'in', 'Đầu vào', 'Điện, muối');
    xlink(p, 'cost', '04 Chi phí đầu vào', 'Giá điện sản xuất và hạn ngạch nhập khẩu muối', 'Điện phân muối: điện và muối là hai đầu vào chính của xút – clo', 'xc-41');
    stage(p, 'capacity', 'make', 'Sản xuất', 'Công suất theo nhà máy');
    // 2.1 công suất theo nhà máy
    const q1 = panel('·', 'Nhà máy nào có xút để bán?');
    const CL = {merchant: ['Bán ra thị trường', '#2938A8'], captive: ['Chủ yếu dùng nội bộ', '#9aa1b2'], project: ['Dự án (chưa vận hành)', '#c98a00'], unknown: ['Chưa rõ', '#d6dbe8']};
    const ctl = el('div', 'fb-gm-ctl', seg('snap', [['upd', 'Cập nhật 11/2026'], ['fpts', 'Ảnh chụp FPTS 2024']], 'upd'));
    const c = el('div', 'card'); c.dataset.blockId = 'xc-21'; c.dataset.updateKind = 'document'; c.dataset.cadence = 'event';
    q1.append(ctl, c); p.append(q1);
    const drawCap = mode => {
      let rows;
      if (mode === 'fpts') rows = snap.rows.map(r => ({name: r.plant, v: r.value, cls: r.class, note: 'FPTS 10/05/2024', src: SRC_FPTS}));
      else rows = plants.map(x => ({name: (x.ticker ? x.ticker.split(' ')[0] + ' · ' : '') + (x.short || x.plant || x.company).replace(/^Nhà máy /, '').split(' (')[0], v: fin(x.capacity_naoh_tpy) ? x.capacity_naoh_tpy / 1000 : null,
        cls: klass(x),
        note: `${x.capacity_basis || ''}${x.as_of ? ' · xác minh ' + x.as_of : ''}`, src: srcList(x.sources)}));
      rows.sort((a, b) => (b.v ?? -1) - (a.v ?? -1));
      const mx = Math.max(...rows.map(r => r.v || 0));
      c.innerHTML = `<div class="chart-title">Công suất thiết kế xút theo nhà máy</div><div class="chart-sub">nghìn tấn NaOH/năm · ${mode === 'fpts' ? 'ảnh chụp FPTS 10/05/2024 (FPTS ghi tổng ~200 nghìn tấn quy 100%; năm nhà máy hiện hữu trên chart cộng ' + nf(snap.chart_sums?.existing) + ', ba cơ sở thương mại cộng ' + nf(snap.chart_sums?.merchant) + ', phần chữ ghi ~' + nf(snap.text_totals?.merchant) + ')' : 'cập nhật theo tài liệu doanh nghiệp, ngày xác minh từng cơ sở'}</div>
        <div class="xc-hbars">${rows.map(r => `<div class="xc-hb" title="${esc(r.note)}"><span class="xc-hb-n">${esc(r.name)}</span><span class="xc-hb-t">${r.v != null ? `<i style="width:${r.v / mx * 100}%;background:${CL[r.cls][1]}"></i><b>${nf(r.v, r.v < 10 ? 1 : 0)}</b>` : '<em>chưa có số công suất</em>'}</span><small>${esc(r.note)}</small></div>`).join('')}</div>
        <div class="fb-gm-legend">${Object.values(CL).map(([t, col]) => `<span><i class="xc-sw" style="background:${col}"></i>${t}</span>`).join('')}</div>
        <div class="pw-src">Nguồn: ${mode === 'fpts' ? SRC_FPTS + ' (tr. 21)' : 'tài liệu doanh nghiệp, FPTS (nguồn từng cơ sở khi rê chuột)'}</div>`;
    };
    ctl.addEventListener('click', e => { const bt = e.target.closest('button'); if (!bt) return; ctl.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === bt))); drawCap(bt.dataset.v); });
    drawCap('upd');
    // 2.2 HVT: sản lượng xút, phần bán ra thị trường
    stage(p, 'capacity', 'out', 'Đầu ra', 'Sản lượng, phần bán ra');
    if (hv.length) {
      const q2 = panel('·', 'Công suất đã thành bao nhiêu sản lượng, bao nhiêu bán ra?');
      const sold = Object.fromEntries((PL.production || []).filter(x => x.company === 'HVT' && x.product === 'Xút thương phẩm').map(x => [x.year_or_period, x.value]));
      const d = card('xc-22', 'HVT: sản lượng xút sản xuất và phần thương phẩm', {sub: 'tấn, quy 100% (HVT ghi "Xút 100%")', kind: 'document', cadence: 'annual', source: srcList([...new Map(hv.flatMap(x => x.sources).map(s => [s.url, s])).values()].slice(0, 3)), info: 'Phần thương phẩm (bán ra thị trường) chỉ có trong BCTN 2019–2021. Không tính tỷ lệ sử dụng công suất vì chưa có công suất cùng cơ sở nồng độ theo từng năm.'});
      q2.append(d.el); p.append(q2);
      chart(d.host, 'xc-22', hv.map(x => x.year_or_period), [{name: 'Sản xuất (tổng)', color: C.blue, kind: 'bar', values: hv.map(x => x.value)}, {name: 'Thương phẩm (bán ra)', color: C.gold, kind: 'bar', values: hv.map(x => sold[x.year_or_period] ?? null)}], {unit: 'tấn', native: 'bar'});
    }
    dropEmptyStages(p); finish(p, 2);
  },
  nghison() {
    const p = $('#xc-pp-nghison'), tl = (PL.nghison_timeline || []).filter(e => e.date_published), pr = PL.nghison_products || {};
    // Số dư/giải ngân theo kỳ: bỏ kỳ chưa có số; ngày lấy 10 ký tự đầu (nguồn có ghi chú sau ngày).
    const xd = (PL.nghison_xdcb || []).filter(x => fin(x.value)).map(x => ({...x, as_of: String(x.as_of).slice(0, 10)}));
    const lastE = tl.filter(e => e.planned_date).sort((a, b) => String(a.date_published).localeCompare(String(b.date_published))).at(-1) || {};
    const cip = xd.filter(x => /dở dang/i.test(x.metric)).sort((a, b) => a.as_of.localeCompare(b.as_of)).at(-1);
    p.append(kpiRow([
      kpi('Công suất xút Nghi Sơn', '50', 'nghìn tấn/năm', 'NaOH quy 100% (Yuanta 2026); FPTS 2024 ghi NaOH 99%', 'công suất thiết kế, chưa vận hành', null),
      kpi('Tổng công suất thiết kế', '151', 'nghìn tấn/năm', 'xút + 8 nhóm sản phẩm gốc clo, phốt pho', 'chưa gồm phụ phẩm HCl 75 nghìn tấn', null),
      cip ? kpi('XDCB dở dang Nghi Sơn', nf(cip.value), cip.unit, `tại ${dL(cip.as_of)}`, 'số dư theo kỳ', xd.filter(x => /dở dang/i.test(x.metric)).map(x => x.value), C.gold) : null,
      kpi('Mốc vận hành theo công bố gần nhất', esc(lastE.planned_date || 'N/A'), '', `công bố ${lastE.date_published ? dL(String(lastE.date_published)) : ''}`, 'mốc dự kiến; chưa có công bố chạy thử thực tế', null)].filter(Boolean)));
    flow(p, 'nghison', [['inv', 'Đầu tư', 'Tiến độ, vốn đã vào'], ['make', 'Sản xuất', 'Công suất theo sản phẩm'], ['out', 'Đầu ra', 'Bán gốc clo, tác động thị trường']]);
    stage(p, 'nghison', 'inv', 'Đầu tư', 'Tiến độ, vốn đã vào');
    // 3.1 timeline có phiên bản
    const q1 = panel('·', 'Tiến độ dự án thay đổi thế nào qua các lần công bố?');
    const c = el('div', 'card'); c.dataset.blockId = 'xc-31'; c.dataset.updateKind = 'event'; c.dataset.cadence = 'event';
    const ST = {'đầu tư/xây dựng': '#8997D6', 'chạy thử': '#c98a00', 'vận hành thương mại dây chuyền': '#2a9fa3', 'vận hành toàn dự án': '#1D2678', 'sản lượng bán': '#861C52'};
    c.innerHTML = `<div class="chart-title">Mốc dự án theo ngày công bố</div><div class="chart-sub">Mỗi dòng là một lần công bố: giai đoạn mục tiêu và mốc dự kiến tại thời điểm đó, mốc thực tế nếu có; mốc cũ giữ trong lịch sử điều chỉnh. Sản lượng bán ra: chưa có số công bố.</div>
      <ol class="xc-tl">${tl.slice().sort((a, b) => String(b.date_published).localeCompare(String(a.date_published))).map(e => `<li><span class="xc-tl-d">${esc(e.date_published ? dL(String(e.date_published)) : '')}</span><span class="xc-tl-s" style="background:${ST[e.status] || '#9aa1b2'}">${e.actual_date ? 'Đã đạt: ' : 'Mục tiêu: '}${esc(e.status || '')}</span><div><b>${esc(e.milestone || '')}</b>${e.planned_date ? `<small>Dự kiến: ${esc(e.planned_date)}</small>` : ''}${e.actual_date ? `<small>Thực tế: ${esc(e.actual_date)}</small>` : ''}<small class="xc-tl-src">${srcList(e.sources)}</small></div></li>`).join('')}</ol>
      <div class="pw-src">Nguồn: tài liệu DGC (nghị quyết HĐQT, ĐHĐCĐ, BCTN), Yuanta, FPTS, báo chí (ghi từng dòng)</div>`;
    q1.append(c); p.append(q1);
    // 3.2 XDCB dở dang và giải ngân
    if (xd.length) {
      const q2 = panel('·', 'Vốn đã vào dự án đến đâu?');
      const d = card('xc-32', 'Nghi Sơn: XDCB dở dang và giải ngân lũy kế', {sub: 'tỷ đồng', kind: 'document', cadence: 'quarterly', source: srcList([...new Map(xd.flatMap(x => x.sources || []).map(s => [s.url, s])).values()].slice(0, 3))});
      q2.append(d.el); p.append(q2);
      const dates = [...new Set(xd.map(x => x.as_of))].sort();
      chart(d.host, 'xc-32', dates.map(dL), [{name: 'XDCB dở dang (số dư)', color: C.gold, kind: 'bar', values: dates.map(t => xd.find(x => x.as_of === t && /dở dang/i.test(x.metric))?.value ?? null)},
        {name: 'Giải ngân lũy kế', color: C.blue, kind: 'bar', values: dates.map(t => xd.find(x => x.as_of === t && /giải ngân/i.test(x.metric))?.value ?? null)}], {unit: 'tỷ đồng', native: 'bar'});
    }
    stage(p, 'nghison', 'make', 'Sản xuất', 'Công suất theo sản phẩm');
    // 3.3 sản phẩm gốc clo: công suất thiết kế theo sản phẩm, hai phiên bản
    const q3 = panel('·', 'Nghi Sơn sẽ làm những sản phẩm gốc clo nào, quy mô bao nhiêu?');
    const ctl = el('div', 'fb-gm-ctl', seg('ver', [['latest', 'Cập nhật (Yuanta 10/2026)'], ['fpts', 'FPTS 2024']], 'latest'));
    const e2 = card('xc-33', 'Công suất thiết kế theo sản phẩm', {sub: 'tấn/năm', kind: 'document', cadence: 'event', source: srcList([pr.latest_source]) || SRC_FPTS, info: 'Phụ phẩm HCl 31% (~75.000 tấn/năm, sinh ra khi sản xuất H3PO3) không cộng vào tổng 151.000 tấn. Nhóm gốc phốt pho (H3PO3, H3PO4, PCl3, PCl5) dùng chung trần 10.000 tấn quy H3PO3.'});
    q3.append(ctl, e2.el); p.append(q3);
    const drawP = v => {
      const L = (v === 'fpts' ? pr.fpts_2024 : pr.latest || []).filter(x => !/^Tổng/.test(x.product));
      e2.el.querySelector('.pw-src').innerHTML = 'Nguồn: ' + (v === 'fpts' ? SRC_FPTS + ' (tr. 20)' : srcList([pr.latest_source]));
      chart(e2.host, 'xc-33-' + v, L.map(x => x.product + (x.concentration ? ` (${x.concentration})` : '')), [{name: 'Công suất thiết kế', color: C.teal, kind: 'bar', values: L.map(x => x.capacity_tpy)}], {unit: 'tấn/năm', native: 'hbar'});
    };
    ctl.addEventListener('click', e => { const bt = e.target.closest('button'); if (!bt) return; ctl.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === bt))); drawP(bt.dataset.v); });
    drawP('latest');
    stage(p, 'nghison', 'out', 'Đầu ra', 'Bán gốc clo, tác động thị trường');
    // 3.4 bằng chứng đầu ra gốc clo trên thị trường: sản lượng sản phẩm gốc clo của HVT
    const prod = (PL.production || []).filter(x => x.company === 'HVT' && x.metric === 'Sản lượng sản xuất' && !/Xút/.test(x.product) && /^\d{4}$/.test(x.year_or_period));
    if (prod.length) {
      const q4 = panel('·', 'Nhà sản xuất hiện hữu làm được bao nhiêu sản phẩm gốc clo?');
      const f = card('xc-34', 'HVT: sản lượng sản phẩm gốc clo theo năm', {sub: 'tấn sản phẩm (nồng độ không ghi)', kind: 'document', cadence: 'annual', source: srcList([...new Map(prod.flatMap(x => x.sources).map(s => [s.url, s])).values()].slice(0, 2)), info: 'Mỗi sản phẩm một chuỗi; các sản phẩm khác nồng độ nên không cộng thành tổng.'});
      q4.append(f.el); p.append(q4);
      const YS = [...new Set(prod.map(x => x.year_or_period))].sort(), PS = [...new Set(prod.map(x => x.product))];
      const cols = [C.blue, C.teal, C.gold, C.plum, C.grey, C.sky, C.bronze, C.navy];
      chart(f.host, 'xc-34', YS, PS.map((n, j) => ({name: n, color: cols[j % cols.length], values: YS.map(y => prod.find(x => x.product === n && x.year_or_period === y)?.value ?? null)})), {unit: 'tấn', zeroBase: true});
    }
    const q5 = panel('·', 'Nghi Sơn chạy sẽ tác động tới thị trường xút theo hướng nào?'); q5.append(readings()); p.append(q5);
    finish(p, 3);
  },
  p4() {
    const p = $('#xc-pp-p4'), P4 = D.p4 || {}, M = P4.monthly || [], W = P4.weekly || [];
    if (!M.length) return;
    const SRC_P4 = `<a href="${esc(P4.source_url || '#')}" target="_blank" rel="noopener">Sunsirs</a> (qua WiData), giá giao ngay Trung Quốc, giá trị ngày cuối kỳ`;
    // Chuỗi theo quý: quý cũ lấy từ chuỗi quý của nguồn; từ 03/2024 lấy giá cuối tháng 3, 6, 9, 12 (quý đang chạy lấy ngày mới nhất).
    const qOf = d => `Q${Math.ceil(+d.slice(5, 7) / 3)}/${d.slice(0, 4)}`, mStart = M[0].date;
    const QS = new Map();
    (P4.quarterly || []).filter(r => r.date.slice(0, 7) < mStart.slice(0, 7)).forEach(r => QS.set(qOf(r.date), r));
    M.forEach((r, i) => { const mm = +r.date.slice(5, 7); if (mm % 3 === 0 || i === M.length - 1) QS.set(qOf(r.date), r); });
    const qKey = k => k.slice(3) + k[1];
    const QK = [...QS.keys()].sort((a, b) => qKey(a) < qKey(b) ? -1 : 1);
    const lastM = M.at(-1), yAgo = M.find(r => r.date.slice(0, 7) === `${+lastM.date.slice(0, 4) - 1}-${lastM.date.slice(5, 7)}`), dec = M.find(r => r.date.slice(0, 7) === `${+lastM.date.slice(0, 4) - 1}-12`);
    const rp = (kind, y) => (T[kind] || {})[`${y}|280470`] || null;
    const yrs = kind => [...new Set(Object.keys(T[kind] || {}).map(k => k.split('|')[0]))].filter(y => rp(kind, y)?.t).sort();
    const vy = yrs('p4_vn_annual'), my = yrs('p4_mirror_annual');
    const v1 = rp('p4_vn_annual', vy.at(-1)), m1 = rp('p4_mirror_annual', my.at(-1));
    p.append(kpiRow([
      kpi('Giá P4 Trung Quốc · ' + dL(lastM.date), nf(lastM.value), 'CNY/tấn', yAgo ? `${sg((lastM.value / yAgo.value - 1) * 100)}% so cùng kỳ` : '', 'giao ngay, Sunsirs', M.map(r => r.value), C.plum),
      dec ? kpi('So với cuối năm trước', sg((lastM.value / dec.value - 1) * 100), '%', `cuối 12/${dec.date.slice(0, 4)}: ${nf(dec.value)} CNY/tấn`, 'giá ngày cuối kỳ', null) : null,
      v1 ? kpi(`Xuất khẩu P4 ${vy.at(-1)} · Việt Nam báo cáo`, nf(v1.t / 1000, 1), 'nghìn tấn', `đơn giá ${nf(v1.price)} USD/tấn`, 'HS 280470, UN Comtrade', vy.map(y => rp('p4_vn_annual', y).t), C.gold) : null,
      m1 ? kpi(`Xuất khẩu P4 ${my.at(-1)} · số liệu đối tác`, nf(m1.t / 1000, 1), 'nghìn tấn', `đơn giá ${nf(m1.price)} USD/tấn (CIF)`, 'nước nhập khẩu báo cáo', my.map(y => rp('p4_mirror_annual', y).t), C.navy) : null].filter(Boolean)));
    flow(p, 'p4', [['in', 'Đầu vào', 'Giá điện sản xuất'], ['px', 'Giá', 'Giá P4 Trung Quốc'], ['out', 'Đầu ra', 'Xuất khẩu P4 Việt Nam']]);
    stage(p, 'p4', 'in', 'Đầu vào', 'Giá điện sản xuất');
    xlink(p, 'cost', '04 Chi phí đầu vào', 'Biểu giá điện bán lẻ cho sản xuất', 'Giá điện theo cấp điện áp và khung giờ qua các quyết định của Bộ Công Thương', 'xc-41');
    stage(p, 'p4', 'px', 'Giá', 'Giá P4 Trung Quốc');
    const q1 = panel('·', 'Giá P4 Trung Quốc đang ở đâu so với các năm trước?');
    const a = card('xc-51', 'Giá P4 giao ngay Trung Quốc, cuối mỗi quý', {sub: 'CNY/tấn · giá ngày cuối quý (quý hiện tại: ngày mới nhất)', cadence: 'daily', kind: 'document', source: SRC_P4, info: 'Nguồn Sunsirs qua WiData trả giá trị ngày cuối kỳ, không phải bình quân. Trước 03/2024 nguồn chỉ còn số theo quý (một số quý có ngày quan sát cuối không trùng cuối quý, vd 01/11/2021); từ 03/2024 lấy giá cuối tháng 3, 6, 9, 12.'});
    q1.append(a.el); p.append(q1);
    chart(a.host, 'xc-51', QK, [{name: 'Giá P4 Trung Quốc', color: C.plum, values: QK.map(k => QS.get(k).value)}], {unit: 'CNY/tấn', zeroBase: false});
    const q2 = panel('·', 'Giá P4 tăng hay giảm trong năm nay?');
    const b = card('xc-52', 'Giá P4 giao ngay Trung Quốc theo tuần', {sub: 'CNY/tấn · giá ngày cuối tuần', cadence: 'daily', kind: 'document', source: SRC_P4});
    q2.append(b.el); p.append(q2);
    chart(b.host, 'xc-52', W.map(r => dL(r.date)), [{name: 'Giá P4 Trung Quốc', color: C.plum, values: W.map(r => r.value)}], {unit: 'CNY/tấn', zeroBase: false});
    stage(p, 'p4', 'out', 'Đầu ra', 'Xuất khẩu P4 Việt Nam');
    if (vy.length || my.length) {
      const q3 = panel('·', 'Việt Nam xuất khẩu bao nhiêu P4, sang đâu, giá bao nhiêu?');
      const c = card('xc-53', 'Xuất khẩu P4 (HS 280470) của Việt Nam theo thị trường', {sub: 'tấn · số liệu đối tác: nước nhập khẩu báo cáo nhập từ Việt Nam', cadence: 'annual', source: '<a href="https://comtradeplus.un.org/" target="_blank" rel="noopener">UN Comtrade</a> (số liệu đối tác)', info: 'Dùng số liệu đối tác vì chuỗi Việt Nam báo cáo thiếu và lệch (năm 2019, 2020 khối lượng bất thường, năm 2022 không có khối lượng, chưa có 2024–2025). HS 280470 là phốt pho nói chung.'});
      const d = card('xc-54', 'Lượng xuất khẩu P4: Việt Nam báo cáo và số liệu đối tác', {sub: 'nghìn tấn', cadence: 'annual', source: '<a href="https://comtradeplus.un.org/" target="_blank" rel="noopener">UN Comtrade</a> (Việt Nam báo cáo, giá FOB; nước nhập khẩu báo cáo, giá CIF)', info: 'Số liệu đối tác = các nước nhập khẩu báo cáo nhập từ Việt Nam; giữ là chuỗi riêng, không cộng với số Việt Nam báo cáo. Năm Việt Nam báo cáo khối lượng bất thường (đơn giá suy ra trên 20.000 USD/tấn) hoặc không có khối lượng thì để trống.'});
      const e = card('xc-55', 'Đơn giá xuất khẩu P4 bình quân', {sub: 'USD/tấn · trị giá ÷ khối lượng tịnh', cadence: 'annual', source: '<a href="https://comtradeplus.un.org/" target="_blank" rel="noopener">UN Comtrade</a>; tự tính', info: 'Số liệu đối tác theo giá CIF tại nước nhập khẩu; Việt Nam báo cáo theo giá FOB. Hai chuỗi riêng.'});
      q3.append(c.el, d.el, e.el); p.append(q3);
      const names = D.p4_partners_top || [], PC2 = {'Nhật Bản': C.gold, 'Ấn Độ': '#dd7f4e', 'Hàn Quốc': C.teal, 'Trung Quốc': C.blue, 'Indonesia': C.plum, 'Hà Lan': C.sky, 'Khác': '#9aa1b2'};
      chart(c.host, 'xc-53', my, names.map(n => ({name: n, color: PC2[n] || C.grey, kind: 'bar', values: my.map(y => rp('p4_mirror_annual', y)?.partners?.[n]?.t ?? null)})), {unit: 'tấn', native: 'stack', stackable: true});
      const YY = [...new Set([...vy, ...my])].sort();
      chart(d.host, 'xc-54', YY, [{name: 'Lượng · Việt Nam báo cáo', color: C.gold, kind: 'bar', values: YY.map(y => rp('p4_vn_annual', y)?.t / 1000 || null)},
        {name: 'Lượng · số liệu đối tác', color: '#e6c98a', kind: 'bar', values: YY.map(y => rp('p4_mirror_annual', y)?.t / 1000 || null)}], {unit: 'nghìn tấn', digits: 1, native: 'bar'});
      chart(e.host, 'xc-55', YY, [{name: 'Số liệu đối tác (CIF)', color: C.navy, values: YY.map(y => rp('p4_mirror_annual', y)?.price ?? null)},
        {name: 'Việt Nam báo cáo (FOB)', color: C.plum, values: YY.map(y => rp('p4_vn_annual', y)?.price ?? null)}], {unit: 'USD/tấn', zeroBase: false});
    }
    dropEmptyStages(p); finish(p, 5);
  },
  cost() {
    const p = $('#xc-pp-cost'), TA = IN.tariffs || [], last2 = TA.at(-1), SQ = (IN.salt_quota || []).filter(x => fin(x.quota_tonnes)), sq = SQ.at(-1);
    p.append(kpiRow([
      kpi('Giá điện bán lẻ bình quân', last2 ? nf(last2.avg_price, 0) : 'N/A', 'đ/kWh', last2 ? `${sg(last2.avg_change_pct)}% · từ ${dL(last2.effective)}` : '', last2 ? esc(last2.decision) : '', TA.map(t => t.avg_price), C.grey),
      last2 ? kpi('Sản xuất, cấp điện áp cao nhất, giờ bình thường', nf(last2.table[0].binh_thuong), 'đ/kWh', esc(last2.table[0].voltage), 'chưa gồm VAT', null) : null,
      kpi('Tỷ trọng điện trong giá thành xút', nf(FP.power_cost_share?.value), '%', 'Ước tính FPTS 2024', 'không phải số doanh nghiệp công bố', null),
      sq ? kpi(`Hạn ngạch nhập khẩu muối ${sq.year}`, nf(sq.quota_tonnes), 'tấn', 'toàn nhóm HS 2501', 'không riêng muối công nghiệp', SQ.map(x => x.quota_tonnes), C.teal) : null].filter(Boolean)));
    flow(p, 'cost', [['power', 'Điện', 'Biểu giá điện sản xuất'], ['intl', 'So sánh', 'Giá điện các nước'], ['salt', 'Muối', 'Hạn ngạch nhập khẩu'], ['unit', 'Kịch bản', 'Chi phí điện trên tấn xút']]);
    stage(p, 'cost', 'power', 'Điện', 'Biểu giá điện sản xuất');
    // 4.1 bậc thang giá điện sản xuất theo ngày hiệu lực
    const q1 = panel('·', 'Giá điện sản xuất tăng bao nhiêu qua các lần điều chỉnh?');
    const ctl = el('div', 'fb-gm-ctl', seg('tier', [['0', 'Cấp cao nhất'], ['1', 'Cấp 2'], ['2', 'Cấp 3'], ['3', 'Cấp thấp nhất']], '0') + seg('band', [['binh_thuong', 'Giờ bình thường'], ['thap_diem', 'Thấp điểm'], ['cao_diem', 'Cao điểm']], 'binh_thuong'));
    const c = card('xc-41', 'Biểu giá bán lẻ điện cho các ngành sản xuất', {sub: 'đ/kWh, chưa gồm VAT · bậc thang theo ngày hiệu lực', kind: 'document', cadence: 'event', source: 'Quyết định của Bộ Công Thương (văn bản từng mốc ở bảng 4.2)', info: 'Cấp 1–4 trước 01/11/2026: ≥110 kV; 22–<110 kV; 6–<22 kV; <6 kV. Từ 01/11/2026: ≥220 kV; >35–<220 kV; trung áp >1–35 kV; hạ áp ≤1 kV. Khung giờ cao điểm, thấp điểm cũng đổi (QĐ 963/QĐ-BCT). Đường đứt là ranh giới đổi cách phân cấp.'});
    q1.append(ctl, c.el); p.append(q1);
    const S = {tier: '0', band: 'binh_thuong'};
    const drawT = () => {
      const L = TA.map(t => dL(t.effective)), v = TA.map(t => t.table[+S.tier]?.[S.band] ?? null), nw = TA.map(t => /MỚI/.test(t.voltage_scheme || ''));
      c.host.innerHTML = '<canvas></canvas>'; const cv = c.host.querySelector('canvas'); c.host.style.height = '300px';
      if (c.host._ch) c.host._ch.destroy();
      c.host._ch = new Chart(cv, {type: 'line', data: {labels: L, datasets: [{label: 'Giá (đ/kWh)', data: v, stepped: 'before', borderColor: C.blue, backgroundColor: C.blue, pointRadius: 4,
        segment: {borderDash: x => nw[x.p1DataIndex] && !nw[x.p0DataIndex] ? [6, 4] : undefined}}]},
        options: {maintainAspectRatio: false, plugins: {legend: {display: false}, tooltip: {callbacks: {title: i => `${TA[i[0].dataIndex].decision} · hiệu lực ${L[i[0].dataIndex]}`, label: i => `${TA[i.dataIndex].table[+S.tier]?.voltage}: ${nf(i.raw)} đ/kWh`}}},
          scales: {y: {ticks: {callback: x => nf(x)}}}}});
    };
    ctl.addEventListener('click', e => { const bt = e.target.closest('button'); if (!bt) return; const g = bt.parentElement; S[g.dataset.k] = bt.dataset.v; g.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === bt))); drawT(); });
    drawT();
    // 4.2 bảng biểu giá (dữ liệu thô)
    const q2 = panel('·', 'Mỗi quyết định đặt giá điện từng cấp điện áp bao nhiêu?');
    const tb = el('div', 'card'); tb.dataset.blockId = 'xc-42'; tb.dataset.updateKind = 'document'; tb.dataset.cadence = 'event';
    tb.innerHTML = `<div class="chart-title">Biểu giá bán lẻ điện cho các ngành sản xuất theo quyết định</div><div class="tbl-wrap"><table class="compare-table"><thead><tr><th>Quyết định</th><th>Hiệu lực</th><th>Cấp điện áp</th><th class="n">Bình thường</th><th class="n">Thấp điểm</th><th class="n">Cao điểm</th><th>Nguồn</th></tr></thead><tbody>
      ${TA.slice().reverse().map(t => t.table.map((r, i) => `<tr><td>${i ? '' : `<b>${esc(t.decision)}</b>`}</td><td>${i ? '' : dL(t.effective)}</td><td>${esc(r.voltage)}</td><td class="n">${nf(r.binh_thuong)}</td><td class="n">${nf(r.thap_diem)}</td><td class="n">${nf(r.cao_diem)}</td><td>${i ? '' : `<a href="${esc(t.source_url)}" target="_blank" rel="noopener">[1]</a>`}</td></tr>`).join('')).join('')}</tbody></table></div>
      <div class="pw-src">Nguồn: Bộ Công Thương (văn bản từng dòng); đ/kWh, chưa gồm VAT</div>`;
    q2.append(tb); p.append(q2);
    // 4.3 so sánh giá điện công nghiệp (FPTS) và 4.4 hạn ngạch muối
    stage(p, 'cost', 'intl', 'So sánh', 'Giá điện các nước');
    const q3 = panel('·', 'Giá điện Việt Nam rẻ hay đắt hơn các nước xuất khẩu xút sang Việt Nam?');
    const d = card('xc-43', 'Giá điện công nghiệp theo quốc gia', {sub: 'US cent/kWh · số liệu FPTS tổng hợp từ Global Petrol Prices, công bố 05/2024', kind: 'document', cadence: 'event', source: SRC_FPTS + ' (tr. 21), Global Petrol Prices'});
    q3.append(d.el); p.append(q3);
    const pc = FP.power_price_compare?.rows || [];
    chart(d.host, 'xc-43', pc.map(r => r[0]), [{name: 'Giá điện công nghiệp', color: C.grey, kind: 'bar', values: pc.map(r => r[1])}], {unit: 'US cent/kWh', digits: 1, native: 'bar'});
    stage(p, 'cost', 'salt', 'Muối', 'Hạn ngạch nhập khẩu');
    const q4 = panel('·', 'Hạn ngạch nhập khẩu muối tăng hay giảm?');
    const f = card('xc-44', 'Hạn ngạch nhập khẩu muối (toàn nhóm HS 2501)', {sub: 'tấn · không riêng muối công nghiệp; ngoài hạn ngạch chịu thuế cao (khoảng 50%)', kind: 'document', cadence: 'annual', source: srcList((IN.salt_quota || []).filter(x => x.source_url).slice(-3).map(x => ({title: x.document, url: x.source_url}))), info: 'Hạn ngạch áp cho toàn nhóm HS 2501 (muối ăn, muối biến tính, NaCl tinh khiết, nước biển). Năm 2018–2020 chưa xác minh được số. Chưa có chuỗi giá muối công nghiệp nhập khẩu đủ hẹp để vẽ.'});
    q4.append(f.el); p.append(q4);
    const ALL = (IN.salt_quota || []).slice().sort((a, b) => a.year - b.year);
    chart(f.host, 'xc-44', ALL.map(x => String(x.year)), [{name: 'Hạn ngạch', color: C.teal, kind: 'bar', values: ALL.map(x => x.quota_tonnes ?? null)}], {unit: 'tấn', native: 'bar'});
    // 4.5 kịch bản chi phí điện trên tấn xút (người xem chọn định mức; vận hành liên tục 24h)
    const N = (IN.power_norm || []).filter(x => x.value_per_t_naoh_100 && fin(x.value_per_t_naoh_100.median ?? x.value_per_t_naoh_100.min));
    stage(p, 'cost', 'unit', 'Kịch bản', 'Chi phí điện trên tấn xút');
    if (N.length && last2) {
      const q5 = panel('·', 'Theo biểu giá hiện hành, tiền điện trên một tấn xút khoảng bao nhiêu (kịch bản)?');
      const g = el('div', 'card'); g.dataset.blockId = 'xc-45'; g.dataset.updateKind = 'document'; g.dataset.cadence = 'event';
      const H = {binh_thuong: 13, thap_diem: 6, cao_diem: 5};
      g.innerHTML = `<div class="chart-title">Chi phí điện ước tính theo kịch bản</div><div class="fb-gm-ctl">${seg('norm', N.map((x, i) => [String(i), x.source.split(',')[0].split('(')[0].trim() + ' · ' + nf(x.value_per_t_naoh_100.median ?? x.value_per_t_naoh_100.min) + ' kWh/t']), '0')}${seg('tier', last2.table.map((r, i) => [String(i), r.voltage]), '1')}</div><div class="xc-scn"></div>
        <div class="pw-src">Nguồn: định mức — ${esc(N.map(x => x.source).join('; '))}; giá — ${esc(last2.decision)} (chưa VAT); cơ cấu giờ: 6 giờ thấp điểm, 5 giờ cao điểm, 13 giờ bình thường (khung giờ QĐ 963/QĐ-BCT, ngày làm việc)</div>`;
      q5.append(g); p.append(q5);
      const SS = {norm: '0', tier: '1'};
      const calc = () => { const n = N[+SS.norm].value_per_t_naoh_100, kwh = n.median ?? n.min, r = last2.table[+SS.tier];
        const pr2 = (r.binh_thuong * H.binh_thuong + r.thap_diem * H.thap_diem + r.cao_diem * H.cao_diem) / 24;
        g.querySelector('.xc-scn').innerHTML = `<div class="xc-scn-row"><div><small>Định mức</small><b>${nf(kwh)}</b> kWh/tấn NaOH 100%</div><div><small>Giá điện bình quân theo cơ cấu giờ</small><b>${nf(pr2)}</b> đ/kWh</div><div><small>Chi phí điện</small><b>${nf(kwh * pr2 / 1e6, 2)}</b> triệu đồng/tấn NaOH 100%</div></div>`; };
      g.addEventListener('click', e => { const bt = e.target.closest('.fb-gm-seg button'); if (!bt) return; const gg = bt.parentElement; SS[gg.dataset.k] = bt.dataset.v; gg.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === bt))); calc(); });
      calc();
    }
    dropEmptyStages(p); finish(p, 4);
  }
};
// Ba cách đọc tác động của Nghi Sơn: chỉ tiêu, số hiện có, trạng thái dữ liệu (không kết luận khi chưa đủ dữ liệu phân biệt).
function readings() {
  const ya = years('vn_annual'), y = ya.at(-1), my = years('mirror_annual'), m1 = my.at(-1), m0 = my.at(-2);
  const mv = (f, yy) => rec('mirror_annual', yy, f)?.t;
  const hv = (PL.production || []).filter(x => x.company === 'HVT' && x.product === 'Xút (tổng số)' && /^\d{4}$/.test(x.year_or_period)).sort((a, b) => a.year_or_period.localeCompare(b.year_or_period));
  const R = [
    ['Thay thế hàng nhập', [`Lượng nhập xút rắn (số liệu đối tác) ${m1}: ${nf(mv('solid', m1) / 1000, 1)} nghìn tấn, ${sg((mv('solid', m1) / mv('solid', m0) - 1) * 100)}% so ${m0}`, 'Lượng bán xút nội địa: chưa có số cùng kỳ của CSV, HVT', 'Giá bán xút nội địa: chưa có chuỗi công bố']],
    ['Cạnh tranh giá nội địa', [`Đơn giá nhập khẩu xút rắn (Việt Nam báo cáo) ${y}: ${nf(rec('vn_annual', y, 'solid')?.price)} USD/tấn`, 'Biên gộp CSV, HVT: phạm vi toàn doanh nghiệp (tab Tài chính ngành)', 'Công suất thương mại mới: Nghi Sơn chưa vận hành']],
    ['Nguồn cung tăng chậm', ['Nghi Sơn: dây chuyền xút, PAC dự kiến Q4/2026; toàn dự án Q1/2027', hv.length ? `HVT sản xuất xút ${hv.at(-1).year_or_period}: ${nf(hv.at(-1).value)} tấn` : '', 'Số bán PAC, HCl của Nghi Sơn: chưa có số bán ra công bố']]];
  const c = el('div', 'card xc-read'); c.dataset.blockId = 'xc-90'; c.dataset.updateKind = 'document'; c.dataset.cadence = 'quarterly';
  c.innerHTML = `<div class="chart-title">Nghi Sơn tăng sản lượng: ba cách đọc và chỉ tiêu theo dõi</div>
    <div class="xc-read-grid">${R.map(([t, rows]) => `<div class="xc-read-c"><div class="xc-read-h"><b>${t}</b><span class="xc-read-st">Chưa đủ dữ liệu để kết luận</span></div><ul>${rows.filter(Boolean).map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>`).join('')}</div>
    <div class="pw-src">Kỳ quan sát: nhập khẩu theo năm (Việt Nam báo cáo đến ${y}, số liệu đối tác đến ${m1}); Nghi Sơn theo công bố đến 11/2026. Nguồn: UN Comtrade, BCTN HVT, DGC, Yuanta</div>`;
  return c;
}
// Thanh luồng và tiêu đề khâu (cùng .pp-flow/.pp-stage của Điện), 28/11/2026.
function flow(p, key, steps) {
  const bar = el('nav', 'pp-flow'); bar.setAttribute('aria-label', 'Các khâu trong sub-tab');
  bar.innerHTML = steps.map(([id, k, t], i) => `${i ? '<span class="pp-flow-ar" aria-hidden="true">→</span>' : ''}<a href="#mt2-pp-${key}-${id}" class="pp-flow-s" data-pp-stage="mt2-pp-${key}-${id}"><small>${k}</small><b>${esc(t)}</b></a>`).join('');
  bar.addEventListener('click', e => { const x = e.target.closest('[data-pp-stage]'); if (x) { e.preventDefault(); document.getElementById(x.dataset.ppStage)?.scrollIntoView({behavior: 'smooth', block: 'start'}); } });
  p.append(bar);
}
function stage(p, key, id, k, t) { const h = el('div', 'pp-stage', `<span>${k}</span><h3>${esc(t)}</h3>`); h.id = `mt2-pp-${key}-${id}`; p.append(h); }
// Khâu không có câu hỏi hay thẻ dẫn (dữ liệu chưa có) thì bỏ tiêu đề khâu và nút trên thanh luồng.
function dropEmptyStages(p) {
  p.querySelectorAll(':scope>.pp-stage').forEach(h => { const n = h.nextElementSibling; if (!n || n.classList.contains('pp-stage')) { p.querySelector(`.pp-flow [data-pp-stage="${h.id}"]`)?.remove(); h.remove(); } });
  p.querySelectorAll('.pp-flow').forEach(f => { f.querySelectorAll('.pp-flow-ar').forEach(ar => { if (!ar.nextElementSibling || ar.nextElementSibling.classList.contains('pp-flow-ar')) ar.remove(); }); const x = f.firstElementChild; if (x?.classList.contains('pp-flow-ar')) x.remove(); });
}
function renum(p, n) { p.querySelectorAll(':scope>.pp-panel .pp-num').forEach((x, i) => { x.textContent = `${n}.${i + 1}`; }); }
// Chuẩn §42: mỗi câu hỏi có chart chính .pp-main (thẻ đầu), chart phụ .pp-sup1, phần còn lại .pp-more; điều khiển đặt trước thẻ đầu giữ nguyên chỗ.
function mainify(root) {
  root.querySelectorAll('.pp-panel').forEach(q => {
    const hasMain = !!q.querySelector(':scope > .pp-main'), cards = [], after = []; let seen = hasMain;
    [...q.children].filter(n => !n.matches('header.pp-ph, .pp-main, .pp-sup1, .pp-more')).forEach(n => {
      if (n.matches('.card')) { cards.push(n); seen = true; }
      else if (n.matches('.grid') && n.querySelector(':scope > .card')) { cards.push(...n.children); n.remove(); seen = true; }
      else if (seen) after.push(n);
    });
    if (!cards.length) return;
    const out = [], rest = hasMain ? cards : cards.slice(1);
    if (!hasMain) { const m = el('div', 'pp-main'); m.append(cards[0]); out.push(m); }
    if (rest.length === 1) { const w = el('div', 'pp-sup1'); w.append(rest[0]); out.push(w); }
    else if (rest.length === 2) { const w = el('div', 'grid two g2 pp-sup pp-more'); w.append(...rest); out.push(w); }
    else if (rest.length > 2) { const w = el('div', 'pp-sup1'); w.append(rest[0]); const g = el('div', 'grid two g2 pp-sup pp-more'); g.append(...rest.slice(1)); out.push(w, g); }
    q.append(...out, ...after);
  });
}
// Thẻ dẫn sang chart ở sub-tab khác (dời, không nhân bản): bấm thì mở sub-tab và cuộn tới thẻ.
function xlink(p, sub, where, title, desc, block) {
  const a = el('a', 'th-link', `<small>Xem chart ở ${esc(where)}</small><b>${esc(title)} →</b><span>${esc(desc)}</span>`);
  a.href = `?sub=${sub}#mt2`; a.dataset.goSub = sub; if (block) a.dataset.goBlock = block; p.append(a);
}
function finish(p, n) { mainify(p); renum(p, n); }
const BUILT = new Set();
function showPic(key, write = true) {
  if (!PIC[key]) key = 'import';
  $$('#pane-mt2 .pp-pane').forEach(p => { p.hidden = p.dataset.sub !== key; });
  $$('#pane-mt2 .pp-tab').forEach(b => { const on = b.dataset.sub === key; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
  if (!BUILT.has(key)) { BUILT.add(key); try { PIC[key](); } catch (e) { console.error(e); } }
  if (write) { const u = new URL(location.href); u.searchParams.set('sub', key); history.replaceState(null, '', u.pathname + u.search + u.hash); }
  setTimeout(() => window.dispatchEvent(new Event('resize')), 30);
}
function showOv(key) {
  $$('#pane-mt1 .ov-pane').forEach(p => { p.hidden = p.dataset.ov !== key; });
  $$('#pane-mt1 .ov-tab').forEach(b => { const on = b.dataset.ov === key; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
  setTimeout(() => window.dispatchEvent(new Event('resize')), 30);
}
// Tài chính ngành › 01 Tài chính ngành · 02 Doanh nghiệp niêm yết (03 Định giá do app/peer-valuation.js tự thêm, khóa valuation).
const FIN_SUBS = ['sector', 'listed'];
let LISTED_DONE = false;
function showFin(key, write = true) {
  if (!FIN_SUBS.includes(key)) key = 'sector';
  const sec = $('#pane-mt14 .pp-nav')?.parentElement; if (!sec) return;
  sec.querySelectorAll(':scope > .pp-pane').forEach(p => { p.hidden = p.dataset.fin !== key; if (!p.dataset.fin) p.style.display = 'none'; });
  sec.querySelectorAll('.pp-nav .pp-tab').forEach(b => { const on = b.dataset.fin === key; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); });
  if (key === 'sector' && window.XcFinance && !$('#xc-fin-root').childElementCount) { XcFinance.build($('#xc-fin-root')); mainify($('#xc-fin-root')); }
  if (key === 'listed' && !LISTED_DONE) { LISTED_DONE = true; const pane = $('#xc-fin-listed'); if (pane && window.ListedCompare && F) ListedCompare.mount(F, {prefix: 'xc-fin-dn', src: SRC.vnd}).forEach(q => pane.append(q)); if (pane) { mainify(pane); renum(pane, 2); } }
  if (write) { const u = new URL(location.href); u.searchParams.set('sub', key); history.replaceState(null, '', u.pathname + u.search + u.hash); }
  setTimeout(() => window.dispatchEvent(new Event('resize')), 30);
}
// Link cũ: #mt3 (Tài chính ngành trước 28/11/2026) → #mt14.
const TAB_ALIAS = {mt3: 'mt14'};
function showTab(key) {
  key = TAB_ALIAS[key] || key;
  if (!$(`.majorpane[data-tab="${key}"]`)) key = 'mt1';
  $$('.majorpane').forEach(p => p.classList.toggle('active', p.dataset.tab === key));
  $$('.majortabbtn').forEach(b => { const on = b.dataset.tab === key; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); });
  if (location.hash !== '#' + key) history.replaceState(null, '', location.pathname + location.search + '#' + key);
  if (key === 'mt14') { const cur = $('#pane-mt14 .pp-nav .pp-tab[aria-selected="true"]')?.dataset.fin; if (cur) showFin(cur, false); }
  setTimeout(() => window.dispatchEvent(new Event('resize')), 30);
}
function asof() {
  const pl = () => { const d = (PL.plants || []).map(x => String(x.as_of || '').slice(0, 10)).filter(Boolean).sort().at(-1) || ''; return d.length === 10 ? dL(d) : d.length === 7 ? ymL(d.replace('-', '')) : d; };
  const ng = () => { const d = (PL.nghison_timeline || []).map(e => String(e.date_published || '').slice(0, 10)).filter(x => x.length === 10).sort().at(-1); return d ? dL(d) : pl(); };
  const t = {trade: () => `Comtrade: Việt Nam báo cáo ${years('vn_annual').at(-1)}, đối tác ${years('mirror_annual').at(-1)}`,
    plants: () => `tài liệu doanh nghiệp ${pl()}`, nghison: () => `công bố ${ng()}`, p4: () => { const x = (D.p4?.monthly || []).at(-1); return x ? `giá P4 ${dL(x.date)} (Sunsirs)` : ''; },
    power: () => { const x = (IN.tariffs || []).at(-1); return x ? `biểu giá điện hiệu lực ${dL(x.effective)}` : ''; },
    fin: () => F ? `BCTC đến ${qL(F.periods.at(-1))} · tải ${dL(F.captured)}` : '',
    listed: () => { const v = window.COMPANY_VALUATION?.companies?.DGC?.date; return `BCTC ${F ? qL(F.periods.at(-1)) : ''}${v ? ' · P/E phiên ' + dL(v) : ''}`; }};
  $$('[data-asof]').forEach(n => { try { n.textContent = 'Dữ liệu mới nhất: ' + t[n.dataset.asof](); } catch (e) { n.textContent = ''; } });
}
function init() {
  brief(); overview(); listed(); asof();
  $$('#pane-mt1 .ov-tab').forEach(b => b.addEventListener('click', () => showOv(b.dataset.ov)));
  $$('#pane-mt2 .pp-tab').forEach(b => b.addEventListener('click', () => showPic(b.dataset.sub)));
  $$('#pane-mt14 .pp-tab[data-fin]').forEach(b => b.addEventListener('click', () => showFin(b.dataset.fin)));
  $$('.majortabbtn').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));
  addEventListener('hashchange', () => showTab(location.hash.slice(1)));
  // Thẻ dẫn sang sub-tab khác của Bức tranh ngành.
  document.addEventListener('click', e => {
    const a = e.target.closest('a.th-link[data-go-sub]'); if (!a) return;
    e.preventDefault(); showTab('mt2'); showPic(a.dataset.goSub);
    const t = a.dataset.goBlock && $(`#pane-mt2 [data-block-id="${a.dataset.goBlock}"]`);
    setTimeout(() => (t || $('#pane-mt2 .pp-nav'))?.scrollIntoView({behavior: 'smooth', block: 'start'}), 60);
  });
  showOv('map');
  const sub = new URLSearchParams(location.search).get('sub') || '', hash = TAB_ALIAS[location.hash.slice(1)] || location.hash.slice(1);
  const finSub = ['sector', 'listed', 'valuation'].includes(sub);
  showPic(finSub ? 'import' : sub || 'import', !finSub);
  if (finSub && sub !== 'valuation') showFin(sub);
  // 03 Định giá (app/peer-valuation.js): gắn ngay khi dựng trang thay vì chờ sự kiện load; chart dựng lúc sub-tab ẩn nên vẽ lại kích thước khi mở sub-tab.
  try { window.PeerValuation?.auto?.(); } catch (e) { console.error(e); }
  $('#pane-mt14 .pp-nav')?.addEventListener('click', e => { if (e.target.closest('[data-sub="valuation"]')) setTimeout(() => $$('#of-mt14-valuation canvas').forEach(c => window.Chart?.getChart?.(c)?.resize()), 80); });
  showTab(finSub && !hash ? 'mt14' : hash || 'mt1');
}
if (window.SectorBoot) SectorBoot.add(10, init); else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
