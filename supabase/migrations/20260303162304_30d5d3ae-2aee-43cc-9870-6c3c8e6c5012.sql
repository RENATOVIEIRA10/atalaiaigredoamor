
-- ============================================================
-- HARDENING: Cross-campus triggers + NOT NULL constraints
-- ============================================================

-- 1. EVENT_REGISTRATIONS: cross-campus validation
CREATE OR REPLACE FUNCTION public.validate_event_registration_campo()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  _event_campo uuid;
  _member_campo uuid;
  _celula_campo uuid;
BEGIN
  -- Event must match
  SELECT campo_id INTO _event_campo FROM events_spiritual WHERE id = NEW.event_id;
  IF _event_campo IS DISTINCT FROM NEW.campo_id THEN
    RAISE EXCEPTION 'campo_id da inscrição (%) diverge do evento (%)', NEW.campo_id, _event_campo;
  END IF;

  -- Member must match (if set)
  IF NEW.membro_id IS NOT NULL THEN
    SELECT campo_id INTO _member_campo FROM members WHERE id = NEW.membro_id;
    IF _member_campo IS DISTINCT FROM NEW.campo_id THEN
      RAISE EXCEPTION 'campo_id da inscrição (%) diverge do membro (%)', NEW.campo_id, _member_campo;
    END IF;
  END IF;

  -- Celula must match (if set)
  IF NEW.celula_id IS NOT NULL THEN
    SELECT campo_id INTO _celula_campo FROM celulas WHERE id = NEW.celula_id;
    IF _celula_campo IS DISTINCT FROM NEW.campo_id THEN
      RAISE EXCEPTION 'campo_id da inscrição (%) diverge da célula (%)', NEW.campo_id, _celula_campo;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_event_registration_campo
BEFORE INSERT OR UPDATE ON public.event_registrations
FOR EACH ROW EXECUTE FUNCTION public.validate_event_registration_campo();

-- 2. DISCIPULADO_ENCONTROS: cross-campus validation
CREATE OR REPLACE FUNCTION public.validate_discipulado_encontro_campo()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE _ref_campo uuid;
BEGIN
  IF NEW.celula_id IS NOT NULL THEN
    SELECT campo_id INTO _ref_campo FROM celulas WHERE id = NEW.celula_id;
    IF _ref_campo IS DISTINCT FROM NEW.campo_id THEN
      RAISE EXCEPTION 'campo_id do encontro (%) diverge da célula (%)', NEW.campo_id, _ref_campo;
    END IF;
  END IF;

  IF NEW.coordenacao_id IS NOT NULL THEN
    SELECT campo_id INTO _ref_campo FROM coordenacoes WHERE id = NEW.coordenacao_id;
    IF _ref_campo IS DISTINCT FROM NEW.campo_id THEN
      RAISE EXCEPTION 'campo_id do encontro (%) diverge da coordenação (%)', NEW.campo_id, _ref_campo;
    END IF;
  END IF;

  IF NEW.rede_id IS NOT NULL THEN
    SELECT campo_id INTO _ref_campo FROM redes WHERE id = NEW.rede_id;
    IF _ref_campo IS DISTINCT FROM NEW.campo_id THEN
      RAISE EXCEPTION 'campo_id do encontro (%) diverge da rede (%)', NEW.campo_id, _ref_campo;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_discipulado_encontro_campo
BEFORE INSERT OR UPDATE ON public.discipulado_encontros
FOR EACH ROW EXECUTE FUNCTION public.validate_discipulado_encontro_campo();

-- 3. MULTIPLICACOES: auto-set + cross-campus + NOT NULL
CREATE OR REPLACE FUNCTION public.auto_set_and_validate_multiplicacao_campo()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  _origem_campo uuid;
  _destino_campo uuid;
BEGIN
  SELECT campo_id INTO _origem_campo FROM celulas WHERE id = NEW.celula_origem_id;
  SELECT campo_id INTO _destino_campo FROM celulas WHERE id = NEW.celula_destino_id;

  -- Cross-campus check
  IF _origem_campo IS DISTINCT FROM _destino_campo THEN
    RAISE EXCEPTION 'Multiplicação entre campus diferentes: origem (%) vs destino (%)', _origem_campo, _destino_campo;
  END IF;

  -- Auto-set if null
  IF NEW.campo_id IS NULL THEN
    NEW.campo_id := _origem_campo;
  END IF;

  -- Final validation
  IF NEW.campo_id IS NULL THEN
    RAISE EXCEPTION 'campo_id é obrigatório para multiplicação. Células sem campus.';
  END IF;

  IF NEW.campo_id IS DISTINCT FROM _origem_campo THEN
    RAISE EXCEPTION 'campo_id da multiplicação (%) diverge das células (%)', NEW.campo_id, _origem_campo;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_multiplicacao_campo
