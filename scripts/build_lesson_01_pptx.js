// Compatibility entry point. The approved v2 outline and textbook visual system
// are now the only source for the complete lesson deck.
if (require.main === module) {
  require('./build_lesson_01_pptx_v2.js');
} else {
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const PptxGenJS = require('pptxgenjs');
const { toSimplified, toTeacherGuideChinese } = require('./simplify_chinese');

const projectRoot = path.resolve(__dirname, '..');
const sourcePath = path.join(projectRoot, 'work/boya-intermediate/extractions/structured-lesson-01.json');
const storyboardPath = path.join(projectRoot, 'output/boya-intermediate/lesson-01/storyboard/lesson-01-ppt-storyboard.csv');
const prototypeAssetDir = path.join(projectRoot, 'output/boya-intermediate/lesson-01/visual-prototype/assets');
const audioRoot = path.join(projectRoot, 'Giáo trình/博雅汉语听说-中级冲刺篇/音频/第01课');
const outputDir = path.join(projectRoot, 'output/boya-intermediate/lesson-01/pptx');
const pptxPath = path.join(outputDir, 'lesson-01.pptx');
const manifestPath = path.join(outputDir, 'manifest.json');
const audioManifestPath = path.join(outputDir, 'audio-manifest.json');
fs.mkdirSync(outputDir, { recursive: true });

const W = 13.333;
const H = 7.5;
const FONT = 'SimHei';
const COLORS = {
  paper: 'F7F8FA', warm: 'F5F1EB', ink: '111827', slate: '667085',
  blue: '2F6BFF', blueDark: '0F172A', blueSoft: 'DCE7FF', coral: 'FF6B57',
  coralSoft: 'FFE2DC', line: 'D9E0E8', white: 'FFFFFF', mist: 'E9EEF3',
  teal: '1D9A9A', tealSoft: 'D9F0EF', yellow: 'F5C84B', yellowSoft: 'F4EAC5'
};

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (ch === '"' && quoted && next === '"') { cell += '"'; i += 1; continue; }
    if (ch === '"') { quoted = !quoted; continue; }
    if (ch === ',' && !quoted) { row.push(cell); cell = ''; continue; }
    if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && next === '\n') i += 1;
      row.push(cell); cell = '';
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
      continue;
    }
    cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const headers = rows.shift();
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ''])));
}

const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const rows = parseCsv(fs.readFileSync(storyboardPath, 'utf8'))
  .map((row) => ({ ...row, slide_no: Number(row.slide_no) }))
  .sort((a, b) => a.slide_no - b.slide_no);
const exerciseById = new Map(source.exercises.map((item) => [item.record_id, item]));
const audioByTrack = new Map(source.audio_map.map((item) => [item.track_label, item]));

function asset(name) { return path.join(prototypeAssetDir, name); }

function text(value) {
  return toSimplified(String(value || '')).replace(/\s+/g, ' ').trim();
}

