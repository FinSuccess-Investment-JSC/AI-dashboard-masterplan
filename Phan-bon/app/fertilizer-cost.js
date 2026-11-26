/* Phân bón · Bức tranh ngành: phần chi phí và biên gộp theo mô hình sản xuất (25/11/2026), dựng vào sub-tab theo loại phân (26/11/2026):
   01 Phân đạm: urê từ khí (DPM, DCM), urê từ than (DHB) · 02 Phân lân & DAP (DDV, LAS, VAF, NFC) · 03 NPK & kali (BFC, SFG)
   · 04 Giá khí: benchmark khí quốc tế, Brent, cơ chế giá khí DPM/DCM · 05 Ma trận tác động lên doanh nghiệp.
   Nguyên tắc (yêu cầu người dùng):
   - Không dùng benchmark quốc tế thay giá mua thực tế của doanh nghiệp; benchmark gắn nhãn Proxy.
   - Không tự giả định định mức hay trọng số để tạo spread; thiếu định mức có nguồn thì chỉ hiện từng chuỗi giá.
   - Spread nguyên liệu ≠ lợi nhuận gộp; biên gộp lấy từ BCTC (mảng hợp nhất, không phải riêng một sản phẩm).
   - Thiếu dữ liệu: ô N/A ghi lý do và nguồn cần bổ sung.
   Chart vẽ bằng ChartTypes (như Điện). Dùng FertKit do fertilizer.js cung cấp. */
