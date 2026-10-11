"""Generate version-bound W04 audio into an isolated local review directory."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
import time
import wave
import re
import shutil

from assessment_audio_gate import EXAM_ID, DIRECTORY, check_assessment_audio, digest

ROOT = Path(__file__).resolve().parents[1]
MODEL = ROOT / ".agent/runs/boya-elementary-i-l09-l10-video-20261005/staging/video/models/qwen-custom-voice-1.7b-4bit"
OUTPUT = ROOT / DIRECTORY / "audio-repair-qwen-serena-v01"
RUN = ROOT / ".agent/runs/w04-audio-repair-qwen-20261010"
REPRESENTATIVES = ["E01-A02", "E03-C01", "E04-A01", "E08-B01", "E09-C01"]


def preflight():
    result = check_assessment_audio(ROOT, EXAM_ID, str(OUTPUT), "2026-fall")
    if result["status"] != "ready":
        raise RuntimeError(json.dumps(result, ensure_ascii=False))
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--samples-only", action="store_true")
    parser.add_argument("--retry-ids", nargs="*", default=[])
    parser.add_argument("--phone-digits", action="store_true")
    args = parser.parse_args()
    gate = preflight()
    live_html = (ROOT / DIRECTORY / "dashboard.html").read_text()
    if f'"file": "{OUTPUT.name}/' in live_html:
        raise RuntimeError("output is already linked by the live local dashboard; use a new isolated version, never regenerate in place")
    RUN.mkdir(parents=True, exist_ok=True)
    (RUN / "preflight.json").write_text(json.dumps(gate, ensure_ascii=False, indent=2))
    state = {"exam_id": EXAM_ID, "lesson_keys": gate["lesson_keys"], "offering_id": "2026-fall",
             "phase": "generating", "artifact_state": "design_draft", "human_audio_acceptance": False,
             "gate": str(RUN / "preflight.json"), "model": str(MODEL), "output": str(OUTPUT)}
    (RUN / "state.json").write_text(json.dumps(state, ensure_ascii=False, indent=2))
    os.environ["HF_HUB_OFFLINE"] = "1"
    os.environ["TRANSFORMERS_OFFLINE"] = "1"
    import mlx.core as mx
    import numpy as np
    from mlx_audio.tts.utils import load_model
    def write_wav(path, data):
        with wave.open(str(path), "wb") as output:
            output.setnchannels(1); output.setsampwidth(2); output.setframerate(24000)
            output.writeframes((np.clip(data, -1, 1) * 32767).astype("<i2").tobytes())
    def read_wav(path):
        with wave.open(str(path), "rb") as source:
            if source.getframerate() != 24000 or source.getnchannels() != 1 or source.getsampwidth() != 2:
                raise RuntimeError("unexpected PCM format")
            return np.frombuffer(source.readframes(source.getnframes()), dtype="<i2").astype(np.float32)/32768
    model = load_model(str(MODEL))
    print("supported speakers", model.supported_speakers, flush=True)
    OUTPUT.mkdir(exist_ok=True)
    units_dir = OUTPUT / "units"
    units_dir.mkdir(exist_ok=True)
    comparison = OUTPUT / "comparison"
    comparison.mkdir(exist_ok=True)
    clips = json.loads((ROOT / DIRECTORY / "audio-manifest.json").read_text())["clips"]
    source = [json.loads(x) for x in (ROOT / "OmniVoice/audio/博雅汉语测验音频/题号音频清单.jsonl").read_text().splitlines()]
    selected = [next(c for c in clips if c["audio_id"] == key) for key in REPRESENTATIVES]
    if not args.samples_only:
        selected += [c for c in clips if c["audio_id"] not in REPRESENTATIVES]
    if args.retry_ids:
        if not set(args.retry_ids).issubset({c["audio_id"] for c in clips}):
            raise RuntimeError("unknown retry audio ID")
        selected = [c for c in clips if c["audio_id"] in args.retry_ids]
    manifest_path = OUTPUT / "repair-manifest.json"
    records = json.loads(manifest_path.read_text())["clips"] if manifest_path.exists() else []
    if args.retry_ids:
        rejected = OUTPUT / f"rejected-v{len(list(OUTPUT.glob('rejected-v*'))) + 1:02}"
        rejected.mkdir()
        shutil.copy2(manifest_path, rejected / "repair-manifest.json")
        for key in args.retry_ids:
            shutil.copy2(OUTPUT / f"{key}.wav", rejected / f"{key}.wav")
            for path in units_dir.glob(f"{key}-*.wav"):
                shutil.copy2(path, rejected / path.name)
        records = [r for r in records if r["audio_id"] not in args.retry_ids]
    for clip in selected:
        preflight()
        audio_id = clip["audio_id"]
        row = next(x for x in source if x["audio_id"] == audio_id)
        if any(r["audio_id"] == audio_id for r in records):
            print("resume", audio_id, flush=True)
            continue
        chunks, units, boundaries = [], [], []
        sample_rate, cursor = 24000, 0
        for n, text in enumerate(clip["speech_units"]):
            mx.random.seed(20261010 + clip["order"] * 10 + n)
            start = time.monotonic()
            subunits = re.findall(r"[^。！？]+[。！？]?", text) if args.retry_ids and len(text) > 24 else [text]
            if args.phone_digits and audio_id == "E09-C01":
                # Expand the unchanged 11-digit sequence into separately recorded
                # syllables. Concatenate native audio without inserting any gap.
                phone = "老师的办公室电话是零一零，零零零零，二三零一。"
                if subunits[-1] != phone:
                    raise RuntimeError("phone transcript drift")
                subunits = subunits[:-1] + ["老师的办公室电话是", "零", "一", "零，",
                    "零", "零", "零", "零，", "二", "三", "零", "一。"]
            subrecords, generated = [], []
            # Internal repeats share the same syllable waveform, retaining source gaps.
            if args.retry_ids and clip["internal_repeat"] and n >= 3:
                a = read_wav(units_dir / f"{audio_id}-{n-2:02}.wav")
                token_count = units[n-3]["tokens"]
                subrecords = [{"text": text, "reused_unit": n-2}]
            else:
                token_count = 0
                for j, subtext in enumerate(subunits):
                    spoken = subtext + "。" if args.retry_ids and len(subtext) <= 2 and not subtext.endswith("。") else subtext
                    results = list(model.generate_custom_voice(
                        text=spoken, speaker="Serena", language="Chinese",
                        instruct="用标准普通话清晰、自然地朗读给定文字，不添加其他内容。",
                        temperature=0.4 if args.retry_ids else 0.6, top_p=0.9, repetition_penalty=1.1, max_tokens=4096,
                        verbose=False, stream=False))
                    if len(results) != 1 or results[0].token_count >= 4096:
                        raise RuntimeError(f"incomplete token generation: {audio_id}/{n}")
                    result = results[0]
                    part = np.asarray(result.audio, dtype=np.float32).reshape(-1)
                    if result.sample_rate != sample_rate or not len(part) or not np.isfinite(part).all() or np.max(np.abs(part)) < 1e-5:
                        raise RuntimeError(f"invalid unit: {audio_id}/{n}")
                    if args.retry_ids and len(subtext) <= 2 and len(part)/sample_rate > 2.5:
                        raise RuntimeError(f"single syllable outlier: {audio_id}/{n}")
                    generated.append(part); token_count += result.token_count
                    subpath = units_dir / f"{audio_id}-{n+1:02}-part-{j+1:02}.wav"
                    write_wav(subpath, part)
                    subrecords.append({"text": subtext, "tts_text": spoken, "file": str(subpath.relative_to(OUTPUT)),
                                       "duration_seconds": len(part)/sample_rate, "tokens": result.token_count})
                a = np.concatenate(generated)
            raw = units_dir / f"{audio_id}-{n+1:02}-raw.wav"
            write_wav(raw, a)
            unit_path = units_dir / f"{audio_id}-{n+1:02}.wav"
            if clip["source_speed"] != 1:
                subprocess.run(["/opt/homebrew/bin/ffmpeg", "-v", "error", "-y", "-i", str(raw),
                                "-af", f"atempo={clip['source_speed']}", "-ar", "24000", "-ac", "1", str(unit_path)], check=True)
                a = read_wav(unit_path)
            else:
                write_wav(unit_path, a)
            chunks.append(a)
            units.append({"text": text, "file": str(unit_path.relative_to(OUTPUT)), "sha256": digest(unit_path),
                          "start_seconds": cursor / sample_rate, "duration_seconds": len(a) / sample_rate,
                          "tokens": token_count, "subunits": subrecords, "generation_seconds": time.monotonic() - start})
            cursor += len(a)
            if n < len(clip["pause_after_ms"]):
                frames = round(sample_rate * clip["pause_after_ms"][n] / 1000)
                boundaries.append({"start_frame": cursor, "frames": frames, "kind": "planned_turn_pause"})
                chunks.append(np.zeros(frames, dtype="float32")); cursor += frames
            print(audio_id, n+1, text, "seconds", round(len(a)/sample_rate, 2), flush=True)
        final_frames = round(sample_rate * row.get("final_silence_ms", 0) / 1000)
        if final_frames:
            boundaries.append({"start_frame": cursor, "frames": final_frames, "kind": "planned_final_silence"})
            chunks.append(np.zeros(final_frames, dtype="float32"))
        path = OUTPUT / f"{audio_id}.wav"
        write_wav(path, np.concatenate(chunks))
        record = {**clip, "file": path.name, "sha256": digest(path), "duration_seconds": len(read_wav(path))/sample_rate,
                  "model": "Qwen3-TTS-1.7B-CustomVoice-4bit", "speaker": "Serena", "max_tokens": 4096,
                  "units": units, "planned_silence": boundaries, "final_silence_ms": row.get("final_silence_ms", 0),
                  "decode_status": "pass", "pronunciation_status": "teacher_listening_pending",
                  "content_status": "asr_and_teacher_review_pending"}
        records.append(record)
        manifest_path.write_text(json.dumps({"exam_id": EXAM_ID, "status": "technical_review_pending",
            "gate_input_hashes": gate["input_hashes"], "clips": sorted(records, key=lambda r: r["order"])}, ensure_ascii=False, indent=2))
        if audio_id in REPRESENTATIVES:
            say_parts = []
            for n, text in enumerate(clip["speech_units"]):
                part = comparison / f"{audio_id}-{n+1:02}-tingting.aiff"
                subprocess.run(["/usr/bin/say", "-v", "Tingting", "-r", "160", "-o", str(part), text], check=True)
                wav = part.with_suffix(".wav")
                subprocess.run(["/opt/homebrew/bin/ffmpeg", "-v", "error", "-y", "-i", str(part), "-ar", "24000", "-ac", "1", str(wav)], check=True)
                a = read_wav(wav); say_parts.append(a)
                if n < len(clip["pause_after_ms"]):
                    say_parts.append(np.zeros(round(sample_rate * clip["pause_after_ms"][n]/1000)))
            if final_frames:
                say_parts.append(np.zeros(final_frames))
            write_wav(comparison / f"{audio_id}-tingting.wav", np.concatenate(say_parts))
        mx.clear_cache()
    state["phase"] = "samples_ready" if args.samples_only else "verifying"
    state["generated_clips"] = len(records)
    (RUN / "state.json").write_text(json.dumps(state, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
