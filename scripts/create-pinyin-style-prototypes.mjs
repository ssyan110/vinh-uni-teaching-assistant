#!/usr/bin/env node
/**
 * Creates visual-only prototypes for Pinyin 07.
 * The source HTML is copied verbatim and receives a trailing theme stylesheet,
 * keeping all original copy, hierarchy, DOM positions, and interactions intact.
 */
import fs from 'fs/promises';
import path from 'path';

const root = process.cwd();
const lesson = path.join(root, 'output/pinyin/pinyin-07');
const sourceSlides = path.join(lesson, 'slides');
const destination = path.join(lesson, 'design-prototypes');
const scenes = [
  ['01-cover.html', '封面'],
  ['02-objectives.html', '學習目標'],
  ['08-rule-l7-i-to-yi.html', '拼音規則'],
  ['12-vocabulary-1.html', '詞彙卡'],
  ['85-review-listening-choice.html', '聽力選擇'],
];

const shared = (palette) => `
/* Visual skin only. Layout geometry and source text remain unchanged. */
body{background:${palette.bg};color:${palette.ink}}
.slide{background:${palette.slide};color:${palette.ink}}
.slide:before{background:${palette.deco};opacity:1}
.slide:after{opacity:${palette.watermark}}
.menu-bar{background:${palette.menu};border-bottom-color:${palette.border};box-shadow:${palette.menuShadow}}
.menu-icon,.lesson-goal-num,.tone-choice-num{background:${palette.accent};color:${palette.onAccent};box-shadow:${palette.accentShadow}}
.section-label,.muted,.subtitle,.vietnamese,.tone-choice-desc,.final-bank-title{color:${palette.muted}}
.title,.title-xl,.lesson-goal-title,.flash-title,.rule-title,.rule-to,.rule-card .to,.tone-choice-title,.listen-title,.divider-super,.divider-zh,.tone-family-title,.tone-match-title,.image-match-title,.hanzi,.a-han,.flash-pinyin,.flash-meaning{color:${palette.ink}}
.pinyin,.a-pin,.flash-count,.face-label,.image-match-part,.word-card .pinyin,.tone-family-base,.divider-kicker,.rule-arrow,.rule-card .arrow{color:${palette.accent}}
.goal-hot,.answer-red{color:${palette.hot}}
.soft-card,.card,.word-card,.rule-flash-card,.flip-face,.chart-full-card,.tone-family-token,.tone-match-card,.image-word-tile,.image-tile,.final-bank{background:${palette.card};border-color:${palette.border};box-shadow:${palette.shadow}}
.lesson,.pill,.flash-count,.face-label,.tone-family-base{background:${palette.soft};color:${palette.accent}}
.topic-img,.lesson-goal-right,.divider-photo,.word-card img,.flash-answer-row img{border-color:${palette.accent};box-shadow:${palette.imageShadow}}
.cover{background:${palette.cover}}
.cover:before{background:${palette.coverOrb}}
.cover-sound-chip{background:${palette.chip};border-color:${palette.border};box-shadow:${palette.shadow};color:${palette.ink}}
.rule-flash-card:before,.flip-face:before{background:${palette.rail}}
.rule-from,.rule-card .from{color:${palette.secondary}}
.rule-arrow,.rule-card .arrow{color:${palette.accent}}
.tone-choice-table{background:${palette.table};box-shadow:${palette.shadow}}
.tone-choice-table tr:nth-child(odd) td{background:${palette.row1}}
.tone-choice-table tr:nth-child(even) td{background:${palette.row2}}
.tone-choice-table td,.listen-item,.listen-no,.initial-cue{color:${palette.ink}}
.blank{border-bottom-color:${palette.ink}}
`;

