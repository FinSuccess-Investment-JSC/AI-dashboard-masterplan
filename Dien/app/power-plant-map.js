/* Điện · Tổng quan ngành › Bản đồ ngành › 0.4 Bản đồ phân bổ nguồn điện Việt Nam (26/11/2026, theo yêu cầu người dùng).
   - Dữ liệu: window.POWER_PLANTS (data/power-plants.js, sinh bởi scripts/build_power_plants.py; nguồn ghi theo từng nhà máy).
   - Nền: GeoJSON Natural Earth 1:10m (app/vn-base.js, chép từ bản đồ Phân bón), Hoàng Sa, Trường Sa thuộc Việt Nam; 3 miền tô theo ranh giới
     63 tỉnh (geoBoundaries) gom theo vùng phục vụ của 3 tổng công ty điện lực EVN. Không dùng ảnh nền (tile) bên ngoài.
   - Bubble: diện tích tỷ lệ với MW (bán kính ∝ √MW). Đang vận hành: tô đặc; đang xây dựng: viền rỗng; quy hoạch: viền đứt, mặc định ẩn.
     Thu nhỏ (zoom < 7): gom theo ô lưới và loại nguồn; phóng to: từng nhà máy.
   - Bộ lọc khu vực / nguồn / trạng thái / sở hữu / tìm kiếm cập nhật đồng thời bản đồ, ô số và biểu đồ cơ cấu 3 miền.
   - Chế độ mã cổ phiếu: tô sáng tài sản của mã, làm mờ phần còn lại; công suất vật lý và công suất quy đổi theo tỷ lệ sở hữu; không cộng trùng nhà máy.
   Trường không có dữ liệu công khai hiện N/A. */
(() => {
'use strict';
const LEAF_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
const LEAF_JS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const fin = v => typeof v === 'number' && Number.isFinite(v);
const nf = (v, d = 0) => fin(v) ? v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}) : 'N/A';
const NA = '<span class="pm-na">N/A</span>';
const TYPES = [
  ['hydro', 'Thủy điện', '#2938A8'], ['coal', 'Nhiệt điện than', '#3d4653'], ['gas', 'Khí nội địa', '#d9822b'], ['lng', 'LNG', '#b85c00'],
  ['wind', 'Điện gió', '#2e9d58'], ['solar', 'Điện mặt trời', '#e0b000'], ['other', 'Sinh khối & nguồn khác', '#7b4fb3']
];
const TCOL = Object.fromEntries(TYPES.map(t => [t[0], t[2]])), TNAME = Object.fromEntries(TYPES.map(t => [t[0], t[1]]));
const tkey = t => TCOL[t] ? t : 'other';
const REG = [['N', 'Miền Bắc'], ['C', 'Miền Trung'], ['S', 'Miền Nam']], RNAME = Object.fromEntries(REG);
const RCOL = {N: '#eef1fb', C: '#f6f1e6', S: '#ecf6f2'};
const STATUS = [['op', 'Đang vận hành'], ['con', 'Đang xây dựng'], ['plan', 'Quy hoạch / đã phê duyệt']], SNAME = Object.fromEntries(STATUS);
const REL = {own: 'Đơn vị trực thuộc', subsidiary: 'Công ty con (hợp nhất)', associate: 'Công ty liên kết', indirect: 'Đầu tư gián tiếp', operator: 'Vận hành, không sở hữu'};
const OWNF = [['all', 'Toàn ngành'], ['listed', 'Doanh nghiệp niêm yết'], ['evn', 'EVN & đơn vị thành viên'], ['other', 'Chủ đầu tư khác']];

function load(url, css) {
  return new Promise((ok, no) => {
    if (css) { if (document.querySelector(`link[href="${url}"]`)) return ok(); const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = url; l.onload = ok; l.onerror = no; document.head.append(l); return; }
    if (document.querySelector(`script[src="${url}"]`) && (url !== LEAF_JS || window.L)) return ok();
    const s = document.createElement('script'); s.src = url; s.onload = ok; s.onerror = no; document.head.append(s);
  });
}
const here = () => { const s = document.querySelector('script[src*="power-plant-map.js"]'); return s ? s.src.replace(/power-plant-map\.js.*$/, '') : 'app/'; };

