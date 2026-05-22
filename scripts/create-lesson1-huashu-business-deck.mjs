#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const root = process.cwd();
const lessonDir = path.join(root, 'output/vp-database/lesson-01');
const outDir = path.join(root, 'output/lesson-01-huashu-business');
const slidesDir = path.join(outDir, 'slides');
await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(slidesDir, { recursive: true });

function parseCsv(text) {
  text = text.replace(/^\uFEFF/, '');
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (quoted) {
      if (c === '"' && n === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const header = rows.shift();
  return rows.filter(r => r.length && r.some(Boolean)).map(r => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

const readCsv = async file => parseCsv(await fs.readFile(path.join(lessonDir, file), 'utf8'));
const lessonList = await readCsv('01_lesson_list.csv');
const content = await readCsv('02_content_items.csv');
const structure = await readCsv('03_lesson_structure.csv');
const activities = await readCsv('04_supplemental_activities.csv');
const games = await readCsv('05_game_suggestions.csv');
const sheetRows = await readCsv('06_google_sheets_database.csv');

const lesson = lessonList[0];
const vocab = content.filter(x => x.record_type === 'vocabulary').sort((a, b) => Number(a.teaching_order) - Number(b.teaching_order));
const exercises = content.filter(x => x.record_type === 'exercise').sort((a, b) => Number(a.teaching_order) - Number(b.teaching_order));
const text = content.find(x => x.record_type === 'text');
const act = id => activities.find(x => x.activity_id === id);
const game = id => games.find(x => x.linked_activity_id === id);
const byHan = Object.fromEntries(vocab.map(x => [x.chinese_simplified, x]));
const w = han => byHan[han];
const esc = (s = '') => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sourceFor = ids => ids.map(id => content.find(x => x.record_id === id)).filter(Boolean).map(x => `${x.record_id}: p.${x.source_page_range || x.source_page}`).join('; ');

const css = `
*{box-sizing:border-box;margin:0;padding:0}
body{width:960pt;height:540pt;overflow:hidden;background:#F5F7FA;color:#111827;font-family:Aptos,Inter,"PingFang SC","Noto Sans SC","Microsoft YaHei",Arial,sans-serif;position:relative}
.slide{position:absolute;inset:0;overflow:hidden}
.top{position:absolute;left:0;top:0;width:960pt;height:46pt;background:#0F172A}
.brand{position:absolute;left:42pt;top:16pt}
.brand p{font-size:8.5pt;letter-spacing:.12em;color:#E5E7EB;font-weight:800}
.count{position:absolute;right:42pt;top:11pt;height:24pt;padding:0 12pt;border:1pt solid rgba(255,255,255,.25);border-radius:999pt}
.count p{font-size:8.5pt;line-height:24pt;color:#E5E7EB;font-weight:800}
.wrap{position:absolute;left:42pt;right:42pt;top:78pt;bottom:38pt}
.kicker{position:absolute;left:0;top:0;height:20pt;padding:0 9pt;border-radius:999pt;background:#EAF2FF}
.kicker p{font-size:8.2pt;line-height:20pt;color:#1D4ED8;font-weight:850;letter-spacing:.08em}
h1{position:absolute;left:0;top:30pt;width:560pt;font-size:31pt;line-height:1.04;color:#111827;font-weight:850}
h2{font-size:22pt;line-height:1.08;color:#111827;font-weight:850}
h3{font-size:15.5pt;line-height:1.15;color:#111827;font-weight:850}
p{font-size:13.6pt;line-height:1.31;color:#4B5563}
.small{font-size:9pt;line-height:1.25;color:#6B7280}
.cn{font-family:"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif;font-weight:900;color:#111827}
.pin{color:#2563EB;font-weight:850}
.card{position:absolute;background:#fff;border:1pt solid #D8DEE8;border-radius:8pt;box-shadow:0 8pt 24pt rgba(15,23,42,.07)}
.panel{position:absolute;background:#fff;border:1pt solid #D8DEE8;border-radius:6pt}
.blue{background:#EAF2FF}.green{background:#EAF8F1}.amber{background:#FFF4D8}.rose{background:#FFE8EC}.slate{background:#EEF2F7}
.label p{font-size:8.3pt;text-transform:uppercase;letter-spacing:.08em;color:#2563EB;font-weight:850}
.chip{position:absolute;border-radius:999pt;background:#FFFFFF;border:1pt solid #C7D2FE}
.chip p{font-size:9.5pt;line-height:23pt;text-align:center;color:#1D4ED8;font-weight:850}
.section-band{position:absolute;right:0;top:0;width:250pt;height:330pt;background:#0F172A;border-radius:10pt}
.footer{position:absolute;left:42pt;right:42pt;bottom:14pt;border-top:1pt solid #D8DEE8;padding-top:7pt}
.footer p{font-size:7.8pt;color:#8A94A6;text-align:right}
`;

function slide(file, n, total, moduleName, title, body, footer = '') {
  return [`${String(n).padStart(2, '0')}-${file}.html`, `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${css}</style></head><body><main class="slide"><div class="top"><div class="brand"><p>BÀI 1 · 你好 · HUASHU BUSINESS</p></div><div class="count"><p>${String(n).padStart(2, '0')} / ${String(total).padStart(2, '0')} · ${esc(moduleName)}</p></div></div><div class="wrap">${body}</div><div class="footer"><p>${esc(footer || lesson.lesson_title)}</p></div></main></body></html>`];
}

function titleBlock(moduleName, title) {
  return `<div class="kicker"><p>${esc(moduleName)}</p></div><h1>${esc(title)}</h1>`;
}

function vocabMini(item, x, y, bg = 'blue') {
  return `<div class="panel ${bg}" style="left:${x}pt;top:${y}pt;width:118pt;height:82pt">
    <p class="pin" style="position:absolute;left:8pt;top:8pt;width:100pt;text-align:center;font-size:12pt">${esc(item.pinyin)}</p>
    <p class="cn" style="position:absolute;left:8pt;top:29pt;width:100pt;text-align:center;font-size:29pt;line-height:1">${esc(item.chinese_simplified)}</p>
    <p style="position:absolute;left:7pt;right:7pt;bottom:7pt;text-align:center;font-size:8.4pt;line-height:1.08;color:#111827;font-weight:800">${esc(item.vietnamese)}</p>
  </div>`;
}

const slides = [];
const total = 20;
let n = 1;

slides.push(slide('cover', n++, total, 'Tổng quan', 'Bài 1 · 你好', `
  ${titleBlock('第一课 · Xin chào', 'Bài 1 · 你好')}
  <p class="pin" style="position:absolute;left:2pt;top:96pt;font-size:30pt">nǐ hǎo</p>
  <p style="position:absolute;left:2pt;top:142pt;width:360pt;font-size:18pt;color:#111827;font-weight:800">Lời chào đầu tiên, 12 từ vựng cơ bản, bài đọc ngắn và hoạt động luyện tập.</p>
  <div class="section-band"><p class="cn" style="position:absolute;left:26pt;top:32pt;font-size:92pt;color:#fff;line-height:.95">你</p><p class="cn" style="position:absolute;right:28pt;bottom:30pt;font-size:92pt;color:#93C5FD;line-height:.95">好</p></div>
  <div class="card amber" style="left:0;top:268pt;width:190pt;height:74pt"><h3 style="position:absolute;left:14pt;top:13pt">Nguồn</h3><p style="position:absolute;left:14pt;top:39pt;font-size:11pt">p.19-30</p></div>
  <div class="card green" style="left:214pt;top:268pt;width:190pt;height:74pt"><h3 style="position:absolute;left:14pt;top:13pt">Từ vựng</h3><p style="position:absolute;left:14pt;top:39pt;font-size:11pt">12 mục</p></div>
`, lesson.lesson_title));

slides.push(slide('lesson-flow', n++, total, 'Cấu trúc', 'Tiến trình theo dữ liệu đã duyệt', `
  ${titleBlock('LESSON FLOW', 'Tiến trình theo dữ liệu đã duyệt')}
  <div class="card" style="left:0;top:108pt;width:794pt;height:230pt">
    ${structure.filter(m => m.status !== 'skip').map((m, i) => `<div class="panel ${i % 2 ? 'slate' : 'blue'}" style="left:${18 + (i % 4) * 190}pt;top:${20 + Math.floor(i / 4) * 64}pt;width:170pt;height:48pt"><p style="position:absolute;left:10pt;top:8pt;font-size:8.5pt;font-weight:850;color:#2563EB">${esc(m.module_order.padStart(2, '0'))}</p><p style="position:absolute;left:34pt;top:8pt;font-size:11.2pt;font-weight:850;color:#111827">${esc(m.module_name_vi)}</p><p style="position:absolute;left:34pt;top:25pt;font-size:8.6pt;color:#6B7280">${esc(m.module_name_zh)}</p></div>`).join('')}
  </div>
`, 'Generated from 03_lesson_structure.csv; skipped modules are excluded from classroom slides.'));

slides.push(slide('warmup', n++, total, 'Khởi động', act('ACT001').title_vi, `
  ${titleBlock('KHỞI ĐỘNG · 暖身活动', act('ACT001').title_vi)}
  <div class="card amber" style="left:0;top:112pt;width:494pt;height:172pt"><p style="position:absolute;left:24pt;top:25pt;width:400pt;font-size:23pt;line-height:1.12;font-weight:850;color:#111827">Bạn đã biết câu chào nào bằng tiếng Trung chưa?</p><p style="position:absolute;left:26pt;bottom:22pt;width:360pt">${esc(act('ACT001').description_vi)}</p></div>
  <div class="card" style="right:28pt;top:116pt;width:220pt;height:74pt"><p class="small" style="position:absolute;left:16pt;top:13pt;font-weight:850">Thời lượng</p><h2 style="position:absolute;left:16pt;top:32pt">3 phút</h2></div>
  <div class="card green" style="right:28pt;top:210pt;width:220pt;height:74pt"><p class="small" style="position:absolute;left:16pt;top:13pt;font-weight:850">Tương tác</p><h3 style="position:absolute;left:16pt;top:37pt">Cả lớp</h3></div>
`, 'ACT001 · generated activity'));

slides.push(slide('objectives', n++, total, 'Mục tiêu', 'Sau bài học, sinh viên có thể...', `
  ${titleBlock('MỤC TIÊU · 学习目标', 'Sau bài học, sinh viên có thể...')}
  ${[
    ['01', 'Chào hỏi bằng tiếng Trung: 你好'],
    ['02', 'Nhận biết và đọc 12 từ vựng cơ bản'],
    ['03', 'Viết chữ Hán: 一、八、大、不、五、口、白、女、马、你、好']
  ].map((x, i) => `<div class="card ${i === 0 ? 'blue' : i === 1 ? 'green' : 'amber'}" style="left:${i * 270}pt;top:122pt;width:244pt;height:176pt"><p class="cn" style="position:absolute;left:18pt;top:14pt;font-size:26pt;color:#2563EB">${x[0]}</p><h3 style="position:absolute;left:20pt;top:62pt;width:190pt">${esc(x[1])}</h3></div>`).join('')}
`, 'Objectives generated from lesson content p.19-30'));

slides.push(slide('vocab-overview', n++, total, 'Từ vựng', '12 từ vựng theo thứ tự giáo trình', `
  ${titleBlock('TỪ VỰNG · 生词', '12 từ vựng theo thứ tự giáo trình')}
  <div class="card" style="left:0;top:108pt;width:816pt;height:258pt">
    ${vocab.map((item, i) => vocabMini(item, 14 + (i % 6) * 130, 16 + Math.floor(i / 6) * 112, i < 3 ? 'amber' : i < 6 ? 'blue' : i < 9 ? 'green' : 'rose')).join('')}
  </div>
`, sourceFor(vocab.map(x => x.record_id))));

[['你', '好'], ['你好'], ['一', '五', '八'], ['大', '不'], ['口', '白', '女', '马']].forEach((group, idx) => {
  const title = idx === 0 ? '你 và 好' : idx === 1 ? 'Cụm chào hỏi 你好' : idx === 2 ? 'Số đếm 一、五、八' : idx === 3 ? 'Tính từ và phủ định' : 'Danh từ và tính từ còn lại';
  slides.push(slide(`vocab-${idx + 1}`, n++, total, 'Từ vựng', title, `
    ${titleBlock('TỪ VỰNG · 生词', title)}
    ${group.map((han, i) => {
      const item = w(han);
      return `<div class="card ${i % 2 ? 'green' : 'blue'}" style="left:${i * 200}pt;top:118pt;width:176pt;height:206pt"><p class="pin" style="position:absolute;left:20pt;top:18pt;font-size:18pt">${esc(item.pinyin)}</p><p class="cn" style="position:absolute;left:20pt;top:54pt;font-size:${han.length > 1 ? '54' : '68'}pt;line-height:.95">${esc(item.chinese_simplified)}</p><p style="position:absolute;left:22pt;right:18pt;bottom:42pt;font-weight:850;color:#111827">${esc(item.vietnamese)}</p><p class="small" style="position:absolute;left:22pt;bottom:18pt">${esc(item.word_type_vi.replace('thành ngữ', 'cụm từ'))}</p></div>`;
    }).join('')}
    ${idx === 1 ? '<div class="card amber" style="right:42pt;top:150pt;width:250pt;height:120pt"><h3 style="position:absolute;left:18pt;top:18pt">Cách dạy</h3><p style="position:absolute;left:18pt;top:50pt;width:190pt">Dạy 你好 như một cụm từ cố định: “Xin chào”.</p></div>' : ''}
  `, sourceFor(group.map(h => w(h).record_id))));
});

slides.push(slide('vocab-practice-cards', n++, total, 'Luyện từ vựng', act('ACT002').title_vi, `
  ${titleBlock('LUYỆN TỪ VỰNG · 生词练习', act('ACT002').title_vi)}
  <div class="card blue" style="left:0;top:116pt;width:360pt;height:198pt"><h2 style="position:absolute;left:24pt;top:24pt">Ghép 3 lớp</h2><p style="position:absolute;left:26pt;top:78pt;width:280pt">${esc(act('ACT002').description_vi)}</p></div>
  <div class="card" style="left:410pt;top:116pt;width:180pt;height:198pt"><p class="small" style="position:absolute;left:18pt;top:20pt;font-weight:850">Chuẩn bị</p><p style="position:absolute;left:18pt;top:50pt;width:130pt">${esc(act('ACT002').materials_needed)}</p></div>
  <div class="card green" style="left:630pt;top:116pt;width:180pt;height:198pt"><p class="small" style="position:absolute;left:18pt;top:20pt;font-weight:850">Game</p><h3 style="position:absolute;left:18pt;top:52pt">${esc(game('ACT002').game_name_vi)}</h3><p style="position:absolute;left:18pt;top:90pt;font-size:11pt">${esc(game('ACT002').platform)} · ${esc(game('ACT002').question_count)} câu</p></div>
`, 'ACT002 · G001'));

slides.push(slide('vocab-practice-numbers', n++, total, 'Luyện từ vựng', act('ACT003').title_vi, `
  ${titleBlock('LUYỆN TỪ VỰNG · 生词练习', act('ACT003').title_vi)}
  ${['一', '五', '八'].map((han, i) => {
    const item = w(han);
    return `<div class="card ${i === 0 ? 'amber' : i === 1 ? 'blue' : 'rose'}" style="left:${i * 210}pt;top:122pt;width:184pt;height:190pt"><p class="pin" style="position:absolute;left:22pt;top:18pt;font-size:18pt">${esc(item.pinyin)}</p><p class="cn" style="position:absolute;left:22pt;top:52pt;font-size:74pt;line-height:.9">${esc(han)}</p><p style="position:absolute;left:24pt;bottom:24pt;font-weight:850;color:#111827">${esc(item.vietnamese)}</p></div>`;
  }).join('')}
  <div class="card green" style="right:32pt;top:146pt;width:190pt;height:126pt"><h3 style="position:absolute;left:16pt;top:16pt">${esc(game('ACT003').game_name_vi)}</h3><p style="position:absolute;left:16pt;top:52pt;font-size:11pt;width:140pt">${esc(game('ACT003').description_vi)}</p></div>
`, 'ACT003 · G002'));

slides.push(slide('vocab-practice-negation', n++, total, 'Luyện từ vựng', act('ACT004').title_vi, `
  ${titleBlock('LUYỆN TỪ VỰNG · 生词练习', act('ACT004').title_vi)}
  <div class="card blue" style="left:0;top:132pt;width:236pt;height:150pt"><p class="pin" style="position:absolute;left:24pt;top:24pt;font-size:20pt">hǎo</p><p class="cn" style="position:absolute;left:24pt;top:62pt;font-size:46pt">好</p></div>
  <div class="card amber" style="left:290pt;top:132pt;width:236pt;height:150pt"><p class="pin" style="position:absolute;left:24pt;top:24pt;font-size:20pt">bù hǎo</p><p class="cn" style="position:absolute;left:24pt;top:62pt;font-size:46pt">不好</p></div>
  <div class="card green" style="left:580pt;top:132pt;width:236pt;height:150pt"><h3 style="position:absolute;left:20pt;top:24pt">${esc(game('ACT004').game_name_vi)}</h3><p style="position:absolute;left:20pt;top:62pt;width:170pt">${esc(game('ACT004').question_count)} câu · ${esc(game('ACT004').estimated_minutes)} phút</p></div>
`, 'ACT004 · G003'));

slides.push(slide('text-preview', n++, total, 'Giới thiệu bài khóa', act('ACT005').title_vi, `
  ${titleBlock('GIỚI THIỆU BÀI KHÓA · 课文预习', act('ACT005').title_vi)}
  <div class="card blue" style="left:0;top:116pt;width:420pt;height:176pt"><h2 style="position:absolute;left:24pt;top:22pt">Nghe trước</h2><p style="position:absolute;left:26pt;top:76pt;width:320pt">${esc(act('ACT005').description_vi)}</p></div>
  <div class="card" style="left:480pt;top:116pt;width:280pt;height:176pt"><h3 style="position:absolute;left:20pt;top:24pt">Câu hỏi gợi ý</h3><p style="position:absolute;left:20pt;top:64pt;width:210pt">Ai đang nói? Ở đâu? Khi nào người ta chào nhau?</p></div>
`, 'ACT005'));

slides.push(slide('text-dialogue', n++, total, 'Bài đọc', 'Hội thoại: 你好 / 你好', `
  ${titleBlock('BÀI ĐỌC · 课文', 'Hội thoại: 你好 / 你好')}
  <div class="card blue" style="left:72pt;top:126pt;width:300pt;height:104pt;border-radius:14pt"><p style="position:absolute;left:20pt;top:18pt;font-weight:850;color:#111827">A</p><p class="pin" style="position:absolute;left:66pt;top:17pt;font-size:18pt">nǐ hǎo</p><p class="cn" style="position:absolute;left:66pt;top:50pt;font-size:34pt">你好</p></div>
  <div class="card amber" style="left:430pt;top:236pt;width:300pt;height:104pt;border-radius:14pt"><p style="position:absolute;left:20pt;top:18pt;font-weight:850;color:#111827">B</p><p class="pin" style="position:absolute;left:66pt;top:17pt;font-size:18pt">nǐ hǎo</p><p class="cn" style="position:absolute;left:66pt;top:50pt;font-size:34pt">你好</p></div>
`, sourceFor(['T001'])));

slides.push(slide('culture', n++, total, 'Văn hóa bổ sung', act('ACT006').title_vi, `
  ${titleBlock('VĂN HÓA BỔ SUNG · 文化补充', act('ACT006').title_vi)}
  <div class="card" style="left:0;top:126pt;width:360pt;height:170pt"><p class="label" style="position:absolute;left:22pt;top:20pt"><span></span></p><h2 style="position:absolute;left:22pt;top:34pt">Việt Nam</h2><p style="position:absolute;left:24pt;top:86pt;width:270pt">Chào theo tuổi và quan hệ: anh, chị, em, cô, chú...</p></div>
  <div class="card green" style="left:440pt;top:126pt;width:360pt;height:170pt"><h2 style="position:absolute;left:22pt;top:34pt">Trung Quốc</h2><p style="position:absolute;left:24pt;top:86pt;width:270pt">Dùng 你好 cho nhiều tình huống. 您好 là dạng lịch sự.</p></div>
`, 'ACT006'));

slides.push(slide('discussion', n++, total, 'Thảo luận', act('ACT007').title_vi, `
  ${titleBlock('THẢO LUẬN · 课程讨论', act('ACT007').title_vi)}
  <div class="card amber" style="left:0;top:124pt;width:500pt;height:174pt"><h2 style="position:absolute;left:26pt;top:28pt">Bạn thường chào ai?</h2><p style="position:absolute;left:28pt;top:86pt;width:390pt">${esc(act('ACT007').description_vi)}</p></div>
  <div class="card green" style="right:44pt;top:136pt;width:210pt;height:136pt"><p class="small" style="position:absolute;left:16pt;top:18pt;font-weight:850">Hình thức</p><h3 style="position:absolute;left:16pt;top:48pt">Làm theo cặp</h3><p style="position:absolute;left:16pt;top:82pt;font-size:11pt">5 phút</p></div>
`, 'ACT007'));

slides.push(slide('exercises-overview', n++, total, 'Bài tập', 'Bài tập trong giáo trình', `
  ${titleBlock('BÀI TẬP · 课后作业说明', 'Bài tập trong giáo trình')}
  <div class="card" style="left:0;top:112pt;width:812pt;height:248pt">
    ${exercises.map((e, i) => `<div class="panel ${i % 2 ? 'green' : 'blue'}" style="left:${16 + (i % 4) * 194}pt;top:${18 + Math.floor(i / 4) * 104}pt;width:176pt;height:82pt"><p class="small" style="position:absolute;left:10pt;top:8pt;font-weight:850">${esc(e.record_id)} · p.${esc(e.source_page)}</p><h3 style="position:absolute;left:10pt;top:30pt;width:142pt;font-size:13.2pt">${esc(e.vietnamese)}</h3></div>`).join('')}
  </div>
`, sourceFor(exercises.map(x => x.record_id))));

slides.push(slide('homework', n++, total, 'Bài tập về nhà', 'Viết chữ Hán 一八大不 từ trí nhớ', `
  ${titleBlock('BÀI TẬP VỀ NHÀ · 课后作业说明', act('ACT008').title_vi)}
  <div class="card blue" style="left:0;top:120pt;width:262pt;height:178pt"><h2 style="position:absolute;left:22pt;top:24pt">E001-E007</h2><p style="position:absolute;left:24pt;top:82pt;width:190pt">Hoàn thành bài tập trang 28-30.</p></div>
  <div class="card green" style="left:304pt;top:120pt;width:262pt;height:178pt"><h2 style="position:absolute;left:22pt;top:24pt">一八大不</h2><p style="position:absolute;left:24pt;top:82pt;width:190pt">${esc(act('ACT008').description_vi)}</p></div>
  <div class="card amber" style="left:608pt;top:120pt;width:210pt;height:178pt"><h2 style="position:absolute;left:22pt;top:24pt">12 từ</h2><p style="position:absolute;left:24pt;top:82pt;width:150pt">Luyện đọc to mỗi ngày.</p></div>
`, 'ACT008 · E001-E007 p.28-30'));

slides.push(slide('closing', n++, total, 'Kết thúc', '下次见', `
  ${titleBlock('KẾT THÚC', 'Hẹn buổi sau')}
  <p class="cn" style="position:absolute;left:0;top:116pt;font-size:90pt;line-height:1;color:#111827">下次见</p>
  <p style="position:absolute;left:8pt;top:230pt;font-size:18pt;color:#111827;font-weight:850">Ôn lại 你好 và 12 từ vựng trước buổi sau.</p>
  <div class="card blue" style="right:40pt;top:118pt;width:260pt;height:146pt"><h3 style="position:absolute;left:20pt;top:22pt">Checklist</h3><p style="position:absolute;left:20pt;top:58pt;width:190pt">Đọc · Nhận mặt chữ · Viết chữ Hán</p></div>
`, lesson.lesson_title));

if (slides.length !== total) throw new Error(`Expected ${total} slides, got ${slides.length}`);

for (const [file, html] of slides) await fs.writeFile(path.join(slidesDir, file), html, 'utf8');

const manifest = slides.map(([file], i) => `    { file: "slides/${file}", label: "${String(i + 1).padStart(2, '0')}" }`).join(',\n');
await fs.writeFile(path.join(outDir, 'index.html'), `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Lesson 1 Huashu Business</title><script>window.DECK_MANIFEST=[\n${manifest}\n];window.DECK_WIDTH=1280;window.DECK_HEIGHT=720;</script><style>*{box-sizing:border-box;margin:0;padding:0}html,body{height:100%;background:#0F172A;overflow:hidden;font-family:Aptos,Arial,sans-serif}#stage{position:fixed;top:0;left:0;transform-origin:top left;width:1280px;height:720px;background:white;box-shadow:0 10px 70px rgba(0,0,0,.48)}iframe{width:100%;height:100%;border:0}.counter{position:fixed;right:18px;bottom:18px;background:rgba(0,0,0,.75);color:white;border-radius:999px;padding:7px 13px;font-size:13px;z-index:10}.nav{position:fixed;top:0;bottom:0;width:18%;z-index:8;cursor:pointer}.nav.left{left:0}.nav.right{right:0}</style></head><body><div id="stage"><iframe id="frame"></iframe></div><div class="nav left" id="prev"></div><div class="nav right" id="next"></div><div class="counter" id="counter"></div><script>(()=>{const W=window.DECK_WIDTH,H=window.DECK_HEIGHT,deck=window.DECK_MANIFEST,stage=document.getElementById('stage'),frame=document.getElementById('frame'),counter=document.getElementById('counter');let current=Math.max(0,Math.min(deck.length-1,Number(location.hash.slice(1)||1)-1));function fit(){const s=Math.min(innerWidth/W,innerHeight/H);stage.style.transform='translate('+((innerWidth-W*s)/2)+'px,'+((innerHeight-H*s)/2)+'px) scale('+s+')'}function show(i){if(i<0||i>=deck.length)return;current=i;frame.src=deck[i].file;counter.textContent=(i+1)+' / '+deck.length;history.replaceState(null,'','#'+(i+1))}addEventListener('resize',fit);addEventListener('keydown',e=>{if(['ArrowRight',' ','PageDown'].includes(e.key))show(current+1);if(['ArrowLeft','PageUp'].includes(e.key))show(current-1)});document.getElementById('prev').onclick=()=>show(current-1);document.getElementById('next').onclick=()=>show(current+1);fit();show(current)})();</script></body></html>`, 'utf8');

await fs.writeFile(path.join(outDir, 'slide-map.csv'), `slide,file,module,source\n${slides.map(([file], i) => `${i + 1},${file},${file.replace(/^[0-9]+-|\\.html$/g, '')},"see README and slide footer"`).join('\n')}\n`, 'utf8');

await fs.writeFile(path.join(outDir, 'README.md'), `# Lesson 1 · Huashu Business Deck\n\nBuilt from structured files in \`output/vp-database/lesson-01\`:\n\n- \`01_lesson_list.csv\`\n- \`02_content_items.csv\`\n- \`03_lesson_structure.csv\`\n- \`04_supplemental_activities.csv\`\n- \`05_game_suggestions.csv\`\n- \`06_google_sheets_database.csv\`\n\nRules applied:\n- Used active lesson modules from \`03_lesson_structure.csv\`.\n- Excluded modules marked \`skip\` instead of inventing classroom slides for them.\n- Used Vietnamese labels, Simplified Chinese target content, and pinyin support.\n- Preserved page references in footer/README for teacher review.\n\nSlide count: ${slides.length}\nSheet rows loaded: ${sheetRows.length}\n`, 'utf8');

console.log(`Created ${outDir}`);
