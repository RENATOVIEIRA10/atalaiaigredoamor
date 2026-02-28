-- Add 'queued' to the seed_runs status check constraint
ALTER TABLE public.seed_runs DROP CONSTRAINT seed_runs_status_check;
ALTER TABLE public.seed_runs ADD CONSTRAINT seed_runs_status_check CHECK (status = ANY (ARRAY['queued'::text, 'running'::text, 'done'::text, 'failed'::text]));
