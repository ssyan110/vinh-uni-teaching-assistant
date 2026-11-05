# 博雅教材来源资料库流程

状态：现行流程｜版本：1.0｜建立日期：2026-11-02

## 目的与先后顺序

先集中整本教材的来源、位置与不确定项，完成资料库检查和教师审核，再做单课审核稿。具体课次版本获批后才制作 storyboard、图片或 PPT；资料库审核、课次批准、技术检查、人工试听、课堂播放和发布分别记录。

```text
确认课程与教材
  → 盘点原始来源
  → 逐页提取并保留来源
  → 汇入每本教材唯一的 SQLite 主库
  → 完整性与来源核对
  → 生成只读资料库审阅视图
  → 教师审核资料库及缺口
  → 生成逐课内容审核稿
  → 该课内容明确批准
  → 依线上／实体分流制作及独立 QA
```

## 权威来源与存放

- 每本教材一份主库：`textbooks/<textbook_id>/source/derived/teaching-materials-database.sqlite`；不可跨教材混库。
- SQLite 是唯一结构化主库；XLSX、逐课 Markdown 和报告均为只读导出，不可将旧 JSON、临时表或副本作为平行主库。
- 原教材／配套册 PDF、音频、QR 截图、OCR 和生成输入留在来源目录或有版本的 run staging。`source_inputs` 记录路径、类型、大小、SHA-256；数据库记录结构化摘录及来源页关系。
- `source/derived/README.md` 记录主库、表和未结事项；历史版本仅作证据，不自动作为生成输入。
- Book I 先例：`textbooks/boya-elementary-i/source/derived/README.md` 与其数据库核对记录采用单一 SQLite 主库、稳定课次键、来源页映射和状态记录。Book II 保留此结构，并补上活动、QR、音轨、逐页听力文本和参考答案等关系表；不要假设 Book I 已有这些扩展表。

## 执行流程

### 1. 确认身份和范围

记录 offering、班级、`textbook_id`、覆盖课次及 `lesson_key=<textbook_id>:<lesson_id>`；核对目录、来源版本和缺页。先读本流程、项目规范及 Book I README／crosscheck，再定字段；不可按历史 PPT 结构倒推数据库。

### 2. 盘点来源

盘点教材扫描、配套听力文本／答案、逐课 OCR、已有课次 JSON／审核表、出版社 QR 页面和本地音频。保留原件并计算输入 SHA-256；记录缺页、页序异常、空 OCR、命名不一致和无法打开的来源，不推测补全。

### 3. 抽取并结构化

- 逐页保存原始 OCR；分列教材 PDF、配套册 PDF 和教材印刷页码。修订文本与原文分存并留记录。
- 分存教材词形、拼音、词性、义项候选及课次位置；专有名词单列，重复项不得静默合并。
- 分存活动／练习原题名、标记候选、印刷页、PDF 页、来源全文及音频关系。编号抽取结果须标为候选并对照扫描页。
- 每课 QR 保存解码 payload、来源页、最终跳转页、标题和解析状态；逐条关联网页清单、出版社音轨编号、Audio 标记与本地文件。
- 听力文本／答案按配套册页保存原文、文档 ID、页码和状态，并标作教师参考；答案不得进学生端或默认视为标准答案。
- 建库后再合并越南文释义和例句候选。专用 ChatGPT 流程为每词生成释义及两条简短例句，并留输入／输出版本和审核状态；候选不等于批准。
- 教学重点／语法须在对照听力文本与教材页后提炼，并逐条记录来源；不可只按课名或自动摘要推定。

### 4. 建主库并做机器核验

用 SQLite 外键、稳定主键和规范关系表，至少记录：课程／课次、来源文档／输入哈希、来源页／印刷页映射、词语及课次出现、释义／例句候选、活动／页码／音频、QR／音频清单、听力文本页、答案来源页、逐课状态／来源审查报告、质量问题和修订历史。

