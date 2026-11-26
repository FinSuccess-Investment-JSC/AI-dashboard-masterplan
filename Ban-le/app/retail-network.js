/* Bán lẻ › Bức tranh ngành › Mạng lưới bán lẻ (27/11/2026). Dữ liệu: window.RETAIL_BIZMAP (data/retail-bizmap.js,
   sinh bởi scripts/fetch_bizmap.py từ API bizmap.live; ảnh chụp đầu tiên lấy từ trang thương hiệu công khai).
   - Chỉ dùng số tổng hợp theo chuỗi / tỉnh. Không có tọa độ từng cửa hàng (chưa xác nhận quyền tái phân phối):
     bản đồ vẽ vòng tròn theo tỉnh, đặt ở trung tâm hành chính tỉnh (gần đúng).
   - Chế độ "directory" (chưa có API key): chỉ có tổng, số tỉnh, 3 tỉnh lớn nhất → bản đồ vẽ 3 tỉnh đó; các chart cần đủ 34 tỉnh tự ẩn.
   - Số chính thức (doanh nghiệp công bố, có evidence ở bl-14) đặt cạnh số Bizmap ghi nhận; không ghi đè.
   - Màu thương hiệu dùng chung cho mọi chart trong module. Gọi trang dùng các hàm vẽ inline (barLineChart, hbarCompare, fillTable). */
(() => {
'use strict';
if (document.body.dataset.sector !== 'retail' || document.body.dataset.pkg) return;
const D = window.RETAIL_BIZMAP; if (!D?.chains) return;
const $ = s => document.querySelector(s), byId = id => document.getElementById(id);
const make = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const nf = (v, d = 0) => Number.isFinite(v) ? v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}) : '—';
const dd = s => s ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4) : '—';

const BRAND = {'bach-hoa-xanh': ['#1E8F4E', 'BHX'], 'winmart-plus': ['#C8102E', 'W+'], 'the-gioi-di-dong': ['#E0A800', 'TGDĐ'], 'dien-may-xanh': ['#1F5FBF', 'ĐMX'],
  'an-khang': ['#7CB342', 'AK'], 'avakids': ['#D63384', 'AVA'], 'long-chau': ['#14306B', 'LC'], 'fpt-shop': ['#E4572E', 'FPT'], 'pnj': ['#9C6B1E', 'PNJ']};
const CAT = {food: 'Thực phẩm', ict: 'ICT', appliance: 'Điện máy', pharma: 'Dược phẩm', jewelry: 'Trang sức', mother: 'Mẹ & bé'};
// Số doanh nghiệp công bố (đã có evidence ở bl-14/bl-15, data/retail/evidence.json). scope: true = cùng phạm vi với chuỗi Bizmap.
const OFFICIAL = {'bach-hoa-xanh': [3904, '30/9/2026', true], 'the-gioi-di-dong': [919, '30/9/2026', true], 'dien-may-xanh': [1998, '30/9/2026', true],
  'an-khang': [438, '30/9/2026', true], 'avakids': [95, '30/9/2026', true], 'long-chau': [2741, 'cuối Q3/2026', true, 'nhà thuốc; chưa gồm 244 trung tâm tiêm chủng'],
  'fpt-shop': [622, 'Q3/2026', true], 'pnj': [424, 'cuối Q3/2026', true], 'winmart-plus': [5141, 'cuối Q2/2026', false, 'WinCommerce gồm cả WinMart siêu thị; Bizmap chỉ có WinMart+']};
