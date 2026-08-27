import type {
  CellOwner,
  CharacterItem,
  ContentPack,
  FunctionPrompt,
  ScopeSelection,
  Team,
  VocabularyItem
} from "./types";

export const MAX_BOARD_SIDE = 12;
export const MAX_CELLS_PER_ROUND = MAX_BOARD_SIDE ** 2;
export const LEGACY_BOARD_SIDE = 9;
export const LEGACY_WIN_LENGTH = 5;

export interface BoardPlan {
  uniqueCount: number;
  roundCount: number;
  roundSizes: number[];
  boardSides: number[];
}

export function uniqueCharacters(items: CharacterItem[]): CharacterItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const value = item.character.trim();
    if (!value || item.active === false || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

export function uniqueVocabulary(items: VocabularyItem[]): VocabularyItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const value = item.word.trim();
    if (!value || item.active === false || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

export function calculateBoardPlan(uniqueCount: number): BoardPlan {
  const count = Math.max(0, Math.floor(uniqueCount));
  if (count === 0) return { uniqueCount: 0, roundCount: 0, roundSizes: [], boardSides: [] };

  const roundCount = Math.ceil(count / MAX_CELLS_PER_ROUND);
  const baseSize = Math.floor(count / roundCount);
  const remainder = count % roundCount;
  const roundSizes = Array.from({ length: roundCount }, (_, index) =>
    baseSize + (index < remainder ? 1 : 0)
  );
  const boardSides = roundSizes.map((size) => Math.max(3, Math.ceil(Math.sqrt(size))));
  return { uniqueCount: count, roundCount, roundSizes, boardSides };
}

export function splitIntoRounds<T>(items: T[]): T[][] {
  if (items.length === 0) return [];
  const plan = calculateBoardPlan(items.length);
  const rounds: T[][] = [];
  let cursor = 0;
  for (const size of plan.roundSizes) {
    rounds.push(items.slice(cursor, cursor + size));
    cursor += size;
  }
  return rounds;
}

export function splitIntoLegacyRounds<T>(items: T[]): T[][] {
  if (items.length === 0) return [];
  const roundCount = Math.ceil(items.length / (LEGACY_BOARD_SIDE ** 2));
  const baseSize = Math.floor(items.length / roundCount);
  const remainder = items.length % roundCount;
  const rounds: T[][] = [];
  let cursor = 0;
  for (let index = 0; index < roundCount; index += 1) {
    const size = baseSize + (index < remainder ? 1 : 0);
    rounds.push(items.slice(cursor, cursor + size));
    cursor += size;
  }
  return rounds;
}

export function winLengthForSide(side: number): number {
  if (side <= 3) return 3;
  if (side <= 6) return 4;
  return 5;
}

export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const result = [...items];
  let state = seed >>> 0;
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export function createBoardCharacters(
  characters: readonly CharacterItem[],
  seed = 1
): CharacterItem[] {
  const unique = uniqueCharacters([...characters]);
  if (unique.length === 0) return [];
  const side = Math.max(3, Math.min(MAX_BOARD_SIDE, Math.ceil(Math.sqrt(unique.length))));
  const cells = side * side;
  const shuffled = seededShuffle(unique, seed);
  const repeats: CharacterItem[] = [];
  for (let index = 0; index < cells - shuffled.length; index += 1) {
    repeats.push(shuffled[index % shuffled.length]);
  }
  return seededShuffle([...shuffled, ...repeats], seed ^ 0x9e3779b9);
}

export function createLegacyBoardCharacters(
  characters: readonly CharacterItem[],
  seed = 1
): CharacterItem[] {
  const unique = seededShuffle(uniqueCharacters([...characters]), seed);
  if (unique.length === 0) return [];
  const selected = unique.slice(0, LEGACY_BOARD_SIDE ** 2);
  const board: CharacterItem[] = [];
  for (let index = 0; index < LEGACY_BOARD_SIDE ** 2; index += 1) {
    board.push(selected[index % selected.length]);
  }
  return seededShuffle(board, seed ^ 0x51f15e);
}

export function createBoardVocabulary(
  vocabulary: readonly VocabularyItem[],
  seed = 1
): VocabularyItem[] {
  const unique = uniqueVocabulary([...vocabulary]);
  if (unique.length === 0) return [];
  const side = Math.max(3, Math.min(MAX_BOARD_SIDE, Math.ceil(Math.sqrt(unique.length))));
  const cells = side * side;
  const shuffled = seededShuffle(unique, seed);
  const repeats: VocabularyItem[] = [];
  for (let index = 0; index < cells - shuffled.length; index += 1) {
    repeats.push(shuffled[index % shuffled.length]);
  }
  return seededShuffle([...shuffled, ...repeats], seed ^ 0x9e3779b9);
}

export function createLegacyBoardVocabulary(
  vocabulary: readonly VocabularyItem[],
  seed = 1
): VocabularyItem[] {
  // A 9 × 9 board may contain fewer than 81 vocabulary items. Keep every
  // vocabulary item at most once; the caller fills the remaining cells with
  // textbook practice prompts instead of repeating a word.
  return seededShuffle(uniqueVocabulary([...vocabulary]), seed).slice(0, LEGACY_BOARD_SIDE ** 2);
}

export function detectWinner(
  owners: readonly CellOwner[],
  side: number,
  required = winLengthForSide(side)
): Team | null {
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1]
  ] as const;

  for (let row = 0; row < side; row += 1) {
    for (let column = 0; column < side; column += 1) {
      const owner = owners[row * side + column];
      if (!owner) continue;
      for (const [rowStep, columnStep] of directions) {
        const endRow = row + (required - 1) * rowStep;
        const endColumn = column + (required - 1) * columnStep;
        if (endRow < 0 || endRow >= side || endColumn < 0 || endColumn >= side) continue;
        let matches = true;
        for (let offset = 1; offset < required; offset += 1) {
          if (owners[(row + offset * rowStep) * side + column + offset * columnStep] !== owner) {
            matches = false;
            break;
          }
        }
        if (matches) return owner;
      }
    }
  }
  return null;
}

