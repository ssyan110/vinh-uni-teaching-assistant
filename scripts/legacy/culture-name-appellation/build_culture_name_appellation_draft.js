const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const PptxGenJS = require('pptxgenjs');
const { toSimplified, toTeacherGuideChinese } = require('./simplify_chinese');

const projectRoot = path.resolve(__dirname, '..');
const projectConfig = JSON.parse(fs.readFileSync(path.join(projectRoot, 'project.config.json'), 'utf8'));
const outputDir = process.env.BOYA_CULTURE_DRAFT_DIR
  ? path.resolve(process.env.BOYA_CULTURE_DRAFT_DIR)
  : path.join(projectRoot, 'lessons/boya-intermediate-i/lesson-01/10-design/pptx-draft/social-appellation-supplement-v1');
const pptxPath = path.join(outputDir, '第一课-文化补充-姓名与称呼-draft.pptx');
const outlinePath = path.join(outputDir, '第一课-文化补充-姓名与称呼-outline.md');
const storyboardPath = path.join(outputDir, '第一课-文化补充-姓名与称呼-storyboard.csv');
const manifestPath = path.join(outputDir, 'manifest.json');

const CJK_FONT = projectConfig.font_policy?.cjk || 'KaiTi';
const LATIN_FONT = projectConfig.font_policy?.latin || 'Times New Roman';
const SW = 13.333;
const SH = 7.5;

const COLORS = {
  paper: 'FBF8F1',
  white: 'FFFDF9',
  ink: '17282C',
  muted: '61736F',
  line: 'CAD4CF',
  mint: 'D8F0E9',
  mintDeep: 'A9D8CB',
  teal: '3C8F86',
  lilac: 'EEE9FF',
  purple: '8C78D7',
  yellow: 'F6D36D',
  yellowSoft: 'FFF1BE',
  coral: 'EA927E',
  coralSoft: 'F9DED4',
  blue: 'DFECF5',
  blueDeep: '6B9AC4',
  green: '4C766D',
  graySoft: 'EEF1ED',
  redSoft: 'F8E2DE',
  red: 'C86D61'
};

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

function addLine(slide, x, y, w, color = COLORS.line, pt = 0.8) {
  slide.addShape('line', { x, y, w, h: 0, line: { color, pt } });
}

function addHeader(slide, page, title, section = '文化补充') {
  addText(slide, '第一课 · 中国人的姓名', 0.72, 0.25, 3.8, 0.24, { fontSize: 11, color: COLORS.muted, bold: true });
  addText(slide, section, 4.95, 0.25, 3.4, 0.24, { fontSize: 11, color: COLORS.muted, bold: true, align: 'center' });
  addText(slide, String(page).padStart(2, '0'), 12.0, 0.25, 0.62, 0.24, { fontSize: 11, color: COLORS.muted, bold: true, align: 'right' });
  addLine(slide, 0.72, 0.66, 11.9, COLORS.line, 0.8);
  slide.addShape('rect', { x: 0.72, y: 0.64, w: 0.48, h: 0.04, fill: { color: COLORS.purple }, line: { color: COLORS.purple, transparency: 100 } });
  const size = title.length > 24 ? 26 : title.length > 18 ? 30 : 34;
  addText(slide, title, 0.78, 0.89, 11.75, 0.58, { fontSize: size, bold: true, valign: 'top' });
}

function addPill(slide, text, x, y, w, fill, color = COLORS.ink, fontSize = 17) {
  slide.addShape('roundRect', { x, y, w, h: 0.48, rectRadius: 0.08, fill: { color: fill }, line: { color: fill, transparency: 100 } });
  addText(slide, text, x + 0.08, y + 0.08, w - 0.16, 0.25, { fontSize, color, bold: true, align: 'center' });
}

function addCard(slide, x, y, w, h, fill = COLORS.white, line = COLORS.line, radius = 0.08) {
  slide.addShape('roundRect', { x, y, w, h, rectRadius: radius, fill: { color: fill }, line: { color: line, pt: 0.75 } });
}

function addIcon(slide, x, y, size, label, fill, color = COLORS.ink, fontSize = 24) {
  slide.addShape('ellipse', { x, y, w: size, h: size, fill: { color: fill }, line: { color: COLORS.ink, pt: 0.55 } });
  addText(slide, label, x, y + size * 0.18, size, size * 0.45, { fontSize, bold: true, color, align: 'center' });
}

function addCheck(slide, x, y, label, checked = false) {
  slide.addShape('rect', { x, y, w: 0.28, h: 0.28, fill: { color: checked ? COLORS.mintDeep : COLORS.white }, line: { color: COLORS.ink, pt: 0.8 } });
  addText(slide, label, x + 0.42, y - 0.02, 1.5, 0.3, { fontSize: 18, bold: true });
}

function addSpeech(slide, x, y, w, h, text, fill, options = {}) {
  addCard(slide, x, y, w, h, fill, options.line || COLORS.ink, 0.06);
  slide.addShape('triangle', { x: x + 0.34, y: y + h - 0.04, w: 0.26, h: 0.2, rotate: 180, fill: { color: fill }, line: { color: options.line || COLORS.ink, pt: 0.6 } });
  addText(slide, text, x + 0.22, y + 0.16, w - 0.44, h - 0.24, { fontSize: options.fontSize || 22, bold: options.bold !== false, align: options.align || 'center' });
}

