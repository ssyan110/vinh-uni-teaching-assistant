"""Authority-stage isolation; fixtures are synthetic and confined to a temp tree."""
from __future__ import annotations

import io
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "scripts"))

import production_gate as gate
from lesson_context import resolve_lesson_context
from workflow_integrity import sha256, tree_hash


class GateContextScopingTests(unittest.TestCase):
    numbers = ("02", "10", "12")

    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.root = Path(temp.name).resolve()
        self.lessons = {}
        entries = []
        for number in ("01", *self.numbers):
            lesson_id = f"lesson-{number}"
            key = f"boya-quasi-intermediate-i:{lesson_id}"
            lesson = self.root / "lessons/boya-quasi-intermediate-i" / lesson_id
            self.lessons[number] = lesson
            entry = {"lesson_key": key, "textbook_id": "boya-quasi-intermediate-i",
                     "lesson_id": lesson_id, "lesson_path": self.rel(lesson),
                     "offering_ids": ["2026-fall"]}
            entries.append(entry)
            canonical = lesson / "00-source/canonical-source.json"
            self.write(canonical, {"lesson_key": key})
            self.write(lesson / "00-source/source-manifest.json", {
                "lesson_key": key, "source_status": "verified", "source_qa_status": "passed",
                "canonical_source_sha256": sha256(canonical)})
            for name, payload in {
                "teaching-design/manifest.json": {"status": "approved_by_adam_test"},
                "storyboard/manifest.json": {"current_revision_approved_at": "test"},
                "visual-storyboard/manifest.json": {"status": "approved", "current_pptx_alignment_status": "approved"},
                "visual-prototype/manifest.json": {"status": "approved"},
                "activity-package-manifest.json": {},
            }.items():
                self.write(lesson / "10-design" / name, {"lesson_key": key, **payload})
            manual = lesson / "20-approved/manual.docx"
            self.write(manual, "synthetic manual")
            report = lesson / "30-qa/current/report.md"
            self.write(report, "synthetic QA")
            evidence = lesson / "90-archive/evidence"
            self.write(evidence / "snapshot.txt", "synthetic evidence")
            self.write(lesson / "20-approved/lesson-manifest.json", {
                "lesson_key": key, "authority_status": "final_confirmed",
                "source_package": {"path": self.rel(evidence), "status": "historical_evidence",
                                   "file_count": 1, "tree_sha256": tree_hash(evidence)},
                "authority": {"teacher_manual": {"path": self.rel(manual), "status": "final_confirmed"},
                              "activities": {"file_count": 0}},
                "files": [{"path": self.rel(manual), "sha256": sha256(manual), "bytes": manual.stat().st_size}],
                "qa": {"status": "passed", "current_report": self.rel(report),
                       "rehearsal": {"status": "passed", "audio_playback_status": "passed"}},
            })
        active = self.lessons["01"]
        self.config = {"lesson_registry": "course/lesson-registry.json",
                       "lesson_root": self.rel(active), "draft_root": self.rel(active / "10-design"),
                       "authority_root": self.rel(active / "20-approved"),
                       "canonical_source": self.rel(active / "00-source/canonical-source.json"),
                       "historical_package_evidence": self.rel(active / "90-archive/evidence"),
                       "protected_roots": [self.rel(active / "20-approved")]}
        self.write(self.root / "project.config.json", self.config)
        self.write(self.root / "course/lesson-registry.json", {"lessons": entries})
        patcher = mock.patch.multiple(gate, PROJECT_ROOT=self.root, CONFIG=self.config,
                                      LESSON_ROOT=active, DESIGN_ROOT=active / "10-design",
                                      LESSON_REGISTRY=self.root / "course/lesson-registry.json",
                                      PRODUCTION_SCRIPTS=())
        patcher.start()
        self.addCleanup(patcher.stop)

    def rel(self, path):
        return path.relative_to(self.root).as_posix()

    def write(self, path, payload):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(payload) if isinstance(payload, dict) else payload, encoding="utf-8")

    def key(self, number):
        return f"boya-quasi-intermediate-i:lesson-{number}"

    def change(self, number, relative, transform):
        path = self.lessons[number] / relative
        value = json.loads(path.read_text(encoding="utf-8"))
        transform(value)
        self.write(path, value)

    def test_all_purposes_use_each_explicit_context_without_writes(self):
        before = tree_hash(self.root)
        globals_before = (gate.LESSON_ROOT, gate.DESIGN_ROOT, dict(gate.CONFIG))
        with mock.patch.object(gate, "audit_lesson_identity", side_effect=AssertionError("active identity audit")):
            for number in self.numbers:
                for purpose in ("audit", "teacher-guide", "support", "prototype", "pptx", "semester-manual", "release"):
                    with self.subTest(number=number, purpose=purpose):
                        result = gate.check(purpose, lesson_key=self.key(number))
                        self.assertEqual("ready", result["status"], result["blockers"])
                        self.assertEqual(self.key(number), result["lesson_key"])
                        if result["output_dir"]:
                            self.assertTrue(Path(result["output_dir"]).is_relative_to(self.lessons[number] / "10-design"))
        self.assertEqual(before, tree_hash(self.root))
        self.assertEqual(globals_before, (gate.LESSON_ROOT, gate.DESIGN_ROOT, gate.CONFIG))

    def test_l01_defects_do_not_poison_other_lessons(self):
        self.write(self.lessons["01"] / "10-design/legacy.json", {"bad": "output/old"})
        self.write(self.lessons["01"] / "30-qa/current/report.md", "share/old")
        self.write(self.lessons["01"] / "00-source/canonical-source.json", "changed")
        self.write(self.lessons["01"] / "20-approved/manual.docx", "changed")
        for number in self.numbers:
            with self.subTest(number=number):
                result = gate.check("release", lesson_key=self.key(number))
                self.assertEqual("ready", result["status"], result["blockers"])

    def test_selected_lesson_hash_design_qa_and_human_gates_remain(self):
        for number in self.numbers:
            with self.subTest(number=number):
                lesson = self.lessons[number]
                self.write(lesson / "00-source/canonical-source.json", "changed")
                self.write(lesson / "20-approved/manual.docx", "changed")
                self.write(lesson / "90-archive/evidence/snapshot.txt", "changed")
                self.write(lesson / "10-design/legacy.json", {"bad": "output/old"})
                self.write(lesson / "30-qa/current/report.md", "share/old")
                self.change(number, "20-approved/lesson-manifest.json", lambda x: x["qa"].update(rehearsal={}))
                self.change(number, "10-design/storyboard/manifest.json", lambda x: x.pop("current_revision_approved_at"))
                result = gate.check("release", lesson_key=self.key(number))
                self.assertEqual("blocked", result["status"])
                text = "\n".join(result["blockers"])
                for expected in ("canonical source hash differs", "authority hash mismatch", "frozen source package tree hash mismatch",
                                 "design metadata contains legacy", "current QA points to legacy", "storyboard current revision",
                                 "audio playback", "teacher rehearsal"):
                    self.assertIn(expected, text)

    def test_invalid_release_qa_schema_blocks_without_crash(self):
        for number in self.numbers:
            with self.subTest(number=number):
                self.change(number, "20-approved/lesson-manifest.json", lambda x: x["qa"].update(rehearsal="pending"))
                result = gate.check("release", lesson_key=self.key(number))
                self.assertEqual("blocked", result["status"])
                self.assertIn("authority qa.rehearsal must be an object", result["blockers"])

    def test_missing_selected_manifests_never_fall_back_to_l01(self):
        for number in self.numbers:
            with self.subTest(number=number):
                (self.lessons[number] / "20-approved/lesson-manifest.json").unlink()
                (self.lessons[number] / "10-design/visual-storyboard/manifest.json").unlink()
                result = gate.check("pptx", lesson_key=self.key(number))
                text = "\n".join(result["blockers"])
                self.assertEqual("blocked", result["status"])
                self.assertIn("authority manifest is unavailable", text)
                self.assertIn("PPTX design input manifest is unavailable", text)
                self.assertIn(f"lesson-{number}", text)
                self.assertNotIn("lesson-01", text)

    def test_cross_lesson_and_protected_outputs_rejected(self):
        for number in self.numbers:
            context = resolve_lesson_context(self.root, self.key(number))
            for output in (self.lessons["01"] / "10-design/pptx-draft", context.authority_root,
                           context.qa_root, context.release_root, context.lesson_root / "90-archive", self.root / "outside"):
                with self.subTest(number=number, output=output):
                    blockers = []
                    gate.validate_output_dir(str(output), "pptx", blockers, context)
                    self.assertTrue(blockers)
            blockers = []
            gate.validate_output_dir(None, "pptx", blockers, context)
            self.assertEqual([], blockers)

    def test_cross_lesson_manual_qa_and_manifest_identity_rejected(self):
        for number in self.numbers:
            with self.subTest(number=number):
                def corrupt(value):
                    value["lesson_key"] = self.key("01")
                    value["authority"]["teacher_manual"]["path"] = self.rel(self.lessons["01"] / "20-approved/manual.docx")
                    value["qa"]["current_report"] = self.rel(self.lessons["01"] / "30-qa/current/report.md")
                self.change(number, "20-approved/lesson-manifest.json", corrupt)
                result = gate.check("release", lesson_key=self.key(number))
                text = "\n".join(result["blockers"])
                for expected in ("lesson identity: authority", "teacher manual path is invalid", "current QA report path is invalid"):
                    self.assertIn(expected, text)

    def test_missing_evidence_does_not_borrow_configured_l01_snapshot(self):
        for number in self.numbers:
            with self.subTest(number=number):
                self.change(number, "20-approved/lesson-manifest.json", lambda x: x.pop("source_package"))
                with mock.patch.object(gate, "audit_frozen_source_package") as audit:
                    result = gate.check("audit", lesson_key=self.key(number))
                audit.assert_not_called()
                self.assertIn("configured historical package evidence is missing", result["blockers"])

    def test_legacy_no_key_preserves_active_defaults_and_identity_audit(self):
        with mock.patch.object(gate, "audit_lesson_identity") as identity, mock.patch.object(gate, "resolve_lesson_context") as resolver:
            result = gate.check("pptx")
        self.assertEqual("ready", result["status"], result["blockers"])
        self.assertNotIn("lesson_key", result)
        self.assertEqual(str(gate.DESIGN_ROOT / "pptx-draft"), result["output_dir"])
        identity.assert_called_once()
        resolver.assert_not_called()

    def test_invalid_keys_fail_closed_and_assert_ready_forwards_key(self):
        for key in ("", "lesson-02", "missing:lesson-99"):
            with self.subTest(key=key), mock.patch.object(gate, "load_base_manifests") as load:
                result = gate.check("pptx", lesson_key=key)
                self.assertEqual("blocked", result["status"])
                load.assert_not_called()
                with self.assertRaises(gate.ProductionGateError):
                    gate.assert_ready("pptx", lesson_key=key)
        self.assertEqual(self.key("10"), gate.assert_ready("pptx", lesson_key=self.key("10"))["lesson_key"])

    def test_cli_authority_forwards_explicit_lesson_key(self):
        for number in self.numbers:
            with self.subTest(number=number), mock.patch.object(sys, "argv", ["production_gate.py", "--purpose", "pptx", "--stage", "authority", "--lesson-key", self.key(number)]), mock.patch("sys.stdout", new_callable=io.StringIO) as output:
                self.assertEqual(0, gate.main())
                self.assertEqual(self.key(number), json.loads(output.getvalue())["lesson_key"])

    def test_gate_returns_structured_blocker_records(self):
        result = gate.check("release", lesson_key=self.key("12"))
        self.assertEqual(len(result["blockers"]), len(result["blocker_records"]))
        self.assertTrue(all(set(("code", "message", "scope")) <= set(item) for item in result["blocker_records"]))
        self.assertEqual([item["message"] for item in result["blocker_records"]], result["blockers"])

    def test_symlinked_selected_design_fails_closed(self):
        number = "12"
        design = self.lessons[number] / "10-design"
        design.rename(self.lessons[number] / "saved-design")
        design.symlink_to(self.lessons["01"] / "10-design", target_is_directory=True)
        result = gate.check("pptx", lesson_key=self.key(number))
        self.assertEqual("blocked", result["status"])
        self.assertTrue(any("lesson identity:" in item for item in result["blockers"]))


if __name__ == "__main__":
    unittest.main()
