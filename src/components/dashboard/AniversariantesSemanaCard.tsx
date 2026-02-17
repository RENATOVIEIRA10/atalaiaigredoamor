import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Cake, Loader2 } from 'lucide-react';
import { useAniversariantesSemana } from '@/hooks/useAniversariantesSemana';

interface AniversariantesSemanaCardProps {
  scopeType: 'coordenacao' | 'rede';
  scopeId: string;
}

export function AniversariantesSemanaCard({ scopeType, scopeId }: AniversariantesSemanaCardProps) {
  const { data: aniversariantes, isLoading } = useAniversariantesSemana({ scopeType, scopeId });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <section>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">🎂 Aniversariantes da Semana</h2>
      <Card>
        <CardContent className="p-4">
          {aniversariantes && aniversariantes.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {aniversariantes.map((b) => (
                <div key={b.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={b.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">{b.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{b.name}</p>
                    <p className="text-xs text-muted-foreground">{b.celula_name} · {b.display_date}</p>
                  </div>
                  {b.is_today && <Badge className="bg-primary/10 text-primary text-xs">Hoje! 🎂</Badge>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum aniversário nesta semana</p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
