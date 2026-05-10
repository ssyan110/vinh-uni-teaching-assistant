#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const root = process.cwd();
const slug = 'lesson-1-kami-prototype';
const outDir = path.join(root, 'output', slug);
const slidesDir = path.join(outDir, 'slides');
await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(slidesDir, { recursive: true });

const esc = (s='') => String(s).replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));

const theme = {
  lesson: '第一课 · 你好',
  vi: 'Bài 1 · Xin chào',
  footer: 'Giáo trình Hán ngữ 1 · Bài 1 bản mẫu · Kami × Huashu',
};

function baseSlide(title, kicker, body, opts = {}) {
  const titleHtml = opts.rawTitle ? title : esc(title);
  return `<!DOCTYPE html>
<html lang="zh-Hans">
<head>
<meta charset="UTF-8">
<title>${esc(kicker)} · ${esc(title.replace(/<[^>]+>/g,''))}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { width: 960pt; height: 540pt; overflow: hidden; background: #f5f4ed; color: #141413; font-family: Charter, Georgia, "Songti SC", "Noto Serif CJK SC", "PingFang SC", serif; position: relative; }
  .page { position: absolute; inset: 42pt 54pt 34pt 54pt; }
  .paper-ring { position: absolute; inset: 22pt; border: 1.2pt solid #e5e3d8; pointer-events: none; }
  .topline { position: absolute; top: 0; left: 0; right: 0; display: flex; justify-content: space-between; align-items: center; padding-bottom: 12pt; border-bottom: 1pt solid #e5e3d8; }
  .eyebrow { font-size: 9.2pt; letter-spacing: 0.15em; text-transform: uppercase; color: #504e49; font-weight: 500; }
  .seal { color: #1B365D; padding: 4pt 0; font-size: 9pt; letter-spacing: 0.12em; }
  .seal p { color: #1B365D; }
  h1 { position: absolute; top: 56pt; left: 0; right: 0; font-size: 34pt; line-height: 1.08; font-weight: 500; letter-spacing: -0.02em; color: #141413; }
  h1 .blue, .blue { color: #1B365D; }
  .content { position: absolute; top: 126pt; left: 0; right: 0; bottom: 36pt; }
  p, li { font-size: 14.5pt; line-height: 1.38; color: #3d3d3a; font-weight: 400; }
  .small { font-size: 10.2pt; color: #504e49; line-height: 1.42; }
  .muted { color: #504e49; }
  .footer { position: absolute; bottom: 0; left: 0; right: 0; padding-top: 8pt; border-top: 1pt solid #d8d4c7; display: flex; justify-content: space-between; }
  .footer p { font-size: 8.5pt; color: #504e49; }
  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 22pt; }
  .three { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14pt; }
  .card { background: #faf9f5; border: 1.1pt solid #e8e6dc; padding: 14pt; }
  .ink-card { background: #1B365D; border: 1.1pt solid #1B365D; padding: 18pt; color: #faf9f5; }
  .ink-card p, .ink-card li { color: #faf9f5; }
  .label { display: inline-block; font-size: 9.5pt; letter-spacing: .12em; text-transform: uppercase; color: #1B365D; margin-bottom: 9pt; font-weight: 500; }
  .big-hanzi { font-size: 84pt; line-height: .9; color: #1B365D; font-weight: 500; letter-spacing: .04em; }
  .pinyin { font-size: 19pt; color: #504e49; margin-top: 8pt; }
  .vi { font-size: 14pt; color: #504e49; margin-top: 10pt; }
  .dialogue { display: grid; grid-template-columns: 60pt 1fr; gap: 12pt; align-items: start; padding: 10pt 0; border-bottom: 1pt solid #e8e6dc; }
  .speaker { color: #1B365D; font-size: 11pt; letter-spacing: .1em; text-transform: uppercase; }
  .line-cn { font-size: 26pt; color: #141413; line-height: 1.15; }
  .line-py { font-size: 13pt; color: #6b6a64; margin-top: 3pt; }
  .line-vi { font-size: 13pt; color: #504e49; margin-top: 3pt; }
  .vocab { display: grid; grid-template-columns: 42pt 76pt 1fr; align-items: baseline; gap: 10pt; padding: 5pt 0; border-bottom: 1pt solid #e8e6dc; }
  .vocab .han { font-size: 21pt; color: #1B365D; }
  .vocab .pin { font-size: 12pt; color: #6b6a64; }
  .vocab .meaning { font-size: 12.2pt; color: #3d3d3a; }
  .tone-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12pt; }
  .tone { background: #faf9f5; border: 1pt solid #e8e6dc; padding: 14pt; min-height: 118pt; }
  .tone .num { font-size: 10pt; color: #1B365D; letter-spacing: .14em; text-transform: uppercase; }
  .tone .sample { font-size: 34pt; color: #141413; margin: 8pt 0 3pt; }
  .tone .shape { font-family: "JetBrains Mono", monospace; font-size: 17pt; color: #1B365D; }
  .route { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10pt; align-items: stretch; }
  .step { border-left: 2pt solid #1B365D; background: #faf9f5; padding: 12pt 10pt; }
  .step b { display: block; color: #1B365D; font-size: 11pt; margin-bottom: 5pt; }
  .step p { font-size: 12.3pt; line-height: 1.32; }
  .practice { display: grid; grid-template-columns: 1.15fr .85fr; gap: 20pt; }
  .sound-row { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8pt; margin-top: 10pt; }
  .pill { border: 1pt solid #e8e6dc; background: #faf9f5; text-align: center; padding: 7pt 4pt; }
  .pill p { color: #1B365D; font-size: 16pt; }
</style>
</head>
<body>
  <div class="paper-ring"></div>
  <div class="page">
    <div class="topline"><p class="eyebrow">${esc(kicker)}</p><div class="seal"><p>BẢN MẪU KAMI</p></div></div>
    <h1>${titleHtml}</h1>
    <div class="content">${body}</div>
    <div class="footer"><p>${esc(theme.footer)}</p><p>${esc(theme.lesson)}</p></div>
  </div>
</body>
</html>`;
}

