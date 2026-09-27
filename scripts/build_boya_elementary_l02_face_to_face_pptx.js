#!/usr/bin/env node

/* Native PPTX draft builder for boya-elementary-i:lesson-02. */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const PptxGenJS = require('pptxgenjs');
const design = require('./boya_design_system');

const ROOT = path.resolve(__dirname, '..');
const LESSON_KEY = 'boya-elementary-i:lesson-02';
const OFFERING_ID = '2026-fall';
const LESSON_ROOT = path.join(ROOT, 'lessons/boya-elementary-i/lesson-02');
const DEFAULT_OUTPUT = path.join(LESSON_ROOT, '10-design/pptx-draft/face-to-face');
const STORYBOARD_ROOT = path.join(LESSON_ROOT, '10-design/storyboard');
const REVIEW_DOC = path.join(STORYBOARD_ROOT, 'lesson-02-逐页文案审阅.md');
const SOURCE_REFS = path.join(STORYBOARD_ROOT, 'lesson-02-source-refs.csv');
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
    console.log('Usage: node scripts/build_boya_elementary_l02_face_to_face_pptx.js --lesson-key boya-elementary-i:lesson-02 --offering-id 2026-fall --output-dir DIR');
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
  addText(slide, '第二课｜拼音和日常用语（二）', 0.7, 0.22, 6.6, 0.32, { fontSize: 23, color: C.slate, bold: true });
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
    audio: [],
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

function addPhraseSlide(pptx, n, title, phrases, meta, notes) {
  const slide = pptx.addSlide();
  addHeader(slide, n, title);
  phrases.forEach((phrase, idx) => {
    const y = 1.82 + idx * 1.28;
    addCard(slide, 2.15, y, 9.05, 0.88, [C.mint, C.yellowSoft, C.lilac][idx], phrase, { fontSize: 36, bold: true });
  });
  addPageMarker(slide, 'P9');
  slide.addNotes(notes);
  metaPush(meta, n, [title, ...phrases], 'P9', 'daily-phrase-cards-no-pinyin', notes, ['canonical-source.json#sections.daily_phrases'], ['2-9']);
}

function addVietnameseScenarioSlide(pptx, n, lines, meta, notes) {
  const slide = pptx.addSlide();
  addHeader(slide, n, '看情景，说一句话');
  addLatinPhrase(slide, lines[0], 0.9, 1.48, 11.55, 0.45, { fontSize: 27, color: C.teal, bold: true, align: 'center' });
  const fills = [C.mint, C.yellowSoft, C.lilac, C.coralSoft];
  lines.slice(1).forEach((line, idx) => {
    const y = 2.15 + idx * 1.02;
    addCard(slide, 1.0, y, 11.3, 0.78, fills[idx], '', {});
    addLatinPhrase(slide, `${idx + 1}. ${line}`, 1.2, y + 0.13, 10.9, 0.48, { fontSize: 25, color: C.ink, bold: true, align: 'center' });
  });
  addPageMarker(slide, 'P9');
  slide.addNotes(notes);
  metaPush(meta, n, lines, 'P9', 'vietnamese-scenario-cards', notes, ['canonical-source.json#sections.daily_phrases']);
}

