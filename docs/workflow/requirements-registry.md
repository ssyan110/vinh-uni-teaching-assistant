# Requirements Registry

Status: active additive registry
Version: 1.2.0
Date: 2026-09-08
Canonical content owner: `PROJECT_REQUIREMENTS.md`
Canonical workflow owner: `docs/workflow/canonical-workflow-contract.md`

This registry indexes the durable course/material requirements without replacing the source document. Lifecycle, gate, artifact state, identity, and agent safety are owned by the canonical workflow contract. Course, classroom, content, visual, and delivery requirements remain owned by `PROJECT_REQUIREMENTS.md`.

Each entry has:

- `requirement_id`: stable identifier; do not reuse after retirement.
- `owner`: canonical document responsible for the rule.
- `scope`: course-wide, textbook, lesson, artifact, or release.
- `verification`: deterministic check, read-only audit, or named human gate.
- `status`: active, legacy-reference, or migration-target.

## Course and lesson identity

| requirement_id | requirement | owner | scope | verification | status |
|---|---|---|---|---|---|
| COURSE-001 | The course prioritizes listening and speaking; classroom work centers on observable student listening, interaction, presentation, feedback, and redo. | `PROJECT_REQUIREMENTS.md` §1.1, §2.2 | course | content/design review against lesson contract; human instructional review | active |
| ID-001 | Every cross-file, generator, QA, dashboard, and delivery reference uses `<textbook_id>:<lesson_id>` as `lesson_key`; bare lesson numbers are not globally unique. | `PROJECT_REQUIREMENTS.md` §1.1A; workflow contract §Identity | project | `scripts/validate_lesson_identity.py`; context-isolation tests | active |
| ID-002 | A lesson operation resolves textbook, lesson, offering, and derived paths through the registry/context; it must not infer identity from another textbook's active lesson or old chat state. | `docs/workflow/canonical-workflow-contract.md` §Identity; `PROJECT_REQUIREMENTS.md` §1.1A | operation | `LessonContext` resolution; L02/L10/L12 isolation tests | active |
| OFFERING-001 | Use the standing online/classroom division; record version-specific exceptions in that version’s review. The standing division is not concrete content approval. | `PROJECT_REQUIREMENTS.md` §2.1A | offering/artifact | scoped review and approval evidence; no repeated per-lesson boundary confirmation | active |

## Teaching and content design

| requirement_id | requirement | owner | scope | verification | status |
|---|---|---|---|---|---|
| PBI-001 | Each lesson includes interpretive listening, interpersonal speaking, and presentational speaking with observable evidence. | `PROJECT_REQUIREMENTS.md` §2.3 | lesson | teacher-guide/content contract coverage review; human instructional review | active |
| FLIP-001 | Online preparation covers assigned reading/listening, vocabulary understanding, short-note preparation, and personal questions; it does not replace or reduce approved face-to-face hours. | `PROJECT_REQUIREMENTS.md` §2.1, §2.1A | lesson | standing division and version-specific content review; human schedule review | active |
| CONTENT-001 | New-course vocabulary pages cover canonical vocabulary and approved supplements, one vocabulary item per page, with required pinyin, part of speech, Vietnamese meaning, image, and approved examples. | `PROJECT_REQUIREMENTS.md` §2.4, §3.2 | lesson artifact | content contract and example-bank checks; generator fail-fast tests | active |
| CONTENT-002 | Each new-draft vocabulary item has exactly two independent, natural, readable example sentences of no more than 24 Hanzi, sourced from `course/boya-example-bank.json`; no generic fallback or extraction from long source text. | `PROJECT_REQUIREMENTS.md` §2.4, §3.4A-1 | draft | example-bank validator/generator preflight; targeted unit tests | active |
| SOURCE-001 | Source package, audio inventory, technical decoding, semantic review, and PowerPoint playback status are recorded per lesson; whole-textbook totals are not evidence for a single lesson. | `PROJECT_REQUIREMENTS.md` §1.3, §5 | lesson source | source manifest and audio manifest audit; playback is a human/technical gate | active |
| CONTENT-005 | Explicit human approval of the current lesson content precedes any new images, prototypes or PPTX, including drafts. Structure, boundary or start/continue instructions never imply approval. | `PROJECT_REQUIREMENTS.md` §6 Phase 3; workflow contract §Human approval record | new production | shared `check_content_approval`; hash-bound copy/source and independent human evidence; `tests/test_content_approval.py` | active |
| LANG-001 | Student-facing Chinese is checked against a versioned HSK reference and the specific class's verified taught/untaught status; a level tag alone never proves mastery. | `PROJECT_REQUIREMENTS.md` §2026-09-21：跨教材学生语言范围与学情核对; `course/language-reference/hsk/README.md` | project/course/lesson | per-slide vocabulary and grammar audit plus canonical textbook/course-progress review and human naturalness check | active |
| FLOW-001 | Beginner I online or explicitly selected historical PPT flowcharts reuse the approved four-step layout and proofread Vietnamese labels. Future classroom OpenSlide uses the actual activity route on page 2, without a fixed four-step requirement. | `PROJECT_REQUIREMENTS.md` §9 | textbook/lesson | visual review plus Vietnamese spelling/tone-mark check and embedded-media verification | active |

