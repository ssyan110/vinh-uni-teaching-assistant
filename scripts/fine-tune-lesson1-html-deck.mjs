#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { presenterHtml } from './lesson1-presenter-template.mjs';
import {
  vocabularyGridClass,
  vocabularyGridCss,
} from './vocabulary-grid-layout.mjs';

const root = process.cwd();
const slidesDir = path.join(root, 'output/book-1/lesson-01/slides');

const esc = (s = '') => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const vocab = [
  { n: 1, file: 'ni', han: '你', pinyin: 'nǐ', vi: 'anh, chị, bạn, ông, bà...', hv: 'nhĩ', type: 'đại từ', page: '1', sample: ['nǐ hǎo', '你好', 'Xin chào'] },
  { n: 2, file: 'hao', han: '好', pinyin: 'hǎo', vi: 'tốt, đẹp, hay, ngon', hv: 'hảo', type: 'tính từ', page: '1', sample: ['hěn hǎo', '很好', 'rất tốt'] },
  { n: 3, file: 'nihao', han: '你好', pinyin: 'nǐ hǎo', vi: 'Xin chào', hv: 'nhĩ hảo', type: 'cụm từ', page: '1', sample: ['nǐ hǎo', '你好', 'Xin chào'] },
  { n: 4, file: 'yi', han: '一', pinyin: 'yī', vi: 'một', hv: 'nhất', type: 'số từ', page: '1', sample: ['yī hào', '一号', 'số 1'] },
  { n: 5, file: 'wu', han: '五', pinyin: 'wǔ', vi: 'năm', hv: 'ngũ', type: 'số từ', page: '1', sample: ['wǔ hào', '五号', 'số 5'] },
  { n: 6, file: 'ba', han: '八', pinyin: 'bā', vi: 'tám', hv: 'bát', type: 'số từ', page: '1', sample: ['bā hào', '八号', 'số 8'] },
  { n: 7, file: 'da', han: '大', pinyin: 'dà', vi: 'to, lớn', hv: 'đại', type: 'tính từ', page: '1', sample: ['dà mǎ', '大马', 'ngựa lớn'] },
  { n: 8, file: 'bu', han: '不', pinyin: 'bù', vi: 'không, chẳng', hv: 'bất', type: 'phó từ', page: '1', sample: ['bù hǎo', '不好', 'không tốt'] },
  { n: 9, file: 'kou', han: '口', pinyin: 'kǒu', vi: 'miệng; nhân khẩu', hv: 'khẩu', type: 'danh từ, lượng từ', page: '2', sample: ['yī kǒu', '一口', 'một miệng / một miếng'] },
  { n: 10, file: 'bai', han: '白', pinyin: 'bái', vi: 'trắng', hv: 'bạch', type: 'tính từ', page: '2', sample: ['bái mǎ', '白马', 'ngựa trắng'] },
  { n: 11, file: 'nu', han: '女', pinyin: 'nǚ', vi: 'nữ, phụ nữ', hv: 'nữ', type: 'danh từ', page: '2', sample: ['nǚ', '女', 'nữ'] },
  { n: 12, file: 'ma', han: '马', pinyin: 'mǎ', vi: 'con ngựa', hv: 'mã', type: 'danh từ', page: '2', sample: ['dà mǎ', '大马', 'ngựa lớn'] },
];

const writingChars = [
  { han: '一', file: 'yi' },
  { han: '八', file: 'ba' },
  { han: '大', file: 'da' },
  { han: '不', file: 'bu' },
  { han: '五', file: 'wu' },
  { han: '口', file: 'kou' },
  { han: '白', file: 'bai' },
  { han: '女', file: 'nu' },
  { han: '马', file: 'ma' },
  { han: '你', file: 'ni' },
  { han: '好', file: 'hao' },
];
const photo = name => `assets/photos/${name}.jpg`;
const matchPhoto = name => `assets/photos/practice-match/${name}.jpg`;
const hanziDataByChar = {};

async function loadHanziData() {
  for (const item of writingChars) {
    const dataPath = path.join(slidesDir, 'assets/hanzi-data', `${item.han}.json`);
    hanziDataByChar[item.han] = JSON.parse(await fs.readFile(dataPath, 'utf8'));
  }
}

const commonCss = `
*{margin:0;padding:0;box-sizing:border-box}
body{width:960px;height:540px;overflow:hidden;font-family:'Inter',sans-serif;color:#1A3A5A;background:#fff}
.slide{position:relative;width:960px;height:540px;overflow:hidden;background:linear-gradient(to top,#F4FAFA,#FFFFFF)}
.slide:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 12% 84%,rgba(90,172,172,.08) 0 92px,transparent 94px),radial-gradient(circle at 90% 16%,rgba(200,184,232,.12) 0 120px,transparent 122px);pointer-events:none}
.menu-bar{position:absolute;top:0;left:0;right:0;height:40px;background:rgba(255,255,255,.90);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid rgba(26,58,90,.08);display:flex;align-items:center;padding:0 28px;z-index:20;box-shadow:0 8px 22px rgba(26,58,90,.10)}
.menu-icon{width:22px;height:22px;border-radius:8px;background:#E8F4F4;color:#5AACAC;display:flex;align-items:center;justify-content:center;margin-right:10px;box-shadow:inset 0 0 0 1px rgba(90,172,172,.18)}
.menu-icon svg{width:15px;height:15px;stroke-width:2.4}
.menu-icon.char{font-family:'Noto Sans SC',sans-serif;font-size:14px;font-weight:900;line-height:1}
.section-label{font-size:9pt;font-weight:700;color:#4A6080;text-transform:uppercase;letter-spacing:1.2px}
.page-indicator{position:absolute;bottom:16px;right:28px;font-size:9pt;color:#8A9AB0;z-index:20}
.bg-deco{position:absolute;color:#5AACAC;opacity:.14;z-index:0}
.title{font-size:24pt;font-weight:800;color:#1A3A5A;line-height:1.18}
.subtitle{font-size:14pt;color:#8A9AB0}
.pill{display:inline-flex;align-items:center;justify-content:center;background:#E8F4F4;color:#5AACAC;border-radius:999px;padding:5px 14px;font-size:10pt;font-weight:700}
.card{background:#fff;border-radius:20px;box-shadow:0 8px 28px rgba(90,172,172,.13);border:1px solid rgba(90,172,172,.14)}
.stock-img{width:100%;height:100%;object-fit:cover;display:block}
.photo-panel{position:relative;overflow:hidden;border-radius:24px;box-shadow:0 12px 34px rgba(26,58,90,.16)}
.photo-panel:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(255,255,255,.24),rgba(255,255,255,0))}
.hanzi{font-family:'Noto Sans SC',sans-serif;font-weight:900;color:#1A3A5A}
.pinyin{color:#5AACAC;font-weight:600}
.line{width:46px;height:3px;border-radius:4px;background:#5AACAC}
`;

