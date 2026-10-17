"""HTML preflight must not bypass content approval or lesson output isolation."""
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import production_gate as gate
from workflow_integrity import sha256


class ClassroomHtmlGateTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.key = "book:lesson-01"
        self.lesson = self.root / "lessons/book/lesson-01"
        self.story = self.lesson / "10-design/storyboard"
        self.write("project.config.json", {"lesson_registry": "course/lesson-registry.json"})
        self.write("course/lesson-registry.json", {"lessons": [{
            "lesson_key": self.key, "textbook_id": "book", "lesson_id": "lesson-01",
            "lesson_path": "lessons/book/lesson-01", "offering_ids": ["term"]}]})
        self.source = self.write("lessons/book/lesson-01/00-source/canonical-source.json", {"lesson_key": self.key})
        self.copy = self.write("lessons/book/lesson-01/10-design/storyboard/lesson-01-逐页文案审阅.md", "SYNTHETIC copy")
        evidence = self.write("lessons/book/lesson-01/10-design/storyboard/evidence.md", "SYNTHETIC explicit approval")
        self.record = self.write("lessons/book/lesson-01/10-design/storyboard/lesson-01-content-approval.json", {
            "lesson_key": self.key, "offering_id": "term", "status": "approved",
            "gate": "lesson-content", "approved_by": "Synthetic reviewer",
            "approved_at": "2026-10-15T12:00:00+07:00",
            "artifacts": [{"path": str(p.relative_to(self.root)), "sha256": sha256(p)} for p in (self.source, self.copy)],
            "evidence": str(evidence.relative_to(self.root)), "evidence_sha256": sha256(evidence)})
        self.output = "lessons/book/lesson-01/10-design/open-slide-draft/example"
        patcher = patch.object(gate, "PROJECT_ROOT", self.root)
        patcher.start()
        self.addCleanup(patcher.stop)

    def write(self, relative, value):
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(value) if isinstance(value, dict) else value)
        return path

    def check(self, output=None):
        return gate.check_classroom_html_draft(self.key, output or self.output, "term")

    def test_ready_is_read_only_and_not_release(self):
        before = {str(p): sha256(p) for p in self.root.rglob("*") if p.is_file()}
        result = self.check()
        self.assertEqual(result["status"], "ready", result)
        self.assertFalse(result["approval_granted"])
        self.assertFalse(result["release_supported"])
        self.assertEqual(before, {str(p): sha256(p) for p in self.root.rglob("*") if p.is_file()})
        self.assertFalse((self.root / self.output).exists())

    def test_missing_pending_and_changed_approval_block(self):
        original = self.record.read_text()
        self.record.write_text(original.replace('"approved"', '"pending"'))
        self.assertEqual(self.check()["status"], "blocked")
        self.record.write_text(original)
        self.copy.write_text("changed content")
        self.assertEqual(self.check()["status"], "blocked")
        self.record.rename(self.record.with_suffix(".saved"))
        self.assertEqual(self.check()["status"], "blocked")

    def test_protected_cross_lesson_and_ambiguous_paths_block(self):
        for value in ("/", str(self.root), "../outside", "lessons/book/lesson-02/10-design/open-slide-draft/x",
                      "lessons/book/lesson-01/20-approved/html", "lessons/book/lesson-01/10-design/open-slide-draft",
                      "lessons/book/lesson-01/10-design/open-slide-draft/40-release/x"):
            with self.subTest(value=value):
                self.assertEqual(self.check(value)["status"], "blocked")
        self.assertEqual(gate.check_classroom_html_draft(self.key, self.output)["status"], "blocked")

    def test_symlink_output_blocks(self):
        base = self.lesson / "10-design/open-slide-draft"
        base.mkdir()
        (base / "alias").symlink_to(self.story, target_is_directory=True)
        self.assertEqual(self.check(str(base / "alias/deck"))["status"], "blocked")
