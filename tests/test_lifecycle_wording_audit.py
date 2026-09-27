from __future__ import annotations

import unittest
from pathlib import Path

from scripts.audit_lifecycle_wording import audit


ROOT = Path(__file__).resolve().parents[1]


class LifecycleWordingAuditTests(unittest.TestCase):
    def test_command_documentation_preserves_lifecycle_boundaries(self) -> None:
        result = audit()
        self.assertEqual(result["status"], "clear", result["findings"])
        self.assertEqual(result["required_phrase_count"], 8)
        self.assertFalse(result["write_performed"])
        self.assertTrue((ROOT / "scripts/README.md").is_file())


if __name__ == "__main__":
    unittest.main()