## PPTX and visual delivery

2026-10-27: Across future semesters, Year 1 and Year 2 physical classes use OpenSlide and the shared homepage; online preparation uses PPT/PPTX. No new classroom PPTX backup. Existing finalized PPTX remains historical evidence.

| requirement_id | requirement | owner | scope | verification | status |
|---|---|---|---|---|---|
| PPTX-001 | Year 1 and Year 2 face-to-face decks in future semesters use OpenSlide under the classroom standard and shared homepage; online preparation uses PPT/PPTX. Format choice does not grant authority or release approval. | `PROJECT_REQUIREMENTS.md` §3.1; `docs/classroom-html-standard-2026-10-07.md` | lesson deck | Offline HTML, once-on-entry motion, one coherent activity per page, at most two when necessary, reduced-motion visibility | active |
| PPTX-002 | New or revised online PPTX main student content is at least 25 pt; page headers, slide numbers, textbook markers and plain Audio labels retain the applicable 20/23 pt auxiliary minimum. HTML uses canvas-relative readability under the classroom standard. | `PROJECT_REQUIREMENTS.md` §2.4, §3.4; `docs/workflow/online-pptx-lifecycle.md`; `docs/classroom-html-standard-2026-10-07.md` | slide draft | Check source sizes and rendered effective sizes; notes, historical finalized files and teacher-only documents excluded | active |
| PPTX-003 | Student-facing pages that use textbook content include printed textbook page markers derived from canonical source and slide-level source mapping. | `PROJECT_REQUIREMENTS.md` §3.2A | PPTX draft | `add_textbook_page_markers.py`; `verify_textbook_page_markers.py`; PDF visual review | active |
| CLASSROOM-NAV-001 | Every face-to-face activity has a numbered, named entry integrated with its task page; belonging pages display the same activity number and name, matching the route. Use actual activity count; do not add title-only dividers. | `AGENTS.md`; `PROJECT_REQUIREMENTS.md` §3.1; `docs/classroom-html-standard-2026-10-07.md` | future classroom OpenSlide | Open from shared homepage; inspect all activity entries and labels, forward/back navigation, first/last pages, page/animation plan consistency; no blank, skipped or misordered pages | active |
| VISUAL-001 | New decks reuse the approved visual master and shared layout family; major visual-system changes require explicit user approval. | `PROJECT_REQUIREMENTS.md` §3.4A, §3.4A-1 | textbook/lesson artifact | visual storyboard and prototype review; human approval for major change | active |
| FONT-001 | Chinese text uses KaiTi and Vietnamese/Latin text uses Times New Roman across text-bearing outputs, subject to the stated artifact-specific exceptions. | `PROJECT_REQUIREMENTS.md` §3.2B | project artifact | Office XML/PPTX/DOCX font audit and PDF preview | active |
| MEDIA-001 | Future PPTs use plain non-clickable top-right `Audio n-n` text with the actual source track mapping and no purple audio styling, embedded audio, playback buttons or playable audio hyperlinks. Source audio outside the PPT remains technically valid and practically playable through the declared external method; source, decoding, semantic and playback states remain distinct. Historical evidence is preserved. | `PROJECT_REQUIREMENTS.md` §3.2C, §5 | lesson artifact | read-only package/action/link/track-mapping checks and visual review; source codec and actual external playback checks | active |

