# Hermes Agent — Vocabulary Image Generation (v3)

## Task

Generate 11 vocabulary illustrations using **ChatGPT image generation**. Delete old PNGs first.

## Steps

```bash
# 1. Delete old images
rm output/book-1/lesson-01/slides/assets/vocab-images/*.png
rm output/book-1/lesson-01/slides/assets/vocab-images/*.jpg

# 2. Read prompts
# File: output/book-1/lesson-01/slides/assets/vocab-images/prompts.json

# 3. For each entry in prompts[], use ChatGPT image generation with the "prompt" field

# 4. Save each image to:
# output/book-1/lesson-01/slides/assets/vocab-images/{filename}
```

## Output folder

```
output/book-1/lesson-01/slides/assets/vocab-images/
```

## Style

**ALL images must match the soft textbook illustration references:**
- Thin grey-blue hand-drawn outlines
- Muted pastel fills, pale white/light-grey background
- Gentle flat shading and subtle low-contrast shadows
- Clean, airy 16:9 classroom-slide composition
- Natural friendly subjects, not toy icons or chibi stickers
- No decorative abstract blobs, teal icon outlines, glossy vector art, or harsh colors
- Simple, friendly, immediately recognizable subjects
- **NO text, NO letters, NO numbers, NO Chinese characters in the images**
- 16:9 aspect ratio (landscape)
- Consistent art style across all 11 images

## Images to generate

| # | Filename | Word | What to draw |
|---|----------|------|--------------|
| 1 | vocab-nǐ.png | 你 (you) | Person pointing at viewer |
| 2 | vocab-hǎo.png | 好 (good) | Person giving thumbs up |
| 3 | vocab-yī.png | 一 (one) | One hand showing 1 raised finger |
| 4 | vocab-wǔ.png | 五 (five) | Hand showing 5 open fingers |
| 5 | vocab-bā.png | 八 (eight) | Chinese number 8 hand gesture: thumb and index extended, other fingers folded |
| 6 | vocab-dà.png | 大 (big) | Large elephant next to tiny mouse |
| 7 | vocab-bù.png | 不 (not) | Person shaking head and waving hands 'no' |
| 8 | vocab-kǒu.png | 口 (mouth) | Cartoon face with wide open mouth |
| 9 | vocab-bái.png | 白 (white) | White rabbit on green grass |
| 10 | vocab-nǚ.png | 女 (woman) | Young woman with long hair in a dress |
| 11 | vocab-mǎ.png | 马 (horse) | White horse standing in side profile |

## Key rule

Each image must be **immediately recognizable** — a student should guess the word's meaning just by looking at the picture. No ambiguity.

## After generation

Verify all 11 PNGs exist in the output folder and they all share the same illustration style.
