#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const root = process.cwd();
const slug = 'lesson-1-full-kami';
const outDir = path.join(root, 'output', slug);
const slidesDir = path.join(outDir, 'slides');
await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(slidesDir, { recursive: true });

const esc = (s='') => String(s).replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
const theme = {
  lesson: '第一课 · 你好',
  footer: 'Bài 1 · Xin chào',
};

function list(items){ return `<ul>${items.map(x=>`<li>${x}</li>`).join('')}</ul>`; }
function vocab(rows){ return rows.map(v=>`<div class="vocab"><p class="han">${v[0]}</p><p class="pin">${v[1]}</p><p class="meaning">${v[2]}</p></div>`).join(''); }
function chips(rows){ return rows.map(r=>`<div class="sound-row" style="grid-template-columns: repeat(${r.length}, 1fr);">${r.map(x=>`<div class="pill"><p>${x}</p></div>`).join('')}</div>`).join(''); }
function miniCards(rows){ return `<div class="mini-grid">${rows.map(r=>`<div class="mini"><p class="mini-cn">${r[0]}</p><p class="mini-py">${r[1]}</p><p class="small">${r[2]}</p></div>`).join('')}</div>`; }

function baseSlide(title, kicker, body, opts = {}) {
  const titleHtml = opts.rawTitle ? title : esc(title);
  const cls = opts.compact ? ' content compact' : 'content';
  return `<!DOCTYPE html>
<html lang="zh-Hans">
<head>
<meta charset="UTF-8">
<title>${esc(kicker)} · ${esc(String(title).replace(/<[^>]+>/g,''))}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { width: 960pt; height: 540pt; overflow: hidden; background: #f5f4ed; color: #141413; font-family: Charter, Georgia, "Songti SC", "Noto Serif CJK SC", "PingFang SC", serif; position: relative; }
  .paper-ring { position: absolute; inset: 22pt; border: 1.1pt solid #e5e3d8; pointer-events: none; }
  .page { position: absolute; inset: 42pt 54pt 34pt 54pt; }
  .topline { position: absolute; top: 0; left: 0; right: 0; display: flex; justify-content: space-between; align-items: center; padding-bottom: 12pt; border-bottom: 1pt solid #e5e3d8; }
  .eyebrow { font-size: 9.8pt; letter-spacing: 0.14em; text-transform: uppercase; color: #504e49; font-weight: 500; }
  .seal p { color: #1B365D; font-size: 9pt; letter-spacing: 0.12em; }
  h1 { position: absolute; top: 54pt; left: 0; right: 0; font-size: 32pt; line-height: 1.08; font-weight: 500; letter-spacing: -0.02em; color: #141413; }
  h1 .blue, .blue { color: #1B365D; }
  .content { position: absolute; top: 124pt; left: 0; right: 0; bottom: 36pt; }
  .content.compact { top: 112pt; }
  p, li { font-size: 14pt; line-height: 1.34; color: #3d3d3a; font-weight: 400; }
  li { margin: 5pt 0 0 18pt; }
  .small { font-size: 10.4pt; color: #504e49; line-height: 1.38; }
  .footer { position: absolute; bottom: 0; left: 0; right: 0; padding-top: 8pt; border-top: 1pt solid #d8d4c7; display: flex; justify-content: space-between; }
  .footer p { font-size: 9pt; color: #504e49; }
  .label { display: inline-block; font-size: 9.3pt; letter-spacing: .12em; text-transform: uppercase; color: #1B365D; margin-bottom: 8pt; font-weight: 500; }
  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 20pt; }
  .two-wide { display: grid; grid-template-columns: 1.2fr .8fr; gap: 20pt; }
  .three { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12pt; }
  .four { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10pt; }
  .card { background: #faf9f5; border: 1.05pt solid #e8e6dc; padding: 13pt; }
  .ink-card { background: #1B365D; border: 1.05pt solid #1B365D; padding: 16pt; color: #faf9f5; }
  .ink-card p, .ink-card li { color: #faf9f5; }
  .big-hanzi { font-size: 82pt; line-height: .9; color: #1B365D; font-weight: 500; letter-spacing: .03em; }
  .pinyin { font-size: 19pt; color: #504e49; margin-top: 8pt; }
  .vi { font-size: 13.5pt; color: #504e49; margin-top: 8pt; }
  .route { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8pt; align-items: stretch; }
  .step { border-left: 2pt solid #1B365D; background: #faf9f5; padding: 10pt 8pt; }
  .step b { display: block; color: #1B365D; font-size: 10.4pt; margin-bottom: 5pt; }
  .step p { font-size: 11.1pt; line-height: 1.28; }
  .dialogue { display: grid; grid-template-columns: 48pt 1fr; gap: 12pt; align-items: start; padding: 9pt 0; border-bottom: 1pt solid #e8e6dc; }
  .speaker { color: #1B365D; font-size: 12pt; letter-spacing: .1em; text-transform: uppercase; }
  .line-cn { font-size: 28pt; color: #141413; line-height: 1.08; }
  .line-py { font-size: 13pt; color: #6b6a64; margin-top: 3pt; }
  .line-vi { font-size: 13pt; color: #504e49; margin-top: 3pt; }
  .vocab { display: grid; grid-template-columns: 42pt 72pt 1fr; align-items: baseline; gap: 9pt; padding: 5pt 0; border-bottom: 1pt solid #e8e6dc; }
  .vocab .han { font-size: 20pt; color: #1B365D; }
  .vocab .pin { font-size: 11.6pt; color: #6b6a64; }
  .vocab .meaning { font-size: 11.8pt; color: #3d3d3a; }
  .tone-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 11pt; }
  .tone { background: #faf9f5; border: 1pt solid #e8e6dc; padding: 12pt; min-height: 112pt; }
  .tone .num { font-size: 10pt; color: #1B365D; letter-spacing: .12em; text-transform: uppercase; }
  .tone .sample { font-size: 31pt; color: #141413; margin: 6pt 0 3pt; }
  .tone .shape { font-family: "JetBrains Mono", Menlo, monospace; font-size: 16pt; color: #1B365D; }
  .sound-row { display: grid; grid-template-columns: repeat(6, 1fr); gap: 7pt; margin-top: 8pt; }
  .pill { border: 1pt solid #e8e6dc; background: #faf9f5; text-align: center; padding: 6pt 3pt; }
  .pill p { color: #1B365D; font-size: 14.5pt; }
  .pill.smallpill p { font-size: 11.4pt; }
  .mini-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10pt; }
  .mini { background: #faf9f5; border: 1pt solid #e8e6dc; padding: 10pt; min-height: 86pt; }
  .mini-cn { font-size: 24pt; color: #1B365D; line-height: 1.05; }
  .mini-py { font-size: 12pt; color: #6b6a64; margin-top: 5pt; }
  .grid2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12pt; }
  .grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10pt; }
  .note { border-left: 2pt solid #1B365D; padding-left: 12pt; }
  .writing-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10pt; }
  .writebox { min-height: 118pt; background: #faf9f5; border: 1pt solid #d8d4c7; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6pt; }
  .writebox:before { content: ''; position: absolute; inset: 0; background-image: linear-gradient(#e8e6dc 1px, transparent 1px), linear-gradient(90deg, #e8e6dc 1px, transparent 1px); background-size: 50% 50%; opacity: .75; }
  .writebox p { position: relative; color: #1B365D; font-size: 18pt; margin-top: 4pt; }
  .writebox img { position: relative; width: 76pt; height: 76pt; object-fit: contain; }
  .stroke-mark { position: absolute; right: 5pt; bottom: 4pt; color: #b85042; font-size: 9pt; }
</style>
</head>
<body>
  <div class="paper-ring"></div>
  <div class="page">
    <div class="topline"><p class="eyebrow">${esc(kicker)}</p><div class="seal"><p>BÀI 1</p></div></div>
    <h1>${titleHtml}</h1>
    <div class="${cls}">${body}</div>
    <div class="footer"><p>${esc(theme.footer)}</p><p>第一课 · 你好</p></div>
  </div>
</body>
</html>`;
}

