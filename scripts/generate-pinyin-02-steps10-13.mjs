#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const root = process.cwd();
const lessonId = 'pinyin-02';
const lessonRoot = path.join(root, 'output/pinyin/pinyin-02');
const templateRoot = path.join(root, 'output/pinyin/pinyin-01');
const slidesDir = path.join(lessonRoot, 'slides');
const assetsDir = path.join(slidesDir, 'assets');
const vocabDir = path.join(assetsDir, 'vocab-images');
const photosDir = path.join(assetsDir, 'photos');
const teacherGuideDir = path.join(lessonRoot, 'teacher-guide');
const qaDir = path.join(lessonRoot, 'exports/qa');
const databasePath = path.join(lessonRoot, 'database/vp_pinyin_02_database.json');

const zhMap = new Map([
  ['聲母', '声母'], ['擴展', '扩展'], ['課', '课'], ['與', '与'], ['拼寫', '拼写'], ['規則', '规则'],
  ['綠', '绿'], ['地圖', '地图'], ['可樂', '可乐'], ['雞', '鸡'], ['騎馬', '骑马'],
  ['機器', '机器'], ['繼續', '继续'], ['餓', '饿'], ['馬', '马'], ['媽媽', '妈妈'],
  ['服務', '服务'], ['皮膚', '皮肤'], ['密碼', '密码'],
]);

const meanings = new Map([
  ['大', 'lớn'],
  ['拿', 'cầm, lấy'],
  ['女', 'nữ'],
  ['绿', 'màu xanh lá'],
  ['地图', 'bản đồ'],
  ['喝', 'uống'],
  ['可乐', 'nước cola'],
  ['哥哥', 'anh trai'],
  ['鸡', 'con gà'],
  ['几', 'mấy, bao nhiêu'],
  ['七', 'số bảy'],
  ['洗', 'rửa'],
  ['西', 'phía tây'],
  ['骑马', 'cưỡi ngựa'],
  ['去', 'đi'],
  ['橘', 'quả quýt'],
  ['机器', 'máy móc'],
  ['继续', 'tiếp tục'],
]);

const reviewMeanings = new Map([
  ['八', 'số tám'], ['怕', 'sợ'], ['饿', 'đói'], ['不', 'không'], ['鼻', 'mũi'],
  ['木', 'gỗ'], ['马', 'con ngựa'], ['佛', 'Phật'], ['妈妈', 'mẹ'], ['爸爸', 'bố'],
  ['服务', 'phục vụ'], ['衣服', 'quần áo'], ['皮肤', 'da'], ['密码', 'mật mã'],
  ['伯父', 'bác trai'], ['伯母', 'bác gái'],
]);

const esc = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const simplify = (value = '') => {
  let text = String(value);
  for (const [from, to] of zhMap) text = text.replaceAll(from, to);
  return text;
};

const slug = (value = '') => String(value)
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .toLowerCase() || 'item';

async function exists(file) {
  try {
    await fs.stat(file);
    return true;
  } catch {
    return false;
  }
}

async function copyIfExists(from, to) {
  if (!await exists(from)) return;
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.copyFile(from, to);
}

async function copyDirIfExists(from, to) {
  if (!await exists(from)) return;
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.cp(from, to, { recursive: true });
}

