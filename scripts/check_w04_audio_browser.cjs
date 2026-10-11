const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
(async () => {
  const folder = path.resolve(process.argv[2]);
  const report = path.resolve(process.argv[3]);
  const browser = await chromium.launch({channel: 'chrome', headless: true,
    args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required']});
  try {
    const page = await browser.newPage();
    await page.route('**/*', route => route.request().url().startsWith('file:') ? route.continue() : route.abort());
    await page.goto(pathToFileURL(path.join(folder, 'dashboard.html')).href);
    const tracks = await page.evaluate(() => JSON.parse(document.querySelector('#track-data').textContent));
    const results = [];
    for (let index = 0; index < tracks.length; index++) {
      await page.locator('#queue button').nth(index).click();
      await page.waitForFunction(() => document.querySelector('#audio').readyState >= 2);
      const track = tracks[index];
      const result = await page.evaluate(async track => {
        const audio = document.querySelector('#audio');
        const actual = audio.duration;
        // Accelerated playback is only a decoder/event check, never listening QA.
        audio.playbackRate = 16;
        const ended = new Promise((resolve, reject) => {
          audio.addEventListener('ended', () => resolve(true), {once:true});
          audio.addEventListener('error', () => reject(new Error('audio decode error')), {once:true});
        });
        document.querySelector('#play').click();
        await ended;
        return {audio_id:track.audio_id, expected_duration:track.duration_seconds,
          actual_duration:actual, ended:true, error:document.querySelector('#error').textContent,
          counter:document.querySelector('#replays').textContent};
      }, track);
      if (Math.abs(result.actual_duration-track.duration_seconds) > .01 || result.error || !result.counter.includes('完整播放 1 次'))
        throw new Error(JSON.stringify(result));
      results.push(result);
    }
    await page.screenshot({path:path.join(path.dirname(report),'dashboard-browser.png'),fullPage:true});
    fs.writeFileSync(report, JSON.stringify({status:'pass',clips:results,
      browser:'existing Chrome, headless',network:'blocked except local file:',playbackRate:16,
      human_listening:false},null,2));
    console.log(JSON.stringify({status:'pass',loaded_and_ended:results.length,human_listening:false}));
  } finally {await browser.close();}
})().catch(error => {console.error(error);process.exitCode=1;});
