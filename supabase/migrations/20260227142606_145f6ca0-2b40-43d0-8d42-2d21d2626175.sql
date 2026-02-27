
-- =============================================
-- MULTI-CAMPUS: Nova camada organizacional
-- =============================================

-- 1) Criar tabela campos
CREATE TABLE public.campos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text UNIQUE NOT NULL,
  cidade text,
  estado text,
  pais text DEFAULT 'Brasil',
  endereco text,
  horarios_culto text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.campos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read campos" ON public.campos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert campos" ON public.campos FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update campos" ON public.campos FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete campos" ON public.campos FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Trigger updated_at
CREATE TRIGGER update_campos_updated_at BEFORE UPDATE ON public.campos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Inserir os 10 campos reais
INSERT INTO public.campos (nome, cidade, estado, pais, endereco, horarios_culto) VALUES
  ('Paulista (Sede)', 'Paulista', 'PE', 'Brasil', 'PE-22, 777 – Paulista, PE', NULL),
  ('Zona Norte – Recife', 'Recife', 'PE', 'Brasil', 'Av. Norte Miguel Arraes de Alencar, 4994 – Tamarineira', NULL),
  ('Abreu e Lima', 'Abreu e Lima', 'PE', 'Brasil', NULL, '17h e 19h30'),
  ('Camaragibe', 'Camaragibe', 'PE', 'Brasil', NULL, '10h, 17h e 19h30'),
  ('Cabo de Santo Agostinho', 'Cabo de Santo Agostinho', 'PE', 'Brasil', NULL, '17h e 19h30'),
  ('Uberlândia', 'Uberlândia', 'MG', 'Brasil', NULL, NULL),
  ('Mogi Mirim', 'Mogi Mirim', 'SP', 'Brasil', NULL, NULL),
  ('São Luís', 'São Luís', 'MA', 'Brasil', NULL, NULL),
  ('Orlando', 'Orlando', 'FL', 'EUA', NULL, NULL),
  ('Maryland', 'Maryland', 'MD', 'EUA', NULL, NULL);

-- 3) Adicionar campo_id (nullable inicialmente) nas tabelas existentes
ALTER TABLE public.redes ADD COLUMN campo_id uuid REFERENCES public.campos(id);
ALTER TABLE public.coordenacoes ADD COLUMN campo_id uuid REFERENCES public.campos(id);
ALTER TABLE public.celulas ADD COLUMN campo_id uuid REFERENCES public.campos(id);
ALTER TABLE public.supervisores ADD COLUMN campo_id uuid REFERENCES public.campos(id);
ALTER TABLE public.members ADD COLUMN campo_id uuid REFERENCES public.campos(id);
ALTER TABLE public.weekly_reports ADD COLUMN campo_id uuid REFERENCES public.campos(id);
ALTER TABLE public.novas_vidas ADD COLUMN campo_id uuid REFERENCES public.campos(id);
ALTER TABLE public.encaminhamentos_recomeco ADD COLUMN campo_id uuid REFERENCES public.campos(id);
ALTER TABLE public.event_registrations ADD COLUMN campo_id uuid REFERENCES public.campos(id);
ALTER TABLE public.discipulado_encontros ADD COLUMN campo_id uuid REFERENCES public.campos(id);
ALTER TABLE public.discipulado_presencas ADD COLUMN campo_id uuid REFERENCES public.campos(id);
ALTER TABLE public.supervisoes ADD COLUMN campo_id uuid REFERENCES public.campos(id);
ALTER TABLE public.multiplicacoes ADD COLUMN campo_id uuid REFERENCES public.campos(id);
ALTER TABLE public.access_keys ADD COLUMN campo_id uuid REFERENCES public.campos(id);
ALTER TABLE public.roteiros_celula ADD COLUMN campo_id uuid REFERENCES public.campos(id);
ALTER TABLE public.events_spiritual ADD COLUMN campo_id uuid REFERENCES public.campos(id);

-- 4) BACKFILL: Todos os dados existentes → Paulista (Sede)
DO $$
DECLARE
  paulista_id uuid;
BEGIN
  SELECT id INTO paulista_id FROM public.campos WHERE nome = 'Paulista (Sede)';

  UPDATE public.redes SET campo_id = paulista_id WHERE campo_id IS NULL;
  UPDATE public.coordenacoes SET campo_id = paulista_id WHERE campo_id IS NULL;
  UPDATE public.celulas SET campo_id = paulista_id WHERE campo_id IS NULL;
  UPDATE public.supervisores SET campo_id = paulista_id WHERE campo_id IS NULL;
  UPDATE public.members SET campo_id = paulista_id WHERE campo_id IS NULL;
  UPDATE public.weekly_reports SET campo_id = paulista_id WHERE campo_id IS NULL;
  UPDATE public.novas_vidas SET campo_id = paulista_id WHERE campo_id IS NULL;
  UPDATE public.encaminhamentos_recomeco SET campo_id = paulista_id WHERE campo_id IS NULL;
  UPDATE public.event_registrations SET campo_id = paulista_id WHERE campo_id IS NULL;
  UPDATE public.discipulado_encontros SET campo_id = paulista_id WHERE campo_id IS NULL;
  UPDATE public.discipulado_presencas SET campo_id = paulista_id WHERE campo_id IS NULL;
  UPDATE public.supervisoes SET campo_id = paulista_id WHERE campo_id IS NULL;
  UPDATE public.multiplicacoes SET campo_id = paulista_id WHERE campo_id IS NULL;
  UPDATE public.access_keys SET campo_id = paulista_id WHERE campo_id IS NULL;
  UPDATE public.roteiros_celula SET campo_id = paulista_id WHERE campo_id IS NULL;
  UPDATE public.events_spiritual SET campo_id = paulista_id WHERE campo_id IS NULL;
END $$;

-- 5) Após backfill, tornar NOT NULL (com default do Paulista para segurança)
-- Nota: Não forçamos NOT NULL agora para evitar quebras durante deploy gradual.
-- Será feito em migração futura após validação.

-- 6) Índices para performance
CREATE INDEX idx_redes_campo_id ON public.redes(campo_id);
CREATE INDEX idx_celulas_campo_id ON public.celulas(campo_id);
CREATE INDEX idx_members_campo_id ON public.members(campo_id);
CREATE INDEX idx_weekly_reports_campo_id ON public.weekly_reports(campo_id);
CREATE INDEX idx_novas_vidas_campo_id ON public.novas_vidas(campo_id);
CREATE INDEX idx_supervisoes_campo_id ON public.supervisoes(campo_id);

-- 7) Novos scope_types para access_keys: pastor_senior_global e pastor_de_campo
-- (scope_type é text, não enum — basta usar os novos valores)

-- 8) Criar tabela campo_pastores para vincular pastores a campos
CREATE TABLE public.campo_pastores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campo_id uuid NOT NULL REFERENCES public.campos(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id),
  tipo text NOT NULL DEFAULT 'pastor_de_campo', -- 'pastor_senior_global' ou 'pastor_de_campo'
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(campo_id, profile_id)
);

ALTER TABLE public.campo_pastores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read campo_pastores" ON public.campo_pastores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage campo_pastores" ON public.campo_pastores FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
