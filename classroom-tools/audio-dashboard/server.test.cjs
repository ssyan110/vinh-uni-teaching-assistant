'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { once } = require('node:events');
const { serve } = require('../local-file-server.cjs');
const { catalogFiles } = require('./serve.cjs');

test('serves registered media ranges and denies unlisted or foreign requests', async () => {
  const files = catalogFiles();
  const server = serve(files, 0);
  await once(server, 'listening');
  const base = 'http://127.0.0.1:' + server.address().port;
  try {
    const media = [...files.keys()].find(name => /\.(wav|mp3)$/i.test(name));
    const request = (asset, options) => fetch(base + asset, options);
    const range = await request(media, { headers: { Range: 'bytes=0-3' } });
    assert.equal(range.status, 206);
    assert.equal((await range.arrayBuffer()).byteLength, 4);
    assert.equal((await request(media, { method: 'HEAD' })).status, 200);
    assert.equal((await request(media, { headers: { Range: 'bytes=-0' } })).status, 416);
    assert.equal((await request('/.agent/runs/test.txt')).status, 404);
    assert.equal((await request('/classroom-tools/private/vinh-rosters.js')).status, 404);
    assert.equal((await request(media, { method: 'POST' })).status, 405);
    const badHost = await new Promise((resolve, reject) => {
      http.get(base + '/classroom-tools/audio-dashboard/', {headers: {Host: 'audit.invalid'}}, res => {
        res.resume();
        resolve(res.statusCode);
      }).on('error', reject);
    });
    assert.equal(badHost, 403);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
