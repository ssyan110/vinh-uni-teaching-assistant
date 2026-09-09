const test = require("node:test");
const assert = require("node:assert/strict");
const model = require("./model.js");

function roster(count = 30) {
  return Array.from({ length: count }, (_, index) => ({
    studentCode: `S${String(index + 1).padStart(2, "0")}`,
    seatNumber: String(index + 1),
    name: `学生${index + 1}`
  }));
}

function drawById(state, studentId, options = {}) {
  const pool = model.getSelectablePool(state);
  const index = pool.findIndex((student) => student.id === studentId);
  assert.notEqual(index, -1, `student ${studentId} should be selectable`);
  return model.drawStudent(state, { ...options, randomIndex: () => index });
}

function record(state, options = {}) {
  return model.recordResponse(state, options);
}

test("a 30-student round removes a student only after a response is recorded", () => {
  let state = model.createSession({ className: "LT_02", roster: roster() });

  for (let index = 1; index <= 30; index += 1) {
    state = drawById(state, `S${String(index).padStart(2, "0")}`);
    assert.throws(() => model.drawStudent(state), /先完成目前这位学生的回答/);
    state = record(state, {
      responseStatus: index % 3 === 0 ? "partial" : "answered",
      answerContext: index % 2 === 0 ? "prepared" : "unknown"
    });
  }

  const progress = model.getProgress(state);
  assert.equal(progress.eligibleCount, 30);
  assert.equal(progress.answeredCount, 30);
  assert.equal(progress.poolCount, 0);
  assert.equal(progress.roundComplete, true);
  assert.equal(state.attempts.length, 30);
  assert.equal(state.attempts.every((attempt) => attempt.outcome === "answered"), true);
  assert.equal(state.attempts.some((attempt) => Object.hasOwn(attempt, "scores")), false);
  assert.equal(state.attempts.some((attempt) => Object.hasOwn(attempt, "totalScore")), false);
});

test("an unanswered student stays in the drawing pool and can be called again", () => {
  let state = model.createSession({ roster: roster(3) });
  state = drawById(state, "S01");
  state = model.returnPending(state, { noResponseReason: "unprepared", answerContext: "unprepared" });

  assert.equal(model.getDrawingPool(state).some((student) => student.id === "S01"), true);
  assert.equal(state.attempts[0].outcome, "not_answered");
  assert.equal(state.attempts[0].responseStatus, "no_response");
  assert.equal(state.attempts[0].noResponseReason, "unprepared");
  assert.equal(model.getProgress(state).answeredCount, 0);

  state = record(drawById(state, "S02"));
  state = record(drawById(state, "S03"));
  state = record(drawById(state, "S01"), { responseStatus: "peer_supported" });

  assert.equal(model.getProgress(state).roundComplete, true);
  assert.equal(state.attempts.filter((attempt) => attempt.studentId === "S01").length, 2);
});

test("recording a response needs no score, rubric, or later assessment step", () => {
  let state = model.createSession({ roster: roster(1) });
  state = drawById(state, "S01");
  state = record(state, {
    responseStatus: "peer_supported",
    answerContext: "unprepared",
    assistance: true,
    note: "提示后完成回答"
  });

  const attempt = state.attempts[0];
  assert.equal(attempt.outcome, "answered");
  assert.equal(attempt.assessmentStatus, undefined);
  assert.equal(attempt.responseStatus, "peer_supported");
  assert.equal(attempt.answerContext, "unprepared");
  assert.equal(attempt.assistance, true);
  assert.equal(attempt.note, "提示后完成回答");
  assert.equal(Object.hasOwn(attempt, "scores"), false);
  assert.equal(Object.hasOwn(attempt, "totalScore"), false);
  assert.equal(model.scorePending, undefined);
  assert.equal(model.saveAssessment, undefined);
  assert.equal(model.saveFactAssessment, undefined);
  assert.equal(model.getProgress(state).roundComplete, true);
  assert.equal(state.events.at(-1).type, "response_recorded");
});

test("voluntary speaking is recorded separately and does not consume random eligibility", () => {
  let state = model.createSession({ roster: roster(2) });
  for (let index = 0; index < 3; index += 1) {
    state = model.selectVolunteer(state, "S01");
    state = record(state, { responseStatus: "answered" });
  }

  assert.equal(state.attempts.length, 3);
  assert.equal(state.attempts.every((attempt) => attempt.selectionMethod === "volunteer"), true);
  assert.deepEqual(state.currentRound.answeredStudentIds, []);
  assert.deepEqual(model.getDrawingPool(state).map((student) => student.id), ["S01", "S02"]);
  assert.equal(model.summarizeAttempts(state.attempts).voluntarySpeakingCount, 3);

  state = record(drawById(state, "S02"));
  assert.deepEqual(state.currentRound.answeredStudentIds, ["S02"]);
  assert.equal(model.getDrawingPool(state).some((student) => student.id === "S01"), true);
});

