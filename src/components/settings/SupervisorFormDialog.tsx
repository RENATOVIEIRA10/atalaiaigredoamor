import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCoordenacoes } from '@/hooks/useCoordenacoes';
import { useProfiles } from '@/hooks/useProfiles';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Search, Users, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SupervisorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCoordenacaoId?: string;
  lockCoordenacao?: boolean;
}

export function SupervisorFormDialog({ open, onOpenChange, defaultCoordenacaoId, lockCoordenacao = false }: SupervisorFormDialogProps) {
  const { data: coordenacoes } = useCoordenacoes();
  const { data: profiles } = useProfiles();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [coordenacaoId, setCoordenacaoId] = useState(defaultCoordenacaoId || '');
  const [spouse1Id, setSpouse1Id] = useState<string | null>(null);
  const [spouse2Id, setSpouse2Id] = useState<string | null>(null);
  const [search1, setSearch1] = useState('');
  const [search2, setSearch2] = useState('');

  const filteredProfiles1 = useMemo(() => {
    if (!profiles) return [];
    return profiles.filter(p =>
      p.name.toLowerCase().includes(search1.toLowerCase()) && p.id !== spouse2Id
    );
  }, [profiles, search1, spouse2Id]);

  const filteredProfiles2 = useMemo(() => {
    if (!profiles) return [];
    return profiles.filter(p =>
      p.name.toLowerCase().includes(search2.toLowerCase()) && p.id !== spouse1Id
    );
  }, [profiles, search2, spouse1Id]);

  const selectedProfile1 = profiles?.find(p => p.id === spouse1Id);
  const selectedProfile2 = profiles?.find(p => p.id === spouse2Id);

  const previewName = selectedProfile1 && selectedProfile2
    ? `${selectedProfile1.name} & ${selectedProfile2.name}`
    : null;

  async function handleSubmit() {
    if (!spouse1Id || !spouse2Id || !coordenacaoId) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    try {
      setSubmitting(true);

      // Check if couple already exists
      const { data: existingCouple } = await supabase
        .from('leadership_couples')
        .select('id')
        .or(`and(spouse1_id.eq.${spouse1Id},spouse2_id.eq.${spouse2Id}),and(spouse1_id.eq.${spouse2Id},spouse2_id.eq.${spouse1Id})`)
        .maybeSingle();

      let coupleId: string;

      if (existingCouple) {
        coupleId = existingCouple.id;
      } else {
        const { data: newCouple, error: coupleErr } = await supabase
          .from('leadership_couples')
          .insert({ spouse1_id: spouse1Id, spouse2_id: spouse2Id })
          .select('id')
          .single();

        if (coupleErr || !newCouple) throw new Error('Erro ao criar casal de liderança');
        coupleId = newCouple.id;
      }

      const { error } = await supabase
        .from('supervisores')
        .insert({
          profile_id: spouse1Id,
          coordenacao_id: coordenacaoId,
          leadership_couple_id: coupleId,
        });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['supervisores'] });
      queryClient.invalidateQueries({ queryKey: ['leadership_couples'] });
      toast({ title: 'Supervisor cadastrado com sucesso!' });
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setSpouse1Id(null);
    setSpouse2Id(null);
    setSearch1('');
    setSearch2('');
    setCoordenacaoId(defaultCoordenacaoId || '');
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Novo Supervisor (Casal)
          </DialogTitle>
          <DialogDescription>
            Selecione dois perfis existentes para formar o casal supervisor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Coordenação */}
          <div className="space-y-2">
            <Label>Coordenação</Label>
            {lockCoordenacao ? (
              <Input
                value={coordenacoes?.find(c => c.id === coordenacaoId)?.name || 'Coordenação'}
                disabled
                className="bg-muted"
              />
            ) : (
              <Select value={coordenacaoId} onValueChange={setCoordenacaoId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {coordenacoes?.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Spouse 1 */}
          <ProfileSelector
            label="Supervisor (Pessoa 1)"
            search={search1}
            onSearchChange={setSearch1}
            selectedId={spouse1Id}
            onSelect={setSpouse1Id}
            profiles={filteredProfiles1}
          />

          {/* Spouse 2 */}
          <ProfileSelector
            label="Supervisor (Pessoa 2)"
            search={search2}
            onSearchChange={setSearch2}
            selectedId={spouse2Id}
            onSelect={setSpouse2Id}
            profiles={filteredProfiles2}
          />

          {/* Preview */}
          {previewName && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-3">
              <div className="flex -space-x-2">
                <Avatar className="h-8 w-8 border-2 border-background">
                  <AvatarImage src={selectedProfile1?.avatar_url || undefined} crossOrigin="anonymous" />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">{selectedProfile1?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <Avatar className="h-8 w-8 border-2 border-background">
                  <AvatarImage src={selectedProfile2?.avatar_url || undefined} crossOrigin="anonymous" />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">{selectedProfile2?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>
              <span className="text-sm font-medium">{previewName}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={submitting || !spouse1Id || !spouse2Id || !coordenacaoId}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Criar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ProfileSelectorProps {
  label: string;
  search: string;
  onSearchChange: (v: string) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  profiles: Array<{ id: string; name: string; avatar_url?: string | null; email?: string | null }>;
}

function ProfileSelector({ label, search, onSearchChange, selectedId, onSelect, profiles }: ProfileSelectorProps) {
  const selected = profiles.find(p => p.id === selectedId);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {selected ? (
        <div className="flex items-center justify-between p-2 border rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={selected.avatar_url || undefined} crossOrigin="anonymous" />
              <AvatarFallback className="text-xs">{selected.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{selected.name}</p>
              {selected.email && <p className="text-xs text-muted-foreground">{selected.email}</p>}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onSelect(null)}>Trocar</Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8"
            />
          </div>
          <ScrollArea className="h-[140px] border rounded-lg">
            <div className="p-1">
              {profiles.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhum perfil encontrado</p>
              ) : (
                profiles.slice(0, 50).map(profile => (
                  <button
                    key={profile.id}
                    type="button"
                    className={cn(
                      "w-full flex items-center gap-2 p-2 rounded-md text-left hover:bg-accent transition-colors",
                      selectedId === profile.id && "bg-primary/10"
                    )}
                    onClick={() => onSelect(profile.id)}
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={profile.avatar_url || undefined} crossOrigin="anonymous" />
                      <AvatarFallback className="text-[10px]">{profile.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm truncate">{profile.name}</span>
                    {selectedId === profile.id && <Check className="h-4 w-4 text-primary ml-auto shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
