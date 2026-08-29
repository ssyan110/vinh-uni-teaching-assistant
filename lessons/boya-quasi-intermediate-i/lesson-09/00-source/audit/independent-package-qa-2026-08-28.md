# 第9课来源包独立只读 QA

检查日期：2026-08-28；只读检查，不修改内容、不批准来源。

- 四份 JSON（canonical、listening contract、audio manifest、source manifest）均可解析。
- manifest 交叉 SHA 全部一致：canonical `2284f4741b1f2393e9d036c9887b257e8dda87f36e38370473002d462484877d`；contract `07260ec1dd3d0c2b955f04ed1465e8c2af1a16006174a717ad606ae37a536a2b`；audio `1a1b53058fa9628c9df3e4979cae195941c138c2cfe8922eae521a7eae01b0c1`。
- listening contract 含6题组，状态 `draft`，未批准。
- 9-1 至 9-6 六个本地音频均存在；逐项 bytes 与 SHA-256 和 audio manifest 一致。
- 页面、答案、音频审计路径均存在；`source_status=pending_review`、`approved=false`，未发现误晋级。

Blocker：语义听核、教师播放测试及答案页码口径确认仍 pending；不影响本次包结构完整性。
