#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { spawnSync } from 'child_process';
import sharp from 'sharp';
import {
  chunkItems,
  pinyinExerciseCss,
  renderFillBlankBoard,
  renderImageMatchingBoard,
  renderMultipleChoiceTable,
  renderReadingDrillBoard,
} from './pinyin-exercise-templates.mjs';
import {
  vocabularyGridClass,
  vocabularyGridCss,
} from './vocabulary-grid-layout.mjs';

const root = process.cwd();
const templateRoot = path.join(root, 'output/pinyin/pinyin-01');
const lessons = process.argv.slice(2).filter((arg) => /^\d+$/.test(arg)).map((arg) => arg.padStart(2, '0'));
const lessonNos = lessons.length ? lessons : ['05', '06', '07'];

const zhMap = new Map(Object.entries({
  課: '课', 聲: '声', 韻: '韵', 複: '复', 與: '与', 規: '规', 則: '则', 寫: '写',
  飯: '饭', 雞: '鸡', 軍: '军', 訓: '训', 湯: '汤', 髒: '脏', 聽: '听', 龍: '龙', 電: '电',
  錢: '钱', 說: '说', 壞: '坏', 船: '船', 選: '选', 鴨: '鸭', 爺: '爷', 藥: '药',
  顏: '颜', 羊: '羊', 游: '游', 襪: '袜', 外: '外', 忘: '忘', 甕: '瓮', 喂: '喂',
  魚: '鱼', 雨: '雨', 圓: '圆', 雲: '云', 越: '越', 門: '门',
}));

const meanings = new Map(Object.entries({
  米饭: 'cơm', 男: 'nam', 鸡蛋: 'trứng gà', 门: 'cửa', 人: 'người', 新: 'mới', 春: 'mùa xuân', 困: 'buồn ngủ',
  军人: 'quân nhân', 裙子: 'váy', 培训: 'đào tạo', 汤: 'canh', 脏: 'bẩn', 疼: 'đau', 冷: 'lạnh', 名字: 'tên',
  听: 'nghe', 龙: 'rồng', 成功: 'thành công',
  家: 'nhà', 下: 'dưới, xuống', 脚: 'chân', 小: 'nhỏ', 电: 'điện', 钱: 'tiền', 香: 'thơm', 穷: 'nghèo',
  花: 'hoa', 黄瓜: 'dưa chuột', 多: 'nhiều', 说: 'nói', 坏: 'xấu, hỏng', 快: 'nhanh', 船: 'thuyền', 床: 'giường',
  春卷: 'chả giò', 安全: 'an toàn', 选: 'chọn',
  一: 'một', 音: 'âm', 赢: 'thắng', 鸭: 'vịt', 爷爷: 'ông nội', 药: 'thuốc', 颜色: 'màu sắc',
  羊: 'dê, cừu', 使用: 'sử dụng', 游泳: 'bơi', 五: 'năm', 袜子: 'tất', 我: 'tôi',
  外面: 'bên ngoài', 玩: 'chơi', 忘记: 'quên', 瓮: 'cái chum', 喂: 'alo', 文化: 'văn hóa',
  鱼: 'cá', 雨: 'mưa', 月: 'trăng, tháng', 越南: 'Việt Nam', 圆: 'tròn', 云: 'mây',
}));

const validByLesson = {
  '05': {
    an: ['ban', 'pan', 'man', 'fan', 'dan', 'tan', 'nan', 'lan', 'gan', 'kan', 'han', 'zhan', 'chan', 'shan', 'ran', 'zan', 'can', 'san'],
    en: ['ben', 'pen', 'men', 'fen', 'den', 'nen', 'gen', 'ken', 'hen', 'zhen', 'chen', 'shen', 'ren', 'zen', 'cen', 'sen'],
    in: ['bin', 'pin', 'min', 'nin', 'lin', 'jin', 'qin', 'xin'],
    'uen(un)': ['dun', 'tun', 'lun', 'gun', 'kun', 'hun', 'zhun', 'chun', 'shun', 'run', 'zun', 'cun', 'sun'],
    ang: ['bang', 'pang', 'mang', 'fang', 'dang', 'tang', 'nang', 'lang', 'gang', 'kang', 'hang', 'zhang', 'chang', 'shang', 'rang', 'zang', 'cang', 'sang'],
    eng: ['beng', 'peng', 'meng', 'feng', 'deng', 'teng', 'neng', 'leng', 'geng', 'keng', 'heng', 'zheng', 'cheng', 'sheng', 'reng', 'zeng', 'ceng', 'seng'],
    ing: ['bing', 'ping', 'ming', 'ding', 'ting', 'ning', 'ling', 'jing', 'qing', 'xing'],
    ong: ['dong', 'tong', 'nong', 'long', 'gong', 'kong', 'hong', 'zhong', 'chong', 'rong', 'zong', 'cong', 'song', 'jiong', 'qiong', 'xiong'],
  },
  '06': {
    ia: ['dia', 'lia', 'jia', 'qia', 'xia'],
    iao: ['biao', 'piao', 'miao', 'diao', 'tiao', 'niao', 'liao', 'jiao', 'qiao', 'xiao'],
    ian: ['bian', 'pian', 'mian', 'dian', 'tian', 'nian', 'lian', 'jian', 'qian', 'xian'],
    iang: ['niang', 'liang', 'jiang', 'qiang', 'xiang'],
    iong: ['jiong', 'qiong', 'xiong'],
    ua: ['gua', 'kua', 'hua', 'zhua', 'chua', 'shua'],
    uo: ['duo', 'tuo', 'nuo', 'luo', 'guo', 'kuo', 'huo', 'zhuo', 'chuo', 'shuo', 'ruo', 'zuo', 'cuo', 'suo'],
    uai: ['guai', 'kuai', 'huai', 'zhuai', 'chuai', 'shuai'],
    uan: ['duan', 'tuan', 'nuan', 'luan', 'guan', 'kuan', 'huan', 'zhuan', 'chuan', 'shuan', 'ruan', 'zuan', 'cuan', 'suan'],
    uang: ['guang', 'kuang', 'huang', 'zhuang', 'chuang', 'shuang'],
    üan: ['juan', 'quan', 'xuan', 'yuan'],
  },
};

const esc = (value = '') => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const simplify = (value = '') => String(value).split('').map((ch) => zhMap.get(ch) || ch).join('');
const slug = (value = '') => String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'item';
const displayFinal = (value = '') => value === 'uen(un)' ? 'un' : value;
const pageNo = (value = '') => Number(String(value).match(/P(\d+)/)?.[1] || 999);
const letterSuffix = (index) => String.fromCharCode(97 + index);
const upperLabel = (value = '') => String(value).toLocaleUpperCase('vi-VN');

