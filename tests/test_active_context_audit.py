from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from audit_active_context_consumers import audit  # noqa: E402


class ActiveContextConsumerAuditTests(unittest.TestCase):
    def test_audit_is_read_only_and_reports_remaining_consumers(self) -> None:
        result = audit(ROOT)
        self.assertFalse(result["write_performed"])
        paths = {item["path"] for item in result["consumers"]}
        self.assertNotIn("scripts/agent_loop.py", paths)
        self.assertNotIn("scripts/build_dashboard.py", paths)
        self.assertIn("scripts/dashboard_context.py", paths)
        self.assertTrue(any(item["category"] == "historical-legacy" for item in result["consumers"]))


if __name__ == "__main__":
    unittest.main()
