"""Read-only lesson preparation snapshot; no approval or release transitions."""
from __future__ import annotations

import json
import os
import zipfile
from datetime import datetime, timezone
from pathlib import Path

from lesson_context import LessonContextError, _safe_project_path, resolve_lesson_context
from production_gate import check_content_approval
from validate_lesson_identity import validate as validate_lesson_identity
from workflow_integrity import sha256
import online_ppt_release


def local_path(root: Path, value: str) -> Path:
    if not isinstance(value, str) or not value.strip():
        raise ValueError("未登记文件路径")
    path = _safe_project_path(root, value)
    if any(part in {"archive", "90-archive", "legacy"} for part in path.relative_to(root).parts):
        raise ValueError("历史归档不能作为本次准备资料")
    return path


def read_object(path: Path) -> dict:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"JSON 必须是对象：{path.name}")
    return value


def human_label(value):
    return {"pending": "待完成", "pending_manual_acceptance": "待人工验收", "passed": "登记为已通过", "not_required": "本次不需要"}.get(value, value or "未登记")


def excluded_classroom_checks(root, record, design_roots, identity):
    if not isinstance(record, dict) or record.get('checks') != ['classroom_rehearsal', 'speaker_test']:
        return False
    if any(not value or record.get(key) != value for key, value in identity.items()):
        return False
    try:
        proof = local_path(root, record.get('evidence'))
        return (any(proof.is_relative_to(p) for p in design_roots) and proof.is_file()
                and bool(proof.read_text(encoding='utf-8').strip()) and sha256(proof) == record.get('evidence_sha256'))
    except (OSError, ValueError, LessonContextError):
        return False


def check_row(key, title, status, detail, action="", paths=()):
    return dict(id=key, title=title, status=status, detail=detail, action=action, paths=list(paths))


def online_versions(root: Path, context, offering: str) -> list[tuple[Path, dict]]:
    """Discover scoped online versions; a historical record never authorizes another term."""
    directory = _safe_project_path(context.design_root, "approvals")
    if not directory.is_dir():
        return []
    found = []
    for path in sorted(directory.rglob("*.json")):
        try:
            safe = local_path(root, path.relative_to(root).as_posix())
            data = read_object(safe)
        except (OSError, ValueError, LessonContextError) as error:
            found.append((path, {"_read_error": str(error)}))
            continue
        if data.get("artifact_scope") == "online" and data.get("offering_id") == offering:
            found.append((safe, data))
    return found


