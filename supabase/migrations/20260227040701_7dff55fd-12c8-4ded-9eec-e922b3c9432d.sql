
ALTER TABLE public.access_keys DROP CONSTRAINT access_keys_scope_type_check;

ALTER TABLE public.access_keys ADD CONSTRAINT access_keys_scope_type_check CHECK (
  scope_type = ANY (ARRAY[
    'pastor','admin','rede','coordenacao','supervisor','celula',
    'demo_institucional','recomeco_operador','recomeco_leitura','recomeco_cadastro',
    'central_celulas','lider_recomeco_central','lider_batismo','lider_aclamacao',
    'operador_recomeco','operador_central','demo_guiada','leitura_pastoral'
  ])
);
