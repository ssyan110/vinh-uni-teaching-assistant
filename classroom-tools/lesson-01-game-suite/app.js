(function startClassroomGameSuite(global, document) {
  "use strict";

  const suite = global.ClassroomGameSuite;
  const MODE_LIST = [
    { id: "randomSpeaking", label: "随机口语挑战" },
    { id: "situationChanged", label: "情况有变" },
    { id: "openBox", label: "开箱任务" },
    { id: "teamBoard", label: "团队挑战板" },
    { id: "rankDefend", label: "排名并辩护" },
    { id: "detective", label: "侦探／猜猜看" },
    { id: "mission", label: "任务解决" },
    { id: "retrieval", label: "快速回忆赛" }
  ];

  const elements = {
    homeButton: document.getElementById("homeButton"),
    helpButton: document.getElementById("helpButton"),
    fullscreenButton: document.getElementById("fullscreenButton"),
    homeView: document.getElementById("homeView"),
    liveView: document.getElementById("liveView"),
    launchForm: document.getElementById("launchForm"),
    packSelect: document.getElementById("packSelect"),
    modeSelect: document.getElementById("modeSelect"),
    roundSelect: document.getElementById("roundSelect"),
    teamCountSelect: document.getElementById("teamCountSelect"),
    modePreviewTitle: document.getElementById("modePreviewTitle"),
    modePreviewDescription: document.getElementById("modePreviewDescription"),
    modePreviewDuration: document.getElementById("modePreviewDuration"),
    sessionPack: document.getElementById("sessionPack"),
    sessionProgress: document.getElementById("sessionProgress"),
    liveModeTitle: document.getElementById("liveModeTitle"),
    gameStage: document.getElementById("gameStage"),
    timerButton: document.getElementById("timerButton"),
    timerDisplay: document.getElementById("timerDisplay"),
    timerStatus: document.getElementById("timerStatus"),
    minusTime: document.getElementById("minusTime"),
    plusTime: document.getElementById("plusTime"),
    resetTimer: document.getElementById("resetTimer"),
    modeTeacherHint: document.getElementById("modeTeacherHint"),
    railHomeButton: document.getElementById("railHomeButton"),
    helpDialog: document.getElementById("helpDialog"),
    closeHelp: document.getElementById("closeHelp"),
    toast: document.getElementById("toast")
  };

  const state = {
    pack: null,
    modeId: null,
    queue: [],
    index: 0,
    sessionDone: false,
    timerSeconds: 45,
    timerRunning: false,
    timerHandle: null,
    modeState: null,
    teamCount: 3,
    scores: [],
    scoreHistory: []
  };

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function listHtml(items, className) {
    return (items || []).map((value) => `<li class="${className || ""}">${escapeHtml(value)}</li>`).join("");
  }

  function shuffle(items) {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function currentPack() {
    return state.pack;
  }

  function currentMode() {
    return state.pack && state.pack.modes[state.modeId];
  }

  function currentItem() {
    return state.queue[state.index] || null;
  }

  function modeLabel(modeId) {
    const mode = MODE_LIST.find((item) => item.id === modeId);
    return mode ? mode.label : "课堂游戏";
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    clearTimeout(showToast.handle);
    showToast.handle = setTimeout(() => elements.toast.classList.remove("is-visible"), 2200);
  }

  function setView(view) {
    const isHome = view === "home";
    elements.homeView.classList.toggle("is-active", isHome);
    elements.liveView.classList.toggle("is-active", !isHome);
    elements.homeView.hidden = !isHome;
    elements.liveView.hidden = isHome;
  }

  function populatePackSelect() {
    const storedPack = localStorage.getItem("lesson-01-game-pack");
    elements.packSelect.innerHTML = suite.packs.map((pack) => `<option value="${escapeHtml(pack.id)}">${escapeHtml(pack.title)}</option>`).join("");
    if (storedPack && suite.packs.some((pack) => pack.id === storedPack)) {
      elements.packSelect.value = storedPack;
    }
    updateModeSelect();
  }

  function updateModeSelect() {
    const pack = suite.packs.find((item) => item.id === elements.packSelect.value) || suite.packs[0];
    if (!pack) return;
    elements.modeSelect.innerHTML = MODE_LIST
      .filter((mode) => pack.modes[mode.id])
      .map((mode) => `<option value="${mode.id}">${mode.label}</option>`)
      .join("");
    updateModePreview();
  }

  function updateModePreview() {
    const pack = suite.packs.find((item) => item.id === elements.packSelect.value) || suite.packs[0];
    const mode = pack && pack.modes[elements.modeSelect.value];
    if (!mode) return;
    elements.modePreviewTitle.textContent = mode.title;
    elements.modePreviewDescription.textContent = mode.description;
    elements.modePreviewDuration.textContent = mode.duration;
    elements.teamCountSelect.disabled = elements.modeSelect.value !== "teamBoard";
    elements.roundSelect.disabled = elements.modeSelect.value === "teamBoard" || elements.modeSelect.value === "openBox";
  }

  function modeTimerSeconds(modeId) {
    const pack = currentPack();
    if (!pack) return 45;
    if (modeId === "situationChanged") return pack.defaultSeconds.change;
    if (modeId === "mission") return pack.defaultSeconds.present;
    return pack.defaultSeconds.speaking;
  }

  function stopTimer() {
    state.timerRunning = false;
    if (state.timerHandle) {
      clearInterval(state.timerHandle);
      state.timerHandle = null;
    }
    renderTimer();
  }

  function setTimer(seconds) {
    stopTimer();
    state.timerSeconds = Math.max(0, Math.min(5999, Math.round(seconds)));
    renderTimer();
  }

  function toggleTimer() {
    if (state.sessionDone || !currentMode()) return;
    if (state.timerRunning) {
      stopTimer();
      return;
    }
    state.timerRunning = true;
    state.timerHandle = setInterval(() => {
      state.timerSeconds = Math.max(0, state.timerSeconds - 1);
      if (state.timerSeconds === 0) {
        stopTimer();
        showToast("时间到了，请教师决定是否让学生说完。 ");
      }
      renderTimer();
    }, 1000);
    renderTimer();
  }

  function renderTimer() {
    const minutes = Math.floor(state.timerSeconds / 60).toString().padStart(2, "0");
    const seconds = (state.timerSeconds % 60).toString().padStart(2, "0");
    elements.timerDisplay.textContent = `${minutes}:${seconds}`;
    elements.timerStatus.textContent = state.timerRunning ? "进行中" : (state.timerSeconds === 0 ? "时间到了" : "准备好就开始");
    elements.timerButton.classList.toggle("is-running", state.timerRunning);
    elements.timerButton.classList.toggle("is-empty", state.timerSeconds === 0);
  }

  function resetModeTimer() {
    setTimer(modeTimerSeconds(state.modeId));
  }

  function currentProgress() {
    if (state.modeId === "teamBoard") {
      const mode = currentMode();
      const total = mode ? mode.categories.reduce((sum, category) => sum + category.items.length, 0) : 0;
      const used = state.modeState && state.modeState.used ? state.modeState.used.size : 0;
      return `${used}/${total} 题格完成`;
    }
    if (state.sessionDone) return "本轮完成";
    return `${Math.min(state.index + 1, state.queue.length)}/${state.queue.length} 题`;
  }

  function renderHeader() {
    const mode = currentMode();
    elements.sessionPack.textContent = currentPack() ? currentPack().title : "";
    elements.sessionProgress.textContent = currentProgress();
    elements.liveModeTitle.textContent = mode ? mode.title : "";
    elements.modeTeacherHint.textContent = mode
      ? `${mode.description} 先让学生完成，再做短时间修补。`
      : "先让学生完成，再做短时间修补。";
  }

  function actionButton(action, label, className, attrs) {
    const extra = Object.entries(attrs || {}).map(([key, value]) => ` data-${key}="${escapeHtml(value)}"`).join("");
    return `<button class="${className || "secondary-button"}" type="button" data-action="${escapeHtml(action)}"${extra}>${escapeHtml(label)}</button>`;
  }

  function renderActionBar(buttons) {
    return `<div class="action-bar">${buttons.join("")}</div>`;
  }

  function standardCardHeader(kicker, title, description) {
    return `<div class="mode-card-heading"><p class="stage-kicker">${escapeHtml(kicker)}</p><h1>${escapeHtml(title)}</h1>${description ? `<p class="mode-lede">${escapeHtml(description)}</p>` : ""}</div>`;
  }

  function renderRoles(roles) {
    return `<div class="role-grid">${(roles || []).map((role, index) => `<article class="role-card"><span class="role-number">${index + 1}</span><p>${escapeHtml(role)}</p></article>`).join("")}</div>`;
  }

  function renderSpeaking() {
    const item = currentItem();
    if (!item) return renderSessionDone();
    const modeState = state.modeState;
    const done = modeState.stage === "done";
    const followUp = modeState.followUp || item.followUps[0];
    const language = modeState.showLanguage ? `<div class="prompt-box language-box"><p class="micro-label">可以这样说</p><div class="chip-list">${item.language.map((text) => `<span>${escapeHtml(text)}</span>`).join("")}</div></div>` : "";
    const follow = modeState.showFollowUp ? `<div class="prompt-box followup-box"><p class="micro-label">追问</p><p>${escapeHtml(followUp)}</p></div>` : "";
    const body = done
      ? `<div class="complete-panel"><span class="complete-icon">✓</span><h2>这题完成了</h2><p>${escapeHtml(item.output)}</p></div>`
      : `<div class="content-block"><p class="micro-label">情境</p><p class="large-copy">${escapeHtml(item.context)}</p></div>
         ${renderRoles(item.roles)}
         <div class="goal-grid"><div><p class="micro-label">现在要完成</p><p>${escapeHtml(item.goal)}</p></div><div><p class="micro-label">听者任务</p><p>${escapeHtml(item.listenerTask)}</p></div></div>
         ${language}${follow}`;
    const actions = done
      ? [actionButton("repeat-item", "再说一次", "secondary-button"), actionButton("next-item", "下一题", "primary-button")]
      : [actionButton("show-language", modeState.showLanguage ? "隐藏提示" : "显示提示", "secondary-button"), actionButton("show-followup", modeState.showFollowUp ? "换一个追问" : "显示追问", "secondary-button"), actionButton("finish-item", "完成这题", "primary-button")];
    return `<article class="mode-card">${standardCardHeader("两人一组", item.title, done ? "教师确认两个人都完成表达后，再进入下一题。" : "先说清楚问题，再让听者真正听懂。")}${body}${renderActionBar(actions)}</article>`;
  }

  function renderSituation() {
    const item = currentItem();
    if (!item) return renderSessionDone();
    const modeState = state.modeState;
    const done = modeState.stage === "done";
    let body = "";
    if (done) {
      body = `<div class="complete-panel"><span class="complete-icon">✓</span><h2>调整完成</h2><p>${escapeHtml(item.finalOutput)}</p></div>`;
    } else if (modeState.stage === "twist" || modeState.stage === "second") {
      body = `<div class="content-block"><p class="micro-label">第一轮情境</p><p>${escapeHtml(item.firstRound)}</p><p class="micro-label spaced-label">第一轮任务</p><p>${escapeHtml(item.firstTask)}</p></div>
        <div class="twist-panel"><div class="twist-signal">情况有变</div><p class="large-copy">${escapeHtml(item.twist)}</p><p>${escapeHtml(item.action)}</p></div>
        ${modeState.stage === "second" ? `<div class="prompt-box"><p class="micro-label">第二轮要留下</p><p>${escapeHtml(item.finalOutput)}</p></div>` : ""}`;
    } else {
      body = `<div class="content-block"><p class="micro-label">第一轮情境</p><p class="large-copy">${escapeHtml(item.firstRound)}</p><p class="micro-label spaced-label">现在要完成</p><p>${escapeHtml(item.firstTask)}</p></div>`;
    }
    let actions;
    if (done) actions = [actionButton("repeat-item", "重新应变", "secondary-button"), actionButton("next-item", "下一题", "primary-button")];
    else if (modeState.stage === "start") actions = [actionButton("reveal-change", "公布情况有变", "primary-button")];
    else if (modeState.stage === "twist") actions = [actionButton("start-second", "开始第二轮", "primary-button")];
    else actions = [actionButton("finish-item", "完成这题", "primary-button")];
    return `<article class="mode-card">${standardCardHeader("先完成第一轮", item.title, "新限制不是惩罚，而是让学生重新组织意思。")}${body}${renderActionBar(actions)}</article>`;
  }

  function renderOpenBox() {
    const mode = currentMode();
    const modeState = state.modeState;
    if (modeState.finished) {
      return `<article class="mode-card">${standardCardHeader("开箱完成", "所有任务都打开了", "教师可以回到选择画面，再换一种玩法。")}${renderActionBar([actionButton("restart-mode", "再开一轮", "primary-button")])}</article>`;
    }
    if (modeState.openedIndex == null) {
      const boxes = mode.items.map((box, index) => `<button class="box-tile ${modeState.used.has(box.id) ? "is-used" : ""}" type="button" data-action="open-box" data-index="${index}" ${modeState.used.has(box.id) ? "disabled" : ""}><span>${escapeHtml(box.label)}</span><small>${modeState.used.has(box.id) ? "完成" : "打开"}</small></button>`).join("");
      return `<article class="mode-card box-card">${standardCardHeader("全班选择", "开一个任务", "先选号码，再由教师打开；每个格子只有一个主要任务。")}<div class="box-grid">${boxes}</div><p class="box-note">已经完成的格子不会再次出现。</p></article>`;
    }
    const box = mode.items[modeState.openedIndex];
    return `<article class="mode-card">${standardCardHeader(`第 ${box.label} 格`, box.title, "完成后回到箱子，再选择下一格。")}<div class="content-block"><p class="micro-label">情境</p><p class="large-copy">${escapeHtml(box.prompt)}</p><p class="micro-label spaced-label">任务</p><p>${escapeHtml(box.task)}</p></div><div class="prompt-box followup-box"><p class="micro-label">完成后追问</p><p>${escapeHtml(box.followUp)}</p></div>${renderActionBar([actionButton("close-box", "回到箱子", "secondary-button"), actionButton("finish-box", "完成这个格子", "primary-button")])}</article>`;
  }

  function boardItems() {
    const mode = currentMode();
    return mode.categories.flatMap((category) => category.items.map((entry) => ({ ...entry, categoryTitle: category.title, categoryId: category.id })));
  }

  function renderScores() {
    return `<div class="score-row">${state.scores.map((score, index) => `<div class="score-chip"><span>${index + 1}组</span><strong>${score}</strong></div>`).join("")}</div>`;
  }

  function renderTeamBoard() {
    const modeState = state.modeState;
    const mode = currentMode();
    if (modeState.activeTile) {
      const tile = boardItems().find((item) => item.id === modeState.activeTile);
      return `<article class="mode-card board-task-card">${standardCardHeader(tile.categoryTitle, `${tile.points} 分`, "完成后由教师按表现手动加分；开放题没有自动标准答案。")}<div class="content-block"><p class="micro-label">情境</p><p class="large-copy">${escapeHtml(tile.prompt)}</p><p class="micro-label spaced-label">口语任务</p><p>${escapeHtml(tile.task)}</p></div><div class="evidence-box"><p class="micro-label">教师观察</p><ul>${listHtml(tile.evidence, "")}</ul></div><div class="team-score-controls">${state.scores.map((score, index) => `<div class="team-score-control"><span>${index + 1}组 · ${score}分</span>${actionButton("score-plus", `+${tile.points}`, "score-button", { team: index, points: tile.points })}</div>`).join("")}</div>${renderActionBar([actionButton("undo-score", "撤销上一次加分", "secondary-button"), actionButton("close-tile", "回到挑战板", "primary-button")])}</article>`;
    }
    const board = mode.categories.map((category) => `<section class="board-category"><h2>${escapeHtml(category.title)}</h2><div class="board-column">${category.items.map((tile) => `<button class="board-tile ${modeState.used.has(tile.id) ? "is-used" : ""}" type="button" data-action="open-tile" data-id="${escapeHtml(tile.id)}" ${modeState.used.has(tile.id) ? "disabled" : ""}><strong>${tile.points}</strong><span>${modeState.used.has(tile.id) ? "已完成" : "选择"}</span></button>`).join("")}</div></section>`).join("");
    return `<article class="mode-card board-card">${standardCardHeader("小组选择", "团队挑战板", "选择一个题格，完成口语任务，再由教师决定是否加分。")} ${renderScores()}<div class="challenge-board">${board}</div>${state.scoreHistory.length ? `<p class="undo-note">可以撤销最近一次加分。</p>` : ""}</article>`;
  }

  function renderRank() {
    const item = currentItem();
    const modeState = state.modeState;
    if (!item) return renderSessionDone();
    const options = modeState.order.map((optionIndex, position) => `<li class="rank-option"><span class="rank-number">${position + 1}</span><span>${escapeHtml(item.options[optionIndex])}</span><span class="rank-controls">${position > 0 ? actionButton("move-option", "上移", "tiny-button", { position, direction: "up" }) : ""}${position < modeState.order.length - 1 ? actionButton("move-option", "下移", "tiny-button", { position, direction: "down" }) : ""}</span></li>`).join("");
    const report = modeState.confirmed ? `<div class="prompt-box language-box"><p class="micro-label">向全班说</p><p>${escapeHtml(item.reportPrompt)}</p></div>` : "";
    return `<article class="mode-card">${standardCardHeader("先排序，再说明", item.question, item.criterion)}<ol class="rank-list">${options}</ol>${report}${renderActionBar(modeState.confirmed ? [actionButton("next-item", "下一题", "primary-button")] : [actionButton("reset-order", "恢复顺序", "secondary-button"), actionButton("confirm-ranking", "确认排序", "primary-button")])}</article>`;
  }

  function renderDetective() {
    const item = currentItem();
    const modeState = state.modeState;
    if (!item) return renderSessionDone();
    let secret = "";
    if (modeState.secretVisible) secret = `<div class="secret-reveal"><p class="micro-label">给描述者看</p><p class="secret-word">${escapeHtml(item.secret)}</p><span>${escapeHtml(item.category)}</span></div>`;
    const hints = modeState.hintIndex > 0 ? `<div class="hint-list"><p class="micro-label">提示</p>${item.hints.slice(0, modeState.hintIndex).map((hint) => `<p>· ${escapeHtml(hint)}</p>`).join("")}</div>` : "";
    const rules = item.variant === "forbidden_words" ? `不能说：${item.forbiddenWords.join("、")}` : item.variant === "questions" ? "猜的人只能问问题，其他人简短回答。" : "描述答案，但不要直接说出答案。";
    let actionButtons;
    if (modeState.stage === "ready") actionButtons = [actionButton("reveal-secret", "显示答案给描述者", "primary-button")];
    else if (modeState.stage === "revealed") actionButtons = [actionButton("hide-secret", "藏起来，开始猜", "primary-button")];
    else if (modeState.stage === "playing") actionButtons = [actionButton("show-hint", "显示提示", "secondary-button"), actionButton("finish-item", "猜到了，完成本题", "primary-button")];
    else actionButtons = [actionButton("repeat-item", "再猜一次", "secondary-button"), actionButton("next-item", "下一题", "primary-button")];
    return `<article class="mode-card detective-card">${standardCardHeader("描述、提问或猜答案", item.category, rules)}${modeState.stage === "done" ? `<div class="complete-panel"><span class="complete-icon">✓</span><h2>本题完成</h2><p>教师确认答案后再进入下一题。</p></div>` : `<div class="detective-stage">${secret || `<div class="secret-hidden"><span>答案已隐藏</span><small>教师先让一组学生看答案</small></div>`}${hints}</div><div class="prompt-box"><p class="micro-label">课堂规则</p><p>${escapeHtml(rules)}</p></div>`}${renderActionBar(actionButtons)}</article>`;
  }

  function renderMission() {
    const item = currentItem();
    const modeState = state.modeState;
    if (!item) return renderSessionDone();
    const isDone = modeState.stepIndex >= item.steps.length;
    if (isDone) {
      return `<article class="mode-card">${standardCardHeader("任务完成", item.title, "每个人都说过以后，再结束小组任务。")}<div class="complete-panel"><span class="complete-icon">✓</span><h2>留下最终产出</h2><p>${escapeHtml(item.deliverable)}</p></div><div class="evidence-box"><p class="micro-label">个人语言责任</p><p>${escapeHtml(item.personalEvidence)}</p></div>${renderActionBar([actionButton("repeat-item", "重新做一次", "secondary-button"), actionButton("next-item", "下一题", "primary-button")])}</article>`;
    }
    const step = item.steps[modeState.stepIndex];
    const resources = modeState.stepIndex === 0 ? `<div class="resource-grid">${item.resources.map((resource) => `<div class="resource-card"><p>${escapeHtml(resource)}</p></div>`).join("")}</div>` : "";
    return `<article class="mode-card mission-card">${standardCardHeader(`第 ${modeState.stepIndex + 1} 步`, item.title, item.brief)}${renderRoles(item.roles)}${resources}<div class="mission-step"><span class="step-badge">${modeState.stepIndex + 1}</span><p class="large-copy">${escapeHtml(step)}</p></div><div class="evidence-box"><p class="micro-label">最后要留下</p><p>${escapeHtml(item.deliverable)}</p><p class="micro-label spaced-label">每个人都要做</p><p>${escapeHtml(item.personalEvidence)}</p></div>${renderActionBar([actionButton("next-stage", modeState.stepIndex === item.steps.length - 1 ? "完成发表" : "进入下一步", "primary-button")])}</article>`;
  }

  function renderRetrieval() {
    const item = currentItem();
    const modeState = state.modeState;
    if (!item) return renderSessionDone();
    if (modeState.stage === "done") {
      return `<article class="mode-card">${standardCardHeader("本题完成", "答案已经说过了", "教师确认口语证据后，再进入下一题。")}${renderActionBar([actionButton("repeat-item", "再说一次", "secondary-button"), actionButton("next-item", "下一题", "primary-button")])}</article>`;
    }
    const evidence = modeState.showEvidence ? `<div class="evidence-box"><p class="micro-label">教师检查点</p><p>${escapeHtml(item.evidence)}</p></div>` : "";
    const actions = modeState.showEvidence
      ? [actionButton("next-item", "下一题", "primary-button")]
      : [actionButton("show-evidence", "公布教师检查点", "secondary-button"), actionButton("finish-item", "完成本题", "primary-button")];
    return `<article class="mode-card retrieval-card">${standardCardHeader("短时间回收", "快速回忆赛", "先让学生口头回答；答案没有自动评分，教师按教材证据和可理解度判断。")}
      <div class="retrieval-question"><span class="question-mark">?</span><p>${escapeHtml(item.prompt)}</p></div>${evidence}${renderActionBar(actions)}</article>`;
  }

  function renderSessionDone() {
    return `<article class="mode-card session-done-card">${standardCardHeader("本轮完成", "把今天最有用的一句话留下来", "说出一句今天真正用过的话，或者回到选择画面换一种玩法。")}${renderActionBar([actionButton("restart-mode", "再来一轮", "primary-button"), actionButton("home", "回到选择", "secondary-button")])}</article>`;
  }

  function renderMode() {
    if (state.sessionDone) return renderSessionDone();
    switch (state.modeId) {
      case "randomSpeaking": return renderSpeaking();
      case "situationChanged": return renderSituation();
      case "openBox": return renderOpenBox();
      case "teamBoard": return renderTeamBoard();
      case "rankDefend": return renderRank();
      case "detective": return renderDetective();
      case "mission": return renderMission();
      case "retrieval": return renderRetrieval();
      default: return renderSessionDone();
    }
  }

  function render() {
    if (!state.pack) return;
    renderHeader();
    elements.gameStage.innerHTML = renderMode();
    renderTimer();
  }

  function startLinearSession(items) {
    const rounds = Math.max(1, Math.min(Number(elements.roundSelect.value) || 4, items.length));
    state.queue = shuffle(items).slice(0, rounds);
    state.index = 0;
    state.sessionDone = false;
  }

  function startSession() {
    const pack = suite.packs.find((item) => item.id === elements.packSelect.value) || suite.packs[0];
    const modeId = elements.modeSelect.value;
    const mode = pack.modes[modeId];
    state.pack = pack;
    state.modeId = modeId;
    state.teamCount = Number(elements.teamCountSelect.value) || 3;
    state.scores = Array.from({ length: state.teamCount }, () => 0);
    state.scoreHistory = [];
    state.modeState = { stage: "start", showLanguage: false, showFollowUp: false, used: new Set(), openedIndex: null, activeTile: null, confirmed: false, order: [], secretVisible: false, hintIndex: 0, stepIndex: 0, showEvidence: false };

    if (modeId === "teamBoard") {
      state.queue = [];
    } else if (modeId === "openBox") {
      state.queue = mode.items;
    } else {
      startLinearSession(mode.items);
    }
    localStorage.setItem("lesson-01-game-pack", pack.id);
    setView("live");
    resetModeTimer();
    prepareCurrentItem();
    render();
  }

  function prepareCurrentItem() {
    const item = currentItem();
    const modeState = state.modeState;
    if (!modeState || !item) return;
    modeState.stage = state.modeId === "detective" ? "ready" : "start";
    modeState.showLanguage = false;
    modeState.showFollowUp = false;
    modeState.followUp = null;
    modeState.confirmed = false;
    modeState.secretVisible = false;
    modeState.hintIndex = 0;
    modeState.stepIndex = 0;
    modeState.showEvidence = false;
    modeState.order = item.options ? item.options.map((_, index) => index) : [];
    resetModeTimer();
  }

  function nextItem() {
    if (state.modeId === "teamBoard" || state.modeId === "openBox") return;
    if (state.index >= state.queue.length - 1) {
      state.sessionDone = true;
      stopTimer();
      render();
      return;
    }
    state.index += 1;
    prepareCurrentItem();
    render();
  }

  function restartMode() {
    startSession();
  }

  function handleScore(team, points) {
    const index = Number(team);
    const value = Number(points);
    if (!Number.isInteger(index) || !Number.isFinite(value) || !state.scores[index]) {
      if (state.scores[index] !== 0) return;
    }
    state.scores[index] += value;
    state.scoreHistory.push({ index, value });
    showToast(`${index + 1}组 +${value} 分`);
    render();
  }

  function undoScore() {
    const last = state.scoreHistory.pop();
    if (!last) {
      showToast("还没有可以撤销的加分。");
      return;
    }
    state.scores[last.index] -= last.value;
    render();
  }

  function moveOption(position, direction) {
    const next = direction === "up" ? position - 1 : position + 1;
    if (next < 0 || next >= state.modeState.order.length) return;
    [state.modeState.order[position], state.modeState.order[next]] = [state.modeState.order[next], state.modeState.order[position]];
    render();
  }

  function handleAction(action, target) {
    const ms = state.modeState;
    if (action === "home") return returnHome();
    if (action === "restart-mode") return restartMode();
    if (action === "next-item") return nextItem();
    if (action === "repeat-item") {
      if (state.modeId === "mission") ms.stepIndex = 0;
      else if (state.modeId === "rankDefend") ms.confirmed = false;
      else if (state.modeId === "detective") ms.stage = "ready";
      else ms.stage = "start";
      render();
      return;
    }
    if (action === "show-language") { ms.showLanguage = !ms.showLanguage; render(); return; }
    if (action === "show-followup") { ms.showFollowUp = true; ms.followUp = ms.followUp === currentItem().followUps[0] ? currentItem().followUps[1] : currentItem().followUps[0]; render(); return; }
    if (action === "finish-item") {
      if (state.modeId === "mission") ms.stepIndex = currentItem().steps.length;
      else if (state.modeId === "rankDefend") ms.confirmed = true;
      else ms.stage = "done";
      stopTimer();
      render();
      return;
    }
    if (action === "reveal-change") { ms.stage = "twist"; stopTimer(); render(); return; }
    if (action === "start-second") { ms.stage = "second"; resetModeTimer(); render(); return; }
    if (action === "open-box") { ms.openedIndex = Number(target.index); resetModeTimer(); render(); return; }
    if (action === "close-box") { ms.openedIndex = null; render(); return; }
    if (action === "finish-box") { ms.used.add(currentMode().items[ms.openedIndex].id); ms.openedIndex = null; if (ms.used.size === currentMode().items.length) ms.finished = true; render(); return; }
    if (action === "open-tile") { ms.activeTile = target.id; resetModeTimer(); render(); return; }
    if (action === "close-tile") { if (ms.activeTile) ms.used.add(ms.activeTile); ms.activeTile = null; render(); return; }
    if (action === "score-plus") { handleScore(target.team, target.points); return; }
    if (action === "undo-score") { undoScore(); return; }
    if (action === "move-option") { moveOption(Number(target.position), target.direction); return; }
    if (action === "reset-order") { ms.order = currentItem().options.map((_, index) => index); render(); return; }
    if (action === "confirm-ranking") { ms.confirmed = true; stopTimer(); render(); return; }
    if (action === "reveal-secret") { ms.secretVisible = true; ms.stage = "revealed"; stopTimer(); render(); return; }
    if (action === "hide-secret") { ms.secretVisible = false; ms.stage = "playing"; resetModeTimer(); render(); return; }
    if (action === "show-hint") { ms.hintIndex = Math.min(currentItem().hints.length, ms.hintIndex + 1); render(); return; }
    if (action === "next-stage") { ms.stepIndex += 1; if (ms.stepIndex >= currentItem().steps.length) stopTimer(); render(); return; }
    if (action === "show-evidence") { ms.showEvidence = true; stopTimer(); render(); return; }
  }

  function handleStageClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const target = Object.fromEntries(Array.from(button.attributes).filter((attribute) => attribute.name.startsWith("data-") && attribute.name !== "data-action").map((attribute) => [attribute.name.slice(5), attribute.value]));
    handleAction(button.dataset.action, target);
  }

  function returnHome() {
    stopTimer();
    state.pack = null;
    state.modeId = null;
    state.modeState = null;
    setView("home");
    updateModeSelect();
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  function showHelp() {
    if (typeof elements.helpDialog.showModal === "function") elements.helpDialog.showModal();
    else elements.helpDialog.setAttribute("open", "");
  }

  function closeHelp() {
    if (typeof elements.helpDialog.close === "function") elements.helpDialog.close();
    else elements.helpDialog.removeAttribute("open");
  }

  elements.packSelect.addEventListener("change", updateModeSelect);
  elements.modeSelect.addEventListener("change", updateModePreview);
  elements.launchForm.addEventListener("submit", (event) => { event.preventDefault(); startSession(); });
  elements.gameStage.addEventListener("click", handleStageClick);
  elements.homeButton.addEventListener("click", returnHome);
  elements.railHomeButton.addEventListener("click", returnHome);
  elements.helpButton.addEventListener("click", showHelp);
  elements.closeHelp.addEventListener("click", closeHelp);
  elements.fullscreenButton.addEventListener("click", toggleFullscreen);
  elements.timerButton.addEventListener("click", toggleTimer);
  elements.minusTime.addEventListener("click", () => setTimer(state.timerSeconds - 15));
  elements.plusTime.addEventListener("click", () => setTimer(state.timerSeconds + 15));
  elements.resetTimer.addEventListener("click", resetModeTimer);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && elements.helpDialog.open) { closeHelp(); return; }
    if (event.target.matches("input, select, textarea")) return;
    const key = event.key.toLowerCase();
    if (key === "f") { event.preventDefault(); toggleFullscreen(); return; }
    if (key === " " && state.pack) { event.preventDefault(); toggleTimer(); return; }
    if (key === "r" && state.pack) { event.preventDefault(); resetModeTimer(); return; }
    if (key === "n" && state.pack && state.modeId !== "teamBoard" && state.modeId !== "openBox") { event.preventDefault(); handleAction("finish-item"); return; }
    if (key === "h" && state.pack && state.modeId === "randomSpeaking") { event.preventDefault(); handleAction("show-language"); }
  });

  populatePackSelect();
  renderTimer();
})(window, document);
