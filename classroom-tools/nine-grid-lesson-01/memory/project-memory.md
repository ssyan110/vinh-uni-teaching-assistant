# 项目记忆

更新日期：2026-08-27

- 工具名称：第一课《听说》9 × 9 词语连线。
- 所有回合固定 9 × 9、五格连线；设置页不再显示自动棋盘选项或功能格开关。
- “选择本轮内容”是单一下拉菜单，目前包含第一课：听说（一）和第一课：听说（二）。
- 听说（一）：`S01-002` 的 21 个词语；听说（二）：`S01-009` 的 13 个词语。
- 功能格只有 `pattern-make`（造句）、`dialogue-pattern`（对话）、`sentence-rewrite`（改写）三种；每题固定 30 秒。
- 每一回合的词语只出现一次；不足 81 格时先用课本练习补入功能格，课本题目池用完后才轮换题目，不重复词语。
- 内容包：`public/content/class-content.json`；来源对应表：`docs/lesson-01-source-map.md`。
- 功能题没有自动标准答案，完成后由教师确认占格。
- QA：`qa/validate-content.mjs`、`qa/validate-source-fidelity.mjs`、Vitest、Vite build、离线单文件检查。
