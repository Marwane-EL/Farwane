-- ============================================
-- Farwane - Initial Schema Migration
-- ============================================

-- 1. Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  code TEXT PRIMARY KEY,
  host_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read rooms" ON rooms;
CREATE POLICY "Anyone can read rooms" ON rooms FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can create rooms" ON rooms;
CREATE POLICY "Anyone can create rooms" ON rooms FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update rooms" ON rooms;
CREATE POLICY "Anyone can update rooms" ON rooms FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Anyone can delete rooms" ON rooms;
CREATE POLICY "Anyone can delete rooms" ON rooms FOR DELETE USING (true);

-- 2. Create meme_packs table
CREATE TABLE IF NOT EXISTS meme_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  memes JSONB NOT NULL DEFAULT '[]',
  is_default BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE meme_packs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read meme_packs" ON meme_packs;
CREATE POLICY "Anyone can read meme_packs" ON meme_packs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert meme_packs" ON meme_packs;
CREATE POLICY "Anyone can insert meme_packs" ON meme_packs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update meme_packs" ON meme_packs;
CREATE POLICY "Anyone can update meme_packs" ON meme_packs FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Anyone can delete meme_packs" ON meme_packs;
CREATE POLICY "Anyone can delete meme_packs" ON meme_packs FOR DELETE USING (true);

-- 3. Enable Realtime on rooms table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
  END IF;
END $$;
