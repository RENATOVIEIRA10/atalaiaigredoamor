import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useRole } from '@/contexts/RoleContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNovasVidas, useCreateNovaVida, NovaVidaInsert } from '@/hooks/useNovasVidas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, UserPlus, MapPin, Phone, ChevronLeft, Loader2, ListChecks } from 'lucide-react';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  nova: { label: 'Nova', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  encaminhada: { label: 'Encaminhada', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  contatado: { label: 'Contatado', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  integrado: { label: 'Integrado', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  integrada: { label: 'Integrada', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
};

export default function RecomecoCadastro() {
  const navigate = useNavigate();
  const { isRecomecoCadastro } = useRole();
  const { user } = useAuth();

  if (!isRecomecoCadastro) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #0f1a2b 0%, #1A2F4B 40%, #0f1a2b 100%)' }}>
      <div className="max-w-lg mx-auto px-4 py-6 sm:py-10">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/trocar-funcao')} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <ChevronLeft className="h-5 w-5" style={{ color: '#B8B6B3' }} />
          </button>
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2" style={{ color: '#F4EDE4', fontFamily: "'Outfit', sans-serif" }}>
              <Heart className="h-5 w-5" style={{ color: '#C5A059' }} />
              Recomeço — Cadastro
            </h1>
            <p className="text-xs mt-1" style={{ color: '#B8B6B3' }}>Cadastrar novas vidas e acompanhar status</p>
          </div>
        </div>

        <Tabs defaultValue="cadastrar" className="w-full">
          <TabsList className="bg-white/5 border border-white/10 mb-6 w-full">
            <TabsTrigger value="cadastrar" className="flex-1 data-[state=active]:bg-[#C5A059]/20 data-[state=active]:text-[#C5A059]">
              <UserPlus className="h-4 w-4 mr-1.5" />Cadastrar
            </TabsTrigger>
            <TabsTrigger value="minhas" className="flex-1 data-[state=active]:bg-[#C5A059]/20 data-[state=active]:text-[#C5A059]">
              <ListChecks className="h-4 w-4 mr-1.5" />Minhas Vidas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cadastrar">
            <CadastroForm />
          </TabsContent>
          <TabsContent value="minhas">
            <MinhasVidas userId={user?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function CadastroForm() {
  const createMutation = useCreateNovaVida();
  const [form, setForm] = useState<NovaVidaInsert>({ nome: '' });
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return;
    createMutation.mutate(form, {
      onSuccess: () => {
        setForm({ nome: '' });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      },
    });
  };

  return (
    <Card className="bg-white/5 border-white/10">
      <CardContent className="p-5">
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-300 text-sm text-center">
            ✅ Vida cadastrada com sucesso! Já aparece na Central de Células.
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label style={{ color: '#C5A059' }}>Nome *</Label>
            <Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} className="bg-white/5 border-white/10 text-[#F4EDE4]" placeholder="Nome completo" required />
          </div>
          <div className="space-y-2">
            <Label style={{ color: '#C5A059' }}>WhatsApp</Label>
            <Input value={form.whatsapp || ''} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))} className="bg-white/5 border-white/10 text-[#F4EDE4]" placeholder="(81) 99999-9999" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label style={{ color: '#C5A059' }}>Bairro</Label>
              <Input value={form.bairro || ''} onChange={e => setForm(p => ({ ...p, bairro: e.target.value }))} className="bg-white/5 border-white/10 text-[#F4EDE4]" />
            </div>
            <div className="space-y-2">
              <Label style={{ color: '#C5A059' }}>Cidade</Label>
              <Input value={form.cidade || ''} onChange={e => setForm(p => ({ ...p, cidade: e.target.value }))} className="bg-white/5 border-white/10 text-[#F4EDE4]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label style={{ color: '#C5A059' }}>Estado Civil</Label>
              <Select value={form.estado_civil || ''} onValueChange={v => setForm(p => ({ ...p, estado_civil: v }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-[#F4EDE4]"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="solteiro(a)">Solteiro(a)</SelectItem>
                  <SelectItem value="casado(a)">Casado(a)</SelectItem>
                  <SelectItem value="divorciado(a)">Divorciado(a)</SelectItem>
                  <SelectItem value="viuvo(a)">Viúvo(a)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label style={{ color: '#C5A059' }}>Faixa Etária</Label>
              <Select value={form.faixa_etaria || ''} onValueChange={v => setForm(p => ({ ...p, faixa_etaria: v }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-[#F4EDE4]"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="18-25">18-25</SelectItem>
                  <SelectItem value="26-35">26-35</SelectItem>
                  <SelectItem value="36-45">36-45</SelectItem>
                  <SelectItem value="46-55">46-55</SelectItem>
                  <SelectItem value="56+">56+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label style={{ color: '#C5A059' }}>Observação</Label>
            <Textarea value={form.observacao || ''} onChange={e => setForm(p => ({ ...p, observacao: e.target.value }))} className="bg-white/5 border-white/10 text-[#F4EDE4]" rows={2} />
          </div>
          <Button type="submit" className="w-full h-11" disabled={createMutation.isPending} style={{ background: 'linear-gradient(135deg, #C5A059, #D4B366)', color: '#1A2F4B' }}>
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
            Cadastrar Nova Vida
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function MinhasVidas({ userId }: { userId?: string }) {
  const { data: novasVidas, isLoading } = useNovasVidas();

  // Filter only vidas created by this user
  const minhas = (novasVidas || []).filter((nv: any) => nv.created_by_user_id === userId);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" style={{ color: '#C5A059' }} /></div>;
  }

  if (!minhas.length) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="py-12 text-center">
          <Heart className="h-10 w-10 mx-auto mb-3 opacity-30" style={{ color: '#C5A059' }} />
          <p style={{ color: '#B8B6B3' }}>Você ainda não cadastrou nenhuma nova vida.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {minhas.map((nv: any) => {
        const st = STATUS_LABELS[nv.status] || { label: nv.status, color: 'bg-white/10 text-white/60 border-white/20' };
        return (
          <Card key={nv.id} className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm truncate" style={{ color: '#F4EDE4' }}>{nv.nome}</h3>
                    <Badge variant="outline" className={`text-[10px] ${st.color}`}>{st.label}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: '#B8B6B3' }}>
                    {nv.whatsapp && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{nv.whatsapp}</span>}
                    {(nv.bairro || nv.cidade) && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{[nv.bairro, nv.cidade].filter(Boolean).join(', ')}</span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
