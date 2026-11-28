/* Cá tra / Tôm · khung chuẩn Điện (DASHBOARD_WORKFLOW §42; bản đầu 26/11/2026 tách từ dashboard Thủy sản, mỗi ngành một gói).
   28/11/2026: đúng 4 tab lớn như Điện.
   Tab lớn: 1 Tổng quan ngành (#mt1, thanh .ov-nav: 00 Bản đồ ngành · 01 Chuỗi giá trị · 02 Triển vọng; Bản tin dữ liệu ở đầu)
          · 2 Bức tranh ngành (#mt2, thanh .pp-nav: 01 Thị trường xuất khẩu · 02 Chuỗi cá tra|Chuỗi tôm · 03 Chính sách — tab lớn
            Chính sách cũ (#mt4) thành sub-tab cuối, thanh con .pp-subnav theo văn bản như Điện › 06 Chính sách)
          · 3 Tài chính ngành (#mt14: 01 Tài chính ngành — BCTC cộng gộp app/seafood-finance.js · 02 Doanh nghiệp niêm yết · 03 Định giá
            — app/peer-valuation.js data-auto gắn vào #of-mt14-valuation .of-body)
          · 4 Chủ đề nóng (#mt7, giữ nguyên research-editorial).
   Mỗi sub-tab Bức tranh ngành: pp-head + "Dữ liệu mới nhất" (quan sát mới nhất của chuỗi trong sub-tab, đọc window.SEAFOOD_PUBLIC),
   2–4 ô số, thanh luồng Đầu vào → Sản xuất → Đầu ra (sub-tab chuỗi), câu hỏi đánh số: .pp-main (chart trả lời) → .pp-sup1 (chart phụ).
   Card cũ được DỜI theo data-block-id, không nhân bản, không xóa; card chưa có chỗ gom vào details.of-rest để không mất.
   Deep-link: ?sub=<khóa>#mtN (Chính sách: ?sub=policy&pol=<văn bản>#mt2); link cũ #mt3 → Chuỗi, #mt4/#mt10/?section=policy|tax →
   Bức tranh ngành › Chính sách (?sub=<văn bản>#mt4 mở đúng văn bản), #mt6 → Doanh nghiệp niêm yết, #mt8 → Tổng quan.
   Link "#<id>" tới thẻ/câu hỏi đã dời tự mở đúng tab + sub-tab rồi cuộn tới.
   Chạy bằng SectorBoot (mốc 1200: sau research-layout, research-editorial, pane-subtabs, labels-vi; trước chart-unfold 1400
   và dòng nguồn 1500) nên trang hiện thẳng bố cục cuối. */
(() => {
'use strict';
if (document.body.dataset.sector !== 'seafood') return;
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const block = id => $(`[data-block-id="${id}"]`);
const kpi = spark => $('#' + spark)?.closest('.kpi');
const fin = v => typeof v === 'number' && Number.isFinite(v);
const nf = (v, d = 1) => fin(v) ? v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}) : '—';
const sg = (v, d = 1) => fin(v) ? (v > 0 ? '+' : v < 0 ? '−' : '') + nf(Math.abs(v), d) : '—';

/* ---------- Ngành của trang ----------
   Từ 26/11/2026 Thủy sản tách thành hai dashboard độc lập: Ca-tra/ (body data-seafood-line="pang", route pangasius)
   và Tom/ (data-seafood-line="shrimp", route shrimp). Hai gói dùng chung file này; cây nội dung chọn theo ngành. */
const LINE = document.body.dataset.seafoodLine === 'shrimp' ? 'shrimp' : 'pang';
const PANG = LINE === 'pang', NAME = PANG ? 'cá tra' : 'tôm';

/* ---------- Số mới nhất từ dữ liệu (28/11/2026) ----------
   Ngày "Dữ liệu mới nhất" và ô số mới đều đọc thẳng window.SEAFOOD_PUBLIC (cùng nguồn với chart), không lấy ngày build. */