function shorten(value, max = 84) {
  const clean = text(value);
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function cleanTitle(value) {
  let title = text(value);
  const replacements = [
    [/^P\d+\s*/, ''],
    [/目标与预习回收/, '先和同伴说一说'],
    [/目标与快速回收/, '先问一个问题'],
    [/预测与听力分工/, '先读问题，分工找答案'],
    [/最终任务简报与角色/, '准备起名儿公司'],
    [/预习证据与研究分工/, '交换研究卡'],
    [/回馈、重做与出口/, '说一次，再改一改'],
    [/总結与能力检核/, '我现在能……'],
    [/总结与能力检核/, '我现在能……'],
    [/P[1-6] 出口/, '说一说'],
  ];
  replacements.forEach(([pattern, replacement]) => { title = title.replace(pattern, replacement); });
  return title;
}

function cleanContent(value) {
  return text(value)
    .replace(/^第[一二三四五六]部分：/, '')
    .replace(/^出口任务：/, '')
    .replace(/^课末检核：/, '')
    .replace(/^回馈后重做：/, '再说一次：')
    .trim();
}

function displayOutput(row) {
  let value = text(row.student_output || '完成课堂任务');
  if (/学生知道|学生理解/.test(value)) value = '知道今天要做什么';
  if (/教师收回|教师取得/.test(value)) value = value.includes('出口') ? '交出出口卡' : '写下一个想确认的问题';
  if (/快速启动|不重新讲解/.test(value)) value = '开始互动';
  if (/建立信息站角色/.test(value)) value = '选一个站点角色';
  if (/总结出口卡/.test(value)) value = '完成出口卡';
  return value.replace(/教师|老师/g, '同伴').trim() || '完成课堂任务';
}

function sectionLabel(period) {
  const labels = {
    P1: '姓名和名字', P2: '说说名字', P3: '名字里的意思',
    P4: '起名儿公司', P5: '姓氏和称呼', P6: '认识姓氏'
  };
  return labels[period] || '第一课';
}

function accentFor(period) {
  return ({ P1: COLORS.blue, P2: COLORS.coral, P3: COLORS.teal, P4: COLORS.blue, P5: COLORS.coral, P6: 'B68B00' })[period] || COLORS.blue;
}

function softFor(period) {
  return ({ P1: COLORS.blueSoft, P2: COLORS.coralSoft, P3: COLORS.tealSoft, P4: COLORS.blueSoft, P5: COLORS.coralSoft, P6: COLORS.yellowSoft })[period] || COLORS.blueSoft;
}

function imageFor(row) {
  const purpose = text(row.purpose);
  if (row.slide_no === 1) return '01-hero.svg';
  if (row.slide_no === 2) return '02-objectives.svg';
  if (row.slide_no === 3) return '03-consultant.svg';
  if (row.slide_no === 5 || row.audio_track || /听力|录音|填空|判断|主旨|细节/.test(purpose)) return '04-listening.svg';
  if (row.period === 'P2' || /句式|改写|情境/.test(purpose)) return '05-phrase-scenes.svg';
  if (row.period === 'P4' || /客户|提案|演员|报告/.test(purpose)) return '03-consultant.svg';
  if (row.period === 'P6' || /姓氏|单姓|复姓|历史人物/.test(purpose)) return '06-station.svg';
  return '01-hero.svg';
}

function addText(slide, value, x, y, w, h, options = {}) {
  slide.addText(text(value), {
    x, y, w, h, fontFace: FONT, fontSize: 20, color: COLORS.ink, margin: 0,
    fit: 'shrink', valign: 'mid', lang: 'zh-CN', breakLine: false,
    paraSpaceAfterPt: 0, ...options
  });
}

function addRule(slide, x, y, w, color = COLORS.line, transparency = 0) {
  slide.addShape('line', { x, y, w, h: 0, line: { color, transparency, pt: 1 } });
}

function addPill(slide, value, x, y, w, fill, color = COLORS.white, h = 0.34) {
  slide.addShape('roundRect', { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: fill, transparency: 100 } });
  addText(slide, value, x + 0.04, y + 0.01, w - 0.08, h - 0.02, { fontSize: 11, color, bold: true, align: 'center' });
}

function addHeader(slide, row, dark = false) {
  const secondary = dark ? 'AAB8D6' : COLORS.slate;
  const line = dark ? '33466E' : COLORS.line;
  addText(slide, row.period === 'GLOBAL' ? '第一课' : sectionLabel(row.period), 0.76, 0.38, 5.8, 0.24, { fontSize: 12, color: secondary, bold: true, charSpacing: 1.2 });
  addText(slide, String(row.slide_no).padStart(2, '0'), 12.0, 0.38, 0.55, 0.24, { fontSize: 12, color: secondary, bold: true, align: 'right' });
  addRule(slide, 0.76, 0.82, 11.82, line);
}