BEFORE INSERT OR UPDATE ON public.multiplicacoes
FOR EACH ROW EXECUTE FUNCTION public.auto_set_and_validate_multiplicacao_campo();

-- Backfill multiplicacoes.campo_id from celula_origem
UPDATE public.multiplicacoes m
SET campo_id = c.campo_id
FROM public.celulas c
WHERE m.celula_origem_id = c.id
  AND m.campo_id IS NULL;

-- Now make it NOT NULL
ALTER TABLE public.multiplicacoes ALTER COLUMN campo_id SET NOT NULL;

-- 4. CELULAS.rede_id: backfill + NOT NULL
UPDATE public.celulas cel
SET rede_id = co.rede_id
FROM public.coordenacoes co
WHERE cel.coordenacao_id = co.id
  AND cel.rede_id IS NULL;

ALTER TABLE public.celulas ALTER COLUMN rede_id SET NOT NULL;

-- Harden trigger to FAIL if rede_id can't be resolved
CREATE OR REPLACE FUNCTION public.auto_set_rede_id_on_celula()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE _coord_rede uuid;
BEGIN
  IF NEW.coordenacao_id IS NOT NULL THEN
    SELECT rede_id INTO _coord_rede FROM coordenacoes WHERE id = NEW.coordenacao_id;
    IF _coord_rede IS NOT NULL THEN
      NEW.rede_id := _coord_rede;
    END IF;
  END IF;
  IF NEW.rede_id IS NULL THEN
    RAISE EXCEPTION 'rede_id é obrigatório para célula. Coordenação sem rede ou não encontrada.';
  END IF;
  RETURN NEW;
END;
$$;

-- 5. MEMBERS.rede_id: backfill + NOT NULL
UPDATE public.members mem
SET rede_id = cel.rede_id
FROM public.celulas cel
WHERE mem.celula_id = cel.id
  AND mem.rede_id IS NULL;

ALTER TABLE public.members ALTER COLUMN rede_id SET NOT NULL;

-- Harden trigger to FAIL if rede_id can't be resolved
CREATE OR REPLACE FUNCTION public.auto_set_rede_id_on_member()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE _celula_rede uuid;
BEGIN
  IF NEW.celula_id IS NOT NULL THEN
    SELECT rede_id INTO _celula_rede FROM celulas WHERE id = NEW.celula_id;
    IF _celula_rede IS NOT NULL THEN
      NEW.rede_id := _celula_rede;
    END IF;
  END IF;
  IF NEW.rede_id IS NULL THEN
    RAISE EXCEPTION 'rede_id é obrigatório para membro. Célula sem rede ou não encontrada.';
  END IF;
  RETURN NEW;
END;
$$;

-- 6. Harden auto_set_rede_id_on_weekly_report to FAIL
CREATE OR REPLACE FUNCTION public.auto_set_rede_id_on_weekly_report()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE _celula_rede uuid;
BEGIN
  IF NEW.celula_id IS NOT NULL AND NEW.rede_id IS NULL THEN
    SELECT rede_id INTO _celula_rede FROM celulas WHERE id = NEW.celula_id;
    IF _celula_rede IS NOT NULL THEN
      NEW.rede_id := _celula_rede;
    END IF;
  END IF;
  IF NEW.rede_id IS NULL THEN
    RAISE EXCEPTION 'rede_id é obrigatório para relatório semanal. Célula sem rede.';
  END IF;
  RETURN NEW;
END;
$$;

-- 7. Harden auto_set_rede_id_on_encaminhamento to FAIL
CREATE OR REPLACE FUNCTION public.auto_set_rede_id_on_encaminhamento()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE _celula_rede uuid;
BEGIN
  IF NEW.celula_id IS NOT NULL AND NEW.rede_id IS NULL THEN
    SELECT rede_id INTO _celula_rede FROM celulas WHERE id = NEW.celula_id;
    IF _celula_rede IS NOT NULL THEN
      NEW.rede_id := _celula_rede;
    END IF;
  END IF;
  IF NEW.rede_id IS NULL THEN
    RAISE EXCEPTION 'rede_id é obrigatório para encaminhamento. Célula sem rede.';
  END IF;
  RETURN NEW;
END;
$$;