function html(title, body, extra = '') {
  return `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=960,height=540"><title>${esc(title)}</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+SC:wght@400;700;900&display=swap" rel="stylesheet"><script src="https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js"></script><style>${commonCss}${extra}</style></head><body>${body}<script>
lucide.createIcons();
let revealIndex = 0;
function revealNext() {
  const stepped = Array.from(document.querySelectorAll('[data-reveal-step]')).sort((a,b)=>Number(a.dataset.revealStep)-Number(b.dataset.revealStep));
  if (stepped.length) {
    if (revealIndex < stepped.length) {
      stepped[revealIndex++].classList.add('revealed');
    } else {
      stepped.forEach(el => el.classList.remove('revealed'));
      revealIndex = 0;
    }
    return;
  }
  const all = document.querySelector('[data-reveal-all]');
  if (all) all.classList.toggle('revealed');
}
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'reveal-next') revealNext();
});
document.addEventListener('click', revealNext);
</script></body></html>`;
}

function top(section, icon = 'book-open', _page = '', source = '') {
  const iconHtml = icon.startsWith('char:') ? `<span class="menu-icon char">${esc(icon.slice(5))}</span>` : `<span class="menu-icon"><i data-lucide="${esc(icon)}"></i></span>`;
  return `<div class="menu-bar">${iconHtml}<span class="section-label">${esc(section)}</span></div>${source ? `<div class="page-indicator">${esc(source)}</div>` : ''}`;
}

function slideWrap(title, section, icon, page, source, inner, extra = '') {
  return html(title, `<div class="slide">${top(section, icon, page, source)}${inner}</div>`, extra);
}

function cover(page, total) {
  return html('Bài 1 · 你好', `<div class="slide cover">
    <div class="bg-circle-1"></div><div class="bg-circle-2"></div><div class="bg-blob"></div>
    <i data-lucide="book-open" class="deco-icon i1"></i><i data-lucide="message-circle" class="deco-icon i2"></i><i data-lucide="languages" class="deco-icon i3"></i>
    <div class="card cover-card">
      <span class="pill lesson-pill">BÀI 1</span>
      <div class="hanzi character">你好</div>
      <div class="pinyin cover-pinyin">nǐ hǎo</div>
      <div class="line"></div>
    </div>
    <div class="course-subtitle">Giáo trình Hán ngữ · Sơ cấp</div>
    <div class="bottom-bar"></div>
  </div><script>lucide.createIcons();</script>`, `
.cover{background:linear-gradient(160deg,#D6F0F0 0%,#E8ECF8 50%,#F0E8F4 100%);display:flex;align-items:center;justify-content:center}
.bg-circle-1{position:absolute;width:320px;height:320px;border-radius:50%;background:rgba(90,172,172,.08);top:-80px;right:-60px}
.bg-circle-2{position:absolute;width:200px;height:200px;border-radius:50%;background:rgba(90,172,172,.06);bottom:-40px;left:-40px}
.bg-blob{position:absolute;width:400px;height:300px;border-radius:60% 40% 50% 50%;background:rgba(255,255,255,.4);top:50%;left:50%;transform:translate(-50%,-50%);filter:blur(2px)}
.deco-icon{position:absolute;color:#5AACAC;opacity:.46}.deco-icon svg{width:100%;height:100%}.i1{top:60px;left:80px;width:48px;height:48px}.i2{top:80px;right:120px;width:36px;height:36px}.i3{top:200px;left:40px;width:28px;height:28px}
.cover-card{position:relative;z-index:2;background:rgba(255,255,255,.92);border-radius:28px;padding:42px 64px 46px;display:flex;flex-direction:column;align-items:center;gap:12px;backdrop-filter:blur(8px)}
.lesson-pill{font-size:12pt;padding:7px 24px}
.character{font-size:72pt;line-height:1.05;text-shadow:0 2px 12px rgba(26,58,90,.08)}
.cover-pinyin{font-size:18pt}
.course-subtitle{position:absolute;left:34px;bottom:24px;font-size:10pt;color:#8A9AB0;letter-spacing:.5px;z-index:3}
.bottom-bar{position:absolute;bottom:0;left:0;right:0;height:5px;background:linear-gradient(90deg,#5AACAC,#A8D8D8,#C8B8E8)}
`);
}

