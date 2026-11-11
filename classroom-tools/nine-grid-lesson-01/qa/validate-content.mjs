import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const pack = JSON.parse(readFileSync(new URL('../public/content/class-content.json', import.meta.url)));
const catalog = JSON.parse(readFileSync(new URL('../public/content/textbooks.json', import.meta.url)));
const elementaryPack = JSON.parse(readFileSync(new URL('../public/content/boya-elementary-i.json', import.meta.url)));
const elementarySnapshot = JSON.parse(readFileSync(new URL('../docs/elementary-i-source-snapshot.json', import.meta.url)));
const elementaryPdfExtract = JSON.parse(readFileSync(new URL('../docs/elementary-i-pdf-example-extract.json', import.meta.url)));
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
assert.equal(elementaryPack.content_revision, 5);
assert.equal(elementaryPack.content_status, 'mixed_existing_game_input_and_review_only');
assert.deepEqual(elementaryPack.lessons.map(x => x.lesson_id), Array.from({length:25},(_,i)=>`boya-elementary-i:lesson-${String(i+1).padStart(2,'0')}`));
assert.deepEqual(elementaryPack.lessons.map(x => x.content_mode), ['pinyin','pinyin','pinyin',...Array(22).fill('vocabulary')]);
assert.equal(elementaryPack.vocabulary.length, 698);
assert.equal(elementaryPack.exercises.length, 60);
assert.equal(elementaryPack.sentence_patterns.length, 72);
assert.equal(elementaryPack.sentences.length, 161);
assert.equal(elementaryPack.exercises.filter(x => x.item_id.includes('TONE')).length, 0);
const pinyinVocabulary = elementaryPack.vocabulary.filter(x => x.introduced_lesson_id.endsWith('lesson-01') || x.introduced_lesson_id.endsWith('lesson-02') || x.introduced_lesson_id.endsWith('lesson-03'));
const addedVocabulary = elementaryPack.vocabulary.filter(x => Number(x.introduced_lesson_id.slice(-2)) >= 4);
const lessonsFourToTenVocabulary = addedVocabulary.filter(x => Number(x.introduced_lesson_id.slice(-2)) <= 10);
const lessonsFourToTenPatterns = elementaryPack.sentence_patterns.filter(x => Number(x.introduced_lesson_id.slice(-2)) <= 10);
assert.equal(pinyinVocabulary.length, 143);
assert.equal(lessonsFourToTenVocabulary.length, 168);
assert.equal(addedVocabulary.length, 555);
assert.deepEqual([4,5,6,7,8,9,10].map(n => lessonsFourToTenVocabulary.filter(x => x.introduced_lesson_id.endsWith(`lesson-${String(n).padStart(2,'0')}`)).length), [19,24,17,21,29,27,31]);
assert.deepEqual([4,5,6,7,8,9,10].map(n => lessonsFourToTenPatterns.filter(x => x.introduced_lesson_id.endsWith(`lesson-${String(n).padStart(2,'0')}`)).length), [7,9,8,2,7,6,12]);
assert(pinyinVocabulary.every(x => !/\p{Script=Han}/u.test(x.word) && x.word === x.pinyin));
assert(lessonsFourToTenVocabulary.every(x => x.meaning_vi?.trim() && !/\p{Script=Han}/u.test(x.meaning_vi) && !x.word.includes(' / ') && x.source_ref && x.meaning_review_status));
assert(lessonsFourToTenPatterns.every(x => x.meaning_vi?.trim() && !/\p{Script=Han}/u.test(x.meaning_vi) && !x.pattern.includes(' / ') && x.source_ref && x.meaning_review_status && !('answer' in x) && !('correct_form' in x)));
assert(elementaryPack.exercises.every(x => x.function_kind === 'find-error' && x.activity === 'find-error' && x.prompt && x.correct_form && x.prompt !== x.correct_form && !x.prompt.includes(' / ') && !/\p{Script=Han}/u.test(x.prompt) && !/\p{Script=Han}/u.test(x.correct_form)));
assert([...new Set(elementaryPack.exercises.map(x => x.introduced_lesson_id))].every(id => elementaryPack.lessons.some(lesson => lesson.lesson_id === id && lesson.content_mode === 'pinyin')));
const reviewLessonIds = Array.from({length:15},(_,i)=>`boya-elementary-i:lesson-${String(i+11).padStart(2,'0')}`);
const reviewVocabulary = elementaryPack.vocabulary.filter(x => reviewLessonIds.includes(x.introduced_lesson_id));
const reviewPatterns = elementaryPack.sentence_patterns.filter(x => reviewLessonIds.includes(x.introduced_lesson_id));
const reviewSentences = elementaryPack.sentences.filter(x => reviewLessonIds.includes(x.introduced_lesson_id));
const pdfSentences = reviewSentences.filter(x => x.source_file === elementaryPdfExtract.source_document.file_name);
const grammarSentences = reviewSentences.filter(x => x.source_file === 'grammar.csv');
assert.equal(reviewVocabulary.length, 387);
assert.equal(reviewPatterns.length, 21);
assert.deepEqual(reviewLessonIds.map(id => grammarSentences.filter(x => x.introduced_lesson_id === id).length), [6,5,5,5,7,7,4,5,5,7,7,8,6,6,8]);
assert.deepEqual(reviewLessonIds.map(id => pdfSentences.filter(x => x.introduced_lesson_id === id).length), [9,6,3,4,4,5,9,5,3,3,5,2,2,0,10]);
assert.equal(grammarSentences.length, 91);
assert.equal(pdfSentences.length, 70);
assert.equal(elementaryPdfExtract.examples.length, 70);
assert(reviewLessonIds.every(id => elementaryPack.lessons.find(x => x.lesson_id === id)?.content_review_status === 'review_only_pending_human_source_translation_review'));
assert(reviewVocabulary.every(x => x.content_review_status === 'review_only_pending_human_source_translation_review' && x.source_file === 'vocabulary_occurrences.csv' && x.source_ref && x.source_status && x.meaning_vi_status));
assert(reviewPatterns.every(x => x.content_review_status === 'review_only_pending_human_source_translation_review' && x.source_ref && x.source_status && x.meaning_vi_status && !x.meaning_vi && Object.hasOwn(x, 'meaning_vi_draft')));
assert(grammarSentences.every(x => x.content_review_status === 'review_only_pending_human_source_translation_review' && x.source_ref.includes('example_sentence_zh') && x.source_original && /[。！？!?]$/.test(x.sentence) && !/[………]|\.\.\./.test(x.sentence)));
assert(pdfSentences.every(x => x.content_review_status === 'review_only_pending_human_source_translation_review' && x.source_document_sha256 === elementaryPdfExtract.source_document.sha256 && elementaryPdfExtract.source_document.visually_checked_pdf_pages.includes(x.source_pdf_page) && x.source_ref.includes(`#PDF-page-${x.source_pdf_page}/`) && /[。！？!?]$/.test(x.sentence) && !/[………]|\.\.\./.test(x.sentence)));
assert(reviewSentences.every(x => x.content_review_status === 'review_only_pending_human_source_translation_review' && (x.source_file === 'grammar.csv' || x.source_file === elementaryPdfExtract.source_document.file_name)));
assert(reviewLessonIds.every(id => new Set(reviewSentences.filter(x => x.introduced_lesson_id === id).map(x => x.sentence)).size === reviewSentences.filter(x => x.introduced_lesson_id === id).length));
assert.equal(elementarySnapshot.counts.lessons, 15);
assert.equal(elementarySnapshot.counts.vocabulary_occurrences, 387);
assert.equal(elementarySnapshot.counts.sentence_patterns, 21);
assert.equal(elementarySnapshot.counts.grammar_example_sentences, 91);
assert.equal(elementarySnapshot.counts.pdf_example_sentences, 70);
assert.equal(elementarySnapshot.counts.example_sentences, 161);
assert.equal(elementarySnapshot.selection_policy.provided_pdf_example_extract.extract_sha256, createHash('sha256').update(readFileSync(new URL('../docs/elementary-i-pdf-example-extract.json', import.meta.url))).digest('hex'));
for (const id of reviewLessonIds) {
  const wordCount = reviewVocabulary.filter(x => x.introduced_lesson_id === id).length;
  const promptCount = reviewPatterns.filter(x => x.introduced_lesson_id === id).length + reviewSentences.filter(x => x.introduced_lesson_id === id).length;
  const boardSide = Math.max(6, Math.ceil(Math.sqrt(wordCount + 7)));
  assert(promptCount >= boardSide ** 2 - wordCount, `${id} has insufficient unique prompts for its function cells`);
}
const vocabForLesson = (n) => addedVocabulary.filter(x => x.introduced_lesson_id.endsWith(`lesson-${String(n).padStart(2,'0')}`)).map(x => x.word);
assert(!vocabForLesson(5).includes('白'));
assert(vocabForLesson(6).includes('书'));
assert(vocabForLesson(8).includes('六') && vocabForLesson(8).includes('十'));
assert.equal(addedVocabulary.find(x => x.item_id.endsWith('lesson-09:vocab-011'))?.word, '和');
assert(vocabForLesson(9).includes('骑'));
assert.equal(addedVocabulary.find(x => x.item_id.endsWith('lesson-10:vocab-003'))?.word, '买');
console.log('Content verified: quasi-intermediate 12 lessons plus elementary-I 25 lessons (143 pinyin items, 555 vocabulary occurrences, 72 patterns, 161 review-only example sentences including 70 visually checked from the supplied PDF, 60 find-error tasks).');
