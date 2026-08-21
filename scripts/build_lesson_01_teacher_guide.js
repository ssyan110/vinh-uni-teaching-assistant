#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const { toTeacherGuideChinese } = require('./simplify_chinese');

const projectRoot = path.resolve(__dirname, '..');
const projectConfig = JSON.parse(fs.readFileSync(path.join(projectRoot, 'project.config.json'), 'utf8'));
const lessonRoot = path.join(projectRoot, projectConfig.lesson_root);
const sourcePath = path.join(projectRoot, projectConfig.canonical_source);
const storyboardPath = path.join(lessonRoot, '10-design/storyboard/lesson-01-ppt-storyboard.csv');
const coveragePath = path.join(lessonRoot, '10-design/teaching-design/lesson-01-activity-coverage.csv');
const activityManifestPath = process.env.BOYA_ACTIVITY_MANIFEST || path.join(lessonRoot, '10-design/activity-package-manifest.json');
const teacherDir = process.env.BOYA_TEACHER_GUIDE_DRAFT_DIR || path.join(lessonRoot, '10-design/teacher-manual-draft');
const guidePath = path.join(teacherDir, 'lesson-01-teacher-guide.md');
const manifestPath = path.join(teacherDir, 'manifest.json');

function assertProductionGate() {
  execFileSync(process.env.BOYA_PYTHON || 'python3', [
    path.join(projectRoot, 'scripts/production_gate.py'),
    '--purpose', 'teacher-guide',
    '--output-dir', teacherDir,
  ], { stdio: 'inherit' });
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (ch === '"') {
      if (quoted && next === '"') {
        cell += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (ch === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && next === '\n') i += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  if (cell !== '' || row.length) {
    row.push(cell);
    if (row.some((value) => value.trim() !== '')) rows.push(row);
  }
  if (!rows.length) return [];
  const headers = rows.shift();
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ''])));
}

function csvRows(filePath) {
  return parseCsv(fs.readFileSync(filePath, 'utf8'));
}

function supportRowsFromActivityManifest(manifest) {
  const activityRows = manifest.activities.map((activity) => ({
    material_id: activity.activity_id,
    name: `${activity.title}活动包`,
    audience: '学生小组',
    periods: activity.periods.join('、'),
    source_refs: '按活动包与教师手册使用',
    contents: activity.student_materials.map((material) => material.name).join('、'),
    format: '可编辑 DOCX'
  }));
  return [
    {
      material_id: 'TM-01',
      name: '第一课教师手册',
      audience: '教师',
      periods: 'P1–P6',
      source_refs: '全课',
      contents: '每节流程、教材内容、音档、分组、教师提示、修补、评量与答案政策',
      format: 'DOCX／PDF'
    },
    {
      material_id: 'PREP-A',
      name: '课前预习卡 A：姓名',
      audience: '学生',
      periods: 'P1–P4',
      source_refs: '第一课前半部分',
      contents: '快速阅读、音档接触、姓名资料、个人问题',
      format: '可列印 PDF／可编辑 DOCX'
    },
    {
      material_id: 'PREP-B',
      name: '课前预习卡 B：姓氏',
      audience: '学生',
      periods: 'P5–P6',
      source_refs: '第一课后半部分',
      contents: '本国姓氏比较、历史人物资料、朗读准备',
      format: '可列印 PDF／可编辑 DOCX'
    },
    ...activityRows,
    {
      material_id: 'ASSESS-01',
      name: '同伴回馈与短讲评量表',
      audience: '学生／教师',
      periods: 'P3–P6',
      source_refs: '成段表达与小组任务',
      contents: '信息、互动、可理解度、理由／证据与重做目标',
      format: '可列印 PDF／可编辑 DOCX'
    },
    {
      material_id: 'ASSESS-02',
      name: '出口卡与“我能”检核',
      audience: '学生／教师',
      periods: 'P1–P6',
      source_refs: '每节课末',
      contents: '本节表现、听力信息、仍需确认的问题与下一步目标',
      format: '可列印 PDF／可编辑 DOCX'
    },
    {
      material_id: 'ASSET-01',
      name: '音档与版本清单',
      audience: '教师／制作',
      periods: 'P1–P6',
      source_refs: '1-1–1-6、2-1–2-5',
      contents: '音档编号、课堂用途、投影片对应、嵌入状态与版本记录',
      format: 'JSON／CSV'
    }
  ];
}

function escapePipe(value) {
  return String(value || '—').replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}

