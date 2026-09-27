const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");

const cloudSource = fs.readFileSync(require.resolve("../data/cloud.js"), "utf8");

function createHarness({ requestTimeout = 15000, failAttempts = false, expiredSession = false, failRefresh = false, beforeRequest, initialAttendance = null, recordAttempts = [], recordEvents = [], activeClassSessionDate = "2026-09-08" } = {}) {
  const initialSession = expiredSession
    ? {
        access_token: "expired",
        refresh_token: "refresh-token",
        expires_at: expiredSession === "401" ? 0 : 1,
        user: { id: "teacher" }
      }
    : { access_token: "test-only", user: { id: "teacher" } };
  const values = new Map([
    ["vinh-uni-teaching/randomizer-auth-v1", JSON.stringify(initialSession)]
  ]);
  const storage = {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  };
  const savedAttempts = new Map();
  const savedRandomizerSessions = [];
  let attendance = initialAttendance ? {id:'attendance-id',session_id:'session',student_id:'student',note:'preserve note',...initialAttendance} : null;
  const paths = [];
  const authorizationHeaders = [];
  let shouldFailAttempts = failAttempts;
  let accessToken = initialSession.access_token;
  let refreshCount = 0;
  const window = {
    AbortController, setTimeout: (fn) => setTimeout(fn, requestTimeout), clearTimeout,
    localStorage: storage,
    sessionStorage: storage,
    location: { hash: "", search: "", pathname: "/" },
    fetch: async (url, options = {}) => {
      if (beforeRequest) await beforeRequest(url, options);
      paths.push(url);
      authorizationHeaders.push(options.headers && options.headers.Authorization);
      if (url.includes("/auth/v1/token?grant_type=refresh_token")) {
        refreshCount += 1;
        if (failRefresh) return { ok: false, status: 400, text: async () => '{"message":"refresh token expired"}' };
        accessToken = "refreshed";
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({
            access_token: "refreshed",
            refresh_token: "refresh-token-2",
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            user: { id: "teacher" }
          })
        };
      }
      if (expiredSession && accessToken === "expired") {
        return { ok: false, status: 401, text: async () => '{"message":"expired"}' };
      }
      const body = options.body ? JSON.parse(options.body) : null;
      let data = [];
      if (url.includes("/courses?")) data = [{ id: "course" }];
      if (url.includes("/enrollments?")) {
        data = [{ seat_number: 1, student: { id: "student", student_code: "TEST", chinese_name: "测试学生" } }];
      }
      if (url.includes("/class_sessions?")) {
        const requestedDate = url.match(/[?&]session_date=eq\.([^&]+)/)?.[1];
        data = !requestedDate || decodeURIComponent(requestedDate) === activeClassSessionDate ? [{ id: "session" }] : [];
      }
      if (url.endsWith("/class_sessions") && options.method === "POST") {
        return { ok: false, status: 409, text: async () => '{"message":"active class session exists"}' };
      }
      if (url.includes("/randomizer_sessions?")) {
        if (options.method === "POST") savedRandomizerSessions.push(body);
        data = [{ id: "random-session" }];
      }
      if (url.includes('/attendance_records?')) {
        if (options.method === 'POST') attendance = {id:'attendance-id', ...attendance, ...body};
        if (options.method === 'PATCH') attendance = {...attendance, ...body};
        data = attendance ? [{...attendance}] : [];
        if (options.method === 'DELETE') attendance = null;
      }
      if (url.includes("/randomizer_attempts?")) {
        if (shouldFailAttempts) {
          return { ok: false, status: 503, text: async () => '{"message":"offline"}' };
        }
        if (options.method === "POST") savedAttempts.set(body.client_attempt_id, body);
      }
      if (!options.method && url.includes("/randomizer_attempts?")) data = recordAttempts;
      if (!options.method && url.includes("/learning_events?")) data = recordEvents;
      return { ok: true, status: 200, text: async () => JSON.stringify(data) };
    }
  };
  vm.runInNewContext(cloudSource, { window, URLSearchParams, URL, console });
  return {
    cloud: window.RandomizerCloud,
    values,
    paths,
    savedAttempts,
    savedRandomizerSessions,
    attendance: () => attendance,
    authorizationHeaders,
    refreshCount: () => refreshCount,
    setAttemptFailure(value) {
      shouldFailAttempts = value;
    }
  };
}

