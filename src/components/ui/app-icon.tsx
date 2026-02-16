import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { roleIcons, statusIcons, actionIcons, iconSizes, iconColors, roleLabels } from '@/lib/icons';
import { Badge } from '@/components/ui/badge';

// ========================================
// AppIcon — ícone genérico reutilizável
// ========================================
interface AppIconProps {
  icon: LucideIcon;
  size?: keyof typeof iconSizes;
  variant?: keyof typeof iconColors;
  className?: string;
}

export function AppIcon({ icon: Icon, size = 'md', variant = 'default', className }: AppIconProps) {
  return (
    <Icon
      className={cn(iconSizes[size], iconColors[variant], className)}
      strokeWidth={1.75}
    />
  );
}

// ========================================
// RoleBadge — badge com ícone por função
// ========================================
interface RoleBadgeProps {
  role: string;
  showLabel?: boolean;
  className?: string;
}

export function RoleBadge({ role, showLabel = true, className }: RoleBadgeProps) {
  const Icon = roleIcons[role];
  const label = roleLabels[role] || role;

  if (!Icon) return null;

  return (
    <Badge variant="secondary" className={cn('gap-1.5 font-medium', className)}>
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      {showLabel && <span>{label}</span>}
    </Badge>
  );
}

// ========================================
// StatusBadge — badge com ícone de status
// ========================================
interface StatusBadgeProps {
  status: 'ok' | 'warning' | 'critical' | 'inactive';
  label?: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  ok: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  critical: 'bg-destructive/10 text-destructive border-destructive/20',
  inactive: 'bg-muted text-muted-foreground border-border',
};

const statusLabels: Record<string, string> = {
  ok: 'Ativo',
  warning: 'Atenção',
  critical: 'Crítico',
  inactive: 'Inativo',
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const Icon = statusIcons[status];

  return (
    <Badge
      variant="outline"
      className={cn('gap-1.5 font-medium', statusStyles[status], className)}
    >
      {Icon && <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />}
      <span>{label || statusLabels[status]}</span>
    </Badge>
  );
}

// ========================================
// ActionIconButton — botão de ação com ícone
// ========================================
interface ActionIconButtonProps {
  action: string;
  onClick?: () => void;
  className?: string;
  title?: string;
}

export function ActionIconButton({ action, onClick, className, title }: ActionIconButtonProps) {
  const Icon = actionIcons[action];
  if (!Icon) return null;

  const variant = action === 'delete' ? 'destructive' : 'default';

  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'inline-flex items-center justify-center rounded-lg p-2 transition-colors',
        'hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        variant === 'destructive' && 'hover:bg-destructive/10 text-destructive',
        variant === 'default' && 'text-muted-foreground hover:text-foreground',
        className
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} />
    </button>
  );
}
