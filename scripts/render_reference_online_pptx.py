"""Copy reviewed native slide layouts; replace only declared text and pictures."""
from copy import deepcopy
from io import BytesIO
from pathlib import Path
import re

from pptx import Presentation
from pptx.oxml.xmlchemy import OxmlElement
from pptx.oxml.ns import qn
from pptx.util import Inches


def replace_text(shape, text, font_size=None):
    body = shape.text_frame._txBody
    original = body.find(qn('a:p'))
    props = original.find(qn('a:pPr'))
    run = original.find(qn('a:r'))
    run_props = run.find(qn('a:rPr')) if run is not None else None
    for paragraph in list(body.findall(qn('a:p'))):
        body.remove(paragraph)
    for line in text.split('\n'):
        paragraph = OxmlElement('a:p')
        if props is not None:
            paragraph.append(deepcopy(props))
        for part in re.findall(r'[\u3400-\u9fff]+|[^\u3400-\u9fff]+', line):
            r = OxmlElement('a:r')
            rp = deepcopy(run_props) if run_props is not None else OxmlElement('a:rPr')
            if font_size is not None:
                rp.set('sz', str(round(font_size * 100)))
            for tag, font in [('latin', 'Times New Roman'), ('ea', 'KaiTi'), ('cs', 'Times New Roman')]:
                node = rp.find(qn('a:' + tag))
                if node is None:
                    node = OxmlElement('a:' + tag)
                    rp.append(node)
                node.set('typeface', font)
            r.append(rp)
            t = OxmlElement('a:t')
            t.text = part
            r.append(t)
            paragraph.append(r)
        body.append(paragraph)


def render(spec, target):
    source = Presentation(spec['layout_reference']['path'])
    result = Presentation()
    result.slide_width, result.slide_height = source.slide_width, source.slide_height
    for item in spec['slides']:
        template = source.slides[item['reference_slide'] - 1]
        page = result.slides.add_slide(result.slide_layouts[6])
        bindings = {str(e['reference_shape_id']): e for e in item['elements']}
        removed = set(map(str, item.get('remove_shape_ids', [])))
        for shape in template.shapes:
            sid = str(shape.shape_id)
            if sid in removed:
                continue
            element = deepcopy(shape.element)
            if shape.shape_type == 13:
                data = (Path(bindings[sid]['path']).read_bytes()
                        if sid in bindings else shape.image.blob)
                _, rid = page.part.get_or_add_image_part(BytesIO(data))
                element.find('.//' + qn('a:blip')).set(qn('r:embed'), rid)
                # Reference pictures are fitted to their original native frames.
                for crop in element.findall('.//' + qn('a:srcRect')):
                    crop.getparent().remove(crop)
            page.shapes._spTree.insert_element_before(element, 'p:extLst')
            cloned = page.shapes[-1]
            if shape.has_text_frame:
                binding = bindings.get(sid, {})
                for field, attr in [('x', 'left'), ('y', 'top'), ('w', 'width'), ('h', 'height')]:
                    if field in binding:
                        setattr(cloned, attr, Inches(binding[field]))
                cloned.text_frame.word_wrap = True
                replace_text(cloned, binding.get('text', ''), binding.get('font_size'))
            elif shape.has_table:
                binding = bindings[sid]
                for row_index, row in enumerate(binding['cells']):
                    for column_index, text in enumerate(row):
                        replace_text(cloned.table.cell(row_index, column_index), text, binding['font_size'])
        if item.get('notes'):
            page.notes_slide.notes_text_frame.text = item['notes']
    result.core_properties.title = spec.get('title', '在线预习')
    result.core_properties.author = 'Vinh University'
    result.save(target)
