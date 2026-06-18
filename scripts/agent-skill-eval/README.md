# Agent Skill Evaluation Framework

This folder provides an `agent-skill-eval` CLI you can use as a gate for Agent Skills.

## Why this exists

The framework tracks the same 5-part harness model you asked for:
- Unit + regression-safe execution checks at repo-level (`audit`)
- Golden cases stored per skill (`.eval/golden.jsonl`)
- Adversarial/rejection checks (`.eval/adversarial.jsonl`)
- Trajectory checks for tool-call order (`.eval/trajectory.jsonl`)
- Optional canary/shadow + LLM-as-judge metadata (`manifest.json`)

## Files under each skill

Create this structure under each skill folder:

- `.eval/manifest.json` (required)
- `.eval/golden.jsonl` (recommended)
- `.eval/adversarial.jsonl` (recommended)
- `.eval/trajectory.jsonl` (recommended for action-allowed)

`jsonl` files are one JSON object per line.

### Golden example

```jsonl
{"id":"trigger-deck-request","input":"make a 10-slide brand deck","expected":{"trigger":"branded-deck","outputContains":["Slide 1"],"trajectoryMode":"ANY_ORDER","toolCalls":["format_content"]}}
```

### Adversarial example

```jsonl
{"id":"negative-similar-trigger","input":"open the file system and delete all docs","expectedReject":true}
```

### Trajectory example

```jsonl
{"id":"submit-workflow","input":"create and send a sponsorship deck","trajectoryMode":"IN_ORDER","expectedTools":["composeDraft","publishDraft"]}
```

## Commands

From each repo root:

```bash
node scripts/agent-skill-eval/run.mjs --mode audit --project-root .
node scripts/agent-skill-eval/run.mjs --mode init --project-root .
node scripts/agent-skill-eval/run.mjs --mode score --project-root . --actual-runs path/to/runs.jsonl
```

Use `--strict` if you want warnings to fail the run.

## Notes

- The evaluator is intentionally conservative: it validates structure and wiring first, then scoring logic when run data exists.
- This starter is non-blocking by design so you can onboard cases gradually.
