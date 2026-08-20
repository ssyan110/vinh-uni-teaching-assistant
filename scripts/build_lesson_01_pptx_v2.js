const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const PptxGenJS = require('pptxgenjs');
const { toSimplified, toTeacherGuideChinese } = require('./simplify_chinese');

const projectRoot = path.resolve(__dirname, '..');
const sourcePath = path.join(projectRoot, 'work/boya-intermediate/extractions/structured-lesson-01.json');
const outlinePath = path.join(projectRoot, 'output/boya-intermediate/lesson-01/storyboard/lesson-01-ppt-outline-v2.md');
const legacyStoryboardPath = path.join(projectRoot, 'output/boya-intermediate/lesson-01/storyboard/lesson-01-ppt-storyboard.csv');
const assetDir = path.join(projectRoot, 'output/boya-intermediate/lesson-01/visual-prototype/assets');
const contactSheetPath = path.join(projectRoot, 'output/boya-intermediate/lesson-01/visual-storyboard/assets/lesson-01-textbook-contact-sheet-4x4.png');
const audioRoot = path.join(projectRoot, 'Giáo trình/博雅汉语听说-中级冲刺篇/音频/第01课');
const outputDir = path.join(projectRoot, 'output/boya-intermediate/lesson-01/pptx');
const pptxPath = path.join(outputDir, 'lesson-01.pptx');
const manifestPath = path.join(outputDir, 'manifest.json');
const audioManifestPath = path.join(outputDir, 'audio-manifest.json');

const FONT = process.env.LESSON_01_FONT || 'Microsoft YaHei';
const W = 13.333;
const H = 7.5;
const COLORS = {
  paper: 'F8FAFC',
  warm: 'FCFBF7',
  ink: '152033',
  slate: '65738A',
  blue: '316BDE',
  blueDark: '101B34',
  blueSoft: 'E6EEFC',
  coral: 'F26B59',
  coralSoft: 'FBE8E3',
  teal: '249B99',
  tealSoft: 'E2F2F0',
  gold: 'B8860B',
  goldSoft: 'F7EED1',
  line: 'CFD9E5',
  white: 'FFFFFF'
};

const sectionDividers = new Set([3, 16, 26, 37, 49, 59]);
const sectionQuestions = {
  3: '你的名字有什么意思？',
  16: '听过的句子，能不能换成你的话？',
  26: '你怎么说明一个名字？',
  37: '你能帮客户起一个中文名吗？',
  49: '你的姓氏有什么来历？',
  59: '你能把一个姓氏讲给同伴听吗？'
};
const sectionCells = {
  3: [4],
  16: [5, 6],
  26: [9, 10],
  37: [13],
  49: [1, 2],
  59: [14, 15, 16]
};
const imageMap = {
  1: [1],
  2: [5, 13, 16],
  4: [2, 3],
  5: [1],
  6: [1, 4],
  7: [5],
  8: [6],
  9: [7],
  10: [5, 6],
  11: [6, 8],
  12: [5],
  13: [7, 8],
  14: [4, 5],
  15: [3],
  17: [5, 6],
  18: [7, 8],
  19: [6],
  20: [7, 8],
  21: [12],
  22: [8],
  23: [12, 9],
  24: [7, 8],
  25: [15],
  27: [4],
  28: [5],
  29: [6],
  30: [7],
  31: [5, 12],
  32: [9, 10],
  33: [11],
  34: [9, 10],
  35: [12],
  36: [16],
  38: [13],
  39: [13],
  40: [13, 14],
  41: [13],
  42: [13, 16],
  43: [14],
  44: [16],
  45: [14],
  46: [16],
  47: [13, 16],
  48: [13],
  50: [2, 3],
  51: [5, 6],
  52: [7],
  53: [7, 8],
  54: [6],
  55: [8],
  56: [15],
  57: [7, 8],
  58: [2, 10],
  60: [14],
  61: [5],
  62: [6],
  63: [9, 10],
  64: [14],
  65: [10, 11],
  66: [12],
  67: [16],
  68: [7, 8],
  69: [16],
  70: [7],
  71: [16]
};