function addPromptBar(slide, text, color = COLORS.teal) {
  slide.addShape('roundRect', { x: 0.82, y: 6.55, w: 11.68, h: 0.52, rectRadius: 0.08, fill: { color: COLORS.white }, line: { color, pt: 1.2 } });
  addText(slide, text, 1.05, 6.66, 11.22, 0.25, { fontSize: 17, color, bold: true, align: 'center' });
}

function addNotes(slide, text) {
  slide.addNotes(toTeacherGuideChinese(text));
}

function addDivider(slide, title, subtitle, accent = COLORS.mint) {
  slide.background = { color: accent };
  slide.addShape('ellipse', { x: -1.1, y: 4.2, w: 4.3, h: 4.3, fill: { color: COLORS.yellow, transparency: 12 }, line: { color: COLORS.yellow, transparency: 100 } });
  slide.addShape('arc', { x: 8.25, y: -1.45, w: 5.2, h: 5.2, rotate: 195, fill: { color: COLORS.purple, transparency: 70 }, line: { color: COLORS.purple, transparency: 100 } });
  addText(slide, '第一课 · 文化补充', 0.86, 0.86, 3.3, 0.3, { fontSize: 16, color: COLORS.green, bold: true });
  addText(slide, title, 0.86, 2.28, 7.7, 1.2, { fontSize: title.length > 13 ? 42 : 50, bold: true, valign: 'mid' });
  addText(slide, subtitle, 0.9, 3.75, 6.9, 0.55, { fontSize: 22, color: COLORS.green, bold: true });
}

function addPersonPair(slide, x, y, scale = 1) {
  const s = scale;
  slide.addShape('ellipse', { x, y, w: 0.48 * s, h: 0.48 * s, fill: { color: COLORS.yellow }, line: { color: COLORS.ink, pt: 0.7 } });
  slide.addShape('roundRect', { x: x - 0.12 * s, y: y + 0.48 * s, w: 0.72 * s, h: 0.98 * s, rectRadius: 0.12, fill: { color: COLORS.blue }, line: { color: COLORS.ink, pt: 0.7 } });
  slide.addShape('ellipse', { x: x + 1.25 * s, y: y + 0.12 * s, w: 0.48 * s, h: 0.48 * s, fill: { color: COLORS.coral }, line: { color: COLORS.ink, pt: 0.7 } });
  slide.addShape('roundRect', { x: x + 1.03 * s, y: y + 0.6 * s, w: 0.9 * s, h: 0.86 * s, rectRadius: 0.12, fill: { color: COLORS.mintDeep }, line: { color: COLORS.ink, pt: 0.7 } });
  slide.addShape('line', { x: x + 0.62 * s, y: y + 0.85 * s, w: 0.54 * s, h: 0, line: { color: COLORS.purple, pt: 2, beginArrowType: 'none', endArrowType: 'triangle' } });
}

function addNameCardGraphic(slide, x, y, w, h) {
  addCard(slide, x, y, w, h, COLORS.white, COLORS.ink, 0.08);
  slide.addShape('rect', { x: x + 0.2, y: y + 0.22, w: 0.86, h: 0.86, fill: { color: COLORS.lilac }, line: { color: COLORS.purple, pt: 0.8 } });
  addText(slide, '姓', x + 0.2, y + 0.39, 0.86, 0.36, { fontSize: 27, bold: true, color: COLORS.purple, align: 'center' });
  slide.addShape('rect', { x: x + 1.24, y: y + 0.22, w: 0.86, h: 0.86, fill: { color: COLORS.yellowSoft }, line: { color: COLORS.yellow, pt: 0.8 } });
  addText(slide, '名', x + 1.24, y + 0.39, 0.86, 0.36, { fontSize: 27, bold: true, color: COLORS.green, align: 'center' });
  addText(slide, '姓在前，名在后', x + 0.22, y + 1.34, w - 0.44, 0.32, { fontSize: 17, bold: true, color: COLORS.muted, align: 'center' });
}

function addRoute(slide, labels, y = 2.35) {
  const startX = 0.9;
  const gap = 0.23;
  const w = (11.55 - gap * (labels.length - 1)) / labels.length;
  labels.forEach((label, index) => {
    const x = startX + index * (w + gap);
    const fill = [COLORS.mint, COLORS.yellowSoft, COLORS.blue, COLORS.lilac][index % 4];
    addCard(slide, x, y, w, 1.18, fill, COLORS.ink, 0.08);
    addText(slide, label, x + 0.08, y + 0.38, w - 0.16, 0.34, { fontSize: 26, bold: true, align: 'center' });
    if (index < labels.length - 1) addText(slide, '→', x + w + 0.03, y + 0.38, gap - 0.06, 0.34, { fontSize: 24, color: COLORS.purple, bold: true, align: 'center' });
  });
}

