
-- Add created_by (auth user_id) to supervisoes for audit trail
ALTER TABLE public.supervisoes
ADD COLUMN created_by uuid NULL;

-- Add created_by_user_id to encaminhamentos_recomeco (proper uuid audit)
ALTER TABLE public.encaminhamentos_recomeco
ADD COLUMN created_by_user_id uuid NULL;