const vocabCore = [
  ['你','nǐ','đại từ · bạn / anh / chị / ông / bà'], ['好','hǎo','tính từ · tốt; ổn; hay; ngon'], ['一','yī','số từ · một'], ['五','wǔ','số từ · năm'], ['八','bā','số từ · tám'], ['大','dà','tính từ · to; lớn']
];
const vocabMore = [
  ['不','bù','phó từ · không'], ['口','kǒu','danh từ / lượng từ · miệng; nhân khẩu'], ['白','bái','tính từ · trắng'], ['女','nǚ','danh từ / tính từ · nữ; phụ nữ'], ['马','mǎ','danh từ · con ngựa']
];

const slides = [
  ['01-cover.html','Trang bìa',baseSlide('<span class="blue">你好</span><br>Bài 1 · Xin chào','第一课 · Bài 1',`
    <div class="two">
      <div class="card"><p class="label">课文 · Bài đọc</p><p class="big-hanzi">你好</p><p class="pinyin">Nǐ hǎo</p><p class="vi">Xin chào / Chào bạn</p></div>
      <div class="card"><p class="label">第一课 · Bài 1</p><p style="font-size:36pt;color:#1B365D;line-height:1.12;">Xin chào</p><p style="font-size:24pt;margin-top:16pt;">你好</p><p class="pinyin">Nǐ hǎo</p></div>
    </div>`,{rawTitle:true})],
  ['02-objectives.html','Mục tiêu',baseSlide('Mục tiêu bài học','学习目标 · Mục tiêu',`
    <div class="two-wide"><div class="card">${list(['Chào hỏi cơ bản bằng 你好 và phản hồi tự nhiên.','Nhận biết 11 chữ/từ đầu tiên: 你、好、一、五、八、大、不、口、白、女、马.','Đọc các thanh mẫu b/p/m/f, d/t/n/l, g/k/h và vận mẫu a/o/e/i/u/ü, ai/ei/ao/ou.','Hiểu quy tắc thanh điệu, vị trí dấu thanh và biến điệu thanh 3.'])}</div><div class="card"><p class="label">Nội dung chính · 重点内容</p><p style="font-size:24pt;color:#1B365D;">你好</p><p style="font-size:24pt;color:#1B365D;">生词</p><p style="font-size:24pt;color:#1B365D;">声母 · 韵母 · 声调</p><p style="font-size:24pt;color:#1B365D;">练习</p></div></div>`)],
  ['03-route.html','Lộ trình',baseSlide('Lộ trình bài học','学习路线 · Lộ trình',`
    <div class="route">
      <div class="step"><b>01 Chào hỏi</b><p>你好<br>Nǐ hǎo</p></div><div class="step"><b>02 Từ mới</b><p>11 chữ Hán<br>và từ vựng</p></div><div class="step"><b>03 Thanh mẫu</b><p>b p m f<br>d t n l<br>g k h</p></div><div class="step"><b>04 Vận mẫu</b><p>a o e i u ü<br>ai ei ao ou</p></div><div class="step"><b>05 Thanh điệu</b><p>4 thanh<br>biến điệu</p></div><div class="step"><b>06 Luyện tập</b><p>đọc âm<br>nhận chữ<br>tập viết</p></div>
    </div><p class="small" style="margin-top:22pt;">Bài học đi từ chào hỏi đến từ vựng, ngữ âm, luyện đọc và tập viết.</p>`)],
  ['04-dialogue.html','Bài đọc',baseSlide('课文 · Bài đọc: lời chào đầu tiên','课文 · Bài đọc',`
    <div class="two"><div class="card"><p class="label">Đối thoại mẫu · 对话示范</p><div class="dialogue"><p class="speaker">A</p><div><p class="line-cn">你好！</p><p class="line-py">Nǐ hǎo!</p><p class="line-vi">Chào bạn!</p></div></div><div class="dialogue"><p class="speaker">B</p><div><p class="line-cn">你好！</p><p class="line-py">Nǐ hǎo!</p><p class="line-vi">Chào bạn!</p></div></div></div><div class="card"><p class="label">Luyện nói · 口语练习</p><p style="font-size:30pt;color:#1B365D;">你好！</p><p class="pinyin">Nǐ hǎo!</p><p class="vi">Chào bạn!</p><p style="margin-top:18pt;">A: 你好！<br>B: 你好！</p></div></div>`)],
  ['05-vocab-core.html','Từ vựng 1',baseSlide('Từ vựng','生词 · Từ vựng',`<div class="two"><div class="card"><p class="label">Từ vựng · 生词</p>${vocab(vocabCore)}</div><div class="card"><p class="label">Luyện đọc · 认读</p>${miniCards([['你好','nǐ hǎo','xin chào'],['不好','bù hǎo','không tốt'],['一','yī','số từ · một'],['五','wǔ','số từ · năm']])}</div></div>`)],
  ['06-vocab-more.html','Từ vựng 2',baseSlide('Từ vựng','生词 · Từ vựng',`<div class="two"><div class="card"><p class="label">Từ vựng · 生词</p>${vocab(vocabMore)}</div><div class="card"><p class="label">Luyện đọc · 认读</p>${miniCards([['不','bù','phó từ · không'],['口','kǒu','danh từ / lượng từ · miệng; nhân khẩu'],['女','nǚ','nữ'],['马','mǎ','danh từ · con ngựa']])}</div></div>`)],
  ['07-vocab-use.html','Từ vựng',baseSlide('Từ vựng','词语练习 · Từ vựng',`
    <div class="grid3"><div class="card"><p class="label">Chào hỏi</p><p class="line-cn">你好</p><p class="line-py">nǐ hǎo → ní hǎo</p><p class="line-vi">Chào bạn</p></div><div class="card"><p class="label">Phủ định</p><p class="line-cn">不好</p><p class="line-py">bù hǎo</p><p class="line-vi">không tốt / không ổn</p></div><div class="card"><p class="label">Số</p><p class="line-cn">一、五、八</p><p class="line-py">yī, wǔ, bā</p><p class="line-vi">một, năm, tám</p></div></div><p class="small" style="margin-top:18pt;">Đọc chữ Hán, pinyin và nghĩa tiếng Việt theo từng nhóm.</p>`)],
  ['08-syllable.html','Âm tiết',baseSlide('Âm tiết tiếng Hán gồm những gì?','音节结构 · Cấu tạo âm tiết',`
    <div class="two-wide"><div class="card"><p class="label">Công thức · 公式</p><p style="font-size:25pt;color:#1B365D;">thanh mẫu + vận mẫu + thanh điệu</p><div style="margin-top:16pt;">${miniCards([['bā','b + a + thanh 1','八 · tám'],['mǎ','m + a + thanh 3','马 · ngựa'],['hǎo','h + ao + thanh 3','好 · tốt'],['nǐ','n + i + thanh 3','你 · bạn']])}</div></div><div class="card"><p class="label">Ghi nhớ · 记忆</p><p>Phụ âm mở đầu là <span class="blue">thanh mẫu</span>. Phần còn lại là <span class="blue">vận mẫu</span>. Thanh điệu làm thay đổi nghĩa.</p></div></div>`,{compact:true})],
  ['09-initials-overview.html','Thanh mẫu',baseSlide('声母 · Thanh mẫu trong Bài 1','声母 · Thanh mẫu',`
    <div class="three"><div class="card"><p class="label">Hai môi</p><p style="font-size:32pt;color:#1B365D;">b p m</p><p class="small">môi khép/mở; phân biệt bật hơi và không bật hơi.</p></div><div class="card"><p class="label">Môi răng</p><p style="font-size:32pt;color:#1B365D;">f</p><p class="small">răng trên chạm nhẹ môi dưới.</p></div><div class="card"><p class="label">Đầu lưỡi</p><p style="font-size:32pt;color:#1B365D;">d t n l</p><p class="small">đầu lưỡi chạm lợi trên.</p></div></div><div class="card" style="margin-top:14pt;"><p><span class="blue">Gốc lưỡi:</span> g k h — phần sau lưỡi nâng lên gần ngạc mềm.</p></div>`)],
  ['10-bpmf.html','b p m f',baseSlide('Ngữ âm · Thanh mẫu b p m f','声母 · Thanh mẫu',`
    <div class="four"><div class="tone"><p class="num">b</p><p class="sample">ba</p><p class="small">không bật hơi; môi khép rồi mở nhanh.</p></div><div class="tone"><p class="num">p</p><p class="sample">pa</p><p class="small">bật hơi mạnh hơn b.</p></div><div class="tone"><p class="num">m</p><p class="sample">ma</p><p class="small">âm mũi; dây thanh rung.</p></div><div class="tone"><p class="num">f</p><p class="sample">fa</p><p class="small">môi răng; luồng hơi ma sát.</p></div></div><p class="small" style="margin-top:18pt;">b / p · m / f</p>`)],
  ['11-dtnl.html','d t n l',baseSlide('Ngữ âm · Thanh mẫu d t n l','声母 · Thanh mẫu',`
    <div class="four"><div class="tone"><p class="num">d</p><p class="sample">da</p><p class="small">đầu lưỡi chạm lợi trên, không bật hơi.</p></div><div class="tone"><p class="num">t</p><p class="sample">ta</p><p class="small">vị trí giống d, nhưng bật hơi.</p></div><div class="tone"><p class="num">n</p><p class="sample">na</p><p class="small">âm mũi, hơi đi qua khoang mũi.</p></div><div class="tone"><p class="num">l</p><p class="sample">la</p><p class="small">hơi thoát qua hai bên lưỡi.</p></div></div><p class="small" style="margin-top:18pt;">Lưu ý cho sinh viên Việt Nam: không đọc l/n lẫn nhau khi luyện pinyin.</p>`)],
  ['12-gkh.html','g k h',baseSlide('Ngữ âm · Thanh mẫu g k h','声母 · Thanh mẫu',`
    <div class="three"><div class="tone"><p class="num">g</p><p class="sample">ga</p><p class="small">không bật hơi; gốc lưỡi nâng lên rồi hạ nhanh.</p></div><div class="tone"><p class="num">k</p><p class="sample">ka</p><p class="small">bật hơi; cảm nhận luồng hơi rõ.</p></div><div class="tone"><p class="num">h</p><p class="sample">ha</p><p class="small">âm xát; hơi ma sát ở phía sau khoang miệng.</p></div></div><div class="card" style="margin-top:16pt;"><p>Đọc cặp tối thiểu: ga/ka, gu/ku, gai/kai, gao/kao.</p></div>`)],
  ['13-finals-single.html','Vận mẫu đơn',baseSlide('单韵母 · Vận mẫu đơn','韵母 · Vận mẫu',`
    <div class="grid3"><div class="card"><p class="label">a o e</p>${miniCards([['a','miệng mở rộng','lưỡi thấp'],['o','môi tròn','miệng vừa'],['e','môi không tròn','lưỡi hơi cao']])}</div><div class="card"><p class="label">i u ü</p>${miniCards([['i','môi dẹt','lưỡi cao phía trước'],['u','môi tròn','lưỡi cao phía sau'],['ü','môi tròn','vị trí lưỡi gần i']])}</div><div class="card"><p class="label">Khẩu hình · 口形</p><p><span class="blue">i</span>: môi dẹt. <span class="blue">u</span>: môi tròn. <span class="blue">ü</span>: lưỡi gần i, môi tròn.</p></div></div>`,{compact:true})],
  ['14-finals-compound.html','Vận mẫu ghép',baseSlide('复韵母 · Vận mẫu ghép','韵母 · Vận mẫu ghép',`
    <div class="four"><div class="tone"><p class="num">ai</p><p class="sample">bái</p><p class="small">a chịu ảnh hưởng của i, vị trí lưỡi hơi tiến về trước.</p></div><div class="tone"><p class="num">ei</p><p class="sample">měi</p><p class="small">e trong ei đọc gần [e].</p></div><div class="tone"><p class="num">ao</p><p class="sample">hǎo</p><p class="small">a chịu ảnh hưởng của o.</p></div><div class="tone"><p class="num">ou</p><p class="sample">kǒu</p><p class="small">giữ chuyển động môi rõ.</p></div></div><p class="small" style="margin-top:18pt;">Cặp âm: bai/bei, mai/mei, hao/hou, kao/kou.</p>`)],
  ['15-writing-pinyin.html','Quy tắc viết',baseSlide('Quy tắc viết pinyin: i, u, ü','拼音书写 · Quy tắc viết',`
    <div class="two"><div class="card"><p class="label">Khi đứng thành âm tiết riêng</p><p style="font-size:32pt;color:#1B365D;">i → yi</p><p style="font-size:32pt;color:#1B365D;">u → wu</p><p style="font-size:32pt;color:#1B365D;">ü → yu</p></div><div class="card"><p class="label">Quy tắc · 规则</p>${list(['Không đọc từng chữ cái theo kiểu tiếng Việt.','Nhìn cả âm tiết pinyin như một đơn vị phát âm.','Viết yi, wu, yu khi i/u/ü tự tạo thành âm tiết.'])}</div></div>`)],
  ['16-tones.html','Thanh điệu',baseSlide('声调 · Bốn thanh cơ bản','声调 · Thanh điệu',`
    <div class="tone-grid"><div class="tone"><p class="num">Thanh 1</p><p class="sample">bā</p><p class="shape">55 ─</p><p class="small">cao và bằng</p></div><div class="tone"><p class="num">Thanh 2</p><p class="sample">bá</p><p class="shape">35 ↗</p><p class="small">đi lên</p></div><div class="tone"><p class="num">Thanh 3</p><p class="sample">bǎ</p><p class="shape">214 ˅</p><p class="small">hạ thấp rồi nhấc lên</p></div><div class="tone"><p class="num">Thanh 4</p><p class="sample">bà</p><p class="shape">51 ↘</p><p class="small">đi xuống nhanh</p></div></div><div class="card" style="margin-top:15pt;"><p>Thanh điệu khác nhau có thể tạo nghĩa khác nhau: ba, ma, yi.</p></div>`)],
  ['17-tone-meaning.html','Đổi thanh đổi nghĩa',baseSlide('Đổi thanh là đổi nghĩa','声调辨义 · Phân biệt nghĩa',`
    <div class="grid3"><div class="card"><p class="label">ba</p>${miniCards([['bā','八','tám'],['bá','拔','nhổ / kéo lên'],['bǎ','靶','bia'],['bà','爸','bố']])}</div><div class="card"><p class="label">ma</p>${miniCards([['mā','妈','mẹ'],['má','麻','tê / gai'],['mǎ','马','ngựa'],['mà','骂','mắng']])}</div><div class="card"><p class="label">yi</p>${miniCards([['yī','一','một'],['yí','移','di chuyển'],['yǐ','椅','ghế'],['yì','亿','trăm triệu']])}</div></div>`,{compact:true})],
  ['18-tone-mark.html','Dấu thanh',baseSlide('Dấu thanh đặt ở đâu?','标调规则 · Quy tắc đặt dấu',`
    <div class="two-wide"><div class="card"><p class="label">Quy tắc chính</p>${list(['Dấu thanh đặt trên nguyên âm chính.','Nếu dấu đặt trên i, bỏ dấu chấm của i.','Khi có nhiều nguyên âm, đặt dấu trên nguyên âm có độ mở miệng lớn nhất.'])}</div><div class="ink-card"><p class="label" style="color:#faf9f5;">Ví dụ</p><p style="font-size:25pt;">nǐ · bǐ · hǎo · mèi · lóu</p><p class="small" style="color:#e8e6dc;margin-top:12pt;">Bài tập: khoanh nguyên âm mang dấu rồi đọc.</p></div></div>`)],
  ['19-tone-sandhi.html','Biến điệu',baseSlide('变调 · Biến điệu thanh 3','变调 · Biến điệu',`
    <div class="two"><div class="card"><p class="label">Quy tắc</p><p style="font-size:24pt;color:#1B365D;">3 + 3 → 2 + 3</p><p style="margin-top:14pt;">两个第三声音节连读时，前一个读成第二声。</p><p class="vi">Khi hai âm tiết thanh 3 đi liền nhau, âm tiết thứ nhất đọc gần như thanh 2.</p></div><div class="card"><p class="label">Ví dụ lớp học</p><p style="font-size:30pt;color:#1B365D;">nǐ hǎo → ní hǎo</p><p style="font-size:30pt;color:#1B365D;">wǔ bǎi → wú bǎi</p><p class="small" style="margin-top:10pt;">Viết: nǐ hǎo. Đọc: ní hǎo.</p></div></div>`)],
  ['20-characters.html','Chữ Hán',baseSlide('音节与汉字 · Âm tiết và chữ Hán','汉字 · Chữ Hán',`
    <div class="two-wide"><div class="card"><p class="label">Ý chính</p><p>Chữ Hán là hình thức chữ viết của tiếng Hán. Một âm tiết có thể viết thành một hoặc nhiều chữ Hán khác nhau.</p><div style="margin-top:14pt;">${miniCards([['bā','八','tám'],['mā','妈','mẹ'],['mǎ','马','ngựa'],['yī','一','một']])}</div></div><div class="card"><p class="label">Đọc cùng lúc · 一起读</p><p>Chữ Hán + pinyin + nghĩa tiếng Việt</p></div></div>`,{compact:true})],
  ['21-tone-drill.html','Luyện thanh',baseSlide('练习 · Luyện thanh điệu','练习 · Thanh điệu',`
    <div class="card"><p class="label">Đọc theo hàng ngang, sau đó đọc ngẫu nhiên</p>${chips([['yī','yí','yǐ','yì'],['wū','wú','wǔ','wù'],['bā','bá','bǎ','bà'],['nǚ','nú','nǔ','nù'],['kōu','kóu','kǒu','kòu']])}</div><p class="small" style="margin-top:14pt;">Đọc theo hàng ngang, sau đó đọc ngẫu nhiên.</p>`)],
  ['22-initials-drill.html','Luyện thanh mẫu',baseSlide('练习 · Phân biệt thanh mẫu','声母辨析 · Luyện âm',`
    <div class="two"><div class="card"><p class="label">b/p · d/t · g/k</p>${chips([['ba','pa','da','ta','ga','ka'],['bu','pu','du','tu','gu','ku'],['bai','pai','dai','tai','gai','kai'],['bao','pao','dou','tou','gao','kao']])}</div><div class="card"><p class="label">Bài tập · 练习</p>${chips([['b','p'],['d','t'],['g','k']])}<p class="small" style="margin-top:12pt;">Phân biệt các cặp thanh mẫu.</p></div></div>`)],
  ['23-finals-drill.html','Luyện vận mẫu',baseSlide('练习 · Phân biệt vận mẫu','韵母辨析 · Luyện âm',`
    <div class="two"><div class="card"><p class="label">Vận mẫu đơn</p>${chips([['ba','bo','he','fo'],['pa','po','ne','mo'],['ma','mo','de','bo'],['fa','fo','ke','po']])}</div><div class="card"><p class="label">Vận mẫu ghép</p>${chips([['bai','bei','pao','pou'],['mai','mei','hao','hou'],['gai','gei','kao','kou'],['hai','hei','gao','gou']])}</div></div>`)],
  ['24-read.html','Nhận mặt chữ',baseSlide('认读 · Nhận mặt chữ và đọc','认读 · Đọc chữ',`
    <div class="grid2"><div class="card"><p class="label">Đọc nhanh</p>${miniCards([['你好','nǐ hǎo','xin chào'],['不好','bù hǎo','không tốt'],['一','yī','một'],['五','wǔ','năm']])}</div><div class="card"><p class="label">Ghép đọc</p>${miniCards([['八','bā','tám'],['大','dà','to; lớn'],['白马','bái mǎ','ngựa trắng'],['女','nǚ','nữ']])}</div></div>`,{compact:true})],
  ['25-writing.html','Tập viết',baseSlide('写汉字 · Tập viết chữ Hán','写汉字 · Tập viết',`
    <div class="card"><p class="label">Chữ luyện viết · 写汉字</p><div class="writing-grid">${['一','八','人','大','口','女'].map((x,i)=>`<div class="writebox"><img src="../assets/strokes/${x}.gif" alt="${x}"><p>${x}</p><span class="stroke-mark">${i+1}</span></div>`).join('')}</div><p class="small" style="margin-top:14pt;">Quan sát thứ tự nét, sau đó viết vào ô luyện tập.</p></div>`)],
  ['26-exit.html','Kiểm tra cuối bài',baseSlide('课堂检查 · Kiểm tra cuối bài','课堂检查 · Kiểm tra',`
    <div class="two"><div class="card"><p class="label">声调 · Thanh điệu</p>${chips([['yī','yí','yǐ','yì'],['wū','wú','wǔ','wù'],['bā','bá','bǎ','bà'],['dā','dá','dǎ','dà']])}</div><div class="card"><p class="label">变调 · Biến điệu</p>${chips([['nǐ hǎo','wǔ bǎi'],['gěi nǐ','yǔfǎ'],['kěyǐ','fǔdǎo']])}<p class="label" style="margin-top:14pt;">辨别声母 · Phân biệt thanh mẫu</p>${chips([['ba','pa','da','ta','ga','ka'],['bu','pu','du','tu','gu','ku']])}</div></div>`)]
];

