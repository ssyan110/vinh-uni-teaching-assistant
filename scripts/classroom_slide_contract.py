"""Validate a classroom HTML deck against a hash-bound reviewed-copy mapping.

The contract maps reviewed source text to page roles for technical checking; it
does not create approval or supersede the human-reviewed sources. This module
intentionally contains no course- or lesson-specific content.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path
from typing import Any, Iterable


_VOID_TAGS = {
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
    "meta", "param", "source", "track", "wbr",
}
_TEXTLESS_TAGS = {"script", "style", "template"}
_SUPPORTED_ROLES = {
    "cover", "route", "activity", "report", "comic", "discussion_question",
    "discussion_support",
}
_ROUTE_STYLE_SELECTORS = (
    ".route",
    ".route>h1",
    ".route .route-card",
    ".route .route-card .route-icon",
    ".route .route-card h2",
    ".route .route-range",
)


@dataclass
class Element:
    tag: str
    attrs: dict[str, str]
    children: list["Element | str"] = field(default_factory=list)

    def classes(self) -> set[str]:
        return set(self.attrs.get("class", "").split())


class _DeckParser(HTMLParser):
    """Small ordered DOM sufficient for authored classroom HTML."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.root = Element("_document", {})
        self.stack: list[Element] = [self.root]
        self.pages: list[Element] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        element = Element(tag.lower(), {key.lower(): value or "" for key, value in attrs})
        self.stack[-1].children.append(element)
        if "os-page" in element.classes():
            self.pages.append(element)
        if tag.lower() not in _VOID_TAGS:
            self.stack.append(element)

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)
        if tag.lower() not in _VOID_TAGS:
            self.handle_endtag(tag)

    def handle_endtag(self, tag: str) -> None:
        target = tag.lower()
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == target:
                del self.stack[index:]
                return

    def handle_data(self, data: str) -> None:
        self.stack[-1].children.append(data)


def _walk(node: Element) -> Iterable[Element]:
    yield node
    for child in node.children:
        if isinstance(child, Element):
            yield from _walk(child)


def _text_parts(node: Element) -> list[str]:
    if node.tag in _TEXTLESS_TAGS:
        return []
    parts: list[str] = []
    for child in node.children:
        if isinstance(child, str):
            if child.strip():
                parts.append(" ".join(child.split()))
        else:
            parts.extend(_text_parts(child))
    return parts


def normalize_text(value: str) -> str:
    """Ignore layout whitespace while preserving all visible characters/order."""
    return "".join(value.split())


def _page_text(page: Element) -> str:
    return normalize_text(" ".join(_text_parts(page)))


def _find(node: Element, predicate) -> list[Element]:
    return [element for element in _walk(node) if predicate(element)]


def _has_class(node: Element, class_name: str) -> bool:
    return class_name in node.classes()


def _load_tree(path: Path) -> tuple[str, _DeckParser]:
    raw = path.read_text(encoding="utf-8")
    parser = _DeckParser()
    parser.feed(raw)
    parser.close()
    return raw, parser


def _resolved_under_root(path_text: str, project_root: Path, label: str, errors: list[str]) -> Path | None:
    root = project_root.resolve()
    candidate = Path(path_text)
    if not candidate.is_absolute():
        candidate = root / candidate
    try:
        resolved = candidate.resolve(strict=True)
        resolved.relative_to(root)
    except FileNotFoundError:
        errors.append(f"{label}: file not found: {path_text}")
        return None
    except ValueError:
        errors.append(f"{label}: path escapes project root: {path_text}")
        return None
    return resolved


def _check_hash_bound_file(
    record: dict[str, Any], project_root: Path, label: str, errors: list[str]
) -> Path | None:
    path_text = record.get("path")
    expected_hash = record.get("sha256")
    if not isinstance(path_text, str) or not path_text:
        errors.append(f"{label}: missing path")
        return None
    if not isinstance(expected_hash, str) or not re.fullmatch(r"[0-9a-fA-F]{64}", expected_hash):
        errors.append(f"{label}: missing or invalid SHA-256")
        return None
    path = _resolved_under_root(path_text, project_root, label, errors)
    if path is None:
        return None
    actual_hash = hashlib.sha256(path.read_bytes()).hexdigest()
    if actual_hash.lower() != expected_hash.lower():
        errors.append(f"{label}: SHA-256 mismatch for {path_text}")
    return path