function table(headers, rows) {
  const output = [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map(escapePipe).join(' | ')} |`),
  ];
  return output.join('\n');
}

function bulletList(items) {
  return items.map((item) => `- ${item}`).join('\n');
}

const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const storyboardRows = csvRows(storyboardPath);
const coverageRows = csvRows(coveragePath);
const activityManifest = JSON.parse(fs.readFileSync(activityManifestPath, 'utf8'));
const supportRows = supportRowsFromActivityManifest(activityManifest);
const sourceHash = crypto.createHash('sha256').update(fs.readFileSync(sourcePath)).digest('hex');

const periodPlans = [
  {
    id: 'P1',
    title: '從預習證據到聽懂姓名對話',
    canDo: '我能介紹姓名的意思和來歷；我能聽懂對話的主要信息，並說出聽力證據。',
    source: '教材 pp.2–5；PDF pp.13–16；E01-001–E01-003、E01-034、E01-035；音檔 1-2、1-3。',
    focus: '姓名、名字、姓、名、意思、來歷、讀音；先抓大意，再找細節。',
    teacherMoves: [
      '先回收預習卡，讓學生互相交換資料；不先把姓名詞語逐字講完。',
      '音檔 1-2 先完成理解，再要求學生回答「你從哪裡聽到的？」；答案要有證據。',
      '對學生的姓名自述只修補最影響理解的讀音、詞序或關鍵詞，不逐句改錯。',
      '把 E01-003 轉成兩輪訪談，觀察學生是否能回答、追問、接住對方的回答。',
    ],
    evidence: '每人一張姓名資訊卡；每組兩個聽力答案及證據；每人完成一次四輪訪談；出口卡一張。',
    repair: '全班共同卡點只選一個，最多 3 分鐘：先用姓名卡示範，再讓學生重新說一次。未預習者使用教師準備的虛構姓名卡加入同伴活動。',
    exit: '一個姓名理由＋一個從音檔聽到的信息。',
  },
  {
    id: 'P2',
    title: '從跟讀、重建到句式任務',
    canDo: '我能先聽懂句子，再在實際情境中用四個句式完成對話或說明。',
    source: '教材 pp.4、6–7；PDF pp.15、17–18；E01-004、E01-005、E01-009–E01-012；音檔 1-4、1-5。',
    focus: '先聽、跟讀、替換，再用牙疼、接孩子、姓名選擇等情境完成句式任務。',
    teacherMoves: [
      '跟讀只作為進入互動的短支架；每次跟讀後立即換成學生自己的信息。',
      '重建對話接受合理改寫，優先看主要信息、回應和追問是否完整。',
      '句式不做長篇定義；先用情境說出目的，再用教材的對話、改寫和情境題完成任務。',
      '每個句式都要留下可聽見的產出；最後讓學生選一句不清楚的話，根據同伴回饋再說一次。',
    ],
    evidence: '每人至少三句替換句；一次不看稿對話重建；四個句式各完成教材任務；一次重做。',
    repair: '學生說不出時，先給情境或關鍵詞，不直接給完整答案；完成後換同伴再做一次。',
    exit: '用一個句式完成一個姓名情境回應。',
  },
  {
    id: 'P3',
    title: '從段落理解到諧音短講',
    canDo: '我能用兩遍聽力找出關鍵信息和證據；我能用例子說明同音字與姓名選擇。',
    source: '教材 pp.5、7–8；PDF pp.16、18–19；E01-006–E01-008、E01-013–E01-015；音檔 1-6。',
    focus: '第一遍抓關鍵信息；第二遍判斷並找證據；同音、吉利、姓名選擇；60 秒成段表達。',
    teacherMoves: [
      '播放第一遍時不暫停、不要求逐字聽寫；學生只完成關鍵空格。',
      '第二遍要求每個判斷附一個詞或細節作為依據；先小組協商，再全班核對。',
      '文化討論不給唯一文化答案，要求學生說出例子、理由，或引用短文／音檔。',
      '短講先給「例子＋說明」兩點支架；回饋只選一個面向，學生必須重做。',
    ],
    evidence: '填空與判斷證據；小組立場和追問；一張觀點—例子表；一次 60 秒短講；出口反思。',
    repair: '若多數學生抓不到主旨，教師只重播關鍵片段並給人物／態度二選一，再回到證據交換，不改成講解課。',
    exit: '一個聽懂的內容＋一個仍想確認的問題。',
  },
  {
    id: 'P4',
    title: '起名兒公司：訪問、協商、提案',
    canDo: '我能問清楚命名要求；我能提出中文姓名，說明讀音、字義和理由，並回答客戶追問。',
    source: '教材 p.9；PDF p.20；E01-016–E01-018、E01-035。',
    focus: '命名條件：性別、字數、讀音、字義、風格與文化考量；提案、理由、追問。',
    teacherMoves: [
      '先展示任務結果和成功標準，再發客戶卡；不要先講一套「正確中文名」。',
      '要求顧問先問條件，再提出姓名；如果條件衝突，學生必須說明如何取捨。',
      '開放答案用「是否符合客戶條件、理由是否清楚、能否互動」評估，不製造唯一答案。',
      '報告後一定安排一個澄清問題和一次重做，讓學生把回饋轉成可聽懂的說法。',
    ],
    evidence: '客戶需求卡；命名條件排序；90 秒提案＋客戶追問；兩個演員中文名與理由；2 分鐘調查報告。',
    repair: '學生缺少資料時，提供虛構客戶卡和三個字義選項；仍由學生決定姓名和理由，不由教師代答。',
    exit: '一個重要的命名條件＋理由。P4 結束發放預習卡 B。',
  },
  {
    id: 'P5',
    title: '從本國姓氏比較到姓氏對話',
    canDo: '我能介紹本國常見姓氏；我能聽懂姓氏對話的主旨和細節，並追問同伴。',
    source: '教材 pp.10–12；PDF pp.21–23；E01-019–E01-023；音檔 2-1、2-2、2-3、2-4。',
    focus: '姓、名、姓氏、稱呼；本國與中國姓名比較；主旨、細節、替換與對話重建。',
    teacherMoves: [
      '以預習卡 B 的本國資料開場，讓文化比較先從學生資料出發。',
      '聽力先讓學生協商主旨和兩個細節，再全班核對；不要把對話逐句翻譯。',
      '替換句改用班級真實姓氏、名字和稱呼，讓教材句子立即變成互動。',
      '重建對話時看訊息和反應，不要求逐字背誦；用同伴回饋促成第二次表達。',
    ],
    evidence: '姓氏比較表；主旨與兩個細節；一次四輪互動；三句替換句；一次不看稿對話重建。',
    repair: '若學生沒有本國資料，使用同學或教師提供的三張姓氏比較卡；只補足完成任務所需的詞。',
    exit: '越南和中國姓氏或姓名的一個相同點／不同點＋一個追問。',
  },
  {
    id: 'P6',
    title: '姓氏信息与成段报告',
    canDo: '我能从短文和音频找出姓氏信息；我能总结对话、介绍姓氏，并报告一位历史人物。',
    source: '教材 pp.12–16；PDF pp.23–27；E01-024–E01-033；音檔 2-5。',
    focus: '问题、原因、结果；单姓、复姓、姓氏来源；五个姓的听辨；对话总结与人物介绍。',
    teacherMoves: [
      '按活动卡安排任务：句式任务、文化比较、课文重点记录、姓氏读法和对话总结；不要求学生轮换找卡。',
      '音频 2-5 第一遍只抓关键内容，第二遍找细节；共同卡点最多做 3 分钟修补。',
      '两人一组阅读课文《中国人的姓名》，每人先写下一个重点，再用自己的话告诉同伴；同伴记录在“我听到的重点”表格里。',
      '先让学生用五句话总结对话，再分组报告一个重点；最后用 Can-Do 检核收束整课。',
    ],
    evidence: '填空與判斷證據；三個句式任務；文化比較回答；課文資料重述；每人讀五個姓並由同學記錄；五句對話總結；人物介紹與小組報告。',
    repair: '若學生缺少資料，使用活動卡上的固定問題和姓名清單；只補足完成任務所需的詞，不改成逐句講解。',
    exit: '完成「我能……」檢核，說出本課最能使用的一個表達。',
  },
];

const sourceMap = [
  ['聽說（一）／起名兒難', '教材 pp.1–9；PDF pp.12–20', 'P1–P4', '姓名、名字、起名兒、同音與姓名選擇'],
  ['聽說（二）／姓氏趣談', '教材 pp.10–16；PDF pp.21–27', 'P5–P6', '本國與中國姓氏、稱呼、單姓與複姓'],
  ['音檔', '1-1–1-6、2-1–2-5', '預習＋課堂', '音檔標籤以教材標示為準；播放次數依活動任務決定'],
];

const lessonLanguageRules = [
  '學生看到的 PPT、活動卡和預習卡全部使用中文；目標內容採用教材的簡體中文。',
  '教師課堂以中文運作：先做任務，再用短句修補；課堂時間集中用於聽力理解、同儕互動和口語任務。',
  '每一個活動都以可觀察的口語或理解證據作為評量依據。',
];

const lessonTeachingFocus = [
  ['聽力理解', '第一遍抓大意，第二遍找細節與證據；學生要說明答案從哪裡聽到。'],
  ['口語互動', '介紹、提問、回答、追問、澄清與協商；每次活動都留下可聽見的產出。'],
  ['成段表達', '用例子、理由和簡單順序完成短講、報告或姓名提案。'],
  ['語言修補', '只處理影響理解或任務完成的詞語、讀音、語序和句式，修補後立即重做。'],
];

const teacherPrompts = [
  '先看問題，再聽。',
  '第一遍先抓大意，第二遍找證據。',
  '你從哪裡聽到的？',
  '請再說一次。',
  '你的意思是……嗎？',
  '請問你為什麼這樣想？',
  '換一個同學，再說一次。',
  '先問清楚，再提出姓名。',
];

const assessmentRows = [
  ['詮釋理解', '能抓主旨／關鍵細節，並指出音檔或短文中的依據。', '0：沒有可用信息；1：抓到零散信息；2：大致正確並有一項依據；3：主旨、細節和依據都清楚。'],
  ['人際互動', '能回答、追問、澄清或接住同伴的回答。', '0：無法維持互動；1：只能回答；2：能回答並追問；3：能依對方信息追問、澄清並延續對話。'],
  ['表達呈現', '能用例子／理由組織 30–120 秒的可理解表達。', '0：無法完成；1：片段表達；2：信息大致完整；3：結構清楚、理由具體、聽者容易理解。'],
  ['任務完成', '能完成角色、條件、資料或重做要求。', '0：未完成；1：完成部分；2：完成主要要求；3：完成主要要求並能根據回饋改善。'],
];

const periodSchedule = (periodId) => storyboardRows
  .filter((row) => row.period === periodId)
  .map((row) => {
    const isReadingRecord = row.support_asset.includes('03·课文重点记录卡');
    return [
      row.time,
      row.purpose,
      [row.source_refs, row.audio_track].filter(Boolean).join('；') || '—',
      isReadingRecord ? '拿出03·课文重点记录卡，阅读短文，写下一个重点，再告诉同伴。' : row.student_instruction_zh,
      isReadingRecord ? '两人一组' : row.grouping,
      isReadingRecord ? '一份自己写下的重点和一份听到的重点记录' : row.student_output,
      isReadingRecord ? '活动四《姓氏信息站》：03·课文重点记录卡' : row.support_asset,
    ];
  });

const coverageTableRows = coverageRows.map((row) => [
  row.record_id,
  row.exercise_order,
  row.source_pages,
  row.periods,
  row.pbi_mode,
  row.classroom_activity.replace('課堂以 jigsaw 找到問題答案與文本依據', '課堂以資訊拼圖完成問題回答與文本證據整理'),
  row.observable_evidence,
  row.audio_asset_ids || '—',
  row.answer_status === 'not_provided_in_source' ? '來源未提供；依音檔／文本證據核對' : row.answer_status,
]);

const supportTableRows = supportRows.map((row) => [
  row.material_id,
  row.name
    .replace('同儕回饋與短講 rubric', '同儕回饋與短講評量表')
    .replace('Exit tickets 與 Can-Do 檢核', '出口卡與「我能」檢核')
    .replace('音檔與版本 manifest', '音檔與版本清單'),
  row.audience,
  row.periods,
  row.source_refs,
  row.contents
    .replace('PPT slide', '投影片對應')
    .replace('SHA-256、備援策略', '版本與備援資訊'),
  row.format
    .replace('DOCX source + printable PDF', '可編輯 DOCX／可列印 PDF')
    .replace('JSON／CSV internal', '內部清單'),
]);

const sourceSectionRows = sourceMap;

let markdown = '';
markdown += '# 第一課〈中國人的姓名〉教師手冊\n\n';
markdown += '本手冊提供第一課 P1–P6 的課堂流程、教材對應、活動規格、教師觀察重點、評量方式與備課材料。\n\n';
markdown += '## 文件資訊\n\n';
markdown += table(['欄位', '目前狀態'], [
  ['文件版本', 'v0.1'],
  ['文件狀態', '待審核'],
  ['適用範圍', 'P1–P6；6 節／300 分鐘'],
  ['教師手冊語言', '簡體中文；越南文僅在必要時用於說明'],
  ['學生可見語言', '全中文；目標內容採用教材簡體字'],
  ['答案政策', '教材掃描頁沒有提供練習答案；本文件不自行補寫唯一答案'],
  ['建立日期', '2026-08-20'],
  ['審核人／日期', '待填'],
  ['審核決定', '待填：批准／需修訂'],
]);
markdown += '\n\n';

markdown += '## 1. 課程與時間資料\n\n';
markdown += table(['項目', '規格'], [
  ['課程', '《博雅漢語聽說：中級衝刺篇 I》'],
  ['課次', '第一課：中國人的姓名'],
  ['學生起點', '已完成《博雅漢語聽說：初級起步篇》一、二冊；本課進入中級衝刺'],
  ['課程技能', '聽、說為主；閱讀只作為理解和口語任務的輸入'],
  ['教學取向', 'ACTFL Proficiency-Based Instruction；以詮釋理解、人際互動、表達呈現組織任務'],
  ['單節長度', '50 分鐘'],
  ['本課總量', '6 節 × 50 分鐘 = 300 分鐘'],
  ['學校上課安排', '一次上課 4 節 = 200 分鐘；本課建議第一次完成 P1–P4，第二次完成 P5–P6（100 分鐘）'],
  ['教材範圍', '教材印刷頁 1–16；來源 PDF pp.12–27；63 個來源區段、34 個詞語記錄、7 個句式、5 個文本／對話、35 項練習、11 個音檔'],
  ['休息', '50 分鐘教學時間不包含休息；若學校安排休息，教師在 P1–P4 的 200 分鐘中自行插入，不壓縮已批准的教學分鐘'],
]);
markdown += '\n\n';

markdown += '## 2. 教學目標與教學重點\n\n';
markdown += '### 教學目標\n\n';
markdown += '本課結束時，學生能聽懂姓名與姓氏主題的主要信息，能用中文完成介紹、提問、追問、協商和短講，並以音檔、文本或訪談資料支持自己的回答。\n\n';
markdown += '### 教學重點\n\n';
markdown += table(['面向', '教學重點'], lessonTeachingFocus);
markdown += '\n\n';
markdown += '### 課堂組織原則\n\n';
markdown += bulletList(lessonLanguageRules) + '\n\n';
markdown += '課堂流程採用「預習、任務、修補、重做」：學生先使用教材內容完成聽說活動，教師依實際表現處理最影響理解或互動的語言，再安排一次重做。\n\n';

markdown += '## 3. 本課「我能」目標與最終表現\n\n';
markdown += table(['模式', '學生最後能做什麼', '可見證據'], [
  ['詮釋理解', '我能聽懂姓名、姓氏對話或短文的主要信息和關鍵細節，並找出音檔／文本依據。', 'E01-001、002、006、007、014、020、024、025、029；答案旁有關鍵詞或文本位置'],
  ['人際互動', '我能介紹自己的姓名／姓氏，詢問、回答、追問、澄清，並和同伴協商命名條件。', 'E01-003、004、005、008–013、016、019、021–023、026–028、033、034'],
  ['表達呈現', '我能用例子、理由和簡單結構說明姓名選擇、同音字、姓氏文化或歷史人物。', 'E01-015、016–018、030–032、035；30–120 秒口語產出'],
]);
markdown += '\n\n### 最終任務：起名兒公司\n\n';
markdown += '學生以三至四人為一組，扮演命名顧問和客戶：先問清楚性別、字數、讀音、字義、風格等要求，再提出中文姓名，說明至少兩個理由，最後回答客戶的一個追問。評量重點是條件理解、理由表達、互動回應與語言可理解度。\n\n';
markdown += table(['成功標準', '教師觀察'], [
  ['問清楚', '學生有提出問題，並能依客戶回答調整提案。'],
  ['提出姓名', '姓名能讀出來，並有字義或音的說明。'],
  ['說明理由', '理由和客戶條件有關，不只是說「好聽」。'],
  ['回答追問', '能回答、澄清或換一種說法，不立即放棄互動。'],
  ['可理解', '即使有形式錯誤，聽者仍能理解主要信息。'],
]);
markdown += '\n\n';

markdown += '## 4. 教材來源與教師控制圖\n\n';
markdown += table(['來源區段', '頁碼', '課堂節次', '本課用途'], sourceSectionRows);
markdown += '\n\n';
markdown += '### 語言材料的使用原則\n\n';
markdown += bulletList([
  '34 個詞語記錄全部保留在教材 coverage；不要求教師在課堂逐一講解，也不要求學生在課前查完所有詞語。',
  '優先修補會阻礙任務的詞：姓名、名字、姓、名、意思、來歷、讀音、起名兒、同音、姓氏、稱呼、尊稱、單姓、複姓、原因、結果、理由。',
  '句式以用途教學：總不能……吧、……才怪呢、到時候、話說回來、不然、是……還是……、怎麼……怎麼……。先讓學生在情境中完成任務，再用一句話確認用法。',
  '詞語或句式若不是當下完成任務所需，不暫停全班處理；記錄在出口卡和教師觀察表，作為下一節修補依據。',
]) + '\n\n';

markdown += '## 5. 课前预习、热身活动与课后任务\n\n';
markdown += '### 預習卡 A：姓名（P1 前發放）\n\n';
markdown += table(['學生要完成', '最低完成標準', '課堂怎麼用'], [
  ['快速看教材 pp.1–9；接觸音檔 1-1–1-6；不要求逐字翻譯。', '至少知道主題，並標出一個聽不清／看不懂的地方。', 'P1 交換「我知道的」和「我想確認的」，教師依卡片決定短修補。'],
  ['準備自己的姓名意思、來歷和讀音。', '完成一張姓名資訊卡；沒有資料時可寫「我想查……」。', 'P1 自述、姓名訪談和後續命名任務。'],
  ['訪問至少三位中文使用者的姓名意思或來歷。', '留下三筆資料或三個可追問問題。', 'P1 比較資料；P4 轉成調查報告。'],
]);
markdown += '\n\n';
markdown += '### 預習卡 B：姓氏（P4 結束時發放）\n\n';
markdown += table(['學生要完成', '最低完成標準', '課堂怎麼用'], [
  ['看教材 pp.10–16；接觸音檔 2-1–2-5。', '知道姓氏主題，並標出一個問題。', 'P5 直接交換比較資料，不用全班重新講背景。'],
  ['比較本國常見姓／名及其常見原因。', '至少準備兩個姓氏和一個原因。', 'P5 姓氏比較訪談。'],
  ['準備一位歷史人物；預讀單姓／複姓並練習讀出來。', '一張人物研究卡＋兩個能讀出的姓氏。', 'P6 資訊站、朗讀站和 30 秒人物介紹。'],
]);
markdown += '\n\n';
markdown += '### 未預習學生的進場方案\n\n';
markdown += '教師準備少量虛構姓名卡／姓氏比較卡，讓未預習者先完成「看圖或卡片—聽一次—說一句—問一題」，再加入同伴輪換。補位資料只用於啟動課堂活動，教材練習仍依本手冊執行。\n\n';

markdown += '### 課後任務與下一節預習\n\n';
markdown += table(['完成時點', '學生任務', '帶到課堂的資料'], [
  ['P1 後', '補齊姓名資訊卡；記錄一個聽力卡點和一個想追問的問題。', '姓名意思、來歷、讀音與一個問題。'],
  ['P4 後', '完成預習卡 B；準備兩個本國常見姓氏和一位歷史人物。', '姓氏比較資料、人物研究卡與朗讀準備。'],
  ['P6 後', '完成「我能」檢核，選出下一課最想改進的一個聽說行為。', '出口卡；教師用於下一課開場修補。'],
]);
markdown += '\n\n';

markdown += '## 6. 六節教學計畫與教學範本\n\n';
markdown += '以下每節都是完整 50 分鐘的教學單位。第一次到校上課使用 P1–P4，共 200 分鐘；第二次使用 P5–P6，共 100 分鐘。表中的時間是有效教學分鐘，PPT 只依本手冊需要顯示學生任務，不把教師提示放到學生畫面。\n\n';

for (const plan of periodPlans) {
  markdown += `### ${plan.id}｜${plan.title}\n\n`;
  markdown += table(['欄位', '內容'], [
    ['本節「我能」目標', plan.canDo],
    ['教材與練習', plan.source],
    ['學習重點', plan.focus],
    ['學生應留下的證據', plan.evidence],
    ['卡住時的最短修補', plan.repair],
    ['出口任務', plan.exit],
  ]);
  markdown += '\n\n';
  markdown += '**教學步驟建議與教師提示**\n\n' + bulletList(plan.teacherMoves) + '\n\n';
  markdown += '**50 分鐘教學範本（與投影片流程表對齊）**\n\n';
  markdown += table(['時間', '活動', '教材／音檔', '學生怎麼做', '分組', '可見產出', '配套'], periodSchedule(plan.id));
  markdown += '\n\n';
}

