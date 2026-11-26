/* Bán lẻ › Bức tranh ngành › Mạng lưới bán lẻ (27/11/2026). Dữ liệu: window.RETAIL_BIZMAP (data/retail-bizmap.js,
   sinh bởi scripts/fetch_bizmap.py từ API bizmap.live): 38 chuỗi chia 5 nhóm cạnh tranh — chuỗi của doanh nghiệp niêm yết
   (MWG, MSN, FRT, PNJ) và đối thủ chưa niêm yết cùng mô hình (Co.opmart, Kingfoodmart, Circle K, MediaMart, Pharmacity, DOJI…).
   - Chỉ số tổng hợp theo chuỗi / tỉnh / miền; không có tọa độ từng cửa hàng (chưa xác nhận quyền tái phân phối).
   - Bản đồ: mỗi tỉnh một hình tròn chia múi theo chuỗi đang chọn, đặt ở trung tâm hành chính tỉnh (gần đúng).
   - Bảng 3 miền Bắc / Trung / Nam cho cả nhóm; số doanh nghiệp công bố (bl-14) chỉ đối chiếu, không ghi đè.
   Dùng các hàm vẽ inline của trang (barLineChart, hbarCompare, fillTable). */
(() => {
'use strict';
if (document.body.dataset.sector !== 'retail' || document.body.dataset.pkg) return;
const D = window.RETAIL_BIZMAP; if (!D?.chains) return;
const byId = id => document.getElementById(id);
const make = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const nf = (v, d = 0) => Number.isFinite(v) ? v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}) : '—';
const dd = s => s ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4) : '—';

const GROUPS = D.groups || {'grocery': 'Bách hóa & minimart', 'supermarket': 'Siêu thị', 'convenience': 'Cửa hàng tiện lợi', 'electronics': 'Điện máy & điện thoại', 'pharmacy': 'Nhà thuốc', 'jewelry': 'Trang sức', 'mother': 'Mẹ & bé'};
// Nhóm không có chuỗi niêm yết (siêu thị, tiện lợi) chỉ để tham chiếu mô hình khác.
const REF = g => !all.some(c => c.group === g && c.listed);
const BRAND = {'bach-hoa-xanh': '#1E8F4E', 'winmart-plus': '#C8102E', 'the-gioi-di-dong': '#E0A800', 'dien-may-xanh': '#1F5FBF', 'an-khang': '#7CB342',
  'avakids': '#D63384', 'long-chau': '#14306B', 'fpt-shop': '#E4572E', 'pnj': '#9C6B1E'};
const PEER = ['#8E9BB5', '#F2A65A', '#6CC3B5', '#B48CC8', '#E8C547', '#7FA7D9', '#D98C8C', '#9CC48A', '#C9A27E', '#5FA8A8', '#C48BB0', '#A0A6B0'];
const ABBR = {'bach-hoa-xanh': 'BHX', 'winmart-plus': 'W+', 'the-gioi-di-dong': 'TGDĐ', 'dien-may-xanh': 'ĐMX', 'an-khang': 'AK', 'avakids': 'AVA', 'long-chau': 'LC', 'fpt-shop': 'FPT', 'pnj': 'PNJ'};
// Số doanh nghiệp công bố (evidence ở bl-14/bl-15). scope true = cùng phạm vi với chuỗi Bizmap.
const OFFICIAL = {'bach-hoa-xanh': [3904, '30/9/2026', true], 'the-gioi-di-dong': [919, '30/9/2026', true], 'dien-may-xanh': [1998, '30/9/2026', true],
  'an-khang': [438, '30/9/2026', true], 'avakids': [95, '30/9/2026', true], 'long-chau': [2741, 'cuối Q3/2026', true, 'nhà thuốc; chưa gồm 244 trung tâm tiêm chủng'],
  'fpt-shop': [622, 'Q3/2026', true], 'pnj': [424, 'cuối Q3/2026', true], 'winmart-plus': [5141, 'cuối Q2/2026', false, 'WinCommerce gồm cả WinMart siêu thị; Bizmap chỉ có WinMart+']};
