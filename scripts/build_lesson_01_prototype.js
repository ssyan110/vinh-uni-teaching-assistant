// Compatibility entry point. Keep all future lesson-01 prototype builds on the
// approved textbook-style generator.
require('./build_lesson_01_visual_prototype_v2.js');
process.exit(0);

// Legacy implementation retained below for historical reference only.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const PptxGenJS = require('pptxgenjs');

const projectRoot = path.resolve(__dirname, '..');
const outputRelative = 'output/boya-intermediate/lesson-01/visual-prototype';
const outputDir = path.join(projectRoot, outputRelative);
const assetDir = path.join(outputDir, 'assets');
const pptxPath = path.join(outputDir, 'lesson-01-visual-prototype.pptx');
fs.mkdirSync(assetDir, { recursive: true });

const W = 13.333;
const H = 7.5;
const FONT = 'SimHei';
const COLORS = {
  paper: 'F7F8FA',
  warm: 'F5F1EB',
  ink: '111827',
  slate: '667085',
  blue: '2F6BFF',
  blueDark: '0F172A',
  blueSoft: 'DCE7FF',
  coral: 'FF6B57',
  coralSoft: 'FFE2DC',
  line: 'D9E0E8',
  white: 'FFFFFF',
  mist: 'E9EEF3',
  teal: '1D9A9A',
  yellow: 'F5C84B'
};

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function writeSvg(name, body, background = 'transparent') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice"><defs>
  <linearGradient id="blueFade" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2F6BFF"/><stop offset="1" stop-color="#89A8FF"/></linearGradient>
  <linearGradient id="coralFade" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF6B57"/><stop offset="1" stop-color="#FFB19F"/></linearGradient>
  <linearGradient id="paperFade" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#DDE6EF"/></linearGradient>
  <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="18"/></filter>
  </defs><rect width="1000" height="700" fill="${background}"/>${body}</svg>`;
  fs.writeFileSync(path.join(assetDir, name), svg);
}

writeSvg('01-hero.svg', `
  <rect width="1000" height="700" fill="#DCE5EE"/>
  <circle cx="825" cy="110" r="190" fill="#B9C9DD" opacity=".7"/>
  <circle cx="110" cy="620" r="240" fill="#F7F8FA" opacity=".8"/>
  <path d="M0 510 C180 410 270 450 390 535 C520 628 650 630 1000 500 L1000 700 L0 700Z" fill="#C5D4E4"/>
  <g transform="translate(450 145) rotate(-7)">
    <rect width="320" height="190" rx="24" fill="#F7F8FA"/>
    <rect x="24" y="25" width="98" height="12" rx="6" fill="#2F6BFF"/>
    <rect x="24" y="60" width="228" height="10" rx="5" fill="#D1D9E2"/>
    <rect x="24" y="90" width="168" height="10" rx="5" fill="#D1D9E2"/>
    <path d="M244 115c0-30 24-54 54-54s54 24 54 54v25H244Z" fill="#2F6BFF" opacity=".9"/>
    <circle cx="298" cy="55" r="30" fill="#89A8FF"/>
  </g>
  <g transform="translate(650 360) rotate(9)">
    <rect width="230" height="150" rx="20" fill="#0F172A"/>
    <circle cx="50" cy="46" r="22" fill="#FF6B57"/>
    <path d="M25 104c0-28 22-50 50-50s50 22 50 50v14H25Z" fill="#FFB19F"/>
    <rect x="118" y="38" width="75" height="10" rx="5" fill="#FFFFFF" opacity=".9"/>
    <rect x="118" y="67" width="54" height="10" rx="5" fill="#FFFFFF" opacity=".35"/>
    <rect x="118" y="96" width="85" height="10" rx="5" fill="#FFFFFF" opacity=".35"/>
  </g>
  <path d="M150 220c75-62 170-58 230 8" fill="none" stroke="#2F6BFF" stroke-width="5" stroke-linecap="round" opacity=".7"/>
  <path d="M168 250c64-45 131-42 186 7" fill="none" stroke="#FF6B57" stroke-width="3" stroke-linecap="round" opacity=".7"/>
