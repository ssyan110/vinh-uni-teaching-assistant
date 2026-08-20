const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const projectRoot = path.resolve(__dirname, '..');
const sourceRelative = 'work/boya-intermediate/extractions/structured-lesson-01.json';
const pdfRelative = 'Giáo trình/博雅汉语听说-中级冲刺篇/博雅汉语听说-中级冲刺篇I.pdf';
const outputRelative = 'output/boya-intermediate/lesson-01/source-review';
const sourcePath = path.join(projectRoot, sourceRelative);
const outputDir = path.join(projectRoot, outputRelative);
const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

fs.mkdirSync(outputDir, { recursive: true });

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function textWithBreaks(value) {
  return escapeHtml(value).replace(/\n/g, '<br>');
}

function pre(value) {
  return `<pre>${escapeHtml(value)}</pre>`;
}

function pages(record) {
  if (record.source_pdf_page_range) {
    const { start, end } = record.source_pdf_page_range;
    return start === end ? `PDF p.${start}` : `PDF pp.${start}–${end}`;
  }
  if (record.source_pdf_pages?.length) return `PDF pp.${record.source_pdf_pages.join(', ')}`;
  return '—';
}

function printedPages(record) {
  if (record.textbook_printed_page) return `教材 p.${record.textbook_printed_page}`;
  if (record.textbook_printed_pages?.length) return `教材 pp.${record.textbook_printed_pages.join(', ')}`;
  return '—';
}

function audioLabels(record) {
  const ids = record.audio_asset_ids || [];
  if (!ids.length) return '—';
  return ids.map((id) => {
    const match = source.audio_map.find((item) => item.related_section_id && id.endsWith(item.related_section_id));
    return id;
  }).join(', ');
}

function audioIdsForSection(sectionId) {
  return source.audio_map
    .filter((item) => item.related_section_id === sectionId)
    .map((item) => item.track_label);
}

function hrefToProject(relativeTarget) {
  const target = path.resolve(projectRoot, relativeTarget);
  const rel = path.relative(outputDir, target).split(path.sep);
  return rel.map((segment) => segment === '..' || segment === '.' ? segment : encodeURIComponent(segment)).join('/');
}

function sha256File(relativeTarget) {
  const target = path.resolve(projectRoot, relativeTarget);
  if (!fs.existsSync(target)) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex');
}

function statusPill(status) {
  const labels = {
    verified: '已核對',
    pending_review: '待教師確認',
    not_provided_in_source: '教材未提供答案',
    source_content_verified: '來源內容已核對'
  };
  const tone = status === 'verified' || status === 'source_content_verified' ? 'ok' : status === 'not_provided_in_source' ? 'warn' : 'pending';
  return `<span class="status ${tone}">${escapeHtml(labels[status] || status || '未標記')}</span>`;
}

function renderSectionTree() {
  const byParent = new Map();
  for (const section of source.sections) {
    const key = section.parent_section_id || '__root__';
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(section);
  }
  function render(parentId) {
    const children = byParent.get(parentId) || [];
    if (!children.length) return '';
    return `<ul>${children.map((section) => {
      const audio = section.audio_asset_ids?.length ? section.audio_asset_ids.join(', ') : audioIdsForSection(section.section_id).join(', ');
      return `<li>
        <div class="tree-row">
          <span class="tree-id">${escapeHtml(section.section_id)}</span>
          <strong>${escapeHtml(section.section_label_raw)}</strong>
          <span class="tree-type">${escapeHtml(section.section_type)}</span>
          <span class="tree-ref">${escapeHtml(pages(section))}${audio ? ` · ${escapeHtml(audio)}` : ''}</span>
          ${statusPill(section.review_status)}
        </div>
        ${render(section.section_id)}
      </li>`;
    }).join('')}</ul>`;
  }
  return render('__root__');
}

function renderVocabulary() {
  return source.vocabulary.map((item, index) => `<tr>
    <td>${index + 1}</td>
    <td><strong>${escapeHtml(item.chinese_simplified)}</strong>${item.marked ? ' <span class="asterisk">教材標記*</span>' : ''}</td>
    <td>${escapeHtml(item.pinyin)}</td>
    <td>${escapeHtml(printedPages(item))}</td>
    <td>${escapeHtml(pages(item))}</td>
    <td>${statusPill(item.review_status)}</td>
  </tr>`).join('');
}

