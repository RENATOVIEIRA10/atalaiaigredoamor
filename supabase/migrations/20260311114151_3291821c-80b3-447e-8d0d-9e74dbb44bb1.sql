
-- =============================================
-- MÓDULO ADMINISTRATIVO & FINANCEIRO - ATALAIA
-- =============================================

-- 1. Categorias financeiras
CREATE TABLE public.fin_categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text NOT NULL DEFAULT 'despesa', -- 'despesa' | 'receita' | 'ambos'
  ativa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fin_categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read fin_categorias" ON public.fin_categorias
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Scoped write fin_categorias" ON public.fin_categorias
  FOR INSERT TO authenticated WITH CHECK (has_any_active_scope(auth.uid()));
CREATE POLICY "Scoped update fin_categorias" ON public.fin_categorias
  FOR UPDATE TO authenticated USING (has_any_active_scope(auth.uid())) WITH CHECK (has_any_active_scope(auth.uid()));
CREATE POLICY "Scoped delete fin_categorias" ON public.fin_categorias
  FOR DELETE TO authenticated USING (has_any_active_scope(auth.uid()));

-- 2. Centros de custo
CREATE TABLE public.fin_centros_custo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  campo_id uuid REFERENCES public.campos(id) ON DELETE CASCADE,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fin_centros_custo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read fin_centros_custo" ON public.fin_centros_custo
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Scoped write fin_centros_custo" ON public.fin_centros_custo
  FOR INSERT TO authenticated WITH CHECK (has_any_active_scope(auth.uid()));
CREATE POLICY "Scoped update fin_centros_custo" ON public.fin_centros_custo
  FOR UPDATE TO authenticated USING (has_any_active_scope(auth.uid())) WITH CHECK (has_any_active_scope(auth.uid()));
CREATE POLICY "Scoped delete fin_centros_custo" ON public.fin_centros_custo
  FOR DELETE TO authenticated USING (has_any_active_scope(auth.uid()));

-- 3. Fornecedores
CREATE TABLE public.fin_fornecedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  telefone text,
  email text,
  categoria text,
  cidade text,
  observacoes text,
  campo_id uuid REFERENCES public.campos(id) ON DELETE SET NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fin_fornecedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read fin_fornecedores" ON public.fin_fornecedores
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Scoped write fin_fornecedores" ON public.fin_fornecedores
  FOR INSERT TO authenticated WITH CHECK (has_any_active_scope(auth.uid()));
CREATE POLICY "Scoped update fin_fornecedores" ON public.fin_fornecedores
  FOR UPDATE TO authenticated USING (has_any_active_scope(auth.uid())) WITH CHECK (has_any_active_scope(auth.uid()));
CREATE POLICY "Scoped delete fin_fornecedores" ON public.fin_fornecedores
  FOR DELETE TO authenticated USING (has_any_active_scope(auth.uid()));

-- 4. Contas a Pagar
CREATE TABLE public.fin_contas_pagar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao text NOT NULL,
  valor numeric(12,2) NOT NULL DEFAULT 0,
  data_vencimento date NOT NULL,
  data_pagamento date,
  status text NOT NULL DEFAULT 'pendente', -- 'pendente' | 'pago' | 'vencido'
  categoria_id uuid REFERENCES public.fin_categorias(id) ON DELETE SET NULL,
  fornecedor_id uuid REFERENCES public.fin_fornecedores(id) ON DELETE SET NULL,
  centro_custo_id uuid REFERENCES public.fin_centros_custo(id) ON DELETE SET NULL,
  campo_id uuid NOT NULL REFERENCES public.campos(id) ON DELETE CASCADE,
  observacoes text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fin_contas_pagar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read fin_contas_pagar" ON public.fin_contas_pagar
  FOR SELECT TO authenticated USING (user_belongs_to_campo(auth.uid(), campo_id));
CREATE POLICY "Scoped write fin_contas_pagar" ON public.fin_contas_pagar
  FOR INSERT TO authenticated WITH CHECK (has_any_active_scope(auth.uid()));
CREATE POLICY "Scoped update fin_contas_pagar" ON public.fin_contas_pagar
  FOR UPDATE TO authenticated USING (has_any_active_scope(auth.uid())) WITH CHECK (has_any_active_scope(auth.uid()));
CREATE POLICY "Scoped delete fin_contas_pagar" ON public.fin_contas_pagar
  FOR DELETE TO authenticated USING (has_any_active_scope(auth.uid()));

-- 5. Contas a Receber
CREATE TABLE public.fin_contas_receber (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao text NOT NULL,
  valor numeric(12,2) NOT NULL DEFAULT 0,
  data_prevista date NOT NULL,
  data_recebimento date,
  status text NOT NULL DEFAULT 'pendente', -- 'pendente' | 'recebido' | 'atrasado'
  categoria_id uuid REFERENCES public.fin_categorias(id) ON DELETE SET NULL,
  centro_custo_id uuid REFERENCES public.fin_centros_custo(id) ON DELETE SET NULL,
  campo_id uuid NOT NULL REFERENCES public.campos(id) ON DELETE CASCADE,
  origem text,
  observacoes text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fin_contas_receber ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read fin_contas_receber" ON public.fin_contas_receber
  FOR SELECT TO authenticated USING (user_belongs_to_campo(auth.uid(), campo_id));
CREATE POLICY "Scoped write fin_contas_receber" ON public.fin_contas_receber
  FOR INSERT TO authenticated WITH CHECK (has_any_active_scope(auth.uid()));
CREATE POLICY "Scoped update fin_contas_receber" ON public.fin_contas_receber
  FOR UPDATE TO authenticated USING (has_any_active_scope(auth.uid())) WITH CHECK (has_any_active_scope(auth.uid()));
CREATE POLICY "Scoped delete fin_contas_receber" ON public.fin_contas_receber
  FOR DELETE TO authenticated USING (has_any_active_scope(auth.uid()));

-- 6. Histórico de ações (auditoria)
CREATE TABLE public.fin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tabela text NOT NULL,
  registro_id uuid NOT NULL,
  acao text NOT NULL, -- 'criou' | 'editou' | 'marcou_pago' | 'excluiu'
  campo_id uuid REFERENCES public.campos(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  user_name text,
  detalhes jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read fin_audit_log" ON public.fin_audit_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert fin_audit_log" ON public.fin_audit_log
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