const SPB = () => window.SEAFOOD_PUBLIC?.blocks || {};
const meta = path => { const [b, k] = path.split('.'); return SPB()[b]?.series?.[k] || null; };
const recs = path => (meta(path)?.records || []).filter(r => r && r.date && fin(r.value)).slice().sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
const dmy = d => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;
const my = d => `${d.slice(5, 7)}/${d.slice(0, 4)}`;
// Chuỗi tháng ghi ngày 01 → hiện mm/yyyy; chuỗi có ngày quan sát thật → dd/mm/yyyy.
const showDate = (path, d) => meta(path)?.time_type === 'monthly' && d.endsWith('-01') ? my(d) : dmy(d);
const qEnd = p => { const m = /^(\d{4})Q(\d)$/.exec(p || ''); return m ? `${m[1]}-${String(m[2] * 3).padStart(2, '0')}-28` : ''; };
const qShow = p => String(p || '').replace(/^(\d{4})Q(\d)$/, 'Q$2/$1');
function latest(src) {
  if (src === '@pe') { const r = SPB().sector_ratio?.by_sector?.['238']?.records; const d = r?.length ? r[r.length - 1][0] : null; return d ? {d, t: dmy(d)} : null; }
  if (src === '@fr') { const docs = SPB().federal_register?.cases?.[PANG ? 'pangasius' : 'shrimp']?.documents || []; const d = docs.map(x => x.date).filter(Boolean).sort().pop(); return d ? {d, t: dmy(d)} : null; }
  if (src === '@legal') { const d = (window.SECTOR_LEGAL?.RECENT || []).map(r => String(r[0]).split('/').reverse().join('-')).filter(x => /^\d{4}-\d\d-\d\d$/.test(x)).sort().pop(); return d ? {d, t: dmy(d)} : null; }
  if (src === '@fin') { const p = window.SEAFOOD_FIN?.periods?.at(-1); return p ? {d: qEnd(p), t: qShow(p)} : null; }
  if (src === '@cq') { const q = window.COMPANY_QUARTERLY?.quarters?.at(-1); const m = /^Q(\d)\/(\d{4})$/.exec(q || ''); return m ? {d: qEnd(`${m[2]}Q${m[1]}`), t: q} : null; }
  if (src === '@val') { const V = window.COMPANY_VALUATION?.companies || {}, ts = (window.SEAFOOD_FIN?.companies || []).map(c => c.ticker); const d = ts.map(t => V[t]?.date).filter(x => /^\d{4}-\d\d-\d\d$/.test(x || '')).sort().pop(); return d ? {d, t: dmy(d)} : null; }
  const r = recs(src); if (!r.length) return null; const d = r[r.length - 1].date; return {d, t: showDate(src, d)};
}
// spec: [[nhãn, nguồn…], …] → "Dữ liệu mới nhất: Hải quan 09/2026 · P/E 26/11/2026" (mỗi nhóm lấy quan sát mới nhất trong các nguồn).
function asofText(spec) {
  const parts = (spec || []).map(([label, ...src]) => { const x = src.map(latest).filter(Boolean).sort((a, b) => a.d < b.d ? 1 : -1)[0]; return x ? `${label} ${x.t}` : null; }).filter(Boolean);
  return parts.length ? 'Dữ liệu mới nhất: ' + parts.join(' · ') : '';
}
// Bản ghi cùng kỳ năm trước (lệch tối đa 20 ngày) để tính % so cùng kỳ.
function lastYear(rs, r) {
  const t = new Date(r.date + 'T00:00:00Z'); t.setUTCFullYear(t.getUTCFullYear() - 1);
  let best = null, gap = 21 * 864e5;
  rs.forEach(x => { const g = Math.abs(new Date(x.date + 'T00:00:00Z') - t); if (g < gap) { gap = g; best = x; } });
  return best;
}
const yoyPct = (rs, r) => { const p = r && lastYear(rs, r); return p && p.value > 0 ? (r.value / p.value - 1) * 100 : null; };
// Ô số mới: cùng cấu trúc ô .kpi có sẵn (nhãn, giá trị + đơn vị, thay đổi, dòng phụ, sparkline của trang).
function tile(id, label, value, unit, delta, sub, vals, color) {
  const k = el('div', 'kpi sf-kpi-new');
  k.innerHTML = `<div class="label">${esc(label)}</div><div class="value">${esc(value)}${value !== '—' && unit ? `<span class="unit" style="font-size:12px;font-weight:600;color:var(--muted,#6b7a90);margin-left:6px;letter-spacing:0">${esc(unit)}</span>` : ''}</div><div class="delta">${esc(delta || '')}</div><div class="sub">${esc(sub || '')}</div><div id="${id}"></div>`;
  k._spark = () => { const v = (vals || []).filter(fin); if (v.length > 1 && typeof sparkline === 'function') { try { sparkline(id, v, color); } catch (e) { /* sparkline lỗi không chặn khung */ } } };
  return k;
}
function seriesTile(id, label, paths, unit, digits, color, subOf) {
  // Chọn chuỗi có quan sát mới nhất (bằng nhau thì chuỗi dài hơn để có số cùng kỳ).
  const pick = paths.map(p => ({p, r: recs(p)})).filter(x => x.r.length).sort((a, b) => { const da = a.r.at(-1).date, db = b.r.at(-1).date; return da !== db ? (da < db ? 1 : -1) : b.r.length - a.r.length; })[0];
  if (!pick) return null;
  const r = pick.r.at(-1), y = yoyPct(pick.r, r);
  return tile(id, label, nf(r.value, digits), unit, fin(y) ? `${sg(y, 1)}% so cùng kỳ` : '', subOf(pick.p, r), pick.r.slice(-12).map(x => x.value), color);
}
const srcName = p => meta(p)?.via === 'wi' ? 'WiData' : /VASEP/.test(meta(p)?.source || '') ? 'VASEP' : /IMF/.test(meta(p)?.source || '') ? 'IMF' : 'nguồn công khai';
const K_FRY = () => seriesTile('spk-fry', 'Cá tra giống', ['commodity.pangasius_fry_wi', 'commodity.pangasius_fry'], 'nghìn đ/kg', 1, '#c29100', (p, r) => `${srcName(p)} · ${showDate(p, r.date)}`);
const K_SOY = () => seriesTile('spk-soy', 'Khô đậu tương', ['commodity.soymeal'], 'USD/tấn', 0, '#6b7686', (p, r) => `IMF, bình quân tháng · ${showDate(p, r.date)}`);
const K_SHRIMP_DT = () => seriesTile('spk-shrimp-dt', 'Tôm chân trắng Đồng Tháp', ['commodity.shrimp50'], 'nghìn đ/kg', 1, '#861C52', (p, r) => `cỡ ${meta(p)?.size || '50–100 con/kg'} · VASEP · ${showDate(p, r.date)}`);
function K_EUP() {
  // Đơn giá EU nhập HS 0304 từ Việt Nam = giá trị ÷ khối lượng cùng tháng (benchmark đầu ra của spread ts-15).
  const v = recs('macro.eu_imp_0304_vn_eur'), k = Object.fromEntries(recs('macro.eu_imp_0304_vn_kg').map(r => [r.date, r.value]));
  const s = v.filter(r => k[r.date] > 0).map(r => ({date: r.date, value: r.value / k[r.date]})); if (!s.length) return null;
  const r = s.at(-1), y = yoyPct(s, r);
  return tile('spk-eup', 'Đơn giá EU nhập phi lê từ VN', nf(r.value, 2), 'EUR/kg', fin(y) ? `${sg(y, 1)}% so cùng kỳ` : '', `HS 0304 · ${my(r.date)} · WiData`, s.slice(-12).map(x => x.value), '#2938A8');
}
function K_USSHARE() {
  // Thị phần tôm (HS 0306) Việt Nam trong nhập khẩu của Mỹ, 12 tháng trượt (cùng cách tính với ts-22).
  const a = recs('macro.us_imp_0306_vn'), all = Object.fromEntries(recs('macro.us_imp_0306_all').map(r => [r.date, r.value]));
  const s = []; for (let i = 11; i < a.length; i++) { const w = a.slice(i - 11, i + 1); if (w.some(r => !fin(all[r.date]))) continue; const tot = w.reduce((x, r) => x + all[r.date], 0); if (tot > 0) s.push({date: a[i].date, value: w.reduce((x, r) => x + r.value, 0) / tot * 100}); }
  if (!s.length) return null;
  const r = s.at(-1), p = lastYear(s, r);
  return tile('spk-usshare', 'Thị phần VN trong NK giáp xác của Mỹ', nf(r.value, 1), '%', p ? `${sg(r.value - p.value, 1)} đ.p. so 12 tháng trước` : '', `12 tháng đến ${my(r.date)} · HS 0306 · WiData`, s.slice(-12).map(x => x.value), '#861C52');
}

/* ---------- Cây nội dung ----------
   Mỗi sub-tab: kpis (spark id của ô số có sẵn | hàm dựng ô số mới), asof (nguồn ngày dữ liệu), flow (các khâu),
   items: {grp} tiêu đề nhóm | {stage} tiêu đề khâu | {q} câu hỏi + card (take[0] → .pp-main, còn lại → .pp-sup1). */
const NOTE = html => () => el('p', 'sf-note', html);
const Q_MARKET = {q: 'Thị trường nào đang kéo kim ngạch?', id: 'sf-q-market', meta: '<span class="sf-period">Số tháng</span>Hải quan · toàn ngành thủy sản (cá tra, tôm, hải sản khai thác): Hải quan chưa tách theo mặt hàng', take: ['ts-10', '.fsv-heat']};
const Q_YTD = {q: `${PANG ? 'Cá tra' : 'Tôm'} đóng góp bao nhiêu, bán sang thị trường nào?`, id: 'sf-q-ytd', meta: '<span class="sf-period">Năm</span>cộng 12 tháng Hải quan · <span class="sf-period">Lũy kế</span>VASEP 10T/2026 và 2T/2026, không cộng lẫn với số tháng', take: ['ts-12', 'ts-23', 'ts-21', 'ts-14']};
const Q_USSHARE = {q: PANG ? 'Cá phi lê Việt Nam đang giữ hay mất thị phần ở Mỹ?' : 'Tôm Việt Nam đang giữ hay mất thị phần ở Mỹ?', id: 'sf-q-usshare',
  meta: PANG ? '% giá trị, 12 tháng trượt · đọc đường HS 0304 = phi lê cá mọi loài (cá tra là phần lớn của Việt Nam) · WiData bảng 312' : '% giá trị, 12 tháng trượt · đọc đường HS 0306 = giáp xác (tôm là phần lớn, gồm cả cua, tôm hùm) so với Ấn Độ · WiData bảng 312', take: ['ts-22']};
