const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const PptxGenJS = require('pptxgenjs');

const projectRoot = path.resolve(__dirname, '..');
const projectConfig = JSON.parse(fs.readFileSync(path.join(projectRoot, 'project.config.json'), 'utf8'));
const lessonRoot = path.join(projectRoot, projectConfig.lesson_root);
const outputDir = process.env.BOYA_PROTOTYPE_DRAFT_DIR || path.join(lessonRoot, '10-design/visual-prototype-draft');
const assetDir = path.join(outputDir, 'assets');
const contactSheet = path.join(
  lessonRoot,
  '10-design/visual-storyboard/assets/lesson-01-textbook-contact-sheet-4x4.png'
);
const pptxPath = path.join(outputDir, 'lesson-01-visual-prototype.pptx');

const W = 13.333;
const H = 7.5;
const FONT = 'SimHei';
const COLORS = {
  paper: 'F8FAFC',
  paperWarm: 'FCFBF7',
  ink: '172033',
  slate: '5F6E82',
  blue: '3D70D9',
  blueSoft: 'E6EEF9',
  coral: 'E97862',
  coralSoft: 'F8E6E0',
  teal: '4B9D9A',
  tealSoft: 'E2F0EE',
  line: 'C9D5E2',
  white: 'FFFFFF'
};

function assertProductionGate() {
  execFileSync(process.env.BOYA_PYTHON || 'python3', [
    path.join(projectRoot, 'scripts/production_gate.py'),
    '--purpose', 'prototype',
    '--output-dir', outputDir,
  ], { stdio: 'inherit' });
}

assertProductionGate();
fs.mkdirSync(assetDir, { recursive: true });

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function ensureTextbookCells() {
  if (!fs.existsSync(contactSheet)) {
    throw new Error(`Missing approved contact sheet: ${contactSheet}`);
  }
  const sips = '/usr/bin/sips';
  if (!fs.existsSync(sips)) {
    throw new Error('macOS sips is required to prepare the approved contact-sheet cells.');
  }
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const number = String(row * 4 + col + 1).padStart(2, '0');
      const output = path.join(assetDir, `textbook-cell-${number}.png`);
      execFileSync(sips, [
        '-c', '295', '295',
        '--cropOffset', String(15 + row * 310), String(15 + col * 310),
        contactSheet,
        '--out', output
      ], { stdio: 'ignore' });
    }
  }
}

function cell(number) {
  return path.join(assetDir, `textbook-cell-${String(number).padStart(2, '0')}.png`);
}

function addText(slide, text, x, y, w, h, options = {}) {
  slide.addText(text, {
    x, y, w, h,
    fontFace: FONT,
    fontSize: 22,
    color: COLORS.ink,
    margin: 0,
    fit: 'shrink',
    valign: 'mid',
    breakLine: false,
    lang: 'zh-CN',
    paraSpaceAfterPt: 0,
    ...options
  });
}

function addHeader(slide, pageNumber, background = COLORS.paper) {
  slide.background = { color: background };
  addText(slide, '第一课', 0.7, 0.32, 1.2, 0.28, { fontSize: 15, color: COLORS.slate, bold: true });
  addText(slide, String(pageNumber).padStart(2, '0'), 11.95, 0.32, 0.65, 0.28, { fontSize: 15, color: COLORS.slate, bold: true, align: 'right' });
  slide.addShape('line', {
    x: 0.7, y: 0.78, w: 11.95, h: 0,
    line: { color: COLORS.line, pt: 1 }
  });
}

function addPill(slide, text, x, y, w, color = COLORS.blue, textColor = COLORS.white) {
  slide.addShape('roundRect', {
    x, y, w, h: 0.42,
    rectRadius: 0.08,
    fill: { color },
    line: { color, transparency: 100 }
  });
  addText(slide, text, x + 0.08, y + 0.02, w - 0.16, 0.34, {
    fontSize: 14,
    color: textColor,
    bold: true,
    align: 'center'
  });
}

