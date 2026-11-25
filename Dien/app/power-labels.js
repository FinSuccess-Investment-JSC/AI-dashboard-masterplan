/* Điện · đổi chữ tiếng Anh do các module dùng chung sinh ra sang tiếng Việt, CHỈ trên trang Điện (12/11/2026).
   Người dùng: "không ghi tiếng Anh nếu không bắt buộc", "chỉ làm với ngành điện". Không sửa file dùng chung
   (research-layout.js, financial-comparison.js, catalyst-board.js, research-editorial.js…), nên 15 ngành khác giữ nguyên.
   Giữ viết tắt chuyên ngành (PPA, Qc, FMP, LNG, EBITDA…) và tên riêng (S&P Global Market Intelligence…).
   Không đụng ô nhập liệu và vùng sửa được (contenteditable). Chạy lại khi module dùng chung vẽ lại (MutationObserver). */
(() => {
'use strict';
if (document.body.dataset.sector !== 'power') return;
// Cụm từ: thay trong mọi đoạn chữ (dài trước, ngắn sau).
const PHRASES = [
  [/Policy · Tax · Trade/g, 'Chính sách · Thuế · Thương mại'],
  [/Catalyst · Risk/g, 'Động lực · Rủi ro'],
  [/Catalyst \/ Risk/g, 'Động lực / Rủi ro'],
  [/Catalyst\/Risk/g, 'Động lực/Rủi ro'],
  [/Catalyst — yếu tố hỗ trợ/g, 'Động lực — yếu tố hỗ trợ'],
  [/Risk — rủi ro/g, 'Rủi ro'],
  [/\btab Policy\b/g, 'tab Chính sách'],
  [/\bFINANCIAL SNAPSHOT\b/g, 'SO SÁNH NHANH'],
  [/\bFinancial Snapshot\b/g, 'So sánh nhanh'],
  [/\bSnapshot tải\b/g, 'Bản chụp tải'],
  [/Góc nhìn riêng của analyst/g, 'Góc nhìn riêng của chuyên viên phân tích'],
  [/Rumor do analyst theo dõi/g, 'Tin đồn chuyên viên đang theo dõi'],
  [/\banalyst\b/g, 'chuyên viên'],
  [/dashboard chuyên đề/g, 'trang chuyên đề'],
  [/\bYoY\b/g, 'so cùng kỳ']
];
// Nhãn đứng một mình (nút, tiêu đề cột).
const EXACT = {Risk: 'Rủi ro', Sources: 'Nguồn dữ liệu', Analyst: 'Chuyên viên', Catalyst: 'Động lực'};
const SKIP = 'script,style,textarea,input,select,[contenteditable]';
function fix(root) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const v = n.nodeValue; if (!v || !/[A-Za-z]/.test(v)) continue;
    if (n.parentElement?.closest(SKIP)) continue;
    const t = v.trim();
    if (EXACT[t]) { n.nodeValue = v.replace(t, EXACT[t]); continue; }
    let x = v; PHRASES.forEach(([re, b]) => { x = x.replace(re, b); });
    if (x !== v) n.nodeValue = x;
  }
}
let timer = null;
const run = () => { timer = null; fix(document.body); };
const later = () => { if (!timer) timer = setTimeout(run, 150); };
function start() {
  run();
  new MutationObserver(later).observe(document.body, {childList: true, subtree: true, characterData: true});
}
if (document.readyState === 'complete') setTimeout(start, 900); else addEventListener('load', () => setTimeout(start, 900));
})();