const slides = [
  ['01-cover.html', 'Trang bìa', baseSlide('<span class="blue">你好</span><br>Bài 1 · bản mẫu', '第一课 · Bài 1', `
    <div class="two">
      <div class="card">
        <p class="label">Nguồn giáo trình · 教材来源</p>
        <p class="big-hanzi">你好</p>
        <p class="pinyin">Nǐ hǎo</p>
        <p class="vi">Xin chào / Chào bạn</p>
      </div>
      <div class="ink-card">
        <p class="label" style="color:#faf9f5;">Định hướng thiết kế · 设计方向</p>
        <p style="font-size:20pt;line-height:1.3;">Nền giấy ấm, điểm nhấn xanh mực, kiểu chữ có chân, bố cục phù hợp giảng dạy đại học.</p>
        <p class="small" style="color:#e8e6dc;margin-top:18pt;">Chỉ dựng bản mẫu Bài 1 để duyệt phong cách trước khi tạo toàn bộ bài học.</p>
      </div>
    </div>`, { rawTitle: true })],
  ['02-lesson-map.html', 'Lộ trình', baseSlide('Lộ trình buổi học đầu tiên', '学习路线 · Lộ trình học', `
    <div class="route">
      <div class="step"><b>01 Chào hỏi</b><p>你好<br>Nǐ hǎo<br>Chào bạn</p></div>
      <div class="step"><b>02 Từ mới</b><p>你、好、一、五、八、大、不、口、白、女、马</p></div>
      <div class="step"><b>03 Thanh mẫu</b><p>b p m f<br>d t n l<br>g k h</p></div>
      <div class="step"><b>04 Vận mẫu</b><p>a o e i u ü<br>ai ei ao ou</p></div>
      <div class="step"><b>05 Luyện tập</b><p>Thanh điệu<br>Biến điệu<br>Đọc chữ<br>Tập viết</p></div>
    </div>
    <p class="small" style="margin-top:22pt;">Gợi ý cho giảng viên: dùng slide này như lộ trình trực quan thay cho mục lục dày chữ.</p>`)],
  ['03-dialogue.html', 'Bài đọc', baseSlide('Mẫu hội thoại: bắt đầu bằng lời chào', '课文 · Bài đọc', `
    <div class="two">
      <div class="card">
        <p class="label">Mẫu hội thoại · 对话示范</p>
        <div class="dialogue"><p class="speaker">A</p><div><p class="line-cn">你好！</p><p class="line-py">Nǐ hǎo!</p><p class="line-vi">Chào bạn!</p></div></div>
        <div class="dialogue"><p class="speaker">B</p><div><p class="line-cn">你好！</p><p class="line-py">Nǐ hǎo!</p><p class="line-vi">Chào bạn!</p></div></div>
      </div>
      <div class="card">
        <p class="label">Gợi ý giảng viên · 教师提示</p>
        <p>Dùng như hoạt động khởi động ngắn: giảng viên đọc mẫu, sinh viên lặp lại rồi chào hai bạn bên cạnh.</p>
        <p style="font-size:26pt;color:#1B365D;margin-top:16pt;">nǐ hǎo → ní hǎo</p>
        <p class="small" style="margin-top:14pt;">Chỉ giải thích biến điệu thanh 3 sau khi sinh viên đã nghe và lặp lại được nhịp chào.</p>
      </div>
    </div>`)],
  ['04-vocabulary.html', 'Từ mới', baseSlide('Ít từ mới, luyện lặp lại nhiều lần', '生词 · Từ mới', `
    <div class="two">
      <div class="card">
        <p class="label">Từ cốt lõi · 核心词</p>
        ${[
          ['你','nǐ','bạn / anh / chị / ông / bà'],
          ['好','hǎo','tốt; ổn; hay'],
          ['不','bù','không'],
          ['大','dà','to; lớn'],
          ['白','bái','trắng'],
        ].map(v=>`<div class="vocab"><p class="han">${v[0]}</p><p class="pin">${v[1]}</p><p class="meaning">${v[2]}</p></div>`).join('')}
      </div>
      <div class="card">
        <p class="label">Số và danh từ · 数字与名词</p>
        ${[
          ['一','yī','một'],
          ['五','wǔ','năm'],
          ['八','bā','tám'],
          ['口','kǒu','miệng; nhân khẩu'],
          ['女','nǚ','nữ; phụ nữ'],
          ['马','mǎ','con ngựa'],
        ].map(v=>`<div class="vocab"><p class="han">${v[0]}</p><p class="pin">${v[1]}</p><p class="meaning">${v[2]}</p></div>`).join('')}
      </div>
    </div>`)],
  ['05-tones.html', 'Ngữ âm', baseSlide('Cho sinh viên nhìn thấy thanh điệu trước khi giải thích', '语音 · Ngữ âm', `
    <div class="tone-grid">
      <div class="tone"><p class="num">Thanh 1</p><p class="sample">bā</p><p class="shape">55  ─</p><p class="small">cao và bằng</p></div>
      <div class="tone"><p class="num">Thanh 2</p><p class="sample">bá</p><p class="shape">35  ↗</p><p class="small">đi lên</p></div>
      <div class="tone"><p class="num">Thanh 3</p><p class="sample">bǎ</p><p class="shape">214 ˅</p><p class="small">hạ thấp rồi nhấc lên</p></div>
      <div class="tone"><p class="num">Thanh 4</p><p class="sample">bà</p><p class="shape">51  ↘</p><p class="small">đi xuống</p></div>
    </div>
    <div class="card" style="margin-top:18pt;"><p><span class="blue">Biến điệu:</span> 两个第三声音节连读时，前一个读成第二声。Ví dụ: nǐ hǎo → ní hǎo.</p><p class="vi">Khi hai âm tiết thanh 3 đi liền nhau, âm tiết thứ nhất đọc gần như thanh 2.</p></div>`)],
  ['06-practice.html', 'Luyện tập', baseSlide('Bảng luyện âm trong lớp', '练习 · Bài tập', `
    <div class="practice">
      <div class="card">
        <p class="label">Phân biệt phát âm · 语音辨析</p>
        <p class="small">Đọc theo hàng ngang; phân biệt b/p, d/t và g/k.</p>
        <div class="sound-row">${['ba','pa','da','ta','ga','ka'].map(x=>`<div class="pill"><p>${x}</p></div>`).join('')}</div>
        <div class="sound-row">${['bu','pu','du','tu','gu','ku'].map(x=>`<div class="pill"><p>${x}</p></div>`).join('')}</div>
        <div class="sound-row">${['bai','pai','dai','tai','gai','kai'].map(x=>`<div class="pill"><p>${x}</p></div>`).join('')}</div>
      </div>
      <div class="ink-card">
        <p class="label" style="color:#faf9f5;">Kiểm tra cuối giờ · 课堂检查</p>
        <ul style="padding-left:18pt;">
          <li>□ Đọc 你好 đúng biến điệu thanh 3.</li>
          <li>□ Nhận biết 你、好、不、一、五、八.</li>
          <li>□ Phân biệt b/p, d/t, g/k.</li>
        </ul>
      </div>
    </div>`)]
];

