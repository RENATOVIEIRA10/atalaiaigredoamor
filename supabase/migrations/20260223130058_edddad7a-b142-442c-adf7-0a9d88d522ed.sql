
-- Add audit columns to encaminhamentos_recomeco for funnel tracking
ALTER TABLE public.encaminhamentos_recomeco 
  ADD COLUMN IF NOT EXISTS contatado_at timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS integrado_at timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS promovido_membro_at timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS membro_id uuid DEFAULT NULL;

-- Add index for performance on funnel queries
CREATE INDEX IF NOT EXISTS idx_encaminhamentos_celula_status ON public.encaminhamentos_recomeco(celula_id, status);
CREATE INDEX IF NOT EXISTS idx_encaminhamentos_rede_status ON public.encaminhamentos_recomeco(rede_id, status);
