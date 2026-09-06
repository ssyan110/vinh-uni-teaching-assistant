#!/usr/bin/env python3
"""Run a lesson-scoped, evidence-backed control loop around existing gates.

The run packet tracks one agent execution. It never replaces lesson manifests,
records human approval, promotes drafts or creates releases.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

from lesson_context import LessonContext, resolve_lesson_context
from blocker_contract import HUMAN_TOKENS, blocker_records
from workflow_integrity import resolve_relative_path, sha256


PROJECT_ROOT = Path(__file__).resolve().parents[1]
RUN_ID_PATTERN = re.compile(r"[A-Za-z0-9][A-Za-z0-9._-]{0,79}")
PHASES = {"defined", "ready", "verifying", "needs_human", "blocked", "complete"}
PURPOSES = {"audit", "teacher-guide", "support", "prototype", "pptx", "semester-manual", "release"}
def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def validate_run_id(run_id: str) -> str:
    if not RUN_ID_PATTERN.fullmatch(run_id):
        raise ValueError(
            "run_id must start with an alphanumeric character and contain only "
            "letters, numbers, dot, underscore or hyphen"
        )
    return run_id


def run_paths(project_root: Path, run_id: str) -> dict[str, Path]:
    validate_run_id(run_id)
    root = project_root.resolve() / ".agent" / "runs" / run_id
    return {
        "root": root,
        "state": root / "state.json",
        "plan": root / "plan.md",
        "decision_log": root / "decision-log.md",
        "trace": root / "trace.jsonl",
        "final_report": root / "final-report.md",
    }


def atomic_write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    handle = tempfile.NamedTemporaryFile(
        mode="w",
        encoding="utf-8",
        dir=path.parent,
        prefix=f".{path.name}.",
        suffix=".tmp",
        delete=False,
    )
    temp_path = Path(handle.name)
    try:
        with handle:
            handle.write(text)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temp_path, path)
    finally:
        if temp_path.exists():
            temp_path.unlink()


def write_state(path: Path, state: dict[str, Any]) -> None:
    state["updated_at"] = utc_now()
    atomic_write_text(
        path,
        json.dumps(state, ensure_ascii=False, indent=2) + "\n",
    )


def append_event(paths: dict[str, Path], event: str, details: dict[str, Any]) -> None:
    item = {"timestamp": utc_now(), "event": event, **details}
    with paths["trace"].open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(item, ensure_ascii=False) + "\n")
    with paths["decision_log"].open("a", encoding="utf-8") as handle:
        handle.write(f"\n## {item['timestamp']} — {event}\n\n")
        handle.write(json.dumps(details, ensure_ascii=False, indent=2) + "\n")


def load_state(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"state root must be an object: {path}")
    return value


def _is_within(child: Path, parent: Path) -> bool:
    try:
        child.relative_to(parent)
        return True
    except ValueError:
        return False


def resolve_scoped_path(
    project_root: Path,
    value: str | Path,
    *,
    required_root: Path | None = None,
) -> tuple[Path, str]:
    project = project_root.resolve()
    raw = Path(value)
    if raw.is_absolute():
        relative = None
        for project_alias in (project_root.absolute(), project):
            try:
                relative = raw.relative_to(project_alias).as_posix()
                break
            except ValueError:
                continue
        if relative is None:
            raise ValueError(f"path must be inside the project: {value}")
    else:
        relative = raw.as_posix()
    return resolve_relative_path(project, relative, required_root=required_root)


def normalize_output_dir(
    project_root: Path,
    context: LessonContext,
    purpose: str,
    gate_stage: str,
    output_dir: str | None,
) -> str | None:
    if purpose in {"audit", "release"}:
        if output_dir:
            raise ValueError(f"purpose={purpose} does not accept an output directory")
        return None
    if gate_stage == "draft" and purpose != "pptx":
        raise ValueError("draft gate stage is only supported for purpose=pptx")

    design_root = context.lesson_root / "10-design"
    defaults = {
        "teacher-guide": design_root / "teacher-manual-draft",
        "support": design_root / "support-draft",
        "prototype": design_root / "visual-prototype-draft",
        "pptx": design_root / "pptx-draft",
        "semester-manual": design_root / "teacher-manual-export-draft",
    }
    default = defaults[purpose]
    project = project_root.resolve()
    design_root = design_root.resolve()
    candidate = output_dir if output_dir else default
    try:
        resolved, normalized = resolve_scoped_path(
            project_root,
            candidate,
            required_root=design_root,
        )
    except ValueError as error:
        raise ValueError(
            "agent run output must stay inside the selected lesson 10-design"
        ) from error
    if purpose == "pptx":
        draft_root = (design_root / "pptx-draft").resolve()
        if not _is_within(resolved, draft_root):
            raise ValueError("PPTX run output must stay inside the lesson pptx-draft root")
    return normalized


def create_run(
    project_root: Path,
    run_id: str,
    lesson_key: str,
    artifact: str,
    purpose: str,
    gate_stage: str,
    success_criteria: list[str],
    output_dir: str | None = None,
    offering_id: str | None = None,
    max_attempts: int = 3,
) -> dict[str, Any]:
    validate_run_id(run_id)
    if purpose not in PURPOSES:
        raise ValueError(f"unsupported purpose: {purpose}")
    if gate_stage not in {"draft", "authority"}:
        raise ValueError(f"unsupported gate stage: {gate_stage}")
    if not artifact.strip():
        raise ValueError("artifact must not be empty")
    if not success_criteria or any(not item.strip() for item in success_criteria):
        raise ValueError("at least one non-empty success criterion is required")
    if max_attempts < 1 or max_attempts > 10:
        raise ValueError("max_attempts must be between 1 and 10")

    context = resolve_lesson_context(project_root, lesson_key, offering_id)
    normalized_output = normalize_output_dir(
        project_root,
        context,
        purpose,
        gate_stage,
        output_dir,
    )
    paths = run_paths(project_root, run_id)
    if paths["root"].exists():
        raise FileExistsError(f"run already exists: {run_id}")
    paths["root"].mkdir(parents=True)
    created_at = utc_now()
    state: dict[str, Any] = {
        "schema_version": 1,
        "run_id": run_id,
        "lesson_key": context.lesson_key,
        "offering_id": context.offering_id,
        "textbook_id": context.textbook_id,
        "lesson_id": context.lesson_id,
        "lesson_root": context.lesson_root.relative_to(project_root.resolve()).as_posix(),
        "artifact": artifact.strip(),
        "purpose": purpose,
        "gate_stage": gate_stage,
        "output_dir": normalized_output,
        "success_criteria": success_criteria,
        "criteria_status": "pending",
        "phase": "defined",
        "attempt_count": 0,
        "max_attempts": max_attempts,
        "latest_preflight": None,
        "latest_external_check": None,
        "evidence": [],
        "blockers": [],
        "blocker_records": [],
        "blocker_categories": {"human": [], "technical": []},
        "human_required": False,
        "next_action": "run preflight",
        "stop_reason": None,
        "created_at": created_at,
        "updated_at": created_at,
    }
    write_state(paths["state"], state)
    criteria = "\n".join(f"- {item}" for item in success_criteria)
    atomic_write_text(
        paths["plan"],
        f"# Run plan: {run_id}\n\n"
        f"- Lesson: `{context.lesson_key}`\n"
        f"- Offering: `{context.offering_id}`\n"
        f"- Artifact: {artifact.strip()}\n"
        f"- Gate: `{gate_stage}/{purpose}`\n"
        f"- Output: `{normalized_output or '(read-only)'}`\n"
        f"- Maximum attempts: {max_attempts}\n\n"
        f"## Success criteria\n\n{criteria}\n",
    )
    atomic_write_text(paths["decision_log"], f"# Decision log: {run_id}\n")
    atomic_write_text(paths["trace"], "")
    atomic_write_text(paths["final_report"], "# Final report\n\nRun is not finished.\n")
    append_event(paths, "run_initialized", {
        "lesson_key": context.lesson_key,
        "artifact": artifact.strip(),
        "gate_stage": gate_stage,
        "purpose": purpose,
    })
    return state


def _default_gate_runner(project_root: Path, state: dict[str, Any]) -> dict[str, Any]:
    if project_root.resolve() != PROJECT_ROOT.resolve():
        raise RuntimeError("default production gate runner is only available for this project")
    from production_gate import check, check_lesson_ppt_draft

    output = state.get("output_dir")
    if state["gate_stage"] == "draft":
        return check_lesson_ppt_draft(state["lesson_key"], output)

    config = json.loads((project_root / "project.config.json").read_text(encoding="utf-8"))
    active = config.get("active_context", {})
    if active.get("lesson_key") != state["lesson_key"]:
        return {
            "purpose": state["purpose"],
            "stage": "authority",
            "status": "blocked",
            "output_dir": output,
            "blockers": [
                "authority gate is active-context scoped; selected lesson is not active"
            ],
        }
    return check(state["purpose"], output)


def run_preflight(
    project_root: Path,
    run_id: str,
    gate_runner: Callable[[Path, dict[str, Any]], dict[str, Any]] | None = None,
) -> dict[str, Any]:
    paths = run_paths(project_root, run_id)
    state = load_state(paths["state"])
    failures = validate_state(project_root, state, check_evidence=True)
    if failures:
        raise ValueError("invalid run state:\n- " + "\n- ".join(failures))
    if state["phase"] == "complete":
        raise RuntimeError("completed run cannot be preflighted again")

    result = (gate_runner or _default_gate_runner)(project_root, state)
    if not isinstance(result, dict) or result.get("status") not in {"ready", "blocked"}:
        raise ValueError("gate runner returned an invalid result")
    raw_blockers = result.get("blockers", [])
    if not isinstance(raw_blockers, list):
        raise ValueError("gate runner blockers must be a list")
    records = blocker_records(raw_blockers, scope=f"{state['gate_stage']}/{state['purpose']}")
    blockers = [record["message"] for record in records]
    human_blockers = [
        blocker
        for blocker in blockers
        if any(token in blocker.lower() for token in HUMAN_TOKENS)
    ]
    technical_blockers = [blocker for blocker in blockers if blocker not in human_blockers]
    human_required = bool(human_blockers)
    normalized_result = {**result, "blockers": blockers, "blocker_records": records}
    state["latest_preflight"] = {"checked_at": utc_now(), **normalized_result}
    state["blockers"] = blockers
    state["blocker_records"] = records
    state["blocker_categories"] = {
        "human": human_blockers,
        "technical": technical_blockers,
    }
    state["human_required"] = human_required
    state["stop_reason"] = None
    if result["status"] == "ready":
        state["phase"] = "ready"
        state["next_action"] = "record one bounded execution attempt"
    else:
        state["phase"] = "needs_human" if human_required and not technical_blockers else "blocked"
        if human_blockers and technical_blockers:
            state["next_action"] = (
                "resolve technical blockers and obtain required human evidence, "
                "then rerun preflight"
            )
        elif human_blockers:
            state["next_action"] = "obtain the required human decision or evidence, then rerun preflight"
        else:
            state["next_action"] = "resolve blockers without changing authority, then rerun preflight"
        state["stop_reason"] = "production preflight blocked"
    write_state(paths["state"], state)
    append_event(paths, "preflight_checked", {
        "status": result["status"],
        "phase": state["phase"],
        "blockers": blockers,
        "blocker_records": records,
    })
    if state["phase"] in {"blocked", "needs_human"}:
        write_final_report(paths["final_report"], state)
    return state


def attach_external_check(
    project_root: Path,
    run_id: str,
    result_file: str,
) -> dict[str, Any]:
    """Attach a read-only command result without granting authority or changing phase."""
    paths = run_paths(project_root, run_id)
    state = load_state(paths["state"])
    failures = validate_state(project_root, state, check_evidence=True)
    if failures:
        raise ValueError("invalid run state:\n- " + "\n- ".join(failures))
    resolved, normalized = resolve_scoped_path(project_root, result_file)
    if not resolved.is_file() or resolved.is_symlink():
        raise FileNotFoundError(f"external check result is missing or unsafe: {resolved}")
    payload = json.loads(resolved.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise ValueError("external check result must be an object")
    command = payload.get("command")
    if command not in {"plan", "inspect", "preflight", "compile", "image-probe", "build", "qa"}:
        raise ValueError("external check command is unsupported")
    status = payload.get("status")
    if status not in {"ready", "blocked", "clear", "review", "passed"}:
        raise ValueError("external check status is unsupported")
    raw_blockers = payload.get("blockers", [])
    if not isinstance(raw_blockers, list):
        raise ValueError("external check blockers must be a list")
    records = blocker_records(raw_blockers, scope=f"external/{command}")
    supplied_records = payload.get("blocker_records")
    if supplied_records is not None:
        if not isinstance(supplied_records, list) or supplied_records != records:
            raise ValueError("external check blocker_records do not match blockers")
    check = {
        "command": command,
        "status": status,
        "path": normalized,
        "sha256": sha256(resolved),
        "checked_at": utc_now(),
        "lesson_key": payload.get("lesson_key"),
        "release_id": payload.get("release_id"),
        "blockers": [item["message"] for item in records],
        "blocker_records": records,
    }
    state["latest_external_check"] = check
    write_state(paths["state"], state)
    append_event(paths, "external_check_attached", check)
    return state


def run_release_check(
    project_root: Path,
    run_id: str,
    mode: str,
    lesson_key: str,
    release_id: str,
    offering_id: str | None = None,
) -> dict[str, Any]:
    """Run only the read-only scoped release plan/inspect command and attach it."""
    if mode not in {"plan", "inspect"}:
        raise ValueError("release check mode must be plan or inspect; execute is not allowed")
    paths = run_paths(project_root, run_id)
    state = load_state(paths["state"])
    failures = validate_state(project_root, state, check_evidence=True)
    if failures:
        raise ValueError("invalid run state:\n- " + "\n- ".join(failures))
    command = [
        os.environ.get("PYTHON", "python3"),
        str(project_root / "scripts/build_release_package.py"),
        f"--{mode}", "--lesson-key", lesson_key, "--release-id", release_id,
    ]
    if offering_id:
        command.extend(["--offering-id", offering_id])
    completed = subprocess.run(command, cwd=project_root, text=True, capture_output=True, check=False)
    try:
        payload = json.loads(completed.stdout)
    except json.JSONDecodeError as error:
        raise ValueError(f"release check returned invalid JSON: {error}") from error
    if not isinstance(payload, dict):
        raise ValueError("release check result must be an object")
    expected_identity = {
        "lesson_key": lesson_key,
        "release_id": release_id,
    }
    if offering_id is not None:
        expected_identity["offering_id"] = offering_id
    for field, expected in expected_identity.items():
        if payload.get(field) != expected:
            raise ValueError(f"release check {field} does not match requested scope")
    if payload.get("command") != mode:
        raise ValueError("release check command does not match requested mode")
    result_path = paths["root"] / "checks" / f"release-{mode}.json"
    atomic_write_text(result_path, json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    return attach_external_check(project_root, run_id, str(result_path))


def record_attempt(project_root: Path, run_id: str, summary: str) -> dict[str, Any]:
    paths = run_paths(project_root, run_id)
    state = load_state(paths["state"])
    failures = validate_state(project_root, state, check_evidence=True)
    if failures:
        raise ValueError("invalid run state:\n- " + "\n- ".join(failures))
    if state["phase"] != "ready":
        raise RuntimeError("an attempt can only start from phase=ready")
    if state["attempt_count"] >= state["max_attempts"]:
        raise RuntimeError("retry budget is exhausted")
    if not summary.strip():
        raise ValueError("attempt summary must not be empty")

    state["attempt_count"] += 1
    state["phase"] = "verifying"
    state["next_action"] = "verify the artifact and record evidence-backed result"
    state["stop_reason"] = None
    write_state(paths["state"], state)
    append_event(paths, "attempt_recorded", {
        "attempt": state["attempt_count"],
        "summary": summary.strip(),
    })
    return state


def _record_evidence(
    project_root: Path,
    values: list[str],
    summary: str,
) -> list[dict[str, Any]]:
    project = project_root.resolve()
    records: list[dict[str, Any]] = []
    for value in values:
        resolved, normalized = resolve_scoped_path(project_root, value)
        if not resolved.is_file():
            raise FileNotFoundError(f"evidence file is missing or unsafe: {resolved}")
        records.append({
            "path": normalized,
            "sha256": sha256(resolved),
            "recorded_at": utc_now(),
            "summary": summary.strip(),
        })
    return records


def record_result(
    project_root: Path,
    run_id: str,
    result: str,
    summary: str,
    evidence: list[str],
    all_criteria_passed: bool = False,
) -> dict[str, Any]:
    paths = run_paths(project_root, run_id)
    state = load_state(paths["state"])
    failures = validate_state(project_root, state, check_evidence=True)
    if failures:
        raise ValueError("invalid run state:\n- " + "\n- ".join(failures))
    if state["phase"] != "verifying":
        raise RuntimeError("a result can only be recorded from phase=verifying")
    if result not in {"passed", "failed", "needs-human"}:
        raise ValueError(f"unsupported result: {result}")
    if not summary.strip():
        raise ValueError("result summary must not be empty")
    if result == "passed" and not evidence:
        raise ValueError("passed result requires at least one evidence file")
    if result == "passed" and not all_criteria_passed:
        raise ValueError("passed result requires explicit --all-criteria-passed")

    state["evidence"].extend(_record_evidence(project_root, evidence, summary))
    state["blockers"] = []
    state["blocker_records"] = []
    state["blocker_categories"] = {"human": [], "technical": []}
    state["human_required"] = False
    if result == "passed":
        state["criteria_status"] = "passed"
        state["phase"] = "complete"
        state["next_action"] = None
        state["stop_reason"] = "success criteria verified"
    elif result == "needs-human":
        state["criteria_status"] = "pending"
        state["phase"] = "needs_human"
        state["human_required"] = True
        state["blockers"] = [summary.strip()]
        state["blocker_records"] = blocker_records(state["blockers"], scope="result/needs-human")
        state["blocker_categories"] = {"human": [summary.strip()], "technical": []}
        state["next_action"] = "wait for the named human decision, then rerun preflight"
        state["stop_reason"] = "human decision required"
    else:
        state["criteria_status"] = "failed"
        state["blockers"] = [summary.strip()]
        state["blocker_records"] = blocker_records(state["blockers"], scope="result/failed")
        state["blocker_categories"] = {"human": [], "technical": [summary.strip()]}
        if state["attempt_count"] < state["max_attempts"]:
            state["phase"] = "ready"
            state["next_action"] = "repair within the declared output scope and record the next attempt"
            state["stop_reason"] = None
        else:
            state["phase"] = "blocked"
            state["next_action"] = None
            state["stop_reason"] = "retry budget exhausted"
    write_state(paths["state"], state)
    append_event(paths, "result_recorded", {
        "result": result,
        "phase": state["phase"],
        "summary": summary.strip(),
        "evidence_count": len(evidence),
    })
    write_final_report(paths["final_report"], state)
    return state


def write_final_report(path: Path, state: dict[str, Any]) -> None:
    blockers = state.get("blockers") or []
    blocker_text = "\n".join(f"- {item}" for item in blockers) or "- None"
    evidence = state.get("evidence") or []
    evidence_text = "\n".join(
        f"- `{item['path']}` — `{item['sha256']}`" for item in evidence
    ) or "- None"
    atomic_write_text(
        path,
        f"# Final report: {state['run_id']}\n\n"
        f"- Lesson: `{state['lesson_key']}`\n"
        f"- Artifact: {state['artifact']}\n"
        f"- Phase: `{state['phase']}`\n"
        f"- Attempts: {state['attempt_count']} / {state['max_attempts']}\n"
        f"- Stop reason: {state.get('stop_reason') or 'Run remains active'}\n\n"
        f"## Evidence\n\n{evidence_text}\n\n"
        f"## Blockers\n\n{blocker_text}\n",
    )


def validate_state(
    project_root: Path,
    state: dict[str, Any],
    *,
    check_evidence: bool,
) -> list[str]:
    failures: list[str] = []
    required_strings = (
        "run_id",
        "lesson_key",
        "offering_id",
        "textbook_id",
        "lesson_id",
        "lesson_root",
        "artifact",
        "purpose",
        "gate_stage",
        "phase",
    )
    for field in required_strings:
        if not isinstance(state.get(field), str) or not state[field]:
            failures.append(f"{field} must be a non-empty string")
    if failures:
        return failures
    try:
        validate_run_id(state["run_id"])
    except ValueError as error:
        failures.append(str(error))
    if state["purpose"] not in PURPOSES:
        failures.append(f"unsupported purpose: {state['purpose']}")
    if state["gate_stage"] not in {"draft", "authority"}:
        failures.append(f"unsupported gate_stage: {state['gate_stage']}")
    if state["phase"] not in PHASES:
        failures.append(f"unsupported phase: {state['phase']}")
    if state.get("schema_version") != 1:
        failures.append("schema_version must be 1")

    attempts = state.get("attempt_count")
    maximum = state.get("max_attempts")
    if not isinstance(attempts, int) or isinstance(attempts, bool):
        failures.append("attempt_count must be an integer")
    if not isinstance(maximum, int) or isinstance(maximum, bool) or not 1 <= maximum <= 10:
        failures.append("max_attempts must be an integer from 1 to 10")
    if isinstance(attempts, int) and isinstance(maximum, int) and not 0 <= attempts <= maximum:
        failures.append("attempt_count is outside the retry budget")

    criteria = state.get("success_criteria")
    if not isinstance(criteria, list) or not criteria or not all(
        isinstance(item, str) and item.strip() for item in criteria
    ):
        failures.append("success_criteria must be a non-empty string list")
    evidence = state.get("evidence")
    if not isinstance(evidence, list):
        failures.append("evidence must be a list")
        evidence = []
    blockers = state.get("blockers")
    if not isinstance(blockers, list) or not all(isinstance(item, str) for item in blockers):
        failures.append("blockers must be a string list")
        blockers = []
    records = state.get("blocker_records", [])
    if records is not None:
        if not isinstance(records, list) or not all(isinstance(item, dict) for item in records):
            failures.append("blocker_records must be an object list")
        else:
            for index, item in enumerate(records):
                if not all(isinstance(item.get(field), str) and item[field] for field in ("code", "message", "scope")):
                    failures.append(f"blocker_records[{index}] requires code, message and scope")
            if sorted(item["message"] for item in records if isinstance(item, dict) and isinstance(item.get("message"), str)) != sorted(blockers):
                failures.append("blocker records do not account for every blocker")
    categories = state.get("blocker_categories")
    if not isinstance(categories, dict):
        failures.append("blocker_categories must be an object")
    else:
        human = categories.get("human")
        technical = categories.get("technical")
        if not isinstance(human, list) or not all(isinstance(item, str) for item in human):
            failures.append("blocker_categories.human must be a string list")
            human = []
        if not isinstance(technical, list) or not all(isinstance(item, str) for item in technical):
            failures.append("blocker_categories.technical must be a string list")
            technical = []
        if sorted(human + technical) != sorted(blockers):
            failures.append("blocker categories do not account for every blocker")

    try:
        context = resolve_lesson_context(
            project_root,
            state["lesson_key"],
            state["offering_id"],
        )
        expected = {
            "textbook_id": context.textbook_id,
            "lesson_id": context.lesson_id,
            "lesson_root": context.lesson_root.relative_to(project_root.resolve()).as_posix(),
        }
        for field, value in expected.items():
            if state.get(field) != value:
                failures.append(f"state {field} does not match lesson registry")
        normalized = normalize_output_dir(
            project_root,
            context,
            state["purpose"],
            state["gate_stage"],
            state.get("output_dir"),
        )
        if state.get("output_dir") != normalized:
            failures.append("output_dir is not normalized for the selected lesson")
    except (OSError, ValueError, RuntimeError) as error:
        failures.append(f"lesson context validation failed: {error}")

    external = state.get("latest_external_check")
    if external is not None:
        if not isinstance(external, dict):
            failures.append("latest_external_check must be an object")
        else:
            for field in ("command", "status", "path", "sha256"):
                if not isinstance(external.get(field), str) or not external[field]:
                    failures.append(f"latest_external_check.{field} must be a non-empty string")
            try:
                check_path, normalized_check_path = resolve_scoped_path(project_root, external.get("path", ""))
                if normalized_check_path != external.get("path") or not check_path.is_file() or sha256(check_path) != external.get("sha256"):
                    failures.append("latest_external_check result file is missing or hash-mismatched")
            except (TypeError, ValueError):
                failures.append("latest_external_check result path is unsafe")
            check_blockers = external.get("blockers", [])
            check_records = external.get("blocker_records", [])
            if not isinstance(check_blockers, list) or not isinstance(check_records, list):
                failures.append("latest_external_check blockers and blocker_records must be lists")
            elif [item.get("message") for item in check_records if isinstance(item, dict)] != check_blockers:
                failures.append("latest_external_check blocker records do not match blockers")

    latest = state.get("latest_preflight")
    if state["phase"] in {"ready", "verifying", "complete"}:
        if not isinstance(latest, dict) or latest.get("status") != "ready":
            failures.append(f"phase={state['phase']} requires a ready preflight")
    if state["phase"] in {"verifying", "complete"} and attempts == 0:
        failures.append(f"phase={state['phase']} requires at least one attempt")
    if state["phase"] == "complete":
        if state.get("criteria_status") != "passed":
            failures.append("complete run requires criteria_status=passed")
        if not evidence:
            failures.append("complete run requires evidence")

    if check_evidence:
        project = project_root.resolve()
        for index, item in enumerate(evidence):
            if not isinstance(item, dict):
                failures.append(f"evidence[{index}] must be an object")
                continue
            value = item.get("path")
            expected_hash = item.get("sha256")
            if not isinstance(value, str) or not value:
                failures.append(f"evidence[{index}] has no path")
                continue
            try:
                path, normalized = resolve_scoped_path(project, value)
            except ValueError:
                failures.append(f"evidence[{index}] path is unsafe")
                continue
            if normalized != value or not path.is_file():
                failures.append(f"evidence[{index}] file is missing or unsafe: {value}")
                continue
            if not isinstance(expected_hash, str) or sha256(path) != expected_hash:
                failures.append(f"evidence[{index}] hash mismatch: {value}")
    return failures


def command_init(args: argparse.Namespace) -> dict[str, Any]:
    return create_run(
        PROJECT_ROOT,
        args.run_id,
        args.lesson_key,
        args.artifact,
        args.purpose,
        args.gate_stage,
        args.success_criterion,
        args.output_dir,
        args.offering_id,
        args.max_attempts,
    )


def command_status(args: argparse.Namespace) -> dict[str, Any]:
    return load_state(run_paths(PROJECT_ROOT, args.run_id)["state"])


def command_validate(args: argparse.Namespace) -> dict[str, Any]:
    state = command_status(args)
    failures = validate_state(PROJECT_ROOT, state, check_evidence=True)
    return {"status": "passed" if not failures else "failed", "failures": failures}


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    init = subparsers.add_parser("init", help="Create a local run packet")
    init.add_argument("--run-id", required=True)
    init.add_argument("--lesson-key", required=True)
    init.add_argument("--offering-id")
    init.add_argument("--artifact", required=True)
    init.add_argument("--purpose", required=True, choices=sorted(PURPOSES))
    init.add_argument("--gate-stage", choices=("draft", "authority"), default="draft")
    init.add_argument("--output-dir")
    init.add_argument("--success-criterion", action="append", required=True)
    init.add_argument("--max-attempts", type=int, default=3)
    init.set_defaults(handler=command_init)

    for name, help_text, handler in (
        ("preflight", "Run the existing production gate", lambda a: run_preflight(PROJECT_ROOT, a.run_id)),
        ("status", "Read current run state", command_status),
        ("validate", "Validate run state and evidence hashes", command_validate),
    ):
        command = subparsers.add_parser(name, help=help_text)
        command.add_argument("--run-id", required=True)
        command.set_defaults(handler=handler)

    check_result = subparsers.add_parser("check", help="Attach a read-only external command result")
    check_result.add_argument("--run-id", required=True)
    check_result.add_argument("--result-file", required=True)
    check_result.set_defaults(handler=lambda a: attach_external_check(PROJECT_ROOT, a.run_id, a.result_file))

    release_check = subparsers.add_parser("release-check", help="Run read-only release plan or inspect and attach result")
    release_check.add_argument("--run-id", required=True)
    release_check.add_argument("--mode", choices=("plan", "inspect"), required=True)
    release_check.add_argument("--lesson-key", required=True)
    release_check.add_argument("--release-id", required=True)
    release_check.add_argument("--offering-id")
    release_check.set_defaults(handler=lambda a: run_release_check(
        PROJECT_ROOT, a.run_id, a.mode, a.lesson_key, a.release_id, a.offering_id
    ))

    attempt = subparsers.add_parser("attempt", help="Record one bounded execution attempt")
    attempt.add_argument("--run-id", required=True)
    attempt.add_argument("--summary", required=True)
    attempt.set_defaults(handler=lambda a: record_attempt(PROJECT_ROOT, a.run_id, a.summary))

    result = subparsers.add_parser("result", help="Record an evidence-backed verification result")
    result.add_argument("--run-id", required=True)
    result.add_argument("--result", required=True, choices=("passed", "failed", "needs-human"))
    result.add_argument("--summary", required=True)
    result.add_argument("--evidence", action="append", default=[])
    result.add_argument("--all-criteria-passed", action="store_true")
    result.set_defaults(handler=lambda a: record_result(
        PROJECT_ROOT,
        a.run_id,
        a.result,
        a.summary,
        a.evidence,
        a.all_criteria_passed,
    ))
    return parser


def main() -> int:
    args = build_parser().parse_args()
    try:
        result = args.handler(args)
    except (FileNotFoundError, OSError, RuntimeError, ValueError) as error:
        print(json.dumps({"status": "error", "error": str(error)}, ensure_ascii=False, indent=2))
        return 1
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if args.command == "validate" and result["status"] != "passed":
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
