#!/usr/bin/env python3
"""Download the audio URLs recorded by the QR source inventory.

Uses curl with bounded connection/read timeouts and parallel workers because
the QR provider's media host is intermittently slow from some networks.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def download(job: tuple[dict, Path]) -> tuple[dict, Path, str | None]:
    audio, target = job
    if target.exists() and target.stat().st_size > 0:
        return audio, target, None
    target.parent.mkdir(parents=True, exist_ok=True)
    partial = target.with_suffix(target.suffix + ".part")
    if partial.exists():
        partial.unlink()
    cmd = [
        "/usr/bin/curl", "-L", "--fail", "--silent", "--show-error",
        "--connect-timeout", "8", "--max-time", "90", "--retry", "2",
        "--retry-delay", "1", "-A", "Mozilla/5.0", "-o", str(partial), audio["play_url"],
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        partial.unlink(missing_ok=True)
        return audio, target, proc.stderr.strip() or f"curl exit {proc.returncode}"
    if not partial.exists() or partial.stat().st_size == 0:
        partial.unlink(missing_ok=True)
        return audio, target, "empty response"
    partial.replace(target)
    return audio, target, None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--inventory", type=Path, required=True)
    ap.add_argument("--workers", type=int, default=6)
    args = ap.parse_args()
    inventory_path = args.inventory.resolve()
    root = inventory_path.parent
    inventory = json.loads(inventory_path.read_text(encoding="utf-8"))
    jobs: list[tuple[dict, Path]] = []
    for lesson in inventory["lessons"]:
        lesson_no = int(lesson["lesson_number"])
        for audio in lesson.get("audio", []):
            target = root / "audio" / f"lesson-{lesson_no:02d}" / f"{audio['label']}.mp3"
            jobs.append((audio, target))
    results: list[dict] = []
    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as pool:
        futures = [pool.submit(download, job) for job in jobs]
        for future in as_completed(futures):
            audio, target, error = future.result()
            if error:
                audio.update({"download_status": "failed", "error": error})
            else:
                audio.update({"file": str(target.relative_to(root)), "content_type": "audio/mpeg",
                              "bytes": target.stat().st_size, "sha256": sha256(target),
                              "download_status": "reused_existing"})
            results.append(audio)
    inventory["audio_download"] = {
        "status": "complete" if all(x.get("download_status") in {"passed", "reused_existing"} for x in results) else "partial",
        "total": len(results),
        "passed": sum(x.get("download_status") in {"passed", "reused_existing"} for x in results),
        "failed": sum(x.get("download_status") == "failed" for x in results),
        "workers": args.workers,
    }
    inventory_path.write_text(json.dumps(inventory, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(inventory["audio_download"], ensure_ascii=False))
    return 0 if inventory["audio_download"]["failed"] == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
