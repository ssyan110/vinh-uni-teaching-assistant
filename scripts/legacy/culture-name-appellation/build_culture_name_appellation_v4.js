const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const PptxGenJS = require('pptxgenjs');
const {
  CJK_FONT,
  COLORS,
  clean,
  addText,
  addLine,
  addHeader,
  addAccent,
  addImagePanel,
  addTopics,
  addOutcome
} = require('./lesson_pptx_master_template');

const projectRoot = path.resolve(__dirname, '..');
const projectConfig = JSON.parse(fs.readFileSync(path.join(projectRoot, 'project.config.json'), 'utf8'));
const lessonRoot = path.join(projectRoot, projectConfig.lesson_root);
const outputDir = process.env.BOYA_CULTURE_DRAFT_DIR
  ? path.resolve(process.env.BOYA_CULTURE_DRAFT_DIR)
  : path.join(lessonRoot, '10-design/pptx-draft/social-appellation-supplement-v4');
const assetDir = path.join(outputDir, 'assets');
const pptxPath = path.join(outputDir, '第一课-文化补充-姓名与称呼-v4-draft.pptx');
const outlinePath = path.join(outputDir, '第一课-文化补充-姓名与称呼-v4-outline.md');
const storyboardPath = path.join(outputDir, '第一课-文化补充-姓名与称呼-v4-storyboard.csv');
const manifestPath = path.join(outputDir, 'manifest.json');
const assetManifestPath = path.join(outputDir, 'assets/asset-manifest.json');

const images = {
  parents: path.join(assetDir, 'name-parents.png'),
  teacherStudent: path.join(assetDir, 'teacher-student.png'),
  reading: path.join(assetDir, 'reading-speaking.png'),
  group: path.join(assetDir, 'group-discussion.png'),
  service: path.join(assetDir, 'service-worker.png'),
  safeAddress: path.join(assetDir, 'safe-address.png'),
  surnameTeacher: path.join(assetDir, 'surname-teacher.png'),
  surnameDoctor: path.join(assetDir, 'surname-doctor.png'),
  surnameDirector: path.join(assetDir, 'surname-director.png'),
  surnameStudent: path.join(assetDir, 'surname-student.png')
};

const slideSpecs = [
  ['1', '姓名', 'divider', '中国人如何给孩子取名字？', '先认识三种常见方法。'],
  ['2', '姓名', 'method', '请别人帮忙取名字', '读一读，说一说：为什么有些家庭会请别人帮忙取名字？'],
  ['3', '姓名', 'expectation', '把期望和祝福放进名字里', '和同伴说一说：父母希望孩子怎么样？'],
  ['4', '姓名', 'choose', '自己选字、组合名字', '从三个条件中选两个，和同伴说说你的理由。'],
  ['5', '称呼', 'divider', '怎么称呼别人？', '先认识不同场合的称呼方法。'],
  ['6', '称呼', 'question-choice', '你会怎么问？', '第一次见到一位老师，你会怎么问？'],
  ['7', '称呼', 'reading-practice', '阅读短文（一）', '读短文，找出礼貌的问法；然后两人一组练习。'],
  ['8', '称呼', 'reading-practice', '阅读短文（二）', '读短文，找出称呼方法；然后两人一组练习。'],
  ['9', '称呼', 'four-factors', '称呼要看什么？', '关系、年龄、身份、场合。'],
  ['10', '称呼', 'question-methods', '怎么问姓名？', '选择适合的问法。'],
  ['11', '称呼', 'ask-surname', '问称呼的方法', '只练习问姓。'],
  ['12', '称呼', 'ask-address', '问称呼的方法', '只练习问称呼。'],
  ['13', '称呼', 'surname-role', '姓＋身份：王老师', '观察图片，读一读“王老师”。'],
  ['14', '称呼', 'surname-role', '姓＋身份：李医生', '观察图片，读一读“李医生”。'],
  ['15', '称呼', 'surname-role', '姓＋身份：张主任', '观察图片，读一读“张主任”。'],
  ['16', '称呼', 'surname-role', '姓＋身份：阮同学', '观察图片，读一读“阮同学”。'],
  ['17', '称呼', 'surname-role-question', '和越南人的称呼方法有什么不同？', '比较两种称呼方法。'],
  ['18', '称呼', 'familiar', '熟人称呼方式', '说一说：这些称呼适合什么关系？'],
  ['19', '称呼', 'safe', '不确定时，先用安全称呼', '选择一个安全称呼。'],
  ['20', '称呼', 'caution', '注意', '看一看，记住这三个词。'],
  ['21', '称呼', 'roleplay', '情境任务：完成一次第一次见面', '一个人是老师，一个人是学生。'],
  ['22', '称呼', 'scenarios', '你现在会怎么称呼？', '回答五个具体情境：应该怎么称呼？']
];

