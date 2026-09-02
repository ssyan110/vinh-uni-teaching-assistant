const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const PptxGenJS = require('pptxgenjs');
const design = require('./boya_design_system');

const root = path.resolve(__dirname, '..');
const lessonRoot = path.join(root, 'lessons/boya-quasi-intermediate-i/lesson-01');
const outputDir = process.env.BOYA_F2F_PPTX_DRAFT_DIR || path.join(lessonRoot, '10-design/pptx-draft/face-to-face');
const outputPath = path.join(outputDir, 'lesson-01-实体课.pptx');
const sourcePath = path.join(lessonRoot, '00-source/source-extraction-draft.json');
const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const sections = Object.fromEntries(source.sections.map((section) => [section.id, section]));
const audioRoot = path.join(root, 'textbooks/boya-quasi-intermediate-i/source/audio/lesson-01');
const assetRoot = path.join(lessonRoot, '10-design/image-assets-draft');
const pageRoot = path.join(assetRoot, 'textbook-pages');

// The gate is intentionally run before creating the draft output directory.
if (process.env.BOYA_RECOVERY_REBUILD !== '1') {
  execFileSync(process.env.BOYA_PYTHON || 'python3', [
    path.join(root, 'scripts/production_gate.py'), '--purpose', 'pptx', '--stage', 'draft',
    '--lesson-key', 'boya-quasi-intermediate-i:lesson-01', '--output-dir', path.join(lessonRoot, '10-design/pptx-draft')
  ], { stdio: 'inherit' });
}

fs.mkdirSync(outputDir, { recursive: true });

const W = 13.333;
const H = 7.5;
const FONT_CJK = design.fonts.cjk;
const FONT_LATIN = design.fonts.latin;
const C = { ...design.colors };
const T = design.pptTypography;
const pageMarkers = {};

function addText(slide, text, x, y, w, h, opts = {}) {
  slide.addText(text, {
    x, y, w, h, fontFace: opts.fontFace || FONT_CJK,
    fontSize: opts.fontSize || T.body_pt, color: opts.color || C.ink,
    margin: opts.margin === undefined ? 0.04 : opts.margin,
    breakLine: false, fit: 'shrink', valign: opts.valign || 'mid',
    align: opts.align || 'left', bold: opts.bold || false,
    italic: opts.italic || false, paraSpaceAfterPt: 0,
    lang: opts.lang || 'zh-CN', ...opts
  });
}

function addHeader(slide, n, pageLabel, bg = C.slideBackground) {
  // The finalized L1-L6 decks use a pure-white canvas. Keep the legacy bg
  // parameter for call-site compatibility, but never let it control the slide.
  slide.background = { color: C.slideBackground };
  if (pageLabel) pageMarkers[String(n)] = pageLabel;
  addText(slide, '第一课｜丽丽是独生女', 0.65, 0.25, 4.5, 0.28, { fontSize: T.header_pt, color: C.slate, bold: true });
  addText(slide, String(n).padStart(2, '0'), 12.0, 0.25, 0.65, 0.28, { fontSize: T.header_pt, color: C.slate, align: 'right', fontFace: FONT_LATIN });
  slide.addShape('line', { x: 0.65, y: 0.69, w: 12.0, h: 0, line: { color: C.line, pt: 1 } });
  if (pageLabel) slide.addText([
    { text: '教材 ', options: { fontFace: FONT_CJK, fontSize: T.page_marker_pt, color: C.slate } },
    { text: pageLabel.replace(/^教材\s*/, ''), options: { fontFace: FONT_LATIN, fontSize: T.page_marker_pt, color: C.slate } }
  ], {
    x: 10.55, y: 7.02, w: 2.1, h: 0.28, margin: 0, fit: 'shrink', valign: 'mid', align: 'right', lang: 'zh-CN',
    objectName: `Textbook Page Marker ${n}`
  });
}

function addPill(slide, text, x, y, w, color = C.teal) {
  slide.addShape('roundRect', { x, y, w, h: 0.42, rectRadius: 0.08, fill: { color }, line: { color, transparency: 100 } });
  addText(slide, text, x + 0.08, y + 0.03, w - 0.16, 0.3, { fontSize: 20, color: C.white, bold: true, align: 'center' });
}

function addTitle(slide, title, subtitle = '') {
  addText(slide, title, 0.72, 0.98, 8.0, 0.62, { fontSize: T.slide_title_pt, bold: true, valign: 'top' });
  if (subtitle) addText(slide, subtitle, 0.75, 1.66, 8.6, 0.42, { fontSize: T.subtitle_pt, color: C.slate, valign: 'top' });
}

function addImage(slide, filename, x, y, w, h) {
  const full = path.isAbsolute(filename) ? filename : path.join(assetRoot, filename);
  if (!fs.existsSync(full)) {
    slide.addShape('roundRect', { x, y, w, h, rectRadius: 0.08, fill: { color: C.mint }, line: { color: C.line, pt: 1 } });
    addText(slide, path.basename(full, path.extname(full)).replace(/[-_]+/g, ' '), x + 0.12, y + h / 2 - 0.18, w - 0.24, 0.36, { fontSize: 20, color: C.teal, bold: true, align: 'center' });
    return;
  }
  slide.addShape('roundRect', { x, y, w, h, rectRadius: 0.08, fill: { color: C.white }, line: { color: C.line, pt: 1 } });
  slide.addImage({ path: full, x: x + 0.06, y: y + 0.06, w: w - 0.12, h: h - 0.12 });
}

function addAudio(slide, track) {
  const p = path.join(audioRoot, `${track}.mp3`);
  if (!fs.existsSync(p)) throw new Error(`Missing audio ${p}`);
  // Keep the visible label separate from the clickable media object so the
  // audio relationship remains reachable in PowerPoint.
  slide.addShape('roundRect', { x: 10.42, y: 0.96, w: 1.58, h: 0.62, rectRadius: 0.08, fill: { color: C.coral, transparency: 5 }, line: { color: C.coral, transparency: 100 } });
  // Keep the visible track label numeric-only. This avoids the PowerPoint
  // fallback/garbling seen when Chinese characters were forced through a
  // Latin font in the previous draft; the surrounding slide is already Chinese.
  addText(slide, track, 10.52, 1.1, 1.38, 0.26, { fontSize: 21, color: C.white, bold: true, align: 'center', fontFace: FONT_LATIN });
  slide.addMedia({ type: 'audio', path: p, x: 12.08, y: 1.02, w: 0.52, h: 0.52, objectName: `音频 ${track} 播放` });
}

