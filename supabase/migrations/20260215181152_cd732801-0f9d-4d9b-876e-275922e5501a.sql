-- Remove duplicate unique constraint (redundant with weekly_reports_celula_week_unique)
ALTER TABLE public.weekly_reports DROP CONSTRAINT IF EXISTS weekly_reports_celula_id_week_start_key;