function slide1(slide) {
  addDivider(slide, '中国人如何给孩子取名字？', '先认识三种常见方法。', COLORS.mint);
  addNameCardGraphic(slide, 9.2, 1.85, 2.8, 2.1);
  addNotes(slide, '本页是取名补充内容的分隔页。只介绍三种常见做法，不加入传统称谓“字”“号”或复杂传统命理知识。');
}

function slide2(slide) {
  slide.background = { color: COLORS.paper };
  addHeader(slide, 2, '请别人帮忙取名字');
  addCard(slide, 0.82, 1.72, 7.22, 4.3, COLORS.mint, COLORS.mintDeep);
  addIcon(slide, 1.24, 2.12, 0.78, '问', COLORS.yellow, COLORS.ink, 27);
  addText(slide, '有些家庭会请算命老师\n帮孩子取一个名字。', 2.26, 2.02, 5.2, 0.96, { fontSize: 31, bold: true });
  addText(slide, '他们希望名字符合自己的传统想法，\n也希望孩子平安、顺利。', 2.26, 3.28, 5.2, 0.72, { fontSize: 23, color: COLORS.green, bold: true });
  addPersonPair(slide, 9.25, 2.25, 1.1);
  addText(slide, '请别人帮忙', 8.55, 4.45, 3.2, 0.4, { fontSize: 23, color: COLORS.purple, bold: true, align: 'center' });
  addPromptBar(slide, '读一读，说一说：他们为什么请别人帮忙？', COLORS.teal);
  addNotes(slide, '“算命老师”只作为一种社会文化现象简单提及。不要解释八字、五行、出生时间或任何命理依据，也不要把这种方式说成一定有效。');
}

function slide3(slide) {
  slide.background = { color: COLORS.paper };
  addHeader(slide, 3, '把期望和祝福放进名字里');
  addText(slide, '父母常常把对孩子的期望和祝福放进名字里。', 0.9, 1.58, 7.8, 0.52, { fontSize: 25, bold: true });
  const items = [
    ['健康', COLORS.mint, '心'],
    ['聪明', COLORS.yellowSoft, '明'],
    ['勇敢', COLORS.blue, '勇'],
    ['平安', COLORS.lilac, '安']
  ];
  items.forEach((item, index) => {
    const x = 0.92 + (index % 4) * 3.02;
    addCard(slide, x, 2.52, 2.65, 2.25, item[1], COLORS.ink);
    addIcon(slide, x + 0.88, 2.83, 0.9, item[2], COLORS.white, COLORS.purple, 28);
    addText(slide, item[0], x + 0.25, 4.0, 2.15, 0.38, { fontSize: 24, bold: true, align: 'center' });
  });
  addPromptBar(slide, '和同伴说一说：你觉得父母最希望孩子怎么样？', COLORS.purple);
  addNotes(slide, '本页只保留“期望与祝福”这一文化重点。提醒学生：不同家庭的想法不一样，卡片中的词语只是示例，不是固定答案。');
}

function slide4(slide) {
  slide.background = { color: COLORS.paper };
  addHeader(slide, 4, '自己选字、组合名字');
  addCard(slide, 0.82, 1.55, 5.65, 4.45, COLORS.yellowSoft, COLORS.yellow);
  addIcon(slide, 1.28, 2.0, 0.8, '字', COLORS.white, COLORS.green, 27);
  addText(slide, '有些父母自己查字、选字、\n组合名字。', 2.25, 1.92, 3.65, 0.82, { fontSize: 29, bold: true });
  addText(slide, '他们希望名字：', 1.28, 3.35, 3.5, 0.35, { fontSize: 23, bold: true, color: COLORS.green });
  addCheck(slide, 1.35, 4.0, '好写');
  addCheck(slide, 3.52, 4.0, '好记');
  addCheck(slide, 1.35, 4.55, '意思好');
  addCheck(slide, 3.52, 4.55, '读起来清楚');
  addCard(slide, 7.15, 1.55, 5.32, 4.45, COLORS.white, COLORS.line);
  addText(slide, '我会选择：', 7.62, 2.0, 2.8, 0.35, { fontSize: 22, bold: true, color: COLORS.green });
  ['好写', '好记', '意思好'].forEach((label, index) => {
    addPill(slide, label, 7.62 + index * 1.6, 2.72, 1.4, [COLORS.mint, COLORS.blue, COLORS.lilac][index], COLORS.ink, 17);
  });
  addText(slide, '我认为好名字应该________。\n因为________________。', 7.62, 3.72, 4.2, 1.15, { fontSize: 24, bold: true, valign: 'top' });
  addPromptBar(slide, '从三个条件中选两个，和同伴说说你的理由。', COLORS.teal);
  addNotes(slide, '学生只讨论好写、好记、意思好和读音清楚。这里的“选字”只表示选择姓名用字，不扩展到传统称谓“字”“号”或复杂传统命理知识。');
}

function slide5(slide) {
  addDivider(slide, '怎么称呼别人？', '先看关系、身份和场合。', COLORS.blue);
  addSpeech(slide, 8.75, 1.65, 2.75, 0.86, '您好，请问怎么称呼您？', COLORS.white, { fontSize: 19 });
  addSpeech(slide, 9.45, 3.0, 2.3, 0.78, '我姓王。', COLORS.yellowSoft, { fontSize: 22 });
  addNotes(slide, '本页进入称呼主题。称呼不是只看姓或名字，要结合关系、年龄、身份和场合。');
}

