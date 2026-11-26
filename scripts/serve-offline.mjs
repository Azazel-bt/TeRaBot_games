import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const shouldOpen = process.argv.includes('--open');
const preferredPort = parseInt(process.env.PORT || '3000', 10);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm',
  '.data': 'application/octet-stream',
  '.tflite': 'application/octet-stream',
  '.binarypb': 'application/octet-stream',
  '.txt': 'text/plain; charset=utf-8',
};

if (!fs.existsSync(path.join(distDir, 'index.html'))) {
  console.error('[EraBotGames] ERROR: No se encontró la carpeta compilada "dist/".');
  console.error('Ejecuta "npm run build" una vez con Node.js para generar la versión offline.');
  process.exit(1);
}

function openBrowser(url) {
  if (process.platform === 'win32') {
    exec(`start "" "${url}"`);
  } else if (process.platform === 'darwin') {
    exec(`open "${url}"`);
  } else {
    exec(`xdg-open "${url}"`);
  }
}

function createStaticServer() {
  return http.createServer((req, res) => {
    try {
      const reqUrl = new URL(req.url || '/', 'http://localhost');
      let relPath = decodeURIComponent(reqUrl.pathname);
      if (relPath === '/') relPath = '/index.html';

      const safePath = path.normalize(relPath).replace(/^(\.\.[/\\])+/, '');
      let filePath = path.join(distDir, safePath);

      if (!filePath.startsWith(distDir)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Acceso denegado');
        return;
      }

      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        // Fallback SPA hacia index.html si no tiene extensión de recurso
        if (!path.extname(filePath)) {
          filePath = path.join(distDir, 'index.html');
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Archivo no encontrado');
          return;
        }
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const stat = fs.statSync(filePath);

      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stat.size,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000',
        'X-Content-Type-Options': 'nosniff',
      });

      fs.createReadStream(filePath).pipe(res);
    } catch {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Error interno del servidor local');
    }
  });
}

function startOnAvailablePort(port) {
  const server = createStaticServer();
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && port < preferredPort + 20) {
      startOnAvailablePort(port + 1);
    } else {
      console.error('[EraBotGames] No se pudo iniciar el servidor local:', err.message);
      process.exit(1);
    }
  });

  server.listen(port, '127.0.0.1', () => {
    const localUrl = `http://localhost:${port}`;
    console.log('');
    console.log('==============================================================');
    console.log('   EraBotGames · Modo Local 100% Offline Activo');
    console.log('   Programa hecho por: Carlos Stiven Roa');
    console.log('   Grupo: CEMOS | Semillero: ERA');
    console.log('==============================================================');
    console.log(`   Abre en tu navegador: ${localUrl}`);
    console.log('   No cierres esta ventana mientras juegas.');
    console.log('   Presiona Ctrl + C para detener el programa.');
    console.log('');

    if (shouldOpen) {
      openBrowser(localUrl);
    }
  });
}

startOnAvailablePort(preferredPort);
