const {chromium} = require('playwright-core');
const fs = require('fs');
const path = require('path');
const {pathToFileURL} = require('url');
const assert = require('assert/strict');
(async () => {
  const browser = await chromium.launch({channel:'chrome',headless:true,args:['--disable-gpu']});
  const page = await browser.newPage();
  const errors=[]; page.on('pageerror', error=>errors.push(error.message));
  try {
    await page.goto(pathToFileURL(path.join(__dirname,'index.html')).href+'?exam=W08-L16L17-20261023');
    await page.getByRole('link',{name:'周测检查',exact:true}).click();
    assert.equal(await page.locator('#exam').inputValue(),'W08-L16L17-20261023');
    assert.match(await page.locator('#checks').innerText(),/尚未连接作答后台/);
    assert.match(await page.locator('article').filter({hasText:'Form／Sheets 读回记录'}).innerText(),/有保存记录/);
    assert.match(await page.locator('article').filter({hasText:'Form／Sheets 读回记录'}).innerText(),/线上现况未检查/);
    assert.match(await page.locator('#generated').innerText(),/本地检查时间/);
    const exams=await page.locator('#exam option').evaluateAll(options=>options.map(o=>o.value));
    for(const id of exams) {
      await page.selectOption('#exam',id);
      assert(await page.locator('article').count()>=8);
      assert.match(await page.locator('#back').getAttribute('href'),new RegExp(encodeURIComponent(id)));
    }
    await page.goto(pathToFileURL(path.join(__dirname,'closeout.html')).href+'?exam=UNREGISTERED');
    assert.equal(await page.locator('#exam').inputValue(),'');
    assert.equal(await page.locator('article').count(),0);
    assert.match(await page.locator('#summary').innerText(),/不在现行清单/);
    await page.selectOption('#exam','W08-L16L17-20261023');
    assert.equal(await page.locator('h1').count(),1);
    assert.equal(await page.locator('article').count(),10);
    await page.setViewportSize({width:390,height:700});
    await page.goto(pathToFileURL(path.join(__dirname,'closeout.html')).href+'?exam=W08-L16L17-20261023');
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    const output=path.join(__dirname,'qa-closeout'); fs.mkdirSync(output,{recursive:true});
    await page.screenshot({path:path.join(output,'mobile-top.png')});
    await page.locator('article').last().scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(output,'mobile-bottom.png')});
    await page.setViewportSize({width:1280,height:900});
    await page.evaluate(()=>scrollTo(0,0));
    await page.screenshot({path:path.join(output,'desktop-top.png')});
    await page.locator('article').nth(4).scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(output,'desktop-middle.png')});
    await page.locator('article').last().scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(output,'desktop-bottom.png')});
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(output,'verification.json'),JSON.stringify({checked_at:new Date().toISOString(),passed:true,exams:exams.length,selected_exam_link:true,invalid_exam_requires_selection:true,single_header:true,mobile_overflow:false,page_errors:errors},null,2));
    console.log('Passed: selected-exam integration, all exam checks, pending backend, mobile layout, no browser errors.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exit(1)});