const sectionPeriod = {
  3: 'P1',
  16: 'P2',
  26: 'P3',
  37: 'P4',
  49: 'P5',
  59: 'P6'
};

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function simplify(value) {
  return toSimplified(String(value == null ? '' : value));
}

function clean(value) {
  return simplify(value).replace(/\s+/g, ' ').trim();
}

function parseCsv(csvText) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < csvText.length; i += 1) {
    const ch = csvText[i];
    const next = csvText[i + 1];
    if (ch === '"' && quoted && next === '"') {
      value += '"';
      i += 1;
      continue;
    }
    if (ch === '"') {
      quoted = !quoted;
      continue;
    }
    if (ch === ',' && !quoted) {
      row.push(value);
      value = '';
      continue;
    }
    if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && next === '\n') i += 1;
      row.push(value);
      value = '';
      if (row.some((item) => item !== '')) rows.push(row);
      row = [];
      continue;
    }
    value += ch;
  }
  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }
  const headers = rows.shift();
  return rows.map((values) => {
    const result = {};
    headers.forEach((header, index) => {
      result[header] = values[index] || '';
    });
    return result;
  });
}

function parseOutline(markdown) {
  return markdown.split(/\r?\n/).map((line) => {
    const parts = line.split('|').slice(1, -1).map((part) => clean(part));
    if (parts.length !== 5 || !/^\d{2}$/.test(parts[0])) return null;
    return {
      page: Number(parts[0]),
      title: parts[1],
      action: parts[2],
      refs: parts[3],
      visual: parts[4]
    };
  }).filter(Boolean);
}

function legacyPageFor(page) {
  if (page <= 2) return page;
  if (sectionDividers.has(page)) return null;
  if (page >= 4 && page <= 15) return page + 2;
  if (page >= 17 && page <= 25) return page + 2;
  if (page >= 27 && page <= 36) return page + 1;
  if (page >= 38 && page <= 48) return page;
  if (page >= 50 && page <= 58) return page - 1;
  if (page >= 60 && page <= 71) return page - 2;
  return null;
}

function periodFor(page) {
  if (page <= 2) return 'GLOBAL';
  if (page <= 15) return 'P1';
  if (page <= 25) return 'P2';
  if (page <= 36) return 'P3';
  if (page <= 48) return 'P4';
  if (page <= 58) return 'P5';
  return 'P6';
}

function cellPath(number) {
  return path.join(assetDir, 'textbook-cell-' + String(number).padStart(2, '0') + '.png');
}

function ensureInputs(outlineRows, legacyRows, source) {
  if (!fs.existsSync(contactSheetPath)) throw new Error('Missing approved contact sheet: ' + contactSheetPath);
  if (outlineRows.length !== 71) throw new Error('Expected 71 outline rows, found ' + outlineRows.length);
  if (legacyRows.length !== 69) throw new Error('Expected 69 legacy metadata rows, found ' + legacyRows.length);
  if (source.exercises.length !== 35) throw new Error('Expected 35 exercises, found ' + source.exercises.length);
  if (source.audio_map.length !== 11) throw new Error('Expected 11 audio tracks, found ' + source.audio_map.length);
  for (let i = 1; i <= 16; i += 1) {
    if (!fs.existsSync(cellPath(i))) throw new Error('Missing approved textbook cell ' + i);
  }
  source.audio_map.forEach((item) => {
    const audioPath = path.join(audioRoot, item.track_label + '.mp3');
    if (!fs.existsSync(audioPath)) throw new Error('Missing audio track: ' + audioPath);
  });
}

function pageMeta(page, outlineRow, legacyByPage) {
  const legacyPage = legacyPageFor(page);
  const legacy = legacyPage ? legacyByPage.get(legacyPage) : null;
  const tracks = legacy && legacy.audio_track
    ? legacy.audio_track.split(/\s*,\s*/).map((item) => clean(item)).filter(Boolean)
    : [];
  if (page === 4 && !tracks.includes('1-1')) tracks.unshift('1-1');
  return {
    page,
    period: periodFor(page),
    title: outlineRow.title,
    action: outlineRow.action,
    refs: legacy ? clean(legacy.source_refs) : '',
    time: legacy ? clean(legacy.time) : '—',
    grouping: legacy ? clean(legacy.grouping) : '全班',
    output: legacy ? clean(legacy.student_output) : '',
    support: legacy ? clean(legacy.support_asset) : '',
    note: legacy ? toTeacherGuideChinese(legacy.speaker_note_zh_tw || '') : '这一页先让学生理解本段任务，再进入活动。',
    tracks
  };
}

