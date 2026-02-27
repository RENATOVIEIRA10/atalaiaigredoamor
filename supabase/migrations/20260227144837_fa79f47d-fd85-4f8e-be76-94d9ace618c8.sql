
-- 1. Adicionar campo_id à user_access_links para resolução rápida de campus
ALTER TABLE public.user_access_links
  ADD COLUMN IF NOT EXISTS campo_id uuid REFERENCES public.campos(id);

-- 2. Backfill: herdar campo_id da access_key vinculada
UPDATE public.user_access_links ual
SET campo_id = ak.campo_id
FROM public.access_keys ak
WHERE ual.access_key_id = ak.id
  AND ual.campo_id IS NULL
  AND ak.campo_id IS NOT NULL;

-- 3. Trigger para auto-herdar campo_id ao criar/atualizar user_access_links
CREATE OR REPLACE FUNCTION public.auto_set_campo_id_on_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se campo_id não foi fornecido, herdar da access_key
  IF NEW.campo_id IS NULL AND NEW.access_key_id IS NOT NULL THEN
    SELECT campo_id INTO NEW.campo_id
    FROM public.access_keys
    WHERE id = NEW.access_key_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_campo_id_on_link
BEFORE INSERT OR UPDATE ON public.user_access_links
FOR EACH ROW
EXECUTE FUNCTION public.auto_set_campo_id_on_link();

-- 4. Função helper: resolver campo_id do usuário logado
CREATE OR REPLACE FUNCTION public.get_user_campo_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT campo_id
  FROM public.user_access_links
  WHERE user_id = _user_id
    AND active = true
    AND campo_id IS NOT NULL
  ORDER BY created_at DESC
  LIMIT 1
$$;

-- 5. Trigger para auto-popular campo_id em access_keys ao criar novas keys
-- baseado na rede vinculada (se existir)
CREATE OR REPLACE FUNCTION public.auto_set_campo_id_on_access_key()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.campo_id IS NULL THEN
    -- Tentar herdar da rede vinculada
    IF NEW.rede_id IS NOT NULL THEN
      SELECT campo_id INTO NEW.campo_id
      FROM public.redes
      WHERE id = NEW.rede_id;
    END IF;
    -- Tentar herdar do scope_id baseado no scope_type
    IF NEW.campo_id IS NULL AND NEW.scope_id IS NOT NULL THEN
      IF NEW.scope_type = 'celula' THEN
        SELECT campo_id INTO NEW.campo_id FROM public.celulas WHERE id = NEW.scope_id;
      ELSIF NEW.scope_type = 'coordenacao' THEN
        SELECT campo_id INTO NEW.campo_id FROM public.coordenacoes WHERE id = NEW.scope_id;
      ELSIF NEW.scope_type = 'rede' THEN
        SELECT campo_id INTO NEW.campo_id FROM public.redes WHERE id = NEW.scope_id;
      ELSIF NEW.scope_type = 'supervisor' THEN
        SELECT campo_id INTO NEW.campo_id FROM public.supervisores WHERE id = NEW.scope_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_campo_id_on_access_key
BEFORE INSERT ON public.access_keys
FOR EACH ROW
EXECUTE FUNCTION public.auto_set_campo_id_on_access_key();
