const fs = require('fs');
const path = require('path');
const { toSimplified } = require('./simplify_chinese');
const designSystem = require('./boya_design_system');

// Shared visual master for all future lesson PPTX files.
// This is intentionally aligned with the approved Lesson 01 V4 visual system:
// warm paper, KaiTi, pastel blocks, thin ink lines, and framed illustrations.
const projectRoot = path.resolve(__dirname, '..');
const projectConfig = JSON.parse(fs.readFileSync(path.join(projectRoot, 'project.config.json'), 'utf8'));

const CJK_FONT = designSystem.fonts.cjk;
const LATIN_FONT = designSystem.fonts.latin;
const COLORS = designSystem.colors;

function simplify(value) {
  return toSimplified(String(value == null ? '' : value));
}

function clean(value) {
  return simplify(value).replace(/\s+/g, ' ').trim();
}

function addText(slide, value, x, y, w, h, options = {}) {
  slide.addText(simplify(value), {
    x, y, w, h,
    fontFace: CJK_FONT,
    fontSize: 22,
    color: COLORS.ink,
    margin: 0,
    fit: 'shrink',
    valign: 'mid',
    lang: 'zh-CN',
    breakLine: true,
    paraSpaceAfterPt: 0,
    ...options
  });
}

function addLatin(slide, value, x, y, w, h, options = {}) {
  slide.addText(String(value), {
    x, y, w, h,
    fontFace: LATIN_FONT,
    fontSize: 14,
    color: COLORS.muted,
    margin: 0,
    fit: 'shrink',
    valign: 'mid',
    lang: 'en-US',
    breakLine: true,
    paraSpaceAfterPt: 0,
    ...options
  });
}

function addLine(slide, x, y, w, color = COLORS.line, pt = 0.7) {
  slide.addShape('line', { x, y, w, h: 0, line: { color, pt } });
}

function addHeader(slide, page, title = '', context = {}) {
  const lessonLabel = clean(context.lessonLabel || context.headerLabel || '博雅汉语听说');
  addText(slide, lessonLabel, 0.72, 0.26, context.headerWidth || 5.4, 0.24, { fontSize: 11, color: COLORS.muted, bold: true });
  addText(slide, String(page).padStart(2, '0'), 12.0, 0.26, 0.62, 0.24, { fontSize: 11, color: COLORS.muted, bold: true, align: 'right' });
  addLine(slide, 0.72, 0.66, 11.9, COLORS.line, 0.8);
  slide.addShape('rect', { x: 0.72, y: 0.64, w: 0.48, h: 0.04, fill: { color: COLORS.purple }, line: { color: COLORS.purple, transparency: 100 } });
  if (title) {
    const size = title.length > 28 ? 23 : title.length > 20 ? 27 : 34;
    addText(slide, title, 0.78, 0.9, 11.75, 0.58, { fontSize: size, bold: true, valign: 'top' });
  }
}

function addAccent(slide, x, y, w, color = COLORS.purple, h = 0.08) {
  slide.addShape('roundRect', { x, y, w, h, rectRadius: 0.03, fill: { color }, line: { color, transparency: 100 } });
}

const imageCache = new Map();

function imageData(filePath) {
  const resolved = path.resolve(filePath);
  if (!imageCache.has(resolved)) {
    const ext = path.extname(resolved).toLowerCase();
    const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
    imageCache.set(resolved, `data:${mime};base64,${fs.readFileSync(resolved).toString('base64')}`);
  }
  return imageCache.get(resolved);
}

function addImageFrame(slide, filePath, x, y, size, angle = 0) {
  slide.addShape('roundRect', {
    x: x + 0.1, y: y + 0.12, w: size, h: size,
    rectRadius: 0.06,
    fill: { color: COLORS.shadow, transparency: 18 },
    line: { color: COLORS.shadow, transparency: 100 },
    rotate: angle
  });
  slide.addShape('roundRect', {
    x, y, w: size, h: size,
    rectRadius: 0.06,
    fill: { color: COLORS.white },
    line: { color: COLORS.ink, pt: 0.6 },
    rotate: angle
  });
  slide.addImage({ data: imageData(filePath), x: x + 0.08, y: y + 0.08, w: size - 0.16, h: size - 0.16, rotate: angle });
}

function addImagePanel(slide, files, x, y, w, h, fill = COLORS.mint, variant = 0) {
  if (!files || !files.length) return;
  slide.addShape('roundRect', { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: fill, transparency: 100 } });
  if (variant % 2 === 1) {
    slide.addShape('arc', { x: x + w - 1.72, y: y + 0.16, w: 1.5, h: 1.5, rotate: 180, fill: { color: COLORS.white, transparency: 48 }, line: { color: COLORS.white, transparency: 100 } });
  }
  if (files.length === 1) {
    const size = Math.min(w - 0.42, h - 0.42);
    addImageFrame(slide, files[0], x + (w - size) / 2, y + (h - size) / 2, size, variant % 3 === 0 ? -1.2 : 1.1);
    return;
  }
  const size = Math.min((w - 0.56) / 2, h - 0.42);
  const total = size * 2 + 0.16;
  const startX = x + (w - total) / 2;
  addImageFrame(slide, files[0], startX, y + (h - size) / 2, size, -1.1);
  addImageFrame(slide, files[1], startX + size + 0.16, y + (h - size) / 2, size, 1.1);
}

function addMaterial(slide, material, x, y, w, color = COLORS.yellow) {
  if (!material) return;
  addAccent(slide, x, y + 0.02, 0.08, color, 0.52);
  addText(slide, '材料', x + 0.22, y, 0.46, 0.22, { fontSize: 10, color: COLORS.muted, bold: true });
  const parts = String(material).replace(/^材料[：:]\s*/, '').replace(/：/g, '\n').replace(/、/g, ' · ').split('\n');
  addText(slide, parts[0], x + 0.82, y - 0.02, w - 0.82, 0.25, { fontSize: 15, color: COLORS.ink, bold: true });
  if (parts[1]) addText(slide, parts.slice(1).join(' · '), x + 0.82, y + 0.25, w - 0.82, 0.22, { fontSize: 11.5, color: COLORS.muted, bold: true });
}

function addOutcome(slide, outcome, x, y, w) {
  if (!outcome) return;
  addText(slide, '完成：' + outcome, x, y, w, 0.36, { fontSize: 14, color: COLORS.teal, bold: true });
  addLine(slide, x, y + 0.45, w, COLORS.mintDeep, 1.3);
}

function addTopics(slide, topics, x, y, w) {
  if (!topics || !topics.length) return;
  const columns = topics.length > 4 ? 3 : topics.length;
  const gap = 0.18;
  const rowGap = topics.length > 4 ? 0.16 : 0;
  const chipW = (w - gap * (columns - 1)) / columns;
  const fills = [COLORS.mint, COLORS.yellowSoft, COLORS.lilac, COLORS.coralSoft];
  topics.forEach((topic, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const chipX = x + column * (chipW + gap);
    const chipY = y + row * (0.58 + rowGap);
    addText(slide, topic, chipX, chipY, chipW, 0.32, { fontSize: 20, color: COLORS.teal, bold: true, align: 'center' });
    addAccent(slide, chipX + 0.08, chipY + 0.42, chipW - 0.16, fills[index % fills.length], 0.07);
  });
}

module.exports = {
  CJK_FONT,
  LATIN_FONT,
  COLORS,
  simplify,
  clean,
  addText,
  addLatin,
  addLine,
  addHeader,
  addAccent,
  addImageFrame,
  addImagePanel,
  addMaterial,
  addOutcome,
  addTopics
};
