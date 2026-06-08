const esc = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

export function pinyinExerciseCss() {
  return `
.tone-family{position:absolute;left:78px;right:78px;top:86px;bottom:48px}.tone-family-title{font-size:38px;line-height:1.1;font-weight:900;color:#1A3A5A;margin-bottom:22px;text-align:center}.tone-family-title.left{text-align:left}.tone-family-board{display:grid;gap:14px}.tone-family-row{display:grid;grid-template-columns:74px repeat(4,1fr);gap:12px;align-items:center}.tone-family-base{height:72px;border-radius:18px;background:#E8F4F4;color:#5AACAC;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900}.tone-family-token{height:72px;border-radius:18px;background:#fff;border:1px solid rgba(90,172,172,.18);box-shadow:0 8px 22px rgba(90,172,172,.09);display:flex;align-items:center;justify-content:center;font-size:37px;font-weight:900;color:#1A3A5A}.tone-family-row:nth-child(2) .tone-family-token{background:#F8FBFB}.tone-family-row:nth-child(3) .tone-family-token{background:#F7F4FC}.tone-family-row:nth-child(4) .tone-family-token{background:#FFF8E8}
.tone-match-title{font-size:26px;font-weight:900;color:#1A3A5A;line-height:1.14;margin-bottom:12px}.tone-match-board{position:relative;display:grid;grid-template-columns:270px 1fr 270px;gap:32px;align-items:start;margin-top:8px}.tone-match-col{display:grid;gap:10px}.tone-match-card{height:52px;border-radius:15px;background:#fff;border:2px solid #B8EDF8;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 15px rgba(90,172,172,.08);padding:4px 10px;text-align:center;box-sizing:border-box}.tone-match-card .pin{display:flex;align-items:center;justify-content:center;gap:14px;font-size:23px;font-weight:900;color:#294778;line-height:1}.tone-match-card .match-han{font-family:'Noto Sans SC';font-size:27px;font-weight:900}.tone-label{height:52px;border-radius:15px;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#1A3A5A;box-shadow:0 6px 15px rgba(90,172,172,.07);padding:4px 10px;text-align:center;box-sizing:border-box}.tone-label:nth-child(1){background:#E8F4F4;color:#387E86}.tone-label:nth-child(2){background:#FFF4D8;color:#A66F12}.tone-label:nth-child(3){background:#F3F0FA;color:#6E58B8}.tone-label:nth-child(4){background:#FCEFF3;color:#C84B63}.tone-label:nth-child(5){background:#EEF3FA;color:#5F7088}.tone-label:nth-child(6){background:#E8F4F4;color:#387E86}.tone-label:nth-child(7){background:#FFF4D8;color:#A66F12}.tone-label:nth-child(8){background:#F3F0FA;color:#6E58B8}.tone-match-space{height:340px;border-radius:22px;background:rgba(90,172,172,.045);border:1px dashed rgba(90,172,172,.22)}.tone-match-board.compact .tone-match-col{gap:7px}.tone-match-board.compact .tone-match-card,.tone-match-board.compact .tone-label{height:46px}.tone-match-board.compact .tone-match-card .pin{font-size:21px}.tone-match-board.compact .tone-match-card .match-han{font-size:25px}.tone-match-board.compact .tone-label{font-size:18px}.tone-match-board.compact .tone-match-space{height:326px}.tone-match-board.dense .tone-match-col{gap:5px}.tone-match-board.dense .tone-match-card,.tone-match-board.dense .tone-label{height:34px;border-radius:12px}.tone-match-board.dense .tone-match-card .pin{font-size:18px}.tone-match-board.dense .tone-match-card .match-han{font-size:22px}.tone-match-board.dense .tone-label{font-size:16px}.tone-match-board.dense .tone-match-space{height:306px}
.image-match-wrap{position:absolute;left:58px;right:58px;top:72px;bottom:42px}.image-match-title{font-size:29px;font-weight:900;color:#1A3A5A;line-height:1.16;text-align:center;margin-bottom:18px}.image-match-board{display:grid;grid-template-rows:102px 176px;gap:48px}.image-match-row{display:grid;gap:14px}.image-match-row.cols-3{grid-template-columns:repeat(3,1fr)}.image-match-row.cols-4{grid-template-columns:repeat(4,1fr)}.image-match-row.cols-5{grid-template-columns:repeat(5,1fr)}.image-match-row.cols-6{grid-template-columns:repeat(6,1fr)}.image-word-tile,.image-tile{border-radius:18px;background:#fff;border:1px solid rgba(90,172,172,.18);box-shadow:0 8px 22px rgba(90,172,172,.11);display:flex;align-items:center;justify-content:center;text-align:center;box-sizing:border-box;overflow:hidden}.image-word-tile{height:102px;flex-direction:column;padding:10px 8px}.image-word-tile .pin{font-size:21px;font-weight:900;color:#5AACAC;line-height:1.08;margin-bottom:7px}.image-word-tile .han{font-family:'Noto Sans SC';font-size:34px;font-weight:900;color:#1A3A5A;line-height:1}.image-match-row.cols-6 .image-word-tile .pin{font-size:18px}.image-match-row.cols-6 .image-word-tile .han{font-size:30px}.image-tile{height:176px;background:#F6FBFB;padding:0}.image-tile img{width:100%;height:100%;object-fit:cover}.image-match-row.cols-6 .image-tile{height:160px}.image-match-part{position:absolute;right:0;top:4px;font-size:12px;font-weight:900;color:#5AACAC;background:#E8F4F4;border-radius:999px;padding:7px 14px}
.tone-choice-wrap{position:absolute;left:58px;right:58px;top:74px;bottom:42px}.tone-choice-title{font-size:36px;line-height:1.1;font-weight:900;color:#1A3A5A;margin:0 0 8px}.tone-choice-desc{font-size:19px;line-height:1.35;font-weight:800;color:#5F7088;margin:0 0 18px}.tone-choice-table{width:850px;border-collapse:collapse;table-layout:fixed;background:#F4F8FD;box-shadow:0 10px 28px rgba(26,58,90,.10)}.tone-choice-table tr:nth-child(odd) td{background:#D9E4F2}.tone-choice-table tr:nth-child(even) td{background:#EEF3FA}.tone-choice-table td{height:52px;border:1px solid rgba(255,255,255,.34);font-size:28px;font-weight:900;color:#294778;vertical-align:middle}.tone-choice-table .qno{width:66px;background:transparent!important;text-align:center}.tone-choice-num{width:38px;height:38px;border-radius:999px;background:#5AACAC;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:23px;box-shadow:0 5px 12px rgba(90,172,172,.24)}.tone-choice-table .opt{padding-left:20px}.tone-choice-table .letter{font-weight:900;margin-right:10px}
.listen-head{display:flex;align-items:center;justify-content:center;margin-bottom:16px;text-align:center}.listen-title{font-size:34px;font-weight:900;color:#1A3A5A;line-height:1.14}.final-bank{width:760px;margin:10px auto 22px;background:rgba(255,255,255,.86);border:1px solid rgba(90,172,172,.16);border-radius:16px;text-align:center;padding:10px 18px;box-shadow:0 6px 20px rgba(90,172,172,.08)}.final-bank-title{font-size:18px;color:#5F7088;font-weight:800;margin-bottom:6px}.finals{display:flex;justify-content:space-around;font-size:25px;font-weight:900;color:#3B7DB4}.listen-grid{width:760px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);column-gap:58px;row-gap:24px}.listen-item{font-size:28px;color:#202530;line-height:1.1;white-space:nowrap}.listen-no{font-size:26px;margin-right:8px;color:#202530}.blank{display:inline-block;width:52px;border-bottom:3px solid #202530;transform:translateY(-3px);margin:0 4px}.blank.short{width:44px}.initial-cue{display:inline-block;min-width:48px;text-align:center;font-weight:900;color:#1A3A5A;margin-right:4px}.answer-red{color:#F05A62;font-weight:950}.tone-cued{position:relative;display:inline-block;line-height:1;margin:0 1px;padding-top:12px;vertical-align:baseline}.tone-cue{position:absolute;top:0;left:50%;transform:translateX(-50%);font-size:12px;line-height:1;color:#8A9AB0;font-weight:900;white-space:nowrap}.tone-letter{line-height:1}
`;
}

