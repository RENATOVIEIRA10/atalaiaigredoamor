-- Índices para performance em weekly_reports
CREATE INDEX IF NOT EXISTS idx_weekly_reports_celula_id ON public.weekly_reports (celula_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_week_start ON public.weekly_reports (week_start);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_meeting_date ON public.weekly_reports (meeting_date);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_celula_week ON public.weekly_reports (celula_id, week_start);

-- Índices para performance em meetings
CREATE INDEX IF NOT EXISTS idx_meetings_celula_id ON public.meetings (celula_id);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON public.meetings (date);

-- Índices para performance em attendances
CREATE INDEX IF NOT EXISTS idx_attendances_meeting_id ON public.attendances (meeting_id);
CREATE INDEX IF NOT EXISTS idx_attendances_present ON public.attendances (meeting_id, present);

-- Índice para members
CREATE INDEX IF NOT EXISTS idx_members_celula_id ON public.members (celula_id);
CREATE INDEX IF NOT EXISTS idx_members_is_active ON public.members (is_active);
