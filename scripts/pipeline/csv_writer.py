"""Schema-driven CSV writer for the AI teaching material pipeline.

Writes structured lesson records to CSV files using column schemas
defined in pipeline configurations. Supports both database-schema-driven
output (VP step 8) and simple list-based CSV output.
"""

from __future__ import annotations

import csv
import logging
from dataclasses import dataclass, field
from pathlib import Path

from .validator import PipelineConfig

logger = logging.getLogger(__name__)


@dataclass
class WriteResult:
    """Result summary from a database CSV write operation."""

    rows_written: int
    rows_excluded: int
    warnings: list[str] = field(default_factory=list)


def write_database_csv(
    path: Path, records: list[dict], config: PipelineConfig
) -> WriteResult:
    """Write records to a database CSV file using the pipeline schema.

    Filters records by valid_record_types from the config and writes only
    columns defined in the database_schema.

    Args:
        path: Output CSV file path.
        records: List of record dicts to write.
        config: Pipeline configuration providing schema and valid types.

    Returns:
        WriteResult with counts of written/excluded rows and any warnings.
    """
    columns = config.database_schema
    rows_written = 0
    rows_excluded = 0
    warnings: list[str] = []

    with path.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=columns, extrasaction="ignore")
        writer.writeheader()

        for record in records:
            record_type = record.get("record_type")

            if record_type not in config.valid_record_types:
                rows_excluded += 1
                record_id = record.get("record_id", "unknown")
                msg = (
                    f"Excluded record '{record_id}': "
                    f"invalid record_type '{record_type}'"
                )
                logger.warning(msg)
                warnings.append(msg)
                continue

            # Build row with only schema columns
            row = {col: record.get(col, "") for col in columns}
            writer.writerow(row)
            rows_written += 1

    if rows_written == 0 and records:
        msg = "No valid records found"
        logger.warning(msg)
        warnings.append(msg)

    return WriteResult(
        rows_written=rows_written,
        rows_excluded=rows_excluded,
        warnings=warnings,
    )


def write_csv(
    path: Path, rows: list[dict], fieldnames: list[str] | None = None
) -> None:
    """Write rows to a simple CSV file.

    A general-purpose CSV writer for auxiliary output files such as
    lesson_list, activities, and game suggestions.

    Args:
        path: Output CSV file path.
        rows: List of row dicts to write.
        fieldnames: Column names for the CSV header. If None, derived
                    from the keys of the first row.
    """
    if not rows:
        logger.warning("No rows to write to %s", path)
        return

    if fieldnames is None:
        fieldnames = list(rows[0].keys())

    with path.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)
