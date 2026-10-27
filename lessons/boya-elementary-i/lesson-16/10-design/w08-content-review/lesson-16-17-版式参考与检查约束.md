# W08 既定格式与视觉参考

本次输出：第16—17课实体HTML／OpenSlide，内容批准后制作。线上PPT保持独立。

| 部分 | 实际参考与应用 |
|---|---|
| 封面 | 第9—10课 v3-slide-01 的真实DOM、内联样式和完整CSS级联；保留左文字右插画、装饰线、说明、主题标签和独立页脚。标题按新规则使用具体主题名词，不复制旧活动口号。 |
| 路线 | 第11—12课 v07-route 的 route-card、route-icon、route-range 实际结构和最终覆盖样式；每卡图标、名称、编号齐全。按本周真实分组排卡，不跨列放大孤卡。 |
| 听记与复述 | 采用第13—14课对应听记与完整口头汇报页；先材料和结果，再提供可连成完整表达的句框。 |
| 讨论 | 第11—12课 discussion；默认问题与支持同页。基础／挑战依本次内容，不照搬W06的HSK档位。 |
| 六格故事 | 最近核对的 comic-page；单人讲完整六格，一张图同屏，标题看图说故事，必要指令和可用词句。不得放完整故事或分级框。 |

## 生产与检查约束

白底、海军蓝、青绿、少量暖黄，无紫色；中文KaiTi、拉丁Times New Roman。1920×1080基线，左右96px，正文与页脚顶边至少64px；正文保持45—50px及既有字号角色。放不下先改构图、材料组织或拆为必要的第二页，不压小文字。

封面主题插画使用minimal educational textbook style：简洁线条、极简平面、大面积白底，不用动漫、3D、复杂光影，也不裁漫画代替。内容批准前不生成封面或漫画。图片内数字、路线和份量另核对；必须本地打包。

第一页封面、第二页路线、第三页活动；活动连续编号，同活动最多两页。编号、名称、路线、朗读稿、数据、首页、动画映射及页数一致。

入页动画自动一次，一次按键一页，无自动翻页；reduced-motion完整显示。采用course/open-slide-workspace.json的统一首页。

实际制作后：绑定批准文案与来源hash的逐页契约 → production_gate课堂HTML检查 → 全页静态与渲染检查 → contact sheet及密集页全尺寸观察 → 封面/路线与对应参考并排 → 安全区与断行检查及负向样例 → 同步构建 → 统一首页逐页翻页、缩略图、首末页与reduced-motion。不能用旧截图、静态PASS或自生成期待值冒充新版本验收。

教师原创朗读页写听老师读，不造Audio编号。真实出版社音轨才用右上角不可点击纯文字Audio n-n。

## 本次读取的参考文件

- `lessons/boya-elementary-i/lesson-15/10-design/open-slide-draft/w07-l15/lesson-15-实体课.html`
  SHA-256：`33bde6daaadc2c4b42686f683b6e2de0a93bba1ffcdd94e74db5dc1f28adbd15`
- `lessons/boya-elementary-i/lesson-13/10-design/open-slide-draft/w06-l13-l14/lesson-13-14-实体课.html`
  SHA-256：`9ee3b24a73662ead2f0f3054b74dd6466ec74b85b280a131a212c56bbda6ddac`
- `lessons/boya-elementary-i/lesson-11/10-design/open-slide-draft/lesson-11-12-v09-readable/lesson-11-12-实体课.html`
  SHA-256：`3ff376220782b1c31e706a44d8c9c539230625c0a930e852d2f3d43fee812ffb`
- `lessons/boya-elementary-i/lesson-09-10/10-design/openslide-image-first-20261006/lesson-09-10.html`
  SHA-256：`b15e98e2c020c4455f106c7982365e003bf8f2e0cc14e5815f45d35931caac63`
