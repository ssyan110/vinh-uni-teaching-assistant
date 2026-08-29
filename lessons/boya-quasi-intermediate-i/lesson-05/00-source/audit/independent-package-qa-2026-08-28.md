# 第5课来源包独立只读 QA

检查日期：2026-08-28。检查范围为 `00-source` 四份 JSON、manifest 互相引用、音频本地文件与现有审计路径；本检查不修改内容、不批准来源。

## 结果

- JSON：`canonical-source.json`、`listening-exercise-contract.json`、`audio-manifest.json`、`source-manifest.json` 全部可解析。
- canonical：声明 SHA-256 `d7f8283e371bef2e4d40e1ae7f6458ae8a43e92f7e489d467bc902317625a509`，与实际一致。
- listening contract：声明及实际 SHA-256 均为 `fa475b237cbc0a0c9c6a5cdf05f9e5b667d749c8d86b5625eb27777499326c91`。
- audio manifest：声明及实际 SHA-256 均为 `8881142e2803efd2d289ee11c9b2dcf5f0c06298982ce685a53fca399c513189`；6-1 至 6-6 均存在，逐项 bytes、SHA-256 一致。
- 审计路径：页面与音频审计文件存在；答案审计路径复用页面审计文件，manifest 已明确记录。
- 状态：`source_status=pending_review`、`approved=false`、contract 为 draft；未发现误晋级。

## Blocker

未发现引用、哈希、音频文件或批准状态结构性错误。语义听核、教师播放与扫描文字最终人工复核仍 pending，不能视为已批准来源。
