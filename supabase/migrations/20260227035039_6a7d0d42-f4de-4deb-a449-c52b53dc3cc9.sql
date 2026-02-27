
-- Table for spiritual events (Batismo / Aclamação)
CREATE TABLE public.events_spiritual (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL CHECK (type IN ('batismo', 'aclamacao')),
  title text NOT NULL,
  event_date date NOT NULL,
  start_time time WITHOUT TIME ZONE,
  location text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.events_spiritual ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read events_spiritual" ON public.events_spiritual FOR SELECT USING (true);
CREATE POLICY "Authenticated write events_spiritual" ON public.events_spiritual FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update events_spiritual" ON public.events_spiritual FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated delete events_spiritual" ON public.events_spiritual FOR DELETE USING (auth.uid() IS NOT NULL);

-- Table for event registrations
CREATE TABLE public.event_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events_spiritual(id) ON DELETE CASCADE,
  person_type text NOT NULL CHECK (person_type IN ('vida', 'membro')),
  vida_id uuid REFERENCES public.novas_vidas(id),
  membro_id uuid REFERENCES public.members(id),
  full_name text NOT NULL,
  whatsapp text,
  coordenacao_id uuid REFERENCES public.coordenacoes(id),
  celula_id uuid REFERENCES public.celulas(id),
  rede_id uuid REFERENCES public.redes(id),
  status text NOT NULL DEFAULT 'inscrito' CHECK (status IN ('inscrito', 'pendente', 'aprovado', 'realizado', 'recusado')),
  notes text,
  created_by_user_id uuid,
  created_by_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read event_registrations" ON public.event_registrations FOR SELECT USING (true);
CREATE POLICY "Authenticated write event_registrations" ON public.event_registrations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated update event_registrations" ON public.event_registrations FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated delete event_registrations" ON public.event_registrations FOR DELETE USING (auth.uid() IS NOT NULL);

-- Constraint: must have vida_id XOR membro_id
ALTER TABLE public.event_registrations ADD CONSTRAINT chk_person_ref CHECK (
  (vida_id IS NOT NULL AND membro_id IS NULL) OR (vida_id IS NULL AND membro_id IS NOT NULL)
);
