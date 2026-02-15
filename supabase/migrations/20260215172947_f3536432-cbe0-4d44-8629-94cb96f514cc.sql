-- Prevent duplicate reports for the same cell in the same week
-- First, remove any duplicates keeping only the most recent
DELETE FROM public.weekly_reports a
USING public.weekly_reports b
WHERE a.celula_id = b.celula_id
  AND a.week_start = b.week_start
  AND a.created_at < b.created_at;

-- Add unique constraint
ALTER TABLE public.weekly_reports
  ADD CONSTRAINT weekly_reports_celula_week_unique UNIQUE (celula_id, week_start);