#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import pptxgen from 'pptxgenjs';
import { chromium } from 'playwright';

const root = process.cwd();
const outRoot = path.join(root, 'output/lesson-01-beautiful-ppt-prototypes');
const dataPath = path.join(root, 'output/vp-database/lesson-01/vp_lesson_01_database.json');
const data = JSON.parse(await fs.readFile(dataPath, 'utf8'));

await fs.rm(outRoot, { recursive: true, force: true });
await fs.mkdir(outRoot, { recursive: true });

const esc = (s = '') => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const vocab = data.content_items.filter(x => x.record_type === 'vocabulary').sort((a, b) => a.teaching_order - b.teaching_order);
const byHan = Object.fromEntries(vocab.map(x => [x.chinese_simplified, x]));
const w = (han) => byHan[han];

const themes = {
  lab: {
    folder: '01-language-lab',
    title: 'Version 1 · Language Lab',
    note: 'Bright, kinetic, classroom-friendly. Uses modular lab panels, signal lines, large pronunciation moments, and active practice layouts.',
    css: `
:root{--paper:#F7F4EA;--ink:#151A24;--muted:#5B6270;--blue:#176BFF;--coral:#FF5A3D;--mint:#00A878;--yellow:#FFD166;--lav:#D8D2FF;--line:#151A24}
body{background:var(--paper);color:var(--ink);font-family:Aptos,Inter,"PingFang SC","Noto Sans SC",Arial,sans-serif}
.page{background:
  linear-gradient(90deg,rgba(21,26,36,.06) 1px,transparent 1px),
  linear-gradient(rgba(21,26,36,.05) 1px,transparent 1px),var(--paper);background-size:32px 32px}
.tag{background:var(--ink);color:#fff;border-radius:999px;padding:8px 14px;font-weight:850;letter-spacing:.08em}
.card{background:#fff;border:2px solid var(--line);border-radius:18px;box-shadow:8px 8px 0 rgba(21,26,36,.16)}
.soft{background:#FFF8D8}.blue{background:#DCEBFF}.mint{background:#DDF8ED}.coral{background:#FFE1DB}.lav{background:#ECE9FF}
.rule{background:var(--ink)}.accent{color:var(--blue)}.accent2{color:var(--coral)}
`
  },
  editorial: {
    folder: '02-editorial-notebook',
    title: 'Version 2 · Editorial Notebook',
    note: 'Warm editorial workbook style. Feels like a designed lesson magazine with cut-paper blocks, handwritten-board rhythm, and polished classroom pacing.',
    css: `
:root{--paper:#FFFDF6;--ink:#22201C;--muted:#6E655B;--blue:#1D4ED8;--coral:#B45309;--mint:#0F766E;--yellow:#F5D06F;--rose:#F6C6B6;--line:#2B2925}
body{background:#E9DED0;color:var(--ink);font-family:Georgia,Aptos,"PingFang SC","Noto Sans SC",serif}
.page{background:var(--paper);box-shadow:0 24px 80px rgba(70,50,25,.18)}
.tag{background:#F4E7D4;border:1px solid #D7B98E;border-radius:4px;padding:8px 12px;font-weight:800;letter-spacing:.05em;color:#7C3E12}
.card{background:#fff;border:1.5px solid #D8C8B4;border-radius:7px;box-shadow:0 12px 24px rgba(90,64,34,.08)}
.soft{background:#FBF0D2}.blue{background:#E6EEFF}.mint{background:#DDF3EC}.coral{background:#F9DBCB}.lav{background:#EEE9FF}
.rule{background:#C8A46C}.accent{color:#1D4ED8}.accent2{color:#B45309}
`
  },
  kinetic: {
    folder: '03-kinetic-type',
    title: 'Version 3 · Kinetic Type',
    note: 'Bold typographic system. Uses big Chinese type, rhythm, contrast, and structured visual drills for a more memorable university deck.',
    css: `
:root{--paper:#F4F7FB;--ink:#111827;--muted:#576070;--blue:#0057FF;--coral:#F43F5E;--mint:#00A878;--yellow:#FFE45E;--lav:#D6D4FF;--line:#111827}
body{background:var(--ink);color:var(--ink);font-family:Impact,Aptos,"PingFang SC","Noto Sans SC",Arial,sans-serif}
.page{background:var(--paper)}
.tag{background:var(--yellow);border:2px solid var(--ink);padding:8px 13px;font-family:Aptos,Arial,sans-serif;font-weight:900;letter-spacing:.08em}
.card{background:#fff;border:3px solid var(--ink);border-radius:0;box-shadow:none}
.soft{background:#FFF4B8}.blue{background:#DDEAFF}.mint{background:#D9F8EA}.coral{background:#FFDCE4}.lav{background:#E5E2FF}
.rule{background:var(--ink)}.accent{color:#0057FF}.accent2{color:#F43F5E}
`
  }
};

