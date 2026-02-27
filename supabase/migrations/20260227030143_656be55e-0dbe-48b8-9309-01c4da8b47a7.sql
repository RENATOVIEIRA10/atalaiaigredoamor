
-- Add aceita_novas_vidas to celulas
ALTER TABLE public.celulas ADD COLUMN IF NOT EXISTS aceita_novas_vidas boolean DEFAULT true;

-- Remove perfil_ambiente (no longer needed)
-- We keep the column for now but won't use it in the match engine
