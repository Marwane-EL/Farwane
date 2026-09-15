// Script complet d'automatisation :
// 1. Télécharge les 153 vidéos H.265
// 2. Les convertit en MP4 H.264 Web-Optimized via FFmpeg
// 3. Enregistre les fichiers prêts à l'emploi dans ./memes_h264/

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execFile, execSync } = require('child_process');

// 1. Détection du binaire FFmpeg
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
console.log('🎬 Moteur FFmpeg détecté :', FFMPEG_BIN);

// 2. Dossiers de travail
const RAW_DIR = path.join(__dirname, '..', 'memes_h265');
const OUT_DIR = path.join(__dirname, '..', 'memes_h264');

if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR, { recursive: true });
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// 3. Charger les URLs à traiter
const report = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'audit-report.json'), 'utf-8'));
const urls = report.hevcList;

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) {
      return resolve(); // Déjà téléchargé
    }
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

function convertToH264(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
      return resolve(); // Déjà converti
    }

    // Paramètres H.264 universels :
    // -c:v libx264 : Codec vidéo standard
    // -pix_fmt yuv420p : Indispensable pour la compatibilité Chrome / smartphones
    // -preset fast -crf 23 : Très bonne qualité avec compression rapide
    // -c:a aac -b:a 128k : Audio AAC
    // -movflags +faststart : Déplace l'atome moov au début pour un démarrage instantané
    const args = [
      '-y',
      '-i', inputPath,
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-preset', 'fast',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      outputPath,
    ];

    execFile(FFMPEG_BIN, args, (error) => {
      if (error) return reject(error);
      resolve();
    });
  });
}

async function run() {
  console.log(`\n======================================================`);
  console.log(`📦 Conversion de ${urls.length} vidéos H.265 vers H.264 Web`);
  console.log(`======================================================\n`);

  let count = 0;
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const filename = decodeURIComponent(url.split('/').pop().split('?')[0]);
    const rawPath = path.join(RAW_DIR, filename);
    const outPath = path.join(OUT_DIR, filename);

    process.stdout.write(`\r[${i + 1}/${urls.length}] Traitement de : ${filename.slice(0, 35)}...`);

    try {
      await downloadFile(url, rawPath);
      await convertToH264(rawPath, outPath);
      count++;
    } catch (e) {
      console.error(`\n❌ Erreur sur ${filename}:`, e.message);
    }
  }

  console.log(`\n\n======================================================`);
  console.log(`🎉 SUCCÈS : ${count}/${urls.length} vidéos converties avec succès !`);
  console.log(`📁 Emplacement des fichiers : ${OUT_DIR}`);
  console.log(`======================================================\n`);

  // Générer le script SQL de ré-intégration
  const reintegrateSql = `-- Exécute ceci une fois que tu as ré-uploadé les vidéos converties dans ton bucket
-- pour les ré-intégrer dans ton pack principal 'Memes par défaut'

UPDATE meme_packs
SET memes = (
  SELECT jsonb_agg(DISTINCT elem)
  FROM (
    SELECT jsonb_array_elements_text(memes) AS elem FROM meme_packs WHERE id = '1da80d8d-667e-4b52-b2e9-5fbf4bc5ff8b'
    UNION
    SELECT jsonb_array_elements_text(memes) AS elem FROM meme_packs WHERE name = 'Mèmes H.265 (À convertir)'
  ) sub
)
WHERE id = '1da80d8d-667e-4b52-b2e9-5fbf4bc5ff8b';

-- Supprimer le pack temporaire une fois ré-intégré
DELETE FROM meme_packs WHERE name = 'Mèmes H.265 (À convertir)';

SELECT name, jsonb_array_length(memes) as total_memes
FROM meme_packs
WHERE id = '1da80d8d-667e-4b52-b2e9-5fbf4bc5ff8b';
`;

  fs.writeFileSync(path.join(__dirname, '..', 'reintegrate-memes.sql'), reintegrateSql, 'utf-8');
  console.log(`📝 Script SQL de réintégration créé : reintegrate-memes.sql\n`);
}

run().catch(console.error);
