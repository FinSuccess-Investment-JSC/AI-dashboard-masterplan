/* Dệt may · khung 4 tab chuẩn Điện (DASHBOARD_WORKFLOW.md §42, 28/11/2026, người dùng: "lấy DB ngành điện làm tiêu chuẩn").
   Tab lớn: Tổng quan ngành (.ov-nav: 00 Bản đồ ngành · 01 Chuỗi giá trị · 02 Triển vọng)
          · Bức tranh ngành (.pp-nav: 01 Toàn ngành · 02 Sợi & xơ · 03 Dệt nhuộm – May · 04 Thị trường & nhãn hàng · 05 Chính sách,
            Chính sách có thanh con .pp-subnav năm văn bản; cây PICT, buildPicture())
          · Tài chính ngành (#mt14, .pp-nav: 01 Tài chính ngành = app/textile-finance.js · 02 Doanh nghiệp niêm yết · 03 Định giá = app/peer-valuation.js)
          · Chủ đề nóng (#mt7: luồng tin như Điện, app/textile-news.js từ data/textile-news.js; 28/11/2026).
   Bỏ tab lớn Chính sách (#mt4): năm văn bản thành sub-tab cuối của Bức tranh ngành (legal-config.js khai báo tab 'mt2' cho app/sector-legal.js).
   Doanh nghiệp niêm yết (mô hình kinh doanh, dm-03) rời Tổng quan sang Tài chính ngành › 02.
   Card cũ được DỜI theo data-block-id, không nhân bản, không xóa; card không còn chỗ nằm trong details.of-rest ẩn.
   Ô số: 6 ô có sẵn trên trang được dời; ô mới (lũy kế XK, XK xơ sợi, sản lượng quần áo, IIP trang phục, nhập khẩu vải, tồn kho/doanh số Mỹ)
   tính trong trình duyệt từ window.TEXTILE_PUBLIC (cùng chuỗi với chart trên trang), không thêm số ngoài.
   Chạy trong SectorBoot mốc 1600, sau textile-dashboard / sector-visuals / research-layout / pane-subtabs.
   Deep-link: ?sub=<khóa>#mtN. Link cũ: #mt3 → Sợi & xơ; #mt4 (?sub=us301|fta|cost|ad|docs) → Chính sách; #mt10, #mt11, ?sub=export|orders → Thị trường & nhãn hàng;
   #mt6, ?sub=players#mt1 → Tài chính › 02; ?sub=total|compare#mt14 → 01|02; #mt5, #mt8 → Tổng quan. */
