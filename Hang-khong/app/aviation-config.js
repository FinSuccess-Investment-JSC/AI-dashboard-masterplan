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

// Jet fuel: điểm tháng mới nhất cho ô số đầu sub-tab.
const fuelM = (W.fuel || {}).monthly || [], fuelL = fuelM.at(-1), fuelLY = fuelL && fuelM.find(r => r[0] === (Number(fuelL[0].slice(0, 4)) - 1) + fuelL[0].slice(4));
// SCS doanh thu trên tấn: doanh thu thuần quý (VNDirect, tỷ đồng) ÷ sản lượng nhà ga SCSC cùng quý (tấn) → nghìn đồng/tấn.
const scsQ = (() => {
  const by = {}; obs('scs_tonnage').forEach(o => { const k = o.period_label; by[k] = by[k] || {pe: o.period_end, v: 0, n: 0}; by[k].v += o.value; by[k].n++; });
  const per = Object.entries(by).filter(([, x]) => x.n === 2).sort((a, b) => a[1].pe < b[1].pe ? -1 : 1);
  const rev = p => { const [q, y] = p.split('/'), i = (F.periods || []).indexOf(y + 'Q' + q.slice(1)); return i >= 0 ? F.data?.SCS?.revenue?.[i] : null; };
  return {cats: per.map(([k]) => k), yld: per.map(([k, x]) => { const r = rev(k); return Number.isFinite(r) ? Math.round(r * 1e6 / x.v) : null; })};
})();
const NOTES = {};
function note(k) { const p = document.createElement('p'); p.className = 'rf-note hk-insight'; p.innerHTML = '<b>Nhận định:</b> ' + (NOTES[k] ? NOTES[k]() : ''); return p; }

