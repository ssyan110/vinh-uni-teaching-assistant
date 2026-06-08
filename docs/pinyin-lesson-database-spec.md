# Pinyin Lesson Database Specification

> Authoritative spec for the independent pinyin course (6 lessons).
> Source: `Pinyin lessons/` — AI Mandarin independent pinyin materials (NOT 漢語教程 語音部分).
> Approved: 2026-06-04

## Source Material

- **6 PDF lessons** from AI Mandarin (© 2022), each 21 pages
- **Completely independent** from 漢語教程. Do NOT mix with or reference the textbook's phonetics section.
- Each lesson has a consistent structure: Cover → Study rules → Contents → Warmup → Knowledge → Vocabulary → Practice → Challenge → Notes → Contact

## Course Overview (6 Lessons)

| Lesson | Focus | Initials | Finals | Tones/Rules | Vocab |
|--------|-------|----------|--------|-------------|-------|
| pinyin-01 | 基礎入門 | b p m f (4) | a o e i u ü (6) | 四聲+輕聲, i→yi u→wu ü→yu | 16 |
| pinyin-02 | 聲母擴展 | d t n l + g k h + j q x (10) | — | 三聲變調, jü→ju qü→qu xü→xu | 16 |
| pinyin-03 | 翹舌/平舌 | zh ch sh r + z c s (7) | — | 一不變調, 21聲母總表 | 16 |
| pinyin-04 | 複韻母 (i/u/ü) | — | ia ie iao iou + ua uo uai uei üe (9) | iou→iu uei→ui uen→un + 聲調標註 + y/w rules | 20 |
| pinyin-05 | 韻母 (ai/鼻韻母) | — | ai ao ou ei + an ang en eng + in ing ong (11) | — | 20+ |
| pinyin-06 | 韻母 (uan/ian系) | — | uan uang uen + ian iang iong ün üan (8) | 日常用語, 36韻母總表 | 10+ |

**Totals:** 21 initials + 36 finals + 5 tones + tone sandhi rules + spelling rules across 6 lessons.

## Output Path Convention

```
output/pinyin/
├── pinyin_lesson_list.csv
├── pinyin-01/
│   ├── index.html
│   ├── README.md
│   ├── database/
│   │   ├── 02_content_items.csv
│   │   ├── 03_lesson_structure.csv
│   │   ├── 04_supplemental_activities.csv
│   │   ├── 05_game_suggestions.csv
│   │   ├── 06_google_sheets_database.csv
│   │   └── vp_pinyin_01_database.json
│   ├── slides/
│   ├── exports/
│   └── homework-question-bank/
├── pinyin-02/ ... pinyin-06/
```

## Teaching Module Sequence

Each pinyin lesson selects from these 15 possible modules. Not all modules apply to every lesson — unused modules are marked `"status": "not_applicable"`.

| order | module_id | module_name_vi | module_name_zh | Applies to |
|-------|-----------|----------------|----------------|------------|
| 1 | cover | Trang bìa | 封面 | ALL |
| 2 | study_rules | Quy tắc học tập | 学习规则 | ALL |
| 3 | objectives | Nội dung bài học | 学习内容 | ALL |
| 4 | warmup | Khởi động | 暖身/概念 | ALL (L1=概念, L2-L6=複習) |
| 5 | initials | Thanh mẫu | 声母 | L1, L2, L3 |
| 6 | finals | Vận mẫu | 韵母 | L1, L4, L5, L6 |
| 7 | spelling_rules | Quy tắc viết pinyin | 拼写规则 | L1, L2, L4 |
| 8 | tones | Thanh điệu / Biến điệu | 声调/变调 | L1, L2, L3 |
| 9 | vocabulary | Từ vựng | 生词 | ALL |
| 10 | practice | Luyện tập | 练习 | ALL (interleaved) |
| 11 | daily_phrases | Giao tiếp thường ngày | 日常用语 | L6 only |
| 12 | challenge | Thử thách bản thân | 自我挑战 | ALL |
| 13 | summary_table | Bảng tổng hợp | 总表 | L3 (initials), L6 (finals) |
| 14 | appendix | Phụ lục | 附录 | L1 (keyboard setup) |
| 15 | closing | Kết thúc | 结束 | ALL |

## Classroom Slide Template Rules

Future pinyin classroom decks reuse Pinyin Lesson 1 as the template baseline:

```text
output/pinyin/pinyin-01/
```

Do not rebuild future pinyin decks from scratch. Keep the Pinyin Lesson 1 visual language, presenter setup, cover/objectives/divider rhythm, concept-slide style, tone practice style, vocabulary/flashcard behavior, appendix/input setup style, and closing style. Change only the lesson-specific text, taught initials/finals/rules, vocabulary, exercises, and image content.

