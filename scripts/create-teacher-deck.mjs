#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const input = process.argv[2];
if (!input) {
  console.error('Usage: node scripts/create-teacher-deck.mjs examples/lesson.json');
  process.exit(1);
}

const root = process.cwd();
const lesson = JSON.parse(await fs.readFile(path.resolve(input), 'utf8'));
const slug = 'sample-teacher-deck';
const outDir = path.join(root, 'output', slug);
const slidesDir = path.join(outDir, 'slides');
await fs.mkdir(slidesDir, { recursive: true });

const esc = (s='') => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const list = arr => arr.map(x => `<li>${esc(x)}</li>`).join('\n');
const vocabRows = lesson.keyVocabulary.map(v => `
  <div class="row">
    <p class="pin">${esc(v.pinyin)}</p>
    <p class="han">${esc(v.simplified || v.traditional)}</p>
    <p class="vi">${esc(v.vietnamese)}</p>
  </div>`).join('\n');
const flowRows = lesson.lessonFlow.map(x => `
  <div class="flow-row">
    <p class="time">${esc(x.minutes)}</p>
    <p class="stage">${esc(x.stage)}</p>
    <p class="detail"><b>Giảng viên:</b> ${esc(x.teacher)}<br><b>Sinh viên:</b> ${esc(x.student)}</p>
  </div>`).join('\n');

function slide(title, kicker, body, notes='') {
  return `<!DOCTYPE html>
<html lang="zh-Hans">
<head>
<meta charset="UTF-8">
<title>${esc(title)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { width: 960pt; height: 540pt; overflow: hidden; background: #FBF8EF; color: #1F2933; font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", "Microsoft YaHei", Arial, sans-serif; position: relative; }
  .page { position: absolute; inset: 28pt 42pt 30pt 42pt; }
  .mast { position: absolute; top: 0; left: 0; right: 0; height: 30pt; border-bottom: 1.2pt solid #172554; }
  .mast p { font-size: 9pt; letter-spacing: 0.12em; text-transform: uppercase; color: #334155; }
  .kicker { position: absolute; top: 54pt; left: 0; width: 170pt; }
  .kicker p { color: #B45309; font-size: 11pt; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; }
  h1 { position: absolute; top: 82pt; left: 0; right: 0; font-size: 34pt; line-height: 1.08; color: #0F172A; letter-spacing: -0.02em; }
  .content { position: absolute; top: 168pt; left: 0; right: 0; bottom: 38pt; }
  p, li { font-size: 15pt; line-height: 1.38; }
  ul { padding-left: 24pt; }
  li { margin-bottom: 9pt; }
  .card { background: #FFFFFF; border: 1.2pt solid #D6C7A1; border-radius: 12pt; padding: 18pt; box-shadow: 0 4pt 14pt rgba(15,23,42,0.08); }
  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 18pt; }
  .footer { position: absolute; left: 0; right: 0; bottom: 0; border-top: 1pt solid #D6C7A1; padding-top: 8pt; }
  .footer p { font-size: 9pt; color: #64748B; }
  .badge { display: inline-block; background: #172554; color: #FFFFFF; border-radius: 999pt; padding: 5pt 11pt; font-size: 10pt; font-weight: 700; }
  .row { display: grid; grid-template-columns: 120pt 220pt 1fr; align-items: center; border-bottom: 1pt solid #E7DDC8; padding: 8pt 0; }
  .pin { color: #B45309; font-weight: 700; }
  .han { font-size: 18pt; font-weight: 800; color: #0F172A; }
  .vi { color: #334155; }
  .flow-row { display: grid; grid-template-columns: 64pt 120pt 1fr; gap: 12pt; padding: 7pt 0; border-bottom: 1pt solid #E7DDC8; }
  .time { color: #B45309; font-weight: 800; }
  .stage { font-weight: 800; color: #172554; }
  .detail { font-size: 11.5pt; color: #334155; line-height: 1.32; }
  .note { position: absolute; right: 0; bottom: 34pt; width: 330pt; background: #FEF3C7; border: 1pt solid #F59E0B; border-radius: 10pt; padding: 10pt 12pt; }
  .note p { font-size: 10.5pt; color: #78350F; line-height: 1.35; }
</style>
</head>
<body>
  <div class="page">
    <div class="mast"><p>Hệ thống học liệu AI · Huashu Design · Bản dành cho giảng viên</p></div>
    <div class="kicker"><p>${esc(kicker)}</p></div>
    <h1>${esc(title)}</h1>
    <div class="content">${body}</div>
    ${notes ? `<div class="note"><p><b>Ghi chú giảng viên:</b> ${esc(notes)}</p></div>` : ''}
    <div class="footer"><p>${esc(lesson.lessonTitle)} · ${esc(lesson.level)} · ${esc(lesson.durationMinutes)} min</p></div>
  </div>
</body>
</html>`;
}