const themes = [
  {
    folder: '01-cobalt-grid', label: '01 · Cobalt Grid',
    note: '學術藍 × 檸檬黃。更清楚的投影對比與理性網格感。',
    css: shared({ bg:'#EEF3FB', slide:'linear-gradient(135deg,#F8FAFF 0%,#EDF3FF 100%)', deco:'linear-gradient(90deg,transparent 0 8%,rgba(33,69,140,.055) 8.1% 8.35%,transparent 8.45% 16%,rgba(33,69,140,.055) 16.1% 16.35%,transparent 16.45%)', watermark:'.035', menu:'rgba(248,250,255,.94)', border:'rgba(35,67,133,.24)', menuShadow:'0 8px 20px rgba(22,51,110,.08)', accent:'#2463C9', onAccent:'#FFF', accentShadow:'0 5px 12px rgba(36,99,201,.25)', muted:'#52647E', ink:'#142B54', card:'#FFFFFF', soft:'#E8F0FF', shadow:'0 10px 26px rgba(25,60,126,.11)', imageShadow:'0 12px 30px rgba(25,60,126,.18)', cover:'linear-gradient(145deg,#EAF2FF 0%,#FFFFFF 56%,#FFF9D9 100%)', coverOrb:'rgba(255,201,45,.30)', chip:'rgba(255,255,255,.86)', rail:'linear-gradient(180deg,#C9DCFF,#E8F0FF)', secondary:'#7345C8', hot:'#E84755', table:'#DCE9FF', row1:'#D7E5FF', row2:'#EDF4FF' }) },
  {
    folder: '02-coral-studio', label: '02 · Coral Studio',
    note: '暖紙色 × 珊瑚紅 × 靛藍。像高質感文具與教材出版品。',
    css: shared({ bg:'#FFF7F0', slide:'linear-gradient(135deg,#FFF8F2 0%,#FFFDF9 58%,#F3F0FF 100%)', deco:'radial-gradient(circle at 13% 88%,rgba(242,113,94,.13) 0 78px,transparent 80px),radial-gradient(circle at 90% 14%,rgba(76,88,173,.11) 0 108px,transparent 110px)', watermark:'.027', menu:'rgba(255,251,246,.94)', border:'rgba(177,91,82,.22)', menuShadow:'0 8px 20px rgba(128,63,53,.07)', accent:'#D95E50', onAccent:'#FFF', accentShadow:'0 5px 12px rgba(217,94,80,.24)', muted:'#766565', ink:'#382F4D', card:'#FFFDFC', soft:'#FFE6DF', shadow:'0 10px 28px rgba(141,75,69,.10)', imageShadow:'0 12px 30px rgba(77,66,134,.16)', cover:'linear-gradient(145deg,#FFF0E8 0%,#FFFDF9 52%,#EBECFF 100%)', coverOrb:'rgba(235,111,91,.24)', chip:'rgba(255,253,250,.92)', rail:'linear-gradient(180deg,#FFD4CA,#FFECE7)', secondary:'#6655B8', hot:'#B63755', table:'#F4E7E2', row1:'#F5DDD5', row2:'#FFF0EA' }) },
  {
    folder: '03-jade-ink', label: '03 · Jade Ink',
    note: '玉石綠 × 墨黑 × 米白。安靜但有東方課堂辨識度。',
    css: shared({ bg:'#F6F5ED', slide:'linear-gradient(140deg,#FAFAF4 0%,#F1F5EF 100%)', deco:'radial-gradient(circle at 10% 88%,rgba(30,133,110,.11) 0 85px,transparent 87px),radial-gradient(circle at 89% 15%,rgba(188,154,79,.12) 0 110px,transparent 112px)', watermark:'.04', menu:'rgba(250,250,244,.93)', border:'rgba(21,91,76,.22)', menuShadow:'0 7px 17px rgba(18,65,55,.07)', accent:'#117E69', onAccent:'#FFF', accentShadow:'0 5px 12px rgba(17,126,105,.24)', muted:'#62716B', ink:'#1D342D', card:'#FFFEF9', soft:'#DDF1E9', shadow:'0 8px 22px rgba(22,70,58,.10)', imageShadow:'0 12px 30px rgba(22,70,58,.17)', cover:'linear-gradient(145deg,#E5F4EC 0%,#FFFEF8 58%,#F7ECCF 100%)', coverOrb:'rgba(188,154,79,.24)', chip:'rgba(255,254,249,.86)', rail:'linear-gradient(180deg,#BFE3D5,#E5F4EC)', secondary:'#A56B2B', hot:'#C54D41', table:'#E2EEE8', row1:'#D7E9E1', row2:'#EFF7F2' }) },
  {
    folder: '04-midnight-lab', label: '04 · Midnight Lab',
    note: '深靛藍 × 電光青。夜間教室模式，對比最強。',
    css: shared({ bg:'#0C1428', slide:'linear-gradient(135deg,#101B34 0%,#10172B 55%,#172241 100%)', deco:'radial-gradient(circle at 11% 88%,rgba(27,217,194,.15) 0 88px,transparent 90px),radial-gradient(circle at 90% 14%,rgba(116,104,255,.18) 0 125px,transparent 127px)', watermark:'.06', menu:'rgba(14,25,48,.92)', border:'rgba(151,181,255,.23)', menuShadow:'0 9px 24px rgba(0,0,0,.25)', accent:'#42D8C5', onAccent:'#06211F', accentShadow:'0 5px 14px rgba(66,216,197,.22)', muted:'#B6C4DA', ink:'#F4F7FF', card:'#192744', soft:'#163A45', shadow:'0 12px 28px rgba(0,0,0,.25)', imageShadow:'0 12px 30px rgba(3,12,30,.40)', cover:'linear-gradient(145deg,#152849 0%,#0E172D 58%,#2A1D4B 100%)', coverOrb:'rgba(66,216,197,.20)', chip:'rgba(23,38,68,.90)', rail:'linear-gradient(180deg,#1A5E69,#173B4A)', secondary:'#B89BFF', hot:'#FF8F8B', table:'#1A2A4A', row1:'#20365B', row2:'#172A49' }) },
  {
    folder: '05-orchid-pop', label: '05 · Orchid Pop',
    note: '蘭紫 × 橘橙 × 天空藍。最有節奏感，適合初學者互動課。',
    css: shared({ bg:'#F8F4FF', slide:'linear-gradient(135deg,#FCF9FF 0%,#F4F0FF 52%,#FFF6EA 100%)', deco:'radial-gradient(circle at 12% 86%,rgba(255,167,61,.16) 0 82px,transparent 84px),radial-gradient(circle at 90% 14%,rgba(142,91,211,.15) 0 120px,transparent 122px)', watermark:'.026', menu:'rgba(253,250,255,.94)', border:'rgba(125,80,189,.23)', menuShadow:'0 8px 20px rgba(83,45,140,.08)', accent:'#7756C8', onAccent:'#FFF', accentShadow:'0 5px 12px rgba(119,86,200,.24)', muted:'#6D6680', ink:'#30264A', card:'#FFFDFE', soft:'#EEE7FF', shadow:'0 10px 26px rgba(95,65,152,.11)', imageShadow:'0 12px 30px rgba(90,60,150,.16)', cover:'linear-gradient(145deg,#F1EAFF 0%,#FFFDFE 56%,#FFF0D7 100%)', coverOrb:'rgba(255,166,55,.27)', chip:'rgba(255,253,255,.90)', rail:'linear-gradient(180deg,#DCD0FF,#F0EAFF)', secondary:'#E07536', hot:'#D5456C', table:'#EEE9FF', row1:'#E5DCFF', row2:'#F6F2FF' }) },
];

