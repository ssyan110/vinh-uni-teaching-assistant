"""An active future book must never display the historical book's title."""
import json
from test_scoped_content_approval import ScopedContentTests
from dashboard_context import load_dashboard_context


class DashboardReferenceIdentityTests(ScopedContentTests):
    def test_registry_title_overrides_stale_legacy_label(self):
        cfg = json.loads((self.root / 'project.config.json').read_text())
        cfg.update(dashboard_root='dashboard', active_textbook_title='WRONG OLD BOOK',
                   active_context={'lesson_key': self.key, 'textbook_id': 'book',
                                   'lesson_id': 'lesson-04', 'offering_id': '2026-fall'})
        self.write(self.root / 'project.config.json', cfg)
        registry = json.loads((self.root / 'course/lesson-registry.json').read_text())
        registry['textbooks'] = [{'textbook_id': 'book', 'title': '正确的新教材'}]
        self.write(self.root / 'course/lesson-registry.json', registry)
        self.assertEqual(load_dashboard_context(self.root).textbook_title, '正确的新教材')