async function ensureDirs() {
  for (const dir of [
    slidesDir,
    assetsDir,
    path.join(assetsDir, 'brand'),
    vocabDir,
    photosDir,
    teacherGuideDir,
    path.join(lessonRoot, 'exports/final'),
    qaDir,
    path.join(lessonRoot, 'exports/archive'),
    path.join(lessonRoot, 'homework-question-bank'),
  ]) {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function resetGeneratedSlides() {
  const files = await fs.readdir(slidesDir).catch(() => []);
  for (const file of files) {
    if (/^\d{2,3}-.+\.html$/.test(file) || file === 'index.html') {
      await fs.rm(path.join(slidesDir, file), { force: true });
    }
  }
}

async function copyTemplateAssets() {
  await copyIfExists(path.join(templateRoot, 'slides/assets/slide-base.css'), path.join(assetsDir, 'slide-base.css'));
  await copyIfExists(path.join(templateRoot, 'slides/assets/slide-base.js'), path.join(assetsDir, 'slide-base.js'));
  await copyIfExists(path.join(templateRoot, 'slides/assets/brand/logo-watermark.png'), path.join(assetsDir, 'brand/logo-watermark.png'));
  await copyDirIfExists(path.join(templateRoot, 'slides/assets/photos'), photosDir);
  await copyDirIfExists(path.join(templateRoot, 'slides/assets/sample-images'), path.join(assetsDir, 'sample-images'));
  await copyDirIfExists(path.join(templateRoot, 'slides/assets/reference'), path.join(assetsDir, 'reference'));
}

function normalizeVocabItem(item, index) {
  const chinese = simplify(item.hanzi);
  const recordId = `V${String(index + 1).padStart(3, '0')}`;
  return {
    ...item,
    record_id: recordId,
    chinese_simplified: chinese,
    vietnamese: meanings.get(chinese) || '',
    image_file: `assets/vocab-images/vocab-${recordId.toLowerCase()}-${slug(item.pinyin)}.png`,
  };
}

function allVocab(db) {
  return db.vocabulary_sets.flatMap((set) => set.items.map((item) => ({ ...item, set_id: set.set_id, set_title: set.title })))
    .map(normalizeVocabItem);
}

function vocabSets(db, vocab) {
  const byOriginalId = new Map(vocab.map((item) => [item.item_id, item]));
  return db.vocabulary_sets.map((set) => ({
    ...set,
    title_vi: set.title.replace('詞彙', 'Từ vựng'),
    items: set.items.map((item) => byOriginalId.get(item.item_id)),
  }));
}

async function writePlaceholderImages(vocab) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
    <rect width="320" height="320" rx="34" fill="#F4FAFA"/>
    <rect x="26" y="26" width="268" height="268" rx="26" fill="#FFFFFF" stroke="#B9DADB" stroke-width="3"/>
    <path d="M86 204c27-42 54-65 86-69 24-3 45 5 63 24" fill="none" stroke="#A9C9CD" stroke-width="11" stroke-linecap="round"/>
    <circle cx="124" cy="125" r="25" fill="#DDEDEE"/>
    <circle cx="204" cy="116" r="18" fill="#F3D8B6"/>
  </svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  for (const item of vocab) {
    await fs.writeFile(path.join(slidesDir, item.image_file), png);
  }
  const prompts = vocab.map((item) => ({
    record_id: item.record_id,
    chinese_simplified: item.chinese_simplified,
    pinyin: item.pinyin,
    vietnamese: item.vietnamese,
    filename: path.basename(item.image_file),
    status: 'placeholder_needs_generation',
    prompt: `Soft textbook 1:1 illustration for ${item.vietnamese}; no text, labels, letters, numbers, or watermark.`,
    visual_description: `Placeholder image for ${item.chinese_simplified} (${item.pinyin}).`,
  }));
  await fs.writeFile(path.join(vocabDir, 'prompts.json'), `${JSON.stringify({ prompts }, null, 2)}\n`, 'utf8');
}

function commonCss() {
  return `
.content{position:absolute;left:58px;right:58px;top:68px;bottom:42px}
.title-xl{font-size:34px;line-height:1.12;font-weight:900;color:#1A3A5A}.title-md{font-size:27px;line-height:1.16;font-weight:900;color:#1A3A5A}
.muted{color:#5F7088}.teal{color:#5AACAC}.purple{color:#7C6BC8}.amber{color:#D59A2A}.red{color:#D85A6A}
.soft-card{background:#fff;border:1px solid rgba(90,172,172,.16);border-radius:20px;box-shadow:0 8px 26px rgba(90,172,172,.12);padding:18px}.flat-card{background:#fff;border:1px solid rgba(90,172,172,.16);border-radius:16px;padding:14px}
.badge{display:inline-flex;align-items:center;justify-content:center;height:26px;padding:0 12px;border-radius:999px;background:#E8F4F4;color:#5AACAC;font-size:11px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.badge-purple{background:#F3F0FA;color:#7C6BC8}.badge-amber{background:#FFF4D8;color:#B9821F}.badge-red{background:#FCEFF3;color:#D85A6A}
.big-pinyin{font-size:52px;line-height:1;font-weight:900;color:#5AACAC}.big-hanzi{font-family:'Noto Sans SC',sans-serif;font-size:58px;line-height:1;font-weight:900;color:#1A3A5A}
.aligned-text{display:flex;align-items:flex-end;justify-content:center;gap:12px;row-gap:7px;flex-wrap:wrap;overflow:visible}.aligned-text .a-word{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;min-height:76px;overflow:visible}.aligned-text .a-pin{font-size:13.5pt;line-height:1.05;color:#5AACAC;font-weight:800;white-space:nowrap;margin-bottom:7px}.aligned-text .a-han{font-family:'Noto Sans SC';font-size:36pt;line-height:1;color:#1A3A5A;font-weight:900;white-space:nowrap}
.cover{position:absolute;inset:0;background:linear-gradient(145deg,#F4FAFA 0%,#FFFFFF 56%,#F3F0FA 100%);overflow:hidden}.cover:before{content:"";position:absolute;right:-80px;top:-120px;width:360px;height:360px;border-radius:50%;background:rgba(90,172,172,.13)}.cover-card{position:absolute;left:62px;top:78px;width:520px;z-index:2}.lesson{display:inline-flex;align-items:center;gap:10px;background:#E8F4F4;color:#5AACAC;padding:10px 21px;border-radius:999px;font-weight:800;font-size:21px}.cover-align{justify-content:flex-start;gap:14px;margin-top:26px}.cover-align .a-word{min-height:88px}.cover-align .a-pin{font-size:21px}.cover-align .a-han{font-size:76px}.vi{font-size:30px;color:#4A6080;font-weight:800;margin-top:20px}.cover-sounds{display:flex;flex-wrap:wrap;align-items:center;gap:12px 14px;width:520px;margin-top:22px}.cover-sound-chip{display:inline-flex;align-items:center;justify-content:center;gap:13px;min-height:44px;padding:0 18px;border-radius:999px;background:rgba(255,255,255,.78);border:1px solid rgba(90,172,172,.2);box-shadow:0 8px 22px rgba(90,172,172,.09);font-size:24px;line-height:1;font-weight:900;color:#4A6080;white-space:nowrap}.cover-sound-chip .arrow{color:#5AACAC;margin:0 1px}.topic-img{position:absolute;right:50px;top:92px;width:318px;height:318px;border-radius:24px;overflow:hidden;background:#F8FBFB;border:2px solid rgba(90,172,172,.18);box-shadow:0 16px 44px rgba(26,58,90,.16)}.topic-img img{width:100%;height:100%;object-fit:cover}
.lesson-goal-left{position:absolute;left:60px;top:78px;width:530px}.lesson-goal-title{margin-bottom:28px;font-size:34px;line-height:1.12;font-weight:900;color:#1A3A5A}.lesson-goal-cards{display:flex;flex-direction:column;gap:14px}.lesson-goal{padding:15px 20px;display:flex;align-items:center;gap:16px;font-size:17px;color:#4A6080;line-height:1.34}.lesson-goal-num{width:26px;height:26px;background:#5AACAC;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0}.lesson-goal-right{position:absolute;right:54px;top:98px;width:306px;height:306px;border-radius:20px;overflow:hidden;background:#F8FBFB;border:2px solid rgba(90,172,172,.18);box-shadow:0 10px 28px rgba(90,172,172,.14)}.lesson-goal-right img{width:100%;height:100%;object-fit:cover}.goal-hot{color:#F05A62;font-weight:950}
.divider-left{position:absolute;left:0;top:40px;bottom:0;width:54%;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.divider-kicker{font-size:15px;color:#5AACAC;text-transform:uppercase;letter-spacing:3px;font-weight:900;margin-bottom:12px}.divider-zh{font-family:'Noto Sans SC';font-size:62px;font-weight:900;color:#1A3A5A;margin-bottom:16px}.divider-line{width:88px;height:5px;border-radius:999px;background:#5AACAC}.divider-photo{position:absolute;right:82px;top:116px;width:300px;height:300px;border-radius:20px;overflow:hidden;background:#F8FBFB;border:2px solid rgba(90,172,172,.18);box-shadow:0 8px 24px rgba(90,172,172,.12)}.divider-photo img{width:100%;height:100%;object-fit:cover}
.sound-table{width:100%;border-collapse:separate;border-spacing:8px}.sound-table th,.sound-table td{height:48px;border-radius:13px;text-align:center;font-weight:900;font-size:21px}.sound-table th{background:#E8F4F4;color:#5AACAC}.sound-table td{background:#fff;border:1px solid rgba(90,172,172,.18);color:#1A3A5A}.sound-table .rowh{background:#F3F0FA;color:#7C6BC8}.sound-table .blank{opacity:.28}
.word-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:13px 14px}.word-card{position:relative;background:#fff;border-radius:18px;padding:10px 8px 12px;text-align:center;border:1px solid rgba(90,172,172,.16);box-shadow:0 8px 24px rgba(90,172,172,.10);height:184px;overflow:visible}.word-card img{width:78px;height:78px;border-radius:12px;border:2px solid #5AACAC;object-fit:cover;background:#F4FAFA;margin-bottom:8px}.word-card .pinyin{font-size:17px;font-weight:900;color:#5AACAC;line-height:1.16}.word-card .hanzi{font-family:'Noto Sans SC';font-size:31px;line-height:1.12;margin-top:3px;color:#1A3A5A;font-weight:900}.word-card .vietnamese{font-size:12px;line-height:1.22;color:#5F7088;font-weight:700;margin-top:3px}
.sound-only{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}.sound-only-row{display:flex;align-items:center;justify-content:center;gap:30px;flex-wrap:wrap;width:820px}.sound-only-token{width:112px;height:112px;border-radius:24px;background:#fff;border:2px solid rgba(90,172,172,.26);box-shadow:0 12px 30px rgba(90,172,172,.13);display:flex;align-items:center;justify-content:center;font-size:72px;line-height:1;font-weight:900;color:#1A3A5A}.sound-only-token:nth-child(2n){background:#F4FAFA}.sound-only-token:nth-child(3n){background:#F3F0FA}
.flash-title{position:absolute;left:58px;top:70px;font-size:20pt;font-weight:800;color:#1A3A5A}.flash-count{position:absolute;right:58px;top:78px;background:#E8F4F4;color:#5AACAC;border-radius:999px;padding:6px 16px;font-size:10pt;font-weight:900}
.flash-card{position:absolute;left:50%;top:116px;transform:translateX(-50%);width:430px;height:326px;perspective:1200px;cursor:pointer}.flip-trigger{position:absolute;width:0;height:0;opacity:0;pointer-events:none}.flip-inner{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .68s cubic-bezier(.2,.8,.2,1)}.flip-face{position:absolute;inset:0;border-radius:24px;background:#fff;box-shadow:0 14px 38px rgba(90,172,172,.16);border:1px solid rgba(90,172,172,.16);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;overflow:hidden;backface-visibility:hidden;transition:opacity .18s ease;box-sizing:border-box;padding:22px 42px 22px 76px}.flip-face:before{content:"";position:absolute;left:0;top:0;bottom:0;width:58px;background:linear-gradient(180deg,#D4EDED,#E8F4F4)}.flip-face:after{content:"";position:absolute;right:12px;top:12px;width:86px;height:86px;border-radius:50%;background:rgba(200,184,232,.16)}.face-pin{transform:rotateY(0deg);opacity:1}.face-answer{transform:rotateY(180deg);opacity:0}.flash-card:has(.answer-trigger.revealed) .flip-inner{transform:rotateY(180deg)}.flash-card:has(.answer-trigger.revealed) .face-pin{opacity:0}.flash-card:has(.answer-trigger.revealed) .face-answer{opacity:1}.flash-hint,.face-label,.flash-pinyin,.flash-answer-row,.flash-meaning{position:relative;z-index:1}.flash-hint,.face-label{display:inline-flex;align-items:center;justify-content:center;background:#F6FBFB;color:#8A9AB0;border-radius:999px;padding:6px 16px;font-size:10pt;font-weight:800;margin-bottom:12px}.face-label{background:#E8F4F4;color:#5AACAC}.flash-pinyin{font-size:58pt;line-height:1;font-weight:900;color:#1A3A5A;letter-spacing:0}.flash-answer-row{display:flex;align-items:center;justify-content:center;gap:22px;width:100%}.flash-answer-row img{width:138px;height:138px;object-fit:cover;border-radius:18px;border:2px solid #5AACAC;background:#F8FBFB;box-shadow:0 10px 24px rgba(90,172,172,.14);flex:none}.flash-meaning{text-align:left;font-size:26pt;line-height:1.12;font-weight:900;color:#1A3A5A;max-width:180px}
.practice-bank{display:flex;flex-wrap:wrap;gap:12px;margin-top:18px}.practice-bank span{height:44px;min-width:84px;padding:0 14px;border-radius:999px;background:#fff;border:1px solid rgba(90,172,172,.2);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#1A3A5A}.choice-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:18px}.choice{display:flex;align-items:center;gap:10px;background:#fff;border-radius:14px;border:1px solid rgba(90,172,172,.16);padding:12px 14px;font-size:18px;font-weight:800;color:#1A3A5A}.num{width:28px;height:28px;border-radius:999px;background:#5AACAC;color:white;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;flex:none}
.rule-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:26px}.rule-card{text-align:center;height:178px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px}.rule-card .from{font-size:36px;font-weight:950;color:#7C6BC8}.rule-card .arrow{font-size:24px;font-weight:950;color:#5AACAC}.rule-card .to{font-size:52px;font-weight:950;color:#1A3A5A}.closing-card{position:absolute;left:150px;right:150px;top:70px;bottom:58px;border-radius:30px;background:rgba(255,255,255,.9);box-shadow:0 14px 40px rgba(26,58,90,.14);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.closing-photo{width:248px;height:139px;border-radius:18px;overflow:hidden;border:2px solid rgba(90,172,172,.18);box-shadow:0 8px 24px rgba(90,172,172,.12);margin-bottom:16px}.closing-photo img{width:100%;height:100%;object-fit:cover}.closing-zh{font-family:'Noto Sans SC';font-size:72px;line-height:1;font-weight:900;color:#1A3A5A}.closing-sub{margin-top:15px;font-size:22px;font-weight:900;color:#5AACAC}.closing-next{margin-top:16px;font-size:18px;font-weight:800;color:#5F7088}
`;
}

function htmlDoc({ title, icon, label, body, extraCss = '' }) {
  return `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=960,height=540"><title>${esc(title)}</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+SC:wght@400;700;900&display=swap" rel="stylesheet"><script src="https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js"></script><link rel="stylesheet" href="assets/slide-base.css"><style>${commonCss()}${extraCss}</style></head><body>${body}<script src="assets/slide-base.js"></script></body></html>`;
}

function aligned(text) {
  return `<div class="aligned-text">${String(text).split('').map((char) => `<span class="a-word"><span class="a-han">${esc(char)}</span></span>`).join('')}</div>`;
}

function coverPinyinTitle() {
  return `<div class="aligned-text cover-align"><span class="a-word"><span class="a-pin">pīn</span><span class="a-han">拼</span></span><span class="a-word"><span class="a-pin">yīn</span><span class="a-han">音</span></span></div>`;
}

function coverSoundChips(groups) {
  return `<div class="cover-sounds">${groups.map((tokens) => `<div class="cover-sound-chip">${tokens.map((token) => token === '→' ? '<span class="arrow">→</span>' : `<span>${esc(token)}</span>`).join('')}</div>`).join('')}</div>`;
}

function slideShell({ title, icon = 'book-open', label = title, content, extraCss = '' }) {
  return htmlDoc({
    title,
    icon,
    label,
    extraCss,
    body: `<div class="slide"><div class="menu-bar"><span class="menu-icon"><i data-lucide="${icon}"></i></span><span class="section-label">${esc(label)}</span></div>${content}</div>`,
  });
}

function coverSlide() {
  return htmlDoc({
    title: 'Pinyin Bài 2',
    body: `<div class="slide"><div class="cover"><div class="cover-card"><div class="lesson">PINYIN 2 · 拼音第二课</div>${coverPinyinTitle()}${coverSoundChips([['d', 't', 'n', 'l'], ['g', 'k', 'h'], ['j', 'q', 'x', '→', 'ju', 'qu', 'xu']])}</div><div class="topic-img"><img src="assets/photos/cover-topic.png" alt=""></div></div></div>`,
  });
}

function objectivesSlide(vocabCount) {
  const goals = [
    'Ôn nhanh từ vựng Pinyin Bài 1 bằng nghe và nhìn hình.',
    'Học thanh mẫu <strong class="goal-hot">d t n l g k h</strong>.',
    'Học thanh mẫu <strong class="goal-hot">j q x</strong> và quy tắc <strong class="goal-hot">ü bỏ hai chấm</strong>.',
    `Đọc đúng ${vocabCount} từ vựng, ưu tiên phát âm và hiểu nghĩa.`,
  ];
  return slideShell({
    title: 'Mục tiêu học tập',
    icon: 'target',
    label: 'MỤC TIÊU',
    content: `<div class="lesson-goal-left"><div class="lesson-goal-title">Hôm nay bạn sẽ học gì?</div><div class="lesson-goal-cards">${goals.map((goal, i) => `<div class="lesson-goal soft-card"><div class="lesson-goal-num">${i + 1}</div><div>${goal}</div></div>`).join('')}</div></div><div class="lesson-goal-right"><img src="assets/sample-images/objectives.png" alt=""></div>`,
  });
}

function dividerSlide({ title, zh, label, img, icon = 'sparkles' }) {
  return slideShell({
    title,
    icon,
    label,
    content: `<div class="divider-left"><div class="divider-kicker">${esc(label)}</div><div class="divider-zh">${esc(zh)}</div><div class="divider-line"></div></div><div class="divider-photo"><img src="assets/photos/${img}" alt=""></div>`,
  });
}

function warmupSlide(reviewItems) {
  const items = reviewItems.slice(0, 8).map((item) => {
    const zh = simplify(item.hanzi);
    return `<div class="flat-card" style="height:82px;display:flex;align-items:center;justify-content:space-between;gap:12px"><div><div style="font-size:24px;font-weight:950;color:#5AACAC">${esc(item.pinyin)}</div><div style="font-family:'Noto Sans SC';font-size:28px;font-weight:950;color:#1A3A5A">${esc(zh)}</div></div><div style="font-size:14px;font-weight:800;color:#5F7088;text-align:right">${esc(reviewMeanings.get(zh) || '')}</div></div>`;
  }).join('');
  return slideShell({
    title: 'Ôn nhanh bài trước',
    icon: 'refresh-cw',
    label: 'Ôn bài 1',
    content: `<div class="content"><div class="title-xl">Nghe, đọc, rồi nối với nghĩa</div><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:20px">${items}</div></div>`,
  });
}

function initialsSlide(title, items) {
  const cards = items.map((symbol) => `<div class="sound-only-token">${esc(symbol)}</div>`).join('');
  return slideShell({
    title,
    icon: 'volume-2',
    label: 'Thanh mẫu',
    content: `<div class="sound-only"><div class="sound-only-row">${cards}</div></div>`,
  });
}

function chartRows(chart) {
  const valid = {
    d: ['da', '', 'de', 'di', 'du', ''],
    t: ['ta', '', 'te', 'ti', 'tu', ''],
    n: ['na', 'no', 'ne', 'ni', 'nu', 'nü'],
    l: ['la', 'lo', 'le', 'li', 'lu', 'lü'],
    g: ['ga', '', 'ge', '', 'gu', ''],
    k: ['ka', '', 'ke', '', 'ku', ''],
    h: ['ha', '', 'he', '', 'hu', ''],
    j: ['', '', '', 'ji', '', 'ju'],
    q: ['', '', '', 'qi', '', 'qu'],
    x: ['', '', '', 'xi', '', 'xu'],
  };
  return chart.initials.map((initial) => `<tr><th class="rowh">${esc(initial)}</th>${chart.finals.map((final, i) => {
    const value = valid[initial]?.[i] || '';
    return `<td class="${value ? '' : 'blank'}">${esc(value || '-')}</td>`;
  }).join('')}</tr>`).join('');
}

function chartSlide(chart, title) {
  return slideShell({
    title,
    icon: 'table-2',
    label: 'Bảng ghép âm',
    content: `<div class="content"><div class="title-xl" style="font-size:38px">${esc(title)}</div><div class="soft-card" style="width:810px;margin-top:22px;padding:20px"><table class="sound-table"><thead><tr><th></th>${chart.finals.map((final) => `<th>${esc(final)}</th>`).join('')}</tr></thead><tbody>${chartRows(chart)}</tbody></table></div></div>`,
  });
}

function subsetChart(chart, initials) {
  return { ...chart, initials };
}

function pinyinPracticeSlide({ title, items, instruction }) {
  const rows = [];
  for (let i = 0; i < items.length; i += 4) rows.push(items.slice(i, i + 4));
  return slideShell({
    title,
    icon: 'mic-2',
    label: 'Luyện đọc',
    content: `<div class="content"><div class="title-xl">${esc(title)}</div><div style="display:grid;gap:14px;margin-top:26px">${rows.map((row) => `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px">${row.map((item) => `<div class="soft-card" style="height:74px;display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:950;color:#1A3A5A">${esc(item)}</div>`).join('')}</div>`).join('')}</div></div>`,
  });
}

function vocabularyGridSlide(set, slideTitle) {
  const html = set.items.map((item) => `<div class="word-card"><img src="${esc(item.image_file)}" alt="${esc(item.chinese_simplified)}"><div class="pinyin">${esc(item.pinyin)}</div><div class="hanzi">${esc(item.chinese_simplified)}</div><div class="vietnamese">${esc(item.vietnamese)}</div></div>`).join('');
  return slideShell({
    title: slideTitle,
    icon: 'grid-3x3',
    label: set.title_vi,
    content: `<div class="content"><div class="word-grid">${html}</div></div>`,
  });
}

function flashcardSlide(item, index, total, setNo) {
  return slideShell({
    title: `${item.pinyin} · ${item.vietnamese}`,
    icon: 'layers',
    label: `Thẻ từ vựng ${setNo}`,
    content: `<div class="flash-title">Flashcard</div><div class="flash-count">${String(index + 1).padStart(2, '0')} / ${total}</div><div class="flash-card"><span class="flip-trigger answer-trigger" data-reveal-step="1"></span><div class="flip-inner"><div class="flip-face face-pin"><div class="flash-hint">Nhìn pinyin và đọc trước</div><div class="pinyin flash-pinyin">${esc(item.pinyin)}</div></div><div class="flip-face face-answer"><div class="face-label">Nghĩa</div><div class="flash-answer-row"><img src="${esc(item.image_file)}" alt=""><div><div class="flash-meaning">${esc(item.vietnamese)}</div></div></div></div></div></div>`,
  });
}

function vocabPracticeSlide(set, title) {
  return slideShell({
    title,
    icon: 'list-checks',
    label: 'Luyện từ vựng',
    content: `<div class="content"><div class="title-xl">${esc(title)}</div><div class="choice-grid">${set.items.map((item, i) => `<div class="choice"><span class="num">${i + 1}</span><span style="font-family:'Noto Sans SC';font-size:30px;font-weight:950">${esc(item.chinese_simplified)}</span><span style="margin-left:auto;color:#5AACAC;font-weight:950">${esc(item.pinyin)}</span></div>`).join('')}</div></div>`,
  });
}

function ruleSlide() {
  return slideShell({
    title: 'Quy tắc j/q/x + ü',
    icon: 'wand-sparkles',
    label: 'Quy tắc viết pinyin',
    content: `<div class="content"><div class="title-xl">Sau j/q/x, ü bỏ hai chấm khi viết</div><div class="rule-grid">${[['jü', 'ju'], ['qü', 'qu'], ['xü', 'xu']].map(([from, to]) => `<div class="soft-card rule-card"><div class="from">${from}</div><div class="arrow">→</div><div class="to">${to}</div></div>`).join('')}</div></div>`,
  });
}

function rulePracticeSlide(set) {
  return slideShell({
    title: 'Áp dụng quy tắc j/q/x',
    icon: 'check-circle-2',
    label: 'Luyện quy tắc',
    content: `<div class="content"><div class="title-xl">Đọc pinyin, nói nghĩa</div><div class="practice-bank">${set.items.flatMap((item) => [item.pinyin, item.chinese_simplified, item.vietnamese]).map((item) => `<span>${esc(item)}</span>`).join('')}</div></div>`,
  });
}

function reviewChoiceSlide(vocab) {
  const items = ['dà', 'ná', 'lǜ', 'dìtú', 'jī', 'qī', 'xǐ', 'qù', 'jú', 'jìxù'];
  return slideShell({
    title: 'Nghe và chọn pinyin',
    icon: 'headphones',
    label: 'Ôn tập',
    content: `<div class="content"><div class="title-xl">Nghe và chọn pinyin đúng</div><div class="practice-bank">${items.map((item) => `<span>${esc(item)}</span>`).join('')}</div></div>`,
  });
}

function meaningMatchSlide(vocab) {
  const items = vocab.slice(0, 10);
  return slideShell({
    title: 'Ghép pinyin với nghĩa',
    icon: 'git-branch',
    label: 'Ôn tập',
    content: `<div class="content"><div class="title-xl">Ghép pinyin với nghĩa tiếng Việt</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:22px"><div class="soft-card"><div class="badge">Pinyin</div><div class="practice-bank">${items.map((item) => `<span>${esc(item.pinyin)}</span>`).join('')}</div></div><div class="soft-card"><div class="badge badge-amber">Nghĩa</div><div class="practice-bank">${items.map((item) => `<span>${esc(item.vietnamese)}</span>`).join('')}</div></div></div></div>`,
  });
}

function closingSlide() {
  return htmlDoc({
    title: 'Kết thúc',
    body: `<div class="slide"><div class="closing-card"><div class="closing-photo"><img src="assets/reference/ending-page-background.png" alt=""></div><div class="closing-zh">下课</div><div class="closing-sub">Bạn có câu hỏi gì không?</div><div class="closing-next">Bài tiếp theo: Pinyin 3</div></div></div>`,
  });
}

function activeRootIndex() {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=slides/index.html">
  <title>Pinyin Bài 2</title>
  <script>window.location.replace('slides/index.html');</script>
</head>
<body>
  <p><a href="slides/index.html">Mở Pinyin Bài 2</a></p>
</body>
</html>
`;
}

async function writeSlides(db, vocab, sets) {
  const slides = [];
  const add = (name, html) => slides.push({ name, html });
  const chart1 = db.pinyin_charts.find((chart) => chart.item_id === 'pinyin_chart_l2_group_1');
  const chart2 = db.pinyin_charts.find((chart) => chart.item_id === 'pinyin_chart_l2_group_2');
  const set1 = sets[0];
  const set2 = sets[1];
  const set3 = sets[2];

  add('cover', coverSlide());
  add('objectives', objectivesSlide(vocab.length));
  add('divider-review', dividerSlide({ title: 'Ôn bài 1', zh: '复习', label: 'ÔN BÀI 1', img: 'divider-review.png', icon: 'refresh-cw' }));
  add('warmup-review', warmupSlide(db.warmup_activity.source_vocabulary));
  add('divider-initials-1', dividerSlide({ title: 'Thanh mẫu d t n l g k h', zh: '声母', label: 'THANH MẪU 1', img: 'divider-initials.png', icon: 'volume-2' }));
  add('initials-dtnlgkh', initialsSlide('d t n l g k h', chart1.initials, 'Đọc rõ vị trí đầu lưỡi và âm bật hơi.'));
  add('chart-dtnl', chartSlide(subsetChart(chart1, ['d', 't', 'n', 'l']), 'd t n l + a o e i u ü'));
  add('chart-gkh', chartSlide(subsetChart(chart1, ['g', 'k', 'h']), 'g k h + a o e i u ü'));
  add('practice-dtnlgkh', pinyinPracticeSlide({ title: 'Luyện đọc nhóm 1', instruction: 'Đọc từng hàng, sau đó đọc ngẫu nhiên.', items: ['dā', 'dí', 'dù', 'tǎ', 'tí', 'tǔ', 'ná', 'nǚ', 'lǜ', 'gē', 'kě', 'hē'] }));
  add('divider-vocabulary-1', dividerSlide({ title: 'Từ vựng 1', zh: '词汇', label: 'TỪ VỰNG 1', img: 'divider-vocabulary.png', icon: 'images' }));
  add('vocabulary-1', vocabularyGridSlide(set1, 'Từ vựng 1'));
  set1.items.forEach((item, i) => add(`flash-${item.record_id.toLowerCase()}-${slug(item.pinyin)}`, flashcardSlide(item, i, set1.items.length, 1)));
  add('practice-vocabulary-1', vocabPracticeSlide(set1, 'Luyện từ vựng 1'));
  add('divider-initials-2', dividerSlide({ title: 'Thanh mẫu j q x', zh: '声母', label: 'THANH MẪU 2', img: 'divider-initials.png', icon: 'volume-2' }));
  add('initials-jqx', initialsSlide('j q x', chart2.initials, 'Các âm này đi với i hoặc ü trong bài này.'));
  add('chart-jqx', chartSlide(chart2, 'j q x + a o e i u ü'));
  add('practice-jqx', pinyinPracticeSlide({ title: 'Luyện đọc nhóm 2', instruction: 'Chú ý j/q/x khi đi với ü.', items: ['jī', 'jǐ', 'qī', 'qí', 'xī', 'xǐ', 'jú', 'qù', 'xū', 'jù', 'qǔ', 'xù'] }));
  add('divider-vocabulary-2', dividerSlide({ title: 'Từ vựng 2', zh: '词汇', label: 'TỪ VỰNG 2', img: 'divider-vocabulary.png', icon: 'images' }));
  add('vocabulary-2', vocabularyGridSlide(set2, 'Từ vựng 2'));
  set2.items.forEach((item, i) => add(`flash-${item.record_id.toLowerCase()}-${slug(item.pinyin)}`, flashcardSlide(item, i, set2.items.length, 2)));
  add('practice-vocabulary-2', vocabPracticeSlide(set2, 'Luyện từ vựng 2'));
  add('divider-rule-jqx', dividerSlide({ title: 'Quy tắc j/q/x', zh: '规则', label: 'QUY TẮC', img: 'divider-sounds.png', icon: 'wand-sparkles' }));
  add('rule-jqx-umlaut', ruleSlide());
  add('divider-vocabulary-3', dividerSlide({ title: 'Từ vựng 3', zh: '词汇', label: 'TỪ VỰNG 3', img: 'divider-vocabulary.png', icon: 'images' }));
  add('vocabulary-3', vocabularyGridSlide(set3, 'Từ vựng 3'));
  set3.items.forEach((item, i) => add(`flash-${item.record_id.toLowerCase()}-${slug(item.pinyin)}`, flashcardSlide(item, i, set3.items.length, 3)));
  add('practice-rule-vocabulary', rulePracticeSlide(set3));
  add('divider-review-final', dividerSlide({ title: 'Luyện tập tổng hợp', zh: '练习', label: 'ÔN TẬP', img: 'divider-review.png', icon: 'check-circle-2' }));
  add('review-listening-choice', reviewChoiceSlide(vocab));
  add('review-meaning-match', meaningMatchSlide(vocab));
  add('closing', closingSlide());

  for (let i = 0; i < slides.length; i += 1) {
    const no = String(i + 1).padStart(2, '0');
    const file = `${no}-${slides[i].name}.html`;
    await fs.writeFile(path.join(slidesDir, file), slides[i].html, 'utf8');
  }
  return slides.map((slide, i) => `${String(i + 1).padStart(2, '0')}-${slide.name}.html`);
}

async function writeTeacherGuide(db, vocab, sets, slideFiles) {
  const guide = `# Pinyin Bài 2 - Teacher Prep

## Mục tiêu

- Ôn lại từ vựng Pinyin Bài 1 bằng nghe, đọc và hiểu nghĩa.
- Dạy thanh mẫu \`d t n l g k h\`, sau đó \`j q x\`.
- Dạy quy tắc \`jü -> ju\`, \`qü -> qu\`, \`xü -> xu\`: viết bỏ hai chấm, đọc vẫn là ü.
- Với từ vựng, ưu tiên phát âm đúng và hiểu nghĩa. Không yêu cầu nhận mặt chữ Hán.

## Trình tự lớp học

1. Mở bài và mục tiêu.
2. Ôn nhanh Bài 1.
3. Dạy nhóm thanh mẫu 1: \`d t n l g k h\`.
4. Ghép âm và luyện đọc có thanh điệu.
5. Từ vựng 1: ${sets[0].items.map((item) => `${item.chinese_simplified} ${item.pinyin}`).join(', ')}.
6. Dạy nhóm thanh mẫu 2: \`j q x\`.
7. Ghép âm và luyện đọc có thanh điệu.
8. Từ vựng 2: ${sets[1].items.map((item) => `${item.chinese_simplified} ${item.pinyin}`).join(', ')}.
9. Quy tắc \`j/q/x + ü\`.
10. Từ vựng 3 và luyện quy tắc.
11. Ôn tập nghe chọn pinyin và ghép nghĩa.

## Từ vựng

| Pinyin | Giản thể | Nghĩa |
|---|---|---|
${vocab.map((item) => `| ${item.pinyin} | ${item.chinese_simplified} | ${item.vietnamese} |`).join('\n')}

## Ghi chú

- Slide dùng ảnh placeholder 1:1 theo quy trình image asset. Khi cần ảnh thật, thay từng ảnh bằng \`npm run assets:replace\` hoặc crop từ contact sheet.
- Không export PDF sạch cho đến khi Adam xác nhận nội dung và thiết kế đã chốt.
- Tổng số slide hiện tại: ${slideFiles.length}.
`;

  const brief = `# Huashu Brief - Pinyin Bài 2

## Deck

- Output: \`output/pinyin/pinyin-02/slides/\`
- Template baseline: \`output/pinyin/pinyin-01\`
- Visual language: soft textbook/course style, teal classroom UI, 16:9 HTML presenter.
- Do not add \`Mục lục\`, \`Quy ước\`, or bottom-right \`Trang ...\` indicators.

## Slide Structure

${slideFiles.map((file) => `- \`${file}\``).join('\n')}

