/* Chuỗi dài từ tài liệu (Bộ Xây dựng, CBRE, DKRA, dự án FDI) cho dashboard Bất động sản.
   Dữ liệu: window.RE_MARKET_HISTORY (scripts/build_realestate_market.py). Mỗi số có link nguồn
   trong data/realestate-market; ô thiếu để trống, không nội suy. */
(() => {
'use strict';
if (document.body.dataset.sector !== 'realestate') return;
const D = window.RE_MARKET_HISTORY;
if (!D) return;
const C = {navy: '#2938A8', teal: '#59C5C8', plum: '#861C52', gold: '#c29100', grey: '#6b7686'};
const nf = (v, d = 0) => v == null ? '—' : Number(v).toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d});
const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const note = text => { const d = make('details', 'note-icon'); d.append(make('summary', '', 'ⓘ Lưu ý dữ liệu'), make('div', '', text)); return d; };
const qk = q => { const [n, y] = q.split('/'); return +y * 10 + +n.slice(1); };

function chart(id, model) {
  const host = document.getElementById(id);
  if (!host) return;
  if (window.ChartTypes) {
    const base = model.native === 'stack' ? () => { host.innerHTML = ChartTypes.render(model, 'stack'); } : null;
    if (base) return ChartTypes.mount(host, model, base);
  }
  barLineChart(id, {categories: model.categories, series: model.series, unit: model.unit, digits: model.digits, zeroBase: model.zeroBase, height: 260, rotateLabels: true, stackable: model.stackable});
}
function legend(id, items) {
  const host = document.getElementById(id); if (!host) return;
  const l = make('div', 'legend');
  items.forEach(([name, color]) => { const s = make('span', 'li'); const d = make('span', 'dot'); d.style.background = color; s.append(d, name); l.append(s); });
  host.after(l);
}
function sources(id, rows, extra) {
  const host = document.getElementById(id); const card = host?.closest('.card'); if (!card) return;
  const seen = new Map();
  rows.forEach(r => (r.sources || []).forEach(s => { if (s.url && !seen.has(s.url)) seen.set(s.url, `${r.quarter || r.market || ''} · ${s.label}`); }));
  const det = make('details', 'dtable'); det.append(make('summary', '', `Nguồn từng kỳ (${seen.size} link)`));
  const ul = make('ul', 'source-list'); ul.style.cssText = 'font-size:12px;margin:6px 0 0;padding-left:18px';
  seen.forEach((label, url) => { const li = make('li'); const a = make('a', '', label); a.href = url; a.target = '_blank'; a.rel = 'noopener'; li.append(a); ul.append(li); });
  det.append(ul);
  const note = extra ? make('div', 'source-note', extra) : null;
  card.append(...[note, det].filter(Boolean));
  card.dataset.refreshStatus = 'loaded';
}
function table(id, headers, rows) { if (document.getElementById(id)) fillTable(id, headers, rows); }

