"""Behavior-level regression controls for repeated OpenSlide page layouts."""

import importlib.util
import sys
from pathlib import Path
import unittest
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[1]
DECK = ROOT / "lessons/boya-elementary-i/lesson-13/10-design/open-slide-draft/w06-l13-l14/lesson-13-14-实体课.html"
LEGACY_FIXTURE = ROOT / "lessons/boya-elementary-i/lesson-13/10-design/open-slide-draft/w06-l13-l14/revision-20261022-before-comics/lesson-13-14-实体课.html"
CONTRACT = DECK.parent / "lesson-13-14-slide-contract.json"
sys.path.insert(0, str(ROOT / "scripts"))
import classroom_slide_contract as contract_checker

REFERENCE = ROOT / "lessons/boya-elementary-i/lesson-11/10-design/open-slide-draft/lesson-11-12-v09-readable/lesson-11-12-实体课.html"
EXPECTED_PAGE_TYPES = {
    "discussion": [
        "w06-life-vinh-shopping-question",
        "w06-life-vinh-shopping-support",
        "w06-life-vietnam-birthday-question",
        "w06-life-vietnam-birthday-support",
        "w06-life-taipei-birthday-question",
        "w06-life-taipei-birthday-support",
    ],
    "comic": ["w06-l13-comic", "w06-l14-comic"],
    "report": ["w06-l13-report", "w06-l14-report"],
}

spec = importlib.util.spec_from_file_location("open_slide_visual_consistency", ROOT / "scripts/check_open_slide_visual_consistency.py")
checker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)


class OpenSlideVisualConsistencyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = LEGACY_FIXTURE.read_text(encoding="utf-8")

    def check_source(self, source):
        original_read_tree = checker.read_tree

        def read_tree(path):
            if Path(path).resolve() == DECK.resolve():
                parser = checker.TreeParser()
                parser.feed(source)
                parser.close()
                return source, parser.root
            return original_read_tree(path)

        with patch.object(checker, "read_tree", side_effect=read_tree):
            return checker._check_legacy_w06(
                DECK,
                REFERENCE,
                expected_route_cards=4,
                expected_page_types=EXPECTED_PAGE_TYPES,
                expected_route_columns=4,
            )

    def with_extra_style(self, css):
        return self.source.replace("</head>", f"<style>{css}</style></head>", 1)

    def test_mixed_dom_text_keeps_original_reading_order(self):
        parser = checker.TreeParser()
        parser.feed('<p>预算<strong>200,000</strong>越南盾</p>')
        self.assertEqual(parser.root.text_content(), '预算200,000越南盾')

    def test_historical_w06_fixture_passes_legacy_checks(self):
        self.assertEqual(self.check_source(self.source), [])

    def test_current_deck_passes_reviewed_contract(self):
        self.assertEqual(contract_checker.validate(DECK, CONTRACT, ROOT), [])

    def test_current_contract_rejects_changed_price_and_comic(self):
        actual = DECK.read_text(encoding="utf-8")
        original_load = contract_checker._load_tree
        for before, after in (("240,000₫", "241,000₫"),
                              ("assets/comic-shopping-broken-bag.png", "assets/comic-birthday-rain.png")):
            with self.subTest(before=before):
                self.assertIn(before, actual)
                changed = actual.replace(before, after, 1)
                def load(path):
                    if Path(path).resolve() == DECK.resolve():
                        parser = contract_checker._DeckParser()
                        parser.feed(changed)
                        parser.close()
                        return changed, parser
                    return original_load(path)
                with patch.object(contract_checker, "_load_tree", side_effect=load):
                    self.assertTrue(contract_checker.validate(DECK, CONTRACT, ROOT))

    def test_route_grid_and_card_placement_regressions_fail(self):
        for columns in ("repeat(3,1fr)", "repeat(5,1fr)"):
            with self.subTest(columns=columns):
                bad_grid = self.source.replace(
                    'style="display:grid;grid-template-columns:repeat(4,1fr);gap:26px"',
                    f'style="display:grid;grid-template-columns:{columns};gap:26px"',
                    1,
                )
                self.assertTrue(any("route grid must use 4 equal-width columns" in item for item in self.check_source(bad_grid)))

        bad_card = self.with_extra_style(
            ".route > div > .route-card:nth-child(4){grid-column:2/4}"
        )
        self.assertTrue(any("unreferenced component override" in item for item in self.check_source(bad_card)))

    def test_slide_six_has_no_author_commentary_or_process_copy(self):
        for text in ("课堂模拟商品与价格", "先各自选择，再比较优缺点", "没有唯一标准答案"):
            with self.subTest(text=text):
                self.assertNotIn(text, self.source)

    def test_edge_and_activity_label_overrides_fail(self):
        bad_padding = self.with_extra_style(".activity{padding:0}")
        self.assertTrue(any(".activity padding" in item for item in self.check_source(bad_padding)))

        bad_label = self.with_extra_style(".activity-label{right:0;top:0}")
        self.assertTrue(any("activity label offsets" in item for item in self.check_source(bad_label)))

    def test_higher_specificity_route_card_override_fails(self):
        bad_height = self.with_extra_style(
            ".route .route-card:not(.never){height:120px!important}"
        )
        self.assertTrue(any("unreferenced component override" in item for item in self.check_source(bad_height)))

    def test_route_card_typography_override_fails(self):
        bad_type = self.with_extra_style(".route .route-card h2.special{font-size:20px!important}")
        self.assertTrue(any("unreferenced component override" in item for item in self.check_source(bad_type)))

    def test_removing_approved_page_type_markers_fails(self):
        mutations = {
            "discussion": (
                'class="os-page activity discussion question-page" data-idx="12" data-osd-stable-id="w06-life-vinh-shopping-question"',
                'class="os-page activity question-page" data-idx="12" data-osd-stable-id="w06-life-vinh-shopping-question"',
            ),
            "comic": (
                'class="os-page activity comic-page" data-idx="6" data-osd-stable-id="w06-l13-comic"',
                'class="os-page activity" data-idx="6" data-osd-stable-id="w06-l13-comic"',
            ),
            "report": ('class="report-phrase"', 'class="report-box"'),
        }
        for page_type, (before, after) in mutations.items():
            with self.subTest(page_type=page_type):
                bad_type = self.source.replace(before, after, 1)
                errors = self.check_source(bad_type)
                self.assertTrue(any(f"{page_type} page IDs differ" in item for item in errors))

    def test_page_fit_modifiers_must_be_attached(self):
        mutations = (
            ('w06-party" data-idx="10" data-osd-stable-id="w06-l14-party-plan"',
             'data-idx="10" data-osd-stable-id="w06-l14-party-plan"'),
            ('discussion support-page" data-idx="13" data-osd-stable-id="w06-life-vinh-shopping-support"',
             'discussion" data-idx="13" data-osd-stable-id="w06-life-vinh-shopping-support"'),
        )
        for before, after in mutations:
            with self.subTest(modifier=before):
                self.assertIn(before, self.source)
                errors = self.check_source(self.source.replace(before, after, 1))
                expected = "page-fit modifier" if "w06-party" in before else "discussion support-page shell"
                self.assertTrue(any(expected in item for item in errors))

    def test_birthday_plan_has_no_photo_options_and_keeps_student_choice(self):
        party_start = self.source.index('data-osd-stable-id="w06-l14-party-plan"')
        party_section_start = self.source.rfind("<section", 0, party_start)
        party_end = self.source.index("</section>", party_start) + len("</section>")
        party = self.source[party_section_start:party_end]
        self.assertNotIn("<img", party)
        self.assertNotIn("party-card", party)
        self.assertIn("一起决定：什么时候、在哪、做什么、特色、理由", party)
        self.assertIn("比较室内和室外活动", party)

        preset_choice = self.source.replace(
            "一起决定：什么时候、在哪、做什么、特色、理由",
            "一起决定：什么时候、在哪、做什么、特色、理由；选择火锅、奶茶或唱歌。",
            1,
        )
        self.assertTrue(any("leave activity choices to students" in item for item in self.check_source(preset_choice)))

    def test_three_open_discussions_use_question_then_paired_support_pages(self):
        self.assertEqual(self.source.count('class="os-page activity discussion question-page"'), 3)
        self.assertEqual(self.source.count('class="os-page activity discussion support-page"'), 3)
        self.assertIn("18页", self.source)
        self.assertIn("if(pages.length!==18)", self.source)
        self.assertIn("font-size:40px!important", self.source)
        self.assertIn(".discussion.support-page .level p{font-size:50px!important;line-height:1.3!important", self.source)
        for old_id in ("w06-life-vinh-shopping-hsk13", "w06-life-vinh-shopping-hsk46"):
            self.assertNotIn(old_id, self.source)

    def test_paired_support_page_rejects_repeated_question_or_missing_level(self):
        repeated_question = self.source.replace(
            '<main><div class="levels">',
            '<main><p class="question">在荣市买衣服，你比较喜欢去服装店，还是在网上买？为什么？</p><div class="levels">',
            1,
        )
        self.assertTrue(any("support page must not repeat the question" in item for item in self.check_source(repeated_question)))

        missing_level = self.source.replace('<br>', '').replace(
            '<article class="level challenge" data-osd-step="true"><h2>HSK 4–6</h2><p>请选两个地方，比较优点和缺点。</p></article>',
            "",
            1,
        )
        self.assertTrue(any("support page must show both HSK levels together" in item for item in self.check_source(missing_level)))

    def test_slide_ten_reuses_v02_answer_without_added_comparison_copy(self):
        self.assertIn("我们推荐____。它是____色的，质量____，价格是____越南盾。", self.source.replace("<br>", ""))
        self.assertIn("HSK 1–3｜参考回答", self.source)
        self.assertIn("我们打算在____庆祝。先____，然后____，最后____。那个餐厅/咖啡馆/地方的特色是____。我们这样安排，是因为____。", self.source.replace("<br>", ""))
        self.assertNotIn("虽然A款要____越南盾", self.source)
        self.assertNotIn("十二月二十五日晚上六点，我们先", self.source)

    def test_student_facing_task_copy_cannot_shrink_below_classroom_baseline(self):
        for selector, message in (
            (".retell-levels .level p", ".retell-levels .level p student-facing task text must be at least 45px"),
            (".task-levels .level p", ".task-levels .level p student-facing task text must be at least 45px"),
            (".party-levels .level p", ".party-levels .level p student-facing task text must be at least 45px"),
            (".discussion.support-page .level p", "paired discussion support text must be at least 45px"),
        ):
            with self.subTest(selector=selector):
                bad_size = self.with_extra_style(f"{selector}{{font-size:32px!important}}")
                self.assertTrue(any(message in item for item in self.check_source(bad_size)))

    def test_short_or_empty_answer_models_fail(self):
        short_answer = self.source.replace('<br>', '').replace(
            "我想带他去____。我们先____，然后____。我准备送他____，因为____。",
            "我们去____。",
            1,
        )
        self.assertTrue(self.check_source(short_answer))

        blanks_only = self.source.replace('<br>', '').replace(
            "我想带他去____。我们先____，然后____。我准备送他____，因为____。",
            "____，____，____，____，____，____，____，____。",
            1,
        )
        self.assertTrue(any("usable Chinese" in item for item in self.check_source(blanks_only)))


if __name__ == "__main__":
    unittest.main()
