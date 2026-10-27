#!/usr/bin/env node
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const path = require('node:path');
const {measure, runNegativeTests, compareReport, measurementHash, normalizeContract, captureStableScreenshot, safeOutputDirectory, parseArgs} = require('../scripts/check_open_slide_rendered_layout.cjs');

const FRAME = '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><style>' +
  '*{box-sizing:border-box}html,body{margin:0;width:1920px;height:1080px;overflow:hidden;font-family:"Times New Roman",KaiTi,serif}' +
  '.os-frame{position:relative;width:1920px;height:1080px;background:white;overflow:hidden}' +
  '.os-page{position:absolute;inset:0;width:1920px;height:1080px;padding:74px 96px 68px;background:#fff;color:#17324d}' +
  'header{height:110px}h1{margin:0;font-size:60px;line-height:1.15}main{margin-top:20px;width:1600px;min-height:200px;font-size:36px}' +
  '.question{margin:0;font-size:50px;line-height:1.25}.page-footer{position:absolute;left:96px;right:96px;bottom:38px;height:34px;font-size:30px;line-height:1.1;display:flex;justify-content:space-between}' +
  '.route{position:absolute;inset:80px 96px}.route h1{font-size:74px}.route-card{position:absolute;top:180px;left:0;width:500px;height:300px;background:#f8fbfb}' +
  '</style><div class="os-frame"><section class="os-page activity" data-idx="0" data-osd-stable-id="fixture-activity">' +
  '<header><h1>小型独立课件</h1></header><main><p class="question">请完成口语任务。</p><p aria-hidden="true">这个可见文字也必须测量。</p></main>' +
  '<footer class="page-footer"><span>博雅汉语 · 小型测试</span><span>01 / 01</span></footer></section></div></html>';

const ROUTE_FRAME = '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><style>' +
  '*{box-sizing:border-box}html,body{margin:0;width:1920px;height:1080px;overflow:hidden;font-family:"Times New Roman",KaiTi,serif}' +
  '.os-frame{position:relative;width:1920px;height:1080px;background:white;overflow:hidden}' +
  '.os-page{position:absolute;inset:0;width:1920px;height:1080px;background:#fff;color:#17324d}' +
  '.route{position:relative;width:1920px;height:1080px;padding:80px 96px}.route h1{margin:0;font-size:74px}.route-card{margin-top:180px;width:500px;height:300px;background:#f8fbfb;font-size:40px}' +
  '</style><div class="os-frame"><section class="os-page" data-idx="0" data-osd-stable-id="fixture-route"><section class="route"><h1>活动流程</h1><article class="route-card">听力 → 讨论</article></section></section></div></html>';
const DISCUSSION_FRAME = FRAME.replace('os-page activity', 'os-page activity discussion');

