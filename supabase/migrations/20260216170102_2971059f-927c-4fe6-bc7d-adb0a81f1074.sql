
-- Create access_logs table for auditing
CREATE TABLE public.access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_key_id uuid REFERENCES public.access_keys(id) ON DELETE SET NULL,
  scope_type text NOT NULL,
  scope_id uuid,
  code_used text NOT NULL,
  ip_hint text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins should read logs, but anyone can insert (logging)
CREATE POLICY "Anyone can insert access logs"
  ON public.access_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Access logs viewable by everyone"
  ON public.access_logs FOR SELECT
  USING (true);
