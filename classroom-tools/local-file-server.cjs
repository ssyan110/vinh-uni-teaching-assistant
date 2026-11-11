'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { pipeline } = require('node:stream');

const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.md': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
};

// The map binds public URL paths to individual, trusted absolute file paths.
function serve(files, port, redirects = new Map()) {
  const root = fs.realpathSync(path.join(__dirname, '..'));
  for (const file of files.values()) {
    if (!file.startsWith(root + path.sep)) throw new Error('Asset is outside the project');
  }
  const server = http.createServer(async (req, res) => {
    const reject = (status) => { res.writeHead(status); res.end(); };
    const host = req.headers.host;
    const localPort = server.address().port;
    if (![ '127.0.0.1:' + localPort, 'localhost:' + localPort ].includes(host) ||
        (req.headers.origin && req.headers.origin !== 'http://' + host) ||
        req.headers['sec-fetch-site'] === 'cross-site') return reject(403);
    if (!['GET', 'HEAD'].includes(req.method)) return reject(405);
    let filePath;
    try {
      const url = new URL(req.url, 'http://' + host);
      const route = decodeURIComponent(url.pathname);
      if (redirects.has(route)) {
        res.writeHead(302, { Location: redirects.get(route) + url.search });
        return res.end();
      }
      filePath = files.get(route);
    } catch { return reject(400); }
    if (!filePath) return reject(404);
    let file;
    try {
      if (await fs.promises.realpath(filePath) !== filePath) return reject(403);
      file = await fs.promises.open(filePath, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
      const stat = await file.stat();
      if (!stat.isFile()) return reject(404);
      const headers = {
        'Content-Type': mime[path.extname(filePath)] || 'application/octet-stream',
        'Content-Length': stat.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store',
        'Cross-Origin-Resource-Policy': 'same-origin', 'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
      };
      const range = req.headers.range;
      let start = 0, end = stat.size - 1;
      if (range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(range);
        if (match && (match[1] || match[2])) {
          start = match[1] ? Number(match[1]) : Math.max(0, stat.size - Number(match[2]));
          end = match[1] && match[2] ? Math.min(end, Number(match[2])) : end;
        } else start = stat.size;
        if (start > end || start >= stat.size) {
          res.setHeader('Content-Range', 'bytes */' + stat.size);
          return reject(416);
        }
        headers['Content-Range'] = 'bytes ' + start + '-' + end + '/' + stat.size;
        headers['Content-Length'] = end - start + 1;
      }
      res.writeHead(range ? 206 : 200, headers);
      if (req.method === 'HEAD' || !stat.size) return res.end();
      const stream = file.createReadStream({start, end});
      file = undefined; // The stream owns the open descriptor.
      pipeline(stream, res, () => {});
    } catch {
      if (!res.headersSent) reject(404);
      else res.destroy();
    } finally { if (file) await file.close(); }
  });
  return server.listen(port, '127.0.0.1');
}

module.exports = { serve };
