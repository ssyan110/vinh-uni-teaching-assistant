async (page) => {
  const report = [];
  for (let i=0;i<14;i++) {
    await page.evaluate(i => window.__classroomDeck.go(i),i);
    await page.waitForTimeout(900);
    report.push(await page.evaluate(() => {
      const s=document.querySelector('.os-page:not([hidden])');
      const done=s.querySelector('.done');
      const floor=done?done.getBoundingClientRect().top:1030;
      const issues=[...s.querySelectorAll('.material p,.material table,.level,.support,.route article')].filter(e=>e.getBoundingClientRect().bottom>floor).map(e=>({text:e.textContent.slice(0,50),bottom:e.getBoundingClientRect().bottom,floor}));
      const imgs=[...s.querySelectorAll('img')].map(e=>({src:e.getAttribute('src'),loaded:e.complete&&e.naturalWidth>0}));
      return {page:window.__classroomDeck.index()+1,title:s.querySelector('h1')?.textContent,issues,imgs,text:s.innerText};
    }));
    await page.screenshot({path:'/Users/ssyan110/Development/vinh-uni-teaching-assistant/lessons/boya-elementary-i/lesson-11/10-design/open-slide-draft/lesson-11-12-single-activity-v01/qa/page-'+String(i+1).padStart(2,'0')+'.png'});
  }
  console.log(JSON.stringify(report));
}