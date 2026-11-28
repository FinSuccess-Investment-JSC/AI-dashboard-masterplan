/* BĐS dân cư · khung chuẩn Điện, 4 tab (28/11/2026, DASHBOARD_WORKFLOW.md §42; thay khung 5 tab of-nav ngày 26/11/2026).
   Tab lớn: Tổng quan ngành (#mt1, .ov-nav: 00 Bản đồ ngành · 01 Mô hình kinh doanh · 02 Triển vọng)
          · Bức tranh ngành (#mt2, .pp-nav: 01 Toàn thị trường · 02 Đất, vốn & chi phí · 03 Nguồn cung & mở bán · 04 Giao dịch, giá & tồn kho
            · 05 Chính sách — thanh con .pp-subnav 7 văn bản, giữ id #of-mt4-<khóa> cho app/re-legal.js, app/re-policy.js)
          · Tài chính ngành (#mt14, .pp-nav: 01 Tài chính ngành = app/re-finance.js · 02 Doanh nghiệp niêm yết · 03 Định giá = app/peer-valuation.js)
          · Chủ đề nóng (#mt7: khối tin app/re-news.js như Điện, 28/11/2026; thẻ chủ đề cũ ẩn trong details.of-rest).
   Bức tranh ngành theo luồng ngành: Toàn thị trường → Đầu vào (đất, vốn, chi phí) → Sản xuất (nguồn cung, mở bán) → Đầu ra (giao dịch, giá, tồn kho).
   Mỗi sub-tab: pp-head + ngày dữ liệu mới nhất (tính từ REALESTATE_PUBLIC, RE_MARKET_HISTORY), ô số, thanh luồng, câu hỏi đánh số
   (pp-main → pp-sup1 → pp-more). Thẻ cũ được DỜI theo data-block-id, không nhân bản, không xóa; thẻ không dùng nằm trong details.of-rest ẩn.
   Deep-link: ?sub=<khóa>#mtN (Chính sách: ?sub=policy&pol=<văn bản>#mt2). Link cũ: #mt3 → 04 › Giá, #mt10 → 02 › Vốn, #mt12 → 02 › Đất,
   #mt4 (?sub=<văn bản>) → 05 Chính sách, #mt11 → 05 › Mới duyệt, #mt5/#mt6 → Tổng quan, #mt8 → Tổng quan › Nguồn dữ liệu,
   ?sub=listed#mt1 → Tài chính › 02; khóa sub-tab cũ macro, demand, price, capital, infra, total, compare tự chuyển. */
(() => {
'use strict';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
if (!$('[data-block-id="bds-01"]') || !$('[data-block-id="bds-28"]')) return;  // chỉ trang BĐS dân cư
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const block = id => $(`[data-block-id="${id}"]`);
const fin = v => typeof v === 'number' && Number.isFinite(v);
const nf = (v, d = 0) => fin(v) ? v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}) : '—';
const sg = (v, d = 1) => fin(v) ? (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), d) : '—';
const GAP = t => `<p class="data-gap of-gap">${t}</p>`;
const HIDE = ['bds-51'];
const HIDE_SEL = ['.business-models'];  // 26/11/2026: người dùng bỏ thẻ tính trả góp mua nhà 3 tỷ và thẻ mô tả mô hình cũ

/* ---------- Cây tab ---------- */
// Tổng quan ngành: thanh .ov-nav đánh số từ 00 (như Điện). Doanh nghiệp niêm yết (bds-03) sang Tài chính ngành › 02.
const OV = [
  {k: 'map', t: 'Bản đồ ngành', s: 'Chuỗi giá trị, khung pháp lý', d: 'Quỹ đất → pháp lý → vốn → xây dựng → bán hàng → bàn giao, mỗi khâu gắn mã niêm yết và văn bản pháp lý.', sel: ['.research-roadmap', '.value-chain-card'], ids: ['bds-01']},
  {k: 'model', t: 'Mô hình kinh doanh', s: 'Vòng đời tiền dự án, mô hình từng mã', d: 'Doanh nghiệp kiếm tiền từ đâu, tiền đi qua BCTC thế nào; các mã khác nhau ở quỹ đất và nguồn vốn.', ids: [], rest: true},
  {k: 'cycle', t: 'Triển vọng', s: 'Vị trí trong chu kỳ', d: 'Giá, thanh khoản và vốn đang ở đâu trong chu kỳ nhà ở.', ids: ['bds-02']},
];
// Chính sách (sub-tab cuối của Bức tranh ngành): mỗi văn bản lớn một thẻ con (27/11/2026, người dùng chốt flow "ngành nhiều luật").
// Tóm tắt đầu mỗi thẻ con do app/re-legal.js thêm; bảng bds-20 được re-legal.js tách dòng sang 02, 03, 04.
const POL = [
  {k: 'land', t: 'Luật Đất đai 2024', ids: ['bds-19', 'bds-38']},
  {k: 'housing', t: 'Luật Nhà ở & NOXH', ids: []},
  {k: 'kdbds', t: 'Luật Kinh doanh BĐS', ids: []},
  {k: 'nq171', t: 'NQ 171 thí điểm', ids: []},
  {k: 'law', t: 'Luật sửa đổi 2026', ids: ['bds-44', 'bds-60', 'bds-57', 'bds-58', 'bds-59'], rest: true},
  {k: 'credit', t: 'Tín dụng & trái phiếu', ids: ['bds-21']},
  {k: 'docs', t: 'Mới duyệt gần đây', ids: ['bds-37', 'bds-39', 'bds-20']},
];
/* Bức tranh ngành (28/11/2026): 01 Toàn thị trường rồi đi theo chuỗi Đầu vào → Sản xuất → Đầu ra như Điện đi theo loại nguồn.
   Mục: {grp} tiêu đề nhóm · {stage} tiêu đề khâu (khớp flow) · {link: [href, nơi, tiêu đề, mô tả]} thẻ dẫn (.th-link)
   · {q, id, main, sup, more, gap} câu hỏi: main = chart trả lời chính, sup = chart phụ, more = xem thêm, gap = hạn chế dữ liệu ghi ngay dưới. */
const LINK = (href, k, t, s) => ({link: [href, k, t, s]});
const PICT = [
  {k: 'market', t: 'Toàn thị trường', d: 'Quy mô ngành trong GDP, vốn ngoại vào BĐS và nhịp tăng giảm của các chỉ báo chính.', kpis: ['spk-gdp', 'spk-fdi', 'spk-pb'], items: [
    {grp: 'Quy mô ngành'},
    {q: 'Kinh doanh BĐS đóng góp vào GDP đang tăng hay chậm lại?', id: 're-q-gdp', main: ['bds-04']},
    {grp: 'Vốn ngoại'},
    {q: 'Vốn FDI đăng ký vào BĐS tăng hay giảm so với cùng kỳ?', id: 're-q-fdi', main: ['bds-05'], sup: ['bds-05c'], more: ['bds-05d']},
    {q: 'Dự án FDI lớn nào đang vào BĐS?', id: 're-q-fdi-proj', main: ['bds-05b']},
    {grp: 'Nhịp chỉ báo'},
    {q: 'Chỉ báo nào đang tăng, chỉ báo nào giảm so với cùng kỳ?', id: 're-q-heat', main: ['.fsv-heat']},
    {grp: 'Cung – cầu cả nước'},
    LINK('#re-q-tx', 'Giao dịch, giá & tồn kho › 4.1', 'Giao dịch thành công và tồn kho cả nước', 'Số Bộ Xây dựng theo quý: giao dịch căn hộ, nhà riêng lẻ, đất nền; tồn kho chủ đầu tư'),
    LINK('#re-q-launch', 'Nguồn cung & mở bán › 3.1', 'Căn hộ mở bán mới ở Hà Nội, TP.HCM', 'Số căn mở bán theo quý (CBRE), so sánh các nguồn'),
  ]},
  {k: 'input', t: 'Đất, vốn & chi phí', d: 'Đầu vào của một dự án: hạ tầng mở quỹ đất, chi phí và nguồn vốn vay, giá vật liệu xây dựng.', kpis: ['spk-refi', 'spk-maturity', 'spk-late', 'spk-steel'],
    flow: [['land', 'Đất', 'Hạ tầng mở quỹ đất, bảng giá đất'], ['capital', 'Vốn', 'Lãi suất, tín dụng, trái phiếu'], ['cost', 'Chi phí xây dựng', 'Giá thép, xi măng']], items: [
    {stage: 'land'},
    {q: 'Cao tốc hoàn thành có theo kịp kế hoạch?', id: 're-q-road', main: ['bds-48']},
    {q: 'Dự án hạ tầng trọng điểm nào đã khai thác, đang làm?', id: 're-q-infra', main: ['bds-50']},
    LINK('#of-mt4-land', 'Chính sách › Luật Đất đai 2024', 'Bảng giá đất 2026 tại các thị trường lớn', 'Tiền sử dụng đất của dự án tăng theo bảng giá đất hằng năm'),
    {stage: 'capital'},
    {q: 'Chi phí vốn của người mua nhà đang ở mức nào?', id: 're-q-rate', main: ['bds-36'], sup: ['bds-16']},
    {q: 'Tín dụng cho xây dựng, BĐS tăng nhanh hay chậm hơn tín dụng chung?', id: 're-q-credit', main: ['bds-33'], sup: ['bds-34'], more: ['bds-35'],
      gap: 'Chưa có chuỗi tín dụng kinh doanh BĐS theo tháng (NHNN chỉ công bố theo đợt).'},
    {q: 'Phát hành trái phiếu BĐS đã hồi lại chưa?', id: 're-q-bond', main: ['bds-28'], sup: ['bds-29']},
    {q: 'Nợ trái phiếu BĐS chậm trả đang giảm hay tăng?', id: 're-q-late', main: ['bds-30']},
    {q: 'Gốc trái phiếu đến hạn dồn vào tháng nào, doanh nghiệp nào?', id: 're-q-due', main: ['bds-31'], sup: ['bds-32']},
    {stage: 'cost'},
    {q: 'Giá thép, xi măng xây dựng đang tăng hay giảm?', id: 're-q-cost', main: ['bds-14'], sup: ['bds-15']},
  ]},
  {k: 'supply', t: 'Nguồn cung & mở bán', d: 'Căn hộ mở bán mới ở Hà Nội, TP.HCM theo quý, cơ cấu khu vực và mức giá, thị trường tỉnh lớn.', kpis: ['spk-hn-launch', 'spk-hn-abs', 'spk-hcm-launch'],
    flow: [['city', 'Hà Nội, TP.HCM', 'Căn hộ mở bán mới theo quý'], ['mix', 'Cơ cấu', 'Theo khu vực và mức giá'], ['prov', 'Tỉnh lớn', 'Thị trường ngoài hai đô thị']], items: [
    {stage: 'city'},
    {q: 'Căn hộ mở bán mới ở Hà Nội, TP.HCM đang tăng hay giảm?', id: 're-q-launch', main: ['bds-08b'], sup: ['bds-08']},
    {stage: 'mix'},
    {q: 'Nguồn cung mới dồn vào mức giá, khu vực nào?', id: 're-q-mix', main: ['bds-08e'], sup: ['bds-08c']},
    {stage: 'prov'},
    {q: 'Thị trường tỉnh lớn ngoài Hà Nội, TP.HCM mở bán ra sao?', id: 're-q-prov', main: ['bds-08d']},
  ]},
  {k: 'output', t: 'Giao dịch, giá & tồn kho', d: 'Đầu ra của thị trường: giao dịch thành công, tồn kho chủ đầu tư, giá sơ cấp so với CPI nhà ở.', kpis: ['spk-tx', 'spk-inv', 'spk-hn-price', 'spk-cpi'],
    flow: [['tx', 'Giao dịch', 'Giao dịch thành công cả nước'], ['inv', 'Tồn kho', 'Tồn kho chủ đầu tư'], ['px', 'Giá', 'Giá sơ cấp và CPI nhà ở']], items: [
    {stage: 'tx'},
    {q: 'Giao dịch nhà ở, đất nền cả nước đang tăng hay giảm?', id: 're-q-tx', main: ['bds-07']},
    {stage: 'inv'},
    {q: 'Tồn kho chủ đầu tư đang tăng hay giảm?', id: 're-q-inv', main: ['bds-07b'],
      gap: 'Chưa có chuỗi tỷ lệ hấp thụ theo quý cùng định nghĩa cho cả Hà Nội và TP.HCM.'},
    {stage: 'px'},
    {q: 'Giá căn hộ sơ cấp Hà Nội, TP.HCM còn tăng không?', id: 're-q-price', main: ['bds-13'], more: ['bds-13b']},
    {q: 'Giá nhà tăng nhanh hay chậm hơn CPI nhà ở?', id: 're-q-real', main: ['bds-52'], sup: ['bds-06']},
  ]},
  {k: 'policy', t: 'Chính sách', d: 'Mỗi văn bản pháp lý lớn một mục: tóm tắt, quy định trước và sau, tác động lên doanh nghiệp.', pol: true},
];
const FIN = [['sector', 'Tài chính ngành', 'Chỉ số cộng gộp từ BCTC hợp nhất quý theo nhóm mô hình kinh doanh (tổng tử số ÷ tổng mẫu số).'],
  ['listed', 'Doanh nghiệp niêm yết', 'Từng mã: mô hình và biến quyết định, xu hướng tài chính theo quý, kế hoạch – kết quả, P/B rổ mã.'],
  ['valuation', 'Định giá', 'P/B, P/E so với ROE và lợi suất lợi nhuận giữa các mã, số theo phiên.']];
