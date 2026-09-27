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
| OFFERING-001 | Online and face-to-face content boundaries are recorded separately for each `lesson_key`; the boundary record does not equal source approval, PPT approval, rehearsal, authority, or release. | `PROJECT_REQUIREMENTS.md` §2.1A | lesson | boundary confirmation file exists and is scoped to the selected lesson; human confirmation | active |

## Teaching and content design

| requirement_id | requirement | owner | scope | verification | status |
|---|---|---|---|---|---|
| PBI-001 | Each lesson includes interpretive listening, interpersonal speaking, and presentational speaking with observable evidence. | `PROJECT_REQUIREMENTS.md` §2.3 | lesson | teacher-guide/content contract coverage review; human instructional review | active |
| FLIP-001 | Online preparation covers assigned reading/listening, vocabulary understanding, short-note preparation, and personal questions; it does not replace or reduce approved face-to-face hours. | `PROJECT_REQUIREMENTS.md` §2.1, §2.1A | lesson | lesson boundary/content contract review; human schedule review | active |
| CONTENT-001 | New-course vocabulary pages cover canonical vocabulary and approved supplements, one vocabulary item per page, with required pinyin, part of speech, Vietnamese meaning, image, and approved examples. | `PROJECT_REQUIREMENTS.md` §2.4, §3.2 | lesson artifact | content contract and example-bank checks; generator fail-fast tests | active |
| CONTENT-002 | Each new-draft vocabulary item has exactly two independent, natural, readable example sentences of no more than 24 Hanzi, sourced from `course/boya-example-bank.json`; no generic fallback or extraction from long source text. | `PROJECT_REQUIREMENTS.md` §2.4, §3.4A-1 | draft | example-bank validator/generator preflight; targeted unit tests | active |
| SOURCE-001 | Source package, audio inventory, technical decoding, semantic review, and PowerPoint playback status are recorded per lesson; whole-textbook totals are not evidence for a single lesson. | `PROJECT_REQUIREMENTS.md` §1.3, §5 | lesson source | source manifest and audio manifest audit; playback is a human/technical gate | active |
| CONTENT-005 | Explicit human approval of the current lesson content precedes any new images, prototypes or PPTX, including drafts. Structure, boundary or start/continue instructions never imply approval. | `PROJECT_REQUIREMENTS.md` §6 Phase 3; workflow contract §Human approval record | new production | shared `check_content_approval`; hash-bound copy/source and independent human evidence; `tests/test_content_approval.py` | active |
| LANG-001 | Student-facing Chinese is checked against a versioned HSK reference and the specific class's verified taught/untaught status; a level tag alone never proves mastery. | `PROJECT_REQUIREMENTS.md` §2026-09-21; `course/language-reference/hsk/README.md` | project/course/lesson | per-slide vocabulary and grammar audit plus canonical textbook/course-progress review and human naturalness check | active |
| FLOW-001 | Beginner I lesson flowcharts reuse the approved four-step layout; Vietnamese labels and illustrations are lesson-specific and proofread before use. | `PROJECT_REQUIREMENTS.md` §9 | textbook/lesson | visual review plus Vietnamese spelling/tone-mark check and embedded-media verification | active |

## PPTX and visual delivery

| requirement_id | requirement | owner | scope | verification | status |
|---|---|---|---|---|---|
| PPTX-001 | New decks use the user-selected `native-pptx` (default) or `open-slide` path; Open Slide remains draft-only until its lesson QA/release path is defined. | `PROJECT_REQUIREMENTS.md` §3.1, §3.2 | lesson deck | Verify selected path and artifact format; PPTX exports receive PPTX QA | active |
| PPTX-002 | Student-visible text is at least 20 pt for new drafts; notes and teacher-only documents are outside this display-size rule. | `PROJECT_REQUIREMENTS.md` §2.4, §3.4 | PPTX draft | PPTX XML/style audit plus PDF/PowerPoint visual review | active |
| PPTX-003 | Student-facing pages that use textbook content include printed textbook page markers derived from canonical source and slide-level source mapping. | `PROJECT_REQUIREMENTS.md` §3.2A | PPTX draft | `add_textbook_page_markers.py`; `verify_textbook_page_markers.py`; PDF visual review | active |
| VISUAL-001 | New decks reuse the approved visual master and shared layout family; major visual-system changes require explicit user approval. | `PROJECT_REQUIREMENTS.md` §3.4A, §3.4A-1 | textbook/lesson artifact | visual storyboard and prototype review; human approval for major change | active |
| FONT-001 | Chinese text uses KaiTi and Vietnamese/Latin text uses Times New Roman across text-bearing outputs, subject to the stated artifact-specific exceptions. | `PROJECT_REQUIREMENTS.md` §3.2B | project artifact | Office XML/PPTX/DOCX font audit and PDF preview | active |
| MEDIA-001 | Audio and embedded media must be technically valid and practically playable through the declared delivery method; source, decoding, semantic, and playback states remain distinct. | `PROJECT_REQUIREMENTS.md` §3.2, §5 | lesson artifact | package/codec checks plus actual PowerPoint playback | active |

