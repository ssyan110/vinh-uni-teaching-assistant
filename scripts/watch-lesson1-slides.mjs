#!/usr/bin/env node
/**
 * Watch Lesson 1 slide HTML files and rebuild legacy screenshot data after edits.
 * This is useful outside Kiro, where the .kiro hook may not run.
 */
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const root = process.cwd();
const slidesDir = path.resolve(root, 'output/book-1/lesson-01/slides');
let timer;
let running = false;
let queued = false;

function rebuild() {
  if (running) {
    queued = true;
    return;
  }

  running = true;
  queued = false;
  console.log('\nRebuilding Lesson 1 legacy screenshot data...');

  const child = spawn(process.execPath, ['scripts/build-slides-data.mjs', '--slides-dir', 'output/book-1/lesson-01/slides'], {
    cwd: root,
    stdio: 'inherit',
  });

  child.on('exit', code => {
    running = false;
    if (code !== 0) {
      console.error(`Rebuild failed with exit code ${code}`);
    }
    if (queued) {
      rebuild();
    }
  });
}

function schedule(fileName) {
  if (!fileName || !fileName.endsWith('.html')) return;
  clearTimeout(timer);
  timer = setTimeout(rebuild, 500);
}

console.log(`Watching ${slidesDir}`);
console.log('Press Ctrl+C to stop.');

fs.watch(slidesDir, { persistent: true }, (_eventType, fileName) => {
  schedule(fileName);
});