function objectives(page, total) {
  return slideWrap('Mục tiêu', 'MỤC TIÊU', 'target', `${page} / ${total}`, '', `
    <i data-lucide="target" class="bg-deco" style="width:120px;height:120px;right:76px;bottom:56px"></i>
    <div class="left-content">
      <div class="title">Hôm nay bạn sẽ học gì?</div>
      <div class="cards">
        ${['Chào hỏi bằng tiếng Trung: 你好', 'Nhận biết và đọc 12 từ vựng cơ bản', 'Viết chữ Hán: 一、八、大、不、五、口、白、女、马、你、好'].map((t, i) => `<div class="goal card"><div class="num">${i + 1}</div><div>${esc(t)}</div></div>`).join('')}
      </div>
    </div>
    <div class="right-panel"><i data-lucide="graduation-cap"></i></div>
  `, `
.left-content{position:absolute;left:60px;top:78px;width:560px}.title{margin-bottom:28px}.cards{display:flex;flex-direction:column;gap:16px}.goal{padding:16px 20px;display:flex;align-items:center;gap:16px;font-size:14pt;color:#4A6080;line-height:1.36}.num{width:26px;height:26px;background:#5AACAC;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0}.right-panel{position:absolute;right:0;top:40px;bottom:0;width:34%;border-radius:24px 0 0 24px;background:linear-gradient(180deg,#E0F2F2,#E8ECF8);display:flex;align-items:center;justify-content:center;color:#5AACAC}.right-panel svg{width:132px;height:132px;opacity:.34;stroke-width:1.6}
`);
}

function warmup(page, total) {
  return slideWrap('Khởi động', 'KHỞI ĐỘNG', 'map-pin', `${page} / ${total}`, '', `
    <div class="warm-main card">
      <div class="warm-kicker">Câu hỏi mở đầu</div>
      <div class="warm-question">Bạn đã nghe câu chào nào bằng tiếng Trung chưa?</div>
      <div class="warm-hint">Nói nhanh 1 ví dụ bạn nhớ được.</div>
      <div class="tag-row"><span>phim ảnh</span><span>bài hát</span><span>bạn bè</span><span>trải nghiệm</span></div>
    </div>
    <div class="warm-photo-large photo-panel"><img class="stock-img" src="${photo('warmup')}"></div>
    <div class="warm-prompts">
      <div class="mini-prompt card"><span>1</span><div>Nghe ở đâu?</div></div>
      <div class="mini-prompt card"><span>2</span><div>Câu đó dùng khi nào?</div></div>
      <div class="mini-prompt card"><span>3</span><div>Thử nói lại.</div></div>
    </div>
  `, `
.slide{background:linear-gradient(to top,#F4FAFA,#FFFFFF)}.warm-main{position:absolute;left:58px;top:92px;width:480px;height:316px;padding:34px 38px}.warm-kicker{font-size:10pt;color:#5AACAC;font-weight:800;text-transform:uppercase;letter-spacing:1.6px;margin-bottom:14px}.warm-question{font-size:29pt;line-height:1.14;font-weight:800;color:#1A3A5A;letter-spacing:0}.warm-hint{font-size:14pt;color:#8A9AB0;margin-top:18px}.tag-row{display:flex;gap:10px;margin-top:24px;flex-wrap:wrap}.tag-row span{background:#E8F4F4;color:#5AACAC;border-radius:18px;padding:8px 14px;font-size:10.5pt;font-weight:800}.warm-photo-large{position:absolute;right:58px;top:92px;width:304px;height:214px}.warm-prompts{position:absolute;right:58px;top:324px;width:304px;display:grid;grid-template-columns:1fr;gap:10px}.mini-prompt{height:42px;padding:8px 12px;display:flex;align-items:center;gap:10px;font-size:11pt;color:#4A6080}.mini-prompt span{width:24px;height:24px;border-radius:50%;background:#5AACAC;color:#fff;font-size:9pt;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}
`);
}

function divider(page, total, cfg) {
  return slideWrap(cfg.title, cfg.label, cfg.icon, `${page} / ${total}`, cfg.source || '', `
    <div class="left">
      <div class="section-label-big">${esc(cfg.label)}</div>
      <div class="zh-title">${esc(cfg.zh)}</div>
      ${cfg.lessonTitle ? `<div class="lesson-title-small">${esc(cfg.lessonTitle)}</div>` : ''}
      <div class="line"></div>
      ${cfg.desc ? `<div class="desc">${esc(cfg.desc)}</div>` : ''}
    </div>
    <div class="right-photo photo-panel"><img class="stock-img" src="${esc(cfg.img)}"></div>
  `, `
.left{position:absolute;left:0;top:40px;bottom:0;width:58%;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center}.section-label-big{font-size:11pt;color:${cfg.color};text-transform:uppercase;letter-spacing:3px;font-weight:800;margin-bottom:12px}.zh-title{font-family:'Noto Sans SC';font-size:${cfg.lessonTitle ? '44pt' : '48pt'};font-weight:900;color:#1A3A5A;margin-bottom:${cfg.lessonTitle ? '6px' : '16px'}}.lesson-title-small{font-family:'Noto Sans SC';font-size:24pt;font-weight:800;color:#4A6080;margin-bottom:12px}.line{background:${cfg.color};margin-bottom:16px}.desc{font-size:14pt;color:#8A9AB0}.right-photo{position:absolute;right:36px;top:88px;width:330px;height:350px}
`);
}

