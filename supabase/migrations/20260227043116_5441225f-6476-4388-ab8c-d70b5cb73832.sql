
-- Drop old constraint first
ALTER TABLE public.access_keys DROP CONSTRAINT IF EXISTS access_keys_scope_type_check;

-- Migrate existing access_keys
UPDATE public.access_keys
SET scope_type = 'lider_batismo_aclamacao'
WHERE scope_type IN ('lider_batismo', 'lider_aclamacao');

-- Migrate user_access_links
UPDATE public.user_access_links
SET scope_type = 'lider_batismo_aclamacao'
WHERE scope_type IN ('lider_batismo', 'lider_aclamacao');

-- Re-add constraint with unified scope
ALTER TABLE public.access_keys ADD CONSTRAINT access_keys_scope_type_check CHECK (
  scope_type = ANY (ARRAY[
    'pastor','admin','rede','coordenacao','supervisor','celula',
    'demo_institucional','recomeco_operador','recomeco_leitura','recomeco_cadastro',
    'central_celulas','lider_recomeco_central','lider_batismo_aclamacao',
    'operador_recomeco','operador_central','demo_guiada','leitura_pastoral'
  ])
);
