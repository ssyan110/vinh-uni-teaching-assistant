'use strict';
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { chromium } = require('playwright');
const { catalogFiles } = require('./serve.cjs');
const { serve } = require('../local-file-server.cjs');

async function main() {
  const server = serve(catalogFiles(), 0);
  await once(server, 'listening');
  let browser;
  try {
    browser = await chromium.launch({channel: 'chrome', headless: true});
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', err => errors.push(String(err)));
    const url = 'http://127.0.0.1:' + server.address().port + '/classroom-tools/audio-dashboard/';
    await page.goto(url + '?exam=W05-L11L12-20261015');
    const entries = page.locator('#queue button');
    assert.equal(await entries.count(), 15);
    for (let i = 0; i < 15; i++) {
      await entries.nth(i).click();
      await page.waitForFunction(() => {
        const audio = document.querySelector('audio');
        return !audio.paused && !audio.error && audio.currentTime > 0;
      });
      await page.locator('audio').evaluate(el => el.pause());
    }
    await page.locator('#lessons input').first().uncheck();
    assert((await entries.count()) < 15);
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({width, height: 800});
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    await page.selectOption('#set', 'W04-DIALOGUE-L05L10-20261011');
    await page.click('#show-qr');
    assert(await page.locator('#exam-dialog').isVisible());
    await page.keyboard.press('Escape');
    assert(!(await page.locator('#exam-dialog').isVisible()));
    assert.deepEqual(errors, []);
    console.log('PASS W05 playback (15 clips), lesson filtering, three viewport widths and W04 QR');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(err => { console.error(err); process.exitCode = 1; });
