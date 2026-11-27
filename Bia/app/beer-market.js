/* Bia › Kênh tiêu thụ & sản phẩm · Thị phần & cạnh tranh · Tác động tới doanh nghiệp · Luận điểm đầu tư (27/11/2026).
   Dữ liệu: window.BEER_MARKET (data/beer-market.js, scripts/build_beer_market.py từ data/beer/market/*.csv). Mọi tỷ trọng, CAGR,
   chỉ số 2019 = 100, chênh lệch điểm % tính tại đây từ số gốc. Không nội suy năm thiếu, không điền 0, không ghép phạm vi
   (toàn thị trường / kênh mang về / kênh tại chỗ; sản xuất ≠ tiêu thụ). Dùng hàm vẽ của trang (barLineChart, hbarCompare, fillTable, sparkline). */
(() => {
'use strict';
const M = window.BEER_MARKET; if (!M?.observations || document.body.dataset.pkg !== 'beer') return;
const $ = id => document.getElementById(id);
const make = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const fin = v => typeof v === 'number' && Number.isFinite(v);
const nf = (v, d = 1) => fin(v) ? v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}) : '—';
const sg = (v, d = 1) => fin(v) ? (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), d) : '—';
const O = M.observations, SRC = M.sources;
const get = f => O.filter(o => Object.entries(f).every(([k, v]) => o[k] === v));
const val = f => { const o = get(f)[0]; return o ? o.value : null; };

// Màu nhận diện: dùng chung mọi chart
const CO = {heineken: ['Heineken', '#2E8B57'], sabeco: ['Sabeco', '#C8102E'], carlsberg: ['Carlsberg', '#2a9fa3'], habeco: ['Habeco', '#E08A1E'], others: ['Khác', '#9AA3B5']};
const CH = {off_trade: ['Mua mang về', '#2938A8'], on_trade: ['Uống tại chỗ', '#59C5C8'], total: ['Toàn thị trường', '#3D4352']};
const PK = {can: ['Bia lon', '#2938A8'], bottle: ['Bia chai', '#2a9fa3'], draft: ['Bia hơi', '#c29100'], unclassified: ['Chưa phân loại', '#C9CDD6']};

function srcParts(ids) { return [...new Set(ids)].map(id => SRC[id]).filter(Boolean).map(s => [s.name + (s.table ? ', ' + s.table : ''), s.url]); }
// Dòng nguồn: chart vẽ bằng barLineChart dùng source-note (chart-source.js đưa vào ⓘ); khối HTML dùng pw-src hiện sẵn.
function sourceLine(id, ids, period, method) {
  const host = $(id); if (!host) return; const card = host.closest('.card');
  const n = make('div', 'source-note cadence-note'); n.append('Nguồn: ');
  srcParts(ids).forEach(([name, url], i) => { if (i) n.append(' · '); const a = make('a', '', esc(name)); a.href = url; a.target = '_blank'; a.rel = 'noopener'; n.append(a); });
  if (period) n.append(' · Kỳ: ' + period);
  host.after(n); if (method) n.after(make('div', 'source-note method-note', esc(method)));
  if (card) card.dataset.refreshStatus = 'loaded';
}
function pwSrc(id, ids, method) {
  const card = $(id)?.closest('.card'); if (!card) return;
  const n = make('div', 'pw-src'); n.append('Nguồn: ');
  srcParts(ids).forEach(([name, url], i) => { if (i) n.append('; '); const a = make('a', '', esc(name)); a.href = url; a.target = '_blank'; a.rel = 'noopener'; n.append(a); });
  n.dataset.tidied = n.innerHTML; card.append(n);
  if (method) $(id).after(make('div', 'source-note method-note', esc(method)));
  card.dataset.refreshStatus = 'loaded';
}
function insight(id, text) { const card = $(id)?.closest('.card'); if (!card || !text) return; const n = make('div', 'chart-insight'); n.dataset.inputOwner = 'ai'; n.innerHTML = '<b>Cách hiểu trong bối cảnh ngành · AI:</b> '; n.append(text); card.append(n); }
function legend(id, items) { const host = $(id); if (!host) return; const l = make('div', 'legend'); items.forEach(([n, c]) => { const s = make('span', 'li'), d = make('span', 'dot'); d.style.background = c; s.append(d, n); l.append(s); }); host.after(l); }
const sid = f => [...new Set(get(f).map(o => Object.keys(SRC).find(k => SRC[k].url === o.source_url && SRC[k].name === o.source_name)))];

// Cột chồng làm kiểu mặc định (ChartTypes đọc model.native); không có ChartTypes thì dùng hàm vẽ cũ của trang.
function stackChart(id, o) {
  const host = $(id); if (!host) return;
  if (!window.ChartTypes) return barLineChart(id, o);
  ChartTypes.mount(host, {key: id, categories: o.categories, series: o.series.map(s => ({name: s.name, color: s.color, kind: s.kind, values: s.values})), unit: o.unit, digits: o.digits, zeroBase: true, height: o.height, stackable: true, native: 'stack', aria: o.ariaLabel}, () => barLineChartBase(id, o));
}
// Sơ đồ SVG tự vẽ theo bề rộng thật của khung; vẽ lại khi khung đổi cỡ (tab ẩn lúc dựng có bề rộng 0).
const LIVE = {};
function live(id, draw) {
  const host = $(id); if (!host) return;
  const first = !LIVE[id]; LIVE[id] = {draw, w0: -1};
  const go = force => { const L = LIVE[id], w = Math.round(host.clientWidth); if (!force && w && Math.abs(w - L.w0) < 8) return; L.w0 = w; L.draw(Math.max(320, Math.min(w || 560, 900))); };
  go(true); if (first && 'ResizeObserver' in window) new ResizeObserver(() => go(false)).observe(host);
}

/* ================= Dữ liệu dẫn xuất ================= */
const vol = ch => Object.fromEntries(get({metric: 'volume', channel: ch}).map(o => [o.period, o.value]));
const OFF = vol('off_trade'), ON = vol('on_trade'), TOT = vol('total');
const YRS = Object.keys(TOT).sort(), Y0 = YRS[0], Y1 = YRS.at(-1);
const shareOf = y => fin(OFF[y]) && fin(TOT[y]) ? OFF[y] / TOT[y] * 100 : null;
const cagr = (a, b, n) => fin(a) && fin(b) && a > 0 && n > 0 ? (Math.pow(b / a, 1 / n) - 1) * 100 : null;
const chg = (a, b) => fin(a) && fin(b) && a ? (b / a - 1) * 100 : null;
const CS = sc => { const r = {}; get({metric: 'company_share', market_share_scope: sc}).forEach(o => { (r[o.period] = r[o.period] || {})[o.entity] = o.value; }); return r; };
const TS = CS('total'), OS = CS('off_trade'), NS = CS('on_trade');
const TY = Object.keys(TS).sort(), OY = Object.keys(OS).sort();
const BR = get({metric: 'brand_share'}), BY = [...new Set(BR.map(o => o.period))].sort();

