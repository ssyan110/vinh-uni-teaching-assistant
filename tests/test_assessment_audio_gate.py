import json
from pathlib import Path
import shutil
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from assessment_audio_gate import DIRECTORY, EXAM_ID, INPUT_HASHES, check_assessment_audio


class AssessmentAudioGateTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.root = Path(temp.name).resolve()
        files = ["lessons/boya-elementary-i/assessment-management.json",
                 "OmniVoice/audio/博雅汉语测验音频/题号音频清单.jsonl"]
        files += [f"{DIRECTORY}/{name}" for name in INPUT_HASHES]
        clips = json.loads((ROOT / DIRECTORY / "audio-manifest.json").read_text())["clips"]
        files += [f"{DIRECTORY}/{c['file']}" for c in clips] + [c["source_path"] for c in clips]
        for name in files:
            target = self.root / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / name, target)
        self.output = self.root / DIRECTORY / "audio-repair-test-v01"

    def check(self, **kwargs):
        return check_assessment_audio(self.root, kwargs.get("exam_id", EXAM_ID),
                                      str(kwargs.get("output", self.output)), "2026-fall",
                                      kwargs.get("lesson_key"))

    def test_registered_exam_is_ready(self):
        self.assertEqual(self.check()["status"], "ready")

    def test_unknown_exam_and_lesson_substitution_rejected(self):
        self.assertEqual(self.check(exam_id="unknown")["status"], "blocked")
        self.assertEqual(self.check(lesson_key="boya-elementary-i:lesson-01")["status"], "blocked")

    def test_cross_directory_original_and_traversal_rejected(self):
        for output in [self.root / "audio-repair-test", self.output.parent / "audio",
                       self.output.parent / "audio-repair-test/../audio-repair-other"]:
            self.assertEqual(self.check(output=output)["status"], "blocked")

    def test_symlink_rejected(self):
        self.output.symlink_to(self.output.parent, target_is_directory=True)
        self.assertEqual(self.check()["status"], "blocked")

    def test_transcript_mutation_rejected(self):
        path = self.root / DIRECTORY / "audio-manifest.json"
        data = json.loads(path.read_text())
        data["clips"][0]["speech_units"] = ["错误内容"]
        path.write_text(json.dumps(data))
        self.assertEqual(self.check()["status"], "blocked")

    def test_question_mutation_rejected(self):
        path = self.root / DIRECTORY / "items.json"
        data = json.loads(path.read_text())
        data["items"][0]["number"] = 50
        path.write_text(json.dumps(data))
        self.assertEqual(self.check()["status"], "blocked")


if __name__ == "__main__":
    unittest.main()
