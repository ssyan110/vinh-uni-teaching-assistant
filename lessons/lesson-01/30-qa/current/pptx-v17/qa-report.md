# 第一课 v11-final 静态 QA 记录

状态：静态检查通过，待人工接受

日期：2026-08-27

## authority 输入

- 来源包：`lessons/lesson-01/90-archive/approval-evidence-2026-08-27/social-appellation-supplement-v11/第一课-主任审核包-含文化补充-v11-final.zip`
- 来源 ZIP SHA-256：`5ae1569fbb6edbefc87403861043c9507d38b2dd21315b59e9e8fa8a3ebcb2bc`
- Adam 已确认本包，以及其中的对话、词语、练习和 Blooket 内容可以进入 `20-approved`。
- 权威 PPTX：95 张投影片、95 份 speaker notes；SHA-256 `92ec8fe6dbee4441399a6930f241aa4c5922a9549708f45c06f1a6047016090d`。
- 权威教案：SHA-256 `6cbfbb7c9ea522a3b0317feb50fcb613be01fdc14b834685fc2d334b7856d638`。
- 活动材料：22 份 DOCX 与 v11 包逐一相同；没有重新生成或覆盖活动卡。

## 已完成的确定性检查

- [x] v11 ZIP CRC 检查通过；包内 PPTX 与 DOCX 都可作为 Office ZIP 打开。
- [x] PPTX 为 16:9（`12192000 × 6858000`），95 张投影片与 95 份 notes 数量一致。
- [x] PPTX 含 49 个内嵌媒体；没有空媒体成员。
- [x] 显式字体声明符合项目政策：中文 `KaiTi`，拉丁字母 `Times New Roman`。
- [x] PPTX 文字的简繁变体扫描没有发现已知繁体字命中。
- [x] 预览 PDF 为 95 页、`960 × 540 pt`。
- [x] Blooket CSV 使用既定 8 栏表头，共 102 题（34 条词语 × 3 个题型）；答案位置分布为 27／27／24／24，结构检查通过。
- [x] 文化补充学习单 PDF 与补充视频已登记到 authority，并记录 SHA-256。
- [x] 九宫格内容仍遵守普通格放词语、功能按钮放句式／句型练习的约定。

## 需要人工复核的静态提示

- PPTX 有 74 张投影片声明了小于 16 pt 的文字；这只能提示投影可读性风险，不能由 XML 检查替代实际投影判断。
- PPTX 有 1 个顶层形状越过声明的投影片边界；须在 PowerPoint／PDF 预览中确认是否为有意出血或需要修正。
- Blooket 越南文释义仍保留外部 CC-CEDICT 来源记录；Adam 已批准课堂使用内容，但这不把外部释义变成教材标准答案。
- 原先 legacy source package 的 tree SHA-256 不一致问题已处理：快照现标记为 `historical_evidence`，并以 archive 中实际 tree hash `33acb8…e0762` 登记；当前 production workflow audit 已通过。这个历史快照仍不是新的教材来源。

## 仍未完成的 gate

- [ ] 在 Microsoft PowerPoint 中打开 v11 PPTX，逐段确认可编辑性、页面顺序和音频播放。
- [ ] 完成真实投影／后排可读性检查，并处理上述小字与边界提示（如需要）。
- [ ] 完成 6 节／300 分钟教师 rehearsal，并由教师手动接受本包。

在上述人工接受完成前，本记录不把 v11 包称为 classroom-ready；旧 62 张版本的 QA 已移到 `lessons/lesson-01/30-qa/archive/`，不可变旧 release 只保留为历史证据。
