# Requirements Document

## Introduction

The AI teaching-material production system currently uses a single pipeline (steps 1–8) designed for normal Chinese lessons containing text/dialogue, vocabulary, grammar, and exercises. However, the textbook includes pinyin-only lessons (e.g., "Pinyin Bài 1") that are structurally different: they teach pinyin as primary content, have no main text/dialogue, no traditional vocabulary, and no grammar points.

This feature introduces a lesson-type routing system that detects or accepts a lesson type declaration, routes to the appropriate pipeline (with the correct teaching sequence, database schema, and generation rules), and produces output compatible with the shared downstream workflow (Google Sheets review → Huashu Design → Formative).

## Glossary

- **Router**: The component that determines lesson type and dispatches processing to the correct pipeline configuration.
- **Lesson_Type**: A classification label (e.g., `regular`, `pinyin`) that determines which pipeline configuration applies to a given lesson.
- **Pipeline_Config**: A named set of rules defining the teaching sequence, database schema columns, content extraction steps, supplemental activity types, and exercise categories for a specific lesson type.
- **Regular_Lesson**: A lesson containing text/dialogue, vocabulary, grammar, and exercises, following the standard 13-module teaching sequence.
- **Pinyin_Lesson**: A lesson teaching pinyin as primary content (initials, finals, tones, spelling rules), with no main text/dialogue, no traditional vocabulary section, and no grammar points.
- **Teaching_Sequence**: The ordered list of modules that defines how extracted content is restructured for classroom delivery.
- **Database_Schema**: The set of columns and record types used in the Google Sheets-ready CSV output for a given lesson type.
- **Downstream_Workflow**: The shared post-pipeline process: Google Sheets teacher review → Huashu Design deck generation → Formative student materials.

## Requirements

### Requirement 1: Lesson Type Declaration

**User Story:** As a pipeline operator, I want to specify the lesson type when initiating processing, so that the system uses the correct pipeline configuration.

#### Acceptance Criteria

1. WHEN a lesson is submitted for processing with an explicit `lesson_type` parameter, THE Router SHALL use the specified lesson type to select and apply the corresponding Pipeline_Config for that lesson's processing run.
2. WHEN a lesson is submitted without a `lesson_type` parameter or with an empty string value, THE Router SHALL default to `regular` as the Lesson_Type.
3. IF an unrecognized `lesson_type` value is provided, THEN THE Router SHALL reject the submission and return an error message listing all valid lesson types.
4. THE Router SHALL support at minimum two Lesson_Type values: `regular` and `pinyin`.
5. WHEN matching the `lesson_type` parameter value, THE Router SHALL perform case-insensitive comparison against valid lesson type identifiers.

### Requirement 2: Lesson Type Detection Heuristic

**User Story:** As a pipeline operator, I want the system to suggest a lesson type based on source content, so that I can confirm or override the suggestion before processing begins.

#### Acceptance Criteria

1. WHEN a lesson is submitted with `lesson_type` set to `auto`, THE Router SHALL analyze the extracted content and produce a Lesson_Type suggestion within 30 seconds.
2. WHEN the source content contains initials/finals tables, tone diagrams, or spelling rules AND does not contain a main text/dialogue section, THE Router SHALL suggest `pinyin` as the Lesson_Type.
3. WHEN the source content contains vocabulary lists, grammar points, and a main text/dialogue section, THE Router SHALL suggest `regular` as the Lesson_Type.
4. IF the source content does not match the criteria for either `pinyin` or `regular`, THEN THE Router SHALL suggest `regular` as the default Lesson_Type and include a flag indicating low detection confidence.
5. WHEN auto-detection produces a suggestion, THE Router SHALL present the suggested Lesson_Type, the detection confidence level, and a list of the content markers found to the operator for confirmation before proceeding.
6. IF the operator overrides the suggestion, THEN THE Router SHALL use the operator-specified Lesson_Type.
7. WHILE the Router is awaiting operator confirmation, THE Router SHALL not proceed to subsequent pipeline steps for that lesson.

