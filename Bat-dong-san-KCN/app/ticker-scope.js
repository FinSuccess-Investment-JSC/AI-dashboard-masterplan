/* BĐS KCN · phạm vi mã cổ phiếu của trang (25/11/2026).
   Dữ liệu doanh nghiệp dùng chung (data/company-*.js) xếp 7 mã KCN vào ngành "realestate", nhóm "Khu công nghiệp".
   Trang này (body data-sector="industrial") chỉ giữ nhóm đó và đổi ngành thành "industrial" để bảng so sánh tài chính,
   xu hướng theo quý và định giá dùng đúng tập mã; bot và tệp dữ liệu không đổi.
   Nạp ngay sau data/company-quarterly.js, trước mọi module đọc danh sách doanh nghiệp. */
(() => {
  'use strict';
  if (document.body.dataset.sector !== 'industrial') return;
  const GROUP = 'Khu công nghiệp';
  for (const name of ['COMPANY_COMPARISON', 'COMPANY_QUARTERLY']) {
    const d = window[name];
    if (!d || !Array.isArray(d.companies)) continue;
    d.companies = d.companies.filter(c => c.sector !== 'realestate' || c.group === GROUP)
      .map(c => c.sector === 'realestate' ? {...c, sector: 'industrial', group: 'Hạ tầng khu công nghiệp'} : c);
  }
})();
