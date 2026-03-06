CREATE TABLE public.leadership_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campo_id uuid NOT NULL REFERENCES public.campos(id),
  rede_id uuid NOT NULL REFERENCES public.redes(id),
  recommendation_type text NOT NULL,
  recommended_profile_id uuid REFERENCES public.profiles(id),
  recommended_member_id uuid REFERENCES public.members(id),
  recommended_celula_id uuid REFERENCES public.celulas(id),
  recommended_current_role text NOT NULL DEFAULT 'lider_celula',
  requested_by_user_id uuid NOT NULL,
  requested_by_profile_id uuid REFERENCES public.profiles(id),
  requested_by_scope_type text NOT NULL DEFAULT 'unknown',
  target_reviewer_scope_type text NOT NULL DEFAULT 'rede',
  justification_text text NOT NULL DEFAULT '',
  highlights_json jsonb NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewer_user_id uuid NULL,
  reviewer_notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leadership_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read recommendations"
  ON public.leadership_recommendations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert recommendations"
  ON public.leadership_recommendations FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update recommendations"
  ON public.leadership_recommendations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);