Keep the updated Pinyin Lesson 1 soft multicolor background system for future pinyin decks. Do not revert to the old monotone background. Background images, color blobs, and watermark graphics are always bottom-layer elements behind all text, cards, tables, and main lesson images.

Pinyin cover rule: every pinyin cover keeps the Lesson 1 cover layout. Use a badge like `PINYIN N · 拼音第N课`, keep the main title as `pīn/yīn` above `拼音`, and use the subtitle slot below `拼音` only for the pinyin sounds or spelling rules learned in that lesson. Render those sounds as grouped rounded chips, not one flat text string. Increase spacing between sound tokens inside each chip, and allow chips to wrap to a second line when one line is crowded. Examples: chips `b p m f` + `a o e i u ü`; chips `d t n l` + `g k h` + `j q x`. Do not put Vietnamese lesson-description notes in that subtitle slot.

Pinyin closing rule: every pinyin ending slide uses the `下课` visual composition from `/Users/ssyan110/Downloads/Mandarin_Pinyin_Foundations.pptx`: pale mint classroom background, large rounded white card, and students leaving through an open classroom door. Recreate the visual in HTML and keep editable lesson text; do not use the full PPTX image as a baked background with old text. Keep exactly three text lines: `下课`, `Bạn có câu hỏi gì không?`, and `Bài tiếp theo: Pinyin N` where `N` is the next pinyin lesson number. Use `下课`, not `下课了`, and do not add extra motivational or content-summary text.

Classroom slide sequence:

1. Cover
2. Objectives / lesson goal
3. Concept or review divider
4. Concept/review slides
5. Initials divider and initials teaching slides, when applicable
6. Finals divider and finals teaching slides, when applicable
7. Sounds/chart divider and pinyin chart/practice slides
8. Tone divider and tone/rule slides, when applicable
9. Vocabulary divider, vocabulary grid, and flashcards
10. Review/practice divider and exercises
11. Appendix/input setup, when applicable
12. Closing

`Mục lục` and `Quy ước` slides are no longer used in future pinyin classroom decks. If the source PDF contains rules or contents pages, keep them in extraction/review data only when useful; do not render them as classroom slides.

Pinyin classroom slides do not show bottom-right `Trang ...` page indicators. The presenter chrome may still show slide position.

Pinyin vocabulary grid slides:

- For `Từ vựng 1`, `Từ vựng 2`, and similar vocabulary overview slides, keep only the top bar section label plus the vocabulary grid.
- Do not add extra explanatory lines such as `Tập trung đọc...` on the slide body.
- Put teaching reminders in the teacher guide or in a separate practice slide instead.

Pinyin chart slides:

- Pinyin chart and chart-based practice slides do not need a body title.
- Keep only the presenter/top-bar section label, then make the chart as large as possible within the slide safe area.
- Chart columns must have equal width.
- Chart-based practice should reuse the same table layout, adding tone marks or target practice values instead of switching to a different layout.
- For `j/q/x + ü`, display written forms `ju/qu/xu` under the `ü` column because the spelling drops the two dots but the sound is still `ü`.

Pinyin practice slide templates:

- Use `scripts/pinyin-exercise-templates.mjs` for reusable renderer helpers and CSS.
- Reading drills use Pinyin Lesson 1 slide 15's large sound-board style.
- `连连看` / matching vocabulary exercises use a two-row image board: pinyin+hanzi cards on the top row and shuffled image cards on the bottom row. Do not add Vietnamese meaning columns or top label pills. Leave a generous vertical gap between the pinyin+hanzi row and image row. Image order must be randomized/deranged so images do not stay under their matching prompts. Split dense matching into multiple slides instead of crowding the board.
- Multiple-choice and listening-choice exercises use Pinyin Lesson 1 slide 37's blue answer-table style.
- Fill-in-blank and listening-completion exercises use Pinyin Lesson 1 slide 38's sound-bank plus underlined blank style, with no volume/speaker icon in the top bar or instruction header. When students fill initials, keep the underline blank before the final and add small parentheses above the vowel to remind them to write the tone. Comprehensive fill-in practice must target the lesson's learning goals, not automatically practice finals.
- Keep visible classroom instructions in natural Vietnamese.

Terminology:

- Use `thanh điệu` exactly.
- Do not use `thanh điều`.
- Use natural Vietnamese for visible classroom instructions.

Objectives slide:

