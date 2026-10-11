"""Bounded official Kokoro Chinese samples, consuming every generator result."""
import hashlib
import html
import json
import os
from pathlib import Path
import time
from assessment_audio_gate import DIRECTORY, EXAM_ID, check_assessment_audio, digest
from w04_spoken_text import build_spoken_review

ROOT = Path(__file__).resolve().parents[1]
RUN = ROOT / ".agent/runs/w04-kokoro-samples-20261010"
BASE = ROOT / DIRECTORY
OUTPUT = BASE / "audio-repair-kokoro-v01"
MODEL = RUN / "models/kokoro-82m-v1.1-zh"
REPO_ID = "hexgrad/Kokoro-82M-v1.1-zh"
REVISION = "01e7505bd6a7a2ac4975463114c3a7650a9f7218"
SAMPLE_IDS = ["E04-B01", "E01-A02", "E03-A01", "E03-A02", "E03-C01", "E05-B01", "E08-C01", "E09-C01", "E04-C01"]
SETTINGS = {"repo_id": REPO_ID, "revision": REVISION, "voice": "zf_001", "lang_code": "z",
    "speed": 1.0, "device": "cpu", "dtype": "float32", "seed": 20261010,
    "frontend": "Misaki-0.9.4-ZHFrontend-1.1-unmodified",
    "postprocessing": "PCM16 serialization only; no trim/normalization/time stretch",
    "segmentation": "original source units only; consume all pipeline chunks; no digit splitting",
    "max_attempts_per_sample": 1}