const slides = [
  ['01-cover.html', 'Trang bìa', slide(lesson.lessonTitle, 'Bộ slide bài học', `<div class="two"><div class="card"><p><span class="badge">${esc(lesson.level)}</span></p><br><p>Thời lượng: ${esc(lesson.durationMinutes)} phút</p><p>Đối tượng: ${esc(lesson.audience)}</p></div><div class="card"><p>${esc(lesson.languagePolicy)}</p><br><p>Bộ slide này được tạo bằng quy trình Huashu Design.</p></div></div>`, 'Bắt đầu bằng một câu hỏi cá nhân ngắn trước khi vào mục tiêu.')],
  ['02-objectives.html', 'Mục tiêu', slide('Sau bài học, sinh viên có thể làm gì?', '学习目标 · Mục tiêu học tập', `<div class="card"><ul>${list(lesson.learningObjectives)}</ul></div>`, 'Trình bày mục tiêu như năng lực thực hành, không đọc như giải thích ngữ pháp.')],
  ['03-vocabulary.html', 'Từ mới', slide('Ngôn ngữ trọng tâm hôm nay', '生词 · Từ mới', `<div class="card">${vocabRows}</div>`, 'Luyện pinyin trước, sau đó nghĩa tiếng Việt, rồi thay thế nhanh trong mẫu câu.')],
  ['04-pattern.html', 'Mẫu câu', slide('Mẫu câu trọng tâm: 我要 + món', '句型 · Mẫu câu', `<div class="two"><div class="card"><h2 style="font-size:24pt;color:#172554;margin-bottom:10pt;">我要 + 菜名</h2><p>我要一碗牛肉面。</p><p>我要一杯茶。</p><p>不要辣，谢谢。</p></div><div class="card"><h2 style="font-size:24pt;color:#172554;margin-bottom:10pt;">Gợi ý tiếng Việt</h2><p>Dùng gần như “cho tôi / tôi muốn”. Khi gọi món, nói ngắn gọn và tự nhiên.</p></div></div>`, 'Không giải thích ngữ pháp quá nhiều; ưu tiên cho sinh viên nói sớm.')],
  ['05-flow.html', 'Tiến trình', slide('Kịch bản dạy 45 phút', '课堂流程 · Tiến trình lớp học', `<div class="card">${flowRows}</div>`, 'Dùng slide này như bảng điều khiển của giảng viên trong giờ học.')],
  ['06-practice.html', 'Luyện tập', slide('Kịch bản đóng vai theo cặp', '课堂活动 · Hoạt động', `<div class="two"><div class="card"><h2 style="font-size:22pt;color:#172554;margin-bottom:10pt;">Khách</h2><p>你好，我要点菜。</p><p>我要＿＿＿。</p><p>不要辣，谢谢。</p><p>买单，谢谢。</p></div><div class="card"><h2 style="font-size:22pt;color:#172554;margin-bottom:10pt;">Nhân viên</h2><p>您好，几位？</p><p>好的，还要什么？</p><p>可以，请稍等。</p><p>一共＿＿＿元。</p></div></div>`, 'Cho sinh viên đổi vai sau một lượt luyện tập.')],
  ['07-assessment.html', 'Kiểm tra', slide('Kiểm tra cuối giờ và bài về nhà', '课堂检查 · Kiểm tra', `<div class="two"><div class="card"><h2 style="font-size:22pt;color:#172554;margin-bottom:10pt;">Kiểm tra</h2><ul>${list(lesson.assessment)}</ul></div><div class="card"><h2 style="font-size:22pt;color:#172554;margin-bottom:10pt;">Bài về nhà</h2><p>${esc(lesson.homework)}</p></div></div>`, 'Thu một tin nhắn thoại của mỗi sinh viên trước buổi học sau.')]
];