// Trung tâm hành chính 34 tỉnh/thành (gần đúng) — chỉ để đặt hình tròn trên bản đồ.
const XY = {'Hà Nội': [21.03, 105.85], 'Hải Phòng': [20.84, 106.69], 'Quảng Ninh': [20.95, 107.08], 'Bắc Ninh': [21.27, 106.19], 'Hưng Yên': [20.45, 106.34],
  'Ninh Bình': [20.25, 105.97], 'Phú Thọ': [21.32, 105.40], 'Thái Nguyên': [21.59, 105.85], 'Tuyên Quang': [21.82, 105.21], 'Lào Cai': [21.70, 104.87],
  'Lạng Sơn': [21.85, 106.76], 'Cao Bằng': [22.67, 106.26], 'Lai Châu': [22.40, 103.46], 'Điện Biên': [21.39, 103.02], 'Sơn La': [21.33, 103.91],
  'Thanh Hóa': [19.81, 105.78], 'Nghệ An': [18.68, 105.68], 'Hà Tĩnh': [18.34, 105.91], 'Quảng Trị': [17.47, 106.62], 'Huế': [16.46, 107.59],
  'Đà Nẵng': [16.05, 108.20], 'Quảng Ngãi': [15.12, 108.81], 'Gia Lai': [13.78, 109.22], 'Khánh Hòa': [12.24, 109.20], 'Đắk Lắk': [12.67, 108.04],
  'Lâm Đồng': [11.94, 108.46], 'Hồ Chí Minh': [10.78, 106.70], 'Đồng Nai': [10.96, 106.84], 'Tây Ninh': [10.54, 106.41], 'Cần Thơ': [10.05, 105.75],
  'Vĩnh Long': [10.25, 105.97], 'Đồng Tháp': [10.36, 106.36], 'An Giang': [10.01, 105.08], 'Cà Mau': [9.18, 105.15]};

const all = Object.entries(D.chains).map(([slug, c]) => ({slug, ...c, listed: c.listed ?? !!c.ticker, group: c.group || 'grocery'}));
const peerIdx = {};
all.forEach(c => {
  if (BRAND[c.slug]) c.color = BRAND[c.slug]; else { peerIdx[c.group] = peerIdx[c.group] || 0; c.color = PEER[peerIdx[c.group]++ % PEER.length]; }
  c.ab = ABBR[c.slug] || c.name.replace(/[^A-ZĐ0-9+]/g, '').slice(0, 4) || c.name.slice(0, 3);
});
const bySlug = Object.fromEntries(all.map(c => [c.slug, c]));
const SRC_TXT = `Bizmap.live (API), cập nhật ${dd(D.source_updated)}`;
const inGroup = g => all.filter(c => c.group === g).sort((a, b) => (b.listed - a.listed) || b.stores - a.stores);
const defaultSel = g => { const cs = inGroup(g); const l = cs.filter(c => c.listed).map(c => c.slug); const peers = cs.filter(c => !c.listed).sort((a, b) => b.stores - a.stores).slice(0, l.length ? 2 : 3).map(c => c.slug); return new Set([...l, ...peers]); };
const state = {group: 'grocery', sel: defaultSel('grocery')};
const chosen = () => inGroup(state.group).filter(c => state.sel.has(c.slug));

function src(card, text) { if (!card || card.querySelector(':scope>.pw-src')) return; const n = make('div', 'pw-src'); n.innerHTML = 'Nguồn: <a href="https://bizmap.live/" target="_blank" rel="noopener">' + esc(text) + '</a>'; n.dataset.tidied = n.innerHTML; card.append(n); }
function take(id, text) { const h = byId(id); if (!h) return; const n = make('div', 'chart-insight'); n.dataset.inputOwner = 'ai'; n.innerHTML = '<b>Cách hiểu trong bối cảnh ngành · AI:</b> '; n.append(text); h.closest('.card')?.append(n); }
const badge = c => c.logo_url ? `<img src="${esc(c.logo_url)}" alt="" loading="lazy">` : `<span class="bn-badge" style="--bc:${c.color}">${esc(c.ab)}</span>`;
const tag = c => c.listed ? `<small class="bn-tk">${esc(c.ticker)}</small>` : '<small class="bn-peer">chưa niêm yết</small>';

