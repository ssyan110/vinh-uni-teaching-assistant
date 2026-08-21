# 第一课生产目录

目录顺序：

1. `00-source/`：教材来源与来源 manifest。
2. `10-design/`：教学设计、Storyboard、Visual storyboard 与 prototype。
3. `20-approved/`：唯一权威版本。
4. `30-qa/`：只读 QA 证据；`current/` 是当前结果，`archive/` 保存旧版本。
5. `40-release/`：从 `20-approved/` 复制出的不可变交付包。
6. `90-archive/`：未来明确归档的旧内容。

旧 `output/boya-intermediate/lesson-01/` 暂时保留为 legacy，不是未来的权威来源。

所有生成器开始前都必须通过：

```bash
python3 scripts/production_gate.py --purpose audit
```

当前第一课的文件完整性已经记录为通过，但 `delivery_status` 仍是
`pending_rehearsal`。PowerPoint 音频实测和 6 节／300 分钟教师演练通过后，
才能建立新的 release。
