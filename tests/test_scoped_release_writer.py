"""Scoped writer tests; every write is confined to a synthetic temporary project."""
import io
import json
import os
import sys
import unittest
import zipfile
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(ROOT / "scripts"))
import build_release_package as builder
import test_authority_verifier_scoping as authority_fixtures
from workflow_integrity import sha256, tree_hash


class ScopedReleaseWriterTests(unittest.TestCase):
    def setUp(self):
        self.fixture = authority_fixtures.AuthorityVerifierScopingTests()
        self.fixture.setUp()
        self.addCleanup(self.fixture.doCleanups)
        self.root = self.fixture.root
        self.f = self.fixture.fixture
        active = self.f.lessons["01"]
        patcher = mock.patch.multiple(
            builder, PROJECT_ROOT=self.root, CONFIG=self.f.config,
            AUTHORITY_ROOT=active / "20-approved", RELEASE_ROOT=active / "40-release",
            MANIFEST_PATH=active / "20-approved/lesson-manifest.json",
            LATEST_PATH=active / "40-release/latest-release.json",
        )
        patcher.start()
        self.addCleanup(patcher.stop)

    def paths(self, number, release_id="scoped-v1"):
        lesson = self.f.lessons[number]
        root = lesson / "40-release"
        return root / release_id, root / f"{release_id}.zip", root / f".{release_id}.transaction"

    def test_scoped_release_stages_commits_and_reads_back(self):
        key = self.f.key("10")
        result = builder.build_scoped_release(key, "scoped-v1", "2026-fall", "scoped-v1")
        release_dir, zip_path, transaction = self.paths("10")
        self.assertTrue(release_dir.is_dir())
        self.assertTrue(zip_path.is_file())
        self.assertFalse(transaction.exists())
        self.assertTrue(result["write_performed"])
        self.assertEqual(result["transaction_status"], "committed_and_verified")
        self.assertEqual(tree_hash(release_dir / "lesson-10-教材包"), result["tree_sha256"])
        self.assertEqual(sha256(zip_path), result["zip_sha256"])
        with zipfile.ZipFile(zip_path) as archive:
            self.assertIsNone(archive.testzip())
        latest = json.loads((self.f.lessons["10"] / "40-release/latest-release.json").read_text())
        manifest = json.loads((self.f.lessons["10"] / "20-approved/lesson-manifest.json").read_text())
        self.assertEqual(latest["lesson_key"], key)
        self.assertEqual(latest["release_id"], "scoped-v1")
        self.assertEqual(manifest["release"]["zip_sha256"], result["zip_sha256"])

    def test_inspect_clear_is_read_only(self):
        key = self.f.key("10")
        before = tree_hash(self.root)
        result = builder.inspect_transactions(key, "inspect-v1", "2026-fall")
        self.assertEqual(result["status"], "clear")
        self.assertFalse(result["write_performed"])
        self.assertFalse(any(item["exists"] for item in result["artifacts"]))
        self.assertEqual(before, tree_hash(self.root))

    def test_inspect_reports_transaction_marker_without_cleanup(self):
        key = self.f.key("10")
        transaction = self.paths("10", "inspect-v1")[2]
        transaction.mkdir()
        marker = transaction / "transaction.json"
        marker.write_text(json.dumps({"lesson_key": key, "release_id": "inspect-v1", "status": "staging"}))
        before = tree_hash(self.root)
        result = builder.inspect_transactions(key, "inspect-v1", "2026-fall")
        self.assertEqual(result["status"], "review")
        self.assertTrue(any(item.get("kind") == "transaction_marker" for item in result["artifacts"]))
        self.assertTrue(transaction.is_dir())
        self.assertEqual(before, tree_hash(self.root))

    def test_inspect_malformed_marker_is_blocked(self):
        key = self.f.key("12")
        transaction = self.paths("12", "inspect-v1")[2]
        transaction.mkdir()
        (transaction / "transaction.json").write_text("not-json")
        result = builder.inspect_transactions(key, "inspect-v1", "2026-fall")
        self.assertEqual(result["status"], "blocked")
        self.assertTrue(any("marker is invalid" in item for item in result["blockers"]))

    def test_cli_inspect_requires_explicit_lesson_and_does_not_write(self):
        key = self.f.key("10")
        before = tree_hash(self.root)
        with mock.patch.object(sys, "argv", ["release", "--inspect", "--lesson-key", key,
                "--release-id", "inspect-v1", "--offering-id", "2026-fall"]), \
                mock.patch("sys.stdout", new_callable=io.StringIO) as output:
            self.assertEqual(builder.main(), 0)
        payload = json.loads(output.getvalue())
        self.assertEqual(payload["command"], "inspect")
        self.assertFalse(payload["write_performed"])
        self.assertEqual(before, tree_hash(self.root))

    def test_confirmation_is_exact_and_precedes_any_write(self):
        before = tree_hash(self.root)
        for confirmation in (None, "", "other"):
            with self.subTest(confirmation=confirmation), self.assertRaises(PermissionError):
                builder.build_scoped_release(self.f.key("02"), "scoped-v1", confirmed_release_id=confirmation)
        self.assertEqual(before, tree_hash(self.root))

    def test_blocked_fresh_plan_precedes_any_write(self):
        lesson = self.f.lessons["12"]
        (lesson / "20-approved/manual.docx").write_text("changed")
        before = tree_hash(self.root)
        with self.assertRaisesRegex(RuntimeError, "Release plan is blocked"):
            builder.build_scoped_release(self.f.key("12"), "scoped-v1", confirmed_release_id="scoped-v1")
        self.assertEqual(before, tree_hash(self.root))
        self.assertFalse(self.paths("12")[0].exists())

    def test_authority_change_after_plan_rolls_back(self):
        key = self.f.key("02")
        original_plan = builder.plan_release
        source = self.f.lessons["02"] / "20-approved/manual.docx"
        def stale_plan(*args, **kwargs):
            plan = original_plan(*args, **kwargs)
            source.write_text("changed after plan")
            return plan
        with mock.patch.object(builder, "plan_release", side_effect=stale_plan):
            with self.assertRaisesRegex(RuntimeError, "rolled back"):
                builder.build_scoped_release(key, "scoped-v1", confirmed_release_id="scoped-v1")
        release_dir, zip_path, transaction = self.paths("02")
        self.assertFalse(release_dir.exists())
        self.assertFalse(zip_path.exists())
        self.assertFalse(transaction.exists())

    def test_authority_mutation_during_copy_rolls_back(self):
        number = "10"
        key = self.f.key(number)
        source = self.f.lessons[number] / "20-approved/manual.docx"
        real_copy = builder.copy_immutable
        mutated = False
        def mutate_after_copy(source_path, destination):
            nonlocal mutated
            real_copy(source_path, destination)
            if Path(source_path) == source and not mutated:
                source.write_text("mutated during copy")
                mutated = True
        with mock.patch.object(builder, "copy_immutable", side_effect=mutate_after_copy):
            with self.assertRaisesRegex(RuntimeError, "rolled back"):
                builder.build_scoped_release(key, "scoped-v1", confirmed_release_id="scoped-v1")
        release_dir, zip_path, transaction = self.paths(number)
        self.assertFalse(release_dir.exists())
        self.assertFalse(zip_path.exists())
        self.assertFalse(transaction.exists())

    def test_commit_failure_restores_metadata_and_removes_publication(self):
        number = "10"
        key = self.f.key(number)
        lesson = self.f.lessons[number]
        manifest_path = lesson / "20-approved/lesson-manifest.json"
        latest_path = lesson / "40-release/latest-release.json"
        original_manifest, original_latest = manifest_path.read_bytes(), latest_path.read_bytes()
        real_replace = os.replace
        failed = False
        def fail_manifest_once(source, destination):
            nonlocal failed
            if not failed and Path(destination) == manifest_path and Path(source).name == "authority-manifest.json":
                failed = True
                raise OSError("synthetic commit failure")
            return real_replace(source, destination)
        with mock.patch.object(builder.os, "replace", side_effect=fail_manifest_once):
            with self.assertRaisesRegex(RuntimeError, "rolled back"):
                builder.build_scoped_release(key, "scoped-v1", confirmed_release_id="scoped-v1")
        release_dir, zip_path, transaction = self.paths(number)
        self.assertFalse(release_dir.exists())
        self.assertFalse(zip_path.exists())
        self.assertFalse(transaction.exists())
        self.assertEqual(manifest_path.read_bytes(), original_manifest)
        self.assertEqual(latest_path.read_bytes(), original_latest)

    def test_readback_failure_restores_both_metadata_files(self):
        number = "12"
        key = self.f.key(number)
        lesson = self.f.lessons[number]
        manifest_path = lesson / "20-approved/lesson-manifest.json"
        latest_path = lesson / "40-release/latest-release.json"
        release_dir, zip_path, _transaction = self.paths(number)
        final_package = release_dir / "lesson-12-教材包"
        original_manifest, original_latest = manifest_path.read_bytes(), latest_path.read_bytes()
        real_tree_hash = builder.tree_hash
        final_reads = 0
        def fail_second_final_tree_read(path):
            nonlocal final_reads
            if Path(path) == final_package:
                final_reads += 1
                if final_reads == 2:
                    return "0" * 64
            return real_tree_hash(path)
        with mock.patch.object(builder, "tree_hash", side_effect=fail_second_final_tree_read):
            with self.assertRaisesRegex(RuntimeError, "rolled back"):
                builder.build_scoped_release(key, "scoped-v1", confirmed_release_id="scoped-v1")
        release_dir, zip_path, transaction = self.paths(number)
        self.assertFalse(release_dir.exists())
        self.assertFalse(zip_path.exists())
        self.assertFalse(transaction.exists())
        self.assertEqual(manifest_path.read_bytes(), original_manifest)
        self.assertEqual(latest_path.read_bytes(), original_latest)

    def test_partial_rollback_keeps_review_marker_but_continues_cleanup(self):
        number = "02"
        key = self.f.key(number)
        lesson = self.f.lessons[number]
        release_dir, zip_path, _transaction = self.paths(number)
        final_package = release_dir / "lesson-02-教材包"
        real_tree_hash = builder.tree_hash
        real_restore = builder._restore_bytes_atomic
        final_reads = 0
        def fail_second_final_tree(path):
            nonlocal final_reads
            if Path(path) == final_package:
                final_reads += 1
                if final_reads == 2:
                    return "0" * 64
            return real_tree_hash(path)
        def fail_manifest_restore(path, original):
            if Path(path) == lesson / "20-approved/lesson-manifest.json":
                raise OSError("synthetic restore failure")
            return real_restore(path, original)
        with mock.patch.object(builder, "tree_hash", side_effect=fail_second_final_tree), \
                mock.patch.object(builder, "_restore_bytes_atomic", side_effect=fail_manifest_restore):
            with self.assertRaisesRegex(RuntimeError, "rollback requires review"):
                builder.build_scoped_release(key, "scoped-v1", confirmed_release_id="scoped-v1")
        release_dir, zip_path, transaction = self.paths(number)
        self.assertFalse(release_dir.exists())
        self.assertFalse(zip_path.exists())
        self.assertTrue(transaction.is_dir())
        marker = json.loads((transaction / "transaction.json").read_text())
        self.assertEqual(marker["status"], "rollback_incomplete")
        self.assertTrue(marker["rollback_errors"])

    def test_concurrent_reservation_is_never_modified_by_loser(self):
        number = "10"
        key = self.f.key(number)
        transaction = self.paths(number)[2]
        original_plan = builder.plan_release
        owner_marker = b'{"owner":"other-writer"}\n'
        def racing_plan(*args, **kwargs):
            plan = original_plan(*args, **kwargs)
            transaction.mkdir()
            (transaction / "transaction.json").write_bytes(owner_marker)
            return plan
        with mock.patch.object(builder, "plan_release", side_effect=racing_plan):
            with self.assertRaises(RuntimeError):
                builder.build_scoped_release(key, "scoped-v1", confirmed_release_id="scoped-v1")
        self.assertTrue(transaction.is_dir())
        self.assertEqual((transaction / "transaction.json").read_bytes(), owner_marker)
        self.assertFalse(self.paths(number)[0].exists())
        self.assertFalse(self.paths(number)[1].exists())

    def test_existing_transaction_blocks_before_writer(self):
        transaction = self.paths("12")[2]
        transaction.mkdir()
        before = tree_hash(self.root)
        with self.assertRaisesRegex(RuntimeError, "Release plan is blocked"):
            builder.build_scoped_release(self.f.key("12"), "scoped-v1", confirmed_release_id="scoped-v1")
        self.assertEqual(before, tree_hash(self.root))

    def test_cli_execute_requires_typed_confirmation(self):
        key = self.f.key("10")
        with mock.patch.object(sys, "argv", ["release", "--execute", "--lesson-key", key,
                "--release-id", "scoped-v1", "--confirm-release-id", "scoped-v1"]), \
                mock.patch("sys.stdout", new_callable=io.StringIO) as output:
            self.assertEqual(builder.main(), 0)
        payload = json.loads(output.getvalue())
        self.assertEqual(payload["lesson_key"], key)
        self.assertEqual(payload["transaction_status"], "committed_and_verified")

    def test_cli_default_cannot_write(self):
        with mock.patch.object(builder, "build_release") as legacy, \
                mock.patch.object(builder, "build_scoped_release") as scoped, \
                mock.patch.object(sys, "argv", ["release"]), \
                mock.patch("sys.stderr", new_callable=io.StringIO), \
                self.assertRaises(SystemExit):
            builder.main()
        legacy.assert_not_called()
        scoped.assert_not_called()


if __name__ == "__main__":
    unittest.main()
