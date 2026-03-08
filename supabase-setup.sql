-- ============================================
-- MemeClash - Supabase Setup
-- Execute this in Supabase SQL Editor
-- Dashboard > SQL Editor > New Query
-- ============================================

-- 1. Create the rooms table
CREATE TABLE IF NOT EXISTS rooms (
  code TEXT PRIMARY KEY,
  host_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- 3. Policies: Allow all operations (dev mode)
CREATE POLICY "Anyone can read rooms" ON rooms
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create rooms" ON rooms
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update rooms" ON rooms
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete rooms" ON rooms
  FOR DELETE USING (true);

-- 4. Auto-cleanup: delete rooms older than 24 hours (optional cron)
-- You can set up a Supabase Edge Function or pg_cron for this later.

-- ============================================
-- 5. Meme Packs table (admin-managed)
-- ============================================

CREATE TABLE IF NOT EXISTS meme_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  memes JSONB NOT NULL DEFAULT '[]',
  is_default BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE meme_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read meme_packs" ON meme_packs
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert meme_packs" ON meme_packs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update meme_packs" ON meme_packs
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete meme_packs" ON meme_packs
  FOR DELETE USING (true);

-- ============================================
-- 6. Seed: Insert default meme packs
-- ============================================

INSERT INTO meme_packs (name, memes, is_default) VALUES
(
  'Memes par défaut',
  '["https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif","https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif","https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif","https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif","https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif"]',
  true
),
(
  'Pack Reaction GIFs',
  '["https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif","https://media.giphy.com/media/LRVnPYqM8DLag/giphy.gif","https://media.giphy.com/media/3o7TKTDn976rzVgky4/giphy.gif","https://media.giphy.com/media/l0HlvtIPzPdt2usKs/giphy.gif"]',
  true
);
