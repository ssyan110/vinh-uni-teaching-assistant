const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadRosters() {
  const source = fs.readFileSync(path.join(__dirname, "..", "..", "private", "vinh-rosters.js"), "utf8");
  const sandbox = {};
  vm.runInNewContext(source, sandbox, { filename: "vinh-rosters.js" });
  return sandbox.RandomizerRosters;
}

test("the three built-in class rosters are complete and uniquely identified", () => {
  const rosters = loadRosters().classes;
  assert.deepEqual(Object.fromEntries(Object.entries(rosters).map(([id, list]) => [id, list.length])), {
    LT_01: 26,
    LT_02: 25,
    LT_03: 20
  });

  const allCodes = [];
  for (const students of Object.values(rosters)) {
    const codes = students.map((student) => student.studentCode);
    assert.equal(new Set(codes).size, codes.length);
    students.forEach((student) => {
      assert.ok(student.name);
      assert.ok(student.seatNumber);
    });
    allCodes.push(...codes);
  }
  assert.equal(new Set(allCodes).size, allCodes.length);
});

test("same-name students remain separate when their student codes differ", () => {
  const students = loadRosters().classes.LT_03.filter((student) => student.name === "Trần Thị Hải Yến");
  assert.equal(students.length, 2);
  assert.notEqual(students[0].studentCode, students[1].studentCode);
});

test('new-class setup fetches the current roster instead of restoring a historical snapshot', async () => {
  const vm = require('node:vm');
  const source = require('node:fs').readFileSync(require.resolve('../app.js'), 'utf8');
  const functions = ['prepareStartFromState', 'loadBuiltInRoster', 'loadCloudRoster'].map(name => {
    const start = source.indexOf(`  ${name === 'loadCloudRoster' ? 'async ' : ''}function ${name}(`);
    return source.slice(start, source.indexOf('\n  function ', start + 1));
  }).join('\n');
  const elements = {
    classNameInput: { value: 'LT_02' }, dateInput: {}, taskModeInput: {}, taskTargetInput: {},
    rosterInput: { value: 'old roster' }, rosterSource: {}
  };
  let resolveRoster;
  const context = {
    state: { session: { className: 'LT_02' }, roster: Array(30).fill({}) }, elements,
    Model: {}, today: () => '2026-09-28', populateClassOptions: () => {}, populateTextbookOptions: () => {},
    rosterEdited: false, rosterLoadId: 0, cloudRosterByClass: {},
    updateRosterCount: () => {}, showToast: () => {}, rosterToText: roster => String(roster.length),
    global: { RandomizerCloud: { isSignedIn: () => true, fetchClassRoster: async (_id, options) => {
      assert.equal(options.force, true);
      return new Promise(resolve => { resolveRoster = resolve; });
    } } }
  };
  vm.createContext(context);
  vm.runInContext(functions + '\nprepareStartFromState();', context);
  assert.equal(elements.rosterInput.value, '');
  resolveRoster({ roster: Array(25).fill({}) });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(elements.rosterInput.value, '25');
  const loading = vm.runInContext('loadCloudRoster("LT_02")', context);
  context.rosterEdited = true;
  elements.rosterInput.value = 'manual edit';
  resolveRoster({ roster: Array(25).fill({}) });
  await loading;
  assert.equal(elements.rosterInput.value, 'manual edit');
});