function vocabSlide(item, page, total) {
  return slideWrap(`Từ vựng · ${item.han}`, 'TỪ VỰNG', 'char:文', `${page} / ${total}`, `Trang ${item.page}`, `
    <div class="vocab-sparks"><span></span><span></span><span></span></div>
    <div class="vocab-card card">
      <div class="left-strip"></div>
      <div class="counter">${String(item.n).padStart(2, '0')}/12</div>
      <div class="pinyin">${esc(item.pinyin)}</div>
      <div class="hanzi character">${esc(item.han)}</div>
      <div class="meaning">${esc(item.vi)}</div>
      <div class="han-viet">(${esc(item.hv)})</div>
      <span class="type-pill">${esc(item.type)}</span>
    </div>
  `, `
.slide:before{background:linear-gradient(145deg,rgba(90,172,172,.05),rgba(255,255,255,0) 52%),radial-gradient(circle at 86% 20%,rgba(200,184,232,.08) 0 88px,transparent 90px)}.vocab-sparks{position:absolute;left:610px;top:118px;width:120px;height:88px;opacity:.42}.vocab-sparks span{position:absolute;width:28px;height:4px;border-radius:999px;background:#5AACAC}.vocab-sparks span:nth-child(1){left:0;top:16px;transform:rotate(-18deg)}.vocab-sparks span:nth-child(2){right:18px;top:38px;width:18px;background:#C8B8E8}.vocab-sparks span:nth-child(3){left:40px;bottom:14px;width:22px;transform:rotate(22deg)}.vocab-card{position:absolute;left:50%;top:50%;transform:translate(-50%,-46%);width:440px;min-height:348px;padding:38px 42px 30px 78px;text-align:center;overflow:hidden}.left-strip{position:absolute;left:0;top:0;bottom:0;width:58px;background:linear-gradient(180deg,#D4EDED,#E8F4F4)}.counter{position:absolute;right:18px;top:16px;background:#F6FBFB;color:#5AACAC;font-size:9.5pt;font-weight:800;padding:4px 10px;border-radius:12px;box-shadow:0 2px 8px rgba(90,172,172,.10);z-index:2}.vocab-card .pinyin{font-size:20pt;margin-top:10px}.character{font-size:${item.han.length > 1 ? '60pt' : '76pt'};line-height:1.04}.meaning{font-size:15pt;color:#4A6080;margin-top:8px}.han-viet{font-size:13.2pt;color:#8A9AB0;font-style:italic;margin-top:8px}.type-pill{display:inline-block;background:#E8F4F4;color:#5AACAC;font-size:11pt;font-weight:800;padding:6px 16px;border-radius:14px;margin-top:14px}
`);
}

function sampleSlide(item, page, total) {
  const [pin, han, vi] = item.sample;
  return slideWrap(`Mẫu câu · ${item.han}`, 'MẪU CÂU', 'message-circle', `${page} / ${total}`, `Từ vựng ${String(item.n).padStart(2, '0')}/12`, `
    <div class="sample-card card">
      <span class="pill">Mẫu câu</span>
      <div class="pinyin sample-pin">${esc(pin)}</div>
      <div class="hanzi sample-han">${esc(han)}</div>
      <div class="sample-vi">${esc(vi)}</div>
    </div>
  `, `
.sample-card{position:absolute;left:50%;top:116px;transform:translateX(-50%);width:500px;height:332px;padding:34px 50px;border-radius:24px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center}.sample-pin{font-size:22pt;margin-top:22px}.sample-han{font-size:${han.length > 2 ? '50pt' : '64pt'};line-height:1.08;margin-top:8px}.sample-vi{font-size:18pt;color:#4A6080;margin-top:14px}
`);
}

function summarySlide(page, total, group, label) {
  return slideWrap('Tổng kết từ vựng', 'TỪ VỰNG', 'char:文', `${page} / ${total}`, 'Trang 1-2', `
    <div class="summary-title">Mini quiz từ vựng</div>
    <div class="summary-part">${esc(label)}</div>
    <div class="${vocabularyGridClass(group.length, 'summary-grid')}">
      ${group.map((v, i) => `<div class="sum-card card" data-reveal-step="${i + 1}"><div class="hanzi sum-han ${v.han.length > 1 ? 'long' : ''}">${esc(v.han)}</div><div class="blank-line"></div><div class="sum-hidden"><div class="pinyin">${esc(v.pinyin)}</div><div class="vi">${esc(v.vi)}</div><div class="hv">(${esc(v.hv)})</div></div></div>`).join('')}
    </div>
    <div class="quiz-note">Click để hiện từng đáp án.</div>
  `, `
.summary-title{position:absolute;left:58px;top:70px;font-size:20pt;font-weight:800}.summary-part{position:absolute;right:58px;top:76px;font-size:10pt;font-weight:800;color:#5AACAC;background:#E8F4F4;border-radius:16px;padding:6px 14px}.summary-grid{position:absolute;left:58px;right:58px;top:122px;bottom:62px;display:grid;grid-template-columns:repeat(3,1fr);gap:14px}${vocabularyGridCss()}.sum-card{height:152px;padding:12px 14px;text-align:center;overflow:hidden}.sum-han{font-size:34pt;line-height:.98}.sum-han.long{font-size:29pt}.blank-line{width:64px;height:2px;background:#DCEAEA;margin:7px auto 8px}.sum-hidden{opacity:0;transition:opacity .25s}.sum-card.revealed .sum-hidden{opacity:1}.sum-hidden .pinyin{font-size:11.5pt;line-height:1.1}.sum-hidden .vi{font-size:9.6pt;color:#4A6080;line-height:1.14;margin-top:2px}.sum-hidden .hv{font-size:8.8pt;color:#8A9AB0;font-style:italic;line-height:1.08;margin-top:2px}.quiz-note{position:absolute;right:58px;bottom:40px;color:#8A9AB0;font-size:10pt}
`, true);
}

