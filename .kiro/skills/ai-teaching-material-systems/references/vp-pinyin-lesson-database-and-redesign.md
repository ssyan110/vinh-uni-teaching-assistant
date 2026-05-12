# VP Pinyin Lesson Database + Copyright-Safe Redesign

Use this reference when Adam provides a Pinyin lesson PDF and asks to implement the VP production flow or redesign slides from a reference file.

## Core VP rule

Implement **only steps 1–8** before teacher review:

1. 教材輸入 — input/source PDF or Google Drive file
2. 課次切分 — lesson list
3. 內容抽取 — pinyin, vocabulary, text/dialogue, grammar, exercises
4. 頁碼標註 — page mapping for every item
5. 教學重組 — new lesson structure
6. 補充活動 — warm-up, pinyin drills, vocab drills, grammar drills, text preview, culture supplement, discussion
7. 遊戲標記 — group-game suitability
8. 寫入資料庫 — Google Sheets-ready database

Stop here. Steps 9–19 require teacher review/approval first. Do not generate final teacher/student decks or homework systems as if approved unless Adam explicitly asks.

## Canonical post-review MVP steps 9–19

Adam later provided the original planning document, which defines steps 9–19 as:

9. 人工審閱 — teacher checks content, page mapping, teaching order, and answer keys in Google Sheets.
10. 生成老師備課版 — generate teacher-facing notes from Approved Data.
11. 生成 Huashu Brief — convert Approved Data into Huashu-compatible deck instructions. Original doc said Gamma Brief; replace Gamma with Huashu Design.
12. 生成教師版簡報 — Huashu Design generates the teacher deck locally from HTML source.
13. 匯出備份 — export PPTX / PDF backups from Huashu.
14. 生成學生版內容 — remove teacher tips, internal review info, and in-class exercise answers.
15. 生成作業題庫 — create vocabulary, pinyin, hanzi, grammar, and text-related homework/questions.
16. 題庫審閱 — teacher reviews questions and answers in Google Sheets.
17. 建立學生版與作業 — create student version and homework in the selected student workflow. If Formative is unavailable/paid, keep Sheets/CSV/HTML-ready content first.
18. 課堂測試 — use Lesson 1 in class and collect feedback.
19. 回填修正 — record issues and improvement suggestions in the Improvement Log.

## Post-review steps 9–19 status

The exact original canonical wording for VP steps 9–19 was not preserved in the current project notes. If Adam asks what 9–19 are, do not pretend the following is recovered source text. Present it as the current working operational draft unless a transcript/source doc is found.

Working draft:

9. 教師審核 / Teacher review — teacher checks extracted content, page mapping, teaching sequence, activities, and approves/rejects rows.
10. 內容修正 / Content correction — fix vocabulary, pinyin, Vietnamese explanations, Simplified Chinese text, source references, and activity notes.
11. 最終教學順序確認 / Final teaching sequence approval — lock the approved lesson flow before final generation.
12. 課件生成 / Generate classroom slide deck — approved database rows become student-facing HTML slides.
13. 教師手冊生成 / Generate teacher guide — teaching script, timing, activity instructions, answers, and classroom notes; keep this out of classroom slides.
14. 練習與作業生成 / Generate exercises + homework — in-class drills, after-class homework, review questions, and answer key.
15. 遊戲活動生成 / Generate game materials — turn approved game-marked activities into classroom-ready group games.
16. 輸出 PDF / Export PDF — student/classroom PDF version.
17. 輸出可編輯 PPTX / Export editable PPTX — editable teacher PowerPoint via huashu-design.
18. QA 檢查 / Quality assurance — screenshot QA, language check, no teacher notes on slides, no Traditional Chinese, no unwanted English labels, PPTX slide-count verification.
19. 交付與歸檔 / Delivery + archive — final package: HTML, PDF, PPTX, teacher guide, database, source files, screenshots, and version notes.

Boundary summary: steps 1–8 build the review database; step 9 is the teacher-review gate; steps 10–19 turn the approved database into final teaching materials.

## Database output shape

Preferred Google Sheets-ready tabs/files:

- `01_lesson_list.csv`
- `02_content_items.csv`
- `03_lesson_structure.csv`
- `04_supplemental_activities.csv`
- `05_game_suggestions.csv`
- `06_google_sheets_database.csv`
- `vp_<lesson>_database.json`

Minimum columns for the main database:

- `lesson_id`
- `lesson_title`
- `record_id`
- `record_type`
- `section`
- `source_pdf`
- `source_page`
- `source_page_range`
- `teaching_order`
- `chinese_simplified`
- `pinyin`
- `vietnamese`
- `word_type_vi`
- `raw_source_text`
- `classroom_visibility`
- `teacher_review_status`
- `approved`
- `notes_for_review`
- `generated_at`

For vocabulary, include Vietnamese word types such as `danh từ`, `động từ`, `tính từ`, `phó từ`, `số từ`, etc.

## Google Sheets fallback

If Google Workspace auth is unavailable, do not block. Export UTF-8-SIG CSVs and JSON in the project output folder, and report that the files are ready to import into Sheets. Use the `google-workspace` skill only after auth exists.

## Reference-design handling

When Adam attaches a design reference PDF:

- Analyze it visually for reusable design principles.
- Use it as inspiration only; do **not** copy exact artwork, layout, title lettering, colors, brand/copyright/contact text, or composition.
- Create a local design note, e.g. `design/<reference>-style.md`, and optional token JSON.
- For Pinyin lesson style inspired by a playful commercial reference: use pastel classroom aesthetic, rounded title typography, original hand-drawn classroom objects, color-coded pinyin concepts, central examples with connector cards.

Classroom slides must still follow Adam's rules: Vietnamese + Simplified Chinese, no teacher tips/source notes/tool labels/audience labels; prep notes go into `教师手册`.

## Verification

For VP database tasks, verify:

- all output files exist
- row count is plausible
- every content row has a source page
- vocabulary rows include `word_type_vi`
- metadata says completed steps are `[1,2,3,4,5,6,7,8]`
- steps 9–19 are explicitly not implemented/pending teacher review
