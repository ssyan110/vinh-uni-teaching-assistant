# 第9课来源包独立审核（2026-08-28）

## 审核范围与方法

- 课次：第9课《北方菜和南方菜》
- 检查对象：`00-source/` 四份 JSON、页面／答案／音频审计、全书 source inventory、6 个原始 MP3。
- 方法：只读解析 JSON；重新计算 manifest 交叉 SHA-256；检查题组顺序、原文标题、教材印刷页码、音频绑定、答案证据路径；重新检查音频 bytes、SHA-256、`ffprobe` 解码时长。
- 本报告不批准来源、不生成 PPTX、不修改 canonical、contract 或任何现有 manifest。

## 总结

课次四份 JSON 均可解析，manifest 的 canonical／contract／audio hash 交叉一致，6/6 MP3 文件完整且可解码；所有状态仍为草稿／`pending_review`，未发现误标批准。

发现一个会阻挡后续生成与题组验收的结构缺陷：**canonical 明确使用音频 9-1、9-2、9-3，但 listening-exercise-contract 与 audio-manifest 的 `exercise_bindings` 只登记了 9-4、9-5、9-6 的六个短文小题组。** 这使前三个音频没有 exercise-level contract 回溯，必须在来源审核后续修订中补齐或明确记录排除理由。

另有待 Adam 决定的答案 PDF 页码口径和 9-6 视觉转录不确定性；语义听核／课堂播放仍未完成。

## 1. 四份 JSON 与 manifest 交叉核对

| 文件 | JSON | 实际 SHA-256 | source manifest 记录 | 结果 |
|---|---|---|---|---|
| `canonical-source.json` | 通过 | `2284f4741b1f2393e9d036c9887b257e8dda87f36e38370473002d462484877d` | 相同 | 通过 |
| `listening-exercise-contract.json` | 通过 | `07260ec1dd3d0c2b955f04ed1465e8c2af1a16006174a717ad606ae37a536a2b` | 相同 | 通过 |
| `audio-manifest.json` | 通过 | `1a1b53058fa9628c9df3e4979cae195941c138c2cfe8922eae521a7eae01b0c1` | 相同 | 通过 |
| `source-manifest.json` | 通过 | `65b...`（自身未登记） | 不适用 | 通过 |

contract 内嵌的 canonical 路径与 SHA 也匹配；source manifest 引用的页面、答案和音频审计文件均存在，实际 SHA 与登记值一致。

## 2. 页面与答案证据

- 主教材 PDF 第90–99页对应印刷 P77–P86；与课次页面审计和 `source-inventory.json` 一致。
- canonical 的 `page_map.printed_pages=[77,86]`、`pdf_pages=[90,99]`，PDF 偏移 +13 正确。
- QR 截图 `textbooks/boya-quasi-intermediate-i/source/qr/captures/lesson-09-pdf-page-090.png` 存在，URL 为 `http://qr31.cn/IloNOS`，全书 inventory 列出 9-1 至 9-6。
- inventory／结构审计登记答案 PDF `[24,25]`；本课视觉渲染使用内部页 `[25,26]`，页脚印刷标签为 `[22,23]`。canonical 已保留两套定位并标记 `pending_adam_confirmation_of_answer_pdf_page_numbering`，没有静默覆盖 inventory。
- 答案审计文件名 `answer-pages-24-25-audit-draft.md` 与 inventory 定位一致，但文件正文同时使用视觉内部页 25–26；页码口径统一前不可作为最终批准证据。

## 3. 题组与音频映射

### canonical 中实际出现的音频来源

canonical 的 sections 明确包含：

| section | 题／内容 | 音频 | 教材页 |
|---|---|---|---:|
| `vocabulary` | 词语 27 项 | 9-1 | P77–P78 |
| `vocabulary_comprehension` | 图片选择 7 项 | 9-2 | P78–P79 |
| `listening_sentences` | 判断正误 10 项 | 9-3 | P79 |
| `short_text_1` | 第一至三项 | 9-4 | P80–P81 |
| `short_text_2` | 第一至四项 | 9-5 | P82 |
| `short_text_3` | 第一至四项 | 9-6 | P83–P84 |

### contract 中目前登记的六项

| contract exercise | 标题 | 页码 | 音频 | 题数 |
|---|---|---:|---|---:|
| `text.short_text_1.exercise.first_listen` | （一）听第一遍，简单回答问题 | P80 | 9-4 | 3 |
| `text.short_text_1.exercise.second_listen` | （二）听第二遍，用括号中的词语说出三个句子，不少于20字 | P80 | 9-4 | 3 |
| `text.short_text_2.exercise.first_listen` | （一）听第一遍，简单回答问题 | P82 | 9-5 | 3 |
| `text.short_text_2.exercise.second_listen` | （二）听第二遍，用括号中的词语说出三个句子，不少于20字 | P82 | 9-5 | 3 |
| `text.short_text_3.exercise.first_listen` | （一）听第一遍，简单回答问题 | P83 | 9-6 | 3 |
| `text.short_text_3.exercise.second_listen` | （二）听第二遍，用括号中的词语说出三个句子，不少于20字 | P84 | 9-6 | 3 |

### 关键缺口（P1）

contract 的六项只覆盖短文 first／second listen；`audio-manifest.exercise_bindings` 也只有这六项。因此 canonical 的 `vocabulary`、`vocabulary_comprehension`、`listening_sentences` 三个音频来源（9-1、9-2、9-3）均没有 exercise-level contract／binding。audio manifest 虽有 9-1 至 9-6 六段文件，但文件存在不等于教材题组 metadata 完整。