## Authority, QA, and release

| requirement_id | requirement | owner | scope | verification | status |
|---|---|---|---|---|---|
| AUTH-001 | `20-approved/` is the authority source; approved files, manifest identity, hashes, and human approval evidence must remain lesson-scoped and immutable until an explicit new approval. | `PROJECT_REQUIREMENTS.md` §3.1A; workflow contract §Output safety | lesson authority | authority manifest audit; hash and identity verification; human approval record | active |
| QA-001 | `30-qa/current/` contains QA evidence only; technical verification, visual review, playback, rehearsal, approval, and release readiness remain separate states. | `docs/workflow/canonical-workflow-contract.md` §Artifact states; `PROJECT_REQUIREMENTS.md` §3.8 | lesson QA | format-specific gate/verifier output and evidence for checks actually required or performed | active |
| RELEASE-001 | `40-release/` copies only from approved authority; a release is immutable, lesson-scoped, manifest-driven, hash-verified, and does not regenerate teaching materials. | `PROJECT_REQUIREMENTS.md` §3.1A, §3.8; workflow contract §Output safety | release | scoped read-only plan; guarded writer transaction/read-back; authority verifier | active |
| RELEASE-002 | Release execution requires a fresh ready plan, explicit release authorization, exact repeated release ID, transaction staging, read-back, rollback evidence, and no automatic cleanup of ambiguous crash state. | `docs/workflow/canonical-workflow-contract.md` §Lifecycle/Output safety; `docs/workflow/M2_SCOPED_RELEASE_WRITER_REVIEW.md` | release operation | synthetic writer tests; explicit human authorization before real execute | active |
| DELIVERY-001 | Delivery requires the actual version’s applicable technical QA, human approval and release authorization. Online audio playback evidence is required for used tracks; classroom rehearsal/audio checks not requested are recorded as such. | `PROJECT_REQUIREMENTS.md` §3.8, §7; format lifecycle | artifact release | format-specific plan, evidence and verifier; no inferred pass | active |

## Operations and dashboard

| requirement_id | requirement | owner | scope | verification | status |
|---|---|---|---|---|---|
| OPS-001 | Generators write only to declared draft/staging roots and fail closed on protected paths, archive/legacy inputs, traversal, symlinks, wrong corpus, or cross-lesson identity. | `docs/workflow/canonical-workflow-contract.md` §Output safety; `PROJECT_REQUIREMENTS.md` §3.8 | operation | production gate, lessonctl safety tests, path-isolation tests | active |
| DASH-001 | Dashboard and progress views are registry-derived and distinguish draft availability, production, review, approval, QA, rehearsal, authority, and release states. | `PROJECT_REQUIREMENTS.md` §3.7 | dashboard | registry-derived output audit; state-contract review | active |
| RUN-001 | Agent run packets record execution evidence, blocker records, attempts, and hashes only; they cannot approve content, replace authority, or publish releases. | `docs/workflow/canonical-workflow-contract.md` §Run packet; `scripts/agent_loop.py` | agent operation | `scripts/validate_workflow_state.py`; run-packet tests | active |

## Additional course, content, and artifact requirements

