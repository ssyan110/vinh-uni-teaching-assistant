# Agent instructions

This file is the entry point for AI agents in this repo. Read it first, then load only the narrow files needed for the task.

## Quick start

1. Classify the task size.
   - Small edit: change one slide, one asset, or one line of copy.
   - Structural work: new lesson, regenerated lesson, pipeline change, shared template change, presenter change, or durable rule change.
2. For small edits, patch the affected output directly and verify the smallest useful surface.
3. For structural work, read the local harness docs, the relevant skill files, and the project docs that apply to the request.
4. Do not depend on chat memory for recurring rules.

## Project summary

Build a reusable AI teaching-material system for Chinese courseware used in Vietnamese universities. The flow is textbook PDF -> structured data -> reviewable database -> teacher slides -> student-facing classroom material.

## Core skills

- `harness-engineering/` - default operating frame for non-trivial work
- `ai-teaching-material-systems/` - pipeline workflow, VP steps, language rules, QA pitfalls
- `huashu-design/` - HTML-first slide and deck generation
- `google-workspace/` - Drive and Sheets automation
- `pinyin-vocab-contact-sheet-images/` - pinyin vocab image workflow
- `chinese-homework-question-bank/` - homework and practice generation
- `avoid-ai-writing/` - clean user-facing docs and lesson copy

## Non-negotiable project rules

- Use the HTML presenter at `slides/index.html`; no PPTX workflow.
- Keep lesson-root `index.html` as the classroom launcher/status page.
- Do not export clean PDF backups during drafting.
- Shared slide assets must live in `slides/assets/` and include `slide-base.css`, `slide-base.js`, and the logo watermark.
- Vietnamese is for instructions and flow. Simplified Chinese is for target learning content. Pinyin is for pronunciation.
- Visible `.page-indicator` means printed textbook page, not slide number.
- Keep numbered slide files sequential and avoid gaps.
- Do not add a separate student version.

## Image and content workflow

- Treat images as lesson data, not cleanup.
- New lesson generation should start with placeholders, not AI images.
- For pinyin vocabulary images, use the Chrome + ChatGPT contact-sheet workflow and stop on blockers instead of silently switching tools.
- Reuse the Lesson 01 templates and structure unless the change is explicitly template work.

## Folder map

```text
docs/          specs and requirements
design/        design tokens and style references
examples/      sample lesson input
output/        lesson folders and exports
scripts/       pipeline and build helpers
work/          scratch work
```

## Editing stance

- Keep changes scoped to the request.
- Verify with concrete output, screenshots, or targeted checks.
- Put durable decisions in repo files only when they are stable and worth preserving.
