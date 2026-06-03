#!/usr/bin/env node
/**
 * Backward-compatible wrapper.
 * The screenshot render and slides-data rebuild now live in build-slides-data.mjs.
 */
await import('./build-slides-data.mjs');
