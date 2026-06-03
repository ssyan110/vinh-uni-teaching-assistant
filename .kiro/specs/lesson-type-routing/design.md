# Design Document

## Overview

This design introduces a lesson-type routing layer between the pipeline entry point and the processing steps. Instead of a single hardcoded pipeline, the system loads a declarative configuration file per lesson type, which controls the teaching sequence, database schema, valid record types, and supplemental activity types. The router, configs, and pipeline core are all Python modules under `scripts/pipeline/`.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│  CLI Entry Point (scripts/run_pipeline.py)                  │
│  Accepts: --lesson-type, --source-pdf, --output-dir         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Router (scripts/pipeline/router.py)                        │
│  - Resolves lesson_type (explicit / auto-detect)            │
│  - Loads Pipeline_Config from registry                      │
│  - Validates config schema                                  │
│  - Dispatches to Pipeline Core                              │
└────────────────────────┬────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ normal.json  │ │ pinyin.json  │ │ future.json  │
│ (registry)   │ │ (registry)   │ │ (registry)   │
└──────────────┘ └──────────────┘ └──────────────┘
          │              │              │
          └──────────────┼──────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Pipeline Core (scripts/pipeline/core.py)                   │
│  - Steps 1-8 logic, parameterized by Pipeline_Config        │
│  - CSV writer uses config.database_schema for columns       │
│  - Structure builder uses config.teaching_sequence          │
│  - Activity generator uses config.supplemental_activity_types│
│  - JSON packager includes metadata.lesson_type              │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Output (output/vp-database/{lesson-id}/)                   │
│  02_content_items.csv                                       │
│  03_lesson_structure.csv                                    │
│  04_supplemental_activities.csv                             │
│  05_game_suggestions.csv                                    │
│  06_google_sheets_database.csv                              │
│  vp_{textbook}_{lesson}_database.json                       │
│                                                             │
│  Book-level: output/book-{N}/lesson_list.csv                │
└─────────────────────────────────────────────────────────────┘
```

### Directory Layout

```
scripts/
├── pipeline/
│   ├── __init__.py
│   ├── router.py          # Lesson type resolution + config loading
│   ├── core.py            # Steps 1-8 processing engine
│   ├── validator.py       # Config schema validation
│   ├── detector.py        # Auto-detection heuristic
│   ├── csv_writer.py      # Schema-driven CSV output
│   └── configs/
│       ├── _schema.json   # JSON Schema for pipeline configs
│       ├── normal.json    # Normal lesson config
│       └── pinyin.json    # Pinyin lesson config
├── run_pipeline.py        # CLI entry point (replaces per-lesson scripts)
├── create-teacher-deck.mjs
├── create-pinyin-l1-design-prototype.mjs
└── validate-system.mjs
```

## Data Models

### Pipeline_Config JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["lesson_type", "version", "teaching_sequence", "database_schema", "valid_record_types", "supplemental_activity_types", "exercise_categories"],
  "properties": {
    "lesson_type": { "type": "string", "pattern": "^[a-z][a-z0-9_-]*$" },
    "version": { "type": "string" },
    "teaching_sequence": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["order", "module_id", "label_vi"],
        "properties": {
          "order": { "type": "integer", "minimum": 1 },
          "module_id": { "type": "string" },
          "label_vi": { "type": "string" },
          "label_zh": { "type": "string" },
          "optional": { "type": "boolean", "default": false }
        }
      }
    },
    "database_schema": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 6
    },
    "mandatory_columns": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Columns that must be present in every config for downstream compatibility"
    },
    "valid_record_types": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 1
    },
    "supplemental_activity_types": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 1
    },
    "exercise_categories": {
      "type": "array",
      "items": { "type": "string" }
    },
    "review_statuses": {
      "type": "array",
      "items": { "type": "string" },
      "default": ["pending_review", "approved", "revise", "rejected"]
    },
    "visibility_values": {
      "type": "array",
      "items": { "type": "string" },
      "default": ["student_visible", "teacher_only", "optional_student_visible"]
    }
  }
}
```

