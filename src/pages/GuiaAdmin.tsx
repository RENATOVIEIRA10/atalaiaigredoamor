import { AppLayout } from '@/components/layout/AppLayout';
import { ADMIN_PRODUCT_MAP, SCOPE_DESCRIPTIONS, ADMIN_TRAINING_SCRIPT } from '@/lib/appMap';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronRight, Map, Users, BookOpen } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function GuiaAdmin() {
  const navigate = useNavigate();

  return (
    <AppLayout title="Guia do Admin">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-lg font-bold text-foreground">Guia do Administrador</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Mapa completo do sistema, escopos e roteiro de treinamento.
          </p>
        </div>

        <Tabs defaultValue="mapa">
          <TabsList className="grid w-full grid-cols-3 h-10">
            <TabsTrigger value="mapa" className="text-xs gap-1"><Map className="h-3.5 w-3.5" />Módulos</TabsTrigger>
            <TabsTrigger value="escopos" className="text-xs gap-1"><Users className="h-3.5 w-3.5" />Escopos</TabsTrigger>
            <TabsTrigger value="treino" className="text-xs gap-1"><BookOpen className="h-3.5 w-3.5" />Treinar em 15min</TabsTrigger>
          </TabsList>

          <TabsContent value="mapa" className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground mb-3">
              Todos os módulos disponíveis no Atalaia e quais escopos os acessam.
            </p>
            {ADMIN_PRODUCT_MAP.map(mod => (
              <div
                key={mod.path}
                className="p-4 rounded-xl border border-border/50 bg-card/60 flex items-center gap-3 cursor-pointer hover:border-primary/30 transition-all group"
                onClick={() => navigate(mod.path)}
              >
                <div className="shrink-0 p-2 rounded-lg bg-primary/10 text-primary">
                  <mod.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{mod.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{mod.description}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {mod.scopes.map(s => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">{s}</span>
                    ))}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="escopos" className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground mb-3">
              O que cada papel faz dentro do Atalaia.
            </p>
            {Object.entries(SCOPE_DESCRIPTIONS).map(([key, desc]) => (
              <div key={key} className="p-4 rounded-xl border border-border/50 bg-card/60">
                <p className="text-sm font-semibold text-foreground">{desc.label}</p>
                <p className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">scope: {key}</p>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{desc.description}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="treino" className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground mb-3">
              Roteiro para apresentar o Atalaia à liderança em 15 minutos.
            </p>
            {ADMIN_TRAINING_SCRIPT.map(step => (
              <div key={step.step} className="p-4 rounded-xl border border-border/50 bg-card/60 flex gap-3">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                  {step.step}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{step.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