function addMeta(slide, row, dark = false) {
  const fill = dark ? '1D2C4A' : COLORS.white;
  const line = dark ? '33466E' : COLORS.line;
  const color = dark ? 'E6ECF7' : COLORS.slate;
  const time = row.time && row.time !== '—' ? `${row.time} 分钟` : '本课开始';
  const group = row.grouping && row.grouping !== '—' ? row.grouping : '全班';
  addPill(slide, time, 0.82, 6.65, 1.2, fill, color, 0.34);
  addPill(slide, group, 2.12, 6.65, Math.min(2.55, Math.max(1.2, group.length * 0.17 + 0.65)), fill, color, 0.34);
  const output = shorten(displayOutput(row), 48);
  slide.addShape('roundRect', { x: 4.85, y: 6.65, w: 4.85, h: 0.34, rectRadius: 0.08, fill: { color: fill }, line: { color: line, pt: 0.7 } });
  addText(slide, `完成：${output}`, 5.05, 6.69, 4.45, 0.24, { fontSize: 11, color, bold: true });
}

function drawWave(slide, x, y, w, color, dark = false) {
  const points = [0.18, 0.44, 0.12, 0.7, 0.26, 0.56, 0.15, 0.78, 0.3, 0.48, 0.2, 0.65, 0.1];
  points.forEach((height, i) => {
    slide.addShape('line', { x: x + (w / points.length) * i, y: y + (0.8 - height) / 2, w: 0, h: height, line: { color, pt: dark ? 2.6 : 2.2, beginArrowType: 'none', endArrowType: 'none' } });
  });
}

function drawNameTiles(slide, x, y, dark = false) {
  const labels = [['姓', COLORS.blue], ['名', COLORS.coral], ['义', COLORS.teal]];
  labels.forEach(([label, color], index) => {
    const bx = x + index * 0.92;
    slide.addShape('roundRect', { x: bx, y, w: 0.76, h: 0.94, rectRadius: 0.08, fill: { color: dark ? '1D2C4A' : COLORS.white }, line: { color, pt: 1.4 } });
    addText(slide, label, bx, y + 0.12, 0.76, 0.46, { fontSize: 28, bold: true, color: dark ? COLORS.white : COLORS.ink, align: 'center' });
    addText(slide, ['姓', '名', '意思'][index], bx, y + 0.62, 0.76, 0.2, { fontSize: 10, color, align: 'center' });
  });
}

function drawPeople(slide, x, y, scale = 1) {
  const colors = [COLORS.blue, COLORS.coral, COLORS.teal];
  colors.forEach((color, index) => {
    const cx = x + index * 0.85 * scale;
    slide.addShape('ellipse', { x: cx + 0.16 * scale, y, w: 0.38 * scale, h: 0.38 * scale, fill: { color: color }, line: { color, transparency: 100 } });
    slide.addShape('roundRect', { x: cx, y: y + 0.34 * scale, w: 0.72 * scale, h: 0.62 * scale, rectRadius: 0.08, fill: { color: color }, line: { color, transparency: 100 } });
  });
}

function drawFlow(slide, x, y, labels, dark = false) {
  labels.forEach((label, index) => {
    const bx = x + index * 1.26;
    const color = [COLORS.blue, COLORS.coral, COLORS.teal, 'B68B00'][index % 4];
    slide.addShape('ellipse', { x: bx, y, w: 0.46, h: 0.46, fill: { color }, line: { color, transparency: 100 } });
    addText(slide, String(index + 1), bx, y + 0.08, 0.46, 0.2, { fontSize: 12, color: COLORS.white, bold: true, align: 'center' });
    addText(slide, label, bx - 0.23, y + 0.6, 0.92, 0.26, { fontSize: 13, color: dark ? COLORS.white : COLORS.ink, bold: true, align: 'center' });
    if (index < labels.length - 1) addRule(slide, bx + 0.5, y + 0.22, 0.7, dark ? '5B6D96' : COLORS.line);
  });
}

function drawStationGrid(slide, x, y, dark = false) {
  const items = [['听', COLORS.blue], ['问', COLORS.coral], ['说', COLORS.teal], ['查', 'B68B00']];
  items.forEach(([label, color], index) => {
    const bx = x + (index % 2) * 1.28;
    const by = y + Math.floor(index / 2) * 0.92;
    slide.addShape('roundRect', { x: bx, y: by, w: 1.08, h: 0.72, rectRadius: 0.08, fill: { color: dark ? '1D2C4A' : COLORS.white }, line: { color, pt: 1.2 } });
    addText(slide, label, bx, by + 0.12, 1.08, 0.32, { fontSize: 24, color: dark ? COLORS.white : COLORS.ink, bold: true, align: 'center' });
    addText(slide, ['听一听', '问一问', '说一说', '查一查'][index], bx, by + 0.47, 1.08, 0.16, { fontSize: 10, color, align: 'center' });
  });
}