// Trung tâm hành chính 34 tỉnh/thành (gần đúng) — chỉ để đặt vòng tròn trên bản đồ.
const XY = {'Hà Nội': [21.03, 105.85], 'Hải Phòng': [20.84, 106.69], 'Quảng Ninh': [20.95, 107.08], 'Bắc Ninh': [21.27, 106.19], 'Hưng Yên': [20.45, 106.34],
  'Ninh Bình': [20.25, 105.97], 'Phú Thọ': [21.32, 105.40], 'Thái Nguyên': [21.59, 105.85], 'Tuyên Quang': [21.82, 105.21], 'Lào Cai': [21.70, 104.87],
  'Lạng Sơn': [21.85, 106.76], 'Cao Bằng': [22.67, 106.26], 'Lai Châu': [22.40, 103.46], 'Điện Biên': [21.39, 103.02], 'Sơn La': [21.33, 103.91],
  'Thanh Hóa': [19.81, 105.78], 'Nghệ An': [18.68, 105.68], 'Hà Tĩnh': [18.34, 105.91], 'Quảng Trị': [17.47, 106.62], 'Huế': [16.46, 107.59],
  'Đà Nẵng': [16.05, 108.20], 'Quảng Ngãi': [15.12, 108.81], 'Gia Lai': [13.78, 109.22], 'Khánh Hòa': [12.24, 109.20], 'Đắk Lắk': [12.67, 108.04],
  'Lâm Đồng': [11.94, 108.46], 'Hồ Chí Minh': [10.78, 106.70], 'Đồng Nai': [10.96, 106.84], 'Tây Ninh': [10.54, 106.41], 'Cần Thơ': [10.05, 105.75],
  'Vĩnh Long': [10.25, 105.97], 'Đồng Tháp': [10.36, 106.36], 'An Giang': [10.01, 105.08], 'Cà Mau': [9.18, 105.15]};

const S = Object.entries(D.chains).map(([slug, c]) => ({slug, ...c, color: BRAND[slug]?.[0] || '#6b7686', ab: BRAND[slug]?.[1] || c.name.slice(0, 3)}));
const api = D.mode === 'api' && S.every(c => c.provinces && Object.keys(c.provinces).length);
const provOf = c => api ? c.provinces : Object.fromEntries((c.top_provinces || []).map(x => [x.province, x.stores]));
const SRC_TXT = `Bizmap.live (${api ? 'API' : 'trang thương hiệu công khai'}), cập nhật ${dd(D.source_updated)}`;
const state = {sel: new Set(['bach-hoa-xanh', 'winmart-plus']), ticker: '', cat: '', prov: '', heat: false, share: false, group: 'ticker'};
const visible = () => S.filter(c => (!state.ticker || c.ticker === state.ticker) && (!state.cat || c.category === state.cat));
const chosen = () => visible().filter(c => state.sel.has(c.slug));

function src(card, text) { if (!card || card.querySelector(':scope>.pw-src')) return; const n = make('div', 'pw-src'); n.innerHTML = 'Nguồn: <a href="https://bizmap.live/" target="_blank" rel="noopener">' + esc(text) + '</a>'; n.dataset.tidied = n.innerHTML; card.append(n); }
function take(id, text) { const h = byId(id); if (!h) return null; const n = make('div', 'chart-insight'); n.dataset.inputOwner = 'ai'; n.innerHTML = '<b>Cách hiểu trong bối cảnh ngành · AI:</b> '; n.append(text); h.closest('.card')?.append(n); return h; }
const drop = id => byId(id)?.closest('.card')?.remove();

