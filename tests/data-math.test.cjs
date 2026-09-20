const assert=require('node:assert/strict'),M=require('../assets/data-math.js');
const d=(date,value)=>({date,value});
const brent=[d('2026-09-01',100),d('2026-09-02',110),d('2026-09-03',105)];
const gas=[d('2026-09-01',3),d('2026-09-03',4)];
const diesel=[d('2026-09-01',4),d('2026-09-02',5)];
const cracks=M.cracks(brent,gas,diesel);
assert.equal(cracks.length,1);assert.equal(cracks[0].diesel_crack,68);assert.equal(cracks[0].gasoline_crack,26);assert.equal(cracks[0].crack321,40);
assert.equal(M.aggregate(brent)[0].value,105);assert.equal(M.aggregate(brent,'value','month','last')[0].value,105);
const rs=Array.from({length:7},(_,i)=>d('2026-09-0'+(i+1),i));
assert.equal(M.rolling(rs).at(-1).average,3);assert.equal(M.rolling(rs.slice(1)).at(-1).average,null);
const gapped=M.calendar([{date:'2026-09-01',tanker:0},{date:'2026-09-03',tanker:2}]);assert.equal(gapped[1].tanker,null);assert.equal(gapped[0].tanker,0);
assert.equal(M.signal(null,10,30),'missing');assert.equal(M.signal(5,10,30),'low');
console.log('PASS: aligned dates, gallon conversion, aggregation, calendar gaps, rolling mean, missing signals');

// Period close crosses year boundaries using Monday weeks, retains nulls, and never mutates inputs.
const closing=[d('2026-01-02',2),d('2025-12-31',1),d('2026-01-05',3),d('2026-01-06',null)];
assert.deepEqual(M.periodClose(closing,'week'),[{date:'2025-12-29',last_date:'2026-01-02',value:2},{date:'2026-01-05',last_date:'2026-01-06',value:null}]);
assert.equal(closing[0].date,'2026-01-02');
assert.deepEqual(M.periodClose(closing,'year').map(r=>r.value),[1,null]);
assert.deepEqual(M.periodClose([],'month'),[]);
assert.throws(()=>M.periodClose(closing,'invalid'));
