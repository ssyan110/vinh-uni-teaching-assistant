(function startRandomizer(global, document) {
  "use strict";

  const Model = global.RandomizerModel;
  if (!Model) {
    throw new Error("找不到随机点名数据模型");
  }

  const STORAGE_KEY = "classroom-randomizer/current-session-v1";
  const HISTORY_KEY = "classroom-randomizer/history-v1";

  const elements = {
    cloudButton: document.getElementById("cloudButton"),
    startView: document.getElementById("startView"),
    appView: document.getElementById("appView"),
    sessionForm: document.getElementById("sessionForm"),
    classNameInput: document.getElementById("classNameInput"),
    dateInput: document.getElementById("dateInput"),
    textbookInput: document.getElementById("textbookInput"),
    lessonInput: document.getElementById("lessonInput"),
    taskModeInput: document.getElementById("taskModeInput"),
    taskTargetInput: document.getElementById("taskTargetInput"),
    rosterInput: document.getElementById("rosterInput"),
    rosterCount: document.getElementById("rosterCount"),
    rosterSource: document.getElementById("rosterSource"),
    rosterFile: document.getElementById("rosterFile"),
    resumeButton: document.getElementById("resumeButton"),
    startNote: document.getElementById("startNote"),
    sessionTitle: document.getElementById("sessionTitle"),
    sessionMeta: document.getElementById("sessionMeta"),
    newSessionButton: document.getElementById("newSessionButton"),
    presentationButton: document.getElementById("presentationButton"),
    roundNumber: document.getElementById("roundNumber"),
    progressLabel: document.getElementById("progressLabel"),
    poolLabel: document.getElementById("poolLabel"),
    progressBar: document.getElementById("progressBar"),
    drawStage: document.getElementById("drawStage"),
    drawTitle: document.getElementById("drawTitle"),
    emptyState: document.getElementById("emptyState"),
    pendingCard: document.getElementById("pendingCard"),
    pendingStatus: document.getElementById("pendingStatus"),
    studentNumber: document.getElementById("studentNumber"),
    studentName: document.getElementById("studentName"),
    pendingPrompt: document.getElementById("pendingPrompt"),
    timerReadout: document.getElementById("timerReadout"),
    timerValue: document.getElementById("timerValue"),
    activeTextbookSelect: document.getElementById("activeTextbookSelect"),
    activeLessonSelect: document.getElementById("activeLessonSelect"),
    taskTargetSelect: document.getElementById("taskTargetSelect"),
    timerDurationSelect: document.getElementById("timerDurationSelect"),
    timerToggleButton: document.getElementById("timerToggleButton"),
    timerResetButton: document.getElementById("timerResetButton"),
    timerTeacherLabel: document.getElementById("timerTeacherLabel"),
    drawButton: document.getElementById("drawButton"),
    quickResponseBar: document.getElementById("quickResponseBar"),
    quickResponseTitle: document.getElementById("quickResponseTitle"),
    quickResponseHint: document.getElementById("quickResponseHint"),
    responseCard: document.getElementById("responseCard"),
    responseTitle: document.getElementById("responseTitle"),
    responseStatusInput: document.getElementById("responseStatusInput"),
    answerContextInput: document.getElementById("answerContextInput"),
    noResponseReasonInput: document.getElementById("noResponseReasonInput"),
    noteInput: document.getElementById("noteInput"),
    recordNextButton: document.getElementById("recordNextButton"),
    recordCompleteButton: document.getElementById("recordCompleteButton"),
    noAnswerButton: document.getElementById("noAnswerButton"),
    undoButton: document.getElementById("undoButton"),
    nextRoundButton: document.getElementById("nextRoundButton"),
    modePill: document.getElementById("modePill"),
    answeredMetric: document.getElementById("answeredMetric"),
    pendingMetric: document.getElementById("pendingMetric"),
    notAnsweredMetric: document.getElementById("notAnsweredMetric"),
    sessionRecordSummary: document.getElementById("sessionRecordSummary"),
    eligibleLabel: document.getElementById("eligibleLabel"),
    studentSearchInput: document.getElementById("studentSearchInput"),
    studentStatusFilter: document.getElementById("studentStatusFilter"),
    studentList: document.getElementById("studentList"),
    attemptList: document.getElementById("attemptList"),
    lastSavedLabel: document.getElementById("lastSavedLabel"),
    exportCsvButton: document.getElementById("exportCsvButton"),
    exportXlsxButton: document.getElementById("exportXlsxButton"),
    exportSummaryCsvButton: document.getElementById("exportSummaryCsvButton"),
    exportSummaryXlsxButton: document.getElementById("exportSummaryXlsxButton"),
    backupButton: document.getElementById("backupButton"),
    restoreFile: document.getElementById("restoreFile"),
    helpButton: document.getElementById("helpButton"),
    fullscreenButton: document.getElementById("fullscreenButton"),
    recordsButton: document.getElementById("recordsButton"),
    historyButton: document.getElementById("historyButton"),
    helpDialog: document.getElementById("helpDialog"),
    closeHelpButton: document.getElementById("closeHelpButton"),
    cloudDialog: document.getElementById("cloudDialog"),
    closeCloudButton: document.getElementById("closeCloudButton"),
    cloudInvitePanel: document.getElementById("cloudInvitePanel"),
    cloudInviteForm: document.getElementById("cloudInviteForm"),
    cloudInvitePasswordInput: document.getElementById("cloudInvitePasswordInput"),
    cloudInvitePasswordConfirmInput: document.getElementById("cloudInvitePasswordConfirmInput"),
    cloudInviteButton: document.getElementById("cloudInviteButton"),
    cloudLoginForm: document.getElementById("cloudLoginForm"),
    cloudEmailInput: document.getElementById("cloudEmailInput"),
    cloudPasswordInput: document.getElementById("cloudPasswordInput"),
    cloudLoginButton: document.getElementById("cloudLoginButton"),
    cloudLogoutButton: document.getElementById("cloudLogoutButton"),
    cloudError: document.getElementById("cloudError"),
    cloudStatus: document.getElementById("cloudStatus"),
    historyDialog: document.getElementById("historyDialog"),
    closeHistoryButton: document.getElementById("closeHistoryButton"),
    historyList: document.getElementById("historyList"),
    recordsDialog: document.getElementById("recordsDialog"),
    closeRecordsButton: document.getElementById("closeRecordsButton"),
    recordsClassSelect: document.getElementById("recordsClassSelect"),
    recordsStudentSelect: document.getElementById("recordsStudentSelect"),
    recordsSummary: document.getElementById("recordsSummary"),
    recordsList: document.getElementById("recordsList"),
    toast: document.getElementById("toast")
  };

  let state = null;
  let studentSearchQuery = "";
  let studentStatusFilter = "all";
  let assistanceDraft = null;
  let taskPromptDraft = "";
  let noteDraft = "";
  let responseStatusDraft = "answered";
  let answerContextDraft = "unknown";
  let noResponseReasonDraft = "";
  let pendingDraftId = null;
  let taskDraftTarget = Model.DEFAULT_TASK_TARGET;
  let toastTimer = null;
  let lastRosterClassId = "";
  let studentDisplayWindow = null;
  let drawingRevealTimer = null;
  let isDrawing = false;
  let timerDuration = 20;
  let timerRemaining = 20;
  let timerRunning = false;
  let timerInterval = null;
  let cloudRosterByClass = {};
  let cloudSyncTimer = null;
  let cloudSyncInFlight = false;
  let cloudSyncRequested = false;
  let cloudSyncWarned = false;
  const builtInRosters = global.RandomizerRosters && global.RandomizerRosters.classes
    ? global.RandomizerRosters.classes
    : {};
  const DRAW_REVEAL_DURATION = 1350;

  function today() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function safeStorageGet(key) {
    try {
      return global.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function safeStorageSet(key, value) {
    try {
      global.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      return false;
    }
  }

  function parseStoredState(value) {
    if (!value) return null;
    try {
      return Model.importBackup(value);
    } catch (error) {
      return null;
    }
  }

  function storedCurrentState() {
    return parseStoredState(safeStorageGet(STORAGE_KEY));
  }

  function readHistory() {
    const raw = safeStorageGet(HISTORY_KEY);
    if (!raw) return [];
    try {
      const entries = JSON.parse(raw);
      if (!Array.isArray(entries)) return [];
      return entries.map((entry) => {
        try {
          const parsed = Model.importBackup(entry);
          parsed.undoStack = [];
          return parsed;
        } catch (error) {
          return null;
        }
      }).filter(Boolean);
    } catch (error) {
      return [];
    }
  }

  function saveHistory(entries) {
    const saved = safeStorageSet(HISTORY_KEY, JSON.stringify(entries));
    if (!saved) {
      showToast("历史数据空间不足，请立即下载目前课堂的完整备份档。", true);
    }
    return saved;
  }

  function syncHistoryEntry(sessionState) {
    if (!sessionState || !sessionState.session) return;
    const history = readHistory();
    const index = history.findIndex((entry) => entry.session.id === sessionState.session.id);
    if (index === -1) return;
    const archived = Model.importBackup(Model.exportBackup(sessionState));
    archived.undoStack = [];
    history[index] = archived;
    saveHistory(history);
  }

  function archiveState(sessionState) {
    if (!sessionState || !sessionState.session) return;
    const history = readHistory();
    if (history.some((entry) => entry.session.id === sessionState.session.id)) return;
    const archived = Model.importBackup(Model.exportBackup(sessionState));
    archived.undoStack = [];
    saveHistory([archived, ...history]);
  }

  function cloudReady() {
    return Boolean(
      global.RandomizerCloud
      && global.RandomizerCloud.isSignedIn()
      && !global.RandomizerCloud.hasInviteSession()
    );
  }

  function syncCloudState() {
    if (!state || !cloudReady()) return;
    if (cloudSyncInFlight) {
      cloudSyncRequested = true;
      return;
    }
    cloudSyncInFlight = true;
    global.RandomizerCloud.recordState({
      classId: state.session.className,
      session: state.session,
      currentRound: state.currentRound,
      excludedStudentIds: state.excludedStudentIds,
      roster: state.roster,
      attempts: state.attempts
    }).then((result) => {
      updateCloudStatus();
      if (result.pending > 0) {
        if (!cloudSyncWarned) {
          showToast("暂时无法连接；记录已放入待同步清单，连接恢复后会自动保存。", true);
          cloudSyncWarned = true;
        }
      } else {
        cloudSyncWarned = false;
      }
    }).catch(() => {
      if (!cloudSyncWarned) {
        showToast("暂时无法同步；请保持登录，记录会在连接恢复后自动保存。", true);
        cloudSyncWarned = true;
      }
    }).finally(() => {
      cloudSyncInFlight = false;
      if (cloudSyncRequested) {
        cloudSyncRequested = false;
        syncCloudState();
      }
    });
  }

  function persist() {
    if (!state) return;
    const saved = safeStorageSet(STORAGE_KEY, Model.exportBackup(state));
    if (!saved) {
      showToast("这台设备暂时无法自动保存，请下载完整备份文件。", true);
    }
    syncHistoryEntry(state);
    renderSavedTime();
    syncCloudState();
  }

  function showToast(message, warning) {
    elements.toast.textContent = message;
    elements.toast.classList.toggle("is-warning", Boolean(warning));
    elements.toast.classList.add("is-visible");
    if (toastTimer) global.clearTimeout(toastTimer);
    toastTimer = global.setTimeout(() => {
      elements.toast.classList.remove("is-visible");
      toastTimer = null;
    }, 2800);
  }

  function stopTimer() {
    if (timerInterval) global.clearInterval(timerInterval);
    timerInterval = null;
    timerRunning = false;
  }

  function renderTimerState() {
    const hasPending = Boolean(state && Model.pendingAttempt(state)) && !isDrawing;
    const enabled = hasPending && timerDuration > 0;
    const preserveTimerSpace = isDrawing && !elements.timerReadout.hidden;
    elements.timerReadout.hidden = !enabled && !preserveTimerSpace;
    elements.timerReadout.classList.toggle("is-drawing", preserveTimerSpace);
    elements.timerValue.textContent = String(timerRemaining);
    elements.timerReadout.classList.toggle("is-ending", enabled && timerRemaining <= 5);
    elements.timerToggleButton.disabled = !enabled;
    elements.timerResetButton.disabled = !enabled;
    elements.timerToggleButton.textContent = timerRunning
      ? "暂停"
      : timerRemaining === 0 ? "重新开始" : "继续";
    elements.timerTeacherLabel.textContent = timerDuration === 0
      ? "这次不计时"
      : !hasPending
        ? "抽到学生后自动开始"
        : timerRemaining === 0
          ? "时间到；结果由老师决定"
          : timerRunning
            ? `剩余 ${timerRemaining} 秒`
            : `已暂停在 ${timerRemaining} 秒`;
    renderStudentDisplay();
  }

  function startTimer() {
    if (!state || !Model.pendingAttempt(state) || timerDuration <= 0 || isDrawing) return;
    if (timerRemaining <= 0) timerRemaining = timerDuration;
    stopTimer();
    timerRunning = true;
    timerInterval = global.setInterval(() => {
      timerRemaining = Math.max(0, timerRemaining - 1);
      if (timerRemaining === 0) stopTimer();
      renderTimerState();
    }, 1000);
    renderTimerState();
  }

  function resetTimer(autostart) {
    stopTimer();
    timerRemaining = timerDuration;
    if (autostart && timerDuration > 0) startTimer();
    else renderTimerState();
  }

  function toggleTimer() {
    if (timerRunning) {
      stopTimer();
      renderTimerState();
    } else {
      startTimer();
    }
  }

  function studentDisplayMarkup() {
    return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>华语课堂抽问｜学生画面</title>
  <style>
    :root{font-family:"Times New Roman",KaiTi,"STKaiti","BiauKai",serif;color:#17324d;background:#fff}
    *{box-sizing:border-box}body{min-height:100vh;margin:0;background:linear-gradient(145deg,#f8fbfb 0%,#eef6f6 100%)}
    main{display:grid;min-height:100vh;grid-template-rows:auto 1fr auto;padding:clamp(24px,4vw,56px)}
    header{display:flex;justify-content:space-between;gap:24px;color:#34536b;font-size:clamp(18px,2vw,28px)}
    header strong{color:#21645f}.stage{display:grid;place-items:center;text-align:center}.seat{color:#21645f;font-size:clamp(24px,3vw,42px);font-weight:700}
    h1{max-width:1200px;margin:12px 0;color:#17324d;font-size:clamp(70px,12vw,170px);line-height:1.04;letter-spacing:.01em}
    .prompt{color:#34536b;font-size:clamp(25px,3vw,44px)}.timer{display:inline-flex;align-items:baseline;gap:10px;margin-top:30px;padding:12px 24px;border:2px solid #b6d4d1;border-radius:999px;color:#21645f;background:#fff;font-size:clamp(20px,2vw,30px)}
    .timer strong{font-family:"Times New Roman",serif;font-size:clamp(44px,6vw,80px);line-height:1}.timer.ending{color:#9a4d3a;border-color:#edb7a8;background:#fff0ec}
    footer{display:flex;justify-content:space-between;color:#6b7d8c;font-size:clamp(16px,1.7vw,24px)}
    .draw-animation{position:relative;display:none;width:min(38vw,300px);height:min(22vw,156px);margin:0 auto 2px}
    .rolling .draw-animation{display:block}
    .draw-card{position:absolute;top:18px;left:50%;display:grid;width:clamp(48px,6vw,72px);height:clamp(64px,9vw,96px);place-items:center;border:2px solid #b8d8d1;border-radius:16px;color:#21645f;background:#e7f7f0;box-shadow:0 12px 20px rgba(24,40,48,.14);font-family:KaiTi,"STKaiti","BiauKai",serif;font-size:clamp(26px,4vw,42px);font-weight:700;transform-origin:50% 100%}
    .draw-card-left{margin-left:clamp(-100px,-8vw,-66px);color:#a6533c;background:#fff0ec;animation:shuffle-left 1240ms cubic-bezier(.4,0,.2,1) both}
    .draw-card-center{z-index:2;margin-left:clamp(-36px,-3vw,-24px);border-color:#a9cbe2;color:#356080;background:#eef5f7;animation:shuffle-center 1240ms cubic-bezier(.4,0,.2,1) both}
    .draw-card-right{margin-left:clamp(28px,2.5vw,38px);border-color:#d9c5e8;color:#70528e;background:#f5effb;animation:shuffle-right 1240ms cubic-bezier(.4,0,.2,1) both}
    .draw-spark{position:absolute;color:#d7795c;font-size:clamp(20px,3vw,32px);font-style:normal;opacity:0;animation:spark-pop 1240ms ease-out both}.draw-spark-one{top:5px;left:12%}.draw-spark-two{right:12%;bottom:12px;color:#109b76;animation-delay:180ms}
    .rolling h1{color:#2c817b}.rolling .prompt{color:#2c817b}
    .complete h1{color:#2d7a57}.complete .stage:before{content:"✦  ✦  ✦";position:absolute;margin-top:-28vh;color:#d9a441;font-size:clamp(26px,4vw,54px);letter-spacing:.8em}
    [hidden]{display:none!important}
    @keyframes shuffle-left{0%{opacity:.55;transform:translate(0,14px) rotate(0) scale(.86)}22%{opacity:1;transform:translate(-52px,0) rotate(-18deg) scale(1)}46%{transform:translate(45px,-9px) rotate(20deg)}68%{transform:translate(-34px,5px) rotate(-15deg)}84%{transform:translate(-13px,4px) rotate(-8deg)}100%{opacity:1;transform:translate(-7px,4px) rotate(-6deg)}}
    @keyframes shuffle-center{0%{opacity:.7;transform:translate(0,12px) rotate(0) scale(.8)}24%{opacity:1;transform:translate(0,-14px) rotate(-4deg) scale(1.05)}48%{transform:translate(16px,-1px) rotate(8deg) scale(1)}72%{transform:translate(-13px,-8px) rotate(-6deg) scale(1.03)}100%{opacity:1;transform:translate(0,0) rotate(0) scale(1.05)}}
    @keyframes shuffle-right{0%{opacity:.55;transform:translate(0,14px) rotate(0) scale(.86)}22%{opacity:1;transform:translate(52px,0) rotate(18deg) scale(1)}46%{transform:translate(-45px,-9px) rotate(-20deg)}68%{transform:translate(34px,5px) rotate(15deg)}84%{transform:translate(13px,4px) rotate(8deg)}100%{opacity:1;transform:translate(7px,4px) rotate(6deg)}}
    @keyframes spark-pop{0%,100%{opacity:0;transform:scale(.45) rotate(-20deg)}42%{opacity:1;transform:scale(1) rotate(8deg)}68%{opacity:.25;transform:scale(.8) rotate(20deg)}}
    @media (prefers-reduced-motion:reduce){.draw-card,.draw-spark{animation:none}.draw-card,.draw-spark{opacity:1;transform:none}}
  </style>
</head>
<body>
  <main id="studentDisplayRoot">
    <header><strong id="displayClass">—</strong><span id="displayContext">—</span></header>
    <section class="stage">
      <div>
        <div class="seat" id="displaySeat"></div>
        <div class="draw-animation" aria-hidden="true">
          <span class="draw-card draw-card-left">抽</span>
          <span class="draw-card draw-card-center">问</span>
          <span class="draw-card draw-card-right">答</span>
          <i class="draw-spark draw-spark-one">✦</i>
          <i class="draw-spark draw-spark-two">✦</i>
        </div>
        <h1 id="displayName">准备好了吗？</h1>
        <p class="prompt" id="displayPrompt">请等老师抽问</p>
        <div class="timer" id="displayTimer" hidden><span>思考时间</span><strong id="displayTimerValue">20</strong><span>秒</span></div>
      </div>
    </section>
    <footer><span id="displayRound">第 1 轮</span><span id="displayProgress">本轮完成 0／0</span></footer>
  </main>
</body>
</html>`;
  }

  function openStudentDisplay() {
    if (studentDisplayWindow && !studentDisplayWindow.closed) {
      studentDisplayWindow.focus();
      renderStudentDisplay();
      return;
    }
    studentDisplayWindow = global.open("", "classroom-randomizer-student-display", "popup=yes,width=1280,height=720");
    if (!studentDisplayWindow) {
      showToast("浏览器阻止了学生画面，请允许此页面打开新窗口。", true);
      return;
    }
    studentDisplayWindow.document.open();
    studentDisplayWindow.document.write(studentDisplayMarkup());
    studentDisplayWindow.document.close();
    studentDisplayWindow.focus();
    renderStudentDisplay();
    renderApp();
  }

  function renderStudentDisplay() {
    if (!studentDisplayWindow || studentDisplayWindow.closed) {
      studentDisplayWindow = null;
      return;
    }
    try {
      const doc = studentDisplayWindow.document;
      const root = doc.getElementById("studentDisplayRoot");
      if (!root || !state) return;
      const progress = Model.getProgress(state);
      const attempt = Model.pendingAttempt(state);
      const textbook = Model.getTextbook(state.session.textbookId);
      const lessonNumber = Model.getLessonNumber(state.session.lessonId);
      doc.getElementById("displayClass").textContent = state.session.className || "华语听说课";
      doc.getElementById("displayContext").textContent = `${textbook.label}｜第 ${lessonNumber} 课`;
      doc.getElementById("displayRound").textContent = `第 ${progress.roundNumber} 轮`;
      doc.getElementById("displayProgress").textContent = `本轮完成 ${progress.answeredCount}／${progress.eligibleCount}`;
      root.classList.toggle("rolling", isDrawing);
      root.classList.toggle("complete", progress.roundComplete && !attempt && !isDrawing);
      const timer = doc.getElementById("displayTimer");
      timer.hidden = true;
      timer.classList.remove("ending");
      if (isDrawing) {
        doc.getElementById("displaySeat").textContent = "";
        doc.getElementById("displayName").textContent = "下一位同学";
        doc.getElementById("displayPrompt").textContent = "卡片转一转，马上揭晓";
      } else if (attempt) {
        const student = attempt.studentSnapshot || Model.getStudent(state, attempt.studentId) || {};
        const target = Model.TASK_TARGETS[attempt.taskTarget] || "完整回答这一题";
        doc.getElementById("displaySeat").textContent = student.seatNumber ? `座号 ${student.seatNumber}` : "";
        doc.getElementById("displayName").textContent = student.name || "这位同学";
        doc.getElementById("displayPrompt").textContent = target;
        if (timerDuration > 0) {
          timer.hidden = false;
          timer.classList.toggle("ending", timerRemaining <= 5);
          doc.getElementById("displayTimerValue").textContent = String(timerRemaining);
        }
      } else if (progress.roundComplete) {
        doc.getElementById("displaySeat").textContent = "";
        doc.getElementById("displayName").textContent = "本轮完成！";
        doc.getElementById("displayPrompt").textContent = "大家都完成回答了";
      } else {
        doc.getElementById("displaySeat").textContent = "";
        doc.getElementById("displayName").textContent = "准备好了吗？";
        doc.getElementById("displayPrompt").textContent = "请等老师抽问";
      }
    } catch (error) {
      studentDisplayWindow = null;
    }
  }

  function setView(viewName) {
    const isStart = viewName === "start";
    elements.startView.hidden = !isStart;
    elements.appView.hidden = isStart;
    elements.startView.classList.toggle("is-active", isStart);
    elements.appView.classList.toggle("is-active", !isStart);
  }

  function addOption(select, value, label, disabled) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    option.disabled = Boolean(disabled);
    select.appendChild(option);
  }

  function populateClassOptions(selectedValue) {
    const selected = selectedValue || "";
    elements.classNameInput.replaceChildren();
    addOption(elements.classNameInput, "", "请选择班级", true);
    Model.CLASS_OPTIONS.forEach((item) => addOption(elements.classNameInput, item.id, item.label));
    elements.classNameInput.value = Model.CLASS_OPTIONS.some((item) => item.id === selected) ? selected : "";
    lastRosterClassId = elements.classNameInput.value;
  }

  function updateLessonOptions(preferredLessonId) {
    const textbook = Model.getTextbook(elements.textbookInput.value || Model.DEFAULT_TEXTBOOK_ID);
    const selected = preferredLessonId || elements.lessonInput.value || Model.DEFAULT_LESSON_ID;
    const normalized = Model.normalizeLessonId(selected, textbook.id);
    elements.lessonInput.replaceChildren();
    for (let number = 1; number <= textbook.lessonCount; number += 1) {
      const lessonId = `lesson-${String(number).padStart(2, "0")}`;
      addOption(elements.lessonInput, lessonId, `第 ${number} 课`);
    }
    elements.lessonInput.value = normalized;
  }

  function populateTextbookOptions(selectedTextbookId, selectedLessonId) {
    const selected = selectedTextbookId || Model.DEFAULT_TEXTBOOK_ID;
    elements.textbookInput.replaceChildren();
    Model.TEXTBOOK_OPTIONS.forEach((item) => addOption(elements.textbookInput, item.id, item.label));
    elements.textbookInput.value = Model.TEXTBOOK_OPTIONS.some((item) => item.id === selected)
      ? selected
      : Model.DEFAULT_TEXTBOOK_ID;
    updateLessonOptions(selectedLessonId);
  }

  function populateActiveContextSelectors() {
    if (!state) return;
    elements.activeTextbookSelect.replaceChildren();
    Model.TEXTBOOK_OPTIONS.forEach((item) => addOption(elements.activeTextbookSelect, item.id, item.label));
    elements.activeTextbookSelect.value = state.session.textbookId;
    const textbook = Model.getTextbook(state.session.textbookId);
    elements.activeLessonSelect.replaceChildren();
    for (let number = 1; number <= textbook.lessonCount; number += 1) {
      const lessonId = `lesson-${String(number).padStart(2, "0")}`;
      addOption(elements.activeLessonSelect, lessonId, `第 ${number} 课`);
    }
    elements.activeLessonSelect.value = Model.normalizeLessonId(state.session.lessonId, textbook.id);
  }

  function changeActiveContext() {
    if (!state) return;
    if (Model.pendingAttempt(state) || isDrawing) {
      populateActiveContextSelectors();
      showToast("请先完成目前这位学生的回答，再切换教材或课次。", true);
      return;
    }
    state = Model.setSessionContext(
      state,
      elements.activeTextbookSelect.value,
      elements.activeLessonSelect.value
    );
    persist();
    renderApp();
    showToast("后续抽问会记录在新的教材与课次。之前保存的回答不受影响。");
  }

  function populateSelectors() {
    populateClassOptions();
    populateTextbookOptions(Model.DEFAULT_TEXTBOOK_ID, Model.DEFAULT_LESSON_ID);
  }

  function loadDefaultStartValues() {
    elements.dateInput.value = today();
    elements.taskModeInput.value = Model.DEFAULT_TASK_MODE;
    elements.taskTargetInput.value = Model.DEFAULT_TASK_TARGET;
    populateClassOptions();
    populateTextbookOptions(Model.DEFAULT_TEXTBOOK_ID, Model.DEFAULT_LESSON_ID);
    elements.rosterInput.value = "";
    elements.rosterSource.textContent = "选择班级后，学生名单会自动加载。";
    updateRosterCount();
  }

  function prepareStartFromState() {
    const current = state || storedCurrentState();
    if (!current) {
      loadDefaultStartValues();
      return;
    }
    populateClassOptions(current.session.className || "");
    elements.dateInput.value = current.session.date || today();
    elements.taskModeInput.value = current.session.taskMode || Model.DEFAULT_TASK_MODE;
    elements.taskTargetInput.value = current.session.taskTarget || Model.DEFAULT_TASK_TARGET;
    populateTextbookOptions(current.session.textbookId, current.session.lessonId);
    elements.rosterInput.value = rosterToText(current.roster);
    elements.rosterSource.textContent = "已加载这堂课创建时的名单；如需调整，可直接编辑。";
    updateRosterCount();
  }

  function rosterToText(students) {
    const rows = ["学号,学生姓名,座号"];
    students.forEach((student) => {
      rows.push([student.studentCode || student.id, student.name, student.seatNumber].join(","));
    });
    return rows.join("\n");
  }

  function rosterForClass(classId) {
    if (Array.isArray(cloudRosterByClass[classId])) {
      return cloudRosterByClass[classId].map((student) => ({ ...student }));
    }
    const roster = builtInRosters[classId];
    return Array.isArray(roster) ? roster.map((student) => ({ ...student })) : [];
  }

  async function loadCloudRoster(classId) {
    if (!global.RandomizerCloud || !global.RandomizerCloud.isSignedIn()) {
      elements.rosterSource.textContent = "请先登录教师账号，系统才会加载这个班级的名单。";
      elements.rosterInput.value = "";
      updateRosterCount();
      return false;
    }
    elements.rosterSource.textContent = "正在从教学数据库加载班级名单…";
    try {
      const result = await global.RandomizerCloud.fetchClassRoster(classId);
      cloudRosterByClass[classId] = result.roster;
      if (elements.classNameInput.value === classId) {
        elements.rosterInput.value = rosterToText(result.roster);
        elements.rosterSource.textContent = `已从教学数据库加载 ${classId} 名册；课堂记录会同步保存。`;
        updateRosterCount();
      }
      return true;
    } catch (error) {
      elements.rosterSource.textContent = "尚未加载名单；请先在学生管理系统导入这个班级。";
      elements.rosterInput.value = "";
      updateRosterCount();
      showToast(error.message || "无法加载班级名单", true);
      return false;
    }
  }

  function loadBuiltInRoster(classId) {
    const roster = rosterForClass(classId);
    if (roster.length === 0) {
      void loadCloudRoster(classId);
      elements.rosterInput.value = "";
      updateRosterCount();
      return false;
    }
    elements.rosterInput.value = rosterToText(roster);
    elements.rosterSource.textContent = `已加载 ${classId} 班级名册；如需调整，可直接编辑。`;
    updateRosterCount();
    return true;
  }

  function updateRosterCount() {
    try {
      const students = Model.parseRosterText(elements.rosterInput.value);
      elements.rosterCount.textContent = students.length
        ? `${students.length} 位学生`
        : elements.classNameInput.value ? "此班尚未加载名单" : "请先选择班级";
      elements.rosterCount.classList.toggle("has-value", students.length > 0);
    } catch (error) {
      elements.rosterCount.textContent = "请检查名单格式";
      elements.rosterCount.classList.remove("has-value");
    }
  }

  function handleClassChange() {
    const nextClassId = elements.classNameInput.value;
    const hasCurrentRoster = elements.rosterInput.value.trim() !== "";
    if (lastRosterClassId && nextClassId !== lastRosterClassId && hasCurrentRoster) {
        const confirmed = global.confirm("切换班级会加载另一班的名单，取代目前名单。要继续吗？");
      if (!confirmed) {
        elements.classNameInput.value = lastRosterClassId;
        return;
      }
    }
    lastRosterClassId = nextClassId;
    loadBuiltInRoster(nextClassId);
  }

  function updateCloudStatus() {
    const signedIn = Boolean(global.RandomizerCloud && global.RandomizerCloud.isSignedIn());
    const invitePending = Boolean(global.RandomizerCloud && global.RandomizerCloud.hasInviteSession());
    const pending = global.RandomizerCloud && typeof global.RandomizerCloud.pendingCount === "function"
      ? global.RandomizerCloud.pendingCount()
      : 0;
    elements.cloudButton.textContent = signedIn ? "已连接同步" : "连接同步";
    elements.cloudButton.classList.toggle("is-connected", signedIn);
    elements.cloudLogoutButton.hidden = !signedIn;
    elements.cloudInvitePanel.hidden = !invitePending;
    elements.cloudLoginForm.hidden = signedIn || invitePending;
    elements.cloudLoginForm.querySelectorAll("input").forEach((input) => { input.disabled = signedIn || invitePending; });
    elements.cloudLoginButton.hidden = signedIn || invitePending;
    elements.cloudStatus.textContent = signedIn
      ? (invitePending
        ? "邀请已确认，请先设置密码。"
        : `已连接：${global.RandomizerCloud.currentUserEmail()}。课堂与每次抽问记录会自动保存${pending ? `；待同步 ${pending} 笔` : ""}。`)
      : "尚未连接。开始课堂前请先登录，才能将记录保存到教学数据库。";
  }

  function openCloudDialog() {
    elements.cloudError.hidden = true;
    elements.cloudError.textContent = "";
    updateCloudStatus();
    const redirectError = global.RandomizerCloud && global.RandomizerCloud.getAuthRedirectError();
    if (redirectError) {
      elements.cloudError.hidden = false;
      elements.cloudError.textContent = `登录链接无效或已过期：${redirectError} 请回 Supabase 重新发送邀请。`;
    }
    openDialog(elements.cloudDialog);
  }

  async function flushCloudQueue() {
    if (!global.RandomizerCloud) return;
    try {
      const result = await global.RandomizerCloud.flushQueue();
      updateCloudStatus();
      if (result.sent > 0) showToast(`已同步 ${result.sent} 笔课堂数据${result.pending ? `，还有 ${result.pending} 笔待同步` : ""}`);
    } catch (error) {
      // Queue remains on the device and will retry on the next action or reload.
    }
  }

  async function signInCloud(event) {
    event.preventDefault();
    elements.cloudError.hidden = true;
    elements.cloudLoginButton.disabled = true;
    try {
      await global.RandomizerCloud.signIn(elements.cloudEmailInput.value, elements.cloudPasswordInput.value);
      elements.cloudPasswordInput.value = "";
      cloudRosterByClass = {};
      cloudSyncWarned = false;
      updateCloudStatus();
      closeDialog(elements.cloudDialog);
      showToast("已连接教学数据库；选择班级后会加载名单。");
      if (elements.classNameInput.value) void loadCloudRoster(elements.classNameInput.value);
      void flushCloudQueue();
      syncCloudState();
    } catch (error) {
      elements.cloudError.hidden = false;
      elements.cloudError.textContent = error.message || "登录失败。";
    } finally {
      elements.cloudLoginButton.disabled = false;
    }
  }

  async function completeCloudInvite(event) {
    event.preventDefault();
    elements.cloudError.hidden = true;
    const password = elements.cloudInvitePasswordInput.value;
    if (password !== elements.cloudInvitePasswordConfirmInput.value) {
      elements.cloudError.hidden = false;
      elements.cloudError.textContent = "两次输入的密码不一致。";
      return;
    }
    elements.cloudInviteButton.disabled = true;
    try {
      await global.RandomizerCloud.completeInvite(password);
      elements.cloudInvitePasswordInput.value = "";
      elements.cloudInvitePasswordConfirmInput.value = "";
      updateCloudStatus();
      closeDialog(elements.cloudDialog);
      showToast("教师账号已完成；选择班级后会加载名单。 ");
      if (elements.classNameInput.value) void loadCloudRoster(elements.classNameInput.value);
      void flushCloudQueue();
      syncCloudState();
    } catch (error) {
      elements.cloudError.hidden = false;
      elements.cloudError.textContent = error.message || "密码设置失败，请重新打开最新邀请信。";
    } finally {
      elements.cloudInviteButton.disabled = false;
    }
  }

  function signOutCloud() {
    global.RandomizerCloud.signOut();
    cloudRosterByClass = {};
    elements.rosterInput.value = "";
    updateRosterCount();
    updateCloudStatus();
    closeDialog(elements.cloudDialog);
    showToast("已退出登录；这台设备的离线备份仍然保留。");
  }

  function startNewSession(event) {
    event.preventDefault();
    if (!cloudReady()) {
      openCloudDialog();
      showToast("请先登录教师账号，课堂记录才能保存到教学数据库。", true);
      return;
    }
    if (!elements.classNameInput.value) {
      showToast("请先选择班级", true);
      return;
    }
    let roster;
    try {
      roster = Model.parseRosterText(elements.rosterInput.value);
      if (roster.length === 0) throw new Error("请先加入学生名单");
    } catch (error) {
      showToast(error.message || "名册格式需要检查", true);
      return;
    }

    if (state && !global.confirm("开始下一堂课前，上一堂课会保留在历史记录。要继续吗？")) {
      return;
    }
    if (state) archiveState(state);

    state = Model.createSession({
      className: elements.classNameInput.value,
      date: elements.dateInput.value,
      textbookId: elements.textbookInput.value,
      lessonId: elements.lessonInput.value,
      taskMode: elements.taskModeInput.value,
      taskTarget: elements.taskTargetInput.value,
      roster
    });
    resetTimer(false);
    taskDraftTarget = state.session.taskTarget || Model.DEFAULT_TASK_TARGET;
    resetResponseDraft();
    persist();
    setView("app");
    renderApp();
    showToast("本堂课已开始；记录会自动保存到教学数据库");
  }

  function resumeSession() {
    if (!cloudReady()) {
      openCloudDialog();
      showToast("请先登录教师账号，才能继续保存这堂课。", true);
      return;
    }
    const saved = storedCurrentState();
    if (!saved) {
      showToast("目前没有可以回到的课堂记录", true);
      return;
    }
    state = saved;
    resetTimer(false);
    taskDraftTarget = state.session.taskTarget || Model.DEFAULT_TASK_TARGET;
    resetResponseDraft();
    setView("app");
    renderApp();
    showToast("已回到上次课堂");
  }

  function resetResponseDraft() {
    noteDraft = "";
    responseStatusDraft = "answered";
    answerContextDraft = "unknown";
    noResponseReasonDraft = "";
    pendingDraftId = null;
  }

  function handleDraw() {
    if (!state || isDrawing) return;
    try {
      const pool = Model.getSelectablePool(state);
      if (!Model.pendingAttempt(state) && pool.length === 1 && pool[0].id === Model.getLastParticipantId(state)) {
        if (!global.confirm(`目前只剩 ${pool[0].name} 可以抽问，刚才也是这位同学。是否再次抽问？取消可先安排其他活动。`)) return;
      }
      state = Model.drawStudent(state, {
        taskMode: state.session.taskMode || Model.DEFAULT_TASK_MODE,
        taskTarget: taskDraftTarget
      });
      stopTimer();
      timerRemaining = timerDuration;
      isDrawing = true;
      resetResponseDraft();
      persist();
      renderApp();
      if (drawingRevealTimer) global.clearTimeout(drawingRevealTimer);
      drawingRevealTimer = global.setTimeout(() => {
        isDrawing = false;
        drawingRevealTimer = null;
        renderApp();
        if (timerDuration > 0) startTimer();
      }, DRAW_REVEAL_DURATION);
    } catch (error) {
      showToast(error.message, true);
    }
  }

  function handleResponse(drawNext) {
    try {
      const pending = Model.pendingAttempt(state);
      if (!pending) throw new Error("目前没有正在回答的学生");
      state = Model.recordResponse(state, {
        note: noteDraft,
        taskPrompt: taskPromptDraft,
        responseStatus: responseStatusDraft,
        answerContext: answerContextDraft,
        assistance: assistanceDraft
      });
      stopTimer();
      timerRemaining = timerDuration;
      resetResponseDraft();
      persist();
      const progress = Model.getProgress(state);
      if (drawNext && !progress.roundComplete && !progress.noEligibleStudents) {
        showToast("回答已记录，正在抽下一位。");
        handleDraw();
      } else {
        renderApp();
        showToast("回答已记录");
      }
    } catch (error) {
      showToast(error.message, true);
    }
  }

  function handleNoAnswer() {
    try {
      if (!noResponseReasonDraft) {
        showToast("请先选择未回答原因", true);
        elements.noResponseReasonInput.focus();
        return;
      }
      state = Model.returnPending(state, {
        note: noteDraft,
        taskPrompt: taskPromptDraft,
        noResponseReason: noResponseReasonDraft,
        answerContext: answerContextDraft
      });
      stopTimer();
      timerRemaining = timerDuration;
      resetResponseDraft();
      persist();
      renderApp();
      showToast("已记录未回答；这位同学仍会留在可抽名单中");
    } catch (error) {
      showToast(error.message, true);
    }
  }

  function handleUndo() {
    try {
      stopTimer();
      isDrawing = false;
      if (drawingRevealTimer) global.clearTimeout(drawingRevealTimer);
      drawingRevealTimer = null;
      state = Model.undoLastAction(state);
      resetResponseDraft();
      persist();
      renderApp();
      showToast("已返回上一步");
    } catch (error) {
      showToast(error.message, true);
    }
  }

  function handleNextRound() {
    try {
      resetTimer(false);
      state = Model.startNextRound(state);
      resetResponseDraft();
      persist();
      renderApp();
      showToast(`第 ${state.currentRound.number} 轮抽问开始`);
    } catch (error) {
      showToast(error.message, true);
    }
  }

  function formatTime(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  }

  function renderSavedTime() {
    if (state && state.session) {
      elements.lastSavedLabel.textContent = `最近保存 ${formatTime(state.session.updatedAt)}`;
    }
  }

  function ensurePendingDraft(attempt) {
    if (!attempt) {
      pendingDraftId = null;
      return;
    }
    if (pendingDraftId === attempt.id) return;
    pendingDraftId = attempt.id;
    assistanceDraft = attempt.assistance ?? null;
    taskPromptDraft = attempt.taskPrompt || (attempt.outcome === "pending" ? state.session.activeQuestion?.prompt || "" : "");
    noteDraft = attempt.note || "";
    responseStatusDraft = ["partial", "peer_supported"].includes(attempt.responseStatus)
      ? attempt.responseStatus
      : "answered";
    answerContextDraft = ["prepared", "unprepared", "unknown"].includes(attempt.answerContext)
      ? attempt.answerContext
      : "unknown";
    noResponseReasonDraft = attempt.noResponseReason || "";
  }

  function renderResponseForm(attempt) {
    ensurePendingDraft(attempt);
    const isVolunteer = attempt.selectionMethod === "volunteer";
    const responseTitle = isVolunteer ? "记录自愿发言" : "记录这次回答";
    elements.responseTitle.textContent = responseTitle;
    elements.quickResponseTitle.textContent = responseTitle;
    elements.quickResponseHint.textContent = isVolunteer
      ? "记录后会回到抽选区，继续课堂活动。"
      : "记录后会自动回到抽选区，显示下一位学生。";
    elements.quickResponseBar.classList.remove("is-drawing");
    elements.responseCard.classList.remove("is-drawing");
    [elements.recordNextButton, elements.recordCompleteButton, elements.noAnswerButton].forEach((button) => {
      button.disabled = false;
    });
    elements.recordNextButton.textContent = attempt.selectionMethod !== "volunteer" && Model.getProgress(state).poolCount <= 1
      ? "记录回答并完成本轮"
      : "记录回答并抽下一位";
    elements.recordNextButton.hidden = false;
    elements.recordCompleteButton.hidden = false;
    elements.noAnswerButton.hidden = false;
    elements.noResponseReasonInput.closest("label").hidden = false;
    document.getElementById("assistanceInput").value = assistanceDraft === null ? "unknown" : assistanceDraft ? "yes" : "no";
    document.getElementById("taskPromptInput").value = taskPromptDraft;
    elements.noteInput.value = noteDraft;
    elements.responseStatusInput.value = responseStatusDraft;
    elements.answerContextInput.value = answerContextDraft;
    elements.noResponseReasonInput.value = noResponseReasonDraft;
  }

  function renderEmptyState(progress) {
    const title = elements.emptyState.querySelector("p");
    const detail = elements.emptyState.querySelector("span:last-child");
    const symbol = elements.emptyState.querySelector(".draw-symbol");
    elements.emptyState.classList.toggle("is-complete", progress.roundComplete);
    if (progress.roundComplete) {
      symbol.textContent = "✓";
      title.textContent = "本轮完成";
      detail.textContent = "需要继续时，按下「开始下一轮抽问」";
    } else if (progress.noEligibleStudents) {
      symbol.textContent = "—";
      title.textContent = "目前没有可抽问的学生";
      detail.textContent = "请检查本堂抽问设置，或开始下一堂课";
    } else {
      symbol.textContent = "?";
      title.textContent = "提问后，按下「抽一位」";
      detail.textContent = "还没有回答的同学，仍会留在名单里";
    }
  }

  function renderMainStage(progress) {
    const pending = Model.pendingAttempt(state);
    const attempt = pending;
    const attemptTextbookId = attempt && attempt.textbookId
      ? attempt.textbookId
      : state.session.textbookId;
    const attemptLessonId = attempt && attempt.lessonId
      ? attempt.lessonId
      : state.session.lessonId;
    const lessonNumber = Model.getLessonNumber(attemptLessonId);
    const preserveResponseLayout = isDrawing && !elements.responseCard.hidden;
    elements.drawTitle.textContent = isDrawing
      ? "正在抽选"
      : attempt
        ? attempt.selectionMethod === "volunteer" ? "记录自愿发言" : "等待学生回答"
        : "提问后，抽一位学生";
    renderEmptyState(progress);
    elements.emptyState.hidden = Boolean(attempt);
    elements.pendingCard.hidden = !attempt;
    elements.pendingCard.classList.toggle("is-drawing", isDrawing);
    elements.quickResponseBar.hidden = !attempt || (isDrawing && !preserveResponseLayout);
    elements.responseCard.hidden = !attempt || (isDrawing && !preserveResponseLayout);
    elements.quickResponseBar.classList.toggle("is-drawing", isDrawing && preserveResponseLayout);
    elements.responseCard.classList.toggle("is-drawing", isDrawing && preserveResponseLayout);
    elements.drawButton.disabled = Boolean(attempt) || isDrawing || progress.roundComplete || progress.noEligibleStudents;
    elements.drawButton.classList.toggle("is-disabled", elements.drawButton.disabled);
    elements.drawButton.querySelector("span:last-of-type").textContent = progress.roundComplete ? "本轮完成" : "抽一位";
    elements.nextRoundButton.hidden = !progress.roundComplete;

    if (!attempt) {
      ensurePendingDraft(null);
      elements.pendingStatus.textContent = "等待回答";
      renderTimerState();
      return;
    }

    if (isDrawing) {
      if (preserveResponseLayout) {
        [elements.recordNextButton, elements.recordCompleteButton, elements.noAnswerButton].forEach((button) => {
          button.disabled = true;
        });
      }
      elements.studentNumber.textContent = "座号 —";
      elements.studentName.textContent = "下一位同学";
      elements.pendingStatus.textContent = "正在洗牌";
      renderTimerState();
      return;
    }

    const student = attempt.studentSnapshot || Model.getStudent(state, attempt.studentId) || {};
    elements.studentNumber.textContent = student.seatNumber ? `座号 ${student.seatNumber}` : (student.studentCode || "这位同学");
    elements.studentName.textContent = student.name || "未填写姓名";
    elements.pendingStatus.textContent = attempt.selectionMethod === "volunteer" ? "自愿发言" : "等待回答";
    const target = Model.TASK_TARGETS[attempt.taskTarget] || "这题回答";
    elements.pendingPrompt.textContent = `${Model.formatLessonLabel(attemptTextbookId, attemptLessonId)}｜${target}。请先让学生回答，再记录回答情况。`;
    renderResponseForm(attempt);
    renderTimerState();
  }

  function attemptStudent(attempt) {
    return attempt.studentSnapshot || Model.getStudent(state, attempt.studentId) || {};
  }

  function attemptMeta(attempt) {
    const student = attemptStudent(attempt);
    const seat = student.seatNumber || student.studentCode;
    const lessonId = attempt.lessonId || state.session.lessonId;
    const lessonNumber = Model.getLessonNumber(lessonId);
    const source = attempt.selectionMethod === "volunteer" ? "自愿发言" : "随机抽问";
    return `${source} · ${seat ? `座号 ${seat} · ` : ""}第 ${attempt.roundNumber} 轮 · 第 ${lessonNumber} 课`;
  }

  function noResponseReasonLabel(reason) {
    return Model.NO_RESPONSE_REASONS.find((item) => item.id === reason)?.label || "其他";
  }

  function renderAttemptLists() {
    elements.attemptList.replaceChildren();
    const attempts = state.attempts
      .filter((attempt) => attempt.outcome !== "undone")
      .slice()
      .reverse();
    if (attempts.length === 0) {
      const empty = document.createElement("p");
      empty.className = "history-empty";
      empty.textContent = "每次抽问与回答记录，都会留在这里。";
      elements.attemptList.appendChild(empty);
      return;
    }
    attempts.forEach((attempt) => {
      const item = document.createElement("div");
      item.className = "attempt-item";
      const copy = document.createElement("div");
      const student = attemptStudent(attempt);
      const title = document.createElement("strong");
      title.textContent = student.name || "未填写姓名";
      const status = attempt.outcome === "pending"
        ? "等待回答"
        : attempt.outcome === "not_answered"
          ? `未回答 · ${noResponseReasonLabel(attempt.noResponseReason)}`
          : attempt.responseStatus === "partial"
            ? "部分回答"
            : attempt.responseStatus === "peer_supported"
              ? "提示／协助后回答"
              : "已回答";
      const meta = document.createElement("span");
      meta.textContent = `${status} · ${attemptMeta(attempt)}${attempt.taskPrompt ? ` · 题目：${attempt.taskPrompt}` : ""}${attempt.note ? ` · ${attempt.note}` : ""}`;
      copy.append(title, meta);
      item.append(copy);
      elements.attemptList.appendChild(item);
    });
  }

  function renderSummary() {
    const progress = Model.getProgress(state);
    const attempts = state.attempts.filter((attempt) => attempt.outcome !== "undone");
    const summary = Model.summarizeAttempts(attempts);

    elements.answeredMetric.textContent = String(summary.totalAnswerCount);
    elements.pendingMetric.textContent = Model.pendingAttempt(state) ? "1" : "0";
    elements.notAnsweredMetric.textContent = String(summary.notAnsweredCount);
    elements.modePill.textContent = "原始记录";
    elements.sessionRecordSummary.textContent = `回答 ${summary.totalAnswerCount} 次｜随机回答 ${summary.randomCallEffectiveAnswerCount} 次｜自愿回答 ${summary.voluntaryEffectiveAnswerCount} 次。每次回答独立保存。`;
    elements.eligibleLabel.textContent = `本轮 ${progress.eligibleCount} 位`;

    const answeredIds = new Set(state.currentRound.answeredStudentIds);
    const pendingAttempt = Model.pendingAttempt(state);
    const pendingId = pendingAttempt ? pendingAttempt.studentId : null;
    const summaries = Model.getSummary(state);
    elements.studentList.replaceChildren();
    const query = studentSearchQuery.trim().toLocaleLowerCase();
    const visibleStudents = state.roster.filter((student) => {
      const excluded = state.excludedStudentIds.includes(student.id);
      const answered = answeredIds.has(student.id);
      const statusMatches = studentStatusFilter === "all"
        || (studentStatusFilter === "available" && !excluded && !answered)
        || (studentStatusFilter === "answered" && answered)
        || (studentStatusFilter === "absent" && excluded);
      const searchable = `${student.name} ${student.seatNumber || ""} ${student.studentCode || ""}`.toLocaleLowerCase();
      return statusMatches && (!query || searchable.includes(query));
    });
    if (visibleStudents.length === 0) {
      const empty = document.createElement("p");
      empty.className = "student-list-empty";
      empty.textContent = "没有符合条件的学生";
      elements.studentList.appendChild(empty);
    }
    visibleStudents.forEach((student) => {
      const excluded = state.excludedStudentIds.includes(student.id);
      const row = document.createElement("div");
      row.className = "student-row";
      row.classList.toggle("is-excluded", excluded);
      row.classList.toggle("is-answered", answeredIds.has(student.id));
      row.classList.toggle("is-pending", pendingId === student.id);

      const identity = document.createElement("div");
      identity.className = "student-identity";
      const seat = document.createElement("span");
      seat.className = "student-seat";
      seat.textContent = student.seatNumber || student.studentCode || "—";
      const name = document.createElement("strong");
      name.textContent = student.name;
      identity.append(seat, name);

      const summary = summaries.find((item) => item.student.id === student.id);
      const volunteerCount = summary ? summary.voluntarySpeakingCount : 0;
      const volunteerSuffix = volunteerCount ? ` · 自愿 ${volunteerCount} 次` : "";
      const status = document.createElement("span");
      status.className = "student-status";
      if (excluded) status.textContent = "暂不抽问";
      else if (pendingId === student.id) status.textContent = "等待回答";
      else if (answeredIds.has(student.id)) status.textContent = `本轮已完成 · 回答 ${summary ? summary.totalAnswerCount : 0} 次${volunteerSuffix}`;
      else status.textContent = `随机 ${summary ? summary.randomCallCount : 0} 次${volunteerSuffix}`;

      const controls = document.createElement("div");
      controls.className = "student-controls";
      const volunteerButton = document.createElement("button");
      volunteerButton.type = "button";
      volunteerButton.className = "volunteer-button";
      volunteerButton.textContent = "自愿发言";
      volunteerButton.disabled = excluded || Boolean(pendingAttempt);
      volunteerButton.title = excluded ? "暂不抽问的学生不能记录自愿发言" : "记录这位学生主动发言";
      volunteerButton.addEventListener("click", () => {
        try {
          state = Model.selectVolunteer(state, student.id, {
            taskMode: state.session.taskMode,
            taskTarget: taskDraftTarget
          });
          stopTimer();
          timerRemaining = timerDuration;
          resetResponseDraft();
          persist();
          renderApp();
          if (timerDuration > 0) startTimer();
        } catch (error) {
          showToast(error.message, true);
        }
      });
      const checkLabel = document.createElement("label");
      checkLabel.className = "absent-toggle";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = excluded;
      checkbox.disabled = Boolean(pendingAttempt) || answeredIds.has(student.id);
      checkbox.setAttribute("aria-label", `${student.name} 暂不抽问`);
      checkbox.addEventListener("change", () => {
        try {
          state = Model.setExcluded(state, student.id, checkbox.checked);
          persist();
          renderApp();
        } catch (error) {
          checkbox.checked = excluded;
          showToast(error.message, true);
        }
      });
      const checkText = document.createElement("span");
      checkText.textContent = "暂不抽问";
      checkLabel.append(checkbox, checkText);
      controls.append(status, volunteerButton, checkLabel);
      row.append(identity, controls);
      elements.studentList.appendChild(row);
    });
    renderAttemptLists();
  }

  function renderApp() {
    if (!state) return;
    const progress = Model.getProgress(state);
    elements.sessionTitle.textContent = state.session.className || "未填写班级名称";
    elements.sessionMeta.textContent = `${state.session.date || "未设置日期"} · 课堂回答记录`;
    populateActiveContextSelectors();
    elements.roundNumber.textContent = String(progress.roundNumber);
    elements.progressLabel.textContent = `本轮完成 ${progress.answeredCount}／${progress.eligibleCount}`;
    elements.poolLabel.textContent = `尚未完成 ${progress.poolCount} 人`;
    const percentage = progress.eligibleCount ? Math.round((progress.answeredCount / progress.eligibleCount) * 100) : 0;
    elements.progressBar.style.width = `${percentage}%`;
    elements.taskTargetSelect.value = taskDraftTarget;
    renderMainStage(progress);
    renderSummary();
    renderSavedTime();
    elements.presentationButton.textContent = studentDisplayWindow && !studentDisplayWindow.closed
      ? "学生画面已打开"
      : "打开学生画面";
    renderStudentDisplay();
  }

  function renderStart() {
    const saved = state || storedCurrentState();
    elements.resumeButton.hidden = !saved;
    if (saved) {
      elements.startNote.textContent = cloudReady()
        ? `有一堂尚未结束的课；开始新课前会先保留它。课堂记录会保存到教学数据库，已有 ${readHistory().length} 堂历史记录。`
        : `有一堂尚未结束的课；开始新课前会先保留它。请先登录教师账号，才能继续保存课堂记录。`;
    } else {
      elements.startNote.textContent = cloudReady()
        ? "课堂记录会保存到教学数据库；离线时会暂存在本机，连接恢复后自动同步。"
        : "开始课堂前请先登录教师账号；登录后才能将课堂记录保存到教学数据库。";
    }
    updateRosterCount();
  }

  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    downloadBlob(filename, blob);
  }

  function downloadBlob(filename, blob) {
    const url = global.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    global.setTimeout(() => global.URL.revokeObjectURL(url), 1000);
  }

  function xmlEscape(value) {
    return String(value === null || value === undefined ? "" : value)
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function excelColumnName(index) {
    let value = index + 1;
    let result = "";
    while (value > 0) {
      const remainder = (value - 1) % 26;
      result = String.fromCharCode(65 + remainder) + result;
      value = Math.floor((value - 1) / 26);
    }
    return result;
  }

  function worksheetXml(rows) {
    const rowXml = rows.map((row, rowIndex) => {
      const cells = row.map((value, columnIndex) => {
        const reference = `${excelColumnName(columnIndex)}${rowIndex + 1}`;
        if (typeof value === "number" && Number.isFinite(value)) {
          return `<c r="${reference}"><v>${value}</v></c>`;
        }
        return `<c r="${reference}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;
      }).join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    }).join("");
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rowXml}</sheetData></worksheet>`;
  }

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit += 1) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function zipNumber(value, size) {
    const bytes = new Uint8Array(size);
    new DataView(bytes.buffer).setUint32(0, value >>> 0, true);
    return bytes;
  }

  function zipShort(value) {
    const bytes = new Uint8Array(2);
    new DataView(bytes.buffer).setUint16(0, value, true);
    return bytes;
  }

  function concatBytes(parts) {
    const total = parts.reduce((sum, part) => sum + part.length, 0);
    const output = new Uint8Array(total);
    let offset = 0;
    parts.forEach((part) => {
      output.set(part, offset);
      offset += part.length;
    });
    return output;
  }

  function createXlsxBlob(rows) {
    const encoder = new TextEncoder();
    const files = [
      ["[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`],
      ["_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
      ["xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="课堂记录" sheetId="1" r:id="rId1"/></sheets></workbook>`],
      ["xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`],
      ["xl/worksheets/sheet1.xml", worksheetXml(rows)]
    ].map(([name, content]) => ({ name, bytes: encoder.encode(content) }));

    const localParts = [];
    const centralParts = [];
    let offset = 0;
    files.forEach((file) => {
      const nameBytes = encoder.encode(file.name);
      const checksum = crc32(file.bytes);
      const localHeader = concatBytes([
        zipNumber(0x04034b50, 4), zipShort(20), zipShort(0x0800), zipShort(0),
        zipShort(0), zipShort(0), zipNumber(checksum, 4), zipNumber(file.bytes.length, 4),
        zipNumber(file.bytes.length, 4), zipShort(nameBytes.length), zipShort(0), nameBytes
      ]);
      localParts.push(localHeader, file.bytes);
      const centralHeader = concatBytes([
        zipNumber(0x02014b50, 4), zipShort(20), zipShort(20), zipShort(0x0800), zipShort(0),
        zipShort(0), zipShort(0), zipNumber(checksum, 4), zipNumber(file.bytes.length, 4),
        zipNumber(file.bytes.length, 4), zipShort(nameBytes.length), zipShort(0), zipShort(0),
        zipShort(0), zipShort(0), zipNumber(0, 4), zipNumber(offset, 4), nameBytes
      ]);
      centralParts.push(centralHeader);
      offset += localHeader.length + file.bytes.length;
    });
    const centralDirectory = concatBytes(centralParts);
    const end = concatBytes([
      zipNumber(0x06054b50, 4), zipShort(0), zipShort(0), zipShort(files.length), zipShort(files.length),
      zipNumber(centralDirectory.length, 4), zipNumber(offset, 4), zipShort(0)
    ]);
    return new Blob([...localParts, centralDirectory, end], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
  }

  function safeFilename(value) {
    return String(value || "课堂").replace(/[\\/:*?"<>|\s]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "课堂";
  }

  function exportCsv() {
    if (!state) return;
    const name = `课堂原始记录-${safeFilename(state.session.className)}-${state.session.date || today()}.csv`;
    downloadFile(name, Model.exportSessionCsv(state), "text/csv;charset=utf-8");
    showToast("课堂原始记录 CSV 已下载");
  }

  function summaryFilenamePart(sessions) {
    const classNames = Array.from(new Set(sessions.map((entry) => entry.session.className).filter(Boolean)));
    return classNames.length === 1 ? classNames[0] : "全部班级";
  }

  function exportRawXlsx() {
    if (!state) return;
    const exported = Model.getSessionExportRows(state);
    const name = `课堂原始记录-${safeFilename(state.session.className)}-${state.session.date || today()}.xlsx`;
    downloadBlob(name, createXlsxBlob([exported.headers, ...exported.rows]));
    showToast("课堂原始记录 Excel 已下载");
  }

  function exportStudentSummaryCsv() {
    const sessions = allStoredSessions();
    const name = `学生课堂汇总-${safeFilename(summaryFilenamePart(sessions))}-${today()}.csv`;
    downloadFile(name, Model.exportStudentSummaryCsv(sessions), "text/csv;charset=utf-8");
    showToast("学生课堂汇总 CSV 已下载");
  }

  function exportStudentSummaryXlsx() {
    const sessions = allStoredSessions();
    const exported = Model.getStudentSummaryRows(sessions);
    const name = `学生课堂汇总-${safeFilename(summaryFilenamePart(sessions))}-${today()}.xlsx`;
    downloadBlob(name, createXlsxBlob([exported.headers, ...exported.rows]));
    showToast("学生课堂汇总 Excel 已下载");
  }

  function downloadBackup() {
    if (!state) return;
    const name = `课堂备份-${safeFilename(state.session.className)}-${state.session.date || today()}.json`;
    downloadFile(name, Model.exportBackup(state), "application/json;charset=utf-8");
    showToast("完整备份已下载");
  }

  async function restoreBackup(event) {
    const file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file) return;
    try {
      const imported = Model.importBackup(await file.text());
      if (state && !global.confirm("导入备份前，会先保留目前课堂。要继续吗？")) return;
      if (state) archiveState(state);
      state = imported;
      resetTimer(false);
      taskDraftTarget = state.session.taskTarget || Model.DEFAULT_TASK_TARGET;
      resetResponseDraft();
      persist();
      setView("app");
      renderApp();
      showToast("完整备份已导入");
    } catch (error) {
      showToast(error.message || "备份文件无法读取，请确认文件是否正确。", true);
    }
  }

  function openDialog(dialog) {
    if (dialog && typeof dialog.showModal === "function") dialog.showModal();
  }

  function closeDialog(dialog) {
    if (dialog && typeof dialog.close === "function") dialog.close();
  }

  function renderHistory() {
    const entries = readHistory();
    elements.historyList.replaceChildren();
    if (entries.length === 0) {
      const empty = document.createElement("p");
      empty.className = "history-empty";
      empty.textContent = "目前还没有历史课堂。完成今天的课堂后，记录会留在这里。";
      elements.historyList.appendChild(empty);
      return;
    }
    entries.forEach((entry) => {
      const item = document.createElement("div");
      item.className = "history-item";
      const copy = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = entry.session.className || "未填写班级名称";
      const attempts = entry.attempts.filter((attempt) => attempt.outcome !== "undone");
      const summary = Model.summarizeAttempts(attempts);
      const meta = document.createElement("span");
      meta.textContent = `${entry.session.date || "未设置日期"} · ${Model.formatLessonLabel(entry.session.textbookId, entry.session.lessonId)} · ${summary.attempts} 条记录 · 回答 ${summary.totalAnswerCount} 次 · 自愿 ${summary.voluntarySpeakingCount} 次`;
      copy.append(title, meta);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "button button-small button-quiet";
      button.textContent = "下载原始记录";
      button.addEventListener("click", () => {
        const name = `课堂原始记录-${safeFilename(entry.session.className)}-${entry.session.date || "课堂"}.csv`;
        downloadFile(name, Model.exportSessionCsv(entry), "text/csv;charset=utf-8");
      });
      const openButton = document.createElement("button");
      openButton.type = "button";
      openButton.className = "button button-small button-secondary";
      openButton.textContent = "打开";
      openButton.addEventListener("click", () => openHistoryEntry(entry.session.id));
      const actions = document.createElement("div");
      actions.className = "history-actions";
      actions.append(openButton, button);
      item.append(copy, actions);
      elements.historyList.appendChild(item);
    });
  }

  function openHistoryEntry(sessionId) {
    if (!cloudReady()) {
      openCloudDialog();
      showToast("请先登录教师账号，才能修改或同步这堂课。", true);
      return;
    }
    const entry = readHistory().find((item) => item.session.id === sessionId);
    if (!entry) return;
    if (state && state.session.id !== sessionId && !global.confirm("打开历史课堂前，会先保留目前课堂。要继续吗？")) {
      return;
    }
    if (state && state.session.id !== sessionId) archiveState(state);
    state = Model.importBackup(Model.exportBackup(entry));
    resetTimer(false);
    taskDraftTarget = state.session.taskTarget || Model.DEFAULT_TASK_TARGET;
    resetResponseDraft();
    persist();
    closeDialog(elements.historyDialog);
    setView("app");
    renderApp();
    showToast("已打开历史课堂，可以继续查看课堂记录");
  }

  function allStoredSessions() {
    const byId = new Map(readHistory().map((entry) => [entry.session.id, entry]));
    if (state && state.session) byId.set(state.session.id, state);
    return Array.from(byId.values());
  }

  function populateRecordsClasses() {
    const preferred = elements.recordsClassSelect.value
      || (state && state.session ? state.session.className : "")
      || Model.CLASS_OPTIONS[0].id;
    elements.recordsClassSelect.replaceChildren();
    Model.CLASS_OPTIONS.forEach((item) => addOption(elements.recordsClassSelect, item.id, item.label));
    elements.recordsClassSelect.value = Model.CLASS_OPTIONS.some((item) => item.id === preferred)
      ? preferred
      : Model.CLASS_OPTIONS[0].id;
  }

  function populateRecordsStudents() {
    const classId = elements.recordsClassSelect.value;
    const preferred = elements.recordsStudentSelect.value;
    const students = new Map();
    rosterForClass(classId).forEach((student) => students.set(student.studentCode || student.id, student));
    allStoredSessions()
      .filter((entry) => entry.session.className === classId)
      .forEach((entry) => entry.roster.forEach((student) => {
        students.set(student.studentCode || student.id, student);
      }));
    elements.recordsStudentSelect.replaceChildren();
    Array.from(students.values()).forEach((student) => {
      const key = student.studentCode || student.id;
      const seat = student.seatNumber ? `${student.seatNumber}｜` : "";
      addOption(elements.recordsStudentSelect, key, `${seat}${student.name}`);
    });
    if (students.has(preferred)) elements.recordsStudentSelect.value = preferred;
  }

  function renderStudentRecords() {
    const classId = elements.recordsClassSelect.value;
    const studentKey = elements.recordsStudentSelect.value;
    const rows = [];
    allStoredSessions()
      .filter((entry) => entry.session.className === classId)
      .forEach((entry) => {
        entry.attempts
          .filter((attempt) => attempt.outcome !== "undone")
          .forEach((attempt) => {
            const student = attempt.studentSnapshot || entry.roster.find((item) => item.id === attempt.studentId) || {};
            const key = student.studentCode || student.id || attempt.studentId;
            if (key === studentKey) rows.push({ entry, attempt });
          });
      });
    rows.sort((a, b) => String(b.attempt.drawnAt || b.entry.session.date).localeCompare(String(a.attempt.drawnAt || a.entry.session.date)));
    const summary = Model.summarizeAttempts(rows.map(({ entry, attempt }) => ({ ...attempt, sessionDate: entry.session.date })));
    elements.recordsSummary.textContent = rows.length
      ? `回答 ${summary.totalAnswerCount} 次｜参与 ${summary.participationDayCount} 个上课日｜随机回答 ${summary.randomCallEffectiveAnswerCount} 次｜自愿回答 ${summary.voluntaryEffectiveAnswerCount} 次｜未回答 ${summary.notAnsweredCount} 次`
      : "目前没有这位学生的回答记录。";
    elements.recordsList.replaceChildren();
    if (rows.length === 0) {
      const empty = document.createElement("p");
      empty.className = "history-empty";
      empty.textContent = "完成抽问并保存后，记录会显示在这里。";
      elements.recordsList.appendChild(empty);
      return;
    }
    rows.forEach(({ entry, attempt }) => {
      const item = document.createElement("article");
      item.className = "record-item";
      const date = document.createElement("span");
      date.className = "record-date";
      date.textContent = entry.session.date || "未设置日期";
      const context = document.createElement("div");
      context.className = "record-context";
      const title = document.createElement("strong");
      title.textContent = Model.formatLessonLabel(
        attempt.textbookId || entry.session.textbookId,
        attempt.lessonId || entry.session.lessonId
      );
      const detail = document.createElement("span");
      const source = attempt.selectionMethod === "volunteer" ? "自愿发言" : "随机抽问";
      const status = attempt.outcome === "not_answered"
        ? `未回答：${noResponseReasonLabel(attempt.noResponseReason)}`
        : attempt.outcome === "pending"
          ? "等待回答"
          : attempt.responseStatus === "partial"
              ? "部分回答"
              : attempt.responseStatus === "peer_supported"
                ? "提示／协助后回答"
                : "已回答";
      const contextLabel = attempt.answerContext === "prepared"
        ? "已准备"
        : attempt.answerContext === "unprepared"
          ? "未准备"
          : "未记录情境";
      const assistance = attempt.assistance === true ? "｜有实质提示或协助" : attempt.assistance === false ? "｜无实质提示或协助" : "";
      const note = `${assistance}${attempt.taskPrompt ? `｜题目：${attempt.taskPrompt}` : ""}${attempt.note ? `｜${attempt.note}` : ""}`;
      const correction = attempt.recordStatus === "corrected" ? "｜已更正" : "";
      detail.textContent = `${source} · 第 ${attempt.roundNumber} 轮 · ${status} · ${contextLabel}${correction}${note}`;
      context.append(title, detail);
      const recordState = document.createElement("span");
      recordState.className = "record-status";
      recordState.textContent = attempt.outcome === "not_answered"
        ? "未回答"
        : attempt.outcome === "pending"
          ? "等待回答"
          : "已记录";
      item.append(date, context, recordState);
      elements.recordsList.appendChild(item);
    });
  }

  function openRecords() {
    populateRecordsClasses();
    populateRecordsStudents();
    renderStudentRecords();
    openDialog(elements.recordsDialog);
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch (error) {
      showToast("目前无法进入全屏，请使用浏览器的全屏功能。", true);
    }
  }

  function isTypingTarget(target) {
    if (!target) return false;
    return ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName) || target.isContentEditable;
  }

  populateSelectors();
  elements.dateInput.value = today();
  elements.sessionForm.addEventListener("submit", startNewSession);
  elements.classNameInput.addEventListener("change", handleClassChange);
  elements.rosterInput.addEventListener("input", () => {
    updateRosterCount();
    if (elements.rosterInput.value.trim()) {
      elements.rosterSource.textContent = "目前使用这堂课的名单；如需调整，可直接编辑。";
    }
  });
  elements.rosterFile.addEventListener("change", async (event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file) return;
    elements.rosterInput.value = await file.text();
    elements.rosterSource.textContent = "已使用这次导入的名单；开始课堂前可直接检查或调整。";
    updateRosterCount();
  });
  elements.resumeButton.addEventListener("click", resumeSession);
  elements.newSessionButton.addEventListener("click", () => {
    stopTimer();
    isDrawing = false;
    if (drawingRevealTimer) global.clearTimeout(drawingRevealTimer);
    drawingRevealTimer = null;
    prepareStartFromState();
    setView("start");
    renderStart();
  });
  elements.presentationButton.addEventListener("click", openStudentDisplay);
  elements.textbookInput.addEventListener("change", () => {
    updateLessonOptions();
  });
  elements.activeTextbookSelect.addEventListener("change", changeActiveContext);
  elements.activeLessonSelect.addEventListener("change", changeActiveContext);
  elements.studentSearchInput.addEventListener("input", () => {
    studentSearchQuery = elements.studentSearchInput.value;
    renderSummary();
  });
  elements.studentStatusFilter.addEventListener("change", () => {
    studentStatusFilter = elements.studentStatusFilter.value;
    renderSummary();
  });
  elements.taskTargetSelect.addEventListener("change", (event) => {
    taskDraftTarget = event.target.value;
  });
  elements.timerDurationSelect.addEventListener("change", (event) => {
    timerDuration = Number(event.target.value) || 0;
    resetTimer(Boolean(state && Model.pendingAttempt(state) && !isDrawing));
  });
  elements.timerToggleButton.addEventListener("click", toggleTimer);
  elements.timerResetButton.addEventListener("click", () => resetTimer(true));
  elements.noteInput.addEventListener("input", (event) => {
    noteDraft = event.target.value;
  });
  elements.responseStatusInput.addEventListener("change", (event) => {
    responseStatusDraft = event.target.value;
  });
  elements.answerContextInput.addEventListener("change", (event) => {
    answerContextDraft = event.target.value;
  });
  elements.noResponseReasonInput.addEventListener("change", (event) => {
    noResponseReasonDraft = event.target.value;
  });
  elements.drawButton.addEventListener("click", handleDraw);
  document.getElementById("newQuestionButton").addEventListener("click", () => {
    if (!state) { showToast("请先开始一堂课。", true); return; }
    state = Model.beginQuestion(state);
    taskPromptDraft = "";
    document.getElementById("taskPromptInput").value = "";
    persist();
    showToast("已开始新题目，请填写本题要求。");
  });
  document.getElementById("assistanceInput").addEventListener("change", (event) => { assistanceDraft = event.target.value === "unknown" ? null : event.target.value === "yes"; });
  document.getElementById("taskPromptInput").addEventListener("input", (event) => { taskPromptDraft = event.target.value; });
  elements.recordNextButton.addEventListener("click", () => handleResponse(true));
  elements.recordCompleteButton.addEventListener("click", () => handleResponse(false));
  elements.noAnswerButton.addEventListener("click", handleNoAnswer);
  elements.undoButton.addEventListener("click", handleUndo);
  elements.nextRoundButton.addEventListener("click", handleNextRound);
  elements.exportCsvButton.addEventListener("click", exportCsv);
  elements.exportXlsxButton.addEventListener("click", exportRawXlsx);
  elements.exportSummaryCsvButton.addEventListener("click", exportStudentSummaryCsv);
  elements.exportSummaryXlsxButton.addEventListener("click", exportStudentSummaryXlsx);
  elements.backupButton.addEventListener("click", downloadBackup);
  elements.restoreFile.addEventListener("change", restoreBackup);
  elements.fullscreenButton.addEventListener("click", toggleFullscreen);
  elements.helpButton.addEventListener("click", () => openDialog(elements.helpDialog));
  elements.closeHelpButton.addEventListener("click", () => closeDialog(elements.helpDialog));
  elements.cloudButton.addEventListener("click", openCloudDialog);
  elements.closeCloudButton.addEventListener("click", () => closeDialog(elements.cloudDialog));
  elements.cloudInviteForm.addEventListener("submit", completeCloudInvite);
  elements.cloudLoginForm.addEventListener("submit", signInCloud);
  elements.cloudLogoutButton.addEventListener("click", signOutCloud);
  elements.recordsButton.addEventListener("click", openRecords);
  elements.recordsClassSelect.addEventListener("change", () => {
    populateRecordsStudents();
    renderStudentRecords();
  });
  elements.recordsStudentSelect.addEventListener("change", renderStudentRecords);
  elements.closeRecordsButton.addEventListener("click", () => closeDialog(elements.recordsDialog));
  elements.historyButton.addEventListener("click", () => {
    renderHistory();
    openDialog(elements.historyDialog);
  });
  elements.closeHistoryButton.addEventListener("click", () => closeDialog(elements.historyDialog));
  document.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === "f" && !isTypingTarget(event.target)) {
      event.preventDefault();
      toggleFullscreen();
      return;
    }
    if (event.code === "Space" && !isTypingTarget(event.target) && state && !Model.pendingAttempt(state) && !isDrawing) {
      event.preventDefault();
      handleDraw();
    }
  });
  global.addEventListener("beforeunload", () => {
    stopTimer();
    if (studentDisplayWindow && !studentDisplayWindow.closed) studentDisplayWindow.close();
  });

  state = storedCurrentState();
  if (state) {
    taskDraftTarget = state.session.taskTarget || Model.DEFAULT_TASK_TARGET;
    setView("start");
    prepareStartFromState();
  } else {
    setView("start");
    loadDefaultStartValues();
  }
  updateCloudStatus();
  if (global.RandomizerCloud && (global.RandomizerCloud.hasInviteSession() || global.RandomizerCloud.getAuthRedirectError())) {
    openCloudDialog();
  }
  void flushCloudQueue();
  cloudSyncTimer = global.setInterval(flushCloudQueue, 30000);
  renderStart();
}(window, document));
