"""Bounded checks for registered classroom-page discovery."""
import unittest
from sync_open_slide_workspace import adapt_html, page_count, select_decks


class PageDiscoveryTest(unittest.TestCase):
    def test_scoped_sync_requires_one_registered_target_and_preserves_inventory(self):
        decks = [{'id': 'target'}, {'id': 'other'}]
        self.assertEqual(select_decks(decks, 'target'), [decks[0]])
        self.assertIs(select_decks(decks), decks)
        self.assertEqual(len(decks), 2)
        with self.assertRaises(ValueError):
            select_decks(decks, 'missing')
        with self.assertRaises(ValueError):
            select_decks([{'id': 'target'}, {'id': 'target'}], 'target')

    def test_entry_waits_for_assets_and_thumbnail_motion_is_frozen(self):
        source = '<head></head><body><script>fit();\n  go(0);\n</script></body>'
        result = adapt_html(source)
        self.assertNotIn('go(0);', result)
        self.assertIn("go(Number(new URLSearchParams(location.search).get('os-page')))", result)
        self.assertIn("window.addEventListener('load'", result)
        self.assertLess(result.index("classList.add('os-loading')"), result.index('fit();'))
        self.assertLess(result.index("active.classList.remove('deck-enter')"),
                        result.index("classList.remove('os-loading')"))
        self.assertIn('html.os-static * { animation: none !important', result)
        self.assertIn("get('os-static') === '1'", result)
        self.assertIn('go(0);', source)

    def test_exact_class_and_hidden_pages(self):
        html = '''<div class="os-page" data-idx="0"></div>
        <section hidden class="task os-page" data-idx="1"></section>
        <div class="os-page-preview"></div><script>window.__classroomDeck={}</script>'''
        self.assertEqual(page_count(html), 2)

    def test_missing_navigation_rejected(self):
        with self.assertRaises(ValueError):
            page_count('<div class="os-page"></div>')


if __name__ == '__main__':
    unittest.main()
