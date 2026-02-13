-- Add 'pastor' to the scope_type check constraint on access_keys
ALTER TABLE public.access_keys DROP CONSTRAINT IF EXISTS access_keys_scope_type_check;
ALTER TABLE public.access_keys ADD CONSTRAINT access_keys_scope_type_check CHECK (scope_type IN ('admin', 'rede', 'coordenacao', 'supervisor', 'celula', 'pastor'));