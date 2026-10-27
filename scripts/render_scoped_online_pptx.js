'use strict';
// Historical free-coordinate renderer. New production uses render_reference_online_pptx.py;
// build_scoped_online_pptx.py requires an actual reviewed native PPTX reference.
const fs = require('fs');
const pptxgen = require('pptxgenjs');
const spec = JSON.parse(fs.readFileSync(0, 'utf8'));
const ppt = new pptxgen();
ppt.layout = 'LAYOUT_WIDE';
ppt.author = 'Vinh University';
ppt.subject = 'Online preparation';
ppt.theme = { headFontFace: 'KaiTi', bodyFontFace: 'KaiTi', lang: 'zh-CN' };
for (const item of spec.slides) {
  const slide = ppt.addSlide();
  slide.background = { color: 'FFFFFF' };
  for (const element of item.elements) {
    const geometry = { x: element.x, y: element.y, w: element.w, h: element.h };
    if (element.type === 'text') {
      const parts = element.text.match(/[\p{Script=Latin}0-9À-ỹ]+|[^\p{Script=Latin}0-9À-ỹ]+/gu) || [];
      const runs = parts.map(text => ({ text, options: { fontFace: /^[\p{Script=Latin}0-9À-ỹ]/u.test(text) ? 'Times New Roman' : 'KaiTi' } }));
      slide.addText(runs, { ...geometry, fontFace: element.font === 'latin' ? 'Times New Roman' : 'KaiTi',
        fontSize: element.font_size, color: element.color || '17324D', bold: !!element.bold,
        align: element.align || 'left', valign: element.valign || 'mid', margin: 0.04,
        breakLine: false, lang: 'zh-CN' });
    } else if (element.type === 'image') {
      slide.addImage({ path: element.path, ...geometry, sizing: 'contain' });
    } else {
      slide.addShape(element.shape || 'rect', { ...geometry,
        line: { color: element.line_color || 'D4E1E5', transparency: element.line_transparency || 0 },
        fill: { color: element.fill_color || 'FFFFFF', transparency: element.fill_transparency || 0 } });
    }
  }
  if (item.notes) slide.addNotes(item.notes);
}
ppt.writeFile({ fileName: process.argv[2] }).catch((error) => { console.error(error); process.exitCode = 1; });
