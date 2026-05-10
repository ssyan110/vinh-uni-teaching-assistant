#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const root = process.cwd();
const slug = 'pinyin-l1-design-prototype';
const outDir = path.join(root, 'output', slug);
const slidesDir = path.join(outDir, 'slides');
await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(slidesDir, { recursive: true });

const esc = (s = '') => String(s).replace(/[&<>\"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' }[c]));

const palette = {
  sky: '#D9F4FF',
  mint: '#DDF7EE',
  cream: '#FFF5D9',
  ink: '#202124',
  blue: '#2D7FF9',
  coral: '#FF7A59',
  green: '#2EB67D',
  purple: '#8D7AE6',
  yellow: '#FFD166',
  pink: '#F06595',
  paper: '#FFFDF4',
};

const css = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  width: 960pt;
  height: 540pt;
  overflow: hidden;
  color: ${palette.ink};
  font-family: "Nunito", "Avenir Next", "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif;
  background: ${palette.sky};
  position: relative;
}
.page { position: absolute; inset: 0; overflow: hidden; }
.bg-card { position: absolute; inset: 28pt; border-radius: 34pt; background: ${palette.paper}; border: 2.4pt solid ${palette.ink}; }
.soft-blob { position: absolute; border-radius: 999pt; border: 2pt solid ${palette.ink}; opacity: .98; }
.blob-a { width: 230pt; height: 120pt; left: -58pt; top: 50pt; background: ${palette.mint}; transform: rotate(-10deg); }
.blob-b { width: 260pt; height: 126pt; right: -70pt; bottom: 44pt; background: ${palette.cream}; transform: rotate(9deg); }
.blob-c { width: 120pt; height: 72pt; right: 112pt; top: 28pt; background: ${palette.yellow}; transform: rotate(-7deg); }
.wrap { position: absolute; inset: 48pt 58pt 40pt 58pt; }
.kicker { display: inline-block; padding: 5pt 11pt; border-radius: 999pt; border: 1.8pt solid ${palette.ink}; background: ${palette.cream}; }
.kicker p { font-size: 10.4pt; font-weight: 900; letter-spacing: .08em; color: ${palette.ink}; }
h1 { font-size: 42pt; line-height: 1.04; font-weight: 950; letter-spacing: -.02em; color: ${palette.ink}; margin-top: 12pt; }
h2 { font-size: 29pt; line-height: 1.08; font-weight: 950; color: ${palette.ink}; }
p { font-size: 14pt; line-height: 1.35; color: #3b3d3f; }
.small { font-size: 10.4pt; color: #62666a; line-height: 1.35; }
.big-pinyin { font-size: 86pt; line-height: .9; font-weight: 950; letter-spacing: .01em; color: ${palette.ink}; }
.big-cn { font-size: 64pt; line-height: 1; font-weight: 900; color: ${palette.ink}; font-family: "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif; }
.sticker { display: inline-block; padding: 7pt 13pt; border-radius: 16pt; border: 2pt solid ${palette.ink}; transform: rotate(-2deg); }
.sticker p { font-size: 15pt; font-weight: 900; color: ${palette.ink}; }
.row { display: flex; gap: 13pt; align-items: stretch; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18pt; }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14pt; }
.card { border: 2pt solid ${palette.ink}; border-radius: 22pt; background: white; padding: 15pt; }
.card-flat { border: 2pt solid ${palette.ink}; border-radius: 22pt; background: white; padding: 14pt; }
.caption { display: inline-block; padding: 3pt 8pt; border-radius: 999pt; background: ${palette.mint}; border: 1.5pt solid ${palette.ink}; margin-bottom: 8pt; }
.caption p { font-size: 9.2pt; font-weight: 900; color: ${palette.ink}; letter-spacing: .07em; }
.connector { position: absolute; height: 3pt; background: ${palette.ink}; border-radius: 99pt; transform-origin: left center; }
.dot { position: absolute; width: 12pt; height: 12pt; border-radius: 99pt; background: ${palette.pink}; border: 2pt solid ${palette.ink}; }
.tone { min-height: 118pt; text-align: center; }
.tone .num { font-size: 10pt; font-weight: 900; color: ${palette.ink}; }
.tone .sample { font-size: 38pt; font-weight: 950; color: ${palette.ink}; margin-top: 5pt; }
.tone .shape { font-size: 17pt; font-weight: 900; color: ${palette.blue}; margin-top: 4pt; }
.sound-pill { min-width: 70pt; height: 48pt; border: 2pt solid ${palette.ink}; border-radius: 18pt; display: flex; align-items: center; justify-content: center; background: white; }
.sound-pill p { font-size: 22pt; font-weight: 950; color: ${palette.ink}; }
.note-card { border: 2pt dashed ${palette.ink}; border-radius: 20pt; background: ${palette.cream}; padding: 13pt; }
.footer { position: absolute; left: 58pt; right: 58pt; bottom: 18pt; display: flex; justify-content: space-between; align-items: center; }
.footer p { font-size: 8.8pt; font-weight: 800; color: #596066; }
.doodle-pencil { position: absolute; width: 116pt; height: 18pt; border: 2pt solid ${palette.ink}; background: ${palette.yellow}; transform: rotate(-16deg); border-radius: 6pt; }
.doodle-pencil div { position: absolute; right: -18pt; top: -2pt; width: 0; height: 0; border-top: 10pt solid transparent; border-bottom: 10pt solid transparent; border-left: 18pt solid ${palette.coral}; }
.flash { position: absolute; width: 84pt; height: 54pt; background: white; border: 2pt solid ${palette.ink}; border-radius: 14pt; transform: rotate(8deg); }
.flash p { text-align: center; margin-top: 13pt; font-size: 20pt; font-weight: 950; color: ${palette.purple}; }
`;

function slide(title, kicker, body, opts = {}) {
  const bg = opts.bg || palette.sky;
  return `<!doctype html><html lang="zh-Hans"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${css}\nbody{background:${bg};}</style></head><body>
  <div class="page">
    <div class="soft-blob blob-a"></div><div class="soft-blob blob-b"></div><div class="soft-blob blob-c"></div>
    <div class="bg-card"></div>
    ${opts.decoration || ''}
    <div class="wrap">
      <div class="kicker"><p>${esc(kicker)}</p></div>
      ${opts.rawTitle ? title : `<h1>${esc(title)}</h1>`}
      ${body}
    </div>
    
  </div>
</body></html>`;
}

const slides = [
  ['01-cover.html', 'Trang bìa', slide('', 'PINYIN LESSON 1', `
    <div style="position:absolute;left:0;top:70pt;width:440pt;">
      <h1 style="font-size:58pt;">Pinyin<br><span style="color:${palette.blue};">Lesson 1</span></h1>
      <div class="sticker" style="margin-top:16pt;background:${palette.mint};"><p>你好 · nǐ hǎo</p></div>
      <p style="margin-top:18pt;width:330pt;font-size:16pt;font-weight:800;">Nhìn âm — nghe thanh — đọc đúng từ buổi đầu tiên.</p>
    </div>
    <div class="card" style="position:absolute;right:6pt;top:62pt;width:310pt;height:260pt;background:${palette.cream};">
      <div class="caption"><p>BÀI HỌC HÔM NAY</p></div>
      <p class="big-cn" style="margin-top:8pt;">你好</p>
      <p class="big-pinyin" style="font-size:46pt;color:${palette.purple};margin-top:5pt;">nǐ hǎo</p>
      <p style="font-size:16pt;font-weight:900;margin-top:10pt;">Xin chào</p>
    </div>`, { rawTitle: true, bg: palette.mint, decoration: '<div class="doodle-pencil" style="right:95pt;top:64pt;"><div></div></div><div class="flash" style="left:92pt;bottom:82pt;"><p>b p m</p></div>' })],
  ['02-map.html', 'Lộ trình', slide('Mục tiêu bài học', '学习目标 · MỤC TIÊU', `
    <div class="grid-3" style="margin-top:28pt;">
      <div class="card" style="background:${palette.sky};"><div class="caption"><p>01</p></div><h2>Nghe âm</h2><p>Phân biệt thanh mẫu, vận mẫu và thanh điệu trong các âm tiết cơ bản.</p></div>
      <div class="card" style="background:${palette.mint};"><div class="caption"><p>02</p></div><h2>Đọc đúng</h2><p>Đọc được <b>你好</b>, số 1/5/8 và một số chữ Hán đầu tiên.</p></div>
      <div class="card" style="background:${palette.cream};"><div class="caption"><p>03</p></div><h2>Luyện nhanh</h2><p>Ghép âm, đọc cặp tối thiểu và tự kiểm tra cuối giờ.</p></div>
    </div>
    <div class="note-card" style="position:absolute;left:0;right:0;bottom:34pt;"><p><b>课堂问题:</b> Khi nghe “nǐ hǎo”, em nhận ra mấy âm tiết và mấy thanh điệu?</p></div>`, { bg: palette.sky })],
  ['03-concept.html', 'Khái niệm', slide('Một âm tiết pinyin có gì?', '拼音结构 · CẤU TRÚC', `
    <div style="position:absolute;left:248pt;top:146pt;text-align:center;width:340pt;">
      <p class="big-pinyin"><span style="color:${palette.blue};">n</span><span style="color:${palette.coral};">i</span><span style="color:${palette.green};">̌</span></p>
      <p style="font-size:18pt;font-weight:900;">nǐ · 你</p>
    </div>
    <div class="connector" style="left:188pt;top:220pt;width:95pt;transform:rotate(-10deg);"></div>
    <div class="connector" style="left:528pt;top:220pt;width:115pt;transform:rotate(10deg);"></div>
    <div class="connector" style="left:398pt;top:132pt;width:95pt;transform:rotate(-75deg);"></div>
    <div class="card" style="position:absolute;left:0;top:128pt;width:200pt;background:${palette.sky};"><div class="caption"><p>THANH MẪU</p></div><h2>n</h2><p>Âm mở đầu của âm tiết.</p></div>
    <div class="card" style="position:absolute;right:0;top:128pt;width:210pt;background:${palette.cream};"><div class="caption"><p>VẬN MẪU</p></div><h2>i</h2><p>Phần vần, tạo âm chính.</p></div>
    <div class="card" style="position:absolute;left:290pt;bottom:14pt;width:250pt;background:${palette.mint};"><div class="caption"><p>THANH ĐIỆU</p></div><h2>ˇ</h2><p>Dấu thanh cho biết đường cao độ.</p></div>`, { bg: '#F6EDFF' })],
  ['04-tones.html', 'Thanh điệu', slide('Nhìn đường đi của thanh điệu', '声调 · THANH ĐIỆU', `
    <div class="grid-3" style="grid-template-columns: repeat(4, 1fr); margin-top:28pt;">
      <div class="card-flat tone" style="background:${palette.sky};"><p class="num">Thanh 1</p><p class="sample">bā</p><p class="shape">55 ─</p><p class="small">cao và bằng</p></div>
      <div class="card-flat tone" style="background:${palette.mint};"><p class="num">Thanh 2</p><p class="sample">bá</p><p class="shape">35 ↗</p><p class="small">đi lên</p></div>
      <div class="card-flat tone" style="background:${palette.cream};"><p class="num">Thanh 3</p><p class="sample">bǎ</p><p class="shape">214 ˅</p><p class="small">hạ rồi nhấc lên</p></div>
      <div class="card-flat tone" style="background:#FFE3EE;"><p class="num">Thanh 4</p><p class="sample">bà</p><p class="shape">51 ↘</p><p class="small">đi xuống</p></div>
    </div>
    <div class="card" style="margin-top:26pt;background:white;"><p><b>变调:</b> 两个第三声音节连读时，前一个读成第二声。Ví dụ: <b>nǐ hǎo → ní hǎo</b>.</p></div>`, { bg: palette.cream })],
  ['05-practice.html', 'Luyện tập', slide('Bảng luyện âm nhanh', '练习 · LUYỆN TẬP', `
    <div class="grid-2" style="margin-top:24pt;grid-template-columns:1.15fr .85fr;">
      <div class="card" style="background:${palette.mint};">
        <div class="caption"><p>CẶP ÂM DỄ NHẦM</p></div>
        <div class="row" style="flex-wrap:wrap;margin-top:12pt;">
          ${['bā','pā','dā','tā','gā','kā','bù','pù','dù','tù','gǔ','kǔ'].map(x => `<div class="sound-pill"><p>${x}</p></div>`).join('')}
        </div>
      </div>
      <div class="card" style="background:${palette.yellow};">
        <div class="caption"><p>MINI GAME</p></div>
        <h2>Nghe và giơ thẻ</h2>
        <p style="margin-top:10pt;">Giảng viên đọc một âm tiết. Nhóm chọn thẻ đúng: thanh mẫu, vận mẫu, thanh điệu.</p>
        <p style="margin-top:14pt;font-weight:900;color:${palette.purple};">b / p · d / t · g / k</p>
      </div>
    </div>`, { bg: palette.sky, decoration: '<div class="flash" style="right:84pt;top:88pt;background:#FFE3EE;"><p>声调</p></div>' })],
];

for (const [file, , html] of slides) await fs.writeFile(path.join(slidesDir, file), html, 'utf8');

const manifest = slides.map(([file, label]) => `    { file: "slides/${file}", label: "${label}" }`).join(',\n');
const index = `<!doctype html><html lang="zh-Hans"><head><meta charset="utf-8"><title>Pinyin Lesson 1 · Design Prototype</title>
<script>window.DECK_MANIFEST=[\n${manifest}\n];window.DECK_WIDTH=1280;window.DECK_HEIGHT=720;</script>
<style>*{box-sizing:border-box;margin:0;padding:0}html,body{height:100%;background:#202124;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,sans-serif}#stage{position:fixed;top:0;left:0;transform-origin:top left;width:1280px;height:720px;background:#D9F4FF;box-shadow:0 10px 70px rgba(0,0,0,.45)}iframe{width:100%;height:100%;border:0;background:#D9F4FF}.counter{position:fixed;right:18px;bottom:18px;background:rgba(0,0,0,.78);color:white;border-radius:999px;padding:7px 13px;font-size:13px;z-index:10}.nav{position:fixed;top:0;bottom:0;width:18%;z-index:8;cursor:pointer}.nav.left{left:0}.nav.right{right:0}</style></head>
<body><div id="stage"><iframe id="frame" src="about:blank"></iframe></div><div class="nav left" id="prev"></div><div class="nav right" id="next"></div><div class="counter" id="counter"></div>
<script>(()=>{const W=window.DECK_WIDTH,H=window.DECK_HEIGHT,deck=window.DECK_MANIFEST,stage=document.getElementById('stage'),frame=document.getElementById('frame'),counter=document.getElementById('counter');let current=Math.max(0,Math.min(deck.length-1,Number(location.hash.slice(1)||1)-1));function fit(){const s=Math.min(innerWidth/W,innerHeight/H);stage.style.transform='translate('+((innerWidth-W*s)/2)+'px,'+((innerHeight-H*s)/2)+'px) scale('+s+')'}function show(i){if(i<0||i>=deck.length)return;current=i;frame.src=deck[i].file;counter.textContent=(i+1)+' / '+deck.length+' · '+deck[i].label;history.replaceState(null,'','#'+(i+1))}addEventListener('resize',fit);addEventListener('keydown',e=>{if(['ArrowRight',' ','PageDown'].includes(e.key))show(current+1);if(['ArrowLeft','PageUp'].includes(e.key))show(current-1);if(e.key==='Home')show(0);if(e.key==='End')show(deck.length-1)});document.getElementById('prev').onclick=()=>show(current-1);document.getElementById('next').onclick=()=>show(current+1);fit();show(current)})();</script></body></html>`;
await fs.writeFile(path.join(outDir, 'index.html'), index, 'utf8');
await fs.writeFile(path.join(outDir, 'README.md'), `# Pinyin Lesson 1 · Design Prototype\n\n5-slide copyright-safe prototype inspired by the attached pinyin reference PDF, but using original CSS shapes, palette, and composition.\n\nClassroom slides only: no teacher prep/source/tool text.\n`, 'utf8');
console.log(`Created ${outDir} with ${slides.length} slides`);
