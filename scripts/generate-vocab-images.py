#!/usr/bin/env python3
"""Prepare vocabulary illustration prompts for later image generation.

Usage:
    python scripts/generate-vocab-images.py \
        --database output/book-1/lesson-01/database/vp_lesson_01_database.json \
        --output-dir output/book-1/lesson-01/slides/assets/vocab-images/ \
        --prompts-file output/book-1/lesson-01/slides/assets/vocab-images/prompts.json

This script:
1. Reads the lesson database JSON
2. Extracts vocabulary items
3. Generates consistent image prompts for each word
4. Outputs a prompts.json file for optional later image generation

Do not run this as part of initial slide generation. New lessons should use
blank placeholders first. Run this only when Adam asks for real images, then
use Chrome/ChatGPT, Hermes, or another approved source and insert final files
with the asset replacement workflow.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

# Consistent style prompt prefix for all vocabulary illustrations.
# Keep this aligned with the reference images used for Lesson 01:
# soft courseware scenes, not flat teal icon cards.
STYLE_PREFIX = (
    "Soft educational textbook illustration for a Chinese language classroom slide, "
    "16:9 landscape composition, thin grey-blue hand-drawn outlines, "
    "muted pastel fills, white or very pale grey background, clean airy layout, "
    "gentle flat shading and subtle low-contrast shadows, "
    "simple clear visual metaphor suitable for Vietnamese university Chinese learners, "
    "no text, no letters, no numbers, no Chinese characters, no labels, no watermark, "
    "avoid thick teal outlines, toy icon style, decorative abstract blobs, glossy vector art, stickers, "
    "exaggerated chibi proportions, and harsh colors"
)

# Image specifications
IMAGE_SPEC = {
    "width": 576,
    "height": 324,
    "format": "png",
    "aspect_ratio": "16:9",
    "background": "white_or_pale_grey",
    "style": "soft_textbook_line_art",
}


def build_vocab_prompt(word: dict) -> dict:
    """Build an image generation prompt for a vocabulary word.

    Args:
        word: Dict with keys: chinese_simplified, pinyin, vietnamese, word_type_vi

    Returns:
        Dict with filename, prompt, and metadata
    """
    zh = word.get("chinese_simplified", "")
    pinyin = word.get("pinyin", "")
    vi = word.get("vietnamese", "")
    word_type = word.get("word_type_vi", "")

    # Generate a visual description based on the word meaning
    visual_desc = _get_visual_description(zh, vi, word_type)

    prompt = f"{STYLE_PREFIX}. Subject: {visual_desc}"

    # Filename uses pinyin (sanitized but still readable).
    safe_pinyin = pinyin.replace(" ", "-")
    filename = f"vocab-{safe_pinyin}.png"

    return {
        "record_id": word.get("record_id", ""),
        "filename": filename,
        "prompt": prompt,
        "image_role": "vocabulary_image",
        "image_status": "placeholder_needs_generation",
        "image_semantic_check": f"Image must clearly match {zh} / {vi}; verify in rendered slide QA.",
        "chinese": zh,
        "chinese_simplified": zh,
        "pinyin": pinyin,
        "vietnamese": vi,
        "word_type": word_type,
        "visual_description": visual_desc,
    }


def _get_visual_description(zh: str, vi: str, word_type: str) -> str:
    """Generate a visual description for the word.

    Maps each word to a clear visual concept that can be illustrated.
    """
    # Specific mappings for common vocabulary
    visual_map = {
        "你": "A friendly young person smiling and pointing directly at the viewer with their index finger, as if saying you",
        "好": "A cheerful person giving a clear thumbs-up with a warm smile, conveying good or great",
        "一": "One natural human hand held up with palm facing the viewer, exactly one index finger raised and the other fingers folded naturally, matching the five-finger hand illustration style",
        "五": "A natural human hand held up with palm facing the viewer and all five fingers spread open",
        "八": "One natural human hand making the Chinese number eight gesture: index finger extended upward and thumb extended sideways, with the other fingers folded naturally, matching the five-finger hand illustration style",
        "大": "A very large friendly elephant standing beside a very tiny mouse, showing big versus small",
        "不": "A person gently shaking their head with eyes closed and waving both hands in front of their chest in a clear no gesture",
        "口": "A friendly face shown close-up with an open mouth as if saying ah, with the mouth as the clear focus",
        "白": "A fluffy white rabbit sitting calmly on a small patch of light green grass, clearly representing white",
        "女": "A young woman standing and smiling warmly in simple neat clothing, natural human proportions",
        "马": "A white horse standing in side profile with a flowing mane and tail, friendly and approachable",
    }

    if zh in visual_map:
        return visual_map[zh]

    # Fallback: use Vietnamese meaning as description
    return f"Visual representation of '{vi}' ({word_type}), clear and simple"


def extract_vocabulary(database: dict) -> list[dict]:
    """Extract vocabulary items from the lesson database."""
    content_items = database.get("content_items", [])
    vocab = []
    for item in content_items:
        record_type = item.get("type", item.get("record_type", ""))
        if record_type in ("vocabulary", "vocab"):
            # Lesson 01 deck rule: 你好 appears only in summary/dialogue slides,
            # not as a standalone vocabulary image.
            if item.get("chinese_simplified", "") == "你好":
                continue
            vocab.append(item)
    return vocab


def main():
    parser = argparse.ArgumentParser(description="Generate vocabulary image prompts")
    parser.add_argument("--database", required=True, help="Path to lesson database JSON")
    parser.add_argument("--output-dir", required=True, help="Directory to save generated images")
    parser.add_argument("--prompts-file", required=True, help="Path to write prompts.json")
    args = parser.parse_args()

    db_path = Path(args.database)
    output_dir = Path(args.output_dir)
    prompts_path = Path(args.prompts_file)

    # Read database
    database = json.loads(db_path.read_text(encoding="utf-8"))
    vocab_items = extract_vocabulary(database)

    if not vocab_items:
        print(f"Warning: No vocabulary items found in {db_path}")
        print("Using fallback vocabulary list for Lesson 01...")
        # Fallback for lesson 01 (hard-coded known vocab)
        vocab_items = [
            {"chinese_simplified": "你", "pinyin": "nǐ", "vietnamese": "anh, chị, bạn", "word_type_vi": "đại từ"},
            {"chinese_simplified": "好", "pinyin": "hǎo", "vietnamese": "tốt, đẹp, hay", "word_type_vi": "tính từ"},
            {"chinese_simplified": "一", "pinyin": "yī", "vietnamese": "một", "word_type_vi": "số từ"},
            {"chinese_simplified": "五", "pinyin": "wǔ", "vietnamese": "năm", "word_type_vi": "số từ"},
            {"chinese_simplified": "八", "pinyin": "bā", "vietnamese": "tám", "word_type_vi": "số từ"},
            {"chinese_simplified": "大", "pinyin": "dà", "vietnamese": "to, lớn", "word_type_vi": "tính từ"},
            {"chinese_simplified": "不", "pinyin": "bù", "vietnamese": "không, chẳng", "word_type_vi": "phó từ"},
            {"chinese_simplified": "口", "pinyin": "kǒu", "vietnamese": "miệng", "word_type_vi": "danh từ"},
            {"chinese_simplified": "白", "pinyin": "bái", "vietnamese": "trắng", "word_type_vi": "tính từ"},
            {"chinese_simplified": "女", "pinyin": "nǚ", "vietnamese": "nữ, phụ nữ", "word_type_vi": "danh từ"},
            {"chinese_simplified": "马", "pinyin": "mǎ", "vietnamese": "con ngựa", "word_type_vi": "danh từ"},
        ]

    # Generate prompts
    output_dir.mkdir(parents=True, exist_ok=True)
    prompts = []
    for item in vocab_items:
        prompt_data = build_vocab_prompt(item)
        prompt_data["output_path"] = str(output_dir / prompt_data["filename"])
        prompts.append(prompt_data)

    # Write prompts file
    output = {
        "metadata": {
            "lesson_id": database.get("metadata", {}).get("lesson_id", "lesson-01"),
            "total_images": len(prompts),
            "image_spec": IMAGE_SPEC,
            "style_notes": "All images must share the soft textbook line-art style: thin grey-blue outlines, muted pastel fills, white or pale grey background, 16:9 landscape, no text or characters in image.",
        },
        "image_generation_instructions": (
            "Generate each image using the prompt below. "
            "Save each as a 16:9 PNG, ideally 576x324 or larger. "
            "All images must share the same soft textbook line-art style: thin grey-blue outlines, "
            "muted pastel fills, white or pale grey background, gentle low-contrast shadows. "
            "Do not use flat teal icon art, circular icon framing, decorative blobs, text, letters, numbers, "
            "or Chinese characters inside the image."
        ),
        "prompts": prompts,
    }

    prompts_path.parent.mkdir(parents=True, exist_ok=True)
    prompts_path.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"✅ Generated {len(prompts)} image prompts")
    print(f"   Prompts file: {prompts_path}")
    print(f"   Output dir:   {output_dir}")
    print()
    print("Next step: Generate images only if Adam asked for them, then insert with assets:replace or assets:crop-contact-sheet.")


if __name__ == "__main__":
    main()
