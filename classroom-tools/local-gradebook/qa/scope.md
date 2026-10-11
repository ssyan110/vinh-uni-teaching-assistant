# 本机评分 App 验证范围

- 用户授权：教师单人使用的本机评分 App，加入一年级名单；按实际考试新增，支持教材、单课／跨课及课外口语活动。
- 实现范围：`classroom-tools/local-gradebook/`；启动快捷入口：用户提供的 `02_評分/启动教师评分.command`。现有课堂工具、教材 authority、release 和云端数据库未修改。
- 名单：只读核对当前 active enrollments，99 位当前学生，另保留 LT_02 原表 5 位历史学生。
- 已有评分：152 条，保留原表全部状态、分项、总分单元格及备注证据。原文件哈希逐一复核。4 条异常需要教师核对。
- 不预建固定次数：只保留已有记录的 6 次考试；新增考试不限 12 次，按次保存教材身份、课次组合或课外活动、日期与评分标准。
- 软件与浏览器检查在隔离数据库运行；真实数据库 readback 与 seed 评分记录逐项相等，无测试评分、测试考试或虚构一年级评分标准。
- Excel 经 openpyxl 结构回读及 LibreOfficeDev 实际打开／PDF 转换；内部预览 5 页，未改原始评分表。PDF 是内部验证证据，不是交付需求。
- 当前 Mac 已运行最终本机服务；双击入口可复用已运行服务，或启动新服务并打开浏览器。
- 保留正常教师验收边界：尚未由 Adam 在真实考试中使用；4 条旧记录不能因技术检查通过而视为核对完成。

## 运行工具适用范围

已尝试现有 `agent_loop.py` audit packet。该脚本将 audit 错路由为 lesson PPTX draft，要求 L1 逐页内容批准，留下 needs_human 的 blocker。此 App 是独立课程工具，没有生成教材图片、PPTX 或修改 lesson authority；canonical workflow contract 明确课堂工具不适用 PPTX 规则。因此没有修改、绕过或伪造 lesson gate，也没有把该 run packet 标成 complete。App 的实际完成证据在本目录 verification.json、浏览器截图及隔离测试副本中。
