
-- =============================================
-- MÓDULO RECOMEÇO — NOVAS VIDAS (CROSS-REDE)
-- =============================================

-- 1. Tabela novas_vidas (global, não pertence a nenhuma rede)
CREATE TABLE public.novas_vidas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  whatsapp TEXT,
  bairro TEXT,
  cidade TEXT,
  estado_civil TEXT,
  faixa_etaria TEXT,
  observacao TEXT,
  status TEXT NOT NULL DEFAULT 'nova',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Tabela encaminhamentos_recomeco
CREATE TABLE public.encaminhamentos_recomeco (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nova_vida_id UUID NOT NULL REFERENCES public.novas_vidas(id) ON DELETE CASCADE,
  celula_id UUID NOT NULL REFERENCES public.celulas(id) ON DELETE CASCADE,
  rede_id UUID REFERENCES public.redes(id),
  status TEXT NOT NULL DEFAULT 'pendente',
  data_encaminhamento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  encaminhado_por TEXT,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Indexes
CREATE INDEX idx_novas_vidas_status ON public.novas_vidas(status);
CREATE INDEX idx_encaminhamentos_nova_vida ON public.encaminhamentos_recomeco(nova_vida_id);
CREATE INDEX idx_encaminhamentos_celula ON public.encaminhamentos_recomeco(celula_id);
CREATE INDEX idx_encaminhamentos_rede ON public.encaminhamentos_recomeco(rede_id);

-- 4. Enable RLS
ALTER TABLE public.novas_vidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encaminhamentos_recomeco ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for novas_vidas (viewable by all authenticated, manageable by all for now)
CREATE POLICY "Novas vidas viewable by everyone"
  ON public.novas_vidas FOR SELECT
  USING (true);

CREATE POLICY "Anyone can manage novas vidas"
  ON public.novas_vidas FOR ALL
  USING (true)
  WITH CHECK (true);

-- 6. RLS Policies for encaminhamentos_recomeco
CREATE POLICY "Encaminhamentos viewable by everyone"
  ON public.encaminhamentos_recomeco FOR SELECT
  USING (true);

CREATE POLICY "Anyone can manage encaminhamentos"
  ON public.encaminhamentos_recomeco FOR ALL
  USING (true)
  WITH CHECK (true);

-- 7. Updated_at triggers
CREATE TRIGGER update_novas_vidas_updated_at
  BEFORE UPDATE ON public.novas_vidas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_encaminhamentos_updated_at
  BEFORE UPDATE ON public.encaminhamentos_recomeco
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
