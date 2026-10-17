# OpenSlide 统一首页

本项目的 OpenSlide 简报统一出现在同一工作区首页，当前地址是 http://localhost:5173/。

从项目根目录启动：

```sh
cd lessons/boya-elementary-i/lesson-04-05-06/10-design/open-slide-draft/w02-lessons-04-06
npm run dev
```

工作区保留历史路径名称，有效入口由 `course/open-slide-workspace.json` 与工作区 `slides/` 的实际内容决定。

工作区 `AGENTS.md` 的 Vinh project adapter 是项目与 vendor skills 的接点。已确认风格、内容批准、系统字体、教师配套和首页 QA 按项目规则执行；vendor skills 只提供兼容的 runtime／文件结构方法。不要为了修规则修改会被 `sync:skills` 覆盖的缓存。原生 React 保留 runtime 需要的画布；教师朗读稿另行交付，presenter notes 不代替教师材料。为授权的首页 QA 可启动现有服务，先检查是否已有实例；不例行升级依赖。

实体课 slides 的制作完成条件包括：首页登记、运行同步、确认首页卡片可见并打开课件。只提供独立 HTML 文件不算完成首页接入。

制作前与交付前执行[实体课制作标准](classroom-html-standard-2026-10-07.md)的「后续制作的默认执行与交付自检」；封面、流程、版式与字号以第9–10课当前HTML为持续基准。首页逐页缩略图必须静止，播放页只加载本页图片，等目标页就绪后播放一次入页动画；检查连续翻页和直接选页时不闪回封面或重复动画。

## 后续简报加入方式

- 原生 React 简报在此工作区 `slides/<textbook-id>-<lesson-id>/index.tsx` 登记；来源、设计与批准记录仍保留在各课目录。
- 已有 HTML 简报在 `course/open-slide-workspace.json` 的 `html_decks` 添加唯一 `id`、完整 `lesson_key`、`title`、项目相对 `source` 路径及带时区 `created_at`。只登记实际存在的学生简报，不登记测验管理 Dashboard、备份或教师私密材料。
- 每次 `npm run dev` 或 `npm run build` 自动同步登记的 HTML。服务运行期间修改源文件后，执行 `npm run sync:decks`，再刷新页面。

HTML入口按原简报实际页数登记，不固定为历史版本的46页。首页打开后，可用OpenSlide的缩略图、方向键及播放控制逐页浏览；不再把整份HTML包成1页。同步生成的页面保留原HTML文字、版式和入页动画，并隐藏内部重复翻页控件。HTML内容仍在登记的源文件编辑，不能通过外层Inspector编辑。

同步只生成工作区内的预览并内嵌本地图片，不改变源文件、批准状态或交付记录。取消登记不会删除旧入口；需要清理时另行指定准确路径。
