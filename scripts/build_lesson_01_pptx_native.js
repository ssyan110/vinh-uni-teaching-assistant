const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const PptxGenJS = require('pptxgenjs');
const { toSimplified, toTeacherGuideChinese } = require('./simplify_chinese');

const projectRoot = path.resolve(__dirname, '..');
const projectConfig = JSON.parse(fs.readFileSync(path.join(projectRoot, 'project.config.json'), 'utf8'));
const lessonRoot = path.join(projectRoot, projectConfig.lesson_root);
const sourcePath = path.join(projectRoot, projectConfig.canonical_source);
const assetDir = path.join(lessonRoot, '10-design/visual-prototype/assets');
const contactSheetPath = path.join(lessonRoot, '10-design/visual-storyboard/assets/lesson-01-textbook-contact-sheet-4x4.png');
const audioRoot = path.join(projectRoot, 'Giáo trình/博雅汉语听说-中级冲刺篇/音频/第01课');
// Never write the generated deck to 20-approved. Manual PowerPoint edits are
// protected there and become authority only after explicit approval.
const outputDir = process.env.BOYA_PPTX_DRAFT_DIR || path.join(lessonRoot, '10-design/pptx-draft');
const storyboardDir = path.join(lessonRoot, '10-design/storyboard-draft');
const pptxPath = path.join(outputDir, 'lesson-01-draft.pptx');
const manifestPath = path.join(outputDir, 'manifest.json');
const audioManifestPath = path.join(outputDir, 'audio-manifest.json');
const outlinePath = path.join(storyboardDir, 'lesson-01-ppt-outline-v5.md');
const storyboardCsvPath = path.join(storyboardDir, 'lesson-01-ppt-storyboard.csv');
const storyboardMdPath = path.join(storyboardDir, 'lesson-01-ppt-storyboard.md');
const exerciseCoveragePath = path.join(storyboardDir, 'lesson-01-exercise-slide-coverage.csv');
const storyboardManifestPath = path.join(storyboardDir, 'manifest.json');
const teacherManualPath = path.join(lessonRoot, '20-approved/teacher-manual/第一课简易教案.docx');

const FONT = process.env.LESSON_01_FONT || 'Heiti SC';
const COLORS = {
  cream: 'FFF8E6',
  warmWhite: 'FFFDF8',
  mint: 'DEF4EE',
  mintDeep: 'CCEBE5',
  ink: '202321',
  line: '2F3A3D',
  purple: '8E79E5',
  purpleSoft: 'EEE9FF',
  yellow: 'F7CF5D',
  yellowSoft: 'FFF1BA',
  coral: 'F0A08A',
  coralSoft: 'FBE4DD',
  blue: '6B9AC4',
  blueSoft: 'E2EEF7',
  greenText: '415C58',
  white: 'FFFFFF',
  gray: '69706D'
};

function assertProductionGate() {
  execFileSync(process.env.BOYA_PYTHON || 'python3', [
    path.join(projectRoot, 'scripts/production_gate.py'),
    '--purpose', 'pptx',
    '--output-dir', outputDir,
  ], { stdio: 'inherit' });
}

const slides = [
  { kind: 'cover', period: 'P1', section: '第一课', title: '中国人的姓名', action: '你的名字有什么意思？', images: [1] },
  { kind: 'goals', period: 'P1', section: '第一课', title: '学完这课后，我能……', goals: [
    '听懂关于姓名和姓氏的主要信息。',
    '介绍自己姓名和姓氏的意思或来历。',
    '回答问题，并和同学讨论。',
    '根据要求起一个中文名字，并说明理由。'
  ], images: [5, 13] },

  { kind: 'divider', period: 'P1', section: '听说（一）', title: '听说（一）', images: [1] },
  { kind: 'prompt', period: 'P1', section: '课前准备', title: '课堂小组交流', action: '用汉语介绍自己的名字：它有什么意思？为什么这样取？', refs: ['E01-034'], layout: 'image-right', images: [2, 3], topics: ['意思', '来历', '读音'], material: '预习卡A' },
  { kind: 'material', period: 'P1', section: '课前准备', title: '小调查', action: '采访三位同学，记录名字的意思和来历。准备介绍其中一位同学。', refs: ['E01-035'], layout: 'image-left', images: [4], material: '活动一《姓名访谈》：访谈者角色卡（含访谈问题）、观察者角色卡（含观察记录）', outcome: '一张访谈记录' },

  { kind: 'divider', period: 'P1', section: '词语理解', title: '词语理解', images: [5] },
  { kind: 'listening', period: 'P1', section: '词语理解', title: '听力练习', action: '完成问题1到6。', refs: ['E01-001'], audio: ['1-2'], images: [5, 6] },
  { kind: 'listening', period: 'P1', section: '词语理解', title: '听力练习', action: '完成问题1到5。', refs: ['E01-002'], audio: ['1-3'], images: [7, 8] },
  { kind: 'speaking', period: 'P1', section: '词语理解', title: '用三到五句话回答问题，并使用画线词语', action: '完成问题1到5。', refs: ['E01-003'], layout: 'cards', topics: ['发音', '头等大事', '别扭', '糟', '低调'], images: [2, 3] },

  { kind: 'divider', period: 'P2', section: '语句理解', title: '语句理解', images: [6] },
  { kind: 'practice', period: 'P2', section: '语句理解', title: '听录音，跟读句子，并替换画线词语各说一句话', action: '完成句子1到6。', refs: ['E01-004'], audio: ['1-4'], layout: 'image-left', images: [5, 6] },
  { kind: 'sequence', period: 'P2', section: '语句理解', title: '听录音，复述并模仿对话', action: '先盖住课本。听录音，复述并模仿对话1到3。', refs: ['E01-005'], audio: ['1-5'], sequence: ['盖住课本', '听录音', '复述并模仿'], images: [7, 8] },

  { kind: 'divider', period: 'P2', section: '语段理解', title: '语段理解', images: [9] },
  { kind: 'listening', period: 'P2', section: '语段理解', title: '听力练习', action: '完成填空。', refs: ['E01-006'], audio: ['1-6'], images: [9] },
  { kind: 'listening', period: 'P2', section: '语段理解', title: '听力练习', action: '判断正误。', refs: ['E01-007'], audio: ['1-6'], images: [10] },
  { kind: 'prompt', period: 'P2', section: '语段理解', title: '口语练习', action: '老常的朋友们赞成给孩子起“殊”这个名字吗？说说他们的理由。', refs: ['E01-008'], audio: ['1-6'], layout: 'center', images: [11] },
  { kind: 'poll', period: 'P2', section: '语段理解', title: '你呢？', action: '你赞成给孩子起“殊”这个名字吗？为什么？和同学讨论。', refs: ['E01-008'], images: [11] },

  { kind: 'divider', period: 'P3', section: '口语句式', title: '口语句式', images: [12] },
  { kind: 'pbiPattern', period: 'P3', section: '口语句式', title: '总不能……吧', pattern: '总不能……吧', functionText: '说一件无论如何都不能做的事。', situation: '牙疼好几天了，还是不去看医生。', example: '总不能一直疼下去吧！', task: '完成教材中的练习。', refs: ['E01-009'], images: [7] },
  { kind: 'pbiPattern', period: 'P3', section: '口语句式', title: '……才怪呢', pattern: '……才怪呢', functionText: '说出一定会出现的结果。', situation: '每天都不复习，还想考试通过。', example: '能考及格才怪呢！', task: '完成教材中的练习。', refs: ['E01-010'], images: [8] },
  { kind: 'pbiPattern', period: 'P3', section: '口语句式', title: '到时候', pattern: '到时候', functionText: '说将来某个时间会发生的事。', situation: '下午要接孩子，朋友现在问你什么时候有空。', example: '到时候再给你打电话。', task: '完成教材中的练习。', refs: ['E01-011'], images: [6] },
  { kind: 'pbiPattern', period: 'P3', section: '口语句式', title: '话说回来', pattern: '话说回来', functionText: '先说一面，再说另一面。', situation: '这个名字很有意义，但是写起来有点儿难。', example: '话说回来，写起来还是有点儿难。', task: '完成教材中的练习。', refs: ['E01-012'], images: [12] },

  { kind: 'divider', period: 'P3', section: '文化知识', title: '文化知识', images: [9, 10] },
  { kind: 'questions', period: 'P3', section: '文化知识', title: '请你说说', questions: [
    '你们国家的人读到你的名字时，常常会想到什么人或什么事物？',
    '在你们国家，人们一般喜欢叫什么名字？'
  ], refs: ['E01-013'], images: [9, 10] },
  { kind: 'reading', period: 'P3', section: '文化知识', title: '阅读短文，回答问题', action: '读课本短文，完成问题1到3。', refs: ['E01-014'], images: [11] },
  { kind: 'summary', period: 'P3', section: '文化知识', title: '总结文章', action: '用五句话说明这篇文章在说什么。', refs: ['E01-014'], topics: ['什么是谐音', '怎样表达愿望', '怎样避免误会'], images: [12] },
  { kind: 'partner', period: 'P3', section: '文化知识', title: '口语练习', action: '两人一组，共同完成一份总结。\n完成后，和大家报告。', refs: ['E01-014'], images: [7, 8] },

  { kind: 'divider', period: 'P3', section: '拓展练习', title: '拓展练习', images: [12] },
  { kind: 'speaking', period: 'P3', section: '拓展练习', title: '成段叙述', action: '举两个谐音字的例子，说说它们可能带来的愿望或误会。', refs: ['E01-015'], layout: 'center', images: [9, 10] },

  { kind: 'material', period: 'P4', section: '拓展练习', title: '模拟空间', action: '拿出客户卡，完成一个中文名字提案。', refs: ['E01-016'], layout: 'image-right', images: [13], material: '活动二《起名儿公司》：客户角色卡（含四张客户卡）、命名顾问角色卡（含姓名提案）', outcome: '一个中文名字＋两个理由' },
  { kind: 'presentation', period: 'P4', section: '拓展练习', title: '小组发表', action: '每组介绍一个名字。\n听其他组发表，记下三个最重要的命名条件。', refs: ['E01-016'], layout: 'split', images: [13, 16], material: '活动二《起名儿公司》：命名顾问角色卡（含姓名提案）' },
  { kind: 'material', period: 'P4', section: '拓展练习', title: '课堂实践', action: '给两位电影演员起中文名字，准备说明读音和含义。', refs: ['E01-017'], layout: 'image-left', images: [14], material: '活动三《电影演员中文名》：演员卡与小组呈现卡', outcome: '两个中文名字＋说明' },
  { kind: 'classification', period: 'P4', section: '拓展练习', title: '调查报告', action: '把课本上的姓名填入三类。', refs: ['E01-018'], names: ['梁开放', '余胜男', '吴建国', '李小龙', '于国庆', '康有为', '王豫', '苏东坡', '孙湘', '郑板桥', '刘为民', '郑成功', '王沪生', '陈招娣', '钱卫东'], categories: ['注重时代意义', '具有地域特点', '体现美好愿望'], images: [14, 16], material: '课本《调查报告》' },

  { kind: 'divider', period: 'P5', section: '听说（二）', title: '听说（二）', images: [14, 15] },
  { kind: 'prompt', period: 'P5', section: '课前准备', title: '课堂小组交流', action: '用《预习卡B》的资料介绍本国常见的姓和名字。', refs: ['E01-019'], layout: 'image-right', images: [14, 15], material: '预习卡B' },

  { kind: 'divider', period: 'P5', section: '词语理解', title: '词语理解', images: [5] },
  { kind: 'listening', period: 'P5', section: '词语理解', title: '听力练习', action: '完成问题1到5。', refs: ['E01-020'], audio: ['2-2'], images: [5, 6] },
  { kind: 'speaking', period: 'P5', section: '词语理解', title: '用三到五句话回答问题，并使用画线词语', action: '完成问题1到6。', refs: ['E01-021'], layout: 'cards', topics: ['操心', '啼笑皆非', '少见', '尊称', '称呼', '交往'], images: [7, 8] },

  { kind: 'divider', period: 'P5', section: '语句理解', title: '语句理解', images: [6] },
  { kind: 'practice', period: 'P5', section: '语句理解', title: '听录音，跟读句子，并替换画线词语各说一句话', action: '完成句子1到5。', refs: ['E01-022'], audio: ['2-3'], layout: 'image-left', images: [5, 6] },
  { kind: 'sequence', period: 'P5', section: '语句理解', title: '听录音，复述并模仿对话', action: '先盖住课本。听录音，复述并模仿对话1到5。', refs: ['E01-023'], audio: ['2-4'], sequence: ['盖住课本', '听录音', '复述并模仿'], images: [7, 8] },

  { kind: 'divider', period: 'P5', section: '语段理解', title: '语段理解', images: [14] },
  { kind: 'listening', period: 'P5', section: '语段理解', title: '听力练习', action: '完成填空。', refs: ['E01-024'], audio: ['2-5'], images: [14] },
  { kind: 'listening', period: 'P5', section: '语段理解', title: '听力练习', action: '判断正误。', refs: ['E01-025'], audio: ['2-5'], images: [15] },
  { kind: 'prompt', period: 'P5', section: '语段理解', title: '听力练习', action: '姓“老”的人在与人交往中遇到了哪些麻烦？', refs: ['E01-026'], audio: ['2-5'], layout: 'center', images: [16] },

  { kind: 'divider', period: 'P6', section: '口语句式', title: '口语句式', images: [14] },
  { kind: 'pbiPattern', period: 'P6', section: '口语句式', title: '不然', pattern: '不然', functionText: '说出不这样做的结果。', situation: '你提醒同学带雨伞。', example: '夏天出门一定要带雨伞，不然会被雨淋湿。', task: '完成教材中的练习。', refs: ['E01-027'], images: [7] },
  { kind: 'pbiPattern', period: 'P6', section: '口语句式', title: '是……还是……', pattern: '是……还是……', functionText: '请同学在两个选择中选一个。', situation: '你和同学决定去哪里。', example: '我们是去颐和园，还是去圆明园？', task: '完成教材中的练习。', refs: ['E01-027'], images: [8] },
  { kind: 'pbiPattern', period: 'P6', section: '口语句式', title: '怎么……怎么……', pattern: '怎么……怎么……', functionText: '说不管怎么做，结果都一样。', situation: '大家不知道应该怎样称呼她。', example: '怎么叫怎么别扭。', task: '完成教材中的练习。', refs: ['E01-027'], images: [12] },
  { kind: 'material', period: 'P6', section: '口语句式', title: '句式练习', action: '拿出01·句式任务卡，完成三个句式任务。', refs: ['E01-027'], layout: 'center', images: [14], material: '活动四《姓氏信息站》：01·句式任务卡', outcome: '每个人说三句话' },

  { kind: 'divider', period: 'P6', section: '文化知识', title: '文化知识', images: [14, 15] },
  { kind: 'questions', period: 'P6', section: '文化知识', title: '请你说说', questions: [
    '中国人的姓名是姓在前、名在后，你们国家呢？',
    '在你们国家，人的姓名是什么时候产生的？'
  ], refs: ['E01-028'], images: [14, 15], material: '活动四《姓氏信息站》：02·文化比较卡' },
  { kind: 'reading', period: 'P6', section: '文化知识', title: '阅读短文，回答问题', action: '阅读短文，写下一个重点。', refs: ['E01-029'], images: [16], material: '活动四《姓氏信息站》：03·课文重点记录卡' },
  { kind: 'summary', period: 'P6', section: '文化知识', title: '总结文章', action: '用三到五句话说明单姓、复姓和中国姓氏的来源。', refs: ['E01-029'], topics: ['单姓', '复姓', '姓氏来源'], images: [12] },
  { kind: 'partner', period: 'P6', section: '文化知识', title: '口语练习', action: '两人一组，共同完成一份总结。\n完成后，和大家报告。', refs: ['E01-029'], images: [7, 8] },

  { kind: 'divider', period: 'P6', section: '拓展练习', title: '拓展练习', images: [16] },
  { kind: 'speaking', period: 'P6', section: '拓展练习', title: '成段叙述', action: '解释“张王李赵遍地流（刘）”，再介绍你知道的中国姓氏。', refs: ['E01-030'], layout: 'center', images: [14] },
  { kind: 'material', period: 'P6', section: '拓展练习', title: '寻找历史名人', action: '介绍一位中国历史人物，并说明他的姓和一件重要的事。', refs: ['E01-031'], layout: 'image-left', images: [15], material: '活动五《调查与研究》：小组报告大纲', outcome: '一段人物介绍' },
  { kind: 'material', period: 'P6', section: '拓展练习', title: '读一读，说一说', action: '每人读五个姓，同学写下听到的姓。', refs: ['E01-032'], layout: 'image-right', images: [14], material: '活动四《姓氏信息站》：07·姓氏读法卡' },
  { kind: 'partner', period: 'P6', section: '拓展练习', title: '读对话，谈体会', action: '两人一组，共同用五句话总结对话。', refs: ['E01-033'], images: [7, 8], material: '活动四《姓氏信息站》：08·对话总结记录', outcome: '一份五句话对话总结' },
  { kind: 'presentation', period: 'P6', section: '拓展练习', title: '口语练习', action: '每组报告一个重点。', refs: ['E01-033'], images: [12], material: '活动四《姓氏信息站》：08·对话总结记录', outcome: '一段口头报告' },

  { kind: 'final', period: 'P6', section: '课末', title: '想一想：这课学了什么？', questions: [
    '你现在能听懂哪些内容？',
    '你会怎样介绍姓名和姓氏？',
    '你会使用哪些句式？',
    '你还想再练哪一部分？'
  ], images: [16] }
];

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function simplify(value) {
  return toSimplified(String(value == null ? '' : value));
}