for (const [file, , html] of slides) await fs.writeFile(path.join(slidesDir, file), html, 'utf8');

const manifest = slides.map(([file, label]) => `    { file: "slides/${file}", label: "${label}" }`).join(',\n');
const index = `<!DOCTYPE html>
<html lang="zh-Hans"><head><meta charset="UTF-8"><title>Bài 1 · Xin chào · Bộ slide đầy đủ</title>
<script>window.DECK_MANIFEST=[\n${manifest}\n];window.DECK_WIDTH=1280;window.DECK_HEIGHT=720;</script>
<style>*{box-sizing:border-box;margin:0;padding:0}html,body{height:100%;background:#141413;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Noto Sans SC",sans-serif}#stage{position:fixed;top:0;left:0;transform-origin:top left;width:1280px;height:720px;background:#f5f4ed;box-shadow:0 10px 60px rgba(0,0,0,.45)}iframe{width:100%;height:100%;border:0;display:block;background:#f5f4ed}.counter{position:fixed;bottom:18px;right:18px;background:rgba(0,0,0,.72);color:white;border-radius:999px;padding:7px 13px;font-size:13px;z-index:10}.nav{position:fixed;top:0;bottom:0;width:18%;z-index:8;cursor:pointer}.nav.left{left:0}.nav.right{right:0}</style></head>
<body><div id="stage"><iframe id="frame" src="about:blank"></iframe></div><div class="nav left" id="prev"></div><div class="nav right" id="next"></div><div class="counter" id="counter"></div>
<script>(()=>{const W=window.DECK_WIDTH,H=window.DECK_HEIGHT,deck=window.DECK_MANIFEST,stage=document.getElementById('stage'),frame=document.getElementById('frame'),counter=document.getElementById('counter');let current=Math.max(0,Math.min(deck.length-1,Number(location.hash.slice(1)||1)-1));function fit(){const s=Math.min(innerWidth/W,innerHeight/H);stage.style.transform='translate('+((innerWidth-W*s)/2)+'px,'+((innerHeight-H*s)/2)+'px) scale('+s+')'}function show(i){if(i<0||i>=deck.length)return;current=i;frame.src=deck[i].file;counter.textContent=(i+1)+' / '+deck.length+' · '+deck[i].label;history.replaceState(null,'','#'+(i+1))}addEventListener('resize',fit);addEventListener('keydown',e=>{if(['ArrowRight',' ','PageDown'].includes(e.key))show(current+1);if(['ArrowLeft','PageUp'].includes(e.key))show(current-1);if(e.key==='Home')show(0);if(e.key==='End')show(deck.length-1)});document.getElementById('prev').onclick=()=>show(current-1);document.getElementById('next').onclick=()=>show(current+1);fit();show(current)})();</script></body></html>`;
await fs.writeFile(path.join(outDir, 'index.html'), index, 'utf8');