const practiceFlashcards = [
  { han: '你', pinyin: 'nǐ', vi: 'bạn', file: 'ni' },
  { han: '好', pinyin: 'hǎo', vi: 'tốt', file: 'hao' },
  { han: '马', pinyin: 'mǎ', vi: 'ngựa', file: 'ma' },
  { han: '白', pinyin: 'bái', vi: 'trắng', file: 'bai' },
  { han: '大', pinyin: 'dà', vi: 'to, lớn', file: 'da' },
];

function flashcardPractice(item, index, page, total) {
  return slideWrap('Flashcard', 'TẬP TỪ VỰNG', 'pencil', `${page} / ${total}`, '', `
    <div class="flash-title">Flashcard</div>
    <div class="flash-count">${String(index + 1).padStart(2, '0')} / ${practiceFlashcards.length}</div>
    <div class="flash-card">
      <span class="flip-trigger pin-trigger" data-reveal-step="1"></span>
      <span class="flip-trigger vi-trigger" data-reveal-step="2"></span>
      <div class="flip-inner">
        <div class="flip-face face-han">
          <div class="flash-hint">Nhìn chữ và đọc trước</div>
          <div class="hanzi flash-han">${esc(item.han)}</div>
        </div>
        <div class="flip-face face-pin">
          <div class="face-label">Pinyin</div>
          <div class="pinyin flash-pin">${esc(item.pinyin)}</div>
          <div class="mini-char hanzi">${esc(item.han)}</div>
        </div>
        <div class="flip-face face-vi">
          <div class="face-label">Nghĩa</div>
          <div class="flash-vi">${esc(item.vi)}</div>
        </div>
      </div>
    </div>
    <div class="flash-note">Click flashcard: lật sang pinyin → lật sang nghĩa → quay lại chữ Hán.</div>
  `, `
.flash-title{position:absolute;left:58px;top:70px;font-size:20pt;font-weight:800;color:#1A3A5A}.flash-count{position:absolute;right:58px;top:78px;background:#E8F4F4;color:#5AACAC;border-radius:999px;padding:6px 16px;font-size:10pt;font-weight:900}.flash-card{position:absolute;left:50%;top:116px;transform:translateX(-50%);width:430px;height:326px;perspective:1200px;cursor:pointer}.flip-trigger{position:absolute;width:0;height:0;opacity:0;pointer-events:none}.flip-inner{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .68s cubic-bezier(.2,.8,.2,1)}.flip-face{position:absolute;inset:0;border-radius:24px;background:#fff;box-shadow:0 14px 38px rgba(90,172,172,.16);border:1px solid rgba(90,172,172,.16);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;overflow:hidden;backface-visibility:hidden;transition:opacity .18s ease}.flip-face:before{content:"";position:absolute;left:0;top:0;bottom:0;width:58px;background:linear-gradient(180deg,#D4EDED,#E8F4F4)}.flip-face:after{content:"";position:absolute;right:-44px;top:-44px;width:130px;height:130px;border-radius:50%;background:rgba(200,184,232,.16)}.face-han{transform:rotateY(0deg);opacity:1}.face-pin{transform:rotateY(180deg);opacity:0}.face-vi{transform:rotateY(360deg);opacity:0}.flash-card:has(.pin-trigger.revealed):not(:has(.vi-trigger.revealed)) .flip-inner{transform:rotateY(180deg)}.flash-card:has(.pin-trigger.revealed):not(:has(.vi-trigger.revealed)) .face-han{opacity:0}.flash-card:has(.pin-trigger.revealed):not(:has(.vi-trigger.revealed)) .face-pin{opacity:1}.flash-card:has(.vi-trigger.revealed) .flip-inner{transform:rotateY(360deg)}.flash-card:has(.vi-trigger.revealed) .face-han,.flash-card:has(.vi-trigger.revealed) .face-pin{opacity:0}.flash-card:has(.vi-trigger.revealed) .face-vi{opacity:1}.flash-hint,.face-label,.flash-han,.flash-pin,.flash-vi,.mini-char{position:relative;z-index:1}.flash-hint,.face-label{display:inline-flex;align-items:center;justify-content:center;background:#F6FBFB;color:#8A9AB0;border-radius:999px;padding:6px 16px;font-size:10pt;font-weight:800;margin-bottom:12px}.face-label{background:#E8F4F4;color:#5AACAC}.flash-han{font-size:112pt;line-height:.95}.flash-pin{font-size:52pt;line-height:1}.mini-char{font-size:48pt;line-height:1;margin-top:20px;color:#D7E6E6}.flash-vi{font-size:40pt;color:#1A3A5A;font-weight:900;line-height:1.12;max-width:300px}.flash-note{position:absolute;left:0;right:0;bottom:50px;text-align:center;color:#8A9AB0;font-size:10pt;font-weight:700}
`);
}

function numbersPractice(page, total) {
  return slideWrap('Luyện số', 'TẬP TỪ VỰNG', 'pencil', `${page} / ${total}`, '', `
    <div class="content-title">Luyện số: nhận biết và đếm 一、五、八</div>
    <div class="num-cards">
      ${['一','五','八'].map((h, i) => `<div class="num-card card"><div class="pinyin">${vocab.find(v=>v.han===h).pinyin}</div><div class="hanzi">${h}</div></div>`).join('')}
    </div>
  `, `
.content-title{position:absolute;left:60px;top:82px;font-size:22pt;font-weight:800}.num-cards{position:absolute;left:140px;top:164px;display:flex;gap:30px}.num-card{width:210px;height:230px;text-align:center;padding:36px 32px;display:flex;flex-direction:column;align-items:center;justify-content:center}.num-card .pinyin{font-size:19pt;margin-bottom:10px}.num-card .hanzi{font-size:76pt;line-height:1.05}
`);
}

