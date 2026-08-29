# 第11课来源包独立 QA

执行日期：2026-08-28。只读检查，不修改来源内容，不批准来源。

|检查项|结果|证据|
|---|---|---|
|四份 JSON 可解析、相互引用路径存在|通过|canonical、contract、audio manifest、source manifest|
|source-manifest canonical hash|通过|`c7c4c4bbcb3b…`|
|source-manifest contract hash|通过|`5c0d93c4b074…`|
|source-manifest audio-manifest hash|通过|`fef4f9657e69…`|
|page/answer audit 路径与 hash|通过|`66026bd585d3…`|
|音频 bytes/SHA-256|通过 6/6|11-1 至 11-6；与 audio-manifest 一致|
|听力题组 contract 与 canonical coverage|通过 6/6|3 短文各（一）（二），题数稳定 hash 全部匹配|
|状态门|保留 pending|canonical `approved=false`；source-manifest `pending_review`；contract `draft`|

未决：六段音频语义听辨与教师播放；扫描 PDF 无文字层，需 Adam 终审页码、转录与答案。来源包尚未进入教师手册、PPT 或 release gate。
