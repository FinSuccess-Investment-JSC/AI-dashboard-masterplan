/* Bất động sản · workspace Khu công nghiệp (tab #mt13), 6 sub-tab theo câu hỏi đầu tư.
   Dữ liệu: window.KCN_MARKET (scripts/build_kcn_workbook.py, workbook nghiên cứu KCN); quy tắc: window.KcnInsights.
   Chart vẽ bằng Chart.js của trang: số thiếu để trống (không nối), số ước tính tô gạch chéo, mốc đổi phạm vi khảo sát
   là vạch đứt; tooltip có kỳ, nguồn, loại số. Card cũ của KCN (FDI NSO, IIP, P/B, VDSC) được dời vào đây, không nhân bản.
   Deep-link: Bat-dong-san/?kcn=<overview|demand|supply|rent|landbank|data>#mt13 */
(() => {
  'use strict';
  const D = window.KCN_MARKET, K = window.KcnInsights;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  const fin = v => typeof v === 'number' && Number.isFinite(v);
  const nf = (v, d = 0) => fin(v) ? v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}) : '—';
  const pf = (v, d = 1, sign = true) => fin(v) ? (sign && v > 0 ? '+' : '') + nf(v * 100, d) + '%' : '—';
  const sg = x => (+x > 0 ? '+' : '') + (+x).toLocaleString('vi-VN'); // '+84' trong ghi chú nguồn → +84
  const ppf = v => fin(v) ? (v > 0 ? '+' : '') + nf(v * 100, 1) + ' điểm %' : '—';
  const QL = p => K.qlabel(p);
  const PL = p => String(p || '').replace(/^(\d{4})Q([1-4])$/, 'Q$2/$1').replace(/^(\d{4})FY$/, 'Năm $1').replace(/^(\d{4})M(\d+)$/, '$2T/$1').replace(/^(\d{4})H1$/, 'H1/$1').replace(/^(\d{4})AGM$/, 'ĐHCĐ $1');
  const REG = {North: 'Bắc', South: 'Nam', Vietnam: 'Cả nước'};
  const C = {navy: '#1D2678', blue: '#2938A8', teal: '#59C5C8', tealD: '#2E8F92', plum: '#861C52', amber: '#c98a00', grey: '#9aa3b5', light: '#D9DEF4', red: '#a1352b', green: '#1b6b3a'};
  const RC = {'C&W:North': C.blue, 'C&W:South': C.teal, 'CBRE:North': C.plum, 'CBRE:South': C.amber};
  const CLS = {ACTUAL: ['Thực tế', 'ok'], ACTUAL_PRIMARY: ['Thực tế', 'ok'], ACTUAL_SECONDARY: ['Thực tế · thứ cấp', 'ok2'], SECONDARY_ACTUAL: ['Thực tế · thứ cấp', 'ok2'], ESTIMATE: ['Ước tính', 'est'],
    DERIVED: ['Phái sinh', 'der'], PROXY: ['Proxy', 'der'], FORECAST: ['Dự phóng', 'fc'], FORECAST_DERIVED: ['Dự phóng phái sinh', 'fc'], PLAN: ['Kế hoạch', 'fc'], COMPANY_PLAN: ['Kế hoạch', 'fc'], LOWER_BOUND: ['Cận dưới', 'est'], REPORTED: ['Nguồn công bố', 'ok2']};
  const chip = (k, t) => `<span class="kc-chip kc-${(CLS[k] || [])[1] || 'nt'}">${esc(t || (CLS[k] || [])[0] || k)}</span>`;
  const srcA = (id, label) => { const s = D && D.sources[id]; return s && s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener" title="${esc(s.what || '')}">${esc(label || id)}</a>` : esc(label || id); };
  const srcName = id => { const s = D && D.sources[id]; return s ? `${id} · ${s.what || ''}`.slice(0, 110) : id; };
  const ISSUE = {
    GEOGRAPHY_REBASE: 'C&W đổi phạm vi khảo sát từ Q3/2025 (sáp nhập tỉnh): không so trực tiếp trước/sau mốc.',
    STOCK_REVISIONS: 'Nguồn cung miền Nam Q1–Q3/2026 giảm dù không có KCN mới: điều chỉnh số nền, không phải cung âm.',
    OCCUPANCY_QOQ_CONFLICT: 'C&W ghi lấp đầy miền Nam Q3/2026 +0,03 điểm % so quý trước, không khớp 76,3% → 75,8%: dùng số mức.',
    RENT_CURRENCY_CHANGE: 'Q3/2026 báo giá VND/m²/kỳ thuê, các kỳ trước USD: hai chuỗi tách riêng, không quy đổi.',
    PROVINCE_ABSORPTION_NOT_RECONCILED: 'Hấp thụ 7 tỉnh miền Bắc Q1/2025 cộng 175 ha ≠ số vùng 148 ha: chỉ tham khảo hướng.',
    FDI_UNIT_ANOMALY: 'Góp vốn mua cổ phần 2016 lỗi đơn vị ở nguồn: để trống.',
    MIXED_CBRE_CW: 'CBRE (KCN Tier-1) và C&W khác phạm vi: không cộng, không nối chuỗi.',
    SECONDARY_STOCK_VALUE: 'Nguồn cung miền Bắc Q2/2026 = 25.225 ha từ bản trích thứ cấp (thông cáo C&W ghi >25.200 ha).',
    PROVINCE_OCCUPANCY_REVISION: 'Lấp đầy tỉnh miền Nam có khác biệt giữa các bản tin: chỉ tính thay đổi từ số mức.',
    Q3_CBRE_RESIDUAL_ONLY: 'Hấp thụ CBRE Q3/2026 là phần dư từ số 9T làm tròn: ước tính, không phải số công bố.',
    ABSORPTION_GAPS: 'Nhiều quý C&W không công bố hấp thụ: để trống, không nội suy.',
    PLAN_NOT_ACTUAL: 'IDC 2026 100 ha là kế hoạch, không phải hợp đồng đã ký.',
    ASKING_VS_EXECUTION: 'Giá chào thuê sơ cấp khác giá giao dịch và giá ghi nhận doanh thu.',
    PROJECT_VS_REGIONAL_PIPELINE: 'Cung dự kiến toàn vùng đã gồm một số dự án trong danh sách: không cộng hai loại.',
    FULL_LANDBANK_VS_READY: 'Quỹ đất danh mục (VGC >6.000 ha) không phải đất thương phẩm còn trống.'
  };
  const ISSUE_TITLE = {GEOGRAPHY_REBASE: 'Đổi phạm vi khảo sát', STOCK_REVISIONS: 'Nguồn cung bị điều chỉnh số nền', OCCUPANCY_QOQ_CONFLICT: 'Lấp đầy quý không khớp', RENT_CURRENCY_CHANGE: 'Đổi đơn vị giá thuê',
    PROVINCE_ABSORPTION_NOT_RECONCILED: 'Hấp thụ tỉnh không khớp số vùng', FDI_UNIT_ANOMALY: 'Lỗi đơn vị FDI 2016', MIXED_CBRE_CW: 'Hai nguồn khác phạm vi', SECONDARY_STOCK_VALUE: 'Số nguồn cung thứ cấp',
    PROVINCE_OCCUPANCY_REVISION: 'Lấp đầy tỉnh bị điều chỉnh', Q3_CBRE_RESIDUAL_ONLY: 'CBRE Q3/2026 là số ước tính', ABSORPTION_GAPS: 'Thiếu số hấp thụ theo quý', PLAN_NOT_ACTUAL: 'Kế hoạch, chưa phải thực hiện',
    ASKING_VS_EXECUTION: 'Giá chào ≠ giá giao dịch', PROJECT_VS_REGIONAL_PIPELINE: 'Dự án nằm trong số dự phóng vùng', FULL_LANDBANK_VS_READY: 'Quỹ đất ≠ đất sẵn sàng'};
  const qaRow = k => (D && D.qa || []).find(q => q.issue === k) || {};
  const qaOpen = k => ISSUE[k] && qaRow(k).status !== 'resolved';
  // Nội dung cảnh báo theo số đang có: "thiếu quý" liệt kê đúng các quý còn trống; cảnh báo đã giảm nhẹ ghi cách xử lý.
  function issueText(k) {
    let t = ISSUE[k];
    if (k === 'ABSORPTION_GAPS' && D) {
      const miss = ['North', 'South'].map(r => [REG[r], D.market.filter(m => m.region === r && m.abs_ha == null).map(m => K.qlabel(m.period))]).filter(x => x[1].length);
      t = miss.length ? 'C&W chưa công bố hấp thụ: ' + miss.map(([r, q]) => `${r} ${q.join(', ')}`).join('; ') + '. Để trống, không nội suy.' : 'Đã đủ hấp thụ C&W theo quý trong kỳ dữ liệu.';
    }
    const q = qaRow(k);
    if (q.status === 'mitigated' && q.resolution) t += ' Đã giảm nhẹ: ' + q.resolution;
    return t;
  }
  const STAGE = {NEW_LAUNCH: 'Mới đưa ra thị trường', NEW_PROJECT: 'Dự án mới (chưa rõ trạng thái)', COMBINED_PROJECTS: 'Gộp 2 dự án', COMPANY_PIPELINE: 'Pipeline doanh nghiệp', REGIONAL_FORECAST: 'Dự phóng toàn vùng'};
  const STAGE_C = {NEW_LAUNCH: C.blue, NEW_PROJECT: C.grey, COMBINED_PROJECTS: C.plum, COMPANY_PIPELINE: C.teal};
  const TKC = {KBC: C.navy, IDC: C.blue, BCM: C.plum, SZC: C.teal, VGC: C.amber, LHG: '#6171C5', NTC: C.tealD, D2D: '#8997D6', SIP: C.grey};
  const PROV_NORM = s => { s = String(s || ''); if (/Hồ Chí Minh|HCM/.test(s)) return 'TP.HCM'; if (/Bắc Giang/.test(s)) return 'Bắc Ninh'; return s.replace(/\s*\(.*$/, '').trim(); };
  const TABS = [
    ['overview', 'Tổng quan KCN', 'Ngành đang ở đâu trong chu kỳ: cầu, cung, lấp đầy, giá thuê trong 30 giây.'],
    ['demand', 'Nhu cầu thuê & FDI', 'Cầu thuê đất thực tế đang tăng nhanh đến mức nào, và FDI có xác nhận không?'],
    ['supply', 'Nguồn cung & lấp đầy', 'Nguồn cung có tăng nhanh hơn nhu cầu không?'],
    ['rent', 'Giá thuê & địa phương', 'Khu vực nào có sức mạnh tăng giá, khu vực nào có nguy cơ dư cung?'],
    ['landbank', 'Quỹ đất & doanh nghiệp', 'Doanh nghiệp nào có quỹ đất phù hợp, ai đang chuyển cầu ngành thành hợp đồng mới?'],
    ['data', 'Dữ liệu & phương pháp', 'Số nào là thực tế, số nào ước tính; nguồn, định nghĩa và quy tắc kiểm soát.']
  ];
  const APPLY = {overview: ['r', 'src', 'from', 'to'], demand: ['r', 'src', 'from', 'to'], supply: ['r', 'from', 'to', 'seg', 'prov'], rent: ['r', 'from', 'to', 'seg', 'prov'], landbank: ['co', 'prov'], data: ['r', 'src', 'from', 'to', 'prov', 'co']};
  const MOVE = {demand: ['bds-09', 'bds-10', 'bds-11', 'bds-47'], supply: ['bds-46'], rent: ['bds-45'], landbank: ['bds-41', 'bds-44']};
  const MOVE_TITLE = {demand: 'Chỉ báo cập nhật hằng tháng: FDI chế biến chế tạo, vốn thực hiện, IIP (Cục ĐTNN, NSO) · FDI theo quốc gia (VDSC)', supply: 'Nguồn cung từ đất cao su chuyển sang KCN (VDSC 01/2026)',
    rent: 'Giá chào thuê các KCN mở bán 2026 (VDSC 01/2026, nguồn khác C&W)', landbank: 'Định giá nhóm KCN theo phiên · dự phóng ký mới của VDSC (không phải số thực hiện)'};

  /* ---------- Xem trước ở Tổng quan và Bức tranh ngành (chạy cả khi chưa mở workspace) ---------- */
  function previewHtml() {
    const n = K.latest(D, 'North', 'occ'), s = K.latest(D, 'South', 'occ');
    const nb = n && K.change(D, 'North', 'occ', K.kOf(K.qk(n.period) - 4), n.period), sb = s && K.change(D, 'South', 'occ', K.kOf(K.qk(s.period) - 4), s.period);
    const c9 = D.absorption.find(a => a.period === '2026M9' && a.region === 'Vietnam');
    const yoy9 = c9 && /([+-]?\d+)%\s*YoY/.exec(c9.note || '');
    const pipe = K.pipelineRatios(D);
    const tile = (l, v, sub) => `<div class="kc-pv-t"><span>${l}</span><b>${v}</b><em>${sub}</em></div>`;
    return `<div class="kc-pv-h"><b>Khu công nghiệp</b><span>Workbook nghiên cứu KCN · dữ liệu đến ${esc(D.as_of ? D.as_of.split('-').reverse().join('/') : '')}</span></div><div class="kc-pv-g">` +
      (c9 ? tile('Hấp thụ đất 9T/2026 · CBRE Tier-1', `${nf(c9.value)} ha`, `${yoy9 ? sg(yoy9[1]) + '% so cùng kỳ (nguồn công bố)' : ''}`) : '') +
      (n ? tile(`Lấp đầy miền Bắc ${QL(n.period)}`, pf(n.occ, 1, false), nb && nb.ok ? `${ppf(nb.abs)} so cùng kỳ · C&W` : 'C&W') : '') +
      (s ? tile(`Lấp đầy miền Nam ${QL(s.period)}`, pf(s.occ, 1, false), sb && sb.ok ? `${ppf(sb.abs)} so cùng kỳ · C&W` : 'C&W') : '') +
      (pipe.length ? tile('Cung dự kiến 2026–2028', pipe.map(p => `${REG[p.region]} ${nf(p.pipeline)}`).join(' · ') + ' ha', 'dự phóng C&W, chưa phải đất sẵn sàng') : '') +
      `</div><a class="kc-pv-go" href="?kcn=overview#mt13" data-kcn-go="overview">Mở phân tích Khu công nghiệp →</a>`;
  }
  // Câu KCN ở "Vị trí trong chu kỳ" và chủ đề nóng "Quỹ đất KCN": cùng số với workspace, không giữ số tay.
  function regionLine(r) {
    const l = K.latest(D, r, 'occ'); if (!l) return '';
    const base = K.kOf(K.qk(l.period) - 4), oc = K.change(D, r, 'occ', base, l.period), sk = K.change(D, r, 'stock_ha', base, l.period);
    return `lấp đầy miền ${REG[r]} ${QL(l.period)} <b>${pf(l.occ, 1, false)}</b>${oc.ok ? ` (${ppf(oc.abs)} so cùng kỳ)` : ''}${sk.ok ? `, nguồn cung ${pf(sk.rel)}` : ''}`;
  }
  function fillNarrative() {
    const R = K.rules(D), has = id => R.fired.some(f => f.id === id);
    const c9 = D.absorption.find(a => a.period === '2026M9' && a.region === 'Vietnam'), y9 = c9 && /([+-]?\d+)%\s*YoY/.exec(c9.note || '');
    const fn = D.fdi_snap.find(f => f.sector === 'FDI_MFG' && f.ctype === 'registered_new'), yf = fn && /([+-]?\d+)%\s*YoY/.exec(fn.note || '');
    const head = [has('R1') ? 'cầu thuê phục hồi' : 'cầu thuê chưa rõ xu hướng', has('R2') ? 'cung mới vào nhanh hơn' : ''].filter(Boolean).join(', ');
    $$('[data-kcn-cycle]').forEach(n => { n.innerHTML = `<mark class="key-phrase">Khu công nghiệp: ${esc(head)}.</mark> ` +
      [c9 ? `Hấp thụ đất ${PL(c9.period)} (CBRE Tier-1) khoảng <b>${nf(c9.value)} ha</b>${y9 ? ` (${sg(y9[1])}%)` : ''}` : '', fn ? `FDI chế biến chế tạo cấp mới ${PL(fn.period)} <b>${nf(fn.value, 1)} tỷ USD</b>${yf ? ` (${sg(yf[1])}%)` : ''}` : '',
        regionLine('North'), regionLine('South')].filter(Boolean).join('; ') + `. <a href="?kcn=overview#mt13" data-kcn-go="overview">Chi tiết ở tab Khu công nghiệp</a>.`; });
    const pipe = K.pipelineRatios(D);
    $$('[data-kcn-topic="north"]').forEach(n => { const p = pipe.find(x => x.region === 'North'); n.innerHTML = `Miền Bắc: ${regionLine('North')}${p ? `; cung dự kiến 2026–2028 thêm <b>${nf(p.pipeline)} ha</b> (${pf(p.ratio, 0, false)} nguồn cung hiện hữu, dự phóng C&W)` : ''}.`; });
    $$('[data-kcn-topic="south"]').forEach(n => { const pts = K.provincePoints(D).filter(x => x.region === 'South'); n.innerHTML = `Miền Nam ${pts[0] ? QL(pts[0].period) : ''}: ${pts.map(x => `${esc(x.province_vi)} lấp đầy <b>${pf(x.occ, 1, false)}</b>, giá chào thuê ${pf(x.rent_yoy)} so cùng kỳ`).join('; ')} (C&W, địa giới sau sáp nhập).`; });
  }
  function fillPreviews() { $$('[data-kcn-preview]').forEach(n => { n.classList.add('kc-pv'); n.innerHTML = previewHtml(); }); fillNarrative(); }

  /* ---------- Trạng thái và bộ lọc ---------- */
  const QUARTERS = D ? [...new Set(D.market.map(m => m.period).concat(D.cbre.map(c => c.period)))].sort((a, b) => K.qk(a) - K.qk(b)) : [];
  const PROVS = D ? [...new Set(D.province.map(p => p.province_vi).concat(D.pipeline.filter(p => p.province !== 'Regional').map(p => p.province_vi), D.landbank.map(l => PROV_NORM(l.province))))].sort((a, b) => a.localeCompare(b, 'vi')) : [];
  const COS = D ? [...new Set(D.company.map(c => c.ticker).concat(D.coverage.map(c => c.ticker)))] : [];
  const st = {tab: 'overview', r: 'both', src: 'all', from: QUARTERS[0], to: QUARTERS[QUARTERS.length - 1], seg: 'land', prov: 'all', co: 'all', unit: 'usd', side: 'North', mOcc: K && K.TH.m_occ, mRent: K && K.TH.m_rent, ex: {set: 'facts', q: '', src: 'all', reg: 'all', cls: 'all'}};
  const pEnd = p => { const s = String(p || ''); let m; if ((m = /^(\d{4})Q([1-4])$/.exec(s))) return K.qk(s); if ((m = /^(\d{4})(FY|AGM)$/.exec(s))) return K.qk(m[1] + 'Q4'); if ((m = /^(\d{4})H1$/.exec(s))) return K.qk(m[1] + 'Q2'); if ((m = /^(\d{4})M(\d+)$/.exec(s))) return K.qk(m[1] + 'Q' + Math.ceil(+m[2] / 3)); if ((m = /^(\d{4})$/.exec(s))) return K.qk(m[1] + 'Q4'); return null; };
  // Quý: nằm trong khoảng. Kỳ lũy kế (năm, H1, 9T, 10T): giao với khoảng (kỳ bắt đầu từ Q1 cùng năm).
  const inRange = p => { const k = pEnd(p); if (k == null) return true; const q = /^\d{4}Q[1-4]$/.test(String(p)), a = q ? k : Math.floor(k / 4) * 4; return a <= K.qk(st.to) && k >= K.qk(st.from); };
  const regOn = r => st.r === 'both' || st.r === r || r === 'Vietnam';
  const srcOn = rep => st.src === 'all' || (st.src === 'cw' && rep === 'C&W') || (st.src === 'cbre' && rep === 'CBRE');
  const labelsInRange = () => QUARTERS.filter(q => inRange(q));
  function readUrl() {
    const u = new URLSearchParams(location.search);
    if (TABS.some(t => t[0] === u.get('kcn'))) st.tab = u.get('kcn');
    [['r', ['both', 'North', 'South']], ['src', ['all', 'cw', 'cbre']], ['seg', ['land', 'RBF', 'RBW']]].forEach(([k, ok]) => { if (ok.includes(u.get(k))) st[k] = u.get(k); });
    if (QUARTERS.includes(u.get('from'))) st.from = u.get('from');
    if (QUARTERS.includes(u.get('to'))) st.to = u.get('to');
    if (PROVS.includes(u.get('prov'))) st.prov = u.get('prov');
    if (COS.includes(u.get('co'))) st.co = u.get('co');
  }
  function writeUrl() {
    const u = new URLSearchParams(location.search);
    u.set('kcn', st.tab);
    [['r', 'both'], ['src', 'all'], ['seg', 'land'], ['prov', 'all'], ['co', 'all'], ['from', QUARTERS[0]], ['to', QUARTERS[QUARTERS.length - 1]]].forEach(([k, def]) => { if (st[k] && st[k] !== def) u.set(k, st[k]); else u.delete(k); });
    history.replaceState(null, '', '?' + u.toString() + '#mt13');
  }

  /* ---------- Chart.js ---------- */
  const hatchCache = {};
  function hatch(color) {
    if (hatchCache[color]) return hatchCache[color];
    const c = document.createElement('canvas'); c.width = c.height = 8; const x = c.getContext('2d');
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, 8, 8); x.strokeStyle = color; x.lineWidth = 2;
    x.beginPath(); x.moveTo(0, 8); x.lineTo(8, 0); x.moveTo(-2, 2); x.lineTo(2, -2); x.moveTo(6, 10); x.lineTo(10, 6); x.stroke();
    return (hatchCache[color] = x.createPattern(c, 'repeat'));
  }
  const markers = {id: 'kcMarkers', afterDatasetsDraw(ch) {
    const items = (ch.options.plugins.kcMarkers || {}).items || []; if (!items.length) return;
    const x = ch.scales.x, a = ch.chartArea, ctx = ch.ctx;
    items.forEach(m => {
      const i = ch.data.labels.indexOf(m.label); if (i <= 0) return;
      const px = (x.getPixelForValue(i) + x.getPixelForValue(i - 1)) / 2;
      ctx.save(); ctx.strokeStyle = '#7a8399'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px, a.top); ctx.lineTo(px, a.bottom); ctx.stroke();
      ctx.setLineDash([]); ctx.fillStyle = '#5a6682'; ctx.font = '600 10.5px Inter,Arial,sans-serif'; ctx.textAlign = 'left'; ctx.fillText(m.text, px + 4, a.top + 10); ctx.restore();
    });
  }};
  const missing = {id: 'kcMissing', afterDatasetsDraw(ch) {
    const on = (ch.options.plugins.kcMissing || {}).show; if (!on) return;
    const ctx = ch.ctx, y = ch.scales.y; if (!y) return;
    const base = y.getPixelForValue(Math.max(0, y.min));
    ch.data.labels.forEach((_, i) => {
      const anyBar = ch.data.datasets.some(d => d.type !== 'line' && d.kcMissing);
      if (!anyBar) return;
      const hole = ch.data.datasets.filter((d, k) => d.kcMissing && ch.isDatasetVisible(k) && d.data[i] == null);
      hole.forEach(d => {
        const k = ch.data.datasets.indexOf(d), meta = ch.getDatasetMeta(k), p = meta.data[i]; if (!p) return;
        ctx.save(); ctx.strokeStyle = '#9aa3b5'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(p.x, base - 5, 3, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      });
    });
  }};
  const valueLabels = {id: 'kcLabels', afterDatasetsDraw(ch) {
    const o = ch.data.kcLabels; if (!o || !o.show) return; // trong data: Chart.js không biến fmt thành tùy chọn scriptable
    const ctx = ch.ctx; ctx.save(); ctx.font = '600 11px Inter,Arial,sans-serif'; ctx.fillStyle = '#303540';
    ch.data.datasets.forEach((d, k) => { if (!ch.isDatasetVisible(k) || (o.only && !o.only.includes(k))) return; ch.getDatasetMeta(k).data.forEach((p, i) => { const v = d.data[i]; const val = typeof v === 'object' && v ? v.y : v; if (!fin(val)) return; const t = o.fmt ? o.fmt(val, i, d) : nf(val); if (ch.options.indexAxis === 'y') { ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(t, p.x + 4, p.y); } else { ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(t, p.x, p.y - 4); } }); });
    ctx.restore();
  }};
  const quadLines = {id: 'kcQuad', beforeDatasetsDraw(ch) {
    const q = ch.options.plugins.kcQuad; if (!q) return;
    const {x, y} = ch.scales, a = ch.chartArea, ctx = ch.ctx, px = x.getPixelForValue(q.x), py = y.getPixelForValue(q.y);
    ctx.save(); ctx.fillStyle = 'rgba(41,56,168,.05)'; ctx.fillRect(px, a.top, a.right - px, py - a.top); ctx.fillStyle = 'rgba(161,53,43,.05)'; ctx.fillRect(a.left, py, px - a.left, a.bottom - py);
    ctx.strokeStyle = '#7a8399'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(px, a.top); ctx.lineTo(px, a.bottom); ctx.moveTo(a.left, py); ctx.lineTo(a.right, py); ctx.stroke();
    ctx.setLineDash([]); ctx.font = '600 10.5px Inter,Arial,sans-serif'; ctx.fillStyle = '#5a6682';
    ctx.textAlign = 'right'; ctx.fillText('Lấp đầy cao · giá tăng', a.right - 4, a.top + 12); ctx.textAlign = 'left'; ctx.fillText('Lấp đầy thấp · giá yếu', a.left + 4, a.bottom - 6);
    ctx.restore();
  }, afterDatasetsDraw(ch) {
    const q = ch.options.plugins.kcQuad; if (!q) return;
    const ctx = ch.ctx; ctx.save(); ctx.font = '700 11.5px Inter,Arial,sans-serif'; ctx.fillStyle = '#1D2678'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ch.data.datasets.forEach((d, k) => ch.getDatasetMeta(k).data.forEach((p, i) => { const r = d.data[i]; if (r && r.name) ctx.fillText(r.name, p.x + 8, p.y); }));
    ctx.restore();
  }};
  const PLUGINS = [markers, missing, valueLabels, quadLines];

  function tooltipLines(c, unit, fmt) {
    const d = c.dataset, m = (d.kcMeta || [])[c.dataIndex] || {};
    const raw = typeof c.raw === 'object' && c.raw ? c.raw.y : c.raw;
    const out = [`${d.label}: ${fmt ? fmt(raw) : nf(raw, 1)}${unit ? ' ' + unit : ''}`];
    return out;
  }
  function afterLines(c) {
    const m = (c.dataset.kcMeta || [])[c.dataIndex]; if (!m) return [];
    const out = [];
    if (m.period) out.push('Kỳ: ' + PL(m.period));
    if (m.cls) out.push('Loại số: ' + ((CLS[m.cls] || [])[0] || m.cls));
    if (m.src) out.push('Nguồn: ' + srcName(m.src));
    if (m.web) out.push('Bổ sung từ nguồn web (có trích dẫn ở tab Dữ liệu)');
    if (m.replaced != null) out.push(`Thay số ước tính cũ: ${nf(m.replaced)}`);
    if (m.extra) [].concat(m.extra).forEach(t => out.push(t));
    return out;
  }
  function combo(o) {
    const datasets = o.sets.map(s => {
      const base = {label: s.label, data: s.data, yAxisID: s.axis || 'y', kcMeta: s.meta, kcMissing: !!s.missing, hidden: !!s.hidden};
      if (s.type === 'line') {
        const est = s.est || [];
        return {...base, type: 'line', order: 0, borderColor: s.color, backgroundColor: s.color, borderWidth: 2.2, tension: 0, spanGaps: false, borderDash: s.dash || [],
          pointRadius: s.data.map((v, i) => (v == null ? 0 : est[i] ? 4 : 3)), pointHoverRadius: 5, pointBackgroundColor: s.data.map((_, i) => (est[i] ? '#fff' : s.color)), pointBorderColor: s.color,
          segment: {borderDash: ctx => (est[ctx.p1DataIndex] || est[ctx.p0DataIndex] ? [5, 4] : s.dash || undefined)}};
      }
      const est = s.est || [];
      return {...base, type: 'bar', order: 1, stack: s.stack, backgroundColor: s.data.map((_, i) => (est[i] ? hatch(s.color) : s.color)), borderColor: s.color,
        borderWidth: s.data.map((_, i) => (est[i] ? 1.5 : 0)), borderRadius: 3, maxBarThickness: o.horizontal ? 22 : 38};
    });
    const axis = (a, pos) => ({position: pos, beginAtZero: a.zero !== false, min: a.min, max: a.max, stacked: !!o.stacked && pos === 'left', grid: {color: pos === 'left' ? '#EEF0F6' : 'transparent'}, border: {display: false},
      title: {display: !!a.title, text: a.title, color: '#5a6682', font: {size: 11.5, weight: '600'}}, ticks: {color: '#475069', font: {size: 12}, callback: v => (a.tick ? a.tick(v) : nf(v, a.digits || 0))}});
    const cat = {stacked: !!o.stacked, grid: {display: false}, border: {color: '#D6DDE8'}, ticks: {color: '#475069', font: {size: 12}, autoSkip: !o.allTicks, maxRotation: o.horizontal ? 0 : 40}};
    const scales = o.horizontal ? {y: cat, x: axis(o.y, 'left')} : {x: cat, y: axis(o.y, 'left')};
    if (o.y2) scales.y2 = {...axis(o.y2, 'right'), stacked: false};
    if (o.horizontal) { scales.x.position = 'bottom'; }
    return {type: 'bar', data: {labels: o.labels, datasets, kcLabels: o.labelsCfg || {show: false}}, plugins: PLUGINS,
      options: {responsive: true, maintainAspectRatio: false, animation: false, indexAxis: o.horizontal ? 'y' : 'x', interaction: {mode: o.horizontal ? 'nearest' : 'index', intersect: !!o.horizontal},
        layout: {padding: {right: o.horizontal ? 40 : 6, top: 14}}, scales,
        plugins: {legend: {display: false}, kcMarkers: {items: o.markers || []}, kcMissing: {show: !!o.missing},
          tooltip: {backgroundColor: '#1D2678', padding: 10, cornerRadius: 8, filter: c => (typeof c.raw === 'object' && c.raw ? fin(c.raw.y) : fin(c.raw)),
            callbacks: {title: x => (x[0] ? (o.tipTitle ? o.tipTitle(x[0].dataIndex) : x[0].label) : ''), label: c => tooltipLines(c, c.dataset.yAxisID === 'y2' ? (o.y2 && o.y2.unit) : (o.y.unit), c.dataset.yAxisID === 'y2' ? (o.y2 && o.y2.fmt) : o.y.fmt), afterLabel: afterLines}}}}};
  }
  // Vẽ khi khung đã có chiều rộng; khung ẩn thì để chờ, khi hiện ra mới dựng (Chart.js không đo được node ẩn).
  function draw(host, cfg) {
    if (!host || !window.Chart) { if (host) host.innerHTML = '<p class="kc-gap">Không tải được thư viện chart.</p>'; return; }
    $$('canvas', host).forEach(c => Chart.getChart(c) && Chart.getChart(c).destroy());
    host.innerHTML = '<canvas role="img"></canvas>';
    host._kcCfg = cfg;
    if (host.clientWidth > 10) host._kcChart = new Chart(host.firstChild, cfg);
  }
  const refit = root => setTimeout(() => {
    $$('.kc-plot', root).forEach(h => { if (h._kcCfg && h.clientWidth > 10) { const c = h.querySelector('canvas'), ch = c && Chart.getChart(c); if (!ch) h._kcChart = new Chart(c, h._kcCfg); else if (Math.abs(ch.width - h.clientWidth) > 6) ch.resize(); } });
    $$('canvas', root).forEach(c => { if (c.closest('.kc-plot')) return; const old = c.offsetParent && c.clientWidth < 10 && window.Chart && Chart.getChart(c); if (!old) return; const cfg = old.config, keep = {$ctFmt: old.$ctFmt, $ctId: old.$ctId}; old.destroy(); Object.assign(new Chart(c, {type: cfg.type, data: cfg.data, options: cfg.options, plugins: cfg.plugins}), keep); });
  }, 40);

  /* ---------- Khung card ---------- */
  let popo;
  function pop(btn, html) {
    if (!popo) { popo = el('div', 'kc-pop'); popo.setAttribute('role', 'dialog'); document.body.append(popo); document.addEventListener('click', e => { if (popo && !popo.hidden && !popo.contains(e.target) && !e.target.closest('[data-kc-pop]')) popo.hidden = true; }); document.addEventListener('keydown', e => { if (e.key === 'Escape' && popo) popo.hidden = true; }); }
    if (!popo.hidden && popo._for === btn) { popo.hidden = true; return; }
    popo.innerHTML = html; popo.hidden = false; popo._for = btn;
    const r = btn.getBoundingClientRect(), w = Math.min(360, innerWidth - 24);
    popo.style.width = w + 'px'; popo.style.left = Math.max(12, Math.min(r.right - w, innerWidth - w - 12)) + scrollX + 'px'; popo.style.top = r.bottom + 6 + scrollY + 'px';
  }
  function csvOf(t) { const q = v => { const s = String(v ?? ''); return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }; return '﻿' + [t.head].concat(t.rows).map(r => r.map(q).join(',')).join('\n'); }
  function download(name, text) { const b = new Blob([text], {type: 'text/csv;charset=utf-8'}), a = el('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
  const tableHtml = t => `<div class="tablewrap kc-tw" data-no-fold><table class="kc-t" data-no-fold><thead><tr>${t.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${t.rows.map(r => `<tr>${r.map(c => `<td>${c == null ? '<span class="kc-na">—</span>' : esc(c)}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${t.head.length}">Không có dòng nào trong bộ lọc hiện tại.</td></tr>`}</tbody></table></div>`;
  // Một card chart: tiêu đề · đơn vị/kỳ · công cụ (cảnh báo dữ liệu, nguồn, bảng, CSV) · chart · một dòng nhận định.
  function card(o) {
    const c = el('div', 'card kc-card' + (o.wide ? ' kc-wide' : ''));
    Object.assign(c.dataset, {blockId: o.id, updateKind: o.kind || 'document', cadence: o.cadence || 'quarterly', refreshStatus: 'snapshot'});
    const qa = (o.qa || []).filter(qaOpen);
    c.innerHTML = `<div class="kc-ch"><div class="kc-tt"><div class="chart-title">${esc(o.title)}</div>${o.sub ? `<div class="chart-sub">${o.sub}</div>` : ''}</div><div class="kc-tools">` +
      (qa.length ? `<button type="button" class="kc-tool kc-warn" data-kc-pop="qa" aria-label="Cảnh báo dữ liệu (${qa.length})">⚠ ${qa.length}</button>` : '') +
      (o.srcs && o.srcs.length ? '<button type="button" class="kc-tool" data-kc-pop="src" aria-label="Nguồn">ⓘ Nguồn</button>' : '') +
      (o.table ? '<button type="button" class="kc-tool" data-kc-tbl aria-pressed="false">Bảng</button><button type="button" class="kc-tool" data-kc-csv>CSV</button>' : '') + `</div></div>` +
      (o.controls ? `<div class="kc-ctl" role="group">${o.controls}</div>` : '') +
      (o.body ? `<div class="kc-body">${o.body}</div>` : `<div class="kc-plot" style="height:${o.height || 280}px"></div>`) + (o.legend ? `<div class="kc-legend">${o.legend}</div>` : '') +
      (o.take ? `<div class="kc-take">${o.take}</div>` : '') + '<div class="kc-tblbox" hidden></div>';
    const qb = c.querySelector('[data-kc-pop="qa"]'); if (qb) qb.onclick = () => pop(qb, `<h4>Cảnh báo dữ liệu</h4><ul>${qa.map(k => `<li><b>${esc(ISSUE_TITLE[k] || k)}</b>: ${esc(issueText(k))}</li>`).join('')}</ul><button type="button" class="kc-link" data-kcn-go="data" data-kc-qa="${esc(qa.join(','))}">Xem chi tiết ở Dữ liệu & phương pháp →</button>`);
    const sb = c.querySelector('[data-kc-pop="src"]'); if (sb) sb.onclick = () => pop(sb, `<h4>Nguồn</h4><ul>${[...new Set(o.srcs)].map(id => `<li>${srcA(id)} · ${esc((D.sources[id] || {}).what || '')}${(D.sources[id] || {}).checked ? ` <span class="kc-na">· kiểm ${esc(D.sources[id].checked.split('-').reverse().join('/'))}</span>` : ''}</li>`).join('')}</ul>${o.method ? `<p>${o.method}</p>` : ''}`);
    const tb = c.querySelector('[data-kc-tbl]'); if (tb) tb.onclick = () => { const box = c.querySelector('.kc-tblbox'), on = tb.getAttribute('aria-pressed') !== 'true'; tb.setAttribute('aria-pressed', String(on)); box.hidden = !on; if (on) box.innerHTML = tableHtml(o.table()); };
    const cb = c.querySelector('[data-kc-csv]'); if (cb) cb.onclick = () => download(`kcn-${o.id}.csv`, csvOf(o.table()));
    c._draw = o.draw; return c;
  }
  function paint(root) { $$('.kc-card', root).forEach(c => { if (c._draw && !c._drawn) { const h = c.querySelector('.kc-plot'); if (h) { c._drawn = true; try { c._draw(h, c); } catch (e) { h.innerHTML = '<p class="kc-gap">Không vẽ được chart này.</p>'; console.error(e); } } } }); }
  const kpi = o => `<div class="kc-kpi"><span class="kc-kl">${esc(o.label)}</span><b>${o.value}</b>${o.delta ? `<em class="${o.dcls || ''}">${o.delta}</em>` : ''}<small>${o.sub || ''}</small></div>`;
  const kpis = arr => `<div class="kc-kpis">${arr.filter(Boolean).map(kpi).join('')}</div>`;
  const section = (num, title, q) => el('div', 'kc-sec-h', `<span class="kc-num">${esc(num)}</span><div><h3>${esc(title)}</h3>${q ? `<p>${q}</p>` : ''}</div>`);
  function insightCard(f) {
    return `<article class="kc-ins kc-ins-${esc(f.id)}"><header><span class="kc-rule">${esc(f.id)}</span><span class="kc-scope">${esc(f.scope)}</span></header><h4>${esc(f.headline)}</h4>` +
      `<ul class="kc-ev">${f.evidence.map(e => `<li>${esc(e)}</li>`).join('')}</ul><dl><dt>Diễn giải</dt><dd>${esc(f.interp)}</dd><dt>Hàm ý đầu tư</dt><dd>${esc(f.implication)}</dd></dl>` +
      `<footer><span>Nguồn: ${f.sources.map(s => srcA(s)).join(', ') || '—'}${f.link ? ` · <a href="${esc(f.link)}" target="_blank" rel="noopener">BCTN ↗</a>` : ''}</span><span class="kc-na" title="Ngưỡng của quy tắc">${esc(f.threshold)}</span>${f.tab && f.tab !== st.tab ? `<button type="button" class="kc-link" data-kcn-go="${esc(f.tab)}">Xem chart →</button>` : ''}</footer></article>`;
  }

  /* ---------- Dữ liệu dùng chung ---------- */
  const SERIES = D ? K.absorptionSeries(D) : [];
  const metaQ = (row, cls, extra) => row ? {period: row.period, cls, src: row.src, extra} : null;
  const latestBy = (r, k) => K.latest(D, r, k);
  function regionsOn() { return ['North', 'South'].filter(regOn); }

  /* ===================== 1. Tổng quan ===================== */
  function absorptionCard(id, opt = {}) {
    const labels = labelsInRange();
    const ser = SERIES.filter(s => regOn(s.region) && srcOn(s.reporter));
    // C&W trước và sau mốc là hai phạm vi; gộp vào một cột theo vùng nhưng tooltip ghi phạm vi và có vạch mốc.
    const groups = {};
    ser.forEach(s => { const k = s.reporter + ':' + s.region; (groups[k] = groups[k] || []).push(s); });
    const sets = Object.entries(groups).map(([k, arr]) => {
      const pts = arr.flatMap(s => s.points.map(p => ({...p, coverage: s.coverage})));
      const at = q => pts.find(p => p.period === q);
      return {label: `${k.split(':')[0]} · ${REG[k.split(':')[1]]}`, type: 'bar', color: RC[k], missing: k.startsWith('C&W'), data: labels.map(q => (at(q) ? at(q).value : null)), est: labels.map(q => (at(q) ? at(q).cls === 'ESTIMATE' : false)),
        meta: labels.map(q => { const p = at(q); return p ? {period: q, cls: p.cls, src: p.src, web: p.web, replaced: p.replaced, extra: [p.coverage === 'C&W_PRE_2025Q3' ? 'Phạm vi: trước sáp nhập' : p.coverage === 'C&W_POST_2025_MERGER' ? 'Phạm vi: sau sáp nhập' : 'Phạm vi: KCN Tier-1 (CBRE)'].concat(p.lower ? [`CBRE gốc ghi ">${nf(p.lower)} ha"`] : [])} : null; })};
    });
    const rolls = ser.map(s => ({s, r: K.rolling4(s)}));
    rolls.filter(x => x.r.ok).forEach(x => sets.push({label: `Rolling 4Q · ${x.s.reporter} ${REG[x.s.region]}`, type: 'line', color: RC[x.s.reporter + ':' + x.s.region], data: labels.map(q => { const v = x.r.values.find(p => p.period === q); return v ? v.value : null; }), est: labels.map(q => !!(x.r.values.find(p => p.period === q) || {}).est)}));
    const noRoll = rolls.filter(x => !x.r.ok);
    const legend = sets.map(s => `<span><i style="background:${s.color}"></i>${esc(s.label)}</span>`).join('') + `<span><i class="kc-hatch"></i>Ước tính</span><span><i class="kc-hole"></i>Quý chưa công bố</span>`;
    const t = () => ({head: ['Kỳ', 'Nguồn', 'Vùng', 'Phạm vi', 'Hấp thụ (ha)', 'Loại số', 'Source_ID', 'Ghi chú'], rows: ser.flatMap(s => s.points.filter(p => inRange(p.period)).map(p => [QL(p.period), s.reporter, REG[s.region], s.coverage, p.value, (CLS[p.cls] || [])[0] || p.cls, p.src, p.note]))});
    return card({id, title: 'Diện tích hấp thụ thuần — theo quý', sub: `ha · ${QL(labels[0])}–${QL(labels[labels.length - 1])} · C&W và CBRE là hai chuỗi riêng, không cộng`, qa: ['MIXED_CBRE_CW', 'GEOGRAPHY_REBASE', 'Q3_CBRE_RESIDUAL_ONLY', 'ABSORPTION_GAPS'],
      srcs: ser.flatMap(s => s.points.map(p => p.src)), table: t, legend, wide: opt.wide, height: opt.height || 290,
      take: noRoll.length && !rolls.some(x => x.r.ok) ? `Rolling 4 quý chưa tính được: ${esc(noRoll[0].r.reason.replace(/^Cần/, 'cần'))}` : '',
      draw: h => draw(h, combo({labels: labels.map(QL), sets, y: {unit: 'ha', title: 'ha'}, markers: K.qk(st.from) < K.qk(D.rebase) && K.qk(st.to) >= K.qk(D.rebase) ? [{label: QL(D.rebase), text: 'Đổi phạm vi C&W'}] : [], missing: true}))});
  }
  function stockOccCard(id, region, opt = {}) {
    const rows = K.marketRows(D, region).filter(m => inRange(m.period));
    const L = rows.map(m => QL(m.period)), m = (m0, cls, extra) => metaQ(m0, cls, extra);
    const sets = [
      {label: 'Đã lấp đầy (proxy)', type: 'bar', stack: 's', color: region === 'North' ? C.blue : C.tealD, data: rows.map(r => r.occupied_proxy), meta: rows.map(r => m(r, 'PROXY', ['= nguồn cung × lấp đầy']))},
      {label: 'Đất trống (proxy)', type: 'bar', stack: 's', color: '#C9D3EE', data: rows.map(r => r.vacant_proxy), meta: rows.map(r => m(r, 'PROXY', ['= nguồn cung × (1 − lấp đầy)', `Nguồn cung: ${nf(r.stock_ha)} ha (${r.precision === 'APPROX' ? 'xấp xỉ' : r.precision === 'EXACT' ? 'chính xác' : 'thứ cấp'})`]))},
      {label: 'Lấp đầy · trước sáp nhập', type: 'line', axis: 'y2', color: C.plum, dash: [2, 3], data: rows.map(r => (r.cohort === 'PRE' ? r.occ * 100 : null)), meta: rows.map(r => m(r, 'ACTUAL'))},
      {label: 'Lấp đầy · sau sáp nhập', type: 'line', axis: 'y2', color: C.plum, data: rows.map(r => (r.cohort === 'POST' ? r.occ * 100 : null)), meta: rows.map(r => m(r, 'ACTUAL'))}
    ];
    const legend = sets.map(s => `<span><i style="background:${s.color}${s.dash ? ';opacity:.6' : ''}"></i>${esc(s.label)}</span>`).join('');
    const t = () => ({head: ['Kỳ', 'Vùng', 'Phạm vi', 'Nguồn cung (ha)', 'Lấp đầy', 'Đã lấp (proxy, ha)', 'Đất trống (proxy, ha)', 'Độ chính xác', 'Source_ID'], rows: rows.map(r => [QL(r.period), REG[region], r.cohort === 'PRE' ? 'Trước sáp nhập' : 'Sau sáp nhập', r.stock_ha, pf(r.occ, 1, false), Math.round(r.occupied_proxy), Math.round(r.vacant_proxy), r.precision, r.src])});
    return card({id, title: `Nguồn cung, đã lấp đầy và đất trống — miền ${REG[region]}`, sub: 'ha (cột) · lấp đầy % (đường, trục phải) · proxy = nguồn cung × lấp đầy, không phải hấp thụ', qa: ['GEOGRAPHY_REBASE'].concat(region === 'South' ? ['STOCK_REVISIONS', 'OCCUPANCY_QOQ_CONFLICT'] : ['SECONDARY_STOCK_VALUE']),
      srcs: rows.map(r => r.src), table: t, legend, controls: opt.controls, height: opt.height || 290,
      draw: h => draw(h, combo({labels: L, sets, stacked: true, y: {unit: 'ha', title: 'ha'}, y2: {unit: '%', fmt: v => nf(v, 1), zero: false, min: 50, max: 90, title: 'lấp đầy %'}, markers: L.includes(QL(D.rebase)) && L.indexOf(QL(D.rebase)) > 0 ? [{label: QL(D.rebase), text: 'Đổi phạm vi C&W'}] : []}))});
  }
  function regimeBlock() {
    const all = ['North', 'South'].filter(regOn).flatMap(r => K.regimes(D, r)).filter(g => inRange(g.to));
    const cls = {demand_exceeds: 'up', supply_faster: 'warn', weak_demand: 'dn', supply_slows: 'nt', abs_up_occ_flat: 'nt', abs_down_occ_flat: 'nt'};
    const rows = all.map(g => `<tr><td>${REG[g.region]}</td><td>${QL(g.from)} → ${QL(g.to)}</td><td>${g.cohort === 'PRE' ? 'Trước sáp nhập' : 'Sau sáp nhập'}</td><td>${nf(g.absFrom)} → ${nf(g.absTo)} ha</td><td>${pf(g.occFrom, 1, false)} → ${pf(g.occTo, 1, false)}</td><td><span class="kc-chip kc-${cls[g.key]}">${esc(K.REGIME_TEXT[g.key])}</span></td></tr>`).join('');
    return `<div class="tablewrap" data-no-fold><table class="kc-t" data-no-fold><thead><tr><th>Vùng</th><th>Hai quý</th><th>Phạm vi</th><th>Hấp thụ C&W</th><th>Lấp đầy C&W</th><th>Trạng thái</th></tr></thead><tbody>${rows || '<tr><td colspan="6">Không có cặp quý hợp lệ trong bộ lọc.</td></tr>'}</tbody></table></div>`;
  }
  function renderOverview(box) {
    const rs = regionsOn(), occ = r => latestBy(r, 'occ'), usd = r => latestBy(r, 'ask_usd'), vnd = r => latestBy(r, 'ask_vnd');
    const occCh = r => { const l = occ(r); return l && K.change(D, r, 'occ', K.kOf(K.qk(l.period) - 4), l.period); };
    const c9 = D.absorption.find(a => a.period === '2026M9' && a.region === 'Vietnam'), y9 = c9 && /([+-]?\d+)%\s*YoY/.exec(c9.note || '');
    const cb = SERIES.filter(s => s.reporter === 'CBRE' && regOn(s.region)), lastAct = cb.map(s => ({s, p: s.points.filter(p => p.cls !== 'ESTIMATE').pop()})).filter(x => x.p);
    const pipe = K.pipelineRatios(D).filter(p => regOn(p.region));
    box.append(el('div', '', kpis([
      c9 && {label: 'Hấp thụ đất 9T/2026 · CBRE Tier-1', value: `${nf(c9.value)} ha`, delta: y9 ? `${sg(y9[1])}% so cùng kỳ` : '', dcls: 'up', sub: `${chip('REPORTED', 'Nguồn công bố')} ${srcA(c9.src)} · xấp xỉ`},
      lastAct.length && {label: `Hấp thụ quý gần nhất · CBRE ${QL(lastAct[0].p.period)}`, value: lastAct.map(x => `${REG[x.s.region]} ${x.p.cls === 'LOWER_BOUND' ? '>' : ''}${nf(x.p.value)}`).join(' · ') + ' ha', sub: lastAct.map(x => `${REG[x.s.region]} ${chip(x.p.cls)}`).join(' ') + (lastAct.some(x => x.p.cls === 'DERIVED') ? ' Nam = 9T − H1' : '')},
      ...rs.map(r => { const l = occ(r), c = occCh(r); return l && {label: `Lấp đầy miền ${REG[r]} ${QL(l.period)}`, value: pf(l.occ, 1, false), delta: c && c.ok ? `${ppf(c.abs)} so ${QL(c.from.period)}` : '', dcls: c && c.ok ? (c.abs < 0 ? 'dn' : 'up') : '', sub: `C&W · cùng phạm vi ${srcA(l.src)}`}; }),
      {label: 'Giá chào thuê đất', value: rs.map(r => { const u = usd(r); return u ? `${REG[r]} ${nf(u.ask_usd, 1)}` : ''; }).join(' · ') + ' USD/m²/kỳ', sub: `${QL((usd(rs[0]) || {}).period)} · ${QL((vnd(rs[0]) || {}).period)} chuyển sang VND: ${rs.map(r => { const v = vnd(r); return v ? `${REG[r]} ${nf(v.ask_vnd / 1e6, 2)}` : ''; }).join(' · ')} triệu đ/m²/kỳ`},
      pipe.length && {label: 'Nguồn cung / cung dự kiến 2026–2028', value: pipe.map(p => `${REG[p.region]} ${nf(p.stock)}`).join(' · ') + ' ha', sub: `Dự kiến thêm ${pipe.map(p => `${REG[p.region]} ${nf(p.pipeline)}`).join(' · ')} ha ${chip('FORECAST')}`}
    ])));
    box.append(section('A', 'Chu kỳ KCN: hấp thụ, nguồn cung, lấp đầy', 'Bốn trạng thái chỉ được gán khi hai quý liền nhau cùng phạm vi khảo sát có đủ hấp thụ và lấp đầy.'));
    const g = el('div', 'kc-grid');
    g.append(absorptionCard('kcn-ov-abs'));
    const side = st.r === 'both' ? st.side : st.r;
    const ctl = st.r === 'both' ? ['North', 'South'].map(r => `<button type="button" data-kc-side="${r}" aria-pressed="${side === r}">${REG[r]}</button>`).join('') : '';
    g.append(stockOccCard('kcn-ov-stock', side, {controls: ctl}));
    box.append(g);
    const rg = card({id: 'kcn-ov-regime', title: 'Trạng thái chu kỳ theo cặp quý', sub: 'C&W · cùng phạm vi khảo sát · lấp đầy đổi dưới 0,3 điểm % xem là đi ngang', body: regimeBlock(), qa: ['ABSORPTION_GAPS', 'GEOGRAPHY_REBASE'], srcs: ['CW_N25Q1', 'CW_S25Q2', 'CW_S26Q1'], kind: 'derived'});
    box.append(rg);
    box.append(section('B', 'Hàm ý đầu tư', 'Quan sát → nguyên nhân khả dĩ → hàm ý. Chỉ hiện khi quy tắc có đủ dữ liệu cùng phạm vi.'));
    const R = K.rules(D, thNow());
    const order = ['R1', 'R2', 'R5', 'R6', 'R4', 'R3'], pick = [];
    order.forEach(id => { const f = R.fired.find(x => x.id === id && !pick.includes(x)); if (f && pick.length < 4) pick.push(f); });
    box.append(el('div', 'kc-insgrid', pick.map(insightCard).join('')));
  }

  /* ===================== 2. Nhu cầu & FDI ===================== */
  function renderDemand(box) {
    const fdiNew = D.fdi_snap.find(f => f.sector === 'FDI_MFG' && f.ctype === 'registered_new'), fdiAll = D.fdi_snap.find(f => f.sector === 'FDI_MFG' && f.ctype === 'registered_all' && f.period === '2026M9');
    const yy = f => { const m = f && /([+-]?\d+)% YoY/.exec(f.note || ''); return m ? `${sg(m[1])}% so cùng kỳ` : ''; };
    const last = D.fdi[D.fdi.length - 1], prev = D.fdi[D.fdi.length - 2];
    const cb = SERIES.filter(s => s.reporter === 'CBRE' && regOn(s.region));
    box.append(el('div', '', kpis([
      ...cb.map(s => { const p = s.points.filter(x => x.cls !== 'ESTIMATE').pop(); return p && {label: `Hấp thụ CBRE miền ${REG[s.region]} ${QL(p.period)}`, value: `${nf(p.value)} ha`, sub: `${chip(p.cls)} ${srcA(p.src)}`}; }),
      fdiNew && {label: `FDI CBCT cấp mới ${PL(fdiNew.period)}`, value: `${nf(fdiNew.value, 1)} tỷ USD`, delta: yy(fdiNew), dcls: 'up', sub: `vốn cấp mới · ${srcA(fdiNew.src)}`},
      fdiAll && {label: `FDI CBCT đăng ký (mọi loại) ${PL(fdiAll.period)}`, value: `${nf(fdiAll.value, 1)} tỷ USD`, delta: yy(fdiAll), dcls: 'up', sub: `cấp mới + điều chỉnh + góp vốn · ${srcA(fdiAll.src)}`},
      {label: `FDI CBCT cấp mới năm ${last.year}`, value: `${nf(last.new_usd, 2)} tỷ USD`, delta: `${pf(last.new_usd / prev.new_usd - 1)} so ${prev.year}`, dcls: last.new_usd < prev.new_usd ? 'dn' : 'up', sub: `${nf(last.new_n)} dự án · ${srcA(last.src)}`}
    ])));
    box.append(section('1', 'Hấp thụ đất thực tế', 'Chuỗi quý theo nguồn và phạm vi; số lũy kế 6 hay 9 tháng không dùng như một quý.'));
    const g1 = el('div', 'kc-grid'); g1.append(absorptionCard('kcn-de-abs', {height: 300}));
    // Lũy kế CBRE (cấp 1) 2026 đặt cạnh cùng kỳ 2025: số công bố trước, thiếu thì cộng các quý (phái sinh).
    const KS = ['Q1', 'H1', '9T'], YRS = [2025, 2026];
    const cum = ['North', 'South'].filter(regOn).flatMap(r => YRS.map(y => ({r, y, c: K.cbreCum(D, r, y)})));
    const cy = K.cumYoY(D).filter(x => regOn(x.region) && x.year === 2026);
    const tone = (r, y) => y === 2026 ? RC['CBRE:' + r] : (r === 'North' ? '#D9B3C7' : '#EBD39A');
    g1.append(card({id: 'kcn-de-cum', title: 'Hấp thụ lũy kế CBRE: 2026 so cùng kỳ 2025', sub: 'ha · Q1, H1, 9 tháng · cùng phạm vi thị trường cấp 1 · cột nhạt là 2025', qa: ['MIXED_CBRE_CW'], srcs: [...new Set(cum.flatMap(x => Object.values(x.c).map(v => v.src)))],
      legend: cum.map(x => `<span><i style="background:${tone(x.r, x.y)}"></i>${REG[x.r]} ${x.y}</span>`).join('') + '<span><i class="kc-hatch"></i>Số "gần/khoảng" của nguồn</span>',
      take: cy.length ? cy.filter(x => x.label !== 'Q1').map(x => `${REG[x.region]} ${x.label}: ${x.conflict ? `CBRE công bố ${pf(x.reported, 0)}, khác mức tự tính ${pf(x.yoy, 0)} (CBRE có thể đã sửa số 2025)` : pf(x.yoy, 0)}`).join(' · ') + ' so cùng kỳ. Số 2025 nhiều mốc là "gần/khoảng" theo CBRE.' : '',
      table: () => ({head: ['Vùng', 'Năm', 'Kỳ', 'Hấp thụ lũy kế (ha)', 'Cách có số', 'Source_ID'], rows: cum.flatMap(x => KS.map(k => [REG[x.r], x.y, k, x.c[k] ? x.c[k].value : null, x.c[k] ? (x.c[k].derived ? 'Cộng các quý' : x.c[k].approx ? 'Công bố, xấp xỉ' : 'Công bố') : 'Chưa có', x.c[k] ? x.c[k].src : null]))}),
      draw: h => draw(h, combo({labels: KS, sets: cum.map(x => ({label: `${REG[x.r]} ${x.y}`, type: 'bar', color: tone(x.r, x.y), data: KS.map(k => (x.c[k] ? x.c[k].value : null)), est: KS.map(k => !!(x.c[k] && x.c[k].approx)),
        meta: KS.map(k => x.c[k] && {period: `${x.y}${k === 'Q1' ? 'Q1' : k === 'H1' ? 'H1' : 'M9'}`, cls: x.c[k].derived ? 'DERIVED' : 'REPORTED', src: x.c[k].src, extra: [x.c[k].derived ? 'Cộng từ các quý CBRE' : x.c[k].approx ? 'CBRE ghi "gần/khoảng"' : ''].filter(Boolean)})})),
        y: {unit: 'ha', title: 'ha'}, labelsCfg: {show: true, fmt: v => nf(v)}}))}));
    // Tỷ trọng Bắc / Nam: chỉ khi hai vùng cùng nguồn, cùng phạm vi, cùng kỳ.
    const mix = [];
    SERIES.filter(s => s.region === 'North').forEach(n => { const s = SERIES.find(x => x.reporter === n.reporter && x.coverage === n.coverage && x.region === 'South'); if (!s) return; n.points.forEach(p => { const q = s.points.find(x => x.period === p.period); if (q && fin(p.value) && fin(q.value) && inRange(p.period) && srcOn(n.reporter)) mix.push({label: `${n.reporter} ${QL(p.period)}`, n: p.value, s: q.value, est: p.cls === 'ESTIMATE' || q.cls === 'ESTIMATE', src: [p.src, q.src]}); }); });
    const vn9 = D.absorption.find(a => a.period === '2026M9' && a.region === 'Vietnam'), n9 = D.absorption.find(a => a.period === '2026M9' && a.region === 'North');
    if (vn9 && n9 && srcOn('CBRE')) mix.push({label: 'CBRE 9T/2026', n: n9.value, s: vn9.value - n9.value, est: true, src: [n9.src], note: 'Nam = cả nước − Bắc (xấp xỉ)'});
    const shn = D.absorption.filter(a => /Shinhan/.test(a.reporter || '')); if (shn.length === 2 && st.src === 'all') mix.push({label: 'Shinhan 2025', n: shn.find(a => a.region === 'North').value, s: shn.find(a => a.region === 'South').value, est: false, src: [shn[0].src]});
    g1.append(card({id: 'kcn-de-mix', title: 'Cơ cấu hấp thụ Bắc / Nam', sub: '% tổng hai vùng · chỉ khi hai vùng cùng nguồn, cùng phạm vi, cùng kỳ', qa: ['MIXED_CBRE_CW', 'Q3_CBRE_RESIDUAL_ONLY'], srcs: mix.flatMap(m => m.src), wide: true, height: 260,
      legend: `<span><i style="background:${C.blue}"></i>Bắc</span><span><i style="background:${C.teal}"></i>Nam</span><span><i class="kc-hatch"></i>Có số ước tính</span>`,
      table: () => ({head: ['Nguồn · kỳ', 'Bắc (ha)', 'Nam (ha)', 'Bắc %', 'Ghi chú'], rows: mix.map(m => [m.label, m.n, Math.round(m.s), pf(m.n / (m.n + m.s), 0, false), m.note || (m.est ? 'Có ước tính' : '')])}),
      draw: h => draw(h, combo({labels: mix.map(m => m.label), stacked: true, sets: [{label: 'Bắc', type: 'bar', stack: 's', color: C.blue, data: mix.map(m => m.n / (m.n + m.s) * 100), est: mix.map(m => m.est), meta: mix.map(m => ({extra: [`Bắc ${nf(m.n)} ha / tổng ${nf(m.n + m.s)} ha`].concat(m.note ? [m.note] : []), src: m.src[0]}))},
        {label: 'Nam', type: 'bar', stack: 's', color: C.teal, data: mix.map(m => m.s / (m.n + m.s) * 100), est: mix.map(m => m.est), meta: mix.map(m => ({extra: [`Nam ${nf(m.s)} ha`], src: m.src[1] || m.src[0]}))}], y: {unit: '%', max: 100, fmt: v => nf(v, 0), title: '%'}, labelsCfg: {show: true, only: [0], fmt: v => nf(v, 0) + '%'}}))}));
    box.append(g1);

    box.append(section('2', 'FDI chế biến chế tạo', 'Vốn cấp mới là chỉ báo sớm của cầu thuê đất; vốn điều chỉnh, góp vốn và vốn thực hiện là các loại khác, không cộng.'));
    const g2 = el('div', 'kc-grid'), F = D.fdi, YL = F.map(f => String(f.year));
    g2.append(card({id: 'kcn-de-fdi', title: 'FDI chế biến chế tạo cấp mới — theo năm', sub: 'tỷ USD (cột) · số dự án (đường, trục phải) · 2016–2025', srcs: ['MFGHIST'], cadence: 'annual',
      legend: `<span><i style="background:${C.navy}"></i>Vốn cấp mới</span><span><i style="background:${C.amber}"></i>Số dự án cấp mới</span>`,
      table: () => ({head: ['Năm', 'Dự án cấp mới', 'Vốn cấp mới (tỷ USD)', 'Lượt điều chỉnh', 'Vốn điều chỉnh (tỷ USD)', 'Lượt góp vốn', 'Góp vốn (tỷ USD)', 'Ghi chú'], rows: F.map(f => [f.year, f.new_n, f.new_usd, f.adj_n, f.adj_usd, f.ma_n, f.ma_usd, f.note])}),
      draw: h => draw(h, combo({labels: YL, sets: [{label: 'Vốn cấp mới', type: 'bar', color: C.navy, data: F.map(f => f.new_usd), meta: F.map(f => ({period: String(f.year), cls: 'ACTUAL_SECONDARY', src: f.src}))}, {label: 'Số dự án cấp mới', type: 'line', axis: 'y2', color: C.amber, data: F.map(f => f.new_n), meta: F.map(f => ({period: String(f.year), src: f.src}))}],
        y: {unit: 'tỷ USD', fmt: v => nf(v, 2), title: 'tỷ USD'}, y2: {unit: 'dự án', title: 'dự án'}}))}));
    const avg = F.map(f => (f.new_n ? f.new_usd * 1000 / f.new_n : null)), yoyC = F.map((f, i) => (i && F[i - 1].new_usd ? (f.new_usd / F[i - 1].new_usd - 1) * 100 : null));
    g2.append(card({id: 'kcn-de-fdi2', title: 'Quy mô bình quân dự án và tăng trưởng vốn cấp mới', sub: 'triệu USD/dự án (cột, phái sinh) · % so năm trước (đường, trục phải)', srcs: ['MFGHIST'], cadence: 'annual', kind: 'derived',
      legend: `<span><i style="background:${C.blue}"></i>Vốn bình quân/dự án</span><span><i style="background:${C.plum}"></i>Vốn cấp mới so năm trước</span>`,
      take: `${last.year}: số dự án ${pf(last.new_n / prev.new_n - 1)} nhưng vốn ${pf(last.new_usd / prev.new_usd - 1)}, nên quy mô bình quân còn ${nf(avg[avg.length - 1], 1)} triệu USD/dự án (${prev.year}: ${nf(avg[avg.length - 2], 1)}). Dự án nhỏ hơn thường cần ít đất hơn mỗi hợp đồng.`,
      table: () => ({head: ['Năm', 'Vốn bình quân (triệu USD/dự án)', 'Vốn cấp mới so năm trước'], rows: F.map((f, i) => [f.year, avg[i] == null ? null : Math.round(avg[i] * 10) / 10, yoyC[i] == null ? null : pf(yoyC[i] / 100)])}),
      draw: h => draw(h, combo({labels: YL, sets: [{label: 'Vốn bình quân/dự án', type: 'bar', color: C.blue, data: avg, meta: F.map(f => ({period: String(f.year), cls: 'DERIVED', src: f.src, extra: ['= vốn cấp mới ÷ số dự án']}))}, {label: 'Vốn cấp mới so năm trước', type: 'line', axis: 'y2', color: C.plum, data: yoyC, meta: F.map(f => ({period: String(f.year), cls: 'DERIVED', src: f.src}))}],
        y: {unit: 'triệu USD', fmt: v => nf(v, 1), title: 'triệu USD/dự án'}, y2: {unit: '%', fmt: v => nf(v, 1), zero: false, title: '% so năm trước'}}))}));
    const types = {registered_new: 'Đăng ký cấp mới', registered_all: 'Đăng ký (mới + điều chỉnh + góp vốn)', disbursed: 'Thực hiện (giải ngân)'};
    const snapRows = D.fdi_snap.filter(f => inRange(f.period)).map(f => `<tr><td>${esc(types[f.ctype] || f.ctype)}</td><td>${f.sector === 'FDI_MFG' ? 'Chế biến chế tạo' : 'Toàn nền kinh tế'}</td><td>${esc(PL(f.period))}</td><td class="kc-num">${nf(f.value, 2)}</td><td>${f.agg === 'FY' ? 'Cả năm' : 'Lũy kế ' + esc(f.agg)}</td><td>${srcA(f.src)}</td><td>${esc(f.note || '')}</td></tr>`).join('');
    g2.append(card({id: 'kcn-de-fdi-types', title: 'Các loại vốn FDI — số theo kỳ công bố', sub: 'tỷ USD · tách loại vốn và kỳ lũy kế, không cộng giữa các dòng', wide: true, srcs: D.fdi_snap.map(f => f.src), kind: 'document', cadence: 'monthly',
      body: `<div class="tablewrap" data-no-fold><table class="kc-t" data-no-fold><thead><tr><th>Loại vốn</th><th>Phạm vi ngành</th><th>Kỳ</th><th>Tỷ USD</th><th>Cách cộng</th><th>Nguồn</th><th>Ghi chú</th></tr></thead><tbody>${snapRows}</tbody></table></div>`}));
    box.append(g2);

    box.append(section('3', 'Từ FDI đến nhu cầu đất', 'Chuỗi truyền dẫn và dữ liệu đang có ở từng khâu. Tương quan không chứng minh nhân quả.'));
    const steps = [
      ['FDI cấp mới', fdiNew ? `${nf(fdiNew.value, 1)} tỷ USD ${PL(fdiNew.period)}` : '—', 'ok'],
      ['Nhu cầu địa điểm nhà máy', 'Không đo trực tiếp', 'gap'],
      ['Ký thuê đất', vn9 ? `CBRE ${nf(vn9.value)} ha 9T/2026` : '—', 'ok'],
      ['Bàn giao đất', 'Chưa có số toàn thị trường; doanh nghiệp công bố riêng', 'gap'],
      ['Xây dựng nhà máy', 'Chưa có số', 'gap'],
      ['Sản xuất', 'IIP chế biến chế tạo (NSO) ở mục cập nhật hằng tháng bên dưới', 'ok']
    ];
    const lagOk = D.absorption.filter(a => a.ptype === 'Year').length >= 5;
    box.append(card({id: 'kcn-de-flow', title: 'Chuỗi truyền dẫn FDI → hoạt động sản xuất', sub: 'trạng thái dữ liệu từng khâu', wide: true, kind: 'static', srcs: ['VIETCAP26', 'MFGHIST'],
      body: `<div class="kc-flow">${steps.map((s, i) => `${i ? '<span class="kc-arr">→</span>' : ''}<div class="kc-node kc-node-${s[2]}"><b>${esc(s[0])}</b><small>${esc(s[1])}</small></div>`).join('')}</div>` +
        `<div class="kc-gap"><b>So FDI với hấp thụ trên cùng trục thời gian:</b> ${lagOk ? '' : 'chưa vẽ. Hấp thụ cả năm cùng một nguồn mới có 2025 (Shinhan, Bắc 524 ha, Nam 261 ha), trong khi FDI có 10 năm; cần ít nhất 5 năm cùng nguồn để xét độ trễ. Công cụ đo độ trễ tự bật khi workbook có đủ.'}</div>`}));
  }

  /* ===================== 3. Nguồn cung & lấp đầy ===================== */
  function rbfRows(seg) { return D.rbf.filter(x => x.segment === seg && inRange(x.period)); }
  function renderSupply(box) {
    const rs = regionsOn(), pipe = K.pipelineRatios(D).filter(p => regOn(p.region));
    const ys = rs.map(r => ({r, y: K.yearsOfSupply(D, r)}));
    const dl = rs.map(r => { const l = latestBy(r, 'stock_ha'); return l && {r, l, c: K.change(D, r, 'stock_ha', K.kOf(K.qk(l.period) - 4), l.period)}; }).filter(Boolean);
    box.append(el('div', '', kpis([
      ...dl.map(x => ({label: `Nguồn cung đất KCN miền ${REG[x.r]} ${QL(x.l.period)}`, value: `${nf(x.l.stock_ha)} ha`, delta: x.c.ok ? `${pf(x.c.rel)} so ${QL(x.c.from.period)}` : '', sub: `C&W ${srcA(x.l.src)}${K.qaFor(D, x.r, x.l.period).some(q => q.issue === 'STOCK_REVISIONS') ? ' · ⚠ có điều chỉnh số nền' : ''}`})),
      ...dl.map(x => ({label: `Đất trống ước tính miền ${REG[x.r]}`, value: `${nf(x.l.vacant_proxy)} ha`, sub: `${chip('PROXY')} nguồn cung × (1 − lấp đầy)`})),
      ...pipe.map(p => ({label: `Cung dự kiến miền ${REG[p.region]} 2026–2028`, value: `${nf(p.pipeline)} ha`, delta: `= ${pf(p.ratio, 0, false)} nguồn cung hiện hữu`, dcls: p.ratio >= K.TH.r5_ratio ? 'dn' : '', sub: `${chip('FORECAST')} ${srcA(p.src)}`})),
      ...ys.map(x => ({label: `Số năm đủ cung miền ${REG[x.r]}`, value: x.y.ok ? nf(x.y.value, 1) + ' năm' : 'Ẩn', sub: x.y.ok ? 'đất trống ÷ hấp thụ 4 quý' : esc(x.y.reasons[0])}))
    ])));
    box.append(section('A', 'Động lực nguồn cung', st.seg === 'land' ? 'Đất KCN trong phạm vi khảo sát C&W. Đổi bộ lọc Phân khúc để xem nhà xưởng, nhà kho xây sẵn.' : `Phân khúc ${st.seg === 'RBF' ? 'nhà xưởng' : 'nhà kho'} xây sẵn (m²), khác thị trường đất.`));
    const g = el('div', 'kc-grid');
    if (st.seg === 'land') {
      const labels = labelsInRange().filter(q => D.market.some(m => m.period === q));
      const sets = rs.map(r => { const rows = labels.map(q => D.market.find(m => m.period === q && m.region === r)); return {label: 'Miền ' + REG[r], type: 'bar', color: r === 'North' ? C.blue : C.teal, data: rows.map(m => m && m.stock_ha), est: rows.map(m => m && m.precision === 'APPROX'), meta: rows.map(m => m && {period: m.period, cls: 'ACTUAL', src: m.src, extra: [m.cohort === 'PRE' ? 'Phạm vi trước sáp nhập' : 'Phạm vi sau sáp nhập', m.precision === 'APPROX' ? 'Số xấp xỉ' : m.precision === 'SECONDARY_VERIFIED' ? 'Số thứ cấp đã đối chiếu' : 'Số chính xác', m.note]})}; });
      g.append(card({id: 'kcn-su-stock', title: 'Nguồn cung đất KCN — theo quý', sub: 'ha · trong phạm vi khảo sát C&W · cột gạch = số xấp xỉ', qa: ['GEOGRAPHY_REBASE', 'STOCK_REVISIONS', 'SECONDARY_STOCK_VALUE'], srcs: D.market.map(m => m.src),
        legend: sets.map(s => `<span><i style="background:${s.color}"></i>${s.label}</span>`).join('') + '<span><i class="kc-hatch"></i>Số xấp xỉ</span>',
        table: () => ({head: ['Kỳ', 'Vùng', 'Phạm vi', 'Nguồn cung (ha)', 'Độ chính xác', 'Ghi chú', 'Source_ID'], rows: D.market.filter(m => inRange(m.period) && regOn(m.region)).map(m => [QL(m.period), REG[m.region], m.cohort === 'PRE' ? 'Trước sáp nhập' : 'Sau sáp nhập', m.stock_ha, m.precision, m.note, m.src])}),
        draw: h => draw(h, combo({labels: labels.map(QL), sets, y: {unit: 'ha', title: 'ha'}, markers: labels.indexOf(D.rebase) > 0 ? [{label: QL(D.rebase), text: 'Đổi phạm vi C&W'}] : []}))}));
      const side = st.r === 'both' ? st.side : st.r;
      g.append(stockOccCard('kcn-su-occ', side, {controls: st.r === 'both' ? ['North', 'South'].map(r => `<button type="button" data-kc-side="${r}" aria-pressed="${side === r}">${REG[r]}</button>`).join('') : ''}));
      // Cầu so cung: hấp thụ C&W cạnh thay đổi nguồn cung hợp lệ.
      const dLabels = labelsInRange().filter(q => K.qk(q) > K.qk(QUARTERS[0]) && D.market.some(m => m.period === q));
      const dsets = [];
      rs.forEach(r => {
        const dd = K.stockDelta(D, r), ab = SERIES.filter(s => s.reporter === 'C&W' && s.region === r).flatMap(s => s.points);
        dsets.push({label: `Thay đổi nguồn cung · ${REG[r]}`, type: 'bar', color: r === 'North' ? C.blue : C.teal, missing: true, data: dLabels.map(q => { const x = dd.find(v => v.period === q); return x ? x.value : null; }), est: dLabels.map(q => !!(dd.find(v => v.period === q) || {}).approx),
          meta: dLabels.map(q => { const x = dd.find(v => v.period === q); return x ? {period: q, cls: 'DERIVED', extra: [x.reason || 'Δ nguồn cung so quý trước, cùng phạm vi'].concat(fin(x.raw) ? [`Số thô ${nf(x.raw)} ha`] : [])} : null; })});
        dsets.push({label: `Hấp thụ C&W · ${REG[r]}`, type: 'line', color: r === 'North' ? C.plum : C.amber, data: dLabels.map(q => { const p = ab.find(v => v.period === q); return p ? p.value : null; }), meta: dLabels.map(q => { const p = ab.find(v => v.period === q); return p ? {period: q, cls: p.cls, src: p.src} : null; })});
      });
      const blocked = rs.flatMap(r => K.stockDelta(D, r).filter(x => x.value == null && inRange(x.period)).map(x => `${REG[r]} ${QL(x.period)}: ${x.reason.toLowerCase()}`));
      g.append(card({id: 'kcn-su-dvs', title: 'Cầu so cung: hấp thụ thuần và thay đổi nguồn cung', sub: 'ha/quý · thay đổi nguồn cung chỉ tính trong cùng phạm vi, bỏ quý điều chỉnh số nền', qa: ['STOCK_REVISIONS', 'GEOGRAPHY_REBASE', 'ABSORPTION_GAPS'], srcs: D.market.map(m => m.src), wide: true, kind: 'derived',
        legend: dsets.map(s => `<span><i style="background:${s.color}"></i>${esc(s.label)}</span>`).join('') + '<span><i class="kc-hole"></i>Không tính được</span>',
        take: blocked.length ? `Không tính: ${esc(blocked.join(' · '))}.` : '',
        table: () => ({head: ['Kỳ', 'Vùng', 'Thay đổi nguồn cung (ha)', 'Lý do để trống', 'Hấp thụ C&W (ha)'], rows: rs.flatMap(r => K.stockDelta(D, r).filter(x => inRange(x.period)).map(x => [QL(x.period), REG[r], x.value, x.reason || '', ((SERIES.filter(s => s.reporter === 'C&W' && s.region === r).flatMap(s => s.points).find(p => p.period === x.period)) || {}).value ?? null]))}),
        draw: h => draw(h, combo({labels: dLabels.map(QL), sets: dsets, y: {unit: 'ha', title: 'ha'}, missing: true, markers: dLabels.indexOf(D.rebase) > 0 ? [{label: QL(D.rebase), text: 'Đổi phạm vi'}] : []}))}));
    } else {
      const seg = st.seg, rows = rbfRows(seg), labels = [...new Set(rows.map(x => x.period))].sort((a, b) => K.qk(a) - K.qk(b));
      const at = (q, r) => rows.find(x => x.period === q && x.region === r);
      const sets = rs.map(r => ({label: 'Miền ' + REG[r], type: 'bar', color: r === 'North' ? C.blue : C.teal, missing: true, data: labels.map(q => { const x = at(q, r); return x ? x.stock_sqm / 1000 : null; }), est: labels.map(q => (at(q, r) || {}).precision === 'APPROX'), meta: labels.map(q => { const x = at(q, r); return x && {period: q, cls: 'ACTUAL', src: x.src, extra: [x.note, x.cohort === 'PRE' ? 'Phạm vi trước sáp nhập' : 'Phạm vi sau sáp nhập']}; })}));
      const occ = rs.map(r => ({label: 'Lấp đầy ' + REG[r], type: 'line', axis: 'y2', color: r === 'North' ? C.plum : C.amber, data: labels.map(q => { const x = at(q, r); return x && fin(x.occ) ? x.occ * 100 : null; }), meta: labels.map(q => { const x = at(q, r); return x && {period: q, src: x.src}; })}));
      g.append(card({id: 'kcn-su-rbf', title: `${seg === 'RBF' ? 'Nhà xưởng' : 'Nhà kho'} xây sẵn: nguồn cung và lấp đầy`, sub: 'nghìn m² (cột) · lấp đầy % (đường, trục phải) · C&W', qa: ['GEOGRAPHY_REBASE'], srcs: rows.map(x => x.src), wide: true,
        legend: sets.concat(occ).map(s => `<span><i style="background:${s.color}"></i>${esc(s.label)}</span>`).join(''),
        table: () => ({head: ['Kỳ', 'Vùng', 'Phân khúc', 'Nguồn cung (m²)', 'Lấp đầy', 'Hấp thụ (m²)', 'Giá USD/m²/tháng', 'Giá VND/m²/tháng', 'Độ chính xác', 'Source_ID'], rows: rows.filter(x => regOn(x.region)).map(x => [QL(x.period), REG[x.region], x.segment, x.stock_sqm, x.occ == null ? null : pf(x.occ, 1, false), x.abs_sqm, x.ask_usd, x.ask_vnd, x.precision, x.src])}),
        draw: h => draw(h, combo({labels: labels.map(QL), sets: sets.concat(occ), y: {unit: 'nghìn m²', title: 'nghìn m²'}, y2: {unit: '%', zero: false, min: 60, max: 100, fmt: v => nf(v, 1), title: 'lấp đầy %'}, missing: true, markers: labels.indexOf('2025Q3') > 0 ? [{label: 'Q3/2025', text: 'Đổi phạm vi'}] : []}))}));
    }
    box.append(g);
    box.append(card({id: 'kcn-su-yos', title: 'Số năm đủ cung (Years of Supply)', sub: 'đất trống ÷ hấp thụ thuần năm hóa · chỉ hiện khi đủ 4 điều kiện', kind: 'derived', wide: true, srcs: ['CW_N26Q3', 'CW_S26Q3'],
      body: `<ul class="kc-cond">${['Cùng phạm vi khảo sát (đất trống và hấp thụ cùng C&W, cùng phiên bản địa giới)', 'Có ít nhất 4 quý hấp thụ liên tiếp', 'Hấp thụ 4 quý dương', 'Không có đổi phạm vi chưa xử lý trong cửa sổ'].map(t => `<li>${esc(t)}</li>`).join('')}</ul>` +
        ys.map(x => `<p class="kc-gap"><b>Miền ${REG[x.r]}:</b> ${x.y.ok ? `${nf(x.y.value, 1)} năm (${nf(x.y.vacant)} ha ÷ ${nf(x.y.annual)} ha/năm)` : `ẩn — ${esc(x.y.reasons.join(' '))}`}</p>`).join('')}));

    const RP = (D.reported || []).filter(x => regOn(x.region) && inRange(x.period));
    const MET = {stock_yoy: 'Nguồn cung so cùng kỳ', occ_yoy_pp: 'Lấp đầy so cùng kỳ', rent_yoy: 'Giá chào thuê so cùng kỳ', leased_area_change_ha: 'Diện tích đã thuê tăng so cùng kỳ'};
    if (RP.length) box.append(card({id: 'kcn-su-reported', title: 'So cùng kỳ do nguồn tự công bố trên cùng phạm vi địa giới', sub: 'thay cho phép so trực tiếp qua mốc đổi phạm vi Q3/2025 · C&W tính trên địa giới mới; CBRE trên thị trường cấp 1', wide: true, kind: 'document', srcs: [...new Set(RP.map(x => x.src))], qa: ['GEOGRAPHY_REBASE'],
      body: `<div class="tablewrap" data-no-fold><table class="kc-t" data-no-fold><thead><tr><th>Kỳ</th><th>Vùng</th><th>Nguồn</th><th>Chỉ tiêu</th><th>Mức thay đổi</th><th>Ghi chú</th></tr></thead><tbody>${RP.map(x => `<tr><td>${QL(x.period)}</td><td>${REG[x.region]}</td><td>${esc(x.reporter)}</td><td>${esc(MET[x.metric] || x.metric)}${x.unit ? ` (${esc(x.unit)})` : ''}</td><td class="kc-num">${x.metric === 'occ_yoy_pp' ? ppf(x.value) : x.metric === 'leased_area_change_ha' ? '+' + nf(x.value) + ' ha' : pf(x.value)}</td><td class="kc-na">${esc(x.note || (x.basis === 'like-for-like' ? 'C&W ghi rõ "like-for-like"' : ''))} ${srcA(x.src, '↗')}</td></tr>`).join('')}</tbody></table></div>`,
      take: 'Đây là mức thay đổi nguồn tự tính trên cùng phạm vi; mức tuyệt đối trước và sau Q3/2025 vẫn không đặt cạnh nhau.'}));

    box.append(section('B', 'Nguồn cung tương lai', 'Diện tích quy hoạch hay mở bán không đồng nghĩa đất sạch sẵn sàng bàn giao. Không cộng dự án với số dự phóng toàn vùng.'));
    const g2 = el('div', 'kc-grid');
    const pr = K.pipelineRatios(D), pa = D.pipe_area;
    g2.append(card({id: 'kcn-su-pipe', title: 'Cung dự kiến 2026–2028 theo vùng và tỉnh miền Nam', sub: `ha · dự phóng C&W ${QL('2026Q3')} · tỉnh = tỷ trọng × tổng vùng (phái sinh)`, qa: ['PROJECT_VS_REGIONAL_PIPELINE'], srcs: pr.map(p => p.src), kind: 'document',
      legend: `<span><i class="kc-hatch"></i>Dự phóng</span>`,
      take: pr.length ? pr.map(p => `Miền ${REG[p.region]}: bằng ${pf(p.ratio, 0, false)} nguồn cung hiện hữu, ${pf(p.pipeline / p.vacant, 0, false)} đất trống ước tính`).join(' · ') + '.' : '',
      table: () => ({head: ['Phạm vi', 'Kỳ dự phóng', 'Diện tích (ha)', 'Tỷ trọng', 'Loại số', 'Source_ID'], rows: pr.map(p => [`Miền ${REG[p.region]}`, '2026–2028', p.pipeline, '', 'FORECAST', p.src]).concat(pa.map(a => [a.province_vi, a.period, Math.round(a.implied_ha), pf(a.share, 0, false), a.cls, a.src]))}),
      draw: h => { const L = pr.map(p => 'Miền ' + REG[p.region]).concat(pa.map(a => a.province_vi)), v = pr.map(p => p.pipeline).concat(pa.map(a => a.implied_ha)); draw(h, combo({labels: L, horizontal: true, sets: [{label: 'Cung dự kiến', type: 'bar', color: C.navy, data: v, est: v.map(() => true), meta: pr.map(p => ({period: '2026Q3', cls: 'FORECAST', src: p.src})).concat(pa.map(a => ({cls: 'FORECAST_DERIVED', src: a.src, extra: [`${pf(a.share, 0, false)} × ${nf(a.regional_ha)} ha`]})))}], y: {unit: 'ha'}, labelsCfg: {show: true, fmt: v => nf(v)}})); }}));
    const proj = D.pipeline.filter(p => p.stage !== 'REGIONAL_FORECAST' && (st.prov === 'all' || p.province_vi === st.prov) && regOn(p.region));
    g2.append(card({id: 'kcn-su-proj', title: 'Dự án KCN mới theo kỳ công bố', sub: 'ha · màu theo giai đoạn nguồn ghi nhận · không cộng thành tổng cung', qa: ['PROJECT_VS_REGIONAL_PIPELINE'], srcs: proj.map(p => p.src), height: Math.max(260, proj.length * 26 + 60),
      legend: Object.entries(STAGE_C).map(([k, c]) => `<span><i style="background:${c}"></i>${STAGE[k]}</span>`).join(''),
      table: () => ({head: ['Kỳ công bố', 'Vùng', 'Tỉnh', 'Dự án', 'Diện tích (ha)', 'Giai đoạn', 'Chủ đầu tư', 'Lưu ý', 'Source_ID'], rows: proj.map(p => [PL(p.period), REG[p.region], p.province_vi, p.project, p.area_ha, STAGE[p.stage] || p.stage, p.developer, p.caution, p.src])}),
      draw: h => { draw(h, combo({labels: proj.map(p => `${p.project} · ${p.province_vi}`), horizontal: true, sets: [{label: 'Diện tích', type: 'bar', color: C.blue, data: proj.map(p => p.area_ha), meta: proj.map(p => ({period: p.period, src: p.src, extra: [STAGE[p.stage] || p.stage, p.developer ? 'Chủ đầu tư: ' + p.developer : '', p.caution].filter(Boolean)}))}], y: {unit: 'ha'}, labelsCfg: {show: true, fmt: v => nf(v)}})); recolor(h, proj.map(p => STAGE_C[p.stage] || C.grey)); }}));
    box.append(g2);
    const lbp = D.landbank.filter(x => x.stage === 'pipeline' && (st.prov === 'all' || PROV_NORM(x.province) === st.prov));
    box.append(card({id: 'kcn-su-copipe', title: 'Dự án đang đầu tư của doanh nghiệp niêm yết', sub: 'trạng thái theo BCTN 2025 của chủ đầu tư · thương phẩm quy hoạch ≠ đất sạch', wide: true, kind: 'document', cadence: 'annual', srcs: [],
      body: `<div class="tablewrap" data-no-fold><table class="kc-t" data-no-fold><thead><tr><th>Mã</th><th>Dự án</th><th>Tỉnh (sau sáp nhập)</th><th>Gross (ha)</th><th>Thương phẩm quy hoạch (ha)</th><th>Trạng thái</th><th>Lưu ý</th><th>Nguồn</th></tr></thead><tbody>${lbp.map(x => `<tr><td><b>${esc(x.ticker)}</b></td><td>${esc(x.project)}</td><td>${esc(x.province)}</td><td class="kc-num">${nf(x.gross_ha, 2)}</td><td class="kc-num">${nf(x.commercial_ha, 2)}</td><td>${esc(x.status)}</td><td>${esc(x.def_note || (x.qa === 'PHASE_ONLY' ? 'Chỉ một giai đoạn' : ''))}</td><td>${x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener">BCTN ↗</a> <span class="kc-na">${esc(x.page || '')}</span>` : ''}</td></tr>`).join('') || '<tr><td colspan="8">Không có dự án trong bộ lọc.</td></tr>'}</tbody></table></div><p class="kc-na">Bốn dự án IDC (Tân Phước 1, Mỹ Xuân B1 mở rộng, Vinh Quang GĐ1, Phú Long) cũng có trong danh sách dự án mới ở trên: cùng diện tích, không cộng hai lần.</p>`}));
  }
  // Màu từng cột theo giai đoạn (một dataset).
  function recolor(h, cols) { if (h._kcCfg) h._kcCfg.data.datasets[0].backgroundColor = cols; const ch = h._kcChart; if (ch) { ch.data.datasets[0].backgroundColor = cols; ch.update('none'); } }

  /* ===================== 4. Giá thuê & địa phương ===================== */
  function thNow() { return {...K.TH, m_occ: st.mOcc, m_rent: st.mRent}; }
  function renderRent(box) {
    const rs = regionsOn();
    const lastUsd = r => latestBy(r, 'ask_usd'), lastVnd = r => latestBy(r, 'ask_vnd');
    const firstPost = r => K.marketRows(D, r).find(m => m.cohort === 'POST' && fin(m.ask_usd));
    const q3 = D.province.filter(p => fin(p.rent_yoy));
    box.append(el('div', '', kpis([
      ...rs.map(r => { const u = lastUsd(r), f = firstPost(r), c = u && f && K.change(D, r, 'ask_usd', f.period, u.period); return u && {label: `Giá chào thuê đất miền ${REG[r]} ${QL(u.period)}`, value: `${nf(u.ask_usd, 1)} USD/m²/kỳ`, delta: c && c.ok && f.period !== u.period ? `${pf(c.rel)} so ${QL(f.period)} (cùng phạm vi)` : '', dcls: 'up', sub: `kỳ USD cuối cùng · ${srcA(u.src)}`}; }),
      ...rs.map(r => { const v = lastVnd(r), ry = v && K.reportedOf(D, r, 'rent_yoy', 'C&W').find(x => x.period === v.period); return v && {label: `Giá chào thuê miền ${REG[r]} ${QL(v.period)}`, value: `${nf(v.ask_vnd / 1e6, 2)} triệu đ/m²/kỳ`, delta: ry ? `${pf(ry.value)} so cùng kỳ (C&W công bố)` : '', dcls: ry && ry.value < 0 ? 'dn' : 'up', sub: `báo giá VND, không nối với chuỗi USD · ${srcA(v.src)}${ry ? ' · ' + srcA(ry.src) : ''}`}; }),
      ...q3.filter(p => st.prov === 'all' || p.province_vi === st.prov).map(p => ({label: `${p.province_vi} · giá so cùng kỳ ${QL(p.period)}`, value: pf(p.rent_yoy), dcls: p.rent_yoy < 0 ? 'dn' : 'up', delta: `lấp đầy ${pf(p.occ, 1, false)}`, sub: `C&W công bố ${srcA(p.src)}`}))
    ])));
    box.append(section('A', 'Xu hướng giá chào thuê', 'Giá đất KCN là giá cho thời hạn thuê còn lại (thường đến hết đời dự án), không phải tiền thuê mỗi tháng. Nhà xưởng, nhà kho mới tính theo tháng.'));
    const g = el('div', 'kc-grid');
    const unitCtl = ['usd', 'vnd'].map(u => `<button type="button" data-kc-unit="${u}" aria-pressed="${st.unit === u}">${u.toUpperCase()}</button>`).join('');
    if (st.seg === 'land') {
      if (st.unit === 'usd') {
        const L = labelsInRange().filter(q => D.market.some(m => m.period === q && fin(m.ask_usd)));
        const sets = [];
        rs.forEach(r => ['PRE', 'POST'].forEach(co => { const rows = L.map(q => D.market.find(m => m.period === q && m.region === r && m.cohort === co)); if (rows.some(x => x && fin(x.ask_usd))) sets.push({label: `${REG[r]} · ${co === 'PRE' ? 'trước' : 'sau'} sáp nhập`, type: 'line', color: r === 'North' ? C.blue : C.teal, dash: co === 'PRE' ? [3, 3] : undefined, data: rows.map(x => (x && fin(x.ask_usd) ? x.ask_usd : null)), meta: rows.map(x => x && {period: x.period, cls: 'ACTUAL', src: x.src, extra: ['Giá chào sơ cấp, không phải giá giao dịch']})}); }));
        g.append(card({id: 'kcn-re-usd', title: 'Giá chào thuê đất KCN — USD', sub: 'USD/m²/kỳ thuê còn lại · C&W · nét đứt = phạm vi trước sáp nhập', qa: ['RENT_CURRENCY_CHANGE', 'GEOGRAPHY_REBASE', 'ASKING_VS_EXECUTION'], srcs: D.market.map(m => m.src), controls: unitCtl,
          legend: sets.map(s => `<span><i style="background:${s.color}${s.dash ? ';opacity:.55' : ''}"></i>${esc(s.label)}</span>`).join(''),
          take: 'Từ Q3/2026 C&W chỉ báo giá VND, nên chuỗi USD dừng ở Q2/2026; bấm VND để xem kỳ mới.',
          table: () => ({head: ['Kỳ', 'Vùng', 'Phạm vi', 'USD/m²/kỳ', 'Source_ID'], rows: D.market.filter(m => fin(m.ask_usd) && regOn(m.region) && inRange(m.period)).map(m => [QL(m.period), REG[m.region], m.cohort === 'PRE' ? 'Trước sáp nhập' : 'Sau sáp nhập', m.ask_usd, m.src])}),
          draw: h => draw(h, combo({labels: L.map(QL), sets, y: {unit: 'USD/m²', zero: false, fmt: v => nf(v, 1), title: 'USD/m²/kỳ'}, markers: L.indexOf(D.rebase) > 0 ? [{label: QL(D.rebase), text: 'Đổi phạm vi C&W'}] : []}))}));
      } else {
        const items = rs.map(r => lastVnd(r)).filter(Boolean).map(v => ({label: `Miền ${REG[v.region]} (vùng)`, v: v.ask_vnd, period: v.period, src: v.src, c: v.region === 'North' ? C.blue : C.teal}))
          .concat(D.province.filter(p => fin(p.ask_vnd) && regOn(p.region)).map(p => ({label: p.province_vi, v: p.ask_vnd, period: p.period, src: p.src, c: C.tealD, yoy: p.rent_yoy})));
        g.append(card({id: 'kcn-re-vnd', title: 'Giá chào thuê đất KCN — VND', sub: `triệu đ/m²/kỳ thuê còn lại · ${QL(items[0] ? items[0].period : '')} · chưa có kỳ VND trước để so`, qa: ['RENT_CURRENCY_CHANGE', 'ASKING_VS_EXECUTION'], srcs: items.map(i => i.src), controls: unitCtl,
          table: () => ({head: ['Phạm vi', 'Kỳ', 'VND/m²/kỳ', 'So cùng kỳ (C&W công bố)', 'Source_ID'], rows: items.map(i => [i.label, QL(i.period), i.v, i.yoy == null ? null : pf(i.yoy), i.src])}),
          draw: h => { draw(h, combo({labels: items.map(i => i.label), horizontal: true, sets: [{label: 'Giá chào thuê', type: 'bar', color: C.blue, data: items.map(i => i.v / 1e6), meta: items.map(i => ({period: i.period, cls: 'ACTUAL', src: i.src, extra: i.yoy == null ? [] : [`So cùng kỳ (C&W): ${pf(i.yoy)}`]}))}], y: {unit: 'triệu đ/m²', fmt: v => nf(v, 2)}, labelsCfg: {show: true, fmt: v => nf(v, 2)}})); recolor(h, items.map(i => i.c)); }}));
      }
    } else {
      const seg = st.seg, rows = rbfRows(seg).filter(x => regOn(x.region)), L = [...new Set(rows.map(x => x.period))].sort((a, b) => K.qk(a) - K.qk(b));
      const sets = [];
      rs.forEach(r => ['PRE', 'POST'].forEach(co => { const pts = L.map(q => rows.find(x => x.period === q && x.region === r && x.cohort === co && fin(x.ask_usd))); if (pts.some(Boolean)) sets.push({label: `${REG[r]} · ${co === 'PRE' ? 'trước' : 'sau'} sáp nhập`, type: 'line', color: r === 'North' ? C.blue : C.teal, dash: co === 'PRE' ? [3, 3] : undefined, data: pts.map(x => x && x.ask_usd), meta: pts.map(x => x && {period: x.period, cls: 'ACTUAL', src: x.src})}); }));
      const vnd = rows.filter(x => fin(x.ask_vnd));
      g.append(card({id: 'kcn-re-rbf', title: `Giá chào thuê ${seg === 'RBF' ? 'nhà xưởng' : 'nhà kho'} xây sẵn`, sub: `USD/m²/tháng · C&W${vnd.length ? ` · ${QL(vnd[0].period)} báo giá VND: ${vnd.map(x => `${REG[x.region]} ${nf(x.ask_vnd)} đ/m²/tháng`).join(', ')}` : ''}`, qa: ['RENT_CURRENCY_CHANGE', 'GEOGRAPHY_REBASE'], srcs: rows.map(x => x.src), wide: true,
        legend: sets.map(s => `<span><i style="background:${s.color}${s.dash ? ';opacity:.55' : ''}"></i>${esc(s.label)}</span>`).join(''),
        table: () => ({head: ['Kỳ', 'Vùng', 'USD/m²/tháng', 'VND/m²/tháng', 'Source_ID'], rows: rows.map(x => [QL(x.period), REG[x.region], x.ask_usd, x.ask_vnd, x.src])}),
        draw: h => draw(h, combo({labels: L.map(QL), sets, y: {unit: 'USD/m²/tháng', zero: false, fmt: v => nf(v, 2)}, markers: L.indexOf('2025Q3') > 0 ? [{label: 'Q3/2025', text: 'Đổi phạm vi'}] : []}))}));
    }
    const sp = D.province.filter(p => p.region === 'South' && fin(p.occ) && inRange(p.period)), SL = [...new Set(sp.map(p => p.period))].sort((a, b) => K.qk(a) - K.qk(b)), pc = {'TP.HCM': C.navy, 'Đồng Nai': C.teal, 'Tây Ninh': C.plum};
    if (regOn('South') && st.seg === 'land') g.append(card({id: 'kcn-re-provocc', title: 'Lấp đầy theo tỉnh — miền Nam', sub: '% · C&W · địa giới sau sáp nhập', qa: ['PROVINCE_OCCUPANCY_REVISION'], srcs: sp.map(p => p.src),
      legend: Object.entries(pc).map(([k, c]) => `<span><i style="background:${c}"></i>${k}</span>`).join(''),
      table: () => ({head: ['Kỳ', 'Tỉnh', 'Lấp đầy', 'Source_ID'], rows: sp.map(p => [QL(p.period), p.province_vi, pf(p.occ, 1, false), p.src])}),
      draw: h => draw(h, combo({labels: SL.map(QL), sets: Object.keys(pc).map(n => ({label: n, type: 'line', color: pc[n], data: SL.map(q => { const p = sp.find(x => x.period === q && x.province_vi === n); return p ? p.occ * 100 : null; }), meta: SL.map(q => { const p = sp.find(x => x.period === q && x.province_vi === n); return p && {period: q, cls: 'ACTUAL', src: p.src}; })})), y: {unit: '%', zero: false, min: 50, max: 100, fmt: v => nf(v, 1)}}))}));
    box.append(g);

    box.append(section('B', 'Bản đồ nhiệt theo tỉnh', 'Ô trống nghĩa là nguồn chưa công bố; không tự điền. Rê chuột lên ô để xem kỳ và nguồn.'));
    box.append(heatCard());
    box.append(section('C', 'Ma trận sức mạnh giá', 'Mỗi điểm là một tỉnh có cả lấp đầy và giá chào thuê so cùng kỳ trong cùng bản khảo sát. Chỉnh ngưỡng để xem phân nhóm thay đổi.'));
    box.append(matrixCard());
    box.append(section('D', 'So sánh hai địa phương', 'Không kết luận tỉnh nào tốt hơn khi hai bên khác kỳ hoặc khác bản khảo sát.'));
    box.append(compareCard());
    const fired = K.rules(D, thNow()).fired.filter(f => f.tab === 'rent' || (f.id === 'R5' && f.scope !== 'Miền Bắc' && f.scope !== 'Miền Nam'));
    if (fired.length) { box.append(section('E', 'Hàm ý đầu tư theo địa phương', '')); box.append(el('div', 'kc-insgrid', fired.map(insightCard).join(''))); }
  }
  function provRows() {
    const names = [...new Set(D.province.map(p => p.province_vi))];
    return names.map(n => {
      const rows = D.province.filter(p => p.province_vi === n).sort((a, b) => K.qk(a.period) - K.qk(b.period));
      const occ = rows.filter(p => fin(p.occ)).pop(), usd = rows.filter(p => fin(p.ask_usd)).pop(), vnd = rows.filter(p => fin(p.ask_vnd)).pop(), yy = rows.filter(p => fin(p.rent_yoy)).pop();
      const pa = D.pipe_area.find(a => a.province_vi === n), ref = rows.find(p => fin(p.abs_ref_ha));
      const sig = occ && yy && occ.period === yy.period ? K.quadrant(occ.occ, yy.rent_yoy, thNow()) : null;
      return {n, region: rows[0].region, occ, usd, vnd, yy, pa, ref, sig, pre: rows.every(p => /PRE/.test(p.geo || ''))};
    }).filter(x => regOn(x.region));
  }
  function heatCard() {
    const rows = provRows();
    const occBg = v => { const t = Math.max(0, Math.min(1, (v - 0.5) / 0.5)); return `rgba(41,56,168,${(0.08 + t * 0.55).toFixed(2)})`; };
    const yoyBg = v => v >= 0 ? `rgba(27,107,58,${Math.min(0.5, 0.08 + v * 4).toFixed(2)})` : `rgba(161,53,43,${Math.min(0.5, 0.08 - v * 4).toFixed(2)})`;
    const td = (v, txt, tip, bg) => v == null ? `<td class="kc-hm-na" title="Nguồn chưa công bố">—</td>` : `<td class="kc-num" title="${esc(tip)}" style="background:${bg || 'transparent'}">${txt}</td>`;
    const tr = rows.map(x => `<tr class="${st.prov === x.n ? 'kc-hl' : ''}"><td><b>${esc(x.n)}</b>${x.pre ? ' <span class="kc-chip kc-nt" title="Địa giới trước sáp nhập, chỉ tham khảo">trước sáp nhập</span>' : ''}</td><td>${REG[x.region]}</td>` +
      td(x.occ && x.occ.occ, x.occ ? pf(x.occ.occ, 1, false) : '', x.occ ? `${QL(x.occ.period)} · ${srcName(x.occ.src)}` : '', x.occ ? occBg(x.occ.occ) : '') +
      td(x.usd && x.usd.ask_usd, x.usd ? nf(x.usd.ask_usd, 1) : '', x.usd ? `USD/m²/kỳ · ${QL(x.usd.period)} · ${srcName(x.usd.src)}` : '') +
      td(x.vnd && x.vnd.ask_vnd, x.vnd ? nf(x.vnd.ask_vnd / 1e6, 2) : '', x.vnd ? `triệu đ/m²/kỳ · ${QL(x.vnd.period)} · ${srcName(x.vnd.src)}` : '') +
      td(x.yy && x.yy.rent_yoy, x.yy ? pf(x.yy.rent_yoy) : '', x.yy ? `${QL(x.yy.period)} · C&W công bố · ${srcName(x.yy.src)}` : '', x.yy ? yoyBg(x.yy.rent_yoy) : '') +
      td(x.pa && x.pa.implied_ha, x.pa ? `${pf(x.pa.share, 0, false)} · ${nf(x.pa.implied_ha)} ha` : '', x.pa ? `Dự phóng phái sinh ${x.pa.period} · ${srcName(x.pa.src)}` : '') +
      td(x.ref && x.ref.abs_ref_ha, x.ref ? `${nf(x.ref.abs_ref_ha)} / ${nf(x.ref.stock_ref_ha)}` : '', x.ref ? `Hấp thụ / nguồn cung tỉnh ${QL(x.ref.period)}, không khớp số vùng: chỉ tham khảo` : '') +
      `<td>${x.sig ? `<span class="kc-chip kc-q${x.sig}">${esc(K.QUAD_TEXT[x.sig])}</span>` : '<span class="kc-na">Thiếu lấp đầy hoặc giá YoY cùng kỳ</span>'}</td></tr>`).join('');
    return card({id: 'kcn-re-heat', title: 'Thị trường KCN theo tỉnh', sub: 'kỳ mới nhất có số của từng chỉ tiêu · màu: lấp đầy (xanh đậm = cao), giá YoY (xanh lá tăng, đỏ giảm)', wide: true, qa: ['PROVINCE_ABSORPTION_NOT_RECONCILED', 'PROVINCE_OCCUPANCY_REVISION', 'RENT_CURRENCY_CHANGE'], srcs: D.province.map(p => p.src),
      body: `<div class="tablewrap" data-no-fold><table class="kc-t kc-hm" data-no-fold><thead><tr><th>Tỉnh</th><th>Vùng</th><th>Lấp đầy</th><th>Giá USD/m²/kỳ</th><th>Giá triệu đ/m²/kỳ</th><th>Giá so cùng kỳ</th><th>Cung dự kiến 2026–28</th><th>Hấp thụ / cung tỉnh (ha)</th><th>Tín hiệu (ngưỡng ma trận)</th></tr></thead><tbody>${tr}</tbody></table></div>`,
      table: () => ({head: ['Tỉnh', 'Vùng', 'Lấp đầy', 'Kỳ lấp đầy', 'USD/m²/kỳ', 'Kỳ USD', 'VND/m²/kỳ', 'Kỳ VND', 'Giá YoY', 'Tỷ trọng cung mới', 'Cung dự kiến (ha)', 'Tín hiệu'], rows: rows.map(x => [x.n, REG[x.region], x.occ ? x.occ.occ : null, x.occ ? QL(x.occ.period) : null, x.usd ? x.usd.ask_usd : null, x.usd ? QL(x.usd.period) : null, x.vnd ? x.vnd.ask_vnd : null, x.vnd ? QL(x.vnd.period) : null, x.yy ? x.yy.rent_yoy : null, x.pa ? x.pa.share : null, x.pa ? Math.round(x.pa.implied_ha) : null, x.sig ? K.QUAD_TEXT[x.sig] : null])})});
  }
  function matrixCard() {
    const pts = K.provincePoints(D).filter(p => regOn(p.region));
    const excluded = D.province.filter(p => regOn(p.region) && !pts.some(x => x.province_vi === p.province_vi)).map(p => p.province_vi);
    const ctl = `<label>Ngưỡng lấp đầy <input type="range" min="50" max="95" step="1" value="${Math.round(st.mOcc * 100)}" data-kc-th="mOcc"> <b>${nf(st.mOcc * 100, 0)}%</b></label><label>Ngưỡng giá so cùng kỳ <input type="range" min="-10" max="10" step="0.5" value="${st.mRent * 100}" data-kc-th="mRent"> <b>${pf(st.mRent, 1)}</b></label>`;
    const cls = pts.map(p => `<li><b>${esc(p.province_vi)}</b> ${QL(p.period)}: ${pf(p.occ, 1, false)}, ${pf(p.rent_yoy)} → <span class="kc-chip kc-q${K.quadrant(p.occ, p.rent_yoy, thNow())}">${esc(K.QUAD_TEXT[K.quadrant(p.occ, p.rent_yoy, thNow())])}</span></li>`).join('');
    return card({id: 'kcn-re-matrix', title: 'Lấp đầy và giá chào thuê so cùng kỳ theo tỉnh', sub: `X: lấp đầy % · Y: giá chào thuê so cùng kỳ % · ${pts.length} tỉnh có đủ hai chỉ tiêu cùng kỳ`, qa: ['ASKING_VS_EXECUTION', 'PROVINCE_OCCUPANCY_REVISION'], srcs: pts.map(p => p.src), controls: ctl, wide: true, height: 300, kind: 'derived',
      take: `<ul class="kc-qlist">${cls}</ul>${excluded.length ? `<span class="kc-na">Không đủ dữ liệu cùng kỳ: ${esc([...new Set(excluded)].join(', '))}.</span>` : ''}`,
      table: () => ({head: ['Tỉnh', 'Kỳ', 'Lấp đầy', 'Giá YoY', 'Nhóm', 'Source_ID'], rows: pts.map(p => [p.province_vi, QL(p.period), p.occ, p.rent_yoy, K.QUAD_TEXT[K.quadrant(p.occ, p.rent_yoy, thNow())], p.src])}),
      draw: h => { if (!pts.length) { h.innerHTML = '<p class="kc-gap">Không có tỉnh nào đủ dữ liệu trong bộ lọc.</p>'; return; }
        const xs = pts.map(p => p.occ * 100), ys = pts.map(p => p.rent_yoy * 100);
        draw(h, {type: 'scatter', plugins: PLUGINS, data: {datasets: [{label: 'Tỉnh', data: pts.map(p => ({x: p.occ * 100, y: p.rent_yoy * 100, name: p.province_vi})), kcMeta: pts.map(p => ({period: p.period, cls: 'ACTUAL', src: p.src})), pointRadius: 7, pointHoverRadius: 9, backgroundColor: pts.map(p => ({HH: C.blue, HL: C.teal, LH: C.amber, LL: C.plum})[K.quadrant(p.occ, p.rent_yoy, thNow())])}]},
          options: {responsive: true, maintainAspectRatio: false, animation: false, layout: {padding: {right: 70, top: 10}}, plugins: {legend: {display: false}, kcQuad: {x: st.mOcc * 100, y: st.mRent * 100}, kcMarkers: {}, kcMissing: {},
            tooltip: {backgroundColor: '#1D2678', callbacks: {title: x => x[0].raw.name, label: c => `Lấp đầy ${nf(c.raw.x, 1)}% · giá ${c.raw.y > 0 ? '+' : ''}${nf(c.raw.y, 1)}%`, afterLabel: afterLines}}},
            scales: {x: {min: Math.min(50, Math.floor(Math.min(...xs) / 5) * 5 - 5), max: Math.max(100, Math.ceil(Math.max(...xs) / 5) * 5), title: {display: true, text: 'Lấp đầy %', color: '#5a6682'}, grid: {color: '#EEF0F6'}, ticks: {color: '#475069'}},
              y: {min: Math.min(-10, Math.floor(Math.min(...ys)) - 2), max: Math.max(10, Math.ceil(Math.max(...ys)) + 2), title: {display: true, text: 'Giá chào thuê so cùng kỳ %', color: '#5a6682'}, grid: {color: '#EEF0F6'}, ticks: {color: '#475069'}}}}}); }});
  }
  function compareCard() {
    const rows = provRows(), names = rows.map(r => r.n);
    if (!st.cmp || !names.includes(st.cmp[0])) st.cmp = [names[0], names[1] || names[0]];
    const sel = (i) => `<select data-kc-cmp="${i}">${names.map(n => `<option ${st.cmp[i] === n ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>`;
    const a = rows.find(r => r.n === st.cmp[0]), b = rows.find(r => r.n === st.cmp[1]);
    const line = (lab, f) => `<tr><th>${lab}</th><td>${f(a)}</td><td>${f(b)}</td></tr>`;
    const warn = [];
    const per = x => [x.occ, x.usd, x.vnd, x.yy].filter(Boolean).map(p => p.period);
    if (a && b && (a.pre !== b.pre)) warn.push('Hai tỉnh thuộc hai phiên bản địa giới khác nhau (trước/sau sáp nhập).');
    if (a && b && JSON.stringify([...new Set(per(a))]) !== JSON.stringify([...new Set(per(b))])) warn.push('Các chỉ tiêu của hai tỉnh khác kỳ công bố.');
    if (a && b && a.region !== b.region) warn.push('Hai tỉnh ở hai vùng: số liệu từ hai bản khảo sát C&W khác nhau.');
    const body = a && b ? `<div class="kc-ctl">${sel(0)} <span>so với</span> ${sel(1)}</div><div class="tablewrap" data-no-fold><table class="kc-t kc-cmp" data-no-fold><thead><tr><th></th><th>${esc(a.n)}</th><th>${esc(b.n)}</th></tr></thead><tbody>` +
      line('Lấp đầy', x => (x.occ ? `${pf(x.occ.occ, 1, false)} <span class="kc-na">${QL(x.occ.period)}</span>` : '—')) +
      line('Giá chào thuê', x => [x.usd ? `${nf(x.usd.ask_usd, 1)} USD <span class="kc-na">${QL(x.usd.period)}</span>` : '', x.vnd ? `${nf(x.vnd.ask_vnd / 1e6, 2)} triệu đ <span class="kc-na">${QL(x.vnd.period)}</span>` : ''].filter(Boolean).join('<br>') || '—') +
      line('Giá so cùng kỳ', x => (x.yy ? pf(x.yy.rent_yoy) : '—')) +
      line('Đất trống', () => '<span class="kc-na">Chưa có số cấp tỉnh</span>') +
      line('Cung dự kiến 2026–28', x => (x.pa ? `${nf(x.pa.implied_ha)} ha (${pf(x.pa.share, 0, false)} của vùng)` : '—')) +
      line('Áp lực cạnh tranh', x => (x.sig ? K.QUAD_TEXT[x.sig] + (x.pa && x.pa.share >= K.TH.r5_share ? '; nhận nhiều cung mới' : '') : 'Không đủ dữ liệu')) +
      `</tbody></table></div>${warn.length ? `<p class="kc-warnline">⚠ ${esc(warn.join(' '))} Không kết luận tỉnh nào tốt hơn.</p>` : ''}` : '<p class="kc-gap">Chưa đủ tỉnh để so.</p>';
    return card({id: 'kcn-re-compare', title: 'So sánh hai địa phương', sub: 'mỗi số ghi kèm kỳ', wide: true, kind: 'derived', srcs: D.province.map(p => p.src), body});
  }

  /* ===================== 5. Quỹ đất & doanh nghiệp ===================== */
  const coOn = t => st.co === 'all' || st.co === t;
  const provOn = p => st.prov === 'all' || PROV_NORM(p) === st.prov;
  const PREC = {EXACT: ['', 'Số chính xác'], APPROX: ['~', 'Xấp xỉ'], LOWER_BOUND: ['>', 'Cận dưới'], SUM_OF_PROJECTS: ['', 'Cộng gross các dự án'], PROJECT: ['', 'Một dự án'], NONE: ['', 'Không có tổng đồng nhất']};
  function renderLandbank(box) {
    const L = D.landbank, lease = D.lease.filter(l => l.ticker === 'IDC'), mom = K.leaseMomentum(D, 'IDC');
    const plan = D.dev.find(d => d.ticker === 'IDC' && d.cls === 'COMPANY_PLAN' && d.metric === 'Land_leased_total');
    const bcm = L.filter(x => x.ticker === 'BCM' && fin(x.commercial_ha));
    box.append(el('div', '', kpis([
      {label: 'Doanh nghiệp trong workbook', value: `${D.company.length} mã`, sub: `${L.length} dòng dự án/giai đoạn · SIP chưa xác minh`},
      lease.length && {label: `IDC ký mới đất KCN ${lease[lease.length - 1].year}`, value: `${nf(lease[lease.length - 1].value_ha)} ha`, delta: mom.ok ? `${pf(mom.changes[mom.changes.length - 1].value)} so ${lease[lease.length - 2].year}` : '', dcls: 'dn', sub: `${chip('ACTUAL')} BCTN 2025 hợp nhất`},
      plan && {label: 'IDC kế hoạch ký mới 2026', value: `${nf(plan.value)} ha`, sub: `${chip('PLAN')} không phải số thực hiện`},
      bcm.length && {label: `BCM · ${bcm.length} KCN đang cho thuê`, value: `${nf(bcm.reduce((s, x) => s + x.unleased_est_ha, 0), 1)} ha`, sub: `chưa lấp đầy ước tính trên ${nf(bcm.reduce((s, x) => s + x.commercial_ha, 0))} ha thương phẩm ${chip('ESTIMATE')}`},
      {label: 'Đất sạch sẵn sàng bàn giao', value: 'Chưa công bố', sub: 'BCTN 2025 không ghi số kèm ngày đo; không suy từ quỹ đất'}
    ])));
    box.append(section('A', 'Quy mô quỹ đất theo đúng loại diện tích', 'Mỗi doanh nghiệp công bố một loại diện tích khác nhau: không xếp hạng chung, không cộng ngang.'));
    const rows = D.company.filter(c => coOn(c.ticker)).map(c => {
      const pr = L.filter(x => x.ticker === c.ticker), own = pr.filter(x => x.qa !== 'OVERLAPS_SZC'), ov = pr.filter(x => x.qa === 'OVERLAPS_SZC'), withC = own.filter(x => fin(x.commercial_ha)), withU = own.filter(x => fin(x.unleased_est_ha));
      const p = PREC[c.precision] || ['', c.precision];
      const vgc7 = c.ticker === 'VGC' && D.dev.find(d => d.ticker === 'VGC' && d.metric === 'Industrial_park_landbank');
      return `<tr><td><b>${esc(c.ticker)}</b><br><span class="kc-na">${esc(c.company)}</span></td><td class="kc-num">${fin(c.value_ha) ? p[0] + nf(c.value_ha, c.value_ha % 1 ? 2 : 0) + ' ha' : '<span class="kc-na">—</span>'}<br><span class="kc-chip kc-nt">${esc(p[1])}</span></td><td>${esc(c.kind || c.value_text || '')}${vgc7 ? `<br><span class="kc-na">ĐHCĐ 2026: >${nf(vgc7.value)} ha, 19 KCN (khác kỳ, cũng là cận dưới)</span>` : ''}</td>` +
        `<td class="kc-num">${withC.length ? nf(withC.reduce((s, x) => s + x.commercial_ha, 0), 1) + ` ha<br><span class="kc-na">${withC.length}/${own.length} dự án có số</span>` : '<span class="kc-na">—</span>'}${ov.length ? `<br><span class="kc-na">+ ${nf(ov[0].commercial_ha, 2)} ha thuê lại trong KCN Châu Đức (SZC), không cộng</span>` : ''}</td>` +
        `<td class="kc-num">${withU.length ? nf(withU.reduce((s, x) => s + x.unleased_est_ha, 0), 1) + ` ha<br><span class="kc-na">${withU.length} dự án · ước tính</span>` : '<span class="kc-na">—</span>'}</td><td class="kc-na">Chưa công bố</td><td class="kc-num">${fin(c.n_parks) ? nf(c.n_parks) : '—'} KCN · ${pr.length} dòng</td><td>${esc(c.compare_note || '')}</td><td>${c.url ? `<a href="${esc(c.url)}" target="_blank" rel="noopener">BCTN ↗</a>` : ''}</td></tr>`;
    });
    const sip = D.coverage.find(c => c.ticker === 'SIP');
    if (sip && coOn('SIP')) rows.push(`<tr class="kc-dim"><td><b>SIP</b></td><td class="kc-na" colspan="6">${esc(sip.reason)}</td><td>${esc(sip.upgrade || '')}</td><td></td></tr>`);
    box.append(card({id: 'kcn-lb-company', title: 'Quỹ đất KCN của doanh nghiệp niêm yết — BCTN 2025', sub: 'ha · cột thương phẩm và chưa lấp đầy chỉ cộng các dự án có số, ghi rõ độ phủ', wide: true, kind: 'document', cadence: 'annual', qa: ['FULL_LANDBANK_VS_READY'], srcs: ['VGC'],
      body: `<div class="tablewrap" data-no-fold><table class="kc-t" data-no-fold><thead><tr><th>Mã</th><th>Quy mô công bố</th><th>Loại diện tích</th><th>Σ thương phẩm</th><th>Σ chưa lấp đầy ước tính</th><th>Sẵn sàng cho thuê</th><th>Số dự án</th><th>Lưu ý so sánh</th><th>Nguồn</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`,
      table: () => ({head: ['Mã', 'Quy mô công bố (ha)', 'Độ chính xác', 'Loại diện tích', 'Số KCN', 'Phạm vi', 'Lưu ý so sánh', 'URL'], rows: D.company.map(c => [c.ticker, c.value_ha, c.precision, c.kind || c.value_text, c.n_parks, c.scope, c.compare_note, c.url])})}));

    const g = el('div', 'kc-grid');
    const un = L.filter(x => fin(x.unleased_est_ha) && x.unleased_est_ha > 0 && coOn(x.ticker) && provOn(x.province)).sort((a, b) => b.unleased_est_ha - a.unleased_est_ha);
    g.append(card({id: 'kcn-lb-unleased', title: 'Đất thương phẩm chưa lấp đầy — theo dự án', sub: 'ha · ước tính = thương phẩm − đã thuê lũy kế, hoặc thương phẩm × (1 − lấp đầy) · không phải đất sạch', srcs: [], kind: 'derived', cadence: 'annual', height: Math.max(260, un.length * 26 + 60),
      legend: Object.entries(TKC).filter(([t]) => un.some(x => x.ticker === t)).map(([t, c]) => `<span><i style="background:${c}"></i>${t}</span>`).join('') + '<span><i class="kc-hatch"></i>Ước tính</span>',
      take: un.some(x => x.qa === 'OVERLAPS_SZC') ? 'D2D tại Châu Đức là đất thuê lại trong KCN của SZC: thuộc quỹ đất D2D nhưng không cộng thêm vào cung toàn ngành.' : '',
      table: () => ({head: ['Mã', 'Dự án', 'Tỉnh', 'Thương phẩm (ha)', 'Đã thuê lũy kế (ha)', 'Lấp đầy', 'Chưa lấp đầy ước tính (ha)', 'Cách tính', 'QA'], rows: un.map(x => [x.ticker, x.project, x.province, x.commercial_ha, x.leased_ha, x.occ, x.unleased_est_ha, x.unleased_method === 'commercial_minus_leased' ? 'Thương phẩm − đã thuê' : 'Thương phẩm × (1 − lấp đầy)', x.qa])}),
      draw: h => { draw(h, combo({labels: un.map(x => `${x.ticker} · ${x.project}${x.qa === 'OVERLAPS_SZC' ? ' (thuê lại)' : ''}`), horizontal: true, sets: [{label: 'Chưa lấp đầy ước tính', type: 'bar', color: C.blue, data: un.map(x => x.unleased_est_ha), est: un.map(() => true), meta: un.map(x => ({period: '2025', cls: 'ESTIMATE', extra: [x.unleased_method === 'commercial_minus_leased' ? `= ${nf(x.commercial_ha, 2)} − ${nf(x.leased_ha, 2)} ha` : `= ${nf(x.commercial_ha, 2)} × (1 − ${pf(x.occ, 1, false)})`, x.page || '']}))}], y: {unit: 'ha', fmt: v => nf(v, 1)}, labelsCfg: {show: true, fmt: v => nf(v, 1)}})); recolor(h, un.map(x => hatch(TKC[x.ticker] || C.grey))); }}));
    // Cơ cấu từng dự án: chỉ phần có định nghĩa cùng kỳ, cùng phạm vi.
    const comp = L.filter(x => coOn(x.ticker) && provOn(x.province) && (fin(x.commercial_ha) || (fin(x.gross_ha) && x.stage === 'pipeline'))).map(x => {
      const leased = fin(x.leased_ha) ? x.leased_ha : fin(x.commercial_ha) && fin(x.occ) ? x.commercial_ha * x.occ : null;
      const unl = fin(x.unleased_est_ha) ? x.unleased_est_ha : null;
      const planned = x.stage === 'pipeline' && fin(x.commercial_ha) && leased == null ? x.commercial_ha : null;
      const non = fin(x.gross_ha) && fin(x.commercial_ha) && x.qa !== 'OVERLAPS_SZC' ? x.gross_ha - x.commercial_ha : null;
      return {x, leased, unl, planned, non};
    }).filter(r => [r.leased, r.unl, r.planned, r.non].some(fin));
    const full = L.filter(x => x.stage === 'full' && !fin(x.commercial_ha) && coOn(x.ticker) && provOn(x.province));
    const gap = L.filter(x => coOn(x.ticker) && provOn(x.province) && !comp.some(r => r.x === x) && !full.includes(x));
    g.append(card({id: 'kcn-lb-comp', title: 'Cơ cấu diện tích từng dự án', sub: 'ha · đã cho thuê / thương phẩm chưa lấp đầy / thương phẩm quy hoạch / phi thương phẩm (gross − thương phẩm)', srcs: [], kind: 'derived', cadence: 'annual', height: Math.max(280, comp.length * 24 + 70),
      legend: `<span><i style="background:${C.navy}"></i>Đã cho thuê</span><span><i style="background:${C.teal}"></i>Thương phẩm chưa lấp đầy (ước tính)</span><span><i style="background:#B3BDE8"></i>Thương phẩm quy hoạch (đang đầu tư)</span><span><i style="background:#E3E7F0"></i>Phi thương phẩm</span>`,
      take: `${full.length ? `Đã lấp đầy 100%, chưa có số thương phẩm: ${esc(full.map(x => x.ticker + ' ' + x.project).join(', '))}. ` : ''}${gap.length ? `Không vẽ vì chỉ có gross + lấp đầy (không suy đất trống từ gross): ${esc(gap.map(x => x.ticker + ' ' + x.project).join(', '))}.` : ''}`,
      table: () => ({head: ['Mã', 'Dự án', 'Gross (ha)', 'Thương phẩm (ha)', 'Đã thuê (ha)', 'Chưa lấp đầy ước tính (ha)', 'Thương phẩm quy hoạch (ha)', 'Phi thương phẩm (ha)', 'Trạng thái'], rows: comp.map(r => [r.x.ticker, r.x.project, r.x.gross_ha, r.x.commercial_ha, r.leased == null ? null : Math.round(r.leased * 10) / 10, r.unl, r.planned, r.non == null ? null : Math.round(r.non * 10) / 10, r.x.status])}),
      draw: h => draw(h, combo({labels: comp.map(r => `${r.x.ticker} · ${r.x.project}`), horizontal: true, stacked: true, sets: [
        {label: 'Đã cho thuê', type: 'bar', stack: 's', color: C.navy, data: comp.map(r => r.leased), est: comp.map(r => !fin(r.x.leased_ha)), meta: comp.map(r => ({cls: fin(r.x.leased_ha) ? 'ACTUAL' : 'ESTIMATE', extra: [fin(r.x.leased_ha) ? 'Đã thuê lũy kế theo BCTN' : '= thương phẩm × lấp đầy', r.x.page || '']}))},
        {label: 'Thương phẩm chưa lấp đầy', type: 'bar', stack: 's', color: C.teal, data: comp.map(r => r.unl), est: comp.map(() => true), meta: comp.map(() => ({cls: 'ESTIMATE'}))},
        {label: 'Thương phẩm quy hoạch', type: 'bar', stack: 's', color: '#B3BDE8', data: comp.map(r => r.planned), meta: comp.map(r => ({cls: 'PLAN', extra: [r.x.status || '']}))},
        {label: 'Phi thương phẩm', type: 'bar', stack: 's', color: '#E3E7F0', data: comp.map(r => r.non), meta: comp.map(() => ({cls: 'DERIVED', extra: ['= gross − thương phẩm (đường, cây xanh, hạ tầng…)']}))}], y: {unit: 'ha'}}))}));
    box.append(g);

    box.append(section('B', 'Tra cứu dự án', 'Lọc theo doanh nghiệp, tỉnh, tình trạng; bấm tiêu đề cột để sắp xếp. Dự án mẹ và giai đoạn con không cộng trùng.'));
    box.append(explorerProjects());

    box.append(section('C', 'Lịch sử cho thuê thực tế', 'Chỉ vẽ doanh nghiệp có đủ 3 năm số thực hiện liên tục, cùng định nghĩa. Không ghép kế hoạch hay dự phóng của CTCK.'));
    const g3 = el('div', 'kc-grid');
    if (coOn('IDC')) g3.append(card({id: 'kcn-lb-idc', title: 'IDC — diện tích đất KCN cho thuê mới', sub: 'ha/năm · hợp nhất · BCTN 2025 (biểu đồ 2021–2025)', srcs: ['IDICO'], cadence: 'annual', kind: 'document', qa: ['PLAN_NOT_ACTUAL'],
      take: `2024 = 101 ha làm tròn từ 100,6 ha (BCTN 2024). 2025 = ${nf(lease[2] && lease[2].value_ha)} ha gồm 57 ha công ty mẹ + 19 ha công ty con. ${plan ? `Kế hoạch 2026 ${nf(plan.value)} ha không vẽ vì chưa phải số thực hiện.` : ''}`,
      table: () => ({head: ['Năm', 'Cho thuê mới (ha)', 'So năm trước', 'Loại số', 'Ghi chú QA'], rows: lease.map((l, i) => [l.year, l.value_ha, i ? pf(l.value_ha / lease[i - 1].value_ha - 1) : null, l.type, l.qa])}),
      draw: h => draw(h, combo({labels: lease.map(l => String(l.year)), sets: [{label: 'Cho thuê mới', type: 'bar', color: C.blue, data: lease.map(l => l.value_ha), meta: lease.map(l => ({period: String(l.year), cls: 'ACTUAL', extra: [l.qa]}))}], y: {unit: 'ha'}, labelsCfg: {show: true, fmt: (v, i) => nf(v) + ' ha' + (i ? `  ${pf(v / lease[i - 1].value_ha - 1)}` : '')}}))}));
    const cov = D.coverage.filter(c => coOn(c.ticker));
    g3.append(card({id: 'kcn-lb-coverage', title: 'Độ phủ dữ liệu ký mới 2023–2025', sub: 'theo 20_COVERAGE_QA', kind: 'static', srcs: [],
      body: `<div class="tablewrap" data-no-fold><table class="kc-t" data-no-fold><thead><tr><th>Mã</th><th>Đủ 3 năm thực hiện</th><th>Trạng thái</th><th>Lý do</th></tr></thead><tbody>${cov.map(c => `<tr><td><b>${esc(c.ticker)}</b></td><td>${(c.lease3y || '').toUpperCase() === 'YES' ? 'Có' : 'Không'}</td><td>${(c.lease3y || '').toUpperCase() === 'YES' ? chip('ACTUAL', 'Đã kiểm chứng') : '<span class="kc-chip kc-nt">Thiếu chuỗi liên tục</span>'}</td><td>${esc(c.reason)}</td></tr>`).join('')}</tbody></table></div>`}));
    box.append(g3);

    box.append(section('D', 'Từ cầu thị trường đến kết quả doanh nghiệp', 'Ký mới, bàn giao, tiền nhận trước, doanh thu ghi nhận và tiền thu về xảy ra ở các thời điểm khác nhau; không đánh đồng.'));
    const cq = (window.COMPANY_QUARTERLY || {}), idcQ = (cq.companies || []).find(c => c.symbol === 'IDC'), qs = cq.quarters || [];
    const vn9 = D.absorption.find(a => a.period === '2026M9' && a.region === 'Vietnam');
    const idc25 = D.dev.filter(d => d.ticker === 'IDC' && d.period === '2025FY' && d.cls === 'ACTUAL');
    const kbcNew = L.filter(x => x.ticker === 'KBC' && /Ký mới 2025/.test(x.def_note || '')).map(x => `${x.project} ${(/Ký mới 2025 = ([\d.]+)/.exec(x.def_note) || [])[1]} ha`);
    const steps = [
      ['Hấp thụ thị trường', vn9 ? `CBRE Tier-1 9T/2026: ${nf(vn9.value)} ha` : '—', 'ok'],
      ['Ký mới của doanh nghiệp', [idc25.length ? `IDC 2025: ${idc25.map(d => d.metric === 'Land_leased_total' ? nf(d.value) + ' ha tổng' : d.metric === 'Land_leased_parent' ? nf(d.value) + ' ha mẹ' : d.metric === 'Land_leased_subsidiaries' ? nf(d.value) + ' ha con' : nf(d.value) + ' m² nhà xưởng/kho').join(', ')}` : '', kbcNew.length ? `KBC 2025: ${kbcNew.join(', ')}` : ''].filter(Boolean).join(' · '), 'ok'],
      ['Bàn giao đất', 'Chưa có trong bộ dữ liệu', 'gap'],
      ['Ghi nhận doanh thu', idcQ ? `IDC doanh thu thuần hợp nhất ${qs[qs.length - 1]}: ${nf(idcQ.revenue[idcQ.revenue.length - 1])} tỷ đ (gồm cả mảng ngoài KCN)` : 'Chưa có', idcQ ? 'ok' : 'gap'],
      ['Dòng tiền', 'Chưa có trong bộ dữ liệu (tiền nhận trước, tiền thu)', 'gap']
    ];
    const g4 = el('div', 'kc-grid');
    g4.append(card({id: 'kcn-lb-flow', title: 'Chuỗi chuyển hóa: thị trường → doanh nghiệp', sub: 'dữ liệu đang có ở từng khâu', wide: true, kind: 'static', srcs: ['VIETCAP26', 'IDICO'],
      body: `<div class="kc-flow">${steps.map((s, i) => `${i ? '<span class="kc-arr">→</span>' : ''}<div class="kc-node kc-node-${s[2]}"><b>${esc(s[0])}</b><small>${esc(s[1])}</small></div>`).join('')}</div>`}));
    if (idcQ && coOn('IDC')) {
      const n = Math.min(12, qs.length), Q = qs.slice(-n), rev = idcQ.revenue.slice(-n);
      g4.append(card({id: 'kcn-lb-idcrev', title: 'IDC — doanh thu thuần hợp nhất theo quý', sub: 'tỷ đ · BCTC quý · gồm KCN, điện, BOT, xây dựng; không phải doanh thu riêng mảng KCN', srcs: [], kind: 'periodic', cadence: 'quarterly',
        take: 'Doanh thu cho thuê đất thường ghi nhận một lần khi bàn giao, nên doanh thu quý dao động mạnh và không theo nhịp ký mới.',
        table: () => ({head: ['Quý', 'Doanh thu thuần (tỷ đ)'], rows: Q.map((q, i) => [q, rev[i]])}),
        draw: h => draw(h, combo({labels: Q, sets: [{label: 'Doanh thu thuần', type: 'bar', color: C.blue, data: rev, meta: Q.map(q => ({period: q, extra: ['BCTC hợp nhất quý (COMPANY_QUARTERLY)']}))}], y: {unit: 'tỷ đ'}}))}));
    }
    box.append(g4);
    const fired = K.rules(D, thNow()).fired.filter(f => f.tab === 'landbank' && coOn(f.scope));
    if (fired.length) box.append(el('div', 'kc-insgrid', fired.map(insightCard).join('')));
  }
  function explorerProjects() {
    const f = st.lb || (st.lb = {q: '', status: 'all', sort: 'gross_ha', dir: -1});
    const L = D.landbank.filter(x => coOn(x.ticker) && provOn(x.province) && (f.status === 'all' || x.stage === f.status) && (!f.q || (x.project + ' ' + x.ticker + ' ' + x.province).toLowerCase().includes(f.q.toLowerCase())))
      .sort((a, b) => { const va = a[f.sort], vb = b[f.sort]; if (va == null && vb == null) return 0; if (va == null) return 1; if (vb == null) return -1; return (typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb), 'vi')) * f.dir; });
    const QA = {OVERLAPS_SZC: 'Chồng lấn SZC', PHASE_ONLY: 'Một giai đoạn', GROUPED_IP: 'Gộp 2 KCN', PIPELINE: 'Đang đầu tư', DEFINITION_CHECK: 'Cần kiểm định nghĩa', '2025_LEASE_FACT': 'Có số ký mới 2025'};
    const cols = [['ticker', 'Mã'], ['project', 'Dự án'], ['province', 'Tỉnh'], ['gross_ha', 'Gross (ha)'], ['commercial_ha', 'Thương phẩm (ha)'], ['leased_ha', 'Đã thuê lũy kế (ha)'], ['occ', 'Lấp đầy'], ['unleased_est_ha', 'Chưa lấp đầy ƯT (ha)'], ['ready_ha', 'Sẵn sàng (ha)'], ['status', 'Tình trạng'], ['url', 'Nguồn']];
    const body = `<div class="kc-ctl"><input type="search" placeholder="Tìm dự án, mã, tỉnh…" value="${esc(f.q)}" data-kc-lbq aria-label="Tìm dự án"><select data-kc-lbs aria-label="Tình trạng">${[['all', 'Mọi tình trạng'], ['operating', 'Đang khai thác'], ['full', 'Đã lấp đầy'], ['pipeline', 'Đang đầu tư / pháp lý']].map(([k, t]) => `<option value="${k}" ${f.status === k ? 'selected' : ''}>${t}</option>`).join('')}</select><span class="kc-na">${L.length} dòng</span></div>` +
      `<div class="tablewrap kc-scroll" data-no-fold><table class="kc-t kc-sort kc-wide-t" data-no-fold><thead><tr>${cols.map(([k, t]) => `<th><button type="button" data-kc-sortby="${k}">${t}${f.sort === k ? (f.dir < 0 ? ' ▾' : ' ▴') : ''}</button></th>`).join('')}</tr></thead><tbody>` +
      L.map(x => `<tr><td><b>${esc(x.ticker)}</b></td><td>${esc(x.project)}${x.qa && QA[x.qa] ? ` <span class="kc-chip kc-${x.qa === 'OVERLAPS_SZC' || x.qa === 'GROUPED_IP' || x.qa === 'DEFINITION_CHECK' ? 'est' : 'nt'}" title="${esc(x.def_note || '')}">${QA[x.qa]}</span>` : ''}</td><td>${esc(x.province)}</td><td class="kc-num">${nf(x.gross_ha, 2)}</td><td class="kc-num">${nf(x.commercial_ha, 2)}</td><td class="kc-num">${nf(x.leased_ha, 2)}</td><td class="kc-num">${x.occ == null ? '—' : pf(x.occ, 1, false)}</td><td class="kc-num">${nf(x.unleased_est_ha, 1)}</td><td class="kc-na">${x.ready_ha == null ? 'Chưa công bố' : nf(x.ready_ha, 1)}</td><td>${esc(x.status || '')}</td><td>${x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener" title="${esc(x.page || '')}">BCTN ↗</a>` : ''}</td></tr>`).join('') + '</tbody></table></div>';
    return card({id: 'kcn-lb-explorer', title: 'Danh mục dự án KCN — BCTN 2025', sub: 'ha · gross, thương phẩm, đã thuê là ba định nghĩa khác nhau', wide: true, kind: 'document', cadence: 'annual', srcs: [], qa: ['FULL_LANDBANK_VS_READY'], body,
      table: () => ({head: cols.map(c => c[1]).concat(['Quan hệ sở hữu', 'Ghi chú định nghĩa', 'Vị trí trong nguồn', 'QA']), rows: L.map(x => cols.map(([k]) => x[k]).concat([x.ownership, x.def_note, x.page, x.qa]))})});
  }

  /* ===================== 6. Dữ liệu & phương pháp ===================== */
  const SETS = () => ({
    facts: ['10 · Bảng fact dài (chuẩn hóa)', D.facts, ['period', 'region', 'geo', 'segment', 'metric', 'value', 'unit', 'coverage', 'quality', 'src', 'table', 'note']],
    market: ['01 · Thị trường theo quý', D.market, ['period', 'region', 'cohort', 'stock_ha', 'occ', 'abs_ha', 'ask_usd', 'ask_vnd', 'occupied_proxy', 'vacant_proxy', 'precision', 'src', 'note']],
    province: ['02 · Theo tỉnh', D.province, ['period', 'region', 'province_vi', 'geo', 'occ', 'ask_usd', 'ask_vnd', 'rent_yoy', 'abs_ref_ha', 'stock_ref_ha', 'src', 'note']],
    absorption: ['03 · Hấp thụ theo nguồn', D.absorption, ['period', 'region', 'reporter', 'coverage', 'ptype', 'value', 'obs', 'precision', 'src', 'note']],
    cbre: ['03B · CBRE 2026', D.cbre, ['period', 'region', 'value', 'status', 'coverage', 'src', 'note']],
    fdi: ['04 · FDI CBCT 2016–2025', D.fdi, ['year', 'new_n', 'new_usd', 'adj_n', 'adj_usd', 'ma_n', 'ma_usd', 'src', 'note']],
    fdi_snap: ['05 · FDI theo kỳ', D.fdi_snap, ['period', 'geo', 'sector', 'ctype', 'value', 'unit', 'agg', 'src', 'note']],
    rbf: ['06 · Nhà xưởng, nhà kho', D.rbf, ['period', 'region', 'segment', 'stock_sqm', 'occ', 'abs_sqm', 'ask_usd', 'ask_vnd', 'precision', 'cohort', 'src', 'note']],
    dev: ['07 · Chỉ tiêu doanh nghiệp', D.dev, ['ticker', 'period', 'cls', 'metric', 'value', 'unit', 'def', 'precision', 'src']],
    pipeline: ['08 · Dự án mới & pipeline', D.pipeline, ['period', 'region', 'province_vi', 'project', 'area_ha', 'stage', 'developer', 'caution', 'src']],
    pipe_area: ['09 · Cung dự kiến theo tỉnh', D.pipe_area, ['period', 'region', 'province_vi', 'share', 'regional_ha', 'implied_ha', 'cls', 'src', 'note']],
    landbank: ['17 · Quỹ đất cấp dự án', D.landbank, ['ticker', 'project', 'province', 'gross_ha', 'commercial_ha', 'leased_ha', 'occ', 'unleased_est_ha', 'unleased_method', 'ready_ha', 'status', 'qa', 'page', 'url']],
    company: ['18 · Quỹ đất cấp doanh nghiệp', D.company, ['ticker', 'period', 'value_ha', 'precision', 'kind', 'n_parks', 'scope', 'compare_note', 'url']],
    lease: ['19 · Ký mới 2023–2025', D.lease, ['ticker', 'year', 'value_ha', 'type', 'complete', 'def', 'qa', 'url']],
    coverage: ['20 · Độ phủ dữ liệu', D.coverage, ['ticker', 'source', 'n_parks', 'lease3y', 'reason', 'risk', 'upgrade']]
  });
  function classOf(r) { const s = [r.quality, r.obs, r.status, r.cls, r.precision, r.type].filter(Boolean).join(' ').toUpperCase(); return /FORECAST|PLAN/.test(s) ? 'forecast' : /DERIVED|ESTIMATE|PROXY|LOWER_BOUND/.test(s) ? 'derived' : 'actual'; }
  function renderData(box) {
    const ex = st.ex, sets = SETS(), [title, rowsAll, cols] = sets[ex.set] || sets.facts;
    const qaSrc = st.qaFilter ? st.qaFilter.split(',') : null;
    const qaIds = qaSrc ? new Set(D.qa.filter(q => qaSrc.includes(q.issue)).flatMap(q => (q.src || '').split(';').map(s => s.trim()))) : null;
    const rows = rowsAll.filter(r => {
      const per = r.period || null; // chuỗi năm (FDI 2016–2025, ký mới) không lọc theo khoảng quý
      if (per && !inRange(per)) return false;
      if (r.region && !regOn(r.region) && r.region !== 'Region') return false;
      if (st.src !== 'all' && (r.reporter || r.src) && !((st.src === 'cw' && /^CW|Cushman/.test(r.reporter || r.src)) || (st.src === 'cbre' && /CBRE|SSI|VIETCAP/.test((r.reporter || '') + (r.src || ''))))) return false;
      if (st.co !== 'all' && r.ticker && r.ticker !== st.co) return false;
      if (st.prov !== 'all' && (r.province_vi || r.province) && PROV_NORM(r.province_vi || r.province) !== st.prov) return false;
      if (ex.src !== 'all' && r.src !== ex.src) return false;
      if (ex.reg !== 'all' && r.region !== ex.reg) return false;
      if (ex.cls !== 'all' && classOf(r) !== ex.cls) return false;
      if (qaIds && r.src && !qaIds.has(r.src)) return false;
      if (ex.q && !JSON.stringify(r).toLowerCase().includes(ex.q.toLowerCase())) return false;
      return true;
    });
    const srcs = [...new Set(rowsAll.map(r => r.src).filter(Boolean))].sort();
    const show = rows.slice(0, 300);
    const cell = (k, v, r) => k === 'url' && v ? `<a href="${esc(v)}" target="_blank" rel="noopener">↗</a>` : k === 'src' && v ? srcA(v) : v == null ? '<span class="kc-na">—</span>' : typeof v === 'number' ? nf(v, Math.abs(v) < 2 && v % 1 ? 4 : v % 1 ? 2 : 0) : esc(v);
    const exBody = `<div class="kc-ctl"><select data-kc-ex="set" aria-label="Bảng dữ liệu">${Object.entries(sets).map(([k, v]) => `<option value="${k}" ${ex.set === k ? 'selected' : ''}>${esc(v[0])} (${v[1].length})</option>`).join('')}</select>` +
      `<select data-kc-ex="src" aria-label="Nguồn"><option value="all">Mọi nguồn</option>${srcs.map(s => `<option ${ex.src === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select>` +
      `<select data-kc-ex="reg" aria-label="Vùng">${[['all', 'Mọi vùng'], ['North', 'Bắc'], ['South', 'Nam'], ['Vietnam', 'Cả nước']].map(([k, t]) => `<option value="${k}" ${ex.reg === k ? 'selected' : ''}>${t}</option>`).join('')}</select>` +
      `<select data-kc-ex="cls" aria-label="Loại số">${[['all', 'Mọi loại số'], ['actual', 'Thực tế'], ['derived', 'Phái sinh / ước tính / proxy'], ['forecast', 'Dự phóng / kế hoạch']].map(([k, t]) => `<option value="${k}" ${ex.cls === k ? 'selected' : ''}>${t}</option>`).join('')}</select>` +
      `<input type="search" data-kc-ex="q" value="${esc(ex.q)}" placeholder="Tìm chỉ tiêu, ghi chú…" aria-label="Tìm"><button type="button" class="kc-tool" data-kc-excsv>Xuất CSV (${rows.length} dòng)</button>${qaSrc ? `<button type="button" class="kc-tool" data-kc-qaclear>Bỏ lọc cảnh báo: ${esc(qaSrc.join(', '))}</button>` : ''}</div>` +
      `<div class="tablewrap kc-scroll" data-no-fold><table class="kc-t kc-ex" data-no-fold><thead><tr>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${show.map(r => `<tr class="kc-cls-${classOf(r)}">${cols.map(c => `<td>${cell(c, r[c], r)}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${cols.length}">Không có dòng nào.</td></tr>`}</tbody></table></div>${rows.length > show.length ? `<p class="kc-na">Hiện 300/${rows.length} dòng; CSV xuất đủ.</p>` : ''}`;
    const exCard = card({id: 'kcn-da-explorer', title: 'Data Explorer', sub: `${esc(title)} · ${rows.length} dòng sau bộ lọc · màu dòng: trắng thực tế, vàng nhạt phái sinh/ước tính, tím nhạt dự phóng/kế hoạch`, wide: true, kind: 'static', srcs: [], body: exBody});
    exCard._csv = () => ({head: cols, rows: rows.map(r => cols.map(c => r[c]))});
    box.append(el('div', '', kpis([
      {label: 'Workbook', value: '23 sheet', sub: `dữ liệu đến ${esc((D.as_of || '').split('-').reverse().join('/'))} · build ${esc((D.built || '').split('-').reverse().join('/'))}`},
      {label: 'Kiểm tra khi build', value: `${D.checks.filter(c => c.ok).length}/${D.checks.length} đạt`, dcls: D.checks.every(c => c.ok) ? 'up' : 'dn'},
      {label: 'Fact dài trùng bảng chuyên đề', value: `${D.facts.length - D.dup.unmatched}/${D.facts.length}`, sub: 'chỉ dùng tra cứu, không cộng thêm'},
      {label: 'Nguồn', value: `${Object.keys(D.sources).length} nguồn`, sub: `${Object.values(D.sources).filter(s => s.cls === 'PRIMARY').length} sơ cấp`}
    ])));
    box.append(section('A', 'Tra cứu dữ liệu gốc', 'Mọi số trên các tab đều lấy từ các bảng này. Bộ lọc chung (vùng, nguồn, kỳ, tỉnh, doanh nghiệp) cũng áp vào đây.'));
    box.append(exCard);
    box.append(section('B', 'Theo dõi chất lượng dữ liệu', 'Cảnh báo từ 13_DATA_QA và 20_COVERAGE_QA; mỗi cảnh báo kèm quy tắc dashboard đang áp dụng.'));
    const sev = {HIGH: 'dn', MEDIUM: 'warn', LOW: 'nt'};
    box.append(card({id: 'kcn-da-qa', title: 'Cảnh báo dữ liệu đang áp dụng', sub: `${D.qa.length} cảnh báo · bấm "Xem dữ liệu" để lọc bảng theo nguồn liên quan`, wide: true, kind: 'static', srcs: [],
      body: `<div class="kc-qa">${D.qa.map(q => `<div class="kc-qai"><span class="kc-chip kc-${q.status === 'resolved' ? 'ok' : q.status === 'mitigated' ? 'der' : sev[q.severity] || 'nt'}">${q.status === 'resolved' ? 'ĐÃ XỬ LÝ' : q.status === 'mitigated' ? 'ĐÃ GIẢM NHẸ' : {HIGH: 'CAO', MEDIUM: 'TRUNG BÌNH', LOW: 'THẤP'}[q.severity] || esc(q.severity)}</span><b>${esc(ISSUE_TITLE[q.issue] || q.issue)}</b><span class="kc-na">${esc(q.period)} · ${esc(q.scope)}</span><p>${esc(q.status === 'resolved' ? q.resolution : issueText(q.issue) || q.evidence)}</p><details><summary>Chi tiết</summary><p><b>Bằng chứng:</b> ${esc(q.evidence)}</p><p><b>Quy tắc:</b> ${esc(q.rule)}</p><p>Nguồn: ${(q.src || '').split(';').map(s => srcA(s.trim())).join(', ')}</p></details><button type="button" class="kc-link" data-kc-qa="${esc(q.issue)}">Xem dữ liệu →</button></div>`).join('')}` +
        D.coverage.filter(c => (c.lease3y || '').toUpperCase() !== 'YES').map(c => `<div class="kc-qai"><span class="kc-chip kc-warn">ĐỘ PHỦ</span><b>${esc(c.ticker)}</b><span class="kc-na">2023–2025</span><p>${esc(c.reason)}</p><details><summary>Chi tiết</summary><p><b>Rủi ro:</b> ${esc(c.risk)}</p><p><b>Nâng cấp:</b> ${esc(c.upgrade)}</p></details></div>`).join('') + '</div>'}));
    box.append(card({id: 'kcn-da-checks', title: 'Kiểm tra tự động khi build và số trùng nguồn', sub: 'scripts/build_kcn_workbook.py · dừng không ghi file nếu một kiểm tra hỏng', wide: true, kind: 'static', srcs: [],
      body: `<ul class="kc-checks">${D.checks.map(c => `<li class="${c.ok ? 'ok' : 'bad'}">${c.ok ? '✓' : '✗'} <b>${esc(c.name)}</b> <span class="kc-na">${esc(c.detail)}</span></li>`).join('')}</ul>` +
        `<div class="tablewrap" data-no-fold><table class="kc-t" data-no-fold><thead><tr><th>Kỳ</th><th>Phạm vi</th><th>Bảng A</th><th>Bảng B</th><th>Quy tắc chọn</th></tr></thead><tbody>${D.conflicts.map(c => `<tr><td>${esc(PL(c.period))}</td><td>${esc(REG[c.region] || c.region)}</td><td>${esc(c.a.table)}: ${nf(c.a.value)} (${esc(c.a.obs)})</td><td>${esc(c.b.table)}: ${nf(c.b.value)} (${esc(c.b.obs)})</td><td>${esc(c.rule)}</td></tr>`).join('')}</tbody></table></div>`}));
    const SUP = (D.supplement || {}).rows || [];
    if (SUP.length) box.append(card({id: 'kcn-da-web', title: 'Số bổ sung từ nguồn web', sub: `${SUP.length} số tìm thêm ngày ${esc(((D.supplement || {}).checked || '').split('-').reverse().join('/'))} để lấp khoảng trống của workbook · mỗi số kèm đoạn trích nguyên văn (data/kcn/evidence.json)`, wide: true, kind: 'document', srcs: [...new Set(SUP.map(r => r.src))],
      body: `<div class="tablewrap kc-scroll" data-no-fold><table class="kc-t" data-no-fold><thead><tr><th>Bảng</th><th>Kỳ</th><th>Phạm vi</th><th>Số</th><th>Cách ghép</th><th>Trích dẫn</th><th>Nguồn</th></tr></thead><tbody>${SUP.map(r => `<tr><td>${esc(r.table)}</td><td>${esc(PL(r.key.period))}</td><td>${esc(REG[r.key.region] || r.key.region || r.key.province || '')}</td><td class="kc-num">${esc(Object.entries(r.set).filter(([k]) => /value|abs|occ|ask|stock|yoy/.test(k)).map(([, v]) => typeof v === 'number' ? nf(v, v % 1 ? 1 : 0) : v).join(' · '))}</td><td>${{add: 'Thêm quý mới', fill: 'Điền ô trống', replace: 'Thay số ước tính'}[r.mode] || r.mode}</td><td class="kc-na">“${esc(r.quote)}”</td><td>${srcA(r.src)}</td></tr>`).join('')}</tbody></table></div>`}));
    box.append(section('C', 'Quy tắc nhận định và ngưỡng', 'Mỗi nhận định trên dashboard sinh từ một quy tắc dưới đây; không đủ dữ liệu thì không xuất.'));
    const R = K.rules(D, thNow()), T = K.TH;
    const rulesT = [['R1', 'Phục hồi nhu cầu', `Hấp thụ so cùng kỳ ≥ ${pf(T.r1_yoy, 0)} (cùng nguồn, cùng phạm vi) hoặc rolling 4Q tăng 2 kỳ liền; YoY do nguồn công bố được dùng và ghi rõ`],
      ['R2', 'Lấp đầy giảm do cung tăng', `Cùng phạm vi, so cùng kỳ: nguồn cung ≥ ${pf(T.r2_stock, 0)}, lấp đầy ≤ ${ppf(T.r2_occ)}, có quan sát hấp thụ dương (CBRE chỉ xét hướng)`],
      ['R3', 'Áp lực giá', `Lấp đầy < ${pf(T.r3_occ, 0, false)} và giá chào thuê ≤ ${pf(T.r3_rent, 0)} so cùng kỳ, cùng bản khảo sát`],
      ['R4', 'Có thể có sức mạnh giá', `Lấp đầy ≥ ${pf(T.r4_occ, 0, false)} và giá chào thuê ≥ ${pf(T.r4_rent, 0)} so cùng kỳ`],
      ['R5', 'Rủi ro nguồn cung tương lai', `Cung dự kiến 3 năm ≥ ${pf(T.r5_ratio, 0, false)} nguồn cung hiện hữu (cùng C&W); hoặc tỉnh nhận ≥ ${pf(T.r5_share, 0, false)} cung mới của vùng và lấp đầy < ${pf(T.r3_occ, 0, false)}`],
      ['R6', 'Động lực ký mới doanh nghiệp', `Đủ 3 năm số thực hiện liên tục; đổi ≥ ${pf(T.r6_move, 0, false)}/năm cùng chiều 2 năm liền`],
      ['R7', 'Thiếu dữ liệu', 'Không xuất nhận định; liệt kê phép tính bị chặn và lý do']];
    box.append(card({id: 'kcn-da-rules', title: 'Bộ quy tắc (assets/kcn-insights.js)', sub: `${R.fired.length} nhận định đang kích hoạt · ${R.insufficient.length} phép tính bị chặn`, wide: true, kind: 'static', srcs: [],
      body: `<div class="tablewrap" data-no-fold><table class="kc-t" data-no-fold><thead><tr><th>Quy tắc</th><th>Tên</th><th>Điều kiện</th><th>Đang kích hoạt</th></tr></thead><tbody>${rulesT.map(([id, n, c]) => `<tr><td><b>${id}</b></td><td>${esc(n)}</td><td>${esc(c)}</td><td>${esc(R.fired.filter(f => f.id === id).map(f => f.scope).join(', ') || (id === 'R7' ? R.insufficient.length + ' mục' : '—'))}</td></tr>`).join('')}</tbody></table></div>` +
        `<details class="kc-fold" open><summary>Phép tính bị chặn vì thiếu dữ liệu (R7)</summary><ul>${R.insufficient.map(x => `<li><b>${esc(x.id)}</b> ${esc(x.text)}</li>`).join('')}</ul></details>`}));
    box.append(section('D', 'Định nghĩa, nguồn và cách cập nhật', ''));
    const g = el('div', 'kc-grid');
    g.append(card({id: 'kcn-da-dict', title: 'Từ điển chỉ tiêu', sub: '15_DATA_DICTIONARY', kind: 'static', srcs: [],
      body: `<div class="tablewrap" data-no-fold><table class="kc-t" data-no-fold><thead><tr><th>Trường</th><th>Ý nghĩa</th><th>Đơn vị</th><th>Lưu ý</th></tr></thead><tbody>${D.dictionary.map(d => `<tr><td><code>${esc(d.field)}</code></td><td>${esc(d.vi)}<br><span class="kc-na">${esc(d.def)}</span></td><td>${esc(d.unit)}</td><td>${esc(d.caution)}</td></tr>`).join('')}</tbody></table></div>`}));
    g.append(card({id: 'kcn-da-sources', title: 'Danh mục nguồn', sub: `11_SOURCES · ${Object.keys(D.sources).length} nguồn`, kind: 'static', srcs: [],
      body: `<div class="tablewrap kc-scroll" data-no-fold><table class="kc-t" data-no-fold><thead><tr><th>Source_ID</th><th>Nội dung</th><th>Loại</th><th>Kiểm</th></tr></thead><tbody>${Object.entries(D.sources).map(([id, s]) => `<tr><td>${srcA(id)}</td><td>${esc(s.what)}</td><td>${esc(s.cls)}${s.use === 'REFERENCE_ONLY' ? ' · tham khảo' : ''}</td><td>${esc((s.checked || '').split('-').reverse().join('/'))}</td></tr>`).join('')}</tbody></table></div>`}));
    box.append(g);
    box.append(card({id: 'kcn-da-update', title: 'Cập nhật khi có workbook mới', sub: '', wide: true, kind: 'static', srcs: [],
      body: `<ol class="kc-steps"><li>Chép workbook mới đè lên <code>${esc(D.workbook.file)}</code> (giữ tên sheet và tên cột).</li><li>Chạy <code>python scripts/build_kcn_workbook.py</code>: script đọc 23 sheet, kiểm ${D.checks.length} điều kiện (dòng dự án, mã doanh nghiệp, chuỗi IDC 3 năm, cận dưới VGC, cờ ước tính CBRE, proxy = cung × lấp đầy, fact dài trùng bảng chuyên đề…) rồi ghi <code>data/kcn-market.json</code> và <code>.js</code>. Một kiểm tra hỏng thì dừng, không ghi.</li><li>Chạy <code>node tests/kcn-insights.test.cjs</code> và <code>python -m pytest tests/test_kcn_workbook.py</code>.</li><li>Nhận định, KPI, cảnh báo tự tính lại từ số mới; quý mới đủ 4 quý liên tiếp cùng phạm vi thì rolling 4Q và số năm đủ cung tự hiện.</li><li>Chạy <code>scripts/prepare_release.py</code> để đổi <code>?v=</code>, mở PR.</li></ol><p class="kc-na">SHA-256 workbook đang dùng: <code>${esc(D.workbook.sha256.slice(0, 16))}…</code></p>`}));
  }

  /* ---------- Khung workspace ---------- */
  let root, nav, bar, panels = {}, moved = {}, rendered = {};
  function filterBar() {
    const ap = APPLY[st.tab] || [];
    const dis = k => (ap.includes(k) ? '' : 'disabled title="Không áp dụng ở tab này"');
    const opt = (k, arr) => arr.map(([v, t]) => `<option value="${esc(v)}" ${st[k] === v ? 'selected' : ''}>${esc(t)}</option>`).join('');
    bar.innerHTML = `<label>Vùng <select data-kc-f="r" ${dis('r')}>${opt('r', [['both', 'Bắc + Nam'], ['North', 'Bắc'], ['South', 'Nam']])}</select></label>` +
      `<label>Nguồn <select data-kc-f="src" ${dis('src')}>${opt('src', [['all', 'Tất cả'], ['cw', 'Cushman & Wakefield'], ['cbre', 'CBRE']])}</select></label>` +
      `<label>Từ <select data-kc-f="from" ${dis('from')}>${opt('from', QUARTERS.map(q => [q, QL(q)]))}</select></label><label>đến <select data-kc-f="to" ${dis('to')}>${opt('to', QUARTERS.map(q => [q, QL(q)]))}</select></label>` +
      `<label>Phân khúc <select data-kc-f="seg" ${dis('seg')}>${opt('seg', [['land', 'Đất KCN'], ['RBF', 'Nhà xưởng xây sẵn'], ['RBW', 'Nhà kho xây sẵn']])}</select></label>` +
      `<label>Tỉnh <select data-kc-f="prov" ${dis('prov')}>${opt('prov', [['all', 'Tất cả']].concat(PROVS.map(p => [p, p])))}</select></label>` +
      `<label>Doanh nghiệp <select data-kc-f="co" ${dis('co')}>${opt('co', [['all', 'Tất cả']].concat(COS.map(c => [c, c])))}</select></label>` +
      `<button type="button" class="kc-reset" data-kc-reset>Đặt lại</button>`;
  }
  function renderTab(key, force) {
    const p = panels[key]; if (!p) return;
    if (rendered[key] && !force) { refit(p); return; }
    const dyn = p.querySelector('.kc-dyn'); dyn.replaceChildren();
    try { ({overview: renderOverview, demand: renderDemand, supply: renderSupply, rent: renderRent, landbank: renderLandbank, data: renderData})[key](dyn); }
    catch (e) { dyn.append(el('p', 'kc-gap', 'Không dựng được phần này: ' + esc(e.message))); console.error(e); }
    rendered[key] = true;
    setTimeout(() => { paint(dyn); refit(p); if (window.FinShareImage) window.FinShareImage.scan(p); }, 0); // không dùng rAF: tab chạy nền sẽ không vẽ
  }
  function select(key, push) {
    st.tab = key;
    $$('.kc-tab', nav).forEach(b => { const on = b.dataset.kcTab === key; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    Object.entries(panels).forEach(([k, p]) => { p.hidden = k !== key; });
    filterBar(); renderTab(key); if (push !== false) writeUrl();
  }
  function rerender() { Object.keys(rendered).forEach(k => { rendered[k] = false; }); renderTab(st.tab, true); writeUrl(); }
  function build() {
    const pane = $('.majorpane[data-tab="mt13"]'); if (!pane) return;
    root = $('#kcn-workspace', pane) || pane.appendChild(el('div', '', '')); root.id = 'kcn-workspace'; root.className = 'kc-ws';
    nav = el('div', 'kc-nav'); nav.setAttribute('role', 'tablist'); nav.setAttribute('aria-label', 'Phân tích Khu công nghiệp');
    TABS.forEach(([k, t], i) => { const b = el('button', 'kc-tab', `<span>${String(i + 1).padStart(2, '0')}</span>${esc(t)}`); b.type = 'button'; b.dataset.kcTab = k; b.id = 'kc-tab-' + k; b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', 'kc-panel-' + k); nav.append(b); });
    bar = el('div', 'kc-filters'); bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'Bộ lọc chung');
    root.append(nav, bar);
    // Thanh sub-tab dính ngay dưới thanh tab lớn (cũng sticky, cao thay đổi theo bề rộng).
    const setTop = () => root.style.setProperty('--kc-top', (($('.majortabs') || {}).offsetHeight || 0) + 'px'); setTop(); addEventListener('resize', setTop);
    TABS.forEach(([k, t, q]) => {
      const p = el('section', 'kc-panel'); p.id = 'kc-panel-' + k; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', 'kc-tab-' + k); p.hidden = true;
      p.innerHTML = `<header class="kc-head"><div><span class="kc-eyebrow">Khu công nghiệp · ${esc(t)}</span><h3>${esc(q)}</h3></div><span class="kc-asof">Workbook ${esc((D.as_of || '').split('-').reverse().join('/'))} · ${esc(D.workbook.sheets.length)} sheet</span></header><div class="kc-dyn"></div>`;
      if (MOVE[k]) {
        const cards = MOVE[k].map(id => document.querySelector(`[data-block-id="${id}"]`)).filter(Boolean);
        if (cards.length) { const d = el('details', 'kc-fold kc-moved'); d.innerHTML = `<summary>${esc(MOVE_TITLE[k])}</summary>`; const gwrap = el('div', 'kc-grid'); cards.forEach(c => { c.classList.add('kc-old'); gwrap.append(c); }); d.append(gwrap); d.addEventListener('toggle', () => d.open && refit(d)); p.append(d); moved[k] = cards; }
      }
      panels[k] = p; root.append(p);
    });
    // Dọn các khung rỗng còn lại ở pane KCN của Bức tranh ngành (thẻ đã dời sang workspace).
    const ip = $('#supply-vietnam');
    if (ip) $$('.grid.two, .research-grid', ip).forEach(gr => { if (!gr.querySelector('.card')) gr.remove(); });
    nav.addEventListener('click', e => { const b = e.target.closest('.kc-tab'); if (b) select(b.dataset.kcTab); });
    nav.addEventListener('keydown', e => { if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return; const i = TABS.findIndex(t => t[0] === st.tab), j = (i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length; select(TABS[j][0]); nav.children[j].focus(); });
    bar.addEventListener('change', e => { const s = e.target.closest('[data-kc-f]'); if (!s) return; st[s.dataset.kcF] = s.value; if (K.qk(st.from) > K.qk(st.to)) [st.from, st.to] = [st.to, st.from]; filterBar(); rerender(); });
    bar.addEventListener('click', e => { if (e.target.closest('[data-kc-reset]')) { Object.assign(st, {r: 'both', src: 'all', from: QUARTERS[0], to: QUARTERS[QUARTERS.length - 1], seg: 'land', prov: 'all', co: 'all'}); filterBar(); rerender(); } });
    root.addEventListener('click', e => {
      const sd = e.target.closest('[data-kc-side]'); if (sd) { st.side = sd.dataset.kcSide; rerender(); return; }
      const un = e.target.closest('[data-kc-unit]'); if (un) { st.unit = un.dataset.kcUnit; rerender(); return; }
      const sb = e.target.closest('[data-kc-sortby]'); if (sb) { const k = sb.dataset.kcSortby; st.lb.dir = st.lb.sort === k ? -st.lb.dir : -1; st.lb.sort = k; rerender(); return; }
      if (e.target.closest('[data-kc-excsv]')) { const c = e.target.closest('.kc-card'); if (c && c._csv) download(`kcn-${st.ex.set}.csv`, csvOf(c._csv())); return; }
      if (e.target.closest('[data-kc-qaclear]')) { st.qaFilter = null; rerender(); return; }
    });
    root.addEventListener('change', e => {
      const ex = e.target.closest('[data-kc-ex]'); if (ex && ex.tagName === 'SELECT') { st.ex[ex.dataset.kcEx] = ex.value; if (ex.dataset.kcEx === 'set') st.ex.src = 'all'; rerender(); return; }
      const cm = e.target.closest('[data-kc-cmp]'); if (cm) { st.cmp[+cm.dataset.kcCmp] = cm.value; rerender(); return; }
      const ls = e.target.closest('[data-kc-lbs]'); if (ls) { st.lb.status = ls.value; rerender(); return; }
    });
    let tq;
    root.addEventListener('input', e => {
      const th = e.target.closest('[data-kc-th]'); if (th) { st[th.dataset.kcTh] = +th.value / 100; th.nextElementSibling.textContent = th.dataset.kcTh === 'mOcc' ? nf(+th.value, 0) + '%' : pf(+th.value / 100, 1); clearTimeout(tq); tq = setTimeout(rerender, 180); return; }
      const q = e.target.closest('[data-kc-ex="q"],[data-kc-lbq]'); if (q) { clearTimeout(tq); tq = setTimeout(() => { if (q.dataset.kcLbq != null) st.lb.q = q.value; else st.ex.q = q.value; const pos = q.selectionStart; rerender(); const n = $(q.dataset.kcLbq != null ? '[data-kc-lbq]' : '[data-kc-ex="q"]', root); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (err) { /* type=search */ } } }, 250); }
    });
    // Theo dõi pane được bật/tắt bởi router của research-layout.js.
    new MutationObserver(() => { if (!pane.hidden) { renderTab(st.tab); refit(panels[st.tab]); } }).observe(pane, {attributes: true, attributeFilter: ['hidden', 'class']});
    readUrl(); select(st.tab, false);
  }
  // Link "Mở phân tích KCN" ở xem trước, nút "Xem chart →" trong nhận định, nút cảnh báo → Dữ liệu.
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-kcn-go]'); if (!a) return;
    e.preventDefault();
    if (a.dataset.kcQa) { st.qaFilter = a.dataset.kcQa; st.ex.set = 'facts'; rendered.data = false; if (popo) popo.hidden = true; }
    const btn = document.getElementById('research-tab-mt13'); if (btn && btn.getAttribute('aria-selected') !== 'true') btn.click(); else if (window.showMajorTab) window.showMajorTab('mt13');
    select(a.dataset.kcnGo); setTimeout(() => root && root.scrollIntoView({block: 'start'}), 30);
  });

  function start() {
    if (!D || !K) { $$('[data-kcn-preview]').forEach(n => { n.innerHTML = '<p class="kc-gap">Không tải được dữ liệu KCN.</p>'; }); return; }
    fillPreviews(); build();
  }
  if (document.readyState === 'complete') setTimeout(start, 700); else addEventListener('load', () => setTimeout(start, 700));
})();
