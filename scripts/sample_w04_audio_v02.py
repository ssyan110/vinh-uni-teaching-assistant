"""One bounded, uniform local Qwen/Serena sample set; never switch dashboards."""
import hashlib
import html
import json
import os
from pathlib import Path
import time
import wave

from assessment_audio_gate import DIRECTORY, EXAM_ID, check_assessment_audio, digest
from w04_spoken_text import build_spoken_review

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / DIRECTORY
OUTPUT = BASE / "audio-repair-qwen-serena-v02"
RUN = ROOT / ".agent/runs/w04-audio-samples-v02-20261011"
MODEL = ROOT / ".agent/runs/boya-elementary-i-l09-l10-video-20261005/staging/video/models/qwen-custom-voice-1.7b-4bit"
SAMPLES = ["E04-B01", "E01-A02", "E03-A01", "E03-C01", "E05-B01", "E08-C01", "E09-C01", "E04-C01"]
SETTINGS = {
    "model": str(MODEL.relative_to(ROOT)), "speaker": "Serena", "language": "Chinese",
    "instruct": "用标准普通话，平稳自然、清楚地朗读原文，语速均匀。保持准确声调和儿化。不添加、遗漏或改写文字。",
    "temperature": 0.3, "top_p": 0.9, "top_k": 50, "repetition_penalty": 1.1,
    "max_tokens": 4096, "seed": 20261011, "stream": False,
    "speech_rate": "native_uniform_instruction_no_time_stretch",
    "postprocessing": "PCM16_conversion_only_no_trim_no_normalization_no_time_stretch",
    "segment_policy": "exact_original_units_with_role_label_removed; no sentence_or_digit_splitting",
    "retry_limit": 0,
}


