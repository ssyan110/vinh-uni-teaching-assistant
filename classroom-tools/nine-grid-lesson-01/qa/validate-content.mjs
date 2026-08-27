import { readFileSync } from "node:fs";

const pack = JSON.parse(readFileSync(new URL("../public/content/class-content.json", import.meta.url), "utf8"));
const errors = [];

const fail = (condition, message) => {
  if (!condition) errors.push(message);
};

fail(pack.schema_version === "1.0.0", "schema_version 必须是 1.0.0");
fail(pack.chinese_variant === "simplified", "学生内容必须使用简体中文");
fail(pack.lessons?.length === 2, "必须包含第一课的听说（一）和听说（二）两个内容范围");
fail(pack.characters?.length === 0, "一般格应使用词语，不应放入单字表");
fail(pack.vocabulary?.length === 34, "一般词语格必须有 34 个词语");
fail(new Set((pack.vocabulary ?? []).map((item) => String(item.word ?? "").trim())).size === pack.vocabulary.length, "词语内容不能重复");
fail(pack.sentences?.length === 14, "句子索引必须有 14 句");
fail(pack.grammar?.length === 7, "句式索引必须有 7 个句式");
fail(pack.exercises?.length === 51, "功能题必须有 51 题");

const lessonIds = new Set(pack.lessons.map((lesson) => lesson.lesson_id));
fail(lessonIds.has("lesson-01-listening-1"), "缺少第一课：听说（一）");
fail(lessonIds.has("lesson-01-listening-2"), "缺少第一课：听说（二）");

const listening1Vocabulary = pack.vocabulary.filter((item) => item.introduced_lesson_id === "lesson-01-listening-1");
const listening2Vocabulary = pack.vocabulary.filter((item) => item.introduced_lesson_id === "lesson-01-listening-2");
fail(listening1Vocabulary.length === 21, "听说（一）必须有 21 个词语");
fail(listening2Vocabulary.length === 13, "听说（二）必须有 13 个词语");

const vocabularyIds = new Set(pack.vocabulary.map((item) => item.item_id));
const expectedVocabularyIds = Array.from({ length: 34 }, (_, index) => `V01-${String(index + 1).padStart(3, "0")}`);
for (const id of expectedVocabularyIds) fail(vocabularyIds.has(id), `缺少词语记录 ${id}`);
for (const item of pack.vocabulary) {
  fail(["S01-002", "S01-009"].includes(item.source_section_id), `${item.item_id} 不属于词语来源区段`);
  fail(item.introduced_lesson_id === "lesson-01-listening-1" ? [1, 2].includes(item.textbook_printed_page) : item.textbook_printed_page === 10, `${item.item_id} 的教材页码不正确`);
}

const grammarIds = new Set(pack.grammar.map((item) => item.item_id));
for (const id of Array.from({ length: 7 }, (_, index) => `G01-${String(index + 1).padStart(3, "0")}`)) {
  fail(grammarIds.has(id), `缺少句式记录 ${id}`);
}

const allowedKinds = new Set(["pattern-make", "dialogue-pattern", "sentence-rewrite"]);
const kindCounts = pack.exercises.reduce((groups, item) => {
  const kind = String(item.function_kind ?? "");
  (groups[kind] ??= []).push(item);
  return groups;
}, {});
fail(Object.keys(kindCounts).every((kind) => allowedKinds.has(kind)), "功能格只能使用造句、对话、改写三种类型");
fail((kindCounts["pattern-make"]?.length ?? 0) === 40, "造句功能题必须有 40 题");
fail((kindCounts["dialogue-pattern"]?.length ?? 0) === 8, "对话功能题必须有 8 题");
fail((kindCounts["sentence-rewrite"]?.length ?? 0) === 3, "改写功能题必须有 3 题");

const allowedSources = new Set(["G01-001", "G01-002", "G01-003", "G01-004", "G01-005", "G01-006", "G01-007", "E01-004", "E01-005", "E01-009", "E01-010", "E01-011", "E01-012", "E01-021", "E01-022", "E01-023", "E01-027"]);
for (const item of pack.exercises) {
  fail(allowedKinds.has(item.function_kind), `${item.item_id} 的功能类型不在三种范围内`);
  fail(allowedSources.has(item.source_record_id), `${item.item_id} 不是指定的教材练习`);
  fail(Boolean(item.prompt?.trim()), `${item.item_id} 缺少题目`);
  fail(Boolean(item.instruction?.trim()), `${item.item_id} 缺少学生操作指示`);
  fail(lessonIds.has(item.introduced_lesson_id), `${item.item_id} 引用了不存在的课次`);
}

const exerciseIds = pack.exercises.map((item) => item.item_id);
fail(new Set(exerciseIds).size === exerciseIds.length, "功能题 item_id 不能重复");

if (errors.length) {
  console.error(errors.map((message) => `- ${message}`).join("\n"));
  process.exit(1);
}

console.log("内容检查通过：2 个内容范围，34 个词语，3 种功能格，51 道功能题。");