export function chunkItems(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

function stableHash(value = '') {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed) {
  let state = stableHash(seed) || 0x9E3779B9;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function randomizeMatchingAnswers(pairs, seed = '') {
  if (pairs.length < 2) return pairs;
  const order = pairs.map((pair, index) => ({ pair, index }));
  const random = seededRandom(seed || pairs.map((pair) => pair.right || pair.rightHtml || '').join('|'));
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  if (order.some((entry, index) => entry.index === index)) {
    const offset = (stableHash(`${seed}|offset`) % (pairs.length - 1)) + 1;
    return pairs.map((_, index) => pairs[(index + offset) % pairs.length]);
  }
  return order.map((entry) => entry.pair);
}

export function renderReadingDrillBoard({ title, rows, rowLabels = [], titleAlign = 'center' }) {
  const titleClass = titleAlign === 'left' ? ' left' : '';
  return `<div class="tone-family"><div class="tone-family-title${titleClass}">${esc(title)}</div><div class="tone-family-board">${rows.map((row, i) => `<div class="tone-family-row"><div class="tone-family-base">${esc(rowLabels[i] || '')}</div>${row.map((item) => `<div class="tone-family-token pinyin">${esc(item)}</div>`).join('')}</div>`).join('')}</div></div>`;
}

export function renderMatchingBoard({ instruction, leftTitle, rightTitle, pairs, randomizeRight = true }) {
  const left = pairs.map((pair) => `<div class="tone-match-card"><span class="pin">${pair.leftHtml || esc(pair.left)}</span></div>`).join('');
  const rightPairs = randomizeRight ? randomizeMatchingAnswers(pairs, `${instruction}|${leftTitle}|${rightTitle}`) : pairs;
  const right = rightPairs.map((pair) => `<div class="tone-label">${pair.rightHtml || esc(pair.right)}</div>`).join('');
  const density = pairs.length > 6 ? ' dense' : pairs.length > 5 ? ' compact' : '';
  return `<div class="content" style="top:92px;bottom:48px"><div class="tone-match-title">${esc(instruction)}</div><div class="tone-match-board${density}"><div><div class="badge">${esc(leftTitle)}</div><div class="tone-match-col" style="margin-top:8px">${left}</div></div><div class="tone-match-space"></div><div><div class="badge badge-amber">${esc(rightTitle)}</div><div class="tone-match-col" style="margin-top:8px">${right}</div></div></div></div>`;
}

export function renderImageMatchingBoard({ instruction, pairs, randomizeImages = true, partLabel = '' }) {
  const count = Math.min(Math.max(pairs.length, 3), 6);
  const colClass = `cols-${count}`;
  const images = randomizeImages ? randomizeMatchingAnswers(pairs, `${instruction}|images`) : pairs;
  const words = pairs.map((pair) => `<div class="image-word-tile"><div class="pin">${esc(pair.pinyin)}</div><div class="han">${esc(pair.hanzi)}</div></div>`).join('');
  const imageTiles = images.map((pair) => `<div class="image-tile"><img src="${esc(pair.image)}" alt="${esc(pair.hanzi)}"></div>`).join('');
  return `<div class="image-match-wrap">${partLabel ? `<div class="image-match-part">${esc(partLabel)}</div>` : ''}<div class="image-match-title">${esc(instruction)}</div><div class="image-match-board"><div class="image-match-row ${colClass}">${words}</div><div class="image-match-row ${colClass}">${imageTiles}</div></div></div>`;
}

export function renderMultipleChoiceTable({ title, instruction, rows }) {
  const bodyRows = rows.map((row, i) => `<tr><td class="qno"><span class="tone-choice-num">${i + 1}</span></td>${row.map((item, j) => `<td class="opt"><span class="letter">${String.fromCharCode(65 + j)}.</span>${esc(item)}</td>`).join('')}</tr>`).join('');
  return `<div class="tone-choice-wrap"><div class="tone-choice-title">${esc(title)}</div><p class="tone-choice-desc">${esc(instruction)}</p><table class="tone-choice-table"><tbody>${bodyRows}</tbody></table></div>`;
}

function renderToneCuedFinal(value = '') {
  const vowels = new Set('aeiouüāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ');
  return String(value).split('').map((char) => {
    if (!vowels.has(char.toLowerCase())) return esc(char);
    return `<span class="tone-cued"><span class="tone-cue">( )</span><span class="tone-letter">${esc(char)}</span></span>`;
  }).join('');
}

export function renderFillBlankBoard({ title, bankTitle, bankItems, prompts }) {
  const renderedPrompts = prompts.map((prompt, i) => {
    const body = prompt.mode === 'initial'
      ? `${prompt.reveal ? `<span class="answer-red">${esc(prompt.initial)}</span>` : `<span class="blank${prompt.short ? ' short' : ''}"></span>`}${renderToneCuedFinal(prompt.finalPart || '')}`
      : `${esc(prompt.initial)}<span class="blank${prompt.short ? ' short' : ''}"></span>`;
    return `<div class="listen-item"><span class="listen-no">${i + 1}.</span>${body}</div>`;
  }).join('');
  return `<div class="content"><div class="listen-head"><div class="listen-title">${esc(title)}</div></div><div class="final-bank"><div class="final-bank-title">${esc(bankTitle)}</div><div class="finals">${bankItems.map((item) => `<span>${esc(item)}</span>`).join('')}</div></div><div class="listen-grid">${renderedPrompts}</div></div>`;
}