### normal.json (abbreviated)

```json
{
  "lesson_type": "regular",
  "version": "1.0.0",
  "teaching_sequence": [
    {"order": 1, "module_id": "warmup", "label_vi": "Khởi động", "label_zh": "暖身活動"},
    {"order": 2, "module_id": "objectives", "label_vi": "Mục tiêu học tập", "label_zh": "學習目標"},
    {"order": 3, "module_id": "pinyin", "label_vi": "Pinyin", "label_zh": "拼音"},
    {"order": 4, "module_id": "pinyin_practice", "label_vi": "Luyện pinyin", "label_zh": "拼音練習"},
    {"order": 5, "module_id": "vocabulary", "label_vi": "Từ vựng", "label_zh": "生詞"},
    {"order": 6, "module_id": "vocabulary_practice", "label_vi": "Luyện từ vựng", "label_zh": "生詞練習"},
    {"order": 7, "module_id": "grammar", "label_vi": "Ngữ pháp", "label_zh": "語法"},
    {"order": 8, "module_id": "grammar_practice", "label_vi": "Luyện ngữ pháp", "label_zh": "語法練習"},
    {"order": 9, "module_id": "text_preview", "label_vi": "Chuẩn bị đọc bài", "label_zh": "課文預習"},
    {"order": 10, "module_id": "text", "label_vi": "Bài khóa", "label_zh": "課文"},
    {"order": 11, "module_id": "culture", "label_vi": "Văn hóa bổ sung", "label_zh": "文化補充"},
    {"order": 12, "module_id": "discussion", "label_vi": "Thảo luận", "label_zh": "課程討論"},
    {"order": 13, "module_id": "homework_intro", "label_vi": "Hướng dẫn bài tập", "label_zh": "課後作業說明"}
  ],
  "database_schema": [
    "lesson_id", "lesson_title", "record_id", "record_type", "section",
    "source_pdf", "source_page", "source_page_range", "teaching_order",
    "chinese_simplified", "pinyin", "vietnamese", "word_type_vi",
    "raw_source_text", "classroom_visibility", "teacher_review_status",
    "approved", "notes_for_review", "generated_at"
  ],
  "valid_record_types": [
    "vocabulary", "grammar", "text", "exercise", "pinyin_table",
    "concept", "outline", "initials", "finals", "spelling_rule", "tone", "appendix"
  ],
  "supplemental_activity_types": [
    "warmup", "pinyin_drill", "vocabulary_drill", "grammar_drill",
    "text_preview", "culture_supplement", "discussion", "assessment"
  ],
  "exercise_categories": [
    "tone_discrimination", "pinyin_reading", "vocabulary_matching",
    "grammar_fill", "sentence_ordering", "text_comprehension",
    "translation", "hanzi_recognition"
  ]
}
```

### pinyin.json (abbreviated)