def _class_elements(node: Element, class_name: str) -> list[Element]:
    return _find(node, lambda item: _has_class(item, class_name))


def _one_role_node(page: Element, class_name: str, page_id: str, errors: list[str]) -> Element | None:
    found = _class_elements(page, class_name)
    if len(found) != 1:
        errors.append(f"page {page_id}: expected exactly one .{class_name} element, found {len(found)}")
        return None
    return found[0]


def _validate_role(page: Element, spec: dict[str, Any], errors: list[str]) -> None:
    page_id = str(spec.get("id", "<unknown>"))
    role = spec.get("role")
    required = spec.get('required_classes', [])
    if not isinstance(required, list) or any(not isinstance(x, str) or not re.fullmatch(r'[a-zA-Z][a-zA-Z0-9_-]*', x) for x in required):
        errors.append(f'page {page_id}: invalid required activity structure')
    else:
        for name in required:
            if not _class_elements(page, name):
                errors.append(f'page {page_id}: missing required reference structure .{name}')
    if role not in _SUPPORTED_ROLES:
        errors.append(f"page {page_id}: unsupported role {role!r}")
        return
    if role == "cover":
        if not _find(page, lambda item: item.tag == "h1"):
            errors.append(f"page {page_id}: cover role requires a main heading")
        if not _find(page, lambda item: item.tag == "img"):
            errors.append(f"page {page_id}: cover role requires an image")
    elif role == "route":
        route = _one_role_node(page, "route", page_id, errors)
        if route is not None:
            if not _find(route, lambda item: item.tag == "h1"):
                errors.append(f"page {page_id}: route role requires a heading")
            cards = _class_elements(route, "route-card")
            if not cards:
                errors.append(f"page {page_id}: route role requires at least one route card")
            expected_cards = spec.get("expected_route_cards")
            if type(expected_cards) is not int or expected_cards < 1:
                errors.append(f"page {page_id}: route role requires a positive expected_route_cards value")
            elif len(cards) != expected_cards:
                errors.append(f"page {page_id}: expected {expected_cards} route cards, found {len(cards)}")
            expected_columns = spec.get("expected_route_columns")
            if type(expected_columns) is not int or expected_columns < 1:
                errors.append(f"page {page_id}: route role requires a positive expected_route_columns value")
            else:
                grid = _first_descendant(
                    route,
                    lambda item: _css_style(item).get("display") == "grid"
                    and "grid-template-columns" in _css_style(item),
                )
                columns_value = _css_style(grid).get("grid-template-columns", "") if grid else ""
                match = re.fullmatch(r"repeat\((\d+),1fr\)", columns_value)
                if not match:
                    errors.append(f"page {page_id}: route grid must declare grid-template-columns as repeat(n,1fr)")
                elif int(match.group(1)) != expected_columns:
                    errors.append(
                        f"page {page_id}: expected {expected_columns} route columns, "
                        f"found {match.group(1)}"
                    )
            for index, card in enumerate(cards, 1):
                if len(_find(card, lambda item: item.tag == "img" and "route-icon" in item.classes())) != 1:
                    errors.append(f"page {page_id}: route card {index} must have exactly one .route-icon image")
                if len(_find(card, lambda item: item.tag == "h2")) != 1:
                    errors.append(f"page {page_id}: route card {index} must have exactly one heading")
                if len(_find(card, lambda item: _has_class(item, "route-range"))) != 1:
                    errors.append(f"page {page_id}: route card {index} must have exactly one .route-range")
    elif role == "comic":
        comic = _one_role_node(page, "comic", page_id, errors)
        if comic is not None:
            images = _find(comic, lambda item: item.tag == "img")
            if len(images) != 1:
                errors.append(f"page {page_id}: comic role requires exactly one image, found {len(images)}")
            if _page_text(comic):
                errors.append(f"page {page_id}: comic image area must not contain text overlays")
            non_image_elements = [item for item in _walk(comic) if item is not comic and item.tag != "img"]
            if non_image_elements:
                errors.append(f"page {page_id}: comic image area contains non-image overlay elements")
    elif role == "discussion_question":
        if not _has_class(page, "question-page"):
            errors.append(f"page {page_id}: discussion_question role requires .question-page")
        questions = _class_elements(page, "question")
        if len(questions) != 1:
            errors.append(f"page {page_id}: discussion_question role requires exactly one .question element")
        if _class_elements(page, "levels") or _class_elements(page, "level"):
            errors.append(f"page {page_id}: question page must not contain level support")
    elif role == "discussion_support":
        if not _has_class(page, "support-page"):
            errors.append(f"page {page_id}: discussion_support role requires .support-page")
        levels = _class_elements(page, "level")
        if len(levels) != 2:
            errors.append(f"page {page_id}: discussion_support role requires exactly two level cards, found {len(levels)}")
        labels = spec.get("level_labels", [])
        headings = [normalize_text(" ".join(_text_parts(node))) for node in _find(page, lambda item: item.tag == "h2")]
        for label in labels:
            if not any(normalize_text(str(label)) in heading for heading in headings):
                errors.append(f"page {page_id}: missing required support level {label!r}")
    elif role in {"activity", "report"}:
        if not _has_class(page, "activity"):
            errors.append(f"page {page_id}: {role} role requires .activity page styling")


