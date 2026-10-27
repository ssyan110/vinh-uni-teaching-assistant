# 口语练习：自行抽题与计时

公开自练网址：[打开口语练习](https://ssyan110.github.io/vinh-uni-teaching-assistant/oral-practice/)。

学生可以自行抽题、准备和回答；问题与四格图一起显示。按“开始准备”后倒数1分钟，自动进入2分钟作答；可自行暂停／继续，结束后按“再练一题”直接抽新组合。

## 内容接口

`index.html` 会先载入同目录的 `content.js`，然后载入计时逻辑和界面。内容脚本须定义：

```js
window.ORAL_EXAM_BANK = {
  questions: [{ id: 'Q01', title: '…', prompt: '…', hints: ['…', '…'] }],
  pictures: [{ id: 'B01', title: '…', src: 'assets/B01.webp', alt: '…' }]
};
```

问题和图片分别独立均匀抽取、有放回，因此重复题目是允许的。题卡在抽出后保持可见，直到按“再练一题”。页面启动时会预载并解码全部图片；任一内容或图片缺失都会显示错误并禁用抽题。

## 计时

- 抽题动画约1.6秒，两侧同时揭晓；开启减少动态效果时立即揭晓。
- 按“开始准备”后开始1分钟倒计时，到时自动进入2分钟回答。
- 暂停／继续按墙上时钟的实际时间保存剩余时长；切换标签页回来时会按截止时间追上阶段。
- 倒计时只是课堂组织工具。回答时间到后显示“再练一题”，按一下就抽出下一组。

## 本地运行与自检

确认同目录存在 `content.js` 和 `assets/` 图片后，直接打开 `index.html`。离线运行，不需要账号或网络。

```sh
node --test classroom-tools/speaking-challenge/exam/test-logic.mjs
```

自检覆盖独立随机选择边界、抽题锁定、准备／回答阶段、再次练习重置、暂停恢复和后台时间跳变。题目内容与图片质量由对应内容审核负责，不由计时逻辑测试代替。

## 题目与图片

当前为第4—15课的30道问题和12张原创四格图；图片沿用v4内容。文字题依Adam手动修改并要求上线的 qa/review-30q-20261026/口语文字题-30题-审阅稿.md 上方“30题总表”同步；该表优先于下方旧逐题说明。当前运行文字以content.js为准。旧12题来源对照仅作历史设计依据。图片已打包在本地assets，不需要联网取图。两题独立抽选，可得到360种组合，抽选有放回。图片中的付款可描述为现金或刷卡，不设唯一台词。网站已部署GitHub Pages供学生自练；不包含录音、上传或自动评分。公开版本只打包运行文件与WebP图片，完整PNG、备课记录和QA文件留在本机。

## 浏览器核验

本机服务启动后，可运行 `node classroom-tools/speaking-challenge/exam/qa/browser-smoke.cjs`。证据见 `qa/browser-verification.json` 与截图；包含同时揭晓、计时阶段转换、暂停、再次练习、移动端、离线载入及缺图处理。

## GitHub Pages

源代码提交见[PR #7](https://github.com/ssyan110/vinh-uni-teaching-assistant/pull/7)，发布使用现有 `.github/workflows/deploy-nine-grid-pages.yml`，在九宫格站点的 `/oral-practice/` 子目录提供本页。文字题更新见[PR #8](https://github.com/ssyan110/vinh-uni-teaching-assistant/pull/8)。发布记录见本目录 `qa/deployment.json`；更新时须同时保留根目录九宫格构建产物。

2026-10-26：30道文字题依Adam手动修改的审阅稿上方“30题总表”发布；该表优先于下方未更新的旧逐题说明。题干和提示逐字保留，提示可为空或多条，图片与计时不变。
