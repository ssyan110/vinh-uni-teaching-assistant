'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { serve } = require('../local-file-server.cjs');

const root = path.resolve(__dirname, '../..');
const catalog = path.join(__dirname, 'catalog.js');
const prefix = '/classroom-tools/audio-dashboard/';
const hostPage = '../../lessons/boya-elementary-i/lesson-09-10/10-design/assessment/w04-l05-l10-dialogue-v01/dashboard.html';

function catalogFiles() {
  const files = new Map();
  function register(relative) {
    if (!relative || /^https?:\/\//i.test(relative)) return;
    const file = path.resolve(__dirname, relative);
    if (!file.startsWith(root + path.sep)) throw new Error('Unsafe catalog entry');
    files.set('/' + path.relative(root, file), file);
  }

  for (const name of ['index.html', 'closeout.html', 'ui.js', 'player.js', 'catalog.js',
    'closeout.js', 'closeout-data.js', 'dashboard.css']) register(name);
  files.set(prefix, files.get(prefix + 'index.html'));
  const context = {window: {}};
  vm.runInNewContext(fs.readFileSync(catalog, 'utf8'), context, {timeout: 1000});
  for (const book of context.window.AUDIO_CATALOG) {
    for (const tool of book.tools || []) register(tool.url);
    for (const set of book.sets) {
      for (const track of set.tracks) register(track.file);
      for (const tool of set.tools || []) register(tool.url);
      register(set.exam?.qr);
      register(set.dashboard);
      if (set.dashboard === hostPage) {
        for (const asset of ['dashboard.js', 'lesson-09-测验学生卷.html', 'teacher.md', 'timing.md']) {
          register(path.join(path.dirname(hostPage), asset));
        }
      }
    }
  }
  return files;
}

if (require.main === module) {
  const files = catalogFiles();
  fs.watchFile(catalog, {interval: 250}, () => {
    files.clear();
    try {
      for (const [url, file] of catalogFiles()) files.set(url, file);
    } catch (error) { console.error('Audio catalog unavailable:', error.message); }
  });
  const redirects = new Map([['/', prefix], [prefix.slice(0, -1), prefix]]);
  serve(files, Number(process.env.PORT || 8876), redirects);
}
module.exports = { catalogFiles };