function rawAttempt(overrides = {}) {
  return {
    id: "answer-1",
    studentId: "TEST",
    studentSnapshot: { studentCode: "TEST", name: "测试学生", seatNumber: "1" },
    roundNumber: 1,
    eventOrder: 1,
    outcome: "answered",
    responseStatus: "answered",
    assessmentStatus: "scored",
    scores: { task_completion: 2, comprehensibility: 3 },
    score: 5,
    totalScore: 5,
    factMarks: { F: 4, A: 4, C: 4, T: 4 },
    performanceLevel: "complete",
    completedAt: "2026-09-08T01:00:00Z",
    ...overrides
  };
}

function send(cloud, attempt) {
  return cloud.recordState({
    session: { id: "local-session", className: "LT_TEST", date: "2026-09-08" },
    attempts: [attempt]
  });
}

for (const originalStatus of ['excused', 'late', 'present', null]) {
  test(`undo first absence restores original ${originalStatus ?? 'missing record'} including offline retry`, async () => {
    const model = require('./model.js');
    let offline = false;
    const harness = createHarness({ initialAttendance: originalStatus ? {status:originalStatus} : null,
      beforeRequest: async (url, options) => {
        if (offline && url.includes('/attendance_records?') && ['PATCH','DELETE'].includes(options.method)) throw new Error('offline');
      }
    });
    let state = model.createSession({className:'QA',sessionId:'qa-undo',roster:[{studentCode:'TEST',name:'Synthetic'}]});
    state = model.setAbsent(state,'TEST',true);
    await harness.cloud.recordState(state);
    assert.equal(harness.attendance().status,'absent');
    offline = true;
    state = model.undoLastAction(state);
    assert.equal((await harness.cloud.recordState(state)).pending,1);
    assert.equal(harness.attendance().status,'absent');
    offline = false;
    assert.equal((await harness.cloud.flushQueue()).pending,0);
    assert.equal(harness.attendance()?.status ?? null,originalStatus);
    if(originalStatus) assert.equal(harness.attendance().note,'preserve note');
    await harness.cloud.recordState(state);
    assert.equal(harness.attendance()?.status ?? null,originalStatus);
  });
}

test('undo before first attendance upload does not invent or delete a cloud record', async () => {
  const model = require('./model.js');
  let offline = true;
  const harness = createHarness({initialAttendance:{status:'excused'},beforeRequest: async (url) => {
    if(offline && url.includes('/attendance_records?')) throw new Error('offline');
  }});
  let state = model.createSession({className:'QA',sessionId:'qa-preupload',roster:[{studentCode:'TEST',name:'Synthetic'}]});
  state=model.setAbsent(state,'TEST',true);
  await harness.cloud.recordState(state);
  state=model.undoLastAction(state);
  await harness.cloud.recordState(state);
  offline=false;
  await harness.cloud.flushQueue();
  assert.equal(harness.attendance().status,'excused');
});

test('undo enqueued during an in-flight first absence restores no-record state after reload', async () => {
  const model = require('./model.js');
  let release, started;
  const ready = new Promise(resolve => {started=resolve});
  const held = new Promise(resolve => {release=resolve});
  let first=true;
  const harness = createHarness({beforeRequest: async (url,options) => {
    if(first && url.includes('/attendance_records?') && options.method==='POST') {
      first=false; started(); await held;
    }
  }});
  let state=model.createSession({className:'QA',sessionId:'qa-flight',roster:[{studentCode:'TEST',name:'Synthetic'}]});
  state=model.setAbsent(state,'TEST',true);
  const saving=harness.cloud.recordState(state);
  await ready;
  state=model.importBackup(JSON.stringify(model.undoLastAction(state)));
  const undo=harness.cloud.recordState(state);
  release(); await saving; await undo;
  await harness.cloud.flushQueue();
  assert.equal(harness.attendance(),null);
  assert.equal(harness.cloud.pendingCount(),0);
});

