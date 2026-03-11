-- Guardião de Culto: enhancements to culto_contagens
-- 1) Add guardiao_nome and culto_titulo for richer identification
-- 2) Allow anon inserts for offline-first PWA sync

ALTER TABLE culto_contagens
  ADD COLUMN IF NOT EXISTS guardiao_nome text,
  ADD COLUMN IF NOT EXISTS culto_titulo text;

COMMENT ON COLUMN culto_contagens.guardiao_nome IS 'Display name of the Guardião who performed the count';
COMMENT ON COLUMN culto_contagens.culto_titulo IS 'Optional label for the service (e.g. "Culto de Domingo Manhã")';

-- Allow anon upserts for offline-first PWA support
-- (campo_id scoping prevents cross-campus data leaks at app level)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'culto_contagens'
      AND policyname = 'Anon can insert culto contagens for offline sync'
  ) THEN
    CREATE POLICY "Anon can insert culto contagens for offline sync"
      ON culto_contagens FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;
END $$;