const ROUTES = [['mt1', 'Tổng quan ngành'], ['mt2', 'Bức tranh ngành'], ['mt14', 'Tài chính ngành'], ['mt7', 'Chủ đề nóng']];
// Link cũ: tab → [tab mới, sub-tab, đích cuộn]. #mt4 giữ ?sub=<văn bản> cũ làm thẻ con Chính sách.
const ALIAS = {mt3: ['mt2', 'output', 're-st-output-px'], mt10: ['mt2', 'input', 're-st-input-capital'], mt12: ['mt2', 'input', 're-st-input-land'],
  mt4: ['mt2', 'policy'], mt11: ['mt2', 'policy', null, 'docs'], mt5: ['mt1'], mt6: ['mt1'], mt8: ['mt1', 'map', 're-sources'], mt9: ['mt14', 'sector'], mt13: ['mt1']};
// Khóa sub-tab cũ → [tab, sub-tab mới, đích cuộn, thẻ con Chính sách].
const SUBALIAS = {
  mt1: {listed: ['mt14', 'listed']},
  mt2: {macro: ['mt2', 'market'], demand: ['mt2', 'output', 're-st-output-tx'], price: ['mt2', 'output', 're-st-output-px'], capital: ['mt2', 'input', 're-st-input-capital'], infra: ['mt2', 'input', 're-st-input-land'],
    ...Object.fromEntries(POL.map(p => [p.k, ['mt2', 'policy', null, p.k]]))},
  mt14: {total: ['mt14', 'sector'], compare: ['mt14', 'listed']},
};

