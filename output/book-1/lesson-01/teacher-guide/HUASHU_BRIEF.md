# Huashu Brief · 第一课 你好 · Bài 1 Xin chào

> Tài liệu tạo deck HTML cho Huashu Design.
> Lesson type: regular
> Final design: Soft Classroom Presenter (locked)
> Format: 960px x 540px, 16:9
> Classroom file: `output/book-1/lesson-01/index.html`
> Style guide: `reference/slide-style-guide.md`

---

## Final Direction

Use the finalized Lesson 1 deck as the source of truth. Do not recreate the old three-version proposal. The accepted design is a light classroom presenter deck with soft teal/lavender accents, local teaching photos, large Chinese text, and simple click-to-reveal interactions.

The deck is used directly in class through the HTML presenter. It includes fullscreen mode, pen/highlighter tools, text boxes, undo, erase, and PDF export with annotations. PDF is a backup export only.

## Design Rules

- White or very light teal backgrounds with subtle radial decoration.
- 40px frosted top menu bar on all teaching slides. No menu bar on cover or closing.
- Slide `.page-indicator` shows printed textbook pages only, for example `Trang 1`, `Trang 1-2`, or `Trang 10-12`; it is not the slide number or PDF page. Presenter navigation may show slide position separately.
- Inter for Vietnamese and pinyin. Noto Sans SC for Chinese.
- Main colors: teal `#5AACAC`, navy `#1A3A5A`, secondary text `#4A6080`, muted text `#8A9AB0`, lavender `#C8B8E8`.
- Cards use white background, 20-24px radius, subtle teal shadow, and a thin teal border.
- Use Lucide icons in the menu bar and controls. Use local photos from `slides/assets/photos/`; do not use remote random image URLs.
- Keep slide text large enough for classroom projection. Avoid dense paragraphs.

## Language Rules

- Vietnamese for labels, instructions, prompts, and exercise directions.
- Simplified Chinese for target language content.
- Pinyin for pronunciation.
- Pinyin appears above Chinese on vocabulary, sample sentence, practice, and dialogue slides.
- Hán Việt appears in parentheses under Vietnamese meaning on vocabulary and summary slides.
- Use `từ vựng`, not `sinh từ`.
- Use `cụm từ`, not `thành ngữ`.
- Use character separators: `一、八、大、不、五、口、白、女、马、你、好`.
- Culture note exception: inline pinyin in parentheses is allowed, for example `您好 (nín hǎo)`.
- Student-facing slides must not include teacher tips, internal notes, review status, or hidden answer keys outside reveal interactions.

## Final Slide Sequence

| # | File | Purpose | Design notes |
|---:|---|---|---|
| 01 | `01-cover.html` | Cover | Gradient cover card, `BÀI 1`, large `你好`, pinyin, course subtitle |
| 02 | `02-objectives.html` | Objectives | Three numbered objective cards |
| 03 | `03-warmup.html` | Warmup | Question card, local photo, prompt chips |
| 04 | `04-divider-vocab.html` | Vocabulary divider | Left text block, right photo panel, source label |
| 05 | `05-vocab-ni.html` | Vocabulary: 你 | Single vocab card, counter `01/11`, printed textbook page |
| 06 | `06-sample-ni.html` | Sample sentence | Separate sample card for `你好` |
| 07 | `07-vocab-hao.html` | Vocabulary: 好 | Same vocab-card pattern |
| 08 | `08-sample-hao.html` | Sample sentence | Separate sample card |
| 09 | `09-vocab-nihao.html` | Vocabulary: 你好 | Phrase vocab card |
| 10 | `10-sample-nihao.html` | Sample sentence | Greeting sample card |
| 11 | `11-vocab-yi.html` | Vocabulary: 一 | Single vocab card |
| 12 | `12-sample-yi.html` | Sample sentence | Separate sample card |
| 13 | `13-vocab-wu.html` | Vocabulary: 五 | Single vocab card |
| 14 | `14-sample-wu.html` | Sample sentence | Separate sample card |
| 15 | `15-vocab-ba.html` | Vocabulary: 八 | Single vocab card |
| 16 | `16-sample-ba.html` | Sample sentence | Separate sample card |
| 17 | `17-vocab-da.html` | Vocabulary: 大 | Single vocab card |
| 18 | `18-sample-da.html` | Sample sentence | Separate sample card |
| 19 | `19-vocab-bu.html` | Vocabulary: 不 | Single vocab card |
| 20 | `20-sample-bu.html` | Sample sentence | Separate sample card |
| 21 | `21-vocab-kou.html` | Vocabulary: 口 | Single vocab card |
| 22 | `22-sample-kou.html` | Sample sentence | Separate sample card |
| 23 | `23-vocab-bai.html` | Vocabulary: 白 | Single vocab card |
| 24 | `24-sample-bai.html` | Sample sentence | Separate sample card |
| 25 | `25-vocab-nu.html` | Vocabulary: 女 | Single vocab card |
| 26 | `26-sample-nu.html` | Sample sentence | Separate sample card |
| 27 | `27-vocab-ma.html` | Vocabulary: 马 | Single vocab card |
| 28 | `28-sample-ma.html` | Sample sentence | Separate sample card |
| 29 | `29-vocab-summary-a.html` | Mini quiz 01-06 | Click reveals pinyin, meaning, Hán Việt |
| 30 | `30-vocab-summary-b.html` | Mini quiz 07-12 | Click reveals pinyin, meaning, Hán Việt |
| 31 | `31-divider-practice.html` | Practice divider | Purple practice section |
| 32 | `32-practice-flashcard-ni.html` | Flashcard: 你 | Click: Chinese -> pinyin -> meaning |
| 33 | `33-practice-flashcard-hao.html` | Flashcard: 好 | Same flip pattern |
| 34 | `34-practice-flashcard-ma.html` | Flashcard: 马 | Same flip pattern |
| 35 | `35-practice-flashcard-bai.html` | Flashcard: 白 | Same flip pattern |
| 36 | `36-practice-flashcard-da.html` | Flashcard: 大 | Same flip pattern |
| 37 | `37-practice-numbers.html` | Number practice | Three equal number cards |
| 38 | `38-practice-negation.html` | Guess meaning | Click reveals pinyin and Vietnamese |
| 39 | `39-divider-text.html` | Text divider | Green reading section |
| 40 | `40-dialogue.html` | Dialogue | Two avatar rows, pinyin above Chinese |
| 41 | `41-stroke-yi.html` | Stroke: 一 | Hanzi Writer card with `Viết mẫu` button |
| 42 | `42-stroke-ba.html` | Stroke: 八 | Same stroke pattern |
| 43 | `43-stroke-da.html` | Stroke: 大 | Same stroke pattern |
| 44 | `44-stroke-bu.html` | Stroke: 不 | Same stroke pattern |
| 45 | `45-stroke-wu.html` | Stroke: 五 | Same stroke pattern |
| 46 | `46-stroke-kou.html` | Stroke: 口 | Same stroke pattern |
| 47 | `47-stroke-bai.html` | Stroke: 白 | Same stroke pattern |
| 48 | `48-stroke-nu.html` | Stroke: 女 | Same stroke pattern |
| 49 | `49-stroke-ma.html` | Stroke: 马 | Same stroke pattern |
| 50 | `50-stroke-ni.html` | Stroke: 你 | Same stroke pattern |
| 51 | `51-stroke-hao.html` | Stroke: 好 | Same stroke pattern |
| 52 | `52-divider-supplement.html` | Supplement divider | Supplement section with local visual asset |
| 53 | `53-culture-greetings.html` | Culture note | Vietnam/China greeting comparison |
| 54 | `54-number-gestures.html` | Number gestures | Supplement practice with local photo |
| 55 | `55-divider-homework.html` | Homework divider | Orange homework section |
| 56 | `56-exercises-list.html` | Exercises | Centered exercise list |
| 57 | `57-closing.html` | Closing | `下课`, next lesson preview, background image |