/* ---------- Nhóm, bộ chọn chuỗi, ô số ---------- */
function renderFilters() {
  const host = byId('bnFilters'); if (!host) return;
  host.innerHTML = `<div class="bn-groups" role="tablist">${Object.entries(GROUPS).map(([k, l]) => `<button type="button" role="tab" class="bn-grp${k === state.group ? ' on' : ''}" aria-selected="${k === state.group}" data-g="${k}">${esc(l)}${REF(k) ? ' <small>tham chiếu</small>' : ''}</button>`).join('')}</div>
    ${REF(state.group) ? '<p class="bn-refnote">Nhóm tham chiếu: không có doanh nghiệp niêm yết cùng mô hình. Mô hình cửa hàng khác bách hóa/minimart (BHX, WinMart+) nên không so trực tiếp.</p>' : ''}
    <div class="bn-chips">${inGroup(state.group).map(c => `<button type="button" class="bn-chip${state.sel.has(c.slug) ? ' on' : ''}${c.listed ? ' listed' : ''}" data-slug="${c.slug}" style="--bc:${c.color}" aria-pressed="${state.sel.has(c.slug)}"><i></i>${esc(c.name)}${c.listed ? ' · ' + esc(c.ticker) : ''}</button>`).join('')}</div>`;
  host.querySelectorAll('.bn-grp').forEach(b => b.addEventListener('click', () => { state.group = b.dataset.g; state.sel = defaultSel(state.group); update(true); }));
  host.querySelectorAll('.bn-chip').forEach(b => b.addEventListener('click', () => { const s = b.dataset.slug; state.sel.has(s) ? state.sel.delete(s) : state.sel.add(s); update(false); }));
}
function delta(slug) {
  const H = (D.history || []).filter(s => s.chains?.[slug]); if (H.length < 2) return null;
  const last = H.at(-1), t0 = new Date(last.date), prev = [...H].reverse().find(s => (t0 - new Date(s.date)) / 864e5 >= 28);
  return prev ? last.chains[slug].stores - prev.chains[slug].stores : null;
}
function renderKpis() {
  const host = byId('bnKpis'); if (!host) return;
  host.innerHTML = chosen().map(c => { const d = delta(c.slug);
    return `<div class="bn-kpi${c.listed ? '' : ' peer'}" style="--bc:${c.color}"><div class="bn-kpi-h">${badge(c)}<b>${esc(c.name)}</b>${tag(c)}</div>
      <div class="bn-kpi-v">${nf(c.stores)}<span>điểm bán</span></div><div class="bn-kpi-s">${c.province_count}/34 tỉnh/thành · ${d == null ? 'theo dõi từ ' + dd(D.tracking_since) : (d >= 0 ? '+' : '') + nf(d) + ' trong 30 ngày'}</div></div>`; }).join('') || '<p class="bn-empty">Chọn ít nhất một chuỗi.</p>';
}

/* ---------- Bản đồ: hình tròn chia múi theo chuỗi ---------- */
const LEAF_JS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js', LEAF_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
const load = (u, css) => new Promise((ok, no) => { if (css ? document.querySelector(`link[href="${u}"]`) : document.querySelector(`script[src="${u}"]`)) return ok();
  const n = css ? Object.assign(document.createElement('link'), {rel: 'stylesheet', href: u}) : Object.assign(document.createElement('script'), {src: u}); n.onload = ok; n.onerror = no; document.head.append(n); });
