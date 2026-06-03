#!/usr/bin/env node
/**
 * Export all slides in a lesson to a single merged PDF.
 *
 * Usage:
 *   node scripts/export-slides-pdf.mjs --slides-dir output/book-1/lesson-01/slides
 *   node scripts/export-slides-pdf.mjs --slides-dir output/book-1/lesson-02/slides --out output/book-1/lesson-02/exports/final/lesson-02.pdf
 *
 * Options:
 *   --slides-dir <path>   Path to the slides directory containing index.html (required)
 *   --out <path>          Output PDF path (default: <lesson-root>/exports/final/<lesson-id>-teacher-deck.pdf)
 */
import { chromium } from 'playwright';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const args = process.argv.slice(2);
const slidesDirArg = args[args.indexOf('--slides-dir') + 1];
const outArg = args.indexOf('--out') !== -1 ? args[args.indexOf('--out') + 1] : null;

if (!slidesDirArg) {
  console.error('Error: --slides-dir <path> is required');
  console.error('Example: node scripts/export-slides-pdf.mjs --slides-dir output/book-1/lesson-01/slides');
  process.exit(1);
}

const slidesDir = path.resolve(root, slidesDirArg);
const lessonRoot = path.dirname(slidesDir);
const lessonId = path.basename(lessonRoot);
const indexFile = path.join(slidesDir, 'index.html');

// Derive output PDF path
const outPdf = outArg
  ? path.resolve(root, outArg)
  : path.join(lessonRoot, 'exports', 'final', `${lessonId}-teacher-deck.pdf`);

if (!fs.existsSync(slidesDir)) {
  console.error(`Error: slides directory not found: ${slidesDir}`);
  process.exit(1);
}

function readManifest() {
  const index = fs.readFileSync(indexFile, 'utf8');
  const manifestMatch = index.match(/const MANIFEST = \[([\s\S]*?)\];/);
  if (!manifestMatch) throw new Error(`Could not find MANIFEST in ${indexFile}`);
  const files = [...manifestMatch[1].matchAll(/["']([^"']+\.html)["']/g)].map(m => m[1]);
  if (!files.length) throw new Error(`MANIFEST in ${indexFile} does not list any slide files`);
  return files;
}

const slides = readManifest();
console.log(`Exporting ${slides.length} slides → ${outPdf}`);

// Ensure exports dir exists
fs.mkdirSync(path.dirname(outPdf), { recursive: true });

const browser = await chromium.launch();
const mergedPdf = await PDFDocument.create();

for (const slide of slides) {
  const filePath = path.join(slidesDir, slide);
  const page = await browser.newPage();
  await page.setViewportSize({ width: 960, height: 540 });
  await page.goto(`file://${filePath}`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  const pdfBytes = await page.pdf({
    width: '960px',
    height: '540px',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  const slidePdf = await PDFDocument.load(pdfBytes);
  const [copiedPage] = await mergedPdf.copyPages(slidePdf, [0]);
  mergedPdf.addPage(copiedPage);
  await page.close();
  process.stdout.write('.');
}

const finalBytes = await mergedPdf.save();
fs.writeFileSync(outPdf, finalBytes);
await browser.close();

console.log(`\nDone! ${slides.length} pages → ${outPdf}`);
console.log(`Size: ${(finalBytes.length / 1024 / 1024).toFixed(1)} MB`);
