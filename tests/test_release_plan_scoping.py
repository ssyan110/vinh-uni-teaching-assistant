"""Read-only release-plan tests; all authority/release fixtures are synthetic."""
import io
import json
import sys
import unittest
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(ROOT / "scripts"))
import build_release_package as builder
import test_authority_verifier_scoping as authority_fixtures
from workflow_integrity import tree_hash


class ReleasePlanScopingTests(unittest.TestCase):
    def setUp(self):
        self.fixture = authority_fixtures.AuthorityVerifierScopingTests()
        self.fixture.setUp()
        self.addCleanup(self.fixture.doCleanups)
        self.root = self.fixture.root
        active = self.fixture.fixture.lessons["01"]
        patcher = mock.patch.multiple(
            builder,
            PROJECT_ROOT=self.root,
            CONFIG=self.fixture.fixture.config,
            AUTHORITY_ROOT=active / "20-approved",
            RELEASE_ROOT=active / "40-release",
            MANIFEST_PATH=active / "20-approved/lesson-manifest.json",
            LATEST_PATH=active / "40-release/latest-release.json",
        )
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_l02_l10_l12_plan_is_scoped_complete_and_read_only(self):
        before = tree_hash(self.root)
        globals_before = (builder.AUTHORITY_ROOT, builder.RELEASE_ROOT, builder.MANIFEST_PATH)
        for number in ("02", "10", "12"):
            key = self.fixture.fixture.key(number)
            with self.subTest(number=number):
                result = builder.plan_release(key, "next-v1", "2026-fall")
                self.assertEqual(result["status"], "ready", result["blockers"])
                self.assertFalse(result["write_performed"])
                self.assertEqual(len(result["entries"]), 2)
                self.assertIn(f"lesson-{number}/40-release/next-v1", result["release_dir"])
                for entry in result["entries"]:
                    self.assertIn(f"lesson-{number}/20-approved", entry["source_path"])
                    self.assertIn(f"lesson-{number}/40-release/next-v1", entry["destination_path"])
        self.assertEqual(before, tree_hash(self.root))
        self.assertEqual(globals_before, (builder.AUTHORITY_ROOT, builder.RELEASE_ROOT, builder.MANIFEST_PATH))

    def test_plan_blocks_missing_manifest_without_writes(self):
        lesson = self.fixture.fixture.lessons["10"]
        (lesson / "20-approved/lesson-manifest.json").unlink()
        before = tree_hash(self.root)
        result = builder.plan_release(self.fixture.fixture.key("10"), "next-v1")
        self.assertEqual(result["status"], "blocked")
        self.assertEqual(result["entries"], [])
        self.assertEqual(before, tree_hash(self.root))
        self.assertTrue(any("authority manifest" in item for item in result["blockers"]))

    def test_plan_blocks_existing_or_partial_release(self):
        lesson = self.fixture.fixture.lessons["02"]
        (lesson / "40-release/existing").mkdir()
        (lesson / "40-release/.partial.zip.pending").touch()
        existing = builder.plan_release(self.fixture.fixture.key("02"), "existing")
        partial = builder.plan_release(self.fixture.fixture.key("02"), "partial")
        self.assertEqual(existing["status"], "blocked")
        self.assertTrue(any("already exists" in item for item in existing["blockers"]))
        self.assertEqual(partial["status"], "blocked")
        self.assertTrue(any("incomplete release ZIP" in item for item in partial["blockers"]))

    def test_plan_blocks_changed_authority_and_cross_lesson_path(self):
        f = self.fixture.fixture
        (f.lessons["12"] / "20-approved/manual.docx").write_text("changed")
        changed = builder.plan_release(f.key("12"), "next-v1")
        self.assertEqual(changed["status"], "blocked")
        self.assertTrue(any("authority changed after approval" in item for item in changed["blockers"]))

        foreign = f.rel(f.lessons["01"] / "20-approved/manual.docx")
        f.change("10", "20-approved/lesson-manifest.json", lambda x: x["authority"]["teacher_manual"].update(path=foreign))
        cross = builder.plan_release(f.key("10"), "next-v1")
        self.assertEqual(cross["status"], "blocked")
        self.assertTrue(any("required root" in item or "teacher manual path" in item for item in cross["blockers"]))

    def test_plan_blocks_pending_metadata_recovery_artifacts(self):
        f = self.fixture.fixture
        key = f.key("10")
        candidates = (
            f.lessons["10"] / "40-release/.latest-release.json.pending",
            f.lessons["10"] / "40-release/.latest-release.json.rollback",
            f.lessons["10"] / "20-approved/.lesson-manifest.json.pending",
            f.lessons["10"] / "20-approved/.lesson-manifest.json.rollback",
        )
        for candidate in candidates:
            with self.subTest(candidate=candidate):
                candidate.touch()
                result = builder.plan_release(key, "next-v1")
                self.assertEqual(result["status"], "blocked")
                self.assertTrue(any("metadata transaction" in item for item in result["blockers"]))
                candidate.unlink()

    def test_plan_rejects_bad_identity_release_id_offering_and_symlink(self):
        f = self.fixture.fixture
        cases = [
            ("lesson-02", "next-v1", None),
            (f.key("02"), "../escape", None),
            (f.key("02"), "next-v1", "wrong-offering"),
        ]
        for key, release_id, offering in cases:
            with self.subTest(key=key, release_id=release_id, offering=offering):
                self.assertEqual(builder.plan_release(key, release_id, offering)["status"], "blocked")
        release_root = f.lessons["12"] / "40-release"
        saved = release_root.with_name("saved-release")
        release_root.rename(saved)
        release_root.symlink_to(saved, target_is_directory=True)
        self.assertEqual(builder.plan_release(f.key("12"), "next-v1")["status"], "blocked")

    def test_cli_plan_requires_key_and_never_calls_build(self):
        with mock.patch.object(builder, "build_release") as build, mock.patch.object(
            sys, "argv", ["build_release_package.py", "--plan", "--release-id", "next-v1"]
        ), mock.patch("sys.stdout", new_callable=io.StringIO) as output:
            self.assertEqual(builder.main(), 1)
        build.assert_not_called()
        payload = json.loads(output.getvalue())
        self.assertEqual(payload["status"], "blocked")
        self.assertFalse(payload["write_performed"])

    def test_cli_plan_forwards_explicit_scope(self):
        key = self.fixture.fixture.key("10")
        with mock.patch.object(builder, "build_release") as build, mock.patch.object(
            sys,
            "argv",
            ["build_release_package.py", "--plan", "--lesson-key", key,
             "--offering-id", "2026-fall", "--release-id", "next-v1"],
        ), mock.patch("sys.stdout", new_callable=io.StringIO) as output:
            self.assertEqual(builder.main(), 0)
        build.assert_not_called()
        payload = json.loads(output.getvalue())
        self.assertEqual(payload["lesson_key"], key)
        self.assertEqual(payload["status"], "ready")
        self.assertFalse(payload["write_performed"])


if __name__ == "__main__":
    unittest.main()
