
-- Supervisores: adicionar couple e ordem
ALTER TABLE public.supervisores ADD COLUMN IF NOT EXISTS leadership_couple_id UUID REFERENCES public.leadership_couples(id);
ALTER TABLE public.supervisores ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 0;

-- Coordenacoes: adicionar ordem
ALTER TABLE public.coordenacoes ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 0;

-- Celulas: adicionar ordem e supervisor_id
ALTER TABLE public.celulas ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 0;
ALTER TABLE public.celulas ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES public.supervisores(id);
