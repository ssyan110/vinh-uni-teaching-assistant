#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import pptxgen from 'pptxgenjs';
import { chromium } from 'playwright';

const root = process.cwd();
const outDir = path.join(root, 'output/lesson-01-modern-business');
const slidesDir = path.join(outDir, 'slides');
const shotsDir = path.join(outDir, 'screenshots');
const data = JSON.parse(await fs.readFile(path.join(root, 'output/vp-database/lesson-01/vp_lesson_01_database.json'), 'utf8'));

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(slidesDir, { recursive: true });
await fs.mkdir(shotsDir, { recursive: true });

const esc = (s = '') => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const vocab = data.content_items.filter(x => x.record_type === 'vocabulary').sort((a, b) => a.teaching_order - b.teaching_order);
const exercises = data.content_items.filter(x => x.record_type === 'exercise').sort((a, b) => a.teaching_order - b.teaching_order);
const byHan = Object.fromEntries(vocab.map(x => [x.chinese_simplified, x]));
const w = han => byHan[han];

const modules = [
  ['01', 'warmup', 'Khởi động', '暖身活动'],
  ['02', 'objectives', 'Mục tiêu bài học', '学习目标'],
  ['03', 'pinyin', 'Ngữ âm', '拼音'],
  ['04', 'pinyin_practice', 'Luyện ngữ âm', '拼音练习'],
  ['05', 'vocabulary', 'Từ vựng', '生词'],
  ['06', 'vocabulary_practice', 'Luyện từ vựng', '生词练习'],
  ['07', 'grammar', 'Ngữ pháp', '语法'],
  ['08', 'grammar_practice', 'Luyện ngữ pháp', '语法练习'],
  ['09', 'text_preview', 'Giới thiệu bài khóa', '课文预习'],
  ['10', 'text', 'Bài đọc', '课文'],
  ['11', 'culture', 'Văn hóa bổ sung', '文化补充'],
  ['12', 'discussion', 'Thảo luận', '课程讨论'],
  ['13', 'homework_intro', 'Giới thiệu bài tập về nhà', '课后作业说明']
];

const css = `
*{box-sizing:border-box}html,body{margin:0;width:1280px;height:720px;overflow:hidden}
body{font-family:Aptos,Inter,"PingFang SC","Noto Sans SC","Microsoft YaHei",Arial,sans-serif;color:#101828;background:#F4F7FB}
.page{position:relative;width:1280px;height:720px;overflow:hidden;background:#F4F7FB}
.nav{position:absolute;left:0;top:0;width:1280px;height:74px;background:#0B1220}
.brand{position:absolute;left:58px;top:25px;color:#F9FAFB;font-size:14px;font-weight:800;letter-spacing:.11em}
.module{position:absolute;right:58px;top:21px;border:1px solid rgba(255,255,255,.28);border-radius:999px;padding:8px 15px;color:#E5E7EB;font-size:13px;font-weight:800}
h1{position:absolute;left:58px;top:112px;width:720px;margin:0;color:#101828;font-size:44px;line-height:1.04;font-weight:900;letter-spacing:0}
h2{margin:0;color:#101828;font-size:31px;line-height:1.08;font-weight:900}
h3{margin:0;color:#101828;font-size:22px;line-height:1.1;font-weight:850}
p{margin:0;color:#526070;font-size:21px;line-height:1.31}
.cn{font-family:"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif;font-weight:900;color:#101828}
.pin{color:#2563EB;font-weight:900}
.caption{font-size:13px;text-transform:uppercase;letter-spacing:.09em;font-weight:900;color:#2563EB}
.card{position:absolute;background:#FFFFFF;border:1px solid #D7DEE9;border-radius:14px;box-shadow:0 16px 38px rgba(16,24,40,.08)}
.panel{position:absolute;background:#FFFFFF;border:1px solid #D7DEE9;border-radius:7px}
.dark{background:#0B1220}.blue{background:#EAF2FF}.green{background:#E9F8F1}.amber{background:#FFF4D8}.rose{background:#FFE8EC}
.metric{position:absolute;background:#FFFFFF;border:1px solid #D7DEE9;border-radius:12px}
.metric p{position:absolute;left:18px;top:14px;font-size:13px;color:#667085;font-weight:850;letter-spacing:.06em;text-transform:uppercase}
.metric .num{position:absolute;left:18px;bottom:14px;color:#101828;font-size:38px;font-weight:900}
.bar{position:absolute;height:10px;background:#E5EAF2;border-radius:999px}.fill{position:absolute;height:10px;background:#2563EB;border-radius:999px}
.line{position:absolute;height:2px;background:#CBD5E1}.dot{position:absolute;width:15px;height:15px;border-radius:999px;background:#2563EB}
.chip{position:absolute;border-radius:999px;background:#EFF6FF;border:1px solid #BFDBFE}
.chip p{position:absolute;inset:9px 16px;text-align:center;font-size:15px;font-weight:850;color:#1D4ED8}
.footer{position:absolute;left:58px;right:58px;bottom:26px;border-top:1px solid #D7DEE9;padding-top:12px}
.footer p{font-size:13px;color:#7B8494;text-align:right}
`;

