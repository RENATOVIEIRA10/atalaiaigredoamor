import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Users, Users2, Link2, Loader2, Plus, Trash2, ChevronDown, ChevronUp, FileText, History, Image, Send } from 'lucide-react';
import { Member, useMembers, useUpdateMember, useRemoveMember } from '@/hooks/useMembers';
import { useCasais, useDeleteCasal } from '@/hooks/useCasais';
import { useWeeklyReports, useCreateWeeklyReport, useUpdateWeeklyReport, useDeleteWeeklyReport, getCurrentWeekStart } from '@/hooks/useWeeklyReports';
import { useCelula } from '@/hooks/useCelulas';
import { MemberFormDialogSimple } from './cellleader/MemberFormDialogSimple';
import { CasalFormDialog } from './cellleader/CasalFormDialog';
import { CelulaPhotoUpload } from './cellleader/CelulaPhotoUpload';
import { CelulaPhotoGallery } from './CelulaPhotoGallery';
import { ReportsHistoryTable } from '@/components/reports/ReportsHistoryTable';
import { WhatsAppShareDialog } from './cellleader/WhatsAppShareDialog';
import { useToast } from '@/hooks/use-toast';
import { isSameWeek } from 'date-fns';

interface CelulaDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  celulaId: string;
  celulaName: string;
}

const MARCOS_ESPIRITUAIS = [
  { key: 'batismo', label: 'Batismo' },
  { key: 'encontro_com_deus', label: 'Encontro com Deus' },
  { key: 'renovo', label: 'Renovo' },
  { key: 'encontro_de_casais', label: 'Encontro de Casais' },
  { key: 'curso_lidere', label: 'Curso Lidere' },
  { key: 'is_discipulado', label: 'É Discipulado' },
  { key: 'is_lider_em_treinamento', label: 'Líder em Treinamento' },
] as const;

