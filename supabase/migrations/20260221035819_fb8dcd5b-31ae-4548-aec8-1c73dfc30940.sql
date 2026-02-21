
-- Table for supervision swap proposals ("bate-bola") between supervisors
CREATE TABLE public.supervision_swaps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bimestre_start DATE NOT NULL,
  proposer_supervisor_id UUID NOT NULL REFERENCES public.supervisores(id) ON DELETE CASCADE,
  proposer_celula_id UUID NOT NULL REFERENCES public.celulas(id) ON DELETE CASCADE,
  target_supervisor_id UUID NOT NULL REFERENCES public.supervisores(id) ON DELETE CASCADE,
  target_celula_id UUID NOT NULL REFERENCES public.celulas(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT no_self_swap CHECK (proposer_supervisor_id != target_supervisor_id)
);

-- Enable RLS
ALTER TABLE public.supervision_swaps ENABLE ROW LEVEL SECURITY;

-- Policies (same pattern as other tables in this project)
CREATE POLICY "Supervision swaps viewable by everyone"
  ON public.supervision_swaps FOR SELECT USING (true);

CREATE POLICY "Anyone can manage supervision swaps"
  ON public.supervision_swaps FOR ALL USING (true) WITH CHECK (true);