const baseCss = `
*{box-sizing:border-box}html,body{margin:0;width:1280px;height:720px;overflow:hidden}.page{position:relative;width:1280px;height:720px;overflow:hidden}
p,h1,h2,h3{margin:0}p{font-family:Aptos,Inter,"PingFang SC","Noto Sans SC",Arial,sans-serif;color:var(--muted);font-size:24px;line-height:1.28}
h1{position:absolute;left:72px;top:92px;width:780px;font-size:54px;line-height:1.02;letter-spacing:0;font-weight:900;color:var(--ink)}
h2{font-size:36px;line-height:1.05;font-weight:900;color:var(--ink)}
h3{font-family:Aptos,Inter,"PingFang SC","Noto Sans SC",Arial,sans-serif;font-size:25px;line-height:1.08;font-weight:850;color:var(--ink)}
.tag{position:absolute;left:72px;top:48px;font-size:15px;line-height:1;font-family:Aptos,Inter,Arial,sans-serif}
.cn{font-family:"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif;font-weight:900;color:var(--ink)}
.pin{font-family:Aptos,Inter,Arial,sans-serif;color:var(--blue);font-weight:900}
.card{position:absolute}.rule{position:absolute}.tiny{font-size:15px;line-height:1.2;color:var(--muted)}.label{font-size:16px;letter-spacing:.08em;text-transform:uppercase;font-weight:900;color:var(--blue)}
.footer{position:absolute;right:72px;bottom:30px}.footer p{font-size:14px;color:rgba(87,96,112,.72)}
.photo{position:absolute;overflow:hidden}.photo:before{content:"";position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.52),rgba(255,255,255,0))}
.tile{position:absolute;border:2px solid var(--line);background:#fff}.path{position:absolute;height:4px;background:var(--line);transform-origin:left center}.chip{position:absolute;border:2px solid var(--line);border-radius:999px;background:#fff}
`;

