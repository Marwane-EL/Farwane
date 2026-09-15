// Script de téléchargement des 153 vidéos H.265
// Les enregistre localement dans le dossier ./memes_h265/

const fs = require('fs');
const path = require('path');
const https = require('https');

const report = JSON.parse(fs.readFileSync('audit-report.json', 'utf-8'));
const urls = report.hevcList;

const OUTPUT_DIR = path.join(__dirname, '..', 'memes_h265');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

async function runPool(items, fn, concurrency = 8) {
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const i = index++;
      const url = items[i];
      const filename = decodeURIComponent(url.split('/').pop().split('?')[0]);
      const dest = path.join(OUTPUT_DIR, filename);
      try {
        await fn(url, dest);
        process.stdout.write(`\r📥 Téléchargement : ${index}/${items.length} (${Math.round((index / items.length) * 100)}%)`);
      } catch (e) {
        console.error(`\n❌ Échec pour ${filename}:`, e.message);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  console.log('\n');
}

async function main() {
  console.log(`🚀 Téléchargement des ${urls.length} vidéos dans : ${OUTPUT_DIR}\n`);
  await runPool(urls, downloadFile, 8);
  console.log(`✅ Terminé ! Tous les fichiers sont dans le dossier : ${OUTPUT_DIR}`);
}

main().catch(console.error);
