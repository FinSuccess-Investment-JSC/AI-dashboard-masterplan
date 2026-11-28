/* Nhựa · cấu hình dashboard (26/11/2026, nhóm Xây dựng - Đầu tư công).
   Số thế giới và cơ cấu Việt Nam: Finsuccess tổng hợp từ nguồn gốc ghi ở từng chart (OECD, Plastics Europe, Bloomberg, VPA…).
   Số cập nhật: Hải quan (xuất nhập khẩu 2022 – 10T/2026, biểu 2X/2N), FRED (giá tháng, scripts/build_plastic_prices.py),
   BCTC quý 9 mã (scripts/update_company_comparison.py rổ 'plastic'); Tài chính ngành › 01: 11 mã cộng gộp
   (scripts/fetch_plastic_financials.py → scripts/build_plastic_financials.py → data/plastic-financials.js, window.PLASTIC_FIN; 28/11/2026). */
(() => {
const C = {navy: '#2938A8', teal: '#59C5C8', plum: '#861C52', gold: '#c29100', grey: '#9aa3b5', red: '#C0272D', ink: '#1D2678', sky: '#4A90D9'};
const FS = ['Finsuccess tổng hợp', '#rf-q-chain'];
const OECD = ['OECD Global Plastics Outlook', 'https://www.oecd.org/en/topics/sub-issues/plastics.html'];
const PE = ['Plastics Europe', 'https://plasticseurope.org/knowledge-hub/'];
const VPA = ['Hiệp hội Nhựa Việt Nam (VPA)', 'https://vpas.vn/'];
const MOIT = ['Bộ Công Thương', 'https://moit.gov.vn/'];
const ITC = ['ITC Trade Map', 'https://www.trademap.org/'];
const USITC = ['U.S. ITC DataWeb', 'https://dataweb.usitc.gov/'];
const BBG = ['Bloomberg', 'https://www.bloomberg.com/'];
const FRED = ['FRED: BLS, IMF, EIA', 'https://fred.stlouisfed.org/series/WPU066'];
const CUS = ['Hải quan Việt Nam (biểu xuất khẩu)', 'https://files.customs.gov.vn/CustomsCMS/TONG_CUC/2026/11/5/2026-t10-2x(vn-sb).pdf'];
const CUS_N = ['Hải quan Việt Nam (biểu nhập khẩu)', 'https://files.customs.gov.vn/CustomsCMS/TONG_CUC/2026/11/5/2026-t10-2n(vn-sb).pdf'];
const LAW = k => 'https://thuvienphapluat.vn/page/tim-van-ban.aspx?keyword=' + encodeURIComponent(k);
const YRS = ['2022', '2023', '2024', '2025', '10T/2026'];
// "Dữ liệu mới nhất" đầu sub-tab Bức tranh ngành (28/11/2026): đọc quan sát mới nhất của chính dữ liệu trên trang.
const mlabel = m => 'T' + Number(m.slice(5, 7)) + '/' + m.slice(0, 4);
const lastPrice = keys => { const S = window.PLASTIC_PRICES?.series || {}, m = keys.map(k => S[k]?.records?.at(-1)?.[0]).filter(Boolean).sort().at(-1); return m ? mlabel(m) : ''; };
const periodOf = (id, note) => { const c = (window.PKG?.charts || []).find(x => x.id === id), p = c?.categories?.at(-1) || c?.period || ''; const m = /^(\d{1,2})T\/(\d{4})$/.exec(p); return p ? (m ? 'T' + m[1] + '/' + m[2] : p) + (note ? ' · ' + note : '') : ''; };
const lastMilestone = id => { const t = new Date().toISOString().slice(0, 10), d = ((window.PKG?.charts || []).find(x => x.id === id)?.items || []).map(x => x.d).filter(x => x <= t).sort().at(-1); return d ? d.slice(8, 10) + '/' + d.slice(5, 7) + '/' + d.slice(0, 4) : ''; };

window.PKG = {
  key: 'plastic', prefix: 'nh', label: 'Nhựa',
  wide: ['nh-01', 'nh-05', 'nh-20', 'nh-52'],
  kpis: [
    {spark: 'spk-resin', price: 'resin_ppi', unit: '1982 = 100', digits: 1, color: C.plum, note: 'PPI hạt nhựa Mỹ'},
    {spark: 'spk-brent', price: 'brent', unit: 'USD/thùng', digits: 1, color: C.navy},
    {spark: 'spk-ex', fixed: ['6,94', 'tỷ USD', '10T/2026 · sản phẩm từ chất dẻo', '+12,7% so cùng kỳ'], spark2: [5.49, 5.18, 6.73, 7.47]},
    {spark: 'spk-im', fixed: ['8,00', 'triệu tấn', '10T/2026 · chất dẻo nguyên liệu nhập', '11,55 tỷ USD'], spark2: [7.12, 6.81, 8.43, 9.66]},
  ],
  charts: [
    /* ---------- Tổng quan ---------- */
    {id: 'chNhChain', type: 'html', src: [FS, VPA, ['BCTC doanh nghiệp niêm yết', '#rf-q-compare']],
      render: esc => {
        const box = t => `<span class="dc-box">${esc(t)}</span>`;
        const mix = [['Bao bì', 35, C.ink], ['Xây dựng', 25, C.red], ['Gia dụng', 22, C.sky], ['Kỹ thuật', 18, C.teal]];
        return `<div class="dc dc-plastic">
  <div class="dc-band"><span class="dc-b dc-b1">Đầu vào</span><span class="dc-b dc-b2">Sản xuất</span><span class="dc-b dc-b3">Đầu ra</span></div>
  <div class="dc-cols">
    <section class="dc-col dc-in"><h4><span>1</span>Nguyên liệu</h4>
      <div class="dc-row">${box('Hạt nhựa')}${box('Phụ gia')}${box('Bột màu')}</div>
      <p class="dc-num">Nguyên vật liệu <b>~76%</b> chi phí; hạt nhựa <b>~80%</b> nguyên vật liệu</p>
      <p class="dc-lbl">Hạt nhựa tiêu thụ ở Việt Nam (2024)</p>
      <ul class="dc-ctry"><li><b>28,7%</b>PE</li><li><b>25,6%</b>PP</li><li><b>12,6%</b>PVC</li><li><b>33,1%</b>Khác</li></ul>
      <p class="dc-note">Gốc dầu thô, khí thiên nhiên. Công suất trong nước ~2,7 triệu tấn/năm cuối 2024; Long Sơn thêm 1,4 triệu tấn PE, PP từ T8/2025.</p>
    </section>
    <section class="dc-col dc-mid"><h4><span>2</span>Biến đổi vật lý: nóng chảy, định hình</h4>
      <ul class="dc-tech">${['Thổi khuôn', 'Thổi màng', 'Ép phun', 'Ép đùn', 'Định hình nhiệt'].map(t => `<li>${esc(t)}</li>`).join('')}</ul>
      <p class="dc-note">Máy móc nhập khẩu toàn bộ; 70% giá trị máy nhập năm 2024 từ Trung Quốc.</p>
      <h4 class="dc-sub"><span>3</span>Sản phẩm · cơ cấu sản lượng 2024</h4>
      <div class="dc-stack" role="img" aria-label="${mix.map(([n, v]) => n + ' ' + v + '%').join(', ')}">${mix.map(([n, v, c]) => `<span style="flex:${v} 1 0;background:${c}">${v}%</span>`).join('')}</div>
      <ul class="dc-leg">${mix.map(([n, v, c]) => `<li><i style="background:${c}"></i>${esc(n)} <b>${v}%</b></li>`).join('')}</ul>
    </section>
    <section class="dc-col dc-right"><h4><span>4</span>Thị trường</h4>
      <p class="dc-num">Năm 2024: <b>11,65</b> triệu tấn · <b>31,5</b> tỷ USD doanh thu</p>
      <ul class="dc-list"><li>Nội địa ~78% doanh thu: ống nhựa, bao bì màng phức, chai, gia dụng</li><li>Xuất khẩu ~22%: sàn nhựa, túi nhựa, tấm phiến màng</li><li>Nhập khẩu sản phẩm kỹ thuật: linh kiện ô tô, điện tử</li></ul>
    </section>
  </div>
</div>`;
      }},
    {id: 'chNhCostVN', type: 'donut', items: [['Nguyên vật liệu', 76, C.ink], ['Nhân công', 9, C.red], ['Chi phí vận hành', 8, C.sky], ['Khấu hao', 3, C.teal], ['Khác', 5, C.grey]], digits: 0, center: ['NVL', '76%'], table: 'tbl-nh-cost',
      src: [['BCTC doanh nghiệp niêm yết', '#rf-q-compare'], FS]},
    {id: 'chNhMixVN', type: 'donut', items: [['Nhựa bao bì', 35, C.ink], ['Nhựa xây dựng', 25, C.red], ['Nhựa gia dụng', 22, C.sky], ['Nhựa kỹ thuật', 18, C.teal]], digits: 0, center: ['11,65', 'triệu tấn'], table: 'tbl-nh-mixvn', src: [VPA, FS]},
    {id: 'chNhModels', type: 'models', items: [
      ['Nhựa xây dựng: ống, phụ kiện', 'BMP · NTP · DNP · HCD', 'Ống uPVC, PP-R cho nhà ở qua đại lý; ống HDPE cho cấp thoát nước, hạ tầng qua đấu thầu', 'Giá PVC, HDPE; xây dựng nhà ở và giải ngân đầu tư công; chiết khấu đại lý', [['#rf-q-pipe', 'Thị phần ống'], ['#rf-q-gm', 'Biên gộp']]],
      ['Nhựa bao bì', 'AAA · TDP · TPP', 'Túi màng đơn xuất khẩu (EU, Nhật, Mỹ); bao bì màng phức, chai cho thực phẩm, đồ uống trong nước', 'Giá PE, PP; giá bán chốt theo giá hạt; thuế đối ứng, quy định nhựa dùng một lần', [['#rf-q-bag', 'Xuất khẩu'], ['#rf-q-gm', 'Biên gộp']]],
      ['Nhựa kỹ thuật, gia dụng', 'NHH · VTZ', 'Linh kiện xe máy, ô tô, điện tử; đồ gia dụng', 'Giá hạt kỹ thuật; sản lượng xe, điện tử; sức mua nội địa', [['#rf-q-rev2', 'Doanh thu'], ['#rf-q-gm', 'Biên gộp']]]],
      src: [['BCTC và báo cáo thường niên doanh nghiệp', '#rf-q-compare'], FS]},

    /* ---------- Thế giới ---------- */
    {id: 'chNhPrice', type: 'prices', keys: [['resin_ppi', 'Hạt nhựa (PPI Mỹ)', C.plum], ['brent', 'Dầu Brent', C.navy], ['henry_hub', 'Khí Henry Hub', C.gold]], baseMonth: '2007-01', table: 'tbl-nh-price', src: [FRED],
      method: '% thay đổi so với T1/2007. Hạt nhựa: chỉ số giá sản xuất Mỹ "hạt nhựa và vật liệu nhựa" (BLS, WPU066); Brent: IMF (POILBREUSDM); khí: Henry Hub (EIA, MHHNGSP). Giá gốc trong Chi tiết dữ liệu.'},
    {id: 'chNhFcst', type: 'annual', categories: ['2022', '2023', '2024', '2025F', '2026F', '2027F', '2028F', '2029F', '2030F'],
      series: [['HDPE', [1178, 1032, 1013, 958, 940, 930, 930, 940, 940], C.navy, 'line'], ['PP', [1170, 998, 1001, 975, 940, 930, 940, 940, 940], C.teal, 'line'], ['PVC', [1144, 843, 806, 712, 715, 720, 750, 755, 755], C.red, 'line']],
      unit: 'USD/tấn', digits: 0, zeroBase: false, catLabel: 'Năm', table: 'tbl-nh-fcst', src: [BBG, FS], period: '2022 – 2030F', method: 'Giá bình quân năm; 2025F – 2030F là dự báo của Bloomberg.'},
    {id: 'chNhResinType', type: 'donut', items: [['PE', 29.0, C.ink], ['PP', 21.2, C.teal], ['PVC', 14.3, C.red], ['PET', 6.9, C.sky], ['PUR', 5.9, C.gold], ['PS', 5.7, C.plum], ['Khác', 17.1, C.grey]], center: ['Hạt nhựa', '2024'], table: 'tbl-nh-resintype', src: [PE, FS]},
    {id: 'chNhPerCap', type: 'hbar', items: [['Châu Mỹ', 130, C.navy], ['Châu Âu', 124, C.navy], ['Trung Quốc', 73, C.navy], ['Thế giới', 61, C.gold], ['Châu Á (trừ Trung Quốc)', 37, C.navy], ['Đông Nam Á thu nhập trung bình thấp (gồm Việt Nam)', 34, C.red], ['Trung Đông và châu Phi', 21, C.navy]],
      unit: 'kg/người', digits: 0, labelW: 260, src: [OECD, FS], period: '2023'},
    {id: 'chNhCagr', type: 'hbar', items: [['Châu Á (trừ Trung Quốc)', 4.4, C.navy], ['Trung Đông và châu Phi', 3.8, C.navy], ['Trung Quốc', 3.1, C.navy], ['Thế giới', 2.7, C.gold], ['Châu Mỹ', 1.7, C.navy], ['Châu Âu', 1.2, C.navy]],
      unit: '%/năm', digits: 1, labelW: 200, src: [OECD, FS], period: 'dự báo 2022 – 2030F'},
    {id: 'chNhUseWorld', type: 'donut', items: [['Bao bì', 32, C.ink], ['Xây dựng', 17, C.red], ['Kỹ thuật', 14, C.teal], ['Gia dụng', 10, C.sky], ['Khác', 27, C.grey]], digits: 0, center: ['2023', '~490 tr tấn'], table: 'tbl-nh-useworld', src: [OECD, FS]},
    {id: 'chNhPackRegion', type: 'donut', items: [['Châu Á – Thái Bình Dương', 45, C.ink], ['Bắc Mỹ', 27, C.teal], ['Châu Âu', 21, C.sky], ['Mỹ Latin', 5, C.gold], ['Trung Đông – châu Phi', 2, C.grey]], digits: 0, center: ['Bao bì', '2024'], table: 'tbl-nh-packreg', src: [['Precedence Research', 'https://www.precedenceresearch.com/'], FS]},
    {id: 'chNhPackUse', type: 'donut', items: [['Thực phẩm', 51, C.ink], ['Đồ uống', 19, C.teal], ['Chăm sóc cá nhân, gia đình', 12, C.sky], ['Y tế', 11, C.gold], ['Khác', 7, C.grey]], digits: 0, center: ['Bao bì', 'ứng dụng'], table: 'tbl-nh-packuse', src: [['Grand View Research', 'https://www.grandviewresearch.com/'], FS]},
    {id: 'chNhRecycle', type: 'tiles', items: [['Tiêu thụ hạt nhựa thế giới', '3,3%/năm', 'bình quân 2000 – 2023'], ['Nhựa tái chế · 2023', '8,8%', 'tỷ trọng sản lượng; tăng 3,9%/năm 2018 – 2023'], ['Nhựa sinh học · 2023', '0,7%', 'tỷ trọng sản lượng; tăng 20,1%/năm 2018 – 2023']],
      src: [OECD, PE, FS]},
    {id: 'chNhBuildCagr', type: 'hbar', items: [['Châu Á – Thái Bình Dương', 4.9, C.navy], ['Trung Đông và châu Phi', 3.9, C.navy], ['Thế giới', 3.8, C.gold], ['Mỹ Latin', 3.5, C.navy], ['Châu Âu', 2.9, C.navy], ['Bắc Mỹ', 2.4, C.navy]],
      unit: '%/năm', digits: 1, labelW: 200, src: [['Oxford Economics', 'https://www.oxfordeconomics.com/'], FS], period: 'dự báo 2024 – 2029F'},

    /* ---------- Việt Nam ---------- */
    {id: 'chNhResinVN', type: 'donut', items: [['PE', 28.7, C.ink], ['PP', 25.6, C.teal], ['PVC', 12.6, C.red], ['Khác', 33.1, C.grey]], center: ['Hạt nhựa', '2024'], table: 'tbl-nh-resinvn', src: [FS]},
    {id: 'chNhImport', type: 'annual', categories: YRS, series: [['Nhập khẩu', [7116.9, 6814.3, 8426.8, 9657.6, 7996.5], C.ink], ['Xuất khẩu', [1641.7, 1931.5, 2397.1, 2255.2, 2225.8], C.teal]],
      unit: 'nghìn tấn', digits: 0, catLabel: 'Kỳ', table: 'tbl-nh-import', src: [CUS_N, CUS], period: '10T/2026',
      method: 'Nhóm hàng "Chất dẻo nguyên liệu", Hải quan sơ bộ. Giá nhập bình quân (trị giá ÷ lượng): 1.741 USD/tấn (2022), 1.432 (2023), 1.398 (2024), 1.298 (2025), 1.445 (10T/2026).'},
    {id: 'chNhSupplyCap', type: 'tiles', items: [['Công suất hạt nhựa trong nước · cuối 2024', '~2,7 triệu tấn/năm', 'PP, PET, PVC, PS'], ['Tổ hợp hóa dầu Long Sơn', '1,4 triệu tấn/năm', 'PE, PP · vận hành thương mại T8/2025'], ['Mức tự chủ hạt nhựa sau Long Sơn', '~35%', 'trên tổng nhu cầu'], ['Thuế nhập khẩu ưu đãi', 'HDPE, LLDPE 2% · PP 3%', 'NĐ 199/2025 từ 08/07/2025; HDPE, LLDPE trước đó 0%']],
      src: [FS, ['Nghị định 199/2025/NĐ-CP', 'https://thuvienphapluat.vn/ma-so-thue/phap-luat-thue/sua-doi-phu-luc-bieu-thue-xuat-khau-bieu-thue-nhap-khau-uu-dai-tu-ngay-0872025-207655.html']]},
    {id: 'chNhMachine', type: 'donut', items: [['Trung Quốc', 70, C.red], ['Nhật Bản', 9, C.ink], ['Đài Loan', 6, C.sky], ['Hàn Quốc', 6, C.teal], ['Đức', 3, C.gold], ['Khác', 6, C.grey]], digits: 0, center: ['Máy móc', '2024'], table: 'tbl-nh-machine', src: [ITC, FS],
      method: 'Năm 2024 nhập khẩu máy móc ngành nhựa tăng 39,2% so với 2023, vượt mức 1.078 triệu USD của năm 2019.'},
    {id: 'chNhExport', type: 'annual', categories: YRS, series: [['Xuất khẩu', [5493.7, 5181.9, 6725.3, 7473.2, 6936.6], C.ink], ['Nhập khẩu', [8119.7, 7508.6, 8853.9, 10870.4, 10200.0], C.grey]],
      unit: 'triệu USD', digits: 0, catLabel: 'Kỳ', table: 'tbl-nh-export', src: [CUS, CUS_N], period: '10T/2026',
      method: 'Nhóm hàng "Sản phẩm từ chất dẻo", Hải quan sơ bộ. Xuất khẩu 2025 +11,1%; 10T/2026 +12,7% so cùng kỳ.'},
    {id: 'chNhExportMix', type: 'hbar', items: [['Đồ vật dùng trong xây lắp (chủ yếu sàn nhựa)', 26, C.red], ['Tấm, phiến, màng nhựa', 18, C.sky], ['Túi nhựa', 16, C.ink], ['Sản phẩm gia dụng', 9, C.teal], ['Vải bạt', 6, C.ink], ['Loại khác', 5, C.grey], ['Linh kiện đồ đạc, xe cộ', 4, C.gold], ['Sản phẩm công nghiệp', 4, C.gold], ['Ống và phụ kiện', 2, C.red], ['Vỏ mỹ phẩm', 2, C.ink], ['Chậu hoa, đồ trang trí', 2, C.teal], ['Nút, nắp, mũ van', 1, C.ink]],
      unit: '%', digits: 0, labelW: 280, src: [MOIT, ITC, FS], period: '2024', legend: [['Nhựa xây dựng', C.red], ['Nhựa bao bì', C.ink], ['Tấm, phiến, màng', C.sky], ['Gia dụng', C.teal], ['Kỹ thuật và khác', C.gold]]},
    {id: 'chNhPipeShare', type: 'donut', items: [['NTP', 32, C.ink], ['BMP', 23, C.red], ['HSG', 13, C.teal], ['DNP', 9.3, C.sky], ['Khác', 21.9, C.grey]], center: ['Ống nhựa', '2024'], table: 'tbl-nh-pipe', src: [['BCTC BMP, NTP, HSG, DNP', '#rf-q-compare'], FS],
      method: 'Ống dân dụng (uPVC, PP-R) qua đại lý: NTP mạnh miền Bắc, BMP miền Nam; ống hạ tầng HDPE qua đấu thầu: DNP lớn nhất. Ống nhựa ~70% dùng cho nhà ở, ~20% cho hạ tầng.'},
    {id: 'chNhBag', type: 'annual', categories: ['2019', '2024'], series: [['Túi nhựa xuất khẩu', [894, 1084], C.ink]], unit: 'triệu USD', digits: 0, catLabel: 'Năm', table: 'tbl-nh-bag', src: [MOIT, ITC, FS], period: '2024',
      method: 'Năm 2024 EU, Nhật Bản, Mỹ chiếm 78% giá trị; tăng bình quân 2016 – 2024: EU 4,0%/năm, Nhật Bản 5,3%/năm, Mỹ 17,6%/năm.'},
    {id: 'chNhPackVN', type: 'donut', items: [['Màng phức', 60, C.ink], ['Chai nhựa', 25, C.teal], ['Màng đơn', 15, C.sky]], digits: 0, center: ['Bao bì', '2023'], table: 'tbl-nh-packvn', src: [['FiinGroup', 'https://fiingroup.vn/'], FS]},
    {id: 'chNhSPC', type: 'donut', items: [['Việt Nam', 49.6, C.red], ['Trung Quốc', 28.1, C.ink], ['Thị trường khác', 22.3, C.grey]], center: ['Sàn SPC', 'Mỹ nhập 2024'], table: 'tbl-nh-spc', src: [USITC, FS],
      method: 'Thị phần trong sản lượng sàn SPC Mỹ nhập khẩu năm 2024. Xuất khẩu sàn nhựa Việt Nam sang Mỹ năm 2024: 1,5 tỷ USD; 8T/2025 thị phần sàn nhựa Việt Nam 39,6% (+11,0 điểm % so với cuối 2024).'},
    {id: 'nhTimeline', type: 'timeline', items: [
      {d: '2025-01-06', name: 'Nghị định 05/2025/NĐ-CP (sửa NĐ 08/2022)', st: 'Đã ban hành', what: 'Nhà sản xuất, nhập khẩu bao bì phải tái chế theo tỷ lệ: PET cứng 22%; HDPE, LDPE, PP, PS cứng 15%; EPS, PVC cứng và nhựa mềm 10%; điều chỉnh 3 năm một lần', who: 'TPP, AAA, TDP', v: 'Chi phí nguyên liệu tái chế, biên gộp bao bì', url: LAW('05/2025/NĐ-CP')},
      {d: '2025-07-08', name: 'Nghị định 199/2025/NĐ-CP', st: 'Đã ban hành', what: 'Thuế nhập khẩu ưu đãi HDPE, LLDPE 2% (trước 0%), PP 3% (không đổi)', who: 'BMP, NTP, AAA, TDP', v: 'Giá vốn hạt nhựa nhập', url: 'https://thuvienphapluat.vn/ma-so-thue/phap-luat-thue/sua-doi-phu-luc-bieu-thue-xuat-khau-bieu-thue-nhap-khau-uu-dai-tu-ngay-0872025-207655.html'},
      {d: '2026-01-01', name: 'NĐ 08/2022: dừng túi ni lông khó phân hủy cỡ nhỏ', st: 'Đã ban hành', what: 'Không sản xuất, nhập khẩu túi ni lông khó phân hủy dưới 50 × 50 cm, màng dưới 50 µm (trừ xuất khẩu, đóng gói hàng hóa)', who: 'Bao bì màng đơn nội địa', v: 'Sản lượng túi nội địa', url: LAW('08/2022/NĐ-CP')},
      {d: '2026-12-01', name: 'Anh: biện pháp tự vệ tạm thời với nhựa PET', st: 'Dự thảo', what: 'Hạn ngạch thuế quan; đề xuất thuế bổ sung 65% với lượng vượt hạn ngạch', who: 'Xuất khẩu hạt, chai PET', v: 'Xuất khẩu PET sang Anh', url: 'https://thuehaiquan.tapchikinhtetaichinh.vn/doanh-nghiep-xuat-khau-nhua-can-gui-y-kien-cham-nhat-ngay-22-11-de-dam-bao-quyen-loi-171443.html'},
      {d: '2030-12-31', label: 'sau 31/12/2030', name: 'NĐ 08/2022: dừng nhựa dùng một lần', st: 'Đã ban hành', what: 'Dừng sản xuất, nhập khẩu sản phẩm nhựa dùng một lần, bao bì nhựa khó phân hủy (trừ xuất khẩu, đóng gói hàng hóa)', who: 'Bao bì nội địa', v: 'Cơ cấu sản phẩm bao bì', url: LAW('08/2022/NĐ-CP')}],
      method: 'Mốc là ngày hiệu lực.'},

    /* ---------- Tài chính ngành ---------- */
    {id: 'chNhRevBuild', type: 'revenue', syms: [['BMP', C.red], ['NTP', C.ink], ['DNP', C.teal], ['HCD', C.gold]], table: 'tbl-nh-rev-build', src: ['cq'], method: 'BCTC hợp nhất quý từng mã, không cộng.'},
    {id: 'chNhRevPack', type: 'revenue', syms: [['AAA', C.ink], ['TDP', C.teal], ['TPP', C.gold], ['NHH', C.plum], ['VTZ', C.sky]], table: 'tbl-nh-rev-pack', src: ['cq'], method: 'BCTC hợp nhất quý từng mã, không cộng.'},
    {id: 'chNhGM', type: 'margin', syms: [['BMP', C.red], ['NTP', C.ink], ['DNP', C.teal], ['AAA', C.gold], ['TDP', C.sky]], table: 'tbl-nh-gm', src: ['cq'], method: 'Biên = lãi gộp (lãi ròng) ÷ doanh thu thuần, BCTC hợp nhất quý.'},
  ],
  sourceManual: [[/^Chuỗi giá trị ngành nhựa/, 'Finsuccess tổng hợp']],
  topics: {},
  alias: {mt3: ['mt2', 'world'], mt4: ['mt2', 'policy'], mt6: ['mt14', 'listed'], mt9: ['mt14', 'sector']},
  section: {world: ['mt2', 'world'], vietnam: ['mt2', 'vn'], price: ['mt2', 'world'], policy: ['mt2', 'policy'], finance: ['mt14', 'sector'], listed: ['mt14', 'listed'], companies: ['mt14', 'listed'], valuation: ['mt14', 'valuation']},
  // 28/11/2026 (khung chuẩn Điện, DASHBOARD_WORKFLOW §42): Tổng quan 00 Bản đồ ngành · 01 Mô hình kinh doanh (.ov-nav);
  // Bức tranh 01 Nhựa thế giới · 02 Nhựa Việt Nam · 03 Chính sách (sub-tab cuối, tách từ khâu Chính sách của 02), mỗi câu hỏi một chart trả lời chính;
  // Tài chính 01 Tài chính ngành (số cộng gộp BCTC quý, app/plastic-finance.js) · 02 Doanh nghiệp niêm yết · 03 Định giá (app/peer-valuation.js).
  tree: {
    mt1: {title: 'Tổng quan ngành', subs: [
      {k: 'map', t: 'Bản đồ ngành', sub: 'Chuỗi giá trị, chi phí, sản lượng', d: 'Hạt nhựa → nóng chảy, định hình → bao bì, xây dựng, gia dụng, kỹ thuật.', items: [
        {q: 'Ngành nhựa đi qua những khâu nào?', id: 'rf-q-chain', take: ['nh-01']},
        {q: 'Chi phí và sản lượng dồn vào đâu?', id: 'rf-q-cost', take: ['nh-02', 'nh-03']}]},
      {k: 'model', t: 'Mô hình kinh doanh', sub: 'Xây dựng · bao bì · kỹ thuật, gia dụng', d: 'Doanh nghiệp niêm yết theo mảng và biến quyết định biên.', items: [
        {q: 'Mỗi nhóm doanh nghiệp kiếm tiền từ đâu?', id: 'rf-q-model', take: ['nh-05']}]},
    ]},
    mt2: {title: 'Bức tranh ngành', subs: [
      {k: 'world', t: 'Nhựa thế giới', d: 'Giá nguyên liệu, chủng loại hạt nhựa, nhu cầu theo khu vực và theo mảng.', kpis: ['spk-resin', 'spk-brent'], asof: () => lastPrice(['resin_ppi', 'brent', 'henry_hub']),
        flow: [['in', 'Đầu vào', 'Giá hạt nhựa, dầu, khí'], ['use', 'Tiêu thụ', 'Khu vực, mảng'], ['seg', 'Đầu ra', 'Bao bì, xây dựng']], items: [
        {stage: 'in'},
        {q: 'Giá hạt nhựa có đang đi theo giá dầu và khí?', id: 'rf-q-price', meta: '% thay đổi so với T1/2007 · theo tháng', take: ['nh-20']},
        {q: 'Giá HDPE, PP, PVC được dự báo đi đâu đến 2030?', id: 'rf-q-fcst', meta: 'USD/tấn · Bloomberg', take: ['nh-21']},
        {q: 'Hạt nhựa nào chiếm phần lớn sản lượng thế giới?', id: 'rf-q-resintype', take: ['nh-22']},
        {stage: 'use'},
        {q: 'Khu vực nào tiêu thụ nhiều, khu vực nào tăng nhanh?', id: 'rf-q-region', take: ['nh-23', 'nh-24']},
        {q: 'Nhựa dùng vào đâu, tái chế được bao nhiêu?', id: 'rf-q-use', take: ['nh-25', 'nh-28']},
        {stage: 'seg'},
        {q: 'Nhu cầu bao bì dồn vào khu vực và ứng dụng nào?', id: 'rf-q-pack', take: ['nh-26', 'nh-27']},
        {q: 'Xây dựng ở khu vực nào tăng nhanh nhất?', id: 'rf-q-build', take: ['nh-29']}]},
      {k: 'vn', t: 'Nhựa Việt Nam', d: 'Nguồn hạt nhựa, máy móc, sản phẩm và xuất khẩu.', kpis: ['spk-ex', 'spk-im'], asof: () => periodOf('chNhExport', 'Hải quan sơ bộ'),
        flow: [['in', 'Đầu vào', 'Hạt nhựa, máy móc'], ['out', 'Sản xuất', 'Sản phẩm, thị phần'], ['ex', 'Đầu ra', 'Xuất khẩu, thị trường']], items: [
        {stage: 'in'},
        {q: 'Việt Nam phụ thuộc hạt nhựa nhập khẩu đến mức nào?', id: 'rf-q-resin', meta: 'nghìn tấn · Hải quan sơ bộ', take: ['nh-31', 'nh-30']},
        {q: 'Nguồn hạt nhựa trong nước và máy móc đến từ đâu?', id: 'rf-q-supply', take: ['nh-32', 'nh-33']},
        {stage: 'out'},
        {q: 'Ai nắm thị trường ống nhựa và bao bì?', id: 'rf-q-pipe', take: ['nh-36', 'nh-38']},
        {stage: 'ex'},
        {q: 'Xuất khẩu sản phẩm nhựa đang tăng hay giảm?', id: 'rf-q-export', meta: 'triệu USD · Hải quan sơ bộ', take: ['nh-34', 'nh-35']},
        {q: 'Túi nhựa và sàn nhựa xuất khẩu dựa vào thị trường nào?', id: 'rf-q-bag', take: ['nh-37', 'nh-39']}]},
      {k: 'policy', t: 'Chính sách', d: 'Văn bản nào đổi chi phí nguyên liệu, nghĩa vụ tái chế hoặc sản lượng bao bì?', asofLabel: 'Mốc hiệu lực gần nhất', asof: () => lastMilestone('nhTimeline'), items: [
        {q: 'Mốc nào đổi chi phí hoặc sản lượng?', id: 'rf-q-policy', meta: '● đã ban hành · ○ dự thảo · ngày hiệu lực', take: ['nh-52']}]},
    ]},
    mt14: {title: 'Tài chính ngành', subs: [
      {k: 'sector', t: 'Tài chính ngành', d: 'Kết quả kinh doanh, biên, CAPEX, vốn lưu động, nợ vay và tỷ suất sinh lời cộng gộp từ BCTC hợp nhất quý của 11 doanh nghiệp nhựa niêm yết.', items: [
        {html: () => { const h = document.createElement('div'); h.className = 'nh-fin-host rf-wide'; h.id = 'nh-fin-root'; return h; }}]},
      {k: 'listed', t: 'Doanh nghiệp niêm yết', d: 'Bảng so sánh, doanh thu, lợi nhuận và biên theo quý từng mã.', items: [
        {q: 'Doanh nghiệp nào sinh lời tốt hơn, định giá ra sao?', id: 'rf-q-compare', meta: 'số quý, lũy kế hoặc cả năm theo bộ chọn kỳ', take: ['.financial-comparison']},
        {q: 'Doanh thu, lợi nhuận nhựa xây dựng đi thế nào?', id: 'rf-q-rev', meta: 'nghìn tỷ đồng · hợp nhất quý từng mã', take: ['nh-40']},
        {q: 'Doanh thu, lợi nhuận nhựa bao bì, kỹ thuật, gia dụng đi thế nào?', id: 'rf-q-rev2', meta: 'nghìn tỷ đồng · hợp nhất quý từng mã', take: ['nh-41']},
        {q: 'Biên gộp từng mã đang mở rộng hay thu hẹp?', id: 'rf-q-gm', meta: '% · BCTC hợp nhất quý', take: ['nh-42']}]},
    ]},
  },
};
})();
