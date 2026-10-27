# 線上預習 PPTX：跨學期製作與交付

適用於新學期線上預習；一年級與二年級實體課走 `classroom-html-lifecycle.md`。學期前可批次準備線上課件，不必先完成實體課活動。課程來源、詞語、教材頁碼、播放方式與學生可讀性要求仍須依該班教材規則逐項檢查。

## 1. 審閱內容

在對應課次 `10-design/` 建立逐頁 JSON 審閱稿。它同時是製作輸入與具體審閱內容；必須列出全部學生可見文字、順序、所用資料／素材、教材頁碼、音軌、教師備註和必要版面資訊。`lesson_key`、`offering_id`、`class_scope`、`artifact_id` 必須與批准記錄一致。學生可見文字應完整可執行；不要用版面設定取代具體文案。

`slides` 第一頁 `kind` 為 `cover`，第二頁為 `learning_flow`。每頁 `elements` 按顯示順序列出 `text`、`image`、`shape` 或 `table`；每個元素都需要以英寸標示 `x`、`y`、`w`、`h`。文字使用 `text` 與 `font_size`。新製作或修訂的線上預習 PPTX，主要學生內容最小 `25 pt`，包含詞類、意思、用法、補充、例句、目標、任務指令、題目、表格和作答提示。只有頁眉、投影片編號、教材頁碼和右上角 Audio 純文字標記可明確寫 `text_role: chrome`，沿用一般 `20 pt` 輔助下限（2026-fall 一年級《初級起步篇 I》為 `23 pt`）；其他文字默認為主要內容。舊定稿較小的正文只作版式參考；放不下時調版或拆頁，不能用 autofit 降到 `25 pt` 以下。實體課 OpenSlide 的 CSS 字級另依實體課標準。可用 `notes` 寫教師備註，`source_refs` 登記來源，`audio` 登記例如 `Audio 1-1` 的來源音軌；對應純文字須放右上角。詞語頁 `kind: vocabulary` 的 `vocabulary` 物件列出 `word`、`pinyin`、`part_of_speech`、`meaning_vi` 和兩條短 `examples`，這些內容與相關圖片均須出現在該頁。每個詞語的兩條例句先登記在 `course/boya-example-bank.json`，再把本版本例句庫快照放入 `10-design/`，由審閱稿 `example_bank_path` 指向並列入批准記錄的 `artifacts`。生成器逐詞核對全域資料庫、批准快照及畫面一致；自然度、教材詞語與練習覆蓋仍須人工檢查。

圖片使用課次 `10-design/` 內的 project-relative `path`，在批准文案時可先約定圖片路徑，具體素材在內容批准後建立。圖片必須可解碼，生成器把它嵌入 PPTX 並記錄實際 hash。學生端不依賴外部圖片或嵌入音頻。其他版面與元素格式、檢查方式見 `scripts/build_scoped_online_pptx.py`。

來源快照、來源核對報告和這份 JSON 審閱稿須在 `10-design/approvals/` 的 `artifact-content` 記錄中分別列出路徑及 hash，另連結 Adam 對該具體版本的真實明確決定。記錄格式及內容變動失效規則見 `canonical-workflow-contract.md`；範圍包括學期、班級、課次與版本。不要替使用者建立批准。

版式必須綁定實際成品，不能只列出坐標。先讀 `course/ppt-style-registry.json` 的適用參考；一年級使用 Adam 指定的第25課實物快照，二年級保留自己的適用定稿參考。把只讀參考複製到本課 `10-design/`，審閱稿的 `layout_reference` 列 `path`、`sha256` 並納入批准輸入；每頁填 `reference_slide`（從1開始），文字和替換圖片填 `reference_shape_id`，要移除的原生框列在 `remove_shape_ids`。生成器直接複製原生頁面、裝飾形狀及通用素材，再替換宣告內容；未替換的原課文字、無效框號或缺少實際參考會停止。詞語情景圖不得以泛用符號代替。欄目與複習方法按本課內容完整落實，不把參考課頁數當固定頁數。

## 2. 生成與檢查

```sh
python3 scripts/build_scoped_online_pptx.py --lesson-key KEY --offering-id OFFERING --class-scope CLASS --artifact-id ID --approval-record PROJECT_RELATIVE_APPROVAL
```

命令先執行版本專屬 gate，只能建立 `<lesson>/10-design/pptx-draft/online/<offering>/<artifact-id>/`，且不覆蓋已有目錄。它產生可編輯 PPTX 和 `build-manifest.json`；記錄實際頁數、審閱稿、圖片、來源映射、PPTX hash 與 draft 狀態。它核對實際 PPTX 文字與頁序、封面與流程頁、字級底線、素材解碼、ZIP 及音頻格式；這些檢查不等於來源正確或視覺驗收。製作失敗時保留輸出供檢查，使用新版本 ID 重新生成。