function assertProductionGate() {
  execFileSync(process.env.BOYA_PYTHON || 'python3', [
    path.join(projectRoot, 'scripts/production_gate.py'),
    '--purpose', 'pptx',
    '--output-dir', outputDir
  ], { stdio: 'inherit' });
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function ensureAssets() {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(assetDir, { recursive: true });
  Object.entries(images).forEach(([name, filePath]) => {
    if (!fs.existsSync(filePath)) throw new Error(`Missing generated image asset ${name}: ${filePath}`);
  });
}

function addNotes(slide, spec, teacherNote = '') {
  const lines = [
    '课本部分：文化补充',
    '补充内容：' + spec[3],
    '学生任务：' + clean(spec[4]),
    '教师提示：' + (teacherNote || '先让学生完成本页任务；只处理影响理解或表达的问题。')
  ];
  slide.addNotes(lines.join('\n'));
}

function newStandardSlide(pptx, page, title, background = COLORS.paper) {
  const slide = pptx.addSlide();
  slide.background = { color: background };
  addHeader(slide, page, title);
  return slide;
}

function newDividerSlide(pptx, title, imagePath, background = COLORS.mint) {
  const slide = pptx.addSlide();
  slide.background = { color: background };
  slide.addShape('ellipse', { x: 0.42, y: 5.18, w: 1.76, h: 1.76, fill: { color: COLORS.yellow, transparency: 8 }, line: { color: COLORS.yellow, transparency: 100 } });
  slide.addShape('arc', { x: 10.62, y: 0.82, w: 1.96, h: 1.96, rotate: 195, fill: { color: COLORS.purple, transparency: 62 }, line: { color: COLORS.purple, transparency: 100 } });
  addText(slide, title, 0.92, 2.76, 7.8, 0.9, { fontSize: title.length > 12 ? 42 : 49, bold: true });
  addImagePanel(slide, [imagePath], 9.0, 1.72, 3.25, 3.25, COLORS.white, 1);
  return slide;
}

function addCard(slide, x, y, w, h, fill, title, body = '', options = {}) {
  slide.addShape('roundRect', { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: fill, transparency: 100 } });
  if (options.accent) addAccent(slide, x + (options.accentX || 0.26), y + (options.accentY || 0.26), options.accentW || 0.08, options.accent, options.accentH || 0.8);
  addText(slide, title, x + (options.titleX || 0.36), y + (options.titleY || 0.38), w - (options.titleX || 0.36) * 2, options.titleH || 0.52, {
    fontSize: options.titleSize || 25,
    color: options.titleColor || COLORS.ink,
    bold: true,
    align: options.align || 'center'
  });
  if (body) addText(slide, body, x + (options.bodyX || 0.4), y + (options.bodyY || 1.05), w - (options.bodyX || 0.4) * 2, options.bodyH || (h - 1.28), {
    fontSize: options.bodySize || 18,
    color: options.bodyColor || COLORS.muted,
    bold: options.bodyBold || false,
    align: options.align || 'center',
    valign: 'top'
  });
}

function renderSlide1(pptx, spec) {
  const slide = newDividerSlide(pptx, '中国人如何给孩子取名字？', images.parents, COLORS.mint);
  addNotes(slide, spec, '本页只介绍三种常见做法；不加入传统称谓“字”“号”或复杂传统命理知识。');
}

