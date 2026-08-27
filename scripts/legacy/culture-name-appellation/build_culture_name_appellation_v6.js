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
const cultureVersion = process.env.BOYA_CULTURE_VERSION || 'v12';
const outputDir = process.env.BOYA_CULTURE_DRAFT_DIR
  ? path.resolve(process.env.BOYA_CULTURE_DRAFT_DIR)
  : path.join(lessonRoot, '10-design/pptx-draft/social-appellation-supplement-v12');
const assetDir = path.join(outputDir, 'assets');
const pptxPath = path.join(outputDir, `第一课-文化补充-姓名与称呼-${cultureVersion}-draft.pptx`);
const outlinePath = path.join(outputDir, `第一课-文化补充-姓名与称呼-${cultureVersion}-outline.md`);
const storyboardPath = path.join(outputDir, `第一课-文化补充-姓名与称呼-${cultureVersion}-storyboard.csv`);
const audioScriptPath = path.join(outputDir, `第一课-文化补充-姓名与称呼-${cultureVersion}-audio-script.md`);
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
  surnameStudent: path.join(assetDir, 'surname-student.png'),
  familiarName: path.join(assetDir, 'familiar-name.png'),
  familiarSmall: path.join(assetDir, 'familiar-small.png'),
  familiarOld: path.join(assetDir, 'familiar-old.png'),
  familiarA: path.join(assetDir, 'familiar-a.png'),
  safeServer: path.join(assetDir, 'safe-server.png'),
  safeMaster: path.join(assetDir, 'safe-master.png'),
  safeMs: path.join(assetDir, 'safe-ms.png'),
  safeMr: path.join(assetDir, 'safe-mr.png'),
  nameAdvisor: path.join(assetDir, 'name-advisor.png'),
  nameBlessing: path.join(assetDir, 'name-blessing.png'),
  nameSelect: path.join(assetDir, 'name-select.png'),
  askSurname: path.join(assetDir, 'ask-surname.png'),
  askAddress: path.join(assetDir, 'ask-address.png'),
  quizCompare: path.join(assetDir, 'quiz-compare.png')
};

const slideSpecs = [
  ['1', '姓名', 'divider', '中国人如何给孩子取名字？', '先认识三种常见方法。'],
  ['2', '姓名', 'method', '方法一：请别人帮忙取名字', '认识第一种取名方法。'],
  ['3', '姓名', 'expectation', '方法二：把期望和祝福放进名字里', '这些名字有什么意思？'],
  ['4', '姓名', 'choose', '方法三：自己选字、组合名字', '认识第三种取名方法。'],
  ['5', '姓名', 'choose-discussion', '你选哪一个？为什么？', '小组讨论五分钟，然后发表。'],
  ['6', '称呼', 'divider', '怎么称呼别人？', '先认识不同场合的称呼方法。'],
  ['7', '称呼', 'listening-dialogue', '听力练习', '听对话，说说你学到了什么。'],
  ['8', '称呼', 'answer-questions', '回答问题', '根据对话回答两个问题。'],
  ['9', '称呼', 'four-factors', '称呼要看什么？', '关系、年龄、身份、场合。'],
  ['10', '称呼', 'question-name-divider', '怎么问姓名？', ''],
  ['11', '称呼', 'question-methods', '怎么问姓名？', ''],
  ['12', '称呼', 'ask-surname', '问称呼的方法', '只练习问姓。'],
  ['13', '称呼', 'ask-address', '问称呼的方法', '只练习问称呼。'],
  ['14', '称呼', 'school-company-divider', '在学校和公司', '认识学校和公司里的称呼。'],
  ['15', '称呼', 'surname-role', '姓＋身份：王老师', '观察图片，读一读“王老师”。'],
  ['16', '称呼', 'surname-role', '姓＋身份：李医生', '观察图片，读一读“李医生”。'],
  ['17', '称呼', 'surname-role', '姓＋身份：张主任', '观察图片，读一读“张主任”。'],
  ['18', '称呼', 'surname-role', '姓＋身份：阮同学', '观察图片，读一读“阮同学”。'],
  ['19', '称呼', 'surname-role-question', '和越南人的称呼方法有什么不同？', '想一想，再和同伴说一说。'],
  ['20', '称呼', 'familiar-divider', '熟人', '认识熟人之间的称呼方法。'],
  ['21', '称呼', 'familiar-name', '熟人称呼方式：名字', '看图，读一读“名字”。'],
  ['22', '称呼', 'familiar-small', '熟人称呼方式：小＋姓／名字', '看图，读一读“小＋姓／名字”。'],
  ['23', '称呼', 'familiar-old', '熟人称呼方式：老＋姓／名字', '看图，读一读“老＋姓／名字”。'],
  ['24', '称呼', 'familiar-a', '熟人称呼方式：阿＋名字', '看图，读一读“阿＋名字”。'],
  ['25', '称呼', 'safe-divider', '安全称呼', ''],
  ['26', '称呼', 'safe-service', '安全称呼：服务员', '看图，读一读“服务员”。'],
  ['27', '称呼', 'safe-master', '安全称呼：师傅', '看图，读一读“师傅”。'],
  ['28', '称呼', 'safe-ms', '安全称呼：女士', '看图，读一读“女士”。'],
  ['29', '称呼', 'safe-mr', '安全称呼：先生', '看图，读一读“先生”。'],
  ['30', '称呼', 'safe-situation-quiz', '在咖啡店第一次见面，你怎么称呼他们？', '回答五个具体情境。'],
  ['31', '称呼', 'caution', '注意', '看一看，记住这三个词。'],
  ['32', '称呼', 'roleplay', '情境任务：完成一次第一次见面', '一个人是老师，一个人是学生。'],
  ['33', '称呼', 'scenarios', '你现在会怎么称呼？', '请回答']
];

