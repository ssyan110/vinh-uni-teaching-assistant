const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const PptxGenJS = require('pptxgenjs');
const design = require('./boya_design_system');
const { toSimplified } = require('./simplify_chinese');

// RETIRED LEGACY ENTRY: the finalized Lesson 01 PPTX is locked and this old
// builder is not a valid production input. Keep the file only as historical
// evidence; do not run it because its old source snapshot does not carry the
// reviewed Vietnamese vocabulary layer or the current lesson content contract.
const ROOT = path.resolve(__dirname, '..');
const LESSON = path.join(ROOT, 'lessons/boya-quasi-intermediate-i/lesson-01');
const SOURCE = path.join(LESSON, '00-source/source-extraction-draft.json');
const REFINEMENT = path.join(LESSON, '10-design/teaching-design/online-refinement-2026-08-29.json');
const OUTDIR = path.join(LESSON, '10-design/pptx-draft/online');
const OUT = path.join(OUTDIR, 'lesson-01-在线预习.pptx');
const MANIFEST = path.join(OUTDIR, 'manifest.json');
const ASSETS = path.join(LESSON, '10-design/image-assets-draft');
const PAGE_ASSETS = path.join(ASSETS, 'textbook-pages');
const PYTHON = process.env.BOYA_PYTHON || 'python3';

const C = design.colors;
const T = design.pptTypography;
const CJK = design.fonts.cjk;
const LATIN = design.fonts.latin;
const W = 13.333;
const H = 7.5;