function addSteps(slide, steps, x = 0.85, y = 2.35) {
  steps.forEach((step, idx) => {
    const xx = x + idx * 2.45;
    if (idx < steps.length - 1) {
      slide.addShape('line', {
        x: xx + 0.55, y: y + 0.24, w: 1.55, h: 0,
        line: { color: C.line, pt: 2, endArrowType: 'triangle' }
      });
    }
    slide.addShape('ellipse', { x: xx, y, w: 0.48, h: 0.48, fill: { color: [C.teal, C.coral, C.purple, C.yellow][idx % 4] }, line: { transparency: 100 } });
    addText(slide, String(idx + 1), xx, y + 0.08, 0.48, 0.26, { fontSize: 20, color: C.white, bold: true, align: 'center', fontFace: FONT_LATIN });
    addText(slide, step, xx + 0.62, y + 0.03, 1.65, 0.38, { fontSize: 23, bold: true });
  });
}

function addCard(slide, text, x, y, w, h, fill = C.white, opts = {}) {
  slide.addShape('roundRect', { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: opts.line || C.line, pt: 1.1 } });
  addText(slide, text, x + 0.16, y + 0.12, w - 0.32, h - 0.24, { fontSize: opts.fontSize || T.body_pt, valign: opts.valign || 'top', bold: opts.bold || false, color: opts.color || C.ink });
}

function addBullets(slide, items, x, y, w, h, opts = {}) {
  const text = items.map((item) => `• ${item}`).join('\n');
  addText(slide, text, x, y, w, h, { fontSize: opts.fontSize || 24, valign: 'top', breakLine: true, color: opts.color || C.ink, ...opts });
}

function slideBase(p, title, subtitle, page, bg) {
  const slide = pptx.addSlide();
  addHeader(slide, p, page, bg);
  addTitle(slide, title, subtitle);
  return slide;
}

function notes(slide, text) { slide.addNotes(text); }

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = '榮市大學華語聽說課程';
pptx.company = '榮市大學';
pptx.subject = '准中級加速篇 I 第一課實體課';
pptx.title = '第一課｜麗麗是獨生女｜實體課';
pptx.lang = 'zh-CN';
pptx.theme = { headFontFace: FONT_CJK, bodyFontFace: FONT_CJK, lang: 'zh-CN' };

// Rebuilt according to the latest classroom-PPT revision request. The deck
// intentionally uses short student-facing prompts; teaching methods stay in
// speaker notes and the approved teacher manual.
function addPromptSlide(n, title, prompt, page, track = null, subtitle = '') {
  const s = slideBase(n, title, subtitle, page, C.paper);
  if (track) addAudio(s, track);
  addText(s, prompt, 1.15, 2.75, 11.0, 1.0, { fontSize: 34, bold: true, align: 'center', valign: 'mid' });
  notes(s, `请学生打开${page || '教材'}，完成页面上的预读或口语准备。`);
  return s;
}

function addQuestionSlide(n, question, page = null, image = null) {
  const s = slideBase(n, '简单题目问答', '', page, C.paper);
  addText(s, question, image ? 0.95 : 1.0, image ? 2.45 : 2.6, image ? 7.7 : 11.3, image ? 1.55 : 1.35, { fontSize: 34, bold: true, align: image ? 'left' : 'center', valign: 'mid' });
  if (image) addImage(s, image, 9.0, 1.75, 3.35, 3.7);
  notes(s, '先个人准备，再两人互说；教师观察学生是否能说出原因。');
  return s;
}

function exerciseItems(section, key) {
  const value = section?.exercises?.[key];
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (value && Array.isArray(value.items)) return value.items.map((item) => String(item));
  return [];
}

function exerciseInstruction(section, key, fallback) {
  const value = section?.exercises?.[key];
  if (value && typeof value === 'object' && value.instruction) return String(value.instruction);
  return fallback;
}

function shortTextLabel(index) {
  return ['一', '二', '三'][index] || String(index + 1);
}

function addTextQuestionSlide(n, section, sectionIndex, key, title, fallbackInstruction) {
  const items = exerciseItems(section, key);
  if (!items.length) throw new Error(`短文${shortTextLabel(sectionIndex)}缺少${title}`);
  const s = slideBase(n, title, '', `教材 P${section.printed_pages.join('–')}`, C.paper);
  addAudio(s, section.audio);
  addText(s, exerciseInstruction(section, key, fallbackInstruction), 0.85, 1.55, 11.4, 0.54, { fontSize: 23, color: C.teal, bold: true, align: 'center' });
  addBullets(s, items, 0.95, 2.22, 11.2, 3.85, { fontSize: items.length > 4 ? 21 : 24 });
  notes(s, `短文（${shortTextLabel(sectionIndex)}）${title}；学生使用 ${section.audio} 音频完成任务。`);
  return s;
}

function addExpressionSlide(n, expression, page, image = 'speaking-practice.png') {
  const s = slideBase(n, '常用词语和表达', '', page, C.paper);
  addText(s, expression, 0.9, 2.5, 7.8, 0.95, { fontSize: 38, bold: true, align: 'center', valign: 'mid', color: C.purple });
  addText(s, '请用这个句式说1句中文。', 0.95, 4.55, 7.65, 0.58, { fontSize: 27, align: 'center', color: C.slate });
  if (image) addImage(s, image, 9.05, 2.0, 3.25, 3.35);
  notes(s, '每位学生用本句式说一句与自己有关的话；教师只修补影响表达的错误。');
  return s;
}

function addDividerSlide(n, title, image, subtitleOverride = null) {
  const s = pptx.addSlide();
  addHeader(s, n, null, C.paper);
  const subtitles = {
    '听力练习': '听懂教材中的家庭、工作与生活信息。',
    '家庭表达': '用本课词语和句式介绍家庭情况。',
    '工作表达': '用本课词语和句式介绍学习与工作。',
    '兴趣爱好': '用本课词语和句式说兴趣与原因。',
    '综合表达': '整理信息，完成丽丽与自己的介绍。',
    '句式练习': ''
  };
  const subtitle = subtitleOverride === null ? (subtitles[title] || '一起听、说、整理和表达。') : subtitleOverride;
  addText(s, title, 0.9, 2.25, 7.2, 0.8, { fontSize: 48, color: C.purple, bold: true });
  if (subtitle) {
    addText(s, subtitle, 0.95, 3.25, 6.4, 0.5, { fontSize: 24, color: C.teal, bold: true });
    s.addShape('line', { x: 0.95, y: 4.05, w: 5.7, h: 0, line: { color: C.coral, pt: 2 } });
  }
  addImage(s, image, 8.0, 1.45, 4.25, 4.4);
  notes(s, `进入${title}部分。`);
  return s;
}

