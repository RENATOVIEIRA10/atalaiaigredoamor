
-- Create policy_acceptances table for onboarding versioning
CREATE TABLE public.policy_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_key_id uuid NOT NULL REFERENCES public.access_keys(id) ON DELETE CASCADE,
  policy_version text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(access_key_id, policy_version)
);

-- Enable RLS
ALTER TABLE public.policy_acceptances ENABLE ROW LEVEL SECURITY;

-- Keep consistent with existing open policies
CREATE POLICY "Policy acceptances viewable by everyone"
  ON public.policy_acceptances FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert policy acceptances"
  ON public.policy_acceptances FOR INSERT
  WITH CHECK (true);
