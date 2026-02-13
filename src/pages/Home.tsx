import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '@/contexts/RoleContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, AlertCircle, KeyRound, Loader2 } from 'lucide-react';
import logoAnoSantidade from '@/assets/logo-ano-santidade.png';
import { useValidateAccessCode } from '@/hooks/useAccessKeys';
import { supabase } from '@/integrations/supabase/client';

export default function HomePage() {
  const navigate = useNavigate();
  const { setScopeAccess } = useRole();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const normalizedCode = code.trim();

      // Query access_keys
      const { data, error: queryError } = await supabase
        .from('access_keys')
        .select('*')
        .eq('active', true);

      if (queryError) throw new Error('Erro ao validar código');

      // Find matching code (case-insensitive)
      const match = data?.find(k => k.code.toLowerCase() === normalizedCode.toLowerCase());

      if (!match) {
        setAttempts(prev => prev + 1);
        setError('Código inválido. Verifique e tente novamente.');
        setIsLoading(false);
        return;
      }

      // Check blocked
      if (match.failed_attempts >= 5) {
        setError('Código bloqueado por tentativas excessivas. Contate o administrador.');
        setIsLoading(false);
        return;
      }

      // Update last_used_at
      await supabase
        .from('access_keys')
        .update({ last_used_at: new Date().toISOString(), failed_attempts: 0 })
        .eq('id', match.id);

      // Set scope access
      const scopeType = match.scope_type as 'admin' | 'rede' | 'coordenacao' | 'supervisor' | 'celula';
      setScopeAccess(scopeType, match.scope_id);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao validar código');

      // Increment failed attempts for the code if it exists
      const { data: keys } = await supabase
        .from('access_keys')
        .select('id, failed_attempts')
        .ilike('code', code.trim())
        .eq('active', true);

      if (keys && keys.length > 0) {
        await supabase
          .from('access_keys')
          .update({ failed_attempts: (keys[0].failed_attempts || 0) + 1 })
          .eq('id', keys[0].id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent via-background to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <img src={logoAnoSantidade} alt="Igreja do Amor – Ano da Santidade 2026" className="h-32 w-auto object-contain" />
          </div>
          <p className="text-muted-foreground mt-1 text-lg tracking-wide">REDE AMOR A 2</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-3">
              <div className="p-3 rounded-2xl bg-primary/10">
                <KeyRound className="h-7 w-7 text-primary" />
              </div>
            </div>
            <CardTitle className="text-xl">Entrar com Código</CardTitle>
            <CardDescription>
              Digite o código de acesso fornecido pelo seu líder ou administrador.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="access-code">Código de Acesso</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="access-code"
                    type="text"
                    placeholder="Ex: redeamor-4K7P2A"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      setError('');
                    }}
                    className={`pl-10 ${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    autoFocus
                    autoComplete="off"
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                {attempts >= 3 && (
                  <p className="text-xs text-muted-foreground">
                    💡 Não tem um código? Entre em contato com o administrador ou líder da sua rede.
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={!code.trim() || isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Lock className="h-4 w-4 mr-2" />
                )}
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          🔒 Cada código dá acesso ao nível correspondente da hierarquia
        </p>
      </div>
    </div>
  );
}