test("the next round resets eligibility and a new session starts with a clean pool", () => {
  let state = model.createSession({ roster: roster(2) });
  state = record(drawById(state, "S01"));
  state = record(drawById(state, "S02"));
  state = model.startNextRound(state);

  assert.equal(state.currentRound.number, 2);
  assert.deepEqual(model.getDrawingPool(state).map((student) => student.id), ["S01", "S02"]);
  assert.equal(state.attempts.length, 2);

  const fresh = model.createSession({ roster: roster(2) });
  assert.deepEqual(model.getDrawingPool(fresh).map((student) => student.id), ["S01", "S02"]);
  assert.equal(fresh.attempts.length, 0);
  assert.equal(fresh.session.scoringMode, undefined);
  assert.equal(fresh.session.rubric, undefined);
});

test("lesson changes apply only to later response records", () => {
  let state = model.createSession({ lessonId: "lesson-01", roster: roster(2) });
  state = record(drawById(state, "S01"));
  state = model.setSessionContext(state, "boya-quasi-intermediate-i", "lesson-02");
  state = record(drawById(state, "S02"));

  assert.equal(state.session.lessonId, "lesson-02");
  assert.equal(state.attempts[0].lessonId, "lesson-01");
  assert.equal(state.attempts[1].lessonId, "lesson-02");
  assert.equal(state.events.at(-3).type, "lesson_changed");
});

test("raw records preserve response context, source, notes, and count summaries", () => {
  let state = model.createSession({ className: "LT_01", lessonId: "lesson-01", roster: roster(3) });
  state = record(drawById(state, "S01"), { responseStatus: "partial", answerContext: "unprepared" });
  state = model.selectVolunteer(state, "S02");
  state = record(state, { responseStatus: "peer_supported", answerContext: "prepared", note: "主动发言" });
  state = model.returnPending(drawById(state, "S03"), { noResponseReason: "unprepared" });

  const summary = model.summarizeAttempts(state.attempts);
  assert.equal(summary.attempts, 3);
  assert.equal(summary.totalAnswerCount, 2);
  assert.equal(summary.effectiveAnswerCount, 2);
  assert.equal(summary.randomCallCount, 2);
  assert.equal(summary.randomCallEffectiveAnswerCount, 1);
  assert.equal(summary.voluntarySpeakingCount, 1);
  assert.equal(summary.voluntaryEffectiveAnswerCount, 1);
  assert.equal(summary.notAnsweredCount, 1);
  assert.equal(summary.noResponseReasonStats.unprepared, 1);
  assert.equal(summary.answerContextCounts.unprepared, 1);
  assert.equal(state.attempts[0].responseStatus, "partial");
  assert.equal(state.attempts[1].selectionMethod, "volunteer");

  const csv = model.exportSessionCsv(state);
  assert.match(csv, /event_type/);
  assert.match(csv, /response_status/);
  assert.match(csv, /no_response_reason/);
  assert.match(csv, /voluntary_speaking/);
  assert.doesNotMatch(csv, /total_score|task_completion_score|fact_marks|performance_level|rubric/);

  const studentRows = model.getStudentSummaryRows(state);
  assert.equal(studentRows.rows.length, 3);
  assert.equal(studentRows.rows.every((row) => row.length === studentRows.headers.length), true);
  assert.ok(studentRows.headers.includes("not_answered_count"));
  assert.ok(!studentRows.headers.includes("raw_average_score"));
});

test("backup restore preserves raw response records and does not erase legacy history", () => {
  let state = model.createSession({ className: "LT_01", lessonId: "lesson-07", roster: roster(1) });
  state = record(drawById(state, "S01"), { taskPrompt: "介绍你的家人", note: "回答清楚" });
  const restored = model.importBackup(model.exportBackup(state));

  assert.equal(restored.schemaVersion, model.SCHEMA_VERSION);
  assert.equal(restored.session.lessonId, "lesson-07");
  assert.equal(restored.attempts[0].taskPrompt, "介绍你的家人");
  assert.equal(restored.attempts[0].note, "回答清楚");
  assert.equal(restored.attempts[0].outcome, "answered");

  const legacy = JSON.parse(model.exportBackup(state));
  legacy.schemaVersion = 3;
  legacy.attempts[0].assessmentStatus = "scored";
  legacy.attempts[0].scores = { task_completion: 2 };
  legacy.attempts[0].totalScore = 2;
  const migrated = model.importBackup(legacy);
  assert.deepEqual(migrated.attempts[0].scores, { task_completion: 2 });
  assert.equal(migrated.attempts[0].totalScore, 2);
});

test("undo restores the pool and keeps a voided raw event", () => {
  let state = model.createSession({ roster: roster(2) });
  state = drawById(state, "S01");
  state = model.undoLastAction(state);

  assert.equal(model.pendingAttempt(state), null);
  assert.deepEqual(model.getDrawingPool(state).map((student) => student.id), ["S01", "S02"]);
  assert.equal(state.attempts.length, 1);
  assert.equal(state.attempts[0].outcome, "undone");
  assert.equal(state.attempts[0].recordStatus, "voided");
  assert.match(model.exportSessionCsv(state), /undone/);
  assert.equal(state.events.at(-1).type, "undo");
});

test("drawing prefers students with fewer random calls while keeping the pool round-based", () => {
  let state = model.createSession({ roster: roster(3) });
  assert.equal(model.getRandomSelectionPool(state).length, 3);
  state = record(drawById(state, "S01"));

  assert.deepEqual(model.getRandomSelectionPool(state).map((student) => student.id).sort(), ["S02", "S03"]);
});
