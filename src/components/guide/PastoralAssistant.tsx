import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, X, Sparkles, Loader2, Minimize2 } from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';
import { useCampo } from '@/contexts/CampoContext';
import { useLocation } from 'react-router-dom';
import { getScopeLevel } from '@/hooks/useSummaryMetrics';
import { GLOSSARY, ADMIN_PRODUCT_MAP, SCOPE_DESCRIPTIONS } from '@/lib/appMap';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const ROUTE_LABELS: Record<string, string> = {
  '/home': 'Home / Concierge',
  '/dashboard': 'Dashboard',
  '/celulas': 'Células',
  '/membros': 'Membros',
  '/redes': 'Redes',
  '/coordenacoes': 'Coordenações',
  '/radar': 'Radar de Saúde',
  '/organograma': 'Organograma',
  '/dados': 'Dados e Relatórios',
  '/recomeco': 'Recomeço (Novas Vidas)',
  '/recomeco-cadastro': 'Cadastro de Novas Vidas',
  '/configuracoes': 'Configurações',
  '/glossario': 'Glossário',
};

function buildSystemPrompt(scopeType: string | null, campoNome: string | null, currentRoute: string): string {
  const level = getScopeLevel(scopeType);
  const scopeDesc = scopeType ? SCOPE_DESCRIPTIONS[scopeType]?.label || scopeType : 'não definido';
  const routeLabel = ROUTE_LABELS[currentRoute.split('?')[0]] || currentRoute;

  return `Você é o **Assistente Pastoral do Atalaia**, um sistema de gestão pastoral de igreja em células.

CONTEXTO DO USUÁRIO:
- Papel: ${scopeDesc} (nível: ${level})
- Campus ativo: ${campoNome || 'Não definido'}
- Tela atual: ${routeLabel}

SEU COMPORTAMENTO:
1. Responda de forma pastoral, calorosa e prática
2. Use dados reais quando disponíveis no contexto
3. Seja conciso (máximo 3 parágrafos)
4. Use emojis com moderação para tornar a leitura agradável
5. Se não souber algo, diga "Não tenho essa informação agora"
6. NUNCA invente funcionalidades que não existem no sistema
7. Sempre sugira ações práticas quando possível
8. Use formatação markdown (negrito, listas, etc.)

GLOSSÁRIO DO SISTEMA:
${GLOSSARY.map(g => `- **${g.term}**: ${g.shortDescription}`).join('\n')}

MÓDULOS DISPONÍVEIS:
${ADMIN_PRODUCT_MAP.map(m => `- **${m.name}** (${m.path}): ${m.description}`).join('\n')}

ESCOPOS DO SISTEMA:
${Object.entries(SCOPE_DESCRIPTIONS).map(([k, v]) => `- **${v.label}** (${k}): ${v.description}`).join('\n')}

EXEMPLOS DE PERGUNTAS QUE VOCÊ SABE RESPONDER:
- "Como registrar um relatório semanal?"
- "O que significa o Pulso Pastoral?"
- "Onde vejo células sem relatório?"
- "O que devo fazer essa semana?"
- "Como encaminhar uma nova vida?"
- "Quem pode ver o Radar?"

Responda SEMPRE em português brasileiro.`;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/guide-ai`;

const SUGGESTIONS: Record<string, string[]> = {
  celula: ['Como registrar relatório?', 'O que fazer com membro ausente?', 'Como enviar pelo WhatsApp?'],
  supervisor: ['Quais células precisam supervisão?', 'Como registrar visita?', 'O que é o Radar?'],
  coordenacao: ['Quais células estão sem reunião?', 'Como apoiar meus líderes?', 'O que é o Pulso?'],
  rede: ['Onde devo focar essa semana?', 'Como está minha rede?', 'O que é multiplicação?'],
  pastor: ['Resumo para reunião de líderes', 'Qual rede precisa atenção?', 'Como está o crescimento?'],
  pastor_de_campo: ['Resumo para reunião de líderes', 'Qual rede precisa atenção?', 'Como está o crescimento?'],
  pastor_senior_global: ['Quais campos estão crescendo?', 'Resumo executivo do reino', 'Onde há estagnação?'],
  admin: ['Como criar chave de acesso?', 'O que é o organograma?', 'Como funciona o sistema?'],
};

export function PastoralAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { scopeType } = useRole();
  const { activeCampo } = useCampo();
  const location = useLocation();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current && !isMobile) {
      inputRef.current.focus();
    }
  }, [open, isMobile]);

  const streamResponse = useCallback(async (allMessages: Message[]) => {
    const systemContext = buildSystemPrompt(scopeType, activeCampo?.nome ?? null, location.pathname);

    const resp = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: allMessages.map(m => ({ role: m.role, content: m.content })),
        systemContext,
        stream: true,
      }),
    });

    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      throw new Error(errData.error || `Erro ${resp.status}`);
    }

    if (!resp.body) throw new Error('Sem corpo na resposta');

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = '';
    let assistantSoFar = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantSoFar += content;
            const snapshot = assistantSoFar;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === 'assistant') {
                return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: snapshot } : m));
              }
              return [...prev, { role: 'assistant', content: snapshot }];
            });
          }
        } catch {
          textBuffer = line + '\n' + textBuffer;
          break;
        }
      }
    }

    // Final flush
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split('\n')) {
        if (!raw) continue;
        if (raw.endsWith('\r')) raw = raw.slice(0, -1);
        if (raw.startsWith(':') || raw.trim() === '') continue;
        if (!raw.startsWith('data: ')) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantSoFar += content;
            const snapshot = assistantSoFar;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === 'assistant') {
                return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: snapshot } : m));
              }
              return [...prev, { role: 'assistant', content: snapshot }];
            });
          }
        } catch { /* ignore */ }
      }
    }
  }, [scopeType, activeCampo, location.pathname]);

  const handleSend = async (text?: string) => {
    const q = (text || input).trim();
    if (!q || isLoading) return;
    setInput('');

    const userMsg: Message = { role: 'user', content: q };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setIsLoading(true);

    try {
      await streamResponse(allMessages);
    } catch (err: any) {
      console.error('Pastoral AI error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: err?.message?.includes('429')
          ? '⏳ Muitas perguntas seguidas. Aguarde um momento e tente novamente.'
          : err?.message?.includes('402')
            ? '💳 Créditos de IA esgotados no momento.'
            : 'Desculpe, ocorreu um erro. Tente novamente em instantes.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = SUGGESTIONS[scopeType || 'celula'] || SUGGESTIONS.celula;

  return (
    <>
      {/* FAB */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed z-50"
            style={{
              bottom: isMobile ? 'calc(80px + env(safe-area-inset-bottom, 0px))' : '24px',
              right: '16px',
            }}
          >
            <Button
              onClick={() => setOpen(true)}
              className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
              size="icon"
            >
              <Sparkles className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'fixed z-50 flex flex-col bg-background border border-border rounded-2xl shadow-2xl overflow-hidden',
              isMobile
                ? 'inset-0 rounded-none'
                : 'bottom-6 right-4 w-[400px] h-[560px] max-h-[80vh]'
            )}
            style={isMobile ? { paddingTop: 'env(safe-area-inset-top, 0px)' } : {}}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-primary/5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Assistente Pastoral</h3>
                  <p className="text-[10px] text-muted-foreground">
                    {scopeType ? SCOPE_DESCRIPTIONS[scopeType]?.label || scopeType : 'Atalaia'}
                    {activeCampo ? ` • ${activeCampo.nome}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!isMobile && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
              <div className="space-y-4 min-h-[200px]">
                {messages.length === 0 && (
                  <div className="space-y-4 py-4">
                    <div className="text-center space-y-2">
                      <Sparkles className="h-10 w-10 mx-auto text-primary/40" />
                      <p className="text-sm font-medium text-foreground">Olá! Como posso ajudar?</p>
                      <p className="text-xs text-muted-foreground">
                        Pergunte sobre o sistema, métricas ou orientações pastorais.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Sugestões</p>
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(s)}
                          className="w-full text-left text-xs px-3 py-2 rounded-lg border border-border/40 hover:bg-accent/50 transition-colors text-foreground"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    <div className={cn(
                      'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted/50 border border-border/30 rounded-bl-md'
                    )}>
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 max-w-none text-xs leading-relaxed">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-xs">{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex justify-start">
                    <div className="bg-muted/50 border border-border/30 rounded-2xl rounded-bl-md px-3.5 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t border-border/40 flex gap-2 bg-background"
              style={isMobile ? { paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' } : {}}
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Digite sua dúvida..."
                className="h-10 text-sm rounded-xl"
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                disabled={isLoading}
              />
              <Button
                size="icon"
                className="h-10 w-10 shrink-0 rounded-xl"
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
