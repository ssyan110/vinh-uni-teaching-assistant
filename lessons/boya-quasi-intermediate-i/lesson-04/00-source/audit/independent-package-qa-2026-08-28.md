# 第4课来源包独立只读 QA

检查日期：2026-08-28。检查范围为 `00-source` 四份 JSON、manifest 互相引用、音频本地文件与现有审计路径；本检查不修改内容、不批准来源。

## 结果

- JSON：`canonical-source.json`、`listening-exercise-contract.json`、`audio-manifest.json`、`source-manifest.json` 全部可解析。
- canonical：manifest 声明 SHA-256 `b93e371afd4f4f97e7950ed392ca14d4787a777d95ebb0882d8afec576101293`，与文件实际一致。
- contract：manifest 声明 `1fb182ced5e803493fd0e92749caa6b3410a97da28dbb84339abe59a99a3f56f`，实际文件为 `1e0785109478abb8b2bb1ab60f3e7888981b8b8e18b0528ed60f63b1de1ae50f`，**不一致**。
- audio manifest：声明 SHA `6ac862deb05b2ba93ce7bf3c5b1e6dd15ea870931244e36ab91083a7aa4d20bc`，与文件实际一致；6-1 至 6-6 均存在，逐项 bytes、SHA-256 一致。
- 审计路径：页面、答案与音频审计文件均存在。
- 状态：`source_status=pending_review`、`approved=false`；canonical review 仍未批准，未发现误晋级。

## Blocker

需重新计算并登记 `listening-exercise-contract.json` 的 SHA-256；在修正前不要把第4课来源包视为哈希一致的可交接包。语义听核与教师 PowerPoint 播放仍是 pending（沿用原 manifest）。

## 主线复核补记（2026-08-28）

主线已重新计算并登记 contract SHA：实际值 `25840ba3f6eebca2530a1e9a91b0c4196a6dfd24b63075963c7d8847c4470d64`，已写回 `source-manifest.json`。同时确认当前 canonical SHA 为 `a83b72aa736ea30c0ce1af23b35fb83de386b47e148e0171274c526f9ef13ac3`；旧段落保留作为修正前证据。当前四份 JSON 可解析，三份交叉 SHA（canonical、contract、audio）已一致；来源仍为 `pending_review`，语义听核与教师播放仍未完成。
