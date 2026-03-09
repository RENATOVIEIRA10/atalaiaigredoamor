import { LucideIcon } from 'lucide-react';

interface MissionBlockProps {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}

export function MissionBlock({ icon: Icon, title, children }: MissionBlockProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}
