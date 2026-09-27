from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from scripts.audit_command_surface import audit  # noqa: E402


class CommandSurfaceAuditTests(unittest.TestCase):
    def test_documented_commands_exist_and_safe_help_checks_pass(self) -> None:
        result = audit(ROOT)
        self.assertEqual(result["status"], "clear", result["findings"])
        self.assertGreaterEqual(result["documented_command_count"], 15)
        self.assertIn("production_gate.py", result["help_checked"])
        self.assertIn("build_release_package.py", result["help_checked"])
        self.assertFalse(result["write_performed"])

    def test_side_effect_commands_are_inventory_only(self) -> None:
        result = audit(ROOT)
        self.assertIn("build_release_package.py", result["side_effect_commands_not_executed"])
        self.assertIn("record_lesson_gate.py", result["side_effect_commands_not_executed"])


if __name__ == "__main__":
    unittest.main()