function addText(slide, value, x, y, w, h, options) {
  const opts = options || {};
  slide.addText(simplify(value), {
    x,
    y,
    w,
    h,
    fontFace: FONT,
    fontSize: 20,
    color: COLORS.ink,
    margin: 0,
    fit: 'shrink',
    valign: 'mid',
    lang: 'zh-CN',
    paraSpaceAfterPt: 0,
    ...opts
  });
}

function addRule(slide, x, y, w, color, pt) {
  slide.addShape('line', {
    x,
    y,
    w,
    h: 0,
    line: { color: color || COLORS.line, pt: pt || 1 }
  });
}

function addPill(slide, value, x, y, w, fill, color, h) {
  const height = h || 0.36;
  slide.addShape('roundRect', {
    x,
    y,
    w,
    h: height,
    rectRadius: 0.08,
    fill: { color: fill },
    line: { color: fill, transparency: 100 }
  });
  addText(slide, value, x + 0.06, y + 0.02, w - 0.12, height - 0.04, {
    fontSize: 11,
    color: color || COLORS.white,
    bold: true,
    align: 'center'
  });
}

function addHeader(slide, page, dark) {
  const secondary = dark ? 'B9C8E6' : COLORS.slate;
  const line = dark ? '3A4D78' : COLORS.line;
  addText(slide, '第一课', 0.78, 0.34, 1.5, 0.25, {
    fontSize: 13,
    color: secondary,
    bold: true,
    charSpacing: 1.2
  });
  addText(slide, String(page).padStart(2, '0'), 12.0, 0.34, 0.55, 0.25, {
    fontSize: 13,
    color: secondary,
    bold: true,
    align: 'right'
  });
  addRule(slide, 0.78, 0.8, 11.76, line);
}

function addImageFrame(slide, number, x, y, size) {
  slide.addShape('roundRect', {
    x,
    y,
    w: size,
    h: size,
    rectRadius: 0.08,
    fill: { color: COLORS.white },
    line: { color: COLORS.line, pt: 0.8 }
  });
  slide.addImage({ path: cellPath(number), x: x + 0.06, y: y + 0.06, w: size - 0.12, h: size - 0.12 });
}

function addImageGrid(slide, cells, dark) {
  const x = 8.0;
  const y = 1.28;
  const w = 4.65;
  const h = 5.23;
  slide.addShape('roundRect', {
    x,
    y,
    w,
    h,
    rectRadius: 0.14,
    fill: { color: dark ? '182744' : COLORS.white },
    line: { color: dark ? '3A4D78' : COLORS.line, pt: 0.9 }
  });
  const innerX = x + 0.27;
  const innerY = y + 0.35;
  const innerW = w - 0.54;
  const innerH = h - 0.7;
  const count = cells.length;
  if (count === 1) {
    const size = Math.min(innerW, innerH);
    addImageFrame(slide, cells[0], innerX + (innerW - size) / 2, innerY + (innerH - size) / 2, size);
  } else if (count === 2) {
    const size = Math.min((innerW - 0.2) / 2, innerH - 0.1);
    addImageFrame(slide, cells[0], innerX, innerY + (innerH - size) / 2, size);
    addImageFrame(slide, cells[1], innerX + size + 0.2, innerY + (innerH - size) / 2, size);
  } else if (count === 3) {
    const size = Math.min((innerW - 0.2) / 2, (innerH - 0.2) / 2);
    addImageFrame(slide, cells[0], innerX, innerY, size);
    addImageFrame(slide, cells[1], innerX + size + 0.2, innerY, size);
    addImageFrame(slide, cells[2], innerX + (innerW - size) / 2, innerY + size + 0.2, size);
  } else {
    const size = Math.min((innerW - 0.2) / 2, (innerH - 0.2) / 2);
    cells.slice(0, 4).forEach((number, index) => {
      addImageFrame(slide, number, innerX + (index % 2) * (size + 0.2), innerY + Math.floor(index / 2) * (size + 0.2), size);
    });
  }
}

