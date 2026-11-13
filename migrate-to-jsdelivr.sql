-- ==============================================================================
-- Migration Supabase Storage -> GitHub + jsDelivr CDN (0€ Egress / Illimité)
-- À exécuter dans Supabase : Dashboard > SQL Editor > New Query
-- ==============================================================================

UPDATE meme_packs
SET memes = (
  SELECT jsonb_agg(
    regexp_replace(
      elem,
      '^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/medias-farwane/',
      'https://cdn.jsdelivr.net/gh/Marwane-EL/farwane-medias@main/'
    )
  )
  FROM jsonb_array_elements_text(memes) AS elem
)
WHERE memes::text LIKE '%supabase.co/storage/v1/object/public/medias-farwane/%';

-- Vérification des nouvelles URLs
SELECT id, name, jsonb_array_length(memes) AS total_memes, memes->0 AS sample_url
FROM meme_packs;
