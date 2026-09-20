const assert=require('node:assert/strict');
const {compare}=require('../assets/financial-comparison.js');
const values=[null,20,3,-1,undefined,0];
assert.deepEqual(values.slice().sort((a,b)=>compare(a,b,1)),[-1,0,3,20,null,undefined]);
assert.deepEqual(values.slice().sort((a,b)=>compare(a,b,-1)),[20,3,0,-1,null,undefined]);
assert.equal(compare(null,0,-1),1);assert.equal(compare(null,null,1),0);
console.log('PASS: numeric sorting, zero/negative values and missing values last');
