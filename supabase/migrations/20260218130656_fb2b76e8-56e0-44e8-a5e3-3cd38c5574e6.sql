
-- Create seed_runs table
CREATE TABLE public.seed_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  environment text NOT NULL DEFAULT 'dev' CHECK (environment IN ('dev', 'prod')),
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'done', 'failed')),
  totals jsonb DEFAULT '{}',
  notes text,
  cleaned_at timestamptz,
  cleaned_by uuid REFERENCES public.profiles(id)
);

ALTER TABLE public.seed_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Seed runs viewable by everyone" ON public.seed_runs FOR SELECT USING (true);
CREATE POLICY "Anyone can manage seed runs" ON public.seed_runs FOR ALL USING (true) WITH CHECK (true);

-- Add is_test_data and seed_run_id to members
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS is_test_data boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS seed_run_id uuid REFERENCES public.seed_runs(id);

-- Add is_test_data and seed_run_id to weekly_reports
ALTER TABLE public.weekly_reports
  ADD COLUMN IF NOT EXISTS is_test_data boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS seed_run_id uuid REFERENCES public.seed_runs(id);

-- Add is_test_data and seed_run_id to supervisoes
ALTER TABLE public.supervisoes
  ADD COLUMN IF NOT EXISTS is_test_data boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS seed_run_id uuid REFERENCES public.seed_runs(id);

-- Add is_test_data and seed_run_id to multiplicacoes
ALTER TABLE public.multiplicacoes
  ADD COLUMN IF NOT EXISTS is_test_data boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS seed_run_id uuid REFERENCES public.seed_runs(id);

-- Add is_test_data and seed_run_id to celulas
ALTER TABLE public.celulas
  ADD COLUMN IF NOT EXISTS is_test_data boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS seed_run_id uuid REFERENCES public.seed_runs(id);

-- Add is_test_data and seed_run_id to profiles (for synthetic members)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_test_data boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS seed_run_id uuid REFERENCES public.seed_runs(id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_members_test_data ON public.members(is_test_data);
CREATE INDEX IF NOT EXISTS idx_members_seed_run ON public.members(seed_run_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_test_data ON public.weekly_reports(is_test_data);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_seed_run ON public.weekly_reports(seed_run_id);
CREATE INDEX IF NOT EXISTS idx_supervisoes_test_data ON public.supervisoes(is_test_data);
CREATE INDEX IF NOT EXISTS idx_multiplicacoes_test_data ON public.multiplicacoes(is_test_data);
CREATE INDEX IF NOT EXISTS idx_celulas_test_data ON public.celulas(is_test_data);
CREATE INDEX IF NOT EXISTS idx_profiles_test_data ON public.profiles(is_test_data);
