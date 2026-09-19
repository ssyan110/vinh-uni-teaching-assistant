import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../博雅准中级-全册词语连线.html", import.meta.url), "utf8");
const errors = [];

if (!html.includes("window.__CLASS_CONTENT__=")) errors.push("离线版没有内嵌课堂内容");
if (!html.includes("window.__TEXTBOOK_CATALOG__=")) errors.push("离线版没有内嵌教材目录");
if (!html.includes("boya-elementary-i")) errors.push("离线版没有内嵌初级起步篇教材");
if (!html.includes("find-error")) errors.push("离线版没有内嵌拼音找错功能");
if (html.includes("F-L02-TONE-")) errors.push("离线版仍包含已删除的标调位置题");
if (!html.includes("window.__OFFLINE_SEED_ONLY__=true")) errors.push("离线版没有启用单文件启动模式");
if (!html.includes("独生女")) errors.push("离线版没有内嵌第一课词语");
if (!html.includes("丽丽是家里的独生女。")) errors.push("离线版没有内嵌 PPT 例句");
if (/<script[^>]+src=/.test(html)) errors.push("离线版仍依赖外部 JavaScript");
if (/<link[^>]+stylesheet/.test(html)) errors.push("离线版仍依赖外部 CSS");
const inlineScripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
if (inlineScripts.some((script) => script.includes("</body>"))) errors.push("离线版脚本被 HTML 结束标签截断");

if (errors.length) {
  console.error(errors.map((message) => `- ${message}`).join("\n"));
  process.exit(1);
}

console.log("离线版检查通过：内容、CSS 和 JavaScript 均已内嵌。");