function renderSlide2(pptx, spec) {
  const slide = newStandardSlide(pptx, 2, '请别人帮忙取名字', COLORS.paper);
  addText(slide, '有些家庭会请算命老师\n帮孩子取一个名字。', 0.88, 1.82, 7.2, 1.5, { fontSize: 34, bold: true, valign: 'top' });
  addAccent(slide, 0.88, 3.78, 6.65, COLORS.teal, 0.08);
  addText(slide, '他们希望名字符合自己的传统想法，\n也希望孩子平安、顺利。', 0.88, 4.18, 7.12, 0.9, { fontSize: 23, color: COLORS.muted, bold: true, valign: 'top' });
  addText(slide, '和同伴说一说：为什么请别人帮忙？', 0.88, 5.66, 7.1, 0.44, { fontSize: 18, color: COLORS.teal, bold: true });
  addImagePanel(slide, [images.parents], 8.7, 1.72, 3.75, 4.9, COLORS.sand, 1);
  addNotes(slide, spec, '“算命老师”只作为一种社会文化现象简单提及；不解释命理依据，也不把这种方式说成一定有效。');
}

function renderSlide3(pptx, spec) {
  const slide = newStandardSlide(pptx, 3, '把期望和祝福放进名字里', COLORS.paper);
  addText(slide, '父母常把对孩子的期望和祝福\n放进名字里。', 0.9, 1.82, 7.1, 1.18, { fontSize: 32, bold: true, valign: 'top' });
  addAccent(slide, 0.9, 3.28, 6.55, COLORS.teal, 0.08);
  addTopics(slide, ['健康', '勇敢', '平安'], 0.9, 3.72, 7.12);
  addText(slide, '你觉得父母最希望孩子怎么样？', 0.9, 5.45, 7.12, 0.48, { fontSize: 20, color: COLORS.teal, bold: true });
  addImagePanel(slide, [images.parents], 8.68, 1.72, 3.82, 4.92, COLORS.mint, 1);
  addNotes(slide, spec);
}

function renderSlide4(pptx, spec) {
  const slide = newStandardSlide(pptx, 4, '自己选字、组合名字', COLORS.paper);
  addText(slide, '有些父母自己查字、选字、\n组合名字。', 0.88, 1.82, 7.18, 1.16, { fontSize: 32, bold: true, valign: 'top' });
  addAccent(slide, 0.88, 3.28, 6.7, COLORS.purple, 0.08);
  addText(slide, '他们希望名字：', 0.88, 3.72, 2.6, 0.35, { fontSize: 19, color: COLORS.teal, bold: true });
  addTopics(slide, ['好写', '好记', '意思好'], 0.88, 4.15, 7.1);
  addText(slide, '从三个条件中选两个，和同伴说说你的理由。', 0.88, 5.54, 7.08, 0.52, { fontSize: 18, color: COLORS.muted, bold: true });
  addImagePanel(slide, [images.parents], 8.68, 1.72, 3.82, 4.92, COLORS.yellowSoft, 0);
  addNotes(slide, spec, '这里的“选字”只表示选择姓名用字；不要扩展到传统称谓“字”“号”或复杂传统命理知识。');
}

function renderSlide5(pptx, spec) {
  const slide = newDividerSlide(pptx, '怎么称呼别人？', images.teacherStudent, COLORS.mintDeep);
  addNotes(slide, spec);
}

function renderSlide6(pptx, spec) {
  const slide = newStandardSlide(pptx, 6, '你会怎么问？', COLORS.paper);
  addText(slide, '第一次见到一位老师，\n你会怎么问？', 0.9, 1.62, 11.5, 0.82, { fontSize: 28, color: COLORS.teal, bold: true, align: 'center' });
  const items = [
    ['你叫什么名字？', '同学之间', COLORS.mint, COLORS.teal],
    ['请问您贵姓？', '正式询问姓氏', COLORS.yellowSoft, COLORS.coral],
    ['怎么称呼您？', '不知道怎么叫', COLORS.lilac, COLORS.purple]
  ];
  items.forEach(([phrase, label, fill, accent], index) => {
    const x = 0.78 + index * 4.18;
    addCard(slide, x, 2.72, 3.82, 2.64, fill, phrase, label, { titleSize: 25, bodySize: 17, bodyColor: accent, accent, accentH: 0.08, accentW: 2.1, accentX: 0.86, accentY: 1.92, titleY: 0.58 });
  });
  addText(slide, '先选择，再和同伴说一说。', 0.9, 5.8, 11.4, 0.38, { fontSize: 18, color: COLORS.muted, bold: true, align: 'center' });
  addNotes(slide, spec);
}

