CREATE TABLE IF NOT EXISTS public.leadership_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campo_id uuid NOT NULL REFERENCES public.campos(id) ON DELETE RESTRICT,
  rede_id uuid NULL REFERENCES public.redes(id) ON DELETE SET NULL,
  recommendation_type text NOT NULL CHECK (recommendation_type IN ('supervisor', 'coordenador')),
  recommended_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  recommended_member_id uuid NULL REFERENCES public.members(id) ON DELETE SET NULL,
  recommended_celula_id uuid NULL REFERENCES public.celulas(id) ON DELETE SET NULL,
  recommended_current_role text NULL,
  requested_by_user_id uuid NOT NULL,
  requested_by_profile_id uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  requested_by_scope_type text NOT NULL,
  target_reviewer_scope_type text NOT NULL,
  justification_text text NOT NULL,
  highlights_json jsonb NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'declined', 'archived')),
  reviewer_user_id uuid NULL,
  reviewer_notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT leadership_recommendations_target_scope_check CHECK (
    (recommendation_type = 'supervisor' AND target_reviewer_scope_type = 'rede') OR
    (recommendation_type = 'coordenador' AND target_reviewer_scope_type = 'pastor_campo')
  )
);

CREATE INDEX IF NOT EXISTS idx_leadership_recommendations_campo ON public.leadership_recommendations(campo_id);
CREATE INDEX IF NOT EXISTS idx_leadership_recommendations_rede ON public.leadership_recommendations(rede_id);
CREATE INDEX IF NOT EXISTS idx_leadership_recommendations_status ON public.leadership_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_leadership_recommendations_reviewer_scope ON public.leadership_recommendations(target_reviewer_scope_type);

CREATE OR REPLACE FUNCTION public.set_leadership_recommendations_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_leadership_recommendations_updated_at ON public.leadership_recommendations;
CREATE TRIGGER trg_leadership_recommendations_updated_at
BEFORE UPDATE ON public.leadership_recommendations
FOR EACH ROW
EXECUTE FUNCTION public.set_leadership_recommendations_updated_at();

ALTER TABLE public.leadership_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read leadership recommendations by active scope"
ON public.leadership_recommendations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_access_links ual
    WHERE ual.user_id = auth.uid()
      AND ual.active = true
      AND ual.campo_id = leadership_recommendations.campo_id
      AND (leadership_recommendations.rede_id IS NULL OR ual.rede_id = leadership_recommendations.rede_id OR ual.scope_type IN ('pastor', 'pastor_de_campo', 'pastor_senior_global', 'admin'))
  )
);

CREATE POLICY "Create own leadership recommendations"
ON public.leadership_recommendations
FOR INSERT
TO authenticated
WITH CHECK (
  requested_by_user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.user_access_links ual
    WHERE ual.user_id = auth.uid()
      AND ual.active = true
      AND ual.campo_id = leadership_recommendations.campo_id
      AND (leadership_recommendations.rede_id IS NULL OR ual.rede_id = leadership_recommendations.rede_id OR ual.scope_type IN ('pastor', 'pastor_de_campo', 'pastor_senior_global', 'admin'))
  )
);

CREATE POLICY "Update leadership recommendations by active scope"
ON public.leadership_recommendations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_access_links ual
    WHERE ual.user_id = auth.uid()
      AND ual.active = true
      AND ual.campo_id = leadership_recommendations.campo_id
      AND (leadership_recommendations.rede_id IS NULL OR ual.rede_id = leadership_recommendations.rede_id OR ual.scope_type IN ('pastor', 'pastor_de_campo', 'pastor_senior_global', 'admin'))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_access_links ual
    WHERE ual.user_id = auth.uid()
      AND ual.active = true
      AND ual.campo_id = leadership_recommendations.campo_id
      AND (leadership_recommendations.rede_id IS NULL OR ual.rede_id = leadership_recommendations.rede_id OR ual.scope_type IN ('pastor', 'pastor_de_campo', 'pastor_senior_global', 'admin'))
  )
);