### Requirement 3: Pipeline Configuration Registry

**User Story:** As a system maintainer, I want pipeline configurations stored as declarative data files, so that adding a new lesson type does not require modifying core pipeline code.

#### Acceptance Criteria

1. THE Pipeline_Config Registry SHALL store each lesson type's configuration as a separate JSON or YAML file, with one file per lesson type.
2. WHEN the Router selects a Lesson_Type, THE Router SHALL load the corresponding Pipeline_Config from the registry by matching the lesson type identifier to a config filename.
3. THE Pipeline_Config for each lesson type SHALL define the following required fields: teaching sequence (ordered list of module names), database schema columns (list of column definitions), valid record types (list of accepted type identifiers), supplemental activity types (list of activity identifiers), and exercise categories (list of category identifiers).
4. IF a Pipeline_Config file is missing, THEN THE Router SHALL reject processing and return an error message indicating the requested lesson type identifier and that no configuration file was found.
5. IF a Pipeline_Config file cannot be parsed or is missing any of the required fields defined in criterion 3, THEN THE Router SHALL reject processing and return an error message indicating the file path, the nature of the failure (parse error or missing field name), and the lesson type identifier.
6. WHEN the system starts, THE Pipeline_Config Registry SHALL discover all available lesson types by scanning the registry directory for valid configuration files, making each discovered type available for routing without code changes.
7. IF a Pipeline_Config file contains a field value that references an identifier not recognized by the system (unknown module name, activity type, or exercise category), THEN THE Router SHALL reject processing and return an error message indicating the unrecognized value and the field in which it appears.

### Requirement 4: Normal Lesson Pipeline Configuration

**User Story:** As a pipeline operator, I want the existing standard lesson pipeline preserved as the `regular` configuration, so that current lessons continue to process correctly.

#### Acceptance Criteria

1. THE Pipeline_Config for `regular` SHALL define the teaching sequence as the following 13 modules in exact order: 暖身活動 → 學習目標 → 拼音 → 拼音練習 → 生詞 → 生詞練習 → 語法 → 語法練習 → 課文預習 → 課文 → 文化補充 → 課程討論 → 課後作業說明.
2. THE Pipeline_Config for `regular` SHALL define the database schema with exactly the following columns: `lesson_id`, `lesson_title`, `record_id`, `record_type`, `section`, `source_pdf`, `source_page`, `source_page_range`, `teaching_order`, `chinese_simplified`, `pinyin`, `vietnamese`, `word_type_vi`, `raw_source_text`, `classroom_visibility`, `teacher_review_status`, `approved`, `notes_for_review`, `generated_at`.
3. THE Pipeline_Config for `regular` SHALL define the set of valid record types as: `vocabulary`, `grammar`, `text`, `exercise`, `pinyin_table`, `concept`, `outline`, `initials`, `finals`, `spelling_rule`, `tone`, `appendix`.
4. THE Pipeline_Config for `regular` SHALL define the set of valid supplemental activity types as: `warmup`, `pinyin_drill`, `vocabulary_drill`, `grammar_drill`, `text_preview`, `culture_supplement`, `discussion`, `assessment`.
5. THE Pipeline_Config for `regular` SHALL define valid values for `teacher_review_status` as: `pending_review`, `approved`, `revise`, `rejected`; and valid values for `classroom_visibility` as: `student_visible`, `teacher_only`.
6. WHEN a content record is assigned a `teaching_order` value, THE Pipeline_Config for `regular` SHALL assign sequential integers starting from 1, ordered according to the teaching sequence defined in criterion 1 and the source page order within each module.

### Requirement 5: Pinyin Lesson Pipeline Configuration

**User Story:** As a pipeline operator, I want a dedicated pinyin lesson configuration, so that pinyin-only lessons produce a database with relevant sections and no empty/irrelevant fields.

#### Acceptance Criteria

