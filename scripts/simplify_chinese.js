const traditional = '並來係倆個們側備傳價儕優兒內兩冊別刪則剛創劃劇劉動務勝勢區協參員問啟單嗎國圍園圖團執報場塊壇壓壞夠夢夥奧學實審寫將專尋對導層島師帶幫庫張強彈彙後徑從惱愛態慣憂憶應戰戶拋捨掃採換擇擔據擬攝敘數斷於時暫書會査條棄業榮構樂標樣樹橋機橫檔檢欄權歡歷氣決沒況測準溝滿漢潔瀏為無煩牆犧狀獎獨現環產畫異當發盤眾確碼礎礙禦禮種稱競筆節範簡籤糾紀約紋納純紙級細紹終組結絕給統經維綱網緒線編練縮總績織繞繪繼續羨義習聞聲職聽脅脫臨與興舊華葯蓋薦藍處虛號術衝補裝裡製複見規視覺覽觀觸訂計訊討記訪設診註評詞詢試詮話該誇認語誤誦說誰課調談請論諦諧諮謙講證識譯議護讀變讓讚豐負貫責貼資賞質賴賽贊贏趙跡蹤車軸較輔輩輪輯輸轉辭辯農這連週進遊運過達違適遷選還邊邏鄉釋針鈕銜錄錨錯鍵鏡鐘長門開間閘閱關階際險雙離難電霧靜響頁項順須預頭頻題願類顧顯風飾養餘饋駁驗驟體麼黃點齊';
const simplified = '并来系俩个们侧备传价侪优儿内两册别删则刚创划剧刘动务胜势区协参员问启单吗国围园图团执报场块坛压坏够梦伙奥学实审写将专寻对导层岛师带帮库张强弹汇后径从恼爱态惯忧忆应战户抛舍扫采换择担据拟摄叙数断于时暂书会查条弃业荣构乐标样树桥机横档检栏权欢历气决没况测准沟满汉洁浏为无烦墙牺状奖独现环产画异当发盘众确码础碍御礼种称竞笔节范简签纠纪约纹纳纯纸级细绍终组结绝给统经维纲网绪线编练缩总绩织绕绘继续羡义习闻声职听胁脱临与兴旧华药盖荐蓝处虚号术冲补装里制复见规视觉览观触订计讯讨记访设诊注评词询试诠话该夸认语误诵说谁课调谈请论谛谐咨谦讲证识译议护读变让赞丰负贯责贴资赏质赖赛赞赢赵迹踪车轴较辅辈轮辑输转辞辩农这连周进游运过达违适迁选还边逻乡释针钮衔录锚错键镜钟长门开间闸阅关阶际险双离难电雾静响页项顺须预头频题愿类顾显风饰养余馈驳验骤体么黄点齐';

const characterMap = Object.fromEntries(
  [...traditional].map((character, index) => [character, simplified[index]]),
);
Object.assign(characterMap, { 僅: '仅' });
const traditionalPattern = new RegExp(`[${traditional}僅]`, 'g');

function toSimplified(value) {
  return String(value).replace(traditionalPattern, (character) => characterMap[character] || character);
}

function toTeacherGuideChinese(value) {
  return toSimplified(value)
    .replace(/PPT storyboard/gi, '投影片流程表')
    .replace(/PPT slide/gi, '投影片')
    .replace(/Exit tickets?/gi, '出口卡')
    .replace(/exit tickets?/gi, '出口卡')
    .replace(/coverage/gi, '练习对应')
    .replace(/rubric/gi, '评量表')
    .replace(/jigsaw/gi, '信息拼图')
    .replace(/source of truth/gi, '内容依据')
    .replace(/\btrack\b/gi, '音频编号')
    .replace(/ACTFL Proficiency-Based Instruction/gi, 'ACTFL 能力导向教学')
    .replace(/Can-Do/gi, '我能目标')
    .replace(/资讯/g, '信息')
    .replace(/同侪/g, '同伴')
    .replace(/讯息/g, '信息')
    .replace(/文件信息/g, '文件信息')
    .replace(/栏位/g, '栏目')
    .replace(/计画/g, '计划')
    .replace(/回馈/g, '反馈')
    .replace(/4-turn/g, '四轮')
    .replace(/Final\s+出口卡/g, '最终出口卡')
    .replace(/收回 出口卡/g, '收回出口卡')
    .replace(/与 出口卡/g, '与出口卡')
    .replace(/总结 出口卡/g, '总结出口卡');
}

module.exports = { toSimplified, toTeacherGuideChinese };
