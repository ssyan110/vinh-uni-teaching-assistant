const {chromium} = require('playwright-core');
const fs = require('fs');
const path = require('path');
const {pathToFileURL} = require('url');
const assert = require('assert/strict');
const crypto = require('crypto');
const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
(async () => {
 const browser = await chromium.launch({channel:'chrome',headless:true,args:['--allow-file-access-from-files']});
 const page = await browser.newPage();
 const errors=[]; page.on('pageerror', e=>errors.push(e.message));
 let dialogs=0; page.on('dialog',async d=>{dialogs++;await d.dismiss()});
 try {
  await page.goto(pathToFileURL(path.join(__dirname,'index.html')).href);
  assert.equal(await page.locator('#queue button').count(),15);
  assert.equal(await page.locator('#lessons input:checked').count(),2);
  assert.match(await page.locator('#management-link').getAttribute('href'), /1fhKUHCsyEYvSMrCgw5bL8vtazuwX77DKoa0ZCsQgIso/);
  assert.equal(await page.locator('#teacher-links a').count(),6);
  assert.match(await page.getByRole('link',{name:'周测检查',exact:true}).getAttribute('href'), /closeout.html\?exam=W05-L11L12-20261015/);
  assert.match(await page.locator('#teacher-links a').first().getAttribute('href'), /1fhKUHCsyEYvSMrCgw5bL8vtazuwX77DKoa0ZCsQgIso\/edit#gid=1900630501/);
  const w05Dir = path.resolve(__dirname,'../../course/offerings/2026-fall/博雅汉语听说初级起步篇一/weekly-assessment-review/w05');
  const sections = JSON.parse(fs.readFileSync(path.join(w05Dir,'official-v3/form-sections.json'))).sections;
  assert.equal(sections.length,15);
  assert.deepEqual(await page.locator('#queue h3').allTextContents(),sections.map(s=>s.title));
  for (let i=0;i<sections.length;i++) assert.equal(await page.locator('#queue .audio-group').nth(i).locator('button').count(),sections[i].audio_ids.length);
  const entry = JSON.parse(fs.readFileSync(path.join(w05Dir,'form-entry.json')));
  assert.equal(entry.assessment_id,'W05-L11L12-20261015');
  const sync = JSON.parse(fs.readFileSync(path.join(w05Dir,'form-sync.json')));
  const inputHashes = {items_sha256:sha256(path.join(w05Dir,'official-v3/items.json')),sections_sha256:sha256(path.join(w05Dir,'official-v3/form-sections.json'))};
  const verifiedHashes = sync.verification?.input_hashes || {};
  const syncVerified = sync.status === 'SYNCED_VERIFIED' && sync.version === JSON.parse(fs.readFileSync(path.join(w05Dir,'official-v3/items.json'))).version && Object.entries(inputHashes).every(([key,value])=>verifiedHashes[key]===value);
  const w05EntryGated = !syncVerified;
  if (syncVerified) {
   assert(await page.locator('#exam-entry').isVisible());
   assert.equal(await page.locator('#student-link').getAttribute('href'),entry.responderUri);
   assert.equal(await page.locator('#student-link').isVisible(),true);
   assert.equal(await page.locator('#show-qr').isVisible(),true);
   assert.match(await page.locator('#exam-state').textContent(),/已发布 · 接受作答/);
   assert.match(await page.locator('#student-link').getAttribute('href'),/1FAIpQLSdamXug95veHUdagBRXZibmB-R9trDRDWBYuHqh5wnh_MzmKw/);
   await page.click('#show-qr');
   assert(await page.locator('#exam-dialog').isVisible());
   await page.keyboard.press('Escape');
   assert(!(await page.locator('#exam-dialog').isVisible()));
  } else {
   assert(await page.locator('#exam-entry').isVisible());
   assert.match(await page.locator('#exam-state').textContent(),/尚未逐项读回/);
   assert.equal(await page.locator('#student-link').getAttribute('href'),null);
   assert(await page.locator('#student-link').isHidden());
   assert(await page.locator('#show-qr').isHidden());
  }
  const unregisteredSet = (await page.evaluate(()=>AUDIO_CATALOG.find(b=>b.id==='boya-elementary-i').sets.find(s=>!s.exam&&!s.tools).id));
  await page.selectOption('#set',unregisteredSet);
  assert.equal(await page.locator('#teacher-links a').count(),0);
  assert(!(await page.locator('#exam-entry').isVisible()));
  assert(await page.locator('#no-exam').isVisible());
  assert.equal(await page.locator('#student-link').getAttribute('href'),null);
  await page.selectOption('#set','W04-DIALOGUE-L05L10-20261011');
  const w04Sections = JSON.parse(fs.readFileSync(path.join(__dirname,'form-sections.json'))).sections;
  assert.deepEqual(await page.locator('#queue h3').allTextContents(),w04Sections.map(s=>s.title));
  const w04Entry = JSON.parse(fs.readFileSync(path.join(__dirname,'form-entry.json')));
  assert.equal(await page.locator('#student-link').getAttribute('href'),w04Entry.responderUri);
  assert.match(await page.locator('#exam-state').textContent(),/接受作答/);
  await page.click('#show-qr');
  assert(await page.locator('#exam-dialog').isVisible());
  await page.keyboard.press('Escape');
  assert(!(await page.locator('#exam-dialog').isVisible()));
  const catalog = await page.evaluate(()=>AUDIO_CATALOG);
  let files=0;
  for(const b of catalog) for(const s of b.sets) for(const t of s.tracks) if(t.file){assert(fs.statSync(path.resolve(__dirname,t.file)).isFile());files++}
  const w05Set = catalog.find(b=>b.id==='boya-elementary-i').sets.find(s=>s.id==='W05-L11L12-20261015');
  assert.equal(w05Set.tracks.length,15);
  assert.equal(new Set(w05Set.tracks.map(t=>t.id)).size,15);
  await page.selectOption('#set','W05-L11L12-20261015');
  for(let i=0;i<15;i++){
   await page.locator('#queue button').nth(i).click();
   await page.waitForFunction(()=>{const a=document.querySelector('audio');return !a.paused&&a.currentTime>0});
   await page.locator('#audio').evaluate(a=>a.pause());
  }
  assert.equal(await page.locator('#queue button.played').count(),15);
  await page.locator('#lessons input').first().uncheck();
  assert.equal(await page.locator('#queue button').count(),10);
  await page.locator('#lessons input').last().uncheck();
  assert.equal(await page.locator('#queue button').count(),0);
  await page.selectOption('#set','W04-DIALOGUE-L05L10-20261011');
  for(let i=0;i<15;i++){
   await page.locator('#queue button').nth(i).click();
   await page.waitForFunction(()=>{const a=document.querySelector('audio');return !a.paused && a.currentTime>0});
  }
  assert.equal(await page.locator('#queue button.played').count(),15);
  assert.equal(await page.locator('#queue button').first().evaluate(b=>getComputedStyle(b).backgroundColor),'rgb(255, 240, 203)');
  await page.locator('#next').isDisabled().then(v=>assert(v));
  await page.locator('#lessons input').first().uncheck();
  assert.equal(await page.locator('#queue button').count(),13);
  assert.equal(await page.locator('#queue .audio-group').count(),5);
  assert.equal(await page.locator('#queue button.played').count(),13);
  assert(await page.locator('audio').evaluate(a=>a.paused));
  for(const b of catalog){
   await page.selectOption('#book',b.id);
   for(const s of b.sets){await page.selectOption('#set',s.id);assert.equal(await page.locator('#queue button').count(),s.tracks.length)}
  }
  await page.selectOption('#book','boya-elementary-i');
  await page.setViewportSize({width:390,height:844});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:path.join(__dirname,'mobile.png'),fullPage:true});
  await page.setViewportSize({width:1360,height:950});
  await page.screenshot({path:path.join(__dirname,'desktop.png'),fullPage:true});
  const exam=path.resolve(__dirname,'../../lessons/boya-elementary-i/lesson-09-10/10-design/assessment/w04-l05-l10-dialogue-v01/dashboard.html');
  await page.goto(pathToFileURL(exam).href);
  await page.click('#next');
  assert.match(await page.locator('#range').textContent(),/第2段/);
  await page.locator('#queue button').nth(4).click();
  await page.waitForFunction(()=>{const a=document.querySelector('audio');return !a.paused&&a.currentTime>0});
  assert.match(await page.locator('#range').textContent(),/第5段/);
  assert(await page.locator('#queue button').nth(4).evaluate(b=>b.classList.contains('played')));
  await page.click('#next');
  assert.equal(await page.locator('#queue button').nth(4).evaluate(b=>getComputedStyle(b).backgroundColor),'rgb(255, 240, 203)');
  assert.equal(dialogs,0);assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(__dirname,'verification.json'),JSON.stringify({passed:true,checked_at:new Date().toISOString(),input_hashes:{...inputHashes,build_sha256:sha256(path.join(__dirname,'build.py')),player_sha256:sha256(path.join(__dirname,'player.js')),catalog_sha256:sha256(path.join(__dirname,'catalog.js')),test_sha256:sha256(__filename)},books:catalog.length,sets:catalog.reduce((n,b)=>n+b.sets.length,0),fileReferences:files,w05V3FormSections:15,w05V3AudioReferences:15,w05V3UniqueTracks:15,w05V3DirectPlayReferences:15,w05EntryGatedUntilFormReadback:w05EntryGated,w04DirectPlay:15,w04ExamQrEntry:true,examNextWithoutDialog:true,examQueueDirectPlay:true,qrDialog:true,noStaleExamLink:true,mobileOverflow:false,errors},null,2));
  console.log('Passed: catalog files, 15 W05 v3 Form groups and audio references, 15 unique audio tracks, W05 entry gate, W04 playback, filters, mobile layout and W04 QR.');
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
