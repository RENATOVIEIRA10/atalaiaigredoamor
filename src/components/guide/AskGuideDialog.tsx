import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Sparkles, BookOpen, Loader2 } from 'lucide-react';
import { GLOSSARY, ADMIN_PRODUCT_MAP, SCOPE_DESCRIPTIONS, ONBOARDING_STEPS } from '@/lib/appMap';
import { useRole } from '@/contexts/RoleContext';
import { getScopeLevel } from '@/hooks/useSummaryMetrics';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { requestUnifiedAI } from '@/services/unifiedAI';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function searchStaticAnswer(query: string): string | null {
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Search glossary
  for (const term of GLOSSARY) {
    const normalized = term.term.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (q.includes(normalized) || normalized.includes(q.split(' ')[0])) {
      return `**${term.term}**\n\n${term.longDescription}\n\n_Escopos relacionados: ${term.relatedScopes.join(', ')}_`;
    }
  }

  // Search modules
  for (const mod of ADMIN_PRODUCT_MAP) {
    const normalized = mod.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (q.includes(normalized)) {
      return `**${mod.name}**\n\n${mod.description}\n\n📍 Caminho: \`${mod.path}\`\n\n_Acessível por: ${mod.scopes.join(', ')}_`;
    }
  }

  // Search scopes
  for (const [key, desc] of Object.entries(SCOPE_DESCRIPTIONS)) {
    const normalized = desc.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (q.includes(normalized) || q.includes(key)) {
      return `**${desc.label}** (${key})\n\n${desc.description}`;
    }
  }

  // Common questions
  if (q.includes('relatorio') || q.includes('relatório')) {
    return 'O **Relatório Semanal** é preenchido pelo líder de célula após cada reunião. Registra presença, visitantes, crianças e discipulados.\n\n📍 Caminho: `/dashboard` → aba "Ações"';
  }
  if (q.includes('como comecar') || q.includes('como começar') || q.includes('primeiro passo')) {
    return 'Bem-vindo ao Atalaia! Seus primeiros passos:\n\n1. Na **Home**, veja as ações prioritárias\n2. No **Guia de Primeiros Passos** (banner no topo), siga o passo-a-passo\n3. Dúvidas sobre termos? Acesse o **Glossário** no menu';
  }

  return null;
}

export function AskGuideDialog() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scopeType } = useRole();
  const level = getScopeLevel(scopeType);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const q = input.trim();
    if (!q) return;
    setInput('');

    const userMsg: Message = { role: 'user', content: q };
    setMessages(prev => [...prev, userMsg]);

    // Try static first
    const staticAnswer = searchStaticAnswer(q);
    if (staticAnswer && !useAI) {
      setMessages(prev => [...prev, { role: 'assistant', content: staticAnswer }]);
      return;
    }

    if (!useAI) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Não encontrei essa informação no glossário. Ative o **Modo IA** para uma resposta mais detalhada, ou reformule sua pergunta com termos como "Pulso", "Radar", "Relatório", etc.'
      }]);
      return;
    }

    // AI mode
    setIsLoading(true);
    try {
      const systemContext = `Você é o Guia do Atalaia, um sistema de gestão pastoral de igreja em células.
Responda APENAS com base nas informações abaixo. Se não souber, diga "Não encontrei isso no sistema atual."
NUNCA invente telas ou funções que não existem.

GLOSSÁRIO:
${GLOSSARY.map(g => `- ${g.term}: ${g.shortDescription}`).join('\n')}

MÓDULOS:
${ADMIN_PRODUCT_MAP.map(m => `- ${m.name} (${m.path}): ${m.description} [${m.scopes.join(', ')}]`).join('\n')}

ESCOPOS:
${Object.entries(SCOPE_DESCRIPTIONS).map(([k, v]) => `- ${v.label} (${k}): ${v.description}`).join('\n')}

O usuário atual tem escopo: ${level} (${scopeType || 'não definido'})`;

      const allMessages = [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: q }
      ];

      const { data, error } = await supabase.functions.invoke('guide-ai', {
        body: { messages: allMessages, systemContext },
      });

      if (error) throw error;
      const answer = data?.content || 'Desculpe, não consegui processar sua pergunta.';
      setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    } catch (err) {
      console.error('Guide AI error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Ocorreu um erro ao consultar a IA. Tente novamente ou use o modo estático.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-xs h-9">
          <MessageCircle className="h-4 w-4" />
          Perguntar ao Guia
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px] max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-2 border-b border-border/30">
          <DialogTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Pergunte ao Guia
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <Button
              size="sm"
              variant={!useAI ? 'default' : 'outline'}
              className="h-7 text-[10px] rounded-full"
              onClick={() => setUseAI(false)}
            >
              📖 Glossário
            </Button>
            <Button
              size="sm"
              variant={useAI ? 'default' : 'outline'}
              className="h-7 text-[10px] rounded-full gap-1"
              onClick={() => setUseAI(true)}
            >
              <Sparkles className="h-3 w-3" />
              Modo IA
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
          <div className="space-y-4 min-h-[200px]">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground text-xs py-8 space-y-2">
                <MessageCircle className="h-8 w-8 mx-auto opacity-30" />
                <p>Pergunte sobre qualquer termo ou funcionalidade</p>
                <p className="text-[10px]">Ex: "O que é Pulso?", "Como fazer relatório?", "O que o coordenador faz?"</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[85%] rounded-xl px-3 py-2 text-sm',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 border border-border/30'
                )}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 max-w-none text-xs">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-xs">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted/50 border border-border/30 rounded-xl px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-3 border-t border-border/30 flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Digite sua dúvida..."
            className="h-9 text-sm"
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={isLoading}
          />
          <Button size="sm" className="h-9 w-9 p-0 shrink-0" onClick={handleSend} disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
