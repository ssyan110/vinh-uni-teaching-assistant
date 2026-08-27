# 开口成林 QA 记录

日期：2026-08-23

## 内容与语言边界

- `node qa/validate-content.mjs`：通过。
- 内容包：2 个；情境：28 个；P1–P2 包 12 个，全课包 16 个。
- 教师提供的前两册语言基线已保存为 `reference/prior-boya-i-ii-language-baseline.csv`。自动检查确认共有 43 课、431 个不重复核心词语，SHA-256 为 `70c4ec89cf3c471eabaa76e8ec631819b9800f55eb68a9715a4ccd2f9eeedb4f`。
- CSV 是教学内容大纲，不是穷举词典。检查方式是“既有语言最低证据＋第一课权威来源＋主题限制”，不把 CSV 误报为逐词白名单。
- 每个情境都必须标记为姓名、起名、姓氏或称呼，并对应本课权威来源编号。旧语言只用于提问、回答、确认、听、说、读等完成任务所需的基本表达。
- P1–P2 包只允许 E01-004–008、E01-034–035、G01-001–004、T01-001 与指定词语；自动阻止“不然”“是……还是……”“怎么……怎么……”、谐音、单姓、复姓、尊称和《百家姓》等后续内容。
- 全课包只在完成听说（二）后开放；题目仍只练第一课的姓名、起名、姓氏和称呼。
- 已从题库移除与第一课无关的食堂、打印机、减肥、网络、雨伞、景点、天气、司机、主持人、会议与职位等情境；验证器会阻止这些主题再次进入题库。
- 每题都有两个角色、明确问题与结果、三个具体新情况、向全班说的方式和两个听众任务。

## Chrome

- 浏览器：Google Chrome 151.0.7922.172。
- 1366×768：P1–P2 包完整走完三题的“两人先练 → 看新情况 → 向全班说 → 全班说完 → 下一题”。随机标题为“‘殊’和‘叔’同音”“名字要不要低调一点儿”“‘常殊’最后留不留”，没有重复。
- 直接用 `file://` 离线打开后，完整走完全课包四题；四个随机情境没有重复，成长状态为“完成 4 / 4 题”。
- 空格开始／暂停计时、C、P、N、R 快捷键正常；45 秒计时可正常减少并重置。
- 全屏按钮成功进入浏览器全屏。
- console：0 error，0 warning。
- 1366×768 页面宽高与视口相同，无整页滚动或水平溢出。
- 真实巴哥犬图片完成解码，原始尺寸 480×720 px。

截图：

- `classroom-tools/speaking-challenge/qa/screenshots/chrome-1366-practice.png`
- `classroom-tools/speaking-challenge/qa/screenshots/chrome-1366-change.png`
- `classroom-tools/speaking-challenge/qa/screenshots/chrome-1366-present.png`
- `classroom-tools/speaking-challenge/qa/screenshots/chrome-file-final.png`

## Safari 对应引擎

- 浏览器引擎：Playwright 1.60.0 所附 WebKit。
- 1024×768：全课包完成开始、新情况、向全班说、完成成长和下一题；连续两题没有重复。
- 页面尺寸与视口相同；任务卡 client／scroll 尺寸都是 586×550 px，没有卡片内容溢出。
- 主按钮位于视口内，底部为 753.14 px，小于 768 px 视口高度。
- console：0 error，0 warning。
- 真实巴哥犬图片完成解码，原始宽度 480 px。

截图：

- `classroom-tools/speaking-challenge/qa/screenshots/webkit-1024-present.png`

## 网络

- HTTP 测试的请求只有 `127.0.0.1` 下的本地 HTML、CSS、JavaScript 与巴哥犬 PNG。
- `file://` 测试没有任何非本地请求。
- 没有外部 CDN、字型、图片、分析、音频或接口请求；`connect-src 'none'` 阻止脚本建立网络连接。
