import { AppLayout } from '@/components/layout/AppLayout';
import { GLOSSARY } from '@/lib/appMap';
import { cn } from '@/lib/utils';

export default function Glossario() {
  return (
    <AppLayout title="Glossário">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-lg font-bold text-foreground">Glossário do Atalaia</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Entenda cada termo usado no sistema. Sem confusão.
          </p>
        </div>

        <div className="space-y-3">
          {GLOSSARY.map((entry) => (
            <div
              key={entry.term}
              className="p-4 rounded-xl border border-border/50 bg-card/60 hover:border-border/80 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 p-2 rounded-lg bg-primary/10 text-primary">
                  <entry.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">{entry.term}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {entry.longDescription}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {entry.relatedScopes.map(scope => (
                      <span
                        key={scope}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground"
                      >
                        {scope}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
