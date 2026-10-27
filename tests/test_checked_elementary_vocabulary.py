"""Real source repairs survive OCR extraction and retain distinct lesson identities."""
import csv
import json
import unittest
import build_boya_elementary_reference_dataset as dataset


class CheckedVocabularyTests(unittest.TestCase):
    def test_source_checked_first_lesson_and_separate_qiao_survive_rebuild(self):
        book = dataset.BOOKS[1]
        appendix = dataset.extract_appendix_rows(book)
        raw = dataset.extract_vocab_rows(book,
            {dataset.clean_pinyin_key(x['pinyin']) for x in appendix}, {x['word'] for x in appendix})
        repaired = dataset.apply_checked_vocab(book, raw, appendix)
        master, occurrences = dataset.merge_and_normalize_vocab(book, repaired, appendix)
        lesson = [x for x in occurrences if x['lesson_id'] == 'lesson-01']
        expected = json.loads((dataset.OUT_DIR / 'checked-vocabulary.json').read_text())['items']
        self.assertEqual([(x['word'], x['pinyin']) for x in lesson], [(x['word'], x['pinyin']) for x in expected])
        self.assertEqual(len(lesson), 23)
        self.assertEqual(lesson[18]['word'], '头等舱')
        self.assertEqual(next(x for x in master if x['word'] == '巧')['lesson_numbers'], '7')

    def test_current_exports_have_no_orphan_vocabulary_keys(self):
        base = dataset.OUT_DIR / 'csv'
        with (base / 'vocabulary_master.csv').open(encoding='utf-8-sig') as f:
            keys = {x['vocabulary_key'] for x in csv.DictReader(f)}
        with (base / 'vocabulary_occurrences.csv').open(encoding='utf-8-sig') as f:
            rows = list(csv.DictReader(f))
        self.assertEqual({r['vocabulary_key'] for r in rows} - keys, set())