def online_checks(root: Path, context, offering: str, records: list[tuple[Path, dict]]) -> list[dict]:
    """Report approval and actual PPTX separately; no build or release is inferred."""
    checks = []
    authority_path = _safe_project_path(context.authority_root, "lesson-manifest.json")
    try:
        authority = read_object(authority_path) if authority_path.is_file() else {}
        releases = authority.get("online_pptx_releases", {})
        versions = (authority.get("authority") or {}).get("online_pptx", {})
        if not isinstance(releases, dict) or not isinstance(versions, dict):
            raise ValueError("线上发布登记格式错误")
        release_error = None
    except (OSError, ValueError, AttributeError) as error:
        releases, versions, release_error = {}, {}, str(error)
    seen = {}
    for path, data in records:
        if data.get("_read_error"):
            continue
        identity = str(data.get("artifact_id"))
        seen[identity] = seen.get(identity, 0) + 1
    for path, data in records:
        if data.get("_read_error"):
            checks.append(check_row("online:unscoped:" + path.relative_to(root).as_posix(), "线上批准记录待核实", "unknown",
                "一份批准记录无法读取，无法判断它属于哪个学期或版本。", "核对记录后再确定其适用范围。"))
            checks[-1]["reasons"] = [data["_read_error"]]
            continue
        artifact_id, class_scope = data.get("artifact_id"), data.get("class_scope")
        record_path = path.relative_to(root).as_posix()
        label = f"{artifact_id or '未命名版本'} · {class_scope or '未登记班级'}"
        row_id = f"online:{record_path}"
        def release_row():
            title = f"线上交付 · {label}"
            if release_error:
                return check_row(row_id + ":release", title, "unknown", "线上发布登记无法读取。", release_error)
            matches = []
            for release_id, pointer in releases.items():
                if not isinstance(pointer, dict) or pointer.get("offering_id") != offering:
                    continue
                digest = pointer.get("candidate_sha256")
                if not isinstance(digest, str):
                    continue
                version = versions.get(digest) or {}
                payload = version.get("candidate_payload", {}) if isinstance(version, dict) else {}
                if not isinstance(payload, dict):
                    continue
                if all(payload.get(k) == v for k, v in {"lesson_key": context.lesson_key, "offering_id": offering,
                        "artifact_id": artifact_id, "class_scope": class_scope, "approval_record": record_path}.items()):
                    matches.append(release_id)
            if not matches:
                return check_row(row_id + ":release", title, "unknown", "未找到此版本的正式交付记录；批准或成品不代表已交付。")
            try:
                if online_ppt_release.ROOT != root:
                    raise ValueError("发布验证工具的项目根目录不一致")
                results = [online_ppt_release.verify(context.lesson_key, offering, rid) for rid in matches]
                if any(item.get("status") != "verified" for item in results):
                    raise ValueError("发布验证未通过")
                return check_row(row_id + ":release", title, "checked", "已核对本版本正式交付文件及哈希；不代表 PowerPoint 实播验收。", paths=[f'{item["path"]}/{context.lesson_id}-在线预习.zip' for item in results])
            except (OSError, ValueError, KeyError, TypeError, AttributeError, LessonContextError, zipfile.BadZipFile, EOFError) as error:
                return check_row(row_id + ":release", title, "pending", "本版本交付记录存在，但文件或登记验证失败。", str(error))
        if not isinstance(artifact_id, str) or not artifact_id or not isinstance(class_scope, str) or not class_scope.strip():
            result = {"status": "blocked", "blockers": ["版本或班级标识缺失或无效。"]}
        else:
            result = check_content_approval(context.lesson_key, offering, record_path, "online", artifact_id, class_scope)
        ambiguous = seen[str(artifact_id)] > 1
        ok = result.get("status") == "ready" and not ambiguous
        approval = check_row(row_id + ":content", f"线上预习内容 · {label}", "checked" if ok else "pending",
            "本学期、本班级和本版本的内容批准与输入一致；尚不能推定成品或发布。" if ok else "本版本批准缺失、冲突或不适用于当前输入。",
            "" if ok else "检查本版本的批准记录、班级及输入文件。", [record_path])
        if not ok:
            approval["reasons"] = (["同一学期的版本标识有多条批准记录，成品目录可能冲突。"] if ambiguous else result.get("blockers", []))
        checks.append(approval)
        try:
            if not isinstance(artifact_id, str) or not isinstance(class_scope, str) or not artifact_id or not class_scope:
                raise ValueError("版本或班级标识缺失")
            base = local_path(root, (context.design_root / "pptx-draft/online" / offering / artifact_id).relative_to(root).as_posix())
            if not base.is_relative_to(context.design_root / "pptx-draft/online"):
                raise ValueError("线上版本目录不属于本课")
            build_path = local_path(root, (base / "build-manifest.json").relative_to(root).as_posix())
            if not build_path.is_file():
                checks.append(check_row(row_id + ":build", f"线上 PPT 成品 · {label}", "unknown",
                    "尚未登记本版本的成品；内容批准不表示 PPT 已制作或交付。", "制作后登记本版本的成品及哈希。"))
                checks.append(release_row())
                continue
            build = read_object(build_path)
            if any(build.get(k) != v for k, v in {"lesson_key": context.lesson_key, "offering_id": offering,
                   "artifact_id": artifact_id, "class_scope": class_scope, "approval_record": record_path}.items()):
                raise ValueError("成品 manifest 的课次、学期、版本、班级或批准记录不一致")
            if type(build.get("slides")) is not int or build["slides"] <= 0:
                raise ValueError("成品页数缺失或无效")
            pptx = build.get("pptx")
            if not isinstance(pptx, dict):
                raise ValueError("PPT 文件登记缺失")
            file = local_path(root, pptx.get("path"))
            if not file.is_relative_to(base) or file.suffix.lower() != ".pptx":
                raise ValueError("PPT 文件不在本版本目录")
            expected = pptx.get("sha256")
            current = isinstance(expected, str) and len(expected) == 64 and file.is_file() and sha256(file) == expected
            checks.append(check_row(row_id + ":build", f"线上 PPT 成品 · {label}", "checked" if current else "pending",
                f"成品登记 {build['slides']} 页，文件哈希一致；此检查不代表视觉验收或交付。" if current else "成品文件缺失或哈希不一致。",
                "" if current else "检查文件并重新核对成品版本。", [build_path.relative_to(root).as_posix()] + ([file.relative_to(root).as_posix()] if file.is_file() else [])))
        except (OSError, ValueError, TypeError, AttributeError, LessonContextError) as error:
            checks.append(check_row(row_id + ":build", f"线上 PPT 成品 · {label}", "unknown", "成品记录无法完整核对。", str(error)))
        checks.append(release_row())
    return checks


