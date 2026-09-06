#!/usr/bin/env node

/**
 * Build the B-direction redesign for the first-week projector opener:
 * Keynote-like large type and whitespace, with a small amount of playful
 * campus energy. Native editable PPTX only; draft output only.
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
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'lesson-01-第一周破冰-大学生活计划-大字活泼投影活动.pptx');
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'keynote-playful-manifest.json');

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
  eyebrow: 20,
  label: 22,
  body: 24,
  prompt: 30,
  title: 40,
  hero: 54,
  giant: 64,
};

const pptx = new PptxGenJS();
pptx.defineLayout({ name: 'KEYNOTE_PLAYFUL_WIDE', width: W, height: H });
pptx.layout = 'KEYNOTE_PLAYFUL_WIDE';
pptx.author = '荣市大学华语听说课程';
pptx.company = '荣市大学';
pptx.subject = '第一周大学生活主题投影活动';
pptx.title = '第一周｜我的大学生活与新学期计划｜大字活泼投影活动';
pptx.lang = 'zh-CN';
pptx.theme = { headFontFace: CJK_FONT, bodyFontFace: CJK_FONT, lang: 'zh-CN' };

function pageHeader(slide, number, section = '第一周｜大学生活主题') {
  slide.background = { color: C.slideBackground };
  addText(slide, section, 0.72, 0.24, 4.9, 0.25, {
    fontSize: T.eyebrow,
    color: C.muted,
    bold: true,
  });
  addText(slide, String(number).padStart(2, '0'), 12.02, 0.24, 0.58, 0.25, {
    fontFace: LATIN_FONT,
    fontSize: T.eyebrow,
    color: C.muted,
    bold: true,
    align: 'right',
  });
  addLine(slide, 0.72, 0.66, 11.9, C.line, 0.7);
  slide.addShape('rect', {
    x: 0.72, y: 0.64, w: 0.56, h: 0.05,
    fill: { color: C.teal },
    line: { color: C.teal, transparency: 100 },
  });
}

function title(slide, text, y = 0.95, size = T.title, w = 11.7) {
  addText(slide, text, 0.82, y, w, 0.72, {
    fontSize: size,
    bold: true,
    valign: 'top',
  });
}

function dot(slide, x, y, size, color, transparency = 0) {
  slide.addShape('ellipse', {
    x, y, w: size, h: size,
    fill: { color, transparency },
    line: { color, transparency: 100 },
  });
}

function ring(slide, x, y, size, color, pt = 1.4) {
  slide.addShape('ellipse', {
    x, y, w: size, h: size,
    fill: { color: C.white, transparency: 100 },
    line: { color, pt },
  });
}

function underline(slide, x, y, w, color, pt = 2.2) {
  addLine(slide, x, y, w, color, pt);
}

function label(slide, text, x, y, w, color = C.teal, size = T.label, align = 'left') {
  addText(slide, text, x, y, w, 0.32, {
    fontSize: size,
    color,
    bold: true,
    align,
  });
}

function notes(slide, text) {
  slide.addNotes(text);
}

function completion(slide, text, y = 6.7) {
  addAccent(slide, 0.88, y + 0.04, 0.08, C.teal, 0.42);
  addText(slide, `完成：${text}`, 1.12, y, 11.3, 0.34, {
    fontSize: T.label,
    color: C.teal,
    bold: true,
  });
}

function addCover() {
  const slide = pptx.addSlide();
  slide.background = { color: C.slideBackground };

  label(slide, '第一周', 0.9, 0.74, 1.1, C.teal, 24);
  underline(slide, 0.9, 1.13, 1.05, C.coral, 3.0);
  addText(slide, '我的大学生活\n与新学期计划', 0.9, 1.62, 7.2, 1.58, {
    fontSize: T.hero,
    bold: true,
    valign: 'top',
  });
  addText(slide, '先听懂  →  再追问  →  最后提案', 0.94, 3.82, 6.4, 0.44, {
    fontSize: 28,
    color: C.teal,
    bold: true,
  });
  underline(slide, 0.94, 4.46, 5.55, C.coral, 2.2);
  addText(slide, '大学生活不是一张名片，而是一段正在发生的故事。', 0.94, 4.76, 6.5, 0.42, {
    fontSize: T.body,
    color: C.muted,
    bold: true,
  });

  const stages = [
    { word: '过去', sub: '经历', color: C.teal, x: 8.34, y: 1.52, size: 1.72 },
    { word: '现在', sub: '生活', color: C.coral, x: 9.66, y: 2.34, size: 1.72 },
    { word: '将来', sub: '计划', color: C.purple, x: 10.94, y: 1.48, size: 1.72 },
  ];
  stages.forEach((item, index) => {
    ring(slide, item.x, item.y, item.size, item.color, 2.0);
    addText(slide, item.word, item.x + 0.08, item.y + 0.53, item.size - 0.16, 0.42, {
      fontSize: 27,
      color: item.color,
      bold: true,
      align: 'center',
    });
    addText(slide, item.sub, item.x + 0.08, item.y + 1.02, item.size - 0.16, 0.34, {
      fontSize: 23,
      color: C.ink,
      bold: true,
      align: 'center',
    });
    if (index < stages.length - 1) {
      slide.addShape('line', {
        x: item.x + item.size - 0.02,
        y: item.y + item.size * 0.56,
        w: 0.48,
        h: 0.22,
        line: { color: C.line, pt: 1.4, endArrowType: 'triangle' },
      });
    }
  });
  dot(slide, 11.98, 5.18, 0.17, C.yellow);
  dot(slide, 12.34, 5.46, 0.09, C.coral);
  dot(slide, 7.74, 5.64, 0.13, C.purple);
  notes(slide, '开场由教师说明：今天不是把名字和兴趣轮流说一遍，而是从教师的真实介绍开始，学生要听懂、追问、采访和提案。整个活动只需要播放 PPTX，不需要纸张或手机。');
}

function addGoals() {
  const slide = pptx.addSlide();
  pageHeader(slide, 2);
  title(slide, '今天，你要完成三件事。', 1.04, 42);
  addText(slide, '不是“说几句自我介绍”，而是把听到的信息变成一次真实交流。', 0.86, 1.82, 11.1, 0.42, {
    fontSize: T.prompt,
    color: C.teal,
    bold: true,
  });

  const items = [
    { n: '01', head: '听懂', body: '抓住老师的\n3 项事实＋1 个目标。', color: C.teal, x: 0.92 },
    { n: '02', head: '互动', body: '问、追问、确认，\n说明你为什么这样想。', color: C.coral, x: 4.54 },
    { n: '03', head: '表达', body: '介绍同学，\n再向老师提出方案。', color: C.purple, x: 8.16 },
  ];
  items.forEach((item) => {
    addText(slide, item.n, item.x, 2.74, 1.12, 0.62, {
      fontFace: LATIN_FONT,
      fontSize: 42,
      color: item.color,
      bold: true,
    });
    underline(slide, item.x, 3.52, 2.28, item.color, 3.0);
    addText(slide, item.head, item.x, 3.74, 2.8, 0.52, {
      fontSize: 34,
      color: item.color,
      bold: true,
    });
    addText(slide, item.body, item.x, 4.48, 2.82, 0.9, {
      fontSize: T.body,
      bold: true,
      valign: 'top',
    });
  });
  dot(slide, 11.98, 5.92, 0.14, C.yellow);
  dot(slide, 12.22, 6.1, 0.08, C.coral);
  completion(slide, '知道自己先听什么、再问什么、最后要说什么。');
  notes(slide, '目标对应 ACTFL 的 Interpretive、Interpersonal、Presentational 三种沟通模式。教师用一句话说明：今天的重点不是发言次数，而是能不能听懂、回应和把信息说清楚。');
}

function addRoute() {
  const slide = pptx.addSlide();
  pageHeader(slide, 3);
  title(slide, '一条路线，四次开口。', 1.04, 44);
  const steps = [
    { n: '1', head: '老师先说', sub: '自我介绍', color: C.coral },
    { n: '2', head: '你来问', sub: '主问题＋追问', color: C.teal },
    { n: '3', head: '采访同学', sub: '过去／现在／将来', color: C.purple },
    { n: '4', head: '给老师提案', sub: '方案＋理由＋回应', color: C.coral },
  ];
  steps.forEach((item, index) => {
    const x = 0.92 + index * 3.08;
    addText(slide, item.n, x, 2.38, 0.7, 0.7, {
      fontFace: LATIN_FONT,
      fontSize: 48,
      color: item.color,
      bold: true,
    });
    addText(slide, item.head, x, 3.26, 2.48, 0.48, {
      fontSize: 27,
      color: item.color,
      bold: true,
    });
    underline(slide, x, 3.9, 2.22, item.color, 2.1);
    addText(slide, item.sub, x, 4.22, 2.55, 0.42, {
      fontSize: T.label,
      color: C.ink,
      bold: true,
    });
    if (index < steps.length - 1) {
      slide.addShape('line', {
        x: x + 2.35, y: 2.78, w: 0.5, h: 0,
        line: { color: C.line, pt: 1.5, endArrowType: 'triangle' },
      });
    }
  });
  addText(slide, '每一步都要留下：我听到了什么？／我说清楚了什么？', 0.96, 5.62, 11.3, 0.48, {
    fontSize: 27,
    color: C.teal,
    bold: true,
    align: 'center',
  });
  completion(slide, '看懂今天的顺序，准备进入第一步。');
  notes(slide, '用这一页建立安全感。教师告诉学生：先看教师怎么做，再由学生接手；第一次带班不必追求每个人都公开发言，先让每个人有一次清楚的听、问或说。');
}

function addTeacherModel() {
  const slide = pptx.addSlide();
  pageHeader(slide, 4);
  title(slide, '先从老师开始。', 1.04, 46);
  addText(slide, '老师说 60–90 秒。学生先听，不急着提问。', 0.88, 1.82, 9.0, 0.42, {
    fontSize: T.prompt,
    color: C.coral,
    bold: true,
  });
  addText(slide, '我是谁？\n我怎样生活？\n我遇到过什么？\n我这学期想做什么？', 0.98, 2.64, 4.86, 2.42, {
    fontSize: 34,
    bold: true,
    valign: 'mid',
  });
  underline(slide, 0.98, 5.36, 4.58, C.coral, 3.0);
  addText(slide, '学生听完以后，只要记住：', 6.48, 2.26, 5.1, 0.42, {
    fontSize: T.body,
    color: C.muted,
    bold: true,
  });
  addText(slide, '3 项事实\n＋\n1 个目标', 6.5, 2.9, 3.2, 2.06, {
    fontSize: 42,
    color: C.teal,
    bold: true,
    valign: 'mid',
    align: 'center',
  });
  addText(slide, '可以听：经历 · 变化 · 选择 · 理由', 6.5, 5.34, 5.72, 0.34, {
    fontSize: T.label,
    color: C.purple,
    bold: true,
    align: 'center',
  });
  completion(slide, '每个人说出老师的 3 项信息和 1 个目标。');
  notes(slide, '教师准备自己的真实口语，不要照读投影片。建议包含：来自哪里／现在做什么、学习和工作安排、一个喜欢的活动及理由、一次困难或难忘经历、以前与现在的变化、这个学期的一个目标。说完先邀请学生复述，再进入下一页。');
}

function addAskTeacher() {
  const slide = pptx.addSlide();
  pageHeader(slide, 5);
  title(slide, '听完以后，轮到你。', 1.04, 44);
  addText(slide, '每组选择一个主题：先问一个主问题，再追问一个细节。', 0.88, 1.82, 10.6, 0.42, {
    fontSize: T.prompt,
    color: C.teal,
    bold: true,
  });

  addText(slide, '主问题', 0.98, 2.64, 1.8, 0.46, { fontSize: 31, color: C.teal, bold: true });
  addText(slide, '＋', 3.03, 2.56, 0.62, 0.54, { fontSize: 37, color: C.coral, bold: true, align: 'center' });
  addText(slide, '追问', 3.85, 2.64, 1.8, 0.46, { fontSize: 31, color: C.purple, bold: true });
  underline(slide, 0.98, 3.24, 4.62, C.line, 1.2);
  addText(slide, '你为什么教中文？\n你有空时喜欢做什么？\n你遇到过什么难忘的事？\n这学期最想完成什么？', 0.98, 3.54, 5.18, 1.92, {
    fontSize: 26,
    bold: true,
    valign: 'mid',
  });
  addText(slide, '追问可以用：', 7.08, 2.68, 2.4, 0.42, { fontSize: T.body, color: C.muted, bold: true });
  addText(slide, '为什么？\n后来呢？\n跟谁一起？\n如果再来一次，你会……吗？', 7.08, 3.34, 4.46, 1.88, {
    fontSize: 30,
    color: C.purple,
    bold: true,
    valign: 'mid',
  });
  addText(slide, '老师回答以后，可以反问：“你呢？”', 6.96, 5.72, 5.0, 0.42, {
    fontSize: T.label,
    color: C.coral,
    bold: true,
    align: 'center',
  });
  completion(slide, '把老师的答案说给同伴听。');
  notes(slide, '让教师不要一次回答所有内容，而是邀请不同小组提问。每次回答后可以自然地问学生“你呢？”、“你有没有类似的经历？”，把教师的自我介绍变成真正的师生互动。');
}

function addTeacherQuestion() {
  const slide = pptx.addSlide();
  pageHeader(slide, 6);
  title(slide, '老师也来问你。', 1.04, 46);
  addText(slide, '先回答 → 再说明 → 最后设想。', 0.9, 1.84, 8.2, 0.44, {
    fontSize: 30,
    color: C.teal,
    bold: true,
  });
  const items = [
    { n: '1', head: '先回答', text: '你平常怎么安排\n学习和休息？', color: C.teal, x: 0.98 },
    { n: '2', head: '再说明', text: '你为什么这样安排？\n这样做有什么好处？', color: C.coral, x: 4.54 },
    { n: '3', head: '最后设想', text: '如果这个学期只有一个目标，\n你会选什么？为什么？', color: C.purple, x: 8.1 },
  ];
  items.forEach((item) => {
    addText(slide, item.n, item.x, 2.78, 0.7, 0.7, {
      fontFace: LATIN_FONT,
      fontSize: 50,
      color: item.color,
      bold: true,
    });
    addText(slide, item.head, item.x, 3.62, 2.82, 0.46, {
      fontSize: 29,
      color: item.color,
      bold: true,
    });
    underline(slide, item.x, 4.26, 2.42, item.color, 2.0);
    addText(slide, item.text, item.x, 4.6, 3.08, 0.96, {
      fontSize: 24,
      bold: true,
      valign: 'top',
    });
  });
  addText(slide, '听者不要只说“我也是”：补充一个不同点或一个问题。', 1.0, 5.94, 11.28, 0.42, {
    fontSize: 25,
    color: C.purple,
    bold: true,
    align: 'center',
  });
  completion(slide, '一次师生对话至少来回 4 句。');
  notes(slide, '教师选择 2–4 位学生即可。对回答较短的学生，用“为什么／后来呢／如果……呢”追问；旁听者必须补充一个不同点或问题，避免只说“我也是”。');
}

function addInterviewStart() {
  const slide = pptx.addSlide();
  pageHeader(slide, 7);
  title(slide, '现在，去认识一位同学。', 1.04, 42);
  addText(slide, '选择 2 个问题；回答以后，再追问一个“为什么／后来／将来”。', 0.88, 1.82, 11.0, 0.42, {
    fontSize: 27,
    color: C.purple,
    bold: true,
  });
  const timeline = [
    { word: '过去', text: '以前怎么学习？\n以前怎么生活？', color: C.teal, x: 0.98 },
    { word: '现在', text: '现在怎么安排？\n现在喜欢什么？', color: C.coral, x: 4.54 },
    { word: '将来', text: '接下来想做什么？\n毕业以后有什么打算？', color: C.purple, x: 8.1 },
  ];
  timeline.forEach((item, index) => {
    addText(slide, item.word, item.x, 2.82, 2.7, 0.56, {
      fontSize: 36,
      color: item.color,
      bold: true,
    });
    underline(slide, item.x, 3.6, 2.36, item.color, 3.0);
    addText(slide, item.text, item.x, 4.04, 3.04, 1.02, {
      fontSize: 26,
      bold: true,
      valign: 'mid',
    });
    if (index < timeline.length - 1) {
      slide.addShape('line', {
        x: item.x + 2.52, y: 3.24, w: 0.52, h: 0,
        line: { color: C.line, pt: 1.6, endArrowType: 'triangle' },
      });
    }
  });
  addText(slide, '不问私人问题。记住三条：过去一条 · 现在一条 · 将来一条。', 0.98, 5.82, 11.3, 0.44, {
    fontSize: 25,
    color: C.teal,
    bold: true,
    align: 'center',
  });
  completion(slide, '取得同学的过去、现在、将来各一项信息。');
  notes(slide, '两人一组进行采访。空间足够时让学生换对象，空间不足时与前后左右同学轮换。学生不需要填写表格，只需在脑中或用极简关键词记住三条信息。');
}

function addInterviewMenu() {
  const slide = pptx.addSlide();
  pageHeader(slide, 8);
  title(slide, '你想从哪一扇门开始？', 1.04, 42);
  addText(slide, '从下面选 2 个问题，不必全部问完。', 0.88, 1.82, 8.4, 0.42, {
    fontSize: T.prompt,
    color: C.teal,
    bold: true,
  });
  const items = [
    { head: '学习与时间', text: '大一到现在，学习安排有什么变化？', color: C.teal },
    { head: '住与行', text: '你现在住在哪里？平常怎么去学校？', color: C.coral },
    { head: '饮食与休闲', text: '你喜欢什么食物、咖啡厅或活动？为什么？', color: C.purple },
    { head: '社团与运动', text: '参加过什么社团或运动？以后想参加吗？', color: C.teal },
    { head: '难忘经历', text: '遇到过什么糟糕或难忘的事？怎么解决？', color: C.coral },
    { head: '未来计划', text: '假期或毕业以后，你有什么打算？', color: C.purple },
  ];
  items.forEach((item, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = 0.98 + col * 6.12;
    const y = 2.62 + row * 0.9;
    addAccent(slide, x, y + 0.04, 0.08, item.color, 0.38);
    addText(slide, item.head, x + 0.26, y, 1.66, 0.32, {
      fontSize: 22,
      color: item.color,
      bold: true,
    });
    addText(slide, item.text, x + 2.0, y, 3.78, 0.38, {
      fontSize: 21,
      bold: true,
      valign: 'mid',
    });
  });
  addText(slide, '记住：回答以后，必须追问一个为什么／后来／将来。', 0.98, 5.78, 11.3, 0.44, {
    fontSize: 25,
    color: C.coral,
    bold: true,
    align: 'center',
  });
  completion(slide, '问得具体，听得认真，记得三条信息。');
  notes(slide, '此页是投影上的问题菜单，不是纸本活动卡。学生从六类主题中选择两个，教师巡视时优先听他们有没有追问和回应，而不是纠正每一个词。');
}

function addReport() {
  const slide = pptx.addSlide();
  pageHeader(slide, 9);
  title(slide, '把同学的变化，说给老师听。', 1.04, 40);
  addText(slide, '说 45–60 秒，不要只说“他喜欢……”。', 0.88, 1.82, 8.7, 0.42, {
    fontSize: T.prompt,
    color: C.coral,
    bold: true,
  });
  addText(slide, '过去', 0.98, 2.78, 2.12, 0.5, { fontSize: 33, color: C.teal, bold: true });
  addText(slide, '→', 3.14, 2.75, 0.58, 0.52, { fontSize: 33, color: C.line, bold: true, align: 'center' });
  addText(slide, '现在', 3.86, 2.78, 2.12, 0.5, { fontSize: 33, color: C.coral, bold: true });
  addText(slide, '→', 6.02, 2.75, 0.58, 0.52, { fontSize: 33, color: C.line, bold: true, align: 'center' });
  addText(slide, '将来', 6.74, 2.78, 2.12, 0.5, { fontSize: 33, color: C.purple, bold: true });
  underline(slide, 0.98, 3.5, 7.44, C.teal, 2.5);
  addText(slide, '他／她以前……\n他／她现在……\n他／她打算……\n因为……', 1.04, 4.0, 6.66, 1.46, {
    fontSize: 28,
    bold: true,
    valign: 'mid',
  });
  addText(slide, '说完以后：\n老师问一个问题。\n你回答这个问题。', 9.0, 2.78, 3.0, 1.82, {
    fontSize: 27,
    color: C.purple,
    bold: true,
    valign: 'mid',
    align: 'center',
  });
  addText(slide, '至少说出一个变化＋一个原因。', 8.76, 5.38, 3.42, 0.42, {
    fontSize: T.label,
    color: C.teal,
    bold: true,
    align: 'center',
  });
  completion(slide, '完成一次短报告，并接住老师的追问。');
  notes(slide, '随机邀请 3–5 位学生介绍同学。教师每次只追问一个问题，例如“你为什么这样介绍？”或“还有别的变化吗？”。这是从同伴互动过渡到 presentational speaking。');
}

function addProposal() {
  const slide = pptx.addSlide();
  pageHeader(slide, 10);
  title(slide, '如果你是班级顾问？', 1.04, 46);
  addText(slide, '四人小组：为本班设计一个周末活动或学习计划。', 0.88, 1.82, 10.5, 0.42, {
    fontSize: T.prompt,
    color: C.teal,
    bold: true,
  });
  const requirements = [
    { n: '1', head: '时间', text: '什么时候？', color: C.teal },
    { n: '2', head: '地点', text: '在哪里？怎么去？', color: C.coral },
    { n: '3', head: '内容', text: '做什么？吃什么？', color: C.purple },
    { n: '4', head: '理由', text: '谁会喜欢？为什么？', color: C.teal },
    { n: '5', head: '备选', text: '遇到问题怎么办？', color: C.coral },
  ];
  requirements.slice(0, 3).forEach((item, index) => {
    const x = 0.98 + index * 4.1;
    const y = 2.54;
    addText(slide, item.n, x, y, 0.62, 0.68, {
      fontFace: LATIN_FONT,
      fontSize: 48,
      color: item.color,
      bold: true,
    });
    underline(slide, x, y + 0.82, 2.62, item.color, 2.4);
    addText(slide, item.head, x, y + 1.08, 2.82, 0.34, {
      fontSize: 24,
      color: item.color,
      bold: true,
    });
    addText(slide, item.text, x, y + 1.58, 3.18, 0.62, {
      fontSize: 22,
      bold: true,
      valign: 'top',
    });
  });
  requirements.slice(3).forEach((item, index) => {
    const x = 0.98 + index * 6.0;
    const y = 4.92;
    addText(slide, item.n, x, y, 0.62, 0.68, {
      fontFace: LATIN_FONT,
      fontSize: 44,
      color: item.color,
      bold: true,
    });
    addText(slide, item.head, x + 0.84, y + 0.04, 2.4, 0.34, {
      fontSize: 24,
      color: item.color,
      bold: true,
    });
    underline(slide, x + 0.84, y + 0.56, 4.42, item.color, 2.2);
    addText(slide, item.text, x + 0.84, y + 0.76, 4.42, 0.48, {
      fontSize: 22,
      bold: true,
      valign: 'top',
    });
  });
  addText(slide, '可以用：因为……所以……｜如果……就……｜虽然……但是……', 1.04, 6.16, 11.15, 0.36, {
    fontSize: 23,
    color: C.purple,
    bold: true,
    align: 'center',
  });
  completion(slide, '每个人说一部分，准备 60–90 秒方案。');
  notes(slide, '这是把两册教材中的交通、饮食、活动、计划和问题解决放入一个真实决策任务。教师提醒四人分工：有人负责时间地点，有人负责活动内容，有人负责理由，有人准备替代方案。');
}

function addProposalReport() {
  const slide = pptx.addSlide();
  pageHeader(slide, 11);
  title(slide, '提案不是念答案。', 1.04, 48);
  addText(slide, '它要经过一次真实的“说清楚—被追问—再回应”。', 0.9, 1.82, 10.7, 0.42, {
    fontSize: 27,
    color: C.teal,
    bold: true,
  });
  const steps = [
    { n: '01', text: '说清楚方案\n时间、地点、内容', color: C.teal, x: 0.98 },
    { n: '02', text: '讲出两个理由\n说明谁会喜欢', color: C.coral, x: 4.42 },
    { n: '03', text: '接住老师追问\n回答并补充', color: C.purple, x: 7.86 },
  ];
  steps.forEach((item) => {
    addText(slide, item.n, item.x, 2.76, 1.1, 0.58, {
      fontFace: LATIN_FONT,
      fontSize: 39,
      color: item.color,
      bold: true,
    });
    underline(slide, item.x, 3.52, 2.5, item.color, 2.4);
    addText(slide, item.text, item.x, 3.9, 2.82, 1.02, {
      fontSize: 27,
      bold: true,
      valign: 'mid',
    });
  });
  addText(slide, '老师可能问：为什么选这个时间？如果下雨怎么办？还有别的办法吗？', 1.02, 5.54, 11.16, 0.42, {
    fontSize: 23,
    color: C.coral,
    bold: true,
    align: 'center',
  });
  completion(slide, '其他同学说一个优点，再问一个问题。');
  notes(slide, '教师是听众和决策者，不只是计时者。时间有限时让两组完成完整“提案—追问—回应”，其他小组用一句话补充方案和理由。不要把活动变成淘汰比赛。');
}

function addExit() {
  const slide = pptx.addSlide();
  pageHeader(slide, 12);
  title(slide, '最后，告诉老师一件具体的事。', 1.04, 39);
  addText(slide, '对同伴说 30 秒，然后教师随机请 3 人分享。', 0.88, 1.82, 9.6, 0.42, {
    fontSize: T.prompt,
    color: C.coral,
    bold: true,
  });
  addText(slide, '我建议 ____________________，\n因为 ____________________。', 1.04, 2.82, 8.2, 1.16, {
    fontSize: 37,
    color: C.purple,
    bold: true,
    valign: 'mid',
  });
  underline(slide, 1.04, 4.3, 7.54, C.purple, 2.2);
  addText(slide, '我可以为这门课做 ____________________。', 1.06, 4.72, 8.2, 0.54, {
    fontSize: 30,
    color: C.teal,
    bold: true,
  });
  addText(slide, '具体建议\n＋\n一个理由\n＋\n一个行动', 9.7, 2.64, 2.18, 2.42, {
    fontSize: 28,
    color: C.coral,
    bold: true,
    valign: 'mid',
    align: 'center',
  });
  dot(slide, 11.96, 5.56, 0.17, C.yellow);
  dot(slide, 12.28, 5.82, 0.1, C.teal);
  completion(slide, '提出一条具体建议＋一个理由；不交纸。');
  notes(slide, '教师用这页收束关系：感谢学生、复述建议重点，并简单说明下一步会怎样回应。它同时是学生对课程的真实反馈，不需要改成书面问卷。');
}

addCover();
addGoals();
addRoute();
addTeacherModel();
addAskTeacher();
addTeacherQuestion();
addInterviewStart();
addInterviewMenu();
addReport();
addProposal();
addProposalReport();
addExit();

const manifest = {
  artifact: 'lesson-01-第一周破冰-大学生活计划-大字活泼投影活动',
  lesson_key: LESSON_KEY,
  offering_id: '2026-fall',
  format: 'native-pptx-only',
  status: 'draft_only',
  design_direction: 'B｜Keynote大字留白＋活泼校园感',
  student_language: '简体中文',
  delivery: 'projector_only_no_printed_handouts',
  topic: '我的大学生活与新学期计划',
  estimated_minutes: 125,
  slide_count: pptx._slides.length,
  fonts: { cjk: CJK_FONT, latin: LATIN_FONT, min_visible_pt: 20 },
  output: path.relative(ROOT, OUTPUT_PATH),
  local_topic_basis: {
    source: 'textbooks/boya-elementary-i-ii/source/reference-dataset/csv/lessons.csv',
    volume_i_topics: ['名字', '家庭与住处', '时间与日常安排', '交通', '饮食', '天气', '假期与计划'],
    volume_ii_topics: ['旅行', '在中国生活', '饭馆与家常菜', '学校社团', '运动', '糟糕的一天', '宿舍', '理想', '咖啡厅', '假期', '打工'],
    synthesis: '过去的经历＋现在的大学生活＋将来的学期计划',
  },
  design_notes: [
    'One dominant action or question per slide.',
    'Large type and whitespace for projector distance.',
    'Playful energy uses native dots, rings, arrows and restrained accent colors; no decorative emoji or stock images.',
  ],
  sources: [
    {
      organization: 'British Council TeachingEnglish',
      title: 'The first class',
      url: 'https://www.teachingenglish.org.uk/professional-development/teachers/planning-lessons-and-courses/first-class',
      used_for: ['teacher self-introduction first', 'question-led opening'],
    },
    {
      organization: 'British Council TeachingEnglish',
      title: 'Mingling: true or false?',
      url: 'https://www.teachingenglish.org.uk/teaching-resources/teaching-secondary/activities/pre-intermediate-a2/mingling-true-or-false',
      used_for: ['question preparation', 'peer interview and feedback'],
    },
    {
      organization: 'Cambridge University Press & Assessment',
      title: 'Developing speaking skills: a focus on Interactive Communication',
      url: 'https://www.cambridge.org/elt/blog/2022/04/05/developing-speaking-skills-a-focus-on-interactive-communication/',
      used_for: ['information gap', 'active listening and responsive interaction'],
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
    {
      organization: 'Hugo He',
      title: 'PPT Master',
      url: 'https://github.com/hugohe3/ppt-master',
      used_for: ['native PowerPoint workflow reference; not copied as a project dependency'],
    },
  ],
  adaptation_policy: 'Public ESL activities and PPT Master workflow claims are used as references; this deck is an original, projector-only adaptation for a second-year Mandarin listening-speaking class and is not an official source card.',
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
