#!/usr/bin/env node

/**
 * Build the more demanding, projector-only first-week opener for Boya
 * quasi-intermediate I, Lesson 01. The topic synthesizes the real themes in
 * Boya Elementary Speaking I-II: personal information, routines and plans,
 * transport, food, travel, clubs, sport, difficult experiences, dorm life,
 * part-time work and ideals.
 *
 * This is a support-material draft. It never writes 20-approved or release.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const PptxGenJS = require('pptxgenjs');
const {
  CJK_FONT,
  LATIN_FONT,
  COLORS: C,
  addText,
  addLine,
  addAccent,
} = require('./lesson_pptx_master_template');

const ROOT = path.resolve(__dirname, '..');
const LESSON_KEY = 'boya-quasi-intermediate-i:lesson-01';
const LESSON_ROOT = path.join(ROOT, 'lessons/boya-quasi-intermediate-i/lesson-01');
const OUTPUT_DIR = path.join(LESSON_ROOT, '10-design/pptx-draft/first-week-icebreakers');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'lesson-01-第一周破冰-大学生活计划-投影活动.pptx');
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'campus-life-manifest.json');

// Read-only production gate. The gate validates lesson identity and the safe
// draft boundary before this script creates the output directory or file.
execFileSync(process.env.BOYA_PYTHON || 'python3', [
  path.join(ROOT, 'scripts/production_gate.py'),
  '--purpose', 'pptx',
  '--stage', 'draft',
  '--lesson-key', LESSON_KEY,
  '--output-dir', path.relative(ROOT, OUTPUT_DIR),
], { stdio: 'inherit' });

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const W = 13.333;
const H = 7.5;
const T = {
  header: 20,
  label: 22,
  body: 24,
  compact: 22,
  title: 32,
  prompt: 30,
  cover: 48,
};

const pptx = new PptxGenJS();
pptx.defineLayout({ name: 'CAMPUS_WIDE', width: W, height: H });
pptx.layout = 'CAMPUS_WIDE';
pptx.author = '荣市大学华语听说课程';
pptx.company = '荣市大学';
pptx.subject = '第一周大学生活主题投影活动';
pptx.title = '第一周｜我的大学生活与新学期计划｜投影活动';
pptx.lang = 'zh-CN';
pptx.theme = { headFontFace: CJK_FONT, bodyFontFace: CJK_FONT, lang: 'zh-CN' };

function header(slide, number, title = '') {
  slide.background = { color: C.slideBackground };
  addText(slide, '第一周｜大学生活主题', 0.72, 0.26, 5.0, 0.24, {
    fontSize: T.header,
    color: C.muted,
    bold: true,
  });
  addText(slide, String(number).padStart(2, '0'), 12.0, 0.26, 0.62, 0.24, {
    fontFace: LATIN_FONT,
    fontSize: T.header,
    color: C.muted,
    bold: true,
    align: 'right',
  });
  addLine(slide, 0.72, 0.66, 11.9, C.line, 0.8);
  slide.addShape('rect', {
    x: 0.72, y: 0.64, w: 0.48, h: 0.04,
    fill: { color: C.purple },
    line: { color: C.purple, transparency: 100 },
  });
  if (title) {
    addText(slide, title, 0.78, 0.9, 11.7, 0.6, {
      fontSize: title.length > 18 ? 29 : T.title,
      bold: true,
      valign: 'top',
    });
  }
}

function pill(slide, text, x, y, w, color = C.teal) {
  slide.addShape('roundRect', {
    x, y, w, h: 0.42,
    rectRadius: 0.08,
    fill: { color },
    line: { color, transparency: 100 },
  });
  addText(slide, text, x + 0.08, y + 0.04, w - 0.16, 0.28, {
    fontSize: T.label,
    color: C.white,
    bold: true,
    align: 'center',
  });
}

function card(slide, x, y, w, h, fill = C.warmWhite, lineColor = C.line) {
  slide.addShape('roundRect', {
    x, y, w, h,
    rectRadius: 0.08,
    fill: { color: fill },
    line: { color: lineColor, pt: 1.0 },
  });
}

function numberCircle(slide, number, x, y, color) {
  slide.addShape('ellipse', {
    x, y, w: 0.48, h: 0.48,
    fill: { color },
    line: { color, transparency: 100 },
  });
  addText(slide, String(number), x, y + 0.08, 0.48, 0.24, {
    fontFace: LATIN_FONT,
    fontSize: 20,
    color: C.white,
    bold: true,
    align: 'center',
  });
}

function completion(slide, text, y = 6.62) {
  addAccent(slide, 0.88, y + 0.05, 0.08, C.teal, 0.42);
  addText(slide, `完成：${text}`, 1.12, y, 11.3, 0.42, {
    fontSize: T.compact,
    color: C.teal,
    bold: true,
  });
}

function notes(slide, text) {
  slide.addNotes(text);
}

function addCover() {
  const slide = pptx.addSlide();
  slide.background = { color: C.slideBackground };
  pill(slide, '投影活动', 0.88, 1.02, 1.68, C.teal);
  pill(slide, '只看投影', 2.72, 1.02, 1.78, C.coral);
  addText(slide, '第一周｜我的大学生活\n与新学期计划', 0.88, 1.78, 6.8, 1.48, {
    fontSize: T.cover,
    bold: true,
    valign: 'top',
  });
  addText(slide, '老师先说 → 你来问 → 采访同学 → 给老师提案', 0.92, 3.7, 6.4, 0.62, {
    fontSize: 25,
    color: C.teal,
    bold: true,
  });
  addLine(slide, 0.92, 4.48, 5.95, C.coral, 2.0);

  const blocks = [
    { label: '过去', fill: C.blue, color: C.teal, text: '经历\n变化' },
    { label: '现在', fill: C.mint, color: C.teal, text: '生活\n选择' },
    { label: '将来', fill: C.lilac, color: C.purple, text: '计划\n方案' },
  ];
  blocks.forEach((item, index) => {
    const x = 8.0 + index * 1.48;
    slide.addShape('roundRect', {
      x, y: 1.54 + index * 0.24, w: 1.2, h: 3.74,
      rectRadius: 0.08,
      fill: { color: item.fill },
      line: { color: C.line, pt: 0.8 },
    });
    addText(slide, item.label, x + 0.08, 2.06 + index * 0.24, 1.04, 0.42, {
      fontSize: 27,
      color: item.color,
      bold: true,
      align: 'center',
    });
    addText(slide, item.text, x + 0.12, 3.12 + index * 0.24, 0.96, 0.8, {
      fontSize: 24,
      color: C.ink,
      bold: true,
      align: 'center',
      valign: 'mid',
    });
    addText(slide, String(index + 1), x + 0.34, 4.56 + index * 0.24, 0.52, 0.34, {
      fontFace: LATIN_FONT,
      fontSize: 22,
      color: item.color,
      bold: true,
      align: 'center',
    });
  });
  notes(slide, '这是依据《博雅汉语听说：初级起步篇 I、II》主题重新设计的第一周投影活动。顺序固定从教师自我介绍开始，再进入学生提问、学生互访和对教师提案。课堂不需要打印材料。');
}

function addCanDo() {
  const slide = pptx.addSlide();
  header(slide, 2, '今天的沟通目标');
  addText(slide, '今天不只是“介绍自己”，而是要听懂、追问、比较，再提出一个方案。', 0.94, 1.52, 11.3, 0.48, {
    fontSize: 25,
    color: C.teal,
    bold: true,
    align: 'center',
  });
  const items = [
    { title: '听懂', text: '听一段老师的介绍，\n抓住 3 项事实和 1 个目标。', fill: C.blue, color: C.teal },
    { title: '互动', text: '和老师、同学问答，\n追问、确认、说明理由。', fill: C.mint, color: C.coral },
    { title: '表达', text: '介绍一位同学，\n再向老师提出一个方案。', fill: C.lilac, color: C.purple },
  ];
  items.forEach((item, index) => {
    const x = 0.88 + index * 4.16;
    card(slide, x, 2.22, 3.78, 3.18, item.fill);
    numberCircle(slide, index + 1, x + 0.24, 2.48, item.color);
    addText(slide, item.title, x + 0.88, 2.46, 2.42, 0.46, {
      fontSize: 30,
      color: item.color,
      bold: true,
    });
    addText(slide, item.text, x + 0.28, 3.25, 3.22, 1.22, {
      fontSize: T.body,
      bold: true,
      valign: 'mid',
      align: 'center',
    });
  });
  addText(slide, '话题范围：过去的经历 · 现在的生活 · 将来的计划', 1.04, 5.82, 11.1, 0.42, {
    fontSize: 25,
    color: C.purple,
    bold: true,
    align: 'center',
  });
  notes(slide, '目标对应 ACTFL 三种沟通模式：先听懂教师口语信息，再与教师和同学互动，最后完成同学介绍与小组提案。因为学生已经完成两册初级听说，目标加入过去／现在／将来、理由、问题解决和方案表达。');
}

function addRoute() {
  const slide = pptx.addSlide();
  header(slide, 3, '今天的路线');
  const steps = [
    { title: '老师先说', sub: '自我介绍', fill: C.coralSoft, color: C.coral },
    { title: '你来问老师', sub: '主问题＋追问', fill: C.yellowSoft, color: C.coral },
    { title: '采访同学', sub: '过去／现在／将来', fill: C.mint, color: C.teal },
    { title: '给老师提案', sub: '方案＋理由＋回应', fill: C.lilac, color: C.purple },
  ];
  steps.forEach((item, index) => {
    const x = 0.8 + index * 3.08;
    if (index < steps.length - 1) {
      slide.addShape('line', {
        x: x + 2.12, y: 3.24, w: 0.76, h: 0,
        line: { color: C.line, pt: 2.0, endArrowType: 'triangle' },
      });
    }
    card(slide, x, 2.15, 2.42, 2.28, item.fill);
    numberCircle(slide, index + 1, x + 0.97, 2.48, item.color);
    addText(slide, item.title, x + 0.18, 3.16, 2.06, 0.42, {
      fontSize: 25,
      color: item.color,
      bold: true,
      align: 'center',
    });
    addText(slide, item.sub, x + 0.18, 3.72, 2.06, 0.36, {
      fontSize: T.compact,
      color: C.ink,
      bold: true,
      align: 'center',
    });
  });
  addText(slide, '每一步都要留下“我听到了什么”或“我说清楚了什么”。', 1.0, 5.55, 11.3, 0.5, {
    fontSize: 26,
    color: C.teal,
    bold: true,
    align: 'center',
  });
  completion(slide, '知道自己先听什么、再问什么、最后要说什么。');
  notes(slide, '给第一次带班的教师一个固定流程。第 1–2 步建立师生关系，第 3 步让学生彼此取得真实信息，第 4 步把信息转成有理由的口头方案。');
}

function addTeacherModel() {
  const slide = pptx.addSlide();
  header(slide, 4, '第一步｜老师先说：我的大学生活');
  pill(slide, '老师说 60–90 秒', 0.88, 1.62, 2.18, C.coral);
  card(slide, 0.88, 2.18, 4.32, 3.82, C.coralSoft);
  addText(slide, '学生先听，不急着提问。\n听完以后，记住：\n\n我是谁？\n我怎样生活？\n我遇到过什么？\n我这学期想做什么？', 1.22, 2.5, 3.64, 2.98, {
    fontSize: 25,
    bold: true,
    valign: 'mid',
    align: 'center',
  });
  addText(slide, '老师可以说：', 5.78, 1.84, 3.0, 0.38, {
    fontSize: T.body,
    color: C.muted,
    bold: true,
  });
  const topics = [
    '来自哪里，现在做什么',
    '平常怎样安排学习和工作',
    '喜欢或不喜欢什么，为什么',
    '一次难忘或困难的经历',
    '以前和现在有什么变化',
    '这个学期的一个目标',
  ];
  topics.forEach((text, index) => {
    const row = index % 3;
    const col = Math.floor(index / 3);
    const x = 5.78 + col * 3.18;
    const y = 2.38 + row * 0.92;
    card(slide, x, y, 2.82, 0.68, [C.blue, C.mint, C.yellowSoft, C.lilac, C.coralSoft, C.blue][index]);
    addText(slide, text, x + 0.16, y + 0.11, 2.5, 0.44, {
      fontSize: 22,
      color: [C.teal, C.teal, C.coral, C.purple, C.coral, C.teal][index],
      bold: true,
      align: 'center',
      valign: 'mid',
    });
  });
  completion(slide, '每个人说出老师的 3 项信息和 1 个目标。');
  notes(slide, '教师用真实个人经历完成口头自我介绍，不必照读投影片。建议包含过去、现在和将来，示范学生稍后要完成的表达结构。讲完后先邀请学生复述，再进入下一张的提问。');
}

function addAskTeacher() {
  const slide = pptx.addSlide();
  header(slide, 5, '第二步｜学生来问老师');
  pill(slide, '主问题＋追问', 0.88, 1.62, 1.92, C.teal);
  addText(slide, '每组选择一个主题：先问一个主问题，再追问一个细节。', 3.1, 1.66, 8.7, 0.42, {
    fontSize: T.bodySmall,
    color: C.teal,
    bold: true,
  });
  const items = [
    { title: '学习与工作', text: '你为什么教中文？\n一天怎么安排？', fill: C.blue, color: C.teal },
    { title: '生活与兴趣', text: '你有空时喜欢做什么？\n为什么？', fill: C.mint, color: C.teal },
    { title: '经历与变化', text: '你遇到过什么难忘的事？\n后来怎么样？', fill: C.yellowSoft, color: C.coral },
    { title: '计划与困难', text: '这学期最想完成什么？\n遇到困难怎么办？', fill: C.lilac, color: C.purple },
  ];
  items.forEach((item, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = 0.88 + col * 6.18;
    const y = 2.26 + row * 1.34;
    card(slide, x, y, 5.68, 1.04, item.fill);
    numberCircle(slide, index + 1, x + 0.22, y + 0.28, item.color);
    addText(slide, item.title, x + 0.86, y + 0.18, 1.76, 0.34, {
      fontSize: 23,
      color: item.color,
      bold: true,
    });
    addText(slide, item.text, x + 2.54, y + 0.14, 2.78, 0.66, {
      fontSize: 22,
      bold: true,
      valign: 'mid',
      align: 'center',
    });
  });
  addText(slide, '追问可以用：为什么？后来呢？跟谁一起？如果再来一次，你会……吗？', 0.98, 5.44, 11.3, 0.46, {
    fontSize: 23,
    color: C.purple,
    bold: true,
    align: 'center',
  });
  completion(slide, '老师完整回答；你能把老师的答案说给同伴听。');
  notes(slide, '把教师自我介绍变成真正的师生互动。教师不要一次回答所有问题；按组邀请提问，并把学生的追问再反问回去，例如“你呢？”、“你有没有类似的经历？”。');
}

function addTeacherQuestion() {
  const slide = pptx.addSlide();
  header(slide, 6, '第三步｜老师也来问学生');
  addText(slide, '老师问一位学生；学生回答；老师追问；听者再补充一个问题。', 0.98, 1.56, 11.25, 0.46, {
    fontSize: 25,
    color: C.teal,
    bold: true,
    align: 'center',
  });
  const items = [
    { title: '先回答', text: '你平常怎么安排\n学习和休息？', fill: C.mint, color: C.teal },
    { title: '再说明', text: '你为什么这样安排？\n这样做有什么好处？', fill: C.yellowSoft, color: C.coral },
    { title: '最后设想', text: '如果这个学期只有一个目标，\n你会选什么？为什么？', fill: C.lilac, color: C.purple },
  ];
  items.forEach((item, index) => {
    const x = 0.88 + index * 4.16;
    card(slide, x, 2.28, 3.78, 2.96, item.fill);
    numberCircle(slide, index + 1, x + 0.24, 2.56, item.color);
    addText(slide, item.title, x + 0.88, 2.54, 2.48, 0.4, {
      fontSize: 28,
      color: item.color,
      bold: true,
    });
    addText(slide, item.text, x + 0.28, 3.4, 3.2, 1.16, {
      fontSize: 25,
      bold: true,
      valign: 'mid',
      align: 'center',
    });
  });
  addText(slide, '听者不要只说“我也是”：请补充一个不同点或一个问题。', 1.0, 5.7, 11.3, 0.46, {
    fontSize: 25,
    color: C.purple,
    bold: true,
    align: 'center',
  });
  completion(slide, '一次师生对话至少来回 4 句。');
  notes(slide, '这是教师主动与学生互动的关键页。选择 2–4 位学生即可，不必每个人都公开回答。对回答较短的学生，用“为什么／后来呢／如果……呢”追问；对能力较强的学生，请他们回应同伴的不同点。');
}

function addInterview() {
  const slide = pptx.addSlide();
  header(slide, 7, '第四步｜采访一位同学：生活有什么变化？');
  pill(slide, '选择 2 个问题', 0.88, 1.62, 1.86, C.purple);
  addText(slide, '不问私人问题；回答后必须追问一个“为什么／后来／将来”。', 3.0, 1.66, 8.8, 0.42, {
    fontSize: T.bodySmall,
    color: C.purple,
    bold: true,
  });
  const items = [
    { title: '学习与时间', text: '大一到现在，学习安排有什么变化？', fill: C.blue, color: C.teal },
    { title: '住与行', text: '你现在住在哪里？平常怎么去学校？', fill: C.mint, color: C.teal },
    { title: '饮食与休闲', text: '你喜欢什么食物、咖啡厅或活动？为什么？', fill: C.yellowSoft, color: C.coral },
    { title: '社团与运动', text: '参加过什么社团或运动？以后想参加吗？', fill: C.lilac, color: C.purple },
    { title: '难忘经历', text: '遇到过什么糟糕或难忘的事？怎么解决？', fill: C.coralSoft, color: C.coral },
    { title: '未来计划', text: '假期或毕业以后，你有什么打算？', fill: C.blue, color: C.teal },
  ];
  items.forEach((item, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = 0.88 + col * 4.16;
    const y = 2.2 + row * 1.18;
    card(slide, x, y, 3.78, 0.9, item.fill);
    addText(slide, item.title, x + 0.16, y + 0.12, 1.36, 0.3, {
      fontSize: 21,
      color: item.color,
      bold: true,
      align: 'center',
    });
    addText(slide, item.text, x + 1.6, y + 0.1, 1.98, 0.56, {
      fontSize: 20,
      bold: true,
      valign: 'mid',
      align: 'center',
    });
  });
  addText(slide, '只要记住三条：过去一条 · 现在一条 · 将来一条。', 1.0, 5.56, 11.3, 0.46, {
    fontSize: 25,
    color: C.teal,
    bold: true,
    align: 'center',
  });
  completion(slide, '记住同学的过去、现在、将来各一项信息。');
  notes(slide, '主题来自两册教材的生活场景：日程、住处、交通、饮食、咖啡厅、社团、运动、糟糕的一天、旅行、假期、兼职和理想。学生只选两个问题，降低记忆负担；不要求写纸卡。');
}

function addClassmateReport() {
  const slide = pptx.addSlide();
  header(slide, 8, '第五步｜把同学介绍给老师');
  pill(slide, '说 45–60 秒', 0.88, 1.62, 1.68, C.coral);
  card(slide, 0.96, 2.12, 5.4, 3.22, C.coralSoft);
  addText(slide, '过去：他／她以前……\n现在：他／她现在……\n将来：他／她打算……\n原因：因为……', 1.36, 2.62, 4.6, 1.82, {
    fontSize: 28,
    color: C.ink,
    bold: true,
    valign: 'mid',
    align: 'center',
  });
  addText(slide, '介绍时：', 7.0, 2.08, 2.2, 0.38, {
    fontSize: T.body,
    color: C.muted,
    bold: true,
  });
  const rules = ['不要只说“他喜欢……”。', '至少说出一个变化。', '至少说出一个原因。', '说完以后，老师问一个问题。'];
  rules.forEach((text, index) => {
    numberCircle(slide, index + 1, 7.0, 2.66 + index * 0.68, [C.teal, C.coral, C.purple, C.teal][index]);
    addText(slide, text, 7.68, 2.66 + index * 0.68, 4.2, 0.38, {
      fontSize: 23,
      bold: true,
    });
  });
  addText(slide, '老师追问：你为什么这样介绍？还有别的变化吗？', 1.08, 5.68, 11.15, 0.44, {
    fontSize: 24,
    color: C.purple,
    bold: true,
    align: 'center',
  });
  completion(slide, '介绍三段信息＋一个原因，并回答老师的问题。');
  notes(slide, '这是从 interpersonal 过渡到 presentational 的小输出。教师可以随机请 3–5 位学生介绍同学，每次只追问一个问题；学生回答后，教师用一句自然回应建立真实师生关系。');
}

function addProposal() {
  const slide = pptx.addSlide();
  header(slide, 9, '第六步｜给老师一个新学期方案');
  pill(slide, '四人小组', 0.88, 1.62, 1.48, C.teal);
  addText(slide, '你们是班级顾问：为本班设计一个周末活动或学习计划。', 2.66, 1.66, 9.0, 0.42, {
    fontSize: T.bodySmall,
    color: C.teal,
    bold: true,
  });
  const requirements = [
    { title: '什么时候？', text: '时间要适合谁？', fill: C.blue, color: C.teal },
    { title: '在哪里？怎么去？', text: '地点、交通要说清楚。', fill: C.mint, color: C.teal },
    { title: '做什么？吃什么？', text: '活动内容要具体。', fill: C.yellowSoft, color: C.coral },
    { title: '谁会喜欢？为什么？', text: '至少给出两个理由。', fill: C.lilac, color: C.purple },
    { title: '遇到问题怎么办？', text: '准备一个替代方案。', fill: C.coralSoft, color: C.coral },
  ];
  requirements.forEach((item, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const countInRow = row === 0 ? 3 : 2;
    const rowStart = row === 0 ? 0.88 : 2.42;
    const x = rowStart + col * 4.16;
    const y = row === 0 ? 2.24 : 3.48;
    const w = row === 0 ? 3.78 : 5.68;
    const xx = row === 0 ? x : 0.88 + col * 6.18;
    card(slide, xx, y, w, 0.94, item.fill);
    addText(slide, item.title, xx + 0.18, y + 0.1, w - 0.36, 0.32, {
      fontSize: 23,
      color: item.color,
      bold: true,
      align: 'center',
    });
    addText(slide, item.text, xx + 0.18, y + 0.5, w - 0.36, 0.24, {
      fontSize: 20,
      color: C.ink,
      bold: true,
      align: 'center',
    });
  });
  addText(slide, '可以用：因为……所以……｜如果……就……｜虽然……但是……｜先……再……最后……', 0.94, 5.56, 11.4, 0.42, {
    fontSize: 22,
    color: C.purple,
    bold: true,
    align: 'center',
  });
  completion(slide, '小组准备 60–90 秒方案；每个人说一部分。');
  notes(slide, '这是依据 Cambridge 信息差／合作任务的精神做的课堂化改编，并把初级两册出现过的交通、饮食、活动、计划、问题解决主题放在同一个真实决策任务里。小组可选择“周末活动”或“学习计划”，避免所有人都说同一件事。');
}

function addProposalReport() {
  const slide = pptx.addSlide();
  header(slide, 10, '第七步｜向老师提案');
  const leftX = 0.88;
  card(slide, leftX, 1.92, 5.62, 3.42, C.mint);
  pill(slide, '小组报告', 1.18, 2.2, 1.5, C.teal);
  addText(slide, '1. 说清楚方案\n2. 说出两个理由\n3. 回答老师一个问题\n4. 听其他组的方案', 1.32, 2.92, 4.7, 1.78, {
    fontSize: 26,
    bold: true,
    valign: 'mid',
    align: 'center',
  });
  card(slide, 6.84, 1.92, 5.62, 3.42, C.lilac);
  pill(slide, '老师追问', 7.14, 2.2, 1.5, C.purple);
  addText(slide, '为什么选这个时间？\n如果下雨或有人不能参加怎么办？\n还有别的办法吗？\n你最推荐哪一项？', 7.14, 2.92, 5.0, 1.78, {
    fontSize: 24,
    color: C.ink,
    bold: true,
    valign: 'mid',
    align: 'center',
  });
  addText(slide, '其他同学听完后：说一个优点，再问一个问题。', 1.0, 5.72, 11.3, 0.42, {
    fontSize: 25,
    color: C.coral,
    bold: true,
    align: 'center',
  });
  completion(slide, '完成一次真实的“提案—追问—回应”。');
  notes(slide, '教师是听众和决策者，不只是计时者。每组报告后追问一个问题；如果时间有限，只请两组完整报告，其余小组用一句话补充。可以用举手投票选择最可行的方案，但不要把活动变成淘汰比赛。');
}

function addExit() {
  const slide = pptx.addSlide();
  header(slide, 11, '课末｜给老师一条具体建议');
  pill(slide, '对同伴说 30 秒', 0.88, 1.62, 2.0, C.coral);
  card(slide, 1.08, 2.12, 11.16, 2.82, C.warmWhite);
  addText(slide, '这学期，如果想让我们更喜欢上华语课，\n我建议 ____________________，因为 ____________________。', 1.52, 2.72, 10.28, 1.1, {
    fontSize: 30,
    color: C.purple,
    bold: true,
    align: 'center',
    valign: 'mid',
  });
  addText(slide, '再加一句：我可以为这门课做 ____________________。', 1.34, 4.12, 10.7, 0.44, {
    fontSize: 25,
    color: C.teal,
    bold: true,
    align: 'center',
  });
  addText(slide, '老师随机请 3 人分享，并回应一句。', 1.0, 5.48, 11.3, 0.44, {
    fontSize: 26,
    color: C.coral,
    bold: true,
    align: 'center',
  });
  completion(slide, '提出一条具体建议＋一个理由；不交纸。');
  notes(slide, '这张是学生对教师的真实反馈，也是第一周师生关系的收束。教师回应时只需感谢、复述重点并说明下一步会怎样处理，不要把它变成书面问卷。');
}

addCover();
addCanDo();
addRoute();
addTeacherModel();
addAskTeacher();
addTeacherQuestion();
addInterview();
addClassmateReport();
addProposal();
addProposalReport();
addExit();

const manifest = {
  artifact: 'lesson-01-第一周破冰-大学生活计划-投影活动',
  lesson_key: LESSON_KEY,
  offering_id: '2026-fall',
  format: 'native-pptx-only',
  status: 'draft_only',
  student_language: '简体中文',
  delivery: 'projector_only_no_printed_handouts',
  topic: '我的大学生活与新学期计划',
  estimated_minutes: 120,
  slide_count: pptx._slides.length,
  fonts: { cjk: CJK_FONT, latin: LATIN_FONT, min_visible_pt: 20 },
  output: path.relative(ROOT, OUTPUT_PATH),
  local_topic_basis: {
    source: 'textbooks/boya-elementary-i-ii/source/reference-dataset/csv/lessons.csv',
    volume_i_topics: ['名字', '家庭与住处', '时间与日常安排', '交通', '饮食', '天气', '假期与计划'],
    volume_ii_topics: ['旅行', '在中国生活', '饭馆与家常菜', '学校社团', '运动', '糟糕的一天', '宿舍', '理想', '咖啡厅', '假期', '打工'],
    synthesis: '过去的经历＋现在的大学生活＋将来的学期计划',
  },
  sources: [
    {
      organization: 'British Council TeachingEnglish',
      title: 'The first class',
      url: 'https://www.teachingenglish.org.uk/professional-development/teachers/planning-lessons-and-courses/first-class',
      used_for: ['teacher self-introduction first', 'question-led Personal Star structure'],
    },
    {
      organization: 'British Council TeachingEnglish',
      title: 'Mingling: true or false?',
      url: 'https://www.teachingenglish.org.uk/teaching-resources/teaching-secondary/activities/pre-intermediate-a2/mingling-true-or-false',
      used_for: ['question before mingling', 'follow-up and class feedback'],
    },
    {
      organization: 'Cambridge University Press & Assessment',
      title: 'Developing speaking skills: a focus on Interactive Communication',
      url: 'https://www.cambridge.org/elt/blog/2022/04/05/developing-speaking-skills-a-focus-on-interactive-communication/',
      used_for: ['information gap', 'active listening and appropriate responses', 'functional language before task'],
    },
    {
      organization: 'Cambridge University Press & Assessment',
      title: 'Cambridge Life Competencies Activity Cards — Adult Learners',
      url: 'https://www.cambridge.org/gb/files/9616/2514/0251/ELT_CambridgeLifeCompetencies_ActivityCards_DigitalDownload_AdultLearners.pdf',
      used_for: ['effective listening and respectful response'],
    },
    {
      organization: 'ACTFL / NCSSFL',
      title: '2026 NCSSFL-ACTFL Can-Do Statements',
      url: 'https://www.actfl.org/educator-resources/ncssfl-actfl-can-do-statements',
      used_for: ['Interpretive / Interpersonal / Presentational alignment'],
    },
  ],
  adaptation_policy: 'Public ESL activities are summarized and adapted for a second-year Mandarin listening-speaking class; the deck does not reproduce source worksheets or claim to be an official source card.',
  qa: {
    source_gate: 'passed_before_write',
    output_scope: '10-design/pptx-draft/first-week-icebreakers',
    authority_or_release: 'not_created',
    manual_powerpoint_playback: 'pending',
    classroom_rehearsal: 'pending',
  },
};

(async () => {
  await pptx.writeFile({ fileName: OUTPUT_PATH });
  manifest.sha256 = crypto.createHash('sha256').update(fs.readFileSync(OUTPUT_PATH)).digest('hex');
  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify(manifest, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

