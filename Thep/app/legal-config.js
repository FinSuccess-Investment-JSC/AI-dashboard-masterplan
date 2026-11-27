/* Cấu hình pháp lý theo văn bản cho Thép (27/11/2026), đọc bởi app/sector-legal.js.
   Số và mốc lấy từ thẻ th-50, th-51, th-52 (khôi phục từ bản trước commit f0569110, mỗi dòng có link nguồn ở cột Nguồn). Không thêm số mới. */
window.SECTOR_LEGAL = {
  event: 'steel:frame',
  SUM: {
    hrc: {t: 'CBPG HRC Trung Quốc · 1959/QĐ-BCT · hiệu lực 06/07/2025 (5 năm)', l: [
      'Thuế chống bán phá giá thép cán nóng (HRC) Trung Quốc <b>23,10–27,83%</b>; chấm dứt điều tra với Ấn Độ.',
      'Chống lẩn tránh với HRC khổ rộng trên 1.880 mm đến 2.300 mm (612/QĐ-BCT, <b>tạm thời</b> từ 17/4/2026): 27,83%.',
      'Rà soát lần 1 (1902/QĐ-BCT, AR01.AD20) từ 27/7/2026; kết luận ước khoảng 7/2027 — có thể giữ, tăng hoặc giảm mức.',
      'Tác động: <b>▲HPG</b> (bán HRC trong nước), <b>▼HSG, NKG</b> (dùng HRC làm đầu vào tôn mạ).']},
    coat: {t: 'CBPG tôn mạ Trung Quốc, Hàn Quốc · 2310/QĐ-BCT · 14/08/2025 (5 năm)', l: [
      'Trung Quốc tối đa <b>37,13%</b>; Hyundai Steel (Hàn Quốc) 12%.',
      'Bảo vệ thị phần tôn mạ trong nước: <b>▲HSG, NKG</b>.']},
    newcase: {t: 'Điều tra CBPG mới · AD24 (1903/QĐ-BCT) · AD25', l: [
      'AD24: thanh thép dự ứng lực Trung Quốc, khởi xướng 27/7/2026 theo đơn của HPG; chưa có mức, kết luận ước khoảng 7/2027 (<b>▲HPG</b>).',
      'AD25: thép không gỉ cán nguội Trung Quốc, Indonesia, Đài Loan; bản câu hỏi chọn mẫu 13/11/2026, trả lời đến 30/11/2026; chưa có mức.']},
    us232: {t: 'Mỹ Mục 232 thép · hiệu lực 04/06/2025', l: [
      'Thuế thép nhập vào Mỹ tăng từ <b>25% lên 50%</b>.',
      'Tác động: <b>▼HSG, NKG</b> (xuất khẩu tôn sang Mỹ).',
      'Chưa có nguồn 2026 xác nhận mức vẫn là 50% (ghi chú trên thẻ gốc).']},
    usad: {t: 'Mỹ AD/CVD với thép Việt Nam · A-552-843, C-552-844 và các vụ khác', l: [
      'Tôn mạ (CORE): kết luận 26/8/2025, lệnh CVD 19/12/2025; AD HSG <b>110,19%</b>, NKG và HPG Sheet 94,89%, toàn Việt Nam 162,96%; CVD HSG 0,30%.',
      'Thép thanh bê tông: DOC kết luận 7/2026, AD 123,49–131,53%, CVD 6,8%; chờ ITC.',
      'Điều tra lẩn tránh: CORE hoàn thiện ở Indonesia từ thép cán nguội Việt Nam, từ 27/3/2026; kết luận ước khoảng 1/2027.',
      'Tác động: <b>▼HSG, NKG, HPG, VGS, TVN</b>.']},
    eu: {t: 'EU: hạn ngạch thép, CBPG cán nguội, CBAM', l: [
      'CBPG chính thức thép cán nguội (Quy định (EU) 2026/2547), hiệu lực <b>17/11/2026</b>: Việt Nam <b>16,0%</b>.',
      'Hạn ngạch thép mới từ 1/7/2026: 18,35 triệu tấn/năm, vượt hạn ngạch chịu 50%, thấp hơn 2024 gần 47%.',
      'CBAM thực thi đầy đủ từ 2026; chưa có mức cho thép Việt Nam.',
      'Tác động: <b>▼HSG, NKG, HPG</b>.']},
    other: {t: 'Canada, Australia, Mexico', l: [
      'Canada hạn ngạch thuế quan thép 28/6/2026–27/6/2027: phụ thu 50% phần vượt; Việt Nam nhiều khả năng thuộc nhóm FTA (suy luận, chưa xác nhận).',
      'Australia khởi xướng CBPG tôn kẽm Việt Nam, Hàn Quốc 22/5/2026 rồi <b>chấm dứt</b> 19/6/2026, không áp thuế.',
      'Mexico tăng thuế hàng không có FTA: chưa xác nhận mức thép; Việt Nam có thể được CPTPP che chắn.']},
    strat: {t: 'Chiến lược phát triển ngành thép · QĐ 261/QĐ-TTg · 09/02/2026', l: [
      'Mục tiêu 2030: thép thô <b>25–26 triệu tấn</b>, thành phẩm 32–33 triệu tấn, đáp ứng 80–85% nhu cầu trong nước.',
      'Nghị định 209/2026/NĐ-CP, Thông tư 41/2026/TT-BXD, QCVN thép: chưa mở được văn bản (ghi chú trên thẻ gốc).']},
    docs: {t: 'Mới duyệt gần đây và lịch phòng vệ thương mại', l: [
      'Mốc mới nhất: EU áp CBPG thép cán nguội Việt Nam 16,0% từ 17/11/2026.',
      'Sắp tới: hạn yêu cầu rà soát CBPG thép cán nguội Trung Quốc 25/11/2026; Mỹ kết luận lẩn tránh qua Indonesia ~1/2027; rà soát HRC và AD24 ~7/2027.']},
  },
  RECENT: [
    ['17/11/2026', 'EU · Quy định (EU) 2026/2547', 'CBPG chính thức thép cán nguội: Việt Nam 16,0%', 'eu'],
    ['13/11/2026', 'AD25 · 234/TB-PVTM', 'Bản câu hỏi chọn mẫu điều tra CBPG inox cán nguội', 'newcase'],
    ['22/10/2026', 'Canada · OCTG RR-2025-006', 'Duy trì biện pháp với ống thép dẫn dầu', 'other'],
    ['27/07/2026', '1902/QĐ-BCT · 1903/QĐ-BCT', 'Rà soát lần 1 CBPG HRC; khởi xướng AD24 thanh thép dự ứng lực', 'hrc'],
    ['07/2026', 'Mỹ · AD/CVD thép thanh Việt Nam', 'DOC kết luận AD 123,49–131,53%, CVD 6,8%; chờ ITC', 'usad'],
    ['01/07/2026', 'EU · hạn ngạch thép mới', '18,35 triệu tấn/năm; vượt hạn ngạch 50%', 'eu'],
    ['28/06/2026', 'Canada · hạn ngạch thuế quan thép', 'Phụ thu 50% phần vượt, đến 27/6/2027', 'other'],
    ['19/06/2026', 'Australia', 'Chấm dứt điều tra CBPG tôn kẽm Việt Nam, Hàn Quốc', 'other'],
    ['17/04/2026', '612/QĐ-BCT (tạm thời)', 'Chống lẩn tránh HRC khổ rộng Trung Quốc 27,83%', 'hrc'],
    ['27/03/2026', 'Mỹ · điều tra lẩn tránh', 'CORE hoàn thiện ở Indonesia từ thép cán nguội Việt Nam', 'usad'],
    ['09/02/2026', 'QĐ 261/QĐ-TTg', 'Chiến lược ngành thép đến 2030', 'strat'],
    ['19/12/2025', 'Mỹ · lệnh CVD tôn mạ (C-552-844)', 'CVD HSG 0,30%, khác 1,29%', 'usad'],
  ],
  LAWS: [
    ['CBPG HRC Trung Quốc', '1959/QĐ-BCT · 612/QĐ-BCT', '06/07/2025 (5 năm)', 'HRC Trung Quốc 23,10–27,83%; chống lẩn tránh HRC khổ rộng; đang rà soát lần 1', 'HRC', 'amend', 'hrc', '▲HPG ▼HSG, NKG'],
    ['CBPG tôn mạ', '2310/QĐ-BCT', '14/08/2025 (5 năm)', 'Trung Quốc tối đa 37,13%; Hyundai Steel 12%', 'Tôn mạ', 'on', 'coat', '▲HSG, NKG'],
    ['Điều tra CBPG mới', 'AD24 · AD25', 'Khởi xướng 27/07/2026; 11/2026', 'Thanh thép dự ứng lực; inox cán nguội; chưa có mức', 'Thép xây dựng', 'wait', 'newcase', '▲HPG'],
    ['Mỹ Mục 232 thép', 'Section 232', '04/06/2025', 'Thuế thép nhập vào Mỹ 25% lên 50%', 'Xuất khẩu', 'on', 'us232', '▼HSG, NKG'],
    ['Mỹ AD/CVD thép Việt Nam', 'A-552-843 · C-552-844', 'Lệnh CVD 19/12/2025', 'Tôn mạ AD 94,89–162,96%; thép thanh chờ ITC; điều tra lẩn tránh', 'Xuất khẩu', 'on', 'usad', '▼HSG, NKG, HPG, VGS, TVN'],
    ['EU: hạn ngạch, CBPG, CBAM', 'Quy định (EU) 2026/2547', '01/07/2026 · 17/11/2026', 'Hạn ngạch 18,35 triệu tấn/năm; CBPG cán nguội Việt Nam 16,0%; CBAM 2026', 'Xuất khẩu', 'on', 'eu', '▼HSG, NKG, HPG'],
    ['Canada, Australia, Mexico', 'TRQ Canada · RR-2025-006', '28/06/2026 – 27/06/2027', 'Canada phụ thu 50% phần vượt hạn ngạch; Australia đã chấm dứt CBPG tôn kẽm', 'Xuất khẩu', 'temp', 'other', 'HSG, NKG'],
    ['Chiến lược ngành thép', 'QĐ 261/QĐ-TTg', '09/02/2026', '2030: thép thô 25–26 triệu tấn, thành phẩm 32–33 triệu tấn', 'Toàn chuỗi', 'on', 'strat', 'Toàn ngành'],
  ],
  NODE_LAWS: {n2: ['newcase', 'strat'], n3: ['hrc'], n4: ['coat', 'usad', 'other'], n6: ['us232', 'usad', 'eu'], n9: ['hrc', 'coat', 'us232']},
  LAW_TAG: {hrc: {s: 'CBPG HRC', c: '#2938A8'}, coat: {s: 'CBPG tôn mạ', c: '#1E9C82'}, newcase: {s: 'Điều tra mới', c: '#D1583F'},
    us232: {s: 'Mục 232', c: '#861C52'}, usad: {s: 'AD/CVD Mỹ', c: '#B8432C'}, eu: {s: 'EU', c: '#B07D00'}, other: {s: 'Canada·Úc', c: '#5A6385'}, strat: {s: 'QĐ 261', c: '#2a9fa3'}},
  SPLIT: [
    {block: 'th-50', match: 'HRC', to: 'hrc', title: 'Biện pháp với HRC Trung Quốc'},
    {block: 'th-50', match: 'tôn mạ', to: 'coat', title: 'CBPG tôn mạ'},
    {block: 'th-50', match: 'dự ứng lực|không gỉ', to: 'newcase', title: 'Vụ điều tra đang mở'},
    {block: 'th-51', match: 'Mục 232', to: 'us232', title: 'Mỹ Mục 232'},
    {block: 'th-51', match: '^Mỹ', to: 'usad', title: 'Mỹ AD/CVD và điều tra lẩn tránh'},
    {block: 'th-51', match: '^EU', to: 'eu', title: 'Biện pháp của EU'},
    {block: 'th-51', match: 'Canada|Australia|Mexico', to: 'other', title: 'Canada, Australia, Mexico'},
  ],
};
