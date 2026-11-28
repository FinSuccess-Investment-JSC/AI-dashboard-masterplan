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
  // 28/11/2026: BCTC cộng gộp (data/seafood-financials.js, nạp trước file này) chung cho hai trang: giữ nhóm của trang
  // (nhóm có line = pang | shrimp, xem scripts/seafood_fin_items.py) để Tài chính ngành › 01 và 03 Định giá chỉ tính mã của ngành.
  const F = window.SEAFOOD_FIN;
  if (F && Array.isArray(F.groups)) {
    const want = line === 'shrimp' ? 'shrimp' : 'pang';
    F.groups = F.groups.filter(g => (g.line || 'pang') === want);
    const ids = new Set(F.groups.map(g => g.id));
    F.companies = (F.companies || []).filter(c => ids.has(c.group));
    const keep = new Set(F.companies.map(c => c.ticker));
    F.consolidation = (F.consolidation || []).filter(c => keep.has(c.parent) && keep.has(c.child));
  }
})();
