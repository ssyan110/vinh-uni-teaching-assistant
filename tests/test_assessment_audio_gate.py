import json
from pathlib import Path
import shutil
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from assessment_audio_gate import (DIRECTORY, EXAM_ID, INPUT_HASHES, check_assessment_audio,
                                   check_current_assessment_audio, digest)


class CurrentAssessmentAudioTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.root = Path(temp.name).resolve()
        self.base = self.root / "lessons/boya-elementary-i/review/test"
        (self.base / "audio").mkdir(parents=True)
        self.management = self.root / "lessons/boya-elementary-i/assessment-management.json"
        self.exam_id = "W05-TEST"
        keys = ["boya-elementary-i:lesson-11"]
        self.write(self.management, dict(current_review_exam_id=self.exam_id, offering_id="2026-fall",
            textbook_id="boya-elementary-i", cohort="test", exams=[dict(exam_id=self.exam_id,
            directory=str(self.base.relative_to(self.root)), status="CONTENT_APPROVED",
            lesson_keys=keys, question_count=1, audio_count=1)]))
        (self.base / "audio/test.wav").write_bytes(b"synthetic audio bytes")
        self.write(self.base / "items.json", dict(assessment_id=self.exam_id, offering_id="2026-fall",
            cohort="test", lesson_keys=keys, items=[dict(number=1, audio_id="11-1", lesson_key=keys[0])]))
        self.write(self.base / "audio-manifest.json", [dict(audio_id="11-1", file="audio/test.wav",
            sha256=digest(self.base / "audio/test.wav"), transcript="test", question_ids=[1])])
        for name in ("teacher.md", "student.md"):
            (self.base / name).write_text("synthetic fixture")
        self.approval = dict(assessment_id=self.exam_id, approved_by="Synthetic fixture human",
            approved_at="2026-10-15T12:00:00+07:00", user_evidence="Fixture only", scope="Fixture",
            hashes={n: digest(self.base / n) for n in ("items.json", "audio-manifest.json", "teacher.md", "student.md")})
        self.write(self.base / "content-approval.json", self.approval)

    def write(self, path, value):
        path.write_text(json.dumps(value))

    def check(self, **kwargs):
        return check_current_assessment_audio(self.root, kwargs.get("exam_id"),
            kwargs.get("output", str(self.base / "audio-review-test")),
            kwargs.get("offering_id", "2026-fall"), kwargs.get("lesson_key"))

    def test_current_pointer_and_counts_are_manifest_driven(self):
        result = self.check()
        self.assertEqual(result["status"], "ready", result)
        self.assertEqual(result["audio_count"], 1)
        self.assertFalse(result["human_audio_acceptance"])
        self.assertFalse(result["source_audio_verified"])

    def test_missing_approval_and_mutated_inputs_block(self):
        self.write(self.base / "content-approval.json", {})
        self.assertEqual(self.check()["status"], "blocked")
        self.write(self.base / "content-approval.json", self.approval)
        (self.base / "teacher.md").write_text("changed")
        self.assertEqual(self.check()["status"], "blocked")

    def test_unknown_historical_duplicate_and_wrong_identity_block(self):
        self.assertEqual(self.check(exam_id="unknown")["status"], "blocked")
        self.assertEqual(self.check(offering_id="other")["status"], "blocked")
        self.assertEqual(self.check(lesson_key="boya-elementary-i:lesson-11")["status"], "blocked")
        data = json.loads(self.management.read_text())
        data["exams"][0]["status"] = "SUPERSEDED/HISTORICAL"
        self.write(self.management, data)
        self.assertEqual(self.check()["status"], "blocked")
        data["exams"].append(data["exams"][0])
        self.write(self.management, data)
        self.assertEqual(self.check()["status"], "blocked")

    def test_path_and_audio_mutation_block(self):
        for output in (str(self.base / "audio"), str(self.root / "audio-review-test"),
                       str(self.base / "audio-review-test/../audio-review-next")):
            self.assertEqual(self.check(output=output)["status"], "blocked")
        target = self.base / "audio-review-link"
        target.symlink_to(self.base, target_is_directory=True)
        self.assertEqual(self.check(output=str(target))["status"], "blocked")
        (self.base / "audio/test.wav").write_bytes(b"changed")
        self.assertEqual(self.check()["status"], "blocked")

    def test_approved_but_invalid_mapping_still_blocks(self):
        path = self.base / "audio-manifest.json"
        data = json.loads(path.read_text())
        data[0]["question_ids"] = [2]
        self.write(path, data)
        self.approval["hashes"]["audio-manifest.json"] = digest(path)
        self.write(self.base / "content-approval.json", self.approval)
        self.assertEqual(self.check()["status"], "blocked")

    def test_registered_course_review_exception_preserves_checks(self):
        target = self.root / "course/offerings/2026-fall/book/weekly-assessment-review/w05"
        target.parent.mkdir(parents=True)
        shutil.copytree(self.base, target)
        data = json.loads(self.management.read_text())
        data["exams"][0]["directory"] = str(target.relative_to(self.root))
        self.write(self.management, data)
        self.base = target
        self.assertEqual(self.check()["status"], "ready")
        self.write(target / "content-approval.json", {})
        self.assertEqual(self.check()["status"], "blocked")


class AssessmentAudioGateTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.root = Path(temp.name).resolve()
        # Synthetic bytes and hashes: never import a real exam or human approval.
        from unittest.mock import patch
        base = self.root / DIRECTORY
        (base / "audio").mkdir(parents=True)
        identity = {"offering_id": "2026-fall", "textbook_id": "boya-elementary-i", "cohort": "BOYA-LS-E1-Y1S1-2026F"}
        management = self.root / "lessons/boya-elementary-i/assessment-management.json"
        management.write_text(json.dumps(dict(identity, exams=[{"exam_id": EXAM_ID, "directory": DIRECTORY}])))
        questions, clips, originals = [], [], []
        for i in range(33):
            aid = f"synthetic-{i}"
            numbers = list(range(len(questions) + 1, len(questions) + (2 if i < 17 else 1) + 1))
            qids = [f"q{n}" for n in numbers]
            questions.extend(dict(id=qid, number=n, audio_id=aid) for qid, n in zip(qids, numbers))
            current = base / "audio" / f"{aid}.wav"
            original = self.root / "synthetic-originals" / f"{aid}.wav"
            original.parent.mkdir(exist_ok=True)
            current.write_bytes(b'SYNTHETIC HASH FIXTURE ONLY')
            original.write_bytes(current.read_bytes())
            row = dict(audio_id=aid, source_text="SYNTHETIC", speech_units=["SYNTHETIC"], pause_after_ms=[0], speed=1)
            originals.append(row)
            clips.append(dict(row, file=f"audio/{aid}.wav", source_path=original.relative_to(self.root).as_posix(),
                source_speed=1, sha256=digest(current), source_sha256=digest(original), question_ids=qids, question_numbers=numbers))
        (base / "items.json").write_text(json.dumps(dict(identity, assessment_id=EXAM_ID,
            lesson_keys=[f"boya-elementary-i:lesson-{n:02}" for n in range(1,11)], items=questions)))
        (base / "audio-manifest.json").write_text(json.dumps({"clips": clips}))
        for name in ("teacher.md", "student.md"):
            (base / name).write_text("SYNTHETIC TEST ONLY")
        source = self.root / "OmniVoice/audio/博雅汉语测验音频/题号音频清单.jsonl"
        source.parent.mkdir(parents=True)
        source.write_text("\n".join(json.dumps(x) for x in originals))
        bound = patch('assessment_audio_gate.INPUT_HASHES', {name: digest(base / name) for name in INPUT_HASHES})
        bound.start()
        self.addCleanup(bound.stop)
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