(() => {
'use strict';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
if (document.body.dataset.sector !== 'textile') return;
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const block = id => $(`[data-block-id="${id}"]`);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const GAP = t => `<p class="data-gap of-gap">${t}</p>`;

/* ---------- Số từ window.TEXTILE_PUBLIC (cùng nguồn chart) ---------- */
const PUB = window.TEXTILE_PUBLIC?.blocks || {}, MAC = PUB.macro?.series || {}, COM = PUB.commodity?.series || {};
const rec = k => (MAC[k] || COM[k])?.records || [];
const last = k => rec(k).at(-1);
const fin = v => typeof v === 'number' && Number.isFinite(v);
const nf = (v, d = 1) => fin(v) ? v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}) : '—';
const sg = (v, d = 1) => fin(v) ? (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), d) : '—';
const ago = (k, r) => r && rec(k).find(x => x.date.slice(0, 7) === (+r.date.slice(0, 4) - 1) + r.date.slice(4, 7));
const yoy = k => { const r = last(k), p = ago(k, r); return r && p && p.value ? (r.value / p.value - 1) * 100 : null; };
const mon = d => d ? `T${+d.slice(5, 7)}/${d.slice(0, 4)}` : '';
const dmy = d => d ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}` : '';
const peLast = () => PUB.sector_ratio?.by_sector?.['204']?.records?.at(-1)?.[0];
// Ngày văn bản mới nhất đã diễn ra (bảng "Mới duyệt" của legal-config.js; bỏ mốc tương lai).
const legalLast = () => { const now = new Date().toISOString().slice(0, 10);
  return (window.SECTOR_LEGAL?.RECENT || []).map(r => String(r[0]).split('/').reverse().join('-')).filter(d => /^\d{4}-\d\d-\d\d$/.test(d) && d <= now).sort().at(-1); };
const asofText = parts => parts.filter(p => p[1]).map(p => `${p[0]} ${p[1]}`).join(' · ');
// Ô số mới theo khuôn .kpi có sẵn (label · value + đơn vị · delta · sub).
function kpiNew(id, label, value, unit, delta, sub) {
  if (value == null || value === '—') return null;
  const k = el('div', 'kpi tx-kpi', `<div class="label">${esc(label)}</div><div class="value">${esc(value)}${unit ? `<span class="unit">${esc(unit)}</span>` : ''}</div><div class="delta">${esc(delta || '')}</div><div class="sub">${esc(sub || '')}</div>`);
  k.id = id; return k;
}
const NEWKPI = {
  'kpi-ytd': () => { const y = window.TEXTILE_DASHBOARD?.ytd; if (!y?.month || !y.prev) return null; const m = +y.month.slice(5, 7);
    return kpiNew('kpi-ytd', `XK dệt may lũy kế ${m} tháng`, nf(y.now / 1000, 2), 'tỷ USD', `${sg((y.now / y.prev - 1) * 100, 1)}% so cùng kỳ`, `${m}T/${y.month.slice(0, 4)} · Hải quan, hàng dệt, may`); },
  'kpi-yarn': () => { const r = last('exp_yarn'); return r && kpiNew('kpi-yarn', 'XK xơ, sợi dệt', nf(r.value, 0), 'triệu USD', `${sg(yoy('exp_yarn'), 1)}% so cùng kỳ`, `${mon(r.date)} · Hải quan`); },
  'kpi-garment': () => { const r = last('garments'); return r && kpiNew('kpi-garment', 'Sản lượng quần áo mặc thường', nf(r.value, 1), 'triệu cái', `${sg(yoy('garments'), 1)}% so cùng kỳ`, `${mon(r.date)} · Cục Thống kê`); },
  'kpi-iip': () => { const rs = rec('iip_apparel'), r = rs.at(-1), p = rs.at(-2); return r && kpiNew('kpi-iip', 'IIP sản xuất trang phục', sg(r.value, 1), '% so cùng kỳ', p ? `tháng trước ${sg(p.value, 1)}%` : '', `${mon(r.date)} · Cục Thống kê`); },
  'kpi-fabric': () => { const r = last('imp_fabric'); return r && kpiNew('kpi-fabric', 'Nhập khẩu vải', nf(r.value, 0), 'triệu USD', `${sg(yoy('imp_fabric'), 1)}% so cùng kỳ`, `${mon(r.date)} · Hải quan`); },
  'kpi-is': () => { const r = last('us_apparel_is'), p = ago('us_apparel_is', r); return r && kpiNew('kpi-is', 'Tồn kho / doanh số quần áo Mỹ', nf(r.value, 2), 'lần', p ? `cùng kỳ ${nf(p.value, 2)} lần` : '', `${mon(r.date)} · FRED, điều chỉnh mùa vụ`); },
};

/* ---------- Tổng quan ngành: .ov-nav 00 · 01 · 02 ---------- */
const OV = [
  {k: 'map', n: '00', t: 'Bản đồ ngành', d: 'Xơ → sợi → dệt nhuộm → may → nhãn hàng', take: ['.research-roadmap', 'dm-01']},
  {k: 'chain', n: '01', t: 'Chuỗi giá trị', d: 'Dòng tiền qua từng khâu', take: ['.fsv-flow']},
  {k: 'outlook', n: '02', t: 'Triển vọng', d: 'Vị trí trong chu kỳ', take: ['dm-02']},
];

/* ---------- Bức tranh ngành: cây câu hỏi theo khâu (như Dien/app/power-picture.js) ----------
   Mỗi sub-tab: pp-head + ngày dữ liệu, ô số, thanh luồng Đầu vào → Sản xuất → Đầu ra (01 Toàn ngành nhóm bằng .pp-grp), câu hỏi đánh số.
   Câu hỏi: main = chart trả lời chính, sup = chart/bảng phụ. Thẻ ở sub-tab khác: thẻ dẫn (link), không nhân bản. */
const LINK = (href, k, t, s) => ({link: [href, k, t, s]});
const PICT = [
  {k: 'all', t: 'Toàn ngành', title: 'Toàn ngành dệt may', goal: 'Xuất khẩu tổng, chỉ báo so cùng kỳ và tín hiệu đơn hàng của cả ngành.',
    kpis: ['spk-exp', 'kpi-ytd', 'spk-pe'], asof: () => asofText([['XK', mon(last('exp_textile')?.date)], ['P/E', dmy(peLast())]]), items: [
    {grp: 'Xuất khẩu'},
    {q: 'Xuất khẩu dệt may đang tăng tốc hay chậm lại?', id: 'tx-q-export', main: ['dm-04']},
    {grp: 'Chỉ báo so cùng kỳ'},
    {q: 'Chỉ báo nào đang tăng, chỉ báo nào giảm so với cùng kỳ?', id: 'tx-q-heat', main: ['.fsv-heat']},
    {grp: 'Đơn hàng'},
    {q: 'Doanh nghiệp và hiệp hội đang nói gì về đơn hàng 2026?', id: 'tx-q-orders', main: ['dm-31']},
    LINK('#tx-q-leadlag', 'Thị trường & nhãn hàng › 4.4', 'Kho bán lẻ Mỹ báo trước đơn hàng Việt Nam', 'Tồn kho/doanh số Mỹ dịch 6 tháng so với xuất khẩu sang Mỹ'),
  ]},
  {k: 'yarn', t: 'Sợi & xơ', title: 'Sợi & xơ', goal: 'Giá bông, xơ polyester → chênh lệch kéo sợi → xuất khẩu xơ sợi (STK, ADS).',
    kpis: ['spk-cotton', 'spk-psf', 'kpi-yarn'], asof: () => asofText([['giá xơ sợi', dmy(last('psf')?.date)], ['XK', mon(last('exp_yarn')?.date)]]),
    flow: [['in', 'Đầu vào', 'Giá bông, xơ polyester, PTA/MEG'], ['prod', 'Sản xuất', 'Chênh lệch kéo sợi'], ['out', 'Đầu ra', 'Xuất khẩu xơ, sợi']], items: [
    {stage: 'in'},
    {q: 'Giá bông đang lên hay xuống?', id: 'tx-q-cotton', main: ['dm-10']},
    {q: 'Xơ polyester và nguyên liệu PTA, MEG đang đi hướng nào?', id: 'tx-q-poly', main: ['dm-12']},
    {stage: 'prod'},
    {q: 'Biên kéo sợi đang nới hay hẹp lại?', id: 'tx-q-spread', main: ['dm-17'], sup: ['dm-11']},
    {stage: 'out'},
    {q: 'Xuất khẩu xơ, sợi đang tăng hay giảm?', id: 'tx-q-yarnexp', main: ['dm-08']},
    LINK('#tx-q-fabric', 'Dệt nhuộm – May › 3.3', 'Sợi trong nước đi vào vải: sản lượng vải dệt', 'Vải từ sợi tự nhiên (bông) và tổng hợp (polyester)'),
  ]},
  {k: 'garment', t: 'Dệt nhuộm – May', title: 'Dệt nhuộm – May', goal: 'Vải, phụ liệu nhập và chi phí lao động → sản lượng vải, quần áo → mặt hàng xuất khẩu.',
    kpis: ['kpi-fabric', 'kpi-garment', 'kpi-iip'], asof: () => asofText([['sản lượng', mon(last('garments')?.date)], ['nhập khẩu', mon(last('imp_fabric')?.date)], ['Mỹ nhập', mon(last('us_6204_vn')?.date)]]),
    flow: [['in', 'Đầu vào', 'Vải, phụ liệu nhập · chi phí lao động'], ['prod', 'Sản xuất', 'Sản lượng vải và quần áo'], ['out', 'Đầu ra', 'Mặt hàng may xuất khẩu']], items: [
    {stage: 'in'},
    {q: 'Nhà may có đang nhập thêm vải và phụ liệu?', id: 'tx-q-import', main: ['dm-07']},
    {q: 'Chi phí lao động và năng lượng tăng bao nhiêu?', id: 'tx-q-labor', main: ['dm-14']},
    {stage: 'prod'},
    {q: 'Nhà dệt trong nước có sản xuất thêm vải?', id: 'tx-q-fabric', main: ['dm-09']},
    {q: 'Sản lượng quần áo đang tăng hay giảm?', id: 'tx-q-garment', main: ['dm-06']},
    {stage: 'out'},
    LINK('#tx-q-export', 'Toàn ngành › 1.1', 'Xuất khẩu hàng dệt, may theo tháng', 'Kim ngạch toàn ngành và so cùng kỳ'),
    {q: 'Mỹ đang mua nhiều hơn mặt hàng may nào của Việt Nam?', id: 'tx-q-hs', main: ['dm-37']},
  ]},
  {k: 'market', t: 'Thị trường & nhãn hàng', title: 'Thị trường & nhãn hàng', goal: 'Cầu cuối ở Mỹ và tồn kho nhãn hàng → đơn hàng về nhà may Việt Nam → xuất khẩu theo thị trường, thị phần.',
    kpis: ['spk-us', 'spk-usretail', 'kpi-is'], asof: () => asofText([['bán lẻ Mỹ', mon(last('us_apparel_retail')?.date)], ['XK', mon(last('exp_textile_us')?.date)]]),
    flow: [['in', 'Đầu vào', 'Bán lẻ, tồn kho Mỹ và nhãn hàng'], ['prod', 'Sản xuất', 'Đơn hàng về nhà may Việt Nam'], ['out', 'Đầu ra', 'Xuất khẩu theo thị trường, thị phần']], items: [
    {stage: 'in'},
    {q: 'Người Mỹ đang mua thêm hay bớt quần áo?', id: 'tx-q-usretail', main: ['dm-27']},
    {q: 'Kho bán lẻ quần áo Mỹ đang thừa hay thiếu hàng?', id: 'tx-q-usis', main: ['dm-32']},
    {q: 'Nhãn hàng lớn đang xả kho hay tích kho?', id: 'tx-q-brands', main: ['dm-28'], sup: ['dm-29']},
    {stage: 'prod'},
    {q: 'Kho Mỹ có báo trước đơn hàng của Việt Nam?', id: 'tx-q-leadlag', main: ['dm-35']},
    {q: 'Nhãn hàng nào đặt đơn ở doanh nghiệp nào?', id: 'tx-q-link', main: ['dm-33']},
    LINK('#tx-fin-plan', 'Tài chính ngành › 02', 'Khách hàng, kế hoạch và kết quả 2026 của từng mã', 'Bảng doanh nghiệp Việt Nam: khách hàng chính, kế hoạch, kết quả gần nhất'),
    {stage: 'out'},
    {q: 'Xuất khẩu đang dựa vào thị trường nào?', id: 'tx-q-mkt', main: ['dm-05'], sup: ['dm-22']},
    {q: 'Xuất khẩu sang Mỹ năm nay nhanh hay chậm hơn năm trước?', id: 'tx-q-usytd', main: ['dm-23']},
    {q: 'Việt Nam có đang lấy thêm thị phần ở Mỹ?', id: 'tx-q-usshare', main: ['dm-20'], sup: ['dm-36']},
    {q: 'Ở EU, Nhật, Hàn Việt Nam còn dư địa bao nhiêu?', id: 'tx-q-other', main: ['dm-34']},
  ]},
];
// 05 Chính sách: thanh con năm văn bản (khóa trùng legal-config.js; tóm tắt .re-sum và bảng "Mới duyệt" do app/sector-legal.js thêm vào #of-mt2-<k> .of-body).
const POL = [
  {k: 'us301', t: 'Thuế Mỹ · Mục 301', items: [{q: 'Thuế Mỹ với hàng may Việt Nam đang cao hay thấp hơn đối thủ?', id: 'tx-q-tariff', main: ['dm-21'], sup: ['dm-24']}]},
  {k: 'fta', t: 'EVFTA · CPTPP & xuất xứ', items: [{q: 'Quy tắc xuất xứ và FTA ưu đãi gì cho dệt may Việt Nam?', id: 'tx-q-fta', main: ['dm-25'], sup: ['dm-26']}]},
  {k: 'cost', t: 'Lương · BHXH · thuế · xanh EU', items: [{q: 'Chi phí trong nước và yêu cầu xanh EU tăng thêm những gì?', id: 'tx-q-cost', main: ['dm-15']}]},
  {k: 'ad', t: 'CBPG sợi polyester', items: [{q: 'Sợi polyester được bảo hộ và bị điều tra ở đâu?', id: 'tx-q-ad', main: ['dm-16']}]},
  {k: 'docs', t: 'Mới duyệt gần đây', items: [{q: 'Mốc thuế quan, ưu đãi và chi phí nào sắp tới?', id: 'tx-q-docs', main: ['dm-18']}]},
];
const POLICY = {k: 'policy', t: 'Chính sách', title: 'Chính sách', goal: 'Thuế Mỹ, FTA và xuất xứ, chi phí trong nước, phòng vệ thương mại sợi, văn bản mới duyệt.'};
/* ---------- Tài chính ngành: 01 · 02 · 03 ---------- */
const FIN = [{k: 'sector', t: 'Tài chính ngành'}, {k: 'listed', t: 'Doanh nghiệp niêm yết'}, {k: 'valuation', t: 'Định giá'}];
const LISTED = ['.business-models', 'dm-03', '.financial-comparison', 'dm-30', 'dm-13'];  // P/E rổ (dm-13) cuối cùng như Thép, Chăn nuôi

const ROUTES = [['mt1', 'Tổng quan ngành'], ['mt2', 'Bức tranh ngành'], ['mt14', 'Tài chính ngành'], ['mt7', 'Chủ đề nóng']];
// Tab cũ → [tab mới, sub-tab mặc định]
const ALIAS = {mt3: ['mt2', 'yarn'], mt4: ['mt2', 'policy'], mt10: ['mt2', 'market'], mt11: ['mt2', 'market'], mt5: ['mt1'], mt6: ['mt14', 'listed'], mt8: ['mt1']};
// Khóa sub-tab cũ → [tab, sub]
const SUBALIAS = {players: ['mt14', 'listed'], export: ['mt2', 'market'], orders: ['mt2', 'market'], total: ['mt14', 'sector'], compare: ['mt14', 'listed']};

function style() {
  const st = el('style'); st.id = 'tx-frame-style';
  st.textContent = `/* Khung thanh, đầu sub-tab, câu hỏi (.ov-nav, .pp-*, .th-link): app/sector-frame.css (bản chung). Ở đây chỉ còn giao diện nội dung riêng của Dệt may. */
