import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const pack = JSON.parse(readFileSync(new URL('../public/content/class-content.json', import.meta.url)));
const catalog = JSON.parse(readFileSync(new URL('../public/content/textbooks.json', import.meta.url)));
const elementaryPack = JSON.parse(readFileSync(new URL('../public/content/boya-elementary-i.json', import.meta.url)));
const book = 'boya-quasi-intermediate-i';
assert.equal(pack.schema_version, '1.0.0');
assert.equal(pack.textbook_id, book);
assert.equal(pack.class_id, book);
assert.equal(pack.chinese_variant, 'simplified');
assert.equal(pack.lessons.length, 12);
assert.equal(pack.lessons[0].lesson_name, '第1课：丽丽是独生女');
assert.deepEqual(pack.lessons.map(x=>x.lesson_id), Array.from({length:12},(_,i)=>`${book}:lesson-${String(i+1).padStart(2,'0')}`));
assert.equal(pack.vocabulary.length, 324);
assert.equal(pack.exercises.length, 958);
assert.equal(pack.sentence_patterns.length, 185);
assert.equal(pack.characters.length, 0);
assert.equal(pack.sentences.length, 0);
const ids = new Set(pack.lessons.map(x=>x.lesson_id));
assert.equal(new Set(pack.sentence_patterns.map(x=>x.item_id)).size, pack.sentence_patterns.length);
for (const item of pack.sentence_patterns) {
  assert(ids.has(item.introduced_lesson_id));
  assert(item.pattern.trim());
  assert(item.source_file.startsWith(`lessons/${book}/`));
}
for (const collection of [pack.vocabulary, pack.exercises]) {
  assert.equal(new Set(collection.map(x=>x.item_id)).size, collection.length);
  for (const item of collection) {
    assert(ids.has(item.introduced_lesson_id));
    assert.equal(item.textbook_id, book);
    assert(item.source_file.startsWith(`lessons/${book}/`));
    if (item.word) { assert(item.source_pointer.startsWith('/sections/')); assert(item.printed_pages.length); }
    else { assert(item.source_file.endsWith('.pptx')); assert(item.source_refs.length); assert(item.source_refs.every(ref => ref.slide > 0 && ref.raw_paragraph.includes(item.prompt))); }
    assert(!item.review_lesson_ids?.length);
    assert((item.word ?? item.prompt).trim());
    if (item.prompt) {
      assert.equal(item.function_kind, 'pattern-make');
      assert(item.instruction.includes('教师确认'));
      assert(!('answer' in item));
    }
  }
}
for (const id of ids) {
  assert(pack.vocabulary.some(x=>x.introduced_lesson_id===id));
  assert(pack.exercises.some(x=>x.introduced_lesson_id===id));
}
assert.deepEqual(catalog.textbooks.map(x => x.textbook_id), ['boya-quasi-intermediate-i', 'boya-elementary-i']);
assert.equal(elementaryPack.textbook_id, 'boya-elementary-i');
assert.equal(elementaryPack.content_mode, 'pinyin');
assert.equal(elementaryPack.content_revision, 3);
assert.deepEqual(elementaryPack.lessons.map(x => x.lesson_id), Array.from({length:10},(_,i)=>`boya-elementary-i:lesson-${String(i+1).padStart(2,'0')}`));
assert.deepEqual(elementaryPack.lessons.map(x => x.content_mode), ['pinyin','pinyin','pinyin',...Array(7).fill('vocabulary')]);
assert.equal(elementaryPack.vocabulary.length, 311);
assert.equal(elementaryPack.exercises.length, 60);
assert.equal(elementaryPack.sentence_patterns.length, 51);
assert.equal(elementaryPack.exercises.filter(x => x.item_id.includes('TONE')).length, 0);
const pinyinVocabulary = elementaryPack.vocabulary.filter(x => x.introduced_lesson_id.endsWith('lesson-01') || x.introduced_lesson_id.endsWith('lesson-02') || x.introduced_lesson_id.endsWith('lesson-03'));
const addedVocabulary = elementaryPack.vocabulary.filter(x => Number(x.introduced_lesson_id.slice(-2)) >= 4);
const addedPatterns = elementaryPack.sentence_patterns;
assert.equal(pinyinVocabulary.length, 143);
assert.equal(addedVocabulary.length, 168);
assert.deepEqual([4,5,6,7,8,9,10].map(n => addedVocabulary.filter(x => x.introduced_lesson_id.endsWith(`lesson-${String(n).padStart(2,'0')}`)).length), [19,24,17,21,29,27,31]);
assert.deepEqual([4,5,6,7,8,9,10].map(n => addedPatterns.filter(x => x.introduced_lesson_id.endsWith(`lesson-${String(n).padStart(2,'0')}`)).length), [7,9,8,2,7,6,12]);
assert(pinyinVocabulary.every(x => !/\p{Script=Han}/u.test(x.word) && x.word === x.pinyin));
assert(addedVocabulary.every(x => x.meaning_vi?.trim() && !/\p{Script=Han}/u.test(x.meaning_vi) && !x.word.includes(' / ') && x.source_ref && x.meaning_review_status));
assert(addedPatterns.every(x => x.meaning_vi?.trim() && !/\p{Script=Han}/u.test(x.meaning_vi) && !x.pattern.includes(' / ') && x.source_ref && x.meaning_review_status && !('answer' in x) && !('correct_form' in x)));
assert(elementaryPack.exercises.every(x => x.function_kind === 'find-error' && x.activity === 'find-error' && x.prompt && x.correct_form && x.prompt !== x.correct_form && !x.prompt.includes(' / ') && !/\p{Script=Han}/u.test(x.prompt) && !/\p{Script=Han}/u.test(x.correct_form)));
assert([...new Set(elementaryPack.exercises.map(x => x.introduced_lesson_id))].every(id => elementaryPack.lessons.some(lesson => lesson.lesson_id === id && lesson.content_mode === 'pinyin')));
const vocabForLesson = (n) => addedVocabulary.filter(x => x.introduced_lesson_id.endsWith(`lesson-${String(n).padStart(2,'0')}`)).map(x => x.word);
assert(!vocabForLesson(5).includes('白'));
assert(vocabForLesson(6).includes('书'));
assert(vocabForLesson(8).includes('六') && vocabForLesson(8).includes('十'));
assert.equal(addedVocabulary.find(x => x.item_id.endsWith('lesson-09:vocab-011'))?.word, '和');
assert(vocabForLesson(9).includes('骑'));
assert.equal(addedVocabulary.find(x => x.item_id.endsWith('lesson-10:vocab-003'))?.word, '买');
console.log('Content verified: quasi-intermediate 12 lessons plus elementary 10 lessons (143 pinyin source items, 168 words, 51 patterns, 60 find-error tasks).');
