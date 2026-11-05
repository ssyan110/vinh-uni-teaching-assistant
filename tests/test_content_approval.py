"""Synthetic approval checks; no real lesson approval or media generation."""
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import production_gate as gate
from workflow_integrity import sha256


class ContentApprovalTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.key = "book:lesson-04"
        self.lesson = self.root / "lessons/book/lesson-04"
        self.story = self.lesson / "10-design/storyboard"
        self.record = self.story / "lesson-04-content-approval.json"
        self.write(self.root / "project.config.json", {"lesson_registry": "course/lesson-registry.json"})
        self.write(self.root / "course/lesson-registry.json", {"lessons": [{
            "lesson_key": self.key, "textbook_id": "book", "lesson_id": "lesson-04",
            "lesson_path": "lessons/book/lesson-04", "offering_ids": ["2026-fall"]}]})
        source = self.lesson / "00-source/canonical-source.json"
        review = self.story / "lesson-04-逐页文案审阅.md"
        evidence = self.story / "explicit-user-decision.md"
        self.write(source, {"lesson_key": self.key})
        self.write(review, "SYNTHETIC current content v1")
        self.write(evidence, "SYNTHETIC user explicitly approves the current content v1.")
        self.data = {"lesson_key": self.key, "offering_id": "2026-fall",
                     "status": "approved", "gate": "lesson-content",
                     "approved_by": "Adam", "approved_at": "2026-09-19T16:00:00+07:00",
                     "artifacts": [{"path": self.rel(p), "sha256": sha256(p)} for p in (source, review)],
                     "evidence": self.rel(evidence), "evidence_sha256": sha256(evidence)}
        self.write(self.record, self.data)
        self.write(self.lesson / "00-source/source-manifest.json", {"lesson_key": self.key})
        self.write(self.lesson / "00-source/audio-manifest.json", {})
        self.write(self.lesson / "10-design/assets/image-manifest.json", {"can_enter_ppt": True})
        self.write(self.story / "lesson-04-source-refs.csv", "source,page\n")
        self.write(self.story / "lesson-04-boundary-confirmation.md", "Structure only")
        patcher = patch.multiple(gate, PROJECT_ROOT=self.root,
                                LESSON_REGISTRY=self.root / "course/lesson-registry.json")
        patcher.start()
        self.addCleanup(patcher.stop)

    def rel(self, path):
        return path.relative_to(self.root).as_posix()

    def write(self, path, value):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(value) if isinstance(value, dict) else value, encoding="utf-8")

    def check(self):
        return gate.check_content_approval(self.key, "2026-fall")

    def test_valid_approval_and_draft_gate_are_read_only(self):
        before = {self.rel(p): sha256(p) for p in self.root.rglob("*") if p.is_file()}
        self.assertEqual(self.check()["status"], "ready")
        self.assertEqual(gate.check_lesson_ppt_draft(self.key)["status"], "ready")
        after = {self.rel(p): sha256(p) for p in self.root.rglob("*") if p.is_file()}
        self.assertEqual(before, after)

    def test_structure_and_images_do_not_unlock_pending_content(self):
        self.data["status"] = "pending"
        self.write(self.record, self.data)
        result = gate.check_lesson_ppt_draft(self.key)
        self.assertEqual(result["status"], "blocked")
        self.assertTrue(any("content approval" in b for b in result["blockers"]))

    def test_missing_record_fails_closed(self):
        self.record.rename(self.record.with_suffix(".saved"))
        self.assertEqual(self.check()["status"], "blocked")

    def test_wrong_states_scope_and_incomplete_evidence_fail_closed(self):
        for field, value in (("status", "not_approved"), ("status", "draft_not_approved"),
                             ("gate", "boundary"), ("lesson_key", "book:lesson-03"),
                             ("offering_id", "another-term"), ("approved_by", ""),
                             ("approved_at", "2026-09-19"), ("artifacts", []),
                             ("evidence_sha256", "0" * 64), ("evidence", self.rel(self.record)),
                             ("evidence", "../outside.md")):
            with self.subTest(field=field, value=value):
                self.write(self.record, {**self.data, field: value})
                self.assertEqual(self.check()["status"], "blocked")

    def test_changed_content_and_evidence_invalidate_approval(self):
        for relative in [a["path"] for a in self.data["artifacts"]] + [self.data["evidence"]]:
            with self.subTest(path=relative):
                path = self.root / relative
                previous = path.read_text()
                self.write(path, previous + " changed")
                self.assertEqual(self.check()["status"], "blocked")
                self.write(path, previous)

    def test_malformed_and_cross_lesson_artifact_fail_closed(self):
        for payload in ([], "not json", {**self.data, "artifacts": [None]},
                        {**self.data, "artifacts": [{"path": "lessons/book/lesson-03/copy.md", "sha256": "x"}]}):
            with self.subTest(payload=payload):
                self.write(self.record, json.dumps(payload))
                self.assertEqual(self.check()["status"], "blocked")

    def test_negative_approval_words_are_not_approved(self):
        for status in ("not_approved", "draft_not_approved", "unapproved", "pending_approved", None):
            self.assertFalse(gate.is_approved_status(status))
        self.assertTrue(gate.is_approved_status("approved"))


if __name__ == "__main__":
    unittest.main()