1. THE Pipeline_Config for `pinyin` SHALL define the teaching sequence as exactly 8 ordered steps: Khởi động → Khái niệm nền tảng → Thanh mẫu + Vận mẫu → Quy tắc viết pinyin → Thanh điệu → Từ vựng ứng dụng → Kiểm tra cuối bài → Phụ lục tùy chọn.
2. THE Pipeline_Config for `pinyin` SHALL define the database schema as exactly these columns in order: `lesson_id`, `lesson_title`, `record_id`, `record_type`, `section`, `source_pdf`, `source_page`, `source_page_range`, `teaching_order`, `chinese_simplified`, `pinyin`, `vietnamese`, `raw_source_text`, `classroom_visibility`, `teacher_review_status`, `approved`, `notes_for_review`, `generated_at`.
3. THE Pipeline_Config for `pinyin` SHALL NOT include the `word_type_vi` column in its database schema, because pinyin lessons do not classify items by traditional word type.
4. THE Pipeline_Config for `pinyin` SHALL define the complete set of valid record types as: `concept`, `initials`, `finals`, `tone`, `spelling_rule`, `pinyin_table`, `vocabulary_example`, `exercise`, `appendix`. No other record types are permitted.
5. THE Pipeline_Config for `pinyin` SHALL define the complete set of supplemental activity types as: `warmup`, `pinyin_drill`, `tone_drill`, `pronunciation_drill`, `assessment`, `culture_tech`. No other activity types are permitted.
6. THE Pipeline_Config for `pinyin` SHALL NOT include `grammar_drill`, `text_preview`, or `vocabulary_drill` as supplemental activity types.
7. IF a database column has no applicable value for a given record, THEN THE Pipeline_Config for `pinyin` SHALL output an empty string for that column rather than omitting the column or inserting a placeholder value.

### Requirement 6: Schema-Driven CSV Output

**User Story:** As a pipeline operator, I want the database output to use only the columns defined in the active Pipeline_Config, so that the Google Sheets-ready CSV contains no empty or irrelevant columns.

#### Acceptance Criteria

1. WHEN the pipeline produces the Google Sheets-ready CSV (step 8), THE Pipeline SHALL output a header row followed by data rows using exactly the columns defined in the active Pipeline_Config's database schema, in the order specified by that schema.
2. WHEN a record is written to the CSV and a schema-defined column has no value for that record, THE Pipeline SHALL write an empty string for that cell rather than omitting the column.
3. WHEN a record is written to the CSV, THE Pipeline SHALL validate that the record's `record_type` is in the active Pipeline_Config's list of valid record types.
4. IF a record has a `record_type` not in the valid list, THEN THE Pipeline SHALL exclude the record from the output and log a warning that identifies the record's `record_id` and the invalid `record_type` value.
5. IF all records for a lesson are excluded due to invalid `record_type`, THEN THE Pipeline SHALL produce a CSV containing only the header row and log a warning indicating that no valid records were found for that lesson.

### Requirement 7: Downstream Workflow Compatibility

**User Story:** As a teacher reviewer, I want all lesson types to produce output that feeds into the same Google Sheets review workflow, so that my review process does not change per lesson type.

#### Acceptance Criteria

1. THE Pipeline SHALL produce output files in the same directory structure regardless of Lesson_Type, containing exactly: `02_content_items.csv`, `03_lesson_structure.csv`, `04_supplemental_activities.csv`, `05_game_suggestions.csv`, `06_google_sheets_database.csv`, and a JSON package named `vp_{textbook}_{lesson}_database.json`. The book-level lesson index (`lesson_list.csv`) is maintained separately at `output/book-{N}/lesson_list.csv`.
2. THE Pipeline SHALL include `teacher_review_status` and `approved` columns in `06_google_sheets_database.csv` for all lesson types, where `teacher_review_status` accepts values from the set {pending_review, revise, approved, rejected} and `approved` accepts a boolean value (TRUE or FALSE, defaulting to FALSE).
3. THE Pipeline SHALL include `source_page` (integer page number) and `source_page_range` (page range string) columns in `02_content_items.csv` and `06_google_sheets_database.csv` for all lesson types, so that every record traces back to the original source material.
4. WHEN a lesson of any type reaches step 9 (人工審閱), THE Downstream_Workflow SHALL present it in Google Sheets with identical column headers, review status values, and approval actions as any other lesson type, requiring no lesson-type-specific reviewer instructions.
5. IF any of the 6 required per-lesson output files is missing or if `teacher_review_status` or `approved` columns are absent from `06_google_sheets_database.csv`, THEN THE Pipeline SHALL report a validation error indicating which file or column is missing, and SHALL NOT mark the lesson as ready for review.