def lesson_readiness(root: Path, entry: dict, book: dict, workspace: dict, offering: str) -> dict:
    key = entry["lesson_key"]
    result = dict(lesson_key=key, textbook_id=entry["textbook_id"], offering_id=offering,
                  number=entry["lesson_number"], title=entry["title"], checks=[], materials=[])
    checks = result["checks"]
    context = resolve_lesson_context(root, key, offering)
    scoped_online = online_versions(root, context, offering)
    current_online = (entry.get('current_online_artifacts') or {}).get(offering, {})
    if not isinstance(current_online, dict):
        raise ValueError('当前线上版本必须按学期和班级登记')
    for cohort, target in current_online.items():
        matching = [(p, d) for p, d in scoped_online if d.get('class_scope') == cohort and d.get('artifact_id') == target]
        if not isinstance(target, str) or not target or len(matching) != 1:
            checks.append(check_row('online-current:' + str(cohort), '当前线上版本', 'pending',
                '当前版本指向缺失或有冲突；保留全部版本供核对。', '修正课次索引中的当前版本。'))
            continue
        kept = []
        for path, data in scoped_online:
            if data.get('class_scope') == cohort and data.get('artifact_id') != target:
                checks.append(check_row('prior-online:' + path.relative_to(root).as_posix(),
                    '旧线上版本 · ' + str(data.get('artifact_id')), 'not_current',
                    f'已由 {target} 替代；文件和原批准记录保留，不计入当前准备待办。',
                    paths=[path.relative_to(root).as_posix()]))
            else:
                kept.append((path, data))
        scoped_online = kept
    scoped_decks = [deck for deck in workspace.get("html_decks", [])
                    if deck.get("offering_id") == offering and key in deck.get("lesson_keys", [])
                    and isinstance(deck.get("approval_records"), dict)]
    completion = book.get("completion_record") or {}
    # shortcut: unscoped completion records predate offerings and belong to 2026-fall; upgrade when migrated with evidence.
    if completion.get("status") == "completed_by_adam" and completion.get("offering_id", "2026-fall") == offering:
        evidence = local_path(root, completion.get("evidence"))
        if evidence.is_file():
            checks.append(check_row("completion", "已确认完成", "historical",
                f"{completion.get('confirmed_by', 'Adam')} 于 {completion.get('confirmed_at', '已登记日期')} 确认完成。保留该决定，不重新建立历史待办；本页未重新检查成品。",
                paths=[evidence.relative_to(root).as_posix()]))
            if not scoped_online and not scoped_decks:
                result.update(status="historical", pending_count=0)
                return result
    source = local_path(root, (context.source_root / "source-manifest.json").relative_to(root).as_posix())
    if entry.get("source_manifest"):
        source = local_path(root, entry["source_manifest"])
        if not source.is_relative_to(context.source_root):
            raise ValueError("来源 manifest 不属于本课")
    try:
        source_data = read_object(source)
        source_status = source_data.get("source_status", "未登记")
        verified = source_status in {"verified", "approved"} and source_data.get("source_qa_status") == "passed"
        checks.append(check_row("source", "教材来源", "recorded" if verified else "pending",
            f"来源包已找到，登记状态：{source_status}。本页未重新核对教材原页。",
            "" if verified else "核对本课教材页、练习与音轨，再记录来源核对结果。",
            [source.relative_to(root).as_posix()]))
    except (OSError, ValueError) as error:
        checks.append(check_row("source", "教材来源", "unknown", "来源包缺失或无法读取。",
            "补齐或修正本课来源 manifest，再核对教材页、练习与音轨。",
            [source.relative_to(root).as_posix()] if source.is_file() else []))
        checks[-1]["reasons"] = [str(error)]
    checks.extend(online_checks(root, context, offering, scoped_online))
    for deck in scoped_decks:
        record = deck["approval_records"].get(key)
        approval_result = check_content_approval(key, offering, record, "classroom", deck.get("id"), deck.get("class_scope"))
        ready = approval_result.get("status") == "ready"
        checks.append(check_row("content:" + str(deck.get("id")), "实体课版本内容批准", "checked" if ready else "pending",
            "此班级和课件版本的批准与输入一致。" if ready else "此课件版本的批准缺失或不适用于当前输入。",
            "" if ready else "核对本版本的批准、来源和审阅稿。", [record] if record else []))
        if not ready:
            checks[-1]["reasons"] = approval_result.get("blockers", [])
    approval = check_content_approval(key, offering)
    approval_path = local_path(root, (context.design_root / "storyboard" / f"{context.lesson_id}-content-approval.json").relative_to(root).as_posix())
    approved = approval.get("status") == "ready"
    legacy_offering = None
    if approval_path.is_file():
        try:
            legacy_offering = read_object(approval_path).get("offering_id")
        except (OSError, ValueError):
            pass
    if scoped_online or scoped_decks or (legacy_offering and legacy_offering != offering):
        if approval_path.is_file():
            checks.append(check_row("content", "历史课次批准记录", "historical",
                "旧课次批准保留作历史记录，不用于判断本学期的新版本。", paths=[approval_path.relative_to(root).as_posix()]))
    else:
        checks.append(check_row("content", "逐页内容批准", "checked" if approved else "pending",
            "历史课次批准记录与其输入文件一致，不代表批准新版本。" if approved else "尚无可用的历史课次批准记录；新版本按各自记录核对。",
            "" if approved else "先检查批准记录及其绑定文件；内容有改动时提交新版本审核。",
            [approval_path.relative_to(root).as_posix()] if approval_path.is_file() else []))
        if not approved:
            checks[-1]["reasons"] = approval.get("blockers", [])

    authority = {}
    authority_scope = None
    authority_path = entry.get("authority_manifest")
    if authority_path:
        try:
            path = local_path(root, authority_path)
            if not path.is_relative_to(context.authority_root):
                raise ValueError("权威 manifest 不属于本课")
            authority = read_object(path)
            authority_key = authority.get("lesson_key") or f"{authority.get('textbook_id', authority.get('course_id', ''))}:{authority.get('lesson_id', '')}"
            if authority_key != key:
                raise ValueError("权威 manifest 的课次身份不一致")
            authority_scope = authority.get("offering_id")
            version_offerings = {}
            versions = (authority.get("authority") or {}).get("classroom_html") or {}
            if isinstance(versions, dict):
                for version in versions.values():
                    if isinstance(version, dict):
                        for item in version.get("files", []):
                            if isinstance(item, dict) and item.get("path"):
                                version_offerings[item["path"]] = version.get("offering_id")
            for item in authority.get("files", []):
                path = local_path(root, item.get("path"))
                if not path.is_relative_to(context.authority_root):
                    raise ValueError("权威文件不属于本课")
                scoped_offering = item.get("offering_id") or version_offerings.get(item["path"]) or authority_scope
                same_term = scoped_offering == offering
                current = same_term and path.is_file() and bool(item.get("sha256")) and sha256(path) == item["sha256"]
                result["materials"].append(dict(label=path.name if same_term else path.name + "（历史或学期待核实）", path=item["path"], kind="authority", current=current, offering_match=same_term))
        except (OSError, ValueError, TypeError, AttributeError, LessonContextError) as error:
            checks.append(check_row("authority", "权威文件登记", "unknown", "文件登记无法完整核对。", str(error)))
            authority = {}

    for deck in workspace.get("html_decks", []):
        if key not in deck.get("lesson_keys", [deck.get("lesson_key")]) or deck.get("offering_id") != offering:
            continue
        path = local_path(root, deck.get("source"))
        design_roots = [resolve_lesson_context(root, linked_key, offering).design_root
                        for linked_key in deck.get("lesson_keys", [key])]
        if not any(path.is_relative_to(design) for design in design_roots):
            raise ValueError("HTML 文件不属于登记的课次设计目录")
        current = False
        manifest = {}
        manifest_path = (deck.get("visual_check") or {}).get("draft_manifest")
        try:
            if manifest_path:
                manifest_file = local_path(root, manifest_path)
                if not any(manifest_file.is_relative_to(design) for design in design_roots):
                    raise ValueError("HTML manifest 不属于登记的课次设计目录")
                manifest = read_object(manifest_file)
                if key not in manifest.get("lesson_keys", []) or manifest.get("offering_id") != offering:
                    raise ValueError("HTML 草稿登记的课次或学期不一致")
                current = path.is_file() and bool(manifest.get("entry_sha256")) and sha256(path) == manifest["entry_sha256"]
            result["materials"].append(dict(label=deck.get("title") or path.name, path=deck["source"], kind="html_draft", current=current))
            teacher = manifest.get("teacher_guide") or {}
            if teacher.get("path"):
                teacher_path = Path(os.path.normpath(local_path(root, manifest_path).parent / teacher["path"]))
                teacher_path = local_path(root, teacher_path.relative_to(root).as_posix())
                if not any(teacher_path.is_relative_to(design) for design in design_roots):
                    raise ValueError("教师材料不属于本课或登记的联合课次")
                teacher_current = teacher_path.is_file() and bool(teacher.get("sha256")) and sha256(teacher_path) == teacher["sha256"]
                result["materials"].append(dict(label="教师用稿", path=teacher_path.relative_to(root).as_posix(), kind="teacher_draft", current=teacher_current))
        except (OSError, ValueError, TypeError, AttributeError, LessonContextError) as error:
            checks.append(check_row("html-record", "HTML 草稿登记", "unknown", "草稿记录无法完整核对。", str(error)))
        gates = manifest.get("human_gates") or {}
        gates = gates if isinstance(gates, dict) else {}
        check_scope = {'offering_id': offering, 'deck_id': deck.get('id'), 'class_scope': deck.get('class_scope')}
        if current and excluded_classroom_checks(root, manifest.get('classroom_checks_exclusion'), design_roots, check_scope):
            checks.append(check_row('classroom', '试教与音响测试', 'not_required',
                'Adam已明确本次不需要试教或音响测试；不计入待准备事项，也不登记为测试通过。',
                paths=[manifest_path]))
            continue
        pending = not deck.get("approval_records") and any(gates.get(field) == "pending" for field in ("teacher_media_playback", "classroom_rehearsal"))
        # shortcut: legacy human gates lack artifact-bound evidence; verify completion when that schema is adopted.
        checks.append(check_row("classroom", "教师播放与试教", "pending" if pending else "unknown",
            f"登记的播放状态：{human_label(gates.get('teacher_media_playback'))}；试教状态：{human_label(gates.get('classroom_rehearsal'))}。"
            + ("草稿文件与登记哈希一致。" if current else "草稿版本尚未核对一致。"),
            "如本次要求播放或试教，按当前版本记录实际结果。" if pending else "未要求的播放或试教不视为通过；已有记录须核对适用版本。",
            [manifest_path] if manifest_path else []))
    if not any(check["id"] == "classroom" for check in checks):
        qa = authority.get("qa") if authority_scope == offering else {}
        rehearsal = qa.get("rehearsal") if isinstance(qa, dict) else {}
        rehearsal = rehearsal if isinstance(rehearsal, dict) else {}
        pending = any(rehearsal.get(field) in {"pending", "pending_manual_acceptance"} for field in ("audio_playback_status", "status"))
        checks.append(check_row("classroom", "教师播放与试教", "pending" if pending else "unknown",
            f"登记的播放状态：{human_label(rehearsal.get('audio_playback_status'))}；试教状态：{human_label(rehearsal.get('status'))}。本页未验证对应的人工证据。",
            "确认本次使用材料后，核对已有播放与试教记录；缺少记录不表示教师尚未完成。"))
    materials = [item for item in result["materials"] if item.get("offering_match", True)]
    current = bool(materials) and all(item["current"] for item in materials)
    checks.insert(2, check_row("materials", "上课材料", "checked" if current else "pending",
        f"已登记 {len(materials)} 份材料，其中 {sum(item['current'] for item in materials)} 份与文件哈希一致。HTML 与教师用稿仍按草稿显示。",
        "" if current else "登记本次使用的材料；文件缺失、已变更或没有哈希时重新核对。"))
    result.update(status="needs_attention", pending_count=sum(check["status"] in {"pending", "unknown"} for check in checks))
    return result


