import { useState } from 'react';
import { ChevronDown, ChevronRight, Network, FolderTree, ClipboardCheck, Home, Users, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { OrgNode as OrgNodeType } from '@/hooks/useOrganograma';

const typeConfig = {
  pastor: { icon: Crown, label: 'Pastores', badgeClass: 'bg-amber-500/20 text-amber-700 border-amber-500/40' },
  rede: { icon: Network, label: 'Rede', badgeClass: 'bg-primary/15 text-primary border-primary/30' },
  coordenacao: { icon: FolderTree, label: 'Coordenação', badgeClass: 'bg-primary/10 text-primary border-primary/20' },
  supervisor: { icon: ClipboardCheck, label: 'Supervisor', badgeClass: 'bg-accent text-accent-foreground border-border' },
  celula: { icon: Home, label: 'Célula', badgeClass: 'bg-accent text-accent-foreground border-border' },
};

interface OrgNodeProps {
  node: OrgNodeType;
  level: number;
  searchQuery: string;
}

function matchesSearch(node: OrgNodeType, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  if (node.name.toLowerCase().includes(q)) return true;
  if (node.coupleName?.toLowerCase().includes(q)) return true;
  return node.children.some(child => matchesSearch(child, q));
}

export function OrgNodeComponent({ node, level, searchQuery }: OrgNodeProps) {
  const [expanded, setExpanded] = useState(level < 2);
  const config = typeConfig[node.type];
  const Icon = config.icon;
  const hasChildren = node.children.length > 0;

  if (searchQuery && !matchesSearch(node, searchQuery)) return null;

  return (
    <div className="w-full">
      <div
        className={cn(
          "group flex items-start gap-3 p-3 rounded-xl border bg-card transition-all duration-200 cursor-pointer",
          "hover:shadow-md hover:border-primary/30",
          node.type === 'pastor' && "border-amber-500/50 shadow-md bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20",
          level === 0 && node.type !== 'pastor' && "border-primary/40 shadow-sm",
          level > 0 && node.type !== 'pastor' && "border-border/60"
        )}
        style={{ marginLeft: level > 0 ? `${Math.min(level * 16, 48)}px` : 0 }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {/* Expand/collapse */}
        <div className="flex h-6 w-6 shrink-0 items-center justify-center mt-0.5">
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform" />
            )
          ) : (
            <div className="h-4 w-4" />
          )}
        </div>

        {/* Icon */}
        <div className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          node.type === 'pastor' ? "bg-amber-500/20" : level === 0 ? "bg-primary/15" : "bg-accent"
        )}>
          <Icon className={cn("h-4 w-4", node.type === 'pastor' ? "text-amber-600" : level === 0 ? "text-primary" : "text-accent-foreground")} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 font-medium", config.badgeClass)}>
              {config.label}
            </Badge>
            {hasChildren && (
              <span className="text-[10px] text-muted-foreground">{node.children.length} {node.children.length === 1 ? 'item' : 'itens'}</span>
            )}
          </div>
          <h4 className="font-semibold text-sm text-foreground mt-0.5 truncate">{node.name}</h4>
          {node.coupleName && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Users className="h-3 w-3" />
              {node.coupleName}
            </p>
          )}
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div className="mt-1.5 space-y-1.5 relative">
          <div
            className="absolute top-0 bottom-0 border-l border-border/40"
            style={{ left: `${Math.min((level + 1) * 16, 48) + 12}px` }}
          />
          {node.children.map(child => (
            <OrgNodeComponent key={child.id} node={child} level={level + 1} searchQuery={searchQuery} />
          ))}
        </div>
      )}
    </div>
  );
}
