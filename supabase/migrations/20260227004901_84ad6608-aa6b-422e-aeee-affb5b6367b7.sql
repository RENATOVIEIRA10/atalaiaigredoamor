
-- New columns on novas_vidas for richer matching
ALTER TABLE public.novas_vidas
  ADD COLUMN IF NOT EXISTS idade integer,
  ADD COLUMN IF NOT EXISTS tem_filhos boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS rua text,
  ADD COLUMN IF NOT EXISTS dias_disponiveis text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS horario_preferido text,
  ADD COLUMN IF NOT EXISTS primeira_vez_igreja boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ja_participou_celula boolean DEFAULT false;

-- New columns on celulas for matching criteria
ALTER TABLE public.celulas
  ADD COLUMN IF NOT EXISTS tipo_celula text,
  ADD COLUMN IF NOT EXISTS faixa_etaria_predominante text,
  ADD COLUMN IF NOT EXISTS bairros_atendidos text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS perfil_ambiente text;
