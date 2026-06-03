import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const canonicalPresenterPath = path.resolve(
  scriptDir,
  '../output/book-1/lesson-01/slides/index.html',
);

function replaceOnce(html, pattern, replacement) {
  if (!pattern.test(html)) {
    throw new Error(`Could not apply presenter template replacement: ${pattern}`);
  }
  const next = html.replace(pattern, replacement);
  return next;
}

export function presenterHtml(manifest, total) {
  const firstSlide = manifest[0] || '';
  const manifestJson = JSON.stringify(manifest, null, 2);
  let html = readFileSync(canonicalPresenterPath, 'utf8');

  html = replaceOnce(
    html,
    /const MANIFEST = \[[\s\S]*?\n\];/,
    `const MANIFEST = ${manifestJson};`,
  );
  html = replaceOnce(
    html,
    /<div class="subtitle">.*?<\/div><\/div>/,
    `<div class="subtitle">${total} slides · Press <strong>F</strong> for presentation mode</div></div>`,
  );
  html = replaceOnce(
    html,
    /<div class="thumb-total">\d+<\/div>/,
    `<div class="thumb-total">${total}</div>`,
  );
  html = replaceOnce(
    html,
    /<iframe id="slideFrame" src="[^"]*"><\/iframe>/,
    `<iframe id="slideFrame" src="${firstSlide}"></iframe>`,
  );
  html = html.replace(/1 \/ \d+/g, `1 / ${total}`);
  html = html.replace(/Rendering slide 1 \/ \d+/g, `Rendering slide 1 / ${total}`);

  return html;
}
