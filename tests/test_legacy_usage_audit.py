from __future__ import annotations

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from scripts.audit_legacy_usage import audit  # noqa: E402


class LegacyUsageAuditTests(unittest.TestCase):
    def test_repository_has_no_unallowlisted_direct_legacy_fallbacks(self) -> None:
        result = audit(ROOT)
        self.assertEqual(result["status"], "clear", result["violations"])
        self.assertFalse(result["write_performed"])

    def test_migration_adapter_uses_shared_legacy_path_boundary(self) -> None:
        path = ROOT / "scripts/legacy/migrate_lesson_01_authority.py"
        text = path.read_text(encoding="utf-8")
        self.assertIn("legacy_path", text)
        self.assertIn("legacy_value", text)
        for field in ("lesson_root", "authority_root", "qa_root", "release_root", "historical_package_evidence"):
            self.assertNotIn(f'CONFIG["{field}"]', text)

    def test_historical_scopes_are_explicit(self) -> None:
        result = audit(ROOT)
        self.assertIn("scripts/legacy/", result["allowlisted_scopes"])
        self.assertIn("four historical builder files", result["allowlisted_scopes"])


if __name__ == "__main__":
    unittest.main()
