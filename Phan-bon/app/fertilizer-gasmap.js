/* Phân bón · Bức tranh ngành › 04 Nguồn khí › 4.4 Bản đồ hệ thống cung cấp khí Việt Nam (26/11/2026).
   - Nền: GeoJSON Natural Earth 1:10m (app/gas-base.js, scripts/build_gas_basemap.py), Hoàng Sa, Trường Sa thuộc Việt Nam; không dùng ảnh nền (tile) bên ngoài.
   - Lớp: bể trầm tích (vùng bán trong suốt) · mỏ (giàn) · đường ống có mũi tên hướng dòng khí · nhà máy xử lý/trạm tiếp bờ/trung tâm phân phối
     · kho LNG · nhà máy điện · nhà máy đạm (DPM, DCM nổi bật).
   - Màu: khí nội địa xanh dương, LNG tím; đang vận hành nét liền, đang xây dựng nét đứt, quy hoạch xám đứt.
   - Bộ lọc hệ thống + chế độ doanh nghiệp (Toàn ngành | DPM | DCM): làm nổi nguồn, đường ống, hộ dùng chung; làm mờ phần còn lại.
   - Rê chuột: tên + trạng thái; bấm: thẻ chi tiết (chủ đầu tư, công suất, sản lượng, chiều dài, COD, nguồn vào, đầu ra, nguồn dữ liệu, độ chính xác vị trí).
   Dữ liệu: D.gas (data/fertilizer/gas-system.json, nhập tay có nguồn từng dòng). Leaflet nạp khi mở mục (cdnjs). */
