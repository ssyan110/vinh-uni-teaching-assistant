#!/usr/bin/env node

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const PptxGenJS = require('pptxgenjs');
const {
  CJK_FONT,
  LATIN_FONT,
  COLORS: C,
  addText,
  addLatin,
  addLine,
  addAccent,
} = require('./lesson_pptx_master_template');

const ROOT = path.resolve(__dirname, '..');
const LESSON_KEY = 'boya-elementary-i:lesson-01';
const OFFERING_ID = '2026-fall';
const DESIGN_ROOT = path.join(ROOT, 'lessons/boya-elementary-i/lesson-01/10-design');
const REVIEW_PATH = path.join(DESIGN_ROOT, 'storyboard/lesson-01-逐页文案审阅.md');
const OUT_DIR = path.join(DESIGN_ROOT, 'pptx-draft/first-week-icebreaker');
const OUT_PATH = path.join(OUT_DIR, 'lesson-01-破冰活动.pptx');
const MANIFEST_PATH = path.join(OUT_DIR, 'lesson-01-破冰活动-manifest.json');

const W = 13.333;
const H = 7.5;
const MIN_PT = 20;

function parseReview(markdown) {
  const slides = [];
  const pattern = /## PPT (\d+)｜([^\n]+)\n\n```text\n([\s\S]*?)\n```/g;
  for (const match of markdown.matchAll(pattern)) {
    slides.push({
      number: Number(match[1]),
      title: match[2].trim(),
      lines: match[3].split(/\r?\n/).map(line => line.trim()).filter(Boolean),
    });
  }
  return slides;
}

function requireLine(slide, expected) {
  assert(slide.lines.includes(expected), `PPT ${slide.number} 缺少文案：${expected}`);
}

function requireLines(slide, expected) {
  expected.forEach(line => requireLine(slide, line));
}

function rich(slide, parts, x, y, w, h, options = {}) {
  const runs = parts.map(part => ({
    text: part.text,
    options: {
      fontFace: part.fontFace || (part.latin ? LATIN_FONT : CJK_FONT),
      color: part.color || options.color || C.ink,
      bold: part.bold == null ? options.bold : part.bold,
      breakLine: part.breakLine,
    },
  }));
  slide.addText(runs, {
    x, y, w, h,
    fontSize: options.fontSize || 25,
    color: options.color || C.ink,
    margin: 0,
    fit: 'shrink',
    valign: options.valign || 'mid',
    align: options.align || 'left',
    lang: 'zh-CN',
    paraSpaceAfterPt: 0,
    breakLine: true,
    ...options,
  });
}

function cjk(slide, text, x, y, w, h, fontSize, options = {}) {
  addText(slide, text, x, y, w, h, { fontSize, ...options });
}

function latin(slide, text, x, y, w, h, fontSize, options = {}) {
  addLatin(slide, text, x, y, w, h, { fontSize, ...options });
}

function card(slide, x, y, w, h, fill = C.warmWhite, line = C.line, radius = 0.08) {
  slide.addShape('roundRect', {
    x, y, w, h,
    rectRadius: radius,
    fill: { color: fill },
    line: { color: line, pt: 1.0 },
  });
}

function page(slide, number) {
  latin(slide, `${String(number).padStart(2, '0')} / 12`, 11.55, 7.04, 1.0, 0.24, 20, {
    color: C.muted,
    align: 'right',
  });
}

function title(slide, text, number, size = 40) {
  cjk(slide, text, 0.82, 0.72, 10.9, 0.72, size, { bold: true, valign: 'top' });
  addLine(slide, 0.82, 1.55, 11.6, C.line, 0.8);
  addAccent(slide, 0.82, 1.53, 0.62, C.teal, 0.06);
  page(slide, number);
}

function label(slide, text, x, y, w, fill, color = C.white) {
  slide.addShape('roundRect', {
    x, y, w, h: 0.42,
    rectRadius: 0.08,
    fill: { color: fill },
    line: { color: fill, transparency: 100 },
  });
  cjk(slide, text, x + 0.06, y + 0.06, w - 0.12, 0.26, 20, {
    color,
    bold: true,
    align: 'center',
  });
}

