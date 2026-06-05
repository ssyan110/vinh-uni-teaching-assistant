#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const root = process.cwd();
const lessonRoot = path.join(root, 'output/book-1/lesson-10');
const lesson01Root = path.join(root, 'output/book-1/lesson-01');
const dbPath = path.join(lessonRoot, 'database/vp_lesson_10_database.json');
const slidesDir = path.join(lessonRoot, 'slides');
const assetsDir = path.join(slidesDir, 'assets');
const teacherGuideDir = path.join(lessonRoot, 'teacher-guide');
const qaDir = path.join(lessonRoot, 'exports/qa');
const finalDir = path.join(lessonRoot, 'exports/final');
const archiveDir = path.join(lessonRoot, 'exports/archive');

const esc = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const slug = (value = '') => value
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .toLowerCase() || 'item';

const db = JSON.parse(await fs.readFile(dbPath, 'utf8'));
const items = db.content_items;
const byId = new Map(items.map((item) => [item.record_id, item]));
const visible = items.filter((item) => item.classroom_visibility === 'student_visible');
const vocab = visible
  .filter((item) => item.record_type === 'vocabulary')
  .sort((a, b) => Number(a.teaching_order) - Number(b.teaching_order));
const grammar = visible.filter((item) => item.record_type === 'grammar');
const text = byId.get('T001');
const culture = ['N001', 'C001', 'C002'].map((id) => byId.get(id)).filter(Boolean);

await fs.mkdir(slidesDir, { recursive: true });
await fs.mkdir(path.join(assetsDir, 'brand'), { recursive: true });
await fs.mkdir(path.join(assetsDir, 'vocab-images'), { recursive: true });
await fs.mkdir(path.join(assetsDir, 'photos'), { recursive: true });
await fs.mkdir(path.join(assetsDir, 'culture-images'), { recursive: true });
await fs.mkdir(path.join(assetsDir, 'sample-images'), { recursive: true });
await fs.mkdir(path.join(assetsDir, 'js'), { recursive: true });
await fs.mkdir(path.join(assetsDir, 'reference'), { recursive: true });
await fs.mkdir(path.join(assetsDir, 'hanzi-data'), { recursive: true });
await fs.mkdir(teacherGuideDir, { recursive: true });
await fs.mkdir(qaDir, { recursive: true });
await fs.mkdir(finalDir, { recursive: true });
await fs.mkdir(archiveDir, { recursive: true });

for (const file of await fs.readdir(slidesDir)) {
  if (/^\d{2}-.*\.html$/.test(file)) {
    await fs.rm(path.join(slidesDir, file));
  }
}