const Q_POR = {q: 'Kỳ rà soát nào sắp có kết luận?', id: 'sf-q-por', meta: `Federal Register · chỉ vụ ${NAME} · trạng thái sơ bộ/cuối cùng ghi ở từng dòng · đếm ngược theo 19 CFR 351.213(h)`, take: ['ts-43', 'ts-42']};
const Q_IUU = {q: 'IUU và MMPA chặn những mặt hàng nào?', id: 'sf-q-iuu', meta: 'theo sự kiện · áp cho hải sản khai thác, không trực tiếp cá tra, tôm nuôi', take: ['ts-50']};
const MARKET = {k: 'market', t: 'Thị trường xuất khẩu', d: `Kim ngạch theo thị trường và mặt hàng, tách số tháng, năm và lũy kế${PANG ? '; thị phần cá phi lê trong nhập khẩu của Mỹ' : ''}.`,
  kpis: ['spk-exp', 'spk-cn', 'spk-us', 'spk-pe'],
  asof: [['Hải quan', 'macro.exp_seafood', 'macro.exp_cn', 'macro.exp_us'], ...(PANG ? [['Mỹ nhập khẩu', 'macro.us_imp_0304_vn', 'macro.us_imp_0304_all']] : []), ['P/E', '@pe']],
  items: PANG ? [Q_MARKET, Q_YTD, {grp: 'Cạnh tranh tại Mỹ'}, Q_USSHARE] : [Q_MARKET, Q_YTD]};
const CHAIN = PANG
  ? {k: 'chain', t: 'Chuỗi cá tra', d: 'Đầu vào (giống, cá nguyên liệu, thức ăn) → Sản xuất (tín hiệu nguồn cung) → Đầu ra (đơn giá tham chiếu, spread sau nguyên liệu và thuế).',
    kpis: [K_FRY, K_SOY, 'spk-pang', K_EUP],
    asof: [['giá cá', 'commodity.pangasius', 'commodity.pangasius_wi', 'commodity.pangasius_fry', 'commodity.pangasius_fry_wi'], ['thức ăn', 'commodity.soymeal', 'commodity.corn'], ['EU nhập khẩu', 'macro.eu_imp_0304_vn_eur']],
    flow: [['in', 'Đầu vào', 'Giống, cá nguyên liệu, thức ăn'], ['prod', 'Sản xuất', 'Nguồn cung cá nguyên liệu'], ['out', 'Đầu ra', 'Giá tham chiếu, spread sau thuế']], items: [
    {stage: 'in'},
    {q: 'Chi phí nuôi cá tra nằm ở khoản nào?', id: 'sf-q-pang-cost', meta: '% tổng chi phí nuôi và % chi phí thức ăn · ước tính, không theo kỳ', take: ['ts-18', 'ts-19']},
    {q: 'Giá cá giống, cá nguyên liệu và thức ăn đang đi hướng nào?', id: 'sf-q-pang-in', meta: 'nghìn đ/kg cuối tháng (VASEP, WiData) · khô đậu, ngô % so cùng kỳ (IMF) · chỉ số chi phí thức ăn quy VND', take: ['ts-11', 'ts-13', 'ts-16']},
    {stage: 'prod'},
    {q: 'Giá cá giống đang báo trước nguồn cung cá nguyên liệu thế nào?', id: 'sf-q-pang-prod', take: ['ts-17'],
      after: NOTE('<b>Độ trễ 7 tháng là giả định</b> (chu kỳ nuôi 6–8 tháng), không phải số đo: điểm tháng t là giá giống tháng t−7. Dùng như tín hiệu theo dõi nguồn cung; chưa có số sản lượng cá tra nuôi theo tháng.')},
    {stage: 'out'},
    {q: 'Giá cá tăng đang hỗ trợ doanh thu hay gây sức ép lên biên?', id: 'sf-q-pang-out', meta: 'USD/kg phi lê · <b>spread mô phỏng</b>, không phải biên gộp BCTC', take: ['ts-15'],
      after: NOTE('<b>Cách tính spread:</b> đơn giá EU nhập HS 0304 từ Việt Nam (benchmark, không phải giá bán thực của doanh nghiệp) − cá nguyên liệu quy ra 1 kg phi lê (giả định 2,7 kg cá/kg phi lê) − CBPG theo doanh nghiệp. CBPG chỉ áp cho hàng vào Mỹ (ANV 0,84 USD/kg POR21; VHC 0 vì đã rút khỏi lệnh), nên dòng ANV chỉ đúng với phần bán sang Mỹ. Chưa trừ chi phí chế biến, Mục 301. Biên gộp thực tế theo BCTC: <a href="#ts-fin-q1-2">Tài chính ngành › 1.2</a> · <a href="#sf-q-gm">1.8</a>.')},
  ]}
  : {k: 'chain', t: 'Chuỗi tôm', d: 'Đầu vào (giá tôm nguyên liệu theo vùng, cỡ) → Đầu ra (thị phần ở Mỹ, thuế so với Ecuador, Ấn Độ).',
    kpis: ['spk-shrimp', K_SHRIMP_DT, K_USSHARE],
    asof: [['giá tôm', 'commodity.shrimp50_camau', 'commodity.shrimp50'], ['Mỹ nhập khẩu', 'macro.us_imp_0306_vn', 'macro.us_imp_0306_all']],
    flow: [['in', 'Đầu vào', 'Giá tôm nguyên liệu'], ['out', 'Đầu ra', 'Thị phần Mỹ, thuế so đối thủ']], items: [
    {stage: 'in'},
    {q: 'Giá tôm nguyên liệu theo vùng và cỡ đang tăng hay giảm?', id: 'sf-q-shrimp-in', meta: 'nghìn đ/kg cuối tháng · Cà Mau 50 con/kg (WiData) và Đồng Tháp (VASEP) là hai vùng, hai cỡ khác nhau', take: ['ts-20']},
    {stage: 'out'},
    Q_USSHARE,
    {q: 'Tôm Việt Nam chịu thuế ở Mỹ cao hay thấp hơn Ecuador, Ấn Độ?', id: 'sf-q-shrimp-out', build: shrimpOut,
      after: NOTE('<b>Chưa có trên trang:</b> giá xuất khẩu tôm thực nhận của doanh nghiệp, sản lượng tôm nuôi; cấu phần thuế của Ecuador, Ấn Độ chưa đủ (thuế Mỹ chung và CVD Ấn Độ chưa xác nhận văn bản), nên tổng thuế hai nước này là mức tối thiểu.')},
  ]};
// Chính sách (27/11/2026 tab lớn mt4; 28/11/2026 thành sub-tab cuối của Bức tranh ngành): mỗi văn bản/biện pháp một mục thanh con;
// tóm tắt 3–5 dòng, Mới duyệt, nhãn luật trên chuỗi giá trị do app/sector-legal.js + app/legal-config.js (tab: 'mt2') thêm.
const POL_AD = PANG
  ? {q: 'Mỗi doanh nghiệp cá tra chịu mức CBPG bao nhiêu?', id: 'sf-q-pangduty', meta: 'USD/kg · POR20 (8/2022–7/2023) → POR21 (8/2023–7/2024) · <b>cuối cùng</b> 13/08/2026 · áp riêng từng doanh nghiệp', take: ['ts-40', 'ts-42']}
  : {q: 'Tôm Việt Nam chịu CBPG, CVD cao hay thấp hơn Ecuador, Ấn Độ?', id: 'sf-q-shrimpduty', meta: '% giá trị · Việt Nam POR19 (2/2024–1/2025) <b>cuối cùng</b> 06/11/2026 · CVD Việt Nam <b>cuối cùng</b> 21/10/2024 · theo nhà xuất khẩu hoặc quốc gia', take: ['ts-41', 'ts-42']};