for (const [file, , html] of slides) {
  await fs.writeFile(path.join(slidesDir, file), html, 'utf8');
}

const manifest = slides.map(([file, label]) => `    { file: "slides/${file}", label: "${label}" }`).join(',\n');
const index = `<!DOCTYPE html>
<html lang="zh-Hans">
<head>
<meta charset="UTF-8">
<title>${esc(lesson.lessonTitle)} · Bộ slide giảng viên</title>
<script>
window.DECK_MANIFEST = [
${manifest}
];
window.DECK_WIDTH = 1280;
window.DECK_HEIGHT = 720;
</script>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; background: #0B1020; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
#stage { position: fixed; top: 0; left: 0; transform-origin: top left; width: 1280px; height: 720px; background: white; box-shadow: 0 10px 60px rgba(0,0,0,0.45); }
iframe { width: 100%; height: 100%; border: 0; display: block; background: white; }
.counter { position: fixed; bottom: 18px; right: 18px; background: rgba(0,0,0,0.72); color: white; border-radius: 999px; padding: 7px 13px; font-size: 13px; z-index: 10; }
.nav { position: fixed; top: 0; bottom: 0; width: 18%; z-index: 8; cursor: pointer; }
.nav.left { left: 0; } .nav.right { right: 0; }
</style>
</head>
<body>
<div id="stage"><iframe id="frame" src="about:blank"></iframe></div>
<div class="nav left" id="prev"></div><div class="nav right" id="next"></div><div class="counter" id="counter"></div>
<script>
(() => {
  const W = window.DECK_WIDTH, H = window.DECK_HEIGHT, deck = window.DECK_MANIFEST;
  const stage = document.getElementById('stage'), frame = document.getElementById('frame'), counter = document.getElementById('counter');
  let current = Math.max(0, Math.min(deck.length - 1, Number(location.hash.slice(1) || 1) - 1));
  function fit(){ const s = Math.min(innerWidth/W, innerHeight/H); stage.style.transform = 'translate(' + ((innerWidth-W*s)/2) + 'px,' + ((innerHeight-H*s)/2) + 'px) scale(' + s + ')'; }
  function show(i){ if(i<0||i>=deck.length) return; current=i; frame.src=deck[i].file; counter.textContent=(i+1)+' / '+deck.length+' · '+deck[i].label; history.replaceState(null,'','#'+(i+1)); }
  addEventListener('resize', fit); addEventListener('keydown', e => { if(['ArrowRight',' ','PageDown'].includes(e.key)) show(current+1); if(['ArrowLeft','PageUp'].includes(e.key)) show(current-1); if(e.key==='Home') show(0); if(e.key==='End') show(deck.length-1); });
  document.getElementById('prev').onclick = () => show(current-1); document.getElementById('next').onclick = () => show(current+1);
  fit(); show(current);
})();
</script>
</body>
</html>`;
await fs.writeFile(path.join(outDir, 'index.html'), index, 'utf8');

const teacherGuide = `# ${lesson.lessonTitle} · Hướng dẫn giảng viên\n\nĐược tạo bằng Hệ thống học liệu AI cục bộ, sử dụng **huashu-design** cho quy trình thiết kế và xuất slide.\n\n## Tệp đầu ra\n- Bản xem trên trình duyệt: \`index.html\`\n- Slide nguồn có thể chỉnh sửa: \`slides/*.html\`\n- Có thể tạo PDF/PPTX bằng các lệnh npm.\n\n## Tiến trình giảng dạy\n${lesson.lessonFlow.map(x => `- **${x.minutes} · ${x.stage}**: ${x.teacher}`).join('\n')}\n\n## Bài về nhà\n${lesson.homework}\n`;
await fs.writeFile(path.join(outDir, 'TEACHER_GUIDE.md'), teacherGuide, 'utf8');
console.log(`Created ${outDir}`);
