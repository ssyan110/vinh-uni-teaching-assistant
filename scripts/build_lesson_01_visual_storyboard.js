const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const projectRoot = path.resolve(__dirname, '..');
const sourceRelative = 'work/boya-intermediate/extractions/structured-lesson-01.json';
const storyboardRelative = 'output/boya-intermediate/lesson-01/storyboard/lesson-01-ppt-storyboard.csv';
const outputRelative = 'output/boya-intermediate/lesson-01/visual-storyboard';
const sourcePath = path.join(projectRoot, sourceRelative);
const storyboardPath = path.join(projectRoot, storyboardRelative);
const outputDir = path.join(projectRoot, outputRelative);
const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const storyboardText = fs.readFileSync(storyboardPath, 'utf8');
fs.mkdirSync(outputDir, { recursive: true });

function sha256File(relativeTarget) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(projectRoot, relativeTarget))).digest('hex');
}

function parseCsvLine(line) {
  const values = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      values.push(value);
      value = '';
    } else {
      value += character;
    }
  }
  values.push(value);
  return values;
}

function parseCsv(text) {
  const lines = text.trimEnd().split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines.shift());
  return lines.map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}

function csv(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function md(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}

const slides = parseCsv(storyboardText);
if (slides.length !== 69) throw new Error(`Expected 69 storyboard rows, found ${slides.length}`);

const designTokens = {
  direction: 'Soft Structuralism × Editorial Split：像產品發表會一樣安靜、清楚、留白充足',
  canvas: '16:9；1920×1080；靜態 PPTX',
  background: '#F7F8FA 霧白',
  ink: '#111827 深墨色',
  secondary: '#667085 灰藍',
  accent: '#2F6BFF 電光藍',
  accentWarm: '#FF6B57 暖珊瑚，只作少量提示',
  darkSurface: '#0F172A 深色段落頁',
  primaryFont: 'SimHei／黑体；fallback Microsoft YaHei／微软雅黑',
  displayFont: 'SimHei Bold；不用裝飾性英文字體',
  titleSize: '56–76 pt',
  taskSize: '36–46 pt',
  bodySize: '28–32 pt',
  captionSize: '22–24 pt；只用於必要來源或音檔標籤',
  spacing: '以 8 pt 為基本單位；頁面保留至少 12% 外圍留白',
  imagePolicy: '圖片必須承擔情境、比較、證據或記憶功能，不使用無意義裝飾圖',
  rightsPolicy: '優先自製圖形、原創生成圖或確認可商用素材；每個素材先記錄來源與授權狀態',
  studentCopyPolicy: '學生畫面只寫學生現在要做的事情；不放能力目標、教學分類、設計標籤或教師備註；用初級到中級常用詞，新的課文詞只在需要時出現'
};

const textBudgets = {
  hero: '主標 8–12 字；副標最多 1 行',
  objective: '只顯示今天要做的 3 個短動作；每個不超過 6 字',
  task: '主標 12 字內；操作最多 2 行；步驟最多 3 個短句',
  listening: '每頁最多 3 題或 3 個證據欄；不放完整解析',
  dialogue: '每頁最多 2 句；其餘內容由音檔與同伴互動完成',
  compare: '只保留兩組選項或一條比較軸；每組最多 10 字',
  present: '主標 12 字內；只保留 3 個提示詞與時間',
  exit: '一句自評＋一個短回答；不放段落說明'
};

const imagePlan = [
  { id: 'IMG-01', name: '姓名視覺封面', kind: '原創攝影／生成圖', brief: '不同姓名卡、人物剪影與桌面光影；不使用可辨識個資', rights: '待製作；優先原創', use: '封面、課程開場' },
  { id: 'IMG-02', name: '姓名卡與字義', kind: '自製平面圖形', brief: '姓名卡、筆跡、字義標籤與簡體字構成', rights: '自製', use: '姓名預習與自我介紹' },
  { id: 'IMG-03', name: '小組對話場景', kind: '原創攝影／生成圖', brief: '學生圍桌交換資訊，畫面保留空間給任務提示', rights: '待製作；優先原創', use: '小組合作與課堂規則' },
  { id: 'IMG-04', name: '姓名調查採訪', kind: '原創攝影／生成圖', brief: '採訪、記錄、手機或紙卡；用於田野資料交換', rights: '待製作；優先原創', use: '調查與預習回收' },
  { id: 'IMG-05', name: '聽力聲波與對話線索', kind: '自製圖形', brief: '聲波、對話氣泡、關鍵詞標記，不模擬播放器介面', rights: '自製', use: '所有聽力任務' },
  { id: 'IMG-06', name: '兩人互動肖像', kind: '原創攝影／生成圖', brief: '兩位說話者的視線、手勢與空間關係', rights: '待製作；優先原創', use: '訪談、替換、對話重建' },
  { id: 'IMG-07', name: '證據牆', kind: '自製圖形', brief: '答案、關鍵詞、音檔證據以視覺路徑連接', rights: '自製', use: '聽力證據與回饋' },
  { id: 'IMG-08', name: '語意選擇卡', kind: '自製圖形／生成圖', brief: '兩個意思相近的畫面或物件對照，避免大段文字選項', rights: '自製或原創', use: '相近意思選擇' },
  { id: 'IMG-09', name: '訪談角色輪換', kind: '自製圖形', brief: '採訪者、回答者、觀察者三個視覺角色', rights: '自製', use: '角色輪換與同儕觀察' },
  { id: 'IMG-10', name: '句式情境卡', kind: '原創攝影／生成圖', brief: '限制、反駁、轉折等生活情境的三格小場景', rights: '待製作；優先原創', use: '句式資訊站' },
  { id: 'IMG-11', name: '諧音與姓名文化', kind: '自製字形圖形', brief: '同音字、音義分岔與姓名選擇的視覺化', rights: '自製', use: '諧音文化與立場討論' },
  { id: 'IMG-12', name: '閱讀證據桌面', kind: '原創攝影／生成圖', brief: '短文、標記、便條與一個代表性物件', rights: '待製作；優先原創', use: '閱讀拼圖與文本證據' },
  { id: 'IMG-13', name: '六十秒短講', kind: '原創攝影／生成圖', brief: '學生面向聽眾說明，畫面有清楚的 60 秒視覺計時', rights: '待製作；優先原創', use: '成段表達' },
  { id: 'IMG-14', name: '起名兒公司', kind: '原創攝影／生成圖', brief: '現代命名顧問工作桌、姓名提案與客戶 brief', rights: '待製作；優先原創', use: '最終任務開場' },
  { id: 'IMG-15', name: '客戶人物卡', kind: '原創肖像／生成圖', brief: '虛構客戶肖像，搭配少量命名條件', rights: '待製作；優先原創', use: '需求訪問' },
  { id: 'IMG-16', name: '命名條件排序', kind: '自製圖形', brief: '音、義、風格、文化等條件卡的排序與衝突', rights: '自製', use: '協商與決策' },
  { id: 'IMG-17', name: '中文姓名提案', kind: '自製字形圖形／生成圖', brief: '姓名字形、讀音、字義與理由以一個提案畫面呈現', rights: '自製或原創', use: '姓名提案與重做' },
  { id: 'IMG-18', name: '電影演員命名', kind: '授權肖像／原創插畫', brief: '兩位虛構或已確認授權的人物卡；不直接抓網路明星照片', rights: '待授權；優先原創插畫', use: '演員中文名活動' },
  { id: 'IMG-19', name: '調查結果視覺化', kind: '自製圖形', brief: '姓名意義、地域特點、美好願望的三組資料圖', rights: '自製', use: '小組調查報告' },
  { id: 'IMG-20', name: '姓氏比較地圖', kind: '自製圖形／生成圖', brief: '越南與中國姓氏比較的視覺框架，不把文化差異簡化成排名', rights: '自製或原創', use: '姓氏交換與文化比較' },
  { id: 'IMG-21', name: '姓氏問題解決圖', kind: '自製圖形', brief: '問題—原因—結果—說明的因果流程', rights: '自製', use: '姓「老」問題解決' },
  { id: 'IMG-22', name: '姓氏資訊站', kind: '自製圖形／原創攝影', brief: '四個站點的視覺識別與資訊卡', rights: '自製或原創', use: '資訊站、拼圖與資訊差' },
  { id: 'IMG-23', name: '歷史人物與姓氏', kind: '公版資料／原創插畫', brief: '確認公版或自行繪製的人物資料卡，不依賴未授權肖像', rights: '待核對；優先公版或原創', use: '歷史人物微研究' },
  { id: 'IMG-24', name: '課末能力視覺', kind: '自製字形圖形', brief: '我能句式、姓名字形與簡潔進度標記', rights: '自製', use: '出口任務與總結' }
];

const assetIds = new Set(imagePlan.map((asset) => asset.id));
const visualSpecs = new Map();

function assign(numbers, spec) {
  for (const number of numbers) {
    const key = String(number).padStart(3, '0');
    if (visualSpecs.has(key)) throw new Error(`Visual spec duplicated for slide ${key}`);
    visualSpecs.set(key, { ...spec });
  }
}

const common = {
  teacher_info_location: 'speaker notes／教師手冊，不放學生主畫面',
  image_required: 'required',
  design_qa: '主視覺必須可在教室後排辨識；不使用細碎裝飾或低對比文字'
};

assign([1], { ...common, visual_role: '開場英雄頁', visual_mode: 'full-bleed image', layout: '全版主圖＋左下標題', image_asset_ids: ['IMG-01'], image_brief: '姓名卡與人物剪影形成一個安靜的開場畫面', text_budget: textBudgets.hero, screen_copy_strategy: '只放課次與主題，不放教學說明', interaction_cue: '教師直接建立姓名情境' });
assign([2], { ...common, visual_role: '學生任務頁', visual_mode: 'three visual verbs', layout: '三個大圖像／大字詞橫向排列', image_asset_ids: ['IMG-02', 'IMG-03', 'IMG-17'], image_brief: '用聽、問、說三組視覺讓學生直接看懂今天要做什麼', text_budget: textBudgets.objective, screen_copy_strategy: '只留真實任務與三個學生動作，不放能力目標或教學術語', interaction_cue: '學生用一句中文說出今天要做什麼' });
assign([3], { ...common, visual_role: '最後任務頁', visual_mode: 'editorial split', layout: '左側任務標題 35%／右側命名工作桌主圖 65%', image_asset_ids: ['IMG-14'], image_brief: '命名工作桌讓學生先看到要完成的事情', text_budget: textBudgets.hero, screen_copy_strategy: '只顯示任務名稱與三個短動作', interaction_cue: '小組先猜一猜要問什麼' });
assign([4], { ...common, visual_role: '課堂運作規則', visual_mode: 'photo plus three chips', layout: '右側合作照片／左側三個短規則', image_asset_ids: ['IMG-03'], image_brief: '小組合作照片承擔情境，規則只用三個短句', text_budget: textBudgets.task, screen_copy_strategy: '先做、再修補、留下口語產出', interaction_cue: '全班用一句中文重述合作規則' });
assign([5], { ...common, visual_role: '聽力策略', visual_mode: 'process diagram', layout: '中央聲波流程：大意 → 證據', image_asset_ids: ['IMG-05'], image_brief: '以兩段聲波與箭頭表現兩遍聽力的不同任務', text_budget: textBudgets.task, screen_copy_strategy: '只保留兩個聽力動作與一句證據提示', interaction_cue: '教師播放音檔前讓學生說出第一遍與第二遍差別' });

assign([6], { ...common, visual_role: '預習回收', visual_mode: 'image-led prompt', layout: '左側姓名卡大圖／右側一個追問', image_asset_ids: ['IMG-02'], image_brief: '姓名卡照片或圖形作為同伴交換的起點', text_budget: textBudgets.task, screen_copy_strategy: '只顯示「找一個相同或不同」', interaction_cue: '兩人交換預習卡' });
assign([7], { ...common, visual_role: '自我介紹', visual_mode: 'portrait card', layout: '人物／姓名卡 60%＋三個提示詞 40%', image_asset_ids: ['IMG-02'], image_brief: '姓名、字義、來歷以一張視覺卡整合', text_budget: textBudgets.present, screen_copy_strategy: '只保留意思、來歷、讀音三個提示詞', interaction_cue: '每人 30 秒說明' });
assign([8], { ...common, visual_role: '田野資料交換', visual_mode: 'documentary split', layout: '調查場景 55%＋一個追問框 45%', image_asset_ids: ['IMG-04'], image_brief: '採訪記錄的照片或原創插圖，不放表格全文', text_budget: textBudgets.task, screen_copy_strategy: '只顯示觀察與追問兩個產出', interaction_cue: '三人小組交換資料' });
assign([9, 10], { ...common, visual_role: '聽力理解', visual_mode: 'audio anchor', layout: '左側聲波／情境圖 40%＋右側題目 60%', image_asset_ids: ['IMG-05'], image_brief: '聲波與簡潔情境圖固定在同一位置，形成聽力識別系統', text_budget: textBudgets.listening, screen_copy_strategy: '每頁只顯示三題；題目分頁，不塞六題', interaction_cue: '先個人，再小組比較' });
assign([11], { ...common, visual_role: '聽力證據交換', visual_mode: 'evidence wall', layout: '中央證據路徑＋兩個答案節點', image_asset_ids: ['IMG-07'], image_brief: '答案、關鍵詞、音檔依據形成可視化路徑', text_budget: textBudgets.task, screen_copy_strategy: '只顯示「答案＋你聽到什麼」', interaction_cue: '小組提交兩個答案證據' });
assign([12, 13], { ...common, visual_role: '語意選擇', visual_mode: 'two-card contrast', layout: '兩張大圖卡對照；文字只作標籤', image_asset_ids: ['IMG-08'], image_brief: '用畫面差異輔助意思判斷，不把選項變成段落', text_budget: textBudgets.compare, screen_copy_strategy: '每頁 2–3 題，每題兩個清楚選項', interaction_cue: '學生先解釋，再核對' });
assign([14, 15], { ...common, visual_role: '回答與追問', visual_mode: 'conversation scene', layout: '兩人互動照片＋右側一個追問提示', image_asset_ids: ['IMG-06'], image_brief: '用視線與手勢提示互動，而不是展示完整答案', text_budget: textBudgets.dialogue, screen_copy_strategy: '只顯示問題編號與三個畫線提示詞', interaction_cue: '每次回答後必須追問' });
assign([16], { ...common, visual_role: '訪談角色輪換', visual_mode: 'role system', layout: '三個角色視覺卡＋中央輪換箭頭', image_asset_ids: ['IMG-09'], image_brief: '三個角色卡讓學生一眼明白輪換方式', text_budget: textBudgets.task, screen_copy_strategy: '角色名稱＋每個角色一個動詞', interaction_cue: '每人完成一次訪談與一次觀察' });
assign([17], { ...common, visual_role: '小節出口', visual_mode: 'quiet typographic visual', layout: '大字句式置中＋右下小型姓名字形', image_asset_ids: ['IMG-24'], image_brief: '留白為主，字形作為記憶錨點', text_budget: textBudgets.exit, screen_copy_strategy: '只留一個姓名理由與一個聽力證據', interaction_cue: '個人完成出口卡' });

assign([18], { ...common, visual_role: '快速啟動', visual_mode: 'image-led prompt', layout: '大姓名卡＋一個問答提示', image_asset_ids: ['IMG-02'], image_brief: '用姓名卡直接啟動同伴問答', text_budget: textBudgets.task, screen_copy_strategy: '只留一個問題與一個回答動作', interaction_cue: '兩人快速交換' });
assign([19, 20], { ...common, visual_role: '跟讀替換', visual_mode: 'conversation scene', layout: '兩人互動圖 50%＋一條句式框 50%', image_asset_ids: ['IMG-06'], image_brief: '畫線部分以色塊或空位表示，不顯示密集句群', text_budget: textBudgets.dialogue, screen_copy_strategy: '每頁最多三句替換句', interaction_cue: '聽、跟讀、換成真實資訊' });
assign([21, 22], { ...common, visual_role: '對話重建', visual_mode: 'masked dialogue', layout: '大情境圖＋兩個角色標記；課文採逐步揭示', image_asset_ids: ['IMG-06'], image_brief: '圖像維持情境，文字用逐步顯示避免整頁課文', text_budget: textBudgets.dialogue, screen_copy_strategy: '只顯示對話編號與重建提示', interaction_cue: '蓋住課文，用自己的話重建' });
assign([23, 24, 25], { ...common, visual_role: '句式資訊站', visual_mode: 'three-scene station', layout: '三格情境圖＋一句句式提示', image_asset_ids: ['IMG-10'], image_brief: '每個句式由一個可辨識生活情境承擔', text_budget: textBudgets.task, screen_copy_strategy: '句式只出現一次；情境與產出最重要', interaction_cue: '輪站完成兩個新情境' });
assign([26], { ...common, visual_role: '觀點轉換', visual_mode: 'typographic split', layout: '左右兩個觀點畫面＋中央轉折字形', image_asset_ids: ['IMG-11'], image_brief: '用兩個不同角度的姓名情境表現話題轉回', text_budget: textBudgets.compare, screen_copy_strategy: '兩個角度各一行，不放定義', interaction_cue: '完成 30 秒雙面觀點' });
assign([27], { ...common, visual_role: '回饋後重做', visual_mode: 'before-after visual', layout: '左側第一次／右側重做；中間一個回饋標記', image_asset_ids: ['IMG-24'], image_brief: '用兩個姓名字形版本表示重做，而非放評語段落', text_budget: textBudgets.exit, screen_copy_strategy: '只顯示一個下一步目標', interaction_cue: '同伴回饋後再說一次' });

assign([28], { ...common, visual_role: '聽力預測', visual_mode: 'stance continuum', layout: '人物剪影兩端＋中央立場刻度', image_asset_ids: ['IMG-11'], image_brief: '以立場視覺讓學生先預測人物態度', text_budget: textBudgets.task, screen_copy_strategy: '只留人物、立場、證據三個詞', interaction_cue: '小組分配找證據角色' });
assign([29, 30], { ...common, visual_role: '聽力填空', visual_mode: 'audio anchor', layout: '聲波 35%＋三個大空格 65%', image_asset_ids: ['IMG-05'], image_brief: '空格需要足夠大，聲波圖固定作聽力定位', text_budget: textBudgets.listening, screen_copy_strategy: '每頁 2–3 個關鍵空格', interaction_cue: '第一遍只抓關鍵資訊' });
assign([31], { ...common, visual_role: '判斷正誤', visual_mode: 'evidence wall', layout: '正誤兩端＋三個證據節點', image_asset_ids: ['IMG-07'], image_brief: '用證據節點代替逐句講解', text_budget: textBudgets.listening, screen_copy_strategy: '只顯示判斷與證據欄', interaction_cue: '小組找出聽到的依據' });
assign([32], { ...common, visual_role: '立場討論', visual_mode: 'editorial split', layout: '左右兩種立場圖＋中央問題', image_asset_ids: ['IMG-11'], image_brief: '以兩個人物或兩種命名選擇承擔立場差異', text_budget: textBudgets.compare, screen_copy_strategy: '只顯示一個立場問題與一個追問', interaction_cue: '小組說理由並問另一組' });
assign([33], { ...common, visual_role: '諧音文化', visual_mode: 'character composition', layout: '同音字大字形＋兩個意義畫面', image_asset_ids: ['IMG-11'], image_brief: '把同音、願望、誤會用字形與圖像連起來', text_budget: textBudgets.task, screen_copy_strategy: '只保留一個例子與一個文化問題', interaction_cue: '交流一個自身經驗' });
assign([34], { ...common, visual_role: '閱讀證據', visual_mode: 'editorial document', layout: '文章局部 35%＋證據圖像 65%', image_asset_ids: ['IMG-12'], image_brief: '文章只截取必要片段，完整閱讀放在教材或活動卡', text_budget: textBudgets.task, screen_copy_strategy: '只顯示找文本依據的任務', interaction_cue: '小組拼圖找證據' });
assign([35, 36], { ...common, visual_role: '成段短講', visual_mode: 'presenter image', layout: '講者主圖 60%＋三個提綱詞 40%', image_asset_ids: ['IMG-13'], image_brief: '六十秒是視覺節奏，不是塞入講稿', text_budget: textBudgets.present, screen_copy_strategy: '例子、意思、影響三個提示詞', interaction_cue: '一人說、一人聽並記錄' });
assign([37], { ...common, visual_role: '小節出口', visual_mode: 'quiet typographic visual', layout: '大問題置中＋小型聲波圖', image_asset_ids: ['IMG-24'], image_brief: '留白和一個聲波符號提示聽力反思', text_budget: textBudgets.exit, screen_copy_strategy: '只留聽懂的一點與想確認的一點', interaction_cue: '個人寫下反思' });

assign([38], { ...common, visual_role: '最終任務啟動', visual_mode: 'full-bleed image', layout: '命名顧問工作桌全版＋四個成功條件標籤', image_asset_ids: ['IMG-14'], image_brief: '把學生放進起名兒公司情境，成功條件不超過四個短詞', text_budget: textBudgets.task, screen_copy_strategy: '只顯示問清、提出、說明、回答', interaction_cue: '小組分配角色與條件' });
assign([39], { ...common, visual_role: '客戶需求訪問', visual_mode: 'client portrait card', layout: '客戶肖像 55%＋五個圖像化條件', image_asset_ids: ['IMG-15'], image_brief: '客戶肖像和條件圖示取代長段背景', text_budget: textBudgets.task, screen_copy_strategy: '性別、字數、讀音、字義、風格五個標籤', interaction_cue: '學生向客戶提問' });
assign([40], { ...common, visual_role: '條件協商', visual_mode: 'decision board', layout: '條件卡排序 70%＋一個衝突提示', image_asset_ids: ['IMG-16'], image_brief: '排序與衝突直接視覺化，避免解釋段落', text_budget: textBudgets.compare, screen_copy_strategy: '只放條件詞與排序問題', interaction_cue: '小組協商優先順序' });
assign([41, 42], { ...common, visual_role: '姓名顧問提案', visual_mode: 'proposal board', layout: '姓名字形主視覺 55%＋三個理由欄', image_asset_ids: ['IMG-17'], image_brief: '中文姓名成為畫面主角，讀音與字義用少量標記', text_budget: textBudgets.present, screen_copy_strategy: '姓名、讀音、字義、理由各一行', interaction_cue: '九十秒提案與客戶追問' });
assign([43, 44], { ...common, visual_role: '演員中文名', visual_mode: 'portrait pair', layout: '兩個人物卡並置＋姓名提案區', image_asset_ids: ['IMG-18'], image_brief: '人物圖像先建立命名對象，說明留給口語提案', text_budget: textBudgets.present, screen_copy_strategy: '每位演員只顯示一個新名字與三個提示詞', interaction_cue: '小組提出並說明兩個中文名' });
assign([45, 46], { ...common, visual_role: '調查報告', visual_mode: 'data-led visual', layout: '三組資料圖 65%＋報告提示 35%', image_asset_ids: ['IMG-19'], image_brief: '調查結果用視覺資料呈現，不把數據變成表格牆', text_budget: textBudgets.present, screen_copy_strategy: '時代、地域、願望三個分類標籤', interaction_cue: '兩分鐘報告與一個追問' });
assign([47], { ...common, visual_role: '提案重做', visual_mode: 'before-after visual', layout: '第一次／修訂後並置＋一個回饋焦點', image_asset_ids: ['IMG-17'], image_brief: '比較兩個姓名提案版本，讓重做看得見', text_budget: textBudgets.exit, screen_copy_strategy: '只顯示一個可理解度改進目標', interaction_cue: '回饋後重新說一個句子' });
assign([48], { ...common, visual_role: '小節出口', visual_mode: 'quiet typographic visual', layout: '一個命名條件大字＋小型姓名字形', image_asset_ids: ['IMG-24'], image_brief: '把命名條件收束成一個可記住的字詞', text_budget: textBudgets.exit, screen_copy_strategy: '只留一個條件與一個理由', interaction_cue: '個人完成出口卡' });

assign([49, 50], { ...common, visual_role: '姓氏比較', visual_mode: 'comparison map', layout: '左右文化圖像＋中央比較軸', image_asset_ids: ['IMG-20'], image_brief: '比較框架先建立，文化內容由學生口語補充', text_budget: textBudgets.compare, screen_copy_strategy: '只留姓、名、常見原因三個提示', interaction_cue: '兩人或四人交換資料' });
assign([51], { ...common, visual_role: '第二組聽力', visual_mode: 'audio anchor', layout: '情境圖 40%＋主旨／細節兩區', image_asset_ids: ['IMG-05'], image_brief: '主旨與細節用兩個視覺區塊分開', text_budget: textBudgets.listening, screen_copy_strategy: '只顯示主旨與兩個細節任務', interaction_cue: '先找主旨，再找細節' });
assign([52], { ...common, visual_role: '姓氏問答', visual_mode: 'conversation scene', layout: '互動照片＋一個追問泡泡', image_asset_ids: ['IMG-06'], image_brief: '用對話場景支援自然追問', text_budget: textBudgets.dialogue, screen_copy_strategy: '只顯示姓、名、稱呼三個選擇', interaction_cue: '完成四回合互動' });
assign([53, 54, 55], { ...common, visual_role: '姓氏對話重建', visual_mode: 'masked dialogue', layout: '情境圖 50%＋逐步揭示文字 50%', image_asset_ids: ['IMG-06'], image_brief: '每頁只保留一小段語料，避免課文牆', text_budget: textBudgets.dialogue, screen_copy_strategy: '只顯示替換或重建的最小單位', interaction_cue: '聽、重建、交換角色' });
assign([56], { ...common, visual_role: '互動重做', visual_mode: 'evidence wall', layout: '一個聽懂證據＋一個重說句子', image_asset_ids: ['IMG-07'], image_brief: '回饋只留兩個視覺欄位：聽懂／重說', text_budget: textBudgets.exit, screen_copy_strategy: '只顯示一個可改進句子', interaction_cue: '同伴記錄後再做一次' });
assign([57], { ...common, visual_role: '小節出口', visual_mode: 'comparison visual', layout: '兩個姓氏字形＋一條相同／不同軸', image_asset_ids: ['IMG-20'], image_brief: '用字形與比較軸收束文化內容', text_budget: textBudgets.exit, screen_copy_strategy: '只留一個相同或不同與一個追問', interaction_cue: '個人完成出口卡' });

assign([58], { ...common, visual_role: '資訊站啟動', visual_mode: 'station map', layout: '四站地圖＋中央換卡動線', image_asset_ids: ['IMG-22'], image_brief: '四個站點用視覺識別區分，學生一眼看懂輪換', text_budget: textBudgets.task, screen_copy_strategy: '只顯示換卡、選資訊、教新組三步', interaction_cue: '每人選一項要教的資訊' });
assign([59], { ...common, visual_role: '姓氏聽力填空', visual_mode: 'audio anchor', layout: '聲波 35%＋兩到三個大空格', image_asset_ids: ['IMG-05'], image_brief: '延續聽力視覺系統，保持學生注意力在音檔', text_budget: textBudgets.listening, screen_copy_strategy: '只保留關鍵資訊空格', interaction_cue: '第一遍不逐字聽寫' });
assign([60], { ...common, visual_role: '姓氏聽力證據', visual_mode: 'evidence wall', layout: '正誤判斷＋證據節點', image_asset_ids: ['IMG-07'], image_brief: '答案與聽到的證據以連線方式呈現', text_budget: textBudgets.listening, screen_copy_strategy: '每頁最多三題判斷', interaction_cue: '小組提交證據' });
assign([61], { ...common, visual_role: '問題解決', visual_mode: 'causal diagram', layout: '問題→原因→結果→說明四格流程', image_asset_ids: ['IMG-21'], image_brief: '用因果圖取代文字解釋', text_budget: textBudgets.task, screen_copy_strategy: '四個欄位只放欄名，內容由小組完成', interaction_cue: '小組依文本推論' });
assign([62], { ...common, visual_role: '資訊差交換', visual_mode: 'station cards', layout: '兩張不同資訊卡＋中央交換箭頭', image_asset_ids: ['IMG-22'], image_brief: '資訊差由卡片視覺直接表達', text_budget: textBudgets.task, screen_copy_strategy: '只顯示交換規則與產出', interaction_cue: '每人完成兩次資訊交換' });
assign([63], { ...common, visual_role: '姓氏文化比較', visual_mode: 'comparison map', layout: '單姓／複姓／來源三個視覺節點', image_asset_ids: ['IMG-20'], image_brief: '文化比較用節點與連線，不做百科式投影片', text_budget: textBudgets.compare, screen_copy_strategy: '只留一個比較點與一個追問', interaction_cue: '學生互相教一個資訊' });
assign([64], { ...common, visual_role: '閱讀拼圖', visual_mode: 'jigsaw station', layout: '四片內容拼圖＋一個教學箭頭', image_asset_ids: ['IMG-22'], image_brief: '拼圖視覺表現每組讀不同部分並重新組合', text_budget: textBudgets.task, screen_copy_strategy: '只顯示讀、找、教三步', interaction_cue: '每人教會新組員一個重點' });
assign([65], { ...common, visual_role: '朗讀站', visual_mode: 'typographic visual', layout: '單姓／複姓字形大字＋朗讀提示', image_asset_ids: ['IMG-23'], image_brief: '字形與人物資料卡共同支援朗讀與文化理解', text_budget: textBudgets.present, screen_copy_strategy: '只顯示兩組姓氏與一個熟悉的姓', interaction_cue: '大聲朗讀並交換一個姓' });
assign([66], { ...common, visual_role: '俗語成段表達', visual_mode: 'typographic composition', layout: '俗語字形主視覺＋一個熟悉姓氏圖像', image_asset_ids: ['IMG-23', 'IMG-20'], image_brief: '讓俗語和姓氏成為視覺記憶點，避免整段解釋', text_budget: textBudgets.present, screen_copy_strategy: '只保留俗語與一個短講提示', interaction_cue: '完成 60–90 秒短講' });
assign([67], { ...common, visual_role: '歷史人物微研究', visual_mode: 'archival portrait card', layout: '人物卡 55%＋姓氏與一個事實 45%', image_asset_ids: ['IMG-23'], image_brief: '只用已確認公版或原創人物資料，避免未授權網路照片', text_budget: textBudgets.present, screen_copy_strategy: '人物、姓氏、一個重要資訊', interaction_cue: '每人完成 30 秒介紹' });
assign([68], { ...common, visual_role: '對話反思', visual_mode: 'conversation scene', layout: '安靜對話圖＋一個感受問題', image_asset_ids: ['IMG-06'], image_brief: '用人物表情和空間留白支援反思，不放長篇問題', text_budget: textBudgets.dialogue, screen_copy_strategy: '只留感受與追問兩個動作', interaction_cue: '完成 30 秒反思與一個追問' });
assign([69], { ...common, visual_role: '全課能力總結', visual_mode: 'quiet typographic visual', layout: '三個能力字形＋中央我能句式', image_asset_ids: ['IMG-24'], image_brief: '用三個能力字形回收全課，不重列教材內容', text_budget: textBudgets.exit, screen_copy_strategy: '只留我現在能與三個能力提示', interaction_cue: '勾選並說出一句我能句式' });

const missingSpecs = slides.filter((slide) => !visualSpecs.has(slide.slide_no)).map((slide) => slide.slide_no);
if (missingSpecs.length) throw new Error(`Visual storyboard missing slides: ${missingSpecs.join(', ')}`);

const enrichedSlides = slides.map((slide) => {
  const spec = visualSpecs.get(slide.slide_no);
  const unknownAssets = spec.image_asset_ids.filter((id) => !assetIds.has(id));
  if (unknownAssets.length) throw new Error(`Unknown image asset(s) on slide ${slide.slide_no}: ${unknownAssets.join(', ')}`);
  return { ...slide, ...spec };
});

const usage = Object.fromEntries(imagePlan.map((asset) => [asset.id, 0]));
for (const slide of enrichedSlides) for (const assetId of slide.image_asset_ids) usage[assetId] += 1;
const imageRequiredCount = enrichedSlides.filter((slide) => slide.image_required === 'required').length;
const imageSupportedCount = enrichedSlides.filter((slide) => slide.image_asset_ids.length > 0).length;
const visualModeCounts = {};
for (const slide of enrichedSlides) visualModeCounts[slide.visual_mode] = (visualModeCounts[slide.visual_mode] || 0) + 1;

const slideHeader = [
  'slide_no', 'period', 'time', 'purpose', 'visual_role', 'visual_mode', 'layout',
  'image_required', 'image_asset_ids', 'image_brief', 'text_budget', 'screen_copy_strategy',
  'interaction_cue', 'teacher_info_location', 'design_qa', 'source_refs', 'audio_track'
];
const slideCsvRows = [slideHeader.join(',')];
for (const slide of enrichedSlides) slideCsvRows.push([
  slide.slide_no, slide.period, slide.time, slide.purpose, slide.visual_role, slide.visual_mode,
  slide.layout, slide.image_required, slide.image_asset_ids.join(';'), slide.image_brief, slide.text_budget,
  slide.screen_copy_strategy, slide.interaction_cue, slide.teacher_info_location, slide.design_qa,
  slide.source_refs, slide.audio_track
].map(csv).join(','));

const assetHeader = ['asset_id', 'name', 'kind', 'brief', 'rights_status', 'planned_usage_count', 'usage_slides'];
const assetCsvRows = [assetHeader.join(',')];
for (const asset of imagePlan) {
  const usageSlides = enrichedSlides.filter((slide) => slide.image_asset_ids.includes(asset.id)).map((slide) => slide.slide_no).join('|');
  assetCsvRows.push([asset.id, asset.name, asset.kind, asset.brief, asset.rights, usage[asset.id], usageSlides].map(csv).join(','));
}

const modeTable = Object.entries(visualModeCounts).sort((a, b) => b[1] - a[1]).map(([mode, count]) => `| ${md(mode)} | ${count} |`).join('\n');
const slideTable = enrichedSlides.map((slide) => `| ${slide.slide_no} | ${md(slide.period)} / ${md(slide.time)} | ${md(slide.visual_role)} | ${md(slide.visual_mode)} | ${md(slide.layout)} | ${md(slide.image_asset_ids.join(', '))} | ${md(slide.text_budget)} | ${md(slide.screen_copy_strategy)} |`).join('\n');
const assetTable = imagePlan.map((asset) => `| ${asset.id} | ${md(asset.name)} | ${md(asset.kind)} | ${md(asset.brief)} | ${usage[asset.id]} | ${md(asset.rights)} |`).join('\n');

const markdown = `# 第一課〈中國人的姓名〉Visual Storyboard

狀態：**待視覺分鏡審核**
版本：v0.1  2026-08-19
交付方向：**圖片主導、低文字密度、原生 PPTX；不製作 HTML。**

## 這一步解決什麼問題

原本的 storyboard 已經解決教學順序、教材 coverage、時間與活動，但它仍然是內容規格，不等於高品質簡報設計。這份 Visual Storyboard 先為每張投影片決定畫面角色、文字上限、圖片功能、版面比例與互動提示；在它通過前，不開始大量製作 PPTX。

## 設計方向

- 視覺語言：${designTokens.direction}
- 畫布：${designTokens.canvas}
- 背景：${designTokens.background}
- 主要文字：${designTokens.ink}
- 次要文字：${designTokens.secondary}
- 主強調色：${designTokens.accent}
- 暖色提示：${designTokens.accentWarm}
- 深色段落頁：${designTokens.darkSurface}
- 主要字體：${designTokens.primaryFont}
- 標題字體：${designTokens.displayFont}
- 標題字級：${designTokens.titleSize}
- 任務提示字級：${designTokens.taskSize}
- 內文最小建議字級：${designTokens.bodySize}
- 留白：${designTokens.spacing}
- 圖片規則：${designTokens.imagePolicy}
- 素材規則：${designTokens.rightsPolicy}

## 低文字密度規則

- 每張投影片只服務一個課堂動作，不把教師講義貼到學生畫面。
- 教師時間、分組、答案政策、來源頁碼、修補提示全部放 speaker notes 或教師手冊。
- 聽力題目分頁；不在一張投影片放完整六題、完整解析或密集逐字稿。
- 對話採逐步揭示；學生需要說的內容不提前全部顯示。
- 圖片、字形、聲波、流程圖與資料圖必須支援理解或記憶，不作背景裝飾。
- 所有學生畫面仍然使用中文；教材目標內容維持簡體中文，必要拼音另行放在清楚的輔助層。

## 圖片使用標準

本版共安排 ${imageRequiredCount}/${enrichedSlides.length} 張投影片使用必要主視覺，${imageSupportedCount}/${enrichedSlides.length} 張投影片有圖片、字形圖形或資料視覺支援。圖片不是每頁都要換一張新照片；同一視覺系統可以用不同裁切、色彩與資訊層級支援同一組活動。

圖片來源優先順序：自製圖形／原創生成圖／確認授權的攝影或公版資料。未確認授權的網路明星照片、教材截圖或裝飾性 stock photo 不得直接放入 PPTX。

## 視覺節奏

| 視覺模式 | 張數 |
|---|---:|
${modeTable}

## 逐張視覺分鏡

完整 CSV：

<code>lesson-01-visual-storyboard.csv</code>

| Slide | 節次／時間 | 畫面角色 | 視覺模式 | 版面 | 主視覺 | 文字上限 | 學生畫面策略 |
|---:|---|---|---|---|---|---|---|
${slideTable}

## 圖片與視覺素材清單

完整 CSV：

<code>lesson-01-image-asset-plan.csv</code>

| ID | 素材 | 類型 | 視覺任務 | 使用張數 | 授權狀態 |
|---|---|---|---|---:|---|
${assetTable}

## PPTX 製作前的硬性 gate

1. 先做 6 張視覺 prototype：封面、學生任務頁、聽力操作頁、情境說話頁、起名兒任務頁、姓氏活動頁。
2. prototype 必須通過後，才展開 69 張完整 PPTX。
3. 每張投影片必須能在 3 秒內看出「現在要做什麼」。
4. 每張活動頁的學生可見文字必須符合本分鏡的 text budget；超出就拆頁或移到配套材料。
5. 每個圖片素材要有來源／授權／版本紀錄；沒有紀錄不得進入交付版。
6. 必須用實際投影尺寸檢查後排可讀性、圖片主體、文字對比與音檔操作。

## 審核問題

1. 這個 Soft Structuralism × Editorial Split 方向是否符合你要的 Apple／大型公司簡報感？
2. 文字上限是否足夠支援學生在課堂中直接做聽說任務？
3. 圖片類型與原創／授權策略是否可以接受？
4. 是否同意先做 6 張 prototype，再展開完整 PPTX？
`;

const manifest = {
  package: 'lesson-01-visual-storyboard',
  generated_at: new Date().toISOString(),
  status: 'pending_visual_storyboard_review',
  format: 'native-pptx-only',
  html_required: false,
  canonical_source: sourceRelative,
  canonical_source_sha256: sha256File(sourceRelative),
  input_storyboard: storyboardRelative,
  input_storyboard_sha256: sha256File(storyboardRelative),
  slide_count: enrichedSlides.length,
  image_required_slide_count: imageRequiredCount,
  image_supported_slide_count: imageSupportedCount,
  image_asset_count: imagePlan.length,
  exercise_count: source.exercises.length,
  text_policy: 'low-density, one classroom action per slide, teacher information in notes',
  student_language_policy: 'Chinese-only student-facing text; Simplified Chinese target content',
  design_direction: designTokens.direction,
  output_files: [
    'lesson-01-visual-storyboard.md',
    'lesson-01-visual-storyboard.csv',
    'lesson-01-image-asset-plan.csv',
    'manifest.json'
  ]
};

fs.writeFileSync(path.join(outputDir, 'lesson-01-visual-storyboard.md'), markdown);
fs.writeFileSync(path.join(outputDir, 'lesson-01-visual-storyboard.csv'), `${slideCsvRows.join('\n')}\n`);
fs.writeFileSync(path.join(outputDir, 'lesson-01-image-asset-plan.csv'), `${assetCsvRows.join('\n')}\n`);
fs.writeFileSync(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({
  outputDir,
  slideCount: enrichedSlides.length,
  imageRequiredSlideCount: imageRequiredCount,
  imageSupportedSlideCount: imageSupportedCount,
  imageAssetCount: imagePlan.length,
  exerciseCount: source.exercises.length,
  sourceSha256: manifest.canonical_source_sha256
}, null, 2));
