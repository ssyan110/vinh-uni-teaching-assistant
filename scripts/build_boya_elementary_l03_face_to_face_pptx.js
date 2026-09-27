#!/usr/bin/env node

/* Native PPTX draft builder for boya-elementary-i:lesson-03. */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const PptxGenJS = require('pptxgenjs');
const design = require('./boya_design_system');

const ROOT = path.resolve(__dirname, '..');
const LESSON_KEY = 'boya-elementary-i:lesson-03';
const OFFERING_ID = '2026-fall';
const LESSON_ROOT = path.join(ROOT, 'lessons/boya-elementary-i/lesson-03');
const DEFAULT_OUTPUT = path.join(LESSON_ROOT, '10-design/pptx-draft/face-to-face');
const STORYBOARD_ROOT = path.join(LESSON_ROOT, '10-design/storyboard');
const REVIEW_DOC = path.join(STORYBOARD_ROOT, 'lesson-03-逐页文案审阅.md');
const SOURCE_REFS = path.join(STORYBOARD_ROOT, 'lesson-03-source-refs.csv');
const CANONICAL_SOURCE = path.join(LESSON_ROOT, '00-source/canonical-source.json');
const SOURCE_MANIFEST = path.join(LESSON_ROOT, '00-source/source-manifest.json');
const IMAGE_MANIFEST = path.join(LESSON_ROOT, '10-design/assets/image-manifest.json');
const ASSET_ROOT = path.join(LESSON_ROOT, '10-design/assets');

const W = 13.333;
const H = 7.5;
const MIN_VISIBLE_PT = 23;
const FONT_CJK = design.fonts.cjk;
const FONT_LATIN = design.fonts.latin;
const C = { ...design.colors, slideBackground: 'FFFFFF' };

let outputDir = DEFAULT_OUTPUT;
let lessonKey = LESSON_KEY;
let offeringId = OFFERING_ID;
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--output-dir') outputDir = path.resolve(args[++i]);
  else if (args[i] === '--lesson-key') lessonKey = args[++i];
  else if (args[i] === '--offering-id') offeringId = args[++i];
  else if (args[i] === '--help') {
    console.log('Usage: node scripts/build_boya_elementary_l03_face_to_face_pptx.js --lesson-key boya-elementary-i:lesson-03 --offering-id 2026-fall --output-dir DIR');
    process.exit(0);
  }
}

