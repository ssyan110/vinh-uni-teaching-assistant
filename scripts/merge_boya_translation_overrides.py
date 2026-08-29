#!/usr/bin/env python3
"""Merge bounded Vietnamese translation drafts into the elementary dataset.

The source-derived CSVs remain untouched.  This creates a small override layer
keyed by stable record IDs; the dataset builder reads it on every rebuild.
"""

from __future__ import annotations

import csv
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATASET = ROOT / "textbooks" / "boya-elementary-i-ii" / "source" / "reference-dataset"
CSV_DIR = DATASET / "csv"
TMP_FILES = [
    ROOT / ".tmp" / "translation-i.csv",       # optional whole-book draft
    ROOT / ".tmp" / "translation-i-1.csv",
    ROOT / ".tmp" / "translation-i-2.csv",
    ROOT / ".tmp" / "translation-ii.csv",      # optional whole-book draft
    ROOT / ".tmp" / "translation-ii-1.csv",
    ROOT / ".tmp" / "translation-ii-2.csv",
    ROOT / ".tmp" / "translation-grammar.csv",
]
OUTPUT = DATASET / "translation-overrides.csv"


def read_rows(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open(encoding="utf-8-sig", newline="") as handle:
        return [dict(row) for row in csv.DictReader(handle)]


def expected_ids() -> dict[str, set[str]]:
    expected: dict[str, set[str]] = {"vocabulary": set(), "grammar": set(), "expression": set()}
    for row in read_rows(CSV_DIR / "vocabulary_master.csv"):
        expected["vocabulary"].add(row["vocabulary_key"])
    for row in read_rows(CSV_DIR / "grammar.csv"):
        expected["grammar"].add(row["grammar_id"])
    for row in read_rows(CSV_DIR / "expressions.csv"):
        expected["expression"].add(row["expression_id"])
    return expected


def main() -> None:
    merged: dict[tuple[str, str], dict[str, str]] = {}
    for path in [OUTPUT, *TMP_FILES]:
        for row in read_rows(path):
            record_type = str(row.get("record_type", "")).strip()
            record_id = str(row.get("record_id", "")).strip()
            meaning = str(row.get("meaning_vi", "")).strip()
            if not record_type or not record_id or not meaning:
                continue
            merged[(record_type, record_id)] = {
                "record_type": record_type,
                "record_id": record_id,
                "meaning_vi": meaning,
                "meaning_vi_status": str(row.get("meaning_vi_status", "translated_subagent_draft")).strip() or "translated_subagent_draft",
            }

    expected = expected_ids()
    missing = sorted((record_type, record_id) for record_type, ids in expected.items() for record_id in ids if (record_type, record_id) not in merged)
    extra = sorted(key for key in merged if key[0] not in expected or key[1] not in expected[key[0]])
    if missing or extra:
        print(f"missing={len(missing)} extra={len(extra)}")
        if missing:
            print("missing sample:", missing[:12])
        if extra:
            print("extra sample:", extra[:12])
        raise SystemExit(2)

    order: list[tuple[str, str]] = []
    for filename, record_type, id_field in [
        ("vocabulary_master.csv", "vocabulary", "vocabulary_key"),
        ("grammar.csv", "grammar", "grammar_id"),
        ("expressions.csv", "expression", "expression_id"),
    ]:
        order.extend((record_type, row[id_field]) for row in read_rows(CSV_DIR / filename))
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["record_type", "record_id", "meaning_vi", "meaning_vi_status"])
        writer.writeheader()
        writer.writerows(merged[key] for key in order)
    print(f"merged={len(order)} output={OUTPUT}")


if __name__ == "__main__":
    main()