def _css_style(node: Element) -> dict[str, str]:
    return _parse_style(node.attrs.get("style", ""))


def _parse_style(raw: str) -> dict[str, str]:
    result: dict[str, str] = {}
    for declaration in raw.split(";"):
        if ":" not in declaration:
            continue
        key, value = declaration.split(":", 1)
        key = key.strip().lower()
        if key:
            result[key] = _normalize_css_value(value)
    return result


def _normalize_css_value(value: str) -> str:
    value = re.sub(r"\s+", "", value).lower()
    value = re.sub(r"(?<![0-9_.-])0(?:px|em|rem|%)", "0", value)
    return re.sub(r"(?<![0-9])\.(?=\d)", "0.", value)


def _compare_style(
    reference: Element | None,
    candidate: Element | None,
    label: str,
    properties: Iterable[str],
    errors: list[str],
) -> None:
    if reference is None or candidate is None:
        errors.append(f"reference style comparison: missing {label} element")
        return
    ref_style = _css_style(reference)
    deck_style = _css_style(candidate)
    for property_name in properties:
        ref_value = ref_style.get(property_name)
        candidate_value = deck_style.get(property_name)
        if ref_value is None:
            continue
        elif candidate_value != ref_value:
            errors.append(
                f"reference style comparison: {label} {property_name} differs "
                f"(expected {ref_value!r}, got {candidate_value!r})"
            )


def _first_descendant(node: Element, predicate) -> Element | None:
    return next((item for item in _walk(node) if item is not node and predicate(item)), None)


def _cover_parts(page: Element) -> dict[str, Element | None]:
    wrapper = _first_descendant(
        page,
        lambda item: item.tag == "div" and "width" in _css_style(item) and "height" in _css_style(item),
    )
    if wrapper is None:
        return {key: None for key in ("wrapper", "top_label", "grid", "text_panel", "title", "rule", "subtitle", "image_panel", "image", "footer")}
    grid = _first_descendant(
        wrapper,
        lambda item: item.tag == "div" and "display" in _css_style(item)
        and "grid-template-columns" in _css_style(item),
    )
    grid_children = [child for child in grid.children if isinstance(child, Element)] if grid else []
    text_panel = grid_children[0] if len(grid_children) > 0 else None
    image_panel = grid_children[1] if len(grid_children) > 1 else None
    title = _first_descendant(text_panel, lambda item: item.tag == "h1") if text_panel else None
    subtitle = _first_descendant(text_panel, lambda item: item.tag == "p") if text_panel else None
    title_index = next((i for i, child in enumerate(text_panel.children) if child is title), -1) if text_panel else -1
    rule = None
    if text_panel and title_index >= 0:
        rule = next(
            (child for child in text_panel.children[title_index + 1:] if isinstance(child, Element) and child.tag == "div"),
            None,
        )
    top_label = next(
        (child for child in wrapper.children if isinstance(child, Element) and "top" in _css_style(child)),
        None,
    )
    footer = next(
        (child for child in wrapper.children if isinstance(child, Element) and "bottom" in _css_style(child)),
        None,
    )
    image = _first_descendant(image_panel, lambda item: item.tag == "img") if image_panel else None
    return {
        "wrapper": wrapper,
        "top_label": top_label,
        "grid": grid,
        "text_panel": text_panel,
        "title": title,
        "rule": rule,
        "subtitle": subtitle,
        "image_panel": image_panel,
        "image": image,
        "footer": footer,
    }