const VIEW = [[8.5, 102.6], [23.3, 112.3]];
let map = null, layer = null;
function initMap() {
  const box = byId('bnMap'); if (!box || map !== null) return; map = false;
  Promise.all([load(LEAF_CSS, true), load(LEAF_JS), window.GAS_BASE ? null : load('app/vn-base.js')]).then(() => {
    const L = window.L; box.innerHTML = '';
    map = L.map(box, {zoomSnap: 0.25, minZoom: 5, maxZoom: 9, attributionControl: false, scrollWheelZoom: false, maxBounds: [[4, 99], [25.5, 117]], maxBoundsViscosity: 0.9});
    map.fitBounds(VIEW, {padding: [6, 6]});
    L.control.attribution({prefix: false}).addAttribution('Nền: Natural Earth · Điểm bán: <a href="https://bizmap.live/" target="_blank" rel="noopener">bizmap.live</a>').addTo(map);
    L.geoJSON(window.GAS_BASE, {interactive: false, style: f => { const r = f.properties.role; return r === 'vn' || r === 'vn-isl' ? {color: '#b9c3d8', weight: 0.9, fillColor: '#ffffff', fillOpacity: 1} : {color: '#e1e5ee', weight: 0.6, fillColor: '#f7f8fb', fillOpacity: 1}; }}).addTo(map);
    [[16.45, 112.05, 'QĐ. Hoàng Sa (Việt Nam)'], [9.6, 113.3, 'QĐ. Trường Sa (Việt Nam)']].forEach(([la, lo, t]) => L.marker([la, lo], {interactive: false, icon: L.divIcon({className: 'bn-isl', html: esc(t), iconSize: null})}).addTo(map));
    layer = L.layerGroup().addTo(map); drawMap();
    new ResizeObserver(() => map.invalidateSize()).observe(box);
  }).catch(() => { box.textContent = 'Không tải được thư viện bản đồ (Leaflet, cdnjs).'; });
}
function pie(r, parts) {
  const tot = parts.reduce((a, p) => a + p[1], 0);
  if (parts.length === 1) return `<circle cx="${r}" cy="${r}" r="${r - 1}" fill="${parts[0][0]}" fill-opacity=".85" stroke="#fff" stroke-width="1.5"/>`;
  let a0 = -Math.PI / 2, s = '';
  parts.forEach(([col, v]) => { const a1 = a0 + 2 * Math.PI * v / tot, x0 = r + (r - 1) * Math.cos(a0), y0 = r + (r - 1) * Math.sin(a0), x1 = r + (r - 1) * Math.cos(a1), y1 = r + (r - 1) * Math.sin(a1);
    s += `<path d="M${r},${r} L${x0.toFixed(2)},${y0.toFixed(2)} A${r - 1},${r - 1} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1.toFixed(2)},${y1.toFixed(2)} Z" fill="${col}" fill-opacity=".88"/>`; a0 = a1; });
  return s + `<circle cx="${r}" cy="${r}" r="${r - 1}" fill="none" stroke="#fff" stroke-width="1.5"/>`;
}
function drawMap() {
  if (!map || !layer) return; const L = window.L; layer.clearLayers();
  const cs = chosen(), agg = {};
  cs.forEach(c => Object.entries(c.provinces || {}).forEach(([p, n]) => { if (!n) return; (agg[p] = agg[p] || {total: 0, rows: []}).total += n; agg[p].rows.push([c, n]); }));
  const max = Math.max(1, ...Object.values(agg).map(a => a.total));
  Object.entries(agg).sort((a, b) => b[1].total - a[1].total).forEach(([p, a]) => {
    const xy = XY[p]; if (!xy) return;
    const r = Math.round(6 + 24 * Math.sqrt(a.total / max)), rows = a.rows.sort((x, y) => y[1] - x[1]);
    const html = `<svg width="${2 * r}" height="${2 * r}" viewBox="0 0 ${2 * r} ${2 * r}">${pie(r, rows.map(([c, n]) => [c.color, n]))}</svg>${r >= 17 ? `<b>${nf(a.total)}</b>` : ''}`;
    L.marker(xy, {icon: L.divIcon({className: 'bn-pie', html, iconSize: [2 * r, 2 * r], iconAnchor: [r, r]}), zIndexOffset: -a.total})
      .bindTooltip(`<b>${esc(p)}</b> · ${nf(a.total)} điểm bán<br>` + rows.map(([c, n]) => `<span style="color:${c.color}">●</span> ${esc(c.name)}: ${nf(n)}`).join('<br>'), {direction: 'top', offset: [0, -r]}).addTo(layer);
  });
  const lg = byId('bnMapLegend');
  if (lg) lg.innerHTML = cs.map(c => `<span><i style="background:${c.color}"></i>${esc(c.name)}</span>`).join('') + '<span class="bn-lg-note">Kích thước: tổng điểm bán các chuỗi đang chọn trong tỉnh · múi màu: phần của từng chuỗi</span>';
}