function addImageCard(slide, number, x, y, w, h, options = {}) {
  const border = options.border || COLORS.line;
  slide.addShape('roundRect', {
    x, y, w, h,
    rectRadius: 0.08,
    fill: { color: COLORS.white },
    line: { color: border, pt: options.borderPt || 1.2 }
  });
  const inset = options.inset || 0.08;
  slide.addImage({ path: cell(number), x: x + inset, y: y + inset, w: w - inset * 2, h: h - inset * 2 });
}

function addStep(slide, number, label, x, y, color) {
  slide.addShape('ellipse', {
    x, y, w: 0.42, h: 0.42,
    fill: { color },
    line: { color, transparency: 100 }
  });
  addText(slide, String(number), x, y + 0.02, 0.42, 0.3, { fontSize: 14, color: COLORS.white, bold: true, align: 'center' });
  addText(slide, label, x + 0.62, y - 0.01, 2.7, 0.42, { fontSize: 24, color: COLORS.ink, bold: true });
}

function addAudioButton(slide, label, x, y, color = COLORS.coral) {
  slide.addShape('roundRect', {
    x, y, w: 1.95, h: 0.56,
    rectRadius: 0.09,
    fill: { color },
    line: { color, transparency: 100 }
  });
  addText(slide, `▶  ${label}`, x + 0.13, y + 0.06, 1.7, 0.4, {
    fontSize: 17,
    color: COLORS.white,
    bold: true,
    align: 'center'
  });
}

