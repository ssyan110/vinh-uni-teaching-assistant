"""Readiness must expose uncertainty and stale files without changing approvals."""
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from lesson_readiness import lesson_readiness, local_path, sha256, excluded_classroom_checks
from lesson_context import LessonContextError

PROJECT = Path(__file__).resolve().parents[1]


class ReadinessTests(unittest.TestCase):
    def test_optional_classroom_checks_need_unchanged_user_evidence(self):
        design = self.lesson / '10-design'
        proof = self.write(self.entry['lesson_path'] + '/10-design/user-scope.txt', '用户明确不需要试教或音响测试。')
        record = {'checks': ['classroom_rehearsal', 'speaker_test'],
                  'evidence': proof.relative_to(self.root).as_posix(), 'evidence_sha256': sha256(proof)}
        scope = {'offering_id': 'term-a', 'deck_id': 'deck-a', 'class_scope': 'class-a'}
        record.update(scope)
        self.assertTrue(excluded_classroom_checks(self.root, record, [design], scope))
        self.assertFalse(excluded_classroom_checks(self.root, record, [design], {**scope, 'offering_id': 'term-b'}))
        proof.write_text('changed')
        self.assertFalse(excluded_classroom_checks(self.root, record, [design], scope))

    def setUp(self):
        fixture_root = PROJECT / ".tmp/readiness-tests"
        fixture_root.mkdir(parents=True, exist_ok=True)
        self.root = Path(tempfile.mkdtemp(dir=fixture_root))
        self.key = "book-a:lesson-01"
        self.entry = dict(lesson_key=self.key, textbook_id="book-a", lesson_id="lesson-01", lesson_number=1,
                          title="第一课", lesson_path="lessons/book-a/lesson-01", offering_ids=["2026-fall"])
        self.lesson = self.root / self.entry["lesson_path"]
        self.lesson.mkdir(parents=True)
        self.write("project.config.json", {"lesson_registry": "course/lesson-registry.json"})
        self.write("course/lesson-registry.json", {"lessons": [self.entry]})
        self.gate_root = patch("production_gate.PROJECT_ROOT", self.root)
        self.gate_root.start()
        self.addCleanup(self.gate_root.stop)

    def write(self, path, payload):
        target = self.root / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(payload) if not isinstance(payload, str) else payload)
        return target

    def inspect(self, workspace=None, book=None):
        return lesson_readiness(self.root, self.entry, book or {}, workspace or {}, "2026-fall")

    def approval(self):
        source = self.write(self.entry["lesson_path"] + "/00-source/canonical-source.json", {})
        copy = self.write(self.entry["lesson_path"] + "/10-design/storyboard/lesson-01-逐页文案审阅.md", "本课逐页文案")
        evidence = self.write(self.entry["lesson_path"] + "/10-design/storyboard/approval-evidence.md", "Fixture only; never production approval.")
        self.write(self.entry["lesson_path"] + "/10-design/storyboard/lesson-01-content-approval.json", {
            "status": "approved", "gate": "lesson-content", "lesson_key": self.key, "offering_id": "2026-fall",
            "approved_by": "TEST FIXTURE", "approved_at": "2026-10-25T10:00:00+07:00",
            "artifacts": [{"path": p.relative_to(self.root).as_posix(), "sha256": sha256(p)} for p in (source, copy)],
            "evidence": evidence.relative_to(self.root).as_posix(), "evidence_sha256": sha256(evidence)})
        return copy

    def scoped_online(self, offering, artifact_id, cohort="group-a"):
        base = self.entry["lesson_path"]
        source = self.write(f"{base}/00-source/{offering}-{artifact_id}.json", "{}")
        review = self.write(f"{base}/10-design/storyboard/{offering}-{artifact_id}-review.md", "reviewed")
        source_check = self.write(f"{base}/10-design/storyboard/{offering}-{artifact_id}-source-check.md", "checked")
        evidence = self.write(f"{base}/10-design/storyboard/{offering}-{artifact_id}-evidence.md", "SYNTHETIC explicit decision")
        record = self.write(f"{base}/10-design/approvals/{offering}/online/{artifact_id}.json", {
            "status": "approved", "gate": "artifact-content", "lesson_key": self.key,
            "offering_id": offering, "artifact_scope": "online", "artifact_id": artifact_id, "class_scope": cohort,
            "approved_by": "SYNTHETIC", "approved_at": "2026-10-27T12:00:00+07:00",
            "source_path": source.relative_to(self.root).as_posix(), "review_path": review.relative_to(self.root).as_posix(),
            "source_check_path": source_check.relative_to(self.root).as_posix(),
            "artifacts": [{"path": p.relative_to(self.root).as_posix(), "sha256": sha256(p)} for p in (source, review, source_check)],
            "evidence": evidence.relative_to(self.root).as_posix(), "evidence_sha256": sha256(evidence)})
        return record, review

    def scoped_build(self, offering, artifact_id, record, cohort="group-a"):
        base = f"{self.entry['lesson_path']}/10-design/pptx-draft/online/{offering}/{artifact_id}"
        pptx = self.write(base + "/lesson-01-在线预习.pptx", "SYNTHETIC PPTX")
        manifest = self.write(base + "/build-manifest.json", {
            "lesson_key": self.key, "offering_id": offering, "artifact_id": artifact_id, "class_scope": cohort,
            "approval_record": record.relative_to(self.root).as_posix(),
            "pptx": {"path": pptx.relative_to(self.root).as_posix(), "sha256": sha256(pptx)}, "slides": 12})
        return pptx, manifest

    def test_release_checked_per_version_and_failed_verification_visible(self):
        record, _ = self.scoped_online("2026-fall", "version-a")
        record_path = record.relative_to(self.root).as_posix()
        payload = {"lesson_key": self.key, "offering_id": "2026-fall", "artifact_id": "version-a",
                   "class_scope": "group-a", "approval_record": record_path}
        self.write(self.entry["lesson_path"] + "/20-approved/lesson-manifest.json", {
            "authority": {"online_pptx": {"digest-a": {"candidate_payload": payload}}},
            "online_pptx_releases": {"release-a": {"candidate_sha256": "digest-a", "offering_id": "2026-fall"},
                                     "other-term": {"candidate_sha256": "digest-a", "offering_id": "2027-fall"}}})
        with patch("online_ppt_release.ROOT", self.root), patch("online_ppt_release.verify", return_value={"status": "verified", "path": "release/path"}) as verify:
            release = next(c for c in self.inspect()["checks"] if c["id"].endswith(":release"))
            self.assertEqual(release["status"], "checked")
            verify.assert_called_once_with(self.key, "2026-fall", "release-a")
        with patch("online_ppt_release.ROOT", self.root), patch("online_ppt_release.verify", side_effect=ValueError("damaged")):
            release = next(c for c in self.inspect()["checks"] if c["id"].endswith(":release"))
            self.assertEqual(release["status"], "pending")

    def test_other_term_release_cannot_complete_current_version(self):
        self.scoped_online("2026-fall", "version-a")
        self.write(self.entry["lesson_path"] + "/20-approved/lesson-manifest.json", {
            "authority": {"online_pptx": {}}, "online_pptx_releases": {
                "old": {"candidate_sha256": "digest", "offering_id": "2025-fall"}}})
        with patch("online_ppt_release.verify") as verify:
            release = next(c for c in self.inspect()["checks"] if c["id"].endswith(":release"))
            self.assertEqual(release["status"], "unknown")
            verify.assert_not_called()

    def test_missing_records_are_not_ready(self):
        row = self.inspect()
        self.assertEqual(row["pending_count"], 4)
        self.assertEqual(row["checks"][0]["status"], "unknown")
        self.assertFalse(row["materials"])

    def test_malformed_source_is_visible(self):
        self.write(self.entry["lesson_path"] + "/00-source/source-manifest.json", "{broken")
        row = self.inspect()
        self.assertEqual(row["checks"][0]["status"], "unknown")

    def test_real_content_gate_invalidates_changed_copy(self):
        copy = self.approval()
        before = self.inspect()
        self.assertEqual(next(c for c in before["checks"] if c["id"] == "content")["status"], "checked")
        copy.write_text("Changed version")
        after = self.inspect()
        content = next(c for c in after["checks"] if c["id"] == "content")
        self.assertEqual(content["status"], "pending")
        self.assertIn("changed content", content["reasons"][0])

    def test_approved_string_without_evidence_does_not_pass(self):
        self.write(self.entry["lesson_path"] + "/10-design/storyboard/lesson-01-content-approval.json", {"status": "approved"})
        self.assertEqual(next(c for c in self.inspect()["checks"] if c["id"] == "content")["status"], "pending")

    def test_html_draft_hash_and_offering_are_checked(self):
        path = self.write(self.entry["lesson_path"] + "/10-design/deck.html", "<p>draft</p>")
        manifest = self.write(self.entry["lesson_path"] + "/10-design/draft.json", {
            "lesson_keys": [self.key], "offering_id": "2026-fall", "entry_sha256": sha256(path),
            "human_gates": {"teacher_media_playback": "passed", "classroom_rehearsal": "passed"}})
        deck = dict(lesson_keys=[self.key], offering_id="2026-fall", source=path.relative_to(self.root).as_posix(),
                    visual_check={"draft_manifest": manifest.relative_to(self.root).as_posix()})
        workspace = {"html_decks": [deck]}
        row = self.inspect(workspace)
        self.assertTrue(row["materials"][0]["current"])
        self.assertEqual(row["materials"][0]["kind"], "html_draft")
        self.assertEqual(next(c for c in row["checks"] if c["id"] == "classroom")["status"], "unknown")
        path.write_text("changed")
        self.assertFalse(self.inspect(workspace)["materials"][0]["current"])
        deck["offering_id"] = "2027-fall"
        self.assertFalse(self.inspect(workspace)["materials"])

    def test_completed_book_stays_complete_with_legacy_missing_records(self):
        self.write("course/completed.md", "Existing completion evidence")
        row = self.inspect(book={"completion_record": {"status": "completed_by_adam", "evidence": "course/completed.md"}})
        self.assertEqual(row["status"], "historical")
        self.assertEqual(row["pending_count"], 0)

    def test_old_completion_does_not_complete_new_offering(self):
        self.write("course/completed.md", "Existing completion evidence")
        self.entry["offering_ids"].append("2027-spring")
        self.write("course/lesson-registry.json", {"lessons": [self.entry]})
        book = {"completion_record": {"status": "completed_by_adam", "evidence": "course/completed.md"}}
        row = lesson_readiness(self.root, self.entry, book, {}, "2027-spring")
        self.assertNotEqual(row["status"], "historical")
        self.assertGreater(row["pending_count"], 0)

    def test_online_versions_are_separate_from_other_terms_and_classroom(self):
        self.entry["offering_ids"].append("2027-spring")
        self.write("course/lesson-registry.json", {"lessons": [self.entry]})
        first, _ = self.scoped_online("2026-fall", "online-old")
        second, review = self.scoped_online("2027-spring", "online-new")
        self.scoped_build("2026-fall", "online-old", first)
        self.scoped_build("2027-spring", "online-new", second)
        row = lesson_readiness(self.root, self.entry, {}, {}, "2027-spring")
        lines = [c for c in row["checks"] if c["id"].startswith("online:")]
        self.assertEqual(len(lines), 3)
        self.assertTrue(all("online-new" in c["title"] for c in lines))
        self.assertEqual([c["status"] for c in lines], ["checked", "checked", "unknown"])
        review.write_text("changed")
        later = lesson_readiness(self.root, self.entry, {}, {}, "2027-spring")
        self.assertEqual(next(c for c in later["checks"] if c["id"].endswith(":content") and c["id"].startswith("online:"))["status"], "pending")
        old = self.inspect()
        self.assertEqual(next(c for c in old["checks"] if c["id"].endswith(":content") and c["id"].startswith("online:"))["status"], "checked")

    def test_explicit_current_version_keeps_old_records_without_old_pending_items(self):
        old, _ = self.scoped_online('2026-fall', 'old')
        self.scoped_online('2026-fall', 'new')
        original = old.read_bytes()
        self.entry['current_online_artifacts'] = {'2026-fall': {'group-a': 'new'}}
        row = self.inspect()
        self.assertEqual(old.read_bytes(), original)
        self.assertTrue(any(x['status'] == 'not_current' for x in row['checks']))
        active = [x for x in row['checks'] if x['id'].startswith('online:')]
        self.assertTrue(all('new' in x['title'] for x in active))
        self.entry['current_online_artifacts']['2026-fall']['group-a'] = 'missing'
        row = self.inspect()
        self.assertTrue(any(x['id'] == 'online-current:group-a' and x['status'] == 'pending' for x in row['checks']))

    def test_scoped_approval_is_not_a_built_or_released_ppt(self):
        self.scoped_online("2026-fall", "online-v1")
        row = self.inspect()
        lines = [c for c in row["checks"] if c["id"].startswith("online:")]
        self.assertEqual([c["status"] for c in lines], ["checked", "unknown", "unknown"])
        self.assertIn("不表示 PPT 已制作或交付", lines[1]["detail"])

    def test_scoped_build_must_match_identity_and_hash(self):
        record, _ = self.scoped_online("2026-fall", "online-v1")
        pptx, manifest = self.scoped_build("2026-fall", "online-v1", record)
        pptx.write_text("changed")
        row = self.inspect()
        self.assertEqual(next(c for c in row["checks"] if c["id"].endswith(":build"))["status"], "pending")
        data = json.loads(manifest.read_text())
        data["offering_id"] = "2027-spring"
        manifest.write_text(json.dumps(data))
        row = self.inspect()
        self.assertEqual(next(c for c in row["checks"] if c["id"].endswith(":build"))["status"], "unknown")

    def test_legacy_authority_does_not_count_as_current_next_term(self):
        self.entry["offering_ids"].append("2027-spring")
        self.write("course/lesson-registry.json", {"lessons": [self.entry]})
        old = self.write(self.entry["lesson_path"] + "/20-approved/old.pptx", "old")
        manifest = self.write(self.entry["lesson_path"] + "/20-approved/lesson-manifest.json", {
            "lesson_key": self.key, "files": [{"path": old.relative_to(self.root).as_posix(), "sha256": sha256(old)}]})
        self.entry["authority_manifest"] = manifest.relative_to(self.root).as_posix()
        row = lesson_readiness(self.root, self.entry, {}, {}, "2027-spring")
        self.assertFalse(row["materials"][0]["current"])
        self.assertFalse(row["materials"][0]["offering_match"])
        self.assertIn("历史", row["materials"][0]["label"])
        self.assertEqual(next(c for c in row["checks"] if c["id"] == "materials")["status"], "pending")

    def test_completed_history_does_not_hide_new_scoped_online_version(self):
        self.write("course/completed.md", "Existing completion evidence")
        self.scoped_online("2026-fall", "online-v1")
        book = {"completion_record": {"status": "completed_by_adam", "evidence": "course/completed.md"}}
        row = self.inspect(book=book)
        self.assertNotEqual(row["status"], "historical")
        self.assertTrue(any(c["id"] == "completion" and c["status"] == "historical" for c in row["checks"]))
        self.assertTrue(any(c["id"].startswith("online:") and c["id"].endswith(":content") for c in row["checks"]))

    def test_duplicate_version_id_across_classes_is_flagged(self):
        first, _ = self.scoped_online("2026-fall", "online-v1", "group-a")
        other = json.loads(first.read_text())
        other["class_scope"] = "group-b"
        self.write(self.entry["lesson_path"] + "/10-design/approvals/2026-fall/online/duplicate.json", other)
        row = self.inspect()
        content = [c for c in row["checks"] if c["id"].startswith("online:") and c["id"].endswith(":content")]
        self.assertEqual(len(content), 2)
        self.assertTrue(all(c["status"] == "pending" and "目录可能冲突" in c["reasons"][0] for c in content))

    def test_malformed_scoped_record_does_not_break_other_readiness(self):
        record, _ = self.scoped_online("2026-fall", "online-v1")
        data = json.loads(record.read_text())
        data["class_scope"] = 10
        record.write_text(json.dumps(data))
        row = self.inspect()
        content = next(c for c in row["checks"] if c["id"].startswith("online:") and c["id"].endswith(":content"))
        self.assertEqual(content["status"], "pending")
        self.assertTrue(any("班级标识" in item for item in content["reasons"]))

    def test_cross_book_authority_rejected(self):
        other = self.write("lessons/book-b/lesson-01/20-approved/lesson-manifest.json", {"lesson_key": "book-b:lesson-01"})
        self.entry["authority_manifest"] = other.relative_to(self.root).as_posix()
        row = self.inspect()
        self.assertEqual(next(c for c in row["checks"] if c["id"] == "authority")["status"], "unknown")

    def test_unsafe_and_archive_paths_rejected(self):
        for path in ("../outside", "/tmp/outside", "archive/file.json", "lessons/a/90-archive/file.json", ""):
            with self.subTest(path=path), self.assertRaises((ValueError, LessonContextError)):
                local_path(self.root, path)
        (self.root / "link").symlink_to(self.lesson, target_is_directory=True)
        with self.assertRaises(LessonContextError):
            local_path(self.root, "link/file.json")


if __name__ == "__main__":
    unittest.main()
