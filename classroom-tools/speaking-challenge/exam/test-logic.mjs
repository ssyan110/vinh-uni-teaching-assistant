import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { choose, createMachine } = require('./logic.js');
const questions = [{ id: 'Q01' }, { id: 'Q02' }];
const pictures = [{ id: 'B01' }, { id: 'B02' }];

test('random selection covers the first and last valid indices', () => {
  assert.equal(choose(questions, () => 0), questions[0]);
  assert.equal(choose(questions, () => 0.999999), questions[1]);
  assert.throws(() => choose([], () => 0), /为空/);
  assert.throws(() => choose(questions, () => 1), /\[0, 1\)/);
});

test('draw locks the machine until preparation and speaking finish, then resets', () => {
  const values = [0, 0.999999, 0.999999, 0];
  const machine = createMachine({ questions, pictures, random: () => values.shift() });
  const drawn = machine.dispatch('draw', 0);
  assert.equal(drawn.phase, 'drawing');
  assert.equal(drawn.question.id, 'Q01');
  assert.equal(drawn.picture.id, 'B02');
  assert.equal(machine.dispatch('draw', 1).phase, 'drawing');
  assert.equal(machine.dispatch('prepare', 1).phase, 'drawing');
  assert.equal(machine.dispatch('reveal', 1600).phase, 'selected');
  assert.equal(machine.dispatch('prepare', 2000).deadline, 62_000);
  assert.equal(machine.dispatch('draw', 3000).phase, 'preparing');
  assert.equal(machine.dispatch('tick', 62_000).phase, 'speaking');
  assert.equal(machine.getRemaining(62_000), 120_000);
  assert.equal(machine.dispatch('tick', 182_000).phase, 'complete');
  assert.equal(machine.dispatch('draw', 183_000).phase, 'complete');
  assert.equal(machine.dispatch('next', 183_000).phase, 'ready');
  const next = machine.dispatch('draw', 184_000);
  assert.equal(next.question.id, 'Q02');
  assert.equal(next.picture.id, 'B01');
});

test('pause freezes remaining time and resume uses a new wall-clock deadline', () => {
  const machine = createMachine({ questions, pictures, random: () => 0 });
  machine.dispatch('draw', 0);
  machine.dispatch('reveal', 1600);
  machine.dispatch('prepare', 2000);
  const paused = machine.dispatch('pause', 12_000);
  assert.equal(paused.phase, 'preparing');
  assert.equal(machine.getRemaining(80_000), 50_000);
  const resumed = machine.dispatch('resume', 80_000);
  assert.equal(resumed.deadline, 130_000);
  assert.equal(machine.dispatch('tick', 129_999).phase, 'preparing');
  assert.equal(machine.dispatch('tick', 130_000).phase, 'speaking');
});

test('skip preparation starts the full answer timer and early finish completes the round', () => {
  const machine = createMachine({ questions, pictures, random: () => 0 });
  machine.dispatch('draw', 0);
  machine.dispatch('reveal', 1600);
  machine.dispatch('prepare', 2000);
  const speaking = machine.dispatch('skipPreparation', 5000);
  assert.equal(speaking.phase, 'speaking');
  assert.equal(speaking.deadline, 125_000);
  assert.equal(machine.getRemaining(5000), 120_000);
  assert.equal(machine.dispatch('finishSpeaking', 6000).phase, 'complete');
  assert.equal(machine.getRemaining(6000), null);
});

test('skip preparation is available immediately after the draw', () => {
  const machine = createMachine({ questions, pictures, random: () => 0 });
  machine.dispatch('draw', 0);
  machine.dispatch('reveal', 1600);
  const speaking = machine.dispatch('skipPreparation', 2000);
  assert.equal(speaking.phase, 'speaking');
  assert.equal(speaking.deadline, 122_000);
});

test('skip preparation while paused keeps the answer timer paused until resumed', () => {
  const machine = createMachine({ questions, pictures, random: () => 0 });
  machine.dispatch('draw', 0);
  machine.dispatch('reveal', 1600);
  machine.dispatch('prepare', 2000);
  machine.dispatch('pause', 12_000);
  const speaking = machine.dispatch('skipPreparation', 20_000);
  assert.equal(speaking.phase, 'speaking');
  assert.equal(speaking.deadline, null);
  assert.equal(speaking.pausedRemaining, 120_000);
  assert.equal(machine.dispatch('tick', 200_000).phase, 'speaking');
  assert.equal(machine.dispatch('resume', 300_000).deadline, 420_000);
  assert.equal(machine.dispatch('finishSpeaking').phase, 'complete');
});

test('a hidden-page time jump catches up through both deadlines', () => {
  const machine = createMachine({ questions, pictures, random: () => 0 });
  machine.dispatch('draw', 0);
  machine.dispatch('reveal', 1600);
  machine.dispatch('prepare', 1000);
  assert.equal(machine.dispatch('tick', 300_000).phase, 'complete');
});
