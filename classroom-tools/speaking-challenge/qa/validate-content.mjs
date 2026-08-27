import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const projectRoot = path.resolve(root, "..", "..");
const contentDir = path.join(root, "content");
const canonicalPath = path.join(projectRoot, "work", "boya-intermediate", "extractions", "structured-lesson-01.json");
const pugPath = path.join(root, "assets", "pug-realistic.png");
const priorLanguagePath = path.join(root, "reference", "prior-boya-i-ii-language-baseline.csv");
const priorLanguageSha256 = "70c4ec89cf3c471eabaa76e8ec631819b9800f55eb68a9715a4ccd2f9eeedb4f";
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function loadPacks() {
  const context = vm.createContext({ window: {} });
  const files = [
    "registry.js",
    ...fs.readdirSync(contentDir).filter((name) => name.endsWith(".js") && name !== "registry.js").sort()
  ];
  for (const file of files) {
    const code = fs.readFileSync(path.join(contentDir, file), "utf8");
    vm.runInContext(code, context, { filename: file });
  }
  return context.window.SpeakingChallenge.packs;
}

function collectRecordIds(value, ids = new Set()) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectRecordIds(item, ids));
  } else if (value && typeof value === "object") {
    if (typeof value.record_id === "string") ids.add(value.record_id);
    Object.values(value).forEach((item) => collectRecordIds(item, ids));
  }
  return ids;
}

function parseCsv(input) {
  const table = [];
  let row = [];
  let field = "";
  let quoted = false;
  const text = input.replace(/^\uFEFF/, "");
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted && char === '"' && text[index + 1] === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (!quoted && char === ",") {
      row.push(field);
      field = "";
    } else if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((cell) => cell.length > 0)) table.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  row.push(field);
  if (row.some((cell) => cell.length > 0)) table.push(row);
  const headers = table.shift() || [];
  return table.map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] || ""])));
}

const packs = loadPacks();
const canonical = JSON.parse(fs.readFileSync(canonicalPath, "utf8"));
const canonicalIds = collectRecordIds(canonical);
const packIds = new Set();
const challengeIds = new Set();
const focusTopics = new Set(["姓名", "起名", "姓氏", "称呼"]);

assert(packs.length >= 2, "至少需要两个按学习阶段隔离的内容包");
assert(fs.existsSync(pugPath), "缺少本地真实巴哥犬图片");
if (fs.existsSync(pugPath)) {
  const pugBytes = fs.statSync(pugPath).size;
  assert(pugBytes > 0 && pugBytes <= 600_000, "真实巴哥犬图片必须存在且不超过 600 KB");
}
assert(fs.existsSync(priorLanguagePath), "缺少《初级起步篇》第一、二册语言基线 CSV");
if (fs.existsSync(priorLanguagePath)) {
  const priorLanguageBytes = fs.readFileSync(priorLanguagePath);
  const digest = createHash("sha256").update(priorLanguageBytes).digest("hex");
  const rows = parseCsv(priorLanguageBytes.toString("utf8"));
  const volumes = new Set(rows.map((row) => row["册次"]));
  const terms = new Set(rows.flatMap((row) => row["核心词语库"].split(/[；;]/).map((term) => term.trim()).filter(Boolean)));
  assert(digest === priorLanguageSha256, "《初级起步篇》语言基线 CSV 与教师提供的版本不一致");
  assert(rows.length === 43, `《初级起步篇》语言基线应有 43 课，实际为 ${rows.length} 课`);
  assert(volumes.has("初级起步篇 I") && volumes.has("初级起步篇 II"), "语言基线必须同时包含第一、二册");
  assert(terms.size === 431, `语言基线应有 431 个核心词语，实际为 ${terms.size} 个`);
  for (const term of ["姓", "名字", "叫", "请问", "介绍", "第一次", "选择", "听", "说", "读", "写"]) {
    assert(terms.has(term), `语言基线缺少本课任务需要的既有词语：${term}`);
  }
}

