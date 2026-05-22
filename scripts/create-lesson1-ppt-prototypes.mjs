#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const root = process.cwd();
const dataPath = path.join(root, 'output/vp-database/lesson-01/vp_lesson_01_database.json');
const data = JSON.parse(await fs.readFile(dataPath, 'utf8'));

const outRoot = path.join(root, 'output/lesson-01-ppt-prototypes');
await fs.rm(outRoot, { recursive: true, force: true });
await fs.mkdir(outRoot, { recursive: true });

const esc = (s = '') => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const vocab = data.content_items.filter(x => x.record_type === 'vocabulary').sort((a, b) => a.teaching_order - b.teaching_order);
const byChar = Object.fromEntries(vocab.map(x => [x.chinese_simplified, x]));
const word = (han) => byChar[han];
const pageMap = [
  '01 Cover: source p.19',
  '02 Objectives: p.19-30',
  '03 Warm-up: supplemental',
  '04 Vocabulary overview: p.19-20',
  '05 你 / 好 / 你好: p.19',
  '06 Numbers 一 / 五 / 八: p.19',
  '07 More vocabulary 大 / 不 / 口 / 白 / 女 / 马: p.19-20',
  '08 Dialogue: p.19',
  '09 Practice: p.28-30',
  '10 Homework: p.28-30'
];

const variants = {
  a: {
    name: 'Version A · Infographic Classroom',
    folder: 'version-a-infographic-classroom',
    accent: '#2563EB',
    accent2: '#F59E0B',
    accent3: '#10B981',
    ink: '#111827',
    muted: '#5B6472',
    bg: '#F8FAFC',
    panel: '#FFFFFF',
    soft: '#EFF6FF',
    soft2: '#FEF3C7',
    border: '#D8DEE9',
    radius: '18pt',
    motif: 'progress chips, flashcards, clean classroom icons'
  },
  b: {
    name: 'Version B · Visual Storytelling',
    folder: 'version-b-visual-storytelling',
    accent: '#C2410C',
    accent2: '#0F766E',
    accent3: '#7C3AED',
    ink: '#1F2937',
    muted: '#6B5F54',
    bg: '#FFF7ED',
    panel: '#FFFCF7',
    soft: '#FED7AA',
    soft2: '#CCFBF1',
    border: '#E7D8C9',
    radius: '8pt',
    motif: 'scene panels, speech moments, classroom story flow'
  },
  c: {
    name: 'Version C · Learning Dashboard',
    folder: 'version-c-learning-dashboard',
    accent: '#0F766E',
    accent2: '#7C3AED',
    accent3: '#E11D48',
    ink: '#172033',
    muted: '#667085',
    bg: '#F3F7F6',
    panel: '#FFFFFF',
    soft: '#DFF7EF',
    soft2: '#EDE9FE',
    border: '#CBD5E1',
    radius: '12pt',
    motif: 'meters, charts, scoreboards, structured practice'
  }
};