test("direct attendance upserts the linked class session once and retries failures", async () => {
  const writes = [];
  let offline = true;
  const harness = createHarness({ beforeRequest: async (url, options) => {
    if (!url.includes('/attendance_records?') || options.method !== 'POST') return;
    if (offline) throw new Error('offline');
    writes.push(JSON.parse(options.body));
  } });
  const input = { session: { id: 'qa', className: 'QA', date: '2026-09-18' }, attendanceChanges: {
    TEST: { studentCode: 'TEST', status: 'absent', changedAt: 'v1' }
  } };
  assert.equal((await harness.cloud.recordState(input)).pending, 1);
  offline = false;
  assert.equal((await harness.cloud.flushQueue()).pending, 0);
  assert.deepEqual(writes, [{session_id:'session',student_id:'student',status:'absent'}]);
  await harness.cloud.recordState(input);
  assert.equal(writes.length, 1, 'later answer saves must not overwrite Tracker attendance corrections');
  input.attendanceChanges.TEST = {studentCode:'TEST', status:'present', changedAt:'v2'};
  await harness.cloud.recordState(input);
  assert.equal(writes.at(-1).status, 'present');
  assert.equal(harness.savedAttempts.size, 0);
});

test("raw response records sync idempotently without scores or learning-event writes", async () => {
  const harness = createHarness();
  const result = await send(harness.cloud, rawAttempt());
  assert.equal(result.pending, 0);
  assert.equal(harness.savedAttempts.size, 1);

  const saved = harness.savedAttempts.get("answer-1");
  assert.equal(saved.assessment_status, "pending");
  assert.equal(saved.response_status, "answered");
  for (const field of [
    "task_completion",
    "comprehensibility",
    "language_control_vocabulary",
    "content_interaction",
    "score",
    "total_score",
    "counted_for_summary",
    "counted_for_grade",
    "fact_marks",
    "performance_level"
  ]) {
    assert.equal(Object.hasOwn(saved, field), false, `${field} must not be synchronized`);
  }
  assert.equal(harness.paths.some((path) => path.includes("/learning_events")), false);

  await send(harness.cloud, rawAttempt({ note: "更新后的课堂备注" }));
  assert.equal(harness.savedAttempts.size, 1);
  assert.equal(harness.savedAttempts.get("answer-1").note, "更新后的课堂备注");
});

test("an expired login refreshes before loading a class roster", async () => {
  const harness = createHarness({ expiredSession: true });
  const result = await harness.cloud.fetchClassRoster("LT_02");

  assert.equal(result.roster.length, 1);
  assert.equal(harness.refreshCount(), 1);
  assert.ok(harness.authorizationHeaders.includes("Bearer refreshed"));
});

test("a legacy session without expiry metadata refreshes after a 401", async () => {
  const harness = createHarness({ expiredSession: "401" });
  const result = await harness.cloud.fetchClassRoster("LT_03");

  assert.equal(result.roster.length, 1);
  assert.equal(harness.refreshCount(), 1);
  assert.ok(harness.authorizationHeaders.includes("Bearer refreshed"));
});

test("pending and unanswered calls remain raw records, and the scoring API is absent", async () => {
  const harness = createHarness();
  assert.equal(harness.cloud.recordAssessment, undefined);

  await send(harness.cloud, rawAttempt({
    id: "pending-1",
    outcome: "pending",
    responseStatus: "unobserved",
    completedAt: null
  }));
  await send(harness.cloud, rawAttempt({
    id: "unanswered-1",
    outcome: "not_answered",
    responseStatus: "no_response",
    noResponseReason: "unprepared"
  }));

  assert.equal(harness.savedAttempts.get("pending-1").assessment_status, "not_applicable");
  assert.equal(harness.savedAttempts.get("pending-1").completed_at, null);
  assert.equal(harness.savedAttempts.get("unanswered-1").assessment_status, "not_applicable");
  assert.equal(harness.savedAttempts.get("unanswered-1").response_status, "no_response");
  assert.equal(harness.cloud.pendingCount(), 0);
});

