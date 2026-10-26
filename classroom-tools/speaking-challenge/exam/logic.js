(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ExamLogic = api;
})(typeof globalThis === 'undefined' ? this : globalThis, function () {
  'use strict';

  function choose(items, random) {
    if (!Array.isArray(items) || items.length === 0) throw new Error('题目内容为空');
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError('随机值必须在 [0, 1)');
    return items[Math.floor(value * items.length)];
  }

  function createMachine(options) {
    const questions = options.questions || [];
    const pictures = options.pictures || [];
    const random = options.random || Math.random;
    const prepMs = options.prepMs || 60_000;
    const speakMs = options.speakMs || 120_000;
    let state = { phase: 'ready', question: null, picture: null, deadline: null, pausedRemaining: null };

    function advance(now) {
      while (state.pausedRemaining === null && state.deadline !== null && now >= state.deadline) {
        if (state.phase === 'preparing') {
          state.phase = 'speaking';
          state.deadline += speakMs;
        } else if (state.phase === 'speaking') {
          state.phase = 'complete';
          state.deadline = null;
        } else break;
      }
    }

    function snapshot() { return { ...state }; }

    function dispatch(action, now) {
      now = Number.isFinite(now) ? now : Date.now();
      if (action === 'tick') advance(now);
      else if (action === 'draw' && state.phase === 'ready') {
        state = { phase: 'drawing', question: choose(questions, random), picture: choose(pictures, random), deadline: null, pausedRemaining: null };
      } else if (action === 'reveal' && state.phase === 'drawing') state.phase = 'selected';
      else if (action === 'prepare' && state.phase === 'selected') {
        state.phase = 'preparing';
        state.deadline = now + prepMs;
      } else if (action === 'skipPreparation' && ['selected', 'preparing'].includes(state.phase)) {
        state.phase = 'speaking';
        if (state.pausedRemaining === null) state.deadline = now + speakMs;
        else {
          state.deadline = null;
          state.pausedRemaining = speakMs;
        }
      } else if (action === 'finishSpeaking' && state.phase === 'speaking') {
        state.phase = 'complete';
        state.deadline = null;
        state.pausedRemaining = null;
      } else if (action === 'pause' && state.pausedRemaining === null && ['preparing', 'speaking'].includes(state.phase)) {
        advance(now);
        if (['preparing', 'speaking'].includes(state.phase)) state.pausedRemaining = Math.max(0, state.deadline - now);
      } else if (action === 'resume' && state.pausedRemaining !== null) {
        const remaining = state.pausedRemaining;
        state.pausedRemaining = null;
        state.deadline = now + remaining;
        advance(now);
      } else if (action === 'next' && state.phase === 'complete') {
        state = { phase: 'ready', question: null, picture: null, deadline: null, pausedRemaining: null };
      }
      return snapshot();
    }

    function remaining(now) {
      if (state.pausedRemaining !== null) return state.pausedRemaining;
      if (!['preparing', 'speaking'].includes(state.phase) || state.deadline === null) return null;
      return Math.max(0, state.deadline - (Number.isFinite(now) ? now : Date.now()));
    }

    return { dispatch, getState: snapshot, getRemaining: remaining };
  }

  return { choose, createMachine };
});