(() => {
'use strict';
const K = () => window.FertKit;
const fin = v => typeof v === 'number' && Number.isFinite(v);

// Quý từ chuỗi tháng: bình quân khi đủ 3 tháng (không tạo số quý từ tháng thiếu).
function quarterly(recs) {
  const by = {};
  recs.forEach(r => { const y = r.date.slice(0, 4), q = Math.ceil(+r.date.slice(5, 7) / 3); (by[`${y}Q${q}`] ||= []).push(r.value); });
  return Object.fromEntries(Object.entries(by).filter(([, v]) => v.length === 3).map(([k, v]) => [k, v.reduce((a, b) => a + b, 0) / 3]));
}
function pearson(a, b) {
  const p = a.map((x, i) => [x, b[i]]).filter(([x, y]) => fin(x) && fin(y)); const n = p.length; if (n < 8) return {r: null, n};
  const mx = p.reduce((s, [x]) => s + x, 0) / n, my = p.reduce((s, [, y]) => s + y, 0) / n;
  let sxy = 0, sxx = 0, syy = 0; p.forEach(([x, y]) => { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; });
  return {r: sxx && syy ? sxy / Math.sqrt(sxx * syy) : null, n};
}

/* Phơi nhiễm cấu trúc: chiều tác động khi một biến TĂNG, các yếu tố khác không đổi. Theo cơ cấu sản phẩm và nguyên liệu
   (data/fertilizer/plants.json, BCTN). '+' hưởng lợi · '−' chịu thiệt · '±' hai chiều (đa sản phẩm) · '0' không đáng kể · '?' chưa xác minh. */
const DRIVERS = [
  ['urea', 'Giá urê', 'urea'], ['gas', 'Giá khí', null], ['fo', 'Giá FO', null], ['coal', 'Giá than', 'coal_au'], ['dap', 'Giá DAP', 'dap'],
  ['sulfur', 'Giá lưu huỳnh', null], ['nh3', 'Giá amoniac', null], ['apatit', 'Giá apatit', 'phosrock'], ['potash', 'Giá kali', 'potash'], ['fx', 'Tỷ giá USD/VND', 'usdvnd']];
const NA = {gas: 'Chưa có chuỗi giá khí đầu vào của DPM, DCM (doanh nghiệp không công bố theo tháng)',
  fo: 'Chưa có nguồn công khai miễn phí cho giá FO/MFO Singapore', sulfur: 'Chưa có chuỗi công khai; WiData có giá lưu huỳnh Trung Quốc (chờ hạn mức 27/11)',
  nh3: 'Chưa có chuỗi công khai; cần Argus/ICIS hoặc WiData', apatit: 'Dùng quặng phosphate Morocco (World Bank) làm proxy; giá apatit Lào Cai chưa có',
  coal: 'Dùng than Newcastle (World Bank) làm proxy; giá than TKV bán cho nhà máy đạm chưa có'};
const E_ = {
  DPM: {urea: ['+', 'Urê là sản phẩm chính; giá bán urê tăng làm tăng doanh thu mảng đạm.'], gas: ['−', 'Khí là nguyên liệu chính để sản xuất amoniac rồi urê.'], fo: ['fo', ''],
    coal: ['0', 'Không dùng than làm nguyên liệu.'], dap: ['±', 'DAP là nguyên liệu NPK Phú Mỹ và hàng kinh doanh thương mại.'], sulfur: ['0', 'Không dùng.'],
    nh3: ['?', 'Chưa xác minh công suất và lượng amoniac bán ra (dự án nâng 540 nghìn tấn công bố 2015, chưa xác minh hoàn thành).'], apatit: ['0', 'Không dùng.'], potash: ['±', 'Kali là nguyên liệu NPK và hàng kinh doanh.'], fx: ['±', 'Giá urê theo mặt bằng USD; giá khí cũng tính theo USD.']},
  DCM: {urea: ['+', 'Urê là sản phẩm chính.'], gas: ['−', 'Khí là nguyên liệu chính để sản xuất urê.'], fo: ['fo', ''], coal: ['0', 'Không dùng.'],
    dap: ['±', 'DAP là nguyên liệu NPK Cà Mau và hàng kinh doanh.'], sulfur: ['0', 'Không dùng.'], nh3: ['?', 'Chưa xác minh lượng amoniac bán ra.'], apatit: ['0', 'Không dùng.'],
    potash: ['±', 'Kali là nguyên liệu NPK và hàng kinh doanh.'], fx: ['±', 'Giá urê theo mặt bằng USD; giá khí tính theo USD.']},
  DHB: {urea: ['+', 'Urê là sản phẩm chính.'], gas: ['0', 'Công nghệ khí hóa than, không dùng khí tự nhiên.'], fo: ['0', 'Không dùng FO làm nguyên liệu chính.'],
    coal: ['−', 'Than là nguyên liệu và nhiên liệu chính.'], dap: ['0', 'Không đáng kể.'], sulfur: ['0', 'Không dùng.'], nh3: ['?', 'Chưa xác minh lượng amoniac bán ra.'],
    apatit: ['0', 'Không dùng.'], potash: ['0', 'Không đáng kể.'], fx: ['?', 'Chưa xác minh tỷ trọng than nhập khẩu và nợ vay ngoại tệ.']},
  DDV: {urea: ['0', 'Không sản xuất urê.'], gas: ['0', 'Không dùng khí tự nhiên làm nguyên liệu.'], fo: ['?', 'Chưa xác minh nhiên liệu đốt.'], coal: ['?', 'Chưa xác minh nhiên liệu dùng cho lò hơi.'],
    dap: ['+', 'DAP là sản phẩm chính.'], sulfur: ['−', 'Lưu huỳnh để sản xuất axit sulfuric.'], nh3: ['−', 'Amoniac là nguyên liệu để trung hòa axit phosphoric thành DAP.'],
    apatit: ['−', 'Quặng apatit là nguyên liệu axit phosphoric.'], potash: ['0', 'Không dùng.'], fx: ['±', 'Lưu huỳnh, amoniac nhập theo USD; giá DAP theo mặt bằng USD.']},
  LAS: {urea: ['−', 'Urê là nguyên liệu NPK.'], gas: ['0', 'Không dùng.'], fo: ['?', 'Chưa xác minh.'], coal: ['−', 'Có lân nung chảy 300 nghìn tấn/năm (BCTN 2017); than là nhiên liệu lò nấu.'], dap: ['±', 'Giá DAP là mặt bằng giá phân lân thay thế; DAP có thể là nguyên liệu NPK.'],
    sulfur: ['−', 'Lưu huỳnh để sản xuất axit sulfuric cho supe lân.'], nh3: ['0', 'Không đáng kể.'], apatit: ['−', 'Quặng apatit là nguyên liệu chính của supe lân.'],
    potash: ['−', 'Kali là nguyên liệu NPK.'], fx: ['−', 'Lưu huỳnh, kali nhập khẩu theo USD.']},
  VAF: {urea: ['−', 'Urê là nguyên liệu NPK.'], gas: ['0', 'Không dùng.'], fo: ['0', 'Không đáng kể.'], coal: ['−', 'Than là nhiên liệu lò cao nấu lân nung chảy.'],
    dap: ['±', 'Mặt bằng giá phân lân thay thế.'], sulfur: ['0', 'Lân nung chảy không dùng lưu huỳnh.'], nh3: ['0', 'Không dùng.'], apatit: ['−', 'Quặng apatit là nguyên liệu chính.'],
    potash: ['−', 'Kali là nguyên liệu NPK.'], fx: ['?', 'Chưa xác minh tỷ trọng nguyên liệu nhập.']},
  NFC: {urea: ['−', 'Urê là nguyên liệu NPK.'], gas: ['0', 'Không dùng.'], fo: ['0', 'Không đáng kể.'], coal: ['−', 'Than là nhiên liệu lò cao nấu lân nung chảy.'],
    dap: ['±', 'Mặt bằng giá phân lân thay thế.'], sulfur: ['0', 'Lân nung chảy không dùng lưu huỳnh.'], nh3: ['0', 'Không dùng.'], apatit: ['−', 'Quặng apatit là nguyên liệu chính.'],
    potash: ['−', 'Kali là nguyên liệu NPK.'], fx: ['?', 'Chưa xác minh tỷ trọng nguyên liệu nhập.']},
  BFC: {urea: ['−', 'Urê là nguyên liệu đạm của NPK.'], gas: ['0', 'Không dùng.'], fo: ['0', 'Không dùng.'], coal: ['0', 'Không đáng kể.'],
    dap: ['−', 'DAP/MAP là nguyên liệu lân của NPK.'], sulfur: ['0', 'Không dùng.'], nh3: ['0', 'Không dùng.'], apatit: ['0', 'Không dùng trực tiếp.'],
    potash: ['−', 'Kali là nguyên liệu nhập khẩu của NPK.'], fx: ['−', 'Kali, DAP nhập khẩu theo USD.']},
  SFG: {urea: ['−', 'Urê là nguyên liệu NPK.'], gas: ['0', 'Không dùng.'], fo: ['0', 'Không dùng.'], coal: ['?', 'Chưa xác minh nhiên liệu nhà máy supe lân.'],
    dap: ['−', 'DAP/MAP là nguyên liệu lân của NPK.'], sulfur: ['−', 'Nhà máy Long Thành có supe lân 200 và axit sulfuric 80 nghìn tấn/năm (lưu huỳnh là nguyên liệu axit).'], nh3: ['0', 'Không dùng.'],
    apatit: ['−', 'Quặng apatit cho supe lân.'], potash: ['−', 'Kali là nguyên liệu NPK.'], fx: ['−', 'Nguyên liệu nhập khẩu theo USD.']},
};
const SIGN = {'+': {t: 'Hưởng lợi', c: '#2a9fa3'}, '−': {t: 'Chịu thiệt', c: '#dd7f4e'}, '±': {t: 'Hai chiều', c: '#c9b26b'}, '0': {t: 'Không đáng kể', c: '#EEF0F6'}, '?': {t: 'Chưa xác minh', c: '#f4f5f9'}};

/* Mỗi phần dựng vào sub-tab theo loại phân của Bức tranh ngành (26/11/2026): FertCost.render(id, host).
   ureaGas, ureaCoal → 01 Phân đạm · phos → 02 Phân lân & DAP · npk → 03 NPK & kali · gas → 04 Giá khí · matrix → 05 Ma trận tác động. */
let CTX = null;
function views() {
  if (CTX) return CTX; const k = K(); if (!k) return null;
  const {card, chart, panel, kpi, kpiRow, el, esc, nf, sg, mL, qL, last, recs, yoy, SRC, C, E, F, D} = k;

  const P = F ? F.periods : [], st = Math.max(0, P.indexOf('2021Q1')), QL = P.slice(st).map(qL);
  const qOf = key => { const q = quarterly(recs(key)); return P.slice(st).map(p => q[p] ?? null); };
  const gm = t => E ? E.ratio({m: 'gross'}, {m: 'revenue'}, [t], 'q', 100).values.slice(st) : [];
  const naCard = (title, items) => { const c = el('div', 'card fb-na'); c.innerHTML = `<div class="chart-title">${esc(title)}</div><ul>${items.map(([w, why, need]) => `<li><b>N/A · ${esc(w)}</b><span>${esc(why)}</span>${need ? `<em>Cần bổ sung: ${esc(need)}</em>` : ''}</li>`).join('')}</ul>`; return c; };
  const insight = t => el('p', 'fb-insight', t);
  const corrNote = (t, key) => { const r0 = pearson(gm(t), qOf(key)); return fin(r0.r) ? `${t}: hệ số tương quan biên gộp quý với giá ${key === 'urea' ? 'urê' : key === 'dap' ? 'DAP' : key === 'coal_au' ? 'than Newcastle' : key} cùng quý ${nf(r0.r, 2)} (${r0.n} quý)` : `${t}: chưa đủ quý để tính tương quan`; };
  const gasRows = (D.plants && D.plants.gas_pricing) || [];

  const V = {
    ureaGas(h) {
      const q1 = panel('1.5', 'Giá urê thế giới có truyền vào biên gộp của DPM, DCM không?', 'Hai chart cùng trục quý: trên là giá bán tham chiếu, dưới là biên gộp thực tế từ BCTC.');
      const a = card('pb-c-gas-px', 'Giá urê thế giới, bình quân quý', {sub: 'USD/tấn · FOB Trung Đông · Actual', source: SRC.wb + '; bình quân 3 tháng', info: 'Quý chỉ tính khi đủ 3 tháng. Đây là benchmark quốc tế, không phải giá bán thực tế của DPM, DCM; giá urê nội địa chưa có (WiData).'});
      const b = card('pb-c-gas-gm', 'Biên lợi nhuận gộp DPM, DCM theo quý', {sub: '% · LN gộp ÷ doanh thu thuần hợp nhất · Actual', source: SRC.vnd + '; tự tính', info: 'Biên gộp hợp nhất gồm urê, NPK và hàng kinh doanh thương mại; không phải biên riêng mảng urê.'});
      q1.append(a.el, b.el, insight(`${corrNote('DPM', 'urea')}; ${corrNote('DCM', 'urea')}. Tương quan là thống kê mô tả, không thay cho phân tích giá khí đầu vào.`)); h.append(q1);
      chart(a.host, 'pb-c-gas-px', QL, [{name: 'Urê (World Bank)', color: C.blue, values: qOf('urea')}], {unit: 'USD/tấn', zeroBase: false});
      chart(b.host, 'pb-c-gas-gm', QL, [{name: 'DPM', color: C.blue, values: gm('DPM')}, {name: 'DCM', color: C.sky, values: gm('DCM')}], {unit: '%', digits: 1, zeroBase: false});
    },
    ureaCoal(h) {
      const q1 = panel('1.6', 'Giá than và giá urê đang dịch chuyển thế nào với nhà sản xuất urê từ than?');
      const a = card('pb-c-coal-px', 'Giá than Newcastle và giá urê, bình quân quý', {sub: 'USD/tấn · than: Proxy · urê: benchmark', source: SRC.wb, info: 'Newcastle là giá than nhiệt xuất khẩu Úc, không phải giá than antraxit TKV bán cho DHB, Đạm Ninh Bình. Giá than nội địa chưa có nguồn công khai theo tháng.'});
      q1.append(a.el); h.append(q1);
      chart(a.host, 'pb-c-coal-px', QL, [{name: 'Urê (World Bank)', color: C.blue, values: qOf('urea')}, {name: 'Than Newcastle (proxy)', color: C.grey, values: qOf('coal_au')}], {unit: 'USD/tấn', zeroBase: false});
      const q2 = panel('1.7', 'Biên gộp công nghệ than khác công nghệ khí thế nào?', 'Biên gộp hợp nhất theo nhóm doanh nghiệp, tổng LN gộp ÷ tổng doanh thu.');
      const b = card('pb-c-coal-gm', 'Biên gộp: urê từ than (DHB) so với urê từ khí (DPM + DCM)', {sub: '% · theo quý · Actual', source: SRC.vnd + '; tự tính', info: 'Nhóm khí = tổng LN gộp DPM + DCM ÷ tổng doanh thu; nhóm than = DHB. DHB Q4/2023 giá vốn bằng 0 trên nguồn nên để trống.'});
      q2.append(b.el, insight(corrNote('DHB', 'urea') + '.'), naCard('Dữ liệu còn thiếu', [['Giá than cám TKV bán cho nhà máy đạm', NA.coal, 'TKV, BCTN DHB'], ['Định mức tiêu hao than (tấn than/tấn urê)', 'Chưa có tài liệu công bố', 'BCTN DHB, hồ sơ dự án Đạm Ninh Bình'], ['Đạm Ninh Bình (Vinachem)', 'Chưa niêm yết, không có BCTC quý công khai', 'BCTC Vinachem']]));
      h.append(q2);
      const g = E ? E.ratio({m: 'gross'}, {m: 'revenue'}, ['DPM', 'DCM'], 'q', 100).values.slice(st) : [];
      chart(b.host, 'pb-c-coal-gm', QL, [{name: 'Urê từ khí (DPM+DCM)', color: C.blue, values: g}, {name: 'Urê từ than (DHB)', color: C.grey, values: gm('DHB')}], {unit: '%', digits: 1, zeroBase: false});
    },
    phos(h) {
      const L = k.months('2021-01', last('dap').date);
      const q1 = panel('2.2', 'Giá nguyên liệu và sản phẩm phân lân biến động ra sao?', 'Từng chuỗi độc lập: chưa có định mức tiêu hao có nguồn nên không ghép thành chi phí rổ.');
      const a = card('pb-c-phos-px', 'Giá DAP, TSP và quặng phosphate', {sub: 'USD/tấn · bình quân tháng · quặng: Proxy cho apatit', source: SRC.wb, info: 'Quặng phosphate Morocco là benchmark quốc tế; apatit Lào Cai có hàm lượng và cơ chế giá khác.'});
      q1.append(a.el, naCard('Nguyên liệu chưa có chuỗi giá', [['Lưu huỳnh', NA.sulfur, 'WiData (CNY/tấn), Argus'], ['Amoniac', NA.nh3, 'Argus/ICIS, WiData'], ['Apatit Lào Cai', 'Giá bán nội bộ Vinachem, không công bố theo tháng', 'BCTN DDV, LAS'], ['Định mức tiêu hao DAP, supe lân, lân nung chảy', 'Chưa có tài liệu công bố', 'BCTN, hồ sơ dự án']]));
      h.append(q1);
      chart(a.host, 'pb-c-phos-px', L.map(mL), [['dap', 'DAP', C.gold], ['tsp', 'TSP', C.plum], ['phosrock', 'Quặng phosphate (proxy)', C.grey]].map(([key, n, col]) => ({name: n, color: col, values: L.map(m => k.val(key, m))})), {unit: 'USD/tấn'});
      const q2 = panel('2.3', 'Giá DAP có truyền vào biên gộp các nhà sản xuất lân không?');
      const b = card('pb-c-phos-gm', 'Biên gộp DDV, LAS, VAF, NFC theo quý', {sub: '% · Actual', source: SRC.vnd + '; tự tính'});
      const c2 = card('pb-c-phos-dapq', 'Giá DAP, bình quân quý', {sub: 'USD/tấn · benchmark', source: SRC.wb});
      q2.append(c2.el, b.el, insight(['DDV', 'LAS'].map(t => corrNote(t, 'dap')).join('; ') + '.')); h.append(q2);
      chart(c2.host, 'pb-c-phos-dapq', QL, [{name: 'DAP', color: C.gold, values: qOf('dap')}], {unit: 'USD/tấn', zeroBase: false});
      chart(b.host, 'pb-c-phos-gm', QL, [['DDV', C.gold], ['LAS', C.plum], ['VAF', C.teal], ['NFC', C.grey]].map(([t, col]) => ({name: t, color: col, values: gm(t)})), {unit: '%', digits: 1, zeroBase: false});
    },
    npk(h) {
      // Chỉ số giá từng nguyên liệu, gốc = bình quân 2024 = 100 (tự tính). Không ghép thành rổ vì chưa có công thức có nguồn.
      const base = key => { const v = recs(key).filter(r => r.date.startsWith('2024')).map(r => r.value); return v.length === 12 ? v.reduce((a, b) => a + b, 0) / 12 : null; };
      const L = k.months('2021-01', last('urea').date);
      const q1 = panel('3.4', 'Giá urê, DAP, kali — nguyên liệu của NPK — đang ở đâu so với 2024?', 'Giá nguyên liệu tăng là chi phí với nhà sản xuất NPK, nhưng là doanh thu với nhà sản xuất phân đơn (xem 05 Ma trận tác động).');
      const a = card('pb-c-npk-idx', 'Chỉ số giá nguyên liệu NPK (bình quân 2024 = 100)', {sub: 'Calculated · từng chuỗi riêng, không phải chi phí rổ', source: SRC.wb + '; tự tính', info: 'Chỉ số = giá tháng ÷ bình quân 12 tháng 2024 × 100. Không dùng hàm lượng N-P-K trên bao bì làm tỷ trọng chi phí; chưa có công thức phối trộn có nguồn nên không tính rổ.'});
      q1.append(a.el); h.append(q1);
      chart(a.host, 'pb-c-npk-idx', L.map(mL), [['urea', 'Urê', C.blue], ['dap', 'DAP', C.gold], ['potash', 'Kali', C.plum]].map(([key, n, col]) => { const b = base(key); return {name: n, color: col, values: L.map(m => { const v = k.val(key, m); return fin(v) && b ? v / b * 100 : null; })}; }), {unit: 'điểm', zeroBase: false});
      const q2 = panel('3.5', 'Giá nguyên liệu đi qua tồn kho rồi mới vào biên gộp NPK: độ trễ bao lâu?', 'Giá nguyên liệu → giá vốn hàng tồn kho → giá bán NPK → biên gộp.');
      const b = card('pb-c-npk-gm', 'Biên gộp BFC, SFG theo quý', {sub: '% · Actual', source: SRC.vnd + '; tự tính'});
      const c = card('pb-c-npk-dio', 'Số ngày tồn kho BFC, SFG', {sub: 'ngày · hàng tồn kho bình quân ÷ giá vốn 4 quý × 365 · Calculated', source: SRC.vnd + '; tự tính', info: 'Hàng tồn kho bình quân = (cuối kỳ + cùng kỳ năm trước) ÷ 2. Số ngày tồn kho cho biết khoảng thời gian giá nguyên liệu mua vào nằm trong giá vốn trước khi bán ra.'});
      const lagTxt = ['BFC', 'SFG'].map(t => { const g = gm(t), u = qOf('urea'); const r0 = pearson(g, u), r1 = pearson(g.slice(1), u.slice(0, -1)); return fin(r0.r) ? `${t}: tương quan biên gộp với giá urê cùng quý ${nf(r0.r, 2)}, trễ 1 quý ${nf(r1.r, 2)}` : `${t}: chưa đủ quý`; }).join('; ');
      q2.append(b.el, c.el, insight(lagTxt + '. Hệ số âm nghĩa là giá urê tăng đi kèm biên gộp NPK giảm.')); h.append(q2);
      chart(b.host, 'pb-c-npk-gm', QL, [['BFC', C.teal], ['SFG', C.grey]].map(([t, col]) => ({name: t, color: col, values: gm(t)})), {unit: '%', digits: 1, zeroBase: false});
      if (E) chart(c.host, 'pb-c-npk-dio', QL, [['BFC', C.teal], ['SFG', C.grey]].map(([t, col]) => ({name: t, color: col, values: E.ratio({m: 'inventory', avg: true}, {m: 'cogs'}, [t], 'ttm', 365).values.slice(st)})), {unit: 'ngày'});
      h.append(naCard('Dữ liệu còn thiếu', [['Giá bán NPK theo chủng loại', 'Không có chuỗi công khai', 'bảng giá đại lý, WiData'], ['Công thức phối trộn đại diện', 'Doanh nghiệp không công bố', 'tài liệu kỹ thuật, BCTN'], ['Biên gộp riêng mảng NPK của DPM, DCM', 'BCTC chỉ có số hợp nhất', 'thuyết minh doanh thu theo sản phẩm']]));
    },
    gas(h) {
      const L = k.months('2019-01', last('gas_eu').date);
      const q1 = panel('4.1', 'Chi phí khí của các khu vực sản xuất urê lớn trên thế giới đang ở đâu?', 'Dùng để theo dõi lợi thế chi phí giữa các khu vực và rủi ro cắt giảm cung ở châu Âu; không đại diện cho lợi nhuận DPM, DCM.');
      const a = card('pb-c-intl-gas', 'Giá khí tự nhiên theo khu vực', {sub: 'USD/MMBtu · bình quân tháng · Actual', source: SRC.wb});
      q1.append(a.el, k.heat('pb-c-intl-heat', 'Giá khí châu Âu tăng giảm bao nhiêu so cùng kỳ, từng tháng', '% · so cùng tháng năm trước', 'gas_eu', k.lastYears('gas_eu', 3), SRC.wb)); h.append(q1);
      chart(a.host, 'pb-c-intl-gas', L.map(mL), [['gas_eu', 'Châu Âu (TTF)', C.blue], ['lng_jp', 'LNG Nhật Bản', C.gold], ['gas_us', 'Mỹ (Henry Hub)', C.teal]].map(([key, n, col]) => ({name: n, color: col, values: L.map(m => k.val(key, m))})), {unit: 'USD/MMBtu', digits: 2});
      const q3 = panel('4.2', 'Giá dầu (biến số trong công thức giá khí gắn với dầu) thay đổi ra sao?');
      const c = card('pb-c-gas-brent', 'Dầu Brent, bình quân quý', {sub: 'USD/thùng · Proxy cho nhóm giá khí gắn với giá dầu', source: SRC.wb, info: 'Brent không phải giá FO Singapore; chỉ thể hiện xu hướng nhóm giá dầu. Giá khí thực tế phụ thuộc công thức hợp đồng từng doanh nghiệp (2A.2).'});
      q3.append(c.el); h.append(q3);
      chart(c.host, 'pb-c-gas-brent', QL, [{name: 'Brent (proxy)', color: C.grey, values: qOf('brent')}], {unit: 'USD/thùng', digits: 1, zeroBase: false});
      const q2 = panel('4.3', 'Giá khí đầu vào của DPM và DCM được tính thế nào?', 'Hai doanh nghiệp có hợp đồng khí riêng; không mặc định cùng giá hay cùng công thức.');
      const m = el('div', 'card'); m.dataset.blockId = 'pb-c-gas-mech';
      m.innerHTML = `<div class="chart-title">Cơ chế giá khí theo doanh nghiệp</div>` + (gasRows.length
        ? `<div class="tbl-wrap"><table class="compare-table fb-mech"><thead><tr><th>Doanh nghiệp</th><th>Giai đoạn</th><th>Cơ chế giá khí</th><th>Ghi chú</th><th>Nguồn</th></tr></thead><tbody>${gasRows.map(r => `<tr><td><b>${esc(r.company)}</b></td><td>${esc(r.period || '–')}</td><td>${esc(r.mechanism || 'N/A')}</td><td>${esc(r.note && r.note !== r.mechanism.replace(/^Chưa có công thức; /, '') ? r.note : '')}</td><td>${(r.sources || []).map((u, i) => `<a href="${esc(u)}" target="_blank" rel="noopener">[${i + 1}]</a>`).join(' ')}</td></tr>`).join('')}</tbody></table></div>`
        : '<p class="fb-na-p">N/A · chưa xác minh được công thức giá khí từ tài liệu doanh nghiệp.</p>') + `<div class="pw-src">Nguồn: tài liệu doanh nghiệp, PV GAS (ghi theo từng dòng)</div>`;
      const norms = (D.plants && D.plants.consumption_norms) || [];
      if (norms.length) { const nc = el('div', 'card'); nc.innerHTML = `<div class="chart-title">Định mức tiêu hao đã công bố</div><div class="tbl-wrap"><table class="compare-table fb-mech"><thead><tr><th>Nhà máy</th><th>Định mức</th><th>Nguồn</th></tr></thead><tbody>${norms.map(n => `<tr><td>${esc(n.plant === 'dcm_camau' ? 'Đạm Cà Mau (DCM)' : n.plant)}</td><td>${esc(n.norm)}</td><td>${n.source ? `<a href="${esc(n.source)}" target="_blank" rel="noopener">[1]</a>` : ''}</td></tr>`).join('')}</tbody></table></div><p class="fb-na-p">Là tổng năng lượng ròng (khí nguyên liệu và nhiên liệu), không phải định mức khí nguyên liệu riêng; chưa đủ để tính chi phí khí/tấn urê.</p>`; q2.append(nc); }
      q2.append(m, naCard('Dữ liệu còn thiếu cho spread urê – khí theo doanh nghiệp', [
        ['Giá khí đầu vào thực tế DPM, DCM theo quý', NA.gas, 'thuyết minh BCTC / tài liệu IR (giá khí bình quân kỳ)'],
        ['Giá FO/MFO Singapore', NA.fo, 'Platts/Argus hoặc WiData'], ['Định mức tiêu hao khí (MMBtu/tấn urê)', 'Doanh nghiệp chưa công bố định mức hiện hành', 'BCTN, hồ sơ dự án'],
        ['Giá bán urê bình quân DPM, DCM', 'Không công bố theo quý', 'tài liệu IR (doanh thu, sản lượng urê bán)'], ['Giá urê nội địa (Phú Mỹ, Cà Mau)', 'WiData hết hạn mức tuần này', 'WiData, làm mới 27/11']]));
      h.append(q2);
      h.append(insight('Spread urê – khí quốc tế không được dựng: chưa có giá urê giao tại châu Âu và định mức có nguồn cho cùng khu vực, nên ghép giá urê Trung Đông với khí châu Âu sẽ sai khu vực.'));
    },
    matrix(h) {
      const q = panel('5.1', 'Biến số nào đang tác động lên doanh nghiệp nào, theo chiều nào?', 'Ba chế độ: phơi nhiễm cấu trúc (định tính), tác động hiện tại (biến động giá thực tế × chiều cấu trúc), tương quan thực tế với biên gộp.');
      const c = el('div', 'card fb-mx'); c.dataset.blockId = 'pb-c-matrix';
      c.innerHTML = `<div class="chart-title">Ma trận tác động chi phí lên doanh nghiệp niêm yết</div>
        <div class="fb-mx-ctl"><div class="pf-seg pf-box" data-k="mode"><button type="button" data-v="struct" aria-pressed="true">Phơi nhiễm cấu trúc</button><button type="button" data-v="now" aria-pressed="false">Tác động hiện tại</button><button type="button" data-v="corr" aria-pressed="false">Tương quan với biên gộp</button></div>
        <div class="pf-seg pf-box" data-k="per" hidden><button type="button" data-v="1" aria-pressed="false">1T</button><button type="button" data-v="3" aria-pressed="true">3T</button><button type="button" data-v="ytd" aria-pressed="false">Từ đầu năm</button><button type="button" data-v="12" aria-pressed="false">So cùng kỳ</button></div></div>
        <div class="fb-mx-grid"></div><div class="fb-mx-tip" hidden></div><div class="fb-mx-legend"></div>
        <div class="pw-src">Nguồn: cơ cấu sản phẩm và nguyên liệu theo BCTN doanh nghiệp (data/fertilizer/plants.json); giá: ${SRC.wb}; tỷ giá: Ngân hàng Nhà nước; biên gộp: ${SRC.vnd}</div>`;
      q.append(c); h.append(q);
      const S = {mode: 'struct', per: '3'}, T = Object.keys(E_);
      const chg = (key, per) => { const r = recs(key); if (r.length < 13) return null; const a = r.at(-1); let b;
        if (per === 'ytd') b = r.find(x => x.date === `${+a.date.slice(0, 4) - 1}-12`); else b = r.find(x => x.date === k.ymAdd(a.date, -+per));
        return b && fin(b.value) && b.value ? {v: (a.value / b.value - 1) * 100, from: b.date, to: a.date} : null; };
      const corr = (t, key) => { if (!key || !F) return null; const r = pearson(gm(t), qOf(key)); return fin(r.r) ? r : null; };
      const draw = () => {
        const g = c.querySelector('.fb-mx-grid'); c.querySelector('[data-k="per"]').hidden = S.mode !== 'now';
        let html = `<div class="fb-mx-row fb-mx-h"><span></span>${DRIVERS.map(([, n]) => `<span>${esc(n)}</span>`).join('')}</div>`;
        html += T.map(t => `<div class="fb-mx-row"><span class="fb-mx-t">${t}</span>${DRIVERS.map(([id, n, key]) => {
          let [s, why] = E_[t][id]; if (s === 'fo') { const fo = gasRows.find(r => (r.company || '').includes(t) && /FO|dầu/i.test(r.mechanism || '')); s = fo ? '−' : '?'; why = fo ? 'Công thức giá khí gắn với giá FO/dầu (xem 04 Giá khí, mục 4.3).' : 'Chưa xác minh công thức giá khí gắn FO.'; }
          const base = SIGN[s] || SIGN['?']; let bg = base.c, lab = s, tip = `<b>${t} · ${esc(n)}</b><br>Phơi nhiễm cấu trúc: ${esc(base.t)} — ${esc(why)}`;
          if (S.mode === 'now') {
            const x = key ? chg(key, S.per) : null;
            if (!key) { bg = '#f4f5f9'; lab = 'N/A'; tip += `<br>Tác động hiện tại: N/A — ${esc(NA[id] || 'chưa có chuỗi giá')}`; }
            else if (!x) { bg = '#f4f5f9'; lab = 'N/A'; tip += '<br>Chưa đủ kỳ để tính biến động.'; }
            else { const dir = s === '+' ? Math.sign(x.v) : s === '−' ? -Math.sign(x.v) : 0; bg = s === '0' || s === '?' || s === '±' ? '#EEF0F6' : dir > 0 ? '#2a9fa3' : dir < 0 ? '#dd7f4e' : '#EEF0F6';
              lab = `${sg(x.v, 0)}%`; tip += `<br>Biến động ${mL(x.from)}→${mL(x.to)}: <b>${sg(x.v, 1)}%</b>${NA[id] ? ' · ' + esc(NA[id]) : ''}<br>Hướng tác động tiềm năng: ${s === '+' || s === '−' ? (dir > 0 ? 'tích cực' : dir < 0 ? 'tiêu cực' : 'trung tính') : 'phụ thuộc cơ cấu (' + esc(base.t.toLowerCase()) + ')'}`; } }
          if (S.mode === 'corr') { const r = corr(t, key); if (!r) { bg = '#f4f5f9'; lab = 'N/A'; tip += `<br>Tương quan: N/A — ${key ? 'chưa đủ quý' : esc(NA[id] || 'chưa có chuỗi')}`; }
            else { const a = Math.abs(r.r); bg = r.r >= 0 ? `rgba(42,159,163,${.15 + a * .8})` : `rgba(221,127,78,${.15 + a * .8})`; lab = nf(r.r, 2); tip += `<br>Tương quan biên gộp quý với giá cùng quý: <b>${nf(r.r, 2)}</b> (${r.n} quý, từ Q1/2021). Thống kê mô tả, không phải quan hệ nhân quả.`; } }
          return `<span class="fb-mx-c" style="background:${bg};color:${/^#(2a9fa3|dd7f4e)/.test(bg) || (/rgba/.test(bg) && /,0\.[6-9]/.test(bg)) ? '#fff' : '#303540'}" data-tip="${esc(tip)}" tabindex="0">${esc(lab === '0' ? '·' : lab)}</span>`; }).join('')}</div>`).join('');
        g.innerHTML = html;
        c.querySelector('.fb-mx-legend').innerHTML = S.mode === 'struct' ? Object.entries(SIGN).map(([s, o]) => `<span><i style="background:${o.c}"></i>${s === '0' ? '·' : s} ${esc(o.t)}</span>`).join('')
          : S.mode === 'now' ? '<span><i style="background:#2a9fa3"></i>Tác động tiềm năng tích cực</span><span><i style="background:#dd7f4e"></i>Tiêu cực</span><span><i style="background:#EEF0F6"></i>Hai chiều / không đáng kể</span><span><i style="background:#f4f5f9"></i>N/A</span><span>Chiều = chiều cấu trúc × chiều biến động giá; không phải ước tính lợi nhuận</span>'
          : '<span><i style="background:rgba(42,159,163,.8)"></i>Tương quan dương</span><span><i style="background:rgba(221,127,78,.8)"></i>Tương quan âm</span><span>Hệ số Pearson biên gộp quý × giá bình quân quý, tối thiểu 8 quý</span>';
      };
      c.addEventListener('click', e => { const b = e.target.closest('.pf-seg button'); if (!b) return; const w = b.parentElement; S[w.dataset.k] = b.dataset.v; w.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); draw(); });
      const tipEl = c.querySelector('.fb-mx-tip');
      const showTip = cell => { tipEl.innerHTML = cell.dataset.tip; tipEl.hidden = false; };
      c.addEventListener('mouseover', e => { const x = e.target.closest('.fb-mx-c'); if (x) showTip(x); });
      c.addEventListener('focusin', e => { const x = e.target.closest('.fb-mx-c'); if (x) showTip(x); });
      draw();
    }
  };
  return (CTX = V);
}
function render(id, host) { const V = views(); if (!V || !host || host.dataset.cost === id) return; host.dataset.cost = id; try { V[id](host); } catch (e) { console.error(e); } }
window.FertCost = {render, quarterly, pearson, EXPOSURE: E_, DRIVERS};
})();
