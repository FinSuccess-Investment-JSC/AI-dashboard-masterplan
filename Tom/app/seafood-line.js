/* Cá tra / Tôm (26/11/2026): dữ liệu doanh nghiệp chung (data/company-*.js) vẫn ghi sector "seafood" cho cả 7 mã.
   Trang của một ngành giữ sector "seafood" cho mã của mình (bảng so sánh, xu hướng, Tài chính ngành lọc theo đó) và
   gắn mã của ngành kia sang route của ngành kia (pangasius | shrimp): ô tra cứu mã trên trang này mở đúng dashboard.
   Nạp ngay sau data/company-*.js, trước company-trend.js / financial-comparison.js / research-layout.js. */
(() => {
  'use strict';
  const line = document.body.dataset.seafoodLine; if (!line) return;
  const GROUP = {'Cá tra': 'pangasius', 'Đa ngành': 'pangasius', 'Tôm': 'shrimp'};
  const SYMBOL = {VHC: 'pangasius', ANV: 'pangasius', IDI: 'pangasius', ASM: 'pangasius', FMC: 'shrimp', MPC: 'shrimp', CMX: 'shrimp'};
  const mine = line === 'shrimp' ? 'shrimp' : 'pangasius';
  const relabel = list => (Array.isArray(list) ? list : []).forEach(c => {
    if (c.sector !== 'seafood') return;
    const own = SYMBOL[c.symbol] || GROUP[c.group];
    if (own && own !== mine) c.sector = own;
  });
  relabel(window.COMPANY_COMPARISON?.companies);
  relabel(window.COMPANY_QUARTERLY?.companies);
  relabel(window.COMPANY_QUARTERLY?.missing);
  relabel(window.COMPANY_VALUATION?.companies);
})();
