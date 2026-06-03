# Codex Agent — Generate Vocabulary Images via ChatGPT Web UI

## Task

Use browser control to open ChatGPT, generate 11 vocabulary images using the prompts below, download each image, and save it to the correct filename in the output folder.

## Output folder

```
output/book-1/lesson-01/slides/assets/vocab-images/
```

## Workflow

For each image:
1. Open ChatGPT in browser (or use existing session)
2. Paste the prompt into the chat
3. Wait for image to be generated
4. Download the generated image
5. Rename and save it to the output folder with the correct filename
6. Move to next prompt

## Important

- Generate ONE image per prompt (not multiple options)
- Save each as PNG
- Prefer 16:9 landscape images. If ChatGPT gives a different size, crop/resize to 576×324 before saving.
- All 11 images must look consistent — same style. If one looks different, regenerate it.
- NO text, letters, numbers, or Chinese characters should appear IN the generated images
- Match the attached/reference style: soft textbook line art, thin grey-blue outlines, muted pastel fills, pale white/light-grey background, gentle low-contrast shadows.
- Avoid the old ugly style: thick teal icon outlines, circular icon framing, decorative blobs, glossy vector art, sticker/chibi proportions, harsh saturated colors.

## Shared style clause

Use this style clause in every prompt:

```
Soft educational textbook illustration for a Chinese language classroom slide, 16:9 landscape composition, thin grey-blue hand-drawn outlines, muted pastel fills, white or very pale grey background, clean airy layout, gentle flat shading and subtle low-contrast shadows, simple clear visual metaphor. No text, no letters, no numbers, no Chinese characters, no labels, no watermark. Avoid thick teal outlines, toy icon style, decorative abstract blobs, glossy vector art, stickers, exaggerated chibi proportions, and harsh colors.
```

## Prompts (generate in this order)

### 1. vocab-nǐ.png — 你 (you)
```text
Soft educational textbook illustration for a Chinese language classroom slide, 16:9 landscape composition, thin grey-blue hand-drawn outlines, muted pastel fills, white or very pale grey background, clean airy layout, gentle flat shading and subtle low-contrast shadows. A friendly young person smiling and pointing directly at the viewer with their index finger, as if saying "you". No text, no letters, no numbers, no Chinese characters, no labels, no watermark. Avoid thick teal outlines, toy icon style, decorative abstract blobs, glossy vector art, stickers, exaggerated chibi proportions, and harsh colors.
```

### 2. vocab-hǎo.png — 好 (good)
```text
Soft educational textbook illustration for a Chinese language classroom slide, 16:9 landscape composition, thin grey-blue hand-drawn outlines, muted pastel fills, white or very pale grey background, clean airy layout, gentle flat shading and subtle low-contrast shadows. A cheerful person giving a clear thumbs-up with a warm smile, conveying "good" or "great". No text, no letters, no numbers, no Chinese characters, no labels, no watermark. Avoid thick teal outlines, toy icon style, decorative abstract blobs, glossy vector art, stickers, exaggerated chibi proportions, and harsh colors.
```

### 3. vocab-yī.png — 一 (one)
```text
Soft educational textbook illustration for a Chinese language classroom slide, 16:9 landscape composition, thin grey-blue hand-drawn outlines, muted pastel fills, white or very pale grey background, clean airy layout, gentle flat shading and subtle low-contrast shadows. One natural human hand held up with palm facing the viewer, exactly one index finger raised to indicate one; other fingers folded naturally. Match the same hand style as the five-finger slide. No text, no letters, no numbers, no Chinese characters, no labels, no watermark. Avoid thick teal outlines, toy icon style, decorative abstract blobs, glossy vector art, stickers, exaggerated chibi proportions, and harsh colors.
```

### 4. vocab-wǔ.png — 五 (five)
```text
Soft educational textbook illustration for a Chinese language classroom slide, 16:9 landscape composition, thin grey-blue hand-drawn outlines, muted pastel fills, white or very pale grey background, clean airy layout, gentle flat shading and subtle low-contrast shadows. A natural human hand held up with palm facing the viewer and all five fingers spread open, clearly representing five. No text, no letters, no numbers, no Chinese characters, no labels, no watermark. Avoid thick teal outlines, toy icon style, decorative abstract blobs, glossy vector art, stickers, exaggerated chibi proportions, and harsh colors.
```