- Reuse the Pinyin Lesson 1 objective layout.
- Taught initials/finals/rule anchors should be bold and red.
- Main goal lines are lesson-specific. Example for Lesson 1: bold red `bmpf`, bold red `aoeiuü`, `Học 5 thanh điệu tiếng Trung`, `Học đọc 16 từ vựng`.

Image style:

- Cover, goal, divider, concept, tone, initials/finals, vocabulary, appendix, and closing images use the same soft textbook/course style.
- Treat these images as reusable templates. Swap the main text/content/image subject for each future pinyin lesson instead of redesigning the slide.
- Concept slides must use the provided or generated soft textbook illustration style.

## Record Types

| record_type | Description | Used in |
|-------------|-------------|---------|
| `concept` | Foundational pinyin concept explanation | L1 |
| `initials` | Initial consonant group (with combination table) | L1, L2, L3 |
| `finals` | Final vowel group (with combination table) | L1, L4, L5, L6 |
| `tone` | Tone rules and tone sandhi | L1, L2, L3 |
| `spelling_rule` | Pinyin writing rules | L1, L2, L4 |
| `vocabulary` | Applied vocabulary (漢字 + pinyin + image) | ALL |
| `exercise` | In-class practice activity | ALL |
| `challenge` | Self-challenge / end-of-lesson assessment | ALL |
| `pinyin_table` | Combination table (initials × finals grid) | ALL knowledge sections |
| `summary_table` | Complete reference table (21 initials / 36 finals) | L3, L6 |
| `daily_phrase` | Daily communication phrase | L6 |
| `appendix` | Supplementary material (keyboard setup etc.) | L1 |

## Content Item Field Structures

### initials record

```json
{
  "record_id": "I001",
  "record_type": "initials",
  "section": "Thanh mẫu",
  "source_page": 6,
  "teaching_order": 5,
  "pinyin_group_id": "labials",
  "pinyin_group_label_vi": "Âm môi",
  "pinyin_group_label_zh": "唇音",
  "pinyin_items": ["b", "p", "m", "f"],
  "combination_table": {
    "columns": ["a", "o", "e", "i", "u", "ü"],
    "rows": {
      "b": ["ba", "bo", null, "bi", "bu", null],
      "p": ["pa", "po", null, "pi", "pu", null],
      "m": ["ma", "mo", "me", "mi", "mu", null],
      "f": ["fa", "fo", null, null, "fu", null]
    }
  },
  "raw_source_text": "...",
  "classroom_visibility": "student_visible"
}
```

### finals record

```json
{
  "record_id": "F001",
  "record_type": "finals",
  "section": "Vận mẫu",
  "source_page": 6,
  "teaching_order": 6,
  "pinyin_group_id": "compound_ai_ao_ou_ei",
  "pinyin_group_label_vi": "Vận mẫu kép",
  "pinyin_group_label_zh": "复韵母",
  "final_type": "single | compound | nasal",
  "pinyin_items": ["ai", "ao", "ou", "ei"],
  "combination_table": { ... },
  "raw_source_text": "...",
  "classroom_visibility": "student_visible"
}
```

### tone record

```json
{
  "record_id": "T001",
  "record_type": "tone",
  "section": "Thanh điệu",
  "source_page": 8,
  "teaching_order": 7,
  "tone_topic": "four_tones | third_tone_sandhi | yi_bu_sandhi",
  "tone_items": [
    {"tone_number": 1, "tone_value": "55", "mark": "ˉ", "example_char": "妈", "example_pinyin": "mā"},
    {"tone_number": 2, "tone_value": "35", "mark": "ˊ", "example_char": "麻", "example_pinyin": "má"},
    {"tone_number": 3, "tone_value": "214", "mark": "ˇ", "example_char": "马", "example_pinyin": "mǎ"},
    {"tone_number": 4, "tone_value": "51", "mark": "ˋ", "example_char": "骂", "example_pinyin": "mà"},
    {"tone_number": 0, "tone_value": "-", "mark": "", "example_char": "吗", "example_pinyin": "ma"}
  ],
  "sandhi_rules": [],
  "raw_source_text": "...",
  "classroom_visibility": "student_visible"
}
```

### spelling_rule record

```json
{
  "record_id": "SR001",
  "record_type": "spelling_rule",
  "section": "Quy tắc viết pinyin",
  "source_page": 7,
  "teaching_order": 8,
  "rule_id": "standalone_vowels",
  "rule_title_vi": "Quy tắc khi nguyên âm đứng độc lập",
  "rule_title_zh": "独立音节拼写规则",
  "rules": [
    {"from": "i", "to": "yi", "explanation_vi": "Khi i độc lập → thêm y, đọc vẫn giữ nguyên"},
    {"from": "u", "to": "wu", "explanation_vi": "Khi u độc lập → thêm w, đọc vẫn giữ nguyên"},
    {"from": "ü", "to": "yu", "explanation_vi": "Khi ü độc lập → thêm y và bỏ hai chấm"}
  ],
  "raw_source_text": "...",
  "classroom_visibility": "student_visible"
}
```

