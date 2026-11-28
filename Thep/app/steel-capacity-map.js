/* Thép · Tổng quan ngành › Bản đồ ngành › Bản đồ phân bổ năng lực sản xuất thép Việt Nam (28/11/2026, người dùng yêu cầu).
   - Dữ liệu: window.STEEL_CAP (data/steel-capacity.js, sinh bởi scripts/build_steel_capacity.py từ data/steel/capacity/plants.json).
   - Nền: GeoJSON Natural Earth 1:10m (app/vn-base.js, chép từ Điện ← Phân bón), Hoàng Sa, Trường Sa thuộc Việt Nam; không dùng tile ngoài.
   - Ba chế độ: Luyện thép (công suất thép thô danh nghĩa theo công nghệ) · Sản phẩm thép (công suất thiết kế một nhóm sản phẩm, không cộng
     các công đoạn) · Dự án tương lai (công suất tăng thêm, tách khỏi công suất đang vận hành).
   - Bubble: diện tích ∝ công suất (r = max(4, k·√Mtpa), tối đa 30 px). Vận hành: tô đặc · đang xây dựng: viền đứt, nền mờ · đã công bố,
     chuẩn bị đầu tư: rỗng · đình trệ/tạm dừng: xám. Nhà máy nhiều công nghệ: bánh (pie) theo tỷ trọng công suất từng công nghệ.
     Marker chồng nhau gom thành cụm (theo khoảng cách điểm ảnh ở mức zoom hiện tại); không dịch tọa độ thật.
   - Mọi bộ lọc cập nhật đồng thời ô số, bản đồ, các chart A–D và nhận định. Số thiếu là null → "Chưa có dữ liệu", không thay bằng 0. */
(() => {
'use strict';
const LEAF_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
const LEAF_JS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const fin = v => typeof v === 'number' && Number.isFinite(v);
const nf = (v, d = 2) => fin(v) ? v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}) : '—';
const nf3 = v => fin(v) ? v.toLocaleString('vi-VN', {minimumFractionDigits: 2, maximumFractionDigits: 3}) : '—';  // số công suất nhà máy: giữ 3 chữ số lẻ (14,499)
const pct = (a, b) => fin(a) && b > 0 ? nf(a / b * 100, 1) + '%' : '—';
const NA = '<span class="sc-na">Chưa có dữ liệu</span>';

const TECH = [['BOF', 'BF–BOF (lò cao – lò thổi)', '#D97706'], ['EAF', 'EAF (lò hồ quang điện)', '#2563EB'], ['IF', 'IF (lò cảm ứng)', '#8B5CF6'],
  ['DRI', 'DRI–EAF', '#0D9488'], ['OTHER', 'Công nghệ khác / chưa xác định', '#9CA3AF']];
const TCOL = Object.fromEntries(TECH.map(t => [t[0], t[2]])), TNAME = Object.fromEntries(TECH.map(t => [t[0], t[1]]));
const ROLL = '#64748B';  // cán thép hạ nguồn
const PROD = [['hrc', 'HRC'], ['rebar', 'Thép xây dựng'], ['section', 'Thép hình'], ['crc', 'Thép cuộn cán nguội'], ['coated', 'Tôn mạ'], ['pipe', 'Ống thép']];
const PNAME = Object.fromEntries(PROD);
const REG = [['N', 'Miền Bắc'], ['C', 'Miền Trung'], ['S', 'Miền Nam']], RNAME = Object.fromEntries(REG);
const RVIEW = {all: [[8.3, 102.2], [23.4, 112.8]], N: [[19.9, 102.6], [23.2, 108.0]], C: [[11.6, 104.3], [20.2, 109.6]], S: [[8.4, 104.3], [12.2, 109.4]]};
const ST = [['operating', 'Đang vận hành'], ['construction', 'Đang xây dựng'], ['announced', 'Đã công bố / chuẩn bị đầu tư'], ['idle', 'Đình trệ / tạm dừng']];
const SNAME = Object.fromEntries(ST);
const stKey = s => s === 'preparing' ? 'announced' : s === 'stalled' || s === 'mothballed' ? 'idle' : s;  // nhóm trạng thái hiển thị
const OWNG = [['listed', 'Niêm yết'], ['unlisted', 'Chưa niêm yết'], ['fdi', 'FDI'], ['jv', 'Liên doanh']], OWNAME = Object.fromEntries(OWNG);
const MODES = [['crude', 'Luyện thép'], ['product', 'Sản phẩm thép'], ['future', 'Dự án tương lai']];
const K = 7.8, RMAX = 30, rad = m => fin(m) ? Math.min(RMAX, Math.max(4, K * Math.sqrt(m))) : 7;

function load(url, css) {
  return new Promise((ok, no) => {
    if (css) { if (document.querySelector(`link[href="${url}"]`)) return ok(); const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = url; l.onload = ok; l.onerror = no; document.head.append(l); return; }
    if (url === LEAF_JS && window.L) return ok();
    const s = document.createElement('script'); s.src = url; s.onload = ok; s.onerror = no; document.head.append(s);
  });
}
const here = () => { const s = document.querySelector('script[src*="steel-capacity-map.js"]'); return s ? s.src.replace(/steel-capacity-map\.js.*$/, '') : 'app/'; };

/* ---------- Công suất theo công nghệ của một nhà máy ----------
   Thành phần (bof/eaf/if/dri) dùng khi có; nhà máy một công nghệ chưa tách thì gán toàn bộ công suất danh nghĩa cho công nghệ đó.
   Không bao giờ cộng công suất luyện gang (crude_iron) vào thép thô. */
function split(p) {
  const c = p.capacity || {}, out = {};
  const parts = {BOF: c.bof_mtpa, EAF: c.eaf_mtpa, IF: c.if_mtpa, DRI: c.dri_mtpa};
  const known = Object.entries(parts).filter(([, v]) => fin(v));
  if (known.length) known.forEach(([k, v]) => { out[k] = v; });
  else if (fin(c.nominal_crude_steel_mtpa)) { const t = (p.technology || []).map(techKey); out[t.length === 1 ? t[0] : 'OTHER'] = c.nominal_crude_steel_mtpa; }
  return out;
}
const techKey = t => ({'BF-BOF': 'BOF', BOF: 'BOF', 'BF–BOF': 'BOF', EAF: 'EAF', IF: 'IF', DRI: 'DRI', 'DRI-EAF': 'DRI', Rolling: 'ROLL'}[t] || 'OTHER');
const isRoll = x => (x.technology || []).includes('Rolling');  // dự án/nhà máy cán: không có thép thô, chỉ ở chế độ Sản phẩm thép
const techs = p => { const s = split(p); const k = Object.keys(s); return k.length ? k : (p.technology || []).map(techKey); };
const mainTech = p => { const s = split(p); const k = Object.keys(s).sort((a, b) => s[b] - s[a]); return k[0] || techs(p)[0] || 'OTHER'; };

function mount(host) {
  if (!host || host.dataset.scReady) return; host.dataset.scReady = '1';
  host.innerHTML = '<div class="sc-loading">Đang tải bản đồ…</div>';
  const v = (document.querySelector('script[src*="steel-capacity-map.js"]')?.src.match(/\?v=([^&]+)/) || [])[1] || '';
  Promise.all([load(LEAF_CSS, true), load(LEAF_JS), window.GAS_BASE ? null : load(here() + 'vn-base.js?v=' + v)])
    .then(() => build(host, window.STEEL_CAP))
    .catch(e => { console.error(e); host.innerHTML = '<div class="sc-loading">Không tải được thư viện bản đồ (Leaflet, cdnjs) hoặc nền bản đồ.</div>'; });
}

