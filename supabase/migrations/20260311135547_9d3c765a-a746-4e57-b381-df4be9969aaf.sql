
-- Reconciliation sessions
CREATE TABLE public.fin_conciliacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campo_id uuid NOT NULL REFERENCES public.campos(id),
  periodo_inicio date NOT NULL,
  periodo_fim date NOT NULL,
  saldo_inicial numeric NOT NULL DEFAULT 0,
  saldo_final numeric NOT NULL DEFAULT 0,
  banco text,
  conta text,
  total_itens integer NOT NULL DEFAULT 0,
  total_conciliados integer NOT NULL DEFAULT 0,
  total_pendentes integer NOT NULL DEFAULT 0,
  total_divergentes integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'em_andamento',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fin_conciliacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read own campo conciliacoes" ON public.fin_conciliacoes
  FOR SELECT TO authenticated
  USING (public.user_belongs_to_campo(auth.uid(), campo_id));

CREATE POLICY "Scoped write fin_conciliacoes" ON public.fin_conciliacoes
  FOR INSERT TO authenticated
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped update fin_conciliacoes" ON public.fin_conciliacoes
  FOR UPDATE TO authenticated
  USING (public.has_any_active_scope(auth.uid()))
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped delete fin_conciliacoes" ON public.fin_conciliacoes
  FOR DELETE TO authenticated
  USING (public.has_any_active_scope(auth.uid()));

-- Bank statement items
CREATE TABLE public.fin_extrato_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conciliacao_id uuid NOT NULL REFERENCES public.fin_conciliacoes(id) ON DELETE CASCADE,
  campo_id uuid NOT NULL REFERENCES public.campos(id),
  data date NOT NULL,
  descricao text NOT NULL,
  valor numeric NOT NULL,
  tipo text NOT NULL DEFAULT 'saida',
  saldo numeric,
  status_conciliacao text NOT NULL DEFAULT 'pendente',
  conta_pagar_id uuid REFERENCES public.fin_contas_pagar(id),
  conta_receber_id uuid REFERENCES public.fin_contas_receber(id),
  match_score numeric,
  match_sugerido_label text,
  conciliado_por uuid,
  conciliado_at timestamptz,
  justificativa_ignorar text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fin_extrato_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read own campo extrato_items" ON public.fin_extrato_items
  FOR SELECT TO authenticated
  USING (public.user_belongs_to_campo(auth.uid(), campo_id));

CREATE POLICY "Scoped write fin_extrato_items" ON public.fin_extrato_items
  FOR INSERT TO authenticated
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped update fin_extrato_items" ON public.fin_extrato_items
  FOR UPDATE TO authenticated
  USING (public.has_any_active_scope(auth.uid()))
  WITH CHECK (public.has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped delete fin_extrato_items" ON public.fin_extrato_items
  FOR DELETE TO authenticated
  USING (public.has_any_active_scope(auth.uid()));
