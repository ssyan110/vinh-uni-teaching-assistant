"""Verify isolated W04 PCM assembly and optionally switch local review links."""
import argparse
import json
from pathlib import Path
import re
import shutil
import subprocess
import wave
from assessment_audio_gate import DIRECTORY, EXAM_ID, check_assessment_audio, digest

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / DIRECTORY
OUTPUT = BASE / "audio-repair-qwen-serena-v01"
RUN = ROOT / ".agent/runs/w04-audio-repair-qwen-20261010"
ORIGINAL_DASHBOARD_HASH = "1862faf69b6f43d36a52c38a34f872375318bdc399fb762433304cd086363792"


def pcm(path):
    import numpy as np
    with wave.open(str(path), "rb") as source:
        assert (source.getframerate(), source.getnchannels(), source.getsampwidth()) == (24000, 1, 2), path
        return np.frombuffer(source.readframes(source.getnframes()), dtype="<i2").astype(np.int32)


def main():
    import numpy as np
    parser = argparse.ArgumentParser()
    parser.add_argument("--switch-local-links", action="store_true")
    args = parser.parse_args()
    gate = check_assessment_audio(ROOT, EXAM_ID, str(OUTPUT), "2026-fall")
    assert gate["status"] == "ready", gate
    original = json.loads((BASE / "audio-manifest.json").read_text())["clips"]
    manifest_path = OUTPUT / "repair-manifest.json"
    manifest = json.loads(manifest_path.read_text())
    clips = manifest["clips"]
    assert manifest["exam_id"] == EXAM_ID and len(clips) == 33
    assert [c["audio_id"] for c in clips] == [c["audio_id"] for c in original]
    asr = json.loads((OUTPUT / "content-asr.json").read_text())
    assert len(asr) == 33
    results = []
    for new, old in zip(clips, original, strict=True):
        for key in ("audio_id", "question_ids", "question_numbers", "speech_units", "source_text", "pause_after_ms",
                    "source_speed", "play_count", "internal_repeat", "preview_seconds", "between_plays_seconds", "answer_seconds"):
            assert new[key] == old[key], (new["audio_id"], key)
        assert len(new["units"]) == len(old["speech_units"])
        assembled, cursor = [], 0
        boundaries = []
        for n, unit in enumerate(new["units"]):
            assert unit["text"] == old["speech_units"][n]
            subunits = unit.get("subunits", [])
            if subunits:
                assert "".join(s["text"] for s in subunits) == unit["text"]
                assert all(s.get("tokens", 1) < 4096 for s in subunits)
            file = OUTPUT / unit["file"]
            assert file.resolve().is_relative_to(OUTPUT.resolve()) and not file.is_symlink()
            assert digest(file) == unit["sha256"]
            a = pcm(file); assert len(a) and np.max(np.abs(a)) > 1
            assembled.append(a); cursor += len(a)
            if n < len(new["pause_after_ms"]):
                frames = round(24 * new["pause_after_ms"][n])
                boundaries.append((cursor, frames)); assembled.append(np.zeros(frames, np.int32)); cursor += frames
        final = round(24 * new["final_silence_ms"])
        if final:
            boundaries.append((cursor, final)); assembled.append(np.zeros(final, np.int32))
        file = OUTPUT / new["file"]
        assert file.parent == OUTPUT and not file.is_symlink() and digest(file) == new["sha256"]
        a = pcm(file); expected = np.concatenate(assembled)
        assert len(a) == len(expected) and np.max(np.abs(a - expected)) <= 2
        assert all(np.count_nonzero(a[start:start+frames]) == 0 for start, frames in boundaries)
        assert np.max(np.abs(a)) < 32767
        if new["internal_repeat"]:
            for n in range(3):
                first = pcm(OUTPUT / new["units"][n]["file"])
                second = pcm(OUTPUT / new["units"][n+3]["file"])
                assert len(first) == len(second) and np.max(np.abs(first-second)) <= 2
        transcript = next(r for r in asr if r["audio_id"] == new["audio_id"])
        assert transcript["audio_sha256"] == digest(file)
        assert transcript["expected_text"] == "".join(old["speech_units"])
        subprocess.run(["/opt/homebrew/bin/ffmpeg", "-v", "error", "-i", str(file), "-f", "null", "-"], check=True, capture_output=True)
        active = np.flatnonzero(np.abs(a) > max(np.max(np.abs(a))*.01, 3))
        results.append({"audio_id": new["audio_id"], "decode": "pass", "assembly": "pass",
            "source_text_unchanged": True, "planned_silence": "pass", "repeat": "pass",
            "duration_seconds": len(a)/24000, "tail_below_minus40db_seconds": float((len(a)-1-active[-1])/24000),
            "sha256": digest(file), "asr_text": transcript["asr_text"], "pronunciation_status": "teacher_listening_pending"})
    report = {"exam_id": EXAM_ID, "status": "technical_pass_teacher_listening_pending",
        "clips": results, "original_files_unchanged": True, "human_audio_acceptance": False,
        "limitations": ["Single syllable/tone accuracy requires teacher listening.",
            "ASR homophone ambiguities remain for 哪国人/辅导老师 and repeated phonetic syllables.",
            "Phone digit count is verified by 11 separately recorded syllables; ASR is unreliable for repeated zeros."]}
    (OUTPUT / "verification.json").write_text(json.dumps(report, ensure_ascii=False, indent=2))
    html = (BASE / "dashboard.html").read_text()
    match = re.search(r'(<script id="track-data" type="application/json">)(.*?)(</script>)', html, re.S)
    tracks = json.loads(match[2])
    assert [t["audio_id"] for t in tracks] == [c["audio_id"] for c in clips]
    new_tracks = []
    for track, clip in zip(tracks, clips, strict=True):
        modified = dict(track)
        modified.update(file=clip["file"], duration_seconds=clip["duration_seconds"])
        new_tracks.append(modified)
    def render(updated):
        return html[:match.start(2)] + json.dumps(updated, ensure_ascii=False) + html[match.end(2):]
    (OUTPUT / "dashboard.html").write_text(render(new_tracks))
    shutil.copyfile(BASE / "dashboard.js", OUTPUT / "dashboard.js")
    subprocess.run(["/usr/local/bin/node", str(BASE / "evidence/test-dashboard.cjs"), str(OUTPUT)], check=True)
    if args.switch_local_links:
        assert digest(BASE / "dashboard.html") == ORIGINAL_DASHBOARD_HASH, "dashboard changed during repair; do not overwrite user changes"
        backup = RUN / "backup"
        backup.mkdir(exist_ok=True)
        assert not (backup / "dashboard.html").exists(), "backup already exists; do not replace it"
        shutil.copy2(BASE / "dashboard.html", backup / "dashboard.html")
        shutil.copy2(BASE / "dashboard.js", backup / "dashboard.js")
        linked = [{**t, "file": f"{OUTPUT.name}/{t['file']}"} for t in new_tracks]
        temp = BASE / ".dashboard-audio-repair.tmp"
        assert not temp.exists()
        temp.write_text(render(linked))
        # Recheck immediately before replacing the single local link document.
        assert digest(BASE / "dashboard.html") == ORIGINAL_DASHBOARD_HASH
        temp.replace(BASE / "dashboard.html")
        switched_hash = digest(BASE / "dashboard.html")
        try:
            subprocess.run(["/usr/local/bin/node", str(BASE / "evidence/test-dashboard.cjs"), str(BASE)], check=True)
            for staged, local in zip(new_tracks, linked, strict=True):
                assert (OUTPUT / staged["file"]).resolve() == (BASE / local["file"]).resolve()
                assert (BASE / local["file"]).is_file()
        except Exception:
            # Restore only our own just-written version; never overwrite a new user edit.
            if digest(BASE / "dashboard.html") == switched_hash:
                restore = BASE / ".dashboard-audio-repair-rollback.tmp"
                shutil.copyfile(backup / "dashboard.html", restore)
                restore.replace(BASE / "dashboard.html")
            raise
        (RUN / "dashboard-link-update.json").write_text(json.dumps({"exam_id": EXAM_ID,
            "before_sha256": ORIGINAL_DASHBOARD_HASH, "after_sha256": digest(BASE / "dashboard.html"),
            "backup": str(backup / "dashboard.html"), "changed_fields": ["file", "duration_seconds"],
            "links": linked, "publication": False}, ensure_ascii=False, indent=2))
    report["repair_manifest_sha256"] = digest(manifest_path)
    (RUN / "verification.json").write_text(json.dumps(report, ensure_ascii=False, indent=2))
    state = json.loads((RUN / "state.json").read_text())
    state.update(phase="needs_human", technical_verified_clips=33, human_audio_acceptance=False,
                 local_dashboard_updated=args.switch_local_links,
                 stop_reason="teacher pronunciation/naturalness review remains open")
    (RUN / "state.json").write_text(json.dumps(state, ensure_ascii=False, indent=2))
    print(json.dumps({"status": report["status"], "clips": 33, "dashboard_updated": args.switch_local_links}))


if __name__ == "__main__":
    main()
