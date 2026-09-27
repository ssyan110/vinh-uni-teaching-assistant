---
name: skill-evolution
description: Learn reusable procedures from verified task corrections, recovered failures, or repeated successes, then compare and promote a tested revision in the dedicated learned skill collection. Use when the completion hook requests a review or the user asks to learn from completed work; not for model training or personal memory.
---

# Skill evolution

Adam authorized this loop on 2026-09-13: automatically draft, test, and promote English procedural skills in `/Users/ssyan110/.codex/skills/self-learned`. Existing skills remain unchanged; improvements to them are proposals. The authorization does not override host permissions or project rules. Do not update global memory. The controller, hooks, evaluation rules, and this skill are not self-editable under that authorization.

Controller: `/Users/ssyan110/.codex/skill-evolution/evolve.py` (run with `python3`). State and candidate files: `/Users/ssyan110/.codex/skill-evolution/runs/`. Each learned skill owns one reusable job and uses a `learned-` name prefix.

## One bounded completion review

Use the evidence already visible in the completed task. Separate an observed successful recovery from an untested explanation, outage, denial, or missing credential. Do not rerun the original task or perform external actions to manufacture evidence. A correction applies to its stated scope. Preserve the user's work and completion result.

If nothing distinct and reusable was verified, run:

```sh
python3 /Users/ssyan110/.codex/skill-evolution/evolve.py no-change "No new verified procedural lesson"
```

Then finish with the original task result preserved. Do not return an empty answer, create filler skills, repeat the review, or add a separate status essay for no-change. Keep explanations of completed changes short, in the user's conversation language.

For a real lesson, search only likely existing skills. Prefer a narrow revision of the job's existing learned skill. An improvement to a user-managed skill stays a draft in the run; do not auto-install an overlapping substitute. Never convert a temporary task fact or personal preference into a general skill.

## Freeze the comparison before writing the candidate

Write an English JSON specification in an authorized task folder. It contains `evidence` (observed result with actual artifact or tool-output references) and exactly three `cases`. Each case has `kind` (`target`, `regression`, or `heldout`), `prompt`, `options` (an object mapping choice IDs to concrete possible actions), and `expected` (the correct choice ID). Use distinct realistic situations and plausible options. Correct answers come from observed requirements, not from the proposed wording. The held-out case must not be used to tune the candidate after preparation. Avoid answer clues, arbitrary tokens, and labels like “safe answer.”

These tests measure procedural decisions, not live tool execution. Include verified real execution evidence separately; never claim that decision tests prove an external export, deployment, or classroom result. If the job cannot be meaningfully evaluated through this format, leave a proposal and report the missing real evaluation instead of auto-promoting.

Prepare the immutable baseline and cases:

```sh
python3 /Users/ssyan110/.codex/skill-evolution/evolve.py prepare learned-JOB /absolute/path/spec.json
```

Use the returned run ID. Write the candidate SKILL.md outside the active skill collection: frontmatter `name: learned-JOB`, one-line English `description`, then a compact conditional procedure with a concrete verification step. Keep incident logs, secrets, source transcripts, and test answers out. Preserve exceptions and useful prior guidance. Do not create executable learned code in this first version.

```sh
python3 /Users/ssyan110/.codex/skill-evolution/evolve.py stage RUN_ID /absolute/path/candidate.md
python3 /Users/ssyan110/.codex/skill-evolution/evolve.py evaluate RUN_ID
```

Evaluation makes six bounded Codex decision probes (three cases, baseline and candidate) using the existing login. It may consume model usage. Wait for the actual result; do not fabricate receipts or edit the frozen suite, snapshots, hashes, report, or controller. Hooks are disabled only inside isolated evaluation processes to prevent recursion. The evaluator uses read-only mode; it cannot validate external mutations. If evaluation fails or times out, retain the incumbent and report the blocker.

A passing result requires improvement on the target and passing all candidate cases. If baseline already succeeds, keep it rather than adding context. At most one candidate with two revision rounds is allowed per completed task; do not start new run IDs to evade this budget. Revise only from the target case; a held-out failure means defer the change until new independent evidence and a new review exist.

Only after `status: validated`:

```sh
python3 /Users/ssyan110/.codex/skill-evolution/evolve.py promote RUN_ID
```

The controller restricts paths, checks frozen hashes, serializes its writes, snapshots the incumbent, and atomically replaces the skill file. It rejects unregistered files and detected concurrent edits. These checks are data-loss protection, not OS isolation from another process running as the same user. Do not write active learned skills directly.

## Reuse and regression

UserPromptSubmit supplies only registered learned skill metadata. Read the relevant skill file before applying it; task instructions always take priority. Recheck environment-sensitive assumptions. Report actual retrieval separately from a file merely existing.

If later verified evidence attributes a regression to the promoted revision, use its run ID:

```sh
python3 /Users/ssyan110/.codex/skill-evolution/evolve.py rollback RUN_ID
```

Rollback preserves intervening edits by refusing to overwrite them. In that case draft a targeted reversal. New skills are withdrawn from discovery into their run folder; previous versions are restored. Do not delete historical evidence to hide a failure.

Use `status` to inspect the registered versions and `pause` / `resume` to stop or resume learning on the user's request. `pause` disables the learning hooks; already learned skill files remain available. Do not claim overall capability improvement from a small pilot. Report the specific tested gain and its limits.
