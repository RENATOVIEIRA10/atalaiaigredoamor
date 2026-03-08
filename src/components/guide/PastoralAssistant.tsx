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
import { useAuth } from '@/contexts/AuthContext';
import { requestUnifiedAI } from '@/services/unifiedAI';

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

  return `Você é o **Pastor Digital do Atalaia** — o assistente pastoral com IA da Igreja do Amor.

SUA IDENTIDADE:
Você fala como um pastor amoroso, próximo e paternal, inspirado no estilo do Pastor Global da Igreja do Amor.
Seu tom é: amoroso, acolhedor, espiritual, encorajador e paternal.

CONTEXTO DO USUÁRIO:
- Papel: ${scopeDesc} (nível: ${level})
- Campus ativo: ${campoNome || 'Não definido'}
- Tela atual: ${routeLabel}

REGRAS DE COMUNICAÇÃO:

1. SEMPRE comece com uma saudação pastoral calorosa. Varie entre:
   - "Graça e paz, meu lindo 💛"
   - "Graça e paz, filhão 💛"
   - "Filhona, que alegria falar com você 💛"
   - "Que bom te ver aqui, querido(a) 💛"
   - "Tô contigo nessa missão 💛"
   - "Vamos cuidar das ovelhas juntos 💛"

2. AMOR PRIMEIRO, DADOS DEPOIS. Antes de qualquer informação, demonstre cuidado.
   ❌ ERRADO: "Você tem 3 relatórios pendentes."
   ✅ CERTO: "Filhão, sua célula é preciosa demais… só falta enviar o relatório pra gente cuidar melhor de cada vida."

3. LINGUAGEM PASTORAL SIMPLES — nunca use termos técnicos ou corporativos:
   - "métricas" → "cuidado pastoral"
   - "indicadores" → "sinais da caminhada"
   - "performance" → "crescimento das vidas"
   - "dados" → "o que o coração da igreja mostra"
   - "pendências" → "ovelhas esperando cuidado"
   - "relatório" → "registro do mover de Deus"

4. NUNCA soe como cobrança. Sempre encoraje:
   - "Vamos ajustar juntos"
   - "Você não está sozinho(a)"
   - "Cada vida importa"
   - "Pequenos passos, grande obra"

5. Seja CONCISO — máximo 3 parágrafos curtos.

6. Use emojis com carinho (💛 🌱 🙏 ✨) mas sem exagero.

7. Use formatação markdown (negrito, listas).

8. Se não souber, diga com carinho: "Querido(a), ainda não tenho essa informação, mas posso te ajudar com outras coisas."

9. NUNCA invente funcionalidades que não existem no sistema.

10. Sempre sugira uma AÇÃO PRÁTICA ao final.

EXEMPLOS POR PAPEL:

Líder de Célula:
"Graça e paz, meu lindo 💛 Já disse que te amo hoje? Vi aqui que chegou uma nova vida pra sua célula. Que presente do céu! Bora fazer contato hoje e acolher com carinho?"

Coordenador:
"Filhona, que alegria ver sua coordenação crescendo 🌱 Só percebi duas células sem reunião registrada. Vamos dar aquele apoio pastoral pros líderes?"

Líder de Rede:
"Graça e paz, filhão. Sua rede é um jardim precioso. Uma célula tá precisando de cuidado mais de perto. Quer ver quem é?"

Pastor de Campo:
"Meu querido, tô vendo o mover de Deus no seu campus ✨ Algumas redes florescendo bonito. Uma delas pede mais atenção pastoral. Posso te mostrar?"

Pastor Global:
"Pastor, que honra caminhar contigo 🙏 O Reino está avançando. Dois campos crescendo forte. Um pedindo presença mais próxima. Quer um resumo pra reunião?"

GLOSSÁRIO DO SISTEMA:
${GLOSSARY.map(g => `- **${g.term}**: ${g.shortDescription}`).join('\n')}

MÓDULOS DISPONÍVEIS:
${ADMIN_PRODUCT_MAP.map(m => `- **${m.name}** (${m.path}): ${m.description}`).join('\n')}

ESCOPOS DO SISTEMA:
${Object.entries(SCOPE_DESCRIPTIONS).map(([k, v]) => `- **${v.label}** (${k}): ${v.description}`).join('\n')}

Responda SEMPRE em português brasileiro.`;
}

