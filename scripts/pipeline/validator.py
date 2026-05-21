"""Config validator for the AI teaching material pipeline.

Validates lesson-type config JSON files against a shared schema and
enforces mandatory column and structural requirements.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from pathlib import Path

from jsonschema import ValidationError, validate

logger = logging.getLogger(__name__)

MANDATORY_SHARED_COLUMNS = [
    "lesson_id",
    "record_id",
    "record_type",
    "source_page",
    "source_page_range",
    "teacher_review_status",
    "approved",
]

_DEFAULT_REVIEW_STATUSES = [
    "pending_review",
    "approved",
    "revise",
    "rejected",
]

_DEFAULT_VISIBILITY_VALUES = [
    "student_visible",
    "teacher_only",
    "optional_student_visible",
]


@dataclass
class PipelineConfig:
    """Validated pipeline configuration for a single lesson type."""

    lesson_type: str
    version: str
    teaching_sequence: list[dict]
    database_schema: list[str]
    valid_record_types: list[str]
    supplemental_activity_types: list[str]
    exercise_categories: list[str]
    review_statuses: list[str] = field(default_factory=lambda: list(_DEFAULT_REVIEW_STATUSES))
    visibility_values: list[str] = field(default_factory=lambda: list(_DEFAULT_VISIBILITY_VALUES))


class ConfigValidationError(Exception):
    """Raised when a pipeline config file fails validation."""

    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)


def validate_config(config_path: Path) -> PipelineConfig:
    """Validate a single pipeline config JSON file.

    Args:
        config_path: Path to the lesson-type config JSON file.

    Returns:
        A validated PipelineConfig dataclass instance.

    Raises:
        ConfigValidationError: If the file is missing, malformed, or fails
            schema/structural validation.
    """
    # 1. Load the JSON file
    if not config_path.exists():
        raise ConfigValidationError(f"Config file not found: {config_path}")

    try:
        data = json.loads(config_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ConfigValidationError(
            f"Invalid JSON in {config_path.name}: {exc}"
        ) from exc

    # 2. Load the schema from the same directory
    schema_path = config_path.parent / "_schema.json"
    if not schema_path.exists():
        raise ConfigValidationError(
            f"Schema file not found: {schema_path}"
        )

    schema = json.loads(schema_path.read_text(encoding="utf-8"))

    # 3. Validate against JSON Schema
    try:
        validate(instance=data, schema=schema)
    except ValidationError as exc:
        raise ConfigValidationError(
            f"Schema validation failed for {config_path.name}: {exc.message}"
        ) from exc

    # 4. Check mandatory shared columns
    db_schema = data.get("database_schema", [])
    missing = [col for col in MANDATORY_SHARED_COLUMNS if col not in db_schema]
    if missing:
        raise ConfigValidationError(
            f"Missing mandatory columns in database_schema: {', '.join(missing)}"
        )

    # 5. Check teaching_sequence has at least 1 entry
    if len(data.get("teaching_sequence", [])) < 1:
        raise ConfigValidationError(
            "teaching_sequence must have at least 1 entry"
        )

    # 6. Check valid_record_types has at least 1 entry
    if len(data.get("valid_record_types", [])) < 1:
        raise ConfigValidationError(
            "valid_record_types must have at least 1 entry"
        )

    # 7. Check supplemental_activity_types has at least 1 entry
    if len(data.get("supplemental_activity_types", [])) < 1:
        raise ConfigValidationError(
            "supplemental_activity_types must have at least 1 entry"
        )

    # 8. Build PipelineConfig with defaults for optional fields
    return PipelineConfig(
        lesson_type=data["lesson_type"],
        version=data["version"],
        teaching_sequence=data["teaching_sequence"],
        database_schema=data["database_schema"],
        valid_record_types=data["valid_record_types"],
        supplemental_activity_types=data["supplemental_activity_types"],
        exercise_categories=data.get("exercise_categories", []),
        review_statuses=data.get("review_statuses", list(_DEFAULT_REVIEW_STATUSES)),
        visibility_values=data.get("visibility_values", list(_DEFAULT_VISIBILITY_VALUES)),
    )


def validate_all_configs(config_dir: Path) -> dict[str, PipelineConfig]:
    """Validate all config JSON files in a directory.

    Scans for *.json files (skipping _schema.json), validates each one,
    and returns a mapping of lesson_type -> PipelineConfig.

    Invalid configs are logged as warnings but do not crash the process.

    Args:
        config_dir: Directory containing config JSON files.

    Returns:
        Dict mapping lesson_type string to its validated PipelineConfig.
    """
    results: dict[str, PipelineConfig] = {}

    if not config_dir.is_dir():
        logger.warning("Config directory does not exist: %s", config_dir)
        return results

    for json_file in sorted(config_dir.glob("*.json")):
        if json_file.name == "_schema.json":
            continue

        try:
            config = validate_config(json_file)
            results[config.lesson_type] = config
            logger.info("Validated config: %s", config.lesson_type)
        except ConfigValidationError as exc:
            logger.warning(
                "Skipping invalid config %s: %s", json_file.name, exc.message
            )

    return results