/* ================= Ô số đầu sub-tab ================= */
function kpi(spark, value, unit, delta, sub, sp, color = '#2938A8') {
  const s = $(spark), card = s?.closest('.kpi'); if (!card) return;
  const v = card.querySelector('.value'); v.textContent = value;
  if (unit) { const u = make('span', 'unit', esc(unit)); u.style.cssText = 'font-size:12px;font-weight:600;color:var(--muted,#6b7a90);margin-left:6px;letter-spacing:0'; v.append(u); }
  card.querySelector('.delta').textContent = delta || ''; card.querySelector('.sub').textContent = sub || '';
  s.replaceChildren(); const vs = (sp || []).filter(fin); if (vs.length > 1 && window.sparkline) sparkline(spark, vs, color);
}
function kpis() {
  const n = Number(Y1) - Number(Y0);
  kpi('spk-off', nf(shareOf(Y1), 1) + '%', '', `${Y0}: ${nf(shareOf(Y0), 1)}%`, `Tỷ trọng mua mang về · ${Y1}`, YRS.map(shareOf));
  kpi('spk-offchg', sg(shareOf(Y1) - shareOf(Y0), 1), 'điểm %', `từ ${nf(shareOf(Y0), 1)}% lên ${nf(shareOf(Y1), 1)}%`, `${Y0} → ${Y1}`, YRS.map(shareOf), '#c29100');
  kpi('spk-offcagr', sg(cagr(OFF[Y0], OFF[Y1], n), 1) + '%/năm', '', `sản lượng ${sg(chg(OFF[Y0], OFF[Y1]), 1)}% cả giai đoạn`, `Mua mang về · ${Y0}–${Y1}`, YRS.map(y => OFF[y]));
  kpi('spk-oncagr', sg(cagr(ON[Y0], ON[Y1], n), 1) + '%/năm', '', `sản lượng ${sg(chg(ON[Y0], ON[Y1]), 1)}% cả giai đoạn`, `Uống tại chỗ · ${Y0}–${Y1}`, YRS.map(y => ON[y]), '#59C5C8');
  const t = TS[TY.at(-1)] || {}, top = Object.entries(t).filter(([k]) => k !== 'others').sort((a, b) => b[1] - a[1]);
  const cr = k => top.slice(0, k).reduce((a, x) => a + x[1], 0);
  kpi('spk-cr2', nf(cr(2), 1) + '%', '', `${top.slice(0, 2).map(x => CO[x[0]][0]).join(' + ')}`, `CR2 · ${TY.at(-1)} · toàn thị trường`, TY.map(y => { const r = Object.entries(TS[y]).filter(([k]) => k !== 'others').sort((a, b) => b[1] - a[1]); return r.slice(0, 2).reduce((a, x) => a + x[1], 0); }));
  kpi('spk-cr4', nf(cr(4), 1) + '%', '', 'bốn hãng lớn nhất', `CR4 · ${TY.at(-1)} · toàn thị trường`, TY.map(y => 100 - (TS[y].others ?? NaN)), '#c29100');
  kpi('spk-gap', sg(t.heineken - t.sabeco, 1), 'điểm %', `Heineken ${nf(t.heineken, 1)}% · Sabeco ${nf(t.sabeco, 1)}%`, `Chênh Heineken − Sabeco · ${TY.at(-1)}`, TY.map(y => TS[y].heineken - TS[y].sabeco), '#2E8B57');
  const o0 = OS[OY[0]] || {}, o1 = OS[OY.at(-1)] || {};
  kpi('spk-offsab', sg(o1.sabeco - o0.sabeco, 0), 'điểm %', `${nf(o0.sabeco, 0)}% → ${nf(o1.sabeco, 0)}%`, `Sabeco ở kênh mang về · ${OY[0]} → ${OY.at(-1)}`, [o0.sabeco, o1.sabeco], '#C8102E');
}

/* ================= Module A: kênh tiêu thụ ================= */
const SRC_CH = sid({metric: 'volume'});
function channel() {
  if ($('chBeerChMix')) {
    stackChart('chBeerChMix', {categories: YRS, series: ['off_trade', 'on_trade'].map(k => ({name: CH[k][0], color: CH[k][1], kind: 'bar', values: YRS.map(y => fin((k === 'off_trade' ? OFF : ON)[y]) ? (k === 'off_trade' ? OFF : ON)[y] / TOT[y] * 100 : null)})), unit: '%', digits: 1, height: 280, stackable: true, ariaLabel: 'Cơ cấu sản lượng theo kênh'});
    legend('chBeerChMix', ['off_trade', 'on_trade'].map(k => CH[k]));
    fillTable('tbl-beer-chmix', ['Năm', 'Mua mang về (%)', 'Uống tại chỗ (%)'], YRS.map(y => [y, nf(OFF[y] / TOT[y] * 100, 1), nf(ON[y] / TOT[y] * 100, 1)]));
    sourceLine('chBeerChMix', SRC_CH, `${Y0}–${Y1}`, 'Tỷ trọng = sản lượng kênh ÷ tổng sản lượng tiêu thụ (Euromonitor, total volume). Nghị định 100/2019 (xử phạt nồng độ cồn khi lái xe) hiệu lực từ 1/1/2020; cùng giai đoạn có COVID-19 (2020–2021), nên mức dịch chuyển không quy hết cho Nghị định 100.');
    const s20 = shareOf('2021'), sl = shareOf(Y1);
    insight('chBeerChMix', `Mua mang về lên ${nf(sl, 0)}% năm ${Y1} từ ${nf(shareOf(Y0), 0)}% năm ${Y0}; từ 2021 tỷ trọng quanh ${nf(Math.min(...YRS.filter(y => y >= '2021').map(shareOf)), 0)}–${nf(Math.max(...YRS.filter(y => y >= '2021').map(shareOf)), 0)}%, chưa thấy tăng tốc thêm. Kiểm tiếp số Euromonitor năm ${Number(Y1) + 1}.`);
  }
  if ($('chBeerChVol')) {
    stackChart('chBeerChVol', {categories: YRS, series: [['off_trade', OFF], ['on_trade', ON]].map(([k, d]) => ({name: CH[k][0], color: CH[k][1], kind: 'bar', values: YRS.map(y => d[y] ?? null)})), unit: 'triệu lít', digits: 0, height: 280, stackable: true, ariaLabel: 'Sản lượng tiêu thụ theo kênh'});
    legend('chBeerChVol', ['off_trade', 'on_trade'].map(k => CH[k]));
    fillTable('tbl-beer-chvol', ['Năm', 'Mua mang về', 'Uống tại chỗ', 'Tổng', 'Tổng so năm trước (%)'], YRS.map((y, i) => [y, nf(OFF[y], 1), nf(ON[y], 1), nf(TOT[y], 1), i ? sg(chg(TOT[YRS[i - 1]], TOT[y]), 1) : '—']));
    sourceLine('chBeerChVol', SRC_CH, `${Y0}–${Y1}`, 'Sản lượng tiêu thụ (total volume), triệu lít. Tỷ trọng mang về tăng không có nghĩa tổng cầu tăng: đọc cùng tổng sản lượng.');
    insight('chBeerChVol', `Tổng tiêu thụ ${Y1} là ${nf(TOT[Y1], 0)} triệu lít, ${sg(chg(TOT[Y0], TOT[Y1]), 1)}% so với ${Y0}; mang về ${sg(chg(OFF[Y0], OFF[Y1]), 1)}%, tại chỗ ${sg(chg(ON[Y0], ON[Y1]), 1)}%. Kiểm tiếp tổng tiêu thụ năm ${Number(Y1) + 1} đã về mức ${Y0} chưa.`);
  }
  if ($('chBeerChIdx')) {
    const ix = d => YRS.map(y => fin(d[y]) && d[Y0] ? d[y] / d[Y0] * 100 : null);
    barLineChart('chBeerChIdx', {categories: YRS, series: [['off_trade', OFF], ['on_trade', ON], ['total', TOT]].map(([k, d]) => ({name: CH[k][0], color: CH[k][1], kind: 'line', values: ix(d)})), unit: `${Y0} = 100`, digits: 1, height: 280, zeroBase: false, ariaLabel: 'Chỉ số sản lượng theo kênh'});
    legend('chBeerChIdx', ['off_trade', 'on_trade', 'total'].map(k => CH[k]));
    fillTable('tbl-beer-chidx', ['Năm', 'Mua mang về', 'Uống tại chỗ', 'Toàn thị trường'], YRS.map((y, i) => [y, ...[OFF, ON, TOT].map(d => nf(ix(d)[i], 1))]));
    sourceLine('chBeerChIdx', SRC_CH, `${Y0}–${Y1}`, `Chỉ số = sản lượng năm ÷ sản lượng ${Y0} × 100, tính từ số Euromonitor.`);
  }
  if ($('chBeerChBridge')) {
    const dOff = OFF[Y1] - OFF[Y0], dOn = ON[Y1] - ON[Y0];
    live('chBeerChBridge', W => waterfall('chBeerChBridge', [[`Tổng ${Y0}`, TOT[Y0], 'total'], ['Mua mang về', dOff, 'step'], ['Uống tại chỗ', dOn, 'step'], [`Tổng ${Y1}`, TOT[Y1], 'total']], 'triệu lít', W));
    fillTable('tbl-beer-chbridge', ['Bước', 'Triệu lít'], [[`Tổng ${Y0}`, nf(TOT[Y0], 1)], ['Thay đổi mua mang về', sg(dOff, 1)], ['Thay đổi uống tại chỗ', sg(dOn, 1)], [`Tổng ${Y1}`, nf(TOT[Y1], 1)]]);
    pwSrc('chBeerChBridge', SRC_CH, `Cầu nối ${Y0} → ${Y1}: tổng ${Y0} + thay đổi từng kênh = tổng ${Y1}.`);
    insight('chBeerChBridge', `${Y0}–${Y1}, mang về thêm ${nf(dOff, 0)} triệu lít nhưng tại chỗ mất ${nf(-dOn, 0)} triệu lít, nên tổng thị trường giảm ${nf(-(dOff + dOn), 0)} triệu lít: tỷ trọng mang về tăng chủ yếu vì tại chỗ thu hẹp.`);
  }
}

