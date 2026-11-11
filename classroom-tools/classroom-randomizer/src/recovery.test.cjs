const test = require('node:test');
const assert = require('node:assert/strict');
const model = require('./model.js');

function session() {
  return model.createSession({ className: 'QA', roster: [{ id: 'A', name: '甲' }, { id: 'B', name: '乙' }] });
}
function draw(state) {
  return model.drawStudent(state, { randomIndex: () => 0 });
}

test('consecutive undo retains all attempt tombstones and audit events through reload and CSV', () => {
  let state = model.recordVolunteer(session(), 'A');
  state = model.recordVolunteer(state, 'B');
  const ids = state.attempts.map(a => a.id);
  state = model.undoLastAction(state);
  state = model.importBackup(model.exportBackup(state));
  state = model.undoLastAction(state);
  assert.deepEqual(new Set(state.attempts.map(a => a.id)), new Set(ids));
  assert.ok(state.attempts.every(a => a.recordStatus === 'voided'));
  assert.equal(state.events.filter(e => e.type === 'undo').length, 2);
  assert.equal(model.getDrawingPool(state).length, 2);
  assert.equal(model.summarizeAttempts(state.attempts).totalAnswerCount, 0);
  assert.ok(ids.every(id => model.exportSessionCsv(state).includes(id)));
});

test('undo response restores same pending identity with a fresh update, then voids the draw', () => {
  let state = draw(session());
  const id = model.pendingAttempt(state).id;
  state = model.recordResponse(state, { taskPrompt: '今天怎么样？', note: '完整回答' });
  state.undoStack.at(-1).before.attempts[0].updatedAt = '2000-01-01T00:00:00.000Z';
  state = model.undoLastAction(state);
  assert.equal(model.pendingAttempt(state).id, id);
  assert.equal(state.attempts[0].outcome, 'pending');
  assert.equal(state.attempts[0].updatedAt, state.session.updatedAt);
  state = model.undoLastAction(model.importBackup(model.exportBackup(state)));
  assert.equal(state.attempts[0].recordStatus, 'voided');
  assert.equal(state.attempts[0].id, id);
  assert.equal(state.events.filter(e => e.type === 'undo').length, 2);
});

test('absence completion saves prompt and note and undo restores pending and attendance', () => {
  let state = draw(session());
  const id = model.pendingAttempt(state).id;
  state = model.setAbsent(state, 'A', true, { taskPrompt: '你住在哪里？', note: '点名后确认缺席', answerContext: 'prepared' });
  const attempt = state.attempts[0];
  assert.equal(attempt.taskPrompt, '你住在哪里？');
  assert.equal(attempt.note, '点名后确认缺席');
  assert.ok(attempt.questionId);
  assert.equal(attempt.noResponseReason, 'absent');
  state = model.undoLastAction(state);
  assert.equal(model.pendingAttempt(state).id, id);
  assert.equal(state.attendanceChanges.A.restoreOriginal, true);
  assert.deepEqual(state.excludedStudentIds, []);
});

test('absence options preserve existing pending context unless explicitly replaced', () => {
  let state = draw(session());
  model.pendingAttempt(state).taskPrompt = '原题目';
  model.pendingAttempt(state).note = '原备注';
  state = model.setAbsent(state, 'A', true, { answerContext: 'prepared' });
  assert.equal(state.attempts[0].taskPrompt, '原题目');
  assert.equal(state.attempts[0].note, '原备注');
});

test('import rejects invalid pending links, orphan pending rows and cross-session undo before replacing data', () => {
  const valid = draw(session());
  const corruptions = [
    state => { state.currentRound.pendingAttemptId = 'missing'; },
    state => { state.currentRound.pendingAttemptId = null; },
    state => { state.attempts[0].outcome = 'answered'; },
    state => { state.attempts[0].recordStatus = 'voided'; },
    state => { state.attempts[0].roundNumber = 2; },
    state => { state.attempts[0].sessionId = 'other-session'; },
    state => { state.excludedStudentIds = ['A']; },
    state => { state.attempts.push({ ...state.attempts[0], id: 'second-pending' }); },
    state => { state.roster.push({ ...state.roster[0] }); },
    state => { state.currentRound.answeredStudentIds = ['unknown']; },
    state => { state.undoStack[0].before.session.id = 'other-session'; },
    state => { state.undoStack[0].before.currentRound.pendingAttemptId = 'missing'; }
  ];
  for (const corrupt of corruptions) {
    const backup = JSON.parse(model.exportBackup(valid));
    corrupt(backup);
    assert.throws(() => model.importBackup(backup), /备份/);
  }
  assert.equal(model.pendingAttempt(valid).studentId, 'A');
  assert.equal(model.importBackup(model.exportBackup(valid)).undoStack.length, 1);
});
