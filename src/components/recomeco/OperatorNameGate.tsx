import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OperatorNameGateProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

/**
 * Gate that ensures the logged-in user has a proper name set in their profile.
 * Used for Central de Células operators who share a single access code.
 * On first access, prompts for full name if profile still has the default "Novo Usuário".
 */
export function OperatorNameGate({ children, title, description }: OperatorNameGateProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['my_profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, user_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const [nome, setNome] = useState('');

  const updateName = useMutation({
    mutationFn: async (name: string) => {
      if (!profile) throw new Error('Perfil não encontrado');
      const { error } = await supabase
        .from('profiles')
        .update({ name })
        .eq('id', profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my_profile'] });
      qc.invalidateQueries({ queryKey: ['profiles'] });
      toast({ title: 'Nome atualizado com sucesso!' });
    },
    onError: (e: any) => {
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Profile has a real name (not default) — allow through
  const hasRealName = profile?.name && profile.name !== 'Novo Usuário' && profile.name.trim().length > 2;
  if (hasRealName) {
    return <>{children}</>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || nome.trim().length < 3) return;
    updateName.mutate(nome.trim());
  };

  return (
    <Card className="bg-white/5 border-white/10">
      <CardContent className="p-6 space-y-5">
        <div className="text-center space-y-2">
          <UserCircle className="h-12 w-12 mx-auto" style={{ color: '#C5A059' }} />
          <h2 className="text-lg font-semibold" style={{ color: '#F4EDE4' }}>
            {title || 'Identificação do Operador'}
          </h2>
          <p className="text-sm" style={{ color: '#B8B6B3' }}>
            {description || 'Para garantir rastreabilidade, informe seu nome completo no primeiro acesso.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label style={{ color: '#C5A059' }}>Nome Completo *</Label>
            <Input
              value={nome}
              onChange={e => setNome(e.target.value)}
              className="bg-white/5 border-white/10 text-[#F4EDE4] h-12"
              placeholder="Seu nome completo"
              required
              minLength={3}
              autoFocus
            />
          </div>
          <Button
            type="submit"
            className="w-full h-12"
            disabled={updateName.isPending || nome.trim().length < 3}
            style={{ background: 'linear-gradient(135deg, #C5A059, #D4B366)', color: '#1A2F4B' }}
          >
            {updateName.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Confirmar e Continuar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
