/**
 * scripts/optimize-videos.js
 *
 * Compresse agressivement toutes les vidéos pour le Web (720p max, 30fps max, H.264 CRF 28,
 * maxrate 850kbps, audio AAC 64kbps, +faststart) et prépare le dossier ./memes_optimized/
 * prêt à être uploadé sur Cloudflare R2.
 *
 * Usage :
 *   node scripts/optimize-videos.js                (compresse les vidéos locales de memes_h264)
 *   node scripts/optimize-videos.js --download-all (télécharge aussi les autres médias de compatibleList et les optimise)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execFile, execSync } = require('child_process');
const os = require('os');

function getFfmpegPath() {
  const customPath = path.join(
    process.env.LOCALAPPDATA || '',
    'Microsoft/WinGet/Packages/Gyan.FFmpeg.Essentials_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.1-essentials_build/bin/ffmpeg.exe'
  );
  if (fs.existsSync(customPath)) return customPath;

  try {
    const which = execSync('where ffmpeg', { encoding: 'utf-8' }).trim().split('\n')[0].trim();
    if (fs.existsSync(which)) return which;
  } catch {}

  return 'ffmpeg';
}

const FFMPEG_BIN = getFfmpegPath();
const H264_DIR = path.join(__dirname, '..', 'memes_h264');
const RAW_COMPAT_DIR = path.join(__dirname, '..', 'memes_raw_compat');
const OUT_DIR = path.join(__dirname, '..', 'memes_optimized');
const OUT_H264_DIR = path.join(OUT_DIR, 'h264');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
if (!fs.existsSync(OUT_H264_DIR)) fs.mkdirSync(OUT_H264_DIR, { recursive: true });

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) {
      return resolve();
    }
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const file = fs.createWriteStream(destPath);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

function compressVideo(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
      return resolve({ skipped: true });
    }

    const inputSize = fs.statSync(inputPath).size;
    // Si la vidéo fait déjà moins de 350 Ko, inutile de la ré-encoder
    if (inputSize <= 350 * 1024) {
      fs.copyFileSync(inputPath, outputPath);
      return resolve({ copied: true });
    }

    const tempPath = outputPath + '.tmp.mp4';

    // Filtre vidéo :
    // - Redimensionne à 720px max sur le côté le plus long (sans jamais agrandir)
    // - Assure des dimensions paires (requis par H.264 yuv420p)
    // - Limite à 30 fps max
    // - CRF 28 + maxrate 850k : réduit le poids de ~75-85% tout en restant net sur mobile/PC
    const vf = "scale='min(720,iw)':'min(720,ih)':force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2";

    const args = [
      '-y',
      '-i', inputPath,
      '-vf', vf,
      '-r', '30',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-preset', 'veryfast',
      '-crf', '28',
      '-maxrate', '850k',
      '-bufsize', '1700k',
      '-c:a', 'aac',
      '-b:a', '64k',
      '-ac', '2',
      '-movflags', '+faststart',
      tempPath,
    ];

    execFile(FFMPEG_BIN, args, (error) => {
      if (error) {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        return reject(error);
      }

      if (fs.existsSync(tempPath)) {
        const outSize = fs.statSync(tempPath).size;
        // Garde le fichier le plus léger entre l'original et le compressé
        if (outSize > 0 && outSize < inputSize) {
          fs.renameSync(tempPath, outputPath);
        } else {
          fs.unlinkSync(tempPath);
          fs.copyFileSync(inputPath, outputPath);
        }
      }
      resolve({ compressed: true });
    });
  });
}

async function runPool(items, workerFn, concurrency) {
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const current = idx++;
      await workerFn(items[current], current, items.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
}

function formatMB(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2) + ' Mo';
}

async function main() {
  const downloadAll = process.argv.includes('--download-all');
  const concurrency = Math.max(2, Math.min(4, Math.floor(os.cpus().length / 2)));

  console.log(`🎬 FFmpeg : ${FFMPEG_BIN}`);
  console.log(`⚡ Parallélisme : ${concurrency} encodages simultanés\n`);

  let totalBefore = 0;
  let totalAfter = 0;

  // 1. Optimiser les 127 vidéos locales du dossier memes_h264/ -> memes_optimized/h264/
  if (fs.existsSync(H264_DIR)) {
    const h264Files = fs.readdirSync(H264_DIR).filter(f => /\.(mp4|mov|webm)$/i.test(f));
    console.log(`📦 Étape 1 : Compression des ${h264Files.length} vidéos de memes_h264/...`);

    let doneCount = 0;
    await runPool(h264Files, async (filename) => {
      const inPath = path.join(H264_DIR, filename);
      const outPath = path.join(OUT_H264_DIR, filename);
      const before = fs.statSync(inPath).size;

      try {
        await compressVideo(inPath, outPath);
        const after = fs.statSync(outPath).size;
        totalBefore += before;
        totalAfter += after;
        doneCount++;
        const pct = Math.round((1 - after / before) * 100);
        process.stdout.write(
          `\r  [${doneCount}/${h264Files.length}] ${filename.slice(0, 28).padEnd(28)} : ${formatMB(before)} -> ${formatMB(after)} (-${pct}%)   `
        );
      } catch (err) {
        console.error(`\n❌ Erreur sur ${filename}:`, err.message);
      }
    }, concurrency);
    console.log('\n');
  }

  // 2. Optionnel : télécharger et optimiser les autres fichiers de compatibleList (audit-report.json)
  if (downloadAll && fs.existsSync(path.join(__dirname, '..', 'audit-report.json'))) {
    if (!fs.existsSync(RAW_COMPAT_DIR)) fs.mkdirSync(RAW_COMPAT_DIR, { recursive: true });
    const report = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'audit-report.json'), 'utf-8'));
    const supabaseUrls = (report.compatibleList || []).filter(u => u.includes('.supabase.co/storage/v1/object/public/medias-farwane/'));

    console.log(`🌐 Étape 2 : Récupération et optimisation des ${supabaseUrls.length} médias compatibles du bucket...`);
    let doneCompat = 0;

    await runPool(supabaseUrls, async (url) => {
      const relKey = decodeURIComponent(url.split('/medias-farwane/')[1].split('?')[0]);
      const rawPath = path.join(RAW_COMPAT_DIR, relKey);
      const outPath = path.join(OUT_DIR, relKey);
      const isVid = /\.(mp4|mov|webm)$/i.test(relKey);

      try {
        await downloadFile(url, rawPath);
        const before = fs.statSync(rawPath).size;
        if (isVid) {
          await compressVideo(rawPath, outPath);
        } else {
          const outSubDir = path.dirname(outPath);
          if (!fs.existsSync(outSubDir)) fs.mkdirSync(outSubDir, { recursive: true });
          if (!fs.existsSync(outPath)) fs.copyFileSync(rawPath, outPath);
        }
        const after = fs.statSync(outPath).size;
        totalBefore += before;
        totalAfter += after;
        doneCompat++;
        process.stdout.write(
          `\r  [${doneCompat}/${supabaseUrls.length}] ${relKey.slice(0, 32).padEnd(32)} : ${formatMB(before)} -> ${formatMB(after)}   `
        );
      } catch (err) {
        console.error(`\n❌ Erreur sur ${relKey}:`, err.message);
      }
    }, concurrency);
    console.log('\n');
  }

  const savedBytes = totalBefore - totalAfter;
  const savedPct = totalBefore > 0 ? Math.round((savedBytes / totalBefore) * 100) : 0;

  console.log('======================================================');
  console.log('✅ OPTIMISATION TERMINÉE !');
  console.log(`📊 Poids avant : ${formatMB(totalBefore)}`);
  console.log(`📊 Poids après : ${formatMB(totalAfter)}`);
  console.log(`🔥 Économisé   : ${formatMB(savedBytes)} (-${savedPct}%)`);
  console.log(`📁 Fichiers prêts dans : ${OUT_DIR}`);
  console.log('======================================================');
}

main().catch(console.error);