function slide6(slide) {
  slide.background = { color: COLORS.paper };
  addHeader(slide, 6, '你会怎么问？');
  addCard(slide, 0.82, 1.52, 5.5, 4.72, COLORS.mint, COLORS.mintDeep);
  addIcon(slide, 1.28, 1.98, 0.75, '问', COLORS.yellow, COLORS.ink, 25);
  addText(slide, '第一次见到一位老师，\n你会怎么问？', 2.25, 1.94, 3.45, 0.85, { fontSize: 30, bold: true });
  addPersonPair(slide, 2.0, 3.38, 0.82);
  addCard(slide, 6.8, 1.52, 5.72, 4.72, COLORS.white, COLORS.line);
  const choices = [
    ['A', '你叫什么名字？', COLORS.yellowSoft],
    ['B', '请问您贵姓？', COLORS.lilac],
    ['C', '请问怎么称呼您？', COLORS.blue]
  ];
  choices.forEach((choice, index) => {
    const y = 1.98 + index * 1.22;
    addCard(slide, 7.35, y, 4.62, 0.82, choice[2], COLORS.ink);
    addText(slide, choice[0], 7.62, y + 0.18, 0.4, 0.3, { fontSize: 20, color: COLORS.purple, bold: true, align: 'center' });
    addText(slide, choice[1], 8.18, y + 0.18, 3.4, 0.3, { fontSize: 22, bold: true });
  });
  addPromptBar(slide, '先和同伴讨论，再说出你的选择。', COLORS.purple);
  addNotes(slide, '不要先公布唯一答案。让学生根据关系、身份和场合讨论；最后说明“怎么称呼您”是较稳妥的通用问法。');
}

function readingPanel(slide, page, title, body, action, note) {
  slide.background = { color: COLORS.paper };
  addHeader(slide, page, title);
  addCard(slide, 0.88, 1.54, 11.58, 4.42, COLORS.white, COLORS.line);
  addText(slide, body, 1.32, 1.98, 10.7, 2.82, { fontSize: 25, bold: true, valign: 'top', breakLine: true, fit: 'shrink' });
  slide.addShape('roundRect', { x: 1.32, y: 5.0, w: 2.25, h: 0.46, rectRadius: 0.08, fill: { color: COLORS.mint }, line: { color: COLORS.mint, transparency: 100 } });
  addText(slide, '读一读，找一找', 1.47, 5.1, 1.95, 0.22, { fontSize: 16, color: COLORS.teal, bold: true, align: 'center' });
  addText(slide, action, 3.88, 5.08, 7.9, 0.28, { fontSize: 19, color: COLORS.green, bold: true });
  addPromptBar(slide, '先自己读，再和同伴说出你找到的内容。', COLORS.teal);
  addNotes(slide, note);
}

function slide7(slide) {
  readingPanel(
    slide,
    7,
    '阅读短文（一）',
    '在中国，称呼别人要看关系、年龄、身份和场合。\n第一次见面，如果想知道对方的姓，可以礼貌地问：“请问您贵姓？”\n也可以问：“请问怎么称呼您？”对方可以回答：“我姓王。”',
    '圈出两种礼貌的问法。',
    '本页是补充短文的第一部分。不要逐句翻译，先让学生找出可直接使用的问法。'
  );
}

function slide8(slide) {
  readingPanel(
    slide,
    8,
    '阅读短文（二）',
    '知道对方的身份以后，常常用“姓＋身份”来称呼，例如“王老师”“李医生”。\n熟人之间可以直接叫名字，也可以使用“小王”“老李”。\n如果不知道怎么称呼别人，可以先说：“您好，请问怎么称呼您？”',
    '找出三个称呼。',
    '本页继续补充短文。提醒学生“小王”“老李”要看关系和年龄，不能在所有场合使用。'
  );
}

function slide9(slide) {
  slide.background = { color: COLORS.paper };
  addHeader(slide, 9, '称呼要看什么？');
  addRoute(slide, ['关系', '年龄', '身份', '场合'], 1.76);
  const examples = [
    ['第一次见面', '先用礼貌问法', COLORS.mint],
    ['学校里', '姓＋老师／同学', COLORS.yellowSoft],
    ['熟人之间', '名字／小王／老李', COLORS.lilac],
    ['不知道怎么叫', '先说“您好”', COLORS.blue]
  ];
  examples.forEach((item, index) => {
    const x = 0.92 + (index % 4) * 3.02;
    addCard(slide, x, 3.55, 2.65, 1.62, item[2], COLORS.ink);
    addText(slide, item[0], x + 0.16, 3.82, 2.33, 0.3, { fontSize: 21, bold: true, align: 'center' });
    addText(slide, item[1], x + 0.16, 4.32, 2.33, 0.46, { fontSize: 18, color: COLORS.green, bold: true, align: 'center' });
  });
  addPromptBar(slide, '先看四件事，再判断应该怎么称呼。', COLORS.purple);
  addNotes(slide, '用四个简单词建立判断框架：关系、年龄、身份、场合。不要把称呼规则简化成“叫姓就是正式、叫名就是亲近”。');
}

