import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Trash2, Network, FolderTree, ClipboardCheck, Home, Church, Shield, Crown, Heart, BookOpen, Users, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useCreateCoupleFromNames } from '@/hooks/useCreateCoupleFromNames';
import { useRedes } from '@/hooks/useRedes';
import { useCoordenacoes } from '@/hooks/useCoordenacoes';
import { useCelulas } from '@/hooks/useCelulas';
import { useCampos } from '@/hooks/useCampos';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getFunctionLabel, getScopeTypeForAccessKey } from '@/hooks/useLeadershipFunctions';

type FunctionType = string;

interface PendingFunction {
  functionType: FunctionType;
  entityId: string | null;
  entityName: string;
  entityType: string | null;
}

// Which functions require which scope selection
const SCOPE_REQUIREMENTS: Record<string, { entityType: string; label: string } | null> = {
  celula_leader: { entityType: 'celula', label: 'Célula' },
  supervisor: { entityType: 'coordenacao', label: 'Coordenação' },
  coordenador: { entityType: 'coordenacao', label: 'Coordenação' },
  rede_leader: { entityType: 'rede', label: 'Rede' },
  pastor_de_campo: { entityType: 'campo', label: 'Campo' },
  pastor_senior_global: null,
  admin: null,
  lider_recomeco_central: null,
  lider_batismo_aclamacao: null,
  central_batismo_aclamacao: null,
  central_celulas: null,
  recomeco_cadastro: null,
  recomeco_operador: null,
  recomeco_leitura: null,
};

const ALL_FUNCTION_TYPES = [
  { value: 'pastor_senior_global', label: 'Pastor Sênior Global', group: 'pastoral' },
  { value: 'pastor_de_campo', label: 'Pastor de Campo', group: 'pastoral' },
  { value: 'admin', label: 'Administrador', group: 'pastoral' },
  { value: 'rede_leader', label: 'Líder de Rede', group: 'estrutural' },
  { value: 'coordenador', label: 'Coordenador', group: 'estrutural' },
  { value: 'supervisor', label: 'Supervisor', group: 'estrutural' },
  { value: 'celula_leader', label: 'Líder de Célula', group: 'estrutural' },
  { value: 'lider_recomeco_central', label: 'Líder Recomeço + Central', group: 'ministerio' },
  { value: 'lider_batismo_aclamacao', label: 'Líder Batismo / Aclamação', group: 'ministerio' },
  { value: 'central_batismo_aclamacao', label: 'Central Batismo / Aclamação', group: 'ministerio' },
  { value: 'central_celulas', label: 'Central de Células', group: 'ministerio' },
  { value: 'recomeco_cadastro', label: 'Recomeço (Cadastro)', group: 'ministerio' },
];

const roleIcons: Record<string, any> = {
  rede_leader: Network, coordenador: FolderTree, supervisor: ClipboardCheck,
  celula_leader: Home, pastor_de_campo: Church, pastor_senior_global: Crown,
  admin: Shield, lider_recomeco_central: Heart, lider_batismo_aclamacao: BookOpen,
  central_batismo_aclamacao: BookOpen, central_celulas: Users, recomeco_cadastro: Heart,
};

function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'redeamor-';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

