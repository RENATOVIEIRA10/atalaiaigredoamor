
ALTER TABLE public.access_keys DROP CONSTRAINT access_keys_scope_type_check;
ALTER TABLE public.access_keys ADD CONSTRAINT access_keys_scope_type_check CHECK (
  scope_type = ANY (ARRAY[
    'pastor'::text, 'admin'::text, 'rede'::text, 'coordenacao'::text,
    'supervisor'::text, 'celula'::text, 'demo_institucional'::text,
    'recomeco_operador'::text, 'recomeco_leitura'::text,
    'recomeco_cadastro'::text, 'central_celulas'::text
  ])
);