```json
{
  "lesson_type": "pinyin",
  "version": "1.0.0",
  "teaching_sequence": [
    {"order": 1, "module_id": "warmup", "label_vi": "Khởi động", "label_zh": "暖身"},
    {"order": 2, "module_id": "concepts", "label_vi": "Khái niệm nền tảng", "label_zh": "基礎概念"},
    {"order": 3, "module_id": "initials_finals", "label_vi": "Thanh mẫu + Vận mẫu", "label_zh": "聲母+韻母"},
    {"order": 4, "module_id": "spelling_rules", "label_vi": "Quy tắc viết pinyin", "label_zh": "拼寫規則"},
    {"order": 5, "module_id": "tones", "label_vi": "Thanh điệu", "label_zh": "聲調"},
    {"order": 6, "module_id": "applied_vocab", "label_vi": "Từ vựng ứng dụng", "label_zh": "應用詞彙"},
    {"order": 7, "module_id": "assessment", "label_vi": "Kiểm tra cuối bài", "label_zh": "課末測試"},
    {"order": 8, "module_id": "appendix", "label_vi": "Phụ lục tùy chọn", "label_zh": "附錄", "optional": true}
  ],
  "database_schema": [
    "lesson_id", "lesson_title", "record_id", "record_type", "section",
    "source_pdf", "source_page", "source_page_range", "teaching_order",
    "chinese_simplified", "pinyin", "vietnamese",
    "raw_source_text", "classroom_visibility", "teacher_review_status",
    "approved", "notes_for_review", "generated_at"
  ],
  "valid_record_types": [
    "concept", "initials", "finals", "tone", "spelling_rule",
    "pinyin_table", "vocabulary_example", "exercise", "appendix"
  ],
  "supplemental_activity_types": [
    "warmup", "pinyin_drill", "tone_drill", "pronunciation_drill",
    "assessment", "culture_tech"
  ],
  "exercise_categories": [
    "tone_discrimination", "pinyin_reading", "pinyin_writing",
    "initial_final_matching", "spelling_rule_application"
  ]
}
```

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| JSON over YAML for configs | No extra dependency; Python `json` is stdlib. YAML can be added later if needed. |
| Config registry is a directory scan | Adding a new lesson type = dropping a JSON file. No code changes needed. |
| Single `run_pipeline.py` replaces per-lesson scripts | The old `create-vp-pinyin-l1-database.py` hardcodes data. The new entry point is generic and loads content from extraction files. |
| `database_schema` is an ordered list of column names | CSV column order matches config order. Simple, predictable. |
| Teaching sequence uses `module_id` + `label_vi` + `label_zh` | Supports both Vietnamese UI labels and Chinese reference labels. `module_id` is the stable key for code. |
| Validator uses JSON Schema | Machine-readable, can be used by other tools. `jsonschema` is a lightweight pip dependency. |
| Auto-detection is a separate module | Keeps the router simple. Detection logic can evolve independently. |
| Existing pinyin L1 script becomes a data fixture | The hardcoded content in `create-vp-pinyin-l1-database.py` becomes test data / migration reference. The new pipeline reads from extraction files. |

## Interface Definitions

### CLI Interface (`run_pipeline.py`)

```
python scripts/run_pipeline.py \
  --lesson-type pinyin \
  --source-pdf work/pdf-pages/ \
  --lesson-id pinyin-l1 \
  --lesson-title "Pinyin · Bài 1" \
  --output-dir output/vp-database/pinyin-l1/ \
  --content-file work/design-ref-pinyin-l1/extract.json
```

Arguments:
- `--lesson-type`: `regular`, `pinyin`, or `auto` (triggers detection). Default: `regular`.
- `--source-pdf`: Path to source PDF or page images directory.
- `--lesson-id`: Identifier for the lesson (e.g., `pinyin-l1`, `lesson-01`).
- `--lesson-title`: Human-readable title.
- `--output-dir`: Where to write the 7 output files.
- `--content-file`: JSON file with extracted content items (replaces hardcoded data).

### Router API (internal)

```python
class Router:
    def __init__(self, config_dir: Path):
        """Scan config_dir for *.json pipeline configs."""

    def available_types(self) -> list[str]:
        """Return all valid lesson type identifiers."""

    def resolve(self, lesson_type: str, content: list[dict] | None = None) -> PipelineConfig:
        """
        Resolve lesson_type to a validated PipelineConfig.
        If lesson_type == 'auto', run detection on content.
        Raises InvalidLessonType or ConfigValidationError.
        """
```

### PipelineConfig dataclass

```python
@dataclass
class PipelineConfig:
    lesson_type: str
    version: str
    teaching_sequence: list[ModuleSpec]
    database_schema: list[str]
    valid_record_types: list[str]
    supplemental_activity_types: list[str]
    exercise_categories: list[str]
    review_statuses: list[str]
    visibility_values: list[str]
```

### CSV Writer API