const POL_LANDED = {q: 'Cộng các lớp thuế, tôm vào Mỹ chịu bao nhiêu?', id: 'sf-q-landed', meta: '% giá trị · cộng thẳng các mức đã có văn bản, không gộp kỳ · "chưa xác nhận" = chưa mở văn bản', take: ['ts-44']};
const POLICY_SUBS = PANG ? [
    {k: 'ad', t: 'CBPG cá tra', d: 'Lệnh A-552-801: mức theo doanh nghiệp qua từng POR, ai đã thoát lệnh.', items: [POL_AD]},
    {k: 'por', t: 'Lịch rà soát & hoàng hôn', d: 'Kỳ POR sắp có kết luận, đếm ngược; rà soát hoàng hôn lần 4.', items: [Q_POR]},
    {k: 'tariff', t: 'Thuế Mỹ chung', d: 'Mục 122 → Mục 301, cộng chồng lên CBPG.', items: []},
    {k: 'iuu', t: 'Thẻ vàng IUU', d: 'Kế hoạch gỡ thẻ vàng EU; tác động gián tiếp tới cá tra.', items: [Q_IUU]},
    {k: 'mmpa', t: 'MMPA (NOAA)', d: '12 nghề cá bị cấm vào Mỹ từ 01/01/2026.', items: []},
    {k: 'docs', t: 'Mới duyệt gần đây', d: 'Văn bản, kết luận 12 tháng qua, mới nhất trước.', items: []}]
  : [
    {k: 'ad', t: 'CBPG tôm', d: 'Lệnh A-552-802: mức theo nhà xuất khẩu, so với Ecuador, Ấn Độ.', items: [POL_AD]},
    {k: 'cvd', t: 'CVD tôm', d: 'Thuế chống trợ cấp kết luận 21/10/2024.', items: []},
    {k: 'tariff', t: 'Thuế Mỹ chung & tổng thuế', d: 'Mục 122 → Mục 301; cộng các lớp thuế vào Mỹ.', items: [POL_LANDED]},
    {k: 'por', t: 'Lịch rà soát POR', d: 'Kỳ POR sắp có kết luận và đếm ngược.', items: [Q_POR]},
    {k: 'iuu', t: 'IUU & MMPA', d: 'Thẻ vàng EU và cấm nhập theo MMPA — áp cho hải sản khai thác.', items: [Q_IUU]},
    {k: 'docs', t: 'Mới duyệt gần đây', d: 'Văn bản, kết luận 12 tháng qua, mới nhất trước.', items: []}];
const POLICY = {k: 'policy', t: 'Chính sách', d: PANG ? 'CBPG cá tra theo doanh nghiệp → lịch POR, hoàng hôn → thuế Mỹ chung → IUU, MMPA; mỗi văn bản một mục.' : 'CBPG, CVD tôm → tổng thuế vào Mỹ → lịch POR → IUU, MMPA; mỗi văn bản một mục.',
  asof: [['văn bản', '@fr', '@legal']], inner: POLICY_SUBS};
const INNER = new Set(POLICY_SUBS.map(s => s.k));
const TREE = {
  mt1: {title: 'Tổng quan ngành', subs: [
    {k: 'map', t: 'Bản đồ ngành', s: PANG ? 'Giống, thức ăn → nuôi → phi lê → xuất khẩu' : 'Thức ăn → tôm nuôi → chế biến → xuất khẩu', d: PANG ? 'Thức ăn và giống → vùng nuôi → chế biến phi lê → thị trường xuất khẩu; vị trí doanh nghiệp cá tra và ASM (thức ăn, sở hữu IDI).' : 'Thức ăn → tôm nuôi (hộ nuôi, một phần tự nuôi) → chế biến → thị trường xuất khẩu; đối thủ Ecuador, Ấn Độ và thuế Mỹ.', items: [
      {q: `Chuỗi ${NAME} đi từ đâu đến đâu, doanh nghiệp đứng ở khâu nào?`, id: 'sf-q-map', take: ['.research-roadmap', 'ts-01', '.fsv-flow']},
    ]},
    {k: 'value', t: 'Chuỗi giá trị', s: 'Tự nuôi hay thu mua nguyên liệu', d: 'Doanh nghiệp kiếm tiền ở khâu nào và biến nào quyết định biên.', items: [
      {q: 'Doanh nghiệp kiếm tiền ở khâu nào?', id: 'sf-q-model', take: ['.business-models']},
      {q: 'Nguyên liệu tự nuôi hay thu mua, biến nào quyết định biên?', id: 'sf-q-driver', take: ['ts-04']},
    ]},
    {k: 'outlook', t: 'Triển vọng', s: 'Ba biến cần theo dõi', d: 'Ba biến cần theo dõi: số hoặc sự kiện gần nhất, hàm ý với doanh nghiệp, kỳ cần kiểm tiếp.', items: [
      {q: 'Ba biến nào sẽ quyết định kết quả các quý tới?', id: 'sf-q-outlook', take: ['ts-05'], old: 'ts-02'},
    ]},
  ]},
  mt2: {title: 'Bức tranh ngành', subs: [MARKET, CHAIN, POLICY]},
  mt14: {title: 'Tài chính ngành', subs: [
    {k: 'sector', t: 'Tài chính ngành', d: `Cộng gộp BCTC hợp nhất quý của rổ ${PANG ? 'cá tra (VHC, ANV, IDI) và ASM' : 'tôm (FMC, CMX, MPC)'}: kết quả, biên, đầu tư, dòng tiền, nợ, hiệu quả vốn.`, asof: [['BCTC', '@fin']], fin: true, items: [
      {q: PANG ? 'Biên gộp cá tra theo rổ mã đang mở rộng hay thu hẹp?' : 'Biên gộp tôm theo rổ mã đang mở rộng hay thu hẹp?', num: '1.8', id: 'sf-q-gm', meta: PANG ? '% · Σ lãi gộp ÷ Σ doanh thu thuần cùng rổ · BCTC hợp nhất quý (bộ số so sánh doanh nghiệp) · loại trùng ASM–IDI' : '% · Σ lãi gộp ÷ Σ doanh thu thuần cùng rổ · BCTC hợp nhất quý (bộ số so sánh doanh nghiệp)', take: ['ts-06']},
    ]},
    {k: 'listed', t: 'Doanh nghiệp niêm yết', d: 'So sánh tài chính, xu hướng theo quý, bộ lọc mã; kế hoạch và kết quả 2026; P/E rổ theo phiên.', asof: [['BCTC', '@cq'], ['P/E', '@pe']], items: [
      {q: 'Doanh nghiệp nào sinh lời tốt hơn, định giá ra sao?', id: 'sf-q-compare', meta: 'số quý, lũy kế hoặc cả năm theo bộ chọn kỳ · phạm vi hợp nhất hoặc thuộc cổ đông công ty mẹ theo định nghĩa nguồn', take: ['.financial-comparison']},
      {q: 'Doanh nghiệp đã đi được bao nhiêu so với kế hoạch 2026?', id: 'sf-q-plan', meta: 'tỷ đồng · kế hoạch cả năm so với kết quả 6T/2026 (lũy kế) trừ khi ghi khác', take: ['ts-60']},
      {q: 'Thị trường đang định giá rổ thủy sản ở mức nào?', id: 'sf-q-pe', meta: 'lần · rổ mã thủy sản theo dõi (cá tra và tôm, VNDirect) · theo phiên: nguồn chưa có P/E riêng từng ngành', take: ['ts-03']},
    ]},
    {k: 'valuation', t: 'Định giá', d: 'P/B so với ROE, biên gộp so với ROE, lợi suất lợi nhuận, P/E và EV/dòng tiền: từng mã so với rổ.', asof: [['P/E, P/B', '@val'], ['BCTC', '@fin']], valuation: true, items: []},
  ]},
};
const ROUTES = [['mt1', 'Tổng quan ngành'], ['mt2', 'Bức tranh ngành'], ['mt14', 'Tài chính ngành'], ['mt7', 'Chủ đề nóng']];
// Link cũ → [tab lớn, sub-tab]; khóa sub-tab của trang Thủy sản gộp cũ cũng đổi sang khóa mới.
const ALIAS = {mt3: ['mt2', 'chain'], mt4: ['mt2', 'policy'], mt10: ['mt2', 'policy'], mt5: ['mt1'], mt6: ['mt14', 'listed'], mt8: ['mt1']};
const SECTION = {policy: ['mt2', 'policy'], tax: ['mt2', 'policy'], trade: ['mt2', 'policy'], pangasius: ['mt2', 'chain'], shrimp: ['mt2', 'chain'], market: ['mt2', 'market'], finance: ['mt14', 'sector'], listed: ['mt14', 'listed'], valuation: ['mt14', 'valuation']};
const SUBALIAS = {all: 'market', pang: 'chain', shrimp: 'chain', chain: 'chain'};

