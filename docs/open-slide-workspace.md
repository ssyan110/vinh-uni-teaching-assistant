# OpenSlide 统一首页

本项目的 OpenSlide 简报统一出现在同一工作区首页，当前地址是 http://localhost:5173/。

从项目根目录启动：

```sh
cd lessons/boya-elementary-i/lesson-04-05-06/10-design/open-slide-draft/w02-lessons-04-06
npm run dev
```

工作区保留历史路径名称，工作区路径由 `project.config.json` 的 `open_slide_workspace` 唯一管理；`course/open-slide-workspace.json` 管理课件登记，兼容的workspace字段必须与配置一致。实时内容以工作区 `slides/` 为准。

工作区 `AGENTS.md` 的 Vinh project adapter 是项目与 vendor skills 的接点。已确认风格、内容批准、系统字体、教师配套和首页 QA 按项目规则执行；vendor skills 只提供兼容的 runtime／文件结构方法。不要为了修规则修改会被 `sync:skills` 覆盖的缓存。原生 React 保留 runtime 需要的画布；教师朗读稿另行交付，presenter notes 不代替教师材料。为授权的首页 QA 可启动现有服务，先检查是否已有实例；不例行升级依赖。

实体课 slides 的制作完成条件包括：在共享工作区登记、确认首页卡片可见并打开课件。历史 HTML 课件按其受限兼容流程同步；原生课件不使用 HTML 包装同步。只提供独立文件不算完成首页接入。

制作前与交付前按[实体课标准的QA清单](classroom-html-standard-2026-10-07.md)中适用于原生页面的视觉与教学要求执行；其中 HTML 制作、DOM 复制和 HTML 专用工具只适用于历史课件，并使用其2026-10-20补充：L9–10只作封面与整体视觉参考；路线与活动结构按 `docs/classroom-activity-workflow.md` 的页面映射，使用初级第11–12、13–14课及准中级第4–5课的适用参考；不混用其他课程的教学内容或HSK标签。首页逐页缩略图必须静止，播放页只加载本页图片，等目标页就绪后播放一次入页动画；检查连续翻页和直接选页时不闪回封面或重复动画。

## 未来新课的正文字号

2026-11-04 起，新制作的实体课采用 [实体课制作标准的正文字号规则](classroom-html-standard-2026-10-07.md#2026-11-04未来新制实体课正文字号)：1920×1080 画布正文默认 56 px，范围 54–60 px，最低 54 px。学生完成任务所需的说明、问题、例句和数据都按正文处理。交付前核对实际生效字号与 Present 全屏可读性，空间不足先调整版式，不缩小关键文字。已完成课件保持原状；本规则不触发历史课件改版，也不改变线上预习 PPTX 规则。

## 后续实体课简报加入方式

所有年级、课程的新制或修订实体课都在同一个配置的共享工作区制作原生 OpenSlide React 页面，源码放入 `slides/<artifact-id>/index.tsx`，资源放入同目录的 `assets/`。该目录是 OpenSlide 保存人工修改的真实来源。文字须能由人直接编辑，页面元素须能单独拖动；不得把 HTML、iframe 或整页图片包装成投影片，也不能用独立 HTML 编辑器代替。按课次保留已批准文案、来源和教师材料，保留独立的内容契约与参考页映射。逐页检查文字与元素可选中、修改和移动，保存、刷新或重开后再次确认修改持久，并检查首页卡片、页数、缩略图、播放和全部视觉与教学要求。

制作前运行 `python3 scripts/production_gate.py --purpose classroom-native --stage draft`，绑定每课自己的 scoped content approval 与 `open-slide-draft/<offering>/<artifact-id>` 输出路径；组合多课时，为每个额外课次重复传入 `--covered-approval <lesson_key>=<record-path>`。源码完成后用相同参数加 `--verify-native-output`；检查已登记的实时源码为原生 React 页面、每页有稳定 ID，且 deck 目录没有 HTML／iframe 包装。最后仍须在实时 OpenSlide 中实际编辑文字、拖动对象、保存并重开验证；逐页验证结果写入 QA 记录，静态检查不能替代此项。

现有 HTML 同步、内容检查、渲染证据和 release 脚本针对历史 HTML；它们不证明原生页面的编辑、拖动、保存或发布能力。原生文字编辑、元素移动、保存及重开持久性已在 Jady 隔离副本和 Year 2 Lesson 6 代表性验证；证据见 `.agent/runs/y2-w10-l06-native-conversion-20261031/QA.md`。这不代表每个新课件的每个元素都已验证；每份新课都必须运行原生源码 verifier，并逐页抽查编辑、拖动和重开持久性。原生正式 QA／发布路径仍待适配；当前交付若缺少所需能力须标为阻塞，不得用 HTML 包装绕过，也不得把首页同步或技术通过当作批准或发布。内容批准、教师审阅、播放／试教及正式发布仍分别按适用规则执行。

## 历史 HTML 简报

已有 HTML 简报可保留现有首页登记、播放与独立 **Edit slide** 编辑方式；这些是历史兼容路径，不适用于未来新实体课页面，也不表示已有课件已迁移。`course/open-slide-workspace.json` 的 `html_decks`、`scripts/sync_open_slide_workspace.py` 和 HTML 专用契约／发布流程继续只描述其实际支持的 HTML。历史课件的修改仍受对应批准和 QA 规则约束。


## 实体课 ChatGPT 研究前置门禁（2026-11-04）

所有新设计或实质重设计的实体课活动，必须先实际使用 ChatGPT 研究，再编写活动方案和学生文案；不得以自行构思、旧记忆或旧研究替代本次研究。保存实际提示词、完整回复、会话链接、来源核对及后续改写对照。提交内容审阅前运行 classroom-research 门禁；内容批准与 classroom-native 制作门禁同时要求 --research-record，缺失、空白、范围不符、哈希变化或研究时间晚于改写均阻断。记录和哈希只能证明材料完整性，不能替代真实会话证据；禁止伪造。此要求不追溯改写已完成课件，不增加人工批准阶段。