for (const [file, , html] of slides) await fs.writeFile(path.join(slidesDir, file), html, 'utf8');

const manifest = slides.map(([file, label]) => `    { file: "slides/${file}", label: "${label}" }`).join(',\n');
const index = `<!DOCTYPE html>
<html lang="zh-Hans"><head><meta charset="UTF-8"><title>Bài 1 · Bản mẫu Kami</title>
<script>window.DECK_MANIFEST=[\n${manifest}\n];window.DECK_WIDTH=1280;window.DECK_HEIGHT=720;</script>
<style>*{box-sizing:border-box;margin:0;padding:0}html,body{height:100%;background:#141413;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,sans-serif}#stage{position:fixed;top:0;left:0;transform-origin:top left;width:1280px;height:720px;background:#f5f4ed;box-shadow:0 10px 60px rgba(0,0,0,.45)}iframe{width:100%;height:100%;border:0;display:block;background:#f5f4ed}.counter{position:fixed;bottom:18px;right:18px;background:rgba(0,0,0,.72);color:white;border-radius:999px;padding:7px 13px;font-size:13px;z-index:10}.nav{position:fixed;top:0;bottom:0;width:18%;z-index:8;cursor:pointer}.nav.left{left:0}.nav.right{right:0}</style></head>
<body><div id="stage"><iframe id="frame" src="about:blank"></iframe></div><div class="nav left" id="prev"></div><div class="nav right" id="next"></div><div class="counter" id="counter"></div>
<script>(()=>{const W=window.DECK_WIDTH,H=window.DECK_HEIGHT,deck=window.DECK_MANIFEST,stage=document.getElementById('stage'),frame=document.getElementById('frame'),counter=document.getElementById('counter');let current=Math.max(0,Math.min(deck.length-1,Number(location.hash.slice(1)||1)-1));function fit(){const s=Math.min(innerWidth/W,innerHeight/H);stage.style.transform='translate('+((innerWidth-W*s)/2)+'px,'+((innerHeight-H*s)/2)+'px) scale('+s+')'}function show(i){if(i<0||i>=deck.length)return;current=i;frame.src=deck[i].file;counter.textContent=(i+1)+' / '+deck.length+' · '+deck[i].label;history.replaceState(null,'','#'+(i+1))}addEventListener('resize',fit);addEventListener('keydown',e=>{if(['ArrowRight',' ','PageDown'].includes(e.key))show(current+1);if(['ArrowLeft','PageUp'].includes(e.key))show(current-1);if(e.key==='Home')show(0);if(e.key==='End')show(deck.length-1)});document.getElementById('prev').onclick=()=>show(current-1);document.getElementById('next').onclick=()=>show(current+1);fit();show(current)})();</script></body></html>`;
await fs.writeFile(path.join(outDir, 'index.html'), index, 'utf8');

