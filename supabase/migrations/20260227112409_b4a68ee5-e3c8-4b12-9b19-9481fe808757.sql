
-- ══════════════════════════════════════════════════════════
-- MÓDULO: Discipulado Anual
-- ══════════════════════════════════════════════════════════

-- 1. Encontros de discipulado (coletivos por célula)
CREATE TABLE public.discipulado_encontros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  celula_id UUID NOT NULL REFERENCES public.celulas(id) ON DELETE CASCADE,
  rede_id UUID REFERENCES public.redes(id),
  data_encontro DATE NOT NULL,
  realizado BOOLEAN NOT NULL DEFAULT true,
  observacao TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Presenças por encontro
CREATE TABLE public.discipulado_presencas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  encontro_id UUID NOT NULL REFERENCES public.discipulado_encontros(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  presente BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(encontro_id, member_id)
);

-- 3. Índices
CREATE INDEX idx_disc_encontros_celula ON public.discipulado_encontros(celula_id);
CREATE INDEX idx_disc_encontros_rede ON public.discipulado_encontros(rede_id);
CREATE INDEX idx_disc_encontros_data ON public.discipulado_encontros(data_encontro);
CREATE INDEX idx_disc_presencas_encontro ON public.discipulado_presencas(encontro_id);
CREATE INDEX idx_disc_presencas_member ON public.discipulado_presencas(member_id);

-- 4. RLS — discipulado_encontros
ALTER TABLE public.discipulado_encontros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read discipulado_encontros"
  ON public.discipulado_encontros FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated write discipulado_encontros"
  ON public.discipulado_encontros FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated update discipulado_encontros"
  ON public.discipulado_encontros FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated delete discipulado_encontros"
  ON public.discipulado_encontros FOR DELETE
  TO authenticated USING (auth.uid() IS NOT NULL);

-- 5. RLS — discipulado_presencas
ALTER TABLE public.discipulado_presencas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read discipulado_presencas"
  ON public.discipulado_presencas FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated write discipulado_presencas"
  ON public.discipulado_presencas FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated update discipulado_presencas"
  ON public.discipulado_presencas FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated delete discipulado_presencas"
  ON public.discipulado_presencas FOR DELETE
  TO authenticated USING (auth.uid() IS NOT NULL);

-- 6. Trigger updated_at
CREATE TRIGGER update_discipulado_encontros_updated_at
  BEFORE UPDATE ON public.discipulado_encontros
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