function slide(theme, title, section, body, extra = '') {
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${baseCss}${theme.css}${extra}</style></head><body><main class="page"><div class="tag">${esc(section)}</div><h1>${esc(title)}</h1>${body}<div class="footer"><p>第一课 · 你好 · Bài 1</p></div></main></body></html>`;
}

function cover(t) {
  return slide(t, '你好', 'BÀI 1 · XIN CHÀO', `
    <div class="rule" style="left:72px;top:218px;width:392px;height:8px"></div>
    <p class="pin" style="position:absolute;left:74px;top:246px;font-size:62px">nǐ hǎo</p>
    <p style="position:absolute;left:78px;top:330px;width:420px;font-size:31px;color:var(--ink);font-weight:800">Từ lời chào đầu tiên đến 12 từ vựng cơ bản.</p>
    <div class="card blue" style="right:78px;top:56px;width:418px;height:548px;transform:rotate(2deg)">
      <p class="cn" style="position:absolute;left:40px;top:46px;font-size:174px;line-height:.95">你</p>
      <p class="cn" style="position:absolute;right:40px;bottom:40px;font-size:174px;line-height:.95;color:var(--coral)">好</p>
      <div class="rule" style="left:42px;top:282px;width:330px;height:5px;background:var(--coral)"></div>
    </div>
    <div class="card soft" style="left:612px;top:454px;width:220px;height:102px"><p style="position:absolute;left:22px;top:21px;font-weight:900;color:var(--ink)">12 từ vựng<br><span class="tiny">p.19-20</span></p></div>
  `);
}

function objectives(t) {
  const items = [['01', 'Chào hỏi', 'Dùng 你好 trong tình huống gặp mặt.'], ['02', 'Đọc từ', 'Nhận biết và đọc 12 từ vựng cơ bản.'], ['03', 'Viết chữ', 'Viết 一、八、大、不、五、口、白、女、马、你、好.']];
  return slide(t, 'Mục tiêu học tập', '学习目标', `
    <div class="path" style="left:172px;top:300px;width:880px"></div>
    ${items.map((it, i) => `
    <div class="card ${i === 0 ? 'blue' : i === 1 ? 'mint' : 'coral'}" style="left:${98 + i * 382}px;top:${210 + (i % 2) * 58}px;width:286px;height:214px">
      <p class="cn" style="position:absolute;left:24px;top:18px;font-size:52px;color:var(--ink)">${it[0]}</p>
      <h2 style="position:absolute;left:24px;top:88px;width:220px">${esc(it[1])}</h2>
      <p style="position:absolute;left:24px;right:24px;bottom:24px;font-size:19px">${esc(it[2])}</p>
    </div>`).join('')}
  `);
}

function warmup(t) {
  return slide(t, 'Bạn đã nghe câu chào nào bằng tiếng Trung chưa?', 'KHỞI ĐỘNG', `
    <div class="card soft" style="left:96px;top:210px;width:564px;height:274px">
      <p style="position:absolute;left:34px;top:32px;width:470px;font-size:38px;line-height:1.1;font-weight:900;color:var(--ink)">“Trong phim, bài hát hoặc TikTok, bạn nhớ câu nào?”</p>
      <p style="position:absolute;left:36px;bottom:34px;width:440px">Cả lớp trả lời nhanh, sau đó giảng viên viết 你好 và đọc mẫu.</p>
    </div>
    ${['phim ảnh', 'bài hát', 'trải nghiệm cá nhân'].map((x, i) => `<div class="chip ${i === 1 ? 'mint' : i === 2 ? 'coral' : 'blue'}" style="left:${740 + (i % 2) * 95}px;top:${200 + i * 96}px;width:${i === 2 ? 304 : 206}px;height:62px"><p style="position:absolute;inset:14px;text-align:center;font-weight:900;color:var(--ink)">${esc(x)}</p></div>`).join('')}
    <p class="cn" style="position:absolute;right:88px;bottom:60px;font-size:110px;color:rgba(17,24,39,.09)">你好</p>
  `);
}

function vocabOverview(t) {
  return slide(t, '12 từ vựng đầu tiên', 'TỪ VỰNG', `
    <div class="card" style="left:72px;top:176px;width:1136px;height:390px">
      ${vocab.map((item, i) => `<div class="tile ${i < 3 ? 'soft' : i < 6 ? 'blue' : i < 9 ? 'mint' : 'coral'}" style="left:${28 + (i % 6) * 178}px;top:${28 + Math.floor(i / 6) * 168}px;width:146px;height:138px">
        <p class="pin" style="position:absolute;left:12px;top:12px;width:118px;text-align:center;font-size:19px">${esc(item.pinyin)}</p>
        <p class="cn" style="position:absolute;left:12px;top:45px;width:118px;text-align:center;font-size:48px;line-height:1">${esc(item.chinese_simplified)}</p>
        <p style="position:absolute;left:8px;right:8px;bottom:12px;text-align:center;font-size:14px;line-height:1.1;color:var(--ink);font-weight:800">${esc(item.word_type_vi.replace('thành ngữ', 'cụm từ'))}</p>
      </div>`).join('')}
    </div>
  `);
}

function keyGreeting(t) {
  return slide(t, 'Từ đơn đến lời chào', 'TRỌNG TÂM', `
    ${['你', '好'].map((han, i) => `<div class="card ${i ? 'mint' : 'blue'}" style="left:${92 + i * 330}px;top:190px;width:260px;height:248px">
      <p class="pin" style="position:absolute;left:26px;top:26px;font-size:30px">${esc(w(han).pinyin)}</p>
      <p class="cn" style="position:absolute;left:26px;top:76px;font-size:90px;line-height:.95">${han}</p>
      <p style="position:absolute;left:28px;right:22px;bottom:28px;font-weight:800;color:var(--ink)">${esc(w(han).vietnamese)}</p>
    </div>`).join('')}
    <div class="path" style="left:358px;top:310px;width:82px;background:var(--coral)"></div>
    <div class="path" style="left:688px;top:310px;width:82px;background:var(--coral)"></div>
    <div class="card soft" style="left:768px;top:156px;width:336px;height:318px">
      <p class="pin" style="position:absolute;left:34px;top:32px;font-size:34px">nǐ hǎo</p>
      <p class="cn" style="position:absolute;left:34px;top:88px;font-size:110px;line-height:.95">你好</p>
      <p style="position:absolute;left:38px;top:210px;font-size:31px;font-weight:900;color:var(--ink)">Xin chào</p>
      <p class="tiny" style="position:absolute;left:38px;right:34px;bottom:28px">Dạy như một cụm từ.</p>
    </div>
  `);
}

function numbers(t) {
  return slide(t, 'Nhìn, đọc, phản xạ: 一、五、八', 'SỐ ĐẾM', `
    ${['一', '五', '八'].map((han, i) => `<div class="card ${i === 0 ? 'soft' : i === 1 ? 'blue' : 'coral'}" style="left:${100 + i * 356}px;top:186px;width:276px;height:268px;transform:rotate(${[-2, 1, -1][i]}deg)">
      <p class="pin" style="position:absolute;left:28px;top:28px;font-size:30px">${esc(w(han).pinyin)}</p>
      <p class="cn" style="position:absolute;left:28px;top:72px;font-size:118px;line-height:.95">${han}</p>
      <p style="position:absolute;left:32px;bottom:28px;font-size:30px;font-weight:900;color:var(--ink)">${esc(w(han).vietnamese)}</p>
    </div>`).join('')}
    <div class="chip mint" style="left:330px;top:510px;width:620px;height:56px"><p style="position:absolute;left:24px;right:24px;top:14px;text-align:center;font-weight:900;color:var(--ink)">Giảng viên giơ tay. Sinh viên đọc số bằng tiếng Trung.</p></div>
  `);
}

function moreVocab(t) {
  return slide(t, 'Nhóm từ còn lại', 'TỪ VỰNG', `
    ${['大','不','口','白','女','马'].map((han, i) => `<div class="card ${['blue','soft','mint','coral','lav','soft'][i]}" style="left:${90 + (i % 3) * 360}px;top:${168 + Math.floor(i / 3) * 178}px;width:286px;height:132px">
      <p class="cn" style="position:absolute;left:22px;top:24px;font-size:70px;line-height:.95">${han}</p>
      <p class="pin" style="position:absolute;left:120px;top:28px;font-size:24px">${esc(w(han).pinyin)}</p>
      <p style="position:absolute;left:120px;top:68px;width:130px;font-size:18px;color:var(--ink);font-weight:800">${esc(w(han).vietnamese)}</p>
    </div>`).join('')}
    <p class="tiny" style="position:absolute;left:820px;top:566px;width:300px">Chú ý: 女 nǚ, 马 mǎ.</p>
  `);
}

function dialogue(t) {
  return slide(t, 'Bài đọc: chào và đáp lại', 'BÀI ĐỌC', `
    <div class="card blue" style="left:116px;top:190px;width:430px;height:154px;border-radius:34px 34px 34px 8px">
      <p style="position:absolute;left:28px;top:22px;font-weight:900;color:var(--ink)">A</p>
      <p class="pin" style="position:absolute;left:88px;top:22px;font-size:34px">nǐ hǎo</p>
      <p class="cn" style="position:absolute;left:88px;top:74px;font-size:58px">你好</p>
    </div>
    <div class="card soft" style="right:118px;top:338px;width:430px;height:154px;border-radius:34px 34px 8px 34px">
      <p style="position:absolute;left:28px;top:22px;font-weight:900;color:var(--ink)">B</p>
      <p class="pin" style="position:absolute;left:88px;top:22px;font-size:34px">nǐ hǎo</p>
      <p class="cn" style="position:absolute;left:88px;top:74px;font-size:58px">你好</p>
    </div>
    <div class="path" style="left:548px;top:336px;width:132px;transform:rotate(24deg);background:var(--coral)"></div>
    <div class="chip mint" style="left:212px;top:538px;width:650px;height:52px"><p style="position:absolute;left:20px;right:20px;top:13px;text-align:center;font-weight:900;color:var(--ink)">Luyện theo cặp, đổi vai sau mỗi lượt.</p></div>
  `);
}

function practice(t) {
  const cols = [['Hán tự', ['马', '你', '好']], ['Pinyin', ['hǎo', 'mǎ', 'nǐ']], ['Nghĩa', ['bạn', 'ngựa', 'tốt']]];
  return slide(t, 'Ghép thẻ trong 5 phút', 'LUYỆN TẬP', `
    ${cols.map((col, i) => `<div class="card ${i === 1 ? 'mint' : i === 2 ? 'soft' : 'blue'}" style="left:${100 + i * 360}px;top:172px;width:294px;height:320px">
      <h2 style="position:absolute;left:26px;top:24px">${esc(col[0])}</h2>
      ${col[1].map((x, j) => `<div class="tile" style="left:36px;top:${102 + j * 66}px;width:222px;height:48px"><p style="position:absolute;left:12px;right:12px;top:10px;text-align:center;font-size:22px;font-weight:900;color:var(--ink)">${esc(x)}</p></div>`).join('')}
    </div>`).join('')}
  `);
}

function homework(t) {
  return slide(t, 'Bài tập về nhà', 'KẾT THÚC', `
    <div class="card soft" style="left:98px;top:176px;width:478px;height:318px">
      <h2 style="position:absolute;left:34px;top:34px">Trong sách</h2>
      <p style="position:absolute;left:38px;top:102px;width:360px;font-weight:850;color:var(--ink)">E001-E007, trang 28-30</p>
      <p style="position:absolute;left:38px;top:164px;width:380px">Tập viết 11 chữ Hán, mỗi chữ ít nhất 5 lần.</p>
    </div>
    <div class="card mint" style="left:638px;top:176px;width:448px;height:318px">
      <h2 style="position:absolute;left:34px;top:34px">Tự luyện</h2>
      <p style="position:absolute;left:38px;top:102px;width:340px;font-weight:850;color:var(--ink)">Đọc to 12 từ vựng mỗi ngày.</p>
      <p style="position:absolute;left:38px;top:164px;width:338px">Chơi Blooket nếu giảng viên đã tạo bộ câu hỏi.</p>
    </div>
    <p class="cn" style="position:absolute;left:464px;bottom:50px;font-size:70px;color:rgba(17,24,39,.12)">下次见</p>
  `);
}

const slideFns = [cover, objectives, warmup, vocabOverview, keyGreeting, numbers, moreVocab, dialogue, practice, homework];

async function renderDeck(theme) {
  const dir = path.join(outRoot, theme.folder);
  const slidesDir = path.join(dir, 'slides');
  const shotsDir = path.join(dir, 'screenshots');
  await fs.mkdir(slidesDir, { recursive: true });
  await fs.mkdir(shotsDir, { recursive: true });

  const files = [];
  for (let i = 0; i < slideFns.length; i++) {
    const file = `${String(i + 1).padStart(2, '0')}.html`;
    files.push(file);
    await fs.writeFile(path.join(slidesDir, file), slideFns[i](theme), 'utf8');
  }

  const browser = await chromium.launch(process.platform === 'darwin' ? { channel: 'chrome' } : {});
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
  const imagePaths = [];
  for (const file of files) {
    await page.goto(`file://${path.join(slidesDir, file)}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(200);
    const out = path.join(shotsDir, file.replace('.html', '.png'));
    await page.screenshot({ path: out, fullPage: false });
    imagePaths.push(out);
  }
  await browser.close();

  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'AI Teaching Material System';
  pptx.subject = 'Lesson 1 PPT design prototype';
  pptx.title = theme.title;
  for (const img of imagePaths) {
    const s = pptx.addSlide();
    s.background = { color: 'FFFFFF' };
    s.addImage({ path: img, x: 0, y: 0, w: 13.333, h: 7.5 });
  }
  await pptx.writeFile({ fileName: path.join(dir, `${theme.folder}.pptx`) });

  const manifest = files.map((file, i) => `    { file: "slides/${file}", label: "Slide ${i + 1}" }`).join(',\n');
  const index = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${esc(theme.title)}</title><script>window.DECK_MANIFEST=[\n${manifest}\n];window.DECK_WIDTH=1280;window.DECK_HEIGHT=720;</script><style>*{box-sizing:border-box;margin:0;padding:0}html,body{height:100%;background:#0F172A;overflow:hidden;font-family:Aptos,Arial,sans-serif}#stage{position:fixed;top:0;left:0;transform-origin:top left;width:1280px;height:720px;background:white;box-shadow:0 10px 70px rgba(0,0,0,.48)}iframe{width:100%;height:100%;border:0}.counter{position:fixed;right:18px;bottom:18px;background:rgba(0,0,0,.75);color:white;border-radius:999px;padding:7px 13px;font-size:13px;z-index:10}.nav{position:fixed;top:0;bottom:0;width:18%;z-index:8;cursor:pointer}.nav.left{left:0}.nav.right{right:0}</style></head><body><div id="stage"><iframe id="frame"></iframe></div><div class="nav left" id="prev"></div><div class="nav right" id="next"></div><div class="counter" id="counter"></div><script>(()=>{const W=window.DECK_WIDTH,H=window.DECK_HEIGHT,deck=window.DECK_MANIFEST,stage=document.getElementById('stage'),frame=document.getElementById('frame'),counter=document.getElementById('counter');let current=Math.max(0,Math.min(deck.length-1,Number(location.hash.slice(1)||1)-1));function fit(){const s=Math.min(innerWidth/W,innerHeight/H);stage.style.transform='translate('+((innerWidth-W*s)/2)+'px,'+((innerHeight-H*s)/2)+'px) scale('+s+')'}function show(i){if(i<0||i>=deck.length)return;current=i;frame.src=deck[i].file;counter.textContent=(i+1)+' / '+deck.length;history.replaceState(null,'','#'+(i+1))}addEventListener('resize',fit);addEventListener('keydown',e=>{if(['ArrowRight',' ','PageDown'].includes(e.key))show(current+1);if(['ArrowLeft','PageUp'].includes(e.key))show(current-1)});document.getElementById('prev').onclick=()=>show(current-1);document.getElementById('next').onclick=()=>show(current+1);fit();show(current)})();</script></body></html>`;
  await fs.writeFile(path.join(dir, 'index.html'), index, 'utf8');
  await fs.writeFile(path.join(dir, 'README.md'), `# ${theme.title}\n\n${theme.note}\n\nPPTX: \`${theme.folder}.pptx\`\n\nSource: Lesson 1 database, vocabulary p.19-20, exercises p.28-30.\n`, 'utf8');
}

