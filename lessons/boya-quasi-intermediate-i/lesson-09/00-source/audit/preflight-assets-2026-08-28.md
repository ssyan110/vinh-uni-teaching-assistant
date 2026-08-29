# 第9课来源素材只读预检

预检日期：2026-08-28。依据 `textbooks/boya-quasi-intermediate-i/source/source-inventory.json`；不建立或修改 canonical/contract/manifest，不代表来源批准。

- 课名：北方菜和南方菜；主教材文件页 90–99（印刷 P77–P86）；答案 PDF 页 24–25；QR `http://qr31.cn/IloNOS`。
- QR capture：`textbooks/boya-quasi-intermediate-i/source/qr/captures/lesson-09-pdf-page-090.png`，存在。
- 主教材与答案 PDF：`textbooks/boya-quasi-intermediate-i/source/raw/博雅汉语听说-准中级加速篇I.pdf`、`...-听力文本及参考答案.pdf`，均存在。

|标签|本地文件|bytes一致|SHA一致|ffprobe秒（盘点）|解码盘点|结果|
|---|---|---|---|---:|---|---|
|9-1|audio/lesson-09/9-1.mp3|819190/819190|是|50.887 (50.887)|passed|通过|
|9-2|audio/lesson-09/9-2.mp3|434250/434250|是|26.828 (26.828)|passed|通过|
|9-3|audio/lesson-09/9-3.mp3|1074145/1074145|是|66.821 (66.821)|passed|通过|
|9-4|audio/lesson-09/9-4.mp3|1106746/1106746|是|68.859 (68.859)|passed|通过|
|9-5|audio/lesson-09/9-5.mp3|1013959/1013959|是|63.060 (63.060)|passed|通过|
|9-6|audio/lesson-09/9-6.mp3|874779/874779|是|54.361 (54.361)|passed|通过|

结论：6/6 MP3 存在，bytes、SHA-256、ffprobe 时长和 inventory 的 decode_status 一致。语义听核、教师播放与来源批准仍待后续 gate。
