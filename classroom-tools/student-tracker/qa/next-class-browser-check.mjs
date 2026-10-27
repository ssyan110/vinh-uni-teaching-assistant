import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { chromium } from '../../../node_modules/playwright/index.mjs'
const browser = await chromium.launch({ headless: true, channel: 'chrome' })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(process.env.TRACKER_QA_URL || 'http://127.0.0.1:4321/')
  await page.getByRole('button', { name: '使用示例数据查看界面' }).click()
  const queue = page.locator('section[aria-labelledby="urgent-heading"]')
  await queue.getByRole('heading', { name: '下堂课跟进' }).waitFor()
  assert.match(await queue.innerText(), /未观察不代表零分、缺席或未交作业/)
  const firstCourse = await queue.getByLabel('选择班级').inputValue()
  await queue.getByLabel('选择班级').selectOption({ index: 1 })
  assert.notEqual(await queue.getByLabel('选择班级').inputValue(), firstCourse)
  await queue.getByLabel('选择班级').selectOption(firstCourse)
  const expand = queue.getByRole('button', { name: /显示全部/ })
  if (await expand.count()) {
    await expand.click()
    assert.ok(await queue.locator('.urgent-student-row').count() > 8)
    await queue.getByRole('button', { name: '收起名单' }).click()
    assert.equal(await queue.locator('.urgent-student-row').count(), 8)
  }
  await queue.evaluate(element => window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 90))
  await page.screenshot({ path: 'qa/next-class-desktop.png' })
  const task = queue.locator('a[href*="#followup-"]').first()
  assert.ok(await task.count(), 'demo must exercise a task link')
  const href = await task.getAttribute('href')
  await task.click()
  assert.equal(await page.getByLabel('查看班級').inputValue(), firstCourse)
  const target = page.locator(new URL(page.url()).hash)
  await target.waitFor()
  await target.getByRole('button', { name: '標記完成' }).click()
  await target.waitFor({ state: 'detached' })
  await page.goto(new URL('/today', page.url()).href)
  await queue.getByRole('heading', { name: '下堂课跟进' }).waitFor()
  assert.equal(await queue.locator(`a[href="${href}"]`).count(), 0)
  await page.setViewportSize({ width: 390, height: 844 })
  await queue.evaluate(element => window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 80))
  await page.screenshot({ path: 'qa/next-class-mobile.png' })
  await page.evaluate(() => window.scrollBy(0, 600))
  await page.screenshot({ path: 'qa/next-class-mobile-lower.png' })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
  assert.deepEqual(errors, [])
  const result = { mode: 'demo only', courseSwitch: true, taskDeepLink: true, completionUpdatesQueue: true, expandCollapse: true, mobileOverflow: false, pageErrors: errors }
  await writeFile('qa/next-class-browser-result.json', JSON.stringify(result, null, 2) + '\n')
  console.log(JSON.stringify(result))
} finally { await browser.close() }
