import json
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.scoring import ALL_CRITERIA  # noqa: E402


class SourceMapTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.document = json.loads((ROOT / "data/rubric.zh-CN.json").read_text(encoding="utf-8"))
        cls.source_map = json.loads((ROOT / "data/source-map.json").read_text(encoding="utf-8"))
        cls.source_ids = {source["id"] for source in cls.source_map["sources"]}

    def test_every_full_criterion_has_known_source_ids(self):
        criteria = {criterion["id"]: criterion for criterion in self.document["criteria"]}
        self.assertEqual(set(criteria), set(ALL_CRITERIA))
        for criterion in criteria.values():
            self.assertTrue(set(criterion["source_ids"]).issubset(self.source_ids))
            self.assertTrue(criterion["source_construct"])
            self.assertTrue(criterion["task_specific_part"])
            self.assertTrue(criterion["adaptation_note_zh_tw"])

    def test_source_map_has_criterion_entries(self):
        mapped = {item["criterion_id"] for item in self.source_map["criterion_map"]}
        self.assertEqual(mapped, set(ALL_CRITERIA))

    def test_source_map_does_not_define_actfl_level_conversion(self):
        serialized = json.dumps(self.source_map, ensure_ascii=False)
        self.assertNotIn("level_conversion", serialized)
        self.assertNotIn("Novice Low", serialized)
        self.assertNotIn("Intermediate Low", serialized)


if __name__ == "__main__":
    unittest.main()
