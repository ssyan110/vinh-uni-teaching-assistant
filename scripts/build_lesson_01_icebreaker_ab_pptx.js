const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const PptxGenJS = require('pptxgenjs');
const {
  CJK_FONT, LATIN_FONT, COLORS, simplify, addText, addLatin, addLine, addHeader, addAccent
} = require('./lesson_pptx_master_template');

const root = path.resolve(__dirname, '..');
const lessonKey = 'boya-quasi-intermediate-i:lesson-01';
const outDir = path.join(root, 'lessons/boya-quasi-intermediate-i/lesson-01/10-design/pptx-draft/first-week-icebreakers');
const source = path.join(root, '.frontend-slides/lesson-01-第一周破冰-PPT-学生画面文字草案-v1.md');
const python = process.env.CODEX_PYTHON || 'python3';

execFileSync(python, [path.join(root, 'scripts/production_gate.py'), '--purpose', 'pptx', '--stage', 'draft', '--lesson-key', lessonKey, '--output-dir', outDir], { stdio: 'inherit', cwd: root });

function parseNodes(markdown) {
  const nodes = [];
  const chunks = markdown.split(/^## /m).slice(1);
  for (const chunk of chunks) {
    const lines = chunk.split(/\r?\n/);
    const heading = lines[0].trim();
    if (!/^\d{2}\s*[｜|／]/.test(heading)) continue;
    const match = chunk.match(/```text\s*\n([\s\S]*?)\n```/);
    if (!match) continue;
    const text = match[1].trim();
    if (!text || /不需要|不用/.test(text)) continue;
    nodes.push({ id: heading.slice(0, 2), heading: heading.replace(/^\d{2}\s*[｜|／]\s*/, '').trim(), lines: text.split(/\r?\n/).map(s => s.trim()).filter(Boolean) });
  }
  return nodes;
}

function addFooter(slide, label) {
  addLatin(slide, label, 0.78, 7.12, 5.5, 0.16, { fontSize: 9, color: COLORS.muted });
}

function makeDeck(nodes, theme, filename) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Adam Yan';
  pptx.subject = '第一堂課破冰活動學生投影草稿';
  pptx.title = `lesson-01 第一周破冰 ${theme.name}`;
  pptx.company = '榮市大學';
  pptx.lang = 'zh-CN';
  pptx.theme = { headFontFace: CJK_FONT, bodyFontFace: CJK_FONT, lang: 'zh-CN' };

  nodes.forEach((node, index) => {
    const slide = pptx.addSlide();
    slide.background = { color: COLORS.white };
    const isCover = index === 0;
    const title = node.heading.replace(/^（.*?）\s*/, '');
    if (isCover) {
      slide.background = { color: theme.coverBg };
      slide.addShape('rect', { x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: theme.coverBg }, line: { color: theme.coverBg, transparency: 100 } });
      slide.addShape('rect', { x: 0.72, y: 0.8, w: 0.18, h: 5.8, fill: { color: theme.accent }, line: { color: theme.accent, transparency: 100 } });
      addLatin(slide, 'VINH UNIVERSITY · CHINESE LISTENING & SPEAKING', 1.25, 1.0, 7.4, 0.24, { fontSize: 11, color: theme.accent, bold: true, charSpacing: 1.5 });
      addText(slide, node.lines[0] || '第一堂課', 1.25, 2.0, 7.8, 0.75, { fontSize: 42, bold: true, color: theme.ink });
      addText(slide, node.lines.slice(1).join('\n'), 1.28, 3.15, 6.8, 1.5, { fontSize: 26, breakLine: true, color: theme.ink, valign: 'top' });
      slide.addShape('roundRect', { x: 9.15, y: 1.25, w: 2.75, h: 4.4, rectRadius: 0.08, fill: { color: theme.card }, line: { color: theme.accent, pt: 1.2 } });
      addText(slide, '今天', 9.55, 2.0, 1.9, 0.45, { fontSize: 28, bold: true, align: 'center', color: theme.accent });
      addText(slide, '认识老师\n认识同学\n开始说中文', 9.45, 2.75, 2.1, 1.9, { fontSize: 24, breakLine: true, align: 'center', color: theme.ink });
      addLatin(slide, 'editable draft · A/B visual comparison', 9.25, 5.25, 2.55, 0.2, { fontSize: 9, align: 'center', color: theme.muted });
      slide.addNotes(`学生画面文字草稿节点 ${node.id}。本版本为 ${theme.name}，文字框均可在 PowerPoint 中编辑与移动。`);
      return;
    }

    addHeader(slide, index + 1, title, { lessonLabel: '荣市大学中文听说（一）' });
    slide.addShape('roundRect', { x: 0.78, y: 1.78, w: 11.78, h: 4.35, rectRadius: 0.08, fill: { color: theme.card }, line: { color: theme.line, pt: 0.8 } });
    addAccent(slide, 1.15, 2.16, 1.05, theme.accent, 0.1);
    const lines = node.lines;
    const body = lines.join('\n');
    const size = lines.length >= 8 ? 24 : lines.length >= 5 ? 28 : 34;
    addText(slide, body, 1.25, 2.55, 7.1, 2.95, { fontSize: size, breakLine: true, valign: 'top', color: theme.ink, bold: lines.length <= 3 });
    slide.addShape('roundRect', { x: 9.05, y: 2.18, w: 2.55, h: 3.28, rectRadius: 0.08, fill: { color: theme.side }, line: { color: theme.side, transparency: 100 } });
    addText(slide, String(index + 1).padStart(2, '0'), 9.42, 2.62, 1.75, 0.75, { fontSize: 36, bold: true, align: 'center', color: theme.accent });
    addText(slide, node.heading, 9.35, 3.65, 1.95, 0.9, { fontSize: 20, align: 'center', color: theme.ink });
    addFooter(slide, `${theme.name} · 学生端可编辑草稿 · 节点 ${node.id}`);
    slide.addNotes(`节点 ${node.id}：${node.heading}\n本页文字来自教师已填写的学生画面文字草稿。`);
  });
  fs.mkdirSync(outDir, { recursive: true });
  return pptx.writeFile({ fileName: path.join(outDir, filename) });
}

async function main() {
  const nodes = parseNodes(fs.readFileSync(source, 'utf8'));
  if (nodes.length < 2) throw new Error('未能从已填写的学生画面文字草稿解析出有效节点');
  const common = { ink: COLORS.ink, muted: COLORS.muted };
  await makeDeck(nodes, { name: 'A 教材延续型', coverBg: COLORS.white, card: 'F7FAFC', side: 'E6F4F1', accent: COLORS.teal, line: COLORS.line, ...common }, 'lesson-01-第一周破冰-A-教材延续型-draft-v1.pptx');
  await makeDeck(nodes, { name: 'B 校园互动卡片型', coverBg: 'FFFDF8', card: 'FFF7E8', side: 'F0EAF8', accent: COLORS.coral, line: 'E8DCCB', ...common }, 'lesson-01-第一周破冰-B-校园互动卡片型-draft-v1.pptx');
  console.log(JSON.stringify({ status: 'success', nodes: nodes.map(n => n.id), outputs: [
    path.join(outDir, 'lesson-01-第一周破冰-A-教材延续型-draft-v1.pptx'),
    path.join(outDir, 'lesson-01-第一周破冰-B-校园互动卡片型-draft-v1.pptx')
  ] }, null, 2));
}
main().catch(err => { console.error(err.stack || err.message); process.exit(1); });