/* ---------- Bộ lọc + ô số ---------- */
function history(slug) {
  const H = (D.history || []).filter(s => s.chains?.[slug]); if (H.length < 2) return null;
  const last = H.at(-1), t0 = new Date(last.date); const prev = [...H].reverse().find(s => (t0 - new Date(s.date)) / 864e5 >= 28);
  return prev ? last.chains[slug].stores - prev.chains[slug].stores : null;
}
function renderKpis() {
  const host = byId('bnKpis'); if (!host) return;
  host.innerHTML = chosen().map(c => { const d = history(c.slug);
    return `<div class="bn-kpi" style="--bc:${c.color}"><div class="bn-kpi-h">${c.logo_url ? `<img src="${esc(c.logo_url)}" alt="" loading="lazy">` : `<span class="bn-badge">${esc(c.ab)}</span>`}<b>${esc(c.name)}</b><small>${esc(c.ticker)}</small></div>
      <div class="bn-kpi-v">${nf(c.stores)}<span>điểm bán</span></div><div class="bn-kpi-s">${c.province_count}/34 tỉnh/thành · ${d == null ? 'theo dõi từ ' + dd(D.tracking_since) : (d >= 0 ? '+' : '') + nf(d) + ' trong 30 ngày'}</div></div>`; }).join('') || '<p class="bn-empty">Chọn ít nhất một chuỗi.</p>';
}
function renderFilters() {
  const host = byId('bnFilters'); if (!host) return;
  const opt = (v, l, cur) => `<option value="${esc(v)}"${v === cur ? ' selected' : ''}>${esc(l)}</option>`;
  const provs = [...new Set(S.flatMap(c => Object.keys(provOf(c))))].sort((a, b) => a.localeCompare(b, 'vi'));
  host.innerHTML = `<div class="bn-chips">${visible().map(c => `<button type="button" class="bn-chip${state.sel.has(c.slug) ? ' on' : ''}" data-slug="${c.slug}" style="--bc:${c.color}" aria-pressed="${state.sel.has(c.slug)}"><i></i>${esc(c.name)}</button>`).join('')}</div>
    <div class="bn-sel"><label>Mã <select data-f="ticker">${opt('', 'Tất cả')}${['MWG', 'MSN', 'FRT', 'PNJ'].map(t => opt(t, t, state.ticker)).join('')}</select></label>
    <label>Ngành <select data-f="cat">${opt('', 'Tất cả')}${Object.entries(CAT).map(([k, l]) => opt(k, l, state.cat)).join('')}</select></label>
    <label>Tỉnh/thành <select data-f="prov">${opt('', 'Cả nước')}${provs.map(p => opt(p, p, state.prov)).join('')}</select></label></div>`;
  host.querySelectorAll('.bn-chip').forEach(b => b.addEventListener('click', () => { const s = b.dataset.slug; state.sel.has(s) ? state.sel.delete(s) : state.sel.add(s); update(); }));
  host.querySelectorAll('select').forEach(s => s.addEventListener('change', () => { state[s.dataset.f] = s.value; if (s.dataset.f !== 'prov') visible().forEach(c => state.sel.add(c.slug)); update(); }));
}

/* ---------- Bản đồ (Leaflet, nạp khi mở) ---------- */
const LEAF_JS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js', LEAF_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
const load = (u, css) => new Promise((ok, no) => { if (css ? document.querySelector(`link[href="${u}"]`) : document.querySelector(`script[src="${u}"]`)) return ok();
  const n = css ? Object.assign(document.createElement('link'), {rel: 'stylesheet', href: u}) : Object.assign(document.createElement('script'), {src: u}); n.onload = ok; n.onerror = no; document.head.append(n); });