function addCanDoSlide(n) {
  const s = slideBase(n, '学完这课后，我能……', '', null, C.paper);
  const cards = [
    ['01', '听懂关于家庭、工作和爱好的主要信息。'],
    ['02', '用本课词语介绍自己的家庭、学习／工作和爱好。'],
    ['03', '回答和讨论跟课本主题有关的问题。'],
    ['04', '根据要求写出并准备一段个人介绍。']
  ];
  const placements = [
    [0.95, 1.85, 5.55, 1.35],
    [6.8, 1.85, 5.55, 1.35],
    [0.95, 3.55, 5.55, 1.35],
    [6.8, 3.55, 5.55, 1.35]
  ];
  cards.forEach(([num, text], i) => {
    const [x, y, w, h] = placements[i];
    addCard(s, `${num}\n${text}`, x, y, w, h, [C.mint, C.blue, C.yellow, C.lilac][i], { fontSize: 21, bold: true });
  });
  notes(s, '快速朗读四项结果，告诉学生今天会用听、问、说完成任务。');
  return s;
}

/* LEGACY SLIDE BUILD — replaced below
// F02 学习路线：以箭头流程图呈现先后顺序
{
  const s = slideBase(2, '今天的学习路线', '', null, C.paper);
  addSteps(s, ['词语', '课文', '句式', '口语']);
  notes(s, '按流程推进：词语 → 课文 → 句式 → 口语表达。');
}

// F03 暖身
{
  const s = slideBase(3, '先想一想', '毕业以后，你会不会离开家乡？', null, C.paper);
  addImage(s, 'lesson-01-cover-family-work-hobby.png', 8.55, 1.18, 3.95, 3.55);
  addBullets(s, ['你最期待什么？', '你最担心什么？', '你的父母会怎么想？'], 0.96, 2.22, 6.6, 2.25, { fontSize: 30 });
  addText(s, '参考句式：我想……，因为……', 0.98, 5.18, 7.15, 0.54, { fontSize: 26, color: C.coral, bold: true });
  notes(s, '启发性暖身。两人先说，再邀请学生分享。');
}

// F04 预习检查
{
  const s = slideBase(4, '你有没有不懂的地方', '', null, C.paper);
  addCard(s, '请指出一处你划线的地方。\n你哪里不懂？\n再说一条你已经看懂的内容。', 0.95, 2.0, 5.45, 2.0, C.yellow, { fontSize: 27, bold: true });
  addCard(s, '请先问同伴：\n“你为什么不懂？”\n再用自己的话说一遍。', 6.8, 2.0, 5.4, 2.0, C.mint, { fontSize: 28, bold: true });
  addText(s, '我准备问：____________________', 1.0, 4.8, 10.8, 0.55, { fontSize: 29, align: 'center', color: C.teal, bold: true });
  notes(s, '巡回检查：学生是否真的完成预读；只回收会影响今天任务的难点。');
}

// F05–F08：只保留教材页面提示，不把课本截图与听力方法搬进投影片
addPromptSlide(5, '课本预读', '请看课本第3页的图片。', '教材 P3', '1-2');
addPromptSlide(6, '课本预读', '请看课本第3页的图片。', '教材 P3');
addPromptSlide(7, '课本预读', '请看课本第4页的图片。', '教材 P4', '1-3');
// 原第8页删除
addPromptSlide(8, '课本预读', '请看课本第4—5页的图片。', '教材 P4–5', '1-4');

// F09–F10：大学生活与星期五晚上的口语问题（一页一题）
addQuestionSlide(9, '你觉得大学生活怎么样？为什么？');
addQuestionSlide(10, '你星期五晚上常做什么？为什么？');

// F11：教材 P5–6 预读
addPromptSlide(11, '课本预读', '请看课本第5—6页的图片。', '教材 P5–6', '1-5');

// F12–F16：一页一个综合口语问题
addQuestionSlide(12, '你自己洗衣服吗？为什么？');
addQuestionSlide(13, '你晚睡觉吗？为什么？');
addQuestionSlide(14, '你有什么爱好？为什么你喜欢？');
addQuestionSlide(15, '你自己做饭吗？为什么？');
addQuestionSlide(16, '你常拍照吗？为什么？');

// F17：短文一预读与音频
addPromptSlide(17, '课本预读', '请看课本第5—6页的图片。', '教材 P5–6', '1-6');

// F18：1-6 第二题
{
  const s = slideBase(18, '1-6 第二题', '', '教材 P5–6', C.paper); addAudio(s, '1-6');
  addBullets(s, [
    '丽丽毕业以后要去哪里工作？她喜欢不喜欢这份工作？（北京　满意）',
    '丽丽的爸爸妈妈对丽丽说什么了？（一个人　北京　天气　适应）',
    '丽丽说什么？（满意　担心　照顾）'
  ], 0.95, 1.95, 11.25, 3.45, { fontSize: 25 });
  notes(s, '根据教材 P5–6 的 1-6 第二题，学生用括号词语说两三个句子。');
}

// F19：家庭介绍
{
  const s = slideBase(19, '介绍丽丽', '', '教材 P5–6', C.paper);
  addText(s, '现在，请你用6—8句介绍丽丽。', 1.0, 1.78, 11.3, 0.6, { fontSize: 31, bold: true, align: 'center' });
  addBullets(s, ['说说她的家庭情况。', '她毕业后的打算、父母的想法和她自己的想法怎么样？'], 1.0, 2.55, 11.2, 1.4, { fontSize: 28 });
  addCard(s, '参考词语：毕业　离开　满意\n常用表达：出生在……　为……担心　如果……就……', 1.2, 4.45, 10.8, 1.25, C.lilac, { fontSize: 27, bold: true });
  notes(s, '学生完成 6—8 句家庭介绍；开放题不设唯一答案。');
}

// F20：比较页
{
  const s = pptx.addSlide(); addHeader(s, 20, '教材 P6', C.paper);
  addText(s, '你说的，跟课本的短文哪里不一样？', 1.0, 2.55, 11.3, 1.15, { fontSize: 35, bold: true, align: 'center', valign: 'mid' });
  notes(s, '请学生打开教材第6页，用短文核对自己刚才的介绍。');
}

// 家庭表达：教材 P6，五个句式各一页
['出生在……', '……是……', '什么', '为……担心', '如果……就……'].forEach((e) => addExpressionSlide(pptx._slides.length + 1, e, '教材 P6'));

// F26：家庭情况输出
{
  const s = slideBase(pptx._slides.length + 1, '请你说说', '', '教材 P6', C.paper);
  addText(s, '请你说说你的家庭情况，必须使用5个课本中的词语和三个句式。', 1.0, 2.45, 11.3, 1.35, { fontSize: 31, bold: true, align: 'center', valign: 'mid' });
  notes(s, '学生先个人准备，再两人互说；教师观察词语和句式是否真正用于表达。');
}

// 工作区：短文介绍、五个句式、个人输出
{
  const s = slideBase(pptx._slides.length + 1, '介绍短文', '', '教材 P7–8', C.paper);
  addText(s, '请你用2—3句话介绍她的工作和情况。', 1.0, 2.6, 11.3, 1.0, { fontSize: 34, bold: true, align: 'center', valign: 'mid' });
  notes(s, '学生根据教材 P7–8 短文完成简短介绍。1-7 尚未取得，不虚构播放。');
}
['从……到……', '为了', '越来越', '受……欢迎', '对……满意'].forEach((e) => addExpressionSlide(pptx._slides.length + 1, e, '教材 P7–8'));
{
  const s = slideBase(pptx._slides.length + 1, '请你说说', '', '教材 P7–8', C.paper);
  addText(s, '说说你想做的工作和为什么，必须使用5个课本中的词语和三个句式。', 0.95, 2.35, 11.4, 1.6, { fontSize: 31, bold: true, align: 'center', valign: 'mid' });
  notes(s, '學生說明想做的工作與原因；不要求唯一答案。');
}

// 爱好区：短文介绍、四个句式
{
  const s = slideBase(pptx._slides.length + 1, '介绍短文', '', '教材 P8–9', C.paper);
  addText(s, '请你用2—3句话介绍她的爱好。', 1.0, 2.6, 11.3, 1.0, { fontSize: 34, bold: true, align: 'center', valign: 'mid' });
  notes(s, '学生根据教材 P8–9 短文完成简短介绍。1-8 尚未取得，不虚构播放。');
}
['不仅……而且……', '除了……还……／除了……也……', '因为……所以……', '对……有好处／有帮助（1）'].forEach((e) => addExpressionSlide(pptx._slides.length + 1, e, '教材 P8–9'));

// 综合区
{
  const s = slideBase(pptx._slides.length + 1, '请你介绍丽丽', '', '教材 P10', C.paper);
  addText(s, '请你写出丽丽的信息', 1.0, 2.55, 11.3, 1.0, { fontSize: 36, bold: true, align: 'center', valign: 'mid' });
  addImage(s, 'lesson-01-learning-path.png', 4.7, 4.05, 3.95, 1.7);
  notes(s, '学生完成教材 P10 的三栏信息整理。');
}
{
  const s = slideBase(pptx._slides.length + 1, '请你说说', '', '教材 P10', C.paper);
  addBullets(s, [
    '丽丽的父母为什么担心？',
    '丽丽为什么去北京？',
    '丽丽觉得新工作怎么样？',
    '为什么丽丽有时候很晚才能睡觉？',
    '丽丽喜欢做哪些事？',
    '丽丽的哪个爱好对工作有帮助？'
  ], 1.05, 1.65, 11.0, 4.5, { fontSize: 27 });
  notes(s, '学生逐题回答；开放题不设唯一答案。');
}
[
  ['出生在……', '教材 P6'],
  ['为……担心', '教材 P6'],
  ['越来越', '教材 P8'],
  ['不仅……而且……', '教材 P9']
].forEach(([e, page]) => addExpressionSlide(pptx._slides.length + 1, e, page));

// 课末个人表达
{
  const s = slideBase(pptx._slides.length + 1, '请你说说', '', '教材 P11', C.paper);
  addText(s, '① 我的家庭：____________________', 1.0, 1.85, 11.3, 0.65, { fontSize: 31, bold: true });
  addText(s, '② 我的学习／工作：____________________', 1.0, 2.85, 11.3, 0.65, { fontSize: 31, bold: true });
  addText(s, '③ 我的兴趣爱好：____________________', 1.0, 3.85, 11.3, 0.65, { fontSize: 31, bold: true });
  addText(s, '必须使用10个课本中的词语和5个句式。说8—10句。', 1.0, 5.35, 11.3, 0.7, { fontSize: 29, bold: true, align: 'center', color: C.coral });
  notes(s, '每位学生完成 8—10 句个人介绍；这是本课实体课的最终口语产出。');
}

// Supplemental listening tracks supplied after the original 49-slide deck.
addPromptSlide(pptx._slides.length + 1, '听力练习', '先看题、抓关键词，再听并记重点，最后回答。', '教材 P7–8', '1-7', '短文（二）');
addPromptSlide(pptx._slides.length + 1, '听力练习', '先看题、抓关键词，再听并记重点，最后回答。', '教材 P8–9', '1-8', '短文（三）');

*/

