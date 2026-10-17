"""Read-only assessment audio gates; legacy repair and current review are separate.

This permits isolated technical review output only, never lesson promotion.
"""
from pathlib import Path
import hashlib
import json
import re
from datetime import datetime

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
    if not str(value).strip():
        raise ValueError("empty path")
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
    """Legacy W04-L01L10 intake only; never selects the current exam."""
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


def check_current_assessment_audio(root, exam_id, output_dir, offering_id=None, lesson_key=None):
    """Validate registered, approved inputs for isolated technical audio review.

    Does not authorize synthesis, source edits, publication or human acceptance.
    External publisher originals are not opened; their verification remains separate.
    """
    blockers = []
    result = dict(purpose="assessment-audio-current", exam_id=exam_id, status="blocked",
                  blockers=blockers, human_audio_acceptance=False,
                  source_audio_verified=False, artifact_state="design_draft")
    try:
        root = Path(root).resolve()
        if root == Path(root.anchor) or root == Path.home() or not root.is_dir():
            raise ValueError("project root must be a specific existing workspace")
        if lesson_key is not None:
            raise ValueError("lesson_key is not an exam identity")
        management = json.loads(safe_path(root, "lessons/boya-elementary-i/assessment-management.json").read_text())
        exam_id = exam_id or management.get("current_review_exam_id")
        result["exam_id"] = exam_id
        exams = [x for x in management["exams"] if x["exam_id"] == exam_id]
        if not exam_id or len(exams) != 1:
            raise ValueError("exam must have a unique registered identity")
        exam = exams[0]
        if any(word in exam.get("status", "").upper() for word in ("HISTORICAL", "SUPERSEDED")):
            raise ValueError("historical exam requires the explicit legacy repair route")
        if offering_id is not None and offering_id != management["offering_id"]:
            raise ValueError("offering mismatch")
        base = safe_path(root, exam["directory"])
        allowed = (root / "lessons" / management["textbook_id"],
                   root / "course" / "offerings" / management["offering_id"])
        if not any(base.is_relative_to(p) and base != p for p in allowed):
            raise ValueError("registered exam directory is outside its assessment scope")
        if any(p in base.parts for p in ("20-approved", "30-qa", "40-release", "archive")):
            raise ValueError("protected exam directory")
        if not output_dir:
            raise ValueError("isolated audio review output directory is required")
        target = safe_path(root, output_dir)
        if target.parent != base or not re.fullmatch(r"audio-review-[a-z0-9-]+", target.name):
            raise ValueError("output must be a direct audio-review-* child of the registered exam directory")
        approval = json.loads(safe_path(root, base / "content-approval.json").read_text())
        if (approval.get("assessment_id") != exam_id or not approval.get("approved_by")
                or not approval.get("user_evidence") or not approval.get("scope")):
            raise ValueError("missing independent assessment content approval evidence")
        if datetime.fromisoformat(approval["approved_at"].replace("Z", "+00:00")).utcoffset() is None:
            raise ValueError("approval timestamp must include timezone")
        hashes = {}
        for name in ("items.json", "audio-manifest.json", "student.md", "teacher.md"):
            expected = approval["hashes"].get(name, "")
            if not re.fullmatch(r"[0-9a-f]{64}", expected):
                raise ValueError(f"missing approval input hash: {name}")
            hashes[name] = digest(safe_path(root, base / name))
            if hashes[name] != expected:
                blockers.append(f"approved assessment input changed: {name}")
        items = json.loads(safe_path(root, base / "items.json").read_text())
        audio = json.loads(safe_path(root, base / "audio-manifest.json").read_text())
        clips = audio if isinstance(audio, list) else audio["clips"]
        if (items.get("assessment_id") != exam_id or items.get("offering_id") != management["offering_id"]
                or items.get("cohort") != management["cohort"]):
            raise ValueError("assessment input identity mismatch")
        keys = exam["lesson_keys"]
        if not keys or items.get("lesson_keys") != keys or len(set(keys)) != len(keys):
            raise ValueError("assessment lesson scope mismatch")
        if any(not k.startswith(management["textbook_id"] + ":lesson-") for k in keys):
            raise ValueError("assessment textbook mismatch")
        questions = items["items"]
        numbers = [q["number"] for q in questions]
        if len(questions) != exam["question_count"] or sorted(numbers) != list(range(1, len(questions) + 1)):
            raise ValueError("question identity/count mismatch")
        audio_ids = [c["audio_id"] for c in clips]
        if len(clips) != exam["audio_count"] or len(set(audio_ids)) != len(audio_ids):
            raise ValueError("audio identity/count mismatch")
        mapped = []
        for clip in clips:
            path = safe_path(root, base / clip["file"])
            if path.parent != base / "audio" or digest(path) != clip["sha256"]:
                raise ValueError("audio hash/path mismatch")
            if not clip.get("transcript") and not clip.get("source_text"):
                raise ValueError("audio transcript is missing")
            linked = [q for q in questions if q["audio_id"] == clip["audio_id"]]
            expected_ids = [q.get("id", q["number"]) for q in linked]
            if not linked or clip["question_ids"] != expected_ids:
                raise ValueError("audio/question mapping mismatch")
            mapped.extend(q["number"] for q in linked)
        if sorted(mapped) != sorted(numbers) or any(q["lesson_key"] not in keys for q in questions):
            raise ValueError("question coverage/scope mismatch")
        result.update(output_dir=str(target), input_hashes=hashes, lesson_keys=keys,
                      offering_id=management["offering_id"], audio_count=len(clips),
                      question_count=len(questions), student_ready=False,
                      pending=exam.get("pending", []))
    except (ValueError, KeyError, OSError, TypeError, AttributeError) as error:
        blockers.append(str(error))
    result["status"] = "blocked" if blockers else "ready"
    return result
