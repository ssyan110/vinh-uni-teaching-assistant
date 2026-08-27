import type { CharacterItem, ContentPack, ImportPreview, Lesson, SentenceItem, VocabularyItem } from "./types";

const HAN_CHARACTER = /\p{Script=Han}/u;
const HAN_CHARACTERS = /\p{Script=Han}/gu;

function text(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function slug(value: string, fallback: string): string {
  const normalized = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || fallback;
}

function normalizeLesson(raw: Record<string, unknown>, index: number): Lesson {
  const lessonId = text(raw.lesson_id ?? raw.id) || `lesson-${index + 1}`;
  return {
    lesson_id: lessonId,
    lesson_name: text(raw.lesson_name ?? raw.name) || `第${index + 1}课`,
    order: Number(raw.order) || index + 1,
    active: raw.active !== false
  };
}

function normalizeCharacter(raw: Record<string, unknown>, index: number, defaultLesson: string): CharacterItem | null {
  const character = text(raw.character ?? raw.hanzi ?? raw.word);
  if (!character || Array.from(character).length !== 1 || !HAN_CHARACTER.test(character)) return null;
  const lessonId = text(raw.lesson_id ?? raw.introduced_lesson_id) || defaultLesson;
  return {
    item_id: text(raw.item_id ?? raw.id) || `char-${index + 1}-${slug(character, "hanzi")}`,
    character,
    introduced_lesson_id: lessonId,
    review_lesson_ids: Array.isArray(raw.review_lesson_ids) ? raw.review_lesson_ids.map(text).filter(Boolean) : [],
    pinyin: text(raw.pinyin) || undefined,
    meaning_vi: text(raw.meaning_vi ?? raw.vietnamese ?? raw.meaning) || undefined,
    active: raw.active !== false
  };
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(text).filter(Boolean);
  return [];
}

function normalizeVocabulary(raw: Record<string, unknown>, index: number, defaultLesson: string): VocabularyItem | null {
  const word = text(raw.word);
  if (!word) return null;
  return {
    ...raw,
    item_id: text(raw.item_id ?? raw.id) || `vocab-${index + 1}`,
    word,
    tokens: stringList(raw.tokens),
    pinyin: text(raw.pinyin) || undefined,
    meaning_vi: text(raw.meaning_vi) || undefined,
    introduced_lesson_id: text(raw.introduced_lesson_id ?? raw.lesson_id) || defaultLesson,
    review_lesson_ids: stringList(raw.review_lesson_ids),
    active: raw.active !== false
  };
}

function normalizeSentence(raw: Record<string, unknown>, index: number, defaultLesson: string): SentenceItem | null {
  const sentence = text(raw.sentence);
  if (!sentence) return null;
  return {
    ...raw,
    item_id: text(raw.item_id ?? raw.id) || `sentence-${index + 1}`,
    sentence,
    tokens: stringList(raw.tokens),
    pinyin: text(raw.pinyin) || undefined,
    meaning_vi: text(raw.meaning_vi) || undefined,
    introduced_lesson_id: text(raw.introduced_lesson_id ?? raw.lesson_id) || defaultLesson,
    review_lesson_ids: stringList(raw.review_lesson_ids),
    active: raw.active !== false
  };
}

function finalizePack(
  source: Partial<ContentPack>,
  lessonsInput: Record<string, unknown>[],
  charactersInput: Record<string, unknown>[],
  createMissingLessons = true
): { pack: ContentPack; duplicates: string[]; ignored: number; warnings: string[] } {
  const lessons = lessonsInput.length > 0
    ? lessonsInput.map(normalizeLesson)
    : [{ lesson_id: "lesson-1", lesson_name: "第一课", order: 1, active: true }];
  const knownLessonIds = new Set(lessons.map((lesson) => lesson.lesson_id));
  const defaultLesson = lessons[0].lesson_id;
  const normalized = charactersInput.map((item, index) => normalizeCharacter(item, index, defaultLesson));
  const ignored = normalized.filter((item) => item === null).length;
  const seen = new Set<string>();
  const duplicates: string[] = [];
  const characters = normalized.filter((item): item is CharacterItem => {
    if (!item) return false;
    if (seen.has(item.character)) {
      duplicates.push(item.character);
      return false;
    }
    seen.add(item.character);
    return true;
  });
  const missingLessons = [...new Set(characters.map((item) => item.introduced_lesson_id).filter((id) => !knownLessonIds.has(id)))];
  if (createMissingLessons) {
    for (const lessonId of missingLessons) {
      lessons.push({ lesson_id: lessonId, lesson_name: lessonId, order: lessons.length + 1, active: true });
    }
  }
  const warnings: string[] = [];
  if (duplicates.length) warnings.push(`已忽略 ${duplicates.length} 个重复汉字。`);
  if (ignored) warnings.push(`已忽略 ${ignored} 行无效内容。`);
  if (missingLessons.length && createMissingLessons) warnings.push(`已自动补上 ${missingLessons.length} 个缺少的课次。`);

  const vocabulary = (Array.isArray(source.vocabulary) ? source.vocabulary : [])
    .map((item, index) => normalizeVocabulary(item as Record<string, unknown>, index, defaultLesson))
    .filter((item): item is VocabularyItem => item !== null);
  const sentences = (Array.isArray(source.sentences) ? source.sentences : [])
    .map((item, index) => normalizeSentence(item as Record<string, unknown>, index, defaultLesson))
    .filter((item): item is SentenceItem => item !== null);

  return {
    pack: {
      schema_version: text(source.schema_version) || "1.0.0",
      pack_id: text(source.pack_id) || "local-pack",
      class_id: text(source.class_id) || "local-class",
      class_name: text(source.class_name) || "我的班级",
      content_revision: Math.max(1, Math.floor(Number(source.content_revision) || 1)),
      chinese_variant: source.chinese_variant === "traditional" ? "traditional" : "simplified",
      lessons: lessons.sort((a, b) => a.order - b.order),
      characters,
      vocabulary,
      grammar: Array.isArray(source.grammar) ? source.grammar : [],
      sentences,
      exercises: Array.isArray(source.exercises) ? source.exercises : []
    },
    duplicates: [...new Set(duplicates)],
    ignored,
    warnings
  };
}

function parseJson(input: string): ReturnType<typeof finalizePack> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    throw new Error("JSON 文件无效，请检查逗号和括号。");
  }

  if (Array.isArray(parsed)) {
    const characters = parsed.map((item) =>
      typeof item === "string" ? { character: item } : (item as Record<string, unknown>)
    );
    return finalizePack({}, [], characters);
  }
  if (!parsed || typeof parsed !== "object") throw new Error("JSON 必须是对象或汉字列表。");
  const source = parsed as Record<string, unknown>;
  if (source.schema_version !== "1.0.0") throw new Error("JSON 必须使用 schema_version 1.0.0。");
  if (!text(source.pack_id) || !text(source.class_id) || !text(source.class_name)) {
    throw new Error("JSON 必须包含 pack_id、class_id 和 class_name。");
  }
  if (!Number.isInteger(source.content_revision) || Number(source.content_revision) < 1) {
    throw new Error("content_revision 必须是正整数。");
  }
  if (source.chinese_variant !== "simplified" && source.chinese_variant !== "traditional") {
    throw new Error("chinese_variant 必须是 simplified 或 traditional。");
  }
  for (const collection of ["lessons", "characters", "vocabulary", "grammar", "sentences", "exercises"]) {
    if (!Array.isArray(source[collection])) throw new Error(`JSON 必须包含“${collection}”数组。`);
  }
  const lessons = Array.isArray(source.lessons) ? source.lessons as Record<string, unknown>[] : [];
  const rawCharacters = source.characters;
  if (!Array.isArray(rawCharacters)) throw new Error("JSON 必须包含“characters”数组。");
  const characters = rawCharacters.map((item) =>
    typeof item === "string" ? { character: item } : item as Record<string, unknown>
  );
  return finalizePack(source as Partial<ContentPack>, lessons, characters, false);
}