/* ================= Module B: lon, chai, hơi (SẢN XUẤT) ================= */
const PKP = [...new Set(get({metric: 'production'}).map(o => o.period))].sort();
const pk = (p, k) => val({metric: 'production', period: p, product: k});
const SRC_PK = sid({metric: 'production'});
const ICON = {
  can: '<svg viewBox="0 0 40 64" aria-hidden="true"><rect x="7" y="6" width="26" height="54" rx="6" fill="currentColor" opacity=".9"/><rect x="10" y="2" width="20" height="6" rx="2" fill="currentColor" opacity=".55"/><rect x="11" y="22" width="18" height="16" rx="2" fill="#fff" opacity=".85"/></svg>',
  bottle: '<svg viewBox="0 0 40 64" aria-hidden="true"><rect x="16" y="2" width="8" height="8" rx="1.5" fill="currentColor" opacity=".55"/><path d="M16 10h8v8c0 3 8 6 8 14v26a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V32c0-8 8-11 8-14z" fill="currentColor" opacity=".9"/><rect x="11" y="36" width="18" height="12" rx="2" fill="#fff" opacity=".85"/></svg>',
  draft: '<svg viewBox="0 0 48 64" aria-hidden="true"><path d="M8 14h26v42a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4z" fill="currentColor" opacity=".9"/><path d="M34 22h5a5 5 0 0 1 5 5v12a5 5 0 0 1-5 5h-5v-5h4V27h-4z" fill="currentColor" opacity=".7"/><path d="M6 14c0-6 5-9 9-7 2-4 9-4 11 0 4-2 10 1 9 7z" fill="currentColor" opacity=".35"/></svg>'};
