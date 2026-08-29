# 第11课来源素材只读预检

预检日期：2026-08-28。依据 `textbooks/boya-quasi-intermediate-i/source/source-inventory.json`；不建立或修改 canonical/contract/manifest，不代表来源批准。

- 课名：原来他们是关心我；主教材文件页 109–117（印刷 P96–P104）；答案 PDF 页 28–30；QR `http://qr31.cn/H7bvDX`。
- QR capture：`textbooks/boya-quasi-intermediate-i/source/qr/captures/lesson-11-pdf-page-109.png`，存在。
- 主教材与答案 PDF：`textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I.pdf`、`...-听力文本及参考答案.pdf`，均存在。

|标签|本地文件|bytes一致|SHA一致|ffprobe秒（盘点）|解码盘点|结果|
|---|---|---|---|---:|---|---|
|11-1|audio/lesson-11/11-1.mp3|899438/899438|是|55.902 (55.902)|passed|通过|
|11-2|audio/lesson-11/11-2.mp3|341881/341881|是|21.055 (21.055)|passed|通过|
|11-3|audio/lesson-11/11-3.mp3|1036111/1036111|是|64.444 (64.444)|passed|通过|
|11-4|audio/lesson-11/11-4.mp3|947085/947085|是|58.880 (58.880)|passed|通过|
|11-5|audio/lesson-11/11-5.mp3|805815/805815|是|50.051 (50.051)|passed|通过|
|11-6|audio/lesson-11/11-6.mp3|1272676/1272676|是|79.229 (79.229)|passed|通过|

结论：6/6 MP3 存在，bytes、SHA-256、ffprobe 时长和 inventory 的 decode_status 一致。语义听核、教师播放与来源批准仍待后续 gate。