function negationPractice(page, total) {
  return slideWrap('Nhìn từ đoán nghĩa', 'TẬP TỪ VỰNG', 'pencil', `${page} / ${total}`, '', `
    <div class="practice-title">Nhìn từ đoán nghĩa</div>
    <div class="practice-sub">Hãy thử nói ra nghĩa tiếng Việt và pinyin của các từ vựng.</div>
    <div class="neg-grid">
      ${[['不好','bù hǎo','không tốt'],['不大','bú dà','không lớn'],['不白','bù bái','không trắng']].map((x, i) => `<div class="neg-card card" data-reveal-step="${i + 1}"><div class="hanzi">${x[0]}</div><div class="answer"><div class="pinyin">${x[1]}</div><div>${x[2]}</div></div></div>`).join('')}
    </div>
  `, `
.practice-title{position:absolute;left:0;right:0;top:86px;text-align:center;font-size:25pt;font-weight:800}.practice-sub{position:absolute;left:0;right:0;top:132px;text-align:center;font-size:14pt;color:#8A9AB0}.neg-grid{position:absolute;left:150px;top:226px;display:flex;gap:34px}.neg-card{width:200px;height:170px;text-align:center;padding:30px 18px 22px}.neg-card .hanzi{font-size:44pt;line-height:1}.answer{opacity:0;margin-top:18px;transition:.25s}.neg-card.revealed .answer{opacity:1}.answer .pinyin{font-size:13.5pt;line-height:1.1}.answer div:last-child{font-size:12.5pt;color:#4A6080;margin-top:2px}
`);
}

function textDivider(page, total) {
  return divider(page, total, { title: 'Bài đọc', label: 'BÀI ĐỌC', icon: 'book-open', zh: '课文', lessonTitle: '你好', desc: 'Hội thoại · Trang 1', color: '#10B981', img: photo('text'), source: 'Trang 1' });
}

function dialogue(page, total) {
  return slideWrap('Hội thoại', 'BÀI ĐỌC', 'book-open', `${page} / ${total}`, 'Trang 1', `
    <div class="dialogue-title">Hội thoại</div>
    <div class="dialogue">
      ${['A','B'].map((sp, i) => `<div class="dialogue-row"><div class="avatar ${i ? 'b' : 'a'}"><span class="hair"></span><span class="eye left"></span><span class="eye right"></span><span class="mouth"></span></div><div class="block card ${i ? 'block-b' : 'block-a'}"><div class="pinyin">nǐ hǎo</div><div class="hanzi">你好</div></div></div>`).join('')}
    </div>
  `, `
.dialogue-title{position:absolute;left:62px;top:78px;font-size:22pt;font-weight:800}.dialogue{position:absolute;left:168px;top:142px;width:610px;display:flex;flex-direction:column;gap:28px}.dialogue-row{display:flex;align-items:center;gap:18px}.avatar{position:relative;width:70px;height:70px;border-radius:50%;box-shadow:0 6px 18px rgba(26,58,90,.12);border:3px solid #fff;flex-shrink:0}.avatar.a{background:#D8F0F0}.avatar.b{background:#E4E8F7}.hair{position:absolute;left:9px;right:9px;top:7px;height:20px;background:#1A3A5A;border-radius:18px 18px 10px 10px;opacity:.82}.avatar.b .hair{background:#5A6F90}.eye{position:absolute;top:34px;width:6px;height:6px;border-radius:50%;background:#1A3A5A}.eye.left{left:24px}.eye.right{right:24px}.mouth{position:absolute;left:28px;top:46px;width:16px;height:8px;border-bottom:3px solid #5AACAC;border-radius:0 0 16px 16px}.block{width:380px;padding:22px 28px}.block-a{border-left:5px solid #5AACAC}.block-b{border-left:5px solid #B8C8E8}.block .pinyin{font-size:16pt}.block .hanzi{font-size:32pt}
`);
}

function strokeSlide(ch, page, total) {
  const info = vocab.find(v => v.han === ch) || { pinyin: '', vi: '', hv: '' };
  const charData = JSON.stringify(hanziDataByChar[ch]);
  return slideWrap(`汉字书写 · ${ch}`, 'TẬP VIẾT', 'pen-line', `${page} / ${total}`, 'Trang 12', `
    <div class="stroke-title">Tập viết chữ Hán</div>
    <div class="stroke-card card">
      <div id="writer-target" class="writer-target" data-char="${esc(ch)}"></div>
      <div class="stroke-meta">
        <div class="pinyin">${esc(info.pinyin)}</div>
        <div class="meaning">${esc(info.vi)}</div>
        <div class="hv">(${esc(info.hv)})</div>
      </div>
      <button class="animate-btn" onclick="playStroke()">▶ Viết mẫu</button>
    </div>
    <script src="assets/js/hanzi-writer.min.js"></script>
    <script>
      let writer;
      const embeddedCharData = ${charData};
      function initWriter(){
        const el=document.getElementById('writer-target');
        const ch=el.dataset.char;
        if(!window.HanziWriter){ el.innerHTML='<div class="fallback-char">'+ch+'</div>'; return; }
        writer=HanziWriter.create('writer-target', ch, {
          width: 230, height: 230, padding: 18, showOutline: true, showCharacter: false,
          strokeAnimationSpeed: 0.575, delayBetweenStrokes: 360,
          charDataLoader: function(char, onComplete){ onComplete(embeddedCharData); }
        });
        setTimeout(()=>writer.animateCharacter(), 500);
      }
      function playStroke(){ if(writer) writer.animateCharacter(); }
      initWriter();
    </script>
  `, `
.stroke-title{position:absolute;left:58px;top:78px;font-size:22pt;font-weight:800}.stroke-card{position:absolute;left:50%;top:112px;transform:translateX(-50%);width:420px;height:370px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:22px 30px}.writer-target{width:230px;height:230px}.stroke-meta{text-align:center;margin-top:4px}.stroke-meta .pinyin{font-size:18pt}.meaning{font-size:13.5pt;color:#4A6080;margin-top:4px}.hv{font-size:11.5pt;color:#8A9AB0;font-style:italic;margin-top:3px}.animate-btn{margin-top:12px;border:0;border-radius:18px;background:#5AACAC;color:#fff;padding:8px 18px;font-weight:800;cursor:pointer}.fallback-char{font-family:'Noto Sans SC';font-size:130px;font-weight:900;color:#1A3A5A;text-align:center}
`);
}