const listeningDialogue = [
  '学生：老师，请问你叫什么名字？',
  '老师：你可以这样问我：“请问怎么称呼您？”或者：“请问您贵姓？”',
  '学生：请问您贵姓？',
  '老师：我姓王，你可以叫我王老师。',
  '学生：好的，谢谢王老师。'
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
  addNotes(slide, spec, '本页只介绍三种常见做法，保持内容简单。');
}

function renderSlide2(pptx, spec) {
  const slide = newStandardSlide(pptx, Number(spec[0]), spec[3], COLORS.paper);
  addText(slide, '有些家庭会请算命老师\n帮孩子取一个名字。', 0.88, 1.92, 7.2, 1.5, { fontSize: 34, bold: true, valign: 'top' });
  addAccent(slide, 0.88, 3.9, 6.65, COLORS.teal, 0.08);
  addImagePanel(slide, [images.nameAdvisor], 8.7, 1.72, 3.75, 4.9, COLORS.sand, 1);
  addNotes(slide, spec, '“算命老师”只作为一种社会文化现象简单提及；不解释命理依据，也不把这种方式说成一定有效。');
}

function renderSlide3(pptx, spec) {
  const slide = newStandardSlide(pptx, Number(spec[0]), spec[3], COLORS.paper);
  addText(slide, '父母常把对孩子的期望和祝福\n放进名字里。', 0.9, 1.82, 7.1, 1.18, { fontSize: 32, bold: true, valign: 'top' });
  addAccent(slide, 0.9, 3.28, 6.55, COLORS.teal, 0.08);
  addTopics(slide, ['康', '勇', '安'], 0.9, 3.72, 7.12);
  addText(slide, '这些名字有什么意思？', 0.9, 5.45, 7.12, 0.48, { fontSize: 20, color: COLORS.teal, bold: true });
  addImagePanel(slide, [images.nameBlessing], 8.68, 1.72, 3.82, 4.92, COLORS.mint, 1);
  addNotes(slide, spec);
}

function renderSlide4(pptx, spec) {
  const slide = newStandardSlide(pptx, Number(spec[0]), spec[3], COLORS.paper);
  addText(slide, '有些父母自己查字、选字、\n组合名字。', 0.88, 1.82, 7.18, 1.16, { fontSize: 32, bold: true, valign: 'top' });
  addAccent(slide, 0.88, 3.28, 6.7, COLORS.purple, 0.08);
  addText(slide, '他们希望名字：', 0.88, 3.72, 2.6, 0.35, { fontSize: 19, color: COLORS.teal, bold: true });
  addTopics(slide, ['好写', '好记', '意思好'], 0.88, 4.15, 7.1);
  addImagePanel(slide, [images.nameSelect], 8.68, 1.72, 3.82, 4.92, COLORS.yellowSoft, 0);
  addNotes(slide, spec, '这里的“选字”只表示选择姓名用字，不展开其他取名知识。');
}

