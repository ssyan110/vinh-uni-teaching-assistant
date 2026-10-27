"""Read-only tests: a candidate plan cannot approve, promote, or publish."""
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import plan_classroom_release as plan


class ClassroomReleasePlanTests(unittest.TestCase):
    def test_embedded_and_local_resources_are_inventoried(self):
        html = '<style>.x{background:url("assets/a.png")}</style><img src="assets/b.png"><img src="data:image/png;base64,AA">'
        self.assertEqual(plan.local_resource_refs(html), {'assets/a.png', 'assets/b.png'})

    def test_external_traversal_and_css_import_are_rejected(self):
        for html in ('<img src="https://example.org/a.png">', '<img src="../a.png">',
                     '<img src="/a.png">', '<style>@import "https://x/a.css";</style>',
                     '<base href="/">', '<script src="//example.org/a.js"></script>'):
            with self.subTest(html=html), self.assertRaises(ValueError):
                plan.local_resource_refs(html)

    def test_missing_and_unknown_deck_fail_closed(self):
        result = plan.review_plan('not-a-real-deck')
        self.assertEqual(result['status'], 'blocked')
        self.assertFalse(result['write_performed'])
        self.assertFalse(result['approval_granted'])
        self.assertFalse(result['release_supported'])

    def test_package_inputs_reject_path_traversal_and_missing_hash(self):
        for record in ({'path': '../escape', 'sha256': '0' * 64},
                       {'path': '/absolute', 'sha256': '0' * 64},
                       {'path': 'missing.png', 'sha256': ''}):
            with self.subTest(record=record), self.assertRaises(ValueError):
                plan.checked_record(ROOT, record)


if __name__ == '__main__':
    unittest.main()
