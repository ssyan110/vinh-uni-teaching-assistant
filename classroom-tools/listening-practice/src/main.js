import "./styles.css";
import { seedClassroomConfig } from "./data/classroom.js";
import { seedQuestionSets } from "./data/questions.js";
import {
  attemptsToCsv,
  downloadText,
  getStorageMode,
  loadAttempts,
  loadClassroomConfig,
  loadQuestionBank,
  saveAttempt,
  saveClassroomConfig,
  saveQuestionBank
} from "./storage.js";

const app = document.querySelector("#app");
let questionSets = [];
let classroomConfig = seedClassroomConfig;
let visibleAttempts = [];

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  return new Date(value).toLocaleString("zh-CN", { dateStyle: "medium", timeStyle: "short" });
}

function shell(content, page = "home") {
  app.innerHTML = `
    <div class="shell">
      <header class="topbar">
        <button class="brand" data-route="home" aria-label="回到首页">
          <span class="brand-mark" aria-hidden="true">听</span>
          <span><strong>荣市大学</strong><small>听说课听力练习</small></span>
        </button>
        <nav class="topbar-actions" aria-label="页面切换">
          <button class="${page === "student" ? "active" : ""}" data-route="student">学生练习</button>
          <button class="${page === "teacher" ? "active" : ""}" data-route="teacher">教师入口</button>
        </nav>
      </header>
      <main class="main">${content}</main>
    </div>
  `;
  app.querySelectorAll("[data-route]").forEach((button) => button.addEventListener("click", () => navigate(button.dataset.route)));
}

function navigate(route) {
  window.location.hash = route;
  if (route === "teacher") renderTeacher();
  else if (route === "student") renderStudentStart();
  else renderHome();
}

function getRequestedSetId() {
  const query = window.location.hash.split("?")[1] || "";
  return new URLSearchParams(query).get("set") || "";
}

function getRequestedClassId() {
  const query = window.location.hash.split("?")[1] || "";
  return new URLSearchParams(query).get("class") || "";
}

function getStudentLink(setId = "", classId = "") {
  const query = new URLSearchParams();
  if (setId) query.set("set", setId);
  if (classId) query.set("class", classId);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return `${window.location.origin}${window.location.pathname}#student${suffix}`;
}

function classesForCourse(courseId) {
  return classroomConfig.classes.filter((item) => item.courseId === courseId && item.status !== "archived");
}

function activeCourses() {
  return classroomConfig.courses.filter((item) => item.status !== "archived");
}

function activeClasses() {
  return classroomConfig.classes.filter((item) => item.status !== "archived");
}

function renderHome() {
  shell(`
    <section class="home-hero">
      <div class="hero-copy">
        <div class="eyebrow">听力练习</div>
        <h1>听清楚，<em>再回答。</em></h1>
        <p>选择练习，听音频，写下你的答案。每一次提交都会成为下一次复习的依据。</p>
        <div class="hero-actions"><button class="primary large" data-route="student">开始练习</button><button class="text-button" data-route="teacher">教师入口 <span>↗</span></button></div>
      </div>
      <div class="practice-orbit" aria-hidden="true"><div class="orbit-ring ring-one"></div><div class="orbit-ring ring-two"></div><div class="orbit-core"><span>听</span><small>01</small></div><div class="orbit-note note-a">重听</div><div class="orbit-note note-b">记录</div><div class="orbit-note note-c">回答</div></div>
    </section>
    <section class="home-strip"><div><span class="strip-number">${questionSets.length}</span><span>个练习题组</span></div><div><span class="strip-number">${activeClasses().length}</span><span>个班级入口</span></div><div><span class="strip-number">∞</span><span>次练习记录</span></div></section>
    <section class="practice-preview"><div class="section-heading"><h2>从一组练习开始</h2><p>扫码或选择题组，马上进入听力任务。</p></div><div class="set-preview-list">${questionSets.map((set, index) => `<button class="set-preview" data-set-preview="${escapeHtml(set.id)}"><span class="set-index">0${index + 1}</span><span class="set-info"><strong>${escapeHtml(set.title)}</strong><small>${escapeHtml(set.lessonTitle)} · ${set.questions.length} 个问题</small></span><span class="set-arrow">→</span></button>`).join("")}</div></section>
  `);
  app.querySelectorAll("[data-route]").forEach((button) => button.addEventListener("click", () => navigate(button.dataset.route)));
  app.querySelectorAll("[data-set-preview]").forEach((button) => button.addEventListener("click", () => { window.location.hash = `student?set=${encodeURIComponent(button.dataset.setPreview)}`; renderStudentStart(); }));
}