(() => {
'use strict';
const LEAF_JS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
const LEAF_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const load = (src, css) => new Promise((ok, no) => {
  if (css) { if (document.querySelector(`link[href="${src}"]`)) return ok(); const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = src; l.onload = ok; l.onerror = no; document.head.append(l); return; }
  if (document.querySelector(`script[src="${src}"]`)) { const s = document.querySelector(`script[src="${src}"]`); return s.dataset.ok ? ok() : s.addEventListener('load', ok); }
  const s = document.createElement('script'); s.src = src; s.onload = () => { s.dataset.ok = '1'; ok(); }; s.onerror = no; document.head.append(s);
});

const COL = {domestic: '#2462c9', lng: '#7a3fb5', planned: '#8a93a6', fert: '#1f9d55', power: '#d98e04', basin: '#2938A8'};
const STATUS = {operating: 'Đang vận hành', producing: 'Đang khai thác', construction: 'Đang xây dựng', developing: 'Đang phát triển', planned: 'Quy hoạch / dự kiến', undeveloped: 'Chưa phát triển thương mại', stopped: 'Đã dừng'};
const KIND = {field: 'Mỏ khí / mỏ dầu khí', cpp: 'Giàn xử lý / nén khí ngoài khơi', gpp: 'Nhà máy xử lý khí', landing: 'Trạm tiếp bờ', hub: 'Trung tâm phân phối khí', lng: 'Kho cảng LNG', fert: 'Nhà máy phân đạm', power: 'Nhà máy điện', industry: 'Hộ công nghiệp'};
const FILTERS = [['all', 'Tất cả hệ thống'], ['cuulong', 'Cửu Long'], ['ncs', 'Nam Côn Sơn'], ['pm3', 'PM3 – Cà Mau'], ['lob', 'Lô B – Ô Môn'], ['songhong', 'Sông Hồng'], ['cvx', 'Cá Voi Xanh'], ['lng', 'LNG nhập khẩu']];
const SUPPLY = {existing: ['Nguồn hiện hữu', '#1f9d55'], agreed: ['Bổ sung đã có thỏa thuận', '#2462c9'], potential: ['Nguồn tiềm năng', '#8a93a6']};

// Biểu tượng SVG (24×24) cho từng loại tài sản.
const ICON = {
  field: c => `<path d="M12 2 7 20h10L12 2z" fill="none" stroke="${c}" stroke-width="2"/><path d="M8.5 14h7M9.7 9.5h4.6" stroke="${c}" stroke-width="1.6"/><path d="M4 21h16" stroke="${c}" stroke-width="2"/>`,
  gpp: c => `<rect x="3" y="9" width="18" height="12" rx="1.5" fill="${c}"/><path d="M6 9V4h3v5M14 9V6h3v3" stroke="${c}" stroke-width="2" fill="none"/><circle cx="12" cy="15" r="2.6" fill="#fff"/>`,
  landing: c => `<path d="M12 3 21 12 12 21 3 12z" fill="${c}"/><circle cx="12" cy="12" r="3" fill="#fff"/>`,
  hub: c => `<circle cx="12" cy="12" r="8.5" fill="${c}"/><path d="M12 6v12M6 12h12" stroke="#fff" stroke-width="2.2"/>`,
  lng: c => `<ellipse cx="12" cy="6" rx="8" ry="3" fill="${c}"/><path d="M4 6v11c0 1.7 3.6 3 8 3s8-1.3 8-3V6" fill="${c}" opacity=".85"/><ellipse cx="12" cy="6" rx="8" ry="3" fill="none" stroke="#fff" stroke-width="1.2"/>`,
  power: c => `<circle cx="12" cy="12" r="10" fill="#fff" stroke="${c}" stroke-width="2"/><path d="M13.5 3.5 6.5 13.5h5l-1 7 7-10h-5z" fill="${c}"/>`,
  fert: c => `<circle cx="12" cy="12" r="10.5" fill="${c}" stroke="#fff" stroke-width="1.6"/><path d="M7 16c0-6 4-9 10-9 0 6-4 9-10 9zM7 16l5-5" stroke="#fff" stroke-width="1.8" fill="none"/>`,
  cpp: c => `<rect x="4" y="8" width="16" height="5" fill="${c}"/><path d="M6 13v8M18 13v8M12 13v8M9 8V4h6v4" stroke="${c}" stroke-width="2" fill="none"/>`,
  industry: c => `<path d="M3 20V10l5 3V10l5 3V6h3l1 14z" fill="${c}"/>`
};

function build(host) {
  const K = window.FertKit, D = K && K.D, G = D && D.gas;
  if (!G) { host.innerHTML = '<p class="fb-na-p">N/A · chưa có dữ liệu hệ thống khí (data/fertilizer/gas-system.json).</p>'; return; }
  const card = document.createElement('div'); card.className = 'card fb-gm'; card.dataset.blockId = 'pb-c-gas-map'; card.dataset.updateKind = 'static'; card.dataset.cadence = 'event';
  card.innerHTML = `<div class="chart-title">Bản đồ hệ thống cung cấp khí Việt Nam</div>
    <div class="chart-sub">Mỏ khí → đường ống → xử lý, tiếp bờ → hộ tiêu thụ; kho LNG nhập khẩu. Kéo để di chuyển, cuộn hoặc nút +/− để phóng to; bấm một đối tượng để xem chi tiết.</div>
    <div class="fb-gm-ctl">
      <div class="fb-gm-seg fb-gm-sys" role="group" aria-label="Lọc hệ thống khí">${FILTERS.map(([k, t], i) => `<button type="button" data-v="${k}" aria-pressed="${i === 0}">${esc(t)}</button>`).join('')}</div>
      <div class="fb-gm-seg fb-gm-co" role="group" aria-label="Chế độ doanh nghiệp"><button type="button" data-v="" aria-pressed="true">Toàn ngành</button><button type="button" data-v="DPM" aria-pressed="false">DPM</button><button type="button" data-v="DCM" aria-pressed="false">DCM</button></div>
    </div>
    <div class="fb-gm-wrap"><div class="fb-gm-map" role="application" aria-label="Bản đồ hệ thống khí Việt Nam"><div class="fb-gm-loading">Đang tải bản đồ…</div></div>
      <aside class="fb-gm-side" aria-live="polite"></aside></div>
    <div class="fb-gm-legend"></div>
    <div class="pw-src">Nguồn: ${esc(G.meta && G.meta.source_note || 'PV GAS, Petrovietnam, PVEP, Bộ Công Thương, BCTN DPM, DCM')} (nguồn ghi theo từng đối tượng, bấm để xem); nền bản đồ: Natural Earth 1:10m. ${esc(G.meta && G.meta.precision_note || '')}</div>`;
  host.append(card);
  Promise.all([load(LEAF_CSS, true), load(LEAF_JS), window.GAS_BASE ? null : load('app/gas-base.js?v=' + encodeURIComponent((D.built_at || '').slice(0, 10)))])
    .then(() => draw(card, G)).catch(e => { console.error(e); card.querySelector('.fb-gm-loading').textContent = 'Không tải được thư viện bản đồ (Leaflet, cdnjs).'; });
}

function draw(card, G) {
  const L = window.L, box = card.querySelector('.fb-gm-map'), side = card.querySelector('.fb-gm-side');
  box.innerHTML = '';
  const map = L.map(box, {zoomSnap: 0.25, minZoom: 5, maxZoom: 11, attributionControl: false, worldCopyJump: false, preferCanvas: false,
    maxBounds: [[3.5, 100.5], [25.5, 120.5]], maxBoundsViscosity: 0.8});
  map.fitBounds([[7.2, 102.6], [21.8, 112.6]]);
  L.control.attribution({prefix: false}).addAttribution('Natural Earth').addTo(map);
  // Nền: biển là màu nền khung; đất liền theo GeoJSON.
  L.geoJSON(window.GAS_BASE, {interactive: false, style: f => {
    const r = f.properties.role;
    return r === 'vn' || r === 'vn-isl' ? {color: '#9aa6c4', weight: 0.8, fillColor: '#ffffff', fillOpacity: 1} : {color: '#c6ccda', weight: 0.6, fillColor: '#eef0f5', fillOpacity: 1};
  }}).addTo(map);
  const isl = [[16.45, 112.05, 'QĐ. Hoàng Sa (Việt Nam)'], [9.6, 114.3, 'QĐ. Trường Sa (Việt Nam)']];
  isl.forEach(([la, lo, t]) => L.marker([la, lo], {interactive: false, icon: L.divIcon({className: 'fb-gm-isl', html: esc(t), iconSize: null})}).addTo(map));
  [[21.6, 104.2, 'VIỆT NAM'], [11.2, 109.9, 'BIỂN ĐÔNG']].forEach(([la, lo, t]) => L.marker([la, lo], {interactive: false, icon: L.divIcon({className: 'fb-gm-cty', html: t, iconSize: null})}).addTo(map));

  const A = Object.fromEntries((G.assets || []).map(a => [a.id, a]));
  const P = G.pipelines || [];
  const layers = []; // {obj, kind, sys:Set, id, el...}
  const lineColor = p => p.status === 'planned' ? COL.planned : p.gas === 'lng' ? COL.lng : COL.domestic;
  const dash = p => p.status === 'construction' ? '9 6' : p.status === 'planned' ? '4 6' : null;

  // Bể trầm tích.
  (G.basins || []).forEach(b => {
    const poly = L.polygon(b.poly.map(([lo, la]) => [la, lo]), {color: COL.basin, weight: 1, opacity: .35, fillColor: COL.basin, fillOpacity: .07, dashArray: '3 4'}).addTo(map);
    poly.bindTooltip(esc(b.name), {permanent: true, direction: 'center', className: 'fb-gm-basin'});
    poly.on('click', () => show({...b, kind: 'basin'}));
    layers.push({obj: poly, type: 'basin', id: b.id, sys: new Set(b.systems || []), base: {opacity: .35, fillOpacity: .07}});
  });

  // Đường ống + mũi tên.
  const arrowLayer = L.layerGroup().addTo(map);
  P.forEach(p => {
    const ll = p.path.map(([lo, la]) => [la, lo]);
    const halo = L.polyline(ll, {color: '#fff', weight: 6.5, opacity: .9, interactive: false}).addTo(map);
    const line = L.polyline(ll, {color: lineColor(p), weight: p.major ? 3.4 : 2.4, opacity: 1, dashArray: dash(p), lineCap: 'round'}).addTo(map);
    line.bindTooltip(`<b>${esc(p.name)}</b><br>${esc(STATUS[p.status] || p.status || '')}`, {sticky: true, className: 'fb-gm-tip'});
    line.on('click', () => show({...p, kind: 'pipe'}));
    let lab = null;
    if (p.label) {
      const at = p.label_at ? [p.label_at[1], p.label_at[0]] : ll[Math.floor(ll.length / 2)];
      lab = L.marker(at, {interactive: false, icon: L.divIcon({className: 'fb-gm-plab', html: `<span class="${at[0] < 12.5 ? 's' : ''}" style="color:${lineColor(p)}">${esc(p.label)}</span>`, iconSize: null})}).addTo(map);
    }
    layers.push({obj: line, halo, lab, type: 'pipe', id: p.id, p, sys: new Set([p.system].concat(p.systems || [])), base: {opacity: 1}});
  });
  const drawArrows = () => {
    arrowLayer.clearLayers();
    const z = map.getZoom(), every = z >= 8 ? 70 : z >= 7 ? 110 : 160;
    layers.filter(l => l.type === 'pipe').forEach(l => {
      const pts = l.obj.getLatLngs().map(x => map.latLngToLayerPoint(x)); let acc = every / 2;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i], len = a.distanceTo(b);
        while (acc < len) { const t = acc / len, x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t, ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
          const m = L.marker(map.layerPointToLatLng([x, y]), {interactive: false, keyboard: false, icon: L.divIcon({className: 'fb-gm-arrow', iconSize: [10, 10], iconAnchor: [5, 5],
            html: `<svg viewBox="0 0 10 10" style="transform:rotate(${ang}deg)"><path d="M1 1 9 5 1 9z" fill="${lineColor(l.p)}"/></svg>`})});
          m._owner = l; arrowLayer.addLayer(m); acc += every; }
        acc -= len;
      }
    });
    applyDim();
  };

  // Tài sản.
  const RANK = {fert: 1, lng: 1, gpp: 1, hub: 2, landing: 2, field: 2, power: 2, cpp: 3, industry: 3};
  (G.assets || []).forEach(a => {
    if (!Number.isFinite(a.lon) || !Number.isFinite(a.lat)) return;
    const k = a.kind, color = k === 'fert' ? COL.fert : k === 'power' ? COL.power : k === 'lng' ? COL.lng : k === 'field' ? (a.status === 'producing' ? COL.domestic : a.status === 'developing' ? '#5b86d6' : COL.planned) : '#3d4653';
    const big = k === 'fert' ? 30 : k === 'lng' || k === 'gpp' ? 22 : 18;
    const svg = `<svg viewBox="0 0 24 24" width="${big}" height="${big}" aria-hidden="true">${(ICON[k] || ICON.hub)(color)}</svg>`;
    const badge = a.declining ? '<i class="fb-gm-dec" title="Sản lượng đang giảm">↓</i>' : '';
    const ring = k === 'fert' ? '<i class="fb-gm-pulse"></i>' : '';
    const label = `<span class="fb-gm-lab r${a.rank || RANK[k] || 3}${k === 'fert' ? ' fert' : ''}">${esc(a.short || a.name)}</span>`;
    const st = a.status && a.status !== 'operating' && a.status !== 'producing' ? ' fb-gm-fut' : '';
    const m = L.marker([a.lat, a.lon], {icon: L.divIcon({className: 'fb-gm-ic k-' + k + st, html: ring + svg + badge + label, iconSize: [big, big], iconAnchor: [big / 2, big / 2]}),
      zIndexOffset: k === 'fert' ? 1000 : k === 'lng' ? 500 : 0, keyboard: true, title: a.name}).addTo(map);
    m.bindTooltip(`<b>${esc(a.name)}</b><br>${esc(KIND[k] || '')} · ${esc(STATUS[a.status] || a.status || 'N/A')}${a.declining ? '<br>Sản lượng đang giảm' : ''}`, {direction: 'top', offset: [0, -big / 2], className: 'fb-gm-tip'});
    m.on('click', () => show(a));
    layers.push({obj: m, type: 'asset', id: a.id, a, sys: new Set(a.systems || [])});
  });

  // Mật độ nhãn theo mức zoom.
  const density = () => { const z = map.getZoom(); box.dataset.z = z >= 8 ? '3' : z >= 6.75 ? '2' : '1'; };

  // Bộ lọc + chế độ doanh nghiệp.
  const S = {sys: 'all', co: ''};
  const coSets = co => {
    const c = (G.companies || {})[co]; if (!c) return null;
    const cls = {}; [['existing'], ['agreed'], ['potential']].forEach(([k]) => (c[k] || []).forEach(id => { cls[id] = cls[id] || k; }));
    (c.plant ? [c.plant] : []).forEach(id => { cls[id] = 'self'; });
    (c.shared || []).forEach(id => { cls[id] = cls[id] || 'shared'; });
    return cls;
  };
  function applyDim() {
    const cls = S.co ? coSets(S.co) : null;
    const on = l => { if (cls) return l.id in cls || [...l.sys].some(s => s in cls && cls[s] !== 'shared'); return S.sys === 'all' || l.sys.has(S.sys); };
    layers.forEach(l => {
      const v = on(l), c = cls ? (cls[l.id] || [...l.sys].map(s => cls[s]).find(Boolean)) : null;
      if (l.type === 'pipe') {
        l.obj.setStyle({opacity: v ? (c === 'potential' ? .55 : 1) : .12, weight: (l.p.major ? 3.4 : 2.4) + (cls && v && c !== 'potential' ? 1.6 : 0),
          dashArray: c === 'agreed' && l.p.status === 'operating' ? '10 5' : dash(l.p)});
        l.halo.setStyle({opacity: v ? .9 : 0}); if (l.lab) l.lab.setOpacity(v ? 1 : .15);
      } else if (l.type === 'basin') l.obj.setStyle({opacity: v ? .35 : .1, fillOpacity: v ? .07 : .02});
      else { l.obj.setOpacity(v ? 1 : .18); const e = l.obj.getElement(); if (e) { e.classList.toggle('fb-gm-on', !!(cls && v)); e.dataset.sup = c || ''; } }
    });
    arrowLayer.eachLayer(m => m.setOpacity(on(m._owner) ? 1 : .1));
    summary(cls);
  }
  const ctl = card.querySelector('.fb-gm-ctl');
  ctl.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return; const grp = b.parentElement;
    grp.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    if (grp.classList.contains('fb-gm-sys')) { S.sys = b.dataset.v; if (S.co) { S.co = ''; ctl.querySelectorAll('.fb-gm-co button').forEach((x, i) => x.setAttribute('aria-pressed', String(i === 0))); } }
    else { S.co = b.dataset.v; if (S.co) { S.sys = 'all'; ctl.querySelectorAll('.fb-gm-sys button').forEach((x, i) => x.setAttribute('aria-pressed', String(i === 0))); } }
    applyDim(); fit();
  });
  const fit = () => {
    const cls = S.co ? coSets(S.co) : null; const pts = [];
    layers.forEach(l => { const hit = cls ? l.id in cls : S.sys !== 'all' && l.sys.has(S.sys); if (!hit) return;
      if (l.type === 'asset') pts.push(l.obj.getLatLng()); else if (l.type === 'pipe') pts.push(...l.obj.getLatLngs()); });
    if (pts.length > 1) map.flyToBounds(L.latLngBounds(pts).pad(.12), {duration: .5, maxZoom: 9, paddingBottomRight: cls && innerWidth > 760 ? [340, 0] : [0, 0]}); else if (!cls && S.sys === 'all') map.flyToBounds([[7.2, 102.6], [21.8, 112.6]], {duration: .5});
  };

  // Thẻ chi tiết.
  const na = v => v == null || v === '' ? '<span class="fb-gm-na">N/A</span>' : esc(v);
  const nameOf = id => (A[id] && A[id].name) || (P.find(p => p.id === id) || {}).name || id;
  const list = v => Array.isArray(v) ? (v.length ? v.map(x => esc(A[x] || P.find(p => p.id === x) ? nameOf(x) : x)).join(' · ') : null) : v;
  function show(o) {
    const rows = o.kind === 'basin' ? [['Loại', 'Bể trầm tích dầu khí'], ['Ghi chú', o.note]] : [
      ['Loại', o.kind === 'pipe' ? (o.gas === 'lng' ? 'Đường ống khí (LNG tái hóa)' : 'Đường ống khí nội địa') : KIND[o.kind]],
      ['Chủ đầu tư / vận hành', o.owner], ['Công suất thiết kế', o.capacity], ['Sản lượng thực tế gần nhất', o.output || o.throughput],
      ...(o.kind === 'pipe' ? [['Chiều dài', o.length]] : []), ['Trạng thái', STATUS[o.status] || o.status], ['Vận hành thương mại', o.cod],
      ['Nguồn khí đầu vào', list(o.inputs)], ['Hộ tiêu thụ đầu ra', list(o.outputs)]];
    const src = (o.sources || []).map(s => `<li>${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title || s.url)}</a>` : esc(s.title)}${s.period ? ` · ${esc(s.period)}` : ''}</li>`).join('');
    side.innerHTML = `<button type="button" class="fb-gm-x" aria-label="Đóng">×</button><div class="fb-gm-k">${esc(o.kind === 'basin' ? 'Bể trầm tích' : o.kind === 'pipe' ? 'Đường ống' : KIND[o.kind] || '')}</div>
      <h4>${esc(o.name)}</h4>${o.declining ? '<p class="fb-gm-warn">↓ Sản lượng đang giảm' + (o.decline_note ? ': ' + esc(o.decline_note) : '') + '</p>' : ''}
      <dl>${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${na(v)}</dd>`).join('')}</dl>
      ${o.note && o.kind !== 'basin' ? `<p class="fb-gm-note">${esc(o.note)}</p>` : ''}
      <p class="fb-gm-prec">Độ chính xác ${o.kind === 'pipe' ? 'tuyến' : 'vị trí'}: ${esc(o.precision || o.route_precision || 'gần đúng')}</p>
      ${src ? `<div class="fb-gm-src"><b>Nguồn dữ liệu</b><ul>${src}</ul></div>` : '<p class="fb-gm-na">Chưa có nguồn</p>'}`;
    side.classList.add('open');
    side.querySelector('.fb-gm-x').addEventListener('click', () => { side.classList.remove('open'); summary(S.co ? coSets(S.co) : null); });
  }
  // Tóm tắt khi chọn doanh nghiệp: nguồn theo 3 nhóm + hộ dùng chung (số liệu từ dữ liệu, không thêm nhận định).
  function summary(cls) {
    if (!cls) { side.classList.remove('open'); side.innerHTML = ''; return; }
    const c = G.companies[S.co];
    const KG = [['pipe', 'Đường ống'], ['field', 'Mỏ'], ['node', 'Xử lý, tiếp bờ, phân phối'], ['lng', 'LNG']];
    const kindOf = id => { if (P.find(p => p.id === id)) return 'pipe'; const a = A[id]; return !a ? 'node' : a.kind === 'field' ? 'field' : a.kind === 'lng' ? 'lng' : 'node'; };
    const shortOf = id => (A[id] && (A[id].short || A[id].name)) || ((P.find(p => p.id === id) || {}).short) || nameOf(id);
    const grp = k => { const ids = c[k] || []; if (!ids.length) return []; return KG.map(([kk, t]) => { const xs = ids.filter(i => kindOf(i) === kk).map(shortOf); return xs.length ? `<em>${t}:</em> ${xs.map(esc).join(' · ')}` : null; }).filter(Boolean); };
    const shared = (c.shared || []).map(id => A[id]).filter(Boolean);
    const mw = shared.filter(a => a.kind === 'power' && Number.isFinite(a.mw)).reduce((s, a) => s + a.mw, 0);
    side.innerHTML = `<div class="fb-gm-k">Chế độ doanh nghiệp</div><h4>${esc(S.co)} · ${esc(nameOf(c.plant))}</h4>
      ${Object.entries(SUPPLY).map(([k, [t, col]]) => `<div class="fb-gm-sup"><i style="background:${col}"></i><b>${t}</b><span>${grp(k).length ? grp(k).join('<br>') : 'N/A'}</span></div>`).join('')}
      <div class="fb-gm-sup"><i style="background:${COL.power}"></i><b>Hộ dùng chung hệ thống khí</b><span>${shared.length ? shared.map(a => esc(a.short || a.name)).join(' · ') : 'N/A'}${mw ? ` (điện: ${mw.toLocaleString('vi-VN')} MW)` : ''}</span></div>
      ${c.contract ? `<p class="fb-gm-note">${esc(c.contract)}</p>` : ''}
      ${(c.sources || []).length ? `<div class="fb-gm-src"><b>Nguồn dữ liệu</b><ul>${c.sources.map(s => `<li>${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title || s.url)}</a>` : esc(s.title)}${s.period ? ` · ${esc(s.period)}` : ''}</li>`).join('')}</ul></div>` : ''}`;
    side.classList.add('open');
  }

  // Chú giải.
  const sw = (svg, t) => `<span><svg viewBox="0 0 24 24" width="16" height="16">${svg}</svg>${t}</span>`;
  const ln = (c, d, t) => `<span><svg viewBox="0 0 34 8" width="34" height="8"><path d="M1 4h32" stroke="${c}" stroke-width="3" ${d ? `stroke-dasharray="${d}"` : ''}/></svg>${t}</span>`;
  card.querySelector('.fb-gm-legend').innerHTML = [ln(COL.domestic, '', 'Khí nội địa · vận hành'), ln(COL.lng, '', 'Khí LNG nhập khẩu'), ln(COL.domestic, '6 4', 'Đang xây dựng'), ln(COL.planned, '3 4', 'Quy hoạch / dự kiến'),
    sw(ICON.field(COL.domestic), 'Mỏ đang khai thác'), sw(ICON.field('#5b86d6'), 'Mỏ đang phát triển'), sw(ICON.field(COL.planned), 'Mỏ chưa phát triển'), sw(ICON.cpp('#3d4653'), 'Giàn xử lý ngoài khơi'), sw(ICON.gpp('#3d4653'), 'Nhà máy xử lý khí'),
    sw(ICON.landing('#3d4653'), 'Trạm tiếp bờ'), sw(ICON.hub('#3d4653'), 'Trung tâm phân phối'), sw(ICON.lng(COL.lng), 'Kho cảng LNG'), sw(ICON.power(COL.power), 'Nhà máy điện'), sw(ICON.fert(COL.fert), 'Nhà máy đạm'),
    '<span><i class="fb-gm-dec">↓</i>Sản lượng đang giảm</span>', '<span><i class="fb-gm-basinsw"></i>Bể trầm tích</span>'].join('');

  map.on('zoomend', () => { density(); drawArrows(); });
  map.on('moveend', () => {});
  density(); drawArrows();
  setTimeout(() => map.invalidateSize(), 50);
  card._map = map;
}
window.FertGasMap = {build};
})();
