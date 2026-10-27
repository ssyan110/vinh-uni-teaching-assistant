"""Regression tests for the reusable classroom slide contract checker."""

from __future__ import annotations

import hashlib
import json
import tempfile
import unittest
from pathlib import Path

from scripts.classroom_slide_contract import validate


BRAND = "Classroom brand"
ROUTE_CSS = """
.route{position:relative}
.route>h1{margin-bottom:42px!important}
.route .route-card{height:340px!important;min-width:0;overflow:hidden}
.route .route-card .route-icon{height:150px;width:180px;display:block;margin:0 auto;object-fit:contain}
.route .route-card h2{font-size:44px!important;line-height:1.15!important;margin:10px 0 7px!important}
.route .route-range{font-size:36px!important;line-height:1.12!important;margin:0}
"""
ROUTE_ROOT_STYLE = "width:1920px;height:1080px;box-sizing:border-box;padding:80px 96px;background:white;color:#17324d;font-family:KaiTi,'Times New Roman',serif"
ROUTE_CARD_STYLE = "background:#f8fbfb;border:1px solid #d8e7e9;border-radius:20px;padding:20px"


def _cover_page() -> str:
    return f'''<section class="os-page" data-osd-stable-id="opening">
      <div style="width:1920px;height:1080px;box-sizing:border-box;padding:110px 96px 68px;background:rgb(255,255,255);color:rgb(16,42,67);font-family:KaiTi,STKaiti,楷体,&quot;Times New Roman&quot;,serif;position:relative;overflow:hidden">
        <div style="position:absolute;top:84px;left:96px;color:rgb(8,126,139);font-size:45px;font-weight:700;letter-spacing:1px">Unit</div>
        <div style="height:100%;display:grid;grid-template-columns:1.1fr .9fr;align-items:center;gap:50px">
          <div style="padding-bottom:45px"><h1 style="margin:0;font-size:82px;line-height:1.12;letter-spacing:-2px;font-weight:760">Lesson</h1>
            <div style="margin-top:34px;width:90px;height:8px;border-radius:4px;background:rgb(8,126,139)"></div>
            <p style="margin:34px 0 0;max-width:900px;font-size:48px;line-height:1.35;color:rgb(82,101,121)">A short overview.</p>
          </div>
          <div style="height:620px;display:grid;place-items:center;border-left:1px solid rgb(217,227,232)"><img src="cover.png" style="width:690px;height:590px;object-fit:contain"></div>
        </div>
        <div style="position:absolute;bottom:96px;left:96px;right:96px;display:flex;justify-content:space-between;color:rgb(82,101,121);font-size:30px"><span>{BRAND}</span><span>01 / 08</span></div>
      </div>
    </section>'''


def _route_card(title: str, range_text: str) -> str:
    return f'''<article class="route-card" style="{ROUTE_CARD_STYLE}"><img class="route-icon" src="icon.png"><h2>{title}</h2><p class="route-range">{range_text}</p></article>'''


def _route_page(card_markup: str, columns: int = 4) -> str:
    grid_style = f"display:grid;grid-template-columns:repeat({columns},1fr);gap:26px"
    return f'''<section class="os-page" data-osd-stable-id="route" hidden>
      <section class="route" style="{ROUTE_ROOT_STYLE}"><h1 style="font-size:74px;margin:0 0 42px">Today</h1>
        <div style="{grid_style}">{card_markup}</div>
      </section>
    </section>'''


def _reference_files(root: Path, cards: int = 1) -> tuple[dict[str, dict[str, object]], dict[str, dict[str, str]]]:
    cover = root / "reference-cover.html"
    route = root / "reference-route.html"
    cover.write_text(f"<html><body>{_cover_page()}</body></html>", encoding="utf-8")
    route_cards = "".join(_route_card(f"Reference {i}", f"{i}–{i + 1}") for i in range(cards))
    route.write_text(f"<html><head><style>{ROUTE_CSS}</style></head><body>{_route_page(route_cards)}</body></html>", encoding="utf-8")
    refs = {
        "cover": {"path": cover.name, "sha256": hashlib.sha256(cover.read_bytes()).hexdigest(), "page_index": 0},
        "route": {"path": route.name, "sha256": hashlib.sha256(route.read_bytes()).hexdigest(), "page_index": 0},
    }
    return refs, {"cover": {"path": cover.name}, "route": {"path": route.name}}


