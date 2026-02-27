import { useCampos, Campo } from '@/hooks/useCampos';
import { useCampo } from '@/contexts/CampoContext';
import { useRole } from '@/contexts/RoleContext';
import { MapPin, Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * CampoSelector — shown in the dashboard header for
 * pastor_senior_global and admin roles only.
 * Others see a fixed badge with their campo name.
 */
export function CampoSelector() {
  const { isPastorSeniorGlobal, isAdmin, isPastorDeCampo } = useRole();
  const { activeCampo, setActiveCampo, isGlobalView, setIsGlobalView } = useCampo();
  const { data: campos, isLoading } = useCampos();

  const canSelectCampo = isPastorSeniorGlobal || isAdmin;

  // Pastor de campo: show fixed badge
  if (isPastorDeCampo && !canSelectCampo) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">
        <MapPin className="h-3 w-3" />
        <span>{activeCampo?.nome ?? 'Campo'}</span>
      </div>
    );
  }

  // Only show for global roles
  if (!canSelectCampo) return null;

  if (isLoading || !campos) return null;

  const handleChange = (value: string) => {
    if (value === '__global__') {
      setIsGlobalView(true);
    } else {
      const campo = campos.find(c => c.id === value);
      if (campo) setActiveCampo({ id: campo.id, nome: campo.nome });
    }
  };

  const currentValue = isGlobalView ? '__global__' : (activeCampo?.id ?? '');

  return (
    <Select value={currentValue} onValueChange={handleChange}>
      <SelectTrigger className="h-8 w-auto min-w-[160px] max-w-[220px] text-xs border-primary/20 bg-primary/5">
        <div className="flex items-center gap-1.5">
          {isGlobalView ? <Globe className="h-3 w-3 text-primary" /> : <MapPin className="h-3 w-3 text-primary" />}
          <SelectValue placeholder="Selecione o campo" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__global__">
          <div className="flex items-center gap-1.5">
            <Globe className="h-3 w-3" />
            <span>Visão Global</span>
          </div>
        </SelectItem>
        {campos.map(campo => (
          <SelectItem key={campo.id} value={campo.id}>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3" />
              <span>{campo.nome}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
