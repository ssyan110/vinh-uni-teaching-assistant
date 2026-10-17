# 项目规则修正记录

日期：2026-10-15。依据：[25 项原始审查](project-rules-audit-20261015.md)。用户已明确授权分派 subagents 修正。

三组分别处理规则整合、生产脚本与验证、测验与 OpenSlide；主代理整合 HTML 草稿 gate、CLI、回归与本记录。25 项均有处置；第 08 项正式 HTML 发布能力仍未实现，第 05／23 项 W05 输入缺件仍保留阻挡，不能据此宣称所有教材已可发布。

## 逐项处置

| 原编号 | 实际修正与证据入口 |
| --- | --- |
| 01 | AGENTS 删除一动作一页、两行／三步硬限制，保留完整任务与必要资料。 |
| 02 | requirements-registry 的 NAV／014 改为同号同名入口、按任务使用分层，不强制 divider 或两档框。 |
| 03 | build_l23_pptx_drafts.js 改用 pptx_audio_reference.js 纯文字 Audio n-n；verify_pptx_audio_policy.py 检查音讯、关系及播放 action；隔离 PPTX 实测。 |
| 04 | weekly-assessment skill、班级规则及项目记忆改查 assessment-management；旧 W04 范围与时长明确为历史。 |
| 05 | 新 assessment-audio-current CLI 检查当卷身份、批准 hash、音频字节及题号映射；旧 assessment-audio 保留历史修复范围。W05 缺件仍阻挡。 |
| 06 | 统一 OpenSlide 工作区 AGENTS 增加项目 adapter，覆盖重复询问、网络字体、禁止教师稿等冲突；保留 runtime 约束。 |
| 07 | AGENTS、需求及 teacher-guide reference 按本次声明交付物完成，不再强制两份 PPTX。 |
| 08 | 新 classroom-html-lifecycle 定义草稿资源、QA、教师材料及未来 authority/release 布局；新 classroom-html draft gate 校验批准及输出路径。正式 promotion/release writer 未实现，明确禁止冒用 PPTX 发布或手动改状态。 |
| 09 | face-to-face-order-contract 和检查器限定 legacy-face；L23 默认只生成线上，历史实体版须明确参数。 |
| 10 | ppt-style-registry 增加 standing choices；现行实体课直接沿用已选风格。 |
| 11 | 四步越南文流程图限定线上及明确的历史维护，当前实体课采用实际活动路线。 |
| 12 | 需求与 source-and-pbi reference 对齐已批准语言例外，不再写唯一越南文例外。 |
| 13 | 23 pt／无紫色限定适用班级、实体课或样式范围；保留线上有效基线。 |
| 14 | AGENTS、workflow-index、skill 采用按任务选读；非课次任务不虚构 lesson_key。 |
| 15 | agent_loop 支持 project/tool/course/assessment 执行记录；preflight 明示 production_authorized=false，本次使用真实 project run。 |
| 16 | 显式 LessonContext 为新课次操作入口，active_context 只保留 legacy consumers 的兼容用途。 |
| 17 | 全局学生前提改查 offering/class_scope；不把二年级已学内容套用一年级。 |
| 18 | draft 条文补齐具体逐页内容批准，不允许只凭来源和分流开始生产。 |
| 19 | source references 传递 finalized PPTX intake 例外；不把 intake 当新内容或发布批准。 |
| 20 | 活动卡 DOCX 为权威／交付，10-design 可有内部 preview PDF，不能进入 release。 |
| 21 | 仅教材练习编号的规则限定适用版式；实体活动保留可执行指令。 |
| 22 | coverage checker 检查多段 ID、重复项、metadata 与日期追加章节；修复 owner，补齐四章映射，新增行为回归。 |
| 23 | W05 course 审阅目录记录为既有包例外，不搬移改 hash；缺批准、音频 manifest 与标准字段仍是输入 blocker。 |
| 24 | 项目记忆取消易过时的当前页数／版本断言，改查工作区索引；工具入口与答卷路由对齐本地管理记录。 |
| 25 | canonical contract 加入替换旧有效条文、检查消费者／登记表／测试的维护程序；取消自动写全局记忆，legacy README 修正路径与用途。 |

## 验证

- 全部 `python3 -m unittest discover -s tests`：159 项通过。日志：`.agent/runs/rules-remediation-20261015/regression.log`。日志末尾的 synthetic scripts/new.py blocked 是负向测试输出，测试总体为 OK。
- requirements coverage：clear，9 个一级章节及日期追加章节映射通过；JavaScript 两个修改模块 syntax 检查通过。
- 新行为测试包括真实隔离 PPTX、含违规音频包、历史路线拒绝、非课次 run 状态流转、受保护输出、内容 hash 变化、跨课路径及 symlink 拒绝。没有生成真实课次教材。
- 当前 W04 本地只读检查 ready：50 题、15 段及批准 hash 匹配；不代表亲听、课堂播放、学生用时或发布验收。W05 blocked：缺 content-approval.json；另缺 audio-manifest.json 与标准字段。证据：`.agent/runs/rules-remediation-20261015/assessment-checks.json`。
- 全套回归另发现旧身份测试把教材数量写死为两本，已改为验证原两本独立身份仍存在，同时允许新教材；实际 registry validator 继续验证全部身份。

## 保留边界

原工作区已有大量修改，未回退或认领其教材、图片、题库、成绩系统等变化。本次不改教材成品、真实批准或发布记录，不进行远程 Form／Sheet 更新、同步部署，也不编辑全局记忆或第三方 skill cache。历史证据保留；过期有效指令删除或限定范围。

正式 HTML 发布工具尚缺；W05 输入仍待实际内容批准及标准清单。这两项不能通过放宽 gate 或补造证据解决。原审查的 808 文件盘点不等于每份文件逐字语义认证，历史链接候选也没有批量删除。本轮修正针对已证实的 25 项；自动化检查能拦截已编码的回归，学生理解与实际课堂验收仍需对应证据。
