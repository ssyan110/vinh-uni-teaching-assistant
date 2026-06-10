#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import {
  chunkItems,
  pinyinExerciseCss,
  renderFillBlankBoard,
  renderImageMatchingBoard,
  renderMatchingBoard,
  renderMultipleChoiceTable,
  renderReadingDrillBoard,
} from './pinyin-exercise-templates.mjs';

const root = process.cwd();
const lessonId = 'pinyin-04';
const lessonRoot = path.join(root, 'output/pinyin/pinyin-04');
const templateRoot = path.join(root, 'output/pinyin/pinyin-01');
const reviewSourceRoot = path.join(root, 'output/pinyin/pinyin-03');
const slidesDir = path.join(lessonRoot, 'slides');
const assetsDir = path.join(slidesDir, 'assets');
const vocabDir = path.join(assetsDir, 'vocab-images');
const reviewVocabDir = path.join(assetsDir, 'review-vocab-images');
const photosDir = path.join(assetsDir, 'photos');
const teacherGuideDir = path.join(lessonRoot, 'teacher-guide');
const qaDir = path.join(lessonRoot, 'exports/qa');
const databasePath = path.join(lessonRoot, 'database/vp_pinyin_04_database.json');

const zhMap = new Map([
  ['聲母', '声母'], ['韻母', '韵母'], ['複韻母', '复韵母'], ['擴展', '扩展'], ['課', '课'], ['與', '与'], ['拼寫', '拼写'], ['規則', '规则'],
  ['綠', '绿'], ['地圖', '地图'], ['可樂', '可乐'], ['雞', '鸡'], ['騎馬', '骑马'],
  ['機器', '机器'], ['繼續', '继续'], ['幾', '几'], ['餓', '饿'], ['馬', '马'], ['媽媽', '妈妈'],
  ['服務', '服务'], ['皮膚', '皮肤'], ['密碼', '密码'],
  ['翹舌', '翘舌'], ['平舌', '平舌'], ['變調', '变调'], ['總表', '总表'],
  ['炸雞', '炸鸡'], ['車', '车'], ['熱', '热'], ['豬', '猪'], ['書', '书'],
  ['綠色', '绿色'], ['負責', '负责'], ['組', '组'],
  ['開', '开'], ['貓', '猫'], ['誰', '谁'], ['對', '对'], ['貴', '贵'], ['寫', '写'],
  ['謝謝', '谢谢'], ['謝', '谢'], ['覺得', '觉得'], ['覺', '觉'], ['學', '学'],
]);

const meanings = new Map([
  ['开', 'mở'],
  ['菜', 'món ăn, rau'],
  ['猫', 'con mèo'],
  ['少', 'ít'],
  ['手', 'tay'],
  ['口', 'miệng'],
  ['谁', 'ai'],
  ['二', 'số hai'],
  ['六', 'số sáu'],
  ['牛', 'con bò'],
  ['九', 'số chín'],
  ['球', 'quả bóng'],
  ['对', 'đúng, đối với'],
  ['睡', 'ngủ'],
  ['贵', 'đắt'],
  ['姐姐', 'chị gái'],
  ['写', 'viết'],
  ['谢谢', 'cảm ơn'],
  ['觉得', 'cảm thấy'],
  ['缺', 'thiếu'],
  ['学', 'học'],
]);

const reviewMeanings = new Map([
  ['炸鸡', 'gà rán'], ['茶', 'trà'], ['车', 'xe'], ['热', 'nóng'],
  ['吃', 'ăn'], ['十', 'số mười'], ['猪', 'con heo'], ['书', 'sách'],
  ['擦', 'lau, chùi'], ['撒', 'rắc, vãi'], ['绿色', 'màu xanh lá'], ['负责', 'phụ trách'],
  ['字', 'chữ'], ['四', 'số bốn'], ['组', 'nhóm'], ['速度', 'tốc độ'],
]);

const reviewImageFiles = new Map([
  ['炸鸡', 'review-v001-zhaji.png'],
  ['茶', 'review-v002-cha.png'],
  ['车', 'review-v003-che.png'],
  ['热', 'review-v004-re.png'],
  ['吃', 'review-v005-chi.png'],
  ['十', 'review-v006-shi.png'],
  ['猪', 'review-v007-zhu.png'],
  ['书', 'review-v008-shu.png'],
  ['擦', 'review-v009-ca.png'],
  ['撒', 'review-v010-sa.png'],
  ['绿色', 'review-v011-luse.png'],
  ['负责', 'review-v012-fuze.png'],
  ['字', 'review-v013-zi.png'],
  ['四', 'review-v014-si.png'],
  ['组', 'review-v015-zu.png'],
  ['速度', 'review-v016-sudu.png'],
]);

const imageMatchTitle = 'Nối từ vựng với hình ảnh';
const imageMatchInstruction = 'Nối từ vựng với hình ảnh.';

