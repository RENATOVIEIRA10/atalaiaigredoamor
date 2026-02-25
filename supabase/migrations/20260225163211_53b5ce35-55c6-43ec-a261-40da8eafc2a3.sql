
-- 1. Add audit/workflow columns to novas_vidas
ALTER TABLE public.novas_vidas
ADD COLUMN IF NOT EXISTS created_by_user_id uuid NULL,
ADD COLUMN IF NOT EXISTS assigned_to_user_id uuid NULL,
ADD COLUMN IF NOT EXISTS assigned_cell_id uuid NULL REFERENCES public.celulas(id);

-- 2. Create audit events table
CREATE TABLE public.novas_vidas_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vida_id uuid NOT NULL REFERENCES public.novas_vidas(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_user_id uuid NOT NULL,
  payload jsonb NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.novas_vidas_events ENABLE ROW LEVEL SECURITY;

-- Events: all authenticated can read, only authenticated can insert
CREATE POLICY "Authenticated read novas_vidas_events"
  ON public.novas_vidas_events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated insert novas_vidas_events"
  ON public.novas_vidas_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Create helper function to check if user has a specific access scope
CREATE OR REPLACE FUNCTION public.has_access_scope(_user_id uuid, _scope_type text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_access_links
    WHERE user_id = _user_id
      AND scope_type = _scope_type
      AND active = true
  )
$$;
