/* Hàng không · Bức tranh ngành › Sân bay & Long Thành › Bản đồ cảng hàng không (26/11/2026).
   Nền: GeoJSON Natural Earth 1:10m (app/gas-base.js, chép từ Phan-bon, Hoàng Sa, Trường Sa thuộc Việt Nam); không dùng ảnh nền (tile) bên ngoài.
   Điểm: 22 cảng đang khai thác theo mã IATA, màu theo đơn vị khai thác (ACV / ngoài ACV); dự án đang xây dựng vẽ viền rỗng.
   Tooltip: tên, mã, đơn vị khai thác, công suất và lượng khách nếu có số xác minh (kỳ + nguồn ghi kèm); không có số thì ghi "chưa có số xác minh".
   Dữ liệu: window.AVIATION_DATA.airports (data/aviation/airports.json qua scripts/build_aviation_data.py). Leaflet nạp từ cdnjs khi trang mở. */
(() => {
'use strict';
const LEAF_JS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
const LEAF_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const nf = (v, d = 1) => Number.isFinite(v) ? v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}) : '—';
const load = (src, css) => new Promise((ok, no) => {
  if (css) { if (document.querySelector(`link[href="${src}"]`)) return ok(); const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = src; l.onload = ok; l.onerror = no; document.head.append(l); return; }
  const had = document.querySelector(`script[src="${src}"]`); if (had) return had.dataset.ok ? ok() : had.addEventListener('load', ok);
  const s = document.createElement('script'); s.src = src; s.onload = () => { s.dataset.ok = '1'; ok(); }; s.onerror = no; document.head.append(s);
});
const COL = {acv: '#2938A8', other: '#c29100', build: '#861C52'};

function tip(a) {
  const rows = [['Mã IATA', a.iata || '—'], ['Đơn vị khai thác', a.operator], ['Loại', a.type]];
  (a.facts || []).forEach(f => rows.push([f.label, `${f.value} <small>(${esc(f.period)} · ${esc(f.source)})</small>`]));
  if (!(a.facts || []).length) rows.push(['Khách, hàng hóa, công suất', '<i>chưa có số xác minh theo từng cảng</i>']);
  return `<b>${esc(a.name)}</b><table>${rows.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${/<small>|<i>/.test(String(v)) ? v : esc(v)}</td></tr>`).join('')}</table>`;
}

function draw(host, A) {
  const L = window.L; host.innerHTML = '';
  const map = L.map(host, {zoomSnap: 0.25, minZoom: 4.5, maxZoom: 10, attributionControl: false, scrollWheelZoom: false, maxBounds: [[3.5, 99], [25.5, 121]], maxBoundsViscosity: 0.8});
  map.fitBounds([[8.2, 102.2], [23.2, 112.2]]);
  L.control.attribution({prefix: false}).addAttribution('Natural Earth').addTo(map);
  L.geoJSON(window.GAS_BASE, {interactive: false, style: f => { const r = f.properties.role; return r === 'vn' || r === 'vn-isl' ? {color: '#9aa6c4', weight: 0.8, fillColor: '#ffffff', fillOpacity: 1} : {color: '#c6ccda', weight: 0.6, fillColor: '#eef0f5', fillOpacity: 1}; }}).addTo(map);
  [[16.45, 112.05, 'QĐ. Hoàng Sa (Việt Nam)'], [9.6, 114.3, 'QĐ. Trường Sa (Việt Nam)']].forEach(([la, lo, t]) => L.marker([la, lo], {interactive: false, icon: L.divIcon({className: 'hk-map-isl', html: esc(t), iconSize: null})}).addTo(map));
  A.forEach(a => {
    const col = a.status === 'construction' ? COL.build : a.operator_group === 'acv' ? COL.acv : COL.other;
    const big = a.hub ? 11 : 7;
    const m = L.circleMarker([a.lat, a.lon], {radius: big, color: col, weight: 2, fillColor: a.status === 'construction' ? '#fff' : col, fillOpacity: a.status === 'construction' ? 1 : 0.85}).addTo(map);
    m.bindTooltip(tip(a), {className: 'hk-map-tip', direction: 'top', sticky: false});
    if (a.hub || a.status === 'construction') L.marker([a.lat, a.lon], {interactive: false, icon: L.divIcon({className: 'hk-map-lab', html: esc(a.iata || a.short || a.name), iconSize: null, iconAnchor: [-8, 6]})}).addTo(map);
  });
  setTimeout(() => map.invalidateSize(), 60);
  window.addEventListener('resize', () => map.invalidateSize());
  document.addEventListener('click', e => { if (e.target.closest('.pp-tab,.majortabbtn')) setTimeout(() => map.invalidateSize(), 80); });
}

function run() {
  const host = document.getElementById('hkMap'); if (!host || host.dataset.done) return; host.dataset.done = '1';
  const A = (window.AVIATION_DATA || {}).airports || [];
  if (!A.length) { host.innerHTML = '<p class="rf-note">Chưa có dữ liệu cảng hàng không.</p>'; return; }
  host.innerHTML = '<div class="hk-map-loading">Đang tải bản đồ…</div>';
  Promise.all([load(LEAF_CSS, true), load(LEAF_JS), window.GAS_BASE ? null : load('app/gas-base.js')]).then(() => draw(host, A)).catch(e => { console.error(e); host.innerHTML = '<p class="rf-note">Không tải được thư viện bản đồ (Leaflet, cdnjs).</p>'; });
  const legend = document.createElement('div'); legend.className = 'legend';
  legend.innerHTML = [['ACV khai thác', COL.acv], ['Ngoài ACV', COL.other], ['Đang xây dựng (viền rỗng)', COL.build]].map(([n, c]) => `<span class="li"><span class="dot" style="background:${c}"></span>${esc(n)}</span>`).join('');
  host.after(legend);
  const meta = (window.AVIATION_DATA || {}).airports_meta || {}, src = document.createElement('div'); src.className = 'pw-src';
  src.innerHTML = 'Nguồn: ' + (meta.sources || []).map(([n, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(n)}</a>`).join('; ') + '; nền bản đồ: Natural Earth 1:10m. ' + esc(meta.note || '');
  legend.after(src);
}
if (window.SectorBoot) SectorBoot.add(1300, run); else if (document.readyState === 'complete') run(); else window.addEventListener('load', run);
})();