test("absence no-response reason survives cloud normalization and offline retry", async () => {
  const harness = createHarness({ failAttempts: true });
  const result = await send(harness.cloud, rawAttempt({
    id: "absent-1",
    outcome: "not_answered",
    responseStatus: "no_response",
    noResponseReason: "absent"
  }));
  assert.equal(result.pending, 1);
  assert.equal(harness.cloud.pendingCount(), 1);

  harness.setAttemptFailure(false);
  await harness.cloud.flushQueue();
  assert.equal(harness.cloud.pendingCount(), 0);
  assert.equal(harness.savedAttempts.get("absent-1").no_response_reason, "absent");
});

test("failed raw-record writes stay queued and retry without duplication", async () => {
  const harness = createHarness({ failAttempts: true });
  const result = await send(harness.cloud, rawAttempt({ id: "offline-1" }));
  assert.equal(result.pending, 1);
  assert.equal(result.failure.kind, "server");
  assert.equal(result.failure.status, 503);
  assert.equal(harness.cloud.pendingCount(), 1);

  harness.setAttemptFailure(false);
  await harness.cloud.flushQueue();
  assert.equal(harness.cloud.pendingCount(), 0);
  assert.equal(harness.savedAttempts.size, 1);

  await send(harness.cloud, rawAttempt({ id: "offline-1", note: "重試後保存" }));
  assert.equal(harness.savedAttempts.size, 1);
  assert.equal(harness.savedAttempts.get("offline-1").note, "重試後保存");
});

test("expired refresh keeps the sync queue and reports that the teacher must sign in again", async () => {
  const harness = createHarness({ expiredSession: true, failRefresh: true });
  const result = await send(harness.cloud, rawAttempt({ id: "expired-login-1" }));

  assert.equal(result.pending, 2);
  assert.equal(result.failure.status, 400);
  assert.equal(harness.cloud.isSignedIn(), false);
  assert.equal(harness.cloud.pendingCount(), 2);
});

test("finish is queued after all answers, waits for failed writes, and retries without duplicate answers", async () => {
  const harness = createHarness({ failAttempts: true });
  const input = { session: { id: "local-session", className: "LT_TEST", date: "2026-09-08", status: "completed", completedAt: "2026-09-08T02:00:00Z" }, attempts: [rawAttempt()] };
  const first = await harness.cloud.recordState(input);
  assert.equal(first.pending, 2);
  assert.ok(!harness.paths.some(p => p.includes("rpc/finish_randomizer_class")));
  harness.setAttemptFailure(false);
  const second = await harness.cloud.flushQueue();
  assert.equal(second.pending, 0);
  assert.ok(harness.paths.at(-1).includes("rpc/finish_randomizer_class"));
  assert.equal(harness.savedAttempts.size, 1);
  assert.ok(harness.paths.some(p => p.includes("class_sessions?") && p.includes("status=eq.in_progress")));
});

test("reuses the active tracker class session when the randomizer date differs", async () => {
  const harness = createHarness({ activeClassSessionDate: "2026-09-23" });
  const result = await send(harness.cloud, rawAttempt());

  assert.equal(result.pending, 0);
  assert.equal(harness.savedRandomizerSessions[0].class_session_id, "session");
  assert.equal(harness.savedAttempts.has("answer-1"), true);
  assert.ok(!harness.paths.some(path => path.endsWith("/class_sessions")));
});

test("closing state queued during an earlier network write survives the first flush", async () => {
  let release, entered;
  const blocked = new Promise(resolve => { release = resolve; });
  const ready = new Promise(resolve => { entered = resolve; });
  let once = true;
  const harness = createHarness({ beforeRequest: async url => {
    if (once && url.includes("randomizer_attempts?")) { once = false; entered(); await blocked; }
  } });
  const initial = send(harness.cloud, rawAttempt());
  await ready;
  const ending = harness.cloud.recordState({ session: { id: "local-session", className: "LT_TEST", date: "2026-09-08", status: "completed" }, attempts: [rawAttempt()] });
  release();
  await initial;
  const queued = await ending;
  assert.ok(queued.pending > 0);
  const done = await harness.cloud.flushQueue();
  assert.equal(done.pending, 0);
  assert.ok(harness.paths.at(-1).includes("rpc/finish_randomizer_class"));
  assert.equal(harness.savedAttempts.size, 1);
});