function drawVisualAccent(slide, row, x, y, w, h, dark = false) {
  const purpose = text(row.purpose);
  const base = dark ? COLORS.white : COLORS.ink;
  if (row.audio_track || /听力|录音|填空|判断|主旨|细节/.test(purpose)) {
    drawWave(slide, x + 0.5, y + 0.32, w - 1, dark ? COLORS.blueSoft : COLORS.blue, dark);
    addText(slide, '听', x + 0.18, y + 0.78, 0.6, 0.42, { fontSize: 28, bold: true, color: COLORS.coral, align: 'center' });
    addText(slide, '抓重点', x + 0.85, y + 0.82, w - 1.1, 0.28, { fontSize: 16, color: base, bold: true });
  } else if (/姓氏|单姓|复姓|历史人物|信息站/.test(purpose)) {
    drawStationGrid(slide, x + 0.45, y + 0.25, dark);
    addText(slide, '姓', x + w - 1.25, y + h - 0.72, 0.55, 0.5, { fontSize: 34, color: COLORS.coral, bold: true, align: 'center' });
  } else if (/客户|提案|演员|报告|研究|角色/.test(purpose)) {
    drawPeople(slide, x + 0.48, y + 0.38, 1.1);
    drawFlow(slide, x + 0.55, y + 2.0, ['问清楚', '想名字', '说理由'], dark);
  } else if (/句式|改写|情境/.test(purpose)) {
    const phrases = ['总不能……吧', '才怪呢', '话说回来'];
    phrases.forEach((phrase, index) => {
      slide.addShape('roundRect', { x: x + 0.35, y: y + 0.34 + index * 0.74, w: w - 0.7, h: 0.5, rectRadius: 0.08, fill: { color: index === 1 ? COLORS.coralSoft : index === 2 ? COLORS.tealSoft : COLORS.blueSoft }, line: { color: 'FFFFFF', transparency: 100 } });
      addText(slide, phrase, x + 0.52, y + 0.47 + index * 0.74, w - 1.04, 0.24, { fontSize: 18, color: COLORS.ink, bold: true, align: 'center' });
    });
  } else if (/调查|资料|比较/.test(purpose)) {
    const colors = [COLORS.blue, COLORS.coral, COLORS.teal];
    ['时代', '地域', '愿望'].forEach((label, index) => {
      const by = y + 0.5 + index * 0.9;
      slide.addShape('roundRect', { x: x + 0.45, y: by, w: 1.0, h: 0.34, rectRadius: 0.05, fill: { color: colors[index] }, line: { color: colors[index], transparency: 100 } });
      addText(slide, label, x + 0.45, by + 0.04, 1.0, 0.18, { fontSize: 11, color: COLORS.white, bold: true, align: 'center' });
      slide.addShape('roundRect', { x: x + 1.65, y: by + 0.03, w: 2.0 - index * 0.36, h: 0.28, rectRadius: 0.05, fill: { color: dark ? '5B6D96' : COLORS.mist }, line: { color: 'FFFFFF', transparency: 100 } });
    });
  } else {
    drawNameTiles(slide, x + 0.62, y + 0.46, dark);
    drawFlow(slide, x + 0.48, y + 2.15, ['听', '问', '说'], dark);
  }
}

