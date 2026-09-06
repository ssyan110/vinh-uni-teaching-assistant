#!/usr/bin/env node

/**
 * Build the projector-only first-week activity deck for Boya quasi-intermediate I,
 * Lesson 01.  The activities are adaptations of publicly available British
 * Council and Cambridge English resources; the deck is a classroom support
 * draft and is not an authority or release lesson deck.
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
  addLatin,
  addLine,
  addAccent,
  simplify,
} = require('./lesson_pptx_master_template');

const ROOT = path.resolve(__dirname, '..');
const LESSON_KEY = 'boya-quasi-intermediate-i:lesson-01';
const LESSON_ROOT = path.join(ROOT, 'lessons/boya-quasi-intermediate-i/lesson-01');
const OUTPUT_DIR = path.join(LESSON_ROOT, '10-design/pptx-draft/first-week-icebreakers');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'lesson-01-第一周破冰-投影活动.pptx');
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'manifest.json');
const GATE_OUTPUT_DIR = path.relative(ROOT, OUTPUT_DIR);

// Validate the lesson identity and the draft boundary before any output is made.
execFileSync(process.env.BOYA_PYTHON || 'python3', [
  path.join(ROOT, 'scripts/production_gate.py'),
  '--purpose', 'pptx',
  '--stage', 'draft',
  '--lesson-key', LESSON_KEY,
  '--output-dir', GATE_OUTPUT_DIR,
], { stdio: 'inherit' });

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const W = 13.333;
const H = 7.5;
const T = {
  header: 20,
  label: 22,
  body: 24,
  bodySmall: 22,
  title: 34,
  prompt: 32,
  divider: 48,
  cover: 48,
};

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = '荣市大学华语听说课程';
pptx.company = '荣市大学';
pptx.subject = '第一周投影活动';
pptx.title = '第一周｜开始用中文认识同学｜投影活动';
pptx.lang = 'zh-CN';
pptx.theme = { headFontFace: CJK_FONT, bodyFontFace: CJK_FONT, lang: 'zh-CN' };
pptx.defineLayout({ name: 'CUSTOM_WIDE', width: W, height: H });
pptx.layout = 'CUSTOM_WIDE';

function header(slide, number, title = '') {
  slide.background = { color: C.slideBackground };
  addText(slide, '第一周｜华语听说', 0.72, 0.26, 4.6, 0.24, {
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
      fontSize: title.length > 18 ? 30 : T.title,
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

function circleNumber(slide, number, x, y, color) {
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

function completion(slide, text, y = 6.65) {
  addAccent(slide, 0.88, y + 0.05, 0.08, C.teal, 0.42);
  addText(slide, `完成：${text}`, 1.12, y, 11.3, 0.42, {
    fontSize: T.bodySmall,
    color: C.teal,
    bold: true,
  });
}

function action(slide, text, x, y, w, color = C.purple) {
  addText(slide, text, x, y, w, 0.48, {
    fontSize: T.body,
    color,
    bold: true,
    valign: 'mid',
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
  addText(slide, '第一周｜开始用中文\n认识同学', 0.88, 1.78, 6.6, 1.52, {
    fontSize: T.cover,
    bold: true,
    valign: 'top',
  });
  addText(slide, '听懂 · 互问 · 介绍', 0.92, 3.72, 5.6, 0.5, {
    fontSize: 28,
    color: C.teal,
    bold: true,
  });
  addLine(slide, 0.92, 4.42, 5.4, C.coral, 2.0);

  const blocks = [
    { label: '听懂', fill: C.mint, color: C.teal },
    { label: '互问', fill: C.yellowSoft, color: C.coral },
    { label: '介绍', fill: C.lilac, color: C.purple },
  ];
  blocks.forEach((item, index) => {
    const x = 8.05 + index * 1.48;
    slide.addShape('roundRect', {
      x, y: 1.56 + index * 0.24, w: 1.2, h: 3.66,
      rectRadius: 0.08,
      fill: { color: item.fill },
      line: { color: C.line, pt: 0.8 },
    });
    addText(slide, item.label, x + 0.08, 2.12 + index * 0.24, 1.04, 0.48, {
      fontSize: 28,
      color: item.color,
      bold: true,
      align: 'center',
    });
    addText(slide, String(index + 1), x + 0.34, 4.32 + index * 0.24, 0.52, 0.38, {
      fontFace: LATIN_FONT,
      fontSize: 24,
      color: item.color,
      bold: true,
      align: 'center',
    });
  });
  notes(slide, '本投影活动取材并改编自 British Council 与 Cambridge English 的公开教师资源。课堂不需要发放纸张；所有学生动作以投影和口头互动完成。');
}

function addCanDo() {
  const slide = pptx.addSlide();
  header(slide, 2, '今天完成三个动作');
  const items = [
    { title: '听懂', text: '听同学说一段信息，记住重点。', fill: C.mint, color: C.teal },
    { title: '互问', text: '问问题、追问、确认意思。', fill: C.yellowSoft, color: C.coral },
    { title: '介绍', text: '用 30–45 秒介绍一位同学。', fill: C.lilac, color: C.purple },
  ];
  items.forEach((item, index) => {
    const x = 0.88 + index * 4.16;
    card(slide, x, 1.92, 3.78, 3.18, item.fill);
    circleNumber(slide, index + 1, x + 0.24, 2.18, item.color);
    addText(slide, item.title, x + 0.88, 2.16, 2.42, 0.48, {
      fontSize: 30,
      color: item.color,
      bold: true,
    });
    addText(slide, item.text, x + 0.28, 3.0, 3.22, 1.1, {
      fontSize: T.body,
      bold: true,
      valign: 'mid',
      align: 'center',
    });
  });
  addText(slide, '今天的目标：让一段中文对话真正开始，并且继续下去。', 1.0, 5.65, 11.3, 0.55, {
    fontSize: 26,
    color: C.teal,
    bold: true,
    align: 'center',
  });
  notes(slide, 'ACTFL 对应：Interpretive 听懂同伴信息；Interpersonal 问、追问、确认；Presentational 用短段口语介绍同学。第一周只做形成性观察，不把一次活动当成正式分级。');
}

function addTeacherStar() {
  const slide = pptx.addSlide();
  header(slide, 3, '活动 1｜猜老师的五个信息');
  pill(slide, '老师先说', 0.88, 1.62, 1.56, C.coral);
  card(slide, 0.88, 2.18, 5.2, 3.72, C.coralSoft);
  const steps = [
    '老师口头说 5 个信息，不显示答案。',
    '学生轮流问问题。',
    '问对问题后，老师回答。',
  ];
  steps.forEach((text, index) => {
    circleNumber(slide, index + 1, 1.18, 2.62 + index * 0.88, [C.teal, C.coral, C.purple][index]);
    addText(slide, text, 1.86, 2.62 + index * 0.88, 3.78, 0.48, {
      fontSize: T.bodySmall,
      bold: true,
    });
  });
  addText(slide, '问题示例：你来自哪里？\n你为什么喜欢……？', 1.18, 5.05, 4.3, 0.58, {
    fontSize: 22,
    color: C.purple,
    bold: true,
    align: 'center',
  });

  addText(slide, '五个信息可以来自：', 6.66, 1.74, 4.3, 0.4, {
    fontSize: T.body,
    color: C.muted,
    bold: true,
  });
  const topics = ['家乡', '喜欢的食物', '周末活动', '教中文的原因', '今年的目标'];
  topics.forEach((text, index) => {
    const y = 2.24 + index * 0.64;
    const fills = [C.mint, C.yellowSoft, C.lilac, C.blue, C.coralSoft];
    card(slide, 6.66, y, 5.45, 0.48, fills[index]);
    addText(slide, text, 6.9, y + 0.08, 4.96, 0.3, {
      fontSize: T.bodySmall,
      color: [C.teal, C.coral, C.purple, C.teal, C.coral][index],
      bold: true,
      align: 'center',
    });
  });
  completion(slide, '全班问出 5 个问题；每个人记住老师的两项信息。');
  notes(slide, '改编自 British Council “The first class” 的 Personal Star / What’s the question? 做法。教师课前只需准备或临时决定 5 项真实信息；答案不必写在投影上。');
}

function addMingle() {
  const slide = pptx.addSlide();
  header(slide, 4, '活动 2｜找到一位同学');
  pill(slide, '走动＋问答', 0.88, 1.62, 1.74, C.teal);
  addText(slide, '问不同的同学；每次回答后，再追问一个细节。', 2.9, 1.66, 8.8, 0.42, {
    fontSize: T.bodySmall,
    color: C.teal,
    bold: true,
  });
  const prompts = [
    '喜欢听中文歌或看中文视频？',
    '以前用中文跟别人说过话？',
    '学中文时更喜欢听还是说？',
    '这学期想在哪方面进步？',
  ];
  prompts.forEach((text, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 0.88 + column * 6.18;
    const y = 2.28 + row * 1.26;
    card(slide, x, y, 5.68, 0.96, [C.mint, C.yellowSoft, C.lilac, C.blue][index]);
    circleNumber(slide, index + 1, x + 0.24, y + 0.24, [C.teal, C.coral, C.purple, C.teal][index]);
    addText(slide, text, x + 0.92, y + 0.22, 4.42, 0.46, {
      fontSize: T.bodySmall,
      bold: true,
      valign: 'mid',
    });
  });
  addText(slide, '追问可以用：为什么？什么时候？跟谁？在哪里？', 1.02, 5.16, 11.2, 0.46, {
    fontSize: 24,
    color: C.purple,
    bold: true,
    align: 'center',
  });
  completion(slide, '记住两位同学的姓名＋一项信息，回座分享。');
  notes(slide, '改编自 British Council “Mingling: true or false?”。原活动使用 worksheet；本课堂版改为只看投影、口头记忆，不发纸。空间不足时让学生依次起立询问前后左右同学；较强学生必须再问原因或细节。');
}

function addListenerSteps() {
  const slide = pptx.addSlide();
  header(slide, 5, '听者三步｜让对话继续');
  const items = [
    { title: '追问', text: '为什么？\n什么时候？\n跟谁？', fill: C.mint, color: C.teal },
    { title: '确认', text: '你是说……吗？', fill: C.yellowSoft, color: C.coral },
    { title: '修补', text: '我没听清楚，请再说一遍。\n请说慢一点。', fill: C.lilac, color: C.purple },
  ];
  items.forEach((item, index) => {
    const x = 0.88 + index * 4.16;
    card(slide, x, 1.92, 3.78, 3.36, item.fill);
    circleNumber(slide, index + 1, x + 0.24, 2.18, item.color);
    addText(slide, item.title, x + 0.88, 2.16, 2.46, 0.44, {
      fontSize: 30,
      color: item.color,
      bold: true,
    });
    addText(slide, item.text, x + 0.3, 3.0, 3.18, 1.48, {
      fontSize: 25,
      bold: true,
      align: 'center',
      valign: 'mid',
    });
  });
  addText(slide, 'A 说 30 秒；B 至少用其中两步；然后交换。', 1.0, 5.7, 11.3, 0.48, {
    fontSize: 26,
    color: C.teal,
    bold: true,
    align: 'center',
  });
  completion(slide, '对话至少来回三次，不停在“哦”。');
  notes(slide, '把 Cambridge “Interested or bored?” 的核心学习点转成正向的听者行为练习，并结合 TESOL 的 clarification / repair 功能。学生可以使用屏幕上的句子，不需要纸卡。');
}

function addRepeatIntro() {
  const slide = pptx.addSlide();
  header(slide, 6, '活动 3｜同一段介绍，说两次');
  const columns = [
    { x: 0.88, title: '第一轮｜普通介绍', fill: C.blue, color: C.teal, lines: ['介绍你的学习、工作', '或一个兴趣，30 秒。'] },
    { x: 6.72, title: '第二轮｜加入听者回应', fill: C.coralSoft, color: C.coral, lines: ['听者看着对方、点头、', '追问或确认；再说一次。'] },
  ];
  columns.forEach((item, index) => {
    card(slide, item.x, 1.92, 5.72, 2.52, item.fill);
    circleNumber(slide, index + 1, item.x + 0.28, 2.22, item.color);
    addText(slide, item.title, item.x + 0.92, 2.18, 4.42, 0.46, {
      fontSize: 27,
      color: item.color,
      bold: true,
    });
    addText(slide, item.lines.join('\n'), item.x + 0.34, 3.05, 5.04, 0.86, {
      fontSize: 25,
      bold: true,
      align: 'center',
      valign: 'mid',
    });
  });
  addText(slide, '交换角色后比较：哪一轮更容易继续说？为什么？', 1.0, 5.16, 11.3, 0.52, {
    fontSize: 28,
    color: C.purple,
    bold: true,
    align: 'center',
  });
  completion(slide, '说出一个有效的听者行为，并再次完成 30 秒介绍。');
  notes(slide, '改编自 Cambridge Life Competencies Adult Learners activity card “Interested or bored?”。原卡用两种相反的听者反应作对照；本版改成“普通介绍 → 有效回应后再说一次”，避免让第一次见面的学生长时间扮演冷淡听者。');
}

function addGroupReport() {
  const slide = pptx.addSlide();
  header(slide, 7, '活动 4｜三人小组介绍');
  pill(slide, '三人一组', 0.88, 1.62, 1.56, C.purple);
  addText(slide, '不用写；先一起听、记住，再合作报告。', 2.75, 1.66, 8.6, 0.42, {
    fontSize: T.bodySmall,
    color: C.purple,
    bold: true,
  });
  const goals = [
    { title: '两个共同点', fill: C.mint, color: C.teal },
    { title: '一个不同点', fill: C.yellowSoft, color: C.coral },
    { title: '一个共同目标', fill: C.lilac, color: C.purple },
    { title: '一条课堂约定', fill: C.blue, color: C.teal },
  ];
  goals.forEach((item, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 1.12 + column * 5.58;
    const y = 2.3 + row * 1.22;
    card(slide, x, y, 5.02, 0.9, item.fill);
    circleNumber(slide, index + 1, x + 0.28, y + 0.21, item.color);
    addText(slide, item.title, x + 0.98, y + 0.2, 3.74, 0.44, {
      fontSize: 27,
      color: item.color,
      bold: true,
      align: 'center',
    });
  });
  addText(slide, '每人说一部分；报告 30–45 秒。\n其他同学听完后，追问一个问题。', 1.0, 5.2, 11.3, 0.7, {
    fontSize: 26,
    color: C.ink,
    bold: true,
    align: 'center',
  });
  completion(slide, '完成四项内容，并回应一个问题。');
  notes(slide, '小组任务把前面的个人问答转成 presentational output。教师可指定每组一位报告者，或让三人各说一句；不要求书面记录。');
}

function addExit() {
  const slide = pptx.addSlide();
  header(slide, 8, '课末口头出口');
  pill(slide, '对同伴说 20 秒', 0.88, 1.62, 2.08, C.teal);
  card(slide, 1.18, 2.12, 10.98, 2.86, C.warmWhite);
  const lines = [
    '我今天认识了 ______。',
    '他／她 ______。',
    '我还想问 ______。',
  ];
  lines.forEach((text, index) => {
    addText(slide, text, 2.1, 2.5 + index * 0.7, 9.1, 0.46, {
      fontSize: 30,
      color: [C.teal, C.coral, C.purple][index],
      bold: true,
      align: 'center',
    });
  });
  addText(slide, '老师随机请 2–3 人分享。', 1.1, 5.46, 11.1, 0.48, {
    fontSize: 26,
    color: C.teal,
    bold: true,
    align: 'center',
  });
  completion(slide, '完成一次短口语回顾；不交纸。');
  notes(slide, '用口头出口快速观察学生是否能说出同伴姓名与一项信息，并记录下一次课需要支持的问句、追问或听力修补行为。');
}

addCover();
addCanDo();
addTeacherStar();
addMingle();
addListenerSteps();
addRepeatIntro();
addGroupReport();
addExit();

const manifest = {
  artifact: 'lesson-01-第一周破冰-投影活动',
  lesson_key: LESSON_KEY,
  offering_id: '2026-fall',
  format: 'native-pptx-only',
  status: 'draft_only',
  student_language: '简体中文',
  delivery: 'projector_only_no_printed_handouts',
  slide_count: pptx._slides.length,
  fonts: { cjk: CJK_FONT, latin: LATIN_FONT, min_visible_pt: 20 },
  output: path.relative(ROOT, OUTPUT_PATH),
  sources: [
    {
      organization: 'British Council TeachingEnglish',
      title: 'The first class',
      url: 'https://www.teachingenglish.org.uk/professional-development/teachers/planning-lessons-and-courses/first-class',
      used_for: ['Personal Star / What’s the question?', 'first-class goals'],
    },
    {
      organization: 'British Council TeachingEnglish',
      title: 'Mingling: true or false?',
      url: 'https://www.teachingenglish.org.uk/teaching-resources/teaching-secondary/activities/pre-intermediate-a2/mingling-true-or-false',
      worksheet_url: 'https://www.teachingenglish.org.uk/sites/teacheng/files/mingling-true-or-false-worksheet.pdf',
      used_for: ['question-led mingling', 'follow-up questions', 'class feedback'],
    },
    {
      organization: 'Cambridge University Press & Assessment',
      title: 'Cambridge Life Competencies Activity Cards — Adult Learners',
      url: 'https://www.cambridge.org/gb/files/9616/2514/0251/ELT_CambridgeLifeCompetencies_ActivityCards_DigitalDownload_AdultLearners.pdf',
      used_for: ['Interested or bored?', 'listening and responding respectfully'],
    },
    {
      organization: 'ACTFL / NCSSFL',
      title: '2026 NCSSFL-ACTFL Can-Do Statements',
      url: 'https://www.actfl.org/educator-resources/ncssfl-actfl-can-do-statements',
      used_for: ['Interpretive / Interpersonal / Presentational alignment'],
    },
  ],
  adaptation_policy: 'Source activities are summarized and adapted for a Mandarin listening-speaking class; this deck does not reproduce a source worksheet or claim to be an official source card.',
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

