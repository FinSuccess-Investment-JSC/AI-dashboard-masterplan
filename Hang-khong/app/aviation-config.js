/* Hàng không · cấu hình dashboard (26/11/2026). Dữ liệu: window.AVIATION_DATA (scripts/build_aviation_data.py: chuỗi tháng NSO,
   tỷ giá trung tâm NHNN, jet fuel EIA, số nhập tay có nguồn ở data/aviation/observations.json, airports.json) và window.AVIATION_FIN
   (scripts/build_aviation_financials.py: BCTC hợp nhất quý VNDirect). Bộ dựng chart: app/pkg-dashboard.js; bản đồ: app/aviation-map.js.
   Ba phép đo khác nhau, không cộng lẫn: khách VẬN CHUYỂN (theo hãng), lượt khách QUA CẢNG (mỗi chuyến tính ở cả cảng đi và cảng đến),
   khách quốc tế NHẬP CẢNH (NSO, mọi phương tiện). */
(() => {
const C = {navy: '#2938A8', teal: '#59C5C8', plum: '#861C52', gold: '#c29100', grey: '#6b7686', red: '#d1583f', green: '#27af95', sky: '#8997D6'};
const W = window.AVIATION_DATA || {}, F = window.AVIATION_FIN || {};
const obs = (m, f = {}) => (W.obs || []).filter(o => o.metric_id === m && Object.entries(f).every(([k, v]) => o[k] === v));
const last = (m, sg) => obs(m, {segment: sg}).sort((a, b) => a.period_end < b.period_end ? -1 : a.period_end > b.period_end ? 1 : (a.period_start < b.period_start ? 1 : -1)).at(-1);
const nf = (v, d = 1) => Number.isFinite(v) ? v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}) : '—';
const sg = (v, d = 1) => Number.isFinite(v) ? (v > 0 ? '+' : '') + nf(v, d) : '—';
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const SHS = ['SHS – Ngành hàng không Việt Nam: Đón kỷ nguyên mới (11/2025)', 'https://www.shs.com.vn/bao-cao-phan-tich/nganh-hang-khong-viet-nam-don-ky-nguyen-moi'];
const CAA10 = ['Cục Hàng không – 10 tháng 2026 (27/10/2026)', 'https://caa.gov.vn/hoat-dong-nganh/hang-khong-viet-nam-tiep-tuc-duy-tri-da-tang-truong-trong-10-thang-cua-nam-2026-20261027153831131.htm'];
const LT = ['Báo Chính phủ – họp về Long Thành (25/11/2026)', 'https://baochinhphu.vn/thao-go-vuong-mac-du-an-san-bay-long-thanh-bao-dam-tuyet-doi-an-toan-khi-dua-vao-khai-thac-102261125161921495.htm'];
const NSO = ['Cục Thống kê (NSO)', 'https://www.nso.gov.vn/'];
const VJC9 = ['Vietjet IR – 9T/2026', 'https://ir.vietjetair.com/Home/ViewPost/Vietjet-reports-41-revenue-growth-in-first-9-months-of-2026-expands-international-connectivity-and-invests-in-technology-and-fleet-development'];
const HVN9 = ['Việt Nam News – Vietnam Airlines 9T/2026', 'https://vietnamnews.vn/economy/1803492/vietnam-airlines-posts-consolidated-revenue-of-over-vnd114-trillion-in-nine-months.html'];
const ACV9 = ['VietnamPlus – ACV 9T/2026 (13/10/2026)', 'https://www.vietnamplus.vn/ong-lon-quan-ly-khai-thac-22-cang-hang-khong-dat-loi-nhuan-tang-cao-post1141739.vnp'];
const IATA = ['IATA Fuel Price Monitor', 'https://www.iata.org/en/publications/economics/fuel-monitor/'];
const VND = ['BCTC quý (VNDirect finfo)', 'https://api-finfo.vndirect.com.vn/v4/financial_statements'];
const EX = W.extra || {};

// SCS doanh thu trên tấn: doanh thu thuần quý (VNDirect, tỷ đồng) ÷ sản lượng nhà ga SCSC cùng quý (tấn) → nghìn đồng/tấn.
const scsQ = (() => {
  const by = {}; obs('scs_tonnage').forEach(o => { const k = o.period_label; by[k] = by[k] || {pe: o.period_end, v: 0, n: 0}; by[k].v += o.value; by[k].n++; });
  const per = Object.entries(by).filter(([, x]) => x.n === 2).sort((a, b) => a[1].pe < b[1].pe ? -1 : 1);
  const rev = p => { const [q, y] = p.split('/'), i = (F.periods || []).indexOf(y + 'Q' + q.slice(1)); return i >= 0 ? F.data?.SCS?.revenue?.[i] : null; };
  return {cats: per.map(([k]) => k), yld: per.map(([k, x]) => { const r = rev(k); return Number.isFinite(r) ? Math.round(r * 1e6 / x.v) : null; })};
})();

// 28/11/2026 (khung chuẩn Điện): ô số và "Dữ liệu mới nhất" của từng sub-tab Bức tranh ngành, tính từ AVIATION_DATA / AVIATION_FIN trên trang.
// Ngày quan sát: chuỗi tháng, số lũy kế, số quý → tháng cuối kỳ (yyyy-mm); số dư tại ngày → ngày; lịch bay theo mùa → ngày Cục HK công bố
// (kỳ mùa kéo dài tới tương lai nên không lấy ngày cuối mùa); giá theo ngày → ngày.
const MS = k => W.blocks?.macro?.series?.[k]?.records || [];
const mLast = k => MS(k).at(-1)?.date?.slice(0, 7);
const oDate = o => !o ? null : o.frequency === 'point' ? o.period_end : o.frequency === 'season' ? o.published_at : o.period_end.slice(0, 7);
const lastObs = m => obs(m).map(oDate).filter(Boolean).sort().at(-1);
const latest = a => a.filter(Boolean).sort().at(-1) || null;
const finQ = t => { const ps = F.periods || [], r = F.data?.[t]?.revenue || []; for (let i = ps.length - 1; i >= 0; i--) if (Number.isFinite(r[i])) return ps[i].slice(0, 4) + '-' + String(Number(ps[i].slice(-1)) * 3).padStart(2, '0'); return null; };
const dmy = d => d ? d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4) : '';
const ltDate = () => { const m = String((EX.longthanh_progress || [])[0]?.[2] || '').match(/(\d{2})\/(\d{2})\/(\d{4})/); return m ? `${m[3]}-${m[2]}-${m[1]}` : null; };
const ASOF = {
  demand: () => latest([mLast('air_pax'), mLast('visitors_air'), lastObs('caa_pax_carried_vn'), lastObs('caa_pax_carried_mkt'), lastObs('caa_pax_airport')]),
  supply: () => latest([mLast('air_paxkm'), lastObs('caa_sched_intl'), lastObs('caa_sched_dom'), lastObs('caa_aircraft_registered'), lastObs('caa_fleet_airline'), lastObs('caa_otp'), lastObs('dom_share')]),
  cost: () => latest([W.fuel?.daily?.at(-1)?.[0], W.fuel?.monthly?.at(-1)?.[0], W.fx?.daily?.at(-1)?.[0], W.fx?.monthly?.at(-1)?.[0]]),
  airport: () => latest([ltDate(), lastObs('acv_pax'), lastObs('acv_cargo'), finQ('ACV')]),
  cargo: () => latest([mLast('air_freight'), lastObs('caa_cargo_airport'), lastObs('scs_tonnage'), ...['SCS', 'NCT', 'SGN', 'AST', 'SAS'].map(finQ)]),
};
// Ô số theo số lũy kế Cục HK / ACV: kỳ mới nhất của dòng tổng, % so cùng kỳ đúng số nguồn công bố, kèm % quốc tế cùng kỳ.
const cumKpi = (m, unit, note, color) => () => { const o = last(m, 'total'); if (!o) return null; const i = obs(m, {segment: 'intl'}).find(x => x.period_start === o.period_start && x.period_end === o.period_end);
  return {value: nf(o.value, 1), unit: unit || o.unit, sub: o.period_label + ' · ' + note, delta: [Number.isFinite(o.yoy) ? sg(o.yoy) + '% so cùng kỳ' : '', i && Number.isFinite(i.yoy) ? 'quốc tế ' + sg(i.yoy) + '%' : ''].filter(Boolean).join(' · '), color}; };
const scsTot = () => { const by = {}; obs('scs_tonnage').forEach(o => { const k = o.period_label; by[k] = by[k] || {pe: o.period_end, v: 0, n: 0}; by[k].v += o.value; by[k].n++; }); return Object.entries(by).filter(([, x]) => x.n === 2).sort((a, b) => a[1].pe < b[1].pe ? -1 : 1); };

