/**
 * sync_to_auromind.js
 * Synchronizes AuroMandala production client bundle into AuroMind games/auromandala subpath.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const AUROMIND_GAMES_DEST = path.join(ROOT, '..', 'AuroMind', 'games', 'auromandala');

console.log('====================================================');
console.log('  AUROMANDALA ➔ AUROMIND SUBPATH DEPLOYMENT         ');
console.log('====================================================\n');

// 1. Build Vite Production Bundle
console.log('📦 [1/3] Compiling Vite production bundle with base: ./ ...');
execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });

// 2. Verify Output Integrity
console.log('\n🔍 [2/3] Verifying bundle integrity...');
const indexPath = path.join(DIST, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('❌ Build failed: dist/index.html not found!');
  process.exit(1);
}
const htmlContent = fs.readFileSync(indexPath, 'utf-8');
if (!htmlContent.includes('./assets/') && !htmlContent.includes('href="./') && !htmlContent.includes('src="./')) {
  console.warn('⚠️ Warning: dist/index.html may not be using relative paths!');
} else {
  console.log('✅ Relative asset paths confirmed.');
}

// 3. Clean and Copy to AuroMind/games/auromandala
console.log(`\n🚀 [3/3] Deploying bundle to AuroMind at: ${AUROMIND_GAMES_DEST}...`);
if (fs.existsSync(AUROMIND_GAMES_DEST)) {
  fs.rmSync(AUROMIND_GAMES_DEST, { recursive: true, force: true });
}
fs.mkdirSync(AUROMIND_GAMES_DEST, { recursive: true });

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    for (const item of fs.readdirSync(src)) {
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Deploy dist folder contents
copyRecursive(DIST, AUROMIND_GAMES_DEST);

// Count deployed files
let totalFiles = 0;
let totalBytes = 0;
function countRecursive(dir) {
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      countRecursive(full);
    } else {
      totalFiles++;
      totalBytes += stat.size;
    }
  }
}
countRecursive(AUROMIND_GAMES_DEST);

console.log(`\n✅ Successfully deployed AuroMandala to AuroMind!`);
console.log(`   Destination: ${AUROMIND_GAMES_DEST}`);
console.log(`   Total Files: ${totalFiles}`);
console.log(`   Total Size : ${(totalBytes / 1024).toFixed(2)} KB\n`);
