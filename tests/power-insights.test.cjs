// Bộ quy tắc nhận định Điện (assets/power-insights.js): tăng, giảm, đi ngang, thiếu dữ liệu, dữ liệu cũ; công thức chi phí nhiên liệu.
const assert = require('assert');
const I = require('../assets/power-insights.js');

const base = () => ({
  today: '2026-11-12', mLabel: 'T10/2026', fmpLabel: 'T9/2026', fuelParams: {GAS_USD: 11.98},
  dates: {daily: '2026-11-10', month: '2026-10', fmp: '2026-09', fuel: '2026-11-10', oni: '2026-09-30', reservoir: '2026-11-11'},
  demand: {yoy: 16.4, ytd: 11.0, energyYtd: 11.0, accelNow: 12.7, accelBefore: 12.2, sameSign3: 3, pmax: 57537, pmaxDate: '24/06/2026', pmaxYoY: 5.8},
  hydro: {yoy: -36.1, ytd: -16.8, sameSign3: 3, waterYoY: -62, waterSpan: '1–11/11/2026', water5y: -38, oni: 2.46, oniSeason: 'ASO 2026'},
  dispatch: {thermalDpp: 5.2, hydroDpp: -8.2, thermalSameSign3: 3, coalYoY: 68, gasYoY: 61, reYoY: 62},
  price: {fmp: 1555, fmpYoY: 125.4, fmpMoM: 29.3, fmpSameSign3: 3, coal3: -1.5, jkm3: 35.2, hh3: -10}
});

// 1. Số hiện tại: headline đủ vế, top 3 xếp theo tiêu chí, thủy điện đứng đầu (biên độ cao, kéo dài, liên quan trực tiếp).
{
  const f = base(), st = I.state(f), top = I.top(f);
  assert.ok(st.valid, 'headline hợp lệ'); assert.match(st.text, /thủy điện giảm mạnh/i); assert.match(st.text, /chuyển sang nhiệt điện/); assert.match(st.text, /Qc/);
  assert.strictEqual(top.length, 3); assert.strictEqual(top[0].id, 'hydro');
  top.forEach(c => { assert.ok(c.headline && c.why && c.confirm); assert.ok(I.describe(c).length === 4); });
}
// 2. Đảo chiều (tăng): thủy điện tăng → headline "tăng"; không còn vế dịch chuyển sang nhiệt điện.
{
  const f = base(); f.hydro.yoy = 25; f.dispatch = {...f.dispatch, thermalDpp: -4, hydroDpp: 5};
  const st = I.state(f); assert.ok(st.valid); assert.match(st.text, /thủy điện tăng mạnh/i); assert.doesNotMatch(st.text, /nhiệt điện/);
  assert.match(I.candidates(f).find(c => c.id === 'hydro').headline, /\+25,0%/);
}
// 3. Đi ngang: thay đổi dưới ngưỡng → không sinh insight tương ứng; headline thiếu vế thì không xuất.
{
  const f = base(); f.hydro.yoy = 3; f.dispatch.thermalDpp = 0.5; f.dispatch.hydroDpp = -0.4; f.price.fmpYoY = 5; f.price.jkm3 = 2; f.hydro.oni = 0.2; f.demand.yoy = 5;
  assert.strictEqual(I.candidates(f).length, 0, 'không insight khi mọi biến dưới ngưỡng');
  const st = I.state(f); assert.ok(!st.valid || !/mạnh|chuyển sang/.test(st.text));
}
// 4. Thiếu dữ liệu: null không sinh insight, không ném lỗi, nhu cầu báo Insufficient.
{
  const f = base(); f.hydro.yoy = null; f.demand.yoy = null; f.dispatch.thermalDpp = null; f.price = {};
  assert.doesNotThrow(() => I.top(f)); assert.ok(!I.candidates(f).some(c => ['hydro', 'demand', 'dispatch', 'fmp'].includes(c.id)));
  assert.strictEqual(I.demand(f).status, 'Insufficient');
  I.matrix(f).forEach(r => assert.ok(r.seg && r.operating));
}
// 5. Dữ liệu cũ: bản tin quá 10 ngày → headline không xuất, insight dựa bản tin bị loại khỏi top.
{
  const f = base(); f.today = '2026-12-15';
  assert.ok(!I.state(f).valid); assert.ok(!I.top(f).some(c => ['hydro', 'dispatch', 'demand'].includes(c.id)));
  assert.ok(I.candidates(f).filter(c => c.id === 'hydro').every(c => c.timely === false));
}
// 6. Nhu cầu: điện năng tăng nhanh hơn đỉnh → không kết luận giờ cao điểm bớt căng; có danh sách "chưa thể kết luận".
{
  const d = I.demand(base());
  assert.match(d.headline, /chủ yếu ở điện năng/); assert.ok(d.cannot.some(x => /Chưa thể kết luận hệ thống giờ cao điểm/.test(x)));
  assert.ok(!d.lines.some(x => /chưa căng/.test(x[1])));
}
// 7. Ma trận: tách LNG khỏi khí nội; dòng thiếu dữ liệu ghi rõ, không nêu tác động lợi nhuận.
{
  const m = I.matrix(base()); const segs = m.map(r => r.seg);
  ['Thủy điện', 'Nhiệt điện than', 'Điện khí nội địa', 'LNG', 'Gió & mặt trời', 'EPC, tư vấn, thiết bị điện'].forEach(s => assert.ok(segs.includes(s), s));
  m.forEach(r => { if (r.dir !== 'Insufficient') assert.match(r.earnings, /chưa xác định/); });
}
// 8. Công thức chi phí nhiên liệu và kịch bản.
{
  const coal = I.coalCost(100, 25000, 2411.6, 6000); assert.ok(Math.abs(coal - 1004.83) < 0.1, coal);   // 100 USD/t × 25.000 ÷ 1.000 × 2.411,6 ÷ 6.000
  const gas = I.gasCost(10, 2, 6542.96, 25000); assert.ok(Math.abs(gas - 1962.89) < 0.1, gas);             // 12 USD/MMBtu × 6.542,96 BTU/kWh ÷ 10⁶ × 25.000
  assert.strictEqual(I.coalCost(null, 25000, 2411.6, 6000), null);
  const s = I.scenario({tech: 'coal', fuel: 100, fx: 25000, hr: 2411.6, hhv: 6000, fmp: 1500, market: 40});
  assert.ok(Math.abs(s.spread - (1500 - coal)) < 1e-6 && Math.abs(s.marketSpread - s.spread * 0.4) < 1e-6 && s.status === 'Scenario');
}
console.log('PASS: power insights — current, rising, flat, missing, stale, demand wording, matrix, fuel formulas');
