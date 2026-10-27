"""Reorder the current W07 draft without changing question content or source audio."""

from pathlib import Path
import csv
import hashlib
import json


ROOT = Path(__file__).resolve().parent
PROJECT = ROOT.parents[5]
ORDER = [
    40, 41, 42, 43, 44, 45, 46, 47,
    1, 2, 3, 4, 26, 27, 28, 29, 30, 31, 32, 33,
    5, 6, 7, 8, 10, 11, 14, 15, 16, 17, 18, 34, 36, 38, 39,
    48, 49, 50, 35, 12, 13, 9, 19, 20, 21, 23, 24, 25, 22, 37,
]
assert sorted(ORDER) == list(range(1, 51))


def read(name):
    return json.loads((ROOT / name).read_text())


def write(name, value):
    (ROOT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


bank = read("items.json")
assert bank["version"] == 3
old = {q["number"]: q for q in bank["items"]}
audio_old = {a["audio_id"]: a for a in read("audio-manifest.json")}
assert len(old) == 50 and len(audio_old) == 49

mapping = []
for new_number, old_number in enumerate(ORDER, 1):
    q = old[old_number]
    q["number"] = new_number
    q["version"] = 4
    q["previous_number"] = old_number
    mapping.append({
        "old_number": old_number,
        "new_number": new_number,
        "question_id": q["question_id"],
        "audio_id": q["audio_id"],
    })

items = [old[n] for n in ORDER]
bank["items"] = items
bank["version"] = 4
bank["status"] = "UNPUBLISHED_DRAFT_REORDERED_PENDING_FINAL_SYNC_AND_TEACHER_REVIEW"
bank["revision_basis"] = (
    "2026-10-23 Adam-approved difficulty reorder: TOCFL Novice Q1-8, "
    "basic picture recognition Q9-20, picture/dialogue comprehension Q21-35, "
    "detail and inference Q36-50. Question content, options, answers and source audio unchanged."
)
write("items.json", bank)
write("reorder-map-v4.json", {"exam_id": bank["exam_id"], "version": 4, "mapping": mapping})

groups = []
for q in items:
    if groups and groups[-1][0]["audio_id"] == q["audio_id"]:
        groups[-1].append(q)
    else:
        groups.append([q])
assert len(groups) == 49
audio = []
sections = []
for group_index, group in enumerate(groups, 1):
    a = audio_old[group[0]["audio_id"]]
    first, last = group[0]["number"], group[-1]["number"]
    qrange = str(first) if first == last else f"{first}–{last}"
    old_title = a["section_title"]
    suffix = old_title.split("题｜", 1)[1]
    a["question_range"] = qrange
    a["section_title"] = f"第{qrange}题｜{suffix}"
    a["question_ids"] = [q["question_id"] for q in group]
    audio.append(a)
    sections.append({
        "id": f"w07-v4-g{group_index}",
        "title": a["section_title"],
        "question_start": first,
        "question_end": last,
        "audio_ids": [a["audio_id"]],
        "description": "先看题目，再听录音，选出一个正确答案。每段录音播放两遍。",
    })
write("audio-manifest.json", audio)
write("form-sections.json", {
    "assessment_id": bank["exam_id"], "version": 4,
    "status": "FORM_REORDERED_PENDING_FULL_ANSWER_KEY_READBACK", "sections": sections,
})

with (ROOT / "audio-map.csv").open("w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["audio_id", "audio_path", "question_range", "play_count", "duration_seconds", "sha256", "source_type"])
    for a in audio:
        w.writerow([a["audio_id"], str((ROOT / a["file"]).relative_to(PROJECT)), a["question_range"], a["play_count"], f"{a['duration_seconds']:.6f}", a["sha256"], a["source_status"]])

student = [
    "# 一年级 W07｜第4—15课累计听力练习（审阅稿）", "",
    "共50题，每题2分，满分100分。先看题目，再听录音，选出一个正确答案。每段录音播放两遍。", "",
]
teacher = [
    "# W07 第4—15课累计听力练习｜教师答案（审阅稿）", "",
    "50题，每题2分，共100分。第1—8题使用TOCFL准备级原题原音；第40—41题共用博雅第15课15-11原题原音。其余TOCFL题目依图片辨认、短对话细节到信息整合的顺序排列。", "",
    "题目、选项、答案与原音内容未改；只调整题号和播放顺序。教师完整亲听与教室音箱验收待完成，表单未发布。", "",
]
for q in items:
    student += [f"## {q['number']}. {q['prompt']}", ""]
    if q.get("option_image"):
        student += [f"![本题图片]({(PROJECT / q['option_image']).as_posix()})", ""]
    student += [f"{chr(65 + i)}. {option}" for i, option in enumerate(q["options"])] + [""]
    teacher += [
        f"## 第{q['number']}题｜答案{q['answer']}｜2分",
        f"- 答案内容：{q['answer_text']}",
        f"- 依据：{q['evidence']}",
        f"- 音频：{q['audio_id']}；播放两遍。", "",
    ]
(ROOT / "student.md").write_text("\n".join(student))
(ROOT / "teacher.md").write_text("\n".join(teacher))

with (ROOT / "topic-coverage.csv").open("w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["lesson_key", "question_numbers", "coverage_limit"])
    for lesson in bank["lesson_keys"]:
        w.writerow([lesson, "，".join(str(q["number"]) for q in items if lesson in q.get("lesson_keys", [])), "交际主题抽样，不代表该课全部词语语法已掌握"])

source = read("source-manifest.json")
source["question_source_ids"] = [q.get("source_question_id") or q["audio_id"] for q in items if not q["source_type"].startswith("boya_")]
source["selection"] = "现行v4：准备级第1–8题；基础图片第9–20题；图片与短对话第21–35题；细节及推断第36–50题。题目和音频来源不变。"
source["human_gates"]["external_form_sheet_sync"] = "pending_full_readback"
write("source-manifest.json", source)

write("content-qa.json", {
    "exam_id": bank["exam_id"], "version": 4, "question_count": 50,
    "points": 100, "audio_count": 49, "question_group_count": 49,
    "numbering_contiguous": True, "all_novice_first": True,
    "question_content_changed": False, "audio_bytes_changed": False,
    "remote_sync": "pending_full_readback", "teacher_full_listening": "pending",
    "classroom_speaker_acceptance": "pending", "content_approved": False,
    "publication_authorized": False,
})

sync = read("form-sync.json")
sync.update(status="FORM_REORDERED_SHEETS_PENDING_FULL_READBACK", question_version=4,
            question_bank_sha256=sha(ROOT / "items.json"), previous_readback_stale=True,
            publication_authorized=False, content_approved=False,
            pending=["Sheet v4 update and readback", "Form 50-answer-key readback", "dashboard v4 playback", "teacher full listening", "classroom speaker acceptance"])
write("form-sync.json", sync)

management_path = PROJECT / "lessons/boya-elementary-i/assessment-management.json"
management = json.loads(management_path.read_text())
exam = next(e for e in management["exams"] if e["exam_id"] == bank["exam_id"])
exam.update(status="DRAFT_V4_REORDERED_PENDING_FULL_SYNC_UNPUBLISHED", question_version=4,
            question_bank_sha256=sha(ROOT / "items.json"), dashboard_browser_load_start_replay_verified=0,
            sync_verification_evidence=None, draft_form_readback_verified=False,
            scope_decision=bank["revision_basis"], student_ready=False,
            publication_authorized=False, content_approved=False)
management_path.write_text(json.dumps(management, ensure_ascii=False, indent=2) + "\n")

print("v4 reordered 50 questions, 49 groups; bytes of audio files unchanged")