/* ---------- Phần dựng riêng ---------- */
function shrimpOut() {
  // Thuế tôm nằm ở Bức tranh ngành › Chính sách: thẻ dẫn (.th-link), không lặp chart.
  const box = el('div', 'sf-links');
  box.innerHTML = [
    ['#sf-q-shrimpduty', 'Bức tranh ngành › Chính sách › 3.1', 'CBPG, CVD tôm: Việt Nam so với Ecuador, Ấn Độ', 'Sao Ta/Fimex 10,71% (POR19 cuối cùng 06/11/2026) · CVD Việt Nam 2,84%'],
    ['#sf-q-landed', 'Bức tranh ngành › Chính sách › 3.2', 'Cấu phần thuế tôm vào Mỹ', 'CBPG + CVD + thuế Mỹ chung, từng nước'],
  ].map(([h, k, t, s]) => `<a class="th-link sf-link" href="${h}"><small>${k}</small><b>${t}</b><span>${s}</span></a>`).join('');
  return box;
}

function lineFilter() {
  // Bố cục cũ dựng chung cho cá tra và tôm: ẩn phần của ngành kia (mô hình kinh doanh, dòng POR, đếm ngược).
  const other = PANG ? /^Tôm/ : /^(Cá tra|Đa ngành)/;
  $$('.business-models .business-model-grid > *').forEach(c => { const h = c.querySelector('h3,h4,strong,b')?.textContent.trim() || ''; const tag = [...c.querySelectorAll('h3,h4')].map(x => x.textContent.trim()).join(' '); if (other.test(tag || h)) c.remove(); });
  $$('#tbl-por tbody tr').forEach(r => { const v = r.children[1]?.textContent.trim() || ''; if (PANG ? v === 'Tôm' : v === 'Cá tra') r.remove(); });
  $$('#por-countdown .kpi').forEach(k => { const l = k.textContent.trim(); if (PANG ? /^Tôm/.test(l) : /^Cá tra/.test(l)) k.remove(); });
}

function groupMargin() {
  // Biên gộp nhóm = Σ lãi gộp ÷ Σ doanh thu thuần của rổ mã trong cùng quý; thiếu số của mã nào trong rổ → để trống quý đó.
  const host = document.getElementById('chGroupGM'), D = window.COMPANY_QUARTERLY;
  if (!host || !D || host.dataset.done) return; host.dataset.done = '1';
  const rows = Object.fromEntries((D.companies || []).filter(c => ['seafood', 'pangasius', 'shrimp'].includes(c.sector)).map(c => [c.symbol, c]));
  const G = (PANG
    ? [['Cá tra', ['VHC', 'ANV', 'IDI'], '#2938A8'], ['Đa ngành', ['ASM'], '#c29100'], ['Toàn rổ (bỏ IDI)', ['VHC', 'ANV', 'ASM'], '#6b7686']]
    : [['Tôm', ['FMC', 'CMX'], '#861C52'], ['FMC', ['FMC'], '#2938A8'], ['CMX', ['CMX'], '#c29100']])
    .map(([name, syms, color]) => ({name, syms: syms.filter(s => rows[s]), color}));
  const Q = D.quarters || [], from = Math.max(0, Q.length - 16), qs = Q.slice(from);
  const val = (g, i) => { let r = 0, p = 0; for (const s of g.syms) { const a = rows[s].revenue?.[i], b = rows[s].gross_profit?.[i]; if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0) return null; r += a; p += b; } return g.syms.length ? p / r * 100 : null; };
  G.forEach(g => { g.values = qs.map((_, j) => val(g, from + j)); });
  if (typeof barLineChart !== 'function') return;
  barLineChart('chGroupGM', {categories: qs, series: G.map(g => ({name: g.name, color: g.color, kind: 'line', values: g.values})), unit: '%', digits: 1, height: 260, rotateLabels: true, aria: `Biên gộp theo quý, ${NAME}`});
  const lg = el('div', 'legend'); G.forEach(g => { const s = el('span', 'li'), d = el('span', 'dot'); d.style.background = g.color; s.append(d, g.syms.length > 1 ? `${g.name} (${g.syms.join(', ')})` : g.name); lg.append(s); }); host.after(lg);
  if (typeof fillTable === 'function') fillTable('tbl-group-gm', ['Quý', ...G.map(g => g.name + ' (%)')], qs.map((q, j) => [q, ...G.map(g => nf(g.values[j], 1))]).reverse());
  const anyRow = Object.values(rows)[0];
  const src = D.sources?.[anyRow?.source || 'vnd'] || D.sources?.vnd || {name: 'BCTC hợp nhất quý'};
  const n = el('div', 'source-note cadence-note'); n.append('Nguồn: ');
  const a = el('a', '', esc(src.name)); a.href = src.url || '#'; a.target = '_blank'; a.rel = 'noopener'; n.append(a);
  lg.after(n);
  const want = PANG ? ['VHC', 'ANV', 'IDI', 'ASM'] : ['FMC', 'MPC', 'CMX'];
  const miss = want.filter(s => !rows[s]);
  if (miss.length) n.after(el('div', 'source-note method-note', `${esc(miss.join(', '))} chưa có BCTC quý trong bộ dữ liệu so sánh doanh nghiệp nên chưa vào rổ của chart này${PANG ? '' : ' (MPC có trong số cộng gộp ở 1.1–1.7)'}.`));
}