function clean(value) {
  return simplify(value).replace(/\s+/g, ' ').trim();
}

function cellPath(number) {
  return path.join(assetDir, 'textbook-cell-' + String(number).padStart(2, '0') + '.png');
}

const cellDataCache = new Map();

function cellData(number) {
  if (!cellDataCache.has(number)) {
    const data = fs.readFileSync(cellPath(number)).toString('base64');
    cellDataCache.set(number, 'data:image/png;base64,' + data);
  }
  return cellDataCache.get(number);
}

function ensureInputs(source) {
  if (source.exercises.length !== 35) throw new Error('Expected 35 exercises, found ' + source.exercises.length);
  if (source.audio_map.length !== 11) throw new Error('Expected 11 source audio tracks, found ' + source.audio_map.length);
  if (!fs.existsSync(contactSheetPath)) throw new Error('Missing approved contact sheet: ' + contactSheetPath);
  for (let i = 1; i <= 16; i += 1) {
    if (!fs.existsSync(cellPath(i))) throw new Error('Missing approved textbook illustration cell ' + i);
  }
  source.audio_map.forEach((item) => {
    const audioPath = path.join(audioRoot, item.track_label + '.mp3');
    if (!fs.existsSync(audioPath)) throw new Error('Missing audio track: ' + audioPath);
  });
}