function sharedCss(v) {
  return `
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  width: 960pt;
  height: 540pt;
  overflow: hidden;
  position: relative;
  background: ${v.bg};
  color: ${v.ink};
  font-family: "Aptos", "Inter", "PingFang SC", "Noto Sans SC", "Microsoft YaHei", Arial, sans-serif;
}
.slide { position: absolute; inset: 0; overflow: hidden; }
.bg-band { position: absolute; left: 0; top: 0; width: 960pt; height: 116pt; background: ${v.soft}; }
.orb { position: absolute; border-radius: 999pt; background: ${v.soft2}; border: 1.2pt solid ${v.border}; }
.orb.one { width: 168pt; height: 168pt; right: -50pt; top: -48pt; }
.orb.two { width: 108pt; height: 108pt; left: -34pt; bottom: -30pt; background: ${v.soft}; }
.wrap { position: absolute; inset: 34pt 48pt 34pt 48pt; }
.kicker {
  position: absolute; left: 0; top: 0; min-width: 96pt; height: 24pt;
  border-radius: 999pt; background: ${v.panel}; border: 1.2pt solid ${v.border};
}
.kicker p { font-size: 9.2pt; line-height: 24pt; text-align: center; font-weight: 800; color: ${v.accent}; letter-spacing: .07em; }
h1 { position: absolute; left: 0; top: 36pt; width: 620pt; font-size: 31pt; line-height: 1.06; font-weight: 850; color: ${v.ink}; }
h2 { font-size: 20pt; line-height: 1.12; font-weight: 850; color: ${v.ink}; }
h3 { font-size: 15pt; line-height: 1.18; font-weight: 820; color: ${v.ink}; }
p { font-size: 13.4pt; line-height: 1.3; color: ${v.muted}; }
.small p, p.small { font-size: 9.5pt; line-height: 1.25; color: ${v.muted}; }
.panel { position: absolute; background: ${v.panel}; border: 1.25pt solid ${v.border}; border-radius: ${v.radius}; box-shadow: 0 7pt 20pt rgba(15, 23, 42, .07); }
.flat { position: absolute; background: ${v.panel}; border: 1.25pt solid ${v.border}; border-radius: ${v.radius}; }
.pill { position: absolute; height: 26pt; border-radius: 999pt; background: ${v.soft}; border: 1pt solid ${v.border}; }
.pill p { font-size: 10.2pt; line-height: 26pt; text-align: center; font-weight: 800; color: ${v.ink}; }
.dot { position: absolute; width: 14pt; height: 14pt; border-radius: 999pt; background: ${v.accent}; }
.line { position: absolute; height: 2.2pt; background: ${v.border}; border-radius: 99pt; }
.cn { font-family: "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif; font-weight: 900; color: ${v.ink}; }
.pinyin { color: ${v.accent}; font-weight: 800; }
.big-cn { font-family: "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif; font-size: 76pt; line-height: .95; font-weight: 900; color: ${v.ink}; }
.big-pinyin { font-size: 24pt; line-height: 1.05; font-weight: 800; color: ${v.accent}; }
.meaning { font-size: 16pt; color: ${v.muted}; font-weight: 650; }
.caption p { font-size: 9.2pt; line-height: 1.15; letter-spacing: .07em; color: ${v.accent}; font-weight: 850; }
.footer { position: absolute; left: 48pt; right: 48pt; bottom: 15pt; height: 12pt; }
.footer p { font-size: 8pt; color: ${v.muted}; text-align: right; }
`;
}

