"""Pipeline core — steps 1-8 processing engine.

Parameterized by PipelineConfig to handle different lesson types
(pinyin, normal, etc.) through the same processing logic.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path

from .csv_writer import WriteResult, write_csv, write_database_csv
from .validator import PipelineConfig

logger = logging.getLogger(__name__)


def run_pipeline(
    config: PipelineConfig,
    content_items: list[dict],
    lesson_meta: dict,
    output_dir: Path,
    *,
    activities: list[dict] | None = None,
    game_suggestions: list[dict] | None = None,
    lesson_structure: list[dict] | None = None,
) -> dict:
    """Run VP steps 1-8 pipeline and produce all output files.

    Args:
        config: Validated pipeline configuration for the lesson type.
        content_items: Extracted content records (steps 3-4 output).
        lesson_meta: Dict with lesson_id, lesson_title, source_pdf keys.
        output_dir: Directory to write the 7 output files.
        activities: Optional pre-generated supplemental activities (step 6).
        game_suggestions: Optional pre-generated game suggestions (step 7).
        lesson_structure: Optional pre-generated lesson structure (step 5).

    Returns:
        Summary dict with file paths and statistics.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    generated_at = datetime.now(timezone.utc).isoformat(timespec="seconds")

    lesson_id = lesson_meta.get("lesson_id", "unknown")
    lesson_title = lesson_meta.get("lesson_title", "")
    source_pdf = lesson_meta.get("source_pdf", "")

    # Step 2: Lesson list
    lesson_list = [
        {
            "lesson_id": lesson_id,
            "lesson_title": lesson_title,
            "source_pdf": source_pdf,
            "lesson_type": config.lesson_type,
            "status": "draft_for_teacher_review",
        }
    ]

    # Step 5: Teaching structure (use provided or generate from config)
    if lesson_structure is None:
        lesson_structure = _generate_structure(config, content_items)

    # Step 6: Supplemental activities (use provided or empty)
    if activities is None:
        activities = []

    # Step 7: Game suggestions (use provided or empty)
    if game_suggestions is None:
        game_suggestions = []

    # Step 8: Database rows
    db_rows = _build_database_rows(
        config, content_items, lesson_meta, generated_at
    )

    # Write all output files
    write_csv(output_dir / "01_lesson_list.csv", lesson_list)
    write_csv(output_dir / "02_content_items.csv", content_items)
    write_csv(output_dir / "03_lesson_structure.csv", lesson_structure)
    write_csv(output_dir / "04_supplemental_activities.csv", activities)
    write_csv(output_dir / "05_game_suggestions.csv", game_suggestions)

    result: WriteResult = write_database_csv(
        output_dir / "06_google_sheets_database.csv", db_rows, config
    )

    # JSON package with metadata
    metadata = {
        "lesson_type": config.lesson_type,
        "pipeline_config_version": config.version,
        "generated_at": generated_at,
        "vp_scope": "steps 1-8 before teacher review",
        "steps_completed": [1, 2, 3, 4, 5, 6, 7, 8],
        "steps_not_implemented": list(range(9, 20)),
        "lesson_id": lesson_id,
        "source_pdf": source_pdf,
    }

    package = {
        "metadata": metadata,
        "lesson_list": lesson_list,
        "content_items": content_items,
        "lesson_structure": lesson_structure,
        "supplemental_activities": activities,
        "game_suggestions": game_suggestions,
        "google_sheets_database": db_rows,
    }

    json_filename = f"vp_{lesson_id.replace('-', '_')}_database.json"
    json_path = output_dir / json_filename
    json_path.write_text(
        json.dumps(package, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    # README
    readme_path = output_dir / "README.md"
    readme_path.write_text(
        _generate_readme(lesson_meta, config, generated_at), encoding="utf-8"
    )

    summary = {
        "output_dir": str(output_dir),
        "lesson_type": config.lesson_type,
        "rows_written": result.rows_written,
        "rows_excluded": result.rows_excluded,
        "activities": len(activities),
        "games": len(game_suggestions),
        "warnings": result.warnings,
    }

    logger.info("Pipeline complete: %s", json.dumps(summary, ensure_ascii=False))
    return summary


def _generate_structure(
    config: PipelineConfig, content_items: list[dict]
) -> list[dict]:
    """Generate lesson structure from config teaching sequence."""
    structure = []
    for module in config.teaching_sequence:
        # Find content items that belong to this module (by section matching)
        module_items = [
            item for item in content_items
            if _matches_module(item, module)
        ]
        item_ids = ",".join(item.get("id", item.get("record_id", "")) for item in module_items)
        pages = sorted(set(str(item.get("page", item.get("source_page", ""))) for item in module_items if item.get("page") or item.get("source_page")))

        structure.append({
            "order": module["order"],
            "module": module["label_vi"],
            "module_id": module["module_id"],
            "content_focus": "",
            "source_pages": "-".join(pages) if pages else "",
            "item_ids": item_ids,
        })
    return structure


def _matches_module(item: dict, module: dict) -> bool:
    """Check if a content item belongs to a teaching module (heuristic)."""
    # Simple heuristic: match by section name containing module label
    section = (item.get("section") or "").lower()
    label_vi = module.get("label_vi", "").lower()
    module_id = module.get("module_id", "").lower()
    return label_vi in section or module_id in section


def _build_database_rows(
    config: PipelineConfig,
    content_items: list[dict],
    lesson_meta: dict,
    generated_at: str,
) -> list[dict]:
    """Build database rows conforming to config.database_schema."""
    rows = []
    lesson_id = lesson_meta.get("lesson_id", "")
    lesson_title = lesson_meta.get("lesson_title", "")
    source_pdf = lesson_meta.get("source_pdf", "")

    # Column mapping from content_items keys to database_schema columns
    key_map = {
        "lesson_id": lambda item: lesson_id,
        "lesson_title": lambda item: lesson_title,
        "record_id": lambda item: item.get("id", item.get("record_id", "")),
        "record_type": lambda item: item.get("type", item.get("record_type", "")),
        "section": lambda item: item.get("section", ""),
        "source_pdf": lambda item: source_pdf,
        "source_page": lambda item: item.get("page", item.get("source_page", "")),
        "source_page_range": lambda item: str(item.get("page", item.get("source_page_range", ""))),
        "teaching_order": lambda item: item.get("seq", item.get("teaching_order", "")),
        "chinese_simplified": lambda item: item.get("zh", item.get("chinese_simplified", "")),
        "pinyin": lambda item: item.get("pinyin", ""),
        "vietnamese": lambda item: item.get("vi", item.get("vietnamese", "")),
        "word_type_vi": lambda item: item.get("pos", item.get("word_type_vi", "")),
        "raw_source_text": lambda item: item.get("raw", item.get("raw_source_text", "")),
        "classroom_visibility": lambda item: _get_visibility(item),
        "teacher_review_status": lambda item: "pending_review",
        "approved": lambda item: "",
        "notes_for_review": lambda item: "",
        "generated_at": lambda item: generated_at,
    }

    for item in content_items:
        row = {}
        for col in config.database_schema:
            if col in key_map:
                row[col] = key_map[col](item)
            else:
                row[col] = item.get(col, "")
        # Ensure record_type uses the normalized key
        if "record_type" in row and not row["record_type"]:
            row["record_type"] = item.get("type", "")
        rows.append(row)

    return rows


def _get_visibility(item: dict) -> str:
    """Determine classroom visibility for a content item."""
    record_type = item.get("type", item.get("record_type", ""))
    if record_type in ("appendix",):
        return "optional_student_visible"
    return item.get("classroom_visibility", "student_visible")


def _generate_readme(
    lesson_meta: dict, config: PipelineConfig, generated_at: str
) -> str:
    """Generate a README.md for the output directory."""
    lesson_id = lesson_meta.get("lesson_id", "unknown")
    lesson_title = lesson_meta.get("lesson_title", "")
    source_pdf = lesson_meta.get("source_pdf", "")

    return f"""# VP 教材資料庫 · {lesson_title}

Scope: VP 製作流程 steps 1–8 only. This output stops before teacher review.

Lesson type: `{config.lesson_type}` (config version {config.version})
Source PDF: `{source_pdf}`
Generated: {generated_at}

## Generated files

- `01_lesson_list.csv` — step 2 lesson list
- `02_content_items.csv` — steps 3–4 extraction + page mapping
- `03_lesson_structure.csv` — step 5 teaching restructure
- `04_supplemental_activities.csv` — step 6 activities
- `05_game_suggestions.csv` — step 7 game markers
- `06_google_sheets_database.csv` — step 8 Google Sheets-ready database
- `vp_{lesson_id.replace('-', '_')}_database.json` — full machine-readable package

## Pipeline config

Teaching sequence ({len(config.teaching_sequence)} modules):
{chr(10).join(f"  {m['order']}. {m['label_vi']}" for m in config.teaching_sequence)}
"""
