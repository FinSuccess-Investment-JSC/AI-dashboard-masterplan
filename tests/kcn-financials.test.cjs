// Kiểm dữ liệu tài chính ngành KCN (data/kcn-financials.js) chạy được qua bộ tổng hợp Dien/app/industry-fin.js.
const assert = require('node:assert/strict'), fs = require('fs'), path = require('path');
global.window = {};
eval(fs.readFileSync(path.join(__dirname, '../Dien/app/industry-fin.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, '../data/kcn-financials.js'), 'utf8'));
const {create} = window.IndustryFin, F = window.KCN_FIN;
assert.ok(F, 'thiếu window.KCN_FIN');
assert.equal(F.schema, 1);
assert.ok(F.periods.length >= 20, 'thiếu kỳ BCTC');
assert.deepEqual(F.groups.map(g => g.id), ['north', 'south', 'diversified']);
for (const c of F.companies) {
  assert.ok(F.data[c.ticker], 'thiếu dữ liệu ' + c.ticker);
  for (const k of Object.keys(F.data[c.ticker])) assert.equal(F.data[c.ticker][k].length, F.periods.length, c.ticker + ' ' + k);
}
assert.deepEqual(F.checks.is_recon, []);
assert.deepEqual(F.checks.bs_recon, []);
const R = create(F), last = F.periods.length - 1;
for (const g of F.groups) {
  const tk = R.tickersOf([g.id]);
  assert.ok(tk.length > 0, 'nhóm rỗng ' + g.id);
  const rev = R.total('revenue', tk, 'q'), ta = R.total('total_assets', tk, 'q');
  assert.ok(rev.values.some(v => Number.isFinite(v)), 'doanh thu nhóm ' + g.id + ' trống');
  assert.ok(Number.isFinite(ta.values[last]), 'tổng tài sản nhóm ' + g.id + ' quý mới nhất trống');
}
const def = R.tickersOf(F.groups.filter(x => x.default).map(x => x.id));
assert.equal(R.total('revenue', def, 'q').cov[last], def.length, 'quý mới nhất thiếu doanh thu');
assert.ok(R.total('npat', def, 'ttm').values.some(Number.isFinite), 'LNST TTM trống');
assert.ok(R.ratio({m: 'npat'}, {m: 'equity'}, def, 'q', 100).values.some(Number.isFinite), 'ROE trống');
assert.equal(R.total('npat', def, 'y').values.length, F.years.length);
console.log('kcn-financials ok:', F.companies.length, 'doanh nghiệp (mặc định', def.length + '),', F.periods.length, 'quý', F.periods[0], '→', F.periods[last]);