function shell(v, file, title, kicker, body, extraCss = '') {
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>${esc(file)} · ${esc(title)}</title>
<style>${sharedCss(v)}${extraCss}</style>
</head>
<body>
<div class="slide">
  <div class="bg-band"></div>
  <div class="orb one"></div>
  <div class="orb two"></div>
  <div class="wrap">
    <div class="kicker"><p>${esc(kicker)}</p></div>
    <h1>${esc(title)}</h1>
    ${body}
  </div>
  <div class="footer"><p>第一课 · 你好 · Bài 1 Xin chào</p></div>
</div>
</body>
</html>`;
}

function vocabCard(v, item, x, y, w, h, label, fill = null) {
  const bg = fill || v.panel;
  return `
<div class="panel" style="left:${x};top:${y};width:${w};height:${h};background:${bg};">
  <div class="caption" style="position:absolute;left:14pt;top:12pt;"><p>${esc(label)}</p></div>
  <p class="pinyin" style="position:absolute;left:14pt;top:36pt;width:${w};font-size:18pt;">${esc(item.pinyin)}</p>
  <p class="cn" style="position:absolute;left:14pt;top:66pt;width:${w};font-size:42pt;line-height:1;">${esc(item.chinese_simplified)}</p>
  <p style="position:absolute;left:14pt;right:14pt;bottom:14pt;font-size:12.2pt;">${esc(item.vietnamese)}</p>
</div>`;
}

function versionSlides(v, key) {
  const storyCss = key === 'b' ? `
.panel { box-shadow: none; }
.scene { position:absolute; border-radius:8pt; border:1.3pt solid ${v.border}; background:${v.soft2}; }
.scene p { font-size:12pt; }
` : '';
  const dashCss = key === 'c' ? `
.panel { box-shadow: none; }
.metric p { font-size: 9.5pt; text-transform: uppercase; letter-spacing:.05em; font-weight:800; color:${v.muted}; }
.bar { position:absolute; height:11pt; border-radius:99pt; background:${v.soft}; border:1pt solid ${v.border}; }
.fill { position:absolute; height:11pt; border-radius:99pt; background:${v.accent}; }
` : '';

  const titleWord = key === 'b' ? 'Một lời chào mở đầu buổi học' : key === 'c' ? 'Bảng điều khiển Bài 1' : 'Bài 1: 你好';
  return [
    ['01-cover.html', 'Trang bìa', shell(v, '01-cover', titleWord, 'BÀI 1', `
      <div class="panel" style="left:0;top:122pt;width:410pt;height:260pt;background:${v.panel};">
        <p class="big-pinyin" style="position:absolute;left:28pt;top:28pt;">nǐ hǎo</p>
        <p class="big-cn" style="position:absolute;left:28pt;top:70pt;">你好</p>
        <p class="meaning" style="position:absolute;left:30pt;top:156pt;">Xin chào</p>
        <div class="pill" style="left:28pt;bottom:28pt;width:136pt;"><p>12 từ vựng</p></div>
        <div class="pill" style="left:178pt;bottom:28pt;width:156pt;background:${v.soft2};"><p>p.19-30</p></div>
      </div>
      <div class="flat" style="right:0;top:104pt;width:360pt;height:288pt;background:${v.soft};">
        <p class="cn" style="position:absolute;left:28pt;top:24pt;font-size:42pt;">一、五、八</p>
        <p style="position:absolute;left:30pt;top:88pt;width:260pt;font-size:15pt;">Từ lời chào đến các chữ Hán đầu tiên.</p>
        <div class="line" style="left:30pt;top:152pt;width:270pt;background:${v.accent};"></div>
        <p style="position:absolute;left:30pt;top:180pt;width:250pt;">Mục tiêu: đọc đúng, nhận mặt chữ, luyện nói theo cặp.</p>
      </div>`, storyCss + dashCss)],
    ['02-objectives.html', 'Mục tiêu', shell(v, '02-objectives', 'Sau bài học, sinh viên làm được gì?', 'MỤC TIÊU', `
      <div class="line" style="left:62pt;top:166pt;width:620pt;background:${v.accent};"></div>
      ${['Chào hỏi bằng 你好', 'Đọc 12 từ vựng cơ bản', 'Viết các chữ Hán đầu tiên'].map((t, i) => `
      <div class="dot" style="left:${62 + i * 260}pt;top:160pt;background:${i === 0 ? v.accent : i === 1 ? v.accent2 : v.accent3};"></div>
      <div class="panel" style="left:${20 + i * 268}pt;top:204pt;width:230pt;height:142pt;">
        <p class="cn" style="position:absolute;left:16pt;top:14pt;font-size:28pt;">0${i + 1}</p>
        <h2 style="position:absolute;left:16pt;top:56pt;width:188pt;">${esc(t)}</h2>
      </div>`).join('')}
      <div class="flat" style="left:156pt;top:374pt;width:520pt;height:54pt;background:${v.soft2};">
        <p style="position:absolute;left:20pt;right:20pt;top:14pt;text-align:center;font-weight:750;color:${v.ink};">Pinyin đặt trên chữ Hán. Nghĩa tiếng Việt đặt dưới.</p>
      </div>`, storyCss + dashCss)],
    ['03-warmup.html', 'Khởi động', shell(v, '03-warmup', 'Bạn đã nghe câu chào nào bằng tiếng Trung chưa?', 'KHỞI ĐỘNG', `
      <div class="panel" style="left:30pt;top:120pt;width:430pt;height:214pt;background:${v.soft2};">
        <p style="position:absolute;left:28pt;top:22pt;width:340pt;font-size:24pt;line-height:1.15;font-weight:850;color:${v.ink};">“Bạn nhớ câu nào trong phim, bài hát hoặc mạng xã hội?”</p>
        <p style="position:absolute;left:30pt;top:142pt;width:300pt;">Hỏi nhanh cả lớp, nhận mọi câu trả lời, rồi dẫn vào 你好.</p>
      </div>
      <div class="panel" style="left:506pt;top:114pt;width:290pt;height:74pt;"><p style="position:absolute;left:18pt;top:20pt;font-weight:800;color:${v.ink};">phim ảnh</p></div>
      <div class="panel" style="left:552pt;top:214pt;width:250pt;height:74pt;background:${v.soft};"><p style="position:absolute;left:18pt;top:20pt;font-weight:800;color:${v.ink};">bài hát</p></div>
      <div class="panel" style="left:500pt;top:314pt;width:300pt;height:74pt;"><p style="position:absolute;left:18pt;top:20pt;font-weight:800;color:${v.ink};">trải nghiệm cá nhân</p></div>`, storyCss + dashCss)],
    ['04-vocab-overview.html', 'Từ vựng', shell(v, '04-vocab-overview', '12 từ vựng đầu tiên', 'TỪ VỰNG', `
      <div class="panel" style="left:0;top:114pt;width:820pt;height:286pt;">
        ${vocab.map((item, i) => {
          const col = i % 6;
          const row = Math.floor(i / 6);
          return `<div class="flat" style="left:${18 + col * 130}pt;top:${20 + row * 126}pt;width:112pt;height:102pt;background:${i < 3 ? v.soft2 : i < 6 ? v.soft : v.panel};">
            <p class="pinyin" style="position:absolute;left:10pt;top:10pt;width:90pt;text-align:center;font-size:12pt;">${esc(item.pinyin)}</p>
            <p class="cn" style="position:absolute;left:10pt;top:32pt;width:90pt;text-align:center;font-size:30pt;line-height:1;">${esc(item.chinese_simplified)}</p>
            <p style="position:absolute;left:8pt;right:8pt;bottom:9pt;text-align:center;font-size:8.6pt;line-height:1.1;">${esc(item.word_type_vi.replace('thành ngữ', 'cụm từ'))}</p>
          </div>`;
        }).join('')}
      </div>
      <div class="pill" style="left:590pt;top:418pt;width:230pt;background:${v.soft2};"><p>theo thứ tự giáo trình p.19-20</p></div>`, storyCss + dashCss)],
    ['05-key-greeting.html', '你好', shell(v, '05-key-greeting', 'Từ đơn đến lời chào', 'TRỌNG TÂM', `
      ${vocabCard(v, word('你'), '0pt', '124pt', '238pt', '190pt', 'ĐẠI TỪ', v.panel)}
      ${vocabCard(v, word('好'), '292pt', '124pt', '238pt', '190pt', 'TÍNH TỪ', v.soft)}
      <div class="line" style="left:238pt;top:216pt;width:54pt;background:${v.accent};"></div>
      <div class="line" style="left:530pt;top:216pt;width:54pt;background:${v.accent};"></div>
      <div class="panel" style="left:584pt;top:102pt;width:240pt;height:238pt;background:${v.soft2};">
        <p class="pinyin" style="position:absolute;left:20pt;top:28pt;font-size:20pt;">${esc(word('你好').pinyin)}</p>
        <p class="cn" style="position:absolute;left:20pt;top:66pt;font-size:58pt;line-height:1;">你好</p>
        <p style="position:absolute;left:22pt;top:142pt;font-size:17pt;font-weight:800;color:${v.ink};">Xin chào</p>
        <p style="position:absolute;left:22pt;right:20pt;bottom:20pt;font-size:10.5pt;">Dạy như một cụm từ, không dịch thành “bạn tốt”.</p>
      </div>`, storyCss + dashCss)],
    ['06-numbers.html', 'Số đếm', shell(v, '06-numbers', 'Nhận biết số: 一、五、八', 'SỐ ĐẾM', `
      ${['一', '五', '八'].map((han, i) => {
        const item = word(han);
        return `<div class="panel" style="left:${34 + i * 270}pt;top:122pt;width:224pt;height:230pt;background:${i === 0 ? v.panel : i === 1 ? v.soft : v.soft2};">
          <p class="pinyin" style="position:absolute;left:22pt;top:22pt;font-size:19pt;">${esc(item.pinyin)}</p>
          <p class="cn" style="position:absolute;left:22pt;top:60pt;font-size:86pt;line-height:.95;">${esc(han)}</p>
          <p style="position:absolute;left:24pt;bottom:26pt;font-size:18pt;font-weight:800;color:${v.ink};">${esc(item.vietnamese)}</p>
        </div>`;
      }).join('')}
      <div class="flat" style="left:170pt;top:384pt;width:500pt;height:48pt;background:${v.panel};">
        <p style="position:absolute;left:18pt;right:18pt;top:12pt;text-align:center;font-weight:750;color:${v.ink};">Giảng viên giơ 1, 5, 8 ngón tay. Sinh viên đọc bằng tiếng Trung.</p>
      </div>`, storyCss + dashCss)],
    ['07-more-vocab.html', 'Nhóm từ', shell(v, '07-more-vocab', 'Nhóm từ còn lại', 'MỞ RỘNG', `
      ${['大', '不', '口', '白', '女', '马'].map((han, i) => {
        const item = word(han);
        return `<div class="panel" style="left:${18 + (i % 3) * 270}pt;top:${118 + Math.floor(i / 3) * 132}pt;width:238pt;height:108pt;background:${i % 2 ? v.panel : v.soft};">
          <p class="pinyin" style="position:absolute;left:16pt;top:14pt;font-size:14pt;">${esc(item.pinyin)}</p>
          <p class="cn" style="position:absolute;left:16pt;top:38pt;font-size:42pt;line-height:1;">${esc(han)}</p>
          <p style="position:absolute;left:84pt;right:14pt;top:42pt;font-size:12pt;">${esc(item.vietnamese)}</p>
        </div>`;
      }).join('')}
      <div class="pill" style="left:516pt;top:394pt;width:306pt;background:${v.soft2};"><p>Lưu ý phát âm: 女 nǚ, 马 mǎ</p></div>`, storyCss + dashCss)],
    ['08-dialogue.html', 'Bài đọc', shell(v, '08-dialogue', 'Bài đọc: chào và đáp lại', 'BÀI ĐỌC', `
      <div class="panel" style="left:72pt;top:132pt;width:314pt;height:118pt;background:${v.soft};">
        <p style="position:absolute;left:20pt;top:18pt;font-size:12pt;font-weight:850;color:${v.accent};">A</p>
        <p class="pinyin" style="position:absolute;left:64pt;top:20pt;font-size:20pt;">nǐ hǎo</p>
        <p class="cn" style="position:absolute;left:64pt;top:54pt;font-size:36pt;">你好</p>
      </div>
      <div class="panel" style="left:438pt;top:246pt;width:314pt;height:118pt;background:${v.soft2};">
        <p style="position:absolute;left:20pt;top:18pt;font-size:12pt;font-weight:850;color:${v.accent2};">B</p>
        <p class="pinyin" style="position:absolute;left:64pt;top:20pt;font-size:20pt;">nǐ hǎo</p>
        <p class="cn" style="position:absolute;left:64pt;top:54pt;font-size:36pt;">你好</p>
      </div>
      <div class="line" style="left:372pt;top:226pt;width:92pt;background:${v.accent};transform:rotate(24deg);"></div>
      <div class="flat" style="left:92pt;top:386pt;width:626pt;height:44pt;background:${v.panel};">
        <p style="position:absolute;left:18pt;right:18pt;top:10pt;text-align:center;font-weight:750;color:${v.ink};">Luyện theo cặp: đổi vai sau mỗi lượt.</p>
      </div>`, storyCss + dashCss)],
    ['09-practice.html', 'Luyện tập', shell(v, '09-practice', 'Ghép Hán tự, pinyin và nghĩa', 'LUYỆN TẬP', `
      ${[
        ['Hán tự', ['马', '你', '好']],
        ['Pinyin', ['hǎo', 'mǎ', 'nǐ']],
        ['Nghĩa', ['bạn', 'ngựa', 'tốt']]
      ].map((col, i) => `<div class="panel" style="left:${36 + i * 270}pt;top:120pt;width:220pt;height:252pt;background:${i === 1 ? v.soft : v.panel};">
        <h2 style="position:absolute;left:18pt;top:18pt;width:180pt;">${esc(col[0])}</h2>
        ${col[1].map((x, j) => `<div class="flat" style="left:22pt;top:${66 + j * 54}pt;width:176pt;height:40pt;background:${j === 1 ? v.soft2 : v.panel};"><p style="position:absolute;left:12pt;right:12pt;top:9pt;text-align:center;font-weight:850;color:${v.ink};">${esc(x)}</p></div>`).join('')}
      </div>`).join('')}
      <div class="pill" style="left:264pt;top:402pt;width:316pt;background:${v.soft2};"><p>Hoạt động cặp đôi · 5 phút</p></div>`, storyCss + dashCss)],
    ['10-homework.html', 'Bài tập', shell(v, '10-homework', 'Kết thúc buổi học và bài về nhà', 'BÀI TẬP', `
      <div class="panel" style="left:0;top:118pt;width:392pt;height:252pt;background:${v.soft};">
        <h2 style="position:absolute;left:22pt;top:20pt;width:320pt;">Trong sách</h2>
        <p style="position:absolute;left:24pt;top:70pt;width:310pt;">Làm E001-E007, trang 28-30.</p>
        <p style="position:absolute;left:24pt;top:116pt;width:310pt;">Tập viết: 一、八、大、不、五、口、白、女、马、你、好.</p>
      </div>
      <div class="panel" style="left:438pt;top:118pt;width:386pt;height:252pt;background:${v.panel};">
        <h2 style="position:absolute;left:22pt;top:20pt;width:320pt;">Tự luyện</h2>
        <p style="position:absolute;left:24pt;top:70pt;width:300pt;">Đọc to 12 từ vựng mỗi ngày.</p>
        <p style="position:absolute;left:24pt;top:116pt;width:300pt;">Chơi Blooket nếu giảng viên đã tạo bộ câu hỏi.</p>
      </div>
      <div class="flat" style="left:186pt;top:396pt;width:470pt;height:40pt;background:${v.soft2};">
        <p style="position:absolute;left:18pt;right:18pt;top:9pt;text-align:center;font-weight:850;color:${v.ink};">Hẹn buổi sau: mở rộng cách chào hỏi.</p>
      </div>`, storyCss + dashCss)]
  ];
}

function indexHtml(v, slides) {
  const manifest = slides.map(([file, label]) => `    { file: "slides/${file}", label: "${esc(label)}" }`).join(',\n');
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${esc(v.name)}</title>
<script>window.DECK_MANIFEST=[\n${manifest}\n];window.DECK_WIDTH=1280;window.DECK_HEIGHT=720;</script>
<style>*{box-sizing:border-box;margin:0;padding:0}html,body{height:100%;background:#111827;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,sans-serif}#stage{position:fixed;top:0;left:0;transform-origin:top left;width:1280px;height:720px;background:white;box-shadow:0 10px 60px rgba(0,0,0,.45)}iframe{width:100%;height:100%;border:0;background:white}.counter{position:fixed;right:18px;bottom:18px;background:rgba(0,0,0,.76);color:white;border-radius:999px;padding:7px 13px;font-size:13px;z-index:10}.nav{position:fixed;top:0;bottom:0;width:18%;z-index:8;cursor:pointer}.nav.left{left:0}.nav.right{right:0}</style></head>
<body><div id="stage"><iframe id="frame" src="about:blank"></iframe></div><div class="nav left" id="prev"></div><div class="nav right" id="next"></div><div class="counter" id="counter"></div>
<script>(()=>{const W=window.DECK_WIDTH,H=window.DECK_HEIGHT,deck=window.DECK_MANIFEST,stage=document.getElementById('stage'),frame=document.getElementById('frame'),counter=document.getElementById('counter');let current=Math.max(0,Math.min(deck.length-1,Number(location.hash.slice(1)||1)-1));function fit(){const s=Math.min(innerWidth/W,innerHeight/H);stage.style.transform='translate('+((innerWidth-W*s)/2)+'px,'+((innerHeight-H*s)/2)+'px) scale('+s+')'}function show(i){if(i<0||i>=deck.length)return;current=i;frame.src=deck[i].file;counter.textContent=(i+1)+' / '+deck.length+' · '+deck[i].label;history.replaceState(null,'','#'+(i+1))}addEventListener('resize',fit);addEventListener('keydown',e=>{if(['ArrowRight',' ','PageDown'].includes(e.key))show(current+1);if(['ArrowLeft','PageUp'].includes(e.key))show(current-1);if(e.key==='Home')show(0);if(e.key==='End')show(deck.length-1)});document.getElementById('prev').onclick=()=>show(current-1);document.getElementById('next').onclick=()=>show(current+1);fit();show(current)})();</script></body></html>`;
}

