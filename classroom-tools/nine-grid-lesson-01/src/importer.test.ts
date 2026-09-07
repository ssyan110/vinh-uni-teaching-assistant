import { describe, expect, it } from "vitest";
import { parseContent, validatePack } from "./importer";

describe("content import", () => {
  it("normalizes the canonical JSON format", () => {
    const preview = parseContent(JSON.stringify({
      schema_version: "1.0.0",
      pack_id: "pack-a",
      class_id: "class-a",
      class_name: "Lớp A",
      content_revision: 2,
      chinese_variant: "simplified",
      lessons: [{ lesson_id: "l1", lesson_name: "Bài 1", order: 1 }],
      characters: [
        { item_id: "c1", character: "你", introduced_lesson_id: "l1" },
        { item_id: "c2", character: "好", introduced_lesson_id: "l1" }
      ],
      vocabulary: [],
      grammar: [],
      sentences: [],
      exercises: []
    }), "class-content.json");

    expect(preview.validCharacters).toBe(2);
    expect(preview.pack.content_revision).toBe(2);
    expect(preview.pack.chinese_variant).toBe("simplified");
    expect(validatePack(preview.pack)).toEqual([]);
  });

  it("preserves canonical vocabulary and sentence teaching fields", () => {
    const preview = parseContent(JSON.stringify({
      schema_version: "1.0.0",
      pack_id: "pack-a",
      class_id: "class-a",
      class_name: "Lớp A",
      content_revision: 2,
      chinese_variant: "simplified",
      lessons: [{ lesson_id: "l1", lesson_name: "Bài 1", order: 1 }],
      characters: [{ item_id: "c1", character: "学", meaning_vi: "học", introduced_lesson_id: "l1" }],
      vocabulary: [{ item_id: "v1", word: "学生", tokens: ["学", "生"], meaning_vi: "học sinh", introduced_lesson_id: "l1" }],
      grammar: [],
      sentences: [{ item_id: "s1", sentence: "我是学生。", tokens: ["我", "是", "学生"], meaning_vi: "Tôi là học sinh.", introduced_lesson_id: "l1" }],
      exercises: []
    }), "class-content.json");

    expect(preview.pack.characters[0].meaning_vi).toBe("học");
    expect(preview.pack.vocabulary[0]).toMatchObject({ word: "学生", tokens: ["学", "生"], meaning_vi: "học sinh" });
    expect(preview.pack.sentences[0]).toMatchObject({ sentence: "我是学生。", tokens: ["我", "是", "学生"], meaning_vi: "Tôi là học sinh." });
  });

  it("accepts a vocabulary-only lesson pack", () => {
    const preview = parseContent(JSON.stringify({
      schema_version: "1.0.0",
      pack_id: "lesson-1-grid",
      class_id: "vinh",
      class_name: "第一课《听说（一）》",
      content_revision: 1,
      chinese_variant: "simplified",
      lessons: [{ lesson_id: "l1", lesson_name: "第一课", order: 1 }],
      characters: [],
      vocabulary: [{ item_id: "v1", word: "起名儿", introduced_lesson_id: "l1" }],
      grammar: [],
      sentences: [],
      exercises: []
    }), "class-content.json");

    expect(preview.pack.characters).toEqual([]);
    expect(preview.pack.vocabulary.map((item) => item.word)).toEqual(["起名儿"]);
    expect(validatePack(preview.pack)).toEqual([]);
  });

  it("deduplicates TXT characters", () => {
    const preview = parseContent("你好，你好！学习", "characters.txt");
    expect(preview.pack.characters.map((item) => item.character)).toEqual(["你", "好", "学", "习"]);
    expect(preview.duplicateCharacters).toEqual(["你", "好"]);
  });

  it("reads CSV and creates lessons referenced by rows", () => {
    const preview = parseContent("character,pinyin,lesson_id\n你,nǐ,l1\n好,hǎo,l2", "characters.csv");
    expect(preview.validCharacters).toBe(2);
    expect(preview.pack.lessons.map((lesson) => lesson.lesson_id)).toEqual(["lesson-1", "l1", "l2"]);
    expect(validatePack(preview.pack)).toEqual([]);
  });

  it("rejects CSV without a character column", () => {
    expect(() => parseContent("word,pinyin\n你好,nǐhǎo", "characters.csv")).toThrow("character");
  });

  it("rejects an unsupported canonical JSON version", () => {
    expect(() => parseContent(JSON.stringify({
      schema_version: "2.0.0",
      pack_id: "pack-a",
      class_id: "class-a",
      class_name: "Lớp A",
      content_revision: 1,
      chinese_variant: "simplified",
      lessons: [],
      characters: [],
      vocabulary: [],
      grammar: [],
      sentences: [],
      exercises: []
    }), "class-content.json")).toThrow("schema_version 1.0.0");
  });

  it("rejects canonical JSON with an unknown lesson reference", () => {
    const preview = parseContent(JSON.stringify({
      schema_version: "1.0.0",
      pack_id: "pack-a",
      class_id: "class-a",
      class_name: "Lớp A",
      content_revision: 1,
      chinese_variant: "simplified",
      lessons: [{ lesson_id: "l1", lesson_name: "Bài 1", order: 1 }],
      characters: [{ item_id: "c1", character: "你", introduced_lesson_id: "missing" }],
      vocabulary: [],
      grammar: [],
      sentences: [],
      exercises: []
    }), "class-content.json");
    expect(validatePack(preview.pack)).toContain("汉字“你”引用了不存在的课次：missing。");
  });

  it("rejects function-cell content with an unknown lesson reference", () => {
    const preview = parseContent(JSON.stringify({
      schema_version: "1.0.0",
      pack_id: "pack-a",
      class_id: "class-a",
      class_name: "Lớp A",
      content_revision: 1,
      chinese_variant: "simplified",
      lessons: [{ lesson_id: "l1", lesson_name: "Bài 1", order: 1 }],
      characters: [{ item_id: "c1", character: "你", introduced_lesson_id: "l1" }],
      vocabulary: [{ item_id: "v1", word: "学生", introduced_lesson_id: "missing" }],
      grammar: [],
      sentences: [{ item_id: "s1", sentence: "我是学生。", introduced_lesson_id: "missing" }],
      exercises: []
    }), "class-content.json");
    expect(validatePack(preview.pack)).toEqual([
      "词语“学生”引用了不存在的课次：missing。",
      "句子“我是学生。”引用了不存在的课次：missing。"
    ]);
  });

  it("ignores words in a character-only field", () => {
    const preview = parseContent("character\n你好\n你", "characters.csv");
    expect(preview.pack.characters.map((item) => item.character)).toEqual(["你"]);
    expect(preview.ignoredCount).toBe(1);
  });
});
