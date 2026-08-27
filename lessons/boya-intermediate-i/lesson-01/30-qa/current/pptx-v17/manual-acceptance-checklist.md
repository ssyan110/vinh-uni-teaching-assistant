# 第一课 v11-final 人工接受清单

按顺序完成以下检查，并把实际证据路径写回 `lesson-manifest.json`：

1. 在 Microsoft PowerPoint 打开 `20-approved/pptx/第一课-中国人的姓名.pptx`，确认 95 页可编辑、顺序正确、speaker notes 可见。
2. 播放所有需要音频的页面，确认音频编号与教材活动一致；记录播放证据。
3. 用投影或等比例预览检查后排可读性，特别复核静态 QA 标出的 74 张小字页面与第 88 页边界提示。
4. 按 v11 教案完成 6 节／300 分钟 rehearsal，记录分组转场、材料发放、补救路线和 exit ticket。
5. 教师明确接受后，才把 rehearsal／audio 状态写为 `passed`，再运行 `BOYA_RELEASE_ID=2026-08-27-v11-final python3 scripts/build_release_package.py`。

在第 5 步之前，v11 只能称为已批准内容和待接受审核包，不能称为 classroom-ready；同时先处理 frozen source package tree SHA-256 不一致的既有 blocker。