let map = null, layer = null;
function initMap() {
  const box = byId('bnMap'); if (!box || map !== null) return; map = false;
  Promise.all([load(LEAF_CSS, true), load(LEAF_JS), window.GAS_BASE ? null : load('app/vn-base.js')]).then(() => {
    const L = window.L; box.innerHTML = '';
    map = L.map(box, {zoomSnap: 0.25, minZoom: 5, maxZoom: 10, attributionControl: false, maxBounds: [[3.5, 100.5], [25.5, 120.5]], maxBoundsViscosity: 0.8});
    map.fitBounds([[8.3, 102.2], [23.4, 110.2]]);
    L.control.attribution({prefix: false}).addAttribution('Nền: Natural Earth · Số cửa hàng: <a href="https://bizmap.live/" target="_blank" rel="noopener">bizmap.live</a>').addTo(map);
    L.geoJSON(window.GAS_BASE, {interactive: false, style: f => { const r = f.properties.role; return r === 'vn' || r === 'vn-isl' ? {color: '#9aa6c4', weight: 0.8, fillColor: '#ffffff', fillOpacity: 1} : {color: '#c6ccda', weight: 0.6, fillColor: '#eef0f5', fillOpacity: 1}; }}).addTo(map);
    [[16.45, 112.05, 'QĐ. Hoàng Sa (Việt Nam)'], [9.6, 114.3, 'QĐ. Trường Sa (Việt Nam)']].forEach(([la, lo, t]) => L.marker([la, lo], {interactive: false, icon: L.divIcon({className: 'bn-isl', html: esc(t), iconSize: null})}).addTo(map));
    layer = L.layerGroup().addTo(map); drawMap();
    new ResizeObserver(() => map.invalidateSize()).observe(box);
  }).catch(() => { box.textContent = 'Không tải được thư viện bản đồ (Leaflet, cdnjs).'; });
}
function drawMap() {
  if (!map || !layer) return; const L = window.L; layer.clearLayers();
  const cs = chosen(), agg = {};
  cs.forEach(c => Object.entries(provOf(c)).forEach(([p, n]) => { (agg[p] = agg[p] || {total: 0, rows: []}).total += n; agg[p].rows.push([c, n]); }));
  const max = Math.max(1, ...Object.values(agg).map(a => a.total));
  Object.entries(agg).sort((a, b) => b[1].total - a[1].total).forEach(([p, a]) => {
    const xy = XY[p]; if (!xy) return;
    const r = 6 + 34 * Math.sqrt(a.total / max), top = a.rows.sort((x, y) => y[1] - x[1])[0][0];
    const style = state.heat ? {radius: r, color: 'transparent', fillColor: '#C8102E', fillOpacity: 0.15 + 0.7 * a.total / max} : {radius: r, color: '#fff', weight: 1.5, fillColor: a.rows.length > 1 ? '#3D4352' : top.color, fillOpacity: 0.78};
    const m = L.circleMarker(xy, style).addTo(layer);
    m.bindPopup(`<b>${esc(p)}</b> · ${nf(a.total)} điểm bán<br>` + a.rows.map(([c, n]) => `<span style="color:${c.color}">●</span> ${esc(c.name)}: ${nf(n)}`).join('<br>'));
    if (a.rows.length > 1 && !state.heat) a.rows.forEach(([c, n], i) => L.circleMarker(xy, {radius: Math.max(3, r * Math.sqrt(n / a.total)), color: c.color, weight: 2, fill: false, interactive: false}).addTo(layer));
  });
  if (state.prov && XY[state.prov]) map.setView(XY[state.prov], 8); else map.fitBounds([[8.3, 102.2], [23.4, 110.2]]);
  const lg = byId('bnMapLegend');
  if (lg) lg.innerHTML = cs.map(c => `<span><i style="background:${c.color}"></i>${esc(c.name)}</span>`).join('') + (cs.length > 1 ? '<span><i style="background:#3D4352"></i>Tỉnh có từ 2 chuỗi (viền màu từng chuỗi)</span>' : '') +
    `<button type="button" class="rf-tog${state.heat ? ' on' : ''}" data-heat>Mật độ</button>`;
  lg?.querySelector('[data-heat]')?.addEventListener('click', () => { state.heat = !state.heat; drawMap(); });
}

