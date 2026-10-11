# 教師 dashboard 操作審查

範圍：W04-L01L10-20261006、2026-fall、boya-elementary-i 第1—10課。虛構情境為教師帶一班學生完成累計聽力測驗。這是agent模擬操作，不是真人教師研究或發音驗收。

已使用已安裝agent-browser 0.33.2與隔離headless Chrome實際操作本地dashboard。CLI在家目錄node_modules/.bin，先前僅查PATH而判斷未安裝已撤回。CDP http://127.0.0.1:9236，session teacher-audit，獨立/tmp profile；不使用共享Mac互動視窗。新累計exam_id路由已核實，audio-gate-readonly.json回傳ready且human_audio_acceptance=false；先前单課run init失敗不構成本審查阻塞。

## 操作步驟、預期與實際

|步驟|預期|實際|證據|
|---|---|---|---|
|入口／說明|明確識別題數、音源版本及待批准狀態|30＋20、100分與私有Form說明可見；Qwen版本未明示；學生題目／入口無連結|01-entry.png|
|逐段選擇33段|題號與音檔載入對應|33段均取得瀏覽器metadata，50題ID覆蓋；音訊內容未全部聽驗|browser-track-metadata.json|
|第1段兩次重聽|每遍正常結束，更新次數|0→1→2，顯示計畫完成，不自動下一段|browser-log-1.json|
|看題倒數／暫停|倒數階段清楚|15→14秒；按音訊暫停不停止看題倒數；只支援看題計時|browser-log-1/2.json|
|第30段暫停續播|與「中途暫停不計一遍」一致|0.707秒暫停，原生play續播後仍計一遍|03-pause-resume-count.png|
|下一段／上一段／雙擊|轉場可預測|下一段不自播、上一段可返回；dblclick下一段僅前進一段；未完成計畫仍可跳段|02-double-next.png|
|重整與瀏覽器返回|能知道是否恢復|重整、about:blank後back都回第1段、次數清零|browser-log-1/2.json|
|缺音檔故障恢復|有效提示、可重試|暫時DOM置換不存在音源後出錯，重聽無法恢復；重新選段才恢復；提示目錄錯誤|04-load-failure.png|
|列表選末段|播放控制仍可見|列表捲到末段後控制面板完全在viewport上方|06-selected-offscreen.png|
|末段兩遍／結束|清楚結束與檢查提交提示|兩遍完成，下一段disabled；仍顯示「再到下一段」且無結束／提交階段|08-final-complete.png|
|重聽雙擊／清零|明確防護|重聽dblclick未見JS錯誤；清零立即執行，沒有確認|browser-log-3.json|
|學生／投影畫面|適合學生閱讀、無答案|本地頁面無可見答案／逐字稿／超連結；教師內部說明與控制同頁，16–17px系統字體；真正Form及教室視距未測|01-entry.png、computed styles|

## T01 · critical · 主頁音源未驗收且版本識別不足

觀察：dashboard.html 的33條 file 全指向 audio-repair-qwen-serena-v01；該 repair-manifest status=technical_review_pending；頁首只寫「全部使用现有原速音频」。

預期：入口應明確顯示音源版本、待審狀態、禁止正式施測；未驗收不應造成可用錯覺。

建議：加入音源版本與驗收狀態；教師完成驗收前保留明確阻塞。

## T02 · high · 時間核算與主頁現行音源漂移

觀察：由主頁資料計算一遍295.7028秒、按計畫533.9256秒；加看題665、間隔300、作答1650、切換198及前後360秒=3706.9256秒（61.78分）；timing.md仍為59.46分，頁首55–60分。

預期：時間估算須綁目前音源版本。

建議：重新核算目前未驗收版本並展示來源；正式時段仍由教師決定。

## T03 · high · 暫停計數說明與程式條件不一致

觀察：第30段播放0.707秒後按暫停，使用原生play續播至ended；實際顯示完整播放1次／計畫2次，與「中途暂停不计」不一致。browser-log-1/2，03截圖。

預期：計數的文字定義與狀態轉移一致。

建議：明確決定暫停續播是否算一遍並對齊程式及說明；需瀏覽器重測。

## T04 · medium · 載入失敗提示指向錯誤目錄

觀察：只在隔離頁面DOM將audio.src改為不存在的file:///tmp/teacher-audit-nonexistent.wav，load後出現錯誤audio文件夹提示；重聽仍失敗；上一段→下一段重新載入恢復正在播放。未修改任何檔案。04截圖。

