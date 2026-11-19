-- ==============================================================================
-- FarWane — Système d'Amis & Invitations Directes
-- À exécuter dans Supabase : Dashboard > SQL Editor > New Query
-- ==============================================================================

-- 1. Autoriser les joueurs connectés à rechercher un profil par pseudo
DROP POLICY IF EXISTS "Authenticated users can search profiles" ON public.user_profiles;
CREATE POLICY "Authenticated users can search profiles"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (true);

-- 2. Table des relations d'amitié
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (requester_id, addressee_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own friendships" ON public.friendships;
CREATE POLICY "Users can view their own friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

DROP POLICY IF EXISTS "Users can send friend requests" ON public.friendships;
CREATE POLICY "Users can send friend requests"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id AND requester_id <> addressee_id);

DROP POLICY IF EXISTS "Users can accept or update their friendships" ON public.friendships;
CREATE POLICY "Users can accept or update their friendships"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = addressee_id OR auth.uid() = requester_id);

DROP POLICY IF EXISTS "Users can delete their friendships" ON public.friendships;
CREATE POLICY "Users can delete their friendships"
  ON public.friendships FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
