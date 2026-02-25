import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserCircle } from 'lucide-react';
import { useRecomecoAgent, useCreateRecomecoAgent, type RecomecoAgentInsert } from '@/hooks/useRecomecoAgent';

interface AgentProfileGateProps {
  children: React.ReactNode;
}

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (!digits || digits.length < 10) return null;
  if (digits.startsWith('55') && digits.length >= 12) return `+${digits}`;
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  return null;
}

export function AgentProfileGate({ children }: AgentProfileGateProps) {
  const { data: agent, isLoading } = useRecomecoAgent();
  const createAgent = useCreateRecomecoAgent();
  const [form, setForm] = useState<RecomecoAgentInsert>({
    nome: '',
    telefone_whatsapp: '',
    cargo: 'Recomeço – Igreja do Amor',
    mensagem_assinatura: 'Recomeço | Igreja do Amor',
  });
  const [phoneError, setPhoneError] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#C5A059' }} />
      </div>
    );
  }

  if (agent) {
    return <>{children}</>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');
    if (!form.nome.trim()) return;
    const normalized = normalizePhone(form.telefone_whatsapp);
    if (!normalized) {
      setPhoneError('Número inválido. Use DDD + número (ex: 81 99999-9999)');
      return;
    }
    createAgent.mutate({ ...form, telefone_whatsapp: normalized });
  };

  return (
    <Card className="bg-white/5 border-white/10">
      <CardContent className="p-6 space-y-5">
        <div className="text-center space-y-2">
          <UserCircle className="h-12 w-12 mx-auto" style={{ color: '#C5A059' }} />
          <h2 className="text-lg font-semibold" style={{ color: '#F4EDE4' }}>Completar Perfil do Agente</h2>
          <p className="text-sm" style={{ color: '#B8B6B3' }}>
            Antes de cadastrar vidas, preencha seu perfil para personalizar as mensagens de boas-vindas.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label style={{ color: '#C5A059' }}>Seu Nome *</Label>
            <Input
              value={form.nome}
              onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
              className="bg-white/5 border-white/10 text-[#F4EDE4] h-12"
              placeholder="Nome completo"
              required
            />
          </div>
          <div className="space-y-2">
            <Label style={{ color: '#C5A059' }}>Seu WhatsApp *</Label>
            <Input
              value={form.telefone_whatsapp}
              onChange={e => setForm(p => ({ ...p, telefone_whatsapp: e.target.value }))}
              className="bg-white/5 border-white/10 text-[#F4EDE4] h-12"
              placeholder="(81) 99999-9999"
              inputMode="tel"
              required
            />
            {phoneError && <p className="text-xs text-red-400">{phoneError}</p>}
          </div>
          <div className="space-y-2">
            <Label style={{ color: '#C5A059' }}>Assinatura da Mensagem</Label>
            <Input
              value={form.mensagem_assinatura || ''}
              onChange={e => setForm(p => ({ ...p, mensagem_assinatura: e.target.value }))}
              className="bg-white/5 border-white/10 text-[#F4EDE4] h-12"
              placeholder="Recomeço | Igreja do Amor"
            />
          </div>
          <Button
            type="submit"
            className="w-full h-12"
            disabled={createAgent.isPending}
            style={{ background: 'linear-gradient(135deg, #C5A059, #D4B366)', color: '#1A2F4B' }}
          >
            {createAgent.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Salvar e Continuar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
