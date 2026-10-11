"""Authorized minimal identity cues for the isolated W04 Kokoro candidate."""
from w04_spoken_text import build_spoken_review

EDITS = {
    ("E05-B01", 4): ("我也是英国人，认识你很高兴。", "我叫小王。我也是英国人，认识你很高兴。", "自然自我介紹識別小王，國籍原句保留", [15]),
    ("E06-B01", 1): ("这是谁的笔？是你的吗？", "小王，这是谁的笔？是你的吗？", "自然稱呼確立回答者，李美與本子所有權不變", [18]),
    ("E07-B01", 1): ("你住在学校里吗？", "小王，你住在学校里吗？", "自然稱呼識別住處回答者，否定與東邊線索不變", [20, 21]),
    ("E08-B01", 1): ("今晚六点一起吃饭吧。", "小王，今晚六点一起吃饭吧。", "自然稱呼識別有課者，六點／七點／七點半不變", [23]),
    ("E10-B01", 2): ("三块钱一斤。", "小林，三块钱一斤。", "賣方自然稱呼買方，價格、兩斤、付款不變", [30]),
}


def build_repair_review(root):
    rows = build_spoken_review(root)
    changes = []
    for row in rows:
        for index, unit in enumerate(row["units"], 1):
            key = row["audio_id"], index
            if key not in EDITS:
                continue
            before, after, reason, questions = EDITS[key]
            if unit["spoken_text"] != before:
                raise ValueError(f"identity cue source drift: {key}")
            unit["clean_text_before_identity_repair"] = before
            unit["spoken_text"] = after
            unit["change"] = "remove_role_label_and_add_authorized_natural_identity_cue"
            changes.append({"audio_id": key[0], "turn": index, "before": before,
                            "after": after, "reason": reason, "questions": questions,
                            "question_answer_mapping": row["question_answer_mapping"]})
        row["identity_cue_repair"] = [x for x in changes if x["audio_id"] == row["audio_id"]]
    if len(changes) != 5 or sorted(q for c in changes for q in c["questions"]) != [15, 18, 20, 21, 23, 30]:
        raise ValueError("identity cue coverage incomplete")
    return rows, changes