function renderChooseDiscussion(pptx, spec) {
  const slide = newStandardSlide(pptx, Number(spec[0]), spec[3], COLORS.paper);
  addText(slide, '从三种方法中选一个，\n说说你的理由。', 0.9, 1.76, 7.1, 1.18, { fontSize: 32, bold: true, valign: 'top' });
  addAccent(slide, 0.9, 3.28, 6.55, COLORS.purple, 0.08);
  const items = [
    ['方法一', '请别人帮忙', COLORS.mint, COLORS.teal],
    ['方法二', '期望和祝福', COLORS.yellowSoft, COLORS.coral],
    ['方法三', '自己选字', COLORS.lilac, COLORS.purple]
  ];
  items.forEach(([title, body, fill, accent], index) => {
    addCard(slide, 0.9 + index * 2.42, 4.06, 2.12, 1.28, fill, title, body, {
      titleSize: 20,
      bodySize: 16,
      bodyColor: accent,
      accent,
      accentW: 1.2,
      accentH: 0.08,
      accentX: 0.46,
      accentY: 0.98,
      titleY: 0.22,
      bodyY: 0.6,
      bodyH: 0.26
    });
  });
  addText(slide, '小组讨论五分钟，然后发表。', 0.9, 5.82, 7.1, 0.42, { fontSize: 20, color: COLORS.teal, bold: true });
  addImagePanel(slide, [images.group], 8.68, 1.72, 3.82, 4.92, COLORS.mint, 1);
  addNotes(slide, spec, '学生分组讨论五分钟；每组选择一种方法并说明理由，然后由小组代表发表。');
}

function renderSlide5(pptx, spec) {
  const slide = newDividerSlide(pptx, '怎么称呼别人？', images.teacherStudent, COLORS.mintDeep);
  addNotes(slide, spec);
}

function renderSlide6(pptx, spec) {
  const slide = newStandardSlide(pptx, Number(spec[0]), '你会怎么问？', COLORS.paper);
  addText(slide, '第一次见到一位老师，\n你会怎么问？', 0.9, 1.62, 11.5, 0.82, { fontSize: 28, color: COLORS.teal, bold: true, align: 'center' });
  const items = [
    ['你叫什么名字？', '', COLORS.mint, COLORS.teal],
    ['请问您贵姓？', '', COLORS.yellowSoft, COLORS.coral],
    ['怎么称呼您？', '', COLORS.lilac, COLORS.purple]
  ];
  items.forEach(([phrase, label, fill, accent], index) => {
    const x = 0.78 + index * 4.18;
    addCard(slide, x, 2.72, 3.82, 2.64, fill, phrase, label, { titleSize: 25, bodySize: 17, bodyColor: accent, accent, accentH: 0.08, accentW: 2.1, accentX: 0.86, accentY: 1.92, titleY: 0.58 });
  });
  addNotes(slide, spec);
}

function renderSlide7Listening(pptx, spec) {
  const slide = newStandardSlide(pptx, Number(spec[0]), spec[3], COLORS.paper);
  addAccent(slide, 0.9, 1.78, 0.08, COLORS.teal, 3.48);
  addText(slide, '听对话，说说你学到了什么。', 1.24, 2.14, 6.92, 0.72, { fontSize: 29, bold: true, valign: 'top' });
  addCard(slide, 1.24, 3.48, 2.7, 1.36, COLORS.yellowSoft, '老师', '', { titleSize: 28, accent: COLORS.coral, accentW: 1.5, accentH: 0.08, accentX: 0.6, accentY: 1.04, titleY: 0.38 });
  addCard(slide, 4.34, 3.48, 2.7, 1.36, COLORS.lilac, '学生', '', { titleSize: 28, accent: COLORS.purple, accentW: 1.5, accentH: 0.08, accentX: 0.6, accentY: 1.04, titleY: 0.38 });
  addImagePanel(slide, [images.reading], 8.62, 1.76, 3.85, 4.86, COLORS.mint, 1);
  addNotes(slide, spec, `教师播放另行生成的音频。六句对话如下：\n${listeningDialogue.join('\n')}`);
}