function phraseCard(slide, x, y, w, h, chinese, pinyin, fill, label) {
  addCard(slide, x, y, w, h, fill, COLORS.ink);
  if (label) addText(slide, label, x + 0.18, y + 0.18, w - 0.36, 0.26, { fontSize: 15, color: COLORS.green, bold: true, align: 'center' });
  addText(slide, chinese, x + 0.18, y + 0.52, w - 0.36, 0.34, { fontSize: chinese.length > 10 ? 22 : 25, bold: true, align: 'center' });
  addLatin(slide, pinyin, x + 0.16, y + 0.96, w - 0.32, 0.24, { fontSize: 13, align: 'center' });
}

function slide10(slide) {
  slide.background = { color: COLORS.paper };
  addHeader(slide, 10, '怎么问姓名？');
  phraseCard(slide, 0.88, 1.58, 3.58, 2.0, '你叫什么名字？', 'nǐ jiào shénme míngzi?', COLORS.yellowSoft, '同学之间');
  phraseCard(slide, 4.88, 1.58, 3.58, 2.0, '请问您贵姓？', 'qǐngwèn nín guì xìng?', COLORS.lilac, '正式询问姓氏');
  phraseCard(slide, 8.88, 1.58, 3.58, 2.0, '怎么称呼您？', 'zěnme chēnghu nín?', COLORS.blue, '不知道怎么叫');
  addCard(slide, 1.2, 4.18, 10.92, 1.52, COLORS.white, COLORS.line);
  addText(slide, '和同伴说一说：哪一句适合哪个场合？', 1.58, 4.57, 10.15, 0.38, { fontSize: 25, color: COLORS.green, bold: true, align: 'center' });
  addPromptBar(slide, '先选择，再说出你的理由。', COLORS.teal);
  addNotes(slide, '“你叫什么名字？”不是绝对错误，要看关系和场合。教学重点是让学生知道正式初见时可以使用“请问您贵姓？”或“怎么称呼您？”。');
}

function slide11(slide) {
  slide.background = { color: COLORS.paper };
  addHeader(slide, 11, '问姓，不等于称呼');
  addCard(slide, 0.9, 1.55, 5.55, 4.65, COLORS.lilac, COLORS.purple);
  addText(slide, '问姓', 1.28, 1.98, 1.3, 0.38, { fontSize: 25, color: COLORS.purple, bold: true, align: 'center' });
  addSpeech(slide, 1.32, 2.62, 4.52, 0.78, '请问您贵姓？', COLORS.white, { fontSize: 25 });
  addSpeech(slide, 1.75, 4.02, 3.7, 0.78, '我姓王。', COLORS.yellowSoft, { fontSize: 25 });
  addCard(slide, 6.88, 1.55, 5.55, 4.65, COLORS.mint, COLORS.mintDeep);
  addText(slide, '称呼', 7.26, 1.98, 1.3, 0.38, { fontSize: 25, color: COLORS.teal, bold: true, align: 'center' });
  addSpeech(slide, 7.3, 2.62, 4.52, 0.78, '怎么称呼您？', COLORS.white, { fontSize: 25 });
  addSpeech(slide, 7.72, 4.02, 3.7, 0.78, '叫我王老师就可以。', COLORS.yellowSoft, { fontSize: 22 });
  addPromptBar(slide, '听完以后，分清“问姓”和“称呼”。', COLORS.purple);
  addNotes(slide, '这是本段最重要的区别：问姓得到“我姓……”，询问称呼则给对方选择如何被称呼。');
}

function slide12(slide) {
  slide.background = { color: COLORS.paper };
  addHeader(slide, 12, '姓＋身份');
  const items = [
    ['王老师', 'Wáng lǎoshī', COLORS.mint, '学校'],
    ['李医生', 'Lǐ yīshēng', COLORS.blue, '医院'],
    ['张经理', 'Zhāng jīnglǐ', COLORS.yellowSoft, '工作'],
    ['王律师', 'Wáng lǜshī', COLORS.lilac, '工作']
  ];
  items.forEach((item, index) => {
    const x = 0.88 + (index % 2) * 6.08;
    const y = 1.62 + Math.floor(index / 2) * 1.85;
    addCard(slide, x, y, 5.5, 1.38, item[2], COLORS.ink);
    addText(slide, item[0], x + 0.26, y + 0.28, 2.75, 0.38, { fontSize: 29, bold: true });
    addLatin(slide, item[1], x + 0.28, y + 0.82, 2.65, 0.24, { fontSize: 14 });
    addPill(slide, item[3], x + 4.02, y + 0.46, 1.08, COLORS.white, COLORS.green, 15);
  });
  addCard(slide, 2.1, 5.42, 9.14, 0.7, COLORS.white, COLORS.line);
  addText(slide, '把姓和身份说在一起，通常更清楚、更得体。', 2.35, 5.62, 8.65, 0.26, { fontSize: 21, color: COLORS.green, bold: true, align: 'center' });
  addPromptBar(slide, '把姓和身份说成一个完整称呼。', COLORS.teal);
  addNotes(slide, '本页只呈现高频、实用的“姓＋身份”表达。学生不需要背职业称呼分类，只要能根据场合说出一个合适称呼。');
}

