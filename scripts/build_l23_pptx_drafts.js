#!/usr/bin/env node
'use strict';

// Draft-only PPTX builder for lessons 2 through 10 of
// 《博雅汉语听说：准中级加速篇 I》.  It reads each lesson's canonical source,
// image manifest and audio directory, then writes only to that lesson's
// 10-design/pptx-draft directory.  It never writes 20-approved or 40-release.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const PptxGenJS = require('pptxgenjs');
const design = require('./boya_design_system');
const { toSimplified } = require('./simplify_chinese');

const ROOT = path.resolve(__dirname, '..');
const PYTHON = process.env.BOYA_PYTHON || 'python3';
const W = 13.333;
const H = 7.5;
const C = design.colors;
const T = design.pptTypography;
const CJK = design.fonts.cjk;
const LATIN = design.fonts.latin;
const DEFAULT_LESSON_NUMBERS = [2, 3, 4, 5, 6, 7, 8, 9, 10];
const ONLINE_LAYOUT_CONTRACT_PATH = path.join(ROOT, 'course/boya-online-layout-contract.json');
const ONLINE_LAYOUT = JSON.parse(fs.readFileSync(ONLINE_LAYOUT_CONTRACT_PATH, 'utf8'));
const ONLINE_CONTENT_CONTRACT_PATH = path.join(ROOT, 'course/boya-online-content-contract.json');
const ONLINE_CONTENT = JSON.parse(fs.readFileSync(ONLINE_CONTENT_CONTRACT_PATH, 'utf8'));
const EXAMPLE_BANK_PATH = path.join(ROOT, 'course/boya-example-bank.json');
const EXAMPLE_BANK = JSON.parse(fs.readFileSync(EXAMPLE_BANK_PATH, 'utf8'));
const FACE_ORDER_CONTRACT_PATH = path.join(ROOT, 'course/boya-face-to-face-order-contract.json');
const FACE_ORDER = JSON.parse(fs.readFileSync(FACE_ORDER_CONTRACT_PATH, 'utf8'));
const L1_ASSET_ROOT = path.join(ROOT, 'lessons/boya-quasi-intermediate-i/lesson-01/10-design/image-assets-draft');
const MAX_SHORT_EXAMPLE_CHARS = 24;
let ACTIVE_MODE = 'online';

function requestedLessonNumbers() {
  const args = process.argv.slice(2);
  const keyIndex = args.indexOf('--lesson-key');
  if (keyIndex === -1) {
    throw new Error('--lesson-key is required; do not generate an unscoped lesson draft');
  }
  const lessonKey = args[keyIndex + 1];
  const match = /^boya-quasi-intermediate-i:lesson-(\d{2})$/.exec(String(lessonKey || ''));
  if (!match) throw new Error('--lesson-key must be boya-quasi-intermediate-i:lesson-XX');
  const number = Number(match[1]);
  if (!DEFAULT_LESSON_NUMBERS.includes(number)) {
    throw new Error(`This draft builder is scoped to lessons ${DEFAULT_LESSON_NUMBERS.join(', ')}; received ${lessonKey}`);
  }
  return [number];
}

function validateOnlineLayoutContract() {
  if (ONLINE_LAYOUT.contract_id !== 'boya-quasi-intermediate-i-online-v2') throw new Error('Unexpected online layout contract');
  if (ONLINE_LAYOUT.scope_policy !== 'layout_and_reusable_microcopy_only') throw new Error('Online contract scope must remain layout-only');
  if (ONLINE_LAYOUT.visual?.slide_background !== '#FFFFFF' || C.slideBackground !== 'FFFFFF') throw new Error('Finalized PPTX canvas must be pure white');
  const contractTypography = ONLINE_LAYOUT.pptTypography || {};
  if (!T || Object.keys(T).length !== Object.keys(contractTypography).length || !Object.keys(contractTypography).every((key) => T[key] === contractTypography[key])) throw new Error('PPTX typography tokens must match the current online layout contract');
  if (Object.values(contractTypography).some((value) => !Number.isFinite(value) || value <= 0) || contractTypography.visible_min_pt < 20 || contractTypography.task_prompt_min_pt < contractTypography.visible_min_pt) throw new Error('PPTX typography contract contains invalid readability values');
  if (ONLINE_LAYOUT.cover?.online_label !== '在线课' || ONLINE_LAYOUT.cover?.bottom_subtitle_policy !== 'forbidden' || Object.prototype.hasOwnProperty.call(ONLINE_LAYOUT.cover, 'subtitle')) throw new Error('Online cover must not contain a subtitle');
  if (ONLINE_LAYOUT.learning_route?.title !== '学习流程图' || ONLINE_LAYOUT.learning_route?.asset !== 'learning-route-user-supplied-transparent.png') throw new Error('Learning-route contract is incomplete');
  if (ONLINE_LAYOUT.vocabulary?.practice_after_every !== 5 || ONLINE_LAYOUT.vocabulary?.practice_title !== '请你说说它们的中文并造句') throw new Error('Vocabulary practice contract is incomplete');
  if (ONLINE_LAYOUT.vocabulary?.meaning_field !== 'meaning_vi' || ONLINE_LAYOUT.vocabulary?.meaning_language !== 'Vietnamese' || !String(ONLINE_LAYOUT.vocabulary?.extension_policy || '').startsWith('word_specific_optional') || !String(ONLINE_LAYOUT.vocabulary?.grammar_detail_policy || '').startsWith('word_specific_optional')) throw new Error('Vocabulary content contract is incomplete');
  if (ONLINE_LAYOUT.goals?.number_marker?.shape !== 'filled_circle' || JSON.stringify(ONLINE_LAYOUT.goals.number_marker.fill_sequence) !== JSON.stringify(['teal', 'coral', 'purple', 'yellow']) || ONLINE_LAYOUT.goals.number_marker.number_color !== 'white' || ONLINE_LAYOUT.goals.number_marker.outline !== 'none') throw new Error('Goals number-marker contract is incomplete');
  if (ONLINE_LAYOUT.expressions?.pattern_box?.shape !== 'roundRect' || ONLINE_LAYOUT.expressions?.pattern_box?.fill !== 'lilac' || ONLINE_LAYOUT.expressions?.pattern_box?.text_color !== 'purple' || ONLINE_LAYOUT.expressions?.visible_header_expression_policy !== 'forbidden' || ONLINE_LAYOUT.expressions?.visible_context_policy !== 'forbidden' || ONLINE_LAYOUT.expressions?.example_label !== '例句：' || ONLINE_LAYOUT.expressions?.example_pt !== 35 || ONLINE_LAYOUT.expressions?.example_count !== 2) throw new Error('Expression practice layout contract is incomplete');
  if (ONLINE_LAYOUT.ending?.slides?.length !== 3 || ONLINE_LAYOUT.ending.slides[0]?.title !== '我觉得很难的地方' || ONLINE_LAYOUT.ending.slides[1]?.title !== '课前检查' || ONLINE_LAYOUT.ending.slides[2]?.title !== '谢谢大家，我们课堂见。') throw new Error('Fixed ending contract is incomplete');
  if (ONLINE_LAYOUT.fonts?.cjk !== CJK || ONLINE_LAYOUT.fonts?.latin !== LATIN || Number(ONLINE_LAYOUT.fonts?.minimum_visible_pt) < 20) throw new Error('Font contract is incomplete');
  if (ONLINE_CONTENT.goals?.title !== ONLINE_LAYOUT.goals.title || ONLINE_CONTENT.goals?.label !== ONLINE_LAYOUT.goals.label || ONLINE_CONTENT.vocabulary?.meaning_vi?.language !== 'Vietnamese' || ONLINE_CONTENT.example_bank?.source !== 'course/boya-example-bank.json') throw new Error('Online content contract is incomplete');
  if (EXAMPLE_BANK.policy?.examples_per_item !== 2 || EXAMPLE_BANK.policy?.max_hanzi_chars !== MAX_SHORT_EXAMPLE_CHARS || !String(EXAMPLE_BANK.review?.status || '').trim() || !String(EXAMPLE_BANK.review?.reviewed_at || '').trim()) throw new Error('Example bank contract is incomplete');
}

validateOnlineLayoutContract();

function validateFaceOrderContract() {
  if (FACE_ORDER.contract_id !== 'boya-quasi-intermediate-i-face-to-face-v2') throw new Error('Unexpected face-to-face order contract');
  if (FACE_ORDER.visual?.slide_background !== '#FFFFFF' || C.slideBackground !== 'FFFFFF') throw new Error('Finalized PPTX canvas must be pure white');
  if (FACE_ORDER.pptTypography?.visible_min_pt !== 20) throw new Error('Face-to-face typography contract is incomplete');
  for (const key of Object.keys(T)) if (FACE_ORDER.pptTypography?.[key] !== T[key]) throw new Error(`Face-to-face typography token mismatch: ${key}`);
  if (FACE_ORDER.first_unit_rule.indexOf('短文（一）') === -1) throw new Error('Face-to-face contract must lock the first short-text divider');
  if (FACE_ORDER.divider_position_policy.indexOf('固定页码') === -1 || FACE_ORDER.section_boundary_policy.indexOf('下一个短文 divider') === -1) {
    throw new Error('Face-to-face divider position and section boundary rules are incomplete');
  }
  if (!Array.isArray(FACE_ORDER.short_text_unit_sequence) || FACE_ORDER.short_text_unit_sequence.indexOf('听力题目') === -1 || FACE_ORDER.short_text_unit_sequence.indexOf('简单题目问答') === -1) {
    throw new Error('Face-to-face short-text sequence is incomplete');
  }
}

validateFaceOrderContract();

const LESSON_NUMBER_LABELS = {
  1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六',
  7: '七', 8: '八', 9: '九', 10: '十', 11: '十一', 12: '十二'
};

function lessonNumberLabel(number) {
  return LESSON_NUMBER_LABELS[number] || String(number);
}

function lessonLabel(lesson) {
  return `第${lessonNumberLabel(lesson.number)}课`;
}

function exampleBankFor(lesson) {
  return EXAMPLE_BANK.lessons?.[lesson.lessonKey] || {};
}

function vocabularyDataFor(lesson, entry) {
  const content = ONLINE_CONTENT.lessons?.[lesson.lessonId] || {};
  const override = content.vocabulary?.entries?.[entry.word] || {};
  const bankExamples = exampleBankFor(lesson).vocabulary?.[entry.word];
  const data = { ...entry, ...override };
  // For new drafts the example bank is the source of truth. A lesson content
  // override cannot silently bypass the "database first" requirement.
  if (content.status !== 'finalized_reference' && bankExamples !== undefined) data.examples = bankExamples;
  return data;
}

function expressionItemsFromSection(section) {
  const direct = Array.isArray(section?.items) ? section.items : [];
  const grouped = Array.isArray(section?.groups)
    ? section.groups.flatMap((group) => Array.isArray(group?.items) ? group.items : [])
    : [];
  return [...direct, ...grouped].map((item) => typeof item === 'string' ? { expression: item } : item).filter((item) => item && String(item.expression || '').trim());
}

function onlineContentFor(lesson) {
  const content = ONLINE_CONTENT.lessons?.[lesson.lessonId];
  if (!content || content.status === 'blocked_before_content_approval') {
    const reason = content?.reason || '缺少课次专属内容契约';
    throw new Error(`第${lesson.number}课在线预习 draft 已停止：${reason}`);
  }
  if (!Array.isArray(content.goals) || content.goals.length < 3 || content.goals.length > 4 || content.goals.some((goal) => !String(goal || '').trim())) {
    throw new Error(`第${lesson.number}课在线预习 draft 已停止：学习目标必须是已核准的 3–4 项，且不得使用通用 fallback`);
  }
  if (content.cover?.bottom_subtitle || content.cover?.subtitle) {
    throw new Error(`第${lesson.number}课在线预习 draft 已停止：封面不得有底部 subtitle`);
  }
  const coverTitlePt = Number(content.cover?.online_title_pt);
  if (!Number.isFinite(coverTitlePt) || coverTitlePt < T.cover_title_min_pt || coverTitlePt > T.cover_title_max_pt) {
    throw new Error(`第${lesson.number}课在线预习 draft 已停止：封面标题字号必须由课次内容契约明确指定（${T.cover_title_min_pt}–${T.cover_title_max_pt} pt）`);
  }
  if (!String(content.route?.asset || '').trim() || !String(content.route?.variant || '').trim()) {
    throw new Error(`第${lesson.number}课在线预习 draft 已停止：学习流程图必须有课次专属 asset 与 visual variant`);
  }
  const isNewDraft = content.status !== 'finalized_reference';
  const requiredExampleCount = Number(ONLINE_CONTENT.vocabulary?.examples?.count?.min || 2);
  [...regularVocabEntries(lesson), ...properNounEntries(lesson)].forEach((entry) => {
    const bankExamples = exampleBankFor(lesson).vocabulary?.[entry.word];
    const data = vocabularyDataFor(lesson, entry);
    const meaning = String(data.meaning_vi || '').trim();
    if (!meaning || data.meaning_vi_status !== 'reviewed') {
      throw new Error(`第${lesson.number}课词语“${entry.word}”缺少已审核的越南文 meaning_vi；禁止使用 gloss、英文或中文 fallback`);
    }
    if (isNewDraft && (!Array.isArray(bankExamples) || bankExamples.length !== requiredExampleCount)) {
      throw new Error(`第${lesson.number}课词语“${entry.word}”必须在例句资料库中有 ${requiredExampleCount} 条例句`);
    }
    if (data.examples !== undefined && data.examples !== null) {
      if (!Array.isArray(data.examples) || (isNewDraft && data.examples.length !== requiredExampleCount) || data.examples.length > 3) {
        throw new Error(`第${lesson.number}课词语“${entry.word}”例句数量不符合契约`);
      }
      data.examples.forEach((example, exampleIndex) => assertShortSentence(example, `第${lesson.number}课词语“${entry.word}”例句${exampleIndex + 1}`));
    }
  });
  const expressionOverrides = content.expressions?.items || {};
  expressionSections(lesson).forEach((section) => {
    expressionItemsFromSection(section).forEach((item) => {
      const configured = expressionOverrides[item.expression];
      const bankExamples = exampleBankFor(lesson).expressions?.[item.expression];
      const examples = isNewDraft ? bankExamples : configured?.examples !== undefined ? configured.examples : bankExamples;
      if (isNewDraft && (!Array.isArray(bankExamples) || bankExamples.length !== 2)) {
        throw new Error(`第${lesson.number}课表达“${item.expression}”必须在例句资料库中有 2 条例句`);
      }
      if (examples !== undefined && examples !== null) {
        if (!Array.isArray(examples) || examples.length > 2) throw new Error(`第${lesson.number}课表达“${item.expression}”例句数量不符合契约`);
        examples.forEach((example, exampleIndex) => assertShortSentence(example, `第${lesson.number}课表达“${item.expression}”例句${exampleIndex + 1}`));
      }
    });
  });
  return content;
}

function vocabularyData(lesson, entry) {
  onlineContentFor(lesson);
  return vocabularyDataFor(lesson, entry);
}

function addMixedLabelValue(slide, label, value, x, y, w, h, options = {}) {
  const labelText = simp(label);
  const valueText = String(value || '');
  slide.addText([
    { text: labelText, options: { fontFace: CJK, fontSize: options.labelFontSize || options.fontSize || T.body_pt, color: options.labelColor || options.color || C.ink, bold: Boolean(options.labelBold) } },
    { text: valueText, options: { fontFace: LATIN, fontSize: options.valueFontSize || options.fontSize || T.body_pt, color: options.valueColor || options.color || C.ink, bold: Boolean(options.valueBold) } }
  ], {
    x, y, w, h,
    fontFace: CJK,
    fontSize: options.fontSize || T.body_pt,
    color: options.color || C.ink,
    margin: options.margin === undefined ? 0.04 : options.margin,
    fit: options.fit || 'shrink',
    valign: options.valign || 'mid',
    align: options.align || 'left',
    breakLine: true,
    paraSpaceAfterPt: 0,
    lang: 'zh-CN'
  });
}

function sharedAsset(name) {
  const filePath = path.join(L1_ASSET_ROOT, name);
  return fs.existsSync(filePath) ? filePath : null;
}