for (const theme of Object.values(themes)) {
  await renderDeck(theme);
}

const gallery = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Lesson 1 Beautiful PPT Prototypes</title><style>body{margin:0;background:#F6F4EF;color:#151A24;font-family:Aptos,Inter,Arial,sans-serif}.wrap{max-width:1120px;margin:0 auto;padding:48px 28px}h1{font-size:40px;margin:0 0 10px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:30px}.card{background:#fff;border:1px solid #DED8CC;border-radius:16px;padding:24px;box-shadow:0 18px 40px rgba(30,24,16,.08)}h2{font-size:24px;margin:0 0 10px}p{font-size:16px;line-height:1.45;color:#5B6270}.btn{display:inline-block;margin:14px 8px 0 0;padding:10px 14px;border-radius:999px;background:#151A24;color:white;text-decoration:none;font-weight:800}.btn.alt{background:#E9DED0;color:#151A24}@media(max-width:900px){.grid{grid-template-columns:1fr}}</style></head><body><div class="wrap"><h1>Lesson 1 Beautiful PPT Prototypes</h1><p>Three creative slide directions for Bài 1 · 你好. Each version has 10 slides and a PPTX review file.</p><div class="grid">${Object.values(themes).map(t => `<div class="card"><h2>${esc(t.title)}</h2><p>${esc(t.note)}</p><a class="btn" href="${t.folder}/${t.folder}.pptx">PPTX</a><a class="btn alt" href="${t.folder}/index.html">HTML preview</a></div>`).join('')}</div></div></body></html>`;
await fs.writeFile(path.join(outRoot, 'index.html'), gallery, 'utf8');
await fs.writeFile(path.join(outRoot, 'README.md'), `# Lesson 1 Beautiful PPT Prototypes\n\nThree 10-slide PPTX prototypes generated from Lesson 1 content.\n\n${Object.values(themes).map(t => `- ${t.title}: \`${t.folder}/${t.folder}.pptx\``).join('\n')}\n\nNotes:\n- PPTX files are visual review decks built from rendered Huashu HTML slides.\n- HTML source is preserved in each \`slides/\` folder.\n- Visible language follows project rules: Vietnamese labels, Simplified Chinese content, pinyin support.\n`, 'utf8');

console.log(`Created ${outRoot}`);