window.PKG = {
  key: 'aviation', prefix: 'hk', label: 'Hàng không', dataVar: 'AVIATION_DATA',
  ticker: {commodity: [], ratio: []},
  wide: ['hk-01', 'hk-05', 'hk-13', 'hk-30', 'hk-32', 'hk-40', 'hk-41', 'hk-62'],
  kpis: [
    {spark: 'spk-pax', series: 'air_pax', unit: 'nghìn lượt', digits: 0, note: 'NSO', color: C.navy},
    {spark: 'spk-visair', series: 'visitors_air', unit: 'nghìn lượt', div: 1000, digits: 0, note: 'NSO', color: C.teal},
    {spark: 'spk-jet', fixed: fuelL ? [nf(fuelL[1], 2), 'USD/gallon', 'T' + Number(fuelL[0].slice(5)) + '/' + fuelL[0].slice(0, 4) + ' · bình quân tháng EIA', fuelLY ? sg((fuelL[1] / fuelLY[1] - 1) * 100, 0) + '% so cùng kỳ' : ''] : ['—', '', '', ''], spark2: fuelM.slice(-24).map(r => r[1]), color: C.red},
    {spark: 'spk-cargo', series: 'air_freight', unit: 'nghìn tấn', digits: 1, note: 'NSO', color: C.plum},
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
            <a href="#rf-q-airfin">Doanh thu, biên và dòng tiền <span aria-hidden="true">›</span></a>
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
    {id: 'hkModels', type: 'models', items: [
      ['Hãng bay truyền thống', 'HVN', 'Vé hành khách nội địa, quốc tế; hàng hóa; hợp nhất Pacific Airlines, VASCO', 'Hệ số tải và yield; giá nhiên liệu; USD/VND (thuê tàu, nợ USD)', [['#rf-q-carried', 'Khách vận chuyển'], ['#rf-q-fuel', 'Nhiên liệu, tỷ giá']]],
      ['Hãng bay chi phí thấp', 'VJC', 'Vé hành khách, doanh thu phụ trợ, bán và thuê lại tàu bay', 'Cung ghế so với cầu; nhiên liệu; lãi vay và tỷ giá; số tàu bàn giao', [['#rf-q-sched', 'Lịch bay'], ['#rf-q-airfin', 'Doanh thu, biên, dòng tiền']]],
      ['Khai thác cảng hàng không', 'ACV', 'Phí hành khách, cất hạ cánh, điều hành bay; cho thuê mặt bằng', 'Lượt khách quốc tế qua cảng (phí cao hơn nội địa); tỷ giá (nợ yên); tiến độ Long Thành', [['#rf-q-acv', 'Khách qua ACV'], ['#rf-q-lt', 'Long Thành']]],
      ['Dịch vụ hàng hóa, mặt đất, bán lẻ', 'SCS · NCT · SGN · AST · SAS', 'Phí xử lý hàng theo tấn, phục vụ mặt đất theo chuyến, bán lẻ theo khách', 'Hàng quốc tế qua nhà ga; hợp đồng với hãng; lượt khách quốc tế tại nhà ga có điểm bán', [['#rf-q-scs', 'Hàng qua SCSC'], ['#rf-q-svc', 'Doanh thu dịch vụ']]]],
      src: [SHS, ['BCTC và báo cáo thường niên doanh nghiệp', '#rf-q-fin']]},
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
        return `<div class="rf-tiles">${rows.map(([o, q]) => `<div class="rf-tile${o === rows.at(-1)[0] ? ' rf-tile-hi' : ''}"><small>${esc(o.period_label)}</small><b>${nf(o.value / q.value * 100, 1)}%</b><span>${nf(o.value, 1)} ÷ ${nf(q.value, 1)} triệu khách</span></div>`).join('')}</div>`;
      }},
    {id: 'hkVisHeat', type: 'heat', table: 'tbl-visheat', months: 18, src: [NSO], aria: 'Khách quốc tế đến theo thị trường và tháng',
      rows: [['vis_cn', 'Trung Quốc'], ['vis_kr', 'Hàn Quốc'], ['vis_tw', 'Đài Loan'], ['vis_jp', 'Nhật Bản'], ['vis_ru', 'Nga'], ['vis_us', 'Hoa Kỳ'], ['vis_in', 'Ấn Độ'], ['vis_kh', 'Cam-pu-chia'], ['vis_ph', 'Phi-li-pin'], ['vis_au', 'Úc'], ['vis_my', 'Ma-lai-xi-a'], ['vis_sg', 'Xin-ga-po'], ['vis_th', 'Thái Lan']],
      method: 'Khách quốc tế đến Việt Nam theo quốc tịch, mọi phương tiện (đường không chiếm phần lớn), NSO. Đây là khách nhập cảnh, khác khách vận chuyển và lượt khách qua cảng. Tần suất lịch bay theo từng thị trường chưa có số công bố theo quốc gia nên chưa đặt cạnh.'},
    {id: 'hkVisAir', type: 'mseries', table: 'tbl-visair', unit: 'nghìn lượt', div: 1000, digits: 0, months: 36, src: [NSO],
      series: [['Đến bằng đường không', 'visitors_air', C.teal], ['Tổng khách quốc tế đến', 'tourists', C.grey, 'line']],
      method: 'NSO, biểu Khách quốc tế đến Việt Nam, phân theo phương tiện đến. Số tháng mới nhất là ước tính.'},
    {id: 'hkSched', type: 'brief', src: [['Cục Hàng không – lịch bay mùa Đông 2026 (25/11/2026)', 'https://caa.gov.vn/hoat-dong-nganh/thi-truong-van-tai-hang-khong-viet-nam-tiep-tuc-tang-truong-mo-rong-ket-noi-trong-lich-bay-mua-dong-2026-20261125192204982.htm'], ['VTV – lịch bay mùa Hè 2026 (dẫn Cục HK)', 'https://vtv.vn/hon-45-trieu-luot-hanh-khach-di-may-bay-trong-6-thang-100260722155525504.htm']],
      render: () => {
        const grp = (title, unit, rows, col) => { const mx = Math.max(...rows.map(r => r[1]), 1); return `<div class="hk-hb"><h5>${esc(title)} <small>${esc(unit)}</small></h5>${rows.map(([l, v, nt]) => `<div class="hk-hbr" title="${esc(l)}: ${nf(v, 0)} ${esc(unit)}${nt ? ' · ' + esc(nt) : ''}"><span>${esc(l)}</span><i><b style="width:${(v / mx * 100).toFixed(1)}%;background:${col}"></b></i><em>${nf(v, 0)}${nt ? ' <small>' + esc(nt) + '</small>' : ''}</em></div>`).join('')}</div>`; };
        const si = obs('caa_sched_intl').sort((a, b) => a.period_start < b.period_start ? -1 : 1);
        const mk = obs('caa_sched_market').sort((a, b) => b.value - a.value), al = obs('caa_sched_airline_intl'), dm = obs('caa_sched_dom').filter(o => o.segment !== 'total').sort((a, b) => b.value - a.value), dt = obs('caa_sched_dom', {segment: 'total'})[0];
        return `<div class="hk-hbs">${grp('Quốc tế theo mùa', 'chuyến khứ hồi/tuần', si.map(o => [o.period_label, o.value, o.yoy != null ? sg(o.yoy, 1) + '% so cùng mùa năm trước' : '']), C.navy)}
          ${grp('Quốc tế mùa Đông 2026 theo thị trường', 'chuyến khứ hồi/tuần', mk.map(o => [o.segment, o.value]).concat(al.map(o => [o.segment + ' (hãng)', o.value])), C.teal)}
          ${grp('Nội địa mùa Đông 2026 theo hãng' + (dt ? ' · tổng ' + nf(dt.value, 0) : ''), 'chuyến/tuần', dm.map(o => [o.segment, o.value]), C.gold)}</div>`;
      },
      method: 'Lịch bay Cục Hàng không cấp phép theo mùa IATA (mùa Hè, mùa Đông); quốc tế tính chuyến khứ hồi/tuần, nội địa tính chuyến/tuần. Đây là cung dự kiến, khác số chuyến đã thực hiện (chart OTP bên dưới). Cục Hàng không chỉ nêu ba thị trường lớn nhất, không tách số chuyến quốc tế của hãng Việt và hãng nước ngoài; mùa Hè 2026 lấy từ VTV dẫn Cục HK. Không có số tuyệt đối mùa Đông, Hè 2025 nên chỉ ghi mức tăng nguồn công bố.'},
    {id: 'hkOtpHeat', type: 'brief', src: [['Cục Hàng không – báo cáo thống kê đúng giờ, chậm, hủy chuyến', 'https://caa.gov.vn/bao-cao-thong-ke.htm']],
      render: () => {
        const o = obs('caa_otp'), f = obs('caa_flights'), months = [...new Set(o.map(x => x.period_start))].sort(), als = [...new Set(o.map(x => x.segment))];
        const fl = (a, m) => f.find(x => x.segment === a && x.period_start === m)?.value;
        als.sort((a, b) => (fl(b, months.at(-1)) || 0) - (fl(a, months.at(-1)) || 0));
        const col = v => v == null ? 'transparent' : `rgba(${v >= 80 ? '39,175,149' : '209,88,63'},${(Math.min(Math.abs(v - 80), 20) / 20 * 0.75 + 0.12).toFixed(2)})`;
        return `<div class="hk-heat" style="--hk-cols:${months.length}"><div class="hk-hrow hk-hhead"><span></span>${months.map(m => `<span>T${Number(m.slice(5, 7))}/${m.slice(2, 4)}</span>`).join('')}</div>${als.map(a => `<div class="hk-hrow"><span>${esc(a)}</span>${months.map(m => { const v = o.find(x => x.segment === a && x.period_start === m)?.value, n = fl(a, m); return `<span style="background:${col(v)}" title="${esc(a)} · T${Number(m.slice(5, 7))}/${m.slice(0, 4)}: đúng giờ ${v == null ? '—' : nf(v, 1) + '%'} · ${n == null ? '—' : nf(n, 0)} chuyến cất cánh">${v == null ? '' : nf(v, 0)}</span>`; }).join('')}</div>`).join('')}</div><p class="hk-heat-note">Ô = % chuyến cất cánh đúng giờ (xanh ≥ 80%, đỏ &lt; 80%); rê chuột xem số chuyến. Không có tháng 1, 2, 7/2026: Cục Hàng không chưa đăng báo cáo các tháng này.</p>`;
      },
      method: 'Chuyến cất cánh của hãng Việt Nam tại các cảng Việt Nam, theo báo cáo Cảng vụ do Cục Hàng không tổng hợp. Dùng số theo từng hãng; cột "Tổng" in trong file tháng 9/2026 không khớp tổng các hãng nên không dùng. Bamboo Airways giảm từ 725 chuyến (T6) xuống 38 chuyến (T9/2026).'},
    {id: 'hkRpk', type: 'mseries', table: 'tbl-rpk', unit: '', digits: 0, months: 36, src: [NSO], rawLabel: 'Giá trị',
      series: [['Luân chuyển (triệu HK.km)', 'air_paxkm', C.plum], ['Khách vận chuyển (nghìn lượt)', 'air_pax', C.navy, 'line']],
      method: 'NSO: luân chuyển hành khách đường hàng không (triệu HK.km, tương đương RPK của doanh nghiệp vận tải Việt Nam) và số khách. HK.km tăng nhanh hơn số khách nghĩa là cự ly bình quân dài ra. Thiếu ASK và hệ số tải 2026 (HVN, VJC chưa công bố) nên chưa tính RPK/ASK, chưa có yield.'},
    {id: 'hkShare', type: 'annual', table: 'tbl-share', unit: '%', digits: 1, stackable: true, period: '2024', src: [SHS],
      categories: ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'],
      series: ['Vietjet Air', 'Vietnam Airlines', 'Pacific Airlines', 'Bamboo Airways', 'Khác'].map((al, i) => [al, ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'].map(y => obs('dom_share', {segment: al}).find(o => o.period_label === y)?.value ?? null), [C.red, C.navy, C.sky, C.green, C.grey][i]]),
      method: 'SHS tr. 23 (SHS tổng hợp). Vietnam Airlines và Pacific Airlines ghi riêng như bảng gốc; SHS không tách VASCO. Nhóm Vietnam Airlines = Vietnam Airlines + Pacific Airlines (+ VASCO nếu có trong "Khác"). Tổng một số năm khác 100% do làm tròn ở nguồn.'},
    {id: 'hkFleet', type: 'annual', table: 'tbl-fleet', unit: 'tàu bay', digits: 0, stackable: true, period: '2024 thực tế · 2025–2027 SHS dự báo', src: [SHS],
      categories: ['2024', '2025F', '2026F', '2027F'], conf: [true, false, false, false],
      series: ['HVN', 'VJC', 'Bamboo', 'Vietravel', 'Sun PhuQuoc'].map((al, i) => [al, ['2024', '2025F', '2026F', '2027F'].map(y => obs('fleet_operating_shs', {segment: al}).find(o => o.period_label === y)?.value ?? null), [C.navy, C.red, C.green, C.gold, C.plum][i]]),
      method: 'Tàu bay hoạt động theo bảng SHS tr. 25; 2025F–2027F là dự báo của SHS (cột màu nhạt), không phải số đặt mua, bàn giao hay đăng ký. Không suy ra ASK từ số tàu.'},
    {id: 'hkFleetReg', type: 'brief', src: [CAA10],
      render: () => {
        const reg = obs('caa_aircraft_registered').sort((a, b) => a.period_end < b.period_end ? -1 : 1), t = [];
        reg.forEach((r, i) => t.push([`Đăng ký · ${r.period_label}`, nf(r.value, 0) + ' tàu', i === reg.length - 1 ? 'số dư tại ngày, gồm tàu đang dừng khai thác' : 'số dư tại ngày', i === reg.length - 1]));
        obs('caa_aircraft_commercial').forEach(r => t.push([`Khai thác thương mại · ${r.period_label}`, nf(r.value, 0) + ' tàu', (obs('caa_aircraft_grounded')[0] ? nf(obs('caa_aircraft_grounded')[0].value, 0) + ' tàu dừng do lỗi động cơ' : '')]));
        obs('caa_aircraft_scheduled').forEach(r => t.push([`Khai thác thường lệ · ${r.period_label}`, nf(r.value, 0) + ' tàu', 'báo dẫn Cục HK']));
        obs('caa_fleet_airline').forEach(r => t.push([`${r.segment} · ${r.period_label}`, nf(r.value, 0) + ' tàu', Object.entries(r.breakdown || {}).map(([k, v]) => k + ' ' + v).join(', ')]));
        return `<div class="rf-tiles">${t.map(([k, v, s, hi]) => `<div class="rf-tile${hi ? ' rf-tile-hi' : ''}"><small>${esc(k)}</small><b>${esc(v)}</b><span>${esc(s)}</span></div>`).join('')}</div>`;
      },
      method: 'Bốn khái niệm khác nhau, không cộng lẫn: tàu đăng ký quốc tịch (số dư theo sổ đăng bạ), tàu khai thác thương mại, tàu khai thác thường lệ, đội tàu theo hãng do Cục Hàng không nêu. Tàu đặt mua và tàu bàn giao chưa có nguồn công bố đầy đủ nên không vẽ; không suy ra ASK từ số tàu.'},
    {id: 'hkOtp', type: 'hbar', table: 'tbl-otp', unit: '%', digits: 1, period: '2024', src: [SHS], labelW: 150,
      items: obs('otp_2024').sort((a, b) => b.value - a.value).map(o => [o.segment, o.value, o.segment === 'Vietjet Air' ? C.red : o.segment === 'Vietnam Airlines' ? C.navy : C.sky]),
      method: 'SHS tr. 24, tỷ lệ cất cánh đúng giờ năm 2024. Heatmap OTP theo tháng: Cục Hàng không đăng báo cáo dạng bài, chưa nạp tự động được nên để ngoài bản này.'},
    {id: 'hkFuel', id2: 'hkFx', type: 'fuelfx', table: 'tbl-fuelfx', from: '2025-01'},
    {id: 'hkIata', type: 'brief', src: [IATA],
      render: () => { const I = EX.iata; if (!I) return '<p class="rf-note">Chưa có số IATA.</p>';
        return `<div class="rf-tiles"><div class="rf-tile rf-tile-hi"><small>Toàn cầu · tuần đến ${esc(I.week_ending.split('-').reverse().join('/'))}</small><b>${nf(I.global, 2)} USD/thùng</b><span>${sg(I.global_wow, 1)}% so tuần trước · ${sg(I.global_yoy, 1)}% so bình quân năm trước</span></div><div class="rf-tile"><small>Châu Á – Thái Bình Dương</small><b>${nf(I.asia, 2)} USD/thùng</b><span>${sg(I.asia_wow, 1)}% so tuần trước</span></div><div class="rf-tile"><small>Brent Dated</small><b>${nf(I.brent, 2)} USD/thùng</b><span>chênh lệch jet – Brent ${nf(I.crack, 2)} USD/thùng</span></div></div>`; },
      method: 'Giá Platts do IATA công bố hằng tuần, USD/thùng (1 thùng = 42 gallon); giữ vùng và đơn vị gốc, lưu riêng với chuỗi EIA. Số theo vùng đọc từ bảng ảnh trên trang IATA.'},
    {id: 'hkSens', type: 'sens', src: [VND, SHS],
      param: [['cost', 'Giá vốn quý cơ sở (tỷ đồng)', (() => { const i = (F.periods || []).length - 1, r = F.data?.HVN; return r && Number.isFinite(r.revenue?.[i]) && Number.isFinite(r.gross?.[i]) ? Math.round(r.revenue[i] - r.gross[i]) : 30000; })(), 'HVN quý gần nhất, BCTC', 100],
        ['fuel', 'Tỷ trọng nhiên liệu trong chi phí', 28.8, '% (IATA 2024 toàn cầu, SHS tr. 13)', 0.1], ['dfuel', 'Giá nhiên liệu thay đổi', 10, '%', 1],
        ['hedge', 'Phần đã phòng ngừa hoặc giá cố định', 0, '%', 5], ['pass', 'Phần chuyển vào giá vé', 0, '%', 5],
        ['usd', 'Chi phí bằng ngoại tệ ngoài nhiên liệu', 30, '% giá vốn (giả định)', 1], ['dfx', 'USD/VND thay đổi', 1, '%', 0.1]],
      calc: v => {
        const fuelCost = v.cost * v.fuel / 100, dF = fuelCost * v.dfuel / 100 * (1 - v.hedge / 100) * (1 - v.pass / 100);
        const dX = v.cost * v.usd / 100 * v.dfx / 100 + fuelCost * (1 + v.dfuel / 100) * v.dfx / 100;
        return [['Chi phí nhiên liệu cơ sở', nf(fuelCost, 0) + ' tỷ', 'giá vốn × tỷ trọng nhiên liệu, một quý'], ['Tăng chi phí do nhiên liệu', '+' + nf(dF, 0) + ' tỷ/quý', 'sau phòng ngừa và phần chuyển vào giá vé'],
          ['Tăng chi phí vận hành do tỷ giá', '+' + nf(dX, 0) + ' tỷ/quý', 'chi phí bằng ngoại tệ (gồm nhiên liệu) × mức đổi tỷ giá'], ['Tổng', '+' + nf(dF + dX, 0) + ' tỷ/quý', nf((dF + dX) / v.cost * 100, 1) + '% giá vốn cơ sở']];
      },
      method: 'Kịch bản minh họa, không phải ước tính của doanh nghiệp. Kỳ cơ sở: giá vốn quý gần nhất của HVN (đổi được). Giả định độ trễ 0 (giá mới áp ngay trong quý); tỷ trọng nhiên liệu theo IATA toàn cầu vì HVN, VJC chưa công bố chi phí nhiên liệu quý. Phần tỷ giá chỉ tính chi phí vận hành ròng bằng ngoại tệ; chênh lệch đánh giá lại nợ vay, nợ thuê bằng USD nằm ở chi phí tài chính, không tính ở đây (thiếu số dư nợ ngoại tệ theo thuyết minh).'},
    {id: 'hkAirlineFin', type: 'fin', table: 'tbl-airlinefin', quarters: 12, syms: [['HVN', C.navy], ['VJC', C.red]],
      views: [['revenue', 'Doanh thu thuần', 'tỷ đồng'], ['margin_gross', 'Biên gộp', '%'], ['margin_op', 'Biên LN thuần HĐKD', '%'], ['fin_exp', 'Chi phí tài chính', 'tỷ đồng'], ['cfo', 'CFO', 'tỷ đồng'], ['capex', 'Chi đầu tư TSCĐ', 'tỷ đồng']],
      method: 'BCTC hợp nhất. Doanh thu VJC gồm cả doanh thu bán và thuê lại tàu bay (không tách được theo quý từ nguồn công khai); HVN hợp nhất Pacific Airlines, VASCO. RASK, CASK, yield chưa tính: thiếu ASK, RPK theo hãng và doanh thu hành khách tách riêng. CFO quý năm nào lệch số năm thì để trống.'},
    {id: 'hkAirportTl', type: 'timeline', whoLabel: 'Công suất', vLabel: 'Ghi chú', items: (EX.airport_milestones || []),
      method: 'Mốc ghi theo ngày nguồn nêu. Phân biệt khởi công, hoàn thành, khánh thành, khai thác; mốc chưa diễn ra ghi "Dự kiến" (vòng rỗng). Ngày khai thác thương mại Long Thành chưa có nguồn xác nhận riêng.'},
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
    'hk-t1': ['Chi phí nhiên liệu trên ghế, biên gộp HVN, VJC', 'EIA, IATA theo tuần; chi phí nhiên liệu trong thuyết minh BCTC quý 4/2026; mức phụ thu nhiên liệu và giá vé', [['#rf-q-fuel', 'Nhiên liệu, tỷ giá'], ['#rf-q-sens', 'Độ nhạy'], ['#rf-q-airfin', 'Biên HVN, VJC']]],
    'hk-t2': ['Sản lượng và yield quốc tế của HVN, VJC; lượt khách quốc tế qua ACV', 'Số 11 tháng của Cục HK (khách quốc tế toàn thị trường và hãng Việt); lịch bay mùa Hè 2027; số chuyến theo hãng trong báo cáo đúng giờ', [['#rf-q-share', 'Thị phần quốc tế'], ['#rf-q-sched', 'Lịch bay'], ['#rf-q-otp', 'Chuyến theo hãng']]],
    'hk-t3': ['Capex, XDCB dở dang, thời điểm bắt đầu khấu hao của ACV; phân chia lưu lượng Tân Sơn Nhất – Long Thành', 'Mốc chạy thử, cấp phép khai thác của Bộ Xây dựng, Cục HK; BCTC quý 4/2026 của ACV', [['#rf-q-lt', 'Tiến độ Long Thành'], ['#rf-q-acv', 'Capex ACV']]],
  },
  section: {demand: ['mt2', 'demand'], supply: ['mt2', 'supply'], cost: ['mt2', 'cost'], airport: ['mt2', 'airport'], cargo: ['mt2', 'cargo']},
  tree: {
    mt1: {title: 'Tổng quan ngành', subs: [
      {k: 'map', t: 'Bản đồ ngành', d: 'Cách từng doanh nghiệp thu tiền từ một chuyến bay.', items: [
        {q: 'Một chuyến bay tạo doanh thu cho những ai?', id: 'rf-q-map', take: ['hk-01']}]},
      {k: 'model', t: 'Mô hình kiếm tiền', d: 'Doanh thu đến từ đâu, biến nào quyết định biên, mã nào đại diện.', items: [
        {q: 'Mỗi doanh nghiệp kiếm tiền từ đâu, biến nào quyết định biên?', id: 'rf-q-model', take: ['hk-05']}]},
    ]},
    mt2: {title: 'Bức tranh ngành', subs: [
      {k: 'demand', t: 'Nhu cầu vận tải', d: 'Khách vận chuyển, lượt khách qua cảng, khách quốc tế đến: ba phép đo khác nhau.', kpis: ['spk-pax', 'spk-visair'], items: [
        {q: 'Cầu tăng nhờ nội địa hay quốc tế?', id: 'rf-q-carried', meta: 'triệu lượt khách · Cục Hàng không, năm và lũy kế · nghìn lượt/tháng · NSO', take: ['hk-10', 'hk-11'], after: () => note('demand')},
        {q: 'Hãng Việt có tăng cùng tốc độ với thị trường quốc tế?', id: 'rf-q-share', meta: 'thị phần = khách QT hãng Việt ÷ khách QT vận chuyển toàn thị trường', take: ['hk-15', 'hk-12'], after: () => note('share')},
        {q: 'Khách quốc tế đến Việt Nam tập trung ở thị trường nào?', id: 'rf-q-vis', meta: 'nghìn lượt · NSO theo quốc tịch', take: ['hk-13', 'hk-14'], after: () => note('vis')}]},
      {k: 'supply', t: 'Cung ghế, đội bay & cạnh tranh', d: 'Lịch bay theo mùa, luân chuyển hành khách, đội tàu bay, thị phần và đúng giờ.', items: [
        {q: 'Cung ghế quốc tế mùa này tăng bao nhiêu, ai tăng?', id: 'rf-q-sched', meta: 'chuyến khứ hồi/tuần · lịch bay được duyệt; HK.km · NSO', take: ['hk-20', 'hk-21'], after: () => note('supply')},
        {q: 'Đội bay và thị phần nội địa thay đổi thế nào?', id: 'rf-q-fleet', meta: 'tàu bay · SHS; đăng ký · Cục Hàng không', take: ['hk-23', 'hk-24', 'hk-22', 'hk-25']},
        {q: 'Hãng nào bay đúng giờ, khai thác bao nhiêu chuyến?', id: 'rf-q-otp', meta: '% chuyến cất cánh đúng giờ · theo tháng (Cục Hàng không)', take: ['hk-26']}]},
      {k: 'cost', t: 'Nhiên liệu, tỷ giá & biên HVN/VJC', d: 'Jet fuel và USD/VND cùng trục thời gian; doanh thu, biên, dòng tiền theo BCTC.', kpis: ['spk-jet'], items: [
        {q: 'Giá nhiên liệu bay và tỷ giá đang ở đâu?', id: 'rf-q-fuel', meta: 'USD/gallon (EIA), đồng/USD (NHNN) · bình quân tháng; bảng bình quân quý', take: ['hk-30', 'hk-31'], after: () => note('cost')},
        {q: 'Doanh thu, biên và dòng tiền HVN, VJC đi thế nào?', id: 'rf-q-airfin', meta: 'tỷ đồng, % · BCTC hợp nhất quý', take: ['hk-33']},
        {q: 'Nhiên liệu +10%, tỷ giá +1% làm chi phí tăng bao nhiêu?', id: 'rf-q-sens', meta: '<b>kịch bản minh họa</b> · tham số chỉnh được', take: ['hk-32']}]},
      {k: 'airport', t: 'Sân bay, công suất & capex ACV', d: 'Bản đồ cảng, mốc Long Thành – T3 – T2, lưu lượng và đầu tư của ACV.', items: [
        {q: 'Các cảng nằm đâu, ai khai thác?', id: 'rf-q-airmap', take: ['hk-40']},
        {q: 'Long Thành, T3, T2 đang ở mốc nào?', id: 'rf-q-lt', meta: 'mốc theo ngày · % hợp đồng và giải ngân', take: ['hk-42', 'hk-41']},
        {q: 'Lưu lượng qua ACV và đầu tư của ACV đi thế nào?', id: 'rf-q-acv', meta: 'triệu lượt, nghìn tấn · tỷ đồng', take: ['hk-43', 'hk-44'], after: () => note('airport')}]},
      {k: 'cargo', t: 'Hàng hóa & dịch vụ sân bay', d: 'Ba lớp: hãng vận chuyển, cảng tiếp nhận, nhà ga xử lý; doanh nghiệp dịch vụ.', kpis: ['spk-cargo'], items: [
        {q: 'Hàng hóa hàng không tăng ở lớp nào?', id: 'rf-q-cargo', meta: 'triệu tấn qua cảng · nghìn tấn hãng Việt chở', take: ['hk-50', 'hk-51']},
        {q: 'Hàng qua nhà ga SCSC và doanh thu trên tấn?', id: 'rf-q-scs', meta: 'tấn · nghìn đ/tấn', take: ['hk-52', 'hk-53'], after: () => note('cargo')},
        {q: 'Doanh nghiệp dịch vụ sân bay tăng trưởng ra sao?', id: 'rf-q-svc', meta: 'tỷ đồng, % · BCTC hợp nhất quý', take: ['hk-54']}]},
    ]},
    mt14: {title: 'Tài chính ngành', subs: [
      {k: 'sector', t: 'Tài chính ngành', d: 'Doanh thu, lợi nhuận, nợ vay theo quý từng mã.', items: [
        {q: 'Doanh thu và lợi nhuận đi thế nào?', id: 'rf-q-fin', meta: 'tỷ đồng · hợp nhất quý từng mã, không cộng', take: ['hk-60']},
        {q: 'Đòn bẩy của HVN, VJC, ACV ra sao?', id: 'rf-q-debt', meta: 'tỷ đồng', take: ['hk-61']}]},
      {k: 'listed', t: 'Số vận hành doanh nghiệp', d: 'Số doanh nghiệp công bố 9T/2026.', items: [
        {q: 'Doanh nghiệp công bố gì về sản lượng 9T/2026?', id: 'rf-q-ops', take: ['hk-62']}]},
    ]},
  },
};
// Nhận định theo cụm: viết từ số trên chart; số trong câu lấy từ dữ liệu khi trang mở.
NOTES.demand = () => { const vd = last('caa_pax_carried_vn', 'dom'), vi = last('caa_pax_carried_vn', 'intl'); return vd && vi ? `${esc(vd.period_label)}: hãng Việt chở ${nf(vd.value, 1)} triệu khách nội địa (${sg(vd.yoy, 1)}%) và ${nf(vi.value, 1)} triệu khách quốc tế (${sg(vi.yoy, 1)}%). Phần tăng thêm của hãng Việt chủ yếu đến từ nội địa; quốc tế gần như đi ngang.` : 'Chưa có số kỳ mới.'; };
NOTES.share = () => { const vi = last('caa_pax_carried_vn', 'intl'), ai = last('caa_pax_airport', 'intl'); return vi && ai ? `Lượt khách quốc tế qua cảng tăng ${sg(ai.yoy, 1)}% trong khi khách quốc tế hãng Việt chở tăng ${sg(vi.yoy, 1)}%: phần lớn tăng trưởng quốc tế kỳ này do hãng nước ngoài chở, thị phần quốc tế của hãng Việt đang giảm. Hai chuỗi khác phạm vi nên chỉ so tốc độ, không chia cho nhau.` : ''; };
NOTES.vis = () => 'Trung Quốc và Hàn Quốc vẫn là hai thị trường lớn nhất. Bật "So cùng kỳ" để thấy nhóm tăng nhanh (Nga, Phi-li-pin, Cam-pu-chia, Ấn Độ) và Hàn Quốc giảm trong 2026. Khách nhập cảnh không đồng nghĩa khách hãng Việt chở.';
NOTES.supply = () => `${EX.winter_note || ''} Hai kịch bản: (1) cầu hấp thụ ghế mới, hệ số tải và yield giữ được; (2) cung ghế tăng nhanh hơn cầu, hãng phải giảm yield dù khách tăng. Chưa kết luận được: thiếu ASK, hệ số tải và yield cùng phạm vi; HK.km của NSO chỉ là phía cầu.`;
NOTES.cost = () => fuelL && fuelLY ? `Jet fuel bình quân T${Number(fuelL[0].slice(5))}/${fuelL[0].slice(0, 4)} cao hơn cùng kỳ ${sg((fuelL[1] / fuelLY[1] - 1) * 100, 0)}%, tỷ giá trung tâm đi lên từ giữa 2026. Hai lực cùng chiều làm tăng chi phí của HVN, VJC; mức ảnh hưởng lên biên cần chi phí nhiên liệu theo thuyết minh BCTC (chưa có trong nguồn công khai theo quý).` : '';
NOTES.airport = () => 'ACV hưởng trực tiếp từ khách quốc tế (phí cao hơn nội địa). XDCB dở dang tăng theo Long Thành nên CFO sau capex có quý âm trong giai đoạn xây dựng; xem dòng CFO để tách hoạt động kinh doanh khỏi đầu tư.';
NOTES.cargo = () => 'Hàng quốc tế qua cảng toàn quốc tăng, trong khi sản lượng nhà ga SCSC 9T/2026 giảm 8% so cùng kỳ (bản tin SCSC): tăng trưởng toàn ngành không tự chảy vào một nhà ga; cần thị phần nhà ga tại Tân Sơn Nhất để giải thích.';
})();