function renderSlide7(pptx, spec) {
  const slide = newStandardSlide(pptx, 7, '阅读短文（一）', COLORS.paper);
  addAccent(slide, 0.9, 1.78, 0.08, COLORS.teal, 3.48);
  addText(slide, '第一次见面时，如果不知道\n怎么称呼对方，可以问：\n“怎么称呼您？”\n\n如果想知道对方的姓，可以问：\n“请问您贵姓？”', 1.24, 1.95, 6.92, 3.78, { fontSize: 23, bold: true, valign: 'top' });
  addText(slide, '口语练习：一人问，一人回答；交换角色。', 1.24, 5.98, 7.0, 0.42, { fontSize: 17, color: COLORS.teal, bold: true });
  addImagePanel(slide, [images.reading], 8.62, 1.76, 3.85, 4.86, COLORS.mint, 1);
  addNotes(slide, spec, '先让学生读短文，再直接进入两人问答；提醒学生交换角色。');
}

function renderSlide8(pptx, spec) {
  const slide = newStandardSlide(pptx, 8, '阅读短文（二）', COLORS.paper);
  addAccent(slide, 0.9, 1.78, 0.08, COLORS.teal, 3.48);
  addText(slide, '知道对方的身份以后，\n可以用“姓＋身份”来称呼：\n“王老师”“李医生”。\n\n熟人之间可以直接叫名字，\n也可以说“小王”“老李”。', 1.24, 1.95, 6.92, 3.78, { fontSize: 23, bold: true, valign: 'top' });
  addText(slide, '口语练习：两人一组，练习三种称呼。', 1.24, 5.98, 7.0, 0.42, { fontSize: 17, color: COLORS.teal, bold: true });
  addImagePanel(slide, [images.group], 8.62, 1.76, 3.85, 4.86, COLORS.blue, 0);
  addNotes(slide, spec, '先让学生读短文，再让学生练习“姓＋身份”、名字和熟人称呼。');
}

function renderSlide9(pptx, spec) {
  const slide = newStandardSlide(pptx, 9, '称呼要看什么？', COLORS.paper);
  addText(slide, '先看四个方面。', 0.9, 1.58, 11.5, 0.5, { fontSize: 27, color: COLORS.teal, bold: true, align: 'center' });
  const items = [
    ['关系', COLORS.mint, COLORS.teal],
    ['年龄', COLORS.yellowSoft, COLORS.coral],
    ['身份', COLORS.lilac, COLORS.purple],
    ['场合', COLORS.coralSoft, COLORS.ink]
  ];
  items.forEach(([label, fill, accent], index) => {
    const x = index % 2 === 0 ? 0.88 : 6.84;
    const y = index < 2 ? 2.42 : 4.34;
    addCard(slide, x, y, 5.66, 1.34, fill, label, '', { titleSize: 30, accent, accentH: 0.78, accentX: 0.28, accentY: 0.28, titleY: 0.42 });
  });
  addNotes(slide, spec);
}

function renderSlide10(pptx, spec) {
  const slide = newStandardSlide(pptx, 10, '怎么问姓名？', COLORS.paper);
  addText(slide, '根据关系和场合，选择合适的问法。', 0.9, 1.58, 11.5, 0.5, { fontSize: 25, color: COLORS.teal, bold: true, align: 'center' });
  const items = [
    ['你叫什么名字？', '关系比较熟', COLORS.mint, COLORS.teal],
    ['请问您贵姓？', '正式询问姓氏', COLORS.yellowSoft, COLORS.coral],
    ['怎么称呼您？', '不知道怎么叫', COLORS.lilac, COLORS.purple]
  ];
  items.forEach(([phrase, label, fill, accent], index) => {
    const x = 0.78 + index * 4.18;
    addCard(slide, x, 2.44, 3.82, 2.9, fill, phrase, label, { titleSize: 25, bodySize: 17, bodyColor: accent, accent, accentW: 2.2, accentH: 0.08, accentX: 0.82, accentY: 2.18, titleY: 0.6 });
  });
  addNotes(slide, spec, '本页不放拼音或页脚；让学生直接比较三种问法。');
}