function renderStudentStart() {
  const requestedSetId = getRequestedSetId();
  const requestedClassId = getRequestedClassId();
  const selectedSet = questionSets.find((set) => set.id === requestedSetId) || questionSets[0];
  const requestedClass = activeClasses().find((item) => item.id === requestedClassId);
  const selectedCourseId = requestedClass?.courseId || activeCourses()[0]?.id;
  shell(`
    <section class="page-intro"><div><div class="eyebrow">学生练习</div><h1>准备好，就开始。</h1><p>先看题目，抓关键词，再听音频并回答。</p></div><div class="step-line"><span class="current">01</span><span>进入</span><i></i><span>02</span><span>听与答</span><i></i><span>03</span><span>提交</span></div></section>
    <section class="entry-layout">
      <div class="entry-card panel">
        <div class="card-heading"><span class="card-kicker">开始练习</span><h2>进入听力练习</h2><p>请使用老师分配的学生编号。</p></div>
        <form id="student-start-form">
          <div class="field"><label for="course-id">课程</label><select id="course-id" required>${activeCourses().map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === selectedCourseId ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}</select></div>
          <div class="field"><label for="class-id">班级</label><select id="class-id" required>${classesForCourse(selectedCourseId).map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === requestedClassId ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}</select></div>
          <div class="field"><label for="student-code">学生编号</label><input id="student-code" required maxlength="32" placeholder="例如 A012" /><small>只填写老师分配的编号。</small></div>
          <div class="field"><label for="set-id">练习题组</label><select id="set-id" required>${questionSets.map((set) => `<option value="${escapeHtml(set.id)}" ${set.id === selectedSet?.id ? "selected" : ""}>${escapeHtml(set.title)} · ${escapeHtml(set.lessonTitle)}</option>`).join("")}</select></div>
          <button class="primary full-button" type="submit">进入练习 <span>→</span></button>
        </form>
      </div>
      <aside class="practice-card"><div class="audio-symbol" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div><h3>听力练习的节奏</h3><ol><li><strong>先看题目</strong><small>知道要找什么信息</small></li><li><strong>再听音频</strong><small>可以重听，记下关键词</small></li><li><strong>最后回答</strong><small>提交后留下练习记录</small></li></ol></aside>
    </section>
  `, "student");
  app.querySelector("#course-id").addEventListener("change", (event) => {
    app.querySelector("#class-id").innerHTML = classesForCourse(event.target.value).map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</option>`).join("");
  });
  app.querySelector("#student-start-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const set = questionSets.find((item) => item.id === app.querySelector("#set-id").value);
    const courseId = app.querySelector("#course-id").value;
    const classOption = activeClasses().find((item) => item.id === app.querySelector("#class-id").value);
    if (set && classOption) renderQuiz(set, courseId, classOption, app.querySelector("#student-code").value.trim());
  });
}

function renderAnswerInput(question) {
  if (Array.isArray(question.options) && question.options.length) {
    return `<div class="choice-list">${question.options.map((option, index) => `<label><input type="radio" name="${escapeHtml(question.id)}" value="${escapeHtml(option)}" ${index === 0 ? "" : ""} required /><span>${String.fromCharCode(65 + index)}</span>${escapeHtml(option)}</label>`).join("")}</div>`;
  }
  return question.type === "short" || question.type === "keywords" ? `<textarea name="${escapeHtml(question.id)}" placeholder="写下你的答案" required></textarea>` : `<input name="${escapeHtml(question.id)}" placeholder="写下你的答案" required />`;
}

function normalizeAnswer(value) {
  return String(value || "").trim().toLowerCase().replaceAll(/[，。！？、\s]/g, "");
}

async function renderQuiz(set, courseId, classOption, studentCode) {
  const submissionKey = globalThis.crypto?.randomUUID?.() || `submission-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  shell(`
    <section class="quiz-header"><div><button class="back-button" data-route="student">← 返回题组</button><div class="eyebrow">${escapeHtml(set.lessonTitle)}</div><h1>${escapeHtml(set.title)}</h1></div><div class="quiz-identity"><span>${escapeHtml(classOption.label)}</span><strong>${escapeHtml(studentCode)}</strong></div></section>
    <section class="quiz-layout">
      <div class="quiz-main panel">
        <div class="quiz-progress"><div><span>听力任务</span><strong>${set.questions.length} 个问题</strong></div><div class="progress-track"><span style="width: 34%"></span></div></div>
        <div class="audio-box"><div class="audio-icon" aria-hidden="true">◖</div><div class="audio-copy"><strong>${escapeHtml(set.audio.label)}</strong><small>听音频，记关键词。需要时可以重听。</small></div><audio controls preload="metadata" src="${escapeHtml(set.audio.url)}"></audio></div>
        <form id="quiz-form"><div class="question-list">${set.questions.map((question, index) => `<article class="question"><div class="question-top"><span>问题 ${String(index + 1).padStart(2, "0")}</span><small>${question.points} 分</small></div><h2>${escapeHtml(question.prompt)}</h2>${renderAnswerInput(question)}</article>`).join("")}</div><div class="quiz-submit"><span>确认答案后再提交。</span><button class="primary" type="submit">提交练习 <span>→</span></button></div></form>
      </div>
      <aside class="quiz-side"><div class="side-marker">${String(set.questions.length).padStart(2, "0")}</div><h3>这次练习</h3><p>先听，再写。不要急着看答案。</p><div class="side-rule"></div><span>${escapeHtml(set.lessonTitle)}</span></aside>
    </section>
  `, "student");
  app.querySelectorAll('[data-route="student"]').forEach((button) => button.addEventListener("click", () => navigate("student")));
  app.querySelector("#quiz-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = event.currentTarget.querySelector("button[type=submit]");
    submit.disabled = true;
    submit.innerHTML = "正在保存…";
    const formData = new FormData(event.currentTarget);
    const responses = set.questions.map((question) => {
      const answer = String(formData.get(question.id) || "").trim();
      const isCorrect = question.answer === null || question.answer === undefined ? null : normalizeAnswer(answer) === normalizeAnswer(question.answer);
      return { questionId: question.id, answer, grading: question.grading || (isCorrect === null ? "manual" : "automatic"), isCorrect, points: isCorrect ? question.points : 0 };
    });
    const result = await saveAttempt({
      id: `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      submissionKey,
      submittedAt: new Date().toISOString(),
      courseId,
      courseName: activeCourses().find((item) => item.id === courseId)?.label || courseId,
      classId: classOption.id,
      className: classOption.label,
      studentCode,
      lessonKey: set.lessonKey,
      setId: set.id,
      questionVersion: set.version,
      automaticPoints: responses.reduce((sum, response) => sum + response.points, 0),
      totalPoints: set.questions.reduce((sum, question) => sum + question.points, 0),
      responses
    });
    renderSuccess(set, studentCode, responses, result.attempt, result.mode);
  });
}

function renderSuccess(set, studentCode, responses, attempt, mode) {
  const manualCount = responses.filter((response) => response.grading === "manual").length;
  shell(`
    <section class="success-page"><div class="success-mark">✓</div><div class="eyebrow">已完成</div><h1>练习提交成功。</h1><p>${escapeHtml(studentCode)}，这次练习已经记录下来。</p><div class="result-card"><div><span>练习题组</span><strong>${escapeHtml(set.title)}</strong></div><div><span>提交次数</span><strong>第 ${attempt?.attemptNumber || 1} 次</strong></div><div><span>结果</span><strong>${manualCount ? "等待教师查看" : "自动评分完成"}</strong></div></div><div class="success-actions"><button class="primary" data-route="student">再做一组</button><button class="text-button" data-route="home">回到首页</button></div><small class="save-state">${mode === "shared" ? "记录已保存" : "记录已保存在此设备"}</small></section>
  `, "student");
  app.querySelector('[data-route="student"]').addEventListener("click", () => navigate("student"));
  app.querySelector('[data-route="home"]').addEventListener("click", () => navigate("home"));
}

async function renderTeacher() {
  shell(`<section class="loading-state"><div class="loading-bar"></div><p>正在打开提交记录…</p></section>`, "teacher");
  const attempts = await loadAttempts();
  shell(`
    <section class="teacher-header"><div><div class="eyebrow">教师入口</div><h1>提交记录</h1><p>按班级和题组查看学生的每一次练习。</p></div><div class="teacher-actions"><span class="sync-status ${getStorageMode() === "shared" ? "connected" : "local"}"><i></i>${getStorageMode() === "shared" ? "共享记录" : "此设备记录"}</span><button class="secondary" id="refresh-records">刷新</button><button class="primary" id="export-csv">导出 CSV</button></div></section>
    <section class="teacher-panel panel"><div class="stats" id="stats"></div><div class="filter-bar"><div class="field"><label for="course-filter">课程</label><select id="course-filter"><option value="all">全部课程</option>${activeCourses().map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</option>`).join("")}</select></div><div class="field"><label for="class-filter">班级</label><select id="class-filter"><option value="all">全部班级</option>${activeClasses().map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</option>`).join("")}</select></div><div class="field"><label for="set-filter">题组</label><select id="set-filter"><option value="all">全部题组</option>${questionSets.map((set) => `<option value="${escapeHtml(set.id)}">${escapeHtml(set.title)}</option>`).join("")}</select></div><div class="field"><label for="date-from">开始日期</label><input id="date-from" type="date" /></div><div class="field"><label for="date-to">结束日期</label><input id="date-to" type="date" /></div><div class="field"><label for="student-search">学生编号</label><input id="student-search" type="search" placeholder="搜索编号" /></div><div class="filter-count" id="filter-count"></div></div><div id="attempts-table"></div></section>
    <section class="teacher-tools"><div><h2>发布练习</h2><p>选择班级后复制专用入口，再制作 QR Code。</p></div><div class="publish-list">${questionSets.map((set) => `<div class="publish-row"><div><strong>${escapeHtml(set.title)}</strong><small>${escapeHtml(set.lessonTitle)}</small></div><div class="publish-controls"><select aria-label="选择班级" data-publish-class="${escapeHtml(set.id)}"><option value="">通用入口</option>${activeClasses().map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</option>`).join("")}</select><button class="secondary" data-copy-set="${escapeHtml(set.id)}">复制学生链接</button></div></div>`).join("")}</div><details class="import-panel"><summary>导入新的题库</summary><p>使用 JSON 批量更新题组，不需要修改页面代码。</p><div class="import-actions"><button class="secondary" id="download-template">下载模板</button><input id="question-import" type="file" accept="application/json,.json" /></div></details></section>
    <section class="teacher-tools class-management-section"><div><h2>班级设置</h2><p>学生会从下拉选单选择班级；新增或封存选项不会删除历史提交。</p></div><div class="class-management"><div class="managed-class-list" id="managed-class-list">${classroomConfig.classes.map((item) => `<div class="managed-class ${item.status === "archived" ? "archived" : ""}"><div><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(activeCourses().find((course) => course.id === item.courseId)?.label || item.courseId)} · ${item.status === "archived" ? "已封存" : "下拉选项启用"}</small></div><div class="managed-class-actions"><button class="secondary" data-rename-class="${escapeHtml(item.id)}">修改选项</button><button class="text-button" data-toggle-class="${escapeHtml(item.id)}">${item.status === "archived" ? "恢复" : "封存"}</button></div></div>`).join("")}</div><form class="add-class-form" id="add-class-form"><select id="new-class-course" required>${activeCourses().map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</option>`).join("")}</select><input id="new-class-name" required maxlength="80" placeholder="例如 第4班" /><button class="primary" type="submit">新增下拉选项</button></form></div></section>
  `, "teacher");
  const update = () => updateTeacherTable(attempts);
  app.querySelector("#course-filter").addEventListener("change", update);
  app.querySelector("#class-filter").addEventListener("change", update);
  app.querySelector("#set-filter").addEventListener("change", update);
  app.querySelector("#date-from").addEventListener("change", update);
  app.querySelector("#date-to").addEventListener("change", update);
  app.querySelector("#student-search").addEventListener("input", update);
  app.querySelector("#refresh-records").addEventListener("click", () => renderTeacher());
  app.querySelector("#export-csv").addEventListener("click", () => downloadText("listening-practice-attempts.csv", attemptsToCsv(visibleAttempts), "text/csv;charset=utf-8"));
  app.querySelector("#download-template").addEventListener("click", () => downloadText("listening-practice-question-bank.example.json", JSON.stringify(seedQuestionSets, null, 2)));
  app.querySelector("#question-import").addEventListener("change", importQuestionBank);
  app.querySelector("#add-class-form").addEventListener("submit", addClass);
  app.querySelectorAll("[data-rename-class]").forEach((button) => button.addEventListener("click", renameClass));
  app.querySelectorAll("[data-toggle-class]").forEach((button) => button.addEventListener("click", toggleClass));
  app.querySelectorAll("[data-copy-set]").forEach((button) => button.addEventListener("click", async () => {
    const classId = button.closest(".publish-row")?.querySelector("[data-publish-class]")?.value || "";
    const link = getStudentLink(button.dataset.copySet, classId);
    try {
      await navigator.clipboard.writeText(link);
      button.textContent = "已复制";
      window.setTimeout(() => { button.textContent = "复制学生链接"; }, 1600);
    } catch { window.prompt("复制下面的学生入口链接：", link); }
  }));
  update();
}

function updateTeacherTable(attempts) {
  const courseValue = app.querySelector("#course-filter").value;
  const classValue = app.querySelector("#class-filter").value;
  const setValue = app.querySelector("#set-filter").value;
  const dateFrom = app.querySelector("#date-from").value;
  const dateTo = app.querySelector("#date-to").value;
  const studentSearch = app.querySelector("#student-search").value.trim().toLowerCase();
  const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
  const toTime = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;
  const filtered = attempts.filter((attempt) => {
    const submittedTime = new Date(attempt.submittedAt).getTime();
    return (courseValue === "all" || attempt.courseId === courseValue) && (classValue === "all" || attempt.classId === classValue) && (setValue === "all" || attempt.setId === setValue) && (!fromTime || submittedTime >= fromTime) && (!toTime || submittedTime <= toTime) && (!studentSearch || String(attempt.studentCode || "").toLowerCase().includes(studentSearch));
  });
  visibleAttempts = filtered;
  const setTitles = new Map(questionSets.map((set) => [set.id, set.title]));
  const classNames = new Map(activeClasses().map((item) => [item.id, item.label]));
  const students = new Set(filtered.map((attempt) => `${attempt.classId}-${attempt.studentCode}`));
  const classes = new Set(filtered.map((attempt) => attempt.classId));
  app.querySelector("#stats").innerHTML = `<div class="stat"><span>提交次数</span><strong>${filtered.length}</strong><small>保留全部尝试</small></div><div class="stat"><span>学生人数</span><strong>${students.size}</strong><small>按班级和编号统计</small></div><div class="stat"><span>班级数</span><strong>${classes.size}</strong><small>当前筛选范围</small></div>`;
  app.querySelector("#filter-count").textContent = filtered.length ? `显示 ${filtered.length} 次提交` : "暂无符合条件的记录";
  app.querySelector("#attempts-table").innerHTML = filtered.length ? `<div class="table-wrap"><table><thead><tr><th>时间</th><th>班级</th><th>学生编号</th><th>次数</th><th>题组</th><th>状态</th><th>详情</th></tr></thead><tbody>${filtered.map((attempt) => `<tr><td>${escapeHtml(formatDate(attempt.submittedAt))}</td><td><span class="class-badge">${escapeHtml(attempt.className || classNames.get(attempt.classId) || attempt.classId)}</span></td><td><strong>${escapeHtml(attempt.studentCode)}</strong></td><td>第 ${escapeHtml(attempt.attemptNumber || "—")} 次</td><td>${escapeHtml(setTitles.get(attempt.setId) || attempt.setId)}</td><td>${attempt.responses.some((item) => item.grading === "manual") ? `<span class="status pending">待查看</span>` : `<span class="status done">已评分</span>`}</td><td><details class="answer-details"><summary>查看作答</summary><div class="answer-list">${attempt.responses.map((response, index) => `<div><span>问题 ${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(response.answer || "（未填写）")}</strong>${response.isCorrect === null ? "" : `<small>${response.isCorrect ? "正确" : "需要复习"}</small>`}</div>`).join("")}</div></details></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty"><strong>还没有提交记录</strong><span>请让一位学生先完成一次练习。</span></div>`;
}

async function addClass(event) {
  event.preventDefault();
  const courseId = app.querySelector("#new-class-course").value;
  const label = app.querySelector("#new-class-name").value.trim();
  if (!label) return;
  classroomConfig.classes.push({ id: `${courseId}-class-${Date.now()}`, label, courseId, status: "active" });
  const mode = await saveClassroomConfig(classroomConfig);
  window.alert(`已新增班级${mode === "shared" ? "，共用配置已更新" : "，已保存于此设备"}。`);
  renderTeacher();
}

async function renameClass(event) {
  const classId = event.currentTarget.dataset.renameClass;
  const item = classroomConfig.classes.find((entry) => entry.id === classId);
  if (!item) return;
  const label = window.prompt("请输入新的班级下拉选项：", item.label)?.trim();
  if (!label || label === item.label) return;
  item.label = label;
  await saveClassroomConfig(classroomConfig);
  renderTeacher();
}

async function toggleClass(event) {
  const classId = event.currentTarget.dataset.toggleClass;
  const item = classroomConfig.classes.find((entry) => entry.id === classId);
  if (!item) return;
  item.status = item.status === "archived" ? "active" : "archived";
  await saveClassroomConfig(classroomConfig);
  renderTeacher();
}

async function importQuestionBank(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    if (!Array.isArray(parsed) || !parsed.every((set) => set.id && set.lessonKey && set.title && set.audio?.url && Array.isArray(set.questions) && set.questions.every((question) => question.id && question.prompt))) throw new Error("题库必须是题组数组，并包含完整的题组和题目字段。");
    questionSets = parsed;
    const mode = await saveQuestionBank(questionSets);
    window.alert(`已导入 ${questionSets.length} 个题组${mode === "shared" ? "，共享入口已更新" : "，已保存于此设备"}。`);
    renderTeacher();
  } catch (error) {
    window.alert(`导入失败：${error.message}`);
  }
}

async function bootstrap() {
  classroomConfig = await loadClassroomConfig(seedClassroomConfig);
  questionSets = await loadQuestionBank(seedQuestionSets);
  const initialRoute = window.location.hash.replace("#", "").split("?")[0];
  if (initialRoute === "student") renderStudentStart();
  else if (initialRoute === "teacher") renderTeacher();
  else renderHome();
}

bootstrap();