function addVisualPanel(slide, row, dark = false) {
  const x = 7.95;
  const y = 1.3;
  const w = 4.68;
  const h = 5.05;
  const panel = dark ? '172442' : COLORS.white;
  const line = dark ? '33466E' : COLORS.line;
  slide.addShape('roundRect', { x, y, w, h, rectRadius: 0.14, fill: { color: panel }, line: { color: line, pt: 0.8 } });
  const imageName = imageFor(row);
  if (fs.existsSync(asset(imageName))) {
    slide.addImage({ path: asset(imageName), x: x + 0.18, y: y + 0.18, w: w - 0.36, h: 2.25 });
  }
  slide.addShape('rect', { x: x + 0.18, y: y + 0.18, w: w - 0.36, h: 2.25, fill: { color: dark ? COLORS.blueDark : COLORS.paper, transparency: 47 }, line: { color: COLORS.white, transparency: 100 } });
  drawVisualAccent(slide, row, x + 0.3, y + 2.55, w - 0.6, 2.12, dark);
}

function audioTracksForRow(row) {
  const tracks = text(row.audio_track).split(/\s*,\s*/).filter(Boolean);
  if (row.slide_no === 6 && !tracks.includes('1-1')) tracks.unshift('1-1');
  return tracks;
}

function addAudioBadge(slide, row, audioState, dark = false) {
  const tracks = audioTracksForRow(row);
  if (!tracks.length) return;
  const fill = dark ? '1D2C4A' : COLORS.white;
  const line = dark ? '33466E' : COLORS.line;
  const color = dark ? 'E6ECF7' : COLORS.ink;
  slide.addShape('roundRect', { x: 9.86, y: 6.59, w: 2.78, h: 0.47, rectRadius: 0.08, fill: { color: fill }, line: { color: line, pt: 0.8 } });
  const first = tracks[0];
  const audioPath = path.join(audioRoot, `${first}.mp3`);
  if (fs.existsSync(audioPath) && !audioState.embedded.has(first)) {
    slide.addMedia({ type: 'audio', path: audioPath, x: 10.0, y: 6.65, w: 0.36, h: 0.36, objectName: `音频 ${first}` });
    audioState.embedded.add(first);
    audioState.firstEmbeddedSlide[first] = row.slide_no;
  }
  const label = tracks.length === 1 ? `音频 ${first}` : `音频 ${tracks.join('、')}`;
  addText(slide, label, 10.46, 6.69, 1.98, 0.19, { fontSize: 11, color, bold: true, align: 'center' });
  tracks.forEach((track) => {
    if (!audioState.usedSlides[track]) audioState.usedSlides[track] = [];
    audioState.usedSlides[track].push(row.slide_no);
  });
}

function addNotes(slide, row, audioState) {
  const sourceRefs = row.source_refs || '—';
  const audioTracks = audioTracksForRow(row);
  const audio = audioTracks.join('、') || '—';
  const note = toTeacherGuideChinese(row.speaker_note_zh_tw || '先让学生完成任务，再根据表现做短修补。');
  const firstSlides = audioTracks.map((track) => audioState.firstEmbeddedSlide[track] ? `${track}：第${audioState.firstEmbeddedSlide[track]}页` : '').filter(Boolean).join('；');
  slide.addNotes(`${note}\n\n课堂位置：${row.period || 'GLOBAL'}，${row.time || '—'}分钟\n教材练习：${sourceRefs}\n音频：${audio}\n音频播放页：${firstSlides || '—'}\n分组：${text(row.grouping) || '全班'}\n学生产出：${text(row.student_output) || '完成课堂任务'}\n配套材料：${text(row.support_asset) || '—'}`);
}