function renderAskMethodSlide(pptx, page, label, phrase, fill, accent, spec) {
  const slide = newStandardSlide(pptx, page, '问称呼的方法', COLORS.paper);
  addCard(slide, 1.32, 1.92, 10.7, 3.86, fill, label, phrase, {
    titleSize: 28,
    bodySize: 38,
    bodyColor: COLORS.ink,
    bodyBold: true,
    accent,
    accentW: 3.2,
    accentH: 0.08,
    accentX: 3.75,
    accentY: 1.32,
    titleY: 0.62,
    bodyY: 1.72,
    bodyH: 0.85
  });
  addNotes(slide, spec, '本页只呈现问法，不提供回答句式，也不放页脚。');
}

function renderSlide11(pptx, spec) {
  renderAskMethodSlide(pptx, 11, '问姓', '请问您贵姓？', COLORS.lilac, COLORS.purple, spec);
}

function renderSlide12Ask(pptx, spec) {
  renderAskMethodSlide(pptx, 12, '问称呼', '怎么称呼您？', COLORS.mint, COLORS.teal, spec);
}

function renderSurnameRoleSlide(pptx, page, label, breakdown, imagePath, fill, accent, spec) {
  const slide = newStandardSlide(pptx, page, '姓＋身份', COLORS.paper);
  addText(slide, '中国人习惯用“姓＋身份”来称呼别人。', 0.9, 1.58, 11.5, 0.5, { fontSize: 25, color: COLORS.teal, bold: true, align: 'center' });
  addImagePanel(slide, [imagePath], 0.86, 2.22, 5.2, 4.08, fill, 1);
  addText(slide, label, 6.62, 2.42, 5.22, 0.88, { fontSize: 48, color: COLORS.ink, bold: true, align: 'center' });
  addAccent(slide, 7.3, 3.62, 3.86, accent, 0.08);
  addText(slide, breakdown, 6.46, 4.06, 5.54, 0.5, { fontSize: 22, color: accent, bold: true, align: 'center' });
  addNotes(slide, spec, `引导学生先看图片，再读称呼“${label}”；提醒学生观察“姓＋身份”的顺序。`);
}

function renderSlide13SurnameTeacher(pptx, spec) {
  renderSurnameRoleSlide(pptx, 13, '王老师', '王（姓）＋老师（身份）', images.surnameTeacher, COLORS.mint, COLORS.teal, spec);
}

function renderSlide14SurnameDoctor(pptx, spec) {
  renderSurnameRoleSlide(pptx, 14, '李医生', '李（姓）＋医生（身份）', images.surnameDoctor, COLORS.yellowSoft, COLORS.coral, spec);
}

function renderSlide15SurnameDirector(pptx, spec) {
  renderSurnameRoleSlide(pptx, 15, '张主任', '张（姓）＋主任（身份）', images.surnameDirector, COLORS.lilac, COLORS.purple, spec);
}

function renderSlide16SurnameStudent(pptx, spec) {
  renderSurnameRoleSlide(pptx, 16, '阮同学', '阮（姓）＋同学（身份）', images.surnameStudent, COLORS.coralSoft, COLORS.ink, spec);
}

function renderSlide17SurnameRoleQuestion(pptx, spec) {
  const slide = newStandardSlide(pptx, 17, '姓＋身份', COLORS.paper);
  addText(slide, '和越南人的称呼方法\n有什么不同？', 0.92, 2.02, 7.28, 1.52, { fontSize: 38, color: COLORS.ink, bold: true, valign: 'top' });
  addAccent(slide, 0.94, 4.02, 5.95, COLORS.purple, 0.08);
  addText(slide, '想一想，再和同伴说一说。', 0.94, 4.48, 6.9, 0.48, { fontSize: 22, color: COLORS.teal, bold: true });
  addCard(slide, 8.72, 1.92, 3.52, 3.88, COLORS.lilac, '？', '', { titleSize: 82, titleColor: COLORS.purple, titleY: 1.08, accent: COLORS.purple, accentH: 0.08, accentW: 1.75, accentX: 0.88, accentY: 2.82 });
  addNotes(slide, spec, '先让学生比较前四页的四个例子，再讨论中国人与越南人的称呼方法有什么不同。');
}