def main():
    gate = check_assessment_audio(ROOT, EXAM_ID, str(OUTPUT), "2026-fall")
    if gate["status"] != "ready":
        raise RuntimeError(json.dumps(gate, ensure_ascii=False))
    if OUTPUT.exists():
        raise RuntimeError("isolated version already exists; never overwrite")
    rows = build_spoken_review(ROOT)
    dashboard_hash = digest(BASE / "dashboard.html")
    (RUN / "preflight.json").write_text(json.dumps(gate, ensure_ascii=False, indent=2))
    for name in ["HF_HOME", "HUGGINGFACE_HUB_CACHE", "TRANSFORMERS_CACHE"]:
        os.environ[name] = str(RUN / "hf-cache")
    os.environ["HF_HUB_OFFLINE"] = "1"
    os.environ["TRANSFORMERS_OFFLINE"] = "1"
    os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"
    import torch
    import numpy as np
    import soundfile as sf
    import jieba
    from kokoro import KModel, KPipeline
    cache = RUN / "jieba-cache"
    cache.mkdir(exist_ok=True)
    jieba.dt.tmp_dir = str(cache)
    jieba.dt.cache_file = "jieba.cache"
    torch.set_num_threads(4)
    torch.manual_seed(SETTINGS["seed"])
    model = KModel(repo_id=REPO_ID, config=str(MODEL / "config.json"),
                   model=str(MODEL / "kokoro-v1_1-zh.pth")).to("cpu").eval()
    def reject_english(text):
        raise RuntimeError(f"unexpected English in Chinese-only spoken text: {text!r}")
    pipeline = KPipeline(lang_code="z", repo_id=REPO_ID, model=model, en_callable=reject_english)
    voice = pipeline.load_voice(str(MODEL / "voices/zf_001.pt"))
    OUTPUT.mkdir()
    (OUTPUT / "units").mkdir()
    setting_hash = hashlib.sha256(json.dumps(SETTINGS, sort_keys=True).encode()).hexdigest()
    (OUTPUT / "settings.json").write_text(json.dumps({**SETTINGS, "settings_sha256": setting_hash}, indent=2))
    (OUTPUT / "spoken-text-review.json").write_text(json.dumps({"exam_id": EXAM_ID, "clips": rows}, ensure_ascii=False, indent=2))
    state = {"exam_id": EXAM_ID, "lesson_keys": gate["lesson_keys"], "phase": "bounded_sample_generation",
        "max_attempts": 1, "attempt_count": 1, "sample_ids": SAMPLE_IDS, "settings_sha256": setting_hash,
        "dashboard_sha256_before": dashboard_hash, "human_audio_acceptance": False,
        "batch_generation_authorized": False}
    (RUN / "state.json").write_text(json.dumps(state, ensure_ascii=False, indent=2))
    source = [json.loads(line) for line in (ROOT / "OmniVoice/audio/博雅汉语测验音频/题号音频清单.jsonl").read_text().splitlines()]
    records = []
    for audio_id in SAMPLE_IDS:
        fresh = check_assessment_audio(ROOT, EXAM_ID, str(OUTPUT), "2026-fall")
        if fresh["status"] != "ready" or fresh["input_hashes"] != gate["input_hashes"]:
            raise RuntimeError("source changed")
        row = next(r for r in rows if r["audio_id"] == audio_id)
        original = next(r for r in source if r["audio_id"] == audio_id)
        waveforms, units, pauses, cursor = [], [], [], 0
        for index, unit in enumerate(row["units"], 1):
            text = unit["spoken_text"]
            phonemes, _ = pipeline.g2p(text)
            if not phonemes or len(phonemes) > 510 or "❓" in phonemes:
                raise RuntimeError(f"empty/unknown/over-limit phonemes; reject potential truncation: {audio_id}/{index}")
            torch.manual_seed(SETTINGS["seed"])
            started = time.monotonic()
            # Consume the whole generator, never take only its first result.
            generated = list(pipeline(text, voice=voice, speed=SETTINGS["speed"], split_pattern=None))
            if not generated or "".join(r.graphemes for r in generated) != text:
                raise RuntimeError("grapheme coverage incomplete")
            if "".join(r.phonemes for r in generated) != phonemes:
                raise RuntimeError("phoneme coverage changed or truncated")
            chunks, chunk_records = [], []
            for chunk_index, result in enumerate(generated, 1):
                if result.audio is None:
                    raise RuntimeError("generator yielded no audio")
                a = result.audio.detach().cpu().numpy().astype(np.float32).reshape(-1)
                if not len(a) or not np.isfinite(a).all() or np.max(np.abs(a)) <= 1e-6 or np.max(np.abs(a)) >= 1:
                    raise RuntimeError("invalid/clipped/silent output")
                path = OUTPUT / f"units/{audio_id}-{index:02}-chunk-{chunk_index:02}.wav"
                sf.write(path, a, 24000, subtype="PCM_16")
                chunks.append(a)
                chunk_records.append({"file": str(path.relative_to(OUTPUT)), "sha256": digest(path),
                    "graphemes": result.graphemes, "phonemes": result.phonemes, "frames": len(a)})
            a = np.concatenate(chunks)
            path = OUTPUT / f"units/{audio_id}-{index:02}.wav"
            sf.write(path, a, 24000, subtype="PCM_16")
            units.append({**unit, "file": str(path.relative_to(OUTPUT)), "sha256": digest(path),
                "phonemes": phonemes, "phoneme_count": len(phonemes), "chunks": chunk_records,
                "all_generator_output_consumed": True, "duration_seconds": len(a)/24000,
                "settings_sha256": setting_hash, "generation_seconds": time.monotonic()-started})
            waveforms.append(a); cursor += len(a)
            if index <= len(row["pause_after_ms"]):
                frames = round(row["pause_after_ms"][index-1]*24)
                pauses.append({"start_frame": cursor, "frames": frames})
                waveforms.append(np.zeros(frames, dtype=np.float32)); cursor += frames
            print(audio_id, index, repr(text), round(len(a)/24000, 2), "chunks",len(generated),"phonemes",phonemes,flush=True)
        final_frames = round(original.get("final_silence_ms", 0)*24)
        if final_frames:
            pauses.append({"start_frame": cursor, "frames": final_frames});waveforms.append(np.zeros(final_frames,dtype=np.float32))
        joined = np.concatenate(waveforms)
        path = OUTPUT / f"{audio_id}.wav"
        sf.write(path, joined, 24000, subtype="PCM_16")
        records.append({"audio_id": audio_id, "question_numbers": row["question_numbers"],
            "file": path.name, "sha256": digest(path), "duration_seconds": len(joined)/24000,
            "units": units, "planned_silence": pauses, "settings_sha256": setting_hash,
            "play_count": row["play_count"], "internal_repeat": row["internal_repeat"],
            "content_status": "not_accepted_requires_checks_and_user_listening", "human_audio_acceptance": False})
        (OUTPUT / "sample-manifest.json").write_text(json.dumps({"exam_id": EXAM_ID,
            "settings": SETTINGS, "settings_sha256": setting_hash, "samples": records,
            "status": "samples_only_unapproved"}, ensure_ascii=False, indent=2))
    parts = []
    for clip in records:
        text = " ／ ".join(u["spoken_text"] for u in clip["units"])
        parts.append(f'<section><h2>{clip["audio_id"]} · 题{", ".join(map(str,clip["question_numbers"]))}</h2>'
            f'<p>{html.escape(text)}</p><audio controls preload="none" src="{clip["file"]}"></audio><p class="status">未验收；请核对声调、儿化、完整数字及自然度。</p></section>')
    page = '<!doctype html><html lang="zh-Hans"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kokoro中文测验小样本</title><style>body{font-family:"Times New Roman",KaiTi;font-size:22px;line-height:1.6;max-width:960px;margin:24px auto;padding:0 18px;background:white}section{border-top:1px solid #ccc;padding:16px 0}audio{width:100%}.status{color:#8a4100}</style><h1>Kokoro中文 · 难题小样本</h1><p>同一官方中文模型，固定zf_001、原速1.0。仅教师／使用者试听，尚未验收；原测验入口没有切换。</p><p><a href="quality-review.md">完整检查结果与限制</a> · <a href="role-identity-proposals.md">六题角色身份最小修正建议</a></p>' + ''.join(parts) + '</html>'
    (OUTPUT / "samples.html").write_text(page)
    assert digest(BASE / "dashboard.html") == dashboard_hash
    state.update(phase="needs_human", generated_samples=len(records),
        stop_reason="samples require actual quality checks and user listening; no batch generation or switch")
    (RUN / "state.json").write_text(json.dumps(state, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