function outlookFill() {
  // Số mới nhất cho 3 biến Triển vọng lấy từ ô số / bảng đã dựng trên trang (cùng nguồn với chart).
  const set = (k, t) => { const n = $(`[data-sf-fill="${k}"]`); if (n && t) n.textContent = t; };
  const kp = sp => { const c = kpi(sp); if (!c) return null; const v = c.querySelector('.value'), u = v?.querySelector('.unit'); return {l: c.querySelector('.label')?.textContent.trim(), v: u ? v.firstChild.textContent.trim() : v?.textContent.trim(), u: u?.textContent.trim() || '', d: c.querySelector('.delta')?.textContent.trim(), s: c.querySelector('.sub')?.textContent.trim()}; };
  const fmt = (x, name) => x && x.v && x.v !== '—' ? `${name}: ${x.v} ${x.u} (${[x.d, x.s].filter(Boolean).join(' · ')})` : null;
  set('cn', fmt(kp('spk-cn'), 'Sang Trung Quốc')); set('us', fmt(kp('spk-us'), 'Sang Mỹ'));
  set('pang', fmt(kp('spk-pang'), 'Cá tra nguyên liệu'));
  const t = document.getElementById('tbl-pang-spread'), r = t?.querySelector('tbody tr');
  if (r) { const c = [...r.children].map(x => x.textContent.trim()); set('spread', `Spread mô phỏng ${c[0]}: VHC ${c[4]}, ANV ${c[5]} USD/kg phi lê`); }
  set('shrimp', fmt(kp('spk-shrimp'), 'Tôm thẻ Cà Mau 50 con/kg'));
  const u = document.getElementById('tbl-us-share'), h = [...(u?.querySelectorAll('thead th') || [])].map(x => x.textContent.trim()), ur = u?.querySelector('tbody tr');
  if (ur) { const c = Object.fromEntries([...ur.children].map((x, i) => [h[i], x.textContent.trim()])); set('usshare', `Thị phần nhập khẩu giáp xác của Mỹ, 12 tháng đến ${c['Tháng']}: Việt Nam ${c['VN 0306 (%)']}%, Ấn Độ ${c['Ấn Độ 0306 (%)']}%`); }
  const p = $('#por-countdown .kpi');
  if (p) set('por', [...p.children].map(x => x.textContent.trim()).filter(Boolean).join(' · '));
}

function briefScope() {
  // Bản tin dữ liệu: mỗi ô số ghi rõ đơn vị (đã có), kỳ và phạm vi.
  const S = [[/^XK hàng thủy sản/, 'Số tháng, toàn ngành thủy sản (cá tra, tôm, hải sản khai thác) · % so cùng tháng năm trước · Hải quan'],
    [/Trung Quốc/, 'Số tháng theo nước · % là lũy kế từ đầu năm so cùng kỳ · Hải quan'],
    [/Mỹ/, 'Số tháng theo nước · % là lũy kế từ đầu năm so cùng kỳ · Hải quan'],
    [/Cá tra nguyên liệu/, 'Giá ngày, cá thịt trắng Đồng Tháp · % so cùng kỳ · VASEP'],
    [/Tôm thẻ/, 'Giá Cà Mau, cỡ 50 con/kg · % so cùng kỳ · WiData'],
    [/P\/E/, 'Rổ mã thủy sản theo dõi, theo phiên · VNDirect']];
  $$('#dataBrief .db-c').forEach(c => { if (c.querySelector('.db-scope')) return; const l = c.querySelector('.db-ch')?.textContent || ''; const hit = S.find(([re]) => re.test(l)); if (hit) c.append(el('div', 'db-scope', hit[1])); });
}

