const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

if (process.env.BOYA_ALLOW_LEGACY_REVIEW !== '1') {
  throw new Error(
    'This HTML teaching-design builder is legacy-only. Set BOYA_ALLOW_LEGACY_REVIEW=1 explicitly to rebuild historical evidence.'
  );
}

const projectRoot = path.resolve(__dirname, '../..');
const sourceRelative = 'work/boya-intermediate/extractions/structured-lesson-01.json';
const outputRelative = 'archive/legacy-rebuilds/boya-intermediate/lesson-01/teaching-design';
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

function pages(record) {
  if (record.source_pdf_page_range) {
    const { start, end } = record.source_pdf_page_range;
    return start === end ? `PDF p.${start}` : `PDF pp.${start}–${end}`;
  }
  if (record.source_pdf_pages?.length) return `PDF pp.${record.source_pdf_pages.join(', ')}`;
  if (record.source_pdf_page) return `PDF p.${record.source_pdf_page}`;
  return '—';
}

function printedPages(record) {
  if (record.textbook_printed_page) return `教材 p.${record.textbook_printed_page}`;
  if (record.textbook_printed_pages?.length) return `教材 pp.${record.textbook_printed_pages.join(', ')}`;
  return '—';
}

function hrefToProject(relativeTarget) {
  const target = path.resolve(projectRoot, relativeTarget);
  const rel = path.relative(outputDir, target).split(path.sep);
  return rel.map((segment) => segment === '..' || segment === '.' ? segment : encodeURIComponent(segment)).join('/');
}

function sha256File(relativeTarget) {
  const target = path.resolve(projectRoot, relativeTarget);
  return crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex');
}

function pill(label, tone = '') {
  return `<span class="pill ${tone}">${escapeHtml(label)}</span>`;
}

const sourceExercises = Object.fromEntries(source.exercises.map((item) => [item.record_id, item]));

