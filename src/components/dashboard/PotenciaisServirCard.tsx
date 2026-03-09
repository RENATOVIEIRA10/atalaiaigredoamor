import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Heart } from 'lucide-react';
import { useGlobalPastoralRanking } from '@/hooks/useGlobalPastoralRanking';

interface PotenciaisServirCardProps {
  campoId?: string | null;
  coordenacaoId?: string | null;
  redeId?: string | null;
}

export function PotenciaisServirCard({ campoId, coordenacaoId, redeId }: PotenciaisServirCardProps) {
  const { data, isLoading } = useGlobalPastoralRanking({ campoId, coordenacaoId, redeId });

  if (isLoading) return <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />;
  if (!data) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">⭐ Potenciais para Servir</CardTitle>
          <CardDescription className="text-xs">
            {data.potentialsCount} membro(s) disponíveis e sem função ativa
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.potentials.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhum potencial identificado</p>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {data.potentials.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.celula_name} · {m.anos_igreja}a</p>
                    </div>
                    <div className="flex gap-1 flex-wrap justify-end ml-2">
                      {m.marcos.map(marco => (<Badge key={marco} variant="secondary" className="text-[10px]">{marco}</Badge>))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">🙌 Já Servem</CardTitle>
          <CardDescription className="text-xs">
            {data.servingCount} membro(s) atuando em ministérios
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.serving.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhum membro registrado</p>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {data.serving.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.celula_name}</p>
                    </div>
                    <div className="flex gap-1 flex-wrap justify-end ml-2">
                      {m.ministerios.map(min => (<Badge key={min} variant="outline" className="text-[10px]">{min}</Badge>))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
