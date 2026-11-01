import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createMachine } = require('./logic.js');
const questions = [{ id: 'Q01' }, { id: 'Q02' }];
const pictures = [{ id: 'B01' }, { id: 'B02' }];

test('draws a question, gives one minute each for preparation and response, then draws a picture for the same timing', () => {
  const values = [0, 0.999999];
  const machine = createMachine({ questions, pictures, random: () => values.shift() });
  let state = machine.dispatch('draw', 0);
  assert.equal(state.phase, 'drawing');
  assert.equal(state.stage, 'question');
  assert.equal(state.question.id, 'Q01');
  assert.equal(state.picture, null);
  state = machine.dispatch('reveal', 1600);
  assert.equal(state.phase, 'selected');
  state = machine.dispatch('prepare', 2000);
  assert.equal(state.deadline, 62_000);
  assert.equal(machine.dispatch('tick', 62_000).phase, 'speaking');
  assert.equal(machine.getRemaining(62_000), 60_000);
  state = machine.dispatch('tick', 122_000);
  assert.equal(state.phase, 'drawing');
  assert.equal(state.stage, 'picture');
  assert.equal(state.picture.id, 'B02');
  state = machine.dispatch('reveal', 123_600);
  assert.equal(state.phase, 'selected');
  machine.dispatch('prepare', 124_000);
  assert.equal(machine.dispatch('tick', 184_000).phase, 'speaking');
  assert.equal(machine.getRemaining(184_000), 60_000);
  assert.equal(machine.dispatch('tick', 244_000).phase, 'complete');
});

test('pause and resume preserve remaining time within either task', () => {
  const machine = createMachine({ questions, pictures, random: () => 0 });
  machine.dispatch('draw', 0);
  machine.dispatch('reveal', 1000);
  machine.dispatch('prepare', 2000);
  machine.dispatch('tick', 62_000);
  const paused = machine.dispatch('pause', 72_000);
  assert.equal(paused.phase, 'speaking');
  assert.equal(machine.getRemaining(200_000), 50_000);
  assert.equal(machine.dispatch('resume', 200_000).deadline, 250_000);
});