if (lessonKey !== LESSON_KEY) throw new Error(`This builder only accepts ${LESSON_KEY}`);
if (offeringId !== OFFERING_ID) throw new Error(`This builder only accepts offering ${OFFERING_ID}`);
const draftRoot = path.join(LESSON_ROOT, '10-design', 'pptx-draft');
const resolvedOutput = path.resolve(outputDir);
if (!resolvedOutput.startsWith(`${draftRoot}${path.sep}`) && resolvedOutput !== draftRoot) {
  throw new Error(`Output must stay under ${draftRoot}`);
}
if (/[/\\](20-approved|30-qa|40-release)([/\\]|$)/.test(resolvedOutput)) {
  throw new Error('Protected output path rejected');
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function runDraftGate() {
  execFileSync('python3', [
    path.join(ROOT, 'scripts/production_gate.py'),
    '--purpose', 'pptx',
    '--stage', 'draft',
    '--lesson-key', LESSON_KEY,
    '--output-dir', resolvedOutput,
  ], { cwd: ROOT, stdio: 'inherit' });
}

function addText(slide, value, x, y, w, h, options = {}) {
  slide.addText(String(value), {
    x, y, w, h,
    fontFace: options.fontFace || FONT_CJK,
    fontSize: options.fontSize || MIN_VISIBLE_PT,
    color: options.color || C.ink,
    margin: options.margin === undefined ? 0 : options.margin,
    breakLine: options.breakLine !== false,
    valign: options.valign || 'mid',
    align: options.align || 'left',
    bold: options.bold || false,
    italic: options.italic || false,
    paraSpaceAfterPt: 0,
    lang: options.lang || 'zh-CN',
    fit: options.fit || 'shrink',
    ...options,
  });
}

function addLatin(slide, value, x, y, w, h, options = {}) {
  addText(slide, value, x, y, w, h, {
    ...options,
    fontFace: FONT_LATIN,
    lang: options.lang || 'en-US',
  });
}

function addMixed(slide, parts, x, y, w, h, options = {}) {
  slide.addText(parts.map((part) => ({
    text: String(part.text),
    options: {
      fontFace: part.fontFace || (part.script === 'latin' ? FONT_LATIN : FONT_CJK),
      fontSize: part.fontSize || options.fontSize || MIN_VISIBLE_PT,
      color: part.color || options.color || C.ink,
      bold: part.bold === undefined ? Boolean(options.bold) : part.bold,
      lang: part.lang || (part.script === 'latin' ? 'en-US' : 'zh-CN'),
    },
  })), {
    x, y, w, h,
    margin: options.margin === undefined ? 0 : options.margin,
    breakLine: true,
    valign: options.valign || 'mid',
    align: options.align || 'left',
    paraSpaceAfterPt: 0,
    fit: options.fit || 'shrink',
    ...options,
  });
}

function addLatinPhrase(slide, value, x, y, w, h, options = {}) {
  addLatin(slide, value, x, y, w, h, { ...options, lang: 'vi-VN' });
}

function addLine(slide, x, y, w, color = C.line, pt = 0.8) {
  slide.addShape('line', { x, y, w, h: 0, line: { color, pt } });
}

function addHeader(slide, n, title = '') {
  slide.background = { color: C.slideBackground };
  addText(slide, '第三课｜拼音和日常用语（三）', 0.7, 0.22, 6.6, 0.32, { fontSize: 23, color: C.slate, bold: true });
  addLatin(slide, String(n).padStart(2, '0'), 11.9, 0.22, 0.7, 0.32, { fontSize: 23, color: C.slate, bold: true, align: 'right' });
  addLine(slide, 0.7, 0.68, 11.93, C.line, 0.8);
  slide.addShape('rect', { x: 0.7, y: 0.65, w: 0.48, h: 0.05, fill: { color: C.purple }, line: { color: C.purple, transparency: 100 } });
  if (title) addText(slide, title, 0.78, 0.92, 10.8, 0.56, { fontSize: title.length > 16 ? 30 : 34, bold: true, valign: 'top' });
}

function addPageMarker(slide, label) {
  if (!label) return;
  const clean = String(label).replace(/^教材\s*/, '');
  addMixed(slide, [
    { text: '教材 ', fontFace: FONT_CJK, fontSize: 23, color: C.slate },
    { text: clean, fontFace: FONT_LATIN, fontSize: 23, color: C.slate, script: 'latin' },
  ], 10.15, 7.08, 2.45, 0.28, {
    fontSize: 23,
    align: 'right',
    objectName: `Textbook Page Marker ${clean}`,
  });
}

function addCard(slide, x, y, w, h, fill, value, options = {}) {
  slide.addShape('roundRect', {
    x, y, w, h,
    rectRadius: options.radius || 0.08,
    fill: { color: fill },
    line: { color: options.line || C.line, pt: options.linePt || 0.8 },
  });
  if (value !== '') addText(slide, value, x + (options.padX || 0.16), y + (options.padY || 0.1), w - 2 * (options.padX || 0.16), h - 2 * (options.padY || 0.1), {
    fontSize: options.fontSize || 26,
    color: options.color || C.ink,
    bold: options.bold || false,
    align: options.align || 'center',
    valign: options.valign || 'mid',
    breakLine: true,
  });
}

function metaPush(meta, slideNumber, visible, page, layout, notes, sourceRefs, audio = []) {
  meta.push({
    slide_number: slideNumber,
    student_visible_text: visible,
    textbook_page: page,
    audio,
    layout,
    speaker_notes: notes,
    source_refs: sourceRefs,
    source_audio_reference: audio,
  });
}

function addSectionDivider(pptx, n, title, imagePath, meta, notes) {
  const slide = pptx.addSlide();
  addHeader(slide, n);
  addText(slide, title, 0.95, 2.18, 5.5, 0.9, { fontSize: 50, color: C.purple, bold: true });
  addLine(slide, 0.98, 3.35, 5.45, C.coral, 2);
  slide.addImage({ path: imagePath, x: 6.62, y: 1.38, w: 6.0, h: 3.38 });
  slide.addNotes(notes);
  metaPush(meta, n, [title], null, 'section-divider-imagen', notes);
}

function addSingleFinal(pptx, n, value, page, meta, notes, sourceRef = 'canonical-source.json#sections.compound_finals') {
  const slide = pptx.addSlide();
  addHeader(slide, n);
  const isParen = value.includes('（');
  if (isParen) {
    const [main, rest] = value.split('（');
    addMixed(slide, [
      { text: main, fontFace: FONT_LATIN, script: 'latin', fontSize: 100, bold: true },
      { text: `（${rest}`, fontFace: FONT_CJK, fontSize: 55, bold: true },
    ], 1.6, 2.05, 10.2, 2.5, { align: 'center', valign: 'mid' });
  } else {
    addLatin(slide, value, 1.4, 2.0, 10.6, 2.8, { fontSize: 138, color: C.ink, bold: true, align: 'center', valign: 'mid' });
  }
  addPageMarker(slide, page);
  slide.addNotes(notes);
  metaPush(meta, n, [value], page, 'single-final-text-only', notes, [sourceRef]);
}

function addChoiceSlide(pptx, n, title, instruction, items, page, meta, notes, sourceRef, audioRef) {
  const slide = pptx.addSlide();
  addHeader(slide, n, title);
  addText(slide, instruction, 0.9, 1.56, 11.5, 0.7, { fontSize: 28, color: C.teal, bold: true, align: 'center' });
  const fills = [C.mint, C.yellowSoft, C.lilac, C.coralSoft];
  items.forEach((item, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 0.95 + col * 6.08;
    const y = 2.55 + row * 0.84;
    addCard(slide, x, y, 5.52, 0.62, fills[idx % fills.length], `${item.number}．  ${item.options}`, { fontSize: 28, bold: true });
  });
  addPageMarker(slide, page);
  slide.addNotes(notes);
  metaPush(meta, n, [title, instruction, ...items.map((item) => `${item.number}． ${item.options}`)], page, 'listening-choice-grid', notes, [sourceRef], audioRef ? [audioRef] : []);
}

function addActionSlide(pptx, n, title, body, page, meta, notes, sourceRefs, audioRef = null) {
  const slide = pptx.addSlide();
  addHeader(slide, n, title);
  addText(slide, body, 0.9, 2.08, 11.5, 2.65, { fontSize: body.length > 28 ? 38 : 46, bold: true, align: 'center', valign: 'mid' });
  addPageMarker(slide, page);
  slide.addNotes(notes);
  metaPush(meta, n, [title, body], page, 'single-action', notes, sourceRefs, audioRef ? [audioRef] : []);
}

function addGroupSlide(pptx, n, page, meta, notes, sourceRef, firstLine = '用教材中的内容。') {
  const slide = pptx.addSlide();
  addHeader(slide, n, '小组练习');
  addText(slide, firstLine, 0.92, 1.5, 11.5, 0.45, { fontSize: 27, color: C.teal, bold: true, align: 'center' });
  const steps = ['轮流读，其他同学写下来。', '小组一起核对读音和拼写。', '改好后，换人读。', '直到每个人都读过一次。'];
  const fills = [C.mint, C.yellowSoft, C.lilac, C.coralSoft];
  steps.forEach((step, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 1.0 + col * 6.0;
    const y = 2.35 + row * 1.42;
    slide.addShape('ellipse', { x, y: y + 0.19, w: 0.62, h: 0.62, fill: { color: [C.teal, C.coral, C.purple, C.yellow][idx] }, line: { color: C.white, transparency: 100 } });
    addLatin(slide, String(idx + 1), x, y + 0.33, 0.62, 0.25, { fontSize: 25, color: idx === 3 ? C.ink : C.white, bold: true, align: 'center' });
    addCard(slide, x + 0.82, y, 4.98, 1.04, fills[idx], step, { fontSize: 25, bold: true, align: 'left', padX: 0.22 });
  });
  addPageMarker(slide, page);
  slide.addNotes(notes);
  const refs = Array.isArray(sourceRef) ? sourceRef : [sourceRef];
  metaPush(meta, n, ['小组练习', firstLine, ...steps], page, 'group-four-steps', notes, refs);
}

function addRuleSlide(pptx, n, title, from, to, bottom, meta, notes, sourceRef = 'canonical-source.json#sections.y_rules') {
  const slide = pptx.addSlide();
  addHeader(slide, n, title);
  addCard(slide, 1.75, 2.08, 9.85, 1.52, C.lilac, '', {});
  addLatin(slide, `${from}  →  ${to}`, 2.0, 2.22, 9.35, 1.16, { fontSize: 62, color: C.purple, bold: true, align: 'center' });
  addText(slide, bottom, 1.0, 4.35, 11.3, 0.64, { fontSize: 30, color: C.purple, bold: true, align: 'center' });
  addPageMarker(slide, 'P12');
  slide.addNotes(notes);
  metaPush(meta, n, [title, `${from} → ${to}`, bottom], 'P12', 'single-rule-visualization', notes, [sourceRef], ['3-5']);
}

function addRuleSummarySlide(pptx, n, title, mappings, meta, notes, sourceRef) {
  const slide = pptx.addSlide();
  addHeader(slide, n, title);
  addText(slide, '一次看完全部变化', 0.92, 1.43, 11.5, 0.48, { fontSize: 27, color: C.teal, bold: true, align: 'center' });
  const fills = [C.mint, C.yellowSoft, C.lilac, C.coralSoft];
  const columns = 2;
  const rows = Math.ceil(mappings.length / columns);
  const cellW = 5.45;
  const cellH = rows >= 7 ? 0.58 : 0.72;
  const gapX = 0.48;
  const gapY = rows >= 7 ? 0.1 : 0.16;
  mappings.forEach(([from, to], idx) => {
    const col = idx % columns;
    const row = Math.floor(idx / columns);
    const x = 0.95 + col * (cellW + gapX);
    const y = 2.02 + row * (cellH + gapY);
    addCard(slide, x, y, cellW, cellH, fills[idx % fills.length], `${from}  →  ${to}`, { fontSize: rows >= 7 ? 27 : 29, bold: true });
  });
  addPageMarker(slide, 'P12');
  slide.addNotes(notes);
  metaPush(meta, n, [title, '一次看完全部变化', ...mappings.map(([from, to]) => `${from} → ${to}`)], 'P12', 'rule-summary-table', notes, [sourceRef], ['3-5']);
}

function addPhraseSlide3(pptx, n, phrases, meta, notes) {
  const slide = pptx.addSlide();
  addHeader(slide, n, '日常用语');
  phrases.forEach((phrase, idx) => {
    const y = 1.8 + idx * 1.28;
    addCard(slide, 1.72, y, 9.9, 0.9, [C.mint, C.yellowSoft, C.lilac][idx], phrase, { fontSize: 35, bold: true });
  });
  addPageMarker(slide, 'P15');
  slide.addNotes(notes);
  metaPush(meta, n, ['日常用语', ...phrases], 'P15', 'daily-phrase-cards-no-pinyin', notes, ['canonical-source.json#sections.daily_phrases'], ['3-12']);
}

function addVietnameseScenarioSlide3(pptx, n, lines, meta, notes) {
  const slide = pptx.addSlide();
  addHeader(slide, n, '看情景，说一句话');
  addLatinPhrase(slide, lines[0], 0.8, 1.45, 11.7, 0.48, { fontSize: 27, color: C.teal, bold: true, align: 'center' });
  const fills = [C.mint, C.yellowSoft, C.lilac, C.coralSoft];
  lines.slice(1).forEach((line, idx) => {
    const y = 2.16 + idx * 0.98;
    addCard(slide, 0.92, y, 11.5, 0.72, fills[idx % fills.length], '', {});
    addLatinPhrase(slide, `${idx + 1}. ${line}`, 1.12, y + 0.11, 11.1, 0.45, { fontSize: 25, color: C.ink, bold: true, align: 'center' });
  });
  addPageMarker(slide, 'P15');
  slide.addNotes(notes);
  metaPush(meta, n, lines, 'P15', 'vietnamese-scenario-cards', notes, ['canonical-source.json#sections.daily_phrases']);
}

async function build() {
  if (!fs.existsSync(REVIEW_DOC)) throw new Error(`Missing approved copy review: ${REVIEW_DOC}`);
  if (!fs.existsSync(SOURCE_REFS)) throw new Error(`Missing source refs: ${SOURCE_REFS}`);
  if (!fs.existsSync(CANONICAL_SOURCE) || !fs.existsSync(SOURCE_MANIFEST)) throw new Error('Lesson source package is incomplete');
  runDraftGate();
  fs.mkdirSync(resolvedOutput, { recursive: true });
  const assets = {
    route: path.join(ASSET_ROOT, 'learning-route-imagen.png'),
    er: path.join(ASSET_ROOT, 'divider-er-imagen.png'),
    yw: path.join(ASSET_ROOT, 'divider-yw-imagen.png'),
    tones: path.join(ASSET_ROOT, 'divider-tones-imagen.png'),
    daily: path.join(ASSET_ROOT, 'divider-daily-imagen.png'),
  };
  Object.entries(assets).forEach(([name, filePath]) => {
    if (!fs.existsSync(filePath)) throw new Error(`Missing image asset ${name}: ${filePath}`);
  });

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = '榮市大學華語聽說課程';
  pptx.company = '榮市大學';
  pptx.subject = '博雅漢語聽說·初級起步篇 I 第三課實體課';
  pptx.title = '第三課｜拼音和日常用語（三）｜實體課';
  pptx.lang = 'zh-CN';
  pptx.theme = { headFontFace: FONT_CJK, bodyFontFace: FONT_CJK, lang: 'zh-CN' };
  const meta = [];

  // 1. Cover
  {
    const slide = pptx.addSlide();
    slide.background = { color: C.slideBackground };
    slide.addShape('ellipse', { x: 0.0, y: 5.1, w: 5.0, h: 2.4, fill: { color: C.mint, transparency: 18 }, line: { color: C.mint, transparency: 100 } });
    slide.addShape('ellipse', { x: 9.0, y: 0.0, w: 4.2, h: 2.2, fill: { color: C.yellowSoft, transparency: 18 }, line: { color: C.yellowSoft, transparency: 100 } });
    addText(slide, '第3课', 0.95, 1.23, 2.8, 0.62, { fontSize: 32, color: C.teal, bold: true });
    addText(slide, '拼音和日常用语（三）', 0.9, 2.0, 6.8, 1.32, { fontSize: 46, color: C.ink, bold: true, valign: 'mid' });
    addCard(slide, 0.95, 3.75, 2.35, 0.62, C.coral, '实体课', { fontSize: 25, color: C.white, bold: true });
    slide.addImage({ path: assets.er, x: 7.7, y: 1.25, w: 5.1, h: 3.6 });
    const notes = '打开教材 P10–P15，准备笔和笔记本。今天先学 er 和儿化韵，再学 y、w 规则，之后练习声调变化和日常用语。';
    slide.addNotes(notes);
    metaPush(meta, 1, ['第3课', '拼音和日常用语（三）', '实体课'], null, 'cover', notes, []);
  }

  // 2. Learning route: same reusable four-step family, with Vietnamese text generated for Lesson 3.
  {
    const slide = pptx.addSlide();
    addHeader(slide, 2, '今天这样学');
    slide.addImage({ path: assets.route, x: 0.78, y: 1.05, w: 11.78, h: 5.82 });
    const notes = '学习流程图沿用第一课和第二课的版式；图中文字是越南文。教材题目在书上完成，PPT 只提示当前动作。';
    slide.addNotes(notes);
    metaPush(meta, 2, ['今天这样学', 'Học âm er và âm cuốn lưỡi', 'Học quy tắc y và w', 'Luyện biến điệu', 'Luyện nói hằng ngày'], null, 'learning-route-imagen-template-family', notes, []);
  }

  // 3. Goals
  {
    const slide = pptx.addSlide();
    addHeader(slide, 3, '本课目标');
    addText(slide, '今天下课前，我能：', 0.98, 1.42, 11.25, 0.5, { fontSize: 29, color: C.teal, bold: true, align: 'center' });
    const goals = ['读出 er 和儿化韵。', '看懂 y、w 的拼写变化，并读出来。', '听辨并读出三声、bu、yi 的变调。', '用日常用语表达听不懂、请重复、价格和地点。'];
    goals.forEach((goal, idx) => {
      const y = 2.08 + idx * 1.02;
      slide.addShape('ellipse', { x: 1.2, y: y + 0.1, w: 0.68, h: 0.68, fill: { color: [C.teal, C.coral, C.purple, C.yellow][idx] }, line: { color: C.white, transparency: 100 } });
      addLatin(slide, String(idx + 1), 1.2, y + 0.29, 0.68, 0.26, { fontSize: 25, color: idx === 3 ? C.ink : C.white, bold: true, align: 'center' });
      addCard(slide, 2.15, y, 9.95, 0.82, [C.mint, C.coralSoft, C.lilac, C.yellowSoft][idx], goal, { fontSize: 26, bold: true, align: 'left', padX: 0.26 });
    });
    const notes = '目标对应今天的听、读、说动作。出现困难时只短示范，再回到教材练习。';
    slide.addNotes(notes);
    metaPush(meta, 3, ['本课目标', '今天下课前，我能：', ...goals], null, 'goals', notes, []);
  }

  // 4. er and retroflex finals.
  addSectionDivider(pptx, 4, 'er 和儿化韵', assets.er, meta, '进入 er 和儿化韵。先示范 er，再回到教材 P10–P11 的对照和朗读。');
  addSingleFinal(pptx, 5, 'er', 'P10', meta, '教师示范 er，学生听后跟读。参考音频 3-1。', 'canonical-source.json#sections.er_demo');
  addActionSlide(pptx, 6, '跟读', 'er　　erzi　　nü’er', 'P10', meta, '参考音频 3-2。先整体听，再分组跟读；必要时只重读学生混淆的项目。', ['canonical-source.json#sections.er_examples'], '3-2');
  addActionSlide(pptx, 7, '跟读', 'erni　　erduo　　erqie', 'P10', meta, '参考音频 3-2。学生跟读后，同伴互听一个最不确定的项目。', ['canonical-source.json#sections.er_examples'], '3-2');
  addActionSlide(pptx, 8, '普通韵母和儿化韵', '请看教材P10的对照表。\n先读左边，再读右边。', 'P10', meta, '参考音频 3-3。教师按行指向；学生先读普通韵母，再读对应儿化韵。', ['canonical-source.json#sections.retroflex_pairs'], '3-3');
  addActionSlide(pptx, 9, '儿化韵朗读', '请看教材P11的朗读部分。\n按顺序读。', 'P11', meta, '参考音频 3-4。不要全班逐项轮流；按行跟读，教师抽听并重做错项。', ['canonical-source.json#sections.retroflex_reading'], '3-4');

  // 5. y rules: one transformation per slide, then one complete summary table.
  addSectionDivider(pptx, 10, 'y 的规则', assets.yw, meta, '进入 y 的拼写规则。每次只看一个变化；最后用总表一次复习全部变化。');
  const yRules = [
    ['i', 'yi', '没有声母时，i 写成 y', '读音不变。'],
    ['in', 'yin', '没有声母时，in 写成 yin', '读音不变。'],
    ['ing', 'ying', '没有声母时，ing 写成 ying', '读音不变。'],
    ['ü', 'yu', '没有声母时，ü 写成 yu', '两点去掉，读音还是 ü。'],
    ['üe', 'yue', '没有声母时，üe 写成 yue', '两点去掉，读音还是 üe。'],
    ['üan', 'yuan', '没有声母时，üan 写成 yuan', '两点去掉，读音还是 üan。'],
    ['ün', 'yun', '没有声母时，ün 写成 yun', '两点去掉，读音还是 ün。'],
    ['ia', 'ya', '没有声母时，ia 写成 ya', '读音不变。'],
    ['ie', 'ye', '没有声母时，ie 写成 ye', '读音不变。'],
    ['iao', 'yao', '没有声母时，iao 写成 yao', '读音不变。'],
    ['iou', 'you', '没有声母时，iou 写成 you', '读音不变。'],
    ['ian', 'yan', '没有声母时，ian 写成 yan', '读音不变。'],
    ['iang', 'yang', '没有声母时，iang 写成 yang', '读音不变。'],
    ['iong', 'yong', '没有声母时，iong 写成 yong', '读音不变。'],
  ];
  yRules.forEach(([from, to, title, bottom], idx) => {
    addRuleSlide(pptx, 11 + idx, title, from, to, bottom, meta, `教师指着教材 P12 的对应行，先读变化前，再读变化后；参考音频 3-5。${bottom}`, 'canonical-source.json#sections.y_rules');
  });
  addRuleSummarySlide(pptx, 25, 'y 的全部变化', yRules.map(([from, to]) => [from, to]), meta, '请学生从上到下看总表；教师抽取两三个变化让学生口头读出。参考教材 P12、音频 3-5。', 'canonical-source.json#sections.y_rules');

  // 6. w rules: one transformation per slide, then one complete summary table.
  addSectionDivider(pptx, 26, 'w 的规则', assets.yw, meta, '进入 w 的拼写规则。每次只看一个变化；最后用总表一次复习全部变化。');
  const wRules = [
    ['u', 'wu', '没有声母时，u 写成 wu'],
    ['ua', 'wa', 'u 开头的韵母，加 w'],
    ['uo', 'wo', 'u 开头的韵母，加 w'],
    ['uai', 'wai', 'u 开头的韵母，加 w'],
    ['uei', 'wei', 'u 开头的韵母，加 w'],
    ['uan', 'wan', 'u 开头的韵母，加 w'],
    ['uen', 'wen', 'u 开头的韵母，加 w'],
    ['uang', 'wang', 'u 开头的韵母，加 w'],
    ['ueng', 'weng', 'u 开头的韵母，加 w'],
  ];
  wRules.forEach(([from, to, title], idx) => {
    addRuleSlide(pptx, 27 + idx, title, from, to, '读音不变。', meta, `教师指着教材 P12 的对应行，先读变化前，再读变化后；参考音频 3-5。`, 'canonical-source.json#sections.w_rules');
  });
  addRuleSummarySlide(pptx, 36, 'w 的全部变化', wRules.map(([from, to]) => [from, to]), meta, '请学生从上到下看总表；教师抽取两三个变化让学生口头读出。参考教材 P12、音频 3-5。', 'canonical-source.json#sections.w_rules');
  addActionSlide(pptx, 37, 'y、w 规则后朗读', '请看教材P12、P13的朗读部分。\n按顺序读。', 'P12–13', meta, '参考音频 3-6。教师按行指向，学生先个人默读，再跟读和重读混淆项目。', ['canonical-source.json#sections.yw_reading'], '3-6');

  // 7. Tone changes and textbook exercises.
  addSectionDivider(pptx, 38, '汉语声调', assets.tones, meta, '进入声调变化。先看三声变调，再看教材 P14 的一、不变调说明。');
  {
    const slide = pptx.addSlide();
    addHeader(slide, 39, '三声变调');
    addCard(slide, 1.6, 1.95, 10.1, 1.5, C.lilac, '', {});
    addLatin(slide, 'nǐ hǎo  →  ní hǎo', 1.9, 2.17, 9.5, 1.08, { fontSize: 56, color: C.purple, bold: true, align: 'center' });
    addText(slide, '两个三声相连，前一个读二声。', 1.0, 4.25, 11.3, 0.62, { fontSize: 30, color: C.purple, bold: true, align: 'center' });
    addPageMarker(slide, 'P13');
    const notes = '请学生看教材 P13 的示例，先听教师示范，再读 nǐ hǎo 和 ní hǎo。参考音频 3-7。';
    slide.addNotes(notes);
    metaPush(meta, 39, ['三声变调', 'nǐ hǎo → ní hǎo', '两个三声相连，前一个读二声。'], 'P13', 'tone-change-rule', notes, ['canonical-source.json#sections.third_tone_sandhi'], ['3-7']);
  }
  addActionSlide(pptx, 40, '三声变调朗读', '请看教材P13的朗读部分。\n跟着老师读，注意三声变化。', 'P13', meta, '参考音频 3-8。先听，再跟读；教师抽听后让混淆项目重做。', ['canonical-source.json#sections.third_tone_sandhi'], '3-8');
  {
    const slide = pptx.addSlide();
    addHeader(slide, 41, '一、不变调');
    addCard(slide, 1.65, 1.95, 10.0, 1.42, C.lilac, '', {});
    addLatin(slide, '一　　不', 2.0, 2.15, 9.3, 1.0, { fontSize: 60, color: C.purple, bold: true, align: 'center' });
    addText(slide, '请看教材 P14 的说明。', 1.0, 4.28, 11.3, 0.62, { fontSize: 30, color: C.purple, bold: true, align: 'center' });
    addPageMarker(slide, 'P14');
    const notes = '不把一、不规则写成抽象讲解；请学生打开教材 P14，教师按教材说明短讲后马上进入 3-9。';
    slide.addNotes(notes);
    metaPush(meta, 41, ['一、不变调', '一　　不', '请看教材 P14 的说明。'], 'P14', 'tone-change-textbook-entry', notes, ['canonical-source.json#sections.bu_yi']);
  }
  addActionSlide(pptx, 42, '一、不练习', '请看教材P14的3-9。\n先标声调，再朗读。', 'P14', meta, '参考音频 3-9。先完成教材练习，再按行核对；教师只修补实际错误。', ['canonical-source.json#sections.bu_yi'], '3-9');
  addActionSlide(pptx, 43, '听辨', '请看教材P14的3-10。\n听后选择正确音节。', 'P14', meta, '参考音频 3-10。学生先看两个选项的差别，再听、选择、核对。', ['canonical-source.json#sections.syllable_choice'], '3-10');
  addActionSlide(pptx, 44, '听音补全', '请看教材P14的3-11。\n听后补全音节，标上声调。', 'P14', meta, '参考音频 3-11。按教材三组完成并核对；PPT 不显示答案。', ['canonical-source.json#sections.syllable_completion'], '3-11');
  addGroupSlide(pptx, 45, 'P15', meta, '不规定小组人数。每人轮流读，其他同学写下来；小组一起核对，改好后换人读。', ['canonical-source.json#sections.syllable_completion', 'canonical-source.json#sections.group_read_write'], '请看教材P15的练习四。');

  // 8. Daily language, without pinyin.
  addSectionDivider(pptx, 46, '日常用语', assets.daily, meta, '进入日常用语。先跟读六句话，再用越南文情景提示说中文。');
  addPhraseSlide3(pptx, 47, ['明白了！', '我听不懂。', '请再说一遍。'], meta, '参考音频 3-12。先完整听，再逐句跟读；学生看到的是汉字，不放拼音。');
  addPhraseSlide3(pptx, 48, ['太贵了！', '便宜（一）点儿吧！', '厕所在哪儿？'], meta, '参考音频 3-12。教师示范语气和场合，学生跟读；学生看到的是汉字，不放拼音。');
  addVietnameseScenarioSlide3(pptx, 49, [
    'Nhìn tình huống và nói bằng tiếng Trung.',
    'Bạn đã hiểu rồi.',
    'Bạn không hiểu.',
    'Bạn muốn người kia nói lại.',
  ], meta, '学生根据越南文情境说出明白了、我听不懂、请再说一遍；先个人说，再和同学交换。');
  addVietnameseScenarioSlide3(pptx, 50, [
    'Nhìn tình huống và nói bằng tiếng Trung.',
    'Giá quá đắt.',
    'Bạn muốn mặc cả: rẻ hơn một chút nhé.',
    'Bạn muốn hỏi nhà vệ sinh ở đâu.',
  ], meta, '学生根据越南文情境说出太贵了、便宜（一）点儿吧、厕所在哪儿；先个人说，再和同学交换。');
  addActionSlide(pptx, 51, '日常用语问答', '请看教材P15的（二）。\n轮流问答，再交换角色。', 'P15', meta, '完成教材两组问答，再交换角色重做。教师确认每位学生都实际开口，不在学生画面提供唯一答案。', ['canonical-source.json#sections.daily_pair_qa']);
  addActionSlide(pptx, 52, '', '再说一次\n从今天改过的答案中选一个，读给同学听。', 'P10–15', meta, '课末从今天改过的答案中选一个，读给同学听；同伴对照教材，教师抽听后结束。', ['lessons/boya-elementary-i/lesson-03/10-design/storyboard/lesson-03-逐页文案审阅.md']);

  if (pptx._slides.length !== 52) throw new Error(`Expected 52 slides, got ${pptx._slides.length}`);
  if (meta.length !== 52) throw new Error(`Expected 52 metadata records, got ${meta.length}`);

  const outputPath = path.join(resolvedOutput, 'lesson-03-实体课-draft-v01.pptx');
  await pptx.writeFile({ fileName: outputPath });

  const storyboardPath = path.join(STORYBOARD_ROOT, 'lesson-03-face-to-face-generated.json');
  writeJson(storyboardPath, {
    schema_version: 'boya-elementary-face-to-face-storyboard-v1',
    lesson_key: LESSON_KEY,
    offering_id: OFFERING_ID,
    title: '拼音和日常用语（三）',
    mode: 'teacher_face_to_face_only',
    source_copy: path.relative(ROOT, REVIEW_DOC).replaceAll(path.sep, '/'),
    source_refs: path.relative(ROOT, SOURCE_REFS).replaceAll(path.sep, '/'),
    student_visible_minimum_pt: MIN_VISIBLE_PT,
    slide_count: meta.length,
    slides: meta,
    notes: 'Reversible draft storyboard generated from Adam-approved copy. It is not an authority or release record.',
  });

  const imageManifest = JSON.parse(fs.readFileSync(IMAGE_MANIFEST, 'utf8'));
  imageManifest.assets = imageManifest.assets.map((asset) => ({ ...asset, sha256: sha256(path.join(ASSET_ROOT, asset.file)) }));
  imageManifest.pptx_draft = { path: path.relative(ROOT, outputPath).replaceAll(path.sep, '/'), embedded: true };
  writeJson(IMAGE_MANIFEST, imageManifest);

  const sourceManifest = JSON.parse(fs.readFileSync(SOURCE_MANIFEST, 'utf8'));
  const canonicalHash = sha256(CANONICAL_SOURCE);
  if (sourceManifest.canonical_source_sha256 !== canonicalHash) {
    throw new Error('Canonical source changed after the draft gate; rebuild source manifest before generating');
  }

  const draftManifest = {
    schema_version: 'boya-elementary-pptx-draft-v1',
    lesson_key: LESSON_KEY,
    offering_id: OFFERING_ID,
    textbook_id: 'boya-elementary-i',
    lesson_id: 'lesson-03',
    title: '拼音和日常用语（三）',
    mode: 'teacher_face_to_face_only',
    artifact_status: 'draft_generated_not_approved',
    output: path.relative(ROOT, outputPath).replaceAll(path.sep, '/'),
    slide_count: meta.length,
    slide_copy_source: path.relative(ROOT, REVIEW_DOC).replaceAll(path.sep, '/'),
    slide_copy_source_sha256: sha256(REVIEW_DOC),
    storyboard: path.relative(ROOT, storyboardPath).replaceAll(path.sep, '/'),
    student_visible_minimum_pt: MIN_VISIBLE_PT,
    textbook_page_marker_policy: 'All slides using Boya textbook content carry printed textbook page markers; cover, route, goals and section dividers omit markers.',
    audio: { embedded_tracks: [], source_tracks: ['3-1','3-2','3-3','3-4','3-5','3-6','3-7','3-8','3-9','3-10','3-11','3-12'], semantic_status: 'pending_teacher_listening', powerpoint_playback_status: 'not_applicable_audio_controls_omitted' },
    images: { embedded_assets: imageManifest.assets.map((asset) => ({ asset_id: asset.asset_id, file: asset.file, sha256: asset.sha256 })) },
    open_gates: ['semantic audio listening', 'teacher rehearsal', 'Adam authority approval'],
    sha256: sha256(outputPath),
  };
  writeJson(path.join(resolvedOutput, 'lesson-03-实体课-draft-v01-manifest.json'), draftManifest);
  console.log(JSON.stringify({ output: outputPath, slides: meta.length, storyboard: storyboardPath, embedded_audio_tracks: 0, embedded_image_assets: imageManifest.assets.length, sha256: draftManifest.sha256 }, null, 2));
}

build().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