.of-lead{margin:6px 0 4px;font-size:14px;line-height:1.6;color:#3B4256}.of-lead b{color:#1F2A5C}.of-lead b.neg{color:#B3303F}.of-lead b.pos{color:#17784A}
.dv-row.dv-total{border-bottom:2px solid #DCE1EE}.dv-row.dv-total .dv-l b{font-weight:800}.dv-row.dv-total .dv-bar{opacity:1}
.dv{margin:10px 0 4px}.dv-axis{display:grid;grid-template-columns:260px 1fr;margin-bottom:4px}.dv-axis{position:relative}.dv-axis span{font:600 11.5px Inter,sans-serif;color:#9AA1BC}
.dv-axis{display:flex;justify-content:space-between;padding-left:276px}.dv-g{margin:12px 0 4px;font:700 12px Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#2938A8}
.dv-row{display:grid;grid-template-columns:260px minmax(0,1fr);gap:16px;align-items:center;min-height:44px;border-bottom:1px solid #F0F2F8}
.dv-l b{display:block;font:600 14px/1.3 Inter,sans-serif;color:#1F2A5C}.dv-l small{font-size:12px;color:#6B7392}
.dv-track{position:relative;height:28px}.dv-zero{position:absolute;left:50%;top:-8px;bottom:-8px;border-left:1.5px solid #C9CEE0}
.dv-bar{position:absolute;top:6px;height:16px;border-radius:4px}.dv-bar.neg{background:#E5484D;opacity:.8;border-radius:4px 0 0 4px}.dv-bar.pos{background:#2BB673;opacity:.85;border-radius:0 4px 4px 0}
.dv-v{position:absolute;top:4px;font:700 13.5px Inter,sans-serif;font-style:normal}.dv-v.neg{color:#B3303F}.dv-v.pos{color:#17784A}
.dv-note{margin:12px 0 0;font-size:12.5px;color:#6B7392}
@media (max-width:900px){.dv-row{grid-template-columns:1fr}.dv-axis{padding-left:0}}
.of-ops-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;margin:12px 0 4px}
.of-ops-i{display:flex;flex-direction:column;gap:3px;padding:12px 14px;border:1px solid #E6E9F2;border-radius:12px;background:#FAFBFE}
.of-ops-i span{font:600 12.5px Inter,sans-serif;color:#6B7392}.of-ops-i b{font:700 26px/1.15 Inter,sans-serif;color:#1F2A5C}.of-ops-i b small{font:600 13px Inter,sans-serif;color:#6B7392;margin-left:4px}.of-ops-i em{font-style:normal;font-size:12px;color:#6B7392}
.tx2{margin:10px 0 6px;font-size:13px}.tx2-head,.tx2-row{display:grid;grid-template-columns:190px minmax(0,1fr);gap:16px;align-items:center}
.tx2-head{height:40px}.tx2-axis{position:relative;height:100%;border-bottom:1px solid #DCE1EE}.tx2-axis span{position:absolute;bottom:6px;transform:translateX(-50%);font:600 12px Inter,sans-serif;color:#7A84A6}
.tx2-row{min-height:64px;border-bottom:1px solid #F0F2F8}.tx2-lane{position:relative;height:64px}
.tx2-bar{position:absolute;top:8px;bottom:8px;display:flex;flex-direction:column;justify-content:center;padding:0 10px;border-radius:9px;overflow:hidden;white-space:nowrap;background:#E8ECFB;border-left:4px solid #2938A8}
.tx2-bar b{font:700 13px Inter,sans-serif;color:#1F2A5C;overflow:hidden;text-overflow:ellipsis}.tx2-bar small{font-size:11.5px;color:#5A6385;overflow:hidden;text-overflow:ellipsis}.tx2-bar small a{color:#2938A8}
.tx2-bar.e10{background:#E7F7EF;border-left-color:#2BB673;right:0;width:auto!important}
.of-group{grid-column:1/-1;margin:18px 0 -4px;padding-top:14px;border-top:1px solid #E6E9F2}
.of-group h3{margin:0;font:700 20px/1.3 Inter,system-ui,sans-serif;color:#1F2A5C}.of-group p{margin:4px 0 0;font-size:13.5px;color:#6B7392}
.of-body>.kpis+.of-group{border-top:0;padding-top:0}
/* Thang chữ thống nhất (theo Dầu khí) (26/11/2026): tiêu đề thẻ 16 · chữ thường 14 · chú thích 12.5; ba màu chữ */
body[data-tx-frame] .majorpane{--of-t1:#1F2A5C;--of-t2:#3B4256;--of-t3:#6B7392}
body[data-tx-frame] .majorpane :is(.chart-title,.card>h3,.card>h4,.card .research-detail>h3,.research-fold>summary,.business-model h3,.opec-drivers h3,.sectionhead h2.sec){font:700 16px/1.35 Inter,system-ui,sans-serif!important;color:var(--of-t1)!important;letter-spacing:-.005em}
body[data-tx-frame] .majorpane :is(.business-models>h2,.research-roadmap>h2,.section>h2,.sectionhead h2){font:700 20px/1.3 Inter,system-ui,sans-serif!important;color:var(--of-t1)!important}
body[data-tx-frame] .majorpane :is(.card p,.card li,.card td,.research-detail p,.business-model p,.tx-mech,.tx-who,.gt-lab b){font-size:14px!important;line-height:1.55!important;color:var(--of-t2)!important}
body[data-tx-frame] .majorpane :is(.card th,.chart-sub,.note,.source-note,.research-caption,.srcrow,.srcrow a,.pw-src,.card small,.gt-lab small,.gt-name small,.tx-k,.ct-period label,.cts-legend button){font-size:12.5px!important;line-height:1.5!important;color:var(--of-t3)!important}
body[data-tx-frame] .majorpane .card th{font-weight:600!important}
body[data-tx-frame] .majorpane :is(.card td b,.card p b,.tx-ch,.gt-name b){color:var(--of-t1)!important}
body[data-tx-frame] .majorpane .card [style*="font-size:12.5px"]{font-size:14px!important;color:var(--of-t2)!important}
body[data-tx-frame] .majorpane .comparison-heading h2{color:#fff!important;background:none!important;box-shadow:none!important}
:root[data-theme=dark] body[data-tx-frame] .majorpane{--of-t1:#E8EBFA;--of-t2:#C4C9E2;--of-t3:#9AA1BC}
.gt{margin:12px 0 8px;font-size:13px}
.gt-head,.gt-row{display:grid;grid-template-columns:200px minmax(0,1fr) 230px;gap:16px;align-items:center}
.gt-head{height:46px}.gt-axis{position:relative;height:100%;border-bottom:1px solid #DCE1EE}
.gt-axis span{position:absolute;bottom:6px;transform:translateX(-50%);font:600 12px Inter,sans-serif;color:#7A84A6}
.gt-now{position:absolute;top:0;bottom:0;border-left:2px dashed #E5484D;opacity:.7;z-index:0;pointer-events:none}.gt-nowh{position:absolute;top:2px;transform:translateX(-50%);font:700 10.5px Inter,sans-serif;font-style:normal;color:#E5484D;background:#FDECEE;padding:1px 6px;border-radius:6px;white-space:nowrap}

.gt{position:relative;overflow:hidden}
.gt-tbd{font:600 12px Inter,sans-serif;color:#7A84A6}
.gt-row{min-height:58px;border-bottom:1px solid #F0F2F8}
.gt-name b{display:block;font:700 14px/1.3 Inter,sans-serif;color:#1F2A5C}.gt-name small{color:#7A84A6;font-size:12px}
.gt-lane{position:relative;height:58px;background:repeating-linear-gradient(90deg,transparent 0 calc(100%/6 - 1px),#F0F2F8 calc(100%/6 - 1px) calc(100%/6))}
.gt-pin{position:absolute;top:50%;display:flex;align-items:center;gap:8px;transform:translateY(-50%);z-index:1}
.gt-pin .gt-dot{transform:translateX(-50%);flex:none}
.gt-pin.left{flex-direction:row-reverse;transform:translate(calc(-100% + 0px),-50%)}.gt-pin.left .gt-dot{transform:translateX(50%)}.gt-pin.left .gt-lab{text-align:right}
.gt-pin.tbd{position:static;transform:none}.gt-pin.tbd .gt-lab{white-space:normal}.gt-pin.tbd .gt-dot{transform:none}
.gt-lab{display:flex;flex-direction:column;white-space:nowrap;line-height:1.3}.gt-lab b{font:600 13px Inter,sans-serif;color:#1F2A5C}.gt-lab small{font-size:11.5px;color:#6B7392}
.gt-dot{display:inline-block;width:12px;height:12px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px rgba(31,42,92,.15),0 3px 8px -2px rgba(31,42,92,.35)}
.gt-dot.on{background:#2BB673}.gt-dot.next{background:#2938A8}.gt-dot.tbd{background:#B4BAD0}
.gt-key{display:flex;flex-wrap:wrap;gap:6px 18px;margin-top:10px;font-size:12px;color:#5A6385}.gt-key span{display:inline-flex;align-items:center;gap:6px}.gt-key .gt-dot{width:10px;height:10px}
@media (max-width:900px){.gt-head,.gt-row{grid-template-columns:110px minmax(0,1fr) 70px;gap:8px}.gt-lab small{display:none}}
:root[data-theme=dark] .gt-name b,:root[data-theme=dark] .gt-lab b{color:#E8EBFA}:root[data-theme=dark] .gt-row{border-color:#2A2A2A}
.tx-flow{display:grid;grid-template-columns:170px minmax(0,1fr);gap:0 26px;align-items:stretch;margin:10px 0 8px}
.tx-src{position:relative;align-self:center;display:flex;flex-direction:column;gap:4px;padding:18px 16px;border-radius:16px;color:#fff;background:linear-gradient(150deg,#2938A8,#6C5CE7 60%,#59C5C8);box-shadow:0 10px 26px -10px rgba(41,56,168,.55)}
.tx-src b{font:700 16px/1.25 Inter,sans-serif}.tx-src small{color:#EEF0FF!important;font-size:12px}.tx-src .tx-k{color:#DDE3FF}
.tx-k{display:block;font:700 10px/1 Inter,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#8A93B8;margin-bottom:3px}
.tx-rows{position:relative;display:grid;gap:10px;padding-left:22px;border-left:2px dashed #C9C3F5}
.tx-row{position:relative;display:grid;grid-template-columns:150px minmax(0,1.6fr) minmax(0,1fr) minmax(0,1fr);gap:14px;align-items:center;padding:12px 14px;border:1px solid #E6E8F4;border-radius:12px;background:#fff;transition:box-shadow .2s,transform .2s}
.tx-row:hover{box-shadow:0 6px 18px -8px rgba(41,56,168,.3);transform:translateX(2px)}
.tx-row::before{content:'';position:absolute;left:-23px;top:50%;width:22px;border-top:2px dashed #C9C3F5}
.tx-row::after{content:'';position:absolute;left:-28px;top:calc(50% - 4px);width:8px;height:8px;border-radius:50%;background:#A78BFA}
.tx-ch{font:700 14px/1.3 Inter,sans-serif;color:#1F2A5C}.tx-ch b{font-weight:700}
.tx-mech{font-size:13px;line-height:1.5;color:#3B4256}.tx-who{font-size:13px;line-height:1.45;color:#1F2A5C}
.tx-dir{display:flex;gap:8px;align-items:flex-start;font-size:12.5px;line-height:1.45;padding:8px 10px;border-radius:10px}
.tx-dir i{font-style:normal;font-size:11px;line-height:1.6}
.tx-row.neg{border-left:4px solid #E5484D}.tx-row.neg .tx-dir{background:#FDECEE;color:#A1252B}
.tx-row.pos{border-left:4px solid #2BB673}.tx-row.pos .tx-dir{background:#E7F7EF;color:#17784A}
.tx-row.mix{border-left:4px solid #A78BFA}.tx-row.mix .tx-dir{background:#F1EDFF;color:#5B4FD6}
@media (max-width:900px){.tx-flow{grid-template-columns:1fr;gap:12px}.tx-row{grid-template-columns:1fr}.tx-rows{padding-left:14px}.tx-row::before{width:14px;left:-15px}.tx-row::after{left:-20px}}
:root[data-theme=dark] .tx-row{background:var(--card);border-color:var(--line)}:root[data-theme=dark] .tx-ch,:root[data-theme=dark] .tx-who{color:#E8EBFA}:root[data-theme=dark] .tx-mech{color:#B8BEDA}
.of-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-end;margin:4px 0 12px;padding:10px 0;border-bottom:1px solid var(--line,#e3e7f0)}
.of-head h2{margin:0;font-size:24px}.of-head .of-k{font:500 13px Inter,sans-serif;color:var(--muted,#7a8399);margin-right:8px}.of-head p{margin:4px 0 0;color:var(--ink2,#3b4256)}
.of-body{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-items:start}.of-body>*{min-width:0;margin:0!important}
.of-body>.of-wide,.of-body>.of-gap,.of-body>details,.of-body>.kpis,.of-body>.research-grid,.of-body>table,.of-body>.tablewrap{grid-column:1/-1}
@media (max-width:900px){.of-body{grid-template-columns:minmax(0,1fr)}}
.of-body>.of-span{grid-column:1/-1}
.of-body .ct-switch{display:flex!important;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px 10px;margin:6px 0 2px!important}
.of-body .ct-switch .ct-main{margin:0 0 0 auto!important;order:2}.of-body .ct-switch .ct-period{order:1;margin:0!important}
.of-body .ct-canvas{margin-top:4px}
.of-body>.card{padding:18px 20px 12px!important}
.of-body>.card .chart-title{margin-bottom:4px!important}
.of-body .cts-legend{margin:6px 0 0!important}
.of-body .pw-src,.of-body .chart-source,.of-body .source-note,.of-body .srcrow{margin-top:6px!important;padding-top:6px!important}
.of-body>.card::after{margin-top:2px!important}
.of-body .card,.of-body .card *{min-width:0}.of-body canvas{max-width:100%!important}
.of-body>.card{display:flex;flex-direction:column;align-self:stretch}
.of-body>.card .chart{position:relative;width:100%;height:300px!important;min-height:0!important;flex:none}
.of-gap{padding:10px 12px;border:1px dashed var(--line,#d6dbe8);border-radius:10px;color:var(--muted,#6b7280);font-size:13px}
.of-rest{display:none!important}.of-next{display:inline-flex;align-items:center;gap:6px;margin:24px 0 0;padding:9px 18px;border:1px solid #C9D0EC;border-radius:999px;background:#fff;color:#2938A8;font:600 13.5px Inter,sans-serif;cursor:pointer;box-shadow:0 1px 2px rgba(31,42,92,.06);transition:.2s}.of-next:hover{background:#2938A8;color:#fff;border-color:#2938A8;box-shadow:0 4px 12px rgba(41,56,168,.2)}.of-pane .research-roadmap>h2{display:none}.of-hidden-legacy{display:none!important}
/* 28/11/2026 khung chuẩn Điện: ô số mới, câu hỏi hai chart cạnh nhau, thanh con Chính sách */
.tx-kpi .unit{font-size:12px;font-weight:600;color:var(--muted,#6b7a90);margin-left:6px;letter-spacing:0}
.tx-q{display:grid;grid-template-columns:minmax(0,1fr);gap:0 14px;align-items:start}.tx-q.tx-pair{grid-template-columns:repeat(2,minmax(0,1fr))}
.tx-q>.pp-ph{grid-column:1/-1}.tx-q>.pp-main,.tx-q>.pp-sup1{min-width:0}.tx-q .card{margin:0 0 12px!important}.tx-q .card,.tx-q .card *{min-width:0}.tx-q canvas{max-width:100%!important}
.ov-pane>.of-body{grid-template-columns:minmax(0,1fr)}.tx-pol>.of-body{display:block}.tx-pol>.of-body>.card{margin:0 0 14px!important}
.pp-subnav{display:flex;gap:6px;overflow-x:auto;scrollbar-width:thin;margin:2px 0 14px;padding:4px 2px}
.pp-subnav button{flex:0 0 auto;white-space:nowrap;font:500 12.5px/1.2 Inter,system-ui,sans-serif;padding:7px 12px;border-radius:999px;border:1px solid var(--line,#d6dbe8);background:var(--card,#fff);color:var(--ink2,#3b4256);cursor:pointer}
.pp-subnav button:hover{border-color:#2938A8}.pp-subnav button[aria-selected=true]{background:#E8ECFB;border-color:#2938A8;color:#1D2678;font-weight:700}
:root[data-theme=dark] .pp-subnav button{background:#161616;border-color:#2A2A2A;color:#C8CCE0}:root[data-theme=dark] .pp-subnav button[aria-selected=true]{background:#2938A8;color:#fff}
@media (max-width:900px){.tx-q.tx-pair{grid-template-columns:minmax(0,1fr)}}`;
  document.head.append(st);
}

function isTable(n) { return n.matches('.of-wide,.fsv-heat') || (!n.querySelector('[id^="ch"],canvas') && !!n.querySelector('table')); }
const used = new Set();
// Lấy một thẻ (dm-xx theo data-block-id, còn lại theo bộ chọn) đúng một lần: dời, không nhân bản.
function takeOne(sel) {
  const n = /^dm-/.test(sel) ? block(sel) : $(sel);
  if (!n || used.has(n) || [...used].some(u => u.contains(n))) return null;
  used.add(n); n.hidden = false; return n;
}
// Câu hỏi đánh số: header.pp-ph > span.pp-num + h3 → .pp-main (chart trả lời chính) → .pp-sup1 (chart/bảng phụ).
function question(it, num) {
  const main = (it.main || []).map(takeOne).filter(Boolean); if (!main.length) return null;
  const sup = (it.sup || []).map(takeOne).filter(Boolean);
  const panel = el('section', 'pp-panel pp-q tx-q'); panel.id = it.id;
  panel.innerHTML = `<header class="pp-ph"><span class="pp-num">${num}</span><div><h3>${esc(it.q)}</h3></div></header>`;
  const m = el('div', 'pp-main'); main.forEach(n => m.append(n)); panel.append(m);
  if (sup.length) { const s = el('div', 'pp-sup1'); sup.forEach(n => s.append(n)); panel.append(s); }
  if (sup.length && ![...main, ...sup].some(isTable)) panel.classList.add('tx-pair');  // hai chart: đặt cạnh nhau
  return panel;
}
const TABS = {};
let POLSUBS = [];
function tablist(nav, label) { nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', label); return nav; }
function tabBtn(cls, html, id, k) { const b = el('button', cls, html); b.type = 'button'; b.id = id; b.dataset.sub = k; b.setAttribute('role', 'tab'); return b; }
function tabPane(cls, id, k, b) { const p = el('div', cls); p.id = id; p.dataset.sub = k; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); b.setAttribute('aria-controls', p.id); p.hidden = true; return p; }
function arrows(nav, b, i, n) {
  b.addEventListener('keydown', e => { const d = {ArrowRight: 1, ArrowLeft: -1}[e.key]; if (!d) return; e.preventDefault(); const t = nav.children[(i + d + n) % n]; t.click(); t.focus(); });
}

/* ---------- Tổng quan ngành ---------- */
function buildOverview() {
  const sec = el('section', 'section of-section');
  const brief = $('#dataBrief'); if (brief) sec.append(brief);
  const nav = tablist(el('div', 'ov-nav'), 'Tổng quan ngành dệt may'); sec.append(nav);
  TABS.mt1 = OV.map((s, i) => {
    const b = tabBtn('tabbtn ov-tab', `<span>${s.n}</span>${esc(s.t)}<small>${esc(s.d)}</small>`, `of-mt1-${s.k}-tab`, s.k);
    const p = tabPane('ov-pane of-pane', `of-mt1-${s.k}`, s.k, b), body = el('div', 'of-body'); p.append(body);
    s.take.forEach(sel => { const n = takeOne(sel); if (n) { n.classList.add('of-wide'); body.append(n); } });
    if (!body.children.length) body.insertAdjacentHTML('beforeend', GAP('Chưa có dữ liệu cho mục này.'));
    nav.append(b); sec.append(p);
    b.addEventListener('click', () => open('mt1', s.k, true)); arrows(nav, b, i, OV.length);
    return {s, b, p, body};
  });
  return sec;
}

/* ---------- Bức tranh ngành ---------- */
function buildPolicy(p, idx) {
  const sn = tablist(el('div', 'pp-subnav'), 'Văn bản chính sách'); p.append(sn);
  let qn = 0;
  POLSUBS = POL.map((s, i) => {
    const b = tabBtn('', esc(s.t), `of-mt2-${s.k}-tab`, s.k);
    const ip = tabPane('tx-pol of-pane', `of-mt2-${s.k}`, s.k, b), body = el('div', 'of-body'); ip.append(body);
    s.items.forEach(it => { const q = question(it, `${idx}.${qn + 1}`); if (q) { qn++; body.append(q); } });
    if (!body.children.length) body.insertAdjacentHTML('beforeend', GAP('Chưa có dữ liệu cho văn bản này.'));
    sn.append(b); p.append(ip);
    b.addEventListener('click', () => open('mt2', s.k, true)); arrows(sn, b, i, POL.length);
    return {s, b, p: ip};
  });
}
function buildPicture() {
  const sec = el('section', 'section of-section');
  const nav = tablist(el('div', 'pp-nav'), 'Bức tranh ngành'); sec.append(nav);
  const all = [...PICT, POLICY];
  TABS.mt2 = all.map((s, i) => {
    const num = String(i + 1).padStart(2, '0');
    const b = tabBtn('tabbtn pp-tab', `<span>${num}</span>${esc(s.t)}`, `of-mt2-${s.k}-tab`, s.k);
    const p = tabPane('pp-pane of-pane', `of-mt2-${s.k}`, s.k, b);
    const asof = s === POLICY ? asofText([['văn bản', dmy(legalLast())]]) : s.asof();
    p.append(el('header', 'pp-head', `<div><span class="pp-k">${num}</span><h2>${esc(s.title)}</h2><p>${esc(s.goal)}</p></div><span class="pp-asof">${asof ? 'Dữ liệu mới nhất: ' + esc(asof) : ''}</span>`));
    if (s === POLICY) buildPolicy(p, i + 1);
    else {
      const g = el('section', 'grid kpis pp-kpis');
      (s.kpis || []).forEach(id => { const t = NEWKPI[id] ? NEWKPI[id]() : document.getElementById(id)?.closest('.kpi'); if (t && !used.has(t)) { used.add(t); g.append(t); } });
      if (g.children.length) p.append(g);
      if (s.flow) {
        const bar = el('nav', 'pp-flow'); bar.setAttribute('aria-label', 'Luồng ' + s.t.toLowerCase());
        bar.innerHTML = s.flow.map(([id, k, t], j) => `${j ? '<span class="pp-flow-ar" aria-hidden="true">→</span>' : ''}<a href="#tx-st-${s.k}-${id}" class="pp-flow-s"><small>${k}</small><b>${esc(t)}</b></a>`).join('');
        p.append(bar);
      }
      let qn = 0;
      s.items.forEach(it => {
        if (it.grp) { p.append(el('h3', 'pp-grp', esc(it.grp))); return; }
        if (it.stage) { const f = s.flow.find(x => x[0] === it.stage); const h = el('div', 'pp-stage', `<span>${f[1]}</span><h3>${esc(f[2])}</h3>`); h.id = `tx-st-${s.k}-${f[0]}`; p.append(h); return; }
        if (it.link) { const [href, k, t, sub] = it.link; const a = el('a', 'th-link', `<small>Xem chart ở ${esc(k)}</small><b>${esc(t)} →</b><span>${esc(sub)}</span>`); a.href = href; p.append(a); return; }
        const q = question(it, `${i + 1}.${qn + 1}`); if (q) { qn++; p.append(q); }
      });
    }
    const nx = all[i + 1]; if (nx) { const go = el('button', 'of-next', `Tiếp: ${esc(nx.t)} →`); go.type = 'button'; go.addEventListener('click', () => { open('mt2', nx.k, true); nav.scrollIntoView({behavior: 'smooth', block: 'start'}); }); p.append(go); }
    nav.append(b); sec.append(p);
    b.addEventListener('click', () => open('mt2', s.k, true)); arrows(nav, b, i, all.length);
    return {s, b, p};
  });
  return sec;
}

/* ---------- Tài chính ngành ---------- */
function financePane() {
  let p = $('.majorpane[data-tab="mt14"]');
  if (!p) { p = el('section', 'majorpane'); p.dataset.tab = 'mt14'; p.id = 'pane-mt14'; p.hidden = true; ($('.majorpane[data-tab="mt7"]') || $('.majorpane:last-of-type')).before(p); }
  const sec = el('section', 'section of-section');
  sec.append(el('div', 'sectionhead', '<div><h2 class="sec">Tài chính ngành</h2><p>Số liệu tài chính của 7 doanh nghiệp dệt may niêm yết, tổng hợp theo khâu, từ BCTC hợp nhất quý.</p></div>'));
  const nav = tablist(el('div', 'pp-nav'), 'Tài chính ngành'); sec.append(nav);
  const subs = FIN.map((s, i) => {
    const b = tabBtn('tabbtn pp-tab', `<span>${String(i + 1).padStart(2, '0')}</span>${esc(s.t)}`, `of-mt14-${s.k}-tab`, s.k);
    const sp = tabPane('pp-pane of-pane', `of-mt14-${s.k}`, s.k, b), body = el('div', 'of-body'); sp.append(body);
    nav.append(b); sec.append(sp);
    b.addEventListener('click', () => open('mt14', s.k, true)); arrows(nav, b, i, FIN.length);
    return {s, b, p: sp, body};
  });
  const host = el('div', 'of-fin of-wide'); host.id = 'dm-fin-root'; subs[0].body.append(host);  // app/textile-finance.js dựng khi tab hiện
  // 02 Doanh nghiệp niêm yết: mô hình kinh doanh (dời từ Tổng quan), bảng so sánh + xu hướng quý, kế hoạch – kết quả (dm-30), P/E rổ (dm-13) cuối.
  const cb = subs[1].body;
  LISTED.forEach(sel => { const n = takeOne(sel); if (!n) return; if (n.matches('.financial-comparison,.business-models') || isTable(n)) n.classList.add('of-wide'); cb.append(n); });
  const plan = block('dm-30'); if (plan && !plan.id) plan.id = 'tx-fin-plan';
  if (!cb.children.length) cb.insertAdjacentHTML('beforeend', GAP('Chưa có dữ liệu so sánh doanh nghiệp.'));
  { let run = []; const flush = () => { if (run.length % 2) run.at(-1).classList.add('of-span'); run = []; };
    [...cb.children].forEach(n => { if (n.matches('.of-wide,.of-gap,details,table,.tablewrap')) flush(); else run.push(n); }); flush(); }
  p.replaceChildren(sec);
  // 03 Định giá: 4 chart so sánh mã (app/peer-valuation.js); bản tự gắn (data-auto) thấy .pv-wrap thì bỏ qua.
  if (window.PeerValuation && window.TEXTILE_FIN) PeerValuation.mount(subs[2].body, window.TEXTILE_FIN, {highlight: 'TNG', src: '<a href="https://api-finfo.vndirect.com.vn/v4/financial_statements" target="_blank" rel="noopener">BCTC hợp nhất theo quý (VNDirect finfo)</a>'});
  subs[2].body.querySelector('.pv-wrap')?.classList.add('of-wide');
  if (!subs[2].body.children.length) subs[2].body.insertAdjacentHTML('beforeend', GAP('Chưa có dữ liệu định giá.'));
  TABS.mt14 = subs;
  return host;
}

/* ---------- Mở sub-tab, điều hướng ---------- */
const selected = list => list.find(x => x.b.getAttribute('aria-selected') === 'true');
const known = (k, s) => !!s && (!!TABS[k]?.some(x => x.s.k === s) || (k === 'mt2' && POLSUBS.some(x => x.s.k === s)));
function refit() {
  setTimeout(() => { window.dispatchEvent(new Event('resize')); $$('.of-pane canvas').forEach(c => { const ch = window.Chart?.getChart?.(c); if (ch && c.offsetParent) ch.resize(); }); }, 30);
}
function open(key, sub, push) {
  const subs = TABS[key]; if (!subs) return;
  let inner = null;
  if (key === 'mt2' && POLSUBS.some(x => x.s.k === sub)) { inner = sub; sub = 'policy'; }
  const hit = subs.find(x => x.s.k === sub) || selected(subs) || subs[0];
  subs.forEach(x => { const on = x === hit; x.b.setAttribute('aria-selected', String(on)); x.b.classList.toggle('active', on); x.b.tabIndex = on ? 0 : -1; x.p.hidden = !on; });
  if (hit.s.k === 'policy' && POLSUBS.length) {
    const ih = POLSUBS.find(x => x.s.k === inner) || selected(POLSUBS) || POLSUBS[0];
    POLSUBS.forEach(x => { const on = x === ih; x.b.setAttribute('aria-selected', String(on)); x.b.tabIndex = on ? 0 : -1; x.p.hidden = !on; });
    inner = ih.s.k;
  }
  if (push) { const u = new URL(location.href); u.searchParams.set('sub', inner || hit.s.k); u.hash = key; history.replaceState(null, '', u.pathname + u.search + u.hash); }
  refit();
}
function route(rawKey, rawSub) {
  let key = rawKey, sub = rawSub;
  if (ALIAS[key]) { const [k, s] = ALIAS[key]; key = k; if (!known(k, sub)) sub = s; }
  if (sub && !known(key, sub) && SUBALIAS[sub]) [key, sub] = SUBALIAS[sub];
  if (!ROUTES.some(r => r[0] === key)) key = 'mt1';
  return [key, known(key, sub) ? sub : null];
}
function nav(finHost) {
  const bar = $('.majortabbtn')?.parentElement; if (!bar) return;
  bar.replaceChildren();
  let built = false;
  const select = (rawKey, rawSub, push) => {
    const [key, sub] = route(rawKey, rawSub);
    $$('.majorpane').forEach(p => { const on = p.dataset.tab === key; p.hidden = !on; p.classList.toggle('active', on); });
    [...bar.children].forEach(b => { const on = b.dataset.tab === key; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    if (TABS[key]) open(key, sub, push);
    if (key === 'mt14' && !built && window.TextileFinance) { built = true; window.TextileFinance.build(finHost); }  // dựng ngay khi tab hiện (sau open, để đo đúng chiều rộng chart); dựng trễ bằng setTimeout làm Chrome headless treo khi mở thẳng #mt14
    else if (push) { const u = new URL(location.href); u.searchParams.delete('sub'); u.hash = key; history.replaceState(null, '', u.pathname + u.search + u.hash); }
    refit();
    return key;
  };
  ROUTES.forEach(([key, label], i) => {
    const b = el('button', 'majortabbtn', label); b.type = 'button'; b.dataset.tab = key; b.id = 'research-tab-' + key; b.setAttribute('role', 'tab');
    const p = $(`.majorpane[data-tab="${key}"]`); if (p) { p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); b.setAttribute('aria-controls', p.id); }
    b.addEventListener('click', () => { select(key, null, true); window.scrollTo({top: 0, behavior: 'instant'}); });
    b.addEventListener('keydown', e => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return; e.preventDefault();
      const j = e.key === 'Home' ? 0 : e.key === 'End' ? ROUTES.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : ROUTES.length - 1)) % ROUTES.length; bar.children[j].click(); bar.children[j].focus(); });
    bar.append(b);
  });
  const urlSub = () => new URL(location.href).searchParams.get('sub');
  window.showMajorTab = k => select(k, null, true);
  window.addEventListener('hashchange', () => select(location.hash.slice(1), urlSub()));
  // Lần đầu: link cũ (#mt4, ?sub=players…) thì ghi lại URL theo chỗ mới.
  const h0 = location.hash.slice(1) || 'mt1', s0 = urlSub();
  select(h0, s0, !!ALIAS[h0] || !!(s0 && SUBALIAS[s0]));
  // Link trỏ vào thẻ / câu hỏi / khâu đã dời: mở đúng tab lớn + sub-tab rồi cuộn tới.
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'); if (!a || a.matches('.re-lg-go')) return;
    const t = document.getElementById(a.getAttribute('href').slice(1)); if (!t || t.matches('.majorpane')) return;
    const pane = t.closest('.majorpane'), sub = t.closest('.of-pane');
    if (!pane) return; e.preventDefault();
    select(pane.dataset.tab, sub?.dataset.sub, true);
    setTimeout(() => t.scrollIntoView({behavior: 'smooth', block: 'start'}), 120);
  });
}
// Thanh sub-tab dính ngay dưới thanh tab chính khi cuộn.
function stickySub() {
  const set = () => { const m = $('nav.majortabs'); if (!m) return; const cs = getComputedStyle(m); const top = (parseFloat(cs.top) || 0) + m.offsetHeight + 4; document.documentElement.style.setProperty('--of-top', top + 'px'); };
  set(); window.addEventListener('resize', set); setTimeout(set, 1500);
}

// Sơ đồ truyền dẫn thuế Mỹ → từng mã (26/11/2026). Chưa gắn từ 27/11/2026 (sub-tab 'tariff' cũ đã bỏ; host #of-mt4-tariff không còn): giữ dữ liệu, không gọi. Số thuế từ dm-24; khách hàng, đơn hàng từ dm-30/dm-33 (đã có nguồn trên trang).
// us: tỷ trọng Mỹ đã công bố (null = chưa có số công bố, không ước).
const TARIFF_ROWS = [
  {t: 'MSH', g: 'May xuất khẩu', us: '~80% XK (1H26)', ch: 'Khách Mỹ trực tiếp', mech: 'Bán FOB cho Columbia, Walmart, Target, Nike; nhà nhập khẩu Mỹ trả thuế rồi ép giá hoặc chuyển đơn.', ev: 'Đơn ổn định đến hết Q3/2026, cuối năm bất định; tồn kho 6T +83% so đầu năm; đang đẩy Nhật, liên doanh với tập đoàn dệt Hàn.', tone: 'neg', dir: 'Chịu mạnh nhất: phụ thuộc khách Mỹ', src: [['Stockbiz · MSH 1H2026', 'https://stockbiz.vn/tin-tuc/msh-linh-hoat-chuyen-dich-don-hang-duy-tri-nhip-tang-truong-thue-section-301-la-phep-thu-cua-nua-cuoi-2026/41651361'], ['ĐHĐCĐ MSH 2026', 'https://doanhnhan.baophapluat.vn/dhdcd-may-song-hong-msh-2026-don-hang-on-dinh-den-het-quy-3-dinh-huong-uu-tien-nguon-luc-cho-nguoi-lao-dong.html'], ['MSH Q2/2026', 'https://vnbusiness.vn/may-song-hong-lai-quy-ii-tang-13-lo-giai-bai-toan-vong-quay-hang-ton-kho.html']]},
  {t: 'TNG', g: 'May xuất khẩu', us: '~50% XK, EU 34% DT (2024)', ch: 'Khách Mỹ + EU', mech: 'Haddad, Columbia, Asmara (Mỹ) cùng Decathlon (EU): phần EU không chịu thuế Mỹ, đỡ một phần.', ev: 'Đã đẩy giao hàng Mỹ trước Mục 301 (24/7/2026); đơn đảm bảo đến hết 2026, nhưng 2H2026 tăng chậm lại.', tone: 'mix', dir: 'Giảm tốc ngắn hạn, đơn vẫn đủ', src: [['BSC · TNG', 'https://new.bsc.com.vn/Report/ReportFile/12766940'], ['FPTS · TNG', 'https://file.fpts.com.vn/FileStore2/File/2025/06/27/TNG_-_InitialValuationReport_-_Jun2025_96c58b58.pdf'], ['Shinhan · TNG Q2/2026', 'https://shinhansec.com.vn/uploads/report/TNG_Q2_2026_VN.pdf']]},
  {t: 'TCM', g: 'Sợi – dệt – may', us: '21% DT; Hàn 30%, Nhật 17% (2024)', ch: 'Khách Mỹ, đang dịch chuyển', mech: 'Chuỗi khép kín sợi – vải – may; giảm tỷ trọng Mỹ, tăng Nhật, Hàn.', ev: 'Đủ đơn đến hết Q2, Q3 mới có ~50% kế hoạch; LNST 6T/2026 −30%.', tone: 'neg', dir: 'Đơn Mỹ hụt, đang thay thị trường', src: [['VNDirect · TCM', 'https://vndirect.com.vn/cmsupload/beta/TCM_BCCapnhat_20250305.pdf'], ['ĐHĐCĐ TCM 2026', 'https://doanhnhan.baophapluat.vn/dhdcd-2026-det-may-thanh-cong-tcm-muc-tieu-loi-nhuan-ky-luc-293-ty-dong-du-kien-thu-lai-1-100-ty-tu-du-an-tc-tower.md'], ['TCM 6T/2026', 'https://vnbusiness.vn/det-may-thanh-cong-loi-nhuan-hut-hoi-co-phieu-roi-ve-day-gan-6-nam.html']]},
  {t: 'GIL', g: 'May + BĐS KCN', us: null, ch: 'May gia công', mech: 'Mảng may chịu thuế qua khách hàng; mảng bất động sản khu công nghiệp không chịu thuế trực tiếp.', ev: 'Chưa có khách hàng công bố; DT 6T/2026 +75%, CFO −680 tỷ.', tone: 'mix', dir: 'Pha loãng bởi mảng KCN', src: [['GIL Q2/2026', 'https://doanhnhan.baophapluat.vn/gilimex-gil-lai-tro-lai-trong-quy-ii-2026-nhung-dong-tien-kinh-doanh-am-ky-luc-hon-680-ty-dong.html']]},
  {t: 'VGT', g: 'Tập đoàn', us: '43,8% XK (6T25)', ch: 'Cả chuỗi sợi – may', mech: 'Mảng may chịu thuế qua đơn hàng; mảng sợi hưởng khi nhà may cần nguyên liệu trong nước để đạt xuất xứ.', ev: 'Từ tháng 7/2026 đơn hàng khan hiếm, khách chờ thuế; nhưng LNTT 9T/2026 +41%, mảng sợi lãi +168%.', tone: 'mix', dir: 'May yếu, sợi bù', src: [['FireAnt · VGT 6T2025', 'https://static.fireant.vn/Upload/AttachedFiles/VAnh-VGT-21072025a.pdf'], ['Vinatex 9T/2026', 'https://mekongasean.vn/vinatex-vuot-ke-hoach-loi-nhuan-nam-2026-sau-9-thang-60241.html'], ['Nhà Đầu Tư 13/07/2026', 'https://nhadautu.vn/vinatex-tng-tang-truong-tich-cuc-doanh-nghiep-det-may-van-doi-mat-ap-luc-d106264.html']]},
  {t: 'STK', g: 'Sợi', us: 'nội địa ~70% DT (9T25)', ch: 'Gián tiếp qua sợi', mech: 'Bán sợi polyester cho nhà dệt/may; thuế Mỹ làm giảm đơn may, còn yêu cầu xuất xứ (chống chuyển tải) tăng cầu sợi không đến từ Trung Quốc.', ev: 'Lỗ 72 tỷ 6T/2026, DT −6,6%: hiện tác động giảm đơn lớn hơn lợi thế xuất xứ.', tone: 'neg', dir: 'Đang chịu, lợi thế xuất xứ chưa hiện', src: [['FPTS · STK 9T2025', 'https://file.fpts.com.vn/FileStore2/File/2025/11/28/112025STKCap_nhat_nhanhHuyTG_f6a20453.pdf'], ['STK Q2/2026', 'https://mekongasean.vn/soi-the-ky-lo-quy-22026-gan-34-ty-dong-tien-mat-giam-hon-90-57857.html']]},
  {t: 'ADS', g: 'Sợi', us: null, ch: 'Gián tiếp qua sợi', mech: 'Sợi cotton cho nhà dệt trong và ngoài nước; chịu thuế qua đơn may của khách.', ev: 'Kế hoạch LNTT 2026 145 tỷ (+~20%); chưa có kết quả và khách hàng công bố.', tone: 'mix', dir: 'Chưa đủ dữ liệu', src: [['ADS KH 2026', 'https://doanhnhan.baophapluat.vn/cong-ty-damsan-ads-dat-ke-hoach-lai-145-ty-dong-cho-nam-2026-tang-truong-gan-20-so-voi-nam-truoc.html']]},
];
function tariffDiagram() {
  const host = $('#of-mt4-tariff .of-body'); if (!host || $('#tx-tariff-flow')) return;
  const icon = {pos: '▲', neg: '▼', mix: '◆'};
  const card = el('div', 'card of-wide'); card.id = 'tx-tariff-flow'; card.dataset.blockId = 'dm-tariff-flow';
  card.innerHTML = `<div class="chart-title">Thuế Mỹ truyền vào từng mã</div>
  <p class="of-lead">Việt Nam chịu thuế bổ sung <b class="neg">12,5%</b> (Mục 301, từ 24/7/2026), cao hơn Bangladesh, Campuchia, Indonesia <b>2,5 điểm %</b> và không có hạn ngạch miễn thuế.</p>
  <div class="tx-flow"><div class="tx-src"><span class="tx-k">Cú sốc</span><b>Thuế Mỹ 12,5%</b><small>Mục 301 · từ 24/7/2026</small></div>
  <div class="tx-rows">${TARIFF_ROWS.map(r => `<div class="tx-row ${r.tone}">
    <div class="tx-ch"><b>${r.t}</b><br><small>${r.g}${r.us != null ? ` · ${/^nội/.test(r.us) ? '' : 'Mỹ '}${r.us}` : ' · tỷ trọng Mỹ chưa công bố'}</small><br><span class="tx-k" style="margin-top:4px">${r.ch}</span></div>
    <div class="tx-mech">${r.mech}</div>
    <div class="tx-who"><span class="tx-k">Bằng chứng</span>${r.ev} <small>${r.src.map(([n, u]) => `<a href="${u}" target="_blank" rel="noopener">${n}</a>`).join(' · ')}</small></div>
    <div class="tx-dir"><i>${icon[r.tone]}</i>${r.dir}</div></div>`).join('')}</div></div>
  <div class="srcrow"><a href="https://www.kelleydrye.com/viewpoints/blogs/trade-and-manufacturing-monitor/ustr-announces-final-tariff-rates-exclusions-and-tariff-rate-quotas" target="_blank" rel="noopener">Kelley Drye · USTR Mục 301 (24/7/2026)</a></div>`;
  host.prepend(card);
  if (!$('#tx-tariff-style')) { const st = el('style'); st.id = 'tx-tariff-style'; st.textContent = 'body[data-tx-frame] #tx-tariff-flow .tx-src small,body[data-tx-frame] #tx-tariff-flow .tx-src .tx-k{color:#EEF0FF!important}'; document.head.append(st); }
}

function run() {
  if (document.body.dataset.txFrame) return; document.body.dataset.txFrame = '1';
  style();
  stickySub();
  // Bố cục cũ của từng tab, ghi lại trước khi dời thẻ (Tài chính còn lấy thẻ từ Tổng quan, Bức tranh lấy ô số từ mọi tab).
  const L = {}; ['mt1', 'mt2', 'mt3', 'mt4', 'mt6', 'mt10', 'mt11'].forEach(k => { const p = $(`.majorpane[data-tab="${k}"]`); if (p) L[k] = {pane: p, legacy: [...p.children]}; });
  const ov = buildOverview(), pic = buildPicture();
  const finHost = financePane();
  // Phần còn lại (thẻ chưa dời, ô số thừa): giữ trong DOM, ẩn trong details.of-rest cuối Bức tranh ngành. Khung trống của bố cục cũ bỏ.
  const box = el('div', 'research-detail'), hasData = n => n.matches?.('[data-block-id],.kpi') || !!n.querySelector?.('[data-block-id],.kpi,canvas,table,svg');
  ['mt1', 'mt2'].forEach(k => L[k]?.legacy.forEach(n => {
    if (n.parentElement !== L[k].pane || n.matches('.sectionhead,.pane-subtabs,.supply-tabs,.world-subtabs,[role=tablist]') || !hasData(n)) return;
    n.hidden = false; n.querySelectorAll('.supply-pane,.pane-subpane,[role=tabpanel]').forEach(h => { if (!h.querySelector('[data-block-id],canvas,table,svg,.kpi')) h.remove(); else h.hidden = false; });
    box.append(n);
  }));
  ['mt3', 'mt4', 'mt6', 'mt10', 'mt11'].forEach(k => { const p = L[k]?.pane; if (!p) return;
    [...p.querySelectorAll('[data-block-id]')].filter(n => !n.parentElement.closest('[data-block-id]')).forEach(n => { n.hidden = false; box.append(n); });
    p.hidden = true; p.classList.remove('active'); p.classList.add('of-hidden-legacy'); });
  if (box.children.length) { const d = el('details', 'research-fold of-rest'); d.append(el('summary', '', 'Nội dung khác của tab cũ'), box); pic.append(d); }
  L.mt1?.pane.replaceChildren(ov);
  L.mt2?.pane.replaceChildren(pic);
  nav(finHost);
  window.dispatchEvent(new Event('tx:frame'));  // app/sector-legal.js: tóm tắt văn bản, bảng Mới duyệt, nhãn luật trên chuỗi giá trị
}
// Dựng khung trong lượt SectorBoot (mốc 1600, sau mọi module ≤ 1500) để trang chỉ hiện khi khung đã xong.
if (window.SectorBoot) SectorBoot.add(1600, run);
else { const start = () => setTimeout(run, 1700); if (document.readyState === 'complete') start(); else window.addEventListener('load', start); }
})();