function renderSlide13(pptx, spec) {
  const slide = newStandardSlide(pptx, 18, '熟人称呼方式', COLORS.paper);
  addText(slide, '关系熟了以后，可以这样称呼。', 0.9, 1.58, 11.5, 0.5, { fontSize: 25, color: COLORS.teal, bold: true, align: 'center' });
  const items = [
    ['名字', '直接叫名字', COLORS.mint, COLORS.teal],
    ['小＋姓／名字', '小王／小明', COLORS.yellowSoft, COLORS.coral],
    ['老＋姓／名字', '老李／老王', COLORS.lilac, COLORS.purple],
    ['阿＋名字', '阿丽／阿明', COLORS.coralSoft, COLORS.ink]
  ];
  items.forEach(([label, body, fill, accent], index) => {
    const x = index % 2 === 0 ? 0.88 : 6.84;
    const y = index < 2 ? 2.28 : 4.08;
    addCard(slide, x, y, 5.66, 1.42, fill, label, body, { titleSize: 25, bodySize: 18, bodyColor: accent, bodyBold: true, accent, accentH: 0.08, accentW: 2.25, accentX: 0.82, accentY: 1.08, titleY: 0.24, bodyY: 0.82, bodyH: 0.3 });
  });
  addNotes(slide, spec, '提醒学生：熟人称呼仍然要看年龄和关系，不能看到姓就随便加“小”或“老”。');
}

function renderSlide14(pptx, spec) {
  const slide = newStandardSlide(pptx, 19, '不确定时，先用安全称呼', COLORS.paper);
  addText(slide, '不确定怎么叫时，先用安全称呼。', 0.88, 1.58, 7.3, 0.52, { fontSize: 25, color: COLORS.teal, bold: true });
  const items = [
    ['服务员', COLORS.mint, COLORS.teal],
    ['师傅', COLORS.yellowSoft, COLORS.coral],
    ['女士', COLORS.lilac, COLORS.purple],
    ['先生', COLORS.coralSoft, COLORS.ink]
  ];
  items.forEach(([label, fill, accent], index) => {
    const x = index % 2 === 0 ? 0.88 : 4.46;
    const y = index < 2 ? 2.38 : 3.98;
    addCard(slide, x, y, 3.18, 1.18, fill, label, '', { titleSize: 26, accent, accentH: 0.08, accentW: 1.6, accentX: 0.79, accentY: 0.88, titleY: 0.3 });
  });
  addImagePanel(slide, [images.service, images.safeAddress], 8.42, 1.72, 4.08, 4.9, COLORS.mint, 1);
  addNotes(slide, spec, '本页只练习四个较安全的称呼：服务员、师傅、女士、先生。');
}

function renderSlide15(pptx, spec) {
  const slide = newStandardSlide(pptx, 20, '', COLORS.paper);
  addText(slide, '注意', 0.9, 0.9, 11.5, 0.58, { fontSize: 38, color: COLORS.coral, bold: true, align: 'center' });
  addAccent(slide, 5.45, 1.72, 2.42, COLORS.coral, 0.08);
  const items = [
    ['小姐', COLORS.coralSoft],
    ['太太', COLORS.yellowSoft],
    ['女人', COLORS.lilac]
  ];
  items.forEach(([label, fill], index) => {
    const x = 0.92 + index * 4.14;
    addCard(slide, x, 2.72, 3.68, 2.5, fill, label, '', { titleSize: 36, titleColor: COLORS.coral, titleY: 0.82, accent: COLORS.coral, accentH: 0.08, accentW: 1.85, accentX: 0.92, accentY: 1.84 });
  });
  addNotes(slide, spec, '本页只呈现三个需要特别注意的词，不在学生画面补充解释。');
}