全册核对课次数、页数及词语、活动、音轨、QR、听力文本的来源可追溯性；运行 `PRAGMA integrity_check`、`PRAGMA foreign_key_check`，核对关键计数、唯一键和输入哈希。XLSX 导出成功不代表资料完整。

### 5. 核音频与二维码

逐课打开 QR，记录出版社页标题、课次、轨数和 URL；逐条比对网页 Audio 编号与本地音频，并查 HTTP 状态、Content-Type、远／本地 Content-Length 及文件存在性。长度一致不证明字节相同、已试听或课堂可播；未重下载不得标作“已下载”。人工试听与教室播放单独记录。

`answer_label_ocr_hit` 仅表示 OCR 识别到“答案”等字样，可能漏检或把封底误报。分别记录扫描页答案栏、OCR 命中和逐题核验；OCR 命中不代表答案有效。

请求超时或无响应时，可完整重跑一次；每次结果写入带时间的数据库记录。再失败则保留具体课次／音轨的 `needs_review`，不可用旧通过记录覆盖。

### 6. 生成资料库审阅包

从 SQLite 导出只读 XLSX；总览列出主库路径、范围、状态、审核规则和主要缺口。核对来源／印刷页、课名、OCR、词表、活动标记／页码、音频对应、配套文本／答案页、QR 跳转、缺页及所有 open findings。逐课稿也须直接读取数据库并显示来源状态，不能替代整库审核。

学生 PPT 的教材练习页依既定规则只显示教材练习／活动标记、教材印刷页码与适用 `Audio n-n`；不复制完整题目。原文和答案留在教师来源库中。

### 7. 审核、批准与后续制作

教师审核整库后，将更正连同来源、状态和版本写回 SQLite，重新导出并读回。未解决项保持 open。整库审核完成后才交付单课审核稿；其批准须绑定 `lesson_key`、版本、文件 hash、课件范围和证据，并通过 canonical scoped content-approval gate，方可制作视觉或 slides。技术通过不代表词义、例句、教学重点或课件获批。

## Book II 当前可执行命令

在项目根目录运行；JSON、XLSX 和逐课 OCR 必须同版本。仅确认新输入并准备原子重建时使用 `--replace`。

```bash
RUN=.agent/runs/boya-elementary-ii-content-library-20261102/staging
python3 scripts/build_boya_elementary_ii_teaching_database.py \
  --source-json "$RUN/博雅初级起步篇II-2027-spring-内容资料库审阅稿-v05.json" \
  --source-xlsx "$RUN/博雅初级起步篇II-2027-spring-内容资料库审阅稿-v05.xlsx" \
  --transcript-dir "$RUN/听力文本-逐课来源OCR" \
  --replace

python3 scripts/sync_boya_elementary_ii_qr_audio.py
python3 scripts/import_boya_elementary_ii_audit_reports.py
python3 scripts/export_boya_elementary_ii_database_review.py
python3 scripts/export_boya_elementary_ii_lesson_review.py \
  --lesson-key boya-elementary-ii:lesson-01 \
  --output "$RUN/第1课-线上预习内容审核稿-v02.md"
```

独立复核报告先存于 run staging，再以 SHA-256 导入 `content_audit_reports` 并列入总 XLSX。审阅表和逐课稿均从默认 SQLite 主库生成；逐课稿须指定精确 `lesson_key` 与输出路径。检查摘要及完整性后读回 XLSX 和逐课稿，不能以退出码代替内容审核。新教材需有专用导入／同步脚本，但沿用单一主库原则，不套用 Book II 脚本。

## 此次复盘与已知边界

本次偏差及纠正：曾先做第1课学生页审核稿，跳过全册资料库审核；旧稿保留为历史证据，第1课稿已改为数据库派生审阅稿，未批准课次或制作 slides。Book II 的计数、核验结果、页码修订、封底排除、第16课缺页及教师待审项统一记录在 `textbooks/boya-elementary-ii/source/derived/database-crosscheck-2026-11-02.md`，此流程不重复维护该状态快照。
