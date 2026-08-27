import { readFileSync } from "node:fs";

const pack = JSON.parse(readFileSync(new URL("../public/content/class-content.json", import.meta.url), "utf8"));
const source = JSON.parse(readFileSync(new URL("../../../work/boya-intermediate/extractions/structured-lesson-01.json", import.meta.url), "utf8"));
const errors = [];

const fail = (condition, message) => {
  if (!condition) errors.push(message);
};

const sourceVocabulary = source.vocabulary;
fail(sourceVocabulary.length === pack.vocabulary.length, "词语数量与 canonical source 不一致");
for (const item of sourceVocabulary) {
  const actual = pack.vocabulary.find((candidate) => candidate.item_id === item.record_id);
  fail(Boolean(actual), `内容包缺少 ${item.record_id}`);
  if (!actual) continue;
  fail(actual.word === item.chinese_simplified, `${item.record_id} 的词语文字不一致`);
  fail(actual.pinyin === item.pinyin, `${item.record_id} 的拼音不一致`);
  fail(actual.textbook_printed_page === item.textbook_printed_page, `${item.record_id} 的教材页码不一致`);
  fail(actual.source_section_id === item.section_id, `${item.record_id} 的来源区段不一致`);
}

const sourceGrammar = source.grammar_patterns;
fail(sourceGrammar.length === pack.grammar.length, "句式数量与 canonical source 不一致");
for (const item of sourceGrammar) {
  const actual = pack.grammar.find((candidate) => candidate.item_id === item.record_id);
  fail(Boolean(actual), `内容包缺少 ${item.record_id}`);
  if (!actual) continue;
  fail(actual.pattern === item.pattern_raw, `${item.record_id} 的句式文字不一致`);
  fail(actual.textbook_printed_page === item.textbook_printed_page, `${item.record_id} 的教材页码不一致`);
}

const exercise = (recordId) => source.exercises.find((item) => item.record_id === recordId);
const numberedLines = (recordId) => exercise(recordId).prompt_raw
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => /^(?:\d+\.|（\d+）)/.test(line));
const removeNumber = (line) => line.replace(/^(?:\d+\.|（\d+）)\s*/, "");
const promptList = (recordId, transform = removeNumber) => numberedLines(recordId).map(transform);
const exactPrompts = (recordId) => pack.exercises.filter((item) => item.source_record_id === recordId).map((item) => item.prompt);
const sourcePrompts = (recordId) => promptList(recordId);

const expectedE004 = sourcePrompts("E01-004");
const actualE004 = exactPrompts("E01-004");
fail(JSON.stringify(actualE004) === JSON.stringify(expectedE004), "E01-004 句子题与教材原文不一致");

const expectedE005 = promptList("E01-005", (line) => `${removeNumber(line).replace(/^A：\s*/, "A：")}\nB：________`);
const actualE005 = exactPrompts("E01-005");
fail(JSON.stringify(actualE005) === JSON.stringify(expectedE005), "E01-005 对话题与教材原文不一致");

const expectedE009 = promptList("E01-009", (line) => `${removeNumber(line)}\nB：________`);
fail(JSON.stringify(exactPrompts("E01-009")) === JSON.stringify(expectedE009), "E01-009 对话题与教材原文不一致");
fail(JSON.stringify(exactPrompts("E01-010")) === JSON.stringify(sourcePrompts("E01-010")), "E01-010 改写题与教材原文不一致");
fail(JSON.stringify(exactPrompts("E01-011")) === JSON.stringify(sourcePrompts("E01-011")), "E01-011 句式题与教材原文不一致");
fail(JSON.stringify(exactPrompts("E01-012")) === JSON.stringify(sourcePrompts("E01-012")), "E01-012 句式题与教材原文不一致");

const expectedE021 = sourcePrompts("E01-021");
const expectedE022 = sourcePrompts("E01-022");
const expectedE023 = promptList("E01-023", (line) => `${removeNumber(line).replace(/^A：\s*/, "A：")}\nB：________`);
const expectedE027 = [
  "我们必须马上出发，不然________。",
  "你一定要好好儿复习，不然________。",
  "夏天出门一定要带雨伞，不然________。",
  "颐和园／圆明园",
  "坐车／骑车",
  "上北大／上清华",
  "________",
  "________",
  "________"
];
fail(JSON.stringify(exactPrompts("E01-021")) === JSON.stringify(expectedE021), "E01-021 口语题与教材原文不一致");
fail(JSON.stringify(exactPrompts("E01-022")) === JSON.stringify(expectedE022), "E01-022 句子题与教材原文不一致");
fail(JSON.stringify(exactPrompts("E01-023")) === JSON.stringify(expectedE023), "E01-023 对话题与教材原文不一致");
fail(JSON.stringify(exactPrompts("E01-027")) === JSON.stringify(expectedE027), "E01-027 句式题与教材原文不一致");

const expectedSentenceTexts = [
  ...sourcePrompts("E01-004"),
  ...promptList("E01-005", (line) => removeNumber(line).replace(/^A：\s*/, "")),
  ...sourcePrompts("E01-022")
];
const actualSentenceTexts = pack.sentences.map((item) => item.sentence);
fail(JSON.stringify(actualSentenceTexts) === JSON.stringify(expectedSentenceTexts), "句子索引与教材原文不一致");

if (errors.length) {
  console.error(errors.map((message) => `- ${message}`).join("\n"));
  process.exit(1);
}

console.log("来源检查通过：34 个词语、7 个句式与功能格教材题目均与 canonical source 对应。");