| COURSE-002 | Each lesson's physical contact hours are determined from the textbook's actual lesson content and the formal timetable; online preparation is additional and never substitutes for approved contact hours. | `PROJECT_REQUIREMENTS.md` §1.1, §2.1A, §2.2 | course/lesson | timetable and lesson content review; human schedule confirmation | active |
| CONTENT-003 | Structured source is the content authority: OCR drafts, stale JSON, guessed answers, omitted exercises, unsupported vocabulary ordering, and untraceable audio tracks cannot replace reviewed source evidence. | `PROJECT_REQUIREMENTS.md` §5.1, §5.2 | lesson source | source audit and exercise/audio traceability review | active |
| CONTENT-004 | Every canonical-source exercise and activity has coverage in the teacher guide, storyboard, student material, or an explicit justified record; activity design must create observable listening/speaking output rather than extra translation worksheets. | `PROJECT_REQUIREMENTS.md` §2.3, §3.3, §4.1, §4.3, §7 | lesson artifact | coverage matrix and teacher-guide review; human instructional review | active |
| NAMING-001 | Human-facing lesson deliverables use the canonical `lesson-<nn>-<用途>.<ext>` naming convention with two-digit lesson number, lowercase extension, and no forbidden legacy naming variants. | `PROJECT_REQUIREMENTS.md` §3.1B | delivery artifact | filename validator and package inspection | active |
| VISUAL-002 | Visual assets support comprehension, remain within the 16:9 canvas, have recorded source/creation and license status, and cannot be replaced by unrelated, generic, or unapproved assets when a required asset is pending. | `PROJECT_REQUIREMENTS.md` §3.4, §3.4A | lesson artifact | asset inventory, boundary inspection, and visual review; human approval for pending assets | active |
| MATERIAL-001 | The teacher guide is the instructional source of truth and must be complete and approved before a full authority deck; it records objectives, timing, source coverage, activities, evidence, repair, feedback, and assessment. | `PROJECT_REQUIREMENTS.md` §4.1, §6 Phase 3 | lesson artifact | teacher-guide completeness and approval gate | active |
| MATERIAL-002 | Student preparation cards and activity materials provide actionable instructions, roles, timing, output, and feedback; independently distributable cards remain separate editable DOCX files and activity-card PDFs are not delivered. | `PROJECT_REQUIREMENTS.md` §4.2, §4.3 | lesson artifact | material/package structure audit; teacher usability review | active |
| PPTX-004 | Student-facing output uses simplified Chinese under the stated Vietnamese-meaning, approved online/historical flowchart and explicit per-page exceptions, keeps teacher-only metadata in notes/teacher materials, and does not expose internal workflow or QA language. | `PROJECT_REQUIREMENTS.md` §3.2, §3.5, §3.4 | PPTX/material artifact | text/language audit and visual review | active |
| QA-002 | QA verifies the actual artifact and preserves separate content, technical, classroom-flow, playback, rehearsal, approval, and release evidence; a technical pass cannot imply human acceptance. | `PROJECT_REQUIREMENTS.md` §6 Phase 4, §7; workflow contract §Gate semantics | lesson QA | QA evidence audit and named human gates | active |
| FILES-001 | Version and file-layout recommendations remain scoped to the lesson and artifact lifecycle: current draft, approved authority, QA evidence, release package, and archive paths are distinct; approved/release filenames are not changed implicitly. | `PROJECT_REQUIREMENTS.md` §8 | project artifact | path/layout audit; manifest and package inspection | active |

## Migration notes

1. This registry is additive. Existing numbered sections in `PROJECT_REQUIREMENTS.md` remain the source text until a later approved consolidation.
2. Requirements that describe lifecycle, gates, state names, identity, protected paths, or agent safety defer to the canonical workflow contract; this registry does not create a second lifecycle.
3. A requirement is not considered verified merely because a technical command passes when its verification column names a human review, playback, rehearsal, or approval.
4. `legacy-reference` should be used for historical requirements that remain useful for traceability but are not current production criteria. No legacy item is promoted by this registry.
5. `migration-target` should be used only when a future command or schema is documented but not implemented; current files and `--help` output remain authoritative.

## 2026-10-14 实体课执行检查

