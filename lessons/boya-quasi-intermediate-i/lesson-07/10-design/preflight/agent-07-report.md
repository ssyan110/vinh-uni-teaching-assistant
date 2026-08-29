# Lesson 07 Preflight Report

内部预检，仅供 `10-design` 使用。未批准，不作为 authority。

## 1) Source sections 与教材页码

| section | title | printed pages | note |
|---|---|---:|---|
| vocabulary | 词语 | P59–P60 | 26 个词语，音频 7-1 |
| vocabulary_comprehension | 听词语辨认 | P60 | 1 组，音频 7-2 |
| listening_sentences | 听句子判断对错 | P61 | 10 句，音频 7-3 |
| short_text_1 | 小张是登山迷 | P61–P62 | 音频 7-4 |
| short_text_2 | 小张真正爱上了登山 | P63–P64 | 音频 7-5 |
| short_text_3 | 登山可以增进友谊 | P64–P65 | 音频 7-6 |
| common_expressions | 常用表达 | P62、P65 | 1 组 12 条 |
| comprehensive_practice | 综合练习 | P66–P67 | 3 项 |

## 2) 生词 / 短文 / 句式 / 练习数量

- 生词：26
- 短文：3
- 句式/常用表达：12
- 听句判断：10 句
- 练习口径：
  - `listening_exercise_contract`：9 个 exercise 单元
  - 综合练习：3 项

## 3) 短文后对应句式的可执行教学映射

以下映射均为 inference。canonical source 没有逐篇标注“短文 → 句式”关系，只能根据短文内容与 `common_expressions`、`listening_sentences` 推导。

| 短文 | 可执行教学映射 | 课堂可做的事 |
|---|---|---|
| 短文 1《小张是登山迷》 | `样样都会`、`令人羡慕`、`一说起……就……`、`地地道道的……`、`兴奋得……` | 说一个人为什么让人羡慕，描述“提到爱好时马上会怎样” |
| 短文 2《小张真正爱上了登山》 | `虽然……可是……`、`慢慢地……`、`有时候……`、`将来如果……一定要……` | 说明爱好如何变成习惯，并说出原因、转折和未来想法 |
| 短文 3《登山可以增进友谊》 | `因为……`、`不仅如此……`、`刚开始……慢慢地……`、`动词+起来`、`越来越……` | 说爱好带来的社交结果、鼓励方式和变化过程 |

## 4) 线上 / 实体 draft outline

共用 divider 直接复用第一课已批准的共享 divider，不新生成 divider 图。

### 线上 draft

1. 封面
2. 学习流程图
3. `词语理解` divider
4. 词语页：26 个词语
5. `听词语` divider
6. 听词语辨认
7. `听句子` divider
8. 听句子判断对错
9. `短文 1` divider
10. 短文 1：听第一遍 / 听第二遍 / 记录
11. `短文 2` divider
12. 短文 2：听第一遍 / 听第二遍 / 记录
13. `短文 3` divider
14. 短文 3：听第一遍 / 听第二遍 / 记录
15. `常用表达` divider
16. 常用表达 12 条
17. `综合练习` divider
18. 三项综合练习
19. 课末回顾

### 实体 draft

1. 封面
2. 学习流程图
3. `词语理解` divider
4. 词语页 + 快速口头检查
5. `听词语` divider
6. 听词语辨认 + 跟读
7. `听句子` divider
8. 听句子判断对错 + 纠错
9. `短文 1` divider
10. 短文 1 口头复述与同伴追问
11. `短文 2` divider
12. 短文 2 口头复述与观点交换
13. `短文 3` divider
14. 短文 3 口头复述与小组总结
15. `常用表达` divider
16. 口语套用与替换练习
17. `综合练习` divider
18. 说自己的运动爱好与理由
19. 课末回顾

### Section transition dividers

- 封面 → 学习流程图
- 学习流程图 → 词语理解
- 词语理解 → 听词语
- 听词语 → 听句子
- 听句子 → 短文 1
- 短文 1 → 短文 2
- 短文 2 → 短文 3
- 短文 3 → 常用表达
- 常用表达 → 综合练习
- 综合练习 → 课末回顾

## 5) 可用图片资产与缺口

### 当前资产

- 10-design/assets 下共有 33 个 PNG draft 资产
- 26 个词语图
- 4 个练习图：乒乓球、滑冰、游泳、登山鞋
- 3 个情境图：邻居、城市/山、俱乐部
- divider 未生成新图，走共享 divider 复用

### 缺口

- `image-manifest.json` 里 33 个资产的 `id / usage / source / licensed / notes` 基本为空
- 所有资产 `can_enter_ppt=false`
- 当前 `ppt_candidates=0`
- 这些图只能算 `10-design` 候选，不能进 approved PPT
- 需要补齐素材来源、用途、授权状态和使用页/使用场景

## 6) source/audio blocker

### Source blocker

- `source_manifest.source_qa_status = blocked`
- `review_status = awaiting_adam_review`
- `approved = false`
- 扫描教材没有可用文字层，仍依赖视觉转录核对
- 需要 Adam 对视觉转录、教材页码和答案证据做最终确认

### Audio blocker

- 6 段本地音频都在
- 6 段都 decode passed
- `semantic_listening_count = 0`
- `teacher_playback_count = 0`
- 当前状态是 `technical_pass_semantic_review_pending`
- 结论：不是缺文件，而是语义听核和教师实播未完成

## 结论

lesson-07 可以继续做 `10-design` 层的 draft 规划，但不能上升为 authority，也不能把当前图片资产或音频状态当成已批准来源。
