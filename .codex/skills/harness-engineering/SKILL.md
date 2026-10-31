---
name: harness-engineering
description: Apply the current project workflow to non-trivial changes, with scoped execution and concrete verification.
---

# Harness Engineering

Use this as the first project-local skill for non-trivial work.

## Goal

Keep project work scoped, inspectable and verified.

## Loop

1. Define the artifact
   - Lesson database, HTML deck, presenter, slide asset, vocabulary image set, homework bank, Google Sheets export, PDF backup, teacher guide, script, or docs.
   - Name the success gate before editing: build passes, screenshots inspected, no overflow, database schema valid, source pages mapped, or presenter opens, as applicable.

2. Load local context
   - `AGENTS.md`
   - First classify whether this is a small existing-output edit or structural/generator work.
   - For small existing-output edits, load only the affected files and the one relevant workflow doc. Do not read the full project spec by default.
   - For structural/generator work, load the applicable workflow and task-specific guidance identified by `AGENTS.md`.

3. Execute inside the project
   - Prefer existing templates, scripts and configs appropriate to the current course and format.
   - Do not touch unrelated generated output or deleted legacy files.

4. Verify with concrete checks
   - Scale checks to the change. Small one-slide/title/wording/image edits should use targeted output edits and affected-slide checks, not full lesson regeneration.
   - Pipeline/data: run the relevant script and validate JSON/CSV shape.
   - Slides: verify the actual playback entry, page order, thumbnails, navigation, overflow, content and image matches.
   - Research/current facts: browse and cite sources.

5. Observe and report
   - Inspect terminal logs, browser errors, screenshots, generated files, and diffs.
   - Final response should say what changed, which checks ran, and what risk remains.

6. Feed durable lessons back
   - Only update durable docs/skills for reusable rules, generator/template changes, or repeated instructions Adam wants remembered. Do not turn a one-off slide/title/image edit into a repo-wide doc sync.
   - Avoid duplicating the same rule across tool configurations. Update memory only when Adam explicitly requests it.

## Done Means

The artifact works and verification was run or clearly reported as unavailable.