def build_readiness(root: Path) -> Path:
    root = root.resolve()
    registry_path = root / "course/lesson-registry.json"
    errors = validate_lesson_identity(registry_path, root / "project.config.json")
    if errors:
        raise ValueError("课次身份核对失败：" + "；".join(errors))
    registry = read_object(registry_path)
    books = {book["textbook_id"]: book for book in registry["textbooks"]}
    workspace_errors = []
    try:
        workspace = read_object(root / "course/open-slide-workspace.json")
        if not isinstance(workspace.get("html_decks"), list):
            raise ValueError("html_decks 必须是清单")
    except (OSError, ValueError) as error:
        workspace = {}
        workspace_errors.append(f"无法读取 HTML 工作区登记：{error}")
    rows = []
    for entry in registry["lessons"]:
        for offering in entry.get("offering_ids", []):
            try:
                rows.append(lesson_readiness(root, entry, books[entry["textbook_id"]], workspace, offering))
            except (OSError, ValueError, TypeError, AttributeError, KeyError, LessonContextError) as error:
                rows.append(dict(lesson_key=entry["lesson_key"], textbook_id=entry["textbook_id"],
                    offering_id=offering, number=entry["lesson_number"], title=entry["title"],
                    status="unknown", pending_count=1, materials=[], checks=[check_row("record", "课次资料", "unknown", "记录无法完整读取。", str(error))]))
    payload = dict(generated_at=datetime.now(timezone.utc).isoformat(), textbooks=registry["textbooks"], lessons=rows,
                   errors=workspace_errors, source="course/lesson-registry.json")
    output = local_path(root, "dashboard/readiness.js")
    output.write_text("window.LESSON_READINESS = " + json.dumps(payload, ensure_ascii=False, indent=2) + ";\n", encoding="utf-8")
    return output
