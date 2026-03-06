DROP POLICY "Authenticated users can insert recommendations" ON public.leadership_recommendations;
DROP POLICY "Authenticated users can update recommendations" ON public.leadership_recommendations;

CREATE POLICY "Users can insert own recommendations"
  ON public.leadership_recommendations FOR INSERT TO authenticated
  WITH CHECK (requested_by_user_id = auth.uid());

CREATE POLICY "Users can update recommendations they review"
  ON public.leadership_recommendations FOR UPDATE TO authenticated
  USING (requested_by_user_id = auth.uid() OR reviewer_user_id = auth.uid())
  WITH CHECK (requested_by_user_id = auth.uid() OR reviewer_user_id = auth.uid());