`, '#DCE5EE');

writeSvg('02-objectives.svg', `
  <rect width="1000" height="700" fill="#F7F8FA"/>
  <rect x="34" y="45" width="278" height="610" rx="32" fill="#DCE7FF"/>
  <rect x="361" y="45" width="278" height="610" rx="32" fill="#FFE2DC"/>
  <rect x="688" y="45" width="278" height="610" rx="32" fill="#D9F0EF"/>
  <circle cx="173" cy="215" r="90" fill="#FFFFFF" opacity=".8"/>
  <path d="M90 220 C125 145 162 300 198 210 S255 165 270 245" fill="none" stroke="#2F6BFF" stroke-width="13" stroke-linecap="round"/>
  <circle cx="500" cy="215" r="92" fill="#FFFFFF" opacity=".8"/>
  <path d="M432 215h125a26 26 0 0 1 26 26v52a26 26 0 0 1-26 26h-54l-31 31v-31h-40a26 26 0 0 1-26-26v-52a26 26 0 0 1 26-26Z" fill="#FF6B57"/>
  <circle cx="827" cy="215" r="92" fill="#FFFFFF" opacity=".8"/>
  <rect x="766" y="155" width="122" height="145" rx="12" fill="#0F172A" transform="rotate(-9 827 227)"/>
  <path d="M792 213l24-32 20 25 19-19 22 29" fill="none" stroke="#FFFFFF" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="817" cy="177" r="9" fill="#2F6BFF"/>
`, '#F7F8FA');

writeSvg('03-consultant.svg', `
  <rect width="1000" height="700" fill="#EAEFF4"/>
  <circle cx="790" cy="140" r="150" fill="#D2DDEA"/>
  <rect x="90" y="410" width="840" height="220" rx="26" fill="#B8C6D5"/>
  <rect x="140" y="365" width="300" height="170" rx="16" fill="#FFFFFF" transform="rotate(-7 290 450)"/>
  <rect x="172" y="397" width="150" height="12" rx="6" fill="#2F6BFF" transform="rotate(-7 290 450)"/>
  <rect x="172" y="432" width="205" height="10" rx="5" fill="#D6DEE7" transform="rotate(-7 290 450)"/>
  <rect x="172" y="462" width="165" height="10" rx="5" fill="#D6DEE7" transform="rotate(-7 290 450)"/>
  <rect x="540" y="330" width="250" height="175" rx="18" fill="#0F172A" transform="rotate(8 665 417)"/>
  <circle cx="625" cy="398" r="34" fill="#89A8FF"/>
  <path d="M570 485c0-46 37-83 83-83s83 37 83 83v12H570Z" fill="#2F6BFF"/>
  <rect x="705" y="385" width="52" height="10" rx="5" fill="#FFFFFF" opacity=".8" transform="rotate(8 665 417)"/>
  <rect x="705" y="416" width="76" height="10" rx="5" fill="#FFFFFF" opacity=".35" transform="rotate(8 665 417)"/>
  <circle cx="385" cy="574" r="24" fill="#FF6B57"/>
  <circle cx="430" cy="574" r="24" fill="#2F6BFF"/>
  <circle cx="475" cy="574" r="24" fill="#F5C84B"/>
`, '#EAEFF4');

writeSvg('04-listening.svg', `
  <rect width="1000" height="700" fill="#0F172A"/>
  <circle cx="760" cy="150" r="190" fill="#2F6BFF" opacity=".18" filter="url(#soft)"/>
  <circle cx="240" cy="540" r="180" fill="#FF6B57" opacity=".16" filter="url(#soft)"/>
  <path d="M45 360 C95 360 95 210 145 210 S195 510 245 510 S295 290 345 290 S395 420 445 420 S495 165 545 165 S595 485 645 485 S695 260 745 260 S795 390 845 390 S895 220 955 220" fill="none" stroke="#7EA1FF" stroke-width="12" stroke-linecap="round"/>
  <path d="M45 360 C95 360 95 210 145 210" fill="none" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round"/>
  <circle cx="145" cy="210" r="18" fill="#FF6B57"/>
  <circle cx="545" cy="165" r="18" fill="#F5C84B"/>
  <circle cx="845" cy="390" r="18" fill="#FFFFFF"/>
  <rect x="92" y="90" width="170" height="54" rx="27" fill="#FFFFFF" opacity=".12"/>
  <rect x="110" y="111" width="92" height="12" rx="6" fill="#FFFFFF" opacity=".7"/>