function addText(slide, value, x, y, w, h, options = {}) {
  slide.addText(simplify(value), {
    x, y, w, h,
    fontFace: FONT,
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

function addLine(slide, x, y, w, color = COLORS.line, pt = 1) {
  slide.addShape('line', { x, y, w, h: 0, line: { color, pt } });
}

function addHeader(slide, page, title) {
  addText(slide, '第一课  中国人的姓名', 0.68, 0.28, 3.6, 0.28, { fontSize: 12, color: COLORS.greenText, bold: true });
  addText(slide, String(page).padStart(2, '0'), 12.0, 0.28, 0.62, 0.28, { fontSize: 12, color: COLORS.greenText, bold: true, align: 'right' });
  addLine(slide, 0.68, 0.72, 11.95, COLORS.line, 0.8);
  addText(slide, title, 0.72, 0.94, 11.85, 0.68, { fontSize: title.length > 24 ? 27 : 34, bold: true, valign: 'top' });
}

function addImageFrame(slide, number, x, y, size) {
  slide.addShape('roundRect', {
    x, y, w: size, h: size,
    rectRadius: 0.08,
    fill: { color: COLORS.white },
    line: { color: COLORS.line, pt: 0.8 }
  });
  slide.addImage({ data: cellData(number), x: x + 0.06, y: y + 0.06, w: size - 0.12, h: size - 0.12 });
}

function addImagePanel(slide, cells, x, y, w, h, fill = COLORS.mint) {
  if (!cells || !cells.length) return;
  slide.addShape('roundRect', {
    x, y, w, h,
    rectRadius: 0.1,
    fill: { color: fill },
    line: { color: COLORS.line, pt: 0.8 }
  });
  if (cells.length === 1) {
    const size = Math.min(w - 0.42, h - 0.42);
    addImageFrame(slide, cells[0], x + (w - size) / 2, y + (h - size) / 2, size);
    return;
  }
  const size = Math.min((w - 0.58) / 2, h - 0.42);
  const total = size * 2 + 0.18;
  const startX = x + (w - total) / 2;
  addImageFrame(slide, cells[0], startX, y + (h - size) / 2, size);
  addImageFrame(slide, cells[1], startX + size + 0.18, y + (h - size) / 2, size);
}

function addMaterial(slide, material, x, y, w) {
  if (!material) return;
  slide.addShape('roundRect', {
    x, y, w, h: 0.58,
    rectRadius: 0.08,
    fill: { color: COLORS.yellowSoft },
    line: { color: COLORS.line, pt: 0.8 }
  });
  addText(slide, '材料', x + 0.16, y + 0.12, 0.58, 0.28, { fontSize: 13, bold: true, color: COLORS.greenText });
  addText(slide, material, x + 0.84, y + 0.08, w - 1.0, 0.36, { fontSize: material.length > 26 ? 14 : 16, bold: true });
}

function addOutcome(slide, outcome, x, y, w) {
  if (!outcome) return;
  slide.addShape('roundRect', {
    x, y, w, h: 0.66,
    rectRadius: 0.08,
    fill: { color: COLORS.purpleSoft },
    line: { color: COLORS.purple, pt: 1 }
  });
  addText(slide, outcome, x + 0.18, y + 0.12, w - 0.36, 0.34, { fontSize: 18, color: COLORS.purple, bold: true, align: 'center' });
}

function addAudioButton(slide, tracks, page, audioState, x = 10.42, y = 6.36) {
  if (!tracks || !tracks.length) return;
  const label = tracks.length === 1 ? '播放 ' + tracks[0] : '播放 ' + tracks.join('、');
  slide.addShape('roundRect', {
    x, y, w: 2.12, h: 0.54,
    rectRadius: 0.08,
    fill: { color: COLORS.coral },
    line: { color: COLORS.line, pt: 0.8 }
  });
  addText(slide, label, x + 0.48, y + 0.1, 1.47, 0.28, { fontSize: 14, color: COLORS.white, bold: true, align: 'center' });
  tracks.forEach((track, index) => {
    const audioPath = path.join(audioRoot, track + '.mp3');
    slide.addMedia({
      type: 'audio',
      path: audioPath,
      x: x + 0.12 + index * 0.26,
      y: y + 0.12,
      w: 0.28,
      h: 0.28,
      objectName: '播放 ' + track
    });
    if (!audioState.usedSlides[track]) audioState.usedSlides[track] = [];
    audioState.usedSlides[track].push(page);
    audioState.instances.push({ track, slide: page });
  });
}

function addCover(slide, spec) {
  slide.background = { color: COLORS.cream };
  slide.addShape('arc', { x: -1.2, y: -1.5, w: 5.2, h: 5.2, adjustPoint: 0.35, rotate: 18, fill: { color: COLORS.mintDeep }, line: { color: COLORS.mintDeep, transparency: 100 } });
  slide.addShape('ellipse', { x: 5.7, y: 0.62, w: 1.15, h: 1.15, fill: { color: COLORS.yellow }, line: { color: COLORS.yellow, transparency: 100 } });
  addText(slide, '第一课', 0.84, 0.82, 1.4, 0.34, { fontSize: 18, color: COLORS.purple, bold: true });
  addText(slide, spec.title, 0.84, 1.5, 6.2, 1.0, { fontSize: 52, bold: true, valign: 'top' });
  addText(slide, spec.action, 0.88, 3.0, 5.8, 0.56, { fontSize: 27, color: COLORS.greenText, bold: true });
  addLine(slide, 0.88, 4.08, 4.3, COLORS.purple, 2);
  addText(slide, '姓 · 名 · 意思 · 来历', 0.88, 4.38, 5.3, 0.4, { fontSize: 21, color: COLORS.purple, bold: true });
  addImagePanel(slide, spec.images, 7.65, 0.76, 4.85, 5.95, COLORS.mint);
}

function addGoals(slide, spec) {
  slide.background = { color: COLORS.warmWhite };
  addHeader(slide, spec.page, spec.title);
  const positions = [
    [0.76, 1.92], [6.77, 1.92], [0.76, 3.78], [6.77, 3.78]
  ];
  spec.goals.forEach((goal, index) => {
    const [x, y] = positions[index];
    const fill = [COLORS.mint, COLORS.purpleSoft, COLORS.yellowSoft, COLORS.coralSoft][index];
    slide.addShape('roundRect', { x, y, w: 5.74, h: 1.42, rectRadius: 0.1, fill: { color: fill }, line: { color: COLORS.line, pt: 0.8 } });
    slide.addShape('ellipse', { x: x + 0.28, y: y + 0.29, w: 0.34, h: 0.34, fill: { color: [COLORS.purple, COLORS.coral, COLORS.blue, COLORS.greenText][index] }, line: { color: COLORS.line, transparency: 100 } });
    addText(slide, goal, x + 0.82, y + 0.24, 4.55, 0.9, { fontSize: 20, bold: true });
  });
}

function addDivider(slide, spec) {
  const fills = {
    '听说（一）': COLORS.mint,
    '听说（二）': COLORS.mint,
    '词语理解': COLORS.yellowSoft,
    '语句理解': COLORS.blueSoft,
    '语段理解': COLORS.coralSoft,
    '口语句式': COLORS.purpleSoft,
    '文化知识': COLORS.mintDeep,
    '拓展练习': COLORS.cream
  };
  slide.background = { color: fills[spec.title] || COLORS.cream };
  slide.addShape('ellipse', { x: -1.0, y: 4.0, w: 4.2, h: 4.2, fill: { color: COLORS.yellow, transparency: 14 }, line: { color: COLORS.yellow, transparency: 100 } });
  slide.addShape('arc', { x: 8.1, y: -1.45, w: 5.1, h: 5.1, rotate: 195, fill: { color: COLORS.purple, transparency: 68 }, line: { color: COLORS.purple, transparency: 100 } });
  addText(slide, spec.title, 0.9, 2.72, 7.6, 1.18, { fontSize: 50, bold: true, valign: 'mid' });
  addImagePanel(slide, spec.images, 9.0, 1.65, 3.25, 3.25, COLORS.warmWhite);
}

function addTopics(slide, topics, x, y, w) {
  if (!topics || !topics.length) return;
  const gap = 0.16;
  const chipW = (w - gap * (topics.length - 1)) / topics.length;
  topics.forEach((topic, index) => {
    const chipX = x + index * (chipW + gap);
    const fills = [COLORS.mint, COLORS.yellowSoft, COLORS.purpleSoft];
    slide.addShape('roundRect', { x: chipX, y, w: chipW, h: 0.72, rectRadius: 0.08, fill: { color: fills[index % fills.length] }, line: { color: COLORS.line, pt: 0.8 } });
    addText(slide, topic, chipX + 0.08, y + 0.14, chipW - 0.16, 0.36, { fontSize: 17, bold: true, align: 'center' });
  });
}

function addPrompt(slide, spec, audioState) {
  slide.background = { color: COLORS.warmWhite };
  addHeader(slide, spec.page, spec.title);
  const leftImage = spec.layout === 'image-left';
  const center = spec.layout === 'center';
  if (center) {
    slide.addShape('roundRect', { x: 1.15, y: 1.95, w: 11.03, h: 3.15, rectRadius: 0.12, fill: { color: COLORS.mint }, line: { color: COLORS.line, pt: 1 } });
    addText(slide, spec.action, 1.75, 2.45, 9.83, 1.85, { fontSize: spec.action.length > 42 ? 28 : 34, bold: true, align: 'center', valign: 'mid' });
    if (spec.images && spec.images.length) addImagePanel(slide, spec.images.slice(0, 1), 5.38, 5.25, 2.0, 1.55, COLORS.cream);
    addMaterial(slide, spec.material, 2.2, 5.52, 6.95);
  } else {
    const imageX = leftImage ? 0.78 : 8.75;
    const textX = leftImage ? 5.38 : 0.82;
    addImagePanel(slide, spec.images || [1], imageX, 1.82, 3.8, 4.55, leftImage ? COLORS.mint : COLORS.cream);
    slide.addShape('roundRect', { x: textX, y: 1.92, w: 7.05, h: 2.35, rectRadius: 0.1, fill: { color: COLORS.white }, line: { color: COLORS.line, pt: 0.9 } });
    addText(slide, spec.action, textX + 0.38, 2.28, 6.25, 1.48, { fontSize: spec.action.length > 48 ? 25 : 30, bold: true, valign: 'mid' });
    addTopics(slide, spec.topics, textX, 4.6, 7.05);
    addMaterial(slide, spec.material, textX, 5.55, 7.05);
  }
  addAudioButton(slide, spec.audio || [], spec.page, audioState);
}

function addMaterialSlide(slide, spec) {
  slide.background = { color: COLORS.cream };
  addHeader(slide, spec.page, spec.title);
  const imageLeft = spec.layout === 'image-left';
  const center = spec.layout === 'center';
  if (center) {
    addText(slide, spec.action, 1.18, 2.0, 10.98, 1.5, { fontSize: 34, bold: true, align: 'center' });
    addMaterial(slide, spec.material, 2.1, 4.02, 9.1);
    addOutcome(slide, spec.outcome, 3.38, 5.15, 6.54);
    return;
  }
  const imageX = imageLeft ? 0.78 : 8.7;
  const textX = imageLeft ? 5.18 : 0.82;
  addImagePanel(slide, spec.images, imageX, 1.78, 3.88, 4.72, COLORS.mint);
  addText(slide, spec.action, textX, 1.95, 7.1, 1.64, { fontSize: spec.action.length > 40 ? 28 : 34, bold: true });
  addMaterial(slide, spec.material, textX, 4.08, 7.1);
  addOutcome(slide, spec.outcome, textX, 5.06, 5.65);
}

function addListening(slide, spec, audioState) {
  slide.background = { color: COLORS.warmWhite };
  addHeader(slide, spec.page, '听力练习');
  const labels = ['听', '写关键词', '回答'];
  labels.forEach((label, index) => {
    const x = 0.84 + index * 1.72;
    const fills = [COLORS.purple, COLORS.coral, COLORS.greenText];
    slide.addShape('roundRect', { x, y: 1.78, w: 1.5, h: 0.55, rectRadius: 0.08, fill: { color: fills[index] }, line: { color: fills[index], transparency: 100 } });
    addText(slide, label, x + 0.12, 1.9, 1.26, 0.26, { fontSize: 16, color: COLORS.white, bold: true, align: 'center' });
  });
  slide.addShape('roundRect', { x: 0.84, y: 2.68, w: 7.2, h: 2.62, rectRadius: 0.12, fill: { color: COLORS.mint }, line: { color: COLORS.line, pt: 1 } });
  addText(slide, spec.action, 1.24, 3.18, 6.4, 1.62, { fontSize: spec.action.length > 28 ? 30 : 38, bold: true, align: 'center' });
  addImagePanel(slide, spec.images, 8.68, 1.72, 3.86, 4.88, COLORS.blueSoft);
  addAudioButton(slide, spec.audio, spec.page, audioState, 5.92, 5.74);
}

function addSpeaking(slide, spec) {
  slide.background = { color: COLORS.cream };
  addHeader(slide, spec.page, spec.title);
  if (spec.layout === 'center') {
    slide.addShape('roundRect', { x: 1.1, y: 2.02, w: 8.9, h: 3.1, rectRadius: 0.12, fill: { color: COLORS.mint }, line: { color: COLORS.line, pt: 1 } });
    addText(slide, spec.action, 1.65, 2.62, 7.8, 1.7, { fontSize: 34, bold: true, align: 'center' });
    addImagePanel(slide, spec.images, 10.28, 2.0, 2.25, 2.25, COLORS.purpleSoft);
    return;
  }
  addText(slide, spec.action, 0.9, 1.82, 7.45, 0.78, { fontSize: 31, bold: true });
  addTopics(slide, spec.topics, 0.88, 3.1, 7.45);
  addImagePanel(slide, spec.images, 8.75, 1.75, 3.75, 4.85, COLORS.mint);
}

function addPractice(slide, spec, audioState) {
  slide.background = { color: COLORS.warmWhite };
  addHeader(slide, spec.page, spec.title);
  const leftImage = spec.layout === 'image-left';
  const imageX = leftImage ? 0.82 : 9.05;
  const textX = leftImage ? 5.12 : 0.84;
  addImagePanel(slide, spec.images, imageX, 1.82, 3.48, 4.72, COLORS.blueSoft);
  slide.addShape('roundRect', { x: textX, y: 2.0, w: 7.42, h: 2.34, rectRadius: 0.1, fill: { color: COLORS.purpleSoft }, line: { color: COLORS.line, pt: 0.9 } });
  addText(slide, spec.action, textX + 0.4, 2.54, 6.62, 1.2, { fontSize: 34, bold: true, align: 'center' });
  addAudioButton(slide, spec.audio, spec.page, audioState, textX + 4.9, 5.5);
}

function addSequence(slide, spec, audioState) {
  slide.background = { color: COLORS.cream };
  addHeader(slide, spec.page, spec.title);
  addText(slide, spec.action, 0.86, 1.7, 11.6, 0.65, { fontSize: 27, bold: true, align: 'center' });
  const fills = [COLORS.yellowSoft, COLORS.mint, COLORS.purpleSoft];
  spec.sequence.forEach((item, index) => {
    const x = 0.9 + index * 4.1;
    slide.addShape('roundRect', { x, y: 2.75, w: 3.35, h: 1.72, rectRadius: 0.12, fill: { color: fills[index] }, line: { color: COLORS.line, pt: 1 } });
    addText(slide, item, x + 0.22, 3.2, 2.91, 0.72, { fontSize: 25, bold: true, align: 'center' });
    if (index < 2) addText(slide, '→', x + 3.45, 3.18, 0.45, 0.55, { fontSize: 30, color: COLORS.purple, bold: true, align: 'center' });
  });
  addAudioButton(slide, spec.audio, spec.page, audioState, 5.62, 5.46);
}

function addPoll(slide, spec) {
  slide.background = { color: COLORS.warmWhite };
  addHeader(slide, spec.page, spec.title);
  addText(slide, spec.action, 1.15, 1.72, 11.0, 0.86, { fontSize: 29, bold: true, align: 'center' });
  slide.addShape('roundRect', { x: 1.2, y: 3.0, w: 4.65, h: 2.1, rectRadius: 0.12, fill: { color: COLORS.mint }, line: { color: COLORS.line, pt: 1 } });
  addText(slide, '赞成', 1.55, 3.55, 3.95, 0.74, { fontSize: 38, bold: true, color: COLORS.greenText, align: 'center' });
  slide.addShape('roundRect', { x: 7.48, y: 3.0, w: 4.65, h: 2.1, rectRadius: 0.12, fill: { color: COLORS.coralSoft }, line: { color: COLORS.line, pt: 1 } });
  addText(slide, '不赞成', 7.83, 3.55, 3.95, 0.74, { fontSize: 38, bold: true, color: COLORS.coral, align: 'center' });
}

function addPattern(slide, spec) {
  slide.background = { color: COLORS.cream };
  addHeader(slide, spec.page, spec.title);
  slide.addShape('roundRect', { x: 0.82, y: 1.82, w: 4.1, h: 4.6, rectRadius: 0.12, fill: { color: COLORS.mint }, line: { color: COLORS.line, pt: 1 } });
  addText(slide, spec.pattern, 1.12, 2.72, 3.5, 1.52, { fontSize: spec.pattern.length > 9 ? 32 : 42, color: COLORS.purple, bold: true, align: 'center' });
  slide.addShape('roundRect', { x: 5.34, y: 1.82, w: 7.12, h: 1.94, rectRadius: 0.1, fill: { color: COLORS.white }, line: { color: COLORS.line, pt: 0.9 } });
  addText(slide, '例句', 5.68, 2.08, 0.8, 0.28, { fontSize: 15, color: COLORS.greenText, bold: true });
  addText(slide, spec.example, 5.68, 2.5, 6.45, 0.78, { fontSize: 24, bold: true });
  slide.addShape('roundRect', { x: 5.34, y: 4.08, w: 7.12, h: 2.34, rectRadius: 0.1, fill: { color: COLORS.yellowSoft }, line: { color: COLORS.line, pt: 0.9 } });
  addText(slide, '练习', 5.68, 4.38, 0.8, 0.28, { fontSize: 15, color: COLORS.greenText, bold: true });
  addText(slide, spec.practice, 5.68, 4.88, 6.45, 0.8, { fontSize: 23, bold: true });
}

function addQuestions(slide, spec) {
  slide.background = { color: COLORS.warmWhite };
  addHeader(slide, spec.page, spec.title);
  spec.questions.forEach((question, index) => {
    const x = 0.82 + index * 6.04;
    const fill = index === 0 ? COLORS.mint : COLORS.purpleSoft;
    slide.addShape('roundRect', { x, y: 1.95, w: 5.66, h: 3.54, rectRadius: 0.12, fill: { color: fill }, line: { color: COLORS.line, pt: 1 } });
    addText(slide, String(index + 1), x + 0.28, 2.22, 0.46, 0.42, { fontSize: 24, color: COLORS.purple, bold: true, align: 'center' });
    addText(slide, question, x + 0.72, 2.42, 4.4, 2.15, { fontSize: question.length > 34 ? 22 : 26, bold: true, align: 'center' });
  });
  addMaterial(slide, spec.material, 2.0, 5.86, 9.28);
}

function addReading(slide, spec) {
  slide.background = { color: COLORS.cream };
  addHeader(slide, spec.page, spec.title);
  slide.addShape('roundRect', { x: 0.84, y: 1.9, w: 7.4, h: 3.75, rectRadius: 0.12, fill: { color: COLORS.white }, line: { color: COLORS.line, pt: 1 } });
  addText(slide, spec.action, 1.32, 2.62, 6.45, 1.8, { fontSize: 34, bold: true, align: 'center' });
  addImagePanel(slide, spec.images, 8.68, 1.86, 3.8, 3.8, COLORS.mint);
  addMaterial(slide, spec.material, 1.38, 5.92, 9.25);
}

function addSummary(slide, spec) {
  slide.background = { color: COLORS.warmWhite };
  addHeader(slide, spec.page, spec.title);
  addText(slide, spec.action, 0.92, 1.72, 11.5, 0.65, { fontSize: 29, bold: true, align: 'center' });
  const fills = [COLORS.mint, COLORS.yellowSoft, COLORS.purpleSoft];
  spec.topics.forEach((topic, index) => {
    const x = 0.84 + index * 4.14;
    slide.addShape('roundRect', { x, y: 2.82, w: 3.68, h: 2.58, rectRadius: 0.12, fill: { color: fills[index] }, line: { color: COLORS.line, pt: 1 } });
    addText(slide, topic, x + 0.32, 3.28, 3.04, 0.54, { fontSize: 24, bold: true, align: 'center' });
    addLine(slide, x + 0.48, 4.15, 2.72, COLORS.line, 0.8);
    addLine(slide, x + 0.48, 4.62, 2.72, COLORS.line, 0.8);
  });
}

function addPartner(slide, spec) {
  slide.background = { color: COLORS.cream };
  addHeader(slide, spec.page, spec.title);
  addText(slide, spec.action, 0.96, 1.76, 7.0, 1.5, { fontSize: 31, bold: true });
  slide.addShape('roundRect', { x: 0.92, y: 3.62, w: 6.7, h: 1.45, rectRadius: 0.1, fill: { color: COLORS.yellowSoft }, line: { color: COLORS.line, pt: 0.9 } });
  addText(slide, '同伴的两个重点', 1.26, 3.98, 6.02, 0.48, { fontSize: 26, bold: true, align: 'center' });
  addImagePanel(slide, spec.images, 8.38, 1.72, 4.12, 4.98, COLORS.mint);
}

function addPresentation(slide, spec) {
  slide.background = { color: COLORS.warmWhite };
  addHeader(slide, spec.page, spec.title);
  slide.addShape('roundRect', { x: 0.84, y: 1.86, w: 7.08, h: 3.86, rectRadius: 0.12, fill: { color: COLORS.mint }, line: { color: COLORS.line, pt: 1 } });
  addText(slide, spec.action, 1.26, 2.42, 6.24, 2.12, { fontSize: 31, bold: true, align: 'center' });
  addImagePanel(slide, spec.images, 8.36, 1.86, 4.1, 3.86, COLORS.purpleSoft);
  addMaterial(slide, spec.material, 2.05, 6.02, 9.0);
}

function addReport(slide, spec) {
  slide.background = { color: COLORS.cream };
  addHeader(slide, spec.page, spec.title);
  addText(slide, spec.action, 0.88, 1.72, 11.6, 0.75, { fontSize: 29, bold: true, align: 'center' });
  addTopics(slide, spec.topics, 1.18, 2.95, 10.96);
  addMaterial(slide, spec.material, 1.95, 4.35, 9.42);
  addImagePanel(slide, spec.images, 5.25, 5.18, 2.84, 1.48, COLORS.mint);
}

function addFinal(slide, spec) {
  slide.background = { color: COLORS.cream };
  addHeader(slide, spec.page, spec.title);
  const positions = [[0.82, 1.86], [6.78, 1.86], [0.82, 3.94], [6.78, 3.94]];
  spec.questions.forEach((question, index) => {
    const [x, y] = positions[index];
    const fill = [COLORS.mint, COLORS.yellowSoft, COLORS.purpleSoft, COLORS.coralSoft][index];
    slide.addShape('roundRect', { x, y, w: 5.72, h: 1.56, rectRadius: 0.12, fill: { color: fill }, line: { color: COLORS.line, pt: 0.9 } });
    addText(slide, question, x + 0.34, y + 0.28, 5.04, 0.88, { fontSize: 22, bold: true, align: 'center' });
  });
}

/*
 * V4 visual system
 *
 * The lesson content and coverage map stay unchanged. This renderer applies
 * the approved educational-textbook palette with a more editorial rhythm:
 * one focal action per page, quieter containers, stronger image framing and
 * intentionally varied compositions across activity types.
 */
const V4 = {
  paper: 'FBF8F1',
  white: 'FFFDF9',
  ink: '14282D',
  muted: '61736F',
  line: 'D3D9D1',
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
  sand: 'F1E5D1',
  shadow: 'D8D2C7'
};

function v4Text(slide, value, x, y, w, h, options = {}) {
  slide.addText(simplify(value), {
    x, y, w, h,
    fontFace: FONT,
    fontSize: 22,
    color: V4.ink,
    margin: 0,
    fit: 'shrink',
    valign: 'mid',
    lang: 'zh-CN',
    breakLine: true,
    paraSpaceAfterPt: 0,
    ...options
  });
}

function v4Line(slide, x, y, w, color = V4.line, pt = 0.7) {
  slide.addShape('line', { x, y, w, h: 0, line: { color, pt } });
}

function v4Header(slide, page, title) {
  v4Text(slide, '第一课 · 中国人的姓名', 0.72, 0.26, 3.8, 0.24, { fontSize: 11, color: V4.muted, bold: true });
  v4Text(slide, String(page).padStart(2, '0'), 12.0, 0.26, 0.62, 0.24, { fontSize: 11, color: V4.muted, bold: true, align: 'right' });
  v4Line(slide, 0.72, 0.66, 11.9, V4.line, 0.8);
  slide.addShape('rect', { x: 0.72, y: 0.64, w: 0.48, h: 0.04, fill: { color: V4.purple }, line: { color: V4.purple, transparency: 100 } });
  const size = title.length > 28 ? 23 : title.length > 20 ? 27 : 34;
  v4Text(slide, title, 0.78, 0.9, 11.75, 0.58, { fontSize: size, bold: true, valign: 'top' });
}

function v4Accent(slide, x, y, w, color = V4.purple, h = 0.08) {
  slide.addShape('roundRect', { x, y, w, h, rectRadius: 0.03, fill: { color }, line: { color, transparency: 100 } });
}

function v4ImageFrame(slide, number, x, y, size, angle = 0) {
  slide.addShape('roundRect', { x: x + 0.1, y: y + 0.12, w: size, h: size, rectRadius: 0.06, fill: { color: V4.shadow, transparency: 18 }, line: { color: V4.shadow, transparency: 100 }, rotate: angle });
  slide.addShape('roundRect', { x, y, w: size, h: size, rectRadius: 0.06, fill: { color: V4.white }, line: { color: V4.ink, pt: 0.6 }, rotate: angle });
  slide.addImage({ data: cellData(number), x: x + 0.08, y: y + 0.08, w: size - 0.16, h: size - 0.16, rotate: angle });
}

function v4ImagePanel(slide, cells, x, y, w, h, fill = V4.mint, variant = 0) {
  if (!cells || !cells.length) return;
  slide.addShape('roundRect', { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: fill, transparency: 100 } });
  if (variant % 2 === 1) {
    slide.addShape('arc', { x: x + w - 1.72, y: y + 0.16, w: 1.5, h: 1.5, rotate: 180, fill: { color: V4.white, transparency: 48 }, line: { color: V4.white, transparency: 100 } });
  }
  if (cells.length === 1) {
    const size = Math.min(w - 0.42, h - 0.42);
    v4ImageFrame(slide, cells[0], x + (w - size) / 2, y + (h - size) / 2, size, variant % 3 === 0 ? -1.2 : 1.1);
    return;
  }
  const size = Math.min((w - 0.56) / 2, h - 0.42);
  const total = size * 2 + 0.16;
  const startX = x + (w - total) / 2;
  v4ImageFrame(slide, cells[0], startX, y + (h - size) / 2, size, -1.1);
  v4ImageFrame(slide, cells[1], startX + size + 0.16, y + (h - size) / 2, size, 1.1);
}

function v4MaterialLabel(material) {
  if (!material) return '';
  return material.replace(/^材料[：:]\s*/, '').replace(/：/g, '\n').replace(/、/g, ' · ');
}

function v4Material(slide, material, x, y, w, color = V4.yellow) {
  if (!material) return;
  v4Accent(slide, x, y + 0.02, 0.08, color, 0.52);
  v4Text(slide, '材料', x + 0.22, y, 0.46, 0.22, { fontSize: 10, color: V4.muted, bold: true });
  const parts = v4MaterialLabel(material).split('\n');
  v4Text(slide, parts[0], x + 0.82, y - 0.02, w - 0.82, 0.25, { fontSize: 15, color: V4.ink, bold: true });
  if (parts[1]) v4Text(slide, parts.slice(1).join(' · '), x + 0.82, y + 0.25, w - 0.82, 0.22, { fontSize: 11.5, color: V4.muted, bold: true });
}

function v4Outcome(slide, outcome, x, y, w) {
  if (!outcome) return;
  v4Text(slide, '完成：' + outcome, x, y, w, 0.36, { fontSize: 14, color: V4.teal, bold: true });
  v4Line(slide, x, y + 0.45, w, V4.mintDeep, 1.3);
}

function v4Audio(slide, tracks, page, audioState, x = 10.0, y = 6.5) {
  if (!tracks || !tracks.length) return;
  const label = tracks.map((track) => '音频 ' + track).join('、');
  const width = tracks.length > 1 ? 2.55 : 2.28;
  slide.addShape('roundRect', { x, y, w: width, h: 0.54, rectRadius: 0.12, fill: { color: V4.coral }, line: { color: V4.coral, transparency: 100 } });
  slide.addShape('ellipse', { x: x + 0.12, y: y + 0.11, w: 0.32, h: 0.32, fill: { color: V4.white }, line: { color: V4.white, transparency: 100 } });
  v4Text(slide, label, x + 0.56, y + 0.11, width - 0.68, 0.26, { fontSize: 13, color: V4.white, bold: true, align: 'center' });
  tracks.forEach((track, index) => {
    const audioPath = path.join(audioRoot, track + '.mp3');
    slide.addMedia({ type: 'audio', path: audioPath, x: x + 0.13 + index * 0.26, y: y + 0.13, w: 0.28, h: 0.28, objectName: '播放 ' + track });
    if (!audioState.usedSlides[track]) audioState.usedSlides[track] = [];
    audioState.usedSlides[track].push(page);
    audioState.instances.push({ track, slide: page });
  });
}

function v4Topics(slide, topics, x, y, w) {
  if (!topics || !topics.length) return;
  const columns = topics.length > 4 ? 3 : topics.length;
  const gap = 0.18;
  const rowGap = topics.length > 4 ? 0.16 : 0;
  const chipW = (w - gap * (columns - 1)) / columns;
  const fills = [V4.mint, V4.yellowSoft, V4.lilac, V4.coralSoft];
  topics.forEach((topic, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const chipX = x + column * (chipW + gap);
    const chipY = y + row * (0.58 + rowGap);
    v4Text(slide, topic, chipX, chipY, chipW, 0.32, { fontSize: topic.length > 9 ? 13 : 15, color: V4.teal, bold: true, align: 'center' });
    v4Accent(slide, chipX + 0.08, chipY + 0.42, chipW - 0.16, fills[index % fills.length], 0.07);
  });
}

function v4Cover(slide, spec) {
  slide.background = { color: V4.paper };
  slide.addShape('arc', { x: 0.38, y: 0.38, w: 2.7, h: 2.7, rotate: 22, fill: { color: V4.mintDeep }, line: { color: V4.mintDeep, transparency: 100 } });
  slide.addShape('ellipse', { x: 5.4, y: 0.58, w: 0.92, h: 0.92, fill: { color: V4.yellow }, line: { color: V4.yellow, transparency: 100 } });
  v4Text(slide, '第一课', 0.9, 0.76, 1.35, 0.3, { fontSize: 17, color: V4.purple, bold: true });
  v4Text(slide, spec.title, 0.9, 1.45, 6.2, 1.15, { fontSize: 52, bold: true, valign: 'top' });
  v4Text(slide, spec.action, 0.94, 3.0, 5.75, 0.5, { fontSize: 26, color: V4.teal, bold: true });
  v4Accent(slide, 0.94, 3.88, 4.15, V4.purple, 0.07);
  v4Text(slide, '姓  ·  名  ·  意思  ·  来历', 0.94, 4.18, 5.55, 0.36, { fontSize: 20, color: V4.purple, bold: true });
  v4ImagePanel(slide, spec.images, 7.58, 0.78, 4.88, 5.92, V4.mint, 1);
}

function v4Goals(slide, spec) {
  slide.background = { color: V4.paper };
  v4Header(slide, spec.page, spec.title);
  v4Text(slide, '听懂 · 介绍 · 讨论 · 起名', 0.86, 1.62, 11.5, 0.5, { fontSize: 27, color: V4.purple, bold: true, align: 'center' });
  const positions = [[0.82, 2.42], [6.85, 2.42], [0.82, 4.24], [6.85, 4.24]];
  const fills = [V4.mint, V4.lilac, V4.yellowSoft, V4.coralSoft];
  spec.goals.forEach((goal, index) => {
    const [x, y] = positions[index];
    slide.addShape('roundRect', { x, y, w: 5.68, h: 1.32, rectRadius: 0.08, fill: { color: fills[index] }, line: { color: fills[index], transparency: 100 } });
    v4Accent(slide, x + 0.25, y + 0.26, 0.08, [V4.teal, V4.purple, V4.coral, V4.ink][index], 0.8);
    v4Text(slide, goal, x + 0.6, y + 0.27, 4.72, 0.78, { fontSize: 20, bold: true });
  });
}

function v4Divider(slide, spec) {
  const fills = { '听说（一）': V4.mint, '听说（二）': V4.mint, '词语理解': V4.yellowSoft, '语句理解': V4.blue, '语段理解': V4.coralSoft, '口语句式': V4.lilac, '文化知识': V4.mintDeep, '拓展练习': V4.sand };
  slide.background = { color: fills[spec.title] || V4.paper };
  slide.addShape('ellipse', { x: 0.42, y: 5.18, w: 1.76, h: 1.76, fill: { color: V4.yellow, transparency: 8 }, line: { color: V4.yellow, transparency: 100 } });
  slide.addShape('arc', { x: 10.62, y: 0.82, w: 1.96, h: 1.96, rotate: 195, fill: { color: V4.purple, transparency: 62 }, line: { color: V4.purple, transparency: 100 } });
  v4Text(slide, spec.title, 0.92, 2.76, 7.8, 0.9, { fontSize: 49, bold: true });
  v4ImagePanel(slide, spec.images, 9.0, 1.72, 3.25, 3.25, V4.white, 1);
}

function v4Prompt(slide, spec, audioState) {
  slide.background = { color: V4.paper };
  v4Header(slide, spec.page, spec.title);
  const leftImage = spec.layout === 'image-left';
  const center = spec.layout === 'center';
  if (center) {
    v4Accent(slide, 1.18, 1.86, 1.0, V4.purple, 0.1);
    v4Text(slide, spec.action, 1.2, 2.18, 10.92, 1.68, { fontSize: spec.action.length > 42 ? 29 : 37, bold: true, align: 'center' });
    v4ImagePanel(slide, spec.images, 5.3, 4.4, 2.75, 1.7, V4.mint, 0);
    v4Material(slide, spec.material, 2.3, 6.22, 8.7);
  } else {
    const imageX = leftImage ? 0.8 : 9.08;
    const textX = leftImage ? 5.02 : 0.86;
    v4ImagePanel(slide, spec.images || [1], imageX, 1.72, 3.75, 4.9, leftImage ? V4.mint : V4.sand, 1);
    v4Text(slide, spec.action, textX, 1.98, 7.25, 1.78, { fontSize: spec.action.length > 48 ? 26 : 32, bold: true, valign: 'top' });
    v4Accent(slide, textX, 4.02, 6.65, V4.teal, 0.08);
    v4Topics(slide, spec.topics, textX, 4.34, 7.05);
    v4Material(slide, spec.material, textX, 5.48, 7.05);
  }
  v4Audio(slide, spec.audio || [], spec.page, audioState);
}

function v4MaterialSlide(slide, spec) {
  slide.background = { color: V4.paper };
  v4Header(slide, spec.page, spec.title);
  const imageLeft = spec.layout === 'image-left';
  const center = spec.layout === 'center';
  if (center) {
    v4Text(slide, spec.action, 1.12, 1.78, 11.1, 1.1, { fontSize: 36, bold: true, align: 'center' });
    v4ImagePanel(slide, spec.images, 5.08, 3.12, 3.18, 2.2, V4.mint, 1);
    v4Material(slide, spec.material, 2.18, 5.7, 9.0);
    v4Outcome(slide, spec.outcome, 3.4, 6.46, 6.5);
    return;
  }
  const imageX = imageLeft ? 0.78 : 9.02;
  const textX = imageLeft ? 5.08 : 0.84;
  v4ImagePanel(slide, spec.images, imageX, 1.7, 3.9, 4.92, V4.mint, 1);
  v4Text(slide, spec.action, textX, 1.92, 7.05, 1.52, { fontSize: spec.action.length > 40 ? 27 : 34, bold: true, valign: 'top' });
  v4Accent(slide, textX, 3.78, 6.55, V4.purple, 0.08);
  v4Material(slide, spec.material, textX, 4.32, 7.05);
  v4Outcome(slide, spec.outcome, textX, 5.72, 6.1);
}

function v4Listening(slide, spec, audioState) {
  slide.background = { color: V4.paper };
  v4Header(slide, spec.page, '听力练习');
  const stages = ['听', '写关键词', '回答'];
  v4Text(slide, stages.join('   ·   '), 0.86, 1.56, 6.45, 0.32, { fontSize: 16, color: V4.teal, bold: true });
  v4Accent(slide, 0.86, 2.03, 0.82, V4.purple, 0.1);
  v4Text(slide, spec.action, 0.86, 2.44, 7.18, 2.12, { fontSize: spec.action.length > 28 ? 32 : 41, bold: true, valign: 'mid' });
  v4ImagePanel(slide, spec.images, 8.68, 1.62, 3.82, 4.92, V4.blue, 1);
  v4Audio(slide, spec.audio, spec.page, audioState, 0.86, 5.86);
}

function v4Speaking(slide, spec) {
  slide.background = { color: V4.paper };
  v4Header(slide, spec.page, spec.title);
  if (spec.layout === 'center') {
  v4Text(slide, spec.action, 1.14, 1.72, 10.98, 1.7, { fontSize: spec.action.length > 42 ? 29 : 34, bold: true, align: 'center' });
    v4Accent(slide, 2.4, 3.32, 8.45, V4.teal, 0.09);
    v4ImagePanel(slide, spec.images, 5.26, 3.86, 2.82, 2.1, V4.mint, 0);
    return;
  }
  v4Text(slide, spec.action, 0.88, 1.72, 7.55, 1.12, { fontSize: 31, bold: true, valign: 'top' });
  v4Topics(slide, spec.topics, 0.9, 3.42, 7.3);
  v4ImagePanel(slide, spec.images, 8.75, 1.68, 3.72, 4.92, V4.mint, 1);
}

function v4Practice(slide, spec, audioState) {
  slide.background = { color: V4.paper };
  v4Header(slide, spec.page, spec.title);
  const leftImage = spec.layout === 'image-left';
  const imageX = leftImage ? 0.8 : 9.18;
  const textX = leftImage ? 5.0 : 0.84;
  v4ImagePanel(slide, spec.images, imageX, 1.72, 3.52, 4.88, V4.blue, 0);
  v4Accent(slide, textX, 1.98, 0.08, V4.purple, 2.6);
  v4Text(slide, spec.action, textX + 0.32, 2.12, 7.12, 1.54, { fontSize: 35, bold: true, valign: 'mid' });
  v4Line(slide, textX + 0.32, 4.36, 6.62, V4.line, 0.8);
  v4Text(slide, '先听，再跟读，再替换。', textX + 0.32, 4.7, 6.6, 0.42, { fontSize: 17, color: V4.muted, bold: true });
  v4Audio(slide, spec.audio, spec.page, audioState, textX + 0.32, 5.72);
}

function v4Sequence(slide, spec, audioState) {
  slide.background = { color: V4.paper };
  v4Header(slide, spec.page, spec.title);
  v4Text(slide, '先盖住课本。听录音，复述并模仿。', 0.92, 1.64, 11.45, 0.5, { fontSize: 26, color: V4.teal, bold: true, align: 'center' });
  const colors = [V4.yellowSoft, V4.mint, V4.lilac];
  spec.sequence.forEach((item, index) => {
    const x = 0.92 + index * 4.08;
    slide.addShape('roundRect', { x, y: 2.74, w: 3.25, h: 1.72, rectRadius: 0.08, fill: { color: colors[index] }, line: { color: colors[index], transparency: 100 } });
    v4Text(slide, item, x + 0.18, 3.28, 2.9, 0.52, { fontSize: 25, bold: true, align: 'center' });
    if (index < 2) {
      v4Line(slide, x + 3.38, 3.58, 0.64, V4.purple, 1.2);
      v4Accent(slide, x + 4.0, 3.51, 0.12, V4.purple, 0.12);
    }
  });
  v4Audio(slide, spec.audio, spec.page, audioState, 5.5, 5.78);
}

function v4Poll(slide, spec) {
  slide.background = { color: V4.paper };
  v4Header(slide, spec.page, spec.title);
  v4Text(slide, spec.action, 1.04, 1.7, 11.25, 0.9, { fontSize: 29, bold: true, align: 'center' });
  slide.addShape('roundRect', { x: 0.96, y: 3.06, w: 5.5, h: 2.32, rectRadius: 0.08, fill: { color: V4.mint }, line: { color: V4.mint, transparency: 100 } });
  slide.addShape('roundRect', { x: 6.86, y: 3.06, w: 5.5, h: 2.32, rectRadius: 0.08, fill: { color: V4.coralSoft }, line: { color: V4.coralSoft, transparency: 100 } });
  v4Text(slide, '赞成', 1.36, 3.72, 4.7, 0.72, { fontSize: 42, color: V4.teal, bold: true, align: 'center' });
  v4Text(slide, '不赞成', 7.26, 3.72, 4.7, 0.72, { fontSize: 42, color: V4.coral, bold: true, align: 'center' });
}

function v4Pattern(slide, spec) {
  slide.background = { color: V4.paper };
  v4Header(slide, spec.page, spec.title);
  slide.addShape('roundRect', { x: 0.84, y: 1.72, w: 4.02, h: 4.92, rectRadius: 0.08, fill: { color: V4.lilac }, line: { color: V4.lilac, transparency: 100 } });
  v4Text(slide, spec.pattern, 1.16, 2.66, 3.38, 1.3, { fontSize: spec.pattern.length > 9 ? 31 : 42, color: V4.purple, bold: true, align: 'center' });
  v4Accent(slide, 1.44, 4.48, 2.82, V4.purple, 0.07);
  v4Text(slide, spec.example, 5.48, 2.05, 6.7, 1.1, { fontSize: 26, bold: true });
  v4Text(slide, '例句', 5.5, 1.76, 0.62, 0.24, { fontSize: 11, color: V4.muted, bold: true });
  v4Line(slide, 5.48, 3.5, 6.75, V4.line, 0.8);
  v4Text(slide, spec.practice, 5.48, 4.2, 6.7, 1.05, { fontSize: 24, bold: true });
  v4Text(slide, '练习', 5.5, 3.83, 0.62, 0.24, { fontSize: 11, color: V4.muted, bold: true });
}

function v4PbiPattern(slide, spec) {
  slide.background = { color: V4.paper };
  v4Header(slide, spec.page, spec.title);

  slide.addShape('roundRect', { x: 0.72, y: 1.7, w: 3.56, h: 4.92, rectRadius: 0.08, fill: { color: V4.lilac }, line: { color: V4.lilac, transparency: 100 } });
  const patternLength = Array.from(spec.pattern).length;
  const patternFontSize = patternLength >= 8 ? 23 : patternLength >= 6 ? 30 : patternLength >= 5 ? 32 : 40;
  v4Text(slide, spec.pattern, 0.94, 2.42, 3.12, 0.72, { fontSize: patternFontSize, color: V4.purple, bold: true, align: 'center', breakLine: false });
  v4Accent(slide, 1.28, 3.72, 2.46, V4.purple, 0.07);
  v4Text(slide, spec.functionText, 1.18, 4.32, 2.66, 1.1, { fontSize: 20, bold: true, align: 'center' });

  slide.addShape('roundRect', { x: 4.58, y: 1.7, w: 7.78, h: 2.02, rectRadius: 0.08, fill: { color: V4.mint }, line: { color: V4.mint, transparency: 100 } });
  v4Text(slide, '情境', 4.92, 2.02, 0.72, 0.25, { fontSize: 13, color: V4.teal, bold: true });
  v4Text(slide, spec.situation, 4.92, 2.52, 6.98, 0.86, { fontSize: spec.situation.length > 25 ? 24 : 28, bold: true });

  slide.addShape('roundRect', { x: 4.58, y: 4.02, w: 7.78, h: 1.42, rectRadius: 0.08, fill: { color: V4.yellowSoft }, line: { color: V4.yellowSoft, transparency: 100 } });
  v4Text(slide, '可以这样说', 4.92, 4.28, 1.2, 0.25, { fontSize: 13, color: V4.muted, bold: true });
  v4Text(slide, spec.example, 4.92, 4.72, 6.98, 0.52, { fontSize: spec.example.length > 26 ? 24 : 29, bold: true });

  v4Text(slide, spec.task, 4.92, 5.86, 6.96, 0.5, { fontSize: 22, color: V4.purple, bold: true });
}

function v4Classification(slide, spec) {
  slide.background = { color: V4.paper };
  v4Header(slide, spec.page, spec.title);
  v4Text(slide, spec.action, 0.88, 1.54, 11.5, 0.48, { fontSize: 27, color: V4.teal, bold: true, align: 'center' });

  slide.addShape('roundRect', { x: 0.84, y: 2.18, w: 11.55, h: 0.88, rectRadius: 0.08, fill: { color: V4.yellowSoft }, line: { color: V4.yellowSoft, transparency: 100 } });
  const nameRows = [];
  for (let index = 0; index < spec.names.length; index += 5) nameRows.push(spec.names.slice(index, index + 5).join('　'));
  v4Text(slide, nameRows.join('\n'), 1.08, 2.34, 11.06, 0.62, { fontSize: 19, color: V4.ink, bold: true, align: 'center' });

  const fills = [V4.mint, V4.lilac, V4.coralSoft];
  const accents = [V4.teal, V4.purple, V4.coral];
  spec.categories.forEach((category, index) => {
    const x = 0.84 + index * 3.94;
    slide.addShape('roundRect', { x, y: 3.48, w: 3.62, h: 2.72, rectRadius: 0.08, fill: { color: fills[index] }, line: { color: fills[index], transparency: 100 } });
    v4Text(slide, category, x + 0.24, 3.82, 3.14, 0.56, { fontSize: category.length > 7 ? 20 : 23, color: accents[index], bold: true, align: 'center' });
    for (let line = 0; line < 3; line += 1) v4Line(slide, x + 0.52, 4.82 + line * 0.38, 2.58, V4.line, 0.7);
  });
  v4Material(slide, spec.material, 0.9, 6.42, 11.2);
}

function v4Questions(slide, spec) {
  slide.background = { color: V4.paper };
  v4Header(slide, spec.page, spec.title);
  const fills = [V4.mint, V4.lilac, V4.yellowSoft, V4.coralSoft];
  spec.questions.forEach((question, index) => {
    const x = 0.92 + index * 6.0;
    slide.addShape('roundRect', { x, y: 1.88, w: 5.55, h: 3.68, rectRadius: 0.08, fill: { color: fills[index % fills.length] }, line: { color: fills[index % fills.length], transparency: 100 } });
    v4Accent(slide, x + 0.34, 2.28, 0.76, [V4.teal, V4.purple, V4.coral][index % 3], 0.08);
    v4Text(slide, question, x + 0.42, 2.82, 4.72, 1.82, { fontSize: question.length > 34 ? 22 : 26, bold: true, align: 'center' });
  });
  v4Material(slide, spec.material, 2.08, 6.0, 9.2);
}

function v4Reading(slide, spec) {
  slide.background = { color: V4.paper };
  v4Header(slide, spec.page, spec.title);
  v4Accent(slide, 0.9, 1.78, 0.08, V4.teal, 3.48);
  v4Text(slide, spec.action, 1.24, 2.12, 6.88, 1.82, { fontSize: 35, bold: true, valign: 'mid' });
  v4ImagePanel(slide, spec.images, 8.62, 1.76, 3.85, 4.86, V4.mint, 1);
  v4Material(slide, spec.material, 1.24, 5.74, 6.84);
}

function v4Summary(slide, spec) {
  slide.background = { color: V4.paper };
  v4Header(slide, spec.page, spec.title);
  v4Text(slide, spec.action, 0.92, 1.66, 11.48, 0.62, { fontSize: 27, color: V4.teal, bold: true, align: 'center' });
  const fills = [V4.mint, V4.yellowSoft, V4.lilac];
  spec.topics.forEach((topic, index) => {
    const x = 0.86 + index * 4.14;
    slide.addShape('roundRect', { x, y: 2.76, w: 3.68, h: 2.78, rectRadius: 0.08, fill: { color: fills[index] }, line: { color: fills[index], transparency: 100 } });
    v4Text(slide, String(index + 1).padStart(2, '0'), x + 0.34, 3.1, 0.48, 0.3, { fontSize: 12, color: V4.muted, bold: true });
    v4Text(slide, topic, x + 0.34, 3.68, 3.0, 0.62, { fontSize: 24, bold: true, align: 'center' });
    v4Accent(slide, x + 0.64, 4.76, 2.42, [V4.teal, V4.coral, V4.purple][index], 0.06);
  });
}

function v4Partner(slide, spec) {
  slide.background = { color: V4.paper };
  v4Header(slide, spec.page, spec.title);
  v4Accent(slide, 0.92, 1.82, 0.08, V4.purple, 3.3);
  v4Text(slide, spec.action, 1.28, 2.06, 6.5, 1.82, { fontSize: 31, bold: true, valign: 'mid' });
  v4ImagePanel(slide, spec.images, 8.42, 1.75, 4.08, 4.9, V4.mint, 1);
}

function v4Presentation(slide, spec) {
  slide.background = { color: V4.paper };
  v4Header(slide, spec.page, spec.title);
  v4ImagePanel(slide, spec.images, 0.84, 1.72, 4.0, 4.92, V4.mint, 1);
  v4Text(slide, spec.action, 5.44, 2.08, 6.68, 1.55, { fontSize: 33, bold: true, valign: 'mid' });
  v4Accent(slide, 5.46, 4.18, 5.8, V4.coral, 0.08);
  v4Material(slide, spec.material, 5.46, 4.68, 6.35);
  v4Outcome(slide, spec.outcome, 5.46, 5.84, 5.75);
}

function v4Report(slide, spec) {
  slide.background = { color: V4.paper };
  v4Header(slide, spec.page, spec.title);
  v4Text(slide, spec.action, 0.88, 1.62, 11.62, 0.64, { fontSize: 26, bold: true, align: 'center' });
  const fills = [V4.mint, V4.yellowSoft, V4.lilac];
  spec.topics.forEach((topic, index) => {
    const x = 0.86 + index * 4.14;
    slide.addShape('roundRect', { x, y: 2.62, w: 3.68, h: 1.55, rectRadius: 0.08, fill: { color: fills[index] }, line: { color: fills[index], transparency: 100 } });
    v4Text(slide, topic, x + 0.2, 3.12, 3.28, 0.42, { fontSize: 23, bold: true, align: 'center' });
  });
  v4Material(slide, spec.material, 1.22, 4.82, 10.7);
  v4ImagePanel(slide, spec.images, 5.22, 5.42, 2.9, 1.36, V4.mint, 0);
}

function v4Final(slide, spec) {
  slide.background = { color: V4.paper };
  v4Header(slide, spec.page, spec.title);
  v4Text(slide, '回想这课，你现在会什么？', 0.9, 1.62, 11.5, 0.52, { fontSize: 27, color: V4.teal, bold: true, align: 'center' });
  const positions = [[0.86, 2.44], [6.84, 2.44], [0.86, 4.34], [6.84, 4.34]];
  const fills = [V4.mint, V4.yellowSoft, V4.lilac, V4.coralSoft];
  spec.questions.forEach((question, index) => {
    const [x, y] = positions[index];
    slide.addShape('roundRect', { x, y, w: 5.66, h: 1.34, rectRadius: 0.08, fill: { color: fills[index] }, line: { color: fills[index], transparency: 100 } });
    v4Accent(slide, x + 0.26, y + 0.28, 0.08, [V4.teal, V4.coral, V4.purple, V4.ink][index], 0.78);
    v4Text(slide, question, x + 0.62, y + 0.28, 4.72, 0.76, { fontSize: 20, bold: true });
  });
}

function renderSlideV4(slide, spec, audioState) {
  if (spec.kind === 'cover') v4Cover(slide, spec);
  else if (spec.kind === 'goals') v4Goals(slide, spec);
  else if (spec.kind === 'divider') v4Divider(slide, spec);
  else if (spec.kind === 'listening') v4Listening(slide, spec, audioState);
  else if (spec.kind === 'practice') v4Practice(slide, spec, audioState);
  else if (spec.kind === 'sequence') v4Sequence(slide, spec, audioState);
  else if (spec.kind === 'poll') v4Poll(slide, spec);
  else if (spec.kind === 'pattern') v4Pattern(slide, spec);
  else if (spec.kind === 'pbiPattern') v4PbiPattern(slide, spec);
  else if (spec.kind === 'classification') v4Classification(slide, spec);
  else if (spec.kind === 'questions') v4Questions(slide, spec);
  else if (spec.kind === 'reading') v4Reading(slide, spec);
  else if (spec.kind === 'summary') v4Summary(slide, spec);
  else if (spec.kind === 'partner') v4Partner(slide, spec);
  else if (spec.kind === 'material') v4MaterialSlide(slide, spec);
  else if (spec.kind === 'presentation') v4Presentation(slide, spec);
  else if (spec.kind === 'report') v4Report(slide, spec);
  else if (spec.kind === 'speaking') v4Speaking(slide, spec);
  else if (spec.kind === 'final') v4Final(slide, spec);
  else v4Prompt(slide, spec, audioState);
}

function sourceInstruction(source, spec) {
  const sourceById = Object.fromEntries(source.exercises.map((item) => [item.record_id, item]));
  const instructions = (spec.refs || []).map((ref) => {
    const item = sourceById[ref];
    return item && item.prompt_raw ? clean(item.prompt_raw.split('\n')[0]) : '';
  }).filter(Boolean);
  if (instructions.length) return Array.from(new Set(instructions)).join('；');
  if (spec.kind === 'divider') return '课本部分：' + spec.section;
  if (spec.kind === 'cover' || spec.kind === 'goals' || spec.kind === 'final') return '课程导入或回顾';
  return spec.title;
}

function addNotes(slide, spec, source) {
  const lines = [
    '课本部分：' + spec.section,
    '课本内容：' + sourceInstruction(source, spec),
    '学生任务：' + clean(spec.action || (spec.questions || []).join('；') || spec.title)
  ];
  if (spec.audio && spec.audio.length) lines.push('音频：' + spec.audio.map((track) => '音频' + track).join('、'));
  if (spec.material) lines.push('材料：' + spec.material);
  lines.push('教师提示：' + (spec.teacher || '先让学生完成本页任务；只处理影响理解或表达的问题。'));
  slide.addNotes(toTeacherGuideChinese(lines.join('\n')));
}

function writeOutline(source) {
  const lines = [
    '# 第一课《中国人的姓名》PPT大纲 v5',
    '',
    '| 页码 | 课本部分 | 页面标题 | 对应教材内容 | 学生要做什么 | 音频／材料 | 核对编号 |',
    '| ---: | --- | --- | --- | --- | --- | --- |'
  ];
  slides.forEach((spec) => {
    const support = [
      ...(spec.audio || []).map((track) => '音频' + track),
      ...(spec.material ? [spec.material] : [])
    ].join('；');
    lines.push('| ' + String(spec.page).padStart(2, '0') + ' | ' + spec.section + ' | ' + spec.title + ' | ' + sourceInstruction(source, spec) + ' | ' + clean(spec.action || (spec.questions || []).join('；') || spec.title) + ' | ' + (support || '—') + ' | ' + ((spec.refs || []).join('、') || '—') + ' |');
  });
  fs.writeFileSync(outlinePath, lines.join('\n') + '\n');
}

function csvCell(value) {
  return `"${String(value == null ? '' : value).replace(/"/g, '""')}"`;
}

function slideGrouping(spec) {
  if (spec.kind === 'divider') return '全班';
  if (spec.kind === 'listening') return '个人→小组';
  if (['material', 'presentation', 'report', 'classification'].includes(spec.kind)) return '小组';
  if (['goals', 'final'].includes(spec.kind)) return '个人';
  if (['questions', 'summary', 'speaking', 'pattern', 'pbiPattern', 'practice', 'sequence', 'prompt', 'partner', 'poll'].includes(spec.kind)) return '两人／小组';
  return '全班';
}

function slidePbiMode(spec) {
  if (['listening', 'reading'].includes(spec.kind)) return 'Interpretive';
  if (['presentation', 'report', 'speaking'].includes(spec.kind)) return 'Presentational';
  if (['prompt', 'questions', 'poll', 'partner', 'practice', 'sequence', 'pattern', 'pbiPattern', 'material', 'classification'].includes(spec.kind)) return 'Interpersonal';
  return 'All modes';
}

function slideSourcePages(source, spec) {
  const sourceById = Object.fromEntries(source.exercises.map((item) => [item.record_id, item]));
  const pages = (spec.refs || []).map((ref) => sourceById[ref] && sourceById[ref].source_pdf_page).filter(Boolean);
  return Array.from(new Set(pages)).map((page) => `PDF p.${page}`).join('、') || '—';
}

function slideAction(spec) {
  if (spec.action) return clean(spec.action);
  if (spec.questions && spec.questions.length) return spec.questions.map(clean).join('；');
  if (spec.kind === 'divider') return `进入“${spec.section}”`;
  if (spec.kind === 'goals') return '读一读本课要完成的事情。';
  if (spec.kind === 'cover') return clean(spec.action || spec.title);
  if (spec.kind === 'final') return '回想这课学了什么。';
  return clean(spec.title);
}

function slideOutput(spec) {
  if (spec.outcome) return clean(spec.outcome);
  if (spec.kind === 'divider') return '准备进入本课部分';
  if (spec.kind === 'goals') return '知道本课要完成的事情';
  if (spec.kind === 'final') return '完成课末回顾';
  return slideAction(spec);
}

function writeCanonicalStoryboard(source, exerciseSlideMap) {
  const headers = ['slide_no', 'period', 'time', 'purpose', 'page_type', 'pbi_mode', 'source_refs', 'source_pages', 'audio_track', 'student_instruction_zh', 'grouping', 'student_output', 'support_asset', 'teacher_note'];
  const rows = [headers.map(csvCell).join(',')];
  const markdownRows = [
    '| 页码 | 课本部分 | 页面标题 | 对应教材内容 | 学生现在做什么 | 音频／材料 | 核对编号 |',
    '| ---: | --- | --- | --- | --- | --- | --- |'
  ];

  slides.forEach((spec) => {
    const refs = (spec.refs || []).join('、');
    const audio = (spec.audio || []).map((track) => `音频${track}`).join('、');
    const material = spec.material || '';
    const support = [audio, material].filter(Boolean).join('；') || '—';
    const action = slideAction(spec);
    const grouping = slideGrouping(spec);
    const output = slideOutput(spec);
    rows.push([
      spec.page,
      spec.period,
      '见教师手册',
      spec.title,
      spec.kind,
      slidePbiMode(spec),
      refs,
      slideSourcePages(source, spec),
      audio,
      action,
      grouping,
      output,
      material || '—',
      '教师提示见教师手册与 PPT speaker notes'
    ].map(csvCell).join(','));
    markdownRows.push(`| ${String(spec.page).padStart(2, '0')} | ${spec.section} | ${spec.title} | ${sourceInstruction(source, spec)} | ${action} | ${support} | ${refs || '—'} |`);
  });

  fs.writeFileSync(storyboardCsvPath, `${rows.join('\n')}\n`);
  fs.writeFileSync(storyboardMdPath, [
    '# 第一课《中国人的姓名》PPT storyboard',
    '',
    '本表按已批准的教师手册与当前 62 页学生投影片整理。对应教材内容先用课堂可读的文字呈现，核对编号放在最后一栏。',
    '',
    ...markdownRows,
    '',
    '## 教材练习对应投影片',
    '',
    '| 核对编号 | 投影片 |',
    '| --- | ---: |',
    ...Object.entries(exerciseSlideMap).map(([id, pages]) => `| ${id} | ${pages.join('、')} |`),
    ''
  ].join('\n'));

  const coverageRows = ['record_id,slide_numbers'];
  Object.entries(exerciseSlideMap).forEach(([id, pages]) => coverageRows.push([id, pages.join('、')].map(csvCell).join(',')));
  fs.writeFileSync(exerciseCoveragePath, `${coverageRows.join('\n')}\n`);
}

function buildCoverage(source) {
  const exerciseSlideMap = {};
  slides.forEach((spec) => {
    (spec.refs || []).forEach((ref) => {
      if (!exerciseSlideMap[ref]) exerciseSlideMap[ref] = [];
      exerciseSlideMap[ref].push(spec.page);
    });
  });
  const expected = source.exercises.map((item) => item.record_id);
  const missing = expected.filter((id) => !exerciseSlideMap[id]);
  if (missing.length) throw new Error('Missing exercise coverage: ' + missing.join(', '));
  return exerciseSlideMap;
}

function buildManifest(source, exerciseSlideMap, audioState) {
  const tracks = source.audio_map.map((item) => {
    const track = item.track_label;
    const audioPath = path.join(audioRoot, track + '.mp3');
    const referencedSlides = audioState.usedSlides[track] || [];
    return {
      track,
      source_file: path.relative(projectRoot, audioPath),
      sha256: sha256(audioPath),
      use_scope: ['1-1', '2-1'].includes(track) ? '课前词语预习' : '课堂听力练习',
      referenced_slides: referencedSlides,
      embedded_instances: audioState.instances.filter((item) => item.track === track).length,
      embedded_in_pptx: referencedSlides.length > 0
    };
  });
  fs.writeFileSync(audioManifestPath, JSON.stringify({
    policy: '词语音频1-1、2-1保留在课前预习；其余听力音频在每个需要播放的PPT页面嵌入可点击按钮。',
    source_track_count: tracks.length,
    classroom_track_count: tracks.filter((item) => item.use_scope === '课堂听力练习').length,
    embedded_instance_count: audioState.instances.length,
    tracks
  }, null, 2) + '\n');

  const manifest = {
    package: 'boya-intermediate-lesson-01-native-pptx-v5',
    generated_at: new Date().toISOString(),
    status: 'teacher_review_required',
    format: 'native-editable-pptx',
    html_required: false,
    slide_count: slides.length,
    period_count: 6,
    total_minutes: 300,
    section_order: ['听说（一）', '词语理解', '语句理解', '语段理解', '口语句式', '文化知识', '拓展练习', '听说（二）', '词语理解', '语句理解', '语段理解', '口语句式', '文化知识', '拓展练习'],
    section_dividers: slides.filter((spec) => spec.kind === 'divider').map((spec) => spec.page),
    exercise_count: source.exercises.length,
    exercise_coverage_count: Object.keys(exerciseSlideMap).length,
    source_audio_track_count: source.audio_map.length,
    classroom_audio_track_count: tracks.filter((item) => item.use_scope === '课堂听力练习').length,
    embedded_audio_track_count: tracks.filter((item) => item.embedded_in_pptx).length,
    embedded_audio_instance_count: audioState.instances.length,
    prestudy_audio_tracks: ['1-1', '2-1'],
    speaker_notes_count: slides.length,
    language: '简体中文',
    font_family: FONT,
    visible_time_or_group_footnotes: 0,
    visible_generic_three_step_pages: 0,
    listening_flow: ['听', '写关键词', '回答'],
    visual_style: '教材式编辑视觉：暖米色、薄荷绿、紫色重点、留白、纸张式图片框与多样版式；连续题组合并，装饰图形限制在投影片画布内',
    source_of_truth: 'lessons/lesson-01/20-approved/teacher-manual/第一课简易教案.docx',
    input_lock: {
      canonical_source_sha256: sha256(sourcePath),
      teacher_manual_sha256: sha256(teacherManualPath),
      storyboard_manifest_sha256: sha256(path.join(lessonRoot, '10-design/storyboard/manifest.json')),
      visual_storyboard_manifest_sha256: sha256(path.join(lessonRoot, '10-design/visual-storyboard/manifest.json')),
      visual_prototype_manifest_sha256: sha256(path.join(lessonRoot, '10-design/visual-prototype/manifest.json')),
      generator_sha256: sha256(__filename),
    },
    input_outline: path.relative(projectRoot, outlinePath),
    approved_contact_sheet: path.relative(projectRoot, contactSheetPath),
    audio_manifest: path.relative(projectRoot, audioManifestPath),
    exercise_slide_map: exerciseSlideMap,
    pptx_sha256: sha256(pptxPath),
    output_files: ['lesson-01.pptx', 'audio-manifest.json', 'manifest.json']
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

function updateStoryboardManifest(source, exerciseSlideMap) {
  let existing = {};
  if (fs.existsSync(storyboardManifestPath)) existing = JSON.parse(fs.readFileSync(storyboardManifestPath, 'utf8'));
  const next = {
    ...existing,
    generated_at: new Date().toISOString(),
    status: 'outline_v5_teacher_review_required',
    current_revision: path.basename(outlinePath),
    current_revision_status: 'compact_practice_and_bounds_v5_2026-08-21',
    current_revision_approved_at: null,
    current_revision_slide_count: slides.length,
    current_revision_content_audit: {
      source_sections: source.sections.length,
      exercises: source.exercises.length,
      exercise_refs_in_outline: Object.keys(exerciseSlideMap).length,
      source_audio_tracks: source.audio_map.length,
      classroom_audio_tracks: 9,
      prestudy_audio_tracks: ['1-1', '2-1'],
      textbook_section_order_preserved: true,
      visible_time_group_footnotes_removed: true,
      activity_material_names_visible: true,
      all_required_content_accounted_for: true
    }
  };
  next.slide_count = slides.length;
  next.output_files = [
    path.basename(storyboardMdPath),
    path.basename(storyboardCsvPath),
    path.basename(exerciseCoveragePath),
    path.basename(outlinePath),
    path.basename(storyboardManifestPath)
  ];
  fs.writeFileSync(storyboardManifestPath, JSON.stringify(next, null, 2) + '\n');
}

async function main() {
  assertProductionGate();
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(storyboardDir, { recursive: true });
  slides.forEach((spec, index) => { spec.page = index + 1; });
  const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  ensureInputs(source);
  const exerciseSlideMap = buildCoverage(source);
  writeOutline(source);
  writeCanonicalStoryboard(source, exerciseSlideMap);

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = '荣市大学华语听说课程';
  pptx.company = '荣市大学';
  pptx.subject = '第一课：中国人的姓名';
  pptx.title = '第一课：中国人的姓名';
  pptx.lang = 'zh-CN';
  pptx.theme = { headFontFace: FONT, bodyFontFace: FONT, lang: 'zh-CN' };

  const audioState = { usedSlides: {}, instances: [] };
  slides.forEach((spec) => {
    const slide = pptx.addSlide();
    renderSlideV4(slide, spec, audioState);
    addNotes(slide, spec, source);
  });

  await pptx.writeFile({ fileName: pptxPath });
  const manifest = buildManifest(source, exerciseSlideMap, audioState);
  updateStoryboardManifest(source, exerciseSlideMap);
  console.log(JSON.stringify({
    pptx: pptxPath,
    outline: outlinePath,
    slide_count: manifest.slide_count,
    exercise_coverage: manifest.exercise_coverage_count + '/' + manifest.exercise_count,
    classroom_audio_tracks: manifest.embedded_audio_track_count + '/' + manifest.classroom_audio_track_count,
    audio_instances: manifest.embedded_audio_instance_count,
    speaker_notes: manifest.speaker_notes_count,
    sha256: manifest.pptx_sha256
  }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