/* ---------- Bảng 3 miền ---------- */
const REG = ['Bắc', 'Trung', 'Nam'];
function renderRegion() {
  const host = byId('bnRegion'); if (!host) return;
  const cs = inGroup(state.group).slice().sort((a, b) => b.stores - a.stores), sum = r => cs.reduce((a, c) => a + (c.regions?.[r] || 0), 0);
  const cell = (v, t, col) => { const s = t ? v / t * 100 : 0; return `<td><div class="bn-rc"><b>${nf(v)}</b><small>${nf(s, 0)}%</small></div><div class="bn-rbar"><span style="width:${s.toFixed(1)}%;background:${col}"></span></div></td>`; };
  const tot = c => REG.reduce((a, r) => a + (c.regions?.[r] || 0), 0), gt = REG.reduce((a, r) => a + sum(r), 0);
  host.innerHTML = `<div class="bn-reg-w" data-no-fold><table class="bn-reg"><thead><tr><th>Chuỗi</th><th>Miền Bắc</th><th>Miền Trung</th><th>Miền Nam</th><th class="r">Tổng</th></tr></thead><tbody>${cs.map(c => { const t = tot(c);
    return `<tr class="${c.listed ? 'listed' : ''}"><th><span class="bn-dot" style="background:${c.color}"></span>${esc(c.name)} ${tag(c)}</th>${REG.map(r => cell(c.regions?.[r] || 0, t, c.color)).join('')}<td class="r"><b>${nf(c.stores)}</b>${c.unassigned ? `<small>${nf(c.unassigned)} chưa gán tỉnh</small>` : ''}</td></tr>`; }).join('')}
    <tr class="bn-sum"><th>Cả nhóm (${cs.length} chuỗi)</th>${REG.map(r => cell(sum(r), gt, '#3D4352')).join('')}<td class="r"><b>${nf(cs.reduce((a, c) => a + c.stores, 0))}</b></td></tr></tbody></table></div>`;
}

/* ---------- Chart ---------- */
function renderScale() {
  if (!byId('bnScale')) return;
  const cs = inGroup(state.group).slice().sort((a, b) => b.stores - a.stores);
  hbarCompare('bnScale', {items: cs.map(c => ({label: `${c.name}${c.listed ? ' · ' + c.ticker : ''}`, value: c.stores, color: c.color})), unit: 'điểm bán', digits: 0, labelW: 200, ariaLabel: 'Số điểm bán Bizmap ghi nhận, ' + GROUPS[state.group]});
}
function renderOfficial() {
  if (!byId('bnOfficial')) return;
  const rows = all.filter(c => OFFICIAL[c.slug]);
  barLineChart('bnOfficial', {categories: rows.map(c => c.name), series: [{name: 'Doanh nghiệp công bố', color: '#1D2678', values: rows.map(c => OFFICIAL[c.slug][0])}, {name: 'Bizmap ghi nhận', color: '#9AAAC8', values: rows.map(c => c.stores)}], unit: 'điểm bán', digits: 0, height: 280, rotateLabels: true});
  fillTable('tbl-bn-official', ['Chuỗi', 'Công bố', 'Kỳ công bố', 'Bizmap ghi nhận', 'Ngày Bizmap', 'Độ phủ dữ liệu', 'Ghi chú phạm vi'], rows.map(c => { const [o, k, same, note] = OFFICIAL[c.slug];
    return [c.name, nf(o), k, nf(c.stores), dd(c.source_updated || D.source_updated), same ? nf(c.stores / o * 100, 0) + '%' : 'không so (khác phạm vi)', note || 'cùng phạm vi chuỗi']; }));
}
function renderHist() {
  if (!byId('bnHist')) return; const H = D.history || [], cs = all.filter(c => c.listed);
  barLineChart('bnHist', {categories: H.map(s => dd(s.date)), series: cs.map(c => ({name: c.name, color: c.color, kind: 'line', values: H.map(s => s.chains?.[c.slug]?.stores ?? null)})), unit: 'điểm bán', digits: 0, height: 280, rotateLabels: true, zeroBase: false});
}
function update(full) { renderFilters(); renderKpis(); drawMap(); if (full) { renderScale(); renderRegion(); } }