export function CelulaDetailsDialog({ open, onOpenChange, celulaId, celulaName }: CelulaDetailsDialogProps) {
  const { toast } = useToast();
  const { data: members, isLoading: membersLoading } = useMembers(celulaId);
  const { data: casais, isLoading: casaisLoading } = useCasais(celulaId);
  const { data: reports, isLoading: reportsLoading } = useWeeklyReports(celulaId);
  const { data: celulaData } = useCelula(celulaId);
  const updateMember = useUpdateMember();
  const removeMember = useRemoveMember();
  const deleteCasal = useDeleteCasal();
  const createReport = useCreateWeeklyReport();
  const updateReport = useUpdateWeeklyReport();
  const deleteReport = useDeleteWeeklyReport();

  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [casalDialogOpen, setCasalDialogOpen] = useState(false);
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
  const [lastReportData, setLastReportData] = useState<any>(null);

  const weekStart = getCurrentWeekStart();
  const [meetingDate, setMeetingDate] = useState('');
  const [membersPresent, setMembersPresent] = useState(0);
  const [leadersInTraining, setLeadersInTraining] = useState(0);
  const [discipleships, setDiscipleships] = useState(0);
  const [visitors, setVisitors] = useState(0);
  const [children, setChildren] = useState(0);
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [mensagemWa, setMensagemWa] = useState('');
  const [paixaoWa, setPaixaoWa] = useState('');
  const [culturaWa, setCulturaWa] = useState('');

  const isLoading = membersLoading || casaisLoading;

  const toggleExpanded = (memberId: string) => {
    setExpandedMembers(prev => { const next = new Set(prev); if (next.has(memberId)) next.delete(memberId); else next.add(memberId); return next; });
  };

  const handleMarcoChange = async (member: Member, marco: string, checked: boolean) => {
    await updateMember.mutateAsync({ id: member.id, [marco]: checked });
  };

  const handleRemoveMember = async (memberId: string) => {
    if (confirm('Tem certeza que deseja remover este membro?')) await removeMember.mutateAsync(memberId);
  };

  const handleRemoveCasal = async (casalId: string) => {
    if (confirm('Tem certeza que deseja remover este vínculo de casal?')) await deleteCasal.mutateAsync(casalId);
  };

  const getMarcoCount = (member: Member) => {
    let count = 0;
    if (member.batismo) count++; if (member.encontro_com_deus) count++; if (member.renovo) count++;
    if (member.encontro_de_casais) count++; if (member.curso_lidere) count++;
    if (member.is_discipulado) count++; if (member.is_lider_em_treinamento) count++;
    return count;
  };

  const membersInCouples = new Set<string>();
  casais?.forEach(casal => { membersInCouples.add(casal.member1_id); membersInCouples.add(casal.member2_id); });
  const availableMembers = members?.filter(m => !membersInCouples.has(m.id)) || [];

  const handleSubmitReport = async () => {
    if (!meetingDate) { toast({ title: 'Informe a data da reunião', variant: 'destructive' }); return; }
    try {
      await createReport.mutateAsync({
        celula_id: celulaId, week_start: weekStart, meeting_date: meetingDate,
        members_present: membersPresent, leaders_in_training: leadersInTraining,
        discipleships, visitors, children, notes: notes || undefined, photo_url: photoUrl,
        mensagem_whatsapp: mensagemWa || undefined,
        paixao_whatsapp: paixaoWa || undefined,
        cultura_whatsapp: culturaWa || undefined,
      });
      toast({ title: 'Relatório enviado com sucesso!' });
      
      // Prepare WhatsApp share data
      const cel = celulaData as any;
      setLastReportData({
        celula_name: celulaName,
        lider1_name: cel?.leadership_couple?.spouse1?.name || '',
        lider2_name: cel?.leadership_couple?.spouse2?.name || '',
        meeting_day: cel?.meeting_day || '',
        meeting_time: cel?.meeting_time || '',
        address: cel?.address || '',
        bairro: cel?.bairro || '',
        cidade: cel?.cidade || '',
        instagram_lider1: cel?.instagram_lider1 || '',
        instagram_lider2: cel?.instagram_lider2 || '',
        instagram_celula: cel?.instagram_celula || '',
        meeting_date: meetingDate,
        members_present: membersPresent,
        visitors,
        children,
        leaders_in_training: leadersInTraining,
        discipleships,
        mensagem: mensagemWa,
        paixao: 'PESSOAS',
        cultura: 'AMOR',
        photo_url: photoUrl,
      });
      setWhatsappDialogOpen(true);
      
      setMeetingDate(''); setMembersPresent(0); setLeadersInTraining(0);
      setDiscipleships(0); setVisitors(0); setChildren(0); setNotes(''); setPhotoUrl(null);
      setMensagemWa(''); setPaixaoWa(''); setCulturaWa('');
    } catch { toast({ title: 'Erro ao enviar relatório', variant: 'destructive' }); }
  };

  const handleEditReport = (data: { id: string; members_present: number; leaders_in_training: number; discipleships: number; visitors: number; children: number; notes: string | null; }) => {
    const report = (reports || []).find(r => r.id === data.id);
    if (report) {
      const reportDate = new Date(report.meeting_date || report.week_start);
      if (!isSameWeek(reportDate, new Date(), { weekStartsOn: 1 })) {
        toast({ title: 'Ação não permitida', description: 'Só pode editar da semana vigente', variant: 'destructive' });
        return;
      }
    }
    updateReport.mutate(data, {
      onSuccess: () => toast({ title: 'Relatório atualizado!' }),
      onError: () => toast({ title: 'Erro ao atualizar', variant: 'destructive' }),
    });
  };

  const handleDeleteReport = () => {
    toast({ title: 'Ação não permitida', description: 'Apenas coordenadores podem excluir', variant: 'destructive' });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              {celulaName}
            </DialogTitle>
            <DialogDescription>Gerencie relatórios, membros e casais da célula</DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <Tabs defaultValue="relatorio" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="relatorio" className="text-xs sm:text-sm gap-1">
                  <FileText className="h-3.5 w-3.5 hidden sm:inline" />Relatório
                </TabsTrigger>
                <TabsTrigger value="historico" className="text-xs sm:text-sm gap-1">
                  <History className="h-3.5 w-3.5 hidden sm:inline" />Histórico
                </TabsTrigger>
                <TabsTrigger value="fotos" className="text-xs sm:text-sm gap-1">
                  <Image className="h-3.5 w-3.5 hidden sm:inline" />Fotos
                </TabsTrigger>
                <TabsTrigger value="membros" className="text-xs sm:text-sm">
                  Membros ({members?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="casais" className="text-xs sm:text-sm">
                  Casais ({casais?.length || 0})
                </TabsTrigger>
              </TabsList>

              {/* RELATÓRIO SEMANAL */}
              <TabsContent value="relatorio">
                <div className="space-y-5">
                  {/* Data */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Data da Reunião *</Label>
                    <Input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} />
                  </div>

                  {/* Números */}
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">Presença</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Membros Presentes</Label>
                        <Input type="number" min={0} value={membersPresent} onChange={(e) => setMembersPresent(Number(e.target.value))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Líd. em Trein.</Label>
                        <Input type="number" min={0} value={leadersInTraining} onChange={(e) => setLeadersInTraining(Number(e.target.value))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Discipulados</Label>
                        <Input type="number" min={0} value={discipleships} onChange={(e) => setDiscipleships(Number(e.target.value))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Visitantes</Label>
                        <Input type="number" min={0} value={visitors} onChange={(e) => setVisitors(Number(e.target.value))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Crianças</Label>
                        <Input type="number" min={0} value={children} onChange={(e) => setChildren(Number(e.target.value))} />
                      </div>
                    </div>
                  </div>

                  {/* Observações */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Observações</Label>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas sobre a reunião..." rows={3} />
                  </div>

                  {/* WhatsApp fields */}
                  <div className="space-y-3 rounded-lg border border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20 p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-green-700 dark:text-green-400">📱 Mensagem do WhatsApp</p>
                    <div className="space-y-2">
                      <Label className="text-xs">📖 Nossa Mensagem *</Label>
                      <Input value={mensagemWa} onChange={(e) => setMensagemWa(e.target.value)} placeholder="Ex: A fé que transforma" />
                    </div>
                    <p className="text-xs text-muted-foreground">❤️ Nossa Paixão: <strong>PESSOAS</strong> (fixo) · 🫶🏾 Nossa Cultura: <strong>AMOR</strong> (fixo)</p>
                  </div>

                  <CelulaPhotoUpload photoUrl={photoUrl} onPhotoChange={setPhotoUrl} celulaId={celulaId} weekStart={weekStart} />

                  <Button onClick={handleSubmitReport} disabled={createReport.isPending} className="w-full" size="lg">
                    {createReport.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    Enviar Relatório
                  </Button>
                </div>
              </TabsContent>

              {/* HISTÓRICO */}
              <TabsContent value="historico">
                {reportsLoading ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : (
                  <ReportsHistoryTable reports={reports || []} onEdit={handleEditReport} onDelete={handleDeleteReport} isUpdating={updateReport.isPending} isDeleting={false} showCelulaColumn={false} showCoordenacaoColumn={false} />
                )}
              </TabsContent>

              {/* FOTOS */}
              <TabsContent value="fotos">
                <CelulaPhotoGallery reports={reports || []} isLoading={reportsLoading} showCelulaFilter={false} />
              </TabsContent>

              {/* MEMBROS */}
              <TabsContent value="membros" className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={() => setMemberDialogOpen(true)} size="sm"><Plus className="h-4 w-4 mr-2" />Adicionar Membro</Button>
                </div>
                <ScrollArea className="h-[350px] pr-4">
                  <div className="space-y-2">
                    {members?.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum membro cadastrado. Clique em "Adicionar Membro" para começar.
                      </div>
                    ) : (
                      members?.map((member) => (
                        <Collapsible key={member.id} open={expandedMembers.has(member.id)} onOpenChange={() => toggleExpanded(member.id)}>
                          <div className="border rounded-xl p-3">
                            <CollapsibleTrigger asChild>
                              <div className="flex items-center justify-between cursor-pointer hover:bg-muted/30 rounded-lg p-2 -m-2 transition-colors">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9">
                                    <AvatarImage src={member.profile?.avatar_url || undefined} />
                                    <AvatarFallback className="bg-accent text-accent-foreground text-xs">{member.profile?.name?.charAt(0) || 'M'}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-sm">{member.profile?.name || 'Sem nome'}</p>
                                    <p className="text-xs text-muted-foreground">{member.profile?.email || ''}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">{getMarcoCount(member)}/7</Badge>
                                  {expandedMembers.has(member.id) ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                </div>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="pt-4">
                              <div className="space-y-3">
                                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Marcos Espirituais</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {MARCOS_ESPIRITUAIS.map(({ key, label }) => (
                                    <div key={key} className="flex items-center space-x-2">
                                      <Checkbox id={`${member.id}-${key}`} checked={member[key as keyof Member] as boolean} onCheckedChange={(checked) => handleMarcoChange(member, key, checked as boolean)} disabled={updateMember.isPending} />
                                      <label htmlFor={`${member.id}-${key}`} className="text-sm cursor-pointer">{label}</label>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex justify-end pt-2">
                                  <Button variant="destructive" size="sm" onClick={() => handleRemoveMember(member.id)} disabled={removeMember.isPending}>
                                    <Trash2 className="h-4 w-4 mr-1" />Remover
                                  </Button>
                                </div>
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* CASAIS */}
              <TabsContent value="casais" className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={() => setCasalDialogOpen(true)} size="sm" disabled={availableMembers.length < 2}>
                    <Plus className="h-4 w-4 mr-2" />Vincular Casal
                  </Button>
                </div>
                <ScrollArea className="h-[350px] pr-4">
                  <div className="space-y-2">
                    {casais?.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                        <p>Nenhum casal vinculado.</p>
                        {availableMembers.length >= 2 ? (
                          <p className="text-sm">Clique em "Vincular Casal" para começar.</p>
                        ) : (
                          <p className="text-sm">Adicione pelo menos 2 membros.</p>
                        )}
                      </div>
                    ) : (
                      casais?.map((casal) => (
                        <Card key={casal.id} className="border-l-4 border-l-primary/30">
                          <CardContent className="py-3 px-4">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={casal.photo_url || undefined} />
                                  <AvatarFallback className="bg-accent"><Users2 className="h-4 w-4 text-accent-foreground" /></AvatarFallback>
                                </Avatar>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm">{casal.member1?.profile?.name || 'Sem nome'}</span>
                                  <Link2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                  <span className="font-medium text-sm">{casal.member2?.profile?.name || 'Sem nome'}</span>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => handleRemoveCasal(casal.id)} disabled={deleteCasal.isPending} className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <MemberFormDialogSimple open={memberDialogOpen} onOpenChange={setMemberDialogOpen} celulaId={celulaId} />
      <CasalFormDialog open={casalDialogOpen} onOpenChange={setCasalDialogOpen} celulaId={celulaId} availableMembers={availableMembers} />
      {lastReportData && (
        <WhatsAppShareDialog open={whatsappDialogOpen} onOpenChange={setWhatsappDialogOpen} reportData={lastReportData} />
      )}
    </>
  );
}
