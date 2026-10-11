"""Read-only, version-bound audio repair gate for the existing W04 exam.

This permits isolated technical review output only, never lesson promotion.
"""
from pathlib import Path
import hashlib
import json
import re

EXAM_ID = "W04-L01L10-20261006"
DIRECTORY = "lessons/boya-elementary-i/lesson-09-10/10-design/assessment/w04-l01-l10"
# Inspected input versions; changing exam copy requires another explicit intake.
INPUT_HASHES = {
    "items.json": "e876c3327e27cf513518f57718f051b88a8b9b27ccfa1875dbe55c7bda29b19e",
    "audio-manifest.json": "a084690d6a307623d7f3bd17110a85b1037f0bfbeab48ba6ff04560473309f4f",
    "teacher.md": "7dc8f07186c1bce95f118a4ff4e6ea446edaf29d0e9a995414ce9ad187185eec",
    "student.md": "df3dec089e95443745789a11fde08e51f68ef88c4cd22e26c56daab37f64f858",
}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def safe_path(root, value):
    path = Path(value)
    if ".." in path.parts or str(value).startswith("~"):
        raise ValueError("unsafe path")
    path = path if path.is_absolute() else root / path
    if not path.is_relative_to(root):
        raise ValueError("path outside project")
    for part in (path, *path.parents):
        if part == root:
            break
        if part.is_symlink():
            raise ValueError("symlink path rejected")
    if not path.resolve().is_relative_to(root):
        raise ValueError("resolved path outside project")
    return path


def check_assessment_audio(root, exam_id, output_dir, offering_id=None, lesson_key=None):
    blockers, hashes = [], {}
    result = {"purpose": "assessment-audio", "exam_id": exam_id,
              "status": "blocked", "output_dir": output_dir, "blockers": blockers}
    try:
        root = Path(root).resolve()
        if exam_id != EXAM_ID or lesson_key is not None:
            raise ValueError("only the existing W04 exam_id is supported; lesson_key is not an exam identity")
        management = json.loads(safe_path(root, "lessons/boya-elementary-i/assessment-management.json").read_text())
        exams = [x for x in management["exams"] if x["exam_id"] == exam_id]
        if len(exams) != 1 or exams[0]["directory"] != DIRECTORY:
            raise ValueError("exam directory/unique identity mismatch")
        identity = {"offering_id": "2026-fall", "textbook_id": "boya-elementary-i", "cohort": "BOYA-LS-E1-Y1S1-2026F"}
        if any(management.get(k) != v for k, v in identity.items()) or offering_id not in (None, "2026-fall"):
            raise ValueError("assessment identity mismatch")
        base = safe_path(root, DIRECTORY)
        if not output_dir:
            raise ValueError("isolated audio output directory is required")
        target = safe_path(root, output_dir)
        if target.parent != base or not re.fullmatch(r"audio-repair-[a-z0-9-]+", target.name):
            raise ValueError("output must be a direct audio-repair-* child of the registered exam directory")
        for name, expected in INPUT_HASHES.items():
            hashes[name] = digest(safe_path(root, str(base / name)))
            if hashes[name] != expected:
                blockers.append(f"approved repair intake changed: {name}")
        items = json.loads((base / "items.json").read_text())
        clips = json.loads((base / "audio-manifest.json").read_text())["clips"]
        if items.get("assessment_id") != exam_id or any(items.get(k) != v for k, v in identity.items()):
            raise ValueError("items assessment identity mismatch")
        keys = [f"boya-elementary-i:lesson-{n:02}" for n in range(1, 11)]
        if items["lesson_keys"] != keys:
            raise ValueError("cumulative lesson scope mismatch")
        questions = items["items"]
        ids = [q["id"] for q in questions]
        audio_ids = [c["audio_id"] for c in clips]
        mapped = [qid for c in clips for qid in c["question_ids"]]
        if len(ids) != 50 or len(set(ids)) != 50 or sorted(q["number"] for q in questions) != list(range(1, 51)):
            raise ValueError("question identity/count mismatch")
        if len(audio_ids) != 33 or len(set(audio_ids)) != 33 or sorted(mapped) != sorted(ids):
            raise ValueError("audio/question coverage mismatch")
        source = safe_path(root, "OmniVoice/audio/博雅汉语测验音频/题号音频清单.jsonl")
        originals = [json.loads(line) for line in source.read_text().splitlines() if line.strip()]
        for clip in clips:
            matches = [x for x in originals if x["audio_id"] == clip["audio_id"]]
            if len(matches) != 1:
                raise ValueError("source audio identity mismatch")
            row = matches[0]
            if any(clip[k] != row[k] for k in ("source_text", "speech_units", "pause_after_ms")) or clip["source_speed"] != row["speed"]:
                raise ValueError(f"transcript/pause/speed mismatch: {clip['audio_id']}")
            current = safe_path(root, str(base / clip["file"]))
            original = safe_path(root, clip["source_path"])
            if current.parent != base / "audio" or digest(current) != clip["sha256"] or digest(original) != clip["source_sha256"]:
                raise ValueError("original audio hash/path mismatch")
            for qid, number in zip(clip["question_ids"], clip["question_numbers"], strict=True):
                q = next(q for q in questions if q["id"] == qid)
                if q["number"] != number or q["audio_id"] != clip["audio_id"]:
                    raise ValueError("question/audio mapping mismatch")
        result.update(identity, lesson_keys=keys, input_hashes=hashes,
                      output_dir=str(target), artifact_state="design_draft", human_audio_acceptance=False)
    except (ValueError, KeyError, OSError, TypeError) as error:
        blockers.append(str(error))
    result["status"] = "blocked" if blockers else "ready"
    return result
