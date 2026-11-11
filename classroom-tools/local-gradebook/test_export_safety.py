"""Checks exports using fictional data only; never opens the real database."""
import io
import unittest
from openpyxl import load_workbook
from server import export_workbook


class ExportSafetyTest(unittest.TestCase):
    def test_unicode_review_formula_and_control_characters(self):
        assessment = {'id': 'a', 'title': '=期中 tiếng Việt', 'date': '', 'instructions': '',
                      'source': {'type': 'extra', 'activity': '口语'},
                      'rubric': [{'name': '=表达', 'max': 10, 'step': .5, 'description': ''}]}
        state = {'classes': [{'id': 'test', 'students': [
            {'seat': 1, 'name': '阮 Nguyễn', 'code': '01', 'active': True}],
            'assessments': [assessment]}],
            'records': {'test|a|01': {'status': 'done', 'scores': [8], 'total': 8,
                                      'note': '中文 tiếng Việt\x01', 'flags': ['原表异常'],
                                      'updated_at': '', 'original': {}}}}
        wb = load_workbook(io.BytesIO(export_workbook(state, 'test')))
        summary, detail = wb.worksheets
        self.assertEqual(summary['B2'].value, '阮 Nguyễn')
        self.assertEqual(summary['E2'].value, '待核对')
        self.assertIn('满分 10', summary['E1'].value)
        self.assertEqual(detail['E4'].value, '待核对')
        self.assertEqual(detail['F4'].value, 8)  # Original component remains available.
        self.assertEqual(detail['G4'].value, '待核对')
        self.assertEqual(detail['H4'].value, '中文 tiếng Việt\\u0001')
        self.assertTrue(all(cell.data_type != 'f' for sheet in wb for row in sheet for cell in row))


if __name__ == '__main__':
    unittest.main()
