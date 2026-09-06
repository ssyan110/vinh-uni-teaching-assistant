#!/usr/bin/env node

/**
 * Three visual prototypes for the first-week projector opener.
 *
 * All three decks contain the same four representative pages so Adam can
 * choose the visual system before the full 12-page deck is rebuilt:
 * cover, teacher-first opening, student-to-teacher interaction, and group
 * proposal. Native editable PPTX only; no external images or HTML.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const PptxGenJS = require('pptxgenjs');
const {
  CJK_FONT,
  LATIN_FONT,
  addText,
  addLine,
  addAccent,
} = require('./lesson_pptx_master_template');

const ROOT = path.resolve(__dirname, '..');
const LESSON_KEY = 'boya-quasi-intermediate-i:lesson-01';
const LESSON_ROOT = path.join(ROOT, 'lessons/boya-quasi-intermediate-i/lesson-01');
const OUTPUT_DIR = path.join(LESSON_ROOT, '10-design/pptx-draft/first-week-icebreakers/prototypes');

const W = 13.333;
const H = 7.5;
const P = {
  bg: 'FFFFFF',
  ink: '14282D',
  muted: '667679',
  line: 'D7DFDD',
  teal: '2D8F8B',
  tealSoft: 'E6F2EF',
  coral: 'E98D78',
  coralSoft: 'FBEAE4',
  purple: '806ED4',
  purpleSoft: 'F0EDFB',
  yellow: 'F2C85B',
  yellowSoft: 'FFF7D9',
  mint: 'BFE1D8',
  white: 'FFFFFF',
};
const T = {
  eyebrow: 20,
  label: 22,
  body: 24,
  lead: 28,
  title: 44,
  hero: 56,
};

execFileSync(process.env.BOYA_PYTHON || 'python3', [
  path.join(ROOT, 'scripts/production_gate.py'),
  '--purpose', 'pptx',
  '--stage', 'draft',
  '--lesson-key', LESSON_KEY,
  '--output-dir', path.relative(ROOT, OUTPUT_DIR),
], { stdio: 'inherit' });

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function deck(title) {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'PROTOTYPE_WIDE', width: W, height: H });
  pptx.layout = 'PROTOTYPE_WIDE';
  pptx.author = '荣市大学华语听说课程';
  pptx.company = '荣市大学';
  pptx.subject = '第一周破冰视觉原型';
  pptx.title = title;
  pptx.lang = 'zh-CN';
  pptx.theme = { headFontFace: CJK_FONT, bodyFontFace: CJK_FONT, lang: 'zh-CN' };
  return pptx;
}

function text(slide, value, x, y, w, h, options = {}) {
  addText(slide, value, x, y, w, h, options);
}

function latin(slide, value, x, y, w, h, options = {}) {
  text(slide, value, x, y, w, h, {
    fontFace: LATIN_FONT,
    lang: 'en-US',
    ...options,
  });
}

function line(slide, x, y, w, color = P.line, pt = 1.0) {
  addLine(slide, x, y, w, color, pt);
}

function circle(slide, x, y, size, fill, lineColor = fill, pt = 1.0, transparency = 0) {
  slide.addShape('ellipse', {
    x, y, w: size, h: size,
    fill: { color: fill, transparency },
    line: { color: lineColor, pt },
  });
}

function ring(slide, x, y, size, color, pt = 1.6) {
  circle(slide, x, y, size, P.white, color, pt, 100);
}

function rect(slide, x, y, w, h, fill, lineColor = fill, pt = 0, transparency = 0) {
  slide.addShape('rect', {
    x, y, w, h,
    fill: { color: fill, transparency },
    line: { color: lineColor, pt, transparency: pt === 0 ? 100 : 0 },
  });
}

function rounded(slide, x, y, w, h, fill, lineColor = fill, pt = 0, transparency = 0) {
  slide.addShape('roundRect', {
    x, y, w, h,
    rectRadius: 0.06,
    fill: { color: fill, transparency },
    line: { color: lineColor, pt, transparency: pt === 0 ? 100 : 0 },
  });
}

function arrow(slide, x, y, w, color = P.line, pt = 1.4) {
  slide.addShape('line', {
    x, y, w, h: 0,
    line: { color, pt, endArrowType: 'triangle' },
  });
}

function note(slide, value) {
  slide.addNotes(value);
}

function completion(slide, value, y = 6.78, color = P.teal) {
  addAccent(slide, 0.88, y + 0.02, 0.08, color, 0.36);
  text(slide, `完成：${value}`, 1.12, y, 11.2, 0.32, {
    fontSize: 21,
    color,
    bold: true,
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Prototype 01 — Swiss Editorial
// ────────────────────────────────────────────────────────────────────────────

function swissHeader(slide, page) {
  slide.background = { color: P.bg };
  latin(slide, 'FIRST WEEK / UNIVERSITY LIFE', 0.78, 0.25, 4.8, 0.24, {
    fontSize: T.eyebrow,
    color: P.muted,
    bold: true,
  });
  latin(slide, String(page).padStart(2, '0'), 12.02, 0.25, 0.54, 0.24, {
    fontSize: T.eyebrow,
    color: P.muted,
    bold: true,
    align: 'right',
  });
  line(slide, 0.78, 0.66, 11.82, P.line, 0.8);
  rect(slide, 0.78, 0.64, 1.12, 0.04, P.teal);
}

function swissCover(pptx) {
  const slide = pptx.addSlide();
  slide.background = { color: P.bg };
  latin(slide, 'FIRST WEEK / UNIVERSITY LIFE', 0.92, 0.72, 5.4, 0.25, {
    fontSize: T.eyebrow,
    color: P.muted,
    bold: true,
  });
  line(slide, 0.92, 1.12, 1.22, P.coral, 2.5);
  text(slide, '我的大学生活\n与新学期计划', 0.92, 1.62, 7.2, 1.55, {
    fontSize: T.hero,
    bold: true,
    valign: 'top',
  });
  text(slide, '先听懂  →  再追问  →  最后提案', 0.96, 3.84, 6.4, 0.42, {
    fontSize: T.lead,
    color: P.teal,
    bold: true,
  });
  line(slide, 0.96, 4.46, 5.44, P.coral, 2.0);
  text(slide, '一段正在发生的大学生活故事。', 0.96, 4.8, 5.8, 0.38, {
    fontSize: T.body,
    color: P.muted,
    bold: true,
  });

  latin(slide, '01', 8.2, 1.2, 2.1, 1.06, {
    fontSize: 82,
    color: P.coral,
    bold: true,
  });
  line(slide, 8.26, 2.56, 3.66, P.line, 1.0);
  const stages = [
    { word: '过去', sub: '经历', color: P.teal, y: 2.9 },
    { word: '现在', sub: '生活', color: P.coral, y: 3.86 },
    { word: '将来', sub: '计划', color: P.purple, y: 4.82 },
  ];
  stages.forEach((stage, index) => {
    text(slide, stage.word, 8.28, stage.y, 1.18, 0.36, {
      fontSize: 26,
      color: stage.color,
      bold: true,
    });
    text(slide, stage.sub, 9.78, stage.y, 1.4, 0.36, {
      fontSize: 24,
      color: P.ink,
      bold: true,
    });
    if (index < stages.length - 1) line(slide, 8.28, stage.y + 0.58, 3.18, P.line, 0.8);
  });
  latin(slide, '01 / 04', 11.34, 6.78, 1.2, 0.22, { fontSize: 20, color: P.muted, align: 'right', bold: true });
  note(slide, '瑞士编辑原型：用强网格、黑色大标题和少量单色强调建立成熟的大学课程感。第一周仍然从教师自我介绍开始。');
}

function swissTeacher(pptx) {
  const slide = pptx.addSlide();
  swissHeader(slide, 2);
  text(slide, '先从老师开始。', 0.88, 1.0, 6.2, 0.66, { fontSize: T.title, bold: true });
  text(slide, '老师说 60–90 秒。学生先听，不急着提问。', 0.9, 1.86, 8.0, 0.4, {
    fontSize: T.lead,
    color: P.coral,
    bold: true,
  });
  latin(slide, '01', 0.94, 2.72, 1.18, 0.74, { fontSize: 55, color: P.teal, bold: true });
  text(slide, '听懂', 0.96, 3.58, 1.5, 0.42, { fontSize: 30, color: P.teal, bold: true });
  line(slide, 0.96, 4.22, 1.7, P.teal, 2.2);
  text(slide, '我是谁？\n我怎样生活？\n我遇到过什么？\n我这学期想做什么？', 3.06, 2.62, 5.24, 2.36, {
    fontSize: 31,
    bold: true,
    valign: 'mid',
  });
  line(slide, 8.82, 2.56, 0, P.line, 0.8);
  text(slide, '学生只要记住：', 9.12, 2.66, 2.8, 0.36, { fontSize: T.body, color: P.muted, bold: true });
  latin(slide, '3', 9.12, 3.34, 0.7, 0.62, { fontSize: 50, color: P.teal, bold: true });
  text(slide, '项事实', 9.86, 3.48, 1.7, 0.36, { fontSize: 28, color: P.teal, bold: true });
  text(slide, '＋', 9.12, 4.18, 0.7, 0.46, { fontSize: 34, color: P.coral, bold: true, align: 'center' });
  latin(slide, '1', 9.12, 4.82, 0.7, 0.62, { fontSize: 50, color: P.coral, bold: true });
  text(slide, '个目标', 9.86, 4.96, 1.7, 0.36, { fontSize: 28, color: P.coral, bold: true });
  completion(slide, '每个人说出老师的 3 项信息和 1 个目标。');
  note(slide, '教师准备一段真实的口语自我介绍，至少包括过去经历、现在生活和本学期目标。说完以后先请学生复述，再进入学生提问。');
}

function swissAsk(pptx) {
  const slide = pptx.addSlide();
  swissHeader(slide, 3);
  text(slide, '听完以后，轮到你。', 0.88, 1.0, 7.5, 0.66, { fontSize: T.title, bold: true });
  text(slide, '主问题  ＋  追问', 0.92, 1.88, 5.4, 0.44, { fontSize: 30, color: P.teal, bold: true });
  line(slide, 0.94, 2.54, 5.0, P.teal, 2.2);
  text(slide, '你为什么教中文？\n你有空时喜欢做什么？\n你遇到过什么难忘的事？\n这学期最想完成什么？', 0.96, 2.92, 5.5, 1.96, {
    fontSize: 25,
    bold: true,
    valign: 'mid',
  });
  line(slide, 6.86, 2.46, 0, P.line, 0.8);
  text(slide, '追问可以用：', 7.34, 1.88, 3.0, 0.44, { fontSize: 30, color: P.purple, bold: true });
  line(slide, 7.36, 2.54, 4.6, P.purple, 2.2);
  text(slide, '为什么？\n后来呢？\n跟谁一起？\n如果再来一次，你会……吗？', 7.38, 2.92, 4.58, 1.96, {
    fontSize: 28,
    color: P.purple,
    bold: true,
    valign: 'mid',
  });
  text(slide, '老师回答以后，可以反问：“你呢？”', 2.0, 5.68, 9.3, 0.42, { fontSize: 25, color: P.coral, bold: true, align: 'center' });
  completion(slide, '把老师的答案说给同伴听。');
  note(slide, '每组选择一个主题，先问主问题，再追问一个细节。教师回答后可反问“你呢？”，让师生对话继续。');
}

function swissProposal(pptx) {
  const slide = pptx.addSlide();
  swissHeader(slide, 4);
  text(slide, '如果你是班级顾问？', 0.88, 1.0, 8.0, 0.66, { fontSize: T.title, bold: true });
  text(slide, '四人小组：为本班设计一个周末活动或学习计划。', 0.9, 1.88, 10.2, 0.42, { fontSize: T.lead, color: P.teal, bold: true });
  latin(slide, '05', 0.94, 2.82, 1.5, 0.92, { fontSize: 74, color: P.coral, bold: true });
  text(slide, '方案需要回答', 0.98, 3.9, 2.1, 0.42, { fontSize: 24, color: P.coral, bold: true });
  line(slide, 0.98, 4.56, 2.34, P.coral, 2.0);
  const left = [
    ['1', '时间', '什么时候？'],
    ['2', '地点', '在哪里？怎么去？'],
    ['3', '内容', '做什么？吃什么？'],
  ];
  const right = [
    ['4', '理由', '谁会喜欢？为什么？'],
    ['5', '备选', '遇到问题怎么办？'],
  ];
  left.forEach((item, index) => {
    const y = 2.82 + index * 1.12;
    latin(slide, item[0], 3.72, y, 0.44, 0.42, { fontSize: 30, color: P.teal, bold: true });
    text(slide, item[1], 4.28, y + 0.02, 1.1, 0.32, { fontSize: 22, color: P.teal, bold: true });
    text(slide, item[2], 5.5, y + 0.02, 2.62, 0.34, { fontSize: 22, bold: true });
    line(slide, 3.72, y + 0.58, 4.4, P.line, 0.8);
  });
  right.forEach((item, index) => {
    const y = 3.38 + index * 1.12;
    latin(slide, item[0], 8.76, y, 0.44, 0.42, { fontSize: 30, color: P.coral, bold: true });
    text(slide, item[1], 9.32, y + 0.02, 1.1, 0.32, { fontSize: 22, color: P.coral, bold: true });
    text(slide, item[2], 10.54, y + 0.02, 2.12, 0.44, { fontSize: 22, bold: true });
    line(slide, 8.76, y + 0.58, 3.9, P.line, 0.8);
  });
  text(slide, '可以用：因为……所以……｜如果……就……', 3.72, 6.04, 8.7, 0.36, { fontSize: 22, color: P.purple, bold: true, align: 'center' });
  completion(slide, '每个人说一部分，准备 60–90 秒方案。');
  note(slide, '此页用来判断 Swiss 方向能否承载较复杂的课堂任务。教师提醒小组分工：时间地点、活动内容、理由和替代方案。');
}

// ────────────────────────────────────────────────────────────────────────────
// Prototype 02 — Playful Campus Poster
// ────────────────────────────────────────────────────────────────────────────

function posterHeader(slide, page) {
  slide.background = { color: P.bg };
  text(slide, '第一周 / 校园任务', 0.78, 0.25, 3.6, 0.25, { fontSize: T.eyebrow, color: P.muted, bold: true });
  latin(slide, String(page).padStart(2, '0'), 12.02, 0.25, 0.54, 0.24, { fontSize: T.eyebrow, color: P.muted, bold: true, align: 'right' });
  line(slide, 0.78, 0.66, 11.82, P.line, 0.8);
  rect(slide, 0.78, 0.64, 0.62, 0.05, P.coral);
}

function posterDoodles(slide, variant = 0) {
  const sets = [
    [[11.8, 1.02, 0.18, P.yellow], [12.18, 1.26, 0.1, P.coral], [7.54, 6.04, 0.14, P.purple]],
    [[11.76, 5.54, 0.15, P.yellow], [12.08, 5.82, 0.09, P.teal], [0.88, 1.42, 0.12, P.coral]],
    [[11.72, 1.04, 0.13, P.purple], [12.04, 1.3, 0.18, P.yellow], [7.72, 5.88, 0.1, P.coral]],
  ];
  sets[variant % sets.length].forEach(([x, y, size, color]) => circle(slide, x, y, size, color));
  slide.addShape('arc', { x: 10.96, y: 5.22, w: 1.38, h: 0.92, rotate: 20, fill: { color: P.white, transparency: 100 }, line: { color: P.line, pt: 1.3 } });
}

function posterCover(pptx) {
  const slide = pptx.addSlide();
  slide.background = { color: P.bg };
  text(slide, '第一周', 0.92, 0.7, 1.3, 0.38, { fontSize: 25, color: P.teal, bold: true });
  rect(slide, 0.92, 1.18, 1.1, 0.07, P.coral);
  text(slide, '我的大学生活\n与新学期计划', 0.92, 1.62, 7.2, 1.6, { fontSize: T.hero, bold: true, valign: 'top' });
  text(slide, '老师先说  →  你来问  →  采访同学  →  给老师提案', 0.96, 3.88, 7.0, 0.48, { fontSize: 25, color: P.teal, bold: true });
  rect(slide, 0.96, 4.52, 5.3, 0.08, P.coral);
  text(slide, '过去的经历，正在发生的生活，接下来的计划。', 0.96, 4.92, 6.8, 0.44, { fontSize: T.body, color: P.muted, bold: true });

  circle(slide, 8.02, 1.56, 1.92, P.tealSoft, P.teal, 1.4);
  text(slide, '过去', 8.3, 2.12, 1.36, 0.36, { fontSize: 28, color: P.teal, bold: true, align: 'center' });
  circle(slide, 9.42, 2.76, 2.12, P.coralSoft, P.coral, 1.4);
  text(slide, '现在', 9.75, 3.38, 1.48, 0.36, { fontSize: 28, color: P.coral, bold: true, align: 'center' });
  circle(slide, 10.82, 1.52, 1.9, P.purpleSoft, P.purple, 1.4);
  text(slide, '将来', 11.08, 2.1, 1.38, 0.36, { fontSize: 28, color: P.purple, bold: true, align: 'center' });
  arrow(slide, 9.74, 2.32, 0.5, P.line, 1.3);
  arrow(slide, 10.9, 3.62, 0.5, P.line, 1.3);
  posterDoodles(slide, 0);
  note(slide, '校园海报原型：用大字、彩色圆环和轻微错位制造活泼感，但不依赖插图或卡片。');
}

function posterTeacher(pptx) {
  const slide = pptx.addSlide();
  posterHeader(slide, 2);
  posterDoodles(slide, 1);
  text(slide, '先从老师开始。', 0.9, 1.0, 7.2, 0.7, { fontSize: 46, bold: true });
  text(slide, '老师说 60–90 秒，学生先听。', 0.94, 1.9, 6.8, 0.42, { fontSize: 28, color: P.coral, bold: true });
  text(slide, '我是谁？\n我怎样生活？\n我遇到过什么？\n我这学期想做什么？', 0.98, 2.76, 5.42, 2.42, { fontSize: 33, bold: true, valign: 'mid' });
  rect(slide, 0.98, 5.5, 5.25, 0.08, P.coral);
  circle(slide, 8.0, 2.18, 2.46, P.yellowSoft, P.yellow, 1.6);
  text(slide, '3', 8.46, 2.7, 0.68, 0.68, { fontSize: 58, color: P.teal, bold: true, align: 'center' });
  text(slide, '项事实', 9.14, 2.92, 1.48, 0.38, { fontSize: 26, color: P.teal, bold: true });
  text(slide, '＋', 8.75, 3.78, 0.56, 0.46, { fontSize: 34, color: P.coral, bold: true, align: 'center' });
  circle(slide, 8.0, 4.34, 2.46, P.tealSoft, P.teal, 1.6);
  text(slide, '1', 8.46, 4.86, 0.68, 0.68, { fontSize: 58, color: P.coral, bold: true, align: 'center' });
  text(slide, '个目标', 9.14, 5.08, 1.48, 0.38, { fontSize: 26, color: P.coral, bold: true });
  completion(slide, '每个人说出老师的 3 项信息和 1 个目标。');
  note(slide, '教师用自己的真实经历示范。学生先听，不急着问；听完以后用一句话向同伴复述一项事实。');
}

function posterAsk(pptx) {
  const slide = pptx.addSlide();
  posterHeader(slide, 3);
  posterDoodles(slide, 2);
  text(slide, '听完以后，轮到你。', 0.9, 1.0, 8.2, 0.7, { fontSize: 46, bold: true });
  rounded(slide, 0.92, 1.92, 2.0, 0.5, P.teal, P.teal);
  text(slide, '主问题', 1.08, 2.03, 1.68, 0.3, { fontSize: 24, color: P.white, bold: true, align: 'center' });
  text(slide, '＋', 3.12, 1.94, 0.62, 0.5, { fontSize: 35, color: P.coral, bold: true, align: 'center' });
  rounded(slide, 3.84, 1.92, 1.66, 0.5, P.purple, P.purple);
  text(slide, '追问', 3.98, 2.03, 1.38, 0.3, { fontSize: 24, color: P.white, bold: true, align: 'center' });
  text(slide, '你为什么教中文？\n你有空时喜欢做什么？\n你遇到过什么难忘的事？\n这学期最想完成什么？', 0.98, 2.9, 5.5, 2.08, { fontSize: 25, bold: true, valign: 'mid' });
  rect(slide, 6.9, 2.72, 0.09, 2.36, P.purple);
  text(slide, '为什么？\n后来呢？\n跟谁一起？\n如果再来一次，\n你会……吗？', 7.44, 2.88, 4.4, 2.12, { fontSize: 28, color: P.purple, bold: true, valign: 'mid' });
  text(slide, '老师回答以后，也可以问：“你呢？”', 2.32, 5.72, 8.54, 0.42, { fontSize: 25, color: P.coral, bold: true, align: 'center' });
  completion(slide, '把老师的答案说给同伴听。');
  note(slide, '学生每组选择一个主题。先问主问题，再追问一个细节；教师回答后把问题抛回学生，让交流不只停留在教师回答。');
}

function posterProposal(pptx) {
  const slide = pptx.addSlide();
  posterHeader(slide, 4);
  posterDoodles(slide, 0);
  text(slide, '如果你是班级顾问？', 0.9, 1.0, 8.4, 0.7, { fontSize: 46, bold: true });
  text(slide, '四人小组：为本班设计一个周末活动或学习计划。', 0.94, 1.9, 10.5, 0.42, { fontSize: 27, color: P.teal, bold: true });
  const items = [
    { n: '1', head: '时间', q: '什么时候？', color: P.teal, x: 0.98, y: 2.8 },
    { n: '2', head: '地点', q: '在哪里？怎么去？', color: P.coral, x: 4.42, y: 2.8 },
    { n: '3', head: '内容', q: '做什么？吃什么？', color: P.purple, x: 7.86, y: 2.8 },
    { n: '4', head: '理由', q: '谁会喜欢？为什么？', color: P.teal, x: 2.28, y: 4.46 },
    { n: '5', head: '备选', q: '遇到问题怎么办？', color: P.coral, x: 7.06, y: 4.46 },
  ];
  items.forEach((item) => {
    circle(slide, item.x, item.y, 0.64, item.color, item.color, 0);
    latin(slide, item.n, item.x, item.y + 0.13, 0.64, 0.3, { fontSize: 24, color: P.white, bold: true, align: 'center' });
    text(slide, item.head, item.x + 0.84, item.y - 0.01, 1.32, 0.34, { fontSize: 23, color: item.color, bold: true });
    text(slide, item.q, item.x + 0.84, item.y + 0.46, 2.66, 0.42, { fontSize: 22, bold: true });
  });
  text(slide, '因为……所以……  |  如果……就……  |  虽然……但是……', 1.3, 6.08, 10.7, 0.36, { fontSize: 22, color: P.purple, bold: true, align: 'center' });
  completion(slide, '每个人说一部分，准备 60–90 秒方案。');
  note(slide, '小组先分工，再准备方案。若时间有限，只要求每组说清楚时间、内容和一个理由；能力较强的组再加入替代方案。');
}

// ────────────────────────────────────────────────────────────────────────────
// Prototype 03 — Campus Magazine
// ────────────────────────────────────────────────────────────────────────────

function magazineHeader(slide, page, accent = P.coral) {
  slide.background = { color: P.bg };
  rect(slide, 0, 0, 0.22, H, accent);
  text(slide, '第一周 / 大学生活', 0.62, 0.26, 3.8, 0.24, { fontSize: T.eyebrow, color: P.muted, bold: true });
  latin(slide, String(page).padStart(2, '0'), 12.02, 0.26, 0.54, 0.24, { fontSize: T.eyebrow, color: P.muted, bold: true, align: 'right' });
  line(slide, 0.62, 0.68, 11.9, P.line, 0.8);
}

function magazineStamp(slide, value, x, y, color, fill) {
  rounded(slide, x, y, 1.6, 0.48, fill, fill);
  text(slide, value, x + 0.12, y + 0.08, 1.36, 0.3, { fontSize: 22, color, bold: true, align: 'center' });
}

function magazineCover(pptx) {
  const slide = pptx.addSlide();
  slide.background = { color: P.bg };
  rect(slide, 0, 0, 0.22, H, P.coral);
  text(slide, '第一周 / 大学生活', 0.72, 0.72, 3.8, 0.3, { fontSize: 22, color: P.muted, bold: true });
  magazineStamp(slide, '投影活动', 0.72, 1.18, P.teal, P.tealSoft);
  text(slide, '我的大学生活\n与新学期计划', 0.72, 1.98, 6.72, 1.5, { fontSize: T.hero, bold: true, valign: 'top' });
  text(slide, '一段正在发生的故事。', 0.76, 4.02, 5.5, 0.42, { fontSize: 31, color: P.coral, bold: true });
  text(slide, '先听懂\n再追问\n最后提案', 0.78, 4.92, 3.6, 1.1, { fontSize: 27, color: P.teal, bold: true, valign: 'mid' });
  rect(slide, 8.04, 1.52, 3.64, 4.26, P.yellowSoft);
  circle(slide, 8.62, 2.08, 2.05, P.white, P.teal, 2.0);
  text(slide, '过去', 9.02, 2.78, 1.26, 0.38, { fontSize: 27, color: P.teal, bold: true, align: 'center' });
  circle(slide, 9.98, 3.02, 2.05, P.white, P.coral, 2.0);
  text(slide, '现在', 10.38, 3.72, 1.26, 0.38, { fontSize: 27, color: P.coral, bold: true, align: 'center' });
  circle(slide, 8.62, 3.96, 2.05, P.white, P.purple, 2.0);
  text(slide, '将来', 9.02, 4.66, 1.26, 0.38, { fontSize: 27, color: P.purple, bold: true, align: 'center' });
  text(slide, '老师先说\n学生接手', 10.02, 5.98, 2.4, 0.62, { fontSize: 23, color: P.muted, bold: true, align: 'center' });
  note(slide, '生活杂志原型：用像杂志跨页一样的留白、侧边色带和局部大色块，保留活泼但降低视觉噪音。');
}

function magazineTeacher(pptx) {
  const slide = pptx.addSlide();
  magazineHeader(slide, 2, P.teal);
  magazineStamp(slide, '教师开场', 0.72, 1.0, P.coral, P.coralSoft);
  text(slide, '先从老师开始。', 0.72, 1.76, 7.0, 0.68, { fontSize: 46, bold: true });
  rect(slide, 0.72, 2.78, 7.28, 2.64, P.yellowSoft);
  text(slide, '我是谁？\n我怎样生活？\n我遇到过什么？\n我这学期想做什么？', 1.12, 3.22, 5.86, 1.82, { fontSize: 31, bold: true, valign: 'mid' });
  text(slide, '老师说 60–90 秒。\n学生先听，不急着提问。', 8.84, 2.92, 3.24, 0.94, { fontSize: 25, color: P.coral, bold: true, valign: 'mid' });
  line(slide, 8.84, 4.18, 3.04, P.coral, 2.0);
  text(slide, '听完以后，记住：', 8.84, 4.48, 3.0, 0.36, { fontSize: T.body, color: P.muted, bold: true });
  text(slide, '3 项事实\n＋ 1 个目标', 8.84, 4.98, 3.4, 0.9, { fontSize: 34, color: P.teal, bold: true, valign: 'mid' });
  completion(slide, '每个人说出老师的 3 项信息和 1 个目标。');
  note(slide, '教师准备自己的真实口语介绍。用过去、现在和将来示范学生稍后要完成的表达结构。');
}

function magazineAsk(pptx) {
  const slide = pptx.addSlide();
  magazineHeader(slide, 3, P.purple);
  magazineStamp(slide, '互动页面', 0.72, 1.0, P.teal, P.tealSoft);
  text(slide, '听完以后，轮到你。', 0.72, 1.76, 8.0, 0.68, { fontSize: 46, bold: true });
  text(slide, '主问题', 0.78, 2.86, 2.0, 0.42, { fontSize: 31, color: P.teal, bold: true });
  line(slide, 0.78, 3.48, 4.28, P.teal, 2.0);
  text(slide, '你为什么教中文？\n你有空时喜欢做什么？\n你遇到过什么难忘的事？\n这学期最想完成什么？', 0.78, 3.82, 5.18, 1.7, { fontSize: 25, bold: true, valign: 'mid' });
  rect(slide, 6.62, 2.54, 5.24, 3.38, P.purpleSoft);
  text(slide, '追问', 7.06, 2.86, 2.0, 0.42, { fontSize: 31, color: P.purple, bold: true });
  line(slide, 7.06, 3.48, 3.88, P.purple, 2.0);
  text(slide, '为什么？\n后来呢？\n跟谁一起？\n如果再来一次，你会……吗？', 7.06, 3.82, 4.0, 1.56, { fontSize: 27, color: P.purple, bold: true, valign: 'mid' });
  text(slide, '老师回答以后，也可以问：“你呢？”', 2.0, 6.02, 9.24, 0.38, { fontSize: 24, color: P.coral, bold: true, align: 'center' });
  completion(slide, '把老师的答案说给同伴听。');
  note(slide, '学生先选择一个主问题，再选择一个追问。教师回答后把问题还给学生，形成真实的师生互动。');
}

function magazineProposal(pptx) {
  const slide = pptx.addSlide();
  magazineHeader(slide, 4, P.coral);
  magazineStamp(slide, '小组任务', 0.72, 1.0, P.teal, P.tealSoft);
  text(slide, '如果你是班级顾问？', 0.72, 1.76, 8.8, 0.68, { fontSize: 46, bold: true });
  text(slide, '四人小组：为本班设计一个周末活动或学习计划。', 0.76, 2.62, 10.6, 0.42, { fontSize: 27, color: P.teal, bold: true });
  rect(slide, 0.78, 3.42, 2.36, 2.42, P.coralSoft);
  text(slide, '方案\n需要\n回答', 1.22, 3.8, 1.48, 1.46, { fontSize: 34, color: P.coral, bold: true, align: 'center', valign: 'mid' });
  const items = [
    ['1', '时间', '什么时候？', P.teal],
    ['2', '地点', '在哪里？怎么去？', P.coral],
    ['3', '内容', '做什么？吃什么？', P.purple],
    ['4', '理由', '谁会喜欢？为什么？', P.teal],
    ['5', '备选', '遇到问题怎么办？', P.coral],
  ];
  items.forEach((item, index) => {
    const x = index < 3 ? 3.7 + index * 2.88 : 4.96 + (index - 3) * 3.4;
    const y = index < 3 ? 3.5 : 4.86;
    latin(slide, item[0], x, y, 0.42, 0.42, { fontSize: 29, color: item[3], bold: true });
    text(slide, item[1], x + 0.56, y + 0.02, 1.04, 0.32, { fontSize: 22, color: item[3], bold: true });
    line(slide, x + 0.56, y + 0.52, 2.12, item[3], 1.6);
    text(slide, item[2], x + 0.56, y + 0.68, 2.2, 0.42, { fontSize: 21, bold: true });
  });
  text(slide, '因为……所以……  |  如果……就……', 3.72, 6.18, 8.7, 0.34, { fontSize: 22, color: P.purple, bold: true, align: 'center' });
  completion(slide, '每个人说一部分，准备 60–90 秒方案。');
  note(slide, '此页测试生活杂志风是否能承载較多任務資訊。小組先分工，再準備方案；每個人都要說一部分。');
}

const prototypes = [
  {
    id: '01',
    slug: '瑞士编辑',
    name: '瑞士编辑风',
    description: '高留白、强网格、黑色大标题、单色强调；最成熟、最像大学课程。',
    pptx: (() => {
      const p = deck('第一周破冰原型 01｜瑞士编辑风');
      swissCover(p); swissTeacher(p); swissAsk(p); swissProposal(p); return p;
    })(),
  },
  {
    id: '02',
    slug: '校园海报',
    name: '校园海报风',
    description: '大字、圆环、彩色点和轻微错位；最活泼、最有第一周活動氣氛。',
    pptx: (() => {
      const p = deck('第一周破冰原型 02｜校园海报风');
      posterCover(p); posterTeacher(p); posterAsk(p); posterProposal(p); return p;
    })(),
  },
  {
    id: '03',
    slug: '生活杂志',
    name: '生活杂志风',
    description: '像校园生活专题的杂志跨页；有故事感、色带和局部色块，活泼但更有编辑感。',
    pptx: (() => {
      const p = deck('第一周破冰原型 03｜生活杂志风');
      magazineCover(p); magazineTeacher(p); magazineAsk(p); magazineProposal(p); return p;
    })(),
  },
];

(async () => {
  const output = [];
  for (const item of prototypes) {
    const fileName = `lesson-01-破冰原型${item.id}-${item.slug}.pptx`;
    const outputPath = path.join(OUTPUT_DIR, fileName);
    await item.pptx.writeFile({ fileName: outputPath });
    const sha256 = crypto.createHash('sha256').update(fs.readFileSync(outputPath)).digest('hex');
    output.push({
      id: item.id,
      name: item.name,
      file: path.relative(ROOT, outputPath),
      description: item.description,
      slide_count: item.pptx._slides.length,
      sha256,
    });
  }
  const manifest = {
    artifact: 'lesson-01-第一周破冰-三种视觉原型',
    lesson_key: LESSON_KEY,
    offering_id: '2026-fall',
    status: 'prototype_only',
    format: 'native-pptx-only',
    student_language: '简体中文',
    delivery: 'projector_only_no_printed_handouts',
    common_content: [
      '教师先说：自我介绍与听力抓重点',
      '学生来问老师：主问题＋追问',
      '教师也来问学生：回答＋说明＋设想',
      '小组方案：时间、地点、内容、理由、备选',
    ],
    typography: { cjk: CJK_FONT, latin: LATIN_FONT, min_visible_pt: 20 },
    prototypes: output,
    source_reference: 'PPT Master native editable PowerPoint workflow; visual concepts are original project prototypes, not copied templates.',
    qa: {
      source_gate: 'passed_before_write',
      output_scope: '10-design/pptx-draft/first-week-icebreakers/prototypes',
      full_deck_or_release: 'not_created',
      manual_powerpoint_playback: 'pending',
      classroom_rehearsal: 'pending',
    },
  };
  const manifestPath = path.join(OUTPUT_DIR, 'prototype-manifest.json');
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify(manifest, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
