import base64
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('workspace_sync', ROOT / 'scripts/sync_open_slide_workspace.py')
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)


class WorkspaceSyncTest(unittest.TestCase):
    def test_new_multilesson_deck_requires_scoped_per_lesson_approvals(self):
        with tempfile.TemporaryDirectory(dir=ROOT / 'tests') as directory:
            root = Path(directory).resolve()
            (root / 'course').mkdir()
            keys = ['book:lesson-01', 'book:lesson-02']
            entries = [{'lesson_key': key, 'lesson_path': f'lessons/book/lesson-0{i}', 'offering_ids': ['term']} for i, key in enumerate(keys, 1)]
            (root / 'course/lesson-registry.json').write_text(json.dumps({'lessons': entries}))
            source_dir = root / 'lessons/book/lesson-01/10-design/open-slide-draft/term/session-v1'
            source_dir.mkdir(parents=True)
            source = source_dir / 'deck.html'
            source.write_text('<html></html>')
            manifest = {'lesson_keys': keys, 'offering_id': 'term', 'class_scope': 'class-a', 'entry_file': 'deck.html'}
            (source_dir / 'manifest.json').write_text(json.dumps(manifest))
            profile = {'draft_manifest': (source_dir / 'manifest.json').relative_to(root).as_posix(), 'reference': 'reference', 'reference_sha256': 'hash', 'expected_route_cards': 4, 'expected_route_columns': 4}
            contract = {'owner_lesson_key': keys[0], 'lesson_keys': keys, 'offering_id': 'term', 'class_scope': 'class-a', 'references': {'route': {'path': 'reference', 'sha256': 'hash'}}, 'pages': [{'role': 'route', 'expected_images': [], 'expected_route_cards': 4, 'expected_route_columns': 4}]}
            deck = {'id': 'session-v1', 'lesson_key': keys[0], 'lesson_keys': keys, 'offering_id': 'term', 'class_scope': 'class-a', 'source': source.relative_to(root).as_posix(), 'approval_records': {keys[0]: 'record-a', keys[1]: 'record-b'}}
            with patch.object(sync, 'ROOT', root), patch.object(sync.subprocess, 'run') as run:
                run.return_value.returncode = 0
                run.return_value.stdout = '{"status":"ready"}'
                run.return_value.stderr = ''
                sync.check_registered_identity(deck, source, profile, contract)
                self.assertEqual(run.call_count, 2)
                self.assertIn('--class-scope', run.call_args_list[0].args[0])
                deck['approval_records'].pop(keys[1])
                with self.assertRaisesRegex(ValueError, 'every lesson'):
                    sync.check_registered_identity(deck, source, profile, contract)
                deck.pop('approval_records')
                with self.assertRaisesRegex(ValueError, 'explicit per-lesson'):
                    sync.check_registered_identity(deck, source, profile, contract)

    def test_only_requested_page_loads_its_images(self):
        with tempfile.TemporaryDirectory(dir=ROOT / 'tests') as directory:
            root = Path(directory)
            (root / 'first.png').write_bytes(b'first')
            (root / 'second.png').write_bytes(b'second')
            source = root / 'deck.html'
            source.write_text('<div class="os-page"><img src="first.png"></div>\n'
                              '<section class="task os-page" hidden><img src="second.png"></section>')
            html = sync.embed_images(source, 1)
            self.assertNotIn(base64.b64encode(b'first').decode(), html)
            self.assertIn(base64.b64encode(b'second').decode(), html)

    def test_images_and_path_escape(self):
        with tempfile.TemporaryDirectory(dir=ROOT / 'tests') as directory:
            root = Path(directory)
            (root / 'image.png').write_bytes(b'png')
            source = root / 'deck.html'
            source.write_text('<img src="image.png"><img src="data:image/png;base64,YQ==">')
            html = sync.embed_images(source)
            self.assertIn('data:image/png;base64,cG5n', html)
            self.assertIn('data:image/png;base64,YQ==', html)
            source.write_text('<img src="../outside.png">')
            with self.assertRaises(ValueError):
                sync.embed_images(source)

    def test_registered_visual_profiles_pass_or_match_pinned_legacy_hashes(self):
        registry = json.loads((ROOT / 'course/open-slide-workspace.json').read_text())
        for deck in registry['html_decks']:
            with self.subTest(deck=deck['id']):
                source = sync.inside(ROOT / deck['source'], ROOT / 'lessons')
                self.assertTrue(sync.check_visual_profile(deck, source))

    def test_new_deck_without_visual_profile_cannot_sync(self):
        source = ROOT / 'lessons/boya-elementary-i/lesson-13/10-design/open-slide-draft/w06-l13-l14/lesson-13-14-实体课.html'
        with self.assertRaisesRegex(ValueError, 'visual_check profile is required'):
            sync.check_visual_profile({'id': 'new-deck'}, source)

    def test_visual_profile_requires_explicit_page_type_inventory(self):
        source = ROOT / 'lessons/boya-elementary-i/lesson-13/10-design/open-slide-draft/w06-l13-l14/lesson-13-14-实体课.html'
        deck = {
            'id': 'synthetic-deck',
            'visual_check': {
                'reference': 'lessons/boya-elementary-i/lesson-11/10-design/open-slide-draft/lesson-11-12-v09-readable/lesson-11-12-实体课.html',
                'reference_sha256': '3ff376220782b1c31e706a44d8c9c539230625c0a930e852d2f3d43fee812ffb',
                'expected_route_cards': 4,
                'expected_route_columns': 2,
            },
        }
        with self.assertRaisesRegex(ValueError, 'explicit discussion/comic/report page ID lists'):
            sync.check_visual_profile(deck, source)

    def test_visual_regression_failure_blocks_sync(self):
        source = ROOT / 'lessons/boya-elementary-i/lesson-13/10-design/open-slide-draft/w06-l13-l14/lesson-13-14-实体课.html'
        deck = {
            'id': 'synthetic-deck',
            'visual_check': {
                'reference': 'lessons/boya-elementary-i/lesson-11/10-design/open-slide-draft/lesson-11-12-v09-readable/lesson-11-12-实体课.html',
                'reference_sha256': '3ff376220782b1c31e706a44d8c9c539230625c0a930e852d2f3d43fee812ffb',
                'expected_route_cards': 4,
                'expected_route_columns': 2,
                'page_types': {
                    'discussion': [
                        'w06-life-vinh-shopping-question', 'w06-life-vinh-shopping-support',
                        'w06-life-vietnam-birthday-question', 'w06-life-vietnam-birthday-support',
                        'w06-life-taipei-birthday-question', 'w06-life-taipei-birthday-support',
                    ],
                    'comic': ['w06-l13-comic', 'w06-l14-comic'],
                    'report': ['w06-l13-report', 'w06-l14-report'],
                },
            },
        }
        with patch.object(sync.VISUAL_CHECKER, 'check', return_value=['synthetic layout regression']):
            with self.assertRaisesRegex(ValueError, 'synthetic layout regression'):
                sync.check_visual_profile(deck, source)

    def test_rendered_report_missing_stale_or_failed_blocks_sync(self):
        registry = json.loads((ROOT / 'course/open-slide-workspace.json').read_text())
        source = ROOT / registry['html_decks'][0]['source']
        deck = json.loads(json.dumps(registry['html_decks'][0]))
        report_path = ROOT / deck['visual_check']['rendered_layout_report']
        original = json.loads(report_path.read_text())
        real_read_text = Path.read_text
        for fault in ('missing-profile', 'stale-hash', 'failed-geometry', 'missing-page'):
            candidate = json.loads(json.dumps(original))
            current_deck = json.loads(json.dumps(deck))
            if fault == 'missing-profile':
                current_deck['visual_check'].pop('rendered_layout_report')
            elif fault == 'stale-hash':
                candidate['deck_sha256'] = '0' * 64
            elif fault == 'failed-geometry':
                candidate['pages'][3]['issues'] = [{'kind': 'footer-clearance', 'gap': 0}]
            else:
                candidate['pages'].pop()
            def read_text(path, *args, **kwargs):
                return json.dumps(candidate) if path == report_path else real_read_text(path, *args, **kwargs)
            with self.subTest(fault=fault), patch.object(Path, 'read_text', read_text):
                with self.assertRaisesRegex(ValueError, 'rendered'):
                    sync.check_visual_profile(current_deck, source)

    def test_counterfeit_rendered_report_without_measurements_cannot_pass(self):
        registry = json.loads((ROOT / 'course/open-slide-workspace.json').read_text())
        deck = registry['html_decks'][0]
        source = ROOT / deck['source']
        report_path = ROOT / deck['visual_check']['rendered_layout_report']
        fake = json.loads(report_path.read_text())
        fake['pages'] = [{'page': i + 1, 'issues': []} for i in range(18)]
        fake['negative'] = [{'pass': True}, {'pass': True}]
        real = Path.read_text
        def read_text(path, *args, **kwargs):
            return json.dumps(fake) if path == report_path else real(path, *args, **kwargs)
        with patch.object(Path, 'read_text', read_text):
            with self.assertRaisesRegex(ValueError, 'rendered'):
                sync.check_visual_profile(deck, source)

    def test_wrong_lesson_identity_cannot_pass_visual_profile(self):
        registry = json.loads((ROOT / 'course/open-slide-workspace.json').read_text())
        deck = json.loads(json.dumps(registry['html_decks'][0]))
        source = ROOT / deck['source']
        deck['lesson_key'] = 'boya-elementary-i:lesson-99'
        deck['lesson_keys'] = ['boya-elementary-i:lesson-99']
        with self.assertRaisesRegex(ValueError, 'identity|lesson'):
            sync.check_visual_profile(deck, source)

    def test_changed_visual_reference_hash_blocks_sync(self):
        registry = json.loads((ROOT / 'course/open-slide-workspace.json').read_text())
        deck = registry['html_decks'][0]
        source = sync.inside(ROOT / deck['source'], ROOT / 'lessons')
        with patch.object(sync, 'file_sha256', return_value='0' * 64):
            with self.assertRaisesRegex(ValueError, 'visual reference SHA-256 changed'):
                sync.check_visual_profile(deck, source)


if __name__ == '__main__':
    unittest.main()
