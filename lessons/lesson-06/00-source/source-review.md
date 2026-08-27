# 第6课《挑战》来源审阅快照

状态：`source_review_materialized`  
审阅状态：`pending_review`  
QA 状态：`pending QA`  
审阅范围：教材印刷页 79–95；PDF 页 90–106；第6课音频 12 个。

## 已写入的来源包

- 结构化来源：[work/boya-intermediate/extractions/structured-lesson-06.json](../../../work/boya-intermediate/extractions/structured-lesson-06.json)
- 来源 manifest：[lessons/lesson-06/00-source/source-manifest.json](source-manifest.json)
- OCR manifest：`work/boya-intermediate/extractions/ocr-lesson-06/manifest.json`
- OCR：`work/boya-intermediate/extractions/ocr-lesson-06/page-090.txt` 至 `page-106.txt`，共 17 页
- 页面预览：`work/boya-intermediate/extractions/pages-preview/lesson-06/pdf-090.png` 至 `pdf-106.png`，共 17 页，当前 PDF 以 200 DPI 渲染

页面图像来自当前项目 PDF 的对应页；旧 Lesson 6 page outputs 只用于交叉检查，未作为当前页面图像的 canonical 输入。

## 结构化盘点

| 内容 | 数量 |
| --- | ---: |
| 页面记录 | 17 |
| section 记录 | 63 |
| 词语记录 | 54 |
| 词语表／释义记录 | 15 |
| 语法句式 | 7 |
| 课文／语段记录 | 4 |
| 印刷练习记录 | 40 |
| 音频记录 | 12 |

结构化文件保留了页码、section、词语、句式、课文／语段、印刷练习与音频映射。未从旧的 `lesson-06.json` 复制为 canonical 内容。

## 已完成的具体检查

- 当前 PDF 页数：148；Lesson 6 目标页范围连续覆盖 PDF 90–106，共 17 页。
- 当前 PDF SHA-256：`c7aa70b16496aecc7d9979bc2744dbe22701650511e48e2433ed19d439d70ad9`。
- 17 个 OCR 文件与 17 个 page image 文件均已写入目标项目相对路径。
- 12 个音频文件均存在；已记录文件大小、时长与 SHA-256；Adam已确认音档正确。
- 12/12 音频通过 `ffmpeg -v error -i <file> -f null -` decode 检查；总时长记录为 1182.748 秒。代理未进行语义听核，不生成逐字转写。
- 第80页第25项 `宿 xiǔ` 已由教材P80／PDF P91页面图确认；词项语义及是否为原书疑误仍交由人工审核。
- 代表性页面已检查词语、听力题、句式练习、文化阅读、拓展练习与页面布局；这不等同于逐字人工校对。

## 待确认事项

- OCR 与教材文字尚未逐字人工核对，疑难字、标点、拼音和分栏边界保持 `pending_review`。
- 音档文件、哈希、时长和解码已核对，内容由Adam确认；本包没有声称代理完成 semantic listening，也不生成音频逐字稿。
- 教材未明示的答案没有编造；开放题和需要教师判断的题目保持未定。
- 第一组词语第 25 项页面图已确认印刷为「宿」与 `xiǔ`；词项语义及是否为原书疑误仍待人工审核。
- 第 87 页跨栏内容与“听说（二）”起始位置需人工确认。
- 来源批准与后续 QA 尚未完成；本包不包含 10-design、20-approved、30-qa、40-release、教师手册、PBI、翻译或 PPTX。

详细文件路径、逐页 SHA-256、图像尺寸、音频时长与音频 SHA-256 见 `source-manifest.json`。