const galleryCards = [];
for (const [key, variant] of Object.entries(variants)) {
  const dir = path.join(outRoot, variant.folder);
  const slidesDir = path.join(dir, 'slides');
  await fs.mkdir(slidesDir, { recursive: true });
  const slides = versionSlides(variant, key);
  for (const [file, , html] of slides) {
    await fs.writeFile(path.join(slidesDir, file), html, 'utf8');
  }
  await fs.writeFile(path.join(dir, 'index.html'), indexHtml(variant, slides), 'utf8');
  await fs.writeFile(path.join(dir, 'README.md'), `# ${variant.name}\n\n10-slide Lesson 1 prototype for review.\n\nDesign motif: ${variant.motif}\n\n## Page mapping\n${pageMap.map(x => `- ${x}`).join('\n')}\n`, 'utf8');
  galleryCards.push({ key, variant });
}

const gallery = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Lesson 1 PPT Prototypes</title>
<style>*{box-sizing:border-box}body{margin:0;background:#F8FAFC;color:#111827;font-family:Aptos,Inter,Arial,sans-serif}.wrap{max-width:1100px;margin:0 auto;padding:44px 28px}h1{font-size:36px;margin:0 0 12px}p{font-size:16px;line-height:1.5;color:#536071}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:28px}.card{background:white;border:1px solid #D8DEE9;border-radius:14px;padding:22px;min-height:190px;box-shadow:0 10px 30px rgba(15,23,42,.06)}h2{font-size:21px;margin:0 0 10px}.btn{display:inline-block;margin-top:18px;padding:10px 14px;border-radius:999px;background:#111827;color:white;text-decoration:none;font-weight:700}.meta{font-size:13px;color:#667085}@media(max-width:900px){.grid{grid-template-columns:1fr}}</style></head><body><div class="wrap"><h1>Lesson 1 PPT Design Prototypes</h1><p>Three 10-slide visual directions generated from the Lesson 1 database. Use arrow keys inside each deck to review slides.</p><div class="grid">
${galleryCards.map(({ variant }) => `<div class="card"><p class="meta">10 slides</p><h2>${esc(variant.name)}</h2><p>${esc(variant.motif)}</p><a class="btn" href="${variant.folder}/index.html">Open deck</a></div>`).join('')}
</div></div></body></html>`;
await fs.writeFile(path.join(outRoot, 'index.html'), gallery, 'utf8');
await fs.writeFile(path.join(outRoot, 'README.md'), `# Lesson 1 PPT Design Prototypes\n\nGenerated from \`output/vp-database/lesson-01/vp_lesson_01_database.json\`.\n\n## Versions\n${Object.values(variants).map(v => `- ${v.name}: \`${v.folder}/index.html\``).join('\n')}\n\n## Shared content\n- Lesson: 第一课 · 你好 · Bài 1 Xin chào\n- Vocabulary source: textbook p.19-20\n- Exercise/homework source: textbook p.28-30\n- Visible slide language: Vietnamese labels, Simplified Chinese content, pinyin pronunciation support\n\n## Page mapping\n${pageMap.map(x => `- ${x}`).join('\n')}\n`, 'utf8');

console.log(`Created ${outRoot}`);