def _compare_cover(reference_page: Element, deck_page: Element, errors: list[str]) -> None:
    ref = _cover_parts(reference_page)
    candidate = _cover_parts(deck_page)
    pairs = (
        # Keep geometry and visual roles identical, while allowing the current
        # project typography rule (Times New Roman first for Latin glyphs) to
        # supersede older cover fallback ordering.
        ("wrapper", ("width", "height", "box-sizing", "padding", "background", "color", "position", "overflow")),
        ("top_label", ("position", "top", "left", "color", "font-size", "font-weight", "letter-spacing")),
        ("grid", ("height", "display", "grid-template-columns", "align-items", "gap")),
        ("text_panel", ("padding-bottom",)),
        ("title", ("margin", "font-size", "line-height", "letter-spacing", "font-weight")),
        ("rule", ("margin-top", "width", "height", "border-radius", "background")),
        ("subtitle", ("margin", "max-width", "font-size", "line-height", "color")),
        ("image_panel", ("height", "display", "place-items", "align-items", "justify-content", "border-left", "padding-left")),
        ("image", ("width", "height", "max-width", "object-fit")),
        ("footer", ("position", "bottom", "left", "right", "display", "justify-content", "color", "font-size")),
    )
    for name, properties in pairs:
        _compare_style(ref.get(name), candidate.get(name), f"cover {name}", properties, errors)


def _style_tag_rules(raw_html: str) -> dict[str, dict[str, str]]:
    rules: dict[str, dict[str, str]] = {}
    for style_content in re.findall(r"<style\b[^>]*>(.*?)</style\s*>", raw_html, flags=re.I | re.S):
        for selector_text, body in re.findall(r"([^{}]+)\{([^{}]*)\}", style_content):
            parsed = _parse_style(body)
            for selector in selector_text.split(","):
                key = re.sub(r"\s*([>+~])\s*", r"\1", " ".join(selector.split())).lower()
                if key in _ROUTE_STYLE_SELECTORS:
                    rules[key] = parsed
    return rules


def _route_parts(page: Element) -> tuple[Element | None, Element | None, Element | None, list[Element]]:
    route = next((item for item in _walk(page) if item is not page and _has_class(item, "route")), None)
    if route is None:
        return None, None, None, []
    title = _first_descendant(route, lambda item: item.tag == "h1")
    grid = _first_descendant(
        route,
        lambda item: "display" in _css_style(item) and _css_style(item).get("display") == "grid"
        and "grid-template-columns" in _css_style(item),
    )
    cards = _class_elements(route, "route-card")
    return route, title, grid, cards


def _route_card_signature(card: Element) -> tuple[Any, ...]:
    children = [child for child in card.children if isinstance(child, Element)]
    style = _css_style(card)
    return (
        card.tag,
        tuple(sorted(card.classes())),
        tuple(sorted(style.items())),
        tuple((child.tag, tuple(sorted(child.classes()))) for child in children),
    )