const coverage = {
  'E01-001': { periods: ['P1'], route: '課堂核心', mode: '詮釋理解', activity: '聽對話抓主旨，再以證據卡回答 6 題', evidence: '完成答案並指出支持答案的詞語', teacher: '只處理影響理解的 1–2 個詞語' },
  'E01-002': { periods: ['P1'], route: '課堂核心', mode: '詮釋理解', activity: '聽句子後小組比對相近意思，說明選項理由', evidence: '每組提交 2 題證據解釋', teacher: '追問「你從哪裡聽到的？」' },
  'E01-003': { periods: ['P1'], route: '課堂互動', mode: '人際互動', activity: '三至五句回答後，交換問題並追問一題', evidence: '完成一次 4-turn 互動', teacher: '記錄高頻卡點，延後微修補' },
  'E01-004': { periods: ['P2'], route: '課堂核心', mode: '人際互動', activity: '跟讀後立即替換個人資料與命名情境', evidence: '每人產出 3 句可理解的替換句', teacher: '不逐句講解，只示範必要的重音與語序' },
  'E01-005': { periods: ['P2'], route: '課堂核心', mode: '人際互動', activity: '聽後遮稿重建對話，再與另一組交換角色', evidence: '雙人完成一次不看稿複述', teacher: '用 recast 與一次重做取代長篇講解' },
  'E01-006': { periods: ['P3'], route: '課堂核心', mode: '詮釋理解', activity: '第一次聽力只填關鍵資訊，不要求逐字聽寫', evidence: '完成關鍵空格並比較小組答案', teacher: '先讓學生協商答案，再公布音檔再聽點' },
  'E01-007': { periods: ['P3'], route: '課堂核心', mode: '詮釋理解', activity: '第二次聽力判斷正誤，要求引用音檔證據', evidence: '每題附一個聽力依據', teacher: '處理影響判斷的語音或詞義問題' },
  'E01-008': { periods: ['P3'], route: '課堂討論', mode: '人際互動', activity: '小組判斷朋友是否贊成，整理不同理由', evidence: '小組共識＋個人一句理由', teacher: '追問觀點與證據是否一致' },
  'E01-009': { periods: ['P2'], route: '課堂輪站', mode: '人際互動', activity: '情境卡用「總不能……吧」完成對話', evidence: '每人完成 2 個新情境', teacher: '不先講規則，從學生產出做微修補' },
  'E01-010': { periods: ['P2'], route: '課堂輪站', mode: '人際互動', activity: '用「……才怪呢」改寫並互相判斷語氣', evidence: '同伴能說出語氣效果', teacher: '只針對語氣與使用情境回饋' },
  'E01-011': { periods: ['P2'], route: '課堂輪站', mode: '人際互動', activity: '為句子配情境，再由同伴追問「為什麼」', evidence: '每組完成一個情境說明', teacher: '促進延伸，不逐項翻譯' },
  'E01-012': { periods: ['P2'], route: '課堂輪站', mode: '人際互動', activity: '用「話說回來」從正反兩面談姓名選擇', evidence: '完成兩面觀點的 30 秒表達', teacher: '觀察連接與觀點轉換' },
  'E01-013': { periods: ['P3'], route: '課堂討論', mode: '人際互動', activity: '文化問題四角討論：同音、吉利與姓名選擇', evidence: '小組提交一個文化觀察與例子', teacher: '避免把文化內容講成單一答案' },
  'E01-014': { periods: ['P3'], route: '課前閱讀＋課堂證據', mode: '詮釋理解', activity: '課前讀短文，課堂用資訊拼圖回答問題', evidence: '每人完成一張「觀點—例子」證據表', teacher: '以理解障礙為依據補充詞語' },
  'E01-015': { periods: ['P3'], route: '課堂短講', mode: '表達呈現', activity: '用兩個諧音例子完成 60 秒成段敘述', evidence: '錄下或現場完成一次成段表達', teacher: '回饋可理解度、連貫與例子' },
  'E01-016': { periods: ['P4'], route: '課堂核心任務', mode: '人際互動＋表達呈現', activity: '三至四人「起名兒公司」：訪問客戶、協商條件、提出姓名', evidence: '90 秒顧問提案＋客戶追問', teacher: '以任務成功與互動策略觀察，不逐字糾錯' },
  'E01-017': { periods: ['P4'], route: '課堂小組延伸', mode: '人際互動＋表達呈現', activity: '根據演員名字的音與義提出中文名，說明取名理由', evidence: '小組完成 2 個名字與理由', teacher: '提供必要的文化或發音修補' },
  'E01-018': { periods: ['P4'], route: '課堂報告', mode: '表達呈現', activity: '整理姓名的時代意義、地域特點或美好願望，做小組調查報告', evidence: '2 分鐘小組報告＋一題同伴提問', teacher: '評估資訊組織與聽眾回應' },
  'E01-019': { periods: ['P5'], route: '課堂核心', mode: '人際互動', activity: '介紹本國常見姓與名，說明常見原因；先用預習卡交換', evidence: '完成一次比較型訪談', teacher: '把差異轉成追問，不先講中國姓氏系統' },
  'E01-020': { periods: ['P5'], route: '課堂核心', mode: '詮釋理解', activity: '聽對話回答問題，小組先協商再全班核對', evidence: '每組提交主旨與兩個細節', teacher: '只補理解所需詞語' },
  'E01-021': { periods: ['P5'], route: '課堂互動', mode: '人際互動', activity: '三至五句回答後追問同伴的姓與名', evidence: '完成一次 4-turn 互動', teacher: '以 follow-up question 作為回饋焦點' },
  'E01-022': { periods: ['P5'], route: '課堂輪站', mode: '人際互動', activity: '跟讀替換：把姓氏與稱呼換成班級真實資料', evidence: '每人完成 3 句替換句', teacher: '修補聲調或語序，不講完整句式理論' },
  'E01-023': { periods: ['P5'], route: '課堂核心', mode: '人際互動', activity: '聽後遮稿重建對話，再交換角色重述', evidence: '雙人完成一次不看稿重建', teacher: '記錄可理解度與互動反應' },
  'E01-024': { periods: ['P6'], route: '課堂核心', mode: '詮釋理解', activity: '第一次聽力填關鍵資訊，先個人後小組拼圖', evidence: '完成關鍵空格與小組共識', teacher: '不逐字播放、不逐題講解' },
  'E01-025': { periods: ['P6'], route: '課堂核心', mode: '詮釋理解', activity: '第二次聽力判斷正誤，為答案找音檔依據', evidence: '每題附一個證據片段或關鍵詞', teacher: '針對錯誤模式做 3 分鐘微修補' },
  'E01-026': { periods: ['P6'], route: '課堂討論', mode: '人際互動', activity: '小組整理「老」姓氏造成的麻煩，互相補充例子', evidence: '小組完成問題—原因—結果表', teacher: '推動學生從內容推論，不直接給答案' },
  'E01-027': { periods: ['P6'], route: '課堂輪站', mode: '人際互動', activity: '句式練習改成資訊差任務：每人持有不同姓氏資料', evidence: '每人完成兩次資訊交換', teacher: '觀察是否能把句式用來完成任務' },
  'E01-028': { periods: ['P6'], route: '課堂輪站', mode: '人際互動', activity: '文化問題小組討論：單姓、複姓與姓名來源', evidence: '小組提出一個比較觀察', teacher: '處理文化誤解，不做百科式講授' },
  'E01-029': { periods: ['P6'], route: '課前閱讀＋課堂證據', mode: '詮釋理解', activity: '課前閱讀，課堂以 jigsaw 找到問題答案與文本依據', evidence: '每組教會新組員一個文本重點', teacher: '用問題診斷理解而非逐段翻譯' },
  'E01-030': { periods: ['P6'], route: '課堂短講', mode: '表達呈現', activity: '解釋「張王李趙遍地流（劉）」並談一個熟悉姓氏', evidence: '60–90 秒成段表達', teacher: '回饋訊息組織與聽眾理解' },
  'E01-031': { periods: ['P6'], route: '課前微研究＋課堂回報', mode: '表達呈現', activity: '課前準備一位歷史名人，課堂小組拼成 10 姓名人圖', evidence: '每人 30 秒人物介紹', teacher: '提供語言支架，不代替學生報告' },
  'E01-032': { periods: ['P6'], route: '課堂輪站', mode: '表達呈現', activity: '朗讀單姓與複姓，再說明自己認識的姓氏', evidence: '同伴能聽懂並記下 2 個姓氏', teacher: '只修補造成理解障礙的讀音' },
  'E01-033': { periods: ['P6'], route: '出口任務', mode: '人際互動＋反思', activity: '讀對話後談體會，回應同伴一個觀點', evidence: '完成 30 秒反思＋一個追問', teacher: '收集下一課需要的語言問題' },
  'E01-034': { periods: ['P1'], route: '課前準備＋課堂開場', mode: '人際互動', activity: '預先準備姓名意思與來歷，入場後完成同伴訪談', evidence: '每人完成一張姓名資訊卡', teacher: '用學生資料啟動課堂，不先講詞語' },
  'E01-035': { periods: ['P1', 'P4'], route: '課前田野＋課堂呈現', mode: '人際互動＋表達呈現', activity: '課前訪問至少三位中文使用者；P1 比較資料，P4 轉成小組報告', evidence: '資料表＋2 分鐘報告', teacher: '若無法找到中文使用者，使用教師核准的班級替代資料' }
};

