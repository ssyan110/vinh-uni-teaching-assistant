import { describe, expect, it } from "vitest";
import {
  calculateBoardPlan,
  createBoardCharacters,
  detectWinner,
  splitIntoRounds,
  splitIntoLegacyRounds,
  winLengthForSide,
  charactersForScope,
  chooseSoloAiMove,
  countClaims,
  createLegacyBoardCharacters,
  createBoardVocabulary,
  createLegacyBoardVocabulary,
  cycleManualOwner,
  fillFunctionPrompts,
  functionPromptsForScope,
  LEGACY_BOARD_SIDE
} from "./game";
import type { CellOwner, CharacterItem } from "./types";

const requestedCounts = [1, 2, 8, 9, 10, 16, 17, 25, 26, 81, 82, 105, 145];

function items(count: number): CharacterItem[] {
  return Array.from({ length: count }, (_, index) => ({
    item_id: `c-${index}`,
    character: String.fromCodePoint(0x4e00 + index),
    introduced_lesson_id: "lesson-1"
  }));
}

describe("board planning", () => {
  it.each(requestedCounts)("plans %i unique characters without loss", (count) => {
    const plan = calculateBoardPlan(count);
    expect(plan.roundSizes.reduce((sum, size) => sum + size, 0)).toBe(count);
    expect(plan.boardSides.every((side) => side >= 3 && side <= 12)).toBe(true);
    expect(plan.roundSizes.every((size, index) => size <= plan.boardSides[index] ** 2)).toBe(true);
  });

  it("balances 145 characters over two playable rounds", () => {
    expect(calculateBoardPlan(145).roundSizes).toEqual([73, 72]);
    expect(calculateBoardPlan(145).boardSides).toEqual([9, 9]);
    expect(splitIntoRounds(items(145)).map((round) => round.length)).toEqual([73, 72]);
  });

  it.each(requestedCounts.filter((count) => count <= 144))("places all %i characters at least once", (count) => {
    const input = items(count);
    const board = createBoardCharacters(input, 42);
    expect(board).toHaveLength(Math.max(3, Math.ceil(Math.sqrt(count))) ** 2);
    expect(new Set(board.map((item) => item.character)).size).toBe(count);
  });

  it("distributes repeated cells fairly", () => {
    const board = createBoardCharacters(items(10), 42);
    const frequencies = new Map<string, number>();
    board.forEach((item) => frequencies.set(item.character, (frequencies.get(item.character) ?? 0) + 1));
    const counts = [...frequencies.values()];
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
  });

  it("uses adaptive win lengths", () => {
    expect(winLengthForSide(3)).toBe(3);
    expect(winLengthForSide(4)).toBe(4);
    expect(winLengthForSide(6)).toBe(4);
    expect(winLengthForSide(7)).toBe(4);
    expect(winLengthForSide(8)).toBe(4);
    expect(winLengthForSide(9)).toBe(5);
    expect(winLengthForSide(12)).toBe(5);
  });

  it("places each selected vocabulary item on the board", () => {
    const vocabulary = ["起名儿", "惊讶", "琢磨", "发音", "别扭"].map((word, index) => ({
      item_id: `v-${index}`,
      word,
      introduced_lesson_id: "lesson-1"
    }));
    const board = createBoardVocabulary(vocabulary, 42);
    expect(board).toHaveLength(9);
    expect(new Set(board.map((item) => item.word))).toEqual(new Set(vocabulary.map((item) => item.word)));
    const fixedBoardWords = createLegacyBoardVocabulary(vocabulary, 42);
    expect(fixedBoardWords).toHaveLength(vocabulary.length);
    expect(new Set(fixedBoardWords.map((item) => item.word))).toEqual(new Set(vocabulary.map((item) => item.word)));
  });
});

describe("winner detection", () => {
  function board(side: number, indexes: number[], team: "red" | "blue" = "red"): CellOwner[] {
    const owners: CellOwner[] = Array(side * side).fill(null);
    indexes.forEach((index) => { owners[index] = team; });
    return owners;
  }

  it("detects a horizontal line", () => {
    expect(detectWinner(board(5, [5, 6, 7, 8]), 5)).toBe("red");
  });

  it("detects a vertical line", () => {
    expect(detectWinner(board(5, [1, 6, 11, 16], "blue"), 5)).toBe("blue");
  });

  it("detects both diagonal directions", () => {
    expect(detectWinner(board(7, [0, 8, 16, 24, 32]), 7)).toBe("red");
    expect(detectWinner(board(7, [4, 10, 16, 22, 28], "blue"), 7)).toBe("blue");
  });

  it("does not report an interrupted line", () => {
    expect(detectWinner(board(5, [0, 1, 3, 4]), 5)).toBeNull();
  });
});

describe("lesson scope", () => {
  const pack = {
    schema_version: "1.0.0",
    pack_id: "p",
    class_id: "c",
    class_name: "Lớp",
    content_revision: 1,
    chinese_variant: "simplified" as const,
    lessons: [
      { lesson_id: "l1", lesson_name: "Bài 1", order: 1 },
      { lesson_id: "l2", lesson_name: "Bài 2", order: 2 }
    ],
    characters: [
      { item_id: "c1", character: "你", introduced_lesson_id: "l1", review_lesson_ids: ["l2"] },
      { item_id: "c2", character: "好", introduced_lesson_id: "l2" }
    ],
    vocabulary: [], grammar: [], sentences: [], exercises: []
  };

  it("includes reviewed characters in a single lesson", () => {
    expect(charactersForScope(pack, { mode: "single", lessonIds: ["l2"] }).map((item) => item.character)).toEqual(["你", "好"]);
  });

  it("limits cumulative scope by lesson order", () => {
    expect(charactersForScope(pack, { mode: "cumulative", lessonIds: [], cumulativeThrough: "l1" }).map((item) => item.character)).toEqual(["你"]);
  });
});