function seg(name, opts, sel, multi) {
  return `<div class="sc-seg" role="group" aria-label="${esc(name)}" data-f="${esc(name)}">${opts.map(([k, t]) => `<button type="button" data-v="${esc(k)}" aria-pressed="${multi ? sel.includes(k) : k === sel}">${esc(t)}</button>`).join('')}</div>`;
}
const sel = (name, opts, all) => `<label class="sc-sel"><span class="sc-lab">${esc(name)}</span><select data-f="${esc(name)}"><option value="">${esc(all)}</option>${opts.map(([k, t]) => `<option value="${esc(k)}">${esc(t)}</option>`).join('')}</select></label>`;

function build(host, D) {
  if (!D?.plants?.length) { host.innerHTML = '<div class="sc-loading">Chưa có dữ liệu nhà máy (data/steel/capacity/plants.json).</div>'; return; }
  const P = D.plants, J = D.projects || [], SRC = D.sources || {};
  const companies = [...new Set([...P, ...J].map(x => x.company_group).filter(Boolean))];
  const coOpts = ['HPG', 'Formosa', 'VAS', 'VNSteel'].filter(c => companies.includes(c)).map(c => [c, c]).concat([['_other', 'Khác']]);
  const DEF = () => ({mode: 'crude', reg: 'all', tech: new Set(TECH.map(t => t[0])), st: new Set(ST.map(s => s[0])), prod: '', pmode: 'hrc', co: '', own: '', sel: null});
  let S = DEF();

  host.innerHTML = `
    <div class="sc-top">${seg('Chế độ xem', MODES, 'crude')}<button type="button" class="sc-reset">Đặt lại bộ lọc</button></div>
    <div class="sc-ctl">
      <div class="sc-row"><span class="sc-lab">Khu vực</span>${seg('Khu vực', [['all', 'Toàn quốc'], ...REG.map(([k, t]) => [k, t.replace('Miền ', '')])], 'all')}
        <span class="sc-lab">Trạng thái</span>${seg('Trạng thái', ST.map(([k, t]) => [k, t.split(' /')[0]]), ST.map(s => s[0]), true)}</div>
      <div class="sc-row sc-r-tech"><span class="sc-lab">Công nghệ</span>${seg('Công nghệ', [['BOF', 'BF–BOF'], ['EAF', 'EAF'], ['IF', 'IF'], ['DRI', 'DRI–EAF'], ['OTHER', 'Khác']], TECH.map(t => t[0]), true)}</div>
      <div class="sc-row sc-r-pmode" hidden><span class="sc-lab">Nhóm sản phẩm</span>${seg('Nhóm sản phẩm', PROD, 'hrc')}</div>
      <div class="sc-row">${sel('Sản phẩm', PROD.filter(p => ['hrc', 'rebar', 'coated', 'pipe'].includes(p[0])).concat([['_other', 'Khác']]), 'Tất cả sản phẩm')}${sel('Doanh nghiệp', coOpts, 'Tất cả doanh nghiệp')}${sel('Nhóm sở hữu', OWNG, 'Tất cả')}</div>
    </div>
    <div class="sc-kpis"></div>
    <div class="sc-wrap">
      <div class="sc-mapbox"><div class="sc-map" role="application" aria-label="Bản đồ nhà máy thép Việt Nam"></div><button type="button" class="sc-home" title="Về toàn quốc">⤢ Toàn quốc</button></div>
      <aside class="sc-side" aria-live="polite"></aside>
    </div>
    <div class="sc-legend"></div>
    <div class="sc-below"><div class="sc-chart sc-pipe"></div><div class="sc-ins"></div></div>
    <div class="pw-src source-note sc-foot"></div>`;

  /* ---------- Bản đồ ---------- */
  const L = window.L, side = host.querySelector('.sc-side'), mapEl = host.querySelector('.sc-map');
  const map = L.map(mapEl, {zoomSnap: 0.25, minZoom: 5, maxZoom: 13, attributionControl: false, maxBounds: [[3.5, 99.5], [25.5, 121]], maxBoundsViscosity: 0.8});
  map.fitBounds(RVIEW.all);
  L.control.attribution({prefix: false}).addAttribution('Natural Earth · Global Energy Monitor (CC BY 4.0) · nguồn doanh nghiệp').addTo(map);
  L.geoJSON(window.GAS_BASE, {interactive: false, style: f => f.properties.role === 'nb' ? {color: '#c6ccda', weight: 0.6, fillColor: '#eef0f5', fillOpacity: 1} : {color: '#9aa6c4', weight: 0.8, fillColor: '#ffffff', fillOpacity: 1}}).addTo(map);
  [[16.45, 112.05, 'QĐ. Hoàng Sa (Việt Nam)'], [9.6, 114.3, 'QĐ. Trường Sa (Việt Nam)']].forEach(([la, lo, t]) => L.marker([la, lo], {interactive: false, icon: L.divIcon({className: 'sc-isl', html: esc(t), iconSize: null})}).addTo(map));
  const layer = L.layerGroup().addTo(map);
  map.on('zoomend', drawMap);
  new ResizeObserver(() => map.invalidateSize()).observe(mapEl);
  host.querySelector('.sc-home').addEventListener('click', () => map.fitBounds(RVIEW[S.reg] || RVIEW.all));

  /* ---------- Phần tử hiển thị theo chế độ ----------
     Mỗi phần tử: {id, kind:'plant'|'project', x (bản ghi), cap (Mtpa của chế độ), parts {tech: Mtpa}, st, color...} */
  const coOf = x => x.company_group || 'Khác';
  const coOk = x => !S.co || (S.co === '_other' ? !['HPG', 'Formosa', 'VAS', 'VNSteel'].includes(x.company_group) : x.company_group === S.co);
  const prodOk = x => { if (!S.prod) return true; const ps = Object.keys(x.product_capacity || {}).concat(x.products_group || []);
    return S.prod === '_other' ? ps.some(k => !['hrc', 'rebar', 'coated', 'pipe'].includes(k)) : ps.includes(S.prod); };
  const base = x => (S.reg === 'all' || x.region === S.reg) && coOk(x) && (!S.own || x.ownership_group === S.own) && prodOk(x);
  const techOk = parts => Object.keys(parts).length ? Object.keys(parts).some(k => S.tech.has(k)) : S.tech.has('OTHER');
  // Công suất theo công nghệ chỉ tính phần công nghệ đang chọn (nhà máy EAF + IF, bỏ chọn IF → chỉ còn phần EAF).
  const keep = parts => Object.fromEntries(Object.entries(parts).filter(([k]) => S.tech.has(k)));
  const sum = o => Object.values(o).reduce((a, v) => a + (fin(v) ? v : 0), 0);

  function items() {
    const out = [];
    if (S.mode === 'crude') {
      P.filter(p => p.steelmaking && base(p)).forEach(p => { const st = stKey(p.status); if (!S.st.has(st)) return; const all = split(p); if (!techOk(all)) return; const parts = keep(all);
        out.push({id: p.plant_id, kind: 'plant', x: p, st, parts, cap: Object.keys(all).length ? sum(parts) : null}); });
      J.filter(j => base(j) && fin(j.added_crude_mtpa) !== undefined).forEach(j => { const st = stKey(j.status); if (!S.st.has(st) || j.added_crude_mtpa === undefined) return; const t = techKey(j.technology?.[0]);
        if (j.added_crude_mtpa === null && !(j.technology || []).length) { if (!S.tech.has('OTHER')) return; } else if (!S.tech.has(t)) return;
        out.push({id: j.project_id, kind: 'project', x: j, st, parts: fin(j.added_crude_mtpa) ? {[t]: j.added_crude_mtpa} : {}, cap: fin(j.added_crude_mtpa) ? j.added_crude_mtpa : null}); });
    } else if (S.mode === 'product') {
      const g = S.pmode;
      P.filter(p => base(p) && p.product_capacity && g in p.product_capacity).forEach(p => { const st = stKey(p.status); if (!S.st.has(st)) return;
        const v = p.product_capacity[g]?.mtpa; const t = p.steelmaking ? mainTech(p) : 'ROLL';
        out.push({id: p.plant_id, kind: 'plant', x: p, st, parts: {[t]: v}, cap: fin(v) ? v : null}); });
      J.filter(j => base(j) && j.added_product?.group === g).forEach(j => { const st = stKey(j.status); if (!S.st.has(st)) return; const v = j.added_product.mtpa;
        out.push({id: j.project_id, kind: 'project', x: j, st, parts: {[techKey(j.technology?.[0])]: v}, cap: fin(v) ? v : null}); });
    } else {
      // Dự án tương lai: dự án + phần mở rộng đang xây dựng của nhà máy hiện hữu nổi bật; nhà máy đang vận hành làm nền (mờ).
      J.filter(j => base(j) && !isRoll(j)).forEach(j => { const st = stKey(j.status); if (!S.st.has(st) || st === 'operating') return; const t = techKey(j.technology?.[0]);
        if (!S.tech.has(t) && (j.technology || []).length) return; const v = fin(j.added_crude_mtpa) ? j.added_crude_mtpa : null;
        out.push({id: j.project_id, kind: 'project', x: j, st, parts: v != null ? {[t]: v} : {}, cap: v, hi: true}); });
      P.filter(p => p.steelmaking && base(p) && stKey(p.status) === 'operating').forEach(p => { const all = split(p); if (!techOk(all)) return;
        out.push({id: p.plant_id, kind: 'plant', x: p, st: 'operating', parts: keep(all), cap: sum(keep(all)), bg: true}); });
    }
    return out;
  }

  /* ---------- Marker ---------- */
  const colorOf = k => k === 'ROLL' ? ROLL : TCOL[k] || TCOL.OTHER;
  function svgFor(it, r) {
    const d = 2 * r + 4, c = r + 2, ks = Object.entries(it.parts).filter(([, v]) => fin(v) && v > 0), tot = ks.reduce((a, [, v]) => a + v, 0);
    const main = ks.length ? ks.sort((a, b) => b[1] - a[1])[0][0] : (it.x.technology?.length ? (it.x.steelmaking === false ? 'ROLL' : techKey(it.x.technology[0])) : 'OTHER');
    let col = colorOf(main);
    if (it.bg) return `<svg width="${d}" height="${d}" viewBox="0 0 ${d} ${d}"><circle cx="${c}" cy="${c}" r="${r}" fill="#b7bfd1" fill-opacity=".35" stroke="#fff" stroke-width="1"/></svg>`;
    if (it.cap === null) return `<svg width="${d}" height="${d}" viewBox="0 0 ${d} ${d}"><circle cx="${c}" cy="${c}" r="${r}" fill="#fff" stroke="${col}" stroke-width="1.6" stroke-dasharray="2 2"/><text x="${c}" y="${c + 3.5}" text-anchor="middle" font-size="10" font-weight="700" fill="${col}">?</text></svg>`;
    if (it.st === 'idle') col = '#9CA3AF';
    const stroke = it.st === 'construction' ? `stroke="${col}" stroke-width="1.8" stroke-dasharray="4 3"` : it.st === 'announced' ? `stroke="${col}" stroke-width="2"` : 'stroke="#fff" stroke-width="1.2"';
    const op = it.st === 'construction' ? .28 : it.st === 'announced' ? 0 : .85;
    if (ks.length > 1 && it.st !== 'idle') {
      // Bánh: lát theo tỷ trọng công suất từng công nghệ.
      let a0 = -Math.PI / 2; const sl = ks.map(([k, v]) => { const a1 = a0 + v / tot * 2 * Math.PI, large = a1 - a0 > Math.PI ? 1 : 0;
        const p = `M${c},${c} L${c + r * Math.cos(a0)},${c + r * Math.sin(a0)} A${r},${r} 0 ${large} 1 ${c + r * Math.cos(a1)},${c + r * Math.sin(a1)} Z`; a0 = a1;
        return `<path d="${p}" fill="${colorOf(k)}" fill-opacity="${op || .85}"/>`; }).join('');
      return `<svg width="${d}" height="${d}" viewBox="0 0 ${d} ${d}">${sl}<circle cx="${c}" cy="${c}" r="${r}" fill="none" ${stroke}/></svg>`;
    }
    return `<svg width="${d}" height="${d}" viewBox="0 0 ${d} ${d}"><circle cx="${c}" cy="${c}" r="${r}" fill="${col}" fill-opacity="${op}" ${stroke}/></svg>`;
  }
  function tip(it) {
    const x = it.x, c = x.capacity || {}, parts = split(x);
    const lines = [];
    lines.push(`Địa điểm: ${esc(x.location || x.province || '')}${x.province_current && x.province_current !== x.province ? ` (nay ${esc(x.province_current)})` : ''}`);
    lines.push(`Trạng thái: ${esc(SNAME[stKey(x.status)] || x.status)}${x.status_source ? ' theo ' + esc(x.status_source) : ''}`);
    if (it.kind === 'project') {
      if (S.mode === 'product' && x.added_product) lines.push(`${esc(PNAME[x.added_product.group])} tăng thêm: ${fin(x.added_product.mtpa) ? nf(x.added_product.mtpa) + ' Mtpa' : 'chưa có dữ liệu'}`);
      lines.push(`Thép thô tăng thêm: ${fin(x.added_crude_mtpa) ? nf(x.added_crude_mtpa) + ' Mtpa' : 'chưa có dữ liệu công suất'}`);
      lines.push(`Năm vận hành dự kiến: ${x.cod_year ? esc(x.cod_year) : 'chưa xác định'}`);
    } else if (S.mode === 'product') {
      const g = x.product_capacity[S.pmode]; lines.push(`${esc(PNAME[S.pmode])}: ${fin(g?.mtpa) ? nf(g.mtpa) + ' Mtpa' : 'chưa có dữ liệu'}${g?.definition ? ' · ' + esc(g.definition) : ''}`);
    } else {
      lines.push(`Công suất thép thô: ${fin(c.nominal_crude_steel_mtpa) ? nf3(c.nominal_crude_steel_mtpa) + ' Mtpa' : 'chưa có dữ liệu công suất'}`);
      if (Object.keys(parts).length > 1) Object.entries(parts).forEach(([k, v]) => lines.push(`${esc(k === 'BOF' ? 'BOF' : k)}: ${nf(v)} Mtpa`));
      if (fin(c.company_reported_capacity_mtpa)) lines.push(`Doanh nghiệp công bố: ${nf(c.company_reported_capacity_mtpa, 1)} Mtpa (định nghĩa khác, không dùng trong tổng)`);
    }
    if ((x.products || []).length) lines.push(`Sản phẩm: ${esc(x.products.join(', '))}`);
    if (x.raw_materials) lines.push(`Nguyên liệu chính: ${esc(x.raw_materials)}`);
    const s = (x.sources || []).map(k => SRC[k]).filter(Boolean)[0];
    if (s) lines.push(`Nguồn: ${esc(s.label)}${s.date ? ' · ' + esc(s.date) : ''}`);
    return `<b>${esc(x.plant_name || x.name)}${x.parent_company ? ' – ' + esc(x.parent_company) : ''}</b><br>${lines.join('<br>')}`;
  }

  let ITEMS = [];
  function drawMap() {
    layer.clearLayers();
    const z = map.getZoom(), pts = ITEMS.filter(it => fin(it.x.latitude) && fin(it.x.longitude))
      .map(it => ({it, r: rad(it.cap) * (it.bg ? .8 : 1), pt: map.latLngToLayerPoint([it.x.latitude, it.x.longitude])}))
      .sort((a, b) => (b.it.cap || 0) - (a.it.cap || 0));
    // Gom cụm: marker chồng lên nhau (khoảng cách < tổng bán kính) ở mức zoom hiện tại; zoom tối đa thì không gom.
    const groups = [];
    pts.forEach(p => { const g = z < map.getMaxZoom() && !p.it.bg && groups.find(g => !g.bg && g.ms.some(m => m.pt.distanceTo(p.pt) < (m.r + p.r) * .85));
      if (g) g.ms.push(p); else groups.push({ms: [p], bg: p.it.bg}); });
    groups.sort((a, b) => (a.bg ? 0 : 1) - (b.bg ? 0 : 1)).forEach(g => {
      if (g.ms.length === 1) { const {it, r} = g.ms[0]; const d = 2 * r + 4;
        const m = L.marker([it.x.latitude, it.x.longitude], {icon: L.divIcon({className: 'sc-mk' + (S.sel === it.id ? ' on' : '') + (it.hi ? ' hi' : ''), html: svgFor(it, r), iconSize: [d, d], iconAnchor: [d / 2, d / 2]}),
          zIndexOffset: it.bg ? -500 : Math.round(1000 - r * 10), keyboard: true, title: it.x.plant_name || it.x.name}).addTo(layer);
        m.bindTooltip(tip(it), {className: 'sc-tip', direction: 'top', offset: [0, -r]});
        m.on('click', () => { S.sel = it.id; detail(it); drawMap(); });
        return; }
      const tot = g.ms.reduce((a, m) => a + (m.it.cap || 0), 0), la = g.ms.reduce((a, m) => a + m.it.x.latitude, 0) / g.ms.length, lo = g.ms.reduce((a, m) => a + m.it.x.longitude, 0) / g.ms.length;
      const r = Math.max(13, rad(tot)), d = 2 * r + 4, c = r + 2, by = {};
      g.ms.forEach(m => Object.entries(m.it.parts).forEach(([k, v]) => { if (fin(v)) by[k] = (by[k] || 0) + v; }));
      let a0 = -Math.PI / 2; const t2 = Object.values(by).reduce((a, v) => a + v, 0) || 1;
      const ring = Object.entries(by).map(([k, v]) => { const a1 = a0 + v / t2 * 2 * Math.PI, large = a1 - a0 > Math.PI ? 1 : 0, rr = r - 2;
        const p = `M${c + rr * Math.cos(a0)},${c + rr * Math.sin(a0)} A${rr},${rr} 0 ${large} 1 ${c + rr * Math.cos(a1)},${c + rr * Math.sin(a1)}`; a0 = a1;
        return `<path d="${p}" fill="none" stroke="${colorOf(k)}" stroke-width="4"/>`; }).join('');
      const html = `<svg width="${d}" height="${d}" viewBox="0 0 ${d} ${d}"><circle cx="${c}" cy="${c}" r="${r - 2}" fill="#1D2678" fill-opacity=".88"/>${ring}<text x="${c}" y="${c + 4}" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">${g.ms.length}</text></svg>`;
      const m = L.marker([la, lo], {icon: L.divIcon({className: 'sc-mk sc-cl', html, iconSize: [d, d], iconAnchor: [d / 2, d / 2]}), zIndexOffset: 2000}).addTo(layer);
      m.bindTooltip(`<b>${g.ms.length} nhà máy / dự án</b><br>${g.ms.map(x => `${esc(x.it.x.plant_name || x.it.x.name)}: ${fin(x.it.cap) ? nf(x.it.cap) + ' Mtpa' : 'chưa có số'}`).join('<br>')}<br><span class="sc-tip-s">Bấm để phóng to và tách từng nhà máy</span>`, {className: 'sc-tip', direction: 'top'});
      m.on('click', () => map.fitBounds(L.latLngBounds(g.ms.map(x => [x.it.x.latitude, x.it.x.longitude])).pad(0.6), {maxZoom: map.getMaxZoom()}));
    });
  }

  /* ---------- Ô số ---------- */
  function kpis() {
    const box = host.querySelector('.sc-kpis'), I = ITEMS.filter(it => !it.bg);
    const capSt = (st, kind) => I.filter(it => it.st === st && (!kind || it.kind === kind)).reduce((a, it) => a + (it.cap || 0), 0);
    const nulls = st => I.filter(it => it.st === st && it.cap === null).length;
    const techOp = ks => I.filter(it => it.st === 'operating').reduce((a, it) => a + ks.reduce((b, k) => b + (fin(it.parts[k]) ? it.parts[k] : 0), 0), 0);
    // Phần mở rộng đang xây dựng nằm trong nhà máy hiện hữu (under_construction_mtpa) cộng vào ô "đang xây dựng" nếu nhà máy không có dự án riêng.
    const ucPlant = S.mode === 'crude' ? I.filter(it => it.kind === 'plant' && fin(it.x.capacity?.under_construction_mtpa) && !J.some(j => j.plant_id === it.id && stKey(j.status) === 'construction')).reduce((a, it) => a + it.x.capacity.under_construction_mtpa, 0) : 0;
    const sub = n => n ? `<em>${n} chưa có số công suất</em>` : '';
    let cells;
    if (S.mode === 'product') {
      const g = PNAME[S.pmode];
      cells = [[`Công suất ${g} đang vận hành`, nf(capSt('operating')), 'Mtpa', sub(nulls('operating'))], ['Số nhà máy đang vận hành', String(I.filter(it => it.st === 'operating').length), '', ''],
        ['Số doanh nghiệp', String(new Set(I.map(it => coOf(it.x))).size), '', ''], [`${g} đang xây dựng`, nf(capSt('construction')), 'Mtpa', sub(nulls('construction'))],
        [`${g} đã công bố`, nf(capSt('announced')), 'Mtpa', sub(nulls('announced'))], ['Đình trệ / tạm dừng', nf(capSt('idle')), 'Mtpa', sub(nulls('idle'))]];
    } else if (S.mode === 'future') {
      const pj = I.filter(it => it.kind === 'project');
      cells = [['Thép thô tăng thêm đang xây dựng', nf(capSt('construction', 'project')), 'Mtpa', sub(nulls('construction'))], ['Đã công bố / chuẩn bị đầu tư', nf(capSt('announced', 'project')), 'Mtpa', sub(nulls('announced'))],
        ['Đình trệ / tạm dừng', nf(capSt('idle', 'project')), 'Mtpa', sub(nulls('idle'))], ['Số dự án', String(pj.length), '', ''],
        ['Dự án chưa có số công suất', String(pj.filter(it => it.cap === null).length), '', ''], ['Chưa xác định năm vận hành', String(pj.filter(it => !it.x.cod_year).length), '', '']];
    } else {
      cells = [['Công suất thép thô đang vận hành', nf(capSt('operating')), 'Mtpa', sub(nulls('operating'))], ['Số nhà máy đang vận hành', String(I.filter(it => it.st === 'operating' && it.kind === 'plant').length), '', ''],
        ['Công suất BF–BOF', nf(techOp(['BOF'])), 'Mtpa', ''], ['Công suất EAF và IF', nf(techOp(['EAF', 'IF'])), 'Mtpa', ''],
        ['Công suất đang xây dựng', nf(capSt('construction') + ucPlant), 'Mtpa', sub(nulls('construction'))], ['Đã công bố, chưa xây dựng', nf(capSt('announced')), 'Mtpa', sub(nulls('announced'))]];
      if (!S.st.has('operating')) cells[0][1] = cells[2][1] = cells[3][1] = 'ẩn';
    }
    box.innerHTML = cells.map(([l, v, u, s]) => `<div class="sc-k"><span>${esc(l)}</span><b>${v}${u && v !== 'ẩn' ? ` <small>${u}</small>` : ''}</b>${s}</div>`).join('');
  }

  /* ---------- Chart A, B, C (bên phải) ---------- */
  function summary() {
    const I = ITEMS.filter(it => !it.bg && it.st === (S.mode === 'future' ? it.st : 'operating')), tot = I.reduce((a, it) => a + (it.cap || 0), 0);
    const scope = S.mode === 'future' ? 'công suất tăng thêm của dự án' : S.mode === 'product' ? `công suất ${PNAME[S.pmode]} đang vận hành` : 'công suất thép thô đang vận hành';
    // A: theo doanh nghiệp (pháp nhân vận hành / khu liên hợp; liên doanh không cộng vào nhiều công ty mẹ).
    const byCo = {}; I.forEach(it => { const k = coOf(it.x); byCo[k] = (byCo[k] || 0) + (it.cap || 0); });
    let rows = Object.entries(byCo).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    if (rows.length > 8) { const rest = rows.slice(7).reduce((a, [, v]) => a + v, 0); rows = rows.slice(0, 7).concat([['Doanh nghiệp khác', rest]]); }
    const mx = Math.max(1e-9, ...rows.map(r => r[1]));
    const A = `<div class="sc-ch"><div class="sc-ch-h">A · Công suất theo doanh nghiệp <small>Mtpa</small></div>${rows.length ? rows.map(([k, v]) => `<div class="sc-bar"><span title="${esc(k)}">${esc(k)}</span><span class="sc-bt"><i style="width:${v / mx * 100}%"></i></span><b>${nf(v)}</b></div>`).join('') : `<p class="sc-na">Không có nhà máy theo bộ lọc.</p>`}</div>`;
    // B: theo công nghệ (donut) — không áp dụng ở chế độ sản phẩm.
    let B = '';
    if (S.mode !== 'product') {
      const byT = {}; I.forEach(it => Object.entries(it.parts).forEach(([k, v]) => { if (fin(v)) byT[k] = (byT[k] || 0) + v; }));
      const tt = Object.values(byT).reduce((a, v) => a + v, 0); let a0 = -Math.PI / 2; const R = 46, W = 16;
      const arcs = TECH.filter(([k]) => byT[k] > 0).map(([k, , c]) => { const a1 = a0 + byT[k] / tt * 2 * Math.PI - 1e-6, large = a1 - a0 > Math.PI ? 1 : 0;
        const p = `M${60 + R * Math.cos(a0)},${60 + R * Math.sin(a0)} A${R},${R} 0 ${large} 1 ${60 + R * Math.cos(a1)},${60 + R * Math.sin(a1)}`; a0 = a1 + 1e-6; return `<path d="${p}" fill="none" stroke="${c}" stroke-width="${W}"/>`; }).join('');
      B = `<div class="sc-ch"><div class="sc-ch-h">B · Công suất theo công nghệ <small>Mtpa · %</small></div>${tt ? `<div class="sc-donut"><svg viewBox="0 0 120 120" width="120" height="120" role="img" aria-label="Cơ cấu công suất theo công nghệ">${arcs}<text x="60" y="58" text-anchor="middle" font-size="15" font-weight="700" fill="#1D2678">${nf(tt, 1)}</text><text x="60" y="73" text-anchor="middle" font-size="9" fill="#7a8399">Mtpa</text></svg>
        <ul>${TECH.filter(([k]) => byT[k] > 0).map(([k, t, c]) => `<li><i style="background:${c}"></i><span>${esc(t.split(' (')[0])}</span><b>${nf(byT[k])}</b><em>${pct(byT[k], tt)}</em></li>`).join('')}</ul></div>` : '<p class="sc-na">Không có số theo bộ lọc.</p>'}</div>`;
    }
    // C: theo khu vực, chia theo công nghệ (chế độ sản phẩm: một màu). Bấm vùng → lọc + phóng tới vùng.
    const byR = {N: {}, C: {}, S: {}}; I.forEach(it => { if (!byR[it.x.region]) return; Object.entries(it.parts).forEach(([k, v]) => { if (fin(v)) byR[it.x.region][k] = (byR[it.x.region][k] || 0) + v; }); });
    const rt = r => Object.values(byR[r]).reduce((a, v) => a + v, 0), rmx = Math.max(1e-9, ...REG.map(([r]) => rt(r)));
    const C = `<div class="sc-ch"><div class="sc-ch-h">C · Công suất theo khu vực <small>Mtpa · bấm để phóng tới vùng</small></div>${REG.map(([r, n]) => `<button type="button" class="sc-rb${S.reg !== 'all' && S.reg !== r ? ' dim' : ''}" data-r="${r}"><span>${n}</span><span class="sc-rt" style="width:${rt(r) / rmx * 100}%">${Object.entries(byR[r]).filter(([, v]) => v > 0).map(([k, v]) => `<i style="flex:${v};background:${colorOf(k)}" title="${esc(k === 'ROLL' ? 'Cán hạ nguồn' : TNAME[k] || k)}: ${nf(v)} Mtpa"></i>`).join('')}</span><b>${nf(rt(r))}</b></button>`).join('')}${(() => {
      const un = I.filter(it => !byR[it.x.region]).reduce((a, it) => a + (it.cap || 0), 0);
      return un > 0 ? `<p class="sc-note">Chưa xếp vùng (chưa xác minh địa điểm): ${nf(un)} Mtpa, ${esc(I.filter(it => !byR[it.x.region] && it.cap).map(it => it.x.plant_name || it.x.name).join(', '))}.</p>` : ''; })()}</div>`;
    const noXY = ITEMS.filter(it => !it.bg && !fin(it.x.latitude));
    const noXYList = noXY.length ? `<details class="sc-noxy"><summary>${noXY.length} nhà máy/dự án chưa có tọa độ đã xác minh: tính trong số liệu, chưa vẽ trên bản đồ</summary><ul>${noXY.map(it => `<li><button type="button" data-id="${esc(it.id)}">${esc(it.x.plant_name || it.x.name)}</button> · ${fin(it.cap) ? nf(it.cap) + ' Mtpa' : 'chưa có số'}</li>`).join('')}</ul></details>` : '';
    side.innerHTML = `<div class="sc-sh">${S.reg === 'all' ? 'Toàn quốc' : RNAME[S.reg]}</div><div class="sc-sub">Phạm vi: ${scope}, theo bộ lọc · ${I.length} ${S.mode === 'future' ? 'dự án' : 'nhà máy'}</div>${noXYList}${A}${B}${C}<p class="sc-hint">Bấm một nhà máy trên bản đồ để xem chi tiết.</p>`;
    side.querySelectorAll('.sc-noxy [data-id]').forEach(b => b.addEventListener('click', () => { const it = ITEMS.find(x => x.id === b.dataset.id); S.sel = it.id; detail(it); }));
    side.querySelectorAll('.sc-rb').forEach(b => b.addEventListener('click', () => { S.reg = S.reg === b.dataset.r ? 'all' : b.dataset.r; syncCtl(); map.fitBounds(RVIEW[S.reg]); render(); }));
  }

  /* ---------- Chi tiết nhà máy (thay khung bên phải) ---------- */
  function detail(it) {
    const x = it.x, c = x.capacity || {}, row = (k, v) => `<dt>${k}</dt><dd>${v == null || v === '' ? NA : v}</dd>`, mt = v => fin(v) ? nf3(v) + ' Mtpa' : null;
    const own = (x.owners || []).map(o => `${esc(o.name)}${o.ticker ? ` (<b>${esc(o.ticker)}</b>)` : ''}${fin(o.pct) ? ' · ' + nf(o.pct, o.pct % 1 ? 1 : 0) + '%' : ''}`).join('<br>');
    const eq = (x.owners || []).filter(o => o.ticker && fin(o.pct) && fin(c.nominal_crude_steel_mtpa)).map(o => `${esc(o.ticker)}: ${nf(c.nominal_crude_steel_mtpa * o.pct / 100)} Mtpa`).join('<br>');
    const prodCap = Object.entries(x.product_capacity || {}).map(([g, v]) => `${esc(PNAME[g] || g)}: ${fin(v?.mtpa) ? nf(v.mtpa) + ' Mtpa' : 'chưa có số'}${v?.definition ? ` <small>(${esc(v.definition)})</small>` : ''}`).join('<br>');
    const units = (x.units || []).map(u => `<li><b>${esc(u.name)}</b> · ${esc(u.stage || '')}${u.tech ? ' · ' + esc(u.tech) : ''} · ${fin(u.mtpa) ? nf(u.mtpa) + ' Mtpa' : 'chưa có số'}${u.status ? ' · ' + esc(SNAME[stKey(u.status)] || u.status) : ''}${u.year ? ' · ' + esc(u.year) : ''}${u.note ? `<br><small>${esc(u.note)}</small>` : ''}</li>`).join('');
    const exp = J.filter(j => j.plant_id && j.plant_id === x.plant_id).map(j => `${esc(j.name)}: ${fin(j.added_crude_mtpa) ? '+' + nf(j.added_crude_mtpa) + ' Mtpa' : 'chưa có số'} · ${esc(SNAME[stKey(j.status)] || j.status)}`).join('<br>');
    const util = fin(x.actual_production_mtpa) && fin(c.nominal_crude_steel_mtpa) && x.production_definition === 'crude_steel' ? pct(x.actual_production_mtpa, c.nominal_crude_steel_mtpa) : null;
    const srcs = (x.sources || []).map(k => SRC[k]).filter(Boolean).map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>${s.date ? ' · ' + esc(s.date) : ''}`).join('<br>');
    const caps = it.kind === 'project'
      ? row('Thép thô tăng thêm', mt(x.added_crude_mtpa)) + row('Sản phẩm tăng thêm', x.added_product ? `${esc(PNAME[x.added_product.group])}: ${mt(x.added_product.mtpa) || 'chưa có số'}` : null) + row('Định nghĩa công suất', esc(x.capacity_definition || '')) + row('Năm vận hành dự kiến', x.cod_year ? esc(x.cod_year) : 'Chưa xác định') + row('Tổng mức đầu tư', esc(x.investment || ''))
      : row('Công suất thép thô danh nghĩa', mt(c.nominal_crude_steel_mtpa)) + (Object.keys(split(x)).length > 1 ? row('Theo công nghệ', Object.entries(split(x)).map(([k, v]) => `${k}: ${nf(v)} Mtpa`).join('<br>')) : '')
        + (fin(c.crude_iron_mtpa) ? row('Luyện gang (BF, không cộng vào thép thô)', mt(c.crude_iron_mtpa)) : '') + (fin(c.company_reported_capacity_mtpa) ? row('Doanh nghiệp công bố', mt(c.company_reported_capacity_mtpa) + (c.company_reported_definition ? `<br><small>${esc(c.company_reported_definition)}</small>` : '')) : '')
        + row('Công suất theo sản phẩm', prodCap || null) + row('Năm vận hành', x.start_year ? esc(x.start_year) : null) + row('Sản lượng thực tế', fin(x.actual_production_mtpa) ? mt(x.actual_production_mtpa) + (x.production_year ? ` (${esc(x.production_year)})` : '') : null)
        + row('Hiệu suất sử dụng công suất', util) + row('Dự án mở rộng', exp || null);
    side.innerHTML = `<button type="button" class="sc-back">← Tổng quan</button>
      <div class="sc-sh">${esc(x.plant_name || x.name)}</div><div class="sc-sub">${esc(x.parent_company || '')}${x.ownership_group ? ' · ' + esc(OWNAME[x.ownership_group]) : ''}</div>
      <dl class="sc-dl">${row('Địa điểm', esc([x.location, x.province_current && x.province_current !== x.province ? 'nay ' + x.province_current : '', RNAME[x.region]].filter(Boolean).join(' · ')))}
        ${row('Trạng thái', esc(SNAME[stKey(x.status)] || x.status) + (x.status_note ? `<br><small>${esc(x.status_note)}</small>` : ''))}${row('Công nghệ', esc((x.technology || []).join(' + ')) || null)}
        ${caps}${row('Chủ sở hữu', own || esc(x.owner || '') || null)}${row('Công suất quy đổi theo tỷ lệ sở hữu', eq || null)}
        ${row('Sản phẩm', esc((x.products || []).join(', ')) || null)}${row('Nguyên liệu chính', esc(x.raw_materials || '') || null)}
        ${units ? row('Phân kỳ / công đoạn', `<ul class="sc-units">${units}</ul>`) : ''}${row('Độ chính xác tọa độ', esc({exact: 'Chính xác', approximate: 'Gần đúng'}[x.coordinate_accuracy] || x.coordinate_accuracy || '') || null)}
        ${row('Mức xác minh', esc({source_verified: 'Đã đối chiếu nguồn', partial: 'Đối chiếu một phần', unverified: 'Chưa xác minh'}[x.verification_status] || '') || null)}
        ${row('Ghi chú', x.notes ? esc(x.notes) : null)}${row('Nguồn', srcs || null)}${row('Kiểm tra nguồn', esc(x.source_checked_at || D.meta?.checked_at || ''))}</dl>`;
    side.querySelector('.sc-back').addEventListener('click', () => { S.sel = null; render(); });
    side.scrollTop = 0;
  }

  /* ---------- Chú giải ---------- */
  function legend() {
    const tk = S.mode === 'product' ? [...TECH.filter(t => t[0] !== 'OTHER'), ['ROLL', 'Cán thép hạ nguồn (không luyện thép)', ROLL]] : TECH;
    const circ = (st, c) => { const s = st === 'construction' ? `stroke="${c}" stroke-dasharray="3 2" fill="${c}" fill-opacity=".28"` : st === 'announced' ? `stroke="${c}" fill="none"` : st === 'idle' ? 'fill="#9CA3AF" stroke="#fff"' : `fill="${c}" stroke="#fff"`;
      return `<svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="5.5" stroke-width="1.6" ${s}/></svg>`; };
    const size = [0.5, 1, 3, 5, 10].map(m => { const r = rad(m), d = 2 * r + 2; return `<span class="sc-lz"><svg width="${d}" height="${d}" viewBox="0 0 ${d} ${d}"><circle cx="${r + 1}" cy="${r + 1}" r="${r}" fill="none" stroke="#7a8399"/></svg>${nf(m, m < 1 ? 1 : 0)}</span>`; }).join('');
    host.querySelector('.sc-legend').innerHTML = `<div><span class="sc-lab">Công nghệ</span>${tk.map(([k, t, c]) => `<span><i style="background:${c}"></i>${esc(t)}</span>`).join('')}<span><svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 7V1.5A5.5 5.5 0 0 1 12.2 8.8Z" fill="#2563EB"/><path d="M7 7 12.2 8.8A5.5 5.5 0 1 1 7 1.5Z" fill="#8B5CF6"/></svg>Nhiều công nghệ (bánh theo tỷ trọng)</span></div>
      <div><span class="sc-lab">Trạng thái</span>${ST.map(([k, t]) => `<span>${circ(k, '#2563EB')}${esc(t)}</span>`).join('')}<span><svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="5.5" fill="#fff" stroke="#7a8399" stroke-dasharray="2 2"/></svg>Chưa có dữ liệu công suất</span><span><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="#1D2678"/><text x="8" y="11" text-anchor="middle" font-size="8" fill="#fff" font-weight="700">3</text></svg>Cụm nhà máy gần nhau</span></div>
      <div><span class="sc-lab">Kích thước (Mtpa)</span>${size}</div>`;
  }

  /* ---------- Chart D: pipeline theo năm vận hành dự kiến (chỉ công suất tăng thêm) ---------- */
  function pipeline() {
    const g = S.mode === 'product' ? S.pmode : null;
    const js = J.filter(j => base(j) && ['construction', 'announced', 'idle'].includes(stKey(j.status)) && S.st.has(stKey(j.status)) && (g ? j.added_product?.group === g : !isRoll(j)));
    const val = j => g ? j.added_product?.mtpa : j.added_crude_mtpa;
    const cols = {}; js.forEach(j => { const y = j.cod_year ? String(j.cod_year) : 'Chưa xác định COD'; (cols[y] = cols[y] || []).push(j); });
    const keys = Object.keys(cols).sort((a, b) => a === 'Chưa xác định COD' ? 1 : b === 'Chưa xác định COD' ? -1 : a.localeCompare(b));
    const tot = k => cols[k].reduce((a, j) => a + (fin(val(j)) ? val(j) : 0), 0), mx = Math.max(1e-9, ...keys.map(tot));
    const pal = ['#2938A8', '#D97706', '#0D9488', '#8B5CF6', '#E5484D', '#64748B'], colOf = {}; js.forEach((j, i) => { colOf[j.project_id] = pal[i % pal.length]; });
    const noNum = js.filter(j => !fin(val(j)));
    host.querySelector('.sc-pipe').innerHTML = `<div class="sc-ch-h">D · Công suất tăng thêm theo năm vận hành dự kiến <small>${g ? esc(PNAME[g]) : 'thép thô'}, Mtpa · không gồm công suất hiện hữu</small></div>
      ${keys.length ? `<div class="sc-cols">${keys.map(k => `<div class="sc-col"><b>${nf(tot(k))}</b><div class="sc-stack" style="height:${Math.max(2, tot(k) / mx * 150)}px">${cols[k].filter(j => fin(val(j))).map(j => `<i style="flex:${val(j)};background:${colOf[j.project_id]}" title="${esc(j.name)}: ${nf(val(j))} Mtpa · ${esc(SNAME[stKey(j.status)])}"></i>`).join('')}</div><span>${esc(k)}</span></div>`).join('')}</div>
      <div class="sc-pl">${js.filter(j => fin(val(j))).map(j => `<span><i style="background:${colOf[j.project_id]}"></i>${esc(j.name)} · ${esc(SNAME[stKey(j.status)].split(' /')[0])}</span>`).join('')}</div>` : '<p class="sc-na">Không có dự án theo bộ lọc.</p>'}
      ${noNum.length ? `<p class="sc-note">Chưa có số công suất tăng thêm, không vẽ: ${noNum.map(j => esc(j.name)).join('; ')}.</p>` : ''}`;
  }

  /* ---------- Nhận định (tính từ dữ liệu theo bộ lọc) ---------- */
  function insights() {
    const op = P.filter(p => p.steelmaking && base(p) && stKey(p.status) === 'operating'), cap = p => sum(split(p));
    const tot = op.reduce((a, p) => a + cap(p), 0), top = op.slice().sort((a, b) => cap(b) - cap(a)).slice(0, 2);
    const by = {}; op.forEach(p => Object.entries(split(p)).forEach(([k, v]) => { by[k] = (by[k] || 0) + v; }));
    const fut = J.filter(j => base(j) && ['construction', 'announced'].includes(stKey(j.status))).sort((a, b) => (b.added_crude_mtpa || 0) - (a.added_crude_mtpa || 0));
    const f1 = fut.filter(j => fin(j.added_crude_mtpa)).slice(0, 2);
    const ins = [];
    if (tot > 0 && top.length) ins.push(['Nguồn cung tập trung', `${top.map(p => `<b>${esc(p.plant_name)}</b> ${nf(cap(p), 1)} Mtpa`).join(' và ')} chiếm <b>${pct(top.reduce((a, p) => a + cap(p), 0), tot)}</b> công suất thép thô đang vận hành trong dữ liệu (${op.length} nhà máy). Đây là tỷ trọng công suất, không phải thị phần tiêu thụ: quy mô lớn cho lợi thế chi phí cố định trên mỗi tấn, nhưng sản lượng thực tế còn tùy mức huy động.`]);
    if (tot > 0) ins.push(['Công nghệ quyết định cấu trúc chi phí', `BF–BOF chiếm <b>${pct(by.BOF || 0, tot)}</b>, EAF và IF <b>${pct((by.EAF || 0) + (by.IF || 0), tot)}</b> công suất đang vận hành. BF–BOF nhạy với giá quặng sắt, than luyện cốc, vốn đầu tư và chi phí cố định cao, hiệu suất vận hành quyết định giá thành; EAF/IF phụ thuộc nhiều hơn vào thép phế và giá điện, linh hoạt hơn khi giảm sản lượng (không mặc định mọi lò điện dùng 100% thép phế). Cán thép, tôn mạ phụ thuộc spread với HRC và kẽm, tồn kho và khả năng chuyển giá.`]);
    if (fut.length) ins.push(['Nguồn cung tương lai', `${f1.length ? f1.map(j => `<b>${esc(j.name)}</b> ${nf(j.added_crude_mtpa, 1)} Mtpa (${esc(SNAME[stKey(j.status)].split(' /')[0].toLowerCase())}, ${j.cod_year ? 'dự kiến ' + esc(j.cod_year) : 'chưa xác định năm vận hành'}${j.products_group?.length ? ', ' + esc(j.products_group.map(g => PNAME[g] || g).join(', ')) : ''})`).join('; ') : 'Các dự án theo bộ lọc chưa có số công suất'}. Nếu hoàn thành, nguồn cung nội địa (gồm HRC cho doanh nghiệp hạ nguồn) tăng và áp lực cạnh tranh, thay thế nhập khẩu lớn hơn; chưa đủ để kết luận dư cung khi chưa đối chiếu nhu cầu, sản lượng thực tế, mức sử dụng công suất và xuất nhập khẩu.`]);
    host.querySelector('.sc-ins').innerHTML = `<div class="sc-ch-h">Nhận định đầu tư <small>tính từ dữ liệu theo bộ lọc</small></div>${ins.map(([h, t], i) => `<div class="sc-in"><span>${i + 1}</span><div><b>${h}</b><p>${t}</p></div></div>`).join('')}`;
  }

  function foot() {
    const m = D.meta || {}, nP = P.filter(p => p.steelmaking).length, nR = P.filter(p => !p.steelmaking).length;
    host.querySelector('.sc-foot').innerHTML = `Nguồn: ${esc(m.source_note || '')} Định nghĩa: ${esc(m.capacity_basis || '')}. Phạm vi: ${nP} nhà máy luyện thép, ${nR} nhà máy cán/hạ nguồn, ${J.length} dự án; ${esc(m.coverage_note || '')}
      ${(m.gaps || []).length ? `<details class="sc-gaps"><summary>Nhà máy, số liệu còn thiếu (${m.gaps.length})</summary><ul>${m.gaps.map(g => `<li>${esc(g)}</li>`).join('')}</ul></details>` : ''} Dữ liệu kiểm tra ngày ${esc(m.checked_at || '')}.`;
  }

  /* ---------- Điều khiển ---------- */
  const segEl = n => host.querySelector(`.sc-seg[data-f="${n}"]`), selEl = n => host.querySelector(`select[data-f="${n}"]`);
  const press = (g, f) => g.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(f(b.dataset.v))));
  function syncCtl() {
    press(segEl('Chế độ xem'), v => v === S.mode); press(segEl('Khu vực'), v => v === S.reg); press(segEl('Trạng thái'), v => S.st.has(v));
    press(segEl('Công nghệ'), v => S.tech.has(v)); press(segEl('Nhóm sản phẩm'), v => v === S.pmode);
    selEl('Sản phẩm').value = S.prod; selEl('Doanh nghiệp').value = S.co; selEl('Nhóm sở hữu').value = S.own;
    // Bộ lọc không áp dụng ở chế độ nào thì khóa: chế độ sản phẩm dùng nhóm sản phẩm thay cho công nghệ và ô Sản phẩm.
    host.querySelector('.sc-r-pmode').hidden = S.mode !== 'product';
    host.querySelector('.sc-r-tech').classList.toggle('off', S.mode === 'product'); segEl('Công nghệ').querySelectorAll('button').forEach(b => { b.disabled = S.mode === 'product'; });
    selEl('Sản phẩm').disabled = S.mode === 'product';
  }
  segEl('Chế độ xem').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.mode = b.dataset.v; S.sel = null; if (S.mode === 'product') S.prod = ''; syncCtl(); render(); });
  segEl('Khu vực').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.reg = b.dataset.v; syncCtl(); map.fitBounds(RVIEW[S.reg]); render(); });
  const toggle = (set, v) => { set.has(v) ? set.delete(v) : set.add(v); if (!set.size) set.add(v); };
  segEl('Trạng thái').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; toggle(S.st, b.dataset.v); syncCtl(); render(); });
  segEl('Công nghệ').addEventListener('click', e => { const b = e.target.closest('button'); if (!b || b.disabled) return; toggle(S.tech, b.dataset.v); syncCtl(); render(); });
  segEl('Nhóm sản phẩm').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; S.pmode = b.dataset.v; syncCtl(); render(); });
  selEl('Sản phẩm').addEventListener('change', e => { S.prod = e.target.value; render(); });
  selEl('Doanh nghiệp').addEventListener('change', e => { S.co = e.target.value; render(); });
  selEl('Nhóm sở hữu').addEventListener('change', e => { S.own = e.target.value; render(); });
  host.querySelector('.sc-reset').addEventListener('click', () => { const m = S.mode; S = DEF(); S.mode = m; syncCtl(); map.fitBounds(RVIEW.all); render(); });

  function render() {
    ITEMS = items();
    if (S.sel && !ITEMS.some(it => it.id === S.sel && !it.bg)) S.sel = null;
    drawMap(); kpis(); legend(); pipeline(); insights();
    if (S.sel) detail(ITEMS.find(it => it.id === S.sel)); else summary();
  }
  syncCtl(); foot(); render();
  setTimeout(() => map.invalidateSize(), 80);
}

/* ---------- Gắn vào Tổng quan ngành › Bản đồ ngành ---------- */
function attach() {
  const body = document.querySelector('#of-mt1-map .of-body'); if (!body || body.querySelector('.sc-card')) return;
  const card = document.createElement('div'); card.className = 'card of-wide sc-card'; card.dataset.blockId = 'th-cap-map'; card.dataset.updateKind = 'document'; card.dataset.cadence = 'monthly';
  card.innerHTML = `<div class="chart-title">Bản đồ phân bổ năng lực sản xuất thép Việt Nam</div><div class="chart-sub">triệu tấn/năm (Mtpa) · công suất thiết kế, không phải sản lượng</div><div class="sc-host"></div>`;
  body.append(card);
  const host = card.querySelector('.sc-host');
  // Leaflet cần khung đang hiển thị (không ẩn) để đo kích thước: dựng ngay nếu tab Tổng quan đang mở, không thì chờ lần đổi tab
  // (khung tab phát sự kiện resize mỗi lần đổi tab/sub-tab).
  const go = () => { if (host.dataset.scReady || !card.offsetParent) return; mount(host); window.removeEventListener('resize', go); };
  window.addEventListener('resize', go); go();
}
window.SteelCapacityMap = {mount, attach};
window.addEventListener('steel:frame', attach);
if (document.body?.dataset.steelFrame) attach();
})();
