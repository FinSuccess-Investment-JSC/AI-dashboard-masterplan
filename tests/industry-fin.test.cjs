// Kiểm bộ tổng hợp tài chính ngành (Dien/app/industry-fin.js) trên dữ liệu nhỏ dựng tay và trên data/power-financials.js.
const assert = require('node:assert/strict'), fs = require('fs'), path = require('path');
global.window = {};
eval(fs.readFileSync(path.join(__dirname, '../Dien/app/industry-fin.js'), 'utf8'));
const {create} = window.IndustryFin;
const P = ['2024Q1', '2024Q2', '2024Q3', '2024Q4', '2025Q1', '2025Q2', '2025Q3', '2025Q4'];
const D = {periods: P, years: ['2024', '2025'], groups: [{id: 'a', label: 'A'}, {id: 'b', label: 'B'}],
  companies: [{ticker: 'M', group: 'a'}, {ticker: 'C', group: 'b'}, {ticker: 'X', group: 'b'}],
  consolidation: [{parent: 'M', child: 'C', since: '2024Q1'}], items: [{id: 'npat', kind: 'flow'}, {id: 'equity', kind: 'stock'}, {id: 'cfo', kind: 'flow'}],
  data: {M: {npat: [10, 10, 10, 10, 20, 20, 20, 20], equity: [100, 100, 100, 100, 120, 120, 120, 120], cfo: [5, 5, 5, 5, 5, 5, 5, 5]},
         C: {npat: [4, 4, 4, 4, 4, 4, 4, 4], equity: [40, 40, 40, 40, 40, 40, 40, 40], cfo: [1, 1, null, 1, 1, 1, 1, 1]},
         X: {npat: [1, 1, 1, 1, null, 2, 2, 2], equity: [10, 10, 10, 10, 10, 10, 10, 10], cfo: [1, 1, 1, 1, 1, 1, 1, 1]}},
  cf_annual: {M: {cfo: [20, 20]}, C: {cfo: [4, 4]}, X: {cfo: [4, 4]}}};
const E = create(D);
// TTM: tổng 4 quý liền; X thiếu Q1/2025 nên mọi cửa sổ TTM chứa quý đó đều không có X
const t = E.total('npat', ['M', 'C', 'X'], 'ttm');
assert.equal(t.values[3], 40 - 16 + 16 + 4); // M−C (24) + C (16) + X (4)
assert.equal(t.cov[3], 3);
assert.equal(t.cov[7], 2); // cửa sổ Q1–Q4/2025 chứa quý X thiếu
// Loại trùng: chọn cả mẹ và con → mẹ trừ con; chỉ chọn mẹ → số hợp nhất
assert.equal(E.total('npat', ['M', 'C'], 'q').values[0], 10);
assert.equal(E.total('npat', ['M'], 'q').values[0], 10);
assert.equal(E.series('M', 'npat', 'q', false, ['M', 'C'])[0], 6);
// Con thiếu số kỳ đó → mẹ giữ số hợp nhất, con không cộng
assert.equal(E.total('cfo', ['M', 'C'], 'q').values[2], 5);
// Hệ số = tổng tử ÷ tổng mẫu trên cùng tập (X thiếu tử ở Q1/2025 nên không vào mẫu kỳ đó)
const r = E.ratio({m: 'npat'}, {m: 'equity'}, ['M', 'X'], 'q', 100);
assert.equal(r.values[4], 20 / 120 * 100);
assert.equal(Math.round(r.values[5] * 1000) / 1000, Math.round(22 / 130 * 100 * 1000) / 1000);
// Bình quân số dư TTM = (cuối kỳ + cùng kỳ năm trước)/2
assert.equal(E.total('equity', ['M'], 'ttm', {avg: true}).values[7], 110);
// Năm: KQKD = tổng 4 quý, LCTT = báo cáo năm
assert.deepEqual(E.total('npat', ['M'], 'y').values, [40, 80]);
assert.deepEqual(E.total('cfo', ['M'], 'y').values, [20, 20]);
// So cùng kỳ trên cùng tập: Q2/2025 so Q2/2024 với M (con không chọn) và X
const g = E.growth('npat', ['M', 'X'], 'q');
assert.equal(Math.round(g.values[5] * 100) / 100, Math.round(((20 + 2) / (10 + 1) - 1) * 10000) / 100);
assert.equal(Math.round(g.values[4] * 100) / 100, 100); // X thiếu Q1/2025 → chỉ M

// Dữ liệu thật: mọi doanh nghiệp có kỳ, cân đối và KQKD không lệch, hợp nhất đúng danh sách
eval(fs.readFileSync(path.join(__dirname, '../data/power-financials.js'), 'utf8'));
const F = window.POWER_FIN;
assert.ok(F.periods.length >= 20, 'thiếu kỳ BCTC');
assert.deepEqual(F.checks.is_recon, []);
assert.deepEqual(F.checks.bs_recon, []);
assert.deepEqual(F.consolidation.map(c => c.parent + '-' + c.child).sort(), ['PGV-BTP', 'POW-NT2', 'REE-VSH']);
const R = create(F), def = R.tickersOf(F.groups.filter(x => x.default).map(x => x.id)), last = F.periods.length - 1;
assert.equal(R.total('revenue', def, 'q').cov[last], def.length, 'quý mới nhất thiếu doanh thu');
console.log('industry-fin ok:', def.length, 'doanh nghiệp,', F.periods[0], '→', F.periods[last]);
