const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const {spawn}=require('node:child_process');
const {chromium}=require('../../node_modules/playwright');
(async()=>{
 const root=__dirname,fixture=fs.mkdtempSync(path.join(root,'qa/fixtures/feedback-ui-'));
 const seed={format:'vinh-gradebook-v1',revision:0,classes:[{id:'SYNTH',year:1,students:[{code:'1',name:'合成学生',seat:1,active:true}],assessments:[{id:'a',title:'合成任务',date:'',rubric:[{name:'内容',max:10,step:.5,description:'说明原因并提供例子。'}]}]}],records:{'SYNTH|a|1':{status:'done',scores:[7],total:7,flags:[],note:'请补充例子。'}}};
 fs.writeFileSync(path.join(fixture,'seed.json'),JSON.stringify(seed));
 const server=spawn('python3',['server.py','--port','18769','--data-dir',fixture],{cwd:root});let browser;
 try{
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
 browser=await chromium.launch({headless:true,executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"});const page=await browser.newPage({viewport:{width:1280,height:900}});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:18769');await page.locator('#assessment-select').waitFor();await page.locator('.exam-tools summary').click();await page.locator('#individual-feedback').click();await page.locator('#feedback-generate').click();await page.locator('#feedback-performance').waitFor();assert.match(await page.locator('#feedback-performance').inputValue(),/内容：7／10 分/);
 await page.locator('#feedback-practice').fill('录音说明原因，加入一个例子，检查内容是否完整。');await page.locator('#feedback-review').click();await page.getByText('请先勾选逐项核对确认',{exact:true}).waitFor();await page.locator('#feedback-confirm').check();await page.locator('#feedback-review').click();await page.getByText('反馈已确认。',{exact:true}).waitFor();
 const out=await page.request.get('http://127.0.0.1:18769/api/feedback-export?class=SYNTH&assessment=a');assert.equal(out.status(),200);assert.match(await out.text(),/录音说明原因/);
 await page.screenshot({path:path.join(root,'qa/individual-feedback-2026-10-04.png'),fullPage:true});await page.locator('#feedback-close').click();assert.equal(errors.length,0);console.log('PASS: reachable feedback dialog, evidence draft, edit, explicit confirmation, reviewed export, no browser errors');
 }finally{if(browser)await browser.close();server.kill('SIGTERM');}
})().catch(e=>{console.error(e);process.exitCode=1;});
