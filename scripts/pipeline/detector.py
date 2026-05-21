"""Auto-detection heuristic for lesson type classification.

Analyzes content items to suggest whether a lesson is pinyin-focused
or a normal (vocabulary/grammar/text) lesson based on record_type markers.
"""

from __future__ import annotations

from dataclasses import dataclass, field

PINYIN_MARKERS: set[str] = {"initials", "finals", "tone", "spelling_rule", "pinyin_table"}
NORMAL_MARKERS: set[str] = {"vocabulary", "grammar", "text"}


@dataclass
class DetectionResult:
    """Result of lesson type auto-detection."""

    suggested_type: str
    confidence: str  # "high" | "medium" | "low"
    markers_found: list[str] = field(default_factory=list)


def detect_lesson_type(content_items: list[dict]) -> DetectionResult:
    """Detect the lesson type from a list of content items.

    Examines the record_type values present in the content items and
    uses marker sets to determine whether the lesson is pinyin-focused
    or a normal lesson.

    Args:
        content_items: List of content item dicts, each expected to have
            a "record_type" key.

    Returns:
        A DetectionResult with the suggested type, confidence level,
        and which markers were found.
    """
    # 1. Extract all unique record_type values
    record_types: set[str] = set()
    for item in content_items:
        rt = item.get("record_type")
        if rt:
            record_types.add(rt)

    # 2. Count marker matches
    pinyin_found = record_types & PINYIN_MARKERS
    normal_found = record_types & NORMAL_MARKERS

    pinyin_count = len(pinyin_found)
    normal_count = len(normal_found)

    # Combine all found markers for reporting
    all_markers = sorted(pinyin_found | normal_found)

    # 3. Apply decision rules
    if pinyin_count >= 3 and normal_count == 0:
        return DetectionResult(
            suggested_type="pinyin",
            confidence="high",
            markers_found=all_markers,
        )

    if pinyin_count >= 2 and normal_count == 0:
        return DetectionResult(
            suggested_type="pinyin",
            confidence="medium",
            markers_found=all_markers,
        )

    if normal_count >= 2:
        return DetectionResult(
            suggested_type="regular",
            confidence="high",
            markers_found=all_markers,
        )

    if normal_count >= 1:
        return DetectionResult(
            suggested_type="regular",
            confidence="medium",
            markers_found=all_markers,
        )

    # Fallback: not enough signal
    return DetectionResult(
        suggested_type="regular",
        confidence="low",
        markers_found=all_markers,
    )
