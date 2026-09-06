# Vinh University Teaching Assistant — Workflow V2 Optimization Spec

Status: implementation baseline
Date: 2026-09-05
Scope: project workflow, requirements, agent skills, routing, and control scripts
Out of scope: producing or editing lesson PPTX, promoting authority, creating releases

## 1. Executive decision

The project has too many repeated rules, not too few. Workflow V2 establishes:

1. One canonical workflow contract for lifecycle, gates, artifact states, and safety.
2. One dynamic lesson context resolved from `lesson_key`.
3. One agent command surface for inspect → plan → execute → verify → human gate → promote.
4. Small composable skills instead of one large lesson-production skill containing every artifact rule.
5. Separate technical verification from human approval; neither may impersonate the other.
6. A clear distinction between source truth, design evidence, authority, release, and historical evidence.

This spec is the optimization contract. Existing long documents remain compatibility references until migrated and reduced; they must not introduce new rules that contradict this document.

## 2. Current problems found

### P0 — workflow correctness and safety

- `project.config.json` hardcodes Lesson 01 paths (`lesson_root`, `canonical_source`, `draft_root`, `authority_root`, `qa_root`, `release_root`) while the project now supports twelve lessons and `lesson_key`-scoped commands.
- The same lifecycle is repeated with slight wording differences in `AGENTS.md`, `PROJECT_REQUIREMENTS.md`, `memory/project-memory.md`, `.agent/agent-workflow-index.md`, `.agent/agent-operating-contract.md`, and `boya-lesson-production/SKILL.md`.
- Finalized Desktop PPTX, repo draft PPTX, `20-approved`, and `40-release` are discussed in several places without one normalized artifact-state model.

### P1 — agent efficiency and maintainability

- `lessonctl.py`, `production_gate.py`, and `agent_loop.py` overlap in identity, output-boundary, preflight, build, and QA responsibilities.
- The required reading path is too large for routine non-PPTX tasks such as source inventory, audio audit, workflow audit, or classroom-tool work.
- Course-domain rules, PPTX visual rules, human approval rules, and generic harness rules are mixed in the same skill.
- Multiple commands are lesson-aware in principle but still rely on active-context configuration internally.

### P2 — documentation hygiene

- Historical/legacy constraints are mixed with active requirements instead of being explicitly demoted.
- Requirements repeat exact typography, layout, and content rules in several documents.
- The workflow index gives an accurate route but does not provide a compact task-type router or a single command reference.

## 3. Canonical information ownership

| Concern | Canonical owner | Other files may do |
|---|---|---|
| Course identity and offerings | `course/course-manifest.json`, `course/offerings/*/offering.json` | Link and summarize |
| Textbook identity/source inventory | `textbooks/registry.json`, `textbooks/<id>/textbook.json`, `textbooks/<id>/source/` | Link and summarize |
| Lesson identity/status index | `course/lesson-registry.json` | Read; never duplicate status |
| Selected lesson context | `scripts/lesson_context.py` + registry + explicit CLI `lesson_key` | Resolve dynamically |
| Lifecycle/gates/state machine | This spec, then `docs/workflow/canonical-workflow-contract.md` | Link; no restatement |
| Artifact-specific requirements | `.agent/skills/<artifact>/SKILL.md` or `docs/contracts/<artifact>.md` | Link from router |
| Execution evidence | `.agent/runs/<run-id>/` | Never become authority |
| Authority | `lessons/<textbook>/<lesson>/20-approved/` + its manifest | Read-only unless explicit approval |
| QA evidence | `lessons/<textbook>/<lesson>/30-qa/current/` | Read-only after creation |
| Release | `lessons/<textbook>/<lesson>/40-release/` | Build only from authority |
| Historical evidence | `90-archive/` or root `archive/` | Never use as production input |

## 4. Artifact state model

Every lesson artifact has two independent axes:

### Lifecycle state

`source` → `design_draft` → `technical_verified` → `human_review` → `approved` → `released`

Alternative terminal state: `archived`.

### Verification state

- `not_run`
- `blocked`
- `technical_pass`
- `human_pass`
- `complete`

Rules:

- Technical pass never implies human pass.
- Human approval must identify `lesson_key`, artifact path, approver, timestamp, and evidence hash.
- A changed artifact invalidates approval and release evidence for that artifact.
- A finalized external artifact can be imported as source/evidence without being regenerated.
- A draft must never write to `20-approved/`, `30-qa/`, or `40-release/`.

## 5. Optimized lifecycle

### Phase A — Context

Resolve explicit `offering_id`, `textbook_id`, `lesson_id`, and `lesson_key`. If no lesson is needed, resolve only project/course scope. Never infer a lesson from the active context when a command can accept an explicit key.

### Phase B — Inspect

Read only the task-relevant contract, source manifest, and current artifact manifest. Record repository status and protected paths. For finalized external files, inspect the package directly and record hash, size, structure, and provenance.

### Phase C — Plan

Create a run packet with: artifact, purpose, input sources, output root, success criteria, human gates, retry budget, and stop conditions. Keep the plan short and machine-readable.

### Phase D — Execute

Run deterministic code for copying, extraction, compilation, validation, packaging, and hashing. Use LLM/subagents only for bounded reasoning tasks. All writes are confined to the declared run/design root unless the command is an explicitly confirmed promotion.

### Phase E — Verify

Run the smallest complete verification set for the artifact type. Record technical results and evidence hashes. If a human gate is required, stop with `needs_human` and a precise next action.