function addGenericSlide(slide, row, dark = false) {
  slide.background = { color: dark ? COLORS.blueDark : (row.period === 'P2' ? COLORS.warm : COLORS.paper) };
  addHeader(slide, row, dark);
  const titleColor = dark ? COLORS.white : COLORS.ink;
  const secondary = dark ? 'C4D1E8' : COLORS.slate;
  const accent = accentFor(row.period);
  const soft = softFor(row.period);
  addPill(slide, row.period === 'GLOBAL' ? '先做起来' : `第${row.period.replace('P', '')}部分`, 0.8, 1.08, 1.02, accent);
  addText(slide, cleanTitle(row.purpose), 0.8, 1.62, 6.55, 0.72, { fontSize: cleanTitle(row.purpose).length > 14 ? 28 : 34, bold: true, color: titleColor });
  addText(slide, shorten(row.student_instruction_zh, 78), 0.82, 2.47, 6.45, 0.68, { fontSize: 21, color: secondary, bold: true, breakLine: true });
  slide.addShape('roundRect', { x: 0.8, y: 3.42, w: 6.45, h: 1.48, rectRadius: 0.12, fill: { color: dark ? '172442' : soft }, line: { color: dark ? '33466E' : soft, pt: 0.8 } });
  addText(slide, cleanContent(row.student_content_zh) || '和同伴一起完成任务。', 1.08, 3.76, 5.9, 0.8, { fontSize: cleanContent(row.student_content_zh).length > 55 ? 17 : 22, color: dark ? COLORS.white : COLORS.ink, bold: true, breakLine: true });
  addText(slide, '先说，再改一改。', 0.84, 5.48, 3.0, 0.3, { fontSize: 17, color: accent, bold: true });
  addVisualPanel(slide, row, dark);
  addMeta(slide, row, dark);
}

function addCover(slide, row) {
  slide.background = { color: COLORS.blueDark };
  slide.addImage({ path: asset('01-hero.svg'), x: 0, y: 0, w: W, h: H });
  slide.addShape('rect', { x: 0, y: 0, w: 6.5, h: H, fill: { color: COLORS.blueDark, transparency: 19 }, line: { color: COLORS.blueDark, transparency: 100 } });
  addPill(slide, '第一课', 0.8, 0.76, 0.98, COLORS.coral);
  addText(slide, '中国人的姓名', 0.8, 2.05, 5.7, 0.82, { fontSize: 44, bold: true, color: COLORS.white, breakLine: true });
  addText(slide, '中国人的名字怎么说？', 0.82, 3.15, 5.2, 0.46, { fontSize: 22, color: 'E6ECF7' });
  addText(slide, '姓  /  名  /  意思', 8.55, 6.15, 3.8, 0.28, { fontSize: 13, color: COLORS.blueDark, bold: true, align: 'right' });
}

function addTaskSlide(slide, row) {
  slide.background = { color: COLORS.paper };
  addHeader(slide, row);
  addText(slide, '帮别人起一个中文名', 0.76, 1.18, 7.0, 0.62, { fontSize: 34, bold: true });
  addText(slide, '先听一听，再问一问，最后说说为什么。', 0.78, 1.95, 6.6, 0.34, { fontSize: 17, color: COLORS.slate });
  ['听', '问', '说'].forEach((label, index) => addText(slide, label, 0.82 + index * 2.28, 3.15, 2.1, 0.58, { fontSize: 34, bold: true, color: [COLORS.blue, COLORS.coral, COLORS.teal][index] }));
  addRule(slide, 0.84, 4.03, 6.6, COLORS.line);
  addText(slide, '听懂名字  ·  问清要求  ·  说说为什么', 0.82, 4.38, 6.55, 0.38, { fontSize: 16, color: COLORS.slate });
  slide.addImage({ path: asset('02-objectives.svg'), x: 8.0, y: 1.15, w: 4.55, h: 4.95 });
  addText(slide, '我会听、会问、会说', 8.25, 6.22, 3.9, 0.38, { fontSize: 20, bold: true, color: COLORS.ink });
  addMeta(slide, row);
}

function addFinalTaskSlide(slide, row) {
  slide.background = { color: COLORS.blueDark };
  addHeader(slide, row, true);
  addPill(slide, '最后一步', 0.8, 1.25, 1.2, COLORS.coral);
  addText(slide, '你来帮别人起名字', 0.8, 1.86, 5.3, 0.78, { fontSize: 38, bold: true, color: COLORS.white });
  addText(slide, '先问清楚，再想名字，最后说说为什么。', 0.82, 2.83, 4.8, 0.58, { fontSize: 18, color: 'C4D1E8', breakLine: true });
  drawFlow(slide, 0.84, 4.0, ['问清楚', '想名字', '说理由'], true);
  slide.addImage({ path: asset('03-consultant.svg'), x: 6.18, y: 1.05, w: 6.45, h: 5.45 });
  addText(slide, '别人会问：为什么？', 7.02, 6.54, 4.8, 0.3, { fontSize: 18, color: COLORS.blueSoft, bold: true, align: 'right' });
  addMeta(slide, row, true);
}

