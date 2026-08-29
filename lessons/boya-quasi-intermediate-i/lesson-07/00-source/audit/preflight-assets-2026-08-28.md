# 第7课来源素材只读预检

预检日期：2026-08-28。依据 `textbooks/boya-quasi-intermediate-i/source/source-inventory.json`；不建立或修改 canonical/contract/manifest，不代表来源批准。

- 课名：小张热爱登山；主教材文件页 72–80（印刷 P59–P67）；答案 PDF 页 20–21；QR `http://qr31.cn/I7dyDT`。
- QR capture：`textbooks/boya-quasi-intermediate-i/source/qr/captures/lesson-07-pdf-page-072.png`，存在。
- 主教材与答案 PDF：`textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I.pdf`、`...-听力文本及参考答案.pdf`，均存在。

|标签|本地文件|bytes一致|SHA一致|ffprobe秒（盘点）|解码盘点|结果|
|---|---|---|---|---:|---|---|
|7-1|audio/lesson-07/7-1.mp3|917828/917828|是|57.051 (57.051)|passed|通过|
|7-2|audio/lesson-07/7-2.mp3|420875/420875|是|25.992 (25.992)|passed|通过|
|7-3|audio/lesson-07/7-3.mp3|932039/932039|是|57.940 (57.940)|passed|通过|
|7-4|audio/lesson-07/7-4.mp3|995569/995569|是|61.910 (61.910)|passed|通过|
|7-5|audio/lesson-07/7-5.mp3|955863/955863|是|59.429 (59.429)|passed|通过|
|7-6|audio/lesson-07/7-6.mp3|1029841/1029841|是|64.052 (64.052)|passed|通过|

结论：6/6 MP3 存在，bytes、SHA-256、ffprobe 时长和 inventory 的 decode_status 一致。语义听核、教师播放与来源批准仍待后续 gate。
