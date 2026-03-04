import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, MapPin, Calendar, Church, Award, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useCampos } from '@/hooks/useCampos';
import { useRedes } from '@/hooks/useRedes';
import { useCoordenacoes } from '@/hooks/useCoordenacoes';
import { useCelulas } from '@/hooks/useCelulas';
import type { UnifiedLeader } from '@/hooks/useLeadershipFunctions';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leader: UnifiedLeader;
}

interface ProfileData {
  id: string;
  name: string;
  birth_date: string | null;
  joined_church_at: string | null;
}

interface MemberData {
  id: string;
  profile_id: string;
  celula_id: string;
  campo_id: string;
  rede_id: string;
  batismo: boolean;
  encontro_com_deus: boolean;
  renovo: boolean;
  encontro_de_casais: boolean;
  curso_lidere: boolean;
  is_discipulado: boolean;
  is_lider_em_treinamento: boolean;
}

const MARCOS = [
  { key: 'batismo', label: 'Batismo' },
  { key: 'encontro_com_deus', label: 'Encontro com Deus' },
  { key: 'renovo', label: 'Renovo' },
  { key: 'encontro_de_casais', label: 'Encontro de Casais' },
  { key: 'curso_lidere', label: 'Curso Lidere' },
  { key: 'is_discipulado', label: 'Discipulado' },
  { key: 'is_lider_em_treinamento', label: 'Líder em Treinamento' },
] as const;