function shell(num, moduleName, zh, title, body) {
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${esc(num)} ${esc(moduleName)}</title><style>${css}</style></head><body><main class="page"><div class="nav"><div class="brand">BÀI 1 · 你好 · MODERN BUSINESS</div><div class="module">${esc(num)} / 13 · ${esc(moduleName)}</div></div><h1>${esc(title)}</h1>${body}<div class="footer"><p>${esc(zh)} · Giáo trình Hán ngữ p.19-30</p></div></main></body></html>`;
}

const slideDefs = [
  ['01-warmup.html', ...modules[0], 'Bạn biết cách chào hỏi bằng tiếng Trung không?', `
    <div class="card amber" style="left:58px;top:240px;width:570px;height:246px"><p style="position:absolute;left:34px;top:34px;width:460px;font-size:34px;font-weight:900;color:#101828">“Bạn đã nghe câu chào nào bằng tiếng Trung chưa?”</p><p style="position:absolute;left:36px;bottom:34px;width:430px">Gợi ý: phim ảnh, bài hát, trải nghiệm cá nhân.</p></div>
    <div class="metric" style="left:710px;top:238px;width:170px;height:116px"><p>Thời lượng</p><div class="num">3′</div></div>
    <div class="metric" style="left:910px;top:238px;width:220px;height:116px"><p>Hình thức</p><div class="num" style="font-size:28px">Cả lớp</div></div>
    <p class="cn" style="position:absolute;right:88px;bottom:92px;font-size:118px;color:rgba(16,24,40,.08)">你好</p>`],
  ['02-objectives.html', ...modules[1], 'Mục tiêu bài học', `
    ${[['Chào hỏi', 'Dùng 你好 trong tình huống gặp mặt.'], ['Đọc từ', 'Nhận biết và đọc 12 từ vựng cơ bản.'], ['Viết chữ', 'Viết 一、八、大、不、五、口、白、女、马、你、好.']].map((x,i)=>`<div class="card ${i===0?'blue':i===1?'green':'amber'}" style="left:${78+i*382}px;top:242px;width:320px;height:214px"><p class="caption" style="position:absolute;left:26px;top:24px">Mục tiêu 0${i+1}</p><h2 style="position:absolute;left:26px;top:58px">${esc(x[0])}</h2><p style="position:absolute;left:28px;right:26px;bottom:28px">${esc(x[1])}</p></div>`).join('')}
    <div class="bar" style="left:112px;top:520px;width:960px"></div><div class="fill" style="left:112px;top:520px;width:960px;background:#10B981"></div>`],
  ['03-pinyin.html', ...modules[2], 'Ngữ âm: nhận diện âm và thanh', `
    <div class="card blue" style="left:86px;top:230px;width:438px;height:254px"><p class="pin" style="position:absolute;left:34px;top:30px;font-size:54px">nǐ hǎo</p><p class="cn" style="position:absolute;left:36px;top:112px;font-size:82px;line-height:1">你好</p><p style="position:absolute;left:38px;bottom:32px">Đặt pinyin trên chữ Hán, đọc trước khi giải nghĩa.</p></div>
    <div class="card" style="left:596px;top:230px;width:500px;height:254px"><p class="caption" style="position:absolute;left:32px;top:28px">Điểm chú ý</p><h2 style="position:absolute;left:32px;top:64px;width:390px">Thanh 3 trong 你好</h2><p style="position:absolute;left:34px;top:124px;width:380px">Khi đọc liền, nǐ hǎo thường nghe gần như ní hǎo. Dạy nhẹ, không phân tích quá sâu.</p></div>`],
  ['04-pinyin-practice.html', ...modules[3], 'Luyện ngữ âm', `
    ${exercises.slice(0,5).map((e,i)=>`<div class="card ${i%2?'green':'blue'}" style="left:${76+(i%3)*360}px;top:${218+Math.floor(i/3)*150}px;width:310px;height:112px"><p class="caption" style="position:absolute;left:22px;top:18px">${esc(e.record_id)} · p.${esc(e.source_page)}</p><h3 style="position:absolute;left:22px;top:46px;width:250px">${esc(e.vietnamese)}</h3></div>`).join('')}
    <div class="chip" style="left:780px;top:520px;width:250px;height:44px"><p>Nghe · lặp lại · phân biệt</p></div>`],
  ['05-vocabulary.html', ...modules[4], 'Từ vựng: 12 từ mới', `
    <div class="card" style="left:58px;top:198px;width:1110px;height:370px">${vocab.map((v,i)=>`<div class="panel ${i<3?'amber':i<6?'blue':i<9?'green':'rose'}" style="left:${26+(i%6)*176}px;top:${26+Math.floor(i/6)*158}px;width:140px;height:124px"><p class="pin" style="position:absolute;left:8px;top:10px;width:122px;text-align:center;font-size:18px">${esc(v.pinyin)}</p><p class="cn" style="position:absolute;left:8px;top:42px;width:122px;text-align:center;font-size:44px;line-height:1">${esc(v.chinese_simplified)}</p><p style="position:absolute;left:8px;right:8px;bottom:10px;text-align:center;font-size:13px;line-height:1.1;color:#101828;font-weight:800">${esc(v.word_type_vi.replace('thành ngữ','cụm từ'))}</p></div>`).join('')}</div>`],
  ['06-vocabulary-practice.html', ...modules[5], 'Luyện từ vựng', `
    ${[['Ghép thẻ', 'Chữ Hán ↔ Pinyin ↔ Nghĩa tiếng Việt', '5′'], ['Luyện số', 'Nhận biết 一、五、八', '4′'], ['Cặp đối lập', '好/不好 · 大/不大', '4′']].map((x,i)=>`<div class="card ${i===0?'blue':i===1?'green':'amber'}" style="left:${82+i*370}px;top:230px;width:310px;height:230px"><p class="caption" style="position:absolute;left:26px;top:24px">${esc(x[2])}</p><h2 style="position:absolute;left:26px;top:62px">${esc(x[0])}</h2><p style="position:absolute;left:28px;right:24px;bottom:34px">${esc(x[1])}</p></div>`).join('')}`],
  ['07-grammar.html', ...modules[6], 'Ngữ pháp', `
    <div class="card" style="left:118px;top:236px;width:455px;height:230px"><p class="caption" style="position:absolute;left:32px;top:30px">Bài 1</p><h2 style="position:absolute;left:32px;top:66px;width:350px">Không có điểm ngữ pháp chính thức</h2><p style="position:absolute;left:34px;bottom:34px;width:350px">Chỉ giới thiệu nhẹ cấu trúc 不 + tính từ khi luyện từ vựng.</p></div>
    <div class="card amber" style="left:660px;top:236px;width:342px;height:230px"><p class="pin" style="position:absolute;left:34px;top:38px;font-size:34px">bù hǎo</p><p class="cn" style="position:absolute;left:36px;top:92px;font-size:60px">不好</p><p style="position:absolute;left:38px;bottom:34px;font-weight:800;color:#101828">không tốt</p></div>`],
  ['08-grammar-practice.html', ...modules[7], 'Luyện ngữ pháp', `
    <div class="card green" style="left:96px;top:222px;width:492px;height:262px"><h2 style="position:absolute;left:34px;top:34px">Phản xạ với 不</h2><p style="position:absolute;left:36px;top:96px;width:360px">Giảng viên nói tính từ. Sinh viên thêm 不 phía trước.</p><p class="cn" style="position:absolute;left:36px;bottom:34px;font-size:42px">好 → 不好 · 大 → 不大</p></div>
    <div class="metric" style="left:706px;top:244px;width:250px;height:120px"><p>Thời lượng</p><div class="num">4′</div></div>
    <div class="metric" style="left:706px;top:390px;width:300px;height:120px"><p>Hình thức</p><div class="num" style="font-size:30px">Cả lớp</div></div>`],
  ['09-text-preview.html', ...modules[8], 'Giới thiệu bài khóa', `
    <div class="card blue" style="left:110px;top:230px;width:520px;height:250px"><h2 style="position:absolute;left:34px;top:34px">Nghe hội thoại 你好</h2><p style="position:absolute;left:36px;top:102px;width:420px">Sinh viên đoán: ai đang nói, ở đâu, khi nào người ta chào nhau?</p></div>
    <div class="card" style="left:718px;top:230px;width:340px;height:250px"><p class="caption" style="position:absolute;left:30px;top:30px">Câu hỏi</p><p style="position:absolute;left:32px;top:74px;width:250px;font-weight:850;color:#101828">Khi gặp bạn bè, bạn nói gì bằng tiếng Trung?</p></div>`],
  ['10-text.html', ...modules[9], 'Bài đọc', `
    <div class="card blue" style="left:146px;top:224px;width:390px;height:144px;border-radius:24px"><p style="position:absolute;left:28px;top:24px;font-weight:900;color:#101828">A</p><p class="pin" style="position:absolute;left:88px;top:24px;font-size:34px">nǐ hǎo</p><p class="cn" style="position:absolute;left:88px;top:76px;font-size:50px">你好</p></div>
    <div class="card amber" style="left:590px;top:364px;width:390px;height:144px;border-radius:24px"><p style="position:absolute;left:28px;top:24px;font-weight:900;color:#101828">B</p><p class="pin" style="position:absolute;left:88px;top:24px;font-size:34px">nǐ hǎo</p><p class="cn" style="position:absolute;left:88px;top:76px;font-size:50px">你好</p></div>
    <div class="line" style="left:528px;top:358px;width:98px;transform:rotate(20deg);background:#2563EB;height:4px"></div>`],
  ['11-culture.html', ...modules[10], 'Văn hóa bổ sung', `
    <div class="card" style="left:92px;top:220px;width:488px;height:270px"><p class="caption" style="position:absolute;left:30px;top:28px">Việt Nam</p><h2 style="position:absolute;left:30px;top:64px;width:340px">Chào theo tuổi và quan hệ</h2><p style="position:absolute;left:32px;bottom:32px;width:370px">anh, chị, em, cô, chú...</p></div>
    <div class="card green" style="left:662px;top:220px;width:430px;height:270px"><p class="caption" style="position:absolute;left:30px;top:28px">Trung Quốc</p><h2 style="position:absolute;left:30px;top:64px;width:300px">你好 trung tính hơn</h2><p style="position:absolute;left:32px;bottom:32px;width:320px">您好 dùng lịch sự hơn, học sau.</p></div>`],
  ['12-discussion.html', ...modules[11], 'Thảo luận', `
    <div class="card amber" style="left:104px;top:224px;width:518px;height:262px"><h2 style="position:absolute;left:34px;top:34px">Bạn thường chào ai?</h2><p style="position:absolute;left:36px;top:104px;width:390px">Bạn bè, thầy cô, người lạ. Cách chào có khác nhau không?</p></div>
    <div class="metric" style="left:728px;top:242px;width:220px;height:116px"><p>Thời lượng</p><div class="num">5′</div></div>
    <div class="metric" style="left:728px;top:384px;width:260px;height:116px"><p>Hình thức</p><div class="num" style="font-size:30px">Cặp đôi</div></div>`],
  ['13-homework.html', ...modules[12], 'Giới thiệu bài tập về nhà', `
    <div class="card blue" style="left:78px;top:216px;width:360px;height:284px"><p class="caption" style="position:absolute;left:28px;top:28px">Trong sách</p><h2 style="position:absolute;left:28px;top:66px">E001-E007</h2><p style="position:absolute;left:30px;bottom:34px;width:270px">Hoàn thành trang 28-30.</p></div>
    <div class="card green" style="left:478px;top:216px;width:330px;height:284px"><p class="caption" style="position:absolute;left:28px;top:28px">Viết chữ</p><h2 style="position:absolute;left:28px;top:66px">一八大不</h2><p style="position:absolute;left:30px;bottom:34px;width:250px">Viết từ trí nhớ, kiểm tra nét.</p></div>
    <div class="card amber" style="left:848px;top:216px;width:300px;height:284px"><p class="caption" style="position:absolute;left:28px;top:28px">Tự luyện</p><h2 style="position:absolute;left:28px;top:66px">12 từ</h2><p style="position:absolute;left:30px;bottom:34px;width:220px">Đọc to mỗi ngày.</p></div>`],
];

for (const [file, num, id, vi, zh, title, body] of slideDefs) {
  await fs.writeFile(path.join(slidesDir, file), shell(num, vi, zh, title, body), 'utf8');
}

const browser = await chromium.launch(process.platform === 'darwin' ? { channel: 'chrome' } : {});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
const screenshots = [];
for (const [file] of slideDefs) {
  await page.goto(`file://${path.join(slidesDir, file)}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(200);
  const out = path.join(shotsDir, file.replace('.html', '.png'));
  await page.screenshot({ path: out, fullPage: false });
  screenshots.push(out);
}
await browser.close();

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'AI Teaching Material System';
pptx.subject = 'Lesson 1 modern business deck';
pptx.title = 'Bài 1 你好 · Modern Business';
for (const img of screenshots) {
  const slide = pptx.addSlide();
  slide.background = { color: 'F4F7FB' };
  slide.addImage({ path: img, x: 0, y: 0, w: 13.333, h: 7.5 });
}
await pptx.writeFile({ fileName: path.join(outDir, 'lesson-01-modern-business.pptx') });