def main():
    gate = check_assessment_audio(ROOT, EXAM_ID, str(OUTPUT), "2026-fall")
    if gate["status"] != "ready":
        raise RuntimeError(json.dumps(gate, ensure_ascii=False))
    if OUTPUT.exists():
        raise RuntimeError("v02 already exists: do not overwrite or silently resume with different settings")
    rows = build_spoken_review(ROOT)
    main_hash = digest(BASE / "dashboard.html")
    OUTPUT.mkdir()
    (OUTPUT / "units").mkdir()
    RUN.mkdir(exist_ok=True)
    (RUN / "preflight.json").write_text(json.dumps(gate, ensure_ascii=False, indent=2))
    (OUTPUT / "spoken-text-review.json").write_text(json.dumps({"exam_id": EXAM_ID,
        "scope": "all_33_clips_50_questions", "source_hashes": gate["input_hashes"],
        "status": "role_label_cleanup_authorized_questions_unchanged", "clips": rows}, ensure_ascii=False, indent=2))
    settings_hash = hashlib.sha256(json.dumps(SETTINGS, sort_keys=True, ensure_ascii=False).encode()).hexdigest()
    (OUTPUT / "settings.json").write_text(json.dumps({**SETTINGS, "settings_sha256": settings_hash}, ensure_ascii=False, indent=2))
    state = {"exam_id": EXAM_ID, "lesson_keys": gate["lesson_keys"], "phase": "bounded_sample_generation",
        "attempt_count": 1, "max_attempts": 1, "sample_ids": SAMPLES, "batch_generation_authorized": False,
        "dashboard_sha256_before": main_hash, "settings_sha256": settings_hash, "human_audio_acceptance": False,
        "prior_version": "user_rejected_v01", "output": str(OUTPUT)}
    (RUN / "state.json").write_text(json.dumps(state, ensure_ascii=False, indent=2))
    lines = ["# 全33档原稿／纯台词对照", "", "原文件、题目和答案未修改。只移除台词前角色标记；角色资料不送入TTS。", "",
        "第15、18、20、21、23、30题：删除角色播报、使用同一声线后，姓名与说话人的对应可能不足。保留待决，不改题目。", ""]
    for row in rows:
        lines += [f"## {row['audio_id']} · 题{','.join(map(str,row['question_numbers']))}", "", "原稿：", row["source_text"], "",
            "|角色中继资料（不朗读）|旧TTS输入|纯台词（TTS唯一正文）|", "|---|---|---|"]
        for unit in row["units"]:
            lines.append(f"|{unit['speaker'] or '—'}|{unit['original_tts_input']}|{unit['spoken_text']}|")
        lines += ["", "题目／答案：" + "；".join(f"{q['number']} {q['prompt']} → {q['answer']}" for q in row["question_answer_mapping"]), ""]
    (OUTPUT / "spoken-text-review.md").write_text("\n".join(lines))
    os.environ["HF_HUB_OFFLINE"] = "1"
    os.environ["TRANSFORMERS_OFFLINE"] = "1"
    import mlx.core as mx
    import numpy as np
    from mlx_audio.tts.utils import load_model
    model = load_model(str(MODEL))
    source = [json.loads(line) for line in (ROOT / "OmniVoice/audio/博雅汉语测验音频/题号音频清单.jsonl").read_text().splitlines()]
    records = []
    def write(path, data):
        if np.max(np.abs(data)) >= 1:
            raise RuntimeError("raw full-scale clipping: do not normalize away the failure")
        with wave.open(str(path), "wb") as f:
            f.setnchannels(1); f.setsampwidth(2); f.setframerate(24000)
            f.writeframes(np.rint(data*32767).astype("<i2").tobytes())
    for key in SAMPLES:
        current = check_assessment_audio(ROOT, EXAM_ID, str(OUTPUT), "2026-fall")
        if current["status"] != "ready" or current["input_hashes"] != gate["input_hashes"]:
            raise RuntimeError("source changed during bounded sample run")
        row = next(r for r in rows if r["audio_id"] == key)
        raw = next(r for r in source if r["audio_id"] == key)
        chunks, units, pauses, cursor = [], [], [], 0
        for number, unit in enumerate(row["units"], 1):
            mx.random.seed(SETTINGS["seed"])
            started = time.monotonic()
            # Speaker and all metadata are intentionally excluded from this call.
            result = list(model.generate_custom_voice(text=unit["spoken_text"],
                speaker=SETTINGS["speaker"], language=SETTINGS["language"], instruct=SETTINGS["instruct"],
                temperature=SETTINGS["temperature"], top_p=SETTINGS["top_p"], top_k=SETTINGS["top_k"],
                repetition_penalty=SETTINGS["repetition_penalty"], max_tokens=SETTINGS["max_tokens"],
                verbose=False, stream=False))
            if len(result) != 1 or result[0].token_count >= 4096 or result[0].sample_rate != 24000:
                raise RuntimeError("generation did not finish normally; stop this bounded run")
            a = np.asarray(result[0].audio, dtype=np.float32).reshape(-1)
            if not len(a) or not np.isfinite(a).all() or np.max(np.abs(a)) < 1e-5:
                raise RuntimeError("empty/silent/nonfinite generation")
            filename = f"units/{key}-{number:02}.wav"
            write(OUTPUT / filename, a)
            units.append({**unit, "file": filename, "sha256": digest(OUTPUT / filename),
                "duration_seconds": len(a)/24000, "tokens": result[0].token_count,
                "start_frame": cursor, "settings_sha256": settings_hash,
                "generation_seconds": time.monotonic()-started})
            chunks.append(a); cursor += len(a)
            if number <= len(row["pause_after_ms"]):
                count = round(row["pause_after_ms"][number-1]*24)
                pauses.append({"start_frame": cursor, "frames": count})
                chunks.append(np.zeros(count, dtype=np.float32)); cursor += count
            print(key, number, repr(unit["spoken_text"]), round(len(a)/24000, 2), flush=True)
        final = round(raw.get("final_silence_ms", 0)*24)
        if final:
            pauses.append({"start_frame": cursor, "frames": final}); chunks.append(np.zeros(final, dtype=np.float32))
        path = OUTPUT / f"{key}.wav"
        combined = np.concatenate(chunks); write(path, combined)
        records.append({"audio_id": key, "question_numbers": row["question_numbers"], "file": path.name,
            "sha256": digest(path), "duration_seconds": len(combined)/24000, "units": units,
            "settings_sha256": settings_hash, "planned_silence": pauses, "play_count": row["play_count"],
            "internal_repeat": row["internal_repeat"], "source_speed": row["source_speed"],
            "content_status": "not_passed_requires_two_asr_checks_and_user_listening",
            "human_audio_acceptance": False})
        (OUTPUT / "sample-manifest.json").write_text(json.dumps({"exam_id": EXAM_ID,
            "status": "samples_only_not_accepted", "settings_sha256": settings_hash,
            "settings": SETTINGS, "samples": records}, ensure_ascii=False, indent=2))
        mx.clear_cache()
    sections = []
    for clip in records:
        row = next(r for r in rows if r["audio_id"] == clip["audio_id"])
        body = " ／ ".join(u["spoken_text"] for u in row["units"])
        sections.append(f'<section><h2>{clip["audio_id"]} · 题{", ".join(map(str,clip["question_numbers"]))}</h2>'
            f'<p class="text">{html.escape(body)}</p><audio controls preload="none" src="{clip["file"]}"></audio>'
            '<p>请核对：内容是否完整、声调是否正确、是否读出角色标记、音色与语速是否自然一致。</p></section>')
    page = '<!doctype html><html lang="zh-Hans"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>第1–10课测验｜v02小样本</title><style>body{font-family:"Times New Roman",KaiTi;max-width:960px;margin:24px auto;padding:0 18px;font-size:22px;line-height:1.6;background:#fff;color:#222}section{border-top:1px solid #ccc;padding:18px 0}audio{width:100%}.text{background:#f4f6f8;padding:16px}</style><h1>第1–10课测验 · v02小样本</h1><p>教师／使用者试听，尚未通过。所有样本使用同一模型、Serena和同一套设置。角色标记已移除，台词内必要的人名保留。</p><p>电话是完整段落一次生成；拼音用原已核对汉字输入，不读字母。请先核对这些样本，再决定是否重制整卷。</p><p><a href="spoken-text-review.md">全33档原稿／纯台词对照</a> · <a href="quality-review.md">检查结果</a></p>' + ''.join(sections) + '</html>'
    (OUTPUT / "samples.html").write_text(page)
    assert digest(BASE / "dashboard.html") == main_hash, "dashboard must remain unchanged"
    state.update(phase="needs_human", generated_samples=len(records), stop_reason="bounded samples await actual quality checks; no batch generation or switch")
    (RUN / "state.json").write_text(json.dumps(state, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
