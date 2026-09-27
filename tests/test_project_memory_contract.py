from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MEMORY = ROOT / "memory/project-memory.md"


class ProjectMemoryContractTests(unittest.TestCase):
    def test_memory_is_durable_only_and_points_to_status_sources(self) -> None:
        text = MEMORY.read_text(encoding="utf-8")
        for token in (
            "durable decisions",
            "Canonical ownership",
            "canonical-workflow-contract.md",
            "requirements-registry.md",
            "lesson_key",
            "Status source of truth",
            "memory entry 都不能取代",
        ):
            self.assertIn(token, text)

    def test_memory_does_not_claim_current_approval_or_delivery(self) -> None:
        text = MEMORY.read_text(encoding="utf-8")
        forbidden = (
            "Adam 已明确確認該課完成交付",
            "当前 active lesson key 是",
            "Current QA：",
            "下一個工作節點",
            "目前 active lesson",
            "release ready",
        )
        for phrase in forbidden:
            self.assertNotIn(phrase, text)


if __name__ == "__main__":
    unittest.main()