markdown += '## 7. 活動執行規格\n\n';
markdown += '### 7.1 姓名訪談旋轉（P1–P2）\n\n';
markdown += bulletList([
  '三人一組：訪問者、回答者、觀察者；每輪後換角色。',
  '訪問順序：姓名怎麼讀？有什麼意思？從哪裡來？你喜歡這個名字嗎？',
  '觀察者只記一個好的追問或一個需要重說的句子，不做大量同儕糾錯。',
  '第二輪必須換一個同伴；教師收一張資訊卡，確認每個人都有口語產出。',
]) + '\n\n';
markdown += '### 7.2 聽力證據流程（P1、P3、P5、P6）\n\n';
markdown += bulletList([
  '播放前：學生先看問題，圈出要找的是人物、時間、原因、態度或結果。',
  '第一遍：不暫停，抓主旨或關鍵信息；不要求逐字聽寫。',
  '第二遍：找細節，為答案寫一個詞、一個短語或一個明確片段。',
  '小組協商後才全班核對；教師問「你從哪裡聽到的？」而不是先公布答案。',
  '若需要第三次，只回放造成誤解的短片段，不能把第三次變成教師逐句翻譯。',
]) + '\n\n';
markdown += '### 7.3 起名兒公司（P4）\n\n';
markdown += table(['步驟', '學生操作', '教師觀察'], [
  ['1. 客戶說明', '閱讀客戶卡，說出自己的要求。', '學生是否能抓到性別、字數、音、義或風格等條件。'],
  ['2. 顧問訪問', '顧問至少問兩個問題，確認客戶真正重視什麼。', '是否有追問，而不是直接猜姓名。'],
  ['3. 條件協商', '把條件排序；遇到衝突時說明取捨。', '是否能說出理由，並回應客戶反應。'],
  ['4. 姓名提案', '提出姓名，說明讀音、字義和至少兩個理由。', '是否符合客戶條件；聽者是否能理解。'],
  ['5. 客戶追問與重做', '客戶問一題；顧問回答後選一句重說。', '是否能澄清或換一種說法。'],
]);
markdown += '\n\n';
markdown += '### 7.4 姓氏信息活动卡（P6）\n\n';
markdown += table(['活动卡', '学生操作', '完成证据'], [
  ['01·句式任务卡', '两人一组；每个人完成三个句式任务，同伴按卡片回答。', '每个人说三句话，同伴完成三次回答。'],
  ['02·文化比较卡', '两人一组；用卡片上的两个问题比较姓名顺序和姓名产生时间。', '每人说出一个比较结果。'],
  ['03·课文重点记录卡', '两人一组；阅读短文，每人先写下一个重点，再轮流告诉同伴；同伴记录在“我听到的重点”表格里。', '每人一个书面重点和一份听到的重点记录。'],
  ['07·姓氏读法卡', '两人一组；每人读五个姓，同伴写下听到的五个姓。', '五个姓的记录和是否认识这些姓的回答。'],
  ['08·对话总结记录', '两人一组；先写下对话重点，再用五句话总结并报告。', '一份对话总结和一段口头报告。'],
]);
markdown += '\n活动卡按活动分开提供；每张卡都可以直接发给学生使用。\n\n';
markdown += '### 7.5 回饋與重做\n\n';
markdown += '回饋只回答三個問題：聽者聽懂了什麼？哪一句需要再說？下一次要改哪一點？學生在同一節內重做一次；教師不把全部錯誤列出來，也不以語法正確率取代任務完成。\n\n';

