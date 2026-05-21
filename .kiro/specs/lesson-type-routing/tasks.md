# Implementation Plan: Lesson Type Routing

## Overview

Build a lesson-type routing system that loads declarative pipeline configurations (JSON) per lesson type, enabling pinyin lessons and regular lessons to follow different teaching sequences, schemas, and activity types while producing compatible output for the shared downstream workflow.

## Tasks

- [x] 1. Create pipeline package structure and config schema: Create `scripts/pipeline/__init__.py`, `scripts/pipeline/configs/` directory, `scripts/pipeline/configs/_schema.json` with JSON Schema for Pipeline_Config validation, and add `jsonschema` to .venv dependencies. Requirements: R3, R9.
- [x] 2. Create regular.json pipeline configuration: Create `scripts/pipeline/configs/regular.json` with 13-module teaching sequence, full 20-column database_schema (including word_type_vi), all valid_record_types, supplemental_activity_types, exercise_categories, review_statuses, and visibility_values. Validate against _schema.json. Requirements: R4.
- [x] 3. Create pinyin.json pipeline configuration: Create `scripts/pipeline/configs/pinyin.json` with 8-module teaching sequence, 19-column database_schema (no word_type_vi), pinyin-specific valid_record_types (concept, initials, finals, tone, spelling_rule, pinyin_table, vocabulary_example, exercise, appendix), and pinyin-specific supplemental_activity_types (warmup, pinyin_drill, tone_drill, pronunciation_drill, assessment, culture_tech). Validate against _schema.json. Requirements: R5.
- [x] 4. Implement config validator: Create `scripts/pipeline/validator.py` with `validate_config(config_path)` that loads JSON, validates against _schema.json, checks mandatory shared columns (lesson_id, record_id, record_type, source_page, source_page_range, teacher_review_status, approved), checks non-empty arrays, and returns clear error messages. Test with both configs. Requirements: R9.
- [x] 5. Implement router: Create `scripts/pipeline/router.py` with Router class that scans config directory, validates configs, resolves lesson_type with case-insensitive matching, defaults to 'normal' when empty, delegates 'auto' to detector, raises InvalidLessonType with valid types list, and skips invalid configs with logged warning. Requirements: R1, R3, R8.
- [x] 6. Implement auto-detection heuristic: Create `scripts/pipeline/detector.py` with `detect_lesson_type(content_items)` that checks for pinyin markers (initials/finals/tone/spelling_rule record types without text/grammar) vs normal markers (vocabulary/grammar/text), returns DetectionResult with suggested_type, confidence, and markers_found. Defaults to 'normal' with low confidence if ambiguous. Requirements: R2.
- [x] 7. Implement schema-driven CSV writer: Create `scripts/pipeline/csv_writer.py` with `write_database_csv(path, records, config)` that outputs only config.database_schema columns in order, validates record_type against config.valid_record_types, excludes invalid records with warning, writes empty string for missing values, and handles all-excluded edge case. Requirements: R6.
- [x] 8. Implement pipeline core: Create `scripts/pipeline/core.py` with `run_pipeline(config, content, lesson_meta, output_dir)` that generates all 7 output files, assigns teaching_order based on config.teaching_sequence + source page order, and includes lesson_type, pipeline_config_version, and generated_at in JSON metadata. Requirements: R6, R7, R10.
- [x] 9. Create CLI entry point: Create `scripts/run_pipeline.py` with argparse accepting --lesson-type, --source-pdf, --lesson-id, --lesson-title, --output-dir, --content-file. Wire Router → resolve → core.run_pipeline. For 'auto' mode, print detection result and prompt for confirmation. Update package.json with `vp:run` script. Requirements: R1, R2.
- [x] 10. Migrate pinyin-l1 data to content file format: Extract content_items, lesson_list, activities, and game_suggestions from `create-vp-pinyin-l1-database.py` into `work/design-ref-pinyin-l1/extract.json`. Verify new pipeline produces identical output. Update package.json `vp:pinyin:l1` to use new entry point. Mark old script as deprecated. Requirements: R4, R5, R7.
- [x] 11. Output validation and integration test: Write validation that checks all 7 output files exist, verifies CSV columns match config, verifies JSON metadata contains lesson_type and pipeline_config_version, verifies source_page in every record, runs both configs, and updates validate-system.mjs to check for pipeline configs. Requirements: R7, R9, R10.

## Task Dependency Graph

```json
{
  "waves": [
    {"id": "wave1", "tasks": [1], "description": "Package structure and schema"},
    {"id": "wave2", "tasks": [2, 3, 4], "description": "Configs and validator"},
    {"id": "wave3", "tasks": [5, 6, 7], "description": "Router, detector, CSV writer"},
    {"id": "wave4", "tasks": [8], "description": "Pipeline core integration"},
    {"id": "wave5", "tasks": [9], "description": "CLI entry point"},
    {"id": "wave6", "tasks": [10, 11], "description": "Migration and validation"}
  ]
}
```

## Notes

- Tasks 1-3 can be done in parallel after task 1 creates the directory structure.
- Tasks 4-7 are independent modules that can be developed in parallel.
- Task 8 integrates everything and depends on 5 + 7.
- Task 10 is the migration step that proves the new system matches the old output.
- The existing `create-vp-pinyin-l1-database.py` continues to work during development; it's only deprecated after task 10 passes.