function addListeningSlide(slide, row) {
  slide.background = { color: COLORS.paper };
  addHeader(slide, row);
  addText(slide, '先听两遍，再回答', 0.76, 1.18, 7.3, 0.62, { fontSize: 34, bold: true });
  addText(slide, '第一遍听大意，第二遍找答案。', 0.78, 1.96, 4.8, 0.34, { fontSize: 18, color: COLORS.slate });
  slide.addShape('roundRect', { x: 0.78, y: 2.62, w: 4.15, h: 3.75, rectRadius: 0.12, fill: { color: COLORS.blueDark }, line: { color: COLORS.blueDark, transparency: 100 } });
  slide.addImage({ path: asset('04-listening.svg'), x: 1.0, y: 3.0, w: 3.7, h: 2.55 });
  addPill(slide, '先听，再回答', 1.08, 2.85, 1.72, COLORS.coral);
  [['第一遍', '听大意', COLORS.blue], ['第二遍', '找答案', COLORS.coral], ['小组', '一起说', COLORS.teal]].forEach(([label, action, color], index) => {
    const y = 2.72 + index * 1.08;
    slide.addShape('ellipse', { x: 5.62, y: y + 0.06, w: 0.22, h: 0.22, fill: { color }, line: { color, transparency: 100 } });
    addText(slide, label, 6.12, y, 1.4, 0.32, { fontSize: 18, color, bold: true });
    addText(slide, action, 7.7, y - 0.02, 3.8, 0.4, { fontSize: 28, color: COLORS.ink, bold: true });
    if (index < 2) addRule(slide, 6.12, y + 0.64, 5.0, COLORS.line);
  });
  addText(slide, '说出你听到的内容。', 6.12, 6.18, 4.1, 0.34, { fontSize: 18, color: COLORS.slate });
  addMeta(slide, row);
}

function addPhraseSlide(slide, row) {
  slide.background = { color: COLORS.warm };
  addHeader(slide, row);
  addText(slide, cleanTitle(row.purpose), 0.76, 1.18, 6.8, 0.62, { fontSize: 34, bold: true });
  addText(slide, shorten(row.student_instruction_zh, 72), 0.78, 1.96, 5.8, 0.5, { fontSize: 18, color: COLORS.slate, breakLine: true });
  const phrase = row.slide_no === 23 ? '总不能……吧' : row.slide_no === 24 ? '……才怪呢' : row.slide_no === 25 ? '为什么？' : '话说回来';
  addText(slide, phrase, 0.82, 2.95, 5.3, 0.72, { fontSize: 39, bold: true, color: COLORS.blueDark });
  addRule(slide, 0.84, 3.92, 3.7, COLORS.coral);
  addText(slide, cleanContent(row.student_content_zh) || '用一句话回应。', 0.84, 4.35, 4.8, 0.78, { fontSize: 21, color: COLORS.ink, breakLine: true });
  addText(slide, '先看图，再说一说。', 0.84, 5.42, 3.6, 0.36, { fontSize: 20, color: COLORS.coral, bold: true });
  slide.addImage({ path: asset('05-phrase-scenes.svg'), x: 5.55, y: 1.38, w: 7.05, h: 5.35 });
  addMeta(slide, row);
}

function addStationSlide(slide, row) {
  slide.background = { color: COLORS.paper };
  addHeader(slide, row);
  addText(slide, '一起认识中国人的姓', 0.76, 1.18, 5.9, 0.68, { fontSize: 38, bold: true });
  addText(slide, shorten(row.student_instruction_zh, 70), 0.8, 2.02, 5.4, 0.5, { fontSize: 20, color: COLORS.slate, breakLine: true });
  drawStationGrid(slide, 0.84, 3.0);
  addRule(slide, 0.84, 5.87, 3.8, COLORS.line);
  addText(slide, '换一张卡，和同学说一说。', 0.84, 6.14, 4.2, 0.34, { fontSize: 17, color: COLORS.slate });
  slide.addImage({ path: asset('06-station.svg'), x: 5.55, y: 1.32, w: 7.05, h: 5.4 });
  addMeta(slide, row);
}

