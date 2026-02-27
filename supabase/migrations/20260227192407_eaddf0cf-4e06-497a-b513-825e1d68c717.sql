
-- Tabela para armazenar função + escopo no perfil do casal/pessoa
-- Fonte de verdade para "quem exerce qual função"
CREATE TABLE public.leadership_functions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leadership_couple_id uuid REFERENCES public.leadership_couples(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  function_type text NOT NULL,
  scope_entity_id uuid,
  scope_entity_type text,
  campo_id uuid REFERENCES public.campos(id),
  rede_id uuid REFERENCES public.redes(id),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT at_least_one_person CHECK (leadership_couple_id IS NOT NULL OR profile_id IS NOT NULL)
);

-- Índices
CREATE INDEX idx_lf_couple ON public.leadership_functions(leadership_couple_id) WHERE active = true;
CREATE INDEX idx_lf_profile ON public.leadership_functions(profile_id) WHERE active = true;
CREATE INDEX idx_lf_function_type ON public.leadership_functions(function_type);

-- RLS
ALTER TABLE public.leadership_functions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read leadership_functions"
  ON public.leadership_functions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins insert leadership_functions"
  ON public.leadership_functions FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update leadership_functions"
  ON public.leadership_functions FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete leadership_functions"
  ON public.leadership_functions FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger updated_at
CREATE TRIGGER update_leadership_functions_updated_at
  BEFORE UPDATE ON public.leadership_functions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed: popular leadership_functions a partir dos vínculos estruturais existentes
-- Redes
INSERT INTO public.leadership_functions (leadership_couple_id, function_type, scope_entity_id, scope_entity_type, campo_id, rede_id)
SELECT r.leadership_couple_id, 'rede_leader', r.id, 'rede', r.campo_id, r.id
FROM public.redes r
WHERE r.leadership_couple_id IS NOT NULL;

-- Coordenações
INSERT INTO public.leadership_functions (leadership_couple_id, function_type, scope_entity_id, scope_entity_type, campo_id, rede_id)
SELECT c.leadership_couple_id, 'coordenador', c.id, 'coordenacao', c.campo_id, c.rede_id
FROM public.coordenacoes c
WHERE c.leadership_couple_id IS NOT NULL;

-- Supervisores
INSERT INTO public.leadership_functions (leadership_couple_id, function_type, scope_entity_id, scope_entity_type, campo_id)
SELECT s.leadership_couple_id, 'supervisor', s.id, 'supervisor', 
  (SELECT co.campo_id FROM public.coordenacoes co WHERE co.id = s.coordenacao_id)
FROM public.supervisores s
WHERE s.leadership_couple_id IS NOT NULL;

-- Células
INSERT INTO public.leadership_functions (leadership_couple_id, function_type, scope_entity_id, scope_entity_type, campo_id, rede_id)
SELECT c.leadership_couple_id, 'celula_leader', c.id, 'celula', c.campo_id, c.rede_id
FROM public.celulas c
WHERE c.leadership_couple_id IS NOT NULL;

-- Campo pastores
INSERT INTO public.leadership_functions (profile_id, function_type, scope_entity_id, scope_entity_type, campo_id)
SELECT cp.profile_id, cp.tipo, cp.campo_id, 'campo', cp.campo_id
FROM public.campo_pastores cp;