async function main() {
  const browser = await chromium.launch({channel: 'chrome', headless: true});
  const page = await browser.newPage({viewport: {width: 1920, height: 1080}});
  try {
    await page.setContent(FRAME, {waitUntil: 'load'});
    const good = await page.evaluate(measure, {role: 'activity'});
    assert.deepEqual(good.issues, [], 'a small non-W06 activity fixture should pass');
    assert.equal(good.coverage.finite, true);
    assert.ok(Number.isFinite(good.coverage.content_bottom));
    assert.ok(Number.isFinite(good.coverage.minimum_footer_gap));
    assert.ok(good.coverage.glyph_count > 0);
    assert.ok(good.text_runs.some(run => run.text.includes('这个可见文字')), 'aria-hidden visible text must be measured');

    await page.setContent(ROUTE_FRAME, {waitUntil: 'load'});
    const route = await page.evaluate(measure, {role: 'route'});
    assert.deepEqual(route.issues, [], 'a route without a physical footer should use the reserved boundary');
    assert.equal(route.coverage.footer.kind, 'route-bottom-reserve');
    assert.equal(route.coverage.footer.synthetic, true);
    assert.ok(Number.isFinite(route.coverage.minimum_footer_gap));

    const rawHash = 'a'.repeat(64);
    const normalizedStringContract = normalizeContract({pages: [{
      id: 'discussion-question', role: 'discussion_question', expected_text: '完整的页面文字'
    }]}, rawHash);
    const normalizedArrayContract = normalizeContract({pages: [{
      id: 'discussion-support', role: 'discussion_support', expected_text: ['第一段文字', '第二段文字']
    }]}, 'b'.repeat(64));
    assert.equal(normalizedStringContract.hash, rawHash, 'the caller-provided raw contract hash must be preserved');
    assert.equal(normalizedStringContract.contract.pages[0].expected_text, '完整的页面文字');
    assert.deepEqual(normalizedArrayContract.contract.pages[0].expected_text, ['第一段文字', '第二段文字']);
    assert.equal(normalizedStringContract.contract.pages[0].role, 'discussion_question');
    assert.equal(normalizedArrayContract.contract.pages[0].role, 'discussion_support');

    assert.throws(() => normalizeContract({pages: [{id: 'missing-text', role: 'activity'}]}, 'c'.repeat(64)),
      /must include expected_text/, 'a contract cannot silently omit expected_text');
    assert.throws(() => normalizeContract({pages: [{id: 'empty-text', role: 'activity', expected_text: []}]}, 'c'.repeat(64)),
      /expected_text must be/, 'a contract cannot silently supply empty expected_text');

    const screenshotSequence = [Buffer.from('frame-1'), Buffer.from('frame-2'), Buffer.from('frame-2'), Buffer.from('frame-2')];
    const stableScreenshot = await captureStableScreenshot(
      async () => screenshotSequence.shift(), async () => {}, async () => {}, {maxAttempts: 4, intervalMs: 0, stableCount: 3}
    );
    assert.equal(stableScreenshot.buffer.toString(), 'frame-2');
    assert.equal(stableScreenshot.attempts, 4, 'capture must wait for three consecutive identical screenshots');
    assert.equal(stableScreenshot.stable, true);
    let unstableCapture = 0;
    const unstableScreenshot = await captureStableScreenshot(
      async () => Buffer.from('unstable-' + unstableCapture++), async () => {}, async () => {}, {maxAttempts: 3, intervalMs: 0, stableCount: 3}
    );
    assert.equal(unstableScreenshot.stable, false, 'raster variation should be reported without failing measured QA');
    assert.equal(unstableScreenshot.attempts, 3);

    const project = path.resolve(__dirname, '..');
    assert.doesNotThrow(() => safeOutputDirectory(path.join(project, '.agent', 'runs', 'checker-test')));
    assert.doesNotThrow(() => safeOutputDirectory(path.join(project, 'lessons', 'boya-elementary-i', 'lesson-13', '10-design', 'checker-test')));
    for (const segment of ['00-source', '20-approved', '30-qa', '40-release', '90-archive', 'archive']) {
      assert.throws(() => safeOutputDirectory(path.join(project, 'lessons', 'boya-elementary-i', 'lesson-13', segment, 'checker-test')),
        /protected project paths/, 'output must reject protected ' + segment + ' directories');
    }
    assert.equal(parseArgs(['--deck', 'deck.html', '--self-test']).values.get('--self-test'), true,
      'the established boolean --self-test option remains supported');

    await page.setContent(DISCUSSION_FRAME, {waitUntil: 'load'});
    for (const role of ['discussion_question', 'discussion_support']) {
      const discussion = await page.evaluate(measure, {role, expected_text: ['小型独立课件']});
      assert.equal(discussion.role, role, 'the rendered report should retain the contract role');
      assert.ok(!discussion.issues.some(issue => issue.kind === 'role-mismatch'));
      assert.deepEqual(discussion.issues, [], role + ' should use the shared discussion structure check');
    }

    await page.setContent(FRAME, {waitUntil: 'load'});
    const unknown = await page.evaluate(measure, {role: 'invented-role'});
    assert.ok(unknown.issues.some(issue => issue.kind === 'unknown-role'));

    const negative = await runNegativeTests(browser);
    assert.ok(negative.length >= 9);
    assert.ok(negative.every(item => item.pass), JSON.stringify(negative, null, 2));

    const requiredNegative = [
      'footer-clearance','orphan-line','arbitrary-offcanvas-content','arbitrary-offcanvas-painted-box',
      'tiny-critical-text','transformed-tiny-critical-text','wrong-font-family','missing-footer','missing-required-structure'
    ].map(name => ({name, pass: true}));
    const measurement = {...good};
    const current = {
      deck_sha256: 'deck', checker_sha256: 'checker', contract_sha256: null,
      asset_manifest: [], asset_manifest_sha256: 'assets', pages: [{
        ...measurement, measurement_sha256: measurementHash(measurement),
        screenshot: {file: 'slide-01.png', sha256: 'screenshot'}
      }],
      negative: requiredNegative
    };
    const fabricated = {
      ...current, schema_version: 2, canvas: {width: 1920, height: 1080},
      pages: current.pages.map(item => ({...item, coverage: {...item.coverage}}))
    };
    fabricated.pages[0].coverage.glyph_count += 1;
    const failures = compareReport(fabricated, current, path.resolve(__dirname, 'nonexistent-report.json'), null);
    assert.ok(failures.some(item => item.includes('measurement hash does not bind report contents')),
      'edited rendered metrics must invalidate a report even when its stale hash is copied');

    process.stdout.write(JSON.stringify({ok: true, negative_cases: negative, checks: [
      'small-non-w06-fixture', 'aria-hidden-visible-text', 'route-synthetic-footer-boundary',
      'string-and-array-contract-copy', 'discussion-question-support-roles', 'required-contract-expected-text',
      'consecutive-screenshot-stability', 'unstable-raster-is-diagnostic', 'output-path-protection', 'self-test-flag-compatibility',
      'unknown-role', 'fabricated-report-content-hash'
    ]}, null, 2) + '\n');
  } finally {
    await page.close();
    await browser.close();
  }
}

main().catch(error => {
  process.stderr.write((error && error.stack) || String(error));
  process.stderr.write('\n');
  process.exitCode = 1;
});