預期：教師看提示即可定位目前缺失檔案。

建議：顯示實際音檔相對路徑、版本及重新載入動作。

## T05 · medium · 計時僅涵蓋看題，作答與兩遍間隔需手動管理

觀察：timer只讀preview_seconds；between_plays_seconds、answer_seconds僅顯示文字；沒有整卷elapsed或結束流程。

預期：教師能分辨看題、第一次作答、第二次作答及提交階段。

建議：提供教師可控階段計時與末段檢查／提交提示，避免自動縮短作答。

## T06 · medium · 可跳段與重整失去進度的防護不足

觀察：兩次播完第1段後重整：回到第1段0次；選第33段後離頁about:blank再back，同樣第1段0次。未完計畫可next。清零立即執行無確認。原生dblclick下一段僅前進一段，不能宣稱雙擊必定跳段。

預期：意外操作不應悄悄失去施測位置／次數。

建議：增加未完播放提示、明確恢復政策及清零確認；雙擊與刷新仍待實測。

## T07 · medium · 字體與投影可讀性有待驗證

觀察：1280×900真實Chrome截圖顯示教師控制面板與內部說明混在同頁；computed style為body/buttons 16px system-ui，timing17px，h1 26px；與字體規則不符。無橫向溢出，但實際教室投影未測。

預期：中文與拉丁字體遵循專案規則，教室投影可讀。

建議：提供教師／投影顯示分離，使用規定字體；以教室視距驗證。此處未測實際渲染。

## T08 · high · Kokoro純台詞的人名身份仍需解決

觀察：直接核對spoken-text-review.json的units.spoken_text與題干：以下證據列出指定題對應台詞；多處問小王／小林而台詞無自我介紹。此觀察屬文字語義，並非可靠聲調聽驗。

預期：題干指定人物應能從錄音資訊識別。

建議：先決定自我介紹、題干改為說話者或可識別聲線等方案，再批准新內容及驗收；不要將樣本替換主頁。

## T09 · medium · 長列表選段後播放面板留在畫面外

觀察：逐一按33段列表後，第33段已選中，但main.getBoundingClientRect().top=-1750.19、bottom=-1163.19，整個播放面板在viewport上方；06截圖僅見列表與清零。

預期：選段後能直接操作播放並看見当前題號。

建議：選段後將播放面板捲入可視區或固定控制列；保留題號與音源。

## Kokoro純台詞人物辨識證據

Kokoro仅試聽未驗收，主頁仍使用Qwen；以下为直接核對台詞與題干，不是假稱已聽出聲線或聲調。

- E05-B01／題[14, 15]：这是我的朋友安娜。 ／ 安娜，你是哪国人？ ／ 我是英国人。 ／ 我也是英国人，认识你很高兴。
- E06-B01／題[17, 18]：这是谁的笔？是你的吗？ ／ 不是我的，是李美的。 ／ 这个本子呢？ ／ 这个本子是我的。
- E07-B01／題[20, 21]：你住在学校里吗？ ／ 不，我住在学校外边。 ／ 远吗？ ／ 不远，就在学校东边。
- E08-B01／題[23, 24]：今晚六点一起吃饭吧。 ／ 六点我有课，七点下课。 ／ 那七点半食堂见。 ／ 好。
- E10-B01／題[29, 30]：西瓜怎么卖？ ／ 三块钱一斤。 ／ 我要两斤。 ／ 一共六块。 ／ 给你十块。

## 限制與交付

未測：real student Google Form screen/submission/score visibility、classroom projector/back-row readability、human tone/pronunciation validation、classroom speaker acoustics、real teacher study、timed completion of all 50 questions、all 33 audio content listening。沒有真實Form提交、雲端資料或成績更動，沒有發佈或修改教材與程式。完整操作命令與輸出見browser-log-1/2/3.json；圖檔均本地保存。findings.json含方法、嚴重性、建議與來源SHA-256。瀏覽器技術播放成功不等於發音、教師rehearsal或施測批准。

## T10 · low · 末段提示仍要求下一段

第33段播完兩次仍顯示「再到下一段」，next卻disabled。建議改為全卷檢查與提交提示。見08-final-complete.png。

專用teacher-audit session與臨時Chrome已關閉，共享互動瀏覽器未使用、可由學生agent繼續。學生角色應使用自己的session及CDP/profile；已安裝CLI絕對路徑為/Users/ssyan110/node_modules/.bin/agent-browser，先connect後open。
