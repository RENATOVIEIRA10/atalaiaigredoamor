import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useCampo } from '@/contexts/CampoContext';
import { useRole } from '@/contexts/RoleContext';

/**
 * Gate component that blocks rendering if the user's scope requires a campus
 * but none is set. Shows a clear error instead of silently loading all data.
 */
export function ScopeMissingGate({ children }: { children: React.ReactNode }) {
  const { activeCampoId, isGlobalView } = useCampo();
  const { isPastorSeniorGlobal, isAdmin, selectedRole } = useRole();
  const navigate = useNavigate();

  const canGlobal = isPastorSeniorGlobal || isAdmin;

  // Global-capable users in global view → OK
  if (canGlobal && isGlobalView) return <>{children}</>;

  // Has campus → OK
  if (activeCampoId) return <>{children}</>;

  // Global-capable but no view set → also OK (they can switch)
  if (canGlobal) return <>{children}</>;

  // Scopes that don't require campus (demo, institutional, etc.)
  const exemptScopes = ['demo_institucional'];
  if (selectedRole && exemptScopes.includes(selectedRole)) return <>{children}</>;

  // ❌ Local scope without campus → BLOCK
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <Alert variant="destructive" className="shadow-lg">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-base font-semibold">Escopo sem campus</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p>
              Seu código de acesso não está vinculado a nenhum campus. 
              Sem essa informação, o sistema não pode exibir os dados corretamente.
            </p>
            <p className="text-sm opacity-80">
              Contate o administrador para que seu código seja associado ao campus correto.
            </p>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/')}>
                Voltar ao início
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/trocar-funcao')}>
                Trocar função
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
