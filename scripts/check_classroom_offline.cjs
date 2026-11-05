#!/usr/bin/env node
// Exercise every page with network disabled; no files are written.
const {chromium} = require('playwright');
const path = require('path');
const {pathToFileURL, fileURLToPath} = require('url');

(async () => {
  const deck = path.resolve(process.argv[2] || '');
  const base = path.dirname(deck);
  const browser = await chromium.launch({channel: 'chrome', headless: true});
  const context = await browser.newContext({offline: true, viewport: {width: 1920, height: 1080}});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', request => {
    const url = request.url();
    if (url.startsWith('file:')) {
      const target = path.resolve(fileURLToPath(url));
      if (target !== deck && !target.startsWith(base + path.sep)) errors.push('Resource outside deck directory: ' + url);
    } else if (!url.startsWith('data:') && !url.startsWith('blob:')) errors.push('Network request: ' + url);
  });
  try {
    await page.goto(pathToFileURL(deck).href, {waitUntil: 'domcontentloaded', timeout: 15000});
    const count = await page.locator('.os-page').count();
    if (!count) errors.push('No classroom pages');
    for (let i = 0; i < count; i++) {
      const result = await page.evaluate(i => {
        if (!window.__classroomDeck || typeof window.__classroomDeck.go !== 'function') return false;
        window.__classroomDeck.go(i);
        return window.__classroomDeck.index() === i;
      }, i);
      if (!result) errors.push('Navigation failed on page ' + (i + 1));
      const images = await page.locator('.os-page:not([hidden]) img').evaluateAll(imgs => Promise.all(imgs.map(async img => {
        try { await img.decode(); return img.naturalWidth > 0; } catch { return false; }
      })));
      if (images.some(ok => !ok)) errors.push('Image failed offline on page ' + (i + 1));
    }
    if (errors.length) throw new Error(errors.join('\n'));
    process.stdout.write(JSON.stringify({status: 'passed', pages: count, network_requests: 0}) + '\n');
  } finally {
    await context.close();
    await browser.close();
  }
})().catch(e => { process.stderr.write(String(e) + '\n'); process.exitCode = 1; });
