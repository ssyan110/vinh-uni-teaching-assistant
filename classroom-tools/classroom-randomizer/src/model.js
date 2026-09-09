(function exposeRandomizerModel(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.RandomizerModel = factory();
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function createRandomizerModel() {
  "use strict";

  const SCHEMA_VERSION = 4;
  const LEGACY_SCHEMA_VERSION = 1;
  const DEFAULT_TASK_MODE = "interpersonal_listening_speaking";
  const DEFAULT_TASK_TARGET = "short_response";
  const DEFAULT_TEXTBOOK_ID = "boya-quasi-intermediate-i";
  const DEFAULT_LESSON_ID = "lesson-01";

  const RESPONSE_STATUS_IDS = Object.freeze([
    "answered",
    "partial",
    "no_response",
    "declined",
    "peer_supported",
    "unobserved"
  ]);

  const NO_RESPONSE_REASONS = Object.freeze([
    { id: "unprepared", label: "没有准备" },
    { id: "unclear_prompt", label: "听不懂题目" },
    { id: "forgot", label: "一时想不起" },
    { id: "anxious_unwell", label: "紧张／不舒服" },
    { id: "time_insufficient", label: "时间不足" },
    { id: "chose_skip", label: "选择跳过" },
    { id: "other", label: "其他" }
  ]);

  const ANSWER_CONTEXTS = Object.freeze([
    { id: "unknown", label: "未记录" },
    { id: "prepared", label: "已准备" },
    { id: "unprepared", label: "未准备" }
  ]);

  const RECORD_STATUS_IDS = Object.freeze(["valid", "corrected", "voided"]);

  const CLASS_OPTIONS = Object.freeze([
    { id: "LT_01", label: "LT_01（27 人）", studentCount: 27 },
    { id: "LT_02", label: "LT_02（30 人）", studentCount: 30 },
    { id: "LT_03", label: "LT_03（14 人）", studentCount: 14 }
  ]);

  const TEXTBOOK_OPTIONS = Object.freeze([
    {
      id: "boya-quasi-intermediate-i",
      label: "《博雅汉语听说：准中级加速篇 I》",
      lessonCount: 12
    },
    {
      id: "boya-intermediate-i",
      label: "《博雅汉语听说：中级冲刺篇 I》",
      lessonCount: 8
    }
  ]);

  function normalizeAssistance(value) {
    if (value === undefined || value === null) return null;
    if (typeof value !== "boolean") throw new Error("协助记录格式不正确");
    return value;
  }

  const TASK_MODES = Object.freeze({
    interpersonal_listening_speaking: "人际听说",
    interpretive_listening: "理解听力"
  });

  const TASK_TARGETS = Object.freeze({
    short_response: "完整回答一题",
    connected_response: "连续说几句",
    interaction: "回答并追问"
  });

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function localDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function timestamp() {
    return new Date().toISOString();
  }

  function id(prefix) {
    const randomPart = Math.random().toString(36).slice(2, 10);
    return `${prefix}-${Date.now().toString(36)}-${randomPart}`;
  }

  function text(value) {
    return value === null || value === undefined ? "" : String(value).trim();
  }

  function getTextbook(textbookId) {
    const requested = text(textbookId);
    return TEXTBOOK_OPTIONS.find((item) => item.id === requested)
      || TEXTBOOK_OPTIONS.find((item) => item.id === DEFAULT_TEXTBOOK_ID)
      || TEXTBOOK_OPTIONS[0];
  }

  function getLessonNumber(lessonId) {
    const value = text(lessonId).toLowerCase();
    const match = /^lesson-(\d{1,2})$/.exec(value);
    if (match) return Number(match[1]);
    const number = Number(value);
    return Number.isInteger(number) ? number : null;
  }

  function normalizeLessonId(lessonId, textbookId) {
    const textbook = getTextbook(textbookId);
    const requested = getLessonNumber(lessonId);
    const number = Number.isInteger(requested) ? requested : 1;
    const bounded = Math.min(textbook.lessonCount, Math.max(1, number));
    return `lesson-${String(bounded).padStart(2, "0")}`;
  }

  function formatLessonLabel(textbookId, lessonId) {
    const textbook = getTextbook(textbookId);
    const normalizedLessonId = normalizeLessonId(lessonId, textbook.id);
    return `${textbook.label}｜第 ${getLessonNumber(normalizedLessonId)} 课`;
  }

  function normalizeResponseStatus(value, fallback) {
    const candidate = text(value);
    return RESPONSE_STATUS_IDS.includes(candidate) ? candidate : (fallback || "unobserved");
  }

  function normalizeAnsweredResponseStatus(value) {
    const candidate = text(value);
    return ["partial", "peer_supported"].includes(candidate) ? candidate : "answered";
  }

  function normalizeNoResponseReason(value) {
    const candidate = text(value);
    return NO_RESPONSE_REASONS.some((item) => item.id === candidate) ? candidate : "other";
  }

  function noResponseReasonLabel(value) {
    return NO_RESPONSE_REASONS.find((item) => item.id === value)?.label || "其他";
  }

  function normalizeAnswerContext(value) {
    const candidate = text(value);
    return ANSWER_CONTEXTS.some((item) => item.id === candidate) ? candidate : "unknown";
  }

  function normalizeRecordStatus(value) {
    const candidate = text(value);
    return RECORD_STATUS_IDS.includes(candidate) ? candidate : "valid";
  }

  function isEffectiveAnswer(attempt) {
    const responseStatus = normalizeResponseStatus(
      attempt && attempt.responseStatus,
      attempt && attempt.outcome === "answered" ? "answered" : "unobserved"
    );
    return attempt && attempt.outcome === "answered"
      && ["answered", "partial", "peer_supported"].includes(responseStatus);
  }

  function nextEventOrder(state) {
    return state.attempts.reduce((max, attempt) => Math.max(max, Number(attempt.eventOrder) || 0), 0) + 1;
  }

  function firstValue(source, keys) {
    for (const key of keys) {
      if (source && source[key] !== undefined && source[key] !== null && text(source[key]) !== "") {
        return text(source[key]);
      }
    }
    return "";
  }

  function uniqueStudentId(candidate, index, used) {
    const base = text(candidate) || `student-${index + 1}`;
    let next = base;
    let suffix = 2;
    while (used.has(next)) {
      next = `${base}-${suffix}`;
      suffix += 1;
    }
    used.add(next);
    return next;
  }

  function normalizeStudents(roster) {
    if (!Array.isArray(roster)) {
      throw new Error("名单必须是数组");
    }

    const usedIds = new Set();
    return roster
      .map((raw, index) => {
        const source = typeof raw === "string" ? { name: raw } : (raw || {});
        const code = firstValue(source, ["studentId", "student_id", "studentCode", "student_code", "id", "学号", "学生编号", "编号", "學號", "學生編號", "編號"]);
        const seatNumber = firstValue(source, ["seatNumber", "seat_number", "seat", "座号", "座位号", "座號", "座位號"]);
        const name = firstValue(source, ["name", "studentName", "student_name", "学生姓名", "中文姓名", "姓名", "學生姓名"]);
        const preferredName = firstValue(source, ["preferredName", "preferred_name", "常用名"]);
        const originalName = firstValue(source, ["originalName", "original_name", "原名"]);
        const fallbackId = code || seatNumber || name;
        if (!name && !code && !seatNumber) {
          return null;
        }
        return {
          id: uniqueStudentId(firstValue(source, ["id", "studentId", "student_id", "studentCode", "student_code"]) || fallbackId, index, usedIds),
          studentCode: code,
          seatNumber,
          name: name || code || seatNumber || `学生 ${index + 1}`,
          preferredName,
          originalName
        };
      })
      .filter(Boolean);
  }

  function createSession(options) {
    const settings = options || {};
    const students = normalizeStudents(settings.roster || []);
    if (students.length === 0) {
      throw new Error("请先加入至少一位学生");
    }

    const createdAt = timestamp();
    const textbook = getTextbook(settings.textbookId);
    return {
      schemaVersion: SCHEMA_VERSION,
      session: {
        id: text(settings.sessionId) || id("session"),
        className: text(settings.className),
        date: text(settings.date) || localDate(),
        textbookId: textbook.id,
        lessonId: normalizeLessonId(settings.lessonId || settings.lessonNumber, textbook.id),
        taskMode: text(settings.taskMode) || DEFAULT_TASK_MODE,
        taskTarget: text(settings.taskTarget) || DEFAULT_TASK_TARGET,
        createdAt,
        updatedAt: createdAt
      },
      roster: students,
      excludedStudentIds: [],
      currentRound: {
        number: 1,
        answeredStudentIds: [],
        pendingAttemptId: null,
        lastNotAnsweredStudentId: null
      },
      attempts: [],
      events: [],
      undoStack: []
    };
  }

  function stateSnapshot(state) {
    const snapshot = clone(state);
    snapshot.undoStack = [];
    return snapshot;
  }

  function withMutation(state, eventType, payload, mutate) {
    const before = stateSnapshot(state);
    const event = {
      id: id("event"),
      type: eventType,
      timestamp: timestamp(),
      ...clone(payload || {})
    };
    const next = mutate(clone(before));
    next.events = [...before.events, event];
    next.undoStack = [...state.undoStack, { before, event }];
    next.session.updatedAt = event.timestamp;
    return next;
  }

  function getStudent(state, studentId) {
    return state.roster.find((student) => student.id === studentId) || null;
  }

  function getEligibleStudents(state) {
    const excluded = new Set(state.excludedStudentIds);
    return state.roster.filter((student) => !excluded.has(student.id));
  }

  function getDrawingPool(state) {
    const answered = new Set(state.currentRound.answeredStudentIds);
    const excluded = new Set(state.excludedStudentIds);
    return state.roster
      .filter((student) => !excluded.has(student.id) && !answered.has(student.id));
  }

  function getLastParticipantId(state) {
    // Attempt order survives round changes and backup imports; ignore withdrawn turns.
    for (let index = state.attempts.length - 1; index >= 0; index -= 1) {
      const attempt = state.attempts[index];
      if (attempt.outcome !== "undone" && attempt.recordStatus !== "voided") return attempt.studentId;
    }
    return null;
  }

  function getSelectablePool(state) {
    const pool = getDrawingPool(state);
    const lastStudentId = getLastParticipantId(state);
    if (pool.length <= 1 || !lastStudentId) return pool;
    return pool.filter((student) => student.id !== lastStudentId);
  }

  function getRandomSelectionPool(state) {
    const pool = getSelectablePool(state);
    if (pool.length <= 1) return pool;

    const randomStats = new Map();
    state.attempts.forEach((attempt) => {
      if (attempt.selectionMethod !== "random" || attempt.outcome === "undone") return;
      const current = randomStats.get(attempt.studentId) || { count: 0, lastDrawnAt: "" };
      current.count += 1;
      if (!current.lastDrawnAt || String(attempt.drawnAt || "") > current.lastDrawnAt) {
        current.lastDrawnAt = String(attempt.drawnAt || "");
      }
      randomStats.set(attempt.studentId, current);
    });

    const ranked = pool.map((student, index) => {
      const stats = randomStats.get(student.id) || { count: 0, lastDrawnAt: "" };
      return { student, index, ...stats };
    }).sort((left, right) => {
      if (left.count !== right.count) return left.count - right.count;
      if (!left.lastDrawnAt && right.lastDrawnAt) return -1;
      if (left.lastDrawnAt && !right.lastDrawnAt) return 1;
      if (left.lastDrawnAt !== right.lastDrawnAt) return left.lastDrawnAt.localeCompare(right.lastDrawnAt);
      return left.index - right.index;
    });

    const lowestCallCount = ranked[0].count;
    const leastCalled = ranked.filter((item) => item.count === lowestCallCount);
    const neverCalled = leastCalled.filter((item) => !item.lastDrawnAt);
    if (neverCalled.length > 0) return neverCalled.map((item) => item.student);

    // Keep a small random frontier among the least-called students: longer
    // waiting students are favoured, while the classroom still feels random.
    const frontierSize = Math.max(1, Math.min(leastCalled.length, Math.ceil(leastCalled.length * 0.25)));
    return leastCalled.slice(0, frontierSize).map((item) => item.student);
  }

  function setSessionContext(state, textbookId, lessonId) {
    const textbook = getTextbook(textbookId);
    const normalizedLessonId = normalizeLessonId(lessonId, textbook.id);
    if (state.session.textbookId === textbook.id && state.session.lessonId === normalizedLessonId) {
      return clone(state);
    }
    return withMutation(state, "lesson_changed", {
      textbookId: textbook.id,
      lessonId: normalizedLessonId
    }, (next) => {
      next.session.textbookId = textbook.id;
      next.session.lessonId = normalizedLessonId;
      return next;
    });
  }

  function randomIndex(length) {
    if (length <= 1) return 0;
    const cryptoObject = typeof globalThis !== "undefined" ? globalThis.crypto : null;
    if (cryptoObject && typeof cryptoObject.getRandomValues === "function") {
      const values = new Uint32Array(1);
      cryptoObject.getRandomValues(values);
      return Math.floor((values[0] / 4294967296) * length);
    }
    return Math.floor(Math.random() * length);
  }

  function normalizeRandomIndex(value, length) {
    const candidate = Number(value);
    if (!Number.isFinite(candidate)) return 0;
    return Math.min(length - 1, Math.max(0, Math.floor(candidate)));
  }

  function drawStudent(state, options) {
    if (state.currentRound.pendingAttemptId) {
      throw new Error("请先完成目前这位学生的回答");
    }
    const settings = options || {};
    // Injected randomIndex is used by deterministic tests and import tools.
    // Normal classroom draws use the fair priority frontier above.
    const pool = typeof settings.randomIndex === "function"
      ? getSelectablePool(state)
      : getRandomSelectionPool(state);
    if (pool.length === 0) {
      throw new Error(getEligibleStudents(state).length === 0 ? "目前没有可抽问的学生" : "这一轮已完成，请开始下一轮抽问");
    }
    const chooser = typeof settings.randomIndex === "function" ? settings.randomIndex : randomIndex;
    const selected = pool[normalizeRandomIndex(chooser(pool.length), pool.length)];
    const drawnAt = timestamp();
    const attempt = {
      id: id("attempt"),
      sessionId: state.session.id,
      roundNumber: state.currentRound.number,
      studentId: selected.id,
      studentSnapshot: clone(selected),
      textbookId: state.session.textbookId || DEFAULT_TEXTBOOK_ID,
      lessonId: normalizeLessonId(state.session.lessonId, state.session.textbookId || DEFAULT_TEXTBOOK_ID),
      taskMode: settings.taskMode !== undefined
        ? text(settings.taskMode) || DEFAULT_TASK_MODE
        : state.session.taskMode || DEFAULT_TASK_MODE,
      taskTarget: settings.taskTarget !== undefined
        ? text(settings.taskTarget) || DEFAULT_TASK_TARGET
        : state.session.taskTarget || DEFAULT_TASK_TARGET,
      sessionDate: state.session.date,
      drawnAt,
      createdAt: drawnAt,
      completedAt: null,
      updatedAt: drawnAt,
      outcome: "pending",
      note: "",
      selectionMethod: "random",
      eventType: "random_call",
      opportunityStatus: "called",
      responseStatus: "unobserved",
      noResponseReason: null,
      answerContext: "unknown",
      attendanceStatus: null,
      recordStatus: "valid",
      correctionNote: "",
      correctedAt: null,
      eventOrder: nextEventOrder(state)
    };

    return withMutation(state, "draw", {
      attemptId: attempt.id,
      studentId: selected.id,
      roundNumber: state.currentRound.number
    }, (next) => {
      next.attempts.push(attempt);
      next.currentRound.pendingAttemptId = attempt.id;
      return next;
    });
  }

  function selectVolunteer(state, studentId, options) {
    if (state.currentRound.pendingAttemptId) throw new Error("请先完成目前这位学生的回答");
    const student = getStudent(state, studentId);
    if (!student) throw new Error("找不到这位同学");
    if (state.excludedStudentIds.includes(studentId)) throw new Error("暂不抽问的学生不能记录自愿发言");
    const settings = options || {};
    const selectedAt = timestamp();
    const attempt = {
      id: id("attempt"), sessionId: state.session.id, roundNumber: state.currentRound.number,
      studentId: student.id, studentSnapshot: clone(student),
      textbookId: state.session.textbookId || DEFAULT_TEXTBOOK_ID,
      lessonId: normalizeLessonId(state.session.lessonId, state.session.textbookId || DEFAULT_TEXTBOOK_ID),
      taskMode: text(settings.taskMode) || state.session.taskMode || DEFAULT_TASK_MODE,
      taskTarget: text(settings.taskTarget) || state.session.taskTarget || DEFAULT_TASK_TARGET,
      sessionDate: state.session.date,
      drawnAt: selectedAt, createdAt: selectedAt, completedAt: null, updatedAt: selectedAt,
      outcome: "pending",
      note: "",
      selectionMethod: "volunteer",
      eventType: "voluntary_speaking",
      opportunityStatus: "volunteered",
      responseStatus: "unobserved",
      noResponseReason: null,
      answerContext: "unknown",
      attendanceStatus: null,
      recordStatus: "valid",
      correctionNote: "",
      correctedAt: null,
      eventOrder: nextEventOrder(state)
    };
    return withMutation(state, "volunteer_selected", {
      attemptId: attempt.id, studentId: student.id, roundNumber: state.currentRound.number
    }, (next) => {
      next.attempts.push(attempt);
      next.currentRound.pendingAttemptId = attempt.id;
      return next;
    });
  }

  function pendingAttempt(state) {
    if (!state.currentRound.pendingAttemptId) return null;
    return state.attempts.find((attempt) => attempt.id === state.currentRound.pendingAttemptId) || null;
  }

  function updatePending(state, eventType, payload, updater) {
    const current = pendingAttempt(state);
    if (!current) {
      throw new Error("目前没有正在回答的学生");
    }
    return withMutation(state, eventType, {
      attemptId: current.id,
      studentId: current.studentId,
      roundNumber: current.roundNumber,
      ...(payload || {})
    }, (next) => updater(next, current.id));
  }

  function recordResponse(state, options) {
    const settings = options || {};
    const assistance = normalizeAssistance(settings.assistance);
    if (text(settings.taskPrompt).length > 500 || text(settings.note).length > 2000) throw new Error("题目限 500 字，备注限 2000 字");
    const responseStatus = normalizeAnsweredResponseStatus(settings.responseStatus);
    const answerContext = normalizeAnswerContext(settings.answerContext);
    return updatePending(state, "response_recorded", {
      responseStatus,
      answerContext
    }, (next, attemptId) => {
      const attempt = next.attempts.find((item) => item.id === attemptId);
      attempt.outcome = "answered";
      attempt.responseStatus = responseStatus;
      attempt.noResponseReason = null;
      attempt.answerContext = answerContext;
      attempt.assistance = assistance;
      attempt.note = text(settings.note);
      assignQuestion(next, attempt, settings.taskPrompt);
      attempt.completedAt = timestamp();
      attempt.updatedAt = attempt.completedAt;
      if (attempt.selectionMethod !== "volunteer" && !next.currentRound.answeredStudentIds.includes(attempt.studentId)) {
        next.currentRound.answeredStudentIds.push(attempt.studentId);
      }
      next.currentRound.pendingAttemptId = null;
      next.currentRound.lastNotAnsweredStudentId = null;
      return next;
    });
  }

  function returnPending(state, options) {
    const settings = options || {};
    const reason = text(settings.noResponseReason);
    if (reason && !NO_RESPONSE_REASONS.some((item) => item.id === reason)) {
      throw new Error("未回答原因不在可选范围内");
    }
    return updatePending(state, "not_answered", {
      noResponseReason: reason || "other"
    }, (next, attemptId) => {
      const attempt = next.attempts.find((item) => item.id === attemptId);
      attempt.outcome = "not_answered";
      attempt.responseStatus = "no_response";
      attempt.noResponseReason = reason || "other";
      attempt.answerContext = normalizeAnswerContext(settings.answerContext);
      attempt.note = text(settings.note);
      assignQuestion(next, attempt, settings.taskPrompt);
      attempt.completedAt = timestamp();
      attempt.updatedAt = attempt.completedAt;
      next.currentRound.pendingAttemptId = null;
      next.currentRound.lastNotAnsweredStudentId = attempt.studentId;
      return next;
    });
  }

  function assignQuestion(next, attempt, value) {
    const prompt = text(value);
    if (attempt.taskPrompt === prompt && attempt.questionId) return;
    attempt.taskPrompt = prompt;
    if (!prompt) { attempt.questionId = null; return; }
    const contextKey = `${attempt.textbookId}:${attempt.lessonId}`;
    const current = next.session.activeQuestion;
    if (current && current.prompt === prompt && current.contextKey === contextKey) {
      attempt.questionId = current.id;
    } else {
      const question = { id: id("question"), prompt, contextKey };
      attempt.questionId = question.id;
      next.session.activeQuestion = question;
    }
  }

  function beginQuestion(state) {
    return withMutation(state, "new_question", {}, next => {
      next.session.activeQuestion = null;
      return next;
    });
  }

  function setExcluded(state, studentId, excluded) {
    const student = getStudent(state, studentId);
    if (!student) throw new Error("找不到这位同学");
    if (state.currentRound.pendingAttemptId) {
      throw new Error("请先完成目前这位学生的回答");
    }
    if (state.currentRound.answeredStudentIds.includes(studentId) && excluded) {
      throw new Error("已完成回答的同学，本轮不能再改为暂不抽问");
    }
    return withMutation(state, excluded ? "student_excluded" : "student_included", {
      studentId
    }, (next) => {
      const current = new Set(next.excludedStudentIds);
      if (excluded) current.add(studentId);
      else current.delete(studentId);
      next.excludedStudentIds = Array.from(current);
      return next;
    });
  }

  function startNextRound(state) {
    const progress = getProgress(state);
    if (progress.pending) throw new Error("请先完成目前这位学生的回答");
    if (progress.eligibleCount === 0) throw new Error("目前没有可抽问的学生");
    if (!progress.roundComplete) throw new Error("这一轮还没完成，不能开始下一轮");
    return withMutation(state, "next_round", {
      previousRound: state.currentRound.number,
      roundNumber: state.currentRound.number + 1
    }, (next) => {
      next.currentRound = {
        number: state.currentRound.number + 1,
        answeredStudentIds: [],
        pendingAttemptId: null,
        lastNotAnsweredStudentId: null
      };
      return next;
    });
  }

  function undoLastAction(state) {
    if (!state.undoStack || state.undoStack.length === 0) {
      throw new Error("没有可以撤销的操作");
    }
    const entry = state.undoStack[state.undoStack.length - 1];
    const undoEvent = {
      id: id("event"),
      type: "undo",
      timestamp: timestamp(),
      undoOf: entry.event.id,
      undoType: entry.event.type,
      attemptId: entry.event.attemptId || ""
    };
    const next = clone(entry.before);
    const undoneAttempt = entry.event.attemptId
      ? state.attempts.find((attempt) => attempt.id === entry.event.attemptId)
      : null;
    const wasAlreadyInBefore = undoneAttempt
      ? entry.before.attempts.some((attempt) => attempt.id === undoneAttempt.id)
      : true;
    if (undoneAttempt && !wasAlreadyInBefore) {
      const tombstone = clone(undoneAttempt);
      tombstone.outcome = "undone";
      tombstone.responseStatus = "unobserved";
      tombstone.noResponseReason = null;
      tombstone.recordStatus = "voided";
      tombstone.correctedAt = undoEvent.timestamp;
      tombstone.correctionNote = tombstone.correctionNote || "已撤销";
      tombstone.completedAt = undoEvent.timestamp;
      tombstone.updatedAt = undoEvent.timestamp;
      tombstone.note = tombstone.note || "已撤销";
      next.attempts.push(tombstone);
    }
    next.events = [...entry.before.events, entry.event, undoEvent];
    next.undoStack = state.undoStack.slice(0, -1);
    next.session.updatedAt = undoEvent.timestamp;
    return next;
  }

  function getProgress(state) {
    const eligibleCount = getEligibleStudents(state).length;
    const answeredCount = state.currentRound.answeredStudentIds.length;
    const pool = getDrawingPool(state);
    return {
      roundNumber: state.currentRound.number,
      eligibleCount,
      answeredCount,
      poolCount: pool.length,
      pending: Boolean(state.currentRound.pendingAttemptId),
      roundComplete: eligibleCount > 0 && pool.length === 0 && !state.currentRound.pendingAttemptId,
      noEligibleStudents: eligibleCount === 0
    };
  }

  function activeAttempts(state) {
    return state.attempts.filter((attempt) => attempt.outcome !== "undone");
  }

  function summarizeAttemptCollection(input, includeLessonBreakdown) {
    const attempts = (Array.isArray(input) ? input : [])
      .filter((attempt) => attempt && attempt.outcome !== "undone" && attempt.recordStatus !== "voided");
    const answered = attempts.filter((attempt) => attempt.outcome === "answered");
    const notAnswered = attempts.filter((attempt) => attempt.outcome === "not_answered");
    const effective = answered.filter(isEffectiveAnswer);
    const randomCalls = attempts.filter((attempt) => attempt.selectionMethod !== "volunteer");
    const volunteers = attempts.filter((attempt) => attempt.selectionMethod === "volunteer");
    const noResponseReasonStats = {};
    notAnswered.forEach((attempt) => {
      const reason = normalizeNoResponseReason(attempt.noResponseReason);
      noResponseReasonStats[reason] = (noResponseReasonStats[reason] || 0) + 1;
    });
    const responseStatusCounts = Object.fromEntries(RESPONSE_STATUS_IDS.map((status) => [status, 0]));
    attempts.forEach((attempt) => {
      const status = normalizeResponseStatus(
        attempt.responseStatus,
        attempt.outcome === "answered" ? "answered" : attempt.outcome === "not_answered" ? "no_response" : "unobserved"
      );
      responseStatusCounts[status] += 1;
    });
    const answerContextCounts = Object.fromEntries(ANSWER_CONTEXTS.map((context) => [context.id, 0]));
    answered.forEach((attempt) => {
      answerContextCounts[normalizeAnswerContext(attempt.answerContext)] += 1;
    });
    const result = {
      attempts: attempts.length,
      totalAnswerCount: answered.length,
      answeredCount: answered.length,
      effectiveAnswerCount: effective.length,
      notAnsweredCount: notAnswered.length,
      unrecordedCount: attempts.filter((attempt) => attempt.outcome === "pending").length,
      participationDayCount: new Set(answered.map((a) => a.sessionDate).filter(Boolean)).size,
      randomCallCount: randomCalls.length,
      randomCallEffectiveAnswerCount: randomCalls.filter(isEffectiveAnswer).length,
      voluntarySpeakingCount: volunteers.length,
      voluntaryEffectiveAnswerCount: volunteers.filter(isEffectiveAnswer).length,
      responseStatusCounts,
      answerContextCounts,
      noResponseReasonStats
    };

    if (includeLessonBreakdown) {
      const lessonGroups = new Map();
      attempts.forEach((attempt) => {
        const textbookId = text(attempt.textbookId) || DEFAULT_TEXTBOOK_ID;
        const lessonId = normalizeLessonId(attempt.lessonId, textbookId);
        const key = `${textbookId}:${lessonId}`;
        if (!lessonGroups.has(key)) lessonGroups.set(key, { textbookId, lessonId, attempts: [] });
        lessonGroups.get(key).attempts.push(attempt);
      });
      result.lessonBreakdown = Array.from(lessonGroups.values())
        .sort((left, right) => `${left.textbookId}:${left.lessonId}`.localeCompare(`${right.textbookId}:${right.lessonId}`))
        .map((group) => ({
          textbookId: group.textbookId,
          lessonId: group.lessonId,
          label: formatLessonLabel(group.textbookId, group.lessonId),
          ...summarizeAttemptCollection(group.attempts, false)
        }));

    }
    return result;
  }

  function summarizeAttempts(attempts) {
    return summarizeAttemptCollection(attempts, true);
  }

  function getSummary(state) {
    const attempts = activeAttempts(state);
    return state.roster.map((student) => ({
      student: clone(student),
      ...summarizeAttempts(attempts.filter((attempt) => attempt.studentId === student.id))
    }));
  }

  function parseCsvRows(input) {
    const value = text(input).replace(/^\uFEFF/, "");
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;
    for (let index = 0; index < value.length; index += 1) {
      const character = value[index];
      const next = value[index + 1];
      if (character === '"') {
        if (quoted && next === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = !quoted;
        }
      } else if (character === "," && !quoted) {
        row.push(cell.trim());
        cell = "";
      } else if ((character === "\n" || character === "\r") && !quoted) {
        if (character === "\r" && next === "\n") index += 1;
        row.push(cell.trim());
        if (row.some((item) => item !== "")) rows.push(row);
        row = [];
        cell = "";
      } else {
        cell += character;
      }
    }
    if (cell !== "" || row.length > 0) {
      row.push(cell.trim());
      if (row.some((item) => item !== "")) rows.push(row);
    }
    return rows;
  }

  function parseRosterText(input) {
    const rows = parseCsvRows(input);
    if (rows.length === 0) return [];
    const knownHeaders = new Set(["学号", "学生编号", "编号", "座号", "座位号", "学生姓名", "中文姓名", "姓名", "學號", "學生編號", "編號", "座號", "座位號", "學生姓名", "中文姓名", "姓名", "student_id", "student_code", "seat_number", "name"]);
    const hasHeader = rows[0].some((cell) => knownHeaders.has(cell.toLowerCase()));
    if (hasHeader) {
      const headers = rows[0].map((cell) => cell.toLowerCase());
      return normalizeStudents(rows.slice(1).map((row) => {
        const source = {};
        headers.forEach((header, index) => {
          source[header] = row[index] || "";
        });
        return source;
      }));
    }
    return normalizeStudents(rows.map((row, index) => {
      if (row.length >= 2) {
        return { seatNumber: row[0], name: row[1], studentCode: row[2] || "" };
      }
      return { seatNumber: String(index + 1), name: row[0] };
    }));
  }

  function csvCell(value) {
    const raw = value === null || value === undefined ? "" : String(value);
    return /[",\n\r]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
  }

  const SESSION_EXPORT_HEADERS = Object.freeze([
      "session_id", "session_date", "class_name", "textbook_id", "textbook_title",
      "lesson_id", "lesson_number", "round_number", "event_order", "attempt_id", "event_type", "selection_method",
      "student_id", "student_code", "seat_number", "student_name",
      "task_mode", "task_target", "opportunity_status", "response_status", "outcome", "no_response_reason", "no_response_reason_label", "answer_context", "attendance_status", "record_status",
      "note", "correction_note", "corrected_at", "created_at", "drawn_at", "completed_at", "updated_at", "task_prompt", "assistance"
  ]);

  function sessionExportRow(state, attempt) {
      const student = attempt.studentSnapshot || getStudent(state, attempt.studentId) || {};
      const textbookId = attempt.textbookId || state.session.textbookId || DEFAULT_TEXTBOOK_ID;
      const textbook = getTextbook(textbookId);
      const lessonId = normalizeLessonId(
        attempt.lessonId || state.session.lessonId || DEFAULT_LESSON_ID,
        textbook.id
      );
      const values = [
        state.session.id,
        state.session.date,
        state.session.className,
        textbook.id,
        textbook.label,
        lessonId,
        getLessonNumber(lessonId),
        attempt.roundNumber,
        attempt.eventOrder,
        attempt.id,
        attempt.eventType || (attempt.selectionMethod === "volunteer" ? "voluntary_speaking" : "random_call"),
        attempt.selectionMethod || "random",
        attempt.studentId,
        student.studentCode,
        student.seatNumber,
        student.name,
        attempt.taskMode,
        attempt.taskTarget,
        attempt.opportunityStatus || (attempt.selectionMethod === "volunteer" ? "volunteered" : "called"),
        attempt.responseStatus || (attempt.outcome === "answered" ? "answered" : attempt.outcome === "not_answered" ? "no_response" : "unobserved"),
        attempt.outcome,
        attempt.noResponseReason,
        attempt.noResponseReason ? noResponseReasonLabel(attempt.noResponseReason) : "",
        attempt.answerContext || "unknown",
        attempt.attendanceStatus || "",
        attempt.recordStatus || "valid",
        attempt.note,
        attempt.correctionNote,
        attempt.correctedAt,
        attempt.createdAt || attempt.drawnAt,
        attempt.drawnAt,
        attempt.completedAt,
        attempt.updatedAt,
        attempt.taskPrompt || "",
        attempt.assistance ?? ""
      ];
      return values;
  }

  function getSessionExportRows(state) {
    const rows = (state && Array.isArray(state.attempts) ? state.attempts : [])
      .map((attempt) => sessionExportRow(state, attempt));
    return { headers: [...SESSION_EXPORT_HEADERS], rows };
  }

  function exportSessionCsv(state) {
    const exported = getSessionExportRows(state);
    const lines = [exported.headers.map(csvCell).join(",")];
    exported.rows.forEach((row) => lines.push(row.map(csvCell).join(",")));
    return `\uFEFF${lines.join("\n")}`;
  }

  const STUDENT_SUMMARY_HEADERS = Object.freeze([
    "class_name", "student_id", "student_code", "seat_number", "student_name",
    "total_attempt_count", "total_answer_count", "effective_answer_count", "random_call_count",
    "random_call_effective_answer_count", "voluntary_speaking_count", "voluntary_effective_answer_count",
    "participation_day_count", "not_answered_count",
    "no_response_reasons", "lesson_summaries"
  ]);

  function storedSessionList(input) {
    if (Array.isArray(input)) return input.filter((item) => item && item.session && Array.isArray(item.roster));
    return input && input.session && Array.isArray(input.roster) ? [input] : [];
  }

  function getStudentSummaryRows(input) {
    const sessions = storedSessionList(input);
    const students = new Map();
    sessions.forEach((entry) => {
      entry.roster.forEach((student) => {
        const studentKey = `${entry.session.className || ""}:${student.studentCode || student.id}`;
        if (!students.has(studentKey)) {
          students.set(studentKey, {
            className: entry.session.className || "",
            student,
            attempts: []
          });
        }
        const target = students.get(studentKey);
        entry.attempts
          .filter((attempt) => attempt.studentId === student.id || (attempt.studentSnapshot?.studentCode && attempt.studentSnapshot.studentCode === student.studentCode))
          .forEach((attempt) => target.attempts.push({ ...attempt, sessionDate: entry.session.date }));
      });
    });

    const rows = Array.from(students.values()).map((item) => {
      const summary = summarizeAttempts(item.attempts);
      const reasons = Object.entries(summary.noResponseReasonStats)
        .map(([reason, count]) => `${noResponseReasonLabel(reason)} ${count} 次`)
        .join("；");
      const lessons = (summary.lessonBreakdown || [])
        .map((lesson) => {
          return `${lesson.label}：回答 ${lesson.totalAnswerCount} 次，自愿回答 ${lesson.voluntaryEffectiveAnswerCount} 次`;
        })
        .join("；");
      return [
        item.className,
        item.student.id,
        item.student.studentCode,
        item.student.seatNumber,
        item.student.name,
        summary.attempts,
        summary.totalAnswerCount,
        summary.effectiveAnswerCount,
        summary.randomCallCount,
        summary.randomCallEffectiveAnswerCount,
        summary.voluntarySpeakingCount,
        summary.voluntaryEffectiveAnswerCount,
        summary.participationDayCount,
        summary.notAnsweredCount,
        reasons,
        lessons
      ];
    });
    rows.sort((left, right) => `${left[0]}:${left[3]}:${left[2]}`.localeCompare(`${right[0]}:${right[3]}:${right[2]}`));
    return { headers: [...STUDENT_SUMMARY_HEADERS], rows };
  }

  function exportStudentSummaryCsv(input) {
    const exported = getStudentSummaryRows(input);
    const lines = [exported.headers.map(csvCell).join(",")];
    exported.rows.forEach((row) => lines.push(row.map(csvCell).join(",")));
    return `\uFEFF${lines.join("\n")}`;
  }

  function exportBackup(state) {
    return JSON.stringify(state, null, 2);
  }

  function importBackup(input) {
    const parsed = typeof input === "string" ? JSON.parse(input) : clone(input);
    if (!parsed || ![LEGACY_SCHEMA_VERSION, 2, 3, SCHEMA_VERSION].includes(parsed.schemaVersion) || !parsed.session || !Array.isArray(parsed.roster)) {
      throw new Error("这不是可使用的课堂完整备份");
    }
    if (!Array.isArray(parsed.attempts) || !parsed.currentRound) {
      throw new Error("备份文件数据不完整");
    }
    parsed.undoStack = Array.isArray(parsed.undoStack) ? parsed.undoStack : [];
    parsed.events = Array.isArray(parsed.events) ? parsed.events : [];
    parsed.excludedStudentIds = Array.isArray(parsed.excludedStudentIds) ? parsed.excludedStudentIds : [];
    const textbook = getTextbook(parsed.session.textbookId);
    parsed.session.textbookId = textbook.id;
    parsed.session.lessonId = normalizeLessonId(
      parsed.session.lessonId || parsed.session.lessonNumber,
      textbook.id
    );
    parsed.currentRound = {
      number: Number(parsed.currentRound.number) > 0 ? Number(parsed.currentRound.number) : 1,
      answeredStudentIds: Array.isArray(parsed.currentRound.answeredStudentIds)
        ? parsed.currentRound.answeredStudentIds.map(String)
        : [],
      pendingAttemptId: parsed.currentRound.pendingAttemptId || null,
      lastNotAnsweredStudentId: parsed.currentRound.lastNotAnsweredStudentId || null
    };
    parsed.attempts = parsed.attempts.map((attempt, index) => {
      const selectionMethod = attempt.selectionMethod === "volunteer" ? "volunteer" : "random";
      const outcome = ["pending", "answered", "not_answered", "undone"].includes(attempt.outcome)
        ? attempt.outcome
        : "pending";
      const responseStatus = outcome === "not_answered"
        ? "no_response"
        : outcome === "answered"
          ? normalizeAnsweredResponseStatus(attempt.responseStatus)
          : "unobserved";
      const countedForSummary = attempt.countedForSummary !== undefined
        ? Boolean(attempt.countedForSummary)
        : attempt.countedForGrade !== false;
      const countedForGrade = attempt.countedForGrade !== undefined
        ? Boolean(attempt.countedForGrade)
        : countedForSummary;
      return {
        ...attempt,
        sessionDate: attempt.sessionDate || parsed.session.date,
        selectionMethod,
        eventType: attempt.eventType || (selectionMethod === "volunteer" ? "voluntary_speaking" : "random_call"),
        opportunityStatus: attempt.opportunityStatus || (selectionMethod === "volunteer" ? "volunteered" : "called"),
        outcome,
        responseStatus,
        noResponseReason: responseStatus === "no_response" ? normalizeNoResponseReason(attempt.noResponseReason) : null,
        answerContext: normalizeAnswerContext(attempt.answerContext),
        attendanceStatus: text(attempt.attendanceStatus) || null,
        recordStatus: outcome === "undone" ? "voided" : normalizeRecordStatus(attempt.recordStatus),
        correctionNote: text(attempt.correctionNote),
        correctedAt: attempt.correctedAt || null,
        countedForSummary,
        countedForGrade,
        eventOrder: Number(attempt.eventOrder) > 0 ? Number(attempt.eventOrder) : index + 1,
        createdAt: attempt.createdAt || attempt.drawnAt || timestamp(),
        textbookId: attempt.textbookId || textbook.id,
        lessonId: normalizeLessonId(attempt.lessonId || parsed.session.lessonId, attempt.textbookId || textbook.id)
      };
    });
    parsed.schemaVersion = SCHEMA_VERSION;
    return parsed;
  }

  return {
    SCHEMA_VERSION,
    DEFAULT_TASK_MODE,
    DEFAULT_TASK_TARGET,
    DEFAULT_TEXTBOOK_ID,
    DEFAULT_LESSON_ID,
    CLASS_OPTIONS,
    TEXTBOOK_OPTIONS,
    beginQuestion,
    RESPONSE_STATUS_IDS,
    NO_RESPONSE_REASONS,
    ANSWER_CONTEXTS,
    RECORD_STATUS_IDS,
    TASK_MODES,
    TASK_TARGETS,
    getTextbook,
    getLessonNumber,
    normalizeLessonId,
    formatLessonLabel,
    createSession,
    normalizeStudents,
    parseCsvRows,
    parseRosterText,
    getStudent,
    getEligibleStudents,
    getDrawingPool,
    getSelectablePool,
    getLastParticipantId,
    getRandomSelectionPool,
    setSessionContext,
    pendingAttempt,
    drawStudent,
    selectVolunteer,
    recordResponse,
    returnPending,
    setExcluded,
    startNextRound,
    undoLastAction,
    getProgress,
    getSummary,
    summarizeAttempts,
    getSessionExportRows,
    exportSessionCsv,
    getStudentSummaryRows,
    exportStudentSummaryCsv,
    exportBackup,
    importBackup
  };
}));
