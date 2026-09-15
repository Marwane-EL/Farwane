-- ==============================================================================
-- Importer automatiquement les 316 fichiers de 'medias-farwane' dans le pack de base
-- À exécuter dans Supabase : Dashboard > SQL Editor > New Query
-- ==============================================================================

-- 1. Ajout de tous les médias du bucket 'medias-farwane' dans le pack "Memes par défaut"
UPDATE meme_packs
SET memes = (
  SELECT jsonb_agg(DISTINCT elem)
  FROM (
    -- Conserve les mèmes déjà existants dans le pack
    SELECT jsonb_array_elements_text(memes) AS elem
    FROM meme_packs
    WHERE id = '1da80d8d-667e-4b52-b2e9-5fbf4bc5ff8b'
    
    UNION
    
    -- Génère et ajoute les URLs publiques des fichiers du bucket 'medias-farwane'
    SELECT 'https://ccqqtalmhmbslyajgmmm.supabase.co/storage/v1/object/public/' || bucket_id || '/' || replace(name, ' ', '%20') AS elem
    FROM storage.objects
    WHERE bucket_id = 'medias-farwane'
      AND name NOT LIKE '.%'
      AND (
        name ILIKE '%.gif' OR
        name ILIKE '%.mp4' OR
        name ILIKE '%.webm' OR
        name ILIKE '%.mov' OR
        name ILIKE '%.png' OR
        name ILIKE '%.jpg' OR
        name ILIKE '%.jpeg' OR
        name ILIKE '%.webp'
      )
  ) sub
)
WHERE id = '1da80d8d-667e-4b52-b2e9-5fbf4bc5ff8b';

-- 2. Vérification du résultat (nombre total de mèmes)
SELECT name, jsonb_array_length(memes) AS total_memes
FROM meme_packs
WHERE id = '1da80d8d-667e-4b52-b2e9-5fbf4bc5ff8b';
