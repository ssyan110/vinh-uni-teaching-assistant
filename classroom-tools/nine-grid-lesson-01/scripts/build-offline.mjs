import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
const indexPath = resolve(dist, "index.html");
const index = readFileSync(indexPath, "utf8");
const scriptMatch = index.match(/<script[^>]+src="\.\/([^"]+)"[^>]*><\/script>/);
const styleMatch = index.match(/<link[^>]+href="\.\/([^"]+\.css)"[^>]*>/);

if (!scriptMatch || !styleMatch) throw new Error("找不到 Vite 生成的 JS 或 CSS。");

const script = readFileSync(resolve(dist, scriptMatch[1]), "utf8");
const style = readFileSync(resolve(dist, styleMatch[1]), "utf8");
const content = JSON.parse(readFileSync(resolve(root, "public/content/class-content.json"), "utf8"));
const safeContent = JSON.stringify(content).replaceAll("<", "\\u003c");
const safeScript = script.replaceAll("</script", "<\\/script");

const offline = index
  .replace(styleMatch[0], `<style>${style}</style>`)
  // Keep the seed in <head>, but move the bundled runtime to the end of the
  // body. Inline scripts ignore `defer`; placing the runtime after #app keeps
  // the DOM query valid in file:// browsers as well as served pages.
  .replace(scriptMatch[0], `<script>window.__CLASS_CONTENT__=${safeContent};window.__OFFLINE_SEED_ONLY__=true;</script>`)
  // Use a function replacement so `$&` or `$'` inside the minified bundle are
  // treated as JavaScript text, not as String.replace substitution tokens.
  .replace("</body>", () => `<script>${safeScript}</script>\n  </body>`);

writeFileSync(resolve(root, "第一课-听说一-词语连线.html"), offline, "utf8");