### Phase F — Approve/promote

Only an explicit human approval command may update authority. Promotion is atomic, manifest-driven, hash-verified, and followed by read-back verification. Release is a separate operation that copies only from authority.

## 6. Minimal command surface

The long-term command surface should be:

```text
lessonctl context --lesson-key <key>
lessonctl inspect --lesson-key <key> [--artifact <type>]
lessonctl plan --lesson-key <key> --artifact <name> --purpose <purpose>
lessonctl preflight --lesson-key <key> --purpose <purpose> --stage <stage>
lessonctl execute --run-id <id>
lessonctl verify --run-id <id>
lessonctl human-gate --run-id <id> --approved-by <name> --evidence <path> --confirm
lessonctl promote --run-id <id> --confirm
lessonctl release --lesson-key <key> --release-id <id> --confirm
lessonctl status --lesson-key <key>
```

Compatibility commands may remain temporarily, but new documentation must route agents through this surface. `build` and `qa` should become artifact adapters under `execute`/`verify`, not separate workflow concepts.

## 7. Skill architecture V2

### Core skills

- `harness-engineering`: run packet, evidence, retries, stop conditions, and safety.
- `workflow-routing`: task-type router and required context loading.
- `artifact-integrity`: hashes, ZIP/package checks, canonical paths, manifest checks.
- `human-gates`: approval evidence, promotion rules, and release boundaries.

### Domain skills

- `boya-course`: course identity, source hierarchy, PBI, online/face-to-face routing, language policy.
- `pptx-native`: PPTX-specific layout, media, notes, fonts, rendering, and page-marker checks.
- `teaching-materials`: teacher guides, prep cards, activities, assessments, and classroom-flow checks.
- `audio-materials`: audio provenance, decode, semantic mapping, playback, and fallback.

The current `boya-lesson-production/SKILL.md` should be split into these concerns. Until split, it is a compatibility bundle linked from `workflow-routing`, not an invitation to load every PPTX rule for every task.

## 8. Required routing by task type

| Task | Minimum context |
|---|---|
| Workflow/requirements/skills audit | `AGENTS.md` compact rules, this spec, `workflow-routing`, script README |
| Source inventory/audio | `boya-course`, source manifest, audio contract |
| Teacher guide/materials | `boya-course`, `teaching-materials`, lesson source/design contract |
| PPTX work | `boya-course`, `pptx-native`, lesson source/design contract |
| QA/audit | `artifact-integrity`, artifact skill, current artifact manifest |
| Authority/release | `human-gates`, `artifact-integrity`, lesson manifest, explicit approval evidence |
| Classroom tools | relevant tool README/BRD only; do not load PPTX production rules |

## 9. Requirements optimization rules

Requirements documents must contain principles and acceptance criteria, not repeated implementation recipes. Move detailed rules to artifact contracts. Every requirement must have:

- stable ID
- owner/canonical file
- scope (`course`, `textbook`, `lesson`, `artifact`)
- lifecycle stage
- verification method
- whether it is deterministic or human-gated

Demote to legacy documentation:

- old HTML deck/presenter workflows
- fixed lesson-hour assumptions
- historical lesson-specific generators
- archived outputs and old share folders
- visual defects observed in finalized references

Do not delete legacy evidence during migration; mark it read-only and exclude it from active routing.

## 10. Migration plan

### M1 — documentation consolidation

Create the canonical workflow contract from this spec. Replace repeated lifecycle sections in `AGENTS.md`, `PROJECT_REQUIREMENTS.md`, `.agent/agent-workflow-index.md`, and `.agent/skills/README.md` with short links and task routing. Keep artifact-specific rules in dedicated contracts.

### M2 — dynamic context

Refactor `project.config.json` to keep course-level configuration only. Make `lesson_context.py`/`lessonctl.py` the sole resolver for lesson-specific paths. Add tests proving L02, L10, and L12 resolve independently while the active context remains L01.

### M3 — command consolidation

Make `lessonctl` the public CLI. Move shared checks into reusable modules; keep compatibility wrappers with deprecation messages. Add `status`, `inspect`, `verify`, and explicit human-gate commands.

### M4 — skill decomposition

Split the compatibility Boya skill into core harness, course, artifact, and human-gate skills. Add a small router README with required load order and examples.

### M5 — CI/workflow validation

Add a fast workflow test that checks identity isolation, protected-output rejection, manifest hash integrity, no legacy input routing, and truthful blocked results. Run it before any material generation.

## 11. Success criteria

Workflow V2 is implemented when:

- An agent can determine the applicable rules by reading one router and one task skill.
- No lesson-specific path is selected from `project.config.json` alone.
- Every generated artifact has a run ID, declared output root, verification result, and evidence hash.
- Human approval and technical QA are separate machine-readable states.
- A failed gate produces a truthful blocker without creating protected outputs.
- Existing 27 workflow tests remain passing and new context-isolation tests cover at least three lessons.
- No active workflow reads archive/share/legacy output paths as production inputs.
- Documentation has one lifecycle definition and artifact-specific contracts are linked rather than duplicated.

## 12. Immediate next implementation slice

Implement M1 and M2 only:

1. Add `docs/workflow/canonical-workflow-contract.md` and route all indexes to it.
2. Add a context-resolution test matrix for L02/L10/L12.
3. Remove lesson-specific path duplication from `project.config.json` while preserving backward-compatible derived fields temporarily.
4. Do not touch PPTX content, authority files, or release packages.
5. Run the complete test suite and identity/protected-path checks.
