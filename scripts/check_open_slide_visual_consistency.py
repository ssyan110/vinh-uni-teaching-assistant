#!/usr/bin/env python3
"""Check the live HTML structure of a weekly classroom OpenSlides draft.

This static consistency check confirms that margins, route geometry, discussion
prompts, oral models, and comic layouts are attached to live page elements and
follow the current Lesson 11–12 reference structure. It does not replace
rendered visual QA or classroom rehearsal.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_REFERENCE = ROOT / "lessons/boya-elementary-i/lesson-11/10-design/open-slide-draft/lesson-11-12-v09-readable/lesson-11-12-实体课.html"
VOID_TAGS = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}


class Node:
    def __init__(self, tag: str, attrs: dict[str, str | None] | None = None) -> None:
        self.tag = tag
        self.attrs = attrs or {}
        self.parent: Node | None = None
        self.children: list[Node] = []
        self.text: list[str] = []
        self.content: list[str | Node] = []

    @property
    def classes(self) -> set[str]:
        return set((self.attrs.get("class") or "").split())

    def walk(self):
        yield self
        for child in self.children:
            yield from child.walk()

    def find_all(self, tag: str | None = None, class_name: str | None = None) -> list[Node]:
        return [
            node for node in self.walk()
            if (tag is None or node.tag == tag)
            and (class_name is None or class_name in node.classes)
        ]

    def direct_tags(self) -> list[Node]:
        return self.children

    def text_content(self) -> str:
        return "".join(item if isinstance(item, str) else item.text_content() for item in self.content)


class TreeParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.root = Node("#document")
        self.stack = [self.root]

    def handle_starttag(self, tag: str, attrs) -> None:
        node = Node(tag, dict(attrs))
        node.parent = self.stack[-1]
        node.parent.children.append(node)
        node.parent.content.append(node)
        if tag not in VOID_TAGS:
            self.stack.append(node)

    def handle_startendtag(self, tag: str, attrs) -> None:
        self.handle_starttag(tag, attrs)
        if tag not in VOID_TAGS and self.stack[-1].tag == tag:
            self.stack.pop()

    def handle_endtag(self, tag: str) -> None:
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == tag:
                del self.stack[index:]
                return

    def handle_data(self, data: str) -> None:
        self.stack[-1].text.append(data)
        self.stack[-1].content.append(data)


def read_tree(path: Path) -> tuple[str, Node]:
    source = path.read_text(encoding="utf-8")
    parser = TreeParser()
    parser.feed(source)
    parser.close()
    return source, parser.root


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def css_blocks(source: str) -> str:
    return "\n".join(re.findall(r"<style[^>]*>(.*?)</style>", source, flags=re.S))


def css_rule_blocks(source: str) -> list[tuple[str, dict[str, str]]]:
    """Return flat CSS rules in source order, including rules inside at-rules.

    The slide stylesheets use ordinary flat declarations. Matching each innermost
    brace pair also sees declarations inside media/supports blocks while avoiding
    the old behavior of accidentally treating an at-rule prelude as a selector.
    """
    source = re.sub(r"/\*.*?\*/", "", source, flags=re.S)
    blocks: list[tuple[str, dict[str, str]]] = []
    for match in re.finditer(r"([^{}]+)\{([^{}]*)\}", source):
        selector_text = match.group(1).strip()
        if not selector_text or selector_text.startswith("@"):
            continue
        declarations: dict[str, str] = {}
        for part in match.group(2).split(";"):
            if ":" in part:
                key, value = part.split(":", 1)
                declarations[key.strip().lower()] = value.strip()
        for selector in selector_text.split(","):
            selector = selector.strip()
            if selector:
                blocks.append((selector, declarations.copy()))
    return blocks


def rule(source: str, selector: str) -> dict[str, str] | None:
    matches = [declarations for name, declarations in css_rule_blocks(source) if name == selector]
    if not matches:
        return None
    declarations: dict[str, str] = {}
    for block in matches:
        declarations.update(block)
    return declarations


def last_rule(source: str, selector: str) -> dict[str, str] | None:
    # CSS keeps earlier declarations that are not replaced by a later rule with
    # the same selector; merging is necessary to detect partial overrides.
    return rule(source, selector)


def selector_targets_class(selector: str, class_name: str) -> bool:
    """Whether a simple selector's subject includes the named class."""
    for match in re.finditer(rf"\.{re.escape(class_name)}(?![\w-])", selector):
        tail = selector[match.end():]
        if not tail or (not tail[0].isspace() and tail[0] not in ">+~"):
            return True
    return False


def normalize_css_value(property_name: str, value: str) -> str:
    if property_name == "font-family":
        return re.sub(r"\s*,\s*", ",", value.replace("\"", "").replace("'", "")).lower()
    return value.strip()