function renderSlide16(pptx, spec) {
  const slide = newStandardSlide(pptx, 21, '情境任务：完成一次第一次见面', COLORS.paper);
  addImagePanel(slide, [images.teacherStudent], 0.84, 1.72, 4.0, 4.92, COLORS.mint, 1);
  addText(slide, '一个人是老师，\n一个人是学生。', 5.44, 2.02, 6.7, 1.18, { fontSize: 33, bold: true, valign: 'top' });
  addAccent(slide, 5.46, 3.62, 5.8, COLORS.coral, 0.08);
  addCard(slide, 5.46, 4.12, 2.86, 1.22, COLORS.yellowSoft, '老师', '', { titleSize: 26, accent: COLORS.coral, accentH: 0.08, accentW: 1.4, accentX: 0.74, accentY: 0.88, titleY: 0.3 });
  addCard(slide, 8.82, 4.12, 2.86, 1.22, COLORS.lilac, '学生', '', { titleSize: 26, accent: COLORS.purple, accentH: 0.08, accentW: 1.4, accentX: 0.74, accentY: 0.88, titleY: 0.3 });
  addOutcome(slide, '完成一次第一次见面', 5.46, 5.8, 6.1);
  addNotes(slide, spec, '两人一组：一人扮演老师，一人扮演学生；完成第一次见面的问答，再交换角色。');
}

function renderSlide17(pptx, spec) {
  const slide = newStandardSlide(pptx, 22, '你现在会怎么称呼？', COLORS.paper);
  addText(slide, '回答五个具体情境：应该怎么称呼？', 0.9, 1.58, 11.5, 0.5, { fontSize: 25, color: COLORS.teal, bold: true, align: 'center' });
  const scenarios = [
    '第一次见到一位老师，知道他姓王。\n我会说：________',
    '在餐厅请工作人员过来。\n我会说：________',
    '坐出租车，请司机停车。\n我会说：________',
    '第一次见到一位年长女性。\n我会说：________',
    '和熟悉的同事李明说话。\n我会说：________'
  ];
  const fills = [COLORS.mint, COLORS.yellowSoft, COLORS.lilac, COLORS.coralSoft, COLORS.blue];
  const accents = [COLORS.teal, COLORS.coral, COLORS.purple, COLORS.ink, COLORS.teal];
  scenarios.forEach((scenario, index) => {
    const isTop = index < 2;
    const x = isTop ? 0.86 + index * 5.98 : 0.86 + (index - 2) * 4.14;
    const y = isTop ? 2.38 : 4.38;
    const w = isTop ? 5.66 : 3.68;
    addCard(slide, x, y, w, 1.38, fills[index], String(index + 1).padStart(2, '0'), scenario, { titleSize: 12, titleColor: COLORS.muted, titleX: 0.28, titleY: 0.18, titleH: 0.2, align: 'left', bodySize: w < 4 ? 16 : 17, bodyColor: COLORS.ink, bodyBold: true, bodyX: 0.28, bodyY: 0.48, bodyH: 0.68, accent: accents[index], accentW: 0.08, accentH: 0.72, accentX: 0.16, accentY: 0.3, align: 'left' });
  });
  addNotes(slide, spec, '学生逐题回答，教师只在称呼不合适时做即时修补；不预先显示标准答案。');
}