function accentFor(period) {
  return ({ P1: COLORS.blue, P2: COLORS.coral, P3: COLORS.teal, P4: COLORS.blue, P5: COLORS.coral, P6: COLORS.gold })[period] || COLORS.blue;
}

function softFor(period) {
  return ({ P1: COLORS.blueSoft, P2: COLORS.coralSoft, P3: COLORS.tealSoft, P4: COLORS.blueSoft, P5: COLORS.coralSoft, P6: COLORS.goldSoft })[period] || COLORS.blueSoft;
}

function stepsFor(meta) {
  const page = meta.page;
  if (meta.tracks.length) return ['先听', '再答', '说依据'];
  if (page >= 38 && page <= 48) {
    if (page === 43) return ['选人物', '看音义', '提名字'];
    if (page === 45 || page === 46) return ['分资料', '做报告', '回答问题'];
    return ['问清楚', '想名字', '说理由'];
  }
  if (page >= 60 && page <= 71) {
    if (page === 61 || page === 62) return ['先听', '找答案', '说证据'];
    if (page === 64) return ['说结果', '提问题', '说明选择'];
    if (page === 66 || page === 67 || page === 68 || page === 69 || page === 70) return ['先看资料', '说给同伴', '回答问题'];
    return ['换一张卡', '说一个姓', '问一个问题'];
  }
  if (page >= 21 && page <= 25) {
    if (page === 22) return ['看句子', '改一改', '说语气'];
    if (page === 25) return ['听建议', '改一句', '再说一次'];
    return ['看情境', '选一句', '说理由'];
  }
  if (page >= 34 && page <= 36) return ['选两个例子', '说一分钟', '听同伴说'];
  return ['先自己想', '和同伴说', '换一个人'];
}

function cueFor(meta) {
  const cues = {
    4: '词语卡：选两个词，说一句话。',
    5: '意思 · 来历 · 读音',
    6: '问一个你想知道的问题。',
    7: '问题 1—3',
    8: '问题 4—6 · 一个关键词',
    9: '答案 → 听到的依据',
    10: '问题 1—2',
    11: '问题 3—5 · 一个理由',
    12: '回答 → 追问',
    13: '回答 → 追问理由',
    14: '采访者 · 回答者 · 观察者',
    15: '一个姓名理由 · 一个听力信息',
    17: '把句子换成你的信息',
    18: '换一个同伴，再说三句',
    19: '听 → 盖住 → 重建',
    20: '交换角色 · 再追问一句',
    21: '总不能……吧',
    22: '……才怪呢',
    23: '到时候',
    24: '话说回来',
    25: '第一次 → 建议 → 第二次',
    27: '主旨 · 细节 · 语气 · 证据',
    28: '问题 1—3',
    29: '问题 4—5',
    30: '判断 → 证据',
    31: '赞成还是不赞成？为什么？',
    32: '同音 · 愿望 · 误会',
    33: '找一句话，说明你的答案。',
    34: '例子 1 · 例子 2',
    35: '60 秒：例子＋说明',
    36: '我听懂了……\n我还想确认……',
    38: '问清楚要求 · 提出姓名 · 回答问题',
    39: '性别 · 字数 · 读音 · 字义 · 风格',
    40: '什么最重要？',
    41: '读音 · 字义 · 两个理由',
    42: '90 秒提案 · 一个追问',
    43: '两位演员 · 音 · 义',
    44: '名字 · 读音 · 意义 · 风格',
    45: '时代 · 地域 · 愿望',
    46: '2 分钟报告 · 一个问题',
    47: '原句 → 改句',
    48: '一个命名条件＋一个理由',
    50: '姓 · 名 · 常见原因',
    51: '主旨 · 两个细节',
    52: '回答 3—5 句话 · 追问',
    53: '把姓、名或称呼换成你的信息',
    54: '换一个同伴，再说三句',
    55: '听 → 盖住 → 重建',
    56: '听懂的一点 · 再说一句',
    57: '一个相同点或不同点',
    60: '每人带走一个要教的信息。',
    61: '关键词空格',
    62: '判断 → 证据',
    63: '问题 → 原因 → 结果',
    64: '不然 · 是……还是…… · 怎么……怎么……',
    65: '单姓 · 复姓 · 姓氏来源',
    66: '每人读一部分，再教给新组。',
    67: '大声读两个姓氏。',
    68: '解释俗语，再介绍一个姓。',
    69: '人物 · 姓 · 一句话介绍',
    70: '30 秒感受 · 一个问题',
    71: '现在我能……'
  };
  return cues[meta.page] || '';
}

