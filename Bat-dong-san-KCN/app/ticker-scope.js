/* Phạm vi mã cổ phiếu của trang (25/11/2026, tách BĐS nhà ở / BĐS khu công nghiệp).
   Dữ liệu doanh nghiệp vẫn dùng chung (data/company-*.js, bot ghi theo ngành "realestate", nhóm "Khu công nghiệp").
   Trang BĐS KCN (body data-subsector="kcn") chỉ giữ nhóm Khu công nghiệp; trang Bất động sản bỏ nhóm đó.
   Nạp ngay sau data/company-quarterly.js, trước mọi module đọc danh sách doanh nghiệp. */
(() => {
  'use strict';
  if (document.body.dataset.sector !== 'realestate') return;
  const kcn = document.body.dataset.subsector === 'kcn';
  const GROUP = 'Khu công nghiệp';
  const keep = c => c.sector !== 'realestate' || (c.group === GROUP) === kcn;
  for (const name of ['COMPANY_COMPARISON', 'COMPANY_QUARTERLY']) {
    const d = window[name];
    if (d && Array.isArray(d.companies)) d.companies = d.companies.filter(keep);
  }
})();
