
-- =============================================
-- MULTI-CAMPUS: campo_id OBRIGATÓRIO + INTEGRIDADE
-- Backfill em cadeia: rede → coord → celula → member/report/supervisao
-- =============================================

-- 1. BACKFILL: coordenacoes ← redes
UPDATE coordenacoes c
SET campo_id = r.campo_id
FROM redes r
WHERE c.rede_id = r.id AND c.campo_id IS NULL AND r.campo_id IS NOT NULL;

-- 2. BACKFILL: celulas ← coordenacoes (now all coords have campo_id)
UPDATE celulas cel
SET campo_id = co.campo_id
FROM coordenacoes co
WHERE cel.coordenacao_id = co.id AND cel.campo_id IS NULL AND co.campo_id IS NOT NULL;

-- 3. BACKFILL: members ← celulas
UPDATE members m
SET campo_id = c.campo_id
FROM celulas c
WHERE m.celula_id = c.id AND m.campo_id IS NULL AND c.campo_id IS NOT NULL;

-- 4. BACKFILL: weekly_reports ← celulas
UPDATE weekly_reports wr
SET campo_id = c.campo_id
FROM celulas c
WHERE wr.celula_id = c.id AND wr.campo_id IS NULL AND c.campo_id IS NOT NULL;

-- 5. BACKFILL: supervisoes ← celulas
UPDATE supervisoes s
SET campo_id = c.campo_id
FROM celulas c
WHERE s.celula_id = c.id AND s.campo_id IS NULL AND c.campo_id IS NOT NULL;

-- 6. BACKFILL: novas_vidas ← celulas (via assigned_cell_id)
UPDATE novas_vidas nv
SET campo_id = c.campo_id
FROM celulas c
WHERE nv.assigned_cell_id = c.id AND nv.campo_id IS NULL AND c.campo_id IS NOT NULL;

-- 7. BACKFILL: novas_vidas sem célula → Paulista (dados históricos pré-multi-campus)
UPDATE novas_vidas
SET campo_id = '3f895fc6-7293-4014-8905-b78c7d3453cb'
WHERE campo_id IS NULL;

-- 8. BACKFILL: access_keys ← redes (where possible)
UPDATE access_keys ak
SET campo_id = r.campo_id
FROM redes r
WHERE ak.rede_id = r.id AND ak.campo_id IS NULL AND r.campo_id IS NOT NULL;

-- 9. BACKFILL: leadership_functions ← redes
UPDATE leadership_functions lf
SET campo_id = r.campo_id
FROM redes r
WHERE lf.rede_id = r.id AND lf.campo_id IS NULL AND r.campo_id IS NOT NULL;

-- 10. BACKFILL: user_access_links ← access_keys
UPDATE user_access_links ual
SET campo_id = ak.campo_id
FROM access_keys ak
WHERE ual.access_key_id = ak.id AND ual.campo_id IS NULL AND ak.campo_id IS NOT NULL;

-- =============================================
-- MAKE NOT NULL on data tables
-- (auth/scope tables keep nullable for global roles)
-- =============================================
ALTER TABLE redes ALTER COLUMN campo_id SET NOT NULL;
ALTER TABLE coordenacoes ALTER COLUMN campo_id SET NOT NULL;
ALTER TABLE celulas ALTER COLUMN campo_id SET NOT NULL;
ALTER TABLE members ALTER COLUMN campo_id SET NOT NULL;
ALTER TABLE weekly_reports ALTER COLUMN campo_id SET NOT NULL;
ALTER TABLE supervisoes ALTER COLUMN campo_id SET NOT NULL;
ALTER TABLE roteiros_celula ALTER COLUMN campo_id SET NOT NULL;
ALTER TABLE discipulado_encontros ALTER COLUMN campo_id SET NOT NULL;
ALTER TABLE discipulado_presencas ALTER COLUMN campo_id SET NOT NULL;
ALTER TABLE encaminhamentos_recomeco ALTER COLUMN campo_id SET NOT NULL;
ALTER TABLE event_registrations ALTER COLUMN campo_id SET NOT NULL;
ALTER TABLE events_spiritual ALTER COLUMN campo_id SET NOT NULL;
ALTER TABLE novas_vidas ALTER COLUMN campo_id SET NOT NULL;