function addSteps(slide, labels, accent) {
  const startX = 0.84;
  const gap = 2.05;
  labels.forEach((label, index) => {
    const x = startX + gap * index;
    const color = [accent, COLORS.coral, COLORS.teal][index];
    slide.addShape('ellipse', {
      x,
      y: 3.38,
      w: 0.38,
      h: 0.38,
      fill: { color },
      line: { color, transparency: 100 }
    });
    addText(slide, String(index + 1), x, 3.46, 0.38, 0.17, {
      fontSize: 11,
      color: COLORS.white,
      bold: true,
      align: 'center'
    });
    addText(slide, label, x + 0.52, 3.39, 1.34, 0.3, {
      fontSize: 17,
      color: COLORS.ink,
      bold: true
    });
  });
}

function addCue(slide, cue, accent, dark) {
  if (!cue) return;
  const fill = dark ? '1B2A49' : softFor(accent === COLORS.gold ? 'P6' : 'P1');
  const color = dark ? COLORS.white : COLORS.ink;
  slide.addShape('roundRect', {
    x: 0.8,
    y: 4.22,
    w: 6.55,
    h: 1.3,
    rectRadius: 0.1,
    fill: { color: fill },
    line: { color: dark ? '3A4D78' : COLORS.line, pt: 0.8 }
  });
  addText(slide, cue, 1.07, 4.52, 6.0, 0.72, {
    fontSize: cue.length > 30 ? 17 : 23,
    color,
    bold: true,
    breakLine: true
  });
}

function addFooter(slide, meta, audioState, dark) {
  const color = dark ? 'D9E3F5' : COLORS.slate;
  const fill = dark ? '1B2A49' : COLORS.white;
  const time = meta.time && meta.time !== '—' ? meta.time + ' 分钟' : '本部分开始';
  const group = meta.grouping || '全班';
  addPill(slide, time, 0.82, 6.77, 1.24, fill, color, 0.34);
  addPill(slide, group, 2.18, 6.77, Math.min(2.35, Math.max(1.18, group.length * 0.17 + 0.55)), fill, color, 0.34);
  if (meta.tracks.length) {
    const label = meta.tracks.length === 1 ? '音频 ' + meta.tracks[0] : '音频 ' + meta.tracks.join('、');
    slide.addShape('roundRect', {
      x: 9.98,
      y: 6.72,
      w: 2.68,
      h: 0.44,
      rectRadius: 0.08,
      fill: { color: dark ? '1B2A49' : COLORS.coral },
      line: { color: dark ? '3A4D78' : COLORS.coral, transparency: dark ? 0 : 100, pt: 0.8 }
    });
    addText(slide, label, 10.12, 6.82, 2.38, 0.19, {
      fontSize: 12,
      color: dark ? COLORS.white : COLORS.white,
      bold: true,
      align: 'center'
    });
    meta.tracks.forEach((track, index) => {
      const audioPath = path.join(audioRoot, track + '.mp3');
      if (!audioState.embedded.has(track)) {
        slide.addMedia({
          type: 'audio',
          path: audioPath,
          x: 10.08 + index * 0.3,
          y: 6.8,
          w: 0.18,
          h: 0.18,
          objectName: '音频 ' + track
        });
        audioState.embedded.add(track);
        audioState.firstEmbeddedSlide[track] = meta.page;
      }
      if (!audioState.usedSlides[track]) audioState.usedSlides[track] = [];
      audioState.usedSlides[track].push(meta.page);
    });
  }
}