def _compare_route(reference_raw: str, reference_page: Element, deck_raw: str, deck_page: Element, errors: list[str]) -> None:
    ref_route, ref_title, ref_grid, ref_cards = _route_parts(reference_page)
    deck_route, deck_title, deck_grid, deck_cards = _route_parts(deck_page)
    if not ref_route or not deck_route:
        errors.append("route reference comparison: .route section missing in reference or deck")
        return
    if not ref_title or not deck_title:
        errors.append("route reference comparison: route heading missing in reference or deck")
    if not ref_grid or not deck_grid:
        errors.append("route reference comparison: route card grid missing in reference or deck")
    for node_name, ref_node, deck_node, props in (
        ("route section", ref_route, deck_route, ("width", "height", "box-sizing", "padding", "background", "color", "font-family")),
        ("route heading", ref_title, deck_title, ("font-size", "margin")),
        ("route grid", ref_grid, deck_grid, ("display", "gap")),
    ):
        _compare_style(ref_node, deck_node, node_name, props, errors)
    if not ref_cards or not deck_cards:
        errors.append("route reference comparison: route cards missing in reference or deck")
    else:
        reference_card = ref_cards[0]
        reference_signature = _route_card_signature(reference_card)
        for index, card in enumerate(deck_cards, 1):
            if _route_card_signature(card) != reference_signature:
                errors.append(f"route reference comparison: route card {index} DOM or inline style differs from reference")
            if len(_find(card, lambda item: item.tag == "img" and "route-icon" in item.classes())) != 1:
                errors.append(f"route reference comparison: route card {index} must have one .route-icon")
            if len(_find(card, lambda item: item.tag == "h2")) != 1 or len(_find(card, lambda item: _has_class(item, "route-range"))) != 1:
                errors.append(f"route reference comparison: route card {index} is missing a heading or range line")
    reference_rules = _style_tag_rules(reference_raw)
    deck_rules = _style_tag_rules(deck_raw)
    for selector in _ROUTE_STYLE_SELECTORS:
        expected = reference_rules.get(selector)
        actual = deck_rules.get(selector)
        if expected is None:
            errors.append(f"route reference comparison: reference lacks CSS rule {selector}")
        elif actual != expected:
            errors.append(f"route reference comparison: CSS rule {selector} differs from reference")


def _validate_pairs(contract: dict[str, Any], page_specs: list[dict[str, Any]], actual_by_id: dict[str, Element], errors: list[str]) -> None:
    specs_by_id = {str(page.get("id")): page for page in page_specs}
    ordered_ids = [str(page.get("id")) for page in page_specs]
    for pair in contract.get("page_pairs", []):
        question_id = pair.get("question_id")
        support_id = pair.get("support_id")
        topic = pair.get("topic")
        question_spec = specs_by_id.get(str(question_id))
        support_spec = specs_by_id.get(str(support_id))
        if not question_spec or question_spec.get("role") != "discussion_question":
            errors.append(f"page pair {question_id!r}/{support_id!r}: question_id must point to a discussion_question page")
            continue
        if not support_spec or support_spec.get("role") != "discussion_support":
            errors.append(f"page pair {question_id!r}/{support_id!r}: support_id must point to a discussion_support page")
            continue
        if str(question_id) not in ordered_ids or str(support_id) not in ordered_ids:
            errors.append(f"page pair {question_id!r}/{support_id!r}: page is missing")
            continue
        if ordered_ids.index(str(support_id)) != ordered_ids.index(str(question_id)) + 1:
            errors.append(f"page pair {question_id!r}/{support_id!r}: support must immediately follow its question")
        if question_spec.get("pair_key") != support_spec.get("pair_key"):
            errors.append(f"page pair {question_id!r}/{support_id!r}: question and support pair_key values differ")
        if not isinstance(topic, str) or not topic:
            errors.append(f"page pair {question_id!r}/{support_id!r}: missing topic")
            continue
        for page_id in (str(question_id), str(support_id)):
            actual = actual_by_id.get(page_id)
            if actual is not None and normalize_text(topic) not in _page_text(actual):
                errors.append(f"page pair {question_id!r}/{support_id!r}: topic {topic!r} missing from page {page_id}")


