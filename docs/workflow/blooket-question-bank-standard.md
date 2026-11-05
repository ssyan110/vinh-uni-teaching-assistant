# Blooket Question Bank Standard

Status: active project default, 2026-11-04. Applies to future Blooket question-bank CSVs unless Adam specifies a different format, count, question mix, or scope.

## Default set design

Use the integrated review pattern established by the Year 1 Lessons 13–14 Blooket set:

- 80 questions as the default for a comparable two-lesson review.
- 50 vocabulary-to-pinyin questions, covering the selected lesson vocabulary once each where the scope has 50 items.
- 22 context-comprehension questions. Present a short situation or at least two brief speaker turns, then ask a concrete question about what happened, why, what someone decided, or what happens next.
- 8 integration questions that require combining relevant information across the included lessons. For a one-lesson scope, use meaningful within-lesson integration or move those slots to context comprehension; do not force a cross-lesson connection.
- Adjust counts when the lesson vocabulary pool or user-requested scope differs. Do not duplicate words or invent filler to hit a quota; state the resulting question mix in the QA record.

Questions should be immediately clear to students without lesson labels, internal type names, or reminders. Give four distinct options and one defensible correct answer. Context questions must be answerable from the displayed dialogue or a clearly identified lesson source. Do not add facts that are absent from the source. Adapted teacher read-aloud stories must be identified as such and must not be presented as textbook dialogue.

For multiple lessons requested as one set, produce one merged CSV by default. Keep each lesson's vocabulary coverage identifiable in the question bank and QA record.

## Blooket CSV format

Use UTF-8 with BOM and this exact first row, header row, and eight-column order:

1. Preamble row: first cell `Blooket\nImport Template`; remaining seven cells blank.
2. Header row:

   `Question #`, `Question Text`, `Answer 1`, `Answer 2`, `Answer 3\n(Optional)`, `Answer 4\n(Optional)`, `Time Limit (sec)\n(Max: 300 seconds)`, `Correct Answer(s)\n(Only include Answer #)`.

3. Question rows: four nonblank, unique options; `Correct Answer(s)` is the 1-based answer number, not the answer text.

Default time limits are 30 seconds for vocabulary/pinyin, 45 seconds for context comprehension, and 60 seconds for integration questions. Balance correct-answer positions across the complete set; for 80 questions, use each position exactly 20 times.

## Source and verification

Resolve the offering, textbook, and full lesson keys first. Use the current canonical lesson source and approved materials for vocabulary, pinyin, meanings, and context facts. If those sources are unavailable, reuse only traceable existing draft evidence, record the limitation, and keep the result a review draft. Do not turn a technical check into source approval, teacher approval, or classroom acceptance.

Before handoff, read back the exported CSV and verify:

- exact preamble, header, column count, UTF-8 BOM, and declared row count;
- every question has four distinct, nonempty choices and one valid answer index selecting the keyed answer;
- coverage and distribution match the question bank and QA record;
- each context and integration answer is supported by its cited source, with no added plot detail;
- correct-answer positions are balanced and time limits match the question type.

Keep the question bank and QA evidence beside the CSV in the lesson's `10-design/support-draft/blooket/` path. Approval, Blooket import/save, and classroom use remain separate states. Import only when the user requests it and verify the saved set separately.
