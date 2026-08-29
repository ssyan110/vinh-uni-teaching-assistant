# 第8课来源素材只读预检

预检日期：2026-08-28。依据 `textbooks/boya-quasi-intermediate-i/source/source-inventory.json`；不建立或修改 canonical/contract/manifest，不代表来源批准。

- 课名：孙子和《孙子兵法》；主教材文件页 81–89（印刷 P68–P76）；答案 PDF 页 22–23；QR `http://qr31.cn/JjDVWY`。
- QR capture：`textbooks/boya-quasi-intermediate-i/source/qr/captures/lesson-08-pdf-page-081.png`，存在。
- 主教材与答案 PDF：`textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I.pdf`、`...-听力文本及参考答案.pdf`，均存在。

|标签|本地文件|bytes一致|SHA一致|ffprobe秒（盘点）|解码盘点|结果|
|---|---|---|---|---:|---|---|
|8-1|audio/lesson-08/8-1.mp3|976761/976761|是|60.735 (60.735)|passed|通过|
|8-2|audio/lesson-08/8-2.mp3|405828/405828|是|25.051 (25.051)|passed|通过|
|8-3|audio/lesson-08/8-3.mp3|885645/885645|是|55.040 (55.040)|passed|通过|
|8-4|audio/lesson-08/8-4.mp3|1158979/1158979|是|72.124 (72.124)|passed|通过|
|8-5|audio/lesson-08/8-5.mp3|1074981/1074981|是|66.873 (66.873)|passed|通过|
|8-6|audio/lesson-08/8-6.mp3|1049068/1049068|是|65.254 (65.254)|passed|通过|

结论：6/6 MP3 存在，bytes、SHA-256、ffprobe 时长和 inventory 的 decode_status 一致。语义听核、教师播放与来源批准仍待后续 gate。