export function CreateLeadershipDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const { createOrUpdateCouple } = useCreateCoupleFromNames();
  const { data: redes } = useRedes();
  const { data: coordenacoes } = useCoordenacoes();
  const { data: celulas } = useCelulas();
  const { data: campos } = useCampos();

  const [isCouple, setIsCouple] = useState(true);
  const [person1Name, setPerson1Name] = useState('');
  const [person2Name, setPerson2Name] = useState('');
  const [functions, setFunctions] = useState<PendingFunction[]>([]);
  const [currentFnType, setCurrentFnType] = useState('');
  const [currentEntity, setCurrentEntity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const scopeReq = currentFnType ? SCOPE_REQUIREMENTS[currentFnType] : undefined;
  const needsEntity = scopeReq !== null && scopeReq !== undefined;

  const entityOptions = !currentFnType || !needsEntity ? [] :
    scopeReq?.entityType === 'celula' ? (celulas || []).map(c => ({ id: c.id, name: c.name })) :
    scopeReq?.entityType === 'coordenacao' ? (coordenacoes || []).map(c => ({ id: c.id, name: c.name })) :
    scopeReq?.entityType === 'rede' ? (redes || []).map(r => ({ id: r.id, name: r.name })) :
    scopeReq?.entityType === 'campo' ? (campos || []).map(c => ({ id: c.id, name: c.nome })) :
    [];

  const addFunction = () => {
    if (!currentFnType) return;
    if (needsEntity && !currentEntity) return;
    const entity = entityOptions.find(e => e.id === currentEntity);
    setFunctions([...functions, {
      functionType: currentFnType,
      entityId: needsEntity ? currentEntity : null,
      entityName: entity?.name || '',
      entityType: scopeReq?.entityType || null,
    }]);
    setCurrentFnType('');
    setCurrentEntity('');
  };

  const removeFunction = (index: number) => setFunctions(functions.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (!person1Name.trim()) return;
    if (isCouple && !person2Name.trim()) return;
    if (functions.length === 0) {
      toast({ variant: 'destructive', title: 'Adicione pelo menos uma função' });
      return;
    }

    setIsSubmitting(true);
    try {
      let coupleId: string | null = null;
      let profileId: string | null = null;

      if (isCouple) {
        coupleId = await createOrUpdateCouple(person1Name, person2Name);
        if (!coupleId) throw new Error('Erro ao criar casal');
      } else {
        // Create single profile
        const userId = crypto.randomUUID();
        const { data: profile, error } = await supabase
          .from('profiles')
          .insert({ name: person1Name.trim(), user_id: userId })
          .select('id')
          .single();
        if (error || !profile) throw new Error('Erro ao criar perfil');
        profileId = profile.id;
      }

      // Create leadership_functions + structural links + access keys
      for (const fn of functions) {
        // 1. Create structural link (backwards compat)
        let scopeEntityId = fn.entityId;
        if (coupleId) {
          if (fn.functionType === 'celula_leader' && fn.entityId) {
            await supabase.from('celulas').update({ leadership_couple_id: coupleId }).eq('id', fn.entityId);
          } else if (fn.functionType === 'supervisor' && fn.entityId) {
            const { data: lc } = await supabase.from('leadership_couples').select('spouse1_id').eq('id', coupleId).single();
            if (lc) {
              const { data: newSup } = await supabase.from('supervisores').insert({
                profile_id: lc.spouse1_id,
                coordenacao_id: fn.entityId,
                leadership_couple_id: coupleId,
              }).select('id').single();
              if (newSup) scopeEntityId = newSup.id;
            }
          } else if (fn.functionType === 'coordenador' && fn.entityId) {
            await supabase.from('coordenacoes').update({ leadership_couple_id: coupleId }).eq('id', fn.entityId);
          } else if (fn.functionType === 'rede_leader' && fn.entityId) {
            await supabase.from('redes').update({ leadership_couple_id: coupleId }).eq('id', fn.entityId);
          }
        }

        // For pastor_de_campo, create campo_pastores entry
        if (fn.functionType === 'pastor_de_campo' && fn.entityId) {
          let pastorProfileId = profileId;
          // For couples, use spouse1's profile_id
          if (!pastorProfileId && coupleId) {
            const { data: lc } = await supabase.from('leadership_couples').select('spouse1_id, spouse2_id').eq('id', coupleId).single();
            if (lc) {
              // Insert both spouses as pastors of this campo
              await supabase.from('campo_pastores').insert([
                { profile_id: lc.spouse1_id, campo_id: fn.entityId, tipo: 'pastor_de_campo' },
                { profile_id: lc.spouse2_id, campo_id: fn.entityId, tipo: 'pastor_de_campo' },
              ]);
            }
          } else if (pastorProfileId) {
            await supabase.from('campo_pastores').insert({
              profile_id: pastorProfileId,
              campo_id: fn.entityId,
              tipo: 'pastor_de_campo',
            });
          }
        }

        // Determine campo_id and rede_id
        let campoId: string | null = null;
        let redeId: string | null = null;
        if (fn.entityType === 'campo') { campoId = fn.entityId; }
        else if (fn.entityType === 'rede' && fn.entityId) {
          const rede = (redes || []).find(r => r.id === fn.entityId);
          campoId = rede?.campo_id || null;
          redeId = fn.entityId;
        } else if (fn.entityType === 'coordenacao' && fn.entityId) {
          const coord = (coordenacoes || []).find(c => c.id === fn.entityId);
          campoId = coord?.campo_id || null;
          redeId = coord?.rede_id || null;
        } else if (fn.entityType === 'celula' && fn.entityId) {
          const cel = (celulas || []).find(c => c.id === fn.entityId);
          campoId = cel?.campo_id || null;
          redeId = cel?.rede_id || null;
        }

        // 2. Create leadership_function record
        await supabase.from('leadership_functions').insert({
          leadership_couple_id: coupleId,
          profile_id: profileId,
          function_type: fn.functionType,
          scope_entity_id: scopeEntityId,
          scope_entity_type: fn.entityType,
          campo_id: campoId,
          rede_id: redeId,
          active: true,
        });

        // 3. Auto-create access key
        const akScopeType = getScopeTypeForAccessKey(fn.functionType);
        const code = generateAccessCode();
        const { error: akError } = await supabase.from('access_keys').insert({
          scope_type: akScopeType,
          scope_id: scopeEntityId,
          code,
          active: true,
          rede_id: redeId,
          campo_id: campoId,
        });
        if (akError) {
          console.error('Erro ao criar access_key:', akError);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['leadership_functions_unified'] });
      queryClient.invalidateQueries({ queryKey: ['access_keys'] });
      queryClient.invalidateQueries({ queryKey: ['celulas'] });
      queryClient.invalidateQueries({ queryKey: ['supervisores'] });
      queryClient.invalidateQueries({ queryKey: ['coordenacoes'] });
      queryClient.invalidateQueries({ queryKey: ['redes'] });
      queryClient.invalidateQueries({ queryKey: ['leadership_couples'] });

      const name = isCouple ? `${person1Name} & ${person2Name}` : person1Name;
      toast({ title: 'Liderança criada!', description: `${name} — ${functions.length} função(ões) vinculada(s) com código(s) gerado(s).` });
      resetAndClose();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setPerson1Name(''); setPerson2Name('');
    setFunctions([]); setCurrentFnType(''); setCurrentEntity('');
    setStep(1); setIsCouple(true);
    onOpenChange(false);
  };

  const canGoStep2 = person1Name.trim() && (!isCouple || person2Name.trim());

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Criar Liderança</DialogTitle>
          <DialogDescription>Cadastre um casal ou pessoa individual e defina suas funções.</DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full ${step >= s ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">Passo 1 – Pessoa(s)</p>

            <div className="flex items-center gap-3">
              <Label className="text-sm">Tipo:</Label>
              <div className="flex items-center gap-2">
                <Button size="sm" variant={isCouple ? 'default' : 'outline'} onClick={() => setIsCouple(true)}>
                  <Users className="h-3.5 w-3.5 mr-1.5" /> Casal
                </Button>
                <Button size="sm" variant={!isCouple ? 'default' : 'outline'} onClick={() => setIsCouple(false)}>
                  <User className="h-3.5 w-3.5 mr-1.5" /> Individual
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>{isCouple ? 'Nome Pessoa 1 *' : 'Nome completo *'}</Label>
                <Input placeholder="Nome completo" value={person1Name} onChange={e => setPerson1Name(e.target.value)} />
              </div>
              {isCouple && (
                <div className="space-y-1.5">
                  <Label>Nome Pessoa 2 *</Label>
                  <Input placeholder="Nome completo" value={person2Name} onChange={e => setPerson2Name(e.target.value)} />
                </div>
              )}
            </div>
            <Button className="w-full" onClick={() => setStep(2)} disabled={!canGoStep2}>
              Próximo
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">Passo 2 – Funções</p>

            {functions.length > 0 && (
              <div className="space-y-2">
                {functions.map((fn, i) => {
                  const Icon = roleIcons[fn.functionType] || Users;
                  return (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-sm">
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="font-medium">{getFunctionLabel(fn.functionType)}</span>
                        {fn.entityName && (
                          <>
                            <span className="text-muted-foreground">→</span>
                            <span>{fn.entityName}</span>
                          </>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFunction(i)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="border rounded-lg p-3 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Adicionar função:</p>
              <Select value={currentFnType} onValueChange={v => { setCurrentFnType(v); setCurrentEntity(''); }}>
                <SelectTrigger><SelectValue placeholder="Tipo de função" /></SelectTrigger>
                <SelectContent>
                  <SelectItem disabled value="__pastoral">── Pastoral ──</SelectItem>
                  {ALL_FUNCTION_TYPES.filter(f => f.group === 'pastoral').map(f => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                  <SelectItem disabled value="__estrutural">── Estrutural ──</SelectItem>
                  {ALL_FUNCTION_TYPES.filter(f => f.group === 'estrutural').map(f => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                  <SelectItem disabled value="__ministerio">── Ministério ──</SelectItem>
                  {ALL_FUNCTION_TYPES.filter(f => f.group === 'ministerio').map(f => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {currentFnType && needsEntity && (
                <Select value={currentEntity} onValueChange={setCurrentEntity}>
                  <SelectTrigger><SelectValue placeholder={`Selecionar ${scopeReq?.label}`} /></SelectTrigger>
                  <SelectContent>
                    {entityOptions.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button
                variant="secondary" size="sm" className="w-full"
                onClick={addFunction}
                disabled={!currentFnType || (needsEntity && !currentEntity)}
              >
                <Plus className="h-3 w-3 mr-1" /> Adicionar função
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Voltar</Button>
              <Button className="flex-1" onClick={() => setStep(3)} disabled={functions.length === 0}>Próximo</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">Passo 3 – Confirmar</p>

            <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
              <div className="flex items-center gap-2">
                {isCouple ? <Users className="h-4 w-4 text-primary" /> : <User className="h-4 w-4 text-primary" />}
                <p className="font-semibold text-sm">
                  {isCouple ? `${person1Name} & ${person2Name}` : person1Name}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">receberá {functions.length} função(ões) com código(s) gerado(s) automaticamente:</p>
              {functions.map((fn, i) => {
                const Icon = roleIcons[fn.functionType] || Users;
                return (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Icon className="h-4 w-4 text-primary" />
                    <span>{getFunctionLabel(fn.functionType)}</span>
                    {fn.entityName && (
                      <>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-medium">{fn.entityName}</span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Voltar</Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar e Gerar Códigos
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
