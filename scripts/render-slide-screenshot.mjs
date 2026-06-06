#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { chromium } from 'playwright';

const root = process.cwd();
const args = process.argv.slice(2);
const value = (name) => {
  const index = args.indexOf(name);
  return index === -1 ? null : args[index + 1];
};

const slidesDirArg = value('--slides-dir');
const slideArg = value('--slide');
const outArg = value('--out');

if (!slidesDirArg || !slideArg) {
  console.error('Usage: node scripts/render-slide-screenshot.mjs --slides-dir output/book-1/lesson-XX/slides --slide 05-vocab-ni.html [--out output.png]');
  process.exit(1);
}

const slidesDir = path.resolve(root, slidesDirArg);
const slidePath = path.join(slidesDir, slideArg);
const lessonDir = path.dirname(slidesDir);
const outPath = outArg
  ? path.resolve(root, outArg)
  : path.join(lessonDir, 'exports', 'qa', 'screenshots', slideArg.replace(/\.html$/i, '.png'));

await fs.stat(slidePath);
await fs.mkdir(path.dirname(outPath), { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 2 });
await page.goto(`file://${slidePath}`, { waitUntil: 'networkidle', timeout: 20000 });
await page.waitForTimeout(500);
await page.screenshot({ path: outPath, fullPage: false });
await browser.close();

console.log(path.relative(root, outPath));