function renderSlide8Questions(pptx, spec) {
  const slide = newStandardSlide(pptx, Number(spec[0]), spec[3], COLORS.paper);
  addAccent(slide, 0.9, 1.78, 0.08, COLORS.teal, 3.48);
  addCard(slide, 1.24, 1.98, 6.82, 1.52, COLORS.mint, '问题一', '学生先怎么问老师的名字？', { titleSize: 20, bodySize: 24, bodyColor: COLORS.ink, bodyBold: true, align: 'left', accent: COLORS.teal, accentW: 0.08, accentH: 0.8, accentX: 0.24, accentY: 0.36, titleX: 0.56, titleY: 0.28, bodyX: 0.56, bodyY: 0.74, bodyH: 0.42 });
  addCard(slide, 1.24, 3.86, 6.82, 1.52, COLORS.yellowSoft, '问题二', '不确定怎么称呼别人时，老师建议怎么做？', { titleSize: 20, bodySize: 22, bodyColor: COLORS.ink, bodyBold: true, align: 'left', accent: COLORS.coral, accentW: 0.08, accentH: 0.8, accentX: 0.24, accentY: 0.36, titleX: 0.56, titleY: 0.28, bodyX: 0.56, bodyY: 0.74, bodyH: 0.42 });
  addImagePanel(slide, [images.group], 8.62, 1.76, 3.85, 4.86, COLORS.blue, 0);
  addNotes(slide, spec, '根据听力对话回答两个问题；不先显示答案。');
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

function renderQuestionNameDivider(pptx, spec) {
  const slide = newDividerSlide(pptx, spec[3], images.teacherStudent, COLORS.yellowSoft);
  addNotes(slide, spec, '先让学生观察图片，再比较不同问法。');
}

function renderSlide10(pptx, spec) {
  const slide = newStandardSlide(pptx, Number(spec[0]), '怎么问姓名？', COLORS.paper);
  const items = [
    ['你叫什么名字？', '', COLORS.mint, COLORS.teal],
    ['请问您贵姓？', '', COLORS.yellowSoft, COLORS.coral],
    ['怎么称呼您？', '', COLORS.lilac, COLORS.purple]
  ];
  items.forEach(([phrase, label, fill, accent], index) => {
    const x = 0.78 + index * 4.18;
    addCard(slide, x, 2.44, 3.82, 2.9, fill, phrase, label, { titleSize: 25, bodySize: 17, bodyColor: accent, accent, accentW: 2.2, accentH: 0.08, accentX: 0.82, accentY: 2.18, titleY: 0.6 });
  });
  addNotes(slide, spec, '让学生直接比较三种问法；本页不放拼音或页脚。');
}

function renderAskMethodSlide(pptx, page, label, phrase, fill, accent, spec, imagePath) {
  const slide = newStandardSlide(pptx, page, '问称呼的方法', COLORS.paper);
  addImagePanel(slide, [imagePath], 0.86, 1.82, 4.2, 4.84, fill, 1);
  addCard(slide, 5.5, 2.08, 6.5, 3.62, fill, label, phrase, {
    titleSize: 28,
    bodySize: 38,
    bodyColor: COLORS.ink,
    bodyBold: true,
    accent,
    accentW: 3.2,
    accentH: 0.08,
    accentX: 2.3,
    accentY: 1.32,
    titleY: 0.62,
    bodyY: 1.72,
    bodyH: 0.85
  });
  addNotes(slide, spec, '本页只呈现问法，不提供回答句式，也不放页脚。');
}

function renderSlide11(pptx, spec) {
  renderAskMethodSlide(pptx, Number(spec[0]), '问姓', '请问您贵姓？', COLORS.lilac, COLORS.purple, spec, images.askSurname);
}

function renderSlide12Ask(pptx, spec) {
  renderAskMethodSlide(pptx, Number(spec[0]), '问称呼', '怎么称呼您？', COLORS.mint, COLORS.teal, spec, images.askAddress);
}

function renderSurnameRoleSlide(pptx, page, label, breakdown, imagePath, fill, accent, spec) {
  const slide = newStandardSlide(pptx, page, '姓＋身份', COLORS.paper);
  addText(slide, '中国人习惯用“姓＋身份”来称呼别人。', 0.9, 1.58, 11.5, 0.5, { fontSize: 25, color: COLORS.teal, bold: true, align: 'center' });
  addImagePanel(slide, [imagePath], 0.86, 2.22, 5.2, 4.08, fill, 1);
  addText(slide, label, 6.62, 2.42, 5.22, 0.88, { fontSize: 48, color: COLORS.ink, bold: true, align: 'center' });
  addAccent(slide, 7.3, 3.62, 3.86, accent, 0.08);
  addNotes(slide, spec, `引导学生先看图片，再读称呼“${label}”；提醒学生观察“姓＋身份”的顺序。`);
}

function renderSlide13SurnameTeacher(pptx, spec) {
  renderSurnameRoleSlide(pptx, Number(spec[0]), '王老师', '', images.surnameTeacher, COLORS.mint, COLORS.teal, spec);
}

function renderSlide14SurnameDoctor(pptx, spec) {
  renderSurnameRoleSlide(pptx, Number(spec[0]), '李医生', '', images.surnameDoctor, COLORS.yellowSoft, COLORS.coral, spec);
}

function renderSlide15SurnameDirector(pptx, spec) {
  renderSurnameRoleSlide(pptx, Number(spec[0]), '张主任', '', images.surnameDirector, COLORS.lilac, COLORS.purple, spec);
}

function renderSlide16SurnameStudent(pptx, spec) {
  renderSurnameRoleSlide(pptx, Number(spec[0]), '阮同学', '', images.surnameStudent, COLORS.coralSoft, COLORS.ink, spec);
}

function renderSlide17SurnameRoleQuestion(pptx, spec) {
  const slide = newStandardSlide(pptx, Number(spec[0]), spec[3], COLORS.paper);
  addAccent(slide, 0.94, 4.02, 5.95, COLORS.purple, 0.08);
  addText(slide, '想一想，再和同伴说一说。', 0.94, 4.48, 6.9, 0.48, { fontSize: 22, color: COLORS.teal, bold: true });
  addImagePanel(slide, [images.quizCompare], 8.68, 1.72, 3.82, 4.92, COLORS.lilac, 1);
  addNotes(slide, spec, '先让学生比较前四页的四个例子，再讨论中国人与越南人的称呼方法有什么不同。');
}

function renderSchoolCompanyDivider(pptx, spec) {
  const slide = newDividerSlide(pptx, spec[3], images.teacherStudent, COLORS.mintDeep);
  addNotes(slide, spec, '进入学校和公司部分；先观察图片，再学习“姓＋身份”的称呼。');
}

function renderFamiliarDivider(pptx, spec) {
  const slide = newDividerSlide(pptx, spec[3], images.familiarName, COLORS.lilac);
  addNotes(slide, spec, '进入熟人称呼部分；提醒学生称呼要看关系和年龄。');
}

function renderFamiliarMethodSlide(pptx, page, label, body, imagePath, fill, accent, spec) {
  const slide = newStandardSlide(pptx, page, '熟人称呼方式', COLORS.paper);
  addText(slide, '关系熟了以后，可以这样称呼。', 0.9, 1.58, 11.5, 0.5, { fontSize: 25, color: COLORS.teal, bold: true, align: 'center' });
  addImagePanel(slide, [imagePath], 0.86, 2.18, 5.2, 4.16, fill, 1);
  addText(slide, label, 6.56, 2.42, 5.34, 0.86, { fontSize: label.length > 5 ? 33 : 46, color: COLORS.ink, bold: true, align: 'center' });
  addAccent(slide, 7.24, 3.64, 3.98, accent, 0.08);
  if (body) addText(slide, body, 6.5, 4.08, 5.48, 0.52, { fontSize: 22, color: accent, bold: true, align: 'center' });
  addNotes(slide, spec, `引导学生先看图片，再读称呼“${label}”；提醒学生根据关系和年龄选择合适的熟人称呼。`);
}

function renderFamiliarName(pptx, spec) {
  renderFamiliarMethodSlide(pptx, Number(spec[0]), '名字', '', images.familiarName, COLORS.mint, COLORS.teal, spec);
}

function renderFamiliarSmall(pptx, spec) {
  renderFamiliarMethodSlide(pptx, Number(spec[0]), '小＋姓／名字', '小王／小明', images.familiarSmall, COLORS.yellowSoft, COLORS.coral, spec);
}

function renderFamiliarOld(pptx, spec) {
  renderFamiliarMethodSlide(pptx, Number(spec[0]), '老＋姓／名字', '老李／老王', images.familiarOld, COLORS.lilac, COLORS.purple, spec);
}

function renderFamiliarA(pptx, spec) {
  renderFamiliarMethodSlide(pptx, Number(spec[0]), '阿＋名字', '阿丽／阿明', images.familiarA, COLORS.coralSoft, COLORS.ink, spec);
}

function renderSafeDivider(pptx, spec) {
  const slide = newDividerSlide(pptx, spec[3], images.safeAddress, COLORS.mintDeep);
  addNotes(slide, spec, '先让学生观察图片，再认识下面四个词。');
}

function renderSafeWordSlide(pptx, page, label, body, imagePath, fill, accent, spec) {
  const slide = newStandardSlide(pptx, page, '安全称呼', COLORS.paper);
  addText(slide, '不确定怎么叫时，先用安全称呼。', 0.9, 1.58, 11.5, 0.5, { fontSize: 25, color: COLORS.teal, bold: true, align: 'center' });
  addImagePanel(slide, [imagePath], 0.86, 2.18, 5.2, 4.16, fill, 1);
  addText(slide, label, 6.56, 2.42, 5.34, 0.86, { fontSize: 46, color: COLORS.ink, bold: true, align: 'center' });
  addAccent(slide, 7.24, 3.64, 3.98, accent, 0.08);
  if (body) addText(slide, body, 6.5, 4.08, 5.48, 0.52, { fontSize: 21, color: accent, bold: true, align: 'center' });
  addNotes(slide, spec, `引导学生先看图片，再读称呼“${label}”；提醒学生在不确定时可以先使用这个称呼。`);
}

function renderSafeServer(pptx, spec) {
  renderSafeWordSlide(pptx, Number(spec[0]), '服务员', '', images.safeServer, COLORS.mint, COLORS.teal, spec);
}

function renderSafeMaster(pptx, spec) {
  renderSafeWordSlide(pptx, Number(spec[0]), '师傅', '', images.safeMaster, COLORS.yellowSoft, COLORS.coral, spec);
}

function renderSafeMs(pptx, spec) {
  renderSafeWordSlide(pptx, Number(spec[0]), '女士', '', images.safeMs, COLORS.lilac, COLORS.purple, spec);
}

function renderSafeMr(pptx, spec) {
  renderSafeWordSlide(pptx, Number(spec[0]), '先生', '', images.safeMr, COLORS.coralSoft, COLORS.ink, spec);
}

function renderSafeSituationQuiz(pptx, spec) {
  const slide = newStandardSlide(pptx, Number(spec[0]), spec[3], COLORS.paper);
  addText(slide, '请根据年龄选择合适的称呼。', 0.9, 1.58, 11.5, 0.5, { fontSize: 25, color: COLORS.teal, bold: true, align: 'center' });
  const scenarios = [
    '一个10岁的小女孩',
    '一个15岁的男孩',
    '一个25岁的男人',
    '一个40岁的男人',
    '一个55岁的女人'
  ];
  const accents = [COLORS.teal, COLORS.coral, COLORS.purple, COLORS.ink, COLORS.teal];
  scenarios.forEach((scenario, index) => {
    const y = 2.28 + index * 0.78;
    addAccent(slide, 1.18, y + 0.08, 0.08, accents[index], 0.46);
    addText(slide, `${index + 1}. ${scenario}　　我会说：________`, 1.48, y, 10.15, 0.52, { fontSize: 24, color: COLORS.ink, bold: true, align: 'left' });
  });
  addNotes(slide, spec, '学生逐题回答；先听学生的选择，再根据关系、年龄和场合做简短修补。');
}

function renderSlide15(pptx, spec) {
  const slide = newStandardSlide(pptx, Number(spec[0]), '', COLORS.paper);
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
  const slide = newStandardSlide(pptx, Number(spec[0]), '情境任务：完成一次第一次见面', COLORS.paper);
  addImagePanel(slide, [images.teacherStudent], 0.84, 1.72, 4.0, 4.92, COLORS.mint, 1);
  addText(slide, '一个人是老师，\n一个人是学生。', 5.44, 2.02, 6.7, 1.18, { fontSize: 33, bold: true, valign: 'top' });
  addAccent(slide, 5.46, 3.62, 5.8, COLORS.coral, 0.08);
  addCard(slide, 5.46, 4.12, 2.86, 1.22, COLORS.yellowSoft, '老师', '', { titleSize: 26, accent: COLORS.coral, accentH: 0.08, accentW: 1.4, accentX: 0.74, accentY: 0.88, titleY: 0.3 });
  addCard(slide, 8.82, 4.12, 2.86, 1.22, COLORS.lilac, '学生', '', { titleSize: 26, accent: COLORS.purple, accentH: 0.08, accentW: 1.4, accentX: 0.74, accentY: 0.88, titleY: 0.3 });
  addNotes(slide, spec, '两人一组：一人扮演老师，一人扮演学生；完成第一次见面的问答，再交换角色。');
}

function renderSlide17(pptx, spec) {
  const slide = newStandardSlide(pptx, Number(spec[0]), '你现在会怎么称呼？', COLORS.paper);
  addText(slide, '请回答', 0.9, 1.58, 7.35, 0.5, { fontSize: 25, color: COLORS.teal, bold: true, align: 'center' });
  const scenarios = [
    '第一次见到老师，他姓王。',
    '在餐厅请工作人员过来。',
    '出租车的司机。',
    '第一次见到一位年长女性。',
    '熟悉的同事李明。'
  ];
  const accents = [COLORS.teal, COLORS.coral, COLORS.purple, COLORS.ink, COLORS.teal];
  scenarios.forEach((scenario, index) => {
    const y = 2.28 + index * 0.78;
    addAccent(slide, 1.12, y + 0.08, 0.08, accents[index], 0.46);
    addText(slide, `${String(index + 1).padStart(2, '0')}. ${scenario}　我会称呼：________`, 1.42, y, 7.15, 0.52, { fontSize: 20, color: COLORS.ink, bold: true, align: 'left' });
  });
  addImagePanel(slide, [images.quizCompare], 8.72, 1.82, 3.62, 4.82, COLORS.lilac, 1);
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
  fs.writeFileSync(audioScriptPath, [
    '# 听力练习音频文字稿',
    '',
    '请按以下顺序录制五句对话：',
    '',
    ...listeningDialogue.map((line, index) => `${index + 1}. ${line}`),
    ''
  ].join('\n'));

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = '荣市大学华语听说课程';
  pptx.company = '荣市大学';
  pptx.subject = '第一课文化补充：姓名与称呼';
  pptx.title = '第一课文化补充：姓名与称呼';
  pptx.lang = 'zh-CN';
  pptx.theme = { headFontFace: CJK_FONT, bodyFontFace: CJK_FONT, lang: 'zh-CN' };

  const renderers = [
    renderSlide1,
    renderSlide2,
    renderSlide3,
    renderSlide4,
    renderChooseDiscussion,
    renderSlide5,
    renderSlide7Listening,
    renderSlide8Questions,
    renderSlide9,
    renderQuestionNameDivider,
    renderSlide10,
    renderSlide11,
    renderSlide12Ask,
    renderSchoolCompanyDivider,
    renderSlide13SurnameTeacher,
    renderSlide14SurnameDoctor,
    renderSlide15SurnameDirector,
    renderSlide16SurnameStudent,
    renderSlide17SurnameRoleQuestion,
    renderFamiliarDivider,
    renderFamiliarName,
    renderFamiliarSmall,
    renderFamiliarOld,
    renderFamiliarA,
    renderSafeDivider,
    renderSafeServer,
    renderSafeMaster,
    renderSafeMs,
    renderSafeMr,
    renderSafeSituationQuiz,
    renderSlide15,
    renderSlide16,
    renderSlide17
  ];
  renderers.forEach((renderer, index) => renderer(pptx, slideSpecs[index]));
  return pptx.writeFile({ fileName: pptxPath }).then(() => {
    const manifest = {
      status: 'draft_for_review',
      deck_title: '第一课文化补充：姓名与称呼',
      version: cultureVersion,
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
        '课末最后一页已由教师在 PowerPoint 中手动修订；后续生成必须沿用手动修订文字，不得用旧版本覆盖',
        '课末“你现在会怎么称呼？”改为简单编号条列，并加入quiz插画，不使用色块框',
        '咖啡店年龄情境页改为简单编号条列，不使用色块框',
        '第10页前加入“怎么问姓名？”divider；原问法内容页顺延一页',
        '第2至4页为方法一、方法二、方法三；每页使用不同生成插画',
        '第3页使用康、勇、安，并提问这些名字有什么意思',
        '第5页加入“你选哪一个？为什么？”；小组讨论五分钟，然后发表',
        '第9页只呈现关系、年龄、身份、场合',
        '第10页不放拼音、句子说明和页脚',
        '第11、12页加入对应生成插画；只保留问法，不放回答句式和页脚',
        '第7页改为听力练习，并附六句老师与学生对话音频文字稿；第8页根据对话回答两个问题',
        '第13页加入“在学校和公司”divider；姓＋身份例子为王老师、李医生、张主任、阮同学',
        '第14至17页每页只呈现一个姓＋身份例子，并配对应生成插画，不显示拆解说明',
        '第18页使用课堂测验／比较插画，讨论和越南人的称呼方法有什么不同',
        '第19页加入“熟人”divider；第20至23页每页只呈现一种熟人称呼方法，并配对应生成插画',
        '熟人称呼使用名字、小＋姓／名字、老＋姓／名字、阿＋名字',
        '第24页加入“安全称呼”divider，并提示不确定时先用安全称呼',
        '第25至28页每页只呈现一个安全称呼，并配对应生成插画，不显示细节说明',
        '安全称呼使用服务员、师傅、女士、先生',
        '第29页加入咖啡店第一次见面的五个年龄情境',
        '第30页只列小姐、太太、女人；第31页保留老师与学生角色；第32页保留五个具体情境'
      ],
      generated_assets: Object.keys(images),
      output_files: [path.basename(pptxPath), path.basename(outlinePath), path.basename(storyboardPath), path.basename(audioScriptPath), 'assets/asset-manifest.json'],
      pptx_sha256: sha256(pptxPath),
      speaker_notes_count: renderers.length,
      classroom_rehearsal: 'not_run'
    };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    writeOutline();
    writeStoryboard();
    console.log(JSON.stringify({ pptx: pptxPath, outline: outlinePath, storyboard: storyboardPath, audio_script: audioScriptPath, manifest: manifestPath, slide_count: renderers.length, sha256: manifest.pptx_sha256 }, null, 2));
  });
}

function writeOutline() {
  const lines = [
    `# 第一课文化补充：姓名与称呼 ${cultureVersion}`,
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
      const generatedPageTypes = new Set([
        'divider',
        'method',
        'expectation',
        'choose',
        'choose-discussion',
        'listening-dialogue',
        'answer-questions',
        'question-name-divider',
        'ask-surname',
        'ask-address',
        'school-company-divider',
        'surname-role',
        'surname-role-question',
        'familiar-divider',
        'familiar-name',
        'familiar-small',
        'familiar-old',
        'familiar-a',
        'safe-divider',
        'safe-service',
        'safe-master',
        'safe-ms',
        'safe-mr'
      ]);
      const assets = generatedPageTypes.has(row[2]) ? 'generated' : 'shape-only';
      return [row[0], row[1], row[2], row[3], row[4], 'lesson-01-final-v4', assets].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',');
    })
  ];
  fs.writeFileSync(storyboardPath, rows.join('\n') + '\n');
}

renderAll().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