function renderAll() {
  assertProductionGate();
  ensureAssets();
  fs.writeFileSync(assetManifestPath, JSON.stringify({
    generated_by: 'OpenAI image generation',
    style_reference: '第一课20-approved/pptx/第一课-中国人的姓名.pptx',
    policy: '生成插画不含可读文字；中文字由 PPT 原生文字添加。',
    files: Object.fromEntries(Object.entries(images).map(([key, filePath]) => [key, {
      file: path.relative(outputDir, filePath),
      sha256: sha256(filePath),
      embedded_in_pptx: true
    }]))
  }, null, 2) + '\n');

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = '荣市大学华语听说课程';
  pptx.company = '荣市大学';
  pptx.subject = '第一课文化补充：姓名与称呼';
  pptx.title = '第一课文化补充：姓名与称呼';
  pptx.lang = 'zh-CN';
  pptx.theme = { headFontFace: CJK_FONT, bodyFontFace: CJK_FONT, lang: 'zh-CN' };

  const renderers = [renderSlide1, renderSlide2, renderSlide3, renderSlide4, renderSlide5, renderSlide6, renderSlide7, renderSlide8, renderSlide9, renderSlide10, renderSlide11, renderSlide12Ask, renderSlide13SurnameTeacher, renderSlide14SurnameDoctor, renderSlide15SurnameDirector, renderSlide16SurnameStudent, renderSlide17SurnameRoleQuestion, renderSlide13, renderSlide14, renderSlide15, renderSlide16, renderSlide17];
  renderers.forEach((renderer, index) => renderer(pptx, slideSpecs[index]));
  return pptx.writeFile({ fileName: pptxPath }).then(() => {
    const manifest = {
      status: 'draft_for_review',
      deck_title: '第一课文化补充：姓名与称呼',
      version: 'v4',
      slide_count: renderers.length,
      format: 'native_editable_pptx',
      layout: '16:9',
      language: '简体中文',
      cjk_font: CJK_FONT,
      template: '第一课最终版统一视觉母版 V4',
      template_source: 'lessons/boya-intermediate-i/lesson-01/20-approved/pptx/第一课-中国人的姓名.pptx',
      no_textbook_page_markers: true,
      scope: ['如何给孩子取名字：三种常见方式', '如何称呼中国人：关系、年龄、身份、场合'],
      requested_revisions: [
        '阅读短文（一）（二）直接加入口语练习',
        '第9页只呈现关系、年龄、身份、场合',
        '第10页不放拼音和页脚',
        '第11、12页拆分问称呼的方法；只保留问法，不放回答句式和底部页脚',
        '姓＋身份例子为王老师、李医生、张主任、阮同学',
        '第13至16页每页只呈现一个姓＋身份例子，并配对应生成插画',
        '四个姓＋身份例子之后单独加入和越南人的称呼方法有什么不同',
        '熟人称呼使用名字、小＋姓／名字、老＋姓／名字、阿＋名字',
        '安全称呼使用服务员、师傅、女士、先生',
        '第15页只列小姐、太太、女人',
        '删除原第17页；课末改为五个具体情境'
      ],
      generated_assets: Object.keys(images),
      output_files: [path.basename(pptxPath), path.basename(outlinePath), path.basename(storyboardPath), 'assets/asset-manifest.json'],
      pptx_sha256: sha256(pptxPath),
      speaker_notes_count: renderers.length,
      classroom_rehearsal: 'not_run'
    };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    writeOutline();
    writeStoryboard();
    console.log(JSON.stringify({ pptx: pptxPath, outline: outlinePath, storyboard: storyboardPath, manifest: manifestPath, slide_count: renderers.length, sha256: manifest.pptx_sha256 }, null, 2));
  });
}

function writeOutline() {
  const lines = [
    '# 第一课文化补充：姓名与称呼 v4',
    '',
    '本版本严格沿用第一课最终版统一视觉母版；只更换本补充内容的文字与 AI 生成插画。',
    '',
    '| 页码 | 部分 | 页面标题 | 学生要做什么 |',
    '| ---: | --- | --- | --- |',
    ...slideSpecs.map((row) => `| ${row[0]} | ${row[1]} | ${row[3]} | ${row[4]} |`),
    ''
  ];
  fs.writeFileSync(outlinePath, lines.join('\n'));
}

function writeStoryboard() {
  const rows = [
    'slide_no,section,page_type,title,student_instruction_zh,template,generated_assets',
    ...slideSpecs.map((row, index) => {
      const assets = [0, 1, 2, 3, 4, 6, 7, 12, 13, 14, 15, 18, 20].includes(index) ? 'generated' : 'shape-only';
      return [row[0], row[1], row[2], row[3], row[4], 'lesson-01-final-v4', assets].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',');
    })
  ];
  fs.writeFileSync(storyboardPath, rows.join('\n') + '\n');
}

renderAll().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