### vocabulary record

```json
{
  "record_id": "V001",
  "record_type": "vocabulary",
  "section": "Từ vựng",
  "source_page": 10,
  "teaching_order": 9,
  "chinese_simplified": "爸爸",
  "pinyin": "bà ba",
  "vietnamese": "bố/ba",
  "image_description": "hình ảnh người cha",
  "target_sounds": ["b", "a"],
  "target_tones": [4, 0],
  "raw_source_text": "爸爸 bà ba",
  "classroom_visibility": "student_visible"
}
```

### exercise record

```json
{
  "record_id": "EX001",
  "record_type": "exercise",
  "section": "Luyện tập",
  "source_page": 9,
  "teaching_order": 10,
  "exercise_type": "listening_choose | image_match | fill_blank | true_false | tone_matching | classify | write_pinyin | find_error | same_different | word_combine",
  "linked_module": "tones",
  "instructions_vi": "Nghe và chọn đáp án đúng cho mỗi câu.",
  "item_count": 6,
  "raw_source_text": "...",
  "classroom_visibility": "student_visible"
}
```

### challenge record

```json
{
  "record_id": "CH001",
  "record_type": "challenge",
  "section": "Thử thách bản thân",
  "source_page": 15,
  "teaching_order": 12,
  "challenge_type": "tone_matching | write_pinyin | classify | find_error | same_different | word_combine | image_choose",
  "instructions_vi": "...",
  "items": [ ... ],
  "answers": [ ... ],
  "raw_source_text": "...",
  "classroom_visibility": "student_visible"
}
```

## Google Sheets Database Columns (flat CSV)

```
lesson_id, lesson_title, record_id, record_type, section,
source_pdf, source_page, source_page_range, teaching_order,
pinyin_group, pinyin_items_count, chinese_simplified, pinyin, vietnamese,
target_sounds, exercise_type, raw_source_text,
classroom_visibility, teacher_review_status, approved, notes_for_review, generated_at
```

Key differences from regular lesson:
- **Removed:** `word_type_vi`, `hán_việt`, `sample_sentence_*`
- **Added:** `pinyin_group`, `pinyin_items_count`, `target_sounds`, `exercise_type`
- `chinese_simplified` / `pinyin` / `vietnamese` only used for vocabulary records

## Exercise Types (from source material)

| exercise_type | Vietnamese | Description |
|---------------|-----------|-------------|
| `listening_choose` | Nghe và chọn đáp án đúng | Listen and select correct pinyin |
| `image_match` | Nối hình với phiên âm | Match image to pinyin |
| `fill_blank` | Điền phần còn thiếu | Fill in missing initial/final/tone |
| `true_false` | Đúng hay sai? | Judge pinyin correctness |
| `tone_matching` | Nối thanh điệu | Match pinyin to tone names |
| `classify` | Xếp vào khung | Classify items by initial/final group |
| `write_pinyin` | Viết phiên âm | Write pinyin from image |
| `find_error` | Tìm lỗi sai | Find incorrect pinyin spelling |
| `same_different` | Giống hay khác nhau | Judge if two pinyin share initial/final |
| `word_combine` | Ghép từ | Combine pinyin into meaningful words |

## Game Suggestions (Blooket preferred)

- 辨音競速: Listen and choose correct pinyin (timed)
- 聲母/韻母配對: Image ↔ pinyin matching
- 聲調辨別: Same-syllable different-tone MCQ
- 詞彙圖片配對: 漢字 ↔ pinyin ↔ image

## Pinyin Lesson vs Regular Lesson Key Differences

| Aspect | Regular | Pinyin |
|--------|---------|--------|
| Source | 漢語教程 PDF | AI Mandarin independent (Pinyin lessons/) |
| Core content | 生詞 + 語法 + 課文 | 聲母 + 韻母 + 聲調 + 拼寫規則 |
| Vocabulary role | Primary teaching content | Applied practice of taught sounds |
| Hanzi writing | Yes (HanziWriter) | No |
| Grammar | Yes | No |
| Text/dialogue | Yes | No (L6 has daily phrases) |
| Culture supplement | Yes | No (L1 has keyboard appendix) |
| word_type_vi | Yes | No |
| hán_việt | Yes | No |
| combination_table | No | Yes |
| target_sounds | No | Yes |
