# 第一课生产目录

目录顺序：

1. `00-source/`：教材来源与来源 manifest。
2. `10-design/`：教学设计、Storyboard、Visual storyboard 与 prototype。
3. `20-approved/`：唯一权威版本。
4. `30-qa/`：只读 QA 证据；`current/` 是当前结果，`archive/` 保存旧版本。
5. `40-release/`：从 `20-approved/` 复制出的不可变交付包。
6. `90-archive/`：未来明确归档的旧内容。

历史输出已移至 `archive/legacy-materials-2026-08-27/`，不是未来的权威来源。

所有生成器开始前都必须通过：

```bash
python3 scripts/production_gate.py --purpose audit
```

当前第一课 v11-final 已完成文件完整性与静态 QA；Microsoft PowerPoint 音频／投影
检查及 6 节／300 分钟教师 rehearsal 仍待人工接受。上一個不可變 release 只作历史
证据，新的 v11 release 尚未建立。