function addNotes(slide, meta) {
  const note = meta.note || '先让学生完成任务，再根据实际表现做短修补。';
  const lines = [
    '教学提示：' + note,
    '课堂位置：' + meta.period + '；时间：' + meta.time + '分钟',
    '教材练习：' + (meta.refs || '无'),
    '音频：' + (meta.tracks.join('、') || '无'),
    '分组：' + (meta.grouping || '全班'),
    '学生产出：' + (meta.output || '完成本页口语任务'),
    '配套材料：' + (meta.support || '无')
  ];
  slide.addNotes(lines.join('\n'));
}

function addCover(slide, meta) {
  slide.background = { color: COLORS.warm };
  addHeader(slide, meta.page, false);
  addPill(slide, '第一课', 0.82, 1.18, 1.02, COLORS.blue);
  addText(slide, '你的名字\n有什么意思？', 0.82, 1.88, 6.0, 1.42, {
    fontSize: 39,
    bold: true,
    breakLine: true,
    valign: 'top'
  });
  addText(slide, '先看一看，再说一说。', 0.84, 3.58, 4.9, 0.36, {
    fontSize: 21,
    color: COLORS.slate,
    bold: true
  });
  addRule(slide, 0.84, 4.32, 3.45, COLORS.blue, 2);
  addText(slide, '姓  ·  名  ·  意思', 0.84, 4.62, 4.8, 0.35, {
    fontSize: 20,
    color: COLORS.blue,
    bold: true
  });
  addImageGrid(slide, [1], false);
}

function addGoals(slide, meta) {
  slide.background = { color: COLORS.paper };
  addHeader(slide, meta.page, false);
  addText(slide, '学完这课后，我能……', 0.82, 1.08, 7.2, 0.62, {
    fontSize: 34,
    bold: true
  });
  addText(slide, '用听和说完成四个任务。', 0.84, 1.82, 5.2, 0.34, {
    fontSize: 18,
    color: COLORS.slate
  });
  const goals = [
    '听懂姓名和姓氏的对话或短文，找出主要信息和细节。',
    '介绍自己的姓名和姓氏，说明意思、来历或原因。',
    '提问、回答、追问，并说明理由。',
    '根据要求提出一个中文名字，说明两个理由，并回答一个问题。'
  ];
  goals.forEach((goal, index) => {
    const y = 2.42 + index * 0.79;
    const color = [COLORS.blue, COLORS.coral, COLORS.teal, COLORS.gold][index];
    slide.addShape('roundRect', {
      x: 0.82,
      y,
      w: 6.45,
      h: 0.58,
      rectRadius: 0.08,
      fill: { color: COLORS.white },
      line: { color: COLORS.line, pt: 0.8 }
    });
    slide.addShape('ellipse', {
      x: 1.04,
      y: y + 0.15,
      w: 0.25,
      h: 0.25,
      fill: { color },
      line: { color, transparency: 100 }
    });
    addText(slide, goal, 1.48, y + 0.13, 5.55, 0.3, {
      fontSize: 16,
      color: COLORS.ink,
      bold: true
    });
  });
  addImageGrid(slide, [5, 13, 16], false);
}

function addDivider(slide, meta) {
  slide.background = { color: COLORS.blueDark };
  addHeader(slide, meta.page, true);
  addPill(slide, '这一部分', 0.82, 1.16, 1.28, COLORS.coral);
  addText(slide, meta.title, 0.82, 1.82, 6.45, 0.8, {
    fontSize: meta.title.length > 18 ? 27 : 33,
    color: COLORS.white,
    bold: true
  });
  addText(slide, sectionQuestions[meta.page], 0.84, 2.92, 6.2, 0.56, {
    fontSize: 22,
    color: 'C9D7F0',
    bold: true
  });
  addRule(slide, 0.84, 3.76, 4.0, COLORS.coral, 2);
  addText(slide, '现在先说一说。', 0.84, 4.12, 4.0, 0.36, {
    fontSize: 19,
    color: COLORS.white,
    bold: true
  });
  addImageGrid(slide, sectionCells[meta.page], true);
  addFooter(slide, meta, { embedded: new Set(), firstEmbeddedSlide: {}, usedSlides: {} }, true);
}