function writeManifest() {
  const manifest = {
    package: 'lesson-01-visual-prototype',
    generated_at: new Date().toISOString(),
    status: 'pending_adam_review',
    format: 'native-pptx-only',
    html_required: false,
    slide_count: 6,
    source_contact_sheet: 'lessons/lesson-01/10-design/visual-storyboard/assets/lesson-01-textbook-contact-sheet-4x4.png',
    source_contact_sheet_status: 'approved_by_adam_2026-08-20',
    visual_style: 'educational textbook line-art; thin grey-blue outlines; muted pastel fills; pale background; natural human proportions',
    student_language_policy: '简体中文；学生画面只呈现当前动作',
    visible_teacher_notes: false,
    slides: [
      { number: 1, title: '你的名字有什么意思？', role: '开场', image_cells: [1] },
      { number: 2, title: '学完这课后，我能……', role: '学习表现', image_cells: [5, 13, 16] },
      { number: 3, title: '第一部分｜先认识自己的名字', role: 'section divider', image_cells: [4] },
      { number: 4, title: '先听大意', role: '听力操作', image_cells: [5] },
      { number: 5, title: '起名儿公司', role: '任务操作', image_cells: [13] },
      { number: 6, title: '交换资料，讲给同伴听', role: '资料交换与表达', image_cells: [15, 16] }
    ],
    assets: Array.from({ length: 16 }, (_, index) => `textbook-cell-${String(index + 1).padStart(2, '0')}.png`),
    pptx_sha256: sha256(pptxPath)
  };
  fs.writeFileSync(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
}

function writeReview() {
  const review = `# 第一课视觉 Prototype

状态：**待审阅**

## 六张页面

1. 你的名字有什么意思？——开场
2. 学完这课后，我能……——学习表现
3. 第一部分｜先认识自己的名字——section divider
4. 先听大意——听力操作
5. 起名儿公司——任务操作
6. 交换资料，讲给同伴听——资料交换与表达

## 视觉规范

- 使用已批准的 4×4 教材插画 contact sheet。
- 画面采用柔和教材线稿、灰蓝细线、低饱和粉彩和浅色背景。
- 学生端全部使用简体中文；每页只保留一个主要动作。
- 页面使用 16:9 原生可编辑 PPTX，图片与文字均可编辑。
- 不使用照片、抽象波形、装饰性 UI 或制作分类文字。

## 审阅重点

- 教材插画风格是否可以沿用到完整 PPTX。
- section divider 是否足够清楚。
- 学生是否能立即看懂每页要做什么。
- 图片比例、字级、留白和投影可读性是否合适。
`;
  fs.writeFileSync(path.join(outputDir, 'prototype-review.md'), review);
}

async function build() {
  ensureTextbookCells();

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = '榮市大學華語聽說課程';
  pptx.company = '榮市大學';
  pptx.subject = '第一課中國人的姓名';
  pptx.title = '第一課｜中國人的姓名';
  pptx.lang = 'zh-CN';
  pptx.theme = { headFontFace: FONT, bodyFontFace: FONT, lang: 'zh-CN' };

  // 01 — opening
  {
    const slide = pptx.addSlide();
    addHeader(slide, 1, COLORS.paperWarm);
    addPill(slide, '中国人的姓名', 0.72, 1.18, 1.72, COLORS.blue);
    addText(slide, '你的名字\n有什么意思？', 0.72, 1.88, 5.6, 1.45, { fontSize: 39, bold: true, breakLine: true, valign: 'top' });
    addText(slide, '先听一听，再问一问。', 0.75, 3.62, 4.8, 0.42, { fontSize: 22, color: COLORS.slate });
    slide.addShape('line', { x: 0.75, y: 4.45, w: 4.5, h: 0, line: { color: COLORS.coral, pt: 2 } });
    addText(slide, '姓  ·  名  ·  意思', 0.75, 4.72, 4.6, 0.45, { fontSize: 23, color: COLORS.blue, bold: true });
    addImageCard(slide, 1, 6.55, 1.18, 5.72, 5.72, { border: COLORS.blueSoft, borderPt: 1.5, inset: 0.1 });
  }

  // 02 — student-facing performance
  {
    const slide = pptx.addSlide();
    addHeader(slide, 2);
    addText(slide, '学完这课后，我能……', 0.72, 1.15, 6.0, 0.68, { fontSize: 38, bold: true });
    addText(slide, '今天用听和说完成四件事。', 0.75, 1.9, 4.9, 0.38, { fontSize: 18, color: COLORS.slate });
    const rows = [
      ['听懂姓名和姓氏的对话', COLORS.blue],
      ['介绍自己的姓名和姓氏', COLORS.coral],
      ['问、答，再问一个问题', COLORS.teal],
      ['给别人起一个中文名，说明理由', 'B28B32']
    ];
    rows.forEach(([label, color], index) => {
      const y = 2.55 + index * 0.78;
      slide.addShape('roundRect', { x: 0.75, y, w: 6.0, h: 0.56, rectRadius: 0.06, fill: { color: COLORS.white }, line: { color: COLORS.line, pt: 0.8 } });
      slide.addShape('ellipse', { x: 0.92, y: y + 0.12, w: 0.3, h: 0.3, fill: { color }, line: { color, transparency: 100 } });
      addText(slide, label, 1.42, y + 0.06, 5.0, 0.42, { fontSize: 20, bold: true });
    });
    addImageCard(slide, 5, 8.0, 1.22, 2.05, 2.05, { border: COLORS.blueSoft, inset: 0.07 });
    addImageCard(slide, 13, 10.2, 1.22, 2.05, 2.05, { border: COLORS.coralSoft, inset: 0.07 });
    addImageCard(slide, 16, 8.0, 3.72, 4.25, 2.75, { border: COLORS.tealSoft, inset: 0.07 });
  }

  // 03 — section divider
  {
    const slide = pptx.addSlide();
    addHeader(slide, 3, COLORS.paperWarm);
    slide.addShape('rect', { x: 0.72, y: 1.28, w: 0.1, h: 4.7, fill: { color: COLORS.blue }, line: { color: COLORS.blue, transparency: 100 } });
    addText(slide, '第一部分', 1.12, 1.48, 2.5, 0.38, { fontSize: 21, color: COLORS.blue, bold: true });
    addText(slide, '先认识\n自己的名字', 1.1, 2.0, 5.0, 1.45, { fontSize: 42, bold: true, breakLine: true, valign: 'top' });
    addText(slide, '你的名字有什么意思？', 1.12, 3.9, 4.8, 0.45, { fontSize: 23, color: COLORS.slate });
    addPill(slide, '先和同伴说一说', 1.12, 5.12, 2.45, COLORS.coral);
    addImageCard(slide, 4, 7.05, 1.35, 5.35, 5.35, { border: COLORS.blueSoft, inset: 0.1 });
  }

  // 04 — listening operation
  {
    const slide = pptx.addSlide();
    addHeader(slide, 4);
    addText(slide, '先听大意', 0.72, 1.24, 4.8, 0.68, { fontSize: 43, bold: true });
    addText(slide, '第一次听：回答三个问题。', 0.75, 2.05, 5.0, 0.42, { fontSize: 20, color: COLORS.slate });
    addAudioButton(slide, '音频 1-2', 0.75, 2.82, COLORS.coral);
    slide.addShape('roundRect', { x: 0.75, y: 3.75, w: 5.35, h: 1.25, rectRadius: 0.08, fill: { color: COLORS.blueSoft }, line: { color: COLORS.blueSoft, transparency: 100 } });
    addText(slide, '听完以后，和同伴说一说：\n你听到了什么？', 1.08, 4.03, 4.7, 0.72, { fontSize: 22, bold: true, breakLine: true });
    addText(slide, '先听，再说。', 0.77, 5.55, 3.0, 0.35, { fontSize: 19, color: COLORS.blue, bold: true });
    addImageCard(slide, 5, 7.0, 1.2, 5.5, 5.5, { border: COLORS.coralSoft, inset: 0.1 });
  }

  // 05 — action-oriented naming task
  {
    const slide = pptx.addSlide();
    addHeader(slide, 5, COLORS.paperWarm);
    addPill(slide, '一起完成任务', 0.72, 1.15, 1.8, COLORS.teal);
    addText(slide, '起名儿公司', 0.72, 1.85, 5.2, 0.75, { fontSize: 45, bold: true });
    addText(slide, '先问清楚，再提出一个名字。', 0.75, 2.72, 5.3, 0.42, { fontSize: 20, color: COLORS.slate });
    addStep(slide, 1, '问要求', 0.82, 3.62, COLORS.blue);
    addStep(slide, 2, '想名字', 0.82, 4.42, COLORS.coral);
    addStep(slide, 3, '说理由', 0.82, 5.22, COLORS.teal);
    addText(slide, '客户会问：为什么？', 0.82, 6.12, 4.8, 0.38, { fontSize: 20, color: COLORS.coral, bold: true });
    addImageCard(slide, 13, 7.0, 1.2, 5.5, 5.5, { border: COLORS.tealSoft, inset: 0.1 });
  }

  // 06 — information exchange and presentation
  {
    const slide = pptx.addSlide();
    addHeader(slide, 6);
    addText(slide, '交换资料，讲给同伴听', 0.72, 1.18, 7.0, 0.68, { fontSize: 37, bold: true });
    addText(slide, '每个人讲一个姓氏，再回答一个问题。', 0.75, 2.02, 6.5, 0.4, { fontSize: 20, color: COLORS.slate });
    addImageCard(slide, 15, 0.75, 2.95, 3.4, 3.4, { border: COLORS.blueSoft, inset: 0.08 });
    addImageCard(slide, 16, 4.42, 2.95, 3.4, 3.4, { border: COLORS.coralSoft, inset: 0.08 });
    slide.addShape('line', { x: 8.25, y: 4.65, w: 0.65, h: 0, line: { color: COLORS.teal, pt: 2, beginArrowType: 'none', endArrowType: 'triangle' } });
    addStep(slide, 1, '换一张卡', 9.18, 3.15, COLORS.blue);
    addStep(slide, 2, '讲一个姓', 9.18, 4.05, COLORS.coral);
    addStep(slide, 3, '回答问题', 9.18, 4.95, COLORS.teal);
    addText(slide, '听清楚，再换一位同伴。', 9.2, 5.98, 3.15, 0.52, { fontSize: 19, color: COLORS.slate, breakLine: true });
  }

  await pptx.writeFile({ fileName: pptxPath });
  writeManifest();
  writeReview();
  console.log(JSON.stringify({ pptxPath, slideCount: 6, contactSheet, status: 'pending_adam_review' }, null, 2));
}

build().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
