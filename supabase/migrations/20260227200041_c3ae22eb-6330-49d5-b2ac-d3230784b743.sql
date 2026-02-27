-- 1) Admin bypass estrutural para todas as policies que dependem de has_any_active_scope
CREATE OR REPLACE FUNCTION public.has_any_active_scope(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    public.has_role(_user_id, 'admin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM public.user_access_links
      WHERE user_id = _user_id
        AND active = true
    )
$$;

-- 2) Garantir capacidades administrativas completas sobre user_access_links
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_access_links'
      AND policyname = 'Admins read all user_access_links'
  ) THEN
    CREATE POLICY "Admins read all user_access_links"
      ON public.user_access_links
      FOR SELECT
      USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_access_links'
      AND policyname = 'Admins insert user_access_links'
  ) THEN
    CREATE POLICY "Admins insert user_access_links"
      ON public.user_access_links
      FOR INSERT
      WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_access_links'
      AND policyname = 'Admins update user_access_links'
  ) THEN
    CREATE POLICY "Admins update user_access_links"
      ON public.user_access_links
      FOR UPDATE
      USING (public.has_role(auth.uid(), 'admin'::app_role))
      WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_access_links'
      AND policyname = 'Admins delete user_access_links'
  ) THEN
    CREATE POLICY "Admins delete user_access_links"
      ON public.user_access_links
      FOR DELETE
      USING (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END
$$;