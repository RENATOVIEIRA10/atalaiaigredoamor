-- Fix: recreate encaminhamento trigger with correct PL/pgSQL syntax (DECLARE before BEGIN)
CREATE OR REPLACE FUNCTION public.auto_set_campo_id_on_encaminhamento()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _celula_campo uuid;
  _vida_campo uuid;
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
  SELECT campo_id INTO _celula_campo FROM public.celulas WHERE id = NEW.celula_id;
  IF _celula_campo IS DISTINCT FROM NEW.campo_id THEN
    RAISE EXCEPTION 'Célula pertence a outro campus. Operação bloqueada para evitar vazamento de dados.';
  END IF;

  -- Cross-campus validation: nova_vida must belong to same campus
  IF NEW.nova_vida_id IS NOT NULL THEN
    SELECT campo_id INTO _vida_campo FROM public.novas_vidas WHERE id = NEW.nova_vida_id;
    IF _vida_campo IS DISTINCT FROM NEW.campo_id THEN
      RAISE EXCEPTION 'Nova vida pertence a outro campus. Operação bloqueada para evitar vazamento de dados.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure trigger exists (drop and recreate to be safe)
DROP TRIGGER IF EXISTS trg_auto_campo_id_encaminhamentos ON public.encaminhamentos_recomeco;
CREATE TRIGGER trg_auto_campo_id_encaminhamentos
BEFORE INSERT OR UPDATE ON public.encaminhamentos_recomeco
FOR EACH ROW
EXECUTE FUNCTION public.auto_set_campo_id_on_encaminhamento();

-- Safety-net trigger for members: auto-resolve campo_id from celula
CREATE OR REPLACE FUNCTION public.auto_set_campo_id_on_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _celula_campo uuid;
BEGIN
  -- Auto-resolve campo_id from celula if missing
  IF NEW.campo_id IS NULL AND NEW.celula_id IS NOT NULL THEN
    SELECT campo_id INTO NEW.campo_id
    FROM public.celulas
    WHERE id = NEW.celula_id;
  END IF;

  IF NEW.campo_id IS NULL THEN
    RAISE EXCEPTION 'campo_id é obrigatório para criar membro. Célula ou campus não identificado.';
  END IF;

  -- Cross-campus validation (complements existing validate_member_campo)
  IF NEW.celula_id IS NOT NULL THEN
    SELECT campo_id INTO _celula_campo FROM public.celulas WHERE id = NEW.celula_id;
    IF _celula_campo IS DISTINCT FROM NEW.campo_id THEN
      RAISE EXCEPTION 'campo_id do membro (%) diverge da célula (%)', NEW.campo_id, _celula_campo;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_campo_id_members ON public.members;
CREATE TRIGGER trg_auto_campo_id_members
BEFORE INSERT OR UPDATE ON public.members
FOR EACH ROW
EXECUTE FUNCTION public.auto_set_campo_id_on_member();

-- Ensure novas_vidas trigger covers INSERT OR UPDATE
DROP TRIGGER IF EXISTS trg_auto_campo_id_novas_vidas ON public.novas_vidas;
CREATE TRIGGER trg_auto_campo_id_novas_vidas
BEFORE INSERT OR UPDATE ON public.novas_vidas
FOR EACH ROW
EXECUTE FUNCTION public.auto_set_campo_id_on_nova_vida();