`, '#0F172A');

writeSvg('05-phrase-scenes.svg', `
  <rect width="1000" height="700" fill="#F5F1EB"/>
  <rect x="42" y="60" width="278" height="580" rx="30" fill="#DCE7FF"/>
  <rect x="361" y="60" width="278" height="580" rx="30" fill="#FFE2DC"/>
  <rect x="680" y="60" width="278" height="580" rx="30" fill="#D9F0EF"/>
  <circle cx="177" cy="220" r="64" fill="#FFFFFF" opacity=".75"/>
  <rect x="107" y="340" width="142" height="26" rx="13" fill="#2F6BFF" opacity=".85"/>
  <rect x="103" y="395" width="168" height="18" rx="9" fill="#FFFFFF" opacity=".85"/>
  <path d="M144 308c0-36 29-65 65-65s65 29 65 65v18H144Z" fill="#2F6BFF"/>
  <circle cx="209" cy="242" r="34" fill="#89A8FF"/>
  <circle cx="500" cy="220" r="64" fill="#FFFFFF" opacity=".75"/>
  <path d="M424 340h154" stroke="#FF6B57" stroke-width="24" stroke-linecap="round"/>
  <path d="M447 405h104" stroke="#FFFFFF" stroke-width="18" stroke-linecap="round"/>
  <circle cx="500" cy="242" r="34" fill="#FFB19F"/>
  <circle cx="818" cy="220" r="64" fill="#FFFFFF" opacity=".75"/>
  <path d="M744 328l56 65 106-125" fill="none" stroke="#1D9A9A" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M750 440h136" stroke="#FFFFFF" stroke-width="18" stroke-linecap="round"/>
`, '#F5F1EB');

writeSvg('06-station.svg', `
  <rect width="1000" height="700" fill="#F7F8FA"/>
  <rect x="52" y="60" width="410" height="250" rx="34" fill="#DCE7FF"/>
  <rect x="538" y="60" width="410" height="250" rx="34" fill="#FFE2DC"/>
  <rect x="52" y="390" width="410" height="250" rx="34" fill="#D9F0EF"/>
  <rect x="538" y="390" width="410" height="250" rx="34" fill="#F4EAC5"/>
  <path d="M154 202 C194 202 194 119 234 119 S274 270 314 270 S354 165 394 165" fill="none" stroke="#2F6BFF" stroke-width="14" stroke-linecap="round"/>
  <path d="M644 200h195a30 30 0 0 1 30 30v46a30 30 0 0 1-30 30h-78l-36 35v-35h-81a30 30 0 0 1-30-30v-46a30 30 0 0 1 30-30Z" fill="#FF6B57"/>
  <path d="M150 522h206" stroke="#1D9A9A" stroke-width="18" stroke-linecap="round"/>
  <path d="M150 566h145" stroke="#FFFFFF" stroke-width="18" stroke-linecap="round"/>
  <path d="M640 530l42 42 88-106" fill="none" stroke="#B68B00" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="500" cy="350" r="40" fill="#0F172A"/>
  <circle cx="500" cy="350" r="17" fill="#FFFFFF"/>
  <path d="M500 310v-42M500 390v42M460 350h-42M540 350h42" stroke="#0F172A" stroke-width="8" stroke-linecap="round"/>
