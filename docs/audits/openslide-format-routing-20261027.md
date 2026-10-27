# OpenSlide 格式分流修订记录

2026-10-27，Adam 确认：今后一、二年级所有学期的实体课使用 OpenSlide 并同步统一首页；PPT／PPTX 用于线上预习。新实体课不制作 PPTX 备份。已有定稿及历史批准记录保留。

## 本次处理

- `AGENTS.md`、`PROJECT_REQUIREMENTS.md`：取消每课两份 PPTX 的命名要求，明确学期、年级、格式和统一首页；保留内容分流与逐页内容批准。
- `.agent/agent-workflow-index.md`、`.agent/skills/`、`docs/workflow/requirements-registry.md`、实体课标准与活动流程：同步格式路由和验收范围；线上、实体活动和历史定稿分别处理。
- `docs/boya-elementary-i-full-book-semester-plan-2026-09-15.md`：撤销全册 50 份 PPTX 的旧规划；课件按实际排课和活动确定。
- `scripts/lessonctl.py`：保留 finalized-PPTX 历史双文件 intake，诊断结果与命令帮助明确说明适用范围，并指出新实体课的 classroom-html gate；既有来源、安全检查和 blocker 未放宽。`build_l23_pptx_drafts.js` 默认线上，历史实体模式需显式 `legacy-face`。
- `docs/workflow/classroom-html-lifecycle.md` 保留现有限制：实体课可完成 draft 和首页同步，正式 HTML authority／release 写入仍不受支持；同步和构建不是批准或正式发布。

旧审核报告、定稿文件、课次批准、历史 registry 和 release 记录均不按新规则改写。新的学期仍须以实际 offering、教材和课次身份登记，不把 2026-fall 的课表、内容或审核套用到未来班级。