### Requirement 8: Extensibility for Future Lesson Types

**User Story:** As a system maintainer, I want to add new lesson types (e.g., `listening`, `review`) by adding a configuration file only, so that the system scales without code changes.

#### Acceptance Criteria

1. WHEN a new Pipeline_Config file is added to the registry directory with a unique Lesson_Type name, THE Router SHALL include that Lesson_Type in its set of routable types within 5 seconds of the next request, without requiring code modifications or a system restart.
2. THE Pipeline_Config file format SHALL be defined by a machine-readable schema that specifies all mandatory and optional fields, so that new configurations can be validated automatically before the Router loads them.
3. WHEN the Router starts or receives a routing request, THE Router SHALL enumerate all available Lesson_Type values by reading every valid Pipeline_Config file present in the registry directory.
4. IF a Pipeline_Config file in the registry directory fails schema validation, THEN THE Router SHALL skip that file, log an error message indicating the file name and validation failure reason, and continue operating with the remaining valid configurations.

### Requirement 9: Configuration Validation

**User Story:** As a system maintainer, I want pipeline configurations validated at load time, so that malformed configs are caught before processing begins.

#### Acceptance Criteria

1. WHEN the Router loads a Pipeline_Config, THE Router SHALL validate that the config contains all required fields: `teaching_sequence`, `database_schema`, `valid_record_types`, `supplemental_activity_types`, `exercise_categories`.
2. IF one or more required fields are missing from the Pipeline_Config, THEN THE Router SHALL reject the config and return an error identifying all missing fields in a single validation response.
3. WHEN the Router loads a Pipeline_Config, THE Router SHALL validate that `database_schema` includes the mandatory shared columns: `lesson_id`, `record_id`, `record_type`, `source_page`, `source_page_range`, `teacher_review_status`, `approved`.
4. IF a mandatory shared column is missing from `database_schema`, THEN THE Router SHALL reject the config and return an error identifying the missing column.
5. WHEN the Router loads a Pipeline_Config, THE Router SHALL validate that `teaching_sequence` contains at least 1 entry, `valid_record_types` contains at least 1 entry, and `supplemental_activity_types` contains at least 1 entry.
6. IF a required field is present but contains an empty list or is not of the expected type (array for `teaching_sequence`, `valid_record_types`, `supplemental_activity_types`, `exercise_categories`; object for `database_schema`), THEN THE Router SHALL reject the config and return an error identifying the field and the type violation.

### Requirement 10: Lesson Metadata Output

**User Story:** As a pipeline operator, I want the output JSON package to include the lesson type used for processing, so that downstream tools can identify which pipeline produced the data.

#### Acceptance Criteria

1. THE Pipeline SHALL include a `lesson_type` field in the output JSON package's top-level `metadata` object, set to a non-empty string matching the Lesson_Type used during processing (maximum 128 characters).
2. THE Pipeline SHALL include a `pipeline_config_version` field in the output JSON package's `metadata` object, set to either the config file's last-modified timestamp in ISO 8601 format or an explicit version string of at most 64 characters.
3. THE Pipeline SHALL include a `generated_at` field in the output JSON package's `metadata` object, set to the UTC timestamp in ISO 8601 format at which the output was produced.
4. IF the config file has no last-modified timestamp and no explicit version string, THEN THE Pipeline SHALL set `pipeline_config_version` to the literal value "unknown".