for (const pack of packs) {
  assert(!packIds.has(pack.id), `内容包编号重复：${pack.id}`);
  packIds.add(pack.id);
  assert(pack.schemaVersion === 1, `${pack.id} 的 schemaVersion 必须是 1`);
  assert(typeof pack.title === "string" && pack.title.length > 0, `${pack.id} 缺少标题`);
  assert(typeof pack.stage === "string" && pack.stage.length > 0, `${pack.id} 缺少开放阶段`);
  assert(pack.priorLanguageSource === "reference/prior-boya-i-ii-language-baseline.csv", `${pack.id} 缺少前两册语言基线来源`);
  assert(Array.isArray(pack.focusTopics) && pack.focusTopics.every((topic) => focusTopics.has(topic)), `${pack.id} 的主题必须限于姓名、起名、姓氏或称呼`);
  assert(Array.isArray(pack.challenges) && pack.challenges.length >= 12, `${pack.id} 至少需要 12 个情境`);
  assert(pack.defaultSeconds.practice >= 15, `${pack.id} 的练习时间过短`);
  assert(pack.defaultSeconds.change >= 15, `${pack.id} 的应变时间过短`);
  assert(pack.defaultSeconds.present >= 15, `${pack.id} 的发表时间过短`);

  const allowed = new Set(pack.allowedSourceRefs);
  for (const ref of allowed) {
    assert(canonicalIds.has(ref), `${pack.id} 使用不存在的来源编号：${ref}`);
  }

  for (const challenge of pack.challenges) {
    const label = `${pack.id}/${challenge.id || "未命名情境"}`;
    assert(challenge.id && !challengeIds.has(challenge.id), `${label} 的编号缺少或重复`);
    challengeIds.add(challenge.id);
    for (const field of ["title", "situation", "goal", "outcome", "presentation"]) {
      assert(typeof challenge[field] === "string" && challenge[field].trim().length > 0, `${label} 缺少 ${field}`);
    }
    assert(challenge.situation.trim().length >= 18, `${label} 的情境太笼统，必须写出具体人物与问题`);
    assert(focusTopics.has(challenge.focus) && pack.focusTopics.includes(challenge.focus), `${label} 缺少本课主题标记`);
    assert(Array.isArray(challenge.roles) && challenge.roles.length >= 2, `${label} 至少需要两个角色`);
    assert(Array.isArray(challenge.language) && challenge.language.length <= 3, `${label} 的建议语言不能超过三条`);
    assert(Array.isArray(challenge.conditions) && challenge.conditions.length >= 3, `${label} 至少需要三个突发条件`);
    assert(Array.isArray(challenge.audience) && challenge.audience.length >= 2, `${label} 至少需要两个听众任务`);
    assert(Array.isArray(challenge.sourceRefs) && challenge.sourceRefs.length > 0, `${label} 缺少来源编号`);
    for (const ref of challenge.sourceRefs || []) {
      assert(allowed.has(ref), `${label} 的来源 ${ref} 不在内容包允许范围内`);
    }
    for (const role of challenge.roles || []) {
      assert(role.name && role.action, `${label} 的角色缺少名称或动作`);
    }
    for (const condition of challenge.conditions || []) {
      assert(condition.change && condition.action, `${label} 的突发条件缺少变化或调整动作`);
    }
  }
}

const studentFacingText = JSON.stringify(packs);
for (const forbidden of ["协商", "修补", "可观察", "相容", "信息差", "有条件的决定", "某个", "某人", "某件"]) {
  assert(!studentFacingText.includes(forbidden), `学生题目出现抽象或占位用语：${forbidden}`);
}
for (const unrelated of ["食堂", "打印机", "减肥", "网络", "雨伞", "颐和园", "圆明园", "天气预报", "司机", "主持人", "正式会议", "职位"]) {
  assert(!studentFacingText.includes(unrelated), `题库偏离第一课姓名主题：${unrelated}`);
}

const earlyPack = packs.find((pack) => pack.id === "lesson-01-p1-p2");
assert(Boolean(earlyPack), "缺少第一课 P1-P2 内容包");
if (earlyPack) {
  const lateReference = /^(E01-(?:0(?:1[3-9]|2\d|3[0-3]))|G01-00[5-7]|V01-(?:0(?:2[2-9]|3\d)))$/;
  for (const ref of earlyPack.allowedSourceRefs) {
    assert(!lateReference.test(ref), `P1-P2 内容包提前使用后续来源：${ref}`);
  }
  const earlyText = JSON.stringify(earlyPack);
  for (const forbidden of ["不然", "是……还是……", "怎么……怎么……", "谐音", "单姓", "复姓", "尊称", "百家姓"]) {
    assert(!earlyText.includes(forbidden), `P1-P2 内容包提前出现后续语言：${forbidden}`);
  }
}

if (failures.length > 0) {
  console.error(`内容检查失败，共 ${failures.length} 项：`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  const challengeCount = packs.reduce((sum, pack) => sum + pack.challenges.length, 0);
  console.log(`内容检查通过：${packs.length} 个内容包，${challengeCount} 个情境，所有来源与阶段边界有效。`);
}