/* ---------- Số liệu cho ô số và ngày dữ liệu (chỉ đọc chuỗi đã vẽ trên trang) ---------- */
const PUB = window.REALESTATE_PUBLIC?.blocks || {}, MH = window.RE_MARKET_HISTORY || {};
const SER = k => PUB.macro?.series?.[k] || PUB.commodity?.series?.[k] || null;
const recs = k => (SER(k)?.records || []).filter(r => r && fin(r.value));
const dmy = d => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`, my = d => `${d.slice(5, 7)}/${d.slice(0, 4)}`;
const qOf = s => { const m = /Q(\d)\s*\/\s*(\d{4})/.exec(s || ''); return m ? {key: `${m[2]}-${String(m[1] * 3).padStart(2, '0')}-01`, label: `Q${m[1]}/${m[2]}`} : null; };
// Điểm cuối của một chuỗi: khóa so sánh (yyyy-mm-dd) + nhãn theo đúng tần suất (ngày / tháng / quý).
function lastPt(k) {
  const s = SER(k), r = recs(k).at(-1); if (!s || !r) return null;
  if (s.latest_observation) return {key: s.latest_observation, label: dmy(s.latest_observation)};
  if (s.time_type === 'quarterly') return r.period ? qOf(r.period.replace(/(\d{4})-Q(\d)/, 'Q$2/$1')) : qOf(`Q${Math.ceil(+r.date.slice(5, 7) / 3)}/${r.date.slice(0, 4)}`);
  if (s.time_type === 'monthly') return {key: r.date.slice(0, 7) + '-01', label: my(r.date)};
  return {key: r.date, label: dmy(r.date)};
}
const lastQ = (rows, f) => (rows || []).filter(f).map(r => qOf(r.quarter)).filter(Boolean).sort((a, b) => a.key.localeCompare(b.key)).at(-1) || null;
const pbRecs = () => PUB.sector_ratio?.by_sector?.['160']?.records || [];
const monthRec = (rows, f) => { const r = (rows || []).filter(f).at(-1); return r ? {key: r.date.slice(0, 7) + '-01', label: my(r.date)} : null; };
const ASOF = {
  market: () => [['GDP kinh doanh BĐS', lastPt('gdp_re_q')], ['FDI đăng ký vào BĐS', lastPt('fdi_re_ytd')], ['P/B rổ BĐS dân cư', (r => r ? {key: r[0], label: dmy(r[0])} : null)(pbRecs().at(-1))],
    ['Dự án FDI lớn', (r => r?.month ? {key: `${r.year}-${String(r.month).padStart(2, '0')}-01`, label: `${String(r.month).padStart(2, '0')}/${r.year}`} : null)((MH.fdi_projects || []).filter(x => x.month).sort((a, b) => a.year - b.year || a.month - b.month).at(-1))]],
  input: () => [['Lãi suất tái cấp vốn', lastPt('refi_rate')], ['Tín dụng xây dựng', lastPt('credit_construction')], ['Phát hành trái phiếu BĐS', monthRec(PUB.cbond_issuance?.records, r => fin(r.value))],
    ['Trái phiếu chậm trả (HNX)', (r => r ? (r.as_of_date ? {key: r.as_of_date, label: dmy(r.as_of_date)} : {key: r.date, label: my(r.date)}) : null)((PUB.cbond_cashflow?.records || []).filter(r => fin(r.late_payment_debt)).at(-1))],
    ['Giá thép CB300', lastPt('steel_price')], ['Giá xi măng PCB40', lastPt('cement_price')]],
  supply: () => [['Mở bán Hà Nội (CBRE)', lastQ(MH.hn_series, r => r.new_supply != null)], ['Mở bán TP.HCM (CBRE)', lastQ(MH.hcm_series, r => r.new_supply != null)],
    ['Cơ cấu nguồn cung', lastQ(MH.supply_detail, () => true)], ['Tỉnh lớn', lastQ(MH.provinces, () => true)]],
  output: () => [['Giao dịch, tồn kho (Bộ Xây dựng)', lastQ(MH.moc_quarterly, r => r.transactions_total != null)], ['Giá sơ cấp (CBRE)', lastQ([...(MH.hn_series || []), ...(MH.hcm_series || [])], r => r.price != null)],
    ['CPI nhà ở & VLXD', lastPt('cpi_housing_yoy')]],
};
function asOf(key) {
  const xs = (ASOF[key]?.() || []).filter(x => x[1]); if (!xs.length) return null;
  const top = xs.reduce((a, b) => b[1].key > a[1].key ? b : a);
  return {label: top[1].label, title: xs.map(([n, p]) => `${n}: ${p.label}`).join(' · ')};
}

// Ô số mới (28/11/2026) cho sub-tab chưa có ô: số lấy từ cùng chuỗi các chart trong sub-tab vẽ, kỳ và nguồn ghi trên ô.
function newTiles() {
  const out = {};
  const tile = (id, label, value, unit, delta, sub, spark, color) => {
    const k = el('div', 'kpi re-kpi', `<div class="label">${esc(label)}</div><div class="value">${esc(value)}${unit ? `<span class="unit" style="font-size:12px;font-weight:600;color:var(--muted,#6b7a90);margin-left:6px;letter-spacing:0">${esc(unit)}</span>` : ''}</div><div class="delta">${esc(delta || '')}</div><div class="sub">${esc(sub)}</div><div id="${id}"></div>`);
    k.dataset.reSpark = JSON.stringify((spark || []).filter(fin)); k.dataset.reColor = color || '#2938A8'; out[id] = k;
  };
  const yAgo = (rs, d) => rs.find(r => r.date.slice(0, 7) === String(+d.slice(0, 4) - 1) + d.slice(4, 7));
  { const rs = recs('gdp_re_q'), r = rs.at(-1), p = r && yAgo(rs, r.date), q = r && qOf(`Q${Math.ceil(+r.date.slice(5, 7) / 3)}/${r.date.slice(0, 4)}`);
    if (r) tile('spk-gdp', `GDP kinh doanh BĐS · ${q.label}`, nf(r.value / 1000, 1), 'nghìn tỷ VND', p ? `${sg((r.value / p.value - 1) * 100)}% so cùng kỳ (giá hiện hành)` : '', 'NSO · theo quý', rs.slice(-8).map(x => x.value), '#2938A8'); }
  { const rs = recs('steel_price'), r = rs.at(-1), p = r && yAgo(rs, r.date), s = SER('steel_price');
    if (r) tile('spk-steel', `Thép CB300 Hòa Phát · ${dmy(s.latest_observation || r.date)}`, nf(r.value, 2), 'nghìn đ/kg', p ? `${sg((r.value / p.value - 1) * 100)}% so cùng kỳ` : '', 'WiData · chưa VAT', rs.slice(-12).map(x => x.value), '#c29100'); }
  const by = (rows, q) => (rows || []).find(r => r.quarter === q) || {};
  const prevQ = (q, n) => { const [a, y] = [+q.slice(1, 2), +q.slice(-4)], i = y * 4 + a - 1 - n; return `Q${i % 4 + 1}/${Math.floor(i / 4)}`; };
  const hn = MH.hn_series || [], hcm = MH.hcm_series || [], moc = MH.moc_quarterly || [];
  { const r = hn.filter(x => x.new_supply != null).at(-1);
    if (r) { const p = by(hn, prevQ(r.quarter, 4)).new_supply; tile('spk-hn-launch', `Căn hộ mở bán mới Hà Nội · ${r.quarter}`, nf(r.new_supply), 'căn', fin(p) ? `${sg((r.new_supply / p - 1) * 100)}% so cùng kỳ (${prevQ(r.quarter, 4)}: ${nf(p)} căn)` : '', 'CBRE', hn.slice(-8).map(x => x.new_supply), '#2938A8'); } }
  { const r = hn.filter(x => x.absorption_pct != null).at(-1);
    if (r) { const p = by(hn, prevQ(r.quarter, 1)).absorption_pct; tile('spk-hn-abs', `Tỷ lệ hấp thụ căn hộ Hà Nội · ${r.quarter}`, nf(r.absorption_pct), '%', fin(p) ? `${prevQ(r.quarter, 1)}: ${nf(p)}%` : '', 'CBRE · cách tính lúc theo dự án mới, lúc toàn thị trường', hn.slice(-8).map(x => x.absorption_pct), '#59C5C8'); } }
  { const r = hcm.filter(x => x.new_supply != null).at(-1), nx = r && hcm.filter(x => qOf(x.quarter)?.key > qOf(r.quarter).key && x.new_supply == null).at(-1);
    if (r) { const p = by(hcm, prevQ(r.quarter, 1)).new_supply; tile('spk-hcm-launch', `Căn hộ mở bán mới TP.HCM · ${r.quarter}`, nf(r.new_supply), 'căn', fin(p) ? `${prevQ(r.quarter, 1)}: ${nf(p)} căn` : '', `CBRE · TP.HCM sau sáp nhập từ Q1/2026${nx ? ` · ${nx.quarter} chưa công bố` : ''}`, hcm.slice(-8).map(x => x.new_supply), '#59C5C8'); } }
  { const r = moc.filter(x => x.transactions_total != null).at(-1);
    if (r) { const p = by(moc, prevQ(r.quarter, 4)).transactions_total; tile('spk-tx', `Giao dịch thành công cả nước · ${r.quarter}`, nf(r.transactions_total / 1000, 1), 'nghìn giao dịch', fin(p) ? `${sg((r.transactions_total / p - 1) * 100)}% so cùng kỳ` : '', `Bộ Xây dựng${r.release_date ? ' · công bố ' + dmy(r.release_date) : ''}`, moc.slice(-8).map(x => x.transactions_total), '#2938A8'); } }
  { const r = moc.filter(x => x.inventory_total != null).at(-1);
    if (r) { const p = by(moc, prevQ(r.quarter, 1)).inventory_total; tile('spk-inv', `Tồn kho chủ đầu tư · ${r.quarter}`, nf(r.inventory_total), 'sản phẩm', fin(p) ? `${sg((r.inventory_total / p - 1) * 100)}% so quý trước` : '', `Bộ Xây dựng${r.provinces_reporting ? ` · ${r.provinces_reporting} tỉnh báo cáo` : ''} · số tỉnh đổi theo quý`, moc.slice(-8).map(x => x.inventory_total), '#861C52'); } }
  { const r = hn.filter(x => x.price != null && /VND/.test(x.price_unit || '')).at(-1);
    if (r) { const p1 = by(hn, prevQ(r.quarter, 1)).price, p4 = by(hn, prevQ(r.quarter, 4)).price; tile('spk-hn-price', `Giá căn hộ sơ cấp Hà Nội · ${r.quarter}`, nf(r.price), 'triệu đ/m²', [fin(p1) && `${prevQ(r.quarter, 1)}: ${nf(p1)}`, fin(p4) && `${prevQ(r.quarter, 4)}: ${nf(p4)}`].filter(Boolean).join(' · '), 'CBRE · chưa VAT, phí bảo trì', hn.filter(x => /VND/.test(x.price_unit || '')).slice(-8).map(x => x.price), '#2938A8'); } }
  return out;
}
const sparkNew = () => $$('.re-kpi').forEach(k => { const sp = k.querySelector('[id^="spk-"]'), v = JSON.parse(k.dataset.reSpark || '[]'); if (sp && v.length > 1 && typeof window.sparkline === 'function' && !sp.children.length) try { window.sparkline(sp.id, v, k.dataset.reColor); } catch (e) { /* ô vẫn có số */ } });

/* ---------- Giao diện riêng của engine (thanh, khung câu hỏi lấy từ app/sector-frame.css) ---------- */
function style() {
  const st = el('style'); st.id = 're-frame-style';
  st.textContent = `.of-lead{margin:6px 0 4px;font-size:14px;line-height:1.6;color:#3B4256}.of-lead b{color:#1F2A5C}.of-lead b.neg{color:#B3303F}.of-lead b.pos{color:#17784A}
/* Thang chữ thống nhất (theo Dầu khí) (26/11/2026): tiêu đề thẻ 16 · chữ thường 14 · chú thích 12.5; ba màu chữ */
body[data-re-frame] .majorpane{--of-t1:#1F2A5C;--of-t2:#3B4256;--of-t3:#6B7392}
body[data-re-frame] .majorpane :is(.chart-title,.card>h3,.card>h4,.card .research-detail>h3,.research-fold>summary,.business-model h3,.sectionhead h2.sec){font:700 16px/1.35 Inter,system-ui,sans-serif!important;color:var(--of-t1)!important;letter-spacing:-.005em}
body[data-re-frame] .majorpane :is(.business-models>h2,.research-roadmap>h2,.section>h2,.sectionhead h2){font:700 20px/1.3 Inter,system-ui,sans-serif!important;color:var(--of-t1)!important}
body[data-re-frame] .majorpane :is(.card p,.card li,.card td,.research-detail p,.business-model p){font-size:14px!important;line-height:1.55!important;color:var(--of-t2)!important}
body[data-re-frame] .majorpane :is(.card th,.chart-sub,.note,.source-note,.research-caption,.srcrow,.srcrow a,.pw-src,.card small,.ct-period label,.cts-legend button){font-size:12.5px!important;line-height:1.5!important;color:var(--of-t3)!important}
body[data-re-frame] .majorpane .card th{font-weight:600!important}
body[data-re-frame] .majorpane :is(.card td b,.card p b){color:var(--of-t1)!important}
body[data-re-frame] .majorpane .card [style*="font-size:12.5px"]{font-size:14px!important;color:var(--of-t2)!important}
body[data-re-frame] .majorpane .card td b.neg{color:#B3303F!important}body[data-re-frame] .majorpane .card td b.pos{color:#17784A!important}
body[data-re-frame] .re-cmp-old .company-trend,body[data-re-frame] .re-cmp-old .comparison-heading,body[data-re-frame] #pane-mt14 [data-block-id="bds-53"]{display:none!important}
body[data-re-frame] .majorpane .comparison-heading h2{color:#fff!important;background:none!important;box-shadow:none!important}
:root[data-theme=dark] body[data-re-frame] .majorpane{--of-t1:#E8EBFA;--of-t2:#C4C9E2;--of-t3:#9AA1BC}
/* Lưới thẻ trong Tổng quan, Chính sách, Tài chính ngành */
.of-body{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-items:start}.of-body>*{min-width:0;margin:0!important}
.of-body>.of-wide,.of-body>.of-gap,.of-body>details,.of-body>.kpis,.of-body>.research-grid,.of-body>table,.of-body>.tablewrap,.of-body>.of-span{grid-column:1/-1}
.of-body .card,.of-body .card *{min-width:0}.of-body>.card{display:flex;flex-direction:column;align-self:stretch;padding:18px 20px 12px!important}
.of-body .pw-src,.of-body .chart-source,.of-body .source-note,.of-body .srcrow{margin-top:6px!important;padding-top:6px!important}
@media (max-width:900px){.of-body{grid-template-columns:minmax(0,1fr)}}
.of-gap{padding:10px 12px;border:1px dashed var(--line,#d6dbe8);border-radius:10px;color:var(--muted,#6b7280);font-size:13px}
.of-rest{display:none!important}.of-hidden-legacy{display:none!important}.of-pane .research-roadmap>h2{display:none!important}
.of-next{display:inline-flex;align-items:center;gap:6px;margin:8px 0 0;padding:9px 18px;border:1px solid #C9D0EC;border-radius:999px;background:#fff;color:#2938A8;font:600 13.5px Inter,sans-serif;cursor:pointer;box-shadow:0 1px 2px rgba(31,42,92,.06);transition:.2s}.of-next:hover{background:#2938A8;color:#fff;border-color:#2938A8}
/* Câu hỏi: chart chính và chart phụ đứng cạnh nhau, "xem thêm" xuống hàng dưới (28/11/2026) */
.pp-panel.re-q{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:14px;align-items:start}
.pp-panel.re-q>*{min-width:0;grid-column:1/-1}.pp-panel.re-q>.re-half{grid-column:auto}
.pp-panel.re-q .card{margin:0 0 12px!important;padding:16px 18px 10px!important}
.re-grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.re-grid2>*{min-width:0}.re-grid2>:only-child,.re-grid2>.of-wide{grid-column:1/-1}
.re-q .of-gap{margin:0 0 12px}
.re-pp-sec>.sectionhead{margin-bottom:8px}
/* Thanh con Chính sách (như Điện › 06 Chính sách) */
html body .pp-subnav{position:sticky;top:calc(var(--of-top,0px) + 54px);z-index:5;display:flex;gap:6px;overflow-x:auto;scrollbar-width:thin;padding:8px 2px;margin:4px 0 12px;background:var(--fs-page,#F7F8FC)}
html body .pp-subnav button{flex:0 0 auto;font:600 12.5px/1.2 Inter,system-ui,sans-serif;padding:7px 12px;border-radius:999px;border:1px solid var(--line,#d6dbe8);background:var(--card,#fff);color:var(--ink2,#3b4256);cursor:pointer;white-space:nowrap}
html body .pp-subnav button span{color:var(--muted,#7a8399);margin-right:5px;font-weight:500}
html body .pp-subnav button[aria-selected=true]{background:#E3F5F5;border-color:#2a9fa3;color:#11393b;font-weight:700}
:root[data-theme=dark] .pp-subnav{background:#0A0A0A}:root[data-theme=dark] .pp-subnav button{background:#1F1F1F;color:#F5F5F5;border-color:#2A2A2A}
@media (max-width:900px){.pp-panel.re-q>.re-half{grid-column:1/-1}.re-grid2{grid-template-columns:minmax(0,1fr)}}`;
  document.head.append(st);
}

function wideIfTable(n) {
  if (!n.matches?.('.card')) return;
  const charts = n.querySelectorAll('[id^="ch"]').length;
  if (charts > 1 || (!charts && !n.querySelector('canvas,svg') && n.querySelector('table'))) n.classList.add('of-wide');
}
const isWide = n => n.matches('.of-wide,.fsv-heat') || (!n.querySelector('[id^="ch"],canvas,svg') && !!n.querySelector('table'));

/* ---------- Dời thẻ ---------- */
const used = new Set();
function take(sel) {
  const n = /^bds-/.test(sel) ? block(sel) : $(sel);
  if (!n || used.has(n) || [...used].some(u => u.contains(n))) return null;
  used.add(n); n.hidden = false; n.classList.remove('of-hidden-legacy', 'of-span'); n.style.marginTop = '';
  return n;
}
// Phần còn lại của pane cũ (thẻ chưa dời, khối có chart/bảng): giữ trong DOM, ẩn trong details.of-rest — không xóa.
function restOf(legacy, sec, host) {
  const items = [];
  legacy.forEach(n => {
    if (sec.contains(n) || n.isConnected === false) return;
    if (n.matches('.sectionhead,.pane-subtabs,.supply-tabs,.world-subtabs,[role=tablist]')) { n.classList.add('of-hidden-legacy'); return; }
    if (n.matches('.of-hidden-legacy')) return;
    if (n.matches('[data-block-id]') || n.querySelector('[data-block-id],canvas,table,svg')) items.push(n);
  });
  if (!items.length) return;
  const d = el('details', 'research-fold of-rest of-wide'); d.append(el('summary', '', 'Nội dung khác của bố cục cũ'));
  const box = el('div', 'research-detail'); items.forEach(n => { n.hidden = false; n.querySelectorAll('[hidden]').forEach(h => { if (h.matches('.supply-pane,.pane-subpane,[role=tabpanel]')) h.hidden = false; }); box.append(n); });
  d.append(box); host.append(d);
  box.querySelectorAll('.supply-pane,.pane-subpane').forEach(x => { if (!x.querySelector('[data-block-id],canvas,svg,table,.card')) x.classList.add('of-hidden-legacy'); });
  if (!box.querySelector('[data-block-id],canvas,svg,table,.card')) d.remove();
}
// Thẻ lẻ đứng một mình trước khối rộng (hoặc cuối) thì trải hết hàng.
function balance(body) {
  let run = []; const flush = () => { if (run.length % 2) run.at(-1).classList.add('of-span'); run = []; };
  [...body.children].forEach(n => { if (n.matches('.of-wide,.of-gap,details,.kpis,.research-grid,table,.tablewrap')) flush(); else run.push(n); }); flush();
}

const TABS = {};
const subBtn = (cls, num, label, small) => `<span>${num}</span>${esc(label)}${small != null ? `<small>${esc(small)}</small>` : ''}`;

/* ---------- Tổng quan ngành ---------- */
function buildOverview() {
  const pane = $('.majorpane[data-tab="mt1"]'); if (!pane) return null;
  const legacy = [...pane.children], sec = el('section', 'section of-section');
  const brief = $('#dataBrief'); if (brief) sec.append(brief);
  const nav = el('div', 'ov-nav'); nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', 'Tổng quan ngành'); sec.append(nav);
  const subs = OV.map((s, i) => {
    const num = String(i).padStart(2, '0');
    const b = el('button', 'tabbtn ov-tab', subBtn('', num, s.t, s.s)); b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.sub = s.k; b.id = `of-mt1-${s.k}-tab`;
    const p = el('div', 'pane-subpane pp-pane of-pane'); p.id = `of-mt1-${s.k}`; p.dataset.sub = s.k; p.dataset.reSub = s.k; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); b.setAttribute('aria-controls', p.id);
    p.append(el('header', 'pp-head', `<div><span class="pp-k">${num}</span><h2>${esc(s.t)}</h2><p>${esc(s.d)}</p></div>`));
    const body = el('div', 'of-body'); p.append(body);
    const put = n => { if (n) { body.append(n); wideIfTable(n); } };
    (s.sel || []).forEach(q => $$(q).forEach(n => { const t = used.has(n) ? null : (used.add(n), n); if (t) { put(t); t.classList.add('of-wide'); } }));
    s.ids.forEach(id => put(take(id)));
    nav.append(b); sec.append(p);
    b.addEventListener('click', () => open('mt1', s.k, true));
    b.addEventListener('keydown', e => arrows(e, nav, i));
    return {s, b, p, body};
  });
  TABS.mt1 = subs;
  return {pane, sec, legacy, rest: (subs.find(x => x.s.rest) || subs[0]).body};
}
function arrows(e, nav, i) { const d = {ArrowRight: 1, ArrowLeft: -1}[e.key]; if (!d) return; e.preventDefault(); const bs = [...nav.children], j = (i + d + bs.length) % bs.length; bs[j].click(); bs[j].focus(); }
// Tab Nguồn dữ liệu cũ (#mt8, research-layout dựng) → khối mở rộng cuối Bản đồ ngành (như Chăn nuôi); link cũ #mt8 mở thẳng khối này.
function sources(body) {
  const p = $('.majorpane[data-tab="mt8"]'); if (!p || !body) return;
  const d = el('details', 'research-fold re-sources of-wide'); d.id = 're-sources'; d.dataset.keepFolded = '';  // chart-unfold.js không mở sẵn d.append(el('summary', '', 'Nguồn dữ liệu, kỳ quan sát và độ tin cậy'));
  const box = el('div', 'research-detail');
  [...p.children].forEach(n => { if (n.matches('h2,.research-caption')) return; if (n.matches('.pane-subtabs,.supply-tabs')) { n.classList.add('of-hidden-legacy'); box.append(n); return; }
    n.querySelectorAll('[hidden]').forEach(h => { if (h.matches('.pane-subpane')) h.hidden = false; }); if (n.matches('.pane-subpane')) n.hidden = false; box.append(n); });
  if (!box.children.length) return;
  d.append(box); body.append(d);
}

/* ---------- Bức tranh ngành ---------- */
function question(it, num) {
  const p = el('section', 'pp-panel pp-q re-q'); p.id = it.id;
  p.innerHTML = `<header class="pp-ph"><span class="pp-num">${num}</span><div><h3>${esc(it.q)}</h3></div></header>`;
  const main = (it.main || []).map(take).filter(Boolean), sup = (it.sup || []).map(take).filter(Boolean), more = (it.more || []).map(take).filter(Boolean);
  if (!main.length) { const m = sup.shift() || more.shift(); if (m) main.push(m); }
  if (!main.length) return null;
  // Như Dien/app/power-picture.js qpanel (28/11/2026): đúng 1 chart chính (.pp-main), 1 chart phụ (.pp-sup1), còn lại "xem thêm" (.pp-more).
  more.unshift(...main.splice(1), ...sup.splice(1));
  const mw = el('div', 'pp-main'); mw.append(main[0]); p.append(mw);
  if (sup.length) { const sw = el('div', 'pp-sup1'); sw.append(sup[0]); p.append(sw); if (!isWide(main[0]) && !isWide(sup[0])) { mw.classList.add('re-half'); sw.classList.add('re-half'); } }
  if (more.length) { const g = el('div', more.length > 1 ? 'grid two g2 pp-sup pp-more re-grid2' : 'pp-sup1 pp-more'); more.forEach(c => g.append(c)); p.append(g); }
  if (it.gap) p.insertAdjacentHTML('beforeend', GAP(esc(it.gap)));
  return p;
}
function buildPicture(polBox) {
  const pane = $('.majorpane[data-tab="mt2"]'); if (!pane) return null;
  const legacy = [...pane.children], sec = el('section', 'section of-section re-pp-sec');
  sec.append(el('div', 'sectionhead', '<div><h2 class="sec">Bức tranh ngành</h2><p>Toàn thị trường → đầu vào (đất, vốn, chi phí) → nguồn cung, mở bán → giao dịch, giá, tồn kho → chính sách. Toàn cảnh chuỗi giá trị: <a href="#of-mt1-map">← Tổng quan ngành</a>.</p></div>'));
  const nav = el('div', 'pp-nav'); nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', 'Bức tranh ngành'); sec.append(nav);
  const tiles = newTiles(), kpiTile = id => tiles[id] || document.getElementById(id)?.closest('.kpi');
  const subs = PICT.map((s, i) => {
    const num = String(i + 1).padStart(2, '0');
    const b = el('button', 'tabbtn pp-tab', subBtn('', num, s.t)); b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.sub = s.k; b.id = `of-mt2-${s.k}-tab`;
    const p = el('div', 'pane-subpane pp-pane of-pane'); p.id = `of-mt2-${s.k}`; p.dataset.sub = s.k; p.dataset.reSub = s.k; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); b.setAttribute('aria-controls', p.id);
    const ao = s.pol ? null : asOf(s.k);
    p.append(el('header', 'pp-head', `<div><span class="pp-k">${num}</span><h2>${esc(s.t)}</h2><p>${esc(s.d)}</p></div><span class="pp-asof"${ao ? ` title="${esc(ao.title)}"` : ''}>${ao ? 'Dữ liệu mới nhất: ' + esc(ao.label) : ''}</span>`));
    if (s.pol) { p.append(polBox); }
    else {
      const g = el('section', 'grid kpis pp-kpis'); (s.kpis || []).forEach(id => { const t = kpiTile(id); if (t) { used.add(t); g.append(t); } }); if (g.children.length) p.append(g);
      if (s.flow) {
        const bar = el('nav', 'pp-flow'); bar.setAttribute('aria-label', 'Luồng ' + s.t.toLowerCase());
        bar.innerHTML = s.flow.map(([id, k, t], j) => `${j ? '<span class="pp-flow-ar" aria-hidden="true">→</span>' : ''}<a href="#re-st-${s.k}-${id}" class="pp-flow-s"><small>${esc(k)}</small><b>${esc(t)}</b></a>`).join('');
        p.append(bar);
      }
      let qn = 0;
      s.items.forEach(it => {
        if (it.grp) { p.append(el('h3', 'pp-grp', esc(it.grp))); return; }
        if (it.stage) { const f = s.flow.find(x => x[0] === it.stage); const h = el('div', 'pp-stage', `<span>${esc(f[1])}</span><h3>${esc(f[2])}</h3>`); h.id = `re-st-${s.k}-${f[0]}`; p.append(h); return; }
        if (it.link) { const [href, k, t, sub] = it.link; const a = el('a', 'th-link', `<small>Xem chart ở ${esc(k)}</small><b>${esc(t)} →</b><span>${esc(sub)}</span>`); a.href = href; p.append(a); return; }
        const q = question(it, `${i + 1}.${qn + 1}`); if (q) { qn++; p.append(q); }
      });
      // Nhóm không còn câu hỏi nào thì bỏ tiêu đề nhóm.
      p.querySelectorAll('.pp-grp').forEach(h => { let n = h.nextElementSibling; if (!n || n.matches('.pp-grp')) h.remove(); });
    }
    const nx = PICT[i + 1]; if (nx) { const go = el('button', 'of-next', `Tiếp: ${esc(nx.t)} →`); go.type = 'button'; go.addEventListener('click', () => { open('mt2', nx.k, true); nav.scrollIntoView({behavior: 'smooth', block: 'start'}); }); p.append(go); }
    nav.append(b); sec.append(p);
    b.addEventListener('click', () => open('mt2', s.k, true));
    b.addEventListener('keydown', e => arrows(e, nav, i));
    return {s, b, p};
  });
  TABS.mt2 = subs;
  return {pane, sec, legacy, rest: sec};
}
// Chính sách: thẻ con theo văn bản, nội dung lấy từ pane #mt4 cũ (style của chuyên đề Luật mới chuyển lên <head> trước khi dời).
function buildPolicy() {
  const pane = $('.majorpane[data-tab="mt4"]');
  if (pane) pane.querySelectorAll('style').forEach(st => document.head.append(st));
  const legacy = pane ? [...pane.children] : [], box = el('div', 're-pol');
  const nav = el('div', 'pp-subnav'); nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', 'Chính sách theo văn bản'); box.append(nav);
  const subs = POL.map((s, i) => {
    const num = String(i + 1).padStart(2, '0');
    const b = el('button', '', subBtn('', num, s.t)); b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.pol = s.k; b.id = `of-mt4-${s.k}-tab`;
    const p = el('div', 'pane-subpane re-pol-pane'); p.id = `of-mt4-${s.k}`; p.dataset.pol = s.k; p.dataset.rePol = s.k; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); b.setAttribute('aria-controls', p.id);
    const body = el('div', 'of-body'); p.append(body);
    s.ids.forEach(id => { const n = take(id); if (n) { body.append(n); wideIfTable(n); } });
    if (!body.children.length) body.insertAdjacentHTML('beforeend', GAP('Chưa có dữ liệu cho mục này.'));  // re-legal.js thay bằng tóm tắt
    nav.append(b); box.append(p);
    b.addEventListener('click', () => openPol(s.k, true));
    b.addEventListener('keydown', e => arrows(e, nav, i));
    return {s, b, p, body};
  });
  TABS.pol = subs;
  return {pane, box, legacy, rest: (subs.find(x => x.s.rest) || subs[0]).body};
}
function policyFix() {
  $('#of-mt4-law')?.classList.add('law-2026');
  ['bds-44', 'bds-60', 'bds-57', 'bds-58', 'bds-59', 'bds-19', 'bds-20', 'bds-21'].forEach(id => { const n = block(id); if (n) { n.classList.add('of-wide'); n.classList.remove('of-span'); } });  // thẻ chữ/sơ đồ cần cả hàng
  const unfold = () => $$('.re-pol details:not(.note-icon):not(.of-rest)').forEach(d => { if (!d.closest('.tablewrap,.source-note,.of-rest')) d.open = true; });
  [0, 400, 1500].forEach(t => setTimeout(unfold, t));
}
// Ngày dữ liệu của Chính sách = văn bản mới nhất đã thông qua (bảng "Mới duyệt" do re-legal.js dựng), không lấy ngày hiệu lực tương lai.
function policyAsOf() {
  const s = $('#of-mt2-policy .pp-asof'); if (!s) return;
  const today = new Date().toISOString().slice(0, 10);
  const ds = $$('.re-recent tbody td:first-child, #of-mt4-docs td').map(td => /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(td.textContent.trim())).filter(Boolean).map(m => `${m[3]}-${m[2]}-${m[1]}`).filter(d => d <= today).sort();
  if (ds.length) { s.textContent = 'Dữ liệu mới nhất: ' + dmy(ds.at(-1)); s.title = 'Văn bản mới thông qua gần nhất'; }
}

/* ---------- Tài chính ngành ---------- */
function financePane() {
  let p = $('.majorpane[data-tab="mt14"]');
  if (!p) { p = el('section', 'majorpane'); p.dataset.tab = 'mt14'; p.id = 'pane-mt14'; p.hidden = true; ($('.majorpane[data-tab="mt7"]') || $('.majorpane:last-of-type')).before(p); }
  const sec = el('section', 'section');
  sec.append(el('div', 'sectionhead', '<div><h2 class="sec">Tài chính ngành</h2><p>Số liệu tài chính của 13 doanh nghiệp BĐS dân cư niêm yết, tổng hợp theo nhóm, từ BCTC hợp nhất quý.</p></div>'));
  const host = el('div', 'of-fin of-wide'); host.id = 're-fin-root';
  const fnav = el('div', 'pp-nav'); fnav.setAttribute('role', 'tablist'); fnav.setAttribute('aria-label', 'Tài chính ngành'); sec.append(fnav);
  const subs = FIN.map(([k, t, d], i) => {
    const num = String(i + 1).padStart(2, '0');
    const b = el('button', 'tabbtn pp-tab', subBtn('', num, t)); b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.sub = k; b.id = `of-mt14-${k}-tab`;
    const sp = el('div', 'pane-subpane pp-pane of-pane'); sp.id = `of-mt14-${k}`; sp.dataset.sub = k; sp.dataset.reSub = k; sp.setAttribute('role', 'tabpanel'); sp.setAttribute('aria-labelledby', b.id); b.setAttribute('aria-controls', sp.id);
    sp.append(el('header', 'pp-head', `<div><span class="pp-k">${num}</span><h2>${esc(t)}</h2><p>${esc(d)}</p></div>`));
    const body = el('div', 'of-body'); sp.append(body); fnav.append(b); sec.append(sp);
    b.addEventListener('click', () => open('mt14', k, true));
    b.addEventListener('keydown', e => arrows(e, fnav, i));
    return {s: {k, t}, b, p: sp, body};
  });
  subs[0].body.append(host);
  // 02 Doanh nghiệp niêm yết: mô hình và biến quyết định từng mã (bds-03, dời từ Tổng quan) → 7 mục so sánh từng mã (ReFinance.buildCompare)
  // → bảng tổng hợp cũ (gấp) → P/B rổ mã cuối cùng (bds-17, như P/E rổ th-03 của Thép).
  const cb = subs[1].body;
  { const n = take('bds-03'); if (n) { n.classList.add('of-wide'); cb.append(n); } }
  { const cr = el('div', 'of-wide re-cmp-root'); cr.id = 're-cmp-root'; cb.append(cr); }
  { const vr = el('div', 'of-wide re-val-root'); vr.id = 're-val-root'; subs[2].body.append(vr); }
  // bds-53 (backlog cover cũ) trùng mục 2.5 mới: ẩn, không xóa.
  { const bl = take('bds-53'); if (bl) { bl.hidden = true; bl.classList.add('of-hidden-legacy'); cb.append(bl); } }
  { const d = el('details', 'research-fold of-wide re-cmp-old su-open'); d.hidden = true; d.append(el('summary', '', 'Bảng tổng hợp: chỉ số tài chính và định giá từng mã'));
    const box = el('div', 'research-detail'); d.append(box); cb.append(d);
    d.addEventListener('toggle', () => { if (d.open) [50, 300].forEach(t => setTimeout(() => window.dispatchEvent(new Event('resize')), t)); });
    // Khối cũ (financial-comparison.js) dựng muộn hơn khung này: gấp vào khi nó xuất hiện.
    const fold = () => { const fc = $('.financial-comparison'); if (fc && !box.contains(fc)) { fc.classList.remove('of-span'); box.append(fc); d.hidden = false; } return !!fc; };
    if (!fold()) { const mo = new MutationObserver(() => { if (fold()) mo.disconnect(); }); mo.observe(document.body, {childList: true, subtree: true}); setTimeout(() => mo.disconnect(), 20000); } }
  { const n = take('bds-17'); if (n) { n.classList.add('of-wide'); cb.append(n); } }
  p.replaceChildren(sec);
  TABS.mt14 = subs;
  return host;
}

/* ---------- Điều hướng ---------- */
let bar, finHost, finBuilt = false;
function setUrl(key, sub, pol, push) {
  const u = new URL(location.href);
  if (sub) u.searchParams.set('sub', sub); else u.searchParams.delete('sub');
  if (pol) u.searchParams.set('pol', pol); else u.searchParams.delete('pol');
  u.hash = key;
  const next = u.pathname + u.search + u.hash; if (next === location.pathname + location.search + location.hash) return;
  history[push ? 'pushState' : 'replaceState']({re: 1}, '', next);
}
function showMajor(key) {
  $$('.majorpane').forEach(p => { const on = p.dataset.tab === key; p.hidden = !on; p.classList.toggle('active', on); });
  [...bar.children].forEach(b => { const on = b.dataset.tab === key; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
  if (key === 'mt14' && !finBuilt && window.ReFinance) { finBuilt = true; setTimeout(() => window.ReFinance.build(finHost), 30); }  // dựng khi tab hiện để đo đúng chiều rộng chart
  setTimeout(() => window.dispatchEvent(new Event('resize')), 30);
}
function open(key, sub, push) {
  const subs = TABS[key]; if (!subs) return;
  const hit = subs.find(x => x.s.k === sub) || subs[0];
  subs.forEach(x => { const on = x === hit; x.b.setAttribute('aria-selected', String(on)); x.b.classList.toggle('active', on); x.b.tabIndex = on ? 0 : -1; x.p.hidden = !on; });
  const nb = hit.b.parentElement; if (nb && nb.scrollWidth > nb.clientWidth) nb.scrollLeft = Math.max(0, hit.b.offsetLeft - 12);
  const pol = key === 'mt2' && hit.s.k === 'policy' ? (TABS.pol?.find(x => !x.p.hidden) || TABS.pol?.[0])?.s.k : null;
  if (push != null) setUrl(key, hit.s.k, pol, push);
  setTimeout(() => window.dispatchEvent(new Event('resize')), 30);
}
function openPol(k, push) {
  const subs = TABS.pol; if (!subs) return;
  const hit = subs.find(x => x.s.k === k) || subs[0];
  subs.forEach(x => { const on = x === hit; x.b.setAttribute('aria-selected', String(on)); x.b.tabIndex = on ? 0 : -1; x.p.hidden = !on; });
  if (push != null) setUrl('mt2', 'policy', hit.s.k, push);
  setTimeout(() => window.dispatchEvent(new Event('resize')), 30);
}
// Mở tới một phần tử (thẻ, câu hỏi, khâu) ở bất kỳ tab nào: tab lớn → sub-tab → thẻ con Chính sách → mở details → cuộn.
function goTo(t, push = true, smooth = false) {
  const pane = t?.closest('.majorpane'); if (!pane) return false;
  const key = pane.dataset.tab; showMajor(key);
  const sub = t.closest('[data-re-sub]'), pol = t.closest('[data-re-pol]');
  if (sub) open(key, sub.dataset.reSub, null);
  if (pol) openPol(pol.dataset.rePol, null);
  setUrl(key, sub?.dataset.reSub, pol?.dataset.rePol || (sub?.dataset.reSub === 'policy' ? TABS.pol?.find(x => !x.p.hidden)?.s.k : null), push);
  for (let d = t.closest('details'); d; d = d.parentElement?.closest('details')) if (!d.matches('.of-rest')) d.open = true;
  if (!t.matches('.pp-pane,.re-pol-pane')) setTimeout(() => t.scrollIntoView({behavior: smooth ? 'smooth' : 'instant', block: 'start'}), 80);
  return true;
}
// Đọc URL (vào trang, Back/Forward, đổi hash): #mtN (+ ?sub=, ?pol=) → link cũ (ALIAS, SUBALIAS) → #<id> phần tử đã dời.
function route() {
  const u = new URL(location.href), h = location.hash.slice(1) || 'mt1';
  if (!/^mt\d+$/.test(h)) { const t = document.getElementById(h); if (t && goTo(t, false)) return; }
  let key = /^mt\d+$/.test(h) ? h : 'mt1', sub = u.searchParams.get('sub'), pol = u.searchParams.get('pol'), target = null, moved = false;
  if (ALIAS[key]) { const [k, s, t, p] = ALIAS[key]; if (key === 'mt4' && sub && POL.some(x => x.k === sub)) pol = sub; key = k; sub = s || null; target = t || null; pol = p || pol; moved = true; }
  const sa = SUBALIAS[key]?.[sub]; if (sa) { const [k, s, t, p] = sa; key = k; sub = s; target = target || t || null; pol = p || pol; moved = true; }
  if (!ROUTES.some(r => r[0] === key)) { key = 'mt1'; sub = null; }
  showMajor(key);
  if (TABS[key]) { open(key, sub, null); if (key === 'mt2' && (TABS.mt2.find(x => !x.p.hidden)?.s.k === 'policy')) openPol(pol, null); }
  const cur = TABS[key]?.find(x => !x.p.hidden)?.s.k || null;
  setUrl(key, cur, cur === 'policy' ? TABS.pol?.find(x => !x.p.hidden)?.s.k : null, false);
  if (target) { const t = document.getElementById(target); if (t) { if (t.matches('details')) t.open = true; setTimeout(() => t.scrollIntoView({behavior: 'instant', block: 'start'}), 120); } }
  return moved;
}
function nav() {
  bar = $('nav.majortabs') || $('.majortabbtn')?.parentElement; if (!bar) return;
  bar.replaceChildren();
  ROUTES.forEach(([key, label], i) => {
    const b = el('button', 'majortabbtn', label); b.type = 'button'; b.dataset.tab = key; b.id = 'research-tab-' + key; b.setAttribute('role', 'tab');
    const p = $(`.majorpane[data-tab="${key}"]`); if (p) { p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); b.setAttribute('aria-controls', p.id); }
    b.addEventListener('click', () => {
      showMajor(key);
      if (TABS[key]) { const cur = TABS[key].find(x => !x.p.hidden) || TABS[key][0]; open(key, cur.s.k, true); } else setUrl(key, null, null, true);
      window.scrollTo({top: 0, behavior: 'instant'});
    });
    b.addEventListener('keydown', e => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return; e.preventDefault();
      const j = e.key === 'Home' ? 0 : e.key === 'End' ? ROUTES.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : ROUTES.length - 1)) % ROUTES.length; bar.children[j].click(); bar.children[j].focus(); });
    bar.append(b);
  });
  bar.setAttribute('role', 'tablist');
  window.showMajorTab = k => { location.hash = k; };
  window.addEventListener('popstate', () => route());
  window.addEventListener('hashchange', () => route());
  route();
  // Link "#<id>" tới thẻ/câu hỏi/khâu đã dời: mở đúng tab lớn + sub-tab rồi cuộn tới; thanh luồng cùng sub-tab chỉ cuộn.
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'); if (!a || a.matches('.re-lg-go')) return;
    const id = a.getAttribute('href').slice(1); if (!id || /^mt\d+$/.test(id)) return;
    const t = document.getElementById(id); if (!t || !t.closest('.majorpane') || t.matches('.majorpane')) return;
    e.preventDefault(); goTo(t, true, !!a.closest('.pp-flow'));
  });
}
window.ReFrame = {open: (key, sub) => { showMajor(key); open(key, sub, true); }, policy: k => { showMajor('mt2'); open('mt2', 'policy', null); openPol(k, true); $('#of-mt2-policy')?.scrollIntoView({behavior: 'smooth', block: 'start'}); }, goTo: id => goTo(document.getElementById(id))};

// Thanh sub-tab dính ngay dưới thanh tab chính khi cuộn.
function stickySub() {
  const set = () => { const m = $('nav.majortabs'); if (!m) return; const cs = getComputedStyle(m); const top = cs.position === 'sticky' ? (parseFloat(cs.top) || 0) + m.offsetHeight + 4 : 0; document.documentElement.style.setProperty('--of-top', top + 'px'); };
  set(); window.addEventListener('resize', set); setTimeout(set, 1500);
}

// Thẻ chỉ có một nội dung thì không gập (bỏ lớp research-fold, hiện tiêu đề gốc).
function unfoldCards(ids) {
  const go = () => ids.forEach(id => { const card = block(id); if (!card) return; card.querySelectorAll(':scope > details.research-fold').forEach(f => { const body = f.querySelector(':scope > .research-detail') || f; f.replaceWith(...[...body.childNodes].filter(n => n.tagName !== 'SUMMARY')); }); card.querySelectorAll('.research-repeated-heading').forEach(h => h.classList.remove('research-repeated-heading')); });
  go(); [800, 3000].forEach(t => setTimeout(go, t));
}

// ===== Tổng quan › 01 Mô hình kinh doanh (26/11/2026, người dùng chọn phương án A + C) =====
// A. Vòng đời tiền của một dự án: sơ đồ 5 bước + chart thật từ BCTC (người mua trả trước dẫn trước doanh thu).
// C. Bảng mô hình theo mã: phân khúc, quỹ đất (link nguồn), cơ cấu nguồn vốn, tồn kho và tiền trả trước so doanh thu 4 quý.
const LAND = {VHM: [29500, '31/12/2025', 'https://nguoiquansat.vn/he-lo-quy-dat-khung-vinhomes-dang-so-huu-298206.html'],
  NVL: [10600, '08/2026', 'https://nhadautu.vn/novaland-hon-57-du-an-cho-giai-doan-2027-2032-aqua-city-la-khoi-dau-d107095.html'],
  PDR: [6655, '31/12/2025', 'https://nguoiquansat.vn/phat-dat-pdr-du-kien-mo-ban-4-du-an-moi-tai-tp-hcm-286381.html'],
  CEO: [1100, '04/2026', 'https://nguoiquansat.vn/chu-tich-ceo-group-noi-ve-co-hoi-nghin-nam-co-mot-quy-dat-1-100ha-san-sang-cho-20-du-an-moi-288142.html'],
  DIG: [820, 'BCTN 2025', 'https://stockbiz.vn/tin-tuc/dig-dic-group-tinh-chuyen-mo-rong-quy-dat/42835718'],
  NLG: [681, '06/2026', 'https://nguoiquansat.vn/nam-long-nlg-va-chu-ky-tang-truong-moi-tu-quy-dat-681ha-298702.html'],
  KDH: [662.5, '11/2026', 'https://nguoiquansat.vn/khang-dien-kdh-he-lo-ke-hoach-phat-trien-121-000-can-nha-tai-tp-hcm-328540.html'],
  AGG: [34, '06/2026 · tự cộng 4 dự án', 'https://nhadautu.vn/bds-an-gia-loi-nhuan-2026-chu-yeu-tu-hop-nhat-the-gio-riverside-d105973.html'],
  DXG: [null, 'không công bố tổng', 'https://elibook.vn/2026/09/08/dxg-loi-nhuan-cot-loi-chi-con-7-ty-co-dong-thieu-so-am-63-mieng-banh-nghi-quyet-21-co-phai-con-bai-cuu-canh/'],
  TCH: [null, 'không công bố tổng', 'https://nhadautu.vn/hoang-huy-phu-song-thi-truong-bat-dong-san-hai-phong-d107167.html'],
  NTL: [null, 'không công bố tổng', 'https://tapchicongthuong.vn/do-thi-tu-liem--ntl--bat-tay-voi-tap-doan-ha-do--hdg--xay-thap-doi-47-tang-tai-khu-do-thi-dich-vong-123539.htm']};
window.RE_LAND = LAND;  // dùng lại ở Tài chính ngành › 03 Định giá (bảng Bán hàng, quỹ đất và RNAV)
const SEG = {VHM: 'Đại đô thị, mọi phân khúc · cả nước · bán lẻ và bán buôn dự án', NVL: 'Đô thị sinh thái, nghỉ dưỡng · Đồng Nai, Bình Thuận, Vũng Tàu', KDH: 'Nhà phố, căn hộ trung–cao cấp · TP.HCM',
  NLG: 'Nhà ở vừa túi tiền · TP.HCM, Long An, Đồng Nai', DXG: 'Căn hộ trung cấp · Bình Dương cũ; kèm môi giới (DXS)', PDR: 'Căn hộ, đất nền · Bình Dương, Bình Định',
  DIG: 'Khu đô thị, nghỉ dưỡng · Vũng Tàu, Đồng Nai', CEO: 'Đất nền, nghỉ dưỡng · Phú Quốc, Hà Nội', AGG: 'Căn hộ trung cấp · TP.HCM', TCH: 'Căn hộ · Hải Phòng', NTL: 'Khu đô thị · Hà Nội, Quảng Ninh'};
const FINSRC = '<a href="https://api-finfo.vndirect.com.vn/v4/financial_statements" target="_blank" rel="noopener">BCTC hợp nhất quý (VNDirect finfo)</a>';
function modelTab() {
  const host = $('#of-mt1-model .of-body'), D = window.RE_FIN; if (!host || !D || $('#re-cashlife')) return;
  const P = D.periods, n = P.length, nf = (v, d = 0) => v == null || !isFinite(v) ? '—' : v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d});
  const v = (t, k, i) => D.data[t]?.[k]?.[i] ?? null;
  const sum = (ts, k, i) => { let a = 0, ok = 0; ts.forEach(t => { const x = v(t, k, i); if (x != null) { a += x; ok++; } }); return ok ? a : null; };
  const ttm = (ts, k, i) => i < 3 ? null : [0, 1, 2, 3].reduce((a, j) => { const x = sum(ts, k, i - j); return a == null || x == null ? null : a + x; }, 0);
  const ql = p => `Q${p.slice(-1)}/${p.slice(2, 4)}`;
  // A. Sơ đồ
  const steps = [['01', 'Đất & pháp lý', 'Trả tiền đất, bồi thường, tiền sử dụng đất', 'Tồn kho tăng · CFO âm', 'out'],
    ['02', 'Xây dựng & mở bán', 'Vay ngân hàng, trái phiếu; nhận đặt cọc', 'Nợ vay tăng', 'out'],
    ['03', 'Thu tiền theo tiến độ', 'Người mua đóng tiền theo tiến độ xây dựng', 'Người mua trả trước tăng · CFO dương', 'in'],
    ['04', 'Bàn giao', 'Giao nhà, người mua trả trước chuyển thành doanh thu', 'Doanh thu, lợi nhuận ghi nhận', 'rec'],
    ['05', 'Cấp sổ, thu nốt', 'Thu phần còn lại khi cấp giấy chứng nhận', 'Phải thu giảm', 'rec']];
  const a = el('div', 'card of-wide'); a.id = 're-cashlife'; a.dataset.ofAdded = 're-cashlife';
  a.innerHTML = `<div class="chart-title">Vòng đời tiền của một dự án nhà ở</div><div class="chart-sub">Tiền chi ra trước, tiền khách trả vào giữa, lợi nhuận ghi nhận sau cùng · mỗi bước hiện lên BCTC ở khoản nào</div>
    <div class="cl-flow">${steps.map(([k, t, d, b, c]) => `<div class="cl-step ${c}"><span class="cl-n">${k}</span><b>${t}</b><p>${d}</p><em>${b}</em></div>`).join('')}</div>
    <div class="cl-key"><span class="out">Tiền ra</span><span class="in">Tiền vào</span><span class="rec">Ghi nhận lợi nhuận</span></div>
    <div class="cl-ctl" role="group" aria-label="Nhóm"><button type="button" data-g="all" aria-pressed="true">Tất cả chủ đầu tư</button><button type="button" data-g="mega" aria-pressed="false">Đại đô thị, quỹ đất lớn</button><button type="button" data-g="urban" aria-pressed="false">Nhà ở đô thị lớn</button><button type="button" data-g="prov" aria-pressed="false">Đất nền &amp; tỉnh</button></div>
    <div style="position:relative;height:320px"><canvas id="chCashLife" role="img" aria-label="Người mua trả trước, doanh thu 4 quý và CFO 4 quý"></canvas></div>
    <p class="of-lead" id="re-cashlife-lead"></p>
    <div class="pw-src">Nguồn: ${FINSRC} · người mua trả trước là số dư cuối quý (ngắn hạn); doanh thu và CFO cộng 4 quý gần nhất; tỷ đồng</div>`;
  host.prepend(a);
  // 27/11/2026: nhóm theo mô hình kinh doanh (cùng data/re-financials.js), không tách VHM ↔ phần còn lại.
  const G = {all: ['VHM', 'NVL', 'KDH', 'NLG', 'DXG', 'AGG', 'PDR', 'DIG', 'CEO', 'TCH', 'NTL'], mega: ['VHM', 'NVL'], urban: ['KDH', 'NLG', 'DXG', 'AGG'], prov: ['PDR', 'DIG', 'CEO', 'TCH', 'NTL']};
  const GN = {all: '11 chủ đầu tư', mega: 'Nhóm đại đô thị (VHM, NVL)', urban: 'Nhóm nhà ở đô thị lớn', prov: 'Nhóm đất nền & tỉnh'};
  let ch;
  const draw = g => { const ts = G[g], from = Math.max(3, P.indexOf('2020Q1')), idx = [...Array(n - from)].map((_, j) => from + j);
    const adv = idx.map(i => sum(ts, 'adv_customers', i)), rev = idx.map(i => ttm(ts, 'revenue', i)), cfo = idx.map(i => ttm(ts, 'cfo', i));
    ch?.destroy(); if (!window.Chart) return;
    ch = new Chart($('#chCashLife'), {data: {labels: idx.map(i => ql(P[i])), datasets: [
      {type: 'line', label: 'Người mua trả trước (số dư)', data: adv, borderColor: '#2BA5A8', backgroundColor: '#2BA5A8', borderWidth: 2.5, pointRadius: 0, tension: .25},
      {type: 'line', label: 'Doanh thu 4 quý', data: rev, borderColor: '#2938A8', backgroundColor: '#2938A8', borderWidth: 2.5, pointRadius: 0, tension: .25},
      {type: 'bar', label: 'CFO 4 quý', data: cfo, backgroundColor: cfo.map(x => x != null && x < 0 ? 'rgba(229,72,77,.45)' : 'rgba(43,182,115,.4)'), borderRadius: 3}]},
      options: {responsive: true, maintainAspectRatio: false, animation: false, interaction: {mode: 'index', intersect: false},
        plugins: {legend: {position: 'bottom', labels: {usePointStyle: true, boxWidth: 8, color: '#3B4256', font: {size: 12.5}}}, tooltip: {callbacks: {label: c => ` ${c.dataset.label}: ${nf(c.parsed.y)} tỷ đ`}}},
        scales: {x: {grid: {display: false}, ticks: {color: '#6B7392', maxTicksLimit: 10, maxRotation: 0}}, y: {grid: {color: '#EEF0F6'}, ticks: {color: '#6B7392', callback: x => nf(x)}}}}});
    const L = n - 1, Y = n - 5, r = (x, y) => x != null && y ? x / y : null;
    const b1 = r(sum(ts, 'adv_customers', L), ttm(ts, 'revenue', L)), b0 = r(sum(ts, 'adv_customers', Y), ttm(ts, 'revenue', Y));
    $('#re-cashlife-lead').innerHTML = `${GN[g]} đang giữ <b>${nf(sum(ts, 'adv_customers', L) / 1000, 1)} nghìn tỷ</b> tiền khách trả trước, bằng <b>${nf(b1, 2)} lần</b> doanh thu 4 quý (cùng kỳ ${nf(b0, 2)} lần): đây là phần doanh thu sẽ ghi nhận khi bàn giao. CFO 4 quý <b class="${ttm(ts, 'cfo', L) < 0 ? 'neg' : 'pos'}">${nf(ttm(ts, 'cfo', L))} tỷ đ</b>.`; };
  a.querySelectorAll('.cl-ctl button').forEach(b => b.addEventListener('click', () => { a.querySelectorAll('.cl-ctl button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); draw(b.dataset.g); }));
  draw('all');
  let cur = 'all'; a.querySelectorAll('.cl-ctl button').forEach(b => b.addEventListener('click', () => { cur = b.dataset.g; }));
  $('#of-mt1-model-tab')?.addEventListener('click', () => setTimeout(() => draw(cur), 60));
  // C. Bảng mô hình theo mã
  const L = n - 1, rows = Object.keys(SEG).map(t => { const debt = (v(t, 'st_debt', L) || 0) + (v(t, 'lt_debt', L) || 0), adv = v(t, 'adv_customers', L) || 0, eq = v(t, 'equity', L) || 0, tot = debt + adv + eq, rev = ttm([t], 'revenue', L);
    return {t, debt: debt / tot * 100, adv: adv / tot * 100, eq: eq / tot * 100, inv: rev > 0 ? v(t, 'inventory', L) / rev : null, bl: rev > 0 ? adv / rev : null, land: LAND[t]}; }).sort((x, y) => (y.land[0] ?? -1) - (x.land[0] ?? -1));
  const c = el('div', 'card of-wide'); c.id = 're-model-table';
  const bar = r => `<div class="mt-bar" title="Nợ vay ${nf(r.debt)}% · khách trả trước ${nf(r.adv)}% · VCSH ${nf(r.eq)}%"><i class="d" style="width:${r.debt}%"></i><i class="a" style="width:${r.adv}%"></i><i class="e" style="width:${r.eq}%"></i></div><small>${nf(r.debt)} · ${nf(r.adv)} · ${nf(r.eq)}</small>`;
  c.innerHTML = `<div class="chart-title">Mô hình kinh doanh theo doanh nghiệp</div><div class="chart-sub">Xếp theo quỹ đất · nguồn vốn, tồn kho và tiền trả trước tính từ BCTC ${ql(P[L])}</div>
    <div class="tablewrap"><table class="mt-table" data-no-fold><thead><tr><th>Mã</th><th>Phân khúc · thị trường chính</th><th>Quỹ đất (ha)</th><th>Nguồn vốn: nợ vay · khách trả trước · VCSH (%)</th><th>Tồn kho ÷ doanh thu 4Q (lần)</th><th>Khách trả trước ÷ doanh thu 4Q (lần)</th></tr></thead><tbody>
    ${rows.map(r => `<tr><td><b>${r.t}</b></td><td>${SEG[r.t]}</td><td><a href="${r.land[2]}" target="_blank" rel="noopener">${r.land[0] == null ? '—' : nf(r.land[0], r.land[0] < 100 ? 1 : 0)}</a><small> ${r.land[1]}</small></td><td>${bar(r)}</td><td>${nf(r.inv, 1)}</td><td>${nf(r.bl, 2)}</td></tr>`).join('')}</tbody></table></div>
    <div class="cl-key"><span class="d">Nợ vay</span><span class="a">Khách trả trước</span><span class="e">Vốn chủ sở hữu</span></div>
    <div class="pw-src">Nguồn: quỹ đất theo link từng dòng, số doanh nghiệp công bố hoặc báo dẫn lại, cách tính khác nhau giữa các mã · nguồn vốn, tồn kho, khách trả trước: ${FINSRC}. Tồn kho ÷ doanh thu cao nghĩa là cần nhiều năm bán theo tốc độ hiện tại; doanh thu 4 quý âm hoặc bằng 0 để trống.</div>`;
  a.after(c);
  const st = el('style'); st.textContent = `.cl-flow{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin:12px 0 6px}
.cl-step{position:relative;padding:12px 12px 10px;border-radius:12px;border:1px solid #E6E9F2;border-top:4px solid #9AA1BC;background:#FAFBFE}.cl-step b{display:block;font:700 14px Inter,sans-serif;color:#1F2A5C;margin:2px 0 4px}
.cl-step p{margin:0 0 6px;font-size:13px!important;line-height:1.45!important}.cl-step em{font-style:normal;font-size:12px;font-weight:600;color:#3B4256}.cl-n{font:700 11px Inter,sans-serif;color:#9AA1BC}
.cl-step.out{border-top-color:#E5484D}.cl-step.in{border-top-color:#2BA5A8}.cl-step.rec{border-top-color:#2938A8}
.cl-key{display:flex;gap:16px;flex-wrap:wrap;margin:6px 0 10px;font-size:12px;color:#5A6385}.cl-key span::before{content:'';display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px;vertical-align:-1px;background:#9AA1BC}
.cl-key .out::before,.cl-key .d::before{background:#E5484D}.cl-key .in::before,.cl-key .a::before{background:#2BA5A8}.cl-key .rec::before,.cl-key .e::before{background:#2938A8}
.cl-ctl{display:flex;gap:8px;margin:8px 0}.cl-ctl button{padding:6px 14px;border:1px solid #D6DBEA;border-radius:999px;background:#fff;font:600 13px Inter,sans-serif;color:#3D4566;cursor:pointer}.cl-ctl button[aria-pressed=true]{background:#1F2677;border-color:#1F2677;color:#fff}
.mt-bar{display:flex;height:12px;border-radius:6px;overflow:hidden;min-width:140px;background:#EEF0F6}.mt-bar i{display:block;height:100%}.mt-bar .d{background:#E5484D}.mt-bar .a{background:#2BA5A8}.mt-bar .e{background:#2938A8}
.mt-table td small{color:#6B7392;font-size:11.5px}
@media (max-width:900px){.cl-flow{grid-template-columns:1fr}}`; document.head.append(st);
}

function run() {
  if (document.body.dataset.reFrame) return; document.body.dataset.reFrame = '1';
  style();
  stickySub();
  HIDE.forEach(id => $$(`[data-block-id="${id}"]`).forEach(n => { n.hidden = true; n.classList.add('of-hidden-legacy'); }));
  HIDE_SEL.forEach(q => $$(q).forEach(n => { n.hidden = true; n.classList.add('of-hidden-legacy'); }));
  // Dựng hết các tab (dời thẻ) rồi mới thay nội dung pane: tab sau còn lấy thẻ nằm trong pane cũ của tab khác.
  const pol = buildPolicy(), pic = buildPicture(pol.box), ov = buildOverview();
  if (pol.pane) { restOf(pol.legacy, pol.box, pol.rest); pol.pane.replaceChildren(); }
  if (pic) { restOf(pic.legacy, pic.sec, pic.rest); pic.pane.replaceChildren(pic.sec); }
  if (ov) { restOf(ov.legacy, ov.sec, ov.rest); ov.pane.replaceChildren(ov.sec); TABS.mt1.forEach(x => balance(x.body)); sources(TABS.mt1[0].body); }
  TABS.pol?.forEach(x => balance(x.body));
  finHost = financePane();
  nav();
  policyFix();
  unfoldCards(['bds-02']);
  { const c = block('bds-02')?.querySelector('.research-caption'); if (c) c.textContent = 'Cập nhật 26/11/2026 · số đến Q3/2026'; }
  modelTab();
  { const mb = $('#of-mt1-model .of-body'); if (mb && !mb.querySelector('.card')) mb.insertAdjacentHTML('afterbegin', GAP('Chưa có số BCTC (data/re-financials.js) để dựng mô hình kinh doanh.')); }
  sparkNew(); setTimeout(sparkNew, 800);
  window.dispatchEvent(new Event('re:frame'));
  policyAsOf();
  [100, 600, 1500].forEach(t => setTimeout(() => window.dispatchEvent(new Event('resize')), t));
}
// Dựng khung trong lượt SectorBoot (mốc 1600, sau mọi module ≤ 1500) để trang chỉ hiện khi khung đã xong.
if (window.SectorBoot) SectorBoot.add(1600, run);
else { const start = () => setTimeout(run, 1700); if (document.readyState === 'complete') start(); else window.addEventListener('load', start); }
})();
