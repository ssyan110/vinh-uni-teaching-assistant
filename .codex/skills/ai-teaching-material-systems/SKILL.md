---
name: ai-teaching-material-systems
description: Prepare and verify teaching materials for this project using the current AGENTS.md and the applicable course workflow.
---

# Teaching materials

Read the project `AGENTS.md` and the task-specific workflow before making materials.

- Resolve the actual textbook, offering, class and lesson before selecting source content or templates.
- Identify the current source and version, including user edits, before reusing approved content and relevant classroom references. Check affected companion artifacts against that version; update within the authorized scope or identify the mismatch.
- Match the workflow to the requested change. Patch localized edits directly and run the smallest meaningful checks.
- For in-person activity research or design, read `docs/classroom-activity-workflow.md` before proposing activities. Evaluate the method's class-specific purpose, source/answer basis, procedure burden, student display structure and total lesson time together. Keep research evidence, activity plan, projection copy and teacher materials distinct; reuse suitable research honestly and actually use any research service explicitly requested by the user.
- Check student instructions and questions from the learner's perspective without chat context: include the task, necessary information, expected response and answer basis. Keep teacher scripts and answers out of student-facing material.
- For current/new slides, reject generic “take turns / ask / answer / revise if needed” prompts without this activity's object, materials and response content. Replace them with concrete directions or remove a redundant tail when the task already explains it; keep essential student information. Do not retrospectively edit other finished decks.
- Verify source fidelity, page mapping, activity inputs, outputs, timing and the generated artifact itself.
- Future new in-person decks omit “今天我能说清什么” and do not automatically append recap/self-check pages. Preserve applicable individual evidence within existing activities and teacher records. Follow the user's current page order (Year 1 v04: remove 14–15; data on 12, sentence support on 13), not a universal task-first rule; do not alter other finished decks.
- For the current two in-person revisions and future new decks, match the references' upper-right activity remarks: one activity keeps its identity/number while listening, checking and reporting pages may use distinct phase labels. Keep plain `Audio n-n` separate and collision-free; preserve other finished decks.
- For visual changes, inspect the affected pages. For full decks, inspect every page and the actual playback entry.
- For the current two revisions and future new in-person decks, present suitable text-heavy content as meaningful infographics using relevant icons, categories, columns or relationships, within the established reference design. Preserve necessary student instructions, materials, facts and conditions; avoid decorative cards or unexplained icon-only prompts. Check reading order and task completeness in the render. Follow `docs/classroom-activity-workflow.md`; leave other finished decks unchanged.
- For in-person slides, apply `AGENTS.md`'s reference and density checks before drafting and during final QA. Use primary elementary Lessons 11–12/13–14 and quasi-intermediate Lessons 4–5 route/activity structures for the current two revisions and future new decks; preserve other finished decks. Map the activity chain and page sequence to actual reference functions before content approval and generation. Build expected text and roles from independent reviewed copy, never from generated slides. Recreate same-type reference structures with directly editable text and draggable elements; do not wrap HTML or use an iframe. Verify edits and moves persist in OpenSlide after reload; report an unsupported editor or pipeline as blocked. Retain a source-to-revision mapping for authorized copy reductions and paired reference/current renders; content completeness and technical PASS do not establish projection readability. Read back updated guidance in the execution environment before reusing a generator.
- For every Vinh in-person deck, do not use generic/global HTML-first slide skills (including `deck-open-slide-canvas`) as the output workflow. Author native React pages in the configured shared OpenSlide workspace, run the `classroom-native` preflight and post-authoring verifier, then verify editing, dragging and save/reopen in the live editor. The `classroom-html` draft gate is disabled; use compatible visual guidance only.
- Report technical checks, teacher decisions and classroom testing according to the project's current approval rules.

The files in `references/` document earlier implementations. Use them only when their specific historical workflow is relevant; they do not set current format, language, image-provider or style defaults.
