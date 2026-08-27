import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../第一课-听说一-词语连线.html", import.meta.url), "utf8");
const errors = [];

if (!html.includes("window.__CLASS_CONTENT__=")) errors.push("离线版没有内嵌课堂内容");
if (!html.includes("window.__OFFLINE_SEED_ONLY__=true")) errors.push("离线版没有启用单文件启动模式");
if (!html.includes("起名儿")) errors.push("离线版没有内嵌第一课词语");
if (!html.includes("总不能……吧")) errors.push("离线版没有内嵌句式练习");
if (/<script[^>]+src=/.test(html)) errors.push("离线版仍依赖外部 JavaScript");
if (/<link[^>]+stylesheet/.test(html)) errors.push("离线版仍依赖外部 CSS");
const inlineScripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
if (inlineScripts.some((script) => script.includes("</body>"))) errors.push("离线版脚本被 HTML 结束标签截断");

if (errors.length) {
  console.error(errors.map((message) => `- ${message}`).join("\n"));
  process.exit(1);
}

console.log("离线版检查通过：内容、CSS 和 JavaScript 均已内嵌。");