### 5. vocab-bā.png — 八 (eight)
```text
Soft educational textbook illustration for a Chinese language classroom slide, 16:9 landscape composition, thin grey-blue hand-drawn outlines, muted pastel fills, white or very pale grey background, clean airy layout, gentle flat shading and subtle low-contrast shadows. One natural human hand making the Chinese number eight gesture: index finger extended upward and thumb extended sideways, with the other fingers folded naturally. Match the same hand style as the five-finger slide. No text, no letters, no numbers, no Chinese characters, no labels, no watermark. Avoid thick teal outlines, toy icon style, decorative abstract blobs, glossy vector art, stickers, exaggerated chibi proportions, and harsh colors.
```

### 6. vocab-dà.png — 大 (big)
```text
Soft educational textbook illustration for a Chinese language classroom slide, 16:9 landscape composition, thin grey-blue hand-drawn outlines, muted pastel fills, white or very pale grey background, clean airy layout, gentle flat shading and subtle low-contrast shadows. A very large friendly elephant standing beside a very tiny mouse, clearly showing big versus small; the elephant takes up most of the frame. No text, no letters, no numbers, no Chinese characters, no labels, no watermark. Avoid thick teal outlines, toy icon style, decorative abstract blobs, glossy vector art, stickers, exaggerated chibi proportions, and harsh colors.
```

### 7. vocab-bù.png — 不 (not / no)
```text
Soft educational textbook illustration for a Chinese language classroom slide, 16:9 landscape composition, thin grey-blue hand-drawn outlines, muted pastel fills, white or very pale grey background, clean airy layout, gentle flat shading and subtle low-contrast shadows. A person gently shaking their head with eyes closed and waving both hands in front of their chest in a clear "no" refusal gesture. No text, no letters, no numbers, no Chinese characters, no labels, no watermark, no red prohibition symbol. Avoid thick teal outlines, toy icon style, decorative abstract blobs, glossy vector art, stickers, exaggerated chibi proportions, and harsh colors.
```

### 8. vocab-kǒu.png — 口 (mouth)
```text
Soft educational textbook illustration for a Chinese language classroom slide, 16:9 landscape composition, thin grey-blue hand-drawn outlines, muted pastel fills, white or very pale grey background, clean airy layout, gentle flat shading and subtle low-contrast shadows. A friendly face shown close-up with an open mouth as if saying "ah"; the mouth is the clear focus. No text, no letters, no numbers, no Chinese characters, no labels, no watermark. Avoid thick teal outlines, toy icon style, decorative abstract blobs, glossy vector art, stickers, exaggerated chibi proportions, and harsh colors.
```

### 9. vocab-bái.png — 白 (white)
```text
Soft educational textbook illustration for a Chinese language classroom slide, 16:9 landscape composition, thin grey-blue hand-drawn outlines, muted pastel fills, white or very pale grey background, clean airy layout, gentle flat shading and subtle low-contrast shadows. A fluffy white rabbit sitting calmly on a small patch of light green grass, clearly representing white through pure white fur. No text, no letters, no numbers, no Chinese characters, no labels, no watermark. Avoid thick teal outlines, toy icon style, decorative abstract blobs, glossy vector art, stickers, exaggerated chibi proportions, and harsh colors.
```

### 10. vocab-nǚ.png — 女 (woman)
```text
Soft educational textbook illustration for a Chinese language classroom slide, 16:9 landscape composition, thin grey-blue hand-drawn outlines, muted pastel fills, white or very pale grey background, clean airy layout, gentle flat shading and subtle low-contrast shadows. A young woman standing and smiling warmly in simple neat clothing, natural human proportions, clearly representing woman or female. No text, no letters, no numbers, no Chinese characters, no labels, no watermark. Avoid thick teal outlines, toy icon style, decorative abstract blobs, glossy vector art, stickers, exaggerated chibi proportions, and harsh colors.
```

### 11. vocab-mǎ.png — 马 (horse)
```text
Soft educational textbook illustration for a Chinese language classroom slide, 16:9 landscape composition, thin grey-blue hand-drawn outlines, muted pastel fills, white or very pale grey background, clean airy layout, gentle flat shading and subtle low-contrast shadows. A white horse standing in side profile with a flowing mane and tail, friendly and approachable. No text, no letters, no numbers, no Chinese characters, no labels, no watermark. Avoid thick teal outlines, toy icon style, decorative abstract blobs, glossy vector art, stickers, exaggerated chibi proportions, and harsh colors.
```

## After all images are saved

Verify all 11 files exist:
```
ls output/book-1/lesson-01/slides/assets/vocab-images/*.png
```

Should see: vocab-nǐ.png, vocab-hǎo.png, vocab-yī.png, vocab-wǔ.png, vocab-bā.png, vocab-dà.png, vocab-bù.png, vocab-kǒu.png, vocab-bái.png, vocab-nǚ.png, vocab-mǎ.png