// ---------- Bộ Xây dựng: giao dịch & tồn kho ----------
const moc = D.moc_quarterly || [];
if (moc.length) {
  const cats = moc.map(r => r.quarter), k = v => v == null ? null : v / 1000;
  chart('chMocTx', {categories: cats, unit: 'nghìn', digits: 1, stackable: true, native: 'stack', aria: 'Giao dịch bất động sản theo quý',
    series: [{name: 'Căn hộ + nhà riêng lẻ', color: C.navy, values: moc.map(r => k(r.transactions_apt_house))}, {name: 'Đất nền', color: C.teal, values: moc.map(r => k(r.transactions_land))}]});
  legend('chMocTx', [['Căn hộ + nhà riêng lẻ', C.navy], ['Đất nền', C.teal]]);
  table('tbl-moc-tx', ['Quý', 'Tổng', 'Căn hộ + nhà riêng lẻ', 'Đất nền', 'Ghi chú'], moc.slice().reverse().map(r => [r.quarter, nf(r.transactions_total), nf(r.transactions_apt_house), nf(r.transactions_land), r.notes || '']));
  sources('chMocTx', moc, 'Mỗi quý lấy số trong bản tin của chính quý đó; Bộ thường sửa số quý trước ở lần công bố sau. Q1/2026 có hai số tổng (139.855 và 115.650); dùng số khớp với tỷ lệ so sánh trong bản tin Q2/2026.');

  const inv = moc.filter(r => r.inventory_total != null || qk(r.quarter) >= 20232);
  chart('chMocInv', {categories: inv.map(r => r.quarter), unit: 'sản phẩm', digits: 0, stackable: true, native: 'stack', aria: 'Tồn kho chủ đầu tư theo quý',
    series: [{name: 'Căn hộ', color: C.navy, values: inv.map(r => r.inventory_apt)}, {name: 'Nhà riêng lẻ', color: C.plum, values: inv.map(r => r.inventory_house)}, {name: 'Đất nền', color: C.teal, values: inv.map(r => r.inventory_land)}]});
  legend('chMocInv', [['Căn hộ', C.navy], ['Nhà riêng lẻ', C.plum], ['Đất nền', C.teal]]);
  table('tbl-moc-inv', ['Quý', 'Tổng', 'Căn hộ', 'Nhà riêng lẻ', 'Đất nền', 'Tỉnh báo cáo'], inv.slice().reverse().map(r => [r.quarter, nf(r.inventory_total), nf(r.inventory_apt), nf(r.inventory_house), nf(r.inventory_land), r.provinces_reporting || '—']));
  sources('chMocInv', inv);
  const card = document.getElementById('chMocInv')?.closest('.card');
  if (card) card.insertBefore(note('Số tỉnh gửi báo cáo đổi theo quý (17–60/63 trước sáp nhập, 22–25/34 sau 7/2025) nên mức tồn kho giữa các quý không cùng phạm vi. Q1/2023, Q1/2025 không công bố số tuyệt đối.'), card.querySelector('details'));
}