function supplementDivider(page, total) {
  return divider(page, total, { title: 'Bổ sung học tập', label: 'BỔ SUNG HỌC TẬP', icon: 'badge-plus', zh: '补充学习', desc: 'Mở rộng chủ đề chào hỏi', color: '#EC4899', img: photo('supplement') });
}

function culture(page, total) {
  return slideWrap('Cách chào hỏi', 'BỔ SUNG HỌC TẬP', 'badge-plus', `${page} / ${total}`, '', `
    <div class="culture-content">
      <div class="title">Cách chào hỏi</div>
      <div class="cards">
        <div class="culture-card card"><div class="country vn">Việt Nam</div><div class="phrase">Chào anh/chị/em</div><div class="note">theo tuổi và quan hệ</div></div>
        <div class="culture-card card"><div class="country cn-title">Trung Quốc</div><div class="hanzi phrase-cn">你好</div><div class="pinyin cn-pinyin">nǐ hǎo</div><div class="note">dùng rộng rãi hơn</div></div>
      </div>
      <div class="footer-note">您好 (nín hǎo) = dạng lịch sự hơn, sẽ học sau.</div>
    </div>
  `, `
.culture-content{position:absolute;left:72px;right:72px;top:98px;text-align:center}.cards{display:flex;gap:26px;margin-top:28px}.culture-card{flex:1;min-height:182px;padding:30px}.country{font-size:14pt;font-weight:800;margin-bottom:14px}.vn{color:#EC4899}.cn-title{color:#5AACAC}.phrase{font-size:20pt;color:#1A3A5A;font-weight:800}.phrase-cn{font-size:38pt;line-height:1;margin-top:2px}.cn-pinyin{display:inline-block;margin-top:12px;background:#E8F4F4;border-radius:14px;padding:5px 14px;font-size:13pt}.note,.footer-note{font-size:13pt;color:#8A9AB0;margin-top:12px}.footer-note{margin-top:26px}
`);
}

function gestures(page, total) {
  return slideWrap('中国数字手势', 'BỔ SUNG HỌC TẬP', 'badge-plus', `${page} / ${total}`, '', `
    <div class="blank-title">中国数字手势</div>
    <div class="blank-sub">Chèn hình minh họa số bằng tay tại đây.</div>
    <div class="placeholder card"><i data-lucide="image-plus"></i><span>Image placeholder</span></div>
  `, `
.blank-title{position:absolute;left:0;right:0;top:94px;text-align:center;font-family:'Noto Sans SC';font-size:36pt;font-weight:900}.blank-sub{position:absolute;left:0;right:0;top:158px;text-align:center;color:#8A9AB0;font-size:15pt}.placeholder{position:absolute;left:210px;top:216px;width:540px;height:220px;border:2px dashed #C8DCDC;background:#F8FCFC;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:#8A9AB0}.placeholder svg{width:52px;height:52px;color:#5AACAC}
`);
}

function homeworkDivider(page, total) {
  return divider(page, total, { title: '回家作业', label: 'BÀI TẬP VỀ NHÀ', icon: 'book-open-check', zh: '回家作业', desc: 'Làm bài trên Formative', color: '#F59E0B', img: photo('homework') });
}

function exercisesList(page, total) {
  return slideWrap('Bài tập trong sách', 'BÀI TẬP', 'book-open-check', `${page} / ${total}`, 'Trang 10-12', `
    <div class="exercise-title">Bài tập trong sách</div>
    <div class="exercise-list">
      ${['Luyện thanh điệu (p.10)', 'Luyện biến điệu (p.10)', 'Phân biệt thanh mẫu (p.10)', 'Phân biệt vận mẫu (p.11)', 'Phân biệt âm và thanh điệu (p.11)', 'Nhận mặt chữ và đọc (p.11)', 'Tập viết chữ Hán (p.12)'].map((t, i) => `<div class="item"><div class="num">${i + 1}</div><div>${esc(t)}</div></div>`).join('')}
    </div>
    <div class="formative card">Vào link Formative do giảng viên cung cấp để hoàn thành bài tập và quiz sau giờ học.</div>
  `, `
.exercise-title{position:absolute;left:0;right:0;top:74px;text-align:center;font-size:22pt;font-weight:800}.exercise-list{position:absolute;left:230px;top:128px;width:500px;display:flex;flex-direction:column;gap:9px}.item{display:flex;align-items:center;font-size:12.8pt;color:#4A6080}.num{width:24px;height:24px;background:#FDE8D0;color:#C07030;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;margin-right:12px;flex-shrink:0}.formative{position:absolute;left:250px;bottom:54px;width:460px;padding:16px 22px;text-align:center;font-size:12.2pt;color:#4A6080}
`);
}

