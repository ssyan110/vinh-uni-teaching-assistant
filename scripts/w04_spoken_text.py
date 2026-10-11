"""Separate W04 speaker metadata from spoken text, without editing sources."""
import json
import re
from pathlib import Path
from assessment_audio_gate import DIRECTORY


def build_spoken_review(root):
    base = Path(root) / DIRECTORY
    clips = json.loads((base / "audio-manifest.json").read_text())["clips"]
    questions = json.loads((base / "items.json").read_text())["items"]
    teacher = (base / "teacher.md").read_text()
    student = (base / "student.md").read_text()
    rows = []
    role_sensitive = {15, 18, 20, 21, 23, 30}
    for clip in clips:
        units = []
        if "-B" in clip["audio_id"]:
            lines = clip["source_text"].splitlines()
            if len(lines) != len(clip["speech_units"]):
                raise ValueError("dialogue turn count mismatch")
            for line, original in zip(lines, clip["speech_units"], strict=True):
                match = re.fullmatch(r"([^：:，,\n]{1,10})[：:](.+)", line)
                if not match:
                    raise ValueError("unrecognized speaker metadata")
                speaker, text = match.groups()
                if original != f"{speaker}，{text}":
                    raise ValueError("source dialogue/synthesis input mismatch")
                units.append({"speaker": speaker, "original_tts_input": original,
                              "spoken_text": text, "change": "remove_only_leading_speaker_label"})
        else:
            units = [{"speaker": None, "original_tts_input": text,
                      "spoken_text": text, "change": "unchanged"} for text in clip["speech_units"]]
        # Every actual historical synthesis input is independently visible in teacher copy.
        actual = "实际合成输入（人名可能读出）：" + " / ".join(clip["speech_units"])
        if actual not in teacher:
            raise ValueError(f"teacher actual-input discrepancy: {clip['audio_id']}")
        linked = [q for q in questions if q["audio_id"] == clip["audio_id"]]
        for q in linked:
            if f"## {q['number']}. {q['prompt']}" not in student:
                raise ValueError(f"student prompt discrepancy: {q['id']}")
            heading = f"## {q['id']} · {q['prompt']}"
            if heading not in teacher:
                raise ValueError(f"teacher prompt discrepancy: {q['id']}")
            section = teacher.split(heading, 1)[1].split("\n## ", 1)[0]
            answer = re.search(r"- 答案：(.*?)[；;]", section)
            if not answer or q["answer"] not in answer[1]:
                raise ValueError(f"teacher answer discrepancy: {q['id']}")
        rows.append({"audio_id": clip["audio_id"], "question_numbers": clip["question_numbers"],
            "source_text": clip["source_text"], "units": units, "pause_after_ms": clip["pause_after_ms"],
            "play_count": clip["play_count"], "internal_repeat": clip["internal_repeat"],
            "source_speed": clip["source_speed"],
            "question_answer_mapping": [{"number": q["number"], "prompt": q["prompt"], "answer": q["answer"]} for q in linked],
            "role_identity_ambiguity_questions": [q["number"] for q in linked if q["number"] in role_sensitive]})
    if len(rows) != 33 or sum(len(r["question_numbers"]) for r in rows) != 50:
        raise ValueError("cumulative coverage mismatch")
    return rows
