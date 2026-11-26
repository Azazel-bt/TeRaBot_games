import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const packages = [
  {
    src: path.join(rootDir, 'node_modules', '@mediapipe', 'hands'),
    dest: path.join(rootDir, 'public', 'mediapipe', 'hands'),
  },
  {
    src: path.join(rootDir, 'node_modules', '@mediapipe', 'pose'),
    dest: path.join(rootDir, 'public', 'mediapipe', 'pose'),
  },
];

const EXCLUDED_FILES = new Set(['README.md', 'package.json', 'index.d.ts']);

let totalCopied = 0;

for (const pkg of packages) {
  if (!fs.existsSync(pkg.src)) {
    console.warn(`[EraBotGames Offline] No se encontró ${pkg.src}. Ejecuta npm install primero.`);
    continue;
  }

  fs.mkdirSync(pkg.dest, { recursive: true });
  const entries = fs.readdirSync(pkg.src, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile() || EXCLUDED_FILES.has(entry.name)) continue;

    const srcFile = path.join(pkg.src, entry.name);
    const destFile = path.join(pkg.dest, entry.name);

    const srcStat = fs.statSync(srcFile);
    let shouldCopy = true;
    if (fs.existsSync(destFile)) {
      const destStat = fs.statSync(destFile);
      if (destStat.size === srcStat.size && destStat.mtimeMs >= srcStat.mtimeMs) {
        shouldCopy = false;
      }
    }

    if (shouldCopy) {
      fs.copyFileSync(srcFile, destFile);
      totalCopied++;
    }
  }
}

console.log(`[EraBotGames Offline] Activos MediaPipe sincronizados (${totalCopied} archivos actualizados).`);
