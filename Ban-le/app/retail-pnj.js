/* Bán lẻ › Bức tranh ngành › Trang sức: theo dõi mạng lưới cửa hàng PNJ (27/11/2026).
   - bl-80: số cửa hàng PNJ công bố theo kỳ (nhập tay từ báo cáo PNJ/báo chí trích PNJ, xem STORES bên dưới).
   - bl-81: cửa hàng PNJ theo tỉnh/thành và 3 miền (Bizmap.live, window.RETAIL_BIZMAP).
   - bl-82: thay đổi theo tuần (ảnh chụp Bizmap hằng tuần, data/retail/bizmap-history.json); ẩn tới khi có ≥2 ảnh chụp.
   Chỉ số tổng hợp theo tỉnh, không có tọa độ từng cửa hàng. */
(() => {
'use strict';
if (document.body.dataset.sector !== 'retail' || document.body.dataset.pkg) return;
const byId = id => document.getElementById(id);
const nf = (v, d = 0) => Number.isFinite(v) ? v.toLocaleString('vi-VN', {minimumFractionDigits: d, maximumFractionDigits: d}) : '—';
const dd = s => s ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4) : '—';
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const GOLD = '#9C6B1E', GOLD2 = '#D9B26F', GREY = '#9AAAC8';
const src = (card, html) => { if (!card || card.querySelector('.pw-src')) return; const n = document.createElement('div'); n.className = 'pw-src'; n.innerHTML = 'Nguồn: ' + html; n.dataset.tidied = n.innerHTML; card.append(n); };

/* Số cửa hàng PNJ công bố: [kỳ, tổng điểm bán, cửa hàng thương hiệu PNJ | null, nguồn, url]. Tổng điểm bán gồm PNJ, Style by PNJ, CAO, trung tâm sỉ. */
const STORES = [
  ["2017", 269, 202, "The Leader", "https://theleader.vn/chien-luoc-cua-pnj-the-gioi-di-dong-cua-nganh-vang-trang-suc-d31274.html"],
  ["2018", 324, null, "BSC", "https://www.bsc.com.vn/Report/ReportFile/6228"],
  ["2019", null, null, "chưa đối chiếu được", ""],
  ["2020", 339, 299, "VNDirect", "https://www.vndirect.com.vn/cmsupload/beta/PNJ_BCCapnhat_20210122.pdf"],
  ["2021", 341, 319, "Nhịp cầu Đầu tư", "https://nhipcaudautu.vn/en/companies/phu-nhuan-jewelry-reports-2021-after-tax-profit-at-over-vnd1-trillion-down-4-3343872"],
  ["2022", 364, 343, "VnEconomy", "https://vneconomy.vn/nam-2022-doanh-thu-vang-24k-cua-pnj-tang-gan-75.htm"],
  ["2023", 400, 391, "The Leader", "https://theleader.vn/pnj-lai-sau-thue-gan-2000-ty-dong-d5863.html"],
  ["2024", 429, 421, "Thị trường Tài chính Tiền tệ", "https://thitruongtaichinhtiente.vn/doanh-thu-quy-iv-giam-pnj-van-lai-ky-luc-hon-2-100-ty-dong-nam-2024-65356.html"],
  ["2025", 431, 424, "VnExpress", "https://vnexpress.net/pnj-bao-lai-ky-luc-5008274.html"],
  ["Q1/2026", 430, 422, "Doanh nhân & Pháp luật", "https://doanhnhan.baophapluat.vn/bung-no-mang-vang-24k-loi-nhuan-cua-vang-bac-da-quy-phu-nhuan-pnj-quy-i-2026-cao-gap-doi-cung-ky.html"],
  ["Q2/2026", 430, 422, "CafeF", "https://cafef.vn/pnj-duy-tri-da-tang-truong-trong-nua-dau-nam-2026-188260731132600826.chn"],
  ["Q3/2026", 403, 396, "VietTimes", "https://viettimes.vn/pnj-va-nhung-con-so-biet-noi-trong-bao-cao-tai-chinh-quy-iii-post207774.html"],
];
// 2017–2022: cửa hàng PNJ = PNJ Gold; từ 2023 gộp Silver, Watch, Art vào cửa hàng PNJ. Năm = cuối năm, quý = cuối quý.

function renderOfficial() {
  const host = byId('pnjStores'); if (!host) return;
  if (!STORES.length) { host.closest('.card')?.remove(); return; }
  barLineChart('pnjStores', {categories: STORES.map(r => r[0]), series: [{name: 'Tổng điểm bán PNJ công bố', color: GOLD, values: STORES.map(r => r[1] ?? null)}, {name: 'Cửa hàng thương hiệu PNJ', color: GOLD2, kind: 'line', values: STORES.map(r => r[2] ?? null)}], unit: 'cửa hàng', digits: 0, height: 280, zeroBase: false, ariaLabel: 'Số cửa hàng PNJ công bố theo kỳ'});
  fillTable('tbl-pnj-stores', ['Kỳ', 'Tổng điểm bán', 'Cửa hàng PNJ', 'Nguồn'], STORES.map(r => [r[0], r[1] == null ? '—' : nf(r[1]), r[2] == null ? '—' : nf(r[2]), r[4] ? `<a href="${esc(r[4])}" target="_blank" rel="noopener">${esc(r[3])}</a>` : esc(r[3])]));
  const names = [...new Set(STORES.filter(r => r[4]).map(r => r[3]))];
  src(host.closest('.card'), 'PNJ (báo cáo thường niên, công bố KQKD) qua ' + names.join(', '));
}

const D = window.RETAIL_BIZMAP, P = D?.chains?.pnj;
const REG = ['Bắc', 'Trung', 'Nam'];
function renderGeo() {
  const host = byId('pnjGeo'); if (!host) return;
  if (!P?.provinces) { host.closest('.card')?.remove(); return; }
  const rows = Object.entries(P.provinces).sort((a, b) => b[1] - a[1]), tot = rows.reduce((a, r) => a + r[1], 0);
  const top = rows.slice(0, 14), rest = rows.slice(14);
  const items = top.map(([p, n]) => ({label: p, value: n, color: GOLD}));
  if (rest.length) items.push({label: `${rest.length} tỉnh/thành còn lại`, value: rest.reduce((a, r) => a + r[1], 0), color: GREY});
  hbarCompare('pnjGeo', {items, unit: 'cửa hàng', digits: 0, labelW: 170, ariaLabel: 'Cửa hàng PNJ theo tỉnh/thành, Bizmap'});
  const reg = byId('pnjReg');
  if (reg && P.regions) reg.innerHTML = REG.map(r => { const v = P.regions[r] || 0, s = tot ? v / tot * 100 : 0;
    return `<div class="pnj-reg"><div class="pnj-reg-h"><span>Miền ${r}</span><b>${nf(v)}</b><small>${nf(s, 0)}%</small></div><div class="bn-rbar"><span style="width:${s.toFixed(1)}%;background:${GOLD}"></span></div></div>`; }).join('');
  fillTable('tbl-pnj-geo', ['Tỉnh/thành', 'Cửa hàng', '% mạng lưới'], rows.map(([p, n]) => [p, nf(n), nf(n / tot * 100, 1) + '%']));
  src(host.closest('.card'), `<a href="https://bizmap.live/" target="_blank" rel="noopener">Bizmap.live</a> (API), cập nhật ${dd(D.source_updated || D.captured_at)}`);
}

function renderWeekly() {
  const host = byId('pnjWeek'); if (!host) return;
  const H = (D?.history || []).filter(s => s.chains?.pnj);
  if (H.length < 2) { host.closest('.card')?.remove(); return; }
  barLineChart('pnjWeek', {categories: H.map(s => dd(s.date)), series: [{name: 'PNJ · Bizmap ghi nhận', color: GOLD, kind: 'line', values: H.map(s => s.chains.pnj.stores)}], unit: 'cửa hàng', digits: 0, height: 240, zeroBase: false, rotateLabels: true});
  const a = H.at(-2).chains.pnj.provinces || {}, b = H.at(-1).chains.pnj.provinces || {};
  const diff = [...new Set([...Object.keys(a), ...Object.keys(b)])].map(p => [p, (b[p] || 0) - (a[p] || 0)]).filter(r => r[1]).sort((x, y) => y[1] - x[1]);
  fillTable('tbl-pnj-week', ['Tỉnh/thành', `Thay đổi ${dd(H.at(-2).date)} → ${dd(H.at(-1).date)}`], diff.length ? diff.map(([p, d]) => [p, (d > 0 ? '+' : '') + nf(d)]) : [['Không đổi', '0']]);
  src(host.closest('.card'), '<a href="https://bizmap.live/" target="_blank" rel="noopener">Bizmap.live</a> (API), ảnh chụp hằng tuần');
}

const run = () => { renderOfficial(); renderGeo(); renderWeekly(); };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
