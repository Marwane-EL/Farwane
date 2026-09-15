// Script de nettoyage des doublons dans memes_h264
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const RAW_DIR = path.join(__dirname, '..', 'memes_h265');
const H264_DIR = path.join(__dirname, '..', 'memes_h264');

function getHash(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

// 1. Détecter les doublons exacts basés sur les fichiers sources
const rawFiles = fs.readdirSync(RAW_DIR);
const hashMap = {};

rawFiles.forEach(file => {
  const p = path.join(RAW_DIR, file);
  const hash = getHash(p);
  if (!hashMap[hash]) hashMap[hash] = [];
  hashMap[hash].push(file);
});

// Fonction pour choisir le "meilleur" nom (le plus propre, sans (1) ni -1)
function scoreFilename(filename) {
  let score = 0;
  if (!filename.includes('(') && !filename.includes(')')) score += 10;
  if (!filename.includes('-1')) score += 5;
  if (filename.startsWith('VID_')) score += 2; // Majuscules propres standard Android
  return score;
}

const toKeep = [];
const toDelete = [];

Object.entries(hashMap).forEach(([hash, files]) => {
  if (files.length === 1) {
    toKeep.push(files[0]);
  } else {
    // Trier par score décroissant : le meilleur en premier
    files.sort((a, b) => scoreFilename(b) - scoreFilename(a));
    toKeep.push(files[0]);
    for (let i = 1; i < files.length; i++) {
      toDelete.push({
        file: files[i],
        duplicateOf: files[0]
      });
    }
  }
});

console.log(`📊 Bilan :`);
console.log(`  - Fichiers uniques conservés : ${toKeep.length}`);
console.log(`  - Doublons à supprimer : ${toDelete.length}\n`);

console.log(`🗑️  Suppression des doublons dans memes_h264 :`);
let deletedCount = 0;
toDelete.forEach(({ file, duplicateOf }) => {
  const targetPath = path.join(H264_DIR, file);
  if (fs.existsSync(targetPath)) {
    fs.unlinkSync(targetPath);
    console.log(`  ❌ Supprimé : ${file} (copie de : ${duplicateOf})`);
    deletedCount++;
  }
});

console.log(`\n✅ Nettoyage terminé ! ${deletedCount} fichiers doublons supprimés.`);
console.log(`📁 Il reste exactement ${toKeep.length} vidéos uniques prêtes dans memes_h264/.\n`);

// 2. Mettre à jour le script SQL de réintégration avec les URLs propres uniquement
const BASE_SUPABASE_URL = 'https://ccqqtalmhmbslyajgmmm.supabase.co/storage/v1/object/public/medias-farwane/';
const keptUrls = toKeep.map(f => `${BASE_SUPABASE_URL}${encodeURIComponent(f).replace(/%20/g, '%20')}`);
const deletedUrls = toDelete.map(d => `${BASE_SUPABASE_URL}${encodeURIComponent(d.file).replace(/%20/g, '%20')}`);

const sql = `-- ==============================================================================
-- Réintégrer les 127 vidéos uniques H.264 dans le pack 'Memes par défaut'
-- et supprimer définitivement les doublons et le pack temporaire
-- ==============================================================================

-- 1. Réintégration des 127 mèmes uniques convertis
UPDATE meme_packs
SET memes = (
  SELECT jsonb_agg(DISTINCT elem)
  FROM (
    -- Mèmes existants actuels (168 mèmes)
    SELECT jsonb_array_elements_text(memes) AS elem 
    FROM meme_packs 
    WHERE id = '1da80d8d-667e-4b52-b2e9-5fbf4bc5ff8b'
    
    UNION
    
    -- Ajout des 127 vidéos uniques converties en H.264
    SELECT elem FROM jsonb_array_elements_text('[
${keptUrls.map(u => `      "${u}"`).join(',\n')}
    ]'::jsonb) AS elem
  ) sub
  -- Sécurité : on s'assure de ne PAS réinsérer les doublons supprimés
  WHERE elem NOT IN (
${deletedUrls.map(u => `    '${u}'`).join(',\n')}
  )
)
WHERE id = '1da80d8d-667e-4b52-b2e9-5fbf4bc5ff8b';

-- 2. Supprimer le pack temporaire H.265
DELETE FROM meme_packs 
WHERE name = 'Mèmes H.265 (À convertir)';

-- 3. Vérification du pack final
SELECT name, jsonb_array_length(memes) as total_memes
FROM meme_packs
WHERE id = '1da80d8d-667e-4b52-b2e9-5fbf4bc5ff8b';
`;

fs.writeFileSync(path.join(__dirname, '..', 'reintegrate-memes.sql'), sql, 'utf-8');
console.log(`📝 Script mis à jour : reintegrate-memes.sql (contient les 127 URLs uniques sans doublons)`);
