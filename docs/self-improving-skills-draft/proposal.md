# Self-improving skills — draft

Status: design draft, 2026-09-13. Intended reader: Adam, deciding how Codex should learn reusable working methods. Files are stored here for review; the design is not specific to teaching. No skill installation, background process, memory update, or live skill mutation has been performed.

## What would get better

The agent would reuse methods that demonstrably worked, correct methods that failed, and retire advice that becomes stale. Learning here means changing retrieved instructions and procedures. This proposal does not train model weights or promise general intelligence gains.

Example: an export workflow produces a valid file but the download button fails. A useful learned procedure tests the actual download and opens the downloaded artifact. A note saying “be more careful next time” changes no observable behavior and should be rejected.

## GitHub research

These are upstream descriptions inspected on 2026-09-13, not locally reproduced performance results. No upstream code was installed or copied.

| Project | Verified idea | Proposed use |
|---|---|---|
| [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent), [skills documentation](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills/) | The agent can create and patch procedural skills; background review can stage updates. Skills load when relevant, while durable facts have a separate memory role. | Capture reusable procedures after meaningful work and retrieve only relevant skills. |
| [ace-agent/ace](https://github.com/ace-agent/ace) | Generator, Reflector, and Curator produce incremental playbook changes, with helpful/harmful counters and deduplication. | Separate execution evidence from proposed edits; patch a small rule instead of rewriting the whole library. |
| [noahshinn/reflexion](https://github.com/noahshinn/reflexion) | Research implementations persist self-reflections across trials and allow a memory-disabled baseline. | Compare attempts with and without a learned change. Reflection alone is not proof of improvement. |

## Proposed package

Start with one skill, `skill-evolution`, whose single job is to turn verified task experience into a tested revision of a reusable procedure. Keep the subject skills separate: document production, debugging, research, and other jobs retain their own instructions.

Reuse the installed skill-authoring and validation capabilities. Do not add a vector database, training framework, or an independent agent for each conceptual role in the first version. A small local evidence ledger and versioned candidate folders are sufficient for an initial pilot.

## Learning cycle

1. Before a relevant task, retrieve the current approved procedure and check environment-sensitive assumptions.
2. Complete the task and its actual acceptance checks. Capture a compact evidence pointer when a correction, verified recovery, or reusable success occurs.
3. Decide whether the issue is a procedure defect, temporary environment failure, missing permission, or a task-specific exception. Only generalizable procedural lessons become skill candidates.
4. Make one small candidate patch. Preserve the old version and define the expected improvement before testing.
5. Compare both versions on the original failure, related tasks, and a held-out case that was not used to write the patch. Include the real instruction hierarchy and likely co-loaded skills.
6. Within a previously authorized writable skill collection, promote only a passing candidate. Otherwise return its diff and results for review.
7. Observe later relevant uses. Revert the specific change if it causes a confirmed regression; revalidate stale instructions before reuse.

## How it becomes automatic

A skill is a procedure, not a scheduler. Automatic discovery also does not guarantee execution after every task. The eventual host integration must deliver a task-completion event to the learning workflow, grant narrowly scoped storage access, and record whether the next task actually loaded the promoted version.

For Codex, first inspect the installed runtime for a supported completion trigger; do not assume a hook API exists. If there is none, invoke the review as an explicit final step of the authorized workflow. Scheduled batch review is an optional later implementation, not something enabled by this draft. For Hermes, inspect the running version and its existing review mechanism before adding another loop.

Proposed autonomy after activation: automatically create and test candidates, and automatically promote passing changes in an explicitly authorized, agent-owned skill collection. Do not ask again for each edit within that standing scope. Existing user-managed skills require authorization to join that collection. Changes to the evaluator, promotion rules, or this learning skill itself remain proposals, so the agent cannot redefine success to pass its own tests.

Host policy always applies. In this Codex context, memory updates require an explicit user request and the designated extension-note route; installing this skill would not override that constraint. Evidence belongs in authorized task storage, not silently in global memory.

## Pilot and acceptance

Proposed pilot: one repeated artifact-export job, with ten representative cases and a held-out subset. Freeze expected outcomes before running either version. Use matching tools, model settings, and budgets. For variable model behavior, repeat comparisons three times. This is a practical pilot threshold, not a statistical guarantee.

Keep correctness and authorization as hard constraints. Measure task completion, repeated error rate, user corrections, tool calls, elapsed time, and tokens where available. A candidate must fix its target case and cause no regression in the required cases. Efficiency matters only after correctness passes. If improvement is ambiguous, keep the incumbent.

Default review limit: one candidate and at most two revision rounds per completed task. No useful lesson means no change. Merge duplicate guidance; retire stale advice with a recoverable snapshot. Do not reward the number of generated skills.

## Draft validation boundary

The package includes an executable-by-agent procedure and behavioral cases for later evaluation. Structural validation and a manual consistency review can check the draft now. No live learning loop, cross-session retrieval, automatic promotion, rollback execution, or measured capability improvement has been demonstrated.
