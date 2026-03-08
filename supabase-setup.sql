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
