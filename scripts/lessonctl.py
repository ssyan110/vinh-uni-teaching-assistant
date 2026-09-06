#!/usr/bin/env python3
"""Safe, lesson-scoped entry point for the first Boya production gates.

This first implementation intentionally wraps existing read-only checks. It
never builds PPTX, changes authority, or promotes assets. ``preflight`` is G0;
``compile`` is the narrow G1 compiler for existing lesson draft manifests.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import sys
import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from production_gate import PROJECT_ROOT, check_lesson_ppt_draft
from blocker_contract import with_blocker_records
from lesson_context import LessonContextError, resolve_lesson_context, _safe_project_path

LESSON_KEY_RE = re.compile(r"^(?P<textbook>[A-Za-z0-9][A-Za-z0-9_-]*):(?P<lesson>lesson-\d{2})$")
PROTECTED_NAMES = {"20-approved", "30-qa", "40-release"}
DEFAULT_FINALIZED_ROOT = Path("/Users/ssyan110/Desktop/Work/Teaching/VinhUni/00_上課教材")
NS = {"a": "http://schemas.openxmlformats.org/drawingml/2006/main", "p": "http://schemas.openxmlformats.org/presentationml/2006/main"}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def finalized_deck_paths(lesson_key: str, root: Path) -> dict[str, Path]:
    parsed = parse_lesson_key(lesson_key)
    if not parsed:
        return {}
    textbook_id, lesson_id = parsed
    resolve_lesson_context(PROJECT_ROOT, lesson_key)
    if textbook_id != "boya-quasi-intermediate-i":
        raise ValueError("finalized corpus is scoped to boya-quasi-intermediate-i; explicit textbook mapping required")
    number = lesson_id.removeprefix("lesson-")
    result: dict[str, Path] = {}
    for mode, label in (("online", "在线预习"), ("face-to-face", "实体课")):
        matches = sorted(
            path for path in root.glob(f"**/lesson-{number}-{label}.pptx")
            if path.is_file() and not path.is_symlink()
            and path.resolve().is_relative_to(root.resolve())
        )
        if len(matches) == 1:
            result[mode] = matches[0]
        elif len(matches) > 1:
            raise ValueError(
                f"finalized source is ambiguous for {lesson_key} {mode}: "
                + ", ".join(str(path) for path in matches)
            )
    return result


def extract_finalized_deck(path: Path, lesson_key: str, mode: str) -> dict[str, Any]:
    """Extract only package facts needed to make the finalized PPT self-describing."""
    with zipfile.ZipFile(path) as package:
        bad_member = package.testzip()
        if bad_member:
            raise ValueError(f"corrupt ZIP member: {bad_member}")
        def slide_number(name: str) -> int:
            match = re.search(r"slide(\d+)", name)
            return int(match.group(1)) if match else 0

        slide_names = sorted(
            (name for name in package.namelist() if re.fullmatch(r"ppt/slides/slide\d+\.xml", name)),
            key=slide_number,
        )
        slides: list[dict[str, Any]] = []
        for index, name in enumerate(slide_names, start=1):
            root = ET.fromstring(package.read(name))
            texts = [node.text or "" for node in root.findall(".//a:t", NS)]
            slides.append({"slide_index": index, "xml_member": name, "text": texts, "text_joined": "".join(texts)})
        media = []
        for name in sorted(n for n in package.namelist() if n.startswith("ppt/media/")):
            data = package.read(name)
            media.append({"member": name, "sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data)})
        notes = sorted(n for n in package.namelist() if re.fullmatch(r"ppt/notesSlides/notesSlide\d+\.xml", n))
        presentation = ET.fromstring(package.read("ppt/presentation.xml"))
        size = presentation.find(".//p:sldSz", NS)
        return {
            "lesson_key": lesson_key,
            "mode": mode,
            "path": str(path),
            "sha256": sha256(path),
            "bytes": path.stat().st_size,
            "slide_count": len(slides),
            "notes_count": len(notes),
            "media_count": len(media),
            "slide_size_emu": dict(size.attrib) if size is not None else {},
            "slides": slides,
            "media": media,
        }


def validate_media_entry(member: str, data: bytes) -> str | None:
    suffix = Path(member).suffix.lower()
    signatures = {
        ".png": b"\x89PNG\r\n\x1a\n",
        ".jpg": b"\xff\xd8\xff",
        ".jpeg": b"\xff\xd8\xff",
        ".gif": b"GIF8",
        ".mp3": (b"ID3", b"\xff\xfb", b"\xff\xf3", b"\xff\xf2"),
        ".wav": b"RIFF",
        ".m4a": b"",  # validated by non-empty package payload; ftyp may vary by encoder
    }
    expected = signatures.get(suffix)
    if expected is None:
        return None
    if not data:
        return f"empty media member: {member}"
    if isinstance(expected, tuple):
        if not any(data.startswith(item) for item in expected):
            return f"invalid {suffix} signature: {member}"
    elif expected and not data.startswith(expected):
        return f"invalid {suffix} signature: {member}"
    return None


def image_probe_finalized(lesson_key: str, finalized_root: Path) -> dict[str, Any]:
    preflight_result = finalized_preflight(lesson_key, finalized_root)
    if preflight_result["status"] != "ready":
        return {**preflight_result, "command": "image-probe"}
    errors: list[str] = []
    summary: dict[str, Any] = {}
    for mode, path in finalized_deck_paths(lesson_key, finalized_root).items():
        with zipfile.ZipFile(path) as package:
            media = [name for name in package.namelist() if name.startswith("ppt/media/")]
            for member in media:
                error = validate_media_entry(member, package.read(member))
                if error:
                    errors.append(f"{mode}: {error}")
            summary[mode] = {"path": str(path), "media_count": len(media), "package_sha256": sha256(path)}
    return with_blocker_records({"command": "image-probe", "stage": "G2", "source": "finalized-pptx", "lesson_key": lesson_key, "status": "passed" if not errors else "blocked", "decks": summary, "blockers": errors}, scope="image-probe")


def safe_run_root(run_id: str) -> Path:
    if not isinstance(run_id, str) or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]*", run_id):
        raise ValueError("run_id contains unsafe path characters")
    return _safe_project_path(PROJECT_ROOT, f".agent/runs/{run_id}")


def build_finalized(lesson_key: str, finalized_root: Path, run_id: str) -> dict[str, Any]:
    preflight_result = finalized_preflight(lesson_key, finalized_root)
    if preflight_result["status"] != "ready":
        return {**preflight_result, "command": "build", "stage": "G3"}
    try:
        run_root = safe_run_root(run_id)
        build_dir = _safe_project_path(run_root, "build")
    except (ValueError, LessonContextError) as exc:
        return fail_result("build", lesson_key, [str(exc)])
    if build_dir.exists():
        return fail_result("build", lesson_key, [f"run already exists: {rel(run_root)}"])
    build_dir.mkdir(parents=True)
    built: dict[str, Any] = {}
    for mode, source_path in finalized_deck_paths(lesson_key, finalized_root).items():
        label = "在线预习" if mode == "online" else "实体课"
        target = build_dir / f"{lesson_key.rsplit(':', 1)[1]}-{label}.pptx"
        shutil.copy2(source_path, target)
        with zipfile.ZipFile(target) as package:
            bad = package.testzip()
            if bad:
                return fail_result("build", lesson_key, [f"copied deck has corrupt ZIP member: {bad}"])
        built[mode] = {"path": rel(target), "sha256": sha256(target), "bytes": target.stat().st_size}
    return with_blocker_records({"command": "build", "stage": "G3", "source": "finalized-pptx", "status": "passed", "lesson_key": lesson_key, "run_id": run_id, "build_dir": rel(build_dir), "decks": built}, scope="build")


def qa_finalized(lesson_key: str, run_id: str) -> dict[str, Any]:
    try:
        context = resolve_lesson_context(PROJECT_ROOT, lesson_key)
        if context.textbook_id != "boya-quasi-intermediate-i":
            raise ValueError("finalized QA requires the quasi-intermediate corpus identity")
        build_dir = _safe_project_path(safe_run_root(run_id), "build")
    except (ValueError, LessonContextError) as exc:
        return fail_result("qa", lesson_key, [str(exc)])
    if not build_dir.is_dir():
        return fail_result("qa", lesson_key, [f"build staging is missing: {rel(build_dir)}"])
    results: dict[str, Any] = {}
    blockers: list[str] = []
    for mode, label in (("online", "在线预习"), ("face-to-face", "实体课")):
        path = build_dir / f"{lesson_key.rsplit(':', 1)[1]}-{label}.pptx"
        if not path.is_file():
            blockers.append(f"missing staged {mode} deck: {rel(path)}")
            continue
        try:
            extracted = extract_finalized_deck(path, lesson_key, mode)
        except (OSError, ValueError, zipfile.BadZipFile, ET.ParseError) as exc:
            blockers.append(f"{mode} extraction failed: {exc}")
            continue
        if extracted["slide_count"] <= 0:
            blockers.append(f"{mode} has no slides")
        if any(not isinstance(slide["text"], list) for slide in extracted["slides"]):
            blockers.append(f"{mode} contains malformed slide text extraction")
        results[mode] = {key: extracted[key] for key in ("path", "sha256", "bytes", "slide_count", "notes_count", "media_count", "slide_size_emu")}
    return with_blocker_records({"command": "qa", "stage": "G4", "source": "finalized-pptx", "status": "passed" if not blockers else "blocked", "lesson_key": lesson_key, "run_id": run_id, "results": results, "blockers": blockers}, scope="qa")


def rel(path: Path) -> str:
    try:
        return str(path.relative_to(PROJECT_ROOT))
    except ValueError:
        return str(path)


def fail_result(command: str, lesson_key: str | None, blockers: list[str]) -> dict[str, Any]:
    return with_blocker_records({
        "command": command,
        "lesson_key": lesson_key,
        "status": "blocked",
        "blockers": blockers,
    }, scope=command)


def parse_lesson_key(value: str | None) -> tuple[str, str] | None:
    if not value:
        return None
    match = LESSON_KEY_RE.fullmatch(value)
    return (match.group("textbook"), match.group("lesson")) if match else None


def registry_entry(lesson_key: str) -> dict[str, Any] | None:
    registry = read_json(PROJECT_ROOT / "course/lesson-registry.json")
    entries = registry if isinstance(registry, list) else registry.get("lessons", [])
    return next((item for item in entries if item.get("lesson_key") == lesson_key), None)


def output_path(lesson_key: str, requested: str | None) -> Path:
    parsed = parse_lesson_key(lesson_key)
    if not parsed:
        raise ValueError("invalid lesson_key")
    textbook_id, lesson_id = parsed
    root = PROJECT_ROOT / "lessons" / textbook_id / lesson_id / "10-design" / "pptx-draft"
    candidate = Path(requested) if requested else root
    if not candidate.is_absolute():
        candidate = PROJECT_ROOT / candidate
    return candidate.resolve()


def validate_output_scope(lesson_key: str, candidate: Path) -> list[str]:
    textbook_id, lesson_id = parse_lesson_key(lesson_key)  # type: ignore[misc]
    lesson_root = PROJECT_ROOT / "lessons" / textbook_id / lesson_id
    draft_root = lesson_root / "10-design" / "pptx-draft"
    blockers: list[str] = []
    try:
        candidate.relative_to(draft_root.resolve())
    except ValueError:
        blockers.append(f"output must stay under {rel(draft_root)}")
        return blockers
    if any(part in PROTECTED_NAMES for part in candidate.relative_to(lesson_root).parts):
        blockers.append("output cannot be inside an authority, QA, or release directory")
    return blockers


def finalized_preflight(lesson_key: str | None, finalized_root: Path) -> dict[str, Any]:
    parsed = parse_lesson_key(lesson_key)
    if not parsed:
        return fail_result("preflight", lesson_key, ["lesson_key must match <textbook_id>:lesson-<nn>"])
    assert lesson_key is not None
    try:
        decks = finalized_deck_paths(lesson_key, finalized_root)
    except (ValueError, LessonContextError, OSError) as exc:
        return fail_result("preflight", lesson_key, [str(exc)])
    blockers: list[str] = []
    if not finalized_root.is_dir():
        blockers.append(f"finalized root does not exist: {finalized_root}")
    for mode in ("online", "face-to-face"):
        if mode not in decks:
            blockers.append(f"finalized {mode} PPTX is missing for {lesson_key}")
    return with_blocker_records({
        "command": "preflight",
        "source": "finalized-pptx",
        "lesson_key": lesson_key,
        "status": "ready" if not blockers else "blocked",
        "finalized_root": str(finalized_root),
        "decks": {mode: str(path) for mode, path in decks.items()},
        "blockers": blockers,
    }, scope="preflight")


def preflight(lesson_key: str | None, requested_output: str | None, source: str = "finalized-pptx", finalized_root: Path = DEFAULT_FINALIZED_ROOT) -> dict[str, Any]:
    if source == "finalized-pptx":
        return finalized_preflight(lesson_key, finalized_root)
    blockers: list[str] = []
    parsed = parse_lesson_key(lesson_key)
    if not parsed:
        return fail_result("preflight", lesson_key, ["lesson_key must match <textbook_id>:lesson-<nn>"])
    assert lesson_key is not None
    try:
        entry = registry_entry(lesson_key)
    except (OSError, json.JSONDecodeError) as exc:
        return fail_result("preflight", lesson_key, [f"lesson registry unavailable or invalid: {exc}"])
    if not entry:
        return fail_result("preflight", lesson_key, [f"lesson is not registered: {lesson_key}"])

    candidate = output_path(lesson_key, requested_output)
    blockers.extend(validate_output_scope(lesson_key, candidate))
    gate = check_lesson_ppt_draft(lesson_key, str(candidate))
    blockers.extend(gate.get("blockers", []))

    textbook_id, lesson_id = parsed
    lesson_root = PROJECT_ROOT / "lessons" / textbook_id / lesson_id
    source_manifest_path = lesson_root / "00-source/source-manifest.json"
    canonical_path = lesson_root / "00-source/canonical-source.json"
    if source_manifest_path.is_file():
        try:
            source_manifest = read_json(source_manifest_path)
            if source_manifest.get("approved") is not True:
                blockers.append("source approval is not recorded in source-manifest.json")
            if source_manifest.get("source_status") != "verified":
                blockers.append(f"source_status must be 'verified', got {source_manifest.get('source_status')!r}")
            if source_manifest.get("source_qa_status") != "passed":
                blockers.append(f"source_qa_status must be 'passed', got {source_manifest.get('source_qa_status')!r}")
            if source_manifest.get("review_status") not in {"approved", "approved_by_adam"}:
                blockers.append(f"review_status is not approved: {source_manifest.get('review_status')!r}")
        except (OSError, json.JSONDecodeError) as exc:
            blockers.append(f"cannot inspect source approval: {exc}")
    if canonical_path.is_file():
        try:
            canonical = read_json(canonical_path)
            review = canonical.get("review", {})
            if review.get("approved") is not True:
                blockers.append("canonical source review.approved is not true")
        except (OSError, json.JSONDecodeError) as exc:
            blockers.append(f"cannot inspect canonical approval: {exc}")

    result = {
        "command": "preflight",
        "lesson_key": lesson_key,
        "textbook_id": textbook_id,
        "lesson_id": lesson_id,
        "status": "ready" if not blockers else "blocked",
        "output_dir": str(candidate),
        "source": {
            "canonical": rel(lesson_root / "00-source/canonical-source.json"),
            "manifest": rel(lesson_root / "00-source/source-manifest.json"),
            "boundary": sorted(rel(path) for path in (lesson_root / "10-design/storyboard").glob(f"{lesson_id}-boundary-confirmation*.md")),
        },
        "blockers": blockers,
    }
    return with_blocker_records(result, scope="preflight")


def compile_lesson(lesson_key: str | None, requested_output: str | None, run_id: str | None, source: str = "finalized-pptx", finalized_root: Path = DEFAULT_FINALIZED_ROOT) -> dict[str, Any]:
    preflight_result = preflight(lesson_key, requested_output, source, finalized_root)
    if preflight_result["status"] != "ready":
        preflight_result["command"] = "compile"
        preflight_result["stage"] = "G1"
        return preflight_result
    assert lesson_key is not None
    textbook_id, lesson_id = parse_lesson_key(lesson_key)  # type: ignore[misc]
    if source == "finalized-pptx":
        decks = finalized_deck_paths(lesson_key, finalized_root)
        try:
            extracted = {mode: extract_finalized_deck(path, lesson_key, mode) for mode, path in decks.items()}
        except (OSError, KeyError, ValueError, zipfile.BadZipFile, ET.ParseError) as exc:
            return fail_result("compile", lesson_key, [f"cannot extract finalized PPTX: {exc}"])
        run_name = run_id or datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]*", run_name):
            return fail_result("compile", lesson_key, ["run_id contains unsafe path characters"])
        try:
            run_root = safe_run_root(run_name)
            compiled_dir = _safe_project_path(run_root, "compiled")
        except (ValueError, LessonContextError) as exc:
            return fail_result("compile", lesson_key, [str(exc)])
        if compiled_dir.exists():
            return fail_result("compile", lesson_key, [f"run already exists: {rel(run_root)}"])
        compiled_dir.mkdir(parents=True)
        lock = {"schema_version": "boya-finalized-pptx-spec-v1", "stage": "G1", "source": "finalized-pptx", "lesson_key": lesson_key, "textbook_id": textbook_id, "lesson_id": lesson_id, "compiled_at": datetime.now(timezone.utc).isoformat(), "decks": extracted}
        (compiled_dir / "lesson-spec.lock.json").write_text(json.dumps(lock, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        report = {"status": "passed", "source": "finalized-pptx", "lesson_key": lesson_key, "run_id": run_name, "modes": sorted(extracted), "slide_counts": {mode: data["slide_count"] for mode, data in extracted.items()}, "sha256": {mode: data["sha256"] for mode, data in extracted.items()}}
        (compiled_dir / "compile-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        return with_blocker_records({"command": "compile", "stage": "G1", **report, "compiled_dir": rel(compiled_dir)}, scope="compile")

    draft_dir = output_path(lesson_key, requested_output)
    run_name = run_id or datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]*", run_name):
        return fail_result("compile", lesson_key, ["run_id contains unsafe path characters"])
    try:
        run_root = safe_run_root(run_name)
        compiled_dir = _safe_project_path(run_root, "compiled")
    except (ValueError, LessonContextError) as exc:
        return fail_result("compile", lesson_key, [str(exc)])
    if compiled_dir.exists():
        return fail_result("compile", lesson_key, [f"run already exists: {rel(run_root)}"])

    manifest_paths = sorted(draft_dir.glob("*/manifest.json"))
    if not manifest_paths:
        return fail_result("compile", lesson_key, [f"no mode draft manifests found under {rel(draft_dir)}"])

    modes: dict[str, Any] = {}
    blockers: list[str] = []
    for path in manifest_paths:
        try:
            payload = read_json(path)
        except (OSError, json.JSONDecodeError) as exc:
            blockers.append(f"invalid draft manifest {rel(path)}: {exc}")
            continue
        if payload.get("lesson_key") != lesson_key:
            blockers.append(f"draft manifest lesson_key mismatch: {rel(path)}")
        mode = payload.get("mode")
        if mode not in {"online", "face-to-face"}:
            blockers.append(f"unsupported or missing mode in {rel(path)}: {mode!r}")
        elif mode in modes:
            blockers.append(f"duplicate mode manifest: {mode}")
        else:
            modes[mode] = {"path": rel(path), "sha256": sha256(path), "manifest": payload}

    if blockers:
        return fail_result("compile", lesson_key, blockers)
    compiled_dir.mkdir(parents=True)
    lock = {
        "schema_version": "boya-lesson-spec-v2-minimal",
        "stage": "G1",
        "lesson_key": lesson_key,
        "textbook_id": textbook_id,
        "lesson_id": lesson_id,
        "compiled_at": datetime.now(timezone.utc).isoformat(),
        "source": preflight_result["source"],
        "draft_manifests": modes,
        "slides": {mode: data["manifest"].get("fixed_structure", []) for mode, data in modes.items()},
    }
    (compiled_dir / "lesson-spec.lock.json").write_text(json.dumps(lock, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (compiled_dir / "compile-report.json").write_text(json.dumps({"status": "passed", "lesson_key": lesson_key, "modes": sorted(modes), "run_id": run_name}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return with_blocker_records({"command": "compile", "stage": "G1", "status": "passed", "lesson_key": lesson_key, "run_id": run_name, "compiled_dir": rel(compiled_dir), "modes": sorted(modes)}, scope="compile")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    for name in ("preflight", "compile", "image-probe", "build", "qa"):
        sub = subparsers.add_parser(name)
        sub.add_argument("--lesson-key", required=True)
        sub.add_argument("--finalized-root", type=Path, default=DEFAULT_FINALIZED_ROOT)
        if name in {"preflight", "compile"}:
            sub.add_argument("--output-dir")
            sub.add_argument("--source", choices=("finalized-pptx", "repo"), default="finalized-pptx")
        if name in {"compile", "build", "qa"}:
            sub.add_argument("--run-id")
    args = parser.parse_args()
    if args.command == "preflight":
        result = preflight(args.lesson_key, args.output_dir, args.source, args.finalized_root)
    elif args.command == "compile":
        result = compile_lesson(args.lesson_key, args.output_dir, args.run_id, args.source, args.finalized_root)
    elif args.command == "image-probe":
        result = image_probe_finalized(args.lesson_key, args.finalized_root)
    elif args.command == "build":
        if not args.run_id:
            result = fail_result("build", args.lesson_key, ["--run-id is required"])
        else:
            result = build_finalized(args.lesson_key, args.finalized_root, args.run_id)
    else:
        if not args.run_id:
            result = fail_result("qa", args.lesson_key, ["--run-id is required"])
        else:
            result = qa_finalized(args.lesson_key, args.run_id)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["status"] in {"ready", "passed"} else 1


if __name__ == "__main__":
    raise SystemExit(main())
