const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { app, BrowserWindow } = require('electron');

let server;
let mainWindow;

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function resolveStaticFile(root, requestUrl) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(requestUrl, 'http://127.0.0.1').pathname);
  } catch {
    return null;
  }

  const requested = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const rootPath = path.resolve(root);
  const candidate = path.resolve(rootPath, requested);
  if (candidate !== rootPath && !candidate.startsWith(`${rootPath}${path.sep}`)) {
    return null;
  }

  try {
    if (fs.statSync(candidate).isFile()) return candidate;
  } catch {
    // Vite's history fallback handles client-side routes.
  }

  return path.join(rootPath, 'index.html');
}

function startStaticServer(root) {
  return new Promise((resolve, reject) => {
    server = http.createServer((request, response) => {
      const filePath = resolveStaticFile(root, request.url || '/');
      if (!filePath) {
        response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Bad request');
        return;
      }

      fs.readFile(filePath, (error, content) => {
        if (error) {
          response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          response.end('Not found');
          return;
        }

        const extension = path.extname(filePath).toLowerCase();
        const headers = {
          'Content-Type': MIME_TYPES[extension] || 'application/octet-stream',
          'Cache-Control': path.basename(filePath) === 'index.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
        };
        response.writeHead(200, headers);
        response.end(content);
      });
    });

    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Unable to determine local app server port'));
        return;
      }
      resolve(address.port);
    });
  });
}

async function createMainWindow() {
  const appRoot = app.getAppPath();
  const distRoot = path.join(appRoot, 'dist');
  const iconPath = path.join(appRoot, 'desktop', 'app-icon.icns');
  const port = await startStaticServer(distRoot);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: '課跡',
    backgroundColor: '#f4f2ea',
    icon: iconPath,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  await mainWindow.loadURL(`http://127.0.0.1:${port}/`);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  await createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
}).catch((error) => {
  console.error(error);
  app.quit();
});

app.on('before-quit', () => {
  if (server) {
    server.close();
    server = null;
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
