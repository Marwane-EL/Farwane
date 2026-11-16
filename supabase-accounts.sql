-- ==============================================================================
-- FarWane — Système de Comptes, Mèmes Favoris ⭐, Bangers 🔥 (Hall of Fame) & Stats
-- À exécuter dans Supabase : Dashboard > SQL Editor > New Query
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pseudo TEXT NOT NULL DEFAULT '',
  avatar TEXT NOT NULL DEFAULT '🎮',
  favorite_memes JSONB NOT NULL DEFAULT '[]'::jsonb,
  saved_bangers JSONB NOT NULL DEFAULT '[]'::jsonb,
  niches JSONB NOT NULL DEFAULT '[]'::jsonb,
  libraries JSONB NOT NULL DEFAULT '[]'::jsonb,
  stats JSONB NOT NULL DEFAULT '{"gamesPlayed":0,"wins":0,"totalPoints":0,"heartsReceived":0}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
CREATE POLICY "Users can read own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);