function slide13(slide) {
  slide.background = { color: COLORS.paper };
  addHeader(slide, 13, '熟人之间怎么叫？');
  const items = [
    ['名字', '关系比较熟', COLORS.mint, '名字'],
    ['小王', '熟人、同事', COLORS.yellowSoft, '小＋姓'],
    ['老李', '熟人、同事', COLORS.lilac, '老＋姓']
  ];
  items.forEach((item, index) => {
    const x = 0.9 + index * 4.12;
    addCard(slide, x, 1.8, 3.65, 2.72, item[2], COLORS.ink);
    addIcon(slide, x + 1.38, 2.18, 0.84, item[3].slice(0, 1), COLORS.white, COLORS.purple, 25);
    addText(slide, item[0], x + 0.24, 3.27, 3.17, 0.36, { fontSize: 28, bold: true, align: 'center' });
    addText(slide, item[1], x + 0.25, 3.83, 3.15, 0.3, { fontSize: 18, color: COLORS.green, bold: true, align: 'center' });
  });
  addCard(slide, 1.42, 5.05, 10.45, 0.82, COLORS.redSoft, COLORS.red);
  addText(slide, '注意：不能看到一个姓，就随便加“小”或“老”。', 1.72, 5.31, 9.85, 0.28, { fontSize: 21, color: COLORS.red, bold: true, align: 'center' });
  addPromptBar(slide, '说一说：这些称呼适合什么关系？', COLORS.purple);
  addNotes(slide, '“小王”“老李”不是固定礼貌等级。强调熟悉程度、年龄和关系，避免学生把它们当成通用称呼。');
}

function slide14(slide) {
  slide.background = { color: COLORS.paper };
  addHeader(slide, 14, '不确定时，先用安全称呼');
  const items = [
    ['您好', '第一次开口', COLORS.mint, 'nín hǎo'],
    ['服务员', '餐厅、服务场合', COLORS.yellowSoft, 'fúwùyuán'],
    ['师傅', '司机、厨师、维修工', COLORS.blue, 'shīfu'],
    ['女士', '比较正式的称呼', COLORS.lilac, 'nǚshì']
  ];
  items.forEach((item, index) => {
    const x = 0.9 + (index % 2) * 6.1;
    const y = 1.62 + Math.floor(index / 2) * 1.82;
    addCard(slide, x, y, 5.5, 1.38, item[2], COLORS.ink);
    addText(slide, item[0], x + 0.28, y + 0.25, 2.2, 0.38, { fontSize: 29, bold: true });
    addLatin(slide, item[3], x + 0.3, y + 0.82, 2.2, 0.24, { fontSize: 14 });
    addText(slide, item[1], x + 2.85, y + 0.47, 2.2, 0.35, { fontSize: 18, color: COLORS.green, bold: true, align: 'center' });
  });
  addCard(slide, 1.55, 5.46, 10.2, 0.62, COLORS.white, COLORS.teal);
  addText(slide, '您好，请问怎么称呼您？', 1.85, 5.65, 9.6, 0.25, { fontSize: 22, color: COLORS.teal, bold: true, align: 'center' });
  addPromptBar(slide, '选择一个安全说法，再和同伴练习。', COLORS.teal);
  addNotes(slide, '“您好，请问怎么称呼您？”是本页的安全默认句。服务员、师傅、女士的使用也要看场合，不要教成唯一答案。');
}

function slide15(slide) {
  slide.background = { color: COLORS.paper };
  addHeader(slide, 15, '这些词不能随便用');
  const items = [
    ['小姐', '不一定适合称呼陌生女性', '可以说：您好／服务员／女士', COLORS.redSoft],
    ['太太', '要看具体语境，不是万能称呼', '不确定时先说：女士', COLORS.yellowSoft],
    ['女人', '是描述性词语，不适合直接称呼陌生女性', '可以使用职业或女士', COLORS.lilac]
  ];
  items.forEach((item, index) => {
    const x = 0.82 + index * 4.13;
    addCard(slide, x, 1.6, 3.7, 4.48, item[3], COLORS.ink);
    addText(slide, item[0], x + 0.2, 1.98, 3.3, 0.42, { fontSize: 29, bold: true, color: COLORS.red, align: 'center' });
    addText(slide, item[1], x + 0.3, 2.8, 3.1, 0.92, { fontSize: 19, bold: true, align: 'center', valign: 'top' });
    addLine(slide, x + 0.45, 4.08, 2.8, COLORS.line, 0.8);
    addText(slide, item[2], x + 0.35, 4.42, 3.0, 0.7, { fontSize: 18, color: COLORS.green, bold: true, align: 'center', valign: 'top' });
  });
  addPromptBar(slide, '把不确定的说法换成更安全的说法。', COLORS.red);
  addNotes(slide, '这些提醒按“使用分寸”呈现，不写成绝对禁令。重点是学生在不确定时选择“您好”、职业称呼或“女士”。');
}

