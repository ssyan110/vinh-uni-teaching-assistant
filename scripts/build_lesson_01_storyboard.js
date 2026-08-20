const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const projectRoot = path.resolve(__dirname, '..');
const sourceRelative = 'work/boya-intermediate/extractions/structured-lesson-01.json';
const outputRelative = 'output/boya-intermediate/lesson-01/storyboard';
const sourcePath = path.join(projectRoot, sourceRelative);
const outputDir = path.join(projectRoot, outputRelative);
const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
fs.mkdirSync(outputDir, { recursive: true });

function sha256File(relativeTarget) {
  return crypto.createHash('sha256').update(fs.readFileSync(path.join(projectRoot, relativeTarget))).digest('hex');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function csv(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function md(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}

const exercises = Object.fromEntries(source.exercises.map((item) => [item.record_id, item]));
const audioAssetToTrack = {};
source.audio_map.forEach((item, index) => {
  audioAssetToTrack[`A01-${String(index + 1).padStart(3, '0')}`] = item.track_label;
});

function audioFor(refs) {
  return [...new Set(refs.flatMap((id) => exercises[id]?.audio_asset_ids || []).map((id) => audioAssetToTrack[id]).filter(Boolean))].join(', ');
}

function sourcePages(refs) {
  return [...new Set(refs.flatMap((id) => {
    const item = exercises[id];
    if (!item) return [];
    if (item.source_pdf_page) return [`PDF p.${item.source_pdf_page}`];
    return (item.source_pdf_pages || []).map((page) => `PDF p.${page}`);
  }))].join(', ');
}

function slide(no, period, time, purpose, mode, refs, instruction, content, grouping, output, note, asset = '無') {
  return { no: String(no).padStart(3, '0'), period, time, purpose, mode, refs, audio: audioFor(refs), source_pages: sourcePages(refs), instruction, content, grouping, output, note, asset };
}

const slides = [
  slide(1, 'GLOBAL', '—', '封面', 'Orientation', [], '欢迎来到第一课。', '第一课：中国人的姓名', '全班', '確認課次與主題', '開課時不講解詞語；直接建立課堂情境。', '封面版型'),
  slide(2, 'GLOBAL', '—', 'Can-Do 目標', 'All modes', [], '学完这一课，你能……', '我能听懂姓名和姓氏的主要信息；我能询问、回答和追问；我能提出中文姓名建议并说明理由。', '全班→個人', '學生知道最後要完成的語言表現', '以學生能完成的任務說明目標，不用能力等級術語開場。', 'Can-Do 卡'),
  slide(3, 'GLOBAL', '—', '最終任務預告', 'Interpersonal + Presentational', [], '最后任务：在一家起名儿公司工作。', '最终任务：访问客户、确认要求、提出姓名、说明理由，并回答客户的问题。', '三至四人', '知道最後任務與成功標準', '先展示任務結果，讓學生理解每個練習的用途。', '任務示意'),
  slide(4, 'GLOBAL', '—', '課堂運作規則', 'Interpersonal', [], '小组合作。先试着说；需要时请对方再说一遍。', '课堂约定：先做任务，再修补语言；听不清时请对方再说一遍；每次活动都要留下一个口语产出。', '全班', '學生理解活動規則', '強調課堂不是逐字講解課。', '規則卡'),
  slide(5, 'GLOBAL', '—', '聽力策略', 'Interpretive', [], '第一遍听大意，第二遍找证据。', '听力策略：第一遍抓大意；第二遍找证据；小组答案必须说明“你从哪里听到的”。', '全班', '學生知道兩遍聽力的任務不同', '可在 speaker notes 補充播放與重播規則。', '聽力策略卡'),

  slide(6, 'P1', '0–5', 'P1 目標與預習回收', 'Interpretive → Interpersonal', [], '和同伴交换预习卡，找出一个相同点或不同点。', '第一部分：姓名的意思和来历', '兩人', '交換預習卡並說出一個相同／不同點', '觀察學生是否帶來預習證據；不先重教詞語。', '預習卡 A'),
  slide(7, 'P1', '5–10', '自我介紹姓名', 'Interpersonal', ['E01-034'], '用 30 秒介绍自己名字的意思和来历。', '介绍自己的名字：意思、来历、读音。', '兩人', '每人完成 30 秒自述', '用記錄表找出學生真正需要的語言修補。', '姓名資訊卡'),
  slide(8, 'P1', '10–15', '田野資料交換', 'Interpersonal + Presentational', ['E01-035'], '交换调查资料，选出一个想继续追问的问题。', '小调查：比较三位中文使用者的姓名意思和来历。', '三人', '每組整理一個觀察與一個追問', '若學生無法完成原始田野任務，使用教師核准的替代資料。', '調查表'),
  slide(9, 'P1', '15–22', '聽力 1-2：問題 1–3', 'Interpretive', ['E01-001'], '听 1-2，回答问题 1–3。先独立完成，再和小组比较。', '听对话，回答问题：1–3。', '個人→四人', '完成答案初稿', '不要先公布答案；要求學生指出聽力依據。', '音檔 1-2'),
  slide(10, 'P1', '22–28', '聽力 1-2：問題 4–6', 'Interpretive', ['E01-001'], '再听 1-2，回答问题 4–6，并记下关键词作为证据。', '听对话，回答问题：4–6。', '個人→四人', '完成答案與關鍵詞', '只在關鍵詞阻礙理解時做短修補。', '音檔 1-2'),
  slide(11, 'P1', '28–32', '聽力證據交換', 'Interpretive + Interpersonal', ['E01-001'], '每组选择两个答案，并说明：“你听到了什么？”', '证据交换：答案不能只有选项，要说明听到的依据。', '四人', '提交兩個答案證據', '這張是把理解題轉成 PBI 證據活動的關鍵頁。', '證據表'),
  slide(12, 'P1', '32–36', '相近意思選擇 1–2', 'Interpretive', ['E01-002'], '听 1-3，选择问题 1–2 中意思最接近的一项。', '选出与所听到的句子意思相近的一项：1–2。', '個人→兩人', '完成選擇並說明理由', '不逐項翻譯選項；先讓學生互相解釋。', '音檔 1-3'),
  slide(13, 'P1', '36–40', '相近意思選擇 3–5', 'Interpretive', ['E01-002'], '再听 1-3，完成问题 3–5，并和同伴比较答案。', '选出与所听到的句子意思相近的一项：3–5。', '兩人', '完成剩餘選擇', '用錯題診斷語意理解，不進入長篇詞語講解。', '音檔 1-3'),
  slide(14, 'P1', '40–44', '三至五句回答 1–3', 'Interpersonal', ['E01-003'], '用 3–5 句话回答问题 1–3，然后再追问同伴一个问题。', '用三至五句话回答问题：1–3，并使用画线词语。', '兩人', '完成一次 4-turn 互動', '教師記錄是否能回答與追問，不先糾正所有形式。', '問題卡'),
  slide(15, 'P1', '44–47', '三至五句回答 4–5', 'Interpersonal', ['E01-003'], '换一个同伴，回答问题 4–5，并追问对方的理由。', '用三至五句话回答问题：4–5。', '兩人', '完成第二次互動', '讓學生把教材問題轉成個人經驗。', '問題卡'),
  slide(16, 'P1', '47–49', '姓名訪談輪換', 'Interpersonal', ['E01-003', 'E01-034', 'E01-035'], '轮换采访者、回答者和观察者。观察者记录一个好的追问。', '姓名访谈：意思、来历、读音、命名偏好。', '三人輪換', '每人完成一張姓名資訊卡', '觀察者只記錄一個可改進點，避免同儕糾錯過量。', '訪談卡'),
  slide(17, 'P1', '49–50', '出口任務', 'Interpretive + Interpersonal', [], '说出一个姓名理由和一个你在听力中听到的信息。', '出口任务：一个姓名理由＋一个听力证据。', '個人', '教師收回 exit ticket', '下一節只修補最影響互動的問題。', 'Exit ticket 1'),

  slide(18, 'P2', '0–5', 'P2 目標與快速回收', 'Interpersonal', [], '问同伴一个姓名问题，再用自己的信息回答。', '第二部分：用语言工具完成互动。', '兩人', '快速啟動，不重新講解', '把預習內容轉成互動，不做詞語複習投影片。', '預習卡 A'),
  slide(19, 'P2', '5–11', '跟讀替換 1–3', 'Interpersonal', ['E01-004'], '听 1-4，跟读后把画线部分换成自己的真实信息。', '听录音，跟读并替换：1–3。', '兩人', '每人產出三句替換句', '只修補影響可理解度的聲調／語序。', '音檔 1-4'),
  slide(20, 'P2', '11–17', '跟讀替換 4–6', 'Interpersonal', ['E01-004'], '换一个同伴，继续完成句子 4–6。', '听录音，跟读并替换：4–6。', '兩人', '完成第二輪替換', '讓學生立即使用，不要求背誦完整句型。', '音檔 1-4'),
  slide(21, 'P2', '17–24', '對話重建 1', 'Interpersonal', ['E01-005'], '听 1-5，盖住课文，用自己的话重建对话 1。', '听录音，复述并模仿对话：1。', '兩人', '不看稿完成一次重建', '接受合理改寫，只追蹤訊息是否完整。', '音檔 1-5'),
  slide(22, 'P2', '24–30', '對話重建 2–3', 'Interpersonal', ['E01-005'], '交换角色，重建对话 2–3，并再追问一个问题。', '听录音，复述并模仿对话：2–3。', '兩人', '第二次重建與追問', '用 recast 與重做代替逐句糾錯。', '音檔 1-5'),
  slide(23, 'P2', '30–34', '句式資訊站 A', 'Interpersonal', ['E01-009'], '用“总不能……吧”完成情境卡上的对话。', '用“总不能……吧”完成对话。', '三人輪站', '完成兩個新情境', '不先講規則；先看學生是否能用於拒絕／限制情境。', '情境卡 A'),
  slide(24, 'P2', '34–38', '句式資訊站 B', 'Interpersonal', ['E01-010'], '用“……才怪呢”改写句子，并表达语气。', '用“……才怪呢”改写句子。', '三人輪站', '完成兩個改寫並說明語氣', '只處理語氣與使用情境。', '情境卡 B'),
  slide(25, 'P2', '38–42', '句式資訊站 C', 'Interpersonal', ['E01-011'], '为句子选择一个合适的情境，并说明理由。', '说一说在什么情况下会说出下面的句子。', '三人輪站', '完成一個情境說明', '讓學生從情境推導用法。', '情境卡 C'),
  slide(26, 'P2', '42–46', '句式資訊站 D', 'Interpersonal + Presentational', ['E01-012'], '用“话说回来”从两个角度谈一个姓名问题。', '用“话说回来”从不同角度谈姓名选择。', '三人輪站', '完成 30 秒雙面觀點', '觀察觀點轉換是否清楚。', '情境卡 D'),
  slide(27, 'P2', '46–50', '回饋、重做與出口', 'Interpersonal', ['E01-009', 'E01-010', 'E01-011', 'E01-012'], '选一句不太清楚的话，根据同伴建议再说一遍。', '回馈后重做：用一个句式回应姓名选择问题。', '兩人→個人', '完成一次重做與 exit ticket', '只留一個下一步語言目標。', 'Exit ticket 2'),

  slide(28, 'P3', '0–5', 'P3 預測與聽力分工', 'Interpretive', [], '先读问题，预测人物的态度，并分配寻找证据的任务。', '第三部分：听懂立场，从音频证据到成段表达。', '四人', '每組分配主旨／細節／語氣／證據角色', '用預習標記啟動，不做內容講解。', '預習卡 A'),
  slide(29, 'P3', '5–11', '第一遍填空 1–3', 'Interpretive', ['E01-006'], '第一遍听 1-6，只填写问题 1–3 的关键信息。', '听第一遍录音，填空：1–3。', '個人→四人', '完成關鍵空格', '第一次不暫停，培養抓重點。', '音檔 1-6'),
  slide(30, 'P3', '11–16', '第一遍填空 4–5', 'Interpretive', ['E01-006'], '完成问题 4–5，然后和小组比较答案。', '听第一遍录音，填空：4–5。', '四人', '小組形成共識', '不要求學生寫出所有聽到的字。', '音檔 1-6'),
  slide(31, 'P3', '16–24', '第二遍判斷正誤', 'Interpretive', ['E01-007'], '再听 1-6，判断对错，并记下关键词或细节作为证据。', '听第二遍录音，判断正误，并找证据。', '四人', '三題判斷＋三個證據', '錯題只針對阻礙判斷的語音／詞義做微修補。', '音檔 1-6'),
  slide(32, 'P3', '24–31', '立場與理由討論', 'Interpersonal', ['E01-008'], '你们赞成给孩子起“殊”这个名字吗？说明理由，并问另一个小组一个问题。', '朋友们是否赞成“殊”这个名字？说说理由。', '四人→全班', '小組立場＋一個追問', '不要給唯一文化答案，要求理由與文本／音檔依據。', '立場卡'),
  slide(33, 'P3', '31–35', '文化討論：諧音', 'Interpersonal', ['E01-013'], '交流一个因为同音而表达愿望或产生误会的例子。', '请你说说：汉语谐音和姓名选择。', '四人', '一個文化觀察與例子', '文化內容以比較與學生經驗為主。', '文化卡'),
  slide(34, 'P3', '35–41', '短文閱讀證據', 'Interpretive', ['E01-014'], '课前读短文。小组找出文本中的句子来回答问题。', '阅读短文后回答：找文本依据。', '四人拼圖', '每人完成一張觀點—例子證據表', '課堂不逐段翻譯；用問題診斷理解。', '閱讀證據表'),
  slide(35, 'P3', '41–44', '成段敘述準備', 'Presentational', ['E01-015'], '选择两个同音字例子，为 60 秒发言列出提纲。', '成段叙述：举两个谐音字趣闻。', '個人→兩人', '完成兩點大綱', '提供結構支架，不代寫內容。', '短講卡'),
  slide(36, 'P3', '44–48', '60 秒成段表達', 'Presentational', ['E01-015'], '发言 60 秒。听同伴记录一个例子和一个主要意思。', '60 秒成段表达：例子＋说明。', '兩人輪換', '完成一次短講與同儕回饋', '回饋只選可理解度／連貫／例子其中一項。', '計時器／回饋卡'),
  slide(37, 'P3', '48–50', '出口反思', 'Presentational', [], '写下一个你听懂的内容和一个还想确认的问题。', '出口任务：我听懂了……；我还想确认……', '個人', '教師取得下一步修補資料', '不把 exit ticket 改成詞語測驗。', 'Exit ticket 3'),

  slide(38, 'P4', '0–5', '最終任務簡報與角色', 'Interpersonal + Presentational', [], '阅读客户要求，选择角色并确定命名标准。', '第四部分：起名儿公司。成功标准：问清要求、提出姓名、说明两个理由、回答追问。', '三至四人', '完成角色與客戶條件分工', '用 speaker notes 提醒教師觀察任務成功，不逐字糾錯。', '任務 rubric'),
  slide(39, 'P4', '5–10', '客戶需求訪問', 'Interpersonal', ['E01-016'], '询问客户对性别、字数、读音、字义和风格的要求。', '模拟空间：向客户询问命名要求。', '三至四人', '完成客戶需求卡', '教師只介入學生無法維持互動時。', '角色卡／客戶卡'),
  slide(40, 'P4', '10–16', '條件整理與協商', 'Interpersonal', ['E01-016'], '小组按重要程度排列要求，并讨论要求冲突时怎么办。', '整理命名条件：音、义、风格、文化考量。', '三至四人', '完成命名條件排序', '這是協商語言，不是句型操練。', '條件排序卡'),
  slide(41, 'P4', '16–22', '姓名提案準備', 'Presentational', ['E01-016'], '提出一个中文姓名，准备读音、字义和命名理由。', '提出中文姓名：读音、字义、命名理由。', '三至四人', '完成提案卡', '開放答案不設唯一標準名；評估是否符合客戶條件。', '提案卡'),
  slide(42, 'P4', '22–28', '姓名顧問提案', 'Interpersonal + Presentational', ['E01-016'], '用 90 秒提出建议。客户必须追问至少一个问题。', '90 秒顾问提案＋客户追问。', '三至四人輪換', '完成一次提案與追問', '用 rubric 記錄訊息、互動、可理解度。', '計時器／rubric'),
  slide(43, 'P4', '28–33', '電影演員中文名：資料', 'Interpersonal', ['E01-017'], '选择两位演员，分析姓名的音和义，再提出中文名。', '根据演员名字的发音及含义，给他们起中文名字。', '四人', '完成兩個名字與理由', '提供材料卡，不把教師命名示例當標準答案。', '電影演員卡'),
  slide(44, 'P4', '33–38', '電影演員中文名：呈現', 'Presentational', ['E01-017'], '说出新名字，并解释读音、意义和风格。', '说明两个中文名：音、义、风格。', '四人→全班', '小組 60 秒呈現', '同伴只提一個澄清問題。', '回饋卡'),
  slide(45, 'P4', '38–42', '調查報告組織', 'Presentational', ['E01-018', 'E01-035'], '用调查资料分类：时代意义、地域特点、美好愿望。', '调查报告：时代意义、地域特点、美好愿望。', '四人', '完成報告結構與資料分類', '保留教材分類，補充資料只作學生任務材料。', '調查報告模板'),
  slide(46, 'P4', '42–46', '小組調查報告', 'Presentational + Interpersonal', ['E01-018', 'E01-035'], '用 2 分钟报告。其他小组提出一个关于资料的问题。', '2 分钟小组报告＋同伴提问。', '四人→全班', '完成報告與追問', '評估資料組織與回答，不要求每句無錯。', '計時器／rubric'),
  slide(47, 'P4', '46–48', '回饋後重做', 'Presentational', ['E01-016', 'E01-018'], '选择一句不太清楚的话，根据反馈再说一遍。', '重做：让提案或报告更容易听懂。', '小組', '完成一個修訂句', '讓重做成為課程核心，而不是只講評。', '重做卡'),
  slide(48, 'P4', '48–50', 'P4 出口', 'Presentational', [], '写出一个重要的命名条件，并说明理由。', '出口任务：一个命名条件＋一个理由。', '個人', '完成出口卡', '為第二組聽力的姓氏主題建立橋接。', 'Exit ticket 4'),

  slide(49, 'P5', '0–5', 'P5 目標與預習回收', 'Interpersonal', [], '用姓氏比较卡介绍越南常见的姓或名。', '第五部分：姓氏与身份。', '兩人', '完成比較型訪談', '不先講中國姓氏系統。', '預習卡 B'),
  slide(50, 'P5', '5–11', '本國常見姓氏交換', 'Interpersonal', ['E01-019'], '介绍本国几个常见的姓和名字，并说明常见原因。', '介绍本国几个常见的姓和名字，并说明常见原因。', '四人', '完成比較表與一個追問', '將文化差異轉成互動。', '姓氏比較卡／音檔 2-1'),
  slide(51, 'P5', '11–18', '聽力 2-2：主旨與細節', 'Interpretive', ['E01-020'], '听 2-2，先找主旨，再找细节，回答问题。', '听对话，回答问题：主旨与细节。', '個人→四人', '提交主旨與兩個細節', '不逐題講解；先協商再核對。', '音檔 2-2'),
  slide(52, 'P5', '18–24', '回答與追問', 'Interpersonal', ['E01-021'], '回答 3–5 句话，然后问同伴一个关于姓、名或称呼的问题。', '用三至五句话回答问题，并追问同伴。', '兩人', '完成 4-turn 互動', '觀察 follow-up question 是否自然。', '互動卡'),
  slide(53, 'P5', '24–30', '跟讀替換 1–3', 'Interpersonal', ['E01-022'], '听 2-3，跟读后把姓、名或称呼换成真实信息。', '听录音，跟读并替换：1–3。', '兩人', '完成三句替換句', '只修補造成誤解的讀音或語序。', '音檔 2-3'),
  slide(54, 'P5', '30–35', '跟讀替換 4–6', 'Interpersonal', ['E01-022'], '换一个同伴，继续完成句子 4–6。', '听录音，跟读并替换：4–6。', '兩人', '完成第二輪替換', '把語言放回真實姓氏資料。', '音檔 2-3'),
  slide(55, 'P5', '35–43', '對話重建', 'Interpersonal', ['E01-023'], '听 2-4，盖住课文，重建对话并交换角色。', '听录音，复述并模仿对话。', '兩人', '完成一次不看稿重建', '不要求逐字重現，要求主要訊息與互動反應。', '音檔 2-4'),
  slide(56, 'P5', '43–48', '同伴回饋與重做', 'Interpersonal', ['E01-021', 'E01-022', 'E01-023'], '同伴记录听懂的一点和需要重说的一句话。', '反馈后重做：让对话更容易听懂。', '兩人', '完成第二次互動', '教師記錄下一節聽力的共同卡點。', '回饋卡'),
  slide(57, 'P5', '48–50', 'P5 出口', 'Interpersonal', [], '说出越南和中国姓氏或姓名的一个相同点或不同点。', '出口任务：一个比较观察＋一个追问。', '個人', '完成出口卡', '不做文化知識測驗。', 'Exit ticket 5'),

  slide(58, 'P6', '0–5', 'P6 預習證據與研究分工', 'Interpretive + Presentational', [], '交换研究卡，每个人选择一个要教给新小组的信息。', '第六部分：姓氏文化资讯站。', '四人', '建立資訊站角色', '檢查 E01-031／E01-032 預習，不先補講文化背景。', '預習卡 B／研究卡'),
  slide(59, 'P6', '5–12', '第一遍填空', 'Interpretive', ['E01-024'], '第一遍听 2-5，只填写关键信息，不要逐字听写。', '听第一遍录音，填空。', '個人→四人', '完成關鍵空格', '第一次播放不暫停。', '音檔 2-5'),
  slide(60, 'P6', '12–20', '第二遍判斷正誤', 'Interpretive', ['E01-025'], '再听 2-5，判断对错，并写下听到的证据。', '听第二遍录音，判断正误，并找证据。', '四人', '完成判斷與證據', '只針對共同錯誤做 3 分鐘修補。', '音檔 2-5'),
  slide(61, 'P6', '20–28', '問題解決：姓「老」', 'Interpersonal', ['E01-026'], '小组填写：问题—原因—结果—说明。', '文中介绍了姓“老”的人遇到的麻烦。', '四人', '完成問題—原因—結果表', '從文本推論，不直接給答案。', '問題表'),
  slide(62, 'P6', '28–33', '姓氏句式資訊站', 'Interpersonal', ['E01-027'], '根据不同信息卡完成信息交换任务。', '句式练习：用句式完成信息交换。', '三人輪站', '每人完成兩次資訊交換', '評估任務完成，不測文法定義。', '資訊差卡'),
  slide(63, 'P6', '33–36', '姓氏文化資訊站', 'Interpersonal', ['E01-028'], '讨论单姓、复姓和姓氏来源，选择一个比较点。', '文化讨论：单姓、复姓与姓氏来源。', '三人輪站', '完成一個比較觀察', '避免百科式講授；要求學生互相教。', '文化站卡'),
  slide(64, 'P6', '36–39', '閱讀拼圖', 'Interpretive + Interpersonal', ['E01-029'], '每组阅读一部分，找出答案，再教给新小组。', '阅读短文：找答案和文本依据。', '四人拼圖', '每人教會新組員一個重點', '使用文本依據，不逐段翻譯。', '閱讀站卡'),
  slide(65, 'P6', '39–42', '單姓與複姓朗讀站', 'Presentational', ['E01-032'], '大声朗读单姓和复姓，再说出一个你认识的姓。', '朗读单姓和复姓，说说你认识的姓。', '三人輪站', '同伴記下兩個姓氏', '只修補造成理解障礙的讀音。', '姓氏讀音卡'),
  slide(66, 'P6', '42–45', '俗語與姓氏成段表達', 'Presentational', ['E01-030'], '解释“张王李赵遍地流（刘）”，再介绍一个熟悉的姓。', '成段叙述：解释“张王李赵遍地流（刘）”。', '兩人輪換', '完成 60–90 秒短講', '評估訊息順序與可理解度。', '短講 rubric'),
  slide(67, 'P6', '45–47', '歷史人物微研究回報', 'Presentational', ['E01-031'], '介绍一位中国历史人物，并说明他的姓。', '寻找历史名人：介绍一位中国历史名人。', '四人→全班', '每人完成 30 秒人物介紹', '資料為學生研究結果，不提供教師唯一答案。', '研究卡／計時器'),
  slide(68, 'P6', '47–49', '對話反思', 'Interpersonal + Presentational', ['E01-033'], '读对话，说说感受，并回答同伴一个问题。', '读对话，谈体会。', '兩人', '完成 30 秒反思＋一個追問', '收集下一課需要的語言問題。', '反思卡'),
  slide(69, 'P6', '49–50', '總結與能力檢核', 'All modes', [], '勾选你已经会做的事情，并说一句：“现在我能……”', '课末检核：我现在能……', '個人', '完成總結 exit ticket', '不以詞語分數結束本課，以能力表現結束。', 'Final exit ticket')
];

const vietnameseStudentText = slides.flatMap((item) => [
  { slide: item.no, field: 'student_instruction_zh', value: item.instruction },
  { slide: item.no, field: 'student_content_zh', value: item.content }
]).filter((item) => /[À-ỹĐđ]/u.test(item.value));
if (vietnameseStudentText.length) {
  throw new Error(`Student-facing text must be Chinese-only; Vietnamese characters found in ${vietnameseStudentText.map((item) => `${item.field}@${item.slide}`).join(', ')}`);
}

const exerciseSlideMap = {};
for (const item of source.exercises) exerciseSlideMap[item.record_id] = [];
for (const item of slides) for (const ref of item.refs) exerciseSlideMap[ref]?.push(item.no);
const missingCoverage = Object.entries(exerciseSlideMap).filter(([, slideNos]) => slideNos.length === 0).map(([id]) => id);
if (missingCoverage.length) throw new Error(`Storyboard coverage missing: ${missingCoverage.join(', ')}`);

const supportMaterials = [
  { id: 'TM-01', name: '第一課教師手冊', audience: '教師', periods: 'P1–P6', refs: '全課', contents: '每分鐘流程、教材頁碼、音檔、分組、活動規則、教師提示、即時修補、評量與答案政策', format: 'DOCX source + printable PDF', prerequisite: 'PPTX 製作前完成規格；PPTX 完成後對齊 speaker notes' },
  { id: 'PREP-A', name: '課前預習卡 A：姓名', audience: '學生', periods: 'P1–P4', refs: 'E01-034、E01-035；pp.1–9；1-1–1-6', contents: '快速閱讀、音檔接觸、姓名資訊卡、三個卡點、一個命名問題', format: '可列印 PDF／可編輯 PPTX 原稿', prerequisite: 'P1 前發放' },
  { id: 'PREP-B', name: '課前預習卡 B：姓氏', audience: '學生', periods: 'P5–P6', refs: 'E01-019、E01-031、E01-032；pp.10–16；2-1–2-5', contents: '本國姓氏比較、歷史人物微研究、朗讀準備、一個追問', format: '可列印 PDF／可編輯 PPTX 原稿', prerequisite: 'P4 結束時發放' },
  { id: 'ACT-01', name: '姓名訪談旋轉卡', audience: '學生小組', periods: 'P1–P2', refs: 'E01-003、E01-034、E01-035', contents: '訪問者／回答者／觀察者角色、問題卡、記錄欄、追問提示', format: '可裁切列印卡', prerequisite: '與 PPT slide 7–16 對齊' },
  { id: 'ACT-02', name: '起名兒公司角色與客戶卡', audience: '學生小組', periods: 'P4', refs: 'E01-016', contents: '客戶背景、性別、字數、讀音、字義、風格與文化條件；角色分工', format: '可裁切列印卡', prerequisite: 'P4 前準備' },
  { id: 'ACT-03', name: '電影演員中文名活動卡', audience: '學生小組', periods: 'P4', refs: 'E01-017', contents: '演員資料、命名空間、音義說明欄、同伴追問', format: '可列印活動卡', prerequisite: '與 PPT slide 43–44 對齊' },
  { id: 'ACT-04', name: '姓氏資訊站卡', audience: '學生小組', periods: 'P6', refs: 'E01-027–E01-032', contents: '句式站、文化站、閱讀站、朗讀／人物研究站的任務與輪換規則', format: '站點卡＋教師配置表', prerequisite: 'P6 前分站' },
  { id: 'ACT-05', name: '調查與研究表', audience: '學生小組', periods: 'P1、P4、P6', refs: 'E01-018、E01-031、E01-035', contents: '姓名資料分類、歷史人物欄位、資料來源／訪談記錄、報告大綱', format: '可列印表單', prerequisite: '與預習卡及報告 slide 對齊' },
  { id: 'ASSESS-01', name: '同儕回饋與短講 rubric', audience: '學生／教師', periods: 'P3–P6', refs: 'E01-015、E01-016、E01-018、E01-030、E01-031', contents: '訊息、互動、可理解度、連貫、理由／證據、一次重做目標', format: '半頁列印表', prerequisite: 'PPT speaker notes 使用同一欄位' },
  { id: 'ASSESS-02', name: 'Exit tickets 與 Can-Do 檢核', audience: '學生／教師', periods: 'P1–P6', refs: '形成性評量', contents: '本節我能……、聽力證據、仍需確認、下一步語言目標', format: '六張半頁卡或一份可裁切 PDF', prerequisite: '每節結束收回／拍照紀錄' },
  { id: 'ASSET-01', name: '音檔與版本 manifest', audience: '教師／製作', periods: 'P1–P6', refs: '1-1–1-6、2-1–2-5', contents: '音檔 track、教材區段、PPT slide、嵌入狀態、SHA-256、備援策略', format: 'JSON／CSV internal', prerequisite: 'PPTX export 與 audio QA 前完成' }
];

const slideHeader = ['slide_no', 'period', 'time', 'purpose', 'pbi_mode', 'source_refs', 'audio_track', 'source_pages', 'student_instruction_zh', 'student_content_zh', 'grouping', 'student_output', 'speaker_note_zh_tw', 'support_asset'];
const slideCsvRows = [slideHeader.join(',')];
for (const item of slides) slideCsvRows.push([
  item.no, item.period, item.time, item.purpose, item.mode, item.refs.join('|'), item.audio, item.source_pages,
  item.instruction, item.content, item.grouping, item.output, item.note, item.asset
].map(csv).join(','));

const coverageHeader = ['record_id', 'exercise_order', 'exercise_type', 'storyboard_slides', 'audio_track', 'source_pages', 'coverage_status'];
const coverageCsvRows = [coverageHeader.join(',')];
for (const item of source.exercises.slice().sort((a, b) => a.exercise_order - b.exercise_order)) {
  coverageCsvRows.push([
    item.record_id,
    item.exercise_order,
    item.exercise_type,
    exerciseSlideMap[item.record_id].join('|'),
    audioFor([item.record_id]),
    sourcePages([item.record_id]),
    'mapped_to_storyboard'
  ].map(csv).join(','));
}

const supportHeader = ['material_id', 'name', 'audience', 'periods', 'source_refs', 'contents', 'format', 'production_dependency'];
const supportCsvRows = [supportHeader.join(',')];
for (const item of supportMaterials) supportCsvRows.push([item.id, item.name, item.audience, item.periods, item.refs, item.contents, item.format, item.prerequisite].map(csv).join(','));

const markdown = `# 第一課〈中國人的姓名〉PPT Storyboard 與配套規格

狀態：**待 PPTX 製作前審核**
版本：v0.1  2026-08-19
格式決策：**PPTX-only；不製作 HTML、HTML presenter 或 HTML 動畫。**

## 這一步的目的

這份 storyboard 是下一步製作 PPTX 的內部製作依據。它先把 6 節課、69 張靜態投影片、35 項教材練習、11 段音檔、教師提示與配套材料對齊，避免做完 PPT 才發現活動沒有材料或時間超量。

核心教材檔仍是：

<code>work/boya-intermediate/extractions/structured-lesson-01.json</code>

來源 SHA-256：

<code>${sha256File(sourceRelative)}</code>

## 生產決策

- 學生先預習；課堂先做聽說任務，再做必要的語言修補。
- 每節 50 分鐘；第一課共 6 節／300 分鐘。
- 學生畫面：全中文操作指示＋教材簡體中文內容。
- 教師資訊：speaker notes 與教師手冊，不放在學生主畫面。
- 每張活動投影片都要有：時間、分組、步驟、產出。
- 35 項教材練習全部有 storyboard slide 對應；開放題不製造唯一標準答案。
- 音檔將在 PPTX 生產階段嵌入或以實際 PowerPoint 測試過的方式提供。

## Deck 結構

| 區段 | 投影片 | 課堂功能 | PBI 主軸 |
|---|---:|---|---|
| Global | 001–005 | Can-Do、最終任務、課堂運作與聽力策略 | All modes |
| P1 | 006–017 | 預習回收、姓名訪談、聽力證據 | Interpretive → Interpersonal |
| P2 | 018–027 | 替換、對話重建、句式資訊站 | Interpersonal |
| P3 | 028–037 | 立場聽力、文化閱讀、諧音短講 | Interpretive → Presentational |
| P4 | 038–048 | 起名兒公司、演員中文名、調查報告 | Interpersonal → Presentational |
| P5 | 049–057 | 姓氏交換、第二組聽力、對話重建 | Interpretive → Interpersonal |
| P6 | 058–069 | 姓氏資訊站、研究回報、Can-Do exit | Interpretive → Presentational |

## 逐張投影片 storyboard

完整 CSV 版本：

[lesson-01-ppt-storyboard.csv](./lesson-01-ppt-storyboard.csv)

| Slide | 節次／時間 | 目的 | PBI | 教材／音檔 | 學生操作（全中文草稿） | 分組 | 產出 | 配套 |
|---:|---|---|---|---|---|---|---|---|
${slides.map((item) => `| ${item.no} | ${md(item.period)} / ${md(item.time)} | ${md(item.purpose)} | ${md(item.mode)} | ${md(item.refs.join(', ') || '—')}${item.audio ? ` / ${md(item.audio)}` : ''} | ${md(item.instruction)} | ${md(item.grouping)} | ${md(item.output)} | ${md(item.asset)} |`).join('\n')}

## 35 項教材練習 coverage

完整 CSV 版本：

[lesson-01-exercise-slide-coverage.csv](./lesson-01-exercise-slide-coverage.csv)

| ID | 題型 | Storyboard slides | 音檔 | 狀態 |
|---|---|---|---|---|
${source.exercises.slice().sort((a, b) => a.exercise_order - b.exercise_order).map((item) => `| ${item.record_id} | ${md(item.exercise_type)} | ${exerciseSlideMap[item.record_id].join(', ')} | ${audioFor([item.record_id]) || '—'} | mapped_to_storyboard |`).join('\n')}

## 配套材料規格

完整 CSV 版本：

[lesson-01-support-materials.csv](./lesson-01-support-materials.csv)

| ID | 材料 | 使用者 | 節次 | 內容 | 格式 |
|---|---|---|---|---|---|
${supportMaterials.map((item) => `| ${item.id} | ${md(item.name)} | ${md(item.audience)} | ${md(item.periods)} | ${md(item.contents)} | ${md(item.format)} |`).join('\n')}

### 教師手冊必須與 PPTX 對齊

教師手冊的每一節要能從 slide number 直接找到：

- 當節 Can-Do 與證據。
- 預習回收方式。
- 音檔 track 與播放次數。
- 分組、角色、時間與活動產出。
- 只在必要時使用的語言修補提示。
- 回饋與重做步驟。
- 開放題不提供假造標準答案的處理方式。

### 預習卡必須產生課堂證據

- PREP-A 的姓名資訊卡在 P1 slide 6–16 使用。
- PREP-B 的姓氏比較卡在 P5 slide 49–50 使用。
- 歷史人物微研究在 P6 slide 58、67 使用。
- 預習卡不要求學生先查完所有詞語；要求學生帶來資料、問題或一次音檔接觸即可。

## PPTX 製作時的固定限制

- 不把 69 張 storyboard 直接等同於 69 張必須塞滿文字的投影片；題目過長時可使用清楚的分頁，但不得刪除內容。
- 不把所有答案放在學生畫面；只顯示任務、問題與必要的輸入。
- 開放題使用活動規則與評量面向，不製造來源沒有的唯一答案。
- 句式頁面必須讓學生使用句式完成資訊交換或表達，不做純文法定義頁。
- 任何音檔按鈕或連結都要標示 track，並在 PowerPoint 中實際測試。

## 下一個 gate

請審核：

1. 69 張的課堂節奏與每節時間是否合理。
2. P4 起名兒公司與 P6 姓氏資訊站的配套是否足夠。
3. 預習卡 A／B 的負擔是否符合學校習慣。
4. 是否同意先依此 storyboard 製作教師手冊與 PPTX。

審核通過後，下一步是製作教師手冊、預習卡與活動卡的實際檔案，並開始原生 PPTX。
`;

const manifest = {
  package: 'lesson-01-ppt-storyboard-and-support-spec',
  generated_at: new Date().toISOString(),
  status: 'pending_storyboard_review',
  format: 'native-pptx-only',
  html_required: false,
  canonical_source: sourceRelative,
  canonical_source_sha256: sha256File(sourceRelative),
  slide_count: slides.length,
  period_count: 6,
  minutes_per_period: 50,
  total_minutes: 300,
  exercise_count: source.exercises.length,
  exercise_coverage_count: Object.keys(exerciseSlideMap).filter((id) => exerciseSlideMap[id].length > 0).length,
  support_material_count: supportMaterials.length,
  audio_track_count: source.audio_map.length,
  student_language_policy: 'Chinese-only student-facing text; Simplified Chinese target content',
  output_files: [
    'lesson-01-ppt-storyboard.md',
    'lesson-01-ppt-storyboard.csv',
    'lesson-01-exercise-slide-coverage.csv',
    'lesson-01-support-materials.csv',
    'manifest.json'
  ]
};

fs.writeFileSync(path.join(outputDir, 'lesson-01-ppt-storyboard.md'), markdown);
fs.writeFileSync(path.join(outputDir, 'lesson-01-ppt-storyboard.csv'), `${slideCsvRows.join('\n')}\n`);
fs.writeFileSync(path.join(outputDir, 'lesson-01-exercise-slide-coverage.csv'), `${coverageCsvRows.join('\n')}\n`);
fs.writeFileSync(path.join(outputDir, 'lesson-01-support-materials.csv'), `${supportCsvRows.join('\n')}\n`);
fs.writeFileSync(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ outputDir, slideCount: slides.length, exerciseCount: source.exercises.length, exerciseCoverageCount: manifest.exercise_coverage_count, supportMaterialCount: supportMaterials.length, audioTrackCount: source.audio_map.length, sourceSha256: manifest.canonical_source_sha256 }, null, 2));
