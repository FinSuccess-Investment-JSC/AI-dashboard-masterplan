/* Industry financial aggregation engine (dùng lại cho mọi ngành; 25/11/2026, sub-tab 07 Tài chính ngành của Điện).
   Bản Hàng không (27/11/2026): ratio(..., opts.posDen) để trống khi mẫu số không dương (VCSH âm, EBITDA âm).
   Đầu vào: dữ liệu dạng window.POWER_FIN (scripts/build_power_financials.py):
     {periods:['2019Q1'…], years:['2019'…], groups:[{id,label,color,default}], companies:[{ticker,group}],
      consolidation:[{parent,child,since}], items:[{id,kind:'flow'|'stock'}], data:{ticker:{metric:[…theo periods]}},
      cf_annual:{ticker:{metric:[…theo years]}}}
   Nguyên tắc:
   - Chỉ tiêu tuyệt đối = tổng các doanh nghiệp được chọn; doanh nghiệp thiếu số kỳ đó không được cộng (độ phủ ghi trong cov).
   - Hệ số = tổng tử số / tổng mẫu số trên CÙNG tập doanh nghiệp có đủ cả hai (không lấy trung bình các hệ số).
   - Loại trùng hợp nhất: nếu cả công ty mẹ và công ty con cùng được chọn, công ty mẹ dùng số (mẹ − con) từ kỳ 'since'.
   - Flow (doanh thu, lợi nhuận, dòng tiền): quý = số phát sinh trong quý; TTM = tổng 4 quý liền, đủ cả 4 quý;
     năm = tổng 4 quý (KQKD) hoặc số báo cáo năm (LCTT, cf_annual). Stock (số dư): cuối kỳ; bình quân = (cuối kỳ + cùng kỳ năm trước)/2.
   - Null giữ nguyên null; không đổi thành 0. */
