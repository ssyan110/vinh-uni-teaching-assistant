"""Small file and language-policy checks used by the test suite."""

from __future__ import annotations

from pathlib import Path


TRADITIONAL_MARKERS = set("學評證個應與這會說聽題記標為無對發後據號際條")


def assert_simplified_student_text(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    if "越南文" in text:
        raise AssertionError(f"student-facing file contains Vietnamese-language instruction: {path}")
    found = sorted(TRADITIONAL_MARKERS.intersection(text))
    if found:
        raise AssertionError(f"student-facing file contains traditional markers {found}: {path}")