const missingCoverage = source.exercises.map((item) => item.record_id).filter((id) => !coverage[id]);
const extraCoverage = Object.keys(coverage).filter((id) => !sourceExercises[id]);
if (missingCoverage.length || extraCoverage.length) {
  throw new Error(`Coverage mismatch. Missing: ${missingCoverage.join(', ')}; extra: ${extraCoverage.join(', ')}`);
}

const periods = [
  {
    id: 'P1', title: '預習回收：我的名字與命名理由', mode: '詮釋理解 → 人際互動', target: '學生能從短對話抓到主要訊息與細節，並用中文詢問、說明姓名的意思或來歷。', evidence: '姓名資訊卡＋4-turn 訪談＋一個聽力證據。', prep: '課前讀教材 pp.1–4；快速聽 1-1、1-2、1-3；完成姓名資訊卡。', rows: [
      ['0–5', '預習證據入場', '兩人交換姓名資訊卡，找出一個相同或不同點', 'E01-034、E01-035'],
      ['5–15', '第一次聽力', '聽 1-2，先個人抓主旨，再小組找證據', 'E01-001'],
      ['15–25', '相近意思', '聽 1-3，選項協商與理由說明', 'E01-002'],
      ['25–40', '三至五句回答', '回答後追問同伴一題，完成姓名訪談', 'E01-003'],
      ['40–47', '即時語言修補', '只處理影響任務完成的 2–3 個語言問題，立即重做', '不新增講授段落'],
      ['47–50', '出口證據', '說出一個姓名理由並引用一個聽力資訊', '形成性評量']
    ]
  },
  {
    id: 'P2', title: '語言工具在用：替換、重建與觀點轉換', mode: '人際互動', target: '學生能把教材句式當成完成任務的工具，而不是背誦句型。', evidence: '三句替換句＋一次不看稿對話＋30 秒雙面觀點。', prep: '課前讀教材 pp.4–6；先聽 1-4、1-5；圈出自己想使用的表達。', rows: [
      ['0–5', '快速回收', '同伴用昨天的姓名資料互問一題', '預習卡'],
      ['5–17', '替換即說', '聽 1-4，跟讀後立即換成班級真實資料', 'E01-004'],
      ['17–30', '對話重建', '聽 1-5，遮稿重建，再交換角色', 'E01-005'],
      ['30–45', '句式資訊站', '四站輪換：總不能、才怪、情境、話說回來', 'E01-009–E01-012'],
      ['45–49', '同伴回饋與重做', '同伴只回饋「聽懂了什麼／哪裡需要重說」', 'PBI feedback'],
      ['49–50', '出口任務', '用一個句式回應姓名選擇問題', '形成性評量']
    ]
  },
  {
    id: 'P3', title: '聽懂立場：從音檔證據到成段表達', mode: '詮釋理解 → 表達呈現', target: '學生能理解不同人對「殊」這個名字的看法，整理理由，並用兩個例子談諧音。', evidence: '填空／正誤證據表＋小組立場＋60 秒成段敘述。', prep: '課前讀教材 pp.5–9；先聽 1-6；閱讀諧音短文並標記一個例子。', rows: [
      ['0–5', '預測與分工', '根據預習標記預測朋友的態度，分配聽力證據角色', '預習卡'],
      ['5–15', '第一遍聽力', '只填關鍵資訊，不要求逐字聽寫', 'E01-006'],
      ['15–25', '第二遍聽力', '正誤判斷，為每題找音檔依據', 'E01-007'],
      ['25–33', '立場討論', '判斷朋友是否贊成，整理理由與語氣', 'E01-008'],
      ['33–42', '文化閱讀拼圖', '閱讀後回答，交換諧音文化觀察', 'E01-013、E01-014'],
      ['42–48', '成段短講', '用兩個諧音例子完成 60 秒表達', 'E01-015'],
      ['48–50', '出口反思', '寫下自己仍不確定的一個語言問題', '教師診斷']
    ]
  },
  {
    id: 'P4', title: '姓名顧問工作室：合作完成真實任務', mode: '人際互動 → 表達呈現', target: '學生能詢問客戶需求、協商命名條件、提出姓名並說明音義與文化理由。', evidence: '90 秒顧問提案＋客戶追問＋小組調查報告。', prep: '課前準備 2 個可用姓名與理由；帶回 E01-035 田野資料或替代資料。', rows: [
      ['0–5', '任務簡報', '確認角色、客戶條件與成功標準', '教師只說明任務規則'],
      ['5–27', '起名兒公司', '訪問客戶、整理條件、協商並提出姓名', 'E01-016'],
      ['27–38', '名字再設計', '為電影演員提出中文名，說明音與義', 'E01-017'],
      ['38–47', '調查報告', '整理時代意義、地域特點、美好願望', 'E01-018、E01-035'],
      ['47–50', '回饋與重做', '每組根據一項回饋重做提案中的一句話', '形成性評量']
    ]
  },
  {
    id: 'P5', title: '姓氏與身份：第二組聽力的快速循環', mode: '詮釋理解 → 人際互動', target: '學生能介紹本國常見姓氏，理解對話細節，並以追問維持短互動。', evidence: '比較型訪談＋主旨／細節證據＋不看稿對話重建。', prep: '課前讀教材 pp.10–13；快速聽 2-1、2-2、2-3、2-4；準備本國常見姓氏資料。', rows: [
      ['0–5', '預習回收', '用預習資料交換本國常見姓與名', 'E01-019'],
      ['5–14', '聽力理解', '聽 2-2，先協商主旨再核對細節', 'E01-020'],
      ['14–25', '三至五句互動', '回答後追問姓氏、稱呼或常見原因', 'E01-021'],
      ['25–34', '替換即說', '聽 2-3，換入班級真實姓氏與稱呼', 'E01-022'],
      ['34–43', '對話重建', '聽 2-4，遮稿重述並交換角色', 'E01-023'],
      ['43–49', '同伴回饋', '用可理解度與追問策略互評', 'PBI feedback'],
      ['49–50', '出口任務', '說出一個姓氏差異並追問同伴', '形成性評量']
    ]
  },
  {
    id: 'P6', title: '姓氏文化資訊站：理解、研究與成段表達', mode: '詮釋理解 → 人際互動 → 表達呈現', target: '學生能理解姓氏故事與文化說明，並用 60–90 秒介紹姓氏、歷史人物或個人觀察。', evidence: '填空／正誤／開放回答＋資訊站教學＋60–90 秒短講。', prep: '課前讀教材 pp.13–16；快速聽 2-5；準備一位中國歷史名人或一個熟悉姓氏。', rows: [
      ['0–5', '預習證據入場', '小組交換歷史人物／姓氏資料，建立資訊站角色', 'E01-031、E01-032'],
      ['5–15', '第一遍聽力', '填關鍵資訊，個人後小組拼圖', 'E01-024'],
      ['15–23', '第二遍聽力', '正誤判斷並找音檔依據', 'E01-025'],
      ['23–31', '問題解決', '整理「老」姓氏遇到的麻煩：問題—原因—結果', 'E01-026'],
      ['31–41', '姓氏資訊站', '句式、文化、閱讀、朗讀四站並行', 'E01-027–E01-029、E01-032'],
      ['41–47', '成段呈現', '解釋俗語、介紹歷史人物或熟悉姓氏', 'E01-030、E01-031'],
      ['47–49', '對話反思', '談體會並回應同伴一個觀點', 'E01-033'],
      ['49–50', '出口任務', '錄下或現場完成一句「我現在能……」', 'Can-Do check']
    ]
  }
];