逐頁渲染 PPTX，檢查實際可見內容、中文字體、越南文、圖片、重疊、截斷、教材頁碼及音軌標示；同時核對所用教材與課程要求。檢查實際 PowerPoint 開啟與編輯能力，並依線上音頻配套要求記錄來源、語義、解碼、播放方式及實播；沒有做的檢查不得標成通過。生成器可用 LibreOffice 作輔助預覽，但不能把其結果冒充 PowerPoint 實播。若轉換環境沒有找到 KaiTi／Times New Roman，先修正轉換環境再檢查，不能把缺中文字的 PDF 當作合格預覽。

正式候選 QA JSON 放在版本 draft 目錄，格式為 `schema_version: online-pptx-qa-v1`，包含課次／學期／班級／版本、`pptx_sha256`、`slide_count`、`content_checked: true`、`visual_checked: true`、`status: passed`、`issues: []`。`pages` 按順序逐頁列 `{index, image, sha256, issues: []}`，PNG 使用 project-relative 路徑、至少 960×540 且非空白；圖與內容必須由相應 PPTX 實際生成和人工核對。另以 `application_check: {status: "passed", application: "實際使用的程式", evidence: {path: "本課檢查記錄路徑", sha256: "記錄雜湊"}}` 登記實際開啟與編輯檢查，不能以預覽冒充。若逐頁內容含音軌，QA 的 `audio` 清單須恰好覆蓋實際 `Audio n-n` 標籤；每條記錄 `label`、`source`（`kind: local` 時含本地 `path` 和 `sha256`，或 `kind: url` 時含 `url`）、`source_verified`、`decode_verified`、`semantic_verified`、`playback_verified`（各為實際檢查結果）、`playback_method`，以及 `playback_evidence` 的本課 `10-design/` 路徑和 hash。每個狀態須有真實檢查依據，不推定播放通過；無音軌時清單可省略。外部網址日後仍可能變動，交付後要依實際情況核對。QA 記錄是檢查證據，不是使用者批准。

實際導出後另核對可見字與審閱稿的覆蓋，尤其長指令、流程卡與頁角。原生XML仍有文字，不代表PDF或投影沒有截字；不得只靠XML、坐標及哈希宣布版式通過。語義核對要檢查標題與例句／問題是否一致。音頻的機器轉寫僅作輔助，須記錄同音誤識及比對依據；軟體靜音播放進度、教師逐段聽核與教室揚聲器測試分開記錄，依本次實際範圍執行。

目前原生參考流程的每條音頻 QA 另填 `semantic_evidence: {path, sha256}`，指向本課實際語義／來源對照記錄。發布工具核對並凍結這份證據；不能只填 `semantic_verified: true`，也不能用播放進度紀錄代替內容對照。

原生表格保留可編輯單元格。`elements` 使用 `type: table`、原生 `reference_shape_id`、`font_size`、位置與尺寸，以及完整的二維文字 `cells`；行列數須與參考表格一致。每格都必須明確替換，不能留下原課資料。表格文字同樣參與生成與發布的逐字核對；合併儲存格及長文字仍須在實際渲染後確認可見。

## 3. 正式批准、歸檔與交付

使用 `scripts/online_ppt_release.py plan`，傳入 `--lesson-key`、`--offering-id`、`--artifact-id`、`--class-scope`、`--approval-record`、`--pptx` 與 `--qa-report`，取得只讀候選 hash。核對結果與成品後，取得 Adam 對該候選 PPTX 的明確正式批准，保留原話。

正式批准證據 JSON 存在同課 `10-design/`，指定 `gate: online-package-approval`、課次／學期／班級／版本、`candidate_sha256`、`approved_by`、含時區的 `approved_at`、真實 `user_decision` 和 `approved_components: ["pptx"]`。若同一次決定明確授權指定交付，另包含 `authorized_actions: ["release"]` 與該 `release_id`。也可另存 `gate: online-release` 的獨立真實授權；不得依內容批准或技術通過推定發布。

用相同 plan 參數加 `promote --candidate-sha256 HASH --evidence PATH` 的方式執行：實際命令將 `plan` 換為 `promote`，並在其餘參數後加入上述兩項。成功後使用 `release --lesson-key KEY --offering-id OFFERING --candidate-sha256 HASH --release-id ID --evidence PATH`，再以相同課次、學期及 release ID 執行 `verify`。每次都使用新的 release ID；權威檔與交付包只從已批准位元複製，不覆蓋歷史。檢查或批准失效時停止並保留證據，不修改舊批准讓 gate 通過。

準備狀態看板按課次、學期和版本分別顯示內容批准、PPT 草稿與已核驗的 release；檔案存在不等於批准，批准不等於發布。完整測驗同步流程另依 `weekly-assessment-sync.md`。

同班同學期有替代版本時，在課次索引的 `current_online_artifacts` 以學期→班級→artifact ID 明確指向目前使用版；不按檔名或日期猜最新。看板保留舊記錄並標成「非當前版本」，不把它們的缺少發布紀錄計入目前待辦。指向不存在或重複版本時顯示問題，不刪除或改寫歷史批准。此選擇不授予成品批准或發布。