function pack() {
  const P1 = PKP.at(-1), P0 = PKP.length > 1 ? PKP.at(-2) : null, lab = p => p.replace(/(\d{4})H1/, '6T/$1');
  const tot = pk(P1, 'total');
  if ($('beerPackTiles')) {
    $('beerPackTiles').innerHTML = `<div class="bm-pack">${['can', 'bottle', 'draft'].map(k => { const v = pk(P1, k), o = get({metric: 'production', period: P1, product: k})[0]; const y = P0 && pk(P0, k) ? chg(pk(P0, k), v) : null;
      return `<div class="bm-pk" style="--c:${PK[k][1]}"><div class="bm-ic" style="color:${PK[k][1]}">${ICON[k]}</div><div><small>${PK[k][0]}</small><b>${nf(v, 0)}<span>triệu lít</span></b>
        <em>${nf(v / tot * 100, 1)}% tổng sản xuất</em><i class="${y >= 0 ? 'up' : 'dn'}">${sg(y, 1)}% so cùng kỳ</i></div></div>`; }).join('')}</div>`;
    fillTable('tbl-beer-pack', ['Chủng loại', lab(P1) + ' (triệu lít)', P0 ? lab(P0) + ' (triệu lít)' : '', 'Tỷ trọng ' + lab(P1) + ' (%)', 'So cùng kỳ (%)', 'Trạng thái'].filter(Boolean),
      ['can', 'bottle', 'draft', 'unclassified', 'total'].map(k => { const v = pk(P1, k), p = P0 ? pk(P0, k) : null, st = get({metric: 'production', period: P0, product: k})[0];
        return [k === 'total' ? 'Tổng' : PK[k][0], nf(v, 1), ...(P0 ? [nf(p, 1)] : []), nf(v / tot * 100, 1), sg(chg(p, v), 1), st?.data_status === 'derived' ? 'cùng kỳ suy từ % tăng' : (k === 'unclassified' ? 'tổng − 3 chủng loại' : 'công bố')]; }));
    pwSrc('beerPackTiles', SRC_PK, `Sản lượng SẢN XUẤT lũy kế ${lab(P1)}, không phải tiêu thụ. Cùng kỳ ${P0 ? lab(P0) : ''} suy ngược từ % tăng công bố. Phần chênh giữa tổng và 3 chủng loại (${nf(pk(P1, 'unclassified'), 1)} triệu lít) để riêng, không phân bổ. Bia lon không đồng nghĩa kênh mang về.`);
  }
  if ($('chBeerPackYoY') && P0) {
    barLineChart('chBeerPackYoY', {categories: ['can', 'bottle', 'draft'].map(k => PK[k][0]), series: [[P0, '#B9C1D0'], [P1, '#2938A8']].map(([p, col]) => ({name: lab(p) + (p === P0 ? ' (suy ra)' : ''), color: col, kind: 'bar', values: ['can', 'bottle', 'draft'].map(k => pk(p, k))})), unit: 'triệu lít', digits: 0, height: 260, ariaLabel: 'Sản xuất theo chủng loại, hai kỳ'});
    legend('chBeerPackYoY', [[lab(P0) + ' (suy ra)', '#B9C1D0'], [lab(P1), '#2938A8']]);
    fillTable('tbl-beer-packyoy', ['Chủng loại', lab(P0), lab(P1), 'So cùng kỳ (%)'], ['can', 'bottle', 'draft'].map(k => [PK[k][0], nf(pk(P0, k), 1), nf(pk(P1, k), 1), sg(chg(pk(P0, k), pk(P1, k)), 1)]));
    sourceLine('chBeerPackYoY', SRC_PK, lab(P1), `Chỉ có hai kỳ lũy kế 6 tháng; chưa có chuỗi năm theo chủng loại nên không vẽ xu hướng dài.`);
    insight('chBeerPackYoY', `Bia lon ${sg(chg(pk(P0, 'can'), pk(P1, 'can')), 1)}%, nhanh hơn bia hơi ${sg(chg(pk(P0, 'draft'), pk(P1, 'draft')), 1)}% và bia chai ${sg(chg(pk(P0, 'bottle'), pk(P1, 'bottle')), 1)}%. Kiểm tiếp số cả năm 2026 và chi phí lon nhôm trong giá vốn SAB, BHN.`);
  }
  if ($('chBeerPackMix')) {
    const parts = ['can', 'bottle', 'draft', 'unclassified'].map(k => [PK[k][0], pk(P1, k), PK[k][1]]).filter(x => fin(x[1]) && x[1] > 0);
    donut('chBeerPackMix', parts, `${nf(tot, 0)}`, 'triệu lít', lab(P1));
    fillTable('tbl-beer-packmix', ['Chủng loại', 'Triệu lít', 'Tỷ trọng (%)'], parts.map(([n, v]) => [n, nf(v, 1), nf(v / tot * 100, 1)]));
    pwSrc('chBeerPackMix', SRC_PK, `Cơ cấu sản xuất ${lab(P1)}; "Chưa phân loại" = tổng − (lon + chai + hơi).`);
  }
}

/* ================= Module C/D: thị phần công ty ================= */
const SRC_TS = sid({metric: 'company_share', market_share_scope: 'total'}), SRC_OS = sid({metric: 'company_share', market_share_scope: 'off_trade'});
const KEYS = ['heineken', 'sabeco', 'carlsberg', 'habeco', 'others'];
function shares() {
  if ($('chBeerShare')) {
    barLineChart('chBeerShare', {categories: TY, series: KEYS.map(k => ({name: CO[k][0], color: CO[k][1], kind: 'line', values: TY.map(y => TS[y][k] ?? null)})), unit: '%', digits: 1, height: 290, zeroBase: true, stackable: true, ariaLabel: 'Thị phần sản lượng từng hãng'});
    legend('chBeerShare', KEYS.map(k => CO[k]));
    fillTable('tbl-beer-share', ['Năm', ...KEYS.map(k => CO[k][0] + ' (%)'), 'CR2 (%)', 'CR4 (%)'], TY.map(y => { const r = KEYS.filter(k => k !== 'others').map(k => TS[y][k]).sort((a, b) => b - a); return [y, ...KEYS.map(k => nf(TS[y][k], 1)), nf(r[0] + r[1], 1), nf(r.slice(0, 4).reduce((a, b) => a + b, 0), 1)]; }));
    sourceLine('chBeerShare', SRC_TS, `${TY[0]}–${TY.at(-1)}`, 'Thị phần theo sản lượng toàn thị trường, tính theo chủ sở hữu thương hiệu (NBO). Không trộn với thị phần kênh mang về hay thị phần doanh thu. Nút Tùy chỉnh đổi sang cột chồng để xem cấu trúc 100%.');
    const a = TS[TY[0]], b = TS[TY.at(-1)];
    insight('chBeerShare', `${TY[0]}–${TY.at(-1)}: Heineken ${sg(b.heineken - a.heineken, 1)} điểm %, Sabeco ${sg(b.sabeco - a.sabeco, 1)}, Carlsberg ${sg(b.carlsberg - a.carlsberg, 1)}, Habeco ${sg(b.habeco - a.habeco, 1)}. Khoảng cách Heineken – Sabeco rộng nhất năm 2022 rồi thu hẹp; kiểm tiếp số ${Number(TY.at(-1)) + 1}.`);
  }
  if ($('chBeerShareChg')) {
    const host = $('chBeerShareChg'), ctl = make('div', 'rf-ctl bm-ctl');
    ctl.innerHTML = `<label>Từ <select data-a>${TY.map(y => `<option${y === TY[0] ? ' selected' : ''}>${y}</option>`).join('')}</select></label><label>đến <select data-b>${TY.map(y => `<option${y === TY.at(-1) ? ' selected' : ''}>${y}</option>`).join('')}</select></label>`;
    host.before(ctl);
    const draw = () => { const a = ctl.querySelector('[data-a]').value, b = ctl.querySelector('[data-b]').value;
      live('chBeerShareChg', W => diverging('chBeerShareChg', KEYS.map(k => [CO[k][0], TS[b][k] - TS[a][k], CO[k][1]]), 'điểm %', `${a} → ${b}`, W));
      fillTable('tbl-beer-sharechg', ['Hãng', a + ' (%)', b + ' (%)', 'Thay đổi (điểm %)'], KEYS.map(k => [CO[k][0], nf(TS[a][k], 1), nf(TS[b][k], 1), sg(TS[b][k] - TS[a][k], 1)])); };
    ctl.addEventListener('change', draw); draw();
    pwSrc('chBeerShareChg', SRC_TS, 'Thay đổi thị phần toàn thị trường theo điểm %, giữa hai năm chọn.');
  }
  if ($('chBeerShareDonut')) {
    const y = TY.at(-1);
    donut('chBeerShareDonut', KEYS.map(k => [CO[k][0], TS[y][k], CO[k][1]]), y, 'toàn thị trường', y, '%');
    fillTable('tbl-beer-sharedonut', ['Hãng', 'Thị phần ' + y + ' (%)'], KEYS.map(k => [CO[k][0], nf(TS[y][k], 1)]));
    pwSrc('chBeerShareDonut', SRC_TS);
  }
  if ($('chBeerSlope')) {
    const host = $('chBeerSlope'), ctl = make('div', 'rf-ctl'), scopes = [['total', 'Toàn thị trường', TS, TY], ['off_trade', 'Mua mang về', OS, OY], ['on_trade', 'Uống tại chỗ', NS, Object.keys(NS).sort()]];
    host.before(ctl);
    const draw = sc => { const [, label, D, Y] = scopes.find(s => s[0] === sc); const a = Y[0], b = Y.at(-1), ks = KEYS.filter(k => fin(D[a]?.[k]) && fin(D[b]?.[k]));
      live('chBeerSlope', W => slope('chBeerSlope', a, b, ks.map(k => [CO[k][0], D[a][k], D[b][k], CO[k][1], k === 'heineken' || k === 'sabeco']), label, W));
      fillTable('tbl-beer-slope', ['Hãng', a + ' (%)', b + ' (%)', 'Thay đổi (điểm %)'], ks.map(k => [CO[k][0], nf(D[a][k], 0), nf(D[b][k], 0), sg(D[b][k] - D[a][k], 0)]));
      card.querySelector('.pw-src')?.remove(); pwSrc('chBeerSlope', sc === 'off_trade' ? SRC_OS : SRC_TS, `${label}: chỉ hai mốc ${a} và ${b} có số; không vẽ các năm giữa.`); };
    const card = host.closest('.card');
    scopes.forEach(([k, l, D, Y], i) => { const b = make('button', 'rf-tog' + (k === 'off_trade' ? ' on' : ''), esc(l)); b.type = 'button'; if (Y.length < 2) { b.disabled = true; b.title = 'Chưa có số thị phần kênh này'; }
      b.addEventListener('click', () => { [...ctl.children].forEach(x => x.classList.toggle('on', x === b)); card.querySelectorAll(':scope > .method-note').forEach(n => n.remove()); draw(k); }); ctl.append(b); });
    draw('off_trade');
    const a = OS[OY[0]], b = OS[OY.at(-1)];
    insight('chBeerSlope', `Kênh mang về chiếm phần lớn tiêu thụ, nhưng Sabeco mất ${nf(a.sabeco - b.sabeco, 0)} điểm % ở chính kênh này (${OY[0]}–${OY.at(-1)}), Heineken thêm ${nf(b.heineken - a.heineken, 0)} điểm % và dẫn ${nf(b.heineken - b.sabeco, 0)} điểm % năm ${OY.at(-1)}. Giả thuyết cần kiểm (chưa xác nhận): danh mục và độ phủ siêu thị, cửa hàng tiện lợi của Heineken; giá bán, khuyến mãi tại điểm bán và cơ cấu thương hiệu của Sabeco; khác biệt phân khúc giá.`);
  }
  if ($('chBeerOffDonut')) {
    const y = OY.at(-1), ks = KEYS.filter(k => fin(OS[y][k]));
    donut('chBeerOffDonut', ks.map(k => [CO[k][0], OS[y][k], CO[k][1]]), y, 'mua mang về', y, '%');
    fillTable('tbl-beer-offdonut', ['Hãng', 'Thị phần kênh mang về ' + y + ' (%)'], ks.map(k => [CO[k][0], nf(OS[y][k], 0)]));
    pwSrc('chBeerOffDonut', SRC_OS, 'Thị phần trong kênh mua mang về, không ghép với chuỗi thị phần toàn thị trường.');
  }
}

