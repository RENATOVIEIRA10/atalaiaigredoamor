
-- Safety-net trigger: auto-resolve campo_id on novas_vidas insert
CREATE OR REPLACE FUNCTION public.auto_set_campo_id_on_nova_vida()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.campo_id IS NULL THEN
    -- Try to resolve from user_access_links
    SELECT campo_id INTO NEW.campo_id
    FROM public.user_access_links
    WHERE user_id = auth.uid()
      AND active = true
      AND campo_id IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF NEW.campo_id IS NULL THEN
      RAISE EXCEPTION 'campo_id é obrigatório para cadastrar nova vida. Seu acesso não está vinculado a um campus.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_campo_id_novas_vidas
BEFORE INSERT ON public.novas_vidas
FOR EACH ROW
EXECUTE FUNCTION public.auto_set_campo_id_on_nova_vida();
