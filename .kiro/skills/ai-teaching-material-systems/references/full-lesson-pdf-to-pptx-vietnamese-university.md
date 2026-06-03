# Full Lesson PDF → Vietnamese University PPTX Workflow

Use this reference when Adam asks to turn one textbook lesson into a full, editable PPTX using the local Huashu teaching-material system.

## Trigger

Adam asks for a full lesson PPTX from a Chinese/Vietnamese textbook PDF after a prototype/style direction is approved.

## Proven project shape

- Project root: `~/Development/ai-teaching-material-system`
- Deck engine: `huashu-design` local repo
- Theme source: inspect optional theme repo, translate style into local HTML/CSS; do not depend on it at runtime
- Output folder pattern: `output/<lesson-slug>/`
- Required outputs:
  - `index.html`
  - `slides/*.html`
  - `教师手册.md` for prep notes only
  - `<lesson-slug>.pdf`
  - `<lesson-slug>-editable.pptx`
  - `screenshots/*.png`

## Language and classroom-content rules for Adam's Chinese courseware

Materials are for Vietnamese universities by default:

- Vietnamese: visible labels, classroom instructions, assessment, homework, README/SOP.
- Simplified Chinese: target language headings/content, vocabulary, dialogue, grammar/phonetics labels.
- Pinyin: include as pronunciation support.
- Avoid default English teaching labels (`Teacher`, `Vocabulary`, `Example`, `Tone 1`, `Textbook source`, etc.).
- Avoid Traditional Chinese unless Adam explicitly asks.
- Use SC-oriented fonts: `PingFang SC`, `Noto Sans SC/Serif SC`, `Microsoft YaHei`, `Songti SC`.
- Classroom slides must be student-facing only. Do not show audience labels (`Dành cho sinh viên...` / `面向...`), source page notes (`Nguồn: trang...`), theme/tool branding (`Kami × Huashu`), or implementation notes.
- Do not show teacher-prep labels or guidance on classroom slides: `Cách triển khai`, `教师提示`, `Cách luyện`, `Nhắc nhanh`, `Mẹo dạy`, `Giảng viên...`, `Cách nói cho sinh viên`, etc.
- Put all teacher prep notes and lesson-flow suggestions in `教师手册.md`.
- Use consistent student-facing section titles: `Mục tiêu bài học`, `Từ vựng`, `Ngữ âm`, `Tập viết chữ Hán`, `Kiểm tra cuối bài`.
- Vocabulary entries should include Vietnamese part of speech/type labels, e.g. `đại từ`, `tính từ`, `số từ`, `phó từ`, `danh từ`, `lượng từ`.
- Pinyin/phonetics section titles should be plain and consistent; avoid cute/weird labels like `nghe hơi trước, đọc chữ sau`.

## Workflow

1. Load `ai-teaching-material-systems` and `powerpoint`.
2. Confirm or discover the lesson page range.
   - Use PyMuPDF text extraction first.
   - If text is garbled, render a contact sheet and/or OCR the target page range.
   - Quote PDF paths containing spaces/brackets/diacritics.
3. Build a full deck generator script under `scripts/`, not one-off hand-edited slides.
4. Add package scripts for create/verify/export/build.
5. Use Huashu verify and export scripts:

```bash
.venv/bin/python huashu-design/scripts/verify.py output/<slug>/index.html --slides <N> --output output/<slug>/screenshots --wait 3000
node huashu-design/scripts/export_deck_pdf.mjs --slides output/<slug>/slides --out output/<slug>/<slug>.pdf --width 1280 --height 720
node huashu-design/scripts/export_deck_pptx.mjs --slides output/<slug>/slides --out output/<slug>/<slug>-editable.pptx
```

6. Verify PPTX slide count by opening the PPTX as a zip and counting `ppt/slides/slide*.xml`.
7. Run visual QA on screenshots, preferably with a subagent, then fix and rebuild.
8. Update README/SOP with the new lesson build command/output folder.

## Full Lesson 1 example structure

For `GT Hán Ngữ 1`, Lesson 1 (`第一课 · 你好`) was extracted from PDF pages 19–30 and produced a 26-slide full deck. Use PDF pages only for extraction; visible slide `.page-indicator` labels must use textbook page numbers from the database.

1. Cover
2. Objectives
3. Lesson route
4. Dialogue `你好`
5–7. Vocabulary and usage
8. Syllable structure
9–12. Initials overview and articulation (`b p m f`, `d t n l`, `g k h`)
13–14. Finals (`a o e i u ü`, `ai ei ao ou`)
15. Pinyin spelling (`i/u/ü → yi/wu/yu`)
16–19. Tones, tone meaning, tone mark placement, 3rd-tone sandhi
20. Syllables and characters
21–23. Tone/initial/final drills
24. Character recognition and reading
25. Writing practice with character/stroke-order visuals
26. Book-style end-of-lesson exercises, not a generic checklist/homework slide

