const fs = require('fs');
const report = JSON.parse(fs.readFileSync('audit-report.json', 'utf-8'));
const filenames = report.hevcList.map(u => decodeURIComponent(u.split('/').pop().split('?')[0]));

const sql = `-- ==============================================================================
-- Supprimer les 153 anciens fichiers H.265 (et doublons) du bucket Supabase
-- À exécuter dans Supabase : Dashboard > SQL Editor > New Query
-- ==============================================================================

DELETE FROM storage.objects
WHERE bucket_id = 'medias-farwane'
  AND name IN (
${filenames.map(f => `    '${f.replace(/'/g, "''")}'`).join(',\n')}
  );

-- Vérifier combien de fichiers restent dans le bucket (devrait être environ 163)
SELECT bucket_id, count(*) AS fichiers_restants
FROM storage.objects
WHERE bucket_id = 'medias-farwane'
GROUP BY bucket_id;
`;

fs.writeFileSync('delete-old-h265-from-storage.sql', sql, 'utf-8');
console.log('Généré delete-old-h265-from-storage.sql avec succès !');
