-- Add config column to seed_runs for storing simulation parameters
ALTER TABLE public.seed_runs 
ADD COLUMN IF NOT EXISTS config jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.seed_runs.config IS 'Stores configurable simulation parameters: campos, redes, modules, advanced params';