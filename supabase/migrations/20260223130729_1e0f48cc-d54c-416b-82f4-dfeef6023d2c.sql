
-- Table: roteiros_celula
CREATE TABLE public.roteiros_celula (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  celula_id uuid NOT NULL REFERENCES public.celulas(id) ON DELETE CASCADE,
  rede_id uuid REFERENCES public.redes(id),
  semana_inicio date NOT NULL,
  data_reuniao date NOT NULL,
  criado_por uuid REFERENCES public.profiles(id),
  status text NOT NULL DEFAULT 'rascunho',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(celula_id, semana_inicio)
);

ALTER TABLE public.roteiros_celula ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Roteiros viewable by everyone" ON public.roteiros_celula FOR SELECT USING (true);
CREATE POLICY "Anyone can manage roteiros" ON public.roteiros_celula FOR ALL USING (true) WITH CHECK (true);

-- Table: roteiro_itens
CREATE TABLE public.roteiro_itens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  roteiro_id uuid NOT NULL REFERENCES public.roteiros_celula(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  responsavel_nome text,
  responsavel_membro_id uuid REFERENCES public.members(id),
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.roteiro_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Roteiro itens viewable by everyone" ON public.roteiro_itens FOR SELECT USING (true);
CREATE POLICY "Anyone can manage roteiro itens" ON public.roteiro_itens FOR ALL USING (true) WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_roteiros_celula_semana ON public.roteiros_celula(celula_id, semana_inicio);

-- Trigger for updated_at
CREATE TRIGGER update_roteiros_celula_updated_at
  BEFORE UPDATE ON public.roteiros_celula
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
