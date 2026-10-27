import json
import subprocess
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import agent_loop
from verify_pptx_audio_policy import verify
from audit_requirements_coverage import audit, _registry_rows
from verify_boya_face_to_face_order import verify_lesson


class ExecutionRunTests(unittest.TestCase):
    def test_project_run_completes_without_lesson_or_approval(self):
        with tempfile.TemporaryDirectory(dir=ROOT / '.agent') as folder:
            root = Path(folder)
            state = agent_loop.create_run(root, 'test', None, 'rules', 'audit', 'draft', ['checked'], 'reports', scope='project')
            self.assertIsNone(state['lesson_key'])
            state = agent_loop.run_preflight(root, 'test')
            self.assertFalse(state['latest_preflight']['production_authorized'])
            agent_loop.record_attempt(root, 'test', 'reviewed')
            (root / 'evidence.txt').write_text('checked')
            state = agent_loop.record_result(root, 'test', 'passed', 'checked', ['evidence.txt'], True)
            self.assertEqual([], agent_loop.validate_state(root, state, check_evidence=True))
            state['lesson_key'] = 'fake:lesson-01'
            self.assertTrue(agent_loop.validate_state(root, state, check_evidence=True))

    def test_protected_output_and_production_purpose_rejected(self):
        for output, purpose in [('lessons/x/20-approved', 'audit'), ('.', 'audit'), ('reports', 'pptx'), ('../escape', 'audit')]:
            with self.assertRaises(ValueError):
                agent_loop.create_run(ROOT, 'must-not-exist', None, 'rules', purpose, 'draft', ['checked'], output, scope='tool')


class AudioPolicyTests(unittest.TestCase):
    def test_current_classroom_cannot_use_legacy_order_checker(self):
        with self.assertRaises(ValueError):
            verify_lesson(9, mode='classroom')

    def test_isolated_real_package_has_only_plain_source_reference(self):
        with tempfile.TemporaryDirectory(dir=ROOT / '.agent') as folder:
            target = Path(folder) / 'fixture.pptx'
            script = """const P = require('pptxgenjs'); const {addAudioReference,requestedMode}=require('./scripts/pptx_audio_reference');
            if(requestedMode([])!=='online')throw Error('default');
            if(requestedMode(['--mode','legacy-face'])!=='legacy-face')throw Error('legacy');
            let rejected=false;try{requestedMode([],{BOYA_FACE_ONLY:'1'})}catch(e){rejected=true}if(!rejected)throw Error('implicit face');
            const p = new P();p.layout='LAYOUT_WIDE';addAudioReference(p.addSlide(),'7-2');p.writeFile({fileName:process.argv[1]});"""
            subprocess.run(['node', '-e', script, str(target)], cwd=ROOT, check=True)
            self.assertEqual([], verify(target))
            with zipfile.ZipFile(target) as package:
                xml = package.read('ppt/slides/slide1.xml').decode()
                self.assertIn('Audio 7-2', xml)
                self.assertIn('Times New Roman', xml)
                self.assertNotIn('hlinkClick', xml)
                self.assertNotIn('<p:pic', xml)
                self.assertNotIn('<a:solidFill><a:srgbClr val="F', xml)

    def test_package_checker_rejects_audio_and_playable_relationship(self):
        with tempfile.TemporaryDirectory(dir=ROOT / '.agent') as folder:
            path = Path(folder) / 'bad.pptx'
            with zipfile.ZipFile(path, 'w') as package:
                package.writestr('ppt/media/a.mp3', b'audio')
                package.writestr('ppt/slides/_rels/slide1.xml.rels', '<Relationships><Relationship Type="x/audio" Target="a.mp3"/></Relationships>')
                package.writestr('ppt/slides/slide1.xml', '<root><audio/><hlinkClick action="ppaction://media"/></root>')
            self.assertEqual(4, len(verify(path)))


class CoverageTests(unittest.TestCase):
    def test_classroom_format_is_not_a_paired_pptx_requirement(self):
        for name in ('AGENTS.md', 'PROJECT_REQUIREMENTS.md'):
            with self.subTest(file=name):
                text = (ROOT / name).read_text(encoding='utf-8')
                self.assertIn('所有學期的實體課一律使用 OpenSlide', text)
                self.assertIn('PPT／PPTX 用於線上預習', text)
                self.assertNotIn('每課兩份課堂 PPTX 固定命名', text)

    def test_dated_heading_and_malformed_id_cannot_disappear(self):
        with tempfile.TemporaryDirectory(dir=ROOT / '.agent') as folder:
            root = Path(folder)
            (root / 'docs/workflow').mkdir(parents=True)
            (root / 'PROJECT_REQUIREMENTS.md').write_text('## 1. Scope\n## 2026-10-15 New rule\n')
            (root / 'docs/workflow/requirements-registry.md').write_text('| BAD | rule | `PROJECT_REQUIREMENTS.md` §1 | project | review | active |\n')
            codes = {x['code'] for x in audit(root)['findings']}
            self.assertIn('registry_supplement_unmapped', codes)
            self.assertIn('registry_invalid_id', codes)


if __name__ == '__main__':
    unittest.main()