const sectionRouting = [
  ['听说（一）／课前准备、词语、词语理解', 'P1', '課前快速接觸；課堂以聽力與任務回收'],
  ['听说（一）／语句理解', 'P2', '跟讀、替換、對話重建，不做句式講義'],
  ['听说（一）／语段理解、文化知识、阅读短文', 'P3', '音檔證據、文化閱讀拼圖、短講'],
  ['听说（一）／拓展练习', 'P4', '姓名顧問、電影演員中文名、調查報告'],
  ['听说（二）／课前准备、词语、词语理解、语句理解', 'P5', '第二組聽力快速循環與資訊交換'],
  ['听说（二）／语段理解、句式、文化知识、阅读、拓展', 'P6', '資訊站、研究回報、成段呈現']
];

function renderPeriod(period) {
  return `<details class="period" open>
    <summary><span><b>${escapeHtml(period.id)}</b> · ${escapeHtml(period.title)}<small>${escapeHtml(period.mode)}</small></span><span class="pill ok">50 分鐘</span></summary>
    <div class="detail-body">
      <div class="grid two-mini"><div><b>Can-Do／學習目標</b><p>${escapeHtml(period.target)}</p></div><div><b>可觀察證據</b><p>${escapeHtml(period.evidence)}</p></div></div>
      <div class="prep-line"><b>課前預習：</b>${escapeHtml(period.prep)}</div>
      <div class="table-wrap"><table class="wide"><thead><tr><th>時間</th><th>教學節點</th><th>學生做什麼</th><th>教材覆蓋</th></tr></thead><tbody>${period.rows.map((row) => `<tr><td class="time">${escapeHtml(row[0])}</td><td><strong>${escapeHtml(row[1])}</strong></td><td>${escapeHtml(row[2])}</td><td>${escapeHtml(row[3])}</td></tr>`).join('')}</tbody></table></div>
    </div>
  </details>`;
}

function renderCoverage() {
  return source.exercises.slice().sort((a, b) => a.exercise_order - b.exercise_order).map((item) => {
    const c = coverage[item.record_id];
    const prompt = String(item.prompt_raw || '').split('\n')[0];
    const audio = (item.audio_asset_ids || []).join(', ') || '—';
    return `<tr data-search="${escapeHtml([item.record_id, item.exercise_type, prompt, c.activity].join(' ').toLowerCase())}">
      <td><strong>${escapeHtml(item.record_id)}</strong><br><small>#${escapeHtml(item.exercise_order)}</small></td>
      <td>${escapeHtml(item.exercise_type)}<br><span class="source-ref">${escapeHtml(printedPages(item))} · ${escapeHtml(pages(item))}</span></td>
      <td>${escapeHtml(c.periods.join(' → '))}<br>${pill(c.route, c.route.includes('課堂核心') || c.route.includes('核心任務') ? 'ok' : 'soft')}</td>
      <td>${escapeHtml(c.mode)}</td>
      <td>${escapeHtml(c.activity)}</td>
      <td>${escapeHtml(c.evidence)}</td>
      <td>${escapeHtml(audio)}</td>
    </tr>`;
  }).join('');
}