async function copyIfExists(from, to) {
  try {
    await fs.mkdir(path.dirname(to), { recursive: true });
    await fs.copyFile(from, to);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

async function fileExists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

await copyIfExists(path.join(lesson01Root, 'slides/assets/slide-base.css'), path.join(assetsDir, 'slide-base.css'));
await copyIfExists(path.join(lesson01Root, 'slides/assets/slide-base.js'), path.join(assetsDir, 'slide-base.js'));
await copyIfExists(path.join(root, 'design/shared-slide-assets/brand/logo-watermark.png'), path.join(assetsDir, 'brand/logo-watermark.png'));
await copyIfExists(path.join(lesson01Root, 'slides/avatar-a.png'), path.join(slidesDir, 'avatar-a.png'));
await copyIfExists(path.join(lesson01Root, 'slides/avatar-b.png'), path.join(slidesDir, 'avatar-b.png'));
await copyIfExists(path.join(lesson01Root, 'slides/assets/photos/vocab-divider-base-selected.png'), path.join(assetsDir, 'photos/vocab-divider-base-selected.png'));
await copyIfExists(path.join(lesson01Root, 'slides/assets/photos/vocab-divider.png'), path.join(assetsDir, 'photos/vocab-divider.png'));
await copyIfExists(path.join(lesson01Root, 'slides/assets/photos/practice.jpg'), path.join(assetsDir, 'photos/practice.jpg'));
await copyIfExists(path.join(lesson01Root, 'slides/assets/photos/text.jpg'), path.join(assetsDir, 'photos/text.jpg'));
await copyIfExists(path.join(lesson01Root, 'slides/assets/photos/homework.jpg'), path.join(assetsDir, 'photos/homework.jpg'));
await copyIfExists(path.join(lesson01Root, 'slides/assets/photos/supplement.jpg'), path.join(assetsDir, 'photos/supplement.jpg'));
await copyIfExists(path.join(lesson01Root, 'slides/assets/sample-images/objectives.png'), path.join(assetsDir, 'sample-images/objectives.png'));
await copyIfExists(path.join(lesson01Root, 'slides/assets/js/hanzi-writer.min.js'), path.join(assetsDir, 'js/hanzi-writer.min.js'));
await copyIfExists(path.join(lesson01Root, 'slides/assets/reference/ending-page-background.png'), path.join(assetsDir, 'reference/ending-page-background.png'));
if (!await fileExists(path.join(assetsDir, 'photos/cover-topic.png'))) {
  await copyIfExists('/Users/ssyan110/.codex/generated_images/019e8851-0500-7f91-819e-2ee486744205/ig_030f47f65ccda253016a1fd183cbb4819181d76d547fe4a830.png', path.join(assetsDir, 'photos/cover-topic.png'));
}

const generatedLessonImages = '/Users/ssyan110/.codex/generated_images/019e8851-0500-7f91-819e-2ee486744205/ig_02b088304420e6c3016a1fd90f971c81919f1a2ae264289b20.png';
async function cropGeneratedDividerImages() {
  try {
    await fs.access(generatedLessonImages);
    const base = sharp(generatedLessonImages);
    if (!await fileExists(path.join(assetsDir, 'photos/dialogue-topic.png'))) {
      await base
        .clone()
        .extract({ left: 260, top: 36, width: 910, height: 430 })
        .resize(576, 612, { fit: 'cover', position: 'center' })
        .png()
        .toFile(path.join(assetsDir, 'photos/dialogue-topic.png'));
    }
    if (!await fileExists(path.join(assetsDir, 'photos/writing-hand.png'))) {
      await base
        .clone()
        .extract({ left: 620, top: 486, width: 720, height: 420 })
        .resize(576, 612, { fit: 'cover', position: 'center' })
        .png()
        .toFile(path.join(assetsDir, 'photos/writing-hand.png'));
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
await cropGeneratedDividerImages();

function vocabImageSvg(item, index) {
  const palette = [
    ['#E8F4F4', '#5AACAC', '#C8B8E8'],
    ['#F3F0FA', '#7C6BC8', '#5AACAC'],
    ['#F8F4EA', '#D9A84E', '#5AACAC'],
    ['#F2F7F0', '#7CA982', '#C8B8E8'],
  ][index % 4];
  const [bg, main, accent] = palette;
  const word = item.chinese_simplified.replace(/[（）〇]/g, '');
  const common = `
    <rect width="576" height="324" fill="#FFFFFF"/>
    <rect x="18" y="18" width="540" height="288" rx="28" fill="${bg}"/>
    <g stroke="#6E8EA0" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".72">`;
  const close = '</g>';
  const fill = (shape) => shape.replaceAll('__MAIN__', main).replaceAll('__ACCENT__', accent);
  let body = '';

  if (word.includes('办公') || word.includes('室')) {
    body = fill(`<rect x="172" y="94" width="232" height="142" rx="14" fill="__MAIN__" opacity=".18"/><path d="M188 236h188M214 236v-84h146v84M238 152v-36h98v36M218 174h142M218 202h142"/><circle cx="412" cy="104" r="26" fill="__ACCENT__" opacity=".35"/>`);
  } else if (word.includes('职员')) {
    body = fill(`<circle cx="288" cy="114" r="42" fill="__ACCENT__" opacity=".35"/><path d="M210 250c18-58 54-86 88-86s70 28 88 86"/><path d="M246 158h96M250 202h86"/><rect x="386" y="150" width="62" height="88" rx="10" fill="__MAIN__" opacity=".2"/>`);
  } else if (word.includes('找')) {
    body = fill(`<circle cx="250" cy="132" r="58" fill="__MAIN__" opacity=".17"/><circle cx="250" cy="132" r="58"/><path d="M292 176l70 70"/><path d="M190 250c34-50 78-54 116-18"/><circle cx="418" cy="100" r="20" fill="__ACCENT__" opacity=".38"/>`);
  } else if (word === '在' || word.includes('住') || word.includes('家')) {
    body = fill(`<path d="M160 166l128-92 128 92"/><path d="M188 160v106h216V160"/><path d="M260 266v-78h56v78"/><circle cx="426" cy="98" r="26" fill="__ACCENT__" opacity=".34"/>`);
  } else if (word.includes('楼')) {
    body = fill(`<rect x="196" y="74" width="190" height="214" rx="16" fill="__MAIN__" opacity=".14"/><path d="M218 288V96h146v192M244 126h34M316 126h34M244 168h34M316 168h34M244 210h34M316 210h34"/><path d="M276 288v-44h52v44"/>`);
  } else if (word.includes('门')) {
    body = fill(`<path d="M214 276V84h156v192"/><path d="M248 276V120h88v156"/><circle cx="318" cy="196" r="6" fill="__ACCENT__" opacity=".6"/><path d="M178 276h248"/>`);
  } else if (word.includes('房间')) {
    body = fill(`<rect x="154" y="94" width="268" height="178" rx="18" fill="__MAIN__" opacity=".13"/><path d="M188 244h210M202 130h146M202 172h72M304 172h58"/><path d="M204 244v-58h96v58"/><circle cx="410" cy="118" r="20" fill="__ACCENT__" opacity=".35"/>`);
  } else if (word === '号' || word.includes('号码') || word.includes('零')) {
    body = fill(`<rect x="172" y="104" width="232" height="140" rx="24" fill="__MAIN__" opacity=".15"/><path d="M214 146h160M214 188h160M246 124v96M330 124v96"/><circle cx="432" cy="110" r="24" fill="__ACCENT__" opacity=".36"/>`);
  } else if (word.includes('知道')) {
    body = fill(`<circle cx="288" cy="120" r="48" fill="__ACCENT__" opacity=".32"/><path d="M234 174c20 30 70 30 108 0"/><path d="M244 116h.1M336 116h.1"/><path d="M202 250h176M230 222h120"/><circle cx="416" cy="88" r="20" fill="__MAIN__" opacity=".22"/>`);
  } else if (word.includes('电话') || word === '电' || word === '话') {
    body = fill(`<path d="M212 108c44-32 132-32 176 0"/><rect x="196" y="132" width="192" height="118" rx="22" fill="__MAIN__" opacity=".16"/><path d="M236 162h112M236 194h112M250 226h84"/><path d="M410 168c26 12 34 36 18 62"/><circle cx="436" cy="118" r="22" fill="__ACCENT__" opacity=".34"/>`);
  } else if (word.includes('手机') || word === '手') {
    body = fill(`<rect x="236" y="70" width="132" height="218" rx="24" fill="__MAIN__" opacity=".15"/><path d="M258 100h88M258 248h88"/><circle cx="302" cy="268" r="8" fill="__ACCENT__" opacity=".5"/><path d="M160 226c36 6 68 6 94-8"/><path d="M174 190c24 30 48 44 82 42"/>`);
  } else if (word === '呢') {
    body = fill(`<path d="M190 172c28-44 88-62 142-36 42 20 60 58 50 94"/><path d="M246 222c36 18 82 18 116 0"/><path d="M190 172c-26 0-46 18-46 42 0 22 18 40 44 42"/><circle cx="418" cy="106" r="22" fill="__ACCENT__" opacity=".35"/>`);
  } else {
    body = fill(`<circle cx="288" cy="144" r="70" fill="__MAIN__" opacity=".15"/><path d="M218 244c34-42 82-58 144-32"/><path d="M236 144h128M288 86v128"/><circle cx="410" cy="100" r="22" fill="__ACCENT__" opacity=".35"/>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="576" height="324" viewBox="0 0 576 324">${common}${body}${close}</svg>`;
}

for (const [index, item] of vocab.entries()) {
  const file = `vocab-${slug(item.record_id)}-${slug(item.pinyin)}.png`;
  item.image_file = file;
  const outFile = path.join(assetsDir, 'vocab-images', file);
  if (!await fileExists(outFile)) {
    await sharp(Buffer.from(vocabImageSvg(item, index))).png().toFile(outFile);
  }
}

const vocabPrompts = vocab.map((item) => ({
  record_id: item.record_id,
  chinese_simplified: item.chinese_simplified,
  pinyin: item.pinyin,
  vietnamese: item.vietnamese,
  output_file: item.image_file,
  prompt: `Soft educational textbook illustration for a Chinese classroom slide, 16:9 landscape, thin grey-blue outlines, muted pastel fills, pale clean background, no text, no letters, no numbers, no Chinese characters, no labels, no watermark. Show: ${item.english || item.vietnamese}.`,
}));
await fs.writeFile(path.join(assetsDir, 'vocab-images/prompts.json'), JSON.stringify(vocabPrompts, null, 2), 'utf8');

async function writeSvgPng(file, svg) {
  const outFile = path.join(assetsDir, 'culture-images', file);
  if (!await fileExists(outFile)) {
    await sharp(Buffer.from(svg)).png().toFile(outFile);
  }
}

await writeSvgPng('number-520.png', `<svg xmlns="http://www.w3.org/2000/svg" width="576" height="324" viewBox="0 0 576 324"><rect width="576" height="324" fill="#FFFFFF"/><rect x="24" y="24" width="528" height="276" rx="30" fill="#FCEFF3"/><g fill="none" stroke="#6E8EA0" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M168 184c-42-42-58-88-22-118 30-24 68-12 88 22 20-34 58-46 88-22 36 30 20 76-22 118l-66 62-66-62Z" fill="#F7B6C8" opacity=".42"/><path d="M132 246h204"/><circle cx="416" cy="126" r="42" fill="#E8F4F4"/><path d="M392 126h48M416 102v48"/></g></svg>`);
await writeSvgPng('number-666.png', `<svg xmlns="http://www.w3.org/2000/svg" width="576" height="324" viewBox="0 0 576 324"><rect width="576" height="324" fill="#FFFFFF"/><rect x="24" y="24" width="528" height="276" rx="30" fill="#F3F0FA"/><g fill="none" stroke="#6E8EA0" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M166 198c32 28 72 42 120 42s88-14 120-42" /><path d="M202 158l36-42 34 42M338 158l36-42 34 42"/><circle cx="286" cy="148" r="96" fill="#E8F4F4" opacity=".55"/><path d="M154 232l-44 38M418 232l44 38"/><path d="M108 96h92M376 96h92"/></g></svg>`);

function head(title) {
  return `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=960,height=540"><title>${esc(title)}</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+SC:wght@400;700;900&display=swap" rel="stylesheet"><script src="https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js"></script><link rel="stylesheet" href="assets/slide-base.css">`;
}

function slide({ title, label, icon = 'book-open', page = '', style = '', body = '' }) {
  return `${head(title)}<style>${style}</style></head><body><div class="slide"><div class="menu-bar"><span class="menu-icon"><i data-lucide="${icon}"></i></span><span class="section-label">${esc(label)}</span></div>${page ? `<div class="page-indicator">Trang ${esc(page)}</div>` : ''}${body}</div><script src="assets/slide-base.js"></script></body></html>`;
}

const S = (pin, han) => ({ pin, han });
const P = (value) => ({ punct: value });
const alignedMap = new Map([
  ['他住哪儿？', [S('tā', '他'), S('zhù', '住'), S('nǎr', '哪儿'), P('？')]],
  ['你在哪儿？', [S('nǐ', '你'), S('zài', '在'), S('nǎr', '哪儿'), P('？')]],
  ['办公室', [S('bàn', '办'), S('gōng', '公'), S('shì', '室')]],
  ['办公', [S('bàn', '办'), S('gōng', '公')]],
  ['职员', [S('zhí', '职'), S('yuán', '员')]],
  ['找', [S('zhǎo', '找')]],
  ['在', [S('zài', '在')]],
  ['家', [S('jiā', '家')]],
  ['呢', [S('ne', '呢')]],
  ['住', [S('zhù', '住')]],
  ['楼', [S('lóu', '楼')]],
  ['门', [S('mén', '门')]],
  ['房间', [S('fáng', '房'), S('jiān', '间')]],
  ['号', [S('hào', '号')]],
  ['知道', [S('zhī', '知'), S('dào', '道')]],
  ['电话', [S('diàn', '电'), S('huà', '话')]],
  ['电', [S('diàn', '电')]],
  ['话', [S('huà', '话')]],
  ['号码', [S('hào', '号'), S('mǎ', '码')]],
  ['零（〇）', [S('líng', '零（〇）')]],
  ['手机', [S('shǒu', '手'), S('jī', '机')]],
  ['手', [S('shǒu', '手')]],
  ['这是办公室吗？', [S('zhè', '这'), S('shì', '是'), S('bàngōngshì', '办公室'), S('ma', '吗'), P('？')]],
  ['他在办公室办公。', [S('tā', '他'), S('zài', '在'), S('bàngōngshì', '办公室'), S('bàngōng', '办公'), P('。')]],
  ['职员说他不在。', [S('zhíyuán', '职员'), S('shuō', '说'), S('tā', '他'), S('bú', '不'), S('zài', '在'), P('。')]],
  ['你找谁？', [S('nǐ', '你'), S('zhǎo', '找'), S('shéi', '谁'), P('？')]],
  ['王老师在吗？', [S('Wáng lǎoshī', '王老师'), S('zài', '在'), S('ma', '吗'), P('？')]],
  ['他在家呢。', [S('tā', '他'), S('zài', '在'), S('jiā', '家'), S('ne', '呢'), P('。')]],
  ['十八楼', [S('shíbā', '十八'), S('lóu', '楼')]],
  ['一门', [S('yì', '一'), S('mén', '门')]],
  ['房间号是601。', [S('fángjiān', '房间'), S('hào', '号'), S('shì', '是'), S('liù líng yāo', '601'), P('。')]],
  ['你住几号？', [S('nǐ', '你'), S('zhù', '住'), S('jǐ', '几'), S('hào', '号'), P('？')]],
  ['你知道吗？', [S('nǐ', '你'), S('zhīdào', '知道'), S('ma', '吗'), P('？')]],
  ['他的电话号码是多少？', [S('tā', '他'), S('de', '的'), S('diànhuà', '电话'), S('hàomǎ', '号码'), S('shì', '是'), S('duōshao', '多少'), P('？')]],
  ['手机号码', [S('shǒujī', '手机'), S('hàomǎ', '号码')]],
  ['601', [S('liù líng yāo', '601')]],
  ['他的手机号码是多少？', [S('tā', '他'), S('de', '的'), S('shǒujī', '手机'), S('hàomǎ', '号码'), S('shì', '是'), S('duōshao', '多少'), P('？')]],
  ['请问，这是办公室吗？', [S('qǐngwèn', '请问'), P('，'), S('zhè', '这'), S('shì', '是'), S('bàngōngshì', '办公室'), S('ma', '吗'), P('？')]],
  ['是。你找谁？', [S('shì', '是'), P('。'), S('nǐ', '你'), S('zhǎo', '找'), S('shéi', '谁'), P('？')]],
  ['王老师在吗？我是他的学生。', [S('Wáng lǎoshī', '王老师'), S('zài', '在'), S('ma', '吗'), P('？'), S('wǒ', '我'), S('shì', '是'), S('tā', '他'), S('de', '的'), S('xuésheng', '学生'), P('。')]],
  ['他不在。他在家呢。', [S('tā', '他'), S('bú', '不'), S('zài', '在'), P('。'), S('tā', '他'), S('zài', '在'), S('jiā', '家'), S('ne', '呢'), P('。')]],
  ['他住十八楼一门，房间号是601。', [S('tā', '他'), S('zhù', '住'), S('shíbā', '十八'), S('lóu', '楼'), S('yì', '一'), S('mén', '门'), P('，'), S('fángjiān', '房间'), S('hào', '号'), S('shì', '是'), S('liù líng yāo', '601'), P('。')]],
  ['您知道他的电话号码吗？', [S('nín', '您'), S('zhīdào', '知道'), S('tā', '他'), S('de', '的'), S('diànhuà', '电话'), S('hàomǎ', '号码'), S('ma', '吗'), P('？')]],
  ['知道，6293 1074。', [S('zhīdào', '知道'), P('，'), S('liù èr jiǔ sān yāo líng qī sì', '6293 1074'), P('。')]],
  ['不知道。', [S('bù', '不'), S('zhīdào', '知道'), P('。')]],
  ['谢谢您。', [S('xièxie', '谢谢'), S('nín', '您'), P('。')]],
  ['不谢。', [S('bú', '不'), S('xiè', '谢'), P('。')]],
  ['我找王老师。', [S('wǒ', '我'), S('zhǎo', '找'), S('Wáng lǎoshī', '王老师'), P('。')]],
  ['第十一课 · 我们都是留学生', [S('dìshíyī kè', '第十一课'), P('·'), S('wǒmen', '我们'), S('dōu', '都'), S('shì', '是'), S('liúxuéshēng', '留学生')]],
]);

const alignedCss = `.aligned-text{display:flex;align-items:flex-end;justify-content:center;gap:12px;row-gap:7px;flex-wrap:wrap;overflow:visible}.aligned-text .a-word{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;min-height:76px;overflow:visible}.aligned-text .a-pin{font-size:13.5pt;line-height:1.05;color:#5AACAC;font-weight:800;white-space:nowrap;margin-bottom:7px}.aligned-text .a-han{font-family:'Noto Sans SC';font-size:36pt;line-height:1;color:#1A3A5A;font-weight:900;white-space:nowrap}.aligned-text .a-punct{font-family:'Noto Sans SC';font-size:36pt;line-height:1;color:#1A3A5A;font-weight:900;margin-left:-8px}`;

function alignedText(zh, pinyin = '', className = '') {
  const segments = alignedMap.get(zh) || [S(pinyin, zh)];
  return `<div class="aligned-text ${esc(className)}">${segments.map((segment) => {
    if (segment.punct) return `<span class="a-punct">${esc(segment.punct)}</span>`;
    return `<span class="a-word"><span class="a-pin">${esc(segment.pin)}</span><span class="a-han">${esc(segment.han)}</span></span>`;
  }).join('')}</div>`;
}

const slides = [];
function add(fileBase, html) {
  const number = String(slides.length + 1).padStart(2, '0');
  const file = `${number}-${fileBase}.html`;
  slides.push(file);
  return fs.writeFile(path.join(slidesDir, file), html, 'utf8');
}

function divider(title, subtitle, label, icon, image = 'vocab-divider-base-selected.png') {
  return slide({
    title, label, icon,
    style: `.divider{position:absolute;inset:72px 58px 54px;display:grid;grid-template-columns:1fr 330px;gap:34px;align-items:center}.kicker{font-size:11pt;font-weight:800;color:#5AACAC;letter-spacing:1.4px;text-transform:uppercase}.big{font-family:'Noto Sans SC';font-size:58pt;font-weight:900;color:#1A3A5A;line-height:1;margin:18px 0}.sub{font-size:17pt;color:#4A6080;line-height:1.38}.photo{height:280px;border-radius:24px;overflow:hidden;box-shadow:0 16px 34px rgba(26,58,90,.14);background:#F0FAFA}.photo img{width:100%;height:100%;object-fit:cover}`,
    body: `<div class="divider"><div><div class="kicker">${esc(label)}</div><div class="big">${esc(title)}</div><div class="sub">${esc(subtitle)}</div></div><div class="photo"><img src="assets/photos/${image}" alt=""></div></div>`,
  });
}

function lesson01Divider({ title, label, zhTitle, desc = '', page = '', icon = 'book-open', image = 'practice.jpg', accent = '#5AACAC', width = '58%' }) {
  return slide({
    title,
    label,
    icon,
    page,
    style: `.left{position:absolute;left:0;top:40px;bottom:0;width:${width};background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center}.section-label-big{font-size:11pt;color:${accent};text-transform:uppercase;letter-spacing:3px;font-weight:800;margin-bottom:12px}.zh-title{font-family:'Noto Sans SC';font-size:48pt;font-weight:900;color:#1A3A5A;margin-bottom:16px}.line{width:46px;height:3px;border-radius:4px;background:${accent};margin-bottom:16px}.desc{font-size:14pt;color:#8A9AB0}.right-photo{position:absolute;right:36px;top:88px;width:330px;height:350px}.right-photo img{width:100%;height:100%;object-fit:cover}`,
    body: `<div class="left"><div class="section-label-big">${esc(label)}</div><div class="zh-title">${esc(zhTitle)}</div><div class="line"></div>${desc ? `<div class="desc">${esc(desc)}</div>` : ''}</div><div class="right-photo photo-panel"><img class="stock-img" src="assets/photos/${esc(image)}" alt=""></div>`,
  });
}

await add('cover', `${head('Bài 10 · 他住哪儿')}<style>
${alignedCss}body{background:#fff}.cover{position:absolute;inset:0;background:linear-gradient(145deg,#F4FAFA 0%,#FFFFFF 56%,#F3F0FA 100%);overflow:hidden}.cover:before{content:"";position:absolute;right:-80px;top:-120px;width:360px;height:360px;border-radius:50%;background:rgba(90,172,172,.13)}.cover-card{position:absolute;left:62px;top:78px;width:520px;z-index:2}.lesson{display:inline-flex;align-items:center;gap:10px;background:#E8F4F4;color:#5AACAC;padding:10px 21px;border-radius:999px;font-weight:800;font-size:16pt}.cover-align{justify-content:flex-start;gap:14px;margin-top:26px}.cover-align .a-word{min-height:88px}.cover-align .a-pin{font-size:16pt}.cover-align .a-han,.cover-align .a-punct{font-size:62pt}.vi{font-size:24pt;color:#4A6080;font-weight:800;margin-top:20px}.topic-img{position:absolute;right:48px;top:114px;width:330px;height:246px;border-radius:24px;overflow:hidden;background:#F8FBFB;border:2px solid rgba(90,172,172,.18);box-shadow:0 16px 44px rgba(26,58,90,.16)}.topic-img img{width:100%;height:100%;object-fit:cover}</style></head><body><div class="cover"><div class="cover-card"><div class="lesson">BÀI 10 · 第十课</div>${alignedText('他住哪儿？', 'tā zhù nǎr?', 'cover-align')}<div class="vi">Anh ấy sống ở đâu?</div></div><div class="topic-img"><img src="assets/photos/cover-topic.png" alt=""></div></div></body></html>`);

await add('objectives', slide({
  title: 'Mục tiêu', label: 'MỤC TIÊU', icon: 'target',
  style: `.left-content{position:absolute;left:60px;top:78px;width:530px}.title{margin-bottom:28px}.cards{display:flex;flex-direction:column;gap:16px}.goal{padding:16px 20px;display:flex;align-items:center;gap:16px;font-size:14pt;color:#4A6080;line-height:1.36}.num{width:26px;height:26px;background:#5AACAC;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0}.right-panel{position:absolute;right:48px;top:114px;width:318px;height:286px;border-radius:20px;overflow:hidden;background:#F8FBFB;border:2px solid rgba(90,172,172,.18);box-shadow:0 10px 28px rgba(90,172,172,.14)}.right-panel img{width:100%;height:100%;object-fit:cover}`,
  body: `<div class="left-content"><div class="title">Hôm nay bạn sẽ học gì?</div><div class="cards"><div class="goal card"><div class="num">1</div><div>Hỏi người cần gặp: 你找谁？王老师在吗？</div></div><div class="goal card"><div class="num">2</div><div>Nói nơi ở, số phòng và số điện thoại</div></div><div class="goal card"><div class="num">3</div><div>Đọc hội thoại và luyện trật tự câu tiếng Hán</div></div><div class="goal card"><div class="num">4</div><div>Viết chữ Hán trọng tâm của bài 10</div></div></div></div><div class="right-panel"><img src="assets/sample-images/objectives.png" alt=""></div>`,
}));

await add('warmup', slide({
  title: 'Khởi động', label: 'KHỞI ĐỘNG', icon: 'sparkles',
  style: `${alignedCss}.wrap{position:absolute;left:64px;right:64px;top:74px;text-align:center}.warmup-align .a-word{min-height:78px}.warmup-align .a-pin{font-size:15.5pt}.warmup-align .a-han,.warmup-align .a-punct{font-size:54pt}.hint{font-size:14pt;color:#4A6080;margin:18px 0 22px}.chips{display:flex;justify-content:center;gap:14px}.chip{width:132px;height:88px;border-radius:20px;background:#fff;border:1px solid rgba(90,172,172,.18);box-shadow:0 8px 26px rgba(90,172,172,.12);display:flex;flex-direction:column;align-items:center;justify-content:center}.chip .zh{font-family:'Noto Sans SC';font-size:25pt;font-weight:900}.chip .vi{font-size:11.5pt;color:#8A9AB0;margin-top:4px}.answer{margin:28px auto 0;width:420px;padding:14px;border-radius:18px;background:#E8F4F4;color:#1A3A5A;font-size:20pt;font-family:'Noto Sans SC';font-weight:900}`,
  body: `<div class="wrap">${alignedText('你在哪儿？', 'nǐ zài nǎr?', 'warmup-align')}<div class="hint">Chọn một nơi rồi trả lời bằng mẫu: 我在……</div><div class="chips"><div class="chip"><div class="zh">教室</div><div class="vi">lớp học</div></div><div class="chip"><div class="zh">家</div><div class="vi">nhà</div></div><div class="chip"><div class="zh">公司</div><div class="vi">công ty</div></div><div class="chip"><div class="zh">公园</div><div class="vi">công viên</div></div></div><div class="answer">我在＿＿＿。</div></div>`,
}));

await add('divider-vocab', lesson01Divider({
  title: 'Từ vựng',
  label: 'TỪ VỰNG',
  zhTitle: '生词',
  desc: `${vocab.length} từ mới · Trang 77-78`,
  page: '77-78',
  icon: 'book-open',
  image: 'vocab-divider.png',
  accent: '#5AACAC',
  width: '54%',
}));

const sampleImageOverrides = new Map([
  ['V007', 'sample-v007-ta-zhu-nar.png'],
  ['V008', 'sample-v008-shiba-lou.png'],
  ['V015', 'sample-v015-601.png'],
  ['V016', 'sample-v016-phone-number.png'],
]);

for (const [index, item] of vocab.entries()) {
  await add(`vocab-${slug(item.record_id)}`, slide({
    title: `Từ vựng · ${item.chinese_simplified}`,
    label: 'TỪ VỰNG',
    icon: 'book-open',
    page: item.source_page_range,
    style: `${alignedCss}.slide:before{background:linear-gradient(145deg,rgba(90,172,172,.03),rgba(255,255,255,0) 60%)}.vocab-layout{position:absolute;top:50px;bottom:32px;left:0;right:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.vocab-img{width:288px;height:162px;border-radius:14px;overflow:hidden;background:#F0FAFA;border:2px solid #5AACAC}.vocab-img img{width:100%;height:100%;object-fit:cover}.vocab-align{margin-top:14px;gap:9px}.vocab-align .a-word{min-height:74px}.vocab-align .a-pin{font-size:12.5pt}.vocab-align .a-han,.vocab-align .a-punct{font-size:56pt}.vocab-align .a-punct{margin-left:-5px}.vocab-meta{margin-top:12px;display:flex;flex-direction:column;align-items:center;gap:4px}.vocab-meaning{font-size:15pt;color:#4A6080;max-width:720px}.vocab-sub{font-size:12pt;color:#8A9AB0}.vocab-sub .hanviet{font-style:italic}.vocab-sub .divider-dot{margin:0 6px;opacity:.4}.vocab-type{display:inline-block;background:#E8F4F4;color:#5AACAC;font-size:10pt;font-weight:700;padding:3px 12px;border-radius:10px;margin-top:4px}.counter{position:absolute;top:52px;right:28px;background:#F6FBFB;color:#5AACAC;font-size:9.5pt;font-weight:800;padding:4px 12px;border-radius:12px;box-shadow:0 2px 8px rgba(90,172,172,.10)}`,
    body: `<div class="counter">${String(index + 1).padStart(2, '0')}/${String(vocab.length).padStart(2, '0')}</div><div class="vocab-layout"><div class="vocab-img"><img src="assets/vocab-images/${esc(item.image_file)}" alt="${esc(item.chinese_simplified)}"></div>${alignedText(item.chinese_simplified, item.pinyin, 'vocab-align')}<div class="vocab-meta"><div class="vocab-meaning">${esc(item.vietnamese)}</div><div class="vocab-sub"><span class="hanviet">(${esc(item.han_viet || 'hán việt')})</span><span class="divider-dot">·</span><span class="vocab-type">${esc(item.word_type_vi || 'từ')}</span></div></div></div>`,
  }));
  if (item.sample_sentence_zh) {
    const samplePinyin = item.sample_sentence_pinyin || '';
    const sampleZh = item.sample_sentence_zh || '';
    const longSample = sampleZh.length > 11 || samplePinyin.length >= 31 || /号码是多少/.test(sampleZh) || (item.sample_sentence_vi || '').length > 36;
    const sampleImageFile = sampleImageOverrides.get(item.record_id);
    const sampleImageSrc = sampleImageFile
      ? `assets/sample-images/${sampleImageFile}`
      : `assets/vocab-images/${item.image_file}`;
    await add(`sample-${slug(item.record_id)}`, slide({
      title: `Mẫu câu · ${item.chinese_simplified}`,
      label: 'MẪU CÂU',
      icon: 'message-circle',
      page: item.source_page_range,
      style: `${alignedCss}.sample-card{position:absolute;left:50%;top:50%;transform:translate(-50%,-46%);width:570px;padding:32px 42px 34px;border-radius:24px;text-align:center;display:flex;flex-direction:column;align-items:center}.sample-spot{position:absolute;left:52px;bottom:28px;width:116px;height:116px;border-radius:50%;overflow:hidden;background:#F8FBFB;border:2px solid rgba(90,172,172,.22);box-shadow:0 8px 22px rgba(90,172,172,.12)}.sample-spot img{width:100%;height:100%;object-fit:cover}.sample-align{margin-top:18px;max-width:540px}.sample-align .a-word{min-height:80px}.sample-align .a-pin{font-size:13.5pt}.sample-align .a-han,.sample-align .a-punct{font-size:38pt}.sample-vi{font-size:18pt;color:#4A6080;margin-top:14px}.sample-card.long{width:650px;padding:30px 38px}.sample-card.long .sample-align{max-width:610px;gap:9px;row-gap:6px}.sample-card.long .sample-align .a-word{min-height:60px}.sample-card.long .sample-align .a-pin{font-size:10.5pt;margin-bottom:5px}.sample-card.long .sample-align .a-han,.sample-card.long .sample-align .a-punct{font-size:27pt}.sample-card.long .sample-vi{font-size:14.5pt;line-height:1.28;max-width:560px}`,
      body: `<div class="sample-spot"><img src="${esc(sampleImageSrc)}" alt=""></div><div class="sample-card card ${longSample ? 'long' : ''}"><span class="pill">Mẫu câu</span>${alignedText(sampleZh, samplePinyin, 'sample-align')}<div class="sample-vi">${esc(item.sample_sentence_vi || item.vietnamese)}</div></div>`,
    }));
  }
}

await add('divider-vocab-practice', lesson01Divider({
  title: 'Tập từ vựng',
  label: 'TẬP TỪ VỰNG',
  zhTitle: '词汇练习',
  page: '77-78',
  icon: 'pencil',
  image: 'practice.jpg',
  accent: '#8B5CF6',
}));

const hanziOrder = [0, 7, 12, 3, 15, 1, 8, 18, 4, 10, 13, 2, 17, 6, 14, 5, 9, 19, 11, 16].map((i) => vocab[i]).filter(Boolean);
const pinyinOrder = [13, 2, 18, 0, 8, 15, 5, 11, 3, 16, 6, 1, 12, 9, 17, 4, 19, 7, 14, 10].map((i) => vocab[i]).filter(Boolean);
const imageOrder = [5, 12, 1, 17, 9, 3, 14, 0, 19, 7, 13, 4, 10, 2, 16, 8, 18, 6, 11, 15].map((i) => vocab[i]).filter(Boolean);

function chunk(array, size) {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, index) => array.slice(index * size, index * size + size));
}

const matchingGroups = chunk(vocab, 4);
for (const [groupIndex, group] of matchingGroups.entries()) {
  const hanzi = [1, 3, 0, 2].map((i) => group[i]).filter(Boolean);
  const pinyin = [2, 0, 3, 1].map((i) => group[i]).filter(Boolean);
  const images = [3, 1, 2, 0].map((i) => group[i]).filter(Boolean);
  await add(`vocab-matching-${String(groupIndex + 1).padStart(2, '0')}`, slide({
    title: 'Ghép nối',
    label: 'TẬP TỪ VỰNG',
    icon: 'pencil',
    page: '77-78',
    style: `.wrap{position:absolute;left:58px;right:58px;top:70px}.title{font-size:22pt;font-weight:900;margin-bottom:14px;text-align:center}.part{position:absolute;right:58px;top:78px;font-size:10pt;font-weight:800;color:#5AACAC;background:#E8F4F4;border-radius:16px;padding:6px 14px}.match-board{position:relative;width:844px;height:376px}.row{position:absolute;left:0;right:0;display:grid;grid-template-columns:repeat(4,1fr);gap:14px;z-index:2}.row-hanzi{top:0}.row-pinyin{top:116px}.row-images{top:236px}.tile{height:78px;border-radius:18px;background:#fff;border:1px solid rgba(90,172,172,.18);box-shadow:0 8px 22px rgba(90,172,172,.11);display:flex;align-items:center;justify-content:center;text-align:center;padding:8px;box-sizing:border-box}.han{font-family:'Noto Sans SC';font-size:25pt;font-weight:900;color:#1A3A5A}.pin{font-size:15pt;font-weight:800;color:#5AACAC;line-height:1.12}.img{height:126px;padding:0;overflow:hidden;background:#F6FBFB}.img img{width:100%;height:100%;object-fit:cover}`,
    body: `<div class="part">${String(groupIndex + 1).padStart(2, '0')} / ${matchingGroups.length}</div><div class="wrap"><div class="title">Ghép nối</div><div class="match-board"><div class="row row-hanzi">${hanzi.map((item) => `<div class="tile han">${esc(item.chinese_simplified)}</div>`).join('')}</div><div class="row row-pinyin">${pinyin.map((item) => `<div class="tile pin">${esc(item.pinyin)}</div>`).join('')}</div><div class="row row-images">${images.map((item) => `<div class="tile img"><img src="assets/vocab-images/${esc(item.image_file)}" alt=""></div>`).join('')}</div></div></div>`,
  }));
}

for (const [groupIndex, group] of chunk(vocab, 6).entries()) {
  const start = groupIndex * 6 + 1;
  const end = start + group.length - 1;
  await add(`vocab-summary-${String(groupIndex + 1).padStart(2, '0')}`, slide({
    title: 'Tổng kết từ vựng',
    label: 'TỪ VỰNG',
    icon: 'book-open',
    page: '77-78',
    style: `.summary-title{position:absolute;left:58px;top:70px;font-size:20pt;font-weight:800}.summary-part{position:absolute;right:58px;top:76px;font-size:10pt;font-weight:800;color:#5AACAC;background:#E8F4F4;border-radius:16px;padding:6px 14px}.summary-grid{position:absolute;left:58px;right:58px;top:122px;display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.sum-card{height:152px;padding:12px 14px;text-align:center;overflow:hidden}.sum-han{font-size:31pt;line-height:.98}.sum-han.long{font-size:25pt}.blank-line{width:64px;height:2px;background:#DCEAEA;margin:7px auto 8px}.sum-hidden{opacity:0;transition:opacity .25s}.sum-card.revealed .sum-hidden{opacity:1}.sum-hidden .pinyin{font-size:11.5pt;line-height:1.1}.sum-hidden .vi{font-size:9.6pt;color:#4A6080;line-height:1.14;margin-top:2px}.sum-hidden .hv{font-size:8.8pt;color:#8A9AB0;font-style:italic;line-height:1.08;margin-top:2px}.quiz-note{position:absolute;right:58px;bottom:40px;color:#8A9AB0;font-size:10pt}`,
    body: `<div class="summary-title">Mini quiz từ vựng</div><div class="summary-part">${String(start).padStart(2, '0')}-${String(end).padStart(2, '0')} / ${vocab.length}</div><div class="summary-grid">${group.map((item, index) => `<div class="sum-card card" data-reveal-step="${index + 1}"><div class="hanzi sum-han ${item.chinese_simplified.length > 2 ? 'long' : ''}">${esc(item.chinese_simplified)}</div><div class="blank-line"></div><div class="sum-hidden"><div class="pinyin">${esc(item.pinyin)}</div><div class="vi">${esc(item.vietnamese)}</div><div class="hv">(${esc(item.han_viet || '')})</div></div></div>`).join('')}</div><div class="quiz-note">Click để hiện từng đáp án.</div>`,
  }));
}

await add('divider-comprehensive', lesson01Divider({
  title: 'Luyện tập tổng hợp',
  label: 'LUYỆN TẬP TỔNG HỢP',
  zhTitle: '综合练习',
  icon: 'layers',
  image: 'practice.jpg',
  accent: '#F59E0B',
}));

for (const [index, item] of vocab.slice(0, 5).entries()) {
  const longFlash = item.chinese_simplified.length > 2;
  await add(`practice-flashcard-${slug(item.record_id)}`, slide({
    title: 'Flashcard',
    label: 'TẬP TỪ VỰNG',
    icon: 'pencil',
    style: `${alignedCss}.flash-title{position:absolute;left:58px;top:70px;font-size:20pt;font-weight:800;color:#1A3A5A}.flash-count{position:absolute;right:58px;top:78px;background:#E8F4F4;color:#5AACAC;border-radius:999px;padding:6px 16px;font-size:10pt;font-weight:900}.flash-card{position:absolute;left:50%;top:116px;transform:translateX(-50%);width:430px;height:326px;perspective:1200px;cursor:pointer}.flip-trigger{position:absolute;width:0;height:0;opacity:0;pointer-events:none}.flip-inner{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .68s cubic-bezier(.2,.8,.2,1)}.flip-face{position:absolute;inset:0;border-radius:24px;background:#fff;box-shadow:0 14px 38px rgba(90,172,172,.16);border:1px solid rgba(90,172,172,.16);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;overflow:hidden;backface-visibility:hidden;transition:opacity .18s ease;box-sizing:border-box;padding:22px 42px 22px 76px}.flip-face:before{content:"";position:absolute;left:0;top:0;bottom:0;width:58px;background:linear-gradient(180deg,#D4EDED,#E8F4F4)}.flip-face:after{content:"";position:absolute;right:12px;top:12px;width:86px;height:86px;border-radius:50%;background:rgba(200,184,232,.16)}.face-han{transform:rotateY(0deg);opacity:1}.face-pin{transform:rotateY(180deg);opacity:0}.face-vi{transform:rotateY(360deg);opacity:0}.flash-card:has(.pin-trigger.revealed):not(:has(.vi-trigger.revealed)) .flip-inner{transform:rotateY(180deg)}.flash-card:has(.pin-trigger.revealed):not(:has(.vi-trigger.revealed)) .face-han{opacity:0}.flash-card:has(.pin-trigger.revealed):not(:has(.vi-trigger.revealed)) .face-pin{opacity:1}.flash-card:has(.vi-trigger.revealed) .flip-inner{transform:rotateY(360deg)}.flash-card:has(.vi-trigger.revealed) .face-han,.flash-card:has(.vi-trigger.revealed) .face-pin{opacity:0}.flash-card:has(.vi-trigger.revealed) .face-vi{opacity:1}.flash-hint,.face-label,.flash-han,.flash-vi,.flash-align{position:relative;z-index:1;width:100%;text-align:center}.flash-hint,.face-label{display:inline-flex;align-items:center;justify-content:center;width:auto;background:#F6FBFB;color:#8A9AB0;border-radius:999px;padding:6px 16px;font-size:10pt;font-weight:800;margin-bottom:12px}.face-label{background:#E8F4F4;color:#5AACAC}.flash-han{font-size:78pt;line-height:.95;max-width:292px}.flash-han.long{font-size:56pt;letter-spacing:0}.flash-align{gap:8px}.flash-align .a-word{min-height:70px}.flash-align .a-pin{font-size:13pt}.flash-align .a-han,.flash-align .a-punct{font-size:${longFlash ? '42pt' : '52pt'}}.flash-vi{font-size:28pt;color:#1A3A5A;font-weight:900;line-height:1.12;max-width:300px}`,
    body: `<div class="flash-title">Flashcard</div><div class="flash-count">${String(index + 1).padStart(2, '0')} / 5</div><div class="flash-card"><span class="flip-trigger pin-trigger" data-reveal-step="1"></span><span class="flip-trigger vi-trigger" data-reveal-step="2"></span><div class="flip-inner"><div class="flip-face face-han"><div class="flash-hint">Nhìn chữ và đọc trước</div><div class="hanzi flash-han ${longFlash ? 'long' : ''}">${esc(item.chinese_simplified)}</div></div><div class="flip-face face-pin"><div class="face-label">Pinyin</div>${alignedText(item.chinese_simplified, item.pinyin, 'flash-align')}</div><div class="flip-face face-vi"><div class="face-label">Nghĩa</div><div class="flash-vi">${esc(item.vietnamese)}</div></div></div></div>`,
  }));
}

await add('divider-grammar', lesson01Divider({
  title: 'Ngữ pháp',
  label: 'NGỮ PHÁP',
  zhTitle: '语法',
  icon: 'boxes',
  image: 'vocab-divider.png',
  accent: '#5AACAC',
}));

await add('grammar-word-order', slide({
  title: 'Trật tự câu tiếng Hán', label: 'NGỮ PHÁP', icon: 'boxes', page: '78-81',
  style: `${alignedCss}.wrap{position:absolute;left:62px;right:62px;top:76px}.title{font-size:28pt;font-weight:900;margin-bottom:24px}.flow{display:flex;align-items:center;gap:14px}.block{flex:1;height:132px;border-radius:24px;background:#fff;box-shadow:0 10px 28px rgba(90,172,172,.12);border:1px solid rgba(90,172,172,.16);display:flex;flex-direction:column;align-items:center;justify-content:center}.block .vi{font-size:16pt;font-weight:900;color:#4A6080}.block .zh{font-family:'Noto Sans SC';font-size:27pt;font-weight:900;color:#1A3A5A;margin-top:6px}.plus{width:38px;height:38px;border-radius:50%;background:#E8F4F4;color:#5AACAC;font-size:26pt;font-weight:900;display:flex;align-items:center;justify-content:center;line-height:1}.example{margin-top:30px;padding:18px 24px;border-radius:22px;background:#E8F4F4;text-align:center}.grammar-align .a-word{min-height:62px}.grammar-align .a-pin{font-size:12.5pt}.grammar-align .a-han,.grammar-align .a-punct{font-size:31pt}`,
  body: `<div class="wrap"><div class="title">Ghép từng phần thành một câu</div><div class="flow"><div class="block"><div class="vi">Ai / cái gì</div><div class="zh">他</div></div><div class="plus">+</div><div class="block"><div class="vi">ở đâu / làm gì</div><div class="zh">在家</div></div><div class="plus">+</div><div class="block"><div class="vi">nhấn nhẹ</div><div class="zh">呢</div></div></div><div class="example">${alignedText('他在家呢。', 'tā zài jiā ne', 'grammar-align')}</div></div>`,
}));

await add('grammar-verb-sentence', slide({
  title: 'Câu có hành động', label: 'NGỮ PHÁP', icon: 'route', page: '78-81',
  style: `${alignedCss}.wrap{position:absolute;left:66px;right:66px;top:78px}.title{font-size:26pt;font-weight:900;margin-bottom:20px}.sentence{display:grid;grid-template-columns:1fr 42px 1fr 42px 1fr;gap:10px;align-items:center}.part{height:144px;border-radius:22px;background:#fff;border:1px solid rgba(90,172,172,.16);box-shadow:0 10px 28px rgba(90,172,172,.12);display:flex;flex-direction:column;align-items:center;justify-content:center}.part .tag{font-size:13pt;color:#8A9AB0;font-weight:800}.part .zh{font-family:'Noto Sans SC';font-size:36pt;font-weight:900;color:#1A3A5A}.plus{width:38px;height:38px;border-radius:50%;background:#E8F4F4;color:#5AACAC;font-size:26pt;font-weight:900;display:flex;align-items:center;justify-content:center;line-height:1}.examples{margin-top:24px;display:grid;grid-template-columns:1fr 1fr;gap:16px}.ex{padding:16px 14px;border-radius:18px;background:#E8F4F4;text-align:center}.verb-align{gap:8px}.verb-align .a-word{min-height:56px}.verb-align .a-pin{font-size:10.5pt;margin-bottom:5px}.verb-align .a-han,.verb-align .a-punct{font-size:24pt}`,
  body: `<div class="wrap"><div class="title">Có hành động? Cộng từng phần lại</div><div class="sentence"><div class="part"><div class="tag">người nói tới</div><div class="zh">我</div></div><div class="plus">+</div><div class="part"><div class="tag">hành động</div><div class="zh">找</div></div><div class="plus">+</div><div class="part"><div class="tag">người / vật</div><div class="zh">王老师</div></div></div><div class="examples"><div class="ex">${alignedText('你找谁？', 'nǐ zhǎo shéi?', 'verb-align')}</div><div class="ex">${alignedText('我找王老师。', 'wǒ zhǎo Wáng lǎoshī.', 'verb-align')}</div></div></div>`,
}));

await add('grammar-number-reading', slide({
  title: 'Cách đọc số', label: 'NGỮ PHÁP', icon: 'phone', page: '78-81',
  style: `.wrap{position:absolute;left:62px;right:62px;top:74px}.title{font-size:26pt;font-weight:900;margin-bottom:18px}.practice{display:grid;grid-template-columns:1fr 1fr;gap:34px}.col-title{font-size:13pt;font-weight:900;color:#5AACAC;text-transform:uppercase;margin-bottom:8px}.list{display:flex;flex-direction:column;gap:8px}.line-item{display:grid;grid-template-columns:34px 1fr;align-items:center;font-size:23pt;font-weight:900;color:#1A3A5A;border-bottom:1px solid rgba(90,172,172,.16);padding:5px 0}.idx{width:24px;height:24px;border-radius:50%;background:#E8F4F4;color:#5AACAC;font-size:10pt;display:flex;align-items:center;justify-content:center}`,
  body: `<div class="wrap"><div class="title">Luyện đọc số</div><div class="practice"><div><div class="col-title">Số điện thoại</div><div class="list">${['6293 1074','1385 0926','8074 3168','5209 6417','7316 8502'].map((n, i) => `<div class="line-item"><div class="idx">${i + 1}</div><div>${n}</div></div>`).join('')}</div></div><div><div class="col-title">Số phòng</div><div class="list">${['601','1801','305','1208','409'].map((n, i) => `<div class="line-item"><div class="idx">${i + 1}</div><div>${n}</div></div>`).join('')}</div></div></div></div>`,
}));

await add('grammar-practice-correction', slide({
  title: 'Sửa câu sai', label: 'LUYỆN NGỮ PHÁP', icon: 'list-checks', page: '83',
  style: `.wrap{position:absolute;left:54px;right:54px;top:68px}.title{font-size:25pt;font-weight:900;margin-bottom:16px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.q{min-height:112px;padding:20px;border-radius:20px;background:#fff;border:1px solid rgba(90,172,172,.16);box-shadow:0 8px 24px rgba(90,172,172,.11)}.wrong{font-family:'Noto Sans SC';font-size:23pt;font-weight:900;color:#D85C5C}.right{font-family:'Noto Sans SC';font-size:22pt;font-weight:900;color:#1A3A5A;margin-top:12px;opacity:0;transform:translateY(6px);transition:.18s ease}.right.revealed{opacity:1;transform:translateY(0)}`,
  body: `<div class="wrap"><div class="title">Tìm câu sai, rồi sửa lại</div><div class="grid"><div class="q"><div class="wrong">他家在呢。</div><div class="right" data-reveal-step="1">他在家呢。</div></div><div class="q"><div class="wrong">找你谁？</div><div class="right" data-reveal-step="2">你找谁？</div></div><div class="q"><div class="wrong">他哪儿住？</div><div class="right" data-reveal-step="3">他住哪儿？</div></div><div class="q"><div class="wrong">号码电话是多少？</div><div class="right" data-reveal-step="4">电话号码是多少？</div></div></div></div>`,
}));

await add('divider-dialogue', lesson01Divider({
  title: 'Hội thoại',
  label: 'HỘI THOẠI',
  zhTitle: '课文',
  desc: 'Hội thoại · Trang 76-77',
  page: '76-77',
  icon: 'messages-square',
  image: 'dialogue-topic.png',
  accent: '#10B981',
}));

const dialogueLines = [
  ['李昌浩', 'qǐngwèn, zhè shì bàngōngshì ma?', '请问，这是办公室吗？'],
  ['职员', 'shì. nǐ zhǎo shéi?', '是。你找谁？'],
  ['李昌浩', 'Wáng lǎoshī zài ma? wǒ shì tā de xuésheng.', '王老师在吗？我是他的学生。'],
  ['职员', 'tā bú zài. tā zài jiā ne.', '他不在。他在家呢。'],
  ['李昌浩', 'tā zhù nǎr?', '他住哪儿？'],
  ['职员', 'tā zhù shíbā lóu yì mén, fángjiān hào shì liù líng yāo.', '他住十八楼一门，房间号是601。'],
  ['李昌浩', 'nín zhīdào tā de diànhuà hàomǎ ma?', '您知道他的电话号码吗？'],
  ['职员', 'zhīdào, liù èr jiǔ sān yāo líng qī sì.', '知道，6293 1074。'],
  ['李昌浩', 'tā de shǒujī hàomǎ shì duōshao?', '他的手机号码是多少？'],
  ['职员', 'bù zhīdào.', '不知道。'],
  ['李昌浩', 'xièxie nín.', '谢谢您。'],
  ['职员', 'bú xiè.', '不谢。'],
];

for (let i = 0; i < dialogueLines.length; i += 2) {
  const pair = dialogueLines.slice(i, i + 2);
  await add(`dialogue-${String(i / 2 + 1).padStart(2, '0')}`, slide({
    title: 'Hội thoại', label: 'HỘI THOẠI', icon: 'messages-square', page: '76-77',
    style: `${alignedCss}.wrap{position:absolute;left:58px;right:58px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:18px}.turn{display:grid;grid-template-columns:120px 1fr;gap:22px;align-items:center}.avatar{width:104px;height:104px;border-radius:50%;background:#E8F4F4;display:flex;align-items:center;justify-content:center;overflow:hidden;border:3px solid #fff;box-shadow:0 8px 24px rgba(90,172,172,.15)}.avatar img{width:100%;height:100%;object-fit:cover}.bubble{min-height:130px;padding:16px 22px;border-radius:24px;background:#fff;border:1px solid rgba(90,172,172,.16);box-shadow:0 10px 28px rgba(90,172,172,.12);box-sizing:border-box}.name{font-size:12pt;font-weight:900;color:#5AACAC;margin-bottom:7px}.dialogue-align{justify-content:flex-start;gap:8px;row-gap:4px}.dialogue-align .a-word{min-height:45px}.dialogue-align .a-pin{font-size:8.6pt;margin-bottom:4px}.dialogue-align .a-han,.dialogue-align .a-punct{font-size:21pt;line-height:1.02}.dialogue-align .a-punct{margin-left:-5px}`,
    body: `<div class="wrap">${pair.map((line, idx) => `<div class="turn"><div class="avatar"><img src="${idx === 0 ? 'avatar-a.png' : 'avatar-b.png'}" alt=""></div><div class="bubble"><div class="name">${esc(line[0])}</div>${alignedText(line[2], line[1], 'dialogue-align')}</div></div>`).join('')}</div>`,
  }));
}

await add('divider-writing', lesson01Divider({
  title: 'Tập viết chữ Hán',
  label: 'TẬP VIẾT',
  zhTitle: '写汉字',
  desc: 'Trang 84',
  page: '84',
  icon: 'pen-line',
  image: 'writing-hand.png',
  accent: '#5AACAC',
}));

const writingChars = [
  ['住', 'zhù', 'ở, cư trú'], ['有', 'yǒu', 'có'], ['公', 'gōng', 'công'], ['室', 'shì', 'phòng'],
  ['在', 'zài', 'ở, tại'], ['家', 'jiā', 'nhà'], ['呢', 'ne', 'trợ từ'], ['知', 'zhī', 'biết'],
  ['道', 'dào', 'đạo, biết'], ['电', 'diàn', 'điện'], ['话', 'huà', 'lời nói'], ['号', 'hào', 'số'],
  ['手', 'shǒu', 'tay'], ['机', 'jī', 'máy'],
];

const hanziDataCache = new Map();
async function loadHanziData(char) {
  if (hanziDataCache.has(char)) return hanziDataCache.get(char);
  const out = path.join(assetsDir, 'hanzi-data', `${char}.json`);
  try {
    const cached = JSON.parse(await fs.readFile(out, 'utf8'));
    hanziDataCache.set(char, cached);
    return cached;
  } catch {}
  const url = `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${encodeURIComponent(char)}.json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Cannot fetch HanziWriter data for ${char}`);
  const data = await response.json();
  await fs.writeFile(out, JSON.stringify(data), 'utf8');
  hanziDataCache.set(char, data);
  return data;
}

for (const [char, pin, meaning] of writingChars) {
  const embeddedCharData = await loadHanziData(char);
  await add(`stroke-${slug(pin)}`, `${head(`Tập viết · ${char}`)}<style>
.stroke-title{position:absolute;left:58px;top:78px;font-size:22pt;font-weight:800}.stroke-card{position:absolute;left:50%;top:112px;transform:translateX(-50%);width:420px;height:370px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:22px 30px}.writer-target{width:230px;height:230px;position:relative;border:2px solid #999;background:#fafafa}.writer-target::before,.writer-target::after{content:"";position:absolute;pointer-events:none;z-index:0}.writer-target::before{top:50%;left:5%;right:5%;height:0;border-top:1.5px dashed #ccc}.writer-target::after{left:50%;top:5%;bottom:5%;width:0;border-left:1.5px dashed #ccc}.stroke-meta{text-align:center;margin-top:4px}.stroke-meta .pinyin{font-size:18pt}.meaning{font-size:13.5pt;color:#4A6080;margin-top:4px}.hv{font-size:11.5pt;color:#8A9AB0;font-style:italic;margin-top:3px}.animate-btn{margin-top:12px;border:0;border-radius:18px;background:#5AACAC;color:#fff;padding:8px 18px;font-weight:800;cursor:pointer}.fallback-char{font-family:'Noto Sans SC';font-size:130px;font-weight:900;color:#1A3A5A;text-align:center}
</style></head><body><div class="slide"><div class="menu-bar"><span class="menu-icon"><i data-lucide="pen-line"></i></span><span class="section-label">TẬP VIẾT</span></div><div class="page-indicator">Trang 84</div>
    <div class="stroke-card card">
      <div id="writer-target" class="writer-target" data-char="${esc(char)}"></div>
      <div class="stroke-meta">
        <div class="pinyin">${esc(pin)}</div>
        <div class="meaning">${esc(meaning)}</div>
        <div class="hv">(${esc(char)})</div>
      </div>
    </div>
    <script src="assets/js/hanzi-writer.min.js"></script>
    <script>
      let writer; window.lessonWriter = null;
      const embeddedCharData = ${JSON.stringify(embeddedCharData)};
      function fallbackChar(ch){ document.getElementById('writer-target').innerHTML='<div class="fallback-char">'+ch+'</div>'; }
      function initWriter(){
        const el=document.getElementById('writer-target');
        const ch=el.dataset.char;
        if(!window.HanziWriter){ fallbackChar(ch); return; }
        writer=HanziWriter.create('writer-target', ch, {
          width: 230, height: 230, padding: 18, showOutline: true, showCharacter: false,
          strokeAnimationSpeed: 0.575, delayBetweenStrokes: 360,
          charDataLoader: function(char, onComplete){ onComplete(embeddedCharData); }
        });
        window.lessonWriter = writer;
        setTimeout(()=>{ if(writer) writer.animateCharacter(); }, 500);
      }
      function playStroke(){ if(writer) writer.animateCharacter(); }
      initWriter();
    </script>
  </div><script src="assets/slide-base.js"></script></body></html>`);
}

await add('divider-culture', lesson01Divider({
  title: 'Bổ sung học tập',
  label: 'BỔ SUNG HỌC TẬP',
  zhTitle: '补充学习',
  desc: 'Lịch sự khi hỏi và một vài con số quen thuộc',
  icon: 'badge-plus',
  image: 'supplement.jpg',
  accent: '#EC4899',
}));

await add('culture-qingwen-vi', slide({
  title: '请问 · tiếng Việt', label: 'VĂN HÓA BỔ SUNG', icon: 'badge-plus',
  style: `.wrap{position:absolute;left:74px;right:74px;top:50%;transform:translateY(-50%);text-align:center}.title{font-size:30pt;font-weight:900;color:#1A3A5A;margin-bottom:28px}.quote{font-size:34pt;font-weight:900;line-height:1.35;color:#5AACAC}.sub{font-size:17pt;color:#4A6080;margin-top:26px}`,
  body: `<div class="wrap"><div class="title">Người Việt thường nói</div><div class="quote">“Bạn cho tôi hỏi...”<br>“Anh cho em hỏi...”</div><div class="sub">Đây là cách mở đầu rất quen thuộc trong tiếng Việt.</div></div>`,
}));

await add('culture-qingwen-zh', slide({
  title: '请问 · tiếng Trung', label: 'VĂN HÓA BỔ SUNG', icon: 'badge-plus',
  style: `${alignedCss}.wrap{position:absolute;left:74px;right:74px;top:50%;transform:translateY(-50%);text-align:center}.title{font-size:30pt;font-weight:900;color:#1A3A5A;margin-bottom:26px}.culture-align{max-width:760px;margin:0 auto}.culture-align .a-word{min-height:78px}.culture-align .a-pin{font-size:13.5pt}.culture-align .a-han,.culture-align .a-punct{font-size:42pt}.vi{font-size:18pt;color:#4A6080;margin-top:18px}`,
  body: `<div class="wrap"><div class="title">Tiếng Trung nói tự nhiên</div>${alignedText('请问，这是办公室吗？', 'qǐngwèn, zhè shì bàngōngshì ma?', 'culture-align')}<div class="vi">Xin hỏi, đây có phải là văn phòng không?</div></div>`,
}));

await add('culture-qingwen-mistake', slide({
  title: 'Lỗi thường gặp', label: 'VĂN HÓA BỔ SUNG', icon: 'badge-plus',
  style: `.wrap{position:absolute;left:70px;right:70px;top:50%;transform:translateY(-50%);text-align:center}.title{font-size:30pt;font-weight:900;color:#1A3A5A;margin-bottom:26px}.wrong{border-radius:24px;background:#fff;border:1px solid rgba(216,92,92,.24);box-shadow:0 10px 28px rgba(216,92,92,.10);padding:34px;text-align:center}.wrong .han{font-family:'Noto Sans SC';font-size:54pt;font-weight:900;color:#D85C5C}.caption{font-size:18pt;color:#4A6080;margin:22px auto 0;text-align:center;line-height:1.42;max-width:720px}`,
  body: `<div class="wrap"><div class="title">Lỗi thường gặp của người Việt khi nói</div><div class="wrong"><div class="han">你给我问</div></div><div class="caption">Đừng dịch từng chữ từ “cho tôi hỏi”. Câu này nghe không tự nhiên và dễ bị hiểu là thiếu lịch sự.</div></div>`,
}));

await add('culture-number-520', slide({
  title: '520', label: 'VĂN HÓA BỔ SUNG', icon: 'hash',
  style: `.wrap{position:absolute;left:68px;right:68px;top:78px;display:grid;grid-template-columns:1fr 330px;gap:34px;align-items:center}.big{font-size:88pt;font-weight:900;color:#5AACAC;line-height:1}.zh{font-family:'Noto Sans SC';font-size:42pt;font-weight:900;color:#1A3A5A;margin-top:16px}.vi{font-size:20pt;color:#4A6080;margin-top:12px}.image{height:250px;border-radius:24px;overflow:hidden;background:#F8FBFB;border:2px solid rgba(90,172,172,.16);box-shadow:0 12px 30px rgba(90,172,172,.14)}.image img{width:100%;height:100%;object-fit:cover}`,
  body: `<div class="wrap"><div><div class="big">520</div><div class="zh">我爱你</div><div class="vi">Hay được hiểu là “anh/em yêu bạn”.</div></div><div class="image"><img src="assets/culture-images/number-520.png" alt=""></div></div>`,
}));

await add('culture-number-666', slide({
  title: '666', label: 'VĂN HÓA BỔ SUNG', icon: 'hash',
  style: `.wrap{position:absolute;left:68px;right:68px;top:78px;display:grid;grid-template-columns:1fr 330px;gap:34px;align-items:center}.big{font-size:88pt;font-weight:900;color:#5AACAC;line-height:1}.zh{font-family:'Noto Sans SC';font-size:42pt;font-weight:900;color:#1A3A5A;margin-top:16px}.vi{font-size:20pt;color:#4A6080;margin-top:12px}.image{height:250px;border-radius:24px;overflow:hidden;background:#F8FBFB;border:2px solid rgba(90,172,172,.16);box-shadow:0 12px 30px rgba(90,172,172,.14)}.image img{width:100%;height:100%;object-fit:cover}`,
  body: `<div class="wrap"><div><div class="big">666</div><div class="zh">很厉害</div><div class="vi">Dùng để khen ai đó rất giỏi, rất “đỉnh”.</div></div><div class="image"><img src="assets/culture-images/number-666.png" alt=""></div></div>`,
}));

await add('divider-homework', lesson01Divider({
  title: 'Bài tập về nhà',
  label: 'BÀI TẬP VỀ NHÀ',
  zhTitle: '回家作业',
  desc: 'Làm bài trong sách',
  page: '83-84',
  icon: 'book-open-check',
  image: 'homework.jpg',
  accent: '#F59E0B',
}));

await add('exercises-list', slide({
  title: 'Bài tập trong sách',
  label: 'BÀI TẬP',
  icon: 'book-open-check',
  page: '83-84',
  style: `.exercise-title{position:absolute;left:0;right:0;top:74px;text-align:center;font-size:22pt;font-weight:800}.exercise-list{position:absolute;left:210px;top:124px;width:540px;display:flex;flex-direction:column;gap:9px}.item{display:flex;align-items:center;font-size:12.8pt;color:#4A6080}.num{width:24px;height:24px;background:#FDE8D0;color:#C07030;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;margin-right:12px;flex-shrink:0}.hanzi-mini{font-family:'Noto Sans SC';font-weight:900;color:#1A3A5A}`,
  body: `<div class="exercise-title">Bài tập trong sách</div><div class="exercise-list"><div class="item"><div class="num">1</div><div>Đọc nhận diện và luyện nói (Trang 83)</div></div><div class="item"><div class="num">2</div><div>Trả lời câu hỏi (Trang 83)</div></div><div class="item"><div class="num">3</div><div>Kể lại đoạn hội thoại (Trang 83)</div></div><div class="item"><div class="num">4</div><div>Tập viết chữ Hán: <span class="hanzi-mini">住、有、公、室、在、家、呢、知、道、电、话、号、手、机</span> (Trang 84)</div></div></div>`,
}));

await add('closing', `${head('Kết thúc')}<style>
${alignedCss}.closing{background:url('assets/reference/ending-page-background.png') center/cover no-repeat;display:flex;align-items:center;justify-content:center}.overlay{position:absolute;inset:0;background:rgba(255,255,255,.22)}.center{position:relative;z-index:1;text-align:center;background:rgba(255,255,255,.88);border-radius:28px;padding:34px 68px;box-shadow:0 10px 34px rgba(26,58,90,.16)}.end-title{font-size:62pt;line-height:1}.line{margin:16px auto}.spacer{height:10px}.next-label{font-size:12pt;color:#5F7088}.next-align{max-width:620px;margin-top:8px;gap:8px}.next-align .a-word{min-height:44px}.next-align .a-pin{font-size:8.5pt;margin-bottom:4px}.next-align .a-han,.next-align .a-punct{font-size:22pt}.page-indicator{color:#4A6080}
</style></head><body><div class="slide closing"><div class="overlay"></div><div class="center"><div class="hanzi end-title">下课</div><div class="line"></div><div class="spacer"></div><div class="next-label">Bài tiếp theo</div>${alignedText('第十一课 · 我们都是留学生', 'dìshíyī kè · wǒmen dōu shì liúxuéshēng', 'next-align')}</div></div><script src="assets/slide-base.js"></script></body></html>`);

const manifestArray = slides.map((file) => `  "${file}"`).join(',\n');
const lesson01Presenter = await fs.readFile(path.join(lesson01Root, 'slides/index.html'), 'utf8');
let presenter = lesson01Presenter
  .replace(/<title>.*?<\/title>/, '<title>Bài 10 · 他住哪儿</title>')
  .replace(/<div class="header"><h1>.*?<\/h1><div class="subtitle">.*?<\/div><\/div>/, `<div class="header"><h1>Bài 10 · 他住哪儿</h1><div class="subtitle">${slides.length} slides · Press <strong>F</strong> for presentation mode</div></div>`)
  .replace(/<div class="thumb-head"><div class="thumb-title">Mục lục<\/div><div class="thumb-total">\d+<\/div><\/div>/, `<div class="thumb-head"><div class="thumb-title">Mục lục</div><div class="thumb-total">${slides.length}</div></div>`)
  .replace(/<iframe id="slideFrame" src="[^"]+"><\/iframe>/, `<iframe id="slideFrame" src="${slides[0]}"></iframe>`)
  .replace(/<span class="counter" id="counter">[^<]+<\/span>/, `<span class="counter" id="counter">1 / ${slides.length}</span>`)
  .replace(/<p id="exportStatus">Rendering slide 1 \/ \d+<\/p>/, `<p id="exportStatus">Rendering slide 1 / ${slides.length}</p>`)
  .replace(/const MANIFEST = \[[\s\S]*?\];/, `const MANIFEST = [\n${manifestArray}\n];`)
  .replaceAll('/ 55', `/ ${slides.length}`)
  .replaceAll('slide 1 / 55', `slide 1 / ${slides.length}`)
  .replace(/pdf\.save\(['"][^'"]+['"]\);/, "pdf.save('lesson-10-teacher-deck.pdf');");
await fs.writeFile(path.join(slidesDir, 'index.html'), presenter, 'utf8');

await fs.writeFile(path.join(lessonRoot, 'index.html'), `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><meta http-equiv="refresh" content="0; url=slides/index.html"><title>Bài 10 · 他住哪儿</title><script>location.replace('slides/index.html');</script></head><body><p><a href="slides/index.html">Mở bài 10</a></p></body></html>`, 'utf8');

await fs.writeFile(path.join(slidesDir, 'README.md'), `# Bài 10 · 他住哪儿 · Slides\n\nOpen \`../index.html\` for classroom use. The presenter is copied from Lesson 01 and keeps fullscreen, thumbnails, annotations, and live PDF export.\n\nSlide count: ${slides.length}.\n\nVocabulary image prompts live at \`assets/vocab-images/prompts.json\`; current PNGs are local soft textbook placeholders and can be replaced by higher-quality generated images with the same filenames.\n\nDrafting rule: do not export a clean PDF until Adam confirms the design and content are finalized.\n`, 'utf8');

const teacherGuide = `# 教師手冊 · 第十课 他住哪儿 · Bài 10 Anh ấy sống ở đâu?\n\n> Tài liệu dành cho giảng viên. Không phát cho sinh viên.\n> Nguồn: Giáo trình Hán ngữ, trang 76-85.\n\n---\n\n## 壹、Mục tiêu học tập\n\nSau bài này, sinh viên có thể:\n1. Hỏi một người có ở đâu không: \`王老师在吗？\`.\n2. Hỏi người cần tìm: \`你找谁？\`.\n3. Nói nơi ở, số phòng và số điện thoại: \`他住十八楼一门，房间号是601。\`.\n4. Đọc và diễn lại hội thoại \`他住哪儿？\`.\n5. Viết các chữ Hán trọng tâm: 住、有、公、室、在、家、呢、知、道、电、话、号、手、机.\n\n---\n\n## 貳、Tiến trình đề xuất\n\n| Thời gian | Hoạt động | Cách dạy |\n|---|---|---|\n| 3 phút | Khởi động | Dùng câu \`你在哪儿？\`, sinh viên chọn 教室 / 家 / 公司 / 公园 và trả lời \`我在……\`. |\n| 16 phút | Từ vựng | Dạy theo nhóm nghĩa: văn phòng, tìm người, nơi ở, số phòng, điện thoại. Nhấn mạnh các sub-entry: 办公、电、话、手. |\n| 6 phút | Luyện từ vựng | Dùng slide ghép nối: ghép hàng chữ Hán, pinyin, hình ảnh. |\n| 10 phút | Ngữ pháp | Dạy trật tự câu bằng khối màu: ai / cái gì → làm gì / ở đâu → thông tin thêm. Tránh thuật ngữ nặng. |\n| 6 phút | Sửa câu sai | Sinh viên sửa câu sai: \`他家在呢。\` → \`他在家呢。\`; \`找你谁？\` → \`你找谁？\`. |\n| 10 phút | Hội thoại | Mỗi slide có 2 câu. Đọc mẫu, đổi vai, rồi cho sinh viên diễn lại theo cặp. |\n| 5 phút | Văn hóa | Dạy \`请问\` và so sánh với tiếng Việt “Bạn cho tôi hỏi...”. Nhắc không dịch thành \`你给我问\`. |\n| 7 phút | Tập viết | Luyện viết chữ trong ô: nhìn chữ, đọc pinyin, viết theo mẫu. |\n\n---\n\n## 參、Từ vựng trọng tâm\n\n| # | Chữ Hán | Pinyin | Loại từ | Nghĩa tiếng Việt | Trang |\n|---:|---|---|---|---|---|\n${vocab.map((item, index) => `| ${index + 1} | ${item.chinese_simplified} | ${item.pinyin} | ${item.word_type_vi || ''} | ${item.vietnamese} | ${item.source_page_range} |`).join('\n')}\n\nGhi chú: các từ tách dòng trong sách như 办公, 电, 话, 手 đã được đưa vào database và deck.\n\n---\n\n## 肆、Ngữ pháp\n\n### 1. 呢\n\nDạy bằng câu \`他在家呢。\` Chỉ cần nói với sinh viên: 呢 làm câu nghe tự nhiên hơn và nhấn mạnh “người đó đang ở nhà”. Không cần phân tích thuật ngữ sâu.\n\n### 2. Trật tự câu tiếng Hán\n\nCách giải thích cho sinh viên nhỏ tuổi:\n\n> Tiếng Hán giống như xếp thẻ. Đầu tiên đặt “ai / cái gì”, sau đó đặt “làm gì / ở đâu”, cuối cùng mới thêm thông tin nhỏ ở cuối câu.\n\nVí dụ:\n- \`他 在 家 呢。\`\n- \`我 找 王老师。\`\n- \`他 住 十八楼一门。\`\n\n### 3. Cách đọc số\n\nSố phòng, số điện thoại, mã số đọc từng chữ số. \`1\` trong số điện thoại thường đọc là \`yāo\` để nghe rõ.\n\n---\n\n## 伍、Văn hóa bổ sung\n\n### 请问\n\nTiếng Việt thường nói “Bạn cho tôi hỏi...” hoặc “Anh cho em hỏi...”. Khi nói tiếng Trung, không dịch từng chữ thành \`你给我问\`. Cách tự nhiên là đặt \`请问\` trước câu hỏi:\n\n- \`请问，这是办公室吗？\`\n- \`请问，王老师在吗？\`\n\n### Ý nghĩa con số\n\n- \`520\`: thường hiểu là \`我爱你\`.\n- \`666\`: khen ai đó rất giỏi, rất “đỉnh”.\n- Một số điện thoại thường dùng ở Trung Quốc: 114, 110, 119, 120.\n\n---\n\n## 陸、Bài tập về nhà\n\n1. Đọc lại hội thoại và ghi âm 1 lần.\n2. Ôn 20 từ vựng, đặc biệt các sub-entry: 办公、电、话、手.\n3. Viết 5 câu theo mẫu trật tự câu đã học.\n4. Tập viết 14 chữ Hán: 住、有、公、室、在、家、呢、知、道、电、话、号、手、机.\n`;
await fs.writeFile(path.join(teacherGuideDir, 'TEACHER_GUIDE.md'), teacherGuide, 'utf8');

const briefRows = slides.map((file, index) => `| ${String(index + 1).padStart(2, '0')} | \`${file}\` | ${file.replace(/^\d+-/, '').replace(/\.html$/, '').replace(/-/g, ' ')} | Lesson 01 Soft Classroom Presenter |`).join('\n');
const huashuBrief = `# Huashu Brief · 第十课 他住哪儿 · Bài 10 Anh ấy sống ở đâu?\n\n> Tài liệu tạo deck HTML cho Huashu Design.\n> Lesson type: regular\n> Final design: Soft Classroom Presenter, aligned with Lesson 01\n> Format: 960px x 540px, 16:9\n> Classroom file: \`output/book-1/lesson-10/index.html\`\n\n---\n\n## Final Direction\n\nUse Lesson 01 as the visual source of truth: light classroom deck, soft teal/lavender accents, frosted menu bar, large Simplified Chinese, Vietnamese classroom instructions, pinyin support, and no PPTX workflow.\n\n## Design Rules\n\n- Use \`slides/assets/slide-base.css\` and \`slide-base.js\` copied from Lesson 01.\n- Keep the top menu bar on teaching slides.\n- Show printed textbook page only in \`.page-indicator\`, for example \`Trang 76-77\`; omit it on generated classroom activity sections that do not appear directly in the textbook, especially \`Luyện tập tổng hợp\` and \`Văn hóa bổ sung\`.\n- Vocabulary slides follow Lesson 01 \`05-vocab-ni.html\`: 16:9 image frame, pinyin, large Chinese, Vietnamese meaning, Hán Việt and word type.\n- Dialogue slides follow Lesson 01: avatar on the left, speech card on the right, only two dialogue lines per slide.\n- Regular lessons do not include pinyin teaching modules.\n- For non-template concept slides, center the main content vertically and horizontally when possible.\n- Student-facing slides must not include teacher-only notes, internal labels, or source/tool explanations. Visible instructions, activity names, section titles, homework assignments, labels, and notes must be Vietnamese; Chinese is allowed only as target learning content. Check every HTML slide for text overflow inside the slide, background image panels, cards, bubbles, and tiles.\n\n## Slide Sequence\n\n| # | File | Purpose | Design notes |\n|---:|---|---|---|\n${briefRows}\n\n## Content Requirements Included\n\n- Warmup: \`你在哪儿？\` with 教室, 家, 公司, 公园.\n- Vocabulary: all 20 lesson vocabulary records, including sub-entries 办公、电、话、手.\n- Vocabulary practice: multiple 16:9 matching slides, about 4 words per slide, with three independently shuffled rows. Do not label the rows; leave the slide blank for presenter drawing.\n- Grammar: visual Chinese word-order explanation with blocks and plus icons.\n- Grammar practice: Vietnamese-labeled error correction.\n- Dialogue: two lines per slide, avatar + dialogue card.\n- Culture: \`请问\` Vietnamese comparison plus common number meanings \`520\`, \`666\`.\n- Hanzi writing: 住、有、公、室、在、家、呢、知、道、电、话、号、手、机.\n\n## Build Notes\n\n- Open \`output/book-1/lesson-10/index.html\` in class.\n- Presenter remains at \`output/book-1/lesson-10/slides/index.html\`.\n- Vocab PNG placeholders are in \`slides/assets/vocab-images/\`; prompts for higher-quality image replacement are in \`prompts.json\`.\n- During drafting, use HTML screenshots/contact sheets for QA. Do not export a PDF until Adam confirms the design and content are finalized.\n`;
const huashuBriefFinal = huashuBrief.replace(
  '- Vocabulary slides follow Lesson 01 `05-vocab-ni.html`: 16:9 image frame, pinyin, large Chinese, Vietnamese meaning, Hán Việt and word type.\n- Dialogue slides follow Lesson 01: avatar on the left, speech card on the right, only two dialogue lines per slide.',
  '- Vocabulary slides follow Lesson 01 `05-vocab-ni.html`: 16:9 image frame, pinyin, large Chinese, Vietnamese meaning, Hán Việt and word type.\n- Whenever Chinese and pinyin appear together, align each pinyin chunk directly above the matching Chinese character or word group. Do not use one separate centered pinyin sentence for Chinese sentences with punctuation.\n- Dialogue slides follow Lesson 01: avatar on the left, speech card on the right, only two dialogue lines per slide.',
);
await fs.writeFile(path.join(teacherGuideDir, 'HUASHU_BRIEF.md'), huashuBriefFinal, 'utf8');

await fs.writeFile(path.join(lessonRoot, 'README.md'), `# Lesson 10 · 第十课 他住哪儿\n\nClassroom entry point: \`index.html\`.\n\nFolders:\n- \`database/\`: reviewed lesson database from VP steps 1-8.\n- \`teacher-guide/\`: step 10 teacher guide and step 11 Huashu brief.\n- \`slides/\`: step 12 HTML teacher deck and presenter.\n- \`exports/final/\`: clean PDF backups.\n- \`exports/qa/\`: screenshots and visual QA.\n- \`exports/archive/\`: deprecated generated files.\n`, 'utf8');

console.log(JSON.stringify({
  lesson: 'lesson-10',
  teacher_guide: path.relative(root, path.join(teacherGuideDir, 'TEACHER_GUIDE.md')),
  huashu_brief: path.relative(root, path.join(teacherGuideDir, 'HUASHU_BRIEF.md')),
  slides: slides.length,
  presenter: path.relative(root, path.join(slidesDir, 'index.html')),
  classroom_entry: path.relative(root, path.join(lessonRoot, 'index.html')),
}, null, 2));
