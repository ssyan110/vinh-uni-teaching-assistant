# 第10课来源素材只读预检

预检日期：2026-08-28。依据 `textbooks/boya-quasi-intermediate-i/source/source-inventory.json`；不建立或修改 canonical/contract/manifest，不代表来源批准。

- 课名：中国人喜欢聚餐；主教材文件页 100–108（印刷 P87–P95）；答案 PDF 页 26–27；QR `http://qr31.cn/HdituA`。
- QR capture：`textbooks/boya-quasi-intermediate-i/source/qr/captures/lesson-10-pdf-page-100.png`，存在。
- 主教材与答案 PDF：`textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I.pdf`、`...-听力文本及参考答案.pdf`，均存在。

|标签|本地文件|bytes一致|SHA一致|ffprobe秒（盘点）|解码盘点|结果|
|---|---|---|---|---:|---|---|
|10-1|audio/lesson-10/10-1.mp3|822534/822534|是|51.096 (51.096)|passed|通过|
|10-2|audio/lesson-10/10-2.mp3|342717/342717|是|21.107 (21.107)|passed|通过|
|10-3|audio/lesson-10/10-3.mp3|1125554/1125554|是|70.034 (70.034)|passed|通过|
|10-4|audio/lesson-10/10-4.mp3|1045724/1045724|是|65.045 (65.045)|passed|通过|
|10-5|audio/lesson-10/10-5.mp3|842596/842596|是|52.349 (52.349)|passed|通过|
|10-6|audio/lesson-10/10-6.mp3|806651/806651|是|50.103 (50.103)|passed|通过|

结论：6/6 MP3 存在，bytes、SHA-256、ffprobe 时长和 inventory 的 decode_status 一致。语义听核、教师播放与来源批准仍待后续 gate。