/* ---------- Dựng ---------- */
const TABS = {}, INNERTABS = [], used = new Set(), sparks = [];
function take(sel) {
  const n = /^ts-/.test(sel) ? block(sel) : $(sel);
  if (!n || used.has(n) || [...used].some(u => u.contains(n))) return null;
  used.add(n); n.hidden = false; n.classList.remove('sf-hidden-legacy');
  if (n.matches('.card') && (n.querySelector('table') && !n.querySelector('[id^="ch"]') || n.querySelectorAll('[id^="ch"]').length > 1)) n.classList.add('sf-wide');
  if (/^ts-(01|04|05|22|43|44|42|50|60)$/.test(sel)) n.classList.add('sf-wide');
  return n;
}
// Một câu hỏi: header.pp-ph (số + câu hỏi) → .pp-main (chart trả lời chính) → .pp-sup1 (chart phụ, ghi chú) → .pp-more (bản cũ).
function question(it, pn) {
  const panel = el('section', 'pp-panel pp-q'); panel.id = it.id;
  panel.innerHTML = `<header class="pp-ph"><span class="pp-num">${it.num || pn}</span><div><h3>${esc(it.q)}</h3>${it.meta ? `<p class="sf-meta">${it.meta}</p>` : ''}</div></header>`;
  // Đúng một chart trả lời trong .pp-main, chart phụ đầu tiên trong .pp-sup1, phần còn lại .pp-more (≥2 thẻ: lưới hai cột) như Điện.
  const main = el('div', 'pp-main');
  const nodes = (it.take || []).map(take).filter(Boolean);
  if (it.build) nodes.push(it.build());
  if (nodes.length) main.append(nodes.shift());
  panel.append(main);
  if (nodes.length) { const s1 = el('div', 'pp-sup1'); s1.append(nodes.shift()); panel.append(s1); }
  if (nodes.length) { const g = el('div', nodes.length > 1 ? 'grid two g2 pp-sup pp-more sf-grid' : 'pp-sup1 pp-more'); nodes.forEach(n => g.append(n)); panel.append(g); }
  if (it.after) panel.append(it.after());
  if (it.old) { const o = take(it.old); if (o) { const d = el('details', 'pp-more sf-old'); d.append(el('summary', '', 'Phân tích AI ngày 09/10/2026 (bản cũ, giữ để đối chiếu)'), o); panel.append(d); } }
  return panel;
}
function kpiStrip(list) {
  const g = el('section', 'grid kpis pp-kpis');
  (list || []).forEach(x => { const c = typeof x === 'function' ? x() : kpi(x); if (!c) return; g.append(c); if (c._spark) sparks.push(c._spark); });
  return g.children.length ? g : null;
}
function head(num, s, h = 'h2') {
  const a = s.asof ? asofText(s.asof) : '';
  return el('header', 'pp-head', `<div><span class="pp-k">${num}</span><${h}>${esc(s.t)}</${h}><p>${esc(s.d)}</p></div>${s.asof ? `<span class="pp-asof">${esc(a)}</span>` : ''}`);
}
function buildInner(p, s, qBase) {
  // Chính sách: thanh con .pp-subnav, mỗi văn bản một khung #sf-mt2-<k> (sector-legal.js chèn tóm tắt sau .pp-head của khung).
  const sub = el('div', 'pp-subnav'); sub.setAttribute('role', 'tablist'); sub.setAttribute('aria-label', 'Chính sách theo văn bản'); p.append(sub);
  let qn = 0;
  s.inner.forEach((x, j) => {
    const b = el('button', '', esc(x.t)); b.type = 'button'; b.setAttribute('role', 'tab'); b.id = `sf-mt2-${x.k}-tab`; b.dataset.pol = x.k;
    const ip = el('div', 'sf-ipane'); ip.id = `sf-mt2-${x.k}`; ip.dataset.pol = x.k; ip.setAttribute('role', 'tabpanel'); ip.setAttribute('aria-labelledby', b.id); b.setAttribute('aria-controls', ip.id);
    ip.append(el('header', 'pp-head sf-ihead', `<div><h3>${esc(x.t)}</h3><p>${esc(x.d)}</p></div>`));
    x.items.forEach(it => { qn++; ip.append(question(it, `${qBase}.${qn}`)); });
    sub.append(b); p.append(ip);
    b.addEventListener('click', () => { openInner(x.k, true); });
    b.addEventListener('keydown', e => { const d = {ArrowRight: 1, ArrowLeft: -1}[e.key]; if (!d) return; e.preventDefault(); const k = (j + d + s.inner.length) % s.inner.length; sub.children[k].click(); sub.children[k].focus(); });
    INNERTABS.push({k: x.k, b, p: ip});
  });
}
function openInner(k, push) {
  const hit = INNERTABS.find(x => x.k === k) || INNERTABS[0]; if (!hit) return;
  if (TABS.mt2 && TABS.mt2.find(x => x.s.k === 'policy')?.p.hidden) open('mt2', 'policy', push);
  INNERTABS.forEach(x => { const on = x === hit; x.b.setAttribute('aria-selected', String(on)); x.b.tabIndex = on ? 0 : -1; x.p.hidden = !on; });
  if (push) { const u = new URL(location.href); u.searchParams.set('sub', 'policy'); u.searchParams.set('pol', hit.k); u.searchParams.delete('section'); u.hash = 'mt2'; history.replaceState(null, '', u.pathname + u.search + u.hash); }
  setTimeout(() => window.dispatchEvent(new Event('resize')), 30);
}
function buildTab(key) {
  const def = TREE[key];
  let pane = $(`.majorpane[data-tab="${key}"]`);
  if (!pane) { pane = el('div', 'majorpane'); pane.dataset.tab = key; pane.id = 'pane-' + key; pane.hidden = true; ($('.majorpane[data-tab="mt7"]') || $('.majorpane:last-of-type')).before(pane); }
  const legacy = [...pane.children];
  const sec = el('section', 'section sf-section');
  if (key === 'mt1') { const brief = $('#dataBrief'); if (brief) sec.append(brief); }
  // Tổng quan: thanh thẻ .ov-nav (số 00 + tiêu đề + dòng phụ) như Điện; tab khác: thanh gọn .pp-nav.
  const OV = key === 'mt1';
  const nav = el('div', OV ? 'ov-nav' : 'pp-nav'); nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', def.title); sec.append(nav);
  const subs = def.subs.map((s, i) => {
    const lab = String(OV ? i : i + 1).padStart(2, '0');
    const b = el('button', OV ? 'tabbtn ov-tab' : 'tabbtn pp-tab', `<span>${lab}</span>${esc(s.t)}${OV ? `<small>${esc(s.s || '')}</small>` : ''}`); b.type = 'button'; b.setAttribute('role', 'tab'); b.id = `sf-${key}-${s.k}-tab`; b.dataset.sub = s.k;
    const p = el('div', 'pp-pane sf-pane'); p.id = s.valuation ? 'of-mt14-valuation' : `sf-${key}-${s.k}`; p.dataset.sub = s.k; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); b.setAttribute('aria-controls', p.id);
    p.append(head(lab, s));
    const strip = kpiStrip(s.kpis); if (strip) p.append(strip);
    if (s.flow) {
      const bar = el('nav', 'pp-flow'); bar.setAttribute('aria-label', 'Luồng ' + s.t.toLowerCase());
      bar.innerHTML = s.flow.map(([id, k, t], j) => `${j ? '<span class="pp-flow-ar" aria-hidden="true">→</span>' : ''}<a href="#sf-st-${s.k}-${id}" class="pp-flow-s"><small>${k}</small><b>${esc(t)}</b></a>`).join('');
      p.append(bar);
    }
    if (s.fin) p.append(el('div', 'ts-fin-host'));   // app/seafood-finance.js dựng 1.1–1.7 khi chỗ này hiện
    if (s.valuation) p.append(el('div', 'of-body'));  // app/peer-valuation.js (data-auto) gắn 4 chart định giá vào đây
    if (s.inner) buildInner(p, s, OV ? i : i + 1);
    let qn = 0;
    (s.items || []).forEach(it => {
      if (it.grp) { p.append(el('h3', 'pp-grp', esc(it.grp))); return; }
      if (it.stage) { const f = s.flow.find(x => x[0] === it.stage); const h = el('div', 'pp-stage', `<span>${f[1]}</span><h3>${esc(f[2])}</h3>`); h.id = `sf-st-${s.k}-${f[0]}`; p.append(h); return; }
      qn++; p.append(question(it, `${OV ? i : i + 1}.${qn}`));
    });
    const nx = def.subs[i + 1];
    if (nx) { const go = el('button', 'sf-next', `Tiếp: ${esc(nx.t)} →`); go.type = 'button'; go.addEventListener('click', () => { open(key, nx.k, true); nav.scrollIntoView({behavior: 'instant', block: 'start'}); }); p.append(go); }
    nav.append(b); sec.append(p);
    b.addEventListener('click', () => open(key, s.k, true));
    b.addEventListener('keydown', e => { const d = {ArrowRight: 1, ArrowLeft: -1}[e.key]; if (!d) return; e.preventDefault(); const j = (i + d + def.subs.length) % def.subs.length; nav.children[j].click(); nav.children[j].focus(); });
    return {s, b, p};
  });
  TABS[key] = subs;
  // Thay nội dung pane sau khi MỌI tab đã dựng (tab sau còn lấy thẻ nằm trong tab cũ này, vd. ts-03 ở Tổng quan cũ).
  return {pane, sec, legacy};
}
function commit({pane, sec, legacy}) {
  const rest = [];
  legacy.forEach(n => { if (sec.contains(n)) return; if (n.querySelector?.('[data-block-id],canvas,table,svg') || n.matches?.('[data-block-id]')) rest.push(n); });
  pane.replaceChildren(sec);
  return rest;
}
function parkRest(nodes) {
  const live = nodes.filter(n => n.querySelector?.('[data-block-id]:not(.sf-hidden-legacy),canvas,table,svg'));
  live.forEach(n => n.querySelectorAll('.supply-tabs,.pane-subtabs,.sectionhead').forEach(x => x.classList.add('sf-hidden-legacy')));
  const real = live.filter(n => [...n.querySelectorAll('[data-block-id]')].some(b => !used.has(b) && ![...used].some(u => u.contains(b))) || (n.matches('[data-block-id]') && !used.has(n)));
  if (!real.length) return;
  const host = TABS.mt1[0].p, d = el('details', 'research-fold sf-rest of-rest');
  d.append(el('summary', '', 'Nội dung khác của bố cục cũ'));
  const box = el('div', 'research-detail'); real.forEach(n => { n.hidden = false; n.querySelectorAll('[hidden]').forEach(h => { if (h.matches('.supply-pane,.pane-subpane')) h.hidden = false; }); box.append(n); });
  d.append(box); host.append(d);
}

function open(key, sub, push) {
  const subs = TABS[key]; if (!subs) return;
  sub = SUBALIAS[sub] || sub;
  let pol = null;
  if (key === 'mt2' && INNER.has(sub)) { pol = sub; sub = 'policy'; }   // ?sub=<văn bản>: khóa sub-tab của tab Chính sách cũ
  const hit = subs.find(x => x.s.k === sub) || subs[0];
  subs.forEach(x => { const on = x === hit; x.b.setAttribute('aria-selected', String(on)); x.b.classList.toggle('active', on); x.b.tabIndex = on ? 0 : -1; x.p.hidden = !on; });
  if (push) { const u = new URL(location.href); u.searchParams.set('sub', hit.s.k); if (hit.s.k !== 'policy') u.searchParams.delete('pol'); u.searchParams.delete('section'); u.hash = key; history.replaceState(null, '', u.pathname + u.search + u.hash); }
  if (hit.s.k === 'policy') { const cur = INNERTABS.find(x => !x.p.hidden); openInner(pol || new URL(location.href).searchParams.get('pol') || cur?.k || INNERTABS[0]?.k, push); }
  setTimeout(() => window.dispatchEvent(new Event('resize')), 30);
  window.dispatchEvent(new Event('pv:toc'));
}

