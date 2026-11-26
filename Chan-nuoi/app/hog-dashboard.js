/* Chăn nuôi heo · các khối chuyên sâu (26/11/2026): giá heo ba miền theo ngày, độ rộng theo tỉnh, ngô – khô đậu Pink Sheet,
   tổng đàn – xuất chuồng – nhập khẩu HS 0203 (quan sát có kiểm), mô phỏng kinh tế một con heo, góc nhìn BAF / DBC / MML.
   Dữ liệu: window.LIVESTOCK_DATA (scripts/build_livestock_public.py), window.COMPANY_QUARTERLY. Vẽ bằng barLineChart/fillTable của trang.
   Quy ước: màu ba miền cố định (Bắc navy, Trung vàng, Nam xanh lá); chuỗi tự tổng hợp từ giá tỉnh dùng trung vị/bình quân
   không trọng số và ghi mẫu số; kỳ thiếu để null; nhận định tự tính từ số đang hiển thị (quan sát → hệ quả → kiểm chứng tiếp). */
(() => {
'use strict';
const D = window.LIVESTOCK_DATA; if (!D || document.body.dataset.pkg !== 'livestock') return;
const $ = id => document.getElementById(id);
const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const nf = (v, d = 0) => Number.isFinite(v) ? v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}) : '—';
const sg = (v, d = 1) => Number.isFinite(v) ? (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), d) : '—';
const dm = d => d.slice(8, 10) + '/' + d.slice(5, 7);
const dmy = d => d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4);
const my = m => 'T' + Number(m.slice(5, 7)) + '/' + m.slice(2, 4);
const addDays = (d, n) => { const t = new Date(d + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
const avg = a => { const v = a.filter(Number.isFinite); return v.length ? v.reduce((x, y) => x + y, 0) / v.length : null; };
const median = a => { const v = a.filter(Number.isFinite).sort((x, y) => x - y); if (!v.length) return null; const h = v.length >> 1; return v.length % 2 ? v[h] : (v[h - 1] + v[h]) / 2; };
const REG = {bac: ['Miền Bắc', '#2938A8'], trung: ['Miền Trung', '#c29100'], nam: ['Miền Nam', '#27af95']};
const SRC = {
  bht: ['Báo Hà Tĩnh – Giá lợn hôm nay', 'https://baohatinh.vn/cong-cu/gia-lon-hom-nay'],
  wb: ['World Bank Pink Sheet', D.pinksheet?.page || 'https://www.worldbank.org/en/research/commodity-markets'],
  sbv: ['NHNN tỷ giá trung tâm', 'https://sbv.gov.vn/vi/t%E1%BB%B7-gi%C3%A1-trung-t%C3%A2m'],
  wi: ['WiData', 'https://widata.vn/'], nso: ['Cục Thống kê (NSO)', 'https://www.nso.gov.vn/category/nong-lam-nghiep-va-thuy-san/'],
  moit: ['Bộ Công Thương – Bản tin thị trường nông, lâm, thủy sản', 'https://moit.gov.vn/tin-tuc/ban-tin-thi-truong-nong-lam-thuy-san'],
  cq: ['BCTC hợp nhất quý (data/company-quarterly.js)', 'https://stockanalysis.com/'],
  vcbs: ['VCBS – Báo cáo ngành chăn nuôi heo 11/05/2023 (tr. 5)', '#cn-s1']};

/* ---------- tiện ích thẻ ---------- */
function srcLine(id, parts, period, note) {
  const host = $(id); if (!host) return; const card = host.closest('.card'); if (!card) return;
  card.querySelectorAll(':scope>.hd-src,:scope>.hd-note').forEach(n => n.remove());
  const n = make('div', 'source-note cadence-note hd-src'); n.append('Nguồn: ');
  parts.map(p => typeof p === 'string' ? SRC[p] : p).filter(Boolean).forEach(([name, url], i) => { if (i) n.append(' · '); const a = make('a', '', name); a.href = url; if (!url.startsWith('#')) { a.target = '_blank'; a.rel = 'noopener'; } n.append(a); });
  if (period) n.append(' · Kỳ mới nhất: ' + period);
  const anchor = card.querySelector(':scope>details.dtable') || null; anchor ? anchor.before(n) : card.append(n);
  if (note) n.after(make('div', 'source-note method-note hd-note', note));
  card.dataset.refreshStatus = 'loaded';
}
function insight(id, html) {
  const card = $(id)?.closest('.card'); if (!card) return; card.querySelector(':scope>.chart-insight')?.remove();
  if (!html) return; const n = make('div', 'chart-insight'); n.dataset.inputOwner = 'data'; n.innerHTML = html; (card.querySelector(':scope>.hd-src') || card.lastChild).before(n);
}
function legend(id, items) { const host = $(id); if (!host) return; host.parentElement.querySelector(`:scope>.legend[data-for="${id}"]`)?.remove(); const l = make('div', 'legend'); l.dataset.for = id; items.forEach(([n, c, dash]) => { const s = make('span', 'li'), d = make('span', 'dot'); d.style.background = c; if (dash) d.style.opacity = .5; s.append(d, n); l.append(s); }); host.after(l); }
function seg(id, opts, fn, cls = '') {
  const host = $(id); if (!host) return; const bar = make('div', 'rf-ctl hd-ctl ' + cls); host.before(bar);
  opts.forEach(([v, l], i) => { const b = make('button', 'rf-tog' + (i ? '' : ' on'), l); b.type = 'button'; b.dataset.v = v; b.addEventListener('click', () => { [...bar.children].forEach(x => x.classList.toggle('on', x === b)); fn(v); }); bar.append(b); });
  return bar;
}
// "Chi tiết dữ liệu" → Tải CSV đúng bảng đang hiển thị (theo bộ lọc hiện tại) + dòng đơn vị, kỳ, trạng thái, nguồn.
function csv(tableId, meta) {
  const t = $(tableId), det = t?.closest('details'); if (!t || !det || det.querySelector('.hd-csv')) return;
  const a = make('a', 'hd-csv', 'Tải CSV'); a.href = '#'; a.setAttribute('role', 'button');
  a.addEventListener('click', e => {
    e.preventDefault();
    const m = typeof meta === 'function' ? meta() : meta, q = v => /[",\n;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    const rows = [...t.querySelectorAll('tr')].map(r => [...r.children].map(c => q(c.textContent.trim())).join(','));
    const head = Object.entries(m).map(([k, v]) => '# ' + k + ': ' + v);
    const blob = new Blob(['﻿' + head.concat(rows).join('\n')], {type: 'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob), dl = make('a'); dl.href = url; dl.download = (m.file || tableId) + '.csv'; document.body.append(dl); dl.click(); dl.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  det.querySelector('summary').after(a);
}

/* ---------- 1. Giá heo ba miền (nguồn chính) ---------- */
const H = D.hog?.series || {};
const pts = k => (H[k]?.points || []);
const regionKeys = Object.keys(REG).filter(k => pts('region:' + k).length);
const provs = Object.entries(H).filter(([k]) => k.startsWith('prov:')).map(([k, s]) => ({k, ...s, map: Object.fromEntries(s.points)}))
  .sort((a, b) => Object.keys(REG).indexOf(a.region) - Object.keys(REG).indexOf(b.region) || a.name.localeCompare(b.name, 'vi'));
const days = [...new Set(regionKeys.flatMap(k => pts('region:' + k).map(p => p[0])))].sort();
const lastDay = days.at(-1);
const rmap = k => Object.fromEntries(pts('region:' + k));
// Bình quân 7 ngày: cần đủ 7 ngày lịch có số (ngày thiếu → null, không nội suy).
const ma7 = (m, d) => { const v = []; for (let i = 0; i < 7; i++) { const x = m[addDays(d, -i)]; if (!Number.isFinite(x)) return null; v.push(x); } return avg(v); };
const qStart = d => d.slice(0, 5) + String(Math.floor((Number(d.slice(5, 7)) - 1) / 3) * 3 + 1).padStart(2, '0') + '-01';
const qLabel = d => 'Q' + (Math.floor((Number(d.slice(5, 7)) - 1) / 3) + 1) + '/' + d.slice(0, 4);
// Bình quân từ đầu quý chỉ khi chuỗi phủ từ ngày đầu quý; so sánh cùng số ngày đã qua của quý trước / cùng kỳ năm trước.
function qtd(m, d) {
  const s = qStart(d); if (!m[s] && !Object.keys(m).some(x => x <= s)) return null;
  const n = Math.round((Date.parse(d) - Date.parse(s)) / 864e5) + 1, cur = []; for (let i = 0; i < n; i++) cur.push(m[addDays(s, i)]);
  const back = (y, mo) => { const st = new Date(Date.UTC(y, mo, 1)).toISOString().slice(0, 10), a = []; for (let i = 0; i < n; i++) a.push(m[addDays(st, i)]); return a.filter(Number.isFinite).length >= n * .8 ? avg(a) : null; };
  const y = +s.slice(0, 4), mo = +s.slice(5, 7) - 1;
  return {from: s, n, value: avg(cur), prevQ: back(mo ? y : y - 1, mo ? mo - 3 : 9), prevY: back(y - 1, mo)};
}

function priceKpis() {
  const host = $('cn-kpi-hog'); if (!host || !lastDay) return;
  host.replaceChildren(...regionKeys.map(k => {
    const m = rmap(k), v = m[lastDay], w = m[addDays(lastDay, -7)], a7 = ma7(m, lastDay), q = qtd(m, lastDay), all = Object.values(m), from = Object.keys(m)[0];
    const c = make('div', 'kpi hd-kpi'); c.style.setProperty('--hd-c', REG[k][1]);
    c.innerHTML = `<div class="label">${REG[k][0]}</div><div class="value">${nf(v / 1000, 1)}<span class="unit">nghìn đ/kg</span></div>`
      + `<div class="delta">${Number.isFinite(w) ? sg((v - w) / 1000, 1) + ' nghìn so với ' + dm(addDays(lastDay, -7)) + ' (' + sg((v / w - 1) * 100, 1) + '%)' : ''}</div>`
      + `<div class="sub">${dmy(lastDay)} · BQ 7 ngày ${nf(a7 / 1000, 1)}`
      + (q ? ` · BQ ${qLabel(lastDay)} ${nf(q.value / 1000, 1)}${q.prevQ ? ' (quý trước cùng ' + q.n + ' ngày ' + nf(q.prevQ / 1000, 1) + ')' : ''}` : ` · BQ ${dm(from)}–${dm(lastDay)} ${nf(avg(all) / 1000, 1)}`) + '</div>';
    return c;
  }));
}

// Bản tin dữ liệu đầu trang (stock-dom.js lấy 4 ô KPI đầu tiên): thay bằng giá ba miền + P/E rổ để 30 giây đầu trả lời "giá heo đang ở đâu".
function brief() {
  const db = $('dataBrief'), r = db?.querySelector('.db-r'); if (!lastDay) return;
  if (!r || r.querySelector('.hd-db')) { if (!r && !brief.wait) { brief.wait = 1; window.addEventListener('rf:frame', brief, {once: true}); setTimeout(brief, 1500); } return; }
  const cells = regionKeys.map(k => { const m = rmap(k), v = m[lastDay], w = m[addDays(lastDay, -7)], ser = days.slice(-30).map(d => m[d]).filter(Number.isFinite);
    const lo = Math.min(...ser), hi = Math.max(...ser), X = i => 2 + i * 196 / Math.max(1, ser.length - 1), Y = v2 => 26 - (v2 - lo) / ((hi - lo) || 1) * 22;
    const c = make('div', 'db-c card hd-db'); c.style.setProperty('--hd-c', REG[k][1]);
    c.innerHTML = `<div class="db-ch">Heo hơi · ${REG[k][0]}</div><div class="db-v">${nf(v / 1000, 1)}<span class="db-u">nghìn đ/kg</span></div><div class="db-s">${dmy(lastDay)} · ${Number.isFinite(w) ? sg((v / w - 1) * 100, 1) + '% so với ' + dm(addDays(lastDay, -7)) : ''} · BQ 7 ngày ${nf(ma7(m, lastDay) / 1000, 1)}${(q => q ? ' · BQ ' + qLabel(lastDay) + ' ' + nf(q.value / 1000, 1) + (q.prevQ ? ' (quý trước cùng ' + q.n + ' ngày ' + nf(q.prevQ / 1000, 1) + ')' : '') : ' · BQ ' + dm(Object.keys(m)[0]) + '–' + dm(lastDay) + ' ' + nf(avg(Object.values(m)) / 1000, 1))(qtd(m, lastDay))}</div>`
      + `<svg class="hd-db-sp" viewBox="0 0 200 30" preserveAspectRatio="none" aria-hidden="true"><path d="${ser.map((x, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(x).toFixed(1)).join('')}" fill="none" stroke="${REG[k][1]}" stroke-width="2"/></svg>`;
    return c; });
  const pe = [...r.children].find(c => /P\/E/.test(c.textContent));
  r.replaceChildren(...cells, ...(pe ? [pe] : []));
}
function hogMain() {
  if (!$('chHog3') || !days.length) return;
  let mode = 'ma';
  const draw = () => {
    const ds = days;
    const series = regionKeys.map(k => { const m = rmap(k); return {name: REG[k][0], color: REG[k][1], kind: 'line', values: ds.map(d => mode === 'ma' ? (ma7(m, d) ?? null) : (m[d] ?? null)).map(v => v == null ? null : Math.round(v) / 1000)}; });
    barLineChart('chHog3', {categories: ds.map(dmy), tickLabels: ds.map(dm), series, unit: 'nghìn đ/kg', digits: 1, height: 280, zeroBase: false, rotateLabels: true});
    fillTable('tbl-hog3', ['Ngày', ...regionKeys.flatMap(k => [REG[k][0] + ' (đ/kg)', 'BQ 7 ngày'])], ds.slice().reverse().map(d => [dmy(d), ...regionKeys.flatMap(k => { const m = rmap(k); return [nf(m[d]), nf(ma7(m, d))]; })]));
  };
  seg('chHog3', [['ma', 'Bình quân 7 ngày'], ['day', 'Giá ngày']], v => { mode = v; draw(); });
  // Khoảng thời gian: dùng ô "Số kỳ" của khung chart (liệt kê theo độ dài chuỗi thật; kho lưu dài thêm thì tự có thêm lựa chọn).
  draw(); legend('chHog3', regionKeys.map(k => REG[k]));
  const hb = D.hog.sources?.baohatinh;
  srcLine('chHog3', ['bht'], dmy(lastDay), 'Giá heo hơi tại chuồng. "Bình quân miền" do nguồn công bố (bình quân không trọng số các tỉnh của miền trên trang nguồn). Bình quân 7 ngày = trung bình 7 ngày lịch liên tiếp; thiếu ngày thì để trống. Nguồn giữ 30 ngày gần nhất; FinSuccess lưu nối tiếp từ 26/11/2026 (scripts/fetch_hog_prices.py, mỗi lượt cập nhật 07:30 và 15:30).');
  csv('tbl-hog3', () => ({file: 'gia-heo-3-mien', 'Đơn vị': 'đ/kg', 'Kỳ': dmy(days[0]) + '–' + dmy(lastDay), 'Trạng thái': 'tham chiếu thị trường', 'Nguồn': SRC.bht.join(' ')}));
  // Nhận định: giá 7 ngày + độ rộng (xem breadth()).
  const ch = regionKeys.map(k => { const m = rmap(k), a = ma7(m, lastDay), b = ma7(m, addDays(lastDay, -7)); return [k, a, b, a && b ? (a / b - 1) * 100 : null]; });
  const br = breadthSeries().at(-1);
  if (ch.every(x => Number.isFinite(x[3]))) {
    const up = ch.filter(x => x[3] > 0).length, wide = br && br.up / br.n >= .7;
    insight('chHog3', `<b>Quan sát:</b> BQ 7 ngày đến ${dm(lastDay)} ${ch.map(([k, , , p]) => REG[k][0].replace('Miền ', '') + ' ' + sg(p, 1) + '%').join(', ')} so với 7 ngày trước`
      + (br ? `; ${br.up}/${br.n} tỉnh có giá cao hơn 7 ngày trước` : '') + '. '
      + `<b>Hệ quả:</b> ${up === ch.length && wide ? 'nhịp tăng đang lan rộng — khớp giả thuyết thắt cung nếu xuất chuồng kỳ tới chậm lại; giá bán thực nhận quý IV của BAF, DBC có cơ sở cải thiện'
        : up === ch.length ? 'bình quân 7 ngày còn cao hơn tuần trước nhưng giá ngày đã quay đầu ở đa số tỉnh — nhịp tăng hụt hơi, nghiêng về hồi theo mùa/cục bộ hơn là thắt cung'
        : up === 0 ? (br && br.dn / br.n >= .7 ? 'giá giảm ở cả ba miền và đa số tỉnh — áp lực lên giá bán thực nhận và biên gộp mảng heo' : 'bình quân giảm ở cả ba miền nhưng chưa lan ra đa số tỉnh')
        : 'diễn biến khác nhau giữa các miền — chưa đủ dấu hiệu thắt cung trên diện rộng'}. `
      + `<b>Kiểm chứng tiếp:</b> độ rộng theo tỉnh 1–2 tuần tới và sản lượng xuất chuồng quý IV (NSO, đầu tháng 1/2027).`);
  }
}

/* ---------- 2. Độ rộng theo tỉnh ---------- */
// Tỷ lệ tỉnh tăng giá so với 7 ngày trước, tính trên tập tỉnh có giá ở CẢ hai ngày (mẫu số n hiển thị).
function breadthSeries() {
  return days.map(d => { const b = addDays(d, -7); let up = 0, dn = 0, n = 0; provs.forEach(p => { const x = p.map[d], y = p.map[b]; if (!Number.isFinite(x) || !Number.isFinite(y)) return; n++; if (x > y) up++; else if (x < y) dn++; }); return {d, up, dn, n}; }).filter(r => r.n);
}
function breadth() {
  if (!$('chBreadth')) return; const rs = breadthSeries(); if (!rs.length) return;
  barLineChart('chBreadth', {categories: rs.map(r => dmy(r.d)), tickLabels: rs.map(r => dm(r.d)), series: [{name: 'Tỉnh tăng giá', color: '#27af95', values: rs.map(r => Math.round(r.up / r.n * 1000) / 10)}, {name: 'Tỉnh giảm giá', color: '#d1583f', values: rs.map(r => Math.round(r.dn / r.n * 1000) / 10)}], unit: '%', digits: 0, height: 240, rotateLabels: true, stackable: true});
  legend('chBreadth', [['Tỉnh tăng giá', '#27af95'], ['Tỉnh giảm giá', '#d1583f'], ['Còn lại: đi ngang', '#c9cdd6']]);
  fillTable('tbl-breadth', ['Ngày', 'So với ngày', 'Tăng', 'Giảm', 'Đi ngang', 'Số tỉnh có giá cả hai ngày'], rs.slice().reverse().map(r => [dmy(r.d), dmy(addDays(r.d, -7)), r.up, r.dn, r.n - r.up - r.dn, r.n]));
  srcLine('chBreadth', ['bht'], dmy(rs.at(-1).d), `Tính từ giá ${provs.length} tỉnh của nguồn: % tỉnh có giá cao hơn (thấp hơn) 7 ngày trước, mẫu số = số tỉnh có giá ở cả hai ngày (bảng chi tiết). Tỉnh không trọng số theo sản lượng.`);
  csv('tbl-breadth', {file: 'do-rong-gia-heo', 'Đơn vị': 'số tỉnh', 'Phương pháp': 'so với 7 ngày trước, tập tỉnh có giá cả hai ngày', 'Nguồn': SRC.bht.join(' ')});
}
function heat() {
  const host = $('chHeat'); if (!host || !provs.length) return;
  let mode = 'week';
  const weeks = [...new Set(days.map(d => { const t = new Date(d + 'T00:00:00Z'), w = (t.getUTCDay() + 6) % 7; return addDays(d, -w); }))].sort();
  const cols = () => mode === 'week' ? weeks.map(w => ({k: w, lab: 'Tuần ' + dm(w), ds: days.filter(d => d >= w && d < addDays(w, 7))})) : days.map(d => ({k: d, lab: dm(d), ds: [d]}));
  const draw = () => {
    const cs = cols(), val = (p, c) => avg(c.ds.map(d => p.map[d])), all = provs.flatMap(p => cs.map(c => val(p, c))).filter(Number.isFinite), lo = Math.min(...all), hi = Math.max(...all);
    const color = v => { if (!Number.isFinite(v)) return 'transparent'; const t = (v - lo) / ((hi - lo) || 1); const r = Math.round(232 - t * 200), g = Math.round(240 - t * 150), b = Math.round(250 - t * 60); return `rgb(${r},${g},${b})`; };
    let lastReg = null;
    host.innerHTML = `<div class="hd-heat-wrap" data-no-fold><table class="fintbl hd-heat ${mode}"><thead><tr><th>Tỉnh</th>${cs.map(c => `<th title="${c.ds.length} ngày có số">${c.lab}</th>`).join('')}</tr></thead><tbody>`
      + provs.map(p => { const reg = p.region !== lastReg ? `<tr class="hd-heat-reg"><th colspan="${cs.length + 1}" style="--hd-c:${REG[p.region]?.[1] || '#888'}">${REG[p.region]?.[0] || 'Khác'}</th></tr>` : ''; lastReg = p.region;
        return reg + `<tr><th>${esc(p.name)}</th>${cs.map(c => { const v = val(p, c); return `<td style="--hd-bg:${color(v)};--hd-fg:${Number.isFinite(v) && (v - lo) / ((hi - lo) || 1) > .6 ? '#fff' : 'inherit'}" title="${esc(p.name)} · ${c.lab}: ${Number.isFinite(v) ? nf(v) + ' đ/kg' + (mode === 'week' ? ' (BQ ' + c.ds.filter(d => Number.isFinite(p.map[d])).length + ' ngày)' : '') : 'không có số'}">${Number.isFinite(v) ? nf(v / 1000, mode === 'week' ? 1 : 0) : ''}</td>`; }).join('')}</tr>`; }).join('')
      + `</tbody></table></div><div class="hd-heat-scale"><span>${nf(lo / 1000, 1)}</span><i></i><span>${nf(hi / 1000, 1)} nghìn đ/kg</span></div>`;
    fillTable('tbl-heat', ['Tỉnh', 'Miền', ...cs.map(c => c.lab)], provs.map(p => [p.name, REG[p.region]?.[0] || '', ...cs.map(c => nf(val(p, c)))]));
  };
  seg('chHeat', [['week', 'Theo tuần'], ['day', 'Theo ngày']], v => { mode = v; draw(); });
  draw();
  srcLine('chHeat', ['bht'], dmy(lastDay), `${provs.length} tỉnh có lịch sử trên nguồn (tên tỉnh theo nguồn). Ô tuần = bình quân không trọng số các ngày có số trong tuần (thứ Hai–Chủ nhật), số ngày ở chú thích khi rê chuột. Màu theo mức giá trong toàn bảng.`);
  csv('tbl-heat', () => ({file: 'gia-heo-theo-tinh-' + mode, 'Đơn vị': 'đ/kg', 'Cột': mode === 'week' ? 'bình quân tuần (thứ Hai đầu tuần)' : 'ngày', 'Trạng thái': 'tham chiếu thị trường', 'Nguồn': SRC.bht.join(' ')}));
}
// Đối chiếu nguồn: cùng ngày, khác phạm vi → hai chuỗi riêng, không trộn.
function crossCheck() {
  if (!$('chHogRef')) return; const ev = obs('hog_price_ref'); if (!ev.length) return;
  const d = ev.map(o => o.period).sort().at(-1), rows = ev.filter(o => o.period === d);
  const items = [];
  regionKeys.forEach(k => { const v = rmap(k)[d]; if (Number.isFinite(v)) items.push([REG[k][0] + ' · Báo Hà Tĩnh (nguồn chính)', v / 1000, REG[k][1]]); rows.filter(o => o.area === REG[k][0]).forEach(o => items.push([REG[k][0] + ' · ' + o.source_name, o.value / 1000, '#9aa3c7'])); });
  rows.filter(o => !Object.values(REG).some(r => r[0] === o.area)).forEach(o => { const p = provs.find(x => x.name === o.area); if (p && Number.isFinite(p.map[d])) items.push([o.area + ' · Báo Hà Tĩnh', p.map[d] / 1000, REG[p.region][1]]); items.push([o.area + ' · ' + o.source_name, o.value / 1000, '#9aa3c7']); });
  hbarCompare('chHogRef', {items: items.map(([label, value, color]) => ({label, value, color})), unit: 'nghìn đ/kg', digits: 1, labelW: 300, ariaLabel: 'Giá heo hơi cùng ngày theo nguồn'});
  srcLine('chHogRef', [SRC.bht, ...[...new Map(rows.map(o => [o.source_name, [o.source_name, o.url]])).values()]], dmy(d), 'Các nguồn khác phạm vi tỉnh và cách lấy giá; chỉ dùng để đối chiếu, không ghép vào chuỗi chính.');
}

/* ---------- 3. Ngô, khô đậu (Pink Sheet) ---------- */
const PS = D.pinksheet?.series || {}, FX = Object.fromEntries((D.fx?.points || []));
function grains(id, tbl, months = 36, withInsight = true) {
  if (!$(id) || !PS.maize) return; let unit = 'usd';
  const mz = Object.fromEntries(PS.maize.points), sm = Object.fromEntries(PS.soymeal.points), ms = PS.maize.points.map(p => p[0]).slice(-months);
  const yoy = (m, o) => { const p = o[(+m.slice(0, 4) - 1) + m.slice(4)]; return p ? (o[m] / p - 1) * 100 : null; };
  const mom = (m, o) => { const i = Object.keys(o).indexOf(m), p = i > 0 ? o[Object.keys(o)[i - 1]] : null; return p ? (o[m] / p - 1) * 100 : null; };
  const conv = (v, m) => unit === 'usd' ? v : (FX[m] ? v * FX[m] / 1e6 : null);
  const draw = () => {
    barLineChart(id, {categories: ms.map(my), series: [{name: 'Ngô', color: '#c29100', kind: 'line', values: ms.map(m => conv(mz[m], m))}, {name: 'Khô đậu tương', color: '#27af95', kind: 'line', values: ms.map(m => conv(sm[m], m))}], unit: unit === 'usd' ? 'USD/tấn' : 'triệu đ/tấn', digits: unit === 'usd' ? 0 : 2, height: 240, zeroBase: false, rotateLabels: true});
    fillTable(tbl, ['Tháng', 'Ngô (USD/tấn)', 'MoM', 'YoY', 'Khô đậu (USD/tấn)', 'MoM', 'YoY', 'USD/VND', 'Ngô (triệu đ/tấn)', 'Khô đậu (triệu đ/tấn)'],
      ms.slice().reverse().map(m => [my(m), nf(mz[m], 1), sg(mom(m, mz)) + '%', sg(yoy(m, mz)) + '%', nf(sm[m], 1), sg(mom(m, sm)) + '%', sg(yoy(m, sm)) + '%', nf(FX[m]), nf(FX[m] ? mz[m] * FX[m] / 1e6 : null, 2), nf(FX[m] ? sm[m] * FX[m] / 1e6 : null, 2)]));
  };
  seg(id, [['usd', 'USD/tấn'], ['vnd', 'Quy đổi VND/tấn']], v => { unit = v; draw(); });
  draw(); legend(id, [['Ngô', '#c29100'], ['Khô đậu tương', '#27af95']]);
  const L = ms.at(-1);
  srcLine(id, ['wb', 'sbv'], my(L), `Giá nguyên liệu tham chiếu thế giới (World Bank, ${esc(D.pinksheet.updated || '')}): ngô Mỹ, khô đậu tương; không phải giá nhập về Việt Nam. Quy đổi VND = USD/tấn × tỷ giá trung tâm bình quân tháng.`);
  if (withInsight) insight(id, `<b>Quan sát:</b> ${my(L)} ngô ${nf(mz[L])} USD/tấn (${sg(mom(L, mz))}% MoM, ${sg(yoy(L, mz))}% YoY), khô đậu ${nf(sm[L])} USD/tấn (${sg(mom(L, sm))}% MoM, ${sg(yoy(L, sm))}% YoY) — ${Math.sign(mom(L, mz)) === Math.sign(mom(L, sm)) ? 'cùng chiều' : 'ngược chiều'} trong tháng. <b>Hệ quả:</b> nguyên liệu đi vào giá cám sau độ trễ tồn kho, hợp đồng; giá vốn mảng heo và thức ăn của DBC, BAF đổi theo. <b>Kiểm chứng tiếp:</b> Pink Sheet tháng sau (đầu tháng) và giá cám bán lẻ trong nước.`);
  csv(tbl, () => ({file: 'ngo-kho-dau-pink-sheet', 'Đơn vị': unit === 'usd' ? 'USD/tấn' : 'triệu đ/tấn', 'Trạng thái': 'tham chiếu thị trường', 'Nguồn': SRC.wb.join(' ') + ' · ' + SRC.sbv.join(' ')}));
}

/* ---------- 4. Quan sát có kiểm (NSO, nhập khẩu, ASF, doanh nghiệp) ---------- */
const OBS = D.evidence?.observations || [];
const obs = (ind, f = () => true) => OBS.filter(o => o.indicator === ind && f(o));
const pLab = p => /^\d{4}-\d{2}$/.test(p) ? my(p) : /^\d{4}-Q\d$/.test(p) ? p.slice(5) + '/' + p.slice(0, 4) : /^\d{4}-\d+M$/.test(p) ? p.slice(5) .replace('M', 'T') + '/' + p.slice(0, 4) : p;
const tip = o => `${o.status}${o.published ? ' · công bố ' + dmy(o.published) : ''}`;
function obsSrc(list) { return [...new Map(list.map(o => [o.url, [o.source_name || 'Nguồn', o.url]])).values()]; }
function herd(id = 'chHerd', tbl = 'tbl-herd') {
  if (!$(id)) return; const rs = obs('herd_pig_yoy').sort((a, b) => a.period < b.period ? -1 : 1); if (!rs.length) return;
  // Trục tháng liên tục; tháng NSO không công bố số cả nước → null (đứt nét), không nối qua.
  const byP = Object.fromEntries(rs.map(o => [o.period, o])), months = []; for (let m = rs[0].period; m <= rs.at(-1).period; m = (+m.slice(5) === 12 ? (+m.slice(0, 4) + 1) + '-01' : m.slice(0, 5) + String(+m.slice(5) + 1).padStart(2, '0'))) months.push(m);
  barLineChart(id, {categories: months.map(pLab), series: [{name: 'Tổng đàn heo cuối kỳ, % so cùng kỳ', color: '#2938A8', kind: 'line', values: months.map(m => byP[m]?.value ?? null)}], unit: '%', digits: 1, height: 220, zeroBase: false, rotateLabels: rs.length > 8});
  fillTable(tbl, ['Thời điểm', 'Tổng đàn heo (% so cùng kỳ)', 'Trạng thái', 'Ngày công bố', 'Nguồn'], rs.slice().reverse().map(o => [pLab(o.period), sg(o.value) + '%', o.status, o.published ? dmy(o.published) : '', o.url]));
  srcLine(id, obsSrc(rs), pLab(rs.at(-1).period), 'Số tồn (stock) cuối tháng, % so với cùng thời điểm năm trước theo đúng số NSO công bố (ước tính); NSO không công bố số con tuyệt đối hằng tháng.');
  csv(tbl, {file: 'tong-dan-heo-yoy', 'Đơn vị': '% so cùng kỳ', 'Loại': 'số tồn cuối kỳ', 'Nguồn': 'NSO'});
}
function output(id = 'chPigOut', tbl = 'tbl-pigout') {
  if (!$(id)) return; const all = obs('pig_output'); if (!all.length) return;
  const q = all.filter(o => /Q\d$/.test(o.period)).sort((a, b) => a.period < b.period ? -1 : 1), cum = all.filter(o => /M$/.test(o.period)).sort((a, b) => a.period < b.period ? -1 : 1);
  const use = q.length >= 3 ? q : cum, isQ = use === q;
  barLineChart(id, {categories: use.map(o => pLab(o.period)), series: [{name: isQ ? 'Sản lượng quý' : 'Sản lượng lũy kế', color: '#861C52', values: use.map(o => o.value)}], unit: use[0].unit, digits: use[0].unit.startsWith('triệu') ? 2 : 0, height: 220, rotateLabels: false});
  fillTable(tbl, ['Kỳ', 'Loại kỳ', 'Sản lượng', 'Đơn vị', '% so cùng kỳ', 'Trạng thái', 'Nguồn'], all.sort((a, b) => a.period < b.period ? 1 : -1).map(o => [pLab(o.period), /Q\d$/.test(o.period) ? 'quý' : 'lũy kế', nf(o.value, o.unit.startsWith('triệu') ? 2 : 1), o.unit, Number.isFinite(o.yoy_pct) ? sg(o.yoy_pct) + '%' : '', o.status, o.url]));
  const L = use.at(-1);
  srcLine(id, obsSrc(all), pLab(L.period), `Sản lượng thịt heo hơi xuất chuồng (dòng chảy trong kỳ), ${isQ ? 'theo quý' : 'lũy kế từ đầu năm'} như NSO công bố${Number.isFinite(L.yoy_pct) ? '; kỳ mới nhất ' + sg(L.yoy_pct) + '% so cùng kỳ' : ''}. Không tự trừ hai mốc lũy kế khi kỳ/đơn vị khác nhau.`);
  csv(tbl, {file: 'san-luong-heo-xuat-chuong', 'Loại': 'dòng chảy trong kỳ', 'Nguồn': 'NSO'});
}
function poultry() {
  if (!$('chPoultry')) return; const rs = obs('poultry_output').sort((a, b) => a.period < b.period ? -1 : 1); if (!rs.length) return;
  barLineChart('chPoultry', {categories: rs.map(o => pLab(o.period)), series: [{name: 'Thịt gia cầm hơi xuất chuồng', color: '#59C5C8', values: rs.map(o => o.value)}], unit: rs[0].unit, digits: rs[0].unit.startsWith('triệu') ? 2 : 0, height: 220, rotateLabels: false});
  fillTable('tbl-poultry', ['Kỳ', 'Sản lượng', 'Đơn vị', '% so cùng kỳ', 'Trạng thái', 'Nguồn'], rs.slice().reverse().map(o => [pLab(o.period), nf(o.value, 2), o.unit, Number.isFinite(o.yoy_pct) ? sg(o.yoy_pct) + '%' : '', o.status, o.url]));
  srcLine('chPoultry', obsSrc(rs), pLab(rs.at(-1).period), 'Chỉ báo cung protein thay thế (NSO), không đo sức mua.');
}
// Nhập khẩu HS 0203: MOIT chỉ công bố lũy kế từ đầu năm (và quý), riêng tháng 1 là số tháng → so 2026 với 2025 cùng số tháng lũy kế.
// Không tự trừ hai mốc lũy kế (các bản tin 2026 có chỗ không cộng khớp: Q1+Q2+Q3 < 8T). Đơn giá hàm ý = trị giá USD ÷ lượng tấn.
function imports() {
  if (!$('chImp')) return;
  const vol = obs('imp_hs0203_t', o => o.area === 'Tổng'), val = obs('imp_hs0203_usd', o => o.area === 'Tổng'); if (!vol.length) return;
  const nM = p => { const m = p.match(/^(\d{4})-(\d+)M$/) || p.match(/^(\d{4})-(01)$/) || p.match(/^(\d{4})-(FY)$/); return m ? [m[1], m[2] === 'FY' ? 12 : Number(m[2])] : null; };
  const V = {}, U = {}; vol.forEach(o => { const k = nM(o.period); if (k) V[k.join('|')] = o; }); val.forEach(o => { const k = nM(o.period); if (k) U[k.join('|')] = o; });
  const years = [...new Set(Object.keys(V).map(k => k.split('|')[0]))].sort().slice(-2), ms = [...new Set(Object.keys(V).map(k => +k.split('|')[1]))].sort((a, b) => a - b);
  const col = {[years[0]]: '#9aa3c7', [years.at(-1)]: '#2938A8'};
  barLineChart('chImp', {categories: ms.map(m => m === 12 ? 'Cả năm' : m + 'T'), series: years.map(y => ({name: y, color: col[y], values: ms.map(m => V[y + '|' + m] ? V[y + '|' + m].value / 1000 : null)})), unit: 'nghìn tấn', digits: 1, height: 240, rotateLabels: false});
  legend('chImp', years.map(y => [y + ' (lũy kế)', col[y]]));
  if ($('chImpPx')) {
    barLineChart('chImpPx', {categories: ms.map(m => m === 12 ? 'Cả năm' : m + 'T'), series: years.map(y => ({name: y, color: col[y], kind: 'line', values: ms.map(m => { const a = V[y + '|' + m], b = U[y + '|' + m]; return a && b ? Math.round(b.value / a.value) : null; })})), unit: 'USD/tấn', digits: 0, height: 200, zeroBase: false, rotateLabels: false});
    legend('chImpPx', years.map(y => [y, col[y]]));
  }
  const all = vol.concat([]).sort((a, b) => a.period < b.period ? 1 : -1), Um = Object.fromEntries(val.map(o => [o.period, o]));
  fillTable('tbl-imp', ['Kỳ', 'Loại kỳ', 'Lượng (tấn)', 'Trị giá (USD)', 'Đơn giá hàm ý (USD/tấn)', 'Trạng thái', 'Ngày phát hành bản tin', 'Nguồn'], all.map(o => { const u = Um[o.period]; return [pLab(o.period), /Q\d$/.test(o.period) ? 'quý' : /M$|FY$/.test(o.period) ? 'lũy kế' : 'tháng', nf(o.value), nf(u?.value), nf(u ? u.value / o.value : null), o.status, o.published ? dmy(o.published) : '', o.url]; }));
  const L = vol.filter(o => nM(o.period)).sort((a, b) => a.published < b.published ? -1 : 1).at(-1);
  srcLine('chImp', obsSrc(vol), pLab(L.period) + ' (bản tin ' + dmy(L.published) + ')', 'Thịt heo tươi, ướp lạnh hoặc đông lạnh (HS 0203), lũy kế từ đầu năm theo bản tin Bộ Công Thương (số sơ bộ từ Cục Hải quan); số quý ở bảng chi tiết. Phụ phẩm (HS 0206) và tổng thịt là chuỗi riêng, không cộng vào.');
  if ($('chImpPx')) srcLine('chImpPx', obsSrc(val), pLab(L.period), 'Đơn giá hàm ý = trị giá USD ÷ lượng tấn của cùng kỳ lũy kế.');
  csv('tbl-imp', {file: 'nhap-khau-hs0203', 'Đơn vị': 'tấn; USD; USD/tấn', 'Trạng thái': 'sơ bộ', 'Nguồn': SRC.moit.join(' ')});
  const a = V[years.at(-1) + '|' + ms.filter(m => V[years.at(-1) + '|' + m]).at(-1)], mm = ms.filter(m => V[years.at(-1) + '|' + m]).at(-1), b = V[years[0] + '|' + mm];
  if (a && b) { const ua = U[years.at(-1) + '|' + mm], ub = U[years[0] + '|' + mm];
    insight('chImp', `<b>Quan sát:</b> ${mm}T/${years.at(-1)} nhập ${nf(a.value / 1000, 1)} nghìn tấn HS 0203, ${sg((a.value / b.value - 1) * 100)}% so với ${mm}T/${years[0]}` + (ua && ub ? `; đơn giá hàm ý ${nf(ua.value / a.value)} USD/tấn so với ${nf(ub.value / b.value)}` : '') + `. <b>Hệ quả:</b> thịt nhập rẻ hơn cạnh tranh trực tiếp ở kênh chế biến, bếp ăn — kìm giá heo hơi trong nước khi lượng nhập tăng. <b>Kiểm chứng tiếp:</b> bản tin cuối tháng 11 (số 9–10 tháng); MOIT chưa công bố số lũy kế 9T/2026.`); }
  const sh = obs('imp_hs0203_share');
  if ($('chImpOrigin') && sh.length) {
    const p = sh.map(o => o.period).sort((x, y) => (sh.find(o => o.period === x).published < sh.find(o => o.period === y).published ? -1 : 1)).at(-1), rows = sh.filter(o => o.period === p).sort((x, y) => y.value - x.value);
    hbarCompare('chImpOrigin', {items: rows.map(o => ({label: o.area, value: o.value, color: '#2938A8'})), unit: '%', digits: 1, labelW: 150, ariaLabel: 'Tỷ trọng nhập khẩu thịt heo theo xuất xứ'});
    srcLine('chImpOrigin', obsSrc(rows), pLab(p), 'Tỷ trọng % lượng HS 0203 theo bản tin; các nước còn lại không công bố.');
  }
}
function asf() {
  const host = $('asfEvents'); if (!host) return; const rs = OBS.filter(o => o.group === 'asf').sort((a, b) => a.period < b.period ? 1 : -1); if (!rs.length) return;
  host.innerHTML = '<ol class="rf-tl">' + rs.map(o => `<li class="past"><time>${esc(pLab(o.period))}</time><div class="rf-ev"><div class="rf-ev-h"><b>${esc(o.label || o.indicator)}</b><span class="rf-st">● ${esc(o.status)}</span></div><p>${esc(nf(o.value, 0) + ' ' + o.unit + (o.area ? ' · ' + o.area : ''))}${o.note ? ' — ' + esc(o.note) : ''}</p><a href="${o.url}" target="_blank" rel="noopener">Nguồn ↗</a></div></li>`).join('') + '</ol>';
  srcLine('asfEvents', obsSrc(rs), pLab(rs[0].period), 'Lũy kế và số kỳ ghi riêng theo đúng nguồn; chưa có chuỗi tỉnh × tuần đồng nhất.');
}

/* ---------- 5. Mô phỏng kinh tế một con heo ---------- */
// Doanh thu/con = giá heo × kg xuất chuồng; chi phí cám/con = kg cám × giá cám; lãi mô phỏng = doanh thu − mọi chi phí đã nhập;
// giá hòa vốn/kg = tổng chi phí ÷ kg xuất chuồng. Preset VCBS: các dòng giữ nguyên số nguồn; tổng tính lại ghi riêng nếu lệch tổng báo cáo.
const PRESETS = {
  vcbs_farm: {label: 'VCBS T5/2023 · trại chuyên nghiệp (lịch sử)', mode: 'farm', price: 51900, kg: 100, feedKg: 2685000 / 15120, feedPx: 15120, piglet: 1235000, vet: 306000, other: 0,
    note: 'VCBS 11/05/2023 tr. 5, cột T5.2023: thức ăn 2.685.000, con giống 1.235.000, thú y + nhân công 306.000; tổng báo cáo 4.200.000 đ/con, tổng các dòng tính lại 4.226.000 (lệch do làm tròn của nguồn). Doanh thu 5.190.000 đ/con heo 100 kg → giá hàm ý 51.900 đ/kg (văn bản nêu 52.700 đ/kg). Kg cám 177,6 = 2.685.000 ÷ 15.120 đ/kg (giá cám heo bình quân QI/2023, VCBS tr. 7) — tách lại để chạy độ nhạy, không phải số nguồn. Chi phí chưa gồm khấu hao nái, chuồng trại.'},
  vcbs_household: {label: 'VCBS · hộ đơn lẻ mua cám và giống (lịch sử)', mode: 'household', price: 51900, kg: 100, feedKg: 2860000 / 15120, feedPx: 15120, piglet: 1400000, vet: 430000, other: 0,
    note: 'VCBS 11/05/2023 tr. 5, cột Hộ đơn lẻ: thức ăn 2.860.000, con giống 1.400.000, thú y + nhân công 430.000; tổng 4.690.000 đ/con (khớp). Kg cám 189,2 = 2.860.000 ÷ 15.120 đ/kg — tách lại để chạy độ nhạy. Doanh thu theo giá 51.900 đ/kg như cột T5.2023.'},
  test: {label: 'Kiểm tra độ nhạy chuẩn (100 kg, 250 kg cám)', mode: 'household', price: 50000, kg: 100, feedKg: 250, feedPx: 12000, piglet: 1300000, vet: 400000, other: 0,
    note: 'Bộ số kiểm tra công thức, không phải số thị trường: heo 100 kg, 250 kg cám/con. Giá heo +1.000 đ/kg → doanh thu +100.000 đ/con; giá cám +500 đ/kg → chi phí +125.000 đ/con; cả hai → lãi −25.000 đ/con.'}};
const FIELDS = [['price', 'Giá heo hơi', 'đ/kg', 500], ['kg', 'Kg xuất chuồng', 'kg/con', 1], ['feedKg', 'Kg cám tiêu thụ', 'kg/con', 1], ['feedPx', 'Giá cám', 'đ/kg', 100], ['piglet', 'Con giống', 'đ/con', 10000], ['vet', 'Thú y, nhân công', 'đ/con', 10000], ['other', 'Hao hụt phân bổ, chi phí khác', 'đ/con', 10000]];
const sim = p => { const rev = p.price * p.kg, feed = p.feedKg * p.feedPx, cost = feed + p.piglet + p.vet + p.other; return {rev, feed, cost, profit: rev - cost, be: cost / p.kg}; };
window.HogSim = {sim, PRESETS};  // để test tay trong console
function simulator() {
  const host = $('cn-sim'); if (!host) return;
  let P = {...PRESETS.vcbs_farm}, preset = 'vcbs_farm';
  const mkt = avg(regionKeys.map(k => rmap(k)[lastDay]));
  host.innerHTML = `<div class="hd-sim-top"><label>Bộ tham số <select id="hdPreset">${Object.entries(PRESETS).map(([k, v]) => `<option value="${k}">${esc(v.label)}</option>`).join('')}</select></label>`
    + (Number.isFinite(mkt) ? `<button type="button" class="rf-tog" id="hdUseMkt">Dùng giá heo hiện tại: ${nf(mkt)} đ/kg (BQ ba miền ${dm(lastDay)})</button>` : '') + `<span class="hd-badge">Chế độ: Mô phỏng</span></div>`
    + `<div class="hd-sim-grid"><div class="hd-sim-in">${FIELDS.map(([k, l, u, st]) => `<label><span>${l}</span><input type="number" step="${st}" data-k="${k}" inputmode="decimal"><small>${u}</small></label>`).join('')}</div><div><div id="hdWf"></div><div class="hd-sim-out" id="hdOut"></div></div></div><p class="source-note method-note" id="hdNote"></p>`;
  const inputs = [...host.querySelectorAll('input[data-k]')];
  const sync = () => inputs.forEach(i => { const v = P[i.dataset.k]; i.value = Number.isInteger(v) ? v : Math.round(v * 100) / 100; });
  const render = () => {
    const r = sim(P);
    // Waterfall: doanh thu → trừ từng dòng chi phí → lãi mô phỏng.
    const steps = [['Doanh thu', r.rev, 'rev'], ['Cám', -r.feed], ['Con giống', -P.piglet], ['Thú y, nhân công', -P.vet], ...(P.other ? [['Chi phí khác', -P.other]] : []), ['Lãi mô phỏng', r.profit, 'end']];
    const W = 400, rowH = 30, pad = 110, max = Math.max(r.rev, r.cost) * 1.05, X = v => pad + v / max * (W - pad - 70);
    let run = 0; const bars = steps.map(([n, v, t], i) => { let a, b; if (t === 'rev') { a = 0; b = v; run = v; } else if (t === 'end') { a = Math.min(0, v); b = Math.max(0, v); } else { a = run + v; b = run; run += v; }
      const col = t === 'rev' ? '#2938A8' : t === 'end' ? (v >= 0 ? '#27af95' : '#d1583f') : '#b3262d';
      return `<g><text x="${pad - 8}" y="${i * rowH + 19}" text-anchor="end" class="axislabel">${n}</text><rect x="${X(Math.max(0, a))}" y="${i * rowH + 6}" width="${Math.max(2, X(Math.abs(b)) - X(Math.max(0, a)))}" height="${rowH - 12}" rx="3" fill="${col}"><title>${n}: ${nf(v)} đ/con</title></rect><text x="${X(Math.max(Math.abs(a), Math.abs(b))) + 6}" y="${i * rowH + 19}" class="endlabel">${sg(v / 1e6, 3).replace('+', t === 'rev' ? '' : '+')} tr</text></g>`; }).join('');
    $('hdWf').innerHTML = `<svg viewBox="0 0 ${W} ${steps.length * rowH + 6}" class="chartsvg" role="img" aria-label="Thác nước doanh thu đến lãi mô phỏng một con heo">${bars}</svg>`;
    $('hdOut').innerHTML = `<div><small>Doanh thu/con</small><b>${nf(r.rev)}</b></div><div><small>Tổng chi phí đã nhập</small><b>${nf(r.cost)}</b></div><div><small>Lãi mô phỏng/con</small><b class="${r.profit >= 0 ? 'up' : 'dn'}">${nf(r.profit)}</b></div><div><small>Giá hòa vốn mô phỏng</small><b>${nf(r.be)} đ/kg</b></div>`;
    $('hdNote').textContent = (PRESETS[preset]?.note || 'Tham số do người dùng nhập.') + ' Đơn vị: đ.';
    grid();
  };
  // Heatmap giá heo × giá cám: lãi mô phỏng/con, các yếu tố khác giữ cố định; ô viền = đang chọn, chữ đậm = ô gần hòa vốn.
  const grid = () => {
    const h = $('cn-sens'); if (!h) return;
    const ps = [-10000, -7500, -5000, -2500, 0, 2500, 5000, 7500, 10000].map(d => P.price + d), fs = [-2000, -1000, -500, 0, 500, 1000, 2000].map(d => P.feedPx + d);
    const vals = fs.map(f => ps.map(p => sim({...P, price: p, feedPx: f}).profit)), mx = Math.max(...vals.flat().map(Math.abs)) || 1;
    const be = f => (sim({...P, feedPx: f}).cost) / P.kg;
    h.innerHTML = `<div class="hd-heat-wrap" data-no-fold><table class="fintbl hd-sens"><thead><tr><th>Giá cám ↓ · Giá heo →</th>${ps.map(p => `<th>${nf(p)}</th>`).join('')}<th>Hòa vốn (đ/kg)</th></tr></thead><tbody>`
      + fs.map((f, i) => `<tr><th>${nf(f)}</th>${ps.map((p, j) => { const v = vals[i][j], t = Math.min(1, Math.abs(v) / mx), bg = v >= 0 ? `rgba(39,175,149,${.12 + t * .7})` : `rgba(209,88,63,${.12 + t * .7})`; const sel = p === P.price && f === P.feedPx, near = Math.abs(p - be(f)) <= 1000;
        return `<td class="${sel ? 'sel' : ''} ${near ? 'be' : ''}" style="--hd-bg:${bg}" title="Giá heo ${nf(p)} · giá cám ${nf(f)} → lãi ${nf(v)} đ/con">${nf(v / 1000)}</td>`; }).join('')}<td class="hd-be">${nf(be(f))}</td></tr>`).join('')
      + `</tbody></table></div><p class="source-note">Ô: lãi mô phỏng, nghìn đ/con. Giữ cố định: ${nf(P.kg)} kg xuất chuồng, ${nf(P.feedKg, 1)} kg cám, giống ${nf(P.piglet)}, thú y + nhân công ${nf(P.vet)}${P.other ? ', khác ' + nf(P.other) : ''} đ/con. Ô viền đậm = bộ tham số đang chọn; chữ đậm = trong ±1.000 đ/kg quanh giá hòa vốn của hàng đó.</p>`;
    fillTable('tbl-sens', ['Giá cám (đ/kg)', ...ps.map(p => 'Heo ' + nf(p)), 'Hòa vốn (đ/kg)'], fs.map((f, i) => [nf(f), ...vals[i].map(v => nf(v)), nf(be(f))]));
  };
  host.querySelector('#hdPreset').addEventListener('change', e => { preset = e.target.value; P = {...PRESETS[preset]}; sync(); render(); });
  host.querySelector('#hdUseMkt')?.addEventListener('click', () => { P.price = Math.round(mkt / 100) * 100; preset = 'custom'; sync(); render(); });
  inputs.forEach(i => i.addEventListener('input', () => { const v = Number(i.value); if (Number.isFinite(v)) { P[i.dataset.k] = v; preset = 'custom'; render(); } }));
  sync(); render();
  srcLine('cn-sim', ['vcbs'], 'preset T5/2023', 'Mô phỏng, không phải biên KQKD doanh nghiệp. Chưa có giá cám thành phẩm và giá giống cùng kỳ đủ tin cậy nên chưa dựng chuỗi biên theo thời gian.');
  srcLine('cn-sens', ['vcbs'], 'theo bộ tham số đang chọn');
  csv('tbl-sens', () => ({file: 'do-nhay-lai-mo-phong', 'Đơn vị': 'đ/con', 'Trạng thái': 'mô phỏng', 'Giữ cố định': `kg ${P.kg}, cám ${P.feedKg} kg, giống ${P.piglet}, thú y ${P.vet}, khác ${P.other}`}));
}

/* ---------- 6. Doanh nghiệp BAF / DBC / MML ---------- */
const CQ = () => window.COMPANY_QUARTERLY, cqRow = s => CQ()?.companies?.find(c => c.symbol === s);
// Giá heo tham chiếu theo quý: bình quân các tháng WiData (toàn quốc, bình quân tháng) — không phải ASP doanh nghiệp.
function hogQuarterRef() { const a = {}; (D.hog_monthly_wi?.points || []).forEach(([m, v]) => { const k = 'Q' + Math.ceil(+m.slice(5, 7) / 3) + '/' + m.slice(0, 4); (a[k] = a[k] || []).push(v); }); return Object.fromEntries(Object.entries(a).filter(([, v]) => v.length === 3).map(([k, v]) => [k, avg(v)])); }
function companies() {
  const host = $('chCoView'); if (!host) return;
  let sym = 'BAF';
  const ref = hogQuarterRef();
  const draw = () => {
    const r = cqRow(sym), qs = CQ()?.quarters || [], from = Math.max(0, qs.length - 12), Q = qs.slice(from);
    const kpi = OBS.filter(o => o.group === 'company' && o.ticker === sym).sort((a, b) => a.period < b.period ? 1 : -1);
    if (r) {
      barLineChart('chCoView', {categories: Q, series: [{name: 'Doanh thu thuần', color: '#2938A8', values: r.revenue.slice(from).map(v => v == null ? null : v / 1000)}, {name: 'LNST', color: '#27af95', values: r.net_income.slice(from).map(v => v == null ? null : v / 1000)}], unit: 'nghìn tỷ', digits: 2, height: 240, rotateLabels: true});
      if ($('chCoMargin')) barLineChart('chCoMargin', {categories: Q, series: [{name: sym + ' biên gộp', color: '#861C52', kind: 'line', values: r.gross_margin.slice(from)}, {name: 'Giá heo BQ quý (nghìn đ/kg, trục chung)', color: '#d1583f', kind: 'line', values: Q.map(q => ref[q] ?? null)}], unit: '', digits: 1, height: 240, zeroBase: false, rotateLabels: true});
      fillTable('tbl-coview', ['Quý', 'Doanh thu (tỷ)', 'LN gộp biên (%)', 'LNST (tỷ)', 'Biên ròng (%)', 'Giá heo BQ quý, WiData (nghìn đ/kg)'], Q.map((q, i) => [q, nf(r.revenue[from + i]), nf(r.gross_margin[from + i], 1), nf(r.net_income[from + i]), nf(r.net_margin[from + i], 1), nf(ref[q], 1)]).reverse());
    } else {
      // Mã không có trong bộ BCTC quý tự động (MML, UPCoM): vẽ từ số doanh nghiệp công bố theo quý (ưu tiên thông cáo của doanh nghiệp).
      const qOf = ind => { const m = {}; kpi.filter(o => o.indicator === ind && /^\d{4}-Q\d$/.test(o.period)).sort((a, b) => (a.status === 'thực tế công bố') - (b.status === 'thực tế công bố')).forEach(o => { m[o.period] = o; }); return m; };
      const rv = qOf('co_net_revenue'), np = qOf('co_net_profit'), em = qOf('co_EBITDA_margin'), qs2 = [...new Set([...Object.keys(rv), ...Object.keys(np)])].sort(), lab = p => p.slice(5) + '/' + p.slice(0, 4);
      if (qs2.length) {
        barLineChart('chCoView', {categories: qs2.map(lab), series: [{name: 'Doanh thu thuần', color: '#2938A8', values: qs2.map(p => rv[p] ? rv[p].value / 1000 : null)}, {name: 'LNST', color: '#27af95', values: qs2.map(p => np[p] ? np[p].value / 1000 : null)}], unit: 'nghìn tỷ', digits: 2, height: 240, rotateLabels: false});
        fillTable('tbl-coview', ['Quý', 'Doanh thu (tỷ)', 'LNST (tỷ)', 'Biên EBITDA (%)', 'Trạng thái', 'Nguồn'], qs2.map(p => [lab(p), nf(rv[p]?.value), nf(np[p]?.value), nf(em[p]?.value, 1), (rv[p] || np[p]).status, (rv[p] || np[p]).url]).reverse());
      } else { $('chCoView').innerHTML = ''; fillTable('tbl-coview', ['Quý'], []); }
      const ems = Object.keys(em).sort();
      if ($('chCoMargin')) { if (ems.length) barLineChart('chCoMargin', {categories: ems.map(lab), series: [{name: sym + ' biên EBITDA', color: '#861C52', kind: 'line', values: ems.map(p => em[p].value)}, {name: 'Giá heo BQ quý (nghìn đ/kg, trục chung)', color: '#d1583f', kind: 'line', values: ems.map(p => ref[lab(p)] ?? null)}], unit: '', digits: 1, height: 240, zeroBase: false, rotateLabels: false}); else $('chCoMargin').innerHTML = ''; }
    }
    // Chỉ tiêu doanh nghiệp công bố: mỗi chỉ tiêu lấy kỳ mới nhất (theo ngày công bố, rồi theo kỳ), dạng ô số; nguồn ở từng ô.
    const k = $('coKpis'); if (k) { const pick = {}; kpi.slice().sort((a, b) => ((a.published || '') + a.period) < ((b.published || '') + b.period) ? -1 : 1).forEach(o => { pick[o.indicator] = o; });
      const order = ['co_pigs_sold', 'co_total_herd', 'co_sows', 'co_net_revenue', 'co_gross_margin', 'co_EBITDA_margin', 'co_net_profit', 'co_operating_cash_flow', 'co_total_borrowings', 'co_processed_meat_share', 'co_meat_ADS_per_WCM_store', 'co_plan_completion_net_profit'];
      const list = order.map(x => pick[x]).filter(Boolean).slice(0, 8);
      k.className = 'rf-tiles hd-cokpis'; k.innerHTML = list.map(o => `<div class="rf-tile"><small>${esc(o.label)} · ${esc(pLab(o.period))}</small><b>${esc(nf(o.value, Math.abs(o.value) < 100 && o.value % 1 ? 1 : 0) + ' ' + o.unit)}</b><span>${Number.isFinite(o.yoy_pct) ? sg(o.yoy_pct) + '% so cùng kỳ · ' : ''}<a href="${o.url}" target="_blank" rel="noopener">${esc(o.status === 'thực tế công bố' ? o.source_name : 'báo chí: ' + o.source_name)}</a></span></div>`).join(''); }
    srcLine('chCoView', r ? ['cq'] : obsSrc(kpi), r ? Q.at(-1) : (kpi[0] ? pLab(kpi[0].period) : ''), r ? 'BCTC hợp nhất quý; LNST là LNST thuộc cổ đông công ty mẹ theo data/company-quarterly.js.' : sym + ' (UPCoM) không có trong bộ BCTC quý tự động; số theo thông cáo Masan Group (LNST là NPAT trước lợi ích cổ đông thiểu số), bổ sung báo chí khi ghi rõ.');
    if ($('chCoMargin')) srcLine('chCoMargin', r ? ['cq', 'wi'] : [...obsSrc(kpi.filter(o => o.indicator === 'co_EBITDA_margin')), SRC.wi], r ? Q.at(-1) : '', (r ? '' : 'MML: biên EBITDA theo thông cáo Masan (không công bố biên gộp cùng định nghĩa). ') + 'Giá heo tham chiếu = bình quân 3 tháng WiData (toàn quốc, bình quân tháng), không phải giá bán thực nhận của doanh nghiệp. Hai chuỗi khác đơn vị (% và nghìn đ/kg) đặt trên cùng trục số để so hướng đi.');
  };
  seg('chCoView', [['BAF', 'BAF'], ['DBC', 'DBC'], ['MML', 'MML']], v => { sym = v; draw(); }, 'hd-co');
  draw();
  csv('tbl-coview', () => cqRow(sym) ? ({file: 'doanh-nghiep-' + sym, 'Đơn vị': 'tỷ đồng; %', 'Phạm vi': 'BCTC hợp nhất quý', 'Nguồn': SRC.cq.join(' ')}) : ({file: 'doanh-nghiep-' + sym, 'Đơn vị': 'tỷ đồng; %', 'Phạm vi': 'số doanh nghiệp công bố theo quý (thông cáo, báo chí ghi ở cột Trạng thái)', 'Nguồn': 'xem cột Nguồn'}));
}

function run() {
  [brief, hogMain, breadth, heat, crossCheck, () => grains('chGrain', 'tbl-grain', 36), () => grains('chGrain2', 'tbl-grain2', 120, false), herd, output, () => herd('chHerdS', 'tbl-herds'), () => output('chPigOutS', 'tbl-pigouts'), poultry, imports, asf, simulator, companies]
    .forEach(f => { try { f(); } catch (e) { console.warn('hog-dashboard', f.name, e); } });
}
if (window.SectorBoot) SectorBoot.add(1100, run); else run();
})();
