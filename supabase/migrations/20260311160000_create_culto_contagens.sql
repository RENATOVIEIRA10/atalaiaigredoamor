-- Guardiões: tabela de contagens de presença em cultos
CREATE TABLE IF NOT EXISTS culto_contagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campo_id text NOT NULL,
  data date NOT NULL,
  horario text,
  total_presentes integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'em_andamento',
  guardiao_user_id text,
  novas_vidas_count integer NOT NULL DEFAULT 0,
  decisoes_espirituais integer NOT NULL DEFAULT 0,
  batismos_agendados integer NOT NULL DEFAULT 0,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT culto_contagens_status_check CHECK (status IN ('em_andamento', 'encerrado'))
);

CREATE INDEX IF NOT EXISTS culto_contagens_campo_data_idx
  ON culto_contagens (campo_id, data DESC);

ALTER TABLE culto_contagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage culto contagens"
  ON culto_contagens FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
