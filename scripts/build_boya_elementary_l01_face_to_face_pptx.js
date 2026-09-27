#!/usr/bin/env node

/*
 * Native PPTX draft builder for:
 *   boya-elementary-i:lesson-01
 *
 * The source of visible copy is the Adam-approved 52-slide review document.
 * This builder deliberately writes only to the lesson's 10-design draft area.
 * It does not create an HTML deck, modify 20-approved, or create a release.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const PptxGenJS = require('pptxgenjs');
const sharp = require('sharp');
const design = require('./boya_design_system');

const ROOT = path.resolve(__dirname, '..');
const LESSON_KEY = 'boya-elementary-i:lesson-01';
const OFFERING_ID = '2026-fall';
const LESSON_ROOT = path.join(ROOT, 'lessons/boya-elementary-i/lesson-01');
const DEFAULT_OUTPUT = path.join(LESSON_ROOT, '10-design/pptx-draft/face-to-face');
const SOURCE_AUDIO_ROOT = path.join(ROOT, 'textbooks/boya-elementary-i/source/audio/lesson-01');
const ASSET_ROOT = path.join(LESSON_ROOT, '10-design/assets');
const STORYBOARD_ROOT = path.join(LESSON_ROOT, '10-design/storyboard');
const REVIEW_DOC = path.join(ROOT, 'docs/boya-elementary-i-lesson-01-slide-copy-review-2026-09-15.md');
const SOURCE_REFS = path.join(STORYBOARD_ROOT, 'lesson-01-source-refs.csv');
const AUDIO_MANIFEST = path.join(LESSON_ROOT, '00-source/audio-manifest.json');
const IMAGE_MANIFEST = path.join(LESSON_ROOT, '10-design/assets/image-manifest.json');

const W = 13.333;
const H = 7.5;
const MIN_VISIBLE_PT = 23;
const FONT_CJK = design.fonts.cjk;
const FONT_LATIN = design.fonts.latin;
const C = { ...design.colors, slideBackground: 'FFFFFF' };

const args = process.argv.slice(2);
let outputDir = DEFAULT_OUTPUT;
let lessonKey = LESSON_KEY;
let offeringId = OFFERING_ID;
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--output-dir') outputDir = path.resolve(args[++i]);
  else if (args[i] === '--lesson-key') lessonKey = args[++i];
  else if (args[i] === '--offering-id') offeringId = args[++i];
  else if (args[i] === '--help') {
    console.log('Usage: node scripts/build_boya_elementary_l01_face_to_face_pptx.js [--output-dir DIR] [--lesson-key KEY] [--offering-id ID]');
    process.exit(0);
  }
}

if (lessonKey !== LESSON_KEY) throw new Error(`This builder only accepts ${LESSON_KEY}`);
if (offeringId !== OFFERING_ID) throw new Error(`This builder only accepts offering ${OFFERING_ID}`);
const resolvedOutput = path.resolve(outputDir);
const draftRoot = path.join(LESSON_ROOT, '10-design', 'pptx-draft');
if (!resolvedOutput.startsWith(`${draftRoot}${path.sep}`) && resolvedOutput !== draftRoot) {
  throw new Error(`Output must stay under ${draftRoot}`);
}
if (resolvedOutput.includes(`${path.sep}20-approved${path.sep}`) || resolvedOutput.includes(`${path.sep}30-qa${path.sep}`) || resolvedOutput.includes(`${path.sep}40-release${path.sep}`)) {
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

async function prepareAssets() {
  fs.mkdirSync(ASSET_ROOT, { recursive: true });
  const pinyinRoot = '/Volumes/Transcend/Development/ai-teaching-material-system/output/pinyin';
  const concept1 = path.join(pinyinRoot, 'pinyin-01/slides/assets/photos/pinyin-concept-1.png');
  const concept2 = path.join(pinyinRoot, 'pinyin-01/slides/assets/photos/pinyin-concept-2.png');
  const jqx = path.join(pinyinRoot, 'pinyin-02/slides/assets/photos/divider-rule-jqx.png');
  const learningRoute = path.join(ASSET_ROOT, 'learning-route-imagen.png');
  const toneChart = path.join(ASSET_ROOT, 'tone-chart-user.png');
  const dividerInitials = path.join(ASSET_ROOT, 'divider-initials-imagen.png');
  const dividerFinals = path.join(ASSET_ROOT, 'divider-finals-imagen.png');
  const dividerTones = path.join(ASSET_ROOT, 'divider-tones-imagen.png');
  const dividerSyllable = path.join(ASSET_ROOT, 'divider-syllable-imagen.png');
  const dividerDaily = path.join(ASSET_ROOT, 'divider-daily-imagen.png');
  for (const file of [concept1, concept2, jqx]) {
    if (!fs.existsSync(file)) throw new Error(`Missing specified pinyin asset: ${file}`);
  }
  if (!fs.existsSync(learningRoute)) throw new Error(`Missing Imagen learning-route asset: ${learningRoute}`);
  if (!fs.existsSync(toneChart)) throw new Error(`Missing user-provided tone chart asset: ${toneChart}`);
  for (const file of [dividerInitials, dividerFinals, dividerTones, dividerSyllable, dividerDaily]) {
    if (!fs.existsSync(file)) throw new Error(`Missing Imagen divider asset: ${file}`);
  }
  // Crop only visual areas from the source teaching illustrations. This keeps
  // the source image's Vietnamese explanatory labels out of the Chinese deck;
  // the instructional wording is added below as native PPTX text.
  await sharp(concept1).extract({ left: 1110, top: 0, width: 560, height: 440 }).png().toFile(path.join(ASSET_ROOT, 'pinyin-greeting-crop.png'));
  // Keep the central "nǐ hǎo / 你好" teaching image only.  The source
  // slide has Vietnamese explanatory labels around it; those labels are
  // not part of this classroom deck's image treatment.
  await sharp(concept2).extract({ left: 520, top: 360, width: 570, height: 520 }).png().toFile(path.join(ASSET_ROOT, 'pinyin-concept-2-crop.png'));
  fs.copyFileSync(jqx, path.join(ASSET_ROOT, 'pinyin-jqx-rule.png'));
  return {
    greeting: path.join(ASSET_ROOT, 'pinyin-greeting-crop.png'),
    concept: path.join(ASSET_ROOT, 'pinyin-concept-2-crop.png'),
    jqx: path.join(ASSET_ROOT, 'pinyin-jqx-rule.png'),
    learningRoute,
    toneChart,
    dividerInitials,
    dividerFinals,
    dividerTones,
    dividerSyllable,
    dividerDaily,
  };
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

function addLine(slide, x, y, w, color = C.line, pt = 0.8) {
  slide.addShape('line', { x, y, w, h: 0, line: { color, pt } });
}

function addHeader(slide, n, title = '') {
  slide.background = { color: C.slideBackground };
  addText(slide, '第一课｜拼音和日常用语（一）', 0.7, 0.22, 5.9, 0.32, { fontSize: 23, color: C.slate, bold: true });
  addLatin(slide, String(n).padStart(2, '0'), 11.9, 0.22, 0.7, 0.32, { fontSize: 23, color: C.slate, bold: true, align: 'right' });
  addLine(slide, 0.7, 0.68, 11.93, C.line, 0.8);
  slide.addShape('rect', { x: 0.7, y: 0.65, w: 0.48, h: 0.05, fill: { color: C.purple }, line: { color: C.purple, transparency: 100 } });
  if (title) addText(slide, title, 0.78, 0.92, 9.2, 0.56, { fontSize: title.length > 16 ? 30 : 34, bold: true, valign: 'top' });
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

function addAudio(slide, track, audioManifest) {
  // Playback controls and embedded tracks are intentionally omitted from
  // this classroom draft. The teacher can use the textbook audio separately.
  return;
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

function drawGrid(slide, x, y, colWidths, rowHeights, rows, options = {}) {
  let yy = y;
  rows.forEach((row, ri) => {
    let xx = x;
    row.forEach((cell, ci) => {
      const fill = options.fills?.[ri]?.[ci] || (ri === 0 ? C.blue : (ri % 2 ? C.white : 'F7FAF9'));
      slide.addShape('rect', {
        x: xx, y: yy, w: colWidths[ci], h: rowHeights[ri],
        fill: { color: fill },
        line: { color: options.line || C.line, pt: options.linePt || 0.8 },
      });
      if (cell !== '' && cell !== null && cell !== undefined) {
        const isLatin = options.latinCells?.includes(`${ri}:${ci}`) || /^[a-züāáǎàōóǒòēéěèīíǐìūúǔùǖǘǚǜ0-9\s/—→·.,]+$/i.test(String(cell));
        (isLatin ? addLatin : addText)(slide, cell, xx + 0.04, yy + 0.04, colWidths[ci] - 0.08, rowHeights[ri] - 0.08, {
          fontSize: options.fontSize || 25,
          color: options.textColors?.[ri]?.[ci] || (ri === 0 ? C.teal : C.ink),
          bold: ri === 0 || ci === 0 || options.bold,
          align: 'center',
          valign: 'mid',
        });
      }
      xx += colWidths[ci];
    });
    yy += rowHeights[ri];
  });
}

function addSectionDivider(pptx, n, title, imagePath, meta, notesText) {
  const slide = pptx.addSlide();
  addHeader(slide, n);
  addText(slide, title, 0.95, 2.2, 6.4, 0.9, { fontSize: 50, color: C.purple, bold: true });
  addLine(slide, 0.98, 3.35, 5.45, C.coral, 2);
  if (imagePath) slide.addImage({ path: imagePath, x: 8.32, y: 1.38, w: 3.85, h: 3.85, transparency: 0 });
  meta.push({ slide_number: n, student_visible_text: [title], textbook_page: null, audio: [], layout: 'section-divider', speaker_notes: notesText, source_refs: [] });
  slide.addNotes(notesText);
  return slide;
}

function addInitialSlide(pptx, n, value, audioManifest, meta) {
  const slide = pptx.addSlide();
  addHeader(slide, n);
  addLatin(slide, value, 2.0, 2.0, 9.35, 2.8, { fontSize: value.length > 1 ? 116 : 138, color: C.ink, bold: true, align: 'center', valign: 'mid' });
  addAudio(slide, '1-1', audioManifest);
  addPageMarker(slide, 'P1');
  const notesText = `声母 ${value}：播放音频 1-1 中对应的声音，学生先听、指向屏幕，再跟读。只在学生实际混淆时做短示范。`;
  slide.addNotes(notesText);
  meta.push({ slide_number: n, student_visible_text: [value, '音频 1-1', '教材 P1'], textbook_page: 'P1', audio: ['1-1'], layout: 'single-sound', speaker_notes: notesText, source_refs: ['canonical-source.json#sections.initials'] });
  return slide;
}

function addFinalSlide(pptx, n, value, audioManifest, meta) {
  const slide = pptx.addSlide();
  addHeader(slide, n);
  addLatin(slide, value, 2.0, 2.0, 9.35, 2.8, { fontSize: 138, color: C.ink, bold: true, align: 'center', valign: 'mid' });
  addAudio(slide, '1-4', audioManifest);
  addPageMarker(slide, 'P2');
  const notesText = `韵母 ${value}：播放音频 1-4 中对应的声音，学生先听、指向屏幕，再跟读。需要时比较实际出现的混淆。`;
  slide.addNotes(notesText);
  meta.push({ slide_number: n, student_visible_text: [value, '音频 1-4', '教材 P2'], textbook_page: 'P2', audio: ['1-4'], layout: 'single-sound', speaker_notes: notesText, source_refs: ['canonical-source.json#sections.finals'] });
  return slide;
}

function addListeningChoiceSlide(pptx, n, title, items, page, track, audioManifest, meta, sourceRef) {
  const slide = pptx.addSlide();
  addHeader(slide, n, title);
  addText(slide, '先看每题的声母。听录音，圈出你听到的声母。\n再听一次，检查答案。', 0.9, 1.7, 11.45, 0.74, { fontSize: 25, color: C.teal, bold: true, align: 'center' });
  const fills = [C.mint, C.yellowSoft, C.lilac, C.coralSoft];
  items.forEach((item, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 1.0 + col * 6.02;
    const y = 2.75 + row * 0.78;
    addCard(slide, x, y, 5.45, 0.59, fills[idx % fills.length], `${item.number}．  ${item.options}`, { fontSize: 28, bold: true, align: 'center' });
  });
  addAudio(slide, track, audioManifest);
  addPageMarker(slide, page);
  const visible = ['听力练习', '先看每题的声母。听录音，圈出你听到的声母。', '再听一次，检查答案。', ...items.map((item) => `${item.number}．  ${item.options}`), `音频 ${track}`, `教材 ${page}`];
  const notesText = `学生先独立选择，第一次播放后保留答案；第二次播放后小组比较，再核对教材 ${page}。`;
  slide.addNotes(notesText);
  meta.push({ slide_number: n, student_visible_text: visible, textbook_page: page, audio: [track], layout: 'listening-choice-grid', speaker_notes: notesText, source_refs: [sourceRef] });
  return slide;
}

function addGroupSlide(pptx, n, title, steps, page, meta, sourceRef) {
  const slide = pptx.addSlide();
  addHeader(slide, n, title);
  addText(slide, '按顺序完成下面四步。', 0.98, 1.63, 11.25, 0.42, { fontSize: 26, color: C.teal, bold: true, align: 'center' });
  const fills = [C.mint, C.yellowSoft, C.lilac, C.coralSoft];
  steps.forEach((step, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = 1.03 + col * 6.0;
    const y = 2.34 + row * 1.47;
    slide.addShape('ellipse', { x, y: y + 0.18, w: 0.62, h: 0.62, fill: { color: [C.teal, C.coral, C.purple, C.yellow][idx] }, line: { color: C.white, transparency: 100 } });
    addLatin(slide, String(idx + 1), x, y + 0.32, 0.62, 0.25, { fontSize: 25, color: C.white, bold: true, align: 'center' });
    addCard(slide, x + 0.82, y, 4.98, 1.05, fills[idx], step, { fontSize: 25, bold: true, align: 'left', padX: 0.22 });
  });
  addPageMarker(slide, page);
  const visible = [title, '按顺序完成下面四步。', ...steps, `教材 ${page}`];
  const notesText = `不规定小组人数。巡视时确保每个人都轮到读和写；记录最常见的混淆，最后做一次短重读。`;
  slide.addNotes(notesText);
  meta.push({ slide_number: n, student_visible_text: visible, textbook_page: page, audio: [], layout: 'group-four-steps', speaker_notes: notesText, source_refs: [sourceRef] });
  return slide;
}

async function build() {
  if (!fs.existsSync(REVIEW_DOC)) throw new Error(`Missing approved copy review: ${REVIEW_DOC}`);
  if (!fs.existsSync(SOURCE_REFS)) throw new Error(`Missing source refs: ${SOURCE_REFS}`);
  runDraftGate();
  const assets = await prepareAssets();
  fs.mkdirSync(resolvedOutput, { recursive: true });
  const audioManifest = { used: [] };
  const meta = [];
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = '榮市大學華語聽說課程';
  pptx.company = '榮市大學';
  pptx.subject = '博雅漢語聽說·初級起步篇 I 第一課實體課';
  pptx.title = '第一課｜拼音和日常用語（一）｜實體課';
  pptx.lang = 'zh-CN';
  pptx.theme = { headFontFace: FONT_CJK, bodyFontFace: FONT_CJK, lang: 'zh-CN' };

  // 1. Cover
  {
    const slide = pptx.addSlide();
    slide.background = { color: C.slideBackground };
    slide.addShape('ellipse', { x: 0.0, y: 5.1, w: 5.0, h: 2.4, fill: { color: C.mint, transparency: 18 }, line: { color: C.mint, transparency: 100 } });
    slide.addShape('ellipse', { x: 9.0, y: 0.0, w: 4.2, h: 2.2, fill: { color: C.yellowSoft, transparency: 18 }, line: { color: C.yellowSoft, transparency: 100 } });
    addText(slide, '第1课', 0.95, 1.23, 2.8, 0.62, { fontSize: 32, color: C.teal, bold: true });
    addText(slide, '拼音和日常用语（一）', 0.9, 2.0, 6.7, 1.32, { fontSize: 46, color: C.ink, bold: true, valign: 'mid' });
    addCard(slide, 0.95, 3.75, 2.35, 0.62, C.coral, '实体课', { fontSize: 25, color: C.white, bold: true });
    slide.addImage({ path: assets.greeting, x: 8.3, y: 1.15, w: 3.9, h: 3.1 });
    const notesText = '打开教材 P1–P5，准备笔和笔记本。今天先做声母，再做韵母和声调，最后练习日常用语。';
    slide.addNotes(notesText);
    meta.push({ slide_number: 1, student_visible_text: ['第1课', '拼音和日常用语（一）', '实体课'], textbook_page: null, audio: [], layout: 'cover', speaker_notes: notesText, source_refs: [] });
  }

  // 2. Route
  {
    const slide = pptx.addSlide();
    addHeader(slide, 2, '今天这样学');
    slide.addImage({ path: assets.learningRoute, x: 0.9, y: 0.95, w: 11.55, h: 6.5 });
    // Keep the exact Vietnamese labels inside the generated graphic; the
    // Chinese title remains editable and provides the page's orientation.
    addText(slide, '今天这样学', 0.78, 0.92, 5.2, 0.56, { fontSize: 34, bold: true, valign: 'top' });
    const notesText = '告诉学生：四个图块内的越南文是今天的学习路线；教材题目在书上完成，PPT 只提示现在做哪一项、听几次和怎样核对。';
    slide.addNotes(notesText);
    meta.push({ slide_number: 2, student_visible_text: ['今天这样学', 'Nghe phụ âm', 'Đọc nguyên âm và thanh điệu', 'Luyện tập', 'Chào hỏi bằng tiếng Trung'], textbook_page: null, audio: [], layout: 'learning-route-imagen', speaker_notes: notesText, source_refs: [] });
  }

  // 3. Goals
  {
    const slide = pptx.addSlide();
    addHeader(slide, 3, '本课目标');
    addText(slide, '今天下课前，我能：', 0.98, 1.62, 11.25, 0.5, { fontSize: 29, color: C.teal, bold: true, align: 'center' });
    const goals = ['听出并读出21个声母、6个单韵母。', '听出并读出汉语的一、二、三、四、轻声。', '使用汉语日常用语。'];
    goals.forEach((goal, idx) => {
      const y = 2.32 + idx * 1.18;
      slide.addShape('ellipse', { x: 1.2, y: y + 0.12, w: 0.68, h: 0.68, fill: { color: [C.teal, C.coral, C.purple][idx] }, line: { color: C.white, transparency: 100 } });
      addLatin(slide, String(idx + 1), 1.2, y + 0.31, 0.68, 0.26, { fontSize: 25, color: C.white, bold: true, align: 'center' });
      addCard(slide, 2.15, y, 9.95, 0.92, [C.mint, C.coralSoft, C.lilac][idx], goal, { fontSize: 27, bold: true, align: 'left', padX: 0.26 });
    });
    const notesText = '目标是课堂动作，不是考试分数。学生不会的项目先记录，订正后再读一次。';
    slide.addNotes(notesText);
    meta.push({ slide_number: 3, student_visible_text: ['本课目标', '今天下课前，我能：', ...goals], textbook_page: null, audio: [], layout: 'goals', speaker_notes: notesText, source_refs: [] });
  }

  // 4. Initials section
  addSectionDivider(pptx, 4, '声母', assets.dividerInitials, meta, '进入声母部分。先看图，再进入教材的听辨与听写。');

  const initials = ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'z', 'c', 's', 'zh', 'ch', 'sh', 'r'];
  initials.forEach((value, idx) => addInitialSlide(pptx, idx + 5, value, audioManifest, meta));

  // 26. Initial blending practice from the specified pinyin material.
  {
    const slide = pptx.addSlide();
    addHeader(slide, 26, '声母拼读练习');
    addText(slide, '先读声母，再读韵母，合起来读。', 0.86, 1.55, 8.25, 0.46, { fontSize: 26, color: C.teal, bold: true, align: 'center' });
    const rows = [
      ['', 'a', 'o', 'e', 'i', 'u', 'ü'],
      ['b', 'ba', 'bo', '', 'bi', 'bu', ''],
      ['p', 'pa', 'po', '', 'pi', 'pu', ''],
      ['m', 'ma', 'mo', 'me', 'mi', 'mu', ''],
      ['f', 'fa', 'fo', '', '', 'fu', ''],
    ];
    drawGrid(slide, 0.78, 2.16, [0.9, 1.05, 1.05, 1.05, 1.05, 1.05, 1.05], [0.62, 0.7, 0.7, 0.7, 0.7], rows, { fontSize: 25, latinCells: ['0:1','0:2','0:3','0:4','0:5','0:6','1:0','1:1','1:2','1:4','1:5','2:0','2:1','2:2','2:4','2:5','3:0','3:1','3:2','3:3','3:4','3:5','4:0','4:1','4:2','4:5'] });
    slide.addShape('roundRect', { x: 9.1, y: 1.62, w: 3.3, h: 3.45, rectRadius: 0.1, fill: { color: C.mint, transparency: 15 }, line: { color: C.line, pt: 0.8 } });
    slide.addImage({ path: assets.concept, x: 9.35, y: 2.0, w: 2.8, h: 1.55 });
    addText(slide, '声母 + 韵母 = 音节', 9.28, 3.78, 2.92, 0.42, { fontSize: 25, color: C.teal, bold: true, align: 'center' });
    addText(slide, '按行拼读。', 9.34, 4.35, 2.8, 0.36, { fontSize: 25, bold: true, align: 'center' });
    const notesText = '先指一行，教师示范“声母—韵母—合起来读”，再让学生按行拼读。只使用表中已有音节；这是补充练习，不替代教材 P1 的声母听辨和听写。';
    slide.addNotes(notesText);
    meta.push({ slide_number: 26, student_visible_text: ['声母拼读练习', '先读声母，再读韵母，合起来读。', '声母 + 韵母 = 音节', '按行拼读。'], textbook_page: null, audio: [], layout: 'initial-blending-table', speaker_notes: notesText, source_refs: ['pinyin-01/slides/12-pinyin-practice.html', 'pinyin-01/slides/assets/photos/pinyin-concept-2.png'] });
  }

  addListeningChoiceSlide(pptx, 27, '声母听辨选择 1–4', [
    { number: 1, options: 'b　／　p' }, { number: 2, options: 'd　／　t' }, { number: 3, options: 'n　／　l　／　r' }, { number: 4, options: 'g　／　k　／　h' },
  ], 'P1', '1-2', audioManifest, meta, 'canonical-source.json#sections.initial_listening');
  addListeningChoiceSlide(pptx, 28, '声母听辨选择 5–8', [
    { number: 5, options: 'j　／　zh　／　z' }, { number: 6, options: 'q　／　ch　／　c' }, { number: 7, options: 'x　／　sh　／　s' }, { number: 8, options: 'zh　／　ch　／　sh　／　r' },
  ], 'P1', '1-2', audioManifest, meta, 'canonical-source.json#sections.initial_listening');

  // 29. Dictation merge: only the large action word is shown.
  {
    const slide = pptx.addSlide();
    addHeader(slide, 29);
    addText(slide, '听写', 1.0, 2.0, 11.3, 2.0, { fontSize: 78, bold: true, align: 'center', valign: 'mid' });
    addAudio(slide, '1-3', audioManifest);
    addPageMarker(slide, 'P1');
    const notesText = '请学生直接看教材 P1 的听写练习。播放 1-3，按教材原题分段；学生完成 1–15 项，听完后补写并核对。答案不放在学生画面。';
    slide.addNotes(notesText);
    meta.push({ slide_number: 29, student_visible_text: ['听写', '音频 1-3', '教材 P1'], textbook_page: 'P1', audio: ['1-3'], layout: 'single-action', speaker_notes: notesText, source_refs: ['canonical-source.json#sections.initial_dictation'] });
  }

  addGroupSlide(pptx, 30, '小组练习', [
    '从教材 P1 选择三个声母，轮流读出来。',
    '其他同学听后写在笔记本上。',
    '小组一起核对，读者和听者都改正。',
    '换人，直到每个人都读过一次。',
  ], 'P1', meta, 'canonical-source.json#sections.initial_group');

  addSectionDivider(pptx, 31, '韵母', assets.dividerFinals, meta, '进入韵母部分。先看图，再读六个单韵母和带调读音。');
  ['a', 'o', 'e', 'i', 'u', 'ü'].forEach((value, idx) => addFinalSlide(pptx, idx + 32, value, audioManifest, meta));

  // 38. Tones section divider.
  addSectionDivider(pptx, 38, '声调', assets.dividerTones, meta, '进入声调部分。先看图理解一、二、三、四声和轻声，再做后面的声调练习。');

  // 39. User-provided tone chart; no extra title or embedded audio.
  {
    const slide = pptx.addSlide();
    addHeader(slide, 39);
    // Use the teacher-provided chart directly and keep its original content.
    slide.addImage({ path: assets.toneChart, x: 1.42, y: 0.85, w: 10.5, h: 6.56, transparency: 0 });
    addPageMarker(slide, 'P2');
    const notesText = '本页直接使用教师提供的声调图。请学生先看图，注意一、二、三、四声和轻声的音高走向；再使用教材 P2 的音频或教师示范跟读。';
    slide.addNotes(notesText);
    meta.push({ slide_number: 39, student_visible_text: ['图中越南文声调说明', '教材 P2'], textbook_page: 'P2', audio: [], layout: 'user-provided-tone-chart', speaker_notes: notesText, source_refs: ['canonical-source.json#sections.tones'] });
  }

  // 40. Additional tone discrimination drill.
  {
    const slide = pptx.addSlide();
    addHeader(slide, 40, '加练：听声音，选声调');
    addText(slide, '听老师读。', 1.2, 1.82, 10.9, 0.55, { fontSize: 34, bold: true, align: 'center' });
    addText(slide, '用1、2、3或4根手指表示你听到的声调。', 0.95, 2.72, 11.35, 0.55, { fontSize: 28, color: C.teal, bold: true, align: 'center' });
    [1, 2, 3, 4].forEach((n, idx) => {
      const x = 2.18 + idx * 2.34;
      slide.addShape('ellipse', { x, y: 4.0, w: 1.12, h: 1.12, fill: { color: [C.teal, C.coral, C.purple, C.yellow][idx] }, line: { color: C.white, transparency: 100 } });
      addLatin(slide, String(n), x, 4.3, 1.12, 0.42, { fontSize: 34, color: idx === 3 ? C.ink : C.white, bold: true, align: 'center' });
    });
    addText(slide, '核对后，再读一次。', 3.0, 5.75, 7.35, 0.42, { fontSize: 27, color: C.slate, bold: true, align: 'center' });
    addPageMarker(slide, 'P2');
    const notesText = '教师从 P2 的带调单韵母中选 6 项，逐项朗读。第一轮不做手势提示；全班用手指回答；核对后全班跟读。此页不显示答案。';
    slide.addNotes(notesText);
    meta.push({ slide_number: 40, student_visible_text: ['加练：听声音，选声调', '听老师读。', '用1、2、3或4根手指表示你听到的声调。', '1', '2', '3', '4', '核对后，再读一次。', '教材 P2'], textbook_page: 'P2', audio: [], layout: 'tone-finger-drill', speaker_notes: notesText, source_refs: ['canonical-source.json#sections.tones'] });
  }

  // 41. 24 accented finals on one slide.
  {
    const slide = pptx.addSlide();
    addHeader(slide, 41, '四声朗读');
    addText(slide, '按行听，按行读。', 0.9, 1.53, 11.5, 0.4, { fontSize: 25, color: C.teal, bold: true, align: 'center' });
    const rows = [
      ['a：', 'ā　á　ǎ　à'], ['o：', 'ō　ó　ǒ　ò'], ['e：', 'ē　é　ě　è'],
      ['i：', 'ī　í　ǐ　ì'], ['u：', 'ū　ú　ǔ　ù'], ['ü：', 'ǖ　ǘ　ǚ　ǜ'],
    ];
    rows.forEach((row, idx) => {
      const y = 2.08 + idx * 0.69;
      addCard(slide, 1.55, y, 2.0, 0.5, [C.mint, C.yellowSoft, C.lilac, C.coralSoft][idx % 4], row[0], { fontSize: 27, bold: true });
      addCard(slide, 3.72, y, 7.98, 0.5, idx % 2 ? 'F7FAF9' : C.white, row[1], { fontSize: 29, bold: true, color: C.ink });
    });
    addAudio(slide, '1-6', audioManifest);
    addPageMarker(slide, 'P2');
    const notesText = '按行播放、按行跟读。教师指向当前行，不让学生抢读下一行；这一页完成首轮接触。';
    slide.addNotes(notesText);
    meta.push({ slide_number: 41, student_visible_text: ['四声朗读', '按行听，按行读。', ...rows.map((row) => `${row[0]} ${row[1]}`), '教材 P2'], textbook_page: 'P2', audio: [], layout: 'accented-finals-table', speaker_notes: notesText, source_refs: ['canonical-source.json#sections.accented_finals'] });
  }

  // 42. Supplemental pinyin exercise.
  {
    const slide = pptx.addSlide();
    addHeader(slide, 42, '拼音教材练习：听音选声调');
    addText(slide, '听老师读，选择正确的声调。', 0.95, 1.55, 11.35, 0.45, { fontSize: 25, color: C.teal, bold: true, align: 'center' });
    const items = [
      '1. A. pǒ　B. pō　C. pò　D. pó',
      '2. A. wù　B. wǔ　C. wū　D. wú',
      '3. A. yú　B. yù　C. yǔ　D. yū',
      '4. A. á　B. à　C. ā　D. ǎ',
      '5. A. bì　B. bī　C. bí　D. bǐ',
      '6. A. fǎ　B. fá　C. fà　D. fā',
    ];
    items.forEach((item, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      addCard(slide, 0.86 + col * 6.12, 2.2 + row * 1.03, 5.62, 0.76, row % 2 ? C.white : C.blue, item, { fontSize: 24, bold: true, align: 'left', padX: 0.2 });
    });
    const notesText = '教师逐题朗读，学生独立选择，再由小组比较。答案以补充拼音教材题目版本核对后放在教师备课记录，不放在学生画面；若时间紧，后两题作为备用。';
    slide.addNotes(notesText);
    meta.push({ slide_number: 42, student_visible_text: ['拼音教材练习：听音选声调', '听老师读，选择正确的声调。', ...items], textbook_page: null, audio: [], layout: 'supplemental-tone-choice', speaker_notes: notesText, source_refs: ['pinyin-01/slides/37-tone-choice-practice.html'] });
  }

  addSectionDivider(pptx, 43, '音节听辨和拼写', assets.dividerSyllable, meta, '进入音节听辨和拼写部分。先看图，再做听辨和教材补全。');

  function addSyllableListening(n, title, items) {
    const slide = pptx.addSlide();
    addHeader(slide, n, title);
    addText(slide, '请看教材P3的（二）。', 1.0, 1.55, 11.25, 0.43, { fontSize: 27, color: C.teal, bold: true, align: 'center' });
    items.forEach((item, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 1.02 + col * 6.0;
      const y = 2.18 + row * 0.84;
      addCard(slide, x, y, 5.55, 0.62, row % 2 ? C.white : C.blue, `${item.number}.  ${item.options}`, { fontSize: 26, bold: true });
    });
    addAudio(slide, '1-7', audioManifest);
    addPageMarker(slide, 'P3');
    const notesText = '学生在教材 P3 圈答案。第一次听先选择，第二次检查；不要在播放前逐项带读成答案提示。';
    slide.addNotes(notesText);
    meta.push({ slide_number: n, student_visible_text: [title, '请看教材P3的（二）。', ...items.map((item) => `${item.number}.  ${item.options}`), '音频 1-7', '教材 P3'], textbook_page: 'P3', audio: ['1-7'], layout: 'syllable-listening-grid', speaker_notes: notesText, source_refs: ['canonical-source.json#sections.syllable_listening'] });
  }
  addSyllableListening(44, '音节听辨 1–10', [
    { number: 1, options: 'bā　／　bō' }, { number: 2, options: 'nǐ　／　nǔ' }, { number: 3, options: 'lù　／　nù' }, { number: 4, options: 'gē　／　gū' }, { number: 5, options: 'ná　／　lá' },
    { number: 6, options: 'cū　／　chū' }, { number: 7, options: 'jǔ　／　zhǔ' }, { number: 8, options: 'rè　／　lè' }, { number: 9, options: 'zī　／　zū' }, { number: 10, options: 'sè　／　sù' },
  ]);
  addSyllableListening(45, '音节听辨 11–20', [
    { number: 11, options: 'dà　／　tà' }, { number: 12, options: 'jì　／　qù' }, { number: 13, options: 'kè　／　kù' }, { number: 14, options: 'xū　／　shū' }, { number: 15, options: 'pí　／　pú' },
    { number: 16, options: 'fó　／　fú' }, { number: 17, options: 'mò　／　mù' }, { number: 18, options: 'mǎ　／　nǎ' }, { number: 19, options: 'hù　／　tù' }, { number: 20, options: 'shé　／　shá' },
  ]);

  // 46–48. j/q/x rules, one rule per slide.
  function addJqxRuleSlide(n, label, rule) {
    const slide = pptx.addSlide();
    addHeader(slide, n, '注意事项');
    addText(slide, label, 1.0, 1.63, 11.3, 0.5, { fontSize: 30, color: C.teal, bold: true, align: 'center' });
    addCard(slide, 2.15, 2.45, 9.0, 1.45, C.lilac, rule, { fontSize: 62, color: C.purple, bold: true, align: 'center' });
    addText(slide, '读音还是 ü。', 1.2, 4.45, 10.95, 0.55, { fontSize: 31, color: C.purple, bold: true, align: 'center' });
    addPageMarker(slide, 'P3');
    const notesText = `让学生对照教材 P3 的注意事项，先看 ${rule} 的书写变化，再读出对应读音。三页都强调：j、q、x 后面的 ü 写成 u，但读音还是 ü。`;
    slide.addNotes(notesText);
    meta.push({ slide_number: n, student_visible_text: ['注意事项', label, rule, '读音还是 ü。', '教材 P3'], textbook_page: 'P3', audio: [], layout: 'jqx-rule-single', speaker_notes: notesText, source_refs: ['pinyin-02/slides/37-rule-jqx-umlaut.html', 'canonical-source.json#sections.jqx_rule'] });
  }
  addJqxRuleSlide(46, 'j 后面的 ü 写成 u', 'jü → ju');
  addJqxRuleSlide(47, 'q 后面的 ü 写成 u', 'qü → qu');
  addJqxRuleSlide(48, 'x 后面的 ü 写成 u', 'xü → xu');

  // 49. Completion merge: only textbook reference is shown.
  {
    const slide = pptx.addSlide();
    addHeader(slide, 49);
    addText(slide, '请看教材P3、P4的（三）。', 0.9, 2.45, 11.55, 1.0, { fontSize: 42, bold: true, align: 'center', valign: 'mid' });
    addAudio(slide, '1-8', audioManifest);
    addPageMarker(slide, 'P3–4');
    const notesText = '播放 1-8，按教材四组分段；学生在书上补全全部四组，包括拼音和声调，再核对。不要把未完成内容标为完成。';
    slide.addNotes(notesText);
    meta.push({ slide_number: 49, student_visible_text: ['请看教材P3、P4的（三）。', '教材 P3–4'], textbook_page: 'P3–4', audio: [], layout: 'single-action', speaker_notes: notesText, source_refs: ['canonical-source.json#sections.syllable_completion'] });
  }

  addGroupSlide(pptx, 50, '小组练习', [
    '从教材练习三中选择三个音节，轮流读出来。',
    '其他同学听后写下来。',
    '小组一起核对读音和拼写。',
    '换人，直到每个人都读过一次。',
  ], 'P4', meta, 'canonical-source.json#sections.syllable_completion');

  addSectionDivider(pptx, 51, '日常用语', assets.dividerDaily, meta, '进入日常用语部分。先看图，再把六句话放进简单情景。');

  function addPhraseSlide(n, title, phrases) {
    const slide = pptx.addSlide();
    addHeader(slide, n, title);
    phrases.forEach((phrase, idx) => {
      const y = 1.8 + idx * 1.28;
      addCard(slide, 2.12, y, 9.12, 0.88, [C.mint, C.yellowSoft, C.lilac][idx], `${phrase.number}. ${phrase.text}`, { fontSize: 35, bold: true });
    });
    addAudio(slide, '1-9', audioManifest);
    addPageMarker(slide, 'P4');
    const notesText = '先完整播放，再逐句跟读。教师用动作提示使用场合，不先讲长篇翻译；拼音与轻声以教材 P4 和音频核对。';
    slide.addNotes(notesText);
    meta.push({ slide_number: n, student_visible_text: [title, ...phrases.map((phrase) => `${phrase.number}. ${phrase.text}`), '音频 1-9', '教材 P4'], textbook_page: 'P4', audio: ['1-9'], layout: 'daily-phrase-cards', speaker_notes: notesText, source_refs: ['canonical-source.json#sections.daily_phrases'] });
  }
  addPhraseSlide(52, '日常用语', [{ number: 1, text: '你好' }, { number: 2, text: '谢谢' }, { number: 3, text: '不客气' }]);
  addPhraseSlide(53, '继续日常用语', [{ number: 4, text: '对不起' }, { number: 5, text: '没关系' }, { number: 6, text: '再见' }]);

  // 54. Vietnamese scenario labels, Chinese action.
  {
    const slide = pptx.addSlide();
    addHeader(slide, 54, '加练：看情景，说一句话');
    addText(slide, '先自己说，再和同学交换。', 0.95, 1.55, 11.35, 0.43, { fontSize: 27, color: C.teal, bold: true, align: 'center' });
    const labels = ['Vừa mới gặp nhau', 'Bạn học vừa giúp bạn', 'Bạn làm sai', 'Bạn sắp rời đi'];
    labels.forEach((label, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 1.0 + col * 6.0;
      const y = 2.3 + row * 1.48;
      addCard(slide, x, y, 5.48, 1.06, [C.mint, C.yellowSoft, C.lilac, C.coralSoft][idx], '', {});
      addLatin(slide, `${idx + 1}. ${label}`, x + 0.15, y + 0.23, 5.18, 0.56, { fontSize: 24, color: C.ink, bold: true, align: 'center' });
    });
    addPageMarker(slide, 'P4');
    const notesText = '学生从本课六句日常用语中选择合适表达。每个情景先全班说，再小组交换；越南文标签只是帮助理解场合，不作为新词教学。';
    slide.addNotes(notesText);
    meta.push({ slide_number: 54, student_visible_text: ['加练：看情景，说一句话', '先自己说，再和同学交换。', ...labels.map((label, idx) => `${idx + 1}. ${label}`), '教材 P4'], textbook_page: 'P4', audio: [], layout: 'vietnamese-scenario-cards', speaker_notes: notesText, source_refs: ['canonical-source.json#sections.daily_phrases'] });
  }

  // 55. Pair QA merge: only textbook reference is shown.
  {
    const slide = pptx.addSlide();
    addHeader(slide, 55);
    addText(slide, '请看教材P4、P5的（二）。', 0.9, 2.45, 11.55, 1.0, { fontSize: 42, bold: true, align: 'center', valign: 'mid' });
    addPageMarker(slide, 'P4–5');
    const notesText = '学生按照教材完成四组问答，再交换角色并重新说一遍。教师确认每个小组都实际开口，不提供学生画面上的唯一答案。';
    slide.addNotes(notesText);
    meta.push({ slide_number: 55, student_visible_text: ['请看教材P4、P5的（二）。', '教材 P4–5'], textbook_page: 'P4–5', audio: [], layout: 'single-action', speaker_notes: notesText, source_refs: ['canonical-source.json#sections.daily_pair_qa'] });
  }

  // Playback controls and embedded tracks are disabled for this draft.
  meta.forEach((entry) => {
    entry.student_visible_text = entry.student_visible_text.filter((value) => !/^音频\s/.test(value));
    entry.audio = [];
  });

  if (pptx._slides.length !== 55) throw new Error(`Expected 55 slides, got ${pptx._slides.length}`);
  if (meta.length !== 55) throw new Error(`Expected 55 metadata records, got ${meta.length}`);

  const outputPath = path.join(resolvedOutput, 'lesson-01-实体课-draft-v01.pptx');
  await pptx.writeFile({ fileName: outputPath });

  const storyboardPath = path.join(STORYBOARD_ROOT, 'lesson-01-face-to-face-generated.json');
  writeJson(storyboardPath, {
    schema_version: 'boya-elementary-face-to-face-storyboard-v1',
    lesson_key: LESSON_KEY,
    offering_id: OFFERING_ID,
    title: '拼音和日常用语（一）',
    mode: 'teacher_face_to_face_only',
    source_copy: 'docs/boya-elementary-i-lesson-01-slide-copy-review-2026-09-15.md',
    source_refs: 'lessons/boya-elementary-i/lesson-01/10-design/storyboard/lesson-01-source-refs.csv',
    student_visible_minimum_pt: MIN_VISIBLE_PT,
    slide_count: meta.length,
    slides: meta,
    notes: 'This is a draft storyboard generated alongside the reversible PPTX draft. It is not an approval record.',
  });

  const imageManifest = JSON.parse(fs.readFileSync(IMAGE_MANIFEST, 'utf8'));
  const imageNames = new Map([
    ['learning-route-imagen', 'learning-route-imagen.png'],
    ['tone-chart-user', 'tone-chart-user.png'],
    ['divider-initials-imagen', 'divider-initials-imagen.png'],
    ['divider-finals-imagen', 'divider-finals-imagen.png'],
    ['divider-tones-imagen', 'divider-tones-imagen.png'],
    ['divider-syllable-imagen', 'divider-syllable-imagen.png'],
    ['divider-daily-imagen', 'divider-daily-imagen.png'],
    ['pinyin-concept-2-crop', 'pinyin-concept-2-crop.png'],
    ['pinyin-greeting-crop', 'pinyin-greeting-crop.png'],
  ]);
  imageManifest.assets = imageManifest.assets.map((asset) => ({
    ...asset,
    sha256: sha256(path.join(ASSET_ROOT, imageNames.get(asset.asset_id))),
  }));
  imageManifest.generated_at = '2026-09-15';
  imageManifest.pptx_draft = { path: path.relative(ROOT, outputPath).replaceAll(path.sep, '/'), embedded: true };
  writeJson(IMAGE_MANIFEST, imageManifest);

  const audioRecords = [...new Set(audioManifest.used)].sort().map((track) => {
    const filePath = path.join(SOURCE_AUDIO_ROOT, `${track}.mp3`);
    return { label: track, path: path.relative(ROOT, filePath).replaceAll(path.sep, '/'), bytes: fs.statSync(filePath).size, sha256: sha256(filePath) };
  });
  const draftManifest = {
    schema_version: 'boya-elementary-pptx-draft-v1',
    lesson_key: LESSON_KEY,
    offering_id: OFFERING_ID,
    textbook_id: 'boya-elementary-i',
    lesson_id: 'lesson-01',
    title: '拼音和日常用语（一）',
    mode: 'teacher_face_to_face_only',
    artifact_status: 'draft_generated_not_approved',
    output: path.relative(ROOT, outputPath).replaceAll(path.sep, '/'),
    slide_count: 55,
    slide_copy_source: path.relative(ROOT, REVIEW_DOC).replaceAll(path.sep, '/'),
    slide_copy_source_sha256: sha256(REVIEW_DOC),
    storyboard: path.relative(ROOT, storyboardPath).replaceAll(path.sep, '/'),
    student_visible_minimum_pt: MIN_VISIBLE_PT,
    textbook_page_marker_policy: 'All slides using Boya textbook content carry the printed textbook page marker; supplemental pinyin pages are marked as supplemental and have no Boya marker.',
    audio: { embedded_tracks: audioRecords, semantic_status: 'pending_teacher_listening', powerpoint_playback_status: 'pending_teacher_playback' },
    images: { embedded_assets: imageManifest.assets.map((asset) => ({ asset_id: asset.asset_id, file: asset.file, sha256: asset.sha256 })) },
    open_gates: ['semantic audio listening', 'PowerPoint playback', 'teacher rehearsal', 'Adam authority approval'],
    sha256: sha256(outputPath),
  };
  writeJson(path.join(resolvedOutput, 'lesson-01-实体课-draft-v01-manifest.json'), draftManifest);

  console.log(JSON.stringify({ output: outputPath, slides: 55, storyboard: storyboardPath, embedded_audio_tracks: audioRecords.length, embedded_image_assets: imageManifest.assets.length, sha256: draftManifest.sha256 }, null, 2));
}

build().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