`, '#F7F8FA');

function asset(name) {
  return path.join(assetDir, name);
}

function addText(slide, text, x, y, w, h, options = {}) {
  slide.addText(text, {
    x, y, w, h,
    fontFace: FONT,
    fontSize: 24,
    color: COLORS.ink,
    margin: 0,
    breakLine: false,
    fit: 'shrink',
    valign: 'mid',
    lang: 'zh-CN',
    paraSpaceAfterPt: 0,
    ...options
  });
}

function addRule(slide, x, y, w, color = COLORS.line, transparency = 0) {
  slide.addShape('line', { x, y, w, h: 0, line: { color, transparency, pt: 1 } });
}

function addPill(slide, text, x, y, w, color = COLORS.blue, textColor = COLORS.white) {
  slide.addShape('roundRect', { x, y, w, h: 0.34, rectRadius: 0.08, fill: { color }, line: { color, transparency: 100 } });
  addText(slide, text, x, y + 0.01, w, 0.28, { fontSize: 12, color: textColor, bold: true, align: 'center' });
}

function addHeader(slide, kicker, number, dark = false) {
  const color = dark ? COLORS.white : COLORS.ink;
  const secondary = dark ? 'AAB8D6' : COLORS.slate;
  addText(slide, kicker, 0.76, 0.45, 5.7, 0.24, { fontSize: 12, color: secondary, bold: true, charSpacing: 1.4 });
  addText(slide, String(number).padStart(2, '0'), 12.0, 0.45, 0.55, 0.24, { fontSize: 12, color: secondary, bold: true, align: 'right' });
  addRule(slide, 0.76, 0.86, 11.82, dark ? '33466E' : COLORS.line, 0);
  return color;
}

function addFooter(slide, dark = false) {
  // 不在學生畫面放「視覺樣稿」或其他製作備註；製作資訊只保留在 manifest／review 文件。
}

function addNotes(slide, notes) {
  slide.addNotes(notes);
}

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'Vinh University Chinese Listening and Speaking Course';
pptx.company = 'Courseware prototype';
pptx.subject = '第一课视觉 prototype';
pptx.title = '第一课：中国人的姓名｜视觉样稿';
pptx.lang = 'zh-CN';
pptx.theme = {
  headFontFace: FONT,
  bodyFontFace: FONT,
  lang: 'zh-CN'
};
pptx.defineSlideMaster({
  title: 'BLANK',
  background: { color: COLORS.paper },
  objects: []
});

// 01 — Cover
{
  const slide = pptx.addSlide('BLANK');
  slide.background = { color: COLORS.blueDark };
  slide.addImage({ path: asset('01-hero.svg'), x: 0, y: 0, w: W, h: H });
  slide.addShape('rect', { x: 0, y: 0, w: 6.5, h: H, fill: { color: COLORS.blueDark, transparency: 19 }, line: { color: COLORS.blueDark, transparency: 100 } });
  addPill(slide, '第一课', 0.8, 0.76, 0.98, COLORS.coral);
  addText(slide, '中国人的姓名', 0.8, 2.05, 5.7, 0.82, { fontSize: 44, bold: true, color: COLORS.white, breakLine: true });
  addText(slide, '中国人的名字怎么说？', 0.82, 3.15, 5.2, 0.46, { fontSize: 22, color: 'E6ECF7' });
  addText(slide, '姓  /  名  /  意思', 8.55, 6.15, 3.8, 0.28, { fontSize: 13, color: COLORS.blueDark, bold: true, align: 'right' });
  addNotes(slide, '教師提示：不先講解詞語。先讓學生看主視覺，猜這一課要談什麼，再進入最後任務。');
}

// 02 — Student task
{
  const slide = pptx.addSlide('BLANK');
  slide.background = { color: COLORS.paper };
  addHeader(slide, '今天的任务', 2);
  addText(slide, '帮别人起一个中文名', 0.76, 1.18, 7.0, 0.62, { fontSize: 34, bold: true });
  addText(slide, '先听一听，再问一问，最后说说为什么。', 0.78, 1.95, 6.6, 0.34, { fontSize: 17, color: COLORS.slate });
  addText(slide, '听', 0.82, 3.15, 2.1, 0.58, { fontSize: 34, bold: true, color: COLORS.blue });
  addText(slide, '问', 3.1, 3.15, 2.1, 0.58, { fontSize: 34, bold: true, color: COLORS.coral });
  addText(slide, '说', 5.38, 3.15, 2.1, 0.58, { fontSize: 34, bold: true, color: COLORS.teal });
  addRule(slide, 0.84, 4.03, 6.6, COLORS.line);
  addText(slide, '听懂名字  ·  问清要求  ·  说说为什么', 0.82, 4.38, 6.55, 0.38, { fontSize: 16, color: COLORS.slate });
  slide.addImage({ path: asset('02-objectives.svg'), x: 8.0, y: 1.15, w: 4.55, h: 4.95 });
  addText(slide, '我会听、会问、会说', 8.25, 6.22, 3.9, 0.38, { fontSize: 20, bold: true, color: COLORS.ink });
  addFooter(slide);
  addNotes(slide, '教師提示：學生畫面只呈現真實任務與三個動作。不要把 ACTFL、Can-Do 或教學目標術語放到學生畫面。');
}

// 03 — Final task
{
  const slide = pptx.addSlide('BLANK');
  slide.background = { color: COLORS.blueDark };
  const textColor = addHeader(slide, '最后一步', 3, true);
  addPill(slide, '开始吧', 0.8, 1.25, 1.2, COLORS.coral);
  addText(slide, '你来帮别人起名字', 0.8, 1.86, 5.0, 0.78, { fontSize: 38, bold: true, color: textColor });
  addText(slide, '先问清楚，再想名字，最后说说为什么。', 0.82, 2.83, 4.8, 0.58, { fontSize: 18, color: 'C4D1E8', breakLine: true });
  const steps = [
    ['01', '问清楚', COLORS.blue],
    ['02', '想名字', COLORS.coral],
    ['03', '说说为什么', COLORS.teal]
  ];
  steps.forEach(([number, label, color], index) => {
    const y = 4.0 + index * 0.72;
    addText(slide, number, 0.84, y, 0.5, 0.3, { fontSize: 14, color, bold: true });
    addText(slide, label, 1.55, y - 0.03, 2.4, 0.38, { fontSize: 24, color: COLORS.white, bold: true });
    addRule(slide, 1.55, y + 0.48, 3.05, '33466E');
  });
  slide.addImage({ path: asset('03-consultant.svg'), x: 6.18, y: 1.05, w: 6.45, h: 5.45 });
  addText(slide, '别人会问：为什么？', 7.02, 6.54, 4.8, 0.3, { fontSize: 18, color: COLORS.blueSoft, bold: true, align: 'right' });
  addFooter(slide, true);
  addNotes(slide, '教師提示：先展示最後要做的事情。學生不需要先知道全部語言形式，只要知道要問清楚、想名字、說說為什麼。');
}

// 04 — Listening strategy
{
  const slide = pptx.addSlide('BLANK');
  slide.background = { color: COLORS.paper };
  addHeader(slide, '先听一听', 4);
  addText(slide, '先听两遍，再回答', 0.76, 1.18, 7.3, 0.62, { fontSize: 34, bold: true });
  addText(slide, '第一遍听大意，第二遍找答案。', 0.78, 1.96, 4.8, 0.34, { fontSize: 18, color: COLORS.slate });
  slide.addShape('roundRect', { x: 0.78, y: 2.62, w: 4.15, h: 3.75, rectRadius: 0.12, fill: { color: COLORS.blueDark }, line: { color: COLORS.blueDark, transparency: 100 } });
  slide.addImage({ path: asset('04-listening.svg'), x: 1.0, y: 3.0, w: 3.7, h: 2.55 });
  addPill(slide, '第1—2段', 1.08, 2.85, 1.2, COLORS.coral);
  addText(slide, '先听，再回答。', 1.08, 5.73, 3.35, 0.32, { fontSize: 16, color: 'DCE7FF', align: 'center' });
  const listeningSteps = [
    ['第一遍', '听大意', COLORS.blue],
    ['第二遍', '找答案', COLORS.coral],
    ['小组', '一起说', COLORS.teal]
  ];
  listeningSteps.forEach(([label, action, color], index) => {
    const y = 2.72 + index * 1.08;
    slide.addShape('ellipse', { x: 5.62, y: y + 0.06, w: 0.22, h: 0.22, fill: { color }, line: { color, transparency: 100 } });
    addText(slide, label, 6.12, y, 1.4, 0.32, { fontSize: 18, color, bold: true });
    addText(slide, action, 7.7, y - 0.02, 3.8, 0.4, { fontSize: 28, color: COLORS.ink, bold: true });
    if (index < 2) addRule(slide, 6.12, y + 0.64, 5.0, COLORS.line);
  });
  addText(slide, '说出你听到的内容。', 6.12, 6.18, 4.1, 0.34, { fontSize: 18, color: COLORS.slate });
  addFooter(slide);
  addNotes(slide, '教師提示：第一遍不暫停，第二遍讓學生找答案並說出聽到的內容。不要先講解所有詞語。');
}

// 05 — Phrase in context
{
  const slide = pptx.addSlide('BLANK');
  slide.background = { color: COLORS.warm };
  addHeader(slide, '看到图，说一说', 5);
  addText(slide, '遇到这种情况，怎么说？', 0.76, 1.18, 6.8, 0.62, { fontSize: 34, bold: true });
  addText(slide, '先看图，再用一句话回答。', 0.78, 1.96, 5.8, 0.34, { fontSize: 18, color: COLORS.slate });
  addText(slide, '总不能……吧', 0.82, 2.95, 4.55, 0.72, { fontSize: 39, bold: true, color: COLORS.blueDark });
  addRule(slide, 0.84, 3.92, 3.7, COLORS.coral, 0);
  addText(slide, '有三个要求，怎么办？', 0.84, 4.35, 4.2, 0.62, { fontSize: 21, color: COLORS.ink, breakLine: true });
  addText(slide, '用一句话回应。', 0.84, 5.36, 3.2, 0.36, { fontSize: 22, color: COLORS.coral, bold: true });
  slide.addImage({ path: asset('05-phrase-scenes.svg'), x: 5.55, y: 1.38, w: 7.05, h: 5.35 });
  addFooter(slide);
  addNotes(slide, '教師提示：先讓學生看圖，自己說出句式適用的情況。只修補影響理解的語音與語序，不做長篇文法定義。');
}

// 06 — Information station
{
  const slide = pptx.addSlide('BLANK');
  slide.background = { color: COLORS.paper };
  addHeader(slide, '认识姓氏', 6);
  addText(slide, '一起认识中国人的姓', 0.76, 1.18, 5.9, 0.68, { fontSize: 42, bold: true });
  addText(slide, '换一张卡，和同学说一说。', 0.8, 2.02, 5.4, 0.36, { fontSize: 20, color: COLORS.slate });
  const stations = [
    ['听一听', COLORS.blue],
    ['读一读', COLORS.coral],
    ['说一说', COLORS.teal],
    ['查一查', 'B68B00']
  ];
  stations.forEach(([label, color], index) => {
    const y = 2.96 + index * 0.68;
    slide.addShape('ellipse', { x: 0.84, y: y + 0.08, w: 0.2, h: 0.2, fill: { color }, line: { color, transparency: 100 } });
    addText(slide, label, 1.28, y, 1.45, 0.36, { fontSize: 24, color: COLORS.ink, bold: true });
  });
  addRule(slide, 0.84, 5.87, 3.8, COLORS.line);
  addText(slide, '每个人说一个姓。', 0.84, 6.14, 4.2, 0.34, { fontSize: 17, color: COLORS.slate });
  slide.addImage({ path: asset('06-station.svg'), x: 5.55, y: 1.32, w: 7.05, h: 5.4 });
  addFooter(slide);
  addNotes(slide, '教師提示：此頁是 P6 姓氏資訊站的視覺 prototype。完整活動規則放在站點卡，不塞入學生主畫面。');
}

const prototypeManifest = {
  package: 'lesson-01-visual-prototype',
  generated_at: new Date().toISOString(),
  status: 'pending_visual_prototype_review',
  format: 'native-pptx-only',
  html_required: false,
  slide_count: 6,
  slides: [
    { number: 1, title: '中国人的姓名', role: '開場英雄頁', visual_asset: '01-hero.svg' },
    { number: 2, title: '帮别人起一个中文名', role: '學生任務頁', visual_asset: '02-objectives.svg' },
    { number: 3, title: '你来帮别人起名字', role: '任務操作頁', visual_asset: '03-consultant.svg' },
    { number: 4, title: '先听两遍，再回答', role: '聽力操作頁', visual_asset: '04-listening.svg' },
    { number: 5, title: '遇到这种情况，怎么说？', role: '情境說話頁', visual_asset: '05-phrase-scenes.svg' },
    { number: 6, title: '一起认识中国人的姓', role: '姓氏活動頁', visual_asset: '06-station.svg' }
  ],
  design_direction: 'Soft Structuralism × Editorial Split',
  font: FONT,
  canvas: '16:9 / 13.333 × 7.5 in',
  text_policy: 'student-facing text is Chinese-only, low-density, task-first, and free of teacher/design labels',
  student_copy_policy: '初級到中級常用詞；只寫學生現在要做的事情；教師提示只在 speaker notes',
  assets: ['01-hero.svg', '02-objectives.svg', '03-consultant.svg', '04-listening.svg', '05-phrase-scenes.svg', '06-station.svg'],
  pptx_sha256: null
};

const reviewMarkdown = `# 第一課視覺 Prototype 審閱包

