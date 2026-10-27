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

制作前与交付前按[实体课标准的唯一现行QA清单](classroom-html-standard-2026-10-07.md)执行，并使用其2026-10-20补充：L9–10只作封面与整体视觉参考；L11–12作路线图标卡参考；正文按最近核对过的同类活动页复用。首页逐页缩略图必须静止，播放页只加载本页图片，等目标页就绪后播放一次入页动画；检查连续翻页和直接选页时不闪回封面或重复动画。

## 后续简报加入方式

- 原生 React 简报在此工作区 `slides/<textbook-id>-<lesson-id>/index.tsx` 登记；来源、设计与批准记录仍保留在各课目录。
- 已有 HTML 简报在 `course/open-slide-workspace.json` 的 `html_decks` 登记唯一ID、offering、完整lesson_keys、owner、title、source、创建时间和 `visual_check`。当前profile登记路线参考及哈希、实际卡数／列数、页面类型清单、`content_contract`、`draft_manifest` 和 `rendered_layout_report`。逐页契约记录本课ID／角色／完整文字及题目／支持页关系，绑定已审阅文案和分别指定的封面／路线参考；它是技术映射，不创设内容批准。
- 从项目根目录执行 `python3 scripts/verify_classroom_slides.py --deck-id <登记ID> --sync --build`。它串联既有批准preflight、通用逐页契约检查、schema-v2全页渲染、具名故障用例和现有同步／构建。旧W06专属断言只供历史回归测试，公共检查入口不再按该课固定题目运行。
- 同步核对source／owner／lesson_keys与登记及draft manifest的一致性，运行现有内容批准preflight，再以只读浏览器复验当前契约、HTML、素材、字体、测量及截图记录；缺失、过期、漏页、缺测量或存在问题时停止。`python3 scripts/sync_open_slide_workspace.py --check-only`不写工作区或QA文件。截图文件哈希必须正确；浏览器跨次栅格化的像素差异只记诊断，不能用此放宽文字、字体、几何或素材核对。
- 每次 `npm run dev`、`npm run build` 或 `npm run sync:decks` 会先检查所有登记课件的当前布局 profile，再同步 HTML。服务运行期间修改源文件后，执行 `npm run sync:decks`，再刷新页面。同步与构建通过不等于已完成整套视觉 QA、教师实播、rehearsal 或发布验收。

HTML入口按原简报实际页数登记，不固定为历史版本的46页。首页打开后，可用OpenSlide的缩略图、方向键及播放控制逐页浏览；不再把整份HTML包成1页。同步生成的页面保留原HTML文字、版式和入页动画，并隐藏内部重复翻页控件。HTML内容仍在登记的源文件编辑，不能通过外层Inspector编辑。

同步只生成工作区内的预览并内嵌本地图片，不改变源文件、批准状态或交付记录。取消登记不会删除旧入口；需要清理时另行指定准确路径。
