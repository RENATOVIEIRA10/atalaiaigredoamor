
-- Add test data tracking to hierarchy tables for CD1 multi-rede support
ALTER TABLE public.redes ADD COLUMN IF NOT EXISTS is_test_data boolean DEFAULT false;
ALTER TABLE public.redes ADD COLUMN IF NOT EXISTS seed_run_id uuid REFERENCES public.seed_runs(id);

ALTER TABLE public.coordenacoes ADD COLUMN IF NOT EXISTS is_test_data boolean DEFAULT false;
ALTER TABLE public.coordenacoes ADD COLUMN IF NOT EXISTS seed_run_id uuid REFERENCES public.seed_runs(id);

ALTER TABLE public.supervisores ADD COLUMN IF NOT EXISTS is_test_data boolean DEFAULT false;
ALTER TABLE public.supervisores ADD COLUMN IF NOT EXISTS seed_run_id uuid REFERENCES public.seed_runs(id);

-- Add rede_id to members if not exists (already has it per schema)
-- Add bairros extras to support new redes
-- Add indexes for seed_run_id lookups
CREATE INDEX IF NOT EXISTS idx_redes_seed_run_id ON public.redes(seed_run_id) WHERE seed_run_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_coordenacoes_seed_run_id ON public.coordenacoes(seed_run_id) WHERE seed_run_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_supervisores_seed_run_id ON public.supervisores(seed_run_id) WHERE seed_run_id IS NOT NULL;
