import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from w04_spoken_text import build_spoken_review


class SpokenTextTests(unittest.TestCase):
    def test_all_33_cover_50_questions_and_all_turns(self):
        rows = build_spoken_review(ROOT)
        self.assertEqual(len(rows), 33)
        self.assertEqual(sum(len(r["question_numbers"]) for r in rows), 50)
        dialogues = [r for r in rows if "-B" in r["audio_id"]]
        self.assertEqual(len(dialogues), 7)
        self.assertEqual(sum(len(r["units"]) for r in dialogues), 28)

    def test_remove_role_names_but_preserve_semantic_names_and_negation(self):
        rows = {r["audio_id"]: r for r in build_spoken_review(ROOT)}
        anna = rows["E04-B01"]["units"]
        self.assertEqual([u["spoken_text"] for u in anna],
            ["你好！你叫什么名字？", "我叫安娜。", "你是老师吗？", "不是，我是学生。"])
        self.assertEqual(anna[-1]["speaker"], "安娜")
        country = rows["E05-B01"]["units"]
        self.assertEqual(country[1]["spoken_text"], "安娜，你是哪国人？")
        self.assertEqual(country[1]["speaker"], "小王")
        self.assertEqual(rows["E07-A01"]["units"][0]["spoken_text"], "安娜不在宿舍，她在教室里。")

    def test_phonetics_use_reviewed_chinese_not_instructions_or_latin(self):
        rows = {r["audio_id"]: r for r in build_spoken_review(ROOT)}
        self.assertEqual(rows["E01-A02"]["units"][0]["spoken_text"], "女")
        self.assertEqual([u["spoken_text"] for u in rows["E03-C01"]["units"]], ["雨", "晚", "月"]*2)


if __name__ == "__main__":
    unittest.main()