const SUGGESTIONS: Record<string, string[]> = {
  celula: ['O que devo fazer essa semana?', 'Chegou nova vida pra minha célula?', 'Como enviar relatório pelo WhatsApp?'],
  supervisor: ['Quais ovelhas precisam de cuidado?', 'Como registrar supervisão?', 'O que é o Radar?'],
  coordenacao: ['Alguma célula precisando de apoio?', 'Como fortalecer meus líderes?', 'O que o Pulso mostra?'],
  rede: ['Onde Deus está pedindo mais atenção?', 'Como está minha rede?', 'O que é multiplicação?'],
  pastor: ['Resumo pra reunião com líderes', 'Qual rede precisa de cuidado?', 'Como está o crescimento do campus?'],
  pastor_de_campo: ['Resumo pra reunião com líderes', 'Qual rede precisa de cuidado?', 'Como está o crescimento do campus?'],
  pastor_senior_global: ['Como o Reino está avançando?', 'Resumo executivo dos campos', 'Onde precisa de presença pastoral?'],
  admin: ['Como criar chave de acesso?', 'O que é o organograma?', 'Como funciona o sistema?'],
};

const getFirstName = (fullName?: string | null) => {
  if (!fullName) return 'querido';
  return fullName.trim().split(' ')[0] || 'querido';
};

const isLikelyFemale = (fullName?: string | null, gender?: string | null) => {
  if (gender === 'female' || gender === 'feminino') return true;
  if (!fullName) return false;
  const first = getFirstName(fullName).toLowerCase();
  return first.endsWith('a');
};

export function PastoralAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { scopeType, selectedRole } = useRole();
  const { activeCampo } = useCampo();
  const { user } = useAuth();
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

  useEffect(() => {
    if (!user || !selectedRole) return;
    const isDashboardRoute = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/home');
    if (!isDashboardRoute) return;

    const autoKey = `pastoral_auto_greeted_${user.id}`;
    if (sessionStorage.getItem(autoKey) === '1') return;

    const fullName = (user.user_metadata?.name as string | undefined)
      || (user.user_metadata?.full_name as string | undefined)
      || user.email?.split('@')[0]
      || '';

    const firstName = getFirstName(fullName);
    const female = isLikelyFemale(fullName, (user.user_metadata?.gender as string | undefined) || null);
    const saudacao = female
      ? `Graça e paz, minha filhona ${firstName} 💛`
      : `Graça e paz, meu filhão ${firstName} 💛`;

    const roleHint = SCOPE_DESCRIPTIONS[scopeType || 'celula']?.label || 'sua missão';
    const welcome = `${saudacao}

Já disse que te amo hoje?
Que alegria ter você aqui no Atalaia. Tô contigo pra cuidar das vidas que Deus colocou nas suas mãos.

Como posso te ajudar agora em **${roleHint}**?`;

    setOpen(true);
    setMessages([{ role: 'assistant', content: welcome }]);
    sessionStorage.setItem(autoKey, '1');
  }, [user, selectedRole, scopeType, location.pathname]);

  const askAI = useCallback(async (allMessages: Message[]) => {
    const systemContext = buildSystemPrompt(scopeType, activeCampo?.nome ?? null, location.pathname);
    const content = await requestUnifiedAI({
      mode: 'chatbot',
      message: allMessages[allMessages.length - 1]?.content || '',
      messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
      context: {
        systemContext,
        glossary: GLOSSARY,
        modules: ADMIN_PRODUCT_MAP,
      },
      user: {
        id: user?.id,
        name: (user?.user_metadata?.name as string | undefined) || (user?.user_metadata?.full_name as string | undefined) || null,
      },
      scope: {
        scopeType,
        roleLabel: scopeType ? SCOPE_DESCRIPTIONS[scopeType]?.label || scopeType : 'não definido',
        campus: activeCampo?.nome || null,
        route: ROUTE_LABELS[location.pathname.split('?')[0]] || location.pathname,
      },
    });

    setMessages((prev) => [...prev, { role: 'assistant', content }]);
  }, [scopeType, activeCampo, location.pathname, user]);

  const handleSend = async (text?: string) => {
    const q = (text || input).trim();
    if (!q || isLoading) return;
    setInput('');

    const userMsg: Message = { role: 'user', content: q };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setIsLoading(true);

    try {
      await askAI(allMessages);
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
                  <h3 className="text-sm font-semibold text-foreground">Pastor Digital 💛</h3>
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
                      <p className="text-sm font-medium text-foreground">Graça e paz! 💛</p>
                      <p className="text-xs text-muted-foreground">
                        Tô aqui pra te ajudar na caminhada pastoral. Pergunte o que quiser!
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
