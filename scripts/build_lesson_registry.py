#!/usr/bin/env python3
"""Build the canonical lesson identity registry.

Lesson numbers are local to a textbook.  The registry gives every lesson a
stable compound key so that ``lesson-01`` in two different books can coexist
without being mistaken for the same production item.
"""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
COURSE_MANIFEST_PATH = PROJECT_ROOT / "course/course-manifest.json"
TEXTBOOK_REGISTRY_PATH = PROJECT_ROOT / "textbooks/registry.json"
OUTPUT_PATH = PROJECT_ROOT / "course/lesson-registry.json"


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def relative(path: Path) -> str:
    return path.relative_to(PROJECT_ROOT).as_posix()


def offering_index() -> dict[str, dict[str, Any]]:
    result: dict[str, dict[str, Any]] = {}
    offering_root = PROJECT_ROOT / "course/offerings"
    for path in sorted(offering_root.glob("*/offering.json")):
        payload = read_json(path)
        offering_id = payload.get("offering_id")
        if offering_id:
            result[str(offering_id)] = payload
    return result


def scoped_offerings(textbook_id: str, offerings: dict[str, dict[str, Any]]) -> list[str]:
    result: list[str] = []
    for offering_id, offering in offerings.items():
        textbooks = offering.get("textbooks", [])
        if any(item.get("textbook_id") == textbook_id for item in textbooks):
            result.append(offering_id)
    return result


def lesson_status(
    lesson_root: Path,
    source: dict[str, Any] | None,
    authority: dict[str, Any] | None,
) -> dict[str, Any]:
    """Expose status fields without inventing delivery claims."""

    if authority:
        release = authority.get("release", {})
        return {
            "stage": "authority",
            "authority_status": authority.get("authority_status"),
            "content_status": authority.get("content_status"),
            "delivery_status": release.get("delivery_status")
            or authority.get("delivery_status"),
        }
    if source:
        return {
            "stage": "source",
            "source_status": source.get("source_status"),
            "source_qa_status": source.get("source_qa_status"),
            "status": source.get("status"),
        }
    return {"stage": "catalog_only"}


def build() -> Path:
    course = read_json(COURSE_MANIFEST_PATH)
    textbook_registry = read_json(TEXTBOOK_REGISTRY_PATH)
    offerings = offering_index()
    textbooks: list[dict[str, Any]] = []
    lessons: list[dict[str, Any]] = []
    seen_keys: set[str] = set()

    for registry_item in textbook_registry.get("textbooks", []):
        textbook_id = str(registry_item["textbook_id"])
        textbook_manifest_path = PROJECT_ROOT / str(registry_item["manifest"])
        textbook = read_json(textbook_manifest_path)
        inventory_path = PROJECT_ROOT / str(textbook["source_inventory"])
        inventory = read_json(inventory_path)
        lesson_root_rel = str(textbook["lesson_root"])
        offering_ids = scoped_offerings(textbook_id, offerings)
        textbook_record = {
            "textbook_id": textbook_id,
            "title": textbook.get("title") or registry_item.get("title"),
            "status": textbook.get("status") or registry_item.get("status"),
            "lesson_count": int(textbook.get("lesson_count") or inventory.get("lesson_count") or 0),
            "lesson_key_prefix": f"{textbook_id}:",
            "lesson_root": lesson_root_rel,
            "manifest": relative(textbook_manifest_path),
            "source_inventory": relative(inventory_path),
            "offering_ids": offering_ids,
        }
        textbooks.append(textbook_record)

        for lesson in inventory.get("lessons", []):
            number = int(lesson["lesson_number"])
            lesson_id = f"lesson-{number:02d}"
            lesson_key = f"{textbook_id}:{lesson_id}"
            if lesson_key in seen_keys:
                raise ValueError(f"duplicate lesson_key: {lesson_key}")
            seen_keys.add(lesson_key)
            lesson_root = PROJECT_ROOT / lesson_root_rel / lesson_id
            source_path = lesson_root / "00-source/source-manifest.json"
            authority_path = lesson_root / "20-approved/lesson-manifest.json"
            source = read_json(source_path) if source_path.is_file() else None
            authority = read_json(authority_path) if authority_path.is_file() else None
            printed_start = lesson.get("printed_page_start")
            printed_end = lesson.get("printed_page_end_estimate")
            printed_pages = None
            if printed_start is not None and printed_end is not None:
                printed_pages = f"{printed_start}–{printed_end}"
            elif printed_start is not None:
                printed_pages = str(printed_start)
            record = {
                "lesson_key": lesson_key,
                "course_id": course["course_id"],
                "offering_ids": offering_ids,
                "textbook_id": textbook_id,
                "lesson_id": lesson_id,
                "lesson_number": number,
                "title": lesson.get("title") or f"第 {number} 课",
                "lesson_path": f"{lesson_root_rel}/{lesson_id}",
                "source_manifest": relative(source_path) if source_path.is_file() else None,
                "authority_manifest": relative(authority_path) if authority_path.is_file() else None,
                "source_inventory": relative(inventory_path),
                "printed_pages": printed_pages,
                "pdf_page": lesson.get("pdf_page"),
                "audio_count": len(lesson.get("audio", [])) or lesson.get("audio_count"),
                "status": lesson_status(lesson_root, source, authority),
            }
            lessons.append(record)

    lessons.sort(key=lambda item: (item["textbook_id"], item["lesson_number"]))
    textbooks.sort(key=lambda item: item["textbook_id"])
    payload = {
        "schema_version": 1,
        "registry_type": "textbook-scoped-lesson-registry",
        "lesson_key_format": "<textbook_id>:<lesson_id>",
        "generated_at": date.today().isoformat(),
        "generated_from": {
            "course_manifest": relative(COURSE_MANIFEST_PATH),
            "textbook_registry": relative(TEXTBOOK_REGISTRY_PATH),
            "offering_root": "course/offerings",
        },
        "textbooks": textbooks,
        "lessons": lessons,
    }
    OUTPUT_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return OUTPUT_PATH


if __name__ == "__main__":
    print(build())