const html = `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="第一課 PBI 教學重組與教材活動覆蓋表">
  <title>第一課〈中國人的姓名〉｜PBI 教學重組</title>
  <style>
    :root { --ink:#1e2b36; --muted:#667582; --paper:#fbfaf6; --surface:#fff; --line:#dce3e6; --navy:#17324d; --blue:#2e6f95; --mint:#dcefe9; --mint-dark:#2b6c62; --coral:#c66a56; --coral-soft:#f8e7e1; --gold:#c6953d; --gold-soft:#fbf1d9; --purple:#635784; --shadow:0 14px 38px rgba(27,47,61,.08); --radius:16px; }
    * { box-sizing:border-box; } html { scroll-behavior:smooth; overflow-x:hidden; }
    body { margin:0; background:var(--paper); color:var(--ink); font-family:-apple-system,BlinkMacSystemFont,"PingFang TC","Noto Sans TC","Microsoft JhengHei",sans-serif; line-height:1.65; overflow-x:hidden; }
    a { color:var(--blue); } a:hover { color:var(--coral); } h1,h2,h3,h4,p { margin-top:0; } h1,h2,h3,h4 { color:var(--navy); line-height:1.25; }
    h1 { font-size:clamp(2rem,4vw,3.5rem); letter-spacing:-.045em; margin-bottom:14px; } h2 { font-size:clamp(1.4rem,2vw,2rem); margin-bottom:16px; } h3 { font-size:1.1rem; margin-bottom:9px; }
    .shell { display:grid; grid-template-columns:258px minmax(0,1fr); min-height:100vh; } aside { position:sticky; top:0; height:100vh; overflow:auto; padding:26px 18px; background:var(--navy); color:#eaf1f4; }
    .brand { display:flex; gap:10px; align-items:flex-start; margin-bottom:23px; } .mark { width:30px; height:30px; border:2px solid #a9d9ce; border-radius:9px 9px 9px 2px; transform:rotate(-8deg); } .brand strong { display:block; font-size:.94rem; } .brand span { display:block; color:#a9bdc8; font-size:.74rem; margin-top:3px; }
    .nav-label { color:#93acb8; font-size:.68rem; letter-spacing:.14em; text-transform:uppercase; margin:21px 0 7px; } nav a { display:block; color:#dfecef; text-decoration:none; font-size:.84rem; padding:8px 10px; border-radius:9px; } nav a:hover { background:rgba(220,239,233,.12); color:#fff; }
    aside .note { margin-top:24px; padding:12px; border:1px solid rgba(220,239,233,.25); border-radius:12px; color:#c4d5da; font-size:.76rem; } aside button { width:100%; border:1px solid rgba(220,239,233,.34); background:transparent; color:#eaf1f4; border-radius:9px; padding:8px 10px; cursor:pointer; margin-top:11px; } aside button:hover { background:rgba(220,239,233,.12); }
    main { min-width:0; overflow-x:hidden; } .hero { padding:64px clamp(22px,6vw,88px) 42px; background:linear-gradient(135deg,#eef6f3 0%,#fbfaf6 58%,#f9e8e1 100%); border-bottom:1px solid var(--line); } .eyebrow { color:var(--coral); font-size:.73rem; font-weight:800; letter-spacing:.14em; text-transform:uppercase; margin-bottom:12px; } .subtitle { max-width:860px; color:#435666; font-size:1.04rem; margin-bottom:18px; } .meta { display:flex; gap:8px; flex-wrap:wrap; }
    .pill { display:inline-flex; align-items:center; border-radius:999px; padding:3px 9px; background:#fff; border:1px solid var(--line); color:var(--navy); font-size:.7rem; font-weight:750; white-space:nowrap; } .pill.ok { background:var(--mint); border-color:#b7d9cf; color:var(--mint-dark); } .pill.pending { background:var(--gold-soft); border-color:#e8cb8d; color:#755319; } .pill.soft { background:#f1f3f4; color:var(--muted); }
    .content { max-width:1500px; padding:34px clamp(22px,6vw,88px) 80px; } .section { margin-top:57px; scroll-margin-top:18px; } .section:first-child { margin-top:0; } .section-heading { display:flex; gap:14px; align-items:flex-end; justify-content:space-between; margin-bottom:17px; } .section-heading p { color:var(--muted); max-width:800px; margin:0; }
    .grid { display:grid; gap:14px; } .two { grid-template-columns:repeat(2,minmax(0,1fr)); } .three { grid-template-columns:repeat(3,minmax(0,1fr)); } .card { background:var(--surface); border:1px solid var(--line); border-radius:var(--radius); box-shadow:var(--shadow); padding:19px; }
    .callout { border-left:4px solid var(--coral); background:var(--coral-soft); padding:14px 17px; border-radius:0 12px 12px 0; margin:15px 0; } .callout.mint { border-color:var(--mint-dark); background:var(--mint); } .callout.gold { border-color:var(--gold); background:var(--gold-soft); } .callout p:last-child { margin-bottom:0; } .muted { color:var(--muted); }
    .flow { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; } .flow-card { min-height:142px; } .flow-card .label { color:var(--coral); font-size:.72rem; font-weight:800; letter-spacing:.1em; text-transform:uppercase; } .flow-card h3 { margin:6px 0 6px; } .flow-card p { color:var(--muted); font-size:.83rem; margin-bottom:0; }
    .prep-table td:first-child { width:26%; font-weight:800; color:var(--navy); } .mini-list { margin:8px 0 0; padding-left:1.2em; font-size:.84rem; } .mini-list li + li { margin-top:5px; }
    .period { background:var(--surface); border:1px solid var(--line); border-radius:var(--radius); box-shadow:var(--shadow); margin-bottom:13px; overflow:hidden; } summary { cursor:pointer; list-style:none; padding:17px 20px; display:flex; gap:13px; align-items:center; justify-content:space-between; } summary::-webkit-details-marker { display:none; } summary:after { content:"+"; color:var(--coral); font-size:1.35rem; } details[open] summary:after { content:"−"; } summary b { color:var(--coral); margin-right:6px; } summary small { display:block; color:var(--muted); font-size:.74rem; margin-top:4px; } .detail-body { border-top:1px solid var(--line); padding:19px 20px; }
    .two-mini { grid-template-columns:repeat(2,minmax(0,1fr)); margin-bottom:14px; } .two-mini > div { padding:12px 13px; border-radius:11px; background:#f7f9f8; border:1px solid #e5ecea; } .two-mini b { color:var(--navy); font-size:.78rem; } .two-mini p { margin:5px 0 0; color:#4b626f; font-size:.82rem; } .prep-line { padding:10px 12px; background:var(--gold-soft); border-left:3px solid var(--gold); border-radius:0 9px 9px 0; margin-bottom:14px; font-size:.82rem; }
    .table-wrap { overflow-x:auto; border:1px solid var(--line); border-radius:13px; background:var(--surface); box-shadow:var(--shadow); } table { width:100%; border-collapse:collapse; font-size:.8rem; } th,td { padding:10px 11px; border-bottom:1px solid var(--line); vertical-align:top; text-align:left; } th { color:var(--navy); background:#f2f6f6; font-size:.7rem; letter-spacing:.04em; white-space:nowrap; } tr:last-child td { border-bottom:0; } .wide { min-width:1060px; } .medium { min-width:760px; } .time { color:var(--coral); font-weight:850; white-space:nowrap; } .source-ref { color:var(--purple); font-size:.7rem; } small { color:var(--muted); }
    .tag-row { display:flex; flex-wrap:wrap; gap:7px; margin:9px 0 0; } .tag { padding:4px 8px; border-radius:8px; background:#f1f3f4; color:#4b626f; font-size:.74rem; } .tag.mint { background:var(--mint); color:var(--mint-dark); } .tag.coral { background:var(--coral-soft); color:#984d3d; } .tag.gold { background:var(--gold-soft); color:#755319; }
    .search-bar { display:flex; gap:9px; margin:12px 0 15px; } .search-bar input { width:min(560px,100%); border:1px solid var(--line); border-radius:10px; padding:10px 12px; font:inherit; background:#fff; color:var(--ink); } .search-bar input:focus { outline:3px solid rgba(46,111,149,.16); border-color:var(--blue); } [hidden] { display:none !important; }
    .rubric td:first-child { width:22%; font-weight:800; color:var(--navy); } .rubric td:nth-child(2) { width:18%; color:var(--coral); font-weight:800; } footer { margin-top:57px; padding-top:22px; border-top:1px solid var(--line); color:var(--muted); font-size:.75rem; }
    @media(max-width:1080px) { .shell { grid-template-columns:218px minmax(0,1fr); } .flow { grid-template-columns:1fr; } }
    @media(max-width:760px) { .shell { display:block; } aside { position:relative; height:auto; padding:18px 19px; } aside nav { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:2px 6px; } aside .note,aside button { display:none; } .hero { padding:42px 20px 31px; } .content { padding:27px 17px 58px; } .two,.two-mini,.three { grid-template-columns:1fr; } .section-heading { display:block; } summary .pill { display:none; } }
    @media print { aside { display:none; } .shell { display:block; } .hero { padding:24px 0; } .content { padding:20px 0; } .card,.period,.table-wrap { box-shadow:none; break-inside:avoid; } .section { margin-top:30px; } a { color:inherit; text-decoration:none; } }
  </style>
</head>
<body>
  <div class="shell">
    <aside>
      <div class="brand"><div class="mark"></div><div><strong>博雅漢語・教學重組</strong><span>Lesson 01 PBI design</span></div></div>
      <div class="nav-label">Step 2 review</div>
      <nav>
        <a href="#principles">設計原則</a>
        <a href="#prep">課前預習</a>
        <a href="#can-do">Can-Do 目標</a>
        <a href="#periods">6 節課流程</a>
        <a href="#coverage">活動覆蓋表</a>
        <a href="#groups">小組任務</a>
        <a href="#assessment">評量證據</a>
        <a href="#handoff">下一步</a>
      </nav>
      <div class="note">已套用學校教師回饋：學生先預習；課堂以聽說練習、互動與任務為主。詞語／句式只做必要的即時修補，不做逐字逐句講解。</div>
      <button type="button" onclick="window.print()">列印／輸出 PDF</button>
    </aside>
    <main>
      <header class="hero">
        <div class="eyebrow">Step 2 · PBI teaching restructure</div>
        <h1>第一課〈中國人的姓名〉</h1>
        <p class="subtitle">以「課前預習 → 課堂高密度練習 → 任務表現 → 回饋重做」重組 6 節課。教材內容全部保留，但課堂不再以詞語、句式或單字講解作為主軸。</p>
        <div class="meta"><span class="pill pending">待教學設計審核</span><span class="pill ok">來源已通過</span><span class="pill">6 節 · 300 分鐘</span><span class="pill">35 項練習全覆蓋</span><a class="pill" href="../source-review/index.html">回看來源審核包</a></div>
      </header>
      <div class="content">
        <section id="principles" class="section">
          <div class="section-heading"><div><h2>這次重組的核心改變</h2><p>學校老師的教學習慣會直接成為課堂流程設計，而不是只寫在備註裡。</p></div></div>
          <div class="callout mint"><strong>主原則：</strong>學生先在課外接觸教材；課堂不花大量時間把詞語或句式逐個講完，而是讓學生先做任務，教師從學生的理解與表現中挑選最需要的語言修補，接著立即重做。</div>
          <div class="flow">
            <div class="card flow-card"><span class="label">Before class</span><h3>預習先接觸</h3><p>快速讀教材、聽音檔、標記卡點、準備一項個人資料或問題。不要求預習時完全理解。</p></div>
            <div class="card flow-card"><span class="label">In class</span><h3>練習先於講解</h3><p>以聽力證據、同儕互動、資訊差、輪站與角色任務作為課堂主體。</p></div>
            <div class="card flow-card"><span class="label">Feedback loop</span><h3>修補後重做</h3><p>教師只處理影響理解或任務完成的問題；學生立刻把修補內容重新用在口語任務中。</p></div>
          </div>
          <div class="card" style="margin-top:14px"><h3>課堂語言教學上限</h3><div class="tag-row"><span class="tag mint">每節直接講解 ≤ 5 分鐘</span><span class="tag coral">先做後講</span><span class="tag gold">只修補高影響問題</span><span class="tag">不逐字翻譯課文</span><span class="tag">不把句式變成文法講義</span></div></div>
        </section>

        <section id="prep" class="section">
          <div class="section-heading"><div><h2>課前預習契約</h2><p>預習的目的不是把教材自己學完，而是讓學生帶著可用的語言與問題進教室。</p></div></div>
          <div class="table-wrap"><table class="medium prep-table"><thead><tr><th>時間點</th><th>學生課前做什麼</th><th>帶到課堂的證據</th></tr></thead><tbody>
            <tr><td>第一次上課前</td><td>快速讀教材 pp.1–9；聽 1-1 至 1-6 各一次；圈出 3 個想在課堂使用的詞語或表達。</td><td>姓名資訊卡：自己的姓名意思／來歷、兩個命名條件、30 秒自述或文字草稿。</td></tr>
            <tr><td>兩次上課之間</td><td>讀教材 pp.10–16；聽 2-1 至 2-5 各一次；準備本國常見姓氏資料。</td><td>一張姓氏比較卡：本國常見姓氏、原因、一個想問同學的問題。</td></tr>
            <tr><td>課前田野／微研究</td><td>依教材要求完成 E01-035；準備一位中國歷史名人供 E01-031 使用。</td><td>資料來源或訪談筆記。若無法找到中文使用者，使用教師核准的班級替代資料。</td></tr>
          </tbody></table></div>
          <div class="callout gold"><strong>缺席預習的 recovery route：</strong>開場只提供 3–5 分鐘快速補聽／同伴摘要，之後仍回到同一個課堂任務；不把整節課改成重新教詞語。</div>
        </section>

        <section id="can-do" class="section">
          <div class="section-heading"><div><h2>ACTFL PBI 表現目標</h2><p>以下是本課的工作目標；正式能力判定仍以學生實際表現與整學期評量為準。</p></div></div>
          <div class="grid three">
            <div class="card"><h3>Interpretive listening</h3><p>我能從關於姓名與姓氏的對話中抓到主旨、細節與說話者理由，並指出支持判斷的聽力證據。</p></div>
            <div class="card"><h3>Interpersonal speaking</h3><p>我能詢問姓名的讀音、意思與來歷，追問對方，並在不理解時請對方重說或確認。</p></div>
            <div class="card"><h3>Presentational speaking</h3><p>我能用 60–90 秒介紹姓名／姓氏或提出命名建議，說明理由並讓聽眾聽懂主要訊息。</p></div>
          </div>
          <div class="card" style="margin-top:14px"><h3>本課最終任務</h3><p><strong>姓名顧問工作室：</strong>小組訪問客戶的命名需求，協商姓名的音、義、風格與文化考量，提出中文姓名並完成 90 秒顧問提案；聽眾必須提出至少一個追問。</p><div class="tag-row"><span class="tag mint">可理解訊息</span><span class="tag mint">互動追問</span><span class="tag mint">理由與證據</span><span class="tag mint">回饋後重做</span></div></div>
        </section>

        <section id="periods" class="section">
          <div class="section-heading"><div><h2>6 節課流程</h2><p>每節 50 分鐘；教師的主要工作是設計輸入、觀察證據、提供短修補並讓學生重做。</p></div></div>
          ${periods.map(renderPeriod).join('')}
        </section>

        <section id="coverage" class="section">
          <div class="section-heading"><div><h2>35 項教材練習覆蓋表</h2><p>所有教材練習均已分配到課前、課堂核心、輪站、任務或出口活動；沒有刪除題目。部分開放題以小組並行方式完成。</p></div></div>
          <div class="search-bar"><input id="coverage-search" type="search" placeholder="搜尋 E01-016、role_play、姓名顧問或音檔"></div>
          <div class="table-wrap"><table id="coverage-table" class="wide"><thead><tr><th>ID</th><th>教材題型／來源</th><th>節次／路線</th><th>PBI 模式</th><th>課堂怎麼做</th><th>可觀察證據</th><th>音檔</th></tr></thead><tbody>${renderCoverage()}</tbody></table></div>
          <div id="coverage-empty" class="card" hidden style="margin-top:12px">沒有符合搜尋條件的練習。</div>
        </section>

        <section id="groups" class="section">
          <div class="section-heading"><div><h2>實際小組活動規格</h2><p>這些活動把教材練習變成學生必須使用語言才能完成的合作任務。</p></div></div>
          <div class="grid two">
            <div class="card"><h3>1 · 姓名訪談旋轉卡</h3><p><strong>人數：</strong>三人一組，訪問者／回答者／觀察者輪換。</p><p><strong>產出：</strong>姓名意思、來歷、讀音、命名偏好各一項；觀察者記錄一次追問。</p><p><strong>涵蓋：</strong>E01-003、E01-034、E01-035。</p></div>
            <div class="card"><h3>2 · 起名兒公司</h3><p><strong>人數：</strong>三至四人；客戶、命名顧問、語音／文化顧問、記錄員。</p><p><strong>產出：</strong>一個符合條件的中文名、兩個理由、一次客戶追問與回應。</p><p><strong>涵蓋：</strong>E01-016、E01-017、E01-018。</p></div>
            <div class="card"><h3>3 · 姓氏資訊站</h3><p><strong>人數：</strong>四站輪換；句式、文化、閱讀、朗讀／人物研究。</p><p><strong>產出：</strong>每人教會新組員一個資訊點，並在最後短講中使用。</p><p><strong>涵蓋：</strong>E01-027–E01-032。</p></div>
            <div class="card"><h3>4 · 聽力證據拼圖</h3><p><strong>人數：</strong>四人；主旨、細節、語氣、證據定位角色。</p><p><strong>產出：</strong>答案不能只寫選項，必須附一個音檔證據或關鍵詞。</p><p><strong>涵蓋：</strong>E01-001、E01-002、E01-006–E01-008、E01-020、E01-024–E01-026。</p></div>
          </div>
        </section>

        <section id="assessment" class="section">
          <div class="section-heading"><div><h2>表現證據與回饋</h2><p>不把詞語默寫或句式填空當成本課主要成就；評量看學生是否能用語言完成理解與互動。</p></div></div>
          <div class="table-wrap"><table class="medium rubric"><thead><tr><th>面向</th><th>達標證據</th><th>教師觀察重點</th><th>回饋後重做</th></tr></thead><tbody>
            <tr><td>聽力理解</td><td>主旨＋細節＋音檔依據</td><td>是否能說明「為什麼這樣選」</td><td>重聽關鍵片段後修正答案</td></tr>
            <tr><td>互動能力</td><td>能提問、回答、追問或請對方重說</td><td>是否維持對話，而非只背單句</td><td>同一任務換夥伴再做一次</td></tr>
            <tr><td>成段表達</td><td>60–90 秒，訊息有順序並說明理由</td><td>可理解度、連貫、聽眾反應</td><td>根據一項回饋重做一段</td></tr>
            <tr><td>語言修補策略</td><td>能使用已學資源繞開卡點</td><td>是否過度依賴教師逐字提示</td><td>限制提示後再完成同類任務</td></tr>
          </tbody></table></div>
        </section>

        <section id="handoff" class="section">
          <div class="section-heading"><div><h2>這一步完成後的交接</h2><p>這份教學重組通過後，才把它轉成學生端 PPTX storyboard、教師手冊與配套材料。</p></div></div>
          <div class="grid two">
            <div class="card"><h3>下一步會製作</h3><ul class="mini-list"><li>學生版 PPTX：全中文操作指示＋簡體中文目標內容</li><li>教師手冊：時間、音檔、分組、提示與答案狀態</li><li>課前預習卡與課堂 exit ticket</li><li>每個教材練習的投影片位置與任務狀態</li></ul></div>
            <div class="card"><h3>這一步暫不製作</h3><ul class="mini-list"><li>不先輸出 PPTX</li><li>不先做視覺美化或動畫</li><li>不把尚未核准的教學改編寫成教材標準答案</li><li>不把教師備課資訊放入學生投影片</li></ul></div>
          </div>
          <div class="callout"><strong>請審核：</strong>這個課堂節奏是否符合學校老師的實際習慣，尤其是「預習先接觸、課堂直接練習、必要時才修補」以及 P4 姓名顧問任務、P6 姓氏資訊站的安排。請回覆「教學重組通過」或列出要修改的 P／E 編號。</div>
        </section>
        <footer>Generated from <code>${escapeHtml(sourceRelative)}</code> · source SHA-256 ${sha256File(sourceRelative)} · 本文件是教師審核用教學設計，不是學生投影片。</footer>
      </div>
    </main>
  </div>
  <script>
    const input = document.getElementById('coverage-search');
    const rows = [...document.querySelectorAll('#coverage-table tbody tr')];
    const empty = document.getElementById('coverage-empty');
    input.addEventListener('input', () => {
      const query = input.value.trim().toLowerCase();
      let visible = 0;
      rows.forEach((row) => { const match = !query || row.dataset.search.includes(query); row.hidden = !match; if (match) visible += 1; });
      empty.hidden = visible !== 0;
    });
  </script>
</body>
</html>
`;

