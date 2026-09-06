const test = require("node:test");
const assert = require("node:assert/strict");
const model = require("./model.js");

function roster(count = 30) {
  return Array.from({ length: count }, (_, index) => ({
    studentCode: `S${String(index + 1).padStart(2, "0")}`,
    seatNumber: String(index + 1),
    name: `學生${index + 1}`
  }));
}

function drawById(state, studentId, options = {}) {
  const pool = model.getSelectablePool(state);
  const index = pool.findIndex((student) => student.id === studentId);
  assert.notEqual(index, -1, `student ${studentId} should be selectable`);
  return model.drawStudent(state, { ...options, randomIndex: () => index });
}

function score(state, values = 3, options = {}) {
  const scores = {};
  model.RUBRIC_CRITERIA.forEach((criterion) => {
    scores[criterion.id] = values;
  });
  return model.scorePending(state, scores, options);
}

test("a 30-student round removes only students whose answers are completed", () => {
  let state = model.createSession({ className: "中級聽說", roster: roster() });

  for (let index = 1; index <= 30; index += 1) {
    state = drawById(state, `S${String(index).padStart(2, "0")}`);
    state = score(state, index % 4);
  }

  const progress = model.getProgress(state);
  assert.equal(progress.eligibleCount, 30);
  assert.equal(progress.answeredCount, 30);
  assert.equal(progress.poolCount, 0);
  assert.equal(progress.roundComplete, true);
  assert.equal(state.attempts.length, 30);
  assert.equal(model.getSummary(state)[0].scoredCount, 1);
});

test("a student who does not answer stays in the pool and can be drawn later", () => {
  let state = model.createSession({ roster: roster(3) });
  state = drawById(state, "S01");
  state = model.returnPending(state, { note: "暫時沒有回答" });

  assert.equal(model.getDrawingPool(state).map((student) => student.id).includes("S01"), true);
  assert.equal(state.attempts[0].outcome, "not_answered");
  assert.equal(state.attempts[0].totalScore, null);
  assert.equal(typeof state.attempts[0].updatedAt, "string");
  assert.equal(model.getProgress(state).answeredCount, 0);

  state = drawById(state, "S02");
  state = score(state, 2);
  state = drawById(state, "S03");
  state = score(state, 2);
  state = drawById(state, "S01");
  state = score(state, 3);

  assert.equal(model.getProgress(state).roundComplete, true);
  assert.equal(state.attempts.filter((attempt) => attempt.studentId === "S01").length, 2);
});

test("a deferred score completes the round without creating a zero", () => {
  let state = model.createSession({ roster: roster(1) });
  state = drawById(state, "S01");
  state = model.deferPending(state, { note: "課堂結束前補評" });

  assert.equal(model.getProgress(state).roundComplete, true);
  assert.equal(model.getPendingAssessments(state).length, 1);
  assert.equal(model.getSummary(state)[0].pendingAssessmentCount, 1);
  assert.equal(model.getSummary(state)[0].scoredCount, 0);

  const attemptId = state.attempts[0].id;
  const scores = Object.fromEntries(model.RUBRIC_CRITERIA.map((criterion) => [criterion.id, 2]));
  state = model.saveAssessment(state, attemptId, scores);
  assert.equal(model.getPendingAssessments(state).length, 0);
  assert.equal(model.getSummary(state)[0].totalScore, 8);
});

test("a saved assessment can be edited without changing its attempt identity", () => {
  let state = model.createSession({ roster: roster(1) });
  state = drawById(state, "S01");
  state = model.deferPending(state, { note: "先記錄，稍後補評" });
  const attemptId = state.attempts[0].id;
  const firstScores = Object.fromEntries(model.RUBRIC_CRITERIA.map((criterion) => [criterion.id, 1]));
  state = model.saveAssessment(state, attemptId, firstScores, { note: "需要加強聲調", countedForGrade: true });
  const firstUpdatedAt = state.attempts[0].updatedAt;
  const secondScores = Object.fromEntries(model.RUBRIC_CRITERIA.map((criterion) => [criterion.id, 3]));
  state = model.saveAssessment(state, attemptId, secondScores, { note: "", countedForGrade: false });

  assert.equal(state.attempts[0].id, attemptId);
  assert.equal(state.attempts[0].totalScore, 12);
  assert.equal(state.attempts[0].note, "");
  assert.equal(state.attempts[0].countedForGrade, false);
  assert.equal(typeof state.attempts[0].updatedAt, "string");
  assert.equal(state.events.at(-1).type, "assessment_saved");
  assert.equal(state.attempts[0].updatedAt >= firstUpdatedAt, true);
});

