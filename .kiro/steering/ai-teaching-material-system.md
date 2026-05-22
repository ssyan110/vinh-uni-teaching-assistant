# AI teaching-material system steering

Project-local rules and context. Auto-included by Kiro; referenced by AGENTS.md for other agents.

## Must-read order

1. `AGENTS.md` (cross-agent entry point)
2. `docs/ai-teaching-material-system-requirements-context.md` or `.html`
3. Relevant `.kiro/skills/*/SKILL.md`

## Non-negotiable rules

- Use Huashu Design instead of Gamma unless Adam explicitly changes direction.
- Keep decks HTML-first; PDF/PPTX are exports.
- Default courseware language: Vietnamese (instructions/labels) + Simplified Chinese (target content) + pinyin (pronunciation). Avoid Traditional Chinese and English labels.
- Do not generate final classroom/student/homework materials before teacher review approval.
- Preserve original source page mapping for every slide, exercise, and homework question.
- Student-facing materials must not contain teacher tips, internal review notes, or in-class exercise answers.
- Durable project rules must be written into repo files, not only remembered in chat.
- Lesson types: `regular` (full lessons with vocab/grammar/text) and `pinyin` (pinyin-only lessons). Never call it "normal" — use "regular".
- Pinyin content in regular lessons is SKIPPED — pinyin is handled by the separate pinyin lesson workflow.
- 課文 section is labeled "Bài đọc" in Vietnamese (not "Bài khóa").
- Default game platform is Blooket. Only use Kahoot or Quizizz when Blooket cannot support the exercise format.
- Slide design: Gamma Soft Gradient style (locked). See `reference/ppt-style-guide.md`. Do NOT use dark themes, Oriental Fantasy, or 中國風.
- Vocabulary slides: one word per card, no examples inside. Examples go on a separate "Mẫu câu" page.
- All vocabulary must include hán việt (Sino-Vietnamese reading) in parentheses.
- Pinyin always above 漢字 on separate lines. Never inline.
- Use "từ vựng" not "sinh từ", "cụm từ" not "thành ngữ".

## Canonical MVP flow (steps 1-19)

Steps 1-8 are pre-review and can be automated. Steps 9-19 require teacher approval first.

1. 教材輸入: upload/source PDF or Google Drive material.
2. 課次切分: split into lesson list.
3. 內容抽取: extract pinyin, vocabulary, text/dialogue, grammar, exercises.
4. 頁碼標註: every item gets original source page mapping.
5. 教學重組: restructure into the standard lesson sequence.
6. 補充活動: generate warm-up, pinyin/vocab/grammar drills, text preview, culture supplement, discussion.
7. 遊戲標記: mark activities suitable for Kahoot / Quizizz / Blooket.
8. 寫入資料庫: output Google Sheets-ready database.
9. 人工審閱: teacher checks content, pages, teaching order, and answer keys.
10. 生成老師備課版: generate teacher-facing guide from Approved Data.
11. 生成 Huashu Brief: convert Approved Data into Huashu-compatible deck instructions.
12. 生成教師版簡報: generate teacher deck using Huashu HTML source.
13. 匯出備份: export PPTX / PDF backups.
14. 生成學生版內容: remove teacher tips, internal review info, and in-class exercise answers.
15. 生成作業題庫: generate vocabulary, pinyin, hanzi, grammar, and text-related homework/question bank.
16. 題庫審閱: teacher reviews questions and answers.
17. 建立學生版與作業: create student version and homework (Sheets/CSV/HTML-ready if Formative unavailable).
18. 課堂測試: use Lesson 1 in class and collect feedback.
19. 回填修正: record issues and improvement suggestions in Improvement Log.

## Standard lesson sequence

暖身活動 → 學習目標 → 拼音 → 拼音練習 → 生詞 → 生詞練習 → 語法 → 語法練習 → 課文預習 → 課文 → 文化補充 → 課程討論 → 課後作業說明

Rules:
- Warm-up comes before learning objectives.
- Grammar comes after vocabulary and before text preview.
- 課文理解 is not a separate module; avoid overlap with 課文預習.
- 任務活動 is not a default module unless the source textbook has it.
- 課堂總結 has been renamed 課程討論.
- Formative is for student reading version and homework, not live class drills.
- Pinyin, vocabulary, and grammar drills may be marked for Kahoot / Quizizz / Blooket.
- Student version does not include in-class exercise reference answers.

## Important source files

- Original planning document: `docs/ai-teaching-material-system-requirements-context.md`
- HTML view: `docs/ai-teaching-material-system-requirements-context.html`
- Sample teacher deck: `output/sample-teacher-deck/`
- Pinyin L1 design prototype: `output/pinyin-l1-design-prototype/`
- VP Pinyin L1 database: `output/vp-database/pinyin-l1/`