-- =============================================
-- INDEXES for campus filtering performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_redes_campo_id ON redes(campo_id);
CREATE INDEX IF NOT EXISTS idx_coordenacoes_campo_id ON coordenacoes(campo_id);
CREATE INDEX IF NOT EXISTS idx_celulas_campo_id ON celulas(campo_id);
CREATE INDEX IF NOT EXISTS idx_members_campo_id ON members(campo_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_campo_id ON weekly_reports(campo_id);
CREATE INDEX IF NOT EXISTS idx_supervisoes_campo_id ON supervisoes(campo_id);
CREATE INDEX IF NOT EXISTS idx_novas_vidas_campo_id ON novas_vidas(campo_id);
CREATE INDEX IF NOT EXISTS idx_encaminhamentos_campo_id ON encaminhamentos_recomeco(campo_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_campo_id ON event_registrations(campo_id);
CREATE INDEX IF NOT EXISTS idx_discipulado_encontros_campo_id ON discipulado_encontros(campo_id);
CREATE INDEX IF NOT EXISTS idx_discipulado_presencas_campo_id ON discipulado_presencas(campo_id);
CREATE INDEX IF NOT EXISTS idx_roteiros_celula_campo_id ON roteiros_celula(campo_id);

-- =============================================
-- VALIDATION TRIGGERS: parent-child campus consistency
-- =============================================

-- Trigger: coordenacao.campo_id must match rede.campo_id
CREATE OR REPLACE FUNCTION public.validate_coordenacao_campo()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE _rede_campo uuid;
BEGIN
  SELECT campo_id INTO _rede_campo FROM redes WHERE id = NEW.rede_id;
  IF _rede_campo IS DISTINCT FROM NEW.campo_id THEN
    RAISE EXCEPTION 'campo_id da coordenação (%) diverge da rede (%)', NEW.campo_id, _rede_campo;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_coordenacao_campo
BEFORE INSERT OR UPDATE ON coordenacoes
FOR EACH ROW EXECUTE FUNCTION validate_coordenacao_campo();

-- Trigger: celula.campo_id must match coordenacao.campo_id
CREATE OR REPLACE FUNCTION public.validate_celula_campo()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE _coord_campo uuid;
BEGIN
  SELECT campo_id INTO _coord_campo FROM coordenacoes WHERE id = NEW.coordenacao_id;
  IF _coord_campo IS DISTINCT FROM NEW.campo_id THEN
    RAISE EXCEPTION 'campo_id da célula (%) diverge da coordenação (%)', NEW.campo_id, _coord_campo;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_celula_campo
BEFORE INSERT OR UPDATE ON celulas
FOR EACH ROW EXECUTE FUNCTION validate_celula_campo();

-- Trigger: member.campo_id must match celula.campo_id
CREATE OR REPLACE FUNCTION public.validate_member_campo()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE _celula_campo uuid;
BEGIN
  SELECT campo_id INTO _celula_campo FROM celulas WHERE id = NEW.celula_id;
  IF _celula_campo IS DISTINCT FROM NEW.campo_id THEN
    RAISE EXCEPTION 'campo_id do membro (%) diverge da célula (%)', NEW.campo_id, _celula_campo;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_member_campo
BEFORE INSERT OR UPDATE ON members
FOR EACH ROW EXECUTE FUNCTION validate_member_campo();

-- Trigger: weekly_report.campo_id must match celula.campo_id
CREATE OR REPLACE FUNCTION public.validate_weekly_report_campo()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE _celula_campo uuid;
BEGIN
  SELECT campo_id INTO _celula_campo FROM celulas WHERE id = NEW.celula_id;
  IF _celula_campo IS DISTINCT FROM NEW.campo_id THEN
    RAISE EXCEPTION 'campo_id do relatório (%) diverge da célula (%)', NEW.campo_id, _celula_campo;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_weekly_report_campo
BEFORE INSERT OR UPDATE ON weekly_reports
FOR EACH ROW EXECUTE FUNCTION validate_weekly_report_campo();

-- Trigger: supervisao.campo_id must match celula.campo_id
CREATE OR REPLACE FUNCTION public.validate_supervisao_campo()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE _celula_campo uuid;
BEGIN
  SELECT campo_id INTO _celula_campo FROM celulas WHERE id = NEW.celula_id;
  IF _celula_campo IS DISTINCT FROM NEW.campo_id THEN
    RAISE EXCEPTION 'campo_id da supervisão (%) diverge da célula (%)', NEW.campo_id, _celula_campo;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_supervisao_campo
BEFORE INSERT OR UPDATE ON supervisoes
FOR EACH ROW EXECUTE FUNCTION validate_supervisao_campo();

-- =============================================
-- HELPER: get user's campus (for RLS)
-- =============================================
CREATE OR REPLACE FUNCTION public.user_belongs_to_campo(_user_id uuid, _campo_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.user_access_links
      WHERE user_id = _user_id AND active = true AND campo_id = _campo_id
    )
    OR EXISTS (
      SELECT 1 FROM public.campo_pastores
      WHERE profile_id = (SELECT id FROM profiles WHERE user_id = _user_id LIMIT 1)
        AND campo_id = _campo_id
    )
    OR EXISTS (
      -- pastor_senior_global can see everything
      SELECT 1 FROM public.user_access_links
      WHERE user_id = _user_id AND active = true AND scope_type = 'pastor_senior_global'
    )
$$;