| requirement_id | requirement | owner | scope | verification | status |
|---|---|---|---|---|---|
| CLASSROOM-014 | 每活动默认一页、最多两页；入口与任务同页，必要资料才分开；按批准任务提供必要分层，不强塞两档框，单人六格故事与统一任务保留自身结构；成果可见 | `AGENTS.md`; `PROJECT_REQUIREMENTS.md`; `docs/classroom-activity-workflow.md` | future face-to-face | 内容两种视角阅读；每活动页数；全页渲染 | active |
| CLASSROOM-015 | 听力有实际问题、全文／核对文件、答案对应；必需操作不藏备注 | `docs/classroom-activity-workflow.md` | face-to-face | 输入—动作—成果逐项核对；教师材料；可见文字 | active |
| CLASSROOM-016 | 已确认风格／结构直接复用，先自行修正再提交具体内容，不加例行批准轮次 | `PROJECT_REQUIREMENTS.md` §2026-10-14：每周实体课制作入口; `docs/classroom-activity-workflow.md` | weekly workflow | 审阅稿与QA证据；内容批准仍绑定具体版本 | active |
| CLASSROOM-017 | Newly registered classroom HTML decks carry a separate hash-pinned visual reference, approved route-card count, and explicit stable IDs for discussion/comic/report pages; homepage sync/build blocks missing profiles, missing page-type markers, or failing checks. | `PROJECT_REQUIREMENTS.md` §3.1; `docs/open-slide-workspace.md`; `scripts/sync_open_slide_workspace.py` | future classroom HTML/OpenSlide | `python3 scripts/sync_open_slide_workspace.py --check-only`; negative controls in `tests/test_open_slide_visual_consistency.py` and `tests/test_open_slide_workspace.py`; rendered page review | active |
| CLASSROOM-018 | When an explicitly split open-speaking activity uses two pages, the first is question-only and the next shows HSK 1–3 and HSK 4–6 support together; never repeat the question on the support page or split one level per page. | `PROJECT_REQUIREMENTS.md` §3.1; `docs/classroom-activity-workflow.md`; `docs/classroom-html-standard-2026-10-07.md` | explicitly split open-speaking activity | question/support stable IDs, paired order, exact visible copy, both levels on support page, no repeated question, rendered review | active |
| CLASSROOM-019 | Body elements keep at least 64px clearance above the footer on the 1920×1080 canvas; semantic line breaks preserve words, units and blanks; aligned cards and all-page rendered evidence are required. | `docs/classroom-html-standard-2026-10-07.md` 2026-10-20 consolidated rules; `PROJECT_REQUIREMENTS.md` | classroom HTML | SHA-bound rendered report, footer gap, line quality, negative checks, full-size visual review; sync rejects missing/stale/failed reports | active |
| CLASSROOM-020 | Each current classroom deck uses a reviewed-input-bound per-page copy/role contract; sync validates lesson/source identity and rerenders schema-v2 evidence, rather than W06 literals or anonymous PASS fields. | `docs/classroom-html-standard-2026-10-07.md` 2026-10-21 execution correction; `docs/workflow/classroom-html-lifecycle.md` | registered classroom HTML | generic non-W06 fixture, exact-copy/role mutation tests, source/contract/asset/screenshot hashes and read-only fresh browser verification | active |
| COURSE-003 | 一年级局部课程路由只在年级、学期、日期与教材同时匹配时使用；不套用其他班级 | `PROJECT_REQUIREMENTS.md` §2026-09-21：仅本届大一第一学期的课程路由 | specified Year 1 cohort | offering/class_scope and cohort course-rules readback | active |
| SCHEDULE-001 | 作息按生效日期和明确班级读取；每次四节净教学200分钟，历史日期保留旧作息 | `PROJECT_REQUIREMENTS.md` §2026/10/12起上课作息 | specified classes from 2026-10-12 | timetable date/class comparison; military-training exception check | active |

## Year-1 weekly assessment synchronization

| requirement_id | Requirement | owner | scope | verification | status |
| --- | --- | --- | --- | --- | --- |
| ASSESSMENT-SYNC-001 | One current input synchronizes local bank, teacher answers, Google Sheets, Google Form and audio dashboard; one audio group per Section. | `AGENTS.md` §一年级周测整理与全量同步; `docs/workflow/weekly-assessment-sync.md` | year-1 assessment | Per-question remote readback, section/audio mapping and actual playback evidence | active |
| ASSESSMENT-CURRENT-001 | Delete superseded active question/paper rows and unreferenced audio metadata after replacement readback; preserve other valid exam references, responses, grades and approval history. | `AGENTS.md` §一年级周测整理与全量同步; `docs/workflow/weekly-assessment-sync.md` | year-1 assessment | Current-version row counts, retired-ID absence, formula checks and preserved-data comparison | active |
