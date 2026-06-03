# Lesson PDF → Kami-style Huashu Prototype

## When to use

Use this when Adam provides a textbook PDF and asks for only one lesson/prototype deck before approving a full lesson/course generation, especially when a visual theme repo such as `tw93/Kami` is specified.

## Proven sequence

1. **Use `~/Development` for the project repo/system**
   - Adam wants reusable project systems under `~/Development/` like other projects.
   - If an older copy exists under `~/Desktop/Hermes Output/`, copy safely with `rsync` rather than deleting/moving until the Development copy is verified.

2. **Inspect the PDF before extraction**
   - Check file existence, page count, and text extractability.
   - Some Foxit-produced textbook PDFs return corrupted/gibberish text via PyMuPDF even when visually readable.
   - If text extraction is bad, render a contact sheet of pages and visually identify the lesson range.

3. **Find the target lesson range**
   - For the Hanka/Hán Ngữ 1 upper-volume PDF in this session:
     - Lesson 1 was extracted from PDF pages 19–30.
     - Lesson 2 starts on PDF page 31.
   - Use this only to locate the lesson range in the PDF. Visible slide `.page-indicator` labels must use the textbook page numbers recorded in the database, not these PDF positions.
   - Use this as a pattern, not a global fact for all textbooks: confirm the page range and textbook page mapping each time.

4. **OCR only the requested lesson**
   - Use Tesseract when PyMuPDF text is corrupted.
   - Available language combination used successfully: `chi_sim+vie+eng`.
   - Keep OCR output as working material; expect OCR cleanup for pinyin tone marks and Vietnamese diacritics.

5. **Inspect the theme repo and translate design tokens**
   - Kami theme characteristics from `tw93/Kami`:
     - parchment canvas `#f5f4ed`, never pure white
     - ink blue `#1B365D` as the sole strong accent
     - warm neutrals only
     - serif-first editorial typography
     - ring/whisper borders, no hard shadows or flashy palettes
   - Implement these in huashu-compatible HTML/CSS; do not require Kami at runtime.

6. **Create a small prototype, not the full lesson**
   - 5–8 slides is enough for style approval.
   - Include real lesson content: cover, lesson map, dialogue, vocabulary, phonetics/tones, practice board.
   - Avoid over-generating the complete lesson before Adam approves the design.

7. **Export and verify through Huashu**
   - Generate `output/<slug>/slides/*.html` and `index.html`.
   - Run huashu Playwright verification for screenshots.
   - Export PDF with `huashu-design/scripts/export_deck_pdf.mjs`.
   - Export editable PPTX with `huashu-design/scripts/export_deck_pptx.mjs`.
   - Verify PPTX slide count by opening the `.pptx` zip and counting `ppt/slides/slide*.xml`.

8. **Do visual QA and one fix loop**
   - Use screenshot QA or a visual subagent even for prototypes.
   - Common fixes from this session:
     - reduce overlarge titles
     - darken small gray text for projection
     - add clearer practice instructions
     - rebalance dense vocabulary grids
     - avoid underfilled dark panels

## Vietnamese university language correction

After the first prototype, Adam clarified that all teaching materials are for Vietnamese universities. Future prototype/courseware work should apply this upfront, not as a late cleanup pass:

- Visible instructional labels and teacher-facing copy should be Vietnamese, not English.
- Chinese content should be Simplified Chinese only unless Adam explicitly requests Traditional.
- Use pinyin only as pronunciation support.
- Replace visible terms such as `Lesson 1 prototype`, `Textbook source`, `Design direction`, `Teacher cue`, `Vocabulary`, `Phonetics`, `Exit check`, `Tone 1`, and `Example` with natural Vietnamese equivalents.
- Replace Traditional examples in generated content: `餐廳→餐厅`, `點菜→点菜`, `牛肉麵→牛肉面`, `買單→买单`, `謝謝→谢谢`, etc.
- Use SC font fallbacks in courseware (`PingFang SC`, `Noto Sans/Serif SC`, `Microsoft YaHei`, `Songti SC`) rather than TC/JhengHei fallbacks.
- Add a generated-project README rule documenting Vietnamese + Simplified Chinese defaults so future project scripts inherit it.
- If visual QA says the deck should be English + Traditional, ignore that as a QA prompt misunderstanding; the requirement is Vietnamese + Simplified Chinese.

## Huashu editable PPTX pitfalls found

`html2pptx` rejects text elements with layout styling:

```text
Text element <p> has border. Backgrounds, borders, and shadows are only supported on <div> elements, not text elements.
Text element <p> has background. Backgrounds, borders, and shadows are only supported on <div> elements, not text elements.
```

Fix pattern:

```html
<!-- Bad -->
<p class="pill">ba</p>

<!-- Good -->
<div class="pill"><p>ba</p></div>
```

CSS:

```css
.pill { border: 1pt solid #e8e6dc; background: #faf9f5; }
.pill p { color: #1B365D; font-size: 16pt; }
```

Also watch for bottom overflow in dense vocabulary slides. Reduce title size, content top offset, row padding, and font sizes until huashu PPTX validation passes.

## Verification command pattern

```bash
cd ~/Development/ai-teaching-material-system
npm run build:lesson1:kami
```

The session's final prototype passed:

- HTML screenshots: 6/6
- JavaScript errors: none
- Console: clean
- PDF export: 6 pages
- PPTX export: 6 editable slides
- PPTX slide count verified: 6
