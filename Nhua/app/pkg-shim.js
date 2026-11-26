/* Gói ngành tách từ Bán lẻ: trang chạy pipeline chung với data-sector="retail" (research-layout, bảng so sánh, xu hướng quý…).
   Trước khi các module đó chạy, lọc dữ liệu doanh nghiệp về rổ của ngành (data-pkg) và gắn nhãn sector="retail" để
   bảng so sánh, bộ lọc mã, chart xu hướng chỉ hiện mã của ngành này. Dữ liệu gốc data/company-*.js không đổi. */
(() => {
'use strict';
const key = document.body.dataset.pkg; if (!key) return;
const pick = list => (list || []).filter(r => r.sector === key).map(r => ({...r, sector: 'retail'}));
const cc = window.COMPANY_COMPARISON; if (cc?.companies) window.COMPANY_COMPARISON = {...cc, companies: pick(cc.companies)};
const cq = window.COMPANY_QUARTERLY; if (cq?.companies) window.COMPANY_QUARTERLY = {...cq, companies: pick(cq.companies), missing: pick(cq.missing)};
})();
