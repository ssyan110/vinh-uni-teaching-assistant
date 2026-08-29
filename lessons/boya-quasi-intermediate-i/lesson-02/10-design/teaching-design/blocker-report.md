# 第二课教学设计草案：生产 Gate 阻塞记录

生成日期：2026-08-29  
课次身份：`boya-quasi-intermediate-i:lesson-02`  
教材：`boya-quasi-intermediate-i`（《准中级加速篇 I》）

## 生产 gate 检查

已运行：

```text
/Users/ssyan110/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 scripts/production_gate.py --purpose draft --output-dir lessons/boya-quasi-intermediate-i/lesson-02/10-design/teaching-design
```

结果：`blocked`。工具返回的全局 active context 仍指向 lesson-01，且本课尚未配置 teaching-design manifest；本次仅记录草案，不把阻塞当作通过，也不绕过 gate。

## 本课阻塞项

- 来源 gate 与来源 QA 尚未批准；canonical source 的 `review.status` 仍为 `source_audit_in_progress`。
- 2-1 至 2-6 需要教师逐段语义听核；2-7虽已由用户恢复并经 Adam 播放确认，仍须保留用户来源说明并完成全课 QA。
- PBI 教学设计与正式实体课时尚未由 Adam 确认；线上／实体结构已按 2026-08-29 决定沿用第一课，具体内容仍须在边界记录中锁定。
- 教师手册尚未批准；现有线上／实体 PPTX 仅为 `10-design/pptx-draft`，不能据本草案升格为 authority 或交付。
- 图片清单的候选素材尚未完成来源／视觉批准；不能进入交付 PPTX。
- 本课没有已批准 PPTX；不得从第一课或《中级冲刺篇 I》复制内容。第一课只能提供已批准的版式和共用素材。

## 可继续进行但不代表批准的工作

已建立 `content-contract.json`、`lesson-02-teaching-design.md` 与 `exercise-coverage.csv`，用于把 canonical source 的内容、音频、练习与图片稳定编号并提出线上／实体方案。所有开放题仍保留无唯一答案政策，正式时数留空。

## 最小解锁顺序

1. Adam确认来源页码、题组、词语、课文与2-1至2-7音频。
2. Adam确认本课正式实体课时与来源批准，并在已确认的线上／实体结构下锁定内容边界。
3. 批准 PBI 后批准教师手册内容母版，再同步修订预习卡、补充活动材料与现有 PPTX draft。
4. 完成 storyboard、视觉审核、PPTX authority gate 与 rehearsal 后，才可建立 release。