async function main() {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Vinh University Chinese Listening and Speaking Course';
  pptx.company = 'Vinh University courseware';
  pptx.subject = '第一课：中国人的姓名';
  pptx.title = '第一课：中国人的姓名';
  pptx.lang = 'zh-CN';
  pptx.theme = { headFontFace: FONT, bodyFontFace: FONT, lang: 'zh-CN' };
  pptx.defineSlideMaster({ title: 'BLANK', background: { color: COLORS.paper }, objects: [] });

  const audioState = { embedded: new Set(), firstEmbeddedSlide: {}, usedSlides: {} };
  const exerciseSlides = {};

  rows.forEach((row) => {
    const slide = pptx.addSlide('BLANK');
    if (row.source_refs) {
      row.source_refs.split('|').filter(Boolean).forEach((id) => {
        if (!exerciseSlides[id]) exerciseSlides[id] = [];
        exerciseSlides[id].push(row.slide_no);
      });
    }
    if (row.slide_no === 1) addCover(slide, row);
    else if (row.slide_no === 2) addTaskSlide(slide, row);
    else if (row.slide_no === 3) addFinalTaskSlide(slide, row);
    else if (row.slide_no === 5) addListeningSlide(slide, row);
    else if (row.slide_no >= 23 && row.slide_no <= 26) addPhraseSlide(slide, row);
    else if (row.slide_no === 62) addStationSlide(slide, row);
    else addGenericSlide(slide, row, [28, 38, 58].includes(row.slide_no));
    addAudioBadge(slide, row, audioState, [1, 3, 28, 38, 58].includes(row.slide_no));
    addNotes(slide, row, audioState);
  });

  await pptx.writeFile({ fileName: pptxPath });

  const audioManifest = source.audio_map.map((item) => ({
    track: item.track_label,
    source_file: path.relative(projectRoot, path.join(audioRoot, `${item.track_label}.mp3`)),
    sha256: sha256(path.join(audioRoot, `${item.track_label}.mp3`)),
    referenced_slides: audioState.usedSlides[item.track_label] || [],
    first_embedded_slide: audioState.firstEmbeddedSlide[item.track_label] || null,
    embedded_in_pptx: Boolean(audioState.firstEmbeddedSlide[item.track_label])
  }));
  fs.writeFileSync(audioManifestPath, `${JSON.stringify({ policy: '每段音频只在第一次出现的投影片嵌入；后续投影片保留音频编号，教师可回到第一次出现的投影片重播。', tracks: audioManifest }, null, 2)}\n`);

  const coverageCount = Object.keys(exerciseSlides).length;
  const manifest = {
    package: 'boya-intermediate-lesson-01-native-pptx',
    generated_at: new Date().toISOString(),
    status: 'ready_for_pptx_qa',
    format: 'native-editable-pptx',
    html_required: false,
    slide_count: rows.length,
    period_count: 6,
    minutes_per_period: 50,
    total_minutes: 300,
    exercise_count: source.exercises.length,
    exercise_coverage_count: coverageCount,
    audio_track_count: source.audio_map.length,
    audio_embedded_count: audioManifest.filter((item) => item.embedded_in_pptx).length,
    language: '简体中文',
    student_language_policy: '学生端投影使用简体中文；学生画面只显示当前课堂动作。',
    source_of_truth: 'output/boya-intermediate/lesson-01/teacher/lesson-01-teacher-guide.md',
    input_storyboard: path.relative(projectRoot, storyboardPath),
    audio_manifest: path.relative(projectRoot, audioManifestPath),
    pptx_sha256: sha256(pptxPath),
    exercise_slide_map: exerciseSlides,
    output_files: ['lesson-01.pptx', 'audio-manifest.json', 'manifest.json']
  };
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify({ pptxPath, slideCount: rows.length, exerciseCoverageCount: coverageCount, audioEmbeddedCount: manifest.audio_embedded_count, pptxSha256: manifest.pptx_sha256 }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
}
