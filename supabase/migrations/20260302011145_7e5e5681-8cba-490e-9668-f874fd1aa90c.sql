
-- Allow users with any active scope to manage events_spiritual (not just admins)
-- This enables "Líder de Batismo/Aclamação" and "Central Batismo" roles to create/update/delete events

CREATE POLICY "Scoped users insert events_spiritual"
ON public.events_spiritual
FOR INSERT
WITH CHECK (has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped users update events_spiritual"
ON public.events_spiritual
FOR UPDATE
USING (has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped users delete events_spiritual"
ON public.events_spiritual
FOR DELETE
USING (has_any_active_scope(auth.uid()));