test("student history includes manual records, preserves class date and excludes mirrors and corrections", async () => {
  const event = { source: "manual_adjustment", record_status: "valid", response_status: "answered", counted_for_summary: true, occurred_at: "2026-09-22T05:04:19Z", class_sessions: { session_date: "2026-09-21" } };
  const h = createHarness({
    recordAttempts: [{ client_attempt_id: "withdrawn", record_status: "corrected", outcome: "answered" }, { client_attempt_id: "answer", outcome: "answered", selection_method: "volunteer", randomizer_sessions: { class_sessions: { session_date: "2026-09-20" } } }],
    recordEvents: [{ ...event, id: "one" }, { ...event, id: "two" }, { ...event, id: "mirror", client_event_id: "withdrawn" }, { ...event, id: "void", record_status: "voided" }, { ...event, id: "excluded", counted_for_summary: false }]
  });
  const rows = await h.cloud.fetchStudentRecords("NNTQ1", "TEST");
  assert.equal(rows.length, 3);
  assert.equal(rows.filter(row => row.attempt.selectionMethod === "manual").length, 2);
  assert.equal(rows.find(row => row.attempt.id === "one").entry.session.date, "2026-09-21");
  assert.ok(h.paths.some(path => path.includes("student_id=eq.student")));
  await assert.rejects(h.cloud.fetchStudentRecords("NNTQ1", "missing"), /找不到/);
  const failing = createHarness({ failAttempts: true });
  await assert.rejects(failing.cloud.fetchStudentRecords("NNTQ1", "TEST"), /offline/);
});


test("legacy undone responses normalize to the database invariant", async () => {
  const { cloud, savedAttempts } = createHarness();
  const result = await send(cloud, rawAttempt({ outcome: "undone", responseStatus: "answered" }));
  assert.equal(result.pending, 0);
  assert.equal(savedAttempts.get("answer-1").response_status, "unobserved");
  assert.equal(savedAttempts.get("answer-1").assessment_status, "not_applicable");
});

test("unsupported legacy records remain backed up without blocking other classrooms", async () => {
  const { cloud, values, savedAttempts } = createHarness();
  const legacy = { kind: "legacy_assessment", client_event_id: "legacy-1", scores: { task_completion: 2 } };
  values.set("vinh-uni-teaching/randomizer-sync-queue-v2", JSON.stringify([legacy]));
  const result = await send(cloud, rawAttempt());
  assert.equal(result.pending, 1);
  assert.equal(result.failure.eventKind, "legacy_assessment");
  assert.equal(savedAttempts.size, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(cloud.exportSyncBackup().queue)), [legacy]);
});

test("roster cache can be explicitly refreshed after a transfer", async () => {
  const { cloud, paths } = createHarness();
  await cloud.fetchClassRoster("LT_TEST");
  await cloud.fetchClassRoster("LT_TEST");
  assert.equal(paths.filter(path => path.includes("/enrollments?")).length, 1);
  await cloud.fetchClassRoster("LT_TEST", { force: true });
  assert.equal(paths.filter(path => path.includes("/enrollments?")).length, 2);
});

test("a hung request times out, preserves the queue and releases the retry lock", async () => {
  let hang = true;
  const { cloud } = createHarness({ requestTimeout: 10, beforeRequest: () => hang ? new Promise(() => {}) : undefined });
  const first = await send(cloud, rawAttempt());
  assert.equal(first.failure.kind, "network");
  assert.equal(first.pending, 2);
  hang = false;
  const second = await cloud.flushQueue();
  assert.equal(second.pending, 0);
  assert.equal(second.sent, 2);
});
