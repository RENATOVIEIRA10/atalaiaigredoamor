
-- Add recurrence and automation columns to fin_contas_pagar
ALTER TABLE public.fin_contas_pagar 
  ADD COLUMN IF NOT EXISTS recorrencia text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS recorrencia_fim date DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS conta_origem_id uuid DEFAULT NULL REFERENCES public.fin_contas_pagar(id) ON DELETE SET NULL;

-- Add recurrence columns to fin_contas_receber
ALTER TABLE public.fin_contas_receber 
  ADD COLUMN IF NOT EXISTS recorrencia text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS recorrencia_fim date DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS conta_origem_id uuid DEFAULT NULL REFERENCES public.fin_contas_receber(id) ON DELETE SET NULL;

-- Add comment for recorrencia: 'mensal', 'semanal', 'quinzenal', 'bimestral', 'trimestral', 'semestral', 'anual'
COMMENT ON COLUMN public.fin_contas_pagar.recorrencia IS 'Tipo de recorrência: mensal, semanal, quinzenal, bimestral, trimestral, semestral, anual';
COMMENT ON COLUMN public.fin_contas_receber.recorrencia IS 'Tipo de recorrência: mensal, semanal, quinzenal, bimestral, trimestral, semestral, anual';