async function build() {
  if (!fs.existsSync(REVIEW_DOC)) throw new Error(`Missing approved copy review: ${REVIEW_DOC}`);
  if (!fs.existsSync(SOURCE_REFS)) throw new Error(`Missing source refs: ${SOURCE_REFS}`);
  if (!fs.existsSync(CANONICAL_SOURCE) || !fs.existsSync(SOURCE_MANIFEST)) throw new Error('Lesson source package is incomplete');
  runDraftGate();
  fs.mkdirSync(resolvedOutput, { recursive: true });
  const assets = {
    route: path.join(ASSET_ROOT, 'learning-route-imagen.png'),
    finals: path.join(ASSET_ROOT, 'divider-finals-imagen.png'),
    tones: path.join(ASSET_ROOT, 'divider-tones-imagen.png'),
    nasals: path.join(ASSET_ROOT, 'divider-nasals-imagen.png'),
    daily: path.join(ASSET_ROOT, 'divider-daily-imagen.png'),
  };
  Object.entries(assets).forEach(([name, filePath]) => {
    if (!fs.existsSync(filePath)) throw new Error(`Missing image asset ${name}: ${filePath}`);
  });

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = '榮市大學華語聽說課程';
  pptx.company = '榮市大學';
  pptx.subject = '博雅漢語聽說·初級起步篇 I 第二課實體課';
  pptx.title = '第二課｜拼音和日常用語（二）｜實體課';
  pptx.lang = 'zh-CN';
  pptx.theme = { headFontFace: FONT_CJK, bodyFontFace: FONT_CJK, lang: 'zh-CN' };
  const meta = [];

  // 1. Cover
  {
    const slide = pptx.addSlide();
    slide.background = { color: C.slideBackground };
    slide.addShape('ellipse', { x: 0.0, y: 5.1, w: 5.0, h: 2.4, fill: { color: C.mint, transparency: 18 }, line: { color: C.mint, transparency: 100 } });
    slide.addShape('ellipse', { x: 9.0, y: 0.0, w: 4.2, h: 2.2, fill: { color: C.yellowSoft, transparency: 18 }, line: { color: C.yellowSoft, transparency: 100 } });
    addText(slide, '第2课', 0.95, 1.23, 2.8, 0.62, { fontSize: 32, color: C.teal, bold: true });
    addText(slide, '拼音和日常用语（二）', 0.9, 2.0, 6.8, 1.32, { fontSize: 46, color: C.ink, bold: true, valign: 'mid' });
    addCard(slide, 0.95, 3.75, 2.35, 0.62, C.coral, '实体课', { fontSize: 25, color: C.white, bold: true });
    slide.addImage({ path: assets.daily, x: 7.65, y: 1.25, w: 5.25, h: 3.6 });
    const notes = '打开教材 P6–P9，准备笔和笔记本。今天先做复韵母，再做标调和鼻音韵母，最后练习日常用语。';
    slide.addNotes(notes);
    metaPush(meta, 1, ['第2课', '拼音和日常用语（二）', '实体课'], null, 'cover', notes, []);
  }

  // 2. Learning route: same reusable four-step family as Lesson 1.
  {
    const slide = pptx.addSlide();
    addHeader(slide, 2, '今天这样学');
    slide.addImage({ path: assets.route, x: 0.78, y: 1.05, w: 11.78, h: 5.82 });
    const notes = '学习流程图沿用第一课的四步版式。请学生按越南文图块理解今天的顺序；教材题目在书上完成，PPT 只提示当前动作。';
    slide.addNotes(notes);
    metaPush(meta, 2, ['今天这样学', 'Học vần ghép', 'Nghe và viết', 'Học vần mũi', 'Luyện nói hằng ngày'], null, 'learning-route-imagen-template-family', notes, []);
  }

  // 3. Goals
  {
    const slide = pptx.addSlide();
    addHeader(slide, 3, '本课目标');
    addText(slide, '今天下课前，我能：', 0.98, 1.55, 11.25, 0.5, { fontSize: 29, color: C.teal, bold: true, align: 'center' });
    const goals = ['读出13个复韵母和16个鼻音韵母。', '听后选择、听写、补全音节，并标上声调。', '在简单情景中使用本课的日常用语。'];
    goals.forEach((goal, idx) => {
      const y = 2.25 + idx * 1.18;
      slide.addShape('ellipse', { x: 1.2, y: y + 0.12, w: 0.68, h: 0.68, fill: { color: [C.teal, C.coral, C.purple][idx] }, line: { color: C.white, transparency: 100 } });
      addLatin(slide, String(idx + 1), 1.2, y + 0.31, 0.68, 0.26, { fontSize: 25, color: C.white, bold: true, align: 'center' });
      addCard(slide, 2.15, y, 9.95, 0.92, [C.mint, C.coralSoft, C.lilac][idx], goal, { fontSize: 27, bold: true, align: 'left', padX: 0.26 });
    });
    const notes = '目标对应今天的实际动作。学生卡住时短示范，再回到听、读、写和说。';
    slide.addNotes(notes);
    metaPush(meta, 3, ['本课目标', '今天下课前，我能：', ...goals], null, 'goals', notes, []);
  }

  // 4. Compound finals.
  addSectionDivider(pptx, 4, '13个复韵母', assets.finals, meta, '进入复韵母部分。先逐个示范，再完成教材 P6 的听辨和听写。');
  ['ai', 'ei', 'ao', 'ou', 'ia', 'ie', 'ua', 'uo', 'üe', 'iao', 'iou（iu）', 'uai', 'uei（ui）'].forEach((value, idx) => {
    addSingleFinal(pptx, idx + 5, value, 'P6', meta, `复韵母 ${value}：教师示范，学生听后跟读；出现混淆时只做短对比。参考音频 2-1。`);
  });

  addChoiceSlide(pptx, 18, '复韵母听辨', '请看教材P6的（一）。\n听后选出听到的韵母。', [
    { number: 1, options: 'ai　／　ei' }, { number: 2, options: 'uai　／　uei（ui）' },
    { number: 3, options: 'ao　／　ou' }, { number: 4, options: 'iao　／　iou（iu）' },
    { number: 5, options: 'ua　／　uo' }, { number: 6, options: 'ie　／　üe' },
    { number: 7, options: 'ia　／　iao' }, { number: 8, options: 'ei　／　uei（ui）' },
  ], 'P6', meta, '学生先看选项差别，再听 2-2 选择；第二次检查后核对，错项重读。', 'canonical-source.json#sections.compound_listening', '2-2');

  addActionSlide(pptx, 19, '', '听写', 'P6', meta, '请学生直接看教材 P6 的听写练习。参考音频 2-3，完成12项后核对；答案不放在学生画面。', ['canonical-source.json#sections.compound_dictation'], '2-3');

  addSectionDivider(pptx, 20, '声调标在哪里？', assets.tones, meta, '进入标调注意事项。先看顺序，再看 iu、ui 的位置。');
  {
    const slide = pptx.addSlide();
    addHeader(slide, 21, '标调顺序');
    addText(slide, 'a、o、e、i、u、ü', 0.9, 1.75, 11.55, 0.85, { fontSize: 48, color: C.purple, bold: true, align: 'center' });
    addText(slide, '先找 a，再找 o、e。', 1.0, 3.0, 11.3, 0.55, { fontSize: 31, color: C.teal, bold: true, align: 'center' });
    addLatin(slide, 'hǎo　xiè　jiǎo　xué', 1.0, 4.18, 11.3, 0.75, { fontSize: 42, color: C.ink, bold: true, align: 'center' });
    addPageMarker(slide, 'P7');
    const notes = '请学生对照教材 P7 注意事项。教师指 a、o、e、i、u、ü 的顺序，朗读四个教材示例；这是规则示例，不是额外听写答案。';
    slide.addNotes(notes);
    metaPush(meta, 21, ['标调顺序', 'a、o、e、i、u、ü', '先找 a，再找 o、e。', 'hǎo　xiè　jiǎo　xué'], 'P7', 'tone-rule-order', notes, ['canonical-source.json#sections.tone_rules']);
  }
  {
    const slide = pptx.addSlide();
    addHeader(slide, 22, 'iu、ui');
    addText(slide, '声调标在后面的元音上。', 0.9, 1.78, 11.55, 0.7, { fontSize: 36, color: C.teal, bold: true, align: 'center' });
    addLatin(slide, 'diū　　duì', 1.0, 3.28, 11.3, 0.9, { fontSize: 56, color: C.purple, bold: true, align: 'center' });
    addText(slide, '看清楚：i、u 一起出现时，看后面的元音。', 1.0, 4.8, 11.3, 0.5, { fontSize: 28, color: C.ink, bold: true, align: 'center' });
    addPageMarker(slide, 'P7');
    const notes = '请学生指着教材示例读 diū、duì。短讲不超过几分钟，马上进入教材练习。';
    slide.addNotes(notes);
    metaPush(meta, 22, ['iu、ui', '声调标在后面的元音上。', 'diū　　duì', '看清楚：i、u 一起出现时，看后面的元音。'], 'P7', 'tone-rule-iu-ui', notes, ['canonical-source.json#sections.tone_rules']);
  }

  addActionSlide(pptx, 23, '', '请看教材P6、P7的（三）。\n听后标声调。', 'P6–7', meta, '参考音频 2-4。先做P6的20个单音节，再做P7的15个词语；分两组播放、作答和核对，不能漏掉续页。', ['canonical-source.json#sections.compound_tone_marking'], '2-4');
  addGroupSlide(pptx, 24, 'P6–7', meta, '不规定小组人数。读已核对的项目，其他同学写下来；小组一起核对后换人，确保每个人都轮到读。', ['canonical-source.json#sections.compound_tone_marking', 'canonical-source.json#sections.compound_group'], '用教材P6、P7的（三）。');

  addSectionDivider(pptx, 25, '16个鼻音韵母', assets.nasals, meta, '进入鼻音韵母部分。先短复查上一节困难音，再逐个示范。');
  ['an', 'ian', 'uan', 'üan', 'ang', 'iang', 'uang', 'en', 'in', 'uen（un）', 'üen（ün）', 'eng', 'ing', 'ueng', 'ong', 'iong'].forEach((value, idx) => {
    addSingleFinal(pptx, idx + 26, value, 'P7', meta, `鼻音韵母 ${value}：教师示范，学生听后跟读；相近音只在实际混淆时比较。参考音频 2-5。`, 'canonical-source.json#sections.nasal_finals');
  });

  addActionSlide(pptx, 42, '', '请看教材P7、P8的（一）。\n按顺序读完两页。', 'P7–8', meta, '参考音频 2-6。教师按行指向，学生完整读完 P7 表格和 P8 续表，包括 ji、qi、xi、zi、ci、si、zhi、chi、shi、ri。', ['canonical-source.json#sections.nasal_reading'], '2-6');
  addChoiceSlide(pptx, 43, '鼻音韵母听辨', '请看教材P8的（二）。\n听后选出听到的韵母。', [
    { number: 1, options: 'an　／　ang' }, { number: 2, options: 'en　／　eng' },
    { number: 3, options: 'in　／　ing' }, { number: 4, options: 'ian　／　iang' },
    { number: 5, options: 'uan　／　uang' }, { number: 6, options: 'ong　／　iong' },
    { number: 7, options: 'un　／　uan' }, { number: 8, options: 'ueng　／　eng' },
    { number: 9, options: 'ou　／　ong' }, { number: 10, options: 'in　／　en' },
  ], 'P8', meta, '学生先看差别，再参考音频 2-7 选择；第二次检查后核对，实际错项再读一次。', 'canonical-source.json#sections.nasal_listening', '2-7');
  addActionSlide(pptx, 44, '', '请看教材P8的（三）。\n补全音节，标上声调。', 'P8', meta, '参考音频 2-8。按教材三组分段完成，覆盖6、11、13项及每一个空格；完成后逐组核对。', ['canonical-source.json#sections.nasal_completion'], '2-8');
  addGroupSlide(pptx, 45, 'P8–9', meta, '不规定小组人数。每人读、写、核对一次，再换人。', ['canonical-source.json#sections.nasal_completion', 'canonical-source.json#sections.nasal_group'], '用教材P8的（三）。');

  addSectionDivider(pptx, 46, '日常用语', assets.daily, meta, '进入日常用语部分。先跟读六句话，再用越南文情景提示说中文。');
  addPhraseSlide(pptx, 47, '日常用语', ['早上好！', '晚上好！'], meta, '参考音频 2-9。先完整听，再逐句跟读；不显示拼音。教师用早晨、晚上动作提示场合。');
  addPhraseSlide(pptx, 48, '日常用语', ['明天见！', '请进！'], meta, '参考音频 2-9。教师用告别和进门动作提示场合；学生跟读并用动作回应，不显示拼音。');
  addPhraseSlide(pptx, 49, '日常用语', ['什么？', '多少钱？'], meta, '参考音频 2-9。教师示范疑问语气，学生跟读；不先扩展数字和价格回答，不显示拼音。');
  addVietnameseScenarioSlide(pptx, 50, [
    'Nhìn tình huống và nói bằng tiếng Trung.',
    'Buổi sáng, bạn gặp thầy cô.',
    'Buổi tối, bạn gặp bạn cùng lớp.',
    'Bạn chào tạm biệt, ngày mai sẽ gặp lại.',
  ], meta, '学生从六句日常用语中选择合适表达。先自己说，再和同学交换；越南文只帮助理解场合。');
  addVietnameseScenarioSlide(pptx, 51, [
    'Nhìn tình huống và nói bằng tiếng Trung.',
    'Có người gõ cửa. Bạn mời họ vào.',
    'Bạn không nghe rõ người kia vừa nói gì.',
    'Bạn muốn biết giá một món đồ.',
  ], meta, '学生从六句日常用语中选择合适表达。只练请进、什么、多少钱三个问句，不扩展新的价格回答。');
  addActionSlide(pptx, 52, '', '请看教材P9的（二）。\n轮流问答，再交换角色。', 'P9', meta, '完成教材三组问答，再交换角色重做。教师确认每位学生都实际开口，不在学生画面提供唯一答案。', ['canonical-source.json#sections.daily_pair_qa']);
  addActionSlide(pptx, 53, '', '再读一次\n从今天改过的答案中选一个，读给同学听。', 'P6–9', meta, '课末从今天改过的答案中选一个，读给同学听；同伴对照教材，教师抽听后结束。', ['lessons/boya-elementary-i/lesson-02/10-design/storyboard/lesson-02-逐页文案审阅.md']);

  if (pptx._slides.length !== 53) throw new Error(`Expected 53 slides, got ${pptx._slides.length}`);
  if (meta.length !== 53) throw new Error(`Expected 53 metadata records, got ${meta.length}`);

  const outputPath = path.join(resolvedOutput, 'lesson-02-实体课-draft-v01.pptx');
  await pptx.writeFile({ fileName: outputPath });

  const storyboardPath = path.join(STORYBOARD_ROOT, 'lesson-02-face-to-face-generated.json');
  writeJson(storyboardPath, {
    schema_version: 'boya-elementary-face-to-face-storyboard-v1',
    lesson_key: LESSON_KEY,
    offering_id: OFFERING_ID,
    title: '拼音和日常用语（二）',
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
    lesson_id: 'lesson-02',
    title: '拼音和日常用语（二）',
    mode: 'teacher_face_to_face_only',
    artifact_status: 'draft_generated_not_approved',
    output: path.relative(ROOT, outputPath).replaceAll(path.sep, '/'),
    slide_count: 53,
    slide_copy_source: path.relative(ROOT, REVIEW_DOC).replaceAll(path.sep, '/'),
    slide_copy_source_sha256: sha256(REVIEW_DOC),
    storyboard: path.relative(ROOT, storyboardPath).replaceAll(path.sep, '/'),
    student_visible_minimum_pt: MIN_VISIBLE_PT,
    textbook_page_marker_policy: 'All slides using Boya textbook content carry printed textbook page markers; cover, route, goals and section dividers omit markers.',
    audio: { embedded_tracks: [], source_tracks: ['2-1','2-2','2-3','2-4','2-5','2-6','2-7','2-8','2-9'], semantic_status: 'pending_teacher_listening', powerpoint_playback_status: 'not_applicable_audio_controls_omitted' },
    images: { embedded_assets: imageManifest.assets.map((asset) => ({ asset_id: asset.asset_id, file: asset.file, sha256: asset.sha256 })) },
    open_gates: ['semantic audio listening', 'teacher rehearsal', 'Adam authority approval'],
    sha256: sha256(outputPath),
  };
  writeJson(path.join(resolvedOutput, 'lesson-02-实体课-draft-v01-manifest.json'), draftManifest);
  console.log(JSON.stringify({ output: outputPath, slides: 53, storyboard: storyboardPath, embedded_audio_tracks: 0, embedded_image_assets: imageManifest.assets.length, sha256: draftManifest.sha256 }, null, 2));
}

build().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
