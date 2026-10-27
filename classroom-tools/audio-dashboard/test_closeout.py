import json
import tempfile
import unittest
from pathlib import Path
from closeout import check_exam, digest, safe, teacher_answers, build_closeouts


class CloseoutTests(unittest.TestCase):
    def setUp(self):
        # Temporary fixture stays inside the tool root; no real assessment is modified.
        self.tmp = tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parent, prefix='.closeout-test-')
        self.root = Path(self.tmp.name)
        self.folder = self.root / 'exam'
        self.folder.mkdir()
        self.exam = dict(exam_id='W99-TEST', directory='exam', question_count=1, points=4, audio_count=1, form_id='form')
        self.bank = dict(exam_id='W99-TEST', items=[dict(id='q1', number=1, points=4, options=['one','two'], answer='A', answer_index=0, answer_text='one', audio_id='audio')])
        self.write('items.json', self.bank)
        self.write('form-sections.json', dict(assessment_id='W99-TEST', sections=[dict(question_start=1, question_end=1, audio_ids=['audio'])]))
        (self.folder/'audio.wav').write_bytes(b'audio fixture')
        self.write('audio-manifest.json', [dict(audio_id='audio', file='audio.wav', sha256=digest(self.folder/'audio.wav'), question_ids=['q1'])])
        (self.folder/'teacher.md').write_text('|1|A（one）|audio|\n')
        (self.folder/'score-sheet.csv').write_text('student_id,Q1,total_4\n')

    def tearDown(self):
        self.tmp.cleanup()

    def write(self, name, data):
        (self.folder/name).write_text(json.dumps(data))

    def checks(self):
        return {c['label']: c for c in check_exam(self.root, self.exam)['checks']}

    def test_local_pass_does_not_imply_remote_or_human_pass(self):
        c = self.checks()
        self.assertEqual(c['教师答案卷']['status'], 'pass')
        self.assertEqual(c['题组与音频对应']['status'], 'pass')
        self.assertEqual(c['Form／Sheets 读回记录']['status'], 'unknown')
        self.assertEqual(c['教师亲听与教室播放']['status'], 'unknown')
        output = json.dumps(check_exam(self.root,self.exam))
        self.assertNotIn('one',output)
        self.assertNotIn('two',output)

    def test_changed_input_invalidates_saved_evidence(self):
        (self.root/'evidence.json').write_text('{}')
        self.write('form-sync.json',dict(items_sha256='old',verification_evidence='evidence.json'))
        self.assertEqual(self.checks()['Form／Sheets 读回记录']['status'],'stale')

    def test_missing_evidence_is_unknown_even_with_matching_hash(self):
        self.write('form-sync.json',dict(items_sha256=digest(self.folder/'items.json'),verification_evidence='absent.json'))
        self.assertEqual(self.checks()['Form／Sheets 读回记录']['status'],'unknown')

    def test_invalid_answer_and_teacher_disagreement(self):
        self.bank['items'][0]['answer_index']=1
        self.bank['items'][0]['answer']='B'
        self.write('items.json',self.bank)
        c=self.checks()
        self.assertEqual(c['题库答案键']['status'],'mismatch')
        self.assertEqual(c['教师答案卷']['status'],'mismatch')

    def test_missing_audio_and_overlapping_sections(self):
        self.write('audio-manifest.json',[dict(audio_id='audio',file='missing.wav',sha256='x',question_ids=['q1'])])
        self.write('form-sections.json',dict(assessment_id='W99-TEST',sections=[dict(question_start=1,question_end=1,audio_ids=['audio'])]*2))
        c=self.checks()
        self.assertEqual(c['音频文件']['status'],'mismatch')
        self.assertEqual(c['题组与音频对应']['status'],'mismatch')

    def test_malformed_or_missing_source_reports_problem(self):
        (self.folder/'items.json').write_text('{')
        self.assertEqual(self.checks()['输入资料']['status'],'mismatch')
        self.exam['directory']='missing'
        self.assertEqual(self.checks()['输入资料']['status'],'mismatch')

    def test_escaping_path_rejected(self):
        with self.assertRaises(ValueError): safe(self.root, '../outside')
        (self.root/'escape').symlink_to(self.root.parent)
        with self.assertRaises(ValueError): safe(self.root, 'escape/outside')
        self.exam['directory']='../outside'
        self.assertEqual(self.checks()['输入资料']['status'],'mismatch')

    def test_combined_evidence_requires_matching_identity_hash_revision_and_zero_counts(self):
        current_hash=digest(self.folder/'items.json')
        combined=dict(exam_id='W99-TEST',items_sha256=current_hash,form_revision='rev1',
                      form_readback_mismatches=0,sheet_readback_mismatches=0)
        self.write('form-sync.json',dict(status='CONTENT_SYNCED_VERIFIED_UNPUBLISHED_BACKEND_PENDING',
                   items_sha256=current_hash,form_revision='rev1',verification_evidence='evidence.json'))
        (self.root/'evidence.json').write_text(json.dumps(combined))
        self.assertEqual(self.checks()['Form／Sheets 读回记录']['status'],'recorded')
        mutations=[('form_readback_mismatches',1),('sheet_readback_mismatches',None),
                   ('form_readback_mismatches',False),('exam_id','OTHER'),
                   ('items_sha256','old'),('form_revision','old')]
        for key,value in mutations:
            with self.subTest(key=key,value=value):
                invalid={**combined,key:value}
                (self.root/'evidence.json').write_text(json.dumps(invalid))
                self.assertEqual(self.checks()['Form／Sheets 读回记录']['status'],'unknown')
        del combined['sheet_readback_mismatches']
        (self.root/'evidence.json').write_text(json.dumps(combined))
        self.assertEqual(self.checks()['Form／Sheets 读回记录']['status'],'unknown')

    def test_score_headers_reject_extra_duplicate_and_wrong_total(self):
        for header in ['student_id,Q1,Q99,total_4', 'student_id,Q1,Q1,total_4',
                       'student_id,Q1,total_40', 'student_id,Q1,total_4,total_4']:
            with self.subTest(header=header):
                (self.folder/'score-sheet.csv').write_text(header+'\n')
                self.assertEqual(self.checks()['本地成绩表列']['status'],'mismatch')
        (self.folder/'score-sheet.csv').write_text('student_id,MC_points_out_of_4,total_out_of_4\n')
        self.assertEqual(self.checks()['本地成绩表列']['status'],'unknown')

    def test_malformed_registry_replaces_cache_with_visible_error(self):
        folder=self.root/'lessons/boya-elementary-i'
        folder.mkdir(parents=True)
        (folder/'assessment-management.json').write_text('[]')
        result=build_closeouts(self.root,self.root)
        self.assertEqual(result['exams'],[])
        self.assertIn('error',result)
        self.assertIn('error',(self.root/'closeout-data.js').read_text())

    def test_wrong_player_file_is_a_mismatch(self):
        c = {c['label']: c for c in check_exam(self.root, self.exam, [dict(id='audio',file='missing.wav')])['checks']}
        self.assertEqual(c['播放台顺序']['status'],'mismatch')

    def test_failed_sync_cannot_be_recorded(self):
        (self.root/'evidence.json').write_text('{}')
        self.write('form-sync.json',dict(status='FAILED',items_sha256=digest(self.folder/'items.json'),form_evidence='evidence.json',sheet_evidence='evidence.json'))
        self.assertEqual(self.checks()['Form／Sheets 读回记录']['status'],'unknown')
        self.write('form-sync.json',[])
        self.assertEqual(self.checks()['输入资料']['status'],'mismatch')

    def test_supported_teacher_formats_and_duplicates(self):
        self.assertEqual(teacher_answers('1. Prompt\n答案：B，内容（4分）'), {1:'B，内容（4分）'})
        self.assertEqual(teacher_answers('## 第1题｜答案B｜4分'), {1:'B'})
        self.assertEqual(teacher_answers('1. **B　内容**（4分）'), {1:'B　内容'})
        with self.assertRaises(ValueError): teacher_answers('|1|A|\n|1|B|')


if __name__ == '__main__':
    unittest.main()