test("the next round resets eligibility, while the new session resets only the pool", () => {
  let state = model.createSession({ roster: roster(2) });
  state = drawById(state, "S01");
  state = score(state, 3);
  state = drawById(state, "S02");
  state = score(state, 3);
  state = model.startNextRound(state);

  assert.equal(state.currentRound.number, 2);
  assert.deepEqual(model.getDrawingPool(state).map((student) => student.id), ["S01", "S02"]);
  assert.equal(state.attempts.length, 2);

  const historyScore = state.attempts[0].totalScore;
  const fresh = model.createSession({ roster: roster(2) });
  assert.deepEqual(model.getDrawingPool(fresh).map((student) => student.id), ["S01", "S02"]);
  assert.equal(fresh.attempts.length, 0);
  assert.equal(historyScore, 12);
});

test("undo restores the previous pool state and keeps an audit event", () => {
  let state = model.createSession({ roster: roster(2) });
  state = drawById(state, "S01");
  assert.equal(Boolean(model.pendingAttempt(state)), true);
  state = model.undoLastAction(state);

  assert.equal(model.pendingAttempt(state), null);
  assert.deepEqual(model.getDrawingPool(state).map((student) => student.id), ["S01", "S02"]);
  assert.equal(state.attempts.length, 1);
  assert.equal(state.attempts[0].outcome, "undone");
  assert.match(model.exportSessionCsv(state), /undone/);
  assert.equal(state.events.at(-1).type, "undo");
});

test("roster parsing and backup/export retain assessment fields", () => {
  const parsed = model.parseRosterText("學號,中文姓名,座號\nS01,王小明,1\nS02,李小華,2");
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].name, "王小明");
  const localRoster = model.parseRosterText("學號,學生姓名,座號\nS03,Lê Thị Thu An,1");
  assert.equal(localRoster[0].name, "Lê Thị Thu An");

  let state = model.createSession({
    className: "LT_01",
    textbookId: "boya-quasi-intermediate-i",
    lessonId: "lesson-07",
    roster: parsed
  });
  state = drawById(state, "S01");
  state = score(state, 3);
  const backup = model.importBackup(model.exportBackup(state));
  const csv = model.exportSessionCsv(backup);
  assert.equal(backup.session.className, "LT_01");
  assert.equal(backup.session.textbookId, "boya-quasi-intermediate-i");
  assert.equal(backup.session.lessonId, "lesson-07");
  assert.equal(backup.attempts[0].lessonId, "lesson-07");
  assert.match(csv, /textbook_title/);
  assert.match(csv, /lesson_number/);
  assert.match(csv, /lesson-07/);
  assert.match(csv, /,7,/);
  assert.doesNotMatch(csv, /question_label/);
  assert.match(csv, /12/);
  assert.match(csv, /updated_at/);
  assert.match(csv, /T/);
});

test("legacy backups receive default textbook and lesson metadata", () => {
  const state = model.createSession({ roster: roster(1) });
  const legacy = JSON.parse(model.exportBackup(state));
  legacy.schemaVersion = 1;
  delete legacy.session.textbookId;
  delete legacy.session.lessonId;
  const migrated = model.importBackup(legacy);

  assert.equal(migrated.schemaVersion, model.SCHEMA_VERSION);
  assert.equal(migrated.session.textbookId, "boya-quasi-intermediate-i");
  assert.equal(migrated.session.lessonId, "lesson-01");
});

test("lesson options are bounded by the selected textbook", () => {
  const state = model.createSession({
    textbookId: "boya-intermediate-i",
    lessonId: "lesson-12",
    roster: roster(1)
  });

  assert.equal(state.session.textbookId, "boya-intermediate-i");
  assert.equal(state.session.lessonId, "lesson-08");
  assert.equal(model.TEXTBOOK_OPTIONS.find((item) => item.id === state.session.textbookId).lessonCount, 8);
});

test("switching lessons changes later attempts without rewriting earlier records", () => {
  let state = model.createSession({ lessonId: "lesson-01", roster: roster(2) });
  state = drawById(state, "S01");
  state = score(state, 2);
  state = model.setSessionContext(state, "boya-quasi-intermediate-i", "lesson-02");
  state = drawById(state, "S02");

  assert.equal(state.session.lessonId, "lesson-02");
  assert.equal(state.attempts[0].lessonId, "lesson-01");
  assert.equal(state.attempts[1].lessonId, "lesson-02");
  assert.equal(state.events.at(-2).type, "lesson_changed");
});

test("voluntary participation is recorded without consuming a random drawing slot", () => {
  let state = model.createSession({ roster: roster(2) });
  state = model.selectVolunteer(state, "S01");
  assert.equal(model.pendingAttempt(state).selectionMethod, "volunteer");
  state = score(state, 3);

  assert.deepEqual(state.currentRound.answeredStudentIds, []);
  assert.deepEqual(model.getDrawingPool(state).map((student) => student.id), ["S01", "S02"]);
  assert.equal(state.attempts[0].outcome, "answered");
  assert.equal(state.events.some((event) => event.type === "volunteer_selected"), true);
});

