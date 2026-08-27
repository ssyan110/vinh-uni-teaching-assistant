(function startSpeakingChallenge(global, document) {
  "use strict";

  const registry = global.SpeakingChallenge;
  if (!registry || !Array.isArray(registry.packs) || registry.packs.length === 0) {
    throw new Error("没有可用的课堂内容包");
  }

  const elements = {
    homeView: document.getElementById("homeView"),
    gameView: document.getElementById("gameView"),
    homeButton: document.getElementById("homeButton"),
    helpButton: document.getElementById("helpButton"),
    closeHelp: document.getElementById("closeHelp"),
    helpDialog: document.getElementById("helpDialog"),
    fullscreenButton: document.getElementById("fullscreenButton"),
    launchForm: document.getElementById("launchForm"),
    packSelect: document.getElementById("packSelect"),
    roundSelect: document.getElementById("roundSelect"),
    sessionPack: document.getElementById("sessionPack"),
    sessionProgress: document.getElementById("sessionProgress"),
    phaseRail: document.getElementById("phaseRail"),
    challengeCard: document.getElementById("challengeCard"),
    stageKicker: document.getElementById("stageKicker"),
    challengeTitle: document.getElementById("challengeTitle"),
    challengeSituation: document.getElementById("challengeSituation"),
    roleAccordion: document.getElementById("roleAccordion"),
    challengeGoal: document.getElementById("challengeGoal"),
    challengeOutcome: document.getElementById("challengeOutcome"),
    languageStrip: document.getElementById("languageStrip"),
    languageItems: document.getElementById("languageItems"),
    changePanel: document.getElementById("changePanel"),
    changeText: document.getElementById("changeText"),
    changeAction: document.getElementById("changeAction"),
    presentPanel: document.getElementById("presentPanel"),
    presentInstruction: document.getElementById("presentInstruction"),
    audiencePrompt: document.getElementById("audiencePrompt"),
    audiencePrev: document.getElementById("audiencePrev"),
    audienceNext: document.getElementById("audienceNext"),
    secondaryAction: document.getElementById("secondaryAction"),
    primaryAction: document.getElementById("primaryAction"),
    primaryActionText: document.getElementById("primaryActionText"),
    continueHint: document.getElementById("continueHint"),
    timerCard: document.getElementById("timerCard"),
    timerButton: document.getElementById("timerButton"),
    timerDisplay: document.getElementById("timerDisplay"),
    timerStatus: document.getElementById("timerStatus"),
    minusTime: document.getElementById("minusTime"),
    resetTimer: document.getElementById("resetTimer"),
    plusTime: document.getElementById("plusTime"),
    growthLine: document.getElementById("growthLine"),
    growthScene: document.getElementById("growthScene"),
    growthDots: document.getElementById("growthDots"),
    toast: document.getElementById("toast")
  };

  const state = {
    pack: null,
    queue: [],
    currentIndex: 0,
    completed: 0,
    phase: "home",
    condition: null,
    audienceIndex: 0,
    timerSeconds: 40,
    timerRemaining: 40,
    timerRunning: false,
    timerHandle: null,
    toastHandle: null
  };

  const phaseOrder = ["practice", "change", "present"];
  const phaseLabels = {
    practice: "第一步：两人先练",
    change: "第二步：看新情况，再练一次",
    present: "第三步：向全班说",
    done: "本题完成"
  };

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
    } catch (error) {
      return;
    }
  }

  function randomIndex(length) {
    if (global.crypto && typeof global.crypto.getRandomValues === "function") {
      const values = new Uint32Array(1);
      global.crypto.getRandomValues(values);
      return Math.floor((values[0] / 4294967296) * length);
    }
    return Math.floor(Math.random() * length);
  }

  function shuffled(items) {
    const copy = items.slice();
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = randomIndex(index + 1);
      const current = copy[index];
      copy[index] = copy[swapIndex];
      copy[swapIndex] = current;
    }
    return copy;
  }

  function setView(viewName) {
    const showHome = viewName === "home";
    elements.homeView.classList.toggle("is-active", showHome);
    elements.gameView.classList.toggle("is-active", !showHome);
  }

  function populatePackSelect() {
    const storedPack = safeStorageGet("speaking-challenge-pack");
    registry.packs.forEach((pack) => {
      const option = document.createElement("option");
      option.value = pack.id;
      option.textContent = pack.title + "｜" + pack.stage;
      if (storedPack === pack.id) {
        option.selected = true;
      }
      elements.packSelect.appendChild(option);
    });
  }

  function currentChallenge() {
    return state.queue[state.currentIndex] || null;
  }

  function currentPhaseSeconds() {
    if (!state.pack) {
      return 40;
    }
    return state.pack.defaultSeconds[state.phase] || state.pack.defaultSeconds.practice;
  }

  function stopTimer() {
    if (state.timerHandle !== null) {
      global.clearInterval(state.timerHandle);
      state.timerHandle = null;
    }
    state.timerRunning = false;
    renderTimer();
  }

  function setTimer(seconds) {
    stopTimer();
    state.timerSeconds = Math.max(15, seconds);
    state.timerRemaining = state.timerSeconds;
    renderTimer();
  }

  function renderTimer() {
    const minutes = Math.floor(state.timerRemaining / 60);
    const seconds = state.timerRemaining % 60;
    elements.timerDisplay.textContent = String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
    elements.timerCard.classList.toggle("is-running", state.timerRunning);
    elements.timerCard.classList.toggle("is-ending", state.timerRunning && state.timerRemaining <= 10);

    if (state.phase === "done") {
      elements.timerStatus.textContent = "全班说完";
    } else if (state.timerRemaining === 0) {
      elements.timerStatus.textContent = "时间到，请完成这一句";
    } else if (state.timerRunning) {
      elements.timerStatus.textContent = "正在计时";
    } else {
      elements.timerStatus.textContent = "准备好就开始";
    }
  }

  function toggleTimer() {
    if (state.phase === "home" || state.phase === "done" || state.phase === "complete") {
      return;
    }
    if (state.timerRunning) {
      stopTimer();
      return;
    }
    if (state.timerRemaining <= 0) {
      state.timerRemaining = state.timerSeconds;
    }
    state.timerRunning = true;
    renderTimer();
    state.timerHandle = global.setInterval(() => {
      state.timerRemaining -= 1;
      if (state.timerRemaining <= 0) {
        state.timerRemaining = 0;
        stopTimer();
        showToast("时间到，请完成现在这句话。");
      } else {
        renderTimer();
      }
    }, 1000);
  }

  function adjustTimer(delta) {
    const next = Math.max(15, Math.min(300, state.timerRemaining + delta));
    state.timerRemaining = next;
    state.timerSeconds = Math.max(state.timerSeconds, next);
    renderTimer();
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    if (state.toastHandle !== null) {
      global.clearTimeout(state.toastHandle);
    }
    state.toastHandle = global.setTimeout(() => {
      elements.toast.classList.remove("is-visible");
      state.toastHandle = null;
    }, 2400);
  }

  function renderRoles(roles) {
    elements.roleAccordion.replaceChildren();
    roles.forEach((role, index) => {
      const card = document.createElement("div");
      card.className = "role-card";

      const letter = document.createElement("span");
      letter.className = "role-letter";
      letter.textContent = ["甲", "乙", "丙", "丁"][index] || String(index + 1);

      const copy = document.createElement("div");
      copy.className = "role-copy";
      const name = document.createElement("strong");
      name.textContent = role.name;
      const action = document.createElement("p");
      action.textContent = role.action;
      copy.append(name, action);
      card.append(letter, copy);
      elements.roleAccordion.appendChild(card);
    });
  }

  function renderLanguage(language) {
    elements.languageItems.replaceChildren();
    language.forEach((item) => {
      const phrase = document.createElement("span");
      phrase.textContent = item;
      elements.languageItems.appendChild(phrase);
    });
    elements.languageStrip.hidden = language.length === 0;
  }

  function updateAudience(delta) {
    const challenge = currentChallenge();
    if (!challenge || challenge.audience.length === 0) {
      return;
    }
    state.audienceIndex = (state.audienceIndex + delta + challenge.audience.length) % challenge.audience.length;
    elements.audiencePrompt.textContent = challenge.audience[state.audienceIndex];
  }

  function animateCard() {
    elements.challengeCard.classList.remove("card-refresh");
    void elements.challengeCard.offsetWidth;
    elements.challengeCard.classList.add("card-refresh");
  }

  function renderChallenge() {
    const challenge = currentChallenge();
    if (!challenge) {
      renderSessionComplete();
      return;
    }

    elements.challengeCard.classList.remove("session-complete");
    elements.challengeTitle.textContent = challenge.title;
    elements.challengeSituation.textContent = challenge.situation;
    elements.challengeGoal.textContent = challenge.goal;
    elements.challengeOutcome.textContent = challenge.outcome;
    renderRoles(challenge.roles);
    renderLanguage(challenge.language);
    elements.presentInstruction.textContent = challenge.presentation;
    state.audienceIndex = 0;
    elements.audiencePrompt.textContent = challenge.audience[0];
    elements.sessionProgress.textContent = "本轮 " + (state.currentIndex + 1) + " / " + state.queue.length + "　已完成 " + state.completed;
    animateCard();
    renderPhase();
  }

  function renderPhaseRail() {
    const activeIndex = phaseOrder.indexOf(state.phase);
    Array.from(elements.phaseRail.children).forEach((item, index) => {
      item.classList.toggle("is-active", state.phase !== "done" && index === activeIndex);
      item.classList.toggle("is-done", state.phase === "done" || (activeIndex > -1 && index < activeIndex));
    });
  }

  function renderPhase() {
    const challenge = currentChallenge();
    if (!challenge) {
      return;
    }

    elements.stageKicker.textContent = phaseLabels[state.phase];
    elements.changePanel.hidden = state.phase === "practice";
    elements.presentPanel.hidden = state.phase !== "present" && state.phase !== "done";

    if (state.condition) {
      elements.changeText.textContent = state.condition.change;
      elements.changeAction.textContent = state.condition.action;
    }

    if (state.phase === "practice") {
      elements.secondaryAction.textContent = "换一题";
      elements.primaryActionText.textContent = "下一步：看新情况";
      elements.continueHint.textContent = "两人先练好，再按这里";
    } else if (state.phase === "change") {
      elements.secondaryAction.textContent = "重新计时";
      elements.primaryActionText.textContent = "下一步：向全班说";
      elements.continueHint.textContent = "学生按新情况再练一次后，按这里";
    } else if (state.phase === "present") {
      elements.secondaryAction.textContent = "再练一次";
      elements.primaryActionText.textContent = "全班说完，让树长大";
      elements.continueHint.textContent = "全班说完以后，按这里";
    } else if (state.phase === "done") {
      elements.secondaryAction.textContent = "本题再说一次";
      elements.primaryActionText.textContent = state.currentIndex === state.queue.length - 1 ? "查看全班成果" : "下一题";
      elements.continueHint.textContent = "本题已经完成，可以继续";
    }

    renderPhaseRail();
    renderTimer();
  }

  function revealCondition() {
    if (state.phase !== "practice") {
      return;
    }
    const challenge = currentChallenge();
    state.condition = challenge.conditions[randomIndex(challenge.conditions.length)];
    state.phase = "change";
    setTimer(state.pack.defaultSeconds.change);
    renderPhase();
  }

  function enterPresentation() {
    if (state.phase !== "change") {
      if (state.phase === "practice") {
        showToast("请先看新情况，让学生再练一次。");
      }
      return;
    }
    state.phase = "present";
    setTimer(state.pack.defaultSeconds.present);
    renderPhase();
  }

  function completePresentation() {
    if (state.phase !== "present") {
      return;
    }
    stopTimer();
    state.phase = "done";
    state.completed += 1;
    elements.sessionProgress.textContent = "本轮 " + (state.currentIndex + 1) + " / " + state.queue.length + "　已完成 " + state.completed;
    renderGrowth(true);
    renderPhase();
    showToast("全班说完了，树长大了一点。");
  }

  function nextChallenge() {
    if (state.phase !== "done") {
      showToast("请先让学生向全班说，再进入下一题。");
      return;
    }
    if (state.currentIndex >= state.queue.length - 1) {
      renderSessionComplete();
      return;
    }
    state.currentIndex += 1;
    state.phase = "practice";
    state.condition = null;
    setTimer(state.pack.defaultSeconds.practice);
    renderChallenge();
  }

  function swapChallenge() {
    if (state.phase !== "practice" || state.queue.length - state.currentIndex <= 1) {
      showToast("这一轮没有其他新题了。");
      return;
    }
    const swapOffset = 1 + randomIndex(state.queue.length - state.currentIndex - 1);
    const swapIndex = state.currentIndex + swapOffset;
    const current = state.queue[state.currentIndex];
    state.queue[state.currentIndex] = state.queue[swapIndex];
    state.queue[swapIndex] = current;
    state.condition = null;
    setTimer(state.pack.defaultSeconds.practice);
    renderChallenge();
  }

  function repeatPresentation() {
    if (state.phase === "done") {
      state.phase = "present";
      state.completed = Math.max(0, state.completed - 1);
      renderGrowth(false);
    }
    setTimer(state.pack.defaultSeconds.present);
    renderPhase();
  }

  function handlePrimaryAction() {
    if (state.phase === "practice") {
      revealCondition();
    } else if (state.phase === "change") {
      enterPresentation();
    } else if (state.phase === "present") {
      completePresentation();
    } else if (state.phase === "done") {
      nextChallenge();
    } else if (state.phase === "complete") {
      returnHome();
    }
  }

  function handleSecondaryAction() {
    if (state.phase === "practice") {
      swapChallenge();
    } else if (state.phase === "change") {
      setTimer(state.pack.defaultSeconds.change);
    } else if (state.phase === "present" || state.phase === "done") {
      repeatPresentation();
    }
  }

  function growthStage() {
    if (state.queue.length === 0) {
      return 0;
    }
    return Math.round((state.completed / state.queue.length) * 6);
  }

  function growthSvg() {
    return [
      '<svg class="growth-tree-svg" viewBox="0 0 360 300" role="img" aria-label="全班口语任务成长树">',
      '<path class="tree-ground" d="M30 268c60-17 225-16 300 0"/>',
      '<g class="grow-piece" data-stage="0"><ellipse cx="164" cy="262" rx="12" ry="6" fill="#9a7354"/><path d="M164 260c0-7 1-10 4-14" fill="none" stroke="#765b47" stroke-width="3" stroke-linecap="round"/></g>',
      '<g class="grow-piece" data-stage="1"><path class="tree-trunk" d="M164 262c0-25 0-39 1-58"/><path class="tree-leaf" d="M165 224c-18 1-28-8-30-23 16-2 27 6 30 23Z"/><path class="tree-leaf" d="M165 211c16 0 24-8 26-21-15-1-24 7-26 21Z"/></g>',
      '<g class="grow-piece" data-stage="2"><path class="tree-trunk" d="M164 261c0-73-2-117 4-157"/><path class="tree-branch" d="M166 180l-37-36M166 161l39-42"/></g>',
      '<g class="grow-piece" data-stage="3"><path class="tree-branch" d="M165 142l-9-49M143 158l-34-6M189 138l38-11"/><path class="tree-leaf" d="M129 144c-30 1-46-15-47-39 26-2 43 13 47 39Z"/><path class="tree-leaf" d="M205 119c30 1 45-14 47-38-26-3-43 12-47 38Z"/><path class="tree-leaf" d="M157 98c-22-13-27-33-16-53 23 10 29 29 16 53Z"/></g>',
      '<g class="grow-piece" data-stage="4"><path class="tree-leaf" d="M109 153c-31 13-55 3-67-22 27-14 51-5 67 22Z"/><path class="tree-leaf" d="M221 138c32 12 55 1 65-24-28-12-51-2-65 24Z"/><path class="tree-leaf" d="M187 91c20-23 19-47-1-64-21 21-21 45 1 64Z"/><path class="tree-leaf" d="M127 103c-27-13-49-4-60 19 24 14 46 7 60-19Z"/></g>',
      '<g class="grow-piece" data-stage="5"><circle class="tree-flower" cx="89" cy="126" r="7"/><circle class="tree-flower" cx="145" cy="78" r="7"/><circle class="tree-flower" cx="205" cy="82" r="7"/><circle class="tree-flower" cx="244" cy="119" r="7"/></g>',
      '<g class="grow-piece" data-stage="6"><circle class="tree-fruit" cx="117" cy="119" r="8"/><circle class="tree-fruit" cx="177" cy="64" r="8"/><circle class="tree-fruit" cx="226" cy="108" r="8"/><circle class="tree-fruit" cx="76" cy="149" r="8"/></g>',
      '</svg>'
    ].join("");
  }

  function renderGrowth(celebrate) {
    if (!elements.growthScene.firstChild) {
      elements.growthScene.innerHTML = growthSvg();
      const pug = document.createElement("img");
      pug.className = "pug-photo";
      pug.src = "assets/pug-realistic.png";
      pug.alt = "一只坐在树旁的真实巴哥犬";
      elements.growthScene.appendChild(pug);
    }
    const stage = growthStage();
    elements.growthScene.querySelectorAll("[data-stage]").forEach((piece) => {
      piece.classList.toggle("is-grown", Number(piece.dataset.stage) <= stage);
    });
    elements.growthDots.style.setProperty("--dot-count", String(Math.max(1, state.queue.length)));
    elements.growthDots.replaceChildren();
    state.queue.forEach((item, index) => {
      const dot = document.createElement("span");
      dot.classList.toggle("is-grown", index < state.completed);
      elements.growthDots.appendChild(dot);
    });
    elements.growthLine.textContent = "完成 " + state.completed + " / " + state.queue.length + " 题";

    const card = elements.growthScene.closest(".growth-card");
    if (celebrate) {
      card.classList.remove("is-celebrating");
      void card.offsetWidth;
      card.classList.add("is-celebrating");
      global.setTimeout(() => card.classList.remove("is-celebrating"), 1700);
    }
  }

  function renderSessionComplete() {
    stopTimer();
    state.phase = "complete";
    elements.sessionProgress.textContent = "全部完成　" + state.completed + " / " + state.queue.length;
    elements.stageKicker.textContent = "全班共同完成";
    elements.challengeTitle.textContent = "今天的表达已经长成一棵树";
    elements.challengeSituation.textContent = "你们完成了两人练习、根据新情况再练，也向全班说了。请一起说出今天最有用的一句话。";
    renderRoles([
      { name: "全班回想", action: "哪一个新情况最难回答？" },
      { name: "全班带走", action: "下一次你还想用哪一句话？" }
    ]);
    elements.challengeGoal.textContent = "每组说出一句今天真正用过的话。";
    elements.challengeOutcome.textContent = "全班共同完成的口语成果";
    renderLanguage([]);
    elements.changePanel.hidden = true;
    elements.presentPanel.hidden = true;
    Array.from(elements.phaseRail.children).forEach((item) => {
      item.classList.remove("is-active");
      item.classList.add("is-done");
    });
    elements.secondaryAction.textContent = "成长树已完成";
    elements.primaryActionText.textContent = "回到开始";
    elements.continueHint.textContent = "本轮练习结束";
    elements.secondaryAction.disabled = true;
    elements.primaryAction.disabled = false;
    elements.timerStatus.textContent = "本轮完成";
    elements.timerDisplay.textContent = "完成";
    animateCard();
    renderGrowth(true);
  }

  function startSession(packId, rounds) {
    const pack = registry.packs.find((item) => item.id === packId) || registry.packs[0];
    const safeRounds = Math.max(1, Math.min(Number(rounds) || 4, pack.challenges.length));
    state.pack = pack;
    state.queue = shuffled(pack.challenges).slice(0, safeRounds);
    state.currentIndex = 0;
    state.completed = 0;
    state.phase = "practice";
    state.condition = null;
    elements.secondaryAction.disabled = false;
    elements.primaryAction.disabled = false;
    elements.sessionPack.textContent = pack.title + "｜" + pack.stage;
    elements.growthScene.replaceChildren();
    safeStorageSet("speaking-challenge-pack", pack.id);
    setView("game");
    setTimer(pack.defaultSeconds.practice);
    renderGrowth(false);
    renderChallenge();
  }

  function returnHome() {
    stopTimer();
    state.phase = "home";
    setView("home");
  }

  function toggleFullscreen() {
    const root = document.documentElement;
    const active = document.fullscreenElement || document.webkitFullscreenElement;
    let request;
    if (active) {
      request = document.exitFullscreen ? document.exitFullscreen() : document.webkitExitFullscreen && document.webkitExitFullscreen();
    } else {
      request = root.requestFullscreen ? root.requestFullscreen() : root.webkitRequestFullscreen && root.webkitRequestFullscreen();
    }
    if (request && typeof request.catch === "function") {
      request.catch(() => showToast("浏览器没有进入全屏，请再按一次全屏按钮。"));
    }
  }

  function showHelp() {
    if (typeof elements.helpDialog.showModal === "function") {
      elements.helpDialog.showModal();
    } else {
      elements.helpDialog.setAttribute("open", "");
    }
  }

  function closeHelp() {
    if (typeof elements.helpDialog.close === "function") {
      elements.helpDialog.close();
    } else {
      elements.helpDialog.removeAttribute("open");
    }
  }

  elements.launchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    startSession(elements.packSelect.value, elements.roundSelect.value);
  });
  elements.homeButton.addEventListener("click", returnHome);
  elements.helpButton.addEventListener("click", showHelp);
  elements.closeHelp.addEventListener("click", closeHelp);
  elements.fullscreenButton.addEventListener("click", toggleFullscreen);
  elements.primaryAction.addEventListener("click", handlePrimaryAction);
  elements.secondaryAction.addEventListener("click", handleSecondaryAction);
  elements.timerButton.addEventListener("click", toggleTimer);
  elements.minusTime.addEventListener("click", () => adjustTimer(-15));
  elements.plusTime.addEventListener("click", () => adjustTimer(15));
  elements.resetTimer.addEventListener("click", () => setTimer(currentPhaseSeconds()));
  elements.audiencePrev.addEventListener("click", () => updateAudience(-1));
  elements.audienceNext.addEventListener("click", () => updateAudience(1));

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const isFormControl = target instanceof global.HTMLInputElement || target instanceof global.HTMLSelectElement || target instanceof global.HTMLTextAreaElement;
    if (isFormControl || elements.helpDialog.open) {
      return;
    }
    const key = event.key.toLowerCase();
    if (event.code === "Space") {
      event.preventDefault();
      toggleTimer();
    } else if (key === "c") {
      revealCondition();
    } else if (key === "p") {
      enterPresentation();
    } else if (key === "n") {
      nextChallenge();
    } else if (key === "r") {
      setTimer(currentPhaseSeconds());
    } else if (key === "f") {
      toggleFullscreen();
    }
  });

  populatePackSelect();
  renderTimer();
})(window, document);
