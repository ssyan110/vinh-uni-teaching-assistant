from __future__ import annotations

import json
import sys
import tempfile
import unittest
from unittest import mock
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SCRIPTS_ROOT = PROJECT_ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS_ROOT))

from agent_loop import (  # noqa: E402
    attach_external_check,
    create_run,
    record_attempt,
    record_result,
    run_release_check,
    run_preflight,
    validate_state,
)
from lesson_context import resolve_lesson_context  # noqa: E402
from record_lesson_gate import record, validate_evidence  # noqa: E402


class AgentControlLoopTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / "course").mkdir()
        (self.root / ".agent/runs").mkdir(parents=True)
        self.lesson_keys = (
            "book-a:lesson-01",
            "book-a:lesson-02",
        )
        lessons = []
        for number, lesson_key in enumerate(self.lesson_keys, start=1):
            lesson_id = f"lesson-{number:02d}"
            lesson_path = f"lessons/book-a/{lesson_id}"
            lesson_root = self.root / lesson_path
            (lesson_root / "10-design/pptx-draft").mkdir(parents=True)
            (lesson_root / "10-design/storyboard").mkdir(parents=True)
            (lesson_root / "20-approved").mkdir(parents=True)
            lessons.append({
                "lesson_key": lesson_key,
                "textbook_id": "book-a",
                "lesson_id": lesson_id,
                "lesson_path": lesson_path,
                "offering_ids": ["test-offering"],
            })
        (self.root / "project.config.json").write_text(
            json.dumps({
                "lesson_registry": "course/lesson-registry.json",
                "active_context": {
                    "lesson_key": self.lesson_keys[0],
                    "offering_id": "test-offering",
                },
            }),
            encoding="utf-8",
        )
        (self.root / "course/lesson-registry.json").write_text(
            json.dumps({"lessons": lessons}),
            encoding="utf-8",
        )

    @staticmethod
    def ready_gate(_root: Path, state: dict[str, object]) -> dict[str, object]:
        return {
            "purpose": state["purpose"],
            "stage": state["gate_stage"],
            "status": "ready",
            "output_dir": state["output_dir"],
            "blockers": [],
        }

    def create_default_run(self, *, run_id: str = "test-run", max_attempts: int = 3) -> dict:
        return create_run(
            self.root,
            run_id,
            self.lesson_keys[1],
            "lesson-02 online PPTX draft",
            "pptx",
            "draft",
            ["PPTX opens", "source mapping passes"],
            max_attempts=max_attempts,
        )

    def test_run_resolves_identity_and_scopes_default_output(self) -> None:
        state = self.create_default_run()

        self.assertEqual(state["lesson_key"], "book-a:lesson-02")
        self.assertEqual(state["offering_id"], "test-offering")
        self.assertEqual(
            state["output_dir"],
            "lessons/book-a/lesson-02/10-design/pptx-draft",
        )
        self.assertEqual([], validate_state(self.root, state, check_evidence=True))

    def test_run_rejects_output_in_authority(self) -> None:
        with self.assertRaisesRegex(ValueError, "10-design"):
            create_run(
                self.root,
                "unsafe-run",
                self.lesson_keys[1],
                "unsafe output",
                "pptx",
                "draft",
                ["must be rejected"],
                output_dir="lessons/book-a/lesson-02/20-approved",
            )

    def test_run_rejects_symlink_output_alias(self) -> None:
        link = self.root / "lessons/book-a/lesson-02/10-design/pptx-link"
        link.symlink_to(link.parent / "pptx-draft", target_is_directory=True)

        with self.assertRaisesRegex(ValueError, "10-design"):
            create_run(
                self.root,
                "symlink-run",
                self.lesson_keys[1],
                "unsafe symlink output",
                "pptx",
                "draft",
                ["must be rejected"],
                output_dir="lessons/book-a/lesson-02/10-design/pptx-link",
            )

    def test_success_requires_preflight_attempt_criteria_and_hashed_evidence(self) -> None:
        self.create_default_run()
        state = run_preflight(self.root, "test-run", self.ready_gate)
        self.assertEqual(state["phase"], "ready")
        state = record_attempt(self.root, "test-run", "built one scoped draft")
        self.assertEqual(state["phase"], "verifying")
        evidence = self.root / "lessons/book-a/lesson-02/10-design/qa.txt"
        evidence.write_text("passed", encoding="utf-8")

        state = record_result(
            self.root,
            "test-run",
            "passed",
            "both declared criteria passed",
            [str(evidence)],
            all_criteria_passed=True,
        )

        self.assertEqual(state["phase"], "complete")
        self.assertEqual(state["criteria_status"], "passed")
        self.assertEqual(1, len(state["evidence"]))
        self.assertEqual([], validate_state(self.root, state, check_evidence=True))

    def test_attempt_requires_ready_preflight(self) -> None:
        self.create_default_run(run_id="no-preflight")

        with self.assertRaisesRegex(RuntimeError, "phase=ready"):
            record_attempt(self.root, "no-preflight", "must not execute")

    def test_passed_result_requires_explicit_criteria_confirmation(self) -> None:
        self.create_default_run(run_id="criteria-run")
        run_preflight(self.root, "criteria-run", self.ready_gate)
        record_attempt(self.root, "criteria-run", "attempted draft")
        evidence = self.root / "lessons/book-a/lesson-02/10-design/qa.txt"
        evidence.write_text("passed", encoding="utf-8")

        with self.assertRaisesRegex(ValueError, "all-criteria-passed"):
            record_result(
                self.root,
                "criteria-run",
                "passed",
                "missing explicit criteria confirmation",
                [str(evidence)],
            )

    def test_failed_attempt_stops_when_retry_budget_is_exhausted(self) -> None:
        self.create_default_run(run_id="one-shot", max_attempts=1)
        run_preflight(self.root, "one-shot", self.ready_gate)
        record_attempt(self.root, "one-shot", "attempted draft")

        state = record_result(
            self.root,
            "one-shot",
            "failed",
            "rendered artifact failed visual QA",
            [],
        )

        self.assertEqual(state["phase"], "blocked")
        self.assertEqual(state["stop_reason"], "retry budget exhausted")

    def test_mixed_preflight_blockers_stay_blocked_and_preserve_human_flag(self) -> None:
        self.create_default_run(run_id="mixed-blockers")

        def mixed_gate(_root: Path, state: dict[str, object]) -> dict[str, object]:
            return {
                "purpose": state["purpose"],
                "stage": state["gate_stage"],
                "status": "blocked",
                "output_dir": state["output_dir"],
                "blockers": [
                    "image manifest is missing",
                    "online/face boundary confirmation is missing",
                ],
            }

        state = run_preflight(self.root, "mixed-blockers", mixed_gate)

        self.assertEqual(state["phase"], "blocked")
        self.assertTrue(state["human_required"])
        self.assertEqual(
            state["blocker_categories"]["technical"],
            ["image manifest is missing"],
        )
        self.assertEqual(
            state["blocker_categories"]["human"],
            ["online/face boundary confirmation is missing"],
        )

    def test_preflight_emits_structured_blocker_records(self) -> None:
        self.create_default_run(run_id="structured-blockers")

        def gate(_root: Path, state: dict[str, object]) -> dict[str, object]:
            return {
                "purpose": state["purpose"], "stage": state["gate_stage"],
                "status": "blocked", "output_dir": state["output_dir"],
                "blockers": [
                    "image manifest is missing",
                    {"code": "boundary_confirmation_missing", "message": "boundary confirmation is missing", "scope": "lesson"},
                ],
            }

        state = run_preflight(self.root, "structured-blockers", gate)
        self.assertEqual(
            [(item["code"], item["scope"]) for item in state["blocker_records"]],
            [("artifact_missing", "draft/pptx"), ("boundary_confirmation_missing", "lesson")],
        )
        self.assertEqual([], validate_state(self.root, state, check_evidence=True))

    def test_validator_rejects_malformed_blocker_records(self) -> None:
        state = self.create_default_run(run_id="malformed-blockers")
        state["blocker_records"] = [{"code": "only-code"}]
        self.assertTrue(any("requires code, message and scope" in item for item in validate_state(self.root, state, check_evidence=True)))

    def test_external_check_is_attached_without_changing_run_phase(self) -> None:
        state = self.create_default_run(run_id="external-check")
        result_file = self.root / "checks/plan.json"
        result_file.parent.mkdir()
        result_file.write_text(json.dumps({
            "command": "plan", "status": "blocked",
            "lesson_key": self.lesson_keys[1], "release_id": "r1",
            "blockers": ["authority manifest is missing"],
        }), encoding="utf-8")
        state = attach_external_check(self.root, "external-check", str(result_file))
        self.assertEqual(state["phase"], "defined")
        self.assertEqual(state["latest_external_check"]["command"], "plan")
        self.assertEqual(state["latest_external_check"]["blocker_records"][0]["code"], "artifact_missing")
        self.assertEqual([], validate_state(self.root, state, check_evidence=True))
        result_file.write_text("tampered", encoding="utf-8")
        self.assertTrue(any("hash-mismatched" in item for item in validate_state(self.root, state, check_evidence=True)))

    def test_external_check_rejects_mismatched_structured_records(self) -> None:
        self.create_default_run(run_id="bad-external")
        result_file = self.root / "checks/bad.json"
        result_file.parent.mkdir()
        result_file.write_text(json.dumps({
            "command": "inspect", "status": "review", "blockers": ["partial state"],
            "blocker_records": [{"code": "wrong", "message": "partial state", "scope": "wrong"}],
        }), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "blocker_records"):
            attach_external_check(self.root, "bad-external", str(result_file))

    def test_release_check_runs_only_read_only_mode_and_pins_result(self) -> None:
        self.create_default_run(run_id="release-check")
        payload = {
            "command": "plan", "status": "blocked",
            "lesson_key": self.lesson_keys[1], "offering_id": "test-offering", "release_id": "r1",
            "blockers": ["authority manifest is missing"],
        }
        completed = type("Completed", (), {"stdout": json.dumps(payload), "returncode": 1})()
        with mock.patch("agent_loop.subprocess.run", return_value=completed) as runner:
            state = run_release_check(
                self.root, "release-check", "plan", self.lesson_keys[1], "r1", "test-offering"
            )
        command = runner.call_args.args[0]
        self.assertIn("--plan", command)
        self.assertNotIn("--execute", command)
        self.assertEqual(state["phase"], "defined")
        self.assertEqual(state["latest_external_check"]["status"], "blocked")
        self.assertEqual([], validate_state(self.root, state, check_evidence=True))

    def test_release_check_rejects_execute_mode(self) -> None:
        self.create_default_run(run_id="release-execute")
        with self.assertRaisesRegex(ValueError, "plan or inspect"):
            run_release_check(self.root, "release-execute", "execute", self.lesson_keys[1], "r1")

    def test_release_check_rejects_cross_scope_identity_before_write(self) -> None:
        for field, wrong in (("lesson_key", self.lesson_keys[0]), ("offering_id", "other-offering"), ("release_id", "other-release")):
            with self.subTest(field=field):
                run_id = f"identity-{field.replace('_', '-') }"
                self.create_default_run(run_id=run_id)
                payload = {
                    "command": "plan", "status": "blocked",
                    "lesson_key": self.lesson_keys[1], "offering_id": "test-offering",
                    "release_id": "r1", "blockers": [],
                }
                payload[field] = wrong
                completed = type("Completed", (), {"stdout": json.dumps(payload), "returncode": 1})()
                with mock.patch("agent_loop.subprocess.run", return_value=completed):
                    with self.assertRaisesRegex(ValueError, field):
                        run_release_check(self.root, run_id, "plan", self.lesson_keys[1], "r1", "test-offering")
                self.assertFalse((self.root / ".agent/runs" / run_id / "checks").exists())

    def test_evidence_mutation_invalidates_completed_run(self) -> None:
        self.create_default_run(run_id="hash-run")
        run_preflight(self.root, "hash-run", self.ready_gate)
        record_attempt(self.root, "hash-run", "attempted draft")
        evidence = self.root / "lessons/book-a/lesson-02/10-design/qa.txt"
        evidence.write_text("passed", encoding="utf-8")
        state = record_result(
            self.root,
            "hash-run",
            "passed",
            "verified",
            [str(evidence)],
            all_criteria_passed=True,
        )
        evidence.write_text("changed", encoding="utf-8")

        failures = validate_state(self.root, state, check_evidence=True)

        self.assertTrue(any("hash mismatch" in item for item in failures))

    def test_gate_record_is_lesson_scoped_and_hashes_evidence(self) -> None:
        for number, lesson_key in enumerate(self.lesson_keys, start=1):
            manifest = self.root / f"lessons/book-a/lesson-{number:02d}/10-design/storyboard/manifest.json"
            manifest.write_text(
                json.dumps({
                    "lesson_key": lesson_key,
                    "textbook_id": "book-a",
                    "lesson_id": f"lesson-{number:02d}",
                    "offering_id": "test-offering",
                    "current_revision": "outline.md",
                }),
                encoding="utf-8",
            )
        lesson_one = self.root / "lessons/book-a/lesson-01/10-design/storyboard/manifest.json"
        lesson_one_before = lesson_one.read_bytes()
        context = resolve_lesson_context(self.root, self.lesson_keys[1])
        evidence_path = context.lesson_root / "10-design/storyboard/outline.md"
        evidence_path.write_text("approved outline", encoding="utf-8")
        evidence, evidence_hash = validate_evidence(
            self.root,
            context.lesson_root,
            str(evidence_path),
        )

        target = record(
            context,
            "storyboard",
            "Adam",
            "2026-08-31",
            evidence,
            evidence_hash,
        )
        data = json.loads(target.read_text(encoding="utf-8"))

        self.assertEqual(lesson_one_before, lesson_one.read_bytes())
        self.assertEqual(data["current_revision_approval_evidence"], evidence)
        self.assertEqual(data["current_revision_approval_evidence_sha256"], evidence_hash)

    def test_gate_record_rejects_evidence_from_another_lesson(self) -> None:
        context = resolve_lesson_context(self.root, self.lesson_keys[1])
        other = self.root / "lessons/book-a/lesson-01/10-design/other.txt"
        other.write_text("wrong lesson", encoding="utf-8")

        with self.assertRaisesRegex(ValueError, "selected lesson"):
            validate_evidence(self.root, context.lesson_root, str(other))

    def test_gate_record_rejects_symlink_evidence(self) -> None:
        context = resolve_lesson_context(self.root, self.lesson_keys[1])
        target = context.lesson_root / "10-design/storyboard/outline.md"
        target.write_text("outline", encoding="utf-8")
        link = context.lesson_root / "10-design/storyboard/evidence-link.md"
        link.symlink_to(target)

        with self.assertRaisesRegex(ValueError, "selected lesson"):
            validate_evidence(self.root, context.lesson_root, str(link))

    def test_gate_record_rejects_manifest_with_wrong_lesson_identity(self) -> None:
        context = resolve_lesson_context(self.root, self.lesson_keys[1])
        manifest = context.lesson_root / "10-design/storyboard/manifest.json"
        manifest.write_text(
            json.dumps({
                "lesson_key": self.lesson_keys[0],
                "current_revision": "outline.md",
            }),
            encoding="utf-8",
        )
        evidence_path = context.lesson_root / "10-design/storyboard/outline.md"
        evidence_path.write_text("outline", encoding="utf-8")
        evidence, evidence_hash = validate_evidence(
            self.root,
            context.lesson_root,
            str(evidence_path),
        )

        with self.assertRaisesRegex(RuntimeError, "lesson_key"):
            record(
                context,
                "storyboard",
                "Adam",
                "2026-08-31",
                evidence,
                evidence_hash,
            )


if __name__ == "__main__":
    unittest.main()