function speech(slide, textParts, x, y, w, h, fill, line = C.line, fontSize = 30) {
  card(slide, x, y, w, h, fill, line);
  rich(slide, textParts, x + 0.22, y + 0.18, w - 0.44, h - 0.36, {
    fontSize,
    bold: true,
    align: 'center',
  });
}

function notes(slide, text) {
  slide.addNotes(text);
}

function makePptx(slides) {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'VINH_WIDE', width: W, height: H });
  pptx.layout = 'VINH_WIDE';
  pptx.author = '荣市大学华语课程';
  pptx.company = '越南荣市大学';
  pptx.subject = '大一学生第一周破冰活动';
  pptx.title = '第一次说中文';
  pptx.lang = 'zh-CN';
  pptx.theme = { headFontFace: CJK_FONT, bodyFontFace: CJK_FONT, lang: 'zh-CN' };

  const p = number => slides[number - 1];
  requireLines(p(1), ['Buổi học đầu tiên', '第一次说中文', 'Làm quen bằng tiếng Trung']);
  requireLines(p(2), ['你好！', 'Nǐ hǎo!', 'Xin chào!', '两个人见面：', 'A：你好！', 'B：你好！']);
  requireLines(p(3), ['我叫 ______，你呢？', 'Wǒ jiào ______, nǐ ne?', 'Tôi tên là ______, còn bạn?', '说你的名字', '我叫 ______。']);
  requireLines(p(4), ['你叫什么名字？', 'Nǐ jiào shénme míngzi?', 'Bạn tên là gì?', 'A', 'B', '我叫 ______。']);
  requireLines(p(5), ['问名字', '①', '我叫 Minh，你呢？', 'Wǒ jiào Minh, nǐ ne?', '②', '回答', '我叫 ______。']);
  requireLines(p(6), ['很高兴认识你！', 'Hěn gāoxìng rènshi nǐ!', 'Rất vui được làm quen với bạn!', 'A', 'B']);
  requireLines(p(7), ['懂吗？', 'Dǒng ma?', 'Bạn hiểu không?', '我不懂。', 'Wǒ bù dǒng.', 'Tôi không hiểu.', '老师问：', '听不懂的时候：']);
  requireLines(p(8), ['谢谢！', 'Xièxie!', 'Cảm ơn!', '再见！', 'Zàijiàn!', 'Tạm biệt!']);
  requireLines(p(9), ['说一说', '你好！', '我叫 Minh，你呢？', '我叫 Lan。', '很高兴认识你！', '再见！']);
  requireLines(p(10), ['认识新朋友', 'Hãy làm quen với 3 bạn trong lớp bằng tiếng Trung.', '任务', '① 找一个同学', '② 只说中文', '③ 说完以后，换一个人', '④ 一共认识 3 个人', '可以说：']);
  requireLines(p(11), ['挑战', 'Không nhìn PPT.', '和一个新同学完成对话：', '你好！', '我叫 ______，你呢？', '很高兴认识你！', '再见！']);
  requireLines(p(12), ['今天你会说了吗？', '中文', '□ 你好', '□ 我叫……，你呢？', '□ 你叫什么名字？', '□ 很高兴认识你', '□ 懂吗？', '□ 我不懂', '□ 谢谢', '□ 再见', '下课挑战', '找老师说中文，然后再见！']);

  // 1. Cover
  {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    slide.addShape('rect', { x: 0.72, y: 0.86, w: 0.10, h: 5.76, fill: { color: C.teal }, line: { color: C.teal, transparency: 100 } });
    latin(slide, p(1).lines[0], 1.18, 1.02, 5.8, 0.46, 26, { color: C.teal, bold: true });
    cjk(slide, p(1).lines[1], 1.18, 2.02, 6.6, 0.86, 50, { bold: true });
    latin(slide, p(1).lines[2], 1.20, 3.30, 7.0, 0.46, 26, { color: C.muted });
    addLine(slide, 1.20, 4.22, 4.7, C.coral, 2.2);
    card(slide, 8.15, 1.28, 3.9, 4.7, C.mint, C.mintDeep);
    speech(slide, [{ text: '你好！' }], 8.62, 1.86, 2.95, 0.92, C.white, C.teal, 30);
    speech(slide, [{ text: '我叫……' }], 8.98, 3.14, 2.7, 0.92, C.yellowSoft, C.yellow, 24);
    speech(slide, [{ text: '再见！' }], 8.48, 4.42, 2.78, 0.92, C.lilac, C.purple, 30);
    page(slide, 1);
    notes(slide, '从 P2 开始进入问候语练习。封面只说明今天要用中文认识同学。');
  }

  // 2. Greeting
  {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    title(slide, p(2).lines[0], 2, 44);
    latin(slide, p(2).lines[1], 0.86, 1.82, 2.8, 0.34, 26, { color: C.teal, bold: true });
    latin(slide, p(2).lines[2], 0.86, 2.23, 4.0, 0.34, 24, { color: C.muted });
    cjk(slide, p(2).lines[3], 4.76, 1.86, 3.8, 0.38, 25, { color: C.muted, bold: true, align: 'center' });
    speech(slide, [{ text: 'A：你好！' }], 1.08, 3.18, 4.65, 1.24, C.mint, C.mintDeep, 32);
    speech(slide, [{ text: 'B：你好！' }], 7.55, 2.35, 4.65, 1.24, C.coralSoft, C.coral, 32);
    slide.addShape('line', { x: 5.7, y: 3.78, w: 1.45, h: -0.72, line: { color: C.purple, pt: 1.4, beginArrowType: 'none', endArrowType: 'triangle' } });
    page(slide, 2);
    notes(slide, '教师先示范 A、B 两句。学生两人一组互说一次，再交换角色。');
  }

  // 3. Name + you?
  {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    title(slide, p(3).lines[0], 3, 40);
    latin(slide, p(3).lines[1], 0.86, 1.78, 5.1, 0.35, 25, { color: C.teal, bold: true });
    latin(slide, p(3).lines[2], 0.86, 2.22, 6.0, 0.38, 23, { color: C.muted });
    label(slide, p(3).lines[3], 0.9, 3.12, 2.2, C.coral);
    card(slide, 0.9, 3.8, 5.3, 1.52, C.coralSoft, C.coral);
    cjk(slide, p(3).lines[4], 1.24, 4.29, 4.6, 0.54, 34, { bold: true, align: 'center' });
    card(slide, 7.15, 2.08, 4.95, 3.8, C.mint, C.mintDeep);
    cjk(slide, '你的名字', 7.75, 2.72, 3.75, 0.46, 28, { color: C.teal, bold: true, align: 'center' });
    addLine(slide, 7.82, 3.46, 3.6, C.teal, 1.4);
    cjk(slide, '说出来', 7.74, 4.08, 3.78, 0.5, 30, { bold: true, align: 'center' });
    page(slide, 3);
    notes(slide, '教师先说自己的名字，再让学生使用“我叫……”。不要求学生解释“你呢”的语法。');
  }

  // 4. Asking a name
  {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    title(slide, p(4).lines[0], 4, 42);
    latin(slide, p(4).lines[1], 0.86, 1.78, 5.1, 0.35, 25, { color: C.teal, bold: true });
    latin(slide, p(4).lines[2], 0.86, 2.22, 4.8, 0.38, 23, { color: C.muted });
    card(slide, 0.9, 3.0, 5.42, 2.48, C.mint, C.mintDeep);
    label(slide, p(4).lines[3], 1.25, 3.34, 0.72, C.teal);
    cjk(slide, p(4).lines[4], 1.34, 4.15, 4.56, 0.54, 32, { bold: true, align: 'center' });
    card(slide, 7.02, 3.0, 5.42, 2.48, C.coralSoft, C.coral);
    label(slide, p(4).lines[5], 7.38, 3.34, 0.72, C.coral);
    cjk(slide, p(4).lines[6], 7.46, 4.15, 4.54, 0.54, 32, { bold: true, align: 'center' });
    page(slide, 4);
    notes(slide, '教师先领读问题和回答，再让学生 A、B 交换。学生只需要说出自己的真实名字。');
  }

  // 5. Two ways to ask
  {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    title(slide, p(5).lines[0], 5, 42);
    card(slide, 0.9, 1.9, 5.55, 3.02, C.mint, C.mintDeep);
    cjk(slide, p(5).lines[1], 1.25, 2.22, 0.58, 0.45, 30, { color: C.teal, bold: true, align: 'center' });
    rich(slide, [{ text: '我叫 ', fontFace: CJK_FONT }, { text: 'Minh', fontFace: LATIN_FONT }, { text: '，你呢？', fontFace: CJK_FONT }], 1.18, 3.0, 4.98, 0.52, { fontSize: 29, bold: true, align: 'center' });
    latin(slide, p(5).lines[3], 1.20, 3.82, 4.9, 0.36, 23, { color: C.teal, align: 'center' });
    card(slide, 6.88, 1.9, 5.55, 3.02, C.lilac, C.purple);
    cjk(slide, p(5).lines[4], 7.25, 2.22, 0.58, 0.45, 30, { color: C.purple, bold: true, align: 'center' });
    cjk(slide, p(5).lines[5], 7.24, 3.0, 4.82, 0.52, 28, { bold: true, align: 'center' });
    latin(slide, p(5).lines[6], 7.28, 3.82, 4.76, 0.36, 23, { color: C.purple, align: 'center' });
    label(slide, p(5).lines[7], 0.9, 5.45, 1.28, C.coral);
    card(slide, 2.45, 5.26, 9.98, 0.94, C.coralSoft, C.coral);
    cjk(slide, p(5).lines[8], 3.0, 5.52, 8.9, 0.42, 30, { bold: true, align: 'center' });
    page(slide, 5);
    notes(slide, '只告诉学生这两种问名字的方法都可以使用，不讲语法差别。先示范，再让学生任选一种。');
  }

  // 6. Nice to meet you
  {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    title(slide, p(6).lines[0], 6, 40);
    latin(slide, p(6).lines[1], 0.86, 1.80, 5.2, 0.35, 25, { color: C.teal, bold: true });
    latin(slide, p(6).lines[2], 0.86, 2.22, 6.8, 0.36, 23, { color: C.muted });
    speech(slide, [{ text: 'A' }], 1.28, 3.18, 1.02, 0.8, C.coralSoft, C.coral, 28);
    speech(slide, [{ text: '很高兴认识你！' }], 2.55, 2.95, 4.4, 1.26, C.mint, C.mintDeep, 29);
    speech(slide, [{ text: 'B' }], 7.42, 3.18, 1.02, 0.8, C.mint, C.mintDeep, 28);
    speech(slide, [{ text: '很高兴认识你！' }], 8.70, 2.95, 3.72, 1.26, C.coralSoft, C.coral, 27);
    page(slide, 6);
    notes(slide, '学生两人一组完成问名字后，马上接上这句话。强调两个人都说一次。');
  }

  // 7. Understanding
  {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    title(slide, p(7).lines[0], 7, 44);
    latin(slide, p(7).lines[1], 0.86, 1.80, 3.0, 0.35, 26, { color: C.teal, bold: true });
    latin(slide, p(7).lines[2], 0.86, 2.22, 4.8, 0.36, 23, { color: C.muted });
    speech(slide, [{ text: '懂吗？' }], 0.95, 3.05, 5.35, 1.38, C.mint, C.mintDeep, 38);
    speech(slide, [{ text: '我不懂。' }], 7.02, 3.05, 5.35, 1.38, C.coralSoft, C.coral, 38);
    latin(slide, p(7).lines[4], 7.25, 4.48, 4.9, 0.32, 24, { color: C.coral, bold: true, align: 'center' });
    latin(slide, p(7).lines[5], 7.18, 4.86, 5.05, 0.32, 22, { color: C.muted, align: 'center' });
    card(slide, 1.18, 5.45, 10.98, 0.88, C.yellowSoft, C.yellow);
    rich(slide, [
      { text: '老师问：', fontFace: CJK_FONT, color: C.ink },
      { text: '懂吗？', fontFace: CJK_FONT, color: C.teal, bold: true },
      { text: '    听不懂的时候：', fontFace: CJK_FONT, color: C.ink },
      { text: '我不懂。', fontFace: CJK_FONT, color: C.coral, bold: true },
    ], 1.45, 5.70, 10.45, 0.32, { fontSize: 22, bold: true, align: 'center' });
    page(slide, 7);
    notes(slide, '教师用“懂吗？”检查理解。学生听不懂时练习主动说“我不懂”。');
  }

  // 8. Thanks and goodbye
  {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    title(slide, p(8).title, 8, 40);
    card(slide, 0.95, 2.0, 5.35, 3.52, C.yellowSoft, C.yellow);
    cjk(slide, p(8).lines[0], 1.45, 2.55, 4.35, 0.64, 42, { bold: true, align: 'center' });
    latin(slide, p(8).lines[1], 1.45, 3.52, 4.35, 0.36, 25, { color: C.coral, bold: true, align: 'center' });
    latin(slide, p(8).lines[2], 1.30, 4.18, 4.65, 0.36, 23, { color: C.muted, align: 'center' });
    card(slide, 7.03, 2.0, 5.35, 3.52, C.lilac, C.purple);
    cjk(slide, p(8).lines[3], 7.53, 2.55, 4.35, 0.64, 42, { bold: true, align: 'center' });
    latin(slide, p(8).lines[4], 7.53, 3.52, 4.35, 0.36, 25, { color: C.purple, bold: true, align: 'center' });
    latin(slide, p(8).lines[5], 7.38, 4.18, 4.65, 0.36, 23, { color: C.muted, align: 'center' });
    page(slide, 8);
    notes(slide, '让学生把“谢谢”和“再见”放进完整对话里练习。');
  }

  // 9. Complete dialogue
  {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    title(slide, p(9).lines[0], 9, 40);
    const rows = [
      [[{ text: '你好！' }], [{ text: '你好！' }]],
      [[{ text: '我叫 ' }, { text: 'Minh', fontFace: LATIN_FONT }, { text: '，你呢？' }], [{ text: '我叫 ' }, { text: 'Lan', fontFace: LATIN_FONT }, { text: '。' }]],
      [[{ text: '很高兴认识你！' }], [{ text: '很高兴认识你！' }]],
      [[{ text: '再见！' }], [{ text: '再见！' }]],
    ];
    rows.forEach((row, index) => {
      const y = 1.92 + index * 1.03;
      const fillA = index % 2 === 0 ? C.mint : C.coralSoft;
      const fillB = index % 2 === 0 ? C.coralSoft : C.mint;
      card(slide, 0.9, y, 5.42, 0.72, fillA, index % 2 === 0 ? C.mintDeep : C.coral);
      card(slide, 7.02, y, 5.42, 0.72, fillB, index % 2 === 0 ? C.coral : C.mintDeep);
      label(slide, 'A', 1.14, y + 0.15, 0.62, C.teal);
      label(slide, 'B', 7.26, y + 0.15, 0.62, C.coral);
      rich(slide, row[0], 1.94, y + 0.15, 3.98, 0.36, { fontSize: 25, bold: true, align: 'center' });
      rich(slide, row[1], 7.98, y + 0.15, 3.98, 0.36, { fontSize: 25, bold: true, align: 'center' });
    });
    page(slide, 9);
    notes(slide, '按 A、B 角色完整读一次，再交换角色。学生准备好后去做 P10 的三人任务。');
  }

  // 10. Icebreaker task
  {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    title(slide, p(10).lines[0], 10, 42);
    latin(slide, p(10).lines[1], 0.86, 1.78, 8.8, 0.36, 23, { color: C.muted, bold: true });
    card(slide, 0.9, 2.38, 5.24, 3.85, C.mint, C.mintDeep);
    label(slide, p(10).lines[2], 1.25, 2.72, 1.20, C.teal);
    const taskLines = [p(10).lines[3], p(10).lines[4], p(10).lines[5], p(10).lines[6]];
    taskLines.forEach((line, index) => {
      const y = 3.35 + index * 0.64;
      cjk(slide, line, 1.35, y, 4.3, 0.34, 23, { bold: true });
    });
    card(slide, 6.72, 2.38, 5.72, 3.85, C.coralSoft, C.coral);
    label(slide, p(10).lines[7], 7.08, 2.72, 1.55, C.coral);
    const phrases = ['你好！', '我叫 ______，你呢？', '你叫什么名字？', '很高兴认识你！', '谢谢！', '再见！'];
    phrases.forEach((line, index) => {
      cjk(slide, line, 7.25, 3.28 + index * 0.43, 4.7, 0.30, line.length > 9 ? 21 : 23, { bold: true, align: 'center' });
    });
    page(slide, 10);
    notes(slide, '让学生找三位不同同学。每次完成简短对话后换人。教师只需观察学生是否能完成问候、问名字和结束对话。');
  }

  // 11. Challenge without looking
  {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    title(slide, p(11).title, 11, 42);
    latin(slide, p(11).lines[1], 0.86, 1.82, 4.8, 0.36, 26, { color: C.coral, bold: true });
    cjk(slide, p(11).lines[2], 0.86, 2.35, 6.2, 0.4, 28, { color: C.muted, bold: true });
    card(slide, 1.45, 3.0, 10.55, 2.72, C.lilac, C.purple);
    const challenge = [p(11).lines[3], p(11).lines[4], p(11).lines[5], p(11).lines[6]];
    challenge.forEach((line, index) => {
      cjk(slide, line, 2.05, 3.38 + index * 0.52, 9.35, 0.34, index === 1 ? 26 : 28, { bold: true, align: 'center' });
    });
    page(slide, 11);
    notes(slide, '学生不看投影片，与一个新同学完成四句对话。需要时教师再打开投影片给支架。');
  }

  // 12. Exit checklist
  {
    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    title(slide, p(12).lines[0], 12, 40);
    cjk(slide, p(12).lines[1], 1.05, 1.82, 1.2, 0.35, 24, { color: C.muted, bold: true });
    const checklist = p(12).lines.slice(2, 10);
    checklist.forEach((line, index) => {
      const y = 2.22 + index * 0.40;
      addLine(slide, 1.1, y + 0.29, 10.95, C.line, 0.55);
      cjk(slide, line.slice(0, 1), 1.15, y, 0.35, 0.30, 22, { color: C.teal, bold: true });
      cjk(slide, line.slice(2), 1.68, y, 9.9, 0.30, line.length > 10 ? 21 : 22, { bold: true });
    });
    label(slide, p(12).lines[10], 0.95, 5.72, 1.65, C.coral);
    card(slide, 2.92, 5.56, 9.52, 0.82, C.coralSoft, C.coral);
    cjk(slide, p(12).lines[11], 3.32, 5.78, 8.72, 0.36, 25, { color: C.coral, bold: true, align: 'center' });
    page(slide, 12);
    notes(slide, '下课前让学生自己勾选会说的句子，再找老师说中文并说再见。');
  }

  assert.strictEqual(pptx._slides.length, 12, '必须生成 12 页');
  return pptx;
}

