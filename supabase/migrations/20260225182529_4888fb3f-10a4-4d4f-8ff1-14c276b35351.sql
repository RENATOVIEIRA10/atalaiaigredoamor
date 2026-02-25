
-- Table: recomeco_agents (agent profile)
CREATE TABLE public.recomeco_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  nome text NOT NULL,
  telefone_whatsapp text NOT NULL,
  cargo text NOT NULL DEFAULT 'Recomeço – Igreja do Amor',
  mensagem_assinatura text DEFAULT 'Recomeço | Igreja do Amor',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recomeco_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own agent profile"
  ON public.recomeco_agents FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own agent profile"
  ON public.recomeco_agents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own agent profile"
  ON public.recomeco_agents FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Central can read all agent profiles
CREATE POLICY "Central reads all agents"
  ON public.recomeco_agents FOR SELECT TO authenticated
  USING (public.has_access_scope(auth.uid(), 'central_celulas'));

-- Admin/pastor can read all
CREATE POLICY "Admin reads all agents"
  ON public.recomeco_agents FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Table: recomeco_message_templates
CREATE TABLE public.recomeco_message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Boas-vindas padrão',
  body text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recomeco_message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read templates"
  ON public.recomeco_message_templates FOR SELECT TO authenticated
  USING (true);

-- Insert default template
INSERT INTO public.recomeco_message_templates (name, body, active) VALUES (
  'Boas-vindas padrão',
  E'Olá, {vida_nome}! Paz e graça 😊\n\nAqui é {agente_nome}, do Recomeço da Igreja do Amor.\n\nQue alegria saber da sua decisão! 💛\n\nEm breve um líder de célula vai entrar em contato com você para te convidar a visitar uma célula perto da sua casa, para caminhar com você nessa nova fase.\n\nQualquer coisa, estou à disposição.\n\n{agente_assinatura}',
  true
);

-- Table: recomeco_messages (tracking)
CREATE TABLE public.recomeco_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vida_id uuid NOT NULL REFERENCES public.novas_vidas(id) ON DELETE CASCADE,
  agent_user_id uuid NOT NULL,
  template_id uuid REFERENCES public.recomeco_message_templates(id),
  channel text NOT NULL DEFAULT 'whatsapp',
  status text NOT NULL DEFAULT 'opened_whatsapp',
  message_preview text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recomeco_messages ENABLE ROW LEVEL SECURITY;

-- Agent can read/insert/update own messages
CREATE POLICY "Agent reads own messages"
  ON public.recomeco_messages FOR SELECT TO authenticated
  USING (agent_user_id = auth.uid());

CREATE POLICY "Agent inserts own messages"
  ON public.recomeco_messages FOR INSERT TO authenticated
  WITH CHECK (agent_user_id = auth.uid());

CREATE POLICY "Agent updates own messages"
  ON public.recomeco_messages FOR UPDATE TO authenticated
  USING (agent_user_id = auth.uid());

-- Central can read all messages
CREATE POLICY "Central reads all messages"
  ON public.recomeco_messages FOR SELECT TO authenticated
  USING (public.has_access_scope(auth.uid(), 'central_celulas'));

-- Admin can read all
CREATE POLICY "Admin reads all messages"
  ON public.recomeco_messages FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_recomeco_agents_updated_at
  BEFORE UPDATE ON public.recomeco_agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recomeco_messages_updated_at
  BEFORE UPDATE ON public.recomeco_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recomeco_templates_updated_at
  BEFORE UPDATE ON public.recomeco_message_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
