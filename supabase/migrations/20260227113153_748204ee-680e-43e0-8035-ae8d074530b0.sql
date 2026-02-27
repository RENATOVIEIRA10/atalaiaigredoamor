
-- Add hierarchical level support to discipulado_encontros
ALTER TABLE public.discipulado_encontros
  ALTER COLUMN celula_id DROP NOT NULL,
  ADD COLUMN nivel TEXT NOT NULL DEFAULT 'celula',
  ADD COLUMN coordenacao_id UUID REFERENCES public.coordenacoes(id) ON DELETE CASCADE;

-- Add profile_id to presencas for leader/coordinator tracking
ALTER TABLE public.discipulado_presencas
  ALTER COLUMN member_id DROP NOT NULL,
  ADD COLUMN profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Index for new columns
CREATE INDEX idx_discipulado_encontros_nivel ON public.discipulado_encontros(nivel);
CREATE INDEX idx_discipulado_encontros_coordenacao ON public.discipulado_encontros(coordenacao_id);
CREATE INDEX idx_discipulado_presencas_profile ON public.discipulado_presencas(profile_id);

-- Add constraint: either member_id or profile_id must be set
ALTER TABLE public.discipulado_presencas
  ADD CONSTRAINT chk_presenca_target CHECK (member_id IS NOT NULL OR profile_id IS NOT NULL);