const manifest = slideDefs.map(([file], i) => `    { file: "slides/${file}", label: "${String(i + 1).padStart(2, '0')}" }`).join(',\n');
await fs.writeFile(path.join(outDir, 'index.html'), `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Lesson 1 Modern Business</title><script>window.DECK_MANIFEST=[\n${manifest}\n];window.DECK_WIDTH=1280;window.DECK_HEIGHT=720;</script><style>*{box-sizing:border-box;margin:0;padding:0}html,body{height:100%;background:#0B1220;overflow:hidden;font-family:Aptos,Arial,sans-serif}#stage{position:fixed;top:0;left:0;transform-origin:top left;width:1280px;height:720px;background:white;box-shadow:0 10px 70px rgba(0,0,0,.5)}iframe{width:100%;height:100%;border:0}.counter{position:fixed;right:18px;bottom:18px;background:rgba(0,0,0,.75);color:white;border-radius:999px;padding:7px 13px;font-size:13px;z-index:10}.nav{position:fixed;top:0;bottom:0;width:18%;z-index:8;cursor:pointer}.nav.left{left:0}.nav.right{right:0}</style></head><body><div id="stage"><iframe id="frame"></iframe></div><div class="nav left" id="prev"></div><div class="nav right" id="next"></div><div class="counter" id="counter"></div><script>(()=>{const W=window.DECK_WIDTH,H=window.DECK_HEIGHT,deck=window.DECK_MANIFEST,stage=document.getElementById('stage'),frame=document.getElementById('frame'),counter=document.getElementById('counter');let current=Math.max(0,Math.min(deck.length-1,Number(location.hash.slice(1)||1)-1));function fit(){const s=Math.min(innerWidth/W,innerHeight/H);stage.style.transform='translate('+((innerWidth-W*s)/2)+'px,'+((innerHeight-H*s)/2)+'px) scale('+s+')'}function show(i){if(i<0||i>=deck.length)return;current=i;frame.src=deck[i].file;counter.textContent=(i+1)+' / '+deck.length;history.replaceState(null,'','#'+(i+1))}addEventListener('resize',fit);addEventListener('keydown',e=>{if(['ArrowRight',' ','PageDown'].includes(e.key))show(current+1);if(['ArrowLeft','PageUp'].includes(e.key))show(current-1)});document.getElementById('prev').onclick=()=>show(current-1);document.getElementById('next').onclick=()=>show(current+1);fit();show(current)})();</script></body></html>`, 'utf8');

await fs.writeFile(path.join(outDir, 'README.md'), `# Lesson 1 · Modern Business Deck\n\nOutput follows the regulated 13-module lesson structure from \`03_lesson_structure.csv\`.\n\n- PPTX: \`lesson-01-modern-business.pptx\`\n- HTML preview: \`index.html\`\n- Source slides: \`slides/*.html\`\n- Screenshots: \`screenshots/*.png\`\n\nModules:\n${modules.map(m => `- ${m[0]} · ${m[2]} · ${m[3]}`).join('\n')}\n`, 'utf8');

console.log(`Created ${outDir}`);