const inventoryHeader = ['record_id', 'exercise_order', 'exercise_type', 'source_pages', 'periods', 'route', 'pbi_mode', 'classroom_activity', 'observable_evidence', 'audio_asset_ids', 'answer_status'];
const inventoryRows = [inventoryHeader.join(',')];
for (const item of source.exercises.slice().sort((a, b) => a.exercise_order - b.exercise_order)) {
  const c = coverage[item.record_id];
  const values = [item.record_id, item.exercise_order, item.exercise_type, `${printedPages(item)} | ${pages(item)}`, c.periods.join('|'), c.route, c.mode, c.activity, c.evidence, (item.audio_asset_ids || []).join('|'), item.answer_status || 'not_provided_in_source'];
  inventoryRows.push(values.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','));
}

const manifest = {
  package: 'lesson-01-teaching-design',
  generated_at: new Date().toISOString(),
  canonical_source: sourceRelative,
  canonical_source_sha256: sha256File(sourceRelative),
  lesson_title: source.lesson_title,
  schedule: { periods: 6, minutes_per_period: 50, total_minutes: 300 },
  teacher_feedback_applied: 'students preview before class; classroom prioritizes listening and speaking practice; vocabulary and sentence forms are just-in-time repair only',
  exercise_count: source.exercises.length,
  covered_exercise_count: Object.keys(coverage).length,
  pbi_modes: ['interpretive listening', 'interpersonal speaking', 'presentational speaking'],
  status: 'pending_teacher_review'
};

fs.writeFileSync(path.join(outputDir, 'index.html'), html);
fs.writeFileSync(path.join(outputDir, 'lesson-01-activity-coverage.csv'), `${inventoryRows.join('\n')}\n`);
fs.writeFileSync(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ outputDir, html: path.join(outputDir, 'index.html'), exerciseCount: source.exercises.length, coveredExerciseCount: Object.keys(coverage).length, sourceSha256: manifest.canonical_source_sha256 }, null, 2));