狀態：**待視覺 prototype 審核**

這是 6 張原生 PPTX prototype，用來檢查視覺方向，不代表完整 69 張課堂簡報已完成。

## 6 張內容

1. 開場：中國人的姓名
2. 學生任務：幫別人起一個中文名
3. 任務操作：問清楚、想名字、說說為什麼
4. 聽力操作：先聽兩遍，再回答
5. 情境說話：遇到這種情況，怎麼說？
6. 姓氏活動：一起認識中國人的姓

## Prototype 檢查項目

- 原生可編輯 PPTX，16:9。
- 學生主畫面全中文，沒有越南文。
- 學生主畫面不放「視覺樣稿」、能力目標、聽力策略、句式情境、資訊站等教師／製作用語。
- 所有操作文字改成學生當下要做的事情，並控制在初級到中級可理解的常用詞範圍。
- 文字不是教案段落；每頁只保留一個課堂動作。
- 使用原創 SVG 視覺素材，沒有未授權網路圖片。
- speaker notes 已加入教師提示，沒有放在學生主畫面。
- 這一版先檢查圖片比例、留白、字級、視覺節奏與任務辨識度。
- 原生檔案完整性與 PDF 頁數已完成自動檢查；bundled headless LibreOffice 的 PDF 會把 CJK 字形顯示成方框，不作中文字體判斷。
- 已在 macOS Microsoft PowerPoint 開啟檢查，CJK 字形正常；已抽查第 1、2、4、5 頁，並確認 1–6 頁縮圖沒有教師備註標籤或文字溢出。

## 通過條件

請確認：視覺方向、文字密度、圖片比例、字體與色彩可以沿用到完整 PPTX。視覺方向通過後，才展開 69 張投影片與實際音檔嵌入。
`;

async function build() {
  await pptx.writeFile({ fileName: pptxPath });
  prototypeManifest.pptx_sha256 = sha256(pptxPath);
  fs.writeFileSync(path.join(outputDir, 'manifest.json'), `${JSON.stringify(prototypeManifest, null, 2)}\n`);
  fs.writeFileSync(path.join(outputDir, 'prototype-review.md'), reviewMarkdown);
  console.log(JSON.stringify({ outputDir, pptxPath, slideCount: 6, assetCount: 6, pptxSha256: prototypeManifest.pptx_sha256 }, null, 2));
}

build().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
