---
name: chinese-homework-question-bank
description: "Generate beginner Chinese homework/question banks from approved lesson data using a textbook-like CFL exercise spine: pinyin, vocabulary, hanzi retrieval, grammar, dialogue comprehension, and small output."
version: 1.0.0
author: Hermes Agent
license: MIT
metadata:
  hermes:
    tags: [chinese, homework, question-bank, formative, google-forms, vietnamese-learners, assessment]
    related_skills: [ai-teaching-material-systems, google-workspace, avoid-ai-writing]
---

# Chinese Homework Question Bank

Use this skill when generating 作業題庫 / homework-question banks for beginner Chinese lessons in this repo.

Primary reference:
- From the repo root: `reference/chinese_language_exercise_report.md`

## Default audience and language

- Learners: Vietnamese university beginners.
- Instructions and explanations: Vietnamese.
- Target language: Simplified Chinese.
- Pronunciation support: pinyin, tapered inside the assignment.
- Do not use Traditional Chinese unless Adam explicitly asks.
- Keep student-facing copy direct and simple.

## Core design rule

Do not create a worksheet that can be completed only by recognition.

Every homework set must include:
1. at least one hanzi retrieval task, and
2. at least one short meaning-to-Chinese or functional output task.

The beginner staircase is:
Recognition → controlled production → guided communication.

## Default lesson-level blueprint

For a normal beginner lesson with about 11 new words, 1–2 grammar targets, and one short dialogue:

- 13–15 prompts total.
- About 22–27 response actions.
- Estimated student time: 24–31 minutes.
- Skill distribution:
  - Pinyin/pronunciation: 10–15%, usually 2 prompts.
  - Vocabulary: 20–25%, usually 3 prompts.
  - Hanzi writing/retrieval: 20–25%, usually 2 prompts.
  - Grammar: 20–25%, usually 3 prompts.
  - Text/dialogue comprehension: 15–20%, usually 2 prompts.
  - Integrated communication: 10–15%, usually 1–2 prompts.

## Bloom distribution

Earliest beginner lessons:
- Remember: about 40%.
- Understand: about 30%.
- Apply: about 20%.
- Analyze: about 10%.

Late HSK 2 can shift toward 30/30/25/15.

Keep Analyze concrete for beginners: sort, compare, detect errors, sequence dialogue, or choose why a reply does not fit.

## Pinyin support taper

Inside one homework set, taper support:
1. Full pinyin in early recognition/listening tasks.
2. Partial pinyin in sentence or cloze tasks.
3. No pinyin in hanzi retrieval and short output tasks when feasible.

## Delivery-mode defaults

- Google Forms: auto-graded recognition, matching, short grammar checks, listening/multiple choice, simple short answer.
- Formative: handwriting/drawing, drag/drop, categorize, resequence, audio response, oral reply.
- Printable PDF: hanzi handwriting, copy-cover-write-check, short written output.
- Kahoot/Blooket: optional fast recall or class-game variants; not the default homework record.

The recommended assignment package is:
- Auto-graded core.
- Written hanzi/grammar page.
- Communicative extension.

## Required item metadata

Each generated item should include:

- `question_id`
- `lesson_id`
- `source_page` or `source_page_range`
- `skill_area`: pinyin, vocabulary, hanzi, grammar, text_comprehension, integrated
- `bloom_level`: Remember, Understand, Apply, Analyze
- `delivery_mode`: Google Forms, Formative, Printable PDF, Kahoot/Blooket optional
- `question_type`
- `prompt_vi`
- `prompt_zh` when useful
- `student_input_type`
- `options` when applicable
- `answer_key` or `rubric`
- `points`
- `estimated_minutes`
- `teacher_review_status`: default `draft_for_review`

## Anti-patterns to avoid

- Too many recognition-only items.
- Keeping pinyin on every item for too long.
- Treating hanzi as copying only.
- More than 1–2 grammar targets in one beginner homework set.
- Isolated grammar sentences only, with no dialogue/situation use.
- No cumulative review in later lessons.
- Pure rote memorization without contextual use.

## Output files

For lesson outputs, write to:

`output/book-{N}/lesson-{NN}/homework-question-bank/`

Recommended files:
- `homework_question_bank.json`: complete machine-readable item bank.
- `homework_question_bank.csv`: Google Sheets/Formative-friendly table.
- `homework_question_bank_review.md`: human review summary and QA checklist.

## Verification checklist

Before saying the bank is done:

- Confirm item count and response-action count.
- Confirm all required skill areas are present.
- Confirm Bloom balance is close to the beginner default.
- Confirm at least one hanzi retrieval task exists.
- Confirm at least one short output task exists.
- Confirm source pages are preserved.
- Confirm no Traditional Chinese or English UI labels are introduced.
- Confirm all items are marked `draft_for_review`, unless teacher approval has happened.