describe("optional legacy classroom mode", () => {
  it("always creates a fixed 9 by 9 board without bundled fallback content", () => {
    expect(createLegacyBoardCharacters([], 7)).toEqual([]);
    const board = createLegacyBoardCharacters(items(10), 7);
    expect(board).toHaveLength(LEGACY_BOARD_SIDE ** 2);
    expect(new Set(board.map((item) => item.character)).size).toBe(10);
  });

  it("balances legacy rounds so every selected character is covered", () => {
    expect(splitIntoLegacyRounds(items(82)).map((round) => round.length)).toEqual([41, 41]);
    expect(splitIntoLegacyRounds(items(163)).map((round) => round.length)).toEqual([55, 54, 54]);
  });

  it("cycles manual classroom ownership empty to blue to red to empty", () => {
    expect(cycleManualOwner(null)).toBe("blue");
    expect(cycleManualOwner("blue")).toBe("red");
    expect(cycleManualOwner("red")).toBeNull();
    expect(countClaims([null, "blue", "blue", "red"])).toEqual({ blue: 2, red: 1 });
  });

  it("uses only scoped function exercises and gives every kind 30 seconds", () => {
    const scopedPack = {
      schema_version: "1.0.0",
      pack_id: "p",
      class_id: "c",
      class_name: "Lớp",
      content_revision: 1,
      chinese_variant: "simplified" as const,
      lessons: [
        { lesson_id: "l1", lesson_name: "Bài 1", order: 1 },
        { lesson_id: "l2", lesson_name: "Bài 2", order: 2 }
      ],
      characters: items(2),
      vocabulary: [],
      grammar: [],
      sentences: [],
      exercises: [
        { item_id: "e1", function_kind: "pattern-make", prompt: "请问你的名字怎么念？", instruction: "回答问题。", introduced_lesson_id: "l1" },
        { item_id: "e2", function_kind: "dialogue-pattern", prompt: "到时候别忘了通知我。", instruction: "说一说使用情境。", introduced_lesson_id: "l1" },
        { item_id: "e3", function_kind: "sentence-rewrite", prompt: "不在范围内", introduced_lesson_id: "l2" }
      ],
    };
    const prompts = functionPromptsForScope(scopedPack, { mode: "single", lessonIds: ["l1"] });
    expect(prompts.map((prompt) => [prompt.kind, prompt.prompt, prompt.seconds])).toEqual([
      ["pattern-make", "请问你的名字怎么念？", 30],
      ["dialogue-pattern", "到时候别忘了通知我。", 30]
    ]);
    expect(functionPromptsForScope({ ...scopedPack, exercises: [] }, { mode: "all", lessonIds: [] })).toEqual([]);
  });

  it("fills function cells before repeating a short practice pool", () => {
    const prompts = functionPromptsForScope({
      schema_version: "1.0.0",
      pack_id: "p",
      class_id: "c",
      class_name: "Lớp",
      content_revision: 1,
      chinese_variant: "simplified" as const,
      lessons: [{ lesson_id: "l1", lesson_name: "Bài 1", order: 1 }],
      characters: [],
      vocabulary: [],
      grammar: [],
      sentences: [],
      exercises: [
        { item_id: "e1", function_kind: "pattern-make", prompt: "甲", instruction: "造句", introduced_lesson_id: "l1" },
        { item_id: "e2", function_kind: "dialogue-pattern", prompt: "乙", instruction: "对话", introduced_lesson_id: "l1" }
      ]
    }, { mode: "single", lessonIds: ["l1"] });
    const filled = fillFunctionPrompts(prompts, 5, 10);
    expect(filled).toHaveLength(5);
    expect(new Set(filled.slice(0, 2).map((prompt) => prompt.sourceItemId)).size).toBe(2);
    expect(new Set(filled.map((prompt) => prompt.sourceItemId))).toEqual(new Set(["e1", "e2"]));
    expect(fillFunctionPrompts([], 5)).toEqual([]);
  });

  it("makes deterministic solo AI moves, preferring wins then blocks", () => {
    const winning: CellOwner[] = Array(81).fill(null);
    [0, 1, 2, 3].forEach((index) => { winning[index] = "red"; });
    expect(chooseSoloAiMove(winning, 9, 4)).toBe(4);

    const blocking: CellOwner[] = Array(81).fill(null);
    [9, 10, 11, 12].forEach((index) => { blocking[index] = "blue"; });
    expect(chooseSoloAiMove(blocking, 9, 4)).toBe(13);

    const open: CellOwner[] = Array(81).fill(null);
    expect(chooseSoloAiMove(open, 9, 4)).toBe(40);
    open[40] = "blue";
    expect(chooseSoloAiMove(open, 9, 99)).toBe(chooseSoloAiMove(open, 9, 99));
  });
});
