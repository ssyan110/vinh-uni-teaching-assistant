const assert = require('node:assert/strict');
const {needsGrading,nextStudent} = require('./web/queue.js');
const students = ['a','b','c','d'].map(code=>({code}));
const records = {a:{status:'done',flags:[]},b:{status:'absent',flags:[]},c:{status:'supplement',flags:[]},d:{status:'done',flags:[]}};
assert.equal(nextStudent(students,'a',records,''),'c');
assert.equal(nextStudent([students[0]],'a',records,''),null); // Search/filter scopes the next student.
records.c.status='done';
assert.equal(nextStudent(students,'a',records,''),null); // Never wrap to a completed grade.
records.b.flags=['待核对'];
assert.equal(nextStudent(students,'a',records,''),'b');
assert.equal(needsGrading({status:'pending',flags:[]}),true);
assert.equal(nextStudent(students,'missing',{},''),'a');
console.log('UI queue: absence, review, search scope and completion checks passed.');
