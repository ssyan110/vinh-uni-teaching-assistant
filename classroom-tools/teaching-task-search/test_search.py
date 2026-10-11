import unittest
import hashlib
import subprocess
import sys
from pathlib import Path
from unittest.mock import patch
import server

class SearchTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls): cls.data,cls.sources=server.corpus()
    def query(self,**kwargs): return server.search(self.data['tasks'],{k:[str(v)] for k,v in kwargs.items()})
    def test_book_isolation(self):
        rows=self.query(book='boya-quasi-intermediate-i')
        self.assertTrue(rows); self.assertTrue(all(r['lesson_key'].startswith('boya-quasi-intermediate-i:') for r in rows))
        self.assertFalse(self.query(lesson='lesson-01'))
        original=next(r for r in self.data['tasks'] if r['lesson_key']=='boya-intermediate-i:lesson-01')
        other=dict(original,textbook_id='boya-quasi-intermediate-i',lesson_key='boya-quasi-intermediate-i:lesson-01')
        isolated=server.search([original,other],{'lesson':['boya-quasi-intermediate-i:lesson-01']})
        self.assertEqual(isolated,[other])
    def test_stage_boundary(self):
        args=dict(book='boya-intermediate-i',current=1)
        self.assertFalse(self.query(**args,stage=0))
        early=self.query(**args,stage=1); complete=self.query(**args,stage=3)
        self.assertTrue(early); self.assertGreater(len(complete),len(early)); self.assertTrue(all(t['stage']==1 for t in early))
    def test_current_included(self):
        rows=self.query(book='boya-quasi-intermediate-i',current=3,stage=3)
        self.assertTrue(any(r['lesson_number']==3 for r in rows)); self.assertFalse(any(r['lesson_number']>3 for r in rows))
        self.assertFalse(any(r['lesson_number']==3 for r in self.query(book='boya-quasi-intermediate-i',current=3,stage=0)))
    def test_draft_labels(self):
        for r in self.data['tasks']:
            if '/10-design/' in r['source_path']: self.assertEqual(r['status'],'設計草案')
    def test_missing_pages(self):
        fake=dict(self.data['tasks'][0],printed_pages=None)
        self.assertIsNone(server.search([fake],{})[0]['printed_pages'])
    def test_search_common_script_equivalents(self):
        self.assertTrue(self.query(material="預習卡"))
        self.assertEqual(self.query(q="記錄"),self.query(q="记录"))
    def test_empty_and_no_matches(self):
        self.assertEqual(len(self.query()),len(self.data['tasks']))
        self.assertEqual(self.query(q='NO_SUCH_TASK_97865'),[])
        self.assertEqual(self.query(current='invalid'),[])
    def test_fidelity(self):
        for r in self.data['tasks']:
            source=self.sources[r['source_id']]['text']
            self.assertIn(r['title'],source)
            # Markdown bodies and table rows must be exact source spans.
            if r['source_path'].endswith('.md'): self.assertIn(r['instructions'],source)
    def test_source_hash_is_file_bytes(self):
        for source in self.sources.values():
            self.assertEqual(source['sha256'],hashlib.sha256((server.ROOT/source['path']).read_bytes()).hexdigest())
    def test_clean_startup_failure(self):
        process=subprocess.run([sys.executable,str(server.HERE/'server.py'),'--port','70000'],capture_output=True,text=True)
        self.assertEqual(process.returncode,1)
        self.assertIn('Task search startup failed',process.stderr)
        self.assertNotIn('Traceback',process.stderr)
    def test_five_column_activity_index(self):
        rows=[r for r in self.data['tasks'] if r['source_path'].endswith('lesson-03-活动材料索引.md')]
        self.assertEqual(len(rows),5)
        self.assertEqual(rows[0]['outcome'],'判断记录、短文信息')
        self.assertIn('lesson-03-活动01',rows[0]['materials'])
    def test_resolved_forbidden_directory(self):
        with patch.object(Path,'resolve',return_value=server.ROOT/'archive/source.md'):
            with self.assertRaises(ValueError): server.safe_source(server.ROOT/'allowed/source.md')
    def test_symlink_parent_rejected(self):
        with patch.object(Path,'is_symlink',autospec=True,side_effect=lambda p:p.name=='content'):
            with self.assertRaises(ValueError): server.safe_source(server.ROOT/'classroom-tools/speaking-challenge/content/lesson-01-p1-p2.js')
    def test_source_exception_returns_503(self):
        handler=object.__new__(server.Handler)
        with patch.object(handler,'respond',side_effect=ValueError('source unreadable')), patch.object(handler,'send_error') as error:
            handler.do_GET()
            self.assertEqual(error.call_args.args[0],503)
    def test_allowlist(self):
        for path in ['/etc/passwd',server.ROOT/'archive/test.md',server.ROOT/'../outside.md']:
            with self.assertRaises(ValueError): server.safe_source(path)
        self.assertNotIn('../../AGENTS.md',self.sources)
if __name__=='__main__': unittest.main()