LAYOUT_PROPERTIES = {
    "align-content", "align-items", "align-self", "box-sizing", "display",
    "flex", "flex-basis", "flex-direction", "flex-grow", "flex-shrink",
    "float", "gap", "grid", "grid-area", "grid-auto-columns", "grid-auto-flow",
    "grid-auto-rows", "grid-column", "grid-column-end", "grid-column-start",
    "grid-row", "grid-row-end", "grid-row-start", "grid-template",
    "grid-template-areas", "grid-template-columns", "grid-template-rows",
    "height", "inset", "left", "margin", "margin-bottom", "margin-left",
    "margin-right", "margin-top", "max-height", "max-width", "min-height",
    "min-width", "overflow", "padding", "padding-bottom", "padding-left",
    "padding-right", "padding-top", "position", "right", "top", "transform",
    "width",
}
VISUAL_PROPERTIES = {
    "background", "background-color", "border", "border-color", "border-radius",
    "box-shadow", "color", "font-family", "font-size", "font-style", "font-weight",
    "letter-spacing", "line-height", "opacity", "text-align", "text-decoration",
    "text-transform", "white-space", "z-index",
}


def css_override_errors(deck_css: str, ref_css: str) -> list[str]:
    """Reject unreferenced layout rules that can change repeated page components."""
    errors: list[str] = []
    reference_rules = dict(css_rule_blocks(ref_css))
    for selector, declarations in css_rule_blocks(deck_css):
        if ".route-card" in selector:
            guarded_properties = LAYOUT_PROPERTIES | VISUAL_PROPERTIES
        elif selector_targets_class(selector, "activity"):
            guarded_properties = LAYOUT_PROPERTIES | {"background", "background-color", "color", "font-family"}
        elif selector_targets_class(selector, "activity-label"):
            guarded_properties = {"bottom", "left", "position", "right", "top"}
        else:
            continue
        for property_name in guarded_properties.intersection(declarations):
            reference = reference_rules.get(selector)
            if reference is None:
                errors.append(f"unreferenced component override {selector} sets {property_name}")
            elif normalize_css_value(property_name, declarations[property_name]) != normalize_css_value(
                property_name, reference.get(property_name, "")
            ):
                errors.append(
                    f"{selector} {property_name} must match the reference; "
                    f"found {declarations[property_name]!r}, reference {reference.get(property_name)!r}"
                )
    return errors


def page_index(node: Node) -> int | None:
    value = node.attrs.get("data-idx")
    try:
        return int(value) if value is not None else None
    except ValueError:
        return None


def inline_style(node: Node | None) -> dict[str, str]:
    if node is None:
        return {}
    declarations: dict[str, str] = {}
    for part in (node.attrs.get("style") or "").split(";"):
        if ":" in part:
            key, value = part.split(":", 1)
            declarations[key.strip()] = value.strip()
    return declarations


def page_by_index(pages: list[Node], index: int) -> Node | None:
    return next((page for page in pages if page_index(page) == index), None)


def child_with_class(node: Node | None, class_name: str) -> Node | None:
    if node is None:
        return None
    return next((child for child in node.direct_tags() if class_name in child.classes), None)


