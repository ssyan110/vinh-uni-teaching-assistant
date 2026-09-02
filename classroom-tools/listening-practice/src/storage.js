const ATTEMPTS_KEY = "vinh-listening-practice-attempts-v1";
const QUESTION_BANK_KEY = "vinh-listening-practice-question-bank-v1";
const CLASSROOM_CONFIG_KEY = "vinh-listening-practice-classroom-config-v1";

let storageMode = "local";

function readLocal(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function writeLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

async function request(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export function getStorageMode() {
  return storageMode;
}

export async function loadAttempts() {
  try {
    const attempts = await request("/api/attempts", { cache: "no-store" });
    storageMode = "shared";
    return Array.isArray(attempts) ? attempts : [];
  } catch {
    storageMode = "local";
    return readLocal(ATTEMPTS_KEY, []);
  }
}

export async function saveAttempt(attempt) {
  try {
    const result = await request("/api/attempts", { method: "POST", body: JSON.stringify(attempt) });
    storageMode = "shared";
    return { attempt: result.attempt || attempt, mode: "shared" };
  } catch {
    const attempts = readLocal(ATTEMPTS_KEY, []);
    const duplicate = attempts.find((item) => item.submissionKey && item.submissionKey === attempt.submissionKey);
    const savedAttempt = duplicate || {
      ...attempt,
      attemptNumber: attempts.filter((item) => item.courseId === attempt.courseId && item.classId === attempt.classId && item.studentCode === attempt.studentCode && item.setId === attempt.setId).length + 1
    };
    if (!duplicate) attempts.unshift(savedAttempt);
    writeLocal(ATTEMPTS_KEY, attempts);
    storageMode = "local";
    return { attempt: savedAttempt, mode: "local" };
  }
}

export async function loadQuestionBank(seed) {
  try {
    const questionSets = await request("/api/question-bank", { cache: "no-store" });
    if (Array.isArray(questionSets) && questionSets.length) {
      storageMode = "shared";
      return questionSets;
    }
  } catch {
    // Local development and file-based fallback use the seed bank.
  }
  const saved = readLocal(QUESTION_BANK_KEY, null);
  return Array.isArray(saved) && saved.length ? saved : seed;
}

export async function loadClassroomConfig(seed) {
  try {
    const config = await request("/api/classroom-config", { cache: "no-store" });
    if (config?.courses && config?.classes) {
      storageMode = "shared";
      return config;
    }
  } catch {
    // Local development and file-based fallback use the seed config.
  }
  const saved = readLocal(CLASSROOM_CONFIG_KEY, null);
  return saved?.courses && saved?.classes ? saved : seed;
}

export async function saveClassroomConfig(config) {
  writeLocal(CLASSROOM_CONFIG_KEY, config);
  try {
    await request("/api/classroom-config", { method: "POST", body: JSON.stringify(config) });
    storageMode = "shared";
    return "shared";
  } catch {
    storageMode = "local";
    return "local";
  }
}

export async function saveQuestionBank(questionSets) {
  writeLocal(QUESTION_BANK_KEY, questionSets);
  try {
    await request("/api/question-bank", { method: "POST", body: JSON.stringify(questionSets) });
    storageMode = "shared";
    return "shared";
  } catch {
    storageMode = "local";
    return "local";
  }
}

export function clearLocalAttempts() {
  localStorage.removeItem(ATTEMPTS_KEY);
}

export function downloadText(filename, text, mime = "application/json") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function escapeCsv(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function attemptsToCsv(attempts) {
  const rows = [["attempt_id", "submitted_at", "course_id", "course_name", "class_id", "class_name", "student_code", "attempt_number", "lesson_key", "set_id", "question_id", "answer", "grading", "is_correct", "points"]];
  attempts.forEach((attempt) => attempt.responses.forEach((response) => rows.push([
    attempt.id,
    attempt.submittedAt,
    attempt.courseId,
    attempt.courseName,
    attempt.classId,
    attempt.className,
    attempt.studentCode,
    attempt.attemptNumber,
    attempt.lessonKey,
    attempt.setId,
    response.questionId,
    response.answer,
    response.grading,
    response.isCorrect === null ? "" : response.isCorrect ? "true" : "false",
    response.points
  ])));
  return rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
}