function renderGrammar() {
  return source.grammar_patterns.map((item, index) => `<tr>
    <td>${index + 1}</td>
    <td><strong>${escapeHtml(item.normalized_text)}</strong></td>
    <td>${textWithBreaks(item.raw_source_text)}</td>
    <td>${escapeHtml(printedPages(item))}<br>${escapeHtml(pages(item))}</td>
    <td>${statusPill(item.review_status)}</td>
  </tr>`).join('');
}

function renderTexts() {
  return source.texts_dialogues.map((item) => `<details class="source-detail">
    <summary>
      <span><b>${escapeHtml(item.record_id)}</b> · ${escapeHtml(item.text_type)} · ${escapeHtml(printedPages(item))}</span>
      ${statusPill(item.review_status)}
    </summary>
    <div class="detail-body">
      <div class="meta-line">${escapeHtml(pages(item))} · section ${escapeHtml(item.section_id)}</div>
      ${pre(item.raw_source_text)}
      ${item.glossary?.length ? `<h4>教材附註詞語</h4><ul class="glossary">${item.glossary.map((entry) => `<li>${escapeHtml(entry)}</li>`).join('')}</ul>` : ''}
    </div>
  </details>`).join('');
}

function renderOptions(options) {
  if (!options) return '';
  if (Array.isArray(options)) {
    if (!options.length) return '';
    if (options.every((item) => typeof item === 'string')) {
      return `<div class="options"><ul>${options.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>`;
    }
    if (options.every((item) => item && Array.isArray(item.options))) {
      return `<div class="options"><ol>${options.map((group) => `<li><ul>${group.options.map((option) => `<li>${escapeHtml(option)}</li>`).join('')}</ul></li>`).join('')}</ol></div>`;
    }
    return `<div class="options">${pre(JSON.stringify(options, null, 2))}</div>`;
  }
  if (typeof options === 'object') {
    return `<div class="options"><h4>教材附加資料</h4>${Object.entries(options).map(([key, value]) => {
      if (Array.isArray(value)) return `<p><strong>${escapeHtml(key)}</strong></p><ul>${value.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
      return `<p><strong>${escapeHtml(key)}：</strong>${escapeHtml(value)}</p>`;
    }).join('')}</div>`;
  }
  return `<div class="options">${escapeHtml(options)}</div>`;
}

function optionSearchText(options) {
  if (!options) return '';
  return typeof options === 'string' ? options : JSON.stringify(options);
}

function renderExercises() {
  return source.exercises.map((item) => {
    const search = [item.record_id, item.exercise_type, item.prompt_raw, optionSearchText(item.options_raw)].join(' ');
    return `<details class="source-detail exercise" data-search="${escapeHtml(search.toLowerCase())}">
      <summary>
        <span><b>${escapeHtml(item.record_id)}</b> · ${escapeHtml(item.exercise_type)} · ${escapeHtml(printedPages(item))}</span>
        <span class="summary-right">${item.audio_asset_ids?.length ? escapeHtml(item.audio_asset_ids.join(', ')) : '無音檔'} ${statusPill(item.answer_status || item.review_status)}</span>
      </summary>
      <div class="detail-body">
        <div class="meta-line">${escapeHtml(pages(item))} · section ${escapeHtml(item.section_id)} · exercise order ${escapeHtml(item.exercise_order)}</div>
        ${pre(item.prompt_raw)}
        ${renderOptions(item.options_raw)}
        <div class="answer-note">答案狀態：${statusPill(item.answer_status || 'pending_review')}。本審核包不補寫教材沒有提供的答案。</div>
      </div>
    </details>`;
  }).join('');
}

function renderAudio() {
  return source.audio_map.map((item) => {
    const file = `${item.track_label}.mp3`;
    const relativeAudio = `Giáo trình/博雅汉语听说-中级冲刺篇/音频/第01课/${file}`;
    return `<tr>
      <td><strong>${escapeHtml(item.track_label)}</strong></td>
      <td>${escapeHtml(item.related_section)}</td>
      <td>${escapeHtml(item.source_pdf_pages.join(', '))}</td>
      <td><audio controls preload="none" src="${hrefToProject(relativeAudio)}"></audio></td>
      <td><a href="${hrefToProject(relativeAudio)}">開啟音檔</a></td>
      <td>${statusPill(item.mapping_status)}</td>
    </tr>`;
  }).join('');
}

function inventoryCsv() {
  const header = ['record_id', 'exercise_order', 'exercise_type', 'textbook_page', 'pdf_page', 'section_id', 'audio_asset_ids', 'answer_status', 'source_review_status', 'planned_teaching_slot'];
  const lines = [header.join(',')];
  for (const item of source.exercises) {
    const row = [
      item.record_id,
      item.exercise_order,
      item.exercise_type,
      item.textbook_printed_page || (item.textbook_printed_pages || []).join('|'),
      item.source_pdf_page || (item.source_pdf_pages || []).join('|'),
      item.section_id,
      (item.audio_asset_ids || []).join('|'),
      item.answer_status || '',
      item.review_status || '',
      '待教學重組'
    ];
    lines.push(row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','));
  }
  return `${lines.join('\n')}\n`;
}

const lessonAudioRoot = 'Giáo trình/博雅汉语听说-中级冲刺篇/音频/第01课';
const audioFiles = source.audio_map.map((item) => `${lessonAudioRoot}/${item.track_label}.mp3`);
const manifest = {
  package: 'lesson-01-source-review',
  generated_at: new Date().toISOString(),
  canonical_source: sourceRelative,
  canonical_source_sha256: sha256File(sourceRelative),
  source_pdf: pdfRelative,
  source_pdf_sha256: sha256File(pdfRelative),
  audio_count: audioFiles.length,
  audio_sha256: Object.fromEntries(audioFiles.map((file) => [path.basename(file), sha256File(file)])),
  lesson_title: source.lesson_title,
  source_status: source.review_status,
  source_qa_status: source.source_qa?.status,
  section_count: source.sections.length,
  vocabulary_count: source.vocabulary.length,
  grammar_count: source.grammar_patterns.length,
  text_dialogue_count: source.texts_dialogues.length,
  exercise_count: source.exercises.length,
  answer_policy: source.answer_policy
};

const html = `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="《博雅漢語聽說：中級衝刺篇 I》第一課來源審核包">
  <title>第一課〈中國人的姓名〉｜來源審核包</title>
  <style>
    :root { --ink:#1e2b36; --muted:#667582; --paper:#fbfaf6; --surface:#fff; --line:#dce3e6; --navy:#17324d; --blue:#2e6f95; --mint:#dcefe9; --mint-dark:#2b6c62; --coral:#c66a56; --coral-soft:#f8e7e1; --gold:#c6953d; --gold-soft:#fbf1d9; --purple:#635784; --shadow:0 14px 38px rgba(27,47,61,.08); --radius:16px; }
    * { box-sizing:border-box; }
    html { scroll-behavior:smooth; }
    body { margin:0; background:var(--paper); color:var(--ink); font-family:-apple-system,BlinkMacSystemFont,"PingFang TC","Noto Sans TC","Microsoft JhengHei",sans-serif; line-height:1.65; }
    a { color:var(--blue); } a:hover { color:var(--coral); }
    h1,h2,h3,h4,p { margin-top:0; } h1,h2,h3,h4 { color:var(--navy); line-height:1.25; }
    h1 { font-size:clamp(2rem,4vw,3.5rem); letter-spacing:-.045em; margin-bottom:14px; }
    h2 { font-size:clamp(1.4rem,2vw,2rem); margin-bottom:16px; }
    h3 { font-size:1.1rem; margin-bottom:10px; } h4 { font-size:.96rem; margin:18px 0 8px; }
    small { color:var(--muted); }
    .shell { display:grid; grid-template-columns:260px minmax(0,1fr); min-height:100vh; }
    aside { position:sticky; top:0; height:100vh; overflow:auto; padding:26px 18px; background:var(--navy); color:#eaf1f4; }
    .brand { display:flex; gap:10px; align-items:flex-start; margin-bottom:24px; } .mark { width:30px; height:30px; border:2px solid #a9d9ce; border-radius:9px 9px 9px 2px; transform:rotate(-8deg); flex:0 0 auto; }
    .brand strong { display:block; font-size:.94rem; } .brand span { display:block; color:#a9bdc8; font-size:.75rem; margin-top:3px; }
    .nav-label { color:#93acb8; font-size:.68rem; letter-spacing:.14em; text-transform:uppercase; margin:21px 0 7px; }
    nav a { display:block; color:#dfecef; text-decoration:none; font-size:.84rem; padding:8px 10px; border-radius:9px; } nav a:hover { background:rgba(220,239,233,.12); color:#fff; }
    aside .note { margin-top:24px; padding:12px; border:1px solid rgba(220,239,233,.25); border-radius:12px; color:#c4d5da; font-size:.76rem; }
    aside button { width:100%; border:1px solid rgba(220,239,233,.34); background:transparent; color:#eaf1f4; border-radius:9px; padding:8px 10px; cursor:pointer; margin-top:11px; }
    aside button:hover { background:rgba(220,239,233,.12); }
    main { min-width:0; } .hero { padding:64px clamp(22px,6vw,88px) 42px; background:linear-gradient(135deg,#eef6f3 0%,#fbfaf6 58%,#f9e8e1 100%); border-bottom:1px solid var(--line); }
    .eyebrow { color:var(--coral); font-size:.73rem; font-weight:800; letter-spacing:.14em; text-transform:uppercase; margin-bottom:12px; }
    .subtitle { max-width:810px; color:#435666; font-size:1.04rem; margin-bottom:19px; }
    .meta { display:flex; gap:8px; flex-wrap:wrap; } .pill { display:inline-flex; align-items:center; gap:5px; border-radius:999px; padding:4px 10px; background:#fff; border:1px solid var(--line); color:var(--navy); font-size:.75rem; font-weight:750; }
    .pill.pending { background:var(--gold-soft); border-color:#e8cb8d; color:#755319; } .pill.ok { background:var(--mint); border-color:#b7d9cf; color:var(--mint-dark); } .pill.warn { background:var(--coral-soft); border-color:#e4b8aa; color:#984d3d; }
    .content { max-width:1480px; padding:34px clamp(22px,6vw,88px) 80px; } .section { margin-top:57px; scroll-margin-top:18px; } .section:first-child { margin-top:0; }
    .section-heading { display:flex; gap:14px; align-items:flex-end; justify-content:space-between; margin-bottom:17px; } .section-heading p { color:var(--muted); max-width:760px; margin:0; }
    .grid { display:grid; gap:14px; } .stats { grid-template-columns:repeat(5,minmax(0,1fr)); margin:-2px 0 23px; } .two { grid-template-columns:repeat(2,minmax(0,1fr)); }
    .card { background:var(--surface); border:1px solid var(--line); border-radius:var(--radius); box-shadow:var(--shadow); padding:19px; } .stat { min-height:116px; position:relative; overflow:hidden; } .stat:after { content:""; position:absolute; width:88px; height:88px; right:-29px; top:-29px; border-radius:50%; background:var(--mint); opacity:.7; } .stat:nth-child(2):after { background:var(--coral-soft); } .stat:nth-child(3):after { background:var(--gold-soft); } .stat:nth-child(4):after { background:#eeeafa; } .stat:nth-child(5):after { background:#e8eef5; }
    .number { position:relative; z-index:1; display:block; font-size:2rem; font-weight:850; letter-spacing:-.05em; color:var(--navy); } .label { position:relative; z-index:1; display:block; color:var(--muted); font-size:.78rem; }
    .callout { border-left:4px solid var(--coral); background:var(--coral-soft); padding:14px 17px; border-radius:0 12px 12px 0; margin:15px 0; } .callout.mint { border-color:var(--mint-dark); background:var(--mint); } .callout.gold { border-color:var(--gold); background:var(--gold-soft); } .callout p:last-child { margin-bottom:0; }
    .muted { color:var(--muted); } .compact { margin:8px 0 0; padding-left:1.2em; } .compact li + li { margin-top:5px; }
    .checklist { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px 18px; margin:0; padding:0; list-style:none; } .checklist li { position:relative; padding-left:24px; font-size:.84rem; } .checklist li:before { content:"□"; position:absolute; left:0; color:var(--coral); font-size:1.1rem; line-height:1.35; }
    .table-wrap { overflow-x:auto; border:1px solid var(--line); border-radius:13px; background:var(--surface); box-shadow:var(--shadow); } table { width:100%; border-collapse:collapse; font-size:.83rem; } th,td { padding:10px 11px; border-bottom:1px solid var(--line); vertical-align:top; text-align:left; } th { color:var(--navy); background:#f2f6f6; font-size:.72rem; letter-spacing:.04em; white-space:nowrap; } tr:last-child td { border-bottom:0; } .wide { min-width:900px; } .medium { min-width:700px; } td .status { margin-top:1px; }
    details { background:var(--surface); border:1px solid var(--line); border-radius:var(--radius); box-shadow:var(--shadow); margin-bottom:11px; overflow:hidden; } summary { cursor:pointer; list-style:none; padding:15px 18px; display:flex; gap:12px; align-items:center; justify-content:space-between; } summary::-webkit-details-marker { display:none; } summary:after { content:"+"; color:var(--coral); font-size:1.3rem; } details[open] summary:after { content:"−"; } summary > span:first-child { min-width:0; } .summary-right { text-align:right; color:var(--muted); font-size:.75rem; } .detail-body { border-top:1px solid var(--line); padding:17px 18px; } .meta-line { color:var(--muted); font-size:.74rem; margin-bottom:10px; } pre { white-space:pre-wrap; overflow-wrap:anywhere; margin:0; padding:13px 14px; background:#f7f9f8; border:1px solid #e5ecea; border-radius:10px; font:inherit; font-size:.84rem; line-height:1.8; } .options { margin-top:11px; padding:11px 13px; border-radius:10px; background:#faf7ee; border:1px solid #eee2bf; } .options ol { margin:0; padding-left:1.25em; } .options ul { margin:3px 0 7px; padding-left:1.25em; } .answer-note { margin-top:12px; padding:10px 12px; border-left:3px solid var(--gold); background:#fffaf0; font-size:.8rem; color:#73551c; } .answer-note .status { margin-left:4px; }
    .tree { padding:12px 14px; background:#f7f9f8; border:1px solid #e5ecea; border-radius:12px; overflow:auto; } .tree ul { margin:0; padding-left:1.3em; } .tree > ul { padding-left:0; list-style:none; } .tree li { margin:6px 0; list-style:none; } .tree-row { display:flex; flex-wrap:wrap; gap:7px; align-items:center; padding:6px 8px; border-radius:8px; background:#fff; border:1px solid #edf1f0; } .tree-id { color:var(--purple); font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:.7rem; } .tree-row strong { color:var(--navy); font-size:.83rem; } .tree-type { color:var(--muted); font-size:.7rem; } .tree-ref { color:var(--muted); font-size:.7rem; margin-left:auto; }
    .status { display:inline-flex; white-space:nowrap; align-items:center; border-radius:999px; padding:2px 7px; font-size:.68rem; font-weight:750; background:#f1f3f4; color:var(--muted); } .status.ok { background:var(--mint); color:var(--mint-dark); } .status.pending { background:var(--gold-soft); color:#755319; } .status.warn { background:var(--coral-soft); color:#984d3d; } .asterisk { color:#9a6d1d; font-size:.68rem; }
    .search-bar { display:flex; gap:9px; margin:12px 0 15px; } .search-bar input { width:min(560px,100%); border:1px solid var(--line); border-radius:10px; padding:10px 12px; font:inherit; background:#fff; color:var(--ink); } .search-bar input:focus { outline:3px solid rgba(46,111,149,.16); border-color:var(--blue); } [hidden] { display:none !important; }
    audio { width:190px; max-width:100%; height:30px; } footer { margin-top:58px; padding-top:22px; border-top:1px solid var(--line); color:var(--muted); font-size:.76rem; }
    @media(max-width:1080px) { .shell { grid-template-columns:218px minmax(0,1fr); } .stats { grid-template-columns:repeat(3,minmax(0,1fr)); } }
    @media(max-width:760px) { .shell { display:block; } aside { position:relative; height:auto; padding:18px 19px; } aside nav { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:2px 6px; } aside .note, aside button { display:none; } .hero { padding:42px 20px 31px; } .content { padding:27px 17px 58px; } .stats { grid-template-columns:repeat(2,minmax(0,1fr)); } .two { grid-template-columns:1fr; } .checklist { grid-template-columns:1fr; } .section-heading { display:block; } .tree-ref { margin-left:0; } .summary-right { display:none; } }
    @media print { aside { display:none; } .shell { display:block; } .hero { padding:24px 0; } .content { padding:20px 0; } .card, details, .table-wrap { box-shadow:none; break-inside:avoid; } .section { margin-top:30px; } a { color:inherit; text-decoration:none; } }
  </style>
</head>
<body>
  <div class="shell">
    <aside>
      <div class="brand"><div class="mark"></div><div><strong>博雅漢語・教材生產</strong><span>Lesson 01 source gate</span></div></div>
      <div class="nav-label">Review package</div>
      <nav>
        <a href="#overview">總覽</a>
        <a href="#decision">審核決策</a>
        <a href="#sections">教材結構</a>
        <a href="#vocabulary">詞語</a>
        <a href="#texts">課文與對話</a>
        <a href="#grammar">句式</a>
        <a href="#exercises">全部練習</a>
        <a href="#audio">音檔對照</a>
        <a href="#next">下一步</a>
      </nav>
      <div class="note">這一頁是來源審核包，不是學生投影片。原文保留教材簡體字；學生端全中文編排與教學重組要等本頁通過後才開始。</div>
      <button type="button" onclick="window.print()">列印／輸出 PDF</button>
    </aside>
    <main>
      <header class="hero">
        <div class="eyebrow">Source review gate · v0.1</div>
        <h1>第一課〈中國人的姓名〉</h1>
        <p class="subtitle">《博雅漢語聽說：中級衝刺篇 I》的第一課來源審核包。這一步只確認「教材到底有什麼」，不先決定學生投影片的教學順序。</p>
        <div class="meta">
          ${statusPill(source.review_status)}
          ${statusPill(source.extraction_status)}
          <span class="pill">原文：簡體中文</span>
          <span class="pill">教材 pp.1–16 · PDF pp.12–27</span>
          <span class="pill">11 段音檔</span>
        </div>
      </header>
      <div class="content">
        <section id="overview" class="section">
          <div class="grid stats">
            <div class="card stat"><span class="number">${source.sections.length}</span><span class="label">教材區段</span></div>
            <div class="card stat"><span class="number">${source.vocabulary.length}</span><span class="label">詞語記錄</span></div>
            <div class="card stat"><span class="number">${source.grammar_patterns.length}</span><span class="label">句式記錄</span></div>
            <div class="card stat"><span class="number">${source.exercises.length}</span><span class="label">教材練習</span></div>
            <div class="card stat"><span class="number">${source.audio_map.length}</span><span class="label">音檔對應</span></div>
          </div>
          <div class="grid two">
            <div class="card">
              <h3>本次審核的範圍</h3>
              <ul class="compact">
                <li>教材 PDF 與印刷頁碼對照</li>
                <li>聽說（一）、聽說（二）的完整區段層級</li>
                <li>詞語、課文／對話、句式與 35 項練習</li>
                <li>11 段音檔與教材頁面對應</li>
                <li>教材答案是否存在，以及哪些內容不能自行補答</li>
              </ul>
            </div>
            <div class="card">
              <h3>來源指紋</h3>
              <p class="muted">之後製作 HTML 投影片與 PPTX 時，會以這個來源版本作為比對基準。</p>
              <div class="meta-line">結構化來源：<a href="${hrefToProject(sourceRelative)}">structured-lesson-01.json</a></div>
              <div class="meta-line">PDF：<a href="${hrefToProject(pdfRelative)}">博雅汉语听说-中级冲刺篇I.pdf</a></div>
              <div class="meta-line">canonical source SHA-256：</div>
              <pre>${manifest.canonical_source_sha256}</pre>
            </div>
          </div>
          <div class="callout gold"><strong>目前狀態：</strong>來源結構化資料的 QA 已通過，未決項目為 0；但詞語、課文、句式與練習記錄仍標示「待教師確認」，因為這一頁需要由課程負責人做最後內容 gate。</div>
        </section>

        <section id="decision" class="section">
          <div class="section-heading"><div><h2>請先審核這 6 件事</h2><p>你可以直接在瀏覽器閱讀，然後在對話中回覆「通過」或列出要修改的 record ID。</p></div></div>
          <div class="card">
            <ul class="checklist">
              <li>第一課標題與教材頁碼範圍正確</li>
              <li>教材區段順序與階層正確</li>
              <li>詞語、拼音與教材標記正確</li>
              <li>課文／對話文字沒有 OCR 或轉錄錯誤</li>
              <li>35 項練習全部列入，沒有漏題</li>
              <li>音檔標籤與教材頁面對應正確</li>
            </ul>
            <div class="callout"><strong>答案政策：</strong>${escapeHtml(source.answer_policy || '教材未提供答案的題目不自行補寫。')}</div>
            <p class="muted">審核通過後，下一步才會把內容重組成 6 節課的 PBI 教學流程，並建立教材活動 coverage matrix。</p>
          </div>
        </section>

        <section id="sections" class="section">
          <div class="section-heading"><div><h2>教材結構樹</h2><p>這是教材原本的內容層級，不是最後 PPT 的頁面順序。</p></div></div>
          <div class="tree">${renderSectionTree()}</div>
        </section>

        <section id="vocabulary" class="section">
          <div class="section-heading"><div><h2>詞語記錄</h2><p>保留教材順序、拼音、教材標記與來源頁碼；學生端語言編排尚未開始。</p></div></div>
          <div class="table-wrap"><table class="medium"><thead><tr><th>#</th><th>簡體詞語</th><th>拼音</th><th>教材頁</th><th>PDF 頁</th><th>狀態</th></tr></thead><tbody>${renderVocabulary()}</tbody></table></div>
        </section>

        <section id="texts" class="section">
          <div class="section-heading"><div><h2>課文與對話</h2><p>展開每一項查看教材轉錄全文；原文只作來源審核，不直接等於學生 PPT 文案。</p></div></div>
          ${renderTexts()}
        </section>

        <section id="grammar" class="section">
          <div class="section-heading"><div><h2>句式記錄</h2><p>下一步會再決定哪些句式進入控制式口說與最後任務；這裡先確認教材原始內容。</p></div></div>
          <div class="table-wrap"><table class="wide"><thead><tr><th>#</th><th>句式</th><th>教材原文與說明</th><th>來源</th><th>狀態</th></tr></thead><tbody>${renderGrammar()}</tbody></table></div>
        </section>

        <section id="exercises" class="section">
          <div class="section-heading"><div><h2>全部 35 項教材練習</h2><p>每一題之後都必須進入教學活動覆蓋表；目前先保留原題與來源，不預先安排教學節次。</p></div></div>
          <div class="search-bar"><input id="exercise-search" type="search" placeholder="搜尋 record ID、題型或題目文字，例如 E01-023、複述、姓名"></div>
          <div id="exercise-list">${renderExercises()}</div>
          <div id="no-results" class="card" hidden>沒有符合搜尋條件的練習。</div>
        </section>

        <section id="audio" class="section">
          <div class="section-heading"><div><h2>音檔對照</h2><p>每段音檔都提供瀏覽器播放與原始檔案連結，方便確認能否在後續課堂素材包中使用。</p></div></div>
          <div class="table-wrap"><table class="wide"><thead><tr><th>音檔</th><th>教材區段</th><th>PDF 頁</th><th>播放</th><th>檔案</th><th>對應狀態</th></tr></thead><tbody>${renderAudio()}</tbody></table></div>
        </section>

        <section id="next" class="section">
          <div class="section-heading"><div><h2>審核通過後的下一步</h2><p>收到你的來源修正或「通過」回覆後，才進入教學設計層。</p></div></div>
          <div class="grid two">
            <div class="card"><h3>Step 2 · 教學重組</h3><ul class="compact"><li>建立第一課 6 節課的 PBI 目標與證據</li><li>把 35 項教材練習分配到 P1–P6</li><li>設計小組任務、角色、產出與回饋方式</li><li>確認學生 PPT 與教師手冊的內容邊界</li></ul></div>
            <div class="card"><h3>你回覆後我會做什麼</h3><ul class="compact"><li>修正你指出的 record ID</li><li>更新來源版本與 SHA-256</li><li>建立 activity coverage matrix</li><li>再開始製作 numbered HTML 投影片</li></ul></div>
          </div>
        </section>

        <footer>Generated from <code>${escapeHtml(sourceRelative)}</code> · ${escapeHtml(manifest.generated_at)} · 本文件為教師審核用，不是學生教材。</footer>
      </div>
    </main>
  </div>
  <script>
    const input = document.getElementById('exercise-search');
    const items = [...document.querySelectorAll('.exercise')];
    const empty = document.getElementById('no-results');
    input.addEventListener('input', () => {
      const query = input.value.trim().toLowerCase();
      let visible = 0;
      items.forEach((item) => {
        const match = !query || item.dataset.search.includes(query);
        item.hidden = !match;
        if (match) visible += 1;
      });
      empty.hidden = visible !== 0;
    });
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(outputDir, 'index.html'), html);
fs.writeFileSync(path.join(outputDir, 'lesson-01-exercise-inventory.csv'), inventoryCsv());
fs.writeFileSync(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ outputDir, html: path.join(outputDir, 'index.html'), exerciseInventory: source.exercises.length, sectionCount: source.sections.length, audioCount: source.audio_map.length, sourceSha256: manifest.canonical_source_sha256 }, null, 2));