function addNormal(slide, meta, cells) {
  const accent = accentFor(meta.period);
  const dark = false;
  slide.background = { color: meta.period === 'P2' || meta.period === 'P5' ? COLORS.warm : COLORS.paper };
  addHeader(slide, meta.page, dark);
  addText(slide, meta.title, 0.82, 1.08, 6.7, 0.7, {
    fontSize: meta.title.length > 15 ? 27 : 34,
    bold: true
  });
  addText(slide, meta.action, 0.84, 1.91, 6.45, 0.78, {
    fontSize: meta.action.length > 55 ? 18 : 21,
    color: COLORS.slate,
    bold: true,
    breakLine: true
  });
  addSteps(slide, stepsFor(meta), accent);
  addCue(slide, cueFor(meta), accent, false);
  addImageGrid(slide, cells, false);
}

function addFinal(slide, meta) {
  slide.background = { color: COLORS.warm };
  addHeader(slide, meta.page, false);
  addPill(slide, '课末', 0.82, 1.14, 0.92, COLORS.teal);
  addText(slide, '现在我能……', 0.82, 1.84, 5.8, 0.7, {
    fontSize: 38,
    bold: true
  });
  addText(slide, '说一句自己现在会做的事。', 0.84, 2.75, 5.6, 0.4, {
    fontSize: 21,
    color: COLORS.slate,
    bold: true
  });
  const checks = ['我能听懂主要信息。', '我能问、答、追问。', '我能说明姓名的理由。'];
  checks.forEach((item, index) => {
    const y = 3.5 + index * 0.67;
    const color = [COLORS.blue, COLORS.coral, COLORS.teal][index];
    slide.addShape('roundRect', {
      x: 0.84,
      y,
      w: 5.72,
      h: 0.48,
      rectRadius: 0.08,
      fill: { color: COLORS.white },
      line: { color: COLORS.line, pt: 0.8 }
    });
    addText(slide, '□  ' + item, 1.12, y + 0.1, 5.1, 0.25, {
      fontSize: 18,
      color,
      bold: true
    });
  });
  addText(slide, '说一句：“现在我能……”', 0.84, 5.72, 5.3, 0.36, {
    fontSize: 20,
    color: COLORS.teal,
    bold: true
  });
  addImageGrid(slide, [16], false);
}

