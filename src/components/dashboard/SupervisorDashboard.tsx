import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ClipboardCheck, Plus, Eye, Calendar, Activity } from 'lucide-react';
import { useCoordenacoes } from '@/hooks/useCoordenacoes';
import { useSupervisores, useSupervisoesBySupervisor, Supervisao } from '@/hooks/useSupervisoes';
import { useCelulas } from '@/hooks/useCelulas';
import { SupervisaoFormDialog } from './supervisor/SupervisaoFormDialog';
import { SupervisaoDetailsDialog } from './supervisor/SupervisaoDetailsDialog';
import { RadarSaudeSupervisorPanel } from './supervisor/RadarSaudeSupervisorPanel';
import { PlanejamentoBimestralPanel } from './supervisor/PlanejamentoBimestralPanel';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PageHeader } from '@/components/ui/page-header';
import { MissionVerse } from './MissionVerse';
import { EmptyState } from '@/components/ui/empty-state';
import { useRole } from '@/contexts/RoleContext';
import { RevelaShortcut } from './RevelaShortcut';

export function SupervisorDashboard() {
  const { data: coordenacoes, isLoading: coordenacoesLoading } = useCoordenacoes();
  const { data: supervisores, isLoading: supervisoresLoading } = useSupervisores();
  const { scopeId, scopeType } = useRole();
  
  // Auto-set from scope
  const autoSupervisor = scopeType === 'supervisor' && scopeId ? supervisores?.find(s => s.id === scopeId) : null;
  const defaultCoord = autoSupervisor?.coordenacao_id || '';
  const defaultSup = autoSupervisor?.id || '';

  const [selectedCoordenacao, setSelectedCoordenacao] = useState<string>(defaultCoord);
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>(defaultSup);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSupervisao, setSelectedSupervisao] = useState<Supervisao | null>(null);
  
  const { data: celulas } = useCelulas();
  const { data: supervisoes, isLoading: supervisoesLoading } = useSupervisoesBySupervisor(selectedSupervisor);

  // Auto-select when data loads
  if (scopeType === 'supervisor' && scopeId && !selectedSupervisor && supervisores) {
    const sup = supervisores.find(s => s.id === scopeId);
    if (sup) {
      setSelectedCoordenacao(sup.coordenacao_id);
      setSelectedSupervisor(sup.id);
    }
  }

  const filteredSupervisores = supervisores?.filter(s => !selectedCoordenacao || s.coordenacao_id === selectedCoordenacao) || [];
  const filteredCelulas = celulas?.filter(c => c.coordenacao_id === selectedCoordenacao) || [];

  if (coordenacoesLoading || supervisoresLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard do Supervisor"
        subtitle="Registre e acompanhe suas supervisões de células"
        icon={ClipboardCheck}
      />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <MissionVerse role="supervisor" />
        <RevelaShortcut />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Coordenação</p>
            <Select value={selectedCoordenacao} onValueChange={(value) => { setSelectedCoordenacao(value); setSelectedSupervisor(''); }}>
              <SelectTrigger><SelectValue placeholder="Selecione uma coordenação" /></SelectTrigger>
              <SelectContent>
                {coordenacoes?.map(coord => (<SelectItem key={coord.id} value={coord.id}>{coord.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Supervisor</p>
            <Select value={selectedSupervisor} onValueChange={setSelectedSupervisor} disabled={!selectedCoordenacao}>
              <SelectTrigger><SelectValue placeholder={selectedCoordenacao ? "Selecione seu perfil" : "Selecione a coordenação primeiro"} /></SelectTrigger>
              <SelectContent>
                {filteredSupervisores.map(sup => {
                  const displayName = sup.leadership_couple 
                    ? `${sup.leadership_couple.spouse1?.name || ''} & ${sup.leadership_couple.spouse2?.name || ''}`
                    : sup.profile?.name || 'Supervisor';
                  return <SelectItem key={sup.id} value={sup.id}>{displayName}</SelectItem>;
                })}
              </SelectContent>
            </Select>
            {selectedCoordenacao && filteredSupervisores.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2">Nenhum supervisor nesta coordenação.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedSupervisor && (
        <>
          <Card className="border-l-4 border-l-primary">
            <CardContent className="py-4 px-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Nova Supervisão</h3>
                  <p className="text-xs text-muted-foreground">Registre uma visita de supervisão</p>
                </div>
                <Button onClick={() => setIsFormOpen(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />Registrar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabs: Radar, Planejamento, Histórico */}
          <Tabs defaultValue="radar" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="radar" className="text-xs gap-1">
                <Activity className="h-3.5 w-3.5" />
                Radar
              </TabsTrigger>
              <TabsTrigger value="planejamento" className="text-xs gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Planejamento
              </TabsTrigger>
              <TabsTrigger value="historico" className="text-xs gap-1">
                <ClipboardCheck className="h-3.5 w-3.5" />
                Histórico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="radar">
              <RadarSaudeSupervisorPanel
                supervisorId={selectedSupervisor}
                coordenacaoId={selectedCoordenacao}
              />
            </TabsContent>

            <TabsContent value="planejamento">
              <PlanejamentoBimestralPanel
                supervisorId={selectedSupervisor}
                coordenacaoId={selectedCoordenacao}
              />
            </TabsContent>

            <TabsContent value="historico">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-primary" />
                    Histórico de Supervisões
                  </CardTitle>
                  <CardDescription>{supervisoes?.length || 0} supervisão(ões)</CardDescription>
                </CardHeader>
                <CardContent>
                  {supervisoesLoading ? (
                    <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                  ) : supervisoes && supervisoes.length > 0 ? (
                    <div className="space-y-3">
                      {supervisoes.map(supervisao => (
                        <Card key={supervisao.id}
                          className={`cursor-pointer card-hover border-l-4 ${supervisao.celula_realizada ? 'border-l-green-500' : 'border-l-destructive'}`}
                          onClick={() => setSelectedSupervisao(supervisao)}>
                          <CardContent className="py-3 px-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(supervisao.data_supervisao), "dd/MM/yyyy", { locale: ptBR })}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm">{supervisao.celula?.name}</h4>
                                  <p className="text-xs text-muted-foreground">{supervisao.horario_inicio} - {supervisao.horario_termino}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={supervisao.celula_realizada ? "default" : "destructive"} className="text-xs">
                                  {supervisao.celula_realizada ? 'Realizada' : 'Não Realizada'}
                                </Badge>
                                <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon={ClipboardCheck} title="Nenhuma supervisão" description='Clique em "Registrar" para começar' />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {!selectedSupervisor && selectedCoordenacao && filteredSupervisores.length > 0 && (
        <EmptyState icon={ClipboardCheck} title="Selecione seu perfil" description="Identifique-se como supervisor para registrar supervisões" />
      )}

      {!selectedCoordenacao && (
        <EmptyState icon={ClipboardCheck} title="Selecione uma coordenação" description="Escolha sua coordenação para começar" />
      )}

      <SupervisaoFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} supervisorId={selectedSupervisor} celulas={filteredCelulas} />
      {selectedSupervisao && (
        <SupervisaoDetailsDialog open={!!selectedSupervisao} onOpenChange={(open) => !open && setSelectedSupervisao(null)} supervisao={selectedSupervisao} />
      )}
    </div>
  );
}