## Content Rules

- Vietnamese for instructions and labels.
- Simplified Chinese only for learning content.
- Pinyin visible above/near target Chinese content when both appear.
- Pinyin vocabulary grids keep only top bar plus grid.
- Flashcards are one word per slide.
- Teacher guide contains teaching reminders; classroom slides stay clean.
`;

  await fs.writeFile(path.join(teacherGuideDir, 'teacher-prep.md'), guide, 'utf8');
  await fs.writeFile(path.join(teacherGuideDir, 'huashu-brief.md'), brief, 'utf8');
}

async function writeReadme(slideFiles) {
  await fs.writeFile(path.join(lessonRoot, 'README.md'), `# Pinyin Bài 2

Classroom presenter is ready. Open \`index.html\` from this folder root.

## Outputs

| Path | Purpose |
|---|---|
| \`index.html\` | Classroom entry point. |
| \`slides/index.html\` | HTML presenter with ${slideFiles.length} slides. |
| \`teacher-guide/teacher-prep.md\` | Step 10 teacher prep. |
| \`teacher-guide/huashu-brief.md\` | Step 11 Huashu brief. |
| \`slides/\` | Step 12 editable HTML slides. |
| \`exports/qa/\` | QA reports and screenshots. |
`, 'utf8');
}

async function main() {
  const db = JSON.parse(await fs.readFile(databasePath, 'utf8'));
  const vocab = allVocab(db);
  const sets = vocabSets(db, vocab);

  await ensureDirs();
  await resetGeneratedSlides();
  await copyTemplateAssets();
  await writePlaceholderImages(vocab);
  const slideFiles = await writeSlides(db, vocab, sets);
  await writeTeacherGuide(db, vocab, sets, slideFiles);
  await writeReadme(slideFiles);
  await fs.writeFile(path.join(lessonRoot, 'index.html'), activeRootIndex(), 'utf8');

  console.log(JSON.stringify({
    lesson: path.relative(root, lessonRoot),
    teacher_prep: path.relative(root, path.join(teacherGuideDir, 'teacher-prep.md')),
    huashu_brief: path.relative(root, path.join(teacherGuideDir, 'huashu-brief.md')),
    slides: slideFiles.length,
    vocab_placeholders: vocab.length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