export function LeaderMemberDataDialog({ open, onOpenChange, leader }: Props) {
  const queryClient = useQueryClient();
  const { data: campos } = useCampos();
  const { data: redes } = useRedes();
  const { data: coordenacoes } = useCoordenacoes();
  const { data: celulas } = useCelulas();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile data (person1 - for couples, we manage person1 primarily; person2 gets same célula base)
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [members, setMembers] = useState<(MemberData | null)[]>([]);

  // Form state
  const [birthDates, setBirthDates] = useState<(string | null)[]>([]);
  const [joinedDates, setJoinedDates] = useState<(string | null)[]>([]);
  const [marcos, setMarcos] = useState<Record<string, boolean>[]>([]);

  // Célula base selection
  const [selectedCampoId, setSelectedCampoId] = useState('');
  const [selectedRedeId, setSelectedRedeId] = useState('');
  const [selectedCoordId, setSelectedCoordId] = useState('');
  const [selectedCelulaId, setSelectedCelulaId] = useState('');

  // Derive profile IDs from leader
  const profileIds = leader.isCouple
    ? [leader.person1?.id, leader.person2?.id].filter(Boolean) as string[]
    : leader.person1?.id ? [leader.person1.id] : [];

  useEffect(() => {
    if (open && profileIds.length > 0) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load profiles
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, name, birth_date, joined_church_at')
        .in('id', profileIds);

      const orderedProfiles = profileIds.map(pid =>
        (profs || []).find(p => p.id === pid) || { id: pid, name: '?', birth_date: null, joined_church_at: null }
      );
      setProfiles(orderedProfiles);
      setBirthDates(orderedProfiles.map(p => p.birth_date || ''));
      setJoinedDates(orderedProfiles.map(p => p.joined_church_at || ''));

      // Load existing members for these profiles
      const { data: existingMembers } = await supabase
        .from('members')
        .select('id, profile_id, celula_id, campo_id, rede_id, batismo, encontro_com_deus, renovo, encontro_de_casais, curso_lidere, is_discipulado, is_lider_em_treinamento')
        .in('profile_id', profileIds)
        .eq('is_active', true);

      const memberMap = new Map<string, MemberData>();
      for (const m of (existingMembers || [])) {
        if (!memberMap.has(m.profile_id)) {
          memberMap.set(m.profile_id, m as MemberData);
        }
      }

      const orderedMembers = profileIds.map(pid => memberMap.get(pid) || null);
      setMembers(orderedMembers);

      // Set marcos
      setMarcos(orderedMembers.map(m => {
        const obj: Record<string, boolean> = {};
        for (const mc of MARCOS) {
          obj[mc.key] = m ? !!(m as any)[mc.key] : false;
        }
        return obj;
      }));

      // Set célula base from first member that has one
      const firstMember = orderedMembers.find(m => m !== null);
      if (firstMember) {
        setSelectedCelulaId(firstMember.celula_id);
        // Resolve hierarchy
        const cel = (celulas || []).find(c => c.id === firstMember.celula_id);
        if (cel) {
          setSelectedCampoId(cel.campo_id);
          setSelectedRedeId(cel.rede_id);
          setSelectedCoordId(cel.coordenacao_id);
        }
      } else {
        // Try to get campo from leader's functions
        const firstFn = leader.functions.find(f => f.campoId);
        if (firstFn?.campoId) {
          setSelectedCampoId(firstFn.campoId);
        }
      }
    } catch (err: any) {
      toast({ title: 'Erro ao carregar dados', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Filtered lists
  const filteredRedes = (redes || []).filter(r => !selectedCampoId || r.campo_id === selectedCampoId);
  const filteredCoords = (coordenacoes || []).filter(c =>
    (!selectedCampoId || c.campo_id === selectedCampoId) &&
    (!selectedRedeId || c.rede_id === selectedRedeId)
  );
  const filteredCelulas = (celulas || []).filter(c =>
    (!selectedCampoId || c.campo_id === selectedCampoId) &&
    (!selectedCoordId || c.coordenacao_id === selectedCoordId)
  );

  const handleSave = async () => {
    if (!selectedCelulaId) {
      toast({ title: 'Selecione a célula base', variant: 'destructive' });
      return;
    }

    const cel = (celulas || []).find(c => c.id === selectedCelulaId);
    if (!cel) {
      toast({ title: 'Célula não encontrada', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      // Update profiles (birth_date, joined_church_at)
      for (let i = 0; i < profiles.length; i++) {
        const prof = profiles[i];
        await supabase.from('profiles').update({
          birth_date: birthDates[i] || null,
          joined_church_at: joinedDates[i] || null,
        }).eq('id', prof.id);
      }

      // Upsert members
      for (let i = 0; i < profileIds.length; i++) {
        const profileId = profileIds[i];
        const existingMember = members[i];
        const marcosData = marcos[i] || {};

        const memberPayload = {
          celula_id: selectedCelulaId,
          campo_id: cel.campo_id,
          rede_id: cel.rede_id,
          batismo: marcosData.batismo || false,
          encontro_com_deus: marcosData.encontro_com_deus || false,
          renovo: marcosData.renovo || false,
          encontro_de_casais: marcosData.encontro_de_casais || false,
          curso_lidere: marcosData.curso_lidere || false,
          is_discipulado: marcosData.is_discipulado || false,
          is_lider_em_treinamento: marcosData.is_lider_em_treinamento || false,
        };

        if (existingMember) {
          await supabase.from('members')
            .update(memberPayload)
            .eq('id', existingMember.id);
        } else {
          await supabase.from('members').insert({
            profile_id: profileId,
            ...memberPayload,
            is_active: true,
            serve_ministerio: false,
            disponivel_para_servir: false,
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['leadership_functions_unified'] });
      toast({ title: 'Dados salvos com sucesso!' });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const hasMissingData = profiles.some((_, i) => !birthDates[i] || !joinedDates[i]) || !selectedCelulaId;
  const hasNoMember = members.some(m => m === null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Dados de Membro — {leader.isCouple
              ? [leader.person1?.name, leader.person2?.name].filter(Boolean).join(' & ')
              : leader.person1?.name}
          </DialogTitle>
          <DialogDescription>
            {hasNoMember
              ? 'Essa liderança ainda não possui registro de membro. Preencha os dados abaixo para criá-lo.'
              : 'Edite os dados pessoais e a célula base desta liderança.'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {hasNoMember && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-700">
                  Sem registro de membro. Ao salvar, um registro será criado automaticamente vinculado à célula base selecionada.
                </p>
              </div>
            )}

            {/* Per-person data */}
            {profiles.map((prof, idx) => (
              <div key={prof.id} className="space-y-3">
                {profiles.length > 1 && (
                  <p className="text-sm font-semibold text-primary">{prof.name}</p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Data de nascimento
                    </Label>
                    <Input
                      type="date"
                      value={birthDates[idx] || ''}
                      onChange={e => {
                        const next = [...birthDates];
                        next[idx] = e.target.value;
                        setBirthDates(next);
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1">
                      <Church className="h-3 w-3" /> Entrada na igreja
                    </Label>
                    <Input
                      type="date"
                      value={joinedDates[idx] || ''}
                      onChange={e => {
                        const next = [...joinedDates];
                        next[idx] = e.target.value;
                        setJoinedDates(next);
                      }}
                    />
                  </div>
                </div>

                {/* Marcos espirituais */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Marcos espirituais</Label>
                  <div className="flex flex-wrap gap-2">
                    {MARCOS.map(mc => {
                      const active = marcos[idx]?.[mc.key] || false;
                      return (
                        <Badge
                          key={mc.key}
                          variant={active ? 'default' : 'outline'}
                          className={`cursor-pointer text-xs transition-colors ${active ? '' : 'opacity-60'}`}
                          onClick={() => {
                            const next = [...marcos];
                            next[idx] = { ...next[idx], [mc.key]: !active };
                            setMarcos(next);
                          }}
                        >
                          {mc.label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {idx < profiles.length - 1 && <hr className="border-border/50" />}
              </div>
            ))}

            {/* Célula Base (shared for couple) */}
            <div className="space-y-3 border-t pt-4">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Célula Base {leader.isCouple ? '(compartilhada)' : ''}
              </Label>
              <p className="text-xs text-muted-foreground">
                A célula onde esta liderança congrega. Necessária para registro como membro.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <Select value={selectedCampoId} onValueChange={v => { setSelectedCampoId(v); setSelectedRedeId(''); setSelectedCoordId(''); setSelectedCelulaId(''); }}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Campus" />
                  </SelectTrigger>
                  <SelectContent>
                    {(campos || []).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedRedeId} onValueChange={v => { setSelectedRedeId(v); setSelectedCoordId(''); setSelectedCelulaId(''); }}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Rede" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredRedes.map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedCoordId} onValueChange={v => { setSelectedCoordId(v); setSelectedCelulaId(''); }}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Coordenação" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCoords.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedCelulaId} onValueChange={setSelectedCelulaId}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Célula *" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCelulas.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button className="w-full" onClick={handleSave} disabled={saving || !selectedCelulaId}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {hasNoMember ? 'Criar registro de membro e salvar' : 'Salvar dados'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
