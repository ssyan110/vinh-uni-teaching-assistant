# 第九课 PPTX draft QA

- 课次身份：`boya-quasi-intermediate-i:lesson-09`
- 课题：`北方菜和南方菜`
- 日期：2026-09-03
- 状态：`draft_not_approved`

## 已完成

本次修复先处理图片生成管线：旧版脚本使用 `rsvg-convert` 生成 SVG/vector 线稿，且没有视觉风格门禁，因此不符合 L1–L6 finalized 的教材插画风格。旧 vector 入口已停用，改为注册并验证 hand-painted watercolor／colored-pencil 栅格 PNG；随后重新嵌入封面、27 个词语页、三篇短文分隔页、短文记录页与综合表达相关页面。短文／综合页面不再优先使用第一课通用 divider 图片。

| 检查 | 结果 | 证据 |
| --- | --- | --- |
| 课次 draft gate | PASS | `scripts/production_gate.py`；status `ready`；blockers `[]` |
| 课次身份 | PASS | `scripts/validate_lesson_identity.py`；20 scoped lessons |
| 在线预习 PPTX | PASS | 72 张；16:9；路径 `10-design/pptx-draft/online/lesson-09-在线预习.pptx` |
| 实体课 PPTX | PASS | 57 张；16:9；路径 `10-design/pptx-draft/face-to-face/lesson-09-实体课.pptx` |
| 教材页码标记 | PASS | 在线 57/57；实体 37/37；PPTX 与 PDF 均验证通过 |
| 可见文字字号 | PASS | 两份 PPTX 显式字号最小 20 pt；没有低于 20 pt 的记录 |
| 线上句式例句 | PASS | 16 个句式页面的例句均为 35 pt |
| 字体属性 | PASS | 可见文字的 `ea`、`latin`、`cs` 字体槽仅使用 `KaiTi` 与 `Times New Roman` |
| PPTX ZIP | PASS | 两份 PPTX `unzip -t` 无错误 |
| 图片内嵌 | PASS | 线上 31/31 个第九课图片候选以 hash 匹配；实体 4 个使用到的第九课图片以 hash 匹配 |
| 图片风格管线 | PASS | `scripts/generate_lesson09_raster_assets.py`；31/31 为 PNG 栅格候选；旧 `scripts/generate_lesson09_assets.py` 已改为停用提示；两份 PPTX 均无 `ppt/media/*.svg` |
| 共用 PPT 图片门禁 | PASS | `scripts/build_l23_pptx_drafts.js` 现在遇到 SVG 或未声明 raster generation mode 会直接停止；第九课已通过该门禁重新生成 |
| 当前整份预览 | PASS | `qa-preview/lesson-09-online-contact-sheet.jpg`（72 页）与 `lesson-09-face-contact-sheet.jpg`（57 页）已由当前 PDF 重新生成，不再使用旧 contact sheet |
| 词语与例句 | PASS | 27 个词语均有越南文意思；例句库每词恰好 2 条；16 个句式每项恰好 2 条 |
| `早茶` | PASS | meaning_vi 为 `dim sum, điểm tâm sáng`；未使用「早餐」 |

## 尚未批准／未宣称完成

- 来源语义审核、音频语义核对与 PowerPoint 实际播放仍待人工完成。
- 31 张图片仍是 `candidate_pending_review`，未宣称来源／视觉批准。
- 教师手册、预习卡与活动 DOCX 尚未进入批准版本。
- 当前两份 PPTX 仍在 `10-design/pptx-draft/`，未写入 `20-approved/`、`30-qa/current/` 或 `40-release/`。
- LibreOffice PDF 预览环境缺少真实楷体，出现字体替代警告；PDF 只作为结构／版面预览证据，不能替代 Microsoft PowerPoint 字体与音频播放检查。