// ---------- CBRE: giá sơ cấp & mở bán ----------
const hn = D.hn_series || [], hcm = D.hcm_series || [];
if (hn.length && hcm.length) {
  const all = [...new Set([...hn, ...hcm].map(r => r.quarter))]
    .filter(q => [hn, hcm].some(rows => rows.some(r => r.quarter === q && (r.price != null || r.new_supply != null || r.sold != null))))
    .sort((a, b) => qk(a) - qk(b));
  const by = (rows, q) => rows.find(r => r.quarter === q) || {};
  const isVnd = r => /VND/.test(r.price_unit || '');
  const merged = q => qk(q) >= 20261;
  // VND từ 2023
  const vq = all.filter(q => qk(q) >= 20231);
  const pv = (rows, q, f = () => true) => { const r = by(rows, q); return r.price != null && isVnd(r) && f(q) ? r.price : null; };
  chart('chCbrePriceVnd', {categories: vq, unit: 'triệu đ/m²', digits: 0, zeroBase: false, aria: 'Giá căn hộ sơ cấp CBRE, triệu đồng/m²',
    series: [{name: 'Hà Nội', color: C.navy, kind: 'line', values: vq.map(q => pv(hn, q))},
      {name: 'TP.HCM (cũ)', color: C.teal, kind: 'line', values: vq.map(q => pv(hcm, q, x => !merged(x)))},
      {name: 'TP.HCM (sau sáp nhập)', color: C.gold, kind: 'line', values: vq.map(q => pv(hcm, q, merged))}]});
  legend('chCbrePriceVnd', [['Hà Nội', C.navy], ['TP.HCM (cũ)', C.teal], ['TP.HCM sau sáp nhập', C.gold]]);
  table('tbl-cbre-price', ['Quý', 'Hà Nội', 'TP.HCM', 'Ghi chú'], vq.slice().reverse().map(q => [q, nf(pv(hn, q)), nf(pv(hcm, q)), [by(hn, q).note, by(hcm, q).note].filter(Boolean).join(' | ')]));
  sources('chCbrePriceVnd', [...hn, ...hcm].filter(r => isVnd(r)), 'Giảm Q4/2025 ở Hà Nội (90→78) do đại dự án Văn Giang chiếm >60% hàng mở bán, không phải giảm giá cùng dự án. TP.HCM 92→71 ở Q1/2026 là đổi phạm vi (thêm Bình Dương, Bà Rịa – Vũng Tàu cũ). Ô trống: CBRE chưa công bố hoặc chưa tìm được bài gốc.');
  // USD giai đoạn trước
  const uq = all.filter(q => qk(q) <= 20231);
  const pu = (rows, q) => { const r = by(rows, q); return r.price != null && !isVnd(r) ? r.price : null; };
  chart('chCbrePriceUsd', {categories: uq, unit: 'USD/m²', digits: 0, zeroBase: false, aria: 'Giá căn hộ sơ cấp CBRE, USD/m²',
    series: [{name: 'Hà Nội', color: C.navy, kind: 'line', values: uq.map(q => pu(hn, q))}, {name: 'TP.HCM', color: C.teal, kind: 'line', values: uq.map(q => pu(hcm, q))}]});
  legend('chCbrePriceUsd', [['Hà Nội', C.navy], ['TP.HCM', C.teal]]);
  table('tbl-cbre-price-usd', ['Quý', 'Hà Nội', 'TP.HCM'], uq.slice().reverse().map(q => [q, nf(pu(hn, q)), nf(pu(hcm, q))]));
  sources('chCbrePriceUsd', [...hn, ...hcm].filter(r => qk(r.quarter) <= 20231 && !isVnd(r)), 'Không quy đổi sang VND để tránh thêm giả định tỷ giá; xem đoạn từ 2023 ở chart bên cạnh.');
  // Mở bán mới
  const sq = all.filter(q => by(hn, q).new_supply != null || by(hcm, q).new_supply != null);
  chart('chCbreSupply', {categories: sq, unit: 'căn', digits: 0, aria: 'Căn hộ mở bán mới theo quý',
    series: [{name: 'Hà Nội', color: C.navy, values: sq.map(q => by(hn, q).new_supply ?? null)}, {name: 'TP.HCM', color: C.teal, values: sq.map(q => by(hcm, q).new_supply ?? null)}]});
  legend('chCbreSupply', [['Hà Nội', C.navy], ['TP.HCM', C.teal]]);
  const pct = v => v == null ? '—' : v + '%';
  table('tbl-cbre-supply', ['Quý', 'HN mở bán', 'HN bán được', 'HN hấp thụ', 'HCM mở bán', 'HCM bán được', 'HCM hấp thụ'], all.slice().reverse().map(q => { const a = by(hn, q), b = by(hcm, q); return [q, nf(a.new_supply), nf(a.sold), pct(a.absorption_pct), nf(b.new_supply), nf(b.sold), pct(b.absorption_pct)]; }));
  sources('chCbreSupply', [...hn, ...hcm], 'Quý thiếu số (CBRE chỉ công bố cả năm) để trống. Hà Nội Q2/2021, Q2/2022, Q2/2026 là số 6 tháng trừ Q1. Tỷ lệ hấp thụ CBRE lúc tính trên dự án mới, lúc toàn thị trường; xem ghi chú từng quý ở chart giá.');
}

