
-- Table to link authenticated users to their validated access codes
CREATE TABLE public.user_access_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  access_key_id uuid NOT NULL REFERENCES public.access_keys(id) ON DELETE CASCADE,
  scope_type text NOT NULL,
  scope_id uuid,
  rede_id uuid,
  label text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, access_key_id)
);

-- Enable RLS
ALTER TABLE public.user_access_links ENABLE ROW LEVEL SECURITY;

-- Users can only read their own links
CREATE POLICY "Users read own links"
  ON public.user_access_links
  FOR SELECT TO authenticated
  USING (auth.uid()::text = user_id::text);

-- Users can insert their own links
CREATE POLICY "Users insert own links"
  ON public.user_access_links
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own links
CREATE POLICY "Users update own links"
  ON public.user_access_links
  FOR UPDATE TO authenticated
  USING (auth.uid()::text = user_id::text);

-- Users can delete their own links
CREATE POLICY "Users delete own links"
  ON public.user_access_links
  FOR DELETE TO authenticated
  USING (auth.uid()::text = user_id::text);

-- Index for fast lookup
CREATE INDEX idx_user_access_links_user_id ON public.user_access_links(user_id);
