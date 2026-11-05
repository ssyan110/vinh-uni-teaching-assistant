# Online pre-study PPTX production and delivery

Status: active routing and QA guidance, 2026-11-03. Applies to online pre-study only. In-person classes use [native OpenSlide](../open-slide-workspace.md); classroom activity-page limits and React tooling do not apply here.

## Authority and prerequisites

Read [the canonical workflow contract](canonical-workflow-contract.md), the applicable sections of [PROJECT_REQUIREMENTS.md](../../PROJECT_REQUIREMENTS.md), and the actual course/source and approved reference deck. Resolve `lesson_key`, `offering_id`, `class_scope` and `artifact_id` before selecting inputs. Reuse the confirmed online/classroom split and style; record actual exceptions without asking for routine reconfirmation. Online production may proceed independently of unfinished classroom activities.

Prepare the concrete review copy and source-check report first. Bind the reviewed version, source snapshot, report and actual user decision in a scoped `artifact-content` approval under the lesson’s `10-design/approvals/`, with `artifact_scope: online`. Source review, structure approval, an audit or a successful technical check cannot substitute for content approval. Reuse an existing valid approval for the same scope and bytes.

## Content and editable output

- For Year 1 online pre-study, include lesson-specific learning objectives in the content review and deck: cover → student learning route → learning objectives → lesson content. Use the actual Year 1 Lesson 25 reference for the page type, but write objectives from the current lesson's verified sources and intended learner outcomes. Include the full objective wording in the review copy for Adam's approval; do not copy another lesson's goals or infer approval from the sequence.
- Deliver editable native PPTX text, shapes and tables; embed images. A screenshot deck, HTML presenter or OpenSlide export without native-editability verification is not equivalent.
- Cover the actual canonical vocabulary and approved additions, one word per slide. Include the word, grouped pinyin, part of speech, Vietnamese meaning, a meaningful image and exactly two approved natural example sentences of at most 24 Hanzi, registered in `course/boya-example-bank.json`. Preserve source exercise coverage and textbook page mappings.
- New/revised online decks use at least **25 pt for main student content**, including meanings, examples, instructions and table cells. Auxiliary headers, slide/textbook page numbers and Audio markers retain the applicable course minimum: generally 20 pt, or 23 pt for the specified 2026-fall Year 1 elementary course. Historical 20–24 pt body styles are reference geometry only. Reflow or split pages rather than shrink text with autofit.
- Use the course’s approved online layout family and section dividers. Do not copy another lesson’s content, fix the new deck’s page count to the reference, or apply classroom-only palette/activity/closing-page rules to online material.
- Keep complete long texts in their approved source/materials; the slides provide the actual textbook page, reading/listening instruction and necessary recording task. Keep essential learner instructions visible; teacher notes do not supply missing student context.
- Related pages show plain, non-clickable upper-right `Audio n-n` with the original source track number. No embedded audio, playback icon/button, playable audio hyperlink or audio timing. Keep the external playback method and its evidence separately.

## Preflight and checkout availability

The current checkout implements `scripts/production_gate.py --purpose pptx --stage draft`. Supply the exact `--lesson-key`, `--offering-id`, `--approval-record`, `--artifact-scope online`, `--artifact-id`, `--class-scope` and `--output-dir`. The scoped output is:

```text
lessons/<textbook_id>/<lesson_id>/10-design/pptx-draft/online/<offering_id>/<artifact_id>/
```

Run the canonical `content-approval` check before visual production. Check the selected authoring tool’s actual availability and input contract; a successful gate does not generate a PPTX or establish tool readiness. Preserve teacher-edited PPTX as the current page-content source, compare it with scripts and outlines before editing, and patch localized corrections without rebuilding the whole package.

For Year 1, verify that the proposed review copy has a lesson-specific objectives page immediately after the learning route before submitting it for content approval, and verify that order again before generating the draft. The scoped online content gate checks `cover`, `learning_flow`, then `learning_objectives` with nonempty text for the current Book II Lesson 1 and new approvals from 2026-11-03 when the class scope identifies Year 1 as `一年级`, `一年級`, or `year 1`. Earlier approvals remain valid. Canonical `BOYA-LS-E1-Y1S1-2026F`-style Year 1 cohort identifiers are also recognized. Other identifiers require manual verification; a passing gate is not proof that objective wording is pedagogically correct.

The scoped authoring and release tools were recovered from `vinh-uni-main` on 2026-11-05: `scripts/build_scoped_online_pptx.py`, `scripts/render_reference_online_pptx.py`, `scripts/online_ppt_release.py`, and `scripts/verify_pptx_audio_policy.py`. Recovery provenance is in `.agent/runs/blocker-recovery-20261105/recovery.json` and `.agent/runs/final-closure-20261105/integration-dependencies.json`. Run the reproducible verification procedure in `docs/workflow/workflow-verification.md` before relying on them in another checkout.

Run `scripts/check_project_readiness.py --capability online` with the verification Python environment to check both inputs and runtime imports. Then run the version-scoped production gate. Tool availability does not approve content or authorize release. Historical branch documentation that prescribes classroom HTML remains superseded by native OpenSlide.

## QA and completion

1. Compare the actual PPTX text, page order, lesson-specific learning objectives, vocabulary, examples, tables, source page numbers and track mappings against independently reviewed content. For Year 1, check that cover, route and objectives occupy the first three pages in that order. Check native editability and embedded image integrity.
2. Render every page and inspect the visible text, glyphs, Vietnamese diacritics, images, overlap, clipping and effective typography. Inspect a contact sheet and full-size dense pages. XML text, a nonempty ZIP or a successful build does not establish visible completeness.
3. Open the PPTX in the actual target application and check editing. Record the application and evidence. Alternative renderer previews do not prove PowerPoint behavior; unavailable application checks remain unverified.
4. For each referenced audio track, record the source, decoding, semantic comparison, external playback method and actual playback evidence. Machine transcription or a progressing playback bar does not prove listening/semantic QA. Classroom speaker tests and rehearsal are separate and follow the requested scope.
5. Save version-bound manifests and QA evidence in the draft/run evidence area, including artifact/source/asset hashes, page count, per-page screenshots and unresolved issues. A draft with missing checks must say what remains unverified.

Content approval, technical QA, formal package approval and release authorization remain separate. Formal promotion/release require the applicable controlled tooling and the actual explicit decision for the candidate version; draft creation, a dashboard entry or file presence cannot grant either. Use the controlled scoped release tool for writes into `20-approved/` or `40-release/`; do not manually bypass its version, QA or authorization checks. Preserve prior releases and user-edited artifacts.
