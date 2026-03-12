
-- Create culto_contagens table
CREATE TABLE public.culto_contagens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campo_id uuid NOT NULL REFERENCES public.campos(id),
  data date NOT NULL,
  horario text,
  total_presentes integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'em_andamento',
  guardiao_user_id uuid,
  guardiao_nome text,
  culto_titulo text,
  novas_vidas_count integer NOT NULL DEFAULT 0,
  decisoes_espirituais integer NOT NULL DEFAULT 0,
  batismos_agendados integer NOT NULL DEFAULT 0,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.culto_contagens ENABLE ROW LEVEL SECURITY;

-- RLS: Authenticated users can read contagens from their campus
CREATE POLICY "Read own campo contagens"
  ON public.culto_contagens FOR SELECT
  TO authenticated
  USING (user_belongs_to_campo(auth.uid(), campo_id));

-- RLS: Users with any active scope can insert
CREATE POLICY "Scoped write culto_contagens"
  ON public.culto_contagens FOR INSERT
  TO authenticated
  WITH CHECK (has_any_active_scope(auth.uid()));

-- RLS: Users with any active scope can update
CREATE POLICY "Scoped update culto_contagens"
  ON public.culto_contagens FOR UPDATE
  TO authenticated
  USING (has_any_active_scope(auth.uid()))
  WITH CHECK (has_any_active_scope(auth.uid()));

-- RLS: Users with any active scope can delete
CREATE POLICY "Scoped delete culto_contagens"
  ON public.culto_contagens FOR DELETE
  TO authenticated
  USING (has_any_active_scope(auth.uid()));

-- Index for quick lookups
CREATE INDEX idx_culto_contagens_campo_data ON public.culto_contagens(campo_id, data);
