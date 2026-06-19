CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  confirmed_at timestamptz,
  source text NOT NULL DEFAULT 'agente-celulas',
  channel text NOT NULL DEFAULT 'whatsapp',
  direction text NOT NULL DEFAULT 'inbound' CHECK (direction IN ('inbound', 'outbound', 'system')),
  phone text,
  remote_jid text,
  sender_name text,
  message_text text,
  classification text NOT NULL DEFAULT 'unknown',
  confidence numeric(4,3),
  status text NOT NULL DEFAULT 'received',
  extracted_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  campo_id uuid REFERENCES public.campos(id),
  rede_id uuid REFERENCES public.redes(id),
  celula_id uuid REFERENCES public.celulas(id),
  weekly_report_id uuid REFERENCES public.weekly_reports(id),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_messages TO authenticated;
GRANT ALL ON public.whatsapp_messages TO service_role;

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage whatsapp_messages"
  ON public.whatsapp_messages FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Scoped users read whatsapp_messages by campo"
  ON public.whatsapp_messages FOR SELECT TO authenticated
  USING (campo_id IS NOT NULL AND public.user_belongs_to_campo(auth.uid(), campo_id));

CREATE TABLE IF NOT EXISTS public.whatsapp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'agente-celulas',
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  title text NOT NULL,
  description text,
  phone text,
  campo_id uuid REFERENCES public.campos(id),
  rede_id uuid REFERENCES public.redes(id),
  celula_id uuid REFERENCES public.celulas(id),
  message_id uuid REFERENCES public.whatsapp_messages(id) ON DELETE SET NULL,
  weekly_report_id uuid REFERENCES public.weekly_reports(id),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_events TO authenticated;
GRANT ALL ON public.whatsapp_events TO service_role;

ALTER TABLE public.whatsapp_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage whatsapp_events"
  ON public.whatsapp_events FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Scoped users read whatsapp_events by campo"
  ON public.whatsapp_events FOR SELECT TO authenticated
  USING (campo_id IS NOT NULL AND public.user_belongs_to_campo(auth.uid(), campo_id));

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at ON public.whatsapp_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON public.whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_classification ON public.whatsapp_messages(classification);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_campo ON public.whatsapp_messages(campo_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone ON public.whatsapp_messages(phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_events_created_at ON public.whatsapp_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_events_type ON public.whatsapp_events(event_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_events_campo ON public.whatsapp_events(campo_id);

CREATE OR REPLACE FUNCTION public.touch_whatsapp_messages_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_whatsapp_messages_updated_at ON public.whatsapp_messages;
CREATE TRIGGER trg_touch_whatsapp_messages_updated_at
BEFORE UPDATE ON public.whatsapp_messages
FOR EACH ROW EXECUTE FUNCTION public.touch_whatsapp_messages_updated_at();