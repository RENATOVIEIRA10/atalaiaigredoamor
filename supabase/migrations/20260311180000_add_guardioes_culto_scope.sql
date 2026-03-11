-- Add guardioes_culto to access_keys scope_type check constraint
ALTER TABLE public.access_keys DROP CONSTRAINT access_keys_scope_type_check;
ALTER TABLE public.access_keys ADD CONSTRAINT access_keys_scope_type_check CHECK (scope_type = ANY (ARRAY[
  'pastor'::text, 'admin'::text, 'rede'::text, 'coordenacao'::text, 'supervisor'::text, 'celula'::text,
  'demo_institucional'::text, 'recomeco_operador'::text, 'recomeco_leitura'::text, 'recomeco_cadastro'::text,
  'central_celulas'::text, 'lider_recomeco_central'::text, 'lider_batismo_aclamacao'::text,
  'operador_recomeco'::text, 'operador_central'::text, 'demo_guiada'::text, 'leitura_pastoral'::text,
  'central_batismo_aclamacao'::text, 'pastor_de_campo'::text, 'pastor_senior_global'::text,
  'guardioes_culto'::text
]));
