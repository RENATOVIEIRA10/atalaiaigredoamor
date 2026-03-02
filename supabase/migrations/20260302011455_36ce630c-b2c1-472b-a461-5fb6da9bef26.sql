
-- Allow scoped users to UPDATE profiles (e.g., cell leaders editing member birth_date, name, etc.)
CREATE POLICY "Scoped users update profiles"
ON public.profiles
FOR UPDATE
USING (has_any_active_scope(auth.uid()));