/* LEGACY CURRENT BUILD — retained as historical reference only.
// Current slide build: route image, Can-Do, clear listening labels, dividers,
// exact printed page references, and spacious image-supported speaking tasks.
{
  const s = pptx.addSlide(); addHeader(s, 1, null, C.paper);
  addPill(s, '实体课', 0.78, 1.08, 1.3, C.teal);
  addText(s, '丽丽是独生女', 0.78, 1.72, 6.0, 0.82, { fontSize: 44, bold: true });
  addText(s, '听一听，问一问，说一说。', 0.82, 2.7, 5.8, 0.5, { fontSize: 25, color: C.slate });
  addImage(s, 'lesson-01-cover-family-work-hobby.png', 7.05, 1.08, 5.55, 4.7);
  notes(s, '开场：先看图说出家庭、工作和爱好三个主题。');
}
{
  const s = slideBase(2, '今天的学习路线', '', null, C.paper);
  const route = path.join(assetRoot, 'learning-route-user-supplied-transparent-v4.png');
  if (fs.existsSync(route)) s.addImage({ path: route, x: 0.72, y: 1.25, w: 11.9, h: 5.85 });
  else addSteps(s, ['复习词语', '开口热身', '听懂课文', '整理信息', '介绍自己'], 0.85, 2.55);
  notes(s, '按流程推进：复习词语 → 开口热身 → 听懂课文 → 学习句式 → 整理信息 → 介绍丽丽 → 介绍自己。');
}
addCanDoSlide(3);
{
  const s = slideBase(4, '先想一想', '毕业以后，你会不会离开家乡？', null, C.paper);
  addImage(s, 'lesson-01-cover-family-work-hobby.png', 8.55, 1.18, 3.95, 3.55);
  addBullets(s, ['你最期待什么？', '你最担心什么？', '你的父母会怎么想？'], 0.96, 2.22, 6.6, 2.25, { fontSize: 30 });
  addText(s, '参考句式：我想……，因为……', 0.98, 5.18, 7.15, 0.54, { fontSize: 26, color: C.coral, bold: true });
  notes(s, '启发性暖身。两人先说，再邀请学生分享。');
}

addDividerSlide(5, '听力练习', 'symbolic-listening.png', '');
addPromptSlide(6, '听力练习', '请看教材第3页，听一听这些词语。', '教材 P3', '1-2', '关于家庭生活的词语');
addPromptSlide(7, '听力练习', '请看教材第3页，听一听这些词语。', '教材 P3', '1-2', '关于工作的词语');
addPromptSlide(8, '听力练习', '请看教材第4页的题目。', '教材 P4', '1-3', '听句子，判断对错');
addPromptSlide(9, '听力练习', '请看教材第4—5页的题目和选项。', '教材 P4–5', '1-4', '听小对话，选择答案');

addQuestionSlide(10, '你觉得大学生活怎么样？为什么？', null, 'university-weekend.png');
addQuestionSlide(11, '你星期五晚上常做什么？为什么？', null, 'university-weekend.png');
addPromptSlide(12, '听力练习', '请看教材第5页的问题。', '教材 P5', '1-5', '听句子，回答问题');
addQuestionSlide(13, '你自己洗衣服吗？为什么？', null, 'daily-routines-collage.png');
addQuestionSlide(14, '你晚睡觉吗？为什么？', null, 'daily-routines-collage.png');
addQuestionSlide(15, '你有什么爱好？为什么你喜欢？', null, 'daily-routines-collage.png');
addQuestionSlide(16, '你自己做饭吗？为什么？', null, 'daily-routines-collage.png');
addQuestionSlide(17, '你常拍照吗？为什么？', null, 'daily-routines-collage.png');
addPromptSlide(18, '听力练习', '再听一次，回答问题。', '教材 P5–6', '1-6', '');
addDividerSlide(pptx._slides.length + 1, '口语练习', 'oral-practice-divider.png', '');
addDividerSlide(pptx._slides.length + 1, '短文（一）', 'divider-family.png', '');
{
  const s = slideBase(pptx._slides.length + 1, '介绍丽丽', '', '教材 P6', C.paper);
  addText(s, '现在，请你用6—8句介绍丽丽。', 1.0, 1.78, 11.3, 0.6, { fontSize: 31, bold: true, align: 'center' });
  addBullets(s, ['说说她的家庭情况。', '她毕业后的打算、父母的想法和她自己的想法怎么样？'], 1.0, 2.55, 11.2, 1.4, { fontSize: 28 });
  addCard(s, '参考词语：毕业　离开　满意\n常用表达：出生在……　为……担心　如果……就……', 1.2, 4.45, 10.8, 1.25, C.lilac, { fontSize: 27, bold: true });
  notes(s, '学生完成 6—8 句家庭介绍；开放题不设唯一答案。');
}
{
  const s = slideBase(pptx._slides.length + 1, '短文（一）', '', '教材 P6', C.paper);
  addText(s, '你说的跟短文（一）哪里不一样？', 1.0, 2.55, 11.3, 1.0, { fontSize: 36, bold: true, align: 'center', valign: 'mid' });
  notes(s, '学生比较自己的介绍与教材短文（一）的信息。');
}

addDividerSlide(pptx._slides.length + 1, '句式练习', 'symbolic-sentence-pattern.png', '');
['出生在……', '……是……', '什么', '为……担心', '如果……就……'].forEach((e) => addExpressionSlide(pptx._slides.length + 1, e, '教材 P6'));
{
  const s = slideBase(pptx._slides.length + 1, '请你说说', '', '教材 P6', C.paper);
  addImage(s, 'divider-family.png', 9.05, 1.75, 3.2, 3.65);
  addText(s, '请你说说你的家庭情况，必须使用5个课本中的词语和三个句式。', 0.95, 2.35, 7.7, 1.6, { fontSize: 31, bold: true, align: 'center', valign: 'mid' });
  notes(s, '学生先个人准备，再两人互说；教师观察词语和句式是否真正用于表达。');
}

addDividerSlide(pptx._slides.length + 1, '短文（二）', 'divider-work.png', '');
{
  const s = slideBase(pptx._slides.length + 1, '介绍短文', '', '教材 P7', C.paper);
  addImage(s, 'divider-work.png', 9.05, 1.75, 3.2, 3.65);
  addText(s, '请你用2—3句话介绍她的工作和情况。', 0.95, 2.55, 7.7, 1.2, { fontSize: 32, bold: true, align: 'center', valign: 'mid' });
  notes(s, '学生根据教材 P7 短文完成简短介绍。1-7 尚未取得，不虚构播放。');
}
addDividerSlide(pptx._slides.length + 1, '句式练习', 'symbolic-sentence-pattern.png', '');
['从……到……', '为了', '越来越', '受……欢迎', '对……满意'].forEach((e) => addExpressionSlide(pptx._slides.length + 1, e, '教材 P8'));
{
  const s = slideBase(pptx._slides.length + 1, '请你说说', '', '教材 P7', C.paper);
  addImage(s, 'divider-work.png', 9.05, 1.75, 3.2, 3.65);
  addText(s, '说说你想做的工作和为什么，必须使用5个课本中的词语和三个句式。', 0.95, 2.35, 7.7, 1.6, { fontSize: 31, bold: true, align: 'center', valign: 'mid' });
  notes(s, '学生说明想做的工作与原因；不要求唯一答案。');
}

addDividerSlide(pptx._slides.length + 1, '短文（三）', 'divider-hobby.png', '');
{
  const s = slideBase(pptx._slides.length + 1, '介绍短文', '', '教材 P8', C.paper);
  addImage(s, 'divider-hobby.png', 9.05, 1.75, 3.2, 3.65);
  addText(s, '请你用2—3句话介绍她的爱好。', 0.95, 2.55, 7.7, 1.2, { fontSize: 32, bold: true, align: 'center', valign: 'mid' });
  notes(s, '学生根据教材 P8 短文完成简短介绍。1-8 尚未取得，不虚构播放。');
}
addDividerSlide(pptx._slides.length + 1, '句式练习', 'symbolic-sentence-pattern.png', '');
['不仅……而且……', '除了……还……／除了……也……', '因为……所以……', '对……有好处／有帮助'].forEach((e) => addExpressionSlide(pptx._slides.length + 1, e, '教材 P9'));

addDividerSlide(pptx._slides.length + 1, '综合表达', 'divider-comprehensive.png');
{
  const s = slideBase(pptx._slides.length + 1, '请你介绍丽丽', '', '教材 P10', C.paper);
  addImage(s, 'divider-comprehensive.png', 9.05, 1.75, 3.2, 3.65);
  addText(s, '请填表后，说一说丽丽的家庭、工作、爱好。', 0.95, 2.45, 7.7, 1.3, { fontSize: 32, bold: true, align: 'center', valign: 'mid' });
  notes(s, '学生完成教材 P10 的三栏信息整理。');
}
{
  const s = slideBase(pptx._slides.length + 1, '根据课本，回答问题', '', '教材 P10', C.paper);
  addImage(s, 'divider-comprehensive.png', 9.05, 1.75, 3.2, 3.65);
  addBullets(s, [
    '丽丽的父母为什么担心？', '丽丽为什么去北京？', '丽丽觉得新工作怎么样？',
    '为什么丽丽有时候很晚才能睡觉？', '丽丽喜欢做哪些事？', '丽丽的哪个爱好对工作有帮助？'
  ], 0.95, 1.7, 7.7, 4.4, { fontSize: 27 });
  notes(s, '学生逐题回答；开放题不设唯一答案。');
}
{
  const s = slideBase(pptx._slides.length + 1, '请你说说', '', '教材 P11', C.paper);
  addImage(s, 'speaking-practice.png', 9.05, 1.75, 3.2, 3.65);
  addText(s, '① 我的家庭', 1.05, 1.72, 3.0, 0.45, { fontSize: 25, color: C.teal, bold: true });
  addCard(s, '____________________________', 1.0, 2.15, 7.35, 0.72, C.mint, { fontSize: 30, bold: true });
  addText(s, '② 我的学习／工作', 1.05, 3.05, 3.4, 0.45, { fontSize: 25, color: C.purple, bold: true });
  addCard(s, '____________________________', 1.0, 3.48, 7.35, 0.72, C.lilac, { fontSize: 30, bold: true });
  addText(s, '③ 我的兴趣爱好', 1.05, 4.38, 3.2, 0.45, { fontSize: 25, color: C.coral, bold: true });
  addCard(s, '____________________________', 1.0, 4.81, 7.35, 0.72, C.yellow, { fontSize: 30, bold: true });
  addText(s, '必须使用10个课本中的词语和5个句式。说8—10句。', 1.0, 6.05, 7.35, 0.42, { fontSize: 24, bold: true, align: 'center', color: C.coral });
  notes(s, '每位学生完成 8—10 句个人介绍；这是本课实体课的最终口语产出。');
}

// Supplemental listening tracks supplied after the original 49-slide deck.
addPromptSlide(pptx._slides.length + 1, '听力练习', '先看题、抓关键词，再听并记重点，最后回答。', '教材 P7–8', '1-7', '短文（二）');
addPromptSlide(pptx._slides.length + 1, '听力练习', '先看题、抓关键词，再听并记重点，最后回答。', '教材 P8–9', '1-8', '短文（三）');

*/

