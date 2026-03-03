import { LucideIcon } from 'lucide-react';

interface MissionBlockProps {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}

export function MissionBlock({ icon: Icon, title, children }: MissionBlockProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}
