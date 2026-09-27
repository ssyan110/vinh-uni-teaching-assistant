# Skill evolution — installed status

Installed and verified on 2026-09-13 with Codex CLI 0.154.0-alpha.6.2. Skills and operational content are English. User conversation remains in the user's preferred language.

## Installed behavior

- The user-authorized UserPromptSubmit hook provides metadata for registered learned skills. The agent reads only relevant procedures.
- PostToolUse records a count, without retaining tool input, tool output, or transcripts.
- Stop requests one bounded learning review after at least two tool calls or a detected correction. Simple chat may not trigger a review. Continuations do not retrigger themselves.
- The current agent handles the review in its existing task context. New evidence can produce a frozen comparison suite and a candidate. Existing user-managed skills remain unchanged.
- A candidate receives six read-only Codex decision probes: three scenarios for the baseline and three for the candidate. Promotion requires target improvement and all candidate cases passing. Each probe has a 120-second timeout. One candidate and at most two revision rounds are allowed; held-out failure prevents tuning against that suite.
- Passing changes can enter only the dedicated learned collection through the controller. Previous versions remain recoverable. A failed or ambiguous comparison leaves the incumbent in place.

## Paths

- Controller skill: `/Users/ssyan110/.codex/skills/skill-evolution/SKILL.md`
- Controller: `/Users/ssyan110/.codex/skill-evolution/evolve.py`
- Learned collection: `/Users/ssyan110/.codex/skills/self-learned/`
- Candidates and results: `/Users/ssyan110/.codex/skill-evolution/runs/`
- Hook metadata log: `/Users/ssyan110/.codex/skill-evolution/events.jsonl`
- Hook definitions: `/Users/ssyan110/.codex/hooks.json`

The three exact reviewed hook definitions are enabled and trusted through the native config API under the user's activation authorization. Existing notification configuration and unrelated config values were verified unchanged. No existing skill was rewritten.

## What was actually tested

1. Structural skill validation and native `skills/list` discovery passed.
2. Controller tests passed for bounded hooks, metadata retrieval, invalid paths, symlink rejection, failed comparisons, frozen suites, tampered results, held-out tuning refusal, promotion, exact prior-version restoration, withdrawal, and concurrent-edit refusal. These use explicit stubs to test controller behavior, not model quality.
3. A real fresh Codex run made two tool calls. Its native Stop hook requested a review, the agent read the installed skill, and `no-change` completed once. A discovered empty-final-response problem was fixed; the rerun preserved `cobalt meadow` as the final answer.
4. A production-oriented candidate about Codex skill verification was rejected: baseline and candidate both passed 3/3. No unnecessary production skill was installed.
5. An isolated export-protocol fixture demonstrated a real decision improvement: baseline 1/3, candidate 3/3. The controller promoted the candidate. A fresh Codex run discovered and read it, then selected the current job ID correctly. Rollback restored the exact prior hash. Test-only skills were withdrawn from discovery afterward.

The production learned collection starts empty intentionally. It will grow only when new task evidence and a passing comparison justify a skill.

## Limits

The positive pilot is synthetic and local. Its decision probes demonstrate that the procedure changes a model's choices; they do not prove live exports, deployments, or general capability gains. Real task evidence remains necessary, and jobs that need stronger evaluation stay proposals. Single comparisons are not statistical guarantees.

Native CLI hooks and fresh-run loading were tested. The existing desktop task predates installation, and its hot reload was not verified; the managed daemon socket was unavailable. Open a new Codex task to load the new configuration. No app restart, daemon startup, or termination of existing tasks was performed.

Reviews and evaluation calls consume model usage and may add latency after a non-trivial task. The controller is ordinary same-user software, not an OS security boundary; host sandbox and permission restrictions still apply. It never grants itself permission to change the evaluator or existing skills.

## Controls

Inspect status:

```sh
python3 /Users/ssyan110/.codex/skill-evolution/evolve.py status
```

Pause or resume future learning hooks:

```sh
python3 /Users/ssyan110/.codex/skill-evolution/evolve.py pause
python3 /Users/ssyan110/.codex/skill-evolution/evolve.py resume
```

Pausing leaves already learned files available. A specific promoted revision can be reverted with `rollback RUN_ID`; intervening manual edits cause refusal rather than overwrite.

## Evidence

Project verification package: `/Users/ssyan110/Development/vinh-uni-teaching-assistant/docs/self-improving-skills-draft/runtime-evidence/verification-summary.json`.

Hook behavior was checked against the [official Codex hooks documentation](https://developers.openai.com/codex/hooks), and the installed app-server's generated schemas. The schemas are retained under `/Users/ssyan110/.codex/skill-evolution/verification/schema/`.