// Current slide build follows course/boya-face-to-face-order-contract.json.
{
  const n = pptx._slides.length + 1;
  const s = pptx.addSlide(); addHeader(s, n, null, C.paper);
  addPill(s, '实体课', 0.78, 1.08, 1.3, C.teal);
  addText(s, '丽丽是独生女', 0.78, 1.72, 6.0, 0.82, { fontSize: 44, bold: true });
  addText(s, '听一听，问一问，说一说。', 0.82, 2.7, 5.8, 0.5, { fontSize: 25, color: C.slate });
  addImage(s, 'lesson-01-cover-family-work-hobby.png', 7.05, 1.08, 5.55, 4.7);
  notes(s, '开场：先看图说出家庭、工作和爱好三个主题。');
}
{
  const n = pptx._slides.length + 1;
  const s = slideBase(n, '今天的学习路线', '', null, C.paper);
  const route = path.join(assetRoot, 'learning-route-user-supplied-transparent-v4.png');
  if (fs.existsSync(route)) s.addImage({ path: route, x: 0.72, y: 1.25, w: 11.9, h: 5.85 });
  else addSteps(s, ['复习词语', '开口热身', '听懂课文', '整理信息', '介绍自己'], 0.85, 2.55);
  notes(s, '按流程推进：复习词语 → 开口热身 → 短文听力 → 题目问答 → 口语练习 → 句式练习 → 综合表达。');
}
addCanDoSlide(pptx._slides.length + 1);
{
  const n = pptx._slides.length + 1;
  const s = slideBase(n, '先想一想', '毕业以后，你会不会离开家乡？', null, C.paper);
  addImage(s, 'lesson-01-cover-family-work-hobby.png', 8.55, 1.18, 3.95, 3.55);
  addBullets(s, ['你最期待什么？', '你最担心什么？', '你的父母会怎么想？'], 0.96, 2.22, 6.6, 2.25, { fontSize: 30 });
  addText(s, '参考句式：我想……，因为……', 0.98, 5.18, 7.15, 0.54, { fontSize: 26, color: C.coral, bold: true });
  notes(s, '启发性暖身。两人先说，再邀请学生分享。');
}