def check(
    deck_path: Path,
    reference_path: Path,
    expected_route_cards: int | None = None,
    expected_page_types: dict[str, list[str]] | None = None,
    expected_route_columns: int | None = None,
    content_contract: Path | None = None,
) -> list[str]:
    """Public generic entry: expected content always comes from a page contract."""
    if content_contract is None:
        registry = json.loads((ROOT / "course/open-slide-workspace.json").read_text())
        entry = next((d for d in registry["html_decks"] if (ROOT / d["source"]).resolve() == deck_path.resolve()), None)
        value = entry and entry.get("visual_check", {}).get("content_contract")
        if value:
            content_contract = ROOT / value
    if content_contract is None:
        return ["an explicit per-deck content contract is required; historical W06 expectations are not a generic template"]
    module_path = ROOT / "scripts/classroom_slide_contract.py"
    spec = importlib.util.spec_from_file_location("classroom_slide_contract", module_path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    errors = module.validate(deck_path, content_contract, ROOT)
    # Preserve the standing shell/route safeguards while keeping all lesson
    # copy and page mappings in data. Expected geometry comes from the real
    # reference, never from W06 prose or the candidate's own declarations.
    source, tree = read_tree(deck_path)
    ref_source, _ = read_tree(reference_path)
    current_css, reference_css = css_blocks(source), css_blocks(ref_source)
    errors.extend(css_override_errors(current_css, reference_css))
    for selector in (".activity", ".activity-label"):
        current, expected = rule(current_css, selector), rule(reference_css, selector)
        properties = ("width", "height", "padding", "background", "color", "font-family", "position") if selector == ".activity" else ("position", "right", "top")
        if not current or not expected:
            errors.append(f"standing reference shell missing: {selector}")
            continue
        for key in properties:
            if normalize_css_value(key, current.get(key, "")) != normalize_css_value(key, expected.get(key, "")):
                errors.append(f"{selector} {key} must match the standing reference shell")
        class_name = selector[1:]
        for element in tree.find_all(class_name=class_name):
            for key, value in inline_style(element).items():
                if key in properties and normalize_css_value(key, value) != normalize_css_value(key, expected.get(key, "")):
                    errors.append(f"inline {selector} {key} differs from the standing reference shell")
    return errors


def _check_legacy_w06(
    deck_path: Path,
    reference_path: Path,
    expected_route_cards: int | None = None,
    expected_page_types: dict[str, list[str]] | None = None,
    expected_route_columns: int | None = None,
) -> list[str]:
    """Historical W06 mutation controls, invoked only by forensic tests."""
    errors: list[str] = []
    deck_source, deck_root = read_tree(deck_path)
    ref_source, ref_root = read_tree(reference_path)
    deck_css = css_blocks(deck_source)
    ref_css = css_blocks(ref_source)
    pages = [node for node in deck_root.find_all() if "os-page" in node.classes and page_index(node) is not None]
    pages.sort(key=lambda node: page_index(node) or 0)
    indices = [page_index(node) for node in pages]
    if len(indices) < 3 or indices != list(range(len(indices))):
        errors.append(f"page indices must be contiguous from 0 and include cover, route, and content; found {indices}")
    stable_ids = [node.attrs.get("data-osd-stable-id") for node in pages]
    if len(stable_ids) != len(set(stable_ids)) or any(not value for value in stable_ids):
        errors.append("page stable IDs must exist and be unique")
    if expected_page_types is not None:
        actual_page_types = {
            "discussion": [page.attrs.get("data-osd-stable-id") for page in pages if "discussion" in page.classes],
            "comic": [page.attrs.get("data-osd-stable-id") for page in pages if "comic-page" in page.classes],
            "report": [
                page.attrs.get("data-osd-stable-id") for page in pages
                if page.find_all(class_name="report-phrase")
            ],
        }
        for page_type in ("discussion", "comic", "report"):
            expected = set(expected_page_types.get(page_type, []))
            actual = set(actual_page_types[page_type])
            if expected != actual:
                missing = sorted(expected - actual)
                unexpected = sorted(actual - expected)
                errors.append(
                    f"{page_type} page IDs differ from the approved visual profile; "
                    f"missing={missing}, unexpected={unexpected}"
                )

    # Page-specific fit rules only work when their modifier is attached to the
    # intended live slide. Keep that relationship explicit so a CSS-only check
    # cannot pass while the slide silently misses its layout fix.
    required_modifiers = {
        "w06-l14-party-plan": "w06-party",
    }
    pages_by_id = {page.attrs.get("data-osd-stable-id"): page for page in pages}
    exact_copy = {
        "w06-l13-listening": ("听老师读两次，记关键词：", "什么衣服？|什么颜色？|多少钱？|他为什么买这件？|最后买了吗？"),
        "w06-l13-retell": ("先和同学核对", "再用完整句子说出阿明买衣服的经过"),
        "w06-l14-listening": ("听老师读两次，记关键词：", "谁？|什么时候？|在哪里？|礼物是什么？|先做什么，然后做什么？"),
        "w06-l14-retell": ("先和同学核对关键词", "再介绍小兰的生日安排"),
        "w06-l13-choice": ("台湾朋友喜欢蓝色，也重视质量，预算最多", "说颜色、质量、价格、钱不够怎么办、为什么。|比较三件衣服的价格和质量，说说你选哪件，钱不够怎么办，为什么。"),
    }
    for stable_id, (first, second) in exact_copy.items():
        page = pages_by_id.get(stable_id)
        text = page.text_content() if page else ""
        if first not in text or any(fragment not in text for fragment in second.split("|")):
            errors.append(f"{stable_id} must preserve the user-provided v02 copy")
    route_candidate = page_by_index(pages, 1)
    route_text = route_candidate.text_content() if route_candidate else ""
    for fragment in ("个人报告", "线上口语作业", "听故事", "记关键词并复述", "看图说故事", "讨论", "选择、安排并汇报"):
        if fragment not in route_text:
            errors.append(f"route page must preserve the v02 activity wording: missing {fragment}")
    if route_text.count("活动13-") or route_text.count("活动14-"):
        errors.append("route page must not add activity-number copy absent from v02")
    selectors = [selector for selector, _ in css_rule_blocks(deck_css)]
    for stable_id, modifier in required_modifiers.items():
        page = pages_by_id.get(stable_id)
        if not page or modifier not in page.classes:
            errors.append(f"{stable_id} must attach the .{modifier} page-fit modifier")
        if not any(selector.startswith(f".{modifier} ") for selector in selectors):
            errors.append(f".{modifier} page-fit styles are missing")

    # The L14 birthday plan is open choice; photos or fixed options would steer
    # students away from creating their own activity plan.
    party_page = pages_by_id.get("w06-l14-party-plan")
    party_cards = party_page.find_all("article", "party-card") if party_page else []
    if party_cards or (party_page and party_page.find_all("img")):
        errors.append("L14 birthday plan must not show photos or preset activity cards")
    if party_page:
        party_text = party_page.text_content()
        required_copy = (
            "一位台湾朋友第一次在荣市过生日",
            "3—4人一组",
            "晚上6点到8点",
            "什么时候、在哪、做什么、特色、理由",
            "HSK 1–3",
            "HSK 4–6",
            "比较室内和室外活动",
        )
        if any(fragment not in party_text for fragment in required_copy):
            errors.append("L14 birthday plan must preserve the v02 prompt and both proficiency requirements")
        if any(option in party_text for option in ("越南火锅", "奶茶店", "唱歌", "公园散步")):
            errors.append("L14 birthday plan must leave activity choices to students")
    party_prompt_rule = rule(deck_css, ".w06-party .party-prompt")
    if not party_prompt_rule or float(party_prompt_rule.get("font-size", "0px").removesuffix("px")) < 45:
        errors.append("L14 birthday plan prompt text must be at least 45px")
    party_level_rule = rule(deck_css, ".w06-party .party-levels .level p")
    if not party_level_rule or float(party_level_rule.get("font-size", "0px").replace("!important", "").removesuffix("px")) < 45:
        errors.append("L14 birthday HSK task text must be at least 45px")

    # The shell must be on each live page, not merely present as an unused CSS rule.
    activity_rule = rule(deck_css, ".activity")
    expected_shell = {
        "width": "1920px",
        "height": "1080px",
        "padding": "74px 96px 68px",
        "background": "#fff",
        "color": "#102a43",
        "font-family": '"Times New Roman",KaiTi,serif',
        "position": "relative",
    }
    if not activity_rule:
        errors.append("missing .activity page-shell CSS")
    else:
        for key, value in expected_shell.items():
            if activity_rule.get(key) != value:
                errors.append(f".activity {key} must be {value}; found {activity_rule.get(key)!r}")
    errors.extend(css_override_errors(deck_css, ref_css))
    for index in indices[2:]:
        page = next((item for item in pages if page_index(item) == index), None)
        if page and "activity" not in page.classes:
            errors.append(f"page {index + 1:02} does not attach the .activity shell to its live .os-page")
        if page and "activity" in page.classes:
            page_style = inline_style(page)
            for key, value in expected_shell.items():
                if key in page_style and page_style[key] != value:
                    errors.append(f"page {index + 1:02} inline .activity {key} must be {value}; found {page_style[key]!r}")
            for label in page.find_all(class_name="activity-label"):
                label_style = inline_style(label)
                for key, value in (("right", "96px"), ("top", "25px")):
                    if key in label_style and label_style[key] != value:
                        errors.append(f"page {index + 1:02} inline activity-label {key} must be {value}; found {label_style[key]!r}")
        if page and any(heading.text_content().strip() == "看图说故事" for heading in page.find_all("h1")) and "comic-page" not in page.classes:
            errors.append(f"page {index + 1:02} uses the comic title without the standard .comic-page structure")
    header_rule = rule(deck_css, ".page-header")
    if header_rule and header_rule.get("position") == "relative":
        errors.append(".page-header still captures the activity label instead of matching the reference shell")
    label_rule = rule(deck_css, ".activity-label")
    if not label_rule or label_rule.get("right") != "96px" or label_rule.get("top") != "25px":
        errors.append("activity label offsets do not match the Lesson 11–12 reference")

    # Route page: same icon/title/activity-range card anatomy as the reference.
    route_page = page_by_index(pages, 1)
    ref_route_page = page_by_index(
        [node for node in ref_root.find_all() if "os-page" in node.classes and page_index(node) is not None],
        1,
    )
    routes = route_page.find_all("section", "route") if route_page else []
    ref_routes = ref_route_page.find_all("section", "route") if ref_route_page else []
    if len(routes) != 1 or len(ref_routes) != 1:
        errors.append("page 02 must contain one .route section")
    else:
        route = routes[0]
        ref_route = ref_routes[0]
        cards = route.find_all("article", "route-card")
        ref_cards = ref_route.find_all("article", "route-card")
        route_grid = next((node for node in route.direct_tags() if node.tag == "div"), None)
        ref_grid = next((node for node in ref_route.direct_tags() if node.tag == "div"), None)
        grid_style = inline_style(route_grid)
        ref_grid_style = inline_style(ref_grid)
        if expected_route_cards is not None and len(cards) != expected_route_cards:
            errors.append(f"route must contain {expected_route_cards} activity cards; found {len(cards)}")
        if not route_grid:
            errors.append("route grid is missing")
        else:
            if grid_style.get("display") != ref_grid_style.get("display"):
                errors.append("route grid display must match Lesson 11–12")
            if grid_style.get("gap") != ref_grid_style.get("gap"):
                errors.append("route grid gap must match Lesson 11–12")
            columns = grid_style.get("grid-template-columns", "")
            match = re.fullmatch(r"repeat\((\d+),\s*1fr\)", columns)
            actual_columns = int(match.group(1)) if match else None
            if expected_route_columns is not None and actual_columns != expected_route_columns:
                errors.append(
                    f"route grid must use {expected_route_columns} equal-width columns; "
                    f"found {columns!r}"
                )
            elif expected_route_columns is None and columns != ref_grid_style.get("grid-template-columns"):
                errors.append(
                    "route grid columns must match Lesson 11–12 or be explicitly configured; "
                    f"found {columns!r}"
                )
        if any("grid-column" in inline_style(card) or "grid-row" in inline_style(card) for card in cards):
            errors.append("route cards may not use custom row/column placement absent from the reference")
        route_style = inline_style(route)
        ref_route_style = inline_style(ref_route)
        for key in ("width", "height", "box-sizing", "padding", "background", "color", "font-family"):
            if route_style.get(key) != ref_route_style.get(key):
                errors.append(
                    f"route section {key} must match Lesson 11–12; "
                    f"found {route_style.get(key)!r}, reference {ref_route_style.get(key)!r}"
                )
        for number, card in enumerate(cards, 1):
            icons = card.find_all("img", "route-icon")
            titles = card.find_all("h2")
            ranges = card.find_all("p", "route-range")
            if len(icons) != 1 or len(titles) != 1 or len(ranges) != 1:
                errors.append(f"route card {number} must contain one route icon, title, and activity range")
        for number, card in enumerate(cards):
            if number < len(ref_cards) and inline_style(card) != inline_style(ref_cards[number]):
                errors.append(f"route card {number + 1} inline appearance must match Lesson 11–12")
    for selector in (
        ".route .route-card",
        ".route .route-card .route-icon",
        ".route .route-card h2",
        ".route .route-range",
    ):
        block = last_rule(deck_css, selector)
        reference_block = last_rule(ref_css, selector)
        if not block or not reference_block:
            errors.append(f"missing route style or reference selector {selector}")
        elif block != reference_block:
            errors.append(f"{selector} CSS must match Lesson 11–12 exactly; found {block}, reference {reference_block}")

    # Open-ended speaking prompts reuse the Lesson 11–12 discussion family.
    # When a topic is explicitly split, its question-only page must be followed
    # by one page that holds both HSK levels; the prompt must not be repeated.
    ref_pages = [node for node in ref_root.find_all() if "os-page" in node.classes and page_index(node) is not None]
    ref_discussion = next(
        (node for page in ref_pages for node in page.find_all("section", "discussion")),
        None,
    )
    if not ref_discussion:
        errors.append("Lesson 11–12 reference must contain a .discussion page")
    ref_discussion_header = next((node for node in ref_discussion.direct_tags() if node.tag == "header"), None) if ref_discussion else None
    ref_header_shape = (
        [(child.tag, next(iter(child.classes), "")) for child in ref_discussion_header.direct_tags()]
        if ref_discussion_header else []
    )
    ref_discussion_question = last_rule(ref_css, ".discussion .question")
    discussion_question = last_rule(deck_css, ".discussion .question")
    for selector, current, reference in (
        (".discussion .question", discussion_question, ref_discussion_question),
        (".icon-prompt-strip", last_rule(deck_css, ".icon-prompt-strip"), last_rule(ref_css, ".icon-prompt-strip")),
        (".icon-prompt", rule(deck_css, ".icon-prompt"), rule(ref_css, ".icon-prompt")),
        (".icon-prompt img", rule(deck_css, ".icon-prompt img"), rule(ref_css, ".icon-prompt img")),
        (".discussion .icon-prompt-strip", last_rule(deck_css, ".discussion .icon-prompt-strip"), last_rule(ref_css, ".discussion .icon-prompt-strip")),
    ):
        if not current or not reference or any(reference.get(key) != value for key, value in current.items()):
            errors.append(f"{selector} must retain the Lesson 11–12 discussion style")
    discussion_order = [
        ("w06-life-vinh-shopping-question", 12, "question-page"),
        ("w06-life-vinh-shopping-support", 13, "support-page"),
        ("w06-life-vietnam-birthday-question", 14, "question-page"),
        ("w06-life-vietnam-birthday-support", 15, "support-page"),
        ("w06-life-taipei-birthday-question", 16, "question-page"),
        ("w06-life-taipei-birthday-support", 17, "support-page"),
    ]
    discussion_pages = [page for page in pages if "discussion" in page.classes]
    actual_order = [page.attrs.get("data-osd-stable-id") for page in discussion_pages]
    expected_order = [stable_id for stable_id, _, _ in discussion_order]
    if actual_order != expected_order:
        errors.append(
            "discussion pages must alternate question-only and paired-support roles in topic order; "
            f"found {actual_order}"
        )
    expected_topics = {
        "w06-life-vinh-shopping": (
            "在荣市买衣服",
            "在荣市买衣服，你比较喜欢去服装店，还是在网上买？为什么？",
            ("我比较喜欢____，因为____。去____买的时候，我可以____。", "请选两个地方，比较优点和缺点。"),
        ),
        "w06-life-vietnam-birthday": (
            "给台湾朋友过生日",
            "农历春节的时候，台湾朋友在河内过生日，你想带他去哪里？送什么礼物？为什么？",
            ("我想带他去____。我们先____，然后____。我准备送他____，因为____。", "请选两个地方，比较优点和缺点。"),
        ),
        "w06-life-taipei-birthday": (
            "如果你在台北过生日",
            "生日的时候，你正在台北旅游，你打算如何过生日？请你安排一天的计划。",
            ("和谁、去哪、做什么、吃什么、喝什么、看什么、为什么。", "选两个地方，比较优缺点，再按时间顺序介绍一天的计划，并说明理由。"),
        ),
    }
    for stable_id, expected_index, role in discussion_order:
        page = pages_by_id.get(stable_id)
        if page is None:
            continue
        if page_index(page) != expected_index:
            errors.append(f"{stable_id} must occupy slide {expected_index + 1}")
        if "activity" not in page.classes or "discussion" not in page.classes or role not in page.classes:
            errors.append(f"{stable_id} must use the live .activity discussion {role} shell")
        if any(name in page.classes for name in ("single-level", "discussion-compact")):
            errors.append(f"{stable_id} must not use the former one-level-per-page layout")
        if [child.tag for child in page.direct_tags()] != ["header", "main", "footer"]:
            errors.append(f"{stable_id} must use the reference header → main → footer structure")
            continue
        header, main, footer = page.direct_tags()
        header_shape = [(child.tag, next(iter(child.classes), "")) for child in header.direct_tags()]
        if not ref_header_shape or header_shape != ref_header_shape:
            errors.append(f"{stable_id} header anatomy differs from the Lesson 11–12 discussion page")
        if page.find_all("img"):
            errors.append(f"{stable_id} must not add unapproved prompt photos or icons")
        if len(footer.find_all("span")) != 2:
            errors.append(f"{stable_id} footer must retain the reference two-part footer")
        topic_key = stable_id.rsplit("-", 1)[0]
        expected_title, expected_question, models = expected_topics[topic_key]
        title = next((node.text_content().strip() for node in header.find_all("h1")), "")
        if title != expected_title:
            errors.append(f"{stable_id} topic heading must match the approved copy")
        main_children = main.direct_tags()
        if role == "question-page":
            if len(main_children) != 1 or "question" not in main_children[0].classes:
                errors.append(f"{stable_id} question page must contain only its question")
                continue
            if main_children[0].text_content().strip() != expected_question:
                errors.append(f"{stable_id} question must match the approved copy")
            if page.find_all(class_name="level"):
                errors.append(f"{stable_id} question page must not contain HSK support cards")
        else:
            if any("question" in node.classes for node in main.find_all()):
                errors.append(f"{stable_id} support page must not repeat the question")
            if len(main_children) != 1 or "levels" not in main_children[0].classes:
                errors.append(f"{stable_id} support page must contain one paired HSK card row")
                continue
            cards = [node for node in main_children[0].direct_tags() if "level" in node.classes]
            if len(cards) != 2:
                errors.append(f"{stable_id} support page must show both HSK levels together")
                continue
            for card, expected_level, expected_model in zip(cards, ("HSK 1–3", "HSK 4–6"), models):
                expected_class = "base" if expected_level == "HSK 1–3" else "challenge"
                heading = next((node.text_content().strip() for node in card.find_all("h2")), "")
                paragraph = next((node for node in card.direct_tags() if node.tag == "p"), None)
                model_text = paragraph.text_content().strip() if paragraph else ""
                if expected_class not in card.classes or heading != expected_level:
                    errors.append(f"{stable_id} must label the paired {expected_level} card")
                if not paragraph or model_text != expected_model:
                    errors.append(f"{stable_id} {expected_level} support must match the approved copy")
                if len(re.findall(r"[\u4e00-\u9fff]", model_text.replace("____", ""))) < 4:
                    errors.append(f"{stable_id} {expected_level} card must contain usable Chinese speaking support")
    paired_grid = rule(deck_css, ".discussion.support-page .levels")
    if not paired_grid or paired_grid.get("grid-template-columns", "").replace("!important", "") != "1fr 1fr":
        errors.append("paired discussion support must show both HSK cards side by side")
    support_text = rule(deck_css, ".discussion.support-page .level p")
    if not support_text or float(support_text.get("font-size", "0px").replace("!important", "").removesuffix("px")) < 45:
        errors.append("paired discussion support text must be at least 45px")
    question_text = rule(deck_css, ".discussion .question")
    if not question_text or float(question_text.get("font-size", "0px").replace("!important", "").removesuffix("px")) < 45:
        errors.append("discussion question text must be at least 45px")
    report_label = rule(deck_css, ".report-example-label")
    if not report_label or float(report_label.get("font-size", "0px").removesuffix("px")) < 40:
        errors.append("report model labels must be at least 40px")
    for selector in (".retell-levels .level p", ".task-levels .level p", ".party-levels .level p"):
        size = rule(deck_css, selector)
        if not size or float(size.get("font-size", "0px").replace("!important", "").removesuffix("px")) < 45:
            errors.append(f"{selector} student-facing task text must be at least 45px")
    reports = [
        node for page in pages for node in page.find_all(class_name="report-phrase")
        if "____" in node.text_content()
    ]
    for report in reports:
        report_text = report.text_content().strip()
        paragraph = next((node for node in report.direct_tags() if node.tag == "p"), None)
        model_text = paragraph.text_content().strip() if paragraph else ""
        page = next((page for page in pages if report in page.find_all(class_name="report-phrase")), None)
        stable_id = page.attrs.get("data-osd-stable-id") if page else "report page"
        if stable_id == "w06-l13-report":
            expected = "我们推荐____。它是____色的，质量____，价格是____越南盾。"
            if model_text != expected:
                errors.append("slide 10 must match the v02 HSK 1–3 reference-answer wording")
            label = report.find_all(class_name="report-example-label")
            if len(label) != 1 or label[0].text_content().strip() != "HSK 1–3｜参考回答":
                errors.append("slide 10 label must match the v02 reference-answer label")
            continue
        if stable_id == "w06-l14-report":
            expected = "我们打算在____庆祝。先____，然后____，最后____。那个餐厅/咖啡馆/地方的特色是____。我们这样安排，是因为____。"
            if model_text != expected:
                errors.append("slide 12 must match the v02 HSK 1–3 birthday-plan model")
            label = report.find_all(class_name="report-example-label")
            if len(label) != 1 or label[0].text_content().strip() != "HSK 1–3｜参考回答":
                errors.append("slide 12 label must match the v02 reference-answer label")
            continue
        report_blanks = report_text.count("____")
        if report_blanks < 7 or len(report_text) < 80:
            errors.append(f"{stable_id} needs a complete multi-sentence fill-in report; found {report_blanks} blanks and {len(report_text)} characters")
        if "推荐" in report_text and not all(marker in report_text for marker in ("因为", "虽然", "但是", "最后", "预算")):
            errors.append(f"{stable_id} recommendation model must include budget, contrast, decision, and reason")

    # Comic pages must keep the reference's header → centered image → footer shell.
    comics = [page for page in pages if "comic-page" in page.classes]
    for comic in comics:
        stable_id = comic.attrs.get("data-osd-stable-id") or f"comic page {page_index(comic)}"
        if "activity" not in comic.classes or "comic-page" not in comic.classes:
            errors.append(f"{stable_id} must use both .activity and .comic-page")
        direct = comic.direct_tags()
        tags = [node.tag for node in direct]
        if tags != ["header", "main", "footer"]:
            errors.append(f"{stable_id} must use the reference header/main/footer structure; found {tags}")
            continue
        header, main, footer = direct
        header_tags = [node for node in header.direct_tags()]
        header_shape = [(node.tag, next(iter(node.classes), "")) for node in header_tags]
        if header_shape != [("h1", ""), ("div", "rule")]:
            errors.append(f"{stable_id} must keep only the comic title and rule outside its image")
        title = header.find_all("h1")
        if len(title) != 1 or title[0].text_content().strip() != "看图说故事":
            errors.append(f"{stable_id} title must be exactly 看图说故事")
        main_children = main.direct_tags()
        if len(main_children) != 1 or "comic-layout" not in main_children[0].classes:
            errors.append(f"{stable_id} main must contain one centered .comic-layout")
            continue
        comic_layout = main_children[0]
        comic_boxes = comic_layout.find_all("div", "comic")
        if len(comic_boxes) != 1:
            errors.append(f"{stable_id} must contain one .comic image frame")
            continue
        box = comic_boxes[0]
        images = box.find_all("img")
        if len(images) != 1:
            errors.append(f"{stable_id} must show one six-panel image")
        extras = [node for node in box.direct_tags() if node.tag != "img" and "price-tag" not in node.classes]
        if extras:
            errors.append(f"{stable_id} has extra text or panels outside the comic image")
        if len(footer.find_all("span")) != 2:
            errors.append(f"{stable_id} footer differs from the reference page")
        price_nodes = box.find_all("span", "price-tag")
        if any(not node.text_content().strip() for node in price_nodes):
            errors.append(f"{stable_id} contains an empty in-image label")
        if images and images[0].attrs.get("src"):
            image_path = (deck_path.parent / images[0].attrs["src"]).resolve()
            if not image_path.is_file():
                errors.append(f"{stable_id} image is missing: {image_path}")
            else:
                try:
                    from PIL import Image

                    with Image.open(image_path) as image:
                        image.verify()
                        if image.width / image.height != 1.5:
                            errors.append(f"{stable_id} comic image must retain a 3:2 canvas")
                except ImportError:
                    pass
                except Exception as error:
                    errors.append(f"{stable_id} image cannot be decoded: {error}")

    comic_main = rule(deck_css, ".comic-page main")
    comic_layout_rule = rule(deck_css, ".activity .comic-layout")
    comic_rule = rule(deck_css, ".activity .comic")
    for selector, block in ((".comic-page main", comic_main), (".activity .comic-layout", comic_layout_rule), (".activity .comic", comic_rule)):
        reference_block = rule(ref_css, selector)
        if not block or not reference_block or block != reference_block or block.get("height") != "700px!important":
            errors.append(f"{selector} must match the 700px centered comic viewport in the reference")
    # Check every local image reference, including cover, route icons, and activity data.
    try:
        from PIL import Image
    except ImportError:
        Image = None
    checked: set[Path] = set()
    for image_node in deck_root.find_all("img"):
        src = image_node.attrs.get("src")
        if not src:
            errors.append("an image is missing its local src")
            continue
        if src.startswith(("http://", "https://", "data:")):
            errors.append(f"image must be packaged locally, found {src}")
            continue
        image_path = (deck_path.parent / src).resolve()
        if image_path in checked:
            continue
        checked.add(image_path)
        if not image_path.is_file():
            errors.append(f"local image is missing: {image_path}")
        elif Image is not None:
            try:
                with Image.open(image_path) as image:
                    image.verify()
            except Exception as error:
                errors.append(f"local image cannot be decoded ({src}): {error}")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--deck", type=Path, required=True)
    parser.add_argument("--reference", type=Path, default=DEFAULT_REFERENCE)
    parser.add_argument("--contract", type=Path, help="Reviewed page copy/role contract; defaults to the registered deck contract")
    parser.add_argument("--expected-route-cards", type=int, required=True, help="Expected card count from this lesson's approved activity grouping")
    parser.add_argument("--expected-route-columns", type=int, help="Expected equal-width route grid columns from this lesson's visual profile")
    args = parser.parse_args()
    deck = args.deck.resolve()
    reference = args.reference.resolve()
    if not deck.is_file() or not reference.is_file():
        parser.error("deck and reference must be existing files")
    contract = args.contract
    if contract is None:
        registry = json.loads((ROOT / "course/open-slide-workspace.json").read_text())
        item = next((d for d in registry["html_decks"] if (ROOT / d["source"]).resolve() == deck), None)
        if item and item.get("visual_check", {}).get("content_contract"):
            contract = ROOT / item["visual_check"]["content_contract"]
    if contract is None:
        parser.error("a registered or explicit --contract is required; W06-specific expectations are not a new-deck template")
    errors = check(
        deck,
        reference,
        args.expected_route_cards,
        expected_route_columns=args.expected_route_columns,
        content_contract=contract,
    )
    if errors:
        print("FAIL: OpenSlides visual consistency checks")
        for error in errors:
            print(f"- {error}")
        return 1
    print("PASS: page shells, final route grid and styles, discussion prompts and models, comic structure, activity labels, and local images")
    print(f"deck_sha256={digest(deck)}")
    print(f"reference_sha256={digest(reference)}")
    print("rendered browser layout remains a separate visual QA step")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
