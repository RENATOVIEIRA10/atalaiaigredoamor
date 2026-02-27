import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Campo {
  id: string;
  nome: string;
  cidade: string | null;
  estado: string | null;
  pais: string | null;
  endereco: string | null;
  horarios_culto: string | null;
  ativo: boolean;
  created_at: string;
}

export function useCampos() {
  return useQuery({
    queryKey: ['campos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campos')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      return data as Campo[];
    },
  });
}

/** Returns the Paulista (Sede) campo as default */
export function useDefaultCampo() {
  const { data: campos } = useCampos();
  return campos?.find(c => c.nome === 'Paulista (Sede)') ?? campos?.[0] ?? null;
}