/* ================= Module E: thương hiệu ================= */
const SRC_BR = sid({metric: 'brand_share'});
function brands() {
  const y1 = BY.at(-1), rows = BR.filter(o => o.period === y1 && fin(o.value));
  if ($('chBeerTreemap')) {
    const host = $('chBeerTreemap'); let focus = null;
    const draw = () => { const grp = {}; rows.forEach(o => { (grp[o.entity] = grp[o.entity] || []).push(o); });
      const items = focus ? grp[focus].map(o => ({name: o.product, value: o.value, color: CO[o.entity][1], co: o.entity}))
        : Object.entries(grp).map(([k, a]) => ({name: CO[k][0], value: a.reduce((s, o) => s + o.value, 0), color: CO[k][1], co: k, kids: a.slice().sort((x, z) => z.value - x.value)}));
      host.innerHTML = treemap(items.sort((a, b) => b.value - a.value), focus, Math.max(320, Math.min(host.clientWidth || 640, 1100)));
      host.querySelectorAll('[data-co]').forEach(n => n.addEventListener('click', () => { if (focus) return; focus = n.dataset.co; draw(); }));
      host.querySelector('[data-back]')?.addEventListener('click', () => { focus = null; draw(); }); };
    draw();
    fillTable('tbl-beer-treemap', ['Thương hiệu', 'Hãng', 'Thị phần ' + y1 + ' (%)'], rows.slice().sort((a, b) => b.value - a.value).map(o => [o.product, CO[o.entity][0], nf(o.value, 1)]));
    pwSrc('chBeerTreemap', SRC_BR, `Diện tích ô tỷ lệ thị phần sản lượng toàn thị trường ${y1}. Bấm vào một hãng để xem từng thương hiệu. "Khác" gồm các thương hiệu ngoài danh sách (kể cả thương hiệu nhỏ của các hãng lớn), nên tổng thương hiệu của một hãng thấp hơn thị phần hãng.`);
  }
  if ($('chBeerBrandRank')) {
    hbarCompare('chBeerBrandRank', {items: rows.filter(o => o.entity !== 'others').sort((a, b) => b.value - a.value).map(o => ({label: o.product, value: o.value, color: CO[o.entity][1]})), unit: '%', digits: 1, labelW: 150, ariaLabel: 'Thị phần thương hiệu ' + y1});
    legend('chBeerBrandRank', KEYS.filter(k => k !== 'others').map(k => CO[k]));
    pwSrc('chBeerBrandRank', SRC_BR, `Thị phần sản lượng toàn thị trường ${y1}, màu theo hãng sở hữu.`);
  }
  if ($('chBeerBrandChg')) {
    const host = $('chBeerBrandChg'), ctl = make('div', 'rf-ctl bm-ctl');
    ctl.innerHTML = `<label>Từ <select data-a>${BY.map(y => `<option${y === BY[0] ? ' selected' : ''}>${y}</option>`).join('')}</select></label><label>đến <select data-b>${BY.map(y => `<option${y === y1 ? ' selected' : ''}>${y}</option>`).join('')}</select></label>`;
    host.before(ctl);
    const draw = () => { const a = ctl.querySelector('[data-a]').value, b = ctl.querySelector('[data-b]').value, v = (y, br) => BR.find(o => o.period === y && o.product === br)?.value;
      const list = [...new Set(BR.map(o => o.product))].filter(br => br !== 'Others').map(br => [br, v(b, br) - v(a, br), CO[BR.find(o => o.product === br).entity][1]]).filter(x => fin(x[1])).sort((x, z) => z[1] - x[1]);
      live('chBeerBrandChg', W => diverging('chBeerBrandChg', list, 'điểm %', `${a} → ${b}`, W));
      fillTable('tbl-beer-brandchg', ['Thương hiệu', a + ' (%)', b + ' (%)', 'Thay đổi (điểm %)'], list.map(([br, d]) => [br, nf(v(a, br), 1), nf(v(b, br), 1), sg(d, 1)])); };
    ctl.addEventListener('change', draw); draw();
    pwSrc('chBeerBrandChg', SRC_BR, 'Thay đổi thị phần thương hiệu theo điểm %, toàn thị trường.');
    const v = (y, br) => BR.find(o => o.period === y && o.product === br)?.value;
    insight('chBeerBrandChg', `${BY[0]}–${y1}: Tiger ${sg(v(y1, 'Tiger') - v(BY[0], 'Tiger'), 1)} điểm % trong khi Heineken ${sg(v(y1, 'Heineken') - v(BY[0], 'Heineken'), 1)}, Larue ${sg(v(y1, 'Larue') - v(BY[0], 'Larue'), 1)}, Heineken Silver ${sg(v(y1, 'Heineken Silver') - v(BY[0], 'Heineken Silver'), 1)}: Heineken dịch chuyển trong chính danh mục của mình. Ba thương hiệu chính của Sabeco gần như đứng yên. Chưa có số phân khúc giá (phổ thông, trung cấp, cao cấp) từ nguồn công khai nên chưa vẽ cơ cấu theo phân khúc.`);
  }
}