markdown += '## 8. 教師可直接使用的中文課堂語句\n\n';
markdown += '教師在活動轉場、提問與回饋時可使用下列課堂語句。\n\n';
markdown += table(['課堂功能', '教師可說'], [
  ['啟動預習', '請和同伴交換資料。先說你知道的，再說你想確認的。'],
  ['聽力第一遍', '先抓大意，不用每個字都寫下來。'],
  ['要求證據', '你從哪裡聽到的？請指出一個詞或一個細節。'],
  ['維持中文互動', '請再說一次。／你的意思是……嗎？'],
  ['追問', '你為什麼這樣想？／還有別的原因嗎？'],
  ['轉換同伴', '換一個同學，再說一次。'],
  ['收束活動', '請留下你們的答案、理由和一個問題。'],
  ['重做', '請選一句不太清楚的話，讓同伴再聽一次。'],
]);
markdown += '\n\n';
markdown += '**本課教師必須避免的做法**：先花大量時間講完所有詞語；逐字翻譯對話；每一題立刻公布答案；把句式改成語法定義投影片；在學生還沒有使用前就糾正所有形式。\n\n';

markdown += '## 9. 形成性評量與記錄方式\n\n';
markdown += '教師不需要每一輪都打分。每節選擇一到兩組作重點觀察，其他學生用同儕回饋和出口卡留下證據。正式任務以 0–3 記錄，分數描述表達表現，不是教材答案。\n\n';
markdown += table(['面向', '看什麼', '0–3 記錄標準'], assessmentRows);
markdown += '\n\n';
markdown += '### Exit ticket 最低欄位\n\n';
markdown += bulletList([
  '今天我能……（一個可觀察的聽／說行為）。',
  '我聽到／說到的一個例子是……',
  '我還想確認……',
  '下一節我先改進……（一個語言目標）。',
]) + '\n\n';