function slide16(slide) {
  slide.background = { color: COLORS.paper };
  addHeader(slide, 16, '情境任务：完成一次第一次见面');
  addCard(slide, 0.88, 1.52, 4.2, 4.75, COLORS.mint, COLORS.mintDeep);
  addIcon(slide, 1.38, 1.98, 0.82, '说', COLORS.yellow, COLORS.ink, 25);
  addText(slide, '两人一组', 2.42, 2.05, 2.0, 0.36, { fontSize: 25, bold: true });
  addText(slide, '第一次见面时：\n1. 询问姓名\n2. 确认姓氏\n3. 选择合适称呼\n4. 礼貌追问一次', 1.38, 2.92, 3.05, 2.05, { fontSize: 22, bold: true, valign: 'top' });
  addCard(slide, 5.55, 1.52, 6.86, 4.75, COLORS.white, COLORS.line);
  addSpeech(slide, 6.05, 1.98, 5.45, 0.68, '您好，请问您贵姓？', COLORS.blue, { fontSize: 23 });
  addSpeech(slide, 6.55, 2.98, 4.45, 0.68, '我姓王。', COLORS.yellowSoft, { fontSize: 23 });
  addSpeech(slide, 6.05, 3.98, 5.45, 0.68, '请问怎么称呼您？', COLORS.lilac, { fontSize: 23 });
  addSpeech(slide, 6.55, 4.98, 4.45, 0.68, '叫我王老师就可以。', COLORS.mint, { fontSize: 21 });
  addPromptBar(slide, '两人一组，完成对话，再交换角色。', COLORS.teal);
  addNotes(slide, '先让学生使用页面上的语言完成一次对话。教师只处理影响理解或礼貌程度的高影响问题。');
}

function slide17(slide) {
  slide.background = { color: COLORS.paper };
  addHeader(slide, 17, '情况有变');
  addCard(slide, 0.92, 1.68, 5.25, 3.85, COLORS.coralSoft, COLORS.coral);
  addText(slide, '对方说：', 1.35, 2.1, 2.0, 0.35, { fontSize: 24, color: COLORS.red, bold: true });
  addSpeech(slide, 1.35, 2.72, 4.1, 0.92, '叫我小王就可以。', COLORS.white, { fontSize: 28 });
  addCard(slide, 6.72, 1.68, 5.72, 3.85, COLORS.mint, COLORS.mintDeep);
  addText(slide, '你要怎么做？', 7.18, 2.1, 3.2, 0.35, { fontSize: 24, color: COLORS.teal, bold: true });
  addText(slide, '重新选择称呼，\n再说一次对话。', 7.18, 2.9, 4.15, 1.05, { fontSize: 31, bold: true, align: 'center' });
  addPromptBar(slide, '根据对方的选择调整称呼，再演一次。', COLORS.purple);
  addNotes(slide, '本页练习“根据对方的自我介绍调整称呼”。不要把“小王”解释成所有场合都适用。');
}

function slide18(slide) {
  slide.background = { color: COLORS.paper };
  addHeader(slide, 18, '你现在会怎么称呼？');
  const items = [
    ['第一次见老师', '我会说：________________', COLORS.mint],
    ['第一次见医生', '我会说：________________', COLORS.blue],
    ['不知道怎么称呼', '我会说：________________', COLORS.yellowSoft]
  ];
  items.forEach((item, index) => {
    const x = 0.9 + index * 4.12;
    addCard(slide, x, 1.72, 3.65, 2.58, item[2], COLORS.ink);
    addText(slide, item[0], x + 0.22, 2.08, 3.2, 0.35, { fontSize: 23, bold: true, align: 'center' });
    addText(slide, item[1], x + 0.26, 3.08, 3.08, 0.4, { fontSize: 19, color: COLORS.green, bold: true, align: 'center' });
  });
  addCard(slide, 1.62, 4.9, 10.1, 0.92, COLORS.lilac, COLORS.purple);
  addText(slide, '每个人说一句：我会称呼他／她为……因为……', 1.9, 5.2, 9.55, 0.32, { fontSize: 22, color: COLORS.purple, bold: true, align: 'center' });
  addNotes(slide, '课末回收学生是否能根据场合选择称呼，并说出一个简单理由。开放回答不设唯一标准答案，教师根据可理解度和场合适切性反馈。');
}

const renderers = [slide1, slide2, slide3, slide4, slide5, slide6, slide7, slide8, slide9, slide10, slide11, slide12, slide13, slide14, slide15, slide16, slide17, slide18];

