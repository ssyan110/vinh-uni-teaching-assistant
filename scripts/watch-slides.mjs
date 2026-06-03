#!/usr/bin/env node
/**
 * Watch a lesson's slide HTML files and rebuild legacy screenshot data after edits.
 * Useful outside Kiro, where the .kiro hook may not run.
 *
 * Usage:
 *   node scripts/watch-slides.mjs --slides-dir output/book-1/lesson-01/slides
 *   node scripts/watch-slides.mjs --slides-dir output/book-1/lesson-02/slides
 *
 * Options:
 *   --slides-dir <path>   Path to the slides directory to watch (required)
 */
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const root = process.cwd();
const args = process.argv.slice(2);
const slidesDirArg = args[args.indexOf('--slides-dir') + 1];

if (!slidesDirArg) {
  console.error('Error: --slides-dir <path> is required');
  console.error('Example: node scripts/watch-slides.mjs --slides-dir output/book-1/lesson-01/slides');
  process.exit(1);
}

const slidesDir = path.resolve(root, slidesDirArg);

if (!fs.existsSync(slidesDir)) {
  console.error(`Error: slides directory not found: ${slidesDir}`);
  process.exit(1);
}

let timer;
let running = false;
let queued = false;

function rebuild() {
  if (running) { queued = true; return; }
  running = true;
  queued = false;
  console.log(`\nRebuilding legacy screenshot data for ${slidesDirArg}...`);
  const child = spawn(process.execPath, ['scripts/build-slides-data.mjs', '--slides-dir', slidesDirArg], {
    cwd: root,
    stdio: 'inherit',
  });
  child.on('exit', code => {
    running = false;
    if (code !== 0) console.error(`Rebuild failed with exit code ${code}`);
    if (queued) rebuild();
  });
}

function schedule(fileName) {
  if (!fileName || !fileName.endsWith('.html')) return;
  clearTimeout(timer);
  timer = setTimeout(rebuild, 500);
}

console.log(`Watching ${slidesDir}`);
console.log('Press Ctrl+C to stop.');
fs.watch(slidesDir, { persistent: true }, (_eventType, fileName) => schedule(fileName));