## Content Data

### Vocabulary

| # | Pinyin | Chinese | Vietnamese | Hán Việt | Type |
|---:|---|---|---|---|---|
| 01 | nǐ | 你 | anh, chị, bạn, ông, bà... | nhĩ | đại từ |
| 02 | hǎo | 好 | tốt, đẹp, hay, ngon | hảo | tính từ |
| 03 | nǐ hǎo | 你好 | Xin chào | nhĩ hảo | cụm từ |
| 04 | yī | 一 | một | nhất | số từ |
| 05 | wǔ | 五 | năm | ngũ | số từ |
| 06 | bā | 八 | tám | bát | số từ |
| 07 | dà | 大 | to, lớn | đại | tính từ |
| 08 | bù | 不 | không, chẳng | bất | phó từ |
| 09 | kǒu | 口 | miệng | khẩu | danh từ |
| 10 | bái | 白 | trắng | bạch | tính từ |
| 11 | nǚ | 女 | nữ, phụ nữ | nữ | danh từ |
| 12 | mǎ | 马 | con ngựa | mã | danh từ |

### Objectives

1. Chào hỏi bằng tiếng Trung: `你好`.
2. Nhận biết và đọc 12 từ vựng cơ bản.
3. Viết chữ Hán: `一、八、大、不、五、口、白、女、马、你、好`.

### Warmup

Question: `Bạn đã nghe câu chào nào bằng tiếng Trung chưa?`

Prompt chips: `phim ảnh`, `bài hát`, `bạn bè`, `trải nghiệm`.

Mini prompts:

1. `Nghe ở đâu?`
2. `Câu đó dùng khi nào?`
3. `Thử nói lại.`

### Dialogue

```text
A:
nǐ hǎo
你好

B:
nǐ hǎo
你好
```

### Practice

- Flashcards: `你`, `好`, `马`, `白`, `大`.
- Number recognition: `一`, `五`, `八`.
- Guess meaning: `不好`, `不大`, `不白`.

### Culture And Supplement

- Compare Vietnamese greetings by relationship with Chinese `你好`.
- Mention `您好 (nín hǎo)` as a more polite form to study later.
- Include number gesture practice as a supplement.

### Homework

Keep homework and exercise slides student-facing. Use direct Vietnamese instructions. Do not include teacher-only answers unless they are hidden behind classroom reveal behavior and intended for in-class checking.

## Interaction Rules

- Click on summary cards to reveal answers one by one.
- Click flashcards to rotate through Chinese, pinyin, and meaning.
- Click negation practice cards to reveal answers.
- Stroke slides auto-play once and include the `▶ Viết mẫu` button for replay.
- Presenter click passes reveal events to the active slide before moving on.

## Build Notes

- Keep individual slides in `output/book-1/lesson-01/slides/`.
- Keep the presenter manifest in `slides/index.html` synced with the 55-slide order.
- Keep local images under `slides/assets/photos/` and `slides/assets/reference/`.
- Keep embedded Hanzi Writer JSON under `slides/assets/hanzi-data/`.
- After changes, put visual QA screenshots under `exports/qa/` and export clean PDF backups under `exports/final/`.
