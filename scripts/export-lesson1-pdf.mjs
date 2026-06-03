import { chromium } from 'playwright';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const slidesDir = path.resolve(root, 'output/book-1/lesson-01/slides');
const indexFile = path.join(slidesDir, 'index.html');
const outPdf = path.resolve(root, 'output/book-1/lesson-01/exports/final/lesson-01-teacher-deck.pdf');

function readManifest() {
  const index = fs.readFileSync(indexFile, 'utf8');
  const manifestMatch = index.match(/const MANIFEST = \[([\s\S]*?)\];/);
  if (!manifestMatch) {
    throw new Error(`Could not find MANIFEST in ${indexFile}`);
  }

  const files = [...manifestMatch[1].matchAll(/["']([^"']+\.html)["']/g)]
    .map(match => match[1]);

  if (!files.length) {
    throw new Error(`MANIFEST in ${indexFile} does not list any slide files`);
  }

  return files;
}

const slides = readManifest();

console.log(`Exporting ${slides.length} slides to PDF...`);

const browser = await chromium.launch();
const mergedPdf = await PDFDocument.create();

for (const slide of slides) {
  const filePath = path.join(slidesDir, slide);
  const page = await browser.newPage();
  await page.setViewportSize({ width: 960, height: 540 });
  await page.goto(`file://${filePath}`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000); // wait for fonts
  
  const pdfBytes = await page.pdf({
    width: '960px',
    height: '540px',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });
  
  const slidePdf = await PDFDocument.load(pdfBytes);
  const [copiedPage] = await mergedPdf.copyPages(slidePdf, [0]);
  mergedPdf.addPage(copiedPage);
  
  await page.close();
  process.stdout.write('.');
}

const finalBytes = await mergedPdf.save();
fs.mkdirSync(path.dirname(outPdf), { recursive: true });
fs.writeFileSync(outPdf, finalBytes);
await browser.close();

console.log(`\nDone! ${slides.length} pages → ${outPdf}`);
console.log(`Size: ${(finalBytes.length / 1024 / 1024).toFixed(1)} MB`);
