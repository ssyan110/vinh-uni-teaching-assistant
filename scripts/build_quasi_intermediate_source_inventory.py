#!/usr/bin/env python3
"""Create QR captures, QR/audio metadata, and local audio downloads.

The input TSV is emitted by scripts/scan_qr_vision.swift. ``--output-root``
must point to ``textbooks/<textbook_id>/source`` so that QR captures and audio
use the repository's standardized textbook-source layout.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import time
import urllib.request
from pathlib import Path

from PIL import Image


DATA_RE = re.compile(r"var data=(\{.*?\});\s*var open_id", re.S)


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def fetch(url: str, timeout: int = 25, retries: int = 3) -> tuple[bytes, str]:
    last_error: Exception | None = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=timeout) as response:
                return response.read(), response.headers.get_content_type()
        except Exception as exc:
            last_error = exc
            if attempt + 1 < retries:
                time.sleep(1.5 * (attempt + 1))
    assert last_error is not None
    raise last_error


def parse_qr_tsv(path: Path) -> list[dict]:
    rows = []
    for line in path.read_text(encoding="utf-8").splitlines():
        fields = line.split("\t")
        if len(fields) < 7 or fields[0] != "QR":
            continue
        page_path = Path(fields[1])
        rows.append({
            "pdf_page": int(page_path.stem.split("-")[-1]) + 1,
            "page_path": str(page_path),
            "qr_url": fields[2],
            "bbox": [float(x) for x in fields[3:7]],
        })
    return rows


def crop_qr(row: dict, out: Path) -> None:
    image = Image.open(row["page_path"]).convert("RGB")
    w, h = image.size
    x, y, bw, bh = row["bbox"]
    pad_x, pad_y = bw * 0.18, bh * 0.24
    left = max(0, int((x - pad_x) * w))
    upper = max(0, int((1 - y - bh - pad_y) * h))
    right = min(w, int((x + bw + pad_x) * w))
    lower = min(h, int((1 - y + pad_y) * h))
    out.parent.mkdir(parents=True, exist_ok=True)
    image.crop((left, upper, right, lower)).save(out, format="PNG")


def lesson_audio_from_page(qr_url: str) -> dict:
    html, _ = fetch(qr_url)
    text = html.decode("utf-8", errors="replace")
    jump = re.search(r"jump_url=\"([^\"]+)\"", text)
    page_url = jump.group(1).replace("\\/", "/") if jump else qr_url
    page_html, _ = fetch(page_url)
    page_text = page_html.decode("utf-8", errors="replace")
    match = DATA_RE.search(page_text)
    if not match:
        raise RuntimeError(f"could not parse page data: {page_url}")
    return {"page_url": page_url, "data": json.loads(match.group(1))}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--qr-tsv", type=Path, required=True)
    ap.add_argument("--output-root", type=Path, required=True)
    ap.add_argument("--download", action="store_true")
    args = ap.parse_args()
    out = args.output_root.resolve()
    qr_dir = out / "qr" / "captures"
    audio_dir = out / "audio"
    out.mkdir(parents=True, exist_ok=True)
    rows = parse_qr_tsv(args.qr_tsv)
    # The final cover page has two publisher QR codes, not a lesson audio QR.
    lesson_rows = [r for r in rows if r["pdf_page"] < 130]
    if len(lesson_rows) != 12:
        raise RuntimeError(f"expected 12 lesson QR codes, found {len(lesson_rows)}")
    lessons = []
    for number, row in enumerate(lesson_rows, 1):
        capture = qr_dir / f"lesson-{number:02d}-pdf-page-{row['pdf_page']:03d}.png"
        crop_qr(row, capture)
        item = {
            "lesson_number": number,
            "pdf_page": row["pdf_page"],
            "qr_url": row["qr_url"],
            "qr_capture": str(capture.relative_to(out)),
            "landing_page": None,
            "title": None,
            "audio": [],
        }
        try:
            details = lesson_audio_from_page(row["qr_url"])
            data = details["data"]
            item["landing_page"] = details["page_url"]
            item["title"] = data.get("name") or data.get("main", {}).get("title")
        except Exception as exc:
            item["status"] = "landing_page_failed"
            item["error"] = f"{type(exc).__name__}: {exc}"
            lessons.append(item)
            continue
        for audio_index, node in enumerate(data.get("tree_list", []), 1):
            if node.get("module") != "audio":
                continue
            info = node.get("item", {})
            label = info.get("title") or f"track-{audio_index:02d}"
            play_url = info.get("play_url", "").replace("http://", "https://")
            asset = {"label": label, "coding": node.get("coding"), "play_url": play_url}
            if args.download:
                lesson_dir = audio_dir / f"lesson-{number:02d}"
                lesson_dir.mkdir(parents=True, exist_ok=True)
                target = lesson_dir / f"{label}.mp3"
                try:
                    if target.exists() and target.stat().st_size > 0:
                        asset.update({"file": str(target.relative_to(out)), "content_type": "audio/mpeg",
                                      "bytes": target.stat().st_size, "sha256": sha256(target),
                                      "download_status": "reused_existing"})
                    else:
                        payload, content_type = fetch(play_url, timeout=30)
                        target.write_bytes(payload)
                        asset.update({"file": str(target.relative_to(out)), "content_type": content_type,
                                      "bytes": len(payload), "sha256": sha256(target), "download_status": "passed"})
                except Exception as exc:  # retain URL evidence for retry without losing the inventory
                    asset.update({"download_status": "failed", "error": f"{type(exc).__name__}: {exc}"})
            item["audio"].append(asset)
        lessons.append(item)
    inventory = {
        "textbook_id": "boya-quasi-intermediate-i",
        "title": "《博雅汉语听说：准中级加速篇 I》",
        "status": "source_audit_in_progress",
        "source_pdf": "textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I.pdf",
        "qr_scan": {"input_tsv": str(args.qr_tsv), "lesson_qr_count": len(lesson_rows)},
        "lessons": lessons,
        "notes": [
            "二维码先从教材页截取并以 Vision 解码；最终封底的两个出版社二维码未计入课程音频。",
            "音频文件是本地来源输入，统一放在本教材的 source/audio/，不纳入 Git 交付包。",
            "页面标题、教材印刷页码、音频内容与答案仍需逐课来源 QA；不得把此盘点当成已批准教师手册。",
        ],
    }
    (out / "source-inventory.json").write_text(json.dumps(inventory, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output_root": str(out), "lesson_count": len(lessons),
                      "audio_count": sum(len(x["audio"]) for x in lessons),
                      "downloaded": sum(a.get("download_status") == "passed" for x in lessons for a in x["audio"]),
                      "failed": sum(a.get("download_status") == "failed" for x in lessons for a in x["audio"])}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
