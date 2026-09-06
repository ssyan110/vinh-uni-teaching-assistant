"""Synthetic fixtures test routing/safety only; they are not teaching artifacts."""
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import lessonctl
from lesson_context import LessonContext, LessonContextError, resolve_lesson_context

KEY = 'boya-quasi-intermediate-i:lesson-10'


class LessonctlSafetyTests(unittest.TestCase):
    def test_duplicate_preflight_is_structured_blocker(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            for name in ('a', 'b'):
                (root / name).mkdir()
                (root / name / 'lesson-10-在线预习.pptx').touch()
            result = lessonctl.finalized_preflight(KEY, root)
            self.assertEqual(result['status'], 'blocked')
            self.assertIn('ambiguous', ' '.join(result['blockers']))
            self.assertTrue(result['blocker_records'])
            self.assertEqual([item['message'] for item in result['blocker_records']], result['blockers'])

    def test_exact_files_only_not_backups_directories_or_symlinks(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / 'lesson-10-在线预习.pptx.bak').touch()
            (root / 'lesson-10-在线预习.pptx').mkdir()
            (root / 'target').touch()
            (root / 'lesson-10-实体课.pptx').symlink_to(root / 'target')
            self.assertEqual(lessonctl.finalized_deck_paths(KEY, root), {})

    def test_wrong_textbook_and_unregistered_lesson_blocked(self):
        with tempfile.TemporaryDirectory() as temp:
            for key in ('boya-intermediate-i:lesson-01', 'unknown:lesson-10',
                        'boya-quasi-intermediate-i:lesson-99'):
                with self.subTest(key=key):
                    result = lessonctl.finalized_preflight(key, Path(temp))
                    self.assertEqual(result['status'], 'blocked')

    def test_run_path_traversal_rejected_before_writes(self):
        with tempfile.TemporaryDirectory() as temp, patch.object(lessonctl, 'PROJECT_ROOT', Path(temp)), patch.object(lessonctl, 'finalized_preflight', return_value={'status': 'ready'}):
            for run_id in ('../escape', '/tmp/escape', '.', '..', ''):
                with self.subTest(run_id=run_id):
                    result = lessonctl.build_finalized(KEY, Path(temp), run_id)
                    self.assertEqual(result['status'], 'blocked')
            self.assertEqual(list(Path(temp).iterdir()), [])

    def test_qa_rejects_traversal_and_wrong_corpus(self):
        for key, run_id in ((KEY, '../escape'), ('boya-intermediate-i:lesson-01', 'safe')):
            with self.subTest(key=key, run_id=run_id):
                self.assertEqual(lessonctl.qa_finalized(key, run_id)['status'], 'blocked')

    def test_run_symlink_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / '.agent/runs').mkdir(parents=True)
            (root / 'elsewhere').mkdir()
            (root / '.agent/runs/linked').symlink_to(root / 'elsewhere', target_is_directory=True)
            with patch.object(lessonctl, 'PROJECT_ROOT', root):
                with self.assertRaises(LessonContextError):
                    lessonctl.safe_run_root('linked')
                self.assertEqual(lessonctl.safe_run_root('safe-run'), root.resolve() / '.agent/runs/safe-run')

    def test_all_l02_l12_derived_paths_are_scoped(self):
        for number in range(2, 13):
            context = resolve_lesson_context(ROOT, f'boya-quasi-intermediate-i:lesson-{number:02d}')
            for prop, suffix in {'source_root': '00-source', 'canonical_source': '00-source/canonical-source.json', 'design_root': '10-design', 'authority_root': '20-approved', 'qa_root': '30-qa', 'release_root': '40-release'}.items():
                with self.subTest(number=number, prop=prop):
                    self.assertEqual(getattr(context, prop), context.lesson_root / suffix)

    def test_derived_path_symlink_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / 'other').mkdir()
            (root / '10-design').symlink_to(root / 'other', target_is_directory=True)
            context = LessonContext(KEY, '2026-fall', 'boya-quasi-intermediate-i', 'lesson-10', root, {})
            with self.assertRaises(LessonContextError):
                _ = context.design_root


if __name__ == '__main__':
    unittest.main()
