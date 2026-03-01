
-- 1. Trigger: auto-populate celulas.rede_id from coordenacoes.rede_id
CREATE OR REPLACE FUNCTION public.auto_set_rede_id_on_celula()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  _coord_rede uuid;
BEGIN
  -- Always derive rede_id from coordenação (single source of truth)
  IF NEW.coordenacao_id IS NOT NULL THEN
    SELECT rede_id INTO _coord_rede FROM coordenacoes WHERE id = NEW.coordenacao_id;
    IF _coord_rede IS NOT NULL THEN
      NEW.rede_id := _coord_rede;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_rede_id_celula
  BEFORE INSERT OR UPDATE ON public.celulas
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_rede_id_on_celula();

-- 2. Trigger: auto-populate members.rede_id from celulas (via coordenacao)
CREATE OR REPLACE FUNCTION public.auto_set_rede_id_on_member()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  _celula_rede uuid;
BEGIN
  IF NEW.celula_id IS NOT NULL THEN
    SELECT rede_id INTO _celula_rede FROM celulas WHERE id = NEW.celula_id;
    IF _celula_rede IS NOT NULL THEN
      NEW.rede_id := _celula_rede;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_rede_id_member
  BEFORE INSERT OR UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_rede_id_on_member();

-- 3. Trigger: auto-populate encaminhamentos_recomeco.rede_id from celulas
CREATE OR REPLACE FUNCTION public.auto_set_rede_id_on_encaminhamento()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  _celula_rede uuid;
BEGIN
  IF NEW.celula_id IS NOT NULL AND NEW.rede_id IS NULL THEN
    SELECT rede_id INTO _celula_rede FROM celulas WHERE id = NEW.celula_id;
    IF _celula_rede IS NOT NULL THEN
      NEW.rede_id := _celula_rede;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_rede_id_encaminhamento
  BEFORE INSERT OR UPDATE ON public.encaminhamentos_recomeco
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_rede_id_on_encaminhamento();

-- 4. Trigger: auto-populate weekly_reports.rede_id from celulas
CREATE OR REPLACE FUNCTION public.auto_set_rede_id_on_weekly_report()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  _celula_rede uuid;
BEGIN
  IF NEW.celula_id IS NOT NULL AND NEW.rede_id IS NULL THEN
    SELECT rede_id INTO _celula_rede FROM celulas WHERE id = NEW.celula_id;
    IF _celula_rede IS NOT NULL THEN
      NEW.rede_id := _celula_rede;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_rede_id_weekly_report
  BEFORE INSERT OR UPDATE ON public.weekly_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_rede_id_on_weekly_report();

-- 5. Fix existing data: backfill rede_id on celulas from coordenacoes
UPDATE celulas c
SET rede_id = co.rede_id
FROM coordenacoes co
WHERE c.coordenacao_id = co.id
  AND (c.rede_id IS NULL OR c.rede_id != co.rede_id);

-- 6. Fix existing data: backfill rede_id on members from celulas
UPDATE members m
SET rede_id = c.rede_id
FROM celulas c
WHERE m.celula_id = c.id
  AND c.rede_id IS NOT NULL
  AND (m.rede_id IS NULL OR m.rede_id != c.rede_id);

-- 7. Fix existing data: backfill rede_id on encaminhamentos from celulas
UPDATE encaminhamentos_recomeco e
SET rede_id = c.rede_id
FROM celulas c
WHERE e.celula_id = c.id
  AND c.rede_id IS NOT NULL
  AND e.rede_id IS NULL;

-- 8. Fix existing data: backfill rede_id on weekly_reports from celulas
UPDATE weekly_reports w
SET rede_id = c.rede_id
FROM celulas c
WHERE w.celula_id = c.id
  AND c.rede_id IS NOT NULL
  AND w.rede_id IS NULL;
