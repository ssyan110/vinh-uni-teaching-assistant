# Kokoro 官方中文模型：九項難題樣本檢查

這是未驗收的隔離樣本，不是修復完成的測驗。主 dashboard、原始音檔、50 題考題、答案與重播次數未改動。

## 已完成

- 官方模型與 zf_001 聲音匿名下載；模型 SHA-256 `b1d8410fa44dfb5c15471fd6c4225ea6b4e9ac7fa03c98e8bea47a9928476e2b` 與官方資料一致。
- 套件只安裝在專案 `.agent/runs/w04-kokoro-samples-20261010/kokoro-env`，快取也位於該 run。沒有全域 Node/npm、家目錄依賴、付費 API、帳號或上傳。
- 同一官方模型、同一女聲 zf_001、速度 1.0、CPU float32；不混模型，不拼接電話數字，不裁尾、不拉速、不修改字典。
- 九項樣本都完整消耗 `KPipeline` 生成器；逐片段核對 graphemes 與 phonemes 完整覆蓋輸入，保留 chunk 與 unit WAV、SHA-256。
- 9/9 WAV 為 24 kHz mono PCM16，完整解碼、有限且非零、無 clipping；原訂 pause/final silence 範圍逐樣本確認為零。C 類音節的原有兩輪內容與停頓保留。
- 9/9 Chrome 本地音訊 metadata 載入及時長比對通過，外部網路封鎖。這不是聽感驗收。
- 所有來源 gate 與原 dashboard hash 仍一致。

## 必須保留的問題

1. 「花儿」預設前端輸出 `ㄏ穵1ㄦ2`，明確是分開的第二聲兒，與題目 `huār` 衝突。不能用兩個 ASR 都寫「花兒」冒充兒化通過。
2. **診斷更正：**「辅导」本調 fǔdǎo，兩個第三聲連讀通常變為 fu2 dao3。Misaki明確實作該三聲變調；原 `ㄈㄨ2ㄉㄠ3` 不能認定前端錯誤。兩個 ASR 均寫「福島」，仍需試聽。另提供 fu3 dao3 本調輸入對照，未宣稱更正確。
3. 电话全文一次生成，輸入是 `零一零，零零零零，二三零一`，即 `01000002301`（11 位、7 個零）。small 辨識 `010-000-2301`（少一個零），base 辨識 `010-0000-2301`。輸入音素覆蓋完整，不等於耳朵已確認每個零都完整；仍須實際試聽。
4. 單音節和兒化題 ASR 不可靠，不能判定「女／雨／晚／月」聲調已通過。
5. 我無法直接聽到本地播放，沒有宣稱聲調、自然度、尾句或人耳內容驗收完成。這些是 Adam 需要试听的候選樣本。
6. 移除行首角色標籤後，六題角色身份仍不明确：15、18、20、21、23、30。最小方案是在相應五組旁提供視覺角色順序表，見 `role-identity-proposals.md`；尚未改題目、答案或 Google Forms。

## 逐項結果

| 音檔 | 狀態 | 無提示雙模型 ASR |
|---|---|---|
| E04-B01 | two_asr_text_consistent_human_listening_pending | small: 你好,你叫什么名字?我叫安娜。你是老师吗?不是,我是学生。 / base: 你好,你叫什么名字?我叫安娜你是老师吗?不是,我是学生 |
| E01-A02 | isolated_syllable_asr_unreliable_human_listening_required | small: 你 / base: 女儿 |
| E03-A01 | blocked_frontend_non_erhua_conflicts_huar | small: 花儿 / base: 花兒 |
| E03-A02 | isolated_word_asr_disagrees_human_listening_required | small: 女兒 / base:  new art |
| E03-C01 | isolated_syllables_asr_unusable_human_listening_required | small: UistWantUistUistWantUist / base:  |
| E05-B01 | two_asr_text_consistent_role_identity_unresolved | small: 這是我的朋友安娜。安娜,你是哪國人?我是英國人。我也是英國人,認識你很高興。 / base: 這是我的朋友安娜安娜 你是哪國人我是英國人我也是英國人 認識你很高興 |
| E08-C01 | natural_third_tone_sandhi_not_confirmed_frontend_error | small: 明天我上午八點上漢語課10點下課中午11點半和安娜在食堂吃飯下午兩點去建福島老師 / base: 明天我上午8點上漢語課 10點下課 中午11點半和安娜在食堂吃飯下午2點去見福島老師 |
| E09-C01 | telephone_asr_disagrees_exact_digits_unverified | small: 明天我們去動物園上午8點半在學校東門見不再西門見我們坐地鐵2號線去老師的辦公室電話是010-000-2301 / base: 明天我們去動物園上午8點半在學校東門建 不在西門建我們坐地鐵二號線去老式的辦公室電話是010-0000-2301 |
| E04-C01 | two_asr_text_consistent_human_listening_pending | small: 你好 我叫李明 我姓李我是學生 不是老師 我學漢語 / base: 你好,我叫李明,我姓李,我是學生不是老師,我學漢語。 |

## 檔案與下一步

`samples.html` 是本地可播放入口；`spoken-text-review.md/json` 保存全部 33 段純朗讀文字核對。`sample-manifest.json`、`technical-verification.json`、`browser-load-check.json`、`two-model-asr.json` 提供驗證證據。

這輪只完成九項小樣本，沒有授權批量替換其餘音檔。已確認的前端詞音衝突需要明確決定處理方式，再做同模型受限修正與實際試聽；不能將本批直接宣布為測驗可用。原 dashboard 仍指向前一版，使用者先前已否定該版品質，本輪未再切換。

電話音素已逐位核對 11/11、順序正確（7個零），見 telephone-phoneme-audit.json。未重生成電話。教師集中入口為 teacher-comparisons.html。
