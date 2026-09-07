import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const read = path => JSON.parse(readFileSync(path, 'utf8'));
const pack = read(new URL('../public/content/class-content.json', import.meta.url));
const snapshots = read(new URL('../docs/source-snapshot.json', import.meta.url));

function flattenPatterns(node, output = [], topic = '') {
  if (Array.isArray(node)) {
    for (const item of node) {
      if (typeof item === 'string' && item.trim()) output.push({ pattern: item.trim(), topic });
      else flattenPatterns(item, output, topic);
    }
    return output;
  }
  if (!node || typeof node !== 'object') return output;
  const nextTopic = typeof node.topic === 'string' ? node.topic : topic;
  if (typeof node.expression === 'string' && node.expression.trim()) {
    output.push({ pattern: node.expression.trim(), topic: nextTopic });
  }
  for (const key of ['items', 'groups']) {
    if (key in node) flattenPatterns(node[key], output, nextTopic);
  }
  return output;
}
const rootIndex = process.argv.indexOf('--source-root');
const root = rootIndex >= 0 ? resolve(process.argv[rootIndex + 1]) : null;
let vocabularyCount = 0, promptCount = 0;
const expectedPatterns = snapshots.flatMap((snapshot) => snapshot.expressions.flatMap((section) =>
  flattenPatterns(section).map((item) => [snapshot.lesson_key, item.pattern])
));
assert.deepEqual(
  pack.sentence_patterns.map((item) => [item.introduced_lesson_id, item.pattern]),
  expectedPatterns
);
for (const s of snapshots) {
  let live;
  if (root) {
    const raw = readFileSync(resolve(root, s.source_file));
    assert.equal(createHash('sha256').update(raw).digest('hex'), s.source_sha256, `Source changed: ${s.source_file}`);
    live = JSON.parse(raw);
    assert.deepEqual(live.sections.find(x=>x.id==='vocabulary'), s.vocabulary);
    assert.deepEqual(live.sections.filter(x=>x.id.startsWith('common_expressions')), s.expressions);
  }
  const actual = pack.vocabulary.filter(x=>x.introduced_lesson_id === s.lesson_key);
  const entries = ['entries', 'proper_nouns', 'idioms'].flatMap(k=>s.vocabulary[k] ?? []);
  assert.deepEqual(actual.map(x=>[x.word,x.pinyin]), entries.map(x=>Array.isArray(x)?x.slice(0,2):[x.word,x.pinyin ?? '']));
  vocabularyCount += entries.length;
  const prompts = pack.exercises.filter(x=>x.introduced_lesson_id === s.lesson_key);
  assert.deepEqual(prompts, s.pptx_examples);
  promptCount += s.pptx_examples.length;
  if (live) for (const item of actual) {
    const ref = item.source_pointer.split('/').slice(1).reduce((v,k)=>v[k],live);
    assert.equal(item.word ?? item.prompt, typeof ref==='string'?ref:Array.isArray(ref)?ref[0]:ref.word ?? ref.expression);
  }
}
assert.equal(vocabularyCount,pack.vocabulary.length);
assert.equal(promptCount,pack.exercises.length);
if (root) execFileSync('python3', [fileURLToPath(new URL('./validate-pptx.py', import.meta.url)), '--source-root', root], {stdio:'inherit'});
console.log(`Source fidelity verified: ${vocabularyCount} vocabulary / ${pack.sentence_patterns.length} sentence patterns / ${promptCount} PPT examples against ${root?'live read-only originals + hashes':'bundled source snapshots'}.`);