def validate(deck_path: Path, contract_path: Path, project_root: Path) -> list[str]:
    """Return contract violations for a deck; an empty list means it conforms."""
    errors: list[str] = []
    root = project_root.resolve()
    deck = _resolved_under_root(str(deck_path), root, "deck", errors)
    contract_file = _resolved_under_root(str(contract_path), root, "contract", errors)
    if deck is None or contract_file is None:
        return errors
    try:
        contract = json.loads(contract_file.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return [f"contract: cannot read valid JSON: {exc}"]
    if not isinstance(contract, dict):
        return ["contract: root must be a JSON object"]
    if contract.get("schema_version") not in ("classroom-slide-contract-v1", "classroom-slide-contract-v2"):
        errors.append("contract: unsupported or missing schema_version")

    owner = contract.get("owner_lesson_key")
    lesson_keys = contract.get("lesson_keys")
    if not isinstance(owner, str) or not owner:
        errors.append("contract: owner_lesson_key is required")
    if not isinstance(contract.get("offering_id"), str) or not contract.get("offering_id"):
        errors.append("contract: offering_id is required")
    if not isinstance(lesson_keys, list) or not lesson_keys or any(not isinstance(item, str) for item in lesson_keys):
        errors.append("contract: lesson_keys must be a non-empty string list")
    elif owner not in lesson_keys:
        errors.append("contract: owner_lesson_key must be included in lesson_keys")

    source = contract.get("source_identity")
    if not isinstance(source, dict):
        errors.append("contract: source_identity is required")
    else:
        for field_name in ("textbook_id", "owner_lesson_key", "path", "sha256"):
            if not source.get(field_name):
                errors.append(f"contract: source_identity.{field_name} is required")
        if owner and source.get("owner_lesson_key") != owner:
            errors.append("contract: source_identity owner_lesson_key differs from owner_lesson_key")
        _check_hash_bound_file(source, root, "source_identity", errors)

    copy_inputs = contract.get("copy_inputs", [])
    if not isinstance(copy_inputs, list) or not copy_inputs:
        errors.append("contract: copy_inputs must be a non-empty list")
    else:
        for index, record in enumerate(copy_inputs, 1):
            if not isinstance(record, dict):
                errors.append(f"contract: copy_inputs[{index}] must be an object")
                continue
            if not record.get("page_scope"):
                errors.append(f"contract: copy_inputs[{index}] is missing page_scope")
            _check_hash_bound_file(record, root, f"copy_inputs[{index}]", errors)

    decision_inputs = contract.get("decision_inputs", [])
    if decision_inputs:
        if not isinstance(decision_inputs, list):
            errors.append("contract: decision_inputs must be a list")
        else:
            for index, record in enumerate(decision_inputs, 1):
                if not isinstance(record, dict):
                    errors.append(f"contract: decision_inputs[{index}] must be an object")
                    continue
                if not record.get("scope"):
                    errors.append(f"contract: decision_inputs[{index}] is missing scope")
                _check_hash_bound_file(record, root, f"decision_inputs[{index}]", errors)

    references = contract.get("references", {})
    reference_pages: dict[str, tuple[str, _DeckParser, Element]] = {}
    if references:
        if not isinstance(references, dict):
            errors.append("contract: references must be an object")
        else:
            for reference_name in ("cover", "route"):
                record = references.get(reference_name)
                if not isinstance(record, dict):
                    errors.append(f"contract: references.{reference_name} is required")
                    continue
                reference_path = _check_hash_bound_file(record, root, f"references.{reference_name}", errors)
                if reference_path is None:
                    continue
                try:
                    raw, parser = _load_tree(reference_path)
                except (OSError, UnicodeDecodeError) as exc:
                    errors.append(f"references.{reference_name}: cannot parse HTML: {exc}")
                    continue
                page_index = record.get("page_index")
                if not isinstance(page_index, int) or page_index < 0 or page_index >= len(parser.pages):
                    errors.append(f"references.{reference_name}: page_index is outside reference deck")
                    continue
                reference_pages[reference_name] = (raw, parser, parser.pages[page_index])

    try:
        deck_raw, deck_parser = _load_tree(deck)
    except (OSError, UnicodeDecodeError) as exc:
        return errors + [f"deck: cannot parse HTML: {exc}"]
    page_specs = contract.get("pages")
    if not isinstance(page_specs, list) or not page_specs:
        return errors + ["contract: pages must be a non-empty ordered list"]
    actual_pages = deck_parser.pages
    expected_ids = [str(page.get("id", "")) for page in page_specs if isinstance(page, dict)]
    if len(expected_ids) != len(page_specs):
        errors.append("contract: every page entry must be an object")
        return errors
    if len(set(expected_ids)) != len(expected_ids):
        errors.append("contract: page ids must be unique")
    first_roles = [page.get("role") for page in page_specs[:2]]
    if first_roles != ["cover", "route"]:
        errors.append(f"contract: first two page roles must be cover then route, found {first_roles!r}")
    actual_ids = [page.attrs.get("data-osd-stable-id", "") for page in actual_pages]
    if len(actual_pages) != len(page_specs):
        errors.append(f"page count: expected {len(page_specs)}, found {len(actual_pages)}")
    if actual_ids != expected_ids:
        errors.append(f"page order/identity: expected {expected_ids!r}, found {actual_ids!r}")
    if any("data-idx" in page.attrs for page in actual_pages):
        if not all("data-idx" in page.attrs for page in actual_pages):
            errors.append("page data-idx: indexes must be present on every page when used")
        else:
            try:
                data_indexes = [int(page.attrs["data-idx"]) for page in actual_pages]
            except ValueError:
                errors.append("page data-idx: every index must be an integer")
            else:
                expected_indexes = list(range(len(actual_pages)))
                if data_indexes != expected_indexes:
                    errors.append(f"page data-idx: expected contiguous indexes {expected_indexes!r}, found {data_indexes!r}")

    actual_by_id = {
        page.attrs.get("data-osd-stable-id", ""): page
        for page in actual_pages
        if page.attrs.get("data-osd-stable-id")
    }
    for index, spec in enumerate(page_specs):
        page_id = str(spec.get("id", "<unknown>"))
        if index >= len(actual_pages):
            break
        actual_page = actual_pages[index]
        actual_id = actual_page.attrs.get("data-osd-stable-id", "")
        if actual_id != page_id:
            continue
        if not isinstance(spec.get("expected_text_source"), str) or not spec.get("expected_text_source"):
            errors.append(f"page {page_id}: expected_text_source is required")
        expected = spec.get("expected_text")
        if not isinstance(expected, str):
            errors.append(f"page {page_id}: expected_text must be a string")
        elif normalize_text(_page_text(actual_page)) != normalize_text(expected):
            errors.append(f"page {page_id}: visible text differs from expected_text")
        if "expected_images" in spec:
            expected_images = spec.get("expected_images")
            if not isinstance(expected_images, list) or any(not isinstance(src, str) for src in expected_images):
                errors.append(f"page {page_id}: expected_images must be an ordered list of image src strings")
            else:
                actual_images = [
                    image.attrs.get("src", "")
                    for image in _find(actual_page, lambda item: item.tag == "img")
                ]
                if actual_images != expected_images:
                    errors.append(
                        f"page {page_id}: image src list differs from expected_images; "
                        f"expected {expected_images!r}, found {actual_images!r}"
                    )
        if contract.get('schema_version') == 'classroom-slide-contract-v2' and spec.get('role') not in ('cover', 'route'):
            if not spec.get('required_classes'):
                errors.append(f"page {spec.get('id')}: v2 must specify the actual activity structure")
            ref = spec.get('reference_page')
            if not isinstance(ref, dict):
                errors.append(f"page {spec.get('id')}: v2 requires an actual reference page")
            else:
                refpath = _check_hash_bound_file(ref, root, 'activity reference', errors)
                if refpath:
                    _, refdeck = _load_tree(refpath)
                    number = ref.get('page_index')
                    if type(number) is not int or not 0 <= number < len(refdeck.pages):
                        errors.append(f"page {spec.get('id')}: invalid activity reference index")
        _validate_role(actual_page, spec, errors)
        footer_text = contract.get("footer_text")
        if not spec.get("footer_exempt", False) and isinstance(footer_text, str) and footer_text:
            if normalize_text(footer_text) not in _page_text(actual_page):
                errors.append(f"page {page_id}: required footer text is missing")

    _validate_pairs(contract, page_specs, actual_by_id, errors)

    if "cover" in reference_pages:
        role_page = next(
            (page for page, spec in zip(actual_pages, page_specs) if spec.get("role") == "cover"),
            None,
        )
        if role_page is None:
            errors.append("cover reference comparison: deck has no page with role cover")
        else:
            _compare_cover(reference_pages["cover"][2], role_page, errors)
    if "route" in reference_pages:
        role_page = next(
            (page for page, spec in zip(actual_pages, page_specs) if spec.get("role") == "route"),
            None,
        )
        if role_page is None:
            errors.append("route reference comparison: deck has no page with role route")
        else:
            reference_raw = reference_pages["route"][0]
            _compare_route(reference_raw, reference_pages["route"][2], deck_raw, role_page, errors)
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--deck", required=True, type=Path, help="HTML deck path")
    parser.add_argument("--contract", required=True, type=Path, help="reviewed slide contract JSON")
    parser.add_argument("--project-root", type=Path, default=Path.cwd(), help="path root for all contract inputs")
    args = parser.parse_args()
    errors = validate(args.deck, args.contract, args.project_root)
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1
    print("Classroom slide contract passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