/* ================= Module F: tác động tới doanh nghiệp (kịch bản) ================= */
function impact() {
  const host = $('beerSens'); if (!host) return;
  const y = Y1, off = OFF[y], on = ON[y], t0 = TY[0], o0 = OS[OY[0]] || {};
  // Thị phần tại chỗ của Sabeco suy ra năm có đủ số cùng kỳ (toàn thị trường + kênh mang về + sản lượng kênh)
  const both = OY.filter(p => TS[p] && OFF[p] && ON[p]);
  const pOn = both.length ? both.at(-1) : null, onSab = pOn ? (TS[pOn].sabeco * TOT[pOn] - OS[pOn].sabeco * OFF[pOn]) / ON[pOn] : null;
  const F = [['mk', 'Tổng tiêu thụ toàn thị trường', TOT[y], 'triệu lít', 10], ['offs', 'Tỷ trọng mua mang về', shareOf(y), '%', .5],
    ['coff', 'Thị phần DN ở kênh mang về', OS[OY.at(-1)]?.sabeco, '%', .5], ['con', 'Thị phần DN ở kênh tại chỗ', onSab, '%', .5],
    ['asp', 'Giá bán thuần bình quân', null, 'nghìn đồng/lít', .5], ['cm', 'Biên đóng góp', null, '%', .5]];
  host.innerHTML = `<div class="bm-sens"><div class="bm-in">${F.map(([k, l, v, u, st]) => `<label><span>${esc(l)}</span><span class="bm-iw"><input type="number" step="${st}" data-k="${k}" value="${fin(v) ? Math.round(v * 10) / 10 : ''}" placeholder="nhập"><em>${esc(u)}</em></span></label>`).join('')}
    <label><span>Đổi thị phần kênh mang về</span><span class="bm-iw"><input type="range" min="-10" max="10" step="0.5" value="-1" data-k="d"><em data-dv>−1 điểm %</em></span></label></div>
    <div class="bm-out" aria-live="polite"></div></div>`;
  const out = host.querySelector('.bm-out'), g = k => parseFloat(host.querySelector(`[data-k="${k}"]`).value);
  const calc = () => { const mk = g('mk'), offs = g('offs') / 100, coff = g('coff') / 100, con = g('con') / 100, asp = g('asp'), cm = g('cm') / 100, d = g('d') / 100;
    host.querySelector('[data-dv]').textContent = sg(d * 100, 1) + ' điểm %';
    const vOff = mk * offs, vOn = mk * (1 - offs), base = vOff * coff + vOn * con, scen = vOff * (coff + d) + vOn * con, dv = scen - base;
    const rev = fin(asp) ? dv * asp / 1000 : null, prof = fin(rev) && fin(cm) ? rev * cm : null;
    out.innerHTML = [['Sản lượng DN (gốc)', nf(base, 0), 'triệu lít'], ['Sản lượng DN (kịch bản)', nf(scen, 0), 'triệu lít'], ['Thay đổi sản lượng', sg(dv, 1), 'triệu lít'],
      ['Tác động doanh thu', fin(rev) ? sg(rev, 0) : 'nhập giá bán', fin(rev) ? 'tỷ đồng' : ''], ['Tác động lợi nhuận đóng góp', fin(prof) ? sg(prof, 0) : 'nhập giá bán, biên', fin(prof) ? 'tỷ đồng' : '']]
      .map(([l, v, u]) => `<div><small>${l}</small><b>${v}<span>${u}</span></b></div>`).join(''); };
  host.addEventListener('input', calc); calc();
  fillTable('tbl-beer-sens', ['Đầu vào mặc định', 'Giá trị', 'Kỳ, nguồn'], [['Tổng tiêu thụ', nf(TOT[y], 1) + ' triệu lít', y + ', Euromonitor'], ['Tỷ trọng mang về', nf(shareOf(y), 1) + '%', y + ', tự tính'],
    ['Thị phần Sabeco kênh mang về', nf(OS[OY.at(-1)]?.sabeco, 0) + '%', OY.at(-1) + ', Euromonitor'], ['Thị phần Sabeco kênh tại chỗ', nf(onSab, 1) + '%', pOn ? `${pOn}, suy ra: (thị phần toàn thị trường × tổng − thị phần mang về × mang về) ÷ tại chỗ` : 'chưa đủ số cùng kỳ'],
    ['Giá bán thuần, biên đóng góp', 'để trống', 'người dùng nhập']]);
  pwSrc('beerSens', [...SRC_CH, ...SRC_OS, ...SRC_TS], `Phân tích kịch bản, không phải số thực tế hay dự báo. Sản lượng DN = tiêu thụ mang về × thị phần mang về + tiêu thụ tại chỗ × thị phần tại chỗ. Mặc định trộn kỳ (${y} cho thị trường, ${OY.at(-1)} cho thị phần mang về, ${pOn || '—'} cho thị phần tại chỗ suy ra) nên chỉ dùng để thấy độ nhạy: với ${nf(off, 0)} triệu lít mang về, mỗi 1 điểm % thị phần ≈ ${nf(off / 100, 0)} triệu lít. Doanh nghiệp sản xuất thuê (SMB, HAD) không dùng thị phần thương hiệu.`);
}

