
-- Table to store Pluggy bank connections per campus
CREATE TABLE public.fin_bank_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campo_id uuid NOT NULL REFERENCES public.campos(id),
  pluggy_item_id text NOT NULL,
  access_token_encrypted text NOT NULL,
  bank_name text,
  account_type text,
  account_number text,
  status text NOT NULL DEFAULT 'active',
  last_sync_at timestamptz,
  sync_error text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fin_bank_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read own campo bank connections"
  ON public.fin_bank_connections FOR SELECT TO authenticated
  USING (user_belongs_to_campo(auth.uid(), campo_id));

CREATE POLICY "Scoped write fin_bank_connections"
  ON public.fin_bank_connections FOR INSERT TO authenticated
  WITH CHECK (has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped update fin_bank_connections"
  ON public.fin_bank_connections FOR UPDATE TO authenticated
  USING (has_any_active_scope(auth.uid()))
  WITH CHECK (has_any_active_scope(auth.uid()));

CREATE POLICY "Scoped delete fin_bank_connections"
  ON public.fin_bank_connections FOR DELETE TO authenticated
  USING (has_any_active_scope(auth.uid()));