async function main() {
  assert(fs.existsSync(REVIEW_PATH), `找不到逐页文案来源：${REVIEW_PATH}`);
  const slides = parseReview(fs.readFileSync(REVIEW_PATH, 'utf8'));
  assert.strictEqual(slides.length, 12, `逐页文案必须有 12 页，实际 ${slides.length} 页`);

  execFileSync(process.env.BOYA_PYTHON || 'python3', [
    path.join(ROOT, 'scripts/production_gate.py'),
    '--purpose', 'pptx',
    '--stage', 'draft',
    '--lesson-key', LESSON_KEY,
    '--offering-id', OFFERING_ID,
    '--output-dir', path.relative(ROOT, OUT_DIR),
  ], { stdio: 'inherit', cwd: ROOT });

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const pptx = makePptx(slides);
  await pptx.writeFile({ fileName: OUT_PATH });

  const manifest = {
    schema_version: 'boya-support-pptx-draft-v1',
    artifact: 'lesson-01-破冰活动',
    lesson_key: LESSON_KEY,
    offering_id: OFFERING_ID,
    purpose: 'first-week beginner icebreaker projector support',
    status: 'draft_only',
    format: 'native-pptx-only',
    slide_count: 12,
    output: path.relative(ROOT, OUT_PATH),
    source_copy: path.relative(ROOT, REVIEW_PATH),
    fonts: { cjk: CJK_FONT, latin: LATIN_FONT, min_visible_pt: MIN_PT },
    visual_policy: '纯白画布；可编辑色块、线条与文字；不依赖外部图片或链接',
    student_language: '简体中文；必要的拼音和越南文说明按用户文案保留',
    human_gates: {
      content_approval: 'approved_for_this_support_draft',
      powerpoint_playback: 'pending_teacher_playback',
      classroom_rehearsal: 'pending_teacher_rehearsal',
      authority_or_release: 'not_created',
    },
    sha256: crypto.createHash('sha256').update(fs.readFileSync(OUT_PATH)).digest('hex'),
  };
  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify(manifest, null, 2));
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exit(1);
});