```python
def write_database_csv(
    path: Path,
    records: list[dict],
    config: PipelineConfig,
) -> WriteResult:
    """
    Write records to CSV using only config.database_schema columns.
    Validates record_type against config.valid_record_types.
    Returns WriteResult with row count and any warnings.
    """
```

## Migration Strategy

1. The existing `create-vp-pinyin-l1-database.py` stays as-is for now (it still works).
2. The new `run_pipeline.py` is built alongside it.
3. Once the new pipeline produces identical output for pinyin-l1, the old script is deprecated.
4. The `package.json` script `vp:pinyin:l1` is updated to call the new entry point.

## Components and Interfaces

| Component | File | Responsibility |
|-----------|------|---------------|
| Router | `scripts/pipeline/router.py` | Resolves lesson_type, loads config, dispatches to core |
| Validator | `scripts/pipeline/validator.py` | Validates Pipeline_Config JSON against schema |
| Detector | `scripts/pipeline/detector.py` | Auto-detects lesson type from content markers |
| CSV Writer | `scripts/pipeline/csv_writer.py` | Schema-driven CSV output with record_type validation |
| Pipeline Core | `scripts/pipeline/core.py` | Steps 1-8 processing engine, parameterized by config |
| CLI | `scripts/run_pipeline.py` | Argparse entry point, user interaction for auto mode |
| Config Registry | `scripts/pipeline/configs/*.json` | Declarative pipeline configurations |

### Inter-component interfaces

- **CLI → Router**: `Router.resolve(lesson_type, content)` returns `PipelineConfig`
- **Router → Validator**: `validate_config(path)` returns `PipelineConfig` or raises
- **Router → Detector**: `detect_lesson_type(content_items)` returns `DetectionResult`
- **CLI → Core**: `run_pipeline(config, content, lesson_meta, output_dir)`
- **Core → CSV Writer**: `write_database_csv(path, records, config)` returns `WriteResult`

## Correctness Properties

Property 1: Every config in the registry passes JSON Schema validation before being routable.
**Validates: Requirement 9.1**

Property 2: Output CSV always has exactly the columns defined in the active config, in order.
**Validates: Requirement 6.1**

Property 3: No record with an invalid record_type appears in output CSV.
**Validates: Requirement 6.3**

Property 4: Every record in every lesson type has a non-empty `source_page` value.
**Validates: Requirement 7.3**

Property 5: All lesson types produce the same 7-file output structure with shared review columns.
**Validates: Requirement 7.1**

Property 6: Running the pipeline twice with the same input produces identical output (except `generated_at` timestamp).
**Validates: Requirement 10.1**

## Error Handling

| Error condition | Behavior |
|----------------|----------|
| Unknown lesson_type | Raise `InvalidLessonType` with list of valid types |
| Missing config file | Raise `ConfigNotFound` with lesson_type and registry path |
| Malformed config JSON | Raise `ConfigValidationError` with file path and parse/validation details |
| Invalid record_type in data | Log warning, exclude record, continue processing |
| All records excluded | Produce header-only CSV, log warning, set exit code 1 |
| Auto-detection ambiguous | Default to 'normal' with low confidence flag |
| Content file not found | Raise `FileNotFoundError` with path |

## Testing Strategy

| Level | What | How |
|-------|------|-----|
| Unit | Validator rejects bad configs | Pytest with malformed JSON fixtures |
| Unit | Router resolves types correctly | Pytest with mock config directory |
| Unit | Detector identifies pinyin vs normal | Pytest with sample content_items |
| Unit | CSV Writer enforces schema | Pytest with records containing invalid types |
| Integration | Full pipeline produces correct output | Run pinyin-l1 through new pipeline, diff against existing output |
| Regression | Old script output matches new | Byte-level comparison of CSV/JSON output |

## Dependencies

- Python 3.10+ (already in `.venv/`)
- `jsonschema` package (new, for config validation)
- No Node.js changes needed for this feature