const orderedShortTextSections = [sections.short_text_1, sections.short_text_2, sections.short_text_3];
const orderedShortTextImages = ['divider-family.png', 'divider-work.png', 'divider-hobby.png'];
const orderedShortTextExpressions = [
  ['出生在……', '……是……', '什么', '为……担心', '如果……就……'],
  ['从……到……', '为了', '越来越', '受……欢迎', '对……满意'],
  ['不仅……而且……', '除了……还……／除了……也……', '因为……所以……', '对……有好处／有帮助']
];

function addL1TextUnit(index) {
  const section = orderedShortTextSections[index];
  const label = shortTextLabel(index);
  const next = () => pptx._slides.length + 1;
  addDividerSlide(next(), `短文（${label}）`, orderedShortTextImages[index], '');

  if (index === 0) {
    // These source-listed foundation listening tasks stay in the deck, but
    // they no longer push the first short-text divider away from slide 5.
    addDividerSlide(next(), '听力练习', 'symbolic-listening.png', '');
    addPromptSlide(next(), '听力练习', '请看教材第3页，听一听这些词语。', '教材 P3', '1-2', '关于家庭生活的词语');
    addPromptSlide(next(), '听力练习', '请看教材第3页，听一听这些词语。', '教材 P3', '1-2', '关于工作的词语');
    addPromptSlide(next(), '听力题目', '请看教材第4页的题目。', '教材 P4', '1-3', '听句子，判断对错');
    addPromptSlide(next(), '听力题目', '请看教材第4—5页的题目和选项。', '教材 P4–5', '1-4', '听小对话，选择答案');
    [
      ['你觉得大学生活怎么样？为什么？', 'university-weekend.png'],
      ['你星期五晚上常做什么？为什么？', 'university-weekend.png'],
      ['你自己洗衣服吗？为什么？', 'daily-routines-collage.png'],
      ['你晚睡觉吗？为什么？', 'daily-routines-collage.png'],
      ['你有什么爱好？为什么你喜欢？', 'daily-routines-collage.png'],
      ['你自己做饭吗？为什么？', 'daily-routines-collage.png'],
      ['你常拍照吗？为什么？', 'daily-routines-collage.png']
    ].forEach(([question, image]) => addQuestionSlide(next(), question, null, image));
    addPromptSlide(next(), '听力题目', '请看教材第5页的问题。', '教材 P5', '1-5', '听句子，回答问题');
  }

  addPromptSlide(next(), '听力练习', '先看题、抓关键词，再听并记重点，最后回答。', `教材 P${section.printed_pages.join('–')}`, section.audio, `短文（${label}）`);
  addTextQuestionSlide(next(), section, index, 'second_listen', '听力题目', '听第二遍，回答问题。');
  addTextQuestionSlide(next(), section, index, 'first_listen', '简单题目问答', '听第一遍，简单回答问题。');
  addDividerSlide(next(), '口语练习', 'oral-practice-divider.png', '');

  const intro = index === 0
    ? ['介绍丽丽', '现在，请你用6—8句介绍丽丽。', ['说说她的家庭情况。', '她毕业后的打算、父母的想法和她自己的想法怎么样？'], '参考词语：毕业　离开　满意\n常用表达：出生在……　为……担心　如果……就……']
    : index === 1
      ? ['介绍短文', '请你用6—8句话介绍丽丽的工作情况。', ['她在哪里工作？每天工作多长时间？', '她的工作态度、工作成绩和客户、老板的看法怎么样？'], '参考词语：毕业　工作　努力\n常用表达：从……到……　越来越　对……满意']
      : ['介绍短文', '请你用6—8句话介绍丽丽的爱好。', ['她喜欢做什么？她做饭怎么样？', '拍照片对她的工作有什么帮助？'], '参考词语：爱好　做饭　拍照片\n常用表达：不仅……而且……　除了……还……　对……有帮助'];
  {
    const s = slideBase(next(), intro[0], '', `教材 P${section.printed_pages[section.printed_pages.length - 1]}`, C.paper);
    addText(s, intro[1], 1.0, 1.78, 11.3, 0.6, { fontSize: 31, bold: true, align: 'center' });
    addBullets(s, intro[2], 1.0, 2.55, 11.2, 1.4, { fontSize: 28 });
    addCard(s, intro[3], 1.2, 4.45, 10.8, 1.25, C.lilac, { fontSize: 27, bold: true });
    notes(s, `学生完成短文（${label}）介绍；开放题不设唯一答案。`);
  }
  {
    const s = slideBase(next(), `短文（${label}）`, '', `教材 P${section.printed_pages[section.printed_pages.length - 1]}`, C.paper);
    addText(s, `你说的跟短文（${label}）哪里不一样？`, 1.0, 2.55, 11.3, 1.0, { fontSize: 36, bold: true, align: 'center', valign: 'mid' });
    notes(s, `学生比较自己的介绍与教材短文（${label}）的信息。`);
  }
  addDividerSlide(next(), '句式练习', 'symbolic-sentence-pattern.png', '');
  orderedShortTextExpressions[index].forEach((expression) => addExpressionSlide(next(), expression, `教材 P${section.printed_pages[section.printed_pages.length - 1]}`));
  {
    const s = slideBase(next(), '请你说说', '', `教材 P${section.printed_pages[section.printed_pages.length - 1]}`, C.paper);
    addImage(s, orderedShortTextImages[index], 9.05, 1.75, 3.2, 3.65);
    addText(s, index === 0
      ? '请你说说你的家庭情况，必须使用5个课本中的词语和三个句式。'
      : index === 1
        ? '说说你想做的工作和为什么，必须使用5个课本中的词语和三个句式。'
        : '说说你的爱好和它带来的帮助，必须使用5个课本中的词语和三个句式。',
    0.95, 2.35, 7.7, 1.6, { fontSize: 31, bold: true, align: 'center', valign: 'mid' });
    notes(s, `短文（${label}）口语输出；学生先个人准备，再两人互说。`);
  }
}