const guide = `# Bài 1 · Bản mẫu Kami · Hướng dẫn giảng viên\n\nNguồn PDF: GT Hán Ngữ 1, Bài 1, trang 19–30.\n\nNguồn phong cách: lấy cảm hứng từ tw93/Kami, triển khai bằng quy trình huashu-design HTML → PDF/PPTX cục bộ.\n\n## Phạm vi bản mẫu\n- Chỉ gồm 6 slide.\n- Thể hiện phong cách Bài 1, nhịp giảng, từ mới, thanh điệu và bảng luyện tập.\n- Chưa phải bộ slide đầy đủ cho toàn bộ bài học.\n\n## Ghi chú phong cách\n- Nền giấy ấm (#f5f4ed).\n- Xanh mực là màu nhấn chính (#1B365D).\n- Ưu tiên chữ serif và bố cục biên tập trang nhã.\n- Không dùng bóng đổ nặng; chỉ dùng đường viền/vòng mảnh.\n\n## Phạm vi nguồn Bài 1\nBài 1 bắt đầu ở trang PDF 19 và Bài 2 bắt đầu ở trang 31, nên bản mẫu này chỉ dùng trang 19–30.\n`;
await fs.writeFile(path.join(outDir, 'TEACHER_GUIDE.md'), guide, 'utf8');
console.log(`Created ${outDir} with ${slides.length} slides`);
