import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const pack = JSON.parse(readFileSync(new URL('../public/content/class-content.json', import.meta.url)));
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
assert.equal(pack.characters.length, 0);
assert.equal(pack.sentences.length, 0);
const ids = new Set(pack.lessons.map(x=>x.lesson_id));
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
console.log('Content verified: twelve lessons, 324 vocabulary occurrences, 958 PPT example sentence tasks.');
