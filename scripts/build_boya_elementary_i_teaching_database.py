#!/usr/bin/env python3
"""Build a searchable, project-local source database for Boya Elementary I."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import re
import sqlite3
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
BOOK_ID = "boya-elementary-i"
DATASET = ROOT / "textbooks/boya-elementary-i-ii/source/reference-dataset"
CSV_DIR = DATASET / "csv"
OCR_DIR = ROOT / ".tmp/ocr-elementary-i"
BOOK_SOURCE = ROOT / "textbooks/boya-elementary-i/source"
OUTPUT_DIR = BOOK_SOURCE / "derived"
OUTPUT_DB = OUTPUT_DIR / "teaching-materials-database.sqlite"
CSV_TABLES = {
    "lessons.csv": "lesson_index",
    "vocabulary_master.csv": "vocabulary_master",
    "vocabulary_occurrences.csv": "vocabulary_occurrences",
    "grammar.csv": "grammar",
    "grammar_source_patterns.csv": "grammar_source_patterns",
    "grammar_legacy_candidates.csv": "grammar_legacy_candidates",
    "expressions.csv": "expressions",
    "reference_sentences.csv": "reference_sentences",
    "translations_vi.csv": "translations_vi",
}


def inside_project(path: Path) -> Path:
    resolved = path.resolve()
    if resolved == ROOT or not resolved.is_relative_to(ROOT):
        raise ValueError(f"Path escapes the project root: {path}")
    return resolved


def read_json(path: Path) -> dict[str, Any]:
    inside_project(path)
    return json.loads(path.read_text(encoding="utf-8"))


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    inside_project(path)
    with path.open(encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        if not reader.fieldnames:
            raise ValueError(f"CSV has no header: {path}")
        rows = list(reader)
    return reader.fieldnames, rows


def quote(identifier: str) -> str:
    if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", identifier):
        raise ValueError(f"Unexpected SQL identifier: {identifier}")
    return f'"{identifier}"'


def lesson_page_map(
    lesson_rows: list[dict[str, str]],
    page_refs: list[dict[str, Any]],
    page_count: int,
    appendix_start: int,
) -> dict[int, dict[str, str | None]]:
    starts = sorted(
        (int(row["source_pdf_start_page"]), row["lesson_key"])
        for row in lesson_rows
    )
    exact_refs: dict[int, set[str]] = {}
    for ref in page_refs:
        exact_refs.setdefault(int(ref["scan_page"]), set()).add(ref["lesson_key"])

    mapped: dict[int, dict[str, str | None]] = {}
    for page in range(1, page_count + 1):
        if page < starts[0][0]:
            mapped[page] = {
                "lesson_key": None,
                "page_kind": "front_matter",
                "mapping_status": "outside_lesson_range",
            }
            continue
        if page >= appendix_start:
            mapped[page] = {
                "lesson_key": None,
                "page_kind": "appendix_or_back_matter",
                "mapping_status": "outside_lesson_range",
            }
            continue

        candidate = max((item for item in starts if item[0] <= page), key=lambda x: x[0])[1]
        refs = exact_refs.get(page, set())
        if len(refs) > 1:
            raise ValueError(f"Conflicting lesson identities for scan page {page}: {sorted(refs)}")
        if refs and candidate not in refs:
            mapped[page] = {
                "lesson_key": next(iter(refs)),
                "page_kind": "lesson",
                "mapping_status": "project_page_evidence_override",
            }
        else:
            mapped[page] = {
                "lesson_key": candidate,
                "page_kind": "lesson",
                "mapping_status": "lesson_start_ranges",
            }
    return mapped


def create_csv_table(
    conn: sqlite3.Connection,
    table: str,
    headers: list[str],
    source_rows: list[dict[str, str]],
    page_map: dict[int, dict[str, str | None]],
) -> int:
    rows = [row for row in source_rows if row.get("textbook_id") == BOOK_ID]
    columns = list(headers)
    extra_columns: list[str] = []
    if table == "vocabulary_occurrences" and "lesson_key" not in columns:
        extra_columns = ["lesson_key", "lesson_key_method"]
    elif table == "reference_sentences" and "lesson_key" not in columns:
        extra_columns = ["lesson_key", "lesson_key_method"]
    elif table == "lesson_index":
        extra_columns = ["lesson_title_for_materials", "title_status"]
    columns += extra_columns

    definitions = ", ".join(f"{quote(name)} TEXT" for name in columns)
    conn.execute(
        f"CREATE TABLE {quote(table)} (row_id INTEGER PRIMARY KEY, {definitions})"
    )
    placeholders = ", ".join("?" for _ in columns)
    insert = f"INSERT INTO {quote(table)} ({', '.join(quote(c) for c in columns)}) VALUES ({placeholders})"
    values: list[tuple[str | None, ...]] = []
    for row in rows:
        record: dict[str, str | None] = dict(row)
        if table == "vocabulary_occurrences":
            record["lesson_key"] = f"{row['textbook_id']}:{row['lesson_id']}"
            record["lesson_key_method"] = "textbook_id_plus_lesson_id"
        elif table == "reference_sentences":
            page = int(row["source_pdf_page"])
            record["lesson_key"] = page_map.get(page, {}).get("lesson_key")
            record["lesson_key_method"] = "scan_page_map" if record["lesson_key"] else "unmapped_scan_page"
        elif table == "lesson_index":
            if row["lesson_key"] == f"{BOOK_ID}:lesson-13":
                record["lesson_title_for_materials"] = "你打算买什么样子的"
                record["title_status"] = "project_confirmed_title"
            else:
                record["lesson_title_for_materials"] = row["lesson_title"]
                record["title_status"] = "copied_from_lessons_csv"
        values.append(tuple(record.get(column) for column in columns))
    conn.executemany(insert, values)
    if "lesson_key" in columns:
        conn.execute(
            f"CREATE INDEX {quote(table + '_lesson_key_idx')} ON {quote(table)} (lesson_key)"
        )
    if "textbook_id" in columns:
        conn.execute(
            f"CREATE INDEX {quote(table + '_textbook_idx')} ON {quote(table)} (textbook_id)"
        )
    return len(rows)


def add_known_findings(conn: sqlite3.Connection) -> None:
    conn.execute(
        """CREATE TABLE quality_findings (
            finding_id TEXT PRIMARY KEY,
            severity TEXT NOT NULL,
            finding TEXT NOT NULL,
            evidence_path TEXT NOT NULL,
            use_rule TEXT NOT NULL
        )"""
    )
    findings = [
        (
            "vocabulary-occurrence-page",
            "high",
            "vocabulary_occurrences.source_printed_page is not reliable for lesson-page lookup; it conflicts with lesson-specific printed pages.",
            "textbooks/boya-elementary-i-ii/source/reference-dataset/csv/vocabulary_occurrences.csv",
            "Use page_print_references and the lesson's canonical source for printed-page markers; do not copy source_printed_page into teaching materials.",
        ),
        (
            "lesson-04-word-jiao",
            "medium",
            "The Lesson 04 canonical source lists 叫, but the lesson's vocabulary occurrence table does not.",
            "lessons/boya-elementary-i/lesson-04/00-source/canonical-source.json",
            "Check the canonical source before treating the occurrence table as complete.",
        ),
        (
            "missing-key-sentence-rows",
            "medium",
            "OCR contains key-sentence sections for Lessons 06, 08, 13, 17, and 20 that are absent from reference_sentences.csv.",
            "textbooks/boya-elementary-i-ii/source/reference-dataset/csv/reference_sentences.csv",
            "Search source_pages for these lessons and review the page before adding or teaching a sentence.",
        ),
        (
            "lesson-13-title-variant",
            "medium",
            "The source CSV title for Lesson 13 omits 的; lesson_title_for_materials uses the project-confirmed full title.",
            "docs/boya-elementary-i-full-book-semester-plan-2026-09-15.md",
            "Keep the original lesson_title field for source traceability; use lesson_title_for_materials for new teaching materials.",
        ),
        (
            "draft-translations-and-grammar",
            "high",
            "Vietnamese meanings are marked translated_subagent_draft, and grammar rows remain pending manual review.",
            "textbooks/boya-elementary-i-ii/source/reference-dataset/README.md",
            "Do not present these values as teacher-reviewed translations or approved publisher grammar.",
        ),
        (
            "audio-coverage",
            "high",
            "Project-local publisher audio files currently exist for Lesson 01 only; OCR track labels for other lessons are not proof that audio is available or verified.",
            "textbooks/boya-elementary-i/source/audio",
            "Check each lesson's audio manifest, actual file, semantic match, and playback before using audio.",
        ),
        (
            "canonical-source-coverage",
            "medium",
            "Lesson-specific canonical source packages exist for Lessons 01–04; Lessons 05–25 have OCR source pages but no per-lesson canonical source package in this checkout.",
            "textbooks/boya-elementary-i/source/source-inventory.json",
            "Treat OCR pages as search and review input, not approved source content.",
        ),
    ]
    conn.executemany(
        "INSERT INTO quality_findings VALUES (?, ?, ?, ?, ?)", findings
    )


def build_database(replace: bool) -> Path:
    out_dir = inside_project(OUTPUT_DIR)
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = inside_project(OUTPUT_DB)
    if out_path.exists() and not replace:
        raise FileExistsError(f"Database already exists; pass --replace to rebuild: {out_path}")

    dataset_manifest_path = DATASET / "manifest.json"
    source_inventory_path = BOOK_SOURCE / "source-inventory.json"
    ocr_manifest_path = OCR_DIR / "manifest.json"
    audit_path = DATASET / "grammar-audit-evidence.json"
    dataset_manifest = read_json(dataset_manifest_path)
    source_inventory = read_json(source_inventory_path)
    ocr_manifest = read_json(ocr_manifest_path)
    audit = read_json(audit_path)
    book_entry = next(
        book for book in dataset_manifest["source_books"] if book["textbook_id"] == BOOK_ID
    )
    appendix_start = min(int(page) for page in book_entry["appendix_pdf_pages"])
    page_count = int(ocr_manifest["page_count"])

    csv_data: dict[str, tuple[list[str], list[dict[str, str]]]] = {}
    for filename in CSV_TABLES:
        path = CSV_DIR / filename
        headers, rows = read_csv(path)
        if "textbook_id" not in headers:
            raise ValueError(f"Missing textbook_id column: {path}")
        csv_data[filename] = (headers, rows)
    lesson_rows = [
        row
        for row in csv_data["lessons.csv"][1]
        if row.get("textbook_id") == BOOK_ID
    ]
    if len(lesson_rows) != int(source_inventory["lesson_count"]):
        raise ValueError("Lesson registry count does not match the textbook inventory.")

    page_refs: list[dict[str, Any]] = []
    for lesson in audit["lessons"]:
        if lesson.get("lesson_key", "").startswith(f"{BOOK_ID}:"):
            for ref in lesson.get("source_pages", []):
                page_refs.append(
                    {
                        "lesson_key": lesson["lesson_key"],
                        "scan_page": int(ref["scan_page"]),
                        "printed_page": int(ref["printed_page"]),
                        "section": str(ref["section"]),
                    }
                )
    page_map = lesson_page_map(lesson_rows, page_refs, page_count, appendix_start)

    ocr_files = sorted(OCR_DIR.glob("page-*.txt"))
    if len(ocr_files) != page_count:
        raise ValueError(f"Expected {page_count} OCR page files, found {len(ocr_files)}.")
    ocr_by_page: dict[int, Path] = {}
    for path in ocr_files:
        match = re.fullmatch(r"page-(\d+)\.txt", path.name)
        if match:
            ocr_by_page[int(match.group(1))] = path
    if sorted(ocr_by_page) != list(range(1, page_count + 1)):
        raise ValueError("OCR page numbering is incomplete or duplicated.")

    fd, temp_name = tempfile.mkstemp(
        prefix=".teaching-materials-database-", suffix=".sqlite", dir=out_dir
    )
    os.close(fd)
    temp_path = Path(temp_name)
    try:
        conn = sqlite3.connect(temp_path)
        conn.execute("PRAGMA journal_mode=DELETE")
        conn.execute("PRAGMA synchronous=FULL")
        conn.execute("PRAGMA foreign_keys=ON")
        conn.execute("BEGIN")

        conn.execute(
            "CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL)"
        )
        source_pdf_hash = str(source_inventory["source_pdf"]["sha256"])
        metadata = {
            "database_id": "boya-elementary-i-teaching-materials-source",
            "database_version": "0.1.0",
            "built_at": datetime.now().astimezone().isoformat(timespec="seconds"),
            "textbook_id": BOOK_ID,
            "title": "博雅汉语听说·初级起步篇 I",
            "source_pdf_sha256": source_pdf_hash,
            "source_pdf_opened_by_builder": "false",
            "ocr_engine": str(ocr_manifest["ocr_engine"]),
            "ocr_page_count": str(page_count),
            "source_status": "derived_ocr_and_reference_data_needs_human_review",
        }
        conn.executemany(
            "INSERT INTO metadata (key, value) VALUES (?, ?)", metadata.items()
        )

        conn.execute(
            """CREATE TABLE source_inputs (
                path TEXT PRIMARY KEY,
                sha256 TEXT NOT NULL,
                bytes INTEGER NOT NULL,
                source_kind TEXT NOT NULL
            )"""
        )
        input_paths = [
            *[CSV_DIR / name for name in CSV_TABLES],
            dataset_manifest_path,
            source_inventory_path,
            ocr_manifest_path,
            audit_path,
        ]
        conn.executemany(
            "INSERT INTO source_inputs VALUES (?, ?, ?, ?)",
            [
                (
                    path.relative_to(ROOT).as_posix(),
                    sha256(path),
                    path.stat().st_size,
                    "structured_reference" if path.parent == CSV_DIR else "source_evidence",
                )
                for path in input_paths
            ],
        )

        conn.execute(
            """CREATE TABLE source_pages (
                source_pdf_page INTEGER PRIMARY KEY,
                lesson_key TEXT,
                page_kind TEXT NOT NULL,
                mapping_status TEXT NOT NULL,
                source_path TEXT NOT NULL,
                source_sha256 TEXT NOT NULL,
                ocr_text TEXT NOT NULL
            )"""
        )
        conn.executemany(
            "INSERT INTO source_pages VALUES (?, ?, ?, ?, ?, ?, ?)",
            [
                (
                    page,
                    page_map[page]["lesson_key"],
                    page_map[page]["page_kind"],
                    page_map[page]["mapping_status"],
                    path.relative_to(ROOT).as_posix(),
                    sha256(path),
                    path.read_text(encoding="utf-8", errors="replace"),
                )
                for page, path in sorted(ocr_by_page.items())
            ],
        )
        conn.execute("CREATE INDEX source_pages_lesson_idx ON source_pages (lesson_key)")

        conn.execute(
            """CREATE TABLE page_print_references (
                lesson_key TEXT NOT NULL,
                source_pdf_page INTEGER NOT NULL,
                printed_page INTEGER NOT NULL,
                section TEXT NOT NULL,
                evidence_path TEXT NOT NULL
            )"""
        )
        conn.executemany(
            "INSERT INTO page_print_references VALUES (?, ?, ?, ?, ?)",
            [
                (
                    ref["lesson_key"],
                    ref["scan_page"],
                    ref["printed_page"],
                    ref["section"],
                    "textbooks/boya-elementary-i-ii/source/reference-dataset/grammar-audit-evidence.json",
                )
                for ref in page_refs
            ],
        )
        conn.execute(
            "CREATE INDEX page_print_refs_lesson_idx ON page_print_references (lesson_key)"
        )
        conn.execute(
            "CREATE INDEX page_print_refs_scan_idx ON page_print_references (source_pdf_page)"
        )

        table_counts: dict[str, int] = {}
        for filename, table in CSV_TABLES.items():
            headers, rows = csv_data[filename]
            table_counts[table] = create_csv_table(
                conn, table, headers, rows, page_map
            )

        conn.execute(
            """CREATE TABLE lesson_source_status (
                lesson_key TEXT PRIMARY KEY,
                canonical_source_path TEXT,
                canonical_source_status TEXT NOT NULL,
                canonical_approved TEXT,
                audio_manifest_path TEXT,
                project_audio_file_count INTEGER NOT NULL,
                source_page_count INTEGER NOT NULL,
                vocabulary_occurrence_count INTEGER NOT NULL,
                grammar_row_count INTEGER NOT NULL,
                expression_count INTEGER NOT NULL,
                reference_sentence_count INTEGER NOT NULL
            )"""
        )
        page_counts: dict[str, int] = {}
        for record in page_map.values():
            key = record["lesson_key"]
            if key:
                page_counts[key] = page_counts.get(key, 0) + 1
        source_status_rows = []
        for lesson in lesson_rows:
            key = lesson["lesson_key"]
            number = int(lesson["lesson_number"])
            canonical_path = (
                ROOT / f"lessons/{BOOK_ID}/lesson-{number:02}/00-source/canonical-source.json"
            )
            audio_manifest = (
                ROOT / f"lessons/{BOOK_ID}/lesson-{number:02}/00-source/audio-manifest.json"
            )
            if canonical_path.is_file():
                canonical = read_json(canonical_path)
                canonical_status = str(canonical.get("source_status", "present_unlabeled"))
                approved = json.dumps(canonical.get("approved"), ensure_ascii=False)
                canonical_rel: str | None = canonical_path.relative_to(ROOT).as_posix()
            else:
                canonical_status = "not_materialized_in_repo"
                approved = None
                canonical_rel = None
            if audio_manifest.is_file():
                audio_rel: str | None = audio_manifest.relative_to(ROOT).as_posix()
            else:
                audio_rel = None
            audio_dir = BOOK_SOURCE / f"audio/lesson-{number:02}"
            audio_count = sum(1 for path in audio_dir.rglob("*") if path.is_file()) if audio_dir.is_dir() else 0
            source_status_rows.append(
                (
                    key,
                    canonical_rel,
                    canonical_status,
                    approved,
                    audio_rel,
                    audio_count,
                    page_counts.get(key, 0),
                    sum(1 for row in csv_data["vocabulary_occurrences.csv"][1] if row.get("textbook_id") == BOOK_ID and int(row["lesson_number"]) == number),
                    sum(1 for row in csv_data["grammar.csv"][1] if row.get("textbook_id") == BOOK_ID and int(row["lesson_number"]) == number),
                    sum(1 for row in csv_data["expressions.csv"][1] if row.get("textbook_id") == BOOK_ID and int(row["lesson_number"]) == number),
                    sum(1 for row in csv_data["reference_sentences.csv"][1] if row.get("textbook_id") == BOOK_ID and page_map.get(int(row["source_pdf_page"]), {}).get("lesson_key") == key),
                )
            )
        conn.executemany(
            "INSERT INTO lesson_source_status VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            source_status_rows,
        )

        add_known_findings(conn)
        conn.execute(
            "INSERT INTO metadata (key, value) VALUES ('structured_table_counts', ?)",
            (json.dumps(table_counts, ensure_ascii=False, sort_keys=True),),
        )
        conn.commit()

        if conn.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
            raise RuntimeError("SQLite integrity check failed.")
        if conn.execute("SELECT COUNT(*) FROM lesson_index").fetchone()[0] != 25:
            raise RuntimeError("Expected exactly 25 Book I lesson records.")
        if conn.execute("SELECT COUNT(*) FROM source_pages").fetchone()[0] != page_count:
            raise RuntimeError("OCR page count does not match the source manifest.")
        if conn.execute(
            "SELECT lesson_key FROM source_pages WHERE source_pdf_page=118"
        ).fetchone()[0] != f"{BOOK_ID}:lesson-12":
            raise RuntimeError("Known Lesson 12 scan-order exception was not mapped.")
        for table in CSV_TABLES.values():
            if conn.execute(
                f"SELECT COUNT(*) FROM {quote(table)} WHERE textbook_id != ?",
                (BOOK_ID,),
            ).fetchone()[0]:
                raise RuntimeError(f"Non-Book-I rows leaked into {table}.")
        conn.close()

        if replace:
            os.replace(temp_path, out_path)
        else:
            os.link(temp_path, out_path)
            temp_path.unlink()
        return out_path
    except Exception:
        try:
            conn.close()
        except (UnboundLocalError, sqlite3.Error):
            pass
        temp_path.unlink(missing_ok=True)
        raise


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--replace",
        action="store_true",
        help="atomically replace the existing derived database",
    )
    args = parser.parse_args()
    print(build_database(replace=args.replace))


if __name__ == "__main__":
    main()