function nav() {
  const bar = $('nav.majortabs') || $('.majortabbtn')?.parentElement; if (!bar) return;
  bar.replaceChildren();
  const select = (key, hash) => {
    let sub = null;
    if (ALIAS[key]) { const old = key; [key, sub] = ALIAS[key]; sub = sub || TREE[key]?.subs[0].k;
      // ?sub=<văn bản>#mt4 (link tab Chính sách cũ) → đúng mục văn bản trong Bức tranh ngành › Chính sách.
      const want = new URL(location.href).searchParams.get('sub'); if ((old === 'mt4' || old === 'mt10') && INNER.has(want)) sub = want; }
    if (!ROUTES.some(r => r[0] === key)) key = 'mt1';
    $$('.majorpane').forEach(p => { const on = p.dataset.tab === key; p.hidden = !on; p.classList.toggle('active', on); });
    [...bar.children].forEach(b => { const on = b.dataset.tab === key; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    if (sub) open(key, sub, true);
    else if (TABS[key]) open(key, (TABS[key].find(x => !x.p.hidden) || TABS[key][0]).s.k, !!hash || /[?&]sub=/.test(location.search));
    else if (hash || /[?&]sub=/.test(location.search)) { const u = new URL(location.href); if (!TABS[key]) { u.searchParams.delete('sub'); u.searchParams.delete('pol'); } u.searchParams.delete('section'); u.hash = key; history.replaceState(null, '', u.pathname + u.search + u.hash); }
    setTimeout(() => window.dispatchEvent(new Event('resize')), 30);
    return key;
  };
  ROUTES.forEach(([key, label], i) => {
    const b = el('button', 'majortabbtn', label); b.type = 'button'; b.dataset.tab = key; b.id = 'research-tab-' + key; b.setAttribute('role', 'tab');
    const p = $(`.majorpane[data-tab="${key}"]`); if (p) { p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); b.setAttribute('aria-controls', p.id); }
    b.addEventListener('click', () => { select(key, true); window.scrollTo({top: 0, behavior: 'instant'}); });
    b.addEventListener('keydown', e => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return; e.preventDefault();
      const j = e.key === 'Home' ? 0 : e.key === 'End' ? ROUTES.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : ROUTES.length - 1)) % ROUTES.length; bar.children[j].click(); bar.children[j].focus(); });
    bar.append(b);
  });
  bar.setAttribute('role', 'tablist');
  window.showMajorTab = k => select(k, true);
  window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (/^mt\d+$/.test(h)) select(h); else goTo(h); });
  // Vào trang: ?section= (link cũ) > #mtN > ?sub=
  const u = new URL(location.href), secQ = SECTION[u.searchParams.get('section')];
  const h = location.hash.slice(1);
  if (secQ) { select(secQ[0]); open(secQ[0], secQ[1], true); return; }
  if (h && !/^mt\d+$/.test(h) && document.getElementById(h)) { select('mt1'); goTo(h); return; }
  // pol đọc trước: select() mở sub-tab đang hiện và ghi lại URL (xóa pol) trước khi mở sub-tab muốn.
  const want = u.searchParams.get('sub'), pol = u.searchParams.get('pol'), key = select(h || 'mt1');
  if (TABS[key] && !ALIAS[h]) open(key, key === 'mt2' && want === 'policy' && INNER.has(pol) ? pol : want, !!want);
}
function goTo(id) {
  const t = id && document.getElementById(id); if (!t) return false;
  const pane = t.closest('.majorpane'); if (!pane) return false;
  const key = pane.dataset.tab, sub = t.closest('.sf-pane'), ip = t.closest('.sf-ipane');
  $$('.majorpane').forEach(p => { const on = p === pane; p.hidden = !on; p.classList.toggle('active', on); });
  $$('nav.majortabs .majortabbtn').forEach(b => { const on = b.dataset.tab === key; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
  if (ip) open(key, ip.dataset.pol, true);
  else if (sub) open(key, sub.dataset.sub, true);
  else { const u = new URL(location.href); u.searchParams.delete('sub'); u.hash = key; history.replaceState(null, '', u.pathname + u.search + u.hash); }
  // Thẻ trong chủ đề đang thu gọn thì mở ra.
  for (let d = t.closest('details'); d; d = d.parentElement?.closest('details')) d.open = true;
  setTimeout(() => t.scrollIntoView({behavior: 'instant', block: 'start'}), 80);
  return true;
}

function run() {
  if (document.body.dataset.sfFrame) return; document.body.dataset.sfFrame = '1';
  // ts-60 được research-layout giữ lại vì đã nằm ở Tổng quan; thẻ của tab cũ Chính sách (mt4) và Thuế (mt10) dời vào
  // Bức tranh ngành › Chính sách.
  lineFilter();
  const rest = [];
  ['mt1', 'mt2', 'mt14'].map(buildTab).forEach(b => rest.push(...commit(b)));
  // Tab cũ Chính sách (mt4) và Thuế (mt10): thẻ đã dời; khối còn dữ liệu chưa dời gom vào of-rest, pane để trống (không còn trên thanh tab).
  ['mt4', 'mt10'].forEach(k => { const p = $(`.majorpane[data-tab="${k}"]`); if (!p) return; [...p.children].forEach(n => { if (n.querySelector?.('[data-block-id]') || n.matches?.('[data-block-id]')) rest.push(n); }); p.replaceChildren(); });
  parkRest(rest);
  sparks.forEach(f => f());
  groupMargin(); outlookFill(); briefScope();
  // Link "#<id>" trỏ vào thẻ/câu hỏi đã dời: mở đúng tab lớn + sub-tab rồi cuộn tới.
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const id = a.getAttribute('href').slice(1); if (!id || /^mt\d+$/.test(id)) return;
    const t = document.getElementById(id); if (!t || !t.closest('.majorpane') || a.closest('.pp-flow') && t.closest('.sf-pane') === a.closest('.sf-pane')) {
      if (t && a.closest('.pp-flow')) { e.preventDefault(); t.scrollIntoView({behavior: 'smooth', block: 'start'}); }
      return;
    }
    e.preventDefault(); goTo(id);
  });
  nav();
  // Thanh sub-tab dính ngay dưới thanh tab lớn (như Điện).
  const setTop = () => { const t = $('.majortabs'), cs = t && getComputedStyle(t), top = cs && cs.position === 'sticky' ? t.getBoundingClientRect().height + (parseFloat(cs.top) || 0) + 6 : 0; $$('.sf-section>.pp-nav,.sf-section>.ov-nav').forEach(n => { n.style.top = top + 'px'; }); };
  setTop(); addEventListener('resize', setTop);
  document.documentElement.dataset.sfReady = '1';
  window.dispatchEvent(new Event('sf:frame'));
}
if (window.SectorBoot) SectorBoot.add(1200, run);
else if (document.readyState === 'complete') run(); else window.addEventListener('load', run);
})();