/* ================= Vẽ SVG riêng ================= */
function waterfall(id, steps, unit, W = 640) {
  const host = $(id); if (!host) return; const H = 280, pl = 56, pr = 14, pt = 24, pb = 44;
  let run = 0; const bars = steps.map(([l, v, k]) => { const a = k === 'total' ? 0 : run, b = k === 'total' ? v : run + v; run = k === 'total' ? v : run + v; return {l, v, k, a, b}; });
  const max = Math.max(...bars.map(b => Math.max(b.a, b.b))) * 1.08, X = i => pl + i * (W - pl - pr) / bars.length, bw = (W - pl - pr) / bars.length * .56, Y = v => pt + (1 - v / max) * (H - pt - pb);
  const ticks = [0, .25, .5, .75, 1].map(f => max * f);
  host.innerHTML = `<svg class="bm-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Cầu nối sản lượng">${ticks.map(t => `<line x1="${pl}" x2="${W - pr}" y1="${Y(t)}" y2="${Y(t)}" class="g"/><text x="${pl - 6}" y="${Y(t) + 4}" text-anchor="end">${nf(t, 0)}</text>`).join('')}
    ${bars.map((b, i) => { const x = X(i) + ((W - pl - pr) / bars.length - bw) / 2, y = Y(Math.max(b.a, b.b)), h = Math.abs(Y(b.a) - Y(b.b)), col = b.k === 'total' ? '#3D4352' : b.v >= 0 ? '#1a7a50' : '#b3303f';
      return `<rect x="${x}" y="${y}" width="${bw}" height="${Math.max(1, h)}" fill="${col}" rx="2"><title>${esc(b.l)}: ${b.k === 'total' ? nf(b.v, 1) : sg(b.v, 1)} ${unit}</title></rect>
      <text x="${x + bw / 2}" y="${y - 6}" text-anchor="middle" class="v">${b.k === 'total' ? nf(b.v, 0) : sg(b.v, 0)}</text><text x="${x + bw / 2}" y="${H - pb + 18}" text-anchor="middle">${esc(b.l)}</text>`; }).join('')}
    <text x="${pl}" y="12" class="u">${esc(unit)}</text></svg>`;
}
function donut(id, parts, center, centerSub, period, unit) {
  const host = $(id); if (!host) return; const tot = parts.reduce((a, p) => a + p[1], 0), R = 80, r = 50, C = 100; let a0 = -Math.PI / 2;
  const arcs = parts.map(([n, v, col]) => { const a1 = a0 + 2 * Math.PI * v / tot, big = a1 - a0 > Math.PI ? 1 : 0, p = (rad, a) => [C + rad * Math.cos(a), C + rad * Math.sin(a)];
    const [x0, y0] = p(R, a0), [x1, y1] = p(R, a1), [x2, y2] = p(r, a1), [x3, y3] = p(r, a0); a0 = a1;
    return `<path d="M${x0},${y0}A${R},${R} 0 ${big} 1 ${x1},${y1}L${x2},${y2}A${r},${r} 0 ${big} 0 ${x3},${y3}Z" fill="${col}"><title>${esc(n)}: ${nf(v, 1)}${unit === '%' ? '%' : ' ' + (unit || 'triệu lít')} (${nf(v / tot * 100, 1)}%)</title></path>`; }).join('');
  host.innerHTML = `<div class="bm-donut"><svg viewBox="0 0 200 200" role="img" aria-label="Cơ cấu ${esc(period)}">${arcs}<text x="100" y="98" text-anchor="middle" class="c">${esc(center)}</text><text x="100" y="116" text-anchor="middle" class="cs">${esc(centerSub)}</text></svg>
    <ul>${parts.map(([n, v, col]) => `<li><i style="background:${col}"></i>${esc(n)}<b>${nf(v / tot * 100, 1)}%</b></li>`).join('')}</ul></div>`;
}
function diverging(id, items, unit, period, W = 640) {
  const host = $(id); if (!host) return; const rh = 30, pl = Math.min(150, W * .3), pr = 60, H = items.length * rh + 24, m = Math.max(1, ...items.map(x => Math.abs(x[1]))), mid = pl + (W - pl - pr) / 2, sc = (W - pl - pr) / 2 / m;
  host.innerHTML = `<svg class="bm-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Thay đổi ${esc(period)}"><line x1="${mid}" x2="${mid}" y1="4" y2="${H - 16}" class="z"/>
    ${items.map(([n, v, col], i) => { const y = 8 + i * rh, w = Math.abs(v) * sc, x = v >= 0 ? mid : mid - w; return `<text x="${pl - 8}" y="${y + 15}" text-anchor="end">${esc(n)}</text>
      <rect x="${x}" y="${y + 3}" width="${Math.max(1, w)}" height="${rh - 12}" rx="3" fill="${col}" opacity="${v >= 0 ? 1 : .75}"><title>${esc(n)}: ${sg(v, 1)} ${unit}</title></rect>
      <text x="${v >= 0 ? x + w + 6 : mid + 6}" y="${y + 15}" text-anchor="start" class="v">${sg(v, 1)}</text>`; }).join('')}
    <text x="${W - pr}" y="${H - 2}" text-anchor="end" class="u">${esc(unit)} · ${esc(period)}</text></svg>`;
}
function slope(id, a, b, rows, label, W = 640) {
  const host = $(id); if (!host) return; const H = 330, xa = W * .3, xb = W * .66, pt = 36, pb = 20, max = Math.max(...rows.flatMap(r => [r[1], r[2]])) * 1.1, Y = v => pt + (1 - v / max) * (H - pt - pb);
  host.innerHTML = `<svg class="bm-svg bm-slope" viewBox="0 0 ${W} ${H}" role="img" aria-label="Thị phần ${esc(label)} ${a} và ${b}">
    <line x1="${xa}" x2="${xa}" y1="${pt - 8}" y2="${H - pb}" class="g"/><line x1="${xb}" x2="${xb}" y1="${pt - 8}" y2="${H - pb}" class="g"/>
    <text x="${xa}" y="18" text-anchor="middle" class="h">${a}</text><text x="${xb}" y="18" text-anchor="middle" class="h">${b}</text>
    ${rows.map(([n, v0, v1, col, hi]) => `<g opacity="${hi ? 1 : .55}"><line x1="${xa}" x2="${xb}" y1="${Y(v0)}" y2="${Y(v1)}" stroke="${col}" stroke-width="${hi ? 4 : 2}"/><circle cx="${xa}" cy="${Y(v0)}" r="${hi ? 6 : 4}" fill="${col}"/><circle cx="${xb}" cy="${Y(v1)}" r="${hi ? 6 : 4}" fill="${col}"/>
      <text x="${xa - 12}" y="${Y(v0) + 4}" text-anchor="end" class="${hi ? 'l' : ''}">${esc(n)} ${nf(v0, 0)}%</text><text x="${xb + 12}" y="${Y(v1) + 4}" class="${hi ? 'l' : ''}">${nf(v1, 0)}% (${sg(v1 - v0, 0)})</text></g>`).join('')}
    <text x="${W / 2}" y="${H - 2}" text-anchor="middle" class="u">${esc(label)} · % sản lượng</text></svg>`;
}
// Treemap dạng cắt lát xen kẽ (đủ cho ≤ 12 ô)
function treemap(items, focus, W = 640) {
  const H = 340, tot = items.reduce((a, x) => a + x.value, 0), out = [];
  (function lay(list, x, y, w, h, s) { if (!list.length) return; if (list.length === 1) { out.push({...list[0], x, y, w, h}); return; }
    const half = s / 2; let acc = 0, i = 0; while (i < list.length - 1 && acc + list[i].value <= half) acc += list[i++].value; if (i === 0) { acc = list[0].value; i = 1; }
    const A = list.slice(0, i), B = list.slice(i), f = acc / s;
    if (w >= h) { lay(A, x, y, w * f, h, acc); lay(B, x + w * f, y, w * (1 - f), h, s - acc); } else { lay(A, x, y, w, h * f, acc); lay(B, x, y + h * f, w, h * (1 - f), s - acc); } })(items, 0, 0, W, H, tot);
  return `${focus ? `<button type="button" class="rf-tog bm-back" data-back>← Tất cả các hãng</button>` : ''}<svg class="bm-svg bm-tree" viewBox="0 0 ${W} ${H}" role="img" aria-label="Thị phần theo hãng và thương hiệu">${out.map(r => `<g ${focus ? '' : `data-co="${r.co}" style="cursor:pointer"`}><rect x="${r.x + 1}" y="${r.y + 1}" width="${Math.max(0, r.w - 2)}" height="${Math.max(0, r.h - 2)}" rx="4" fill="${r.color}" opacity="${focus ? .85 : 1}"><title>${esc(r.name)}: ${nf(r.value, 1)}%${r.kids ? ' · ' + r.kids.map(k => k.product + ' ' + nf(k.value, 1) + '%').join(', ') : ''}</title></rect>
    ${r.w > 60 && r.h > 34 ? `<text x="${r.x + 10}" y="${r.y + 22}" class="t">${esc(r.name)}</text><text x="${r.x + 10}" y="${r.y + 40}" class="tv">${nf(r.value, 1)}%</text>` : ''}
    ${!focus && r.kids && r.h > 90 ? `<text x="${r.x + 10}" y="${r.y + 60}" class="tk">${esc(r.kids.slice(0, 3).map(k => k.product).join(' · '))}</text>` : ''}</g>`).join('')}</svg>`;
}

