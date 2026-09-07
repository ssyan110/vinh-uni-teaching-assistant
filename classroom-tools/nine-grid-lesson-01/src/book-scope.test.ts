import { describe, it, expect } from 'vitest';
import raw from '../public/content/class-content.json';
import { parseContent } from './importer';
import { functionCellPositions } from './game';
import { vocabularyForScope, functionPromptsForScope, splitVocabularyRounds, vocabularyRoundPlan, boardWordLines, createLegacyBoardVocabulary, fillFunctionPrompts, seededShuffle } from './game';

const pack = parseContent(JSON.stringify(raw), 'class-content.json').pack;
const ids = pack.lessons.map(x => x.lesson_id);

describe('book lesson isolation', () => {
  for (const lessonIds of [[ids[0]], [ids[0], ids[1]], ids, [ids[1]], [ids[0]], []]) {
    it(`isolates ${lessonIds.join(',') || 'empty selection'}`, () => {
      const scope = { mode: 'multiple' as const, lessonIds };
      const vocabulary = vocabularyForScope(pack, scope);
      const expected = pack.vocabulary.filter(x => lessonIds.includes(x.introduced_lesson_id));
      expect(new Set(vocabulary.map(x => x.word))).toEqual(new Set(expected.map(x => x.word)));
      const prompts = functionPromptsForScope(pack, scope);
      const expectedPrompts = pack.exercises.filter(x => lessonIds.includes(String(x.introduced_lesson_id)));
      expect(prompts.map(x => x.sourceItemId)).toEqual(expectedPrompts.map(x => x.item_id));
      const rounds = splitVocabularyRounds(seededShuffle(vocabulary, 93));
      expect(rounds.flat().length).toBe(vocabulary.length);
      for (const round of rounds) {
        const words = createLegacyBoardVocabulary(round, 23);
        const side = vocabularyRoundPlan(round.length).sides[0];
        const functions = fillFunctionPrompts(prompts, side ** 2 - words.length);
        expect(words.length + functions.length).toBe(side ** 2);
        expect(functions.length).toBeGreaterThanOrEqual(7);
        expect(new Set(words.map(x => x.word)).size).toBe(words.length);
        expect(words.every(x => lessonIds.includes(x.introduced_lesson_id))).toBe(true);
        expect(functions.every(x => expectedPrompts.some(p => p.item_id === x.sourceItemId))).toBe(true);
      }
      if (!lessonIds.length) {
        expect(vocabulary).toEqual([]);
        expect(prompts).toEqual([]);
        expect(rounds).toEqual([]);
      }
    });
  }
  it('deduplicates cross-lesson words after filtering so the selected source survives', () => {
    const a = pack.vocabulary[0];
    const fixture = { ...pack, vocabulary: [a, { ...a, item_id: 'duplicate-in-l2', introduced_lesson_id: ids[1] }] };
    expect(vocabularyForScope(fixture, {mode:'multiple',lessonIds:ids.slice(0,2)})).toHaveLength(1);
    expect(vocabularyForScope(fixture, {mode:'single',lessonIds:[ids[1]]})[0].item_id).toBe('duplicate-in-l2');
  });
});


describe('adaptive board plan boundaries', () => {
  it('uses 6–9 sides, reserves seven functions, and balances overflow rounds', () => {
    expect(vocabularyRoundPlan(31, true)).toEqual({wordCounts:[31],sides:[6]});
    expect(functionCellPositions(6, 5, 42)).toHaveLength(5);
    expect(vocabularyRoundPlan(29)).toEqual({wordCounts:[29],sides:[6]});
    expect(vocabularyRoundPlan(31)).toEqual({wordCounts:[31],sides:[7]});
    expect(vocabularyRoundPlan(32).sides).toEqual([7]);
    expect(vocabularyRoundPlan(42).sides).toEqual([7]);
    expect(vocabularyRoundPlan(43).sides).toEqual([8]);
    expect(vocabularyRoundPlan(45).sides).toEqual([8]);
    expect(vocabularyRoundPlan(57).sides).toEqual([8]);
    expect(vocabularyRoundPlan(58).sides).toEqual([9]);
    expect(vocabularyRoundPlan(60).sides).toEqual([9]);
    expect(vocabularyRoundPlan(74)).toEqual({wordCounts:[74],sides:[9]});
    expect(vocabularyRoundPlan(75)).toEqual({wordCounts:[38,37],sides:[7,7]});
    expect(vocabularyRoundPlan(77)).toEqual({wordCounts:[39,38],sides:[7,7]});
    expect(vocabularyRoundPlan(324)).toEqual({wordCounts:[65,65,65,65,64],sides:[9,9,9,9,9]});
    for (let count=1; count<=1000; count++) {
      const plan=vocabularyRoundPlan(count);
      expect(plan.wordCounts.reduce((a,b)=>a+b,0)).toBe(count);
      expect(Math.max(...plan.wordCounts)-Math.min(...plan.wordCounts)).toBeLessThanOrEqual(1);
      plan.sides.forEach((side,i)=>{
        expect(side).toBeGreaterThanOrEqual(6);
        expect(side).toBeLessThanOrEqual(9);
        expect(side*side-plan.wordCounts[i]).toBeGreaterThanOrEqual(7);
      });
    }
  });
});

it('separates function cells on shared edges for every lesson combination and multiple layouts', () => {
  for (let mask = 1; mask < 1 << ids.length; mask++) {
    const count = pack.vocabulary.filter(item => mask & (1 << ids.indexOf(item.introduced_lesson_id))).length;
    const plan = vocabularyRoundPlan(count);
    plan.sides.forEach((side, round) => {
      for (let seed = 0; seed < 8; seed++) {
        const slots = functionCellPositions(side, side * side - plan.wordCounts[round], seed);
        const selected = new Set(slots);
        expect(selected.size).toBe(slots.length);
        expect(slots.length).toBeGreaterThanOrEqual(7);
        for (const slot of slots) {
          expect(selected.has(slot + side)).toBe(false);
          if (slot % side < side - 1) expect(selected.has(slot + 1)).toBe(false);
        }
      }
    });
  }
}, 30000);


it('wraps long words after three Han characters but keeps short bracketed words intact', () => {
  expect(boardWordLines('西红柿炒鸡蛋')).toEqual(['西红柿','炒鸡蛋']);
  expect(boardWordLines('上（菜）')).toEqual(['上（菜）']);
  expect(boardWordLines('取决（于）')).toEqual(['取决（于）']);
  expect(boardWordLines('独生女')).toEqual(['独生女']);
  expect(boardWordLines('风和日丽')).toEqual(['风和日','丽']);
});
