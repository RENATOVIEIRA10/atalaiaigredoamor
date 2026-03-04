
-- Add ministry service columns to members table
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS serve_ministerio boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ministerios text[] NULL,
  ADD COLUMN IF NOT EXISTS disponivel_para_servir boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS observacao_servico text NULL;
