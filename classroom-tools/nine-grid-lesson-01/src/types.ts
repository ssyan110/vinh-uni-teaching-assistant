export interface Lesson {
  lesson_id: string;
  lesson_name: string;
  order: number;
  active?: boolean;
}

export interface CharacterItem {
  item_id: string;
  character: string;
  introduced_lesson_id: string;
  review_lesson_ids?: string[];
  pinyin?: string;
  meaning_vi?: string;
  active?: boolean;
}

export interface VocabularyItem {
  item_id: string;
  word: string;
  tokens?: string[];
  pinyin?: string;
  meaning_vi?: string;
  introduced_lesson_id: string;
  review_lesson_ids?: string[];
  active?: boolean;
  [key: string]: unknown;
}

export interface SentenceItem {
  item_id: string;
  sentence: string;
  tokens?: string[];
  pinyin?: string;
  meaning_vi?: string;
  introduced_lesson_id: string;
  review_lesson_ids?: string[];
  active?: boolean;
  [key: string]: unknown;
}

export interface ContentPack {
  schema_version: string;
  pack_id: string;
  class_id: string;
  class_name: string;
  content_revision: number;
  chinese_variant: "simplified" | "traditional";
  lessons: Lesson[];
  characters: CharacterItem[];
  vocabulary: VocabularyItem[];
  grammar: Record<string, unknown>[];
  sentences: SentenceItem[];
  exercises: Record<string, unknown>[];
}

export type ScopeMode = "all" | "single" | "multiple" | "cumulative";

export interface ScopeSelection {
  mode: ScopeMode;
  lessonIds: string[];
  cumulativeThrough?: string;
}

export interface ImportPreview {
  pack: ContentPack;
  fileName: string;
  validCharacters: number;
  duplicateCharacters: string[];
  ignoredCount: number;
  warnings: string[];
}

export type Team = "red" | "blue";
export type CellOwner = Team | null;

export type GameMode = "modern" | "legacy";
export type LegacySubmode = "classroom" | "solo";
/** The only three kinds that can appear in a function cell. */
export type FunctionPromptKind = "pattern-make" | "dialogue-pattern" | "sentence-rewrite";

export interface FunctionPrompt {
  kind: FunctionPromptKind;
  prompt: string;
  support?: string;
  seconds: 30;
  sourceItemId: string;
}
