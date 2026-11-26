/* Phân bón · Tổng quan › Bản đồ ngành: cấu trúc địa lý và năng lực sản xuất (25/11/2026).
   Dữ liệu: D.plants (data/fertilizer/plants.json, nhập tay có nguồn từng dòng) + window.VN_GEO (app/vn-geo.js, Natural Earth).
   - 0.2 Bản đồ nhà máy và vùng nguyên liệu: màu = công nghệ, kích thước = công suất thiết kế của SẢN PHẨM đang chọn;
     liên kết nguyên liệu → nhà máy chỉ vẽ khi có bằng chứng cung ứng (links); vị trí gần vùng nguyên liệu không suy ra quan hệ cung ứng.
   - 0.3 Cơ cấu công suất theo vùng × công nghệ (cột chồng, MỘT sản phẩm mỗi lần — không cộng sản phẩm khác nhau), treemap nhà máy,
     tỷ trọng công suất urê theo nguyên liệu (khí / than).
   - 0.4 Ma trận cấu trúc sản xuất: vùng → doanh nghiệp → nhà máy → sản phẩm (bấm vùng để mở/đóng), công suất, công nghệ,
     nguyên liệu, nguồn cung (đã xác minh / chỉ vị trí / chưa rõ), yếu tố chi phí. */
