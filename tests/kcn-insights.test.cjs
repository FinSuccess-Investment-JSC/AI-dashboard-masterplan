// Bộ quy tắc KCN (assets/kcn-insights.js) trên dữ liệu thật data/kcn-market.js và dữ liệu giả:
// không nối qua đổi phạm vi, không cộng hai nguồn, rolling 4Q chỉ khi đủ quý liên tiếp, ẩn số năm đủ cung khi thiếu điều kiện.
const assert = require('assert');
globalThis.window = globalThis;
require('../data/kcn-market.js');
const K = require('../assets/kcn-insights.js');
const D = window.KCN_MARKET;
const clone = o => JSON.parse(JSON.stringify(o));
const noBad = v => assert.doesNotMatch(JSON.stringify(v), /NaN|Infinity|undefined/, 'không có NaN/Infinity/undefined');

// 1. Chuỗi hấp thụ tách theo nguồn + phạm vi; CBRE Q3/2026 là ước tính; cận dưới ">130" đi kèm số 134.
{
  const s = K.absorptionSeries(D);
  assert.deepStrictEqual(s.map(x => x.id).sort(), ['cbre-North', 'cbre-South', 'cw-post-North', 'cw-post-South', 'cw-pre-North', 'cw-pre-South']);
  const cb = s.find(x => x.id === 'cbre-North');
  assert.strictEqual(cb.points.find(p => p.period === '2026Q3').cls, 'ESTIMATE');
  assert.strictEqual(cb.points.find(p => p.period === '2026Q1').lower, 130);
  // Không có quý nào bị điền: C&W Bắc sau sáp nhập chỉ có Q4/2025.
  assert.deepStrictEqual(s.find(x => x.id === 'cw-post-North').points.map(p => p.period), ['2025Q4']);
}
// 2. Rolling 4Q: dữ liệu hiện tại chưa đủ; dữ liệu giả 4 quý liên tiếp thì tính, có quý ước tính thì gắn est.
{
  K.absorptionSeries(D).forEach(x => assert.strictEqual(K.rolling4(x).ok, false));
  const fake = {reporter: 'C&W', region: 'North', cohort: 'POST', points: ['2025Q3', '2025Q4', '2026Q1', '2026Q2', '2026Q3'].map((p, i) => ({period: p, value: 100 + i * 10, cls: i === 4 ? 'ESTIMATE' : 'ACTUAL'}))};
  const r = K.rolling4(fake);
  assert.ok(r.ok); assert.deepStrictEqual(r.values.map(v => [v.period, v.value, v.est]), [['2026Q2', 460, false], ['2026Q3', 500, true]]);
  const gap = {...fake, points: fake.points.filter(p => p.period !== '2026Q1')};
  assert.strictEqual(K.rolling4(gap).ok, false, 'thiếu một quý thì không tính');
}
// 3. So cùng kỳ chỉ trong cùng phạm vi: Q3/2026 so Q3/2025 được; Q2/2026 so Q2/2025 (qua mốc đổi phạm vi) bị chặn.
{
  const ok = K.change(D, 'North', 'occ', '2025Q3', '2026Q3');
  assert.ok(ok.ok); assert.ok(Math.abs(ok.abs + 0.02) < 1e-9);
  const bad = K.change(D, 'North', 'stock_ha', '2025Q2', '2026Q2');
  assert.strictEqual(bad.ok, false); assert.match(bad.reason, /phạm vi/);
  const usd = K.change(D, 'North', 'ask_usd', '2025Q3', '2026Q3');
  assert.strictEqual(usd.ok, false, 'Q3/2026 không có giá USD: không so qua đổi đơn vị');
}
// 4. Thay đổi nguồn cung: quý đổi phạm vi và quý điều chỉnh số nền để trống, không thành cung âm.
{
  const s = K.stockDelta(D, 'South');
  assert.strictEqual(s.find(x => x.period === '2025Q3').value, null);
  ['2026Q2', '2026Q3'].forEach(p => { const x = s.find(v => v.period === p); assert.strictEqual(x.value, null); assert.ok(x.raw < 0); });
  assert.strictEqual(s.find(x => x.period === '2026Q1').value, 0);
  assert.strictEqual(K.stockDelta(D, 'North').find(x => x.period === '2026Q1').value, 1132);
}
// 5. Trạng thái chu kỳ: miền Nam Q4/2025 → Q1/2026 hấp thụ tăng, lấp đầy tăng; miền Bắc sau sáp nhập chưa có cặp quý.
{
  const s = K.regimes(D, 'South').find(g => g.cohort === 'POST');
  assert.strictEqual(s.key, 'demand_exceeds'); assert.strictEqual(s.from, '2025Q4');
  assert.strictEqual(K.regimes(D, 'North').filter(g => g.cohort === 'POST').length, 0);
}
// 6. Số năm đủ cung bị ẩn khi chưa đủ 4 quý; dữ liệu giả đủ điều kiện thì tính = đất trống ÷ hấp thụ năm.
{
  ['North', 'South'].forEach(r => { const y = K.yearsOfSupply(D, r); assert.strictEqual(y.ok, false); assert.ok(y.reasons.length); });
  const F = clone(D);
  F.absorption = F.absorption.filter(a => !(a.region === 'North' && a.coverage === 'C&W_POST_2025_MERGER'));
  ['2025Q4', '2026Q1', '2026Q2', '2026Q3'].forEach(p => F.absorption.push({period: p, region: 'North', reporter: 'Cushman & Wakefield', coverage: 'C&W_POST_2025_MERGER', ptype: 'Quarter', value: 150, obs: 'ACTUAL'}));
  const y = K.yearsOfSupply(F, 'North');
  assert.ok(y.ok, JSON.stringify(y)); assert.ok(Math.abs(y.value - 8909.25 / 600) < 1e-6);
}
// 7. Quy tắc đang kích hoạt trên số thật và lý do chặn.
{
  const R = K.rules(D);
  const ids = R.fired.map(f => `${f.id}:${f.scope}`);
  ['R1:Cả nước', 'R2:Miền Bắc', 'R3:Tây Ninh', 'R4:TP.HCM', 'R5:Miền Bắc', 'R5:Tây Ninh', 'R6:IDC'].forEach(k => assert.ok(ids.includes(k), k));
  assert.ok(!ids.includes('R2:Miền Nam'), 'miền Nam lấp đầy tăng: không gán pha loãng');
  assert.ok(!ids.some(k => k.startsWith('R6:') && k !== 'R6:IDC'), 'chỉ IDC có chuỗi ký mới 3 năm');
  R.fired.forEach(f => { assert.ok(f.headline && f.evidence.length && f.interp && f.implication && f.threshold); assert.ok(f.sources.length || f.link); });
  assert.ok(R.insufficient.some(x => x.id === 'R7' && /Số năm đủ cung/.test(x.text)));
  // R2 không dùng số ước tính CBRE Q3/2026 làm bằng chứng hấp thụ dương.
  assert.doesNotMatch(R.fired.find(f => f.id === 'R2').evidence.join(' '), /VIETCAP26/);
  noBad(R);
}
// 8. Kế hoạch không được tính là thực hiện: thêm kế hoạch 2026 vào lịch sử thì chuỗi vẫn dừng ở 2025.
{
  const F = clone(D); F.lease.push({ticker: 'IDC', year: 2026, value_ha: 100, type: 'COMPANY_PLAN'});
  assert.deepStrictEqual(K.leaseMomentum(F, 'IDC').rows.map(r => r.year), [2023, 2024, 2025]);
  assert.strictEqual(K.leaseMomentum(D, 'KBC').ok, false);
}
// 9. Ma trận giá: ngưỡng chỉnh được đổi nhóm.
{
  assert.strictEqual(K.quadrant(0.851, 0.075), 'HH');
  assert.strictEqual(K.quadrant(0.729, -0.001), 'LL');
  assert.strictEqual(K.quadrant(0.729, -0.001, {...K.TH, m_occ: 0.70, m_rent: -0.01}), 'HH');
}
// 10. Ngưỡng cao hơn thì quy tắc không kích hoạt (không có câu cố định).
{
  const R = K.rules(D, {...K.TH, r1_yoy: 2, r2_stock: 0.5, r4_occ: 0.95, r3_occ: 0.5, r5_ratio: 0.9, r5_share: 0.9, r6_move: 0.9});
  assert.strictEqual(R.fired.length, 0, R.fired.map(f => f.id).join(','));
}
console.log('kcn-insights: 10 nhóm kiểm tra đạt');