const guide = `# 教师手册 · Bài 1: 你好

## Chuẩn bị trước giờ học
- In hoặc mở giáo trình Bài 1, trang 19–30.
- Trọng tâm lớp: nghe → lặp lại → phân biệt âm → nhận chữ → tập viết.
- Không đưa ghi chú chuẩn bị lên slide lớp học.

## Gợi ý triển khai
1. Bắt đầu bằng 你好, cho sinh viên nghe và lặp lại trước khi giải thích.
2. Với từ vựng, luôn đi theo thứ tự: chữ Hán → pinyin → nghĩa tiếng Việt → loại từ.
3. Với ngữ âm, luyện bằng cặp đối lập: b/p, d/t, g/k.
4. Với thanh 3 + thanh 3, nhấn mạnh: cách viết vẫn là nǐ hǎo, cách đọc gần như ní hǎo.
5. Phần 写汉字 nên dùng hoạt ảnh thứ tự nét từ writtenchinese.com hoặc nguồn tương đương khi trình chiếu trực tiếp; PPTX hiện dùng khung luyện viết tĩnh để đảm bảo xuất file ổn định.

## Bài tập nên dùng
- Thanh điệu: các dãy yī/yí/yǐ/yì, wū/wú/wǔ/wù, bā/bá/bǎ/bà.
- Biến điệu: nǐ hǎo, wǔ bǎi, gěi nǐ, yǔfǎ, kěyǐ, fǔdǎo.
- Phân biệt thanh mẫu: ba/pa, da/ta, ga/ka; bu/pu, du/tu, gu/ku.
`;
await fs.writeFile(path.join(outDir, '教师手册.md'), guide, 'utf8');
console.log(`Created ${outDir} with ${slides.length} slides`);