## PPTX-safe implementation notes

- Fixed slide body: `960pt × 540pt`.
- Keep visible text inside text tags (`<p>`, headings, `li`).
- Put borders/backgrounds on container divs, not text tags.
- For chips, use `<div class="pill"><p>text</p></div>`.
- If grid rows have variable lengths, dynamically set `grid-template-columns: repeat(${row.length}, 1fr)` to avoid blank cells in HTML/PPTX.
- Avoid CSS that Huashu's editable exporter cannot map reliably (heavy shadows, gradients, complex pseudo-elements for essential content).
- If using local image/GIF assets whose filenames contain Chinese characters, `pptxgenjs`/Huashu may request URL-encoded names (e.g. `%E4%B8%80.gif`). Generate/copy both the raw Chinese filename and the percent-encoded filename so PPTX export can resolve media paths.
- For writing slides, local stroke-order GIFs are reliable for HTML/PDF; editable PPTX may embed the first frame/static media depending on exporter support. Keep the slide usable even if animation is flattened.

## Writing-stroke visuals

Adam asked for `写汉字` slides to show only characters plus stroke-order animation/visuals, not teacher implementation tips. Preferred source is writtenchinese.com when available. If direct GIF download is not straightforward or the site relies on dynamic canvas, generate local stroke-order GIF placeholders/assets in the output folder and mention the limitation in `教师手册.md`, not on classroom slides.

For PPTX-safe export:

- Store assets under `output/<slug>/assets/strokes/`.
- Reference with relative `<img src="../assets/strokes/<char>.gif">` from slide HTML.
- Also create percent-encoded copies for Chinese filenames before PPTX export.
- Avoid teacher-facing text like `Cách làm trên lớp` on the slide; use student-facing text such as `Quan sát thứ tự nét, sau đó viết vào ô luyện tập.`

## Visual QA pitfalls found

Even after automated verification passes, inspect screenshots for:

- Blank/odd cells caused by fixed 6-column drill grids with only 4 items.
- Internal labels like `BÀI 1 ĐẦY ĐỦ` looking too file-version-like; prefer `BÀI 1` on slides.
- Vietnamese typos from OCR or drafting (`hơi` vs `hỏi`/`hồi`). Note `chào hỏi` is valid; don't blindly replace every `hỏi`.
- Unnatural Vietnamese phrasing; rewrite for native classroom usage, not literal translation.
- Content errors from OCR or model drafting (e.g. `马 · nghĩa` should be `马 · ngựa`; `八号` should be `bā hào`).
- Overuse of the same two-card + navy callout layout; vary layout when generating longer decks.
- Header/footer too small for projection; slightly increase size/contrast for university classrooms.
- Teacher-prep text leaking onto class slides after an initial fix. Search screenshots/source for `Cách triển khai`, `教师提示`, `Cách luyện`, `Nhắc nhanh`, `Mẹo dạy`, `Giảng viên`, `Cách nói cho sinh viên`, `Hoạt động:`, and `Gợi ý:` and replace with student-facing content or move to `教师手册.md`.
- Internal/audience/source text leaking onto the cover: `Dành cho sinh viên...`, `面向...`, `Hướng dẫn bằng...`, `Nguồn:`, `Kami`, `Huashu`. Remove these from classroom slides.
- Incorrect articulation wording for Mandarin `g k h`: use `âm gốc lưỡi` / `Gốc lưỡi`, not `âm cuống lưỡi`.
- Character-reading (`认读`) slides introducing new words outside the lesson. Restrict to current-lesson vocabulary or previously learned words/characters.
- Final check slides drifting into generic checklists/homework. Prefer book-style exercise formats from the textbook (tone rows, sandhi items, initial/final discrimination) and put homework/teacher notes in `教师手册.md` if needed.

## Verification snippet

```bash
python3 - <<'PY'
import zipfile, re, os
base='output/<slug>'
pptx=os.path.join(base,'<slug>-editable.pptx')
with zipfile.ZipFile(pptx) as z:
    slides=[n for n in z.namelist() if re.match(r'ppt/slides/slide\d+\.xml$', n)]
print('pptx slides', len(slides))
PY
```

Also search generated source/PPTX text for accidental English labels or Traditional-oriented content when Vietnamese + Simplified Chinese is required.