function closing(page, total) {
  return html('Kết thúc', `<div class="slide closing">
    <div class="overlay"></div>
    <div class="center">
      <div class="hanzi end-title">下课</div>
      <div class="line"></div>
      <div class="spacer"></div>
      <div class="next-label">Bài tiếp theo</div>
      <div class="pinyin next-pinyin">dì èr kè · nǐ shì nǎ guó rén?</div>
      <div class="hanzi next-hanzi">第二课 · 你是哪国人？</div>
    </div>
  </div><script>lucide.createIcons();</script>`, `
.closing{background:url('assets/reference/ending-page-background.png') center/cover no-repeat;display:flex;align-items:center;justify-content:center}.overlay{position:absolute;inset:0;background:rgba(255,255,255,.52);backdrop-filter:blur(1px)}.center{position:relative;z-index:1;text-align:center;background:rgba(255,255,255,.72);border-radius:28px;padding:34px 78px;box-shadow:0 10px 34px rgba(26,58,90,.14)}.end-title{font-size:62pt;line-height:1}.line{margin:16px auto}.spacer{height:10px}.next-label{font-size:12pt;color:#8A9AB0}.next-pinyin{font-size:14pt;margin-top:8px}.next-hanzi{font-size:24pt;margin-top:5px}
`);
}

const files = [];
function add(name, content) {
  files.push(name);
  return [name, content];
}

const slideItems = [];
let total = 0;
// total is known after layout construction.
const plannedCount = 57;
let p = 1;
await loadHanziData();
slideItems.push(add('01-cover.html', cover(p++, plannedCount)));
slideItems.push(add('02-objectives.html', objectives(p++, plannedCount)));
slideItems.push(add('03-warmup.html', warmup(p++, plannedCount)));
slideItems.push(add('04-divider-vocab.html', divider(p++, plannedCount, { title: 'Từ vựng', label: 'TỪ VỰNG', icon: 'char:文', zh: '生词', desc: '12 từ mới · Trang 1-2', color: '#5AACAC', img: photo('vocab'), source: 'Trang 1-2' })));
for (const item of vocab) {
  slideItems.push(add(`${String(p).padStart(2, '0')}-vocab-${item.file}.html`, vocabSlide(item, p++, plannedCount)));
  slideItems.push(add(`${String(p).padStart(2, '0')}-sample-${item.file}.html`, sampleSlide(item, p++, plannedCount)));
}
slideItems.push(add(`${String(p).padStart(2, '0')}-vocab-summary-a.html`, summarySlide(p++, plannedCount, vocab.slice(0, 6), '01-06 / 12')));
slideItems.push(add(`${String(p).padStart(2, '0')}-vocab-summary-b.html`, summarySlide(p++, plannedCount, vocab.slice(6), '07-12 / 12')));
slideItems.push(add(`${String(p).padStart(2, '0')}-divider-practice.html`, divider(p++, plannedCount, { title: 'Tập từ vựng', label: 'TẬP TỪ VỰNG', icon: 'pencil', zh: '生词练习', desc: '', color: '#8B5CF6', img: photo('practice') })));
for (const [index, item] of practiceFlashcards.entries()) {
  slideItems.push(add(`${String(p).padStart(2, '0')}-practice-flashcard-${item.file}.html`, flashcardPractice(item, index, p++, plannedCount)));
}
slideItems.push(add(`${String(p).padStart(2, '0')}-practice-numbers.html`, numbersPractice(p++, plannedCount)));
slideItems.push(add(`${String(p).padStart(2, '0')}-practice-negation.html`, negationPractice(p++, plannedCount)));
slideItems.push(add(`${String(p).padStart(2, '0')}-divider-text.html`, textDivider(p++, plannedCount)));
slideItems.push(add(`${String(p).padStart(2, '0')}-dialogue.html`, dialogue(p++, plannedCount)));
for (const item of writingChars) {
  slideItems.push(add(`${String(p).padStart(2, '0')}-stroke-${item.file}.html`, strokeSlide(item.han, p++, plannedCount)));
}
slideItems.push(add(`${String(p).padStart(2, '0')}-divider-supplement.html`, supplementDivider(p++, plannedCount)));
slideItems.push(add(`${String(p).padStart(2, '0')}-culture-greetings.html`, culture(p++, plannedCount)));
slideItems.push(add(`${String(p).padStart(2, '0')}-number-gestures.html`, gestures(p++, plannedCount)));
slideItems.push(add(`${String(p).padStart(2, '0')}-divider-homework.html`, homeworkDivider(p++, plannedCount)));
slideItems.push(add(`${String(p).padStart(2, '0')}-exercises-list.html`, exercisesList(p++, plannedCount)));
slideItems.push(add(`${String(p).padStart(2, '0')}-closing.html`, closing(p++, plannedCount)));

total = slideItems.length;
if (total !== plannedCount) throw new Error(`Planned ${plannedCount}, got ${total}`);

for (const file of await fs.readdir(slidesDir)) {
  if (/^\d{2}-.+\.html$/.test(file)) await fs.rm(path.join(slidesDir, file));
}
for (const [file, content] of slideItems) {
  await fs.writeFile(path.join(slidesDir, file), content, 'utf8');
}

const indexPath = path.join(slidesDir, 'index.html');
await fs.writeFile(indexPath, presenterHtml(files, total), 'utf8');

console.log(`✓ Wrote ${total} slides to ${slidesDir}`);
