import { CheckCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineEvent {
  label: string;
  completed: boolean;
  date?: string | null;
}

interface Props {
  events: TimelineEvent[];
}

export function SpiritualTimeline({ events }: Props) {
  return (
    <div className="relative pl-6 space-y-4">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

      {events.map((event, i) => (
        <div key={i} className="relative flex items-start gap-3">
          {/* Dot */}
          <div className="absolute -left-6 mt-0.5">
            {event.completed ? (
              <CheckCircle className="h-5 w-5 text-emerald-500 fill-emerald-500/20" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground/40" />
            )}
          </div>
          <div className="min-w-0">
            <p className={cn(
              'text-sm font-medium',
              event.completed ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {event.label}
            </p>
            {event.date && (
              <p className="text-[10px] text-muted-foreground">{event.date}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
