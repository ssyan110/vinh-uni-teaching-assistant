#!/usr/bin/env python3
"""Register the approved-style raster illustration candidates for lesson 09.

This is intentionally a registration/validation step, not an SVG renderer.
Lesson 09 uses hand-painted watercolor/colored-pencil raster candidates that
match the finalized Boya lesson reference assets. The files remain draft
inputs until Adam completes the visual/source review gate.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "lessons/boya-quasi-intermediate-i/lesson-09/10-design/assets"
CONTEXT_FILES = [
    ("L09-cover", "lesson-09-cover-food.png", "cover", ["封面"], None),
    ("L09-C01", "lesson-09-context-01.png", "short_text_context", ["短文一"], None),
    ("L09-C02", "lesson-09-context-02.png", "short_text_context", ["短文二"], None),
    ("L09-C03", "lesson-09-context-03.png", "short_text_context", ["短文三"], None),
]
VOCAB_SCENES = [
    "potato", "vegetables", "early_tea", "cold_toss", "greens", "sour_soup",
    "hotpot", "taste", "gradually", "cucumber", "stew", "late_snack",
    "food_stall", "gathering", "shared_meal", "leisure", "beans", "not_only",
    "replace", "season", "kinds", "common", "young", "usually", "quantity", "increase", "way",
]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def validate_image(path: Path, category: str) -> None:
    if path.suffix.lower() != ".png":
        raise ValueError(f"Expected PNG: {path}")
    if path.read_bytes()[:4] != b"\x89PNG":
        raise ValueError(f"Not a PNG file: {path}")
    with Image.open(path) as image:
        width, height = image.size
        if category == "cover" or category == "short_text_context":
            minimum = (1400, 800)
        else:
            minimum = (800, 800)
        if width < minimum[0] or height < minimum[1]:
            raise ValueError(f"Image too small for {category}: {path} ({width}x{height})")
        if image.mode not in {"RGB", "RGBA"}:
            raise ValueError(f"Unexpected image mode: {path} ({image.mode})")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    records = []
    expected = list(CONTEXT_FILES)
    expected.extend(
        (f"L09-V{index:02d}", f"l09-vocab-dedicated-{index:02d}.png", "vocabulary", [], scene)
        for index, scene in enumerate(VOCAB_SCENES, 1)
    )
    missing = []
    for asset_id, filename, category, use, scene in expected:
        path = OUT / filename
        if not path.exists():
            missing.append(filename)
            continue
        validate_image(path, category)
        item = {
            "asset_id": asset_id,
            "file": filename,
            "category": category,
            "status": "candidate_pending_review",
            "can_enter_ppt": False,
            "sha256": sha256(path),
            "source_kind": "generated_raster",
            "style_match_target": "finalized_l01_l06_raster_illustration",
        }
        if use:
            item["use"] = use
        if scene:
            item["scene"] = scene
        records.append(item)
    if missing:
        raise FileNotFoundError("Missing lesson 09 raster assets: " + ", ".join(missing))

    manifest = {
        "schema_version": "boya-lesson-image-manifest-v1",
        "lesson_key": "boya-quasi-intermediate-i:lesson-09",
        "textbook_id": "boya-quasi-intermediate-i",
        "lesson_id": "lesson-09",
        "lesson_title": "北方菜和南方菜",
        "generated_at": "2026-09-03",
        "generation_mode": "raster_handpainted_textbook_illustration",
        "source_scope": {
            "canonical_source": "lessons/boya-quasi-intermediate-i/lesson-09/00-source/canonical-source.json",
            "source_manifest": "lessons/boya-quasi-intermediate-i/lesson-09/00-source/source-manifest.json",
            "listening_exercise_contract": "lessons/boya-quasi-intermediate-i/lesson-09/00-source/listening-exercise-contract.json",
            "audio_manifest": "lessons/boya-quasi-intermediate-i/lesson-09/00-source/audio-manifest.json",
            "source_status": "pending_review",
            "content_policy": "Do not reuse unrelated vocabulary images; every image must serve meaning, context, comparison, evidence, or memory.",
        },
        "style": {
            "visual_direction": "finalized Boya educational textbook raster illustration",
            "rendering": "hand-painted watercolor and colored-pencil raster with paper texture",
            "linework": "delicate gray-blue ink and natural pencil detail",
            "palette": "low-saturation pastel on warm off-white illustration paper",
            "layout": "square vocabulary images; wide context images; clear negative space",
            "image_format": "PNG",
            "student_text_policy": "Images contain no readable Chinese, Latin text, numbers, logos, labels, captions, watermark, flags, or speech bubbles.",
            "forbidden_style": "vector art, flat icons, geometric diagrams, sticker graphics, draft placeholders",
        },
        "approval_boundary": {
            "generation_status": "draft_inputs_only",
            "authorization_status": "pending_source_visual_and_adam_review",
            "license_status": "Generated raster candidates; no release approval claimed.",
            "can_enter_ppt": False,
            "reason": "Raster candidates are registered for draft generation and remain pending visual/source review.",
        },
        "legacy_assets_quarantined": {
            "path": "lessons/boya-quasi-intermediate-i/lesson-09/90-archive/legacy-vector-assets-2026-09-03",
            "count": 31,
            "format": "SVG",
            "reason": "The former vector drafts are retained as reversible history and excluded from active generation inputs.",
        },
        "assets": records,
        "pending_assets": [],
    }
    (OUT / "image-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"lesson_key": manifest["lesson_key"], "assets": len(records), "generation_mode": manifest["generation_mode"], "output": str(OUT)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