function simp(s) { return toSimplified(String(s == null ? '' : s)); }
function sha256(p) { return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); }
function dataUri(file) {
  if (!fs.existsSync(file)) {
    const label = path.basename(file, path.extname(file)).replace(/[-_]+/g, ' ');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700"><rect width="1200" height="700" fill="#D8F0E9"/><circle cx="930" cy="180" r="150" fill="#F6D36D" opacity=".75"/><circle cx="260" cy="560" r="210" fill="#EEE9FF" opacity=".9"/><path d="M0 540 Q260 420 520 560 T1200 500 V700 H0Z" fill="#DFECF5"/><text x="600" y="360" text-anchor="middle" font-family="KaiTi, serif" font-size="48" fill="#14282D">${label}</text></svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }
  const ext = path.extname(file).toLowerCase();
  const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.svg' ? 'image/svg+xml' : 'image/png';
  return `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`;
}

function gate() {
  // Gate is evaluated immediately before any output is written.
  fs.mkdirSync(OUTDIR, { recursive: true });
  if (process.env.BOYA_RECOVERY_REBUILD !== '1') {
    execFileSync(PYTHON, [path.join(ROOT, 'scripts/production_gate.py'), '--purpose', 'pptx', '--output-dir', OUTDIR], { stdio: 'inherit' });
  }
}

function txt(slide, value, x, y, w, h, opts = {}) {
  slide.addText(simp(value), {
    x, y, w, h, fontFace: CJK, fontSize: T.body_pt, color: C.ink, margin: 0,
    breakLine: true, fit: 'shrink', valign: 'mid', lang: 'zh-CN', paraSpaceAfterPt: 0,
    ...opts
  });
}
function latin(slide, value, x, y, w, h, opts = {}) {
  slide.addText(String(value), { x, y, w, h, fontFace: LATIN, fontSize: T.small_label_pt, color: C.muted, margin: 0, fit: 'shrink', valign: 'mid', lang: 'en-US', breakLine: true, ...opts });
}
function line(slide, x, y, w, color = C.line, pt = 0.8) { slide.addShape('line', { x, y, w, h: 0, line: { color, pt } }); }
function box(slide, x, y, w, h, fill = C.white, radius = 0.08, border = C.line) {
  slide.addShape('roundRect', { x, y, w, h, rectRadius: radius, fill: { color: fill }, line: { color: border, pt: 0.8 } });
}
function header(slide, n, title, page) {
  txt(slide, '第一课｜丽丽是独生女', 0.65, 0.25, 4.5, 0.28, { fontSize: 20, color: C.muted, bold: true });
  latin(slide, String(n).padStart(2, '0'), 12.0, 0.25, 0.65, 0.28, { fontSize: 20, color: C.muted, bold: true, align: 'right' });
  line(slide, 0.65, 0.69, 12.0);
  txt(slide, title, 0.72, 0.98, 11.6, 0.62, { fontSize: title.length > 22 ? 27 : 34, bold: true, valign: 'top' });
  if (page) txt(slide, `教材 P${page}`, 10.35, 7.02, 2.3, 0.28, { fontSize: 20, color: C.muted, align: 'right' });
}
function imagePanel(slide, file, x, y, w, h, fill = C.mint) {
  box(slide, x, y, w, h, fill);
  if (!file || !fs.existsSync(file)) return;
  const ratio = 1.0;
  const iw = w - 0.34; const ih = h - 0.34;
  slide.addImage({ data: dataUri(file), x: x + 0.17, y: y + 0.17, w: iw, h: ih, sizingContain: true });
}
function note(slide, text) { if (typeof slide.addNotes === 'function') slide.addNotes(text); }
function pageSlide(pptx, n, title, page) {
  const s = pptx.addSlide(); s.background = { color: C.slideBackground }; header(s, n, title, page); return s;
}
function addBullets(slide, items, x, y, w, h, opts = {}) {
  const rows = items.map((v) => ({ text: simp(v), options: { bullet: { indent: 16 }, hanging: 4 } }));
  slide.addText(rows, { x, y, w, h, fontFace: CJK, fontSize: opts.fontSize || 23, color: opts.color || C.ink, margin: 0.06, breakLine: true, fit: 'shrink', valign: 'top', paraSpaceAfterPt: 8, lang: 'zh-CN' });
}
function chunk(text, max = 62) {
  const s = simp(text).replace(/\s+/g, ''); const out = [];
  for (let i = 0; i < s.length; i += max) out.push(s.slice(i, i + max));
  return out;
}

const d = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
const vocab = d.sections.find((x) => x.id === 'vocabulary');
const t1 = d.sections.find((x) => x.id === 'short_text_1');
const t2 = d.sections.find((x) => x.id === 'short_text_2');
const t3 = d.sections.find((x) => x.id === 'short_text_3');
const expressions = d.sections.find((x) => x.id === 'common_expressions').groups.flatMap((g) => g.items.map((item) => ({ item, topic: g.topic })));
const allVocab = vocab.entries.concat(vocab.proper_nouns.map((x) => ({ ...x, pos: '专有名词', gloss: x.gloss })));
const refinement = JSON.parse(fs.readFileSync(REFINEMENT, 'utf8'));
const routeAsset = path.join(LESSON, '10-design', refinement.learning_route.asset);
const wordPages = refinement.vocabulary.page_by_word;
const endingContract = refinement.ending_slides;
const expressionOverrides = refinement.expressions || {};
const readingOverrides = refinement.reading_overrides || {};
const endingSlides = Object.keys(endingContract).sort((a, b) => Number(a) - Number(b)).map((key) => endingContract[key]);
const EXPECTED_ROUTE_STEPS = ['学习词语', '读／听短文', '记录摘要', '回答问题', '学习句式', '整理信息', '准备介绍自己'];

function validateRefinement() {
  if (refinement.lesson_key !== 'boya-quasi-intermediate-i:lesson-01') throw new Error('Online refinement metadata has the wrong lesson_key');
  if (refinement.cover.online_label !== '在线课' || refinement.cover.bottom_subtitle_policy !== 'forbidden' || Object.prototype.hasOwnProperty.call(refinement.cover, 'subtitle')) throw new Error('Online cover must not contain a bottom subtitle');
  if (refinement.vocabulary.extension_policy !== 'empty_until_explicitly_supplied' || refinement.vocabulary.extension_label !== '扩展：') throw new Error('Vocabulary expansion policy is not locked');
  if (!Object.prototype.hasOwnProperty.call(endingContract, '70') || !Object.prototype.hasOwnProperty.call(endingContract, '71') || !Object.prototype.hasOwnProperty.call(endingContract, '72')) throw new Error('Fixed online ending contract is incomplete');
  if (JSON.stringify(refinement.learning_route.steps || []) !== JSON.stringify(EXPECTED_ROUTE_STEPS)) throw new Error('Learning-route steps do not match the confirmed online-prep flow');
  if (!fs.existsSync(routeAsset)) throw new Error(`User-supplied learning-route asset is missing: ${routeAsset}`);
}

const examples = {
  '独生女': '丽丽是家里的独生女。', '出生': '我出生在河内。', '照顾': '周末我照顾弟弟。', '离开': '毕业以后，我要离开家乡。', '广告': '这家公司设计广告。', '满意': '客户对这个设计很满意。', '努力': '他学习很努力。', '压力': '考试前我觉得压力很大。', '开夜车': '为了完成工作，他有时候开夜车。', '受欢迎': '这家餐厅很受学生欢迎。', '帮助': '朋友的建议对我有帮助。', '放假': '放假的时候，我喜欢旅行。', '越来越': '我的中文越来越好。', '拍': '我喜欢拍照片。', '照片': '这张照片是在北京拍的。', '适应': '我已经慢慢适应了大学生活。', '要求': '老师对作业的要求很清楚。', '卫生': '自己做饭不仅好吃，而且卫生。', '担心': '父母为孩子的安全担心。', '父母': '我的父母住在家乡。', '空儿': '有空儿的时候给我打电话。', '设计': '她在广告公司做设计。', '毕业': '我明年大学毕业。', '公司': '我哥哥在一家大公司工作。', '老板': '老板对我们的工作很满意。', '生活': '我喜欢现在的大学生活。', '客户': '客户提出了新的要求。', '烧茄子': '朋友最爱吃她做的烧茄子。', '糖醋鱼': '春节我想做一道糖醋鱼。', '春节': '春节的时候，我们一起回家。', '广州美术学院': '她在广州美术学院学习设计。'
};
const usages = {
  名: '谈论人、事物或生活信息', '动': '说明动作或计划', '形': '说明状态、感觉或评价', '名/动': '说明事情，也可以表示提出要求', '动/名': '谈论生活或生活方式', '专有名词': '介绍地点、学校或节日', '': '放在句子中说明相关信息'
};
const imageFor = (word) => {
  const vocabImage = path.join(ASSETS, 'vocab-images', `${word}.png`);
  if (fs.existsSync(vocabImage)) return vocabImage;
  if (['广告', '设计', '要求', '客户', '压力', '公司', '老板', '努力', '开夜车'].includes(word)) return path.join(PAGE_ASSETS, 'p18-018.png');
  if (['拍', '照片', '爱好', '烧茄子', '糖醋鱼', '放假'].includes(word)) return path.join(PAGE_ASSETS, 'p21-021.png');
  return path.join(PAGE_ASSETS, 'p16-016.png');
};

async function build() {
  throw new Error('Retired legacy Lesson 01 online builder; use the locked 20-approved PPTX or the current lesson-specific content contract.');
  validateRefinement();
  gate();
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; pptx.author = '榮市大學華語課程'; pptx.subject = '第一課線上預習'; pptx.title = '第一課《麗麗是獨生女》線上預習'; pptx.company = '榮市大學'; pptx.lang = 'zh-CN';
  pptx.theme = { headFontFace: CJK, bodyFontFace: CJK, lang: 'zh-CN' };
  let n = 0;
  // O01 cover: copy the finalized entity-class cover geometry and change only
  // the green label. The finalized cover has no bottom subtitle.
  n++; {
    const s = pptx.addSlide();
    s.background = { color: C.slideBackground };
    txt(s, '第一课｜丽丽是独生女', 0.65, 0.25, 4.5, 0.28, { fontSize: 20, color: C.muted, bold: true });
    latin(s, '01', 12.0, 0.25, 0.65, 0.28, { fontSize: 20, color: C.muted, bold: true, align: 'right' });
    line(s, 0.65, 0.69, 12.0);
    s.addShape('roundRect', { x: 0.78, y: 1.08, w: 1.3, h: 0.42, fill: { color: C.teal }, line: { color: '333333', pt: 0.8 } });
    txt(s, '在线课', 0.86, 1.11, 1.14, 0.30, { fontSize: 20, color: 'FFFFFF', bold: true, align: 'center' });
    txt(s, '丽丽是独生女', 0.78, 1.72, 6.0, 0.82, { fontSize: 50, bold: true, color: C.ink });
    box(s, 7.05, 1.08, 5.55, 4.70, C.white);
    s.addImage({ data: dataUri(path.join(ASSETS, 'lesson-01-cover-family-work-hobby.png')), x: 7.11, y: 1.14, w: 5.43, h: 4.58, sizingContain: true });
    note(s, '学生先看主题，准备进入线上预习。');
  }
  // O02 route: use the approved seven-step online-prep image from refinement.
  n++; { const s = pageSlide(pptx, n, refinement.learning_route.title); s.addImage({ data: dataUri(routeAsset), x: 0.72, y: 1.58, w: 11.90, h: 5.48, sizingContain: true }); note(s, '线上学习路线；沿用用户提供的七步流程图，不写时间要求。'); }
  // O03-O33 vocabulary
  allVocab.forEach((v, i) => { n++; const word = v.word; const page = wordPages[word] || (i < 16 ? 1 : 2); const s = pageSlide(pptx, n, v.word, page); const pos = v.pos || ''; box(s, 0.78, 1.7, 5.4, 4.75, C.white); txt(s, word, 1.1, 2.03, 4.75, 0.7, { fontSize: 42, color: C.purple, bold: true }); latin(s, v.pinyin || '', 1.12, 2.78, 4.7, 0.36, { fontSize: 24, color: C.teal }); txt(s, `词类：${pos || '—'}`, 1.12, 3.35, 4.7, 0.36, { fontSize: 22, color: C.ink }); txt(s, `意思：${v.gloss || '—'}`, 1.12, 3.83, 4.7, 0.52, { fontSize: 21, color: C.ink }); txt(s, `使用场合：${usages[pos] || usages['']}`, 1.12, 4.55, 4.65, 0.7, { fontSize: 20, color: C.muted }); txt(s, `例句：${examples[word] || ''}`, 1.12, 5.4, 4.65, 0.68, { fontSize: 22, color: C.ink }); imagePanel(s, imageFor(word), 6.65, 1.7, 5.85, 4.75, [C.mint, C.blue, C.yellowSoft][i % 3]); const expansion = String(refinement.vocabulary.extensions[word] || '').trim(); if (expansion) txt(s, `扩展：${expansion}`, 6.95, 6.58, 5.2, 0.38, { fontSize: 20, color: C.teal, bold: true }); note(s, `词语 ${word}；学生看拼音、词类、意思、使用场合、例句${expansion ? '和扩展内容' : ''}。`); });
  // text slides helper
  function addTextSlides(t, printed, startN) {
    const chunks = chunk(t.text, 70); chunks.forEach((ch, j) => { n++; const s = pageSlide(pptx, n, `${t.title}（${j + 1}/${chunks.length}）`, printed); box(s, 0.85, 1.7, 7.0, 4.9, C.white); txt(s, ch, 1.15, 2.05, 6.4, 3.85, { fontSize: 26, breakLine: true, valign: 'top' }); imagePanel(s, imageFor(t.id === 'short_text_1' ? '父母' : t.id === 'short_text_2' ? '设计' : '拍'), 8.2, 1.7, 4.25, 4.9, j % 2 ? C.blue : C.mint); txt(s, j === 0 ? '读一读：找出人物、地点和事情。' : '圈出你认识的词语，再标记不懂的地方。', 8.55, 6.72, 3.65, 0.42, { fontSize: 20, color: C.teal, bold: true }); note(s, `短文正文分段；来源 ${startN}; 学生自主阅读并标记卡点。`); });
  }
  addTextSlides(t1, '5–6', 'short_text_1');
  // O39 family text understanding (ensure fixed count O34-O39 = 6 slides; text chunks likely 3)
  n++; { const s = pageSlide(pptx, n, '短文一：家庭信息', '5–6'); txt(s, '读完短文后，写下三项信息：', 0.9, 1.65, 7, 0.45, { fontSize: 25, bold: true }); addBullets(s, ['丽丽的家庭成员和职业', '丽丽毕业后的打算', '父母的想法和丽丽的想法'], 1.05, 2.35, 6.4, 2.5, { fontSize: 25 }); box(s, 7.85, 1.7, 4.65, 3.95, C.yellowSoft); txt(s, '我的记录', 8.25, 2.05, 3.8, 0.4, { fontSize: 25, color: C.teal, bold: true }); ['家庭：', '工作：', '父母想法：'].forEach((x, k) => { txt(s, x, 8.25, 2.75 + k * 0.82, 1.6, 0.3, { fontSize: 22, color: C.ink }); line(s, 9.65, 3.08 + k * 0.82, 2.2, C.teal, 1.1); }); txt(s, '用自己的话说 6–8 句。', 1.05, 5.65, 5.2, 0.45, { fontSize: 24, color: C.purple, bold: true }); note(s, '对应短文一 present / compare；学生形成口语准备。'); }
  // O40-O44 short text 2: 4 chunks + summary
  addTextSlides(t2, '7', 'short_text_2');
  n++; { const s = pageSlide(pptx, n, '短文二：工作信息', '7'); txt(s, '找出并记录：工作时间 · 工作要求 · 工作态度 · 工作结果', 0.9, 1.62, 11.2, 0.52, { fontSize: 24, color: C.teal, bold: true }); (readingOverrides.short_text_2_summary_questions || ['什么时候上班、下班？', '为什么有压力？', '丽丽怎样工作？', '客户和老板怎么看？']).forEach((q, k) => { const x = 0.95 + (k % 2) * 6.0; const y = 2.45 + Math.floor(k / 2) * 1.45; box(s, x, y, 5.4, 1.05, [C.mint, C.yellowSoft, C.blue, C.coralSoft][k]); txt(s, q, x + 0.3, y + 0.27, 4.8, 0.44, { fontSize: 23, bold: true }); }); txt(s, '准备说 6–8 句，说明“她在哪里做什么工作”。', 1.0, 5.9, 8.7, 0.4, { fontSize: 23, color: C.purple, bold: true }); }
  // O45-O49 short text 3: 4 chunks + summary
  addTextSlides(t3, '8–9', 'short_text_3');
  n++; { const s = pageSlide(pptx, n, '短文三：爱好信息', '8–9'); const qs = readingOverrides.short_text_3_summary_questions || ['她喜欢做什么？', '为什么喜欢？', '带来什么帮助？']; txt(s, '找出并记录：爱好 · 原因 · 结果', 0.9, 1.62, 7.0, 0.5, { fontSize: 25, color: C.teal, bold: true }); box(s, 0.95, 2.35, 5.35, 3.25, C.mint); qs.forEach((q, k) => txt(s, q, 1.3, 2.75 + k * 0.8, 4.4, 0.4, { fontSize: 25, bold: true })); box(s, 7.0, 2.35, 5.25, 3.25, C.yellowSoft); txt(s, '我的爱好', 7.35, 2.75, 4.3, 0.4, { fontSize: 25, color: C.purple, bold: true }); ['我喜欢……', '因为……', '对……有帮助。'].forEach((x, k) => { txt(s, x, 7.35, 3.55 + k * 0.64, 3.9, 0.32, { fontSize: 22 }); line(s, 7.35, 3.9 + k * 0.64, 4.1, C.teal, 1.1); }); txt(s, '准备说 6–8 句。', 1.0, 6.05, 4.8, 0.4, { fontSize: 24, color: C.purple, bold: true }); }
  // O50-O65 expressions
  const expExamples = { '出生在': ['我出生在河内。', '她出生在广州。'], '……是……': ['我的爱好是做饭。', '我的爸爸是公司老板。'], '什么': ['你学的是什么专业？', '你周末想做什么？'], '为……担心': ['父母为我的安全担心。', '我不想让朋友为我担心。'], '如果……就……': ['如果有空儿，我就给你打电话。', '如果明天下雨，我就不出门。'], '从……到……': ['我从星期一到星期五上课。', '从河内到胡志明市很远。'], '为了': ['为了进步，我每天练习。', '为了身体健康，他每天运动。'], '越来越': ['我的中文越来越好。', '她的工作越来越忙。'], '受……欢迎': ['这家店很受学生欢迎。', '她的设计很受客户欢迎。'], '对……满意': ['客户对这个设计很满意。', '老板对她的工作很满意。'], '毕业': ['大学毕业以后，我想找工作。', '毕业以后，我想和同学见面。'], '见面': ['大学毕业以后，我们再见面。', '毕业以后，我想和同学见面。'], '放假': ['放假的时候，我喜欢旅行。', '春节公司放七天假。'], '不仅……而且……': ['自己做饭不仅好吃，而且卫生。', '她不仅喜欢做饭，而且喜欢拍照片。'], '除了……还……／除了……也……': ['除了做饭，我还喜欢拍照片。', '除了中文，我也学习英语。'], '因为……所以……': ['因为她学设计，所以照片很漂亮。', '因为今天下雨，所以我没有出门。'], '对……有好处／有帮助（1）': ['运动对身体有好处。', '拍照片对我的设计工作有帮助。'] };
  const expressionCards = expressions.flatMap((e) => { const override = expressionOverrides[e.item]; const split = override && Array.isArray(override.split) ? override.split : [e.item]; return split.map((item) => ({ ...e, item, parentItem: e.item })); });
  expressionCards.forEach((e, i) => { n++; const s = pageSlide(pptx, n, e.item, i < 5 ? 6 : i < 10 ? 8 : 9); const override = expressionOverrides[e.parentItem] || expressionOverrides[e.item] || {}; const explanation = override[e.item] || (typeof override === 'string' ? override : ''); const examplesForCard = expExamples[e.item] || ['', '']; box(s, 0.9, 1.65, 11.55, 1.18, C.lilac); txt(s, e.item, 1.25, 1.95, 10.8, 0.55, { fontSize: 34, color: C.purple, bold: true, align: 'center' }); txt(s, `情境：${e.topic}`, 1.0, 3.16, 4.6, 0.38, { fontSize: 22, color: C.teal, bold: true }); if (explanation) txt(s, `说明：${explanation}`, 1.0, 3.62, 10.7, 0.48, { fontSize: 23, color: C.teal, bold: true }); txt(s, `例句1：${examplesForCard[0]}`, 1.0, explanation ? 4.18 : 3.72, 10.7, 0.45, { fontSize: 25, bold: true }); txt(s, `例句2：${examplesForCard[1]}`, 1.0, explanation ? 4.65 : 4.19, 10.7, 0.45, { fontSize: 25, bold: true }); txt(s, '我的三句话', 1.0, explanation ? 5.12 : 4.66, 3.0, 0.35, { fontSize: 23, color: C.teal, bold: true }); for (let k = 0; k < 3; k += 1) { txt(s, `${k + 1}.`, 1.1, (explanation ? 5.4 : 5.1) + k * 0.47, 0.35, 0.3, { fontSize: 20, color: C.muted }); line(s, 1.55, (explanation ? 5.65 : 5.35) + k * 0.47, 10.25, C.teal, 1.0); } note(s, `常用表达 ${e.item}；${explanation ? `说明：${explanation}；` : ''}保留例句1和例句2；每项完成三句个人造句。`); });
  // O66-O71 comprehensive preparation
  n++; { const s = pageSlide(pptx, n, '综合准备：三栏信息', 10); txt(s, '把短文信息整理到三栏中。', 0.95, 1.52, 6.8, 0.45, { fontSize: 25, bold: true }); const cols = [['家庭', '成员 · 职业 · 对去北京的态度'], ['工作', '单位 · 职位 · 时间 · 表现'], ['爱好', '爱好 · 原因 · 有意思的事']]; cols.forEach((c, i) => { const x = 0.9 + i * 4.08; box(s, x, 2.35, 3.72, 3.1, [C.mint, C.blue, C.yellowSoft][i]); txt(s, c[0], x + 0.3, 2.72, 3.1, 0.42, { fontSize: 30, color: C.purple, bold: true, align: 'center' }); txt(s, c[1], x + 0.35, 3.55, 3.0, 1.1, { fontSize: 21, align: 'center', valign: 'top' }); line(s, x + 0.4, 4.95, 2.9, C.teal, 1.0); }); txt(s, '依据短文填写，不必写完整句子。', 1.0, 5.95, 7.0, 0.4, { fontSize: 22, color: C.teal, bold: true }); }
  n++; { const s = pageSlide(pptx, n, '综合理解', 10); txt(s, '读三篇短文和你的信息表，回答：', 0.95, 1.55, 8.2, 0.45, { fontSize: 25, bold: true }); addBullets(s, ['父母为什么担心丽丽？', '丽丽为什么去北京？', '工作和爱好有什么关系？'], 1.2, 2.35, 8.2, 2.65, { fontSize: 26 }); box(s, 8.85, 2.0, 3.3, 3.25, C.coralSoft); txt(s, '回答提示', 9.2, 2.35, 2.6, 0.4, { fontSize: 24, color: C.purple, bold: true, align: 'center' }); txt(s, '先说答案，再说短文里的一个信息。', 9.25, 3.2, 2.5, 1.2, { fontSize: 21, align: 'center', valign: 'mid' }); }
  n++; { const s = pageSlide(pptx, n, '我的个人介绍', 11); txt(s, '按照三段准备自己的信息：', 0.95, 1.55, 8.0, 0.45, { fontSize: 25, bold: true }); const seg = [['家庭', '家里有什么人？'], ['学习／工作', '在哪里学习或工作？'], ['兴趣爱好', '喜欢什么？为什么？']]; seg.forEach((a, i) => { const x = 0.95 + i * 4.05; box(s, x, 2.45, 3.65, 2.35, [C.mint, C.blue, C.yellowSoft][i]); txt(s, a[0], x + 0.25, 2.8, 3.15, 0.4, { fontSize: 28, color: C.purple, bold: true, align: 'center' }); txt(s, a[1], x + 0.35, 3.65, 2.95, 0.55, { fontSize: 22, align: 'center' }); }); txt(s, '至少使用本课三个常用表达。', 1.0, 5.6, 7.5, 0.42, { fontSize: 24, color: C.teal, bold: true }); }
  n++; { const s = pageSlide(pptx, n, '我的口语提纲', 11); txt(s, '写下你要说的 6–8 句话。', 0.95, 1.55, 7.5, 0.45, { fontSize: 25, bold: true }); box(s, 0.95, 2.25, 11.25, 3.55, C.white); for (let i = 0; i < 6; i += 1) { txt(s, `${i + 1}.`, 1.3, 2.65 + i * 0.48, 0.35, 0.3, { fontSize: 20, color: C.muted }); line(s, 1.8, 2.93 + i * 0.48, 9.8, C.teal, 1.0); } txt(s, '把想在课堂说的句子圈起来。', 1.0, 6.2, 6.8, 0.4, { fontSize: 23, color: C.purple, bold: true }); }
  n++; { const s = pageSlide(pptx, n, '常用表达自我检查'); txt(s, `${expressionCards.length} 项表达，每项 3 句 = ${expressionCards.length * 3} 句`, 0.95, 1.55, 7.8, 0.48, { fontSize: 26, color: C.purple, bold: true }); const left = expressionCards.slice(0, Math.ceil(expressionCards.length / 2)).map((e) => `□ ${e.item}　3句`); const right = expressionCards.slice(Math.ceil(expressionCards.length / 2)).map((e) => `□ ${e.item}　3句`); addBullets(s, left, 1.0, 2.35, 5.45, 3.5, { fontSize: 21 }); addBullets(s, right, 6.8, 2.35, 5.45, 3.5, { fontSize: 21 }); txt(s, '圈出课堂想说的句子。', 1.0, 6.35, 5.7, 0.4, { fontSize: 23, color: C.teal, bold: true }); }
  n++; { const s = pageSlide(pptx, n, '上课前整理好'); txt(s, '带着这四样东西进入实体课：', 0.95, 1.55, 8, 0.45, { fontSize: 25, bold: true }); addBullets(s, ['划线的教材（不懂的地方）', '48 句常用表达笔记', 'P10 三栏信息表', 'P11 个人口语提纲'], 1.25, 2.45, 7.8, 2.7, { fontSize: 27 }); box(s, 8.9, 2.15, 3.05, 3.25, C.mint); txt(s, '准备好了，就能在课堂多听、多问、多说。', 9.25, 2.75, 2.35, 1.55, { fontSize: 24, color: C.teal, bold: true, align: 'center', valign: 'mid' }); txt(s, '我们课堂见！', 1.0, 6.15, 4.8, 0.42, { fontSize: 28, color: C.purple, bold: true }); }
  // Final three slides are a fixed cross-lesson contract, not generated per lesson.
  n++; { const cfg = endingSlides[0]; const s = pageSlide(pptx, n, cfg.title); txt(s, cfg.prompt, 1.0, 1.62, 11.2, 0.48, { fontSize: 27, color: C.teal, bold: true, align: 'center' }); box(s, 0.95, 2.45, 11.25, 3.15, C.white); for (let i = 0; i < cfg.lines; i += 1) { txt(s, `${i + 1}.`, 1.35, 2.9 + i * 0.45, 0.4, 0.3, { fontSize: 20, color: C.muted }); line(s, 2.05, 3.17 + i * 0.45, 9.8, C.teal, 1.0); } }
  n++; { const cfg = endingSlides[1]; const s = pageSlide(pptx, n, cfg.title); const fills = [C.mint, C.mint, C.blue, C.blue, C.yellowSoft, C.yellowSoft, C.lilac, C.lilac]; cfg.checks.forEach((textValue, i) => { const x = 0.82 + (i % 2) * 6.0; const y = 1.55 + Math.floor(i / 2) * 1.1; box(s, x, y, 5.45, 0.9, fills[i]); s.addShape('rect', { x: x + 0.25, y: y + 0.27, w: 0.32, h: 0.32, fill: { color: C.white }, line: { color: C.teal, pt: 0.8 } }); txt(s, textValue, x + 0.62, y + 0.19, 4.55, 0.52, { fontSize: 20, color: C.ink, fit: 'shrink' }); }); }
  n++; { const cfg = endingSlides[2]; const s = pageSlide(pptx, n, ''); txt(s, cfg.title, 1.0, 3.25, 11.2, 0.8, { fontSize: 44, color: C.purple, bold: true, align: 'center' }); }
  if (n !== 73) throw new Error(`Expected 73 online slides, built ${n}`);
  fs.mkdirSync(OUTDIR, { recursive: true });
  await pptx.writeFile({ fileName: OUT });
  const manifest = { artifact: 'lesson-01-在线预习', status: 'draft', title: '丽丽是独生女', format: 'native_pptx', slide_count: n, boundary: { listening_questions: 0, audio_buttons: 0, audio_media: 0, online_pages: 'O01-O73' }, fonts: { hanzi: CJK, latin: LATIN, minimum_visible_pt: 20 }, source: path.relative(ROOT, SOURCE), refinement: path.relative(ROOT, REFINEMENT), output: path.relative(ROOT, OUT), sha256: sha256(OUT), generated_at: new Date().toISOString() };
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  console.log(JSON.stringify(manifest, null, 2));
}

build().catch((err) => { console.error(err.stack || err); process.exitCode = 1; });
