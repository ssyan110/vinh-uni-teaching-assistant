---
name: vinh-teaching-materials
description: Prepare and verify teaching materials for this project using the current AGENTS.md and the applicable course workflow.
---

# Teaching materials

> 2026-11-04 字号优先级：未来新制 Vinh 实体课原生 OpenSlide 的学生正文按 `docs/classroom-html-standard-2026-10-07.md` 的新课规则执行：1920×1080 画布默认 56 px，最低 54 px，通常 54–60 px；其他画布按比例换算。复用旧参考的布局与层级时，不复用其较小正文字号。现有课件不回改，线上 PPTX 与其他媒介不适用此 px 规则。

Online pre-study uses editable PPTX under `docs/workflow/online-pptx-lifecycle.md`. Preserve full vocabulary coverage, one word per slide, applicable 25 pt main-content minimum, plain Audio references, embedded images and native editability. Classroom activity limits, native React checks and classroom-only layout rules do not transfer to online PPTX. Content approval and QA remain separately scoped to each artifact.

Read the project `AGENTS.md` and the task-specific workflow before making materials.

- For Blooket question-bank CSVs, apply `docs/workflow/blooket-question-bank-standard.md` unless the user specifies a different format or scope.
- For teacher read-aloud scripts, apply `docs/workflow/teacher-read-aloud-pdf-standard.md`; retain the complete teacher script and keep answer notes teacher-only.
- When registering or updating lesson audio or assessment playback in the audio dashboard, follow `docs/workflow/audio-dashboard-standard.md` for shared naming, layout, controls and scoped verification.

- Resolve the actual textbook, offering, class and lesson before selecting source content or templates.
- Identify the current source and version, including user edits, before reusing approved content and relevant classroom references. Check affected companion artifacts against that version; update within the authorized scope or identify the mismatch.
- Match the workflow to the requested change. Patch localized edits directly and run the smallest meaningful checks.
- For in-person activity research or design, read `docs/classroom-activity-workflow.md` before proposing activities. Evaluate the method's class-specific purpose, source/answer basis, procedure burden, student display structure and total lesson time together. Keep research evidence, activity plan, projection copy and teacher materials distinct; use earlier research as supplementary context only; it never replaces the current ChatGPT research session. For every newly designed or substantively redesigned in-person activity, first use ChatGPT and save the actual prompt, full response/session link and sources before drafting; distinguish ChatGPT output from later adaptations. If the user excludes a legacy deck from redesign, do not inspect or use its teaching content; identify authoritative current sources instead.
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


## 实体课 ChatGPT 研究前置门禁（2026-11-04）

所有新设计或实质重设计的实体课活动，必须先实际使用 ChatGPT 研究，再编写活动方案和学生文案；不得以自行构思、旧记忆或旧研究替代本次研究。保存实际提示词、完整回复、会话链接、来源核对及后续改写对照。提交内容审阅前运行 classroom-research 门禁；内容批准与 classroom-native 制作门禁同时要求 --research-record，缺失、空白、范围不符、哈希变化或研究时间晚于改写均阻断。记录和哈希只能证明材料完整性，不能替代真实会话证据；禁止伪造。此要求不追溯改写已完成课件，不增加人工批准阶段。

<!-- project-rule-repairs-20261105 -->
Research scope clarification: unchanged pre-2026-11-04 scoped content approvals retain their historical status only after all bound source/review/check/decision hashes pass. New or changed activity content requires the current research gate. Shared combined-lesson packets and independent lesson approval bindings follow `docs/workflow/classroom-chatgpt-research-gate.md`. Run `python3 scripts/check_governance.py` after changes to routing or workflow owners.
