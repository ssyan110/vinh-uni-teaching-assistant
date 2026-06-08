# AI Teaching Material System Project Memory

This file is durable project context for AI agents. Read it after `AGENTS.md` and before doing non-trivial work.

## Harness Engineering Default

Adam added this because he has had to repeat the same instructions to Codex too often.

For this project, use harness engineering by default:

- Define the artifact under work and its success gate before editing.
- Load project-local context proportional to the task. For small existing-output edits, read `AGENTS.md`, affected files, and the one relevant workflow doc. For structural/generator work, read `.kiro/skills/harness-engineering/SKILL.md`, `.kiro/steering/`, relevant `.kiro/skills`, and project docs.
- Use existing scripts, lesson templates, output folders, presenter patterns, and validation routines.
- Verify with concrete checks scaled to the change: single-slide screenshot for title/wording/layout edits; asset manifest + asset QA plus affected-slide screenshot for image edits; pipeline/data validation and broader visual QA only for new/regenerated lessons or structural changes; PDF export only after Adam confirms finalization.
- Inspect outputs, logs, screenshots, and diffs before saying work is done.
- When Adam says a preference should persist, update repo-local files and cross-tool rules so future agents do not depend on chat history.
- Scale the workflow to the edit. Small edits to existing generated lessons, such as one slide title, wording, spacing, or 1-2 image swaps, should patch the affected output directly and run narrow checks. Do not regenerate a whole lesson or sync every doc unless the change is reusable, structural, or explicitly requested as a durable rule.

## Current High-Value Project Rules

- Huashu Design is the slide engine. HTML presenter is primary. No PPTX workflow unless Adam explicitly changes this rule.
- Vietnamese is used for instructions and labels; Simplified Chinese is used for target learning content; pinyin supports pronunciation.
- Steps 1-8 can be automated before teacher review. Steps 9-18 require teacher approval.
- Lesson 01 is the canonical template for regular lessons.
- Lesson 10 `output/book-1/lesson-10/slides/01-cover.html` is the canonical cover template for future lessons, but covers no longer use the old three keyword/topic pills. Keep the lesson badge (`BÀI N · 第N课`) about 30% larger than the old 12pt badge, roughly 16pt.
- Clean PDF backups are finalization artifacts; ask Adam before exporting them.
- **Pinyin course (approved 2026-06-04; template updated 2026-06-05):** 6 independent lessons from AI Mandarin (`Pinyin lessons/`). NOT from 漢語教程. Full spec: `docs/pinyin-lesson-database-spec.md`. Pipeline config: `scripts/pipeline/configs/pinyin.json` v2.0.0. Output path: `output/pinyin/pinyin-{01-06}/`.
- **Pinyin slide baseline:** Future pinyin lessons reuse `output/pinyin/pinyin-01` as the pinyin-course template instead of rebuilding from scratch. Keep its cover, objective, divider, concept, tone, vocabulary, flashcard, practice, appendix/input setup, and closing visual language; swap lesson-specific text/content/images. Pinyin covers use the Lesson 1 layout: `PINYIN N · 拼音第N课`, `pīn/yīn` above `拼音`, and learned pinyin sounds/rules appear as grouped rounded chips in the subtitle slot. Increase spacing between sound tokens and wrap chips to a second line when needed. Pinyin closing slides always show `下课`, `Bạn có câu hỏi gì không?`, and `Bài tiếp theo: Pinyin N` for the next lesson.
- **Pinyin wording:** Use `thanh điệu`, not `thanh điều`. Pinyin goal slides highlight taught initials/finals in bold red and adapt the goal text to the lesson, e.g. `Học 5 thanh điệu tiếng Trung`.
- **Pinyin vocabulary grid:** Future `Từ vựng 1`, `Từ vựng 2`, etc. grid slides keep only the top bar label and vocabulary grid. Do not add extra body descriptions like `Tập trung đọc...`.
- **Pinyin classroom slides:** No `Mục lục` or `Quy ước` slides in future pinyin decks. Pinyin slides do not show bottom-right `Trang ...` page indicators.
- Images are tracked as lesson data. VP databases should carry `image_role`, `image_prompt`, `image_file`, `image_reuse_from`, `image_status`, and `image_semantic_check`. Complete lessons must have `slides/assets/asset-manifest.json` and `exports/qa/asset-qa-report.json`.
- New lesson generation uses blank placeholder image files first. Use Chrome/ChatGPT contact sheets or targeted replacement only when Adam asks for real images.
- Use `npm run assets:manifest -- output/book-1/lesson-XX`, `npm run assets:qa -- output/book-1/lesson-XX`, `npm run assets:replace -- --lesson output/book-1/lesson-XX --record V001 --image /path/to/new.png`, and `npm run assets:crop-contact-sheet -- --lesson output/pinyin/pinyin-XX --sheet /path/to/sheet.png --records V001,V002` for image workflows.