// ---------- Cung mới chi tiết & tỉnh ----------
const sd = D.supply_detail || [];
if (sd.length) {
  const join = (xs, f) => (xs || []).map(f).filter(Boolean).join('; ') || '—';
  table('tbl-supply-detail', ['Quý · thị trường · hãng', 'Căn mở bán', 'Phân khúc', 'Khu vực', 'Ghi chú'],
    sd.slice().sort((a, b) => qk(b.quarter) - qk(a.quarter)).map(r => [`${r.quarter} · ${r.city} · ${r.source_firm}`, nf(r.total_new_units), join(r.by_segment, s => `${s.segment}: ${s.units_or_share ?? '—'}`), join(r.by_location, s => `${s.area}: ${s.units_or_share ?? '—'}`), r.note || '']));
  sources('tbl-supply-detail', sd.map(r => ({...r, quarter: `${r.quarter} ${r.city} ${r.source_firm}`})));
}
// Cơ cấu cung mới: chỉ vẽ phần các hãng công bố đủ để cộng thành 100%; "Còn lại" = 100 trừ phần đã công bố.
// Số từ data/realestate-market/supply_detail.json (CBRE, Savills).
if (document.getElementById('chSupplyFirms')) {
  chart('chSupplyFirms', {categories: ['Hà Nội', 'TP.HCM'], unit: 'căn', digits: 0, aria: 'Căn hộ mở bán mới Q2/2026 theo hãng',
    series: [{name: 'CBRE', color: C.navy, values: [8590, 6573]}, {name: 'Savills', color: C.teal, values: [5317, 1800]}]});
  legend('chSupplyFirms', [['CBRE', C.navy], ['Savills', C.teal]]);
  const h = document.getElementById('chSupplyFirms').closest('.card');
  h?.insertBefore(note('CBRE Hà Nội Q2 = 16.600 căn 6 tháng trừ 8.010 căn Q1 (tự tính). CBRE TP.HCM là thành phố sau sáp nhập (gồm Bình Dương cũ); Savills có thể chưa gồm, nên hai hãng lệch gần 4 lần. Hấp thụ: CBRE HN 68%, CBRE HCM 73% dự án mới; Savills HCM 32% (6 tháng).'), h.querySelector('details'));
}
if (document.getElementById('chSupplyLoc')) {
  chart('chSupplyLoc', {categories: ['Hà Nội Q1/2026', 'TP.HCM Q2/2026'], unit: '%', digits: 0, stackable: true, native: 'stack', aria: 'Cơ cấu cung mới theo khu vực',
    series: [{name: 'Tỉnh giáp ranh (Văn Giang · Bình Dương cũ)', color: C.plum, values: [42, 80]},
      {name: 'Huyện ngoại thành HN (Hoài Đức, Gia Lâm, Đông Anh)', color: C.gold, values: [37, null]},
      {name: 'Còn lại', color: C.grey, values: [21, 20]}]});
  legend('chSupplyLoc', [['Tỉnh giáp ranh (Văn Giang · Bình Dương cũ)', C.plum], ['Ngoại thành HN', C.gold], ['Còn lại', C.grey]]);
}
if (document.getElementById('chSupplyPrice')) {
  chart('chSupplyPrice', {categories: ['HN Q1 · CBRE', 'HN Q2 · CBRE', 'HCM Q2 · Savills'], unit: '%', digits: 0, stackable: true, native: 'stack', aria: 'Cơ cấu cung mới theo mức giá',
    series: [{name: '60–80', color: C.teal, values: [60, null, null]}, {name: '80–100', color: C.navy, values: [null, 30, null]},
      {name: 'Trên 120', color: C.plum, values: [null, 35, 80]}, {name: 'Mức khác / không công bố', color: C.grey, values: [40, 35, 20]}]});
  legend('chSupplyPrice', [['60–80', C.teal], ['80–100', C.navy], ['Trên 120', C.plum], ['Mức khác', C.grey]]);
  document.getElementById('chSupplyPrice').closest('.card')?.append(note('Dưới 60 triệu đ/m²: 0% ở Hà Nội cả Q1 và Q2/2026 (CBRE). HN Q1 "60–80" là "trên 60%", vẽ ở mức sàn 60%. Savills Hà Nội Q2: không còn căn dưới 70, khoảng 60% từ 90 trở lên (khác thang mức giá nên không vẽ chung).'));
  sources('chSupplyPrice', sd.filter(r => /CBRE|Savills/.test(r.source_firm)).map(r => ({...r, quarter: `${r.quarter} ${r.city} ${r.source_firm}`})));
}
const pv = D.provinces || [];
if (pv.length) {
  const seg = {apartment: 'Căn hộ', 'townhouse-villa': 'Nhà phố, biệt thự', 'land plot': 'Đất nền'};
  const price = r => (r.price == null ? (r.price_unit || '—').replace(/^VND mn\/m2\s*/, '') : `${nf(r.price)} ${r.price_unit || ''}`).replace(/VND mn\/m2/g, 'tr đ/m²');
  table('tbl-provinces', ['Thị trường', 'Quý', 'Loại', 'Cung mới', 'Bán / hấp thụ', 'Giá', 'Nguồn'],
    pv.slice().sort((a, b) => a.market.localeCompare(b.market, 'vi') || qk(b.quarter.slice(0, 7)) - qk(a.quarter.slice(0, 7))).map(r => [r.market, r.quarter, seg[r.segment] || r.segment, r.new_supply ?? '—', r.sold_or_absorption ?? '—', price(r), r.source_firm || '']));
  sources('tbl-provinces', pv);
}

