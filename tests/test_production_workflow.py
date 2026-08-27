from __future__ import annotations

import json
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest import mock


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SCRIPTS_ROOT = PROJECT_ROOT / "scripts"
sys.path.insert(0, str(SCRIPTS_ROOT))

import build_release_package as release_builder
from build_release_package import validate_release_id, write_deterministic_zip
from verify_lesson_authority import audit_release_directory, audit_release_zip
from workflow_integrity import (
    audit_authority_manifest,
    audit_frozen_source_package,
    expected_release_entries,
    sha256,
    tree_hash,
)


def manifest_item(project_root: Path, path: Path) -> dict[str, object]:
    return {
        "path": path.relative_to(project_root).as_posix(),
        "sha256": sha256(path),
        "bytes": path.stat().st_size,
    }


class ProductionWorkflowTests(unittest.TestCase):
    def test_authority_inventory_rejects_unregistered_files(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            authority = root / "lessons/boya-intermediate-i/lesson-01/20-approved"
            activity = authority / "activities/card.docx"
            activity.parent.mkdir(parents=True)
            activity.write_bytes(b"approved")
            extra = authority / "unapproved.txt"
            extra.write_bytes(b"extra")
            manifest = {
                "authority": {"activities": {"file_count": 1}},
                "files": [manifest_item(root, activity)],
            }

            audit = audit_authority_manifest(root, authority, manifest)

            self.assertIn(
                f"unregistered authority file: {extra.relative_to(root).as_posix()}",
                audit["failures"],
            )

    def test_authority_inventory_rejects_escaping_manifest_path(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            authority = root / "authority"
            authority.mkdir()
            outside = root / "outside.txt"
            outside.write_bytes(b"outside")
            manifest = {
                "authority": {"activities": {"file_count": 0}},
                "files": [
                    {
                        "path": "../outside.txt",
                        "sha256": sha256(outside),
                        "bytes": outside.stat().st_size,
                    }
                ],
            }

            audit = audit_authority_manifest(root, authority, manifest)

            self.assertTrue(
                any("invalid authority manifest path" in item for item in audit["failures"])
            )

    def test_frozen_source_detects_post_approval_change(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source = root / "frozen"
            source.mkdir()
            file_path = source / "material.docx"
            file_path.write_bytes(b"approved")
            manifest = {
                "source_package": {
                    "path": "frozen",
                    "status": "frozen_input",
                    "file_count": 1,
                    "tree_sha256": tree_hash(source),
                }
            }
            self.assertEqual(
                [],
                audit_frozen_source_package(root, "frozen", manifest)["failures"],
            )

            file_path.write_bytes(b"changed")
            audit = audit_frozen_source_package(root, "frozen", manifest)

            self.assertIn("frozen source package tree hash mismatch", audit["failures"])

    def test_historical_source_snapshot_is_valid_traceability_evidence(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source = root / "archive/legacy-materials/lesson-01"
            source.mkdir(parents=True)
            file_path = source / "material.docx"
            file_path.write_bytes(b"historical")
            manifest = {
                "source_package": {
                    "path": "archive/legacy-materials/lesson-01",
                    "status": "historical_evidence",
                    "file_count": 1,
                    "tree_sha256": tree_hash(source),
                }
            }

            audit = audit_frozen_source_package(
                root, "archive/legacy-materials/lesson-01", manifest
            )

            self.assertEqual([], audit["failures"])

    def test_release_mapping_comes_from_declared_authority(self) -> None:
        manifest = {
            "authority": {
                "pptx": {"path": "authority/deck.pptx"},
                "ppt_preview": {"path": "authority/deck.pdf"},
                "teacher_manual": {"path": "authority/manual.docx"},
                "activities": {"path": "authority/activities"},
            },
            "files": [
                {"path": "authority/README.md", "sha256": "0" * 64, "bytes": 1},
                {"path": "authority/deck.pptx", "sha256": "1" * 64, "bytes": 2},
                {"path": "authority/deck.pdf", "sha256": "2" * 64, "bytes": 3},
                {"path": "authority/manual.docx", "sha256": "3" * 64, "bytes": 4},
                {
                    "path": "authority/activities/group/card.docx",
                    "sha256": "4" * 64,
                    "bytes": 5,
                },
            ],
        }

        entries, failures = expected_release_entries(manifest)

        self.assertEqual([], failures)
        self.assertEqual(
            {
                "01-课堂PPT/deck.pptx",
                "01-课堂PPT/deck.pdf",
                "02-简易教案/manual.docx",
                "03-活动卡/group/card.docx",
            },
            {entry["release_path"] for entry in entries},
        )

    def test_release_mapping_includes_declared_optional_materials(self) -> None:
        manifest = {
            "authority": {
                "pptx": {"path": "authority/deck.pptx"},
                "ppt_preview": {"path": "authority/deck.pdf"},
                "teacher_manual": {"path": "authority/manual.docx"},
                "activities": {"path": "authority/activities"},
            },
            "files": [
                {"path": "authority/deck.pptx", "sha256": "1" * 64, "bytes": 2},
                {"path": "authority/deck.pdf", "sha256": "2" * 64, "bytes": 3},
                {"path": "authority/manual.docx", "sha256": "3" * 64, "bytes": 4},
                {
                    "path": "authority/activities/group/card.docx",
                    "sha256": "4" * 64,
                    "bytes": 5,
                },
                {"path": "authority/supplement.pdf", "sha256": "5" * 64, "bytes": 6},
            ],
            "release_materials": [
                {
                    "source_path": "authority/supplement.pdf",
                    "release_path": "04-补充/supplement.pdf",
                    "category": "supplement",
                }
            ],
        }

        entries, failures = expected_release_entries(manifest)

        self.assertEqual([], failures)
        self.assertIn(
            "04-补充/supplement.pdf",
            {entry["release_path"] for entry in entries},
        )

    def test_release_mapping_rejects_unsafe_optional_destination(self) -> None:
        manifest = {
            "authority": {
                "pptx": {"path": "authority/deck.pptx"},
                "ppt_preview": {"path": "authority/deck.pdf"},
                "teacher_manual": {"path": "authority/manual.docx"},
                "activities": {"path": "authority/activities"},
            },
            "files": [
                {"path": "authority/deck.pptx", "sha256": "1" * 64, "bytes": 2},
                {"path": "authority/deck.pdf", "sha256": "2" * 64, "bytes": 3},
                {"path": "authority/manual.docx", "sha256": "3" * 64, "bytes": 4},
                {
                    "path": "authority/activities/group/card.docx",
                    "sha256": "4" * 64,
                    "bytes": 5,
                },
                {"path": "authority/supplement.pdf", "sha256": "5" * 64, "bytes": 6},
            ],
            "release_materials": [
                {
                    "source_path": "authority/supplement.pdf",
                    "release_path": "../escape.pdf",
                    "category": "supplement",
                }
            ],
        }

        _entries, failures = expected_release_entries(manifest)

        self.assertTrue(any("unsafe release_path" in failure for failure in failures))

    def test_release_directory_rejects_unapproved_extra_file(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            package = Path(temp) / "第一课-教学资料"
            approved = package / "01-课堂PPT/deck.pptx"
            approved.parent.mkdir(parents=True)
            approved.write_bytes(b"approved")
            extra = package / "extra.txt"
            extra.write_bytes(b"extra")
            entries = [
                {
                    "release_path": "01-课堂PPT/deck.pptx",
                    "sha256": sha256(approved),
                    "bytes": approved.stat().st_size,
                }
            ]
            failures: list[str] = []

            audit_release_directory(package, entries, failures)

            self.assertIn("unapproved release file: extra.txt", failures)

    def test_release_id_rejects_path_traversal(self) -> None:
        for value in (None, "", "../escape", "nested/id", "/absolute", ".."):
            with self.subTest(value=value):
                with self.assertRaises(ValueError):
                    validate_release_id(value)
        self.assertEqual("2026-08-27-v1", validate_release_id("2026-08-27-v1"))

    def test_release_zip_is_deterministic(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            release_dir = Path(temp) / "release"
            package = release_dir / "第一课-教学资料"
            (package / "b").mkdir(parents=True)
            (package / "a.txt").write_bytes(b"a")
            (package / "b/b.txt").write_bytes(b"b")
            first = Path(temp) / "first.zip"
            second = Path(temp) / "second.zip"

            write_deterministic_zip(package, release_dir, first)
            write_deterministic_zip(package, release_dir, second)

            self.assertEqual(sha256(first), sha256(second))
            with zipfile.ZipFile(first) as archive:
                self.assertTrue(
                    all(info.date_time == (1980, 1, 1, 0, 0, 0) for info in archive.infolist())
                )

    def test_release_build_is_manifest_driven_and_non_overwriting(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            authority = root / "lessons/boya-intermediate-i/lesson-01/20-approved"
            release_root = root / "lessons/boya-intermediate-i/lesson-01/40-release"
            pptx = authority / "pptx/deck.pptx"
            preview = authority / "pptx/deck.pdf"
            manual = authority / "teacher-manual/manual.docx"
            activity = authority / "activities/group/card.docx"
            for path, content in (
                (pptx, b"pptx"),
                (preview, b"pdf"),
                (manual, b"manual"),
                (activity, b"activity"),
            ):
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(content)
            manifest_path = authority / "lesson-manifest.json"
            manifest = {
                "lesson_id": "lesson-01",
                "lesson_title": "中国人的姓名",
                "authority": {
                    "pptx": {"path": pptx.relative_to(root).as_posix()},
                    "ppt_preview": {"path": preview.relative_to(root).as_posix()},
                    "teacher_manual": {"path": manual.relative_to(root).as_posix()},
                    "activities": {"path": activity.parents[1].relative_to(root).as_posix()},
                },
                "files": [
                    manifest_item(root, path)
                    for path in (pptx, preview, manual, activity)
                ],
            }
            manifest_path.write_text(
                json.dumps(manifest, ensure_ascii=False), encoding="utf-8"
            )

            with mock.patch.multiple(
                release_builder,
                PROJECT_ROOT=root,
                AUTHORITY_ROOT=authority,
                RELEASE_ROOT=release_root,
                MANIFEST_PATH=manifest_path,
                LATEST_PATH=release_root / "latest-release.json",
            ), mock.patch.object(release_builder, "assert_ready", return_value={}):
                release = release_builder.build_release("test-v1")
                with self.assertRaises(RuntimeError):
                    release_builder.build_release("test-v1")

            self.assertEqual(4, release["file_count"])
            self.assertEqual(1, release["activity_docx_count"])
            self.assertTrue((release_root / "test-v1.zip").is_file())
            self.assertEqual(
                b"activity",
                (
                    release_root
                    / "test-v1/第一课-教学资料/03-活动卡/group/card.docx"
                ).read_bytes(),
            )

    def test_release_zip_rejects_unsafe_member(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            zip_path = Path(temp) / "unsafe.zip"
            with zipfile.ZipFile(zip_path, "w") as archive:
                archive.writestr("../escape.txt", "bad")
            failures: list[str] = []

            audit_release_zip(zip_path, [], failures)

            self.assertTrue(
                any("unsafe path" in failure for failure in failures),
                json.dumps(failures, ensure_ascii=False),
            )


if __name__ == "__main__":
    unittest.main()
