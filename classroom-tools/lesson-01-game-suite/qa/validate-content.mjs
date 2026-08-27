import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const projectRoot = path.resolve(root, "..", "..");
const canonicalPath = path.join(projectRoot, "work", "boya-intermediate", "extractions", "structured-lesson-01.json");
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function collectRecordIds(value, ids = new Set()) {
  if (Array.isArray(value)) value.forEach((item) => collectRecordIds(item, ids));
  else if (value && typeof value === "object") {
    if (typeof value.record_id === "string") ids.add(value.record_id);
    Object.values(value).forEach((item) => collectRecordIds(item, ids));
  }
  return ids;
}

function collectSourceRefs(value, refs = []) {
  if (Array.isArray(value)) value.forEach((item) => collectSourceRefs(item, refs));
  else if (value && typeof value === "object") {
    if (Array.isArray(value.sourceRefs)) refs.push(...value.sourceRefs);
    Object.values(value).forEach((item) => collectSourceRefs(item, refs));
  }
  return refs;
}

function loadPacks() {
  const context = vm.createContext({ window: {} });
  for (const file of ["registry.js", "lesson-01.js"]) {
    vm.runInContext(fs.readFileSync(path.join(root, "content", file), "utf8"), context, { filename: file });
  }
  return context.window.ClassroomGameSuite.packs;
}

const canonical = JSON.parse(fs.readFileSync(canonicalPath, "utf8"));
const canonicalIds = collectRecordIds(canonical);
const packs = loadPacks();
const packIds = new Set();
const modeIds = new Set();

assert(packs.length === 2, "第一课必须有两个按学习阶段隔离的内容包");

for (const pack of packs) {
  assert(!packIds.has(pack.id), `内容包编号重复：${pack.id}`);
  packIds.add(pack.id);
  assert(pack.schemaVersion === 1, `${pack.id} 的 schemaVersion 必须是 1`);
  assert(pack.lessonId === "lesson-01", `${pack.id} 必须属于 lesson-01`);
  assert(pack.status === "approved", `${pack.id} 必须明确标记为 approved`);
  assert(Array.isArray(pack.allowedSourceRefs) && pack.allowedSourceRefs.length > 0, `${pack.id} 缺少 allowedSourceRefs`);
  const allowed = new Set(pack.allowedSourceRefs);
  for (const ref of allowed) assert(canonicalIds.has(ref), `${pack.id} 使用不存在的来源编号：${ref}`);
  const expectedModes = ["randomSpeaking", "situationChanged", "openBox", "teamBoard", "rankDefend", "detective", "mission", "retrieval"];
  for (const modeId of expectedModes) {
    assert(pack.modes && pack.modes[modeId], `${pack.id} 缺少 ${modeId}`);
    if (!pack.modes || !pack.modes[modeId]) continue;
    assert(!modeIds.has(`${pack.id}/${modeId}`), `模式编号重复：${pack.id}/${modeId}`);
    modeIds.add(`${pack.id}/${modeId}`);
  }
  const modeCounts = {
    randomSpeaking: pack.modes.randomSpeaking.items.length,
    situationChanged: pack.modes.situationChanged.items.length,
    openBox: pack.modes.openBox.items.length,
    teamBoard: pack.modes.teamBoard.categories.reduce((sum, category) => sum + category.items.length, 0),
    rankDefend: pack.modes.rankDefend.items.length,
    detective: pack.modes.detective.items.length,
    mission: pack.modes.mission.items.length,
    retrieval: pack.modes.retrieval.items.length
  };
  for (const [modeId, count] of Object.entries(modeCounts)) assert(count >= 2, `${pack.id}/${modeId} 内容太少：${count}`);
  assert(pack.modes.randomSpeaking.items.length >= 8, `${pack.id}/randomSpeaking 至少需要 8 题`);
  assert(pack.modes.situationChanged.items.length >= 8, `${pack.id}/situationChanged 至少需要 8 题`);
  assert(pack.modes.openBox.items.length >= 8, `${pack.id}/openBox 至少需要 8 格`);
  assert(pack.modes.teamBoard.categories.length === 4, `${pack.id}/teamBoard 必须有 4 个分类`);
  assert(pack.modes.detective.items.length >= 6, `${pack.id}/detective 至少需要 6 题`);
  assert(pack.modes.mission.items.length >= 3, `${pack.id}/mission 至少需要 3 个任务`);

  const refs = collectSourceRefs(pack.modes);
  for (const ref of refs) {
    assert(canonicalIds.has(ref), `${pack.id} 使用不存在的来源编号：${ref}`);
    assert(allowed.has(ref), `${pack.id} 的来源 ${ref} 不在本包允许范围内`);
  }
  const allText = JSON.stringify(pack.modes);
  if (pack.id === "lesson-01-early") {
    for (const forbidden of ["不然", "是……还是……", "怎么……怎么……", "谐音", "单姓", "复姓", "尊称", "百家姓"]) {
      assert(!allText.includes(forbidden), `${pack.id} 提前出现后续内容：${forbidden}`);
    }
    for (const ref of pack.allowedSourceRefs) {
      assert(!/^E01-0(?:1[3-9]|2\d|3\d)$/.test(ref), `${pack.id} 提前使用后续练习：${ref}`);
      assert(!/^G01-00[5-7]$/.test(ref), `${pack.id} 提前使用后续句式：${ref}`);
    }
  }
}

if (failures.length) {
  console.error(`内容检查失败，共 ${failures.length} 项：`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  const modeCount = packs.length * 8;
  console.log(`内容检查通过：${packs.length} 个阶段内容包，${modeCount} 个游戏模式，来源编号与阶段边界有效。`);
}