// ---------- Dự án FDI lớn (dropdown theo loại hình) ----------
const fp = D.fdi_projects || [];
const fdiCard = document.querySelector('[data-block-id="bds-05"]');
if (fp.length && fdiCard) {
  const card = make('div', 'card'); card.style.marginTop = '14px'; card.dataset.blockId = 'bds-05b'; card.dataset.updateKind = 'document'; card.dataset.refreshStatus = 'loaded';
  card.append(make('div', 'chart-title', 'Dự án FDI lớn liên quan bất động sản — 2023 đến 9/2026'), make('div', 'chart-sub', 'triệu USD · vốn đăng ký công bố theo dự án · lọc theo loại hình, năm'));
  const box = make('details', 'dtable wi-table-fold fdi-projects'); box.open = true;
  box.append(make('summary', '', `Danh sách ${fp.length} dự án`));
  const ctl = make('div'); ctl.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin:8px 0';
  const sel = make('select'); sel.setAttribute('aria-label', 'Loại hình dự án');
  const types = [...new Set(fp.map(p => p.type))];
  [['all', `Tất cả loại hình (${fp.length})`], ...types.map(t => [t, `${t} (${fp.filter(p => p.type === t).length})`])].forEach(([v, l]) => { const o = make('option', '', l); o.value = v; sel.append(o); });
  const yrs = make('select'); yrs.setAttribute('aria-label', 'Năm');
  ['all', ...[...new Set(fp.map(p => p.year))].sort().reverse()].forEach(y => { const o = make('option', '', y === 'all' ? 'Mọi năm' : String(y)); o.value = y; yrs.append(o); });
  ctl.append(sel, yrs);
  const wrap = make('div', 'tablewrap'), t = make('table'); t.id = 'tbl-fdi-projects'; wrap.append(t);
  const sum = make('div', 'source-note');
  box.append(ctl, sum, wrap);
  card.append(box, note('Danh sách gom từ tin công bố, không phải toàn bộ FDI vào BĐS; NSO không công bố vốn thực hiện theo ngành. Dự án liên doanh ghi tổng vốn dự án. Ghi chú nêu dự án mới ở mức đề xuất hoặc ghi nhớ.'));
  (document.querySelector('[data-block-id="bds-05d"]')?.closest('.grid') || fdiCard.closest('.grid') || fdiCard).after(card);
  const draw = () => {
    const rows = fp.filter(p => (sel.value === 'all' || p.type === sel.value) && (yrs.value === 'all' || String(p.year) === yrs.value)).sort((a, b) => (b.capital_musd || 0) - (a.capital_musd || 0));
    sum.textContent = `${rows.length} dự án · tổng ${nf(rows.reduce((s, p) => s + (p.capital_musd || 0), 0))} triệu USD (vốn đăng ký công bố; gồm cấp mới, tăng vốn, góp vốn).`;
    t.replaceChildren();
    const th = make('thead'), hr = make('tr'); ['Năm', 'Dự án', 'Nhà đầu tư · nước', 'Loại hình', 'Triệu USD', 'Hình thức', 'Tỉnh', 'Ghi chú', 'Nguồn'].forEach(h => hr.append(make('th', '', h))); th.append(hr);
    const tb = make('tbody');
    rows.forEach(p => {
      const tr = make('tr');
      [p.month ? `${p.month}/${p.year}` : p.year, p.name, `${p.investor || '—'} · ${p.country || '—'}`, p.type, nf(p.capital_musd), p.kind || '—', p.province || '—', p.note || ''].forEach(v => tr.append(make('td', '', String(v))));
      const td = make('td'); (p.sources || []).forEach((s, i) => { if (i) td.append(' · '); const a = make('a', '', s.label); a.href = s.url; a.target = '_blank'; a.rel = 'noopener'; td.append(a); }); tr.append(td);
      tb.append(tr);
    });
    t.append(th, tb);
  };
  sel.addEventListener('change', draw); yrs.addEventListener('change', draw); draw();
}
})();