const storyboard = [
  ['1', '姓名', 'divider', '中国人如何给孩子取名字？', '先认识三种常见方法。', 'SUP-NAME-001'],
  ['2', '姓名', 'culture', '请别人帮忙取名字', '读一读，说一说：他们为什么请别人帮忙？', 'SUP-NAME-002'],
  ['3', '姓名', 'culture', '把期望和祝福放进名字里', '和同伴说一说：你觉得父母最希望孩子怎么样？', 'SUP-NAME-003'],
  ['4', '姓名', 'culture', '自己选字、组合名字', '从三个条件中选两个，和同伴说说你的理由。', 'SUP-NAME-004'],
  ['5', '称呼', 'divider', '怎么称呼别人？', '先看关系、身份和场合。', 'SUP-APP-001'],
  ['6', '称呼', 'warmup', '你会怎么问？', '先和同伴讨论，再说出你的选择。', 'SUP-APP-002'],
  ['7', '称呼', 'reading', '阅读短文（一）', '圈出两种礼貌的问法。', 'SUP-APP-003'],
  ['8', '称呼', 'reading', '阅读短文（二）', '找出三个称呼。', 'SUP-APP-004'],
  ['9', '称呼', 'framework', '称呼要看什么？', '先看四件事，再判断应该怎么称呼。', 'SUP-APP-005'],
  ['10', '称呼', 'phrases', '怎么问姓名？', '先选择，再说出你的理由。', 'SUP-APP-006'],
  ['11', '称呼', 'contrast', '问姓，不等于称呼', '听完以后，分清“问姓”和“称呼”。', 'SUP-APP-007'],
  ['12', '称呼', 'address', '姓＋身份', '把姓和身份说成一个完整称呼。', 'SUP-APP-008'],
  ['13', '称呼', 'familiar', '熟人之间怎么叫？', '说一说：这些称呼适合什么关系？', 'SUP-APP-009'],
  ['14', '称呼', 'safe', '不确定时，先用安全称呼', '选择一个安全说法，再和同伴练习。', 'SUP-APP-010'],
  ['15', '称呼', 'caution', '这些词不能随便用', '把不确定的说法换成更安全的说法。', 'SUP-APP-011'],
  ['16', '称呼', 'roleplay', '情境任务：完成一次第一次见面', '两人一组，完成对话，再交换角色。', 'SUP-APP-012'],
  ['17', '称呼', 'twist', '情况有变', '根据对方的选择调整称呼，再演一次。', 'SUP-APP-013'],
  ['18', '称呼', 'exit', '你现在会怎么称呼？', '每个人说一句：我会称呼他／她为……因为……', 'SUP-APP-014']
];

function csvCell(value) {
  return `"${String(value == null ? '' : value).replace(/"/g, '""')}"`;
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function assertProductionGate() {
  execFileSync(process.env.BOYA_PYTHON || 'python3', [
    path.join(projectRoot, 'scripts/production_gate.py'),
    '--purpose', 'pptx',
    '--output-dir', outputDir
  ], { stdio: 'inherit' });
}

function writeStoryboard() {
  const headers = ['slide_no', 'section', 'page_type', 'student_title', 'student_action', 'source_ref'];
  fs.writeFileSync(storyboardPath, [headers, ...storyboard].map((row) => row.map(csvCell).join(',')).join('\n') + '\n');
  const outline = [
    '# 第一课文化补充：姓名与称呼',
    '',
    '状态：draft_for_review',
    '',
    '本 draft 不覆盖第一课 20-approved authority；学生页面使用简体中文，补充内容不加入传统称谓“字”“号”或复杂传统命理知识；“选字”只表示选择姓名用字。',
    '',
    '| 页码 | 部分 | 页面标题 | 学生要做什么 | 来源编号 |',
    '| ---: | --- | --- | --- | --- |',
    ...storyboard.map((row) => `| ${row[0]} | ${row[1]} | ${row[3]} | ${row[4]} | ${row[5]} |`),
    ''
  ];
  fs.writeFileSync(outlinePath, outline.join('\n'));
}

async function main() {
  assertProductionGate();
  fs.mkdirSync(outputDir, { recursive: true });
  writeStoryboard();

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = '荣市大学华语听说课程';
  pptx.company = '荣市大学';
  pptx.subject = '第一课文化补充：姓名与称呼';
  pptx.title = '第一课文化补充：姓名与称呼';
  pptx.lang = 'zh-CN';
  pptx.theme = { headFontFace: CJK_FONT, bodyFontFace: CJK_FONT, lang: 'zh-CN' };

  renderers.forEach((renderer) => {
    const slide = pptx.addSlide();
    renderer(slide);
  });

  await pptx.writeFile({ fileName: pptxPath });
  const manifest = {
    status: 'draft_for_review',
    deck_title: '第一课文化补充：姓名与称呼',
    slide_count: renderers.length,
    format: 'native_editable_pptx',
    layout: '16:9',
    language: '简体中文',
    cjk_font: CJK_FONT,
    latin_font: LATIN_FONT,
    no_textbook_page_markers: true,
    scope: ['如何给孩子取名字：三种常见方式', '如何称呼中国人：关系、年龄、身份、场合'],
    exclusions: ['传统称谓“字”', '传统称谓“号”', '复杂传统命理知识'],
    output_files: [path.basename(pptxPath), path.basename(outlinePath), path.basename(storyboardPath)],
    pptx_sha256: sha256(pptxPath),
    speaker_notes_count: renderers.length,
    classroom_rehearsal: 'not_run'
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(JSON.stringify({
    pptx: pptxPath,
    outline: outlinePath,
    storyboard: storyboardPath,
    manifest: manifestPath,
    slide_count: renderers.length,
    speaker_notes: renderers.length,
    sha256: manifest.pptx_sha256
  }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
