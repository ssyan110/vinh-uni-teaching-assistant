(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const mainAction = $('mainAction');
  const pauseAction = $('pauseAction');
  const skipAction = $('skipAction');
  const questionBody = $('questionCardBody');
  const pictureBody = $('pictureCardBody');
  const status = $('examStatus');
  const timer = $('timer');
  const phaseLabel = $('phaseLabel');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let machine;
  let ready = false;
  let drawTimer = null;
  let drawDeadline = null;
  let clockTimer = null;
  let drawToken = 0;
  let clockToken = 0;
  let preloadedPictures = new Map();

  function setStatus(message) { status.textContent = message; }

  function formatTime(milliseconds) {
    const seconds = Math.ceil(milliseconds / 1000);
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }

  function placeholder(target, text, className) {
    const node = document.createElement('p');
    node.className = className || 'draw-placeholder';
    node.textContent = text;
    target.replaceChildren(node);
    return node;
  }

  function clearTimer() {
    clockToken += 1;
    if (clockTimer !== null) window.clearTimeout(clockTimer);
    clockTimer = null;
  }

  function clearDraw() {
    drawToken += 1;
    if (drawTimer !== null) window.clearTimeout(drawTimer);
    drawTimer = null;
    drawDeadline = null;
  }

  function setStep(phase) {
    const active = phase === 'selected' ? 'preparing' : phase === 'ready' || phase === 'drawing' ? 'draw' : phase;
    for (const step of document.querySelectorAll('[data-step]')) {
      const order = ['draw', 'preparing', 'speaking'];
      const current = order.indexOf(step.dataset.step);
      const activeIndex = order.indexOf(active);
      step.classList.toggle('is-current', step.dataset.step === active);
      step.classList.toggle('is-done', current < activeIndex);
    }
  }

  function showQuestion(question) {
    $('questionTag').textContent = `问题 ${question.id}`;
    const prompt = document.createElement('p');
    prompt.className = 'question-prompt';
    const parts = question.prompt.match(/^(.*?)(为什么[^？]*？)$/);
    if (parts) {
      const reason = document.createElement('span');
      reason.className = 'question-reason';
      reason.textContent = parts[2];
      prompt.append(document.createTextNode(parts[1]), reason);
    } else prompt.textContent = question.prompt;
    const hints = document.createElement('ul');
    hints.className = 'question-hints';
    hints.setAttribute('aria-label', '可选提示，不用全答');
    for (const hint of question.hints) {
      const item = document.createElement('li');
      item.textContent = hint;
      hints.append(item);
    }
    questionBody.replaceChildren(prompt, ...(question.hints.length ? [hints] : []));
    questionBody.classList.remove('is-shuffling');
  }

  function showPicture(picture) {
    $('pictureTag').textContent = `图片 ${picture.id}`;
    const image = preloadedPictures.get(picture.id);
    if (!image) throw new Error(`图片未预载：${picture.src}`);
    pictureBody.replaceChildren(image);
    pictureBody.classList.remove('is-shuffling');
  }

  function showShuffle(target, kind) {
    const stack = document.createElement('div');
    stack.className = 'shuffle-stack';
    stack.setAttribute('aria-hidden', 'true');
    for (const position of ['back-one', 'back-two', 'front']) {
      const card = document.createElement('div');
      card.className = `shuffle-card ${position}`;
      if (position === 'front') {
        const mark = document.createElement('span');
        if (kind === 'question') {
          mark.className = 'shuffle-mark';
          mark.textContent = '？';
        } else mark.className = 'picture-mark';
        card.append(mark);
      }
      stack.append(card);
    }
    target.replaceChildren(stack);
    target.classList.add('is-shuffling');
  }

  function render() {
    if (!machine) return;
    const state = machine.getState();
    setStep(state.phase);
    mainAction.disabled = !ready || ['drawing', 'preparing', 'speaking'].includes(state.phase);
    pauseAction.hidden = !['preparing', 'speaking'].includes(state.phase);
    pauseAction.textContent = state.pausedRemaining === null ? '暂停' : '继续';
    skipAction.hidden = !['selected', 'preparing', 'speaking'].includes(state.phase);
    skipAction.textContent = state.phase === 'speaking' ? '结束回答' : '跳过准备';

    if (state.phase === 'ready') {
      mainAction.textContent = '开始抽题';
      phaseLabel.textContent = '等待抽题';
      timer.textContent = '—:—';
    } else if (state.phase === 'drawing') {
      mainAction.textContent = '抽题中…';
      phaseLabel.textContent = '正在抽题';
      timer.textContent = '—:—';
    } else if (state.phase === 'selected') {
      mainAction.textContent = '开始准备';
      phaseLabel.textContent = '准备时间';
      timer.textContent = '01:00';
    } else if (state.phase === 'preparing' || state.phase === 'speaking') {
      mainAction.textContent = state.phase === 'preparing' ? '准备中' : '回答中';
      phaseLabel.textContent = state.phase === 'preparing' ? '准备剩余' : '回答剩余';
      timer.textContent = formatTime(machine.getRemaining());
    } else if (state.phase === 'complete') {
      mainAction.textContent = '再练一题';
      phaseLabel.textContent = '本次练习结束';
      timer.textContent = '00:00';
    }
  }

  function scheduleClock() {
    clearTimer();
    const state = machine.getState();
    if (!['preparing', 'speaking'].includes(state.phase) || state.pausedRemaining !== null) return;
    const remaining = machine.getRemaining();
    const delay = remaining <= 0 ? 0 : (remaining % 1000 || 1000);
    const token = clockToken;
    clockTimer = window.setTimeout(() => {
      if (token !== clockToken) return;
      machine.dispatch('tick', Date.now());
      render();
      const next = machine.getState();
      if (next.phase === 'speaking' && state.phase === 'preparing') setStatus('准备结束，现在开始回答。');
      if (next.phase === 'complete') setStatus('本次练习结束，可以再练一题。');
      scheduleClock();
    }, delay);
  }

  function revealAfterDraw() {
    clearDraw();
    const state = machine.dispatch('reveal');
    if (state.phase !== 'selected') return;
    showQuestion(state.question);
    showPicture(state.picture);
    setStatus('题目和图片已抽出。按“开始准备”后计时。');
    render();
  }

  function onMainAction() {
    if (!machine || !ready) return;
    const state = machine.getState();
    if (state.phase === 'ready') {
      const selected = machine.dispatch('draw');
      if (selected.phase !== 'drawing') return;
      clearDraw();
      showShuffle(questionBody, 'question');
      showShuffle(pictureBody, 'picture');
      setStatus('正在同时抽取问题和图片…');
      render();
      const token = drawToken;
      drawDeadline = Date.now() + (reducedMotion.matches ? 0 : 1600);
      drawTimer = window.setTimeout(() => {
        if (token === drawToken) revealAfterDraw();
      }, Math.max(0, drawDeadline - Date.now()));
    } else if (state.phase === 'selected') {
      machine.dispatch('prepare', Date.now());
      setStatus('准备开始。剩余时间结束后自动进入回答。');
      render();
      scheduleClock();
    } else if (state.phase === 'complete') {
      clearTimer();
      clearDraw();
      machine.dispatch('next');
      $('questionTag').textContent = '问题 —';
      $('pictureTag').textContent = '图片 —';
      questionBody.classList.remove('is-shuffling');
      pictureBody.classList.remove('is-shuffling');
      placeholder(questionBody, '问题将在抽题后显示');
      placeholder(pictureBody, '图片将在抽题后显示', 'draw-placeholder picture-placeholder');
      setStatus('正在准备下一次练习。');
      render();
      onMainAction();
    }
  }

  function onPauseAction() {
    if (!machine) return;
    const state = machine.getState();
    if (state.pausedRemaining === null) machine.dispatch('pause', Date.now());
    else machine.dispatch('resume', Date.now());
    const next = machine.getState();
    setStatus(next.phase === 'complete' ? '本次练习结束，可以再练一题。' : next.pausedRemaining === null ? '计时继续。' : '计时已暂停。');
    render();
    scheduleClock();
  }

  function onSkipAction() {
    if (!machine) return;
    const phase = machine.getState().phase;
    if (phase === 'selected' || phase === 'preparing') {
      const next = machine.dispatch('skipPreparation', Date.now());
      setStatus(next.pausedRemaining === null ? '已跳过准备时间，现在开始回答。' : '已跳过准备时间，继续计时后开始回答。');
    } else if (phase === 'speaking') {
      clearTimer();
      machine.dispatch('finishSpeaking');
      setStatus('回答已结束，可以再练一题。');
    } else return;
    render();
    scheduleClock();
  }

  async function loadBank() {
    const bank = window.ORAL_EXAM_BANK;
    if (!bank || !Array.isArray(bank.questions) || !bank.questions.length || !Array.isArray(bank.pictures) || !bank.pictures.length) {
      throw new Error('没有找到完整题库。请确认 content.js 已载入，并包含 questions 与 pictures。');
    }
    for (const [index, item] of bank.questions.entries()) {
      if (!item || !item.id || !item.title || !item.prompt || !Array.isArray(item.hints) || item.hints.some((hint) => typeof hint !== 'string' || !hint.trim())) {
        throw new Error(`问题题库第 ${index + 1} 项资料不完整；每题须有 id、title、prompt 和 hints 数组（可为空）。`);
      }
    }
    for (const [index, item] of bank.pictures.entries()) {
      if (!item || !item.id || !item.title || !item.src || !item.alt) throw new Error(`图片题库第 ${index + 1} 项资料不完整；每张图片须有 id、title、src 和 alt。`);
    }
    const results = await Promise.all(bank.pictures.map(async (picture) => {
      const image = new Image();
      image.src = picture.src;
      if (typeof image.decode === 'function') {
        try { await image.decode(); }
        catch { throw new Error(`图片载入或解码失败：${picture.src}`); }
      } else await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error(`图片载入失败：${picture.src}`));
      });
      if (!image.naturalWidth || !image.naturalHeight) throw new Error(`图片无有效尺寸：${picture.src}`);
      image.className = 'picture-visual is-visible';
      image.alt = picture.alt;
      return [picture.id, image];
    }));
    if (results.length !== bank.pictures.length) throw new Error('图片尚未全部准备完成。');
    preloadedPictures = new Map(results);
    machine = window.ExamLogic.createMachine({ questions: bank.questions, pictures: bank.pictures });
    ready = true;
    mainAction.disabled = false;
    setStatus(`题目与 ${results.length} 张图片已准备好。`);
    render();
  }

  mainAction.addEventListener('click', onMainAction);
  pauseAction.addEventListener('click', onPauseAction);
  skipAction.addEventListener('click', onSkipAction);
  document.addEventListener('visibilitychange', () => {
    if (!machine) return;
    if (machine.getState().phase === 'drawing' && drawDeadline !== null && Date.now() >= drawDeadline) {
      revealAfterDraw();
      return;
    }
    machine.dispatch('tick', Date.now());
    render();
    scheduleClock();
    if (!document.hidden) {
      const state = machine.getState();
      if (state.phase === 'speaking') setStatus('页面已返回，计时已按实际时间更新。');
      else if (state.phase === 'complete') setStatus('本次练习结束，可以再练一题。');
    }
  });

  loadBank().catch((error) => {
    ready = false;
    mainAction.disabled = true;
    mainAction.textContent = '无法开始';
    setStatus(error.message);
  });
})();