async function exists(file) {
  try { await fs.stat(file); return true; } catch { return false; }
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

function css() {
  return `
.content{position:absolute;left:58px;right:58px;top:72px;bottom:42px}.title-xl{font-size:34px;line-height:1.12;font-weight:900;color:#1A3A5A}.muted{color:#5F7088}.goal-hot{color:#F05A62;font-weight:950}.soft-card{background:#fff;border:1px solid rgba(90,172,172,.16);border-radius:20px;box-shadow:0 8px 26px rgba(90,172,172,.12);padding:18px}
.cover{position:absolute;inset:0;background:linear-gradient(145deg,#F4FAFA 0%,#FFFFFF 56%,#F3F0FA 100%);overflow:hidden}.cover:before{content:"";position:absolute;right:-80px;top:-120px;width:360px;height:360px;border-radius:50%;background:rgba(90,172,172,.13)}.cover-card{position:absolute;left:62px;top:78px;width:530px;z-index:2}.lesson{display:inline-flex;align-items:center;gap:10px;background:#E8F4F4;color:#5AACAC;padding:10px 21px;border-radius:999px;font-weight:800;font-size:21px}.aligned-text{display:flex;align-items:flex-end;gap:14px;flex-wrap:wrap}.a-word{display:flex;flex-direction:column;align-items:center}.a-pin{font-size:21px;line-height:1;color:#5AACAC;font-weight:800;margin-bottom:7px}.a-han{font-family:'Noto Sans SC';font-size:76px;line-height:1;color:#1A3A5A;font-weight:900}.cover-align{margin-top:26px}.cover-sounds{display:flex;flex-wrap:wrap;align-items:center;gap:12px 14px;width:530px;margin-top:22px}.cover-chip-break{flex-basis:100%;height:0}.cover-sound-chip{display:inline-flex;align-items:center;justify-content:center;gap:13px;min-height:44px;padding:0 18px;border-radius:999px;background:rgba(255,255,255,.78);border:1px solid rgba(90,172,172,.2);box-shadow:0 8px 22px rgba(90,172,172,.09);font-size:24px;line-height:1;font-weight:900;color:#4A6080;white-space:nowrap}.topic-img{position:absolute;right:50px;top:92px;width:318px;height:318px;border-radius:24px;overflow:hidden;background:#F8FBFB;border:2px solid rgba(90,172,172,.18);box-shadow:0 16px 44px rgba(26,58,90,.16)}.topic-img img{width:100%;height:100%;object-fit:cover}
.lesson-goal-left{position:absolute;left:60px;top:78px;width:540px}.lesson-goal-title{margin-bottom:24px;font-size:34px;line-height:1.12;font-weight:900;color:#1A3A5A}.lesson-goal-cards{display:flex;flex-direction:column;gap:13px}.lesson-goal{padding:14px 18px;display:flex;align-items:center;gap:16px;font-size:16px;color:#4A6080;line-height:1.34}.lesson-goal-num{width:26px;height:26px;background:#5AACAC;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0}.lesson-goal-right{position:absolute;right:54px;top:98px;width:306px;height:306px;border-radius:20px;overflow:hidden;background:#F8FBFB;border:2px solid rgba(90,172,172,.18);box-shadow:0 10px 28px rgba(90,172,172,.14)}.lesson-goal-right img{width:100%;height:100%;object-fit:cover}
.divider-left{position:absolute;left:0;top:40px;bottom:0;width:54%;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.divider-super{font-size:28px;line-height:1.1;color:#1A3A5A;font-weight:900;margin-bottom:12px}.divider-kicker{font-size:15px;color:#5AACAC;text-transform:uppercase;letter-spacing:3px;font-weight:900;margin-bottom:12px}.divider-zh{font-family:'Noto Sans SC';font-size:60px;font-weight:900;color:#1A3A5A;margin-bottom:16px}.divider-line{width:88px;height:5px;border-radius:999px;background:#5AACAC}.divider-photo{position:absolute;right:82px;top:116px;width:300px;height:300px;border-radius:20px;overflow:hidden;background:#F8FBFB;border:2px solid rgba(90,172,172,.18);box-shadow:0 8px 24px rgba(90,172,172,.12)}.divider-photo img{width:100%;height:100%;object-fit:cover}
.sound-only{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}.sound-only-row{display:flex;align-items:center;justify-content:center;gap:24px;flex-wrap:wrap;width:830px}.sound-only-token{min-width:100px;height:104px;padding:0 18px;border-radius:24px;background:#fff;border:2px solid rgba(90,172,172,.26);box-shadow:0 12px 30px rgba(90,172,172,.13);display:flex;align-items:center;justify-content:center;font-size:56px;line-height:1;font-weight:900;color:#1A3A5A}
.chart-full{position:absolute;left:34px;right:34px;top:58px;bottom:22px}.chart-full-card{position:absolute;inset:0;background:#fff;border:1px solid rgba(90,172,172,.16);border-radius:20px;box-shadow:0 8px 26px rgba(90,172,172,.12);padding:10px}.sound-table{width:100%;height:100%;border-collapse:separate;border-spacing:7px;table-layout:fixed}.sound-table th,.sound-table td{border-radius:13px;text-align:center;font-weight:900;font-size:23px;vertical-align:middle}.sound-table th{background:#E8F4F4;color:#5AACAC}.sound-table .rowh{background:#F3F0FA;color:#7C6BC8;font-size:26px}.sound-table td{background:#fff;border:1px solid rgba(90,172,172,.18);color:#1A3A5A}.chart-empty{opacity:.34;color:#8A9AB0}
.word-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:13px 14px}${vocabularyGridCss()}.word-card{position:relative;background:#fff;border-radius:18px;padding:10px 8px 12px;text-align:center;border:1px solid rgba(90,172,172,.16);box-shadow:0 8px 24px rgba(90,172,172,.10);height:184px;overflow:visible}.word-card img{width:78px;height:78px;border-radius:12px;border:2px solid #5AACAC;object-fit:cover;background:#F4FAFA;margin-bottom:8px}.word-card .pinyin{font-size:17px;font-weight:900;color:#5AACAC;line-height:1.16}.word-card .hanzi{font-family:'Noto Sans SC';font-size:31px;line-height:1.12;margin-top:3px;color:#1A3A5A;font-weight:900}.word-card .vietnamese{font-size:12px;line-height:1.22;color:#5F7088;font-weight:700;margin-top:3px}
.flash-title{position:absolute;left:58px;top:70px;font-size:20pt;font-weight:800;color:#1A3A5A}.flash-count{position:absolute;right:58px;top:78px;background:#E8F4F4;color:#5AACAC;border-radius:999px;padding:6px 16px;font-size:10pt;font-weight:900}.flash-card{position:absolute;left:50%;top:116px;transform:translateX(-50%);width:430px;height:326px;perspective:1200px;cursor:pointer}.flip-trigger{position:absolute;width:0;height:0;opacity:0;pointer-events:none}.flip-inner{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .68s cubic-bezier(.2,.8,.2,1)}.flip-face{position:absolute;inset:0;border-radius:24px;background:#fff;box-shadow:0 14px 38px rgba(90,172,172,.16);border:1px solid rgba(90,172,172,.16);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;overflow:hidden;backface-visibility:hidden;transition:opacity .18s ease;box-sizing:border-box;padding:22px 42px 22px 76px}.flip-face:before{content:"";position:absolute;left:0;top:0;bottom:0;width:58px;background:linear-gradient(180deg,#D4EDED,#E8F4F4)}.face-answer{transform:rotateY(180deg);opacity:0}.flash-card:has(.answer-trigger.revealed) .flip-inner{transform:rotateY(180deg)}.flash-card:has(.answer-trigger.revealed) .face-answer{opacity:1}.flash-card:has(.answer-trigger.revealed) .face-pin{opacity:0}.flash-hint,.face-label{display:inline-flex;background:#F6FBFB;color:#8A9AB0;border-radius:999px;padding:6px 16px;font-size:10pt;font-weight:800;margin-bottom:12px}.face-label{background:#E8F4F4;color:#5AACAC}.flash-pinyin{font-size:58pt;line-height:1;font-weight:900;color:#1A3A5A}.flash-answer-row{display:flex;align-items:center;justify-content:center;gap:22px;width:100%}.flash-answer-row img{width:138px;height:138px;object-fit:cover;border-radius:18px;border:2px solid #5AACAC;background:#F8FBFB;box-shadow:0 10px 24px rgba(90,172,172,.14);flex:none}.flash-meaning{text-align:left;font-size:26pt;line-height:1.12;font-weight:900;color:#1A3A5A;max-width:180px}
.rule-center{position:absolute;left:60px;right:60px;top:92px;bottom:54px;display:flex;flex-direction:column;align-items:center;justify-content:center}.rule-grid{width:100%;display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.rule-card{height:154px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;justify-items:center;text-align:center;gap:10px}.rule-card .from,.rule-card .to{font-size:42px;line-height:1;font-weight:950;color:#1A3A5A}.rule-card .from{color:#7C6BC8}.rule-card .arrow{font-size:34px;font-weight:950;color:#5AACAC}
.closing{position:relative;overflow:hidden;background:linear-gradient(112deg,#F5FAF4 0%,#FFFFFF 46%,#DFF1E8 100%)}.closing-card-ref{position:absolute;left:96px;right:84px;top:88px;bottom:62px;border-radius:34px;background:rgba(255,255,255,.96);box-shadow:0 18px 34px rgba(36,50,74,.18);z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding-left:164px}.closing-door{position:absolute;left:-36px;top:-64px;width:290px;height:266px;object-fit:contain;z-index:2}.closing-zh{font-family:'Noto Sans SC';font-size:84pt;line-height:.92;font-weight:900;color:#143C68}.closing-sub{margin-top:30px;font-size:29pt;line-height:1.1;font-weight:900;color:#7BC6A7}.closing-next{margin-top:22px;font-size:17pt;line-height:1.25;font-weight:700;color:#6B6F76}
${pinyinExerciseCss()}`;
}

function htmlDoc({ title, body, extraCss = '' }) {
  return `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=960,height=540"><title>${esc(title)}</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+SC:wght@400;700;900&display=swap" rel="stylesheet"><script src="https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js"></script><link rel="stylesheet" href="assets/slide-base.css"><style>${css()}${extraCss}</style></head><body>${body}<script src="assets/slide-base.js"></script></body></html>`;
}

function slideShell({ title, icon = 'book-open', label = title, content, extraCss = '' }) {
  return htmlDoc({ title, extraCss, body: `<div class="slide"><div class="menu-bar"><span class="menu-icon"><i data-lucide="${icon}"></i></span><span class="section-label">${esc(label)}</span></div>${content}</div>` });
}

function coverTitle() {
  return `<div class="aligned-text cover-align"><span class="a-word"><span class="a-pin">pīn</span><span class="a-han">拼</span></span><span class="a-word"><span class="a-pin">yīn</span><span class="a-han">音</span></span></div>`;
}

function soundChips(tokens) {
  return `<div class="cover-sounds">${tokens.map((group) => group === 'break' ? '<div class="cover-chip-break"></div>' : `<div class="cover-sound-chip">${group.map(esc).join('<span style="width:8px"></span>')}</div>`).join('')}</div>`;
}

function coverSlide(no, groups) {
  return htmlDoc({
    title: `Pinyin Bài ${Number(no)}`,
    body: `<div class="slide"><div class="cover"><div class="cover-card"><div class="lesson">PINYIN ${Number(no)} · 拼音第${Number(no)}课</div>${coverTitle()}${soundChips(groups)}</div><div class="topic-img"><img src="assets/photos/cover-topic.png" alt=""></div></div></div>`,
  });
}

function lessonGoals(no, vocabCount) {
  const goalsByLesson = {
    '05': [
      'Học vận mẫu mũi trước an en in un ün.',
      'Học vận mẫu mũi sau ang eng ing ong.',
      'Nắm quy tắc j/q/x + ün.',
      `Đọc đúng ${vocabCount} từ vựng.`,
    ],
    '06': [
      'Học vận mẫu ia iao ian iang iong.',
      'Học vận mẫu ua uo uai uan uang üan.',
      'Nắm quy tắc j/q/x + üan.',
      `Đọc đúng ${vocabCount} từ vựng.`,
    ],
    '07': [
      'Nắm quy tắc i mở đầu: yi, yin, ying, ya, ye, yao, yan, yang, yong, you.',
      'Nắm quy tắc u mở đầu: wu, wa, wo, wai, wan, wang, weng, wei, wen.',
      'Nắm quy tắc ü mở đầu: yu, yue, yuan, yun và pinyin viết liền theo từ.',
      `Đọc đúng ${vocabCount} từ vựng.`,
    ],
  };
  return goalsByLesson[no] || [`Đọc đúng ${vocabCount} từ vựng.`];
}

function highlightGoal(goal) {
  const terms = [
    'j/q/x', 'ia', 'iao', 'ian', 'iang', 'iong', 'ua', 'uo', 'uai', 'uan', 'uang', 'üan',
    'an', 'en', 'in', 'un', 'ün', 'ang', 'eng', 'ing', 'ong',
    'yi', 'yin', 'ying', 'yao', 'yan', 'yang', 'yong', 'you', 'ya', 'ye',
    'wu', 'wai', 'wan', 'wang', 'weng', 'wei', 'wen', 'wa', 'wo',
    'yu', 'yue', 'yuan', 'yun',
  ];
  const pattern = new RegExp(`(^|[^A-Za-züÜ])(${terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?=$|[^A-Za-züÜ])`, 'g');
  return esc(goal).replace(pattern, '$1<strong class="goal-hot">$2</strong>');
}

function objectivesSlide(no, db, vocabCount) {
  const goals = lessonGoals(no, vocabCount);
  return slideShell({
    title: 'Mục tiêu học tập',
    icon: 'target',
    label: 'MỤC TIÊU',
    content: `<div class="lesson-goal-left"><div class="lesson-goal-title">Hôm nay bạn sẽ học gì?</div><div class="lesson-goal-cards">${goals.map((goal, i) => `<div class="lesson-goal soft-card"><div class="lesson-goal-num">${i + 1}</div><div>${highlightGoal(goal)}</div></div>`).join('')}</div></div><div class="lesson-goal-right"><img src="assets/sample-images/objectives.png" alt=""></div>`,
  });
}

function dividerSlide({ title, zh, label, img = 'divider-finals.png', icon = 'sparkles', superTitle = '' }) {
  return slideShell({
    title, icon, label,
    content: `<div class="divider-left">${superTitle ? `<div class="divider-super">${esc(superTitle)}</div>` : ''}<div class="divider-kicker">${esc(label)}</div><div class="divider-zh">${esc(simplify(zh))}</div><div class="divider-line"></div></div><div class="divider-photo"><img src="assets/photos/${img}" alt=""></div>`,
  });
}

function soundsSlide(title, items, label = 'Vận mẫu') {
  return slideShell({
    title, icon: 'volume-2', label,
    content: `<div class="sound-only"><div class="sound-only-row">${items.map((item) => `<div class="sound-only-token">${esc(item)}</div>`).join('')}</div></div>`,
  });
}

function cellValue(no, initial, final) {
  const values = validByLesson[no]?.[final] || [];
  if (final === 'üan' && ['j', 'q', 'x'].includes(initial)) return ({ j: 'juan', q: 'quan', x: 'xuan' })[initial];
  const value = `${initial}${final === 'uen(un)' ? 'un' : final}`;
  return values.includes(value) ? value : '';
}

function chartSlide(no, chart, initials, label = 'Bảng ghép âm') {
  const rows = initials.map((initial) => `<tr><th class="rowh">${esc(initial)}</th>${chart.finals.map((final) => {
    const value = cellValue(no, initial, final);
    return `<td class="${value ? '' : 'chart-empty'}">${value || '-'}</td>`;
  }).join('')}</tr>`).join('');
  return slideShell({
    title: simplify(chart.title).replaceAll('uen(un)', 'un'),
    icon: 'table-2',
    label,
    content: `<div class="chart-full"><div class="chart-full-card"><table class="sound-table"><thead><tr><th></th>${chart.finals.map((f) => `<th>${esc(displayFinal(f))}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div></div>`,
  });
}

function markTone(syllable, tone = 1) {
  const marks = { a: ['ā', 'á', 'ǎ', 'à'], e: ['ē', 'é', 'ě', 'è'], o: ['ō', 'ó', 'ǒ', 'ò'], i: ['ī', 'í', 'ǐ', 'ì'], u: ['ū', 'ú', 'ǔ', 'ù'], ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ'] };
  const v = syllable.includes('a') ? 'a' : syllable.includes('e') ? 'e' : syllable.includes('ou') ? 'o' : syllable.includes('iu') ? 'u' : syllable.includes('ui') ? 'i' : ['o', 'i', 'u', 'ü'].find((x) => syllable.includes(x));
  return v ? syllable.replace(v, marks[v][tone - 1]) : syllable;
}

function practiceFromChart(no, chart, partIndex = 0, partCount = 1) {
  const finals = chart.finals || [];
  const rows = finals.map((final) => chart.initials.map((initial) => cellValue(no, initial, final)).filter(Boolean).slice(0, 4).map((s, i) => markTone(s, (i % 4) + 1)));
  const title = partCount > 1 ? `Luyện đọc: ${finals.map(displayFinal).join(' ')}` : 'Luyện đọc có thanh điệu';
  return slideShell({
    title,
    icon: 'mic-2',
    label: 'Luyện đọc',
    content: renderReadingDrillBoard({ title, rows, rowLabels: finals.map(displayFinal), titleAlign: 'left' }),
  });
}

function vocabGridSlide(set) {
  const html = set.items.map((item) => `<div class="word-card"><img src="${esc(item.image_file)}" alt="${esc(item.chinese_simplified)}"><div class="pinyin">${esc(item.pinyin)}</div><div class="hanzi">${esc(item.chinese_simplified)}</div><div class="vietnamese">${esc(item.vietnamese)}</div></div>`).join('');
  return slideShell({ title: set.title_vi, icon: 'grid-3x3', label: set.title_vi, content: `<div class="content"><div class="${vocabularyGridClass(set.items.length)}">${html}</div></div>` });
}

function flashcardSlide(item, index, total, setNo) {
  return slideShell({
    title: `${item.pinyin} · ${item.vietnamese}`,
    icon: 'layers',
    label: `Thẻ từ vựng ${setNo}`,
    content: `<div class="flash-title">Flashcard</div><div class="flash-count">${String(index + 1).padStart(2, '0')} / ${total}</div><div class="flash-card"><span class="flip-trigger answer-trigger" data-reveal-step="1"></span><div class="flip-inner"><div class="flip-face face-pin"><div class="flash-hint">Nhìn pinyin và đọc trước</div><div class="pinyin flash-pinyin">${esc(item.pinyin)}</div></div><div class="flip-face face-answer"><div class="face-label">Nghĩa</div><div class="flash-answer-row"><img src="${esc(item.image_file)}" alt=""><div><div class="flash-meaning">${esc(item.vietnamese)}</div></div></div></div></div></div>`,
  });
}

function vocabPracticeSlide(set, options = {}) {
  const opts = typeof options === 'string' ? { title: options } : options;
  const pairs = set.items.map((item) => ({ pinyin: item.pinyin, hanzi: item.chinese_simplified, image: item.image_file }));
  return slideShell({
    title: opts.title || 'Nối từ vựng với hình ảnh',
    icon: 'git-branch',
    label: opts.label || 'Luyện từ vựng',
    content: renderImageMatchingBoard({ instruction: opts.instruction || 'Nối từ vựng với hình ảnh.', pairs, partLabel: opts.partLabel || '' }),
  });
}

function ruleSlide(rule) {
  const rules = rule.rules || [];
  const title = ruleTitleVi(rule);
  const colCount = rules.length > 4 ? 3 : Math.min(3, Math.max(1, rules.length));
  const compactClass = rules.length > 3 ? ' compact' : '';
  return slideShell({
    title,
    icon: 'wand-sparkles',
    label: 'Quy tắc viết pinyin',
    content: `<div class="rule-center"><div class="title-xl">${esc(title)}</div><div class="rule-grid${compactClass}">${rules.map((r) => `<div class="soft-card rule-card"><div class="from">${esc(r.underlying_form || r.from || r.original || '')}</div><div class="arrow">→</div><div class="to">${esc(r.written_form || r.to || r.changed || '')}</div></div>`).join('')}</div></div>`,
    extraCss: `.rule-grid{grid-template-columns:repeat(${colCount},1fr)}.rule-grid.compact{gap:14px}.rule-grid.compact .rule-card{height:118px}.rule-grid.compact .rule-card .from,.rule-grid.compact .rule-card .to{font-size:35px}`,
  });
}

function ruleTitleVi(rule) {
  const title = simplify(rule?.title || rule?.rule_title || 'Quy tắc viết pinyin');
  const hasJqx = /j\/q\/x|jqx/i.test(title);
  if (!hasJqx && (title.includes('ü/üe/üan/ün') || title.includes('yu/yue/yuan/yun'))) return 'ü/üe/üan/ün → yu/yue/yuan/yun';
  if (hasJqx && title.includes('üan')) return 'j/q/x + üan: viết bỏ hai chấm';
  if (hasJqx && title.includes('ün')) return 'j/q/x + ün: viết bỏ hai chấm';
  if (hasJqx && title.includes('üe')) return 'j/q/x + üe: viết bỏ hai chấm';
  if (hasJqx && title.includes('ü')) return 'Sau j/q/x, ü bỏ hai chấm khi viết';
  if (title.includes('生词拼音')) return 'Pinyin của một từ: viết liền';
  return title;
}

function ruleExamplesSlide(rule, set) {
  if (!set?.items?.length) return null;
  return slideShell({
    title: `Đọc theo quy tắc ${ruleTitleVi(rule).split(':')[0]}`,
    icon: 'list-checks',
    label: 'Quy tắc viết pinyin',
    content: `<div class="content"><div class="tone-family-title left">${esc(`Đọc theo quy tắc ${ruleTitleVi(rule).split(':')[0]}`)}</div><div class="rule-examples">${set.items.slice(0, 3).map((item) => `<div class="soft-card rule-example"><div class="pin">${esc(item.pinyin)}</div><div class="han">${esc(item.chinese_simplified)}</div><div class="vi-small">${esc(item.vietnamese)}</div></div>`).join('')}</div></div>`,
    extraCss: `.rule-examples{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:34px}.rule-example{height:220px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.rule-example .pin{font-size:34px;line-height:1;font-weight:900;color:#5AACAC}.rule-example .han{font-family:'Noto Sans SC';font-size:56px;line-height:1.05;font-weight:900;color:#1A3A5A;margin-top:16px}.rule-example .vi-small{font-size:18px;line-height:1.25;color:#5F7088;font-weight:800;margin-top:14px}`,
  });
}

function choiceSlide(rule) {
  const rows = (rule?.rules || []).slice(0, 3).map((r) => [r.written_form, r.underlying_form, `${r.written_form}e`, `${r.underlying_form}i`].filter(Boolean));
  const fallbackRows = [['A', 'B', 'C', 'D'], ['1', '2', '3', '4'], ['yi', 'wu', 'yu', 'yue']];
  return slideShell({
    title: 'Chọn cách viết đúng',
    icon: 'list-checks',
    label: 'Ôn tập',
    content: renderMultipleChoiceTable({ title: 'Chọn cách viết đúng', instruction: 'Nghe âm, chọn dạng pinyin viết đúng.', rows: rows.length ? rows : fallbackRows }),
  });
}

function fillBlankSlide(no, vocab) {
  if (no === '07') {
    const prompts = [
      ['i', 'yi'],
      ['in', 'yin'],
      ['iao', 'yao'],
      ['iu', 'you'],
      ['u', 'wu'],
      ['ua', 'wa'],
      ['ui', 'wei'],
      ['üe', 'yue'],
      ['üan', 'yuan'],
    ];
    const bank = prompts.map(([, answer]) => answer);
    return slideShell({
      title: 'Điền dạng viết đúng',
      icon: 'pen-line',
      label: 'Ôn tập',
      content: `<div class="content l7-fill"><div class="listen-head"><div class="listen-title">Điền dạng viết đúng</div></div><div class="final-bank"><div class="final-bank-title">Ngân hàng đáp án</div><div class="finals">${bank.map((item) => `<span>${esc(item)}</span>`).join('')}</div></div><div class="listen-grid l7-fill-grid">${prompts.map(([source], i) => `<div class="listen-item"><span class="listen-no">${i + 1}.</span><span class="source">${esc(source)}</span><span class="arrow">→</span><span class="blank"></span></div>`).join('')}</div></div>`,
      extraCss: `.l7-fill .final-bank{width:800px;margin-top:4px;margin-bottom:22px}.l7-fill .finals{display:flex;flex-wrap:wrap;gap:12px 28px;justify-content:center;font-size:23px}.l7-fill-grid{width:820px;column-gap:44px;row-gap:22px}.l7-fill-grid .listen-item{font-size:27px;display:flex;align-items:center}.l7-fill-grid .source{display:inline-block;min-width:54px;font-weight:950;color:#1A3A5A}.l7-fill-grid .arrow{color:#5AACAC;font-weight:950;margin:0 12px}.l7-fill-grid .blank{width:82px}`,
    });
  }
  const bank = no === '07' ? ['y', 'w', 'yu', 'yi', 'wu'] : [...new Set(vocab.flatMap((v) => v.pinyin.replace(/[āáǎà]/g, 'a').replace(/[ēéěè]/g, 'e').replace(/[īíǐì]/g, 'i').replace(/[ōóǒò]/g, 'o').replace(/[ūúǔù]/g, 'u').replace(/[ǖǘǚǜ]/g, 'ü').match(/[aeiouü]+n?g?/g) || []))].slice(0, 6);
  const prompts = vocab.slice(0, 9).map((item) => {
    const plain = item.pinyin.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return { mode: 'final', initial: plain.slice(0, 1), short: true };
  });
  return slideShell({
    title: 'Điền phần còn thiếu',
    icon: 'pen-line',
    label: 'Ôn tập',
    content: renderFillBlankBoard({ title: 'Điền phần còn thiếu', bankTitle: 'Ngân hàng âm', bankItems: bank, prompts }),
  });
}

function closingSlide(no) {
  const next = Number(no) + 1;
  return htmlDoc({
    title: 'Kết thúc',
    body: `<div class="slide closing"><div class="closing-card-ref"><img class="closing-door" src="assets/reference/closing-door-students.png" alt=""><div class="closing-zh">下课</div><div class="closing-sub">Bạn có câu hỏi gì không?</div><div class="closing-next">Bài tiếp theo: Pinyin ${next}</div></div></div>`,
  });
}

function normalizeVocab(db) {
  let index = 0;
  return db.vocabulary_sets.map((set, setIndex) => ({
    ...set,
    setNo: setIndex + 1,
    title_vi: set.title.replace(/詞彙|词汇/g, 'Từ vựng'),
    items: set.items.map((item) => {
      index += 1;
      const chinese = simplify(item.hanzi);
      const recordId = `V${String(index).padStart(3, '0')}`;
      return {
        ...item,
        record_id: recordId,
        chinese_simplified: chinese,
        vietnamese: meanings.get(chinese) || 'xem nghĩa trong lớp',
        image_file: `assets/vocab-images/vocab-${recordId.toLowerCase()}-${slug(item.pinyin)}.png`,
        setNo: setIndex + 1,
      };
    }),
  }));
}

async function writePlaceholderImages(slidesDir, vocabSets) {
  const vocabDir = path.join(slidesDir, 'assets/vocab-images');
  await fs.mkdir(vocabDir, { recursive: true });
  const promptsPath = path.join(vocabDir, 'prompts.json');
  const existingPrompts = new Map();
  try {
    const data = JSON.parse(await fs.readFile(promptsPath, 'utf8'));
    for (const prompt of data.prompts || []) existingPrompts.set(prompt.record_id, prompt);
  } catch {
    // No previous prompt metadata to preserve.
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320"><rect width="320" height="320" rx="34" fill="#F4FAFA"/><rect x="26" y="26" width="268" height="268" rx="26" fill="#FFFFFF" stroke="#B9DADB" stroke-width="3"/><path d="M86 204c27-42 54-65 86-69 24-3 45 5 63 24" fill="none" stroke="#A9C9CD" stroke-width="11" stroke-linecap="round"/><circle cx="124" cy="125" r="25" fill="#DDEDEE"/><circle cx="204" cy="116" r="18" fill="#F3D8B6"/></svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  const prompts = [];
  for (const item of vocabSets.flatMap((set) => set.items)) {
    const target = path.join(slidesDir, item.image_file);
    const hadImage = await exists(target);
    if (!hadImage) await fs.writeFile(target, png);
    const previous = existingPrompts.get(item.record_id) || {};
    prompts.push({
      ...previous,
      record_id: item.record_id,
      chinese_simplified: item.chinese_simplified,
      pinyin: item.pinyin,
      vietnamese: item.vietnamese,
      filename: path.basename(item.image_file),
      status: previous.status || (hadImage ? 'existing_asset_preserved' : 'placeholder_needs_generation'),
      prompt: `Soft textbook 1:1 illustration for ${item.vietnamese}; no text, labels, letters, numbers, or watermark.`,
      visual_description: previous.visual_description || `${hadImage ? 'Existing image' : 'Placeholder image'} for ${item.chinese_simplified} (${item.pinyin}).`,
    });
  }
  await fs.writeFile(promptsPath, `${JSON.stringify({ prompts }, null, 2)}\n`, 'utf8');
}

async function prepareLessonDirs(lessonRoot, no) {
  const slidesDir = path.join(lessonRoot, 'slides');
  for (const dir of ['slides/assets/brand', 'exports/final', 'exports/qa', 'exports/archive', 'teacher-guide', 'homework-question-bank']) {
    await fs.mkdir(path.join(lessonRoot, dir), { recursive: true });
  }
  const files = await fs.readdir(slidesDir).catch(() => []);
  for (const file of files) if (/^\d{2,3}-.+\.html$/.test(file) || file === 'index.html') await fs.rm(path.join(slidesDir, file), { force: true });
  await copyIfExists(path.join(templateRoot, 'slides/assets/slide-base.css'), path.join(slidesDir, 'assets/slide-base.css'));
  await copyIfExists(path.join(templateRoot, 'slides/assets/slide-base.js'), path.join(slidesDir, 'assets/slide-base.js'));
  await copyIfExists(path.join(templateRoot, 'slides/assets/brand/logo-watermark.png'), path.join(slidesDir, 'assets/brand/logo-watermark.png'));
  await copyDirIfExists(path.join(templateRoot, 'slides/assets/photos'), path.join(slidesDir, 'assets/photos'));
  await copyDirIfExists(path.join(templateRoot, 'slides/assets/sample-images'), path.join(slidesDir, 'assets/sample-images'));
  await copyDirIfExists(path.join(templateRoot, 'slides/assets/reference'), path.join(slidesDir, 'assets/reference'));
  const previousNo = String(Number(no) - 1).padStart(2, '0');
  await copyDirIfExists(
    path.join(root, `output/pinyin/pinyin-${previousNo}/slides/assets/vocab-images`),
    path.join(slidesDir, `assets/review-lesson-${previousNo}`),
  );
  return slidesDir;
}

function groupInitials(initials) {
  return [initials.slice(0, 8), initials.slice(8, 14), initials.slice(14)];
}

function coverGroups(no, db) {
  if (no === '05') return [['an', 'en', 'in', 'un', 'ün'], ['ang', 'eng', 'ing', 'ong'], ['Quy tắc:', 'j/q/x', '+', 'ün']];
  if (no === '06') return [['ia', 'iao', 'ian', 'iang', 'iong'], ['ua', 'uo', 'uai', 'uan', 'uang', 'üan'], 'break', ['Quy tắc:', 'j/q/x', '+', 'üan']];
  return [['Quy tắc:', 'i', '→', 'y'], ['Quy tắc:', 'u', '→', 'w'], 'break', ['Quy tắc:', 'ü', '→', 'yu'], ['Quy tắc:', 'pinyin', 'viết liền']];
}

function warmupSlide(no, db) {
  const previousNo = String(Number(no) - 1).padStart(2, '0');
  const pairs = (db.warmup_activity?.source_vocabulary || []).slice(0, 6).map((item, index) => ({
    pinyin: item.pinyin,
    hanzi: simplify(item.hanzi),
    image: `assets/review-lesson-${previousNo}/vocab-v${String(index + 1).padStart(3, '0')}-${slug(item.pinyin)}.png`,
  }));
  return slideShell({
    title: `Nối từ Bài ${Number(no) - 1} với hình ảnh`,
    icon: 'git-branch',
    label: `Ôn bài ${Number(no) - 1}`,
    content: renderImageMatchingBoard({
      instruction: `Nối từ vựng Bài ${Number(no) - 1} với hình ảnh.`,
      pairs,
    }),
  });
}

function introFinalsForChart(no, db, chart) {
  if (no === '05' && chart.item_id === 'pinyin_chart_l5_group_1') return ['an', 'en', 'in', 'un', 'ün'];
  return (chart.finals || []).map(displayFinal);
}

function chartDividerImage(no, chart, chartNo) {
  if (no === '05' && chartNo === 1) return 'divider-finals-an-en-in-uen-un.png';
  if (no === '05' && chartNo === 2) return 'divider-finals-ang-eng-ing-ong.png';
  if (no === '06' && chartNo === 1) return 'divider-finals-ia-iao-ian-iang-iong.png';
  if (no === '06' && chartNo === 2) return 'divider-finals-ua-uo-uai-uan-uang-uan.png';
  return 'divider-finals.png';
}

function chartDividerZh(no, chartNo) {
  if (no === '05' && chartNo === 1) return '前鼻韵母';
  if (no === '05' && chartNo === 2) return '后鼻韵母';
  if (no === '06' && chartNo === 1) return 'i开头复韵母';
  if (no === '06' && chartNo === 2) return 'u/ü开头复韵母';
  return '韵母';
}

function ruleDividerImage(no, rule) {
  const title = ruleTitleVi(rule);
  if (no === '05' && title.includes('ün')) return 'divider-rule-jqx-un.png';
  if (no === '06' && title.includes('üan')) return 'divider-rule-jqx-uan.png';
  if (no === '07') return 'divider-rules-i-u-yu.png';
  return 'divider-concepts.png';
}

function ruleList(db) {
  return [...(db.spelling_rules || []), ...(db.word_spacing_rules || [])];
}

function relatedSetForRule(rule, vocabSets) {
  const relatedIds = rule.applies_to_vocabulary_set_ids || rule.related_vocabulary_set_ids || [];
  if (relatedIds.length) return vocabSets.find((set) => relatedIds.includes(set.set_id));
  return vocabSets.find((set) => set.related_rule_id === rule.item_id || set.related_rule_id === rule.rule_id);
}

function addVocabularySection(slides, set, setNo, vocab, options = {}) {
  const { includePractice = true } = options;
  slides.push([`divider-vocabulary-${setNo}`, dividerSlide({ title: set.title_vi, zh: '词汇', label: upperLabel(set.title_vi), img: 'divider-vocabulary.png', icon: 'images' })]);
  const gridChunks = chunkItems(set.items, set.items.length > 8 ? 6 : 8);
  for (const [chunkIndex, items] of gridChunks.entries()) {
    const suffix = gridChunks.length > 1 ? `-${chunkIndex + 1}` : '';
    slides.push([`vocabulary-${setNo}${suffix}`, vocabGridSlide({ ...set, items, title_vi: `${set.title_vi}${gridChunks.length > 1 ? ` ${chunkIndex + 1}` : ''}` })]);
  }
  for (const item of set.items) slides.push([`flash-${item.record_id.toLowerCase()}-${slug(item.pinyin)}`, flashcardSlide(item, vocab.indexOf(item), vocab.length, setNo)]);
  if (!includePractice) return;
  const practiceChunks = chunkItems(set.items, set.items.length > 6 ? 4 : 6);
  for (const [chunkIndex, items] of practiceChunks.entries()) {
    const suffix = practiceChunks.length > 1 ? letterSuffix(chunkIndex) : '';
    slides.push([`practice-vocabulary-${setNo}${suffix}`, vocabPracticeSlide({ ...set, items }, {
      partLabel: practiceChunks.length > 1 ? `phần ${chunkIndex + 1}` : '',
    })]);
  }
}

function l7RuleSlides(db) {
  const rules = [...(db.spelling_rules || []), ...(db.word_spacing_rules || [])];
  return rules.slice(0, 6).flatMap((rule) => {
    const items = rule.rules || rule.examples || [];
    const rows = items.slice(0, 6).map((r) => {
      const from = r.underlying_form || r.from || r.original || r.base || r.source || '';
      const to = r.written_form || r.to || r.changed || r.output || '';
      return [from, to];
    }).filter((r) => r[0] || r[1]);
    return [slideShell({
      title: simplify(rule.title || rule.rule_title || 'Quy tắc viết pinyin'),
      icon: 'wand-sparkles',
      label: 'Quy tắc viết pinyin',
      content: `<div class="content"><div class="title-xl">${esc(simplify(rule.title || rule.rule_title || 'Quy tắc viết pinyin'))}</div><div class="rule-list">${rows.map(([from, to]) => `<div class="soft-card rule-line"><span>${esc(from)}</span><b>→</b><span>${esc(to)}</span></div>`).join('')}</div></div>`,
      extraCss: `.rule-list{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-top:20px}.rule-line{height:72px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;justify-items:center;font-size:28px;font-weight:900;color:#1A3A5A}.rule-line b{color:#5AACAC}`,
    })];
  });
}

function balancedPracticeChunks(items, maxSize = 5) {
  if (items.length <= maxSize) return [items];
  const chunkCount = Math.ceil(items.length / maxSize);
  return chunkItems(items, Math.ceil(items.length / chunkCount));
}

function l7LearningTargets(page) {
  const tail = String(page?.title || '').split('：').pop() || '';
  return tail.trim().split(/\s+/).filter(Boolean);
}

function l7LearningIntroSlide(page, index) {
  const targets = l7LearningTargets(page);
  return slideShell({
    title: `Dạng viết ${index}: ${targets.join(' ')}`,
    icon: 'route',
    label: 'QUY TẮC VIẾT',
    content: `<div class="sound-only"><div class="sound-only-row">${targets.map((item) => `<div class="sound-only-token">${esc(item)}</div>`).join('')}</div></div>`,
  });
}

function l7WarmupSlides(no, db) {
  const previousNo = String(Number(no) - 1).padStart(2, '0');
  const source = db.warmup_activity?.source_vocabulary || [];
  const pairs = source.map((item, index) => ({
    pinyin: item.pinyin,
    hanzi: simplify(item.hanzi),
    image: `assets/review-lesson-${previousNo}/vocab-v${String(index + 1).padStart(3, '0')}-${slug(item.pinyin)}.png`,
  }));
  return balancedPracticeChunks(pairs, 5).map((chunk, index, chunks) => slideShell({
    title: `Ôn bài ${Number(no) - 1}${chunks.length > 1 ? ` - phần ${index + 1}` : ''}`,
    icon: 'git-branch',
    label: `ÔN BÀI ${Number(no) - 1}`,
    content: renderImageMatchingBoard({
      instruction: `Nối từ vựng Bài ${Number(no) - 1} với hình ảnh.`,
      pairs: chunk,
      partLabel: chunks.length > 1 ? `phần ${index + 1}` : '',
    }),
  }));
}

function addL7PracticeSection(slides, db, vocabSets, exercise, exerciseNo) {
  const sourceIds = exercise.source_vocabulary_set_ids || [];
  const items = vocabSets.filter((set) => sourceIds.includes(set.set_id)).flatMap((set) => set.items);
  for (const [chunkIndex, chunk] of balancedPracticeChunks(items, 5).entries()) {
    const suffix = letterSuffix(chunkIndex);
    slides.push([`practice-vocabulary-${exerciseNo}${suffix}`, vocabPracticeSlide({
      title_vi: `Từ vựng ${exerciseNo}`,
      items: chunk,
    }, {
      partLabel: items.length > 5 ? `phần ${chunkIndex + 1}` : '',
    })]);
  }
}

function l7WordSpacingSlide(rule) {
  const example = rule.example || {};
  const correct = example.correct_pinyin || 'Yuènán';
  const incorrect = example.incorrect_pinyin || 'Yuè nán';
  return slideShell({
    title: ruleTitleVi(rule),
    icon: 'text-cursor-input',
    label: 'Quy tắc viết pinyin',
    content: `<div class="content"><div class="title-xl">Pinyin của một từ: viết liền</div><div class="spacing-rule-grid"><div class="soft-card spacing-card good"><div class="tag">ĐÚNG</div><div class="han">${esc(example.hanzi || '越南')}</div><div class="pin">${esc(correct)}</div></div><div class="soft-card spacing-card bad"><div class="tag">KHÔNG VIẾT</div><div class="han">${esc(example.hanzi || '越南')}</div><div class="pin">${esc(incorrect)}</div></div></div><div class="spacing-note">${esc('Một từ tiếng Trung thì pinyin viết liền theo từ đó.')}</div></div>`,
    extraCss: `.spacing-rule-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:32px}.spacing-card{height:208px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.spacing-card .tag{font-size:14px;font-weight:950;letter-spacing:2px;color:#5AACAC;margin-bottom:12px}.spacing-card.bad .tag{color:#E06060}.spacing-card .han{font-family:'Noto Sans SC';font-size:56px;font-weight:900;line-height:1;color:#1A3A5A}.spacing-card .pin{font-size:40px;font-weight:950;line-height:1;color:#5AACAC;margin-top:14px}.spacing-card.bad .pin{color:#E06060;text-decoration:line-through;text-decoration-thickness:3px}.spacing-note{margin-top:24px;text-align:center;font-size:22px;line-height:1.3;font-weight:850;color:#4A6080}`,
  });
}

function l7SummarySlide(db) {
  const rows = (db.spelling_rules || []).map((rule) => {
    const left = (rule.rules || []).map((item) => item.underlying_form).join(' / ');
    const right = (rule.rules || []).map((item) => item.written_form).join(' / ');
    return `<tr><td>${esc(left)}</td><td>${esc(right)}</td></tr>`;
  }).join('');
  return slideShell({
    title: 'Bảng tổng hợp quy tắc i/u/ü',
    icon: 'table-2',
    label: 'TÓM TẮT',
    content: `<div class="content"><div class="summary-card soft-card"><table class="summary-table"><thead><tr><th>Âm gốc</th><th>Dạng viết khi đứng một mình</th></tr></thead><tbody>${rows}</tbody></table></div></div>`,
    extraCss: `.summary-card{padding:12px 16px}.summary-table{width:100%;border-collapse:separate;border-spacing:0 8px;table-layout:fixed}.summary-table th{height:38px;background:#E8F4F4;color:#5AACAC;font-size:15px;letter-spacing:.2px;text-align:center}.summary-table th:first-child{border-radius:12px 0 0 12px}.summary-table th:last-child{border-radius:0 12px 12px 0}.summary-table td{height:43px;background:#fff;border-top:1px solid rgba(90,172,172,.16);border-bottom:1px solid rgba(90,172,172,.16);font-size:22px;line-height:1.1;font-weight:950;color:#1A3A5A;text-align:center}.summary-table td:first-child{border-left:1px solid rgba(90,172,172,.16);border-radius:12px 0 0 12px;color:#7C6BC8}.summary-table td:last-child{border-right:1px solid rgba(90,172,172,.16);border-radius:0 12px 12px 0;color:#5AACAC}`,
  });
}

function addLesson7Sequence(slides, no, db, vocabSets, vocab) {
  const ruleById = new Map((db.spelling_rules || []).map((rule) => [rule.item_id, rule]));
  const setById = new Map(vocabSets.map((set) => [set.set_id, set]));
  const exerciseByFirstSource = new Map((db.exercises || [])
    .filter((exercise) => exercise.source_vocabulary_set_ids?.length)
    .map((exercise, index) => [exercise.source_vocabulary_set_ids[0], { exercise, exerciseNo: index + 1 }]));

  for (const page of db.pages || []) {
    if (['lesson_cover', 'learning_objective', 'warmup_activity', 'reserved_page'].includes(page.record_type)) continue;

    if (page.record_type === 'pinyin_learning_cover') {
      const index = slides.filter(([name]) => name.startsWith('rule-intro-')).length + 1;
      slides.push([`rule-intro-${index}`, l7LearningIntroSlide(page, index)]);
      continue;
    }

    if (page.record_type === 'spelling_rule') {
      const rule = ruleById.get(page.spelling_rule_id || page.item_id);
      if (rule) slides.push([`rule-${slug(rule.item_id)}`, ruleSlide(rule)]);
      continue;
    }

    if (page.record_type === 'vocabulary_set') {
      const set = setById.get(page.vocabulary_set_id || page.item_id);
      if (set) addVocabularySection(slides, set, set.setNo, vocab, { includePractice: false });
      continue;
    }

    if (page.record_type === 'vocab_exercise') {
      const exercise = (db.exercises || []).find((item) => item.page === page.page_range || item.page === page.page);
      if (exercise) {
        const firstSource = exercise.source_vocabulary_set_ids?.[0];
        const mapped = firstSource ? exerciseByFirstSource.get(firstSource) : null;
        addL7PracticeSection(slides, db, vocabSets, exercise, mapped?.exerciseNo || 1);
      }
      continue;
    }

    if (page.record_type === 'word_spacing_rule') {
      const rule = (db.word_spacing_rules || [])[0];
      if (rule) slides.push([`rule-${slug(rule.item_id)}`, l7WordSpacingSlide(rule)]);
      continue;
    }

    if (page.record_type === 'review_exercise') {
      slides.push(['divider-review-final', dividerSlide({ title: 'Ôn tập cuối bài', zh: '练习', label: 'ÔN TẬP', img: 'divider-review.png', icon: 'check-circle-2' })]);
      slides.push(['review-listening-choice', choiceSlide((db.spelling_rules || [])[0] || (db.word_spacing_rules || [])[0])]);
      slides.push(['review-fill-blank', fillBlankSlide(no, vocab)]);
      slides.push(['review-vocabulary-match', vocabPracticeSlide({ title_vi: 'Ôn từ vựng', items: vocab.slice(-Math.min(6, vocab.length)) })]);
      continue;
    }

    if (page.record_type === 'spelling_rule_summary') {
      slides.push(['rule-summary', l7SummarySlide(db)]);
    }
  }
}

async function writeGuides(lessonRoot, no, db, vocabCount, slideCount) {
  const dir = path.join(lessonRoot, 'teacher-guide');
  await fs.mkdir(dir, { recursive: true });
  const focus = (db.learning_focus || []).map((item) => `- ${simplify(item)}`).join('\n');
  await fs.writeFile(path.join(dir, 'teacher-prep.md'), `# Pinyin Bài ${Number(no)} - Teacher Prep\n\n## Trọng tâm\n${focus}\n\n## Cách dạy nhanh\n- Bắt đầu bằng ôn bài trước qua hoạt động nối hình.\n- Dạy âm mới theo cụm, đọc mẫu chậm rồi tăng tốc.\n- Với bảng ghép âm, chỉ đọc các ô có thật; ô trống là âm không dùng.\n- Dùng flashcard để học sinh đọc pinyin trước khi xem nghĩa.\n- Kết thúc bằng nghe chọn pinyin và điền âm còn thiếu.\n\n## Ghi chú\n- Tổng số từ vựng: ${vocabCount}.\n- Deck hiện dùng placeholder image; thay ảnh thật bằng asset workflow khi cần.\n`, 'utf8');
  await fs.writeFile(path.join(dir, 'huashu-brief.md'), `# Pinyin Bài ${Number(no)} - Huashu Brief\n\n## Output\n- HTML teacher deck in \`slides/\`.\n- Classroom presenter in \`slides/index.html\`.\n- Root launcher in \`index.html\`.\n\n## Visual system\nReuse Pinyin Lesson 1 soft classroom style, multicolor pale background, square pinyin vocabulary images, section dividers, flashcards, and closing composition.\n\n## Slide count\n${slideCount} slides.\n\n## Required checks\n- Asset manifest and QA.\n- Presenter manifest matches numbered slide files.\n- No classroom \`Mục lục\`, \`Quy ước\`, or bottom-right \`Trang ...\` labels.\n`, 'utf8');
}

async function generate(no) {
  const lessonRoot = path.join(root, `output/pinyin/pinyin-${no}`);
  const dbPath = path.join(lessonRoot, `database/vp_pinyin_${no}_database.json`);
  const db = JSON.parse(await fs.readFile(dbPath, 'utf8'));
  const slidesDir = await prepareLessonDirs(lessonRoot, no);
  const vocabSets = normalizeVocab(db);
  const vocab = vocabSets.flatMap((set) => set.items);
  await writePlaceholderImages(slidesDir, vocabSets);

  const slides = [];
  slides.push(['cover', coverSlide(no, coverGroups(no, db))]);
  slides.push(['objectives', objectivesSlide(no, db, vocab.length)]);
  slides.push(['divider-review', dividerSlide({ title: `Ôn bài ${Number(no) - 1}`, zh: '暖身活动', label: `ÔN BÀI ${Number(no) - 1}`, img: 'divider-review.png', icon: 'refresh-cw', superTitle: 'Khởi động' })]);
  if (no === '07') {
    for (const [index, html] of l7WarmupSlides(no, db).entries()) {
      slides.push([`warmup-review-${letterSuffix(index)}`, html]);
    }
  } else {
    slides.push(['warmup-review', warmupSlide(no, db)]);
  }

  if (no === '07') {
    addLesson7Sequence(slides, no, db, vocabSets, vocab);
  } else {
    const events = [
      ...(db.pinyin_charts || []).map((chart, index) => ({ type: 'chart', chart, index, page: pageNo(chart.page) })),
      ...ruleList(db).map((rule, index) => ({ type: 'rule', rule, index, page: pageNo(rule.page) })),
      ...vocabSets.map((set, index) => ({ type: 'vocabulary', set, index, page: pageNo(set.page) })),
    ].sort((a, b) => a.page - b.page || ({ chart: 1, rule: 2, vocabulary: 3 }[a.type] - { chart: 1, rule: 2, vocabulary: 3 }[b.type]));

    for (const event of events) {
      if (event.type === 'chart') {
        const chartNo = event.index + 1;
        slides.push([`divider-finals-${chartNo}`, dividerSlide({ title: `Vận mẫu ${chartNo}`, zh: chartDividerZh(no, chartNo), label: `VẬN MẪU ${chartNo}`, img: chartDividerImage(no, event.chart, chartNo), icon: 'volume-2' })]);
        slides.push([`finals-${chartNo}`, soundsSlide(`Vận mẫu ${chartNo}`, introFinalsForChart(no, db, event.chart))]);
        for (const [groupIndex, initials] of groupInitials(event.chart.initials || []).entries()) {
          slides.push([`chart-${chartNo}-${groupIndex + 1}`, chartSlide(no, event.chart, initials)]);
        }
        const practiceFinalGroups = event.chart.finals.length > 4
          ? chunkItems(event.chart.finals, Math.ceil(event.chart.finals.length / 2))
          : [event.chart.finals];
        for (const [practiceIndex, finals] of practiceFinalGroups.entries()) {
          const suffix = practiceFinalGroups.length > 1 ? letterSuffix(practiceIndex) : '';
          slides.push([`practice-finals-${chartNo}${suffix}`, practiceFromChart(no, { ...event.chart, finals }, practiceIndex, practiceFinalGroups.length)]);
        }
      } else if (event.type === 'rule') {
        slides.push([`divider-rule${event.index ? `-${event.index + 1}` : ''}`, dividerSlide({ title: 'Quy tắc viết pinyin', zh: '拼写规则', label: 'QUY TẮC VIẾT', img: ruleDividerImage(no, event.rule), icon: 'wand-sparkles' })]);
        slides.push([`rule-${slug(event.rule.item_id || event.rule.rule_id || event.rule.title)}`, ruleSlide(event.rule)]);
        const examples = ruleExamplesSlide(event.rule, relatedSetForRule(event.rule, vocabSets));
        if (examples) slides.push([`rule-${slug(event.rule.item_id || event.rule.rule_id || event.rule.title)}-examples`, examples]);
      } else if (event.type === 'vocabulary') {
        addVocabularySection(slides, event.set, event.index + 1, vocab);
      }
    }

    slides.push(['divider-review-final', dividerSlide({ title: 'Ôn tập cuối bài', zh: '练习', label: 'ÔN TẬP', img: 'divider-review.png', icon: 'check-circle-2' })]);
    slides.push(['review-listening-choice', choiceSlide((db.spelling_rules || [])[0] || (db.word_spacing_rules || [])[0])]);
    slides.push(['review-fill-blank', fillBlankSlide(no, vocab)]);
    slides.push(['review-vocabulary-match', vocabPracticeSlide({ title_vi: 'Ôn từ vựng', items: vocab.slice(-Math.min(6, vocab.length)) })]);
  }
  slides.push(['closing', closingSlide(no)]);

  for (const [i, [name, html]] of slides.entries()) {
    await fs.writeFile(path.join(slidesDir, `${String(i + 1).padStart(2, '0')}-${name}.html`), html, 'utf8');
  }
  await writeGuides(lessonRoot, no, db, vocab.length, slides.length);
  spawnSync(process.execPath, ['scripts/sync-lesson-presenter.mjs', '--lesson', `output/pinyin/pinyin-${no}`], { cwd: root, stdio: 'inherit' });
  spawnSync(process.execPath, ['scripts/update-lesson-shell.mjs', '--lesson', `output/pinyin/pinyin-${no}`], { cwd: root, stdio: 'inherit' });
  console.log(`Generated pinyin-${no}: ${slides.length} slides`);
}

for (const no of lessonNos) await generate(no);