window.PKG = {
  key: 'aviation', prefix: 'hk', label: 'Hàng không', dataVar: 'AVIATION_DATA',
  ticker: {commodity: [], ratio: []},
  wide: ['hk-01', 'hk-05', 'hk-13', 'hk-20', 'hk-24', 'hk-30', 'hk-40', 'hk-62'],
  kpis: [
    {spark: 'spk-pax', series: 'air_pax', unit: 'nghìn lượt', digits: 0, note: 'NSO', color: C.navy},
    {spark: 'spk-visair', series: 'visitors_air', unit: 'nghìn lượt', div: 1000, digits: 0, note: 'NSO', color: C.teal},
    {spark: 'spk-cargo', series: 'air_freight', unit: 'nghìn tấn', digits: 1, note: 'NSO', color: C.plum},
    // 28/11/2026: ô số mới cho các sub-tab còn thiếu (cùng số với chart trong sub-tab đó; không có số thì ô giữ "—").
    {spark: 'spk-carried', calc: cumKpi('caa_pax_carried_vn', 'triệu lượt', 'Cục Hàng không', C.navy)},
    {spark: 'spk-sched', calc: () => { const o = obs('caa_sched_intl', {segment: 'total'}).sort((a, b) => a.period_start < b.period_start ? -1 : 1).at(-1); if (!o) return null;
      return {value: nf(o.value, 0), unit: 'chuyến khứ hồi/tuần', sub: o.period_label + ' · lịch bay Cục HK duyệt, công bố ' + dmy(o.published_at), delta: Number.isFinite(o.yoy) ? sg(o.yoy) + '% so cùng mùa năm trước' : ''}; }},
    {spark: 'spk-rpk', series: 'air_paxkm', unit: 'triệu HK.km', digits: 0, note: 'NSO', color: C.plum},
    {spark: 'spk-fleet', calc: () => { const rs = obs('caa_aircraft_registered').sort((a, b) => a.period_end < b.period_end ? -1 : 1), l = rs.at(-1); if (!l) return null;
      const p = rs.filter(o => o.period_end.slice(0, 4) < l.period_end.slice(0, 4)).at(-1);
      return {value: nf(l.value, 0), unit: 'tàu', sub: l.period_label + ' · Cục Hàng không, số dư tại ngày', delta: p ? (l.value - p.value >= 0 ? '+' : '−') + nf(Math.abs(l.value - p.value), 0) + ' tàu so ' + p.period_label : '', spark: rs.map(o => o.value), color: C.navy}; }},
    {spark: 'spk-fuel', calc: () => { const d = W.fuel?.daily?.at(-1), mo = W.fuel?.monthly || [], ml = mo.at(-1); if (!d) return null;
      const mp = ml && mo.find(x => x[0] === (Number(ml[0].slice(0, 4)) - 1) + ml[0].slice(4));
      return {value: nf(d[1], 2), unit: 'USD/gallon', sub: dmy(d[0]) + ' · EIA vùng Vịnh Mỹ', delta: ml ? 'BQ T' + Number(ml[0].slice(5)) + '/' + ml[0].slice(2, 4) + ': ' + nf(ml[1], 2) + (mp ? ' · ' + sg((ml[1] / mp[1] - 1) * 100, 0) + '% so cùng kỳ' : '') : '', spark: mo.slice(-12).map(x => x[1]), color: C.red}; }},
    {spark: 'spk-iata', calc: () => { const x = EX.iata; if (!x || !Number.isFinite(x.global)) return null;
      return {value: nf(x.global, 2), unit: 'USD/thùng', sub: 'tuần đến ' + dmy(x.week_ending) + ' · IATA bình quân toàn cầu', delta: [Number.isFinite(x.global_wow) ? sg(x.global_wow) + '% so tuần trước' : '', Number.isFinite(x.global_yoy) ? sg(x.global_yoy) + '% so cùng kỳ' : ''].filter(Boolean).join(' · ')}; }},
    {spark: 'spk-fx', calc: () => { const mo = W.fx?.monthly || [], l = mo.at(-1); if (!l) return null; const p = mo.find(x => x[0] === (Number(l[0].slice(0, 4)) - 1) + l[0].slice(4));
      return {value: nf(l[1], 0), unit: 'đồng/USD', sub: 'T' + Number(l[0].slice(5)) + '/' + l[0].slice(0, 4) + ' · NHNN, bình quân tháng', delta: p ? sg((l[1] / p[1] - 1) * 100, 1) + '% so cùng kỳ' : '', spark: mo.slice(-12).map(x => x[1]), color: C.gold}; }},
    {spark: 'spk-apax', calc: cumKpi('caa_pax_airport', 'triệu lượt', 'Cục Hàng không, mọi cảng', C.teal)},
    {spark: 'spk-acv', calc: cumKpi('acv_pax', 'triệu lượt', 'ACV công bố', C.gold)},
    {spark: 'spk-lt', calc: () => { const [a, b] = EX.longthanh_progress || []; if (!a) return null;
      return {value: nf(a[1], 2) + '%', sub: 'giá trị hợp đồng theo khối lượng' + (ltDate() ? ' · đến ' + dmy(ltDate()) : ''), delta: b ? 'giải ngân ' + nf(b[1], 0) + '%' : ''}; }},
    {spark: 'spk-cargoport', calc: cumKpi('caa_cargo_airport', 'nghìn tấn', 'Cục Hàng không, gồm hãng nước ngoài', C.plum)},
    {spark: 'spk-scs', calc: () => { const q = scsTot(), l = q.at(-1); if (!l) return null; const [lab, x] = l, prev = q.find(([k]) => k === lab.split('/')[0] + '/' + (Number(lab.split('/')[1]) - 1));
      return {value: nf(x.v, 0), unit: 'tấn', sub: lab + ' · SCSC, quốc tế + nội địa', delta: prev ? sg((x.v / prev[1].v - 1) * 100, 1) + '% so ' + prev[0] : '', spark: q.map(([, y]) => y.v), color: C.plum}; }},
  ],
  charts: [
    {id: 'hkChain', type: 'html',
      src: [['Cường Anh Eco-Writer – Chuỗi giá trị ngành Hàng không (06/08/2025)', 'https://cuonganhecowriter.substack.com/p/chuoi-gia-tri-nganh-hang-khong'], SHS],
      method: 'Sơ đồ định tính. Mũi tên liền biểu thị luồng cung ứng và vận chuyển. Nét đứt biểu thị hạ tầng và dịch vụ hỗ trợ hãng bay. Cơ chế thanh toán thực tế tùy biểu giá, hợp đồng và nhà ga.',
      render: () => `<div class="hk-chain">
        <div class="hk-chain-flow" role="group" aria-label="Luồng cung ứng và vận chuyển">
          <section class="hk-chain-node">
            <h4>Nguồn lực khai thác</h4>
            <ul><li>Tàu bay và hợp đồng thuê</li><li>Nhiên liệu, bảo dưỡng</li><li>Phi công, tiếp viên</li></ul>
            <a href="#rf-q-fuel">Giá nhiên liệu và tỷ giá <span aria-hidden="true">›</span></a>
          </section>
          <span class="hk-chain-arrow" aria-hidden="true"></span>
          <section class="hk-chain-node hk-chain-airline">
            <div class="hk-chain-heading"><h4>Hãng bay</h4><b>HVN · VJC</b></div>
            <p>Vé, dịch vụ phụ trợ và cước vận chuyển hàng.</p>
            <a href="#rf-mt14-sector">Doanh thu, biên và dòng tiền <span aria-hidden="true">›</span></a>
          </section>
          <span class="hk-chain-arrow" aria-hidden="true"></span>
          <section class="hk-chain-node">
            <h4>Khách hàng</h4>
            <ul><li><strong>Hành khách</strong> mua vé, hành lý, chọn chỗ.</li><li><strong>Chủ hàng</strong> trả cước trực tiếp hoặc qua forwarder.</li></ul>
            <a href="#rf-q-carried">Lưu lượng hành khách <span aria-hidden="true">›</span></a>
          </section>
        </div>
        <div class="hk-chain-support">
          <h4>Hạ tầng và dịch vụ phục vụ chuyến bay</h4>
          <div class="hk-chain-services">
            <section class="hk-chain-node">
              <div class="hk-chain-heading"><h5>Khai thác cảng</h5><b>ACV</b></div>
              <p>Hãng trả phí cất hạ cánh. Phí phục vụ hành khách thường thu qua vé.</p>
              <a href="#rf-q-acv">Lượt khách qua cảng <span aria-hidden="true">›</span></a>
            </section>
            <section class="hk-chain-node">
              <div class="hk-chain-heading"><h5>Phục vụ mặt đất</h5><b>SGN</b></div>
              <p>Hãng trả theo dịch vụ và số chuyến trong hợp đồng.</p>
              <a href="#rf-q-svc">Doanh thu dịch vụ <span aria-hidden="true">›</span></a>
            </section>
            <section class="hk-chain-node">
              <div class="hk-chain-heading"><h5>Nhà ga hàng hóa</h5><b>SCS · NCT</b></div>
              <p>Hãng hoặc khách hàng logistics trả phí xử lý, lưu kho.</p>
              <a href="#rf-q-scs">Sản lượng và doanh thu/tấn <span aria-hidden="true">›</span></a>
            </section>
            <section class="hk-chain-node">
              <div class="hk-chain-heading"><h5>Bán lẻ và ẩm thực</h5><b>AST · SAS</b></div>
              <p>Hành khách chi tiêu tại nhà ga có điểm bán.</p>
              <a href="#rf-q-svc">Kết quả nhóm dịch vụ <span aria-hidden="true">›</span></a>
            </section>
          </div>
        </div>
        <p class="hk-chain-legend"><span>Cung ứng và vận chuyển</span><span>Hạ tầng và dịch vụ hỗ trợ</span></p>
      </div>`},
    {id: 'hkModels', type: 'html', src: [SHS, VND, ['Cục Hàng không – đội tàu 15/10/2026', CAA10[1]]],
      method: 'Sơ đồ định tính: các khối nối bằng công thức (×, =) hoặc mũi tên, không vẽ theo tỷ trọng vì doanh nghiệp không công bố đủ số tách mảng theo quý. Màu: xanh ngọc = lưu lượng, xanh đậm = doanh thu, đỏ = chi phí, vàng = gắn với USD/VND.',
      render: e => {
        const n = (F.periods || []).length, lp = (F.periods || [])[n - 1], ql = p => p ? 'Q' + p.slice(-1) + '/' + p.slice(0, 4) : '';
        const ttm = (t, k) => { const r = F.data?.[t]?.[k]; if (!r || n < 4) return null; const v = r.slice(n - 4); return v.every(Number.isFinite) ? v.reduce((a, b) => a + b, 0) : null; };
        const pt = (t, k) => { const r = F.data?.[t]?.[k]; return r && Number.isFinite(r[n - 1]) ? r[n - 1] : null; };
        // Khối: [nhãn, đơn vị/ghi chú ngắn, loại flow|rev|cost|lever, giải thích khi rê/chạm, cờ]
        const N = (l, u, k, tip, f = {}) => ({l, u, k, tip, ...f}), O = t => ({op: t});
        const chip = x => x.op ? `<span class="hkm-op${/[→↘]/.test(x.op) ? ' hkm-arr' : ''}" aria-hidden="true">${e(x.op)}</span>`
          : `<span class="hkm-n hkm-${x.k}${x.main ? ' hkm-main' : ''}" tabindex="0"${x.tip ? ` data-tip="${e(x.tip)}"` : ''} aria-label="${e(x.l + (x.u ? ', ' + x.u : '') + (x.tip ? '. ' + x.tip : ''))}"><b>${e(x.l)}</b>${x.u ? `<small>${e(x.u)}</small>` : ''}${x.fx ? '<i class="hkm-fx">USD/VND</i>' : ''}</span>`;
        const lane = (t, seq, cls = '') => `<div class="hkm-lane ${cls}"><span class="hkm-lt">${e(t)}</span><div class="hkm-seq">${seq.map(chip).join('')}</div></div>`;
        const margin = (from, costs, out) => `<div class="hkm-lane hkm-cost"><span class="hkm-lt">Biên</span><div class="hkm-seq">${chip(N(from, '', 'rev'))}<span class="hkm-op">−</span><span class="hkm-group">${costs.map(chip).join('')}</span><span class="hkm-op">=</span>${chip(N(out, '', 'rev', '', {main: 1}))}</div></div>`;
        const kpis = (tks, scope) => `<div class="hkm-kpi"><p class="hkm-kh">BCTC hợp nhất · doanh thu, biên: 4 quý đến ${ql(lp)} · nợ vay ròng: cuối ${ql(lp)}${scope ? ' · ' + e(scope) : ''} · tỷ đồng</p>${tks.map(([t, where]) => { const rev = ttm(t, 'revenue'), gp = ttm(t, 'gross'), np = ttm(t, 'npat'), debt = (pt(t, 'st_debt') ?? 0) + (pt(t, 'lt_debt') ?? 0), cash = (pt(t, 'cash') ?? 0) + (pt(t, 'st_invest') ?? 0);
          return `<div class="hk-mfin"><b>${e(t)}</b>${where ? `<em>${e(where)}</em>` : ''}<span><i>Doanh thu</i>${nf(rev, 0)}</span><span><i>Biên gộp</i>${rev ? nf(gp / rev * 100, 1) + '%' : '—'}</span><span><i>Biên ròng</i>${rev ? nf(np / rev * 100, 1) + '%' : '—'}</span><span><i>Nợ vay ròng</i>${nf(debt - cash, 0)}</span></div>`; }).join('')}</div>`;
        const scsY = scsQ.yld.at(-1), scsP = scsQ.cats.at(-1);
        const M = [
          {t: 'Hãng bay truyền thống', who: 'HVN', kp: [['HVN', 'hợp nhất Pacific Airlines, VASCO']],
            lanes: [lane('Vé hành khách', [N('ASK', 'ghế-km cung ứng', 'flow', 'Số ghế × km bay. HVN chưa công bố ASK năm 2026.'), O('×'), N('Hệ số tải', 'RPK ÷ ASK', 'flow', 'Tỷ lệ ghế có khách.'), O('='), N('RPK', 'khách-km', 'flow', 'Số khách × km thực bay.'), O('×'), N('Yield', 'đồng/khách-km', 'rev', 'Giá vé bình quân trên mỗi khách-km; cao hơn ở hạng thương gia, thấp hơn ở chặng dài.'), O('='), N('Doanh thu vé', 'nội địa · quốc tế', 'rev', 'Quốc tế đường dài thân rộng (châu Âu, Úc, Đông Bắc Á) và hạng ghế quyết định mix; nội địa chịu trần giá vé.', {main: 1})]),
              lane('Hàng hóa khoang bụng', [N('Tấn-km hàng', 'khoang bụng tàu', 'flow', 'Chủ yếu trên tàu thân rộng đường quốc tế.'), O('×'), N('Cước', 'đồng/tấn-km', 'rev'), O('='), N('Doanh thu hàng hóa', '', 'rev', '', {main: 1})]),
              lane('Phụ trợ', [N('Khách', 'lượt', 'flow'), O('×'), N('Phụ trợ/khách', 'hành lý, đổi vé, phòng chờ', 'rev'), O('='), N('Doanh thu phụ trợ', '', 'rev', '', {main: 1})]),
              margin('Doanh thu', [N('Nhiên liệu', 'giá USD', 'cost', 'Khoản chi lớn nhất, theo giá jet fuel.', {fx: 1}), N('Thuê tàu, khấu hao', 'phần lớn USD', 'cost', 'Thuê hoạt động, thuê tài chính, khấu hao tàu sở hữu.', {fx: 1}), N('Bảo dưỡng, động cơ', 'USD', 'cost', '', {fx: 1}), N('Phí sân bay, nhân công', 'theo chuyến', 'cost')], 'Biên khai thác')],
            close: 'Hệ số tải, yield và cơ cấu đường bay quyết định doanh thu trên năng lực khai thác.',
            links: [['#rf-q-carried', 'Khách vận chuyển'], ['#rf-q-fuel', 'Nhiên liệu, tỷ giá'], ['#rf-mt14-sector', 'Doanh thu, biên HVN']]},
          {t: 'Hãng bay chi phí thấp', who: 'VJC', kp: [['VJC', 'số hợp nhất, gồm giao dịch tàu bay']],
            lanes: [lane('Khai thác bay', [N('Khách bay', 'lượt', 'flow'), O('×'), N('Giá vé cơ bản', 'đồng/khách', 'rev', 'Giá thấp, chưa gồm hành lý ký gửi, suất ăn.'), O('+'), N('Phụ trợ/khách', 'hành lý, chọn chỗ, suất ăn, bảo hiểm', 'rev', 'Phần bù cho giá vé cơ bản thấp; VJC chưa công bố số 2026.'), O('='), N('Doanh thu vé, phụ trợ', '+ hàng hóa (bổ sung)', 'rev', '', {main: 1})]),
              lane('Giao dịch tàu bay', [N('Tàu bàn giao', 'chiếc trong kỳ', 'flow', 'Tàu mới từ nhà sản xuất.'), O('→'), N('Bán và thuê lại', 'SLB', 'lever', 'Bán tàu cho bên cho thuê rồi thuê lại để khai thác.'), O('→'), N('Ghi nhận theo kỳ', 'doanh thu, lãi bán tàu', 'rev', 'Không đều theo quý, làm KPI hợp nhất biến động.', {main: 1}), O('↘'), N('Nghĩa vụ thuê sau giao dịch', 'tiền thuê USD', 'cost', 'Chi phí thuê tàu các kỳ sau.', {fx: 1})], 'hkm-alt'),
              margin('Doanh thu khai thác', [N('Nhiên liệu', 'giá USD', 'cost', '', {fx: 1}), N('Mức sử dụng tàu', 'giờ bay/tàu/ngày', 'lever', 'Bay càng dày, chi phí cố định trên ghế càng thấp.'), N('Chi phí thuê tàu', 'USD', 'cost', '', {fx: 1})], 'Biên khai thác')],
            close: 'Theo dõi phụ trợ/khách để đọc sức kiếm tiền của hoạt động bay, và số tàu bàn giao để giải thích biến động do bán và thuê lại tàu.',
            links: [['#rf-q-sched', 'Lịch bay'], ['#rf-q-fleet', 'Đội tàu'], ['#rf-mt14-sector', 'Doanh thu, biên VJC']]},
          {t: 'Khai thác cảng hàng không', who: 'ACV', kp: [['ACV', '21/22 cảng']],
            lanes: [lane('Khách trả', [N('Khách nội địa, quốc tế', 'lượt qua cảng', 'flow'), O('→'), N('Phí phục vụ hành khách', 'thu qua giá vé', 'rev', 'Hãng thu hộ trong giá vé rồi nộp lại; mức quốc tế cao hơn nhiều nội địa.', {main: 1})]),
              lane('Hãng bay trả', [N('Chuyến bay', 'cất hạ cánh', 'flow'), O('→'), N('Phí cất hạ cánh, sân đỗ', 'theo chuyến, trọng tải', 'rev', '', {main: 1})]),
              lane('Bên thuê trả', [N('Bên thuê, nhượng quyền', 'bán lẻ, ăn uống, kho, mặt đất', 'flow'), O('→'), N('Mặt bằng, thương mại', 'theo hợp đồng', 'rev', '', {main: 1})]),
              lane('Đầu tư', [N('Capex', 'Long Thành, nhà ga', 'cost', 'Tiền chi xây dựng, ghi vào XDCB dở dang.'), O('→'), N('Đưa vào sử dụng', 'chuyển thành tài sản', 'lever'), O('→'), N('Khấu hao', 'chi phí hằng năm', 'cost')], 'hkm-alt'),
              lane('Công suất', [N('Công suất mới', 'triệu khách/năm', 'lever'), O('→'), N('Lưu lượng thực tế', 'lượt qua cảng', 'flow', 'Tốc độ lấp công suất quyết định doanh thu bù được khấu hao mới.'), O('→'), N('Doanh thu khai thác', '', 'rev', '', {main: 1})], 'hkm-alt')],
            foot: 'Khi đối chiếu biên ròng: lãi tiền gửi làm tăng lợi nhuận; chênh lệch tỷ giá trên nợ vay ngoại tệ có thể làm tăng hoặc giảm.',
            close: 'Mix khách quốc tế tác động đến doanh thu, còn tốc độ lấp công suất mới quyết định mức hấp thụ khấu hao.',
            links: [['#rf-q-acv', 'Khách qua ACV'], ['#rf-q-lt', 'Long Thành']]},
          {t: 'Nhà ga hàng hóa', who: 'SCS · NCT', kp: [['SCS', 'Tân Sơn Nhất'], ['NCT', 'Nội Bài']],
            lanes: [lane('Sản lượng', [N('Hàng qua sân bay', 'tấn', 'flow'), O('×'), N('Thị phần nhà ga', '% tại sân bay', 'lever', 'Mỗi sân bay có nhà ga cạnh tranh; hãng bay chọn nhà ga theo hợp đồng.'), O('='), N('Tấn xử lý', 'quốc tế · nội địa', 'flow', 'Hàng quốc tế phí cao hơn nội địa.')]),
              lane('Giá', [N('Tấn quốc tế', '', 'flow'), O('×'), N('Doanh thu/tấn quốc tế', 'phí xử lý', 'rev'), O('+'), N('Tấn nội địa', '', 'flow'), O('×'), N('Doanh thu/tấn nội địa', '', 'rev'), O('+'), N('Lưu kho, dịch vụ cộng thêm', 'nếu tính riêng', 'rev'), O('='), N('Doanh thu', Number.isFinite(scsY) ? `SCS ${scsP}: ~${nf(scsY / 1000, 1)} triệu đ/tấn` : '', 'rev', 'Doanh thu thuần SCS ÷ tổng tấn qua nhà ga SCSC cùng quý; gồm cả dịch vụ khác nên là số gần đúng.', {main: 1})]),
              margin('Doanh thu', [N('Khấu hao nhà ga', 'cố định', 'cost'), N('Mặt bằng, nhượng quyền', 'cố định', 'cost'), N('Nhân công', '', 'cost')], 'Biên (đòn bẩy theo sản lượng)')],
            close: 'Hàng qua sân bay tăng chỉ truyền sang doanh thu doanh nghiệp theo thị phần nhà ga, mix hàng và giá dịch vụ.',
            links: [['#rf-q-cargo', 'Hàng qua cảng'], ['#rf-q-scs', 'Sản lượng, doanh thu/tấn']]},
          {t: 'Phục vụ mặt đất', who: 'SGN', kp: [['SGN', 'nhiều sân bay']],
            lanes: [lane('Bộ lọc hợp đồng', [N('Tổng chuyến tại sân bay', 'chuyến', 'flow'), O('→'), N('Chuyến của hãng có hợp đồng', 'mở mới · gia hạn · mất hợp đồng', 'lever', 'Bước quyết định: hợp đồng với từng hãng mở ra hoặc đóng lại phần chuyến SGN được phục vụ.'), O('→'), N('Chuyến được phục vụ', 'chuyến thực tế', 'flow'), O('×'), N('Đơn giá', 'theo loại tàu, gói dịch vụ', 'rev'), O('='), N('Doanh thu', '', 'rev', '', {main: 1})]),
              margin('Doanh thu', [N('Nhân công', 'phần lớn chi phí', 'cost'), N('Thiết bị mặt đất', 'khấu hao, bảo dưỡng', 'cost'), N('Phí nhượng quyền', 'trả chủ cảng', 'cost')], 'Biên')],
            close: 'Số chuyến của hãng khách hàng và hiệu lực hợp đồng là hai biến cần kiểm tra trước khi suy từ lịch bay sang doanh thu SGN.',
            links: [['#rf-q-sched', 'Lịch bay'], ['#rf-q-svc', 'Doanh thu dịch vụ']]},
          {t: 'Bán lẻ, ẩm thực và dịch vụ nhà ga', who: 'AST · SAS', kp: [['AST', 'nhiều nhà ga ACV'], ['SAS', 'Tân Sơn Nhất']],
            lanes: [lane('Bán lẻ, ẩm thực', [N('Khách qua khu có điểm bán', 'lượt', 'flow', 'Chỉ tính khách đi qua khu vực có cửa hàng, không phải toàn bộ khách của sân bay.'), O('×'), N('Tỷ lệ mua', '%', 'lever'), O('='), N('Số giao dịch', '', 'flow'), O('×'), N('Giá trị hóa đơn', 'đồng/giao dịch', 'rev', 'Khách quốc tế chi tiêu cao hơn.'), O('='), N('Doanh thu bán lẻ, miễn thuế, ẩm thực', '', 'rev', '', {main: 1})]),
              lane('Phòng chờ', [N('Lượt sử dụng', 'lượt', 'flow'), O('×'), N('Doanh thu/lượt', 'hãng trả, thẻ, khách trả', 'rev', 'Mức thu tùy cơ chế: hãng bay trả cho khách hạng cao, chủ thẻ hoặc khách mua lẻ.'), O('='), N('Doanh thu phòng chờ', '', 'rev', '', {main: 1})], 'hkm-alt'),
              margin('Doanh thu', [N('Giá vốn hàng bán', '', 'cost'), N('Nhân công', '', 'cost'), N('Phí mặt bằng, nhượng quyền', 'thường gắn doanh thu', 'cost')], 'Biên')],
            close: 'Lưu lượng chỉ chuyển thành lợi nhuận khi doanh nghiệp có vị trí tiếp cận khách và giữ được biên sau phí mặt bằng.',
            links: [['#rf-q-share', 'Khách qua cảng'], ['#rf-q-svc', 'Doanh thu dịch vụ']]},
        ];
        const legend = '<div class="hkm-legend"><span class="hkm-flow">Lưu lượng</span><span class="hkm-rev">Doanh thu</span><span class="hkm-cost">Chi phí</span><span class="hkm-lever">Biến điều chỉnh</span><span class="hkm-fxl">Gắn USD/VND</span></div>';
        return `<div class="hk-models">${legend}${M.map((m, i) => `<article class="hk-model hkm" id="hkm-${i + 1}"><header><span>${i + 1}</span><h4>${e(m.t)}</h4><p><b>${e(m.who)}</b></p></header>
          <div class="hkm-diagram">${m.lanes.join('')}</div>
          <nav><span>Theo dõi dữ liệu:</span>${m.links.map(([h, l]) => `<a href="${h}">${e(l)} ›</a>`).join('')}</nav></article>`).join('')}</div>`;
      }},
    {id: 'hkCarried', type: 'cum', table: 'tbl-carried', views: [['caa_pax_carried_vn', 'Hãng Việt vận chuyển'], ['caa_pax_carried_mkt', 'Toàn thị trường (gồm hãng nước ngoài)']].filter(([m]) => obs(m).length),
      segs: [['dom', 'Nội địa', C.navy], ['intl', 'Quốc tế', C.teal]], stackable: true,
      method: 'Khách vận chuyển: đếm theo hãng chở. "Toàn thị trường" gồm hãng nước ngoài, chỉ có ở kỳ Cục Hàng không công bố. Số lũy kế giữ nguyên kỳ công bố; không trừ lũy kế để ra số tháng. So cùng kỳ lấy đúng số nguồn công bố.'},
    {id: 'hkAirPax', type: 'mseries', table: 'tbl-airpax', unit: 'nghìn lượt', digits: 0, months: 36, src: [NSO],
      series: [['Khách vận chuyển đường hàng không', 'air_pax', C.navy]],
      method: 'Biểu "Vận tải hành khách" hằng tháng của NSO, dòng Hàng không: khách do doanh nghiệp vận tải Việt Nam chở (nội địa và quốc tế gộp). Tháng mới nhất là số ước tính, tháng sau NSO thay bằng sơ bộ.'},
    {id: 'hkThrough', type: 'cum', table: 'tbl-through', views: [['caa_pax_airport', 'Lượt khách qua cảng']], segs: [['dom', 'Nội địa', C.navy], ['intl', 'Quốc tế', C.teal]], stackable: true,
      method: 'Lượt khách thông qua cảng hàng không: một chuyến nội địa tính ở cả cảng đi và cảng đến, nên lớn hơn số khách vận chuyển. Chuỗi này dùng theo dõi ACV và dịch vụ sân bay. Drill-down theo từng cảng: chưa có số tháng theo cảng từ Cục Hàng không, ACV; bản đồ ở mục Sân bay ghi các số theo cảng đã xác minh.'},
    {id: 'hkIntlShare', type: 'brief', src: [CAA10],
      method: 'Công thức: khách quốc tế do hãng Việt vận chuyển ÷ khách quốc tế vận chuyển toàn thị trường (gồm hãng nước ngoài), cùng kỳ, cùng phạm vi Cục Hàng không. Không dùng lượt khách quốc tế qua cảng làm mẫu số (chuỗi riêng).',
      render: () => {
        const v = obs('caa_pax_carried_vn', {segment: 'intl'}), m = obs('caa_pax_carried_mkt', {segment: 'intl'});
        const rows = v.map(o => [o, m.find(q => q.period_start === o.period_start && q.period_end === o.period_end)]).filter(([, q]) => q).sort((a, b) => a[0].period_end < b[0].period_end ? -1 : 1);
        if (!rows.length) return '<p class="rf-note">Chưa đủ số cùng kỳ. Biến đang thiếu: khách quốc tế vận chuyển toàn thị trường (gồm hãng nước ngoài) cho kỳ có số hãng Việt.</p>';
        const lastP = rows.at(-1)[0].period_label;
        return `<div class="hk-share"><div class="legend"><span class="li"><span class="dot" style="background:${C.navy}"></span>Hãng Việt</span><span class="li"><span class="dot" style="background:#e7d9ad"></span>Hãng nước ngoài</span></div>
          ${rows.map(([o, q]) => { const pv = o.value / q.value * 100; return `<div class="hk-shr${o.period_label === lastP ? ' hk-shr-last' : ''}" title="${esc(o.period_label)}: hãng Việt ${nf(o.value, 2)} ÷ toàn thị trường ${nf(q.value, 2)} triệu khách quốc tế"><span class="hk-shp">${esc(o.period_label)}</span><span class="hk-shb"><i style="width:${pv.toFixed(1)}%"><b>${nf(pv, 1)}%</b></i><em>${nf(100 - pv, 1)}%</em></span><span class="hk-shn">${nf(o.value, 1)} / ${nf(q.value, 1)} tr</span></div>`; }).join('')}</div>`;
      }},
    {id: 'hkVisHeat', type: 'heat', table: 'tbl-visheat', months: 18, src: [NSO], aria: 'Khách quốc tế đến theo thị trường và tháng',
      rows: [['vis_cn', 'Trung Quốc'], ['vis_kr', 'Hàn Quốc'], ['vis_tw', 'Đài Loan'], ['vis_jp', 'Nhật Bản'], ['vis_ru', 'Nga'], ['vis_us', 'Hoa Kỳ'], ['vis_in', 'Ấn Độ'], ['vis_kh', 'Cam-pu-chia'], ['vis_ph', 'Phi-li-pin'], ['vis_au', 'Úc'], ['vis_my', 'Ma-lai-xi-a'], ['vis_sg', 'Xin-ga-po'], ['vis_th', 'Thái Lan']],
      method: 'Khách quốc tế đến Việt Nam theo quốc tịch, mọi phương tiện (đường không chiếm phần lớn), NSO. Đây là khách nhập cảnh, khác khách vận chuyển và lượt khách qua cảng. Tần suất lịch bay theo từng thị trường chưa có số công bố theo quốc gia nên chưa đặt cạnh.'},
    {id: 'hkVisAir', type: 'mseries', table: 'tbl-visair', unit: 'nghìn lượt', div: 1000, digits: 0, months: 36, src: [NSO],
      series: [['Đến bằng đường không', 'visitors_air', C.teal], ['Tổng khách quốc tế đến', 'tourists', C.grey, 'line']],
      method: 'NSO, biểu Khách quốc tế đến Việt Nam, phân theo phương tiện đến. Số tháng mới nhất là ước tính.'},
    {id: 'hkSched', type: 'brief', src: [['Cục Hàng không – lịch bay mùa Đông 2026 (25/11/2026)', 'https://caa.gov.vn/hoat-dong-nganh/thi-truong-van-tai-hang-khong-viet-nam-tiep-tuc-tang-truong-mo-rong-ket-noi-trong-lich-bay-mua-dong-2026-20261125192204982.htm'], ['VTV – lịch bay mùa Hè 2026 (dẫn Cục HK)', 'https://vtv.vn/hon-45-trieu-luot-hanh-khach-di-may-bay-trong-6-thang-100260722155525504.htm']],
      render: () => {
        const panel = (title, unit, rows, col, foot) => { const mx = Math.max(...rows.map(r => r[1]), 1); return `<section class="hk-sp"><h5>${esc(title)}</h5><p class="hk-spu">${esc(unit)}</p>${rows.map(([l, v, badge]) => `<div class="hk-spr" title="${esc(l)}: ${nf(v, 0)} ${esc(unit)}"><span class="hk-spl">${esc(l)}</span><span class="hk-spb"><i style="width:${(v / mx * 100).toFixed(1)}%;background:${col}"></i></span><span class="hk-spv"><b>${nf(v, 0)}</b>${badge ? `<small>${esc(badge)}</small>` : ''}</span></div>`).join('')}</section>`; };
        const si = obs('caa_sched_intl').sort((a, b) => a.period_start < b.period_start ? -1 : 1);
        const mk = obs('caa_sched_market').sort((a, b) => b.value - a.value), al = obs('caa_sched_airline_intl')[0], dm = obs('caa_sched_dom').filter(o => o.segment !== 'total').sort((a, b) => b.value - a.value), dt = obs('caa_sched_dom', {segment: 'total'})[0];
        const short = t => t.replace(' (gồm VASCO)', ' (gồm VASCO)').replace(' Airlines', '').replace(' Airways', '');
        return `<div class="hk-sps">
          ${panel('Quốc tế theo mùa', 'chuyến khứ hồi/tuần', si.map(o => [o.period_label, o.value, o.yoy != null ? sg(o.yoy, 1) + '% so cùng mùa' : '']).concat(al ? [['Sun PhuQuoc (Đông 2026)', al.value, '']] : []), C.navy)}
          ${panel('Quốc tế Đông 2026 · 3 thị trường lớn nhất', 'chuyến khứ hồi/tuần', mk.map(o => [o.segment, o.value]), C.teal)}
          ${panel('Nội địa Đông 2026 theo hãng', 'chuyến/tuần' + (dt ? ' · tổng ' + nf(dt.value, 0) : ''), dm.map(o => [short(o.segment), o.value]), C.gold)}
        </div>`;
      },
      method: 'Lịch bay Cục Hàng không cấp phép theo mùa IATA (mùa Hè, mùa Đông); quốc tế tính chuyến khứ hồi/tuần, nội địa tính chuyến/tuần. Đây là cung dự kiến, khác số chuyến đã thực hiện (chart OTP bên dưới). Cục Hàng không chỉ nêu ba thị trường lớn nhất, không tách số chuyến quốc tế của hãng Việt và hãng nước ngoài; mùa Hè 2026 lấy từ VTV dẫn Cục HK. Không có số tuyệt đối mùa Đông, Hè 2025 nên chỉ ghi mức tăng nguồn công bố.'},
    {id: 'hkOtpHeat', type: 'brief', src: [['Cục Hàng không – báo cáo thống kê đúng giờ, chậm, hủy chuyến', 'https://caa.gov.vn/bao-cao-thong-ke.htm']],
      render: () => {
        const o = obs('caa_otp'), f = obs('caa_flights'), months = [...new Set(o.map(x => x.period_start))].sort(), als = [...new Set(o.map(x => x.segment))];
        const fl = (a, m) => f.find(x => x.segment === a && x.period_start === m)?.value;
        als.sort((a, b) => (fl(b, months.at(-1)) || 0) - (fl(a, months.at(-1)) || 0));
        const col = v => v == null ? 'transparent' : `rgba(${v >= 80 ? '39,175,149' : '209,88,63'},${(Math.min(Math.abs(v - 80), 20) / 20 * 0.75 + 0.12).toFixed(2)})`;
        return `<div class="hk-heat" style="--hk-cols:${months.length}"><div class="hk-hrow hk-hhead"><span></span>${months.map(m => `<span>T${Number(m.slice(5, 7))}/${m.slice(2, 4)}</span>`).join('')}</div>${als.map(a => `<div class="hk-hrow"><span>${esc(a)}</span>${months.map(m => { const v = o.find(x => x.segment === a && x.period_start === m)?.value, n = fl(a, m); return `<span style="background:${col(v)}" title="${esc(a)} · T${Number(m.slice(5, 7))}/${m.slice(0, 4)}: đúng giờ ${v == null ? '—' : nf(v, 1) + '%'} · ${n == null ? '—' : nf(n, 0)} chuyến cất cánh">${v == null ? '' : nf(v, 0)}</span>`; }).join('')}</div>`).join('')}</div>`;
      },
      method: 'Chuyến cất cánh của hãng Việt Nam tại các cảng Việt Nam, theo báo cáo Cảng vụ do Cục Hàng không tổng hợp. Dùng số theo từng hãng; cột "Tổng" in trong file tháng 9/2026 không khớp tổng các hãng nên không dùng. Bamboo Airways giảm từ 725 chuyến (T6) xuống 38 chuyến (T9/2026).'},
    {id: 'hkRpk', type: 'mseries', table: 'tbl-rpk', unit: '', digits: 0, months: 36, src: [NSO], rawLabel: 'Giá trị',
      series: [['Luân chuyển (triệu HK.km)', 'air_paxkm', C.plum], ['Khách vận chuyển (nghìn lượt)', 'air_pax', C.navy, 'line']],
      method: 'NSO: luân chuyển hành khách đường hàng không (triệu HK.km, tương đương RPK của doanh nghiệp vận tải Việt Nam) và số khách. HK.km tăng nhanh hơn số khách nghĩa là cự ly bình quân dài ra. Thiếu ASK và hệ số tải 2026 (HVN, VJC chưa công bố) nên chưa tính RPK/ASK, chưa có yield.'},
    {id: 'hkShare', type: 'annual', table: 'tbl-share', unit: '%', digits: 1, stackable: true, period: '2024', src: [SHS],
      categories: ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'],
      series: ['Vietjet Air', 'Vietnam Airlines', 'Pacific Airlines', 'Bamboo Airways', 'Khác'].map((al, i) => [al, ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'].map(y => obs('dom_share', {segment: al}).find(o => o.period_label === y)?.value ?? null), [C.red, C.navy, C.sky, C.green, C.grey][i]]),
      method: 'SHS tr. 23 (SHS tổng hợp). Vietnam Airlines và Pacific Airlines ghi riêng như bảng gốc; SHS không tách VASCO. Nhóm Vietnam Airlines = Vietnam Airlines + Pacific Airlines (+ VASCO nếu có trong "Khác"). Tổng một số năm khác 100% do làm tròn ở nguồn.'},
    {id: 'hkFleetReg', type: 'brief', src: [CAA10],
      render: () => {
        const reg = obs('caa_aircraft_registered').sort((a, b) => a.period_end < b.period_end ? -1 : 1), t = [];
        reg.forEach((r, i) => t.push([`Đăng ký · ${r.period_label}`, nf(r.value, 0) + ' tàu', i === reg.length - 1 ? 'số dư tại ngày, gồm tàu đang dừng khai thác' : 'số dư tại ngày', i === reg.length - 1]));
        obs('caa_aircraft_commercial').forEach(r => t.push([`Khai thác thương mại · ${r.period_label}`, nf(r.value, 0) + ' tàu', (obs('caa_aircraft_grounded')[0] ? nf(obs('caa_aircraft_grounded')[0].value, 0) + ' tàu dừng do lỗi động cơ' : '')]));
        obs('caa_aircraft_scheduled').forEach(r => t.push([`Khai thác thường lệ · ${r.period_label}`, nf(r.value, 0) + ' tàu', 'báo dẫn Cục HK']));
        obs('caa_fleet_airline').forEach(r => t.push([`${r.segment} · ${r.period_label}`, nf(r.value, 0) + ' tàu', Object.entries(r.breakdown || {}).map(([k, v]) => k + ' ' + v).join(', ')]));
        return `<div class="rf-tiles hk-fleet">${t.map(([k, v, s, hi]) => `<div class="rf-tile${hi ? ' rf-tile-hi' : ''}"><small>${esc(k)}</small><b>${esc(v)}</b><span>${esc(s)}</span></div>`).join('')}</div>`;
      },
      method: 'Bốn khái niệm khác nhau, không cộng lẫn: tàu đăng ký quốc tịch (số dư theo sổ đăng bạ), tàu khai thác thương mại, tàu khai thác thường lệ, đội tàu theo hãng do Cục Hàng không nêu. Tàu đặt mua và tàu bàn giao chưa có nguồn công bố đầy đủ nên không vẽ; không suy ra ASK từ số tàu.'},
    {id: 'hkOtp', type: 'hbar', table: 'tbl-otp', unit: '%', digits: 1, period: '2024', src: [SHS], labelW: 150,
      items: obs('otp_2024').sort((a, b) => b.value - a.value).map(o => [o.segment, o.value, o.segment === 'Vietjet Air' ? C.red : o.segment === 'Vietnam Airlines' ? C.navy : C.sky]),
      method: 'SHS tr. 24, tỷ lệ cất cánh đúng giờ năm 2024. Heatmap OTP theo tháng: Cục Hàng không đăng báo cáo dạng bài, chưa nạp tự động được nên để ngoài bản này.'},
    {id: 'hkFuel', id2: 'hkFx', type: 'fuelfx', table: 'tbl-fuelfx', from: '2025-01'},
    {id: 'hkLtProg', type: 'progress', table: 'tbl-ltprog', src: [LT],
      items: (EX.longthanh_progress || []).map(([l, v, n], i) => [l, v, [C.navy, C.gold, C.teal][i % 3], n]),
      method: 'Dự án thành phần 3 (ACV làm chủ đầu tư). Hai tỷ lệ đo khác nhau: phần trăm giá trị hợp đồng theo khối lượng đã thực hiện, và phần trăm vốn đã giải ngân.'},
    {id: 'hkAcvPax', type: 'cum', table: 'tbl-acvpax', views: [['acv_pax', 'Hành khách'], ['acv_cargo', 'Hàng hóa']], segs: [['dom', 'Nội địa', C.navy], ['intl', 'Quốc tế', C.teal], ['total', 'Tổng', C.grey]],
      method: 'Lượt khách, tấn hàng qua hệ thống cảng do ACV quản lý (báo cáo thường niên ACV; 9T/2026 theo số ACV công bố trên báo). 9T/2026 chưa tách nội địa và hàng theo tuyến nên để trống, không suy ra.'},
    {id: 'hkAcvCapex', type: 'fin', table: 'tbl-acvcapex', quarters: 16, syms: [['ACV', C.gold]],
      items: [['cip', 'XDCB dở dang (số dư)', C.gold], ['capex', 'Chi đầu tư TSCĐ trong quý', C.plum], ['cfo', 'CFO', C.navy, 'line'], ['fcf', 'CFO − capex', C.red, 'line']],
      method: 'Capex = tiền chi mua sắm, xây dựng TSCĐ trên báo cáo lưu chuyển tiền tệ. XDCB dở dang là số dư cuối quý, khác dòng tiền chi trong quý. Giá trị hợp đồng Long Thành theo dõi ở mục tiến độ.'},
    {id: 'hkCargo', type: 'cum', table: 'tbl-cargo', views: [['caa_cargo_airport', 'Hàng qua cảng']], segs: [['dom', 'Nội địa', C.navy], ['intl', 'Quốc tế', C.plum], ['total', 'Tổng', C.grey]],
      method: 'Hàng hóa thông qua cảng hàng không (Cục Hàng không), gồm hàng do hãng nước ngoài chở. Khác chuỗi NSO bên cạnh (hàng do doanh nghiệp vận tải Việt Nam chở) và khác sản lượng nhà ga SCSC.'},
    {id: 'hkAirFreight', type: 'mseries', table: 'tbl-airfreight', unit: 'nghìn tấn', digits: 1, months: 36, src: [NSO],
      series: [['Hàng hóa vận chuyển đường hàng không', 'air_freight', C.plum]],
      method: 'NSO, biểu Vận tải hàng hóa, dòng Hàng không: hàng do doanh nghiệp vận tải Việt Nam chở (lớp hãng vận chuyển). Lớp cảng tiếp nhận là chuỗi Cục Hàng không bên cạnh; lớp nhà ga xử lý là SCSC bên dưới.'},
    {id: 'hkScsTon', type: 'cum', table: 'tbl-scston', views: [['scs_tonnage', 'Sản lượng']], segs: [['intl', 'Quốc tế', C.plum], ['dom', 'Nội địa', C.navy]], digits: 0, stackable: true,
      method: 'Bản tin nhà đầu tư và báo cáo thường niên SCSC. Q2, Q3, Q4 tính từ chênh lệch lũy kế cùng định nghĩa ("tính từ lũy kế"); Q1 là số công bố. Q1–Q3/2024 chưa có bản tin trên scsc.vn nên để trống.'},
    {id: 'hkScsYield', type: 'annual', table: 'tbl-scsyield', unit: 'nghìn đ/tấn', digits: 0, period: scsQ.cats.at(-1), src: [['BCTC quý SCS (VNDirect)', VND[1]], ['SCSC – bản tin nhà đầu tư', 'https://www.scsc.vn/vn/info_cm.aspx?CMID=9']],
      categories: scsQ.cats, series: [['Doanh thu thuần ÷ sản lượng', scsQ.yld, C.plum]],
      method: 'Doanh thu thuần hợp nhất quý của SCS ÷ tổng tấn hàng qua nhà ga SCSC cùng quý. Cùng phạm vi nhà ga SCSC, nhưng doanh thu gồm cả dịch vụ khác ngoài xử lý hàng nên là chỉ số gần đúng.'},
    {id: 'hkSvcFin', type: 'fin', table: 'tbl-svcfin', quarters: 12, syms: [['SCS', C.plum], ['NCT', C.sky], ['SGN', C.green], ['AST', C.gold], ['SAS', C.teal]],
      views: [['revenue', 'Doanh thu thuần', 'tỷ đồng'], ['npat', 'LNST', 'tỷ đồng'], ['margin_net', 'Biên ròng', '%'], ['tax', 'Thuế TNDN', 'tỷ đồng']],
      method: 'BCTC hợp nhất quý từng mã, không cộng. SGN: số chuyến phục vụ, hợp đồng theo hãng chưa có nguồn công khai theo quý. AST: chưa có lượt khách theo nhà ga có điểm bán, nên chỉ trình bày doanh thu.'},
    {id: 'hkFinAll', type: 'fin', table: 'tbl-finall', quarters: 12, syms: [['HVN', C.navy], ['VJC', C.red], ['ACV', C.gold]],
      views: [['revenue', 'Doanh thu thuần', 'tỷ đồng'], ['npat', 'LNST', 'tỷ đồng'], ['margin_net', 'Biên ròng', '%']],
      method: 'BCTC hợp nhất quý, từng mã, không cộng.'},
    {id: 'hkNetDebt', type: 'fin', table: 'tbl-netdebt', quarters: 12, syms: [['HVN', C.navy], ['VJC', C.red], ['ACV', C.gold]],
      views: [['netdebt', 'Nợ vay ròng', 'tỷ đồng'], ['interest', 'Chi phí lãi vay', 'tỷ đồng']],
      method: 'Nợ vay ròng = vay và nợ thuê tài chính ngắn hạn + dài hạn − tiền và tương đương tiền − đầu tư tài chính ngắn hạn. Nghĩa vụ thuê hoạt động tàu bay (VAS không ghi lên bảng cân đối) không nằm trong số này.'},
    {id: 'hkOps', type: 'tiles', src: [HVN9, VJC9, ACV9],
      items: [['HVN · 9T/2026', 'hơn 20 triệu khách', '+4,3%; hơn 122 nghìn chuyến; 274 nghìn tấn hàng (+9%)'], ['VJC · Q3/2026', '7,3 triệu khách', '39 nghìn chuyến; 9T: 111,7 nghìn chuyến, hơn 20,7 triệu khách'],
        ['VJC · 9T/2026', '74.385 tỷ doanh thu', '+41%, hợp nhất; LNST 1.721 tỷ'], ['ACV · 9T/2026', '94,1 triệu lượt khách', '+8,6%; quốc tế 36 triệu (+10,8%); hàng 1,4 triệu tấn (+9,8%)']],
      method: 'Số doanh nghiệp công bố. HVN, VJC chưa công bố ASK, RPK, hệ số tải năm 2026.'},
  ],
  topics: {
    'hk-t1': ['Chi phí nhiên liệu trên ghế, biên gộp HVN, VJC', 'EIA theo ngày; chi phí nhiên liệu trong thuyết minh BCTC quý 4/2026; mức phụ thu nhiên liệu và giá vé', [['#rf-q-fuel', 'Nhiên liệu, tỷ giá'], ['#rf-mt14-sector', 'Biên HVN, VJC']]],
    'hk-t2': ['Sản lượng và yield quốc tế của HVN, VJC; lượt khách quốc tế qua ACV', 'Số 11 tháng của Cục HK (khách quốc tế toàn thị trường và hãng Việt); lịch bay mùa Hè 2027; số chuyến theo hãng trong báo cáo đúng giờ', [['#rf-q-share', 'Thị phần quốc tế'], ['#rf-q-sched', 'Lịch bay'], ['#rf-q-otp', 'Chuyến theo hãng']]],
    'hk-t3': ['Capex, XDCB dở dang, thời điểm bắt đầu khấu hao của ACV; phân chia lưu lượng Tân Sơn Nhất – Long Thành', 'Mốc chạy thử, cấp phép khai thác của Bộ Xây dựng, Cục HK; BCTC quý 4/2026 của ACV', [['#rf-q-lt', 'Tiến độ Long Thành'], ['#rf-q-capex', 'Capex ACV']]],
  },
  section: {demand: ['mt2', 'demand'], supply: ['mt2', 'supply'], cost: ['mt2', 'cost'], airport: ['mt2', 'airport'], cargo: ['mt2', 'cargo']},
  tree: {
    // 28/11/2026 (khung chuẩn Điện): Tổng quan dùng thanh .ov-nav (dòng phụ = sub). Bức tranh ngành: ô số, "Dữ liệu mới nhất",
    // luồng Đầu vào → Sản xuất → Đầu ra ở các sub-tab phân khúc; câu hỏi tách lại để mỗi khâu có chart trả lời (thẻ dời, không nhân bản).
    mt1: {title: 'Tổng quan ngành', subs: [
      {k: 'map', t: 'Bản đồ ngành', sub: 'Ai thu tiền từ một chuyến bay', d: 'Cách từng doanh nghiệp thu tiền từ một chuyến bay.', items: [
        {q: 'Một chuyến bay tạo doanh thu cho những ai?', id: 'rf-q-map', take: ['hk-01']}]},
      {k: 'model', t: 'Mô hình kiếm tiền', sub: '6 mô hình: hãng bay, cảng, nhà ga, dịch vụ', d: 'Sáu sơ đồ: ai trả tiền, tính tiền theo đơn vị nào, biến nào làm doanh thu tăng, chi phí nào quyết định biên.', items: [
        {q: 'Mỗi doanh nghiệp kiếm tiền từ đâu, biến nào quyết định biên?', id: 'rf-q-model', take: ['hk-05']}]},
    ]},
    mt2: {title: 'Bức tranh ngành', subs: [
      {k: 'demand', t: 'Nhu cầu vận tải', d: 'Khách vận chuyển, lượt khách qua cảng, khách quốc tế đến: ba phép đo khác nhau.', asof: ASOF.demand, kpis: ['spk-pax', 'spk-visair', 'spk-carried'], items: [
        {grp: 'Khách vận chuyển'},
        {q: 'Cầu tăng nhờ nội địa hay quốc tế?', id: 'rf-q-carried', meta: 'triệu lượt khách · Cục Hàng không, năm và lũy kế · nghìn lượt/tháng · NSO', take: ['hk-10', 'hk-11']},
        {grp: 'Thị phần quốc tế'},
        {q: 'Hãng Việt có tăng cùng tốc độ với thị trường quốc tế?', id: 'rf-q-share', meta: 'thị phần = khách QT hãng Việt ÷ khách QT vận chuyển toàn thị trường', take: ['hk-15', 'hk-12']},
        {grp: 'Thị trường nguồn'},
        {q: 'Khách quốc tế đến Việt Nam tập trung ở thị trường nào?', id: 'rf-q-vis', meta: 'nghìn lượt · NSO theo quốc tịch', take: ['hk-13', 'hk-14']}]},
      {k: 'supply', t: 'Cung ghế, đội bay & cạnh tranh', d: 'Đội tàu bay → lịch bay, chuyến bay → khách-km, thị phần và đúng giờ.', asof: ASOF.supply, kpis: ['spk-sched', 'spk-rpk', 'spk-fleet'],
        flow: [['in', 'Đầu vào', 'Đội tàu bay'], ['prod', 'Sản xuất', 'Lịch bay và chuyến bay'], ['out', 'Đầu ra', 'Khách-km và thị phần']], items: [
        {stage: 'in'},
        {q: 'Đội tàu bay đang tăng hay giảm?', id: 'rf-q-fleet', meta: 'tàu bay · số dư tại ngày, Cục Hàng không', take: ['hk-24']},
        {stage: 'prod'},
        {q: 'Cung ghế quốc tế mùa này tăng bao nhiêu, ai tăng?', id: 'rf-q-sched', meta: 'chuyến khứ hồi/tuần · lịch bay được duyệt', take: ['hk-20']},
        {q: 'Hãng nào khai thác nhiều chuyến, bay đúng giờ?', id: 'rf-q-otp', meta: '% chuyến cất cánh đúng giờ · theo tháng (Cục Hàng không), năm 2024 (SHS)', take: ['hk-26', 'hk-25']},
        {stage: 'out'},
        {q: 'Khách-km có tăng nhanh hơn số khách?', id: 'rf-q-rpk', meta: 'triệu HK.km, nghìn lượt · NSO', take: ['hk-21']},
        {q: 'Thị phần nội địa dịch chuyển về hãng nào?', id: 'rf-q-domshare', meta: '% thị phần nội địa · SHS tổng hợp', take: ['hk-22']}]},
      {k: 'cost', t: 'Nhiên liệu & tỷ giá', d: 'Jet fuel và USD/VND → chi phí trên mỗi chuyến bay → biên và nợ vay của hãng bay.', asof: ASOF.cost, kpis: ['spk-fuel', 'spk-iata', 'spk-fx'],
        flow: [['in', 'Đầu vào', 'Jet fuel và USD/VND'], ['prod', 'Sản xuất', 'Chi phí khai thác chuyến bay'], ['out', 'Đầu ra', 'Biên và nợ vay hãng bay']], items: [
        {stage: 'in'},
        {q: 'Giá nhiên liệu bay và tỷ giá đang ở đâu?', id: 'rf-q-fuel', meta: 'USD/gallon (EIA), đồng/USD (NHNN) · bình quân tháng; bảng bình quân quý', take: ['hk-30']},
        {stage: 'prod'},
        {link: ['#rf-q-model', 'Tổng quan ngành › Mô hình kiếm tiền', 'Nhiên liệu, thuê tàu, bảo dưỡng trong biên khai thác', 'Khoản chi nào tính bằng USD, khoản nào theo chuyến']},
        {link: ['#rf-q-sched', 'Cung ghế, đội bay › 2.2', 'Số chuyến theo lịch bay mùa', 'Khối lượng bay quyết định lượng nhiên liệu tiêu thụ']},
        {stage: 'out'},
        // Câu rf-q-fin, rf-q-debt bị aviation-finance.js dời vào cụm 1 và 5 khi dựng → dẫn tới sub-tab, không tới id câu.
        {link: ['#rf-mt14-sector', 'Tài chính ngành › 01', 'Biên lợi nhuận và nợ vay của hãng bay', 'Biên gộp, biên ròng, nợ vay ròng cộng gộp và từng mã (HVN, VJC)']}]},
      {k: 'airport', t: 'Sân bay, công suất & capex ACV', d: 'Vốn đầu tư (Long Thành, capex ACV) → mạng cảng, công suất → lưu lượng qua ACV.', asof: ASOF.airport, kpis: ['spk-apax', 'spk-acv', 'spk-lt'],
        flow: [['in', 'Đầu vào', 'Long Thành và capex ACV'], ['prod', 'Sản xuất', 'Mạng cảng và công suất'], ['out', 'Đầu ra', 'Lượt khách, hàng qua ACV']], items: [
        {stage: 'in'},
        {q: 'Long Thành đã làm được bao nhiêu?', id: 'rf-q-lt', meta: '% giá trị hợp đồng theo khối lượng và % giải ngân · dự án thành phần 3', take: ['hk-42']},
        {q: 'ACV đang chi đầu tư bao nhiêu, dòng tiền có đủ bù?', id: 'rf-q-capex', meta: 'tỷ đồng · XDCB dở dang, chi đầu tư TSCĐ, CFO theo quý', take: ['hk-44']},
        {stage: 'prod'},
        {q: 'Các cảng nằm đâu, ai khai thác?', id: 'rf-q-airmap', take: ['hk-40']},
        {stage: 'out'},
        {q: 'Lưu lượng qua ACV tăng bao nhiêu, quốc tế hay nội địa?', id: 'rf-q-acv', meta: 'triệu lượt, nghìn tấn · năm và lũy kế', take: ['hk-43']},
        {link: ['#rf-q-share', 'Nhu cầu vận tải › 1.2', 'Lượt khách qua mọi cảng (Cục Hàng không)', 'Nội địa, quốc tế; gồm cảng không do ACV quản lý']}]},
      {k: 'cargo', t: 'Hàng hóa & dịch vụ sân bay', d: 'Hàng hãng chở, hàng qua cảng → nhà ga xử lý → doanh thu doanh nghiệp dịch vụ.', asof: ASOF.cargo, kpis: ['spk-cargo', 'spk-cargoport', 'spk-scs'],
        flow: [['in', 'Đầu vào', 'Hàng hãng chở, hàng qua cảng'], ['prod', 'Sản xuất', 'Nhà ga hàng hóa xử lý'], ['out', 'Đầu ra', 'Doanh thu dịch vụ sân bay']], items: [
        {stage: 'in'},
        {q: 'Hàng hóa hàng không tăng ở lớp nào?', id: 'rf-q-cargo', meta: 'triệu tấn qua cảng · nghìn tấn hãng Việt chở', take: ['hk-50', 'hk-51']},
        {stage: 'prod'},
        {q: 'Nhà ga SCSC xử lý bao nhiêu, thu bao nhiêu trên mỗi tấn?', id: 'rf-q-scs', meta: 'tấn · nghìn đ/tấn', take: ['hk-52', 'hk-53']},
        {stage: 'out'},
        {q: 'Doanh nghiệp dịch vụ sân bay tăng trưởng ra sao?', id: 'rf-q-svc', meta: 'tỷ đồng, % · BCTC hợp nhất quý', take: ['hk-54']}]},
    ]},
    mt14: {title: 'Tài chính ngành', subs: [
      {k: 'sector', t: 'Tài chính ngành', d: 'Rổ doanh nghiệp theo dõi (mặc định HVN, VJC, ACV): nhóm nào kéo lợi nhuận, chuyển lợi nhuận thành tiền, đầu tư và cần thêm vốn; bấm xuống từng mã.', items: [
        {q: 'Doanh thu, lợi nhuận từng mã đi thế nào?', id: 'rf-q-fin', take: ['hk-60']},
        {q: 'Nợ vay ròng của từng mã tăng hay giảm?', id: 'rf-q-debt', take: ['hk-61']}]},
      {k: 'listed', t: 'Doanh nghiệp niêm yết', d: 'Định giá, hiệu quả và lợi nhuận của 8 doanh nghiệp hàng không; so sánh chi tiết theo quý; số vận hành doanh nghiệp công bố.', items: [
        {q: 'Doanh nghiệp công bố vận hành 9T/2026 ra sao?', id: 'rf-q-ops', take: ['hk-62']}]},
    ]},
  },
};
})();
