# Boya lesson-production skill ownership map

Status: active decomposition map
Owner: `.agent/skills/boya-lesson-production/SKILL.md`
Canonical lifecycle owner: `docs/workflow/canonical-workflow-contract.md`
Canonical course/material requirement owner: `PROJECT_REQUIREMENTS.md`
Requirement index: `docs/workflow/requirements-registry.md`

## What this skill owns

This skill owns task procedures and artifact-specific guidance for Boya lesson work:

- source/content interpretation and PBI task design;
- teacher-guide, prep-card, activity-material, storyboard, visual-storyboard, and PPTX production procedures;
- student-facing copy review and visual/layout conventions;
- artifact-specific QA checklists and evidence preparation;
- lesson-specific examples that do not redefine lifecycle or authority semantics.

## What this skill does not own

- lifecycle states, phase transitions, or gate semantics;
- the definition of technical versus human verification;
- lesson identity resolution or derived path construction;
- authority, promotion, release, rollback, or crash-state policy;
- agent run-packet state or external-check semantics;
- the canonical requirement list.

Those rules must be read from the canonical owners above. This skill may link to or operationalize them, but must not silently redefine them.

## Required routing

1. Resolve explicit `lesson_key` and `offering_id` through `scripts/lesson_context.py` and the lesson registry.
2. Read the canonical workflow contract before selecting a lifecycle operation.
3. Read `PROJECT_REQUIREMENTS.md` and the requirements registry for course/material acceptance criteria.
4. Use this skill for the artifact-specific procedure only.
5. Return structured blockers and evidence paths; never convert a technical pass into human approval or release readiness.

## Known migration boundary

The main `SKILL.md` remains a compatibility bundle while its sections are gradually split into focused references. Do not remove historical rules in a decomposition slice. New focused references must declare their owner and must link back here and to the canonical contract.