/* ================= Chuỗi tác động + luận điểm ================= */
function flow() {
  const host = $('beerFlow'); if (!host) return;
  const S = [['Quy mô thị trường', 'tổng tiêu thụ', '#rf-q-channel'], ['Cơ cấu kênh', 'mang về · tại chỗ', '#rf-q-channel'], ['Thị phần theo kênh', 'Heineken · Sabeco…', '#rf-q-offshare'],
    ['Sản lượng doanh nghiệp', 'SAB · BHN', '#rf-q-impact'], ['Giá bán & cơ cấu', 'lon · chai · hơi; phân khúc', '#rf-q-pack'], ['Doanh thu', '', '#rf-q-rev'], ['Lợi nhuận gộp', 'bao bì, malt, thuế TTĐB', '#rf-q-gm'],
    ['Chi phí bán hàng', 'khuyến mãi tại điểm bán', '#rf-q-gm'], ['Lợi nhuận hoạt động', '', '#rf-q-compare']];
  host.className = 'bm-flow';
  host.innerHTML = S.map(([t, d, a], i) => `${i ? '<span class="bm-ar" aria-hidden="true">→</span>' : ''}<a class="bm-step" href="${a}"><small>${i + 1}</small><b>${esc(t)}</b><span>${esc(d)}</span></a>`).join('');
  pwSrc('beerFlow', [...SRC_CH, ...SRC_OS], 'Thứ tự tác động dùng để đọc các chart trong tab; bấm từng bước để tới chart liên quan.');
}
function thesis() {
  const host = $('beerThesis'); if (!host) return;
  const o0 = OS[OY[0]], o1 = OS[OY.at(-1)], P1 = PKP.at(-1), can = pk(P1, 'can'), tot = pk(P1, 'total'), P0 = PKP.at(-2);
  const T = [
    ['Mua mang về thành kênh chính, nhưng tổng cầu chưa về mức 2019', [`Mang về ${nf(shareOf(Y1), 1)}% sản lượng ${Y1} (${Y0}: ${nf(shareOf(Y0), 1)}%)`, `Tổng tiêu thụ ${Y1} ${sg(chg(TOT[Y0], TOT[Y1]), 1)}% so với ${Y0}; tại chỗ ${sg(chg(ON[Y0], ON[Y1]), 1)}%`],
      'Sản lượng SAB, BHN phụ thuộc vị thế ở siêu thị, cửa hàng tiện lợi, tạp hóa hơn là quán; chi phí bán hàng dịch sang khuyến mãi tại điểm bán.', `Số Euromonitor năm ${Number(Y1) + 1}; tỷ trọng mang về có vượt vùng 60% không.`, '#rf-q-channel'],
    ['Heineken giành thị phần ngay ở kênh mang về', [`Kênh mang về: Heineken ${nf(o0.heineken, 0)}% → ${nf(o1.heineken, 0)}%, Sabeco ${nf(o0.sabeco, 0)}% → ${nf(o1.sabeco, 0)}% (${OY[0]}–${OY.at(-1)})`, `Toàn thị trường ${TY.at(-1)}: Heineken ${nf(TS[TY.at(-1)].heineken, 1)}%, Sabeco ${nf(TS[TY.at(-1)].sabeco, 1)}%`],
      `Với ${nf(OFF[Y1], 0)} triệu lít mang về, mỗi 1 điểm % thị phần kênh này ≈ ${nf(OFF[Y1] / 100, 0)} triệu lít sản lượng.`, 'Giả thuyết chưa xác nhận: danh mục, độ phủ bán lẻ, giá và khuyến mãi tại điểm bán, phân khúc giá.', '#rf-q-offshare'],
    ['Bia lon dẫn tăng trưởng sản xuất', [`Bia lon ${nf(can / tot * 100, 0)}% sản xuất 6T/${P1.slice(0, 4)}, ${sg(chg(pk(P0, 'can'), can), 1)}% so cùng kỳ`, `Bia chai ${sg(chg(pk(P0, 'bottle'), pk(P1, 'bottle')), 1)}%, bia hơi ${sg(chg(pk(P0, 'draft'), pk(P1, 'draft')), 1)}%`],
      'Cơ cấu nghiêng về lon đẩy chi phí lon nhôm, công suất đóng lon, vốn đầu tư chuyển đổi; giảm chi phí thu hồi vỏ chai. Không mặc định lon có biên cao hơn chai.', 'Giá vốn trên lít, giá nhôm, tỷ lệ dùng công suất dây chuyền lon của SAB, BHN.', '#rf-q-pack'],
    ['Thuế tiêu thụ đặc biệt tăng 5 điểm %/năm tới 2031', ['Bia 65% năm 2026, 70% năm 2027, 90% năm 2031'],
      'Mỗi bậc thuế buộc chọn giữa tăng giá (mất sản lượng) và giữ giá (mất biên); hãng có thương hiệu cao cấp mạnh dễ chuyển giá hơn.', 'Giá bán lẻ và sản lượng tháng 1–2/2027; biên gộp quý I/2027.', '#rf-q-sintax']];
  host.innerHTML = `<div class="bm-thesis">${T.map(([h, facts, imp, chk, a], i) => `<article><header><span>${i + 1}</span><h4>${esc(h)}</h4></header>
    <ul>${facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul><p><b>Tác động:</b> ${esc(imp)}</p><p class="bm-chk"><b>Cần kiểm:</b> ${esc(chk)}</p><a href="${a}">Xem chart →</a></article>`).join('')}</div>`;
  pwSrc('beerThesis', [...SRC_CH, ...SRC_TS, ...SRC_OS, ...SRC_PK]);
}

function run() { [kpis, channel, pack, shares, brands, impact, flow, thesis].forEach(f => { try { f(); } catch (e) { console.warn('beer-market', f.name, e); } }); }
run();
window.BeerMarket = {data: M};
})();
