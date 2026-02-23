
-- ============================================================
-- ETAPA 1: MULTI-REDE BASE
-- ============================================================

-- 1. Adicionar colunas faltantes na tabela redes
ALTER TABLE public.redes ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.redes ADD COLUMN IF NOT EXISTS ativa boolean NOT NULL DEFAULT true;
ALTER TABLE public.redes ADD COLUMN IF NOT EXISTS branding jsonb DEFAULT '{}'::jsonb;

-- Criar índice único no slug
CREATE UNIQUE INDEX IF NOT EXISTS redes_slug_unique ON public.redes(slug);

-- Atualizar a rede existente com slug
UPDATE public.redes SET slug = 'amor-a-dois' WHERE id = 'b0000000-0000-0000-0000-000000000001';

-- 2. Inserir 3 novas redes
INSERT INTO public.redes (id, name, slug, ativa, branding) VALUES
  ('b0000000-0000-0000-0000-000000000002', 'Impulse', 'impulse', true, '{}'::jsonb),
  ('b0000000-0000-0000-0000-000000000003', 'Acelere', 'acelere', true, '{}'::jsonb),
  ('b0000000-0000-0000-0000-000000000004', 'Up', 'up', true, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 3. Adicionar rede_id nas tabelas que ainda não têm

-- supervisores
ALTER TABLE public.supervisores ADD COLUMN IF NOT EXISTS rede_id uuid REFERENCES public.redes(id);

-- celulas
ALTER TABLE public.celulas ADD COLUMN IF NOT EXISTS rede_id uuid REFERENCES public.redes(id);

-- members
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS rede_id uuid REFERENCES public.redes(id);

-- weekly_reports
ALTER TABLE public.weekly_reports ADD COLUMN IF NOT EXISTS rede_id uuid REFERENCES public.redes(id);

-- supervisoes
ALTER TABLE public.supervisoes ADD COLUMN IF NOT EXISTS rede_id uuid REFERENCES public.redes(id);

-- multiplicacoes
ALTER TABLE public.multiplicacoes ADD COLUMN IF NOT EXISTS rede_id uuid REFERENCES public.redes(id);

-- access_keys
ALTER TABLE public.access_keys ADD COLUMN IF NOT EXISTS rede_id uuid REFERENCES public.redes(id);

-- 4. Migrar todos os registros existentes para Rede Amor a Dois
UPDATE public.supervisores SET rede_id = 'b0000000-0000-0000-0000-000000000001' WHERE rede_id IS NULL;
UPDATE public.celulas SET rede_id = 'b0000000-0000-0000-0000-000000000001' WHERE rede_id IS NULL;
UPDATE public.members SET rede_id = 'b0000000-0000-0000-0000-000000000001' WHERE rede_id IS NULL;
UPDATE public.weekly_reports SET rede_id = 'b0000000-0000-0000-0000-000000000001' WHERE rede_id IS NULL;
UPDATE public.supervisoes SET rede_id = 'b0000000-0000-0000-0000-000000000001' WHERE rede_id IS NULL;
UPDATE public.multiplicacoes SET rede_id = 'b0000000-0000-0000-0000-000000000001' WHERE rede_id IS NULL;
UPDATE public.access_keys SET rede_id = 'b0000000-0000-0000-0000-000000000001' WHERE rede_id IS NULL;

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_supervisores_rede_id ON public.supervisores(rede_id);
CREATE INDEX IF NOT EXISTS idx_celulas_rede_id ON public.celulas(rede_id);
CREATE INDEX IF NOT EXISTS idx_members_rede_id ON public.members(rede_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_rede_id ON public.weekly_reports(rede_id);
CREATE INDEX IF NOT EXISTS idx_supervisoes_rede_id ON public.supervisoes(rede_id);
CREATE INDEX IF NOT EXISTS idx_multiplicacoes_rede_id ON public.multiplicacoes(rede_id);
CREATE INDEX IF NOT EXISTS idx_access_keys_rede_id ON public.access_keys(rede_id);