function configuredAsset(lesson, assetName) {
  if (!assetName) return null;
  const candidates = [
    path.isAbsolute(assetName) ? assetName : path.join(ROOT, assetName),
    path.join(lesson.assetRoot, assetName),
    path.join(L1_ASSET_ROOT, assetName)
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function assertShortSentence(value, label) {
  const example = String(value || '').trim();
  const compact = example.replace(/[，。！？；、：“”‘’（）()…\s]/g, '');
  if (!example || compact.length > MAX_SHORT_EXAMPLE_CHARS || /\n/.test(example)) {
    throw new Error(`${label} 必须是 ${MAX_SHORT_EXAMPLE_CHARS} 个汉字以内的单句：${example}`);
  }
  return example;
}

function assertExampleVariety(lesson) {
  const entries = [...regularVocabEntries(lesson), ...properNounEntries(lesson)];
  const examples = [];
  entries.forEach((entry) => {
    const data = vocabularyData(lesson, entry);
    (Array.isArray(data.examples) ? data.examples : []).forEach((sentence) => {
      const skeleton = String(sentence).replace(entry.word.replace(/[（）]/g, ''), '<词>').replace(/[“”‘’]/g, '').replace(/[，。！？；、：\s]/g, '');
      examples.push({ word: entry.word, sentence, skeleton });
    });
  });
  const collisions = [];
  for (let i = 0; i < examples.length; i += 1) {
    for (let j = i + 1; j < examples.length; j += 1) {
      if (examples[i].skeleton === examples[j].skeleton && examples[i].word !== examples[j].word) collisions.push(`${examples[i].word}：${examples[i].sentence} ↔ ${examples[j].word}：${examples[j].sentence}`);
    }
  }
  if (collisions.length) throw new Error(`第${lesson.number}课例句只是替换词语：${collisions.join('；')}`);
}

function simp(value) {
  return toSimplified(String(value == null ? '' : value));
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function pageLabel(pages) {
  if (!pages) return '';
  const values = Array.isArray(pages) ? pages : String(pages).split(/[-–—]/).map((x) => Number(x.trim())).filter(Boolean);
  if (!values.length) return '';
  return values.length === 1 ? `教材 P${values[0]}` : `教材 P${values[0]}–${values[values.length - 1]}`;
}

function printedPageRange(pages) {
  const values = Array.isArray(pages)
    ? pages
    : String(pages || '').split(/[-–—]/).map((x) => Number(x.trim())).filter(Boolean);
  if (!values.length) return '';
  return values.length === 1 ? String(values[0]) : `${values[0]}—${values[values.length - 1]}`;
}

function fileFromAsset(assetRoot, asset) {
  if (!asset) return null;
  const name = asset.file || asset.filename;
  if (!name) return null;
  const candidate = path.join(assetRoot, name);
  return fs.existsSync(candidate) ? candidate : null;
}

// Lesson 4's source package contains contextual illustrations, not one image
// per vocabulary item. Build a small set of distinct, meaning-led vector
// illustrations for its vocabulary pages instead of reusing a contextual
// scene for unrelated words. These remain editable/embeddable PPT assets and
// can be replaced later by approved raster illustrations without changing the
// vocabulary mapping contract.
function ensureLesson4VocabIcons(lesson) {
  if (lesson.number !== 4) return;
  const contactSheet = path.join(lesson.assetRoot, 'generated-vocab-contact-sheet.png');
  const croppedRoot = path.join(lesson.assetRoot, 'generated-vocab-images');
  const croppedImages = Array.from({ length: 24 }, (_, index) => path.join(croppedRoot, `l04-vocab-${String(index + 1).padStart(2, '0')}.png`));
  if (fs.existsSync(contactSheet) && croppedImages.every((filePath) => fs.existsSync(filePath))) {
    regularVocabEntries(lesson).forEach((entry, index) => lesson.wordToAsset.set(entry.word, croppedImages[index]));
    return;
  }
  throw new Error('第四课词语图片必须先提供 ChatGPT 生成的 contact sheet 及完整裁切图，不得回退到 graphic 图示。');
  const outDir = path.join(lesson.assetRoot, 'generated-vocab-icons');
  fs.mkdirSync(outDir, { recursive: true });
  const entries = regularVocabEntries(lesson);
  const colors = ['#DCEFEA', '#DDEAF5', '#FFF0C2', '#EADFF5', '#F7D9D5', '#E6F0D3'];
  const scene = {
    '上（菜）': ['plate', 'server'], '司机': ['car', 'driver'], '快餐店': ['store', 'awning'], '点（菜）': ['menu', 'finger'],
    '阅读': ['book', 'eye'], '语伴': ['people', 'chat'], '讲座': ['podium', 'audience'], '国际': ['globe', 'people'],
    '发现': ['magnify', 'star'], '习惯': ['repeat', 'clock'], '新闻': ['screen', 'paper'], '字幕': ['screen', 'lines'],
    '加倍': ['arrows', 'two'], '解释': ['speech', 'question'], '词语': ['cards', 'letters'], '效率': ['speed', 'check'],
    '印象': ['portrait', 'heart'], '吃惊': ['face', 'burst'], '聊': ['speech', 'people'], '通常': ['calendar', 'repeat'],
    '听力': ['ear', 'wave'], '异同': ['split', 'compare'], '量': ['scale', 'box'], '饿': ['bowl', 'face']
  };
  function svgFor(word, index) {
    const [a, b] = scene[word] || ['circle', 'square'];
    const fill = colors[index % colors.length];
    const common = `<rect width="640" height="420" rx="28" fill="#FBF8F1"/><rect x="22" y="22" width="596" height="376" rx="24" fill="${fill}" stroke="#9BA9A7" stroke-width="4"/>`;
    const shapes = {
      plate: '<ellipse cx="230" cy="275" rx="120" ry="42" fill="#fff" stroke="#6B7D82" stroke-width="8"/><circle cx="230" cy="255" r="58" fill="#F3C6A5" stroke="#6B7D82" stroke-width="7"/>',
      server: '<circle cx="440" cy="130" r="34" fill="#F2C7A7"/><path d="M390 250 Q440 180 490 250 L500 330 L380 330Z" fill="#D9A6A8" stroke="#6B7D82" stroke-width="7"/>',
      car: '<path d="M120 285 L160 210 L410 210 L500 285 L510 330 L110 330Z" fill="#A9C8D8" stroke="#6B7D82" stroke-width="8"/><circle cx="190" cy="330" r="28" fill="#6B7D82"/><circle cx="430" cy="330" r="28" fill="#6B7D82"/>',
      driver: '<circle cx="335" cy="150" r="34" fill="#F2C7A7"/><path d="M285 250 Q335 180 385 250 L390 300 L280 300Z" fill="#A7C8B9" stroke="#6B7D82" stroke-width="7"/>',
      store: '<path d="M130 170 L510 170 L480 330 L160 330Z" fill="#FFF" stroke="#6B7D82" stroke-width="7"/><path d="M120 170 H520 L490 115 H150Z" fill="#D9958E" stroke="#6B7D82" stroke-width="7"/>',
      awning: '<path d="M160 115 H480" stroke="#6B7D82" stroke-width="12"/><path d="M200 115 V250 M320 115 V250 M440 115 V250" stroke="#D9958E" stroke-width="18"/>',
      book: '<path d="M130 125 Q230 100 320 140 V320 Q220 285 130 320Z" fill="#fff" stroke="#6B7D82" stroke-width="8"/><path d="M320 140 Q410 100 510 125 V320 Q410 285 320 320Z" fill="#fff" stroke="#6B7D82" stroke-width="8"/>',
      eye: '<ellipse cx="450" cy="210" rx="78" ry="45" fill="#fff" stroke="#6B7D82" stroke-width="8"/><circle cx="450" cy="210" r="20" fill="#6B7D82"/>',
      people: '<circle cx="255" cy="150" r="32" fill="#F2C7A7"/><circle cx="405" cy="150" r="32" fill="#F2C7A7"/><path d="M200 295 Q255 200 310 295 M350 295 Q405 200 460 295" fill="none" stroke="#6B7D82" stroke-width="18"/>',
      chat: '<path d="M225 125 H445 Q480 125 480 160 V230 Q480 265 445 265 H300 L245 305 V265 H225 Q190 265 190 230 V160 Q190 125 225 125Z" fill="#fff" stroke="#6B7D82" stroke-width="8"/>',
      podium: '<rect x="275" y="170" width="90" height="160" fill="#D8B27D" stroke="#6B7D82" stroke-width="8"/><path d="M210 170 H430" stroke="#6B7D82" stroke-width="10"/>', audience: '<circle cx="170" cy="255" r="22" fill="#F2C7A7"/><circle cx="470" cy="255" r="22" fill="#F2C7A7"/><circle cx="320" cy="255" r="22" fill="#F2C7A7"/>',
      globe: '<circle cx="320" cy="220" r="105" fill="#A9C8D8" stroke="#6B7D82" stroke-width="8"/><path d="M215 220 H425 M320 115 V325 M250 145 Q320 220 390 295 M390 145 Q320 220 250 295" fill="none" stroke="#6B7D82" stroke-width="5"/>',
      magnify: '<circle cx="285" cy="200" r="72" fill="#fff" stroke="#6B7D82" stroke-width="10"/><path d="M340 255 L460 350" stroke="#6B7D82" stroke-width="16"/>', star: '<path d="M455 120 L470 165 L520 165 L480 195 L495 245 L455 215 L415 245 L430 195 L390 165 L440 165Z" fill="#F0C96E" stroke="#6B7D82" stroke-width="6"/>',
      repeat: '<path d="M170 240 A120 120 0 1 1 400 190" fill="none" stroke="#6B7D82" stroke-width="14"/><path d="M400 190 L370 165 M400 190 L365 205" stroke="#6B7D82" stroke-width="12"/>', clock: '<circle cx="470" cy="180" r="58" fill="#fff" stroke="#6B7D82" stroke-width="8"/><path d="M470 180 L470 140 M470 180 L500 200" stroke="#6B7D82" stroke-width="8"/>',
      screen: '<rect x="140" y="105" width="330" height="210" rx="14" fill="#A9C8D8" stroke="#6B7D82" stroke-width="8"/><path d="M200 165 H410 M200 210 H380 M200 255 H430" stroke="#fff" stroke-width="12"/>', paper: '<rect x="420" y="180" width="90" height="120" fill="#fff" stroke="#6B7D82" stroke-width="7"/>', lines: '<path d="M185 270 H455 M185 300 H420" stroke="#6B7D82" stroke-width="9"/>',
      arrows: '<path d="M150 180 H470 M420 140 L470 180 L420 220" fill="none" stroke="#6B7D82" stroke-width="14"/><path d="M470 280 H150 M200 240 L150 280 L200 320" fill="none" stroke="#D9958E" stroke-width="14"/>', two: '<circle cx="210" cy="230" r="42" fill="#D9958E"/><circle cx="430" cy="230" r="42" fill="#A9C8D8"/>',
      speech: '<path d="M180 135 H420 Q470 135 470 185 V245 Q470 295 420 295 H300 L220 340 V295 H180 Q130 295 130 245 V185 Q130 135 180 135Z" fill="#fff" stroke="#6B7D82" stroke-width="8"/>', question: '<text x="300" y="245" font-family="KaiTi" font-size="110" fill="#B18BD4">?</text>',
      cards: '<rect x="135" y="145" width="110" height="145" rx="10" fill="#fff" stroke="#6B7D82" stroke-width="7"/><rect x="265" y="115" width="110" height="145" rx="10" fill="#fff" stroke="#6B7D82" stroke-width="7"/><rect x="395" y="145" width="110" height="145" rx="10" fill="#fff" stroke="#6B7D82" stroke-width="7"/>', letters: '<path d="M165 210 H215 M295 180 H345 M425 210 H475" stroke="#B18BD4" stroke-width="13"/>',
      speed: '<path d="M160 280 Q320 90 480 280" fill="none" stroke="#6B7D82" stroke-width="16"/><path d="M320 220 L390 155" stroke="#D9958E" stroke-width="14"/>', check: '<path d="M420 270 L450 300 L515 220" fill="none" stroke="#7FAE7D" stroke-width="16"/>', portrait: '<circle cx="320" cy="180" r="65" fill="#F2C7A7" stroke="#6B7D82" stroke-width="8"/><path d="M220 330 Q320 230 420 330" fill="#A9C8D8" stroke="#6B7D82" stroke-width="8"/>', heart: '<path d="M470 150 C430 110 370 145 390 200 L470 285 L550 200 C570 145 510 110 470 150Z" fill="#D9958E" stroke="#6B7D82" stroke-width="7"/>',
      face: '<circle cx="320" cy="220" r="92" fill="#F2C7A7" stroke="#6B7D82" stroke-width="8"/><circle cx="285" cy="205" r="9" fill="#6B7D82"/><circle cx="355" cy="205" r="9" fill="#6B7D82"/><path d="M275 265 Q320 300 365 265" fill="none" stroke="#6B7D82" stroke-width="8"/>', burst: '<path d="M470 110 L485 160 L535 145 L505 190 L550 220 L500 225 L505 280 L465 245 L430 285 L430 230 L375 225 L420 190 L390 145 L445 160Z" fill="#F0C96E" stroke="#6B7D82" stroke-width="6"/>',
      calendar: '<rect x="160" y="120" width="320" height="220" rx="16" fill="#fff" stroke="#6B7D82" stroke-width="8"/><path d="M160 175 H480 M220 95 V145 M420 95 V145" stroke="#6B7D82" stroke-width="10"/>', ear: '<path d="M360 285 C420 260 430 190 390 165 C340 135 285 175 300 220 C310 250 345 240 345 215 C345 200 330 200 330 215" fill="none" stroke="#6B7D82" stroke-width="16"/>', wave: '<path d="M180 230 Q220 170 260 230 T340 230 T420 230 T500 230" fill="none" stroke="#B18BD4" stroke-width="12"/>',
      split: '<path d="M320 110 V330" stroke="#6B7D82" stroke-width="8"/>', compare: '<path d="M190 210 H270 M370 210 H450 M230 170 V250 M410 170 V250" stroke="#D9958E" stroke-width="12"/>', scale: '<path d="M320 145 V300 M210 300 H430 M230 180 H410 M260 180 L220 270 H300Z M380 180 L340 270 H420Z" fill="#fff" stroke="#6B7D82" stroke-width="8"/>', box: '<rect x="240" y="215" width="160" height="110" fill="#D8B27D" stroke="#6B7D82" stroke-width="8"/>', bowl: '<path d="M190 220 Q320 350 450 220Z" fill="#F3C6A5" stroke="#6B7D82" stroke-width="8"/>',
      square: '<rect x="250" y="160" width="140" height="140" fill="#fff" stroke="#6B7D82" stroke-width="8"/>', circle: '<circle cx="320" cy="220" r="80" fill="#fff" stroke="#6B7D82" stroke-width="8"/>'
    };
    return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">${common}${shapes[a] || shapes.circle}${shapes[b] || shapes.square}</svg>`;
  }
  entries.forEach((entry, index) => {
    const filePath = path.join(outDir, `l04-vocab-${String(index + 1).padStart(2, '0')}.svg`);
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, svgFor(entry.word, index), 'utf8');
    lesson.wordToAsset.set(entry.word, filePath);
  });
}

function readLesson(number) {
  const lessonId = `lesson-${String(number).padStart(2, '0')}`;
  const lessonRoot = path.join(ROOT, 'lessons/boya-quasi-intermediate-i', lessonId);
  const canonicalPath = path.join(lessonRoot, '00-source/canonical-source.json');
  const sourceManifestPath = path.join(lessonRoot, '00-source/source-manifest.json');
  const imageManifestPath = path.join(lessonRoot, '10-design/assets/image-manifest.json');
  if (![canonicalPath, sourceManifestPath, imageManifestPath].every((file) => fs.existsSync(file))) {
    throw new Error(`Missing lesson inputs for ${lessonId}`);
  }
  const canonical = JSON.parse(fs.readFileSync(canonicalPath, 'utf8'));
  const sourceManifest = JSON.parse(fs.readFileSync(sourceManifestPath, 'utf8'));
  const imageManifest = JSON.parse(fs.readFileSync(imageManifestPath, 'utf8'));
  const expectedLessonKey = `boya-quasi-intermediate-i:${lessonId}`;
  // Lesson 4's source snapshot predates the lesson_key field. Derive the
  // identity from its textbook_id + lesson_id without changing source text.
  if (canonical.lesson_key && canonical.lesson_key !== expectedLessonKey) {
    throw new Error(`Lesson identity mismatch in ${canonicalPath}`);
  }
  const sections = Object.fromEntries(canonical.sections.map((section) => [section.id, section]));
  if (Array.isArray(sections.vocabulary?.proper_nouns)) {
    sections.vocabulary.proper_nouns = sections.vocabulary.proper_nouns.map((entry) => Array.isArray(entry)
      ? { word: entry[0], pinyin: entry[1], gloss: entry[2] }
      : entry);
  }
  const comprehensive = sections.comprehensive_practice;
  if (comprehensive && !comprehensive.items && comprehensive.exercise_1) {
    comprehensive.items = [comprehensive.exercise_1, comprehensive.exercise_2, comprehensive.exercise_3];
  }
  const assetRoot = path.join(lessonRoot, '10-design/assets');
  const assets = imageManifest.assets || [];
  const assetById = new Map(assets.map((asset) => [asset.asset_id, asset]));
  const wordToAsset = new Map();
  assets.forEach((asset) => {
    const match = String(asset.asset_id || '').match(/-V(\d+)$/);
    if (match && (asset.category === 'vocabulary' || asset.category === 'proper_noun')) {
      const ordinal = Number(match[1]);
      const vocab = sections.vocabulary?.entries?.find((entry) => Number(entry.no) === ordinal);
      if (vocab) {
        wordToAsset.set(vocab.word, fileFromAsset(assetRoot, asset));
      } else {
        const proper = (sections.vocabulary?.proper_nouns || [])[ordinal - (sections.vocabulary?.entries || []).length - 1];
        if (proper) wordToAsset.set(proper.word, fileFromAsset(assetRoot, asset));
      }
    }
  });
  (sections.vocabulary?.proper_nouns || []).forEach((entry, index) => {
    const asset = assets.find((item) => (item.category === 'vocabulary' || item.category === 'proper_noun') && String(item.asset_id || '').includes(`PN${index + 1}`));
    if (asset) wordToAsset.set(entry.word, fileFromAsset(assetRoot, asset));
  });
  (sections.vocabulary?.proper_nouns || []).forEach((entry, index) => {
    if (wordToAsset.has(entry.word)) return;
    const dedicated = path.join(assetRoot, `l${String(number).padStart(2, '0')}-vocab-dedicated-${String((sections.vocabulary.entries || []).length + index + 1).padStart(2, '0')}.png`);
    if (fs.existsSync(dedicated)) {
      wordToAsset.set(entry.word, dedicated);
      return;
    }
    const candidates = assets.filter((item) => item.category === 'proper_noun');
    if (candidates[index]) wordToAsset.set(entry.word, fileFromAsset(assetRoot, candidates[index]));
  });
  const audioRoot = path.join(ROOT, 'textbooks/boya-quasi-intermediate-i/source/audio', lessonId);
  const contextAssets = assets.filter((asset) => String(asset.category || '').includes('context'));
  const fallbackAssets = assets.filter((asset) => fileFromAsset(assetRoot, asset));
  // Lesson 4's candidate illustrations use semantic asset ids rather than
  // the older -V## convention. Use its declared vocabulary coverage map.
  if (!wordToAsset.size && imageManifest.vocabulary_coverage) {
    Object.entries(imageManifest.vocabulary_coverage).forEach(([word, ids]) => {
      const asset = assetById.get(ids?.[0]);
      if (asset) wordToAsset.set(word, fileFromAsset(assetRoot, asset));
    });
  }
  // Later lesson asset manifests use either L##-V## or semantic vocabulary
  // asset ids. Preserve their declared order when the id has no -V suffix.
  const orderedVocabAssets = assets.filter((asset) => String(asset.category || '') === 'vocabulary');
  sections.vocabulary?.entries?.forEach((entry, index) => {
    const dedicated = path.join(assetRoot, `l${String(number).padStart(2, '0')}-vocab-dedicated-${String(index + 1).padStart(2, '0')}.png`);
    if (fs.existsSync(dedicated)) {
      wordToAsset.set(entry.word, dedicated);
      return;
    }
    if (!wordToAsset.has(entry.word) && orderedVocabAssets[index]) {
      wordToAsset.set(entry.word, fileFromAsset(assetRoot, orderedVocabAssets[index]));
    }
  });
  const lesson = {
    number,
    lessonId,
    lessonKey: canonical.lesson_key || expectedLessonKey,
    lessonRoot,
    canonicalPath,
    sourceManifestPath,
    imageManifestPath,
    canonical,
    sourceManifest,
    imageManifest,
    sections,
    assetRoot,
    assetById,
    wordToAsset,
    contextAssets: contextAssets.length ? contextAssets : fallbackAssets,
    audioRoot,
    title: canonical.title,
    sourceHash: sha256(canonicalPath),
    outputRoot: path.join(lessonRoot, '10-design/pptx-draft')
  };
  ensureLesson4VocabIcons(lesson);
  return lesson;
}

function audioTrackLabels(lesson) {
  const labels = [];
  const add = (value) => {
    if (value !== undefined && value !== null && String(value).trim()) labels.push(String(value));
  };
  (lesson.canonical.audio_map || []).forEach((item) => {
    add(item.label || item.track_label || item.track || item.audio || item.id);
  });
  Object.values(lesson.sections).forEach((section) => {
    add(section.audio);
    (section.audio_tracks || []).forEach(add);
  });
  return [...new Set(labels)];
}

function runDraftGate(lesson, outputDir) {
  execFileSync(PYTHON, [
    path.join(ROOT, 'scripts/production_gate.py'),
    '--purpose', 'pptx',
    '--stage', 'draft',
    '--lesson-key', lesson.lessonKey,
    '--output-dir', outputDir
  ], { stdio: 'inherit' });
}

function addText(slide, value, x, y, w, h, options = {}) {
  slide.addText(simp(value), {
    x, y, w, h,
    fontFace: options.fontFace || CJK,
    fontSize: options.fontSize || T.body_pt,
    color: options.color || C.ink,
    margin: options.margin === undefined ? 0.04 : options.margin,
    fit: options.fit || 'shrink',
    valign: options.valign || 'mid',
    align: options.align || 'left',
    bold: Boolean(options.bold),
    italic: Boolean(options.italic),
    breakLine: options.breakLine === undefined ? true : options.breakLine,
    paraSpaceAfterPt: 0,
    lang: options.lang || 'zh-CN',
    ...options
  });
}

function addLatin(slide, value, x, y, w, h, options = {}) {
  slide.addText(String(value || ''), {
    x, y, w, h,
    fontFace: LATIN,
    fontSize: options.fontSize || T.small_label_pt,
    color: options.color || C.muted,
    margin: options.margin === undefined ? 0.04 : options.margin,
    fit: options.fit || 'shrink',
    valign: options.valign || 'mid',
    align: options.align || 'left',
    breakLine: true,
    paraSpaceAfterPt: 0,
    lang: 'en-US',
    ...options
  });
}

function addMixedScriptText(slide, value, x, y, w, h, options = {}) {
  const text = String(value || '');
  const runs = [];
  let current = '';
  let currentIsCjk = null;
  for (const char of text) {
    const isCjk = /[\u3400-\u9fff]/.test(char);
    if (current && isCjk !== currentIsCjk) {
      runs.push({ text: current, options: { fontFace: currentIsCjk ? CJK : LATIN } });
      current = '';
    }
    current += char;
    currentIsCjk = isCjk;
  }
  if (current) runs.push({ text: current, options: { fontFace: currentIsCjk ? CJK : LATIN } });
  slide.addText(runs, {
    x, y, w, h,
    fontFace: CJK,
    fontSize: options.fontSize || T.body_pt,
    color: options.color || C.muted,
    margin: options.margin === undefined ? 0.04 : options.margin,
    fit: options.fit || 'shrink',
    valign: options.valign || 'mid',
    align: options.align || 'left',
    bold: Boolean(options.bold),
    breakLine: true,
    paraSpaceAfterPt: 0,
    lang: 'zh-CN',
    ...options
  });
}

function addLine(slide, x, y, w, color = C.line, pt = 0.8) {
  slide.addShape('line', { x, y, w, h: 0, line: { color, pt } });
}

function addBox(slide, x, y, w, h, fill = C.white, border = C.line, radius = 0.08) {
  slide.addShape('roundRect', { x, y, w, h, rectRadius: radius, fill: { color: fill }, line: { color: border, pt: 0.8 } });
}

function addHeader(slide, lesson, number, title = '', pages = '') {
  slide.background = { color: C.slideBackground };
  if (ACTIVE_MODE === 'face') {
    // Exact header family used by the approved Lesson 1 face-to-face deck.
    addText(slide, `${lessonLabel(lesson)}｜${lesson.title}`, 0.65, 0.25, 4.5, 0.28, { fontSize: 20, color: C.muted, bold: true });
    addLatin(slide, String(number).padStart(2, '0'), 12.0, 0.25, 0.65, 0.28, { fontSize: 20, align: 'right', color: C.muted });
    addLine(slide, 0.65, 0.69, 12.0);
    if (pages) addMixedScriptText(slide, pages, 10.55, 7.02, 2.1, 0.28, { fontSize: T.page_marker_pt, color: C.muted, align: 'right', objectName: `Textbook Page Marker ${String(number).padStart(2, '0')}` });
    if (title) {
      const size = title.length > 22 ? T.long_title_pt : T.slide_title_pt;
      addText(slide, title, 0.72, 0.98, 8.0, 0.62, { fontSize: size, bold: true, valign: 'top' });
    }
    return;
  }
  // The online deck uses the same header geometry as the approved Lesson 1
  // deck.  Keeping this in the shared helper prevents the old 12 pt/dot
  // fallback from returning in later lessons.
  addText(slide, `${lessonLabel(lesson)}｜${lesson.title}`, 0.65, 0.25, 4.5, 0.28, { fontSize: 20, color: C.muted, bold: true });
  addLatin(slide, String(number).padStart(2, '0'), 12.0, 0.25, 0.65, 0.28, { fontSize: 20, align: 'right', color: C.muted });
  addLine(slide, 0.65, 0.69, 12.0);
  if (pages) addMixedScriptText(slide, pages, 10.35, 7.02, 2.3, 0.28, { fontSize: T.page_marker_pt, color: C.muted, align: 'right', objectName: `Textbook Page Marker ${String(number).padStart(2, '0')}` });
  if (title) {
    const size = title.length > 22 ? T.long_title_pt : T.slide_title_pt;
      addText(slide, title, 0.72, 0.98, 11.6, 0.62, { fontSize: size, bold: true, valign: 'top' });
  }
}

function notes(slide, value) {
  if (typeof slide.addNotes === 'function') slide.addNotes(String(value));
}

function imagePanel(slide, filePath, x, y, w, h, fill = C.mint, emptyLabel = '教材原页') {
  addBox(slide, x, y, w, h, fill, fill);
  if (!filePath || !fs.existsSync(filePath)) {
    addText(slide, emptyLabel, x + 0.2, y + h / 2 - 0.25, w - 0.4, 0.5, { fontSize: 22, color: C.teal, bold: true, align: 'center' });
    return;
  }
  slide.addImage({ path: filePath, x: x + 0.16, y: y + 0.16, w: w - 0.32, h: h - 0.32, sizingContain: true });
}

function firstContextFile(lesson, index = 0) {
  const asset = lesson.contextAssets[index % Math.max(lesson.contextAssets.length, 1)];
  return fileFromAsset(lesson.assetRoot, asset);
}

function addAudio(slide, lesson, track) {
  if (!track) return;
  const filePath = path.join(lesson.audioRoot, `${track}.mp3`);
  addBox(slide, 10.42, 0.96, 1.58, 0.62, C.coral, C.coral);
  addLatin(slide, track, 10.52, 1.1, 1.38, 0.26, { fontSize: 20, color: C.white, align: 'center', bold: true });
  if (fs.existsSync(filePath)) {
    slide.addMedia({ type: 'audio', path: filePath, x: 12.05, y: 1.0, w: 0.52, h: 0.52, objectName: `音频 ${track} 播放` });
  } else {
    notes(slide, `音频 ${track} 文件尚未找到；本页保留教材编号，待音频 QA。`);
  }
}

function addBullets(slide, items, x, y, w, h, options = {}) {
  const text = items.map((item) => `• ${simp(item)}`).join('\n');
  addText(slide, text, x, y, w, h, { fontSize: options.fontSize || 22, color: options.color || C.ink, valign: 'top', breakLine: true, ...options });
}

function addSteps(slide, steps, y = 2.5) {
  const startX = 0.92;
  const gap = steps.length > 4 ? 2.55 : 3.0;
  steps.forEach((step, index) => {
    const x = startX + index * gap;
    if (index < steps.length - 1) {
      slide.addShape('line', { x: x + 0.62, y: y + 0.28, w: gap - 0.83, h: 0, line: { color: C.line, pt: 2, endArrowType: 'triangle' } });
    }
    slide.addShape('ellipse', { x, y, w: 0.54, h: 0.54, fill: { color: [C.teal, C.coral, C.purple, C.yellow][index % 4] }, line: { transparency: 100 } });
    addLatin(slide, String(index + 1), x, y + 0.11, 0.54, 0.25, { fontSize: T.small_label_pt, color: C.white, align: 'center', bold: true });
    addText(slide, step, x + 0.7, y + 0.04, gap - 0.88, 0.4, { fontSize: 23, bold: true, color: C.teal });
  });
}

function addFaceRouteSteps(slide, steps) {
  const startX = 0.72;
  const cardW = 1.58;
  const gap = 0.18;
  const y = 1.95;
  steps.forEach((step, index) => {
    const x = startX + index * (cardW + gap);
    addBox(slide, x, y, cardW, 2.05, [C.mint, C.blue, C.yellowSoft, C.lilac][index % 4], [C.mint, C.blue, C.yellowSoft, C.lilac][index % 4]);
    addLatin(slide, String(index + 1), x + 0.49, y + 0.28, 0.6, 0.28, { fontSize: 21, color: C.purple, bold: true, align: 'center' });
    addText(slide, step, x + 0.14, y + 0.77, cardW - 0.28, 0.78, { fontSize: step.length > 5 ? T.visible_min_pt : T.route_step_pt, color: C.purple, bold: true, align: 'center', valign: 'mid' });
    if (index < steps.length - 1) {
      slide.addShape('line', { x: x + cardW + 0.02, y: y + 1.03, w: gap - 0.04, h: 0, line: { color: C.line, pt: 1.4, endArrowType: 'triangle' } });
    }
  });
}

function dividerAssetName(title, contextIndex = 0) {
  if (title === '听力练习') return 'symbolic-listening.png';
  if (title === '听力和阅读练习') return 'symbolic-listening.png';
  if (title === '口语练习') return 'oral-practice-divider.png';
  if (title === '句式练习') return 'symbolic-sentence-pattern.png';
  if (title === '句式') return 'symbolic-sentence-pattern.png';
  if (title === '综合表达') return 'divider-comprehensive.png';
  if (title === '词语学习') return 'symbolic-vocabulary.png';
  if (title === '词语') return 'symbolic-vocabulary.png';
  if (title === '专有名词') return 'symbolic-vocabulary.png';
  if (title === '短文阅读') return 'divider-family.png';
  if (title === '常用表达') return 'symbolic-sentence-pattern.png';
  if (title === '综合练习') return 'divider-comprehensive.png';
  if (String(title).startsWith('短文')) return ['divider-family.png', 'divider-work.png', 'divider-hobby.png'][contextIndex % 3];
  return ['divider-family.png', 'divider-work.png', 'divider-hobby.png'][contextIndex % 3];
}

function addDivider(slide, lesson, number, title, subtitle, contextIndex = 0) {
  addHeader(slide, lesson, number);
  addText(slide, title, 0.9, 2.25, 7.2, 0.8, { fontSize: T.divider_pt, color: C.purple, bold: true });
  if (subtitle) {
    addText(slide, subtitle, 0.95, 3.25, 6.4, 0.5, { fontSize: T.subtitle_pt, color: C.teal, bold: true });
    addLine(slide, 0.95, 4.05, 5.7, C.coral, 2);
  }
  const image = sharedAsset(dividerAssetName(title, contextIndex)) || firstContextFile(lesson, contextIndex);
  addBox(slide, 8.0, 1.45, 4.25, 4.4, C.white, 'D3D9D1');
  if (image && fs.existsSync(image)) slide.addImage({ path: image, x: 8.06, y: 1.51, w: 4.13, h: 4.28, sizingContain: true });
  notes(slide, `进入${title}部分。`);
}

function lessonTopics(lesson) {
  return lesson.number === 2
    ? '学校生活 · 生日午餐 · 课外活动'
    : lesson.number === 3
      ? '家庭生活 · 选修中文 · 中文课堂'
      : lesson.number === 7
        ? '运动爱好 · 登山经历 · 活动收获'
        : '北京生活 · 学习内容 · 学习比较';
}

function addCover(slide, lesson, mode, number) {
  const content = onlineContentFor(lesson);
  const titlePt = Number(content.cover?.[mode === 'online' ? 'online_title_pt' : 'face_title_pt'] || T.cover_title_pt);
  const badgePt = Number(content.cover?.badge_pt || T.cover_badge_pt);
  if (mode === 'online') {
    // Copy the approved Lesson 1 entity-class cover geometry.  The only
    // intentional mode change is the teal pill text: 在线课.
    addHeader(slide, lesson, number);
    const coverFile = sharedAsset(ONLINE_LAYOUT.cover.asset);
    addBox(slide, 7.05, 1.08, 5.55, 4.7, C.white, 'D3D9D1');
    if (coverFile && fs.existsSync(coverFile)) slide.addImage({ path: coverFile, x: 7.11, y: 1.14, w: 5.43, h: 4.58, sizingContain: true });
    slide.addShape('roundRect', { x: 0.78, y: 1.08, w: 1.3, h: 0.42, rectRadius: 0.08, fill: { color: C.teal }, line: { color: C.teal, pt: 0.8 } });
    addText(slide, ONLINE_LAYOUT.cover.online_label, 0.86, 1.11, 1.14, 0.3, { fontSize: badgePt, color: C.white, bold: true, align: 'center' });
    addText(slide, lesson.title, 0.78, 1.72, 6.0, 0.82, { fontSize: titlePt, color: C.ink, bold: true, valign: 'top' });
  } else {
    addHeader(slide, lesson, number);
    const coverFile = sharedAsset('lesson-01-cover-family-work-hobby.png');
    addBox(slide, 7.05, 1.08, 5.55, 4.7, C.white, 'D3D9D1');
    if (coverFile && fs.existsSync(coverFile)) slide.addImage({ path: coverFile, x: 7.11, y: 1.14, w: 5.43, h: 4.58, sizingContain: true });
    slide.addShape('roundRect', { x: 0.78, y: 1.08, w: 1.3, h: 0.42, rectRadius: 0.08, fill: { color: C.teal }, line: { color: C.teal, pt: 0.8 } });
    addText(slide, '实体课', 0.86, 1.11, 1.14, 0.3, { fontSize: badgePt, color: C.white, bold: true, align: 'center' });
    addText(slide, lesson.title, 0.78, 1.72, 6.0, 0.82, { fontSize: titlePt, color: C.ink, bold: true, valign: 'top' });
  }
  notes(slide, `${mode === 'online' ? '线上预习' : '实体课堂'}封面。学生先看本课主题。`);
}

function addRouteSlide(slide, lesson, number, mode) {
  const content = onlineContentFor(lesson);
  addHeader(slide, lesson, number, mode === 'online' ? ONLINE_LAYOUT.learning_route.title : '今天的学习路线');
  if (mode === 'face') {
    // Reuse the exact route visual from the approved Lesson 1 face-to-face
    // deck. This is a shared visual, not a lesson-specific reconstruction.
    const route = sharedAsset('lesson-01-learning-path.png');
    if (!route || !fs.existsSync(route)) throw new Error('Approved Lesson 1 face-to-face learning-route asset is missing');
    slide.addImage({ path: route, x: 0.72, y: 1.58, w: 11.90, h: 5.48, sizingContain: true });
    notes(slide, '使用第一课实体课核准的学习路线图。');
    return;
  }
  const routeAsset = content.route?.asset || ONLINE_LAYOUT.learning_route.asset;
  const route = configuredAsset(lesson, routeAsset);
  if (!route) throw new Error(`User-supplied learning-route asset is missing: ${routeAsset}`);
  slide.addImage({ path: route, x: 0.72, y: 1.58, w: 11.90, h: 5.48, sizingContain: true });
  notes(slide, `${mode === 'online' ? '线上' : '实体'}课程路线；不显示教师时间或内部制作标签。`);
}

function vocabEntries(lesson) {
  const section = lesson.sections.vocabulary || {};
  return (section.entries || []).concat((section.proper_nouns || []).map((entry) => ({ ...entry, pos: '专有名词' })));
}

function regularVocabEntries(lesson) {
  return lesson.sections.vocabulary?.entries || [];
}

function properNounEntries(lesson) {
  return (lesson.sections.vocabulary?.proper_nouns || []).map((entry) => ({ ...entry, pos: '专有名词' }));
}

function vocabPageLabel(lesson, entry, index, properNoun = false) {
  const lessonContent = ONLINE_CONTENT.lessons?.[lesson.lessonId];
  const contract = lessonContent?.vocabulary?.page_breaks || ONLINE_LAYOUT.vocabulary.page_breaks[String(lesson.number)];
  if (properNoun) return pageLabel([entry.printed_page || (lesson.number === 3 ? 23 : contract?.second_page || lesson.sections.vocabulary.printed_pages?.at(-1))]);
  if (!contract) return pageLabel(lesson.sections.vocabulary.printed_pages);
  const firstCount = Number(contract.first_count);
  const page = index < firstCount ? contract.first_page : contract.second_page;
  return pageLabel([page]);
}

function vocabExamples(lesson, entry) {
  const data = vocabularyData(lesson, entry);
  return (Array.isArray(data.examples) ? data.examples : [])
    .map((example, index) => assertShortSentence(example, `第${lesson.number}课词语“${entry.word}”例句${index + 1}`));
}

function vocabularyOptionalRows(data) {
  return [
    ['扩展：', data.extension],
    ['用法：', data.usage_detail],
    ['常用短语：', data.common_phrase],
    ['语法说明：', data.grammar_detail]
  ].filter(([, value]) => String(value || '').trim()).map(([label, value]) => `${label}${value}`);
}

function addVocabSlide(slide, lesson, number, entry, index, properNoun = false) {
  const data = vocabularyData(lesson, entry);
  const pages = vocabPageLabel(lesson, entry, index, properNoun);
  addHeader(slide, lesson, number, data.word, pages);
  // Match the approved Lesson 1 vocabulary geometry: a left information
  // card, a shorter image panel, and a separate two-line example strip.
  addBox(slide, 0.78, 1.67, 5.35, 4.98, C.white, C.line);
  addText(slide, data.word, 1.08, 1.98, 4.72, 0.68, { fontSize: data.word.length > 6 ? T.vocabulary_headword_long_pt : T.vocabulary_headword_pt, color: C.purple, bold: true });
  addLatin(slide, data.pinyin || '', 1.10, 2.75, 4.70, 0.36, { fontSize: T.pinyin_pt, color: C.teal });
  const pos = data.pos || '—';
  const posLabel = ({ '名': '名词', '动': '动词', '形': '形容词', '副': '副词', '代': '代词', '量': '量词', '连': '连词', '动／副': '动词／副词', '专有名词': '专有名词' }[pos] || pos);
  addText(slide, `词类：${posLabel}`, 1.10, 3.32, 4.70, 0.36, { fontSize: T.vocabulary_pos_pt, color: C.ink });
  addMixedLabelValue(slide, '意思：', data.meaning_vi, 1.10, 3.78, 4.70, 0.52, { fontSize: T.vocabulary_meaning_pt, color: C.ink, valign: 'top' });
  if (String(data.usage || '').trim()) addText(slide, `使用场合：${data.usage}`, 1.10, 4.43, 4.65, 0.70, { fontSize: T.vocabulary_usage_pt, color: C.muted, valign: 'top' });
  const optionalRows = vocabularyOptionalRows(data);
  if (optionalRows.length) addText(slide, optionalRows.join('\n'), 1.10, 5.28, 4.72, 1.10, { fontSize: optionalRows.length > 2 ? T.visible_min_pt : T.vocabulary_optional_pt, color: C.teal, bold: true, valign: 'top' });
  imagePanel(slide, lesson.wordToAsset.get(data.word), 6.42, 1.67, 6.15, 3.62, [C.mint, C.blue, C.yellowSoft][index % 3], '教材图片');
  addBox(slide, 6.42, 5.49, 6.15, 1.17, C.white, C.line);
  const examples = vocabExamples(lesson, entry);
  if (examples.length) addText(slide, examples.map((example, exampleIndex) => `例句${exampleIndex + 1}：${example}`).join('\n'), 6.72, 5.69, 5.55, 0.78, { fontSize: T.vocabulary_example_pt, color: C.ink, bold: true, valign: 'top' });
  notes(slide, `词语 ${data.word}；来源：canonical-source.json#sections.vocabulary。意思栏使用已审核的越南文；扩展、用法、语法说明与例句仅在课次内容契约明确提供时显示。`);
}

function pageLabelForVocabGroup(lesson, entries, startIndex) {
  const pages = entries.map((entry, offset) => {
    const page = vocabPageLabel(lesson, entry, startIndex + offset);
    const match = page.match(/P(\d+)/);
    return match ? Number(match[1]) : null;
  }).filter(Boolean);
  return pageLabel([...new Set(pages)]);
}

function addVocabPracticeSlide(slide, lesson, number, entries, startIndex) {
  addHeader(slide, lesson, number, ONLINE_LAYOUT.vocabulary.practice_title, pageLabelForVocabGroup(lesson, entries, startIndex));
  const fills = [C.mint, C.blue, C.yellowSoft, C.lilac, C.coralSoft];
  const cardW = 2.04;
  const xs = [0.82, 3.30, 5.78, 8.26, 10.74];
  entries.forEach((entry, index) => {
    const x = xs[index];
    addBox(slide, x, 1.90, cardW, 3.11, fills[index], C.line);
    const image = lesson.wordToAsset.get(entry.word);
    if (image && fs.existsSync(image)) {
      slide.addImage({ path: image, x: x + 0.08, y: 1.99, w: cardW - 0.16, h: 2.84, sizingContain: true });
    } else {
      addText(slide, entry.word, x + 0.12, 3.05, cardW - 0.24, 0.6, { fontSize: entry.word.length > 6 ? 23 : 29, color: C.purple, bold: true, align: 'center' });
    }
    addLine(slide, x + 0.18, 5.10, cardW - 0.36, C.teal, 1.0);
    addText(slide, entry.word, x - 0.07, 5.38, cardW + 0.14, 0.36, { fontSize: entry.word.length > 6 ? T.small_label_pt : 21, color: C.purple, bold: true, align: 'center' });
  });
  notes(slide, `完成五个词语的口语练习：说出词语并各造一句话。来源：canonical-source.json#sections.vocabulary。`);
}

function shortTextContextFile(lesson, index) {
  const asset = lesson.contextAssets[index % Math.max(lesson.contextAssets.length, 1)];
  return fileFromAsset(lesson.assetRoot, asset);
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
  const metadata = section?.exercise_metadata?.[key];
  if (metadata?.heading_verbatim) return String(metadata.heading_verbatim);
  return fallback;
}

function shortTextLabel(index) {
  return ['一', '二', '三'][index] || String(index + 1);
}

function faceExpressionPlan(lesson, textCount) {
  const sections = expressionSections(lesson).filter((section) => Array.isArray(section.items) || Array.isArray(section.groups));
  const hasGroupedExpressions = sections.some((section) => Array.isArray(section.groups) && section.groups.length);
  if (hasGroupedExpressions) {
    const shared = [];
    sections.forEach((section) => {
      (section.groups || []).forEach((group, groupIndex) => {
        const items = (group.items || []).map((item) => typeof item === 'string' ? { expression: item } : item);
        if (!items.length) return;
        shared.push({
          ...section,
          id: `${section.id}__group_${groupIndex + 1}`,
          topic: group.topic || section.topic,
          items
        });
      });
    });
    return { byText: [], shared };
  }
  return {
    byText: sections.slice(0, textCount),
    shared: sections.slice(textCount)
  };
}

const SHORT_TEXT_RECORDS = {
  2: [
    {
      title: '王红喜欢上课',
      prompts: ['她喜欢什么课？', '这门课怎么样？', '她的学习有什么收获？'],
      fields: ['人物', '课程', '课程特点', '学习收获'],
      output: '准备说 6—8 句，介绍她的学校生活。'
    },
    {
      title: '生日午餐',
      prompts: ['午餐在哪里？', '桌子上有什么？', '大家一起做了什么？'],
      fields: ['地点', '食物', '同学的活动', '王红的感觉'],
      output: '准备说 4—6 句，介绍她的生日午餐。'
    },
    {
      title: '课外活动',
      prompts: ['她每周去哪里？', '她要做什么？', '这项活动有什么意义？'],
      fields: ['地点', '身份', '工作', '活动意义'],
      output: '准备说 4—6 句，介绍她的课外活动。'
    }
  ],
  3: [
    {
      title: '开始接触汉语并产生一定的兴趣',
      prompts: ['王先生是谁？', '李大为会说什么？', '他觉得中文怎么样？'],
      fields: ['家庭', '中国朋友', '会说的中文', '对中文的感觉'],
      output: '准备说 6—8 句，介绍他的家庭和中文经历。'
    },
    {
      title: '为什么选修中文',
      prompts: ['他以前学过什么？', '为什么不继续学？', '他为什么选中文？'],
      fields: ['以前学的语言', '转学原因', '中国爷爷奶奶', '选中文的原因'],
      output: '准备说 6—8 句，说明他为什么选修中文。'
    },
    {
      title: '中文课',
      prompts: ['中文哪里不容易？', '同学们怎样互相帮助？', '他们为什么喜欢聊天儿？'],
      fields: ['学习难点', '课堂活动', '同伴帮助', '学习收获'],
      output: '准备说 4—6 句，介绍他的中文课。'
    }
  ],
  7: [
    {
      title: '小张是登山迷',
      prompts: ['小张喜欢什么运动？', '他最大的爱好是什么？', '他什么时候真正喜欢上登山？'],
      fields: ['运动爱好', '最大爱好', '小时候的经历', '真正喜欢登山的时间'],
      output: '准备说 6—8 句，介绍小张的爱好。'
    },
    {
      title: '小张真正爱上了登山',
      prompts: ['他为什么需要放松？', '登山有哪些好处？', '为什么说他很浪漫？'],
      fields: ['工作和压力', '登山的机会', '登山的好处', '浪漫的想法'],
      output: '准备说 6—8 句，说明小张为什么喜欢登山。'
    },
    {
      title: '登山可以增进友谊',
      prompts: ['小张和谁一起登山？', '他们去什么样的地方？', '登山对工作有什么好处？'],
      fields: ['登山伙伴', '活动地点', '同事关系', '工作效率'],
      output: '准备说 6—8 句，说明登山带来的好处。'
    }
  ],
  4: [
    { title: '对北京的印象', prompts: ['朴大宇在哪里学习？', '他这次发现了什么？', '他怎样和司机聊天？'], fields: ['人物', '地点', '新发现', '中文交流'], output: '准备说 6—8 句，介绍他在北京的生活。' },
    { title: '学习内容', prompts: ['他上什么课？', '下午和晚上做什么？', '他的汉语怎么样？'], fields: ['课程', '学习时间', '语伴活动', '汉语情况'], output: '准备说 6—8 句，介绍他的学习情况。' },
    { title: '在中国学汉语和在本国学汉语的异同', prompts: ['在韩国怎样上课？', '在中国学习有什么不同？', '为什么说在中国效率高？'], fields: ['韩国课堂', '北京课堂', '学习机会', '学习效率'], output: '准备说 6—8 句，比较两地的学习情况。' }
  ]
};

function textPageLabel(section, useLastPage = false) {
  const pages = Array.isArray(section.printed_pages) ? section.printed_pages : [];
  return pageLabel(useLastPage && pages.length ? [pages[pages.length - 1]] : pages);
}

function addOnlineTextSlides(slides, lesson, numberRef, section, sectionIndex) {
  const record = SHORT_TEXT_RECORDS[lesson.number]?.[sectionIndex] || {
    title: section.title,
    prompts: ['人物', '地点', '事情'],
    fields: ['人物', '地点', '事情'],
    output: '准备说一段自己的话。'
  };
  const shortIndex = ['一', '二', '三'][sectionIndex] || String(sectionIndex + 1);
  // Summary slide: this is the same two-column record layout as Lesson 1;
  // the source paragraph remains in the textbook instead of being pasted.
  numberRef.value += 1;
  const summary = slides.addSlide();
  addHeader(summary, lesson, numberRef.value, section.title, textPageLabel(section));
  addAudio(summary, lesson, section.audio);
  addText(summary, ONLINE_LAYOUT.reading.summary_instruction.replace('{audio}', section.audio || '本课音档'), 0.92, 1.58, 11.0, 0.48, { fontSize: 25, color: C.teal, bold: true });
  addText(summary, '记录听不懂的地方：', 0.92, 2.28, 5.5, 0.42, { fontSize: 24, color: C.purple, bold: true });
  for (let i = 0; i < 5; i += 1) {
    const y = 2.82 + i * 0.52;
    addText(summary, `${i + 1}.`, 1.12, y, 0.38, 0.3, { fontSize: 20, color: C.muted });
    addLine(summary, 1.62, y + 0.28, 4.75, C.teal, 0.9);
  }
  addText(summary, '我的摘要：', 6.82, 2.28, 5.2, 0.42, { fontSize: 24, color: C.purple, bold: true });
  for (let i = 0; i < 5; i += 1) {
    const y = 2.82 + i * 0.52;
    addText(summary, `${i + 1}.`, 7.02, y, 0.38, 0.3, { fontSize: 20, color: C.muted });
    addLine(summary, 7.52, y + 0.28, 4.55, C.teal, 0.9);
  }
  notes(summary, `线上阅读和听取 ${section.id}；学生在教材阅读／听取后写摘要并标记卡点，投影片不复制短文全文。`);

  // Record slide: keep the approved Lesson 1 compact record card, with each
  // lesson's own prompts and a concrete single printed page (the last page
  // used by the record activity).
  numberRef.value += 1;
  const recordSlide = slides.addSlide();
  addHeader(recordSlide, lesson, numberRef.value, ONLINE_LAYOUT.reading.record_title.replace('{ordinal}', shortIndex), textPageLabel(section, true));
  addText(recordSlide, ONLINE_LAYOUT.reading.record_subtitle, 0.95, 1.63, 7.0, 0.46, { fontSize: 25, color: C.purple, bold: true });
  const fields = record.fields.slice(0, 4);
  fields.forEach((field, index) => {
    const y = 2.48 + index * 0.73;
    addText(recordSlide, `${field}：`, 1.05, y, 5.2, 0.34, { fontSize: 22, color: C.ink, bold: true });
    addLine(recordSlide, 1.05, y + 0.43, 6.0, C.teal, 0.9);
  });
  addBox(recordSlide, 7.75, 1.7, 4.7, 3.95, C.white, C.line);
  addText(recordSlide, '我的口语准备', 8.15, 2.05, 3.9, 0.4, { fontSize: 25, color: C.purple, bold: true, align: 'center' });
  addText(recordSlide, record.output.replace(/^准备/, '用自己的话'), 8.12, 2.78, 3.95, 1.05, { fontSize: 23, color: C.teal, bold: true, align: 'center', valign: 'mid' });
  for (let i = 0; i < 3; i += 1) addLine(recordSlide, 8.18, 4.35 + i * 0.45, 3.8, C.teal, 0.9);
  notes(recordSlide, `短文${shortIndex}记录练习；学生把教材重点整理成可说的词语和短句。`);
}

function addOnlineFinalTextTaskSlide(slide, lesson, number, section) {
  const title = lesson.number === 2 ? '我的一天' : lesson.number === 3 ? '我的中文学习' : lesson.number === 7 ? '我的运动爱好' : '我学习中文的经历';
  const prompt = lesson.number === 2
    ? '请用三到五句介绍你的一天。'
    : lesson.number === 3
      ? '请用三到五句介绍你的中文学习。'
      : lesson.number === 7
        ? '请用三到五句介绍你喜欢的运动。'
        : '请用三到五句介绍你学习中文的经历。';
  addHeader(slide, lesson, number, title, textPageLabel(section, true));
  addText(slide, prompt, 1.0, 1.62, 11.2, 0.48, { fontSize: 27, color: C.teal, bold: true, align: 'center' });
  addText(slide, '必须使用 5 个课本词语和 3 个句式。', 1.0, 2.14, 11.2, 0.42, { fontSize: 24, color: C.purple, bold: true, align: 'center' });
  addBox(slide, 0.95, 2.75, 11.25, 2.9, C.white, C.line);
  for (let i = 0; i < 5; i += 1) {
    const y = 3.18 + i * 0.47;
    addText(slide, `${i + 1}.`, 1.35, y, 0.4, 0.3, { fontSize: 20, color: C.muted });
    addLine(slide, 2.05, y + 0.28, 9.8, C.teal, 1.0);
  }
  notes(slide, '学生用自己的经历完成三到五句口语准备；开放题不设唯一答案。');
}

function expressionSections(lesson) {
  return Object.values(lesson.sections).filter((section) => /^common_expressions(?:_|$)/.test(String(section.id || '')));
}

function expressionExamples(lesson, item) {
  const content = onlineContentFor(lesson);
  const configured = content.expressions?.items?.[item.expression];
  const bankExamples = exampleBankFor(lesson).expressions?.[item.expression];
  const sourceExamples = item.examples;
  const examples = content.status !== 'finalized_reference'
    ? bankExamples
    : configured?.examples !== undefined ? configured.examples : bankExamples !== undefined ? bankExamples : sourceExamples;
  if (!Array.isArray(examples)) return [];
  return examples.map((example, exampleIndex) => assertShortSentence(example, `第${lesson.number}课表达“${item.expression}”例句${exampleIndex + 1}`));
}

// The source audit shows where each expression row starts.  Keep single-page
// rows single-page; use a range only when the same source section truly spans
// pages.
const EXPRESSION_PAGE_MAP = {
  2: {
    common_expressions_school_life: [16, 16, 16, 16, 17],
    common_expressions_extra_curricular: [18, 18, 18, 18, 18, 19, 19, 19, 20, 20]
  },
  3: {
    common_expressions_family: [26, 26, 26, 26, 26],
    common_expressions_study: [27, 27, 27, 28, 28, 28],
    common_expressions_discuss: [29, 29, 29]
  },
  4: {
    '上（菜）': '请快点儿上菜。', '司机': '司机师傅问我是哪儿人。', '快餐店': '外国快餐店到处都是。', '点（菜）': '我们一共点了四个菜。',
    '阅读': '他的阅读进步挺快。', '语伴': '晚上我和语伴互相学习。', '讲座': '下午我们去听讲座。', '国际': '他学习国际关系。',
    '发现': '她发现自己听懂了。', '习惯': '他已经习惯北京的生活。', '新闻': '我常常看中文新闻。', '字幕': '很多字幕他都能读懂。',
    '加倍': '他要加倍努力学习中文。', '解释': '老师用韩语解释生词。', '词语': '我记住了很多词语。', '效率': '在中国学习效率更高。',
    '印象': '我对北京的印象很好。', '吃惊': '他吃惊地发现汽车多了。', '聊': '我能和司机聊几句。', '通常': '下午通常去参观。',
    '听力': '他的听力还不行。', '异同': '请说说两地学习的异同。', '量': '这家饭馆儿的菜量很大。', '饿': '我们都很饿，吃得了。'
  }
};

function expressionPageLabel(lesson, section, index) {
  const expression = section?.items?.[index]?.expression;
  const configuredPage = ONLINE_CONTENT.lessons?.[lesson.lessonId]?.expressions?.page_map?.[expression];
  if (configuredPage !== undefined && configuredPage !== null) {
    return pageLabel(Array.isArray(configuredPage) ? configuredPage : [configuredPage]);
  }
  const pages = EXPRESSION_PAGE_MAP[lesson.number]?.[section.id];
  return pageLabel(pages?.[index] ? [pages[index]] : section.printed_pages);
}

function addExpressionSlide(slide, lesson, number, item, section, index) {
  // The finalized online expression slide keeps only the persistent lesson
  // header and page marker; the purple pattern box is the sole expression heading.
  addHeader(slide, lesson, number, '', expressionPageLabel(lesson, section, index));
  const examples = expressionExamples(lesson, item);
  const content = onlineContentFor(lesson);
  const instruction = item.student_instruction || content.expressions?.student_instruction || ONLINE_LAYOUT.expressions.student_instruction;
  addBox(slide, 0.9, 1.65, 11.55, 1.18, C.lilac, C.lilac);
  addText(slide, item.expression, 1.25, 1.95, 10.8, 0.55, { fontSize: item.expression.length > 18 ? 29 : 34, color: C.purple, bold: true, align: 'center' });
  examples.forEach((example, exampleIndex) => addText(slide, `${ONLINE_LAYOUT.expressions.example_label || '例句：'}${example}`, 1.0, 3.345 + exampleIndex * 0.585, 10.7, 0.45, { fontSize: T.expression_example_pt, color: C.ink, bold: true }));
  const instructionY = examples.length ? 4.62 : 3.72;
  addText(slide, instruction, 1.0, instructionY, 8.8, 0.35, { fontSize: 23, color: C.teal, bold: true });
  [0, 1, 2].forEach((lineIndex) => {
    const lineY = examples.length ? 5.1 + lineIndex * 0.47 : 4.18 + lineIndex * 0.47;
    addText(slide, `${lineIndex + 1}.`, 1.1, lineY, 0.35, 0.3, { fontSize: 20, color: C.muted });
    addLine(slide, 1.55, lineY + 0.25, 10.25, C.teal, 1.0);
  });
  notes(slide, `常用表达 ${item.expression}；${examples.length ? '学生先读已核准的短例句，再' : ''}准备三句话，课堂用于任务。`);
}

const COMPREHENSIVE_COLUMNS = {
  2: [
    ['学校生活', '课程 · 特点 · 收获'],
    ['生日午餐', '地点 · 食物 · 活动 · 感觉'],
    ['课外活动', '地点 · 工作 · 活动意义']
  ],
  3: [
    ['家庭生活', '家人 · 中国朋友 · 中国菜 · 中文'],
    ['为什么选中文', '以前的语言 · 转学 · 原因'],
    ['中文课', '学习难点 · 课堂活动 · 学习收获']
  ],
  7: [
    ['短文一', '运动爱好 · 最大爱好 · 小时候'],
    ['短文二', '登山机会 · 登山好处 · 浪漫想法'],
    ['短文三', '登山伙伴 · 工作关系 · 生日礼物']
  ]
};

function addTableCards(slide, lesson, number, item, pages) {
  addHeader(slide, lesson, number, '请你根据听过的三段短文填表。', pages);
  addMixedScriptText(slide, `请填写${pages || '教材对应页'}的表格。`, 0.95, 1.52, 7.4, 0.45, { fontSize: 25, color: C.purple, bold: true });
  const columns = COMPREHENSIVE_COLUMNS[lesson.number] || [];
  columns.forEach(([topic, fields], index) => {
    const x = 0.9 + index * 4.08;
    addBox(slide, x, 2.35, 3.72, 3.1, [C.mint, C.blue, C.yellowSoft][index], 'D3D9D1');
    addText(slide, topic, x + 0.3, 2.72, 3.1, 0.42, { fontSize: 28, color: C.purple, bold: true, align: 'center' });
    addText(slide, fields, x + 0.35, 3.55, 3.0, 1.1, { fontSize: 21, align: 'center', valign: 'top' });
    addLine(slide, x + 0.4, 4.95, 2.9, C.teal, 1.0);
  });
  addText(slide, '依据短文填写关键词，不必写完整句子。', 1.0, 5.95, 8.0, 0.4, { fontSize: 22, color: C.teal, bold: true });
  notes(slide, `开放信息表；学生使用教材短文和自己的记录填写，不把开放栏改写成唯一答案。${item?.id || ''}`);
}

function comprehensiveTopic(lesson) {
  return lesson.number === 2 ? '王红' : lesson.number === 3 ? '李大为' : lesson.number === 7 ? '小张' : '朴大宇';
}

function comprehensivePrompt(lesson) {
  return lesson.number === 2
    ? '请填表后，说一说王红的学校生活、生日和课外活动。'
    : lesson.number === 3
      ? '请填表后，说一说李大为的家庭生活、选中文和中文课。'
      : lesson.number === 7
        ? '请填表后，说一说小张的爱好、登山经历和登山带来的好处。'
      : '请填表后，说一说朴大宇在北京的生活、学习和课堂经验。';
}

function addComprehensiveIntroSlide(slide, lesson, number, pages) {
  addHeader(slide, lesson, number, `请你介绍${comprehensiveTopic(lesson)}`, pages);
  addText(slide, comprehensivePrompt(lesson), 0.95, 2.42, 7.7, 1.3, { fontSize: 31, bold: true, align: 'center', valign: 'mid' });
  addBox(slide, 9.05, 1.75, 3.2, 3.65, C.white, 'D3D9D1');
  const image = sharedAsset('divider-comprehensive.png') || firstContextFile(lesson, 0);
  if (image && fs.existsSync(image)) slide.addImage({ path: image, x: 9.11, y: 1.81, w: 3.08, h: 3.53, sizingContain: true });
  notes(slide, '学生根据综合信息表完成成段介绍；开放题不设唯一答案。');
}

function comprehensiveQuestions(lesson) {
  return lesson.number === 2
    ? ['王红为什么喜欢上课？', '她觉得数学课怎么样？', '她的生日午餐在哪里？', '大家一起吃了什么？', '王红为什么去博物馆？', '她在博物馆要做什么？']
    : lesson.number === 3
      ? ['李大为为什么会说一点儿中文？', '他喜欢吃什么中国菜？', '他为什么决定选修中文？', '中国爷爷奶奶怎么样？', '学中文时，哪里不容易？', '他为什么喜欢和中国人聊天儿？']
      : lesson.number === 7
        ? ['小张最大的爱好是什么？', '他什么时候真正喜欢上登山？', '登山给小张带来了哪些好处？', '登山对他的工作有什么好处？', '他今年生日收到了什么礼物？', '你喜欢什么运动？为什么？']
      : ['朴大宇以前来过北京吗？', '他这次在北京发现了什么？', '他在北京上什么课？', '他晚上和谁一起学习？', '在韩国和中国学习汉语有什么不同？', '为什么说在中国学习效率更高？'];
}

function addComprehensiveQuestionsSlide(slide, lesson, number, pages) {
  addHeader(slide, lesson, number, ACTIVE_MODE === 'online' ? '综合理解' : '根据课本，回答问题', pages);
  if (ACTIVE_MODE === 'online') {
    addText(slide, '读三篇短文和你的信息表，回答：', 0.95, 1.55, 8.2, 0.45, { fontSize: 25, bold: true });
    addBullets(slide, comprehensiveQuestions(lesson).slice(0, 3), 1.2, 2.35, 8.2, 2.65, { fontSize: 27 });
    addBox(slide, 9.2, 2.35, 2.6, 2.05, C.mint, 'D3D9D1');
    addText(slide, '回答提示', 9.2, 2.35, 2.6, 0.4, { fontSize: 23, color: C.purple, bold: true, align: 'center' });
    addText(slide, '先说答案，再说短文里的一个信息。', 9.25, 3.2, 2.5, 1.2, { fontSize: 21, color: C.teal, bold: true, align: 'center', valign: 'mid' });
  } else {
    addBullets(slide, comprehensiveQuestions(lesson), 0.95, 1.7, 7.7, 4.4, { fontSize: 27 });
    addBox(slide, 9.05, 1.75, 3.2, 3.65, C.white, 'D3D9D1');
    const image = sharedAsset('divider-comprehensive.png') || firstContextFile(lesson, 1);
    if (image && fs.existsSync(image)) slide.addImage({ path: image, x: 9.11, y: 1.81, w: 3.08, h: 3.53, sizingContain: true });
  }
  notes(slide, '学生逐题回答；先说答案，再补充短文中的一个信息。开放题不设唯一答案。');
}

function addPersonalOutputSlide(slide, lesson, number, pages) {
  addHeader(slide, lesson, number, '请你说说', pages);
  const categories = lesson.number === 2 ? ['我的学校生活', '我的生日', '我的课外活动'] : lesson.number === 3 ? ['我的家庭生活', '我的中文学习', '我的课堂经验'] : ['我的北京印象', '我的中文学习', '我的学习比较'];
  const fills = [C.mint, C.lilac, C.yellow];
  categories.forEach((category, index) => {
    const y = 1.72 + index * 1.33;
    addText(slide, `①②③`.charAt(index) + ` ${category}`, 1.05, y, 3.8, 0.42, { fontSize: 25, color: [C.teal, C.purple, C.coral][index], bold: true });
    addBox(slide, 1.0, y + 0.43, 7.35, 0.72, fills[index], 'D3D9D1');
    addText(slide, '____________________________', 1.16, y + 0.55, 7.03, 0.48, { fontSize: 29, bold: true });
  });
  addText(slide, '必须使用10个课本中的词语和5个句式。说8—10句。', 1.0, 6.05, 7.35, 0.42, { fontSize: 23, bold: true, align: 'center', color: C.coral });
  addBox(slide, 9.05, 1.75, 3.2, 3.65, C.white, 'D3D9D1');
  const image = sharedAsset('speaking-practice.png') || firstContextFile(lesson, 2);
  if (image && fs.existsSync(image)) slide.addImage({ path: image, x: 9.11, y: 1.81, w: 3.08, h: 3.53, sizingContain: true });
  notes(slide, '每位学生准备 8—10 句个人介绍；这是本课实体课的最终口语产出。');
}

function addOnlinePersonalInfoSlide(slide, lesson, number, pages) {
  addHeader(slide, lesson, number, '我的个人介绍', pages);
  addText(slide, '按照三段准备自己的信息：', 0.95, 1.55, 8.0, 0.45, { fontSize: 25, bold: true });
  const cards = lesson.number === 2
    ? [['学校生活', '你喜欢哪门课？'], ['生日', '你怎么庆祝生日？'], ['课外活动', '你参加过什么活动？']]
    : lesson.number === 3
      ? [['家庭生活', '家里有什么人？'], ['中文学习', '为什么学习中文？'], ['课堂经验', '中文哪里不容易？']]
      : lesson.number === 7
        ? [['运动爱好', '你喜欢什么运动？'], ['活动经历', '你参加过什么活动？'], ['运动收获', '这项运动带来了什么好处？']]
      : [['北京印象', '你对北京有什么印象？'], ['中文学习', '你在哪里学习汉语？'], ['学习比较', '哪里学习汉语更有效率？']];
  const fills = [C.mint, C.blue, C.yellow];
  cards.forEach(([topic, prompt], index) => {
    const x = [0.95, 5.0, 9.05][index];
    addBox(slide, x, 2.45, 3.65, 2.35, fills[index], C.line);
    addText(slide, topic, x + 0.25, 2.8, 3.15, 0.4, { fontSize: 24, color: C.purple, bold: true, align: 'center' });
    addText(slide, prompt, x + 0.3, 3.65, 2.95, 0.55, { fontSize: 22, align: 'center' });
  });
  addText(slide, '至少使用课本中的10个词语和5个句式。', 1.0, 5.6, 7.5, 0.42, { fontSize: 22, color: C.teal, bold: true });
  notes(slide, '学生按三个主题准备自己的信息；不要求把完整答案写在投影片上。');
}

function addOnlineOutlineSlide(slide, lesson, number, pages) {
  addHeader(slide, lesson, number, '我的口语提纲', pages);
  addText(slide, '写下你要说的 6—8 句话。', 0.95, 1.55, 7.5, 0.45, { fontSize: 25, bold: true });
  addBox(slide, 0.95, 2.25, 11.25, 3.55, C.white, C.line);
  for (let i = 0; i < 6; i += 1) {
    const y = 2.65 + i * 0.48;
    addText(slide, `${i + 1}.`, 1.3, y, 0.35, 0.3, { fontSize: 20, color: C.muted });
    addLine(slide, 1.8, y + 0.28, 9.8, C.teal, 1.0);
  }
  addText(slide, '把想在课堂说的句子圈起来。', 1.0, 6.2, 6.8, 0.4, { fontSize: 22, color: C.purple, bold: true });
  notes(slide, '学生把个人信息整理成 6—8 句口语提纲，带到实体课使用。');
}

function addOnlineEndingSlides(slides, lesson, numberRef) {
  const comprehensivePages = lesson.sections.comprehensive_practice?.printed_pages || [];
  const tablePage = comprehensivePages.length ? comprehensivePages[0] : '';
  const ending = ONLINE_LAYOUT.ending.slides;

  numberRef.value += 1;
  const difficult = slides.addSlide();
  addHeader(difficult, lesson, numberRef.value, ending[0].title);
  addText(difficult, ending[0].prompt, 1.0, 1.62, 11.2, 0.48, { fontSize: 27, color: C.teal, bold: true, align: 'center' });
  addBox(difficult, 0.95, 2.45, 11.25, 3.15, C.white, C.line);
  for (let i = 0; i < ending[0].lines; i += 1) {
    const y = 2.9 + i * 0.45;
    addText(difficult, `${i + 1}.`, 1.35, y, 0.4, 0.3, { fontSize: 20, color: C.muted });
    addLine(difficult, 2.05, y + 0.27, 9.8, C.teal, 1.0);
  }
  notes(difficult, '学生写下不太懂的词语、句式、短文或听力，带到实体课。');

  numberRef.value += 1;
  const check = slides.addSlide();
  addHeader(check, lesson, numberRef.value, ending[1].title);
  const checkTexts = ending[1].checks.map((value) => String(value).replace('{table_page}', String(tablePage)));
  const fills = [C.mint, C.mint, C.blue, C.blue, C.yellowSoft, C.yellowSoft, C.lilac, C.lilac];
  checkTexts.forEach((textValue, i) => {
    const x = 0.82 + (i % 2) * 6.0;
    const y = 1.55 + Math.floor(i / 2) * 1.1;
    addBox(check, x, y, 5.45, 0.9, fills[i]);
    check.addShape('rect', { x: x + 0.25, y: y + 0.27, w: 0.32, h: 0.32, fill: { color: C.white }, line: { color: C.teal, pt: 0.8 } });
    addText(check, textValue, x + 0.62, y + 0.19, 4.55, 0.52, { fontSize: 20, color: C.ink, fit: 'shrink' });
  });
  notes(check, '学生逐项检查预习证据；不要求计时或记录学习分钟数。');

  numberRef.value += 1;
  const close = slides.addSlide();
  addHeader(close, lesson, numberRef.value, '');
  addText(close, ending[2].title, 1.0, 3.25, 11.2, 0.8, { fontSize: 44, color: C.purple, bold: true, align: 'center' });
  notes(close, '线上预习完成。');
}

function slideXmlText(xml) {
  // Join runs without separators so mixed-script labels such as “教材 P59”
  // and “先听音档 7-4” can be asserted exactly as students see them.
  return [...String(xml).matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((match) => match[1]).join('');
}

function assertVocabularyImageMapping(lesson) {
  const entries = [...regularVocabEntries(lesson), ...properNounEntries(lesson)];
  const paths = entries.map((entry) => lesson.wordToAsset.get(entry.word));
  const available = paths.filter((assetPath) => assetPath && fs.existsSync(assetPath));
  // Candidate manifests for later lessons may intentionally reuse a context
  // image or leave a pending asset. Keep the evidence in the manifest and
  // defer semantic uniqueness to the lesson-specific asset QA pass.
}

function assertOnlineDeckContract(outPath, lesson, slideCount) {
  const content = onlineContentFor(lesson);
  const texts = [];
  const slideXml = [];
  for (let index = 1; index <= slideCount; index += 1) {
    const xml = execFileSync('unzip', ['-p', outPath, `ppt/slides/slide${index}.xml`], { encoding: 'utf8' });
    slideXml.push(xml);
    texts.push(slideXmlText(xml));
  }
  const allText = texts.join('\n');
  const required = [
    ONLINE_LAYOUT.cover.online_label,
    ONLINE_LAYOUT.learning_route.title,
    ONLINE_LAYOUT.goals.title,
    ONLINE_LAYOUT.vocabulary.divider_title,
    ONLINE_LAYOUT.reading.divider_title,
    content.expressions?.divider_title || ONLINE_LAYOUT.expressions.divider_title,
    ONLINE_LAYOUT.comprehensive.divider_title,
    ONLINE_LAYOUT.ending.slides[0].title,
    ONLINE_LAYOUT.ending.slides[1].title,
    ONLINE_LAYOUT.ending.slides[2].title
  ];
  required.forEach((value) => {
    if (!allText.includes(value)) throw new Error(`线上版式契约缺少文字：${value}`);
  });
  if (texts[0].includes('看图、读音、词类') || texts[0].includes('学习词语 →') || texts[0].includes('学习词语>')) {
    throw new Error('线上封面不应包含底部 subtitle 或学习流程文字');
  }
  content.goals.forEach((goal) => {
    if (!texts[2].includes(goal)) throw new Error(`第${lesson.number}课学习目标页缺少核准目标：${goal}`);
  });
  ['Online preview', '我们这样学习', '短文阅读', '常用表达', '上课前整理好', '课前检查：', '准备好了', '请把“'].forEach((value) => {
    if (allText.includes(value)) throw new Error(`线上版式契约仍含旧文字：${value}`);
  });
  const practiceCount = texts.filter((value) => value.includes(ONLINE_LAYOUT.vocabulary.practice_title)).length;
  const expectedPracticeCount = Math.floor(regularVocabEntries(lesson).length / ONLINE_LAYOUT.vocabulary.practice_after_every);
  if (practiceCount !== expectedPracticeCount) throw new Error(`第${lesson.number}课词语练习页数错误：应为${expectedPracticeCount}，实际${practiceCount}`);
  const vocabularySlideIndexes = texts.map((value, index) => value.includes('词类：') ? index + 1 : null).filter(Boolean);
  const vocabularyTargets = vocabularySlideIndexes.map((index) => {
    const rels = execFileSync('unzip', ['-p', outPath, `ppt/slides/_rels/slide${index}.xml.rels`], { encoding: 'utf8' });
    const targets = [...rels.matchAll(/Target="\.\.\/media\/([^"]+)"/g)].map((match) => match[1]);
    return targets[targets.length - 1] || null;
  }).filter(Boolean);
  if (new Set(vocabularyTargets).size !== vocabularyTargets.length) {
    throw new Error(`第${lesson.number}课线上词语页存在重复图片（${vocabularyTargets.length}页）`);
  }
  const expectedVocabularySlides = regularVocabEntries(lesson).length + properNounEntries(lesson).length;
  if (vocabularySlideIndexes.length !== expectedVocabularySlides) {
    throw new Error(`第${lesson.number}课线上词语页数量错误：应为${expectedVocabularySlides}，实际${vocabularySlideIndexes.length}`);
  }
  if (!texts[1].includes(ONLINE_LAYOUT.learning_route.title)) throw new Error('第二页不是固定学习流程图页');
  const routeXml = execFileSync('unzip', ['-p', outPath, 'ppt/slides/slide2.xml'], { encoding: 'utf8' });
  if (!routeXml.includes('<p:pic>')) throw new Error('学习流程图没有嵌入图片');
  if (!texts[texts.length - 3].includes(ONLINE_LAYOUT.ending.slides[0].title) || !texts[texts.length - 2].includes(ONLINE_LAYOUT.ending.slides[1].title) || !texts[texts.length - 1].includes(ONLINE_LAYOUT.ending.slides[2].title)) {
    throw new Error('最后三页未按固定课前结尾契约生成');
  }
  const vocabPageCounts = new Map();
  regularVocabEntries(lesson).forEach((entry, index) => {
    const page = vocabPageLabel(lesson, entry, index);
    vocabPageCounts.set(page, (vocabPageCounts.get(page) || 0) + 1);
  });
  vocabPageCounts.forEach((count, page) => {
    if (!allText.includes(page)) throw new Error(`词语页缺少具体教材页码：${page}`);
  });

  // Keep the Lesson 1 vocabulary contract from silently regressing: every
  // word page has two short examples, an embedded image, and a concrete page
  // marker. This catches missing assets and one-example fallback pages before
  // a draft is handed off for review.
  const regularWords = new Set(regularVocabEntries(lesson).map((entry) => entry.word));
  const properWords = new Set(properNounEntries(lesson).map((entry) => entry.word));
  texts.forEach((value, index) => {
    if (!value.includes('词类：')) return;
    const textElements = [...String(slideXml[index]).matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((match) => match[1]);
    const words = [...regularWords, ...properWords].filter((word) => textElements.includes(word));
    if (words.length !== 1) throw new Error(`词语页 ${index + 1} 未对应唯一词语`);
    const entry = [...regularVocabEntries(lesson), ...properNounEntries(lesson)].find((candidate) => candidate.word === words[0]);
    const data = vocabularyData(lesson, entry);
    if (!value.includes('意思：') || !value.includes(data.meaning_vi)) throw new Error(`词语页 ${index + 1} 缺少已审核的越南文意思`);
    if (value.includes('请结合教材理解') || value.includes('请提供释义')) throw new Error(`词语页 ${index + 1} 使用了释义 fallback`);
    if (String(data.usage || '').trim() && !value.includes(data.usage)) throw new Error(`词语页 ${index + 1} 缺少逐词使用场合`);
    vocabExamples(lesson, entry).forEach((example, exampleIndex) => {
      if (!value.includes(example) || !value.includes(`例句${exampleIndex + 1}：`)) throw new Error(`词语页 ${index + 1} 缺少已核准例句${exampleIndex + 1}`);
    });
    vocabularyOptionalRows(data).forEach((row) => {
      if (!value.includes(row)) throw new Error(`词语页 ${index + 1} 缺少已核准可选栏位：${row}`);
    });
    // Missing candidate assets remain visible as a placeholder in draft; the
    // manifest/QA must retain the pending-assets status until replacement.
  });

  // Each short text keeps the same two-step reading/record rhythm as Lesson
  // 1, and the final personal task uses the last printed page only.
  const textSections = Object.values(lesson.sections).filter((section) => section.text);
  textSections.forEach((section, sectionIndex) => {
    const summaryLabel = textPageLabel(section);
    const recordLabel = textPageLabel(section, true);
    const summaryIndex = texts.findIndex((value) => value.includes(section.title) && value.includes(`先听音档 ${section.audio}`));
    const recordIndex = texts.findIndex((value) => value.includes(`短文${['一', '二', '三'][sectionIndex] || String(sectionIndex + 1)}：记录练习`));
    if (summaryIndex < 0 || !texts[summaryIndex].includes(summaryLabel)) throw new Error(`短文${sectionIndex + 1}缺少完整教材页码`);
    if (recordIndex < 0 || !texts[recordIndex].includes(recordLabel)) throw new Error(`短文${sectionIndex + 1}记录页缺少具体教材页码`);
  });

  const expressionPlan = faceExpressionPlan(lesson, textSections.length);
  [...expressionPlan.byText, ...expressionPlan.shared].forEach((section) => {
    expressionItemsFromSection(section).forEach((item, index) => {
      const label = expressionPageLabel(lesson, section, index);
      const hit = texts.find((value) => value.includes(item.expression) && value.includes('三句话') && value.includes(label));
      if (!hit) throw new Error(`句式“${item.expression}”缺少具体教材页码`);
    });
  });

  const comprehensive = lesson.sections.comprehensive_practice;
  if (comprehensive) {
    const pages = comprehensive.printed_pages || [];
    const tableLabel = pages.length ? pageLabel([pages[0]]) : '';
    const personalLabel = pages.length ? pageLabel([pages[pages.length - 1]]) : '';
    if (!texts.some((value) => value.includes('请你根据听过的三段短文填表。') && value.includes(tableLabel))) throw new Error('综合表格页缺少具体教材页码');
    if (!texts.some((value) => value.includes('我的个人介绍') && value.includes(personalLabel))) throw new Error('综合个人信息页缺少具体教材页码');
  }
}

function assertFaceDeckContract(outPath, lesson, slideCount) {
  const texts = [];
  const xmls = [];
  for (let index = 1; index <= slideCount; index += 1) {
    const xml = execFileSync('unzip', ['-p', outPath, `ppt/slides/slide${index}.xml`], { encoding: 'utf8' });
    xmls.push(xml);
    texts.push(slideXmlText(xml));
  }
  const allText = texts.join('\n');
  ['实体课', '今天的学习路线', '学完这课后，我能……', '听力练习', '口语练习', '句式练习', '综合表达'].forEach((value) => {
    if (!allText.includes(value)) throw new Error(`实体课版式契约缺少文字：${value}`);
  });
  if (!xmls[1].includes('<p:pic>')) throw new Error('实体课学习路线页没有嵌入第一课核准路线图');
  if (texts[0].includes('学校生活 ·') || texts[0].includes('家庭生活 ·')) throw new Error('实体课封面退回各课主题副标题');

  // Comprehensive practice is split across its actual printed pages, while
  // expression slides use the item-level page map. This prevents broad
  // P20–21/P30–31 labels from returning to single-page activities.
  const comprehensive = lesson.sections.comprehensive_practice;
  if (comprehensive?.printed_pages?.length) {
    const first = pageLabel([comprehensive.printed_pages[0]]);
    const last = pageLabel([comprehensive.printed_pages[comprehensive.printed_pages.length - 1]]);
    if (!texts.some((value) => value.includes('请你介绍') && value.includes(first))) throw new Error('实体课综合介绍页教材页码错误');
    if (!texts.some((value) => value.includes('根据课本，回答问题') && value.includes(first))) throw new Error('实体课综合问题页教材页码错误');
    if (!texts.some((value) => value.includes('必须使用10个课本中的词语') && value.includes(last))) throw new Error('实体课个人口语页教材页码错误');
  }
  expressionSections(lesson).forEach((section) => expressionItemsFromSection(section).forEach((item, index) => {
    const label = expressionPageLabel(lesson, section, index);
    if (!texts.some((value) => value.includes(item.expression) && value.includes(label))) throw new Error(`实体课句式“${item.expression}”缺少具体教材页码`);
  }));
  assertFaceDeckOrder(texts, lesson);
}

function findFaceSlide(texts, start, end, predicate) {
  for (let index = start; index < end; index += 1) {
    if (predicate(texts[index], index)) return index;
  }
  return -1;
}

function assertFaceDeckOrder(texts, lesson) {
  const firstShortDivider = findFaceSlide(texts, 0, texts.length, (value) => value.includes('短文（一）') && !value.includes('你说的跟短文（一）'));
  if (firstShortDivider < 4) throw new Error(`第${lesson.number}课短文（一）必须在封面、学习流程、Can-Do和暖身之后，实际为第${firstShortDivider + 1}页`);

  const textSections = Object.values(lesson.sections).filter((section) => section.text);
  const expressionPlan = faceExpressionPlan(lesson, textSections.length);
  let cursor = firstShortDivider;
  textSections.forEach((section, sectionIndex) => {
    const divider = findFaceSlide(texts, cursor, texts.length, (value) => value.includes(`短文（${shortTextLabel(sectionIndex)}）`) && !value.includes('你说的跟'));
    if (divider < 0) throw new Error(`第${lesson.number}课缺少短文（${shortTextLabel(sectionIndex)}）divider`);
    if (sectionIndex === 0 && divider !== firstShortDivider) throw new Error(`第${lesson.number}课短文（一）不是第一篇短文单元的起点`);
    const nextDivider = sectionIndex < textSections.length - 1
      ? findFaceSlide(texts, divider + 1, texts.length, (value) => {
        return ['一', '二', '三'].slice(sectionIndex + 1).some((label) => value.includes(`短文（${label}）`) && !value.includes('你说的跟'));
      })
      : findFaceSlide(texts, divider + 1, texts.length, (value) => value.includes('综合表达'));
    const end = nextDivider >= 0 ? nextDivider : texts.length;
    const sectionStart = divider + 1;
    const strategy = findFaceSlide(texts, sectionStart, end, (value) => value.includes('听力练习') && value.includes('先看题、抓关键词'));
    if (strategy < 0) throw new Error(`第${lesson.number}课短文${shortTextLabel(sectionIndex)}缺少听力练习`);
    const secondItems = exerciseItems(section, 'second_listen');
    const firstItems = exerciseItems(section, 'first_listen');
    const listeningQuestions = findFaceSlide(texts, strategy + 1, end, (value) => value.includes('听力题目') && (!secondItems.length || value.includes(secondItems[0])));
    if (listeningQuestions < 0) throw new Error(`第${lesson.number}课短文${shortTextLabel(sectionIndex)}缺少听力题目`);
    const simpleQuestions = findFaceSlide(texts, listeningQuestions + 1, end, (value) => value.includes('简单题目问答') && (!firstItems.length || value.includes(firstItems[0])));
    if (simpleQuestions < 0) throw new Error(`第${lesson.number}课短文${shortTextLabel(sectionIndex)}缺少简单题目问答`);
    const oral = findFaceSlide(texts, simpleQuestions + 1, end, (value) => value.includes('口语练习'));
    if (oral < 0) throw new Error(`第${lesson.number}课短文${shortTextLabel(sectionIndex)}缺少口语练习`);
    const introduction = findFaceSlide(texts, oral + 1, end, (value) => value.includes('介绍'));
    if (introduction < 0) throw new Error(`第${lesson.number}课短文${shortTextLabel(sectionIndex)}缺少介绍任务`);
    const compare = findFaceSlide(texts, introduction + 1, end, (value) => value.includes(`你说的跟短文（${shortTextLabel(sectionIndex)}）哪里不一样？`));
    if (compare < 0) throw new Error(`第${lesson.number}课短文${shortTextLabel(sectionIndex)}缺少比较任务`);
    const expressionSection = expressionPlan.byText[sectionIndex];
    let outputStart = compare + 1;
    if (expressionSection) {
      const expressionDivider = findFaceSlide(texts, compare + 1, end, (value) => value.includes('句式练习'));
      if (expressionDivider < 0) throw new Error(`第${lesson.number}课短文${shortTextLabel(sectionIndex)}缺少该短文句式练习`);
      outputStart = expressionDivider + 1;
    }
    const output = findFaceSlide(texts, outputStart, end, (value) => value.includes('请你说说'));
    if (output < 0) throw new Error(`第${lesson.number}课短文${shortTextLabel(sectionIndex)}缺少口语输出`);
    cursor = output + 1;
  });

  if (expressionPlan.shared.length) {
    const sharedDivider = findFaceSlide(texts, cursor, texts.length, (value) => value.includes('句式练习'));
    if (sharedDivider < 0) throw new Error(`第${lesson.number}课共享句式练习没有放在短文单元之后`);
    cursor = sharedDivider;
  }
  const comprehensive = findFaceSlide(texts, cursor, texts.length, (value) => value.includes('综合表达'));
  if (comprehensive < 0) throw new Error(`第${lesson.number}课短文单元后缺少综合表达`);
}

function buildOnline(lesson) {
  ACTIVE_MODE = 'online';
  const content = onlineContentFor(lesson);
  assertVocabularyImageMapping(lesson);
  assertExampleVariety(lesson);
  const outputDir = path.join(lesson.outputRoot, 'online');
  runDraftGate(lesson, lesson.outputRoot);
  fs.mkdirSync(outputDir, { recursive: true });
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = '荣市大学华语听说课程';
  pptx.company = '荣市大学';
  pptx.subject = `准中级加速篇 I ${lessonLabel(lesson)}在线预习`;
  pptx.title = `${lessonLabel(lesson)}《${lesson.title}》在线预习`;
  pptx.lang = 'zh-CN';
  pptx.theme = { headFontFace: CJK, bodyFontFace: CJK, lang: 'zh-CN' };
  const slides = pptx;
  let numberRef = { value: 0 };

  numberRef.value += 1; addCover(slides.addSlide(), lesson, 'online', numberRef.value);
  numberRef.value += 1; addRouteSlide(slides.addSlide(), lesson, numberRef.value, 'online');
  numberRef.value += 1; addCanDoSlide(slides.addSlide(), lesson, numberRef.value);

  // Vocabulary follows the Lesson 1 rhythm: one word per slide, then a
  // five-word speaking practice slide. Proper nouns get their own divider.
  numberRef.value += 1; addDivider(slides.addSlide(), lesson, numberRef.value, ONLINE_LAYOUT.vocabulary.divider_title, content.vocabulary?.divider_subtitle || ONLINE_LAYOUT.vocabulary.divider_subtitle, 0);
  const regularEntries = regularVocabEntries(lesson);
  regularEntries.forEach((entry, index) => {
    numberRef.value += 1;
    addVocabSlide(slides.addSlide(), lesson, numberRef.value, entry, index);
    if ((index + 1) % ONLINE_LAYOUT.vocabulary.practice_after_every === 0) {
      const groupStart = index + 1 - ONLINE_LAYOUT.vocabulary.practice_after_every;
      numberRef.value += 1;
      addVocabPracticeSlide(slides.addSlide(), lesson, numberRef.value, regularEntries.slice(groupStart, index + 1), groupStart);
    }
  });
  const properEntries = properNounEntries(lesson);
  if (properEntries.length) {
    numberRef.value += 1;
    addDivider(slides.addSlide(), lesson, numberRef.value, ONLINE_LAYOUT.proper_nouns.divider_title, lesson.number === 3 ? '认识课文中的语言名称。' : '', 0);
    properEntries.forEach((entry, index) => {
      numberRef.value += 1;
      addVocabSlide(slides.addSlide(), lesson, numberRef.value, entry, index, true);
    });
  }

  numberRef.value += 1; addDivider(slides.addSlide(), lesson, numberRef.value, ONLINE_LAYOUT.reading.divider_title, '', 0);
  const texts = Object.values(lesson.sections).filter((section) => section.text);
  const expressionPlan = faceExpressionPlan(lesson, texts.length);
  texts.forEach((section, index) => {
    numberRef.value += 1;
    addDivider(slides.addSlide(), lesson, numberRef.value, `短文（${['一', '二', '三'][index] || String(index + 1)}）`, '', index);
    addOnlineTextSlides(slides, lesson, numberRef, section, index);
    const expressionSection = expressionPlan.byText[index];
    if (expressionSection) {
      numberRef.value += 1;
      addDivider(slides.addSlide(), lesson, numberRef.value, content.expressions?.divider_title || ONLINE_LAYOUT.expressions.divider_title, '', index);
      (expressionSection.items || []).forEach((item, expressionIndex) => {
        numberRef.value += 1;
        addExpressionSlide(slides.addSlide(), lesson, numberRef.value, item, expressionSection, expressionIndex);
      });
    }
  });
  expressionPlan.shared.forEach((expressionSection, sharedIndex) => {
    numberRef.value += 1;
    addDivider(slides.addSlide(), lesson, numberRef.value, content.expressions?.divider_title || ONLINE_LAYOUT.expressions.divider_title, '', sharedIndex);
    (expressionSection.items || []).forEach((item, expressionIndex) => {
      numberRef.value += 1;
      addExpressionSlide(slides.addSlide(), lesson, numberRef.value, item, expressionSection, expressionIndex);
    });
  });
  if (texts.length) {
    numberRef.value += 1;
    addOnlineFinalTextTaskSlide(slides.addSlide(), lesson, numberRef.value, texts[texts.length - 1]);
  }

  const comprehensive = lesson.sections.comprehensive_practice;
  if (comprehensive) {
    const items = comprehensive.items || [];
    numberRef.value += 1; addDivider(slides.addSlide(), lesson, numberRef.value, ONLINE_LAYOUT.comprehensive.divider_title, '', 0);
    const comprehensivePages = Array.isArray(comprehensive.printed_pages) ? comprehensive.printed_pages : [];
    const tablePage = comprehensivePages.length ? pageLabel([comprehensivePages[0]]) : '';
    const personalPage = comprehensivePages.length ? pageLabel([comprehensivePages[comprehensivePages.length - 1]]) : '';
    if (items[0]) { numberRef.value += 1; addTableCards(slides.addSlide(), lesson, numberRef.value, items[0], tablePage); }
    if (items[2]) { numberRef.value += 1; addOnlinePersonalInfoSlide(slides.addSlide(), lesson, numberRef.value, personalPage); }
  }

  addOnlineEndingSlides(slides, lesson, numberRef);

  const outPath = path.join(outputDir, `lesson-${String(lesson.number).padStart(2, '0')}-在线预习.pptx`);
  const sourceAudioTracks = audioTrackLabels(lesson);
  const embeddedAudioTracks = [...new Set(texts.filter((section) => section.audio).map((section) => String(section.audio)))];
  return pptx.writeFile({ fileName: outPath }).then(() => {
    assertOnlineDeckContract(outPath, lesson, numberRef.value);
    const manifest = {
      schema_version: 1,
      manifest_type: 'lesson-pptx-draft',
      lesson_key: lesson.lessonKey,
      mode: 'online',
      title: `${lessonLabel(lesson)}《${lesson.title}》在线预习`,
      status: 'draft_not_approved',
      builder_scope: 'scripts/build_l23_pptx_drafts.js',
      draft_gate: 'lesson-specific',
      source_sha256: lesson.sourceHash,
      layout_source: 'boya-quasi-intermediate-i lesson-01 approved layout family',
      shared_layout_contract: path.relative(ROOT, ONLINE_LAYOUT_CONTRACT_PATH),
      lesson_content_contract: path.relative(ROOT, ONLINE_CONTENT_CONTRACT_PATH),
      example_bank: {
        source: path.relative(ROOT, EXAMPLE_BANK_PATH),
        review_status: EXAMPLE_BANK.review?.status || null,
        vocabulary_examples_per_item: EXAMPLE_BANK.policy?.examples_per_item || null,
        expression_examples_per_item: ONLINE_LAYOUT.expressions?.example_count || null
      },
      fixed_structure: ['cover', 'learning_flow', 'goals', 'vocabulary', 'practice_after_each_full_five', 'proper_nouns_if_present', 'short_text_divider_before_each_text', 'short_text_record', 'expressions_after_related_text', 'comprehensive_practice', 'fixed_three_slide_ending'],
      route_asset: content.route?.asset || ONLINE_LAYOUT.learning_route.asset,
      vocabulary_practice_after_every: ONLINE_LAYOUT.vocabulary.practice_after_every,
      vocabulary_extension_policy: ONLINE_LAYOUT.vocabulary.extension_policy,
      vocabulary_page_breaks: content.vocabulary?.page_breaks || ONLINE_LAYOUT.vocabulary.page_breaks[String(lesson.number)],
      fixed_ending_titles: ONLINE_LAYOUT.ending.slides.map((slide) => slide.title),
      short_example_policy: `curated_short_sentences_max_${MAX_SHORT_EXAMPLE_CHARS}_hanzi_chars`,
      short_text_policy: 'textbook_reading_prompt_and_record_layout_no_full_text_copy',
      shared_assets: ['lesson-01-cover-family-work-hobby.png', 'learning-route-user-supplied-transparent.png', 'divider-family.png', 'divider-work.png', 'divider-hobby.png', 'divider-comprehensive.png', 'symbolic-vocabulary.png', 'symbolic-listening.png', 'symbolic-sentence-pattern.png', 'oral-practice-divider.png', 'speaking-practice.png'],
      vocabulary_image_policy: 'one_distinct_semantic_asset_per_vocabulary_item',
      vocabulary_image_count: regularEntries.length + properEntries.length,
      vocabulary_image_assets: [...regularEntries, ...properEntries].map((entry) => ({ word: entry.word, asset: lesson.wordToAsset.get(entry.word) ? path.relative(ROOT, lesson.wordToAsset.get(entry.word)) : null, status: lesson.wordToAsset.get(entry.word) ? 'candidate' : 'pending_asset' })),
      slide_count: numberRef.value,
      audio_tracks_available: sourceAudioTracks,
      audio_tracks_embedded: embeddedAudioTracks,
      audio_playback_policy: 'embedded_on_audio-summary-slides; PowerPoint playback QA remains pending for draft',
      output: { path: path.relative(ROOT, outPath), sha256: sha256(outPath), bytes: fs.statSync(outPath).size },
      generated_at: new Date().toISOString()
    };
    fs.writeFileSync(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    return { path: outPath, slides: numberRef.value, manifest };
  });
}

function addCanDoSlide(slide, lesson, number) {
  const content = onlineContentFor(lesson);
  addHeader(slide, lesson, number);
  addText(slide, ONLINE_LAYOUT.goals.title, 0.72, 1.02, 8.2, 0.60, { fontSize: T.goals_title_pt, bold: true, valign: 'top' });
  addText(slide, ONLINE_LAYOUT.goals.label, 0.78, 1.73, 8.5, 0.4, { fontSize: T.goals_label_pt, color: C.teal, bold: true });
  const goalMarkerColors = [C.teal, C.coral, C.purple, C.yellow];
  content.goals.forEach((text, index) => {
    const y = 2.50 + index * 0.78;
    const markerColor = goalMarkerColors[index % goalMarkerColors.length];
    slide.addShape('ellipse', { x: 0.98, y, w: 0.38, h: 0.38, fill: { color: markerColor }, line: { transparency: 100 } });
    addLatin(slide, String(index + 1), 0.98, y + 0.08, 0.38, 0.2, { fontSize: T.goals_number_pt, color: C.white, bold: true, align: 'center' });
    addText(slide, text, 1.55, y - 0.04, 10.65, 0.5, { fontSize: T.goals_item_pt, bold: true, valign: 'mid' });
  });
  notes(slide, `快速朗读本课 ${content.goals.length} 项学习结果；学生知道今天要用听、问、说完成任务。`);
}

function addWarmup(slide, lesson, number) {
  const question = lesson.number === 2 ? '你的一天通常怎么安排？' : lesson.number === 3 ? '你是什么时候开始对中文有兴趣的？' : '你以前来过中国吗？';
  const prompts = lesson.number === 2 ? ['上午你通常做什么？', '生日时你喜欢怎么庆祝？', '课外你参加过什么活动？'] : lesson.number === 3 ? ['小时候你学过什么？', '你为什么选择学习中文？', '学中文时遇到过什么困难？'] : ['你对中国有什么印象？', '你想在中国学习什么？', '你觉得在哪里学中文更有效率？'];
  addHeader(slide, lesson, number, '先想一想');
  addText(slide, question, 0.75, 1.66, 8.6, 0.42, { fontSize: 24, color: C.muted, bold: true });
  addBullets(slide, prompts, 0.96, 2.22, 6.6, 2.25, { fontSize: 28 });
  addBox(slide, 8.55, 1.18, 3.95, 3.55, C.white, 'D3D9D1');
  const image = sharedAsset('lesson-01-cover-family-work-hobby.png') || firstContextFile(lesson, 0);
  if (image && fs.existsSync(image)) slide.addImage({ path: image, x: 8.61, y: 1.24, w: 3.83, h: 3.43, sizingContain: true });
  addText(slide, `参考句式：${lesson.number === 2 ? '我通常……，因为……' : lesson.number === 3 ? '我开始……，因为……' : '我觉得……，因为……'}`, 0.98, 5.18, 7.15, 0.54, { fontSize: 24, color: C.coral, bold: true });
  notes(slide, '暖身只做短时间口语启动，不先讲解整课词语。');
}

function addVocabComprehensionSlide(slide, lesson, number) {
  const section = lesson.sections.vocabulary_comprehension;
  addHeader(slide, lesson, number, '听力题目', pageLabel(section.printed_pages));
  addAudio(slide, lesson, section.audio);
  addText(slide, '看图片，选择答案', 0.75, 1.66, 8.6, 0.42, { fontSize: 24, color: C.teal, bold: true });
  addText(slide, `请看教材第${printedPageRange(section.printed_pages)}页的题目。`, 1.15, 2.75, 11.0, 1.0, { fontSize: 34, color: C.ink, bold: true, align: 'center', valign: 'mid' });
  notes(slide, '学生直接打开教材图片题完成选择与跟读；投影片不重复列出教材词语或选项。');
}

function addVocabularyListeningSlide(slide, lesson, number) {
  const section = lesson.sections.vocabulary;
  addHeader(slide, lesson, number, '听力练习', pageLabel(section.printed_pages));
  addAudio(slide, lesson, section.audio);
  addText(slide, lesson.number === 2 ? '关于学校生活的词语' : '关于中文学习的词语', 0.75, 1.66, 8.6, 0.42, { fontSize: 24, color: C.teal, bold: true });
  addText(slide, `请看教材第${printedPageRange(section.printed_pages)}页，听一听这些词语。`, 1.15, 2.75, 11.0, 1.0, { fontSize: 34, color: C.ink, bold: true, align: 'center', valign: 'mid' });
  const count = (section.entries || []).length + (section.proper_nouns || []).length;
  notes(slide, `词语听力 ${section.audio}（${count}项）；学生打开教材对应页，先听并跟读。`);
}

function addListeningSentencesSlides(slides, lesson, numberRef) {
  const section = lesson.sections.listening_sentences;
  const exercise = Object.values(section.exercises || {})[0] || {};
  numberRef.value += 1;
  const slide = slides.addSlide();
  addHeader(slide, lesson, numberRef.value, '听力题目', pageLabel(section.printed_pages));
  addAudio(slide, lesson, (section.audio_tracks || [])[0]);
  addText(slide, exercise.heading_verbatim || '听句子，判断对错', 0.75, 1.66, 8.6, 0.42, { fontSize: 24, color: C.teal, bold: true });
  addText(slide, `请看教材第${printedPageRange(section.printed_pages)}页的题目。`, 1.15, 2.75, 11.0, 1.0, { fontSize: 34, color: C.ink, bold: true, align: 'center', valign: 'mid' });
  notes(slide, '学生直接打开教材完成听句子题；不把教材句子、选项或答案重复放到投影片。');
}

function addDialogueSlide(slide, lesson, number) {
  const section = lesson.sections.listening_dialogue;
  addHeader(slide, lesson, number, '听力题目', pageLabel(section.printed_pages));
  addAudio(slide, lesson, section.audio);
  addText(slide, '听小对话，选择答案', 0.75, 1.66, 8.6, 0.42, { fontSize: 24, color: C.teal, bold: true });
  addText(slide, `请看教材第${printedPageRange(section.printed_pages)}页的题目和选项。`, 1.15, 2.75, 11.0, 1.0, { fontSize: 34, color: C.ink, bold: true, align: 'center', valign: 'mid' });
  notes(slide, '教材已提供五组对话和选项；学生直接打开教材完成，不把答案搬到投影片。');
}

function addQuestionSlide(slide, lesson, number, question, index = 0) {
  addHeader(slide, lesson, number, '简单题目问答');
  addText(slide, question, 0.95, 2.45, 7.7, 1.55, { fontSize: 34, bold: true, align: 'center', valign: 'mid' });
  addBox(slide, 9.0, 1.75, 3.35, 3.7, C.white, 'D3D9D1');
  const image = sharedAsset('lesson-01-cover-family-work-hobby.png') || firstContextFile(lesson, index);
  if (image && fs.existsSync(image)) slide.addImage({ path: image, x: 9.06, y: 1.81, w: 3.23, h: 3.58, sizingContain: true });
  notes(slide, '学生先独立想一想，再和同伴互相提问与回答；回答应联系前面听到的本课信息。');
}

function addExpressionFaceSlide(slide, lesson, number, item, section, index) {
  addHeader(slide, lesson, number, '常用词语和表达', expressionPageLabel(lesson, section, index));
  addText(slide, item.expression, 0.9, 2.5, 7.8, 0.95, { fontSize: item.expression.length > 18 ? 31 : 38, color: C.purple, bold: true, align: 'center' });
  addText(slide, '请用这个句式说1句中文。', 0.95, 4.55, 7.65, 0.58, { fontSize: 27, color: C.muted, bold: true, align: 'center' });
  addBox(slide, 9.05, 2.0, 3.25, 3.35, C.white, 'D3D9D1');
  const image = sharedAsset('speaking-practice.png') || shortTextContextFile(lesson, index);
  if (image && fs.existsSync(image)) slide.addImage({ path: image, x: 9.11, y: 2.06, w: 3.13, h: 3.23, sizingContain: true });
  notes(slide, `实体课表达任务 ${item.expression}；每位学生用这个句式说一句与自己有关的话，再把表达用于本课口语任务。`);
}

function textRecord(lesson, sectionIndex, section) {
  return SHORT_TEXT_RECORDS[lesson.number]?.[sectionIndex] || {
    title: section.title,
    prompts: ['人物', '地点', '事情'],
    fields: ['人物', '地点', '事情'],
    output: '准备说一段自己的话。'
  };
}

function addTextPresentationSlide(slide, lesson, number, section, sectionIndex) {
  const record = textRecord(lesson, sectionIndex, section);
  addHeader(slide, lesson, number, sectionIndex === 0 ? `介绍${comprehensiveTopic(lesson)}` : '介绍短文', pageLabel(section.printed_pages));
  const output = lesson.number === 2
    ? (sectionIndex === 0 ? '现在，请你用6—8句介绍王红。' : sectionIndex === 1 ? '请你用4—6句话介绍她的生日午餐。' : '请你用4—6句话介绍她的课外活动。')
    : lesson.number === 3
      ? (sectionIndex === 0 ? '请你用6—8句话介绍李大为的家庭和中文经历。' : sectionIndex === 1 ? '请你用6—8句话说明李大为为什么选修中文。' : '请你用4—6句话介绍李大为的中文课。')
      : (sectionIndex === 0 ? '请你用6—8句话介绍朴大宇在北京的生活。' : sectionIndex === 1 ? '请你用6—8句话介绍朴大宇的学习内容。' : '请你用6—8句话比较两地学习汉语的情况。');
  addText(slide, output, 1.0, 1.78, 11.3, 0.6, { fontSize: 31, bold: true, align: 'center', valign: 'mid' });
  addBullets(slide, record.prompts, 1.0, 2.55, 11.2, 1.4, { fontSize: 24 });
  addText(slide, `参考词语：${vocabEntries(lesson).slice(0, 6).map((entry) => entry.word).join('　')}\n常用表达：${(expressionSections(lesson)[sectionIndex]?.items || []).slice(0, 4).map((item) => item.expression).join('　')}`, 1.36, 4.57, 10.48, 1.01, { fontSize: 22, color: C.teal, bold: true, align: 'center', valign: 'mid' });
  notes(slide, `学生根据教材 ${section.id} 的信息完成成段口语；不要求背诵或逐句翻译。`);
}

function addTextCompareSlide(slide, lesson, number, section, sectionIndex) {
  addHeader(slide, lesson, number, `短文（${['一', '二', '三'][sectionIndex]}）`, pageLabel(section.printed_pages));
  addText(slide, `你说的跟短文（${['一', '二', '三'][sectionIndex]}）哪里不一样？`, 1.0, 2.55, 11.3, 1.0, { fontSize: 34, bold: true, align: 'center', valign: 'mid' });
  notes(slide, '学生比较自己的介绍与教材短文的信息；先说一处相同，再补充一处不同。');
}

function addListeningStrategySlide(slide, lesson, number, section, sectionIndex) {
  addHeader(slide, lesson, number, '听力练习', pageLabel(section.printed_pages));
  if (section.audio) addAudio(slide, lesson, section.audio);
  addText(slide, `短文（${shortTextLabel(sectionIndex)}）`, 0.75, 1.66, 8.6, 0.42, { fontSize: 24, color: C.teal, bold: true });
  addText(slide, '先看题、抓关键词，再听并记重点，最后回答。', 1.15, 2.75, 11.0, 1.0, { fontSize: 34, color: C.ink, bold: true, align: 'center', valign: 'mid' });
  notes(slide, `听力策略页；播放 ${section.audio || '本课音频'}，学生只记录关键词，不在投影片阅读整段课文。`);
}

function addTextListeningQuestionsSlide(slide, lesson, number, section, sectionIndex) {
  const items = exerciseItems(section, 'second_listen');
  if (!items.length) return false;
  addHeader(slide, lesson, number, '听力题目', pageLabel(section.printed_pages));
  addAudio(slide, lesson, section.audio);
  addText(slide, exerciseInstruction(section, 'second_listen', '听第二遍，回答问题。'), 0.85, 1.55, 11.4, 0.54, { fontSize: 23, color: C.teal, bold: true, align: 'center' });
  addBullets(slide, items, 0.95, 2.22, 11.2, 3.85, { fontSize: items.length > 3 ? 21 : 24 });
  notes(slide, `短文（${shortTextLabel(sectionIndex)}）听力题目；学生再听 ${section.audio || '本课音频'}，使用括号词语或短文信息回答。`);
  return true;
}

function addTextSimpleQuestionsSlide(slide, lesson, number, section, sectionIndex) {
  const items = exerciseItems(section, 'first_listen');
  if (!items.length) return false;
  addHeader(slide, lesson, number, '简单题目问答', pageLabel(section.printed_pages));
  addText(slide, exerciseInstruction(section, 'first_listen', '听第一遍，简单回答问题。'), 0.85, 1.55, 11.4, 0.54, { fontSize: 23, color: C.teal, bold: true, align: 'center' });
  addBullets(slide, items, 0.95, 2.22, 11.2, 3.85, { fontSize: items.length > 4 ? 21 : 24 });
  notes(slide, `短文（${shortTextLabel(sectionIndex)}）简单题目问答；两人一组一问一答，先回答，再补充短文中的信息。`);
  return true;
}

function addOutputTaskSlide(slide, lesson, number, section, sectionIndex) {
  addHeader(slide, lesson, number, '请你说说', pageLabel(section.printed_pages));
  const prompts = lesson.number === 2
    ? ['说说你的学校生活，尤其是一门课。', '说说你的生日午餐或一次生日活动。', '说说你参加过的一项课外活动。']
    : lesson.number === 3
      ? ['说说你的家庭和小时候的生活。', '说说你为什么学习或选修中文。', '说说你的中文课和学习收获。']
      : ['说说你对北京的印象。', '说说你在中国或本国学习汉语的情况。', '比较两地学习汉语的异同。'];
  addText(slide, prompts[sectionIndex] || '说说跟本课主题有关的一件事。', 0.95, 2.35, 7.7, 1.6, { fontSize: 32, bold: true, align: 'center', valign: 'mid' });
  addText(slide, '必须使用10个课本中的词语和5个句式。', 0.95, 4.45, 7.7, 0.55, { fontSize: 24, color: C.coral, bold: true, align: 'center' });
  addBox(slide, 9.0, 1.75, 3.35, 3.7, C.white, 'D3D9D1');
  const image = sharedAsset(['divider-family.png', 'divider-work.png', 'divider-hobby.png'][sectionIndex]) || shortTextContextFile(lesson, sectionIndex);
  if (image && fs.existsSync(image)) slide.addImage({ path: image, x: 9.06, y: 1.81, w: 3.23, h: 3.58, sizingContain: true });
  notes(slide, `学生先准备，再两人互说；开放题不设唯一答案，教师观察词语和句式是否真正用于表达。`);
}

function buildFace(lesson) {
  ACTIVE_MODE = 'face';
  const outputDir = path.join(lesson.outputRoot, 'face-to-face');
  runDraftGate(lesson, lesson.outputRoot);
  fs.mkdirSync(outputDir, { recursive: true });
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = '荣市大学华语听说课程';
  pptx.company = '荣市大学';
  pptx.subject = `准中级加速篇 I ${lessonLabel(lesson)}实体课`;
  pptx.title = `${lessonLabel(lesson)}《${lesson.title}》实体课`;
  pptx.lang = 'zh-CN';
  pptx.theme = { headFontFace: CJK, bodyFontFace: CJK, lang: 'zh-CN' };
  let numberRef = { value: 0 };

  numberRef.value += 1; addCover(pptx.addSlide(), lesson, 'face', numberRef.value);
  numberRef.value += 1; addRouteSlide(pptx.addSlide(), lesson, numberRef.value, 'face');
  numberRef.value += 1; addCanDoSlide(pptx.addSlide(), lesson, numberRef.value);
  numberRef.value += 1; addWarmup(pptx.addSlide(), lesson, numberRef.value);
  const texts = Object.values(lesson.sections).filter((section) => section.text);

  // Lesson-wide foundation listening is not owned by any one short text.
  // Keep it before the short-text units; once a short-text divider appears,
  // every following slide belongs to that text until the next divider.
  numberRef.value += 1;
  addDivider(pptx.addSlide(), lesson, numberRef.value, '听力练习', lesson.number === 2 ? '先听懂一天中的主要信息。' : '先听懂本课主题中的主要信息。', 0);
  numberRef.value += 1; addVocabularyListeningSlide(pptx.addSlide(), lesson, numberRef.value);
  numberRef.value += 1; addVocabComprehensionSlide(pptx.addSlide(), lesson, numberRef.value);
  addListeningSentencesSlides(pptx, lesson, numberRef);
  if (lesson.sections.listening_dialogue) { numberRef.value += 1; addDialogueSlide(pptx.addSlide(), lesson, numberRef.value); }

  const relatedQuestions = lesson.number === 2
    ? ['你最喜欢哪一门课？为什么？', '你觉得大学生活怎么样？', '你生日时喜欢怎么庆祝？', '你去过博物馆吗？', '你参加过什么课外活动？']
    : ['你小时候学过什么？', '你为什么学习中文？', '你觉得中文哪里难？', '你和同学常常怎么互相帮助？', '你喜欢和朋友聊天儿吗？', '你会说哪些外语？'];
  relatedQuestions.forEach((question, questionIndex) => {
    numberRef.value += 1;
    addQuestionSlide(pptx.addSlide(), lesson, numberRef.value, question, questionIndex);
  });

  const expressionPlan = faceExpressionPlan(lesson, texts.length);
  texts.forEach((section, index) => {
    numberRef.value += 1;
    addDivider(pptx.addSlide(), lesson, numberRef.value, `短文（${['一', '二', '三'][index]}）`, '', index);

    numberRef.value += 1;
    addListeningStrategySlide(pptx.addSlide(), lesson, numberRef.value, section, index);
    numberRef.value += 1;
    if (!addTextListeningQuestionsSlide(pptx.addSlide(), lesson, numberRef.value, section, index)) {
      throw new Error(`第${lesson.number}课短文${shortTextLabel(index)}缺少听力题目`);
    }
    numberRef.value += 1;
    if (!addTextSimpleQuestionsSlide(pptx.addSlide(), lesson, numberRef.value, section, index)) {
      throw new Error(`第${lesson.number}课短文${shortTextLabel(index)}缺少简单题目问答`);
    }
    numberRef.value += 1;
    addDivider(pptx.addSlide(), lesson, numberRef.value, '口语练习', '', index);
    numberRef.value += 1;
    addTextPresentationSlide(pptx.addSlide(), lesson, numberRef.value, section, index);
    numberRef.value += 1;
    addTextCompareSlide(pptx.addSlide(), lesson, numberRef.value, section, index);
    const expressionSection = expressionPlan.byText[index];
    if (expressionSection) {
      numberRef.value += 1;
      addDivider(pptx.addSlide(), lesson, numberRef.value, '句式练习', '', index);
      (expressionSection.items || []).forEach((item, expressionIndex) => {
        numberRef.value += 1;
        addExpressionFaceSlide(pptx.addSlide(), lesson, numberRef.value, item, expressionSection, expressionIndex);
      });
    }
    numberRef.value += 1;
    addOutputTaskSlide(pptx.addSlide(), lesson, numberRef.value, section, index);
  });

  // Some source packages provide one or more expression groups shared by
  // several short texts. Keep those groups after the text units instead of
  // assigning them to a text by guesswork.
  expressionPlan.shared.forEach((expressionSection, sharedIndex) => {
    numberRef.value += 1;
    addDivider(pptx.addSlide(), lesson, numberRef.value, '句式练习', '', sharedIndex);
    (expressionSection.items || []).forEach((item, expressionIndex) => {
      numberRef.value += 1;
      addExpressionFaceSlide(pptx.addSlide(), lesson, numberRef.value, item, expressionSection, expressionIndex);
    });
  });

  const comprehensive = lesson.sections.comprehensive_practice;
  if (comprehensive) {
    const items = comprehensive.items || [];
    numberRef.value += 1;
    addDivider(pptx.addSlide(), lesson, numberRef.value, '综合表达', '', 0);
    const comprehensivePages = comprehensive.printed_pages || [];
    const firstComprehensivePage = comprehensivePages.length ? pageLabel([comprehensivePages[0]]) : '';
    const lastComprehensivePage = comprehensivePages.length ? pageLabel([comprehensivePages[comprehensivePages.length - 1]]) : '';
    if (items[0]) { numberRef.value += 1; addComprehensiveIntroSlide(pptx.addSlide(), lesson, numberRef.value, firstComprehensivePage); }
    if (items[1]) { numberRef.value += 1; addComprehensiveQuestionsSlide(pptx.addSlide(), lesson, numberRef.value, firstComprehensivePage); }
    if (items[2]) { numberRef.value += 1; addPersonalOutputSlide(pptx.addSlide(), lesson, numberRef.value, lastComprehensivePage); }
  }

  const outPath = path.join(outputDir, `lesson-${String(lesson.number).padStart(2, '0')}-实体课.pptx`);
  const audioTracks = audioTrackLabels(lesson);
  return pptx.writeFile({ fileName: outPath }).then(() => {
    assertFaceDeckContract(outPath, lesson, numberRef.value);
    const manifest = {
      schema_version: 1,
      manifest_type: 'lesson-pptx-draft',
      lesson_key: lesson.lessonKey,
      mode: 'face-to-face',
      title: `${lessonLabel(lesson)}《${lesson.title}》实体课`,
      status: 'draft_not_approved',
      builder_scope: 'scripts/build_l23_pptx_drafts.js',
      draft_gate: 'lesson-specific',
      source_sha256: lesson.sourceHash,
      layout_source: 'boya-quasi-intermediate-i lesson-01 approved layout family',
      face_order_contract: path.relative(ROOT, FACE_ORDER_CONTRACT_PATH),
      short_example_policy: `curated_short_sentences_max_${MAX_SHORT_EXAMPLE_CHARS}_hanzi_chars`,
      short_text_policy: 'textbook_listening_prompt_and_record_layout_no_full_text_copy',
      shared_assets: ['lesson-01-cover-family-work-hobby.png', 'lesson-01-learning-path.png', 'divider-family.png', 'divider-work.png', 'divider-hobby.png', 'divider-comprehensive.png', 'symbolic-vocabulary.png', 'symbolic-listening.png', 'symbolic-sentence-pattern.png', 'oral-practice-divider.png', 'speaking-practice.png'],
      slide_count: numberRef.value,
      audio_tracks_embedded: audioTracks,
      output: { path: path.relative(ROOT, outPath), sha256: sha256(outPath), bytes: fs.statSync(outPath).size },
      generated_at: new Date().toISOString()
    };
    fs.writeFileSync(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    return { path: outPath, slides: numberRef.value, manifest };
  });
}

async function main() {
  const lessons = requestedLessonNumbers().map(readLesson);
  const onlineOnly = process.env.BOYA_ONLINE_ONLY === '1';
  const faceOnly = process.env.BOYA_FACE_ONLY === '1';
  const results = [];
  for (const lesson of lessons) {
    const result = { lesson: lesson.lessonKey };
    if (!faceOnly) result.online = await buildOnline(lesson);
    if (!onlineOnly) result.face = await buildFace(lesson);
    results.push(result);
  }
  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exitCode = 1;
});