orderedShortTextSections.forEach((_, index) => addL1TextUnit(index));

addDividerSlide(pptx._slides.length + 1, '综合表达', 'divider-comprehensive.png');
{
  const s = slideBase(pptx._slides.length + 1, '请你介绍丽丽', '', '教材 P10', C.paper);
  addImage(s, 'divider-comprehensive.png', 9.05, 1.75, 3.2, 3.65);
  addText(s, '请填表后，说一说丽丽的家庭、工作、爱好。', 0.95, 2.45, 7.7, 1.3, { fontSize: 32, bold: true, align: 'center', valign: 'mid' });
  notes(s, '学生完成教材 P10 的三栏信息整理。');
}
{
  const s = slideBase(pptx._slides.length + 1, '根据课本，回答问题', '', '教材 P10', C.paper);
  addImage(s, 'divider-comprehensive.png', 9.05, 1.75, 3.2, 3.65);
  addBullets(s, [
    '丽丽的父母为什么担心？', '丽丽为什么去北京？', '丽丽觉得新工作怎么样？',
    '为什么丽丽有时候很晚才能睡觉？', '丽丽喜欢做哪些事？', '丽丽的哪个爱好对工作有帮助？'
  ], 0.95, 1.7, 7.7, 4.4, { fontSize: 27 });
  notes(s, '学生逐题回答；开放题不设唯一答案。');
}
{
  const s = slideBase(pptx._slides.length + 1, '请你说说', '', '教材 P11', C.paper);
  addImage(s, 'speaking-practice.png', 9.05, 1.75, 3.2, 3.65);
  addText(s, '① 我的家庭', 1.05, 1.72, 3.0, 0.45, { fontSize: 25, color: C.teal, bold: true });
  addCard(s, '____________________________', 1.0, 2.15, 7.35, 0.72, C.mint, { fontSize: 30, bold: true });
  addText(s, '② 我的学习／工作', 1.05, 3.05, 3.4, 0.45, { fontSize: 25, color: C.purple, bold: true });
  addCard(s, '____________________________', 1.0, 3.48, 7.35, 0.72, C.lilac, { fontSize: 30, bold: true });
  addText(s, '③ 我的兴趣爱好', 1.05, 4.38, 3.2, 0.45, { fontSize: 25, color: C.coral, bold: true });
  addCard(s, '____________________________', 1.0, 4.81, 7.35, 0.72, C.yellow, { fontSize: 30, bold: true });
  addText(s, '必须使用10个课本中的词语和5个句式。说8—10句。', 1.0, 6.05, 7.35, 0.42, { fontSize: 24, bold: true, align: 'center', color: C.coral });
  notes(s, '每位学生完成 8—10 句个人介绍；这是本课实体课的最终口语产出。');
}

