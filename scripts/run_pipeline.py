#!/usr/bin/env python3
"""CLI entry point for the AI teaching material pipeline.

Replaces per-lesson scripts with a generic, config-driven pipeline runner.
Supports explicit lesson type, auto-detection, and interactive confirmation.

Usage:
    python scripts/run_pipeline.py \
        --lesson-type pinyin \
        --source-pdf work/pdf-pages/ \
        --lesson-id pinyin-l1 \
        --lesson-title "Pinyin · Bài 1" \
        --output-dir output/vp-database/pinyin-l1/ \
        --content-file work/design-ref-pinyin-l1/extract.json
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

# Add project root to path so pipeline package is importable
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "scripts"))

from pipeline.core import run_pipeline
from pipeline.detector import detect_lesson_type
from pipeline.router import InvalidLessonType, Router

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s: %(message)s",
)
logger = logging.getLogger(__name__)

CONFIG_DIR = PROJECT_ROOT / "scripts" / "pipeline" / "configs"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Run VP steps 1-8 pipeline for a lesson.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--lesson-type",
        default="regular",
        help="Lesson type: regular, pinyin, or auto (default: regular)",
    )
    parser.add_argument(
        "--source-pdf",
        required=True,
        help="Path to source PDF or page images directory",
    )
    parser.add_argument(
        "--lesson-id",
        required=True,
        help="Lesson identifier (e.g., pinyin-l1, lesson-01)",
    )
    parser.add_argument(
        "--lesson-title",
        required=True,
        help="Human-readable lesson title",
    )
    parser.add_argument(
        "--output-dir",
        required=True,
        help="Output directory for the 7 pipeline files",
    )
    parser.add_argument(
        "--content-file",
        required=True,
        help="JSON file with extracted content items",
    )
    parser.add_argument(
        "--yes", "-y",
        action="store_true",
        help="Skip confirmation prompts (accept auto-detection)",
    )

    args = parser.parse_args()

    # Load content file
    content_path = Path(args.content_file)
    if not content_path.exists():
        logger.error("Content file not found: %s", content_path)
        return 1

    try:
        content_data = json.loads(content_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        logger.error("Invalid JSON in content file: %s", exc)
        return 1

    # Support both flat list and structured format
    if isinstance(content_data, list):
        content_items = content_data
        activities = None
        game_suggestions = None
        lesson_structure = None
    elif isinstance(content_data, dict):
        content_items = content_data.get("content_items", [])
        activities = content_data.get("supplemental_activities")
        game_suggestions = content_data.get("game_suggestions")
        lesson_structure = content_data.get("lesson_structure")
    else:
        logger.error("Content file must be a JSON array or object")
        return 1

    if not content_items:
        logger.error("No content items found in %s", content_path)
        return 1

    # Initialize router
    router = Router(CONFIG_DIR)
    available = router.available_types()
    if not available:
        logger.error("No valid pipeline configs found in %s", CONFIG_DIR)
        return 1

    # Resolve lesson type
    lesson_type = args.lesson_type

    if lesson_type.lower() == "auto":
        result = detect_lesson_type(content_items)
        print(f"\n  Auto-detected lesson type: {result.suggested_type}")
        print(f"  Confidence: {result.confidence}")
        print(f"  Markers found: {', '.join(result.markers_found)}")
        print(f"  Available types: {', '.join(available)}\n")

        if not args.yes:
            response = input(
                f"  Use '{result.suggested_type}'? [Y/n/type]: "
            ).strip()
            if response.lower() in ("", "y", "yes"):
                lesson_type = result.suggested_type
            elif response.lower() in ("n", "no"):
                lesson_type = input("  Enter lesson type: ").strip()
            else:
                lesson_type = response
        else:
            lesson_type = result.suggested_type
            print(f"  Auto-accepted: {lesson_type}")

    try:
        config = router.resolve(lesson_type, content_items)
    except InvalidLessonType as exc:
        logger.error("%s", exc.message)
        return 1

    # Build lesson metadata
    lesson_meta = {
        "lesson_id": args.lesson_id,
        "lesson_title": args.lesson_title,
        "source_pdf": args.source_pdf,
    }

    output_dir = Path(args.output_dir)

    print(f"\n  Running pipeline:")
    print(f"    Lesson type: {config.lesson_type}")
    print(f"    Config version: {config.version}")
    print(f"    Teaching modules: {len(config.teaching_sequence)}")
    print(f"    Content items: {len(content_items)}")
    print(f"    Output: {output_dir}\n")

    # Run pipeline
    summary = run_pipeline(
        config=config,
        content_items=content_items,
        lesson_meta=lesson_meta,
        output_dir=output_dir,
        activities=activities,
        game_suggestions=game_suggestions,
        lesson_structure=lesson_structure,
    )

    print(f"  Done!")
    print(f"    Rows written: {summary['rows_written']}")
    print(f"    Rows excluded: {summary['rows_excluded']}")
    print(f"    Activities: {summary['activities']}")
    print(f"    Games: {summary['games']}")

    if summary["warnings"]:
        print(f"    Warnings: {len(summary['warnings'])}")
        for w in summary["warnings"]:
            print(f"      - {w}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