markdown += '## 10. 教材練習解答與評量說明\n\n';
markdown += bulletList([
  '本課掃描頁沒有提供練習答案。聽力理解、判斷、填空和閱讀題以核准音檔／文本證據核對。',
  '開放題、文化討論、姓名提案和報告依任務完成、理由／證據、互動與可理解度評量。',
  '教師示例標示為「示例」，並與教材答案分開呈現。',
  '教師版答案驗證表如另行製作，逐題附來源頁、音頻編號或文本依據。',
]) + '\n\n';

markdown += '## 11. 配套材料清單（由本手冊衍生）\n\n';
markdown += table(['ID', '材料', '使用者', '節次', '來源／練習', '內容', '格式'], supportTableRows);
markdown += '\n\n';
markdown += '後續配套材料依本手冊的活動編號、學生產出與評量欄位製作。\n\n';

markdown += '## 12. 教材練習對應表\n\n';
markdown += '本表列出第一課 35 項教材練習及其課堂實施方式。\n\n';
markdown += table(['ID', '序', '教材頁', '節次', '能力模式', '課堂活動', '可觀察證據', '音檔', '答案狀態'], coverageTableRows);
markdown += '\n\n';

markdown += '## 13. 審核記錄\n\n';
markdown += table(['檢查項目', '狀態'], [
  ['六節課程的時間、流程與出口任務', '待審核'],
  ['教材練習與活動對應', `${coverageRows.length}/35 已確認`],
  ['音檔用途與 track 對應', `${source.audio_map.length}/${source.audio_map.length} 已確認`],
  ['預習卡、活動卡與評量材料規格', '已列入配套材料清單'],
  ['教師手冊批准', '待審核'],
]);
markdown += '\n\n';
markdown += table(['審核人', '審核日期', '決定', '修訂記錄'], [['', '', '', '']]);
markdown += '\n\n';