export function lessonIdsForScope(pack: ContentPack, selection: ScopeSelection): Set<string> {
  const activeLessons = [...pack.lessons]
    .filter((lesson) => lesson.active !== false)
    .sort((a, b) => a.order - b.order);
  let selected = new Set<string>();

  if (selection.mode === "all") {
    selected = new Set(activeLessons.map((lesson) => lesson.lesson_id));
  } else if (selection.mode === "cumulative") {
    const through = activeLessons.find((lesson) => lesson.lesson_id === selection.cumulativeThrough);
    if (through) {
      selected = new Set(activeLessons.filter((lesson) => lesson.order <= through.order).map((lesson) => lesson.lesson_id));
    }
  } else {
    selected = new Set(selection.lessonIds);
  }

  return selected;
}

function isInScope(
  item: { introduced_lesson_id: string; review_lesson_ids?: string[]; active?: boolean },
  lessonIds: Set<string>
): boolean {
  return item.active !== false && (
    lessonIds.has(item.introduced_lesson_id) ||
    Boolean(item.review_lesson_ids?.some((lessonId) => lessonIds.has(lessonId)))
  );
}

export function charactersForScope(pack: ContentPack, selection: ScopeSelection): CharacterItem[] {
  const selected = lessonIdsForScope(pack, selection);
  return uniqueCharacters(pack.characters.filter((item) =>
    selected.has(item.introduced_lesson_id) || item.review_lesson_ids?.some((lessonId) => selected.has(lessonId))
  ));
}

export function vocabularyForScope(pack: ContentPack, selection: ScopeSelection): VocabularyItem[] {
  const selected = lessonIdsForScope(pack, selection);
  return uniqueVocabulary(pack.vocabulary.filter((item) => isInScope(item, selected) && item.word.trim()));
}

export function sentencesForScope(pack: ContentPack, selection: ScopeSelection) {
  const selected = lessonIdsForScope(pack, selection);
  return pack.sentences.filter((item) => isInScope(item, selected) && item.sentence.trim());
}

export function functionPromptsForScope(pack: ContentPack, selection: ScopeSelection): FunctionPrompt[] {
  const selected = lessonIdsForScope(pack, selection);
  return pack.exercises.flatMap((raw, index): FunctionPrompt[] => {
    const item = raw as Record<string, unknown>;
    const lessonId = String(item.introduced_lesson_id ?? "").trim();
    const reviewIds = Array.isArray(item.review_lesson_ids)
      ? item.review_lesson_ids.map(String)
      : [];
    if (item.active === false || (!selected.has(lessonId) && !reviewIds.some((id) => selected.has(id)))) return [];
    const kind = item.function_kind;
    if (kind !== "pattern-make" && kind !== "dialogue-pattern" && kind !== "sentence-rewrite") return [];
    const prompt = String(item.prompt ?? "").trim();
    if (!prompt) return [];
    return [{
      kind,
      prompt,
      support: String(item.instruction ?? "").trim() || undefined,
      // Function cells intentionally use one classroom rhythm: every task gets
      // a visible 30-second turn, regardless of its prompt kind.
      seconds: 30,
      sourceItemId: String(item.item_id ?? `exercise-${index + 1}`)
    }];
  });
}

/**
 * Return exactly the number of function cells needed for a board. Each source
 * prompt is used once before the pool starts rotating, so a short lesson can
 * still fill all 81 cells without ever duplicating a vocabulary word.
 */
export function fillFunctionPrompts(
  prompts: readonly FunctionPrompt[],
  count: number,
  seed = 1
): FunctionPrompt[] {
  const required = Math.max(0, Math.floor(count));
  if (required === 0 || prompts.length === 0) return [];
  const shuffled = seededShuffle(prompts, seed);
  return Array.from({ length: required }, (_, index) => shuffled[index % shuffled.length]);
}

export function cycleManualOwner(owner: CellOwner): CellOwner {
  if (owner === null) return "blue";
  if (owner === "blue") return "red";
  return null;
}

export function countClaims(owners: readonly CellOwner[]): Record<Team, number> {
  return owners.reduce<Record<Team, number>>((totals, owner) => {
    if (owner) totals[owner] += 1;
    return totals;
  }, { red: 0, blue: 0 });
}

export function chooseSoloAiMove(
  owners: readonly CellOwner[],
  side = LEGACY_BOARD_SIDE,
  seed = 1,
  ai: Team = "red"
): number | null {
  const empty = owners.map((owner, index) => owner === null ? index : -1).filter((index) => index >= 0);
  if (!empty.length) return null;
  const opponent: Team = ai === "red" ? "blue" : "red";
  const winningMove = (team: Team): number | undefined => empty.find((index) => {
    const next = [...owners];
    next[index] = team;
    return detectWinner(next, side, LEGACY_WIN_LENGTH) === team;
  });
  const win = winningMove(ai);
  if (win !== undefined) return win;
  const block = winningMove(opponent);
  if (block !== undefined) return block;
  const center = Math.floor((side * side) / 2);
  if (owners[center] === null) return center;
  return seededShuffle(empty, seed)[0] ?? null;
}