(() => {
'use strict';
const fin = v => typeof v === 'number' && Number.isFinite(v);
const TECH = {'Urê từ khí': '#2938A8', 'Urê từ than': '#3d4653', 'DAP/MAP': '#c98a00', 'Supe lân': '#e0a83c', 'Lân nung chảy': '#8a5a00', 'NPK': '#2a9fa3'};
const RAW = {gas: '#2938A8', coal: '#3d4653', apatit: '#c98a00', other: '#861C52'};
const PRODUCTS = ['Urê', 'DAP/MAP', 'Supe lân', 'Lân nung chảy', 'NPK'];
const prodKey = p => p === 'DAP' || p === 'MAP' ? 'DAP/MAP' : p;
const DRIVER = {'Urê từ khí': 'Giá khí theo hợp đồng (xem Bức tranh ngành › 04 Nguồn khí, mục 4.3)', 'Urê từ than': 'Giá than (TKV/nhập khẩu), định mức than', 'DAP/MAP': 'Apatit, lưu huỳnh, amoniac, nhiên liệu',
  'Supe lân': 'Apatit, lưu huỳnh/axit sulfuric', 'Lân nung chảy': 'Apatit, serpentin, than cục', 'NPK': 'Urê, DAP/MAP, kali nhập khẩu'};
const SUP = {verified: ['Đã xác minh', '#2a9fa3'], geographic_only: ['Chỉ gần vị trí', '#c9b26b'], unknown: ['Chưa rõ', '#9AA3BD']};

function build(host) {
  const k = window.FertKit, D = k.D, P = D.plants, G = window.VN_GEO;
  if (!P || !P.plants || !G) { host.append(k.el('div', 'card fb-na', '<div class="chart-title">Bản đồ nhà máy</div><p class="fb-na-p">N/A · chưa nạp được danh mục nhà máy (data/fertilizer/plants.json).</p>')); return; }
  const {el, esc, nf, card, chart, two} = k;
  const plants = P.plants, proj = G.proj;
  const xy = (lon, lat) => [(lon - proj.lon0) * proj.k * proj.scale, (proj.lat1 - lat) * proj.scale];
  const capOf = (p, prod) => (p.products || []).filter(x => prodKey(x.product) === prod).reduce((a, x) => a + (fin(x.capacity_kt) ? x.capacity_kt : 0), 0) || null;
  const hasProd = (p, prod) => (p.products || []).some(x => prodKey(x.product) === prod);
  const owners = [...new Set(plants.map(p => p.ticker || p.owner))].sort();
  const regions = [...new Set(plants.map(p => p.region))];
  const S = {prod: 'Urê', tech: new Set(Object.keys(TECH)), region: '', owner: '', pick: null};
  const sel = () => plants.filter(p => (!S.prod || hasProd(p, S.prod)) && S.tech.has(p.technology) && (!S.region || p.region === S.region) && (!S.owner || (p.ticker || p.owner) === S.owner));
  const src = (P.meta && P.meta.source_note) || 'Báo cáo thường niên, website doanh nghiệp, Vinachem, Petrovietnam (nguồn ghi theo từng nhà máy)';

  /* ---------- 0.2 Bản đồ ---------- */
  const s2 = el('section', 'ov-sec', `<header class="ov-sh"><span class="ov-num">0.2</span><div><h3>Năng lực sản xuất phân bón nằm ở đâu, gần nguồn nguyên liệu nào?</h3><p>Vị trí nhà máy thực tế (không phải trụ sở). Màu = công nghệ, kích thước = công suất thiết kế của sản phẩm đang chọn. Bấm nhà máy để xem chi tiết.</p></div></header>`);
  const mc = el('div', 'card fb-map-card'); mc.dataset.blockId = 'pb-05'; mc.dataset.updateKind = 'document'; mc.dataset.cadence = 'annual';
  mc.innerHTML = `<div class="chart-title">Bản đồ nhà máy và vùng nguyên liệu</div>
    <div class="fb-map-ctl">
      <label>Sản phẩm <select data-f="prod"><option value="">Tất cả (cùng kích thước)</option>${PRODUCTS.map(p => `<option${p === S.prod ? ' selected' : ''}>${p}</option>`).join('')}</select></label>
      <label>Vùng <select data-f="region"><option value="">Tất cả</option>${regions.map(r => `<option>${esc(r)}</option>`).join('')}</select></label>
      <label>Doanh nghiệp <select data-f="owner"><option value="">Tất cả</option>${owners.map(o => `<option>${esc(o)}</option>`).join('')}</select></label>
      <div class="fb-map-tech">${Object.entries(TECH).map(([t, c]) => `<button type="button" data-t="${esc(t)}" aria-pressed="true"><i style="background:${c}"></i>${esc(t)}</button>`).join('')}</div>
    </div>
    <div class="fb-map-wrap"><div class="fb-map-svg"></div><aside class="fb-map-side"></aside></div>
    <div class="fb-map-legend"><span><i class="dot"></i>Nhà máy (kích thước theo công suất)</span><span><i class="dia"></i>Vùng nguyên liệu</span><span><i class="ln"></i>Quan hệ cung ứng đã xác minh</span><span>Nhà máy gần vùng nguyên liệu không đồng nghĩa mua nguyên liệu từ vùng đó</span></div>
    <div class="pw-src">Nguồn: ${esc(src)}; đường viền: ${esc(G.source)}</div>`;
  s2.append(mc); host.append(s2);
  const svgBox = mc.querySelector('.fb-map-svg'), side = mc.querySelector('.fb-map-side');
  const [vw, vh] = G.viewBox.split(' ').slice(2).map(Number);
  function drawMap() {
    const list = sel(), caps = list.map(p => S.prod ? capOf(p, S.prod) : null).filter(fin), cmax = Math.max(1, ...caps);
    const r = p => { if (!S.prod) return 7; const c = capOf(p, S.prod); return fin(c) ? 5 + 17 * Math.sqrt(c / cmax) : 5; };
    const raws = (P.raw_regions || []).map(z => { const [x, y] = xy(z.lon, z.lat); const col = RAW[z.material_key] || RAW[/khí/i.test(z.material) ? 'gas' : /than/i.test(z.material) ? 'coal' : /apatit/i.test(z.material) ? 'apatit' : 'other'];
      return `<g class="fb-raw" tabindex="0" data-raw="${esc(z.id)}"><rect x="${x - 6}" y="${y - 6}" width="12" height="12" transform="rotate(45 ${x} ${y})" fill="${col}" fill-opacity=".25" stroke="${col}" stroke-width="1.5"/><text x="${x + 11}" y="${y + 4}" class="fb-raw-l">${esc(z.short || z.name)}</text><title>${esc(z.name)} · ${esc(z.note || '')}</title></g>`; }).join('');
    const pid = Object.fromEntries(plants.map(p => [p.id, p])), rid = Object.fromEntries((P.raw_regions || []).map(z => [z.id, z]));
    const links = (P.links || []).filter(l => rid[l.from] && pid[l.to] && list.includes(pid[l.to])).map(l => { const [x1, y1] = xy(rid[l.from].lon, rid[l.from].lat), [x2, y2] = xy(pid[l.to].lon, pid[l.to].lat);
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="fb-link"><title>${esc(l.what || '')}</title></line>`; }).join('');
    // Nhãn: mỗi mã một nhãn trong bán kính 14px (nhiều nhà máy cùng khu như DPM urê và NPK Phú Mỹ chỉ ghi một lần).
    const placed = [], label = p => { const [x, y] = xy(p.lon, p.lat), t = p.ticker || p.short || p.owner; if (placed.some(q => q.t === t && Math.hypot(q.x - x, q.y - y) < 14) || placed.filter(q => Math.hypot(q.x - x, q.y - y) < 9).length >= 1) return ''; placed.push({t, x, y}); return t; };
    const marks = [...list].sort((a, b) => r(b) - r(a)).map(p => { const [x, y] = xy(p.lon, p.lat), c = TECH[p.technology] || '#5a6682', lb = label(p);
      return `<g class="fb-plant${S.pick === p.id ? ' on' : ''}" tabindex="0" data-id="${esc(p.id)}"><circle cx="${x}" cy="${y}" r="${r(p).toFixed(1)}" fill="${c}" fill-opacity=".78" stroke="#fff" stroke-width="1.2"/>${lb ? `<text x="${x + r(p) + 3}" y="${y + 4}" class="fb-plant-l">${esc(lb)}</text>` : ''}<title>${esc(p.plant)} · ${esc(p.owner)} · ${esc(p.technology)}${S.prod && fin(capOf(p, S.prod)) ? ` · ${nf(capOf(p, S.prod))} nghìn tấn/năm` : ''}</title></g>`; }).join('');
    const isl = [[112.0, 16.5, 'Quần đảo Hoàng Sa'], [114.2, 9.8, 'Quần đảo Trường Sa']].map(([lo, la, t]) => { const [x, y] = xy(lo, la); return `<g class="fb-isl"><circle cx="${x}" cy="${y}" r="2"/><circle cx="${x + 9}" cy="${y + 5}" r="1.6"/><circle cx="${x - 7}" cy="${y + 7}" r="1.4"/><text x="${x}" y="${y + 20}" text-anchor="middle">${t}</text></g>`; }).join('');
    svgBox.innerHTML = `<svg viewBox="${G.viewBox}" role="img" aria-label="Bản đồ nhà máy phân bón Việt Nam"><rect width="${vw}" height="${vh}" class="fb-sea"/>${Object.values(G.nb).map(d => `<path d="${d}" class="fb-nb"/>`).join('')}<path d="${G.vn}" class="fb-vn"/>${isl}${links}${raws}${marks}</svg>`;
    side.innerHTML = S.pick ? detail(pid[S.pick]) : summary(list);
  }
  function summary(list) {
    const tot = S.prod ? list.reduce((a, p) => a + (capOf(p, S.prod) || 0), 0) : null, miss = S.prod ? list.filter(p => !fin(capOf(p, S.prod))).length : 0;
    return `<div class="fb-side-h">${S.prod ? esc(S.prod) : 'Tất cả sản phẩm'}</div><div class="fb-side-big">${list.length}<small> nhà máy đang hiện</small></div>`
      + (S.prod ? `<div class="fb-side-big">${nf(tot)}<small> nghìn tấn/năm công suất thiết kế${miss ? ` · ${miss} nhà máy chưa có số` : ''}</small></div>` : '')
      + `<ul class="fb-side-list">${list.slice().sort((a, b) => (capOf(b, S.prod) || 0) - (capOf(a, S.prod) || 0)).map(p => `<li data-id="${esc(p.id)}"><i style="background:${TECH[p.technology]}"></i><b>${esc(p.ticker || p.short || p.owner)}</b> ${esc(p.plant)}<em>${S.prod ? (fin(capOf(p, S.prod)) ? nf(capOf(p, S.prod)) : 'N/A') : ''}</em></li>`).join('')}</ul>`
      + `<p class="fb-side-note">Bấm một nhà máy để xem nguyên liệu, nguồn cung, cơ chế chi phí và nguồn dữ liệu.</p>`;
  }
  function detail(p) {
    const prods = (p.products || []).map(x => `<tr><td>${esc(x.product)}</td><td class="n">${fin(x.capacity_kt) ? nf(x.capacity_kt) : 'N/A'}</td><td>${esc(x.capacity_note || '')}${x.source ? ` <a href="${esc(x.source)}" target="_blank" rel="noopener">[nguồn]</a>` : ''}</td></tr>`).join('');
    const sup = SUP[p.feed_supply_status] || SUP.unknown;
    const row = (t, v) => v ? `<dt>${t}</dt><dd>${v}</dd>` : '';
    return `<button type="button" class="fb-side-back">← Danh sách</button><div class="fb-side-h" style="color:${TECH[p.technology]}">${esc(p.technology)}</div>
      <div class="fb-side-t">${esc(p.plant)}</div><div class="fb-side-o">${esc(p.owner)}${p.ticker ? ` · <b>${esc(p.ticker)}</b>` : ' · chưa niêm yết'}</div>
      <dl class="fb-side-dl">${row('Vị trí', esc([p.location, p.province_current].filter(Boolean).join(', ')) + (p.province_old && p.province_old !== p.province_current ? ` <small>(trước 1/7/2025: ${esc(p.province_old)})</small>` : ''))}
      ${row('Nguyên liệu chính', esc(p.feedstock || 'N/A'))}
      ${row('Nguồn cung nguyên liệu', `<span class="fb-sup" style="--c:${sup[1]}">${sup[0]}</span> ${esc(p.feed_supply || 'chưa có tài liệu')}${p.feed_supply_source ? ` <a href="${esc(p.feed_supply_source)}" target="_blank" rel="noopener">[nguồn]</a>` : ''}`)}
      ${row('Cơ chế chi phí đầu vào', esc(p.cost_mechanism || 'N/A · chưa có tài liệu công bố') + (p.cost_mechanism_source ? ` <a href="${esc(p.cost_mechanism_source)}" target="_blank" rel="noopener">[nguồn]</a>` : ''))}
      ${row('Sản lượng thực tế / hiệu suất', esc(p.output_note || 'N/A · chưa có số công bố cùng kỳ'))}
      ${row('Lợi thế, rủi ro nguồn cung', esc(p.edge_risk || ''))}</dl>
      <table class="fb-side-tb"><thead><tr><th>Sản phẩm</th><th>Công suất (nghìn tấn/năm)</th><th>Ghi chú</th></tr></thead><tbody>${prods}</tbody></table>
      <p class="fb-side-note">Kỳ số liệu: ${esc(p.period || 'N/A')} · ${(p.sources || []).map((u, i) => `<a href="${esc(u)}" target="_blank" rel="noopener">nguồn ${i + 1}</a>`).join(' · ')}</p>`;
  }
  mc.addEventListener('change', e => { const f = e.target.dataset.f; if (!f) return; S[f] = e.target.value; S.pick = null; drawMap(); drawCap(); drawTable(); });
  mc.querySelector('.fb-map-tech').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const t = b.dataset.t;
    S.tech.has(t) ? S.tech.delete(t) : S.tech.add(t); if (!S.tech.size) S.tech.add(t); b.setAttribute('aria-pressed', String(S.tech.has(t))); S.pick = null; drawMap(); drawTable(); });
  const pick = id => { S.pick = S.pick === id ? null : id; drawMap(); };
  mc.addEventListener('click', e => { const g = e.target.closest('.fb-plant,[data-id]'); if (e.target.closest('.fb-side-back')) { S.pick = null; drawMap(); return; } if (g && g.dataset.id) pick(g.dataset.id); });
  mc.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.fb-plant')) { e.preventDefault(); pick(e.target.closest('.fb-plant').dataset.id); } });

  /* ---------- 0.3 Cơ cấu công suất ---------- */
  const s3 = el('section', 'ov-sec', `<header class="ov-sh"><span class="ov-num">0.3</span><div><h3>Công suất từng sản phẩm phân theo vùng và công nghệ thế nào?</h3><p>Mỗi lần một sản phẩm (không cộng urê với DAP hay NPK). Công suất thiết kế, không phải sản lượng thực tế.</p></div></header>`);
  const pickBar = el('div', 'fb-prod-pick'); pickBar.innerHTML = PRODUCTS.map(p => `<button type="button" data-p="${p}" aria-pressed="${p === 'Urê'}">${p}</button>`).join('');
  const cA = card('pb-06', 'Công suất thiết kế theo vùng, phân màu theo công nghệ', {sub: 'nghìn tấn/năm', kind: 'document', cadence: 'annual', source: esc(src), info: 'Cộng công suất thiết kế của các nhà máy có số trong vùng, cho đúng sản phẩm đang chọn. Nhà máy chưa có số công suất không được cộng (ghi số lượng dưới chart).'});
  const cB = card('pb-07', 'Quy mô từng nhà máy', {sub: 'treemap · diện tích = công suất thiết kế · nghìn tấn/năm', kind: 'document', cadence: 'annual', source: esc(src)});
  const cC = card('pb-08', 'Công suất urê theo nguyên liệu đầu vào', {sub: '% công suất urê thiết kế trong nước', kind: 'document', cadence: 'annual', source: esc(src), info: 'Chỉ tính các nhà máy urê có số công suất có nguồn; nhóm khí và nhóm than.'});
  const ins = el('p', 'fb-insight');
  s3.append(pickBar, cA.el, two(cB, cC), ins); host.append(s3);
  let capProd = 'Urê';
  pickBar.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; capProd = b.dataset.p; pickBar.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); drawCap(); });
  function treemap(items, W = 560, H = 300) {
    // Squarified treemap đơn giản (Bruls et al.).
    const tot = items.reduce((a, x) => a + x.v, 0); if (!tot) return '';
    const rects = []; let x = 0, y = 0, w = W, h = H; let rest = items.slice().sort((a, b) => b.v - a.v).map(i => ({...i, a: i.v / tot * W * H}));
    const worst = (row, s) => { const sum = row.reduce((a, r) => a + r.a, 0), mx = Math.max(...row.map(r => r.a)), mn = Math.min(...row.map(r => r.a)); return Math.max(s * s * mx / (sum * sum), sum * sum / (s * s * mn)); };
    while (rest.length) { const s = Math.min(w, h); let row = [rest[0]], i = 1;
      while (i < rest.length && worst([...row, rest[i]], s) <= worst(row, s)) { row.push(rest[i]); i++; }
      const sum = row.reduce((a, r) => a + r.a, 0);
      if (w >= h) { const cw = sum / h; let cy = y; row.forEach(r => { const rh = r.a / cw; rects.push({...r, x, y: cy, w: cw, h: rh}); cy += rh; }); x += cw; w -= cw; }
      else { const ch = sum / w; let cx = x; row.forEach(r => { const rw = r.a / ch; rects.push({...r, x: cx, y, w: rw, h: ch}); cx += rw; }); y += ch; h -= ch; }
      rest = rest.slice(i); }
    return `<svg viewBox="0 0 ${W} ${H}" class="fb-tm" role="img" aria-label="Treemap công suất">${rects.map(r => `<g><rect x="${r.x + 1}" y="${r.y + 1}" width="${Math.max(0, r.w - 2)}" height="${Math.max(0, r.h - 2)}" rx="6" fill="${r.c}"><title>${esc(r.t)}: ${nf(r.v)} nghìn tấn/năm</title></rect>${r.w > 70 && r.h > 34 ? `<text x="${r.x + 8}" y="${r.y + 18}">${esc(r.l)}</text><text x="${r.x + 8}" y="${r.y + 33}" class="v">${nf(r.v)}</text>` : ''}</g>`).join('')}</svg>`;
  }
  function drawCap() {
    const prod = capProd, ps = plants.filter(p => hasProd(p, prod)), withCap = ps.filter(p => fin(capOf(p, prod))), miss = ps.length - withCap.length;
    const regs = [...new Set(withCap.map(p => p.region))], techs = Object.keys(TECH).filter(t => withCap.some(p => p.technology === t));
    chart(cA.host, 'pb-06-' + prod, regs, techs.map(t => ({name: t, color: TECH[t], kind: 'bar', values: regs.map(r => withCap.filter(p => p.region === r && p.technology === t).reduce((a, p) => a + capOf(p, prod), 0) || null)})), {unit: 'nghìn tấn/năm', native: 'stack', stackable: true});
    cA.el.querySelector('.pw-src-note')?.remove(); if (miss) cA.el.append(el('div', 'pw-src-note', `${miss} nhà máy có ${esc(prod)} nhưng chưa có số công suất có nguồn: ${ps.filter(p => !fin(capOf(p, prod))).map(p => esc(p.ticker || p.short || p.owner)).join(', ')}`));
    cB.host.innerHTML = treemap(withCap.map(p => ({v: capOf(p, prod), c: TECH[p.technology], l: p.ticker || p.short || p.owner, t: `${p.plant} (${p.owner})`})));
    const urea = plants.filter(p => hasProd(p, 'Urê') && fin(capOf(p, 'Urê'))), g = urea.filter(p => p.technology === 'Urê từ khí').reduce((a, p) => a + capOf(p, 'Urê'), 0), c = urea.filter(p => p.technology === 'Urê từ than').reduce((a, p) => a + capOf(p, 'Urê'), 0), tot = g + c;
    cC.host.innerHTML = tot ? `<div class="fb-share"><div class="fb-share-bar"><span style="width:${g / tot * 100}%;background:${TECH['Urê từ khí']}">${nf(g / tot * 100)}%</span><span style="width:${c / tot * 100}%;background:${TECH['Urê từ than']}">${nf(c / tot * 100)}%</span></div>
      <dl><div><dt><i style="background:${TECH['Urê từ khí']}"></i>Urê từ khí</dt><dd>${nf(g)} nghìn tấn/năm · ${urea.filter(p => p.technology === 'Urê từ khí').map(p => esc(p.ticker || p.short)).join(', ')}</dd></div>
      <div><dt><i style="background:${TECH['Urê từ than']}"></i>Urê từ than</dt><dd>${nf(c)} nghìn tấn/năm · ${urea.filter(p => p.technology === 'Urê từ than').map(p => esc(p.ticker || p.short)).join(', ')}</dd></div></dl></div>` : '<p class="fb-na-p">N/A · chưa đủ số công suất urê có nguồn.</p>';
    const byReg = regs.map(r => [r, withCap.filter(p => p.region === r).reduce((a, p) => a + capOf(p, prod), 0)]).sort((a, b) => b[1] - a[1]), all = byReg.reduce((a, x) => a + x[1], 0);
    ins.textContent = all ? `${prod}: ${nf(all)} nghìn tấn/năm công suất thiết kế có nguồn ở ${withCap.length} nhà máy; vùng lớn nhất ${byReg[0][0]} chiếm ${nf(byReg[0][1] / all * 100)}%.` + (prod === 'Urê' && tot ? ` Urê từ khí chiếm ${nf(g / tot * 100)}% công suất urê (${[...new Set(urea.filter(p => p.technology === 'Urê từ khí').map(p => p.region))].join(', ')}); urê từ than ở ${[...new Set(urea.filter(p => p.technology === 'Urê từ than').map(p => p.region))].join(', ')}.` : '') : '';
  }

  /* ---------- 0.4 Ma trận cấu trúc sản xuất (drill-down) ---------- */
  const s4 = el('section', 'ov-sec', `<header class="ov-sh"><span class="ov-num">0.4</span><div><h3>Mỗi nhà máy dùng công nghệ, nguyên liệu và nguồn cung nào — yếu tố chi phí là gì?</h3><p>Bấm tên vùng để mở/đóng. Cột "Yếu tố chi phí" nối sang tab Chi phí đầu vào.</p></div></header>`);
  const tb = el('div', 'card fb-mtx'); tb.dataset.blockId = 'pb-09'; tb.dataset.updateKind = 'document'; tb.dataset.cadence = 'annual';
  tb.innerHTML = `<div class="chart-title">Ma trận cấu trúc sản xuất ngành</div><div class="chart-sub">Theo bộ lọc của bản đồ (sản phẩm, công nghệ, vùng, doanh nghiệp) · công suất thiết kế nghìn tấn/năm</div><div class="tbl-wrap"></div><div class="pw-src">Nguồn: ${esc(src)}</div>`;
  s4.append(tb); host.append(s4);
  const open = new Set(regions);
  function drawTable() {
    const list = sel(), regs = [...new Set(list.map(p => p.region))];
    const rows = regs.map(r => { const ps = list.filter(p => p.region === r);
      return `<tr class="fb-mtx-g" data-r="${esc(r)}"><td colspan="9"><button type="button" aria-expanded="${open.has(r)}">${open.has(r) ? '▾' : '▸'} ${esc(r)}</button> <small>${ps.length} nhà máy</small></td></tr>`
        + (open.has(r) ? ps.map(p => (p.products || []).filter(x => !S.prod || prodKey(x.product) === S.prod).map((x, i) => { const sup = SUP[p.feed_supply_status] || SUP.unknown;
          return `<tr><td>${i ? '' : `<b>${esc(p.ticker || '—')}</b> ${esc(p.owner)}`}</td><td>${i ? '' : esc(p.plant)}</td><td>${i ? '' : esc(p.province_current || '')}</td><td>${esc(x.product)}</td><td class="n">${fin(x.capacity_kt) ? nf(x.capacity_kt) : 'N/A'}</td><td><i class="fb-tdot" style="background:${TECH[p.technology]}"></i>${esc(p.technology)}</td><td>${esc(p.feedstock || '')}</td><td><span class="fb-sup" style="--c:${sup[1]}">${sup[0]}</span> ${esc(p.feed_supply || '')}</td><td>${esc(DRIVER[p.technology] || '')}</td></tr>`; }).join('')).join('') : ''); }).join('');
    tb.querySelector('.tbl-wrap').innerHTML = `<table class="compare-table fb-mtx-t"><thead><tr><th>Doanh nghiệp</th><th>Nhà máy</th><th>Tỉnh (từ 1/7/2025)</th><th>Sản phẩm</th><th class="n">Công suất</th><th>Công nghệ</th><th>Nguyên liệu</th><th>Nguồn cung</th><th>Yếu tố chi phí</th></tr></thead><tbody>${rows}</tbody></table>`;
  }
  tb.addEventListener('click', e => { const g = e.target.closest('.fb-mtx-g'); if (!g) return; const r = g.dataset.r; open.has(r) ? open.delete(r) : open.add(r); drawTable(); });
  drawMap(); drawCap(); drawTable();
}
window.FertMap = {build, TECH};
})();
