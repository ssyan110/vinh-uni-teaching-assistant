export function vocabularyGridCount(itemsOrCount) {
  const rawCount = Array.isArray(itemsOrCount) ? itemsOrCount.length : Number(itemsOrCount);
  if (!Number.isFinite(rawCount) || rawCount < 1) return 0;
  return Math.floor(rawCount);
}

export function vocabularyGridClass(itemsOrCount, baseClass = 'word-grid') {
  const count = vocabularyGridCount(itemsOrCount);
  if (count === 0 || count > 8) return baseClass;
  return [baseClass, 'vocab-grid-balanced', count ? `vocab-grid-count-${count}` : '']
    .filter(Boolean)
    .join(' ');
}

export function vocabularyGridCss() {
  return `
.word-grid.vocab-grid-balanced{display:grid;grid-template-columns:repeat(8,minmax(0,1fr))!important;gap:20px 14px;height:100%;align-content:center;grid-auto-flow:row}
.summary-grid.vocab-grid-balanced{display:grid;grid-template-columns:repeat(8,minmax(0,1fr))!important;gap:20px 14px;align-content:center;grid-auto-flow:row}
.vocab-grid-balanced>*{grid-column:span 2}
.vocab-grid-count-1>:nth-child(1){grid-column:4/span 2}
.vocab-grid-count-2>:nth-child(1){grid-column:3/span 2}.vocab-grid-count-2>:nth-child(2){grid-column:5/span 2}
.vocab-grid-count-3>:nth-child(1){grid-column:2/span 2}.vocab-grid-count-3>:nth-child(2){grid-column:4/span 2}.vocab-grid-count-3>:nth-child(3){grid-column:6/span 2}
.vocab-grid-count-5>:nth-child(5){grid-column:4/span 2}
.vocab-grid-count-6>:nth-child(5){grid-column:3/span 2}.vocab-grid-count-6>:nth-child(6){grid-column:5/span 2}
.vocab-grid-count-7>:nth-child(5){grid-column:2/span 2}.vocab-grid-count-7>:nth-child(6){grid-column:4/span 2}.vocab-grid-count-7>:nth-child(7){grid-column:6/span 2}`;
}