## Authority, QA, and release

| requirement_id | requirement | owner | scope | verification | status |
|---|---|---|---|---|---|
| AUTH-001 | `20-approved/` is the authority source; approved files, manifest identity, hashes, and human approval evidence must remain lesson-scoped and immutable until an explicit new approval. | `PROJECT_REQUIREMENTS.md` §3.1A; workflow contract §Output safety | lesson authority | authority manifest audit; hash and identity verification; human approval record | active |
| QA-001 | `30-qa/current/` contains QA evidence only; technical verification, visual review, playback, rehearsal, approval, and release readiness remain separate states. | `docs/workflow/canonical-workflow-contract.md` §Artifact states; `PROJECT_REQUIREMENTS.md` §3.8 | lesson QA | gate/verifier output plus human playback/rehearsal evidence | active |
| RELEASE-001 | `40-release/` copies only from approved authority; a release is immutable, lesson-scoped, manifest-driven, hash-verified, and does not regenerate teaching materials. | `PROJECT_REQUIREMENTS.md` §3.1A, §3.8; workflow contract §Output safety | release | scoped read-only plan; guarded writer transaction/read-back; authority verifier | active |
| RELEASE-002 | Release execution requires a fresh ready plan, explicit release authorization, exact repeated release ID, transaction staging, read-back, rollback evidence, and no automatic cleanup of ambiguous crash state. | `docs/workflow/canonical-workflow-contract.md` §Lifecycle/Output safety; `docs/workflow/M2_SCOPED_RELEASE_WRITER_REVIEW.md` | release operation | synthetic writer tests; explicit human authorization before real execute | active |
| DELIVERY-001 | Human-facing delivery is not complete until required technical QA, playback, approved contact-hour rehearsal, and applicable human acceptance are recorded. | `PROJECT_REQUIREMENTS.md` §3.8, §7; workflow contract §Gate semantics | release/delivery | verifier separates delivery blockers; named human evidence | active |

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
| PPTX-004 | Student-facing output uses simplified Chinese under the stated Vietnamese-meaning exception, keeps teacher-only metadata in notes/teacher materials, and does not expose internal workflow or QA language. | `PROJECT_REQUIREMENTS.md` §3.2, §3.5, §3.4 | PPTX/material artifact | text/language audit and visual review | active |
| QA-002 | QA verifies the actual artifact and preserves separate content, technical, classroom-flow, playback, rehearsal, approval, and release evidence; a technical pass cannot imply human acceptance. | `PROJECT_REQUIREMENTS.md` §6 Phase 4, §7; workflow contract §Gate semantics | lesson QA | QA evidence audit and named human gates | active |
| FILES-001 | Version and file-layout recommendations remain scoped to the lesson and artifact lifecycle: current draft, approved authority, QA evidence, release package, and archive paths are distinct; approved/release filenames are not changed implicitly. | `PROJECT_REQUIREMENTS.md` §8 | project artifact | path/layout audit; manifest and package inspection | active |

## Migration notes

1. This registry is additive. Existing numbered sections in `PROJECT_REQUIREMENTS.md` remain the source text until a later approved consolidation.
2. Requirements that describe lifecycle, gates, state names, identity, protected paths, or agent safety defer to the canonical workflow contract; this registry does not create a second lifecycle.
3. A requirement is not considered verified merely because a technical command passes when its verification column names a human review, playback, rehearsal, or approval.
4. `legacy-reference` should be used for historical requirements that remain useful for traceability but are not current production criteria. No legacy item is promoted by this registry.
5. `migration-target` should be used only when a future command or schema is documented but not implemented; current files and `--help` output remain authoritative.