function slideXmlText(xml) {
  return [...String(xml).matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((match) => match[1]).join(' | ');
}

function findSlide(texts, start, predicate) {
  for (let index = start; index < texts.length; index += 1) {
    if (predicate(texts[index])) return index;
  }
  return -1;
}

function assertL1FaceOrder(filePath) {
  const texts = [];
  for (let index = 1; index <= pptx._slides.length; index += 1) {
    const xml = execFileSync('unzip', ['-p', filePath, `ppt/slides/slide${index}.xml`], { encoding: 'utf8' });
    texts.push(slideXmlText(xml));
  }
  const firstShort = findSlide(texts, 0, (value) => value.includes('短文（一）') && !value.includes('你说的跟短文（一）'));
  if (firstShort !== 4) throw new Error(`第一课短文（一）必须是暖身后的第一张内容页，实际为第${firstShort + 1}页`);
  let cursor = firstShort;
  orderedShortTextSections.forEach((section, index) => {
    const label = shortTextLabel(index);
    const divider = findSlide(texts, cursor, (value) => value.includes(`短文（${label}）`) && !value.includes('你说的跟'));
    if (divider !== cursor && index === 0) throw new Error(`第一课短文（一）单元起点错误`);
    const nextLabel = ['二', '三'][index];
    const unitEnd = nextLabel
      ? findSlide(texts, divider + 1, (value) => value.includes(`短文（${nextLabel}）`) && !value.includes('你说的跟'))
      : findSlide(texts, divider + 1, (value) => value.includes('综合表达'));
    const end = unitEnd < 0 ? texts.length : unitEnd;
    const strategy = findSlide(texts, divider + 1, (value) => value.includes('听力练习') && value.includes('先看题、抓关键词') && value.includes(`短文（${label}）`));
    if (strategy < 0 || strategy >= end) throw new Error(`第一课短文${label}缺少听力练习`);
    const second = exerciseItems(section, 'second_listen');
    const first = exerciseItems(section, 'first_listen');
    const listeningQuestions = findSlide(texts, strategy + 1, (value) => value.includes('听力题目') && value.includes(second[0]));
    if (listeningQuestions < 0 || listeningQuestions >= end) throw new Error(`第一课短文${label}缺少听力题目`);
    const simpleQuestions = findSlide(texts, listeningQuestions + 1, (value) => value.includes('简单题目问答') && value.includes(first[0]));
    if (simpleQuestions < 0 || simpleQuestions >= end) throw new Error(`第一课短文${label}缺少简单题目问答`);
    const oral = findSlide(texts, simpleQuestions + 1, (value) => value.includes('口语练习'));
    const introduction = findSlide(texts, oral + 1, (value) => value.includes('介绍'));
    const compare = findSlide(texts, introduction + 1, (value) => value.includes(`你说的跟短文（${label}）哪里不一样？`));
    const expression = findSlide(texts, compare + 1, (value) => value.includes('句式练习'));
    const output = findSlide(texts, expression + 1, (value) => value.includes('请你说说'));
    if (oral < 0 || oral >= end || introduction < 0 || introduction >= end || compare < 0 || compare >= end || expression < 0 || expression >= end || output < 0 || output >= end) {
      throw new Error(`第一课短文${label}单元顺序不完整`);
    }
    cursor = end;
  });
  if (findSlide(texts, cursor, (value) => value.includes('综合表达')) < 0) throw new Error('第一课短文单元后缺少综合表达');
}

const manifest = {
  artifact: 'lesson-01-实体课',
  generated_at: new Date().toISOString(),
  format: 'native-pptx-only',
  slide_count: pptx._slides.length,
  output: path.relative(root, outputPath),
  student_language: '简体中文',
  fonts: { cjk: FONT_CJK, latin: FONT_LATIN, min_visible_pt: 20 },
  face_order_contract: 'course/boya-face-to-face-order-contract.json',
  audio_tracks: ['1-2', '1-3', '1-4', '1-5', '1-6', '1-7', '1-8'],
  audio_tracks_not_available: [],
  textbook_image_assets: [],
  generated_image_assets: [
    'lesson-01-cover-family-work-hobby.png',
    'learning-route-user-supplied-transparent-v4.png',
    'divider-listening.png', 'divider-family.png', 'divider-work.png',
    'divider-hobby.png', 'divider-comprehensive.png',
    'symbolic-listening.png', 'symbolic-sentence-pattern.png', 'oral-practice-divider.png',
    'university-weekend.png', 'daily-routines-collage.png', 'speaking-practice.png'
  ],
  page_markers: pageMarkers,
  blooket_included: false,
  p7_p9_audio_policy: '保留实体文本与口语应用；1-7/1-8取得并核验后才增补听力，不删除原任务。'
};

(async () => {
  await pptx.writeFile({ fileName: outputPath });
  assertL1FaceOrder(outputPath);
  manifest.sha256 = crypto.createHash('sha256').update(fs.readFileSync(outputPath)).digest('hex');
  fs.writeFileSync(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify(manifest, null, 2));
})().catch((err) => { console.error(err); process.exit(1); });