function mount(host) {
  if (!host || host.dataset.pmReady) return; host.dataset.pmReady = '1';
  const base = here(), v = (document.querySelector('script[src*="power-plant-map.js"]')?.src.match(/\?v=([^&]+)/) || [])[1] || '';
  host.innerHTML = '<div class="pm-loading">Đang tải bản đồ…</div>';
  Promise.all([load(LEAF_CSS, true), load(LEAF_JS), window.GAS_BASE ? null : load(base + 'vn-base.js?v=' + v), window.POWER_PLANTS ? null : load(base + '../../data/power-plants.js?v=' + v)])
    .then(() => build(host, window.POWER_PLANTS))
    .catch(e => { console.error(e); host.innerHTML = '<div class="pm-loading">Không tải được thư viện bản đồ (Leaflet, cdnjs) hoặc dữ liệu nhà máy.</div>'; });
}

function chips(name, opts, multi, init) {
  return `<div class="pm-seg" role="group" aria-label="${esc(name)}" data-f="${esc(name)}">${opts.map(([k, t]) => `<button type="button" data-v="${k}" aria-pressed="${multi ? init.includes(k) : k === init}">${esc(t)}</button>`).join('')}</div>`;
}

function build(host, D) {
  if (!D?.plants?.length) { host.innerHTML = '<div class="pm-loading">N/A · chưa có dữ liệu nhà máy (data/power-plants.json).</div>'; return; }
  const P = D.plants, TK = D.tickers || {};
  const tickers = Object.keys(TK).filter(t => P.some(p => (p.owners || []).some(o => o.t === t))).sort();
  const S = {reg: 'all', types: new Set(TYPES.map(t => t[0])), st: new Set(['op', 'con']), own: 'all', q: '', tk: '', sel: null};
  host.innerHTML = `
    <div class="pm-ctl">
      <div class="pm-row"><span class="pm-lab">Trạng thái</span>${chips('Trạng thái', [...STATUS.map(([k, t]) => [k, t.split(' /')[0]]), ['allst', 'Tất cả']], true, ['op', 'con'])}</div>
      <div class="pm-row"><span class="pm-lab">Sở hữu</span>${chips('Sở hữu', OWNF, false, 'all')}
        <label class="pm-search"><span class="pm-lab">Tìm</span><input type="search" list="pm-dl" placeholder="Tên nhà máy hoặc mã cổ phiếu" aria-label="Tìm nhà máy hoặc mã cổ phiếu"></label>
        <datalist id="pm-dl">${tickers.map(t => `<option value="${esc(t)}">`).join('')}${P.map(p => `<option value="${esc(p.name)}">`).join('')}</datalist></div>
      <div class="pm-row pm-tkrow"><span class="pm-lab">Theo mã</span><div class="pm-seg pm-tks" role="group" aria-label="Danh mục nhà máy theo mã cổ phiếu"><button type="button" data-tk="" aria-pressed="true">Không chọn</button>${tickers.map(t => `<button type="button" data-tk="${esc(t)}" aria-pressed="false">${esc(t)}</button>`).join('')}</div></div>
    </div>
    <div class="pm-kpis"></div>
    <div class="pm-legend" role="group" aria-label="Bật/tắt loại hình điện"><button type="button" class="pm-lg-all" data-t="all">Bỏ chọn hết</button>${TYPES.map(([k, t, c]) => `<button type="button" class="pm-lg-t" data-t="${k}" aria-pressed="true" style="--c:${c}"><i></i><span>${esc(t)}</span><b></b></button>`).join('')}</div>
    <div class="pm-maps">${REG.map(([r, n]) => `<figure class="pm-mbox" data-r="${r}"><figcaption><span>${n}</span><b></b></figcaption><div class="pm-map" role="application" aria-label="Bản đồ nhà máy điện ${n}"></div></figure>`).join('')}</div>
    <aside class="pm-side" aria-live="polite"></aside>
    <div class="pm-reg"><div class="pm-reg-h">Cơ cấu công suất theo miền (MW)</div><div class="pm-reg-bars"></div></div>
    <div class="pw-src source-note">Nguồn: ${esc(D.meta?.source_note || '')} Ghi chú nguồn theo từng nhà máy: bấm vào nhà máy. Cập nhật ${esc(D.meta?.checked_at || '')}.</div>`;

  /* ---------- Bản đồ ---------- */
  const L = window.L, side = host.querySelector('.pm-side');
  // Mỗi miền một bản đồ; miền Trung kéo tới Hoàng Sa, miền Nam tới Trường Sa (thể hiện chủ quyền).
  const VIEW = {N: [[17.5, 102.1], [23.45, 108.3]], C: [[11.4, 105.7], [18.2, 112.9]], S: [[8.3, 103.6], [12.6, 115.0]]};
  const MAPS = REG.map(([r]) => {
    const el = host.querySelector(`.pm-mbox[data-r="${r}"] .pm-map`);
    const map = L.map(el, {zoomSnap: 0.25, minZoom: 5, maxZoom: 11, attributionControl: false, maxBounds: [[3.5, 99.5], [25.5, 121]], maxBoundsViscosity: 0.8, zoomControl: true});
    map.fitBounds(VIEW[r]);
    if (r === 'S') L.control.attribution({prefix: false}).addAttribution('Natural Earth · geoBoundaries · OpenStreetMap').addTo(map);
    L.geoJSON(window.GAS_BASE, {interactive: false, style: f => f.properties.role === 'nb' ? {color: '#c6ccda', weight: 0.6, fillColor: '#eef0f5', fillOpacity: 1} : {color: '#9aa6c4', weight: 0.8, fillColor: '#ffffff', fillOpacity: 1}}).addTo(map);
    if (D.regions) L.geoJSON(D.regions, {interactive: false, style: f => ({stroke: false, fillColor: f.properties.r === r ? RCOL[r] : '#f7f8fb', fillOpacity: 1})}).addTo(map);
    [[16.45, 112.05, 'QĐ. Hoàng Sa (Việt Nam)'], [9.6, 114.3, 'QĐ. Trường Sa (Việt Nam)']].forEach(([la, lo, t]) => L.marker([la, lo], {interactive: false, icon: L.divIcon({className: 'pm-isl', html: esc(t), iconSize: null})}).addTo(map));
    const layer = L.layerGroup().addTo(map);
    const m = {r, el, map, layer};
    map.on('zoomend', () => drawOne(m));
    new ResizeObserver(() => map.invalidateSize()).observe(el);
    return m;
  });
  const mapOf = p => MAPS.find(m => m.r === p.region) || MAPS[0];
  const rad = (mw, z) => Math.max(2.5, Math.sqrt(Math.max(mw || 0, 1)) * 0.42 * Math.pow(1.45, z - 6));

  /* ---------- Lọc ---------- */
  const fold = x => String(x || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
  const q = () => fold(S.q.trim());
  const isListed = p => (p.owners || []).some(o => o.rel !== 'operator' && TK[o.t]?.listed !== false);  // mã đã hủy niêm yết (BCG) không tính
  const ownOk = p => S.own === 'all' || (S.own === 'listed' ? isListed(p) : S.own === 'evn' ? !!p.evn : !isListed(p) && !p.evn);
  const match = p => { const s = q(); if (!s) return true; return fold(p.name).includes(s) || (p.owners || []).some(o => o.t.toLowerCase() === s) || fold(p.owner).includes(s) || fold(p.prov).includes(s); };
  const pass = p => (S.reg === 'all' || p.region === S.reg) && S.types.has(tkey(p.type)) && S.st.has(p.status) && ownOk(p) && match(p);
  const inTk = p => !S.tk || (p.owners || []).some(o => o.t === S.tk);
  const vis = () => P.filter(p => !p.agg && pass(p));  // danh mục áp mái (agg) chỉ hiện trong danh mục của mã

  /* ---------- Vẽ ---------- */
  function draw() { MAPS.forEach(drawOne); stats(); if (!S.sel) summary(); }
  function drawOne(M) {
    const {map, layer} = M;
    layer.clearLayers();
    const z = map.getZoom(), list = vis().filter(p => fin(p.lat) && fin(p.lon) && p.region === M.r);
    const style = (p, on) => {
      const c = TCOL[tkey(p.type)], st = p.status;
      return {radius: rad(p.mw, z), color: '#fff', weight: 0.8, fillColor: c, fillOpacity: on ? 0.78 : 0.12, opacity: on ? 1 : 0.25};
    };
    if (z < 7 && !S.tk && !q()) {
      // Gom theo ô lưới 34 px × loại nguồn × trạng thái.
      const cells = new Map();
      list.forEach(p => { const pt = map.latLngToLayerPoint([p.lat, p.lon]), k = `${Math.floor(pt.x / 34)}:${Math.floor(pt.y / 34)}:${tkey(p.type)}`;
        const c = cells.get(k) || {ps: [], mw: 0, la: 0, lo: 0}; c.ps.push(p); c.mw += p.mw || 0; c.la += p.lat; c.lo += p.lon; cells.set(k, c); });
      [...cells.values()].sort((a, b) => b.mw - a.mw).forEach(c => {
        const p0 = c.ps[0], at = [c.la / c.ps.length, c.lo / c.ps.length];
        const m = L.circleMarker(at, {...style({...p0, mw: c.mw}, true)}).addTo(layer);
        if (c.ps.length === 1) bindPlant(m, p0);
        else {
          m.bindTooltip(`<b>${c.ps.length} nhà máy ${esc(TNAME[tkey(p0.type)].toLowerCase())}</b><br>${nf(c.mw)} MW<br><span class="pm-tip-s">Bấm để phóng to</span>`, {className: 'pm-tip', direction: 'top'});
          m.on('click', () => map.fitBounds(L.latLngBounds(c.ps.map(p => [p.lat, p.lon])).pad(0.4), {maxZoom: 9}));
        }
      });
    } else {
      list.slice().sort((a, b) => (b.mw || 0) - (a.mw || 0)).forEach(p => { const on = inTk(p); const m = L.circleMarker([p.lat, p.lon], style(p, on)).addTo(layer); bindPlant(m, p); if (S.sel === p.id) m.setStyle({weight: 3, color: '#111'}); });
    }
  }
  function bindPlant(m, p) {
    const tk = [...new Set((p.owners || []).map(o => o.t))];
    m.bindTooltip(`<b>${esc(p.name)}</b><br>${esc(TNAME[tkey(p.type)])} · ${fin(p.mw) ? nf(p.mw) + ' MW' : 'N/A'}${tk.length ? '<br>Mã: ' + esc(tk.join(', ')) : ''}`, {className: 'pm-tip', direction: 'top'});
    m.on('click', () => { S.sel = p.id; detail(p); draw(); });
  }

  /* ---------- Ô số, cơ cấu 3 miền ---------- */
  function legendMw() {
    const base = P.filter(p => !p.agg && (S.reg === 'all' || p.region === S.reg) && S.st.has(p.status) && ownOk(p) && match(p) && inTk(p)), m = {};
    base.forEach(p => { const k = tkey(p.type); m[k] = (m[k] || 0) + (p.mw || 0); });
    host.querySelectorAll('.pm-lg-t').forEach(b => { b.querySelector('b').textContent = m[b.dataset.t] ? nf(m[b.dataset.t]) + ' MW' : '0'; });
  }
  function stats() {
    legendMw();
    const list = vis().filter(inTk), mw = list.reduce((a, p) => a + (p.mw || 0), 0);
    const by = k => list.filter(p => p.status === k).reduce((a, p) => a + (p.mw || 0), 0);
    host.querySelector('.pm-kpis').innerHTML = [['Số nhà máy', nf(list.length), ''], ['Đang vận hành', nf(by('op')), 'MW'], ['Đang xây dựng', nf(by('con')), 'MW'], ['Quy hoạch', S.st.has('plan') ? nf(by('plan')) : 'ẩn', S.st.has('plan') ? 'MW' : '']]
      .map(([l, v, u]) => `<div class="pm-k"><span>${l}</span><b>${v}${u ? ` <small>${u}</small>` : ''}</b></div>`).join('');
    const tot = {N: 0, C: 0, S: 0}, cell = {};
    list.forEach(p => { if (!tot.hasOwnProperty(p.region)) return; tot[p.region] += p.mw || 0; const k = p.region + tkey(p.type); cell[k] = (cell[k] || 0) + (p.mw || 0); });
    const max = Math.max(1, ...Object.values(tot));
    REG.forEach(([r]) => { const b = host.querySelector(`.pm-mbox[data-r="${r}"] figcaption b`); if (b) b.textContent = nf(tot[r]) + ' MW'; });
    host.querySelector('.pm-reg-bars').innerHTML = REG.map(([r, name]) => `<div class="pm-rb${S.reg !== 'all' && S.reg !== r ? ' dim' : ''}"><span class="pm-rb-l">${name}</span><span class="pm-rb-t" style="width:${tot[r] / max * 100}%">${TYPES.map(([k, t, c]) => cell[r + k] ? `<i style="flex:${cell[r + k]};background:${c}" title="${esc(t)}: ${nf(cell[r + k])} MW (${nf(cell[r + k] / tot[r] * 100, 0)}%)"></i>` : '').join('')}</span><b>${nf(tot[r])}</b></div>`).join('')
      + `<div class="pm-rb-note">${S.types.size === 1
        ? (() => { const all = REG.reduce((a, [r]) => a + tot[r], 0); return all ? `${esc(TNAME[[...S.types][0]])} phân bổ: ` + REG.map(([r, name]) => `${name} ${nf(tot[r] / all * 100, 0)}%`).join(' · ') : ''; })()
        : REG.map(([r, name]) => tot[r] ? `${name}: ${TYPES.filter(([k]) => cell[r + k]).sort((a, b) => cell[r + b[0]] - cell[r + a[0]]).slice(0, 2).map(([k, t]) => `${t.toLowerCase()} ${nf(cell[r + k] / tot[r] * 100, 0)}%`).join(', ')}` : '').filter(Boolean).join(' · ')}</div>`;
  }

  /* ---------- Khung bên ---------- */
  function summary() {
    if (S.tk) return portfolio(S.tk);
    const list = vis(), mw = list.reduce((a, p) => a + (p.mw || 0), 0), byT = {};
    list.forEach(p => { const k = tkey(p.type); byT[k] = (byT[k] || 0) + (p.mw || 0); });
    side.innerHTML = `<div class="pm-sh">${S.reg === 'all' ? 'Toàn quốc' : RNAME[S.reg]}</div><div class="pm-big">${nf(mw)} <small>MW</small></div><div class="pm-sub">${nf(list.length)} nhà máy theo bộ lọc</div>
      ${mixBar(byT, mw)}<p class="pm-hint">Bấm một nhà máy để xem chi tiết; chọn mã cổ phiếu để xem danh mục tài sản.</p>`;
  }
  const mixBar = (byT, tot) => `<div class="pm-mix">${TYPES.filter(([k]) => byT[k]).sort((a, b) => byT[b[0]] - byT[a[0]]).map(([k, t, c]) => `<div class="pm-mx"><span><i style="background:${c}"></i>${esc(t)}</span><span class="pm-mx-t"><i style="width:${byT[k] / tot * 100}%;background:${c}"></i></span><b>${nf(byT[k])}</b></div>`).join('')}</div>`;
  function portfolio(t) {
    const ps = P.filter(p => (p.owners || []).some(o => o.t === t) && S.st.has(p.status));
    const own = p => (p.owners || []).filter(o => o.t === t);
    const phys = ps.reduce((a, p) => a + (p.mw || 0), 0);
    const eqKnown = ps.filter(p => own(p).some(o => fin(o.pct)) && fin(p.mw));
    const eq = eqKnown.reduce((a, p) => a + p.mw * Math.min(100, Math.max(...own(p).map(o => o.pct).filter(fin))) / 100, 0);
    const byT = {}, byR = {};
    ps.forEach(p => { const k = tkey(p.type); byT[k] = (byT[k] || 0) + (p.mw || 0); byR[p.region] = (byR[p.region] || 0) + (p.mw || 0); });
    const info = TK[t] || {};
    side.innerHTML = `<div class="pm-sh">${esc(t)}${info.exchange ? ` <small>${esc(info.exchange)}</small>` : ''}</div><div class="pm-sub">${esc(info.name || '')}${info.listed === false ? ' · đã hủy niêm yết' : ''}</div>
      <div class="pm-two"><div><span>Công suất vật lý</span><b>${nf(phys)} <small>MW</small></b></div><div><span>Quy đổi theo tỷ lệ sở hữu</span><b>${eqKnown.length ? nf(eq) : 'N/A'} <small>MW</small></b></div></div>
      ${ps.length - eqKnown.length ? `<div class="pm-sub">${ps.length - eqKnown.length}/${ps.length} nhà máy chưa có tỷ lệ sở hữu công bố, không tính vào số quy đổi.</div>` : ''}
      <div class="pm-sh2">Theo nguồn</div>${mixBar(byT, phys || 1)}
      <div class="pm-sh2">Theo miền</div><div class="pm-mix">${REG.filter(([r]) => byR[r]).map(([r, n]) => `<div class="pm-mx"><span>${n}</span><span class="pm-mx-t"><i style="width:${byR[r] / (phys || 1) * 100}%;background:#1D2678"></i></span><b>${nf(byR[r])}</b></div>`).join('')}</div>
      <div class="pm-sh2">Nhà máy (${ps.length})</div><ul class="pm-list">${ps.sort((a, b) => (b.mw || 0) - (a.mw || 0)).map(p => { const o = own(p)[0];
        return `<li><button type="button" data-id="${esc(p.id)}"><i style="background:${TCOL[tkey(p.type)]}"></i><span>${esc(p.name)}${fin(p.lat) ? '' : ' <em>(chưa có tọa độ)</em>'}</span><b>${nf(p.mw)}</b><small>${esc(REL[o?.rel] || 'N/A')} · ${fin(o?.pct) ? nf(o.pct, o.pct % 1 ? 1 : 0) + '%' : 'N/A'}</small></button></li>`; }).join('')}</ul>`;
    side.querySelectorAll('[data-id]').forEach(b => b.addEventListener('click', () => { const p = P.find(x => x.id === b.dataset.id); S.sel = p.id; if (fin(p.lat)) { const M = mapOf(p); M.map.setView([p.lat, p.lon], Math.max(M.map.getZoom(), 8)); M.el.scrollIntoView({block: 'nearest'}); } detail(p); draw(); }));
  }
  function detail(p) {
    const row = (k, v) => `<dt>${k}</dt><dd>${v == null || v === '' ? NA : v}</dd>`;
    const own = (p.owners || []).filter(o => o.rel !== 'operator');
    const eq = own.filter(o => fin(o.pct) && fin(p.mw)).map(o => `${esc(o.t)}: ${nf(p.mw * o.pct / 100, 1)} MW`).join('<br>');
    side.innerHTML = `<button type="button" class="pm-back">← ${S.tk ? 'Danh mục ' + esc(S.tk) : 'Tổng quan'}</button>
      <div class="pm-sh"><i class="pm-dot" style="background:${TCOL[tkey(p.type)]}"></i>${esc(p.name)}</div>
      <dl class="pm-dl">${row('Địa điểm', [p.prov, RNAME[p.region]].filter(Boolean).map(esc).join(' · '))}${row('Loại nguồn', esc(TNAME[tkey(p.type)] + (tkey(p.type) === 'other' && p.type !== 'other' ? ' (' + ({biomass: 'sinh khối', oil: 'dầu', waste: 'rác thải'}[p.type] || p.type) + ')' : '')))}
        ${row('Công suất lắp đặt', fin(p.mw) ? nf(p.mw, p.mw % 1 ? 1 : 0) + ' MW' : null)}${row('Chủ đầu tư', esc(p.owner || ''))}${row('Đơn vị vận hành', esc(p.operator || ''))}
        ${row('Công ty mẹ, mã cổ phiếu', own.length ? own.map(o => `<b>${esc(o.t)}</b>${o.via ? ' qua ' + esc(o.via) : ''} · ${esc(REL[o.rel] || 'N/A')}`).join('<br>') : null)}
        ${row('Tỷ lệ sở hữu', own.length ? own.map(o => `${esc(o.t)}: ${fin(o.pct) ? nf(o.pct, o.pct % 1 ? 2 : 0) + '%' : 'N/A'}`).join('<br>') : null)}
        ${row('Công suất quy đổi theo tỷ lệ', eq || null)}${row('Năm vận hành (COD)', p.cod ? esc(p.cod) : null)}${row('Trạng thái', esc(SNAME[p.status] || '') + (p.note ? `<br><small class="pm-na">${esc(p.note)}</small>` : ''))}
        ${row(p.type === 'hydro' ? 'Lưu vực' : 'Nhiên liệu', esc(p.fuel || ''))}${row('Cơ chế giá / PPA', esc(p.ppa || ''))}
        ${row('Nguồn dữ liệu', (p.src || []).map(s => s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label || 'nguồn')}</a>` : esc(s.label)).join('<br>'))}${row('Cập nhật', esc(p.checked || D.meta?.checked_at || ''))}</dl>`;
    side.querySelector('.pm-back').addEventListener('click', () => { S.sel = null; draw(); });
  }

  /* ---------- Điều khiển ---------- */
  const seg = n => host.querySelector(`.pm-seg[data-f="${n}"]`);
  const press = (g, f) => g.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(f(b))));
  seg('Trạng thái').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const v = b.dataset.v;
    if (v === 'allst') S.st = new Set(STATUS.map(s => s[0])); else { S.st.has(v) ? S.st.delete(v) : S.st.add(v); if (!S.st.size) S.st.add(v); }
    press(seg('Trạng thái'), x => x.dataset.v === 'allst' ? S.st.size === 3 : S.st.has(x.dataset.v)); draw(); });
  const lg = host.querySelector('.pm-legend'), ALLT = TYPES.map(t => t[0]);
  const syncLg = () => { lg.querySelectorAll('.pm-lg-t').forEach(b => b.setAttribute('aria-pressed', String(S.types.has(b.dataset.t)))); lg.querySelector('.pm-lg-all').textContent = S.types.size === ALLT.length ? 'Bỏ chọn hết' : 'Chọn hết'; };
  lg.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const t = b.dataset.t;
    if (t === 'all') S.types = new Set(S.types.size === ALLT.length ? [] : ALLT);
    else { S.types.has(t) ? S.types.delete(t) : S.types.add(t); }
    syncLg(); S.sel = null; draw(); });
  seg('Sở hữu').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.own = b.dataset.v; press(seg('Sở hữu'), x => x === b); draw(); });
  const tkBox = host.querySelector('.pm-tks');
  const pickTk = t => { S.tk = t; S.sel = null; press(tkBox, x => x.dataset.tk === t); const ps = P.filter(p => t && (p.owners || []).some(o => o.t === t) && fin(p.lat));
    MAPS.forEach(M => M.map.fitBounds(VIEW[M.r])); draw(); };
  tkBox.addEventListener('click', e => { const b = e.target.closest('button'); if (b) pickTk(b.dataset.tk); });
  const inp = host.querySelector('.pm-search input');
  inp.addEventListener('input', () => {
    const v = inp.value.trim(), up = v.toUpperCase();
    if (tickers.includes(up)) { inp.value = ''; S.q = ''; pickTk(up); return; }
    const exact = P.find(p => p.name === v);
    if (exact) { S.q = ''; S.sel = exact.id; if (fin(exact.lat)) { const M = mapOf(exact); M.map.setView([exact.lat, exact.lon], 9); M.el.scrollIntoView({block: 'nearest'}); } detail(exact); draw(); return; }
    if (S.tk) { S.tk = ''; press(tkBox, x => x.dataset.tk === ''); }  // gõ tên nhà máy: bỏ chọn mã
    S.q = v; S.sel = null; draw();
  });
  setTimeout(() => MAPS.forEach(M => M.map.invalidateSize()), 60);
  draw();
}

window.PowerPlantMap = {mount};
})();