function splitCsvRow(row: string): string[] {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < row.length; index += 1) {
    const char = row[index];
    if (char === '"' && row[index + 1] === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function parseCsv(input: string): ReturnType<typeof finalizePack> {
  const rows = input.split(/\r?\n/).filter((row) => row.trim());
  if (rows.length < 2) throw new Error("CSV 必须有表头和至少一行数据。");
  const headers = splitCsvRow(rows[0]).map((header) => header.toLowerCase());
  if (!headers.includes("character") && !headers.includes("hanzi")) {
    throw new Error("CSV 必须包含“character”或“hanzi”列。");
  }
  const characters = rows.slice(1).map((row) => {
    const values = splitCsvRow(row);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
  return finalizePack({}, [], characters);
}

function parseTxt(input: string): ReturnType<typeof finalizePack> {
  const matches = input.match(HAN_CHARACTERS) ?? [];
  if (!matches.length) throw new Error("TXT 文件中没有汉字。");
  return finalizePack({}, [], matches.map((character) => ({ character })));
}

export function parseContent(textContent: string, fileName: string): ImportPreview {
  const extension = fileName.toLowerCase().split(".").pop();
  let result: ReturnType<typeof finalizePack>;
  if (extension === "json") result = parseJson(textContent);
  else if (extension === "csv") result = parseCsv(textContent);
  else if (extension === "txt") result = parseTxt(textContent);
  else throw new Error("不支持这个格式，请使用 JSON、CSV 或 TXT。");

  if (result.pack.characters.length === 0 && result.pack.vocabulary.length === 0) {
    throw new Error("内容中没有可用的汉字或词语。");
  }
  return {
    pack: result.pack,
    fileName,
    validCharacters: result.pack.characters.length,
    duplicateCharacters: result.duplicates,
    ignoredCount: result.ignored,
    warnings: result.warnings
  };
}

export function validatePack(pack: ContentPack): string[] {
  const errors: string[] = [];
  if (!pack.class_id.trim()) errors.push("缺少班级代码（class_id）。");
  if (!pack.pack_id.trim()) errors.push("缺少内容包代码（pack_id）。");
  if (pack.lessons.length === 0) errors.push("至少需要一个课次。");
  if (pack.characters.length === 0 && pack.vocabulary.length === 0) errors.push("至少需要一个汉字或词语。");
  const lessonIds = new Set(pack.lessons.map((lesson) => lesson.lesson_id));
  for (const item of pack.characters) {
    if (!lessonIds.has(item.introduced_lesson_id)) errors.push(`汉字“${item.character}”引用了不存在的课次：${item.introduced_lesson_id}。`);
  }
  for (const item of pack.vocabulary) {
    if (!lessonIds.has(item.introduced_lesson_id)) errors.push(`词语“${item.word}”引用了不存在的课次：${item.introduced_lesson_id}。`);
  }
  for (const item of pack.sentences) {
    if (!lessonIds.has(item.introduced_lesson_id)) errors.push(`句子“${item.sentence}”引用了不存在的课次：${item.introduced_lesson_id}。`);
  }
  return errors;
}
