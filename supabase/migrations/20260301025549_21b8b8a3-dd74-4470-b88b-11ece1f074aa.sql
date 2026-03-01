
-- Safety-net trigger: auto-resolve campo_id on encaminhamentos_recomeco insert
CREATE OR REPLACE FUNCTION public.auto_set_campo_id_on_encaminhamento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If campo_id is null, try to inherit from the nova_vida
  IF NEW.campo_id IS NULL AND NEW.nova_vida_id IS NOT NULL THEN
    SELECT campo_id INTO NEW.campo_id
    FROM public.novas_vidas
    WHERE id = NEW.nova_vida_id;
  END IF;

  -- If still null, try user_access_links
  IF NEW.campo_id IS NULL THEN
    SELECT campo_id INTO NEW.campo_id
    FROM public.user_access_links
    WHERE user_id = auth.uid()
      AND active = true
      AND campo_id IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  IF NEW.campo_id IS NULL THEN
    RAISE EXCEPTION 'campo_id é obrigatório para encaminhar. Seu acesso não está vinculado a um campus.';
  END IF;

  -- Cross-campus validation: celula must belong to same campus
  DECLARE _celula_campo uuid;
  BEGIN
    SELECT campo_id INTO _celula_campo FROM public.celulas WHERE id = NEW.celula_id;
    IF _celula_campo IS DISTINCT FROM NEW.campo_id THEN
      RAISE EXCEPTION 'Célula pertence a outro campus. Operação bloqueada para evitar vazamento de dados.';
    END IF;
  END;

  -- Cross-campus validation: nova_vida must belong to same campus
  DECLARE _vida_campo uuid;
  BEGIN
    SELECT campo_id INTO _vida_campo FROM public.novas_vidas WHERE id = NEW.nova_vida_id;
    IF _vida_campo IS DISTINCT FROM NEW.campo_id THEN
      RAISE EXCEPTION 'Nova vida pertence a outro campus. Operação bloqueada para evitar vazamento de dados.';
    END IF;
  END;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_campo_id_encaminhamentos
BEFORE INSERT ON public.encaminhamentos_recomeco
FOR EACH ROW
EXECUTE FUNCTION public.auto_set_campo_id_on_encaminhamento();