const overview = (theme) => `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${theme.label}</title><style>body{margin:0;background:#101728;color:#fff;font:16px system-ui,-apple-system,sans-serif}.top{position:sticky;top:0;background:rgba(16,23,40,.94);backdrop-filter:blur(12px);padding:18px 32px;z-index:2;border-bottom:1px solid rgba(255,255,255,.12)}h1{margin:0;font-size:20px}.top p{margin:6px 0 0;color:#c8d1e8}.grid{padding:30px;display:grid;gap:26px;grid-template-columns:repeat(auto-fit,minmax(420px,1fr))}.tile{background:#18223a;border-radius:14px;overflow:hidden;box-shadow:0 12px 30px rgba(0,0,0,.25)}.tile h2{font-size:15px;margin:0;padding:12px 15px}.tile iframe{display:block;border:0;width:960px;height:540px;transform:scale(.47);transform-origin:top left;margin-bottom:-286px}.tile a{color:#fff;text-decoration:none}</style></head><body><div class="top"><h1>${theme.label}</h1><p>${theme.note}　保留 Pinyin 07 的原始文字、內容、互動與標題位置。</p></div><main class="grid">${scenes.map(([file,label]) => `<article class="tile"><a href="slides/${file}"><h2>${label}</h2><iframe title="${label}" src="slides/${file}"></iframe></a></article>`).join('')}</main></body></html>`;

await fs.rm(destination, { recursive: true, force: true });
for (const theme of themes) {
  const folder = path.join(destination, theme.folder);
  const slides = path.join(folder, 'slides');
  await fs.mkdir(slides, { recursive: true });
  await fs.writeFile(path.join(folder, 'prototype.css'), theme.css);
  for (const [file] of scenes) {
    let html = await fs.readFile(path.join(sourceSlides, file), 'utf8');
    html = html.replaceAll('assets/', '../../../slides/assets/');
    html = html.replace('</head>', '<link rel="stylesheet" href="../prototype.css"></head>');
    await fs.writeFile(path.join(slides, file), html);
  }
  await fs.writeFile(path.join(folder, 'index.html'), overview(theme));
}
console.log(`Created ${themes.length} visual systems × ${scenes.length} source-faithful slides in ${path.relative(root, destination)}`);