这会导致：

- 9-1、9-2、9-3 无法由题组契约回溯到教材标题、页码和题数；
- 未来 PPT storyboard／页码 marker／coverage QA 可能遗漏前三个听力板块；
- `listening_exercise_contract` 的“六题组”含义不清：是六段音频，还是仅六个短文练习小组。

来源批准前应补登记 9-1（词语）、9-2（词语理解）和 9-3（听句子，判断对错）的独立 `exercise_id`，或由 Adam 明确批准“contract 只覆盖短文练习”并另建三项非 contract coverage record。补登记会改变 contract／audio manifest／source manifest hash，需一并重算，不能只改一份文件。

此外，六个 contract 记录的 `order` 在每篇短文内均重复 1、2；若 order 代表全课展示顺序，应改为全局唯一或明确 `section_order` 与 `exercise_order` 的作用域。若定义为每篇短文内顺序，则需写入 schema 说明，避免排序歧义。

## 4. 六段音频技术核对

重新读取本地文件并用 `ffprobe` 解码；6/6 bytes、6/6 SHA-256、6/6 时长均与 audio manifest 一致。

| 音频 | bytes | SHA-256 | `ffprobe` 时长（秒） | 解码 | 语义／PPT播放 |
|---|---:|---|---:|---|---|
| 9-1 | 819190 | `8322ba07d5f22db4c2a9f9b0f4cda6bda9e29db8b06871c77268e704b9a77320` | 50.886531（manifest 50.887） | 通过 | pending |
| 9-2 | 434250 | `39d304b722d8b382e41ff40467aa157c854f2a3b02d7cd781703f6259a02d292` | 26.827755（manifest 26.828） | 通过 | pending |
| 9-3 | 1074145 | `68a1dc11366ed1c6d4949de1f76edf01e8f361408c0350eebdf6a9448b698fc2` | 66.821224（manifest 66.821） | 通过 | pending |
| 9-4 | 1106746 | `9e5fbe68debdfe0fbaec36fd4264b14b6ed2bd9b930805a19d339d66961c234c` | 68.858776（manifest 68.859） | 通过 | pending |
| 9-5 | 1013959 | `4cda86d58af50ca4ecd5dca46ec712537ae0c0d6545c41d3bc14355a97f46213` | 63.059592（manifest 63.060） | 通过 | pending |
| 9-6 | 874779 | `e30f25b5a404d9f19e0c482181ed56a0fe62e49a144ea6bd86cf222f7c989ee7` | 54.360816（manifest 54.361） | 通过 | pending |

技术通过只证明文件完整、可解码；不证明语义与题号对应，也不证明 PowerPoint 内嵌播放已通过。

## 5. 需要 Adam 确认的来源事项

1. 答案 PDF 页码口径：inventory `[24,25]`、视觉内部页 `[25,26]`、页脚印刷 `[22,23]` 的最终记录方式。
2. 9-6 听力文本中扫描注音 `逛（guì）` 及「后海」前的动词。当前按扫描视觉保留，须以音频语义听核与页面再确认，不得擅自改为推测字词。
3. 三个未绑定音频（9-1、9-2、9-3）是否纳入 listening-exercise-contract；按全课题组追踪规则，建议纳入。
4. 开放式说一说、比较、综合表格和拓展练习继续采用“无唯一答案＋教师示例／评量”政策。

## 6. 缺陷分级

### P1（阻挡来源包进入后续生成）

- 9-1、9-2、9-3 缺少 exercise-level contract／binding，造成来源题组 coverage 不完整。
- 答案页编号和 9-6 文本关键字仍待 Adam 确认，不能宣称来源最终准确。
- 6 段音频语义听核、题号核对和 PowerPoint 播放实测尚未完成。

### P2（应在来源修订时修正）

- contract 的 `order` 在每篇短文内重复 1、2，需明确作用域或改为全局顺序。
- 答案审计文件正文同时使用 inventory 页码和视觉内部页；最终统一后应更新审计说明与受影响 hash。
- 当前 `scripts/` 未提供本课正式听力契约 validator；恢复后须补跑正式校验，不能把手工结构检查当成完整 validator 结果。

### P3（不阻塞，但需标注）

- canonical 的英文 gloss（例如 `早餐` 的 gloss）属于审计辅助，不是教材权威文本；进入学生材料前须另行校对，不能直接当作已批准翻译。
- contract 没有显式 `approved` 布尔字段，虽然 `status=draft`、空 `approved_by` 和空 `approved_at` 已表明未批准；若 schema 要求显式字段，应在 schema 决定后统一补齐并重算 hash。

## 7. Gate 状态与安全修正边界

- Gate A 来源审核：**pending，存在 P1 blocker**。
- 来源批准：**未批准**；`source-manifest.status=pending_review`、`approved=false`。
- 教师手册、配套材料、Storyboard、PPTX、release：**不得开始**。
- 可安全计划但本次不直接执行的修正：补齐 9-1 至 9-3 的 contract／binding、统一答案页定位、解决 9-6 文本不确定性；每项都需同步受影响 hash。
- 下一最小可验证步骤：先由 Adam 确认答案页口径、9-6 文本和 contract 范围，再修订 contract／audio bindings，重算 manifest hash，重新跑来源与音频 QA。