/* ---------- Dựng ---------- */
if ((D.history || []).length < 2) byId('bnHist')?.closest('.card')?.remove();
renderFilters(); renderKpis(); renderScale(); renderOfficial(); renderRegion(); if ((D.history || []).length >= 2) renderHist();
['bnKpis', 'bnMap', 'bnScale', 'bnRegion', 'bnHist'].forEach(id => src(byId(id)?.closest('.card'), SRC_TXT));
src(byId('bnOfficial')?.closest('.card'), 'Bizmap.live; số công bố: báo cáo doanh nghiệp (Bán lẻ hiện đại › 2.2)');
byId('bnMap')?.after(make('div', 'source-note method-note', 'Mỗi hình tròn đặt tại trung tâm hành chính tỉnh/thành (34 đơn vị từ 01/07/2025). Không hiển thị tọa độ từng cửa hàng khi chưa xác nhận quyền tái phân phối dữ liệu của bizmap.live.'));
byId('bnRegion')?.after(make('div', 'source-note method-note', 'Miền Bắc: 15 tỉnh/thành phía Bắc (không gồm Thanh Hóa); miền Trung: 11 tỉnh/thành từ Thanh Hóa đến Lâm Đồng, gồm Tây Nguyên; miền Nam: 8 tỉnh/thành. % tính trên số điểm bán Bizmap ghi nhận đã gán tỉnh, không phải thị phần doanh thu.'));
byId('bnOfficial')?.after(make('div', 'source-note method-note', 'Độ phủ dữ liệu = Bizmap ghi nhận ÷ số công bố, chỉ tính khi cùng phạm vi chuỗi; hai nguồn khác ngày (công bố cuối quý, Bizmap ' + dd(D.source_updated) + '). Phân tích doanh thu/cửa hàng dùng số công bố; Bizmap dùng cho phân bố địa lý.'));

const G = inGroup('grocery'), bhx = bySlug['bach-hoa-xanh'], wm = bySlug['winmart-plus'];
if (bhx?.regions && wm?.regions) {
  const gTot = G.reduce((a, c) => a + c.stores, 0), share = (bhx.stores + wm.stores) / gTot * 100;
  const regShare = (c, r) => c.regions[r] / REG.reduce((a, x) => a + c.regions[x], 0) * 100;
  const lead = r => G.slice().sort((a, b) => (b.regions?.[r] || 0) - (a.regions?.[r] || 0))[0];
  const peers = G.filter(c => !c.listed).sort((a, b) => b.stores - a.stores);
  take('bnKpis', `BHX và WinMart+ chiếm ${nf(share)}% số điểm bán Bizmap ghi nhận trong nhóm bách hóa & minimart; đối thủ cùng mô hình đông điểm nhất là ${peers.slice(0, 2).map(c => `${c.name} (${nf(c.stores)})`).join(', ')}. Siêu thị và cửa hàng tiện lợi khác mô hình nên tách thành nhóm tham chiếu riêng. Kiểm tiếp số điểm mới của Co.op Food, Kingfoodmart qua ảnh chụp tuần.`);
  take('bnMap', 'WinMart+ dày nhất ở Hà Nội, BHX ở TP.HCM và Đông Nam Bộ, nên cạnh tranh trực diện dồn vào các tỉnh có hình tròn mang cả hai màu. Kiểm tiếp tỉnh mới xuất hiện màu của từng chuỗi.');
  take('bnRegion', `BHX có ${nf(regShare(bhx, 'Nam'))}% điểm bán ở miền Nam, WinMart+ ${nf(regShare(wm, 'Bắc'))}% ở miền Bắc; trong nhóm, chuỗi đông điểm nhất ở miền Bắc là ${lead('Bắc').name}, ở miền Nam là ${lead('Nam').name}. Kiểm tiếp tỷ trọng miền của BHX khi chuỗi mở ra phía Bắc.`);
}
take('bnScale', 'Số điểm bán Bizmap ghi nhận, không phải thị phần doanh thu: chuỗi tiện lợi và nhà thuốc nhiều điểm nhưng mỗi điểm nhỏ; siêu thị ít điểm nhưng diện tích lớn. Đọc cùng doanh thu/cửa hàng ở mục 2.2.');
const over = all.filter(c => OFFICIAL[c.slug]?.[2] && c.stores > OFFICIAL[c.slug][0] * 1.1).map(c => c.name);
take('bnOfficial', (over.length ? `Bizmap ghi nhận nhiều hơn số công bố ở ${over.join(', ')}, có thể gồm điểm đã đóng hoặc định dạng khác, nên không dùng Bizmap để tính doanh thu/cửa hàng. ` : '') + 'Kiểm tiếp số công bố cuối năm của MWG, FRT, PNJ để cập nhật độ phủ.');

const mapBox = byId('bnMap');
if (mapBox) {
  const tryInit = () => { if (map === null && mapBox.isConnected && mapBox.offsetWidth > 0) initMap(); };
  if ('IntersectionObserver' in window) { const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); tryInit(); } }); io.observe(mapBox); }
  window.addEventListener('resize', tryInit); window.addEventListener('rf:frame', () => setTimeout(tryInit, 50));
}
window.RetailNetwork = {state, update};
})();
