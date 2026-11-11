const test = require('node:test');
const assert = require('node:assert/strict');
const model = require('./model.js');

function classroom(size = 30) {
  return model.createSession({ className: 'QA', sessionId: 'synthetic-storage-session',
    roster: Array.from({ length: size }, (_, index) => ({ id: `qa-${index}`, studentCode: `QA${index}`,
      seatNumber: String(index + 1), name: `测试学生 ${index + 1}` })) });
}
function normalized(state) { return model.importBackup(model.exportBackup(state)); }
function roundTrip(state) {
  const saved = model.exportStorage(state);
  const result = model.importBackup(saved);
  assert.deepEqual(result, normalized(state));
  assert.equal(model.exportSessionCsv(result), model.exportSessionCsv(normalized(state)));
  return result;
}

test('long class stores all answers and every undo step without quadratic snapshots', () => {
  let state = classroom();
  for (let index = 0; index < 120; index++) state = model.recordVolunteer(state, `qa-${index % 30}`);
  const legacy = model.exportBackup(state);
  const compact = model.exportStorage(state);
  assert.ok(legacy.length > 5 * 1024 * 1024, 'reproduces Web Storage overflow with old representation');
  assert.ok(compact.length < 250000, `compact storage uses ${compact.length} characters`);
  assert.ok(compact.length < legacy.length / 30);
  const restored = roundTrip(state);
  assert.equal(restored.undoStack.length, 120);
  assert.equal(model.summarizeAttempts(restored.attempts).totalAnswerCount, 120);
});

test('legacy backup and compact save preserve pending question, teacher call, absence and context undo', () => {
  let state = classroom(3);
  state = model.drawStudent(state, { randomIndex: () => 0 });
  const pendingId = model.pendingAttempt(state).id;
  state = model.recordVolunteer(state, 'qa-1', { selectionMethod: 'teacher' });
  state = roundTrip(state);
  assert.equal(model.pendingAttempt(state).id, pendingId);
  state = model.recordResponse(state, { taskPrompt: '请介绍学校', note: '测试备注', answerContext: 'prepared' });
  state = roundTrip(state);
  state = model.setAbsent(state, 'qa-2', true);
  state = roundTrip(state);
  state = model.setSessionContext(state, { lessonId: 'lesson-02' });
  state = roundTrip(state);
  const restored = model.undoLastAction(state);
  assert.equal(restored.session.lessonId, 'lesson-01');
  state = roundTrip(restored);
  assert.deepEqual(state.excludedStudentIds, []);
  assert.equal(state.attendanceChanges['qa-2'].restoreOriginal, true);
  state = roundTrip(model.undoLastAction(state));
  assert.equal(model.pendingAttempt(state).id, pendingId);
});

test('all undo steps survive repeated save reload cycles without losing tombstones or audit events', () => {
  let state = classroom(3);
  for (let index = 0; index < 12; index++) state = model.recordVolunteer(state, `qa-${index % 3}`);
  const ids = state.attempts.map(attempt => attempt.id).sort();
  for (let remaining = 11; remaining >= 0; remaining--) {
    state = model.undoLastAction(roundTrip(state));
    assert.equal(model.summarizeAttempts(state.attempts).totalAnswerCount, remaining);
    assert.equal(state.undoStack.length, remaining);
  }
  state = roundTrip(state);
  assert.deepEqual(state.attempts.map(attempt => attempt.id).sort(), ids);
  assert.ok(state.attempts.every(attempt => attempt.recordStatus === 'voided'));
  assert.equal(state.events.filter(event => event.type === 'undo').length, 12);
});

test('storage encoding does not mutate state and ordinary exported backups stay readable', () => {
  const state = model.recordVolunteer(classroom(2), 'qa-0');
  const before = model.exportBackup(state);
  roundTrip(state);
  assert.equal(model.exportBackup(state), before);
  assert.equal(JSON.parse(before).storageFormat, undefined);
  assert.ok(JSON.parse(before).undoStack[0].before);
  const restored = model.importBackup(before);
  assert.deepEqual(model.importBackup(model.exportStorage(restored)), restored);
});

test('malformed or unsupported compact undo cannot silently discard recovery data', () => {
  const valid = JSON.parse(model.exportStorage(model.recordVolunteer(classroom(2), 'qa-0')));
  for (const mutate of [
    value => { value.storageFormat = 'future-v99'; },
    value => { value.undoStack[0].reverse = ['invalid']; },
    value => { delete value.undoStack[0].reverse; },
    value => { value.undoStack[0].reverse = ['object', [], [['attempts', ['array', Number.MAX_SAFE_INTEGER, []]]]]; },
    value => { value.undoStack[0].reverse = ['object', [], [['__proto__', ['value', {}]]]]; },
    value => { value.undoStack[0].reverse = ['object', [], [['session', ['value', { id: 'wrong-session' }]]]]; }
  ]) {
    const broken = structuredClone(valid); mutate(broken);
    assert.throws(() => model.importBackup(broken), /备份/);
  }
  assert.equal({}.polluted, undefined);
});
