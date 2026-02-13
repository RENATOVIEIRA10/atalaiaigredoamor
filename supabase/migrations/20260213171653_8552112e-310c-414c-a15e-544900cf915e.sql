
-- Create access_keys table
CREATE TABLE public.access_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type text NOT NULL CHECK (scope_type IN ('celula', 'supervisor', 'coordenacao', 'rede', 'admin')),
  scope_id uuid,
  code text UNIQUE NOT NULL,
  active boolean DEFAULT true,
  expires_at timestamptz,
  last_used_at timestamptz,
  failed_attempts integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.access_keys ENABLE ROW LEVEL SECURITY;

-- Public read for code validation
CREATE POLICY "Access keys are viewable by everyone"
ON public.access_keys
FOR SELECT
USING (true);

-- Public manage
CREATE POLICY "Anyone can manage access keys"
ON public.access_keys
FOR ALL
USING (true)
WITH CHECK (true);

-- Create unique constraint for scope_type + scope_id (except admin which has null scope_id)
CREATE UNIQUE INDEX idx_access_keys_scope ON public.access_keys (scope_type, scope_id) WHERE scope_id IS NOT NULL AND active = true;

-- Seed admin fixed code
INSERT INTO public.access_keys (scope_type, scope_id, code, active)
VALUES ('admin', NULL, 'amora2026', true);