test("raw classroom records preserve response context, no-response reason, and source summaries", () => {
  let state = model.createSession({ className: "LT_01", lessonId: "lesson-01", roster: roster(3) });
  state = drawById(state, "S01");
  state = score(state, 3, { responseStatus: "partial", answerContext: "unprepared" });
  state = model.selectVolunteer(state, "S02");
  state = score(state, 2, { responseStatus: "peer_supported", answerContext: "prepared" });
  state = drawById(state, "S03");
  state = model.returnPending(state, { noResponseReason: "unprepared", answerContext: "unprepared" });

  const summary = model.summarizeAttempts(state.attempts);
  assert.equal(summary.attempts, 3);
  assert.equal(summary.totalAnswerCount, 2);
  assert.equal(summary.effectiveAnswerCount, 2);
  assert.equal(summary.randomCallCount, 2);
  assert.equal(summary.randomCallEffectiveAnswerCount, 1);
  assert.equal(summary.voluntarySpeakingCount, 1);
  assert.equal(summary.voluntaryEffectiveAnswerCount, 1);
  assert.equal(summary.rawScoredCount, 2);
  assert.equal(summary.noResponseReasonStats.unprepared, 1);
  assert.equal(state.attempts[0].responseStatus, "partial");
  assert.equal(state.attempts[0].answerContext, "unprepared");
  assert.equal(state.attempts[2].responseStatus, "no_response");
  assert.equal(state.attempts[2].noResponseReason, "unprepared");

  const csv = model.exportSessionCsv(state);
  assert.match(csv, /event_type/);
  assert.match(csv, /response_status/);
  assert.match(csv, /no_response_reason/);
  assert.match(csv, /voluntary_speaking/);
  assert.match(csv, /unprepared/);
});

test("formative preview weights prepared voluntary evidence but keeps it capped", () => {
  let state = model.createSession({ className: "LT_01", lessonId: "lesson-01", roster: roster(1) });
  state = drawById(state, "S01");
  state = score(state, 2, { answerContext: "prepared" });
  state = model.selectVolunteer(state, "S01");
  state = score(state, 3, { answerContext: "prepared" });

  const summary = model.getSummary(state)[0];
  assert.equal(summary.totalAnswerCount, 2);
  assert.equal(summary.voluntarySpeakingCount, 1);
  assert.equal(summary.formativePreview.preparedVoluntaryAnswerCount, 1);
  assert.equal(summary.formativePreview.voluntaryInitiative, 33.3);
  assert.equal(summary.formativePreview.evidenceCoverage, 66.7);
  assert.equal(summary.formativePreview.randomResponseRate, 100);
  assert.ok(Math.abs(summary.formativeIndexPreview - 82) < 0.1);

  let unprepared = model.createSession({ className: "LT_01", lessonId: "lesson-01", roster: roster(1) });
  unprepared = model.selectVolunteer(unprepared, "S01");
  unprepared = score(unprepared, 3, { answerContext: "unprepared" });
  const unpreparedSummary = model.getSummary(unprepared)[0];
  assert.equal(unpreparedSummary.totalAnswerCount, 1);
  assert.equal(unpreparedSummary.formativePreview.preparedVoluntaryAnswerCount, 0);
  assert.equal(unpreparedSummary.formativePreview.voluntaryInitiative, 0);
  assert.match(model.exportStudentSummaryCsv(state), /formative_index_preview/);
});

test("five answers in one lesson remain five independent raw records", () => {
  let state = model.createSession({ className: "LT_01", lessonId: "lesson-01", roster: roster(1) });
  for (let index = 0; index < 5; index += 1) {
    state = drawById(state, "S01");
    state = score(state, index % 4);
    if (index < 4) state = model.startNextRound(state);
  }

  const summary = model.summarizeAttempts(state.attempts);
  const exported = model.getStudentSummaryRows(state);
  assert.equal(state.attempts.length, 5);
  assert.equal(summary.totalAnswerCount, 5);
  assert.equal(summary.rawScoredCount, 5);
  assert.equal(exported.rows.length, 1);
  assert.equal(exported.rows[0][5], 5);
  assert.equal(exported.rows[0][6], 5);
  assert.match(model.exportStudentSummaryCsv(state), /lesson_summaries/);
  assert.match(model.exportStudentSummaryCsv(state), /第 1 课/);
});

test("the default random pool prefers students with fewer random calls after the first draw", () => {
  let state = model.createSession({ roster: roster(3) });
  assert.equal(model.getRandomSelectionPool(state).length, 3);
  state = drawById(state, "S01");
  state = score(state, 3);

  assert.deepEqual(model.getRandomSelectionPool(state).map((student) => student.id).sort(), ["S02", "S03"]);
});