(() => {
'use strict';
const fin = v => typeof v === 'number' && Number.isFinite(v);
const sum = a => a.reduce((x, y) => x + y, 0);
function quantile(arr, q) { const a = arr.filter(fin).sort((x, y) => x - y); if (!a.length) return null; const i = (a.length - 1) * q, lo = Math.floor(i), hi = Math.ceil(i); return a[lo] + (a[hi] - a[lo]) * (i - lo); }

// Chỉ tiêu dẫn xuất theo từng doanh nghiệp, từng kỳ (thiếu một thành phần thì null).
const DERIVED = {
  ebit: {kind: 'flow', name: 'EBIT hoạt động (LN gộp − CP bán hàng − CP QLDN)', f: r => r.gross - r.selling - r.admin, need: ['gross', 'selling', 'admin']},
  ebitda: {kind: 'flow', name: 'EBITDA (EBIT hoạt động + khấu hao)', f: r => r.gross - r.selling - r.admin + r.da, need: ['gross', 'selling', 'admin', 'da']},
  fin_net: {kind: 'flow', name: 'Thu nhập tài chính ròng + liên kết', f: r => r.fin_income - r.fin_exp + r.assoc, need: ['fin_income', 'fin_exp', 'assoc']},
  fcf: {kind: 'flow', name: 'FCF giản lược (CFO − CAPEX tiền mặt)', f: r => r.cfo - r.capex, need: ['cfo', 'capex']},
  net_borrow: {kind: 'flow', name: 'Vay nợ ròng (vay nhận − trả gốc)', f: r => r.borrow - r.repay, need: ['borrow', 'repay']},
  opex_other: {kind: 'flow', name: 'Giá vốn trừ khấu hao', f: r => r.cogs - r.da, need: ['cogs', 'da']},
  sga: {kind: 'flow', name: 'CP bán hàng + QLDN', f: r => r.selling + r.admin, need: ['selling', 'admin']},
  debt: {kind: 'stock', name: 'Nợ vay (ngắn + dài hạn)', f: r => r.st_debt + r.lt_debt, need: ['st_debt', 'lt_debt']},
  cash_all: {kind: 'stock', name: 'Tiền + đầu tư tài chính ngắn hạn', f: r => r.cash + r.st_invest, need: ['cash', 'st_invest']},
  net_debt: {kind: 'stock', name: 'Nợ vay ròng', f: r => r.st_debt + r.lt_debt - r.cash - r.st_invest, need: ['st_debt', 'lt_debt', 'cash', 'st_invest']},
  ic: {kind: 'stock', name: 'Vốn đầu tư (VCSH + nợ vay − tiền − đầu tư ngắn hạn)', f: r => r.equity + r.st_debt + r.lt_debt - r.cash - r.st_invest, need: ['equity', 'st_debt', 'lt_debt', 'cash', 'st_invest']}
};

function create(D) {
  const P = D.periods, Y = D.years || [...new Set(P.map(p => p.slice(0, 4)))];
  const kind = Object.fromEntries((D.items || []).map(i => [i.id, i.kind]));
  Object.entries(DERIVED).forEach(([k, d]) => { kind[k] = d.kind; });
  const tickers = D.companies.map(c => c.ticker), groupOf = Object.fromEntries(D.companies.map(c => [c.ticker, c.group]));
  // Dữ liệu quý + dẫn xuất
  const Q = {};
  tickers.forEach(t => { const src = D.data[t] || {}; Q[t] = {...src};
    Object.entries(DERIVED).forEach(([k, d]) => { Q[t][k] = P.map((_, i) => { const r = {}; for (const n of d.need) { const v = src[n]?.[i]; if (!fin(v)) return null; r[n] = v; } return d.f(r); }); }); });
  // Năm: LCTT từ báo cáo năm, KQKD = tổng 4 quý, số dư = quý 4
  const CFA = D.cf_annual || {};
  const qIdx = (y, k) => P.indexOf(`${y}Q${k}`);
  const annual = (t, m) => Y.map((y, yi) => {
    if (kind[m] === 'stock') { const i = qIdx(y, 4); return i < 0 ? null : (Q[t][m]?.[i] ?? null); }
    if (CFA[t] && CFA[t][m]) return CFA[t][m][yi] ?? null;
    if (m in DERIVED) { const d = DERIVED[m], r = {}; for (const n of d.need) { const v = annual(t, n)[yi]; if (!fin(v)) return null; r[n] = v; } return d.f(r); }
    const idx = [1, 2, 3, 4].map(k => qIdx(y, k)); if (idx.some(i => i < 0)) return null;
    const v = idx.map(i => Q[t][m]?.[i]); return v.every(fin) ? sum(v) : null;
  });
  const AN = {}; const annualOf = (t, m) => ((AN[t] ||= {})[m] ||= annual(t, m));
  const cons = (D.consolidation || []).filter(c => tickers.includes(c.parent) && tickers.includes(c.child));
  const labels = mode => mode === 'y' ? Y : P;
  const sinceIdx = (c, mode) => mode === 'y' ? Y.findIndex(y => y >= String(c.since || '').slice(0, 4)) : P.findIndex(p => p >= (c.since || ''));

  // Chuỗi của một doanh nghiệp theo chế độ: q | ttm | y; avg = bình quân (cuối kỳ + cùng kỳ năm trước) cho số dư.
  function raw(t, m, mode, avg) {
    if (mode === 'y') { const a = annualOf(t, m); return avg && kind[m] === 'stock' ? a.map((v, i) => i && fin(v) && fin(a[i - 1]) ? (v + a[i - 1]) / 2 : null) : a; }
    const s = Q[t][m] || P.map(() => null);
    if (kind[m] === 'stock') return avg ? s.map((v, i) => i >= 4 && fin(v) && fin(s[i - 4]) ? (v + s[i - 4]) / 2 : null) : s;
    if (mode === 'ttm') return s.map((_, i) => { if (i < 3) return null; const w = s.slice(i - 3, i + 1); return w.every(fin) ? sum(w) : null; });
    return s;
  }
  // Áp dụng loại trùng cho tập đã chọn.
  function series(t, m, mode, avg, sel) {
    let s = raw(t, m, mode, avg);
    cons.filter(c => c.parent === t && sel.has(c.child)).forEach(c => { const ch = raw(c.child, m, mode, avg), k0 = sinceIdx(c, mode);
      // Con thiếu số kỳ đó: giữ số hợp nhất của mẹ (đã gồm con), con không được cộng riêng (null) nên không trùng.
      s = s.map((v, i) => k0 >= 0 && i >= k0 && fin(v) && fin(ch[i]) ? v - ch[i] : v); });
    return s;
  }
  const per = (m, sel, mode, avg) => { const S = new Set(sel); return Object.fromEntries(sel.map(t => [t, series(t, m, mode, avg, S)])); };

  // Tổng tuyệt đối
  function total(m, sel, mode, opts = {}) {
    const pv = per(m, sel, mode, opts.avg), L = labels(mode);
    const values = L.map((_, i) => { const v = sel.map(t => pv[t][i]).filter(fin); return v.length ? sum(v) : null; });
    const cov = L.map((_, i) => sel.filter(t => fin(pv[t][i])).length);
    return {labels: L, values, cov, n: sel.length, per: pv};
  }
  // Tổng theo nhóm
  function byGroup(m, sel, mode, opts = {}) {
    const gs = D.groups.filter(g => sel.some(t => groupOf[t] === g.id));
    const pv = per(m, sel, mode, opts.avg), L = labels(mode);
    return {labels: L, groups: gs.map(g => { const ts = sel.filter(t => groupOf[t] === g.id);
      return {...g, tickers: ts, values: L.map((_, i) => { const v = ts.map(t => pv[t][i]).filter(fin); return v.length ? sum(v) : null; }), cov: L.map((_, i) => ts.filter(t => fin(pv[t][i])).length)}; }), per: pv};
  }
  // Hệ số: num, den = {m, avg?, scale?}; cùng tập doanh nghiệp có đủ cả hai.
  function ratio(num, den, sel, mode, scale = 1, opts = {}) {
    const a = per(num.m, sel, mode, num.avg), b = per(den.m, sel, mode, den.avg), L = labels(mode);
    const ok = (t, i) => fin(a[t][i]) && fin(b[t][i]);
    const values = L.map((_, i) => { const ts = sel.filter(t => ok(t, i)); if (!ts.length) return null; const d = sum(ts.map(t => b[t][i])); return d && (!opts.posDen || d > 0) ? sum(ts.map(t => a[t][i])) / d * scale : null; });
    const each = Object.fromEntries(sel.map(t => [t, L.map((_, i) => ok(t, i) && b[t][i] && (!opts.posDen || b[t][i] > 0) ? a[t][i] / b[t][i] * scale : null)]));
    const dist = L.map((_, i) => { const v = sel.map(t => each[t][i]); return {p25: quantile(v, .25), med: quantile(v, .5), p75: quantile(v, .75)}; });
    return {labels: L, values, cov: L.map((_, i) => sel.filter(t => ok(t, i)).length), n: sel.length, each, dist};
  }
  // So cùng kỳ trên cùng tập doanh nghiệp (like-for-like): chỉ doanh nghiệp có số ở cả hai kỳ; kỳ gốc phải dương.
  function growth(m, sel, mode, opts = {}) {
    const pv = per(m, sel, mode, opts.avg), L = labels(mode), k = mode === 'y' ? 1 : 4;
    const one = ts => L.map((_, i) => { if (i < k) return null; const ok = ts.filter(t => fin(pv[t][i]) && fin(pv[t][i - k])); if (!ok.length) return null; const b = sum(ok.map(t => pv[t][i - k])); return b > 0 ? (sum(ok.map(t => pv[t][i])) / b - 1) * 100 : null; });
    return {labels: L, values: one(sel), groups: D.groups.filter(g => sel.some(t => groupOf[t] === g.id)).map(g => ({...g, values: one(sel.filter(t => groupOf[t] === g.id))}))};
  }
  const tickersOf = groupIds => tickers.filter(t => groupIds.includes(groupOf[t]));
  return {periods: P, years: Y, labels, groups: D.groups, companies: D.companies, tickers, groupOf, kind, consolidation: cons, total, byGroup, ratio, per, growth, series: (t, m, mode, avg, sel) => series(t, m, mode, avg, new Set(sel || [t])), tickersOf, quantile, DERIVED};
}
window.IndustryFin = {create, DERIVED};
})();