const lesson4FinalChart = {
  b: { ai: 'bai', ei: 'bei', ao: 'bao', ou: '', er: '', iu: '', ui: '', ie: 'bie', 'üe': '' },
  p: { ai: 'pai', ei: 'pei', ao: 'pao', ou: 'pou', er: '', iu: '', ui: '', ie: 'pie', 'üe': '' },
  m: { ai: 'mai', ei: 'mei', ao: 'mao', ou: 'mou', er: '', iu: 'miu', ui: '', ie: 'mie', 'üe': '' },
  f: { ai: '', ei: 'fei', ao: '', ou: 'fou', er: '', iu: '', ui: '', ie: '', 'üe': '' },
  d: { ai: 'dai', ei: 'dei', ao: 'dao', ou: 'dou', er: '', iu: 'diu', ui: 'dui', ie: 'die', 'üe': '' },
  t: { ai: 'tai', ei: 'tei', ao: 'tao', ou: 'tou', er: '', iu: '', ui: 'tui', ie: 'tie', 'üe': '' },
  n: { ai: 'nai', ei: 'nei', ao: 'nao', ou: 'nou', er: '', iu: 'niu', ui: '', ie: 'nie', 'üe': 'nüe' },
  l: { ai: 'lai', ei: 'lei', ao: 'lao', ou: 'lou', er: '', iu: 'liu', ui: '', ie: 'lie', 'üe': 'lüe' },
  g: { ai: 'gai', ei: 'gei', ao: 'gao', ou: 'gou', er: '', iu: '', ui: 'gui', ie: '', 'üe': '' },
  k: { ai: 'kai', ei: 'kei', ao: 'kao', ou: 'kou', er: '', iu: '', ui: 'kui', ie: '', 'üe': '' },
  h: { ai: 'hai', ei: 'hei', ao: 'hao', ou: 'hou', er: '', iu: '', ui: 'hui', ie: '', 'üe': '' },
  j: { ai: '', ei: '', ao: '', ou: '', er: '', iu: 'jiu', ui: '', ie: 'jie', 'üe': 'jue' },
  q: { ai: '', ei: '', ao: '', ou: '', er: '', iu: 'qiu', ui: '', ie: 'qie', 'üe': 'que' },
  x: { ai: '', ei: '', ao: '', ou: '', er: '', iu: 'xiu', ui: '', ie: 'xie', 'üe': 'xue' },
  zh: { ai: 'zhai', ei: 'zhei', ao: 'zhao', ou: 'zhou', er: '', iu: '', ui: 'zhui', ie: '', 'üe': '' },
  ch: { ai: 'chai', ei: '', ao: 'chao', ou: 'chou', er: '', iu: '', ui: 'chui', ie: '', 'üe': '' },
  sh: { ai: 'shai', ei: 'shei', ao: 'shao', ou: 'shou', er: '', iu: '', ui: 'shui', ie: '', 'üe': '' },
  r: { ai: '', ei: '', ao: 'rao', ou: 'rou', er: '', iu: '', ui: 'rui', ie: '', 'üe': '' },
  z: { ai: 'zai', ei: 'zei', ao: 'zao', ou: 'zou', er: '', iu: '', ui: 'zui', ie: '', 'üe': '' },
  c: { ai: 'cai', ei: 'cei', ao: 'cao', ou: 'cou', er: '', iu: '', ui: 'cui', ie: '', 'üe': '' },
  s: { ai: 'sai', ei: 'sei', ao: 'sao', ou: 'sou', er: '', iu: '', ui: 'sui', ie: '', 'üe': '' },
};

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
    reviewVocabDir,
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
  for (const file of reviewImageFiles.values()) {
    const source = file.replace(/^review-/, 'vocab-');
    await copyIfExists(path.join(reviewSourceRoot, 'slides/assets/vocab-images', source), path.join(reviewVocabDir, file));
  }
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
  const placeholderRecords = new Set();
  for (const item of vocab) {
    const targetPath = path.join(slidesDir, item.image_file);
    if (!await exists(targetPath)) {
      await fs.writeFile(targetPath, png);
      placeholderRecords.add(item.record_id);
    }
  }
  const prompts = vocab.map((item) => {
    const isPlaceholder = placeholderRecords.has(item.record_id);
    return {
      record_id: item.record_id,
      chinese_simplified: item.chinese_simplified,
      pinyin: item.pinyin,
      vietnamese: item.vietnamese,
      filename: path.basename(item.image_file),
      status: isPlaceholder ? 'placeholder_needs_generation' : 'existing_asset_preserved',
      prompt: `Soft textbook 1:1 illustration for ${item.vietnamese}; no text, labels, letters, numbers, or watermark.`,
      visual_description: `${isPlaceholder ? 'Placeholder image' : 'Existing image'} for ${item.chinese_simplified} (${item.pinyin}).`,
    };
  });
  await fs.writeFile(path.join(vocabDir, 'prompts.json'), `${JSON.stringify({ prompts }, null, 2)}\n`, 'utf8');
  return placeholderRecords.size;
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
.cover{position:absolute;inset:0;background:linear-gradient(145deg,#F4FAFA 0%,#FFFFFF 56%,#F3F0FA 100%);overflow:hidden}.cover:before{content:"";position:absolute;right:-80px;top:-120px;width:360px;height:360px;border-radius:50%;background:rgba(90,172,172,.13)}.cover-card{position:absolute;left:62px;top:78px;width:520px;z-index:2}.lesson{display:inline-flex;align-items:center;gap:10px;background:#E8F4F4;color:#5AACAC;padding:10px 21px;border-radius:999px;font-weight:800;font-size:21px}.cover-align{justify-content:flex-start;gap:14px;margin-top:26px}.cover-align .a-word{min-height:88px}.cover-align .a-pin{font-size:21px}.cover-align .a-han{font-size:76px}.vi{font-size:30px;color:#4A6080;font-weight:800;margin-top:20px}.cover-sounds{display:flex;flex-wrap:wrap;align-items:center;gap:12px 14px;width:520px;margin-top:22px}.cover-chip-break{flex-basis:100%;height:0}.cover-sound-chip{display:inline-flex;align-items:center;justify-content:center;gap:13px;min-height:44px;padding:0 18px;border-radius:999px;background:rgba(255,255,255,.78);border:1px solid rgba(90,172,172,.2);box-shadow:0 8px 22px rgba(90,172,172,.09);font-size:24px;line-height:1;font-weight:900;color:#4A6080;white-space:nowrap}.cover-sound-chip .arrow{color:#5AACAC;margin:0 1px}.topic-img{position:absolute;right:50px;top:92px;width:318px;height:318px;border-radius:24px;overflow:hidden;background:#F8FBFB;border:2px solid rgba(90,172,172,.18);box-shadow:0 16px 44px rgba(26,58,90,.16)}.topic-img img{width:100%;height:100%;object-fit:cover}
.lesson-goal-left{position:absolute;left:60px;top:78px;width:530px}.lesson-goal-title{margin-bottom:28px;font-size:34px;line-height:1.12;font-weight:900;color:#1A3A5A}.lesson-goal-cards{display:flex;flex-direction:column;gap:14px}.lesson-goal{padding:15px 20px;display:flex;align-items:center;gap:16px;font-size:17px;color:#4A6080;line-height:1.34}.lesson-goal-num{width:26px;height:26px;background:#5AACAC;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0}.lesson-goal-right{position:absolute;right:54px;top:98px;width:306px;height:306px;border-radius:20px;overflow:hidden;background:#F8FBFB;border:2px solid rgba(90,172,172,.18);box-shadow:0 10px 28px rgba(90,172,172,.14)}.lesson-goal-right img{width:100%;height:100%;object-fit:cover}.goal-hot{color:#F05A62;font-weight:950}
.divider-left{position:absolute;left:0;top:40px;bottom:0;width:54%;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.divider-super{font-size:28px;line-height:1.1;color:#1A3A5A;font-weight:900;margin-bottom:12px}.divider-kicker{font-size:15px;color:#5AACAC;text-transform:uppercase;letter-spacing:3px;font-weight:900;margin-bottom:12px}.divider-zh{font-family:'Noto Sans SC';font-size:62px;font-weight:900;color:#1A3A5A;margin-bottom:16px}.divider-line{width:88px;height:5px;border-radius:999px;background:#5AACAC}.divider-photo{position:absolute;right:82px;top:116px;width:300px;height:300px;border-radius:20px;overflow:hidden;background:#F8FBFB;border:2px solid rgba(90,172,172,.18);box-shadow:0 8px 24px rgba(90,172,172,.12)}.divider-photo img{width:100%;height:100%;object-fit:cover}
.sound-table{width:100%;border-collapse:separate;border-spacing:8px}.sound-table th,.sound-table td{height:48px;border-radius:13px;text-align:center;font-weight:900;font-size:21px;vertical-align:middle}.sound-table th{background:#E8F4F4;color:#5AACAC}.sound-table td{background:#fff;border:1px solid rgba(90,172,172,.18);color:#1A3A5A}.sound-table .rowh{background:#F3F0FA;color:#7C6BC8}.chart-empty{opacity:.34;color:#8A9AB0}.chart-dash{display:inline-flex;align-items:center;justify-content:center;width:100%;height:100%;line-height:1}
.chart-full{position:absolute;left:34px;right:34px;top:58px;bottom:22px}.chart-full-card{position:absolute;inset:0;background:#fff;border:1px solid rgba(90,172,172,.16);border-radius:20px;box-shadow:0 8px 26px rgba(90,172,172,.12);padding:10px}.sound-table-full{height:100%;border-spacing:8px;table-layout:fixed}.sound-table-full th,.sound-table-full td{height:auto;font-size:29px;border-radius:15px}.sound-table-full th{font-size:26px}.sound-table-full .rowh{font-size:31px}
.word-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:13px 14px}.word-card{position:relative;background:#fff;border-radius:18px;padding:10px 8px 12px;text-align:center;border:1px solid rgba(90,172,172,.16);box-shadow:0 8px 24px rgba(90,172,172,.10);height:184px;overflow:visible}.word-card img{width:78px;height:78px;border-radius:12px;border:2px solid #5AACAC;object-fit:cover;background:#F4FAFA;margin-bottom:8px}.word-card .pinyin{font-size:17px;font-weight:900;color:#5AACAC;line-height:1.16}.word-card .hanzi{font-family:'Noto Sans SC';font-size:31px;line-height:1.12;margin-top:3px;color:#1A3A5A;font-weight:900}.word-card .vietnamese{font-size:12px;line-height:1.22;color:#5F7088;font-weight:700;margin-top:3px}
.sound-only{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}.sound-only-row{display:flex;align-items:center;justify-content:center;gap:30px;flex-wrap:wrap;width:820px}.sound-only-token{width:112px;height:112px;border-radius:24px;background:#fff;border:2px solid rgba(90,172,172,.26);box-shadow:0 12px 30px rgba(90,172,172,.13);display:flex;align-items:center;justify-content:center;font-size:72px;line-height:1;font-weight:900;color:#1A3A5A}.sound-only-token:nth-child(2n){background:#F4FAFA}.sound-only-token:nth-child(3n){background:#F3F0FA}
.flash-title{position:absolute;left:58px;top:70px;font-size:20pt;font-weight:800;color:#1A3A5A}.flash-count{position:absolute;right:58px;top:78px;background:#E8F4F4;color:#5AACAC;border-radius:999px;padding:6px 16px;font-size:10pt;font-weight:900}
.flash-card{position:absolute;left:50%;top:116px;transform:translateX(-50%);width:430px;height:326px;perspective:1200px;cursor:pointer}.flip-trigger{position:absolute;width:0;height:0;opacity:0;pointer-events:none}.flip-inner{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .68s cubic-bezier(.2,.8,.2,1)}.flip-face{position:absolute;inset:0;border-radius:24px;background:#fff;box-shadow:0 14px 38px rgba(90,172,172,.16);border:1px solid rgba(90,172,172,.16);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;overflow:hidden;backface-visibility:hidden;transition:opacity .18s ease;box-sizing:border-box;padding:22px 42px 22px 76px}.flip-face:before{content:"";position:absolute;left:0;top:0;bottom:0;width:58px;background:linear-gradient(180deg,#D4EDED,#E8F4F4)}.flip-face:after{content:"";position:absolute;right:12px;top:12px;width:86px;height:86px;border-radius:50%;background:rgba(200,184,232,.16)}.face-pin{transform:rotateY(0deg);opacity:1}.face-answer{transform:rotateY(180deg);opacity:0}.flash-card:has(.answer-trigger.revealed) .flip-inner{transform:rotateY(180deg)}.flash-card:has(.answer-trigger.revealed) .face-pin{opacity:0}.flash-card:has(.answer-trigger.revealed) .face-answer{opacity:1}.flash-hint,.face-label,.flash-pinyin,.flash-answer-row,.flash-meaning{position:relative;z-index:1}.flash-hint,.face-label{display:inline-flex;align-items:center;justify-content:center;background:#F6FBFB;color:#8A9AB0;border-radius:999px;padding:6px 16px;font-size:10pt;font-weight:800;margin-bottom:12px}.face-label{background:#E8F4F4;color:#5AACAC}.flash-pinyin{font-size:58pt;line-height:1;font-weight:900;color:#1A3A5A;letter-spacing:0}.flash-answer-row{display:flex;align-items:center;justify-content:center;gap:22px;width:100%}.flash-answer-row img{width:138px;height:138px;object-fit:cover;border-radius:18px;border:2px solid #5AACAC;background:#F8FBFB;box-shadow:0 10px 24px rgba(90,172,172,.14);flex:none}.flash-meaning{text-align:left;font-size:26pt;line-height:1.12;font-weight:900;color:#1A3A5A;max-width:180px}
.practice-bank{display:flex;flex-wrap:wrap;gap:12px;margin-top:18px}.practice-bank span{height:44px;min-width:84px;padding:0 14px;border-radius:999px;background:#fff;border:1px solid rgba(90,172,172,.2);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#1A3A5A}.choice-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:18px}.choice{display:flex;align-items:center;gap:10px;background:#fff;border-radius:14px;border:1px solid rgba(90,172,172,.16);padding:12px 14px;font-size:18px;font-weight:800;color:#1A3A5A}.num{width:28px;height:28px;border-radius:999px;background:#5AACAC;color:white;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;flex:none}
.tone-family{position:absolute;left:78px;right:78px;top:86px;bottom:48px}.tone-family-title{font-size:38px;line-height:1.1;font-weight:900;color:#1A3A5A;margin-bottom:22px;text-align:center}.tone-family-board{display:grid;gap:14px}.tone-family-row{display:grid;grid-template-columns:74px repeat(4,1fr);gap:12px;align-items:center}.tone-family-base{height:72px;border-radius:18px;background:#E8F4F4;color:#5AACAC;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900}.tone-family-token{height:72px;border-radius:18px;background:#fff;border:1px solid rgba(90,172,172,.18);box-shadow:0 8px 22px rgba(90,172,172,.09);display:flex;align-items:center;justify-content:center;font-size:37px;font-weight:900;color:#1A3A5A}.tone-family-row:nth-child(2) .tone-family-token{background:#F8FBFB}.tone-family-row:nth-child(3) .tone-family-token{background:#F7F4FC}.tone-family-row:nth-child(4) .tone-family-token{background:#FFF8E8}
.tone-match-title{font-size:26px;font-weight:900;color:#1A3A5A;line-height:1.14;margin-bottom:12px}.tone-match-board{position:relative;display:grid;grid-template-columns:270px 1fr 270px;gap:32px;align-items:start;margin-top:8px}.tone-match-col{display:grid;gap:6px}.tone-match-card{min-height:38px;border-radius:15px;background:#fff;border:2px solid #B8EDF8;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 15px rgba(90,172,172,.08);padding:4px 10px;text-align:center}.tone-match-card .pin{font-size:23px;font-weight:900;color:#294778;line-height:1.06}.tone-label{min-height:38px;border-radius:15px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:#1A3A5A;box-shadow:0 6px 15px rgba(90,172,172,.07);padding:4px 10px;text-align:center}.tone-label:nth-child(1){background:#E8F4F4;color:#387E86}.tone-label:nth-child(2){background:#FFF4D8;color:#A66F12}.tone-label:nth-child(3){background:#F3F0FA;color:#6E58B8}.tone-label:nth-child(4){background:#FCEFF3;color:#C84B63}.tone-label:nth-child(5){background:#EEF3FA;color:#5F7088}.tone-label:nth-child(6){background:#E8F4F4;color:#387E86}.tone-label:nth-child(7){background:#FFF4D8;color:#A66F12}.tone-label:nth-child(8){background:#F3F0FA;color:#6E58B8}.tone-match-space{height:340px;border-radius:22px;background:rgba(90,172,172,.045);border:1px dashed rgba(90,172,172,.22)}
.tone-choice-wrap{position:absolute;left:58px;right:58px;top:74px;bottom:42px}.tone-choice-title{font-size:36px;line-height:1.1;font-weight:900;color:#1A3A5A;margin:0 0 8px}.tone-choice-desc{font-size:19px;line-height:1.35;font-weight:800;color:#5F7088;margin:0 0 18px}.tone-choice-table{width:850px;border-collapse:collapse;table-layout:fixed;background:#F4F8FD;box-shadow:0 10px 28px rgba(26,58,90,.10)}.tone-choice-table tr:nth-child(odd) td{background:#D9E4F2}.tone-choice-table tr:nth-child(even) td{background:#EEF3FA}.tone-choice-table td{height:52px;border:1px solid rgba(255,255,255,.34);font-size:28px;font-weight:900;color:#294778;vertical-align:middle}.tone-choice-table .qno{width:66px;background:transparent!important;text-align:center}.tone-choice-num{width:38px;height:38px;border-radius:999px;background:#5AACAC;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:23px;box-shadow:0 5px 12px rgba(90,172,172,.24)}.tone-choice-table .opt{padding-left:20px}.tone-choice-table .letter{font-weight:900;margin-right:10px}
.listen-head{display:flex;align-items:center;justify-content:center;margin-bottom:16px;text-align:center}.listen-title{font-size:29px;font-weight:900;color:#1A3A5A;line-height:1.18}.final-bank{width:760px;margin:4px auto 18px;background:rgba(255,255,255,.86);border:1px solid rgba(90,172,172,.16);border-radius:16px;text-align:center;padding:10px 18px;box-shadow:0 6px 20px rgba(90,172,172,.08)}.final-bank-title{font-size:18px;color:#5F7088;font-weight:800;margin-bottom:6px}.finals{display:flex;justify-content:space-around;font-size:25px;font-weight:900;color:#3B7DB4}.listen-grid{display:grid;grid-template-columns:repeat(3,1fr);column-gap:28px;row-gap:20px;margin-top:10px}.listen-item{font-size:25px;color:#202530;line-height:1.1;white-space:nowrap}.listen-no{font-size:23px;margin-right:8px;color:#202530}.blank{display:inline-block;width:44px;border-bottom:3px solid #202530;transform:translateY(-3px);margin:0 4px}.blank.short{width:36px}.initial-cue{display:inline-block;min-width:48px;text-align:center;font-weight:900;color:#1A3A5A;margin-right:4px}.answer-red{color:#F05A62;font-weight:950}.tone-cued{position:relative;display:inline-block;line-height:1;margin:0 1px;padding-top:12px;vertical-align:baseline}.tone-cue{position:absolute;top:0;left:50%;transform:translateX(-50%);font-size:12px;line-height:1;color:#8A9AB0;font-weight:900;white-space:nowrap}.tone-letter{line-height:1}
${pinyinExerciseCss()}
.rule-center{position:absolute;left:60px;right:60px;top:92px;bottom:54px;display:flex;flex-direction:column;align-items:center;justify-content:center}.rule-center .title-xl{text-align:center;margin-bottom:28px}.rule-grid{width:100%;display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.rule-card{height:154px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;justify-items:center;text-align:center;gap:10px}.rule-card .from,.rule-card .to{font-size:46px;line-height:1;font-weight:950;color:#1A3A5A}.rule-card .from{color:#7C6BC8}.rule-card .arrow{font-size:34px;font-weight:950;color:#5AACAC}.closing{position:relative;overflow:hidden;background:linear-gradient(112deg,#F5FAF4 0%,#FFFFFF 46%,#DFF1E8 100%)}.closing:before{content:"";position:absolute;left:34px;top:24px;width:300px;height:246px;border-radius:54% 46% 44% 56%;background:rgba(149,212,187,.23);z-index:0}.closing:after{content:"";position:absolute;right:-54px;bottom:-108px;width:372px;height:294px;border-radius:55% 45% 50% 50%;background:rgba(149,212,187,.20);z-index:0}.closing-card-ref{position:absolute;left:96px;right:84px;top:88px;bottom:62px;border-radius:34px;background:rgba(255,255,255,.96);box-shadow:0 18px 34px rgba(36,50,74,.18);z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding-left:164px}.closing-door{position:absolute;left:-36px;top:-64px;width:290px;height:266px;object-fit:contain;z-index:2;filter:drop-shadow(0 6px 10px rgba(36,50,74,.10))}.closing-zh{font-family:'Noto Sans SC';font-size:84pt;line-height:.92;font-weight:900;color:#143C68;letter-spacing:0}.closing-sub{margin-top:30px;font-size:29pt;line-height:1.1;font-weight:900;color:#7BC6A7}.closing-next{margin-top:22px;font-size:17pt;line-height:1.25;font-weight:700;color:#6B6F76}
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
  return `<div class="cover-sounds">${groups.map((tokens) => tokens === 'break' ? '<div class="cover-chip-break"></div>' : `<div class="cover-sound-chip">${tokens.map((token) => token === '→' ? '<span class="arrow">→</span>' : `<span>${esc(token)}</span>`).join('')}</div>`).join('')}</div>`;
}

function matchPinyinHanzi(pinyin, hanzi) {
  return `<span>${esc(pinyin)}</span><span class="match-han">${esc(hanzi)}</span>`;
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
    title: 'Pinyin Bài 4',
    body: `<div class="slide"><div class="cover"><div class="cover-card"><div class="lesson">PINYIN 4 · 拼音第四课</div>${coverPinyinTitle()}${coverSoundChips([['ai', 'ao', 'ou', 'ei', 'er'], ['iu', 'ui', 'ie', 'üe'], 'break', ['j/q/x', '+', 'üe', '→', 'jue/que/xue']])}</div><div class="topic-img"><img src="assets/photos/cover-topic.png" alt=""></div></div></div>`,
  });
}

function objectivesSlide(vocabCount) {
  const goals = [
    'Học vận mẫu kép <strong class="goal-hot">ai ao ou ei er</strong>.',
    'Học vận mẫu <strong class="goal-hot">iu ui ie üe</strong> và cách viết <strong class="goal-hot">jue/que/xue</strong>.',
    'Luyện ghép với 21 thanh mẫu và đọc có <strong class="goal-hot">thanh điệu</strong>.',
    `Đọc đúng ${vocabCount} từ vựng.`,
  ];
  return slideShell({
    title: 'Mục tiêu học tập',
    icon: 'target',
    label: 'MỤC TIÊU',
    content: `<div class="lesson-goal-left"><div class="lesson-goal-title">Hôm nay bạn sẽ học gì?</div><div class="lesson-goal-cards">${goals.map((goal, i) => `<div class="lesson-goal soft-card"><div class="lesson-goal-num">${i + 1}</div><div>${goal}</div></div>`).join('')}</div></div><div class="lesson-goal-right"><img src="assets/sample-images/objectives.png" alt=""></div>`,
  });
}

function dividerSlide({ title, zh, label, img, icon = 'sparkles', superTitle = '' }) {
  return slideShell({
    title,
    icon,
    label,
    content: `<div class="divider-left">${superTitle ? `<div class="divider-super">${esc(superTitle)}</div>` : ''}<div class="divider-kicker">${esc(label)}</div><div class="divider-zh">${esc(zh)}</div><div class="divider-line"></div></div><div class="divider-photo"><img src="assets/photos/${img}" alt=""></div>`,
  });
}

function yiBuDividerSlide() {
  return slideShell({
    title: 'Biến điệu của 一 và 不',
    icon: 'wand-sparkles',
    label: 'Biến điệu của 一 và 不',
    extraCss: `.divider-yi-bu-special .divider-kicker{font-size:22px;line-height:1.18;text-transform:none;letter-spacing:0;max-width:360px}.divider-yi-bu-special .divider-zh{font-size:56px;white-space:nowrap}`,
    content: `<div class="divider-left divider-yi-bu-special"><div class="divider-kicker">Biến điệu của 一 và 不</div><div class="divider-zh">一、不变调</div><div class="divider-line"></div></div><div class="divider-photo"><img src="assets/photos/divider-yi-bu-pinyin-04.png" alt=""></div>`,
  });
}

function summaryInitialsDividerSlide() {
  return slideShell({
    title: 'Bảng tổng hợp thanh mẫu pinyin 声母总表',
    icon: 'table-2',
    label: 'Bảng tổng hợp',
    extraCss: `.divider-summary-special .divider-kicker{font-size:21px;line-height:1.16;text-transform:none;letter-spacing:0;max-width:390px}.divider-summary-special .divider-zh{font-size:56px;white-space:nowrap}`,
    content: `<div class="divider-left divider-summary-special"><div class="divider-kicker">Bảng tổng hợp thanh mẫu pinyin</div><div class="divider-zh">声母总表</div><div class="divider-line"></div></div><div class="divider-photo"><img src="assets/photos/divider-pinyin-summary-pinyin-04.png" alt=""></div>`,
  });
}

function warmupSlide(reviewItems) {
  const pairs = reviewItems.slice(0, 6).map((item) => {
    const zh = simplify(item.hanzi);
    return {
      pinyin: item.pinyin,
      hanzi: zh,
      image: `assets/review-vocab-images/${reviewImageFiles.get(zh) || ''}`,
    };
  });
  return imageMatchingPracticeSlide({
    title: 'Nối từ Bài 3 với hình ảnh',
    instruction: 'Nối từ Bài 3 với hình ảnh.',
    pairs,
    label: 'Ôn bài 3',
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

function chartRows(chart, values = {}) {
  const tableValues = Object.keys(values).length ? values : Object.fromEntries(chart.initials.map((initial) => [
    initial,
    Object.fromEntries(chart.finals.map((final) => [final, lesson4FinalChart[initial]?.[final] ?? ''])),
  ]));
  return chart.initials.map((initial) => `<tr><th class="rowh">${esc(initial)}</th>${chart.finals.map((final, i) => {
    const value = tableValues[initial]?.[final] || '';
    return `<td class="${value ? '' : 'chart-empty'}">${value ? esc(value) : '<span class="chart-dash">-</span>'}</td>`;
  }).join('')}</tr>`).join('');
}

function chartSlide(chart, title, values = null, label = 'Bảng ghép âm', extraCss = '') {
  return slideShell({
    title,
    icon: 'table-2',
    label,
    content: `<div class="chart-full"><div class="chart-full-card"><table class="sound-table sound-table-full"><thead><tr><th></th>${chart.finals.map((final) => `<th>${esc(final)}</th>`).join('')}</tr></thead><tbody>${chartRows(chart, values || {})}</tbody></table></div></div>`,
    extraCss,
  });
}

function subsetChart(chart, initials) {
  return { ...chart, initials };
}

function markTone(syllable, tone = 1) {
  const marks = {
    a: ['ā', 'á', 'ǎ', 'à'],
    e: ['ē', 'é', 'ě', 'è'],
    o: ['ō', 'ó', 'ǒ', 'ò'],
    i: ['ī', 'í', 'ǐ', 'ì'],
    u: ['ū', 'ú', 'ǔ', 'ù'],
    ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
  };
  if (!tone || tone < 1 || tone > 4) return syllable;
  const text = String(syllable);
  const markIndex = tone - 1;
  const priority = text.includes('a') ? 'a'
    : text.includes('e') ? 'e'
      : text.includes('ou') ? 'o'
        : text.includes('iu') ? 'u'
          : text.includes('ui') ? 'i'
            : ['o', 'i', 'u', 'ü'].find((vowel) => text.includes(vowel));
  if (!priority) return text;
  return text.replace(priority, marks[priority][markIndex]);
}

function tonedValues(chart, tone = 1) {
  return Object.fromEntries(chart.initials.map((initial) => [
    initial,
    Object.fromEntries(chart.finals.map((final) => {
      const syllable = lesson4FinalChart[initial]?.[final] ?? '';
      return [final, syllable ? markTone(syllable, tone) : ''];
    })),
  ]));
}

function finalsIntroSlide(title, finals, label = 'Vận mẫu') {
  const cards = finals.map((symbol) => `<div class="sound-only-token">${esc(symbol)}</div>`).join('');
  return slideShell({
    title,
    icon: 'volume-2',
    label,
    content: `<div class="sound-only"><div class="sound-only-row">${cards}</div></div>`,
  });
}

function erStandaloneSlide() {
  return slideShell({
    title: 'Vận mẫu er',
    icon: 'volume-2',
    label: 'Vận mẫu',
    content: `<div class="rule-center er-standalone"><div class="title-xl">er thường đứng độc lập</div><div class="er-token">er</div><div class="er-tones"><span>ēr</span><span>ér</span><span>ěr</span><span>èr</span></div></div>`,
    extraCss: `.er-standalone{gap:20px}.er-token{width:170px;height:120px;border-radius:28px;background:#fff;border:2px solid rgba(90,172,172,.26);box-shadow:0 12px 30px rgba(90,172,172,.14);display:flex;align-items:center;justify-content:center;font-size:76px;font-weight:950;color:#1A3A5A}.er-tones{display:flex;gap:14px}.er-tones span{width:104px;height:64px;border-radius:20px;background:#F4FAFA;border:1px solid rgba(90,172,172,.22);display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:900;color:#5AACAC}`,
  });
}

function finalPracticeSlide({ title, rows, labels }) {
  return slideShell({
    title,
    icon: 'mic-2',
    label: 'Luyện đọc',
    content: renderReadingDrillBoard({ title, rows, rowLabels: labels, titleAlign: 'left' }),
    extraCss: `.tone-family{left:60px;right:60px;top:82px}.tone-family-title{font-size:32px;margin-bottom:16px}.tone-family-board{gap:10px}.tone-family-row{grid-template-columns:82px repeat(4,1fr);gap:10px}.tone-family-base,.tone-family-token{height:62px}.tone-family-token{font-size:31px}`,
  });
}

function ueRuleSlide() {
  return slideShell({
    title: 'Quy tắc j/q/x + üe',
    icon: 'wand-sparkles',
    label: 'Quy tắc viết pinyin',
    content: `<div class="rule-center"><div class="title-xl">j/q/x + üe: viết bỏ hai chấm</div><div class="rule-grid">${[
      ['jüe', 'jue'],
      ['qüe', 'que'],
      ['xüe', 'xue'],
    ].map(([from, to]) => `<div class="soft-card rule-card"><div class="from">${esc(from)}</div><div class="arrow">→</div><div class="to">${esc(to)}</div></div>`).join('')}</div></div>`,
  });
}

function ueExamplesSlide() {
  const examples = [
    ['juéde', '觉得', 'cảm thấy'],
    ['quē', '缺', 'thiếu'],
    ['xué', '学', 'học'],
  ];
  return slideShell({
    title: 'Đọc theo quy tắc üe',
    icon: 'list-checks',
    label: 'Quy tắc viết pinyin',
    content: `<div class="content"><div class="tone-family-title left">Đọc theo quy tắc üe</div><div class="ue-examples">${examples.map(([pin, han, vi]) => `<div class="soft-card ue-example"><div class="pin">${esc(pin)}</div><div class="han">${esc(han)}</div><div class="vi-small">${esc(vi)}</div></div>`).join('')}</div></div>`,
    extraCss: `.ue-examples{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:34px}.ue-example{height:220px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.ue-example .pin{font-size:34px;line-height:1;font-weight:900;color:#5AACAC}.ue-example .han{font-family:'Noto Sans SC';font-size:56px;line-height:1.05;font-weight:900;color:#1A3A5A;margin-top:16px}.ue-example .vi-small{font-size:18px;line-height:1.25;color:#5F7088;font-weight:800;margin-top:14px}`,
  });
}

function ueRuleChoiceSlide() {
  return multipleChoicePracticeSlide({
    title: 'Chọn cách viết đúng',
    instruction: 'Nghe âm có üe, chọn dạng pinyin viết đúng.',
    label: 'Ôn tập',
    rows: [
      ['jue', 'jüe', 'jüie', 'jui'],
      ['que', 'qüe', 'qui', 'quie'],
      ['xue', 'xüe', 'xui', 'xüeie'],
      ['juéde', 'jüéde', 'jüede', 'juiéde'],
      ['quē', 'qüē', 'qiuē', 'quei'],
    ],
  });
}

function pinyinPracticeSlide({ title, items, instruction, titleAlign = 'center' }) {
  const rows = [];
  for (let i = 0; i < items.length; i += 4) rows.push(items.slice(i, i + 4));
  const rowLabels = title.includes('z c s') ? ['z', 'c', 's'] : ['zh', 'ch', 'sh', 'r'];
  return slideShell({
    title,
    icon: 'mic-2',
    label: 'Luyện đọc',
    content: renderReadingDrillBoard({ title, rows, rowLabels, titleAlign }),
  });
}

function tonePracticeChartSlide(chart, title, values) {
  return chartSlide(chart, title, values, 'Luyện đọc');
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

function vocabPracticeSlide(set, title, partLabel = '') {
  const pairs = set.items.map((item) => ({
    pinyin: item.pinyin,
    hanzi: item.chinese_simplified,
    image: item.image_file,
  }));
  return imageMatchingPracticeSlide({
    title: title || imageMatchTitle,
    instruction: imageMatchInstruction,
    pairs,
    partLabel,
    label: 'Luyện từ vựng',
  });
}

function matchingPracticeSlide({ title, instruction, leftTitle, rightTitle, pairs, label = 'Luyện tập' }) {
  return slideShell({
    title,
    icon: 'git-branch',
    label,
    content: renderMatchingBoard({ instruction, leftTitle, rightTitle, pairs }),
  });
}

function imageMatchingPracticeSlide({ title, instruction, pairs, partLabel = '', label = 'Luyện tập' }) {
  return slideShell({
    title,
    icon: 'git-branch',
    label,
    content: renderImageMatchingBoard({ instruction, pairs, partLabel }),
  });
}

function ruleYiFirstToneSlide() {
  return slideShell({
    title: 'Khi nào 一 đọc thanh 1?',
    icon: 'wand-sparkles',
    label: 'Biến điệu',
    content: `<div class="content yi-first-content"><div class="yi-first-title">Khi nào <span>一</span> đọc thanh 1?</div><div class="yi-first-grid">${[
      {
        title: 'Đọc thứ tự',
        note: 'Từ chỉ thứ tự.',
        examples: [
          ['xīngqīyī', '星期一'],
          ['dìyī', '第一'],
          ['yīlóu', '一楼'],
        ],
      },
      {
        title: 'Đọc từng số',
        note: 'Khi đọc số điện thoại, năm, mã số.',
        examples: [
          ['yī, sān, jiǔ...', '1, 3, 9...'],
          ['èr líng yī liù', '2016'],
        ],
      },
    ].map((card) => `<div class="soft-card yi-first-card"><div class="yi-first-card-title">${esc(card.title)}</div><div class="yi-first-note">${esc(card.note)}</div><div class="yi-first-examples">${card.examples.map(([pin, han]) => `<div class="yi-first-example"><div class="pin">${esc(pin)}</div><div class="han">${esc(han)}</div></div>`).join('')}</div></div>`).join('')}</div></div>`,
    extraCss: `.yi-first-content{top:90px}.yi-first-title{font-size:34px;line-height:1.1;font-weight:900;color:#1A3A5A;text-align:left}.yi-first-title span{font-family:'Noto Sans SC';color:#D85A6A}.yi-first-title b{color:#D85A6A}.yi-first-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px}.yi-first-card{height:268px;padding:20px 22px}.yi-first-card-title{font-size:22px;line-height:1.12;font-weight:900;color:#1A3A5A}.yi-first-note{font-size:14px;line-height:1.35;font-weight:750;color:#5F7088;margin-top:7px}.yi-first-examples{display:flex;flex-direction:column;gap:9px;margin-top:14px}.yi-first-example{height:43px;border-radius:13px;background:#F7FBFB;border:1px solid rgba(90,172,172,.28);display:flex;align-items:center;justify-content:space-between;padding:0 15px}.yi-first-example .pin{font-size:16px;line-height:1;font-weight:850;color:#D85A6A}.yi-first-example .han{font-family:'Noto Sans SC';font-size:22px;line-height:1;font-weight:900;color:#1A3A5A}`,
  });
}

function ruleYiSlide() {
  return slideShell({
    title: 'Quy tắc biến điệu của 一',
    icon: 'wand-sparkles',
    label: 'Biến điệu',
    content: `<div class="rule-center"><div class="title-xl">Quy tắc biến điệu của 一</div><div class="rule-grid yi-bu-grid">${[
      ['一 + thanh 4', 'yí'],
      ['一 + thanh 1/2/3', 'yì'],
    ].map(([from, to]) => `<div class="soft-card rule-card"><div class="from">${esc(from)}</div><div class="arrow">→</div><div class="to">${esc(to)}</div></div>`).join('')}</div></div>`,
    extraCss: `.yi-bu-grid{grid-template-columns:1fr;max-width:760px;gap:22px}.yi-bu-grid .rule-card{height:132px;display:grid;grid-template-columns:minmax(0,1fr) 72px 170px;align-items:center;padding:0 44px}.yi-bu-grid .from{font-size:36px;white-space:nowrap}.yi-bu-grid .arrow{font-size:44px}.yi-bu-grid .to{font-size:60px;color:#D85A6A}`,
  });
}

function ruleBuSlide() {
  return slideShell({
    title: 'Quy tắc biến điệu của 不',
    icon: 'wand-sparkles',
    label: 'Biến điệu',
    content: `<div class="rule-center"><div class="title-xl">Quy tắc biến điệu của 不</div><div class="rule-grid yi-bu-grid">${[
      ['不 + thanh 4', 'bú'],
      ['不 + thanh khác', 'bù'],
    ].map(([from, to]) => `<div class="soft-card rule-card"><div class="from">${esc(from)}</div><div class="arrow">→</div><div class="to">${esc(to)}</div></div>`).join('')}</div></div>`,
    extraCss: `.yi-bu-grid{grid-template-columns:1fr;max-width:760px;gap:22px}.yi-bu-grid .rule-card{height:132px;display:grid;grid-template-columns:minmax(0,1fr) 72px 170px;align-items:center;padding:0 44px}.yi-bu-grid .from{font-size:36px;white-space:nowrap}.yi-bu-grid .arrow{font-size:44px}.yi-bu-grid .to{font-size:60px;color:#D85A6A}`,
  });
}

function ruleExamplesSlide() {
  return slideShell({
    title: 'Luyện đọc',
    icon: 'list-checks',
    label: 'Biến điệu',
    content: `<div class="content"><div class="tone-family-title left">Luyện đọc</div><div class="yi-bu-examples">${[
      ['一个', 'yí ge', 'một cái'],
      ['一杯茶', 'yì bēi chá', 'một ly trà'],
      ['一组', 'yì zǔ', 'một nhóm'],
      ['不热', 'bú rè', 'không nóng'],
      ['不吃', 'bù chī', 'không ăn'],
      ['不是', 'bú shì', 'không phải'],
    ].map(([hanzi, pinyin, vi]) => `<div class="soft-card yi-bu-example"><div class="pin">${esc(pinyin)}</div><div class="han">${esc(hanzi)}</div><div class="vi-small">${esc(vi)}</div></div>`).join('')}</div></div>`,
    extraCss: `.yi-bu-examples{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:18px}.yi-bu-example{height:126px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.yi-bu-example .pin{font-size:24px;line-height:1;font-weight:900;color:#5AACAC}.yi-bu-example .han{font-family:'Noto Sans SC';font-size:39px;line-height:1.05;font-weight:900;color:#1A3A5A;margin-top:8px}.yi-bu-example .vi-small{font-size:14px;line-height:1.2;color:#5F7088;font-weight:800;margin-top:8px}`,
  });
}

function rulePracticeSlide() {
  const rows = [
    ['yí ge', 'yī ge', 'yì ge', 'yǐ ge'],
    ['yì bēi', 'yí bēi', 'yī bēi', 'yǐ bēi'],
    ['bú rè', 'bù rè', 'bǔ rè', 'bū rè'],
    ['bù chī', 'bú chī', 'bū chī', 'bǔ chī'],
    ['yì zǔ', 'yí zǔ', 'yī zǔ', 'yǐ zǔ'],
    ['bú shì', 'bù shì', 'bū shì', 'bǔ shì'],
  ];
  const bodyRows = rows.map((row, i) => `<tr><td class="qno"><span class="tone-choice-num">${i + 1}</span></td>${row.map((item, j) => `<td class="opt"><span class="letter">${String.fromCharCode(65 + j)}.</span>${esc(item)}</td>`).join('')}</tr>`).join('');
  return slideShell({
    title: 'Chọn cách đọc đúng',
    icon: 'headphones',
    label: 'Luyện biến điệu',
    content: `<div class="tone-choice-wrap"><div class="tone-choice-title">Chọn cách đọc đúng</div><table class="tone-choice-table"><tbody>${bodyRows}</tbody></table></div>`,
  });
}

function multipleChoicePracticeSlide({ title, instruction, rows, label = 'Ôn tập' }) {
  return slideShell({
    title,
    icon: 'headphones',
    label,
    content: renderMultipleChoiceTable({ title, instruction, rows }),
  });
}

function reviewChoiceSlide() {
  const rows = [
    ['kāi', 'kēi', 'kǎo', 'kōu'],
    ['cài', 'cèi', 'cuì', 'cào'],
    ['māo', 'mōu', 'mǎi', 'mēi'],
    ['shǒu', 'shuǐ', 'shǎo', 'shéi'],
    ['liù', 'liè', 'luì', 'liáo'],
    ['xué', 'xié', 'xuéde', 'xuē'],
  ];
  const bodyRows = rows.map((row, i) => `<tr><td class="qno"><span class="tone-choice-num">${i + 1}</span></td>${row.map((item, j) => `<td class="opt"><span class="letter">${String.fromCharCode(65 + j)}.</span>${esc(item)}</td>`).join('')}</tr>`).join('');
  return slideShell({
    title: 'Nghe và chọn pinyin đúng',
    icon: 'headphones',
    label: 'Ôn tập',
    content: `<div class="tone-choice-wrap"><div class="tone-choice-title">Nghe và chọn pinyin đúng</div><table class="tone-choice-table"><tbody>${bodyRows}</tbody></table></div>`,
  });
}

function fillBlankPracticeSlide() {
  return slideShell({
    title: 'Điền vận mẫu còn thiếu',
    icon: 'edit-3',
    label: 'Ôn tập',
    content: renderFillBlankBoard({
      title: 'Điền vận mẫu còn thiếu.',
      bankTitle: 'Vận mẫu',
      bankItems: ['ai', 'ao', 'ou', 'ei', 'er', 'iu', 'ui', 'ie', 'üe'],
      prompts: [
        { initial: 'k', finalPart: 'āi', reveal: true },
        { initial: 'c', finalPart: 'ài' },
        { initial: 'm', finalPart: 'āo' },
        { initial: 'sh', finalPart: 'ǎo' },
        { initial: 'sh', finalPart: 'ǒu' },
        { initial: 'sh', finalPart: 'éi' },
        { initial: 'l', finalPart: 'iù' },
        { initial: 'n', finalPart: 'iú' },
        { initial: 'g', finalPart: 'uì' },
        { initial: 'x', finalPart: 'iě' },
        { initial: 'j', finalPart: 'ué' },
        { initial: 'q', finalPart: 'uē' },
      ].map((prompt) => ({ ...prompt, mode: 'final' })),
    }),
  });
}

function initialsSummarySlide(summary) {
  const rows = [
    { label: 'Âm môi', zh: '双唇音', group: ['b', 'p', 'm', 'f'], tone: 'blue' },
    { label: 'Âm đầu lưỡi', zh: '舌尖音', group: ['d', 't', 'n', 'l'], tone: 'green' },
    { label: 'Âm gốc lưỡi', zh: '舌根音', group: ['g', 'k', 'h'], tone: 'purple' },
    { label: 'Âm mặt lưỡi', zh: '舌面音', group: ['j', 'q', 'x'], tone: 'amber' },
    { label: 'Âm uốn lưỡi', zh: '翘舌音', group: ['zh', 'ch', 'sh', 'r'], tone: 'rose' },
    { label: 'Âm đầu lưỡi trước', zh: '平舌音', group: ['z', 'c', 's'], tone: 'teal' },
  ];
  return slideShell({
    title: 'Bảng tổng hợp thanh mẫu pinyin 声母总表',
    icon: 'table-2',
    label: 'Bảng tổng hợp',
    content: `<div class="summary-table-wrap"><div class="summary-table-card"><table class="summary-table"><tbody>${rows.map((row) => `<tr class="${row.tone}"><th><span>${esc(row.label)}</span><small>${esc(row.zh)}</small></th><td>${row.group.map((item) => `<span>${esc(item)}</span>`).join('')}</td></tr>`).join('')}</tbody></table></div></div>`,
    extraCss: `.summary-table-wrap{position:absolute;left:52px;right:52px;top:70px;bottom:34px}.summary-table-card{height:100%;border-radius:24px;background:linear-gradient(180deg,#FFFFFF 0%,#F7FBFB 100%);border:2px solid rgba(90,172,172,.18);box-shadow:0 14px 34px rgba(26,58,90,.12);padding:14px;box-sizing:border-box}.summary-table{width:100%;height:100%;border-collapse:separate;border-spacing:0 6px;table-layout:fixed}.summary-table th{width:242px;border-radius:17px 0 0 17px;text-align:left;padding:0 18px;color:#1A3A5A;vertical-align:middle}.summary-table th span{display:block;font-size:19px;line-height:1.08;font-weight:900;white-space:nowrap}.summary-table th small{display:block;margin-top:4px;font-family:'Noto Sans SC';font-size:16px;line-height:1;font-weight:900;color:rgba(26,58,90,.62)}.summary-table td{border-radius:0 17px 17px 0;background:#fff;border:1px solid rgba(90,172,172,.14);border-left:0;padding:5px 18px;display:flex;align-items:center;gap:15px;box-sizing:border-box}.summary-table td span{min-width:72px;height:43px;border-radius:14px;background:#FFFFFF;border:1px solid rgba(26,58,90,.10);display:inline-flex;align-items:center;justify-content:center;font-size:31px;line-height:1;font-weight:950;color:#1A3A5A;box-shadow:0 5px 12px rgba(26,58,90,.06)}.summary-table tr.blue th{background:#DDEBF8}.summary-table tr.green th{background:#E4F1E6}.summary-table tr.purple th{background:#EEE8F8}.summary-table tr.amber th{background:#FFF0D2}.summary-table tr.rose th{background:#F9E3EA}.summary-table tr.teal th{background:#DDF1F0}.summary-table tr.blue td{background:#F6FAFE}.summary-table tr.green td{background:#F7FBF7}.summary-table tr.purple td{background:#FAF8FE}.summary-table tr.amber td{background:#FFFCF5}.summary-table tr.rose td{background:#FDF7F9}.summary-table tr.teal td{background:#F6FCFC}`,
  });
}

function meaningMatchSlide(items, partLabel = '') {
  return imageMatchingPracticeSlide({
    title: imageMatchTitle,
    instruction: imageMatchInstruction,
    pairs: items.map((item) => ({ pinyin: item.pinyin, hanzi: item.chinese_simplified, image: item.image_file })),
    partLabel,
    label: 'Ôn tập',
  });
}

function closingSlide() {
  return htmlDoc({
    title: 'Kết thúc',
    body: `<div class="slide closing"><div class="closing-card-ref"><img class="closing-door" src="assets/reference/closing-door-students.png" alt=""><div class="closing-zh">下课</div><div class="closing-sub">Bạn có câu hỏi gì không?</div><div class="closing-next">Bài tiếp theo: Pinyin 5</div></div></div>`,
  });
}

function activeRootIndex() {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=slides/index.html">
  <title>Pinyin Bài 4</title>
  <script>window.location.replace('slides/index.html');</script>
</head>
<body>
  <p><a href="slides/index.html">Mở Pinyin Bài 4</a></p>
</body>
</html>
`;
}

async function writeSlides(db, vocab, sets) {
  const slides = [];
  const add = (name, html) => slides.push({ name, html });
  const addVocabOverview = (baseName, set) => {
    const chunks = chunkItems(set.items, set.items.length > 8 ? 5 : 8);
    chunks.forEach((items, i) => {
      const suffix = chunks.length > 1 ? `-${i + 1}` : '';
      add(`${baseName}${suffix}`, vocabularyGridSlide({ ...set, items }, `${set.title_vi}${chunks.length > 1 ? ` ${i + 1}` : ''}`));
    });
  };
  const addVocabPractice = (baseName, set, title) => {
    const chunks = chunkItems(set.items, set.items.length <= 6 ? 6 : 5);
    chunks.forEach((items, i) => {
      const suffix = chunks.length > 1 ? `-${i + 1}` : '';
      const part = chunks.length > 1 ? `phần ${i + 1}` : '';
      add(`${baseName}${suffix}`, vocabPracticeSlide({ ...set, items }, title, part));
    });
  };
  const chart1 = db.pinyin_charts.find((chart) => chart.item_id === 'pinyin_chart_l4_group_1');
  const chart2 = db.pinyin_charts.find((chart) => chart.item_id === 'pinyin_chart_l4_group_2');
  const set1 = sets[0];
  const set2 = sets[1];
  const set3 = sets[2];
  const rowGroups = [
    { name: 'labial-alveolar', title: 'b p m f / d t n l', initials: ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l'] },
    { name: 'velar-palatal', title: 'g k h / j q x', initials: ['g', 'k', 'h', 'j', 'q', 'x'] },
    { name: 'retroflex-dental', title: 'zh ch sh r / z c s', initials: ['zh', 'ch', 'sh', 'r', 'z', 'c', 's'] },
  ];

  add('cover', coverSlide());
  add('objectives', objectivesSlide(vocab.length));
  add('divider-review', dividerSlide({ title: 'Ôn bài 3', zh: '复习', label: 'ÔN BÀI 3', img: 'divider-review.png', icon: 'refresh-cw', superTitle: 'Khởi động' }));
  add('warmup-review', warmupSlide(db.warmup_activity.source_vocabulary));
  add('divider-finals-1', dividerSlide({ title: 'Vận mẫu kép 1', zh: '复韵母', label: 'VẬN MẪU 1', img: 'divider-finals.png', icon: 'volume-2' }));
  add('finals-ai-ao-ou-ei-er', finalsIntroSlide('ai ao ou ei er', ['ai', 'ao', 'ou', 'ei', 'er']));
  rowGroups.forEach((group) => {
    add(`chart-group-1-${group.name}`, chartSlide(subsetChart(chart1, group.initials), `${group.title} + ai ao ou ei er`, null, 'Bảng ghép âm', `.sound-table-full th,.sound-table-full td{font-size:25px}.sound-table-full .rowh{font-size:27px}`));
  });
  add('er-standalone', erStandaloneSlide());
  add('practice-finals-1', finalPracticeSlide({
    title: 'Luyện đọc ai ao ou ei er',
    labels: ['ai', 'ao', 'ou', 'ei'],
    rows: [
      ['bāi', 'pái', 'mǎi', 'dài'],
      ['gāo', 'kǎo', 'hào', 'shǎo'],
      ['kǒu', 'shǒu', 'zǒu', 'hòu'],
      ['bēi', 'péi', 'gěi', 'shéi'],
    ],
  }));
  add('divider-vocabulary-1', dividerSlide({ title: 'Từ vựng 1', zh: '词汇', label: 'TỪ VỰNG 1', img: 'divider-vocabulary.png', icon: 'images' }));
  addVocabOverview('vocabulary-1', set1);
  set1.items.forEach((item, i) => add(`flash-${item.record_id.toLowerCase()}-${slug(item.pinyin)}`, flashcardSlide(item, i, set1.items.length, 1)));
  addVocabPractice('practice-vocabulary-1', set1, 'Luyện từ vựng 1');

  add('divider-finals-2', dividerSlide({ title: 'Vận mẫu kép 2', zh: '复韵母', label: 'VẬN MẪU 2', img: 'divider-finals.png', icon: 'volume-2' }));
  add('finals-iu-ui-ie-ue', finalsIntroSlide('iu ui ie üe', ['iu', 'ui', 'ie', 'üe']));
  rowGroups.forEach((group) => {
    add(`chart-group-2-${group.name}`, chartSlide(subsetChart(chart2, group.initials), `${group.title} + iu ui ie`, null, 'Bảng ghép âm', `.sound-table-full th,.sound-table-full td{font-size:27px}.sound-table-full .rowh{font-size:29px}`));
  });
  add('practice-finals-2', finalPracticeSlide({
    title: 'Luyện đọc iu ui ie',
    labels: ['iu', 'ui', 'ie', 'üe'],
    rows: [
      ['liù', 'niú', 'qiú', 'jiǔ'],
      ['duì', 'shuì', 'guì', 'zuǐ'],
      ['bié', 'xiě', 'jiě', 'tiě'],
      ['jué', 'quē', 'xué', 'yuè'],
    ],
  }));
  add('divider-vocabulary-2', dividerSlide({ title: 'Từ vựng 2', zh: '词汇', label: 'TỪ VỰNG 2', img: 'divider-vocabulary.png', icon: 'images' }));
  addVocabOverview('vocabulary-2', set2);
  set2.items.forEach((item, i) => add(`flash-${item.record_id.toLowerCase()}-${slug(item.pinyin)}`, flashcardSlide(item, i, set2.items.length, 2)));
  addVocabPractice('practice-vocabulary-2', set2, 'Luyện từ vựng 2');

  add('divider-rule-ue', dividerSlide({ title: 'Quy tắc j/q/x + üe', zh: '拼写规则', label: 'QUY TẮC VIẾT', img: 'divider-sounds.png', icon: 'wand-sparkles' }));
  add('rule-jqx-ue', ueRuleSlide());
  add('rule-jqx-ue-examples', ueExamplesSlide());
  add('divider-vocabulary-3', dividerSlide({ title: 'Từ vựng 3', zh: '词汇', label: 'TỪ VỰNG 3', img: 'divider-vocabulary.png', icon: 'images' }));
  addVocabOverview('vocabulary-3', set3);
  set3.items.forEach((item, i) => add(`flash-${item.record_id.toLowerCase()}-${slug(item.pinyin)}`, flashcardSlide(item, i, set3.items.length, 3)));
  addVocabPractice('practice-vocabulary-3', set3, 'Luyện từ vựng 3');

  add('divider-review-final', dividerSlide({ title: 'Luyện tập tổng hợp', zh: '练习', label: 'ÔN TẬP', img: 'divider-review.png', icon: 'check-circle-2' }));
  add('review-listening-choice', reviewChoiceSlide());
  add('review-fill-blank', fillBlankPracticeSlide());
  add('review-vocabulary-match', meaningMatchSlide(vocab.slice(0, 6), 'phần 1'));
  add('review-rule-choice', ueRuleChoiceSlide());
  add('closing', closingSlide());

  for (let i = 0; i < slides.length; i += 1) {
    const no = String(i + 1).padStart(2, '0');
    const file = `${no}-${slides[i].name}.html`;
    await fs.writeFile(path.join(slidesDir, file), slides[i].html, 'utf8');
  }
  return slides.map((slide, i) => `${String(i + 1).padStart(2, '0')}-${slide.name}.html`);
}

async function writeTeacherGuide(db, vocab, sets, slideFiles) {
  const guide = `# Pinyin Bài 4 - Teacher Prep

## Mục tiêu

- Ôn lại từ vựng Pinyin Bài 3 bằng nghe, đọc và hiểu nghĩa.
- Dạy nhóm vận mẫu kép \`ai ao ou ei er\`, sau đó \`iu ui ie üe\`.
- Luyện ghép các vận mẫu mới với 21 thanh mẫu đã học, kèm thanh điệu.
- Dạy quy tắc \`j/q/x + üe\`: viết thành \`jue/que/xue\`, nhưng vẫn nhắc học viên nhớ âm gốc liên quan tới \`üe\`.
- Với từ vựng, ưu tiên phát âm đúng và hiểu nghĩa. Không yêu cầu nhận mặt chữ Hán.

## Trình tự lớp học

1. Mở bài và mục tiêu.
2. Ôn nhanh Bài 3.
3. Dạy nhóm vận mẫu 1: \`ai ao ou ei er\`.
4. Ghép âm với 21 thanh mẫu theo nhóm nhỏ; không ép cả bảng vào một lần đọc.
5. Từ vựng 1: ${sets[0].items.map((item) => `${item.chinese_simplified} ${item.pinyin}`).join(', ')}.
6. Dạy nhóm vận mẫu 2: \`iu ui ie üe\`.
7. Ghép âm và luyện đọc có thanh điệu.
8. Từ vựng 2: ${sets[1].items.map((item) => `${item.chinese_simplified} ${item.pinyin}`).join(', ')}.
9. Quy tắc \`j/q/x + üe\` bằng ba cặp \`jüe→jue\`, \`qüe→que\`, \`xüe→xue\`.
10. Từ vựng 3: ${sets[2].items.map((item) => `${item.chinese_simplified} ${item.pinyin}`).join(', ')}.
11. Ôn tập nghe chọn pinyin, điền vận mẫu, ghép nghĩa và nhận diện cách viết đúng.

## Từ vựng

| Pinyin | Giản thể | Nghĩa |
|---|---|---|
${vocab.map((item) => `| ${item.pinyin} | ${item.chinese_simplified} | ${item.vietnamese} |`).join('\n')}

## Ghi chú

- Slide dùng ảnh placeholder 1:1 theo quy trình image asset. Khi cần ảnh thật, thay từng ảnh bằng \`npm run assets:replace\` hoặc crop từ contact sheet.
- Không export PDF sạch cho đến khi Adam xác nhận nội dung và thiết kế đã chốt.
- Tổng số slide hiện tại: ${slideFiles.length}.
`;

  const brief = `# Huashu Brief - Pinyin Bài 4

## Deck

- Output: \`output/pinyin/pinyin-04/slides/\`
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
  await fs.writeFile(path.join(lessonRoot, 'README.md'), `# Pinyin Bài 4

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
  const vocabPlaceholdersCreated = await writePlaceholderImages(vocab);
  const slideFiles = await writeSlides(db, vocab, sets);
  await writeTeacherGuide(db, vocab, sets, slideFiles);
  await writeReadme(slideFiles);
  await fs.writeFile(path.join(lessonRoot, 'index.html'), activeRootIndex(), 'utf8');

  console.log(JSON.stringify({
    lesson: path.relative(root, lessonRoot),
    teacher_prep: path.relative(root, path.join(teacherGuideDir, 'teacher-prep.md')),
    huashu_brief: path.relative(root, path.join(teacherGuideDir, 'huashu-brief.md')),
    slides: slideFiles.length,
    vocab_placeholders_created: vocabPlaceholdersCreated,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
