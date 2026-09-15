const fs = require('fs');
const path = require('path');

const H264_DIR = path.join(__dirname, '..', 'memes_h264');
const files = fs.readdirSync(H264_DIR);

const BASE_URL = 'https://ccqqtalmhmbslyajgmmm.supabase.co/storage/v1/object/public/medias-farwane/h264/';
const urls = files.map(f => `${BASE_URL}${encodeURIComponent(f).replace(/%20/g, '%20')}`);

const sql = `-- ==============================================================================
-- Réintégrer les 127 vidéos converties depuis le sous-dossier 'h264/'
-- À exécuter dans Supabase : Dashboard > SQL Editor > New Query
-- ==============================================================================

UPDATE meme_packs
SET memes = (
  SELECT jsonb_agg(DISTINCT elem)
  FROM (
    -- Mèmes existants fonctionnels dans le pack (168 mèmes)
    SELECT jsonb_array_elements_text(memes) AS elem 
    FROM meme_packs 
    WHERE id = '1da80d8d-667e-4b52-b2e9-5fbf4bc5ff8b'
    
    UNION
    
    -- Ajout des 127 nouvelles vidéos converties dans le dossier h264/
    SELECT elem FROM jsonb_array_elements_text('[
${urls.map(u => `      "${u}"`).join(',\n')}
    ]'::jsonb) AS elem
  ) sub
)
WHERE id = '1da80d8d-667e-4b52-b2e9-5fbf4bc5ff8b';

-- Supprimer le pack temporaire
DELETE FROM meme_packs 
WHERE name = 'Mèmes H.265 (À convertir)';

-- Vérifier le nombre total de mèmes (devrait être 168 + 127 = 295 mèmes)
SELECT name, jsonb_array_length(memes) AS total_memes
FROM meme_packs
WHERE id = '1da80d8d-667e-4b52-b2e9-5fbf4bc5ff8b';
`;

fs.writeFileSync(path.join(__dirname, '..', 'reintegrate-folder-h264.sql'), sql, 'utf-8');
console.log('Fichier reintegrate-folder-h264.sql généré !');