/* ---------- Chart ---------- */
function renderScale() {
  if (!byId('bnScale')) return;
  const by = state.group === 'ticker' ? c => c.ticker : c => CAT[c.category];
  const rows = [...S].sort((a, b) => by(a).localeCompare(by(b), 'vi') || b.stores - a.stores);
  hbarCompare('bnScale', {items: rows.map(c => ({label: `${c.name} · ${by(c)}`, value: c.stores, color: c.color})), unit: 'điểm bán', digits: 0, labelW: 210, ariaLabel: 'Số điểm bán Bizmap ghi nhận theo chuỗi'});
}
function renderOfficial() {
  if (!byId('bnOfficial')) return;
  const rows = S.filter(c => OFFICIAL[c.slug]);
  barLineChart('bnOfficial', {categories: rows.map(c => c.name), series: [{name: 'Doanh nghiệp công bố', color: '#1D2678', values: rows.map(c => OFFICIAL[c.slug][0])}, {name: 'Bizmap ghi nhận', color: '#9AAAC8', values: rows.map(c => c.stores)}], unit: 'điểm bán', digits: 0, height: 280, rotateLabels: true});
  fillTable('tbl-bn-official', ['Chuỗi', 'Công bố', 'Kỳ công bố', 'Bizmap ghi nhận', 'Ngày Bizmap', 'Độ phủ dữ liệu', 'Ghi chú phạm vi'], rows.map(c => { const [o, k, same, note] = OFFICIAL[c.slug];
    return [c.name, nf(o), k, nf(c.stores), dd(c.source_updated || D.source_updated), same ? nf(c.stores / o * 100, 0) + '%' : 'không so (khác phạm vi)', note || 'cùng phạm vi chuỗi']; }));
}
function stackRows(host, rows, keys, colors, share) {
  host.className = 'rf-chmix';
  host.innerHTML = '<ul class="rf-chmix-leg">' + keys.map((k, i) => `<li><i style="background:${colors[i]}"></i>${esc(k)}</li>`).join('') + '</ul>' + rows.map(([lab, vals]) => { const t = vals.reduce((a, b) => a + b, 0) || 1;
    return `<div class="rf-chmix-row bn-row"><b>${esc(lab)}</b><div class="rf-stack">${vals.map((v, i) => `<span class="rf-seg" style="flex:${v} 1 0;background:${colors[i]};color:${i === keys.length - 1 && colors[i] === '#C9CDD6' ? '#1d2333' : '#fff'}" title="${esc(keys[i])}: ${nf(v)} (${nf(v / t * 100, 1)}%)">${v / t >= .08 ? (share ? nf(v / t * 100, 0) + '%' : nf(v)) : ''}</span>`).join('')}</div></div>`; }).join('');
}
function renderRegion() {
  const host = byId('bnRegion'); if (!host) return;
  if (api) stackRows(host, S.map(c => [c.name, ['Bắc', 'Trung', 'Nam'].map(r => c.regions?.[r] || 0)]), ['Miền Bắc', 'Miền Trung', 'Miền Nam'], ['#1D2678', '#59C5C8', '#C8102E'], state.share);
  else stackRows(host, S.map(c => { const t = (c.top_provinces || []).map(x => x.stores); return [c.name, [...t, Math.max(0, c.stores - t.reduce((a, b) => a + b, 0))]]; }), ['Tỉnh lớn nhất', 'Tỉnh thứ 2', 'Tỉnh thứ 3', 'Các tỉnh còn lại'], ['#1D2678', '#4A62C4', '#9AAAC8', '#C9CDD6'], true);
}
const POP = D.population || {}, UNIT = {false: 'điểm bán', true: '% mạng lưới', pop: 'điểm bán / 10.000 dân'};
// Số điểm bán, % trong mạng lưới của chuỗi, hoặc điểm bán trên 10.000 dân (dân số tỉnh theo Bizmap/WorldPop).
function metric(c, p) { const v = c.provinces?.[p] || 0; return state.share === 'pop' ? (POP[p] ? v / POP[p] * 1e4 : null) : state.share ? v / c.stores * 100 : v; }
function keyProvinces(n = 8) { const t = {}; S.forEach(c => Object.entries(provOf(c)).forEach(([p, v]) => { t[p] = (t[p] || 0) + v; })); return Object.entries(t).sort((a, b) => b[1] - a[1]).slice(0, n).map(x => x[0]); }
function renderProv() {
  if (!byId('bnProv')) return; const P = keyProvinces(8), cs = chosen().length ? chosen() : S;
  barLineChart('bnProv', {categories: P, series: cs.map(c => ({name: c.name, color: c.color, values: P.map(p => metric(c, p))})), unit: UNIT[String(state.share)], digits: state.share ? 1 : 0, height: 280, rotateLabels: false});
}
function renderHeat() {
  const host = byId('bnHeat'); if (!host) return;
  const P = state.prov ? [state.prov] : keyProvinces(20), cs = S;
  const val = metric;
  const max = Math.max(1, ...cs.flatMap(c => P.map(p => val(c, p))));
  host.innerHTML = `<div class="bn-heat-w"><table class="bn-heat"><thead><tr><th>Tỉnh/thành</th>${cs.map(c => `<th style="--bc:${c.color}">${esc(c.ab)}</th>`).join('')}</tr></thead><tbody>${P.map(p => `<tr><th>${esc(p)}</th>${cs.map(c => { const v = val(c, p);
    return `<td style="background:rgba(29,38,120,${(0.06 + 0.86 * v / max).toFixed(2)});color:${v / max > 0.45 ? '#fff' : 'inherit'}" title="${esc(c.name)} · ${esc(p)}: ${state.share ? nf(v, state.share === 'pop' ? 2 : 1) + ' ' + UNIT[String(state.share)] : nf(v) + ' điểm bán'}">${v ? (state.share ? nf(v, state.share === 'pop' ? 2 : 1) : nf(v)) : '·'}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function renderHist() {
  if (!byId('bnHist')) return; const H = D.history || [];
  barLineChart('bnHist', {categories: H.map(s => dd(s.date)), series: S.map(c => ({name: c.name, color: c.color, kind: 'line', values: H.map(s => s.chains?.[c.slug]?.stores ?? null)})), unit: 'điểm bán', digits: 0, height: 280, rotateLabels: true, zeroBase: false});
}
function update() { renderFilters(); renderKpis(); drawMap(); renderProv(); renderHeat(); }

function toggles(id, opts, key) {
  const host = byId(id); if (!host) return; const bar = make('div', 'rf-ctl'); host.before(bar);
  opts.forEach(([v, l]) => { const b = make('button', 'rf-tog' + (state[key] === v ? ' on' : ''), esc(l)); b.type = 'button'; b.addEventListener('click', () => { state[key] = v; [...bar.children].forEach(x => x.classList.toggle('on', x === b)); key === 'group' ? renderScale() : (renderRegion(), renderProv(), renderHeat()); }); bar.append(b); });
}

/* ---------- Dựng ---------- */
if (!api) { drop('bnProv'); drop('bnHeat'); }
if ((D.history || []).length < 2) drop('bnHist');
renderFilters(); renderKpis(); renderScale(); renderOfficial(); renderRegion(); if (api) { renderProv(); renderHeat(); } if ((D.history || []).length >= 2) renderHist();
toggles('bnScale', [['ticker', 'Theo doanh nghiệp'], ['cat', 'Theo ngành bán lẻ']], 'group');
if (api) toggles('bnProv', [[false, 'Số điểm bán'], [true, 'Tỷ trọng trong mạng lưới'], ...(Object.keys(POP).length ? [['pop', 'Trên 10.000 dân']] : [])], 'share');

const tot = c => S.find(x => x.slug === c);
const bhx = tot('bach-hoa-xanh'), wm = tot('winmart-plus');
src(byId('bnKpis')?.closest('.card'), SRC_TXT);
src(byId('bnMap')?.closest('.card'), SRC_TXT + (api ? '' : ' · 3 tỉnh nhiều cửa hàng nhất mỗi chuỗi'));
src(byId('bnScale')?.closest('.card'), SRC_TXT); src(byId('bnRegion')?.closest('.card'), SRC_TXT);
src(byId('bnOfficial')?.closest('.card'), 'Bizmap.live; số công bố: báo cáo doanh nghiệp (Bán lẻ hiện đại › 2.2)');
src(byId('bnProv')?.closest('.card'), SRC_TXT + ' · dân số: WorldPop qua bizmap.live'); src(byId('bnHeat')?.closest('.card'), SRC_TXT + ' · dân số: WorldPop qua bizmap.live'); src(byId('bnHist')?.closest('.card'), SRC_TXT);
byId('bnMap')?.after(make('div', 'source-note method-note', 'Vòng tròn đặt tại trung tâm hành chính tỉnh/thành (34 đơn vị từ 01/07/2025), diện tích theo số điểm bán. Không hiển thị tọa độ từng cửa hàng khi chưa xác nhận quyền tái phân phối dữ liệu của bizmap.live.' + (api ? '' : ' Hiện có 3 tỉnh nhiều cửa hàng nhất của mỗi chuỗi.')));
byId('bnOfficial')?.after(make('div', 'source-note method-note', 'Độ phủ dữ liệu = Bizmap ghi nhận ÷ số công bố, chỉ tính khi cùng phạm vi chuỗi; hai nguồn khác ngày (công bố cuối quý, Bizmap ' + dd(D.source_updated) + '). Phân tích doanh thu/cửa hàng dùng số công bố; Bizmap dùng cho phân bố địa lý.'));
byId('bnRegion')?.after(make('div', 'source-note method-note', api ? 'Miền Trung gồm cả Tây Nguyên, Nam Trung Bộ. Tỷ trọng tính trên số điểm bán Bizmap ghi nhận, không phải thị phần doanh thu.' : 'Tỷ trọng 3 tỉnh nhiều cửa hàng nhất trong tổng điểm bán Bizmap ghi nhận của từng chuỗi; không phải thị phần doanh thu.'));
take('bnKpis', `WinMart+ ghi nhận ${nf(wm.stores)} điểm bán ở ${wm.province_count}/34 tỉnh, Bách Hóa Xanh ${nf(bhx.stores)} điểm ở ${bhx.province_count} tỉnh: BHX dồn vào phía Nam nên còn ${34 - bhx.province_count} tỉnh chưa có mặt. Kiểm tiếp số tỉnh BHX hiện diện qua các ảnh chụp tuần.`);
take('bnMap', 'Hai chuỗi thực phẩm lớn có trọng tâm ngược nhau: WinMart+ mạnh nhất ở Hà Nội, BHX ở TP.HCM và miền Đông Nam Bộ, nên cạnh tranh trực diện tập trung ở các tỉnh cả hai cùng dày. Kiểm tiếp số điểm mới ở tỉnh còn trống của mỗi chuỗi.');
const over = S.filter(c => OFFICIAL[c.slug]?.[2] && c.stores > OFFICIAL[c.slug][0] * 1.1).map(c => c.name);
take('bnOfficial', (over.length ? `Bizmap ghi nhận nhiều hơn số công bố ở ${over.join(', ')}, có thể gồm điểm đã đóng hoặc định dạng khác, nên không dùng Bizmap để tính doanh thu/cửa hàng. ` : '') + 'Kiểm tiếp số công bố cuối năm của MWG, FRT, PNJ để cập nhật độ phủ.');
const regShare = (c, r) => c?.regions ? c.regions[r] / Object.values(c.regions).reduce((x, y) => x + y, 0) * 100 : null;
take('bnRegion', api ? `BHX có ${nf(regShare(bhx, 'Nam'))}% điểm bán ở miền Nam, WinMart+ có ${nf(regShare(wm, 'Bắc'))}% ở miền Bắc: hai chuỗi thực phẩm lớn mạnh ở hai đầu đất nước, phần còn mỏng của mỗi bên là dư địa mở rộng nhưng kèm chi phí kho vận mới. Kiểm tiếp tỷ trọng miền qua các ảnh chụp tuần.` : 'Chuỗi có 3 tỉnh lớn nhất chiếm phần lớn mạng lưới (BHX, AVAKids, An Khang) phụ thuộc vào sức mua của ít địa phương; chuỗi phủ đều (WinMart+, Long Châu, TGDĐ) ít rủi ro tập trung hơn. Kiểm tiếp khi có đủ phân bổ 34 tỉnh.');
take('bnScale', 'Số điểm bán Bizmap ghi nhận, không phải thị phần doanh thu: chuỗi thực phẩm và nhà thuốc có nhiều điểm nhất nhưng doanh thu mỗi điểm thấp hơn điện máy, trang sức. Đối chiếu doanh thu/cửa hàng ở mục 2.2.');

// Bản đồ nạp khi khối hiện ra (pane ẩn thì chưa tải Leaflet).
const mapBox = byId('bnMap');
if (mapBox) {
  const tryInit = () => { if (map === null && mapBox.isConnected && mapBox.offsetWidth > 0) initMap(); };
  if ('IntersectionObserver' in window) { const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); tryInit(); } }); io.observe(mapBox); }
  // khung tab (retail-frame.js) phát 'resize' sau mỗi lần mở tab/sub-tab → nạp bản đồ khi khối đã hiện.
  window.addEventListener('resize', tryInit); window.addEventListener('rf:frame', () => setTimeout(tryInit, 50));
}
window.RetailNetwork = {state, update};
})();
