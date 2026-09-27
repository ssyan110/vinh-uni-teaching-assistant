# 教材 review 整合验证

日期：2026-09-08

入口：`http://127.0.0.1:47839/`

## 完成状态确认

- `course/lesson-registry.json`、当前教材 `textbook.json` 与 source inventory 已登记 `completed_by_adam_2026-09-08`；12 个 lesson key 均有同一日期的 completion record。
- 当前 dashboard manifest 显示准中级加速篇 12/12 课 `已完成（Adam 确认）`、每课进度 100%，并保留原始技术 source／QA／release 字段供追溯。
- `course/textbook-completion-confirmation-2026-09-08.md` 绑定了 12 个 source manifest、12 个 canonical source 与 operational delivery folder 中 24 个 finalized PPTX 的 SHA-256；本次没有改写 PPTX 二进制。
- Lesson 01 的 canonical `sections` 为空仍会显示技术结构说明，但不再显示“未完成”或产生待审核计数；这是 completion override 与 source schema 的有意分层。
- `boya-intermediate-i` 的计划状态没有被本次确认覆盖。

## 已验证

- 真实 saved-root dashboard 可启动；教材 registry 显示中级冲刺 8 课、准中级加速篇 12 课。
- review manifest 由 `scripts/build-review-manifest.mjs` 读取当前 registry、canonical source、source manifest 与 audio manifest 生成。
- 当前快照：20 课；准中级加速篇 12 课全部显示已完成确认；其中 11 课有可审核 canonical sections，Lesson 01 的空 sections 仅保留为技术结构状态。
- Lesson 08 四区真实内容：词语／专名 31、短文 3、语法／表达 17、练习 36。
- 确认、教师修改／留言、研究标记、localStorage 刷新持久化、lesson_key 隔离、来源签名变化后的单项重审已在 worktree 与 saved root smoke 验证。
- 原有 production Gate、文件、QA／修正 tabs 与课程文件链接仍可进入。
- 1440px 与 390px viewport 无水平溢出；Playwright page／console errors 为 0。

截图：`dashboard/qa/current-textbook-complete.png`

## 保留边界

- review 记录不写回 canonical source、authority manifest 或 finalized PPTX。
- 研究目前只有本机标记与教师反馈，没有检索证据、教师采用选择或下游导出。
- 音档显示 canonical／audio manifest 的真实匹配 URL 与技术状态；没有把本地路径伪装成 served player，逐档实际播放仍需另行验证。
- 本次没有 production deploy；也没有倒填历史 source approval、audio playback、browser/device 或 release gate 日期。