function buildManifest(source, outlineRows, audioState, exerciseSlideMap) {
  const audioTracks = source.audio_map.map((item) => {
    const audioPath = path.join(audioRoot, item.track_label + '.mp3');
    return {
      track: item.track_label,
      source_file: path.relative(projectRoot, audioPath),
      sha256: sha256(audioPath),
      referenced_slides: audioState.usedSlides[item.track_label] || [],
      first_embedded_slide: audioState.firstEmbeddedSlide[item.track_label] || null,
      embedded_in_pptx: Boolean(audioState.firstEmbeddedSlide[item.track_label])
    };
  });
  const manifest = {
    package: 'boya-intermediate-lesson-01-native-pptx-v2',
    generated_at: new Date().toISOString(),
    status: 'ready_for_pptx_qa',
    format: 'native-editable-pptx',
    html_required: false,
    slide_count: outlineRows.length,
    period_count: 6,
    minutes_per_period: 50,
    total_minutes: 300,
    section_dividers: Array.from(sectionDividers),
    exercise_count: source.exercises.length,
    exercise_coverage_count: Object.keys(exerciseSlideMap).length,
    audio_track_count: source.audio_map.length,
    audio_embedded_count: audioTracks.filter((item) => item.embedded_in_pptx).length,
    speaker_notes_count: outlineRows.length,
    language: '简体中文',
    font_family: FONT,
    student_language_policy: '学生端投影使用简体中文；学生画面只显示当前课堂动作。',
    visible_completion_labels: 0,
    visible_internal_labels: [],
    visual_style: 'approved educational textbook line-art contact sheet; grey-blue outlines; muted pastel fills; pale background',
    source_of_truth: 'output/boya-intermediate/lesson-01/teacher/lesson-01-teacher-guide.md',
    input_outline: path.relative(projectRoot, outlinePath),
    visual_storyboard: 'output/boya-intermediate/lesson-01/visual-storyboard/lesson-01-visual-storyboard-v2.md',
    approved_contact_sheet: path.relative(projectRoot, contactSheetPath),
    approved_prototype: 'output/boya-intermediate/lesson-01/visual-prototype/lesson-01-visual-prototype.pptx',
    audio_manifest: path.relative(projectRoot, audioManifestPath),
    exercise_slide_map: exerciseSlideMap,
    pptx_sha256: sha256(pptxPath),
    output_files: ['lesson-01.pptx', 'audio-manifest.json', 'manifest.json']
  };
  fs.writeFileSync(audioManifestPath, JSON.stringify({
    policy: '每段音频在第一次出现的页面嵌入；后续页面保留音频编号。',
    tracks: audioTracks
  }, null, 2) + '\n');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  const outlineRows = parseOutline(fs.readFileSync(outlinePath, 'utf8'));
  const legacyRows = parseCsv(fs.readFileSync(legacyStoryboardPath, 'utf8'))
    .map((row) => ({ ...row, slide_no: Number(row.slide_no) }));
  const legacyByPage = new Map(legacyRows.map((row) => [row.slide_no, row]));
  ensureInputs(outlineRows, legacyRows, source);

  const metas = outlineRows.map((row) => pageMeta(row.page, row, legacyByPage));
  const exerciseSlideMap = {};
  metas.forEach((meta) => {
    meta.refs.split('|').filter((ref) => /^E01-\d{3}$/.test(ref)).forEach((ref) => {
      if (!exerciseSlideMap[ref]) exerciseSlideMap[ref] = [];
      exerciseSlideMap[ref].push(meta.page);
    });
  });
  const expectedExercises = source.exercises.map((item) => item.record_id);
  const missingExercises = expectedExercises.filter((id) => !exerciseSlideMap[id]);
  if (missingExercises.length) throw new Error('Missing exercise coverage: ' + missingExercises.join(', '));

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = '荣市大学华语听说课程';
  pptx.company = '荣市大学';
  pptx.subject = '第一课：中国人的姓名';
  pptx.title = '第一课：中国人的姓名';
  pptx.lang = 'zh-CN';
  pptx.theme = { headFontFace: FONT, bodyFontFace: FONT, lang: 'zh-CN' };

  const audioState = {
    embedded: new Set(),
    firstEmbeddedSlide: {},
    usedSlides: {}
  };

  metas.forEach((meta) => {
    const slide = pptx.addSlide();
    if (meta.page === 1) {
      addCover(slide, meta);
    } else if (meta.page === 2) {
      addGoals(slide, meta);
    } else if (sectionDividers.has(meta.page)) {
      addDivider(slide, meta);
    } else if (meta.page === 71) {
      addFinal(slide, meta);
    } else {
      addNormal(slide, meta, imageMap[meta.page] || [1]);
    }
    if (!sectionDividers.has(meta.page) && meta.page !== 1 && meta.page !== 2 && meta.page !== 71) {
      addFooter(slide, meta, audioState, false);
    } else if (meta.page === 71) {
      addFooter(slide, meta, audioState, false);
    }
    addNotes(slide, meta);
  });

  await pptx.writeFile({ fileName: pptxPath });
  const manifest = buildManifest(source, outlineRows, audioState, exerciseSlideMap);
  console.log(JSON.stringify({
    pptx: pptxPath,
    slide_count: manifest.slide_count,
    section_dividers: manifest.section_dividers,
    exercise_coverage: manifest.exercise_coverage_count + '/' + manifest.exercise_count,
    audio_embedded: manifest.audio_embedded_count + '/' + manifest.audio_track_count,
    speaker_notes: manifest.speaker_notes_count,
    sha256: manifest.pptx_sha256
  }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
