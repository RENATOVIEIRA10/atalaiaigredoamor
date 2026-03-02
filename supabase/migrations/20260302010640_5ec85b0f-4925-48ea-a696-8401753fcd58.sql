
-- Allow users with any active scope (cell leaders, coordinators, etc.) to insert profiles
-- This is needed for the "Convert Nova Vida to Member" flow
CREATE POLICY "Scoped users insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (has_any_active_scope(auth.uid()));
