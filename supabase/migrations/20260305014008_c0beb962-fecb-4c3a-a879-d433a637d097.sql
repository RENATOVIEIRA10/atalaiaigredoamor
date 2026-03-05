
CREATE TABLE public.user_onboarding_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  scope_type text NOT NULL,
  visits_count integer NOT NULL DEFAULT 0,
  dismissed boolean NOT NULL DEFAULT false,
  completed_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, scope_type)
);

ALTER TABLE public.user_onboarding_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own onboarding" ON public.user_onboarding_state
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own onboarding" ON public.user_onboarding_state
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own onboarding" ON public.user_onboarding_state
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read all onboarding" ON public.user_onboarding_state
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