def _fixture_pages() -> list[str]:
    return [
        _cover_page(),
        _route_page(
            _route_card("Listen", "pages 2–3")
            + _route_card("Tell", "page 4")
            + _route_card("Discuss", "pages 5–8"),
            columns=3,
        ),
        f'''<section class="os-page activity comic-page" data-osd-stable-id="comic"><header><h1>Picture story</h1></header><main><div class="comic"><img src="comic.png"></div></main><footer>{BRAND} 03 / 08</footer></section>''',
        f'''<section class="os-page activity" data-osd-stable-id="task"><h1>Choose a shirt</h1><p>Budget: 20. Option A costs 25.</p><footer>{BRAND} 04 / 08</footer></section>''',
        f'''<section class="os-page activity discussion question-page" data-osd-stable-id="question-a"><header><h1>Where to celebrate</h1></header><main><p class="question">Where should we go?</p></main><footer>{BRAND} 05 / 08</footer></section>''',
        f'''<section class="os-page activity discussion support-page" data-osd-stable-id="support-a"><header><h1>Where to celebrate</h1></header><main><div class="levels"><article class="level"><h2>HSK 1–3</h2><p>I want to go to ____.</p></article><article class="level"><h2>HSK 4–6</h2><p>Compare two places.</p></article></div></main><footer>{BRAND} 06 / 08</footer></section>''',
        f'''<section class="os-page activity discussion question-page" data-osd-stable-id="question-b"><header><h1>What to eat</h1></header><main><p class="question">What would you like to eat?</p></main><footer>{BRAND} 07 / 08</footer></section>''',
        f'''<section class="os-page activity discussion support-page" data-osd-stable-id="support-b"><header><h1>What to eat</h1></header><main><div class="levels"><article class="level"><h2>HSK 1–3</h2><p>I would like ____.</p></article><article class="level"><h2>HSK 4–6</h2><p>Compare two dishes.</p></article></div></main><footer>{BRAND} 08 / 08</footer></section>''',
    ]


class ClassroomSlideContractTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.deck_path = self.root / "deck.html"
        self.contract_path = self.root / "contract.json"
        self.pages = _fixture_pages()
        self.references, _ = _reference_files(self.root)
        self._write_deck()
        self._write_contract()

    def _write_deck(self) -> None:
        self.deck_path.write_text(
            f"<html><head><style>{ROUTE_CSS}</style></head><body>{''.join(self.pages)}</body></html>",
            encoding="utf-8",
        )

    def _write_contract(self, contract: dict[str, object] | None = None) -> None:
        source_path = self.root / "source.json"
        copy_path = self.root / "reviewed-copy.md"
        if not source_path.exists():
            source_path.write_text('{"lesson":"fixture"}', encoding="utf-8")
        if not copy_path.exists():
            copy_path.write_text("Reviewed copy fixture.", encoding="utf-8")
        if contract is None:
            ids = ["opening", "route", "comic", "task", "question-a", "support-a", "question-b", "support-b"]
            expected = [
                "Unit Lesson A short overview. Classroom brand 01 / 08",
                "Today Listen pages 2–3 Tell page 4 Discuss pages 5–8",
                "Picture story Classroom brand 03 / 08",
                "Choose a shirt Budget: 20. Option A costs 25. Classroom brand 04 / 08",
                "Where to celebrate Where should we go? Classroom brand 05 / 08",
                "Where to celebrate HSK 1–3 I want to go to ____. HSK 4–6 Compare two places. Classroom brand 06 / 08",
                "What to eat What would you like to eat? Classroom brand 07 / 08",
                "What to eat HSK 1–3 I would like ____. HSK 4–6 Compare two dishes. Classroom brand 08 / 08",
            ]
            expected_images = {
                "opening": ["cover.png"],
                "route": ["icon.png", "icon.png", "icon.png"],
                "comic": ["comic.png"],
                "task": [],
                "question-a": [],
                "support-a": [],
                "question-b": [],
                "support-b": [],
            }
            roles = ["cover", "route", "comic", "activity", "discussion_question", "discussion_support", "discussion_question", "discussion_support"]
            pages = []
            for index, (page_id, role, text) in enumerate(zip(ids, roles, expected)):
                spec: dict[str, object] = {
                    "id": page_id,
                    "role": role,
                    "expected_text_source": f"reviewed fixture page {index + 1}",
                    "expected_text": text,
                    "expected_images": expected_images[page_id],
                }
                if index == 1:
                    spec["footer_exempt"] = True
                    spec["expected_route_cards"] = 3
                    spec["expected_route_columns"] = 3
                if role == "discussion_question":
                    spec["pair_key"] = "celebration" if page_id.endswith("a") else "food"
                if role == "discussion_support":
                    spec["pair_key"] = "celebration" if page_id.endswith("a") else "food"
                    spec["level_labels"] = ["HSK 1–3", "HSK 4–6"]
                pages.append(spec)
            contract = {
                "schema_version": "classroom-slide-contract-v1",
                "offering_id": "fixture-term",
                "owner_lesson_key": "fixture-book:lesson-01",
                "lesson_keys": ["fixture-book:lesson-01"],
                "source_identity": {
                    "textbook_id": "fixture-book",
                    "owner_lesson_key": "fixture-book:lesson-01",
                    "path": source_path.name,
                    "sha256": hashlib.sha256(source_path.read_bytes()).hexdigest(),
                },
                "copy_inputs": [{
                    "path": copy_path.name,
                    "sha256": hashlib.sha256(copy_path.read_bytes()).hexdigest(),
                    "page_scope": "fixture pages 1–8",
                }],
                "references": self.references,
                "footer_text": BRAND,
                "pages": pages,
                "page_pairs": [
                    {"question_id": "question-a", "support_id": "support-a", "topic": "Where to celebrate"},
                    {"question_id": "question-b", "support_id": "support-b", "topic": "What to eat"},
                ],
            }
        self.contract_path.write_text(json.dumps(contract, ensure_ascii=False, indent=2), encoding="utf-8")

    def _load_contract(self) -> dict[str, object]:
        return json.loads(self.contract_path.read_text(encoding="utf-8"))

    def test_generic_non_course_fixture_adapts_reference_card_count_and_columns(self) -> None:
        # Candidate has three cards and columns while the reference has one card
        # and four columns; shared card anatomy and styling remain enforced.
        errors = validate(self.deck_path, self.contract_path, self.root)
        self.assertEqual(errors, [])

    def test_textually_correct_generic_box_cannot_replace_required_activity_layout(self):
        contract = self._load_contract()
        contract['pages'][3]['required_classes'] = ['listen-layout', 'question-grid']
        self.contract_path.write_text(json.dumps(contract), encoding='utf-8')
        errors = validate(self.deck_path, self.contract_path, self.root)
        self.assertTrue(any('missing required reference structure .listen-layout' in x for x in errors))

    def test_v2_requires_actual_activity_reference_and_structure(self):
        contract = self._load_contract()
        contract['schema_version'] = 'classroom-slide-contract-v2'
        self.contract_path.write_text(json.dumps(contract), encoding='utf-8')
        errors = validate(self.deck_path, self.contract_path, self.root)
        self.assertTrue(any('v2 requires an actual reference page' in x for x in errors))

    def test_reordered_pages_fail_identity_and_order_check(self) -> None:
        self.pages[4], self.pages[5] = self.pages[5], self.pages[4]
        self._write_deck()
        errors = validate(self.deck_path, self.contract_path, self.root)
        self.assertTrue(any("page order/identity" in error for error in errors), errors)

    def test_missing_page_fails_count_and_identity_check(self) -> None:
        del self.pages[2]
        self._write_deck()
        errors = validate(self.deck_path, self.contract_path, self.root)
        self.assertTrue(any("page count" in error for error in errors), errors)
        self.assertTrue(any("page order/identity" in error for error in errors), errors)

    def test_extra_page_fails_count_and_identity_check(self) -> None:
        self.pages.append('<section class="os-page" data-osd-stable-id="unexpected"><h1>Extra</h1></section>')
        self._write_deck()
        errors = validate(self.deck_path, self.contract_path, self.root)
        self.assertTrue(any("page count" in error for error in errors), errors)
        self.assertTrue(any("page order/identity" in error for error in errors), errors)

    def test_budget_and_price_copy_drift_fails_exact_page_copy(self) -> None:
        self.pages[3] = self.pages[3].replace("Budget: 20", "Budget: 21").replace("costs 25", "costs 24")
        self._write_deck()
        errors = validate(self.deck_path, self.contract_path, self.root)
        self.assertTrue(any("page task: visible text differs" in error for error in errors), errors)

    def test_task_prompt_omission_fails_exact_page_copy(self) -> None:
        self.pages[3] = self.pages[3].replace("Option A costs 25.", "")
        self._write_deck()
        errors = validate(self.deck_path, self.contract_path, self.root)
        self.assertTrue(any("page task: visible text differs" in error for error in errors), errors)

    def test_unapproved_photo_on_textually_unchanged_task_fails_image_contract(self) -> None:
        self.pages[3] = self.pages[3].replace(
            "<footer>", '<img src="unapproved-photo.png"><footer>', 1
        )
        self._write_deck()
        errors = validate(self.deck_path, self.contract_path, self.root)
        self.assertTrue(any("page task: image src list differs from expected_images" in error for error in errors), errors)

    def test_missing_support_level_fails_copy_and_level_checks(self) -> None:
        self.pages[5] = self.pages[5].replace("<h2>HSK 4–6</h2>", "<h2>Challenge</h2>")
        self._write_deck()
        errors = validate(self.deck_path, self.contract_path, self.root)
        self.assertTrue(any("missing required support level 'HSK 4–6'" in error for error in errors), errors)
        self.assertTrue(any("page support-a: visible text differs" in error for error in errors), errors)

    def test_comic_text_overlay_fails_role_and_copy_checks(self) -> None:
        self.pages[2] = self.pages[2].replace("<img src=\"comic.png\">", "<img src=\"comic.png\"><span>Tell the story</span>")
        self._write_deck()
        errors = validate(self.deck_path, self.contract_path, self.root)
        self.assertTrue(any("comic image area must not contain text overlays" in error for error in errors), errors)
        self.assertTrue(any("comic image area contains non-image overlay elements" in error for error in errors), errors)

    def test_wrong_question_support_mapping_fails_pair_contract(self) -> None:
        contract = self._load_contract()
        contract["page_pairs"][0]["support_id"] = "support-b"
        self._write_contract(contract)
        errors = validate(self.deck_path, self.contract_path, self.root)
        self.assertTrue(any("support must immediately follow" in error for error in errors), errors)
        self.assertTrue(any("pair_key values differ" in error for error in errors), errors)
        self.assertTrue(any("topic 'Where to celebrate' missing from page support-b" in error for error in errors), errors)

    def test_route_card_style_drift_fails_reference_comparison(self) -> None:
        self.pages[1] = self.pages[1].replace("border-radius:20px", "border-radius:12px", 1)
        self._write_deck()
        errors = validate(self.deck_path, self.contract_path, self.root)
        self.assertTrue(any("route card 1 DOM or inline style differs from reference" in error for error in errors), errors)

    def test_added_empty_route_card_fails_expected_card_count(self) -> None:
        self.pages[1] = self.pages[1].replace("</div>\n      </section>", "<article class=\"route-card\"></article></div>\n      </section>", 1)
        self._write_deck()
        errors = validate(self.deck_path, self.contract_path, self.root)
        self.assertTrue(any("expected 3 route cards, found 4" in error for error in errors), errors)

    def test_route_columns_must_match_explicit_contract_count(self) -> None:
        self.pages[1] = self.pages[1].replace("repeat(3,1fr)", "repeat(4,1fr)", 1)
        self._write_deck()
        errors = validate(self.deck_path, self.contract_path, self.root)
        self.assertTrue(any("expected 3 route columns, found 4" in error for error in errors), errors)

    def test_unknown_role_is_rejected(self) -> None:
        contract = self._load_contract()
        contract["pages"][3]["role"] = "divider"
        self._write_contract(contract)
        errors = validate(self.deck_path, self.contract_path, self.root)
        self.assertTrue(any("page task: unsupported role 'divider'" in error for error in errors), errors)

    def test_cover_and_route_must_be_the_first_two_roles(self) -> None:
        contract = self._load_contract()
        contract["pages"][0]["role"] = "activity"
        self._write_contract(contract)
        errors = validate(self.deck_path, self.contract_path, self.root)
        self.assertTrue(any("first two page roles must be cover then route" in error for error in errors), errors)

    def test_data_idx_is_checked_when_deck_uses_it(self) -> None:
        for index, page in enumerate(self.pages):
            self.pages[index] = page.replace(
                'data-osd-stable-id=', f'data-idx="{index}" data-osd-stable-id=', 1
            )
        self._write_deck()
        self.assertEqual(validate(self.deck_path, self.contract_path, self.root), [])
        self.pages[4] = self.pages[4].replace('data-idx="4"', 'data-idx="8"', 1)
        self._write_deck()
        errors = validate(self.deck_path, self.contract_path, self.root)
        self.assertTrue(any("page data-idx: expected contiguous indexes" in error for error in errors), errors)

    def test_cover_geometry_drift_fails_reference_comparison(self) -> None:
        self.pages[0] = self.pages[0].replace("padding:110px 96px 68px", "padding:20px", 1)
        self._write_deck()
        errors = validate(self.deck_path, self.contract_path, self.root)
        self.assertTrue(any("cover wrapper padding differs" in error for error in errors), errors)

    def test_reviewed_copy_hash_drift_fails_contract(self) -> None:
        (self.root / "reviewed-copy.md").write_text("Changed reviewed copy.", encoding="utf-8")
        errors = validate(self.deck_path, self.contract_path, self.root)
        self.assertTrue(any("copy_inputs[1]: SHA-256 mismatch" in error for error in errors), errors)


if __name__ == "__main__":
    unittest.main()
