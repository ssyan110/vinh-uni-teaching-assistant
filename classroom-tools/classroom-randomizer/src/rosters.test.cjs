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
    LT_01: 27,
    LT_02: 30,
    LT_03: 14
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