assertProductionGate();
fs.mkdirSync(teacherDir, { recursive: true });
fs.writeFileSync(guidePath, `${toTeacherGuideChinese(markdown.trim())}\n`, 'utf8');

const manifest = {
  package: 'boya-intermediate-lesson-01-teacher-guide-content-master',
  status: 'pending_teacher_guide_review',
  lesson_id: source.lesson_id,
  lesson_number: source.lesson_number,
  lesson_title: source.lesson_title,
  canonical_source: path.relative(projectRoot, sourcePath),
  canonical_source_sha256: sourceHash,
  period_count: periodPlans.length,
  minutes_per_period: 50,
  total_minutes: 300,
  meeting_plan: [
    { meeting: 1, periods: ['P1', 'P2', 'P3', 'P4'], instructional_minutes: 200 },
    { meeting: 2, periods: ['P5', 'P6'], instructional_minutes: 100 },
  ],
  source_section_count: source.sections.length,
  vocabulary_record_count: source.vocabulary.length,
  grammar_pattern_count: source.grammar_patterns.length,
  text_dialogue_count: source.texts_dialogues.length,
  exercise_count: source.exercises.length,
  coverage_count: coverageRows.length,
  audio_track_count: source.audio_map.length,
  support_material_count: supportRows.length,
  student_language_policy: '学生端材料使用中文；目标内容与教师手册使用简体中文',
  teacher_guide_language: '简体中文',
  vietnamese_explanation_policy: '仅在必要时用于说明',
  reference_manual_style: '参考正式教师手册的课次目标、教学重点、课时范本、练习解答与课后预习结构',
  html_required: false,
  downstream_order: [
    'teacher-guide-approval',
    'prep-cards-and-activity-cards',
    'internal-ppt-storyboard-recheck',
    'visual-storyboard-recheck',
    'native-pptx',
    'audio-and-speaker-notes',
    'qa-and-rehearsal',
  ],
  output_files: ['lesson-01-teacher-guide.md', 'manifest.json'],
};
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({
  guidePath,
  manifestPath,
  periodCount: periodPlans.length,
  coverageCount: coverageRows.length,
  audioTrackCount: source.audio_map.length,
  supportMaterialCount: supportRows.length,
  sourceSha256: sourceHash,
}, null, 2));
