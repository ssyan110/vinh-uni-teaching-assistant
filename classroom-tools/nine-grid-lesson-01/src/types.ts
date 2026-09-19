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

export interface SentencePattern {
  item_id: string;
  pattern: string;
  introduced_lesson_id: string;
  review_lesson_ids?: string[];
  topic?: string;
  printed_pages?: number[];
  source_file?: string;
  active?: boolean;
}

export interface ContentPack {
  schema_version: string;
  pack_id: string;
  class_id: string;
  class_name: string;
  content_revision: number;
  chinese_variant: "simplified" | "traditional";
  textbook_id?: string;
  content_mode?: "vocabulary" | "pinyin";
  content_status?: string;
  notes?: string;
  lessons: Lesson[];
  characters: CharacterItem[];
  vocabulary: VocabularyItem[];
  grammar: Record<string, unknown>[];
  sentence_patterns?: SentencePattern[];
  sentences: SentenceItem[];
  exercises: Record<string, unknown>[];
}

export interface TextbookCatalogEntry {
  textbook_id: string;
  title: string;
  description: string;
  pack_file: string;
  default_lesson_id?: string;
  active?: boolean;
}

export interface TextbookCatalog {
  schema_version: string;
  textbooks: TextbookCatalogEntry[];
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
export type FunctionPromptKind = "pattern-make" | "dialogue-pattern" | "sentence-rewrite" | "find-error";
export type FunctionPromptActivity = "make-sentence" | "translate-vietnamese" | "find-error";

export interface FunctionPrompt {
  kind: FunctionPromptKind;
  activity: FunctionPromptActivity;
  prompt: string;
  support?: string;
  answer?: string;
  teacherCheck?: string;
  seconds: 30;
  sourceItemId: string;
}
