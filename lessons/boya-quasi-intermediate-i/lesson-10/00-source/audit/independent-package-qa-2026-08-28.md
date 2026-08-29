# 第10课来源包独立只读 QA

检查日期：2026-08-28；只读检查，不修改内容、不批准来源。

- 四份 JSON（canonical、listening contract、audio manifest、source manifest）均可解析。
- manifest 交叉 SHA 全部一致：canonical `8f3cf1f0ab7d4b570aa20318164420151932f61784e8f3f3f06371fae886754e`；contract `3e072acb38dffb2c05bafca823c279417dd99a26349e5d25196e6752dfff6896`；audio `c48f88b65712d1445b0509809b0de16158db05fbfa3394b59ac1e227c85dc771`。
- listening contract 含6题组，状态 `ready_pending_semantic_playback`，`approved=false`。
- 10-1 至 10-6 六个本地音频均存在；逐项 bytes 与 SHA-256 和 audio manifest 一致。
- 页面、答案、音频审计路径均存在；`source_status=pending_review`、`approved=false`，未发现误晋级。

Blocker：语义听核、教师 PowerPoint 播放测试及扫描文字最终人工复核仍 pending；答案 PDF 实际内容页为27–28而库存表写26–27，已在来源包记录待核对。
