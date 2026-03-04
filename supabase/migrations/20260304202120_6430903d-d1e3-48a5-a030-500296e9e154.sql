
-- Add seed_run_id and is_test_data to novas_vidas
ALTER TABLE public.novas_vidas
  ADD COLUMN IF NOT EXISTS seed_run_id uuid REFERENCES public.seed_runs(id),
  ADD COLUMN IF NOT EXISTS is_test_data boolean DEFAULT false;

-- Add seed_run_id and is_test_data to encaminhamentos_recomeco
ALTER TABLE public.encaminhamentos_recomeco
  ADD COLUMN IF NOT EXISTS seed_run_id uuid REFERENCES public.seed_runs(id),
  ADD COLUMN IF NOT EXISTS is_test_data boolean DEFAULT false;
