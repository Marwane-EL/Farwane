const fs = require('fs');
const report = JSON.parse(fs.readFileSync('audit-report.json', 'utf-8'));
const hevcUrls = report.hevcList;

let sql = `-- ==============================================================================
-- 1. Créer le pack 'Mèmes H.265 (À convertir)' avec les 153 mèmes isolés
-- ==============================================================================
INSERT INTO meme_packs (name, is_default, memes)
VALUES (
  'Mèmes H.265 (À convertir)',
  false,
  '[
${hevcUrls.map(u => `    "${u}"`).join(',\n')}
  ]'::jsonb
);

-- ==============================================================================
-- 2. Nettoyer le pack principal 'Memes par défaut' (retirer les 153 mèmes)
-- ==============================================================================
UPDATE meme_packs
SET memes = (
  SELECT jsonb_agg(elem)
  FROM jsonb_array_elements_text(memes) elem
  WHERE elem NOT IN (
${hevcUrls.map(u => `    '${u}'`).join(',\n')}
  )
)
WHERE id = '1da80d8d-667e-4b52-b2e9-5fbf4bc5ff8b';

-- ==============================================================================
-- 3. Vérification des packs
-- ==============================================================================
SELECT id, name, jsonb_array_length(memes) AS total_memes, is_default
FROM meme_packs
ORDER BY created_at DESC;
`;

fs.writeFileSync('isolate-and-clean-h265.sql', sql, 'utf-8');
console.log('Fichier isolate-and-clean-h265.sql généré avec succès !');
