from __future__ import annotations

import sys
import json
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))

from production_gate import check_classroom_html_draft, validate_native_openslide_source
from agent_loop import normalize_output_dir
from lesson_context import resolve_lesson_context


class NativeOpenSlideGateTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.output = Path(self.temp_dir.name)
        self.deck_id = "y1-w12-l18-l19"
        self.source = self.output / "slides" / self.deck_id / "index.tsx"
        self.source.parent.mkdir(parents=True)
        self.source.write_text(
            """export function Slides() {
  return <>
    <section data-osd-stable-id=\"y1-w12-l18-l19-01\"><h1 data-osd-edit-boundary=\"true\">标题</h1></section>
    <section data-osd-stable-id=\"y1-w12-l18-l19-02\"><p data-osd-edit-boundary=\"true\">内容</p></section>
  </>;
}
""",
            encoding="utf-8",
        )

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def test_native_pages_with_editable_boundaries_pass(self) -> None:
        result = validate_native_openslide_source(self.output, self.deck_id)
        self.assertEqual(result["status"], "ready")
        self.assertEqual(result["page_count"], 2)
        self.assertEqual(result["editable_text_boundary_count"], 2)

    def test_html_file_blocks_native_output(self) -> None:
        (self.source.parent / "embedded.html").write_text("<section>wrapped</section>", encoding="utf-8")
        result = validate_native_openslide_source(self.output, self.deck_id)
        self.assertEqual(result["status"], "blocked")
        self.assertTrue(any("HTML file" in item for item in result["blockers"]))

    def test_workspace_shell_html_is_not_part_of_the_deck_source(self) -> None:
        (self.output / "index.html").write_text("<div id=\"root\"></div>", encoding="utf-8")
        result = validate_native_openslide_source(self.output, self.deck_id)
        self.assertEqual(result["status"], "ready")

    def test_iframe_blocks_native_output(self) -> None:
        self.source.write_text(
            '<section data-osd-stable-id="y1-w12-l18-l19-01"><div data-osd-edit-boundary="true" />'
            '<iframe srcDoc="<h1>wrapped</h1>" /></section>',
            encoding="utf-8",
        )
        result = validate_native_openslide_source(self.output, self.deck_id)
        self.assertEqual(result["status"], "blocked")
        self.assertTrue(any("embedding mechanism" in item for item in result["blockers"]))

    def test_native_react_text_without_custom_boundary_markers_is_allowed(self) -> None:
        self.source.write_text(
            '<section data-osd-stable-id="y1-w12-l18-l19-01"><p>Direct React text</p></section>',
            encoding="utf-8",
        )
        result = validate_native_openslide_source(self.output, self.deck_id)
        self.assertEqual(result["status"], "ready")
        self.assertEqual(result["editable_text_boundary_count"], 0)

    def test_new_html_draft_gate_is_disabled(self) -> None:
        result = check_classroom_html_draft("boya-elementary-i:lesson-18")
        self.assertEqual(result["status"], "blocked")
        self.assertTrue(any("disabled" in item for item in result["blockers"]))

    def synthetic_project(self):
        project = self.output / 'synthetic-project'
        lesson = project / 'lessons/boya-quasi-intermediate-i/lesson-06'
        lesson.mkdir(parents=True)
        (project / 'course').mkdir()
        (project / 'project.config.json').write_text(json.dumps({'lesson_registry': 'course/lesson-registry.json'}))
        (project / 'course/lesson-registry.json').write_text(json.dumps({'lessons': [{
            'lesson_key': 'boya-quasi-intermediate-i:lesson-06',
            'textbook_id': 'boya-quasi-intermediate-i', 'lesson_id': 'lesson-06',
            'lesson_path': 'lessons/boya-quasi-intermediate-i/lesson-06', 'offering_ids': ['2026-fall']}]}))
        return project

    def test_native_agent_route_uses_lesson_offering_and_artifact(self) -> None:
        project = self.synthetic_project()
        context = resolve_lesson_context(
            project, "boya-quasi-intermediate-i:lesson-06", "2026-fall"
        )
        output = normalize_output_dir(
            project, context, "classroom-native", "draft", None, "y2-w10-l06"
        )
        self.assertEqual(
            output,
            "lessons/boya-quasi-intermediate-i/lesson-06/10-design/"
            "open-slide-draft/2026-fall/y2-w10-l06",
        )

    def test_agent_route_rejects_html_authoring(self) -> None:
        project = self.synthetic_project()
        context = resolve_lesson_context(
            project, "boya-quasi-intermediate-i:lesson-06", "2026-fall"
        )
        with self.assertRaisesRegex(ValueError, "classroom HTML drafts are disabled"):
            normalize_output_dir(project, context, "classroom-html", "draft", None)


if __name__ == "__main__":
    unittest.main()
