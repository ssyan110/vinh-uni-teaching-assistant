(function exposeRandomizerCloud(root) {
  "use strict";

  const PROJECT_URL = "https://hpbwipruqtmpfghialwv.supabase.co";
  const PUBLISHABLE_KEY = "sb_publishable_MShaHD2QWDfcX4g9WAjStQ_0sKMTpGz";
  const TOKEN_KEY = "vinh-uni-teaching/randomizer-auth-v1";
  const QUEUE_KEY = "vinh-uni-teaching/randomizer-sync-queue-v2";
  const NO_RESPONSE_REASON_IDS = new Set([
    "unprepared",
    "unclear_prompt",
    "forgot",
    "anxious_unwell",
    "time_insufficient",
    "chose_skip",
    "other"
  ]);
  const ATTENDANCE_STATUS_IDS = new Set(["unconfirmed", "present", "late", "absent", "excused"]);
  const RESPONSE_RECORD_ID = "classroom-response-v1";

  let session = readJson(TOKEN_KEY);
  let authRedirectError = null;
  let flushPromise = null;
  const rosterCache = new Map();

  function storageFor(key) {
    return key === QUEUE_KEY ? root.localStorage : root.sessionStorage;
  }

  function consumeAuthRedirect() {
    const hash = root.location && root.location.hash ? root.location.hash.slice(1) : "";
    if (!hash) return;
    const params = new URLSearchParams(hash);
    if (params.get("error")) {
      authRedirectError = params.get("error_description") || params.get("error") || "登录链接无效或已过期。";
    } else if (params.get("access_token")) {
      session = {
        access_token: params.get("access_token"),
        refresh_token: params.get("refresh_token") || "",
        token_type: params.get("token_type") || "bearer",
        expires_in: Number(params.get("expires_in") || 3600),
        expires_at: Number(params.get("expires_at") || 0),
        invite_pending: params.get("type") === "invite"
      };
      writeJson(TOKEN_KEY, session);
    } else {
      return;
    }
    if (root.history && root.history.replaceState) {
      root.history.replaceState({}, root.document ? root.document.title : "", root.location.pathname + root.location.search);
    }
  }

  consumeAuthRedirect();

  function readJson(key) {
    try {
      const storage = storageFor(key);
      const raw = storage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function writeJson(key, value) {
    try {
      storageFor(key).setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  function clearJson(key) {
    try {
      storageFor(key).removeItem(key);
    } catch (error) {
      // The classroom tool remains usable if browser storage is blocked.
    }
  }

  function text(value) {
    return value === null || value === undefined ? "" : String(value).trim();
  }

  function authHeaders(extra) {
    return {
      apikey: PUBLISHABLE_KEY,
      ...(session && session.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...(extra || {})
    };
  }

  async function request(path, options) {
    const response = await root.fetch(`${PROJECT_URL}${path}`, {
      ...options,
      headers: authHeaders({ "Content-Type": "application/json", ...(options && options.headers) })
    });
    const responseText = await response.text();
    let data = null;
    try { data = responseText ? JSON.parse(responseText) : null; } catch (error) { data = responseText; }
    if (!response.ok) {
      const message = data && (data.message || data.error_description || data.hint || data.details)
        ? (data.message || data.error_description || data.hint || data.details)
        : `云端连接失败（${response.status}）`;
      const failure = new Error(message);
      failure.status = response.status;
      throw failure;
    }
    return data;
  }

  function requireSession() {
    if (!session || !session.access_token) throw new Error("请先登录教师账号。");
    return session;
  }

  async function signIn(email, password) {
    const response = await root.fetch(`${PROJECT_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: PUBLISHABLE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error_description || data.msg || "登录失败，请检查 email 与密码。");
    session = { ...data, invite_pending: false };
    writeJson(TOKEN_KEY, session);
    rosterCache.clear();
    return data.user;
  }

  function signOut() {
    session = null;
    clearJson(TOKEN_KEY);
    rosterCache.clear();
  }

  function isSignedIn() {
    return Boolean(session && session.access_token);
  }

  function currentUserEmail() {
    return session && session.user ? session.user.email || "教师账号" : "";
  }

  function hasInviteSession() {
    return Boolean(session && session.access_token && session.invite_pending);
  }

  function getAuthRedirectError() {
    return authRedirectError;
  }

  async function completeInvite(password) {
    requireSession();
    if (!hasInviteSession()) throw new Error("目前没有待完成的邀请。请重新打开最新邀请信。");
    if (!password || password.length < 8) throw new Error("密码至少需要 8 个字符。");
    const user = await request("/auth/v1/user", {
      method: "PUT",
      body: JSON.stringify({ password })
    });
    session = { ...session, user, invite_pending: false };
    writeJson(TOKEN_KEY, session);
    return user;
  }

  async function fetchClassRoster(classId) {
    requireSession();
    if (rosterCache.has(classId)) return rosterCache.get(classId);
    const courses = await request(`/rest/v1/courses?select=id,code,name&code=eq.${encodeURIComponent(classId)}&limit=1`);
    const course = Array.isArray(courses) ? courses[0] : null;
    if (!course) throw new Error(`数据库中还没有 ${classId} 班级，请先在学生管理系统导入名单。`);
    const enrollments = await request(`/rest/v1/enrollments?select=course_id,seat_number,student:students(id,student_code,chinese_name)&course_id=eq.${encodeURIComponent(course.id)}&status=eq.active&order=seat_number.asc`);
    const roster = (Array.isArray(enrollments) ? enrollments : []).map((row) => ({
      id: row.student && row.student.id,
      studentCode: row.student && row.student.student_code,
      name: row.student && row.student.chinese_name,
      seatNumber: row.seat_number == null ? "" : String(row.seat_number)
    })).filter((student) => student.id && student.studentCode && student.name);
    if (!roster.length) throw new Error(`${classId} 尚未有可使用的学生名单。`);
    const result = { courseId: course.id, classId, roster };
    rosterCache.set(classId, result);
    return result;
  }

  function isoDate(value) {
    const candidate = text(value);
    return /^\d{4}-\d{2}-\d{2}$/.test(candidate)
      ? candidate
      : new Date().toISOString().slice(0, 10);
  }

  function lessonId(value) {
    const match = /^lesson-(\d{1,2})$/i.exec(text(value));
    const number = match ? Math.min(99, Math.max(1, Number(match[1]))) : 1;
    return `lesson-${String(number).padStart(2, "0")}`;
  }

  async function ensureClassSession(context, sessionDate, metadata) {
    const existing = await request(`/rest/v1/class_sessions?select=id&course_id=eq.${encodeURIComponent(context.courseId)}&status=eq.in_progress&limit=1`);
    if (Array.isArray(existing) && existing[0]) return existing[0].id;
    const details = metadata || {};
    const created = await request("/rest/v1/class_sessions", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        course_id: context.courseId,
        session_date: isoDate(sessionDate),
        status: "in_progress",
        topic: details.topic || null,
        observation_target: details.observationTarget || null
      })
    }).catch(async (error) => {
      if (error.status !== 409) throw error;
      const retry = await request(`/rest/v1/class_sessions?select=id&course_id=eq.${encodeURIComponent(context.courseId)}&status=eq.in_progress&limit=1`);
      return retry;
    });
    const row = Array.isArray(created) ? created[0] : created;
    if (!row || !row.id) throw new Error("无法创建云端课堂。");
    return row.id;
  }

  async function startSession(classId, options) {
    const context = await fetchClassRoster(classId);
    return ensureClassSession(context, options && options.sessionDate, options);
  }

  function normalizeSession(input) {
    const source = input && input.session ? input.session : input || {};
    const currentRound = input && input.currentRound ? input.currentRound : {};
    const classId = text((input && input.classId) || source.className);
    const clientSessionId = text(source.id || (input && input.clientSessionId));
    const normalizedLessonId = lessonId(source.lessonId);
    const lessonNumber = Number(normalizedLessonId.slice(-2));
    if (!classId || !clientSessionId) throw new Error("云端记录缺少班级或课堂标识码。");
    return {
      classId,
      clientSessionId,
      sessionDate: isoDate(source.date),
      textbookId: text(source.textbookId) || "boya-quasi-intermediate-i",
      lessonId: normalizedLessonId,
      lessonLabel: `第 ${lessonNumber} 课`,
      // The randomizer stores classroom response records only. Keep the
      // legacy database column populated with its non-grading value.
      scoringMode: "practice",
      taskMode: text(source.taskMode) || "interpersonal_listening_speaking",
      taskTarget: text(source.taskTarget) || "short_response",
      currentRound: Number(currentRound.number) > 0 ? Number(currentRound.number) : 1,
      answeredStudentIds: Array.isArray(currentRound.answeredStudentIds) ? currentRound.answeredStudentIds.map(String) : [],
      excludedStudentIds: Array.isArray(input && input.excludedStudentIds) ? input.excludedStudentIds.map(String) : [],
      rosterCount: Array.isArray(input && input.roster) ? input.roster.length : 0,
      status: "in_progress",
      activityLabel: `教师提问：${text(source.taskTarget) || "口语回答"}`
    };
  }

  async function ensureRandomizerSession(normalized, context) {
    const rosterContext = context || await fetchClassRoster(normalized.classId);
    const classSessionId = await ensureClassSession(rosterContext, normalized.sessionDate, {
      topic: `华语课堂抽问｜${normalized.textbookId}｜${normalized.lessonId}`,
      observationTarget: normalized.activityLabel
    });
    const body = {
      class_session_id: classSessionId,
      course_id: rosterContext.courseId,
      client_session_id: normalized.clientSessionId,
      session_date: normalized.sessionDate,
      textbook_id: normalized.textbookId,
      lesson_id: normalized.lessonId,
      scoring_mode: normalized.scoringMode,
      task_mode: normalized.taskMode,
      task_target: normalized.taskTarget,
      current_round: normalized.currentRound,
      answered_student_ids: normalized.answeredStudentIds,
      excluded_student_ids: normalized.excludedStudentIds,
      roster_count: normalized.rosterCount,
      status: normalized.status
    };
    const saved = await request("/rest/v1/randomizer_sessions?on_conflict=owner_id,client_session_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(body)
    });
    const row = Array.isArray(saved) ? saved[0] : saved;
    if (!row || !row.id) throw new Error("无法保存云端课堂记录。");
    return { context: rosterContext, classSessionId, randomizerSessionId: row.id };
  }

  function findRosterStudent(context, attempt) {
    const snapshot = attempt.studentSnapshot || {};
    const code = text(snapshot.studentCode || snapshot.student_code || attempt.studentCode);
    const id = text(snapshot.id || attempt.studentId);
    return context.roster.find((student) => (code && student.studentCode === code) || (id && student.id === id)) || null;
  }

  function normalizeAttempt(attempt, normalizedSession) {
    const source = attempt || {};
    const snapshot = source.studentSnapshot || {};
    const studentCode = text(snapshot.studentCode || snapshot.student_code || source.studentCode || snapshot.id || source.studentId);
    const studentName = text(snapshot.name || snapshot.studentName || source.studentName || studentCode);
    const outcome = ["pending", "answered", "not_answered", "undone"].includes(source.outcome) ? source.outcome : "pending";
    // `randomizer_attempts` still has legacy assessment columns and requires
    // `pending` for an answered row. This is only a database compatibility
    // value; the randomizer never creates, edits, or synchronizes scores.
    const assessmentStatus = outcome === "answered" ? "pending" : "not_applicable";
    const selectionMethod = source.selectionMethod === "volunteer" ? "volunteer" : "random";
    const responseStatus = outcome === "not_answered"
      ? "no_response"
      : ["answered", "partial", "peer_supported"].includes(source.responseStatus)
        ? source.responseStatus
        : outcome === "answered" ? "answered" : "unobserved";
    const noResponseReason = responseStatus === "no_response" && NO_RESPONSE_REASON_IDS.has(source.noResponseReason)
      ? source.noResponseReason
      : responseStatus === "no_response" ? "other" : null;
    const attendanceStatus = ATTENDANCE_STATUS_IDS.has(text(source.attendanceStatus))
      ? text(source.attendanceStatus)
      : null;
    return {
      clientAttemptId: text(source.id),
      studentCode: studentCode || "unknown",
      studentName: studentName || "未填写姓名",
      seatNumber: text(snapshot.seatNumber || snapshot.seat_number) || null,
      roundNumber: Number(source.roundNumber) > 0 ? Number(source.roundNumber) : normalizedSession.currentRound,
      eventType: source.eventType || (selectionMethod === "volunteer" ? "voluntary_speaking" : "random_call"),
      selectionMethod,
      opportunityStatus: source.opportunityStatus || (selectionMethod === "volunteer" ? "volunteered" : "called"),
      outcome,
      responseStatus,
      noResponseReason,
      answerContext: ["prepared", "unprepared", "unknown"].includes(source.answerContext) ? source.answerContext : "unknown",
      attendanceStatus,
      recordStatus: ["valid", "corrected", "voided"].includes(source.recordStatus)
        ? source.recordStatus
        : outcome === "undone" ? "voided" : "valid",
      correctionNote: text(source.correctionNote) || null,
      correctedAt: source.correctedAt || null,
      assessmentStatus,
      taskPrompt: text(source.taskPrompt) || null,
      assistance: source.assistance ?? null,
      questionId: text(source.questionId) || null,
      textbookId: text(source.textbookId) || normalizedSession.textbookId,
      lessonId: lessonId(source.lessonId || normalizedSession.lessonId),
      taskMode: text(source.taskMode) || normalizedSession.taskMode,
      taskTarget: text(source.taskTarget) || normalizedSession.taskTarget,
      rubricId: text(source.rubricId) || RESPONSE_RECORD_ID,
      rubricVersion: text(source.rubricVersion) || "1.0",
      note: text(source.note) || null,
      // Old local/queued records may not have event_order. The database now
      // requires a positive value, so use the round as a stable compatibility
      // fallback rather than sending null during migration.
      eventOrder: Number(source.eventOrder) > 0
        ? Number(source.eventOrder)
        : Number(source.roundNumber) > 0 ? Number(source.roundNumber) : 1,
      createdAt: source.createdAt || source.drawnAt || new Date().toISOString(),
      drawnAt: source.drawnAt || new Date().toISOString(),
      completedAt: outcome === "pending" ? null : (source.completedAt || source.updatedAt || new Date().toISOString())
    };
  }

  function randomizerAttemptBody(normalizedAttempt, context, randomizerSessionId) {
    const student = context.roster.find((candidate) => candidate.studentCode === normalizedAttempt.studentCode);
    return {
      randomizer_session_id: randomizerSessionId,
      course_id: context.courseId,
      student_id: student ? student.id : null,
      client_attempt_id: normalizedAttempt.clientAttemptId,
      student_code: normalizedAttempt.studentCode,
      student_name: normalizedAttempt.studentName,
      seat_number: normalizedAttempt.seatNumber,
      round_number: normalizedAttempt.roundNumber,
      event_order: normalizedAttempt.eventOrder,
      event_type: normalizedAttempt.eventType,
      selection_method: normalizedAttempt.selectionMethod,
      opportunity_status: normalizedAttempt.opportunityStatus,
      response_status: normalizedAttempt.responseStatus,
      outcome: normalizedAttempt.outcome,
      no_response_reason: normalizedAttempt.noResponseReason,
      answer_context: normalizedAttempt.answerContext,
      attendance_status: normalizedAttempt.attendanceStatus,
      record_status: normalizedAttempt.recordStatus,
      assessment_status: normalizedAttempt.assessmentStatus,
      task_prompt: normalizedAttempt.taskPrompt,
      assistance: normalizedAttempt.assistance,
      question_id: normalizedAttempt.questionId,
      textbook_id: normalizedAttempt.textbookId,
      lesson_id: normalizedAttempt.lessonId,
      task_mode: normalizedAttempt.taskMode,
      task_target: normalizedAttempt.taskTarget,
      rubric_id: normalizedAttempt.rubricId,
      rubric_version: normalizedAttempt.rubricVersion,
      note: normalizedAttempt.note,
      correction_note: normalizedAttempt.correctionNote,
      corrected_at: normalizedAttempt.correctedAt,
      created_at: normalizedAttempt.createdAt,
      drawn_at: normalizedAttempt.drawnAt,
      completed_at: normalizedAttempt.completedAt
    };
  }

  async function syncSessionItem(item) {
    const normalized = item.session;
    const context = await fetchClassRoster(normalized.classId);
    await ensureRandomizerSession(normalized, context);
  }

  async function syncAttemptItem(item) {
    const normalizedSession = item.session;
    const context = await fetchClassRoster(normalizedSession.classId);
    const cloudSession = await ensureRandomizerSession(normalizedSession, context);
    const normalizedAttempt = normalizeAttempt(item.attempt, normalizedSession);
    if (!normalizedAttempt.clientAttemptId) throw new Error("云端记录缺少抽问标识码。");
    await request("/rest/v1/randomizer_attempts?on_conflict=owner_id,client_attempt_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(randomizerAttemptBody(normalizedAttempt, context, cloudSession.randomizerSessionId))
    });
    // Deliberately do not write to learning_events. That table belongs to the
    // separate learning tracker; this tool keeps its own raw attempt record.
  }

  function readQueue(key) {
    const queue = readJson(key);
    return Array.isArray(queue) ? queue : [];
  }

  function writeQueue(queue, key) {
    writeJson(key, queue);
  }

  function pendingCount() {
    return readQueue(QUEUE_KEY).length;
  }

  function enqueue(event) {
    const queue = readQueue(QUEUE_KEY).filter((item) => item.client_event_id !== event.client_event_id);
    queue.push(event);
    writeQueue(queue, QUEUE_KEY);
  }

  async function flushQueueInternal() {
    if (!isSignedIn()) return { sent: 0, pending: pendingCount(), attempts: 0, sessions: 0 };
    const queue = readQueue(QUEUE_KEY);
    if (!queue.length) return { sent: 0, pending: 0, attempts: 0, sessions: 0 };
    const remaining = [];
    let sent = 0;
    let attempts = 0;
    let sessions = 0;
    for (const item of queue) {
      try {
        if (item.kind === "session") {
          await syncSessionItem(item);
          sessions += 1;
        } else if (item.kind === "attempt") {
          await syncAttemptItem(item);
          attempts += 1;
        } else {
          throw new Error("无法识别的同步数据。");
        }
        sent += 1;
      } catch (error) {
        remaining.push(item);
      }
    }
    writeQueue(remaining, QUEUE_KEY);
    return { sent, pending: remaining.length, attempts, sessions };
  }

  function flushQueue() {
    if (!isSignedIn()) return Promise.resolve({ sent: 0, pending: pendingCount(), attempts: 0, sessions: 0 });
    if (!flushPromise) {
      flushPromise = flushQueueInternal().finally(() => {
        flushPromise = null;
      });
    }
    return flushPromise;
  }

  async function recordState(input) {
    requireSession();
    const normalizedSession = normalizeSession(input);
    enqueue({
      kind: "session",
      client_event_id: `session:${normalizedSession.clientSessionId}`,
      session: normalizedSession
    });
    const attempts = Array.isArray(input && input.attempts) ? input.attempts : [];
    attempts.forEach((attempt) => {
      if (!attempt || !attempt.id) return;
      enqueue({
        kind: "attempt",
        client_event_id: `attempt:${attempt.id}`,
        session: normalizedSession,
        attempt
      });
    });
    return flushQueue();
  }

  root.RandomizerCloud = Object.freeze({
    completeInvite,
    currentUserEmail,
    fetchClassRoster,
    flushQueue,
    getAuthRedirectError,
    hasInviteSession,
    isSignedIn,
    pendingCount,
    recordState,
    signIn,
    signOut,
    startSession
  });
}(window));
